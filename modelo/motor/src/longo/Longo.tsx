import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useVideoConfig } from "remotion";
import { Fundo } from "../components/Fundo";
import { seg } from "../tempo";
import {
  Cartoes16,
  Grade16,
  Colunas16,
  Cta16,
  Declara16,
  Escada16,
  Fatias16,
  Gancho16,
  Linha16,
  Medidas16,
} from "./cenas";
import {
  Anel16,
  Balanca16,
  Convergencia16,
  Figuras16,
  Frase16,
  Numero16,
  Professora16,
  Teia16,
  Waffle16,
} from "./visuais";
import { Entra, Respira } from "./movimento";
import type { BatidaMedida, BlocoL, LongoProps } from "./tipos";

const Cena: React.FC<{ bloco: BlocoL; batidas: BatidaMedida[] }> = ({ bloco, batidas }) => {
  switch (bloco.tipo) {
    case "gancho":
      return <Gancho16 linhas={bloco.linhas} batidas={batidas} />;
    case "escada":
      return (
        <Escada16 titulo={bloco.titulo} degraus={bloco.degraus} nota={bloco.nota} batidas={batidas} />
      );
    case "grade":
      return (
        <Grade16 titulo={bloco.titulo} colunas={bloco.colunas} linhas2={bloco.linhas2}
                 celulas={bloco.celulas} destaque={bloco.destaque} batidas={batidas} />
      );
    case "cartoes":
      return <Cartoes16 titulo={bloco.titulo} cartoes={bloco.cartoes} batidas={batidas} />;
    case "colunas":
      return (
        <Colunas16 titulo={bloco.titulo} colunas={bloco.colunas} nota={bloco.nota} batidas={batidas} />
      );
    case "fatias":
      return (
        <Fatias16
          titulo={bloco.titulo}
          fatias={bloco.fatias}
          total={bloco.total}
          nota={bloco.nota}
          batidas={batidas}
        />
      );
    case "linha":
      return <Linha16 titulo={bloco.titulo} eventos={bloco.eventos} batidas={batidas} />;
    case "medidas":
      return (
        <Medidas16 titulo={bloco.titulo} medidas={bloco.medidas} nota={bloco.nota} batidas={batidas} />
      );
    case "declara":
      return <Declara16 titulo={bloco.titulo} linhas={bloco.linhas} batidas={batidas} />;
    case "frase":
      return <Frase16 selo={bloco.selo} linhas={bloco.linhas} batidas={batidas} />;
    case "teia":
      return <Teia16 titulo={bloco.titulo} etapas={bloco.etapas} batidas={batidas} />;
    case "figuras":
      return <Figuras16 titulo={bloco.titulo} itens={bloco.itens} batidas={batidas} />;
    case "anel":
      return (
        <Anel16 titulo={bloco.titulo} soberano={bloco.soberano} corte={bloco.corte} batidas={batidas} />
      );
    case "waffle":
      return (
        <Waffle16 titulo={bloco.titulo} k={bloco.k} rotulo={bloco.rotulo}
                  rotuloResto={bloco.rotuloResto} nota={bloco.nota} batidas={batidas} />
      );
    case "balanca":
      return (
        <Balanca16 titulo={bloco.titulo} esquerda={bloco.esquerda} direita={bloco.direita}
                   pende={bloco.pende} batidas={batidas} />
      );
    case "convergencia":
      return <Convergencia16 titulo={bloco.titulo} etapas={bloco.etapas} batidas={batidas} />;
    case "numero":
      return (
        <Numero16 titulo={bloco.titulo} valor={bloco.valor} sufixo={bloco.sufixo}
                  rotulo={bloco.rotulo} antes={bloco.antes} batidas={batidas} />
      );
    case "professora":
      return (
        <Professora16 titulo={bloco.titulo} quadro={bloco.quadro} pose={bloco.pose} batidas={batidas} />
      );
    case "cta":
      return (
        <Cta16 pergunta={bloco.pergunta} opcoes={bloco.opcoes} acao={bloco.acao} batidas={batidas} />
      );
  }
};

/**
 * Video longo 16:9, mesma arquitetura do Reel: a linha de tempo sai do audio
 * medido, nunca de duracao digitada a mao. Cada bloco dura a soma das suas
 * batidas e cada batida entra como <Audio> no frame medido, entao nao existe
 * passo de mux depois do render e nao existe como a voz sair de sincronia.
 *
 * O que muda em relacao ao Reel: o quadro e 1920x1080, a area segura e a do
 * player do YouTube e nao a do Instagram, e nao ha selo de serie, porque num
 * video longo quem clicou ja sabe o que esta assistindo.
 */
export const Longo: React.FC<LongoProps> = ({ blocos, tempos, audioBase }) => {
  const { fps } = useVideoConfig();

  if (!tempos || !tempos.blocos?.length) {
    throw new Error(
      "longo sem tempos: rode narrar_batidas.py antes do render. " +
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
          name={`${medido.bloco} ${bloco?.tipo ?? "?"}`}
        >
          <Fundo luz={bloco?.tipo === "cta" ? "baixa" : "alta"} />
          {/* Movimento continuo do bloco inteiro: deriva lenta mais abertura e
              fechamento DENTRO dos proprios frames. Nada disto desloca a linha
              do tempo, entao a voz continua presa ao frame medido. */}
          {bloco && (
            <Respira dur={dur} semente={medido.bloco}>
              <Entra dur={dur}>
                <Cena bloco={bloco} batidas={medido.batidas} />
              </Entra>
            </Respira>
          )}

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
    </AbsoluteFill>
  );
};
