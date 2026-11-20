import React from "react";
import { AbsoluteFill } from "remotion";
import { c, fonts } from "../brand";
import { COL, FOLGA, MARGEM, Q, QUADRADO, fonte, fonteCaixa } from "./marca45";
import { CAIXA, Fundo45, Hanko, Losango, RodapeSlide, SerieVertical, cor, moeda } from "./pecas";
import { marcaDoSlide } from "./marca-do-slide";
import type { Coluna, Item, Slide } from "./tipos";

/**
 * Os seis tipos de slide. Todos ESTATICOS: nenhum usa useCurrentFrame nem
 * spring, porque o render e de quadro unico e spring({frame: 0}) vale 0.
 *
 * LAYOUT ANCORADO, NAO CENTRALIZADO NO EIXO VERTICAL.
 *
 * O conteudo encosta no topo da caixa e o vazio fica embaixo, acima do rodape.
 * Duas razoes. A primeira e de identidade: a disciplina de composicao da marca
 * pede assimetria deliberada, com o vazio fazendo peso. A segunda e pratica, e
 * vem do primeiro video longo: quando o layout se equilibra sozinho, mudar o
 * tamanho de um texto desloca tudo o que esta por perto, e o erro aparece como
 * cartao encostado na borda. Ancorado, so o espaco vazio muda.
 */

/** Caixa de conteudo dos slides com rodape. */
const alturaCaixa = CAIXA.base - CAIXA.topo;

const Moldura: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      position: "absolute",
      left: MARGEM.lado + FOLGA,
      right: MARGEM.lado + FOLGA,
      top: CAIXA.topo,
      height: alturaCaixa,
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      // TODO slide centrado no eixo vertical, por decisao do dono do canal em
      // 05/11/2026. A versao anterior ancorava no topo e deixava o vazio
      // embaixo, buscando a assimetria da identidade; na folha de contato isso
      // leu como slide inacabado, nao como composicao.
      //
      // ATENCAO AO MEXER AQUI: margem automatica absorve o espaco livre ANTES
      // de o justify-content agir. Enquanto o selo hanko usava
      // `marginTop: "auto"`, os slides de virada e de fecho continuavam
      // ancorados no topo mesmo com center. Por isso o selo saiu do fluxo e
      // hoje e posicionado em absoluto.
      justifyContent: "center",
    }}
  >
    {children}
  </div>
);

/**
 * Selo hanko no canto da caixa de conteudo.
 *
 * POSICIONADO EM ABSOLUTO, E NAO EMPURRADO POR `marginTop: auto`. A margem
 * automatica absorve o espaco livre do flex antes de o justify-content agir,
 * entao enquanto o selo estava no fluxo ele anulava o centramento do slide
 * inteiro e prendia o conteudo no topo. Fora do fluxo, o selo fica no canto e
 * o texto centra sozinho.
 */
const Selo: React.FC = () => (
  <div style={{ position: "absolute", right: 0, bottom: 0 }}>
    <Hanko />
  </div>
);

/** Titulo padrao dos slides de conteudo. */
const Titulo: React.FC<{ texto: string; cor?: string }> = ({ texto, cor: k }) => (
  <span
    style={{
      fontFamily: fonts.display,
      fontSize: fonteCaixa(texto, { max: 68, min: 42, altura: 230, razao: 0.5, lh: 1.14 }),
      fontWeight: 900,
      letterSpacing: -1.5,
      lineHeight: 1.14,
      color: k ?? c.text,
      textWrap: "balance",
    }}
  >
    {moeda(texto)}
  </span>
);

// ------------------------------------------------------------------ 1. capa
/**
 * Slide 1. E a capa, e por isso e o unico que obedece ao recorte da grade do
 * perfil: todo texto fica entre QUADRADO.topo e QUADRADO.base. Ver marca45.ts.
 *
 * Nao leva pontos de progresso: no primeiro slide nao ha progresso para marcar,
 * e eles cairiam abaixo do recorte de qualquer jeito. O que fica e a coluna
 * vertical da serie e o losango.
 */
const Capa: React.FC<{ slide: Extract<Slide, { tipo: "capa" }>; serie: string }> = ({
  slide,
  serie,
}) => {
  const ESQ = MARGEM.lado + 72;             // depois da coluna vertical
  const largura = Q.w - ESQ - MARGEM.lado - FOLGA;
  const maior = slide.linhas.reduce((a, l) => Math.max(a, l.texto.length), 1);
  const corpo = fonte("x".repeat(maior), { max: 152, min: 60, largura, razao: 0.5 });

  return (
    <AbsoluteFill>
      <Fundo45 />
      <SerieVertical serie={serie} topo={QUADRADO.topo + 40} />
      <div
        style={{
          position: "absolute",
          left: ESQ,
          width: largura,
          top: QUADRADO.topo,
          height: QUADRADO.base - QUADRADO.topo,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          gap: 2,
        }}
      >
        {marcaDoSlide(slide) ? (
          <div style={{ marginBottom: 36 }}>
            <Losango marca={marcaDoSlide(slide)!} lado={34} />
          </div>
        ) : null}
        {slide.linhas.map((l, i) => (
          <span
            key={i}
            style={{
              fontFamily: fonts.display,
              fontSize: corpo,
              fontWeight: 900,
              letterSpacing: -3,
              lineHeight: 1.04,
              color: cor(l.cor),
              textWrap: "balance",
            }}
          >
            {moeda(l.texto)}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------- 2. conceito
/** Uma ideia em prosa curta, onde o conceito nao vira grafico. */
const Conceito: React.FC<{ slide: Extract<Slide, { tipo: "conceito" }> }> = ({ slide }) => {
  const sobra = alturaCaixa - 230 - (slide.nota ? 120 : 0) - 60;
  return (
    <Moldura>
      <Titulo texto={slide.titulo} cor={c.goldBright} />
      <span
        style={{
          marginTop: 44,
          fontFamily: fonts.body,
          fontSize: fonteCaixa(slide.corpo, {
            max: 54, min: 34, altura: sobra, razao: 0.49, lh: 1.34,
          }),
          fontWeight: 500,
          lineHeight: 1.34,
          color: c.text,
        }}
      >
        {moeda(slide.corpo)}
      </span>
      {slide.nota ? (
        <span
          style={{
            marginTop: 36,
            borderLeft: `4px solid ${c.rule}`,
            paddingLeft: 22,
            fontFamily: fonts.body,
            fontSize: 32,
            fontWeight: 500,
            lineHeight: 1.3,
            color: c.textMuted,
          }}
        >
          {moeda(slide.nota)}
        </span>
      ) : null}
    </Moldura>
  );
};

// ----------------------------------------------------------------- 3. conta
/** Linha de valor: rotulo a esquerda, valor a direita, regua pontilhada entre. */
const LinhaItem: React.FC<{ item: Item; forte?: boolean }> = ({ item, forte }) => (
  <div
    style={{
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      gap: 24,
      alignSelf: "stretch",
      borderBottom: forte ? "none" : `2px solid ${c.rule}`,
      paddingBottom: forte ? 0 : 18,
    }}
  >
    <span
      style={{
        fontFamily: fonts.body,
        fontSize: forte ? 40 : 38,
        fontWeight: forte ? 800 : 500,
        lineHeight: 1.2,
        color: forte ? c.text : c.textMuted,
      }}
    >
      {moeda(item.rotulo)}
    </span>
    <span
      style={{
        fontFamily: fonts.display,
        fontSize: forte ? 72 : 58,
        fontWeight: 900,
        letterSpacing: -2,
        lineHeight: 1,
        color: cor(item.cor ?? (forte ? "ouro" : "normal")),
        whiteSpace: "nowrap",
      }}
    >
      {moeda(item.valor)}
    </span>
  </div>
);

/** Decomposicao numerica: de onde sai um total. */
const Conta: React.FC<{ slide: Extract<Slide, { tipo: "conta" }> }> = ({ slide }) => (
  <Moldura>
    <Titulo texto={slide.titulo} />
    <div
      style={{
        marginTop: 52,
        alignSelf: "stretch",
        display: "flex",
        flexDirection: "column",
        gap: 22,
      }}
    >
      {slide.itens.map((it, i) => (
        <LinhaItem key={i} item={it} />
      ))}
      <div
        style={{
          marginTop: 18,
          alignSelf: "stretch",
          borderTop: `4px solid ${c.gold}`,
          paddingTop: 26,
        }}
      >
        <LinhaItem item={slide.total} forte />
      </div>
    </div>
  </Moldura>
);

// ------------------------------------------------------------ 4. comparacao
const Col: React.FC<{ coluna: Coluna; destacada?: boolean }> = ({ coluna, destacada }) => (
  <div
    style={{
      flex: 1,
      minWidth: 0,
      display: "flex",
      flexDirection: "column",
      gap: 20,
      padding: "26px 24px",
      borderRadius: 14,
      backgroundColor: destacada ? c.bgRaise : "transparent",
      border: `2px solid ${destacada ? c.goldDim : c.rule}`,
    }}
  >
    <span
      style={{
        fontFamily: fonts.display,
        fontSize: fonte(coluna.nome, { max: 44, min: 28, largura: 380, razao: 0.52 }),
        fontWeight: 900,
        letterSpacing: -1,
        lineHeight: 1.1,
        color: destacada ? c.goldBright : c.text,
      }}
    >
      {coluna.nome}
    </span>
    <div style={{ height: 2, backgroundColor: c.rule, alignSelf: "stretch" }} />
    {coluna.itens.map((it, i) => (
      <div key={i} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span
          style={{
            fontFamily: fonts.display,
            fontSize: 48,
            fontWeight: 900,
            letterSpacing: -2,
            lineHeight: 1.05,
            color: cor(it.cor),
          }}
        >
          {moeda(it.valor)}
        </span>
        <span
          style={{
            fontFamily: fonts.body,
            fontSize: 28,
            fontWeight: 500,
            lineHeight: 1.22,
            color: c.textMuted,
          }}
        >
          {moeda(it.rotulo)}
        </span>
      </div>
    ))}
    {coluna.destaque ? (
      <span
        style={{
          marginTop: "auto",
          paddingTop: 16,
          borderTop: `2px solid ${c.rule}`,
          fontFamily: fonts.body,
          fontSize: 30,
          fontWeight: 700,
          lineHeight: 1.24,
          color: destacada ? c.goldBright : c.textMuted,
        }}
      >
        {moeda(coluna.destaque)}
      </span>
    ) : null}
  </div>
);

/**
 * Duas colunas encaradas. A SEGUNDA e a destacada, por convencao: o carrossel
 * le da esquerda para a direita, e o lado direito e onde o argumento chega.
 */
const Comparacao: React.FC<{ slide: Extract<Slide, { tipo: "comparacao" }> }> = ({ slide }) => (
  <Moldura>
    <Titulo texto={slide.titulo} />
    <div
      style={{
        marginTop: 44,
        alignSelf: "stretch",
        display: "flex",
        gap: 22,
        // stretch iguala a altura das duas colunas, para as linhas de fecho
        // ficarem no mesmo nivel. O que saiu daqui foi `flex: 1`: ele esticava
        // o par ate a base da caixa e abria um buraco de 300 px entre os
        // numeros e o fecho. O vazio do slide fica EMBAIXO do par, como nos
        // outros slides, e nao dentro dele.
        alignItems: "stretch",
      }}
    >
      <Col coluna={slide.colunas[0]} />
      <Col coluna={slide.colunas[1]} destacada />
    </div>
  </Moldura>
);

// ---------------------------------------------------------------- 5. virada
/** A conclusao contraintuitiva. Leva o selo hanko e o numero grande. */
const Virada: React.FC<{ slide: Extract<Slide, { tipo: "virada" }> }> = ({ slide }) => {
  const juntas = slide.linhas.join(" ");
  const corpoLinhas = fonteCaixa(juntas, {
    max: 46, min: 30,
    altura: alturaCaixa - 230 - (slide.numero ? 300 : 0) - 120,
    razao: 0.49, lh: 1.3,
  });
  return (
    <Moldura>
      <Titulo texto={slide.titulo} />
      {slide.numero ? (
        <span
          style={{
            marginTop: 24,
            fontFamily: fonts.display,
            fontSize: fonte(slide.numero, { max: 240, min: 120, largura: COL, razao: 0.62 }),
            fontWeight: 900,
            letterSpacing: -10,
            lineHeight: 1,
            color: c.goldBright,
            whiteSpace: "nowrap",
          }}
        >
          {moeda(slide.numero)}
        </span>
      ) : null}
      <div
        style={{
          marginTop: 36,
          display: "flex",
          flexDirection: "column",
          gap: 18,
          alignSelf: "stretch",
        }}
      >
        {slide.linhas.map((l, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 18 }}>
            <div style={{ paddingTop: corpoLinhas * 0.32, flexShrink: 0 }}>
              {/* Marcador de lista, nao a marca de fato ou hipotese: essa
                  fica no rodape, uma por slide. Por isso e sempre cheio e nao
                  consulta marcaDoSlide(). */}
              <Losango marca="fato" lado={18} />
            </div>
            <span
              style={{
                fontFamily: fonts.body,
                fontSize: corpoLinhas,
                fontWeight: 500,
                lineHeight: 1.3,
                color: c.text,
              }}
            >
              {moeda(l)}
            </span>
          </div>
        ))}
      </div>
      <Selo />
    </Moldura>
  );
};

// ------------------------------------------------------------------- 6. cta
/** Fecho: a pergunta fica, a conclusao e de quem le. */
const Cta: React.FC<{ slide: Extract<Slide, { tipo: "cta" }> }> = ({ slide }) => (
  <Moldura>
    <span
      style={{
        fontFamily: fonts.display,
        fontSize: fonteCaixa(slide.pergunta, {
          max: 86, min: 48, altura: 420, razao: 0.5, lh: 1.08,
        }),
        fontWeight: 900,
        letterSpacing: -2.5,
        lineHeight: 1.08,
        color: c.text,
        textWrap: "balance",
      }}
    >
      {moeda(slide.pergunta)}
    </span>
    <div
      style={{
        marginTop: 52,
        display: "flex",
        alignItems: "center",
        gap: 18,
      }}
    >
      <div style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: c.goldBright }} />
      <span
        style={{
          fontFamily: fonts.display,
          fontSize: fonte(slide.acao, { max: 46, min: 30, largura: COL - 50, razao: 0.5 }),
          fontWeight: 800,
          letterSpacing: -0.5,
          lineHeight: 1.2,
          color: c.goldBright,
        }}
      >
        {moeda(slide.acao)}
      </span>
    </div>
    <Selo />
  </Moldura>
);

// --------------------------------------------------------------- despachante
export const DesenhaSlide: React.FC<{
  slide: Slide;
  serie: string;
  total: number;
  atual: number;
}> = ({ slide, serie, total, atual }) => {
  if (slide.tipo === "capa") {
    return <Capa slide={slide} serie={serie} />;
  }
  return (
    <AbsoluteFill>
      <Fundo45 />
      {slide.tipo === "conceito" ? <Conceito slide={slide} />
        : slide.tipo === "conta" ? <Conta slide={slide} />
        : slide.tipo === "comparacao" ? <Comparacao slide={slide} />
        : slide.tipo === "virada" ? <Virada slide={slide} />
        : <Cta slide={slide} />}
      <RodapeSlide serie={serie} total={total} atual={atual} marca={marcaDoSlide(slide)} />
    </AbsoluteFill>
  );
};
