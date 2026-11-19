/**
 * Camada de movimento do video longo.
 *
 * Por que isto existe: ate 05/11/2026 toda cena do longo era um fade de 10
 * frames e depois tela parada. Em Reel de 30 s isso passa; em 13 minutos o
 * video parece um slide atras do outro, e o Claudio reprovou com essas
 * palavras ("queria mais movimento, motion design"). O que falta nao e
 * animacao de entrada, e movimento CONTINUO: alguma coisa precisa estar
 * andando enquanto a voz fala.
 *
 * A regra que nao pode quebrar: nada aqui muda a linha do tempo. O tempo de
 * cada bloco continua sendo a soma medida das batidas de voz. Transicao que
 * sobrepoe blocos (TransitionSeries) deslocaria isso e tiraria a voz de
 * sincronia, entao entrada e saida acontecem DENTRO dos frames do proprio
 * bloco.
 */

import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { BatidaMedida, Temporizado } from "./tipos";

/** Suaviza 0..1 nas duas pontas. Serve para quase toda entrada. */
export const suave = (x: number) => {
  const t = Math.max(0, Math.min(1, x));
  return t * t * (3 - 2 * t);
};

/**
 * Progresso de 0 a 1 ao longo da batida que enuncia cada elemento.
 *
 * E com isto que uma linha se desenha, um numero sobe ou um ponto anda "na
 * velocidade da fala": a duracao vem do wav medido, nao de um palpite. Depois
 * que a batida acaba, fica em 1.
 */
export const useProgresso = (batidas: BatidaMedida[]) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // Devolve uma FUNCAO em vez de um numero, e e chamado uma vez por cena.
  // Se fosse um hook por elemento, toda cena que desenha uma lista teria de
  // chama-lo dentro de map() ou dentro de um if, o que quebra a regra de
  // hooks do React na primeira cena que mudar de forma.
  return (e: Temporizado, { atraso = 0, parte = 1 } = {}) => {
    const n = Math.min(Math.max(e.naBatida ?? 0, 0), Math.max(batidas.length - 1, 0));
    const b = batidas[n];
    if (!b) return 0;
    const ini = b.inicio * fps + atraso;
    const dur = Math.max(1, b.duracao * fps * parte);
    return suave((frame - ini) / dur);
  };
};

/**
 * Deriva lenta do bloco inteiro: escala de 1 a 1,035 e um passeio de poucos
 * pixels ao longo de toda a sua duracao.
 *
 * Imperceptivel quadro a quadro, decisivo no conjunto: e o que tira a sensacao
 * de slide. A amplitude e pequena de proposito, porque o conteudo precisa
 * continuar dentro dos 864 px uteis no ponto de maior extensao.
 */
export const Respira: React.FC<{
  dur: number;
  children: React.ReactNode;
  /** Varia o sentido do passeio por bloco, para nao ficar repetitivo. */
  semente?: number;
}> = ({ dur, children, semente = 0 }) => {
  const frame = useCurrentFrame();
  const t = dur > 1 ? frame / dur : 0;
  const lado = semente % 2 === 0 ? 1 : -1;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        transform: `scale(${1 + t * 0.022}) translate(${lado * t * 7}px, ${-t * 4}px)`,
        // Origem no centro da AREA UTIL (84 a 948), nao do quadro (540). Com a
        // origem no meio do quadro a escala empurrava o topo mais que a base, e
        // no fim do bloco o titulo passava dos 84 px: 72 quadros estourando,
        // medidos na teia e na balanca. A amplitude tambem baixou, porque o
        // ganho visual dela e pequeno e o risco de estouro nao e.
        transformOrigin: `center ${(84 + 948) / 2}px`,
      }}
    >
      {children}
    </div>
  );
};

/**
 * Abre e fecha o bloco dentro dos frames dele proprio.
 *
 * Entra subindo 22 px em 12 frames, sai descendo 16 px nos ultimos 8. Nunca
 * encosta no bloco vizinho, entao a linha do tempo do audio fica intacta.
 */
export const Entra: React.FC<{ dur: number; children: React.ReactNode }> = ({ dur, children }) => {
  const frame = useCurrentFrame();
  const abre = suave(frame / 12);
  const fecha = dur > 10 ? suave((dur - frame) / 8) : 1;
  const o = Math.min(abre, fecha);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: o,
        transform: `translateY(${(1 - abre) * 22 - (1 - fecha) * 16}px)`,
      }}
    >
      {children}
    </div>
  );
};

/**
 * Traco que se desenha. `p` de 0 a 1 revela o caminho do inicio ao fim.
 *
 * Usa stroke-dasharray com o comprimento declarado, em vez de medir o path no
 * DOM: medir exigiria ref e layout effect, que no Remotion roda fora de ordem
 * entre quadros e produz o primeiro frame errado.
 */
export const Traco: React.FC<{
  d: string;
  p: number;
  comp: number;
  cor: string;
  larg?: number;
  tracejado?: boolean;
}> = ({ d, p, comp, cor, larg = 6, tracejado }) => (
  <path
    d={d}
    fill="none"
    stroke={cor}
    strokeWidth={larg}
    strokeLinecap="round"
    strokeDasharray={tracejado ? `18 14` : comp}
    strokeDashoffset={tracejado ? 0 : comp * (1 - Math.max(0, Math.min(1, p)))}
    opacity={tracejado ? Math.max(0, Math.min(1, p)) : 1}
  />
);

/** Numero que sobe ate o valor, no ritmo da fala. Sem casa decimal. */
export const Contador: React.FC<{
  ate: number;
  p: number;
  sufixo?: string;
  separador?: boolean;
}> = ({ ate, p, sufixo = "", separador }) => {
  const v = Math.round(ate * Math.max(0, Math.min(1, p)));
  return <>{(separador ? v.toLocaleString("pt-BR") : String(v)) + sufixo}</>;
};

/** Sorteio determinístico: mesma semente, mesmo resultado em todo render. */
export const sorte = (semente: number) => {
  const x = Math.sin(semente * 127.1) * 43758.5453;
  return x - Math.floor(x);
};

export const faixa = (x: number, a: number, b: number) => interpolate(x, [0, 1], [a, b]);
