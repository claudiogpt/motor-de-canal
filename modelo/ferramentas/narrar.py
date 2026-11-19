#!/usr/bin/env python3
"""Narra um vídeo em batidas e MEDE cada uma. É o coração do sistema.

    python3 -I ferramentas/narrar.py conteudo/<dia>
    python3 -I ferramentas/narrar.py conteudo/<dia> --so-texto

POR QUE ISTO EXISTE, E POR QUE NÃO É UM DETALHE DE IMPLEMENTAÇÃO.

A primeira versão deste sistema declarava `duracaoSegundos` por bloco, digitado
à mão, e gerava a voz depois, por outro script, grudando o áudio no vídeo
pronto. Os dois nunca se encontravam. Medido em nove vídeos: 76,6 segundos de
tela parada sem ninguém falando, 18% da semana, 30% no pior deles, e a legenda
sempre adiantada em relação à voz.

O conserto não foi um ajuste, foi inversão de quem manda:

    reel.json declara `falas` por bloco e NENHUMA duração
         ↓
    este arquivo gera UM áudio POR FALA e mede cada um
         ↓
    audio/tempos.json guarda a duração real
         ↓
    o Remotion lê isso, deriva a duração de cada bloco da soma das suas
    batidas, e põe cada <Audio> na própria linha de tempo

NÃO EXISTE PASSO DE MUX DEPOIS DO RENDER. Por isso não existe como a voz e a
tela saírem de sincronia: não há dois relógios para divergir, há um.

O render recusa rodar sem tempos.json, de propósito.

VOLUME. Instagram e YouTube normalizam para perto de −14 LUFS. Quem entrega
mais alto é abaixado; quem entrega mais baixo NÃO é levantado, só soa fraco no
feed ao lado dos outros. O Kokoro devolve perto de −22. Então normalizamos
aqui, com GANHO ÚNICO para todas as batidas: loudnorm por batida achataria a
dinâmica entre falas, deixando a narração monótona.

ARMADILHA DO FFMPEG, e ela é silenciosa: o `alimiter` tem `level` ligado por
padrão, que renormaliza a saída para 0 dB e anula o teto que você acabou de
pedir. Precisa de `level=disabled`.
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(RAIZ / "ferramentas"))

from duracao import RESPIRO_BATIDA, RESPIRO_BLOCO  # noqa: E402
from texto_ptbr import contar_palavras, spoken_ptbr  # noqa: E402

PAUSA = 0.3
"""Teto de pausa interna, em segundos, ao apertar o silêncio."""


# ── ffmpeg ──────────────────────────────────────────────────────────────────

def _ffmpeg(*args: str) -> None:
    subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", *args],
                   check=True)


def _duracao(p: Path) -> float:
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries",
                        "format=duration", "-of", "csv=p=0", str(p)],
                       capture_output=True, text=True, check=True)
    bruto = r.stdout.strip()
    if not bruto or bruto == "N/A":
        raise SystemExit(
            f"{p.name} não tem duração legível. O arquivo ficou vazio.\n"
            "Causa quase certa: apertar() cortou tudo. Um adaptador cuja saída\n"
            "já tem o tamanho exato (ou que não tem som) precisa declarar\n"
            "APARAR = False no módulo. Veja adaptadores/tts/INTERFACE.md."
        )
    return float(bruto)


def _lufs(p: Path) -> float:
    """LUFS integrado, pela análise do loudnorm."""
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(p), "-af",
                        "loudnorm=print_format=json", "-f", "null", "-"],
                       capture_output=True, text=True)
    bruto = r.stderr[r.stderr.rfind("{"):r.stderr.rfind("}") + 1]
    return float(json.loads(bruto)["input_i"])


def apertar(src: Path, dst: Path, pausa: float = PAUSA) -> None:
    """Corta o silêncio das bordas e limita cada pausa interna.

    TODO motor de TTS deixa borda, e cada um deixa um tamanho diferente. Sem
    isto, o respiro entre batidas vira respiro mais borda, e o vídeo arrasta.
    """
    _ffmpeg("-i", str(src), "-af",
            "silenceremove=start_periods=1:start_threshold=-40dB:"
            f"stop_periods=-1:stop_duration={pausa}:stop_threshold=-40dB:"
            f"stop_silence={pausa},"
            "areverse,silenceremove=start_periods=1:start_threshold=-40dB,areverse",
            "-ar", "48000", str(dst))


def _tem_rubberband() -> bool:
    r = subprocess.run(["ffmpeg", "-hide_banner", "-filters"],
                       capture_output=True, text=True)
    return "rubberband" in r.stdout


def acelerar(src: Path, dst: Path, fator: float) -> None:
    if abs(fator - 1.0) < 1e-3:
        shutil.copy(src, dst)
        return
    af = (f"rubberband=tempo={fator:.4f}:pitch=1:pitchq=quality"
          if _tem_rubberband() else f"atempo={fator:.4f}")
    _ffmpeg("-i", str(src), "-af", af, "-ar", "48000", str(dst))


def normalizar(arquivos: list[Path], alvo: float, teto: float) -> float:
    """Leva o conjunto ao alvo de LUFS com UM ganho para todos. Devolve o ganho.

    Ganho único e não loudnorm por arquivo: a diferença de volume ENTRE falas é
    interpretação, e achatá-la deixa a narração robótica.
    """
    medidos = [_lufs(p) for p in arquivos]
    uteis = [m for m in medidos if m > -70]
    if not uteis:
        # Áudio sem som (adaptador 'estimativa'): não há o que normalizar, e
        # calcular ganho sobre -inf daria nan, que contaminaria o wav.
        return 0.0
    atual = sum(uteis) / len(uteis)
    ganho = alvo - atual
    for p in arquivos:
        tmp = p.with_suffix(".norm.wav")
        # level=disabled: sem isso o alimiter renormaliza para 0 dB e o teto
        # que pedimos acima deixa de existir.
        _ffmpeg("-i", str(p), "-af",
                f"volume={ganho:.2f}dB,alimiter=limit={teto}dB:level=disabled",
                "-ar", "48000", str(tmp))
        tmp.replace(p)
    return ganho


# ── adaptador ───────────────────────────────────────────────────────────────

def carregar_adaptador(nome: str):
    """Importa adaptadores/tts/<nome>.py e devolve sua função sintetizar."""
    caminho = RAIZ / "adaptadores" / "tts" / f"{nome}.py"
    if not caminho.is_file():
        disponiveis = sorted(
            p.stem for p in (RAIZ / "adaptadores" / "tts").glob("*.py")
            if not p.stem.startswith("_")
        )
        raise SystemExit(
            f"adaptador de voz '{nome}' não existe.\n"
            f"disponíveis: {', '.join(disponiveis)}\n"
            f"o contrato está em adaptadores/tts/INTERFACE.md"
        )
    spec = importlib.util.spec_from_file_location(f"tts_{nome}", caminho)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    if not hasattr(mod, "sintetizar"):
        raise SystemExit(f"{caminho} não expõe sintetizar(). Veja INTERFACE.md")
    return mod


# ── batidas ─────────────────────────────────────────────────────────────────

def batidas_do_json(doc: dict) -> list[tuple[int, int, str]]:
    """(bloco, batida, texto falado) na ordem da tela.

    Recusa o formato antigo de propósito: um bloco sem `falas` não tem de onde
    tirar o tempo, e aceitar silenciosamente traria de volta a duração digitada
    à mão, que é justamente o defeito que este sistema existe para não ter.
    """
    saida = []
    for bi, bloco in enumerate(doc["blocos"], 1):
        falas = bloco.get("falas")
        if not falas:
            raise SystemExit(
                f"bloco {bi} ({bloco.get('tipo')}) não tem 'falas'.\n"
                "Este formato pede uma lista de falas por bloco, não um texto\n"
                "único com duração digitada. Veja doutrina/arquitetura-de-tempo."
            )
        for fi, fala in enumerate(falas):
            if isinstance(fala, dict):
                # falaLiteral ganha da conversão automática: serve para quando
                # "Cruzado II" viraria "Cruzado Dois".
                texto = fala.get("falaLiteral") or fala.get("fala") or ""
                literal = bool(fala.get("falaLiteral"))
            else:
                texto, literal = fala, False
            if not texto.strip():
                continue
            saida.append((bi, fi, texto if literal else spoken_ptbr(texto)))
    return saida


def main() -> int:
    ap = argparse.ArgumentParser(description="Narra em batidas e mede cada uma.")
    ap.add_argument("dia", type=Path, help="pasta do vídeo")
    ap.add_argument("--adaptador", help="sobrepõe o de canal.json")
    ap.add_argument("--so-texto", action="store_true",
                    help="mostra o que seria falado e a duração estimada, sem gerar")
    a = ap.parse_args()

    dia = a.dia.resolve()
    fonte = next((f for f in ("reel.json", "longo.json", "historia.json")
                  if (dia / f).is_file()), None)
    if fonte is None:
        raise SystemExit(f"nenhum reel.json, longo.json ou historia.json em {dia}")
    doc = json.loads((dia / fonte).read_text(encoding="utf-8"))
    batidas = batidas_do_json(doc)

    canal = json.loads((RAIZ / "canal.json").read_text(encoding="utf-8"))
    marca = json.loads((RAIZ / "marca" / "marca.json").read_text(encoding="utf-8"))
    nome = a.adaptador or canal["adaptadores"]["tts"]
    voz = marca["voz"]

    if a.so_texto:
        from duracao import estimar
        for bi, fi, texto in batidas:
            print(f"  bloco {bi} batida {fi}: {texto}")
        e = estimar(doc)
        print(f"\n  {e['batidas']} batidas, {e['palavras']} palavras, "
              f"estimado {e['total']:.1f}s")
        return 0

    audio = dia / "audio"
    audio.mkdir(exist_ok=True)
    tmp = Path(tempfile.mkdtemp(prefix="batidas_"))

    adaptador = carregar_adaptador(nome)
    print(f"voz: adaptador '{nome}', {len(batidas)} batidas")
    crus = adaptador.sintetizar([t for _, _, t in batidas], voz.get(nome, {}), tmp)
    if len(crus) != len(batidas):
        raise SystemExit(f"o adaptador devolveu {len(crus)} arquivos para "
                         f"{len(batidas)} batidas")

    # Só agora apaga o antigo: se a geração falhar, o áudio bom continua no lugar.
    for antigo in audio.glob("*.wav"):
        antigo.unlink()

    aceleracao = voz.get(nome, {}).get("aceleracao", 1.0)
    # Um adaptador cuja saída já tem o tamanho exato declara APARAR = False.
    # Aparar silêncio de um arquivo silencioso apaga o arquivo inteiro, e o
    # erro aparece bem longe daqui, no ffprobe.
    aparar = getattr(adaptador, "APARAR", True)
    registro = []
    for (bi, fi, texto), cru in zip(batidas, crus):
        apertado = tmp / f"{bi:02d}-{fi:02d}.tight.wav"
        if aparar:
            apertar(cru, apertado)
        else:
            shutil.copy(cru, apertado)
        destino = audio / f"b{bi:02d}-{fi:02d}.wav"
        acelerar(apertado, destino, aceleracao)
        registro.append({"bloco": bi, "batida": fi,
                         "arquivo": str(destino.relative_to(dia)),
                         "_p": destino, "fala": texto})

    # Volume ANTES de medir: o limitador pode aparar alguns milissegundos.
    ganho = normalizar([r["_p"] for r in registro],
                       marca["voz"]["alvoLUFS"], marca["voz"]["tetoDBTP"])
    for r in registro:
        d = _duracao(r["_p"])
        r["duracao"] = round(d, 3)
        r["wpm"] = round(contar_palavras(r["fala"]) / d * 60) if d else 0
        del r["_p"]

    blocos = []
    for bi, bloco in enumerate(doc["blocos"], 1):
        minhas = [r for r in registro if r["bloco"] == bi]
        if not minhas:
            continue
        inicios, t = [], 0.0
        for r in minhas:
            inicios.append(round(t, 3))
            t += r["duracao"] + RESPIRO_BATIDA
        t = t - RESPIRO_BATIDA + RESPIRO_BLOCO
        blocos.append({"bloco": bi, "tipo": bloco["tipo"], "duracao": round(t, 3),
                       "batidas": [{**r, "inicio": i}
                                   for r, i in zip(minhas, inicios)]})

    total = sum(b["duracao"] for b in blocos)
    (audio / "tempos.json").write_text(json.dumps({
        "fps": doc.get("fps", 30),
        "adaptador": nome,
        "voz": voz.get(nome, {}),
        "ganho_db": round(ganho, 2),
        "alvo_lufs": marca["voz"]["alvoLUFS"],
        "respiro_batida": RESPIRO_BATIDA,
        "respiro_bloco": RESPIRO_BLOCO,
        "total": round(total, 3),
        "blocos": blocos,
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    falado = sum(r["duracao"] for r in registro)
    print()
    for b in blocos:
        print(f"  bloco {b['bloco']:2} {b['tipo']:12} {b['duracao']:6.2f}s "
              f"({len(b['batidas'])} batidas)")
    ar = 100 * (total - falado) / total
    print(f"\n  total {total:.2f}s, {falado:.2f}s de fala, "
          f"{total - falado:.2f}s de respiro ({ar:.0f}%)")
    if ar > 15:
        print("  ATENÇÃO: acima de 15% de respiro o vídeo arrasta. "
              "Corte fala ou junte batidas.")
    print(f"  ganho aplicado: {ganho:+.1f} dB")
    print(f"  {audio / 'tempos.json'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
