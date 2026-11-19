---
name: producao-semanal
description: A rotina de produzir uma semana de conteúdo de um canal, do tema ao agendamento. Use quando o pedido for produzir a semana, fazer os vídeos da semana, rodar a tarefa semanal, planejar a pauta, ou quando uma tarefa agendada de produção disparar.
---

# Produzir a semana

## A ordem, e ela é dependência

```
1. ler canal.json e CLAUDE.md           o que já foi feito, o que foi reprovado
2. escolher os conceitos                dos pilares e séries; ver abaixo
3. checar os fatos datados              ANTES de escrever, não depois
4. escrever roteiro.md                  2ª coluna = notas visuais
5. dimensionar                          duracao.py, antes de gastar GPU
6. montar <formato>.json                LENDO as notas visuais
7. recalcular os números por script     nunca digitar duas vezes
8. narrar                               narrar.py
9. renderizar                           renderizar.sh
10. MEDIR                               medir-*.py, sem exceção
11. montar legenda                      fontes e avisos saem da tela
12. escrever titulos.md                 3 opções, 1 recomendada
--- PARE AQUI. O dono aprova os títulos. ---
13. subir mídia e criar os posts
14. capa do Instagram (thumbOffset) e capa do YouTube
15. conferir a fila
16. DEPOIS DO AR: aplicar a capa do Short e conferir o título por oembed
```

**O passo 12 é uma parada, não uma formalidade.** Não suba mídia nem crie post
antes do sim.

## Escolher os conceitos

Prefira o que o dado favorece. Num canal medido, as duas plataformas queriam
coisas **opostas**: o mesmo vídeo fez 1.113 views no YouTube e 109 de alcance no
Instagram, enquanto outro fez 7 no YouTube e 439 no Instagram, o maior da conta.

- **Instagram premia conta concreta de dinheiro.**
- **YouTube premia provocação filosófica.**

Meça isso no seu canal antes de generalizar.

**Quando o plano de conceitos acabar**, gere conceito novo a partir dos pilares e
das séries em vez de improvisar. Um canal chegou a ter 8 conceitos restantes
para uma cadência de 9 por semana, e a tarefa não sabia o que fazer.

## Checar os fatos ANTES de escrever

Fato datado (lei, decisão judicial, número oficial, política pública) precisa ser
rechecado na fonte primária toda vez que for reaproveitado. Exemplos reais de
coisas que mudaram entre o plano e o roteiro:

- um artigo de decreto-lei que, lido no original, **não fixava** o prazo que os
  resumos diziam;
- a data exata de vigência de uma emenda, que era cálculo e virou fonte;
- um artigo que delega um número a lei complementar em vez de fixá-lo.

**Rechecar depois de agendado também vale**: uma citação errada foi trocada nas
legendas e no post sem precisar de novo render, porque o número estava certo e
só a referência estava errada.

## Gancho que depende de data

"Hoje a República faz 137 anos" num vídeo que vai ao ar quatro dias depois está
errado. **Gancho com data precisa ser revisto quando a data de publicação muda**,
e isso implica nova narração e novo render.

## Depois do ar, e ninguém dispara sozinho

- Conferir o título por **oembed**.
- Aplicar a **capa do Short** por metadata (não dá para mandar no agendamento).
- Conferir a capa do Instagram **na grade do perfil**, nunca pelo campo de
  analytics.

## Custo

Uma semana de 9 vídeos narrados em Kokoro custa menos de US$ 0,50. O que custa
caro é refazer, e o que faz refazer é pular a medição.
