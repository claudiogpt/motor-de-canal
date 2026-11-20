# Motor de Canal — plugin

Doutrina e comandos para criar e operar um canal de vídeo curto automático.
Extraído de um canal em operação, não de teoria.

## O que está aqui e o que não está

```mermaid
flowchart LR
  subgraph P["plugin/ · o que o Diretório aceita"]
    S["9 skills<br/>doutrina, armadilhas,<br/>verificação"]
    C["4 comandos<br/>/canal-novo /produzir<br/>/verificar /publicar"]
  end
  subgraph R["repositório · o motor"]
    M["modelo/<br/>Remotion + Python<br/>render, narração, medidores"]
  end
  C -->|"/canal-novo busca"| M
  M -->|"copiado para"| N["pasta do seu canal"]
```

O Diretório Anthropic aceita, de organização não Verificada, **só texto**:
Markdown, JSON, YAML e imagem. O motor é Python, TypeScript e shell, então ele
fica no repositório, a um `git clone` de distância, e `/canal-novo` vai buscar.

| Você quer | Instale |
| --- | --- |
| só a doutrina, para aplicar no seu próprio sistema | este plugin |
| o sistema inteiro, render incluído | o marketplace do repositório (abaixo) |

```bash
# plugin + motor, numa tacada
/plugin marketplace add claudiogpt/motor-de-canal
```

Depois, `/canal-novo <pasta>`.

## As nove skills

| Skill | O que resolve |
| --- | --- |
| `motor-de-canal` | índice: qual das outras usar |
| `arquitetura-de-tempo` | o áudio manda no tempo, e por que não existe mux |
| `doutrina-editorial` | mecanismo em vez de torcida, steelman, fonte para todo número |
| `verificacao-por-medicao` | medir em frame, não olhar; o medidor não mede verdade |
| `armadilhas-de-plataforma` | capa preta, título que não é título, régua por altura |
| `historia-animada` | personagens e cena animada com motion-kit |
| `canal-novo` | a entrevista de seis perguntas |
| `producao-semanal` | a rodada de produção, do conceito ao agendamento |
| `documentacao-visual` | documentação para humanos é gráfico primeiro |

## Repositório, documentação e licença

Código, motor e os seis guias: <https://github.com/claudiogpt/motor-de-canal>

[MIT](LICENSE).
