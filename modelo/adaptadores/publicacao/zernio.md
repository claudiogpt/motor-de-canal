# Adaptador `zernio`

A Zernio é um serviço de agendamento que cobre Instagram e YouTube. Como ela se
usa por ferramenta MCP e não por biblioteca Python, este adaptador é um
**roteiro**, não um arquivo executável.

## Por vídeo

### 1. Capas

```bash
python3 -I ferramentas/capa-instagram.py conteudo/<dia>   # devolve o ms
python3 -I ferramentas/capa-youtube.py   conteudo/<dia>   # escreve out/capa-youtube.jpg
```

As duas saem do **mesmo instante**, calculado de `audio/tempos.json`: fim do
bloco de gancho menos 0,45 s. Uma régua só para as duas plataformas.

### 2. Subir a mídia

`media_get_media_presigned_url` → `PUT` → **conferir o content-length remoto
contra o local**.

A mídia vira permanente **na criação do post**, não na publicação: a URL
assinada aponta para `/temp/` e o post guardado já mostra `/media/`. Por isso
agendar com semanas de antecedência é seguro.

### 3. Criar o post

`call_tool` com `posts_create_post`. **Não** use o `posts_create` simples: ele
não aceita `platformSpecificData` nem horário com fuso.

```jsonc
{
  "title": "referência interna, NÃO é o título do vídeo",
  "scheduled_for": "2026-11-20T19:00:00-03:00",
  "platforms": [
    {
      "platform": "youtube",
      "platformSpecificData": {
        "title": "O título que o dono aprovou"
      }
    },
    {
      "platform": "instagram",
      "customContent": "legenda sem links, abrindo pelo título",
      "platformSpecificData": {
        "thumbOffset": 3359
      }
    }
  ]
}
```

Os dois campos de `platformSpecificData` não são opcionais na prática:

- **sem `title`**, o YouTube usa a primeira linha da descrição;
- **sem `thumbOffset`**, a capa do Reel é o quadro 0, que é o fundo vazio.

### 4. Conferir

`posts_list` com `status: scheduled`. A mídia tem que aparecer em `/media/`.

Se editar depois, lembre que **`posts_update_post` substitui o array
`platforms` inteiro**: reenvie o que não quer perder, e confira o `contentHash`
para ver se o texto fez o round-trip sem alteração.

**Rascunho não publica sozinho.** `is_draft: true` com `scheduled_for` guarda o
horário e mantém o status `draft`; é preciso promover depois.

## Depois do ar

Só funciona com o vídeo já publicado, e **nada dispara isso sozinho**:

- **capa do Short:** presign com `content_type: image/jpeg` → PUT → `call_tool`
  com `posts_update_post_metadata` (`post_id`, `platform: youtube`,
  `thumbnail_url`). Confira pela **URL assinada** que `yt-dlp --dump-json` traz
  no array `thumbnails`, nunca pela `oar2.jpg` crua, que o CDN serve cacheada
  com byte count idêntico ao da capa velha.
- **título:** oembed.
- **capa do Instagram:** grade do perfil. Nunca pelo `thumbnailUrl` do
  analytics, que é um asset cacheado e já indicou falha numa correção que havia
  funcionado.

## O que não dá para corrigir depois

| | YouTube | Instagram |
| --- | --- | --- |
| título | sim | não tem campo |
| descrição / legenda | `posts_edit_post` | **não cobre Instagram** |
| capa | sim, depois do ar | **só à mão no app** |
| áudio | **não** | **não** |
