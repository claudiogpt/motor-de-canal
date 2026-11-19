/* fx.js — Efeitos gráficos, rótulos, setas, medidas e diagramas. */
(function () {
  const MK = window.MK;
  const { el, attr } = MK;
  const FX = (MK.fx = {});

  /** Anel que cresce e some: {x, y, t0, dur, r0, r1, color, width}. */
  FX.ring = function (parent, { x = 0, y = 0, t0 = 0, dur = 0.7, r0 = 10, r1 = 260, color = MK.C.ACCENT, width = 8 } = {}) {
    const c = el("circle", { cx: x, cy: y, fill: "none", stroke: color, strokeWidth: width, opacity: 0 }, parent);
    return { el: c, draw(t, o = {}) {
      const u = (t - (o.t0 ?? t0)) / dur;
      if (u < 0 || u > 1) return attr(c, { opacity: 0 });
      const e = MK.ease.out(u);
      attr(c, { cx: o.x ?? x, cy: o.y ?? y, r: r0 + (r1 - r0) * e, opacity: 1 - u, strokeWidth: width * (1 - 0.6 * u) });
    } };
  };

  /** Explosão de partículas com semente: {x, y, t0, dur, n, dist, size, colors, seed, spread, angle, gravity}. */
  FX.burst = function (parent, { x = 0, y = 0, t0 = 0, dur = 0.9, n = 18, dist = 220, size = 10, colors = [MK.C.ACCENT], seed = 1,
                                 spread = 2 * Math.PI, angle = -Math.PI / 2, gravity = 0, shape = "circle" } = {}) {
    const r = MK.rand(seed), g = el("g", {}, parent), ps = [];
    for (let i = 0; i < n; i++) {
      const a = angle - spread / 2 + spread * (spread >= 6.28 ? i / n : r()) + (r() - 0.5) * 0.3;
      const p = shape === "star" ? el("path", { d: starPath(size), fill: colors[i % colors.length] }, g)
                                 : el("circle", { r: size * (0.6 + 0.6 * r()), fill: colors[i % colors.length] }, g);
      ps.push({ p, a, d: dist * (0.55 + 0.6 * r()), s: 0.7 + 0.6 * r() });
    }
    return { g, draw(t, o = {}) {
      const u = (t - (o.t0 ?? t0)) / dur, X = o.x ?? x, Y = o.y ?? y;
      if (u < 0 || u > 1) return attr(g, { opacity: 0 });
      attr(g, { opacity: 1 });
      const e = MK.ease.expoOut(u);
      for (const q of ps) {
        const px = X + Math.cos(q.a) * q.d * e, py = Y + Math.sin(q.a) * q.d * e + gravity * u * u;
        attr(q.p, { transform: MK.tf(px, py, 0, q.s * (1 - u * 0.85)), opacity: 1 - u * u });
        if (q.p.tagName === "circle") attr(q.p, { cx: 0, cy: 0 });
      }
    } };
  };
  function starPath(s) {
    const pts = [];
    for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4, rr = i % 2 ? s * 0.35 : s; pts.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
    return "M" + pts.map((p) => p.map((v) => v.toFixed(1)).join(",")).join("L") + "Z";
  }

  /** Brilhos que piscam em volta de um ponto (vida em algo "mágico"): {x, y, r, n, t0, t1, color, seed}. */
  FX.sparkles = function (parent, { x = 0, y = 0, r = 150, n = 6, t0 = 0, t1 = 1e9, color = "#FFFFFF", seed = 3, size = 18 } = {}) {
    const rnd = MK.rand(seed), g = el("g", {}, parent), ps = [];
    for (let i = 0; i < n; i++) ps.push({ p: el("path", { d: starPath(size), fill: color }, g), a: rnd() * 6.28, d: r * (0.4 + 0.6 * rnd()), ph: rnd() * 3, per: 0.9 + 0.8 * rnd() });
    return { g, draw(t, o = {}) {
      const vis = MK.window(t, o.t0 ?? t0, o.t1 ?? t1, 0.2, 0.2), X = o.x ?? x, Y = o.y ?? y;
      for (const q of ps) {
        const k = Math.max(0, Math.sin(((t + q.ph) / q.per) * Math.PI * 2));
        attr(q.p, { transform: MK.tf(X + Math.cos(q.a) * q.d, Y + Math.sin(q.a) * q.d, t * 40, k), opacity: vis * k });
      }
    } };
  };

  /** Clarão de raios que passam (o "Flash" do Manim): {x, y, t0, dur, n, r0, len, color, width}. */
  FX.flash = function (parent, { x = 0, y = 0, t0 = 0, dur = 0.5, n = 12, r0 = 40, len = 90, color = MK.C.ACCENT, width = 7 } = {}) {
    const g = el("g", {}, parent), rays = [];
    for (let i = 0; i < n; i++) rays.push(el("line", { stroke: color, strokeWidth: width, strokeLinecap: "round" }, g));
    return { g, draw(t, o = {}) {
      const u = (t - (o.t0 ?? t0)) / dur, X = o.x ?? x, Y = o.y ?? y;
      if (u < 0 || u > 1) return attr(g, { opacity: 0 });
      attr(g, { opacity: 1 });
      const e = MK.ease.out(u);
      rays.forEach((ln, i) => {
        const a = (i / n) * 2 * Math.PI, a0 = r0 + len * Math.max(0, e * 1.6 - 0.6), a1 = r0 + len * Math.min(1, e * 1.6);
        attr(ln, { x1: X + Math.cos(a) * a0, y1: Y + Math.sin(a) * a0, x2: X + Math.cos(a) * a1, y2: Y + Math.sin(a) * a1, opacity: a1 - a0 > 1 ? 1 : 0 });
      });
    } };
  };

  /** Contador num <text> SVG: {from, to, t0, dur, digits, prefix, suffix, ease}. */
  FX.counter = function (textEl, { from = 0, to = 100, t0 = 0, dur = 1.2, digits = 0, prefix = "", suffix = "", ease = "out", sep = true } = {}) {
    return { draw(t) { const v = from + (to - from) * MK.E(ease)((t - t0) / dur); attr(textEl, { text: prefix + MK.fmt(v, digits, sep) + suffix }); } };
  };

  /** Seta que se desenha de `from` até `to` (curva por `bend`, fração do comprimento): {t0, dur, color, width, head}. */
  FX.arrow = function (parent, { from = [0, 0], to = [100, 0], bend = 0.2, t0 = 0, dur = 0.5, t1 = 1e9, color = MK.C.ACCENT, width = 10, head = 34, dash = null } = {}) {
    const g = el("g", {}, parent);
    const path = el("path", { fill: "none", stroke: color, strokeWidth: width, strokeLinecap: "round", strokeDasharray: dash || undefined }, g);
    const hd = el("path", { fill: color }, g);
    return { g, draw(t, o = {}) {
      const A = o.from || from, B = o.to || to;
      const mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2, dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy);
      const C = [mx - dy * bend, my + dx * bend];
      const T0 = o.t0 ?? t0, T1 = o.t1 ?? t1;
      const u = MK.ease.inOut((t - T0) / dur), vis = 1 - MK.ramp(t, T1, 0.25);
      if (u <= 0 || vis <= 0) return attr(g, { opacity: 0 });
      attr(g, { opacity: vis });
      const N = 24, pts = [];
      for (let i = 0; i <= N; i++) pts.push(MK.quad(A, C, B, (i / N) * u * (1 - (head * 0.6) / Math.max(L, 1))));
      attr(path, { d: "M" + pts.map((p) => p.map((v) => v.toFixed(1)).join(",")).join("L") });
      const tip = MK.quad(A, C, B, u), back = MK.quad(A, C, B, Math.max(0, u - 0.02));
      const ang = Math.atan2(tip[1] - back[1], tip[0] - back[0]);
      const hx = (a, r) => [tip[0] + Math.cos(ang + a) * r, tip[1] + Math.sin(ang + a) * r];
      const p1 = hx(Math.PI - 0.45, head), p2 = hx(Math.PI + 0.45, head);
      attr(hd, { d: `M${tip[0].toFixed(1)},${tip[1].toFixed(1)}L${p1[0].toFixed(1)},${p1[1].toFixed(1)}L${p2[0].toFixed(1)},${p2[1].toFixed(1)}Z` });
    } };
  };

  /** Etiqueta (pílula com texto) com linha até `anchor`: {x, y, text, t0, t1, color, size, anchor, bg, mono}. */
  FX.label = function (parent, { x = 0, y = 0, text = "", t0 = 0, t1 = 1e9, color = MK.C.INK, size = 52, anchor = null, bg = "rgba(10,15,28,0.82)",
                                 border = null, weight = 800, mono = false, pop = true } = {}) {
    const g = el("g", { opacity: 0, "data-mk-role": "label" }, parent);   // invisível até o primeiro draw
    const line = el("path", { fill: "none", stroke: border || color, strokeWidth: 4, strokeLinecap: "round" }, g);
    const dot = el("circle", { r: 9, fill: border || color }, g);
    const box = el("g", {}, g);
    const font = `${weight} ${size}px ${mono ? MK.MONO : MK.FONT}`;
    const m = MK.ink(text, font), padX = size * 0.45, padY = size * 0.32, w = m.w + 2 * padX, h = size * 1.05 + 2 * padY * 0.6;
    const rect = el("rect", { x: -w / 2, y: -h / 2, width: w, height: h, rx: h / 2, fill: bg, stroke: border || "none", strokeWidth: border ? 4 : 0 }, box);
    const tx = MK.text(box, text, { size, weight, fill: color, mono, y: size * 0.04 });
    return { g, text: tx, rect, w, h, t0, t1, draw(t, o = {}) {
      const vis = MK.window(t, o.t0 ?? t0, o.t1 ?? t1, 0.3, 0.2);
      if (vis <= 0.001) return attr(g, { opacity: 0 });
      const X = o.x ?? x, Y = o.y ?? y, A = o.anchor || anchor;
      const s = pop ? 0.6 + 0.4 * MK.ease.backOut(MK.invlerp(o.t0 ?? t0, (o.t0 ?? t0) + 0.35, t)) : 1;
      attr(g, { opacity: Math.min(1, vis * 1.2) });
      attr(box, { transform: MK.tf(X, Y, 0, s) });
      if (A) {
        const u = MK.ease.out(MK.invlerp(o.t0 ?? t0, (o.t0 ?? t0) + 0.35, t));
        attr(line, { d: `M${X},${Y}L${X + (A[0] - X) * u},${Y + (A[1] - Y) * u}` });
        attr(dot, { cx: A[0], cy: A[1], opacity: u });
      } else { attr(line, { d: "" }); attr(dot, { opacity: 0 }); }
      if (o.text !== undefined) attr(tx, { text: o.text });
    } };
  };

  /** Balão de fala ou de pensamento perto de uma cabeça: {x, y, text, t0, t1, tail: [x, y], think, size, w}. */
  FX.speech = function (parent, { x = 0, y = 0, text = "", t0 = 0, t1 = 1e9, tail = null, think = false, size = 54, maxW = 620, color = "#23252B", bg = "#FFFFFF" } = {}) {
    const g = el("g", { "data-mk-role": "label" }, parent);
    const words = text.split(" "), font = `800 ${size}px ${MK.FONT}`, lines = [];
    let cur = "";
    for (const w of words) { const nx = cur ? cur + " " + w : w; if (MK.ink(nx, font).w > maxW && cur) { lines.push(cur); cur = w; } else cur = nx; }
    if (cur) lines.push(cur);
    const W = Math.max(...lines.map((l) => MK.ink(l, font).w)) + size * 1.1, H = lines.length * size * 1.2 + size * 0.8;
    const tailP = el("path", { fill: bg }, g), dots = think ? [el("circle", { fill: bg }, g), el("circle", { fill: bg }, g)] : [];
    const body = think ? el("path", { fill: bg, d: cloudPath(W, H) }, g) : el("rect", { x: -W / 2, y: -H / 2, width: W, height: H, rx: Math.min(44, H / 2), fill: bg }, g);
    const txt = el("g", {}, g);
    lines.forEach((l, i) => MK.text(txt, l, { y: (i - (lines.length - 1) / 2) * size * 1.2 + size * 0.04, size, fill: color, weight: 800 }));
    return { g, draw(t, o = {}) {
      const T0 = o.t0 ?? t0, vis = MK.window(t, T0, o.t1 ?? t1, 0.25, 0.2);
      if (vis <= 0.001) return attr(g, { opacity: 0 });
      const X = o.x ?? x, Y = o.y ?? y, s = MK.ease.backOut(MK.invlerp(T0, T0 + 0.35, t));
      attr(g, { opacity: Math.min(1, vis * 1.5) });
      attr(body, { transform: MK.tf(X, Y, 0, 0.5 + 0.5 * s) }); attr(txt, { transform: MK.tf(X, Y, 0, 0.5 + 0.5 * s) });
      const T = o.tail || tail;
      if (T && !think) attr(tailP, { d: `M${X - 28},${Y + H / 2 - 6}L${T[0]},${T[1]}L${X + 28},${Y + H / 2 - 6}Z` });
      if (T && think) {
        attr(dots[0], { cx: X + (T[0] - X) * 0.55, cy: Y + H / 2 + (T[1] - Y - H / 2) * 0.45, r: 20 });
        attr(dots[1], { cx: X + (T[0] - X) * 0.85, cy: Y + H / 2 + (T[1] - Y - H / 2) * 0.82, r: 12 });
      }
    } };
  };
  function cloudPath(W, H) {
    const pts = [];
    for (let i = 0; i < 14; i++) { const a = (i / 14) * 2 * Math.PI, k = i % 2 ? 1.08 : 0.96; pts.push([Math.cos(a) * W * 0.56 * k, Math.sin(a) * H * 0.62 * k]); }
    return MK.smoothPath(pts, true);
  }

  /** Emote sobre a cabeça: kind "!" | "?" | "heart" | "idea" | "sweat" | "zzz" | "music" | "anger" (a veia de quadrinho,
      que pulsa) | "steam" (duas nuvens de fumaça subindo). {x, y, t0, t1, color, size}. Vai AO LADO da cabeça.
      draw(t, {x, y, vis}): vis multiplica a opacidade; com vis: MK.layout.onScreen(S, cam, t, j.head) o emote some
      quando a cabeça sai do quadro (senão a gota de suor fica solta no meio de outra coisa). */
  FX.emote = function (parent, { kind = "!", x = 0, y = 0, t0 = 0, t1 = 1e9, color = null, size = 90 } = {}) {
    const g = el("g", { "data-mk-role": "emote" }, parent), svg = parent.ownerSVGElement;
    const c = color || { "!": MK.C.RED, "?": MK.C.INFO, heart: "#FF5D8F", idea: MK.C.ACCENT, sweat: "#7CC4F2", zzz: MK.C.INK, music: MK.C.ACCENT, anger: "#E0352B", steam: "#F2EEE8" }[kind] || MK.C.ACCENT;
    const inner = el("g", {}, g);
    if (kind === "!" || kind === "?") MK.text(inner, kind, { size: size * 1.2, weight: 900, fill: c, stroke: MK.C.INK, strokeWidth: size * 0.12 });
    if (kind === "heart") el("path", { d: `M0,${size * 0.45}C${-size},${-size * 0.1} ${-size * 0.45},${-size * 0.85} 0,${-size * 0.3}C${size * 0.45},${-size * 0.85} ${size},${-size * 0.1} 0,${size * 0.45}Z`, fill: c }, inner);
    if (kind === "idea") {
      el("circle", { r: size * 0.9, fill: MK.radial(svg, [[0, c, 0.5], [1, c, 0]]) }, inner);
      el("path", { d: `M0,${-size * 0.55}a${size * 0.4},${size * 0.4} 0 0,1 ${size * 0.28},${size * 0.7}v${size * 0.15}h${-size * 0.56}v${-size * 0.15}a${size * 0.4},${size * 0.4} 0 0,1 ${size * 0.28},${-size * 0.7}Z`, fill: c }, inner);
      el("rect", { x: -size * 0.2, y: size * 0.36, width: size * 0.4, height: size * 0.16, rx: 4, fill: "#8D95A3" }, inner);
    }
    if (kind === "sweat") el("path", { d: `M0,${-size * 0.4}C${size * 0.3},0 ${size * 0.3},${size * 0.35} 0,${size * 0.35}C${-size * 0.3},${size * 0.35} ${-size * 0.3},0 0,${-size * 0.4}Z`, fill: c }, inner);
    if (kind === "zzz") MK.text(inner, "z z z", { size: size * 0.6, weight: 900, fill: c });
    if (kind === "music") MK.text(inner, "♪", { size: size * 1.1, weight: 700, fill: c });
    let pulse = null, puffs = null;
    if (kind === "anger") {                          // quatro colchetes curvos virados para o centro (a "veia")
      pulse = el("g", {}, inner);
      const q = size * 0.5, k = size * 0.16;
      for (let i = 0; i < 4; i++) {
        const a = i * 90 + 45;
        el("path", { d: `M${-q * 0.62},${-k}Q${-k * 0.9},${-k * 0.9} ${-k},${-q * 0.62}`, fill: "none", stroke: c, strokeWidth: size * 0.15, strokeLinecap: "round", transform: `rotate(${a})` }, pulse);
      }
    }
    if (kind === "steam") {
      puffs = [0, 1, 2].map((i) => el("path", { d: cloudPath(size * 0.7, size * 0.5), fill: c, stroke: "#B8B0A8", strokeWidth: size * 0.04 }, inner));
    }
    return { g, draw(t, o = {}) {
      const T0 = o.t0 ?? t0, vis = MK.window(t, T0, o.t1 ?? t1, 0.15, 0.2) * (o.vis ?? 1);   // vis: MK.layout.onScreen (some sem a cabeça no quadro)
      if (vis <= 0.001) return attr(g, { opacity: 0 });
      const s = MK.ease.spring(MK.clamp((t - T0) / 0.5), 0.45, 2.2), X = o.x ?? x, Y = o.y ?? y;
      attr(g, { opacity: vis });
      attr(inner, { transform: MK.tf(X, Y - 20 * MK.ramp(t, T0, 0.4) + 4 * Math.sin(t * 4), 6 * Math.sin(t * 3), s) });
      if (pulse) attr(pulse, { transform: `scale(${(1 + 0.16 * Math.max(0, Math.sin((t - T0) * 9))).toFixed(3)})` });
      if (puffs) puffs.forEach((pf, i) => { const u = ((t - T0) * 1.1 + i / 3) % 1; attr(pf, { opacity: (1 - u) * 0.9, transform: `translate(${(i - 1) * size * 0.35 + 8 * Math.sin(t * 5 + i)} ${-u * size * 1.4}) scale(${(0.5 + 0.7 * u).toFixed(3)})` }); });
    } };
  };

  /** Linhas de movimento atrás de algo que corre/cai: {n, len, color, width, seed}. draw(t, {x, y, dir (rad), vis}). */
  FX.speedLines = function (parent, { n = 6, len = 160, color = "#FFFFFF", width = 6, seed = 4, spread = 120 } = {}) {
    const r = MK.rand(seed), g = el("g", {}, parent), ls = [];
    for (let i = 0; i < n; i++) ls.push({ p: el("path", { stroke: color, strokeWidth: width, strokeLinecap: "round", fill: "none" }, g), off: (r() - 0.5) * spread, k: 0.5 + r(), ph: r() });
    return { g, draw(t, { x = 0, y = 0, dir = 0, vis = 1 } = {}) {
      attr(g, { opacity: vis });
      const c = Math.cos(dir), s = Math.sin(dir);
      for (const l of ls) {
        const u = (t * 3 + l.ph) % 1, back = 40 + u * len * 0.8, L = len * l.k * (1 - u * 0.5);
        const ax = x - c * back - s * l.off, ay = y - s * back + c * l.off;
        attr(l.p, { d: `M${ax},${ay}L${ax - c * L},${ay - s * L}`, opacity: 1 - u });
      }
    } };
  };

  /** Lupa / inserto: círculo com borda que mostra outro mundo dentro (o microscópico), ligado ao ponto de origem.
      {x, y, r, from: [x, y], t0, t1, border, bg}. Desenhe o conteúdo em .content (coordenadas locais, centro 0,0). */
  FX.inset = function (parent, { x = 540, y = 700, r = 300, from = null, t0 = 0, t1 = 1e9, border = "#FFFFFF", bg = MK.C.INK, width = 12 } = {}) {
    const svg = parent.ownerSVGElement, g = el("g", {}, parent), cid = MK.uid("ins");
    const cp = el("clipPath", { id: cid }, MK.defs(svg));
    const cc = el("circle", { cx: 0, cy: 0, r }, cp);
    const cone = el("path", { fill: border, opacity: 0.18 }, g);
    const holder = el("g", {}, g);
    const shadow = el("circle", { r: r + 6, fill: "#000", opacity: 0.25, cy: 14 }, holder);
    const clipped = el("g", { clipPath: `url(#${cid})` }, holder);
    el("circle", { r, fill: bg }, clipped);
    const content = el("g", {}, clipped);
    const ring = el("circle", { r, fill: "none", stroke: border, strokeWidth: width }, holder);
    const src = el("circle", { r: 16, fill: "none", stroke: border, strokeWidth: 5 }, g);
    return { g, content, draw(t, o = {}) {
      const T0 = o.t0 ?? t0, T1 = o.t1 ?? t1, X = o.x ?? x, Y = o.y ?? y, F = o.from || from;
      const open = MK.ease.backOut(MK.invlerp(T0, T0 + 0.5, t), 1.2), close = MK.ease.in(MK.invlerp(T1 - 0.35, T1, t));
      const k = Math.max(0, open * (1 - close));
      if (k <= 0.001) return attr(g, { opacity: 0 });
      attr(g, { opacity: 1 });
      let cx = X, cy = Y;
      if (F) { cx = F[0] + (X - F[0]) * MK.ease.out(MK.invlerp(T0, T0 + 0.5, t)); cy = F[1] + (Y - F[1]) * MK.ease.out(MK.invlerp(T0, T0 + 0.5, t)); }
      attr(holder, { transform: MK.tf(cx, cy, 0, k) });
      if (F) {
        const R = r * k, a = Math.atan2(cy - F[1], cx - F[0]), w = Math.asin(Math.min(1, R / Math.max(R + 1, Math.hypot(cx - F[0], cy - F[1]))));
        const p1 = [cx + Math.cos(a + Math.PI / 2 + w * 0.0) * R, cy + Math.sin(a + Math.PI / 2) * R], p2 = [cx + Math.cos(a - Math.PI / 2) * R, cy + Math.sin(a - Math.PI / 2) * R];
        attr(cone, { d: `M${F[0]},${F[1]}L${p1[0]},${p1[1]}L${p2[0]},${p2[1]}Z`, opacity: 0.16 * k });
        attr(src, { cx: F[0], cy: F[1], opacity: k });
      } else { attr(cone, { d: "" }); attr(src, { opacity: 0 }); }
    } };
  };

  /** Régua de medida entre dois pontos com rótulo: {a, b, text, t0, t1, color, off (afastamento)}. */
  FX.measure = function (parent, { a = [0, 0], b = [100, 0], text = "", t0 = 0, t1 = 1e9, color = MK.C.ACCENT, off = 40, size = 46 } = {}) {
    const g = el("g", {}, parent);
    const ln = el("path", { fill: "none", stroke: color, strokeWidth: 5, strokeLinecap: "round" }, g);
    const tx = MK.text(g, text, { size, fill: color, weight: 800, stroke: MK.C.INK, strokeWidth: 10 });
    return { g, draw(t, o = {}) {
      const A = o.a || a, B = o.b || b, vis = MK.window(t, o.t0 ?? t0, o.t1 ?? t1, 0.35, 0.2);
      if (vis <= 0.001) return attr(g, { opacity: 0 });
      attr(g, { opacity: vis });
      const dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L * off, ny = dx / L * off;
      const u = MK.ease.out(MK.invlerp(o.t0 ?? t0, (o.t0 ?? t0) + 0.4, t));
      const P = [A[0] + nx, A[1] + ny], Q = [A[0] + nx + dx * u, A[1] + ny + dy * u];
      const tk = 16;
      attr(ln, { d: `M${A[0] + nx - (nx / off) * tk},${A[1] + ny - (ny / off) * tk}L${A[0] + nx + (nx / off) * tk},${A[1] + ny + (ny / off) * tk}M${P[0]},${P[1]}L${Q[0]},${Q[1]}M${Q[0] - (nx / off) * tk},${Q[1] - (ny / off) * tk}L${Q[0] + (nx / off) * tk},${Q[1] + (ny / off) * tk}` });
      attr(tx, { x: A[0] + nx * 2.2 + dx / 2, y: A[1] + ny * 2.2 + dy / 2, opacity: u, text: o.text ?? text });
    } };
  };

  /** Trilha pontilhada que se desenha por uma lista de pontos: {pts, t0, dur, color, width, dash, t1}. */
  FX.trail = function (parent, { pts = [], t0 = 0, dur = 1, color = "#FFFFFF", width = 6, dash = "2 18", t1 = 1e9 } = {}) {
    const svg = parent.ownerSVGElement, id = MK.uid("tm"), d = MK.smoothPath(pts);
    const m = el("mask", { id, maskUnits: "userSpaceOnUse", x: -20000, y: -20000, width: 40000, height: 40000 }, MK.defs(svg));
    const mp = el("path", { d, fill: "none", stroke: "#fff", strokeWidth: width * 3, strokeLinecap: "round" }, m);
    const p = el("path", { d, fill: "none", stroke: color, strokeWidth: width, strokeLinecap: "round", strokeDasharray: dash, mask: `url(#${id})` }, parent);
    const L = mp.getTotalLength();
    return { el: p, draw(t) {
      const u = MK.ease.inOut((t - t0) / dur), vis = 1 - MK.ramp(t, t1, 0.3);
      attr(p, { opacity: u > 0 ? vis : 0 });
      attr(mp, { strokeDasharray: `${L.toFixed(1)} ${L.toFixed(1)}`, strokeDashoffset: L * (1 - u) });
    } };
  };

  /** Ponto que brilha (estrela, elétron, luz): {r, color, halo}. draw(t, {x, y, r, opacity}). */
  FX.glowDot = function (parent, { r = 14, color = MK.C.INFO, halo = 4 } = {}) {
    const svg = parent.ownerSVGElement, g = el("g", {}, parent);
    const h = el("circle", { r: r * halo, fill: MK.radial(svg, [[0, color, 0.6], [0.4, color, 0.2], [1, color, 0]]) }, g);
    const c = el("circle", { r, fill: MK.mixColor(color, "#FFFFFF", 0.55) }, g);
    return { g, draw(t, { x = 0, y = 0, r: rr = r, opacity = 1 } = {}) { attr(g, { transform: MK.tf(x, y, 0, rr / r), opacity }); } };
  };

  /** Traço riscado na areia (sulco escuro + borda clara), desenhado progressivamente: draw(u, {opacity}). */
  MK.groove = function (parent, pts, { width = 9, closed = false, color = "#5A4632", smooth = 0 } = {}) {
    const g = el("g", {}, parent);
    const d = smooth ? MK.smoothPath(pts, closed, smooth) : `M${pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join("L")}${closed ? "Z" : ""}`;
    const lite = el("path", { d, fill: "none", stroke: "#FFF3D6", strokeWidth: width * 0.7, strokeLinecap: "round", strokeLinejoin: "round", transform: "translate(2.5 3)", opacity: 0.85 }, g);
    const dark = el("path", { d, fill: "none", stroke: color, strokeWidth: width, strokeLinecap: "round", strokeLinejoin: "round", opacity: 0.85 }, g);
    const len = Math.max(1, dark.getTotalLength());
    for (const e of [dark, lite]) attr(e, { strokeDasharray: `${len} ${len}`, strokeDashoffset: len });
    return { g, len, dark,
      /** Ponta do risco em u (sistema do pai): onde o graveto/giz tem que estar enquanto o risco cresce. */
      tip(u) { const p = dark.getPointAtLength(len * MK.clamp(u)); return [p.x, p.y]; },
      draw(u, { opacity = 1, color: c } = {}) {
      for (const e of [dark, lite]) attr(e, { strokeDashoffset: len * (1 - MK.clamp(u)) });
      attr(g, { opacity });
      if (c) attr(dark, { stroke: c });
    } };
  };

  /** Texto grande (SVG) com sombra suave, para números e palavras-chave de tela. Devolve o <text>. */
  MK.bigNum = function (parent, str, { x = 0, y = 0, size = 120, fill = MK.C.ACCENT, weight = 900, mono = true, stroke = "#2A1E10", sw = 10, hand = false } = {}) {
    const g = el("g", {}, parent);
    const sh = MK.text(g, str, { x: x + 4, y: y + 6, size, weight, fill: "#000", mono, hand, opacity: 0.25 });
    const tx = MK.text(g, str, { x, y, size, weight, fill, mono, hand, stroke, strokeWidth: sw });
    tx.style.paintOrder = "stroke";
    return { g, el: tx, set(s) { tx.textContent = s; sh.textContent = s; } };
  };
})();
