#!/usr/bin/env bash
# Renderiza um carrossel de Instagram: um PNG 1080x1350 por slide.
#
#   ./renderizar-carrossel.sh ../conteudo/2026-11-10-salario-62-por-cento
#
# Diferente do render.sh dos Reels, aqui NAO existe passo de narracao antes:
# slide nao tem tempo, logo nao tem audio e nao tem duracao derivada. A ordem e:
#
#   python3 -I ferramentas/montar-legenda.py conteudo/<dia>
#   ./renderizar-carrossel.sh ../conteudo/<dia>
#
# POR QUE EMPACOTA UMA VEZ E DEPOIS CHAMA O still N VEZES. Cada `remotion still`
# sozinho reempacota o projeto no webpack, o que levaria o custo de build vezes
# o numero de slides. `remotion bundle` faz isso uma vez e os stills recebem a
# pasta pronta como serve-url.
#
# No fim roda o medidor e FALHA se houver estouro de margem, dimensao errada ou
# peso acima do limite do Instagram. Render que nao mede nao serve: os erros de
# layout deste projeto (rodape dos Reels, perfil do Condorcet, cena declara do
# video longo) foram todos achados em frame, nunca a olho.
set -euo pipefail

DIA="${1:?uso: ./renderizar-carrossel.sh <pasta-do-carrossel>}"
DIA="${DIA%/}"

if [ ! -f "$DIA/carrossel.json" ]; then
  echo "erro: $DIA/carrossel.json nao existe" >&2
  exit 1
fi

RAIZ="$(cd "$(dirname "$0")" && pwd)"
ABS_DIA="$(cd "$DIA" && pwd)"
# O projeto node vive em motor/, nao na raiz do canal.
cd "$RAIZ/motor"
mkdir -p "$ABS_DIA/out"

N="$(python3 -I -c 'import json,sys; print(len(json.load(open(sys.argv[1],encoding="utf-8"))["slides"]))' "$ABS_DIA/carrossel.json")"

if [ "$N" -lt 2 ] || [ "$N" -gt 10 ]; then
  echo "erro: $N slides. O Instagram aceita de 2 a 10 por carrossel." >&2
  exit 1
fi

TRAB="$(mktemp -d -t carrossel-XXXXXX)"
trap 'rm -rf "$TRAB"' EXIT

# PUBLIC VAZIO DE PROPOSITO, E ISSO FOI MEDIDO.
#
# `remotion bundle` copia a pasta public/ para dentro do pacote, seguindo
# links simbolicos. O public/ deste projeto tem 72 KB em links, mas 112 MB
# depois de seguidos: o render.sh dos Reels liga ali o audio de cada dia, e ja
# sao 16 pastas mais a narracao do video longo de 13 minutos. Isso iria para o
# /tmp a cada render, num disco que esta a 95%.
#
# O carrossel nao usa staticFile() em lugar nenhum: nao tem audio, nao tem
# imagem externa, tudo e desenhado em SVG e CSS. Entao apontar o public para
# uma pasta vazia nao tira nada do render e tira o risco inteiro.
mkdir -p "$TRAB/public-vazio"

echo "empacotando o projeto uma vez..."
npx remotion bundle --out-dir="$TRAB/bundle" --public-dir="$TRAB/public-vazio" --quiet

# PNGs antigos saem antes: carrossel que encurtou de 8 para 7 slides deixaria o
# slide-08.png para tras, e ele entraria no upload como oitavo slide.
rm -f "$ABS_DIA"/out/slide-*.png

for i in $(seq 0 $((N - 1))); do
  NUM="$(printf '%02d' $((i + 1)))"
  PROPS="$TRAB/props-$NUM.json"
  python3 -I -c '
import json, sys
d = json.load(open(sys.argv[1], encoding="utf-8"))
d["slideAtual"] = int(sys.argv[2])
json.dump(d, open(sys.argv[3], "w", encoding="utf-8"), ensure_ascii=False)
' "$ABS_DIA/carrossel.json" "$i" "$PROPS"

  echo "slide $NUM de $N"
  npx remotion still "$TRAB/bundle" Carrossel "$ABS_DIA/out/slide-$NUM.png" \
    --props="$PROPS" --overwrite --quiet
done

# As previas (folha de contato, capa em tamanho de grade) vao para out/previa/.
# Em out/ elas entrariam no upload da Zernio como se fossem slides a mais,
# porque o upload le out/slide-*.png e um olho distraido le out/*.png.
mkdir -p "$ABS_DIA/out/previa"
ffmpeg -v error -pattern_type glob -i "$ABS_DIA/out/slide-*.png" \
  -vf "scale=360:450,tile=${N}x1:padding=8:margin=8:color=0x1a1a1a" \
  -frames:v 1 -y "$ABS_DIA/out/previa/contato-feed.png"
# A capa como a grade do perfil a mostra: recorte quadrado central.
ffmpeg -v error -i "$ABS_DIA/out/slide-01.png" \
  -vf "crop=1080:1080:0:135,scale=360:360" -y "$ABS_DIA/out/previa/capa-grade.png"

echo
python3 -I "$RAIZ/ferramentas/medir-carrossel.py" "$ABS_DIA"
