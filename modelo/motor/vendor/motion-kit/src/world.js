/* world.js — Entidades com ciclo de vida e corpos com física determinística. */
(function () {
  const MK = window.MK;
  const timeOf = (S, v) => (typeof v === "string" ? S.cue(v) : typeof v === "function" ? v() : v);

  MK.world = function (S, st) {
    const all = [], byPath = {};
    const sh = () => MK.__shots;

    function make(name, spec, parent) {
      const path = parent ? `${parent.path}/${name}` : name;
      if (byPath[path]) throw new Error(`MK.world: já existe a entidade "${path}"`);
      const par = parent ? parent.g : st.L[spec.layer || "main"];
      if (!par) throw new Error(`MK.world: não há a camada "${spec.layer}" (entidade "${path}")`);
      const outer = MK.g(par, { "data-mk-entity": path, "data-mk-name": path });
      const g = MK.g(outer, {});                      // outer: vida e opacidade · g: transformação (place, corpo)
      outer.style.display = "none";
      const life = spec.life || {};
      const e = {
        name, path, parent, spec, g, outer, obj: null, kids: [], body: spec.body || null,
        u: 0, age: 0, vis: 0, A: null, B: null, err: false,
        add: (n, sp) => { const k = make(n, sp, e); e.kids.push(k); return k; },
        alive: (t) => vis(t) > 0,
        pos: (what = null) => {
          const tgt = what === null ? g : typeof what === "string" ? (byPath[`${path}/${what}`] || {}).g : what;
          if (!tgt) throw new Error(`MK.world: "${path}" não tem a filha "${what}"`);
          return MK.worldPos(tgt);
        },
        place: ({ x = 0, y = 0, r = 0, s = 1 } = {}) => MK.attr(g, { transform: MK.tf(x, y, r, s) }),
      };
      // vida: resolvida no primeiro quadro (os planos e as deixas já existem)
      function times() {
        if (e.A !== null) return;
        e.A = life.from !== undefined ? timeOf(S, life.from) : -Infinity;
        if (life.to === "shot" || life.to === "plano") {
          if (!sh()) throw new Error(`MK.world: "${path}" usa to: "shot" sem MK.shots na cena`);
          e.B = sh().shotAt(Math.max(0, e.A) + 1e-3).t1;
        } else e.B = life.to !== undefined ? timeOf(S, life.to) : Infinity;
        if ((life.shot || life.set) && !sh()) throw new Error(`MK.world: "${path}" usa shot/set sem MK.shots na cena`);
      }
      const shots = life.shot ? [].concat(life.shot) : null;
      const fi = spec.fade !== undefined ? spec.fade : 0.3, fo = spec.out !== undefined ? spec.out : fi;
      function vis(t) {
        times();
        if (shots && !shots.includes(sh().at(t))) return 0;
        if (life.set && sh().setAt(t) !== life.set) return 0;
        const a = e.A === -Infinity ? 1 : fi > 0 ? MK.ramp(t, e.A, fi) : t >= e.A ? 1 : 0;
        const b = e.B === Infinity ? 1 : fo > 0 ? 1 - MK.ramp(t, e.B - fo, fo) : t < e.B ? 1 : 0;
        return Math.min(a, b);
      }
      e.visAt = vis;
      if (spec.build) e.obj = spec.build(g, e);
      all.push(e); byPath[path] = e;
      return e;
    }

    function tick(t) {
      for (const e of all) {                          // em ordem de criação: a mãe antes das filhas
        const v = e.visAt(t);
        if (e.parent && e.parent.vis <= 0) { e.vis = 0; continue; }   // filha de mãe morta: o grupo da mãe já está escondido
        e.vis = v;
        if (v <= 0) { if (e.outer.style.display !== "none") e.outer.style.display = "none"; continue; }
        if (e.outer.style.display === "none") e.outer.style.display = "";
        if (v >= 0.9999) e.outer.removeAttribute("opacity"); else e.outer.setAttribute("opacity", v.toFixed(4));
        e.age = e.A === -Infinity ? t : t - e.A;
        e.u = isFinite(e.A) && isFinite(e.B) ? MK.clamp((t - e.A) / (e.B - e.A)) : 0;
        if (e.body) { const b = e.body.at(t); MK.attr(e.g, { transform: `translate(${b.x.toFixed(2)} ${b.y.toFixed(2)}) rotate(${b.rot.toFixed(2)})` }); }
        if (e.spec.update && !e.err) {
          try { e.spec.update(t, e); }
          catch (err) { e.err = true; console.error(`entidade "${e.path}" quebrou em t=${t.toFixed(2)}: ${err.message}`); }
        }
      }
    }

    /** Diagnóstico: entidades que nunca aparecem e as que nascem no meio e vivem até o fim sem fim declarado. */
    function report(dur, step = 0.25) {
      const out = [];
      for (const e of all) {
        let seen = false;
        for (let t = 0; t <= dur + 1e-6 && !seen; t += step) seen = e.visAt(t) > 0 && (!e.parent || e.parent.visAt(t) > 0);
        if (!seen) out.push(`"${e.path}" nunca aparece no vídeo (vida: ${JSON.stringify(e.spec.life || {})})`);
        else if (!e.parent && e.A > 0.5 && e.B === Infinity && !(e.spec.life || {}).shot && !(e.spec.life || {}).set && !e.spec.keep)
          out.push(`"${e.path}" nasce em ${e.A.toFixed(2)} s e vive até o fim: falta "to" (ou keep: true, se é de propósito)`);
      }
      return out;
    }

    const W = { add: (n, sp) => make(n, sp, null), get: (p) => byPath[p], all, tick, report };
    MK.pre.push(tick);
    MK.__world = W;
    return W;
  };

  // ── física ────────────────────────────────────────────────────────────────────────────────────────────────
  MK.body = function ({ at = [0, 0], vel = [0, 0], t0 = 0, r = 0, floor = null, walls = null, bounce = 0.45, friction = 0.8,
                        drag = 0, spin = 0, pxPerM = 350, g = null, dur = 60 } = {}) {
    const G = g !== null ? g : 9.8 * pxPerM, dt = 1 / 240;
    const X = [at[0]], Y = [at[1]], VX = [vel[0]], VY = [vel[1]], R = [0], GR = [0], REST = [false];
    const impacts = [];
    let rest = false;
    function stepTo(n) {                              // integra até o passo n (guarda tudo: busca em qualquer ordem)
      for (let i = X.length; i <= n; i++) {
        let x = X[i - 1], y = Y[i - 1], vx = VX[i - 1], vy = VY[i - 1], rot = R[i - 1], ground = 0;
        if (!rest) {
          vy += G * dt;
          vx *= 1 - drag * dt; vy *= 1 - drag * dt;
          x += vx * dt; y += vy * dt;
          if (floor !== null && y + r >= floor) {
            y = floor - r;
            if (vy > 0) {
              if (vy > 60) impacts.push({ t: t0 + i * dt, speed: vy });
              vy = vy * bounce > 80 ? -vy * bounce : 0;
              vx *= friction;
            }
            ground = vy === 0 ? 1 : 0;
            if (ground) vx *= Math.pow(friction, dt * 6);     // atrito de rolar
          }
          if (walls) {
            if (x - r < walls[0] && vx < 0) { x = walls[0] + r; if (-vx > 60) impacts.push({ t: t0 + i * dt, speed: -vx }); vx = -vx * bounce; }
            if (x + r > walls[1] && vx > 0) { x = walls[1] - r; if (vx > 60) impacts.push({ t: t0 + i * dt, speed: vx }); vx = -vx * bounce; }
          }
          rot += ground && r > 0 ? (vx / r) * (180 / Math.PI) * dt : spin * dt;
          if (ground && Math.abs(vx) < 4) { vx = 0; rest = true; }
        } else ground = 1;
        X.push(x); Y.push(y); VX.push(vx); VY.push(vy); R.push(rot); GR.push(ground); REST.push(rest);
      }
    }
    stepTo(Math.ceil(Math.min(dur, MK.__S ? MK.__S.dur : dur) / dt));   // pré-calcula: os impactos ficam prontos para o som
    function sample(t) {
      if (t <= t0) return { x: at[0], y: at[1], vx: 0, vy: 0, rot: 0, ground: false, rest: true };
      const f = (t - t0) / dt, i = Math.floor(f), k = f - i;
      stepTo(i + 1);
      const L = (A) => A[i] + (A[i + 1] - A[i]) * k;
      return { x: L(X), y: L(Y), vx: L(VX), vy: L(VY), rot: L(R), ground: !!GR[i + 1], rest: REST[i + 1] };
    }
    return { at: sample, impacts, t0 };
  };
})();
