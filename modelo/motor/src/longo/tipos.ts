import type { BatidaMedida, Temporizado, Tempos } from "../tipos";

export type { BatidaMedida, Temporizado, Tempos };

/** Humor do mascote, como texto no JSON. */
export type Humor2 = string;

export type Cor = "normal" | "ouro" | "custo" | "fraco" | "ok";

/** Linha de texto do gancho e de cenas de declaracao. */
export type LinhaL = Temporizado & {
  texto: string;
  cor?: Cor;
  /** Risca o texto na batida indicada. Serve para desmentir uma afirmacao. */
  riscaNa?: number;
};

/** Degrau da escada horizontal: 44 h -> 42 h -> 40 h. */
export type DegrauL = Temporizado & { valor: string; quando: string; cor?: Cor };

/** Cartao de uma fileira. Cobre saidas, indicadores e pontos em aberto. */
export type CartaoL = Temporizado & {
  titulo: string;
  sub?: string;
  /** Terceira linha, menor: fonte do dado ou detalhe. */
  nota?: string;
  cor?: Cor;
};

/** Coluna de comparacao, com um valor grande. */
export type ColunaL = Temporizado & {
  rotulo: string;
  valor: string;
  sub?: string;
  cor?: Cor;
};

/** Fatia de uma barra proporcional. O peso e relativo, nao precisa somar 100. */
export type FatiaL = Temporizado & {
  rotulo: string;
  peso: number;
  valor?: string;
  cor?: Cor;
};

/** Evento da linha do tempo. */
export type EventoL = Temporizado & {
  quando: string;
  texto: string;
  sub?: string;
  cor?: Cor;
};

/** Barra de comparacao de grandeza, para o 4,76% contra o 0,6%. */
/** Celula de uma grade 2x2. `col` e `lin` sao 0 ou 1. */
export type CelulaL = Temporizado & {
  col: number;
  lin: number;
  texto: string;
  cor?: Cor;
};

export type MedidaL = Temporizado & {
  rotulo: string;
  valor: number;
  texto: string;
  cor?: Cor;
};


/** Etapa da teia: quantas pessoas estao no circulo nesta batida. */
export type EtapaTeiaL = Temporizado & { n: number; rotulo?: string };

/** Item de uma fileira de pictogramas. `forma` escolhe o desenho. */
export type ItemFiguraL = Temporizado & { rotulo: string; forma: string; cor?: Cor };

/**
 * Reacao do mascote num bloco. Ele aparece no canto, na batida indicada, e
 * fica ate o fim do bloco. Nao e obrigatorio: bloco sem isto nao mostra o
 * mascote, que e o caso da maioria.
 */
export type MascoteL = Temporizado & {
  humor: string;
  /** Canto onde ele entra. Padrao: direita. */
  lado?: "esq" | "dir";
};

type Comum = { falas: string[]; titulo?: string; mascote?: MascoteL };

export type BlocoL =
  | (Comum & { tipo: "gancho"; linhas: LinhaL[] })
  | (Comum & { tipo: "escada"; degraus: DegrauL[]; nota?: Temporizado & { texto: string } })
  | (Comum & { tipo: "cartoes"; cartoes: CartaoL[] })
  | (Comum & { tipo: "colunas"; colunas: ColunaL[]; nota?: Temporizado & { texto: string } })
  | (Comum & { tipo: "fatias"; fatias: FatiaL[]; total?: string; nota?: Temporizado & { texto: string } })
  | (Comum & { tipo: "linha"; eventos: EventoL[] })
  | (Comum & { tipo: "medidas"; medidas: MedidaL[]; nota?: Temporizado & { texto: string } })
  | (Comum & { tipo: "grade"; colunas: [string, string]; linhas2: [string, string]; celulas: CelulaL[]; destaque?: Temporizado & { lin: number; texto?: string } })
  | (Comum & { tipo: "declara"; linhas: LinhaL[] })
  | (Comum & { tipo: "frase"; selo?: string; linhas: LinhaL[] })
  | (Comum & { tipo: "teia"; etapas: EtapaTeiaL[] })
  | (Comum & { tipo: "figuras"; itens: ItemFiguraL[] })
  | (Comum & { tipo: "anel"; soberano?: Temporizado & { rotulo?: string }; corte?: Temporizado })
  | (Comum & { tipo: "waffle"; k: number; rotulo: string; rotuloResto?: string; nota?: Temporizado & { texto: string } })
  | (Comum & { tipo: "balanca"; esquerda: string; direita: string; pende?: Temporizado & { lado: "esquerda" | "direita" } })
  | (Comum & { tipo: "convergencia"; etapas: (Temporizado & { rotulo: string })[] })
  | (Comum & { tipo: "numero"; valor: number; sufixo?: string; rotulo: string; antes?: Temporizado & { valor: number; rotulo: string } })
  | (Comum & { tipo: "professora"; quadro: LinhaL[]; pose?: Humor2 })
  | (Comum & { tipo: "cta"; pergunta: string; opcoes?: string[]; acao: string });

export type LongoProps = {
  slug: string;
  titulo: string;
  fps: number;
  blocos: BlocoL[];
  tempos: Tempos;
  audioBase: string;
};
