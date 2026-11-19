/* core.js — utilitários de tempo, interpolação, SVG, cores e texto. */
(function () {
  const MK = (window.MK = window.MK || {});
  // Defaults neutros e substituíveis; nenhuma cor tem significado editorial.
  MK.C = { BG: "#FAFAFA", INK: "#18181B", DIM: "#71717A", PANEL: "#F4F4F5",
           ACCENT: "#7C3AED", INFO: "#0284C7", RED: "#DC2626", WHITE: "#FFFFFF", BLACK: "#000000" };
  // ── números e easing ────────────────────────────────────────────────────────────────────────────────────────
  const clamp = (MK.clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)));
  MK.clip01 = (x) => clamp(x);
  MK.lerp = (a, b, u) => a + (b - a) * u;
  MK.invlerp = (a, b, x) => clamp((x - a) / (b - a));
  MK.remap = (x, a0, a1, b0, b1) => b0 + (b1 - b0) * MK.invlerp(a0, a1, x);
  MK.deg = Math.PI / 180;
  const sig = (x) => 1 / (1 + Math.exp(-x)), ERR = sig(-5);
  MK.ease = {
    linear: (x) => clamp(x),
    smooth: (x) => clamp((sig(10 * (clamp(x) - 0.5)) - ERR) / (1 - 2 * ERR)),     // o smooth do Manim
    inOut: (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; },   // cubic
    sine: (x) => -(Math.cos(Math.PI * clamp(x)) - 1) / 2,
    out: (x) => 1 - Math.pow(1 - clamp(x), 3),                                   // cubic out
    in: (x) => Math.pow(clamp(x), 3),
    quadOut: (x) => 1 - (1 - clamp(x)) ** 2,
    quadIn: (x) => clamp(x) ** 2,
    expoOut: (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(x))),
    expoIn: (x) => (x <= 0 ? 0 : Math.pow(2, 10 * clamp(x) - 10)),
    expoInOut: (x) => { x = clamp(x); return x === 0 ? 0 : x === 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2; },
    backOut: (x, s = 1.70158) => { x = clamp(x); if (x <= 0) return 0; x -= 1; return 1 + (s + 1) * x * x * x + s * x * x; },   // 0 exato antes do início (era ~2e-16, e "> 0" dava verdadeiro)
    backIn: (x, s = 1.70158) => { x = clamp(x); return (s + 1) * x * x * x - s * x * x; },
    // mola fechada: zeta 1 não passa do alvo, 0,7–0,85 "premium", 0,4–0,6 brincalhona; f = oscilações por unidade
    spring: (x, zeta = 0.55, f = 2.2) => {
      x = Math.max(0, x);
      if (x >= 3) return 1;
      const w = 2 * Math.PI * f, wd = w * Math.sqrt(Math.max(1e-6, 1 - zeta * zeta));
      return 1 - Math.exp(-zeta * w * x) * (Math.cos(wd * x) + ((zeta * w) / wd) * Math.sin(wd * x));
    },
    elasticOut: (x) => { x = clamp(x); return x === 0 || x === 1 ? x : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1; },
  };
  MK.E = (e) => (typeof e === "function" ? e : MK.ease[e || "inOut"]);
  MK.smooth = MK.ease.smooth;

  /** 0→1 entre t0 e t0+dur, com easing (nome ou função). */
  MK.ramp = (t, t0, dur, ease = "inOut") => (dur <= 0 ? (t >= t0 ? 1 : 0) : MK.E(ease)((t - t0) / dur));
  /** 1 dentro de [t0, t1], subindo em `fin` e descendo em `fout` (para opacidades: entra, fica, sai). */
  MK.window = (t, t0, t1, fin = 0.3, fout = 0.25, ease = "inOut") =>
    Math.min(MK.ramp(t, t0, fin, ease), 1 - MK.ramp(t, t1 - fout, fout, ease));
  /** Pulso 0→1→0 centrado em tc (largura total w). */
  MK.pulse = (t, tc, w = 0.4) => { const u = Math.abs(t - tc) / (w / 2); return u >= 1 ? 0 : 0.5 + 0.5 * Math.cos(Math.PI * u); };

  /** Mistura números, listas, objetos e cores "#rrggbb"; texto troca no meio. */
  MK.mix = function mix(a, b, u) {
    if (typeof a === "number" && typeof b === "number") return a + (b - a) * u;
    if (typeof a === "string" && typeof b === "string") {
      if (a[0] === "#" && b[0] === "#" && a.length === 7 && b.length === 7) return MK.mixColor(a, b, u);
      return u < 0.5 ? a : b;
    }
    if (Array.isArray(a) && Array.isArray(b)) return a.map((v, i) => (i < b.length ? mix(v, b[i], u) : v));
    if (a && b && typeof a === "object" && typeof b === "object") {
      const o = { ...a };
      for (const k in b) o[k] = k in a ? mix(a[k], b[k], u) : b[k];
      return o;
    }
    return u < 0.5 ? a : b;
  };

  /** Chaves no relógio absoluto: [[t, valor], [t, valor, easing], ...]. Antes da 1ª e depois da última, segura.
      O easing de uma chave vale para o trecho que CHEGA nela. Valores: número, lista, objeto, cor ou texto. */
  MK.keys = function (t, ks) {
    if (!ks.length) return undefined;
    if (t <= ks[0][0]) return ks[0][1];
    for (let i = 1; i < ks.length; i++) {
      const [t1, v1, e] = ks[i];
      if (t < t1) {
        const [t0, v0] = ks[i - 1];
        return MK.mix(v0, v1, MK.E(e)((t - t0) / Math.max(1e-6, t1 - t0)));
      }
    }
    return ks[ks.length - 1][1];
  };
  /** Sequência de movimentos [t, valor, dur, easing]: cada um parte do valor atual em t e chega ao alvo em dur.
      Bom para câmera e poses: não é preciso repetir o estado de saída. */
  MK.moves = function (t, start, mv) {
    let v = start;
    for (const [t0, target, dur = 0.8, e] of mv) {
      if (t <= t0) break;
      v = MK.mix(v, target, dur <= 0 ? 1 : MK.E(e)((t - t0) / dur));
    }
    return v;
  };

  // ── aleatório e ruído com semente ───────────────────────────────────────────────────────────────────────────
  MK.rand = function (seed) {
    let a = (seed * 2654435761) >>> 0 || 1;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  MK.mulberry32 = MK.rand;
  const hash1 = (i, s) => { const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); };
  /** Ruído suave 1D em [-1, 1]. */
  MK.noise = (x, seed = 0) => {
    const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
    return 2 * MK.lerp(hash1(i, seed), hash1(i + 1, seed), u) - 1;
  };
  /** Oscilação que fecha o ciclo no fim do vídeo (o último quadro igual ao primeiro): `cycles` voltas em S.dur. */
  MK.osc = (S, t, cycles = 3, phase = 0) => Math.sin((2 * Math.PI * Math.max(1, Math.round(cycles)) * t) / S.dur + phase);
  /** Piscar: 1 olho aberto, 0 fechado. Piscadas a cada 2,4–4,6 s, 0,14 s cada, sorteadas pela semente. */
  MK.blink = function (t, seed = 1, S = null) {
    const r = MK.rand(seed * 7 + 3);
    let tb = 0.6 + 2.0 * r();
    const end = S ? S.dur - 0.4 : 1e9;
    while (tb < t + 0.2 && tb < end) {
      const u = (t - tb) / 0.14;
      if (u >= 0 && u <= 1) return 1 - Math.sin(Math.PI * u);
      tb += 2.4 + 2.2 * r();
    }
    return 1;
  };

  // ── cores ───────────────────────────────────────────────────────────────────────────────────────────────────
  const hex2 = (h) => { h = h.replace("#", ""); if (h.length === 3) h = h.split("").map((c) => c + c).join("");
                        return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; };
  const rgb2 = (r, g, b) => "#" + [r, g, b].map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, "0")).join("");
  MK.rgb = hex2;
  MK.hex = rgb2;
  MK.mixColor = (a, b, u) => { const p = hex2(a), q = hex2(b); return rgb2(...p.map((v, i) => v + (q[i] - v) * u)); };
  /** amt < 0 escurece (para o preto), amt > 0 clareia (para o branco). */
  MK.shade = (c, amt) => MK.mixColor(c, amt < 0 ? "#000000" : "#ffffff", Math.abs(amt));
  MK.rgba = (c, a) => { const [r, g, b] = hex2(c); return `rgba(${r},${g},${b},${a})`; };
  /** Cor de um ponto do espectro visível (nm). */
  MK.wavelength = function (nm) {
    let r = 0, g = 0, b = 0;
    if (nm < 440) { r = -(nm - 440) / 60; b = 1; } else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
    else if (nm < 510) { g = 1; b = -(nm - 510) / 20; } else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
    else if (nm < 645) { r = 1; g = -(nm - 645) / 65; } else { r = 1; }
    const f = nm < 420 ? 0.3 + (0.7 * (nm - 380)) / 40 : nm > 700 ? 0.3 + (0.7 * (780 - nm)) / 80 : 1;
    return rgb2(255 * (r * f) ** 0.8, 255 * (g * f) ** 0.8, 255 * (b * f) ** 0.8);
  };

  // ── SVG ─────────────────────────────────────────────────────────────────────────────────────────────────────
  const SVGNS = (MK.SVGNS = "http://www.w3.org/2000/svg");
  /** Cria um elemento SVG com atributos (camelCase vira kebab-case: strokeWidth → stroke-width). */
  MK.el = function (tag, attrs = {}, parent = null) {
    const e = document.createElementNS(SVGNS, tag);
    MK.attr(e, attrs);
    if (parent) parent.appendChild(e);
    return e;
  };
  MK.svg = MK.el;
  const kebab = (k) => (k.startsWith("data") || k.includes("-") ? k : k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase()));
  const NOKEBAB = new Set(["viewBox", "preserveAspectRatio", "gradientUnits", "gradientTransform", "clipPathUnits",
    "patternUnits", "stdDeviation", "textLength", "lengthAdjust", "markerWidth", "markerHeight", "refX", "refY",
    "maskUnits", "filterUnits", "primitiveUnits", "spreadMethod", "startOffset", "pathLength", "tableValues", "baseFrequency", "numOctaves"]);
  /** Muda atributos; só escreve o que mudou (o DOM fica leve mesmo com centenas de elementos por quadro). */
  MK.attr = function (e, attrs) {
    const c = e.__mk || (e.__mk = {});
    for (const k in attrs) {
      let v = attrs[k];
      if (v === undefined) continue;
      if (typeof v === "number") v = Math.abs(v) < 1e-4 ? "0" : String(+v.toFixed(3));
      if (c[k] === v) continue;
      c[k] = v;
      if (k === "text") e.textContent = v;
      else e.setAttribute(NOKEBAB.has(k) ? k : kebab(k), v);
    }
    return e;
  };
  MK.g = (parent, attrs = {}) => MK.el("g", attrs, parent);
  /** transform SVG: translate(x y) rotate(r) scale(sx sy). */
  MK.tf = (x = 0, y = 0, r = 0, sx = 1, sy = sx) =>
    `translate(${+x.toFixed(2)} ${+y.toFixed(2)})` + (r ? ` rotate(${+r.toFixed(3)})` : "") +
    (sx !== 1 || sy !== 1 ? ` scale(${+sx.toFixed(4)} ${+sy.toFixed(4)})` : "");
  MK.defs = function (svgRoot) {
    let d = svgRoot.querySelector(":scope > defs");
    if (!d) { d = MK.el("defs"); svgRoot.insertBefore(d, svgRoot.firstChild); }
    return d;
  };
  let uid = 0;
  MK.uid = (p = "mk") => `${p}${++uid}`;
  /** Gradiente linear: stops = [[0, "#fff"], [1, "#000", 0.5]] (posição, cor, opacidade). Devolve "url(#id)". */
  MK.linear = function (svgRoot, stops, { x1 = 0, y1 = 0, x2 = 0, y2 = 1, id = MK.uid("lg"), units } = {}) {
    const g = MK.el("linearGradient", { id, x1, y1, x2, y2, gradientUnits: units }, MK.defs(svgRoot));
    for (const [o, c, a = 1] of stops) MK.el("stop", { offset: o, stopColor: c, stopOpacity: a }, g);
    return `url(#${id})`;
  };
  MK.radial = function (svgRoot, stops, { cx = 0.5, cy = 0.5, r = 0.5, fx, fy, id = MK.uid("rg"), units } = {}) {
    const g = MK.el("radialGradient", { id, cx, cy, r, fx, fy, gradientUnits: units }, MK.defs(svgRoot));
    for (const [o, c, a = 1] of stops) MK.el("stop", { offset: o, stopColor: c, stopOpacity: a }, g);
    return `url(#${id})`;
  };
  /** Filtros prontos: "blur" (desfoque), "glow" (brilho em volta), "shadow" (sombra suave), "hblur" (borrão
      horizontal, para chicotes de câmera). Devolve {url, el, set(std)}. */
  MK.filter = function (svgRoot, kind, { std = 8, color = "#000", opacity = 0.35, dx = 0, dy = 10, id = MK.uid("f") } = {}) {
    const f = MK.el("filter", { id, x: "-50%", y: "-50%", width: "200%", height: "200%", colorInterpolationFilters: "sRGB" }, MK.defs(svgRoot));
    let blur;
    if (kind === "blur" || kind === "hblur") {
      blur = MK.el("feGaussianBlur", { stdDeviation: kind === "hblur" ? `${std} 0` : std }, f);
    } else if (kind === "glow") {
      blur = MK.el("feGaussianBlur", { in: "SourceGraphic", stdDeviation: std, result: "b" }, f);
      const m = MK.el("feMerge", {}, f);
      MK.el("feMergeNode", { in: "b" }, m); MK.el("feMergeNode", { in: "SourceGraphic" }, m);
    } else if (kind === "shadow") {
      MK.el("feDropShadow", { dx, dy, stdDeviation: std, floodColor: color, floodOpacity: opacity }, f);
    }
    return {
      url: `url(#${id})`, el: f,
      set: (s) => blur && MK.attr(blur, { stdDeviation: kind === "hblur" ? `${Math.max(0, s)} 0` : Math.max(0, s) }),
    };
  };

  // ── formas ──────────────────────────────────────────────────────────────────────────────────────────────────
  /** Caminho suave (Catmull-Rom → Bézier) por pontos [[x, y], ...]. */
  MK.smoothPath = function (pts, closed = false, k = 1) {
    const n = pts.length;
    if (n < 2) return "";
    const P = (i) => pts[closed ? (i + n) % n : clamp(i, 0, n - 1)];
    let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    const segs = closed ? n : n - 1;
    for (let i = 0; i < segs; i++) {
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      const c1 = [p1[0] + ((p2[0] - p0[0]) / 6) * k, p1[1] + ((p2[1] - p0[1]) / 6) * k];
      const c2 = [p2[0] - ((p3[0] - p1[0]) / 6) * k, p2[1] - ((p3[1] - p1[1]) / 6) * k];
      d += `C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    return closed ? d + "Z" : d;
  };
  /** Bolha orgânica fechada (pedras, arbustos, nuvens, manchas): n pontos com raio r ± wobble. */
  MK.blob = function (cx, cy, r, { n = 9, wobble = 0.18, seed = 1, sx = 1, sy = 1, rot = 0 } = {}) {
    const rnd = MK.rand(seed), pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 2 * Math.PI + rot, rr = r * (1 + wobble * (2 * rnd() - 1));
      pts.push([cx + Math.cos(a) * rr * sx, cy + Math.sin(a) * rr * sy]);
    }
    return MK.smoothPath(pts, true);
  };
  /** Retângulo arredondado como caminho (para formas que precisam de transform). */
  MK.rrect = (x, y, w, h, r) => { r = Math.min(r, w / 2, h / 2);
    return `M${x + r},${y}H${x + w - r}A${r},${r} 0 0 1 ${x + w},${y + r}V${y + h - r}A${r},${r} 0 0 1 ${x + w - r},${y + h}H${x + r}A${r},${r} 0 0 1 ${x},${y + h - r}V${y + r}A${r},${r} 0 0 1 ${x + r},${y}Z`; };
  /** Ponto de uma curva quadrática a→c→b em u (para trajetórias e setas curvas). */
  /** Ângulo (graus, para rotate do SVG) que aponta o eixo "para cima" (−y) de um objeto de `from` para `to`:
      wand.place(...hand, MK.aim(hand, mouth)) deixa o aro da varinha na direção da boca. */
  MK.aim = (from, to) => (Math.atan2(to[0] - from[0], -(to[1] - from[1])) * 180) / Math.PI;
  MK.dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
  MK.quad = (a, c, b, u) => [(1 - u) ** 2 * a[0] + 2 * (1 - u) * u * c[0] + u * u * b[0], (1 - u) ** 2 * a[1] + 2 * (1 - u) * u * c[1] + u * u * b[1]];

  // ── texto ───────────────────────────────────────────────────────────────────────────────────────────────────
  MK.FONT = 'system-ui, sans-serif';
  MK.MONO = 'ui-monospace, monospace';
  MK.HAND = 'cursive';
  const mctx = document.createElement("canvas").getContext("2d");
  /** Caixa da tinta de um texto: {w, asc, desc}. font = "700 48px system-ui". */
  MK.ink = function (text, font) {
    mctx.font = font;
    const m = mctx.measureText(text);
    return { w: m.width, asc: m.actualBoundingBoxAscent, desc: m.actualBoundingBoxDescent };
  };
  /** Texto SVG: MK.text(parent, "0.1 mm", {x, y, size: 60, weight: 800, fill, anchor: "middle", mono, stroke}). */
  MK.text = function (parent, str, { x = 0, y = 0, size = 48, weight = 800, fill = MK.C.INK, anchor = "middle",
                                     mono = false, hand = false, stroke = null, strokeWidth = 0, opacity = 1, baseline = "middle",
                                     letterSpacing } = {}) {
    const t = MK.el("text", { x, y, fill, opacity, textAnchor: anchor, dominantBaseline: baseline,
      fontFamily: hand ? MK.HAND : mono ? MK.MONO : MK.FONT, fontWeight: hand ? Math.min(weight, 700) : weight, fontSize: size, letterSpacing }, parent);
    if (stroke) MK.attr(t, { stroke, strokeWidth, paintOrder: "stroke fill", strokeLinejoin: "round" });
    t.textContent = str;
    return t;
  };
  /** Número formatado ("1,234", "3.0", "42 %") para contadores. */
  MK.fmt = (v, digits = 0, sep = true) => sep ? Number(v).toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })
                                              : Number(v).toFixed(digits);


  /** Uma composição por página. start() deve preceder a criação de atores, planos e entradas. */
  MK.start = function ({ root, width = 1280, height = 720, duration = 8, cues = {} } = {}) {
    if (!(root instanceof HTMLElement)) throw new TypeError("MK.start: root deve ser um elemento HTML");
    for (const [name, value] of Object.entries({ width, height, duration })) {
      if (!Number.isFinite(value) || value <= 0) throw new RangeError(`MK.start: ${name} deve ser positivo e finito`);
    }
    for (const [name, value] of Object.entries(cues)) {
      if (!(typeof value === "number" && Number.isFinite(value)) &&
          !(Array.isArray(value) && value.length === 2 && value.every(Number.isFinite) && value[1] >= value[0])) {
        throw new TypeError(`MK.start: cue inválida: ${name}`);
      }
    }
    MK.pre = []; MK.__cams = []; MK.people = []; MK.__shots = null; MK.__world = null;
    delete MK.now;
    root.style.width = width + "px"; root.style.height = height + "px";
    root.classList.add("mk-root");
    root.setAttribute("data-duration", String(duration));
    const S = {
      root, W: width, H: height, dur: duration, home: [width / 2, height / 2],
      has: (name) => Object.hasOwn(cues, name),
      cue(name, end = false) {
        if (!Object.hasOwn(cues, name)) throw new Error("MK.cue: cue ausente: " + name);
        const c = cues[name]; return Array.isArray(c) ? c[end ? 1 : 0] : c;
      },
    };
    MK.__S = S;
    return S;
  };
  MK.pre = [];
  /** Relógio manual: draw é função de segundos, sem reprodução automática nem dependências. */
  MK.run = function (S, draw) {
    const hooks = MK.pre.slice();
    function seek(t) {
      if (!Number.isFinite(t)) throw new TypeError("MK.seek: tempo deve ser finito");
      t = MK.clamp(t, 0, S.dur); MK.now = t;
      for (const f of hooks) f(t);
      draw(t);
    }
    seek(0);
    return { seek, duration: S.dur };
  };
  /** Camada HTML fixa, sem transformação de câmera. */
  MK.layer = function (root, id, z = 10) {
    const d = document.createElement("div");
    d.className = "mk-layer"; d.id = id; d.style.zIndex = z;
    root.appendChild(d); return d;
  };
})();
