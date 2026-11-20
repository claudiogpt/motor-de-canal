#!/usr/bin/env bash
# Confere a documentação antes do push, SEM desligar os hooks que já existiam.
#
# POR QUE A DELEGAÇÃO ABAIXO NÃO É OPCIONAL:
# core.hooksPath substitui a pasta .git/hooks INTEIRA. Num repositório com Git
# LFS, isso desliga o pre-push do LFS em silêncio, e os arquivos grandes param
# de subir: o remoto fica com ponteiros apontando para objetos que não existem.
set -uo pipefail

RAIZ="$(git rev-parse --show-toplevel)"

# 1. Primeiro o hook original (Git LFS e qualquer outro).
if [ -x "$RAIZ/.git/hooks/pre-push" ]; then
  "$RAIZ/.git/hooks/pre-push" "$@" || exit $?
elif command -v git-lfs >/dev/null 2>&1 && [ -s "$RAIZ/.gitattributes" ] \
     && grep -q "filter=lfs" "$RAIZ/.gitattributes" 2>/dev/null; then
  git lfs pre-push "$@" || exit $?
fi

# 2. Depois a conferência da documentação.
for c in "$RAIZ/modelo/ferramentas/checar-docs.py" \
         "$RAIZ/ferramentas/checar-docs.py" \
         "$HOME/.claude/skills/documentacao-visual/checar-docs.py"; do
  [ -f "$c" ] && CHECADOR="$c" && break
done
[ -z "${CHECADOR:-}" ] && exit 0

echo "pre-push: conferindo a documentação..."
python3 -I "$CHECADOR" "$RAIZ" && exit 0

cat >&2 <<'FIM'

PUSH BLOQUEADO: a documentação tem diagrama que não renderiza.

Diagrama com <i> no rótulo aparece EM BRANCO no GitHub, sem erro nenhum.
Corrija os achados acima, ou use --no-verify se souber o que está fazendo.
FIM
exit 1
