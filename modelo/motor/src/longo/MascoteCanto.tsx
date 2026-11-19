/**
 * A coruja assistindo junto, no canto do quadro.
 *
 * Pedido do Claudio em 05/11/2026: "adicione a coruja em todo o video... a
 * ideia e ela assistir junto com quem ta vendo, e ir reagindo com o video,
 * andando, mexendo, ela e como um professor".
 *
 * Por isso ela NAO e declarada bloco a bloco. Todo bloco tem mascote: o humor
 * sai de um padrao por tipo de cena (`HUMOR_PADRAO`), e o `longo.json` so
 * sobrescreve onde a reacao precisa ser outra. Assim nao existe bloco em que
 * ela esqueca de aparecer, que era o risco de declarar 46 vezes a mao.
 *
 * Ela fica por cima da cena e FORA da deriva do bloco (`Respira`): tem o
 * proprio respiro, piscada e passo, e somar os dois movimentos a faria
 * flutuar.
 */

import React from "react";
import { AbsoluteFill } from "remotion";
import { useRitmo } from "../batida";
import { Coruja, type Humor } from "./Mascote";
import { suave, useProgresso } from "./movimento";
import { ALT, Q, seguro } from "./marca16x9";
import type { BatidaMedida, BlocoL, MascoteL } from "./tipos";

/**
 * Como ela reage a cada tipo de cena, quando o bloco nao diz outra coisa.
 * Escolhido pelo que a cena faz, nao por variedade: `teia` e `waffle` revelam
 * um numero que surpreende, `grade` e `balanca` pedem ponderacao, e as cenas
 * de figura e frase sao ela explicando.
 */
const HUMOR_PADRAO: Record<string, Humor> = {
  gancho: "explica",
  frase: "explica",
  figuras: "explica",
  colunas: "explica",
  cartoes: "explica",
  escada: "explica",
  linha: "explica",
  medidas: "pensa",
  grade: "pensa",
  balanca: "pensa",
  fatias: "pensa",
  declara: "explica",
  teia: "espanta",
  waffle: "espanta",
  numero: "espanta",
  convergencia: "espanta",
  anel: "cetico",
  cta: "ri",
};

export const MascoteCanto: React.FC<{
  bloco: BlocoL;
  batidas: BatidaMedida[];
  dur: number;
  /** Indice do bloco, para variar o lado e o passo sem sorteio. */
  n: number;
}> = ({ bloco, batidas, dur, n }) => {
  const r = useRitmo(batidas);
  const prog = useProgresso(batidas);
  // Na cena `professora` ela ja e o elemento central: um segundo exemplar no
  // canto seria duas corujas na mesma tela.
  const ehCena = bloco.tipo === "professora";

  const declarado: MascoteL | undefined = bloco.mascote;
  // A reacao valendo e a ultima declarada que ja entrou; sem nenhuma, o padrao
  // do tipo de cena vale desde a primeira batida.
  const reacoes = declarado ? [declarado] : [];
  let humor: Humor = HUMOR_PADRAO[bloco.tipo] ?? "explica";
  for (const x of reacoes) if (r.entrou(x)) humor = x.humor as Humor;

  // SEMPRE no canto inferior direito. A primeira versao alternava os lados
  // para ela nao virar adesivo fixo, e isso custou duas medicoes: a esquerda
  // ela estourava a margem (496 quadros) e, depois de encolher, o capelo
  // cobria o rotulo "EU ATACO" da grade. O conteudo e que manda na tela, e a
  // metade esquerda e onde quase toda cena coloca rotulo.
  const dir = true;

  // Anda no comeco do bloco e para quando a cena se monta: e o que da a leitura
  // de "ela chegou para assistir este pedaço".
  const t = prog({ naBatida: 0 }, { parte: 1 });
  const anda = Math.max(0, 1 - t * 4);
  const entrada = suave(Math.min(1, r.desde({ naBatida: 0 }) / 16));

  // Medido em frame, nao estimado. Com a asa estendida o desenho vai de -258
  // a +232 em coordenadas locais; na escala de 180/300 isso da 155px a
  // esquerda da ancora e 150px abaixo dela. A grade, que e a cena mais larga,
  // termina em x=1420, entao sobram 113px de folga.
  const TAM = 180;
  const x = Q.w - seguro.right - 120;
  const y = seguro.top + ALT - 160;
  if (ehCena) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={Q.w} height={Q.h} viewBox={`0 0 ${Q.w} ${Q.h}`}>
        <g
          transform={`translate(${x} ${y}) scale(${
            (dir ? 1 : -1) * (0.82 + 0.18 * entrada)
          } ${0.82 + 0.18 * entrada})`}
          opacity={entrada * 0.97}
        >
          <Coruja
            humor={humor}
            t={(r.desde({ naBatida: 0 }) || 0) / 90}
            tam={TAM}
            anda={anda}
            aponta={humor === "explica" ? (dir ? "esq" : "dir") : null}
          />
        </g>
      </svg>
    </AbsoluteFill>
  );
};
