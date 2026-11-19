import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { c } from "../brand";

/**
 * Fundo da marca: quase preto quente, uma luz de ouro velho que respira
 * devagar, grade fina e vinheta. Sobrio de proposito, sem brilho de thumbnail.
 */
export const Fundo: React.FC<{ luz?: "alta" | "baixa" }> = ({ luz = "alta" }) => {
  const frame = useCurrentFrame();
  const respiro = interpolate(
    Math.sin((frame / 90) * Math.PI),
    [-1, 1],
    [0.82, 1],
  );
  const y = luz === "alta" ? "32%" : "68%";

  return (
    <AbsoluteFill style={{ backgroundColor: c.bg }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(70% 46% at 50% ${y}, rgba(201,162,39,${0.17 * respiro}) 0%, rgba(201,162,39,0) 72%)`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${c.rule} 1px, transparent 1px), linear-gradient(90deg, ${c.rule} 1px, transparent 1px)`,
          backgroundSize: "90px 90px",
          opacity: 0.5,
          maskImage:
            "radial-gradient(62% 42% at 50% 42%, black 0%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(62% 42% at 50% 42%, black 0%, transparent 80%)",
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(78% 62% at 50% 44%, transparent 42%, rgba(0,0,0,0.72) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
