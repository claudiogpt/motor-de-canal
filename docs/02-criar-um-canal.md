# Criar um canal

## Com a IA

```
/canal-novo meu-canal
```

Ela entrevista, preenche os arquivos, roda a prova de instalação e escreve o
`CLAUDE.md` do canal.

## À mão

```bash
cp -r modelo meu-canal && cd meu-canal
npm --prefix motor install
```

Depois edite dois arquivos.

### `canal.json`

O que importa de verdade, em ordem:

**A linha editorial precisa ser capaz de reprovar um roteiro.** Se a sua não
recusa nada, é slogan, não linha. Teste: escreva um exemplo de vídeo que ela
recusaria. Se não conseguir, volte.

Uma que funcionou: *"explicado pelo mecanismo, não pela torcida"*. Ela reprova
na hora qualquer roteiro que torça por um lado em vez de mostrar como funciona.

**Pilares** são tipos de conteúdo, não assuntos. 4 a 6, com proporção somando 1.

**Séries** dão reconhecimento. Uma armadilha: **não ponha duração no nome do
selo.** Um canal rodou meses com "Conceito em 40 s" em vídeos de 30 s, porque o
selo foi escrito antes de o tempo passar a sair do áudio medido.

**Cadência: comece só com vídeo curto.** Isto é dado, não cautela. Num canal, o
mesmo título saiu nas duas durações em quatro dias:

| | views | inscritos |
| --- | --- | --- |
| Short, 33 s | **1.110** | **7** |
| Vídeo longo, 13 min | **1** | 0 |

O mecanismo: **99,2% das views de Shorts não vieram de clique em miniatura.** O
feed empurra o vídeo sem depender de capa. O vídeo longo não tem essa
superfície: ele vive de clique em miniatura, onde um canal novo não tem alcance.

Ligue o longo quando a conta já tiver público.

### `marca/marca.json`

Cores, tipografia e voz. Duas regras que sobreviveram à prática:

- **Fundo quase preto, não preto puro.** Preto puro achata o gráfico.
- **Uma cor reservada para custo ou perda**, e ela só aparece onde há custo.
  Cor que aparece sempre deixa de ser lida.

Os nomes das cores são semânticos (`custo`, `ouro`, `texto`), não literais. Um
componente pede "custo", nunca "vermelho", então trocar a paleta não exige
reler componente nenhum.

### O que você NÃO edita

`plataformas/instagram.json` e `plataformas/youtube.json`. São medidas da
interface dos apps, medidas em frame, e valem para qualquer canal. Um canal novo
não tem que remedir a coluna de ícones do Instagram para escolher as próprias
cores.

## Prove que funciona antes de produzir

```bash
python3 -I ferramentas/narrar.py conteudo/exemplo-tres-alugueis
./renderizar.sh conteudo/exemplo-tres-alugueis
python3 -I ferramentas/medir-reel.py conteudo/exemplo-tres-alugueis/out/reel.mp4
```

Sem chave, sem GPU, sem custo. Os três passando, a instalação está correta.

## Voz de verdade, quando quiser

```bash
export MODAL_TTS_URL=https://...modal.run
```

Publique `adaptadores/tts/modal-kokoro-ptbr/app.py` no Modal e troque
`adaptadores.tts` para `"kokoro"` no `canal.json`. Custo medido: menos de
US$ 0,50 por semana de 9 vídeos.

**A chave fica no ambiente, nunca em arquivo versionado.**

## O `CLAUDE.md` do canal

É o diário, e é o que toda sessão futura da IA herda. Escreva nele:

- o que o canal é e para quem;
- o que já foi produzido, **com o que deu errado**;
- o que você aprovou e **reprovou**, com as suas palavras;
- as pendências abertas.

**Registre as reprovações com mais cuidado que as aprovações.** São elas que
impedem a IA de refazer o que você já recusou.

E um aviso que vale ouro: numa automação, **documento desatualizado não é
registro errado, é instrução viva.** Uma regra que você revogou mas que continua
escrita volta a ser seguida sem ninguém decidir isso de novo.
