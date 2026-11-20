#!/usr/bin/env bash
# Cria a pasta de um vídeo novo a partir do esqueleto.
#
#   ./novo-video.sh 2026-11-25 eleitor-mediano
set -euo pipefail

DATA="${1:?uso: ./novo-video.sh <AAAA-MM-DD> <slug>}"
SLUG="${2:?uso: ./novo-video.sh <AAAA-MM-DD> <slug>}"
RAIZ="$(cd "$(dirname "$0")" && pwd)"
DEST="$RAIZ/conteudo/$DATA-$SLUG"

if [ -e "$DEST" ]; then
  echo "erro: $DEST já existe" >&2
  exit 1
fi

mkdir -p "$DEST"
cp -r "$RAIZ/esqueleto-reel/." "$DEST/"
sed -i "s/SLUG_AQUI/$DATA-$SLUG/" "$DEST/reel.json"
sed -i "s/DIA_AQUI/$DATA-$SLUG/" "$DEST/titulos.md"

cat <<FIM

criado: conteudo/$DATA-$SLUG

Edite reel.json (falas + naBatida), fontes.md e legenda/. Depois, NESTA ORDEM:

  python3 -I ferramentas/duracao.py      conteudo/$DATA-$SLUG   # quanto vai durar
  python3 -I ferramentas/montar-legenda.py conteudo/$DATA-$SLUG
  python3 -I ferramentas/narrar.py       conteudo/$DATA-$SLUG   # gera e MEDE a voz
  ./renderizar.sh                        conteudo/$DATA-$SLUG
  python3 -I ferramentas/medir-reel.py   conteudo/$DATA-$SLUG/out/reel.mp4

A narração vem antes do render, e não é preferência: o reel.json não declara
duração nenhuma. O tempo de cada bloco é a soma medida das suas batidas de voz.
O renderizar.sh recusa rodar sem isso, de propósito.
FIM
