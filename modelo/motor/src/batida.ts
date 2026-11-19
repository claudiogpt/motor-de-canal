import { useCurrentFrame, useVideoConfig } from "remotion";
import type { BatidaMedida, Temporizado } from "./tipos";

/**
 * O ritmo de um bloco: onde cada batida da voz comeca, em frames.
 *
 * As cenas usam isto em vez de atraso fixo. Um elemento com `naBatida: 2`
 * entra no frame em que a terceira fala comeca, nao num palpite de 7 frames
 * por item. Se a voz mudar, o grafico acompanha sozinho no proximo render.
 */
export type Ritmo = {
  /** Frame de inicio de cada batida, relativo ao bloco. */
  inicios: number[];
  /** Indice da batida que esta tocando (ou da ultima que comecou). */
  atual: number;
  /** O elemento ja entrou na tela? */
  entrou: (e: Temporizado) => boolean;
  /** Entre 0 e 1: o quanto o elemento ja entrou. 0 antes da sua batida. */
  entrada: (e: Temporizado, frames?: number) => number;
  /** Frames desde a batida do elemento. Negativo antes dela. */
  desde: (e: Temporizado) => number;
};

/** Sem `naBatida`, o elemento entra com a primeira batida do bloco. */
const qual = (e: Temporizado) => e.naBatida ?? 0;

export const useRitmo = (batidas: BatidaMedida[]): Ritmo => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const inicios = batidas.map((b) => Math.round(b.inicio * fps));

  let atual = 0;
  for (let i = 0; i < inicios.length; i++) {
    if (frame >= inicios[i]) atual = i;
  }

  // Uma batida fora da lista (roteiro com naBatida alto demais) cai na ultima,
  // em vez de sumir da tela sem aviso.
  const inicioDe = (n: number) =>
    inicios.length === 0 ? 0 : inicios[Math.min(Math.max(n, 0), inicios.length - 1)];

  const desde = (e: Temporizado) => frame - inicioDe(qual(e));

  const entrou = (e: Temporizado) => {
    if (desde(e) < 0) return false;
    if (e.ateBatida === undefined) return true;
    return frame < inicioDe(e.ateBatida);
  };

  const entrada = (e: Temporizado, frames = 9) => {
    if (!entrou(e)) return 0;
    const d = desde(e);
    return Math.max(0, Math.min(1, d / frames));
  };

  return { inicios, atual, entrou, entrada, desde };
};
