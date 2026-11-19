---
name: verificacao-por-medicao
description: Como conferir um vídeo, carrossel ou capa depois de renderizar, medindo em vez de olhar. Use SEMPRE depois de qualquer render, antes de mostrar o resultado ao dono do canal ou de publicar, e quando precisar checar área segura, estouro de margem, volume, silêncio, capa, corte na grade do perfil ou se um elemento cabe na tela.
---

# Mediu, não olhou

**Render que compila não é render correto.** Todos os defeitos de layout deste
framework foram achados por medição ou por recorte em resolução cheia. Nenhum
foi achado a olho, e vários passaram por revisão humana antes.

## O que rodar, sempre

```bash
python3 -I ferramentas/medir-reel.py      conteudo/<dia>/out/reel.mp4
python3 -I ferramentas/medir-longo.py     conteudo/<dia>/out/longo.mp4
python3 -I ferramentas/medir-carrossel.py conteudo/<dia>/out/*.png
```

Eles conferem formato, volume, silêncio e as faixas proibidas de cada formato,
e devolvem código de saída diferente de zero quando algo estoura.

## Como os medidores funcionam, e por que assim

**Nenhum quadro entra na memória do Python.** O ffmpeg recorta cada faixa
proibida e devolve o valor máximo por quadro via `signalstats`.

Isso não é elegância, é necessidade, e as duas alternativas falharam:

1. Varredura em Python sobre vídeo cru tentou alocar **48 GB** (23.350 quadros
   de 1920x1080) numa máquina de 15 e foi morta pelo sistema. Vídeo cru nunca
   cabe em buffer.
2. Leitura em fluxo com numpy funciona, mas o numpy está no site-packages do
   usuário, **fora do alcance de `python3 -I`**, que é como os scripts rodam.

**Máximo de canal RGB, não luma.** Com limiar de luma 110, o vermelho de custo
da marca (`#B5452F`, luma 101, canal R 181) passaria por baixo e o medidor
ficaria cego justamente onde há conteúdo. O limiar é 80 em qualquer canal.

## A armadilha que mais voltou: réguas diferentes para alturas diferentes

Os ícones do Instagram ocupam a faixa direita **só no terço de baixo**. Então o
limite não é um número:

- no meio do quadro: **x = 934**
- a partir de **y = 1280**: **x = 860**

Já produzi **relatório falso de estouro** medindo a faixa do meio contra a régua
da faixa de baixo. E já houve **estouro real de 73 px** três vezes, sempre pela
mesma causa: algo cresceu em altura (nome longo, texto quebrando em duas linhas,
selo entrando numa batida tardia) e empurrou a base de um elemento para dentro
da faixa estreita.

**Meça faixa por faixa, com a régua daquela faixa.**

## O que o medidor NÃO pega

Ele mede margem, não verdade. Três classes de defeito escapam:

1. **Texto vazando da caixa de um cartão**, no meio da tela. O medidor olha
   faixa proibida, não caixa. Isso se acha em recorte de resolução cheia.
2. **Contradição entre a fala e a tela.** A tela dizia "paga a estrada" e a voz
   dizia "tem motivo para pagar". Nenhum medidor vê isso.
3. **Fato errado.** Uma capa dizia "Durou quatro meses" sem fonte para o prazo.

## Amostragem: 3 quadros por segundo não basta

Um carimbo entrava com zoom e passava do limite por **poucos quadros**. A
medição a 3 quadros por segundo não viu. Depois de uma narração nova, o tempo
mudou e uma amostra caiu bem na entrada: só então apareceu.

**Para elemento que entra com zoom, mola ou ultrapassagem, meça a 10 quadros por
segundo.**

## Capas

- **Instagram:** só se confere **abrindo a grade do perfil**. O campo
  `thumbnailUrl` do analytics é um asset cacheado que **não é a capa que o
  público vê** — ele já indicou falha numa correção que tinha funcionado.
- **YouTube:** a URL `oar2.jpg` sem parâmetro é **cacheada pelo CDN** e continua
  servindo a capa velha depois da troca, com byte count idêntico. Pôr `?v=` não
  resolve, porque o i.ytimg ignora query desconhecida. Confira pela **URL
  assinada**, que `yt-dlp --dump-json` traz no array `thumbnails`.

## Antes de dizer que está pronto

- [ ] O medidor do formato passou, com código de saída zero.
- [ ] Conferi em folha de contato que o gancho aparece inteiro e legível.
- [ ] A fala e a tela dizem a mesma coisa, no mesmo instante.
- [ ] Todo número da tela foi recalculado por script, não digitado duas vezes.
- [ ] Toda fonte foi lida no original.
- [ ] Nenhuma palavra ficou sozinha numa linha.
