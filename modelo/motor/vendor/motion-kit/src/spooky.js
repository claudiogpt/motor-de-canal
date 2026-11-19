/* spooky.js — Elementos temáticos opcionais: abóboras, morcegos, teias e névoa. */
(function () {
  const MK = window.MK;
  const { el, attr } = MK;

  MK.MOOD.spooky = { skyTop: "#0B0718", skyBot: "#2C1D4E", sun: "#F3EBC8", sunGlow: "#B9A6FF", cloud: "#2B2346",
    far: "#271C43", mid: "#1C1534", near: "#140F27", ground: "#18132C", groundD: "#0D0A1B", haze: "#3B2E66",
    shadow: "#000000", light: 0.4 };
  MK.MOOD.indoorNight = { wall: "#2E3350", wallD: "#242941", floor: "#3B2F2B", floorD: "#2B221F", trim: "#454C6E",
    shadow: "#000000", light: 0.4 };

  /** Névoa: manchas macias que correm na horizontal (e voltam pelo outro lado) dentro da faixa y0–y1.
      opts {y0, y1, x0, x1, n, color, opacity, speed, seed}. draw(t, {opacity}) */
  MK.fog = function (parent, S, { y0 = 1250, y1 = 1550, x0 = -500, x1 = 1600, n = 9, color = "#B9B2E0", opacity = 0.32,
                                  speed = 28, seed = 21 } = {}) {
    const svg = parent.ownerSVGElement, r = MK.rand(seed), g = el("g", {}, parent);
    const fill = MK.radial(svg, [[0, color, 0.9], [0.55, color, 0.45], [1, color, 0]]);
    const span = x1 - x0, puffs = [];
    for (let i = 0; i < n; i++) {
      const w = 420 + 380 * r(), h = (y1 - y0) * (0.35 + 0.4 * r());
      puffs.push({ e: el("ellipse", { rx: w / 2, ry: h / 2, fill }, g), base: span * (i / n + 0.08 * r()),
        y: y0 + (y1 - y0) * (0.2 + 0.6 * r()), v: speed * (0.6 + 0.8 * r()), ph: r() * 6.3, w });
    }
    return { g, draw(t, { opacity: o = 1 } = {}) {
      for (const p of puffs) {
        const x = x0 + ((((p.base + p.v * t) % span) + span) % span);
        attr(p.e, { cx: x, cy: p.y + 10 * Math.sin(t * 0.4 + p.ph), opacity: o * opacity * (0.75 + 0.25 * Math.sin(t * 0.3 + p.ph)) });
      }
    } };
  };

  /** Árvore seca: galhos que afinam e se dividem (recursivo), balanço leve. opts {x, y, h, color, seed, depth, sway} */
  MK.deadTree = function (parent, { x = 0, y = 1500, h = 640, color = "#1A1426", seed = 7, depth = 5, sway = 1 } = {}) {
    const r = MK.rand(seed), g = el("g", {}, parent), crown = el("g", {}, g);
    const limb = (gp, x0, y0, len, ang, w, d) => {
      const x1 = x0 + Math.cos(ang) * len, y1 = y0 + Math.sin(ang) * len, k = 0.12 * len * (r() - 0.5);
      const nx = -Math.sin(ang), ny = Math.cos(ang), w1 = w * 0.62;
      el("path", { d: `M${x0 + nx * w / 2},${y0 + ny * w / 2}Q${(x0 + x1) / 2 + nx * k},${(y0 + y1) / 2 + ny * k} ${x1 + nx * w1 / 2},${y1 + ny * w1 / 2}`
        + `L${x1 - nx * w1 / 2},${y1 - ny * w1 / 2}Q${(x0 + x1) / 2 + nx * k},${(y0 + y1) / 2 + ny * k} ${x0 - nx * w / 2},${y0 - ny * w / 2}Z`, fill: color }, gp);
      if (d <= 0) return;
      const kids = d > 3 ? 2 : 2 + (r() < 0.4 ? 1 : 0);
      for (let i = 0; i < kids; i++) {
        const a = ang + (i - (kids - 1) / 2) * (0.5 + 0.35 * r()) + 0.15 * (r() - 0.5);
        limb(gp, x1, y1, len * (0.62 + 0.15 * r()), a, w1, d - 1);
      }
    };
    const tw = h * 0.09;
    el("path", { d: `M${x - tw},${y}Q${x - tw * 0.3},${y - h * 0.2} ${x - tw * 0.35},${y - h * 0.42}L${x + tw * 0.35},${y - h * 0.42}Q${x + tw * 0.3},${y - h * 0.2} ${x + tw},${y}Z`, fill: color }, g);
    g.appendChild(crown);
    limb(crown, x, y - h * 0.4, h * 0.3, -Math.PI / 2 - 0.25, tw * 0.75, depth);
    limb(crown, x, y - h * 0.4, h * 0.26, -Math.PI / 2 + 0.45, tw * 0.6, depth - 1);
    const ph = r() * 6.3;
    return { g, draw(t) { attr(crown, { transform: `rotate(${(sway * 1.1 * Math.sin(t * 0.9 + ph)).toFixed(3)} ${x} ${y - h * 0.4})` }); } };
  };

  /** Abóbora de Halloween (âncora no fundo, no meio), com rosto entalhado e luz de vela que tremula.
      opts {r, color, face, seed}. draw(t, {lit}) */
  MK.pumpkin = function (parent, { r = 90, color = "#F07F2A", face = true, seed = 3 } = {}) {
    const o = MK.prop(parent), g = o.inner, svg = parent.ownerSVGElement, rnd = MK.rand(seed);
    const glow = el("circle", { cx: 0, cy: -r * 0.8, r: r * 3.2, fill: MK.radial(svg, [[0, "#FFB547", 0.5], [1, "#FFB547", 0]]) }, g);
    const ribs = [[-0.62, 0.55, -0.16], [0.62, 0.55, -0.16], [-0.32, 0.72, -0.05], [0.32, 0.72, -0.05], [0, 0.6, 0.08]];
    for (const [dx, w, sh] of ribs) el("ellipse", { cx: dx * r, cy: -r * 0.82, rx: r * w, ry: r * 0.82, fill: MK.shade(color, sh) }, g);
    el("path", { d: `M${-r * 0.08},${-r * 1.55}q${r * 0.05},${-r * 0.32} ${r * 0.3},${-r * 0.4}l${r * 0.06},${r * 0.12}q${-r * 0.2},${r * 0.08} ${-r * 0.18},${r * 0.32}Z`, fill: "#4E6B2E" }, g);
    el("ellipse", { cx: -r * 0.45, cy: -r * 1.15, rx: r * 0.12, ry: r * 0.32, fill: "#fff", opacity: 0.12 }, g);
    const holes = [];
    if (face) {
      const lit = (d) => holes.push(el("path", { d, fill: "#FFD36B" }, g));
      lit(`M${-r * 0.48},${-r * 0.95}L${-r * 0.18},${-r * 0.95}L${-r * 0.33},${-r * 1.25}Z`);
      lit(`M${r * 0.18},${-r * 0.95}L${r * 0.48},${-r * 0.95}L${r * 0.33},${-r * 1.25}Z`);
      lit(`M${-r * 0.08},${-r * 0.78}L${r * 0.08},${-r * 0.78}L0,${-r * 0.92}Z`);
      let m = `M${-r * 0.55},${-r * 0.55}`;
      for (let i = 1; i <= 6; i++) m += `L${-r * 0.55 + i * r * 0.183},${-r * (i % 2 ? 0.46 + 0.04 * rnd() : 0.55)}`;
      m += `Q0,${-r * 0.12} ${-r * 0.55},${-r * 0.55}Z`;
      lit(m);
    }
    o.draw = (t, { lit = 1 } = {}) => {
      const f = 0.82 + 0.1 * Math.sin(t * 11) + 0.08 * Math.sin(t * 17.3);
      attr(glow, { opacity: lit * f });
      holes.forEach((h) => attr(h, { fill: MK.mixColor("#2A160B", "#FFD36B", lit * f) }));
    };
    o.draw(0);
    return o;
  };

  /** Bando de morcegos voando em ondas (as asas batem). opts {n, x0, x1, y0, y1, size, color, speed, seed}.
      draw(t, {on}) */
  MK.bats = function (parent, { n = 6, x0 = -200, x1 = 1300, y0 = 300, y1 = 700, size = 34, color = "#0A0712", speed = 140,
                                seed = 31 } = {}) {
    const r = MK.rand(seed), g = el("g", {}, parent), span = x1 - x0, list = [];
    for (let i = 0; i < n; i++) {
      list.push({ e: el("path", { fill: color }, g), base: span * r(), y: y0 + (y1 - y0) * r(), v: speed * (0.7 + 0.6 * r()),
        s: size * (0.7 + 0.6 * r()), ph: r() * 6.3, f: 9 + 4 * r(), dir: r() < 0.5 ? 1 : -1 });
    }
    return { g, draw(t, { on = 1 } = {}) {
      for (const b of list) {
        const x = x0 + ((((b.base + b.dir * b.v * t) % span) + span) % span), y = b.y + 40 * Math.sin(t * 1.3 + b.ph);
        const fl = Math.sin(t * b.f + b.ph), s = b.s, wy = -s * 0.6 * fl;
        attr(b.e, { opacity: on, d: `M${x},${y}Q${x - s * 0.5},${y + wy - s * 0.2} ${x - s * 1.2},${y + wy}Q${x - s * 0.9},${y + s * 0.05} ${x - s * 0.7},${y + s * 0.25}`
          + `Q${x - s * 0.4},${y + s * 0.1} ${x - s * 0.15},${y + s * 0.3}L${x},${y + s * 0.15}L${x + s * 0.15},${y + s * 0.3}`
          + `Q${x + s * 0.4},${y + s * 0.1} ${x + s * 0.7},${y + s * 0.25}Q${x + s * 0.9},${y + s * 0.05} ${x + s * 1.2},${y + wy}`
          + `Q${x + s * 0.5},${y + wy - s * 0.2} ${x},${y}Z` });
      }
    } };
  };

  /** Lápide (âncora no pé, no meio). opts {x, y, w, h, kind: round|cross|slab, text, color, tilt, moss}. Devolve o <g>. */
  MK.gravestone = function (parent, { x = 540, y = 1450, w = 170, h = 230, kind = "round", text = "", color = "#6F6A86",
                                      tilt = 0, moss = true, seed = 5 } = {}) {
    const g = el("g", { transform: `rotate(${tilt} ${x} ${y})` }, parent), dk = MK.shade(color, -0.25), r = MK.rand(seed);
    let d;
    if (kind === "cross") {
      const a = w * 0.32;
      d = `M${x - a / 2},${y}V${y - h * 0.62}H${x - w / 2}V${y - h * 0.8}H${x - a / 2}V${y - h}H${x + a / 2}V${y - h * 0.8}H${x + w / 2}V${y - h * 0.62}H${x + a / 2}V${y}Z`;
    } else if (kind === "slab") d = MK.rrect(x - w / 2, y - h, w, h, 10);
    else d = `M${x - w / 2},${y}V${y - h + w / 2}A${w / 2},${w / 2} 0 0 1 ${x + w / 2},${y - h + w / 2}V${y}Z`;
    el("path", { d, fill: dk, transform: "translate(10 0)" }, g);
    el("path", { d, fill: color }, g);
    if (text) MK.text(g, text, { x, y: y - h * 0.45, size: w * 0.24, fill: dk, weight: 800, anchor: "middle" });
    if (moss) el("path", { d: MK.blob(x - w * 0.25, y - 6, w * 0.22, { seed: seed + r(), sy: 0.35 }), fill: "#3E5A3A", opacity: 0.8 }, g);
    el("rect", { x: x - w * 0.62, y: y - 8, width: w * 1.24, height: 16, rx: 8, fill: "#000", opacity: 0.25 }, g);
    return g;
  };

  /** Lanterna: escurece tudo (retângulo grande) menos um cone de luz quente e as luzes dadas em glows (abóbora, vela,
      janela acesa: [{x, y, r}], até 6). Ponha numa camada acima do que ela ilumina (main ou front, nas coordenadas
      dessa camada). draw({x, y, ang (graus, 0 = direita), len, spread (graus), dark (0–1; ~0,6 ainda lê no celular),
      on, glows}) */
  MK.flashlight = function (parent, S, { w = S.W * 4, h = S.H * 4, beam = "#FFE7A8" } = {}) {
    const svg = parent.ownerSVGElement, defs = MK.defs(svg), id = MK.uid("fl");
    const mask = el("mask", { id, maskUnits: "userSpaceOnUse", x: S.W / 2 - w / 2, y: S.H / 2 - h / 2, width: w, height: h }, defs);
    el("rect", { x: S.W / 2 - w / 2, y: S.H / 2 - h / 2, width: w, height: h, fill: "#fff" }, mask);
    const blurF = MK.filter(svg, "blur", { std: 14 });
    const holeM = el("path", { fill: "#000", filter: blurF.url }, mask), spotM = el("circle", { fill: "#000", filter: blurF.url }, mask);
    const soft = MK.radial(svg, [[0, "#000", 1], [0.45, "#000", 0.7], [1, "#000", 0]]);
    const glowM = Array.from({ length: 6 }, () => el("circle", { r: 0, fill: soft }, mask));
    const g = el("g", {}, parent);
    const dark = el("rect", { x: S.W / 2 - w / 2, y: S.H / 2 - h / 2, width: w, height: h, fill: "#05040C", mask: `url(#${id})` }, g);
    const tint = el("path", { fill: MK.radial(svg, [[0, beam, 0.35], [1, beam, 0]], { cx: 0, cy: 0.5, r: 1 }), style: "mix-blend-mode:screen" }, g);
    return { g, draw({ x = 540, y = 900, ang = -30, len = 900, spread = 26, dark: dk = 0.6, on = 1, glows = [] } = {}) {
      glowM.forEach((c, i) => { const q = glows[i]; attr(c, q ? { cx: q.x, cy: q.y, r: q.r } : { r: 0 }); });
      const a = (ang * Math.PI) / 180, s = (spread * Math.PI) / 360;
      const p1 = [x + Math.cos(a - s) * len, y + Math.sin(a - s) * len], p2 = [x + Math.cos(a + s) * len, y + Math.sin(a + s) * len];
      const ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len, rr = len * Math.tan(s);
      const cone = `M${x},${y}L${p1[0]},${p1[1]}A${rr},${rr} 0 0 1 ${p2[0]},${p2[1]}Z`;
      attr(holeM, { d: on ? cone : "M0,0" });
      attr(spotM, { cx: ex, cy: ey, r: on ? rr : 0 });
      attr(dark, { opacity: dk });
      attr(tint, { d: cone, opacity: on, transform: "" });
    } };
  };

  /** Teia de aranha num canto (fios radiais + espiral). opts {x, y, r, corner: tl|tr|bl|br, color, opacity, seed} */
  MK.cobweb = function (parent, { x = 0, y = 0, r = 260, corner = "tl", color = "#E8E6F5", opacity = 0.45, seed = 9 } = {}) {
    const g = el("g", { opacity }, parent), rnd = MK.rand(seed);
    const a0 = { tl: 0, tr: Math.PI / 2, br: Math.PI, bl: (3 * Math.PI) / 2 }[corner] || 0, n = 6;
    const ang = (i) => a0 + (i / (n - 1)) * (Math.PI / 2);
    for (let i = 0; i < n; i++) el("path", { d: `M${x},${y}L${x + Math.cos(ang(i)) * r},${y + Math.sin(ang(i)) * r}`, stroke: color, strokeWidth: 2.5, fill: "none" }, g);
    for (let k = 1; k <= 5; k++) {
      const rr = (r * k) / 5.5;
      let d = "";
      for (let i = 0; i < n - 1; i++) {
        const p = [x + Math.cos(ang(i)) * rr, y + Math.sin(ang(i)) * rr], q = [x + Math.cos(ang(i + 1)) * rr, y + Math.sin(ang(i + 1)) * rr];
        const m = (ang(i) + ang(i + 1)) / 2, sag = rr * (0.82 + 0.06 * rnd());
        d += `${i ? "" : `M${p[0]},${p[1]}`}Q${x + Math.cos(m) * sag},${y + Math.sin(m) * sag} ${q[0]},${q[1]}`;
      }
      el("path", { d, stroke: color, strokeWidth: 2, fill: "none" }, g);
    }
    return g;
  };
})();
