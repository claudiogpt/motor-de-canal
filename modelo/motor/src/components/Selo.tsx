import React from "react";
import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { c, t, fonts, safe, coluna } from "../brand";

/**
 * Selo da serie no topo, centralizado na coluna de conteudo.
 * O plano pede que ele apareca nos 3 primeiros segundos de cada Reel.
 */
export const Selo: React.FC<{ serie: string; sairEm?: number }> = ({
  serie,
  sairEm,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entra = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 14 });
  const sai = sairEm
    ? interpolate(frame, [sairEm - 12, sairEm], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 1;

  return (
    <div
      style={{
        position: "absolute",
        top: safe.top,
        left: coluna.left,
        right: coluna.right,
        justifyContent: "center",
        display: "flex",
        alignItems: "center",
        gap: 14,
        opacity: entra * sai,
        transform: `translateY(${interpolate(entra, [0, 1], [-18, 0])}px)`,
      }}
    >
      <div style={{ width: 8, height: 40, backgroundColor: c.gold }} />
      <span
        style={{
          fontFamily: fonts.display,
          fontSize: t.label.size,
          fontWeight: t.label.weight,
          letterSpacing: t.label.letterSpacing,
          color: c.goldBright,
          textTransform: "uppercase",
        }}
      >
        {serie}
      </span>
    </div>
  );
};
