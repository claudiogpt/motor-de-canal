import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { c, fonts, safe, coluna } from "../brand";
import { useRitmo } from "../batida";
import type { BatidaMedida, CandidatoRegua, Legenda, Temporizado } from "../tipos";

/**
 * A regua dos eleitores: o modelo espacial de votacao desenhado, nao descrito.
 *
 * Cada eleitor e um boneco numa posicao de 0 a 10. Cada candidato anda pela
 * regua, batida a batida. A cor de cada eleitor e o placar NAO vem do JSON:
 * sao recalculados a cada frame a partir da posicao animada dos candidatos
 * (cada eleitor vota no mais perto; distancia igual = indeciso). Assim o
 * desenho e a conta nao tem como divergir.
 */

const W = 788; // largura da coluna central
const X0 = 44;
const X1 = W - 44;
const xDe = (p: number) => X0 + (p / 10) * (X1 - X0);

const EIXO_Y = 760; // y do eixo dentro da cena (a cena comeca em safe.top)
const BONECO = 74; // altura de um degrau da pilha

export const Regua: React.FC<{
  eleitores: number[];
  extremos: [string, string];
  candidatos: CandidatoRegua[];
  votos?: Temporizado;
  mediano?: Temporizado & { texto: string };
  legendas?: Legenda[];
  selo?: Temporizado & { texto: string };
  batidas: BatidaMedida[];
}> = ({ eleitores, extremos, candidatos, votos, mediano, legendas = [], selo, batidas }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const r = useRitmo(batidas);

  // Posicao animada de cada candidato: interpola de um quadro-chave ao proximo
  // nos 22 frames seguintes ao inicio da batida que o declara.
  const posicao = (cand: CandidatoRegua) => {
    let x = cand.posicoes[0].x;
    for (let i = 1; i < cand.posicoes.length; i++) {
      const k = cand.posicoes[i];
      const s = spring({ frame: r.desde(k), fps, config: { damping: 200 }, durationInFrames: 22 });
      x = x + (k.x - x) * s;
    }
    return x;
  };
  const pos = candidatos.map(posicao);
  const visivel = candidatos.map((cand) => r.entrada(cand.posicoes[0], 12));

  const contando = votos ? r.entrada(votos, 10) : 0;
  const voto = (p: number) => {
    if (contando <= 0 || candidatos.length < 2) return -1;
    const d = pos.map((x) => Math.abs(x - p));
    if (Math.abs(d[0] - d[1]) < 0.05) return 2; // indeciso: equidistante
    return d[0] < d[1] ? 0 : 1;
  };
  const corCand = (i: number) => (candidatos[i].cor === "ouro" ? c.goldBright : c.text);

  // Pilha: eleitores na mesma posicao sobem um degrau.
  const vistos: Record<string, number> = {};
  const bonecos = eleitores.map((p, i) => {
    const k = String(p);
    const nivel = vistos[k] ?? 0;
    vistos[k] = nivel + 1;
    const e = r.entrada({ naBatida: 0 }, 8 + i * 2);
    return { p, nivel, e, v: voto(p) };
  });
  const placar = [0, 0, 0];
  bonecos.forEach((b) => b.v >= 0 && placar[b.v]++);

  const ordenados = [...eleitores].sort((a, b) => a - b);
  const pMediano = ordenados[Math.floor(ordenados.length / 2)];
  const med = mediano ? r.entrada(mediano, 14) : 0;
  const pulso = interpolate(Math.sin((frame / 12) * Math.PI), [-1, 1], [0.75, 1]);

  const eixoS = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 16 });

  return (
    <AbsoluteFill
      style={{
        paddingTop: safe.top + 40,
        paddingLeft: coluna.left,
        paddingRight: coluna.right,
      }}
    >
      <Legendas legendas={legendas} r={r} />

      <svg width={W} height={1000} style={{ position: "absolute", top: safe.top, left: coluna.left }}>
        {/* eixo */}
        <line
          x1={X0}
          x2={X0 + (X1 - X0) * eixoS}
          y1={EIXO_Y}
          y2={EIXO_Y}
          stroke={c.textMuted}
          strokeWidth={4}
        />
        {Array.from({ length: 11 }, (_, i) => (
          <line
            key={i}
            x1={xDe(i)}
            x2={xDe(i)}
            y1={EIXO_Y - 8}
            y2={EIXO_Y + 8}
            stroke={c.textFaint}
            strokeWidth={2}
            opacity={eixoS}
          />
        ))}
        <text x={X0} y={EIXO_Y + 52} fill={c.textMuted} fontFamily={fonts.display}
          fontSize={30} fontWeight={700} opacity={eixoS}>
          {extremos[0]}
        </text>
        <text x={X1} y={EIXO_Y + 52} fill={c.textMuted} fontFamily={fonts.display}
          fontSize={30} fontWeight={700} textAnchor="end" opacity={eixoS}>
          {extremos[1]}
        </text>

        {/* eleitor mediano: anel atras do boneco */}
        {med > 0 && (
          <g opacity={med}>
            <circle
              cx={xDe(pMediano)}
              cy={EIXO_Y - 50}
              r={62 * pulso}
              fill="none"
              stroke={c.goldBright}
              strokeWidth={5}
            />
            <line x1={xDe(pMediano)} x2={xDe(pMediano)} y1={EIXO_Y - 116} y2={EIXO_Y - 330}
              stroke={c.goldBright} strokeWidth={3} strokeDasharray="10 10" />
          </g>
        )}

        {bonecos.map((b, i) => {
          const cx = xDe(b.p);
          const base = EIXO_Y - 14 - b.nivel * BONECO;
          const cor = b.v === 0 ? corCand(0) : b.v === 1 ? corCand(1) : b.v === 2 ? c.cost : c.textFaint;
          return (
            <g key={i} opacity={b.e} transform={`translate(${cx}, ${base + (1 - b.e) * 20}) scale(1.7)`}>
              <circle cx={0} cy={-30} r={10} fill={cor} />
              <path d="M -15 0 Q -15 -18 0 -18 Q 15 -18 15 0 Z" fill={cor} />
            </g>
          );
        })}

        {/* candidatos: marcador abaixo do eixo, com ponteiro para cima */}
        {candidatos.map((cand, i) => {
          const cx = xDe(pos[i]);
          const cy = EIXO_Y + 120 + i * 0;
          return (
            <g key={i} opacity={visivel[i]} transform={`translate(${cx}, ${cy})`}>
              <path d="M -14 -46 L 0 -70 L 14 -46 Z" fill={corCand(i)} />
              <circle r={44} fill={c.bgRaise} stroke={corCand(i)} strokeWidth={5} />
              <text y={16} textAnchor="middle" fill={corCand(i)} fontFamily={fonts.display}
                fontSize={46} fontWeight={900}>
                {cand.nome}
              </text>
            </g>
          );
        })}
      </svg>

      {/* placar */}
      {candidatos.length >= 2 && (
        <div
          style={{
            position: "absolute",
            top: safe.top + EIXO_Y + 210,
            left: coluna.left,
            right: coluna.right,
            display: "flex",
            justifyContent: "center",
            alignItems: "baseline",
            gap: 26,
            opacity: contando,
            fontFamily: fonts.display,
            fontWeight: 900,
          }}
        >
          <span style={{ fontSize: 76, color: corCand(0) }}>{candidatos[0].nome} {placar[0]}</span>
          <span style={{ fontSize: 40, color: c.textFaint }}>×</span>
          <span style={{ fontSize: 76, color: corCand(1) }}>{placar[1]} {candidatos[1].nome}</span>
          {placar[2] > 0 && (
            <span style={{ fontSize: 36, color: c.cost, fontWeight: 800 }}>
              · {placar[2]} decide
            </span>
          )}
        </div>
      )}

      {mediano && (
        <div
          style={{
            position: "absolute",
            top: safe.top + EIXO_Y - 400,
            left: coluna.left,
            right: coluna.right,
            textAlign: "center",
            opacity: med,
            fontFamily: fonts.display,
            fontSize: 52,
            fontWeight: 900,
            color: c.goldBright,
          }}
        >
          {mediano.texto}
        </div>
      )}

      {selo && <SeloRef selo={selo} r={r} topo={safe.top + EIXO_Y + 310} />}
    </AbsoluteFill>
  );
};

/** Frase de cima, uma por batida: diz o que o grafico esta fazendo agora. */
export const Legendas: React.FC<{ legendas: Legenda[]; r: ReturnType<typeof useRitmo> }> = ({
  legendas,
  r,
}) => {
  const ativa = [...legendas].reverse().find((l) => r.entrou(l));
  if (!ativa) return null;
  const s = r.entrada(ativa, 10);
  return (
    <div
      style={{
        position: "absolute",
        top: safe.top + 60,
        left: coluna.left,
        right: coluna.right,
        textAlign: "center",
        fontFamily: fonts.display,
        fontSize: 60,
        fontWeight: 900,
        lineHeight: 1.08,
        letterSpacing: -1.5,
        color: ativa.cor === "ouro" ? c.goldBright : ativa.cor === "custo" ? c.cost : c.text,
        opacity: s,
        transform: `translateY(${interpolate(s, [0, 1], [16, 0])}px)`,
        textWrap: "balance",
      }}
    >
      {ativa.texto}
    </div>
  );
};

/** Referencia que entra so quando a voz a cita, com obra e ano: nada solto. */
export const SeloRef: React.FC<{
  selo: Temporizado & { texto: string };
  r: ReturnType<typeof useRitmo>;
  topo: number;
}> = ({ selo, r, topo }) => {
  const s = r.entrada(selo, 12);
  return (
    <div
      style={{
        position: "absolute",
        top: topo,
        left: coluna.left,
        right: coluna.right,
        display: "flex",
        justifyContent: "center",
        opacity: s,
      }}
    >
      <span
        style={{
          border: `2px solid ${c.gold}`,
          borderRadius: 12,
          padding: "10px 22px",
          fontFamily: fonts.body,
          fontSize: 32,
          fontWeight: 700,
          color: c.goldBright,
          textAlign: "center",
        }}
      >
        {selo.texto}
      </span>
    </div>
  );
};
