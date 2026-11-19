#!/usr/bin/env python3
"""Estima a duracao de um roteiro antes de gastar GPU com a narracao.

   python3 estimar-duracao.py ../conteudo/longos/<video>/roteiro.md
   python3 estimar-duracao.py ../conteudo/<dia>/reel.json

POR QUE ESTE ARQUIVO EXISTE. Em 29/10/2026 eu dimensionei um roteiro longo por
"palavras / 153,1 ppm", um numero que eu tinha tirado de dividir as palavras
dos Reels pela duracao total dos blocos. Previu 15:07. O resultado medido foi
12:58, 14% a menos.

O erro: aquela conta mistura duas coisas diferentes. Alem do ritmo de fala,
cada wav do Kokoro traz um silencio de borda fixo, que nao depende do tamanho
da frase. Num Reel as batidas tem ~3 s, entao essa borda pesa muito e o ritmo
aparente cai. Num video longo as batidas tem ~7,6 s e a borda quase some. Uma
taxa unica de ppm nao serve para os dois.

O modelo certo tem dois termos, ajustado por minimos quadrados sobre os 16
videos ja narrados:

    segundos de fala = palavras / 191,0 ppm + 0,415 s por batida

Erro na amostra: 0,0% no video longo, ate 14% num Reel de 30 s (ali a borda
domina). Para dimensionar roteiro longo, que e o uso, serve bem.
"""

import json
import pathlib
import re
import sys

PPM = 191.0
BORDA = 0.415      # silencio de borda de cada wav
RESPIRO = 0.12     # entre batidas, posto pelo narrar_batidas.py


def falas_de(caminho: pathlib.Path) -> list[str]:
    if caminho.suffix == ".json":
        d = json.loads(caminho.read_text(encoding="utf-8"))
        return [s for b in d["blocos"] for s in b.get("falas", [])]
    # roteiro.md: primeira coluna das tabelas dentro de cada "# ATO"
    falas, dentro = [], False
    for ln in caminho.read_text(encoding="utf-8").split("\n"):
        if re.match(r"# ATO \d+ · ", ln):
            dentro = True
            continue
        if not dentro or not ln.startswith("|") or re.match(r"\|\s*[-: ]+\|", ln):
            continue
        col = [x.strip() for x in ln.strip().strip("|").split("|")]
        if len(col) >= 2 and col[0] and col[0] != "Fala":
            falas.append(re.sub(r"\*\*", "", col[0]))
    return falas


def main() -> None:
    p = pathlib.Path(sys.argv[1]).resolve()
    falas = falas_de(p)
    if not falas:
        raise SystemExit(f"nenhuma fala encontrada em {p}")
    pal = sum(len(re.findall(r"[A-Za-zÀ-ÿ0-9]+", s)) for s in falas)
    s = pal / PPM * 60 + len(falas) * BORDA + len(falas) * RESPIRO
    print(f"{p.name}")
    print(f"  palavras : {pal}")
    print(f"  batidas  : {len(falas)}")
    print(f"  estimado : {int(s // 60)}:{int(s % 60):02d}  ({s:.0f} s)")
    print(f"  margem   : {int(s*0.95//60)}:{int(s*0.95%60):02d} a {int(s*1.05//60)}:{int(s*1.05%60):02d}")


if __name__ == "__main__":
    main()
