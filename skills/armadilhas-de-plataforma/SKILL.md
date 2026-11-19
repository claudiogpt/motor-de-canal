---
name: armadilhas-de-plataforma
description: Armadilhas de Instagram, YouTube e da API de agendamento que já custaram vídeo errado no ar. Use ao montar um post, definir título, capa ou miniatura, agendar publicação, subir mídia, editar algo já publicado, ou quando um campo da API não produziu o efeito esperado.
---

# Armadilhas de plataforma

Cada item aqui aconteceu. Nenhum é precaução teórica.

## YouTube

### O título do vídeo não é o campo `title`

O `title` da raiz do post é **referência interna**. O título do vídeo é
`platformSpecificData.title` na entrada `youtube`. Sem ele, o YouTube usa **a
primeira linha da descrição**, e foi o que aconteceu com o primeiro vídeo de um
canal.

**Confira por oembed depois de publicado.** Mensagem de sucesso da API não é
prova.

### Miniatura personalizada exige canal verificado por telefone

A API devolve **403** com "doesn't have permissions to upload and set custom
video thumbnails". O vídeo publica normalmente; só a miniatura é pulada. A
verificação é em `youtube.com/verify`.

### A capa do Short só se aplica DEPOIS de publicado

`posts_update_post_metadata` age no vídeo que já está no ar. Não dá para mandar
a capa junto com o agendamento. **Todo Short agendado precisa de um passo depois
do ar**, e ninguém dispara isso sozinho.

Sem capa própria o YouTube escolhe um quadro do meio, e o que entra é o gráfico
já montado, nunca o gancho. Em 16 Shorts de um canal, **nenhum** tinha o gancho
na capa.

### `maxresdefault.jpg` não é a capa do Short

É a versão 16:9, com o Short em letterbox. A capa que aparece na aba Shorts é
`oar2.jpg`, em 1080x1920. Conferir pelo maxres leva a conclusão errada.

## Instagram

### Sem `thumbOffset` a capa do Reel é preta

O Instagram escolhe a capa por `thumbOffset`, em ms desde o início, e **o padrão
é 0**. O quadro 0 é o fundo da marca ainda vazio, antes do texto do gancho
entrar: brilho máximo de 37 em 255.

Nunca foi bug de upload nem de codificação. Era um campo que ninguém preencheu.

Aponte para o **fim do bloco de gancho menos 0,45 s**, calculado de
`audio/tempos.json` — o mesmo arquivo que manda no tempo do render.
`ferramentas/capa-instagram.py` faz isso.

### Reel publicado não se corrige por API

`posts_edit_post` não cobre Instagram e `posts_update_post_metadata` só serve
para YouTube. Capa e legenda de Reel publicado só mudam **à mão, no aplicativo**
(três pontos → Editar). Pela web não dá: a web edita legenda, marcação e
localização, não a capa.

### Conteúdo político não é recomendado a quem não segue

Desde fevereiro de 2024. Abra ganchos por economia, filosofia ou objeto do dia a
dia, e confira o Status da Conta toda semana.

### O carrossel tem duas réguas

No feed nada se sobrepõe à imagem, então a área segura do Reels **não vale**. A
restrição real é a **grade do perfil**, que recorta o 4:5 e é onde a conversão
acontece. A margem vale em todo slide; o recorte da grade vale **só no slide 1**,
que é a capa.

### Margem encostada não é margem respeitada

Texto alinhado **exatamente** na linha da margem acusa estouro, porque a borda
suavizada do glifo ocupa o pixel seguinte. Deixe folga de 8 px entre a caixa de
conteúdo e a margem. **Não afrouxe o limiar do medidor**: isso cega a
verificação que interessa.

## API de agendamento

- **O `posts_create` simples não aceita `platformSpecificData` nem horário com
  fuso.** Use `call_tool` com `posts_create_post` e
  `media_get_media_presigned_url`.
- **Horário sempre com offset explícito** (`-03:00` no Brasil, que não tem
  horário de verão desde 2019). Não deixe a API adivinhar.
- **A mídia vira permanente na CRIAÇÃO do post**, não na publicação: a URL
  assinada aponta para `/temp/` e o post guardado já mostra `/media/`. Por isso
  agendar com semanas de antecedência é seguro.
- **Confira o content-length remoto contra o local** depois de cada PUT.
- **`posts_update_post` substitui o array `platforms` inteiro.** Se você só quer
  mudar um campo, reenvie o resto. Confira pelo `contentHash` que o texto fez o
  round-trip sem alteração.
- **Rascunho não publica sozinho.** `is_draft: true` com `scheduled_for` guarda
  o horário e mantém o status `draft`; é preciso promover depois.

## A armadilha que não é da plataforma: o arquivo que a automação lê

Se existe tarefa agendada, ela lê um arquivo específico. Editar o **espelho**
versionado no repositório não muda o que a tarefa faz. Edite **os dois**, e
confirme qual é o que roda.

Num canal, o `thumbOffset` entrou no espelho e ficou fora do arquivo ao vivo por
uma semana.

Vale a generalização: **numa automação, documento desatualizado não é registro
errado, é instrução viva.** Uma regra revogada que continua escrita volta a ser
seguida sem ninguém decidir isso de novo.
