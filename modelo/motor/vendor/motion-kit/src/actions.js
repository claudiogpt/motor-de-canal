/* actions.js — Ações de personagens: deslocamento, alcance e manipulação de objetos. */
(function () {
  const MK = window.MK;
  const timeOf = (v) => (typeof v === "string" ? MK.__S.cue(v) : typeof v === "function" ? v() : v);
  // alvo: [x, y], elemento, {g}/entidade, ou função (t) → qualquer um desses (a função recebe o instante: posição pura)
  const ptOf = (v, t) => { if (typeof v === "function") v = v(t); return v && v.nodeType ? MK.worldPos(v) : v && v.g && !Array.isArray(v) ? MK.worldPos(v.g) : v; };
  // "+1.5" num campo de fim (until, to do say) = 1,5 s depois do começo da própria ação
  const relT = (v, t0) => (typeof v === "string" && v[0] === "+" ? t0 + parseFloat(v.slice(1)) : timeOf(v));
  const ease = (u) => 0.35 * u + 0.65 * MK.ease.smooth(u);       // começa e termina mais devagar, sem parar de vez

  MK.actor = function (p, { x = 0, ground = 900, facing = 1, speed = 280, runSpeed = 640, face = "neutral", scale = 1,
                            pxPerM = 350 } = {}) {
    const P = p.P, G = 9.8 * pxPerM;
    const acts = [], events = [], objs = new Map();
    let segs = [], turns = [], planned = false;
    const legLow = (l) => P.thigh * Math.cos(l[0] * MK.deg) + P.shin * Math.cos((l[0] - l[1]) * MK.deg);
    const st0 = MK.pose.stand(), standRoot = ground - (Math.max(legLow(st0.legN), legLow(st0.legF)) + P.ankle * 1.42) * scale;
    const armLen = (P.upper + P.fore) * scale;

    // ── objetos que a pessoa pega: um <g> por fora, que a lib move ──────────────────────────────────────────
    function objOf(o) {
      if (objs.has(o)) return objs.get(o);
      const node = o.nodeType ? o : o.g;
      if (!node) throw new Error("MK.actor: obj precisa ser um elemento SVG, {g} ou entidade");
      const wrap = document.createElementNS(MK.SVGNS, "g");
      node.parentNode.insertBefore(wrap, node); wrap.appendChild(node);
      const rec = { o, node, wrap, anchor: null, holdFrom: null, releaseAt: null, body: null, rel: null, name: node.getAttribute("data-mk-name") || "objeto" };
      rec.getAnchor = () => {
        if (!rec.anchor) { const tf = wrap.getAttribute("transform"); wrap.removeAttribute("transform"); rec.anchor = MK.worldPos(node); if (tf) wrap.setAttribute("transform", tf); }
        return rec.anchor;
      };
      objs.set(o, rec);
      return rec;
    }

    // ── plano: posições (andar, correr, pulo com deslocamento), viradas, passos, pousos ─────────────────────────
    function plan() {
      segs = []; turns = [[-Infinity, facing]];
      events.length = 0;
      let cx = x;
      for (const a of acts) {
        if (a.kind === "walk" || a.kind === "run") {
          const tv = typeof a.o.to === "function" ? a.o.to() : a.o.to;   // x, [x, y], elemento ou entidade (vai até o x dele)
          const to = Array.isArray(tv) ? tv[0] : tv && (tv.nodeType || tv.g) ? ptOf(tv)[0] : tv;
          const sp = a.o.speed || (a.kind === "run" ? runSpeed : speed), d = Math.abs(to - cx);
          a.t1 = a.t0 + (a.o.dur || (d / sp) * 1.25);
          segs.push({ t0: a.t0, t1: a.t1, x0: cx, x1: to, kind: a.kind, a });
          if (to !== cx) turns.push([a.t0, to > cx ? 1 : -1]);
          // passos: cada meio ciclo da fase
          let last = 0;
          for (let t = a.t0; t <= a.t1; t += 1 / 120) {
            const ph = phaseOf(segs[segs.length - 1], t), k = Math.floor(ph * 2);
            if (k > last) { events.push({ t, kind: "step" }); last = k; }
          }
          cx = to;
        } else if (a.kind === "jump") {
          const h = a.o.h || 120, v = Math.sqrt(2 * G * h), air = (2 * v) / G;
          a.air = air; a.v = v; a.t1 = a.t0 + air;
          if (a.o.to !== undefined) { const to = timeOf(a.o.to); segs.push({ t0: a.t0, t1: a.t1, x0: cx, x1: to, kind: "air", a }); if (to !== cx) turns.push([a.t0, to > cx ? 1 : -1]); cx = to; }
          events.push({ t: a.t1, kind: "land", speed: v });
        } else if (a.kind === "trip" || a.kind === "slip") {
          a.fallT = a.o.dur || 0.42;
          // caiu no meio de uma caminhada: ela para onde caiu (o resto do caminho não acontece)
          const sg = segs[segs.length - 1];
          if (sg && sg.kind !== "air" && sg.t0 < a.t0 && sg.t1 > a.t0) {
            const xc = sg.x0 + (sg.x1 - sg.x0) * ease((a.t0 - sg.t0) / (sg.t1 - sg.t0));
            sg.cut = a.t0; sg.xc = xc; cx = xc;
          }
          events.push({ t: a.t0 + a.fallT, kind: "fall", speed: G * a.fallT });
        } else if (a.kind === "turn") turns.push([a.t0, a.o.facing >= 0 ? 1 : -1]);
      }
      turns.sort((u, v) => u[0] - v[0]);
      planned = true;
      // objetos soltos ou jogados: a física precisa da mão no instante em que sai
      for (const a of acts) if (a.kind === "pick") { const r = objOf(a.o.obj); r.holdFrom = a.t0 + (a.o.dur || 0.45); events.push({ t: r.holdFrom, kind: "pick" }); }
      for (const a of acts) if (a.kind === "drop" || a.kind === "throw") {
        const r = objOf(a.o.obj), T = a.kind === "throw" ? a.t0 + 0.12 : a.t0;
        r.releaseAt = T;
        const hand = jointsAt(T - 1e-3)["hand" + (a.o.hand || "N")], grip = a.o.grip || [0, P.hand * 1.2];
        const at = [hand[0] + grip[0], hand[1] + grip[1]];
        r.rel = at;
        events.push({ t: T, kind: a.kind });
        if (a.kind === "throw" || a.o.fall) {
          const f = facingAt(T), vel = a.kind === "throw" ? [(a.o.vel || [700, -600])[0] * f, (a.o.vel || [700, -600])[1]] : [0, 0];
          const anc = r.getAnchor();
          r.body = MK.body({ at, vel, t0: T, r: a.o.r || 0, floor: a.o.floor !== undefined ? a.o.floor : ground, bounce: a.o.bounce ?? 0.45,
                             friction: a.o.friction ?? 0.8, walls: a.o.walls || null, spin: a.o.spin ?? (a.kind === "throw" ? 420 * f : 0) });
          r.body.anchor = anc;
          for (const h of r.body.impacts) events.push({ t: h.t, kind: "hit", speed: h.speed, obj: r.name });
        }
      }
      events.sort((u, v) => u.t - v.t);
    }
    const facingAt = (t) => { let f = facing; for (const [t0, v] of turns) if (t >= t0) f = v; return f; };
    function phaseOf(sg, t) {
      const xx = sg.x0 + (sg.x1 - sg.x0) * ease(MK.clamp((t - sg.t0) / (sg.t1 - sg.t0)));
      return sg.kind === "run" ? Math.abs(xx - sg.x0) / (P.thigh * 3.4 * scale) : p.walkPhase(Math.abs(xx - sg.x0), { scale });
    }
    function xAt(t) {
      let xx = x;
      for (const sg of segs) {
        if (t < sg.t0) break;
        const tt = sg.cut !== undefined ? Math.min(t, sg.cut) : t;
        xx = sg.x0 + (sg.x1 - sg.x0) * (sg.kind === "air" ? MK.clamp((tt - sg.t0) / (sg.t1 - sg.t0)) : ease(MK.clamp((tt - sg.t0) / (sg.t1 - sg.t0))));
      }
      return xx;
    }
    const win = (t, a, dur, hold, back) => MK.window(t, a.t0, a.t0 + dur + hold, dur, back);

    // ── a pose num instante (sem os braços que miram: esses precisam das juntas) ───────────────────────────────
    function body(t) {
      let q = { ...MK.pose.stand(), x: xAt(t), ground, facing: facingAt(t), face, scale };
      for (const sg of segs) {                                       // andar / correr
        const t1 = sg.cut !== undefined ? sg.cut : sg.t1;
        if (sg.kind === "air" || t < sg.t0 - 0.2 || t > t1 + 0.25) continue;
        const w = MK.window(t, sg.t0, t1, 0.15, 0.2), ph = phaseOf(sg, Math.min(t, t1));
        q = { ...MK.mix(q, sg.kind === "run" ? MK.pose.run(ph) : MK.pose.walk(ph), w), x: q.x, ground, facing: q.facing, face: q.face, plant: w > 0.5 ? MK.pose.walk(ph).plant : undefined };
      }
      for (const a of acts) {
        const o = a.o;
        if (a.kind === "jump") {
          const crouch = MK.pulse(t, a.t0 - 0.06, 0.28) + MK.pulse(t, a.t1 + 0.08, 0.3);
          const tc = { lean: 18, legN: [45, 85], legF: [35, 80], armN: [-30, 30], armF: [-40, 30] };
          if (crouch > 0) q = { ...q, ...MK.mix(q, tc, crouch * 0.8), x: q.x, ground, facing: q.facing, face: q.face };
          if (t > a.t0 && t < a.t1) {
            const u = t - a.t0, hOff = a.v * u - (G / 2) * u * u;
            q = { ...MK.mix(q, { lean: 4, legN: [35, 60], legF: [20, 70], armN: [150, 20], armF: [130, 20] }, 0.85), x: q.x, facing: q.facing, face: q.face,
                  ground: ground - hOff, shadowY: ground, plant: undefined };
          }
        } else if (a.kind === "trip" || a.kind === "slip") {
          if (t < a.t0) continue;
          const dir = a.kind === "trip" ? 1 : -1, until = o.until !== undefined ? relT(o.until, a.t0) : Infinity;
          const u = MK.clamp((t - a.t0) / a.fallT), land = t - a.t0 - a.fallT;
          let A = 88 * u * u;                                         // cai acelerando, como na gravidade
          if (land > 0) A = 88 - 6 * Math.exp(-land * 7) * Math.abs(Math.sin(land * 18));   // quica um pouco ao bater
          const up = until === Infinity ? 0 : MK.ramp(t, until, 0.8);
          A *= 1 - up;
          const hip = MK.mix(standRoot, ground - P.legW * 0.6 * scale, Math.sin((A * Math.PI) / 180));
          const fl = dir > 0
            ? { lean: A, legN: [3 - A, 6 + 10 * u], legF: [-3 - A * 0.95, 14 + 12 * u], armN: [60 + A * 0.6, 25], armF: [45 + A * 0.6, 30] }
            : { lean: -A, legN: [3 + A + 18 * Math.sin(u * Math.PI), 8], legF: [-3 + A + 6 * Math.sin(u * Math.PI), 20], armN: [140 - A * 0.3, 30], armF: [120 - A * 0.2, 35], nod: -10 * u };
          q = { ...q, ...MK.mix(q, fl, Math.min(1, u * 3) * (1 - up)), x: q.x, facing: q.facing, ground: null, y: hip, shadowY: ground, shadowX: q.x, shadowW: 1 + 2.4 * Math.sin((A * Math.PI) / 180), plant: undefined };
          if (o.face !== false && !acts.some((b) => b.kind === "face" && b.t0 > a.t0 && b.t0 <= t)) q.face = land < 0.4 ? "scared" : up > 0 ? "worried" : "sad";
        } else if (a.kind === "sit") {
          const until = o.until !== undefined ? relT(o.until, a.t0) : Infinity, w = MK.window(t, a.t0, until, o.dur || 0.5, o.back || 0.5);
          if (w <= 0) continue;
          q = { ...q, ...MK.mix(q, MK.pose.sit(), w), x: q.x, facing: q.facing, face: q.face, ground: null, y: MK.mix(standRoot, o.y, w), shadowY: ground, plant: undefined };
        } else if (a.kind === "pick" || (a.kind === "reach" && o.crouch)) {
          // pegar algo baixo: agacha sozinho (o quanto precisa), alcança e levanta
          const r = a.kind === "pick" ? objOf(o.obj) : null, tg = r ? r.getAnchor() : ptOf(o.at, a.t0);
          const need = MK.clamp((tg[1] - (ground - 0.42 * p.opts.size * scale)) / (0.36 * p.opts.size * scale));
          if (need <= 0) continue;
          const end = r ? r.holdFrom : a.t0 + (o.dur || 0.5) + (o.hold !== undefined ? o.hold : 1);
          const w = MK.window(t, a.t0 - 0.15, end + 0.05, 0.35, 0.4) * need;
          if (w <= 0) continue;
          const low = { lean: 58, nod: 18, legN: [112, 138], legF: [70, 128], armF: [20, 40] };
          q = { ...q, ...MK.mix(q, low, w), x: q.x, ground, facing: q.facing, face: q.face, plant: undefined };
        } else if (a.kind === "pose") {
          const w = win(t, a, o.dur || 0.3, o.hold !== undefined ? o.hold : 1, o.back || 0.3);
          if (w <= 0) continue;
          const pz = typeof o.pose === "string" ? (o.pose === "wave" ? MK.pose.wave((t - a.t0) * 1.6) : MK.pose[o.pose](...(o.args || []))) : typeof o.pose === "function" ? o.pose(t - a.t0) : o.pose;
          const keep = { x: q.x, ground: q.ground, y: q.y, shadowY: q.shadowY, facing: q.facing };
          q = { ...q, ...MK.mix(q, pz, w), ...keep, face: w > 0.5 && pz.face ? pz.face : q.face };
        } else if (a.kind === "face" && t >= a.t0) { q.face = o.face; Object.assign(q, o.extra || {}); }
        else if (a.kind === "say") { const t1 = o.to !== undefined ? relT(o.to, a.t0) : a.t0 + (o.dur || 2); if (t >= a.t0 && t <= t1) { q.face = q.face === "neutral" ? "talk" : q.face; q.mouthOpen = MK.talk(t, a.t0, t1, o.seed || 3); } }
        else if (a.kind === "turn" || a.kind === "walk" || a.kind === "run") { /* no plano */ }
      }
      return q;
    }

    // braços que miram (alcançar, pegar, apontar, segurar, jogar) e olhar: precisam das juntas da pose livre
    function aim(t, q, j) {
      const out = {};
      let look = null;
      for (const a of acts) {
        const o = a.o, k = o.hand || "N";
        if (a.kind === "reach") {
          const w = win(t, a, o.dur || 0.5, o.hold !== undefined ? o.hold : 1, o.back || 0.4);
          if (w > 0) out[k] = { tgt: ptOf(o.at, t), w };
        } else if (a.kind === "point") {
          const w = win(t, a, o.dur || 0.35, o.hold !== undefined ? o.hold : 1.5, o.back || 0.35);
          if (w > 0) { const tg = ptOf(o.at, t), sh = j["sh" + k], d = Math.hypot(tg[0] - sh[0], tg[1] - sh[1]) || 1;
            out[k] = { tgt: [sh[0] + ((tg[0] - sh[0]) / d) * armLen * 0.97, sh[1] + ((tg[1] - sh[1]) / d) * armLen * 0.97], w }; }
        } else if (a.kind === "pick") {
          const r = objOf(o.obj), dur = o.dur || 0.45;
          if (t >= a.t0 - 0.05 && t < r.holdFrom) { const an = r.getAnchor(), grip = o.grip || [0, P.hand * 1.2]; out[k] = { tgt: [an[0] - grip[0], an[1] - grip[1]], w: MK.ramp(t, a.t0, dur * 0.8) }; }
          else if (t >= r.holdFrom && (r.releaseAt === null || t < r.releaseAt)) {
            // carregando: o braço segura à frente do corpo (a não ser que outra ação mire esta mão)
            const carry = { armN: [32, 78], armF: [28, 82] }["arm" + k];
            out["pose" + k] = carry;
          }
        } else if (a.kind === "throw") {
          const back = MK.ramp(t, a.t0 - 0.35, 0.3), fwd = MK.ramp(t, a.t0, 0.18, "out"), rest = MK.ramp(t, a.t0 + 0.4, 0.4);
          if (back > 0 && rest < 1) out["pose" + k] = MK.mix(MK.mix([150, 30], [70, 10], fwd), q["arm" + k], rest);
        } else if (a.kind === "look") {
          const w = win(t, a, o.dur || 0.3, o.hold !== undefined ? o.hold : 1.5, o.back || 0.3);
          if (w > 0) { const tg = ptOf(o.at, t), d = [tg[0] - j.head[0], tg[1] - j.head[1]], n = Math.hypot(d[0], d[1]) || 1;
            look = { v: [MK.clamp((d[0] / n) * j.facing * 1.2, -1, 1), MK.clamp((d[1] / n) * 1.2, -1, 1)], w, nod: MK.clamp((Math.atan2(d[1], Math.abs(d[0])) / MK.deg) * 0.35, -18, 18) }; }
        }
      }
      return { out, look };
    }

    function compose(t) {
      if (!planned) plan();
      const q = body(t);
      return q;
    }
    function drawPose(t, extra = {}) {
      const q = { ...compose(t), ...extra };
      let j = p.draw(q, t);
      const { out, look } = aim(t, q, j);
      if (Object.keys(out).length || look) {
        const q2 = { ...q };
        for (const k of ["N", "F"]) {
          if (out["pose" + k]) q2["arm" + k] = out["pose" + k];
          if (out[k]) { const free = j["hand" + k]; q2["reach" + k] = MK.mix(free, out[k].tgt, out[k].w); if (out[k].w < 0.02) delete q2["reach" + k]; }
        }
        if (look) { q2.look = MK.mix(q2.look || [0, 0], look.v, look.w); q2.nod = (q2.nod || 0) + look.nod * look.w; }
        j = p.draw(q2, t);
      }
      return j;
    }
    const jcache = new Map();
    function jointsAt(T) {
      const key = T.toFixed(4);
      if (!jcache.has(key)) { const j = drawPose(T); jcache.set(key, JSON.parse(JSON.stringify(j))); }
      return jcache.get(key);
    }

    function placeObjs(t, j) {
      for (const r of objs.values()) {
        let tf = "";
        const an = r.getAnchor();
        if (r.body && t >= r.releaseAt) {
          const b = r.body.at(t);
          tf = `translate(${(b.x).toFixed(2)} ${(b.y).toFixed(2)}) rotate(${b.rot.toFixed(2)}) translate(${(-an[0]).toFixed(2)} ${(-an[1]).toFixed(2)})`;
        } else if (r.releaseAt !== null && t >= r.releaseAt) tf = `translate(${(r.rel[0] - an[0]).toFixed(2)} ${(r.rel[1] - an[1]).toFixed(2)})`;
        else if (r.holdFrom !== null && t >= r.holdFrom) {
          const a = acts.find((b) => b.kind === "pick" && b.o.obj === r.o), k = (a && a.o.hand) || "N", grip = (a && a.o.grip) || [0, P.hand * 1.2];
          const h = j["hand" + k];
          tf = `translate(${(h[0] + grip[0] - an[0]).toFixed(2)} ${(h[1] + grip[1] - an[1]).toFixed(2)})`;
        }
        if (tf) r.wrap.setAttribute("transform", tf); else r.wrap.removeAttribute("transform");
      }
    }

    const A = {
      p, events, acts,
      do(list) {
        // t0 "+0.2": 0,2 s depois que a ação anterior da lista termina (andar dura o que a distância pede)
        let cx = acts.length ? xAt(Infinity) : x, end = 0;
        for (const [t0r, kind, o = {}] of list) {
          const t0 = typeof t0r === "string" && t0r[0] === "+" ? end + parseFloat(t0r.slice(1) || "0") : timeOf(t0r);
          acts.push({ t0, kind, o });
          if (kind === "walk" || kind === "run") {
            const tv = typeof o.to === "function" ? o.to() : o.to, to = Array.isArray(tv) ? tv[0] : tv && (tv.nodeType || tv.g) ? ptOf(tv)[0] : tv;
            end = t0 + (o.dur || (Math.abs(to - cx) / (o.speed || (kind === "run" ? runSpeed : speed))) * 1.25);
            const me = acts[acts.length - 1]; me.__x0 = cx; me.__end = end; cx = to;
          } else if (kind === "jump") { end = t0 + (2 * Math.sqrt(2 * G * (o.h || 120))) / G + 0.15; if (o.to !== undefined) cx = timeOf(o.to); }
          else if (kind === "pick") end = t0 + (o.dur || 0.45) + 0.3;
          else if (kind === "throw" || kind === "drop") end = t0 + 0.45;
          else if (["reach", "point", "look", "pose"].includes(kind)) end = t0 + (o.dur || 0.35) + (o.hold !== undefined ? o.hold : 1) + (o.back || 0.35);
          else if (kind === "sit") end = o.until !== undefined ? relT(o.until, t0) + 0.5 : t0 + 0.5;
          else if (kind === "trip" || kind === "slip") { end = o.until !== undefined ? relT(o.until, t0) + 0.8 : t0 + (o.dur || 0.42) + 0.5;
            const w = acts.slice().reverse().find((b) => (b.kind === "walk" || b.kind === "run") && b !== acts[acts.length - 1]);   // caiu no meio do caminho: para onde caiu
            if (w && w.__end > t0) { const u = (t0 - w.t0) / (w.__end - w.t0); cx = w.__x0 + (cx - w.__x0) * ease(MK.clamp(u)); } }
          else if (kind === "say") end = o.to !== undefined ? relT(o.to, t0) : t0 + (o.dur || 2);
          else end = t0;
        }
        acts.sort((u, v) => u.t0 - v.t0);
        for (const a of acts) if (["pick", "drop", "throw"].includes(a.kind)) objOf(a.o.obj);
        plan();
        return A;
      },
      draw(t, extra = {}) { const j = drawPose(t, extra); placeObjs(t, j); return j; },
      xAt, facingAt, jointsAt,
      /** Começo da n-ésima ação de um tipo (0 = a primeira): ana.when("slip"). */
      when: (kind, n = 0) => (acts.filter((a) => a.kind === kind)[n] || {}).t0,
      /** Onde o objeto está em t (o ponto de pega), sem depender do quadro anterior: parado, na mão, solto ou voando.
          Serve de alvo para look, point e câmera: [t, "look", { at: (t) => ana.objAt(bola, t) }]. */
      objAt(o, t) {
        if (!planned) plan();
        const r = objOf(o), an = r.getAnchor();
        if (r.body && t >= r.releaseAt) { const b = r.body.at(t); return [b.x, b.y]; }
        if (r.releaseAt !== null && t >= r.releaseAt) return r.rel;
        if (r.holdFrom !== null && t >= r.holdFrom) { const h = p.j ? p.j.handN : an; return [h[0], h[1] + P.hand * 1.2]; }   // na mão: a da pose atual
        return [an[0], an[1]];
      },
    };
    return A;
  };
})();
