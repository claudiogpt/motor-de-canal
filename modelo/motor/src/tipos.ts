/**
 * Formato do reel.json de cada dia. Um arquivo por Reel.
 *
 * Fontes e avisos nao vao na tela: ficam em conteudo/<dia>/legenda/fontes.json
 * e entram na legenda do post (ver montar-legenda.py).
 *
 * QUEM MANDA NO TEMPO E O AUDIO.
 *
 * Nenhum bloco declara duracao. Cada bloco declara `falas`, e a duracao de tela
 * sai da soma real das suas batidas, medida depois de gerar a voz
 * (narrar_batidas.py escreve audio/tempos.json). Antes era o contrario: a
 * duracao era digitada a mao e a legenda era distribuida por contagem de
 * caractere dentro dela. Numa semana inteira isso deu 18% de tela parada sem
 * ninguem falando, e a legenda sempre adiantada em relacao a voz.
 *
 * Cada elemento visual diz em qual batida aparece (`naBatida`), e opcionalmente
 * em qual batida sai (`ateBatida`). Assim o grafico se monta junto com a fala,
 * em vez de a tela esperar a voz.
 */

/** Um elemento que entra na tela junto com uma batida da narracao. */
export type Temporizado = {
  /** Indice da batida (0 = primeira fala do bloco) em que o elemento entra. */
  naBatida?: number;
  /** Indice da batida em que o elemento sai. Sem isto, fica ate o fim do bloco. */
  ateBatida?: number;
};

export type Linha = Temporizado & {
  texto: string;
  cor?: "ouro" | "custo" | "normal";
};

export type Degrau = Temporizado & { horas: string; quando: string };

export type Saida = Temporizado & {
  titulo: string;
  /** Linha de baixo do cartao. Vermelho de custo por padrao. */
  quemPaga: string;
  /** "ouro" quando a linha de baixo e um vencedor, nao um custo. */
  cor?: "ouro" | "custo";
};

/** Uma seta do ciclo: quem ganha de quem, e com que placar. */
export type SetaCiclo = Temporizado & {
  de: number;
  para: number;
  rotulo?: string;
  /** Expectativa que o video vai desmentir: tracejada, sem placar. */
  fantasma?: boolean;
  /** A seta que fecha o circulo, no vermelho de custo. */
  custo?: boolean;
};

export type Votante = { nome: string; ordem: string[] };

/** Frase de cima de uma cena grafica: diz o que o grafico faz naquela batida. */
export type Legenda = Temporizado & { texto: string; cor?: "ouro" | "custo" | "normal" };

/** Um candidato na regua: quadros-chave de posicao (0 a 10), um por batida. */
export type CandidatoRegua = {
  nome: string;
  cor?: "ouro" | "normal";
  posicoes: (Temporizado & { x: number })[];
};

/** Um grupo de barras (um pais, uma sociedade): uma barra por familia. */
export type GrupoBarras = Temporizado & {
  nome: string;
  subtitulo?: string;
  valores: number[];
  rotulos?: string[];
};

/** Um no da cena `rede`: quem contribui, e de onde (ou o que faz). */
export type NoRede = Temporizado & { titulo: string; sub?: string; cor?: "ouro" | "custo" };

type Comum = { falas: string[] };

export type Bloco =
  | (Comum & { tipo: "gancho"; linhas: Linha[] })
  | (Comum & {
      tipo: "escada";
      titulo: string;
      degraus: Degrau[];
      rodape: { rotulo: string; agora: string; depois: string; fim?: string };
    })
  | (Comum & { tipo: "setas"; origem: string; saidas: Saida[] })
  | (Comum & {
      tipo: "ciclo";
      /** Os tres nos do ciclo, no sentido do relogio a partir do topo. */
      nos: string[];
      setas: SetaCiclo[];
      /** Faixa com as preferencias de cada votante, para o dado ficar a vista. */
      perfil?: Votante[];
      selo?: Temporizado & { texto: string };
    })
  | (Comum & {
      tipo: "regua";
      /** Posicao de cada eleitor, de 0 (esquerda) a 10 (direita). */
      eleitores: number[];
      extremos: [string, string];
      candidatos: CandidatoRegua[];
      /** A partir desta batida cada eleitor pinta na cor do candidato mais perto. */
      votos?: Temporizado;
      mediano?: Temporizado & { texto: string };
      legendas?: Legenda[];
      selo?: Temporizado & { texto: string };
    })
  | (Comum & {
      tipo: "barras";
      grupos: GrupoBarras[];
      unidade?: string;
      legendas?: Legenda[];
      veu?: Temporizado & { texto: string };
      pior?: Temporizado & { texto?: string };
      vencedor?: Temporizado & { grupo: number; texto: string };
      cresce?: Temporizado & { grupo: number; indice: number; rotulo: string; contador?: string };
      pergunta?: Temporizado & { texto: string };
      /** Antes e depois de cada valor na tela: "R$ ", "%". Os valores ficam so numero. */
      prefixo?: string;
      sufixo?: string;
    })
  | (Comum & {
      tipo: "rede";
      centro: { texto: string; cor?: "ouro" | "custo"; icone?: "lapis" };
      nos: NoRede[];
      /** A partir desta batida, pontos correm do centro para cada no: o sinal se espalhando. */
      pulso?: Temporizado;
      legendas?: Legenda[];
      selo?: Temporizado & { texto: string };
    })
  | (Comum & {
      tipo: "piramide";
      /** Quem organiza (indice de 0 a 9 na fila): destaca nesta batida e vai para o topo. */
      organiza: Temporizado & { indice: number };
      /** Batida em que a fila vira piramide. */
      formar: Temporizado;
      topo?: Temporizado & { texto: string };
      legendas?: Legenda[];
      selo?: Temporizado & { texto: string };
    })
  | (Comum & {
      tipo: "contrato";
      titulo: string;
      /** Caixas que se marcam sozinhas, uma por batida (consentimento tacito). */
      clausulas?: Linha[];
      /** Sem naBatida a linha fica vazia, com cursor piscando. */
      assinatura: Temporizado & { texto?: string; rotulo?: string };
      carimbo?: Temporizado & { texto: string };
      legendas?: Legenda[];
      selo?: Temporizado & { texto: string };
    })
  | (Comum & { tipo: "cta"; pergunta: string; acao: string });

/** Uma batida medida: o arquivo de voz e onde ela cai dentro do bloco. */
export type BatidaMedida = {
  bloco: number;
  batida: number;
  arquivo: string;
  duracao: number;
  inicio: number;
  fala: string;
};

export type BlocoMedido = {
  bloco: number;
  tipo: string;
  duracao: number;
  batidas: BatidaMedida[];
};

/** audio/tempos.json, escrito por narrar_batidas.py. */
export type Tempos = {
  fps: number;
  motor: string;
  voz: string;
  total: number;
  respiro_batida: number;
  respiro_bloco: number;
  blocos: BlocoMedido[];
};

export type ReelProps = {
  slug: string;
  serie: string;
  fps: number;
  blocos: Bloco[];
  /**
   * Medicoes da voz, injetadas pelo render.sh a partir de audio/tempos.json.
   * Sem isto nao ha como saber a duracao de nada, e o render para.
   */
  tempos: Tempos;
  /** Pasta publica onde os wav do dia foram ligados, ex. "dia-audio". */
  audioBase: string;
};
