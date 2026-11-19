# Receitas reutilizáveis

Os trechos abaixo assumem `S = MK.start(...)` já criado e os módulos necessários carregados. Construa os objetos antes de `MK.run`; execute as linhas indicadas para desenho dentro do callback.

## Cartões em cascata

Requer `core`, `anim`. `parent` é um grupo SVG.

```js
const times = MK.anim.stagger(3, { t0: 0.4, gap: 0.12 });
['Um', 'Dois', 'Três'].forEach((label, i) => {
  const card = MK.g(parent, { transform: MK.tf(250 + i * 360, 300) });
  MK.el('rect', { x: -140, y: -50, width: 280, height: 100, rx: 16, fill: '#ede9fe' }, card);
  MK.text(card, label, { size: 32, fill: '#5b21b6' });
  MK.anim.enter(card, { from: times[i], to: 6, kind: 'rise', dur: 0.3 });
});
// A entrada e a saída são executadas automaticamente pelo relógio.
```

## Trajetória com pouso macio

Requer `core`, `anim`. O pivô fica na base para conservar o apoio.

```js
const ball = MK.el('circle', { cx: 0, cy: -30, r: 30, fill: '#0f766e' }, parent);
const mover = MK.anim.mover(ball, { pivot: [0, 0] });
function drawBall(t) {
  const u = MK.ramp(t, 1, 1.2, 'linear');
  const [x, y] = MK.anim.arc([200, 540], [950, 540], u, { h: 260 });
  const squash = MK.pulse(t, 2.25, 0.3);
  mover.set({ x, y, ...MK.anim.squash(squash, 0.25) });
}
// No callback de MK.run: drawBall(t).
```

## Entidade temporária

Requer `core`, `camera`, `shots`, `world`. Crie `st = MK.stage(S, svg)`.

```js
const W = MK.world(S, st);
W.add('notice', {
  layer: 'hud', life: { from: 1, to: 4 }, fade: 0.2,
  build(g) { return MK.text(g, 'Pronto', { x: 640, y: 100, size: 36 }); },
  update(t, entity) { MK.attr(entity.obj, { opacity: 0.8 + 0.2 * Math.sin(t * 2) }); },
});
// Atualização e visibilidade são automáticas. W.report(S.dur) ajuda a conferir vidas úteis.
```

## Personagem que caminha e aponta

Requer `core`, `camera`, `shots`, `world`, `people`, `actions`.

```js
const p = MK.person(st.L.main, { name: 'Pessoa', size: 350, shirt: '#0f766e', seed: 4 });
const actor = MK.actor(p, { x: 150, ground: 600, speed: 180 });
actor.do([
  [0.5, 'walk', { to: 650 }],
  [4.5, 'point', { at: [950, 300], hold: 1 }],
]);
// No callback de MK.run: actor.draw(t).
```

## Câmera que revela um detalhe

Requer `core`, `camera`.

```js
const cam = MK.camera(S, st, { moves: [
  [0, { x: 640, y: 360, z: 1 }, 0],
  [2, { at: [900, 400], on: [640, 360], z: 1.5 }, 1.1, 'inOut'],
  [5, { x: 640, y: 360, z: 1 }, 1.2, 'inOut'],
] });
// No callback de MK.run: cam.apply(t).
```

## Ambiente com vento compartilhado

Requer `core`, `camera`, `scenery`, `atmos`.

```js
const env = MK.env(S, st, { hour: 17, wind: { base: 0.2, gust: 0.4 } });
const grass = MK.grass(st.L.front, { y: 610, x0: 0, x1: 1280, wind: env.wind });
// No callback de MK.run: env.draw(t); grass.draw(t).
```

## Diagnóstico de um quadro

Requer `layout` e as dependências dos objetos inspecionados.

```js
clock.seek(3.2);
console.log(MK.overlap.check());
```

Compare capturas feitas em `seek(3.2)` antes e depois de `seek(7)`. O resultado visual deve ser o mesmo. Se não for, procure estado acumulado no callback, mudanças de layout não determinísticas ou duas ajudas alterando o mesmo atributo.
