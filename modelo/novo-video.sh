#!/usr/bin/env bash
# Cria a pasta de um Reel novo a partir do modelo.
#
#   ./novo-video.sh 2026-10-23 eleitor-mediano
set -euo pipefail

DATA="${1:?uso: ./novo-video.sh <AAAA-MM-DD> <slug>}"
SLUG="${2:?uso: ./novo-video.sh <AAAA-MM-DD> <slug>}"
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$RAIZ/conteudo/$DATA-$SLUG"

if [ -e "$DEST" ]; then
  echo "erro: $DEST ja existe" >&2
  exit 1
fi

mkdir -p "$DEST/out"
cp "$RAIZ/reels/esqueleto-reel/reel.json" "$DEST/reel.json"
cp "$RAIZ/reels/esqueleto-reel/fontes.md" "$DEST/fontes.md"
cp -r "$RAIZ/reels/esqueleto-reel/legenda" "$DEST/legenda"
cp "$RAIZ/reels/esqueleto-reel/titulos.md" "$DEST/titulos.md"
sed -i "s/SLUG_AQUI/$DATA-$SLUG/" "$DEST/reel.json"
sed -i "s/DIA_AQUI/$DATA-$SLUG/" "$DEST/titulos.md"

echo "criado: $DEST"
echo "edite reel.json (falas + naBatida), fontes.md e legenda/, depois rode, nesta ordem:"
echo "  python3 montar-legenda.py conteudo/$DATA-$SLUG"
echo "  cd ../claude-code-video-toolkit && uv run tools/ferramentas/narrar.py --reel conteudo/$DATA-$SLUG"
echo "  cd ../reels && ./renderizar.sh conteudo/$DATA-$SLUG"
