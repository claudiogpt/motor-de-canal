import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { c, fonts, safe, coluna } from "../brand";
import { useRitmo } from "../batida";
import { Legendas, SeloRef } from "./Regua";
import type { BatidaMedida, Legenda, Temporizado } from "../tipos";

/**
 * Dez pessoas lado a lado, no mesmo nivel, que se reorganizam numa piramide
 * de 1, 2, 3 e 4. E a lei de ferro da oligarquia desenhada: o grupo nasce
 * horizontal e, quando `formar` entra, cada pessoa anda ate o seu degrau.
 *
 *  - `organiza`: a pessoa que organiza (indice na fila) ganha a cor clara e e
 *    ela que vai para o topo. Ela ja se destaca antes da piramide, na fala que
 *    diz quem guarda a lista;
 *  - `topo`: rotulo em cima de quem chegou ao topo;
 *  - os degraus sao linhas que aparecem junto com a piramide.
 *
 * A posicao de cada pessoa e interpolada da fila para o degrau no tempo da
 * fala, com um pequeno atraso por pessoa para a reorganizacao ser visivel.
 */

const W = 1080 - coluna.left - coluna.right; // 788
const TOPO = safe.top + 230;
const H = 860;
const CX = W / 2;
const N = 10;
const FILA_Y = 470;
const FILA_PASSO = 76;
const DEGRAU_Y = [230, 390, 550, 710];
const DEGRAU_PASSO = 160;

/** Os lugares da piramide, de cima para baixo: 1, 2, 3 e 4 pessoas. */
const LUGARES = DEGRAU_Y.flatMap((y, k) =>
  Array.from({ length: k + 1 }, (_, j) => ({ x: CX + (j - k / 2) * DEGRAU_PASSO, y })),
);

const Pessoa: React.FC<{ x: number; y: number; cor: string; escala: number }> = ({ x, y, cor, escala }) => (
  <g transform={`translate(${x}, ${y}) scale(${escala})`}>
    <circle cx={0} cy={-52} r={20} fill={cor} />
    <rect x={-26} y={-26} width={52} height={66} rx={18} fill={cor} />
  </g>
);

export const Piramide: React.FC<{
  organiza: Temporizado & { indice: number };
  formar: Temporizado;
  topo?: Temporizado & { texto: string };
  legendas?: Legenda[];
  selo?: Temporizado & { texto: string };
  batidas: BatidaMedida[];
}> = ({ organiza, formar, topo, legendas = [], selo, batidas }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const r = useRitmo(batidas);

  // Quem organiza vai para o lugar 0 (o topo); os outros enchem os degraus na
  // ordem da fila.
  const ordem = [organiza.indice, ...Array.from({ length: N }, (_, i) => i).filter((i) => i !== organiza.indice)];
  const lugarDe = (i: number) => LUGARES[ordem.indexOf(i)];

  const destaque = r.entrada(organiza, 12);
  const degraus = r.entrada(formar, 20);
  const tE = topo ? r.entrada(topo, 12) : 0;

  return (
    <AbsoluteFill>
      <Legendas legendas={legendas} r={r} />

      <svg width={W} height={H} style={{ position: "absolute", top: TOPO, left: coluna.left }}>
        {/* o chao da fila, que some quando a piramide se forma */}
        <line x1={CX - 380} x2={CX + 380} y1={FILA_Y + 54} y2={FILA_Y + 54} stroke={c.textMuted}
          strokeWidth={3} opacity={1 - degraus} />

        {DEGRAU_Y.map((y, k) => {
          const meia = (k * DEGRAU_PASSO) / 2 + 60;
          return (
            <line key={k} x1={CX - meia} x2={CX + meia} y1={y + 54} y2={y + 54}
              stroke={k === 0 ? c.goldBright : c.textMuted} strokeWidth={k === 0 ? 5 : 3} opacity={degraus} />
          );
        })}

        {Array.from({ length: N }, (_, i) => {
          const entra = spring({ frame: frame - i * 2, fps, config: { damping: 200 }, durationInFrames: 14 });
          const anda = r.entrou(formar)
            ? spring({ frame: r.desde(formar) - (ordem.indexOf(i) === 0 ? 0 : 4 + i * 2), fps,
                config: { damping: 200 }, durationInFrames: 26 })
            : 0;
          const fila = { x: CX + (i - (N - 1) / 2) * FILA_PASSO, y: FILA_Y };
          const lugar = lugarDe(i);
          const x = interpolate(anda, [0, 1], [fila.x, lugar.x]);
          const y = interpolate(anda, [0, 1], [fila.y, lugar.y]);
          const ehOrg = i === organiza.indice;
          const cor = ehOrg && destaque > 0.5 ? c.goldBright : anda > 0.5 && !ehOrg ? c.goldDim : c.gold;
          const escala = (ehOrg ? interpolate(destaque, [0, 1], [1.0, 1.22]) : 1.0) * (0.6 + 0.4 * entra);
          return (
            <g key={i} opacity={entra}>
              <Pessoa x={x} y={y} cor={cor} escala={escala} />
            </g>
          );
        })}

        {topo && tE > 0 && (
          <g opacity={tE}>
            <rect x={CX - 170} y={DEGRAU_Y[0] - 190} width={340} height={64} rx={14} fill="none"
              stroke={c.cost} strokeWidth={4} />
            <text x={CX} y={DEGRAU_Y[0] - 146} textAnchor="middle" fontFamily={fonts.display}
              fontSize={38} fontWeight={900} fill={c.cost}>
              {topo.texto}
            </text>
          </g>
        )}
      </svg>

      {selo && <SeloRef selo={selo} r={r} topo={TOPO + H - 60} />}
    </AbsoluteFill>
  );
};
