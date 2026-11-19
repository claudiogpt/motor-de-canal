#!/usr/bin/env python3
"""Mede os PNG de um carrossel: dimensao, peso, margem e o recorte da grade.

    python3 medir-carrossel.py ../conteudo/2026-11-10-salario-62-por-cento

A regua esta em src/carrossel/marca45.ts e esta repetida aqui de proposito,
pelo mesmo motivo do medir-longo.py: o medidor nao deve depender de parsear
TypeScript. Se a marca mudar, mude aqui tambem.

COMO A AREA SEGURA E MEDIDA, E POR QUE POR CANAL RGB.

O medidor recorta cada faixa proibida e pede ao ffmpeg o maximo de cada canal
de cor, por `signalstats` sobre `extractplanes`. Nenhum pixel entra na memoria
do Python: os scripts do projeto rodam com `python3 -I`, que nao alcanca o
site-packages do usuario, e foi exatamente isso que inviabilizou a versao em
numpy do medidor 16:9.

Por canal, e nao por luma, porque o vermelho tijolo da marca (#B5452F) tem luma
101 e passaria por baixo de um limiar de 110, embora o canal R dele seja 181.
Medido, nao suposto.

DUAS REGUAS, PORQUE O CARROSSEL APARECE EM DOIS LUGARES.

  - MARGEM, em todo slide: o respiro do formato.
  - QUADRADO, so no slide 1: a grade do perfil recorta o 4:5 para um bloco mais
    quadrado, e a grade e onde a conversao acontece. O que estiver fora do
    quadrado central nao existe para quem olha o perfil.
"""

import json
import pathlib
import re
import subprocess
import sys

Q = (1080, 1350)
MARGEM = {"topo": 96, "base": 96, "lado": 84}
QUADRADO = {"topo": (Q[1] - Q[0]) // 2, "base": Q[1] - (Q[1] - Q[0]) // 2}
LIMIAR = 80
PESO_MAX = 8 * 1024 * 1024          # limite do Instagram por imagem
SLIDES_MIN, SLIDES_MAX = 2, 10      # limite do Instagram por carrossel


def maximo_canais(png: str, x: int, y: int, w: int, h: int) -> dict:
    """Maior valor de cada canal RGB dentro do recorte."""
    out = {}
    for canal in ("r", "g", "b"):
        # -v error silenciaria o metadata=print, que sai no log em nivel info.
        p = subprocess.run(
            ["ffmpeg", "-i", png, "-vf",
             f"crop={w}:{h}:{x}:{y},format=rgb24,extractplanes={canal},"
             "signalstats,metadata=print:key=lavfi.signalstats.YMAX",
             "-f", "null", "-"],
            capture_output=True, text=True)
        m = re.findall(r"YMAX=([0-9.]+)", p.stderr)
        out[canal] = float(m[-1]) if m else -1.0
    return out


def faixas_margem() -> list:
    w, h = Q
    return [
        ("topo", 0, 0, w, MARGEM["topo"]),
        ("base", 0, h - MARGEM["base"], w, MARGEM["base"]),
        ("esquerda", 0, 0, MARGEM["lado"], h),
        ("direita", w - MARGEM["lado"], 0, MARGEM["lado"], h),
    ]


def faixas_grade() -> list:
    """O que a grade do perfil corta do slide 1. Largura inteira."""
    w = Q[0]
    return [
        ("cortado no topo", 0, 0, w, QUADRADO["topo"]),
        ("cortado na base", 0, QUADRADO["base"], w, Q[1] - QUADRADO["base"]),
    ]


def dimensao(png: str) -> tuple:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0",
         "-show_entries", "stream=width,height", "-of", "json", png],
        capture_output=True, text=True).stdout
    s = json.loads(out)["streams"][0]
    return (s["width"], s["height"])


def main() -> int:
    pasta = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ".")
    dados = json.loads((pasta / "carrossel.json").read_text(encoding="utf-8"))
    pngs = sorted((pasta / "out").glob("slide-*.png"))

    print(f"carrossel: {dados['slug']}")
    print(f"serie: {dados['serie']}")
    if dados.get("deriva"):
        print(f"deriva de: {dados['deriva']}")
    print()

    erros = []

    n_json, n_png = len(dados["slides"]), len(pngs)
    if n_json != n_png:
        erros.append(f"{n_json} slides no JSON, {n_png} PNG renderizados")
    if not (SLIDES_MIN <= n_png <= SLIDES_MAX):
        erros.append(f"{n_png} slides: o Instagram aceita de {SLIDES_MIN} a {SLIDES_MAX}")

    for i, png in enumerate(pngs):
        tipo = dados["slides"][i]["tipo"] if i < n_json else "?"
        peso = png.stat().st_size
        dim = dimensao(str(png))

        print(f"{png.name}  {tipo:11s}  {dim[0]}x{dim[1]}  {peso/1024:7.1f} KB")

        if dim != Q:
            erros.append(f"{png.name}: {dim[0]}x{dim[1]}, esperado {Q[0]}x{Q[1]}")
        if peso > PESO_MAX:
            erros.append(f"{png.name}: {peso/1024/1024:.1f} MB, teto do Instagram e 8 MB")

        for nome, x, y, w, h in faixas_margem():
            ch = maximo_canais(str(png), x, y, w, h)
            pico = max(ch.values())
            marca = "ESTOURO" if pico > LIMIAR else "ok"
            print(f"    margem {nome:9s} R{ch['r']:5.0f} G{ch['g']:5.0f} B{ch['b']:5.0f}  {marca}")
            if pico > LIMIAR:
                erros.append(f"{png.name}: conteudo na margem {nome} (pico {pico:.0f})")

        # So o slide 1 e capa, e so ele precisa sobreviver ao recorte da grade.
        if i == 0:
            for nome, x, y, w, h in faixas_grade():
                ch = maximo_canais(str(png), x, y, w, h)
                pico = max(ch.values())
                marca = "FORA DA GRADE" if pico > LIMIAR else "ok"
                print(f"    grade  {nome:16s} pico {pico:5.0f}  {marca}")
                if pico > LIMIAR:
                    erros.append(f"{png.name}: {nome} na grade do perfil (pico {pico:.0f})")

    print()
    if erros:
        print(f"{len(erros)} problema(s):")
        for e in erros:
            print(f"  - {e}")
        return 1
    print(f"{n_png} slides, zero estouro de margem, zero corte na grade.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
