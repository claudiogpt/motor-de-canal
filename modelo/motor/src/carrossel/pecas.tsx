import React from "react";
import { AbsoluteFill } from "remotion";
import { c, fonts } from "../brand";
import { FOLGA, MARGEM, Q } from "./marca45";
import type { Cor, Marca } from "./tipos";

/**
 * Prende o cifrao ao numero.
 *
 * MEDIDO NO PRIMEIRO RENDER: o titulo "Da diferenca de R$ 1.323, isto e
 * dinheiro seu" quebrou entre "R$" e "1.323", deixando o cifrao sozinho no fim
 * da linha. O mesmo risco existe em toda cena que mostra dinheiro, e este
 * canal mostra dinheiro o tempo todo. Espaco inquebravel resolve na origem, em
 * vez de depender de o autor reescrever a frase ate caber.
 */
export const moeda = (s: string) => s.replace(/R\$\s/g, "R$\u00A0");

/** Cor de texto a partir do campo do JSON. Mesma convencao dos Reels. */
export const cor = (k?: Cor) =>
  k === "ouro" ? c.goldBright : k === "custo" ? c.cost : k === "fraco" ? c.textMuted : c.text;

/**
 * Fundo do carrossel. Adaptado do `Fundo` local de longo/Capa.tsx, com uma
 * diferenca deliberada: SEM a barra de ouro sangrada na base.
 *
 * Ouro tem brilho perto de 201 e o medidor acusa estouro acima de 110 em
 * qualquer faixa de margem, entao uma barra sangrada reprovaria todo slide. A
 * assinatura da marca aqui e o losango e o selo hanko, os dois dentro da
 * margem. Ver a nota em marca45.ts.
 *
 * O brilho do gradiente fica deslocado do centro de proposito: a identidade do
 * canal pede assimetria, e o vazio do lado oposto e o que faz peso.
 */
export const Fundo45: React.FC = () => (
  <>
    <AbsoluteFill style={{ backgroundColor: c.bg }} />
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(58% 48% at 30% 30%, rgba(201,162,39,0.17) 0%, rgba(201,162,39,0) 72%)",
      }}
    />
    <AbsoluteFill
      style={{
        backgroundImage: `linear-gradient(${c.rule} 1px, transparent 1px), linear-gradient(90deg, ${c.rule} 1px, transparent 1px)`,
        backgroundSize: "72px 72px",
        opacity: 0.4,
        maskImage: "radial-gradient(72% 62% at 42% 44%, black 0%, transparent 84%)",
        WebkitMaskImage: "radial-gradient(72% 62% at 42% 44%, black 0%, transparent 84%)",
      }}
    />
  </>
);

/**
 * Losango da marca, a primitiva do avatar.
 *
 * CHEIO E FATO, VAZADO E HIPOTESE. A regra vem de marca/IDENTIDADE.md e vale
 * no canal inteiro; aqui ela marca o slide, para quem le saber de que tipo e a
 * afirmacao sem precisar de rodape explicando.
 */
export const Losango: React.FC<{ marca?: Marca; lado?: number }> = ({ marca, lado = 26 }) => {
  const cheio = marca !== "hipotese";
  return (
    <svg width={lado} height={lado} viewBox="0 0 26 26" style={{ display: "block" }}>
      <path
        d="M 13 1 L 25 13 L 13 25 L 1 13 Z"
        fill={cheio ? c.gold : "none"}
        stroke={c.gold}
        strokeWidth={cheio ? 0 : 3}
      />
    </svg>
  );
};

/**
 * Selo hanko: quadrado vermelho com o losango vazado por dentro, como um selo
 * de carimbo gravado. Marca a virada e o fecho, e e o UNICO vermelho do slide.
 *
 * O vermelho tijolo da marca significa custo. No carrossel ele passa a
 * significar tambem "aqui esta o ponto", porque o selo e, por construcao, o
 * lugar onde o argumento vira. Dois usos nao se cruzam: o selo e desenho, nao
 * numero.
 */
export const Hanko: React.FC<{ lado?: number }> = ({ lado = 104 }) => (
  <svg width={lado} height={lado} viewBox="0 0 104 104" style={{ display: "block" }}>
    <rect x={2} y={2} width={100} height={100} rx={8} fill={c.cost} />
    <rect x={2} y={2} width={100} height={100} rx={8} fill="none" stroke={c.costDim} strokeWidth={4} />
    {/* Losango vazado, recortado no selo. */}
    <path d="M 52 22 L 82 52 L 52 82 L 22 52 Z" fill="none" stroke={c.text} strokeWidth={7} />
    <path d="M 52 38 L 66 52 L 52 66 L 38 52 Z" fill={c.text} />
  </svg>
);

/**
 * Nome da serie correndo na vertical, como coluna de cartaz japones.
 * So na capa: nos slides de conteudo ele roubaria largura da coluna de texto.
 */
export const SerieVertical: React.FC<{ serie: string; topo: number }> = ({ serie, topo }) => (
  <div
    style={{
      position: "absolute",
      left: MARGEM.lado,
      top: topo,
      writingMode: "vertical-rl",
      fontFamily: fonts.display,
      fontSize: 30,
      fontWeight: 700,
      letterSpacing: 10,
      textTransform: "uppercase",
      color: c.goldDim,
      whiteSpace: "nowrap",
    }}
  >
    {serie}
  </div>
);

/**
 * Marcador de progresso: um ponto por slide, o ativo em ouro.
 *
 * O Instagram tem o proprio marcador, mas ele fica FORA da imagem e desaparece
 * em print e em republicacao. Este fica dentro, e e o que diz a quem chegou no
 * slide 4 que faltam tres.
 */
export const Pontos: React.FC<{ total: number; atual: number }> = ({ total, atual }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
    {Array.from({ length: total }).map((_, i) => (
      <div
        key={i}
        style={{
          width: i === atual ? 28 : 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: i === atual ? c.gold : c.rule,
        }}
      />
    ))}
  </div>
);

/**
 * Rodape dos slides de conteudo: serie, progresso e a primitiva da marca.
 *
 * Fica ANCORADO dentro da margem, nao posicionado por deslocamento fixo. Foi
 * exatamente o erro que a linha de fonte dos Reels cometeu em outubro, quando
 * caiu dentro da faixa de interface do Instagram por estar posicionada a mao.
 */
export const RodapeSlide: React.FC<{
  serie: string;
  total: number;
  atual: number;
  /** `null` quando o slide nao tem numero: ai nao ha losango nenhum. */
  marca: Marca | null;
}> = ({ serie, total, atual, marca }) => (
  <div
    style={{
      position: "absolute",
      left: MARGEM.lado + FOLGA,
      right: MARGEM.lado + FOLGA,
      bottom: MARGEM.base + FOLGA,
      height: ALTURA_RODAPE,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      borderTop: `2px solid ${c.rule}`,
      paddingTop: 20,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      {marca ? <Losango marca={marca} /> : null}
      <span
        style={{
          fontFamily: fonts.display,
          fontSize: 26,
          fontWeight: 700,
          letterSpacing: 5,
          textTransform: "uppercase",
          color: c.textFaint,
          whiteSpace: "nowrap",
        }}
      >
        {serie}
      </span>
    </div>
    <Pontos total={total} atual={atual} />
  </div>
);

/** Altura reservada ao rodape, descontada da caixa de conteudo. */
export const ALTURA_RODAPE = 64;

/** Topo e base da caixa de conteudo dos slides que levam rodape. */
export const CAIXA = {
  topo: MARGEM.topo,
  base: Q.h - MARGEM.base - ALTURA_RODAPE - 36,
};
