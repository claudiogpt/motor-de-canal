---
description: Cria um canal novo a partir do modelo do framework, por entrevista
argument-hint: "[pasta-do-canal]"
---

O usuário quer criar um canal de vídeo novo. Pasta pedida: `$1`

Carregue a skill `canal-novo` antes de qualquer coisa. Depois:

## 1. Pegue o modelo

O motor **não vem dentro do plugin**: o Diretório Anthropic só aceita texto de
organização não Verificada, e o motor é Python, TypeScript e shell. O plugin
traz a doutrina e os comandos; o motor vem do repositório.

Procure nesta ordem e **pare na primeira que existir**:

1. `${CLAUDE_PLUGIN_ROOT}/../modelo` — existe quando o plugin foi instalado
   pelo marketplace do repositório, que clona a árvore inteira;
2. uma pasta `motor-de-canal/` que o usuário já tenha na máquina (pergunte);
3. clone, num diretório temporário:

```bash
git clone --depth 1 https://github.com/claudiogpt/motor-de-canal /tmp/motor-de-canal-modelo
```

Copie `modelo/` de onde achou para a pasta que o usuário pediu, ou para `./`
se ele não disse. O conteúdo de `modelo/` vira a **raiz** do canal: depois da
cópia o canal tem `motor/`, `ferramentas/`, `marca/`, `canal.json` no primeiro
nível, não dentro de um `modelo/`.

Não copie: `conteudo/*/out/`, `conteudo/*/audio/`, `motor/node_modules`.

## 2. Entreviste

Seis perguntas da skill `canal-novo`. **Não preencha por suposição.** Faça uma
de cada vez quando a resposta anterior mudar a seguinte.

Na pergunta da linha editorial, peça **um exemplo de vídeo que ela recusaria**.
Se o usuário não conseguir dar, a linha ainda não está pronta.

## 3. Preencha `canal.json` e `marca/marca.json`

Proponha 2 ou 3 paletas, com o motivo de cada uma em uma linha. Não mexa em
`plataformas/*.json`.

Deixe `formatos.longo.ativo` em `false`, e diga por quê em uma frase (o dado
está na skill).

## 4. Prove que funciona

```bash
cd <pasta> && npm --prefix motor install
python3 -I ferramentas/narrar.py conteudo/exemplo-tres-alugueis
./renderizar.sh conteudo/exemplo-tres-alugueis
python3 -I ferramentas/medir-reel.py conteudo/exemplo-tres-alugueis/out/reel.mp4
```

Roda sem chave e sem GPU. Se os três passam, está instalado.

## 5. Escreva o `CLAUDE.md` do canal

A partir das respostas da entrevista. É o diário que toda sessão futura herda.

## 6. Diga ao usuário o que vem depois

Em três linhas: produzir o primeiro vídeo (`/produzir`), e que a voz de verdade
pede `MODAL_TTS_URL` mas o canal já funciona sem ela.
