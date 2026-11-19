import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { c, t, fonts, safe, coluna } from "../brand";
import type { BatidaMedida } from "../tipos";

/**
 * Fecho: a pergunta fica, a conclusao e do espectador.
 * Regra editorial do canal: nunca entregar a conclusao mastigada.
 */
export const Cta: React.FC<{
  pergunta: string;
  acao: string;
  /** O fecho tem uma batida so, entao a cena nao se divide por batida. */
  batidas: BatidaMedida[];
}> = ({ pergunta, acao }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const p = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 18 });
  const a = spring({ frame: frame - 18, fps, config: { damping: 200 }, durationInFrames: 16 });
  const pulso = interpolate(Math.sin((frame / 22) * Math.PI), [-1, 1], [0.86, 1]);

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
      <span
        style={{
          fontFamily: fonts.display,
          fontSize: t.h1.size,
          fontWeight: t.h1.weight,
          lineHeight: t.h1.lineHeight,
          letterSpacing: t.h1.letterSpacing,
          color: c.text,
          textAlign: "center",
          opacity: p,
          transform: `translateY(${interpolate(p, [0, 1], [26, 0])}px)`,
          textWrap: "balance",
        }}
      >
        {pergunta}
      </span>

      <div
        style={{
          marginTop: 44,
          display: "flex",
          alignItems: "center",
          gap: 16,
          opacity: a,
          transform: `translateY(${interpolate(a, [0, 1], [18, 0])}px)`,
        }}
      >
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: c.goldBright,
            opacity: pulso,
          }}
        />
        <span
          style={{
            fontFamily: fonts.display,
            fontSize: 46,
            fontWeight: 800,
            letterSpacing: -0.5,
            color: c.goldBright,
          }}
        >
          {acao}
        </span>
      </div>
    </AbsoluteFill>
  );
};
