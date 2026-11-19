#!/usr/bin/env python3
"""Adaptador de publicação que não publica: prepara a pasta para você subir.

É o PADRÃO do modelo, e isso é escolha. Um canal novo não tem conta de
agendamento, e subir à mão com a lista certa na frente erra menos que subir por
API com um campo faltando.

Escreve conteudo/<dia>/publicar/ com o vídeo, as capas, o texto de cada
plataforma e um INSTRUCOES.md que diz o que vai onde, inclusive em que segundo
arrastar a capa do Reel no aplicativo.
"""
from __future__ import annotations

import shutil
from pathlib import Path


def preparar(post: dict) -> dict:
    """Não envia nada: só embrulha. Dá para inspecionar antes de publicar."""
    return {"modo": "manual", "post": post}


def publicar(payload: dict, quando: str | None = None) -> dict:
    p = payload["post"]
    dia = Path(p["pasta"])
    saida = dia / "publicar"
    saida.mkdir(exist_ok=True)

    for chave in ("arquivo", "capaYouTube"):
        origem = p.get(chave)
        if origem and Path(origem).is_file():
            shutil.copy(origem, saida / Path(origem).name)

    (saida / "youtube.txt").write_text(
        f"TÍTULO\n{p['titulo']}\n\nDESCRIÇÃO\n{p.get('legenda', '')}\n",
        encoding="utf-8")
    (saida / "instagram.txt").write_text(
        p.get("legendaInstagram", p.get("legenda", "")) + "\n", encoding="utf-8")

    seg = p.get("capaInstagramMs", 0) / 1000
    video = Path(p["arquivo"]).name
    capa = Path(p.get("capaYouTube") or "capa-youtube.jpg").name

    (saida / "INSTRUCOES.md").write_text(f"""# Como subir este vídeo

Quando: {quando or p.get("quando") or "agora"}

## YouTube

1. Suba `{video}`.
2. Título e descrição estão em `youtube.txt`. **Cole o título no campo de
   título.** Se você deixar em branco, o YouTube usa a primeira linha da
   descrição, e foi assim que o primeiro vídeo de um canal saiu com o título
   errado.
3. Miniatura: `{capa}`. Se o botão de miniatura personalizada não aparecer, o
   canal ainda não está verificado por telefone: youtube.com/verify.

## Instagram

1. Suba `{video}` como Reel.
2. Legenda: `instagram.txt`. **A primeira linha faz o papel de título**, porque
   o Instagram não tem esse campo. Não corte ela.
3. **Capa: arraste a linha do tempo até {seg:.1f} s.** É o instante em que o
   gancho já está inteiro na tela. Sem isso o Instagram usa o primeiro quadro,
   que é o fundo ainda vazio: capa preta.

## Depois de publicado

- Confira se o título do YouTube ficou certo.
- Confira a capa do Reel **abrindo a grade do perfil**.
- No Instagram, capa e legenda de post publicado **não** se corrigem pela web:
  só pelo aplicativo, em três pontos → Editar.
""", encoding="utf-8")

    return {"ok": True, "pasta": str(saida),
            "mensagem": f"pronto para subir à mão: {saida}"}
