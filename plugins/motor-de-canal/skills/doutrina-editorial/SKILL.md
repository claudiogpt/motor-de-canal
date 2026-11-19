---
name: doutrina-editorial
description: Como escrever roteiro, gancho, título e legenda num canal deste framework. Use ao escrever ou revisar qualquer roteiro, fala, gancho, título, capa, legenda, descrição ou hashtag, ao decidir o tema de um vídeo, e sempre que precisar checar um dado, citar uma lei, atribuir uma frase a um autor ou declarar uma estimativa.
---

# Doutrina editorial

A linha específica está no `canal.json`. O que segue vale para qualquer tema.

## A linha editorial precisa ser capaz de reprovar

Se a linha do canal não consegue **recusar um roteiro**, ela não é linha
editorial, é slogan. A que funcionou num canal: *"explicado pelo mecanismo, não
pela torcida"*. Ela reprova na hora qualquer roteiro que torça por um lado em
vez de mostrar como a coisa funciona.

Ao escrever, pergunte: *o que nesta linha este roteiro violaria?* Se a resposta
for "nada", o roteiro provavelmente não está dizendo nada.

## Gancho e título: clickbait que o vídeo paga

Clickbait leve é **lacuna de curiosidade**: pergunta, número sem contexto, ou
afirmação específica. Nunca promessa que o vídeo não cumpre.

Três formas que funcionaram:

- **Pergunta que o espectador não sabe responder.** "Quem protege você do seu protetor?"
- **Conta concreta de dinheiro.** "Seu FGTS rendeu 6,90%. O CDI pagou 14,32%."
- **Afirmação específica e verificável.** "Ninguém no mundo sabe fazer um lápis."

O título vai em `titulos.md`, **3 opções e uma recomendada**, e o dono escolhe.
Registre por que você recomendou aquela: quando ele escolhe outra e o vídeo vai
mal, o registro é o que permite aprender.

**O Instagram não tem campo de título.** Lá a primeira linha da legenda faz esse
papel, então ela precisa carregar o clickbait sozinha.

### Duas regras de título vindas de dado, não de gosto

- **Rótulo ideológico no título mata o alcance.** Num ranking de nicho,
  "libertarianismo explicado" teve mediana de **66 views** contra **316 mil** de
  "economia explicada rápido". A regra se estende a qualquer rótulo de tribo.
- **Use o termo que as pessoas buscam, não o que você usa.** "escala 6x1"
  devolve o assunto; "6x1" devolve placar de futebol.

## Steelman antes de responder

Apresente a melhor versão do argumento contrário, não a pior. E **critique o
próprio campo**: num canal que faz isso, o vídeo de autocrítica foi o que mais
converteu.

Se o seu steelman é fácil de derrubar, você não fez steelman, fez espantalho.

## Fonte primária, lida no original

Todo número leva fonte. **Resumo de terceiro não serve**, e já contradisse a lei
em três casos num só canal:

- Uma fonte dizia que a Lei 8.036 manda corrigir o FGTS "pela TR". Ela não diz
  isso: manda usar os parâmetros da poupança mais 3% ao ano. Quem diz TR é a
  página da CAIXA.
- Uma página oficial de "Regras" estava desatualizada quanto à data do crédito
  mensal, contra o que a própria lei diz.
- Um resumo atribuía prazo de um ano a um artigo de decreto-lei que não fixa
  prazo nenhum.

Quando não achar fonte primária, **tire a afirmação**. Já aconteceu de uma frase
sair do roteiro porque o único artigo que a sustentava não abriu.

### Como declarar o que não é fato

- **Estimativa ou exemplo construído:** diga na tela e na legenda.
- **Cálculo nosso sobre dado publicado:** é diferente de estimativa. Acumular
  uma série diária oficial é determinístico; chutar uma margem não é.
- **Regra do elo mais fraco:** se um slide tem cinco números e um deles é
  estimativa, o slide inteiro é estimativa.
- **O silêncio cai para o lado fraco.** Esquecer de declarar a origem não pode
  significar "é fato". Num canal cuja regra é declarar a ressalva, o padrão de
  quem esquece tem que ser a ressalva.

## Fontes e avisos vão na legenda, não na tela

A tela carrega o gráfico. Fonte, aviso de simulação e ressalva vão em
`legenda/fontes.json`, montados por `ferramentas/montar-legenda.py`.

Motivo medido: a linha de fonte na tela competia por atenção com o gráfico, e
caía dentro da faixa de interface do Instagram.

## Conceito abstrato se mostra, não se lista

Reel só de texto foi reprovado. Experimento mental **contado** foi reprovado.
O mecanismo precisa **acontecer na tela**: o ciclo desenhado como ciclo, o
eleitor andando na régua, as barras crescendo.

Autor só entra na tela **quando a voz o cita**, com obra e ano. O resto vai para
a legenda. Nome e ano soltos na tela foram reprovados por nome.

## Restrição técnica que limita o exemplo

Nem todo exemplo serve para todo conceito. **Exemplo numa régua só não produz o
paradoxo de Condorcet**: com preferências ordenadas numa única dimensão existe
vencedor estável, que é o do meio. O ciclo exige opções disputando em eixos
diferentes.

Antes de escolher o exemplo, verifique se ele **tem a estrutura** que o conceito
precisa. O tema da casa nem sempre serve.

## Público e limites

- Se o canal tem público menor de idade: sem palavrão, sem humilhar quem pensa
  diferente, sem incentivar ilegalidade.
- Cripto e imposto levam aviso de "não é consultoria".
- Nenhuma imagem ou voz de pessoa real gerada por IA.
- Não copiar criador. Vídeo de referência serve para estudar estrutura (tempo de
  gancho, ritmo), nunca texto ou ideia.

## Estilo

Frases curtas. Fato primeiro. Sem travessão. Sem linguagem de marketing. Sem
clichê motivacional. Tecnicamente honesto: **a ressalva fica, mesmo que
enfraqueça o gancho**.
