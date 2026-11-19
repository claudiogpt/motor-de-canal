/* anim.js — Primitivas de movimento, gestos, entradas e saídas. Ver docs/animation.md. */
(function () {
  const MK = window.MK;
  const A = (MK.anim = MK.anim || {});
  const { clamp, lerp } = MK;
  const timeOf = (v) => (typeof v === "string" ? MK.__S.cue(v) : typeof v === "function" ? v() : v);
  const nodeOf = (e) => (e && !e.nodeType && e.g ? e.g : e);
  const GEOM = "path,circle,ellipse,rect,line,polyline,polygon,text";

  // ── tempo ───────────────────────────────────────────────────────────────────────────────────────────────────
  MK.FPS = 60;
  /** n quadros (a 60 fps) em segundos: MK.fr(8) = 0,133. */
  MK.fr = (n) => n / MK.FPS;
  /** Durações com nome, em segundos (quadros a 60 fps entre parênteses). */
  A.D = { snap: MK.fr(4), quick: MK.fr(8), normal: MK.fr(16), slow: MK.fr(26), lazy: MK.fr(40), hold: MK.fr(14), aha: 1.1 };
  /** Easing por finalidade (os padrões das entradas, saídas, câmera, assentamento e batida). */
  A.EASE = { enter: "expoOut", exit: "in", camera: "inOut", settle: "spring", hit: "out", ui: "backOut", drift: "sine" };

  /** Folha de tempos: MK.anim.sheet(cue("toast"), [["lift", 0.3], ["tip", 0.5, 0.1], ["fall", 0.6]]).
      X.lift = { t0, t1, dur, u(t, ease) }, X.end, X.at("tip", 0.5) (instante no meio do trecho), X.list. */
  A.sheet = function (start, rows) {
    const X = { list: [] };
    let t = timeOf(start);
    for (const [name, dur = 0.3, gap = 0] of rows) {
      const t0 = t, t1 = t + dur;
      const row = { name, t0, t1, dur, u: (tt, e = "inOut") => MK.ramp(tt, t0, dur, e), win: (tt, fi = 0.1, fo = 0.1) => MK.window(tt, t0, t1, fi, fo) };
      if (X[name] !== undefined) throw new Error(`MK.anim.sheet: nome repetido "${name}"`);
      X[name] = row; X.list.push(row);
      t = t1 + gap;
    }
    X.start = X.list.length ? X.list[0].t0 : timeOf(start);
    X.end = t;
    X.at = (name, k = 0.5) => X[name].t0 + X[name].dur * k;
    return X;
  };

  /** Movimento de desenho animado: antecipa (recua até −back), vai (passa do alvo em `over`), assenta.
      Devolve o valor (pode ser < 0 antes e > 1 logo depois): posição = de + (para − de) · go.
      ante: duração da antecipação (0 desliga) · dur: a ação · over: quanto passa (0,08 = 8 %) · settle: tempo do assentamento. */
  A.go = function (t, t0, { ante = 0.18, back = 0.12, dur = 0.35, over = 0.08, settle = 0.4, ease = "out", anteEase = "inOut" } = {}) {
    t0 = timeOf(t0);
    if (t <= t0 - ante) return 0;
    if (t < t0) return -back * MK.ease.sine((t - (t0 - ante)) / ante);          // antecipação: recua devagar
    if (t < t0 + dur) return lerp(-back, 1 + over, MK.E(ease)((t - t0) / dur)); // ação: rápida, passa do alvo
    if (settle <= 0 || over <= 0) return 1;
    const u = (t - t0 - dur) / settle;
    return u >= 1 ? 1 : 1 + over * Math.cos(u * Math.PI * 1.5) * Math.pow(1 - u, 2);   // assenta oscilando uma vez e meia
  };
  /** Fase do MK.anim.go em t: "before" | "ante" | "go" | "settle" | "after" (para trocar cara ou som). */
  A.goPhase = function (t, t0, { ante = 0.18, dur = 0.35, settle = 0.4 } = {}) {
    t0 = timeOf(t0);
    return t < t0 - ante ? "before" : t < t0 ? "ante" : t < t0 + dur ? "go" : t < t0 + dur + settle ? "settle" : "after";
  };

  /** Instantes de n elementos entrando em cascata. order: "forward" | "reverse" | "center" (do meio para fora) |
      "edges" (das pontas para o meio) | "random" (com seed). total: em vez de gap, o tempo da cascata inteira. */
  A.stagger = function (n, { t0 = 0, gap = 0.08, order = "forward", seed = 1, total = null } = {}) {
    t0 = timeOf(t0);
    const g = total !== null && n > 1 ? total / (n - 1) : gap;
    let rank;
    if (order === "reverse") rank = (i) => n - 1 - i;
    else if (order === "center") rank = (i) => Math.abs(i - (n - 1) / 2);
    else if (order === "edges") rank = (i) => (n - 1) / 2 - Math.abs(i - (n - 1) / 2);
    else if (order === "random") { const r = MK.rand(seed), p = [...Array(n).keys()].map((i) => [r(), i]).sort((a, b) => a[0] - b[0]).map((x) => x[1]); rank = (i) => p.indexOf(i); }
    else rank = (i) => i;
    const out = [];
    for (let i = 0; i < n; i++) out.push(t0 + rank(i) * g);
    return out;
  };

  /** "Pausa viva": deriva mínima e lenta para um cartão, rótulo ou objeto que ficaria congelado. {dx, dy, r, s}.
      amp 1 ≈ 3 px e 0,6°; é para o olho sentir vida, não para ver o movimento. */
  A.hold = function (t, { seed = 1, amp = 1, speed = 1 } = {}) {
    const k = t * 0.45 * speed;
    return { dx: 3 * amp * MK.noise(k, seed), dy: 2.4 * amp * MK.noise(k + 7.3, seed + 1), r: 0.6 * amp * MK.noise(k * 0.8 + 3.1, seed + 2), s: 1 + 0.006 * amp * MK.noise(k * 0.6 + 11, seed + 3) };
  };

  // tempo remapeado: integra a velocidade numa grade fixa (determinístico, qualquer ordem de busca)
  const remapCache = new WeakMap();
  /** Câmera lenta / acelerada por trechos: segs = [[t0, t1, k, ramp?]] (k = velocidade do relógio dentro do trecho; ramp =
      suavização nas bordas, padrão 0,15 s). Devolve o tempo remapeado (contínuo, monotônico; fora dos trechos anda a 1×,
      mas atrasado pelo que a câmera lenta gastou). Use no tempo do mundo; a UI e a voz continuam no t real. */
  A.slowmo = function (t, segs) {
    let c = remapCache.get(segs);
    if (!c) {
      const dt = 1 / 240, S = [0];
      const speed = (x) => { let k = 1; for (const [a, b, kk = 0.3, r = 0.15] of segs) { const w = Math.min(MK.ramp(x, a - r / 2, r, "sine"), 1 - MK.ramp(x, b - r / 2, r, "sine")); k *= 1 + (kk - 1) * w; } return k; };
      const T = (MK.__S ? MK.__S.dur : 60) + 2;
      for (let i = 1; i * dt <= T; i++) S.push(S[i - 1] + speed((i - 0.5) * dt) * dt);
      c = { S, dt }; remapCache.set(segs, c);
    }
    if (t <= 0) return t;
    const f = t / c.dt, i = Math.floor(f);
    if (i + 1 >= c.S.length) return c.S[c.S.length - 1] + (t - (c.S.length - 1) * c.dt);
    return c.S[i] + (c.S[i + 1] - c.S[i]) * (f - i);
  };
  /** Hit stop: o relógio congela `dur` s em cada instante de `hits` (números, deixas ou {t}) e segue. */
  A.hitstop = function (t, hits, { dur = MK.fr(5) } = {}) {
    let d = 0;
    for (const h of hits) { const th = typeof h === "object" ? h.t : timeOf(h); d += clamp(t - th, 0, dur); }
    return t - d;
  };

  // ── movimento de elementos ──────────────────────────────────────────────────────────────────────────────────
  // caixa local do elemento (com a própria transformação): o pivô fica nas coordenadas do pai
  function localBox(node) {
    const hid = [];
    for (let e = node; e && e.nodeType === 1; e = e.parentNode) if (e.style && e.style.display === "none") { hid.push(e); e.style.display = ""; }
    let b;
    try { b = node.getBBox(); } finally { for (const e of hid) e.style.display = "none"; }
    const m = ownMatrix(node);
    const cs = [[b.x, b.y], [b.x + b.width, b.y], [b.x, b.y + b.height], [b.x + b.width, b.y + b.height]].map(([x, y]) => new DOMPoint(x, y).matrixTransform(m));
    const xs = cs.map((p) => p.x), ys = cs.map((p) => p.y);
    return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
  }
  function ownMatrix(node) {
    const tl = node.transform && node.transform.baseVal;
    if (tl && tl.numberOfItems) { const cc = tl.consolidate(); if (cc) { const k = cc.matrix; return new DOMMatrix([k.a, k.b, k.c, k.d, k.e, k.f]); } }
    return new DOMMatrix();
  }
  // pivô: [x, y] nas coordenadas do PRÓPRIO elemento (antes da transformação dele: [0, 0] é a origem do grupo),
  // ou "center" | "bottom" | "top" | "left" | "right" da caixa dele
  function pivotOf(node, pivot) {
    if (Array.isArray(pivot)) { const q = new DOMPoint(pivot[0], pivot[1]).matrixTransform(ownMatrix(node)); return [q.x, q.y]; }
    const b = localBox(node), cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
    return { center: [cx, cy], bottom: [cx, b.y1], top: [cx, b.y0], left: [b.x0, cy], right: [b.x1, cy] }[pivot || "center"] || [cx, cy];
  }
  /** Envolve o elemento num <g> (como MK.show) para transformar e apagar sem brigar com o que a cena já põe nele. */
  function wrapOf(node) {
    if (node.__mkAnimWrap) return node.__mkAnimWrap;
    const wrap = document.createElementNS(MK.SVGNS, "g");
    wrap.setAttribute("data-mk-anim", "");
    node.parentNode.insertBefore(wrap, node);
    wrap.appendChild(node);
    for (const a of ["data-mk-name", "data-mk-shot", "data-mk-role"]) if (node.hasAttribute(a) && a !== "data-mk-role") wrap.setAttribute(a, node.getAttribute(a));
    node.__mkAnimWrap = wrap;
    return wrap;
  }

  /** Movedor: transforma um elemento em volta de um pivô, sem mexer na transformação que ele já tem. */
  A.mover = function (el, { pivot = "center" } = {}) {
    const node = nodeOf(el);
    if (!node || !(node instanceof SVGElement)) throw new Error("MK.anim.mover: precisa de um elemento SVG");
    const wrap = wrapOf(node);
    let pv = null;
    const m = {
      el: node, wrap,
      get pivot() { if (!pv) pv = pivotOf(node, pivot); return pv; },
      /** {x, y} deslocam; r gira (graus); s ou sx/sy escalam; o: opacidade (multiplica a do elemento). */
      set({ x = 0, y = 0, r = 0, s = 1, sx = null, sy = null, o = 1 } = {}) {
        const [px, py] = m.pivot, SX = sx === null ? s : sx, SY = sy === null ? s : sy;
        const tf = (x || y || r || SX !== 1 || SY !== 1)
          ? `translate(${(px + x).toFixed(2)} ${(py + y).toFixed(2)})${r ? ` rotate(${r.toFixed(3)})` : ""}${SX !== 1 || SY !== 1 ? ` scale(${SX.toFixed(4)} ${SY.toFixed(4)})` : ""} translate(${(-px).toFixed(2)} ${(-py).toFixed(2)})`
          : "";
        if (tf) MK.attr(wrap, { transform: tf });
        else if (wrap.hasAttribute("transform")) { wrap.removeAttribute("transform"); if (wrap.__mk) delete wrap.__mk.transform; }
        const oo = clamp(o);
        if (oo >= 0.9999) { if (wrap.hasAttribute("opacity")) wrap.removeAttribute("opacity"); } else wrap.setAttribute("opacity", oo.toFixed(4));
        const show = oo > 0.001 && SX !== 0 && SY !== 0;
        if ((wrap.style.display === "none") === show) wrap.style.display = show ? "" : "none";
        return m;
      },
    };
    return m;
  };

  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const dirOf = (d, dist) => { const v = Array.isArray(d) ? d : DIRS[d] || DIRS.up; return Array.isArray(d) ? v : [v[0] * dist, v[1] * dist]; };

  // traço que se desenha: cada forma com comprimento ganha dasharray; u varre as formas em sequência
  function strokePrep(node) {
    const shapes = [...(node.matches("path,line,polyline,polygon,circle,ellipse,rect") ? [node] : node.querySelectorAll("path,line,polyline,polygon,circle,ellipse,rect"))]
      .filter((s) => s.getTotalLength && (s.getAttribute("stroke") || getComputedStyle(s).stroke) !== "none");
    const L = shapes.map((s) => { const l = s.getTotalLength(); MK.attr(s, { strokeDasharray: `${l} ${l}` }); return l; });
    const total = L.reduce((a, b) => a + b, 0) || 1;
    return { shapes, L, total };
  }
  function strokeDraw(prep, u) {
    let acc = 0;
    prep.shapes.forEach((s, i) => { const a = acc / prep.total, b = (acc + prep.L[i]) / prep.total; acc += prep.L[i];
      const k = clamp((u - a) / Math.max(1e-6, b - a)); MK.attr(s, { strokeDashoffset: prep.L[i] * (1 - k) }); });
  }
  // cortina: clipPath retangular que cresce em dir
  function rawBox(node) {                           // caixa no sistema do próprio elemento (o clip-path vive nele)
    const hid = [];
    for (let e = node; e && e.nodeType === 1; e = e.parentNode) if (e.style && e.style.display === "none") { hid.push(e); e.style.display = ""; }
    let b;
    try { b = node.getBBox(); } finally { for (const e of hid) e.style.display = "none"; }
    return { x0: b.x, y0: b.y, x1: b.x + b.width, y1: b.y + b.height };
  }
  function clipPrep(node) {
    const svg = node.ownerSVGElement, defs = MK.defs(svg), id = MK.uid("wipe");
    const cp = MK.el("clipPath", { id, clipPathUnits: "userSpaceOnUse" }, defs);
    const r = MK.el("rect", {}, cp);
    node.setAttribute("clip-path", `url(#${id})`);
    const b = rawBox(node), pad = 6;
    return { r, b: { x0: b.x0 - pad, y0: b.y0 - pad, x1: b.x1 + pad, y1: b.y1 + pad } };
  }
  function clipDraw(prep, u, dir) {
    const { b, r } = prep, w = b.x1 - b.x0, h = b.y1 - b.y0;
    const d = Array.isArray(dir) ? (Math.abs(dir[0]) >= Math.abs(dir[1]) ? (dir[0] >= 0 ? "right" : "left") : dir[1] >= 0 ? "down" : "up") : dir;
    if (d === "left") MK.attr(r, { x: b.x1 - w * u, y: b.y0, width: w * u, height: h });
    else if (d === "up") MK.attr(r, { x: b.x0, y: b.y1 - h * u, width: w, height: h * u });
    else if (d === "down") MK.attr(r, { x: b.x0, y: b.y0, width: w, height: h * u });
    else MK.attr(r, { x: b.x0, y: b.y0, width: w * u, height: h });
  }

  /** O estado de uma entrada em u (0→1) do tipo `kind`: {x, y, r, s, sx, sy, o}. Exposto para quem quer compor à mão. */
  A.enterState = function (kind, u, { dir = "up", dist = 60, ease = null } = {}) {
    const e = (nm) => MK.E(ease || nm)(u);
    const [dx, dy] = dirOf(dir, dist);
    switch (kind) {
      case "pop": return { s: lerp(0.6, 1, e("backOut")), o: clamp(u * 2.5) };
      case "rise": case "drop": case "slide": { const k = e("expoOut"); return { x: -dx * (1 - k), y: -dy * (1 - k), o: clamp(u * 2) }; }
      case "slam": { const k = MK.ease.expoIn(clamp(u / 0.55)), w = u > 0.55 ? 1 + 0.06 * Math.cos((u - 0.55) / 0.45 * Math.PI * 1.5) * (1 - (u - 0.55) / 0.45) : 1; return { s: lerp(1.9, 1, k) * w, o: clamp(u * 3) }; }
      case "unfold": return { sy: lerp(0, 1, e("backOut")), o: clamp(u * 3) };
      case "spin": return { r: -28 * (1 - e("backOut")), s: lerp(0.5, 1, e("backOut")), o: clamp(u * 2.5) };
      case "fade": return { o: e("out") };
      default: return { o: 1 };            // draw, wipe, type: tratados fora (recorte/traço)
    }
  };
  A.exitState = function (kind, u, { dir = "down", dist = 50, ease = null } = {}) {   // u: 0 (ainda inteiro) → 1 (sumiu)
    const e = (nm) => MK.E(ease || nm)(u);
    const [dx, dy] = dirOf(dir, dist);
    switch (kind) {
      case "shrink": return { s: lerp(1, 0.6, e("in")), o: 1 - e("in") };
      case "drop": case "rise": case "slide": { const k = e("in"); return { x: dx * k, y: dy * k, o: 1 - clamp(u * 1.4) }; }
      case "snap": return { o: u >= 1 ? 0 : 1 };
      case "fade": default: return { o: 1 - e("in") };
    }
  };

  /** Entrada (e, com `to`, saída) de um elemento, resolvida sozinha a cada quadro. Devolve { m, vis(t), u(t), t0, t1 }.
      kind (entrada): pop | rise | drop | slide | slam | unfold | spin | fade | draw | wipe | type.
      exit (saída, com to): shrink | drop | rise | slide | fade | wipe | snap. to: s, deixa, função ou "shot" (fim do plano).
      pivot: "center" | "bottom" | "top" | [x, y]. dir: "up" | "down" | "left" | "right" | [dx, dy]. manual: true = só
      devolve, sem registrar (a cena chama .draw(t)). snap: true = aparece de uma vez de propósito (a conferência não avisa). */
  A.inout = function (el, { from = 0, t0 = null, to = null, t1 = null, kind = "pop", exit = null, dur = null, out = null, dir = null, dist = 60,
                            ease = null, pivot = null, hold = 0, manual = false, snap = false, keep = false, shot = null } = {}) {
    const node = nodeOf(el);
    if (!node) throw new Error("MK.anim.inout: elemento vazio");
    const m = A.mover(node, { pivot: pivot || (kind === "unfold" ? "top" : kind === "pop" || kind === "slam" ? "center" : "center") });
    const inKind = kind, outKind = exit || { pop: "shrink", slam: "shrink", rise: "drop", drop: "rise", slide: "slide", unfold: "shrink", spin: "shrink", draw: "fade", wipe: "wipe", type: "wipe" }[kind] || "fade";
    const dIn = dur !== null ? dur : { pop: 0.42, slam: 0.5, draw: 0.9, wipe: 0.6, type: 0.8, fade: 0.4 }[inKind] || 0.5;
    const dOut = out !== null ? out : Math.max(MK.fr(5), dIn * 0.55);                                      // saída 45 % mais curta
    const dirIn = dir || { rise: "up", drop: "down", slide: "left", wipe: "right", type: "right" }[inKind] || "up";
    const dirOut = dir || { drop: "down", rise: "up", slide: "right", wipe: "left" }[outKind] || "down";
    if (snap) m.wrap.setAttribute("data-mk-snap", "");
    if (keep) m.wrap.setAttribute("data-mk-keep", "");
    let T0 = null, T1 = null, prep = null;
    function times() {
      if (T0 !== null) return;
      T0 = timeOf(t0 !== null ? t0 : from);
      const tt = t1 !== null ? t1 : to;
      if (tt === "shot" || tt === "plano") {
        const sh = MK.__shots;
        if (!sh) throw new Error('MK.anim.inout: to: "shot" precisa de MK.shots na cena');
        const p = shot ? sh.list.find((q) => q.name === shot) : sh.shotAt(T0 + 1e-3);
        T1 = p.t1; m.wrap.setAttribute("data-mk-until", p.name);
      } else T1 = tt === null ? Infinity : timeOf(tt);
      m.wrap.setAttribute("data-mk-from", T0.toFixed(2));
      if (T1 !== Infinity) m.wrap.setAttribute("data-mk-to", T1.toFixed(2));
      if (inKind === "draw") prep = strokePrep(node);
      if (inKind === "wipe" || inKind === "type" || outKind === "wipe") prep = clipPrep(node);
    }
    const uIn = (t) => (dIn <= 0 ? (t >= T0 ? 1 : 0) : clamp((t - T0) / dIn));
    const uOut = (t) => (T1 === Infinity ? 0 : clamp((t - (T1 - dOut)) / dOut));
    const vis = (t) => { times(); return Math.min(MK.ramp(t, T0, dIn, "linear"), 1 - MK.ramp(t, T1 - dOut, dOut, "linear")); };
    function draw(t) {
      times();
      if (t < T0 || t >= T1) { m.set({ o: 0 }); return; }
      const ui = uIn(t), uo = uOut(t);
      let st = { o: 1 };
      if (ui < 1) {
        st = A.enterState(inKind, ui, { dir: dirIn, dist, ease });
        if (inKind === "draw") { strokeDraw(prep, MK.E(ease || "inOut")(ui)); st = { o: 1 }; }
        if (inKind === "wipe" || inKind === "type") { clipDraw(prep, MK.E(ease || (inKind === "type" ? "linear" : "inOut"))(ui), dirIn); st = { o: 1 }; }
      } else if (prep && (inKind === "wipe" || inKind === "type")) clipDraw(prep, 1, dirIn);
      else if (prep && inKind === "draw") strokeDraw(prep, 1);
      if (uo > 0) {
        if (outKind === "wipe" && prep && prep.r) { clipDraw(prep, 1 - MK.ease.in(uo), dirOut); }
        else { const ex = A.exitState(outKind, uo, { dir: dirOut, dist: dist * 0.8 }); st = { ...st, x: (st.x || 0) + (ex.x || 0), y: (st.y || 0) + (ex.y || 0), s: (st.s || 1) * (ex.s || 1), o: (st.o ?? 1) * (ex.o ?? 1) }; }
      }
      if (hold && ui >= 1 && uo <= 0) { const h = A.hold(t, { seed: (T0 * 7) | 0, amp: hold === true ? 1 : hold }); st = { ...st, x: (st.x || 0) + h.dx, y: (st.y || 0) + h.dy, r: (st.r || 0) + h.r }; }
      m.set(st);
    }
    const R = { m, vis, u: (t) => { times(); return uIn(t); }, draw, get t0() { times(); return T0; }, get t1() { times(); return T1; } };
    if (!manual) { MK.pre.push(draw); if (MK.now !== undefined) draw(MK.now); }
    return R;
  };
  A.enter = (el, o = {}) => A.inout(el, o);
  A.exit = (el, { t1, to = null, kind = "fade", ...o } = {}) => A.inout(el, { from: -1e9, to: t1 !== undefined ? t1 : to, kind: "fade", dur: 0, exit: kind, ...o });

  /** Achatar/esticar com volume constante: k > 0 achata (pouso), k < 0 estica (voo). amount = quanto a 100 %. */
  A.squash = function (k, amount = 0.25) {
    const sy = clamp(1 - amount * k, 0.2, 2.5);
    return { sx: 1 / sy, sy };
  };
  /** Ponto numa parábola de a a b (u 0→1); h: altura do arco em px para cima (padrão 22 % da distância; negativo = para baixo). */
  A.arc = function (a, b, u, { h = null, ease = "linear" } = {}) {
    u = MK.E(ease)(u);
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]), H = h === null ? 0.22 * d : h;
    return [lerp(a[0], b[0], u), lerp(a[1], b[1], u) - 4 * H * u * (1 - u)];
  };
  /** Ao longo de um <path>: {x, y, angle} em u (0→1). */
  A.along = function (pathEl, u) {
    const p = nodeOf(pathEl);
    const L = p.__mkLen || (p.__mkLen = p.getTotalLength());
    const s = clamp(u) * L, q = p.getPointAtLength(s), q2 = p.getPointAtLength(Math.min(L, s + 1)), q1 = p.getPointAtLength(Math.max(0, s - 1));
    return { x: q.x, y: q.y, angle: Math.atan2(q2.y - q1.y, q2.x - q1.x) / MK.deg };
  };
  /** Seguidor amortecido de uma função pura fn(t) → número ou lista: o que vem atrás (rabo de cavalo, rótulo, placa).
      lag: atraso em s · zeta: amortecimento (1 sem passada, 0,5 brincalhão) · f: oscilações por s. Devolve g(t). */
  A.lag = function (fn, { lag = 0.08, zeta = 0.65, f = 3.5, t0 = 0 } = {}) {
    const dt = 1 / 240, w = 2 * Math.PI * f, Xs = [], Vs = [];
    let n = 0;
    const base = (t) => { const v = fn(Math.max(t0, t - lag)); return Array.isArray(v) ? v : [v]; };
    function stepTo(k) {
      if (!Xs.length) { Xs.push(base(t0)); Vs.push(Xs[0].map(() => 0)); n = 1; }
      for (let i = n; i <= k; i++) {
        const tgt = base(t0 + i * dt), x = Xs[i - 1], v = Vs[i - 1], nx = [], nv = [];
        for (let j = 0; j < x.length; j++) { const a = w * w * (tgt[j] - x[j]) - 2 * zeta * w * v[j]; const vv = v[j] + a * dt; nv.push(vv); nx.push(x[j] + vv * dt); }
        Xs.push(nx); Vs.push(nv);
      }
      n = Math.max(n, k + 1);
    }
    const g = (t) => {
      if (t <= t0) { const b = base(t0); return b.length === 1 ? b[0] : b; }
      const fi = (t - t0) / dt, i = Math.floor(fi), k = fi - i;
      stepTo(i + 1);
      const r = Xs[i].map((x, j) => x + (Xs[i + 1][j] - x) * k);
      return r.length === 1 ? r[0] : r;
    };
    return g;
  };
  /** Oscilação que morre a partir de t0 (0 antes): amp · sin(2π·freq·τ) · e^(−decay·τ). */
  A.wobble = (t, t0, { amp = 1, freq = 6, decay = 5, phase = 0 } = {}) => { t0 = timeOf(t0); const u = t - t0; return u <= 0 ? 0 : amp * Math.sin(2 * Math.PI * freq * u + phase) * Math.exp(-decay * u); };
  /** Pêndulo: amp · sin(2π t / period + phase). */
  A.swing = (t, { amp = 6, period = 2.4, phase = 0 } = {}) => amp * Math.sin((2 * Math.PI * t) / period + phase);
  /** Altura (px, ≥ 0) de algo que cai de h e quica n vezes com restituição e, a partir de t0 (gravidade 9,8 m/s², 350 px/m). */
  A.bounce = function (t, t0, { h = 80, n = 3, e = 0.5, g = 9.8 * 350 } = {}) {
    t0 = timeOf(t0);
    let u = t - t0;
    if (u <= 0) return h;
    let v = Math.sqrt(2 * g * h), T = v / g;                      // tempo até o primeiro pouso
    if (u < T) return h - 0.5 * g * u * u;
    u -= T;
    for (let i = 0; i < n; i++) {
      v *= e; const air = (2 * v) / g;
      if (u < air) return Math.max(0, v * u - 0.5 * g * u * u);
      u -= air;
    }
    return 0;
  };
  /** Tremor do próprio elemento, que morre: [dx, dy]. */
  A.shake = function (t, t0, { amp = 10, dur = 0.4, freq = 18, seed = 5 } = {}) {
    t0 = timeOf(t0);
    if (t < t0 || t > t0 + dur) return [0, 0];
    const k = amp * Math.pow(1 - (t - t0) / dur, 2);
    return [k * MK.noise(t * freq, seed), k * MK.noise(t * freq, seed + 13)];
  };
  /** Escala 1 → 1 + amount → 1 em volta de tc (o "ding" num número ou rótulo). */
  A.ping = (t, tc, { amount = 0.14, w = 0.36 } = {}) => 1 + amount * MK.pulse(t, timeOf(tc), w);

  // ── atuação ─────────────────────────────────────────────────────────────────────────────────────────────────
  const G = (MK.gesture = MK.gesture || {});
  const Z = () => ({ nod: 0, lean: 0, look: [0, 0], turn: 0, brow: 0, eyeOpen: 0, mouthOpen: 0, armN: [0, 0], armF: [0, 0], face: null, w: 0 });
  const sc = (d, k) => ({ ...d, nod: d.nod * k, lean: d.lean * k, look: [d.look[0] * k, d.look[1] * k], turn: d.turn * k, brow: d.brow * k, eyeOpen: d.eyeOpen * k, mouthOpen: d.mouthOpen * k, armN: [d.armN[0] * k, d.armN[1] * k], armF: [d.armF[0] * k, d.armF[1] * k], w: d.w * k });

  /** Soma gestos a uma pose: os números somam, os braços somam, a cara do gesto de maior peso (> 0,5) vence. */
  G.apply = function (pose, ...parts) {
    const q = { ...pose };
    let bestW = 0.5, face = null;
    for (const d of parts) {
      if (!d || !d.w) continue;
      q.nod = (q.nod || 0) + d.nod; q.lean = (q.lean || 0) + d.lean;
      if (d.look[0] || d.look[1]) { const l = q.look || [0, 0]; q.look = [clamp(l[0] + d.look[0], -1, 1), clamp(l[1] + d.look[1], -1, 1)]; }
      if (d.turn) q.turn = clamp((q.turn === undefined ? 0.3 : q.turn) + d.turn, 0, 1);
      if (d.brow) q.brow = clamp((q.brow === undefined ? (MK.FACES[q.face || "neutral"] || {}).brow || 0 : q.brow) + d.brow, -1, 1);
      if (d.eyeOpen) q.eyeOpen = clamp((q.eyeOpen === undefined ? (MK.FACES[q.face || "neutral"] || {}).eyeOpen || 1 : q.eyeOpen) + d.eyeOpen, 0, 1.3);
      if (d.mouthOpen) q.mouthOpen = clamp((q.mouthOpen || 0) + d.mouthOpen);
      if (d.armN[0] || d.armN[1]) { const a = q.armN || [8, 10]; q.armN = [a[0] + d.armN[0], a[1] + d.armN[1]]; }
      if (d.armF[0] || d.armF[1]) { const a = q.armF || [-6, 12]; q.armF = [a[0] + d.armF[0], a[1] + d.armF[1]]; }
      if (d.face && d.w > bestW) { bestW = d.w; face = d.face; }
    }
    if (face) q.face = face;
    return q;
  };

  /** Vida em repouso ("pausa viva" do corpo): deriva lenta de peso, cabeça e olhar. amp 1 é discreto. */
  G.fidget = function (t, { seed = 1, amp = 1 } = {}) {
    const d = Z(), k = t * 0.35;
    d.lean = 1.4 * amp * MK.noise(k, seed); d.nod = 1.8 * amp * MK.noise(k * 1.3 + 5, seed + 1);
    d.look = [0.22 * amp * MK.noise(k * 0.7 + 2, seed + 2), 0.12 * amp * MK.noise(k * 0.9 + 9, seed + 3)];
    d.armN = [0, 3 * amp * MK.noise(k * 1.1 + 4, seed + 4)]; d.armF = [0, 2.5 * amp * MK.noise(k * 0.8 + 6, seed + 5)];
    d.w = 1;
    return d;
  };
  /** Sim com a cabeça: n meneios de amp graus. */
  G.nod = function (t, t0, { n = 2, amp = 8, period = 0.32 } = {}) {
    t0 = timeOf(t0); const u = t - t0, dur = n * period;
    if (u < 0 || u > dur + 0.15) return Z();
    const d = Z(); d.nod = amp * Math.sin((2 * Math.PI * u) / period) * MK.window(u, 0, dur, 0.08, 0.15); d.w = 1; return d;
  };
  /** Não com a cabeça: o olhar e a virada oscilam. */
  G.shakeHead = function (t, t0, { n = 3, amp = 0.7, period = 0.28 } = {}) {
    t0 = timeOf(t0); const u = t - t0, dur = n * period;
    if (u < 0 || u > dur + 0.15) return Z();
    const d = Z(), s = Math.sin((2 * Math.PI * u) / period) * MK.window(u, 0, dur, 0.06, 0.15);
    d.look = [amp * s, 0]; d.turn = 0.12 * s; d.w = 1; return d;
  };
  /** Olhar rápido para `to` ([dx, dy] de −1 a 1), segurar e voltar: os olhos vão antes da cabeça. */
  G.glance = function (t, t0, { to = [0.8, -0.3], hold = 0.6, dur = MK.fr(6), back = 0.2, head = 0.25 } = {}) {
    t0 = timeOf(t0);
    const w = MK.window(t, t0, t0 + dur + hold, dur, back, "out");
    if (w <= 0) return Z();
    const d = Z(); d.look = [to[0] * w, to[1] * w]; d.nod = head * 10 * to[1] * w; d.turn = head * 0.2 * Math.abs(to[0]) * w; d.w = w; return d;
  };
  /** Double take: olha, desvia, cai a ficha e volta de supetão com susto. ~1,1 s a partir de t0. */
  G.take = function (t, t0, { dir = 1, amp = 1 } = {}) {
    t0 = timeOf(t0); const u = t - t0;
    if (u < 0 || u > 1.3) return Z();
    const d = Z();
    const away = MK.window(u, 0.05, 0.42, 0.1, 0.1), sink = MK.pulse(u, 0.5, 0.26), snap = MK.window(u, 0.56, 1.25, 0.06, 0.3);
    d.look = [-0.7 * dir * away + 0.9 * dir * snap, 0.1 * away - 0.25 * snap];
    d.turn = -0.15 * away + 0.1 * snap;
    d.nod = (6 * sink - 9 * snap) * amp; d.lean = (3 * sink - 7 * snap) * amp;
    d.brow = 0.9 * snap; d.eyeOpen = 0.3 * snap;
    d.armN = [12 * snap, 20 * snap]; d.armF = [10 * snap, 15 * snap];
    d.face = snap > 0.5 ? "surprised" : null; d.w = Math.max(away, sink, snap);
    return d;
  };
  /** Recua assustado: tronco para trás, braços sobem, depois assenta. */
  G.recoil = function (t, t0, { amp = 1, hold = 0.5 } = {}) {
    t0 = timeOf(t0);
    const w = MK.window(t, t0, t0 + 0.12 + hold, MK.fr(5), 0.45, "out");
    if (w <= 0) return Z();
    const d = Z(); d.lean = -14 * amp * w; d.nod = -6 * amp * w; d.armN = [62 * w, 100 * w]; d.armF = [55 * w, 95 * w];
    d.brow = 0.8 * w; d.eyeOpen = 0.25 * w; d.face = w > 0.5 ? "scared" : null; d.w = w; return d;
  };
  /** Encolhe (algo passou perto): cabeça afunda, olhos fecham, braços perto do rosto. ~0,4 s. */
  G.flinch = function (t, t0, { amp = 1 } = {}) {
    t0 = timeOf(t0);
    const w = MK.window(t, t0, t0 + 0.32, MK.fr(3), 0.22, "out");
    if (w <= 0) return Z();
    const d = Z(); d.nod = 11 * amp * w; d.lean = 5 * amp * w; d.eyeOpen = -0.8 * w; d.brow = 0.5 * w;
    d.armN = [50 * w, 120 * w]; d.armF = [40 * w, 110 * w]; d.w = w; return d;
  };
  /** Riso: cabeça balança, tronco vai para trás, boca abre em ondas. */
  G.laugh = function (t, t0, { dur = 1.2, amp = 1 } = {}) {
    t0 = timeOf(t0);
    const w = MK.window(t, t0, t0 + dur, 0.15, 0.3);
    if (w <= 0) return Z();
    const u = t - t0, d = Z();
    d.nod = (-6 + 5 * Math.sin(u * 2 * Math.PI * 5.5)) * amp * w; d.lean = -4 * amp * w;
    d.mouthOpen = (0.35 + 0.3 * Math.abs(Math.sin(u * 2 * Math.PI * 5.5))) * w; d.armN = [18 * w, 30 * w];
    d.face = w > 0.5 ? "joy" : null; d.w = w; return d;
  };
  /** Suspiro: ombros sobem (tronco), cabeça cai devagar, olhos meio fechados. ~1,4 s. */
  G.sigh = function (t, t0, { amp = 1 } = {}) {
    t0 = timeOf(t0); const u = t - t0;
    if (u < 0 || u > 1.6) return Z();
    const d = Z(), up = MK.pulse(u, 0.3, 0.6), down = MK.window(u, 0.45, 1.5, 0.35, 0.3);
    d.lean = (-3 * up + 3 * down) * amp; d.nod = (-4 * up + 9 * down) * amp; d.eyeOpen = -0.4 * down; d.brow = 0.3 * down;
    d.w = Math.max(up, down); return d;
  };
  /** Piscada forçada em t0 (reação): eyeOpen vai a 0 por 0,14 s. */
  G.blinkAt = function (t, t0) {
    t0 = timeOf(t0); const u = (t - t0) / 0.14;
    if (u < 0 || u > 1) return Z();
    const d = Z(); d.eyeOpen = -1.3 * Math.sin(Math.PI * u); d.w = 1; return d;
  };
  /** Batidinhas de cabeça de quem fala, entre t0 e t1 (junto com MK.talk / "say"). */
  G.talkBeats = function (t, t0, t1, seed = 1, { amp = 1 } = {}) {
    t0 = timeOf(t0); t1 = timeOf(t1);
    if (t < t0 || t > t1) return Z();
    const d = Z(), w = MK.window(t, t0, t1, 0.1, 0.15);
    d.nod = 2.2 * amp * w * MK.noise(t * 3.1, seed) + 1.2 * amp * w * Math.max(0, Math.sin(t * 2 * Math.PI * 1.7 + seed));
    d.lean = 1.2 * amp * w * MK.noise(t * 1.7 + 3, seed + 1); d.armN = [0, 4 * amp * w * MK.noise(t * 2.3, seed + 2)];
    d.w = w; return d;
  };
  /** Escala um gesto (para misturar meio gesto). */
  G.scale = sc;

  // ── câmera ──────────────────────────────────────────────────────────────────────────────────────────────────
  /** Empurrão: aproxima z× em dur·0,3 e volta no resto (na batida, no número que cai). Precisa de camera.js com dz. */
  A.punch = function (cam, t0, { z = 1.1, dur = 0.5, ease = "out" } = {}) {
    t0 = timeOf(t0);
    cam.to(t0, { dz: z }, dur * 0.3, ease);
    cam.to(t0 + dur * 0.3, { dz: 1 / z }, dur * 0.7, "inOut");
    return cam;
  };
  /** Deslocamento relativo da câmera (acompanha um gesto, "respira" para o lado da ação). */
  A.nudge = function (cam, t0, { dx = 0, dy = 0, dur = 0.6, ease = "inOut", back = null } = {}) {
    t0 = timeOf(t0);
    cam.to(t0, { dx, dy }, dur, ease);
    if (back !== null) cam.to(t0 + dur + back, { dx: -dx, dy: -dy }, dur * 1.3, "inOut");
    return cam;
  };

  /** {id: {x, y, w, h, v, name, snap}} de tudo o que está visível (caixa na camada, sem a câmera). Usado pelos diagnósticos de movimento. */
  A.boxes = function () {
    const out = {};
    if (!MK.scan) return out;
    for (const { e, L } of MK.scan.units()) {
      const v = MK.scan.visibility ? MK.scan.visibility(e) : 1;
      if (v < 0.05 || (MK.scan.shown && !MK.scan.shown(e))) continue;      // grupo cujas peças estão todas apagadas não conta
      let b;
      try { b = MK.layout.boxOf(e, L); } catch { continue; }
      if (!b || (!b.w && !b.h)) continue;
      const id = MK.scan.idOf ? MK.scan.idOf(e) : (e.__mkId || (e.__mkId = MK.uid("u")));
      // snap: marcado (ou todas as peças dentro marcadas); reveal: aparece por recorte ou traço (clip-path, stroke-dashoffset)
      let snap = !!e.closest("[data-mk-snap],[data-mk-ambient]");
      if (!snap) { const leaves = e.matches(GEOM) ? [e] : [...e.querySelectorAll(GEOM)]; snap = leaves.length > 0 && leaves.every((n) => n.closest("[data-mk-snap]")); }
      const reveal = !!(e.closest("[clip-path]") || e.querySelector("[clip-path],[stroke-dashoffset]") || e.hasAttribute("stroke-dashoffset"));
      out[id] = { x: b.x, y: b.y, w: b.w, h: b.h, v, name: MK.scan.nameOf ? MK.scan.nameOf(e) : (e.getAttribute("data-mk-name") || e.tagName),
                  snap, reveal, layer: L.id.slice(2) };
    }
    return out;
  };
})();
