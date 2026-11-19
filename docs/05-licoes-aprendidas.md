# O que aprendemos errando

Cada item aqui custou tempo, dinheiro ou um vídeo errado no ar. Estão aqui para
não custarem de novo.

## Sobre tempo e sincronia

**Dois relógios sempre divergem.** A primeira versão declarava duração à mão e
grudava a voz depois. Medido em nove vídeos: 76,6 segundos de tela parada, 18%
da semana, legenda sempre adiantada. O conserto não foi ajuste, foi inverter
quem manda: o áudio mede, o vídeo obedece, e o passo de mux deixou de existir.

**Um comentário de código que avisa não conserta nada.** O arquivo dizia
"quando a voz for gravada, troque este cálculo pelos tempos reais". Nunca foi
trocado, porque funcionava o suficiente para ninguém olhar.

**Taxa única não serve para dois formatos.** Dimensionar por "palavras por
minuto" errou 14% num vídeo de 13 minutos. A conta misturava ritmo de fala com
o silêncio de borda fixo de cada arquivo: numa batida de 3 s essa borda pesa
muito, numa de 7,6 s quase some. Dois termos separados: erro de 0,8%.

## Sobre medir

**Render que compila não é render correto.** Todo defeito de layout deste
framework foi achado por medição ou por recorte em resolução cheia. Nenhum a
olho, e vários tinham passado por revisão humana.

**A régua errada produz relatório falso.** Já relatei 33 px de estouro medindo a
faixa do meio contra a régua da faixa de baixo. Zona segura e coluna central são
réguas diferentes para alturas diferentes.

**Três quadros por segundo não bastam.** Um carimbo entrava com zoom e passava
do limite por poucos quadros. A medição não viu. Depois de uma narração nova, o
tempo mudou e uma amostra caiu na entrada: só então apareceu.

**O medidor mede margem, não verdade.** Uma capa dizia "Durou quatro meses" sem
fonte para o prazo, e passou em todas as medições.

**Não afrouxe o limiar para o medidor parar de reclamar.** Isso cega justamente
a verificação que interessa. Quando o texto encostou exatamente na linha da
margem, a saída foi recuar o texto, não baixar o limiar.

## Sobre fonte

**Resumo de terceiro contradiz a lei.** Três casos num só canal, incluindo uma
página oficial de "Regras" desatualizada contra a própria lei que ela resume, e
um resumo que atribuía a um artigo um prazo que ele não fixa.

**Quando não achar fonte primária, tire a afirmação.** Uma frase saiu do
roteiro porque o único artigo que a sustentava não abriu.

**O silêncio tem que cair para o lado fraco.** Se esquecer de declarar a origem
de um número significar "é fato", o esquecimento vira afirmação. Num canal cuja
regra é declarar a ressalva, o padrão de quem esquece é a ressalva.

## Sobre plataforma

**Um campo que ninguém preencheu parece bug de upload.** Os Reels subiam com
capa preta. A causa não era codificação: era o `thumbOffset`, cujo padrão é 0, e
o quadro 0 é o fundo ainda vazio.

**Mensagem de sucesso da API não é prova.** O título do primeiro vídeo de um
canal saiu errado porque o campo certo era outro. A capa de um Short pareceu não
ter trocado porque a URL estava cacheada pelo CDN, com byte count idêntico. E um
campo de analytics indicou falha numa correção que tinha funcionado.

**Confira no lugar onde o público vê.** Capa de Instagram: na grade do perfil.
Título de YouTube: por oembed. Capa de Short: pela URL assinada.

## Sobre trabalhar com IA

**Numa automação, documento desatualizado não é registro errado, é instrução
viva.** Uma regra revogada que continua escrita volta a ser seguida sem ninguém
decidir isso de novo.

**Edite o arquivo que a automação lê, não só o espelho versionado.** Num canal,
uma correção entrou no espelho e ficou fora do arquivo ao vivo por uma semana.

**Registre as reprovações com mais cuidado que as aprovações.** São elas que
impedem uma sessão futura de refazer o que já foi recusado. "O Condorcet de
pizza e sushi foi reprovado por abstrato demais" vale mais que dez elogios.

**Nunca reescreva histórico nem troque de branch numa pasta que outra sessão
está editando.** Um `git lfs migrate import --everything --yes` avisou que o
working copy seria sobrescrito e levou junto edições não commitadas de sessões
irmãs. O trabalho foi refeito, e a causa foi registrada errada no diário por um
dia.

## Sobre o que o dado disse e o gosto não diria

**Rótulo ideológico no título mata o alcance.** Mediana de 66 views contra 316
mil, no mesmo nicho.

**As duas plataformas querem coisas opostas.** O mesmo acervo: provocação
filosófica fez 1.113 no YouTube e 109 no Instagram; conta de dinheiro fez 7 no
YouTube e 439 no Instagram.

**Vídeo longo precisa de público que canal novo não tem.** Mesmo título, quatro
dias de diferença: Short 1.110 views e 7 inscritos, longo 1 view e nenhum.

**Mas o dado não separa tudo.** Nesse caso, onde o longo teve miniatura
servida, quem clicou viu 1:17 de 12:59. Então não era só distribuição: título,
capa e os primeiros minutos também precisavam de trabalho. Escrever que era só
distribuição teria mandado uma sessão futura pular justamente o que faltava.
