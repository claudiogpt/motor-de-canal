import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useVideoConfig } from "remotion";
import { Fundo } from "./components/Fundo";
import { Selo } from "./components/Selo";
import { Gancho } from "./scenes/Gancho";
import { Escada } from "./scenes/Escada";
import { Setas } from "./scenes/Setas";
import { Ciclo } from "./scenes/Ciclo";
import { Cta } from "./scenes/Cta";
import { Regua } from "./scenes/Regua";
import { Barras } from "./scenes/Barras";
import { Rede } from "./scenes/Rede";
import { Piramide } from "./scenes/Piramide";
import { Contrato } from "./scenes/Contrato";
import { seg } from "./tempo";
import type { BatidaMedida, Bloco, ReelProps } from "./tipos";

const Cena: React.FC<{ bloco: Bloco; batidas: BatidaMedida[] }> = ({ bloco, batidas }) => {
  switch (bloco.tipo) {
    case "gancho":
      return <Gancho linhas={bloco.linhas} batidas={batidas} />;
    case "escada":
      return (
        <Escada
          titulo={bloco.titulo}
          degraus={bloco.degraus}
          rodape={bloco.rodape}
          batidas={batidas}
        />
      );
    case "setas":
      return <Setas origem={bloco.origem} saidas={bloco.saidas} batidas={batidas} />;
    case "ciclo":
      return (
        <Ciclo
          nos={bloco.nos}
          setas={bloco.setas}
          perfil={bloco.perfil}
          selo={bloco.selo}
          batidas={batidas}
        />
      );
    case "regua":
      return (
        <Regua
          eleitores={bloco.eleitores}
          extremos={bloco.extremos}
          candidatos={bloco.candidatos}
          votos={bloco.votos}
          mediano={bloco.mediano}
          legendas={bloco.legendas}
          selo={bloco.selo}
          batidas={batidas}
        />
      );
    case "barras":
      return (
        <Barras
          grupos={bloco.grupos}
          unidade={bloco.unidade}
          legendas={bloco.legendas}
          veu={bloco.veu}
          pior={bloco.pior}
          vencedor={bloco.vencedor}
          cresce={bloco.cresce}
          pergunta={bloco.pergunta}
          prefixo={bloco.prefixo}
          sufixo={bloco.sufixo}
          batidas={batidas}
        />
      );
    case "rede":
      return (
        <Rede centro={bloco.centro} nos={bloco.nos} pulso={bloco.pulso} legendas={bloco.legendas}
          selo={bloco.selo} batidas={batidas} />
      );
    case "piramide":
      return (
        <Piramide organiza={bloco.organiza} formar={bloco.formar} topo={bloco.topo}
          legendas={bloco.legendas} selo={bloco.selo} batidas={batidas} />
      );
    case "contrato":
      return (
        <Contrato titulo={bloco.titulo} clausulas={bloco.clausulas} assinatura={bloco.assinatura}
          carimbo={bloco.carimbo} legendas={bloco.legendas} selo={bloco.selo} batidas={batidas} />
      );
    case "cta":
      return <Cta pergunta={bloco.pergunta} acao={bloco.acao} batidas={batidas} />;
  }
};

/**
 * A linha de tempo sai do audio, nunca de duracao digitada a mao.
 *
 * Cada bloco dura a soma das suas batidas, e cada batida entra como <Audio>
 * no frame medido. Nao existe passo de mux depois do render: o MP4 ja sai
 * narrado, e por isso nao existe como a voz e a tela sairem de sincronia.
 *
 * Nao existe mais pilula de legenda nos blocos de conteudo. O texto na tela e
 * o proprio grafico da cena, que se monta batida por batida enquanto a voz
 * fala (decisao do dono do canal).
 */
export const Reel: React.FC<ReelProps> = ({ serie, blocos, tempos, audioBase }) => {
  const { fps } = useVideoConfig();

  if (!tempos || !tempos.blocos?.length) {
    throw new Error(
      "reel sem tempos: rode narrar_batidas.py antes do render. " +
        "A duracao de cada bloco vem de audio/tempos.json.",
    );
  }

  let cursor = 0;
  const comTempo = tempos.blocos.map((medido) => {
    const inicio = cursor;
    const dur = seg(medido.duracao, fps);
    cursor += dur;
    return { medido, bloco: blocos[medido.bloco - 1], inicio, dur };
  });

  return (
    <AbsoluteFill>
      {comTempo.map(({ medido, bloco, inicio, dur }) => (
        <Sequence
          key={medido.bloco}
          from={inicio}
          durationInFrames={dur}
          name={`${medido.bloco} ${medido.tipo}`}
        >
          <Fundo luz={bloco.tipo === "cta" ? "baixa" : "alta"} />
          <Cena bloco={bloco} batidas={medido.batidas} />

          {medido.batidas.map((b) => (
            <Sequence
              key={b.batida}
              from={seg(b.inicio, fps)}
              durationInFrames={seg(b.duracao, fps) + 1}
              name={`voz ${b.batida}`}
            >
              <Audio src={staticFile(`${audioBase}/${b.arquivo.replace(/^audio\//, "")}`)} />
            </Sequence>
          ))}
        </Sequence>
      ))}

      {/* O selo da serie cobre os 3 primeiros segundos, como pede o plano. */}
      <Sequence from={0} durationInFrames={seg(3, fps)} name="selo">
        <Selo serie={serie} sairEm={seg(3, fps)} />
      </Sequence>
    </AbsoluteFill>
  );
};
