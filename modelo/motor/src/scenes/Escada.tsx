import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { c, fonts, safe, coluna } from "../brand";
import { useRitmo } from "../batida";
import type { BatidaMedida, Degrau } from "../tipos";

export type Rodape = {
  rotulo: string;
  agora: string;
  depois: string;
  fim?: string;
};

/**
 * A escada 44 -> 42 -> 40: um degrau por vez, centralizado.
 * Cada degrau e o numero grande com o rotulo embaixo, para que todos fiquem
 * no mesmo eixo (numero e rotulo lado a lado davam centros desalinhados).
 * Embaixo, o contador do que isso vira na padaria.
 *
 * Os tamanhos abaixo sao calibrados para caber entre safe.top e o topo da
 * faixa de legenda. Se aumentar a fonte, confira um frame antes de publicar.
 *
 * Cada degrau entra na batida da fala que o enuncia. Quando o roteiro nao diz
 * a batida, cai no escalonamento antigo por frames, que serve de reserva.
 */
export const Escada: React.FC<{
  titulo: string;
  degraus: Degrau[];
  rodape: Rodape;
  batidas: BatidaMedida[];
}> = ({ titulo, degraus, rodape, batidas }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const r = useRitmo(batidas);

  const tituloS = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 16 });
  const baseDegrau = 22;
  const passo = 24;

  return (
    <AbsoluteFill
      style={{
        paddingTop: safe.top + 70,
        paddingBottom: safe.bottom + 150,
        paddingLeft: coluna.left,
        paddingRight: coluna.right,
        justifyContent: "flex-start",
        alignItems: "center",
      }}
    >
      <span
        style={{
          fontFamily: fonts.display,
          fontSize: 58,
          fontWeight: 800,
          lineHeight: 1.1,
          letterSpacing: -1,
          color: c.text,
          textAlign: "center",
          opacity: tituloS,
          transform: `translateY(${interpolate(tituloS, [0, 1], [20, 0])}px)`,
          textWrap: "balance",
          marginBottom: 40,
        }}
      >
        {titulo}
      </span>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        {degraus.map((d, i) => {
          // Com batida declarada, a mola conta a partir da fala; sem ela, cai
          // no escalonamento antigo por frames.
          const frameDaMola =
            d.naBatida === undefined ? frame - (baseDegrau + i * passo) : r.desde(d);
          const s = spring({
            frame: frameDaMola,
            fps,
            config: { damping: 180, mass: 0.7 },
            durationInFrames: 20,
          });
          const ativo = i === degraus.length - 1;
          return (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                opacity: s,
                transform: `translateY(${interpolate(s, [0, 1], [24, 0])}px)`,
              }}
            >
              <span
                style={{
                  fontFamily: fonts.display,
                  fontSize: 120,
                  fontWeight: 900,
                  letterSpacing: -5,
                  color: ativo ? c.goldBright : c.gold,
                  lineHeight: 1,
                  whiteSpace: "nowrap",
                }}
              >
                {d.horas}
              </span>
              <span
                style={{
                  fontFamily: fonts.body,
                  fontSize: 34,
                  fontWeight: 600,
                  color: c.textMuted,
                  whiteSpace: "nowrap",
                  marginTop: 4,
                }}
              >
                {d.quando}
              </span>
            </div>
          );
        })}
      </div>

      <Pe
        frame={frame}
        fps={fps}
        rodape={rodape}
        entraEm={
          batidas.length > 1
            ? r.inicios[batidas.length - 1]
            : baseDegrau + degraus.length * passo + 12
        }
      />
    </AbsoluteFill>
  );
};

const Pe: React.FC<{
  frame: number;
  fps: number;
  entraEm: number;
  rodape: Rodape;
}> = ({ frame, fps, entraEm, rodape }) => {
  const s = spring({
    frame: frame - entraEm,
    fps,
    config: { damping: 200 },
    durationInFrames: 18,
  });
  const segundo = spring({
    frame: frame - entraEm - 24,
    fps,
    config: { damping: 200 },
    durationInFrames: 16,
  });

  return (
    <div
      style={{
        marginTop: 34,
        alignSelf: "stretch",
        borderTop: `2px solid ${c.rule}`,
        paddingTop: 22,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        opacity: s,
        transform: `translateY(${interpolate(s, [0, 1], [18, 0])}px)`,
      }}
    >
      <span
        style={{
          fontFamily: fonts.display,
          fontSize: 26,
          fontWeight: 700,
          letterSpacing: 4,
          color: c.textFaint,
          textTransform: "uppercase",
          textAlign: "center",
        }}
      >
        {rodape.rotulo}
      </span>

      {/*
        `agora` nasceu para um numero curto ("8 h"), a 76px e sem quebra.
        Com frase inteira isso estourava a coluna e o texto era CORTADO, sem
        aviso. Agora o campo decide o tratamento: numero curto segue grande,
        frase vira bloco empilhado que quebra linha. Nada e cortado.
      */}
      {rodape.agora.length <= 8 ? (
        <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginTop: 10 }}>
          <span
            style={{
              fontFamily: fonts.display,
              fontSize: 76,
              fontWeight: 900,
              letterSpacing: -3,
              color: c.cost,
              lineHeight: 1,
              whiteSpace: "nowrap",
            }}
          >
            {rodape.agora}
          </span>
          <span
            style={{
              fontFamily: fonts.body,
              fontSize: 40,
              fontWeight: 600,
              color: c.textMuted,
              whiteSpace: "nowrap",
            }}
          >
            {rodape.depois}
          </span>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            marginTop: 12,
            alignSelf: "stretch",
          }}
        >
          <span
            style={{
              fontFamily: fonts.display,
              fontSize: rodape.agora.length > 28 ? 36 : 42,
              fontWeight: 800,
              letterSpacing: -1,
              color: c.cost,
              lineHeight: 1.15,
              textAlign: "center",
              textWrap: "balance",
            }}
          >
            {rodape.agora}
          </span>
          <span
            style={{
              fontFamily: fonts.body,
              fontSize: rodape.depois.length > 28 ? 32 : 36,
              fontWeight: 600,
              color: c.textMuted,
              lineHeight: 1.25,
              textAlign: "center",
              textWrap: "balance",
            }}
          >
            {rodape.depois}
          </span>
        </div>
      )}

      {rodape.fim ? (
        <div
          style={{
            fontFamily: fonts.body,
            fontSize: 36,
            fontWeight: 600,
            color: c.textFaint,
            marginTop: 8,
            opacity: segundo,
            whiteSpace: "nowrap",
          }}
        >
          {rodape.fim}
        </div>
      ) : null}
    </div>
  );
};
