/* scenery.js — Elementos de cenário configuráveis: exteriores, interiores e iluminação. */
(function () {
  const MK = window.MK;
  const { el, attr } = MK;

  MK.MOOD = {
    day: { skyTop: "#5FA8F0", skyBot: "#BFE3FF", sun: "#FFF4C2", sunGlow: "#FFFFFF", cloud: "#FFFFFF", far: "#9DC3E6",
           mid: "#6DB88A", near: "#4E9E6E", ground: "#5DAA6B", groundD: "#468C55", haze: "#D6ECFF", shadow: "#1B3A2A", light: 0 },
    golden: { skyTop: "#F7A35C", skyBot: "#FFE0A3", sun: "#FFF1C9", sunGlow: "#FFD27A", cloud: "#FFE6D0", far: "#D9927A",
              mid: "#B98A5E", near: "#8E7A45", ground: "#9C8A4A", groundD: "#7D6E38", haze: "#FFD9A8", shadow: "#3A2A18", light: 0.1 },
    dusk: { skyTop: "#2E2D6B", skyBot: "#F08A6B", sun: "#FFD2A0", sunGlow: "#FF9A6B", cloud: "#E9A1A8", far: "#5A4C80",
            mid: "#3F3C6B", near: "#2C2B50", ground: "#33325A", groundD: "#25244A", haze: "#C27A8A", shadow: "#120F2A", light: 0.2 },
    night: { skyTop: "#070B1C", skyBot: "#1A2550", sun: "#F4F1E0", sunGlow: "#9FB4FF", cloud: "#2A3360", far: "#1D2547",
             mid: "#161D3A", near: "#10162E", ground: "#141A33", groundD: "#0D1226", haze: "#26305E", shadow: "#000000", light: 0.35 },
    overcast: { skyTop: "#8C9BB0", skyBot: "#C9D2DE", sun: "#F2F2F2", sunGlow: "#FFFFFF", cloud: "#E4E8EE", far: "#9AA7B8",
                mid: "#7E9A86", near: "#64806C", ground: "#6E8C70", groundD: "#577058", haze: "#C9D2DE", shadow: "#2A3330", light: 0.05 },
    indoor: { wall: "#F1E4CF", wallD: "#E2D0B5", floor: "#C99A6B", floorD: "#B0835A", trim: "#FFFFFF", shadow: "#3A2A1A", light: 0 },
  };

  /** Céu em degradê (retângulo grande, na camada sky). opts: {mood, top, bottom, x, y, w, h, stars, seed}. */
  MK.sky = function (parent, S, { mood = "day", top, bottom, w = S.W * 3, h = S.H * 3, stars = 0, seed = 2 } = {}) {
    const M = MK.MOOD[mood] || MK.MOOD.day, svg = parent.ownerSVGElement;
    const g = el("g", {}, parent);
    const fill = MK.linear(svg, [[0, top || M.skyTop], [0.62, bottom || M.skyBot]], { x1: 0, y1: 0, x2: 0, y2: 1 });
    el("rect", { x: S.W / 2 - w / 2, y: S.H / 2 - h / 2 - S.H * 0.2, width: w, height: h, fill }, g);
    const tw = [];
    if (stars) {
      const r = MK.rand(seed);
      for (let i = 0; i < stars; i++) {
        const c = el("circle", { cx: S.W / 2 + (r() - 0.5) * w * 0.6, cy: S.H * (r() * 0.7 - 0.2), r: 0.8 + 2.2 * r() ** 3, fill: "#fff" }, g);
        tw.push([c, r() * 6.28, 0.3 + 0.6 * r()]);
      }
    }
    return { g, draw(t) { for (const [c, ph, b] of tw) attr(c, { opacity: b * (0.75 + 0.25 * Math.sin(t * 2.1 + ph)) }); } };
  };

  /** Sol (ou lua, com moon: true): disco com halo. */
  MK.sun = function (parent, { x, y, r = 90, mood = "day", color, glow, moon = false, rays = false } = {}) {
    const M = MK.MOOD[mood] || MK.MOOD.day, svg = parent.ownerSVGElement;
    const g = el("g", {}, parent);
    const c = color || M.sun, gl = glow || M.sunGlow;
    el("circle", { cx: x, cy: y, r: r * 4.2, fill: MK.radial(svg, [[0, gl, 0.55], [0.35, gl, 0.18], [1, gl, 0]]) }, g);
    el("circle", { cx: x, cy: y, r, fill: c }, g);
    if (moon) {
      el("circle", { cx: x - r * 0.3, cy: y - r * 0.2, r: r * 0.18, fill: "#000", opacity: 0.07 }, g);
      el("circle", { cx: x + r * 0.35, cy: y + r * 0.25, r: r * 0.12, fill: "#000", opacity: 0.07 }, g);
      el("circle", { cx: x + r * 0.1, cy: y - r * 0.45, r: r * 0.08, fill: "#000", opacity: 0.07 }, g);
    }
    const rr = [];
    if (rays) for (let i = 0; i < 12; i++) rr.push(el("path", { fill: c, opacity: 0.25 }, g));
    return { g, draw(t) {
      rr.forEach((p, i) => {
        const a = (i / 12) * 2 * Math.PI + t * 0.1, a2 = a + 0.09;
        const r0 = r * 1.25, r1 = r * (1.75 + 0.12 * Math.sin(t * 2 + i));
        attr(p, { d: `M${x + Math.cos(a) * r0},${y + Math.sin(a) * r0}L${x + Math.cos(a + 0.045) * r1},${y + Math.sin(a + 0.045) * r1}L${x + Math.cos(a2) * r0},${y + Math.sin(a2) * r0}Z` });
      });
    } };
  };

  /** Uma nuvem fofa (grupo de bolhas com base achatada). Devolve o <g> (mova com transform). */
  MK.cloud = function (parent, { x = 0, y = 0, w = 320, color = "#fff", seed = 1, opacity = 0.95, shade = 0.07 } = {}) {
    const r = MK.rand(seed), g = el("g", { transform: MK.tf(x, y), opacity }, parent);
    const n = 4 + Math.floor(r() * 3), puffs = [];
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1), px = (u - 0.5) * w * 0.8, pr = w * (0.16 + 0.14 * Math.sin(Math.PI * u) + 0.05 * r());
      puffs.push([px, -pr * 0.55, pr]);
    }
    el("path", { d: puffs.map(([px, py, pr]) => `M${px - pr},${py}a${pr},${pr} 0 1,0 ${2 * pr},0a${pr},${pr} 0 1,0 ${-2 * pr},0`).join("") +
      MK.rrect(-w * 0.5, -w * 0.12, w, w * 0.16, w * 0.08), fill: MK.shade(color, -shade) }, g);
    el("path", { d: puffs.map(([px, py, pr]) => `M${px - pr * 0.92},${py - pr * 0.08}a${pr * 0.92},${pr * 0.92} 0 1,0 ${2 * pr * 0.92},0a${pr * 0.92},${pr * 0.92} 0 1,0 ${-2 * pr * 0.92},0`).join(""), fill: color }, g);
    return g;
  };

  /** Várias nuvens que andam devagar (vai e volta em S.dur: o último quadro bate com o primeiro). */
  MK.clouds = function (parent, S, { n = 5, y0 = 120, y1 = 600, x0 = -400, x1 = null, w0 = 220, w1 = 420, color = "#fff",
                                     speed = 18, seed = 3, opacity = 0.95 } = {}) {
    x1 = x1 === null ? S.W + 400 : x1;
    const r = MK.rand(seed), cs = [];
    for (let i = 0; i < n; i++) {
      const w = w0 + (w1 - w0) * r(), x = x0 + ((x1 - x0) * (i + r() * 0.7)) / n, y = y0 + (y1 - y0) * r();
      cs.push({ g: MK.cloud(parent, { x, y, w, color, seed: seed * 31 + i, opacity: opacity * (0.75 + 0.25 * r()) }), x, y, v: speed * (0.6 + 0.8 * r()) * (w / w1) });
    }
    return { g: parent, draw(t) {
      for (const c of cs) attr(c.g, { transform: MK.tf(c.x + ((c.v * S.dur) / Math.PI) * Math.sin((Math.PI * t) / S.dur), c.y) });
    } };
  };

  /** Faixa de colinas (silhueta suave com ruído): opts {y (base), amp, color, seed, x0, x1, n, top (cor no topo)}. */
  MK.hills = function (parent, { y = 1300, amp = 120, color = "#6DB88A", top = null, seed = 4, x0 = -1200, x1 = 2400, n = 9,
                                 bottom = 4000, sharp = false } = {}) {
    const r = MK.rand(seed), pts = [];
    for (let i = 0; i <= n; i++) {
      const x = x0 + ((x1 - x0) * i) / n;
      pts.push([x, y - amp * (sharp ? (i % 2 ? 1 : 0.25) * (0.6 + 0.6 * r()) : 0.45 + 0.55 * r())]);
    }
    const svg = parent.ownerSVGElement;
    const fill = top ? MK.linear(svg, [[0, top], [1, color]], { x1: 0, y1: 0, x2: 0, y2: 1 }) : color;
    const d = (sharp ? "M" + pts.map((p) => p.join(",")).join("L") : MK.smoothPath(pts)) + `L${x1},${bottom}L${x0},${bottom}Z`;
    return { g: el("path", { d, fill }, parent), pts };
  };

  /** Montanhas pontudas com neve: opts {y, amp, color, snow, seed, x0, x1, n}. */
  MK.mountains = function (parent, { y = 1100, amp = 420, color = "#7D8FB3", snow = "#F4F7FB", seed = 9, x0 = -1200, x1 = 2400, n = 7 } = {}) {
    const r = MK.rand(seed), g = el("g", {}, parent);
    const peaks = [];
    for (let i = 0; i < n; i++) {
      const cx = x0 + ((x1 - x0) * (i + 0.5)) / n + (r() - 0.5) * 120, hh = amp * (0.55 + 0.45 * r()), ww = ((x1 - x0) / n) * (0.8 + 0.6 * r());
      peaks.push([cx, hh, ww]);
    }
    peaks.sort((a, b) => a[1] - b[1]);
    for (const [cx, hh, ww] of peaks) {
      const c = MK.shade(color, -0.08 * r());
      el("path", { d: `M${cx - ww / 2},${y}L${cx - ww * 0.08},${y - hh * 0.97}Q${cx},${y - hh * 1.02} ${cx + ww * 0.08},${y - hh * 0.95}L${cx + ww / 2},${y}Z`, fill: c }, g);
      el("path", { d: `M${cx - ww / 2},${y}L${cx - ww * 0.08},${y - hh * 0.97}Q${cx},${y - hh * 1.02} ${cx},${y - hh}L${cx - ww * 0.1},${y}Z`, fill: "#000", opacity: 0.08 }, g);
      const sn = 0.24;
      el("path", { d: `M${cx - ww * 0.08 - ww * 0.42 * sn * 0.9},${y - hh * (1 - sn)}L${cx - ww * 0.08},${y - hh * 0.97}Q${cx},${y - hh * 1.02} ${cx + ww * 0.08},${y - hh * 0.95}L${cx + ww * 0.42 * sn},${y - hh * (1 - sn)}l${-ww * 0.05},${hh * 0.05}l${-ww * 0.05},${-hh * 0.06}l${-ww * 0.06},${hh * 0.07}l${-ww * 0.06},${-hh * 0.05}Z`, fill: snow }, g);
    }
    return { g };
  };

  /** Chão plano com degradê (do horizonte para baixo): opts {y, color, dark, x0, x1, bottom}. */
  MK.ground = function (parent, { y = 1500, color = "#5DAA6B", dark = null, x0 = -2000, x1 = 3200, bottom = 5000 } = {}) {
    const svg = parent.ownerSVGElement;
    const fill = MK.linear(svg, [[0, color], [1, dark || MK.shade(color, -0.2)]], { x1: 0, y1: 0, x2: 0, y2: 1 });
    return { g: el("rect", { x: x0, y, width: x1 - x0, height: bottom - y, fill }, parent) };
  };

  /** Tufos de grama que balançam: opts {y, x0, x1, n, h, color, seed, wind (um MK.wind: deita com a rajada)}. */
  MK.grass = function (parent, { y = 1500, x0 = -600, x1 = 1700, n = 60, h = 34, color = "#3E8E57", seed = 5, spread = 40, wind = null } = {}) {
    const r = MK.rand(seed), g = el("g", {}, parent), tufts = [];
    for (let i = 0; i < n; i++) {
      const x = x0 + (x1 - x0) * r(), yy = y + spread * r(), hh = h * (0.6 + 0.8 * r()), ph = r() * 6.3;
      tufts.push({ p: el("path", { fill: MK.shade(color, (r() - 0.5) * 0.2) }, g), x, y: yy, h: hh, ph });
    }
    return { g, draw(t) {
      for (const k of tufts) {
        const s = wind ? k.h * (0.06 * Math.sin(t * 3.2 + k.ph) + 0.4 * wind.at(t, k.x)) : 0.18 * k.h * Math.sin(t * 1.6 + k.ph + k.x * 0.004);
        const blades = [[-0.5, 0.8], [0, 1], [0.45, 0.75]].map(([dx, hh]) => {
          const bx = k.x + dx * k.h * 0.35, tx = bx + dx * k.h * 0.4 + s * hh, ty = k.y - k.h * hh;
          return `M${bx - 3},${k.y}Q${(bx + tx) / 2},${(k.y + ty) / 2} ${tx},${ty}Q${(bx + tx) / 2 + 2},${(k.y + ty) / 2} ${bx + 4},${k.y}Z`;
        });
        attr(k.p, { d: blades.join("") });
      }
    } };
  };

  /** Árvore: kind "round" (copa redonda), "pine" (pinheiro), "palm" (coqueiro), "birch". Balança com o vento
      (com wind = um MK.wind, inclina na rajada e tremula; sem ele, balanço suave). */
  MK.tree = function (parent, { x = 0, y = 1500, h = 520, kind = "round", leaf = "#4FA36A", trunk = "#7A5236", seed = 6, sway = 1, wind = null } = {}) {
    const r = MK.rand(seed), g = el("g", {}, parent), crown = el("g", {}, g);
    const tw = h * (kind === "pine" ? 0.07 : 0.085);
    el("path", { d: `M${x - tw / 2},${y}L${x - tw * 0.32},${y - h * 0.6}L${x + tw * 0.32},${y - h * 0.6}L${x + tw / 2},${y}Z`, fill: kind === "birch" ? "#EDEBE6" : trunk }, g);
    g.insertBefore(g.lastChild, crown);
    if (kind === "birch") for (let i = 0; i < 5; i++) g.insertBefore(el("rect", { x: x - tw * 0.3, y: y - h * (0.1 + 0.1 * i), width: tw * (0.2 + 0.3 * r()), height: 4, fill: "#333", opacity: 0.6 }), crown);
    if (kind === "round" || kind === "birch") {
      const blobs = [];
      for (let i = 0; i < 6; i++) blobs.push([x + (r() - 0.5) * h * 0.42, y - h * (0.62 + 0.24 * r()), h * (0.17 + 0.09 * r())]);
      blobs.push([x, y - h * 0.8, h * 0.27]);
      el("path", { d: blobs.map(([bx, by, br]) => MK.blob(bx, by + br * 0.12, br, { seed: seed + bx })).join(""), fill: MK.shade(leaf, -0.18) }, crown);
      el("path", { d: blobs.map(([bx, by, br]) => MK.blob(bx - br * 0.08, by - br * 0.04, br * 0.9, { seed: seed + by })).join(""), fill: leaf }, crown);
      el("path", { d: blobs.slice(0, 4).map(([bx, by, br]) => MK.blob(bx - br * 0.25, by - br * 0.3, br * 0.45, { seed: seed + br })).join(""), fill: MK.shade(leaf, 0.14) }, crown);
    } else if (kind === "pine") {
      for (let i = 0; i < 4; i++) {
        const yy = y - h * (0.25 + 0.2 * i), ww = h * (0.42 - 0.08 * i), hh = h * 0.34;
        el("path", { d: `M${x - ww / 2},${yy}Q${x},${yy + hh * 0.12} ${x + ww / 2},${yy}L${x},${yy - hh}Z`, fill: MK.shade(leaf, -0.1 + 0.05 * i) }, crown);
      }
    } else if (kind === "palm") {
      for (let i = 0; i < 7; i++) {
        const a = -Math.PI / 2 + (i - 3) * 0.45, L = h * 0.42;
        const ex = x + Math.cos(a) * L, ey = y - h * 0.62 + Math.sin(a) * L * 0.6 + L * 0.25;
        el("path", { d: `M${x},${y - h * 0.62}Q${(x + ex) / 2},${y - h * 0.62 - L * 0.35} ${ex},${ey}Q${(x + ex) / 2},${y - h * 0.62 - L * 0.1} ${x},${y - h * 0.6}Z`, fill: MK.shade(leaf, (i % 2) * -0.1) }, crown);
      }
    }
    const ph = r() * 6.3;
    return { g, draw(t) {
      const a = wind ? sway * (5 * wind.at(t, x) + 0.9 * Math.sin(t * 2.3 + ph) * (0.4 + Math.abs(wind.at(t, x)))) : sway * 1.6 * Math.sin(t * 1.1 + ph);
      attr(crown, { transform: `rotate(${a.toFixed(3)} ${x} ${y - h * 0.55})` });
    } };
  };

  MK.bush = function (parent, { x = 0, y = 1500, w = 220, color = "#4E9E6E", seed = 8, flowers = null } = {}) {
    const r = MK.rand(seed), g = el("g", {}, parent), bl = [];
    for (let i = 0; i < 4; i++) bl.push([x + (i / 3 - 0.5) * w * 0.7, y - w * (0.18 + 0.1 * r()), w * (0.22 + 0.08 * r())]);
    el("path", { d: bl.map(([bx, by, br]) => MK.blob(bx, by, br, { seed: seed + bx })).join("") + MK.rrect(x - w * 0.5, y - w * 0.2, w, w * 0.2, w * 0.05), fill: MK.shade(color, -0.12) }, g);
    el("path", { d: bl.map(([bx, by, br]) => MK.blob(bx - br * 0.1, by - br * 0.1, br * 0.85, { seed: seed + by })).join(""), fill: color }, g);
    if (flowers) for (let i = 0; i < 6; i++) el("circle", { cx: x + (r() - 0.5) * w * 0.8, cy: y - w * (0.1 + 0.3 * r()), r: w * 0.03, fill: flowers }, g);
    return { g };
  };

  MK.flowers = function (parent, { y = 1520, x0 = 0, x1 = 1080, n = 20, colors = ["#FF8AA8", MK.C.ACCENT, "#FFFFFF", "#B488FF"], seed = 12, h = 40 } = {}) {
    const r = MK.rand(seed), g = el("g", {}, parent);
    for (let i = 0; i < n; i++) {
      const x = x0 + (x1 - x0) * r(), yy = y + 30 * r(), hh = h * (0.6 + 0.6 * r()), c = colors[Math.floor(r() * colors.length)];
      el("path", { d: `M${x},${yy}Q${x + 4},${yy - hh / 2} ${x},${yy - hh}`, stroke: "#3E8E57", strokeWidth: 3, fill: "none" }, g);
      for (let k = 0; k < 5; k++) { const a = (k / 5) * 6.28; el("circle", { cx: x + Math.cos(a) * 7, cy: yy - hh + Math.sin(a) * 7, r: 6, fill: c }, g); }
      el("circle", { cx: x, cy: yy - hh, r: 4.5, fill: "#FFB13B" }, g);
    }
    return { g };
  };

  /** Casa simples: opts {x (centro), y (chão), w, h, wall, roof, door, lit (janelas acesas 0–1)}. */
  MK.house = function (parent, { x = 540, y = 1500, w = 420, h = 300, wall = "#F2D6B3", roof = "#C2543F", door = "#7A5236", lit = 0, seed = 3 } = {}) {
    const g = el("g", {}, parent);
    el("rect", { x: x - w / 2, y: y - h, width: w, height: h, fill: wall }, g);
    el("rect", { x: x + w * 0.1, y: y - h, width: w * 0.4, height: h, fill: "#000", opacity: 0.06 }, g);
    el("path", { d: `M${x - w * 0.6},${y - h}L${x},${y - h - h * 0.62}L${x + w * 0.6},${y - h}Z`, fill: roof }, g);
    el("path", { d: `M${x},${y - h - h * 0.62}L${x + w * 0.6},${y - h}L${x + w * 0.1},${y - h}Z`, fill: "#000", opacity: 0.12 }, g);
    el("rect", { x: x - w * 0.09, y: y - h * 0.48, width: w * 0.18, height: h * 0.48, rx: 6, fill: door }, g);
    const win = [];
    for (const wx of [-0.32, 0.22]) {
      win.push(el("rect", { x: x + wx * w, y: y - h * 0.72, width: w * 0.16, height: h * 0.24, rx: 4, fill: MK.mixColor("#8FB8D8", "#FFD27A", lit) }, g));
      el("path", { d: `M${x + (wx + 0.08) * w},${y - h * 0.72}V${y - h * 0.48}M${x + wx * w},${y - h * 0.6}H${x + (wx + 0.16) * w}`, stroke: "#fff", strokeWidth: 4 }, g);
    }
    return { g, setLit(v) { win.forEach((wn) => attr(wn, { fill: MK.mixColor("#8FB8D8", "#FFD27A", v) })); } };
  };

  /** Cidade (prédios com janelas): opts {y (chão), x0, x1, h0, h1, color, lit, seed, windows}. */
  MK.city = function (parent, { y = 1300, x0 = -800, x1 = 1900, h0 = 160, h1 = 620, color = "#5A6B8C", lit = 0.35, seed = 11, gap = 6 } = {}) {
    const r = MK.rand(seed), g = el("g", {}, parent);
    let x = x0;
    while (x < x1) {
      const w = 90 + 160 * r(), h = h0 + (h1 - h0) * r() ** 1.3, c = MK.shade(color, (r() - 0.5) * 0.18);
      el("rect", { x, y: y - h, width: w, height: h, fill: c }, g);
      if (r() < 0.3) el("rect", { x: x + w * 0.4, y: y - h - 30, width: 6, height: 30, fill: c }, g);
      const cols = Math.max(2, Math.floor(w / 34)), rows = Math.floor(h / 46);
      for (let i = 0; i < cols; i++) for (let k = 0; k < rows; k++) {
        const on = r() < lit;
        el("rect", { x: x + 12 + (i * (w - 24)) / cols, y: y - h + 16 + k * 46, width: (w - 24) / cols - 10, height: 24, fill: on ? "#FFD98A" : MK.shade(c, -0.18), opacity: on ? 0.9 : 0.7 }, g);
      }
      x += w + gap;
    }
    return { g };
  };

  /** Mar até o horizonte com ondas que mexem: opts {y (horizonte), color, deep, x0, x1}. */
  MK.sea = function (parent, { y = 1100, color = "#3D8BD0", deep = "#1D4F8A", x0 = -2000, x1 = 3200, bottom = 4000, waves = 14, seed = 13 } = {}) {
    const svg = parent.ownerSVGElement, g = el("g", {}, parent);
    el("rect", { x: x0, y, width: x1 - x0, height: bottom - y, fill: MK.linear(svg, [[0, MK.shade(color, 0.25)], [0.35, color], [1, deep]], { x1: 0, y1: 0, x2: 0, y2: 1 }) }, g);
    const r = MK.rand(seed), ws = [];
    for (let i = 0; i < waves; i++) {
      const yy = y + 20 + Math.pow(i / waves, 1.6) * (bottom - y) * 0.35, w = 60 + 220 * (i / waves);
      ws.push({ p: el("path", { fill: "none", stroke: "#fff", strokeWidth: 2 + 4 * (i / waves), strokeLinecap: "round", opacity: 0.35 }, g), x: x0 + (x1 - x0) * r(), y: yy, w, ph: r() * 6.3 });
    }
    return { g, draw(t) {
      for (const k of ws) {
        const dx = 30 * Math.sin(t * 0.6 + k.ph);
        attr(k.p, { d: `M${k.x + dx - k.w / 2},${k.y}Q${k.x + dx},${k.y - k.w * 0.08} ${k.x + dx + k.w / 2},${k.y}`, opacity: 0.2 + 0.2 * Math.sin(t * 1.3 + k.ph) });
      }
    } };
  };

  /** Rua com calçada e faixas: opts {y (topo da calçada), x0, x1}. */
  MK.road = function (parent, { y = 1500, x0 = -2000, x1 = 3200, walk = 70, road = 220 } = {}) {
    const g = el("g", {}, parent);
    el("rect", { x: x0, y, width: x1 - x0, height: walk, fill: "#C9C3B6" }, g);
    el("rect", { x: x0, y: y + walk, width: x1 - x0, height: 10, fill: "#9A9488" }, g);
    el("rect", { x: x0, y: y + walk + 10, width: x1 - x0, height: road, fill: "#4A4E57" }, g);
    for (let x = x0; x < x1; x += 160) el("rect", { x, y: y + walk + 10 + road / 2 - 5, width: 80, height: 10, fill: "#F2E3A0" }, g);
    return { g };
  };

  MK.lamppost = function (parent, { x = 0, y = 1500, h = 520, on = 0, color = "#3A3F4B" } = {}) {
    const g = el("g", {}, parent), svg = parent.ownerSVGElement;
    el("rect", { x: x - 7, y: y - h, width: 14, height: h, fill: color }, g);
    el("path", { d: `M${x},${y - h}q0,-40 50,-40h20`, fill: "none", stroke: color, strokeWidth: 12 }, g);
    const glow = el("circle", { cx: x + 72, cy: y - h - 22, r: 120, fill: MK.radial(svg, [[0, "#FFE7A8", 0.7], [1, "#FFE7A8", 0]]), opacity: on }, g);
    el("path", { d: `M${x + 50},${y - h - 40}h44l-8,24h-28z`, fill: color }, g);
    const bulb = el("ellipse", { cx: x + 72, cy: y - h - 14, rx: 14, ry: 7, fill: MK.mixColor("#9AA3B0", "#FFE7A8", on) }, g);
    return { g, set(v) { attr(glow, { opacity: v }); attr(bulb, { fill: MK.mixColor("#9AA3B0", "#FFE7A8", v) }); } };
  };

  MK.bench = function (parent, { x = 540, y = 1500, w = 360, color = "#A8743F", metal = "#3A3F4B" } = {}) {
    const g = el("g", {}, parent), seat = y - 110;
    for (const dx of [-0.38, 0.38]) el("rect", { x: x + dx * w - 8, y: seat, width: 16, height: 110, fill: metal }, g);
    el("rect", { x: x - w / 2, y: seat - 16, width: w, height: 22, rx: 6, fill: color }, g);
    el("rect", { x: x - w / 2, y: seat - 120, width: w, height: 22, rx: 6, fill: color }, g);
    el("rect", { x: x - w / 2, y: seat - 78, width: w, height: 22, rx: 6, fill: MK.shade(color, -0.08) }, g);
    for (const dx of [-0.38, 0.38]) el("rect", { x: x + dx * w - 6, y: seat - 120, width: 12, height: 110, fill: metal }, g);
    return { g, seatY: seat - 16 };
  };

  MK.fence = function (parent, { y = 1500, x0 = -400, x1 = 1500, h = 120, color = "#F2EDE4", step = 46 } = {}) {
    const g = el("g", {}, parent);
    el("rect", { x: x0, y: y - h * 0.75, width: x1 - x0, height: 14, fill: MK.shade(color, -0.1) }, g);
    el("rect", { x: x0, y: y - h * 0.35, width: x1 - x0, height: 14, fill: MK.shade(color, -0.1) }, g);
    for (let x = x0; x < x1; x += step) el("path", { d: `M${x},${y}V${y - h + 12}l12,-14l12,14V${y}Z`, fill: color }, g);
    return { g };
  };

  /** Poste e fios elétricos: opts {x0, x1, y (chão), h, poles}. Devolve {g, wireY(x, k)} (altura do fio k em x). */
  MK.powerlines = function (parent, { x0 = -300, x1 = 1400, y = 1500, h = 900, poles = 2, sag = 70, wires = 3, color = "#3A3F4B" } = {}) {
    const g = el("g", {}, parent), xs = [];
    for (let i = 0; i < poles; i++) xs.push(x0 + ((x1 - x0) * i) / Math.max(1, poles - 1));
    const top = y - h;
    for (const x of xs) {
      el("rect", { x: x - 12, y: top, width: 24, height: h, fill: "#6B4A2E" }, g);
      el("rect", { x: x - 110, y: top + 30, width: 220, height: 16, fill: "#5A3E26" }, g);
    }
    const wy = (x, k) => {
      for (let i = 0; i + 1 < xs.length; i++) if (x >= xs[i] && x <= xs[i + 1]) {
        const u = (x - xs[i]) / (xs[i + 1] - xs[i]);
        return top + 30 + k * 0 + 4 * u * (1 - u) * sag;
      }
      return top + 30;
    };
    for (let k = 0; k < wires; k++) {
      const off = (k - (wires - 1) / 2) * 85;
      for (let i = 0; i + 1 < xs.length; i++) {
        el("path", { d: `M${xs[i] + off},${top + 30}Q${(xs[i] + xs[i + 1]) / 2 + off},${top + 30 + 2 * sag} ${xs[i + 1] + off},${top + 30}`, fill: "none", stroke: color, strokeWidth: 5 }, g);
      }
    }
    return { g, xs, wireY: wy, top: top + 30 };
  };

  // ── interior ───────────────────────────────────────────────────────────────────────────────────────────────
  /** Cômodo: parede, rodapé, piso em tábuas. opts {x0, x1, floorY, top, wall, floor}. */
  MK.room = function (parent, { x0 = -600, x1 = 1700, floorY = 1450, top = -800, bottom = 3200, wall = "#F1E4CF", floor = "#C99A6B", trim = "#FFFFFF", tiles = false } = {}) {
    const svg = parent.ownerSVGElement, g = el("g", {}, parent);
    el("rect", { x: x0, y: top, width: x1 - x0, height: floorY - top, fill: MK.linear(svg, [[0, MK.shade(wall, -0.06)], [1, wall]], { x1: 0, y1: 0, x2: 0, y2: 1 }) }, g);
    el("rect", { x: x0, y: floorY, width: x1 - x0, height: bottom - floorY, fill: MK.linear(svg, [[0, floor], [1, MK.shade(floor, -0.22)]], { x1: 0, y1: 0, x2: 0, y2: 1 }) }, g);
    if (tiles) {
      for (let x = x0; x < x1; x += 140) el("path", { d: `M${x},${floorY}L${x + (x - 540) * 0.6},${bottom}`, stroke: MK.shade(floor, -0.12), strokeWidth: 3 }, g);
    } else {
      for (let k = 0; k < 8; k++) el("rect", { x: x0, y: floorY + 40 + k * k * 22, width: x1 - x0, height: 3, fill: MK.shade(floor, -0.15) }, g);
    }
    el("rect", { x: x0, y: floorY - 28, width: x1 - x0, height: 28, fill: trim }, g);
    el("rect", { x: x0, y: floorY - 4, width: x1 - x0, height: 4, fill: "#000", opacity: 0.08 }, g);
    return { g, floorY };
  };

  /** Janela com vista (céu do clima dado) e cortinas: opts {x, y (topo), w, h, mood, curtains}. */
  MK.roomWindow = function (parent, S, { x = 300, y = 400, w = 380, h = 460, mood = "day", curtains = "#E07A5F", frame = "#FFFFFF", sun = true } = {}) {
    const M = MK.MOOD[mood] || MK.MOOD.day, svg = parent.ownerSVGElement, g = el("g", {}, parent);
    const cid = MK.uid("win");
    const cp = el("clipPath", { id: cid }, MK.defs(svg));
    el("rect", { x, y, width: w, height: h }, cp);
    const view = el("g", { clipPath: `url(#${cid})` }, g);
    el("rect", { x, y, width: w, height: h, fill: MK.linear(svg, [[0, M.skyTop], [1, M.skyBot]], { x1: 0, y1: 0, x2: 0, y2: 1 }) }, view);
    if (sun) MK.sun(view, { x: x + w * 0.7, y: y + h * 0.3, r: w * 0.09, mood });
    MK.hills(view, { y: y + h * 0.95, amp: h * 0.18, color: M.mid || "#6DB88A", x0: x - 50, x1: x + w + 50, n: 5, seed: 21 });
    const cl = MK.cloud(view, { x: x + w * 0.3, y: y + h * 0.25, w: w * 0.4, color: M.cloud || "#fff" });
    el("rect", { x: x - 14, y: y - 14, width: w + 28, height: h + 28, rx: 6, fill: "none", stroke: frame, strokeWidth: 28 }, g);
    el("path", { d: `M${x + w / 2},${y}V${y + h}M${x},${y + h / 2}H${x + w}`, stroke: frame, strokeWidth: 14 }, g);
    el("rect", { x: x - 40, y: y + h + 10, width: w + 80, height: 22, rx: 4, fill: MK.shade(frame, -0.08) }, g);
    if (curtains) {
      for (const sd of [-1, 1]) {
        const cx = sd < 0 ? x - 30 : x + w + 30;
        el("path", { d: `M${cx - 70},${y - 50}H${cx + 70}C${cx + 50 * -sd},${y + h * 0.4} ${cx + 30 * sd},${y + h * 0.7} ${cx + 50 * sd},${y + h + 40}H${cx - 50 * sd}C${cx - 60 * sd},${y + h * 0.6} ${cx - 70 * sd},${y + h * 0.3} ${cx - 70},${y - 50}Z`, fill: curtains }, g);
      }
      el("rect", { x: x - 120, y: y - 70, width: w + 240, height: 16, rx: 8, fill: "#6B4A2E" }, g);
    }
    return { g, view, cloud: cl };
  };

  MK.frame = function (parent, { x = 700, y = 500, w = 200, h = 150, color = "#6B4A2E", art = "#8FB8D8", seed = 2 } = {}) {
    const g = el("g", {}, parent);
    el("rect", { x: x - 10, y: y - 10, width: w + 20, height: h + 20, fill: color }, g);
    el("rect", { x, y, width: w, height: h, fill: art }, g);
    el("path", { d: `M${x},${y + h}L${x + w * 0.35},${y + h * 0.45}L${x + w * 0.6},${y + h * 0.75}L${x + w * 0.78},${y + h * 0.55}L${x + w},${y + h}Z`, fill: MK.shade(art, -0.3) }, g);
    el("circle", { cx: x + w * 0.75, cy: y + h * 0.28, r: h * 0.1, fill: "#FFE08A" }, g);
    return { g };
  };

  MK.shelf = function (parent, { x = 700, y = 600, w = 320, color = "#A8743F", books = 7, seed = 4 } = {}) {
    const r = MK.rand(seed), g = el("g", {}, parent);
    let bx = x + 10;
    const cols = Object.values(MK.CLOTH);
    for (let i = 0; i < books && bx < x + w - 30; i++) {
      const bw = 20 + 18 * r(), bh = 70 + 50 * r();
      el("rect", { x: bx, y: y - bh, width: bw, height: bh, rx: 3, fill: cols[Math.floor(r() * cols.length)] }, g);
      bx += bw + 3;
    }
    el("rect", { x, y, width: w, height: 18, rx: 4, fill: color }, g);
    return { g };
  };

  /** Mesa vista de lado (tampo + pernas): devolve {g, topY}. */
  MK.table = function (parent, { x = 540, y = 1450, w = 620, h = 300, color = "#B07A4F", cloth = null } = {}) {
    const g = el("g", {}, parent), top = y - h;
    for (const dx of [-0.42, 0.42]) el("rect", { x: x + dx * w - 14, y: top + 10, width: 28, height: h - 10, fill: MK.shade(color, -0.2) }, g);
    el("rect", { x: x - w / 2, y: top, width: w, height: 34, rx: 8, fill: color }, g);
    el("rect", { x: x - w / 2, y: top + 26, width: w, height: 8, fill: "#000", opacity: 0.12 }, g);
    if (cloth) el("path", { d: `M${x - w / 2 - 10},${top - 4}H${x + w / 2 + 10}V${top + 70}Q${x + w / 4},${top + 85} ${x},${top + 70}Q${x - w / 4},${top + 85} ${x - w / 2 - 10},${top + 70}Z`, fill: cloth }, g);
    return { g, topY: top };
  };

  MK.chair = function (parent, { x = 300, y = 1450, color = "#8A5A3B", facing = 1 } = {}) {
    const g = el("g", { transform: `translate(${x} ${y}) scale(${facing} 1)` }, parent);
    el("rect", { x: -90, y: -200, width: 180, height: 24, rx: 6, fill: color }, g);
    el("rect", { x: -82, y: -180, width: 18, height: 180, fill: MK.shade(color, -0.2) }, g);
    el("rect", { x: 64, y: -180, width: 18, height: 180, fill: MK.shade(color, -0.2) }, g);
    el("rect", { x: -90, y: -420, width: 20, height: 230, rx: 8, fill: color }, g);
    el("rect", { x: -90, y: -420, width: 120, height: 26, rx: 8, fill: color }, g);
    return { g, seatY: y - 200 };
  };

  MK.lamp = function (parent, { x = 900, y = 1450, h = 520, on = 1, shade = "#F5C94B" } = {}) {
    const svg = parent.ownerSVGElement, g = el("g", {}, parent);
    const glow = el("circle", { cx: x, cy: y - h + 40, r: 360, fill: MK.radial(svg, [[0, "#FFE7A8", 0.5], [1, "#FFE7A8", 0]]), opacity: on }, g);
    el("rect", { x: x - 6, y: y - h + 60, width: 12, height: h - 60, fill: "#3A3F4B" }, g);
    el("ellipse", { cx: x, cy: y - 6, rx: 70, ry: 14, fill: "#3A3F4B" }, g);
    el("path", { d: `M${x - 60},${y - h + 90}L${x - 100},${y - h + 160}H${x + 100}L${x + 60},${y - h + 90}Z`, fill: shade }, g);
    return { g, set(v) { attr(glow, { opacity: v }); } };
  };

  /** Balcão de cozinha com fogão e armários: devolve {g, topY}. */
  MK.counter = function (parent, { x0 = -200, x1 = 1300, y = 1450, h = 380, color = "#E8E1D6", top = "#6E7B8A", doors = "#D8CDBE" } = {}) {
    const g = el("g", {}, parent), ty = y - h;
    el("rect", { x: x0, y: ty, width: x1 - x0, height: h, fill: color }, g);
    for (let x = x0 + 20; x < x1 - 160; x += 200) {
      el("rect", { x, y: ty + 60, width: 180, height: h - 80, rx: 8, fill: doors }, g);
      el("rect", { x: x + 150, y: ty + 90, width: 10, height: 60, rx: 5, fill: "#8D95A3" }, g);
    }
    el("rect", { x: x0 - 10, y: ty - 30, width: x1 - x0 + 20, height: 40, rx: 6, fill: top }, g);
    return { g, topY: ty - 30 };
  };

  /** Luz geral sobre a cena (num grupo acima de tudo): cor/clima e vinheta. opts {tint, amount, vignette}. */
  MK.atmosphere = function (parent, S, { tint = "#FFB36B", amount = 0, vignette = 0.35 } = {}) {
    const svg = parent.ownerSVGElement, g = el("g", {}, parent);
    const t1 = el("rect", { x: 0, y: 0, width: S.W, height: S.H, fill: tint, opacity: amount, style: "mix-blend-mode:soft-light" }, g);
    el("rect", { x: 0, y: 0, width: S.W, height: S.H, fill: MK.radial(svg, [[0.55, "#000", 0], [1, "#000", vignette]], { r: 0.75 }) }, g);
    return { g, set(a, c) { attr(t1, { opacity: a, fill: c || tint }); } };
  };
})();
