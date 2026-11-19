/**
 * Folha de contato do mascote: as duas propostas, com todas as expressoes.
 *
 * Existe para o Claudio escolher o personagem olhando, e nao pela descricao.
 * Nao entra em video nenhum: e composicao de conferencia, como a `Capa`.
 */

import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { c, fonts } from "../brand";
import { BICHOS, HUMORES, type QualBicho } from "./Mascote";

const NOMES: Record<string, string> = {
  neutro: "neutro",
  explica: "explicando",
  pensa: "pensando",
  espanta: "espantado",
  cetico: "cético",
  aprova: "aprovando",
  discorda: "discordando",
  ri: "rindo",
};

const TITULOS: Record<QualBicho, string> = {
  coruja: "Coruja · o professor clássico",
  tatu: "Tatu-bola · brasileiro, e se fecha quando desconfia",
  jabuti: "Jabuti · ganha pela cabeça, não pela força",
  raposa: "Raposa · enxerga o incentivo por trás da regra",
};

export const FolhaMascote: React.FC<{ qual?: QualBicho }> = ({ qual = "coruja" }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = frame / Math.max(1, durationInFrames);
  const Bicho = BICHOS[qual];
  const col = 4;
  const passoX = 440;
  const passoY = 470;
  const x0 = 960 - ((col - 1) * passoX) / 2;
  return (
    <AbsoluteFill style={{ backgroundColor: c.bg }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <text
          x={960}
          y={70}
          textAnchor="middle"
          fontFamily={fonts.display}
          fontSize={44}
          fontWeight={800}
          fill={c.text}
        >
          {TITULOS[qual]}
        </text>
        {HUMORES.map((h, i) => {
          const x = x0 + (i % col) * passoX;
          const y = 300 + Math.floor(i / col) * passoY;
          return (
            <g key={h} transform={`translate(${x} ${y})`}>
              <g transform="scale(0.62)">
                <Bicho humor={h} t={t + i * 0.13} tam={300} />
              </g>
              <text
                x={0}
                y={212}
                textAnchor="middle"
                fontFamily={fonts.display}
                fontSize={30}
                fontWeight={800}
                fill={c.gold}
              >
                {NOMES[h]}
              </text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
