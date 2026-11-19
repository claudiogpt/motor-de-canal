---
name: canal-novo
description: Criar um canal novo a partir do modelo do framework. Use quando o pedido for começar um canal do zero, montar um canal de outro tema, criar a estrutura de um projeto de vídeo novo, ou quando a pasta ainda não tiver canal.json.
---

# Criar um canal

O comando `/canal-novo` copia o modelo. Esta skill é o que fazer com ele.

## 1. Entreviste antes de copiar

Não preencha o `canal.json` por suposição. Seis perguntas, e nenhuma é de
formalidade:

1. **Qual o tema, numa frase?** Não "economia", e sim o que o canal faz com
   economia.
2. **Qual a linha editorial?** Ela precisa ser capaz de **reprovar** um roteiro.
   Se não reprova nada, é slogan. Teste na hora: peça um exemplo de vídeo que a
   linha recusaria.
3. **O que o espectador leva?** A promessa. É o que decide o que entra.
4. **Quem é o público, e qual dor o traz?** Isso define o gancho.
5. **Quais contas já existem?** Instagram, YouTube, outras.
6. **Tem voz própria para clonar, ou usa voz de modelo?**

## 2. Preencha os três arquivos

| Arquivo | O quê | Quem decide |
| --- | --- | --- |
| `canal.json` | tema, linha, pilares, séries, cadência, contas | o dono, pela entrevista |
| `marca/marca.json` | cores, tipografia, mascote | o dono; proponha 2 ou 3 paletas |
| `plataformas/*.json` | **não mexa** | já medido, vale para todo canal |

### Pilares e séries

4 a 6 pilares, com proporção somando 1. O pilar é o **tipo** de conteúdo, não o
assunto. Séries fixas dão reconhecimento.

**Não ponha duração no nome do selo da série.** Um canal rodou meses com o selo
"Conceito em 40 s" em vídeos de 30 s, porque o selo foi escrito antes de o tempo
passar a sair do áudio medido.

### Cadência: comece só com vídeo curto

Deixe `longo` desligado no começo, e isto vem de dado, não de cautela: num canal,
o mesmo título saiu nas duas durações em quatro dias. O Short fez **1.110 views
e 7 inscritos**; o vídeo longo de 13 minutos fez **1 view e nenhum inscrito**.

O mecanismo: **99,2% das views de Shorts não vieram de clique em miniatura**. O
feed empurra o vídeo sem depender de capa. O longo não tem essa superfície: vive
de clique em miniatura, onde um canal novo não tem alcance.

Ligue o longo quando a conta tiver público.

## 3. Prove que funciona antes de produzir

```bash
python3 -I ferramentas/narrar.py conteudo/exemplo-tres-alugueis
./renderizar.sh conteudo/exemplo-tres-alugueis
python3 -I ferramentas/medir-reel.py conteudo/exemplo-tres-alugueis/out/reel.mp4
```

Isso roda com o adaptador `estimativa`: sem chave, sem GPU, sem custo. Se os
três passam, a instalação está correta e o canal pode produzir.

## 4. Escreva o `CLAUDE.md` do canal

É o diário, e é o que toda sessão nova herda. Deve conter:

- o que o canal é e para quem;
- o que já foi produzido, em ordem, **com o que deu errado**;
- o que o dono aprovou e **reprovou**, com as palavras dele;
- as pendências abertas.

**Registre as reprovações com mais cuidado que as aprovações.** Elas são o que
impede uma sessão futura de refazer o que já foi recusado.

## 5. Só então produza

Leia `producao-semanal`.

## O que NÃO copiar do canal de origem

- A linha editorial. Ela é do tema.
- As séries e os pilares.
- A paleta.
- Os exemplos. Um exemplo que funciona num tema costuma não ter a estrutura que
  outro conceito precisa.

O que **se copia** é o método: o áudio manda no tempo, mediu não olhou, fonte
primária, número recalculado por script.
