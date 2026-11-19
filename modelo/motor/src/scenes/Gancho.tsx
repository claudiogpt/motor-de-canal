import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { c, t, fonts, safe, coluna } from "../brand";
import { useRitmo } from "../batida";
import type { BatidaMedida, Linha } from "../tipos";

/**
 * Cena de gancho: as linhas aparecem uma a uma, com peso maximo, cada uma na
 * batida da fala que a diz. O plano exige que o gancho caiba em 3 segundos.
 */
export const Gancho: React.FC<{ linhas: Linha[]; batidas: BatidaMedida[] }> = ({
  linhas,
  batidas,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const r = useRitmo(batidas);

  const cor = (k?: string) =>
    k === "ouro" ? c.goldBright : k === "custo" ? c.cost : c.text;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        paddingTop: safe.top,
        paddingBottom: safe.bottom,
        paddingLeft: coluna.left,
        paddingRight: coluna.right,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        {linhas.map((l, i) => {
          const s = spring({
            frame: r.desde(l),
            fps,
            config: { damping: 200, mass: 0.6 },
            durationInFrames: 18,
          });
          return (
            <span
              key={i}
              style={{
                fontFamily: fonts.display,
                fontSize: t.hook.size,
                fontWeight: t.hook.weight,
                lineHeight: t.hook.lineHeight,
                letterSpacing: t.hook.letterSpacing,
                color: cor(l.cor),
                textAlign: "center",
                opacity: s,
                transform: `translateY(${interpolate(s, [0, 1], [34, 0])}px)`,
                textWrap: "balance",
              }}
            >
              {l.texto}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
