import React from "react";
import { continueRender, delayRender, useCurrentFrame, useVideoConfig } from "remotion";
import { MK } from "./mk";
import type { Palco as PalcoMK } from "./mk";
import type { BatidaAbsoluta } from "./tipos";

/**
 * A ponte entre o motion-kit e o Remotion. É o único lugar do sistema onde o
 * desenho é imperativo, e ela existe para que ISSO NÃO QUEBRE A SINCRONIA.
 *
 * TRÊS DECISÕES, E CADA UMA EVITA UM DEFEITO CONCRETO.
 *
 * 1. UMA CENA PARA O VÍDEO INTEIRO, não uma por bloco.
 *
 *    `MK.start` zera o estado global do motion-kit (MK.pre, MK.__cams,
 *    MK.people, MK.__world). O MK é singleton. Se cada bloco tivesse a sua
 *    cena, cada <Sequence> que montasse zeraria as outras, e o render sairia
 *    diferente conforme a ordem em que o Remotion visitasse os frames. Com uma
 *    cena só, `MK.start` roda uma vez por página de render.
 *
 *    O áudio continua por batida, em <Sequence> separada, exatamente como no
 *    Reel. Os dois não se encontram, e é isso que mantém a garantia: o tempo
 *    sai do áudio medido, e o desenho só LÊ esse tempo.
 *
 * 2. AS BATIDAS ENTRAM COMO `cues` DO MOTION-KIT.
 *
 *    O MK já tem o conceito: `S.cue("b03-01")` devolve o segundo em que aquela
 *    fala começa. Então a cena agenda a ação na fala que a enuncia, sem
 *    número de frame escrito à mão, igual ao `naBatida` das cenas 9:16.
 *
 * 3. `seek` EM useLayoutEffect, NÃO EM useEffect.
 *
 *    O Remotion tira o retrato depois do commit do React. useLayoutEffect roda
 *    DENTRO do commit, antes da pintura; useEffect roda depois, e o primeiro
 *    quadro sairia com a cena no estado anterior.
 *
 * DETERMINISMO. `seek(t)` tem que desenhar o mesmo quadro independente da
 * ordem em que foi chamado, porque o Remotion renderiza faixas de frames em
 * páginas paralelas. O próprio motion-kit promete isso (docs/recipes.md:
 * compare capturas em seek(3.2) antes e depois de seek(7)). Se uma cena sua
 * acumular estado no callback, o render paralelo acusa: quadros iguais saem
 * diferentes entre execuções.
 */
export const Palco: React.FC<{
  /** Desenha a cena. Roda UMA vez: registre objetos e devolva o draw. */
  montar: (mk: ReturnType<typeof MK>, S: PalcoMK, svg: SVGSVGElement) => (t: number) => void;
  batidas: BatidaAbsoluta[];
  duracaoSegundos: number;
}> = ({ montar, batidas, duracaoSegundos }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const raiz = React.useRef<HTMLDivElement>(null);
  const relogio = React.useRef<{ seek: (t: number) => void } | null>(null);
  const [espera] = React.useState(() => delayRender("montando a cena do motion-kit"));

  React.useLayoutEffect(() => {
    if (relogio.current || !raiz.current) return;
    const mk = MK();

    const cues: Record<string, number> = {};
    for (const b of batidas) cues[b.cue] = b.t;

    const S = mk.start({
      root: raiz.current,
      width,
      height,
      duration: duracaoSegundos,
      cues,
    });

    const svg = mk.el("svg", {
      viewBox: `0 0 ${width} ${height}`,
      width,
      height,
      style: "position:absolute;inset:0",
    }) as SVGSVGElement;
    raiz.current.appendChild(svg);

    const draw = montar(mk, S, svg);
    relogio.current = mk.run(S, draw);
    continueRender(espera);
    // Monta uma vez só, de propósito: ver decisão 1 no comentário acima.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useLayoutEffect(() => {
    relogio.current?.seek(frame / fps);
  }, [frame, fps]);

  return (
    <div
      ref={raiz}
      style={{ position: "absolute", inset: 0, width, height, overflow: "hidden" }}
    />
  );
};
