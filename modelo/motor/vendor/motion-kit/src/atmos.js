/* atmos.js — Céu, luz, vento, névoa, partículas e perspectiva atmosférica. */
(function () {
  const MK = window.MK;
  const { el, attr } = MK;

  MK.pebble = function (parent, x, y, s, seed, color = "#A8957A") {
    const r = MK.rand(seed);
    const d = MK.blob(x, y, s, { n: 7, wobble: 0.22, seed, sy: 0.62 });
    el("ellipse", { cx: x + s * 0.25, cy: y + s * 0.45, rx: s * 1.05, ry: s * 0.35, fill: "#3A2410", opacity: 0.22 }, parent);
    el("path", { d, fill: MK.shade(color, (r() - 0.5) * 0.25) }, parent);
    el("path", { d: MK.blob(x - s * 0.25, y - s * 0.2, s * 0.35, { n: 6, wobble: 0.2, seed: seed + 1, sy: 0.5 }), fill: "#FFFFFF", opacity: 0.28 }, parent);
  };

  /** Chão com detalhe: pedregulhos, tufos de capim seco, rachaduras, pegadas. kind: "sand" | "mud" | "dirt". */
  MK.groundDetail = function (parent, { y0 = 880, y1 = 1180, x0 = -900, x1 = 2900, kind = "sand", seed = 5, n = 1, color = null } = {}) {
    const g = el("g", {}, parent), r = MK.rand(seed);
    const base = color || (kind === "mud" ? "#3B2A1E" : kind === "dirt" ? "#B88E5E" : "#E9CF9C");
    const depth = (y) => 0.5 + 0.9 * (y - y0) / (y1 - y0);
    for (let i = 0; i < 40 * n; i++) { const y = y0 + r() * (y1 - y0), x = x0 + r() * (x1 - x0), s = depth(y); el("ellipse", { cx: x, cy: y, rx: (40 + r() * 110) * s, ry: (4 + r() * 6) * s, fill: MK.shade(base, r() < 0.5 ? -0.1 : 0.08), opacity: 0.5 }, g); }
    for (let i = 0; i < 26 * n; i++) { const y = y0 + 10 + r() * (y1 - y0), x = x0 + r() * (x1 - x0); MK.pebble(g, x, y, (5 + r() * 12) * depth(y), seed * 50 + i, kind === "mud" ? "#5C4330" : "#A8957A"); }
    if (kind !== "mud") for (let i = 0; i < 18 * n; i++) {
      const y = y0 + r() * (y1 - y0), x = x0 + r() * (x1 - x0), s = depth(y);
      let d = ""; for (let k = 0; k < 6; k++) { const a = -1.3 + k * 0.5 + (r() - 0.5) * 0.3, L = (16 + r() * 18) * s; d += `M${x.toFixed(0)},${y.toFixed(0)} q${(Math.sin(a) * L * 0.4).toFixed(1)},${(-L * 0.6).toFixed(1)} ${(Math.sin(a) * L).toFixed(1)},${(-L).toFixed(1)}`; }
      el("path", { d, fill: "none", stroke: r() < 0.5 ? "#9C8A4A" : "#7E7038", strokeWidth: 2.6 * s, strokeLinecap: "round" }, g);
    }
    if (kind === "mud") for (let i = 0; i < 14 * n; i++) {
      const y = y0 + r() * (y1 - y0), x = x0 + r() * (x1 - x0), s = depth(y);
      let d = `M${x.toFixed(0)},${y.toFixed(0)}`; for (let k = 0; k < 4; k++) d += ` l${((r() - 0.5) * 60 * s).toFixed(0)},${((r() - 0.2) * 14 * s).toFixed(0)}`;
      el("path", { d, fill: "none", stroke: "#1E140C", strokeWidth: 2.4 * s, opacity: 0.6 }, g);
    }
    return g;
  };

  /** Poeira dourada flutuando na luz (partículas que sobem e derivam devagar). */
  MK.dust = function (parent, S, { n = 40, seed = 3, x0 = -100, x1 = 2020, y0 = -50, y1 = 1130, color = "#FFF1C8", size = 3.2 } = {}) {
    const g = el("g", {}, parent), r = MK.rand(seed), ps = [];
    for (let i = 0; i < n; i++) ps.push({ e: el("circle", { r: size * (0.5 + r()), fill: color }, g), x: x0 + r() * (x1 - x0), y: y0 + r() * (y1 - y0), vx: 6 + r() * 14, vy: -4 - r() * 10, ph: r() * 6.28, a: 0.25 + 0.5 * r() });
    const W = x1 - x0, H = y1 - y0;
    return { g, draw(t) { for (const p of ps) { const x = x0 + ((p.x - x0 + p.vx * t + 20 * Math.sin(t * 0.7 + p.ph)) % W + W) % W, y = y0 + ((p.y - y0 + p.vy * t) % H + H) % H; attr(p.e, { cx: x.toFixed(1), cy: y.toFixed(1), opacity: (p.a * (0.6 + 0.4 * Math.sin(t * 1.7 + p.ph))).toFixed(2) }); } } };
  };

  /** Revoada distante (aves batendo asas), cruzando o céu. */
  MK.birds = function (parent, { n = 6, x = 200, y = 220, seed = 4, color = "#4A3A2A", s = 1 } = {}) {
    const g = el("g", {}, parent), r = MK.rand(seed), bs = [];
    for (let i = 0; i < n; i++) bs.push({ e: el("path", { fill: "none", stroke: color, strokeWidth: 3.2 * s, strokeLinecap: "round", strokeLinejoin: "round" }, g), dx: i * 52 * s + r() * 30, dy: (r() - 0.5) * 60 * s, ph: r() * 6.28, sz: (10 + r() * 6) * s });
    return { g, draw(t, { speed = 40 } = {}) { for (const b of bs) { const f = Math.sin(t * 9 + b.ph), w = b.sz, X = x + b.dx + speed * t, Y = y + b.dy + 6 * Math.sin(t * 0.8 + b.ph); attr(b.e, { d: `M${(X - w).toFixed(1)},${(Y - f * w * 0.5).toFixed(1)} Q${(X - w * 0.5).toFixed(1)},${(Y - w * 0.4 - f * 4).toFixed(1)} ${X.toFixed(1)},${Y.toFixed(1)} Q${(X + w * 0.5).toFixed(1)},${(Y - w * 0.4 - f * 4).toFixed(1)} ${(X + w).toFixed(1)},${(Y - f * w * 0.5).toFixed(1)}` }); } } };
  };

  /** Feixes de luz entrando de uma janela/porta alta (interiores). */
  MK.shafts = function (parent, { x = 1400, y = 200, w = 220, len = 1200, angle = 28, n = 3, color = "#FFF1C8", opacity = 0.16 } = {}) {
    const g = el("g", { transform: MK.tf(x, y, angle) }, parent), svg = parent.ownerSVGElement;
    const fill = MK.linear(svg, [[0, color, opacity], [1, color, 0]], { x1: 0, y1: 0, x2: 0, y2: 1 });
    for (let i = 0; i < n; i++) el("path", { d: `M${-w / 2 + i * w * 0.42},0 L${w / 2 + i * w * 0.42 - w * 0.5},0 L${w * 0.9 + i * w * 0.6},${len} L${-w * 0.2 + i * w * 0.6},${len}Z`, fill }, g);
    return g;
  };

  /** Acabamento de cinema (HTML preso à tela): luz quente/fria, vinheta e grão de filme leve que muda a cada quadro. */
  MK.grade = function (S, { tint = "#FFB36B", amount = 0.07, vignette = 0.42, grain = 0.05 } = {}) {
    const d = MK.layer(S.root, MK.uid("mk-grade"), 24);
    d.style.pointerEvents = "none";
    const tl = document.createElement("div"), vg = document.createElement("div"), gr = document.createElement("div");
    for (const e of [tl, vg, gr]) { Object.assign(e.style, { position: "absolute", inset: "0" }); d.appendChild(e); }
    tl.style.background = tint; tl.style.mixBlendMode = "multiply"; tl.style.opacity = String(amount * 1.2);
    vg.style.background = `radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 55%, rgba(20,10,0,${vignette}) 100%)`;
    const noise = `<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 1 0'/></filter><rect width='256' height='256' filter='url(%23n)'/></svg>`;
    gr.style.backgroundImage = `url("data:image/svg+xml;utf8,${noise.replace(/"/g, "'").replace(/</g, "%3C").replace(/>/g, "%3E")}")`;
    gr.style.mixBlendMode = "overlay"; gr.style.opacity = String(grain * 1.6);
    return { draw(t, o = {}) {
      const k = Math.floor(t * 12);
      gr.style.backgroundPosition = `${(k * 73) % 256}px ${(k * 151) % 256}px`;
      if (o.tint) tl.style.background = o.tint;
      if (o.amount !== undefined) tl.style.opacity = String(o.amount * 1.2);
    } };
  };
  // ════ hora do dia ════════════════════════════════════════════════════════════════════════════════════════════
  // a paleta (as mesmas chaves do MK.MOOD) passa de um clima ao outro conforme a hora; o tom de cena acompanha
  const DAY_KEYS = [[0, "night"], [4.6, "night"], [5.6, "dusk"], [6.6, "golden"], [8.2, "day"], [16.2, "day"], [17.8, "golden"],
                    [19.0, "dusk"], [20.2, "night"], [24, "night"]];
  const GRADE = { day: ["#FFFFFF", 0], golden: ["#FFB36B", 0.08], dusk: ["#7A5FB0", 0.2], night: ["#2E3F7A", 0.5] };
  // o céu tem chaves próprias: misturar o azul do dia com o laranja do pôr direto passa por cinza. No céu real o alto
  // continua azul (escurecendo para o violeta) enquanto só o horizonte esquenta.
  const SKY_KEYS = [[0, "#070B1C", "#1A2550"], [4.8, "#0B1230", "#26305E"], [5.6, "#2E2D6B", "#F08A6B"], [6.6, "#4A6FC0", "#FFC98A"],
                    [8.2, "#5FA8F0", "#BFE3FF"], [16.2, "#5FA8F0", "#BFE3FF"], [17.4, "#5B8FD6", "#FFE0A8"], [18.2, "#4A5FA8", "#FFB070"],
                    [19.0, "#2E2D6B", "#F08A6B"], [20.2, "#0B1230", "#26305E"], [24, "#070B1C", "#1A2550"]];
  /** Paleta da hora (0–24, aceita passar de 24): {skyTop, skyBot, sun, sunGlow, cloud, far, mid, near, ground, groundD,
      haze, shadow, light, tint, tintAmount, sunArc (0 nascente … 1 poente), sunElev (−…1), moonArc, moonElev,
      night (0 dia … 1 noite), hour, mood}. O sol nasce às 6 e se põe às 18. */
  MK.daylight = function (hour) {
    const h = ((hour % 24) + 24) % 24;
    let i = 0;
    while (i < DAY_KEYS.length - 2 && h >= DAY_KEYS[i + 1][0]) i++;
    const [h0, a] = DAY_KEYS[i], [h1, b] = DAY_KEYS[i + 1], u = MK.ease.sine((h - h0) / (h1 - h0));
    const M = MK.mix(MK.MOOD[a], MK.MOOD[b], u);
    let k = 0;
    while (k < SKY_KEYS.length - 2 && h >= SKY_KEYS[k + 1][0]) k++;
    const sa = SKY_KEYS[k], sb = SKY_KEYS[k + 1], su = MK.ease.sine((h - sa[0]) / (sb[0] - sa[0]));
    M.skyTop = MK.mixColor(sa[1], sb[1], su); M.skyBot = MK.mixColor(sa[2], sb[2], su);
    M.tint = MK.mixColor(GRADE[a][0], GRADE[b][0], u);
    M.tintAmount = GRADE[a][1] + (GRADE[b][1] - GRADE[a][1]) * u;
    M.sunArc = (h - 6) / 12;
    M.sunElev = Math.sin(Math.PI * MK.clamp(M.sunArc, -0.15, 1.15));
    M.moonArc = ((((h - 18) % 24) + 24) % 24) / 12;
    M.moonElev = Math.sin(Math.PI * MK.clamp(M.moonArc, -0.15, 1.15));
    M.night = 1 - MK.clamp((M.sunElev + 0.12) / 0.32);
    M.hour = h; M.mood = u < 0.5 ? a : b;
    return M;
  };

  /** Céu que acompanha a hora: degradê, brilho do horizonte do lado do sol, sol que desce alaranjando, lua e
      estrelas que aparecem à noite. Na camada sky (presa à tela). draw(M, t) com M = MK.daylight(hora).
      opts {horizon (y da linha do horizonte na tela), stars, sunR, moonR, seed}. Devolve {g, draw, sunPos, moonPos}. */
  MK.skyDome = function (parent, S, { horizon = S.H * 0.66, stars = 140, sunR = null, moonR = null, seed = 2 } = {}) {
    const svg = parent.ownerSVGElement, defs = MK.defs(svg), g = el("g", {}, parent);
    const W = S.W, H = S.H, sr = sunR || H * 0.07, mr = moonR || H * 0.05;
    const id = MK.uid("sky"), lg = el("linearGradient", { id, x1: 0, y1: -H * 0.15, x2: 0, y2: horizon + H * 0.05, gradientUnits: "userSpaceOnUse" }, defs);   // o alto do céu começa logo acima da tela
    const st = [0, 0.55, 1].map((o) => el("stop", { offset: o }, lg));
    el("rect", { x: -W, y: -H * 1.5, width: W * 3, height: H * 4, fill: `url(#${id})` }, g);
    // estrelas
    const r = MK.rand(seed), tw = [];
    const starG = el("g", {}, g);
    for (let i = 0; i < stars; i++) {
      const c = el("circle", { cx: -W * 0.2 + r() * W * 1.4, cy: horizon * (r() ** 1.4) * 0.92 - H * 0.05, r: 0.7 + 2.0 * r() ** 3, fill: "#fff" }, starG);
      tw.push([c, r() * 6.28, 0.35 + 0.65 * r(), 1.2 + 2.5 * r()]);
    }
    // brilho do horizonte (do lado do sol, forte no nascer e no pôr)
    const gid = MK.uid("hz"), rg = el("radialGradient", { id: gid, cx: 0.5, cy: 0.5, r: 0.5 }, defs);
    const gs = [[0, 0.75], [0.45, 0.3], [1, 0]].map(([o, a]) => el("stop", { offset: o, stopOpacity: a }, rg));
    const glow = el("ellipse", { fill: `url(#${gid})`, rx: W * 0.75, ry: H * 0.42 }, g);
    // sol: halo em três anéis (sem filtro, leve no render) e disco; lua com crateras
    const sunG = el("g", {}, g);
    const halo = [3.6, 2.3, 1.5].map((k, i) => el("circle", { r: sr * k, opacity: [0.12, 0.18, 0.28][i] }, sunG));
    const disc = el("circle", { r: sr }, sunG);
    const moonG = el("g", {}, g);
    el("circle", { r: mr * 2.6, fill: "#9FB4FF", opacity: 0.12 }, moonG);
    el("circle", { r: mr, fill: "#F4F1E0" }, moonG);
    for (const [dx, dy, k] of [[-0.3, -0.2, 0.2], [0.35, 0.25, 0.14], [0.1, -0.45, 0.09]]) el("circle", { cx: dx * mr, cy: dy * mr, r: k * mr, fill: "#000", opacity: 0.08 }, moonG);
    const arcPos = (u, e) => [W * (-0.05 + 1.1 * MK.clamp(u, -0.1, 1.1)), horizon - e * (horizon - H * 0.12)];
    const self = { g, sunPos: [0, 0], moonPos: [0, 0], draw(M, t = 0) {
      attr(st[0], { stopColor: M.skyTop }); attr(st[1], { stopColor: M.skyBot }); attr(st[2], { stopColor: MK.mixColor(M.skyBot, M.haze, 0.5) });
      const sp = arcPos(M.sunArc, M.sunElev), mp = arcPos(M.moonArc, M.moonElev);
      self.sunPos = sp; self.moonPos = mp;
      const low = MK.clamp(1 - M.sunElev * 2.2);                         // perto do horizonte: sol laranja e brilho largo
      const sc = MK.mixColor(M.sun, "#FF9A55", low * 0.85), gc = MK.mixColor(M.sunGlow, "#FF8A50", low * 0.6);
      attr(disc, { fill: sc }); halo.forEach((c) => attr(c, { fill: gc }));
      attr(sunG, { transform: MK.tf(sp[0], sp[1]), opacity: M.sunElev > -0.12 ? 1 : 0 });
      attr(moonG, { transform: MK.tf(mp[0], mp[1]), opacity: MK.clamp(M.night * 1.3) * (M.moonElev > -0.1 ? 1 : 0) });
      gs.forEach((s) => attr(s, { stopColor: gc }));
      attr(glow, { cx: sp[0], cy: horizon, opacity: MK.clamp(low * 1.2) * MK.clamp((M.sunElev + 0.18) / 0.18) * 0.9 });
      attr(starG, { opacity: M.night });
      for (const [c, ph, b, f] of tw) attr(c, { opacity: b * (0.65 + 0.35 * Math.sin(t * f + ph)) });
    } };
    return self;
  };

  // ════ vento ══════════════════════════════════════════════════════════════════════════════════════════════════
  /** Um vento para a cena inteira (grama, árvore, cabelo, névoa, partículas usam o mesmo, então tudo concorda).
      opts {base: força constante (0–1, ou função de t), gust: rajadas (0–1, ou função de t), dir: 1 (para a direita)
      ou −1, scale: tamanho da rajada em px, speed: rajadas por segundo, seed}.
      at(t, x) → força no ponto (≈ 0–1,5, com o sinal de dir); drift(t, x) → quanto um cisco solto andou até t (px). */
  MK.wind = function ({ base = 0.25, gust = 0.45, dir = 1, scale = 700, speed = 0.35, seed = 7 } = {}) {
    const val = (v, t) => (typeof v === "function" ? v(t) : v);
    const g01 = (t, x, s) => 0.5 * (1 + MK.noise(x / scale - t * speed, s));
    // integral da força-base (para o cisco que viaja): tabela de 0,05 s, montada sob demanda (função pura de t)
    const cum = [0], DT = 0.05;
    const integ = (t) => {
      if (typeof base !== "function") return base * t;
      const n = Math.max(0, Math.floor(t / DT));
      while (cum.length <= n + 1) { const k = cum.length; cum.push(cum[k - 1] + base((k - 0.5) * DT) * DT); }
      return cum[n] + (cum[n + 1] - cum[n]) * ((t - n * DT) / DT);
    };
    return {
      dir,
      at: (t, x = 0) => dir * (val(base, t) + val(gust, t) * g01(t, x, seed) * (0.8 + 0.4 * g01(t * 2.3, x * 1.7, seed + 3))),
      drift: (t, x = 0) => dir * (integ(t) * 140 + val(gust, t) * 70 * MK.noise(x / scale - t * speed, seed + 1)),
    };
  };

  // ════ o ambiente: céu, véus de distância, tom de cena e vento, tudo pela hora ═════════════════════════════════
  /** Ambiente da cena. Cria o céu (MK.skyDome) na camada sky, um véu da cor da névoa entre as camadas de fundo
      (o longe fica mais claro e mais da cor do ar: perspectiva atmosférica) e o tom de cena (MK.grade).
      opts {hour: número ou (t) => hora, haze: 0–1 ou (t) => …, wind: opções do MK.wind ou um MK.wind pronto,
            horizon, stars, sky: false (sem céu), veils: false (sem véus), grade: opções do MK.grade ou false}.
      env.draw(t, {tint, amount}) no draw; env.at(t) → {M (paleta da hora), haze, wind}; env.wind (para os outros);
      env.sun(t) → {x, elev, power} para a pose do MK.person (sombra pelo sol): p.draw({...pose, sun: env.sun(t)});
      env.paint(el, "far" | "mid" | "near" | "ground" | ..., {shade}) faz a cor do elemento seguir a paleta da hora. */
  MK.env = function (S, st, { hour = 12, haze = 0.5, wind = null, horizon = null, stars = 140, sky = true, veils = true, grade = {} } = {}) {
    const val = (v, t) => (typeof v === "function" ? v(t) : v);
    const H0 = horizon === null ? S.H * 0.66 : horizon;
    const W = wind && wind.at ? wind : MK.wind(wind || {});
    const dome = sky && st.L.sky ? MK.skyDome(st.L.sky, S, { horizon: H0, stars }) : null;
    const defs = MK.defs(st.svg), V = [];
    if (veils) for (const [name, under, before, k] of [["haze_far", "far", "mid", 1], ["haze_mid", "mid", "main", 0.42]]) {
      if (!st.L[under] || !st.L[before]) continue;
      const lay = st.layer(name, st.P[under], before);
      // o véu fica na faixa do horizonte: quase nada no alto do céu, cheio na linha do horizonte, metade abaixo dela
      const id = MK.uid("veil"), lg = el("linearGradient", { id, gradientUnits: "userSpaceOnUse", x1: 0, x2: 0, y1: H0 - S.H * 0.5, y2: H0 + S.H * 0.35 }, defs);
      const stops = [[0, 0], [0.6, 1], [1, 0.45]].map(([o, a]) => el("stop", { offset: o, stopOpacity: a }, lg));
      const r = el("rect", { x: -S.W * 3, y: -S.H * 3, width: S.W * 7, height: S.H * 7, fill: `url(#${id})`, opacity: 0 }, lay);
      V.push({ r, stops, k });
    }
    const gr = grade ? MK.grade(S, { tint: "#FFFFFF", amount: 0, ...grade }) : null;
    const painted = [], weathers = [];
    let last = null;
    const env = {
      wind: W, dome, horizon: H0,
      hourAt: (t) => val(hour, t),
      addWeather(w) { weathers.push(w); return w; },
      at(t) { const M = MK.daylight(val(hour, t)); return { M, haze: val(haze, t), wind: W }; },
      sun(t) {
        const M = last && last.t === t ? last.M : MK.daylight(val(hour, t));
        const day = MK.clamp(M.sunElev * 3) * (1 - M.night), moon = 0.3 * M.night * MK.clamp(M.moonElev * 3);
        const arc = day >= moon ? M.sunArc : M.moonArc, elev = day >= moon ? M.sunElev : M.moonElev;
        return { x: MK.clamp(1 - 2 * arc, -1, 1), elev: MK.clamp(elev), power: Math.max(day, moon),
                 color: day >= moon ? MK.mixColor(M.sun || "#FFE9B8", "#FFFFFF", 0.35) : "#BFD4FF" };   // cor do lado iluminado
      },
      paint(e, key, { shade = 0 } = {}) { const node = e && e.g && !(e instanceof Element) ? e.g : e; painted.push([node, key, shade]); return e; },
      draw(t, extra = {}) {
        const A = env.at(t), M = A.M;
        last = { t, M };
        // climas ligados (weather.js): somam névoa e puxam o tom de cena para o deles
        let tint = M.tint, amt = M.tintAmount;
        for (const w of weathers) {
          const L = w.look(t);
          if (L.amount > 0) { tint = MK.mixColor(tint, L.tint, L.amount / (amt + L.amount)); amt = Math.min(0.62, amt + L.amount); }
          A.haze += L.haze;
        }
        if (dome) dome.draw(M, t);
        for (const v of V) {
          v.stops.forEach((s) => attr(s, { stopColor: M.haze }));
          attr(v.r, { opacity: MK.clamp(A.haze) * v.k * (0.55 - 0.25 * M.night) });   // haze > 1 (chuva, areia) satura no véu cheio
        }
        for (const [e, key, sh] of painted) if (M[key]) attr(e, { fill: sh ? MK.shade(M[key], sh) : M[key] });
        if (gr) gr.draw(t, { tint: extra.tint || tint, amount: extra.amount ?? amt });
        return A;
      },
    };
    return env;
  };

  // ════ névoa em faixas, raios de luz ══════════════════════════════════════════════════════════════════════════
  /** Névoa numa faixa (vale, chão, rio de manhã, fumaça parada num salão): base em degradê mais nuvens macias que
      andam com o vento. opts {y (meio da faixa), h (altura), x0, x1, color, opacity, n, seed, wind, speed}.
      draw(t, {amount (0–1), color}). */
  MK.mist = function (parent, S, { y = 800, h = 180, x0 = -1200, x1 = 3200, color = "#FFFFFF", opacity = 0.5, n = 12, seed = 5, wind = null, speed = 14 } = {}) {
    const defs = MK.defs(parent.ownerSVGElement), g = el("g", {}, parent), r = MK.rand(seed);
    const bid = MK.uid("mb"), bl = el("linearGradient", { id: bid, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    const bs = [[0, 0], [0.5, 0.75], [1, 0]].map(([o, a]) => el("stop", { offset: o, stopOpacity: a, stopColor: color }, bl));
    el("rect", { x: x0, y: y - h / 2, width: x1 - x0, height: h, fill: `url(#${bid})` }, g);
    const pid = MK.uid("mp"), rg = el("radialGradient", { id: pid }, defs);
    const ps = [[0, 0.85], [0.55, 0.4], [1, 0]].map(([o, a]) => el("stop", { offset: o, stopOpacity: a, stopColor: color }, rg));
    const span = x1 - x0, puffs = [];
    for (let i = 0; i < n; i++) {
      const w = h * (2.2 + 2.2 * r());
      puffs.push({ e: el("ellipse", { rx: w / 2, ry: h * (0.32 + 0.3 * r()), fill: `url(#${pid})` }, g), base: span * (i / n + 0.06 * r()),
                   dy: (r() - 0.5) * h * 0.5, v: speed * (0.6 + 0.8 * r()), ph: r() * 6.3, k: 0.6 + 0.4 * r() });
    }
    let col = color;
    return { g, draw(t, { amount = 1, color: c } = {}) {
      if (c && c !== col) { col = c; bs.concat(ps).forEach((s) => attr(s, { stopColor: c })); }
      attr(g, { opacity: MK.clamp(amount) * opacity });
      for (const p of puffs) {
        const dx = p.v * t + (wind ? wind.drift(t, p.base) * 0.35 : 0);
        const x = x0 + ((((p.base + dx) % span) + span) % span);
        attr(p.e, { cx: x, cy: y + p.dy + 8 * Math.sin(t * 0.35 + p.ph), opacity: p.k * (0.8 + 0.2 * Math.sin(t * 0.25 + p.ph)) });
      }
    } };
  };

  /** Raios de luz saindo de um ponto (sol atrás de nuvem ou de árvore, janela alta), com brilho que respira.
      opts {from: [x, y], angle (graus; 90 = para baixo, 180 = para a esquerda), spread (graus de abertura), n, len,
      color, opacity, seed}. draw(t, {from, angle, opacity}). */
  MK.godrays = function (parent, { from = [1500, 200], angle = 110, spread = 46, n = 7, len = 1500, color = "#FFF1C8", opacity = 0.16, seed = 3 } = {}) {
    const defs = MK.defs(parent.ownerSVGElement), g = el("g", {}, parent), r = MK.rand(seed);
    const id = MK.uid("gr"), lg = el("linearGradient", { id, gradientUnits: "userSpaceOnUse", x1: 0, y1: 0, x2: 0, y2: len }, defs);
    el("stop", { offset: 0, stopColor: color, stopOpacity: 1 }, lg); el("stop", { offset: 1, stopColor: color, stopOpacity: 0 }, lg);
    const rays = [];
    for (let i = 0; i < n; i++) {
      const a = (-spread / 2 + spread * (n > 1 ? i / (n - 1) : 0.5) + ((r() - 0.5) * spread) / n) * MK.deg, w = ((0.2 + 0.35 * r()) * spread / n) * MK.deg;   // raios finos com vão entre eles (largos viram um véu)
      const p = el("path", { d: `M0,0 L${(Math.sin(a - w / 2) * len).toFixed(1)},${(Math.cos(a - w / 2) * len).toFixed(1)} L${(Math.sin(a + w / 2) * len).toFixed(1)},${(Math.cos(a + w / 2) * len).toFixed(1)}Z`, fill: `url(#${id})` }, g);
      rays.push({ p, ph: r() * 6.3, f: 0.25 + 0.35 * r() });
    }
    return { g, draw(t, o = {}) {
      const F = o.from || from, A = (o.angle ?? angle) - 90 + 1.5 * Math.sin(t * 0.13);
      attr(g, { transform: `translate(${F[0].toFixed(1)} ${F[1].toFixed(1)}) rotate(${A.toFixed(2)})`, opacity: o.opacity ?? opacity });
      for (const q of rays) attr(q.p, { opacity: 0.55 + 0.45 * Math.sin(t * q.f + q.ph) });
    } };
  };

  // ════ partículas ═════════════════════════════════════════════════════════════════════════════════════════════
  const hash = (i, s) => { const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); };
  const KIND = {
    rain: { n: 160, speed: 1700, size: 34, color: "#C9D6E8", opacity: 0.55, windK: 0.35 },
    snow: { n: 140, speed: 85, size: 7, color: "#FFFFFF", opacity: 0.9, windK: 1 },
    ash: { n: 90, speed: 45, size: 4, color: "#B9B4AE", opacity: 0.8, windK: 1 },
    dust: { n: 70, speed: 18, size: 3.2, color: "#FFF1C8", opacity: 0.6, windK: 1.4 },
    sand: { n: 120, speed: 30, size: 22, color: "#D9B47A", opacity: 0.45, windK: 3 },
    embers: { n: 40, speed: 110, size: 4.5, color: "#FF9A3C", opacity: 1, windK: 1.6 },
    leaves: { n: 22, speed: 70, size: 16, color: "#D9822B", opacity: 1, windK: 2 },
    smoke: { n: 14, speed: 60, size: 40, color: "#8D8A86", opacity: 0.4, windK: 1 },
    sparks: { n: 26, speed: 520, size: 10, color: "#FFE08A", opacity: 1, windK: 0.3 },
  };
  /** Partículas sem estado (cada uma é fórmula de t: o vídeo pode pular para qualquer quadro).
      kind: "rain" (traços na direção da queda, respingo no chão) · "snow" · "ash" · "dust" (ciscos de luz) · "sand"
      (rajada de areia em traços deitados) · "embers" (brasas subindo, brilham e esfriam) · "leaves" (folhas girando)
      · "smoke" (fumaça de uma fonte: emitter) · "sparks" (faíscas de uma fonte, com gravidade).
      opts {n, x0, x1, y0, y1 (área; y1 = chão para chuva e neve), emitter: [x, y] (smoke, sparks, embers), wind,
            speed, size, color, opacity, seed, depth (0,5 = longe e pequeno … 1,5 = perto e grande)}.
      draw(t, {amount (0–1: fração das partículas; a chuva começa fina e engrossa), opacity}).
      Profundidade: ponha uma em st.L.mid (depth 0,6) e outra em st.L.front (depth 1,4), ou use MK.weather. */
  MK.particles = function (parent, S, o = {}) {
    const kind = o.kind || "dust", K = KIND[kind] || KIND.dust;
    const { n = K.n, x0 = -200, x1 = S.W + 200, y0 = -100, y1 = S.H, emitter = null, wind = null, seed = 11, depth = 1 } = o;
    const speed = (o.speed ?? K.speed) * depth, size = (o.size ?? K.size) * depth, color = o.color || K.color, opacity = o.opacity ?? K.opacity;
    const defs = MK.defs(parent.ownerSVGElement), g = el("g", {}, parent), span = x1 - x0, hgt = y1 - y0;
    const ps = [];
    let glowId = null, smokeId = null;
    if (kind === "embers" || kind === "sparks") {
      glowId = MK.uid("eg"); const rg = el("radialGradient", { id: glowId }, defs);
      el("stop", { offset: 0, stopColor: color, stopOpacity: 0.9 }, rg); el("stop", { offset: 1, stopColor: color, stopOpacity: 0 }, rg);
    }
    if (kind === "smoke") {
      smokeId = MK.uid("sm"); const rg = el("radialGradient", { id: smokeId }, defs);
      for (const [of, a] of [[0, 0.9], [0.6, 0.5], [1, 0]]) el("stop", { offset: of, stopColor: color, stopOpacity: a }, rg);
    }
    const leafD = (s) => `M0,${-s}C${s * 0.7},${-s * 0.5} ${s * 0.7},${s * 0.5} 0,${s}C${-s * 0.7},${s * 0.5} ${-s * 0.7},${-s * 0.5} 0,${-s}Z`;
    for (let i = 0; i < n; i++) {
      const q = { i, u: hash(i, seed), ph: hash(i, seed + 1), k: 0.7 + 0.6 * hash(i, seed + 2), s: 0.6 + 0.8 * hash(i, seed + 3) };
      if (kind === "rain") { q.e = el("line", { stroke: color, strokeWidth: Math.max(1, 2.2 * depth * q.s), strokeLinecap: "round" }, g); q.sp = el("ellipse", { fill: "none", stroke: color, strokeWidth: 1.5 * depth }, g); }
      else if (kind === "sand") q.e = el("line", { stroke: color, strokeWidth: 2.4 * depth * q.s, strokeLinecap: "round" }, g);
      else if (kind === "leaves") q.e = el("path", { d: leafD(size * q.s), fill: MK.shade([color, "#C9A23A", "#A8452B", "#7E9A3A"][i % 4], (q.u - 0.5) * 0.2) }, g);
      else if (kind === "smoke") q.e = el("circle", { fill: `url(#${smokeId})` }, g);
      else if (kind === "sparks") q.e = el("line", { stroke: color, strokeWidth: 2.4 * depth, strokeLinecap: "round" }, g);
      else { if (glowId) q.h = el("circle", { r: size * 3.2 * q.s, fill: `url(#${glowId})` }, g); q.e = el("circle", { r: size * q.s * (kind === "snow" ? 1 : 0.8), fill: color }, g); }
      ps.push(q);
    }
    const wrapX = (x) => x0 + ((((x - x0) % span) + span) % span);
    const wd = (t, x, k) => (wind ? wind.drift(t, x) * k * K.windK * depth : 0);
    const wa = (t, x) => (wind ? wind.at(t, x) : 0);
    return { g, draw(t, { amount = 1, opacity: op = 1 } = {}) {
      attr(g, { opacity: opacity * op });
      for (const q of ps) {
        if (q.u * 0.999 >= MK.clamp(amount)) {                      // só a fração "amount" das partículas aparece
          attr(q.e, { opacity: 0 }); if (q.sp) attr(q.sp, { opacity: 0 }); if (q.h) attr(q.h, { opacity: 0 });
          continue;
        }
        if (kind === "rain") {
          const v = speed * q.k, T = hgt / v, c = t / T + q.ph, cyc = Math.floor(c), f = c - cyc;
          const xb = x0 + span * hash(q.i * 7.13 + cyc * 1.71, seed), slant = wa(t, xb) * 0.45;
          const y = y0 + f * hgt, x = wrapX(xb + slant * (y - y0)), L = size * q.s;
          attr(q.e, { x1: x, y1: y, x2: x - slant * L, y2: y - L, opacity: 1 });
          const fs = f / 0.1;                                           // respingo: o pingo do ciclo anterior bateu no chão
          if (fs < 1) {
            const xp = wrapX(x0 + span * hash(q.i * 7.13 + (cyc - 1) * 1.71, seed) + slant * hgt);
            attr(q.sp, { cx: xp, cy: y1, rx: 4 + 16 * depth * fs, ry: 1.5 + 4 * depth * fs, opacity: 1 - fs });
          } else attr(q.sp, { opacity: 0 });
        } else if (kind === "snow" || kind === "ash" || kind === "dust") {
          const v = speed * q.k, T = hgt / v, c = t / T + q.ph, f = c - Math.floor(c), xb = x0 + span * q.u;
          const x = wrapX(xb + wd(t, xb, q.k) + 26 * depth * Math.sin(t * (0.6 + q.s) + q.ph * 6.3));
          const y = kind === "dust" ? y0 + ((((q.ph * hgt - 8 * t * q.k) % hgt) + hgt) % hgt) : y0 + f * hgt;
          const tw = kind === "dust" ? 0.45 + 0.55 * Math.sin(t * 1.7 * q.s + q.ph * 6.3) : 1;
          attr(q.e, { cx: x, cy: y, opacity: tw * (kind === "snow" ? 0.7 + 0.3 * q.s : 1) });
        } else if (kind === "sand") {
          const v = speed * q.k, xb = x0 + span * q.u, w = wa(t, xb);
          const x = wrapX(xb + wd(t, xb, q.k) + v * t), y = y0 + hgt * q.ph + 10 * Math.sin(t * 2 + q.u * 9), L = size * q.s * (0.5 + Math.abs(w));
          attr(q.e, { x1: x, y1: y, x2: x - Math.sign(w || 1) * L, y2: y + L * 0.06, opacity: 0.4 + 0.6 * MK.clamp(Math.abs(w)) });
        } else if (kind === "leaves") {
          const v = speed * q.k, T = hgt / v, c = t / T + q.ph, f = c - Math.floor(c), xb = x0 + span * q.u;
          const x = wrapX(xb + wd(t, xb, q.k) + 60 * depth * Math.sin(t * 0.9 + q.ph * 6.3)), y = y0 + f * hgt;
          const rot = 180 * Math.sin(t * (1 + q.s) + q.ph * 6.3), flip = Math.cos(t * (1.6 + q.s) + q.u * 6.3);
          attr(q.e, { transform: `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${flip.toFixed(3)} 1)`, opacity: 1 });
        } else if (kind === "embers") {
          const E = emitter || [S.W / 2, y1], v = speed * q.k, life = hgt / v, c = t / life + q.ph, cyc = Math.floor(c), f = c - cyc;
          const xb = E[0] + (hash(q.i + cyc * 3.1, seed) - 0.5) * (emitter ? 80 : span);
          const x = xb + wd(t, xb, q.k) * f * 0.6 + 30 * depth * Math.sin(t * 2.2 + q.ph * 6.3), y = E[1] - f * hgt;
          const heat = 1 - f, fl = 0.6 + 0.4 * Math.sin(t * 13 * q.s + q.ph * 20);
          attr(q.e, { cx: x, cy: y, fill: MK.mixColor(MK.mixColor("#B8301A", color, heat), "#FFF2C0", heat * 0.5), opacity: heat * fl });
          attr(q.h, { cx: x, cy: y, opacity: heat * fl * 0.8 });
        } else if (kind === "smoke") {
          const E = emitter || [S.W / 2, y1], life = hgt / speed, c = t / life + q.i / n, cyc = Math.floor(c), f = c - cyc;
          const x = E[0] + (wind ? wind.at(t, E[0]) * 220 * f * f : 0) + 40 * f * Math.sin(t * 0.7 + q.ph * 6.3 + cyc);
          attr(q.e, { cx: x, cy: E[1] - f * hgt, r: size * (0.4 + 2.6 * f) * q.s, opacity: MK.clamp(f * 6) * (1 - f) });
        } else if (kind === "sparks") {
          const E = emitter || [S.W / 2, y1], life = 0.9, c = t / life + q.ph, cyc = Math.floor(c), f = c - cyc, tt = f * life;
          const a = -Math.PI / 2 + (hash(q.i + cyc * 5.3, seed) - 0.5) * 2.2, v = speed * q.k;
          const x = E[0] + Math.cos(a) * v * tt, y = E[1] + Math.sin(a) * v * tt + 700 * tt * tt;
          const vx = Math.cos(a) * v, vy = Math.sin(a) * v + 1400 * tt, vl = Math.hypot(vx, vy) || 1, L = size * 2.2 * q.s;
          attr(q.e, { x1: x, y1: y, x2: x - (vx / vl) * L, y2: y - (vy / vl) * L, opacity: 1 - f });
        }
      }
    } };
  };
})();
