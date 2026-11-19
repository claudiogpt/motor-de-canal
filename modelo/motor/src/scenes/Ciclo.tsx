import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { c, t, fonts, safe, coluna } from "../brand";
import { useRitmo } from "../batida";
import type { BatidaMedida, SetaCiclo, Temporizado, Votante } from "../tipos";

/**
 * Cena de ciclo: tres opcoes, tres votacoes dois a dois, e a preferencia da
 * maioria andando em circulo.
 *
 * O ponto do paradoxo de Condorcet e que a maioria se contradiz, e isso so se
 * enxerga como ciclo. A versao anterior mostrava "3 / 3 / 1785" numa escada de
 * numeros, que nao carrega nada do argumento. Aqui cada seta entra na batida da
 * fala que a enuncia, e a seta fantasma existe para ser desmentida: ela desenha
 * a expectativa (se A ganha de B e B ganha de C, A ganha de C) e some no frame
 * em que a voz diz que esta errado.
 */

const LARGURA = 1080 - coluna.left - coluna.right; // 788
// Altura util entre safe.top e safe.bottom: 1920 - 150 - 440 = 1330. Com a
// pilula de legenda fora da tela, o grafico ocupa o que sobrou, em vez de
// deixar um terco do quadro vazio embaixo.
//
// Mas nao ate o limite: a 1010 a linha de baixo do triangulo encostava em
// y=1280, onde comeca o terco inferior. Ali a direita e dos icones do
// Instagram e o limite cai de x=934 para x=860, e o no da direita estourava
// 73px. A 930 a linha de baixo termina acima de 1280 e volta para a regua
// larga. Medido no frame, nao estimado.
const ALTURA = 930;

/** Centro de cada no, no sentido do relogio a partir do topo. */
const CENTROS = [
  { x: LARGURA / 2, y: 112 },
  { x: LARGURA - 150, y: ALTURA - 132 },
  { x: 150, y: ALTURA - 132 },
];

const NO_RX = 148;
const NO_RY = 62;

/** Encosta a ponta da seta na borda da caixa do no, nao no centro dele. */
function aparar(
  de: { x: number; y: number },
  para: { x: number; y: number },
  folga = 18,
) {
  const dx = para.x - de.x;
  const dy = para.y - de.y;
  const comp = Math.hypot(dx, dy) || 1;
  const ux = dx / comp;
  const uy = dy / comp;
  // Raio da elipse que envolve a caixa do no, na direcao da seta.
  const raio = (r: number, rx: number, ry: number) =>
    (rx * ry) / Math.hypot(ry * Math.cos(r), rx * Math.sin(r));
  const ang = Math.atan2(dy, dx);
  const rDe = raio(ang, NO_RX, NO_RY) + folga;
  const rPara = raio(ang, NO_RX, NO_RY) + folga;
  return {
    x1: de.x + ux * rDe,
    y1: de.y + uy * rDe,
    x2: para.x - ux * rPara,
    y2: para.y - uy * rPara,
  };
}

/**
 * Caixa do rotulo da seta. Ate 5 caracteres fica nos 140 px de sempre ("2 a 1"
 * do Condorcet nao muda); a partir de 6 ("penal" tem 5) cresce com o texto, a
 * ~21 px por caractere na fonte de 40.
 */
function larguraRotulo(rotulo: string) {
  if (rotulo.length <= 2) return 76;
  return Math.max(140, rotulo.length * 21 + 30);
}

function pontaDaSeta(x1: number, y1: number, x2: number, y2: number, tam = 26) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const asa = 0.42;
  const p = (d: number) => `${x2 - tam * Math.cos(ang + d)},${y2 - tam * Math.sin(ang + d)}`;
  return `${x2},${y2} ${p(asa)} ${p(-asa)}`;
}

const Seta: React.FC<{
  seta: SetaCiclo;
  entrada: number;
}> = ({ seta, entrada }) => {
  const de = CENTROS[seta.de];
  const para = CENTROS[seta.para];
  const { x1, y1, x2, y2 } = aparar(de, para);

  const cor = seta.custo ? c.cost : seta.fantasma ? c.textMuted : c.goldBright;
  const largura = seta.fantasma ? 6 : 11;

  // A seta se desenha da origem ao destino, no tempo da fala.
  const fx = interpolate(entrada, [0, 1], [x1, x2]);
  const fy = interpolate(entrada, [0, 1], [y1, y2]);
  const pronta = entrada > 0.92;

  const meioX = (x1 + x2) / 2;
  const meioY = (y1 + y2) / 2;

  return (
    <g opacity={seta.fantasma ? 0.75 : 1}>
      <line
        x1={x1}
        y1={y1}
        x2={fx}
        y2={fy}
        stroke={cor}
        strokeWidth={largura}
        strokeLinecap="round"
        strokeDasharray={seta.fantasma ? "22 20" : undefined}
      />
      {pronta && <polygon points={pontaDaSeta(x1, y1, x2, y2)} fill={cor} />}
      {pronta && seta.rotulo && (
        <g>
          <rect
            x={meioX - larguraRotulo(seta.rotulo) / 2}
            y={meioY - 34}
            width={larguraRotulo(seta.rotulo)}
            height={68}
            rx={16}
            fill={c.bg}
            stroke={cor}
            strokeWidth={3}
          />
          <text
            x={meioX}
            y={meioY + 13}
            textAnchor="middle"
            fontFamily={fonts.display}
            fontSize={seta.rotulo.length <= 2 ? 46 : 40}
            fontWeight={800}
            fill={cor}
          >
            {seta.rotulo}
          </text>
        </g>
      )}
    </g>
  );
};

export const Ciclo: React.FC<{
  nos: string[];
  setas: SetaCiclo[];
  perfil?: Votante[];
  selo?: Temporizado & { texto: string };
  batidas: BatidaMedida[];
}> = ({ nos, setas, perfil, selo, batidas }) => {
  const r = useRitmo(batidas);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        paddingTop: safe.top,
        paddingBottom: safe.bottom,
        paddingLeft: coluna.left,
        paddingRight: coluna.right,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 26,
          width: LARGURA,
        }}
      >
        {/* Uma linha por bancada, nao uma coluna. Em coluna, nome longo
            ("Bancada da Seguranca") e opcao que quebra em duas linhas
            ("Menos imposto") faziam a faixa crescer e empurravam o triangulo
            para baixo de y=1280, onde a direita e dos icones do Instagram.
            Medido: 73px de estouro. Em linha a faixa fica com altura fixa. */}
        {perfil && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              width: "100%",
            }}
          >
            {perfil.map((v) => (
              <div
                key={v.nome}
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 14,
                  border: `2px solid ${c.rule}`,
                  borderRadius: 12,
                  padding: "8px 16px",
                }}
              >
                <span
                  style={{
                    fontFamily: fonts.display,
                    fontSize: 26,
                    fontWeight: 800,
                    color: c.gold,
                    whiteSpace: "nowrap",
                  }}
                >
                  {v.nome}
                </span>
                <span
                  style={{
                    fontFamily: fonts.display,
                    fontSize: 25,
                    color: c.textMuted,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                  }}
                >
                  {v.ordem.map((o, i) => (
                    <span key={o} style={{ color: i === 0 ? c.text : c.textMuted }}>
                      {i > 0 ? "  ›  " : ""}
                      {o}
                    </span>
                  ))}
                </span>
              </div>
            ))}
          </div>
        )}

        <svg width={LARGURA} height={ALTURA} viewBox={`0 0 ${LARGURA} ${ALTURA}`}>
          {setas.map((s, i) =>
            r.entrou(s) ? <Seta key={i} seta={s} entrada={r.entrada(s, 11)} /> : null,
          )}

          {nos.map((n, i) => (
            <g key={n}>
              <rect
                x={CENTROS[i].x - NO_RX}
                y={CENTROS[i].y - NO_RY}
                width={NO_RX * 2}
                height={NO_RY * 2}
                rx={20}
                fill={c.bg}
                stroke={c.gold}
                strokeWidth={4}
              />
              {(() => {
                // A caixa tem 296px de largura util. Rotulo comprido quebra em
                // duas linhas em vez de encolher a fonte ate ficar ilegivel no
                // celular ou vazar da caixa.
                const linhas =
                  n.length > 10 && n.includes(" ")
                    ? [n.slice(0, n.lastIndexOf(" ")), n.slice(n.lastIndexOf(" ") + 1)]
                    : [n];
                const tam = linhas.length > 1 ? 40 : n.length > 9 ? 44 : 52;
                const alturaLinha = tam * 1.02;
                const base =
                  CENTROS[i].y + tam * 0.35 - ((linhas.length - 1) * alturaLinha) / 2;
                return linhas.map((linha, j) => (
                  <text
                    key={j}
                    x={CENTROS[i].x}
                    y={base + j * alturaLinha}
                    textAnchor="middle"
                    fontFamily={fonts.display}
                    fontSize={tam}
                    fontWeight={800}
                    fill={c.text}
                  >
                    {linha}
                  </text>
                ));
              })()}
            </g>
          ))}
        </svg>

        {/* Sempre montado, so invisivel antes da sua batida: a coluna e
            centrada, entao montar o selo no meio do bloco empurraria o
            grafico inteiro para cima no frame em que ele aparece. */}
        {selo && (
          <span
            style={{
              fontFamily: fonts.display,
              fontSize: 42,
              fontWeight: 700,
              color: c.gold,
              letterSpacing: 1,
              opacity: r.entrou(selo) ? r.entrada(selo) : 0,
            }}
          >
            {selo.texto}
          </span>
        )}
      </div>
    </AbsoluteFill>
  );
};
