import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { c, fonts, safe, coluna } from "../brand";
import { useRitmo } from "../batida";
import { Legendas, SeloRef } from "./Regua";
import type { BatidaMedida, Legenda, NoRede, Temporizado } from "../tipos";

/**
 * Um centro e os nos em volta, ligados por linhas. Serve para mostrar que uma
 * coisa so existe porque muita gente separada contribui (Eu, o Lapis) e para
 * mostrar um sinal que sai do centro e chega a todos (o preco, em Hayek).
 *
 *  - cada no entra na batida da fala que o cita, e a linha ate ele se desenha
 *    na entrada, do centro para fora;
 *  - `pulso`: a partir desta batida, pontos correm do centro para cada no ja
 *    presente, sem parar. E o sinal se espalhando;
 *  - `centro.icone: "lapis"` desenha um lapis no lugar da caixa de texto.
 *
 * Os nos ficam numa elipse, nao num circulo: a coluna tem 788 px de largura e
 * mais de 800 de altura util, e um circulo deixaria os nos da direita perto da
 * borda x=934.
 */

const W = 1080 - coluna.left - coluna.right; // 788
const TOPO = safe.top + 230; // abaixo da frase de cima (Legendas)
const H = 860; // a base fica em y=1240, acima do terco de baixo (1280)
const CX = W / 2;
const CY = 410;
const RX = 250;
const RY = 320;
// 280 cabe: o no mais a direita (5 nos, a -18 graus) termina em x=918 no quadro.
const NO_W = 280;
const NO_H = 104;

/**
 * Posicao de cada no, no sentido do relogio. Com numero impar o primeiro fica
 * no topo. Com numero par a roda gira meio passo: senao dois nos caem na linha
 * do centro e batem na caixa dele.
 */
const posicao = (i: number, n: number) => {
  const giro = n % 2 === 0 ? Math.PI / n : 0;
  const ang = -Math.PI / 2 + giro + (i * 2 * Math.PI) / n;
  return { x: CX + RX * Math.cos(ang), y: CY + RY * Math.sin(ang) };
};

const Lapis: React.FC<{ s: number }> = ({ s }) => (
  <g transform={`translate(${CX}, ${CY}) rotate(-35) scale(${interpolate(s, [0, 1], [0.58, 0.72])})`} opacity={s}>
    {/* corpo sextavado, ponta de madeira, grafite, ferrule e borracha */}
    <rect x={-150} y={-26} width={230} height={52} fill={c.gold} />
    <rect x={-150} y={-26} width={230} height={14} fill={c.goldBright} />
    <polygon points="80,-26 150,0 80,26" fill="#D9B98A" />
    <polygon points="128,-8 150,0 128,8" fill={c.bg} />
    <rect x={-186} y={-28} width={40} height={56} fill={c.textMuted} />
    <rect x={-226} y={-26} width={42} height={52} rx={10} fill={c.cost} />
  </g>
);

export const Rede: React.FC<{
  centro: { texto: string; cor?: "ouro" | "custo"; icone?: "lapis" };
  nos: NoRede[];
  pulso?: Temporizado;
  legendas?: Legenda[];
  selo?: Temporizado & { texto: string };
  batidas: BatidaMedida[];
}> = ({ centro, nos, pulso, legendas = [], selo, batidas }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const r = useRitmo(batidas);

  const cS = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 16 });
  const corCentro = centro.cor === "custo" ? c.cost : c.goldBright;
  const pulsoAtivo = pulso ? r.entrou(pulso) : false;
  // Caixa do centro do tamanho do texto (~0,55 do corpo por caractere).
  const meiaLarg = Math.min(260, Math.max(150, (centro.texto.length * 52 * 0.55) / 2 + 40));

  return (
    <AbsoluteFill>
      <Legendas legendas={legendas} r={r} />

      <svg width={W} height={H} style={{ position: "absolute", top: TOPO, left: coluna.left }}>
        {nos.map((no, i) => {
          const e = spring({ frame: r.desde(no), fps, config: { damping: 200 }, durationInFrames: 18 });
          if (!r.entrou(no)) return null;
          const p = posicao(i, nos.length);
          const fx = interpolate(e, [0, 1], [CX, p.x]);
          const fy = interpolate(e, [0, 1], [CY, p.y]);
          // O ponto do pulso: uma volta a cada 24 frames, defasado por no.
          const t = pulsoAtivo ? ((r.desde(pulso!) + i * 5) % 24) / 24 : -1;
          return (
            <g key={`l${i}`}>
              <line x1={CX} y1={CY} x2={fx} y2={fy} stroke={no.cor === "custo" ? c.cost : c.goldDim}
                strokeWidth={5} strokeDasharray={pulsoAtivo ? "14 12" : undefined} />
              {t >= 0 && (
                <circle cx={interpolate(t, [0, 1], [CX, p.x])} cy={interpolate(t, [0, 1], [CY, p.y])}
                  r={11} fill={corCentro} />
              )}
            </g>
          );
        })}

        {centro.icone === "lapis" ? (
          <Lapis s={cS} />
        ) : (
          <g opacity={cS}>
            <rect x={CX - meiaLarg} y={CY - 60} width={meiaLarg * 2} height={120} rx={22} fill={c.bg}
              stroke={corCentro} strokeWidth={5} />
            <text x={CX} y={CY + 18} textAnchor="middle" fontFamily={fonts.display} fontSize={52}
              fontWeight={900} fill={corCentro}>
              {centro.texto}
            </text>
          </g>
        )}

        {nos.map((no, i) => {
          if (!r.entrou(no)) return null;
          const e = spring({ frame: r.desde(no) - 6, fps, config: { damping: 200 }, durationInFrames: 16 });
          const p = posicao(i, nos.length);
          const corNo = no.cor === "custo" ? c.cost : c.gold;
          return (
            <g key={`n${i}`} opacity={e} transform={`translate(${p.x}, ${p.y}) scale(${interpolate(e, [0, 1], [0.85, 1])})`}>
              <rect x={-NO_W / 2} y={-NO_H / 2} width={NO_W} height={NO_H} rx={18} fill={c.bgRaise}
                stroke={corNo} strokeWidth={4} />
              <text y={no.sub ? -4 : 16} textAnchor="middle" fontFamily={fonts.display}
                fontSize={no.titulo.length > 10 ? 38 : 44} fontWeight={900} fill={c.text}>
                {no.titulo}
              </text>
              {no.sub && (
                <text y={34} textAnchor="middle" fontFamily={fonts.body}
                  fontSize={no.sub.length > 15 ? 24 : 27} fontWeight={700}
                  fill={no.cor === "custo" ? c.cost : c.goldBright}>
                  {no.sub}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {selo && <SeloRef selo={selo} r={r} topo={TOPO + H - 40} />}
    </AbsoluteFill>
  );
};
