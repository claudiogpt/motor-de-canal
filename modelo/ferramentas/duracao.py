#!/usr/bin/env python3
"""Quanto tempo uma fala vai durar, antes de gerar o áudio.

    python3 -I ferramentas/duracao.py conteudo/<dia>

PARA QUE SERVE. Dimensionar o roteiro antes de gastar GPU. Um vídeo longo foi
escrito para 15:07 e saiu com 12:58, 14% a menos, e só se descobriu depois de
narrar os 13 minutos.

O MODELO, e por que não é "palavras por minuto".

    segundos de fala = palavras / 191 + 0,415 * batidas

A primeira versão era uma taxa única: palavras divididas pela duração total dos
blocos, o que deu 153,1 ppm. Essa conta mistura duas coisas diferentes:

  1. o ritmo em que o modelo fala, que é a taxa de verdade;
  2. o silêncio de borda que CADA arquivo wav carrega, fixo por arquivo.

Numa batida de 3 segundos essa borda é uma fração enorme do total; numa de 7,6
segundos quase não aparece. Então a taxa aparente cai conforme as batidas ficam
curtas, e uma taxa única calibrada em Reels subestima um vídeo longo (e
vice-versa).

Separando os dois termos, o erro no vídeo longo caiu de 14% para 0,8%.

AJUSTADO EM: 16 vídeos narrados com Kokoro pt-BR, voz pm_santa, velocidade 1,0.
Outro motor ou outra velocidade pede reajuste: rode este arquivo com --ajustar
apontando para pastas que já tenham audio/tempos.json.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from texto_ptbr import contar_palavras, spoken_ptbr  # noqa: E402

PPM = 191.0
"""Palavras por minuto de fala limpa, sem a borda de silêncio."""

BORDA_POR_BATIDA = 0.415
"""Segundos de borda que cada arquivo wav carrega, independente do texto."""

RESPIRO_BATIDA = 0.12
"""Respiro entre batidas. É ritmo, não sobra: acima de meio segundo trava."""

RESPIRO_BLOCO = 0.30


def segundos_de_fala(texto: str, batidas: int = 1) -> float:
    palavras = contar_palavras(spoken_ptbr(texto))
    return palavras / PPM * 60 + BORDA_POR_BATIDA * batidas


def estimar(reel: dict) -> dict:
    """Duração estimada por bloco e total, no mesmo formato do tempos.json."""
    blocos = []
    for bi, bloco in enumerate(reel["blocos"], 1):
        falas = [
            (f.get("fala") if isinstance(f, dict) else f) or ""
            for f in bloco.get("falas", [])
        ]
        falas = [f for f in falas if f.strip()]
        if not falas:
            continue
        dur = sum(segundos_de_fala(f) for f in falas)
        dur += RESPIRO_BATIDA * (len(falas) - 1) + RESPIRO_BLOCO
        blocos.append({
            "bloco": bi,
            "tipo": bloco["tipo"],
            "duracao": round(dur, 3),
            "batidas": len(falas),
            "palavras": sum(contar_palavras(spoken_ptbr(f)) for f in falas),
        })
    return {
        "total": round(sum(b["duracao"] for b in blocos), 3),
        "batidas": sum(b["batidas"] for b in blocos),
        "palavras": sum(b["palavras"] for b in blocos),
        "blocos": blocos,
    }


def _ajustar(pastas: list[Path]) -> None:
    """Reajusta PPM e BORDA_POR_BATIDA por mínimos quadrados sobre tempos.json."""
    pontos = []
    for p in pastas:
        tj = p / "audio" / "tempos.json"
        if not tj.is_file():
            continue
        t = json.loads(tj.read_text(encoding="utf-8"))
        for b in t["blocos"]:
            for batida in b["batidas"]:
                pontos.append((contar_palavras(batida["fala"]), batida["duracao"]))
    if len(pontos) < 10:
        print(f"só {len(pontos)} batidas; preciso de mais para ajustar")
        return
    # duracao = palavras * a + b, com a = 60/PPM
    n = len(pontos)
    sx = sum(p for p, _ in pontos); sy = sum(d for _, d in pontos)
    sxx = sum(p * p for p, _ in pontos); sxy = sum(p * d for p, d in pontos)
    a = (n * sxy - sx * sy) / (n * sxx - sx * sx)
    b = (sy - a * sx) / n
    erros = [abs(a * p + b - d) for p, d in pontos]
    print(f"{n} batidas de {len(pastas)} pastas")
    print(f"  PPM              = {60 / a:.1f}   (está {PPM})")
    print(f"  BORDA_POR_BATIDA = {b:.3f}  (está {BORDA_POR_BATIDA})")
    print(f"  erro médio por batida: {sum(erros) / n:.3f}s")


def main() -> int:
    args = sys.argv[1:]
    if not args:
        print(__doc__)
        return 1
    if args[0] == "--ajustar":
        _ajustar([Path(a) for a in args[1:]])
        return 0
    dia = Path(args[0]).resolve()
    fonte = next((f for f in ("reel.json", "longo.json", "historia.json")
                  if (dia / f).is_file()), None)
    if fonte is None:
        print(f"nenhum reel.json, longo.json ou historia.json em {dia}")
        return 1
    e = estimar(json.loads((dia / fonte).read_text(encoding="utf-8")))
    for b in e["blocos"]:
        print(f"  bloco {b['bloco']:2} {b['tipo']:12} {b['duracao']:6.2f}s  "
              f"{b['batidas']:2} batidas  {b['palavras']:3} palavras")
    m, s = divmod(e["total"], 60)
    print(f"\n  estimado: {e['total']:.1f}s ({int(m)}:{s:04.1f})  "
          f"{e['batidas']} batidas, {e['palavras']} palavras")
    print("  margem de erro do modelo: ~1%. Não é medição: o audio manda.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
