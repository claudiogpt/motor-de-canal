---
description: Sobe mídia, cria os posts e agenda, depois do aval dos títulos
argument-hint: "[pasta ou \"semana\"]"
---

Alvo: `$1`

**Antes de tudo: o usuário já aprovou os títulos?** Se não, pare e peça. Esta é
a única parada obrigatória do fluxo.

Carregue `armadilhas-de-plataforma`.

Para cada vídeo:

1. Gere a capa do Instagram (`capa-instagram.py`) e a do YouTube
   (`capa-youtube.py`). As duas saem do **mesmo instante**, calculado de
   `audio/tempos.json`.
2. Suba a mídia por presign + PUT. **Confira o content-length remoto contra o
   local.**
3. Crie o post com `call_tool` → `posts_create_post`, não com o `posts_create`
   simples, que não aceita `platformSpecificData` nem fuso.
4. Campos que não podem faltar:
   - `platformSpecificData.title` na entrada do YouTube (sem ele, o YouTube usa
     a primeira linha da descrição);
   - `platformSpecificData.thumbOffset` na entrada do Instagram (sem ele, a capa
     é o quadro 0, que é preto);
   - `customContent` sem links no Instagram, abrindo pelo título;
   - `scheduled_for` com offset explícito.
5. Confira a fila com `posts_list` e veja se a mídia está em `/media/`.

**Depois do ar**, e ninguém dispara isso sozinho:

- aplicar a capa do Short por `posts_update_post_metadata`;
- conferir o título por oembed;
- conferir a capa do Instagram **na grade do perfil**, nunca pelo campo de
  analytics, que serve um asset cacheado e já indicou falha numa correção que
  funcionou.

Relate o que foi agendado, com data, horário e id de cada post.
