# Adaptador de voz: o contrato

Um adaptador de TTS é um arquivo Python nesta pasta que expõe **uma função**:

```python
def sintetizar(textos: list[str], opcoes: dict, destino: Path) -> list[Path]:
    """Um wav por texto, na mesma ordem. Nada mais."""
```

Ele recebe texto já convertido para fala (`ferramentas/texto_ptbr.py` cuidou
dos números) e devolve arquivos crus. É tudo.

## O que o adaptador NÃO faz

Isto é deliberado, e a divisão importa:

| Etapa | Onde fica | Por quê |
| --- | --- | --- |
| Número para palavra | `ferramentas/texto_ptbr.py` | É língua, não motor. Trocar de voz não muda como se fala "44". |
| Aparar silêncio das bordas | `ferramentas/narrar.py` | Todo motor deixa borda, e cada um deixa um tamanho diferente. |
| Normalizar volume | `ferramentas/narrar.py` | O alvo é da plataforma (−14 LUFS), não do motor. |
| Medir a duração | `ferramentas/narrar.py` | É o coração do sistema. Não se delega. |
| Escrever `tempos.json` | `ferramentas/narrar.py` | Idem. |

Se um adaptador começar a medir duração ou normalizar volume, o sistema perde a
garantia central: que o tempo da tela sai de **uma** medição.

## Os adaptadores que vêm no modelo

### `estimativa` — o padrão, e ele é de propósito

Gera wav **silencioso** do tamanho que a fala teria. Não precisa de chave, de
GPU, de rede nem de conta em serviço nenhum: um canal recém-criado renderiza o
primeiro vídeo em segundos, de graça.

O tamanho sai de um modelo ajustado em 16 vídeos narrados de verdade:

```
segundos de fala = palavras ÷ 191 + 0,415 × (número de batidas)
```

**Por que não é só "palavras por minuto".** A primeira versão dividia palavras
pela duração total e dava 153 ppm. Isso errou 14% num vídeo de 13 minutos,
porque a conta mistura duas coisas: o ritmo de fala e o silêncio de borda fixo
que cada wav carrega. Numa batida de 3 segundos essa borda pesa muito; numa de
7,6 segundos quase desaparece. Taxa única não serve para os dois. Com o termo
por batida separado, o erro caiu para 0,8%.

Serve para montar e revisar o vídeo inteiro. Não serve para publicar: é
silêncio.

### `kokoro` — a voz de produção

Kokoro 82M em Modal, CPU, Apache 2.0, sem clonagem. Pede `MODAL_TTS_URL` no
ambiente. O app está em `modal-kokoro-ptbr/app.py`.

### `chatterbox` — voz clonada

Chatterbox pt-BR (Resemble AI, MIT), clona de uma referência de áudio. Fala
devagar (~150 ppm), então o núcleo acelera conforme `aceleracao` na marca. Todo
áudio sai com a marca d'água inaudível Perth da Resemble.

## Escrever um adaptador novo

Copie `estimativa.py`, que é o mais curto. Dois conselhos ganhos na prática:

1. **Teste em português antes de adotar.** O Qwen3-TTS foi publicado, testado e
   descartado: sai com sotaque de Portugal e o design de voz em pt-BR soou
   estrangeiro em três tentativas. Motor bom em inglês não é motor bom em
   português.
2. **Peça todos os trechos numa requisição**, não um por um. A latência de
   subida do modelo domina o custo.
