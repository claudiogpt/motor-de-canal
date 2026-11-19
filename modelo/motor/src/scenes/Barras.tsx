import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, random } from "remotion";
import { c, fonts, safe, coluna } from "../brand";
import { useRitmo } from "../batida";
import { Legendas } from "./Regua";
import type { BatidaMedida, GrupoBarras, Legenda, Temporizado } from "../tipos";

/**
 * Paises (ou grupos) como graficos de renda, uma barra por familia.
 *
 * Serve para experimento mental que compara distribuicoes:
 *  - `veu`: um marcador "voce?" pula de barra em barra, sem parar. E o veu
 *    da ignorancia desenhado: voce pode cair em qualquer casa.
 *  - `pior`: destaca a barra mais baixa de cada grupo, com o valor.
 *  - `vencedor`: selo em cima do grupo escolhido.
 *  - `cresce`: uma barra estoura a escala (com quebra desenhada) e um contador
 *    sobe ate o valor. Para mostrar uma troca que concentra renda.
 *  - `pergunta`: frase grande embaixo, para fechar o bloco.
 * O minimo de cada grupo e calculado aqui, nao escrito no JSON.
 */

const W = 788;
const ALTURA_MAX = 520; // px da barra de maior valor
const BASE_Y = 900; // base das barras, relativo ao topo da cena (safe.top)

export const Barras: React.FC<{
  grupos: GrupoBarras[];
  unidade?: string;
  legendas?: Legenda[];
  veu?: Temporizado & { texto: string };
  pior?: Temporizado & { texto?: string };
  vencedor?: Temporizado & { grupo: number; texto: string };
  cresce?: Temporizado & { grupo: number; indice: number; rotulo: string; contador?: string };
  pergunta?: Temporizado & { texto: string };
  prefixo?: string;
  sufixo?: string;
  batidas: BatidaMedida[];
}> = ({ grupos, unidade, legendas = [], veu, pior, vencedor, cresce, pergunta, prefixo = "", sufixo = "", batidas }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const r = useRitmo(batidas);

  // Numero no formato brasileiro: 2400 vira "2.400". Prefixo e sufixo ("R$ ",
  // "%") sao do bloco, nao de cada valor, para o JSON continuar so com numeros.
  const fmt = (v: number) => `${prefixo}${v.toLocaleString("pt-BR")}${sufixo}`;

  const maior = Math.max(...grupos.flatMap((g) => g.valores));
  const escala = ALTURA_MAX / maior;

  const largGrupo = grupos.length === 1 ? 620 : 350;
  const gap = W - largGrupo * grupos.length;
  const x0Grupo = (gi: number) =>
    grupos.length === 1 ? (W - largGrupo) / 2 : gi * (largGrupo + gap);

  const nBarras = (g: GrupoBarras) => g.valores.length;
  const largBarra = (g: GrupoBarras) => (largGrupo - 12 * (nBarras(g) - 1)) / nBarras(g);
  const xBarra = (gi: number, i: number) => x0Grupo(gi) + i * (largBarra(grupos[gi]) + 12);

  const pE = pior ? r.entrada(pior, 12) : 0;
  const vE = vencedor ? r.entrada(vencedor, 14) : 0;
  const cE = cresce
    ? spring({ frame: r.desde(cresce), fps, config: { damping: 200 }, durationInFrames: 40 })
    : 0;

  // Veu: um indice de barra que muda a cada 7 frames, sorteado de forma
  // deterministica (o render e reprodutivel frame a frame).
  const todas = grupos.flatMap((g, gi) => g.valores.map((_, i) => [gi, i] as const));
  const veuAtivo = veu ? r.entrou(veu) : false;
  const sorteio = todas[Math.floor(random(`veu-${Math.floor(frame / 7)}`) * todas.length)];

  return (
    <AbsoluteFill>
      <Legendas legendas={legendas} r={r} />

      <svg width={W} height={1100} style={{ position: "absolute", top: safe.top, left: coluna.left }}>
        {grupos.map((g, gi) => {
          const gE = r.entrada(g, 14);
          const minimo = Math.min(...g.valores);
          const iMin = g.valores.indexOf(minimo);
          return (
            <g key={gi} opacity={gE}>
              {g.valores.map((v, i) => {
                const cresceAqui = cresce && cresce.grupo === gi && cresce.indice === i;
                const sobe = spring({
                  frame: r.desde(g) - i * 3,
                  fps,
                  config: { damping: 200 },
                  durationInFrames: 18,
                });
                let h = v * escala * sobe;
                if (cresceAqui) h = interpolate(cE, [0, 1], [h, ALTURA_MAX + 120]);
                const x = xBarra(gi, i);
                const lw = largBarra(g);
                const ehPior = i === iMin && pE > 0;
                const cor = cresceAqui && cE > 0.05 ? c.goldBright : ehPior ? c.cost : c.gold;
                return (
                  <g key={i}>
                    <rect x={x} y={BASE_Y - h} width={lw} height={h} rx={6} fill={cor}
                      opacity={ehPior || cresceAqui ? 1 : 0.85} />
                    {cresceAqui && cE > 0.6 && (
                      // quebra de escala: a barra nao cabe no grafico
                      <path
                        d={`M ${x - 6} ${BASE_Y - ALTURA_MAX + 40} l ${lw / 2 + 6} -16 l ${lw / 2 + 6} 16`}
                        stroke={c.bg} strokeWidth={10} fill="none"
                      />
                    )}
                    <text x={x + lw / 2} y={BASE_Y - h - 14} textAnchor="middle"
                      fill={ehPior ? c.cost : c.text} fontFamily={fonts.display}
                      fontSize={ehPior ? 60 : 44} fontWeight={900} opacity={sobe}>
                      {cresceAqui && cE > 0.05 ? "" : fmt(v)}
                    </text>
                    {g.rotulos?.[i] && (
                      <text x={x + lw / 2} y={BASE_Y + 40} textAnchor="middle" fill={c.goldBright}
                        fontFamily={fonts.body} fontSize={30} fontWeight={700}>
                        {g.rotulos[i]}
                      </text>
                    )}
                  </g>
                );
              })}
              <line x1={x0Grupo(gi) - 6} x2={x0Grupo(gi) + largGrupo + 6} y1={BASE_Y} y2={BASE_Y}
                stroke={c.textMuted} strokeWidth={3} />
              <text x={x0Grupo(gi) + largGrupo / 2} y={BASE_Y + (g.rotulos ? 92 : 58)} textAnchor="middle"
                fill={c.text} fontFamily={fonts.display} fontSize={52} fontWeight={900}>
                {g.nome}
              </text>
              {g.subtitulo && (
                <text x={x0Grupo(gi) + largGrupo / 2} y={BASE_Y + (g.rotulos ? 132 : 98)} textAnchor="middle"
                  fill={c.textMuted} fontFamily={fonts.body} fontSize={30} fontWeight={600}>
                  {g.subtitulo}
                </text>
              )}
              {pE > 0 && pior?.texto && (
                <text x={xBarra(gi, iMin) + largBarra(g) / 2} y={BASE_Y - minimo * escala - 70}
                  textAnchor="middle" fill={c.cost} fontFamily={fonts.body} fontSize={26}
                  fontWeight={800} opacity={pE}>
                  {pior.texto}
                </text>
              )}
            </g>
          );
        })}

        {veuAtivo && sorteio && (() => {
          const [gi, i] = sorteio;
          const g = grupos[gi];
          const cx = xBarra(gi, i) + largBarra(g) / 2;
          const topo = BASE_Y - g.valores[i] * escala - 120;
          return (
            <g transform={`translate(${cx}, ${topo})`}>
              <circle r={30} fill={c.text} />
              <text y={12} textAnchor="middle" fill={c.bg} fontFamily={fonts.display}
                fontSize={38} fontWeight={900}>?</text>
              <path d="M -10 26 L 0 44 L 10 26 Z" fill={c.text} />
            </g>
          );
        })()}

        {vencedor && vE > 0 && (
          <g opacity={vE} transform={`translate(${x0Grupo(vencedor.grupo) + largGrupo / 2}, ${BASE_Y - ALTURA_MAX - 100}) scale(${interpolate(vE, [0, 1], [0.85, 1])})`}>
            <rect x={-150} y={-42} width={300} height={66} rx={14} fill="none"
              stroke={c.goldBright} strokeWidth={4} />
            <text y={4} textAnchor="middle" fill={c.goldBright} fontFamily={fonts.display}
              fontSize={36} fontWeight={900}>
              {vencedor.texto}
            </text>
          </g>
        )}

        {cresce && cE > 0.05 && (
          <g opacity={Math.min(1, cE * 2)}>
            <text x={xBarra(cresce.grupo, cresce.indice) + largBarra(grupos[cresce.grupo]) / 2}
              y={BASE_Y - ALTURA_MAX - 144} textAnchor="middle" fill={c.goldBright}
              fontFamily={fonts.display} fontSize={56} fontWeight={900}>
              {cresce.rotulo}
            </text>
          </g>
        )}
      </svg>

      {veu && veuAtivo && (
        <div style={{
          position: "absolute", top: safe.top + BASE_Y + 170, left: coluna.left, right: coluna.right,
          textAlign: "center", fontFamily: fonts.body, fontSize: 34, fontWeight: 700,
          color: c.text, opacity: r.entrada(veu, 10),
        }}>
          {veu.texto}
        </div>
      )}

      {unidade && (
        <div style={{
          position: "absolute", top: safe.top + BASE_Y + 220, left: coluna.left, right: coluna.right,
          textAlign: "center", fontFamily: fonts.body, fontSize: 26, fontWeight: 600, color: c.textFaint,
          opacity: r.entrada(grupos[0], 14),
        }}>
          {unidade}
        </div>
      )}

      {cresce?.contador && (
        <div style={{
          position: "absolute", top: safe.top + BASE_Y + 100, left: coluna.left, right: coluna.right,
          textAlign: "center", fontFamily: fonts.display, fontSize: 40, fontWeight: 800,
          color: c.textMuted, opacity: Math.min(1, cE * 2),
        }}>
          {cresce.contador}
        </div>
      )}

      {pergunta && (
        <div style={{
          position: "absolute", top: safe.top + BASE_Y + 160, left: coluna.left, right: coluna.right,
          textAlign: "center", fontFamily: fonts.display, fontSize: 64, fontWeight: 900,
          letterSpacing: -2, lineHeight: 1.05, color: c.goldBright,
          opacity: r.entrada(pergunta, 12), textWrap: "balance",
        }}>
          {pergunta.texto}
        </div>
      )}
    </AbsoluteFill>
  );
};
