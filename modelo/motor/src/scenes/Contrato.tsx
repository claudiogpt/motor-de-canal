import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { c, fonts, safe, coluna } from "../brand";
import { useRitmo } from "../batida";
import { Legendas, SeloRef } from "./Regua";
import type { BatidaMedida, Legenda, Linha, Temporizado } from "../tipos";

/**
 * Um contrato com a linha de assinatura. Serve para o debate do consentimento:
 *
 *  - sem `assinatura.naBatida`, a linha fica vazia, com um cursor piscando: e
 *    o "ninguem assinou" de Spooner;
 *  - `clausulas` entram como caixas que se marcam sozinhas, uma por batida: e
 *    o consentimento tacito de Locke (morar aqui conta, usar a estrada conta);
 *  - `assinatura.texto` escreve na linha, letra por letra, no tempo da fala;
 *  - `carimbo` atravessa o papel em vermelho de custo: a objecao.
 *
 * O papel tem altura fixa, para que clausula nova nao empurre o resto.
 */

const W = 1080 - coluna.left - coluna.right; // 788
const TOPO = safe.top + 250;
const PAPEL_H = 760; // base em y=1160, acima do terco de baixo
const PAD = 54;

export const Contrato: React.FC<{
  titulo: string;
  clausulas?: Linha[];
  assinatura: Temporizado & { texto?: string; rotulo?: string };
  carimbo?: Temporizado & { texto: string };
  legendas?: Legenda[];
  selo?: Temporizado & { texto: string };
  batidas: BatidaMedida[];
}> = ({ titulo, clausulas = [], assinatura, carimbo, legendas = [], selo, batidas }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const r = useRitmo(batidas);

  const papel = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 16 });
  const assina = assinatura.texto && assinatura.naBatida !== undefined && r.entrou(assinatura);
  // A assinatura se escreve em ~1 s: 30 frames para o texto inteiro.
  const letras = assina ? Math.floor(interpolate(r.desde(assinatura), [0, 30], [0, assinatura.texto!.length], {
    extrapolateRight: "clamp",
  })) : 0;
  const cursor = !assina && Math.floor(frame / 15) % 2 === 0;
  const cE = carimbo ? r.entrada(carimbo, 8) : 0;

  return (
    <AbsoluteFill>
      <Legendas legendas={legendas} r={r} />

      <div
        style={{
          position: "absolute",
          top: TOPO,
          // 12 px de folga de cada lado: o papel gira 1 grau, e o canto girado
          // avanca ~7 px para fora. Sem a folga a borda direita passaria de x=934.
          left: coluna.left + 12,
          width: W - 24,
          height: PAPEL_H,
          backgroundColor: c.text,
          borderRadius: 10,
          padding: PAD,
          boxSizing: "border-box",
          opacity: papel,
          transform: `translateY(${interpolate(papel, [0, 1], [24, 0])}px) rotate(-1deg)`,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ fontFamily: fonts.display, fontSize: 58, fontWeight: 900, color: c.bg,
          textAlign: "center", letterSpacing: -1 }}>
          {titulo}
        </div>
        {/* linhas de texto fingido: o papel parece documento, sem texto real */}
        {[0, 1, 2].map((k) => (
          <div key={k} style={{ height: 12, borderRadius: 6, backgroundColor: c.textMuted, opacity: 0.45,
            marginTop: k === 0 ? 34 : 16, width: k === 2 ? "62%" : "100%" }} />
        ))}

        <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 40, flex: 1 }}>
          {clausulas.map((cl, i) => {
            const e = r.entrada(cl, 10);
            const marca = spring({ frame: r.desde(cl) - 8, fps, config: { damping: 200 }, durationInFrames: 12 });
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 22, opacity: e }}>
                <svg width={58} height={58}>
                  <rect x={3} y={3} width={52} height={52} rx={8} fill="none" stroke={c.bg} strokeWidth={5} />
                  {r.entrou(cl) && (
                    <path d="M 13 30 L 25 42 L 46 16" fill="none" stroke={c.costDim} strokeWidth={8}
                      strokeLinecap="round" strokeLinejoin="round" strokeDasharray={60}
                      strokeDashoffset={60 * (1 - marca)} />
                  )}
                </svg>
                <span style={{ fontFamily: fonts.display, fontSize: 46, fontWeight: 800, color: c.bg }}>
                  {cl.texto}
                </span>
              </div>
            );
          })}
        </div>

        <div style={{ fontFamily: "'Brush Script MT', 'Segoe Script', cursive", fontSize: 64, color: c.costDim,
          height: 80, textAlign: "center" }}>
          {assina ? assinatura.texto!.slice(0, letras) : cursor ? "|" : ""}
        </div>
        <div style={{ height: 4, backgroundColor: c.bg }} />
        <div style={{ fontFamily: fonts.body, fontSize: 30, fontWeight: 700, color: c.bgRaise, opacity: 0.7,
          textAlign: "center", marginTop: 10 }}>
          {assinatura.rotulo ?? "assinatura"}
        </div>

        {/* Entra quase sem zoom: a 1,5x o carimbo "Dava para recusar?" passava de
            x=934 nos quadros da entrada. Medido, nao estimado. */}
        {carimbo && cE > 0 && (
          <div style={{
            position: "absolute", left: "50%", top: "52%",
            transform: `translate(-50%, -50%) rotate(-12deg) scale(${interpolate(cE, [0, 1], [1.05, 1])})`,
            border: `8px solid ${c.cost}`, borderRadius: 16, padding: "14px 30px",
            fontFamily: fonts.display, fontSize: 64, fontWeight: 900, color: c.cost,
            whiteSpace: "nowrap", opacity: cE, backgroundColor: "rgba(243,239,230,0.85)",
          }}>
            {carimbo.texto}
          </div>
        )}
      </div>

      {selo && <SeloRef selo={selo} r={r} topo={TOPO + PAPEL_H + 30} />}
    </AbsoluteFill>
  );
};
