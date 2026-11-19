---
name: arquitetura-de-tempo
description: Como o tempo de um vídeo é definido neste framework, e por que nenhuma duração é digitada à mão. Use antes de escrever ou editar qualquer reel.json, longo.json, historia.json ou carrossel.json, antes de mexer em narração, sincronia, duração de bloco, entrada de elemento ou timing de animação, e sempre que algo estiver dessincronizado, arrastado ou com tela parada.
---

# O áudio manda no tempo

Esta é a invenção central do framework. Tudo o mais é consequência.

## O defeito que isto corrige

A primeira versão do sistema fazia assim: o JSON declarava `duracaoSegundos`
por bloco, digitado por quem escrevia o roteiro. A legenda queimada era
distribuída por contagem de caractere dentro dessa duração. A voz era gerada
depois, por outro script, e grudada no vídeo pronto com um passo de mux.

**Dois relógios, e eles nunca se encontravam.**

Medido em nove vídeos de uma semana: **76,6 segundos de tela parada sem ninguém
falando, 18% da semana**, 30% no pior deles, e a legenda sempre adiantada em
relação à voz. O próprio comentário no código avisava: "quando a voz for
gravada, troque este cálculo pelos tempos reais". Nunca foi trocado, porque
funcionava o suficiente para ninguém olhar.

## A inversão

```
<formato>.json declara `falas` por bloco e NENHUMA duração
     ↓
narrar.py gera UM arquivo de áudio POR FALA e MEDE cada um
     ↓
audio/tempos.json guarda a duração real de cada batida
     ↓
o Remotion lê isso, deriva a duração de cada bloco da soma das suas
batidas, e põe cada <Audio> na própria linha de tempo
```

**Não existe passo de mux depois do render.** O MP4 já sai narrado. Por isso
não existe como a voz e a tela saírem de sincronia: não há dois relógios para
divergir, há um.

O `renderizar.sh` falha de propósito se `audio/tempos.json` não existir.

## Batida

Uma **batida** é uma fala. A unidade de tempo do sistema não é o segundo nem o
frame: é a frase que a voz diz.

```json
{
  "tipo": "escada",
  "titulo": "A frase que explica o mecanismo.",
  "degraus": [
    { "horas": "44", "quando": "antes", "naBatida": 0 },
    { "horas": "42", "quando": "agora",  "naBatida": 1 },
    { "horas": "40", "quando": "depois", "naBatida": 2 }
  ],
  "falas": [
    "Hoje são quarenta e quatro horas.",
    "Em dezembro caem para quarenta e duas.",
    "Só um ano depois chegam a quarenta."
  ]
}
```

`naBatida: 1` quer dizer: este elemento entra no frame em que a **segunda fala
começa**. Não em "7 frames depois", não em "0,8 s". Se a narração mudar, o
gráfico acompanha sozinho no próximo render, sem ninguém reajustar nada.

É isso que faz o gráfico se montar enquanto a voz fala, em vez de aparecer
pronto e esperar.

## Como escrever as falas

- **Uma ideia por fala.** Fala que carrega duas ideias não tem onde encaixar o
  segundo elemento.
- **Entre 8 e 20 palavras.** Abaixo disso a borda de silêncio do modelo domina
  a batida; acima, o elemento fica parado tempo demais.
- **Escreva a fala, não a legenda.** O texto da tela é o gráfico; a fala
  reformula, não repete.
- **Número duvidoso vai em `falaLiteral`.** A conversão automática é boa, mas
  "Cruzado II" virou "Cruzado Dois" num canal. Quando houver dúvida:
  `{ "fala": "o Cruzado II", "falaLiteral": "o Cruzado dois" }`.

## Dimensionar antes de gastar GPU

```bash
python3 -I ferramentas/duracao.py conteudo/<dia>
```

O modelo é `palavras ÷ 191 + 0,415 s por batida`, ajustado em 16 vídeos
narrados. Erro de ~1%.

**Não use "palavras por minuto" sozinho.** A primeira tentativa dividia
palavras pela duração total e dava 153 ppm; errou 14% num vídeo de 13 minutos.
A conta mistura o ritmo de fala com o silêncio de borda fixo de cada arquivo.
Numa batida de 3 s essa borda pesa muito; numa de 7,6 s quase some. Taxa única
não serve para os dois formatos.

## Sinais de que algo está errado

| Sintoma | Causa quase certa |
| --- | --- |
| `narrar.py` recusa um bloco | O bloco tem texto único em vez de `falas`. É o formato antigo, recusado de propósito. |
| Respiro acima de 15% | Falas curtas demais, ou elementos demais numa batida só. Junte batidas. |
| Elemento aparece antes da voz citá-lo | `naBatida` apontando para a batida errada. |
| Tela parada no fim de um bloco | A última batida acabou e não há mais o que mostrar. Corte a fala ou acrescente elemento. |

## Volume

A narração é normalizada para **−14 LUFS com teto de −1 dBTP**, que é onde
Instagram e YouTube trabalham. Quem entrega mais baixo **não é levantado**: só
soa fraco no feed ao lado dos outros vídeos.

**Ganho único para todas as batidas.** `loudnorm` por batida achataria a
dinâmica entre falas e deixaria a narração robótica.

Armadilha do ffmpeg, e ela é silenciosa: o `alimiter` tem `level` ligado por
padrão, que renormaliza para 0 dB e **anula o teto que você acabou de pedir**.
Precisa de `level=disabled`.
