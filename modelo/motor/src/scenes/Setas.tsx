import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { c, fonts, safe, coluna } from "../brand";
import { useRitmo } from "../batida";
import type { BatidaMedida, Saida } from "../tipos";

/**
 * A conta no topo e, embaixo, as saidas com quem acaba pagando cada uma.
 * O tipo continua se chamando "setas" para nao quebrar os reel.json, mas as
 * setas desenhadas sairam: o dono do canal achou feias. Os cartoes
 * entram um por vez, centralizados, e o "quem paga" vai na cor de custo.
 * Cada cartao entra na batida da fala que o enuncia.
 */
export const Setas: React.FC<{
  origem: string;
  saidas: Saida[];
  batidas: BatidaMedida[];
}> = ({ origem, saidas, batidas }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const r = useRitmo(batidas);

  const origemS = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 16 });

  return (
    <AbsoluteFill
      style={{
        paddingTop: safe.top + 20,
        paddingBottom: safe.bottom + 150,
        paddingLeft: coluna.left,
        paddingRight: coluna.right,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          border: `3px solid ${c.gold}`,
          borderRadius: 16,
          padding: "18px 32px",
          opacity: origemS,
          transform: `scale(${interpolate(origemS, [0, 1], [0.9, 1])})`,
        }}
      >
        <span
          style={{
            fontFamily: fonts.display,
            fontSize: 62,
            fontWeight: 900,
            letterSpacing: -2,
            color: c.goldBright,
          }}
        >
          {origem}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          alignSelf: "stretch",
          gap: 20,
          marginTop: 44,
        }}
      >
        {saidas.map((s, i) => {
          const ap = spring({
            frame: r.desde(s),
            fps,
            config: { damping: 180, mass: 0.7 },
            durationInFrames: 20,
          });

          return (
            <div
              key={i}
              style={{
                backgroundColor: c.bgRaise,
                border: `2px solid ${c.rule}`,
                borderRadius: 14,
                padding: "20px 26px",
                textAlign: "center",
                opacity: ap,
                transform: `translateY(${interpolate(ap, [0, 1], [22, 0])}px)`,
              }}
            >
              <div
                style={{
                  fontFamily: fonts.display,
                  fontSize: 52,
                  fontWeight: 800,
                  letterSpacing: -1,
                  color: c.text,
                  lineHeight: 1.1,
                  textWrap: "balance",
                }}
              >
                {s.titulo}
              </div>
              <div
                style={{
                  fontFamily: fonts.body,
                  fontSize: 34,
                  fontWeight: 600,
                  color: s.cor === "ouro" ? c.goldBright : c.cost,
                  marginTop: 8,
                  textWrap: "balance",
                }}
              >
                {s.quemPaga}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
