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
import pathlib
import sys

LIMIAR = 80
AMOSTRAS_POR_SEGUNDO = 3

# A REGUA VEM DO ARQUIVO DA PLATAFORMA, NAO DAQUI.
#
# Estes numeros ja existiram em dois lugares, e os dois divergiram em silencio:
# uma margem renderizou 40 px maior do que a marca pedia, e numa transcricao a
# margem lateral do 16:9 virou 120 contra os 112 medidos. Medidor com regua
# propria e pior que nao medir, porque da confianca errada.
_P = pathlib.Path(__file__).resolve().parents[1] / "plataformas"
_PLAT = lambda n: json.loads((_P / f"{n}.json").read_text(encoding="utf-8"))

_R = _PLAT("instagram")["reel"]
_W, _H = _R["largura"], _R["altura"]
_S = _R["areaSegura"]
_COL = _W - _R["colunaCentral"]["direita"]      # 934: borda da coluna central
_ICO = _R["faixaDeIcones"]["limiteDireita"]     # 860: onde os icones comecam
_Y = _R["faixaDeIcones"]["aPartirDeY"]          # 1280
_BASE = _H - _S["base"]                         # 1480

# nome: (x, y, largura, altura). Tudo aqui deve ficar vazio.
#
# DUAS REGUAS PARA DUAS ALTURAS, e e a armadilha que mais voltou: os icones do
# Instagram ocupam a faixa direita SO no terco de baixo. Medir uma faixa com a
# regua da outra ja produziu relatorio falso de estouro E deixou passar estouro
# real de 73 px, tres vezes.
FAIXAS = {
    f"direita do meio (x>{_COL}, y {_S['topo']}-{_Y})":
        (_COL, _S["topo"], _W - _COL, _Y - _S["topo"]),
    f"direita de baixo (x>{_ICO}, y {_Y}-{_BASE})":
        (_ICO, _Y, _W - _ICO, _BASE - _Y),
    f"base (y>{_BASE})": (0, _BASE, _W, _H - _BASE),
    f"esquerda (x<{_S['esquerda']})":
        (0, _S["topo"], _S["esquerda"], _BASE - _S["topo"]),
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
