/* props.js — Objetos SVG configuráveis e seus controles de desenho. */
(function () {
  const MK = window.MK;
  const { el, attr } = MK;

  function mk(parent, opts = {}) {
    const g = el("g", {}, parent), inner = el("g", {}, g);
    const o = { g, inner, place(x = 0, y = 0, rot = 0, s = 1) { attr(g, { transform: MK.tf(x, y, rot, s) }); return o; },
                show(v) { attr(g, { opacity: v }); return o; } };
    return o;
  }
  MK.prop = mk;

  /** Caneca: âncora no fundo, no meio. opts {w, h, color, steam}. */
  MK.mug = function (parent, { w = 120, h = 130, color = "#E86A4A", steam = false, liquid = "#5A3420" } = {}) {
    const o = mk(parent), g = o.inner;
    el("path", { d: `M${w * 0.45},${-h * 0.75}c${w * 0.35},0 ${w * 0.35},${h * 0.5} 0,${h * 0.5}`, fill: "none", stroke: MK.shade(color, -0.15), strokeWidth: w * 0.12 }, g);
    el("path", { d: `M${-w / 2},${-h}h${w}l${-w * 0.05},${h * 0.92}q0,${h * 0.08} ${-w * 0.1},${h * 0.08}h${-w * 0.7}q${-w * 0.1},0 ${-w * 0.1},${-h * 0.08}Z`, fill: color }, g);
    el("ellipse", { cx: 0, cy: -h, rx: w / 2, ry: w * 0.12, fill: MK.shade(color, -0.2) }, g);
    el("ellipse", { cx: 0, cy: -h + w * 0.02, rx: w * 0.42, ry: w * 0.08, fill: liquid }, g);
    el("rect", { x: -w * 0.32, y: -h * 0.85, width: w * 0.1, height: h * 0.65, rx: w * 0.05, fill: "#fff", opacity: 0.2 }, g);
    const st = [];
    if (steam) for (let i = 0; i < 3; i++) st.push(el("path", { fill: "none", stroke: "#fff", strokeWidth: 6, strokeLinecap: "round", opacity: 0.5 }, g));
    o.draw = (t) => st.forEach((p, i) => {
      const x = (i - 1) * w * 0.25, ph = t * 1.8 + i * 2;
      attr(p, { d: `M${x},${-h - 20}c${18 * Math.sin(ph)},-30 ${-18 * Math.sin(ph + 1)},-60 0,${-100 - 10 * Math.sin(ph)}`, opacity: 0.25 + 0.25 * Math.sin(ph) });
    });
    return o;
  };

  /** Copo com água (e cubos de gelo opcionais): âncora no fundo. opts {w, h, level (0–1), ice (n)}. */
  MK.glass = function (parent, { w = 150, h = 230, level = 0.7, ice = 0, water = "#7CC4F2", seed = 2 } = {}) {
    const o = mk(parent), g = o.inner, svg = parent.ownerSVGElement;
    const body = `M${-w / 2},${-h}L${-w * 0.42},0H${w * 0.42}L${w / 2},${-h}Z`;
    const cid = MK.uid("gl");
    el("path", { d: body }, el("clipPath", { id: cid }, MK.defs(svg)));
    const inside = el("g", { clipPath: `url(#${cid})` }, g);
    el("path", { d: body, fill: "#DDEFFF", opacity: 0.25 }, inside);
    const wat = el("rect", { x: -w, width: 2 * w, fill: water, opacity: 0.7 }, inside);
    const surf = el("ellipse", { rx: w * 0.47, ry: w * 0.06, fill: MK.shade(water, 0.3), opacity: 0.8 }, inside);
    const cubes = [];
    const r = MK.rand(seed);
    for (let i = 0; i < ice; i++) cubes.push({ g: el("rect", { width: w * 0.32, height: w * 0.3, rx: w * 0.06, fill: "#F2FBFF", stroke: "#BFE6FF", strokeWidth: 3, opacity: 0.92 }, inside), dx: (i - (ice - 1) / 2) * w * 0.3, ph: r() * 6, rot: (r() - 0.5) * 30 });
    el("path", { d: body, fill: "none", stroke: "#CFE9FF", strokeWidth: 5, opacity: 0.9 }, g);
    el("rect", { x: -w * 0.36, y: -h * 0.9, width: w * 0.07, height: h * 0.75, rx: w * 0.03, fill: "#fff", opacity: 0.45 }, g);
    o.draw = (t, { level: lv = level } = {}) => {
      const sy = -h * lv;
      attr(wat, { y: sy, height: h * 1.2 });
      attr(surf, { cx: 0, cy: sy });
      cubes.forEach((c, i) => attr(c.g, { x: c.dx - w * 0.16, y: sy - w * 0.12 + 4 * Math.sin(t * 1.4 + c.ph), transform: `rotate(${c.rot + 3 * Math.sin(t + c.ph)} ${c.dx} ${sy})` }));
    };
    o.draw(0);
    return o;
  };

  /** Folha de papel (vista de frente, com linhas). Âncora no centro. */
  MK.paper = function (parent, { w = 300, h = 400, color = "#F4F1E8", lines = true } = {}) {
    const o = mk(parent), g = o.inner;
    el("rect", { x: -w / 2 + 6, y: -h / 2 + 8, width: w, height: h, rx: 6, fill: "#000", opacity: 0.18 }, g);
    el("rect", { x: -w / 2, y: -h / 2, width: w, height: h, rx: 6, fill: color }, g);
    if (lines) for (let i = 1; i < 9; i++) el("rect", { x: -w * 0.4, y: -h / 2 + (i * h) / 9, width: w * 0.8, height: 3, fill: "#9FB4D8", opacity: 0.6 }, g);
    return o;
  };

  /** Livro fechado (de lado ou de frente). */
  MK.book = function (parent, { w = 220, h = 300, color = "#3F6FD1", title = "" } = {}) {
    const o = mk(parent), g = o.inner;
    el("rect", { x: -w / 2, y: -h, width: w, height: h, rx: 10, fill: color }, g);
    el("rect", { x: -w / 2, y: -h, width: w * 0.12, height: h, rx: 6, fill: MK.shade(color, -0.2) }, g);
    el("rect", { x: -w * 0.25, y: -h * 0.8, width: w * 0.6, height: h * 0.12, rx: 4, fill: "#fff", opacity: 0.85 }, g);
    if (title) MK.text(g, title, { x: w * 0.05, y: -h * 0.74, size: h * 0.07, fill: color, weight: 800 });
    return o;
  };

  /** Celular: âncora no centro. opts {w, screen (cor)}. Devolve também .screen (<g> para desenhar na tela). */
  MK.phone = function (parent, { w = 150, h = 300, body = "#23252B", screen = "#1E2A44" } = {}) {
    const o = mk(parent), g = o.inner;
    el("rect", { x: -w / 2, y: -h / 2, width: w, height: h, rx: w * 0.16, fill: body }, g);
    el("rect", { x: -w / 2 + 8, y: -h / 2 + 8, width: w - 16, height: h - 16, rx: w * 0.12, fill: screen }, g);
    el("rect", { x: -w * 0.15, y: -h / 2 + 14, width: w * 0.3, height: 10, rx: 5, fill: body }, g);
    o.screen = el("g", {}, g);
    return o;
  };

  MK.ball = function (parent, { r = 60, color = "#E5533D", stripe = "#fff" } = {}) {
    const o = mk(parent), g = o.inner, svg = parent.ownerSVGElement;
    el("circle", { r, fill: color }, g);
    el("path", { d: `M${-r},0Q0,${-r * 0.5} ${r},0`, fill: "none", stroke: stripe, strokeWidth: r * 0.16 }, g);
    el("circle", { r, fill: MK.radial(svg, [[0, "#fff", 0.35], [0.5, "#fff", 0], [1, "#000", 0.25]], { cx: 0.35, cy: 0.3, r: 0.75 }) }, g);
    return o;
  };

  /** Balão de festa com cordão: âncora no nó. draw(t) balança. */
  MK.balloon = function (parent, { r = 80, color = "#E87BA8", string = 220, seed = 1 } = {}) {
    const o = mk(parent), g = o.inner, svg = parent.ownerSVGElement;
    const str = el("path", { fill: "none", stroke: "#888", strokeWidth: 3 }, g);
    const b = el("g", {}, g);
    el("path", { d: `M0,0C${-r * 1.2},${-r * 0.3} ${-r * 1.1},${-r * 2.2} 0,${-r * 2.2}C${r * 1.1},${-r * 2.2} ${r * 1.2},${-r * 0.3} 0,0Z`, fill: color }, b);
    el("path", { d: `M0,0l-10,14h20Z`, fill: MK.shade(color, -0.2) }, b);
    el("ellipse", { cx: -r * 0.35, cy: -r * 1.5, rx: r * 0.18, ry: r * 0.32, fill: "#fff", opacity: 0.45, transform: `rotate(-20 ${-r * 0.35} ${-r * 1.5})` }, b);
    o.draw = (t) => {
      const a = 4 * Math.sin(t * 1.3 + seed);
      attr(b, { transform: `rotate(${a})` });
      attr(str, { d: `M0,10q${12 * Math.sin(t * 2 + seed)},${string / 2} 0,${string}` });
    };
    o.draw(0);
    return o;
  };

  /** Varinha de bolha de sabão: âncora no cabo. shape "circle" | "square" | "star" | "heart". */
  MK.wand = function (parent, { len = 200, r = 48, shape = "circle", color = "#5AA9E6" } = {}) {
    const o = mk(parent), g = o.inner;
    el("rect", { x: -7, y: -len, width: 14, height: len, rx: 7, fill: color }, g);
    const cy = -len - r;
    let d;
    if (shape === "square") d = MK.rrect(-r, cy - r, 2 * r, 2 * r, 6);
    else if (shape === "star") {
      const pts = [];
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.48 : r * 1.1; pts.push([Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
      d = "M" + pts.map((p) => p.join(",")).join("L") + "Z";
    } else if (shape === "heart") d = `M0,${cy + r * 0.9}C${-r * 1.6},${cy - r * 0.1} ${-r * 0.7},${cy - r * 1.3} 0,${cy - r * 0.45}C${r * 0.7},${cy - r * 1.3} ${r * 1.6},${cy - r * 0.1} 0,${cy + r * 0.9}Z`;
    else d = `M${-r},${cy}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0`;
    o.film = el("path", { d, fill: "#BFE6FF", opacity: 0.25 }, g);
    el("path", { d, fill: "none", stroke: color, strokeWidth: 12, strokeLinejoin: "round" }, g);
    o.ring = [0, cy];                                  // centro do aro, no sistema local
    return o;
  };

  /** Bolha de sabão iridescente. draw(t, {x, y, r, wobble (0–0,1), opacity, hue (giro das cores), squash}). */
  MK.bubble = function (parent, { r = 100, seed = 1 } = {}) {
    const o = mk(parent), g = o.inner, svg = parent.ownerSVGElement;
    const cid = MK.uid("bub");
    const film = MK.radial(svg, [[0, "#ffffff", 0.02], [0.72, "#BFE6FF", 0.06], [0.93, "#9FD8FF", 0.28], [1, "#ffffff", 0.5]], { r: 0.5 });
    const rim = MK.linear(svg, [[0, "#FF7AD9", 0.85], [0.25, MK.C.ACCENT, 0.75], [0.5, "#7CF2C8", 0.75], [0.75, "#65B8FF", 0.85], [1, "#B488FF", 0.85]], { x1: 0, y1: 0, x2: 1, y2: 1, id: cid });
    const body = el("path", { fill: film }, g);
    const ring = el("path", { fill: "none", stroke: rim, strokeWidth: 5 }, g);
    const ring2 = el("path", { fill: "none", stroke: "#fff", strokeWidth: 2, opacity: 0.5 }, g);
    const hl = el("path", { fill: "#fff", opacity: 0.75 }, g);
    const hl2 = el("circle", { fill: "#fff", opacity: 0.6 }, g);
    const grad = svg.querySelector("#" + cid);
    o.draw = (t, { x = 0, y = 0, r: rr = r, wobble = 0.03, opacity = 1, hue = null, squash = 0 } = {}) => {
      const pts = [];
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * 2 * Math.PI;
        const k = 1 + wobble * (Math.sin(3 * a + t * 5.1 + seed) * 0.6 + Math.sin(2 * a - t * 3.7 + 2 * seed) * 0.4);
        pts.push([Math.cos(a) * rr * k * (1 + squash), Math.sin(a) * rr * k * (1 - squash)]);
      }
      const d = MK.smoothPath(pts, true);
      attr(body, { d }); attr(ring, { d, strokeWidth: Math.max(2, rr * 0.05) }); attr(ring2, { d });
      attr(hl, { d: `M${-rr * 0.62},${-rr * 0.2}Q${-rr * 0.6},${-rr * 0.62} ${-rr * 0.2},${-rr * 0.68}Q${-rr * 0.5},${-rr * 0.5} ${-rr * 0.62},${-rr * 0.2}Z` });
      attr(hl2, { cx: rr * 0.42, cy: rr * 0.45, r: rr * 0.06 });
      const h0 = hue === null ? t * 40 : hue;
      attr(grad, { gradientTransform: `rotate(${h0.toFixed(2)} 0.5 0.5)` });
      attr(o.g, { transform: MK.tf(x, y), opacity });
    };
    return o;
  };

  /** Relógio de parede/mesa. draw(t, {h, m}) ou {sec} para ponteiros girando. */
  MK.clock = function (parent, { r = 110, color = "#F2F4F7", rim = "#3A3F4B" } = {}) {
    const o = mk(parent), g = o.inner;
    el("circle", { r: r + 10, fill: rim }, g);
    el("circle", { r, fill: color }, g);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * 2 * Math.PI; el("rect", { x: -3, y: -r * 0.92, width: 6, height: r * (i % 3 ? 0.08 : 0.15), fill: rim, transform: `rotate(${(a * 180) / Math.PI})` }, g); }
    const hh = el("rect", { x: -6, y: -r * 0.5, width: 12, height: r * 0.55, rx: 6, fill: rim }, g);
    const mm = el("rect", { x: -4, y: -r * 0.78, width: 8, height: r * 0.83, rx: 4, fill: rim }, g);
    const ss = el("rect", { x: -1.5, y: -r * 0.85, width: 3, height: r * 0.95, fill: MK.C.RED }, g);
    el("circle", { r: 9, fill: rim }, g);
    o.draw = (t, { h = 10, m = 10, sec = null } = {}) => {
      const s = sec === null ? t : sec;
      attr(hh, { transform: `rotate(${(h % 12) * 30 + m * 0.5})` });
      attr(mm, { transform: `rotate(${m * 6 + s * 0.1})` });
      attr(ss, { transform: `rotate(${s * 6})` });
    };
    o.draw(0);
    return o;
  };

  /** Vela com chama viva: âncora no fundo. */
  MK.candle = function (parent, { w = 50, h = 180, color = "#F2EDE4", on = 1 } = {}) {
    const o = mk(parent), g = o.inner, svg = parent.ownerSVGElement;
    const glow = el("circle", { cy: -h - 40, r: 160, fill: MK.radial(svg, [[0, "#FFD27A", 0.55], [1, "#FFD27A", 0]]) }, g);
    el("rect", { x: -w / 2, y: -h, width: w, height: h, rx: 8, fill: color }, g);
    el("path", { d: `M0,${-h}v-18`, stroke: "#333", strokeWidth: 4 }, g);
    const fl = el("path", { fill: "#FFB13B" }, g), fl2 = el("path", { fill: "#FFF1C9" }, g);
    o.draw = (t, { on: v = on } = {}) => {
      const k = 1 + 0.08 * Math.sin(t * 13) + 0.05 * Math.sin(t * 21), sway = 4 * Math.sin(t * 3.1);
      attr(fl, { d: `M0,${-h - 14}C${-22 * k},${-h - 34} ${-8 + sway},${-h - 74 * k} ${sway},${-h - 84 * k}C${8 + sway},${-h - 74 * k} ${22 * k},${-h - 34} 0,${-h - 14}Z`, opacity: v });
      attr(fl2, { d: `M0,${-h - 18}C${-10},${-h - 32} ${sway * 0.5},${-h - 52 * k} ${sway * 0.6},${-h - 56 * k}C${4},${-h - 50 * k} ${10},${-h - 32} 0,${-h - 18}Z`, opacity: v });
      attr(glow, { opacity: v * (0.85 + 0.15 * Math.sin(t * 9)) });
    };
    o.draw(0);
    return o;
  };

  /** Cubo de gelo (de frente, com brilho): âncora no centro. */
  MK.iceCube = function (parent, { s = 110 } = {}) {
    const o = mk(parent), g = o.inner;
    el("rect", { x: -s / 2, y: -s / 2, width: s, height: s, rx: s * 0.18, fill: "#E6F7FF", stroke: "#A9DCFF", strokeWidth: 4, opacity: 0.92 }, g);
    el("path", { d: `M${-s * 0.3},${-s * 0.32}h${s * 0.4}`, stroke: "#fff", strokeWidth: s * 0.08, strokeLinecap: "round" }, g);
    el("path", { d: `M${-s * 0.32},${-s * 0.15}v${s * 0.35}`, stroke: "#fff", strokeWidth: s * 0.06, strokeLinecap: "round", opacity: 0.7 }, g);
    return o;
  };

  /** Panela no fogão com tampa: âncora no fundo. draw(t, {steam, lid (0–1 levantada), boil}). */
  MK.pot = function (parent, { w = 300, h = 170, color = "#8D95A3" } = {}) {
    const o = mk(parent), g = o.inner;
    el("rect", { x: -w * 0.62, y: -h * 0.42, width: w * 0.16, height: 18, rx: 9, fill: "#3A3F4B" }, g);
    el("rect", { x: w * 0.46, y: -h * 0.42, width: w * 0.16, height: 18, rx: 9, fill: "#3A3F4B" }, g);
    el("path", { d: `M${-w / 2},${-h}H${w / 2}V${-h * 0.1}Q${w / 2},0 ${w * 0.4},0H${-w * 0.4}Q${-w / 2},0 ${-w / 2},${-h * 0.1}Z`, fill: color }, g);
    el("rect", { x: -w / 2, y: -h, width: w * 0.18, height: h, fill: "#fff", opacity: 0.15 }, g);
    const lid = el("g", {}, g);
    el("path", { d: `M${-w * 0.54},${-h}Q0,${-h - 60} ${w * 0.54},${-h}Z`, fill: MK.shade(color, 0.1) }, lid);
    el("rect", { x: -24, y: -h - 52, width: 48, height: 18, rx: 9, fill: "#3A3F4B" }, lid);
    const st = [0, 1, 2].map(() => el("path", { fill: "none", stroke: "#fff", strokeWidth: 10, strokeLinecap: "round" }, g));
    o.draw = (t, { steam = 0, lid: lv = 0 } = {}) => {
      attr(lid, { transform: `translate(0 ${-lv * 50}) rotate(${lv * -12 + lv * 3 * Math.sin(t * 20)})` });
      st.forEach((p, i) => {
        const x = (i - 1) * w * 0.25, ph = t * 2 + i * 2.1;
        attr(p, { d: `M${x},${-h - 50}c${25 * Math.sin(ph)},-50 ${-25 * Math.sin(ph + 1)},-100 0,${-160 - 20 * Math.sin(ph)}`, opacity: steam * (0.25 + 0.2 * Math.sin(ph)) });
      });
    };
    o.draw(0);
    return o;
  };

  /** Laptop aberto (de frente): âncora na base. .screen é um <g> recortado na tela. */
  MK.laptop = function (parent, { w = 420, color = "#C9CED6", screen = "#1E2A44" } = {}) {
    const o = mk(parent), g = o.inner, h = w * 0.62, svg = parent.ownerSVGElement;
    el("rect", { x: -w / 2, y: -h - 16, width: w, height: h, rx: 14, fill: color }, g);
    el("rect", { x: -w / 2 + 16, y: -h, width: w - 32, height: h - 32, rx: 6, fill: screen }, g);
    el("path", { d: `M${-w * 0.6},-16H${w * 0.6}L${w * 0.55},0H${-w * 0.55}Z`, fill: MK.shade(color, -0.1) }, g);
    const cid = MK.uid("lp");
    el("rect", { x: -w / 2 + 16, y: -h, width: w - 32, height: h - 32, rx: 6 }, el("clipPath", { id: cid }, MK.defs(svg)));
    o.screen = el("g", { clipPath: `url(#${cid})` }, g);
    o.rect = [-w / 2 + 16, -h, w - 32, h - 32];
    return o;
  };

  /** Quadro (lousa) com moldura: .board é o <g> para escrever. */
  MK.board = function (parent, { w = 800, h = 480, color = "#24433A", frame = "#A8743F" } = {}) {
    const o = mk(parent), g = o.inner;
    el("rect", { x: -w / 2 - 18, y: -h / 2 - 18, width: w + 36, height: h + 36, rx: 10, fill: frame }, g);
    el("rect", { x: -w / 2, y: -h / 2, width: w, height: h, rx: 4, fill: color }, g);
    o.board = el("g", {}, g);
    return o;
  };

  MK.coin = function (parent, { r = 50, color = "#F5C94B", label = "1" } = {}) {
    const o = mk(parent), g = o.inner;
    el("circle", { r, fill: MK.shade(color, -0.15) }, g);
    el("circle", { r: r * 0.86, fill: color }, g);
    MK.text(g, label, { size: r, weight: 900, fill: MK.shade(color, -0.35) });
    return o;
  };

  MK.apple = function (parent, { r = 70, color = "#E5533D" } = {}) {
    const o = mk(parent), g = o.inner;
    el("path", { d: `M0,${-r * 0.75}C${-r * 0.4},${-r * 1.05} ${-r * 1.15},${-r * 0.9} ${-r * 1.0},${-r * 0.05}C${-r * 0.9},${r * 0.7} ${-r * 0.3},${r * 0.95} 0,${r * 0.75}C${r * 0.3},${r * 0.95} ${r * 0.9},${r * 0.7} ${r * 1.0},${-r * 0.05}C${r * 1.15},${-r * 0.9} ${r * 0.4},${-r * 1.05} 0,${-r * 0.75}Z`, fill: color }, g);
    el("path", { d: `M0,${-r * 0.72}q${-4},${-r * 0.3} ${4},${-r * 0.45}`, stroke: "#6B4A2E", strokeWidth: 7, fill: "none", strokeLinecap: "round" }, g);
    el("path", { d: `M${4},${-r * 1.0}q${r * 0.35},${-r * 0.25} ${r * 0.55},${-r * 0.05}q${-r * 0.3},${r * 0.2} ${-r * 0.55},${r * 0.05}Z`, fill: "#4FB286" }, g);
    el("ellipse", { cx: -r * 0.45, cy: -r * 0.3, rx: r * 0.14, ry: r * 0.24, fill: "#fff", opacity: 0.35 }, g);
    return o;
  };

  /** Carro de lado: âncora no chão, no meio. draw(t, {wheel: ângulo}). */
  MK.car = function (parent, { w = 460, color = "#3F6FD1", glass = "#BFE3FF" } = {}) {
    const o = mk(parent), g = o.inner, h = w * 0.36;
    el("path", { d: `M${-w / 2},${-h * 0.35}Q${-w / 2},${-h * 0.75} ${-w * 0.38},${-h * 0.78}L${-w * 0.22},${-h * 1.25}Q${-w * 0.17},${-h * 1.35} ${-w * 0.05},${-h * 1.35}H${w * 0.18}Q${w * 0.26},${-h * 1.35} ${w * 0.32},${-h * 1.2}L${w * 0.4},${-h * 0.8}Q${w / 2},${-h * 0.75} ${w / 2},${-h * 0.4}V${-h * 0.2}H${-w / 2}Z`, fill: color }, g);
    el("path", { d: `M${-w * 0.19},${-h * 0.82}L${-w * 0.1},${-h * 1.22}H${w * 0.04}V${-h * 0.82}ZM${w * 0.08},${-h * 0.82}V${-h * 1.22}H${w * 0.2}Q${w * 0.25},${-h * 1.22} ${w * 0.28},${-h * 1.1}L${w * 0.33},${-h * 0.82}Z`, fill: glass }, g);
    el("rect", { x: w * 0.44, y: -h * 0.62, width: w * 0.06, height: h * 0.14, rx: 4, fill: "#FFE08A" }, g);
    const wheels = [-0.3, 0.3].map((dx) => {
      const wg = el("g", { transform: `translate(${dx * w} ${-h * 0.2})` }, g);
      el("circle", { r: h * 0.3, fill: "#23252B" }, wg);
      el("circle", { r: h * 0.15, fill: "#C9CED6" }, wg);
      const sp = el("path", { d: `M${-h * 0.15},0H${h * 0.15}M0,${-h * 0.15}V${h * 0.15}`, stroke: "#8D95A3", strokeWidth: 5 }, wg);
      return sp;
    });
    o.draw = (t, { wheel = 0 } = {}) => wheels.forEach((s) => attr(s, { transform: `rotate(${wheel})` }));
    return o;
  };

  /** Pipa com rabo, presa por uma linha a `hand` (pontos no sistema do pai). draw(t, {x, y, hand}). */
  MK.kite = function (parent, { s = 120, color = "#E5533D", color2 = "#F5C94B" } = {}) {
    const o = mk(parent);
    const line = el("path", { fill: "none", stroke: "#fff", strokeWidth: 2.5, opacity: 0.8 }, parent);
    parent.insertBefore(line, o.g);
    const g = o.inner;
    el("path", { d: `M0,${-s}L${s * 0.7},0L0,${s * 1.3}L${-s * 0.7},0Z`, fill: color }, g);
    el("path", { d: `M0,${-s}L${s * 0.7},0L0,0Z M0,0L${-s * 0.7},0L0,${s * 1.3}Z`, fill: color2 }, g);
    const tail = el("path", { fill: "none", stroke: "#fff", strokeWidth: 4 }, g);
    o.draw = (t, { x = 0, y = 0, hand = null, rot = 0 } = {}) => {
      o.place(x, y, rot + 6 * Math.sin(t * 1.7));
      let d = `M0,${s * 1.3}`;
      for (let i = 1; i <= 6; i++) d += `L${18 * Math.sin(t * 3 + i)},${s * 1.3 + i * 40}`;
      attr(tail, { d });
      if (hand) attr(line, { d: `M${hand[0]},${hand[1]}Q${(hand[0] + x) / 2 + 60},${(hand[1] + y) / 2 + 80} ${x},${y + s * 0.2}` });
    };
    return o;
  };

  /** Termômetro com coluna que sobe: âncora no bulbo. draw(t, {level 0–1}). */
  MK.thermometer = function (parent, { h = 420, color = MK.C.RED, label = null } = {}) {
    const o = mk(parent), g = o.inner;
    el("rect", { x: -26, y: -h, width: 52, height: h, rx: 26, fill: "#F2F4F7", stroke: "#8D95A3", strokeWidth: 4 }, g);
    el("circle", { r: 46, fill: color, stroke: "#8D95A3", strokeWidth: 4 }, g);
    const col = el("rect", { x: -12, width: 24, rx: 12, fill: color }, g);
    for (let i = 1; i < 8; i++) el("rect", { x: 14, y: -h + (i * h) / 8, width: 18, height: 4, fill: "#8D95A3" }, g);
    o.draw = (t, { level = 0.5 } = {}) => attr(col, { y: -30 - (h - 60) * level, height: (h - 60) * level + 30 });
    o.draw(0);
    return o;
  };

  /** Lupa: âncora no centro da lente. */
  MK.magnifyingGlass = function (parent, { r = 90, color = "#3A3F4B" } = {}) {
    const o = mk(parent), g = o.inner;
    el("rect", { x: -14, y: r, width: 28, height: r * 1.3, rx: 12, fill: "#6B4A2E", transform: `rotate(-40)` }, g);
    el("circle", { r, fill: "#BFE6FF", opacity: 0.3 }, g);
    el("circle", { r, fill: "none", stroke: color, strokeWidth: 18 }, g);
    el("path", { d: `M${-r * 0.55},${-r * 0.2}Q${-r * 0.5},${-r * 0.55} ${-r * 0.15},${-r * 0.6}`, stroke: "#fff", strokeWidth: 8, fill: "none", strokeLinecap: "round", opacity: 0.7 }, g);
    return o;
  };

  /** Baralho / carta: âncora no centro. */
  MK.card = function (parent, { w = 160, h = 230, suit = "♥", rank = "A", back = false, color = null } = {}) {
    const o = mk(parent), g = o.inner;
    const red = suit === "♥" || suit === "♦";
    el("rect", { x: -w / 2, y: -h / 2, width: w, height: h, rx: 14, fill: back ? "#3F6FD1" : "#FBFBF8", stroke: "#C9CED6", strokeWidth: 3 }, g);
    if (back) el("rect", { x: -w / 2 + 14, y: -h / 2 + 14, width: w - 28, height: h - 28, rx: 8, fill: "none", stroke: "#fff", strokeWidth: 4, opacity: 0.6 }, g);
    else {
      const c = color || (red ? "#D8343C" : "#23252B");
      MK.text(g, rank, { x: -w * 0.3, y: -h * 0.33, size: w * 0.22, weight: 900, fill: c });
      MK.text(g, suit, { x: 0, y: h * 0.04, size: w * 0.5, weight: 400, fill: c });
    }
    return o;
  };
})();
