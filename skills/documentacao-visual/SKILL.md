---
name: documentacao-visual
description: Como escrever documentação para HUMANOS neste framework. Use ao criar ou editar README, docs/, guia, explicação de arquitetura, onboarding ou qualquer texto que uma pessoa vai ler. Também ao desenhar diagrama Mermaid, tabela, régua ASCII ou fluxograma, e ao explicar como um sistema funciona.
---

# Documentação para humanos

## A regra, e ela inverte a ordem de composição

**Para humanos, o visual é cidadão de primeira classe. O texto só auxilia.**

```
❌ ERRADO                        ✅ CERTO
escreve a prosa                  decide qual visual carrega a ideia
      ↓                                ↓
depois ilustra                   desenha
      ↓                                ↓
o visual é enfeite               escreve só o que o visual NÃO diz
```

**Teste:** apague o texto da seção. Se ela continuar compreensível, está certo.
Se virar enigma, o visual era enfeite.

**Para IA é o contrário:** `SKILL.md`, prompt de tarefa e `CLAUDE.md` podem ser
texto corrido. Densidade visual não ajuda o modelo.

## Qual formato para qual ideia

| A ideia é... | Use | Não use |
| --- | --- | --- |
| um fluxo, uma arquitetura | Mermaid `flowchart` | parágrafo com setas em palavras |
| comparação entre opções | tabela | bullets paralelos |
| medida, limite, coordenada | **régua desenhada em ASCII** | "o limite é x=860" solto |
| uma decisão | árvore de decisão | "se... então... senão..." |
| número contra número | barra `████` na tabela | só os dois números |
| passo a passo com uma trava | fluxo com o nó da trava destacado | lista numerada |

## O visual tem que ENSINAR, não rotular

Este é o erro que já foi cometido e reprovado neste projeto.

**Rotular** é pôr numa caixa o nome do que acontece. Só funciona para quem já
sabe:

```
❌  ┌──────────────────────┐   ┌─────────────────┐
    │ 1 áudio por fala     │ → │ render deriva   │
    │ + medição            │   │ a duração       │
    └──────────────────────┘   └─────────────────┘
```

**Ensinar** é mostrar o mecanismo com valores reais:

```
✅  "Hoje são 44 horas."   →  b01-00.wav  →  2,80 s
    "Em dezembro caem…"    →  b01-01.wav  →  3,40 s

    2,80  +  0,12  +  3,40  +  0,30   =   6,62 s
    fala0    pausa    fala1    pausa       ← duração do bloco
```

Regras que saem disso:

- **Use números reais**, não `N` nem `x`. "2,80 s" ensina; "duração da fala" não.
- **Responda a pergunta óbvia dentro do visual.** "Por que um arquivo por fala
  e não um por bloco?" precisa estar ali, não três parágrafos abaixo.
- **Jargão só DEPOIS do conceito, e entre parênteses.** "Colar a voz por cima
  no fim *(no jargão: mux)*" — nunca o contrário.
- **Nomeie cada parcela de uma conta.** O leitor tem que ver de onde veio cada
  número.

## Armadilhas do Mermaid no GitHub, pagas na prática

| Armadilha | O que acontece |
| --- | --- |
| **`<i>` no rótulo** | o diagrama renderiza **EM BRANCO, sem erro nenhum** |
| dois-pontos no nome de tarefa do Gantt | quebra, mesmo entre aspas (`:` é o separador da sintaxe) |
| bloco ASCII acima de ~72 colunas | ganha barra de rolagem horizontal, e some a leitura |
| rótulo muito longo | o diagrama fica largo demais para a coluna do GitHub |

`<b>` e `<br/>` funcionam. `<i>` não.

## Verificação: olhar, não procurar erro

> **"Não deu erro" não é "funcionou".**

Um diagrama com `<i>` desenha um SVG vazio **sem emitir erro nenhum**. Uma
verificação que conta ocorrências de "Unable to render" passa limpa e a página
está quebrada — foi exatamente o que aconteceu aqui.

O GitHub renderiza Mermaid dentro de um iframe isolado, então inspeção por
script a partir da página **não alcança** os diagramas.

**A única verificação válida é abrir a página publicada e olhar:**

```bash
git push
# abra https://github.com/<user>/<repo>/blob/main/docs/<arquivo>.md
# role a página inteira e confira cada diagrama
```

Confira também:

- [ ] nenhum bloco de código com barra de rolagem horizontal
- [ ] nenhum diagrama em branco
- [ ] os rótulos cabem sem cortar

É a mesma disciplina do resto do framework: **diagrama que compila no fonte não
é diagrama que renderiza**, assim como render que compila não é render correto.
