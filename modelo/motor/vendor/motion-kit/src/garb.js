/* garb.js — Figurinos configuráveis, escrita e silhuetas de personagens. */
(function () {
  const MK = window.MK;
  const { el, attr } = MK;

  const C = { LINEN: "#F3EEDF", LINEN_D: "#D9CFB4", OCHRE: "#C98B3A", LAPIS: "#2F56A6", GOLD_D: "#E0A92E",
              CARNELIAN: "#C2452D", TURQ: "#3FB6A8" };

  /** MK.person com figurino de época, preso pelos encaixes (p.slot) e não por posição no DOM.
      garb: "chiton" (túnica longa) · "himation" (túnica + manto em diagonal) · "kilt" (saiote egípcio pregueado)
            · "tunic" (túnica até o joelho; hose: cor da meia-calça) · "robe" (túnica longa com franja)
      extras: robe (cor da túnica) · mantle (cor do manto) · border (cor da barra) · fringe · collar (colar largo
              egípcio) · longBeard (0–1.2) · diadem · headband (cor) · belt (cor) · belly (0–1) · apron (cor)
              · kilt (cor do saiote) · kiltStripes (cor) · bands (braceletes no kilt; false tira)
      Devolve {g, draw(pose, t), j, p (o MK.person), head, P, slot, who, walkPhase}: mais figurino, use self.slot(...). */
  MK.dressed = function (parent, o = {}) {
    o = Object.assign({ garb: "chiton", seed: 1, skin: MK.SKIN[2], hair: MK.HAIR[1], mantle: null, border: null, fringe: false, collar: false, longBeard: 0,
                        diadem: false, headband: null, belt: null, robe: null }, o);
    const robeColor = o.robe || o.shirt || C.LINEN;
    const svgRoot = parent.ownerSVGElement;

    const cloth = (c) => MK.linear(svgRoot, [[0, MK.shade(c, 0.12)], [0.55, c], [1, MK.shade(c, -0.16)]], { x1: 0, y1: 0, x2: 0.7, y2: 1 });
    const base = Object.assign({ size: 620, sleeves: "short", shoes: "#7A5236" }, o);
    if (o.garb === "kilt") Object.assign(base, { shirt: o.skin, skirt: o.kilt || C.LINEN, pants: o.skin, legs: "long", sleeves: "short", feet: o.feet || "bare" });
    else if (o.garb === "tunic") Object.assign(base, { shirt: robeColor, pants: o.hose || o.skin, legs: o.hose ? "long" : "shorts", skirt: robeColor });
    else Object.assign(base, { shirt: robeColor, pants: robeColor });
    const p = MK.person(parent, base);
    const head = p.parts.head;
    const P = p.P, R = P.head / 2;
    const dk = (c, a = 0.17) => MK.shade(c, -a);

    // camadas do figurino, entre o tronco e a cabeça (os braços da frente ficam por cima)
    const fig = p.slot("clothes");
    const robe = o.garb === "chiton" || o.garb === "himation" || o.garb === "robe" ? el("path", { fill: cloth(robeColor) }, fig) : null;
    const robeShade = robe ? el("path", { fill: "#000", opacity: 0.1 }, fig) : null;
    const folds = robe ? [0, 1, 2, 3].map(() => el("path", { fill: "none", stroke: dk(robeColor, 0.22), strokeWidth: P.legW * 0.07, strokeLinecap: "round", opacity: 0.55 }, fig)) : [];
    const hemBand = robe && o.border ? el("path", { fill: "none", stroke: o.border, strokeWidth: P.legW * 0.2, strokeLinecap: "butt" }, fig) : null;
    // grega (meandro) dentro da barra: quadradinhos tracejados na cor da túnica
    const hemKey = robe && o.border ? el("path", { fill: "none", stroke: MK.shade(robeColor, 0.1), strokeWidth: P.legW * 0.07, strokeDasharray: `${(P.legW * 0.09).toFixed(1)} ${(P.legW * 0.09).toFixed(1)}` }, fig) : null;
    const fringe = robe && o.fringe ? el("path", { fill: "none", stroke: dk(robeColor, 0.3), strokeWidth: P.legW * 0.05, strokeLinecap: "round" }, fig) : null;
    const kiltPleats = o.garb === "kilt" ? el("path", { fill: "none", stroke: C.LINEN_D, strokeWidth: P.legW * 0.05, strokeLinecap: "round" }, fig) : null;
    const kiltTab = o.garb === "kilt" ? el("path", { fill: MK.shade(o.kilt || C.LINEN, -0.04) }, fig) : null;
    const belt = o.belt || o.garb === "kilt" ? el("path", { fill: "none", stroke: o.belt || C.OCHRE, strokeWidth: P.legW * 0.18, strokeLinecap: "round" }, fig) : null;
    const belly = o.belly ? el("path", { fill: o.garb === "kilt" ? o.skin : robeColor }, fig) : null;
    const bellyShade = o.belly ? el("path", { fill: "none", stroke: "#000", strokeWidth: P.legW * 0.08, opacity: 0.12, strokeLinecap: "round" }, fig) : null;
    const stripes = o.kiltStripes ? el("path", { fill: "none", stroke: o.kiltStripes, strokeWidth: P.legW * 0.1 }, fig) : null;
    const apron = o.apron ? el("path", { fill: o.apron }, fig) : null;
    const apronStrap = o.apron ? el("path", { fill: "none", stroke: MK.shade(o.apron, -0.25), strokeWidth: P.legW * 0.1, strokeLinecap: "round" }, fig) : null;
    const mantle = o.mantle ? el("path", { fill: cloth(o.mantle) }, fig) : null;
    const mantleShade = o.mantle ? el("path", { fill: "#000", opacity: 0.12 }, fig) : null;
    const mantleFolds = o.mantle ? [0, 1, 2].map(() => el("path", { fill: "none", stroke: dk(o.mantle, 0.25), strokeWidth: P.legW * 0.07, strokeLinecap: "round", opacity: 0.6 }, fig)) : [];
    const mantleEdge = o.mantle && o.border ? el("path", { fill: "none", stroke: o.border, strokeWidth: P.legW * 0.12, strokeLinecap: "round" }, fig) : null;
    const collar = o.collar ? [C.LAPIS, C.GOLD_D, C.CARNELIAN, C.TURQ].map((c) => el("path", { fill: "none", stroke: c, strokeWidth: P.torso * 0.045, strokeLinecap: "round" }, fig)) : null;
    // cabeça
    const hb = p.slot("head");
    const beard = o.longBeard ? el("path", { fill: o.hair }, hb) : null;
    const beardCurls = o.longBeard ? el("path", { fill: "none", stroke: dk(o.hair, 0.25), strokeWidth: R * 0.06, strokeLinecap: "round" }, hb) : null;
    const moust = o.longBeard ? el("path", { fill: dk(o.hair, 0.05) }, hb) : null;
    const diadem = o.diadem ? el("path", { fill: "none", stroke: "#F7F1E2", strokeWidth: R * 0.1, strokeLinecap: "round" }, hb) : null;
    // braceletes (egípcios): no braço da frente, por cima dele
    const bands = o.garb === "kilt" && o.bands !== false ? [el("path", { fill: "none", stroke: C.GOLD_D, strokeWidth: P.armW * 1.06, strokeLinecap: "butt" }, p.slot("front")),
                                       el("path", { fill: "none", stroke: o.collar ? C.LAPIS : C.GOLD_D, strokeWidth: P.armW * 1.04, strokeLinecap: "butt" }, p.slot("front"))] : null;
    const diademTie = o.diadem ? el("path", { fill: "#FFFFFF" }, hb) : null;
    const band = o.headband ? el("path", { fill: "none", stroke: o.headband, strokeWidth: R * 0.13, strokeLinecap: "round" }, hb) : null;

    const pt = (q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`;
    const self = { g: p.g, p, head, j: {}, opts: o, P: p.P, who: p.who, parts: p.parts, slot: p.slot, walkPhase: p.walkPhase };
    self.draw = function (pose = {}, t = 0) {
      const j = p.draw(pose, t);
      self.j = j;
      const f = j.facing, s = j.scale;
      const L = (q) => [(q[0] - j.hip[0]) / (f * s), (q[1] - j.rootY) / s];
      const ch = L(j.chest), kN = L(j.kneeN), kF = L(j.kneeF), aN = L(j.footN), aF = L(j.footF);
      const lean = Math.atan2(ch[0], -ch[1]);
      const cs = Math.cos(lean), sn = Math.sin(lean);
      const rot = (q) => [q[0] * cs - q[1] * sn, q[0] * sn + q[1] * cs];
      const T = Math.hypot(ch[0], ch[1]) / 0.86, sw = P.shw, hw = P.hipw, lw = P.legW;
      if (robe) {
        const hemY = Math.max(aN[1], aF[1]) + P.ankle * 0.5;
        const xs = [aN[0], aF[0]], lo = Math.min(...xs) - lw * 1.05, hi = Math.max(...xs) + lw * 1.15;
        const kl = Math.min(kN[0], kF[0]) - lw * 0.85, kh = Math.max(kN[0], kF[0]) + lw * 0.85, ky = (kN[1] + kF[1]) / 2;
        const sway = 0.06 * lw * Math.sin(t * 1.7 + o.seed);
        const w0 = rot([-hw * 1.12, -0.42 * T]), w1 = rot([hw * 1.12, -0.42 * T]);
        const pts = [w0, [kl, ky], [lo + sway, hemY], [(lo + hi) / 2 + sway, hemY + lw * 0.12], [hi + sway, hemY], [kh, ky], w1];
        attr(robe, { d: MK.smoothPath(pts, true, 0.42) });
        attr(robeShade, { d: MK.smoothPath([w0, [kl, ky], [lo + sway, hemY], [lo + (hi - lo) * 0.32, hemY + lw * 0.1], [kl + (kh - kl) * 0.3, ky], rot([-hw * 0.3, -0.42 * T])], true, 0.42) });
        folds.forEach((fl, i) => {
          const u = (i + 1) / 5, top = MK.mix(w0, w1, MK.lerp(0.25, 0.75, u));
          const mid = [MK.lerp(kl, kh, u), ky], bot = [MK.lerp(lo, hi, u) + sway, hemY - lw * 0.15];
          attr(fl, { d: `M${pt(MK.mix(top, mid, 0.35))}Q${pt(mid)} ${pt(bot)}` });
        });
        if (hemBand) {
          const hd = `M${pt([lo + sway + lw * 0.1, hemY - lw * 0.3])}Q${pt([(lo + hi) / 2 + sway, hemY - lw * 0.16])} ${pt([hi + sway - lw * 0.1, hemY - lw * 0.3])}`;
          attr(hemBand, { d: hd }); attr(hemKey, { d: hd });
        }
        if (fringe) {
          let d = "";
          for (let i = 0; i <= 14; i++) { const x = MK.lerp(lo + lw * 0.1, hi - lw * 0.1, i / 14) + sway, y = hemY + lw * 0.05; d += `M${pt([x, y])}l${(lw * 0.04).toFixed(1)},${(lw * 0.32).toFixed(1)}`; }
          attr(fringe, { d });
        }
      }
      if (kiltPleats) {
        const sl = P.thigh * 0.85;
        let d = "";
        for (let i = -3; i <= 3; i++) { const x0 = hw * 0.28 * i, x1 = hw * 0.5 * i; d += `M${pt([x0, -lw * 0.4])}L${pt([x1, sl * 0.98])}`; }
        attr(kiltPleats, { d });
        attr(kiltTab, { d: MK.smoothPath([[hw * 0.05, -lw * 0.5], [hw * 0.95, -lw * 0.5], [hw * 0.75, sl * 0.95], [hw * 0.3, sl * 1.0]], true, 0.3) });
      }
      if (belt) {
        const a = rot([-hw * 1.08, -0.06 * T]), b = rot([hw * 1.08, -0.06 * T]);
        const yb = o.garb === "kilt" ? -lw * 0.55 : -0.36 * T;
        const a2 = o.garb === "kilt" ? [-hw * 1.06, yb] : rot([-hw * 1.1, yb]), b2 = o.garb === "kilt" ? [hw * 1.06, yb] : rot([hw * 1.1, yb]);
        attr(belt, { d: `M${pt(a2)}Q${pt([(a2[0] + b2[0]) / 2, (a2[1] + b2[1]) / 2 + lw * 0.12])} ${pt(b2)}` });
        void a; void b;
      }
      if (stripes) {
        const sl = P.thigh * 0.85;
        let d = "";
        for (let i = 0; i < 3; i++) { const y = sl * (0.3 + 0.25 * i); d += `M${pt([-hw * (1.25 + 0.4 * (y / sl)), y])}L${pt([hw * (1.25 + 0.4 * (y / sl)), y])}`; }
        attr(stripes, { d });
      }
      if (belly) {
        const b = o.belly;
        const a = rot([sw * 0.55, -0.72 * T]), m = rot([sw * (0.95 + 0.55 * b), -0.38 * T]), c = rot([hw * 1.05, -0.02 * T]);
        attr(belly, { d: MK.smoothPath([rot([0, -0.75 * T]), a, m, c, rot([0, -0.02 * T])], true, 0.6) });
        attr(bellyShade, { d: `M${pt(rot([sw * 0.3, -0.12 * T]))}Q${pt(rot([sw * (0.8 + 0.4 * b), -0.14 * T]))} ${pt(rot([hw * 1.0, -0.1 * T]))}` });
      }
      if (apron) {
        const kY = Math.max(kN[1], kF[1]) * 1.02, kx = Math.max(kN[0], kF[0]);
        attr(apron, { d: MK.smoothPath([rot([sw * 0.05, -0.8 * T]), rot([sw * 0.75, -0.78 * T]), rot([sw * 0.9, -0.3 * T]), [kx + lw * 0.9, kY], [kx - lw * 1.2, kY + lw * 0.1], rot([-sw * 0.2, -0.3 * T])], true, 0.35) });
        attr(apronStrap, { d: `M${pt(rot([sw * 0.15, -0.8 * T]))}L${pt(rot([-sw * 0.25, -1.0 * T]))}M${pt(rot([sw * 0.85, -0.42 * T]))}L${pt(rot([-sw * 0.9, -0.45 * T]))}` });
      }
      if (mantle) {
        const sb = rot([-sw * 1.02, -0.97 * T]), sf = rot([sw * 0.15, -1.0 * T]), hipF = rot([hw * 1.25, -0.02 * T]);
        const kneeY = Math.max(kN[1], kF[1]) * 0.92, kneeX = Math.max(kN[0], kF[0]) + lw * 0.95;
        const back = rot([-sw * 1.12, -0.5 * T]), backLo = [Math.min(kN[0], kF[0]) - lw * 1.2, kneeY * 0.82];
        const sway = 0.05 * lw * Math.sin(t * 1.5 + o.seed + 1);
        const pts = [sb, sf, rot([sw * 0.55, -0.62 * T]), hipF, [kneeX + sway, kneeY], [MK.lerp(backLo[0], kneeX, 0.5) + sway, kneeY * 1.04], [backLo[0] + sway, backLo[1]], back];
        attr(mantle, { d: MK.smoothPath(pts, true, 0.45) });
        attr(mantleShade, { d: MK.smoothPath([back, sb, rot([-sw * 0.2, -0.75 * T]), rot([-hw * 0.2, 0.05 * T]), [MK.lerp(backLo[0], kneeX, 0.35) + sway, kneeY * 1.0], [backLo[0] + sway, backLo[1]]], true, 0.45) });
        mantleFolds.forEach((fl, i) => {
          const u = 0.25 + 0.22 * i;
          const a = MK.mix(sf, sb, u * 0.8), b = MK.mix(hipF, back, u), c = [MK.lerp(kneeX, backLo[0], u) + sway, MK.lerp(kneeY, backLo[1], u) - lw * 0.25];
          attr(fl, { d: `M${pt(a)}Q${pt(b)} ${pt(c)}` });
        });
        if (mantleEdge) attr(mantleEdge, { d: `M${pt(sf)}Q${pt(rot([sw * 0.55, -0.62 * T]))} ${pt(hipF)}L${pt([kneeX + sway, kneeY])}` });
      }
      if (collar) {
        const cN = rot([0, -1.0 * T]);
        collar.forEach((c, i) => {
          const r = sw * (0.42 + 0.12 * i), ry = T * (0.1 + 0.055 * i);
          const a = rot([-r, -1.0 * T + ry * 0.15]), b = rot([r, -1.0 * T + ry * 0.15]);
          attr(c, { d: `M${pt(a)}Q${pt([cN[0], cN[1] + ry * 2.1])} ${pt(b)}` });
        });
      }
      if (bands) {
        const shN = [ch[0] + P.shw * 0.55 * cs, ch[1] + P.shw * 0.55 * sn], eN = L(j.elbowN), wN = L(j.handN);
        const seg = (a, b, u, w) => { const m = MK.mix(a, b, u), dx = b[0] - a[0], dy = b[1] - a[1], n = Math.hypot(dx, dy) || 1; return `M${pt([m[0] - dx / n * w, m[1] - dy / n * w])}L${pt([m[0] + dx / n * w, m[1] + dy / n * w])}`; };
        attr(bands[0], { d: seg(shN, eN, 0.5, P.armW * 0.13) });
        attr(bands[1], { d: seg(eN, wN, 0.8, P.armW * 0.11) });
      }
      // cabeça (sistema da cabeça: centro na origem, raio R)
      const turn = MK.clamp(pose.turn ?? 0.3, 0, 1), cx = 0.36 * R * turn;
      if (beard) {
        const Lb = 1.0 + 0.9 * o.longBeard, w = 0.92;
        const mo = pose.mouthOpen ?? 0;
        attr(beard, { d: MK.smoothPath([[-w * R, -0.05 * R], [-0.98 * R, 0.55 * R], [-0.7 * R, Lb * 0.75 * R], [cx - 0.1 * R, Lb * R], [cx + 0.25 * R, (Lb + 0.05) * R], [0.75 * R, Lb * 0.78 * R], [0.98 * R, 0.55 * R], [w * R, -0.05 * R], [0.62 * R, 0.3 * R], [cx + 0.25 * R, (0.5 + 0.12 * mo) * R], [cx - 0.2 * R, (0.5 + 0.12 * mo) * R], [-0.62 * R, 0.3 * R]], true, 0.55) });
        let d = "";
        for (let i = 0; i < 5; i++) { const x = MK.lerp(-0.55, 0.65, i / 4) * R + cx * 0.4, y = (0.75 + 0.12 * (i % 2)) * R; d += `M${pt([x, y])}q${(0.12 * R).toFixed(1)},${(0.18 * R).toFixed(1)} 0,${(0.34 * R).toFixed(1)}`; }
        attr(beardCurls, { d });
        attr(moust, { d: MK.smoothPath([[cx - 0.42 * R, 0.42 * R], [cx, 0.3 * R], [cx + 0.45 * R, 0.4 * R], [cx + 0.35 * R, 0.5 * R], [cx, 0.42 * R], [cx - 0.3 * R, 0.52 * R]], true, 0.5) });
      }
      if (diadem) {
        attr(diadem, { d: `M${pt([-1.0 * R, -0.46 * R])}Q${pt([0, -0.64 * R])} ${pt([1.0 * R, -0.46 * R])}` });
        const sw2 = 0.06 * R * Math.sin(t * 2.2 + o.seed);
        attr(diademTie, { d: MK.smoothPath([[-0.98 * R, -0.5 * R], [-1.2 * R, -0.3 * R + sw2], [-1.26 * R, 0.08 * R + sw2], [-1.14 * R, 0.06 * R], [-1.06 * R, -0.3 * R]], true, 0.5) });
      }
      if (band) attr(band, { d: `M${pt([-1.02 * R, -0.5 * R])}Q${pt([0, -0.7 * R])} ${pt([1.02 * R, -0.5 * R])}` });
      return j;
    };
    return self;
  };

  /** Braço que escreve, por cima do suporte (rolo, prancheta, tablete): ombro → cotovelo → mão, na cor da pele e da
      manga do personagem, mais o junco/estilete até a ponta. O braço do personagem vai lá com reachN/reachF; esta cópia
      fica por cima do suporte, então o braço inteiro (não só a mão) passa na frente dele.
      draw(j (juntas do draw), ponta [x,y], {opacity}); hand(ponta, facing) diz onde pôr a mão (reachN). */
  MK.pen = function (parent, who, { color = "#5E3F24", width = 5, back = false, upper = !back, from = 0.35, len = 46, angle = 35 } = {}) {
    const g = el("g", { "data-mk-role": "limb", "data-mk-who": (who.p || who).who || "" }, parent);
    const base = who.p || who, P = base.P, po = base.opts || {};
    const skin = back ? MK.shade(po.skin || "#C98A5E", -0.16) : (po.skin || "#C98A5E");
    const cloth = po.jacket || po.shirt || "#E8E1D0";
    const line = el("line", { stroke: color, strokeWidth: width, strokeLinecap: "round" }, g);
    const arm = el("path", { fill: "none", stroke: skin, strokeWidth: P.armW, strokeLinecap: "round", strokeLinejoin: "round" }, g);
    const sleeve = el("path", { fill: "none", stroke: back ? MK.shade(cloth, -0.17) : cloth, strokeWidth: P.armW * 1.18, strokeLinecap: "round" }, g);
    const hand = el("circle", { r: P.hand, fill: skin }, g);
    const knuckle = el("path", { fill: "none", stroke: MK.shade(skin, -0.2), strokeWidth: 2, strokeLinecap: "round" }, g);
    const K = back ? "F" : "N";
    return { g,
      /** Onde a mão fica para a ponta estar em `tip` (o junco inclinado `angle` graus, para trás de quem escreve). */
      hand(tip, facing = 1) { const a = angle * Math.PI / 180; return [tip[0] - facing * len * Math.sin(a), tip[1] - len * Math.cos(a)]; },
      draw(j, tip, { opacity = 1 } = {}) {
        const s = j.scale || 1, sh = j["sh" + K], el2 = j["elbow" + K], h = j["hand" + K];
        // braço de trás: só o antebraço passa por cima (o braço fica atrás do corpo)
        const a0 = upper ? sh : [el2[0] + (h[0] - el2[0]) * from, el2[1] + (h[1] - el2[1]) * from];   // from: quanto do antebraço aparece (0,85 = só a mão)
        attr(arm, { d: `M${a0[0].toFixed(1)},${a0[1].toFixed(1)}${upper ? `L${el2[0].toFixed(1)},${el2[1].toFixed(1)}` : ""}L${h[0].toFixed(1)},${h[1].toFixed(1)}`, strokeWidth: P.armW * s });
        const m = [sh[0] + (el2[0] - sh[0]) * 0.5, sh[1] + (el2[1] - sh[1]) * 0.5];
        attr(sleeve, { d: po.sleeves === "long" || !upper ? "" : `M${sh[0].toFixed(1)},${sh[1].toFixed(1)}L${m[0].toFixed(1)},${m[1].toFixed(1)}`, strokeWidth: P.armW * 1.18 * s });
        attr(line, { x1: h[0] + (h[0] - tip[0]) * 0.25, y1: h[1] + (h[1] - tip[1]) * 0.25, x2: tip[0], y2: tip[1] });
        attr(hand, { cx: h[0], cy: h[1], r: P.hand * s * 1.1 });
        const dx = tip[0] - h[0], dy = tip[1] - h[1], dl = Math.hypot(dx, dy) || 1, nx = -dy / dl, ny = dx / dl, r = P.hand * s;
        attr(knuckle, { d: `M${(h[0] + nx * r * 0.7).toFixed(1)},${(h[1] + ny * r * 0.7).toFixed(1)}Q${(h[0] + dx / dl * r).toFixed(1)},${(h[1] + dy / dl * r).toFixed(1)} ${(h[0] - nx * r * 0.7).toFixed(1)},${(h[1] - ny * r * 0.7).toFixed(1)}` });
        attr(g, { opacity });
      } };
  };

  /** Silhueta contra a luz: o personagem vira uma forma escura com um contorno de luz atrás (filtro SVG).
      Para quem não tem rosto conhecido (Euclides: todo retrato dele é inventado). MK.silhouette(g) aplica no grupo. */
  MK.silhouette = function (g, { color = "#1E2233", rim = "#FFD9A0", glow = 0.55 } = {}) {
    const svg = g.ownerSVGElement, key = `${color}${rim}${glow}`;
    svg.__sil = svg.__sil || {};
    if (!svg.__sil[key]) {
      const id = MK.uid("sil"), defs = svg.querySelector("defs") || el("defs", {}, svg);
      const f = el("filter", { id, x: "-30%", y: "-20%", width: "160%", height: "140%", colorInterpolationFilters: "sRGB" }, defs);
      el("feFlood", { floodColor: rim, result: "rimc" }, f);
      el("feComposite", { in: "rimc", in2: "SourceAlpha", operator: "in", result: "rim" }, f);
      el("feGaussianBlur", { in: "rim", stdDeviation: 9, result: "blur" }, f);
      el("feComponentTransfer", { in: "blur", result: "glow" }, f).appendChild(el("feFuncA", { type: "linear", slope: glow }, f));
      el("feOffset", { in: "rim", dx: -5, dy: -3, result: "edge" }, f);
      el("feFlood", { floodColor: color, result: "dc" }, f);
      el("feComposite", { in: "dc", in2: "SourceAlpha", operator: "in", result: "dark" }, f);
      const m = el("feMerge", {}, f);
      for (const k of ["glow", "edge", "dark"]) el("feMergeNode", { in: k }, m);
      svg.__sil[key] = id;
    }
    attr(g, { filter: `url(#${svg.__sil[key]})` });
    return g;
  };
})();
