/**
 * Vocabulario de figuras do video longo.
 *
 * Desenhadas em SVG aqui dentro, nunca geradas por IA: a regra da casa proibe
 * imagem de figura publica feita por IA, e gerar imagem custaria GPU e pediria
 * confirmacao a cada render. O estilo e o da capa que o dono do canal aprovou:
 * silhueta grande e fechada, que continua legivel pequena.
 *
 * Sao poucas pecas de proposito. A 3 videos por semana, o que serve e um
 * vocabulario reutilizavel de meia duzia de formas, nao 46 animacoes de uso
 * unico.
 */

import React from "react";
import { c } from "../brand";
import { sorte, Traco } from "./movimento";

/**
 * Pictograma de pessoa: cabeca e tronco, numa forma so.
 *
 * `p` de 0 a 1 faz ela surgir crescendo a partir da base, que e como um grupo
 * inteiro aparece "se juntando" em vez de piscar na tela.
 */
export const Pessoa: React.FC<{
  x: number;
  y: number;
  alt?: number;
  cor?: string;
  p?: number;
  /** Desenha a silhueta so com contorno. Serve para quem ainda nao entrou. */
  vazada?: boolean;
}> = ({ x, y, alt = 100, cor = c.text, p = 1, vazada }) => {
  // Desenhada centrada em (x, y), ocupando de -alt/2 a +alt/2. A primeira
  // versao punha a cabeca em -32 e o tronco em +50, o que deixava um vao de
  // 82 unidades entre as duas: na tela nao lia como pessoa, lia como duas
  // manchas. Agora o arco dos ombros sobe ate encostar na cabeca.
  const k = alt / 100;
  const e = Math.max(0, Math.min(1, p));
  return (
    <g transform={`translate(${x} ${y}) scale(${e * k}) translate(${-x} ${-y})`} opacity={e}>
      <circle
        cx={x}
        cy={y - 27}
        r={21}
        fill={vazada ? "none" : cor}
        stroke={cor}
        strokeWidth={vazada ? 6 : 0}
      />
      <path
        d={`M ${x - 34} ${y + 50} L ${x - 34} ${y + 20} A 34 34 0 0 1 ${x + 34} ${y + 20} L ${x + 34} ${y + 50} Z`}
        fill={vazada ? "none" : cor}
        stroke={cor}
        strokeWidth={vazada ? 6 : 0}
        strokeLinejoin="round"
      />
    </g>
  );
};

/** Espada, de ponta para cima. A peca do Ato 2 e da capa. */
export const Espada: React.FC<{ x: number; y: number; alt?: number; cor?: string; p?: number }> = ({
  x,
  y,
  alt = 150,
  cor = c.gold,
  p = 1,
}) => {
  const k = alt / 150;
  const e = Math.max(0, Math.min(1, p));
  return (
    <g opacity={e} transform={`translate(${x} ${y}) scale(${k}) rotate(${(1 - e) * -25})`}>
      <path d="M 0 -74 L 7 -52 L 7 14 L -7 14 L -7 -52 Z" fill={cor} />
      <rect x={-22} y={14} width={44} height={8} rx={4} fill={cor} />
      <rect x={-5} y={22} width={10} height={26} rx={5} fill={cor} />
    </g>
  );
};

/**
 * Anel de pessoas com uma figura fora dele.
 *
 * E o Ato 2 inteiro num desenho: o pacto e de cada um com todos os outros, e
 * o soberano nao assina nada. Mesma composicao da capa aprovada, agora com o
 * anel se fechando no ritmo da fala.
 */
export const Anel: React.FC<{
  cx: number;
  cy: number;
  r: number;
  n?: number;
  /** 0 a 1: quantas pessoas do anel ja entraram. */
  p?: number;
  /** 0 a 1: o quanto o traco que liga o anel ja se desenhou. */
  pLigacao?: number;
  cor?: string;
}> = ({ cx, cy, r, n = 9, p = 1, pLigacao = 0, cor = c.text }) => {
  const circ = 2 * Math.PI * r;
  return (
    <g>
      <Traco
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy} A ${r} ${r} 0 0 1 ${cx - r} ${cy}`}
        p={pLigacao}
        comp={circ}
        cor={c.goldDim}
        larg={4}
      />
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2 - Math.PI / 2;
        const entrou = Math.max(0, Math.min(1, p * n - i));
        return (
          <Pessoa
            key={i}
            x={cx + Math.cos(a) * r}
            y={cy + Math.sin(a) * r}
            alt={54}
            cor={cor}
            p={entrou}
          />
        );
      })}
    </g>
  );
};

/**
 * Teia de confianca: n pontos num circulo, todos ligados entre si.
 *
 * Com 2 pessoas e 1 ligacao. Com 10, sao 45. E o Ato 1 na tela, e o numero
 * desenhado e sempre combinacao de n tomados 2 a 2, calculada aqui, nunca
 * digitada no JSON: assim o desenho e a conta nao tem como divergir.
 */
export const Teia: React.FC<{
  cx: number;
  cy: number;
  r: number;
  /** Achatamento: o raio horizontal e r * largo. */
  largo?: number;
  n: number;
  /** 0 a 1: quantas das ligacoes ja se desenharam. */
  p?: number;
  cor?: string;
}> = ({ cx, cy, r, largo = 1.5, n, p = 1, cor = c.goldDim }) => {
  const pos = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return { x: cx + Math.cos(a) * r * largo, y: cy + Math.sin(a) * r };
  });
  const pares: [number, number][] = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) pares.push([i, j]);
  const quantas = pares.length * Math.max(0, Math.min(1, p));
  return (
    <g>
      {pares.map(([i, j], k) => {
        const o = Math.max(0, Math.min(1, quantas - k));
        if (o <= 0) return null;
        return (
          <line
            key={k}
            x1={pos[i].x}
            y1={pos[i].y}
            x2={pos[i].x + (pos[j].x - pos[i].x) * o}
            y2={pos[i].y + (pos[j].y - pos[i].y) * o}
            stroke={cor}
            strokeWidth={3}
            strokeLinecap="round"
          />
        );
      })}
      {pos.map((q, i) => (
        <Pessoa key={i} x={q.x} y={q.y} alt={n > 4 ? 46 : 78} cor={c.text} />
      ))}
    </g>
  );
};

/** Quantas ligacoes uma teia de n pontos tem. Usada na tela e na conferencia. */
export const ligacoes = (n: number) => (n * (n - 1)) / 2;

/**
 * Grade de 100 quadrados com k acesos.
 *
 * Para proporcao, le muito melhor que barra: o espectador conta sem querer, e
 * "36 em 100" fica concreto. Os acesos sao os primeiros 36, nao sorteados,
 * para a leitura ser estavel entre quadros.
 */
export const Waffle: React.FC<{
  x: number;
  y: number;
  lado?: number;
  gap?: number;
  k: number;
  /** 0 a 1: quantos dos k acesos ja acenderam. */
  p?: number;
  corAceso?: string;
  corApagado?: string;
}> = ({ x, y, lado = 46, gap = 10, k, p = 1, corAceso = c.cost, corApagado = c.rule }) => {
  const acesos = k * Math.max(0, Math.min(1, p));
  return (
    <g>
      {Array.from({ length: 100 }, (_, i) => {
        const col = i % 10;
        const lin = Math.floor(i / 10);
        const dentro = i < k;
        const o = dentro ? Math.max(0, Math.min(1, acesos - i)) : 0;
        return (
          <rect
            key={i}
            x={x + col * (lado + gap)}
            y={y + lin * (lado + gap)}
            width={lado}
            height={lado}
            rx={8}
            fill={o > 0 ? corAceso : "none"}
            stroke={o > 0 ? corAceso : corApagado}
            strokeWidth={3}
            opacity={o > 0 ? 0.25 + 0.75 * o : 1}
          />
        );
      })}
    </g>
  );
};

/**
 * Balanca de dois pratos. `inclina` de -1 a 1 pende para um lado.
 *
 * E o Ato 2 ("um soberano ruim e ruim, a guerra de todos e pior") e o Ato 7
 * ("eles pesam riscos diferentes"), que e a tese do video.
 */
export const Balanca: React.FC<{
  cx: number;
  cy: number;
  larg?: number;
  inclina?: number;
  cor?: string;
}> = ({ cx, cy, larg = 420, inclina = 0, cor = c.gold }) => {
  const g = Math.max(-1, Math.min(1, inclina)) * 11;
  const meia = larg / 2;
  return (
    <g>
      <rect x={cx - 7} y={cy} width={14} height={190} rx={7} fill={cor} />
      <rect x={cx - 90} y={cy + 186} width={180} height={16} rx={8} fill={cor} />
      <g transform={`rotate(${g} ${cx} ${cy})`}>
        <rect x={cx - meia} y={cy - 8} width={larg} height={14} rx={7} fill={cor} />
        {[-1, 1].map((s) => (
          <g key={s}>
            <line
              x1={cx + s * meia}
              y1={cy}
              x2={cx + s * meia}
              y2={cy + 64}
              stroke={cor}
              strokeWidth={4}
            />
            <path
              d={`M ${cx + s * meia - 72} ${cy + 64} h 144 l -28 72 h -88 Z`}
              fill="none"
              stroke={cor}
              strokeWidth={7}
              strokeLinejoin="round"
            />
          </g>
        ))}
      </g>
    </g>
  );
};

/**
 * Agencias que convergem: muitos pontos que caminham para um so.
 *
 * E o argumento de Nozick no Ato 5, que e o momento mais forte do video, e
 * hoje esta contado em cartao de texto. `p` leva de disperso a convergido.
 */
export const Convergencia: React.FC<{
  cx: number;
  cy: number;
  r: number;
  n?: number;
  p?: number;
}> = ({ cx, cy, r, n = 7, p = 0 }) => {
  const t = Math.max(0, Math.min(1, p));
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2 - Math.PI / 2;
        // cada agencia sai de uma distancia propria, para nao marcharem juntas
        const d = r * (0.7 + sorte(i + 1) * 0.5);
        const x0 = cx + Math.cos(a) * d;
        const y0 = cy + Math.sin(a) * d;
        const x = x0 + (cx - x0) * t;
        const y = y0 + (cy - y0) * t;
        const sobra = i === 0 ? 1 : 1 - t;
        return (
          <g key={i}>
            <line x1={x0} y1={y0} x2={x} y2={y} stroke={c.goldDim} strokeWidth={3} opacity={0.5 * t} />
            <circle
              cx={x}
              cy={y}
              r={i === 0 ? 30 + t * 46 : 26 * (1 - 0.6 * t)}
              fill={i === 0 ? c.gold : "none"}
              stroke={i === 0 ? c.gold : c.textMuted}
              strokeWidth={4}
              opacity={i === 0 ? 1 : Math.max(0.45, sobra)}
            />
          </g>
        );
      })}
    </g>
  );
};
