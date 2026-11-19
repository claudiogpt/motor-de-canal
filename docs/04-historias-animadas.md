# Histórias animadas

O quinto formato: **pessoas desenhadas por código**, agindo no ritmo da voz.

Usa o [motion-kit](https://github.com/Gaok1/motion-kit), fixado no commit
`459b0ee`.

## Quando usar, e quando não

**Use** quando o conteúdo é uma troca entre partes com interesses próprios: o
comprador e o vendedor, o cidadão e o fiscal, três bancadas disputando o mesmo
orçamento. O que a história mostra e um gráfico não mostra é que são **pessoas**,
agindo uma de cada vez, por motivos delas.

**Não use** para conta de dinheiro. Isso continua sendo barra, escada e régua.

## Como se escreve

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

Cada pessoa entra na batida da fala que a apresenta. É a mesma regra dos outros
formatos: **o áudio manda no tempo.**

Trocar `"formato": "9:16"` por `"16:9"` reenquadra a história inteira para o
YouTube, sem reescrever nada. As posições são calculadas da régua do formato, e
não escritas à mão.

## O catálogo

Duas cenas, de propósito: é ponto de partida, não acervo.

| Cena | O quê |
| --- | --- |
| `titulo` | frases que entram uma por batida, sem personagem. Gancho e fecho. |
| `conversa` | pessoas numa linha de chão, cada uma entrando na sua batida. |

Cena nova se escreve em `motor/src/historia/cenas.tsx`. As receitas do
motion-kit estão em `motor/vendor/motion-kit/docs/recipes.md`, já em português:
personagem que caminha e aponta, câmera que revela um detalhe, trajetória com
pouso macio, ambiente com vento.

## O que ele NÃO faz, dito de frente

- **Não tem sincronia labial.** A boca se move na janela da fala. É isso.
  Chamar de sincronia labial seria mentira: o motion-kit não trabalha com
  fonema.
- **Não tem esqueleto nem sprite.** As pessoas são desenhadas por código, e a
  pose é um conjunto de ângulos.
- **Não tem áudio.** Está declarado fora do escopo do projeto, e nunca vai ter.
  A voz vem do framework, como em todos os formatos.
- **As cenas do catálogo ainda têm pouco movimento.** As figuras entram e ficam
  de pé. Caminhada, gesto e câmera existem na biblioteca e ainda não foram
  trazidos para o catálogo.

## A armadilha que já custou um render

`MK.text`, do motion-kit, **não quebra linha e não conhece margem**. Ele foi
escrito para telas de 1280x720 com rótulos curtos em inglês.

Uma frase em português num quadro de 1080 passa dos dois lados **em silêncio**.
A primeira história renderizada teve **56 quadros estourando esquerda e
direita**, e o render terminou sem reclamar: só o medidor viu.

Por isso toda cena usa `frase()`, que mede e quebra dentro da régua. Se você
escrever uma cena nova, use `frase()` também.
