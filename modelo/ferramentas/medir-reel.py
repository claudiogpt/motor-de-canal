#!/usr/bin/env python3
"""Mede um Reel 9:16 renderizado: formato, volume, silencio e area segura.

    python3 -I medir-reel.py ../conteudo/<dia>/out/reel.mp4 [...]

POR QUE ESTE ARQUIVO EXISTE. O medidor 9:16 de outubro e novembro vivia no
scratchpad de uma sessao e se perdeu. Este e a versao versionada, no mesmo
padrao do medir-longo.py: nenhum quadro entra na memoria do Python (os scripts
do projeto rodam com `python3 -I`, que nao alcanca o numpy). O ffmpeg recorta
cada faixa proibida, tira o MAXIMO DOS TRES CANAIS por pixel (blend lighten de
R, G e B) e devolve o maior valor da faixa por quadro, via signalstats.

POR QUE MAXIMO DE CANAL E NAO LUMA. O vermelho de custo da marca, #B5452F, tem
luma 101 e canal R 181. Com limiar de luma 110 ele passaria por baixo. Aqui o
limiar e 80 em qualquer canal; o fundo da marca chega a 31 e a borda de cartao
(#2A2621) a 42, entao nenhum dos dois conta como conteudo.

DUAS REGUAS PARA DUAS ALTURAS. No meio do quadro (y 150 a 1280) vale a coluna
central, borda direita x=934. No terco de baixo (y 1280 a 1480) ficam os icones
do Instagram, e o limite cai para x=860. Medir a faixa do meio contra a regua
de baixo ja produziu relatorio falso de estouro. Cada faixa usa a sua.
"""
from __future__ import annotations

import json
import re
import subprocess
import sys

LIMIAR = 80
AMOSTRAS_POR_SEGUNDO = 3

# nome: (x, y, largura, altura) em 1080x1920. Tudo aqui deve ficar vazio.
FAIXAS = {
    "direita do meio (x>934, y 150-1280)": (934, 150, 146, 1130),
    "direita de baixo (x>860, y 1280-1480)": (860, 1280, 220, 200),
    "base (y>1480)": (0, 1480, 1080, 440),
    "esquerda (x<72)": (0, 150, 72, 1330),
}


def rodar(args: list[str]) -> str:
    r = subprocess.run(args, capture_output=True, text=True)
    return r.stdout + r.stderr


def formato(video: str) -> dict:
    s = rodar(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
               "stream=width,height:format=duration", "-of", "json", video])
    d = json.loads(s)
    return {"largura": d["streams"][0]["width"], "altura": d["streams"][0]["height"],
            "duracao": float(d["format"]["duration"])}


def volume(video: str) -> dict:
    s = rodar(["ffmpeg", "-hide_banner", "-i", video, "-af",
               "loudnorm=I=-14:TP=-1:print_format=json", "-f", "null", "-"])
    bloco = s[s.rindex("{"): s.rindex("}") + 1]
    d = json.loads(bloco)
    return {"lufs": float(d["input_i"]), "pico": float(d["input_tp"])}


def silencios(video: str) -> list[float]:
    s = rodar(["ffmpeg", "-hide_banner", "-i", video, "-af",
               "silencedetect=noise=-40dB:d=0.5", "-f", "null", "-"])
    return [float(x) for x in re.findall(r"silence_duration: ([\d.]+)", s)]


def faixa(video: str, x: int, y: int, w: int, h: int) -> tuple[int, int, list[float]]:
    """(quadros amostrados, maior valor, instantes acima do limiar)."""
    filtro = (
        f"fps={AMOSTRAS_POR_SEGUNDO},crop={w}:{h}:{x}:{y},format=gbrp,"
        "extractplanes=g+b+r[g][b][r];[g][b]blend=all_mode=lighten[gb];"
        "[gb][r]blend=all_mode=lighten,signalstats,"
        "metadata=print:key=lavfi.signalstats.YMAX:file=-"
    )
    s = rodar(["ffmpeg", "-hide_banner", "-v", "error", "-i", video, "-filter_complex", filtro,
               "-f", "null", "-"])
    tempos = [float(t) for t in re.findall(r"pts_time:([\d.]+)", s)]
    maximos = [int(float(v)) for v in re.findall(r"YMAX=([\d.]+)", s)]
    acima = [t for t, m in zip(tempos, maximos) if m > LIMIAR]
    return len(maximos), max(maximos, default=0), acima


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__.strip().splitlines()[2].strip(), file=sys.stderr)
        return 2
    ok = True
    for video in sys.argv[1:]:
        f = formato(video)
        v = volume(video)
        sil = silencios(video)
        print(f"\n{video}")
        # Video sem som: narrado pelo adaptador 'estimativa'. O layout e o tempo
        # valem, o audio nao existe. Dizer isso em vez de imprimir "-inf LUFS" e
        # deixar quem le concluir que o volume ficou errado.
        mudo = v["lufs"] < -70
        if mudo:
            print(f"  {f['largura']}x{f['altura']}  {f['duracao']:.2f} s  "
                  f"SEM SOM (adaptador 'estimativa')")
            print("  Layout e tempo valem. Para publicar, narre com uma voz de")
            print("  verdade: --adaptador kokoro.")
        else:
            print(f"  {f['largura']}x{f['altura']}  {f['duracao']:.2f} s  "
                  f"{v['lufs']:.2f} LUFS  pico {v['pico']:.2f} dBTP  "
                  f"silencios > 0,5 s: {len(sil)}")
        if (f["largura"], f["altura"]) != (1080, 1920):
            ok = False
        if not mudo and (len(sil) or not -15.5 <= v["lufs"] <= -14.0
                         or v["pico"] > -1.0):
            ok = False
        total = 0
        for nome, (x, y, w, h) in FAIXAS.items():
            n, mx, acima = faixa(video, x, y, w, h)
            total = max(total, n)
            marca = "ok" if not acima else f"ESTOURO em {len(acima)} quadros, ex. {acima[:3]}"
            print(f"  {nome:40} max {mx:3d}  {marca}")
            ok = ok and not acima
        print(f"  quadros amostrados por faixa: {total}")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
