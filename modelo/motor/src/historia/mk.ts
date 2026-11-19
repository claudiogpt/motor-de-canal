/**
 * Carrega o motion-kit dentro do Remotion.
 *
 * O motion-kit é de navegador e não tem módulos: cada arquivo é uma IIFE que
 * escreve em `window.MK`. Não existe `export` em nenhum deles. Então aqui o
 * import é POR EFEITO COLATERAL, e a ordem importa: `core.js` cria o objeto
 * `window.MK` e todos os outros fazem `const MK = window.MK` na primeira linha.
 * Carregar qualquer um antes do core deixa MK indefinido.
 *
 * Fixado no commit 459b0ee (veja vendor/motion-kit/COMMIT-FIXADO.txt). É um
 * projeto v0.x com 2 commits: atualizar sem fixar quebraria render antigo.
 */
import "../../vendor/motion-kit/src/core.js";
import "../../vendor/motion-kit/src/camera.js";
import "../../vendor/motion-kit/src/shots.js";
import "../../vendor/motion-kit/src/world.js";
import "../../vendor/motion-kit/src/layout.js";
import "../../vendor/motion-kit/src/anim.js";
import "../../vendor/motion-kit/src/people.js";
import "../../vendor/motion-kit/src/actions.js";
import "../../vendor/motion-kit/src/props.js";
import "../../vendor/motion-kit/src/scenery.js";
import "../../vendor/motion-kit/src/garb.js";
import "../../vendor/motion-kit/src/atmos.js";
import "../../vendor/motion-kit/src/weather.js";
import "../../vendor/motion-kit/src/fx.js";

/** O que usamos do MK. Não é a API toda: veja vendor/motion-kit/docs/api.md. */
export type MotionKit = {
  start: (o: {
    root: HTMLElement;
    width?: number;
    height?: number;
    duration?: number;
    cues?: Record<string, number | [number, number]>;
  }) => Palco;
  run: (S: Palco, draw: (t: number) => void) => { seek: (t: number) => void; duration: number };
  stage: (S: Palco, svg: SVGElement) => any;
  person: (parent: any, o: Record<string, unknown>) => any;
  actor: (p: any, o: Record<string, unknown>) => any;
  camera: (S: Palco, st: any, o: Record<string, unknown>) => any;
  world: (S: Palco, st: any) => any;
  env: (S: Palco, st: any, o: Record<string, unknown>) => any;
  el: (tag: string, attrs: Record<string, unknown>, parent?: any) => any;
  g: (parent: any, attrs?: Record<string, unknown>) => any;
  text: (parent: any, s: string, o?: Record<string, unknown>) => any;
  /** Fileira de tokens medidos, com maxW e quebra. É o que a cena usa para
      texto: MK.text não quebra linha nem conhece margem. */
  row: (parent: any, tokens: (string | Record<string, unknown>)[],
        o?: Record<string, unknown>) => {
    g: SVGGElement; items: any[]; size: number; lines: number;
    box: { x: number; y: number; w: number; h: number };
  };
  attr: (node: any, attrs: Record<string, unknown>) => void;
  tf: (x: number, y: number, extra?: unknown) => string;
  clamp: (x: number, a?: number, b?: number) => number;
  lerp: (a: number, b: number, u: number) => number;
  ramp: (t: number, t0: number, dur: number, ease?: string) => number;
  pulse: (t: number, t0: number, dur: number) => number;
  anim: Record<string, any>;
  pose: Record<string, any>;
  overlap: { check: () => unknown };
  C: Record<string, string>;
  [k: string]: any;
};

export type Palco = {
  root: HTMLElement;
  W: number;
  H: number;
  dur: number;
  home: [number, number];
  has: (n: string) => boolean;
  cue: (n: string, end?: boolean) => number;
};

export const MK = (): MotionKit => {
  const mk = (globalThis as unknown as { MK?: MotionKit }).MK;
  if (!mk) {
    throw new Error(
      "window.MK não existe. O motion-kit não carregou: confira a ordem dos " +
        "imports em src/historia/mk.ts (core.js tem que vir primeiro).",
    );
  }
  return mk;
};
