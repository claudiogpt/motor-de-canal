# Adaptador de publicação: o contrato

Um adaptador de publicação é um arquivo nesta pasta que expõe **duas funções**:

```python
def preparar(post: dict) -> dict:
    """Monta o payload da plataforma a partir do Post neutro. NÃO envia nada."""

def publicar(payload: dict, quando: str | None) -> dict:
    """Envia. `quando` é ISO 8601 com offset, ou None para agora."""
```

`preparar` é separada de `publicar` de propósito: ela não tem efeito nenhum e
pode ser inspecionada antes de qualquer coisa sair daqui.

## O `Post`, que é o formato neutro

| Campo | O quê |
| --- | --- |
| `pasta` | a pasta do vídeo |
| `arquivo` | o mp4, ou a lista de png do carrossel |
| `titulo` | o que o dono aprovou |
| `legenda` | montada por `ferramentas/montar-legenda.py` |
| `legendaInstagram` | sem links, abrindo pelo título |
| `capaInstagramMs` | de `ferramentas/capa-instagram.py` |
| `capaYouTube` | de `ferramentas/capa-youtube.py` |
| `plataformas` | lista |
| `quando` | ISO 8601 **com offset explícito** |

Nenhum campo tem nome de API. Trocar de serviço de agendamento mexe só no
adaptador, nunca no resto do canal.

## Os adaptadores que vêm no modelo

### `manual` — o padrão

Não publica. Escreve `conteudo/<dia>/publicar/` com o vídeo, as capas, o texto
de cada plataforma e um `INSTRUCOES.md` dizendo o que colar onde, inclusive
**em que segundo arrastar a capa do Reel** no aplicativo.

É o padrão porque um canal novo não tem conta de agendamento, e porque subir à
mão com a lista certa na frente erra menos que subir por API com um campo
faltando.

### `zernio` — API de agendamento

Está em `zernio.md`, como roteiro, porque a Zernio se usa por ferramenta MCP e
não por biblioteca. As armadilhas estão lá, no passo em que cada uma morde.

Ele **não** aplica a capa do Short: isso só funciona depois do vídeo no ar, e
por isso é um passo separado que ninguém dispara sozinho.

## Escrever um adaptador novo

Copie `manual.py`. Três conselhos ganhos errando:

1. **Mensagem de sucesso da API não é prova.** Confira onde o público vê:
   oembed para título, grade do perfil para capa de Instagram, URL assinada
   para capa de Short.
2. **Saiba o que NÃO dá para corrigir depois.** No Instagram, capa e legenda de
   post publicado não mudam por API. Áudio não muda em lugar nenhum.
3. **Nunca publique sem o aval do dono.** O adaptador recebe o que já foi
   aprovado; ele não decide.
