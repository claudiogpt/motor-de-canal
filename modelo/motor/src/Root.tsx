import React from "react";
import { Composition } from "remotion";
import { Reel } from "./Reel";
import { Longo } from "./longo/Longo";
import { Capa } from "./longo/Capa";
import { FolhaMascote } from "./longo/FolhaMascote";
import { Slide } from "./carrossel/Slide";
import { Historia } from "./historia/Historia";
import type { ReelProps } from "./tipos";
import type { LongoProps } from "./longo/tipos";
import type { CarrosselProps } from "./carrossel/tipos";
import type { HistoriaProps } from "./historia/tipos";
import exemplo from "./exemplo.json";
import exemploCarrossel from "./carrossel/exemplo.json";

/**
 * Uma composicao so, dirigida pelo reel.json do dia somado ao
 * audio/tempos.json da narracao (o render.sh junta os dois).
 *
 * A duracao total e a soma das duracoes medidas de cada bloco, que por sua vez
 * e a soma das suas batidas de voz. Nenhum numero de tempo e digitado a mao.
 */
export const RemotionRoot: React.FC = () => {
  return (
    <>
    <Composition
      id="Reel"
      component={Reel}
      defaultProps={exemplo as unknown as ReelProps}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={30 * 30}
      calculateMetadata={({ props }) => {
        const p = props as ReelProps;
        const fps = p.tempos?.fps ?? p.fps ?? 30;
        if (!p.tempos?.blocos?.length) {
          throw new Error(
            "reel sem audio/tempos.json: rode narrar_batidas.py antes do render.",
          );
        }
        const total = p.tempos.blocos.reduce(
          (acc, b) => acc + Math.round(b.duracao * fps),
          0,
        );
        return { durationInFrames: total, fps };
      }}
    />

    {/* Video longo 16:9. Mesma regra: a duracao sai do audio medido. */}
    <Composition
      id="Longo"
      component={Longo}
      defaultProps={exemplo as unknown as LongoProps}
      width={1920}
      height={1080}
      fps={30}
      durationInFrames={30 * 30}
      calculateMetadata={({ props }) => {
        const p = props as LongoProps;
        const fps = p.tempos?.fps ?? p.fps ?? 30;
        if (!p.tempos?.blocos?.length) {
          throw new Error(
            "longo sem audio/tempos.json: rode narrar_batidas.py antes do render.",
          );
        }
        const total = p.tempos.blocos.reduce(
          (acc, b) => acc + Math.round(b.duracao * fps),
          0,
        );
        return { durationInFrames: total, fps };
      }}
    />

    {/* Historia animada com personagens, desenhada pelo motion-kit.
        QUINTO FORMATO, ao lado dos outros: nao substitui cena nenhuma. A
        largura e a altura vem do proprio historia.json, porque a mesma
        historia serve 9:16 (Reel e Short) e 16:9 (YouTube). A duracao sai do
        audio medido, como em todos os formatos. */}
    <Composition
      id="Historia"
      component={Historia}
      defaultProps={exemplo as unknown as HistoriaProps}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={30 * 30}
      calculateMetadata={({ props }) => {
        const p = props as HistoriaProps;
        const fps = p.tempos?.fps ?? p.fps ?? 30;
        if (!p.tempos?.blocos?.length) {
          throw new Error(
            "historia sem audio/tempos.json: rode ferramentas/narrar.py antes do render.",
          );
        }
        const total = p.tempos.blocos.reduce(
          (acc, b) => acc + Math.round(b.duracao * fps),
          0,
        );
        const retrato = (p.formato ?? "9:16") === "9:16";
        return {
          durationInFrames: total,
          fps,
          width: retrato ? 1080 : 1920,
          height: retrato ? 1920 : 1080,
        };
      }}
    />

    {/* Capas 16:9 do video longo. Renderizadas como still, uma por variante. */}
    <Composition
      id="Capa"
      component={Capa}
      defaultProps={{ variante: "relogio" as const }}
      width={1280}
      height={720}
      fps={30}
      durationInFrames={1}
    />

    {/* Folha de contato do mascote: as duas propostas com todas as expressoes.
        E composicao de conferencia, como a Capa, e nao entra em video nenhum.
        Dura 90 frames para o pisca e o respiro aparecerem em video. */}
    <Composition
      id="Mascote"
      component={FolhaMascote}
      defaultProps={{ qual: "coruja" as const }}
      width={1920}
      height={1080}
      fps={30}
      durationInFrames={90}
    />

    {/* Carrossel de Instagram, 4:5. Um PNG por slide, quadro unico.
        Nao tem audio, logo nao tem calculateMetadata nem duracao derivada: o
        precedente e a Capa acima. O render-carrossel.sh chama o still uma vez
        por slide, trocando so `slideAtual` nos props. */}
    <Composition
      id="Carrossel"
      component={Slide}
      defaultProps={exemploCarrossel as unknown as CarrosselProps}
      width={1080}
      height={1350}
      fps={30}
      durationInFrames={1}
    />
    </>
  );
};
