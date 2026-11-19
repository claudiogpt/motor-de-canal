#!/usr/bin/env python3
"""Monta a legenda do post a partir de conteudo/<dia>/legenda/.

    python3 montar-legenda.py ../conteudo/2026-10-22-padaria-seu-ze-5x2

Lê:
    legenda/texto.md       corpo da legenda (texto corrido, sem fontes)
    legenda/fontes.json    {"avisos": [...], "fontes": [{bloco, sobre, veiculo, data, url}]}
    legenda/hashtags.txt   hashtags numa linha

Escreve, prontos para colar:
    legenda/instagram.txt  fontes citadas por veículo e data (link não é clicável lá)
    legenda/youtube.txt    o mesmo, com o link de cada fonte (descrição do Shorts)

Regra do canal: todo número do vídeo tem fonte. Desde 23/10/2026 as fontes e os
avisos não aparecem na tela; vivem em fontes.json e entram aqui.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

LIMITE_INSTAGRAM = 2200
LIMITE_HASHTAGS_INSTAGRAM = 30
LIMITE_HASHTAGS_YOUTUBE = 15  # acima disso o YouTube ignora todas


def linha_fonte(f: dict, com_link: bool) -> str:
    quem = f["veiculo"] + (f", {f['data']}" if f.get("data") else "")
    linha = f"• {quem}: {f['sobre']}."
    if com_link and f.get("url"):
        linha += f"\n  {f['url']}"
    return linha


def montar(texto: str, dados: dict, hashtags: str, com_link: bool) -> str:
    partes = [texto.strip()]
    if dados.get("avisos"):
        partes.append("\n".join(dados["avisos"]))
    if dados.get("fontes"):
        partes.append("Fontes:\n" + "\n".join(linha_fonte(f, com_link) for f in dados["fontes"]))
    if hashtags:
        partes.append(hashtags)
    return "\n\n".join(partes) + "\n"


def main() -> int:
    if len(sys.argv) != 2:
        print(__doc__.strip().splitlines()[2].strip(), file=sys.stderr)
        return 2
    pasta = Path(sys.argv[1]) / "legenda"
    erros = []
    for nome in ("texto.md", "fontes.json"):
        if not (pasta / nome).exists():
            erros.append(f"falta {pasta / nome}")
    if erros:
        print("\n".join(f"erro: {e}" for e in erros), file=sys.stderr)
        return 1

    texto = (pasta / "texto.md").read_text(encoding="utf-8")
    # Junta as quebras de linha de dentro do parágrafo: o .md quebra em 80 colunas.
    texto = "\n\n".join(" ".join(p.split()) for p in texto.strip().split("\n\n"))
    dados = json.loads((pasta / "fontes.json").read_text(encoding="utf-8"))
    tags_arq = pasta / "hashtags.txt"
    hashtags = " ".join(tags_arq.read_text(encoding="utf-8").split()) if tags_arq.exists() else ""

    for f in dados.get("fontes", []):
        for campo in ("sobre", "veiculo"):
            if not f.get(campo):
                erros.append(f"fonte sem '{campo}': {f}")
    n_tags = len([h for h in hashtags.split() if h.startswith("#")])

    insta = montar(texto, dados, hashtags, com_link=False)
    yt = montar(texto, dados, hashtags, com_link=True)
    (pasta / "instagram.txt").write_text(insta, encoding="utf-8")
    (pasta / "youtube.txt").write_text(yt, encoding="utf-8")

    if len(insta) > LIMITE_INSTAGRAM:
        erros.append(f"instagram.txt tem {len(insta)} caracteres; o limite é {LIMITE_INSTAGRAM}")
    if n_tags > LIMITE_HASHTAGS_INSTAGRAM:
        erros.append(f"{n_tags} hashtags; o Instagram aceita {LIMITE_HASHTAGS_INSTAGRAM}")
    avisos = []
    if n_tags > LIMITE_HASHTAGS_YOUTUBE:
        avisos.append(f"{n_tags} hashtags: o YouTube ignora todas acima de {LIMITE_HASHTAGS_YOUTUBE}")
    if not dados.get("fontes"):
        avisos.append("fontes.json sem nenhuma fonte: todo número do vídeo precisa de uma")

    print(f"instagram.txt  {len(insta)}/{LIMITE_INSTAGRAM} caracteres")
    print(f"youtube.txt    {len(yt)} caracteres, {len(dados.get('fontes', []))} fontes com link")
    for a in avisos:
        print(f"aviso: {a}")
    for e in erros:
        print(f"erro: {e}", file=sys.stderr)
    return 1 if erros else 0


if __name__ == "__main__":
    sys.exit(main())
