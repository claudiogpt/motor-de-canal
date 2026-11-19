import React from "react";
import { AbsoluteFill } from "remotion";
import { c, fonts } from "../brand";
import { DesenhaSlide } from "./slides";
import type { CarrosselProps } from "./tipos";

/**
 * Um slide do carrossel, 1080x1350.
 *
 * A composicao recebe o carrossel.json inteiro e o indice de qual slide
 * desenhar. O render-carrossel.sh chama o still uma vez por slide, trocando so
 * `slideAtual`. O arquivo inteiro vai em todos os renders de proposito: e assim
 * que o rodape sabe quantos slides existem para desenhar o progresso.
 *
 * SEM CHECAGEM DE AUDIO, E SEM calculateMetadata.
 *
 * Reel e Longo travam o render quando falta audio/tempos.json, em tres camadas:
 * o shell, o calculateMetadata e o corpo do componente. Isso esta certo la,
 * porque sem o audio medido nao existe duracao. Aqui nao existe audio nenhum, e
 * o precedente de composicao estatica no projeto e a `Capa` 16:9 do video
 * longo: durationInFrames 1, nenhum calculateMetadata.
 */
export const Slide: React.FC<CarrosselProps> = ({ serie, slides, slideAtual }) => {
  const i = Math.max(0, Math.min(slideAtual ?? 0, slides.length - 1));
  const slide = slides[i];

  // Indice fora da lista nao deve render preto em silencio: um PNG preto
  // passaria pelo medidor de area segura e iria para o Instagram como capa.
  if (!slide) {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: c.cost,
          color: c.text,
          fontFamily: fonts.display,
          fontSize: 56,
          fontWeight: 900,
          padding: 80,
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        carrossel.json sem slide no índice {slideAtual}
      </AbsoluteFill>
    );
  }

  return (
    <DesenhaSlide slide={slide} serie={serie} total={slides.length} atual={i} />
  );
};
