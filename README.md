# Motor de Canal

Framework para gerar e operar canais de vídeo curto no YouTube e no Instagram.

Não é teoria. Saiu de um canal em produção (18 vídeos, 4 formatos, 3.085 views
no primeiro mês), e **cada regra aqui existe porque algo deu errado antes**.

## O que ele faz

Do conceito ao MP4 publicado, com o tempo saindo do áudio medido e o layout
conferido por medidor:

| Formato | Tamanho | Para onde |
| --- | --- | --- |
| Reel / Short | 1080x1920 | Instagram e YouTube |
| Vídeo longo | 1920x1080 | YouTube |
| Carrossel | 1080x1350 | Instagram |
| História animada | os dois | personagens desenhados por código |

## A ideia central

**O áudio manda no tempo.**

O JSON do vídeo não declara duração nenhuma. Ele declara **falas**. Um script
gera um arquivo de áudio por fala, mede cada um, e o render deriva a duração de
cada bloco dessa medição. Cada elemento do gráfico entra na batida da fala que
o enuncia.

**Não existe passo de mux depois do render**, e por isso não existe como a voz e
a tela saírem de sincronia: não há dois relógios para divergir, há um.

Antes dessa inversão, medido em nove vídeos: 76,6 segundos de tela parada sem
ninguém falando, 18% da semana, e a legenda sempre adiantada.

## Começar

```bash
# 1. instalar o plugin (dá as skills ao Claude Code)
claude plugin marketplace add <caminho-deste-repo>
claude plugin install motor-de-canal@motor-de-canal

# 2. criar um canal
/canal-novo meu-canal
```

Ou, sem a IA:

```bash
cp -r modelo meu-canal && cd meu-canal
npm --prefix motor install
# edite canal.json e marca/marca.json
python3 -I ferramentas/narrar.py conteudo/exemplo-tres-alugueis
./renderizar.sh conteudo/exemplo-tres-alugueis
python3 -I ferramentas/medir-reel.py conteudo/exemplo-tres-alugueis/out/reel.mp4
```

**Isso roda sem chave, sem GPU e sem custo.** O adaptador de voz padrão
(`estimativa`) gera silêncio do tamanho exato que a fala teria, então você monta,
renderiza, mede e revisa o vídeo inteiro de graça. Só a publicação exige voz de
verdade.

## O que você precisa ter

- `ffmpeg` e `python3` (nada além da biblioteca padrão)
- `node` 20+, para o Remotion
- Opcional: uma conta no Modal, para a voz; uma conta de agendamento, para
  publicar

## Documentação

| Para | Leia |
| --- | --- |
| Entender como funciona | [docs/01-como-funciona.md](docs/01-como-funciona.md) |
| Criar o seu canal | [docs/02-criar-um-canal.md](docs/02-criar-um-canal.md) |
| Produzir uma semana | [docs/03-producao-semanal.md](docs/03-producao-semanal.md) |
| Histórias com personagens | [docs/04-historias-animadas.md](docs/04-historias-animadas.md) |
| O que aprendemos errando | [docs/05-licoes-aprendidas.md](docs/05-licoes-aprendidas.md) |

A doutrina que a IA segue está em
[plugins/motor-de-canal/skills/](plugins/motor-de-canal/skills/). Vale a leitura
mesmo para quem não usa IA: é o manual do canal.

## Licença

MIT. O [motion-kit](https://github.com/Gaok1/motion-kit), usado nas histórias
animadas e fixado no commit `459b0ee`, também é MIT.
