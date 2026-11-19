/* shots.js — Planos, visibilidade e coordenadas de elementos SVG. */
(function () {
  const MK = window.MK;
  const nodeOf = (e) => (e && !(e.nodeType) && e.g ? e.g : e);
  const timeOf = (S, v) => (typeof v === "string" ? S.cue(v) : typeof v === "function" ? v() : v);

  // ── planos ────────────────────────────────────────────────────────────────────────────────────────────────
  MK.shots = function (S, st, list, { lead = 0 } = {}) {
    const P = list.map(([name, t0, set]) => ({ name, t0: timeOf(S, t0) - lead, set: set || name }))
      .sort((a, b) => a.t0 - b.t0);
    P.forEach((p, i) => (p.t1 = i + 1 < P.length ? P[i + 1].t0 : S.dur));
    const byName = Object.fromEntries(P.map((p) => [p.name, p]));
    const groups = [];                                    // [{set, g}]
    function find(t) { let cur = P[0]; for (const p of P) if (t >= p.t0) cur = p; return cur; }
    function group(set, layer = "main") {
      const par = st.L[layer];
      if (!par) throw new Error(`MK.shots: não há a camada "${layer}"`);
      if (!P.some((p) => p.set === set)) throw new Error(`MK.shots: nenhum plano usa o conjunto "${set}" (planos: ${P.map((p) => p.name).join(", ")})`);
      const g = MK.g(par, { "data-mk-shot": set, "data-mk-name": `${set} (${layer})` });
      g.style.display = "none"; g.__on = false;
      groups.push({ set, g });
      return g;
    }
    function layers(set, names = ["main"]) { const o = {}; for (const k of names) o[k] = group(set, k); return o; }
    let curSet = null;
    function draw(t) {
      const s = find(t).set;
      if (s === curSet) return;
      curSet = s;
      for (const { set, g } of groups) { const on = set === s; if (g.__on !== on) { g.style.display = on ? "" : "none"; g.__on = on; } }
    }
    const get = (n) => { if (!byName[n]) throw new Error(`MK.shots: não há o plano "${n}"`); return byName[n]; };
    const sh = {
      list: P, group, layers, draw,
      at: (t) => find(t).name, setAt: (t) => find(t).set, shotAt: (t) => find(t),
      t0: (n) => get(n).t0, t1: (n) => get(n).t1,
      cuts: P.slice(1).map((p) => p.t0),
    };
    MK.pre.push(draw);
    MK.__shots = sh;
    return sh;
  };

  // ── entrada e saída ───────────────────────────────────────────────────────────────────────────────────────
  MK.show = function (el, { from = 0, to = null, fade = 0.3, out = null, ease = "inOut", keep = false, shot = null } = {}) {
    const node = nodeOf(el);
    if (!node) throw new Error("MK.show: elemento vazio");
    let wrap = node;
    if (node instanceof SVGElement && node.tagName !== "svg") {
      wrap = document.createElementNS(MK.SVGNS, "g");
      node.parentNode.insertBefore(wrap, node);
      wrap.appendChild(node);
      for (const a of ["data-mk-name", "data-mk-shot"]) if (node.hasAttribute(a)) wrap.setAttribute(a, node.getAttribute(a));
    }
    if (keep) wrap.setAttribute("data-mk-keep", "");
    let A = null, B = null;                              // resolvidos no primeiro quadro (os planos podem vir depois)
    function times() {
      if (A !== null) return;
      const S = MK.__S;                                 // registrado pelo MK.start
      A = S ? timeOf(S, from) : from;
      if (to === "shot" || to === "plano") {
        const sh = MK.__shots;
        if (!sh) throw new Error('MK.show: to: "shot" precisa de MK.shots criado na cena');
        const p = shot ? sh.list.find((q) => q.name === shot) : sh.shotAt(A + 1e-3);
        if (!p) throw new Error(`MK.show: não há o plano "${shot}"`);
        B = p.t1;
        wrap.setAttribute("data-mk-until", p.name);
      } else B = to === null ? Infinity : S ? timeOf(S, to) : to;
      wrap.setAttribute("data-mk-from", A.toFixed(2));
      if (B !== Infinity) wrap.setAttribute("data-mk-to", B.toFixed(2));
    }
    const fo = out === null ? fade : out;
    function vis(t) {
      times();
      const i = fade > 0 ? MK.ramp(t, A, fade, ease) : (t >= A ? 1 : 0);
      const o = B === Infinity ? 1 : fo > 0 ? 1 - MK.ramp(t, B - fo, fo, ease) : (t < B ? 1 : 0);
      return Math.min(i, o);
    }
    let last = -1;
    function apply(t) {
      const v = vis(t);
      if (Math.abs(v - last) < 1e-4) return;
      last = v;
      if (wrap instanceof SVGElement) {
        if (v >= 0.9999) wrap.removeAttribute("opacity"); else wrap.setAttribute("opacity", v.toFixed(4));
        wrap.style.display = v <= 0 ? "none" : "";
      } else { wrap.style.opacity = v.toFixed(4); wrap.style.visibility = v <= 0 ? "hidden" : ""; }
    }
    MK.pre.push(apply);
    if (MK.now !== undefined) apply(MK.now);
    return { el, wrap, vis };
  };

  // ── posição ───────────────────────────────────────────────────────────────────────────────────────────────
  // a camada do mundo onde o elemento está: <g id="L-nome"> do MK.stage
  function layerOf(n) {
    for (let e = n; e && e.nodeType === 1; e = e.parentNode) if (e.id && e.id.startsWith("L-") && e.parentNode && (e.parentNode.id === "mk-stage" || e.id === "L-hud")) return e;
    return null;
  }
  // matriz do elemento até a camada, pelas transformações declaradas (vale com display: none, sem depender do render)
  function matTo(n, layer) {
    let m = new DOMMatrix();
    for (let e = n; e && e !== layer && e.nodeType === 1; e = e.parentNode) {
      if (e.style && e.style.transform && e.style.transform !== "none") { m = new DOMMatrix(getComputedStyle(e).transform).multiply(m); continue; }   // CSS vence o atributo
      const tl = e.transform && e.transform.baseVal;
      if (tl && tl.numberOfItems) { const c = tl.consolidate(); if (c) { const k = c.matrix; m = new DOMMatrix([k.a, k.b, k.c, k.d, k.e, k.f]).multiply(m); } }
    }
    return m;
  }
  // getBBox precisa do elemento renderizado: mostra os ancestrais escondidos por um instante
  function bbox(n) {
    const hid = [];
    for (let e = n; e && e.nodeType === 1; e = e.parentNode) if (e.style && e.style.display === "none") { hid.push(e); e.style.display = ""; }
    let b;
    try { b = n.getBBox(); } finally { for (const e of hid) e.style.display = "none"; }
    return b;
  }
  const PAR = (layer) => { if (!layer) return 1; if (layer.id === "L-hud") return null; const k = layer.id.slice(2); return MK.PARALLAX[k] !== undefined ? MK.PARALLAX[k] : 1; };

  /** O ponto do elemento na camada: um [x, y] com .x, .y, .layer, .p (paralaxe; null no HUD). */
  MK.worldPos = function (el, pt = null) {
    const n = nodeOf(el), layer = layerOf(n);
    let x, y;
    if (pt) [x, y] = pt; else { const b = bbox(n); x = b.x + b.width / 2; y = b.y + b.height / 2; }
    const q = new DOMPoint(x, y).matrixTransform(matTo(n, layer));
    return Object.assign([q.x, q.y], { x: q.x, y: q.y, layer: layer ? layer.id.slice(2) : null, p: PAR(layer) });   // serve como [x, y]
  };
  MK.worldBox = function (el) {
    const n = nodeOf(el), layer = layerOf(n), b = bbox(n), m = matTo(n, layer);
    const cs = [[b.x, b.y], [b.x + b.width, b.y], [b.x, b.y + b.height], [b.x + b.width, b.y + b.height]].map(([x, y]) => new DOMPoint(x, y).matrixTransform(m));
    const xs = cs.map((p) => p.x), ys = cs.map((p) => p.y), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    return { x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0, layer: layer ? layer.id.slice(2) : null, p: PAR(layer) };
  };
  MK.screenPos = function (el, t, cam, pt = null) {
    const w = MK.worldPos(el, pt);
    if (w.p === null || !cam) return [w.x, w.y];
    return cam.toScreen(t, w.x, w.y, w.p);
  };

  // ── câmera que mira ───────────────────────────────────────────────────────────────────────────────────────
  MK.look = (el, o = {}) => ({ ...o, look: el });
  /** Chamado pela câmera: troca {look: el, z | fill, on} por {x, y, z} (a câmera em casa é o ponto H0 da camada). */
  MK.lookAt = function (tg, v, { W, H, ON, H0 }) {
    if (tg.__res && !tg.follow) return tg.__res;
    const b = MK.worldBox(tg.look), p = b.p === null ? 1 : Math.max(0.05, b.p);
    let Zp;                                              // zoom efetivo na camada do elemento
    if (tg.fill) Zp = tg.fill / Math.max(b.w / W, b.h / H, 1e-6);
    else Zp = Math.pow(tg.z !== undefined ? tg.z : v.z, p);
    const z = Math.pow(Zp, 1 / p), on = tg.on || ON;
    const pt = tg.pt ? MK.worldPos(tg.look, tg.pt) : b;
    // na camada p: X_p = H0 + (x − H0)·p; o ponto cai em `on` quando X_p = px − (on − meio)/Zp
    const H0x = H0.x, H0y = H0.y;
    const Xp = pt.x - (on[0] - W / 2) / Zp, Yp = pt.y - (on[1] - H / 2) / Zp;
    const res = { x: H0x + (Xp - H0x) / p, y: H0y + (Yp - H0y) / p, z };
    if (tg.r !== undefined) res.r = tg.r;
    tg.__res = res;
    return res;
  };
})();
