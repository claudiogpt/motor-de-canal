#!/usr/bin/env bash
# Renderiza um vídeo já narrado. Um comando, da pasta do canal.
#
#   ./renderizar.sh conteudo/2026-11-20-meu-tema
#
# A NARRAÇÃO VEM ANTES DO RENDER, e não é ordem de preferência, é dependência.
# O reel.json não declara duração nenhuma: o tempo de tela de cada bloco é a
# soma MEDIDA das suas batidas de voz, que narrar.py escreve em
# audio/tempos.json. Então:
#
#   python3 -I ferramentas/narrar.py conteudo/<dia>
#   ./renderizar.sh conteudo/<dia>
#
# O MP4 sai com a voz dentro, num passo só. Não existe mux depois, e por isso
# não existe como a voz e a tela saírem de sincronia.
set -euo pipefail

DIA="${1:?uso: ./renderizar.sh <pasta-do-video>}"
DIA="${DIA%/}"
RAIZ="$(cd "$(dirname "$0")" && pwd)"
ABS_DIA="$(cd "$DIA" && pwd)"
SLUG="$(basename "$ABS_DIA")"

# Qual formato, pelo arquivo que existe na pasta.
if   [ -f "$ABS_DIA/reel.json" ];      then FONTE=reel.json;      COMP=Reel;      SAIDA=reel.mp4
elif [ -f "$ABS_DIA/longo.json" ];     then FONTE=longo.json;     COMP=Longo;     SAIDA=longo.mp4
elif [ -f "$ABS_DIA/historia.json" ];  then FONTE=historia.json;  COMP=Historia;  SAIDA=historia.mp4
elif [ -f "$ABS_DIA/carrossel.json" ]; then
  exec "$RAIZ/renderizar-carrossel.sh" "$DIA"
else
  echo "erro: $DIA não tem reel.json, longo.json, historia.json nem carrossel.json" >&2
  exit 1
fi

if [ ! -f "$ABS_DIA/audio/tempos.json" ]; then
  cat >&2 <<ERRO
erro: $DIA/audio/tempos.json não existe.

Dele sai a duração de cada bloco, então o render não tem como começar. Gere a
narração primeiro:

  python3 -I ferramentas/narrar.py $DIA

Sem chave e sem GPU, o adaptador 'estimativa' gera silêncio do tamanho certo e
você revisa o vídeo inteiro de graça.
ERRO
  exit 1
fi

cd "$RAIZ/motor"

# O Remotion resolve staticFile() a partir de public/, e o áudio do dia vive na
# pasta do dia. Um link simbólico evita copiar os wav a cada render.
#
# LIMPA TODOS OS LINKS ANTES. Num canal que rodou meses, public/vozes acumulou
# 16 pastas, e `remotion bundle` copia public/ SEGUINDO os links: 72 KB de link
# viraram 112 MB no /tmp a cada render, com o disco a 95%.
rm -rf public/vozes
mkdir -p public/vozes
ln -s "$ABS_DIA/audio" "public/vozes/$SLUG"

mkdir -p "$ABS_DIA/out"
PROPS="$(mktemp -t props-XXXXXX.json)"
trap 'rm -f "$PROPS"' EXIT

python3 -I - "$ABS_DIA" "$FONTE" "vozes/$SLUG" "$PROPS" <<'PY'
import json, sys
dia, fonte, base, saida = sys.argv[1:5]
doc = json.load(open(f"{dia}/{fonte}", encoding="utf-8"))
doc["tempos"] = json.load(open(f"{dia}/audio/tempos.json", encoding="utf-8"))
doc["audioBase"] = base
json.dump(doc, open(saida, "w", encoding="utf-8"), ensure_ascii=False)
PY

npx remotion render "$COMP" "$ABS_DIA/out/$SAIDA" --props="$PROPS"

echo
echo "pronto: $DIA/out/$SAIDA"
ffprobe -v error -select_streams v:0 \
  -show_entries stream=width,height,r_frame_rate -show_entries format=duration \
  -of default=noprint_wrappers=1 "$ABS_DIA/out/$SAIDA"
echo
echo "Agora MEÇA. Render que compila não é render correto:"
echo "  python3 -I ferramentas/medir-reel.py $DIA/out/$SAIDA"
