# Como funciona

Para quem vai usar, não para quem vai mexer no código.

## O problema que o framework resolve

Produzir vídeo curto em série tem três trabalhos chatos que se repetem toda
semana, e que é onde o erro entra:

1. **Encaixar a imagem no tempo da voz.** Feito à mão, desencaixa.
2. **Conferir que nada ficou fora da tela.** Feito a olho, passa.
3. **Não deixar um número da tela divergir do número da conta.** Digitado duas
   vezes, diverge.

O framework resolve os três por construção, não por disciplina.

## 1. O áudio manda no tempo

Você escreve as **falas**. Não escreve duração.

```json
{
  "tipo": "escada",
  "degraus": [
    { "horas": "44", "quando": "antes", "naBatida": 0 },
    { "horas": "42", "quando": "agora", "naBatida": 1 }
  ],
  "falas": [
    "Hoje são quarenta e quatro horas.",
    "Em dezembro caem para quarenta e duas."
  ]
}
```

`naBatida: 1` quer dizer: **este elemento entra quando a segunda fala começar.**

O que acontece depois:

```
narrar.py      gera um áudio por fala e mede cada um
               → audio/tempos.json
renderizar.sh  lê a medição e monta o vídeo com a voz dentro
```

Se você mudar uma fala, o gráfico acompanha sozinho no próximo render. Você
nunca reajusta um número de tempo.

## 2. Mediu, não olhou

Depois de todo render:

```bash
python3 -I ferramentas/medir-reel.py conteudo/<dia>/out/reel.mp4
```

Ele confere tamanho, volume, silêncio e as faixas da tela onde a interface do
app cobre o vídeo. Devolve erro quando algo estoura.

Isso não é zelo: **todos os defeitos de layout deste framework foram achados
assim, e vários tinham passado por revisão humana antes.**

Exemplo: os ícones do Instagram ocupam a faixa direita **só no terço de baixo**.
Então o limite da direita é x=934 em cima e x=860 embaixo. Três vezes um
elemento cresceu em altura (um nome longo, um texto que quebrou em duas linhas)
e a base dele entrou na faixa estreita. Ninguém viu a olho. O medidor viu.

## 3. Número se recalcula, não se digita duas vezes

Se o vídeo mostra "62% é seu", esse 62% é **calculado por script** a partir dos
valores, antes do render. Nunca escrito à mão no JSON.

Motivo: quando o número está em dois lugares, um dia eles divergem, e o vídeo vai
ao ar com a conta errada.

## Os quatro arquivos que você edita

| Arquivo | O quê |
| --- | --- |
| `canal.json` | tema, linha editorial, pilares, séries, cadência, contas |
| `marca/marca.json` | cores, tipografia, voz, mascote |
| `conteudo/<dia>/roteiro.md` | o roteiro, com as notas visuais na 2ª coluna |
| `conteudo/<dia>/reel.json` | o vídeo, em blocos e falas |

Você **não** edita `plataformas/*.json`. São as medidas da interface do
Instagram e do YouTube, medidas em frame, e valem para qualquer canal.

## Os três comandos

```bash
python3 -I ferramentas/duracao.py conteudo/<dia>   # quanto vai durar
python3 -I ferramentas/narrar.py  conteudo/<dia>   # gera e mede a voz
./renderizar.sh                   conteudo/<dia>   # faz o MP4
python3 -I ferramentas/medir-reel.py conteudo/<dia>/out/reel.mp4
```

Nessa ordem. O render recusa rodar sem a narração, de propósito.

## Voz: três opções

| Adaptador | Custo | Quando |
| --- | --- | --- |
| `estimativa` | zero | **padrão.** Silêncio do tamanho certo. Para montar e revisar. |
| `kokoro` | centavos | produção. Voz de modelo, roda em CPU. |
| `chatterbox` | centavos | a sua voz clonada, de uma gravação de referência. |

Trocar é uma linha no `canal.json`.
