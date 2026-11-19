/**
 * Formato do carrossel.json. Um arquivo por carrossel, N slides dentro.
 *
 * DIFERENCA DE FUNDO EM RELACAO AO reel.json: SLIDE NAO TEM TEMPO.
 *
 * No Reel, quem manda no tempo e o audio: o bloco nao declara duracao, ela sai
 * da soma medida das batidas de voz. Aqui nao existe voz, nao existe duracao e
 * nao existe `naBatida`. Quem controla o ritmo e o dedo de quem desliza, e isso
 * muda o desenho de cada slide: nada entra em sequencia, tudo esta la de uma
 * vez. Um slide, uma ideia.
 *
 * Por isso os slides sao componentes ESTATICOS, sem useCurrentFrame e sem
 * spring. Reaproveitar as cenas dos Reels com `batidas: []` parece atalho e nao
 * e: `spring({frame: 0})` vale 0, nao 1, entao o texto sairia com opacity 0.
 * Animacao nao tem estado final acessivel sem avancar o tempo.
 *
 * Como nos Reels, fonte e aviso nao vao na tela: ficam em
 * conteudo/<dia>/legenda/fontes.json e entram na legenda do post.
 */

export type Cor = "normal" | "ouro" | "custo" | "fraco";

/**
 * As tres primitivas da marca (losango, barra, anel) carregam uma regra:
 * cheio e fato, vazado e hipotese. No carrossel o losango do slide herda isso.
 *
 * `fato`: numero medido, norma citada, serie publica.
 * `hipotese`: exemplo construido, estimativa, calculo nosso, cenario.
 */
export type Marca = "fato" | "hipotese";

type Base = { marca?: Marca };

/** Item de valor: rotulo a esquerda, valor a direita. */
export type Item = { rotulo: string; valor: string; cor?: Cor };

/** Uma coluna do slide de comparacao. */
export type Coluna = {
  nome: string;
  itens: Item[];
  /** Linha de fecho da coluna, em destaque. */
  destaque?: string;
};

export type Slide =
  /** Slide 1. Gancho em linhas de peso maximo. Obedece ao recorte da grade. */
  | (Base & { tipo: "capa"; linhas: { texto: string; cor?: Cor }[] })
  /** Uma ideia em prosa curta. Onde o conceito nao vira grafico. */
  | (Base & { tipo: "conceito"; titulo: string; corpo: string; nota?: string })
  /** Decomposicao numerica: de onde sai um total. */
  | (Base & { tipo: "conta"; titulo: string; itens: Item[]; total: Item })
  /** Dois regimes, dois paises, dois autores, encarados. */
  | (Base & { tipo: "comparacao"; titulo: string; colunas: [Coluna, Coluna] })
  /** A conclusao contraintuitiva. Leva o selo hanko, o unico vermelho. */
  | (Base & { tipo: "virada"; titulo: string; numero?: string; linhas: string[] })
  /** Fecho: pergunta aberta e o pedido de salvar. */
  | (Base & { tipo: "cta"; pergunta: string; acao: string });

export type CarrosselProps = {
  slug: string;
  /** Serie do canal, ex. "A Conta". Corre na vertical na margem esquerda. */
  serie: string;
  /** Slug do Reel de onde este carrossel deriva, para rastrear o acervo. */
  deriva?: string;
  slides: Slide[];
  /**
   * Qual slide renderizar, de 0 a N-1. O render-carrossel.sh chama o still uma
   * vez por slide, trocando so este campo.
   */
  slideAtual: number;
};
