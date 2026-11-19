import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useVideoConfig } from "remotion";
import { Fundo } from "../components/Fundo";
import { Palco } from "./Palco";
import { CATALOGO } from "./cenas";
import { regua } from "./regua";
import { seg } from "../tempo";
import type { BatidaAbsoluta, HistoriaProps } from "./tipos";

/**
 * História animada com personagens, desenhada pelo motion-kit.
 *
 * É o quinto formato, ao lado de Reel, Longo e Carrossel, e NÃO substitui
 * nenhum: as cenas 9:16 de gráfico continuam onde estavam. Este formato serve
 * ao que gráfico não conta bem, que é uma troca entre pessoas.
 *
 * A LINHA DE TEMPO É A MESMA DE SEMPRE: sai de audio/tempos.json. A diferença
 * é só quem desenha. Uma cena do motion-kit cobre o vídeo inteiro e lê o
 * tempo; o áudio entra por batida, em <Sequence>, igual ao Reel. Não existe
 * mux depois do render.
 */
export const Historia: React.FC<HistoriaProps> = ({
  serie, blocos, tempos, audioBase, formato,
}) => {
  const { fps } = useVideoConfig();

  if (!tempos?.blocos?.length) {
    throw new Error(
      "história sem tempos: rode ferramentas/narrar.py antes do render. " +
        "A duração de cada bloco vem de audio/tempos.json.",
    );
  }

  // Tempo ABSOLUTO de cada batida. O motion-kit trabalha em segundos desde o
  // início do vídeo, porque a cena é uma só; o Reel trabalha em frames
  // relativos ao bloco, porque lá cada bloco tem a sua cena.
  const absolutas: BatidaAbsoluta[] = [];
  const porBloco: BatidaAbsoluta[][] = [];
  let t0 = 0;
  for (const medido of tempos.blocos) {
    const deste: BatidaAbsoluta[] = medido.batidas.map((b) => ({
      ...b,
      t: t0 + b.inicio,
      cue: `b${String(medido.bloco).padStart(2, "0")}-${String(b.batida).padStart(2, "0")}`,
      bloco: medido.bloco,
    }));
    porBloco[medido.bloco] = deste;
    absolutas.push(...deste);
    t0 += medido.duracao;
  }
  const duracaoSegundos = t0;

  const montar = React.useCallback(
    (mk: any, S: any, svg: SVGSVGElement) => {
      const R = regua(formato ?? "9:16");
      // Uma cena do catálogo por bloco, todas no mesmo palco e no mesmo
      // relógio. Cada uma só desenha dentro da sua janela de tempo.
      const desenhos = tempos.blocos.map((medido) => {
        const bloco = blocos[medido.bloco - 1];
        const cena = CATALOGO[bloco.cena];
        if (!cena) {
          throw new Error(
            `cena '${bloco.cena}' não existe no catálogo. ` +
              `Disponíveis: ${Object.keys(CATALOGO).join(", ")}. ` +
              "Para criar uma, veja src/historia/cenas.tsx.",
          );
        }
        const batidas = porBloco[medido.bloco] ?? [];
        const inicio = batidas.length ? batidas[0].t : 0;
        const camada = mk.g(svg, {});
        const draw = cena(mk, S, camada as SVGGElement, R,
                          bloco.dados ?? {}, batidas);
        return { draw, inicio, fim: inicio + medido.duracao, camada };
      });

      return (t: number) => {
        for (const d of desenhos) {
          const dentro = t >= d.inicio - 0.3 && t < d.fim;
          mk.attr(d.camada, { opacity: dentro ? 1 : 0 });
          // Desenha sempre, mesmo escondido: um draw que só roda dentro da
          // janela acumularia estado implícito na entrada, e o quadro passaria
          // a depender de quais frames vieram antes.
          d.draw(t);
        }
      };
    },
    // Monta uma vez por render: as dependências são os props, que não mudam.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  let cursor = 0;
  const janelas = tempos.blocos.map((medido) => {
    const inicio = cursor;
    const dur = seg(medido.duracao, fps);
    cursor += dur;
    return { medido, inicio, dur };
  });

  return (
    <AbsoluteFill>
      <Fundo luz="alta" />
      <Palco montar={montar} batidas={absolutas} duracaoSegundos={duracaoSegundos} />

      {janelas.map(({ medido, inicio }) =>
        medido.batidas.map((b) => (
          <Sequence
            key={`${medido.bloco}-${b.batida}`}
            from={inicio + seg(b.inicio, fps)}
            durationInFrames={seg(b.duracao, fps) + 1}
            name={`voz ${medido.bloco}-${b.batida}`}
          >
            <Audio src={staticFile(`${audioBase}/${b.arquivo.replace(/^audio\//, "")}`)} />
          </Sequence>
        )),
      )}
    </AbsoluteFill>
  );
};
