/* people.js — Personagens SVG configuráveis, poses, expressões e articulações. */
(function () {
  const MK = window.MK;
  const { el, attr } = MK;
  const D = MK.deg;

  MK.SKIN = ["#F7D7C4", "#EFC1A0", "#E0A57A", "#C98A5E", "#A86B45", "#7E4E31", "#5A3824"];
  MK.HAIR = ["#1E1A1A", "#3B2A20", "#6B4A2E", "#A8743F", "#D9B26A", "#E8E2D8", "#B5452E", "#8A8F99"];
  MK.CLOTH = { red: "#E5533D", coral: "#FF8A60", orange: "#F59E3D", yellow: "#F5C94B", green: "#4FB286",
               teal: "#2FA4A0", sky: "#5AA9E6", blue: "#3F6FD1", navy: "#2C3A5E", purple: "#8E6AD8", pink: "#E87BA8",
               white: "#F2F4F7", gray: "#8D95A3", charcoal: "#3A3F4B", denim: "#3D5A8C", khaki: "#C2A878",
               brown: "#7A5236", black: "#23252B" };

  const PROP = {
    adult: { head: 0.19, neck: 0.03, torso: 0.3, thigh: 0.22, shin: 0.205, ankle: 0.03, upper: 0.165, fore: 0.15,
             hand: 0.027, shw: 0.1, hipw: 0.078, armW: 0.058, legW: 0.074, foot: 0.085 },
    teen: { head: 0.21, neck: 0.03, torso: 0.29, thigh: 0.205, shin: 0.195, ankle: 0.03, upper: 0.155, fore: 0.145,
            hand: 0.027, shw: 0.092, hipw: 0.072, armW: 0.054, legW: 0.07, foot: 0.08 },
    child: { head: 0.27, neck: 0.02, torso: 0.27, thigh: 0.165, shin: 0.155, ankle: 0.03, upper: 0.14, fore: 0.125,
             hand: 0.031, shw: 0.1, hipw: 0.083, armW: 0.066, legW: 0.084, foot: 0.085 },
    elder: { head: 0.19, neck: 0.03, torso: 0.29, thigh: 0.215, shin: 0.2, ankle: 0.03, upper: 0.16, fore: 0.15,
             hand: 0.027, shw: 0.098, hipw: 0.082, armW: 0.056, legW: 0.072, foot: 0.085 },
  };

  // expressões: olhos (abertura, tamanho), sobrancelha (altura, inclinação), boca, abertura, bochechas
  const FACES = {
    neutral: { eyeOpen: 1, eyeSize: 1, brow: 0, browTilt: 0, mouth: "smile", mouthOpen: 0, smile: 0.35, cheeks: 0.25 },
    happy: { eyeOpen: 0.95, eyeSize: 1, brow: 0.25, browTilt: 0, mouth: "smile", mouthOpen: 0, smile: 1, cheeks: 0.45 },
    joy: { eyeOpen: 0.25, eyeSize: 1, brow: 0.45, browTilt: 0, mouth: "grin", mouthOpen: 0.8, smile: 1, cheeks: 0.6 },
    surprised: { eyeOpen: 1.25, eyeSize: 1.15, brow: 1, browTilt: 0, mouth: "o", mouthOpen: 0.7, smile: 0, cheeks: 0.2 },
    wow: { eyeOpen: 1.2, eyeSize: 1.2, brow: 0.9, browTilt: 0.1, mouth: "grin", mouthOpen: 1, smile: 0.8, cheeks: 0.5 },
    thinking: { eyeOpen: 0.85, eyeSize: 1, brow: 0.3, browTilt: 0.35, mouth: "smirk", mouthOpen: 0, smile: 0.2, cheeks: 0.2, look: [0.6, -0.7] },
    sad: { eyeOpen: 0.8, eyeSize: 1, brow: 0.1, browTilt: 0.6, mouth: "frown", mouthOpen: 0, smile: -0.6, cheeks: 0.1 },
    worried: { eyeOpen: 1.05, eyeSize: 1.05, brow: 0.5, browTilt: 0.7, mouth: "flat", mouthOpen: 0.15, smile: -0.2, cheeks: 0.15 },
    angry: { eyeOpen: 0.8, eyeSize: 1, brow: -0.6, browTilt: -0.8, mouth: "frown", mouthOpen: 0.2, smile: -0.5, cheeks: 0.3 },
    furious: { eyeOpen: 0.55, eyeSize: 0.95, brow: -1.0, browTilt: -1.5, mouth: "grit", mouthOpen: 0.5, smile: -0.7, cheeks: 0.5 },   // dentes cerrados; junto com rage: 1
    blow: { eyeOpen: 0.9, eyeSize: 1, brow: 0.2, browTilt: 0, mouth: "blow", mouthOpen: 0.3, smile: 0, cheeks: 1 },
    talk: { eyeOpen: 1, eyeSize: 1, brow: 0.3, browTilt: 0, mouth: "open", mouthOpen: 0.5, smile: 0.5, cheeks: 0.35 },
    sleepy: { eyeOpen: 0.2, eyeSize: 1, brow: -0.1, browTilt: 0.2, mouth: "flat", mouthOpen: 0, smile: 0, cheeks: 0.2 },
    smug: { eyeOpen: 0.6, eyeSize: 1, brow: 0.2, browTilt: -0.2, mouth: "smirk", mouthOpen: 0, smile: 0.7, cheeks: 0.4 },
    scared: { eyeOpen: 1.3, eyeSize: 1.25, brow: 0.9, browTilt: 0.8, mouth: "open", mouthOpen: 0.75, smile: -0.4, cheeks: 0.1 },
  };
  MK.FACES = FACES;

  /** Fala: abertura da boca (0–1) oscilando entre t0 e t1 como sílabas (semente muda o ritmo). */
  MK.talk = function (t, t0, t1, seed = 1) {
    if (t < t0 || t > t1) return 0;
    const v = 0.5 + 0.5 * Math.sin(t * 23 + seed) * Math.sin(t * 9.7 + 2 * seed);
    return MK.clamp(0.15 + 0.85 * Math.abs(v)) * MK.window(t, t0, t1, 0.05, 0.08);
  };

  // ── poses prontas (só os campos que mudam; misture com MK.mix ou MK.keys) ─────────────────────────────────
  MK.pose = {
    stand: () => ({ lean: 0, nod: 0, armN: [8, 10], armF: [-6, 12], legN: [3, 3], legF: [-3, 3], footN: 0, footF: 0 }),
    relaxed: () => ({ lean: -2, nod: 2, armN: [12, 25], armF: [-10, 20], legN: [6, 4], legF: [-5, 6] }),
    /** Andar: phase em ciclos (2 passos por ciclo). Para o pé não escorregar: phase = pessoa.walkPhase(distância andada, { scale }). */
    walk: (phase, { stride = 26, arm = 22, lean = 4 } = {}) => {
      const a = 2 * Math.PI * phase, s = Math.sin(a), c = Math.cos(a);
      const tri = (2 / Math.PI) * Math.asin(MK.clamp(s, -1, 1));                // perna em onda triangular: o pé de apoio anda a velocidade constante
      const knee = (x) => 6 + 42 * Math.pow(Math.max(0, Math.cos(x)), 2);     // joelho dobra só na ida da perna
      // plant: a perna que vai para trás é a de apoio (o corpo pousa nela); com walkPhase o pé de apoio não escorrega
      return { lean, plant: c < 0 ? "N" : "F", nod: 1.5 * Math.sin(2 * a), armN: [-arm * s, 18 + 10 * Math.max(0, -s)], armF: [arm * s, 18 + 10 * Math.max(0, s)],
               legN: [stride * tri, knee(a)], legF: [-stride * tri, knee(a + Math.PI)],
               footN: -8 * c, footF: 8 * c };
    },
    run: (phase, { stride = 42, arm = 50, lean = 12 } = {}) => {
      const a = 2 * Math.PI * phase, s = Math.sin(a);
      const knee = (x) => 20 + 70 * Math.pow(Math.max(0, Math.sin(x + 1.1)), 1.5);
      return { lean, nod: 3 * Math.sin(2 * a), armN: [-arm * s, 85], armF: [arm * s, 85],
               legN: [stride * s + 8, knee(a)], legF: [-stride * s + 8, knee(a + Math.PI)], footN: -10 * Math.cos(a), footF: 10 * Math.cos(a) };
    },
    /** Acenar com a mão da frente (phase em ciclos). */
    wave: (phase = 0) => ({ armN: [150, 25 + 25 * Math.sin(2 * Math.PI * phase)], armF: [-6, 12], lean: -2 }),
    /** Apontar: ang = direção do braço (graus; 90 à frente, 135 para cima à frente). */
    point: (ang = 95) => ({ armN: [ang, 4], armF: [-8, 14], lean: 2 }),
    /** Segurar algo à frente do peito com as duas mãos. */
    hold: (h = 0) => ({ armN: [38 + 25 * h, 70 - 10 * h], armF: [30 + 25 * h, 80 - 10 * h], lean: 2 }),
    /** Soprar uma bolha: inclina, mão da frente perto da boca segurando a varinha. */
    blow: () => ({ lean: 6, nod: 2, armN: [38, 72], armF: [-4, 18], face: "blow" }),
    think: () => ({ armN: [30, 140], armF: [20, 95], lean: -2, nod: -6, face: "thinking" }),
    shrug: () => ({ armN: [35, 95], armF: [30, 95], lean: -3, nod: -3, face: "smug" }),
    cheer: () => ({ armN: [165, 15], armF: [158, 20], lean: -4, nod: -8, face: "joy" }),
    surprised: () => ({ armN: [60, 120], armF: [52, 120], lean: -6, nod: -6, face: "surprised" }),
    facepalm: () => ({ armN: [40, 150], armF: [-6, 12], lean: 4, nod: 12, face: "sad" }),
    /** Sentado num banco: ponha y no assento (sem ground). */
    sit: () => ({ lean: -3, armN: [25, 50], armF: [20, 55], legN: [88, 92], legF: [84, 95], footN: 0, footF: 0 }),
    /** Agachado, olhando algo no chão. */
    crouch: () => ({ lean: 25, nod: 18, armN: [45, 45], armF: [30, 50], legN: [70, 125], legF: [40, 120] }),
    lookUp: () => ({ lean: -6, nod: -22, armN: [6, 10], armF: [-6, 12], look: [0.2, -1] }),
  };

  let personCount = 0;
  /** Personagem. Devolve {g, draw(pose, t), j (juntas da última pose), opts, P, slot(nome), parts}.
      opts.name: o nome que aparece nos avisos de sobreposição ("braço (Dion) cobre 30 % de texto ...").
      Encaixes (p.slot(nome) devolve um <g> que acompanha o corpo; só entra no DOM quando pedido):
        "back"    atrás de tudo, sistema do corpo (quadril na origem, olhando para +x)
        "clothes" por cima do tronco e das pernas, abaixo da cabeça e do braço da frente (figurino), sistema do corpo
        "torso"   mesma profundidade, mas no sistema do TRONCO (gira com lean; para cima é −y)
        "head"    por cima do cabelo, sistema da cabeça (centro na origem, raio p.P.head / 2; gira com lean + nod)
        "handN" / "handF"  objeto na mão, POR BAIXO da mão (a mão aparece segurando): origem no punho, +y ao longo do
                  antebraço (do cotovelo para a mão)
        "front"   por cima de tudo, sistema do corpo
      Pose: reachN/reachF = [x, y] leva a mão até lá; bendN/bendF = 1 ou −1 escolhe para que lado o cotovelo dobra;
      awayN/awayF = [x, y] escolhe sozinho o lado em que o cotovelo fica mais longe desse ponto (o braço que escreve
      não passa por cima do que já foi escrito).
      Ambiente (atmos.js): sun = env.sun(t) alonga e gira a sombra pelo sol e acende um contorno claro do lado do sol
      (opts.rim: false desliga); wind = env.wind.at(t, x) levanta o rabo de cavalo. shadowY / shadowX / shadowW: onde fica
      a sombra (no chão durante o pulo, comprida com a pessoa deitada). Roteiro de ações pronto: actions.js (MK.actor). */
  MK.person = function (parent, o = {}) {
    o = Object.assign({ size: 600, age: "adult", skin: MK.SKIN[2], hair: MK.HAIR[1], hairStyle: "short",
      shirt: MK.CLOTH.blue, pants: MK.CLOTH.navy, shoes: "#2A2B33", sleeves: "short", legs: "long", seed: 1,
      skirt: null, jacket: null, longJacket: false, stripes: null, glasses: false, beard: false, hat: null,
      hatColor: null, blush: "#FF7F7F", outline: null, lips: "#7A2E2E", feet: "shoes", name: null }, o);
    if (o.feet === "bare") o.shoes = MK.shade(o.skin, -0.04);      // pé descalço: o "sapato" vira pé
    // papéis para a conferência de sobreposição (layout.js): só atributos, não mudam o desenho
    const who = o.name || `pessoa ${++personCount}`;
    const role = (r) => ({ "data-mk-role": r, "data-mk-who": who });
    const P = Object.assign({}, PROP[o.age] || PROP.adult);
    const h = o.size;
    for (const k in P) P[k] *= h;
    const R = P.head / 2;
    const dark = (c, a = 0.17) => MK.shade(c, -a);
    const skinD = dark(o.skin, 0.12), skinF = dark(o.skin, 0.16);
    const g = el("g", { "data-mk-person": who }, parent);
    let rimF = null;                                             // filtro do lado iluminado (criado quando há sol)
    const body = el("g", {}, g);
    const shadow = el("ellipse", { fill: "#000", opacity: 0.18 }, g);
    g.insertBefore(shadow, body);

    const limb = (color, w, r = null) => el("path", { fill: "none", stroke: color, strokeWidth: w, strokeLinecap: "round", strokeLinejoin: "round", ...(r ? role(r) : {}) }, body);
    const hairBack = el("path", { fill: o.hair }, body);
    const tail = el("path", { fill: o.hair }, body);
    // braço de trás
    const armF = limb(o.sleeves === "long" ? dark(o.shirt) : skinF, P.armW, "limb");
    const sleeveF = limb(dark(o.jacket || o.shirt), P.armW * 1.18, "limb");
    const handF = el("circle", { r: P.hand, fill: skinF, ...role("limb") }, body);
    // pernas
    const mkLeg = (shade) => ({
      skin: limb(shade ? skinF : o.skin, P.legW * 0.92, "body"),
      pants: limb(shade ? dark(o.pants) : o.pants, P.legW, "body"),
      shoe: el("path", { fill: shade ? dark(o.shoes, 0.25) : o.shoes, ...role("body") }, body),
    });
    const legF = mkLeg(true), legN = mkLeg(false);
    const pelvis = el("path", { fill: o.skirt || o.pants, ...role("body") }, body);
    const neck = el("path", { fill: skinD }, body);                  // atrás da roupa: a gola cobre a base do pescoço
    const torso = el("path", { fill: o.shirt, ...role("body") }, body);
    // a sombra do tronco é recortada pelo próprio tronco: é sombra DELE, nunca sai da silhueta (a curva dela fazia uma
    // barriga acima da borda e sombreava o pescoço; self.anatomy confere)
    const shadeClip = MK.uid("ts");
    const shadeClipPath = el("path", {}, el("clipPath", { id: shadeClip }, body));
    const torsoShade = el("path", { fill: "#000", opacity: 0.1, clipPath: `url(#${shadeClip})` }, body);
    let stripes = null;
    if (o.stripes) {
      const cid = MK.uid("tc");
      const cp = el("clipPath", { id: cid }, body);
      const cpPath = el("path", {}, cp);
      stripes = { g: el("g", { clipPath: `url(#${cid})` }, body), cp: cpPath, lines: [] };
      for (let i = 0; i < 4; i++) stripes.lines.push(el("rect", { fill: o.stripes }, stripes.g));
    }
    const jacket = o.jacket ? [el("path", { fill: o.jacket }, body), el("path", { fill: dark(o.jacket, 0.08) }, body)] : null;
    const neckV = el("path", { fill: skinD }, body);                 // a pele que aparece no decote
    const collar = el("path", { fill: "none", stroke: dark(o.jacket || o.shirt, 0.25), strokeWidth: h * 0.006, strokeLinecap: "round" }, body);
    // cabeça
    const head = el("g", {}, body);
    const earB = el("ellipse", { fill: skinD }, head);
    const face = el("ellipse", { fill: o.skin, ...role("face") }, head);
    const earF = el("ellipse", { fill: o.skin }, head);
    const cheekL = el("ellipse", { fill: o.blush }, head), cheekR = el("ellipse", { fill: o.blush }, head);
    const nose = el("path", { fill: skinD }, head);
    const eyes = [0, 1].map(() => ({ e: el("ellipse", { fill: "#1D1B22" }, head), hl: el("circle", { fill: "#fff" }, head) }));
    const brows = [0, 1].map(() => el("path", { fill: "none", stroke: dark(o.hair, 0.2), strokeWidth: R * 0.09, strokeLinecap: "round" }, head));
    const mouth = el("path", { fill: "none", stroke: "#3A1E22", strokeWidth: R * 0.075, strokeLinecap: "round", strokeLinejoin: "round" }, head);
    const teeth = el("path", { fill: "#fff" }, head);
    const tongue = el("path", { fill: "#E46A6A" }, head);
    const beard = o.beard ? el("path", { fill: o.hair }, head) : null;
    const hairFront = el("path", { fill: o.hair }, head);
    const hairShine = el("path", { fill: "#fff", opacity: 0.12 }, head);
    const glasses = o.glasses ? el("path", { fill: "none", stroke: "#222", strokeWidth: R * 0.07 }, head) : null;
    const hat = o.hat ? el("path", { fill: o.hatColor || MK.CLOTH.red }, head) : null;
    const hatBrim = o.hat === "cap" ? el("path", { fill: dark(o.hatColor || MK.CLOTH.red, 0.15) }, head) : null;
    // braço da frente
    const armN = limb(o.sleeves === "long" ? o.shirt : o.skin, P.armW, "limb");
    const sleeveN = limb(o.jacket || o.shirt, P.armW * 1.18, "limb");
    const handN = el("circle", { r: P.hand, fill: o.skin, ...role("limb") }, body);

    const dir = (a) => [Math.sin(a * D), Math.cos(a * D)];          // 0 = para baixo, + para a frente (x+)
    const add = (p, v, s) => [p[0] + v[0] * s, p[1] + v[1] * s];
    const pt = (p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;

    function shoePath(ank, ang) {
      const L = P.foot, hgt = P.ankle * 1.5, a = ang * D, c = Math.cos(a), s = Math.sin(a);
      const loc = [[-0.32 * L, -0.4 * hgt], [0.25 * L, -0.55 * hgt], [0.7 * L, -0.15 * hgt], [0.72 * L, 0.55 * hgt],
                   [-0.36 * L, 0.55 * hgt], [-0.38 * L, 0.05 * hgt]];
      const w = loc.map(([x, y]) => [ank[0] + x * c - y * s, ank[1] + P.ankle * 0.6 + x * s + y * c]);
      return MK.smoothPath(w, true, 0.7);
    }

    const self = { g, opts: o, P, j: {}, who, parts: { body, head, face, torso, armN, armF, handN, handF } };
    // encaixes: criados só quando pedidos (sem eles o DOM fica igual ao de antes)
    const slots = {};
    const SLOT_AT = { back: () => [body, body.firstChild], clothes: () => [body, head], torso: () => [body, head],
                      head: () => [head, null], handN: () => [body, armN], handF: () => [body, armF], front: () => [body, null] };
    (MK.people || (MK.people = [])).push(self);                       // a conferência (layout.js) olha o alcance das mãos
    self.slot = function (name) {
      if (slots[name]) return slots[name];
      if (!SLOT_AT[name]) throw new Error(`MK.person: encaixe desconhecido "${name}" (back, clothes, torso, head, handN, handF, front)`);
      const [par, before] = SLOT_AT[name]();
      // o encaixe já leva o papel: o que vai na mão é objeto da pessoa; o resto (figurino, chapéu, flor) é corpo dela
      const sg = el("g", { "data-mk-slot": name, ...role(name === "handN" || name === "handF" ? "prop" : "body") });
      par.insertBefore(sg, before);
      return (slots[name] = sg);
    };
    /** Desenha a pose no instante t (t é usado no piscar e na respiração). */
    self.draw = function (pose = {}, t = 0) {
      const q = Object.assign(MK.pose.stand(), { x: 0, y: 0, facing: 1, scale: 1, face: "neutral", turn: 0.3, opacity: 1 }, pose);
      const F = Object.assign({}, FACES[q.face] || FACES.neutral);
      for (const k of ["eyeOpen", "eyeSize", "brow", "browTilt", "mouth", "mouthOpen", "smile", "cheeks", "look"]) if (q[k] !== undefined) F[k] = q[k];
      const lean = q.lean + (o.age === "elder" ? 6 : 0);
      const SS = o.S || q.S || null;                          // com S, a respiração fecha o ciclo no fim do vídeo
      const breathe = 1 + 0.008 * (SS ? MK.osc(SS, t, SS.dur / 3.4, o.seed) : Math.sin((2 * Math.PI * t) / 3.4 + o.seed));
      // FK no sistema local (quadril na origem, olhando para +x)
      const up = dir(180 - lean);                       // eixo do tronco (para cima; + inclina para a frente, x+)
      const shoulder = add([0, 0], up, P.torso * 0.86 * breathe);
      const neckTop = add([0, 0], up, P.torso + P.neck);
      const hc = add(neckTop, dir(180 - lean - q.nod), R * 0.92);
      const legs = {};
      for (const [k, lg, ft] of [["N", q.legN, q.footN], ["F", q.legF, q.footF]]) {
        const hip = [k === "N" ? P.hipw * 0.18 : -P.hipw * 0.18, -P.legW * 0.15];
        const knee = add(hip, dir(lg[0]), P.thigh);
        const ankle = add(knee, dir(lg[0] - lg[1]), P.shin);
        legs[k] = { hip, knee, ankle, foot: ft || 0 };
      }
      // andando (plant): se o pé que vai à frente desce mais que o de apoio, o de apoio fica na ponta do pé (calcanhar sobe)
      if (q.plant) {
        const st = legs[q.plant], sw = legs[q.plant === "N" ? "F" : "N"], up = sw.ankle[1] - st.ankle[1];
        if (up > 0) st.foot += Math.asin(Math.min(1, up / (0.7 * P.foot))) / D;
      }
      // contato com o chão
      let rootY = q.y;
      if (q.ground !== undefined && q.ground !== null) {
        const low = Math.max(legs.N.ankle[1], legs.F.ankle[1]) + P.ankle * 1.42;
        rootY = q.ground - low * q.scale;
      }
      const f = q.facing >= 0 ? 1 : -1, s = q.scale;
      const rot = (p) => { const a = lean * D, c = Math.cos(a), si = Math.sin(a); return [p[0] * c - p[1] * si, p[0] * si + p[1] * c]; };
      const arms = {}, short = { N: 0, F: 0 };
      for (const [k, am0] of [["N", q.armN], ["F", q.armF]]) {
        const sh = add(shoulder, rot([k === "N" ? 1 : -1, 0]), P.shw * 0.55);
        let am = am0;
        const goal = q["reach" + k];                                    // reachN/reachF = [x, y] no sistema do pai: a mão vai até lá
        if (goal) {
          const tx = (goal[0] - q.x) / (f * s) - sh[0], ty = (goal[1] - rootY) / s - sh[1];
          const d = Math.max(1e-3, Math.min(Math.hypot(tx, ty), (P.upper + P.fore) * 0.995));
          short[k] = Math.max(0, Math.hypot(tx, ty) - (P.upper + P.fore) * 0.995) * s;   // quanto a mão ficou longe do alvo (px)
          const base = Math.atan2(tx, ty) / D;
          const al = Math.acos(MK.clamp((P.upper * P.upper + d * d - P.fore * P.fore) / (2 * P.upper * d), -1, 1)) / D;
          // lado do cotovelo: bendN/bendF (1 padrão, −1 o outro) ou awayN/awayF = ponto de que o cotovelo foge
          let bend = q["bend" + k] === -1 ? -1 : 1;
          const away = q["away" + k];
          if (away) {
            const ax = (away[0] - q.x) / (f * s), ay = (away[1] - rootY) / s;
            const dist2 = (b) => { const e = add(sh, dir(base - b * al), P.upper); return (e[0] - ax) ** 2 + (e[1] - ay) ** 2; };
            bend = dist2(1) >= dist2(-1) ? 1 : -1;
          }
          const up = base - bend * al, el2 = add(sh, dir(up), P.upper);
          const ex = sh[0] + tx * (d / Math.hypot(tx, ty) || 1) - el2[0], ey = sh[1] + ty * (d / Math.hypot(tx, ty) || 1) - el2[1];
          am = [up, Math.atan2(ex, ey) / D - up];
          if (k === "N") q.armN = am; else q.armF = am;
        }
        const elbow = add(sh, dir(am[0]), P.upper);
        const fore = am[0] + am[1];
        const wrist = add(elbow, dir(fore), P.fore);
        arms[k] = { sh, elbow, wrist, fore };
      }
      attr(body, { transform: `translate(${q.x.toFixed(2)} ${rootY.toFixed(2)}) scale(${(f * s).toFixed(4)} ${s.toFixed(4)})` });
      attr(g, { opacity: q.opacity });
      // shadowY: a sombra fica no chão mesmo com o corpo no ar (pulo) ou deitado (MK.actor usa)
      const gy = q.shadowY !== undefined ? q.shadowY : q.ground !== undefined && q.ground !== null ? q.ground : rootY + (Math.max(legs.N.ankle[1], legs.F.ankle[1]) + P.ankle * 1.42) * s;
      // sombra: com sun = {x (−1..1, para onde a sombra aponta), elev (0–1), power (0–1)} (env.sun(t)), ela se alonga
      // com o sol baixo e some no escuro; sem sun, a sombra redonda de sempre
      // shadowX / shadowW: centro e largura (× a de pé) da sombra, para quem está deitado (MK.actor usa na queda)
      const rx0 = P.shw * 1.5 * s * (q.shadowW || 1), sx = q.shadowX !== undefined ? q.shadowX : (q.x + f * s * (legs.N.ankle[0] + legs.F.ankle[0]) / 2);
      let rx = rx0, scx = sx, sop = 0.18;
      if (q.sun) { const L = 1 + 2.4 * (1 - MK.clamp(q.sun.elev ?? 1)) * MK.clamp(q.sun.power ?? 1); rx = rx0 * L; scx = sx + (q.sun.x || 0) * (rx - rx0); sop = 0.18 * (0.25 + 0.85 * MK.clamp(q.sun.power ?? 1)) / Math.sqrt(L); }
      attr(shadow, { cx: scx, cy: gy, rx, ry: P.shw * 0.28 * s, opacity: q.shadow === false ? 0 : sop * q.opacity });
      // lado iluminado: com sun, um contorno claro na borda virada para o sol (rim: false desliga; sun.color muda a cor)
      if (q.sun && o.rim !== false && (q.sun.power ?? 1) > 0.05) {
        if (!rimF) {
          const svg = g.ownerSVGElement, defs = svg.querySelector("defs") || el("defs", {}, svg), id = MK.uid("rim");
          rimF = el("filter", { id, x: "-10%", y: "-10%", width: "120%", height: "120%" }, defs);
          rimF.innerHTML = '<feOffset in="SourceAlpha" result="o"/><feComposite in="SourceAlpha" in2="o" operator="out" result="e"/>' +
            '<feGaussianBlur in="e" stdDeviation="1.8" result="eb"/><feFlood result="c"/><feComposite in="c" in2="eb" operator="in" result="lit"/>' +
            '<feComposite in="lit" in2="SourceAlpha" operator="in" result="lit2"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="lit2"/></feMerge>';
          rimF.url = `url(#${id})`;
        }
        const pw = MK.clamp(q.sun.power ?? 1), w = 0.011 * o.size * (0.6 + 0.4 * pw);
        // a sombra aponta para sun.x; a luz vem do outro lado e de cima: a borda que sobra ao deslocar para longe do sol é a iluminada
        const sx2 = (q.sun.x || 0), sy2 = 0.35 + 0.65 * MK.clamp(q.sun.elev ?? 0.6);
        MK.attr(rimF.children[0], { dx: (f * sx2 * w / s).toFixed(2), dy: (sy2 * w / s).toFixed(2) });
        MK.attr(rimF.children[3], { "flood-color": q.sun.color || "#FFE9B8", "flood-opacity": (0.42 * pw).toFixed(3) });
        if (body.getAttribute("filter") !== rimF.url) body.setAttribute("filter", rimF.url);
      } else if (rimF && body.hasAttribute("filter")) body.removeAttribute("filter");

      // braço de trás
      const A = arms.F;
      attr(armF, { d: `M${pt(A.sh)}L${pt(A.elbow)}L${pt(A.wrist)}` });
      attr(sleeveF, { d: o.sleeves === "long" ? "" : `M${pt(A.sh)}L${pt(add(A.sh, dir(q.armF[0]), P.upper * 0.5))}` });
      attr(handF, { cx: A.wrist[0], cy: A.wrist[1] });
      // pernas
      for (const [k, Lg] of [["F", legF], ["N", legN]]) {
        const L = legs[k];
        const full = `M${pt(L.hip)}L${pt(L.knee)}L${pt(L.ankle)}`;
        if (o.legs === "shorts") {
          attr(Lg.skin, { d: full });
          attr(Lg.pants, { d: `M${pt(L.hip)}L${pt(add(L.hip, [(L.knee[0] - L.hip[0]) * 0.75, (L.knee[1] - L.hip[1]) * 0.75], 1))}` });
        } else {
          attr(Lg.skin, { d: "" });
          attr(Lg.pants, { d: full });
        }
        attr(Lg.shoe, { d: shoePath(L.ankle, L.foot) });
      }
      // pelve / saia
      const hw = P.hipw;
      if (o.skirt) {
        const sl = P.thigh * 0.85;
        attr(pelvis, { d: MK.smoothPath([[-hw * 1.05, -P.legW * 0.6], [hw * 1.05, -P.legW * 0.6], [hw * 1.75, sl], [0, sl * 1.05], [-hw * 1.75, sl]], true, 0.5) });
      } else {
        attr(pelvis, { d: MK.smoothPath([[-hw, -P.legW * 0.9], [hw, -P.legW * 0.9], [hw * 1.02, P.legW * 0.15], [0, P.legW * 0.45], [-hw * 1.02, P.legW * 0.15]], true, 0.6) });
      }
      // tronco (desenhado no sistema do tronco e girado pela inclinação)
      const T = P.torso * breathe, sw = P.shw, ww = hw * (o.age === "child" ? 1.08 : 0.92);
      // a borda de cima tem os cantos do decote (±0,3·sw) como pontos: no smoothPath a tangente de um ponto vem dos vizinhos,
      // então com três pontos em −T o trecho do meio sai RETO em −T, que é onde o decote e a gola supõem a borda. Sem eles a
      // curva fazia uma barriga acima de −T (1,1 % do tronco) e deixava uma faixa de camiseta na frente do pescoço
      // (self.anatomy confere). A barriga que sobra fica entre 0,3 e 0,72·sw, sobre os ombros, fora do pescoço.
      const loc = [[-hw * 1.02, 0.02 * T], [-ww, -0.42 * T], [-sw, -0.84 * T], [-sw * 0.72, -1.0 * T], [-sw * 0.3, -1.0 * T], [sw * 0.3, -1.0 * T], [sw * 0.72, -1.0 * T], [sw, -0.84 * T], [ww * (o.age === "child" ? 1.06 : 1), -0.42 * T], [hw * 1.02, 0.02 * T]];
      const tw = loc.map(rot);
      const torsoD = MK.smoothPath(tw, true, 0.55);
      attr(torso, { d: torsoD });
      attr(shadeClipPath, { d: torsoD });
      attr(torsoShade, { d: MK.smoothPath([[-hw * 1.02, 0.02 * T], [-ww, -0.42 * T], [-sw, -0.84 * T], [-sw * 0.72, -T], [-sw * 0.25, -T], [-ww * 0.45, -0.42 * T], [-hw * 0.4, 0.02 * T]].map(rot), true, 0.5) });
      if (stripes) {
        attr(stripes.cp, { d: torsoD });
        stripes.lines.forEach((ln, i) => {
          const yy = -T * (0.22 + 0.19 * i);
          attr(ln, { x: -sw * 1.6, y: yy - T * 0.045, width: sw * 3.2, height: T * 0.09, transform: `rotate(${lean.toFixed(2)})` });
        });
      }
      if (jacket) {
        const jl = o.longJacket ? 0.5 * P.thigh : 0.04 * T;
        attr(jacket[0], { d: MK.smoothPath([[-hw * 1.08, jl], [-ww * 1.04, -0.42 * T], [-sw * 1.04, -0.84 * T], [-sw * 0.74, -1.02 * T], [-sw * 0.18, -1.0 * T], [-sw * 0.08, -0.5 * T], [-hw * 0.1, jl]].map(rot), true, 0.5) });
        attr(jacket[1], { d: MK.smoothPath([[hw * 1.08, jl], [ww * 1.04, -0.42 * T], [sw * 1.04, -0.84 * T], [sw * 0.74, -1.02 * T], [sw * 0.18, -1.0 * T], [sw * 0.08, -0.5 * T], [hw * 0.1, jl]].map(rot), true, 0.5) });
      }
      attr(collar, { d: `M${pt(rot([-sw * 0.32, -0.99 * T]))}L${pt(rot([0, -0.86 * T]))}L${pt(rot([sw * 0.32, -0.99 * T]))}` });
      // o decote sobe 2 % do tronco acima da borda (dentro da largura do pescoço): COBRE a borda em vez de só encostar nela,
      // senão o antisserrilhado deixa uma linha fina de camiseta atravessando o pescoço (self.anatomy confere, ≥ 1 px)
      attr(neckV, { d: o.shirt === o.skin ? "" : `M${pt(rot([-sw * 0.3, -1.02 * T]))}L${pt(rot([-sw * 0.3, -1.0 * T]))}Q${pt(rot([-sw * 0.12, -0.93 * T]))} ${pt(rot([0, -0.87 * T]))}Q${pt(rot([sw * 0.12, -0.93 * T]))} ${pt(rot([sw * 0.3, -1.0 * T]))}L${pt(rot([sw * 0.3, -1.02 * T]))}Z` });
      // de frente (turn ≤ 0,15) o braço de trás vai para a frente do tronco (atrás da cabeça), como a manga da frente: os
      // dois ombros na mesma camada. De 3/4 e perfil ele volta para trás do corpo. A camada só muda quando o estado muda.
      const farFront = q.turn <= 0.15;
      if (farFront !== self.__farFront) {
        const anchor = farFront ? head : legF.skin;
        for (const e of [slots.handF, armF, sleeveF, handF]) if (e) body.insertBefore(e, anchor);
        self.__farFront = farFront;
      }
      self.__turn = q.turn;
      self.__reachF = q.reachF ? [(q.reachF[0] - q.x) / (f * s), (q.reachF[1] - rootY) / s] : null;   // no sistema local (o dos paths)
      self.__neckLine = { a: neckTop, b: rot([0, -0.87 * T]), T, w: R * 0.34 * 0.85 };   // conferência de anatomia (self.anatomy)
      const nb = rot([0, -0.9 * T]);
      const nw = R * 0.34;
      // pescoço afinado no meio (curvas), base escondida atrás da roupa
      attr(neck, { d: `M${pt([nb[0] - nw * 1.15, nb[1]])}Q${pt([neckTop[0] - nw * 0.78, (nb[1] + neckTop[1]) / 2])} ${pt([neckTop[0] - nw * 0.9, neckTop[1] - R * 0.25])}L${pt([neckTop[0] + nw * 0.9, neckTop[1] - R * 0.25])}Q${pt([neckTop[0] + nw * 0.78, (nb[1] + neckTop[1]) / 2])} ${pt([nb[0] + nw * 1.15, nb[1]])}Z` });

      // cabeça: sistema próprio (centro na origem), girado pela inclinação + aceno
      attr(head, { transform: `translate(${hc[0].toFixed(2)} ${hc[1].toFixed(2)}) rotate(${(lean + q.nod).toFixed(2)})` });
      const turn = MK.clamp(q.turn, 0, 1), cx = 0.36 * R * turn;
      const rage = MK.clamp(q.rage || 0);
      attr(face, { cx: 0, cy: 0, rx: R * 0.97, ry: R, fill: rage > 0 ? MK.mixColor(o.skin, "#D9452E", 0.4 * rage) : o.skin });
      attr(earB, { cx: -R * (0.95 - 0.5 * turn), cy: R * 0.08, rx: R * 0.17, ry: R * 0.24 });
      attr(earF, { cx: R * 0.95, cy: R * 0.08, rx: R * 0.17, ry: R * 0.24, opacity: turn > 0.35 ? 0 : 1, fill: rage > 0 ? MK.mixColor(o.skin, "#D9452E", 0.4 * rage) : o.skin });
      const look = F.look || [0, 0];
      const lx = (q.look ? q.look[0] : look[0]) * R * 0.07, ly = (q.look ? q.look[1] : look[1]) * R * 0.06;
      const half = 0.36 * R * (1 - 0.42 * turn);
      const bl = q.blink === false ? 1 : MK.blink(t, o.seed, o.S || q.S || null);   // com S: não pisca no fim (loop)
      const op = Math.max(0.06, F.eyeOpen * bl);
      [-1, 1].forEach((sd, i) => {
        const ex = cx + sd * half * (sd < 0 ? 1 - 0.25 * turn : 1) + lx, ey = -0.02 * R + ly;
        const rx = R * 0.105 * F.eyeSize * (sd < 0 ? 1 - 0.25 * turn : 1), ry = R * 0.14 * F.eyeSize * op;
        attr(eyes[i].e, { cx: ex, cy: ey, rx, ry });
        attr(eyes[i].hl, { cx: ex + rx * 0.35, cy: ey - ry * 0.4, r: R * 0.035 * F.eyeSize, opacity: op > 0.4 ? 1 : 0 });
        const by = -0.27 * R - 0.09 * R * F.brow, tilt = F.browTilt * 0.07 * R;
        const bx0 = ex - R * 0.12, bx1 = ex + R * 0.12;
        const inner = sd < 0 ? bx1 : bx0, outer = sd < 0 ? bx0 : bx1;
        attr(brows[i], { d: `M${outer.toFixed(1)},${(by + 0.02 * R).toFixed(1)}Q${ex.toFixed(1)},${(by - 0.05 * R).toFixed(1)} ${inner.toFixed(1)},${(by - tilt).toFixed(1)}` });
        const ch = [cheekL, cheekR][i];
        const pf = F.mouth === "blow" ? 1 : 0;
        attr(ch, { cx: ex + sd * R * (0.05 + 0.08 * pf), cy: R * (0.3 - 0.02 * pf), rx: R * (0.15 + 0.1 * pf), ry: R * (0.1 + 0.08 * pf), opacity: 0.3 * F.cheeks + 0.25 * pf });
      });
      attr(nose, { d: turn > 0.15 ? `M${(cx + 0.06 * R).toFixed(1)},${(0.06 * R).toFixed(1)}q${(0.14 * R).toFixed(1)},${(0.1 * R).toFixed(1)} 0,${(0.2 * R).toFixed(1)}z`
                                   : MK.blob(cx, 0.15 * R, 0.07 * R, { n: 6, wobble: 0.05, seed: 2 }) });
      // boca
      const mx = cx + 0.08 * R * turn, my = 0.44 * R, mw = 0.2 * R, sm = F.smile, mo = MK.clamp(F.mouthOpen);
      let md = "", td = "", tg = "", mFill = "none";
      if (F.mouth === "smile" || F.mouth === "frown") {
        md = `M${(mx - mw).toFixed(1)},${(my - 0.04 * R * sm).toFixed(1)}Q${mx.toFixed(1)},${(my + 0.16 * R * sm).toFixed(1)} ${(mx + mw).toFixed(1)},${(my - 0.04 * R * sm).toFixed(1)}`;
      } else if (F.mouth === "flat") {
        md = `M${(mx - mw * 0.8).toFixed(1)},${my.toFixed(1)}L${(mx + mw * 0.8).toFixed(1)},${my.toFixed(1)}`;
      } else if (F.mouth === "smirk") {
        md = `M${(mx - mw * 0.7).toFixed(1)},${(my + 0.02 * R).toFixed(1)}Q${(mx + 0.1 * R).toFixed(1)},${(my + 0.08 * R).toFixed(1)} ${(mx + mw).toFixed(1)},${(my - 0.07 * R).toFixed(1)}`;
      } else if (F.mouth === "o" || F.mouth === "blow") {
        const rx = R * (F.mouth === "blow" ? 0.06 : 0.08 + 0.04 * mo), ry = R * (F.mouth === "blow" ? 0.07 : 0.08 + 0.08 * mo);
        md = `M${(mx - rx).toFixed(1)},${my.toFixed(1)}a${rx.toFixed(1)},${ry.toFixed(1)} 0 1,0 ${(2 * rx).toFixed(1)},0a${rx.toFixed(1)},${ry.toFixed(1)} 0 1,0 ${(-2 * rx).toFixed(1)},0z`;
        mFill = "#3A1E22";
      } else if (F.mouth === "grit") {                     // dentes cerrados: boca larga e baixa, cantos para baixo
        const w2 = mw * 1.2, h2 = (0.07 + 0.06 * mo) * R, top = my - 0.02 * R, dn = -0.05 * R * sm;
        md = `M${(mx - w2).toFixed(1)},${(top + dn).toFixed(1)}Q${mx.toFixed(1)},${(top - 0.02 * R).toFixed(1)} ${(mx + w2).toFixed(1)},${(top + dn).toFixed(1)}L${(mx + w2 * 0.9).toFixed(1)},${(top + h2 + dn).toFixed(1)}Q${mx.toFixed(1)},${(top + h2 - 0.03 * R).toFixed(1)} ${(mx - w2 * 0.9).toFixed(1)},${(top + h2 + dn).toFixed(1)}Z`;
        mFill = "#3A1E22";
        const i0 = 0.015 * R;
        td = `M${(mx - w2 + i0 * 3).toFixed(1)},${(top + dn + i0).toFixed(1)}Q${mx.toFixed(1)},${(top - 0.02 * R + i0).toFixed(1)} ${(mx + w2 - i0 * 3).toFixed(1)},${(top + dn + i0).toFixed(1)}L${(mx + w2 * 0.86).toFixed(1)},${(top + h2 + dn - i0).toFixed(1)}Q${mx.toFixed(1)},${(top + h2 - 0.03 * R - i0).toFixed(1)} ${(mx - w2 * 0.86).toFixed(1)},${(top + h2 + dn - i0).toFixed(1)}Z`;
      } else {                                           // "open", "grin", "talk": boca em D com língua
        const top = my - 0.03 * R, depth = (0.06 + 0.2 * mo) * R, w2 = mw * (F.mouth === "grin" ? 1.25 : 1);
        md = `M${(mx - w2).toFixed(1)},${top.toFixed(1)}Q${mx.toFixed(1)},${(top + 0.05 * R * sm).toFixed(1)} ${(mx + w2).toFixed(1)},${top.toFixed(1)}Q${(mx + w2 * 0.8).toFixed(1)},${(top + depth * 1.6).toFixed(1)} ${mx.toFixed(1)},${(top + depth * 1.5).toFixed(1)}Q${(mx - w2 * 0.8).toFixed(1)},${(top + depth * 1.6).toFixed(1)} ${(mx - w2).toFixed(1)},${top.toFixed(1)}Z`;
        mFill = "#3A1E22";
        if (F.mouth === "grin") td = `M${(mx - w2 * 0.85).toFixed(1)},${(top + 0.01 * R).toFixed(1)}L${(mx + w2 * 0.85).toFixed(1)},${(top + 0.01 * R).toFixed(1)}L${(mx + w2 * 0.7).toFixed(1)},${(top + 0.07 * R).toFixed(1)}L${(mx - w2 * 0.7).toFixed(1)},${(top + 0.07 * R).toFixed(1)}Z`;
        if (mo > 0.3) tg = MK.blob(mx, top + depth * 1.2, w2 * 0.45, { n: 6, wobble: 0.05, sy: 0.45, seed: 3 });
      }
      attr(mouth, { d: md, fill: mFill });
      attr(teeth, { d: td });
      attr(tongue, { d: tg });
      if (beard) attr(beard, { d: MK.smoothPath([[-0.9 * R, 0.1 * R], [-0.75 * R, 0.62 * R], [cx, 1.08 * R], [0.75 * R, 0.62 * R], [0.9 * R, 0.1 * R], [0.6 * R, 0.4 * R], [cx, 0.62 * R], [-0.6 * R, 0.4 * R]], true, 0.6) });
      // cabelo
      const hs = o.hairStyle, fr = 0.1 * R * turn;
      let hb = "", hf = "", tl = "";
      const cap = (y0 = 0.05, top = 1.12, fringe = -0.42) => MK.smoothPath([[-1.03 * R, y0 * R], [-1.0 * R, -0.45 * R], [-0.62 * R, -0.95 * R], [0, -top * R], [0.62 * R, -0.95 * R], [1.0 * R, -0.45 * R], [1.03 * R, y0 * R], [0.82 * R, (fringe + 0.08) * R], [0.35 * R + fr, (fringe - 0.02) * R], [-0.1 * R + fr, (fringe + 0.06) * R], [-0.6 * R, (fringe - 0.02) * R], [-0.85 * R, (fringe + 0.1) * R]], true, 0.6);
      if (hs === "short" || hs === "kid") hf = cap(-0.1, 1.12, -0.45);
      if (hs === "spiky") hf = MK.smoothPath([[-1.03 * R, -0.1 * R], [-1.0 * R, -0.55 * R], [-0.85 * R, -1.15 * R], [-0.45 * R, -0.95 * R], [-0.2 * R, -1.32 * R], [0.1 * R, -1.02 * R], [0.45 * R, -1.3 * R], [0.62 * R, -0.95 * R], [1.0 * R, -1.05 * R], [1.03 * R, -0.1 * R], [0.5 * R + fr, -0.5 * R], [-0.4 * R + fr, -0.42 * R]], true, 0.35);
      if (hs === "bob") { hf = cap(0.1, 1.14, -0.4); hb = MK.smoothPath([[-1.12 * R, -0.5 * R], [-1.16 * R, 0.55 * R], [-0.7 * R, 0.68 * R], [0.7 * R, 0.68 * R], [1.16 * R, 0.55 * R], [1.12 * R, -0.5 * R], [0, -1.15 * R]], true, 0.7); }
      if (hs === "long") { hf = cap(0.15, 1.14, -0.42); hb = MK.smoothPath([[-1.1 * R, -0.6 * R], [-1.25 * R, 1.2 * R], [-1.0 * R, 2.3 * R], [1.0 * R, 2.3 * R], [1.25 * R, 1.2 * R], [1.1 * R, -0.6 * R], [0, -1.15 * R]], true, 0.6); }
      // wind (força do MK.wind no ponto, com sinal: + para a direita do mundo): o rabo de cavalo levanta para o lado do vento
      const wl = MK.clamp((q.wind || 0) * f, -1.5, 1.5), wf = (q.wind || 0) ? 0.18 * Math.sin(t * 9 + o.seed) * Math.abs(wl) : 0;
      if (hs === "ponytail") { hf = cap(0.0, 1.13, -0.45); tl = MK.smoothPath([[-0.85 * R, -0.55 * R], [-1.45 * R + 0.25 * wl * R, -0.35 * R - 0.2 * Math.abs(wl) * R], [-1.6 * R + 0.9 * wl * R, (0.4 - 0.5 * Math.abs(wl) + wf) * R + 0.1 * R * Math.sin(t * 3 + o.seed)], [-1.3 * R + 1.1 * wl * R, (1.1 - 0.7 * Math.abs(wl)) * R], [-1.15 * R + 0.5 * wl * R, 0.3 * R], [-0.95 * R, -0.15 * R]], true, 0.6); }
      if (hs === "bun") { hf = cap(-0.05, 1.12, -0.44); tl = MK.blob(-0.15 * R, -1.18 * R, 0.4 * R, { n: 8, wobble: 0.06, seed: 5 }); }
      if (hs === "curly" || hs === "afro") {
        const big = hs === "afro" ? 1.35 : 1.08, pts = [];
        for (let i = 0; i <= 14; i++) {
          const a = Math.PI * (1.02 + 0.96 * (i / 14)), rr = R * big * (1 + 0.09 * Math.sin(i * 2.7 + o.seed));
          pts.push([Math.cos(a) * rr, Math.sin(a) * rr * (hs === "afro" ? 1 : 1.04) - 0.08 * R]);
        }
        pts.push([0.95 * R, 0.05 * R], [0.5 * R + fr, -0.42 * R], [-0.2 * R + fr, -0.36 * R], [-0.95 * R, 0.05 * R]);
        hf = MK.smoothPath(pts, true, 0.9);
        if (hs === "afro") hb = MK.blob(0, -0.2 * R, R * 1.4, { n: 12, wobble: 0.06, seed: o.seed + 3 });
      }
      if (hs === "buzz") hf = cap(-0.25, 1.05, -0.55);
      if (hs === "bald") hf = "";
      if (hs === "elder") { hf = MK.smoothPath([[-1.04 * R, 0.05 * R], [-1.05 * R, -0.45 * R], [-0.8 * R, -0.7 * R], [-0.6 * R, -0.35 * R], [-0.85 * R, 0.0 * R]], true, 0.6) + MK.smoothPath([[1.04 * R, 0.05 * R], [1.05 * R, -0.45 * R], [0.8 * R, -0.7 * R], [0.6 * R, -0.35 * R], [0.85 * R, 0.0 * R]], true, 0.6); }
      attr(hairFront, { d: hf });
      attr(hairShine, { d: hf && hs !== "curly" && hs !== "afro" ? MK.smoothPath([[-0.55 * R, -0.82 * R], [-0.1 * R, -1.02 * R], [0.3 * R, -0.95 * R], [-0.1 * R, -0.85 * R]], true, 0.6) : "" });
      // cabelo de trás fica atrás do corpo: posição no sistema do corpo
      const hbT = (d) => d;
      attr(hairBack, { d: hbT(hb), transform: `translate(${hc[0].toFixed(2)} ${hc[1].toFixed(2)}) rotate(${(lean + q.nod).toFixed(2)})` });
      attr(tail, { d: tl, transform: `translate(${hc[0].toFixed(2)} ${hc[1].toFixed(2)}) rotate(${(lean + q.nod).toFixed(2)})` });
      if (glasses) {
        const ex0 = cx - half * (1 - 0.25 * turn), ex1 = cx + half, gr = R * 0.17;
        attr(glasses, { d: `M${(ex0 - gr).toFixed(1)},0a${gr},${gr} 0 1,0 ${2 * gr},0a${gr},${gr} 0 1,0 ${-2 * gr},0M${(ex0 + gr).toFixed(1)},${(-0.02 * R).toFixed(1)}Q${((ex0 + ex1) / 2).toFixed(1)},${(-0.1 * R).toFixed(1)} ${(ex1 - gr).toFixed(1)},${(-0.02 * R).toFixed(1)}M${(ex1 - gr).toFixed(1)},0a${gr},${gr} 0 1,0 ${2 * gr},0a${gr},${gr} 0 1,0 ${-2 * gr},0` });
      }
      if (hat) {
        if (o.hat === "cap") {
          attr(hat, { d: MK.smoothPath([[-1.05 * R, -0.35 * R], [-0.85 * R, -0.95 * R], [0, -1.18 * R], [0.85 * R, -0.95 * R], [1.05 * R, -0.35 * R]], true, 0.6) });
          attr(hatBrim, { d: MK.smoothPath([[0.2 * R, -0.42 * R], [1.6 * R, -0.36 * R], [1.55 * R, -0.24 * R], [0.2 * R, -0.28 * R]], true, 0.4) });
        } else {
          attr(hat, { d: MK.smoothPath([[-1.08 * R, -0.25 * R], [-1.0 * R, -0.85 * R], [0, -1.25 * R], [1.0 * R, -0.85 * R], [1.08 * R, -0.25 * R]], true, 0.6) });
        }
      }
      // braço da frente
      const B = arms.N;
      attr(armN, { d: `M${pt(B.sh)}L${pt(B.elbow)}L${pt(B.wrist)}` });
      attr(sleeveN, { d: o.sleeves === "long" ? "" : `M${pt(B.sh)}L${pt(add(B.sh, dir(q.armN[0]), P.upper * 0.5))}` });
      attr(handN, { cx: B.wrist[0], cy: B.wrist[1] });

      // encaixes que acompanham o tronco e as mãos
      if (slots.torso) attr(slots.torso, { transform: `rotate(${lean.toFixed(2)})` });
      if (slots.handN) attr(slots.handN, { transform: `translate(${B.wrist[0].toFixed(2)} ${B.wrist[1].toFixed(2)}) rotate(${(-B.fore).toFixed(2)})` });
      if (slots.handF) attr(slots.handF, { transform: `translate(${A.wrist[0].toFixed(2)} ${A.wrist[1].toFixed(2)}) rotate(${(-A.fore).toFixed(2)})` });

      // juntas no sistema do pai
      const W2 = (p) => [q.x + f * s * p[0], rootY + s * p[1]];
      const wa = (a) => (f > 0 ? a : -a);             // ângulo de membro no sistema do pai (0 = baixo)
      const mouthW = W2(add(hc, [mx * Math.cos((lean + q.nod) * D) - my * Math.sin((lean + q.nod) * D), mx * Math.sin((lean + q.nod) * D) + my * Math.cos((lean + q.nod) * D)], 1));
      self.j = {
        hip: W2([0, 0]), chest: W2(shoulder), neck: W2(neckTop), head: W2(hc), headR: R * s, top: W2(add(hc, up, R * 1.1)),
        mouth: mouthW, handN: W2(B.wrist), handF: W2(A.wrist), elbowN: W2(B.elbow), elbowF: W2(A.elbow), shN: W2(B.sh), shF: W2(A.sh),
        foreN: wa(B.fore), foreF: wa(A.fore), kneeN: W2(legs.N.knee), kneeF: W2(legs.F.knee),
        footN: W2(legs.N.ankle), footF: W2(legs.F.ankle), ground: gy, facing: f, scale: s, rootY,
        reachShortN: short.N, reachShortF: short.F,                  // > 0: o reachN/F pedia mais do que o braço alcança
      };
      return self.j;
    };
    /** Conferência de anatomia do quadro atual (chamada pelo MK.overlap.check, layout.js). Devolve [{kind, px, msg}]. Hoje: a FAIXA DE ROUPA NO PESCOÇO — descendo pela linha do meio do
        pescoço, a ordem tem de ser pele do pescoço → pele do decote → roupa; roupa entre as duas peles é a borda de
        cima do tronco passando na frente do pescoço. Mede em px de tela (cresce com o tamanho: some em plano aberto e
        aparece em close e capa). Usa a geometria (isPointInFill), não a foto. */
    self.anatomy = function () {
      const out = [], nl = self.__neckLine;
      if (!nl || o.shirt === o.skin || !neck.isPointInFill) return out;
      const sc = (self.j && self.j.scale) || 1, n = 240;
      let worst = 0;
      for (const fx of [-1, -0.5, 0, 0.5, 1]) {                 // cinco linhas verticais pela largura do pescoço
        const dx = fx * nl.w, seq = [];
        for (let i = 0; i <= n; i++) {
          const u = i / n, p = new DOMPoint(nl.a[0] + (nl.b[0] - nl.a[0]) * u + dx, nl.a[1] + (nl.b[1] - nl.a[1]) * u);
          const top = neckV.isPointInFill(p) ? "decote" : torso.isPointInFill(p) || (torsoShade.isPointInFill(p) && !torsoShade.hasAttribute("clip-path")) ? "roupa" : neck.isPointInFill(p) ? "pescoço" : "fora";
          if (!seq.length || seq.at(-1).k !== top) seq.push({ k: top, n: 0 });
          seq.at(-1).n++;
        }
        const step = Math.hypot(nl.b[0] - nl.a[0], nl.b[1] - nl.a[1]) / n * sc;
        for (let i = 1; i + 1 < seq.length; i++)
          if (seq[i].k === "roupa" && seq[i - 1].k === "pescoço" && seq.slice(i + 1).some((q) => q.k === "decote")) worst = Math.max(worst, seq[i].n * step);
      }
      // emenda: o decote tem de COBRIR a borda do tronco por ≥ 1 px de tela na linha do meio. Bordas que só se encostam
      // (as duas em −T) deixam uma linha fina de camiseta no antisserrilhado, visível em close.
      {
        let yT = null, yV = null;
        for (let i = 0; i <= n && (yT === null || yV === null); i++) {
          const u = i / n, pt = new DOMPoint(nl.a[0] + (nl.b[0] - nl.a[0]) * u, nl.a[1] + (nl.b[1] - nl.a[1]) * u);
          if (yT === null && torso.isPointInFill(pt)) yT = pt.y;
          if (yV === null && neckV.isPointInFill(pt)) yV = pt.y;
        }
        const ov = yT !== null && yV !== null ? (yT - yV) * sc : 99;
        if (ov < 1) out.push({ kind: "anatomia", px: 10, msg: `emenda no pescoço de ${who}: o decote só encosta na borda do tronco (sobreposição ${ov.toFixed(1)} px; precisa ≥ 1 px), e o antisserrilhado deixa uma linha fina de camiseta` });
      }
      // de frente (turn ≤ 0,15) as duas mangas ficam na mesma camada, na frente do tronco; com a de trás atrás dele, um
      // ombro lê de frente e o outro de costas ("parece de costas e de frente ao mesmo tempo")
      const farBehind = !!(armF.compareDocumentPosition(torso) & Node.DOCUMENT_POSITION_FOLLOWING);
      if (self.__turn !== undefined && self.__turn <= 0.15 && farBehind)
        out.push({ kind: "anatomia", px: 20, msg: `${who} está de frente (turn ${self.__turn}), mas o braço de trás está atrás do tronco: um ombro lê de frente e o outro de costas` });
      // mão de trás levada a um alvo (reachF) que fica dentro do tronco, com o braço atrás dele: a mão some e o objeto flutua
      if (self.__reachF && farBehind && torso.isPointInFill(new DOMPoint(...self.__reachF)))
        out.push({ kind: "anatomia", px: 20, msg: `a mão de trás de ${who} vai a um alvo na frente do peito, mas o braço está atrás do tronco: a mão some (use a mão da frente, vire a pessoa de frente ou mude o alvo)` });
      if (worst >= 1) out.push({ kind: "anatomia", px: worst, msg: `faixa de roupa atravessando o pescoço de ${who} (${worst.toFixed(1)} px): a borda de cima do tronco passa na frente do pescoço, acima do decote` });
      return out;
    };
    /** Fase do MK.pose.walk para ter andado `dist` px sem o pé de apoio escorregar (mesmo stride e scale da pose):
        pose: MK.pose.walk(p.walkPhase(Math.abs(x - x0), { scale })). Tabela da distância que o pé no chão percorre. */
    const walkTabs = {};
    self.walkPhase = function (dist, { stride = 26, scale = 1 } = {}) {
      let tb = walkTabs[stride];
      if (!tb) {
        const n = 400, foot = (ph) => {
          const q = MK.pose.walk(ph, { stride });
          const a = ["legN", "legF"].map((k) => [P.thigh * Math.sin(q[k][0] * D) + P.shin * Math.sin((q[k][0] - q[k][1]) * D),
                                                 P.thigh * Math.cos(q[k][0] * D) + P.shin * Math.cos((q[k][0] - q[k][1]) * D)]);
          return q.plant === "N" ? [0, a[0][0]] : [1, a[1][0]];
        };
        const cum = [0];
        let prev = foot(0);
        for (let i = 1; i <= n; i++) {
          const cur = foot(i / n);
          cum.push(cum[i - 1] + (cur[0] === prev[0] ? Math.max(0, prev[1] - cur[1]) : 0));
          prev = cur;
        }
        tb = walkTabs[stride] = { n, cum, len: cum[n] };
      }
      const d = Math.abs(dist) / scale, k = Math.floor(d / tb.len), r = d - k * tb.len;
      let i = 1;
      while (i < tb.n && tb.cum[i] < r) i++;
      const a = tb.cum[i - 1], b = tb.cum[i];
      return k + (i - 1 + (b > a ? (r - a) / (b - a) : 0)) / tb.n;
    };
    return self;
  };

  /** Multidão simples (silhuetas variadas com semente), para fundos. Devolve {g, draw(t)}. */
  MK.crowd = function (parent, { n = 8, x0 = 0, x1 = 1080, ground = 1500, size = 380, seed = 7, palette = null, facing = null } = {}) {
    const r = MK.rand(seed), people = [];
    const cl = palette || Object.values(MK.CLOTH);
    const styles = ["short", "bob", "long", "ponytail", "curly", "bun", "spiky", "buzz"];
    for (let i = 0; i < n; i++) {
      const age = r() < 0.2 ? "child" : "adult";
      const p = MK.person(parent, { age, size: size * (age === "child" ? 0.68 : 0.92 + 0.16 * r()), skin: MK.SKIN[Math.floor(r() * MK.SKIN.length)],
        hair: MK.HAIR[Math.floor(r() * 5)], hairStyle: styles[Math.floor(r() * styles.length)], shirt: cl[Math.floor(r() * cl.length)],
        pants: [MK.CLOTH.navy, MK.CLOTH.denim, MK.CLOTH.charcoal, MK.CLOTH.khaki][Math.floor(r() * 4)], seed: seed * 10 + i });
      people.push({ p, x: x0 + ((x1 - x0) * (i + 0.5)) / n + (r() - 0.5) * 30, f: facing || (r() < 0.5 ? -1 : 1), ph: r() * 10 });
    }
    return { people, draw(t, extra = {}) { for (const c of people) c.p.draw({ ...MK.pose.relaxed(), x: c.x, ground, facing: c.f, ...extra, nod: 3 * Math.sin(t * 0.8 + c.ph) }, t + c.ph); } };
  };
})();
