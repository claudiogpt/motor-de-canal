/* weather.js — Clima procedural, relâmpagos, neve e poças. */
(function () {
  const MK = window.MK;
  const { el, attr } = MK;
  const hash = (i, s) => { const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); };

  /** Relâmpagos: raio quebrado com galhos, aceso só no clarão. opts {strikes: [t, …] ou [[t, x], …], y0, y1 (onde o
      raio termina: horizonte ou chão), color, width, seed}. draw(t); flash(t) → 0–1 (para o clarão e para acender a cena). */
  MK.lightning = function (parent, S, { strikes = [], y0 = -40, y1 = S.H * 0.62, color = "#F4F6FF", width = 6, seed = 9 } = {}) {
    const g = el("g", {}, parent);
    const list = strikes.map((s, k) => (Array.isArray(s) ? { t: s[0], x: s[1] } : { t: s, x: S.W * (0.15 + 0.7 * hash(k, seed)) }));
    // o clarão: pisca forte, apaga, pisca de novo e some (≈ 0,4 s)
    const pulse = (u) => (u < 0 || u > 0.45 ? 0 : u < 0.05 ? 1 : u < 0.09 ? 0.25 : u < 0.16 ? 0.9 : Math.max(0, 0.9 * (1 - (u - 0.16) / 0.29)));
    for (const [k, s] of list.entries()) {
      const r = MK.rand(seed * 31 + k), pts = [[s.x, y0]], N = 12;
      for (let i = 1; i <= N; i++) pts.push([pts[i - 1][0] + (r() - 0.5) * 90, y0 + ((y1 - y0) * i) / N]);
      let d = "M" + pts.map((p) => p.map((v) => v.toFixed(1)).join(",")).join("L");
      for (let b = 0; b < 3; b++) {                               // galhos saindo do tronco
        const i0 = 2 + Math.floor(r() * (N - 5)), dir = r() < 0.5 ? -1 : 1;
        let p = pts[i0];
        d += `M${p[0].toFixed(1)},${p[1].toFixed(1)}`;
        for (let j = 0; j < 4; j++) { p = [p[0] + dir * (25 + r() * 40), p[1] + (y1 - y0) / N * (0.6 + r() * 0.5)]; d += `L${p[0].toFixed(1)},${p[1].toFixed(1)}`; }
      }
      const sg = el("g", { opacity: 0 }, g);
      el("path", { d, fill: "none", stroke: color, strokeWidth: width * 5, strokeLinejoin: "round", strokeLinecap: "round", opacity: 0.18 }, sg);
      el("path", { d, fill: "none", stroke: color, strokeWidth: width * 2, strokeLinejoin: "round", strokeLinecap: "round", opacity: 0.35 }, sg);
      el("path", { d, fill: "none", stroke: "#FFFFFF", strokeWidth: width * 0.6, strokeLinejoin: "round", strokeLinecap: "round" }, sg);
      s.g = sg;
    }
    return { g, strikes: list,
      flash: (t) => list.reduce((m, s) => Math.max(m, pulse(t - s.t)), 0),
      draw(t) { for (const s of list) attr(s.g, { opacity: pulse(t - s.t) > 0.5 ? 1 : 0 }); } };
  };

  /** Clarão sobre a tela inteira (HTML acima do mundo, abaixo da interface): draw(t, intensidade 0–1). */
  MK.flashOverlay = function (S, { color = "#E8EEFF", max = 0.55, z = 23 } = {}) {
    const d = MK.layer(S.root, MK.uid("mk-flash"), z);
    d.style.pointerEvents = "none"; d.style.background = color; d.style.opacity = "0"; d.style.mixBlendMode = "screen";
    return { draw(t, k = 0) { d.style.opacity = (MK.clamp(k) * max).toFixed(3); } };
  };

  /** Chão molhado: brilho em degradê e poças que refletem o céu, com anéis quando chove.
      opts {y (chão), x0, x1, n (poças), seed, h (profundidade do brilho)}. draw(t, {amount (molhado 0–1), rain (0–1), sky (cor)}). */
  MK.puddles = function (parent, { y = 900, x0 = -400, x1 = 2400, n = 7, seed = 4, h = 260 } = {}) {
    const defs = MK.defs(parent.ownerSVGElement), g = el("g", {}, parent), r = MK.rand(seed);
    const id = MK.uid("wet"), lg = el("linearGradient", { id, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    const ws = [[0, 0.5], [1, 0]].map(([o, a]) => el("stop", { offset: o, stopOpacity: a, stopColor: "#BFD0E6" }, lg));
    const sheen = el("rect", { x: x0, y, width: x1 - x0, height: h, fill: `url(#${id})` }, g);
    const P = [];
    for (let i = 0; i < n; i++) {
      const cx = x0 + (x1 - x0) * ((i + 0.5) / n + (r() - 0.5) * 0.08), cy = y + h * (0.12 + 0.6 * r()), rx = 50 + 90 * r() * (0.6 + (cy - y) / h), ry = rx * (0.12 + 0.05 * r());
      const pool = el("ellipse", { cx, cy, rx, ry }, g);
      el("ellipse", { cx: cx - rx * 0.2, cy: cy - ry * 0.25, rx: rx * 0.45, ry: ry * 0.22, fill: "#FFFFFF", opacity: 0.35 }, g);
      const rings = [0, 1, 2].map(() => el("ellipse", { fill: "none", stroke: "#FFFFFF", strokeWidth: 1.6 }, g));
      P.push({ pool, rings, cx, cy, rx, ry, ph: r() });
    }
    return { g, draw(t, { amount = 1, rain = 1, sky = "#8FA3BF" } = {}) {
      attr(g, { opacity: MK.clamp(amount) });
      ws.forEach((s) => attr(s, { stopColor: MK.mixColor(sky, "#FFFFFF", 0.3) }));
      attr(sheen, { opacity: 0.6 });
      for (const p of P) {
        attr(p.pool, { fill: MK.mixColor(sky, "#FFFFFF", 0.15), opacity: 0.7 });
        p.rings.forEach((rg, k) => {
          const per = 0.8, c = t / per + p.ph + k / 3, cyc = Math.floor(c), f = c - cyc;
          const ox = (hash(cyc * 3 + k, p.cx) - 0.5) * p.rx * 1.2, oy = (hash(cyc * 5 + k, p.cy) - 0.5) * p.ry;
          attr(rg, { cx: p.cx + ox, cy: p.cy + oy, rx: 4 + p.rx * 0.28 * f, ry: 1.5 + p.ry * 0.5 * f, opacity: MK.clamp(rain) * (1 - f) * 0.8 });
        });
      }
    } };
  };

  /** Neve cobrindo o chão (sobe com amount): camada branca de topo ondulado, com montinhos. opts {y (chão), x0, x1,
      depth (altura máxima), seed, color}. draw(t, {amount}). */
  MK.snowCover = function (parent, { y = 900, x0 = -800, x1 = 2800, depth = 46, seed = 6, color = "#F4F7FB" } = {}) {
    const g = el("g", {}, parent), r = MK.rand(seed), N = 40, bumps = [];
    for (let i = 0; i <= N; i++) bumps.push(0.6 + 0.4 * r() + (r() < 0.12 ? 0.8 * r() : 0));
    const body = el("path", { fill: color }, g), shade = el("path", { fill: "#BFD0E6", opacity: 0.5 }, g);
    return { g, draw(t, { amount = 1 } = {}) {
      const a = MK.clamp(amount);
      if (a <= 0.001) return attr(g, { opacity: 0 });
      attr(g, { opacity: 1 });
      const pts = bumps.map((b, i) => [x0 + ((x1 - x0) * i) / N, y - depth * a * b]);
      attr(body, { d: MK.smoothPath(pts) + `L${x1},${y + 400}L${x0},${y + 400}Z` });
      attr(shade, { d: MK.smoothPath(pts.map(([x, yy]) => [x, yy + depth * a * 0.35])) + `L${x1},${y + 400}L${x0},${y + 400}Z` });
      g.appendChild(body);                                          // o corpo por cima da sombra: só a borda de baixo fica azulada
    } };
  };

  /** Ar quente tremendo perto do horizonte (miragem): faixas finas e claras que ondulam. opts {y, x0, x1, n, color,
      opacity, h}. draw(t, {amount}). */
  MK.heatHaze = function (parent, { y = 720, x0 = -800, x1 = 2800, n = 9, h = 90, color = "#FFF4DD", opacity = 0.22, seed = 8 } = {}) {
    const g = el("g", {}, parent), r = MK.rand(seed), L = [];
    for (let i = 0; i < n; i++) L.push({ p: el("path", { fill: "none", stroke: color, strokeWidth: 2 + 4 * r(), strokeLinecap: "round" }, g), y: y - h / 2 + h * r(), ph: r() * 6.3, f: 1.5 + 2 * r(), k: 0.3 + 0.7 * r() });
    return { g, draw(t, { amount = 1 } = {}) {
      attr(g, { opacity: MK.clamp(amount) * opacity });
      for (const l of L) {
        let d = "";
        for (let x = x0; x <= x1; x += 60) d += `${d ? "L" : "M"}${x},${(l.y + 3 * Math.sin(x * 0.02 + t * l.f + l.ph)).toFixed(1)}`;
        attr(l.p, { d, opacity: l.k * (0.5 + 0.5 * Math.sin(t * 0.8 + l.ph)) });
      }
    } };
  };

  // tom de cena e névoa extra de cada clima (somados ao do MK.env, proporcionais a amount)
  const LOOK = {
    rain: { tint: "#6E7F96", amount: 0.22, haze: 0.15, mist: "#C9D2DE", mistK: 0.35 },
    storm: { tint: "#4E5D78", amount: 0.3, haze: 0.22, mist: "#AAB4C4", mistK: 0.4 },
    snow: { tint: "#C8D6EA", amount: 0.1, haze: 0.2, mist: "#F2F5FA", mistK: 0.35 },
    dust: { tint: "#C9A06A", amount: 0.26, haze: 0.4, mist: "#D9B47A", mistK: 0.7 },
    heat: { tint: "#FFC27A", amount: 0.08, haze: 0.12, mist: "#FFE9C4", mistK: 0.25 },
  };

  /** Clima pronto (ver o topo do arquivo). Devolve {draw(t, {amount}), look(t) → {tint, amount, haze}, peças: far, near,
      ground, mist, bolt, flash}. Com env, o env.draw(t) já soma o tom e a névoa do clima. */
  MK.weather = function (S, st, kind, { env = null, wind = null, ground = S.H * 0.84, horizon = null, amount = 1, strikes = [], seed = 21 } = {}) {
    const val = (v, t) => (typeof v === "function" ? v(t) : v);
    const W = wind || (env && env.wind) || MK.wind({});
    const HZ = horizon ?? (env && env.horizon) ?? S.H * 0.66;
    const look = LOOK[kind] || LOOK.rain, L = st.L, X0 = -900, X1 = S.W + 900;
    const parts = {};
    const mk = (layer, o) => (L[layer] ? MK.particles(L[layer], S, { wind: W, x0: X0, x1: X1, seed: seed + Object.keys(parts).length * 7, ...o }) : null);
    if (kind === "rain" || kind === "storm") {
      const k = kind === "storm" ? 1.35 : 1;
      parts.far = mk("mid", { kind: "rain", depth: 0.55, n: Math.round(130 * k), y0: -500, y1: HZ + S.H * 0.12, opacity: 0.32 });
      parts.near = mk("front", { kind: "rain", depth: 1.25, n: Math.round(70 * k), y0: -500, y1: ground + 40, opacity: 0.55 });
      parts.ground = L.main ? MK.puddles(L.main, { y: ground, x0: X0, x1: X1, seed }) : null;
    } else if (kind === "snow") {
      parts.far = mk("mid", { kind: "snow", depth: 0.6, n: 130, y0: -400, y1: HZ + S.H * 0.15, opacity: 0.75 });
      parts.near = mk("front", { kind: "snow", depth: 1.4, n: 55, y0: -400, y1: S.H + 200 });
      parts.ground = L.main ? MK.snowCover(L.main, { y: ground, x0: X0 - 1000, x1: X1 + 1000, seed }) : null;
    } else if (kind === "dust") {
      parts.far = mk("mid", { kind: "sand", depth: 0.6, n: 110, y0: HZ - S.H * 0.35, y1: HZ + S.H * 0.15 });
      parts.near = mk("front", { kind: "sand", depth: 1.3, n: 60, y0: ground - S.H * 0.6, y1: ground + 60 });
      parts.motes = mk("front", { kind: "dust", depth: 1.2, n: 50, color: "#E8C690", y0: -200, y1: S.H + 100 });
    } else if (kind === "heat") {
      parts.ground = L.mid ? MK.heatHaze(L.mid, { y: HZ + 20, x0: X0, x1: X1, seed }) : null;
      parts.motes = mk("front", { kind: "dust", depth: 1, n: 30, color: "#FFF4DD", y0: -100, y1: S.H + 100 });
    }
    // céu encoberto (camada sky, por cima do sol, da lua e das estrelas): chuva, tempestade e neve fecham o céu; areia o amarela
    const cover = { rain: 0.8, storm: 0.92, snow: 0.7, dust: 0.75, heat: 0 }[kind] || 0;
    if (cover && L.sky) {
      const defs = MK.defs(st.svg), id = MK.uid("oc"), lg = el("linearGradient", { id, gradientUnits: "userSpaceOnUse", x1: 0, x2: 0, y1: -S.H * 0.1, y2: HZ + 40 }, defs);
      parts.overcastStops = [0, 1].map((o) => el("stop", { offset: o }, lg));
      parts.overcast = el("rect", { x: -S.W, y: -S.H * 1.5, width: S.W * 3, height: S.H * 4, fill: `url(#${id})`, opacity: 0 }, L.sky);
    }
    parts.mist = L.mid ? MK.mist(L.mid, S, { y: HZ + 30, h: kind === "dust" ? S.H * 0.5 : S.H * 0.22, color: look.mist, wind: W, opacity: look.mistK, seed }) : null;
    if (kind === "storm" && L.sky) {
      parts.bolt = MK.lightning(L.sky, S, { strikes, y1: HZ + 10, seed });
      parts.flash = MK.flashOverlay(S);
    }
    const w = {
      kind, parts,
      look(t) { const a = MK.clamp(val(amount, t)); return { tint: look.tint, amount: look.amount * a, haze: look.haze * a, flash: parts.bolt ? parts.bolt.flash(t) : 0 }; },
      draw(t, o = {}) {
        const a = MK.clamp(o.amount ?? val(amount, t));
        const M = env ? MK.daylight(env.hourAt(t)) : null;
        for (const k of ["far", "near", "motes"]) if (parts[k]) parts[k].draw(t, { amount: a, opacity: kind === "snow" || kind === "dust" || kind === "heat" ? MK.clamp(a * 2) : 1 });
        if (parts.ground) {
          if (kind === "rain" || kind === "storm") parts.ground.draw(t, { amount: MK.clamp(a * 1.5), rain: a, sky: M ? MK.mixColor(M.skyBot, "#7F8FA8", 0.5) : "#8FA3BF" });
          else parts.ground.draw(t, { amount: kind === "snow" ? MK.clamp(o.cover ?? a) : a });
        }
        if (parts.mist) parts.mist.draw(t, { amount: a });
        if (parts.overcast) {
          const base = kind === "dust" ? "#B89466" : kind === "snow" ? "#8E9AB0" : kind === "storm" ? "#3E485C" : "#6A768A";
          const dark = M ? 1 - 0.75 * M.night : 1;                       // de noite o céu encoberto também escurece
          attr(parts.overcastStops[0], { stopColor: MK.shade(base, -0.25 * (2 - dark)) });
          attr(parts.overcastStops[1], { stopColor: MK.mixColor(MK.shade(base, 0.25 * dark - 0.3 * (1 - dark)), look.mist, 0.3 * dark) });
          attr(parts.overcast, { opacity: cover * MK.clamp(a * 1.3) });
        }
        if (parts.bolt) { parts.bolt.draw(t); parts.flash.draw(t, parts.bolt.flash(t)); }
      },
    };
    if (env && env.addWeather) env.addWeather(w);
    return w;
  };
})();
