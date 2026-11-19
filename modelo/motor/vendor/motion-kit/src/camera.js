/* camera.js — Palco SVG em camadas, paralaxe, câmera e transições opcionais. */
(function () {
  const MK = window.MK;

  MK.PARALLAX = { sky: 0, far: 0.2, mid: 0.5, main: 1, front: 1.4 };

  /** Cria as camadas dentro do <svg> do mundo. Mais camadas: st.layer("nome", paralaxe, antesDe). */
  MK.stage = function (S, svg, { layers = MK.PARALLAX } = {}) {
    MK.attr(svg, { viewBox: `0 0 ${S.W} ${S.H}`, width: S.W, height: S.H });
    svg.style.width = S.W + "px"; svg.style.height = S.H + "px";
    const defs = MK.defs(svg);
    const stage = MK.g(svg, { id: "mk-stage" });
    const L = {}, P = {};
    function layer(name, p = 1, before = null) {
      const g = MK.el("g", { id: "L-" + name });
      if (before && L[before]) stage.insertBefore(g, L[before]); else stage.appendChild(g);
      L[name] = g; P[name] = p;
      return g;
    }
    for (const k in layers) layer(k, layers[k]);
    // hud: preso à tela, fora do palco (sem câmera, sem chicote): insertos, etiquetas de tela, contadores
    L.hud = MK.g(svg, { id: "L-hud" }); P.hud = null;
    return { S, svg, defs, stage, L, P, layer };
  };

  MK.camera = function (S, st, { home = null, moves = [], whips = [], shake = [], breath = 0,
                                 safe = null } = {}) {
    const W = S.W, H = S.H;
    const H0 = Object.assign({ x: W / 2, y: H / 2, z: 1, r: 0 }, home || {});
    const ON = safe || [W / 2, H / 2];
    const BR = breath;
    const mv = moves.slice().sort((a, b) => a[0] - b[0]);
    const wh = whips.slice();
    const hblur = MK.filter(st.svg, "hblur", { std: 0 });
    const vblur = MK.filter(st.svg, "blur", { std: 0 });       // chicote vertical: borrão só em y (stdDeviation "0 s")
    vblur.set = (v) => MK.attr(vblur.el.firstChild, { stdDeviation: `0 ${Math.max(0, v)}` });

    function resolve(tg, v) {
      if (tg.look) tg = MK.lookAt(tg, v, { W, H, ON, H0 });   // MK.look(el, {z, fill, on}): mira um elemento (shots.js)
      const o = {};
      const z = tg.z !== undefined ? tg.z : v.z;
      if (tg.at) {
        const on = tg.on || ON;
        o.x = tg.at[0] - (on[0] - W / 2) / z;
        o.y = tg.at[1] - (on[1] - H / 2) / z;
      }
      for (const k of ["x", "y", "z", "r"]) if (tg[k] !== undefined) o[k] = tg[k];
      // alvos relativos ao estado em que a câmera está: {dz: 1.1} aproxima 10 %, {dx, dy} deslocam (MK.anim.punch / nudge)
      if (tg.dz !== undefined) o.z = (o.z !== undefined ? o.z : v.z) * tg.dz;
      if (tg.dx !== undefined) o.x = (o.x !== undefined ? o.x : v.x) + tg.dx / (o.z !== undefined ? o.z : v.z);
      if (tg.dy !== undefined) o.y = (o.y !== undefined ? o.y : v.y) + tg.dy / (o.z !== undefined ? o.z : v.z);
      return o;
    }
    function base(t) {
      let v = { ...H0 };
      for (const [t0, tg, dur = 1, e = "inOut"] of mv) {
        if (t < t0) break;
        const target = resolve(tg, v);
        const u = dur <= 0 ? 1 : MK.E(e)((t - t0) / dur);
        for (const k in target) {
          if (k === "z") v.z = v.z * Math.pow(target.z / v.z, u);
          else v[k] = v[k] + (target[k] - v[k]) * u;
        }
      }
      return v;
    }
    function whipAt(t) {
      let ox = 0, oy = 0, blur = 0, vert = false;
      for (const [tc, d = 0.5, dir = 1, vertical = false] of wh) {
        const h = d / 2, A = (vertical ? H : W) * 0.55;
        let o = 0;
        if (t >= tc - h && t < tc) o = dir * A * MK.ease.expoIn((t - (tc - h)) / h);
        else if (t >= tc && t < tc + h) o = -dir * A * (1 - MK.ease.expoOut((t - tc) / h));
        else continue;
        blur = Math.max(blur, 46 * Math.pow(Math.abs(o) / A, 0.6));
        if (vertical) { oy -= o; vert = true; } else ox -= o;
      }
      return { ox, oy, blur, vert };
    }
    function shakeAt(t) {
      let sx = 0, sy = 0;
      for (const [t0, d = 0.5, amp = 12, f = 18] of shake) {
        if (t < t0 || t > t0 + d) continue;
        const k = amp * Math.pow(1 - (t - t0) / d, 2);
        sx += k * MK.noise(t * f, 11); sy += k * MK.noise(t * f, 23);
      }
      return [sx, sy];
    }
    /** Estado completo em t: {x, y, z, r, ox, oy, blur} (ox/oy: deslocamento de tela do chicote e do tremor). */
    function state(t) {
      const v = base(t);

      const br = typeof BR === "function" ? BR(t) : BR;
      if (br) {

        v.z *= 1 + 0.008 * br * MK.osc(S, t, S.dur / 7.5);
        v.x += (6 * br * MK.osc(S, t, S.dur / 11)) / v.z;
        v.y += (5 * br * MK.osc(S, t, S.dur / 9)) / v.z;
      }
      const w = whipAt(t), [sx, sy] = shakeAt(t);
      return { ...v, ox: w.ox + sx, oy: w.oy + sy, blur: w.blur, vert: w.vert };
    }
    function layerTf(s, p) {
      const X = H0.x + (s.x - H0.x) * p, Y = H0.y + (s.y - H0.y) * p, Z = Math.pow(s.z, p);
      const k = Math.max(p, 0.3);
      return `translate(${(W / 2 + s.ox * k).toFixed(2)} ${(H / 2 + s.oy * k).toFixed(2)})` +
             (s.r ? ` rotate(${(s.r * Math.min(1, p)).toFixed(3)})` : "") +
             ` scale(${Z.toFixed(5)}) translate(${(-X).toFixed(2)} ${(-Y).toFixed(2)})`;
    }
    let blurOn = false;
    function apply(t) {
      const s = state(t);
      for (const k in st.L) if (st.P[k] !== null) MK.attr(st.L[k], { transform: layerTf(s, st.P[k]) });
      if (s.blur > 0.3) {
        const f = s.vert ? vblur : hblur;
        f.set(s.blur);
        if (blurOn !== f.url) { st.stage.setAttribute("filter", f.url); blurOn = f.url; }
      } else if (blurOn) { st.stage.removeAttribute("filter"); blurOn = false; }
      return s;
    }
    /** Ponto do mundo (na camada de paralaxe p) → tela, no instante t. */
    function toScreen(t, wx, wy, p = 1) {
      const s = state(t), Z = Math.pow(s.z, p), k = Math.max(p, 0.3);
      const X = H0.x + (s.x - H0.x) * p, Y = H0.y + (s.y - H0.y) * p;
      let dx = (wx - X) * Z, dy = (wy - Y) * Z;
      if (s.r) { const a = s.r * Math.min(1, p) * MK.deg, c = Math.cos(a), si = Math.sin(a); [dx, dy] = [dx * c - dy * si, dx * si + dy * c]; }
      return [W / 2 + s.ox * k + dx, H / 2 + s.oy * k + dy];
    }
    /** Acrescenta um movimento depois de criada a câmera: cam.to(t, {x, y, z} | {at, z} | MK.look(el), dur, ease). */
    function to(t0, target, dur = 1, ease = "inOut") { mv.push([t0, target, dur, ease]); mv.sort((a, b) => a[0] - b[0]); return cam; }
    /** Cortes (movimentos com dur 0), para os diagnósticos de movimento. */
    const cuts = () => mv.filter((m) => !(m[2] > 0) && m[0] > 0.05).map((m) => m[0]);
    const cam = { state, apply, toScreen, to, cuts, home: H0, whips: wh, moves: mv, ON };
    (MK.__cams = MK.__cams || []).push(cam);
    return cam;
  };

  /** Transições de tela sobre tudo (menos a interface): [{t, kind, dur, x, y, color}] com kind:
      "dip" (mergulho no preto, esconde um corte em t), "flash" (clarão branco em t), "iris" (círculo fecha até t e
      reabre de (x, y)), "blur" (desfoque que esconde uma troca em t). Devolve {draw(t)}. */
  MK.transitions = function (S, root, st, list) {
    const ov = MK.layer(root, "mk-trans", 20);
    const blur = MK.filter(st.svg, "blur", { std: 0 });
    let blurOn = false;
    function draw(t) {
      let dark = 0, white = 0, iris = null, bl = 0, col = "#000";
      for (const tr of list) {
        const d = tr.dur || (tr.kind === "flash" ? 0.45 : 0.5), tc = tr.t;
        if (t < tc - d || t > tc + d) continue;
        if (tr.kind === "dip") { dark = Math.max(dark, t < tc ? MK.ease.in((t - (tc - d / 2)) / (d / 2)) : 1 - MK.ease.out((t - tc) / (d / 2))); col = tr.color || "#000"; }
        if (tr.kind === "flash") white = Math.max(white, t < tc ? MK.ramp(t, tc - 0.06, 0.06, "linear") : 1 - MK.ramp(t, tc, d - 0.06, "out"));
        if (tr.kind === "blur") bl = Math.max(bl, 26 * MK.pulse(t, tc, d));
        if (tr.kind === "iris") {
          const R = Math.hypot(S.W, S.H);
          const u = t < tc ? 1 - MK.ease.in((t - (tc - d / 2)) / (d / 2)) : MK.ease.out((t - tc) / (d / 2));
          iris = [u * R, tr.x !== undefined ? tr.x : S.W / 2, tr.y !== undefined ? tr.y : S.H / 2];
        }
      }
      ov.style.background = white > 0 ? `rgba(255,255,255,${white})` : MK.rgba(col, dark);
      st.svg.style.clipPath = iris ? `circle(${iris[0].toFixed(1)}px at ${iris[1]}px ${iris[2]}px)` : "";
      if (bl > 0.3) { blur.set(bl); if (!blurOn) { st.svg.style.filter = blur.url; blurOn = true; } }
      else if (blurOn) { st.svg.style.filter = ""; blurOn = false; }
    }
    return { draw };
  };

  /** Qual cena (set) está no ar: shots = [[t0, "cozinha"], [t1, "micro"], ...] → nome em t. */
  MK.shotAt = function (t, shots) {
    let cur = shots[0][1];
    for (const [t0, name] of shots) if (t >= t0) cur = name;
    return cur;
  };
  /** Mostra só o grupo do set atual: sets = {nome: <g>}. */
  MK.showSet = function (sets, name) {
    for (const k in sets) {
      const on = k === name;
      if (sets[k].__on !== on) { sets[k].style.display = on ? "" : "none"; sets[k].__on = on; }
    }
  };
})();
