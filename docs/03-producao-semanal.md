# Produzir uma semana

## Com a IA

```
/produzir semana
```

Ela para com os títulos escritos e os vídeos medidos, e espera o seu sim antes
de subir qualquer coisa.

## A ordem, e ela é dependência

```
 1. ler canal.json e CLAUDE.md
 2. escolher os conceitos
 3. CHECAR OS FATOS DATADOS           ← antes de escrever, não depois
 4. escrever roteiro.md                  2ª coluna = notas visuais
 5. dimensionar                          duracao.py, antes de gastar GPU
 6. montar reel.json                     LENDO as notas visuais
 7. recalcular os números por script
 8. narrar
 9. renderizar
10. MEDIR
11. montar a legenda
12. escrever titulos.md                  3 opções, 1 recomendada
─── PARADA: você aprova os títulos ───
13. subir mídia e criar os posts
14. capa do Instagram e do YouTube
15. conferir a fila
16. DEPOIS DO AR: capa do Short e título por oembed
```

## Escolher o conceito: as plataformas querem coisas opostas

Medido num canal, com o mesmo acervo:

| Vídeo | YouTube | Instagram |
| --- | --- | --- |
| provocação filosófica | 1.113 views | 109 de alcance |
| conta concreta de dinheiro | 7 views | **439 de alcance** |

**Instagram premia dinheiro concreto. YouTube premia provocação filosófica.**
Meça no seu canal antes de generalizar, mas não assuma que o que funciona num
lugar funciona no outro.

## Título: duas regras vindas de dado

- **Rótulo ideológico mata o alcance.** Num ranking de nicho,
  "libertarianismo explicado" teve mediana de **66 views** contra **316 mil** de
  "economia explicada rápido". Vale para qualquer rótulo de tribo.
- **Use o termo que as pessoas buscam.** "escala 6x1" devolve o assunto; "6x1"
  devolve placar de futebol.

O título vai em `titulos.md` com 3 opções e uma recomendada. **Guarde o porquê
da recomendação**: quando você escolhe outra e o vídeo vai mal, o registro é o
que permite aprender.

## Checar os fatos antes de escrever

Lei, decisão judicial, número oficial e política pública mudam. Rechecar na
fonte primária **antes** de escrever economiza um render inteiro.

Coisas que mudaram entre o plano e o roteiro, em casos reais:

- um artigo de decreto-lei que, lido no original, **não fixava** o prazo que os
  resumos diziam;
- a data exata de vigência de uma emenda;
- um artigo que delega um número a lei complementar em vez de fixá-lo.

**Resumo de terceiro não serve.** Ele já contradisse a lei em três casos num só
canal, inclusive uma página oficial que estava desatualizada contra a própria
lei que ela resume.

## Gancho que depende de data

"Hoje a República faz 137 anos" num vídeo que vai ao ar quatro dias depois está
errado. Isso implica narração nova e render novo, então **decida a data de
publicação antes de escrever o gancho**.

## A parada do passo 12 é real

Não suba mídia nem crie post antes de aprovar os títulos. Depois de agendado,
o que dá e o que não dá para corrigir:

| | YouTube | Instagram |
| --- | --- | --- |
| título | sim | — (não tem campo) |
| descrição / legenda | sim | **não, por API** |
| capa | sim, depois do ar | **não, só no app à mão** |
| áudio | **não** | **não** |

Uma narração que afirmou algo sem ressalva não se conserta. A descrição dá para
editar; a fala não.

## Depois do ar, e nada dispara sozinho

- aplicar a **capa do Short** (não dá para mandar no agendamento);
- conferir o título por **oembed**;
- conferir a capa do Instagram **na grade do perfil**.

## Custo

Uma semana de 9 vídeos narrados custa menos de US$ 0,50. O que custa caro é
refazer, e o que faz refazer é pular a medição.
