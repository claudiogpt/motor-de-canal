/**
 * Cenas visuais do video longo.
 *
 * Elas existem porque as cenas antigas (`cartoes`, `declara`, `colunas`) sao
 * todas a mesma coisa: texto dentro de retangulo. Num video de 13 minutos isso
 * e parede, e foi o que o Claudio reprovou em 05/11/2026 ("menos texto mais
 * visual, video com texto nao rende no YouTube").
 *
 * A regra de ouro aqui: no maximo UMA frase curta na tela por cena. Quem
 * carrega o conteudo e o desenho mais a voz. O texto completo continua
 * existindo, so que na narracao, que ja esta gravada e nao muda.
 */

import React from "react";
import { AbsoluteFill } from "remotion";
import { c, fonts } from "../brand";
import { useRitmo } from "../batida";
import { ALT, LARG, Q, T, seguro } from "./marca16x9";
import { Anel, Balanca, Convergencia, Espada, ligacoes, Pessoa, Teia, Waffle } from "./figuras";
import { Coruja, type Humor } from "./Mascote";
import { Contador, suave, Traco, useProgresso } from "./movimento";
import type { BatidaMedida, Cor, Temporizado } from "./tipos";

const cor = (k?: Cor) =>
  k === "ouro" ? c.gold : k === "custo" ? c.cost : k === "fraco" ? c.textMuted : k === "ok" ? c.ok : c.text;

/** Area de desenho: a area segura inteira, em coordenadas de SVG. */
export const Tela: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill>
    <svg
      width={Q.w}
      height={Q.h}
      viewBox={`0 0 ${Q.w} ${Q.h}`}
      style={{ position: "absolute", inset: 0 }}
    >
      {children}
    </svg>
  </AbsoluteFill>
);

/** Centro util do quadro. O desenho se organiza em volta disto. */
export const CX = Q.w / 2;
export const CY = seguro.top + ALT / 2;

/**
 * Texto curto dentro do SVG.
 *
 * Em SVG, e nao em div, para o texto andar junto com o desenho quando a figura
 * se move. Quebra de linha e manual, por `\n`: aqui o texto e sempre curto, e
 * quebra automatica foi justamente a causa do estouro do gancho.
 */
export const Txt: React.FC<{
  x: number;
  y: number;
  children: string;
  tam?: number;
  cor?: string;
  peso?: number;
  anc?: "middle" | "start" | "end";
  op?: number;
}> = ({ x, y, children, tam = T.corpo, cor: k = c.text, peso = 800, anc = "middle", op = 1 }) => (
  <>
    {children.split("\n").map((linha, i) => (
      <text
        key={i}
        x={x}
        y={y + i * tam * 1.16}
        textAnchor={anc}
        fontFamily={fonts.display}
        fontSize={tam}
        fontWeight={peso}
        fill={k}
        opacity={op}
      >
        {linha}
      </text>
    ))}
  </>
);

/** Selo de autor e obra, no alto. So entra quando a voz cita o autor. */
export const Selo: React.FC<{ texto: string; p: number }> = ({ texto, p }) => (
  <g opacity={suave(p)} transform={`translate(0 ${(1 - suave(p)) * -16})`}>
    <Txt x={CX} y={seguro.top + 60} tam={T.rotulo} cor={c.gold} peso={800}>
      {texto}
    </Txt>
  </g>
);

// ------------------------------------------------------------------- frase
/**
 * Uma frase, sozinha, grande, com um peso visual simples atras.
 *
 * Substitui a `declara` nos casos em que ela so tinha uma ou duas linhas. A
 * frase cresce de leve ao longo da fala, entao a tela nunca fica parada.
 */
export const Frase16: React.FC<{
  selo?: string;
  linhas: (Temporizado & { texto: string; cor?: Cor })[];
  batidas: BatidaMedida[];
}> = ({ selo, linhas, batidas }) => {
  const r = useRitmo(batidas);
  const prog = useProgresso(batidas);
  const pSelo = prog({ naBatida: 0 }, { parte: 0.25 });
  const n = linhas.length;
  const tam = n >= 3 ? 56 : n === 2 ? 64 : 76;
  const alturaBloco = n * tam * 1.3;
  return (
    <Tela>
      {selo ? <Selo texto={selo} p={pSelo} /> : null}
      {linhas.map((l, i) => {
        const p = prog(l, { parte: 0.3 });
        const e = r.entrou(l) ? suave(r.entrada(l, 12)) : 0;
        const y = CY - alturaBloco / 2 + tam * 0.9 + i * tam * 1.3;
        return (
          <g key={i} opacity={e} transform={`translate(0 ${(1 - e) * 26})`}>
            <Txt x={CX} y={y} tam={tam * (0.985 + p * 0.015)} cor={cor(l.cor)} peso={800}>
              {l.texto}
            </Txt>
          </g>
        );
      })}
    </Tela>
  );
};

// -------------------------------------------------------------------- teia
/**
 * Pessoas num circulo, com todas as ligacoes entre elas se desenhando.
 *
 * O numero de ligacoes e SEMPRE calculado de n, nunca digitado: e por isso que
 * o desenho nao pode discordar da conta. Com 2 pessoas da 1, com 10 da 45, e e
 * esse o argumento do Ato 1.
 */
export const Teia16: React.FC<{
  titulo?: string;
  etapas: (Temporizado & { n: number; rotulo?: string })[];
  batidas: BatidaMedida[];
}> = ({ titulo, etapas, batidas }) => {
  const r = useRitmo(batidas);
  // a etapa valendo e a ultima que ja entrou
  const prog = useProgresso(batidas);
  let atual = etapas[0];
  for (const e of etapas) if (r.entrou(e)) atual = e;
  const p = prog(atual, { parte: 0.7 });
  const total = ligacoes(atual.n);
  return (
    <Tela>
      {titulo ? (
        <Txt x={CX} y={seguro.top + 82} tam={T.titulo} cor={c.text}>
          {titulo}
        </Txt>
      ) : null}
      <Teia cx={CX} cy={CY + 10} r={atual.n > 4 ? 235 : 150} largo={1.55} n={atual.n} p={p} />
      <Txt x={CX} y={CY + 20} tam={T.numero} cor={c.gold} peso={900}>
        {""}
      </Txt>
      <g>
        <Txt x={CX} y={seguro.top + ALT - 24} tam={T.titulo} cor={c.gold} peso={900}>
          {`${Math.round(total * Math.max(0, Math.min(1, p)))} ${
            total === 1 ? "relação" : "relações"
          } para dar errado`}
        </Txt>
      </g>
    </Tela>
  );
};

// ----------------------------------------------------------------- figuras
/**
 * Fileira de pictogramas com um rotulo de uma ou duas palavras cada.
 *
 * E a substituta da cena `cartoes` na maior parte dos casos: mesma funcao de
 * comparar de dois a quatro itens, com desenho no lugar de retangulo e com
 * muito menos texto.
 */
export const Figuras16: React.FC<{
  titulo?: string;
  itens: (Temporizado & { rotulo: string; forma: string; cor?: Cor })[];
  batidas: BatidaMedida[];
}> = ({ titulo, itens, batidas }) => {
  const r = useRitmo(batidas);
  const prog = useProgresso(batidas);
  const n = itens.length;
  const passo = Math.min(430, LARG / n);
  const x0 = CX - ((n - 1) * passo) / 2;
  return (
    <Tela>
      {titulo ? (
        <Txt x={CX} y={seguro.top + 82} tam={T.titulo} cor={c.text}>
          {titulo}
        </Txt>
      ) : null}
      {itens.map((it, i) => {
        const e = r.entrou(it) ? suave(r.entrada(it, 12)) : 0;
        const p = prog(it, { parte: 0.5 });
        const x = x0 + i * passo;
        const k = cor(it.cor);
        return (
          <g key={i} opacity={0.3 + 0.7 * e}>
            <Forma nome={it.forma} x={x} y={CY} cor={k} p={e} pulso={p} />
            <Txt x={x} y={CY + 190} tam={T.rotulo} cor={e > 0.5 ? k : c.textFaint} peso={800}>
              {it.rotulo}
            </Txt>
          </g>
        );
      })}
    </Tela>
  );
};

/** As formas que a `Figuras16` sabe desenhar. Poucas, e reutilizaveis. */
const Forma: React.FC<{
  nome: string;
  x: number;
  y: number;
  cor: string;
  p: number;
  pulso: number;
}> = ({ nome, x, y, cor: k, p, pulso }) => {
  const s = 0.9 + 0.1 * p;
  const g = (ch: React.ReactNode) => (
    <g transform={`translate(${x} ${y}) scale(${s}) translate(${-x} ${-y})`}>{ch}</g>
  );
  switch (nome) {
    case "pessoa":
      return g(<Pessoa x={x} y={y} alt={150} cor={k} p={p} />);
    case "duas-pessoas":
      return g(
        <>
          <Pessoa x={x - 54} y={y} alt={128} cor={k} p={p} />
          <Pessoa x={x + 54} y={y} alt={128} cor={k} p={p} />
        </>,
      );
    case "espada":
      return g(<Espada x={x} y={y} alt={190} cor={k} p={p} />);
    case "moeda":
      return g(
        <>
          <circle cx={x} cy={y} r={62} fill="none" stroke={k} strokeWidth={8} />
          <text
            x={x}
            y={y + 24}
            textAnchor="middle"
            fontFamily={fonts.display}
            fontSize={68}
            fontWeight={900}
            fill={k}
          >
            $
          </text>
        </>,
      );
    case "escudo":
      return g(
        <path
          d={`M ${x} ${y - 72} l 62 26 v 46 q 0 56 -62 76 q -62 -20 -62 -76 v -46 Z`}
          fill="none"
          stroke={k}
          strokeWidth={8}
          strokeLinejoin="round"
        />,
      );
    case "coroa":
      return g(
        <path
          d={`M ${x - 66} ${y + 44} l 10 -96 l 34 40 l 22 -58 l 22 58 l 34 -40 l 10 96 Z`}
          fill="none"
          stroke={k}
          strokeWidth={8}
          strokeLinejoin="round"
        />,
      );
    case "porta":
      return g(
        <>
          <rect x={x - 52} y={y - 78} width={104} height={158} rx={8} fill="none" stroke={k} strokeWidth={8} />
          <circle cx={x + 28} cy={y + 6} r={9} fill={k} />
        </>,
      );
    case "seta-sai":
      return g(
        <>
          <rect x={x - 70} y={y - 70} width={100} height={140} rx={10} fill="none" stroke={k} strokeWidth={8} />
          <path d={`M ${x + 6} ${y} h 74 m -26 -26 l 26 26 l -26 26`} fill="none" stroke={k} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
        </>,
      );
    case "sem-saida":
      return g(
        <>
          <rect x={x - 70} y={y - 70} width={100} height={140} rx={10} fill="none" stroke={k} strokeWidth={8} />
          <path d={`M ${x + 20} ${y - 26} l 52 52 m 0 -52 l -52 52`} fill="none" stroke={c.cost} strokeWidth={9} strokeLinecap="round" />
        </>,
      );
    case "martelo":
      return g(
        <>
          <rect x={x - 58} y={y + 48} width={116} height={14} rx={7} fill={k} />
          <g transform={`rotate(${-18 + pulso * 18} ${x} ${y})`}>
            <rect x={x - 46} y={y - 62} width={92} height={34} rx={8} fill={k} />
            <rect x={x - 8} y={y - 30} width={16} height={72} rx={8} fill={k} />
          </g>
        </>,
      );
    case "estrada":
      return g(
        <>
          <path d={`M ${x - 62} ${y + 80} L ${x - 20} ${y - 80} h 40 L ${x + 62} ${y + 80} Z`} fill="none" stroke={k} strokeWidth={7} strokeLinejoin="round" />
          <path d={`M ${x} ${y - 58} v 28 m 0 26 v 28 m 0 26 v 28`} stroke={k} strokeWidth={7} strokeLinecap="round" />
        </>,
      );
    default:
      return g(<circle cx={x} cy={y} r={62} fill="none" stroke={k} strokeWidth={8} />);
  }
};

// -------------------------------------------------------------------- anel
/** O pacto: o anel se fecha entre as pessoas, e o soberano fica fora dele. */
export const Anel16: React.FC<{
  titulo?: string;
  soberano?: Temporizado & { rotulo?: string };
  corte?: Temporizado;
  batidas: BatidaMedida[];
}> = ({ titulo, soberano, corte, batidas }) => {
  const r = useRitmo(batidas);
  const prog = useProgresso(batidas);
  const pAnel = prog({ naBatida: 0 }, { parte: 0.8 });
  const pSob = soberano ? prog(soberano, { parte: 0.5 }) : 0;
  const entrouSob = soberano ? r.entrou(soberano) : false;
  const pCorte = corte ? prog(corte, { parte: 0.5 }) : 0;
  const ax = CX - 300;
  const ay = CY - 10;
  const sx = CX + 390;
  return (
    <Tela>
      {titulo ? (
        <Txt x={CX} y={seguro.top + 82} tam={T.titulo} cor={c.text}>
          {titulo}
        </Txt>
      ) : null}
      <Anel cx={ax} cy={ay} r={190} n={9} p={pAnel} pLigacao={pAnel} />
      {entrouSob ? (
        <g opacity={suave(pSob)}>
          <Pessoa x={sx} y={ay - 30} alt={168} cor={c.gold} p={pSob} />
          <Espada x={sx + 86} y={ay + 6} alt={150} cor={c.gold} p={pSob} />
          {soberano?.rotulo ? (
            <Txt x={sx + 40} y={ay + 168} tam={T.rotulo} cor={c.gold}>
              {soberano.rotulo}
            </Txt>
          ) : null}
        </g>
      ) : null}
      {corte && r.entrou(corte) ? (
        <g>
          <Traco
            d={`M ${ax + 210} ${ay - 60} L ${sx - 110} ${ay - 60}`}
            p={pCorte}
            comp={sx - ax - 320}
            cor={c.costDim}
            larg={6}
            tracejado
          />
          <g opacity={suave(pCorte * 2 - 1)}>
            <path
              d={`M ${(ax + sx) / 2 - 34} ${ay - 94} l 68 68 m 0 -68 l -68 68`}
              stroke={c.cost}
              strokeWidth={10}
              strokeLinecap="round"
            />
          </g>
        </g>
      ) : null}
    </Tela>
  );
};

// ------------------------------------------------------------------ waffle
/** Cem quadrados, k acesos. Proporcao que o espectador conta sem querer. */
export const Waffle16: React.FC<{
  titulo?: string;
  k: number;
  rotulo: string;
  rotuloResto?: string;
  nota?: Temporizado & { texto: string };
  batidas: BatidaMedida[];
}> = ({ titulo, k, rotulo, rotuloResto, nota, batidas }) => {
  const r = useRitmo(batidas);
  const p = useProgresso(batidas)({ naBatida: 0 }, { parte: 0.75 });
  const lado = 44;
  const gap = 10;
  const larg = 10 * lado + 9 * gap;
  const x = CX - larg / 2 - 150;
  const y = CY - larg / 2 + 10;
  return (
    <Tela>
      {titulo ? (
        <Txt x={CX} y={seguro.top + 82} tam={T.titulo} cor={c.text}>
          {titulo}
        </Txt>
      ) : null}
      <Waffle x={x} y={y} lado={lado} gap={gap} k={k} p={p} corAceso={c.gold}
              corApagado={c.costDim} />
      <g>
        <text
          x={x + larg + 70}
          y={y + 130}
          fontFamily={fonts.display}
          fontSize={T.numero}
          fontWeight={900}
          fill={c.gold}
        >
          <Contador ate={k} p={p} sufixo="%" />
        </text>
        <Txt x={x + larg + 70} y={y + 196} tam={T.rotulo} cor={c.textMuted} anc="start">
          {rotulo}
        </Txt>
        {rotuloResto ? (
          <Txt x={x + larg + 70} y={y + 300} tam={T.rotulo} cor={c.cost} anc="start">
            {rotuloResto}
          </Txt>
        ) : null}
      </g>
      {nota && r.entrou(nota) ? (
        <g opacity={suave(r.entrada(nota, 12))}>
          <Txt x={CX} y={seguro.top + ALT - 16} tam={T.nota} cor={c.textMuted} peso={600}>
            {nota.texto}
          </Txt>
        </g>
      ) : null}
    </Tela>
  );
};

// ----------------------------------------------------------------- balanca
/** Dois riscos pesados um contra o outro. A tese do video, em um desenho. */
export const Balanca16: React.FC<{
  titulo?: string;
  esquerda: string;
  direita: string;
  pende?: Temporizado & { lado: "esquerda" | "direita" };
  batidas: BatidaMedida[];
}> = ({ titulo, esquerda, direita, pende, batidas }) => {
  const r = useRitmo(batidas);
  const prog = useProgresso(batidas);
  const p = pende && r.entrou(pende) ? prog(pende, { parte: 0.6 }) : 0;
  const inclina = pende ? (pende.lado === "esquerda" ? -p : p) : 0;
  const meia = 280;
  return (
    <Tela>
      {titulo ? (
        <Txt x={CX} y={seguro.top + 82} tam={T.titulo} cor={c.text}>
          {titulo}
        </Txt>
      ) : null}
      <Balanca cx={CX} cy={CY - 110} larg={meia * 2} inclina={inclina} />
      <Txt x={CX - meia} y={CY + 240} tam={T.rotulo} cor={inclina < -0.3 ? c.gold : c.textMuted}>
        {esquerda}
      </Txt>
      <Txt x={CX + meia} y={CY + 240} tam={T.rotulo} cor={inclina > 0.3 ? c.gold : c.textMuted}>
        {direita}
      </Txt>
    </Tela>
  );
};

// ------------------------------------------------------------ convergencia
/** Agencias concorrentes virando uma so. O argumento de Nozick, acontecendo. */
export const Convergencia16: React.FC<{
  titulo?: string;
  etapas: (Temporizado & { rotulo: string })[];
  batidas: BatidaMedida[];
}> = ({ titulo, etapas, batidas }) => {
  const r = useRitmo(batidas);
  let atual = etapas[0];
  let i = 0;
  etapas.forEach((e, k) => {
    if (r.entrou(e)) {
      atual = e;
      i = k;
    }
  });
  const dentro = useProgresso(batidas)(atual, { parte: 0.8 });
  const p = etapas.length > 1 ? (i + dentro) / (etapas.length - 1) : dentro;
  return (
    <Tela>
      {titulo ? (
        <Txt x={CX} y={seguro.top + 82} tam={T.titulo} cor={c.text}>
          {titulo}
        </Txt>
      ) : null}
      <Convergencia cx={CX} cy={CY - 10} r={300} n={7} p={Math.min(1, p)} />
      <Txt x={CX} y={seguro.top + ALT - 20} tam={T.titulo} cor={c.gold} peso={900}>
        {atual.rotulo}
      </Txt>
    </Tela>
  );
};

// ------------------------------------------------------------------ numero
/** Um numero grande que sobe, com uma linha de contexto. Nada mais. */
export const Numero16: React.FC<{
  titulo?: string;
  valor: number;
  sufixo?: string;
  rotulo: string;
  antes?: Temporizado & { valor: number; rotulo: string };
  batidas: BatidaMedida[];
}> = ({ titulo, valor, sufixo = "", rotulo, antes, batidas }) => {
  const r = useRitmo(batidas);
  const prog = useProgresso(batidas);
  const p = prog({ naBatida: 0 }, { parte: 0.8 });
  const temAntes = antes ? r.entrou(antes) : false;
  const pA = antes && temAntes ? prog(antes, { parte: 0.6 }) : 0;
  return (
    <Tela>
      {titulo ? (
        <Txt x={CX} y={seguro.top + 82} tam={T.titulo} cor={c.text}>
          {titulo}
        </Txt>
      ) : null}
      <text
        x={CX}
        y={CY + 40}
        textAnchor="middle"
        fontFamily={fonts.display}
        fontSize={220}
        fontWeight={900}
        fill={c.gold}
      >
        <Contador ate={valor} p={p} sufixo={sufixo} separador />
      </text>
      <Txt x={CX} y={CY + 120} tam={T.rotulo} cor={c.textMuted}>
        {rotulo}
      </Txt>
      {temAntes && antes ? (
        <g opacity={suave(pA)}>
          <Txt x={CX} y={CY + 250} tam={T.corpo} cor={c.textFaint}>
            {`${antes.rotulo}  ${antes.valor.toLocaleString("pt-BR")}`}
          </Txt>
        </g>
      ) : null}
    </Tela>
  );
};

// --------------------------------------------------------------- professora
/**
 * A coruja dando aula: ela ao lado de um quadro, apontando o que escreveu.
 *
 * Pedido do Claudio em 05/11/2026, junto com o capelo. Serve para os momentos
 * de definicao, em que nao ha grafico a fazer e o que existe e um conceito a
 * enunciar. Antes esses blocos eram `frase`, que e texto sozinho no centro do
 * quadro: aqui o mesmo texto ganha quem o esta dizendo.
 *
 * O quadro e desenhado com a largura sobrando a esquerda dela, e as linhas
 * entram cada uma na sua batida, como em qualquer outra cena.
 */
export const Professora16: React.FC<{
  titulo?: string;
  quadro: (Temporizado & { texto: string; cor?: Cor })[];
  pose?: string;
  batidas: BatidaMedida[];
}> = ({ titulo, quadro, pose = "explica", batidas }) => {
  const r = useRitmo(batidas);
  const prog = useProgresso(batidas);
  const t0 = r.desde({ naBatida: 0 }) || 0;
  // Ela ocupa a direita; o quadro usa o resto da area util.
  const corX = Q.w - seguro.right - 210;
  const corY = seguro.top + ALT - 250;
  const corTam = 250;
  const qx = seguro.left + 44;
  const qw = corX - 330 - qx;
  const qy = seguro.top + 104;
  const qh = ALT - 230;
  const n = quadro.length;
  const tam = n >= 3 ? 46 : n === 2 ? 52 : 58;
  return (
    <Tela>
      {titulo ? (
        <Txt x={qx + qw / 2} y={seguro.top + 56} tam={T.rotulo} cor={c.gold}>
          {titulo}
        </Txt>
      ) : null}
      {/* o quadro */}
      <rect x={qx} y={qy} width={qw} height={qh} rx={18} fill="#14181A" stroke={c.goldDim} strokeWidth={6} />
      <rect x={qx + 14} y={qy + qh - 2} width={qw - 28} height={14} rx={7} fill={c.goldDim} opacity={0.5} />
      {quadro.map((l, i) => {
        const e = r.entrou(l) ? suave(r.entrada(l, 12)) : 0;
        const p = prog(l, { parte: 0.4 });
        const y = qy + qh / 2 - ((n - 1) * tam * 1.5) / 2 + i * tam * 1.5;
        return (
          <g key={i} opacity={e} transform={`translate(${(1 - e) * -20} 0)`}>
            {/* risco de giz que acompanha a fala */}
            <rect
              x={qx + 44}
              y={y + 14}
              width={(qw - 88) * Math.min(1, p)}
              height={4}
              rx={2}
              fill={c.goldDim}
              opacity={0.35}
            />
            <Txt x={qx + qw / 2} y={y} tam={tam} cor={cor(l.cor)} peso={800}>
              {l.texto}
            </Txt>
          </g>
        );
      })}
      <g transform={`translate(${corX} ${corY})`}>
        <Coruja humor={pose as Humor} t={t0 / 90} tam={corTam} aponta="esq" />
      </g>
    </Tela>
  );
};
