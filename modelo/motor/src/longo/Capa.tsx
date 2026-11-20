import React from "react";
import { AbsoluteFill } from "remotion";
import { c, fonts } from "../brand";

/**
 * Capas 16:9 do video longo, 1280x720, desenhadas em SVG.
 *
 * POR QUE EM REMOTION E NAO EM PIL. A primeira leva de capas era tipografia
 * pura, feita com PIL, e o dono do canal reprovou: numa grade de miniaturas, so
 * texto e o que o olho pula. Ilustracao exige vetor, e o projeto ja tem
 * Chromium pelo Remotion. Desenhar aqui tambem mantem a marca numa fonte so.
 *
 * REGRA DE LEGIBILIDADE. A capa e decidida em 320x180, nao em tela cheia.
 * Cada desenho tem silhueta grande e fechada, que sobrevive a reducao: um
 * relogio, blocos de semana, uma fachada. Detalhe fino nao entra.
 *
 * Sem pilula de legenda embaixo: reprovada tambem.
 */

export type VarianteCapa =
  | "relogio" | "semana" | "padaria"          // video 1, escala 6x1
  | "dilema" | "espadas" | "convergencia";    // video 2, o Estado e necessario

const Fundo: React.FC = () => (
  <>
    <AbsoluteFill style={{ backgroundColor: c.bg }} />
    <AbsoluteFill
      style={{
        background: `radial-gradient(62% 70% at 32% 46%, rgba(201,162,39,0.20) 0%, rgba(201,162,39,0) 70%)`,
      }}
    />
    <AbsoluteFill
      style={{
        backgroundImage: `linear-gradient(${c.rule} 1px, transparent 1px), linear-gradient(90deg, ${c.rule} 1px, transparent 1px)`,
        backgroundSize: "64px 64px",
        opacity: 0.45,
        maskImage: "radial-gradient(70% 70% at 50% 50%, black 0%, transparent 82%)",
        WebkitMaskImage: "radial-gradient(70% 70% at 50% 50%, black 0%, transparent 82%)",
      }}
    />
    {/* Barra de ouro na base: mesma assinatura do avatar da marca. */}
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 12, backgroundColor: c.gold }} />
  </>
);

/** Setor de circulo, usado para a fatia que falta no relogio. */
function setor(cx: number, cy: number, r: number, de: number, para: number) {
  const p = (g: number) => {
    const a = ((g - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  const [x1, y1] = p(de);
  const [x2, y2] = p(para);
  const grande = para - de > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${grande} 1 ${x2} ${y2} Z`;
}

// ------------------------------------------------------------------ A
/** Relogio com uma fatia arrancada: as horas que somem da semana. */
const Relogio: React.FC = () => {
  const cx = 352, cy = 340, R = 214;
  return (
    <AbsoluteFill>
      <Fundo />
      <svg width={1280} height={720} viewBox="0 0 1280 720" style={{ position: "absolute" }}>
        {/* Sombra do mostrador, para a silhueta fechar em miniatura. */}
        <circle cx={cx} cy={cy} r={R + 20} fill={c.bgRaise} />
        <circle cx={cx} cy={cy} r={R} fill={c.bg} stroke={c.gold} strokeWidth={18} />
        {/* A fatia que falta, de 12h a 2h. Vermelho de custo. */}
        <path d={setor(cx, cy, R - 10, 0, 60)} fill={c.cost} opacity={0.92} />
        <path d={setor(cx, cy, R - 10, 0, 60)} fill="none" stroke={c.bg} strokeWidth={10} />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = ((i * 30 - 90) * Math.PI) / 180;
          const r1 = R - 34, r2 = R - 58;
          return (
            <line
              key={i}
              x1={cx + r1 * Math.cos(a)} y1={cy + r1 * Math.sin(a)}
              x2={cx + r2 * Math.cos(a)} y2={cy + r2 * Math.sin(a)}
              stroke={i % 3 === 0 ? c.text : c.textFaint}
              strokeWidth={i % 3 === 0 ? 11 : 6}
              strokeLinecap="round"
            />
          );
        })}
        <line x1={cx} y1={cy} x2={cx} y2={cy - 120} stroke={c.text} strokeWidth={16} strokeLinecap="round" />
        <line x1={cx} y1={cy} x2={cx + 150} y2={cy + 44} stroke={c.text} strokeWidth={12} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={18} fill={c.gold} />
      </svg>
      <div
        style={{
          position: "absolute", left: 640, top: 0, width: 580, height: 708,
          display: "flex", flexDirection: "column", justifyContent: "center", gap: 2,
        }}
      >
        <div style={{ fontFamily: fonts.display, fontSize: 132, fontWeight: 900, color: c.text, lineHeight: 0.98 }}>
          8 HORAS
        </div>
        <div style={{ fontFamily: fonts.display, fontSize: 132, fontWeight: 900, color: c.gold, lineHeight: 0.98 }}>
          SOMEM
        </div>
        <div style={{ fontFamily: fonts.display, fontSize: 46, fontWeight: 700, color: c.textMuted, marginTop: 18 }}>
          da padaria, toda semana
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ B
/** A semana desenhada: 6x1 vira 5x2. O assunto do video, em forma. */
const Semana: React.FC = () => {
  const bloco = (x: number, y: number, trabalha: boolean, k: string) => (
    <g key={k}>
      <rect
        x={x} y={y} width={92} height={118} rx={16}
        fill={trabalha ? c.gold : c.bgRaise}
        stroke={trabalha ? c.goldBright : c.textFaint}
        strokeWidth={5}
      />
      {!trabalha && (
        <text x={x + 46} y={y + 80} textAnchor="middle" fontFamily={fonts.display}
              fontSize={54} fontWeight={900} fill={c.textMuted}>
          z
        </text>
      )}
    </g>
  );
  // Rotulo ACIMA de cada fileira, nao ao lado. Ao lado, "DEZEMBRO" em 50px
  // comecava em x=96 e passava por baixo dos blocos, que comecam em 306: a
  // palavra saia cortada. Acima, a largura do rotulo nao disputa com nada.
  const X0 = 640 - (7 * 92 + 6 * 12) / 2;
  const linha = (y: number, trabalhados: number) =>
    Array.from({ length: 7 }).map((_, i) =>
      bloco(X0 + i * 104, y, i < trabalhados, `${y}-${i}`),
    );
  const rotulo = (y: number, quando: string, escala: string, cor: string) => (
    <>
      <text x={X0} y={y} fontFamily={fonts.display} fontSize={46} fontWeight={900} fill={c.textMuted}>
        {quando}
      </text>
      <text x={X0 + 7 * 104 - 12} y={y} textAnchor="end" fontFamily={fonts.display}
            fontSize={58} fontWeight={900} fill={cor}>
        {escala}
      </text>
    </>
  );
    return (
    <AbsoluteFill>
      <Fundo />
      <svg width={1280} height={720} viewBox="0 0 1280 720" style={{ position: "absolute" }}>
        {rotulo(118, "HOJE", "6x1", c.textMuted)}
        {linha(144, 6)}
        {rotulo(366, "A PARTIR DE DEZEMBRO", "5x2", c.gold)}
        {linha(392, 5)}
      </svg>
      <div
        style={{
          position: "absolute", left: 0, right: 0, bottom: 46,
          textAlign: "center", fontFamily: fonts.display, fontSize: 76,
          fontWeight: 900, color: c.text,
        }}
      >
        E quem paga a conta?
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ C
/** A padaria do Seu Ze, com a porta fechando mais cedo. */
const Padaria: React.FC = () => (
  <AbsoluteFill>
    <Fundo />
    <svg width={1280} height={720} viewBox="0 0 1280 720" style={{ position: "absolute" }}>
      {/* Fachada */}
      <rect x={96} y={188} width={470} height={440} rx={10} fill={c.bgRaise} stroke={c.rule} strokeWidth={6} />
      {/* Toldo listrado */}
      {Array.from({ length: 8 }).map((_, i) => (
        <path
          key={i}
          d={`M ${80 + i * 63} 188 L ${143 + i * 63} 188 L ${131 + i * 63} 262 L ${68 + i * 63} 262 Z`}
          fill={i % 2 === 0 ? c.gold : c.costDim}
        />
      ))}
      <rect x={60} y={176} width={546} height={18} rx={8} fill={c.goldBright} />
      {/* Vitrine */}
      <rect x={140} y={300} width={180} height={150} rx={8} fill={c.bg} stroke={c.goldDim} strokeWidth={5} />
      {/* Paes na vitrine */}
      {[0, 1, 2].map((i) => (
        <ellipse key={i} cx={176 + i * 54} cy={398} rx={23} ry={15} fill={c.goldDim} />
      ))}
      {/* Porta */}
      <rect x={366} y={300} width={140} height={328} rx={8} fill={c.bg} stroke={c.goldDim} strokeWidth={5} />
      <circle cx={386} cy={470} r={9} fill={c.gold} />
      {/* Placa de fechado, pendurada torta */}
      {/* Placa so sobre a porta. Antes ela cruzava a emenda entre vitrine e
          porta, o que fazia os dois elementos lerem como um borrao so. */}
      <g transform="rotate(-6 436 372)">
        <line x1={436} y1={312} x2={436} y2={344} stroke={c.textFaint} strokeWidth={4} />
        <rect x={360} y={344} width={152} height={58} rx={10} fill={c.cost} stroke={c.text} strokeWidth={4} />
        <text x={436} y={386} textAnchor="middle" fontFamily={fonts.display} fontSize={36} fontWeight={900} fill={c.text}>
          FECHADO
        </text>
      </g>
      {/* Chao: sem ele a fachada flutua no escuro. */}
      <line x1={40} y1={632} x2={620} y2={632} stroke={c.goldDim} strokeWidth={8} strokeLinecap="round" />
    </svg>
    <div
      style={{
        position: "absolute", left: 640, top: 0, width: 580, height: 708,
        display: "flex", flexDirection: "column", justifyContent: "center", gap: 10,
      }}
    >
      <div style={{ fontFamily: fonts.display, fontSize: 112, fontWeight: 900, color: c.text, lineHeight: 1 }}>
        A conta
      </div>
      <div style={{ fontFamily: fonts.display, fontSize: 112, fontWeight: 900, color: c.gold, lineHeight: 1 }}>
        chega aqui
      </div>
      <div style={{ fontFamily: fonts.display, fontSize: 44, fontWeight: 700, color: c.textMuted, marginTop: 16 }}>
        A escala 6x1 acaba em dezembro
      </div>
    </div>
  </AbsoluteFill>
);


// =================================================================== VIDEO 2
// O Estado e necessario? Hobbes contra Rothbard.
//
// As tres capas mostram os tres momentos mais fortes do video, e nenhuma
// repete palavra do titulo escolhido ("Quem protege voce do seu protetor?").
// Mesma regra do video 1: a capa acrescenta o que o titulo nao tem.

/** Bloco de texto da direita, padrao das capas 16:9.
 *
 *  O TAMANHO DA FONTE SAI DO TEXTO, NAO E DIGITADO. Com tamanho fixo, frase
 *  mais longa que o padrao quebrava em linha sozinha: "ELE NUNCA" virava
 *  "ELE" / "NUNCA", e a legenda deixava "mao" orfa na segunda linha. E o
 *  mesmo erro que o Rodape dos Reels teve em outubro e a cena `declara` do
 *  video longo 1 teve em novembro: componente dimensionado para o caso que o
 *  autor tinha na mao no dia.
 *
 *  A largura util e 572 px. Nesta fonte, display pesada, cada caractere ocupa
 *  perto de 0,56 do corpo nas chamadas e 0,46 na legenda. Dai as duas contas
 *  abaixo, com teto para nao estourar e piso para nao sumir. */
const LARG_TEXTO = 572;   // largura declarada do bloco
const LARG_UTIL = 580;    // ate onde o texto pode ir sem encostar na borda

// Razao medida no render, nao chutada, e ajustada duas vezes. 0,56 deixava
// chamada de 9 caracteres sair do quadro; 0,63 ainda deixava "ASSINOU NADA" e
// "TODOS ASSINAM" saírem, porque a largura por caractere depende das letras
// (A, S, N, O e D sao largas nesta fonte). 0,68 e o pior caso medido. Isso nao
// substitui a medicao: toda capa nova passa pelo recorte da borda direita.
// Teto baixado de 112 para 84 em 05/11: a 112 a chamada gritava demais para
// o feed do YouTube, onde a miniatura disputa com texto de interface.
const corpo = (...linhas: (string | undefined)[]) =>
  Math.max(52, Math.min(84, Math.floor(
    LARG_UTIL / (0.68 * Math.max(...linhas.filter(Boolean).map((s) => s!.length))))));

const legenda = (pe: string) =>
  Math.max(26, Math.min(40, Math.floor(LARG_UTIL / (0.47 * pe.length))));

const Texto: React.FC<{ l1: string; l2: string; l3?: string; pe?: string; f?: number }> = ({
  l1, l2, l3, pe, f,
}) => {
  const fc = f ?? corpo(l1, l2, l3);
  return (
    <div
      style={{
        position: "absolute", left: 648, top: 0, width: LARG_TEXTO, height: 708,
        display: "flex", flexDirection: "column", justifyContent: "center", gap: 2,
      }}
    >
      <div style={{ fontFamily: fonts.display, fontSize: fc, fontWeight: 900, color: c.text, lineHeight: 0.98, whiteSpace: "nowrap" }}>
        {l1}
      </div>
      <div style={{ fontFamily: fonts.display, fontSize: fc, fontWeight: 900, color: l3 ? c.text : c.gold, lineHeight: 0.98, whiteSpace: "nowrap" }}>
        {l2}
      </div>
      {l3 ? (
        <div style={{ fontFamily: fonts.display, fontSize: fc, fontWeight: 900, color: c.gold, lineHeight: 0.98, whiteSpace: "nowrap" }}>
          {l3}
        </div>
      ) : null}
      {pe ? (
        <div style={{ fontFamily: fonts.display, fontSize: legenda(pe), fontWeight: 700, color: c.textMuted, marginTop: 18, lineHeight: 1.15, whiteSpace: "nowrap" }}>
          {pe}
        </div>
      ) : null}
    </div>
  );
};

// ------------------------------------------------------------------ A
/** A grade do Ato 1.
 *
 *  ERRO DA v1, CORRIGIDO AQUI, E ERA DE CONTEUDO, NAO DE LAYOUT. A primeira
 *  versao pintava a linha de cima inteira de vermelho e a de baixo de ouro,
 *  com X e check. Isso afirma que "eu confio, ele confia" e ruim. E falso: a
 *  paz mutua e o melhor resultado conjunto do jogo. O argumento de Hobbes nao
 *  e que confiar e ruim; e que, DENTRO DE CADA COLUNA, atacar me sai melhor.
 *  E comparacao, nao julgamento. Entao o desenho agora compara: celulas
 *  neutras, e uma seta por coluna apontando para a linha que eu prefiro.
 *  As duas setas apontam para baixo, e e isso que a capa precisa dizer. */
const Dilema: React.FC = () => {
  const X0 = 300, Y0 = 212, L = 150, GX = 18, GY = 56;
  const cx = (ix: number) => X0 + ix * (L + GX) + L / 2;
  const cy = (iy: number) => Y0 + iy * (L + GY) + L / 2;
  const CEL: [number, number, string][] = [
    [0, 0, "PAZ"], [1, 0, "PERCO"],
    [0, 1, "EU GANHO"], [1, 1, "GUERRA"],
  ];
  return (
    <AbsoluteFill>
      <Fundo />
      <svg width={1280} height={720} viewBox="0 0 1280 720" style={{ position: "absolute" }}>
        {CEL.map(([ix, iy, rot]) => (
          <g key={`${ix}-${iy}`}>
            <rect
              x={X0 + ix * (L + GX)} y={Y0 + iy * (L + GY)} width={L} height={L} rx={14}
              fill={iy === 1 ? c.gold : c.bgRaise}
              stroke={iy === 1 ? c.goldBright : c.rule}
              strokeWidth={iy === 1 ? 7 : 5}
            />
            <text x={cx(ix)} y={cy(iy) + 11} textAnchor="middle" fontFamily={fonts.display}
                  fontSize={26} fontWeight={900} fill={iy === 1 ? c.bg : c.textMuted}>
              {rot}
            </text>
          </g>
        ))}
        {/* Uma seta por coluna: em cada uma, a de baixo me sai melhor. */}
        {[0, 1].map((ix) => (
          <path key={ix}
            d={`M ${cx(ix)} ${Y0 + L + 8} l 0 34 m -14 -14 l 14 14 l 14 -14`}
            fill="none" stroke={c.goldBright} strokeWidth={7} strokeLinecap="round" />
        ))}
        <text x={cx(0)} y={Y0 - 22} textAnchor="middle" fontFamily={fonts.display}
              fontSize={26} fontWeight={900} fill={c.textMuted}>ELE CONFIA</text>
        <text x={cx(1)} y={Y0 - 22} textAnchor="middle" fontFamily={fonts.display}
              fontSize={26} fontWeight={900} fill={c.textMuted}>ELE ATACA</text>
        <text x={X0 - 20} y={cy(0) + 9} textAnchor="end" fontFamily={fonts.display}
              fontSize={26} fontWeight={900} fill={c.textMuted}>EU CONFIO</text>
        <text x={X0 - 20} y={cy(1) + 9} textAnchor="end" fontFamily={fonts.display}
              fontSize={26} fontWeight={900} fill={c.goldBright}>EU ATACO</text>
      </svg>
      <Texto l1="ATACAR" l2="PRIMEIRO" pe="sempre me sai melhor. e não é maldade, é medo." />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ B
/** O Ato 2 numa imagem: o pacto e entre eles, e quem recebe a espada esta
 *  FORA do circulo.
 *
 *  DUAS VERSOES ANTERIORES FALHARAM, pelo mesmo motivo: eu empilhei o
 *  soberano em cima do anel, entao ele caia dentro do desenho do anel e a
 *  unica coisa que a capa precisa dizer ("ele esta fora") se perdia. E cinco
 *  espadas lado a lado, com as guardas na mesma altura, liam como um pente.
 *  Agora o soberano fica AO LADO do anel, maior, com UMA espada so. Em
 *  320x180 isso vira um aglomerado de pontos mais uma figura destacada, que
 *  e silhueta que sobrevive. */
const Espadas: React.FC<{ texto?: TextoCapa }> = ({ texto }) => {
  const ax = 210, ay = 452, R = 112;            // anel do pacto, a esquerda
  const sx = 470, sy = 362;                     // o soberano, ao lado e fora
  // A espada fica a direita dele, mas dentro de x=604: o bloco de texto
  // comeca em 648, e na v3 a lamina cruzava por cima de "A ESPADA".
  const ex = sx + 96;
  const gente = Array.from({ length: 8 }).map((_, i) => {
    const a = (i * 45 + 22.5) * (Math.PI / 180);
    return { x: ax + R * Math.cos(a), y: ay + R * Math.sin(a) };
  });
  return (
    <AbsoluteFill>
      <Fundo />
      <svg width={1280} height={720} viewBox="0 0 1280 720" style={{ position: "absolute" }}>
        <circle cx={ax} cy={ay} r={R} fill="none" stroke={c.rule} strokeWidth={9} strokeDasharray="22 15" />
        {gente.map((g, i) => (
          <g key={i}>
            <line x1={g.x} y1={g.y - 10} x2={sx - 54} y2={sy + 70} stroke={c.goldDim} strokeWidth={4} opacity={0.5} />
            <circle cx={g.x} cy={g.y - 19} r={17} fill={c.textMuted} />
            <rect x={g.x - 17} y={g.y + 1} width={34} height={38} rx={13} fill={c.textMuted} />
          </g>
        ))}
        {/* O soberano: mesma forma das outras figuras, em escala maior. */}
        <circle cx={sx} cy={sy} r={46} fill={c.gold} />
        <rect x={sx - 48} y={sy + 56} width={96} height={106} rx={30} fill={c.gold} />
        {/* Uma espada so, inteira e reconhecivel: lamina, guarda, punho, pomo. */}
        <line x1={ex} y1={214} x2={ex} y2={396} stroke={c.goldBright} strokeWidth={15} strokeLinecap="round" />
        <line x1={ex - 38} y1={396} x2={ex + 38} y2={396} stroke={c.gold} strokeWidth={15} strokeLinecap="round" />
        <line x1={ex} y1={404} x2={ex} y2={452} stroke={c.goldDim} strokeWidth={13} strokeLinecap="round" />
        <circle cx={ex} cy={468} r={15} fill={c.gold} />
      </svg>
      <Texto l1={texto?.l1 ?? "VOCÊ DEU"} l2={texto?.l2 ?? "A ESPADA"}
             l3={texto ? texto.l3 : "AO INIMIGO"}
             pe={texto ? texto.pe : undefined} f={texto?.f} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ C
/** O Ato 5: as agencias de protecao convergem sozinhas para uma so, que e um
 *  Estado. Na v1 a fileira do meio encostava no bloco de texto e o titulo
 *  quebrava em tres linhas por cima dela. Fileiras mais estreitas, titulo
 *  menor, e o texto do ESTADO alinhado no centro do circulo. */
const Convergencia: React.FC = () => {
  const EIXO = 332, LARG = 388;
  const fileira = (y: number, n: number, r: number) => {
    const passo = n > 1 ? LARG / (n - 1) : 0;
    const x0 = EIXO - LARG / 2;
    return Array.from({ length: n }).map((_, i) => (
      <circle key={`${y}-${i}`} cx={n === 1 ? EIXO : x0 + i * passo} cy={y} r={r}
        fill={n === 1 ? c.gold : c.bgRaise}
        stroke={n === 1 ? c.goldBright : c.goldDim}
        strokeWidth={n === 1 ? 9 : 5} />
    ));
  };
  return (
    <AbsoluteFill>
      <Fundo />
      <svg width={1280} height={720} viewBox="0 0 1280 720" style={{ position: "absolute" }}>
        {fileira(176, 7, 30)}
        {fileira(362, 3, 52)}
        {fileira(556, 1, 86)}
        {[242, 434].map((y) => (
          <path key={y} d={`M ${EIXO} ${y} l 0 38 m -15 -15 l 15 15 l 15 -15`}
                fill="none" stroke={c.textFaint} strokeWidth={6} strokeLinecap="round" />
        ))}
        <text x={EIXO} y={556 + 15} textAnchor="middle" fontFamily={fonts.display}
              fontSize={42} fontWeight={900} fill={c.bg}>ESTADO</text>
      </svg>
      <Texto l1="SEM ESTADO?" l2="ELE VOLTA" pe="sozinho. ninguém precisa planejar." f={82} />
    </AbsoluteFill>
  );
};

/** Texto da capa. Opcional: cada capa traz o seu padrao, e esta prop existe
 *  para comparar variantes de copy em frame, sem mexer no desenho. */
export type TextoCapa = { l1: string; l2: string; l3?: string; pe?: string; f?: number };

export const Capa: React.FC<{ variante: VarianteCapa; texto?: TextoCapa }> = ({ variante, texto }) =>
  variante === "relogio" ? <Relogio />
  : variante === "semana" ? <Semana />
  : variante === "padaria" ? <Padaria />
  : variante === "dilema" ? <Dilema />
  : variante === "espadas" ? <Espadas texto={texto} />
  : <Convergencia />;
