---
name: historia-animada
description: Como escrever e montar uma história animada com personagens usando motion-kit dentro do Remotion. Use ao criar historia.json, ao escrever uma cena com pessoas, ao mexer em src/historia/, e quando o conteúdo for uma troca entre partes (comprador e vendedor, cidadão e fiscal, bancadas disputando) em vez de um gráfico.
---

# História animada

O quinto formato. Desenha **pessoas agindo**, com o motion-kit, e serve ao que
gráfico não conta bem: uma troca entre partes com interesses próprios.

**Não substitui as cenas de gráfico.** Conta de dinheiro continua sendo barra,
escada e régua. Use história quando o conteúdo for "quem faz o quê, e por quê".

## Como o motion-kit entra

É uma biblioteca SVG de navegador com relógio determinístico (`seek(t)`). Ela
**não renderiza vídeo, não tem áudio e não tem narração** — e isso encaixa, em
vez de atrapalhar: o framework já tem o relógio (o áudio medido) e a captura
(o Remotion).

Está fixada no commit `459b0ee`, em `motor/vendor/motion-kit/`. É projeto v0.x
com 2 commits: **não atualize sem fixar de novo e remedir**.

## As três decisões da ponte, e o que cada uma evita

Estão em `src/historia/Palco.tsx`. Entenda antes de mexer.

1. **Uma cena do motion-kit para o vídeo inteiro**, não uma por bloco. O
   `MK.start` zera o estado global (`MK.pre`, `MK.__cams`, `MK.people`,
   `MK.__world`): o MK é **singleton**. Com uma cena por bloco, cada
   `<Sequence>` que montasse zeraria as outras, e o render sairia diferente
   conforme a ordem em que o Remotion visitasse os frames.

2. **As batidas entram como `cues`.** `S.cue("b02-01")` devolve o segundo em que
   aquela fala começa. É o `naBatida` das cenas 9:16, aqui em segundos.

3. **`seek` em `useLayoutEffect`, não `useEffect`.** O Remotion tira o retrato
   depois do commit do React; `useEffect` roda **depois** dele, e o primeiro
   quadro sairia com a cena no estado anterior.

O áudio continua por batida, em `<Sequence>`, igual ao Reel. Os dois não se
encontram, e é isso que mantém a garantia central.

## Regra do `draw`: função pura do tempo

```js
return (t) => { /* desenhe o estado do instante t */ };
```

Nada de somar, contar nem guardar entre chamadas. O Remotion visita os frames
em **páginas paralelas**, e um draw com estado acumulado produz quadros
diferentes para o mesmo `t`. Isso **não aparece como erro**: aparece como vídeo
errado.

Teste de sanidade, que o próprio motion-kit documenta: compare capturas feitas
em `seek(3.2)` antes e depois de `seek(7)`. Têm que ser idênticas.

## Regra do texto: `frase()`, nunca `MK.text`

`MK.text` **não quebra linha e não conhece margem**, porque o motion-kit foi
escrito para 1280x720 com rótulos curtos. Uma frase em português num quadro de
1080 passa dos dois lados **em silêncio**: a primeira história renderizada teve
**56 quadros estourando esquerda e direita**, e só o medidor viu.

Use `frase()` de `src/historia/cenas.tsx`, que usa `MK.row` com `maxW` tirado da
régua do formato.

**Meça a altura antes de empilhar.** Texto declarado em 4 linhas pode virar 7
desenhadas, e empilhar pela contagem declarada joga o bloco para fora da tela.
`MK.row` devolve `lines` e `box`: use.

## A régua vem do formato, não do olho

`src/historia/regua.ts` deriva tudo de `plataformas/*.json`: margens, linha do
chão, altura de pessoa, corpo de texto. A mesma história serve 9:16 e 16:9
trocando um campo do JSON.

Dois erros já corrigidos ali: o chão estava em y=1498, **dentro da faixa da
legenda do Instagram**, e duas pessoas saíam de camisa igual, o que lê como a
mesma pessoa duplicada.

## O que o motion-kit NÃO faz, e não prometa que faz

- **Não tem fonema.** "Boca se movendo na janela da fala" é o que a cena faz.
  Chamar isso de sincronia labial é mentira.
- **Não tem esqueleto nem sprite.** Os personagens são desenhados por código, e
  a pose é um conjunto de ângulos.
- **Não tem áudio.** Nunca vai ter: está declarado fora do escopo do projeto.

## Escrever um `historia.json`

```json
{
  "formato": "9:16",
  "blocos": [
    {
      "tipo": "cena",
      "cena": "conversa",
      "dados": {
        "legenda": "Nenhum dos dois sabe o que o outro faz",
        "pessoas": [
          { "nome": "lenhador",   "naBatida": 0 },
          { "nome": "grafiteiro", "naBatida": 1, "olhaPara": "esquerda" }
        ]
      },
      "falas": [
        "Um corta a madeira no Oregon e nunca viu uma mina de grafite.",
        "O outro tira grafite no Ceilão e nunca serrou uma tábua."
      ]
    }
  ]
}
```

`x` é opcional: sem ele as pessoas se distribuem sozinhas dentro da régua, o que
**sobrevive à troca de formato** melhor que número escolhido a olho.

## O catálogo é ponto de partida

São duas cenas (`conversa` e `titulo`), não um acervo. Cena nova se escreve em
`src/historia/cenas.tsx`, seguindo a assinatura `Cena`. As receitas do
motion-kit estão em `motor/vendor/motion-kit/docs/recipes.md` — já em português.

Antes de escrever uma cena nova, leia a **segunda coluna do `roteiro.md`**, que
é onde ficam as notas visuais. Num canal, o motor achatava tudo em cartão de
texto porque ninguém lia essa coluna, e o dono reprovou o vídeo inteiro.
