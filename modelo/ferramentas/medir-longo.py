#!/usr/bin/env python3
"""Mede um video longo 16:9 renderizado: duracao, volume, silencio e area segura.

   python3 medir-longo.py ../conteudo/longos/<video>/out/longo.mp4

A regua aqui NAO e a do Instagram. Em 16:9 no YouTube o que invade o quadro e
a barra de controle do player embaixo e o cartao de fim de tela. Os limites
vem de src/longo/marca16x9.ts e estao repetidos abaixo de proposito, para o
medidor nao depender de parsear TypeScript. Se a marca mudar, mude aqui.

COMO A AREA SEGURA E MEDIDA, E POR QUE ASSIM. Em vez de varrer pixel em
Python, o medidor recorta cada uma das quatro faixas proibidas e pede ao
ffmpeg o brilho maximo de cada quadro, por `signalstats`. Se o maximo de uma
faixa passa do limiar, tem conteudo onde nao devia.

Duas versoes anteriores falharam e vale registrar as duas:

1. Varredura em Python com subprocess.run(capture_output=True) sobre o video
   cru. Isso tenta guardar o filme inteiro descomprimido: 23.350 quadros de
   1920x1080 sao 48 GB, e o processo foi morto numa maquina de 15 GB. Video
   cru nunca cabe em buffer.
2. Leitura em fluxo com numpy. Funciona, mas o numpy esta no site-packages do
   usuario, fora do alcance de `python3 -I`, que e como os scripts do projeto
   rodam. Dependencia que some sob isolamento nao serve.

A versao atual nao carrega quadro nenhum na memoria do Python e nao depende de
nada alem do ffmpeg, que o projeto ja exige.

O fundo da marca tem brilho dourado e grade fina, entao o limiar precisa ficar
acima do que eles alcancam: a grade vai a ~42 e o brilho de ouro a ~95.
"""

import json
import re
import subprocess
import sys
import pathlib


# A REGUA VEM DO ARQUIVO DA PLATAFORMA, NAO DAQUI.
#
# Estes numeros ja existiram em dois lugares, e os dois divergiram em silencio:
# uma margem renderizou 40 px maior do que a marca pedia, e numa transcricao a
# margem lateral do 16:9 virou 120 contra os 112 medidos. Medidor com regua
# propria e pior que nao medir, porque da confianca errada.
_P = pathlib.Path(__file__).resolve().parents[1] / "plataformas"
_PLAT = lambda n: json.loads((_P / f"{n}.json").read_text(encoding="utf-8"))

_L = _PLAT("youtube")["longo"]
SEGURO = {"top": _L["areaSegura"]["topo"], "bottom": _L["areaSegura"]["base"],
          "left": _L["areaSegura"]["esquerda"], "right": _L["areaSegura"]["direita"]}
Q = (_L["largura"], _L["altura"])
LIMIAR = 110
FPS_AMOSTRA = 3


def sh(*a: str) -> str:
    return subprocess.run(a, capture_output=True, text=True).stderr


def ffprobe(mp4: str) -> dict:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0",
         "-show_entries", "stream=width,height,r_frame_rate",
         "-show_entries", "format=duration", "-of", "json", mp4],
        capture_output=True, text=True).stdout
    d = json.loads(out)
    s = d["streams"][0]
    return {"w": s["width"], "h": s["height"], "fps": s["r_frame_rate"],
            "dur": float(d["format"]["duration"])}


def volume(mp4: str) -> tuple[float, float]:
    err = sh("ffmpeg", "-i", mp4, "-af", "loudnorm=print_format=json", "-f", "null", "-")
    bloco = err[err.rfind("{"):err.rfind("}") + 1]
    j = json.loads(bloco)
    return float(j["input_i"]), float(j["input_tp"])


def silencios(mp4: str, minimo: float = 0.5) -> list[tuple[float, float]]:
    err = sh("ffmpeg", "-i", mp4, "-af", f"silencedetect=n=-45dB:d={minimo}", "-f", "null", "-")
    ini = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", err)]
    fim = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", err)]
    return list(zip(ini, fim))


def faixa(mp4: str, crop: str) -> list[float]:
    """Brilho maximo de cada quadro amostrado, dentro do recorte dado."""
    err = sh("ffmpeg", "-i", mp4, "-vf",
             f"fps={FPS_AMOSTRA},crop={crop},format=gray,signalstats,"
             "metadata=print:key=lavfi.signalstats.YMAX",
             "-f", "null", "-")
    return [float(x) for x in re.findall(r"lavfi\.signalstats\.YMAX=([\d.]+)", err)]


def area_segura(mp4: str) -> tuple[dict, int]:
    larg, alt = Q
    bandas = {
        "esquerda": f"{SEGURO['left']}:{alt}:0:0",
        "direita": f"{SEGURO['right']}:{alt}:{larg - SEGURO['right']}:0",
        "topo": f"{larg}:{SEGURO['top']}:0:0",
        "base": f"{larg}:{SEGURO['bottom']}:0:{alt - SEGURO['bottom']}",
    }
    achados, n = {}, 0
    for nome, crop in bandas.items():
        ymax = faixa(mp4, crop)
        n = max(n, len(ymax))
        maus = [(i / FPS_AMOSTRA, v) for i, v in enumerate(ymax) if v >= LIMIAR]
        if maus:
            achados[nome] = maus
    return achados, n


def main() -> None:
    mp4 = sys.argv[1]
    if not pathlib.Path(mp4).is_file():
        raise SystemExit(f"nao existe: {mp4}")
    v = ffprobe(mp4)
    print(f"resolucao : {v['w']}x{v['h']} a {v['fps']} fps")
    print(f"duracao   : {v['dur']:.1f} s  ({int(v['dur']//60)}:{int(v['dur']%60):02d})")
    i, tp = volume(mp4)
    # Video sem som: narrado pelo adaptador 'estimativa'. Dizer isso, em vez de
    # imprimir "-inf LUFS FORA DO ALVO" e deixar quem le concluir que o volume
    # saiu errado quando na verdade nao existe audio ainda.
    mudo = i < -70
    if mudo:
        print("volume    : SEM SOM (adaptador 'estimativa'). Layout e tempo "
              "valem; para publicar, narre com voz de verdade.")
        ok_vol = True
    else:
        ok_vol = -15.6 <= i <= -13.5 and tp <= -1.0
        print(f"volume    : {i:.2f} LUFS, pico real {tp:.2f} dBTP   "
              f"{'ok' if ok_vol else 'FORA DO ALVO'}")
    sil = [] if mudo else silencios(mp4)
    print(f"silencio  : {len(sil)} trecho(s) acima de 0,5 s"
          + ("" if not sil else "  " + ", ".join(f"{a:.1f}-{b:.1f}s" for a, b in sil[:6])))
    achados, n = area_segura(mp4)
    if achados:
        print(f"area segura: ESTOURO em {n} quadros amostrados")
        for nome, maus in achados.items():
            t0 = ", ".join(f"{t:.1f}s" for t, _ in maus[:8])
            print(f"   faixa {nome}: {len(maus)} quadro(s), brilho ate "
                  f"{max(v for _, v in maus):.0f}  em {t0}")
    else:
        print(f"area segura: zero estouro em {n} quadros amostrados "
              f"(4 faixas, limiar {LIMIAR})")


if __name__ == "__main__":
    main()
