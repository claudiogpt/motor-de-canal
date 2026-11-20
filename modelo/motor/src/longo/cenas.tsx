import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { c, fonts } from "../brand";
import { useRitmo } from "../batida";
import { ALT, LARG, T, seguro } from "./marca16x9";
import type {
  CelulaL,
  BatidaMedida,
  CartaoL,
  ColunaL,
  Cor,
  DegrauL,
  EventoL,
  FatiaL,
  LinhaL,
  MedidaL,
  Temporizado,
} from "./tipos";

const cor = (k?: Cor) =>
  k === "ouro" ? c.gold : k === "custo" ? c.cost : k === "fraco" ? c.textMuted : k === "ok" ? c.ok : c.text;

/** Moldura comum: coluna de conteudo centrada dentro da area segura. */
const Palco: React.FC<{ children: React.ReactNode; gap?: number }> = ({ children, gap = 44 }) => (
  <AbsoluteFill
    style={{
      justifyContent: "center",
      alignItems: "center",
      paddingTop: seguro.top,
      paddingBottom: seguro.bottom,
      paddingLeft: seguro.left,
      paddingRight: seguro.right,
    }}
  >
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap,
        width: LARG,
      }}
    >
      {children}
    </div>
  </AbsoluteFill>
);

/**
 * Titulo do bloco. Sempre montado quando existe, mesmo invisivel: a coluna e
 * centrada, entao montar um elemento no meio do bloco empurraria o grafico
 * inteiro para cima no frame em que ele aparece. Mesmo erro ja corrigido na
 * cena de ciclo dos Reels.
 */
const Titulo: React.FC<{ texto?: string; op?: number }> = ({ texto, op = 1 }) =>
  texto ? (
    <div
      style={{
        fontFamily: fonts.display,
        fontSize: T.titulo,
        fontWeight: 800,
        color: c.text,
        textAlign: "center",
        lineHeight: 1.16,
        opacity: op,
        maxWidth: LARG - 160,
      }}
    >
      {texto}
    </div>
  ) : null;

const Nota: React.FC<{ nota?: Temporizado & { texto: string }; r: ReturnType<typeof useRitmo> }> = ({
  nota,
  r,
}) =>
  nota ? (
    <div
      style={{
        fontFamily: fonts.display,
        fontSize: T.rotulo,
        color: c.textMuted,
        textAlign: "center",
        border: `2px solid ${c.goldDim}`,
        borderRadius: 40,
        padding: "14px 36px",
        opacity: r.entrou(nota) ? r.entrada(nota) : 0,
      }}
    >
      {nota.texto}
    </div>
  ) : null;

/**
 * Opacidade da moldura e do conteudo de um elemento ainda nao anunciado.
 *
 * Por que a moldura fica visivel e apagada em vez de invisivel: os elementos
 * sempre ocupam espaco, para a fileira nao pular quando o proximo entra. Mas
 * com opacidade zero, um cartao sozinho ficava encostado na esquerda de um
 * quadro largo e vazio por 8 segundos, o que parece defeito. Com a moldura
 * apagada a composicao ja nasce equilibrada, o espectador ve que vem mais
 * coisa, e o texto so aparece quando a voz o enuncia.
 */
const VAZIO = 0.2;

/** Risca animada sobre um texto, para desmentir uma afirmacao na batida certa. */
const Risca: React.FC<{ larg: number }> = ({ larg }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      top: "52%",
      height: 7,
      width: `${larg * 100}%`,
      backgroundColor: c.cost,
      borderRadius: 4,
    }}
  />
);

// ------------------------------------------------------------------ gancho
/**
 * Maior corpo de uma pilha de textos centrados que ainda cabe na altura util.
 *
 * Por que contar caractere em vez de linha do array: a `declara` ganhou
 * orcamento de altura no video 1 contando `linhas.length`, e isso basta
 * enquanto cada item cabe numa linha so. No gancho nao bastou. Quatro linhas
 * declaradas viraram sete linhas desenhadas, porque o texto quebra sozinho, e
 * a pilha passou dos 864px uteis: 95 quadros estourando o topo e 36 a base,
 * medidos no video 2. Entao a conta precisa estimar a QUEBRA, nao so o numero
 * de itens.
 *
 * `0.52` e a largura media de um caractere em fracao do corpo, nesta fonte
 * display em peso alto. Medida no render: "O Estado tambem e feito de" ocupou
 * 1600px com 26 caracteres a 122px de corpo, o que da 0,504. O valor usado e
 * um pouco maior de proposito, para errar para o lado de encolher.
 */
const corpoQueCabe = (
  textos: string[],
  larg: number,
  alt: number,
  gap: number,
  opcoes: number[],
) => {
  for (const f of opcoes) {
    const porLinha = Math.max(1, larg / (0.52 * f));
    const linhas = textos.reduce((s, x) => s + Math.max(1, Math.ceil(x.length / porLinha)), 0);
    const altura = linhas * f * 1.08 + (textos.length - 1) * gap;
    if (altura <= alt) return f;
  }
  return opcoes[opcoes.length - 1];
};

export const Gancho16: React.FC<{ linhas: LinhaL[]; batidas: BatidaMedida[] }> = ({
  linhas,
  batidas,
}) => {
  const r = useRitmo(batidas);
  const GAP = 18;
  const corpo = corpoQueCabe(
    linhas.map((l) => l.texto),
    LARG,
    ALT,
    GAP,
    [T.heroi, 108, 96, 86, 78, 70, 62],
  );
  return (
    <Palco gap={GAP}>
      {linhas.map((l, i) => {
        const dentro = r.entrou(l);
        const e = dentro ? r.entrada(l, 10) : 0;
        const risca =
          l.riscaNa === undefined
            ? 0
            : Math.max(0, Math.min(1, (r.desde({ naBatida: l.riscaNa }) || 0) / 12));
        return (
          <div
            key={i}
            style={{
              position: "relative",
              fontFamily: fonts.display,
              fontSize: corpo,
              fontWeight: 900,
              color: cor(l.cor),
              textAlign: "center",
              lineHeight: 1.08,
              opacity: e,
              transform: `translateY(${(1 - e) * 26}px)`,
            }}
          >
            {l.texto}
            {risca > 0 && <Risca larg={risca} />}
          </div>
        );
      })}
    </Palco>
  );
};

// ------------------------------------------------------------------ escada
export const Escada16: React.FC<{
  titulo?: string;
  degraus: DegrauL[];
  nota?: Temporizado & { texto: string };
  batidas: BatidaMedida[];
}> = ({ titulo, degraus, nota, batidas }) => {
  const r = useRitmo(batidas);
  return (
    <Palco>
      <Titulo texto={titulo} />
      <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
        {degraus.map((d, i) => {
          const e = r.entrou(d) ? r.entrada(d, 10) : 0;
          return (
            <React.Fragment key={i}>
              {i > 0 && (
                <svg width={94} height={44} style={{ opacity: e }}>
                  <line x1={6} y1={22} x2={62} y2={22} stroke={c.goldDim} strokeWidth={8} strokeLinecap="round" />
                  <polygon points="88,22 58,6 58,38" fill={c.goldDim} />
                </svg>
              )}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 10,
                  border: `4px solid ${d.cor === "ouro" ? c.gold : c.rule}`,
                  borderRadius: 24,
                  backgroundColor: c.bgRaise,
                  padding: "28px 44px",
                  minWidth: 290,
                  opacity: e,
                  transform: `scale(${0.92 + e * 0.08})`,
                }}
              >
                <div
                  style={{
                    fontFamily: fonts.display,
                    fontSize: T.numero,
                    fontWeight: 900,
                    color: cor(d.cor),
                    lineHeight: 1,
                  }}
                >
                  {d.valor}
                </div>
                <div
                  style={{
                    fontFamily: fonts.display,
                    fontSize: T.rotulo,
                    color: c.textMuted,
                    textAlign: "center",
                  }}
                >
                  {d.quando}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
      <Nota nota={nota} r={r} />
    </Palco>
  );
};

// ----------------------------------------------------------------- cartoes
/**
 * Grade dois por dois: a matriz de decisao do Ato 1.
 *
 * O argumento de Hobbes nao e "confiar e ruim", e "dentro de cada coluna,
 * atacar me sai melhor". Entao a cena NAO pinta linha boa e linha ma: as
 * quatro celulas entram neutras, cada uma na batida em que a voz a enuncia, e
 * so no fim uma linha inteira recebe destaque, que e a comparacao.
 *
 * As celulas ocupam espaco desde o primeiro frame, apagadas, pela mesma razao
 * dos cartoes: grade que cresce enquanto enche faz o grafico pular.
 */
export const Grade16: React.FC<{
  titulo?: string;
  colunas: [string, string];
  linhas2: [string, string];
  celulas: CelulaL[];
  destaque?: Temporizado & { lin: number; texto?: string };
  batidas: BatidaMedida[];
}> = ({ titulo, colunas, linhas2, celulas, destaque, batidas }) => {
  const r = useRitmo(batidas);
  const LAB = 300, CEL = 440, GAP = 24, ALT_CEL = 212;
  const destacada = destaque && r.entrou(destaque) ? destaque.lin : -1;
  const eD = destaque && r.entrou(destaque) ? r.entrada(destaque, 12) : 0;
  return (
    <Palco>
      <Titulo texto={titulo} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {/* cabecalho das colunas */}
        <div style={{ display: "flex", gap: GAP, marginLeft: LAB, marginRight: LAB }}>
          {colunas.map((x, i) => (
            <div key={i} style={{ width: CEL, textAlign: "center", fontFamily: fonts.display,
                                  fontSize: T.rotulo, fontWeight: 800, color: c.textMuted }}>
              {x}
            </div>
          ))}
        </div>
        {[0, 1].map((lin) => (
          <div key={lin} style={{ display: "flex", gap: GAP, alignItems: "stretch" }}>
            <div style={{ width: LAB - GAP, flexShrink: 0, display: "flex", alignItems: "center",
                          justifyContent: "flex-end", paddingRight: 18,
                          fontFamily: fonts.display, fontSize: T.rotulo, fontWeight: 800,
                          color: lin === destacada ? c.goldBright : c.textMuted,
                          textAlign: "right" }}>
              {linhas2[lin]}
            </div>
            {[0, 1].map((col) => {
              const cel = celulas.find((x) => x.col === col && x.lin === lin);
              const e = cel && r.entrou(cel) ? r.entrada(cel, 10) : 0;
              const moldura = VAZIO + (1 - VAZIO) * e;
              const realce = lin === destacada ? eD : 0;
              const borda = cel?.cor === "custo" ? c.cost : cel?.cor === "ouro" ? c.gold : c.rule;
              return (
                <div key={col} style={{
                  width: CEL, minHeight: ALT_CEL, display: "flex", alignItems: "center",
                  justifyContent: "center", textAlign: "center", padding: "20px 24px",
                  borderRadius: 20, backgroundColor: c.bgRaise,
                  // O realce engrossa a borda sempre, mas so troca a cor de celula
                  // que nao declarou a sua. Senao "Guerra", que e custo, sairia
                  // dourada quando a linha acende, e ouro le como bom na marca.
                  border: `${3 + realce * 3}px solid ${
                    realce > 0.5 && !cel?.cor ? c.goldBright : borda
                  }`,
                  opacity: Math.max(moldura, realce * 0.9),
                }}>
                  <div style={{ opacity: e, fontFamily: fonts.display, fontSize: T.corpo,
                                fontWeight: 800, color: c.text, lineHeight: 1.14 }}>
                    {cel?.texto ?? ""}
                  </div>
                </div>
              );
            })}
            {/* Vao espelhado do rotulo, para a matriz ficar centrada no quadro. */}
            <div style={{ width: LAB - GAP, flexShrink: 0 }} />
          </div>
        ))}
        {destaque?.texto ? (
          <div style={{ marginTop: 10, textAlign: "center", fontFamily: fonts.display,
                        fontSize: T.rotulo, fontWeight: 800, color: c.goldBright, opacity: eD }}>
            {destaque.texto}
          </div>
        ) : null}
      </div>
    </Palco>
  );
};

export const Cartoes16: React.FC<{
  titulo?: string;
  cartoes: CartaoL[];
  batidas: BatidaMedida[];
}> = ({ titulo, cartoes, batidas }) => {
  const r = useRitmo(batidas);
  const n = cartoes.length;
  const gap = 26;
  // Teto de largura: com 2 cartoes, metade do quadro cada um deixava o cartao
  // enorme e o texto perdido dentro dele. Com teto, a fileira fica centrada.
  const larg = Math.min(560, Math.floor((LARG - gap * (n - 1)) / n));
  return (
    <Palco>
      <Titulo texto={titulo} />
      <div style={{ display: "flex", gap, alignItems: "stretch", justifyContent: "center", width: LARG }}>
        {cartoes.map((k, i) => {
          const e = r.entrou(k) ? r.entrada(k, 10) : 0;
          const moldura = VAZIO + (1 - VAZIO) * e;
          const borda = k.cor === "custo" ? c.cost : k.cor === "ouro" ? c.gold : c.rule;
          return (
            <div
              key={i}
              style={{
                width: larg,
                display: "flex",
                flexDirection: "column",
                gap: 14,
                justifyContent: "center",
                minHeight: 300,
                border: `4px solid ${borda}`,
                borderRadius: 22,
                backgroundColor: c.bgRaise,
                padding: "34px 30px",
                opacity: moldura,
              }}
            >
              <div style={{ opacity: e, display: "flex", flexDirection: "column", gap: 14 }}>
              <div
                style={{
                  fontFamily: fonts.display,
                  fontSize: n >= 4 ? 40 : T.corpo,
                  fontWeight: 800,
                  color: c.text,
                  lineHeight: 1.14,
                }}
              >
                {k.titulo}
              </div>
              {k.sub && (
                <div
                  style={{
                    fontFamily: fonts.display,
                    fontSize: n >= 4 ? 30 : T.rotulo,
                    color: k.cor === "custo" ? c.cost : k.cor === "ouro" ? c.gold : c.textMuted,
                    lineHeight: 1.2,
                  }}
                >
                  {k.sub}
                </div>
              )}
              {k.nota && (
                <div
                  style={{
                    fontFamily: fonts.display,
                    fontSize: T.nota,
                    color: c.textFaint,
                    lineHeight: 1.2,
                  }}
                >
                  {k.nota}
                </div>
              )}
              </div>
            </div>
          );
        })}
      </div>
    </Palco>
  );
};

// ----------------------------------------------------------------- colunas
export const Colunas16: React.FC<{
  titulo?: string;
  colunas: ColunaL[];
  nota?: Temporizado & { texto: string };
  batidas: BatidaMedida[];
}> = ({ titulo, colunas, nota, batidas }) => {
  const r = useRitmo(batidas);
  const n = colunas.length;
  const gap = 56;
  const larg = Math.min(470, Math.floor((LARG - gap * (n - 1)) / n));
  return (
    <Palco>
      <Titulo texto={titulo} />
      <div style={{ display: "flex", gap, width: LARG, justifyContent: "center" }}>
        {colunas.map((k, i) => {
          const e = r.entrou(k) ? r.entrada(k, 10) : 0;
          return (
            <div
              key={i}
              style={{
                width: larg,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 14,
              }}
            >
              <div style={{ fontFamily: fonts.display, fontSize: T.rotulo, color: c.textMuted,
                            opacity: VAZIO + (1 - VAZIO) * e }}>
                {k.rotulo}
              </div>
              <div
                style={{
                  fontFamily: fonts.display,
                  fontSize: n >= 3 ? T.numeroMedio : T.numero,
                  fontWeight: 900,
                  color: cor(k.cor),
                  lineHeight: 1,
                  opacity: e,
                }}
              >
                {k.valor}
              </div>
              {k.sub && (
                <div
                  style={{
                    fontFamily: fonts.display,
                    fontSize: T.nota,
                    color: c.textFaint,
                    textAlign: "center",
                    lineHeight: 1.2,
                    opacity: e,
                  }}
                >
                  {k.sub}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <Nota nota={nota} r={r} />
    </Palco>
  );
};

// ------------------------------------------------------------------ fatias
/**
 * Barra proporcional. A largura de cada fatia sai do peso, calculada aqui, e
 * nunca de porcentagem digitada no JSON: assim o desenho e a conta nao tem
 * como divergir, que e a mesma regra das cenas de regua e barras dos Reels.
 */
export const Fatias16: React.FC<{
  titulo?: string;
  fatias: FatiaL[];
  total?: string;
  nota?: Temporizado & { texto: string };
  batidas: BatidaMedida[];
}> = ({ titulo, fatias, total, nota, batidas }) => {
  const r = useRitmo(batidas);
  const soma = fatias.reduce((a, f) => a + f.peso, 0) || 1;
  const ALTURA = 132;
  return (
    <Palco gap={34}>
      <Titulo texto={titulo} />
      <div style={{ display: "flex", width: LARG, height: ALTURA, gap: 6 }}>
        {fatias.map((f, i) => {
          const e = r.entrou(f) ? r.entrada(f, 12) : 0;
          const w = (f.peso / soma) * (LARG - 6 * (fatias.length - 1));
          const fundo = f.cor === "custo" ? c.costDim : f.cor === "ouro" ? c.goldDim : c.rule;
          return (
            <div
              key={i}
              style={{
                width: w,
                height: ALTURA,
                borderRadius: 14,
                backgroundColor: fundo,
                border: `3px solid ${f.cor === "custo" ? c.cost : f.cor === "ouro" ? c.gold : c.textFaint}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: VAZIO + (1 - VAZIO) * e,
              }}
            >
              <div
                style={{
                  fontFamily: fonts.display,
                  fontSize: 46,
                  fontWeight: 900,
                  color: c.text,
                  opacity: e,
                }}
              >
                {Math.round((f.peso / soma) * 100)}%
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", width: LARG, gap: 6 }}>
        {fatias.map((f, i) => {
          const e = r.entrou(f) ? r.entrada(f, 12) : 0;
          const w = (f.peso / soma) * (LARG - 6 * (fatias.length - 1));
          return (
            <div
              key={i}
              style={{
                width: w,
                textAlign: "center",
                opacity: e,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <div
                style={{
                  fontFamily: fonts.display,
                  fontSize: 32,
                  fontWeight: 700,
                  color: cor(f.cor),
                  lineHeight: 1.15,
                }}
              >
                {f.rotulo}
              </div>
              {f.valor && (
                <div style={{ fontFamily: fonts.display, fontSize: T.nota, color: c.textFaint }}>
                  {f.valor}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {total && (
        <div style={{ fontFamily: fonts.display, fontSize: T.rotulo, color: c.textMuted }}>
          {total}
        </div>
      )}
      <Nota nota={nota} r={r} />
    </Palco>
  );
};

// ------------------------------------------------------------------- linha
export const Linha16: React.FC<{
  titulo?: string;
  eventos: EventoL[];
  batidas: BatidaMedida[];
}> = ({ titulo, eventos, batidas }) => {
  const r = useRitmo(batidas);
  const n = eventos.length;
  const gap = 30;
  const larg = Math.floor((LARG - gap * (n - 1)) / n);
  return (
    <Palco>
      <Titulo texto={titulo} />
      <div style={{ position: "relative", width: LARG, display: "flex", gap, alignItems: "flex-start" }}>
        <div
          style={{
            position: "absolute",
            left: larg / 2,
            right: larg / 2,
            top: 52,
            height: 6,
            backgroundColor: c.rule,
            borderRadius: 3,
          }}
        />
        {eventos.map((ev, i) => {
          const e = r.entrou(ev) ? r.entrada(ev, 10) : 0;
          return (
            <div
              key={i}
              style={{
                width: larg,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
                opacity: VAZIO + (1 - VAZIO) * e,
              }}
            >
              <div
                style={{
                  fontFamily: fonts.display,
                  fontSize: T.corpo,
                  fontWeight: 900,
                  color: cor(ev.cor),
                }}
              >
                {ev.quando}
              </div>
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: ev.cor === "ouro" ? c.gold : c.textMuted,
                  border: `5px solid ${c.bg}`,
                  transform: `scale(${0.4 + e * 0.6})`,
                }}
              />
              <div
                style={{
                  fontFamily: fonts.display,
                  fontSize: 46,
                  fontWeight: 700,
                  color: c.text,
                  textAlign: "center",
                  lineHeight: 1.18,
                }}
              >
                {ev.texto}
              </div>
              {ev.sub && (
                <div
                  style={{
                    fontFamily: fonts.display,
                    fontSize: T.nota,
                    color: c.textMuted,
                    textAlign: "center",
                    lineHeight: 1.2,
                  }}
                >
                  {ev.sub}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Palco>
  );
};

// ----------------------------------------------------------------- medidas
/** Barras horizontais de grandeza. O comprimento sai do valor, calculado aqui. */
export const Medidas16: React.FC<{
  titulo?: string;
  medidas: MedidaL[];
  nota?: Temporizado & { texto: string };
  batidas: BatidaMedida[];
}> = ({ titulo, medidas, nota, batidas }) => {
  const r = useRitmo(batidas);
  const max = Math.max(...medidas.map((m) => m.valor), 0.0001);
  const PISTA = LARG - 500;
  return (
    <Palco gap={30}>
      <Titulo texto={titulo} />
      <div style={{ display: "flex", flexDirection: "column", gap: 26, width: LARG }}>
        {medidas.map((m, i) => {
          const e = r.entrou(m) ? r.entrada(m, 14) : 0;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 24,
                                  opacity: VAZIO + (1 - VAZIO) * e }}>
              <div
                style={{
                  width: 430,
                  // Sem isto o flex encolhe o rotulo mais largo, e as barras da
                  // mesma cena comecam em x diferentes. Foi o desalinhamento
                  // visto no bloco dos homicidios: 28px entre as duas.
                  flexShrink: 0,
                  textAlign: "right",
                  fontFamily: fonts.display,
                  fontSize: T.rotulo,
                  color: c.textMuted,
                  lineHeight: 1.18,
                }}
              >
                {m.rotulo}
              </div>
              <div
                style={{
                  height: 76,
                  width: Math.max(10, (m.valor / max) * PISTA * e),
                  borderRadius: 12,
                  backgroundColor: m.cor === "ouro" ? c.gold : m.cor === "custo" ? c.cost : c.textFaint,
                }}
              />
              <div
                style={{
                  fontFamily: fonts.display,
                  fontSize: T.titulo,
                  fontWeight: 900,
                  color: cor(m.cor),
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                }}
              >
                {m.texto}
              </div>
            </div>
          );
        })}
      </div>
      <Nota nota={nota} r={r} />
    </Palco>
  );
};

// ----------------------------------------------------------------- declara
/** Afirmacoes espelhadas, para o steelman e para a autocritica. */
export const Declara16: React.FC<{
  titulo?: string;
  linhas: LinhaL[];
  batidas: BatidaMedida[];
}> = ({ titulo, linhas, batidas }) => {
  const r = useRitmo(batidas);
  // A cena nao tinha orcamento de altura. Com titulo mais 5 linhas de 56px em
  // caixas, ela passava da area util de 864px e estourava topo e base: medido
  // em 110 quadros no topo e 15 na base, no bloco da autocritica. Agora o
  // tamanho cai conforme o numero de linhas, que e o que faz a pilha crescer.
  const n = linhas.length + (titulo ? 1 : 0);
  const fonte = n >= 6 ? 34 : n >= 5 ? 38 : n >= 4 ? 42 : 46;
  const padV = n >= 5 ? 8 : 12;
  // Espaco maior entre as afirmacoes: sem moldura, e ele que as separa.
  const esp = n >= 5 ? 30 : 42;
  return (
    <Palco gap={esp}>
      <Titulo texto={titulo} />
      {linhas.map((l, i) => {
        const e = r.entrou(l) ? r.entrada(l, 10) : 0;
        const risca =
          l.riscaNa === undefined
            ? 0
            : Math.max(0, Math.min(1, (r.desde({ naBatida: l.riscaNa }) || 0) / 12));
        return (
          <div
            key={i}
            style={{
              position: "relative",
              fontFamily: fonts.display,
              fontSize: fonte,
              fontWeight: 800,
              color: cor(l.cor),
              textAlign: "center",
              lineHeight: 1.2,
              maxWidth: LARG - 120,
              // Sem caixa, por decisao do dono do canal: texto puro nao
              // precisa de moldura, e a borda so disputava atencao com o texto.
              // O que separa uma afirmacao da outra agora e o espaco e a cor.
              padding: `${padV}px 40px`,
              opacity: e,
              transform: `translateY(${(1 - e) * 18}px)`,
            }}
          >
            {l.texto}
            {risca > 0 && <Risca larg={risca} />}
          </div>
        );
      })}
    </Palco>
  );
};

// --------------------------------------------------------------------- cta
export const Cta16: React.FC<{
  pergunta: string;
  opcoes?: string[];
  acao: string;
  batidas: BatidaMedida[];
}> = ({ pergunta, opcoes, acao, batidas }) => {
  const r = useRitmo(batidas);
  const e = r.entrada({ naBatida: 0 }, 14);
  return (
    <Palco>
      <div
        style={{
          fontFamily: fonts.display,
          fontSize: T.titulo,
          fontWeight: 900,
          color: c.text,
          textAlign: "center",
          lineHeight: 1.18,
          opacity: e,
        }}
      >
        {pergunta}
      </div>
      {opcoes && (
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
          {opcoes.map((o, i) => (
            <div
              key={i}
              style={{
                fontFamily: fonts.display,
                fontSize: 40,
                fontWeight: 800,
                color: c.gold,
                border: `4px solid ${c.goldDim}`,
                borderRadius: 18,
                padding: "18px 32px",
                opacity: interpolate(r.desde({ naBatida: 0 }) - i * 7, [0, 10], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              {i + 1}. {o}
            </div>
          ))}
        </div>
      )}
      <div
        style={{
          fontFamily: fonts.display,
          fontSize: T.corpo,
          color: c.textMuted,
          textAlign: "center",
          opacity: e,
        }}
      >
        {acao}
      </div>
    </Palco>
  );
};
