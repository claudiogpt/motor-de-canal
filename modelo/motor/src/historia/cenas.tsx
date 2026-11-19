import type { MotionKit, Palco as PalcoMK } from "./mk";
import type { BatidaAbsoluta } from "./tipos";
import type { Regua } from "./regua";
import marca from "../../../marca/marca.json";

/**
 * Catálogo de cenas de história animada.
 *
 * Cada cena recebe o motion-kit, o palco, a camada svg, a régua do formato, os
 * dados do bloco e as batidas JÁ EM TEMPO ABSOLUTO, e devolve um `draw(t)`.
 * A função de montagem roda UMA vez por render: registre os objetos ali e
 * devolva o draw.
 *
 * REGRA DO DRAW, e ela não é estilo: ele tem que ser função pura do tempo.
 * Nada de somar, contar nem guardar entre chamadas. O Remotion visita os
 * frames em páginas paralelas, e um draw com estado acumulado produz quadros
 * diferentes para o mesmo t. Isso não aparece como erro: aparece como vídeo
 * errado.
 *
 * REGRA DO TEXTO: use `frase()`, nunca `MK.text` direto. O motion-kit foi
 * escrito para 1280x720 com rótulos curtos, e `MK.text` não quebra linha nem
 * conhece margem. A primeira história renderizada teve 56 quadros estourando
 * dos dois lados por causa disso.
 */

const c = marca.cores;

export type Cena = (
  mk: MotionKit,
  S: PalcoMK,
  camada: SVGGElement,
  R: Regua,
  dados: Record<string, any>,
  batidas: BatidaAbsoluta[],
) => (t: number) => void;

/** O segundo em que a batida `i` deste bloco começa. Fora da lista: a última. */
const emBatida = (batidas: BatidaAbsoluta[], i: number): number =>
  batidas.length ? batidas[Math.min(Math.max(i, 0), batidas.length - 1)].t : 0;

const corDe = (nome?: string): string =>
  nome === "custo" ? c.cost : nome === "ouro" ? c.gold : nome === "fraco" ? c.textMuted : c.text;

/**
 * Uma frase dentro da régua. Quebra em linhas e encolhe se precisar.
 *
 * Devolve o grupo e a caixa medida, para a cena saber a altura real antes de
 * posicionar o resto. Medir em vez de supor é o que evita o erro clássico
 * aqui: texto declarado em 4 linhas que vira 7 desenhadas e estoura o topo.
 */
export const frase = (
  mk: MotionKit,
  pai: SVGGElement,
  texto: string,
  R: Regua,
  o: { y: number; size?: number; cor?: string; peso?: number } ,
) => {
  const r = mk.row(pai, texto.split(/\s+/).filter(Boolean), {
    x: (R.esquerda + R.direita) / 2,
    y: o.y,
    size: o.size ?? R.corpo,
    weight: o.peso ?? 800,
    fill: o.cor ?? c.text,
    maxW: R.largura,
    fit: "shrink",
    lead: 1.2,
  });
  return r;
};

/**
 * `conversa`: pessoas numa linha de chão, cada uma entrando na sua batida.
 *
 * É a cena de trabalho da história animada, e cobre a maioria dos casos: duas
 * partes de uma troca, três bancadas disputando um orçamento, o cidadão e o
 * fiscal. O que ela mostra e um gráfico não mostra é que são PESSOAS, com
 * interesses próprios, agindo uma de cada vez.
 *
 * dados: {
 *   legenda?: string,
 *   pessoas: [{ nome, cor?, x?, naBatida?, olhaPara?: "esquerda"|"direita" }]
 * }
 *
 * `x` é opcional: sem ele as pessoas se distribuem sozinhas dentro da régua,
 * o que é melhor do que número escolhido a olho, porque sobrevive à troca de
 * formato entre 9:16 e 16:9.
 */
export const conversa: Cena = (mk, S, camada, R, dados, batidas) => {
  const st = mk.stage(S, camada as unknown as SVGElement);
  const lista: any[] = dados.pessoas ?? [];
  const n = Math.max(1, lista.length);

  // Cores diferentes por padrão: duas pessoas de camisa igual leem como a
  // mesma pessoa duplicada, e a cena inteira perde o sentido.
  const paleta = [c.gold, c.ok, c.cost, c.textMuted];

  const pessoas = lista.map((d: any, i: number) => {
    const p = mk.person(st.L.main, {
      size: dados.tamanho ?? R.pessoa,
      shirt: d.cor ? corDe(d.cor) : paleta[i % paleta.length],
      pants: c.rule,
      seed: 3 + i * 7,
      name: d.nome ?? `pessoa ${i}`,
    });
    // Distribuição automática dentro da régua, com meia célula de recuo.
    const x = d.x ?? R.esquerda + (R.largura * (i + 0.5)) / n;
    return { p, d, x, entra: emBatida(batidas, d.naBatida ?? i) };
  });

  const leg = dados.legenda
    ? frase(mk, camada, String(dados.legenda), R, {
        y: R.topo + R.corpo * 1.2,
        cor: c.textMuted,
        size: Math.round(R.corpo * 0.86),
      })
    : null;

  return (t: number) => {
    for (const { p, d, x, entra } of pessoas) {
      const u = mk.ramp(t, entra, 0.35, "expoOut");
      const falando = t >= entra && t < entra + 2.0;
      p.draw(
        {
          ...mk.pose.relaxed(),
          x,
          ground: R.chao,
          facing: d.olhaPara === "esquerda" ? -1 : 1,
          opacity: u,
          scale: mk.lerp(0.94, 1, u),
          // Boca se movendo na janela da fala. NÃO é sincronia labial, e
          // prometer isso seria mentir: o motion-kit não tem fonema.
          mouth: falando ? 0.3 + 0.22 * Math.sin(t * 13 + x) : 0,
          nod: 2 * Math.sin(t * 0.9 + x * 0.01),
        },
        t,
      );
    }
    if (leg) mk.attr(leg.g, { opacity: mk.ramp(t, emBatida(batidas, 0), 0.5, "out") });
  };
};

/**
 * `titulo`: frases que entram uma por batida, sem personagem. É o gancho e o
 * fecho de uma história.
 *
 * dados: { linhas: [{ texto, cor?: "ouro"|"custo", naBatida? }] }
 */
export const titulo: Cena = (mk, S, camada, R, dados, batidas) => {
  const linhas: any[] = dados.linhas ?? [];
  const corpo = Math.round(R.corpo * 1.6);
  // Mede cada linha antes de empilhar: uma frase longa vira duas linhas
  // desenhadas, e empilhar pela contagem declarada joga o bloco para fora.
  const feitas = linhas.map((l: any, i: number) => ({
    r: frase(mk, camada, String(l.texto), R, {
      y: 0, size: corpo, cor: corDe(l.cor), peso: 900,
    }),
    entra: emBatida(batidas, l.naBatida ?? i),
  }));

  const alturas = feitas.map((f) => f.r.lines * corpo * 1.2);
  const total = alturas.reduce((a, b) => a + b, 0);
  let y = (R.topo + R.base) / 2 - total / 2 + alturas[0] / 2;
  for (let i = 0; i < feitas.length; i++) {
    mk.attr(feitas[i].r.g, { transform: `translate(0 ${y})` });
    y += (alturas[i] + (alturas[i + 1] ?? 0)) / 2;
  }

  return (t: number) => {
    for (const { r, entra } of feitas) {
      const u = mk.ramp(t, entra, 0.3, "expoOut");
      mk.attr(r.g, { opacity: u });
    }
  };
};

export const CATALOGO: Record<string, Cena> = { conversa, titulo };
