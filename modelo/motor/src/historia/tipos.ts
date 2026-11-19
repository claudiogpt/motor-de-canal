import type { BatidaMedida, Tempos } from "../tipos";

/** Uma batida com o tempo ABSOLUTO no vídeo, não relativo ao bloco. */
export type BatidaAbsoluta = BatidaMedida & {
  /** Segundos desde o início do vídeo. */
  t: number;
  /** Nome da cue no motion-kit: "b03-01". */
  cue: string;
  /** Bloco a que pertence. */
  bloco: number;
};

export type BlocoHistoria = {
  tipo: "cena";
  /** Qual cena do catálogo desenhar. Veja src/historia/cenas.tsx. */
  cena: string;
  /** Tudo que a cena precisa. O formato é da cena, não do motor. */
  dados?: Record<string, unknown>;
  falas: (string | { fala: string; falaLiteral?: string })[];
};

export type HistoriaProps = {
  slug: string;
  serie?: string;
  fps?: number;
  /** 9:16 para Reel e Short, 16:9 para YouTube. */
  formato?: "9:16" | "16:9";
  blocos: BlocoHistoria[];
  tempos?: Tempos;
  audioBase?: string;
};
