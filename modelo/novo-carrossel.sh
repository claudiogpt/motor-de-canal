#!/usr/bin/env bash
# Cria a pasta de um carrossel novo a partir do modelo.
#
#   ./novo-carrossel.sh 2026-11-13 eleitor-mediano-6-estados
set -euo pipefail

DATA="${1:?uso: ./novo-carrossel.sh <AAAA-MM-DD> <slug>}"
SLUG="${2:?uso: ./novo-carrossel.sh <AAAA-MM-DD> <slug>}"
RAIZ="$(cd "$(dirname "$0")" && pwd)"
DEST="$RAIZ/conteudo/$DATA-$SLUG"

if [ -e "$DEST" ]; then
  echo "erro: $DEST ja existe" >&2
  exit 1
fi

mkdir -p "$DEST/out"
cp "$RAIZ/esqueleto-carrossel/carrossel.json" "$DEST/carrossel.json"
cp "$RAIZ/esqueleto-carrossel/titulos.md" "$DEST/titulos.md"
cp -r "$RAIZ/esqueleto-carrossel/legenda" "$DEST/legenda"
sed -i "s/SLUG_AQUI/$DATA-$SLUG/" "$DEST/carrossel.json"
sed -i "s/DIA_AQUI/$DATA-$SLUG/" "$DEST/titulos.md"

echo "criado: $DEST"
echo
echo "Carrossel nao tem audio: nao existe passo de narracao. A ordem e:"
echo "  edite carrossel.json, legenda/ e titulos.md"
echo "  python3 -I ferramentas/montar-legenda.py conteudo/$DATA-$SLUG"
echo "  ./renderizar-carrossel.sh conteudo/$DATA-$SLUG"
echo
echo "De 2 a 10 slides. O slide 1 e a capa e obedece ao recorte da grade do"
echo "perfil: o renderizar-carrossel.sh mede isso e falha se houver corte."
