/* layout.js — Papéis visuais, organização e diagnóstico de sobreposições. */
(function () {
  const MK = window.MK;

  // ── papéis ─────────────────────────────────────────────────────────────────────────────────────────────────
  const PROTECTED = new Set(["face", "text", "focus", "label"]);
  const ROLE_PT = { face: "rosto", text: "texto", focus: "foco", label: "rótulo", prop: "objeto", card: "cartão",
                    limb: "braço", body: "corpo", emote: "emote", fx: "efeito" };

  /** Marca um elemento (ou objeto {g}) com um papel. opts: {name, who, allow: [papéis ou nomes], inside: el}. */
  MK.tag = function (e, role, o = {}) {
    const node = e && !(e instanceof Element) && e.g ? e.g : e;
    if (!node) return e;
    node.setAttribute("data-mk-role", role);
    if (o.name) node.setAttribute("data-mk-name", o.name);
    if (o.who) node.setAttribute("data-mk-who", o.who);
    if ("allow" in o) node.setAttribute("data-mk-allow", o.allow ? [].concat(o.allow).join(",") : "");
    if (o.inside) node.__mkInside = o.inside && !(o.inside instanceof Element) && o.inside.g ? o.inside.g : o.inside;
    return e;
  };
  /** Tira o papel (a conferência passa a ignorar o elemento; um <text> volta a contar como texto). */
  MK.untag = function (e) {
    const node = e && !(e instanceof Element) && e.g ? e.g : e;
    if (node) { node.setAttribute("data-mk-role", "none"); node.__mkInside = null; }
    return e;
  };

  // ── conferência ────────────────────────────────────────────────────────────────────────────────────────────
  const GEOM = "path,circle,ellipse,rect,line,polyline,polygon,text";
  const MIN_SIDE = { face: 26, text: 14, label: 14, focus: 20 };    // menor que isso (px na tela) ninguém lê: ignora

  function visibility(n) {
    let op = 1;
    for (let e = n; e && e.nodeType === 1; e = e.parentNode) {
      if (e.tagName === "defs" || e.tagName === "clipPath" || e.tagName === "mask") return 0;
      const cs = getComputedStyle(e);
      if (cs.display === "none" || cs.visibility === "hidden") return 0;
      op *= parseFloat(cs.opacity);
      if (op < 0.02) return 0;
    }
    return op;
  }
  function rectOf(n) { const r = n.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom }; }
  const inter = (a, b) => ({ l: Math.max(a.l, b.l), t: Math.max(a.t, b.t), r: Math.min(a.r, b.r), b: Math.min(a.b, b.b) });
  const empty = (a) => a.r - a.l <= 0.5 || a.b - a.t <= 0.5;
  const area = (a) => Math.max(0, a.r - a.l) * Math.max(0, a.b - a.t);

  /** Recortes (clip-path="url(#id)") no caminho até a raiz: cada um vira um teste de ponto na tela. Escrita que
      aparece aos poucos costuma ser um retângulo de recorte que cresce; sem isto, o texto ainda escondido contaria. */
  function clipChain(n) {
    const out = [];
    for (let e = n; e && e.nodeType === 1 && e.tagName !== "svg"; e = e.parentNode) {
      const cp = e.getAttribute("clip-path") || (e.style && e.style.clipPath) || "";
      const m = /url\(\s*["']?#([^"')]+)/.exec(cp);
      if (!m) continue;
      const clip = document.getElementById(m[1]), ctm = e.getScreenCTM && e.getScreenCTM();
      if (!clip || !ctm) continue;
      const inv = ctm.inverse(), kids = Array.from(clip.children).filter((k) => typeof k.isPointInFill === "function").map((k) => {
        const tl = k.transform && k.transform.baseVal.consolidate();
        return { k, inv: tl ? tl.matrix.inverse() : null };
      });
      out.push((x, y) => {
        const q = new DOMPoint(x, y).matrixTransform(inv);
        return kids.some(({ k, inv: ki }) => { try { return k.isPointInFill(ki ? q.matrixTransform(ki) : q); } catch { return true; } });
      });
    }
    return out;
  }

  /** Peças desenháveis de um nó (ele mesmo ou os filhos), com o teste de ponto na tela. */
  function pieces(n) {
    const list = n.matches && n.matches(GEOM) ? [n] : Array.from(n.querySelectorAll(GEOM)).slice(0, 300);
    const out = [];
    for (const p of list) {
      if (p.closest("defs,clipPath,mask")) continue;
      const vis = visibility(p);
      if (vis < 0.15) continue;
      const clips = clipChain(p), clipped = (x, y) => clips.every((c) => c(x, y));
      if (p.tagName === "text") {                 // a caixa do texto vai da linha do ascendente ao descendente: aperta
        const r0 = rectOf(p), hh = r0.b - r0.t, r = { l: r0.l, r: r0.r, t: r0.t + 0.2 * hh, b: r0.b - 0.14 * hh };
        if (!empty(r)) out.push({ rect: r, hit: (x, y) => x >= r.l && x <= r.r && y >= r.t && y <= r.b && clipped(x, y) });
        continue;
      }
      const cs = getComputedStyle(p), fill = cs.fill !== "none" && parseFloat(cs.fillOpacity) > 0.25, stroke = cs.stroke !== "none" && parseFloat(cs.strokeWidth) > 0 && parseFloat(cs.strokeOpacity) > 0.25;
      if (!fill && !stroke) continue;
      const ctm = p.getScreenCTM();
      if (!ctm) continue;
      const inv = ctm.inverse(), r = rectOf(p);
      if (stroke) { const w = parseFloat(cs.strokeWidth) * Math.hypot(ctm.a, ctm.b) / 2; r.l -= w; r.t -= w; r.r += w; r.b += w; }
      if (empty(r)) continue;
      out.push({ rect: r, hit: (x, y) => {
        if (x < r.l || x > r.r || y < r.t || y > r.b) return false;
        const q = new DOMPoint(x, y).matrixTransform(inv);
        let h;
        try { h = (fill && p.isPointInFill(q)) || (stroke && p.isPointInStroke(q)); } catch { h = true; }
        return h && clipped(x, y);
      } });
    }
    return out;
  }
  function nameOf(n) {
    const nm = n.getAttribute("data-mk-name"), role = n.getAttribute("data-mk-role") || "text", who = n.getAttribute("data-mk-who");
    if (nm) return nm;
    const txt = (n.textContent || "").trim().replace(/\s+/g, " ");
    const base = ROLE_PT[role] || role;
    if (who) return `${base} (${who})`;
    return txt ? `${base} "${txt.length > 28 ? txt.slice(0, 27) + "…" : txt}"` : base;
  }
  function viewRect() {
    const root = MK.__S && MK.__S.root;
    return root ? rectOf(root) : { l: 0, t: 0, r: innerWidth, b: innerHeight };
  }
  function collect() {
    const nodes = new Set(document.querySelectorAll("[data-mk-role]"));
    for (const t of document.querySelectorAll("svg text")) if (!t.closest("[data-mk-role]")) nodes.add(t);
    const items = [];
    for (const n of nodes) {
      const role = n.getAttribute("data-mk-role") || "text";
      if (role === "none") continue;
      if (visibility(n) < 0.15) continue;
      const r = rectOf(n);
      if (empty(r)) continue;
      items.push({ n, role, who: n.getAttribute("data-mk-who") || null, allow: (n.getAttribute("data-mk-allow") || "").split(",").filter(Boolean), rect: r, _p: null });
    }
    return items;
  }
  const piecesOf = (it) => it._p || (it._p = pieces(it.n));
  const UNTAGGED = "svg path,svg circle,svg ellipse,svg rect,svg line,svg polyline,svg polygon";
  function untaggedName(par, els) {
    let id = null, layer = null;
    for (let e = par; e && e.tagName !== "svg" && e.nodeType === 1; e = e.parentNode) {
      const i = e.getAttribute("id");
      if (!i) continue;
      if (i.startsWith("L-")) { layer = i.slice(2); break; }
      if (!id && i !== "mk-stage") id = i;
    }
    // a peça mais "presente" (área × opacidade) dá a cor; o retângulo de todas dá a posição
    const big = els.reduce((a, e) => (area(rectOf(e)) * visibility(e) > area(rectOf(a)) * visibility(a) ? e : a), els[0]);
    const cs = getComputedStyle(big), col = cs.fill.startsWith("url") ? "degradê" : cs.fill !== "none" ? cs.fill : cs.stroke.startsWith("url") ? "degradê" : cs.stroke;
    const hex = (c) => { const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(c); return m ? "#" + m.slice(1, 4).map((v) => (+v).toString(16).padStart(2, "0")).join("").toUpperCase() : c; };
    const R = els.map(rectOf).reduce((a, r) => ({ l: Math.min(a.l, r.l), t: Math.min(a.t, r.t), r: Math.max(a.r, r.r), b: Math.max(a.b, r.b) }));
    const at = `x ${Math.round(R.l)}–${Math.round(R.r)}, y ${Math.round(R.t)}–${Math.round(R.b)} na tela`;
    return `forma sem papel${id ? ` #${id}` : ""} (${els.length} peça${els.length > 1 ? "s" : ""}, cor ${hex(col)}${layer ? `, camada ${layer}` : ""}, ${at})`;
  }

  /** Mede o quadro atual. Devolve [{kind: "cobre" | "fora" | "esconde" | "alcance", top, under, frac, key, msg}], do pior para o
      mais leve (key é estável entre quadros: a mesma dupla de coisas tem a mesma key).
      opts: {min: fração mínima para avisar (padrão 0,06), minUntagged: idem para forma sem papel (0,12), grid: pontos
      por lado na amostra (12), untagged: false ignora as formas sem papel}. */
  let nid = 0;
  const idOf = (n) => n.__mkId || (n.__mkId = ++nid);           // identidade estável entre quadros (para agrupar trechos)
  function check({ min = 0.06, minUntagged = 0.12, grid = 12, untagged = true, hidden = false } = {}) {
    const V = viewRect(), items = collect(), out = [], VA = area(V);
    // formas sem papel (braço desenhado à parte, objeto, cartão): só contam quando cobrem bastante e não são véus de
    // tela inteira (vinheta, luz, névoa geral)
    const free = untagged ? Array.from(document.querySelectorAll(UNTAGGED)).filter((e) => !e.closest("[data-mk-role],defs,clipPath,mask")) : [];
    const rc = new Map(), rectC = (e) => rc.get(e) || (rc.set(e, rectOf(e)), rc.get(e));
    // coberto por inteiro = escondido de propósito (tampar em vez de apagar): só com {hidden: true}
    const push = (topKey, underN, top, frac) => {
      const kind = frac >= 0.95 ? "esconde" : "cobre";
      if (kind === "esconde" && !hidden) return;
      const under = nameOf(underN);
      out.push({ kind, top, under, frac, key: `${kind}|${topKey}|${idOf(underN)}`,
                 msg: kind === "esconde" ? `${top} esconde ${under} por inteiro` : `${top} cobre ${Math.round(frac * 100)} % de ${under}` });
    };
    const prot = items.filter((it) => PROTECTED.has(it.role));
    for (const u of prot) {
      const box = inter(u.rect, V);
      if (empty(box)) continue;
      const side = Math.min(u.rect.r - u.rect.l, u.rect.b - u.rect.t);
      if (side < (MIN_SIDE[u.role] || 14)) continue;
      // pontos da amostra que caem na forma protegida
      const up = piecesOf(u), samples = [];
      for (let i = 0; i < grid; i++) for (let k = 0; k < grid; k++) {
        const x = box.l + ((i + 0.5) / grid) * (box.r - box.l), y = box.t + ((k + 0.5) / grid) * (box.b - box.t);
        if (up.some((p) => p.hit(x, y)) || (u.role === "label" && x >= u.rect.l && x <= u.rect.r && y >= u.rect.t && y <= u.rect.b)) samples.push([x, y]);
      }
      if (samples.length < 4) continue;
      // quem cobre, agrupado: peças com o mesmo papel e a mesma pessoa (braço + manga + mão) contam juntas
      const cg = new Map();
      for (const c of items) {
        if (c === u || c.n.contains(u.n) || u.n.contains(c.n)) continue;
        if (u.who && c.who && u.who === c.who) continue;                       // a própria mão no próprio rosto: de propósito
        if (c.n.tagName === "text" && u.n.tagName === "text" && c.n.textContent.trim() === u.n.textContent.trim()) continue;   // texto com sombra ou contorno (a mesma palavra duas vezes)
        if (!(u.n.compareDocumentPosition(c.n) & Node.DOCUMENT_POSITION_FOLLOWING)) continue;   // c está atrás de u
        if (c.allow.includes(u.role) || c.allow.includes(u.n.getAttribute("data-mk-name") || "\u0000")) continue;
        if (u.allow.includes("*") || u.allow.includes(c.role) || (c.who && u.allow.includes(c.who))) continue;
        if (empty(inter(c.rect, box))) continue;
        const k = c.who ? `${c.role}|${c.who}` : `n${idOf(c.n)}`;
        if (!cg.has(k)) cg.set(k, []);
        cg.get(k).push(c);
      }
      for (const [k, cs] of cg) {
        const cp = cs.flatMap(piecesOf);
        let hit = 0;
        for (const [x, y] of samples) if (cp.some((p) => p.hit(x, y))) hit++;
        const frac = hit / samples.length;
        if (frac >= min) push(k, u.n, nameOf(cs[0].n), frac);
      }
      if (u.allow.includes("*") || u.allow.includes("forma")) continue;
      const self = u.n.closest("[data-mk-person]");                 // barba, chapéu, figurino da própria pessoa: não conta
      const groups = new Map();
      for (const e of free) {
        const r = rectC(e);
        if (empty(inter(r, box)) || area(inter(r, V)) > 0.6 * VA) continue;
        if (u.n.contains(e) || (self && self.contains(e)) || !(u.n.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING)) continue;
        const key = e.parentNode;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(e);
      }
      for (const [par, els] of groups) {
        const ps = [], kept = [];
        for (const e of els) {
          if (visibility(e) < 0.3) continue;
          const bm = getComputedStyle(e).mixBlendMode;
          if (bm && bm !== "normal") continue;
          const pe = pieces(e);
          if (pe.length) { ps.push(...pe); kept.push(e); }
        }
        if (!ps.length) continue;
        let hit = 0;
        for (const [x, y] of samples) if (ps.some((p) => p.hit(x, y))) hit++;
        const frac = hit / samples.length;
        if (frac >= minUntagged) push(`n${idOf(par)}`, u.n, untaggedName(par, kept), frac);
      }
    }
    // texto que sai do próprio cartão
    for (const it of items) {
      const box = it.n.__mkInside;
      if (!box) continue;
      const a = area(it.rect), inside = area(inter(it.rect, rectOf(box)));
      const frac = a > 0 ? 1 - inside / a : 0;
      if (frac > 0.02) out.push({ kind: "fora", top: nameOf(it.n), under: nameOf(box), frac, key: `fora|${idOf(it.n)}|${idOf(box)}`, msg: `${nameOf(it.n)} sai ${Math.round(frac * 100)} % para fora de ${box.getAttribute("data-mk-name") || "o cartão"}` });
    }
    // mão que não alcança o que devia tocar (reachN/reachF além do comprimento do braço): flutua longe do objeto
    for (const p of MK.people || []) {
      if (!p.j || visibility(p.g) < 0.15) continue;
      for (const k of ["N", "F"]) {
        const d = p.j["reachShort" + k] || 0, lim = Math.max(6, 0.04 * p.opts.size * (p.j.scale || 1));   // folga: 4 % da altura
        if (d > lim) out.push({ kind: "alcance", top: `mão ${k === "N" ? "da frente" : "de trás"} (${p.who})`, under: "o alvo", frac: Math.min(1, d / 200), key: `alcance|${idOf(p.g)}|${k}`,
                                 msg: `mão ${k === "N" ? "da frente" : "de trás"} (${p.who}) não alcança o alvo: faltam ${Math.round(d)} px (aproxime a pessoa ou o alvo)` });
      }
      // anatomia (people.js, self.anatomy): defeitos de desenho que só aparecem com a pessoa grande (faixa no pescoço etc.)
      for (const a of p.anatomy ? p.anatomy() : []) out.push({ kind: a.kind, top: p.who, under: "", frac: Math.min(1, a.px / 20), key: `${a.kind}|${idOf(p.g)}`, msg: a.msg });
    }
    return out.sort((a, b) => b.frac - a.frac);
  }
  MK.overlap = { check, PROTECTED };

  // ── ajudas ─────────────────────────────────────────────────────────────────────────────────────────────────
  const overlap1 = (a, b, gap) => {
    const ox = (a.w + b.w) / 2 + gap - Math.abs(a.x - b.x), oy = (a.h + b.h) / 2 + gap - Math.abs(a.y - b.y);
    return ox > 0 && oy > 0 ? [ox, oy] : null;
  };
  /** Afasta caixas. itens = [{x, y, w, h, fixed?}] (centro = onde cada uma QUER ficar; a ordem é a prioridade: a de
      cima fica, a de baixo cede). opts: avoid = [caixas que não se movem], bounds = {x0, y0, x1, y1}, gap (folga),
      prefer: "up" (padrão: quem cede sobe, como rótulo; sai de lado só se subir custar 3× mais) | "any" (o eixo de
      menor invasão; pode pular de lado entre quadros). Devolve [{x, y}]. Determinístico: mesma entrada, mesma saída. */
  function place(items, { avoid = [], bounds = null, gap = 14, iter = 60, pull = 0.08, prefer = "up" } = {}) {
    const P = items.map((b) => ({ ...b, x0: b.x, y0: b.y }));
    // tira a de `a` de cima de `b`; devolve [dx, dy] para mover `a`
    const resolve = (a, b, o) => {
      if (prefer === "up") {
        const up = (b.y - (a.h + b.h) / 2 - gap) - a.y;                 // ≤ 0: quanto subir para ficar acima de b
        const side = o[0] * Math.sign(a.x - b.x || a.x0 - b.x0 || 1);
        return Math.abs(up) <= 3 * Math.abs(o[0]) ? [0, Math.min(0, up)] : [side, 0];
      }
      return o[0] < o[1] ? [o[0] * Math.sign(a.x - b.x || 1), 0] : [0, o[1] * Math.sign(a.y - b.y || -1)];
    };
    for (let k = 0; k < iter; k++) {
      for (const a of P) if (!a.fixed) { a.x += (a.x0 - a.x) * pull; a.y += (a.y0 - a.y) * pull; }
      for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) {
        const a = P[i], b = P[j], o = overlap1(a, b, gap);
        if (!o) continue;
        if (b.fixed && a.fixed) continue;
        const [mover, still] = b.fixed ? [a, b] : [b, a];               // quem vem depois na lista cede
        const [dx, dy] = resolve(mover, still, o);
        mover.x += dx; mover.y += dy;
      }
      for (let i = 0; i < P.length; i++) {
        const a = P[i];
        if (a.fixed) continue;
        for (const ob of avoid.concat(P.slice(0, i))) {             // os de cima na lista também são obstáculos
          const o = overlap1(a, ob, gap);
          if (!o) continue;
          const [dx, dy] = resolve(a, ob, o);
          a.x += dx; a.y += dy;
        }
        if (bounds) {
          a.x = MK.clamp(a.x, bounds.x0 + a.w / 2, bounds.x1 - a.w / 2);
          a.y = MK.clamp(a.y, bounds.y0 + a.h / 2, bounds.y1 - a.h / 2);
          // sem espaço para subir (bateu no limite): sai de lado
          for (const ob of avoid.concat(P.slice(0, i))) {
            const o = overlap1(a, ob, gap);
            if (o) a.x = MK.clamp(a.x + o[0] * Math.sign(a.x - ob.x || a.x0 - ob.x || 1), bounds.x0 + a.w / 2, bounds.x1 - a.w / 2);
          }
        }
      }
    }
    return P.map((a) => ({ x: a.x, y: a.y }));
  }

  /** Rótulos MK.fx.label que não se encostam nem cobrem o que está em avoid.
      list = [{fx, at: [x, y] | (t) => [x, y], anchor?: [x, y] | (t) => [x, y]}]; opts: {avoid: caixas | (t) => caixas,
      bounds, gap}. O rótulo invisível no instante não ocupa espaço.
      Limite: a arrumação é refeita a cada quadro; quando algo grande atravessa o lugar de um rótulo, ele pode pular de
      posição. Confira o trecho nas fotos; se pular, mude o `at` dele ou tire o obstáculo do caminho. */
  function labels(list, opts = {}) {
    const val = (v, t) => (typeof v === "function" ? v(t) : v);
    return { draw(t, extra = {}) {
      const live = list.filter((L) => MK.window(t, L.fx.t0 ?? L.t0 ?? -1e9, L.fx.t1 ?? L.t1 ?? 1e9, 0.3, 0.2) > 0.001 || L.always);
      const boxes = live.map((L) => { const a = val(L.at, t); return { x: a[0], y: a[1], w: L.fx.w, h: L.fx.h }; });
      const pos = place(boxes, { ...opts, avoid: val(opts.avoid || [], t) });
      live.forEach((L, i) => L.fx.draw(t, { x: pos[i].x, y: pos[i].y, anchor: val(L.anchor, t) || undefined, ...extra }));
      for (const L of list) if (!live.includes(L)) L.fx.draw(t);
    } };
  }

  /** Encolhe um <text> até caber em w × h (nunca aumenta; volta ao tamanho original quando cabe). */
  function fit(textEl, { w = Infinity, h = Infinity, min = 12 } = {}) {
    if (!textEl.__mkFit) textEl.__mkFit = parseFloat(textEl.getAttribute("font-size")) || 48;
    const base = textEl.__mkFit;
    MK.attr(textEl, { fontSize: base });
    const bb = textEl.getBBox(), k = Math.min(1, w / Math.max(1, bb.width), h / Math.max(1, bb.height));
    const size = Math.max(min, base * k);
    MK.attr(textEl, { fontSize: size });
    return size;
  }

  /** Caixa da pessoa inteira (da cabeça ao chão, de mão a mão) a partir das juntas do draw. */
  const personBox = (j, pad = 0.15) => {
    const ps = [j.top, j.head, j.handN, j.handF, j.elbowN, j.elbowF, j.footN, j.footF, j.kneeN, j.kneeF, j.shN, j.shF];
    const xs = ps.map((p) => p[0]), ys = ps.map((p) => p[1]).concat([j.ground]);
    const x0 = Math.min(...xs) - j.headR * pad * 4, x1 = Math.max(...xs) + j.headR * pad * 4, y0 = Math.min(...ys) - j.headR * pad * 4, y1 = Math.max(...ys);
    return { x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0 };
  };
  /** Caixa do rosto a partir das juntas do draw (j.head, j.headR), com folga pad (fração do raio). */
  const faceBox = (j, pad = 0.25) => ({ x: j.head[0], y: j.head[1] - j.headR * 0.1, w: j.headR * (2.2 + 2 * pad), h: j.headR * (2.5 + 2 * pad) });

  /** Caixa de um elemento no sistema de coordenadas de `layer` (a camada do mundo onde você posiciona as coisas). */
  function boxOf(e, layer) {
    const node = e && !(e instanceof Element) && e.g ? e.g : e;
    const bb = node.getBBox(), m = layer.getCTM().inverse().multiply(node.getCTM());
    const cs = [[bb.x, bb.y], [bb.x + bb.width, bb.y], [bb.x, bb.y + bb.height], [bb.x + bb.width, bb.y + bb.height]]
      .map(([x, y]) => new DOMPoint(x, y).matrixTransform(m));
    const xs = cs.map((p) => p.x), ys = cs.map((p) => p.y), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    return { x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0 };
  }

  /** 1 quando o ponto do mundo (camada de paralaxe p) está no quadro, caindo a 0 a `margin` px para fora.
      Para esconder o que é preso a algo que saiu do quadro: emote.draw(t, {x, y, vis: MK.layout.onScreen(S, cam, t, j.head)}). */
  function onScreen(S, cam, t, pt, { p = 1, margin = 60, inset = 0 } = {}) {
    const [sx, sy] = cam.toScreen(t, pt[0], pt[1], p);
    const out = Math.max(inset - sx, sx - (S.W - inset), inset - sy, sy - (S.H - inset), 0);
    return 1 - MK.clamp(out / Math.max(1, margin));
  }

  MK.layout = { place, labels, fit, faceBox, personBox, boxOf, onScreen };

  // ── fileira de tokens ──────────────────────────────────────────────────────────────────────────────────────
  /** Uma fileira de pedaços de texto lado a lado, medidos (nada de x += w + gap à mão):
        const r = MK.row(card, ["x²", { text: "+ 10x", fill: "#7FD8CC" }, "= 39"], { x: 960, y: 500, size: 62, font: "mono", maxW: 800 });
      tokens: string ou { text, fill, size, weight, font, gap } (gap: espaço extra antes deste token).
      opts: x, y (centro vertical da 1ª linha), align "center" | "start" | "end", size, font "sans" | "mono" | "hand",
            weight, fill, gap (px entre tokens; padrão 0,3 × size), maxW, fit "shrink" (encolhe até minSize; se ainda não
            cabe, quebra nesse tamanho: a altura cresce o menos possível) | "wrap" (quebra sem encolher) | "none",
            minSize (padrão 0,6 × size), lead (entrelinha, × size); confira r.lines e r.box se a altura importa,
            inside (cartão: a conferência avisa se o texto sair dele), make(parent, text, {x, y, size, fill, font,
            weight}) → elemento (para desenhar o token de outro jeito, ex.: MK.bigNum; o x é o centro do token).
      Devolve { g, items: [{ el, text, x, y, w, h, line }], size, lines, box: {x, y, w, h}, mark(i | [i, j], opts) }:
      x de cada item é o centro do token (para setas, mãos, destaques); mark põe um retângulo atrás dos tokens i..j
      ({ fill, pad, rx, opacity }) e o devolve, para animar. */
  MK.row = function (parent, tokens, { x = 0, y = 0, align = "center", size = 56, font = "sans", weight = 800, fill = MK.C.INK,
                                        gap = null, maxW = Infinity, fit = "shrink", minSize = null, lead = 1.25, inside = null,
                                        make = null } = {}) {
    const T = tokens.map((t) => (typeof t === "string" ? { text: t } : t));
    const fam = (f) => (f === "mono" ? MK.MONO : f === "hand" ? MK.HAND : MK.FONT);
    const wt = (o) => { const f = o.font || font, w = o.weight || weight; return f === "hand" ? Math.min(w, 700) : w; };
    function measure(k) {                                 // k: escala do tamanho
      return T.map((o) => { const sz = (o.size || size) * k; return { w: MK.ink(o.text, `${wt(o)} ${sz}px ${fam(o.font || font)}`).w, sz }; });
    }
    const gapOf = (k, i) => (i === 0 ? 0 : (gap === null ? 0.3 * size : gap) * k + (T[i].gap || 0) * k);
    const total = (m, k) => m.reduce((a, q, i) => a + q.w + gapOf(k, i), 0);
    let k = 1, m = measure(1);
    if (fit === "shrink" && total(m, 1) > maxW) {     // encolhe até o mínimo; se ainda não cabe, quebra nesse tamanho
      k = Math.max((minSize || 0.6 * size) / size, maxW / total(m, 1));   // (a altura cresce o menos possível)
      m = measure(k);
    }
    // linhas: quebra gulosa entre tokens quando passa de maxW
    const lines = [[]];
    let cur = 0;
    m.forEach((q, i) => {
      const add = q.w + (lines[lines.length - 1].length ? gapOf(k, i) : 0);
      if (fit !== "none" && lines[lines.length - 1].length && cur + add > maxW) { lines.push([]); cur = 0; }
      cur += lines[lines.length - 1].length ? gapOf(k, i) + q.w : q.w;
      lines[lines.length - 1].push(i);
    });
    const g = MK.g(parent, {}), items = [];
    const lh = size * k * lead;
    let x0 = Infinity, x1 = -Infinity;
    lines.forEach((ln, li) => {
      const wLine = ln.reduce((a, i, j) => a + m[i].w + (j ? gapOf(k, i) : 0), 0);
      let cx = align === "start" ? x : align === "end" ? x - wLine : x - wLine / 2;
      const yy = y + li * lh;
      ln.forEach((i, j) => {
        if (j) cx += gapOf(k, i);
        const o = T[i], q = m[i], mid = cx + q.w / 2, f = o.fill || fill;
        const opts = { x: mid, y: yy, size: q.sz, fill: f, font: o.font || font, weight: wt(o) };
        let e = make ? make(g, o.text, opts) : MK.text(g, o.text, { x: mid, y: yy, size: q.sz, weight: wt(o), fill: f,
          mono: (o.font || font) === "mono", hand: (o.font || font) === "hand" });
        const node = e && !(e.nodeType) && e.g ? e.g : e;
        if (node && node.tagName === "text") node.style.whiteSpace = "pre";
        items.push({ el: e, text: o.text, x: mid, y: yy, w: q.w, h: q.sz, line: li, i });
        x0 = Math.min(x0, cx); x1 = Math.max(x1, cx + q.w);
        cx += q.w;
      });
    });
    items.sort((a, b) => a.i - b.i);
    // a fileira inteira é um texto para a conferência: um aviso por fileira, com o nome dela
    const label = T.map((o) => o.text).join(" ");
    MK.tag(g, "text", { name: `fileira "${label.length > 30 ? label.slice(0, 29) + "…" : label}"`, inside });
    const hTot = lh * (lines.length - 1) + size * k;
    const box = { x: (x0 + x1) / 2, y: y + (lh * (lines.length - 1)) / 2, w: x1 - x0, h: hTot };
    if (fit !== "none" && box.w > maxW + 1) console.warn(`MK.row: "${T.map((o) => o.text).join(" ")}" não cabe em ${maxW} px nem quebrando (token mais largo: ${Math.round(Math.max(...m.map((q) => q.w)))} px)`);
    function mark(ij, { fill: mf = "rgba(255,216,107,0.35)", pad = 0.15, rx = 0.18, opacity = 1 } = {}) {
      const [a, b] = Array.isArray(ij) ? ij : [ij, ij];
      const sel = items.filter((it) => it.i >= a && it.i <= b), p = pad * size * k;
      const lx = Math.min(...sel.map((it) => it.x - it.w / 2)) - p, rx_ = Math.max(...sel.map((it) => it.x + it.w / 2)) + p;
      const ty = Math.min(...sel.map((it) => it.y - it.h * 0.62)) - p * 0.6, by = Math.max(...sel.map((it) => it.y + it.h * 0.55)) + p * 0.6;
      const r = MK.el("rect", { x: lx, y: ty, width: rx_ - lx, height: by - ty, rx: rx * size * k, fill: mf, opacity }, null);
      g.insertBefore(r, g.firstChild);                    // atrás dos tokens
      return r;
    }
    return { g, items, size: size * k, lines: lines.length, box, mark };
  };

  // Unidade: elemento com papel, <text>, filho direto das camadas main/front/hud e dos grupos de plano. As peças de
  // dentro de uma pessoa não contam (só a pessoa), nem o que está dentro de [data-mk-ambient] (chuva, névoa, pássaros).
  function units(ids = ["L-main", "L-front", "L-hud"]) {
    const out = [];
    for (const id of ids) {
      const L = document.getElementById(id);
      if (!L) continue;
      const set = new Set([...L.children]);
      L.querySelectorAll("[data-mk-role]:not([data-mk-role=none]), text, [data-mk-from]").forEach((e) => set.add(e));
      L.querySelectorAll("[data-mk-shot]").forEach((g) => { for (const c of g.children) set.add(c); });
      for (const e of set) {
        if (e.closest("[data-mk-ambient]")) continue;
        if (e.parentElement && e.parentElement.closest("[data-mk-person]")) continue;
        if (e.hasAttribute("data-mk-shot") && e.parentElement === L) continue;   // o grupo do plano em si
        out.push({ e, L });
      }
    }
    return out;
  }
  // visível de verdade: alguma peça de desenho dentro dele tem opacidade e tamanho (grupo com tudo em escala 0 não conta).
  // all: devolve a caixa na tela da união das peças visíveis; senão, true no primeiro achado.
  function shown(e, all = false) {
    const leaves = e.matches(GEOM) ? [e] : e.querySelectorAll(GEOM);
    let u = null;
    for (const n of leaves) {
      if (visibility(n) < 0.05) continue;
      const r = rectOf(n);
      if (r.r - r.l < 1 && r.b - r.t < 1) continue;
      if (!all) return true;
      u = u ? { l: Math.min(u.l, r.l), t: Math.min(u.t, r.t), r: Math.max(u.r, r.r), b: Math.max(u.b, r.b) } : r;
    }
    return all ? u : false;
  }
  // soma das opacidades (em quartos) das peças visíveis: muda quando algo dentro do grupo acende ou apaga
  function leafSig(e) {
    const leaves = e.matches(GEOM) ? [e] : e.querySelectorAll(GEOM);
    let s = 0;
    for (const n of leaves) { const v = visibility(n); if (v >= 0.05) s += Math.round(v * 4); }
    return s;
  }
  /** Assinatura do que está na tela, sem a câmera (caixa na camada, arredondada a 30 px): {id: estado}. */
  function state() {
    const o = {};
    for (const { e, L } of units()) {
      const v = visibility(e);
      if (v < 0.05 || !shown(e)) continue;
      const ls = leafSig(e);
      let b;
      try { b = boxOf(e, L); } catch { continue; }
      if (!b.w && !b.h) continue;
      const r = (x) => Math.round(x / 30);
      o[idOf(e)] = `${r(b.x)},${r(b.y)},${r(b.w)},${r(b.h)},${Math.round(v * 4)},${ls}` + (e.tagName === "text" ? "|" + e.textContent : "");
    }
    // a câmera também conta: aproximar ou passear é coisa nova (a respiração, de poucos px, não muda o balde)
    (MK.__cams || []).forEach((c, i) => {
      if (MK.now === undefined) return;
      const s = c.state(MK.now);
      o["cam" + i] = `${Math.round(s.x / 50)},${Math.round(s.y / 50)},${Math.round(Math.log(s.z) / 0.03)}`;
    });
    return o;
  }
  /** HUD visível agora (para comparar dos dois lados de uma troca de plano): [{id, name, rect}]. */
  function hud() {
    const vis = units(["L-hud"]).filter(({ e }) => !e.closest("[data-mk-keep]") && visibility(e) >= 0.05 && (e.__mkR = shown(e, true)));
    const els = new Set(vis.map((u) => u.e));                  // só o de fora: o texto dentro do selo não repete o aviso
    return vis.filter(({ e }) => { for (let a = e.parentElement; a; a = a.parentElement) if (els.has(a)) return false; return true; })
      .map(({ e }) => {
        const r = e.__mkR, txt = (e.textContent || "").trim().replace(/\s+/g, " ");
        const name = e.getAttribute("data-mk-name") || e.getAttribute("data-mk-role") || e.tagName === "text" ? nameOf(e)
          : `forma do HUD${txt ? ` com "${txt.slice(0, 24)}"` : ""} (x ${Math.round(r.l)}–${Math.round(r.r)}, y ${Math.round(r.t)}–${Math.round(r.b)} na tela)`;
        return { id: idOf(e), name, rect: [r.l, r.t, r.r, r.b].map(Math.round) };
      })
      .filter((h) => h.rect[2] - h.rect[0] > 4 && h.rect[3] - h.rect[1] > 4);
  }
  /** Trocas de plano e cortes de câmera conhecidos pela lib. */
  function cuts() {
    const c = new Set();
    if (MK.__shots) MK.__shots.cuts.forEach((t) => c.add(+t.toFixed(3)));
    for (const cam of MK.__cams || []) if (cam.cuts) cam.cuts().forEach((t) => c.add(+t.toFixed(3)));
    return [...c].sort((a, b) => a - b);
  }
  /** Desenho visível sem dono (fora de entidade do MK.world e de grupo de plano): o "resquício". Só o de fora de cada pilha. */
  function orphans() {
    const vis = units().filter(({ e }) => !e.closest("[data-mk-entity],[data-mk-shot],[data-mk-keep]") && visibility(e) >= 0.05 && shown(e));
    const els = new Set(vis.map((u) => u.e));
    return vis.filter(({ e }) => { for (let a = e.parentElement; a; a = a.parentElement) if (els.has(a)) return false; return true; })
      .map(({ e, L }) => {
        const nm = e.getAttribute("data-mk-name") || e.getAttribute("data-mk-role") || e.tagName === "text" ? nameOf(e) : (() => {
          const r = shown(e, true), txt = (e.textContent || "").trim().replace(/\s+/g, " ");
          return `forma${txt ? ` com "${txt.slice(0, 24)}"` : ""} (camada ${L.id.slice(2)}, x ${Math.round(r.l)}–${Math.round(r.r)}, y ${Math.round(r.t)}–${Math.round(r.b)} na tela)`;
        })();
        return { id: idOf(e), name: nm };
      });
  }
  MK.scan = { units, state, hud, cuts, orphans, visibility, shown, idOf, nameOf, shotAt: (t) => (MK.__shots ? MK.__shots.at(t) : null) };
})();
