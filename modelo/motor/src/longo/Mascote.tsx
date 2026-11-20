/**
 * O professor do canal: um personagem 2D com expressoes.
 *
 * Pedido do dono do canal: "um pet, um personagem 2d pra gnt usar nos
 * videos como professor, com expressoes criativas, isso engaja". Em 05/11 ele
 * reprovou a capivara e pediu mais opcoes "no estilo coruja": silhueta
 * redonda, olhos grandes, sobrancelha grossa.
 *
 * Quatro decisoes que vale deixar escritas:
 *
 * 1. **Desenhado em SVG aqui, nao gerado.** Imagem de IA custaria GPU a cada
 *    render e nao seria identica entre videos. Em SVG o personagem e um
 *    componente: muda de expressao por prop, nunca por arquivo novo.
 *
 * 2. **A expressao e um conjunto de numeros, nao um desenho por humor.** Olho,
 *    palpebra, sobrancelha e boca sao parametros. Expressao nova e uma linha
 *    na tabela CARAS, e da para interpolar entre duas.
 *
 * 3. **O rosto e um nucleo unico, e cada bicho e so uma "pele".** Olhos,
 *    pupilas e sobrancelhas vivem em `Rosto`, usado por todos. Assim nenhuma
 *    opcao fica com expressao pior que a outra por descuido de quem desenhou,
 *    e trocar de personagem depois nao custa reescrever as caras.
 *
 * 4. **Ele nao fala.** A voz e a do canal. O mascote reage: duvida, aprova, se
 *    espanta. E o que prende atencao sem acrescentar texto na tela.
 */

import React from "react";
import { c } from "../brand";

export type Humor =
  | "neutro"
  | "explica"
  | "pensa"
  | "espanta"
  | "cetico"
  | "aprova"
  | "discorda"
  | "ri";

/** A expressao, em numeros. Toda cara nova e uma linha nesta tabela. */
type Cara = {
  /** 0 fechado, 1 normal, 1.9 arregalado. */
  olho: number;
  /** Para onde olha, em fracao do raio: -1 esquerda, 1 direita. */
  pupilaX: number;
  pupilaY: number;
  /** Angulo da sobrancelha, em graus. Positivo = ponta de fora para cima. */
  cenho: number;
  /** Altura da sobrancelha. Negativo sobe. */
  cenhoY: number;
  /** -1 bico para baixo, 0 reta, 1 sorriso. */
  boca: number;
  /** Abertura da boca. */
  bocaAbre: number;
  /** Inclinacao da cabeca, em graus. */
  cabeca: number;
};

const CARAS: Record<Humor, Cara> = {
  neutro:   { olho: 1,    pupilaX: 0,     pupilaY: 0,    cenho: 0,   cenhoY: 0,   boca: 0.3,  bocaAbre: 0,  cabeca: 0 },
  explica:  { olho: 1.1,  pupilaX: 0.3,   pupilaY: -0.2, cenho: 4,   cenhoY: -4,  boca: 0.5,  bocaAbre: 14, cabeca: -3 },
  pensa:    { olho: 0.85, pupilaX: -0.6,  pupilaY: -0.6, cenho: 18,  cenhoY: -8,  boca: -0.3, bocaAbre: 0,  cabeca: 9 },
  espanta:  { olho: 1.9,  pupilaX: 0,     pupilaY: 0,    cenho: -14, cenhoY: -22, boca: 0,    bocaAbre: 34, cabeca: -2 },
  cetico:   { olho: 0.7,  pupilaX: 0.55,  pupilaY: -0.1, cenho: 34,  cenhoY: -16, boca: -0.7, bocaAbre: 0,  cabeca: 7 },
  aprova:   { olho: 0.5,  pupilaX: 0,     pupilaY: 0,    cenho: -4,  cenhoY: -6,  boca: 1,    bocaAbre: 8,  cabeca: -4 },
  discorda: { olho: 1,    pupilaX: 0,     pupilaY: 0.2,  cenho: -16, cenhoY: 2,   boca: -1,   bocaAbre: 0,  cabeca: 2 },
  ri:       { olho: 0.2,  pupilaX: 0,     pupilaY: 0,    cenho: -2,  cenhoY: -8,  boca: 1,    bocaAbre: 30, cabeca: -6 },
};

export const HUMORES: Humor[] = [
  "neutro", "explica", "pensa", "espanta", "cetico", "aprova", "discorda", "ri",
];

/** Estado animado: respiro, piscada e balanco. Um calculo so, para todos. */
const vida = (t: number, f: Cara) => {
  const fase = (t * 2) % 1;
  const pisca = fase > 0.94 ? 1 - Math.abs(fase - 0.97) / 0.03 : 0;
  return {
    resp: Math.sin(t * Math.PI * 2 * 0.6) * 4,
    balanca: Math.sin(t * Math.PI * 2 * 0.45) * 2,
    olho: Math.max(0.06, f.olho * (1 - pisca)),
  };
};

/**
 * O rosto: olhos, pupilas, brilho e sobrancelhas.
 *
 * Compartilhado por todos os bichos, para que a expressao nao dependa de quem
 * desenhou qual. A sobrancelha fica ACIMA do olho, grossa e bem escura: na
 * primeira versao ela era fina e na cor do pelo, e nenhuma cara se distinguia
 * das outras.
 */
const Rosto: React.FC<{
  f: Cara;
  olho: number;
  /** Distancia do centro ate cada olho. */
  dx: number;
  /** Altura dos olhos. */
  oy: number;
  /** Raio do olho. */
  r: number;
  traco: string;
  /** Teto do angulo da sobrancelha, para ela nao invadir orelha ou tufo. */
  limiteCenho?: number;
}> = ({ f, olho, dx, oy, r, traco, limiteCenho = 90 }) => (
  <>
    {[-dx, dx].map((x) => (
      <g key={x}>
        <ellipse cx={x} cy={oy} rx={r} ry={r * olho} fill={c.text} />
        <circle
          cx={x + f.pupilaX * (r * 0.4)}
          cy={oy + f.pupilaY * (r * 0.4)}
          r={r * 0.5 * Math.min(1, olho * 1.4)}
          fill="#1C1711"
        />
        {olho > 0.5 ? (
          <circle
            cx={x + f.pupilaX * (r * 0.4) - r * 0.17}
            cy={oy - r * 0.18 + f.pupilaY * (r * 0.4)}
            r={r * 0.16}
            fill={c.text}
          />
        ) : null}
      </g>
    ))}
    {[-1, 1].map((s) => (
      <line
        key={s}
        x1={s * (dx - r * 0.8)}
        y1={oy - r - 18 + f.cenhoY}
        x2={s * (dx + r * 0.8)}
        y2={oy - r - 18 + f.cenhoY}
        stroke={traco}
        strokeWidth={r * 0.35}
        strokeLinecap="round"
        transform={`rotate(${
          s * Math.max(-limiteCenho, Math.min(limiteCenho, f.cenho))
        } ${s * dx} ${oy - r - 18 + f.cenhoY})`}
      />
    ))}
  </>
);

/** Boca simples, que abre. Usada por quem nao tem bico. */
const Boca: React.FC<{ f: Cara; y: number; larg: number; traco: string }> = ({
  f,
  y,
  larg,
  traco,
}) =>
  f.bocaAbre > 2 ? (
    <path
      d={`M ${-larg} ${y} Q 0 ${y + f.boca * 10 + f.bocaAbre} ${larg} ${y} Q 0 ${y + f.boca * 6} ${-larg} ${y} Z`}
      fill={traco}
      stroke={traco}
      strokeWidth={6}
      strokeLinejoin="round"
    />
  ) : (
    <path
      d={`M ${-larg} ${y - f.boca * 6} Q 0 ${y + f.boca * 18} ${larg} ${y - f.boca * 6}`}
      fill="none"
      stroke={traco}
      strokeWidth={7}
      strokeLinecap="round"
    />
  );

type Props = { humor?: Humor; t?: number; tam?: number };

// --------------------------------------------------------------------- coruja
/**
 * A CORUJA e o mascote do canal, escolhida pelo dono do canal entre
 * capivara (reprovada), tatu-bola, jabuti e raposa.
 *
 * Le "professor" na primeira olhada, e os olhos grandes carregam expressao
 * mesmo pequena, que e o que importa num feed de miniaturas.
 */
export const Coruja: React.FC<
  Props & {
    /** Capelo de professora. Ligado por padrao: e o papel dela no canal. */
    chapeu?: boolean;
    /** A asa levantada aponta para o grafico, do lado indicado. */
    aponta?: "esq" | "dir" | null;
    /** 0 a 1: o quanto ela esta "andando". Move o corpo e as patas. */
    anda?: number;
  }
> = ({ humor = "neutro", t = 0, tam = 300, chapeu = true, aponta = null, anda = 0 }) => {
  const f = CARAS[humor];
  const v = vida(t, f);
  const pena = "#7F694E";
  const traco = "#2E251A";
  const asa = "#5A4A36";
  // Passo: um gingado lento, com o corpo subindo um pouco a cada meio ciclo.
  // Nao e caminhada de verdade, e o suficiente para ela nao parecer um adesivo.
  const passo = Math.sin(t * Math.PI * 2 * 1.2);
  const desl = anda * passo * 16;
  const salto = anda * Math.abs(Math.cos(t * Math.PI * 2 * 1.2)) * -7;
  // A asa que aponta sobe e desce de leve, para o gesto ter vida.
  const gesto = aponta ? -52 - Math.sin(t * Math.PI * 2 * 0.9) * 10 : 0;
  return (
    <g
      transform={`translate(${desl} ${v.resp + salto}) rotate(${
        f.cabeca + v.balanca + anda * passo * 2
      } 0 20) scale(${tam / 300})`}
    >
      {/* patinhas, que so aparecem quando ela anda */}
      {anda > 0.02 ? (
        <g opacity={Math.min(1, anda)}>
          <ellipse cx={-38 + passo * 14} cy={238} rx={26} ry={12} fill={c.gold} />
          <ellipse cx={38 - passo * 14} cy={238} rx={26} ry={12} fill={c.gold} />
        </g>
      ) : null}
      <ellipse cx={0} cy={110} rx={120} ry={132} fill={pena} />
      <ellipse cx={0} cy={140} rx={76} ry={92} fill={c.gold} opacity={0.42} />
      {/* asas. Quem aponta nao gira a asa parada: desenha outra, estendida.
          Girar pelo ombro jogava o desenho por cima do peito. */}
      {aponta === "esq" ? (
        <g transform={`translate(0 ${gesto * 0.35})`}>
          <path d="M -104 86 q -70 -16 -128 -44 q 8 34 24 52 q 42 18 104 14 Z" fill={asa} />
          <path d="M -232 42 l -26 -4 l 20 18 Z" fill={c.gold} />
        </g>
      ) : (
        <path d="M -116 60 q -26 90 10 150 q 24 -28 26 -120 Z" fill={asa} />
      )}
      {aponta === "dir" ? (
        <g transform={`translate(0 ${gesto * 0.35})`}>
          <path d="M 104 86 q 70 -16 128 -44 q -8 34 -24 52 q -42 18 -104 14 Z" fill={asa} />
          <path d="M 232 42 l 26 -4 l -20 18 Z" fill={c.gold} />
        </g>
      ) : (
        <path d="M 116 60 q 26 90 -10 150 q -24 -28 -26 -120 Z" fill={asa} />
      )}
      <path d="M -96 -66 l -16 -62 l 54 32 Z" fill={pena} />
      <path d="M 96 -66 l 16 -62 l -54 32 Z" fill={pena} />
      <circle cx={0} cy={-18} r={118} fill={pena} />
      {[-54, 54].map((x) => (
        <circle key={x} cx={x} cy={-26} r={54} fill={asa} opacity={0.75} />
      ))}
      <Rosto f={f} olho={v.olho} dx={54} oy={-26} r={40} traco={traco} limiteCenho={26} />
      <path
        d={`M 0 4 l -22 22 q 22 ${18 + f.bocaAbre} 44 0 Z`}
        fill={c.gold}
        stroke={c.goldDim}
        strokeWidth={3}
      />
      {chapeu ? <Capelo balanco={v.balanca + anda * passo * 3} /> : null}
    </g>
  );
};

/**
 * Capelo de formatura, com borla.
 *
 * Desenhado depois da cabeca de proposito, para pousar sobre ela. A borla
 * balanca com o movimento da cabeca, e e o detalhe que faz o chapeu parecer
 * posto e nao colado.
 */
const Capelo: React.FC<{ balanco: number }> = ({ balanco }) => {
  const bx = 74 + balanco * 2.2;
  return (
    <g transform="translate(0 -104)">
      {/* copa */}
      <ellipse cx={0} cy={6} rx={62} ry={26} fill="#241C12" />
      <rect x={-62} y={-16} width={124} height={24} rx={8} fill="#241C12" />
      {/* a tabua quadrada */}
      <path d="M 0 -58 L 118 -18 L 0 22 L -118 -18 Z" fill="#2E251A" />
      <path d="M 0 -58 L 118 -18 L 0 22 L -118 -18 Z" fill="none" stroke={c.goldDim} strokeWidth={4} />
      {/* borla */}
      <circle cx={0} cy={-18} r={7} fill={c.gold} />
      <path d={`M 0 -18 Q ${bx * 0.6} -26 ${bx} 4`} stroke={c.gold} strokeWidth={5} fill="none" />
      <path d={`M ${bx} 4 l -7 34 l 14 0 Z`} fill={c.gold} />
    </g>
  );
};

// ------------------------------------------------------------------ tatu-bola
/**
 * Tatu-bola.
 *
 * E brasileiro, e a forma dele CONTA o conteudo do canal: ele se fecha quando
 * desconfia, que e exatamente o mecanismo de Hobbes do video 2. As placas do
 * casco dao textura sem precisar de detalhe fino.
 */
export const Tatu: React.FC<Props> = ({ humor = "neutro", t = 0, tam = 300 }) => {
  const f = CARAS[humor];
  const v = vida(t, f);
  const casco = "#8C7D6B";
  const cascoEsc = "#5E5243";
  const pele = "#C0A079";
  const traco = "#2E251A";
  return (
    <g transform={`translate(0 ${v.resp}) rotate(${f.cabeca + v.balanca} 0 20) scale(${tam / 300})`}>
      {/* casco: meia-lua com placas, que e a silhueta reconhecivel */}
      <path d="M -126 150 a 126 126 0 0 1 252 0 Z" fill={casco} />
      {[-84, -42, 0, 42, 84].map((x) => (
        <path
          key={x}
          d={`M ${x} 150 L ${x} ${150 - Math.sqrt(Math.max(0, 126 * 126 - x * x))}`}
          stroke={cascoEsc}
          strokeWidth={5}
          opacity={0.7}
        />
      ))}
      <path d="M -126 150 a 126 126 0 0 1 252 0 Z" fill="none" stroke={cascoEsc} strokeWidth={7} />
      <ellipse cx={0} cy={152} rx={128} ry={16} fill={cascoEsc} />
      {/* patinhas */}
      <ellipse cx={-62} cy={166} rx={28} ry={16} fill={pele} />
      <ellipse cx={62} cy={166} rx={28} ry={16} fill={pele} />
      {/* cabeca redonda, com a placa do topo */}
      <circle cx={0} cy={-6} r={112} fill={pele} />
      <path d="M -112 -6 a 112 112 0 0 1 224 0 Z" fill={casco} opacity={0.85} />
      <path d="M -112 -6 h 224" stroke={cascoEsc} strokeWidth={5} opacity={0.6} />
      {/* orelhinhas */}
      <ellipse cx={-96} cy={-54} rx={20} ry={30} fill={pele} transform="rotate(-18 -96 -54)" />
      <ellipse cx={96} cy={-54} rx={20} ry={30} fill={pele} transform="rotate(18 96 -54)" />
      {/* focinho comprido, a marca do tatu */}
      <ellipse cx={0} cy={54} rx={46} ry={34} fill="#D8BC98" />
      <ellipse cx={-15} cy={46} rx={7} ry={5} fill={traco} />
      <ellipse cx={15} cy={46} rx={7} ry={5} fill={traco} />
      <Rosto f={f} olho={v.olho} dx={50} oy={-18} r={36} traco={traco} />
      <Boca f={f} y={74} larg={26} traco={traco} />
    </g>
  );
};

// --------------------------------------------------------------------- jabuti
/**
 * Jabuti.
 *
 * O bicho do "devagar e sempre" e do folclore brasileiro, onde ele sempre
 * ganha pela cabeca e nao pela forca: e a promessa do canal em forma de
 * animal. O casco em placas douradas amarra com a marca sem precisar de
 * acessorio.
 */
export const Jabuti: React.FC<Props> = ({ humor = "neutro", t = 0, tam = 300 }) => {
  const f = CARAS[humor];
  const v = vida(t, f);
  const casco = "#7A6230";
  const cascoEsc = "#4A3B1C";
  const pele = "#6E7A52";
  const peleClara = "#8A9868";
  const traco = "#23200F";
  return (
    <g transform={`translate(0 ${v.resp}) rotate(${f.cabeca + v.balanca} 0 20) scale(${tam / 300})`}>
      {/* casco em domo, com as placas hexagonais sugeridas */}
      <path d="M -132 156 a 132 118 0 0 1 264 0 Z" fill={casco} />
      {[-66, 0, 66].map((x) => (
        <circle key={x} cx={x} cy={96} r={30} fill={c.gold} opacity={0.3} />
      ))}
      {[-33, 33].map((x) => (
        <circle key={x} cx={x} cy={44} r={30} fill={c.gold} opacity={0.3} />
      ))}
      <path d="M -132 156 a 132 118 0 0 1 264 0 Z" fill="none" stroke={cascoEsc} strokeWidth={8} />
      <ellipse cx={0} cy={158} rx={134} ry={14} fill={cascoEsc} />
      {/* patinhas de fora do casco */}
      <ellipse cx={-110} cy={150} rx={34} ry={20} fill={pele} transform="rotate(-14 -110 150)" />
      <ellipse cx={110} cy={150} rx={34} ry={20} fill={pele} transform="rotate(14 110 150)" />
      {/* pescoco e cabeca */}
      <rect x={-34} y={-10} width={68} height={70} rx={30} fill={pele} />
      <circle cx={0} cy={-34} r={104} fill={peleClara} />
      <ellipse cx={0} cy={28} rx={56} ry={38} fill={pele} opacity={0.45} />
      <ellipse cx={-17} cy={12} rx={7} ry={5} fill={traco} />
      <ellipse cx={17} cy={12} rx={7} ry={5} fill={traco} />
      <Rosto f={f} olho={v.olho} dx={48} oy={-48} r={36} traco={traco} />
      <Boca f={f} y={46} larg={30} traco={traco} />
    </g>
  );
};

// -------------------------------------------------------------------- raposa
/**
 * Raposa.
 *
 * E o animal de quem enxerga o incentivo por tras da regra, que e o que o
 * canal faz. O triangulo das orelhas e do focinho da uma silhueta mais
 * angulosa que as outras tres, entao e a mais facil de reconhecer pequena.
 */
export const Raposa: React.FC<Props> = ({ humor = "neutro", t = 0, tam = 300 }) => {
  const f = CARAS[humor];
  const v = vida(t, f);
  const pelo = "#B5692F";
  const peloEsc = "#8A4A1E";
  const claro = "#E8DCC8";
  const traco = "#2A1C10";
  return (
    <g transform={`translate(0 ${v.resp}) rotate(${f.cabeca + v.balanca} 0 20) scale(${tam / 300})`}>
      {/* rabo, atras do corpo */}
      <path d="M 96 160 q 110 -10 96 -110 q -56 26 -96 70 Z" fill={pelo} />
      <path d="M 170 70 q 28 -16 22 -20 q -24 2 -40 14 Z" fill={claro} />
      <ellipse cx={0} cy={138} rx={110} ry={116} fill={pelo} />
      <ellipse cx={0} cy={168} rx={66} ry={82} fill={claro} opacity={0.8} />
      {/* orelhas triangulares: o que faz a silhueta ser reconhecivel */}
      <path d="M -104 -54 l -16 -96 l 86 48 Z" fill={pelo} />
      <path d="M 104 -54 l 16 -96 l -86 48 Z" fill={pelo} />
      <path d="M -96 -58 l -8 -52 l 46 28 Z" fill={peloEsc} />
      <path d="M 96 -58 l 8 -52 l -46 28 Z" fill={peloEsc} />
      {/* cabeca em cunha */}
      <path d="M -112 -34 q 112 -74 224 0 q -16 96 -112 128 q -96 -32 -112 -128 Z" fill={pelo} />
      {/* mascara clara do focinho */}
      <path d="M -52 24 q 52 -26 104 0 q -16 54 -52 70 q -36 -16 -52 -70 Z" fill={claro} />
      <path d="M 0 66 l -16 14 q 16 12 32 0 Z" fill={traco} />
      <Rosto f={f} olho={v.olho} dx={52} oy={-14} r={36} traco={traco} />
      <Boca f={f} y={94} larg={24} traco={traco} />
    </g>
  );
};

export const BICHOS = {
  coruja: Coruja,
  tatu: Tatu,
  jabuti: Jabuti,
  raposa: Raposa,
} as const;

export type QualBicho = keyof typeof BICHOS;
