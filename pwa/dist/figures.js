/* Übungsbilder: Schaufensterpuppen-Figuren als SVG, berechnet über Gelenkwinkel und inverse Kinematik.
   Figur schaut nach rechts. Winkel: 0 = nach unten, 90 = nach vorn (rechts), 180 = nach oben, -90 = nach hinten. */
(function () {
  const L = { T: 48, N: 8, HR: 11, UA: 32, FA: 30, TH: 42, SH: 41, FT: 10 };
  const FLOOR = 186;
  const rad = a => a * Math.PI / 180;
  const dir = a => [Math.sin(rad(a)), Math.cos(rad(a))];
  const add = (p, v, s) => [p[0] + v[0] * s, p[1] + v[1] * s];
  const rot = (v, a) => { const c = Math.cos(rad(a)), s = Math.sin(rad(a)); return [v[0] * c - v[1] * s, v[0] * s + v[1] * c]; };
  function ik(root, target, l1, l2, s) {
    let dx = target[0] - root[0], dy = target[1] - root[1];
    let d = Math.hypot(dx, dy) || 0.001; const ux = dx / d, uy = dy / d;
    d = Math.max(Math.abs(l1 - l2) + 0.5, Math.min(l1 + l2 - 0.05, d));
    const cosA = Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)));
    const j = add(root, rot([ux, uy], s * Math.acos(cosA) * 180 / Math.PI), l1);
    return [j, add(root, [ux, uy], d)];
  }
  function limb(root, P, i, kind) {
    const isArm = kind === 'a';
    const l1 = isArm ? L.UA : L.TH, l2 = isArm ? L.FA : L.SH;
    const tg = isArm ? P.h : P.f, ang = isArm ? P.a : P.l, sg = isArm ? (P.es || [1, 1]) : (P.ks || [-1, -1]);
    if (ang && ang[i]) { const j = add(root, dir(ang[i][0]), l1); return [j, add(j, dir(ang[i][1]), l2)]; }
    if (tg && tg[i]) return ik(root, tg[i], l1, l2, sg[i]);
    const j = add(root, dir(isArm ? 0 : 0), l1); return [j, add(j, dir(0), l2)];
  }
  function joints(P) {
    const hip = P.hip, sh = add(hip, dir(P.t), L.T);
    const head = add(sh, dir(P.t + (P.hd || 0)), L.N + L.HR);
    const A = [limb(sh, P, 0, 'a'), limb(sh, P, 1, 'a')];
    const G = [limb(hip, P, 0, 'l'), limb(hip, P, 1, 'l')];
    const toes = G.map(([kn, an], i) => {
      const v = [an[0] - kn[0], an[1] - kn[1]]; const n = Math.hypot(v[0], v[1]) || 1; const u = [v[0] / n, v[1] / n];
      const pt = P.tp && P.tp[i]; return add(an, pt ? u : rot(u, -90), pt ? L.FT * 0.8 : L.FT);
    });
    return { hip, sh, head, el: [A[0][0], A[1][0]], ha: [A[0][1], A[1][1]], kn: [G[0][0], G[1][0]], an: [G[0][1], G[1][1]], to: toes };
  }
  function lerp(a, b, t) {
    if (Array.isArray(a)) return a.map((x, i) => lerp(x, b ? b[i] : x, t));
    if (typeof a === 'number') return typeof b === 'number' ? a + (b - a) * t : a;
    if (a && typeof a === 'object') { const o = {}; for (const k in a) o[k] = lerp(a[k], b ? b[k] : undefined, t); return o; }
    return a;
  }
  const ease = t => t * t * (3 - 2 * t);
  function frames(K, steps) {
    if (K.length === 1) return [joints(K[0])];
    const out = [];
    for (let i = 0; i < K.length; i++) { const A = K[i], B = K[(i + 1) % K.length]; for (let s = 0; s < steps; s++) out.push(joints(lerp(A, B, ease(s / steps)))); }
    out.push(out[0]);
    return out;
  }
  const f1 = n => Math.round(n * 10) / 10;
  const pth = pts => 'M' + pts.map(p => f1(p[0]) + ' ' + f1(p[1])).join(' L');

  /* ---------------- Posen-Bausteine ---------------- */
  const ST = (o) => Object.assign({ hip: [100, 99], t: 180, f: [[107, 182], [94, 182]], h: [[101, 112], [97, 112]] }, o || {});
  const BAR = -14;
  const hangK = (hipY, o) => Object.assign({ hip: [100, hipY], t: 180, h: [[108, BAR], [101, BAR]], f: [[103, hipY + 80], [97, hipY + 80]], ks: [-1, -1] }, o || {});
  // Liegestütz: Hände bei (hx, hy), Füße bei (fx, fy)
  function plank(hx, hy, fx, fy, low) {
    const sh = [hx + 2, hy - (low ? 24 : 57)];
    const dx = sh[0] - fx, dy = sh[1] - fy; const len = Math.hypot(dx, dy); const u = [dx / len, dy / len];
    const hip = [sh[0] - u[0] * L.T, sh[1] - u[1] * L.T];
    const t = Math.atan2(u[0], u[1]) * 180 / Math.PI;
    return { hip, t, h: [[hx, hy], [hx - 4, hy]], f: [[fx, fy], [fx + 4, fy - 1]], es: [1, 1], ks: [1, 1] };
  }
  // Körper in gerader Linie von Füßen (fx,fy) im Winkel a, Hände an Ziel
  function lineBody(fx, fy, a, hands, o) {
    const hip = add([fx, fy], dir(a), L.TH + L.SH - 1);
    return Object.assign({ hip, t: a, f: [[fx, fy], [fx - 3, fy]], h: hands, ks: [-1, -1], es: [1, 1] }, o || {});
  }
  const lieBench = (hands, o) => Object.assign({ hip: [72, 144], t: 90, f: [[36, 182], [46, 182]], ks: [1, 1], h: hands, es: [-1, -1] }, o || {});
  const kneel = (o) => Object.assign({ hip: [100, 138], t: 180, l: [[0, -90], [0, -90]] }, o || {});
  const seat = (o) => Object.assign({ hip: [92, 142], t: 180, f: [[136, 182], [128, 182]], ks: [-1, -1] }, o || {});

  /* ---------------- Vorlagen ---------------- */
  const T = {};
  // Hängen & Ziehen
  T.hang = { k: [hangK(95), hangK(92)], p: [{ k: 'bar', x: 104, y: BAR }] };
  T.scap = { k: [hangK(96), hangK(86)], p: [{ k: 'bar', x: 104, y: BAR }] };
  T.pullup = { k: [hangK(95), hangK(58, { f: [[106, 138], [99, 139]] })], p: [{ k: 'bar', x: 104, y: BAR }] };
  T.ringpull = { k: [hangK(95), hangK(58, { f: [[106, 138], [99, 139]] })], p: [{ k: 'rings', top: -22 }] };
  T.lsitpull = { k: [hangK(95, { f: [[182, 93], [180, 96]] }), hangK(60, { f: [[182, 58], [180, 61]] })], p: [{ k: 'bar', x: 104, y: BAR }] };
  T.knee = { k: [hangK(94), hangK(94, { f: [[128, 110], [124, 113]], ks: [-1, -1] })], p: [{ k: 'bar', x: 104, y: BAR }] };
  T.legraise = { k: [hangK(94), hangK(94, { f: [[181, 88], [179, 91]], tp: [1, 1] })], p: [{ k: 'bar', x: 104, y: BAR }] };
  T.t2b = { k: [hangK(94), hangK(92, { t: 172, f: [[128, 0], [124, 3]], tp: [1, 1] })], p: [{ k: 'bar', x: 104, y: BAR }] };
  const FLH = [[150, 20], [146, 20]];
  T.fl = { k: [{ hip: [102, 78], t: 90, h: FLH, f: [[20, 80], [22, 83]], es: [1, 1], tp: [1, 1] }], p: [{ k: 'bar', x: 150, y: 20 }], sc: 1 };
  T.fltuck = { k: [{ hip: [104, 80], t: 88, h: FLH, f: [[112, 64], [110, 66]], ks: [1, 1], es: [1, 1] }], p: [{ k: 'bar', x: 150, y: 20 }] };
  T.fladv = { k: [{ hip: [102, 80], t: 90, h: FLH, f: [[88, 110], [86, 112]], ks: [1, 1], es: [1, 1] }], p: [{ k: 'bar', x: 150, y: 20 }] };
  T.flrow = { k: [{ hip: [104, 80], t: 88, h: FLH, f: [[112, 64], [110, 66]], ks: [1, 1] }, { hip: [118, 52], t: 80, h: FLH, f: [[126, 36], [124, 38]], ks: [1, 1], es: [1, 1] }], p: [{ k: 'bar', x: 150, y: 20 }] };
  T.mu = { k: [hangK(95), hangK(58, { f: [[106, 138], [99, 139]] }), { hip: [98, 30], t: 172, h: [[108, BAR], [101, BAR]], f: [[106, 108], [99, 110]], es: [1, 1] }], p: [{ k: 'bar', x: 104, y: BAR }], sc: 0.72 };
  T.ringmu = Object.assign({}, T.mu, { p: [{ k: 'rings', top: -22 }] });
  T.falsegrip = { k: [hangK(95), hangK(93)], p: [{ k: 'rings', top: -22 }] };
  T.skincat = { k: [hangK(95, { h: [[108, BAR], [101, BAR]] }), hangK(95, { f: [[132, 80], [128, 82]] })], p: [{ k: 'rings', top: -22 }] };
  T.backlever = { k: [{ hip: [102, 60], t: 90, h: [[152, 110], [148, 110]], f: [[118, 42], [116, 44]], ks: [1, 1], es: [-1, -1] }], p: [{ k: 'rings', top: -22 }] };
  T.mutrans = { k: [{ hip: [70, 150], t: 150, h: [[140, 100], [136, 100]], f: [[56, 182], [60, 182]], ks: [1, 1] }, { hip: [112, 122], t: 170, h: [[140, 112], [136, 112]], f: [[80, 182], [84, 182]], ks: [1, 1], es: [1, 1] }], p: [{ k: 'rings', top: -22 }] };

  // Rudern
  T.ringrow = { k: [lineBody(40, 182, 116, [[142, 58], [138, 58]]), lineBody(40, 182, 136, [[142, 58], [138, 58]])], p: [{ k: 'rings', top: -22 }] };
  T.ringrowinc = { k: [lineBody(50, 182, 146, [[142, 34], [138, 34]]), lineBody(50, 182, 160, [[142, 34], [138, 34]])], p: [{ k: 'rings', top: -22 }] };
  T.ringrowelev = { k: [{ hip: [96, 132], t: 94, f: [[30, 128], [34, 128]], h: [[150, 64], [146, 64]], ks: [1, 1] }, { hip: [96, 106], t: 96, f: [[30, 128], [34, 128]], h: [[150, 64], [146, 64]], ks: [1, 1], es: [1, 1] }], p: [{ k: 'rings', top: -22 }, { k: 'box', x: 8, y: 132, w: 40 }] };
  T.ringcurl = { k: [lineBody(40, 182, 128, [[150, 44], [146, 44]]), lineBody(40, 182, 140, [[150, 44], [146, 44]], { a: [[150, 200], [150, 200]] })], p: [{ k: 'rings', top: -22, still: 0 }] };
  T.ringface = { k: [lineBody(40, 182, 130, [[152, 46], [148, 46]]), lineBody(40, 182, 146, [[130, 40], [126, 40]], { es: [-1, -1] })], p: [{ k: 'rings', top: -22 }] };
  T.tablerow = { k: [{ hip: [80, 166], t: 94, f: [[14, 180], [18, 180]], h: [[140, 106], [136, 106]], ks: [1, 1] }, { hip: [80, 142], t: 92, f: [[14, 180], [18, 180]], h: [[140, 106], [136, 106]], ks: [1, 1], es: [1, 1] }], p: [{ k: 'table', x1: 118, x2: 200, y: 104 }] };
  T.inverted = { k: [{ hip: [80, 166], t: 94, f: [[14, 180], [18, 180]], h: [[140, 106], [136, 106]], ks: [1, 1] }, { hip: [80, 142], t: 92, f: [[14, 180], [18, 180]], h: [[140, 106], [136, 106]], ks: [1, 1], es: [1, 1] }], p: [{ k: 'bar', x: 140, y: 106, rack: true }] };
  T.doorrow = { k: [lineBody(118, 182, 200, [[170, 76], [166, 78]]), lineBody(118, 182, 190, [[170, 76], [166, 78]], { es: [1, 1] })], p: [{ k: 'door', x: 176 }] };
  T.dbrow = { k: [{ hip: [80, 104], t: 100, f: [[96, 182], [74, 182]], h: [[128, 156], [150, 122]], es: [1, 1] }, { hip: [80, 104], t: 100, f: [[96, 182], [74, 182]], h: [[104, 116], [150, 122]], es: [1, 1] }], p: [{ k: 'bench', x1: 132, y1: 126, x2: 196, y2: 126 }, { k: 'db', h: [0] }] };
  T.bentrow = (eq) => ({ k: [{ hip: [84, 102], t: 112, f: [[104, 182], [96, 182]], h: [[126, 150], [122, 150]] }, { hip: [84, 102], t: 112, f: [[104, 182], [96, 182]], h: [[104, 116], [100, 116]], es: [1, 1] }], p: [eqProp(eq)] });
  T.chestrow = { k: [{ hip: [70, 128], t: 130, f: [[48, 182], [56, 182]], ks: [1, 1], h: [[128, 160], [124, 160]] }, { hip: [70, 128], t: 130, f: [[48, 182], [56, 182]], ks: [1, 1], h: [[100, 118], [96, 118]], es: [1, 1] }], p: [{ k: 'bench', x1: 60, y1: 140, x2: 124, y2: 92 }, { k: 'db', h: [0, 1] }] };
  T.seatedrow = { k: [{ hip: [70, 160], t: 160, f: [[152, 172], [150, 175]], ks: [1, 1], h: [[150, 120], [146, 120]] }, { hip: [70, 160], t: 186, f: [[152, 172], [150, 175]], ks: [1, 1], h: [[100, 136], [96, 136]], es: [1, 1] }], p: [{ k: 'cable', from: [200, 128] }, { k: 'box', x: 40, y: 164, w: 50 }] };
  T.machinerow = { k: [{ hip: [70, 150], t: 175, f: [[118, 182], [112, 182]], h: [[140, 102], [136, 102]] }, { hip: [70, 150], t: 180, f: [[118, 182], [112, 182]], h: [[92, 106], [88, 106]], es: [1, 1] }], p: [{ k: 'seat', x: 70, y: 152, pad: [110, 96] }] };
  T.highrow = { k: [kneel({ t: 176, h: [[160, 50], [156, 50]] }), kneel({ t: 184, h: [[120, 80], [116, 80]], es: [1, 1] })], p: [{ k: 'cable', from: [205, 10] }] };

  // Seilzug von oben / vertikales Ziehen
  T.kneelpd = { k: [kneel({ hip: [96, 138], t: 184, h: [[112, 16], [108, 16]] }), kneel({ hip: [96, 138], t: 188, h: [[116, 86], [112, 86]], es: [1, 1] })], p: [{ k: 'cable', from: [118, -22] }] };
  T.latpd = { k: [seat({ h: [[112, 20], [108, 20]], t: 186 }), seat({ h: [[116, 88], [112, 88]], t: 190, es: [1, 1] })], p: [{ k: 'cable', from: [118, -22] }, { k: 'seat', x: 92, y: 146 }] };
  T.straightpd = { k: [ST({ t: 166, h: [[158, 24], [154, 24]] }), ST({ t: 166, h: [[118, 110], [114, 110]] })], p: [{ k: 'cable', from: [182, -22] }] };
  T.facepull = { k: [ST({ t: 184, h: [[156, 44], [152, 44]] }), ST({ t: 186, h: [[124, 28], [120, 28]], es: [-1, -1] })], p: [{ k: 'cable', from: [205, 36] }] };
  T.pushdown = { k: [ST({ t: 170, h: [[124, 72], [120, 72]], es: [1, 1] }), ST({ t: 170, h: [[118, 116], [114, 116]] })], p: [{ k: 'cable', from: [126, -22] }] };
  T.ohext = { k: [ST({ t: 158, f: [[122, 182], [80, 182]], a: [[190, -30], [190, -30]] }), ST({ t: 158, f: [[122, 182], [80, 182]], a: [[160, 160], [160, 160]] })], p: [{ k: 'cable', from: [10, -22] }] };
  T.cablecurl = { k: [ST({ a: [[90, 90], [90, 90]] }), ST({ a: [[90, 205], [90, 205]] })], p: [{ k: 'cable', from: [205, 52] }] };
  T.bayes = { k: [ST({ t: 176, f: [[122, 182], [82, 182]], a: [[-30, -30], [-30, -30]] }), ST({ t: 176, f: [[122, 182], [82, 182]], a: [[-20, 170], [-20, 170]] })], p: [{ k: 'cable', from: [-10, 150] }] };
  T.woodchop = { k: [ST({ t: 184, h: [[70, 10], [66, 12]] }), ST({ t: 170, h: [[150, 120], [146, 120]] })], p: [{ k: 'cable', from: [30, -22] }] };
  T.cfly = { k: [ST({ t: 166, f: [[122, 182], [84, 182]], h: [[92, 30], [88, 30]] }), ST({ t: 166, f: [[122, 182], [84, 182]], h: [[156, 104], [152, 104]] })], p: [{ k: 'cable', from: [40, -22] }] };
  T.yraise = { k: [ST({ h: [[112, 116], [108, 116]] }), ST({ h: [[150, -4], [146, -4]] })], p: [{ k: 'cable', from: [40, 186] }] };
  T.creverse = { k: [ST({ h: [[160, 60], [156, 60]] }), ST({ h: [[100, 58], [96, 58]] })], p: [{ k: 'cable', from: [205, 30] }] };
  T.cablecrunch = { k: [kneel({ hip: [100, 138], t: 182, h: [[110, 50], [106, 50]], es: [1, 1] }), kneel({ hip: [100, 138], t: 108, h: [[140, 118], [136, 118]], es: [1, 1] })], p: [{ k: 'cable', from: [116, -22] }] };

  // Drücken
  T.pushup = { k: [plank(140, 182, 16, 181), plank(140, 182, 16, 181, true)], p: [] };
  T.inclinepu = { k: [plank(140, 134, 30, 182), plank(140, 134, 30, 182, true)], p: [{ k: 'box', x: 122, y: 134, w: 60 }] };
  T.declinepu = { k: [plank(150, 182, 22, 136), plank(150, 182, 22, 136, true)], p: [{ k: 'box', x: 0, y: 140, w: 40 }] };
  T.ringpu = { k: [plank(140, 172, 16, 181), plank(140, 172, 16, 181, true)], p: [{ k: 'rings', top: -22 }] };
  T.pseudo = { k: [plank(118, 182, 20, 181), Object.assign(plank(118, 182, 20, 181, true), { hip: [96, 162], t: 97 })], p: [] };
  T.pike = { k: [{ hip: [96, 92], t: 42, f: [[42, 182], [46, 182]], h: [[152, 182], [148, 182]], ks: [1, 1] }, { hip: [102, 96], t: 24, f: [[42, 182], [46, 182]], h: [[152, 182], [148, 182]], ks: [1, 1], es: [-1, -1] }], p: [] };
  T.pikeelev = { k: [{ hip: [106, 80], t: 14, f: [[40, 128], [44, 128]], h: [[128, 182], [124, 182]], ks: [1, 1] }, { hip: [110, 104], t: 8, f: [[40, 128], [44, 128]], h: [[128, 182], [124, 182]], ks: [1, 1], es: [-1, -1] }], p: [{ k: 'box', x: 14, y: 132, w: 44 }] };
  T.hspu = { k: [{ hip: [104, 74], t: 0, f: [[104, -8], [100, -6]], h: [[108, 182], [100, 182]], tp: [1, 1] }, { hip: [104, 100], t: 0, f: [[104, 18], [100, 20]], h: [[108, 182], [100, 182]], tp: [1, 1], es: [-1, -1] }], p: [{ k: 'wall', x: 88 }] };
  T.wallhs = { k: [{ hip: [104, 74], t: 2, f: [[102, -8], [98, -6]], h: [[108, 182], [100, 182]], tp: [1, 1] }, { hip: [104, 74], t: -2, f: [[106, -8], [102, -6]], h: [[108, 182], [100, 182]], tp: [1, 1] }], p: [{ k: 'wall', x: 90 }] };
  T.freehs = { k: [{ hip: [100, 74], t: 3, f: [[98, -8], [95, -6]], h: [[104, 182], [96, 182]], tp: [1, 1] }, { hip: [100, 74], t: -3, f: [[104, -8], [101, -6]], h: [[104, 182], [96, 182]], tp: [1, 1] }], p: [] };
  T.planchelean = { k: [plank(128, 182, 20, 181), Object.assign(plank(128, 182, 20, 181), { hip: [110, 140], t: 102 })], p: [] };
  T.tuckplanche = { k: [{ hip: [96, 118], t: 94, f: [[110, 108], [108, 110]], ks: [1, 1], h: [[128, 182], [124, 182]] }], p: [] };
  T.press = (eq, sit) => ({ k: [ST(Object.assign({ h: [[116, 52], [112, 52]], es: [1, 1] }, sit ? seat() : {})), ST(Object.assign({ h: [[106, -10], [102, -10]] }, sit ? seat() : {}))], p: [eqProp(eq)].concat(sit ? [{ k: 'seat', x: 92, y: 146, back: true }] : []) });
  T.bench = (eq) => ({ k: [lieBench([[122, 122], [118, 122]], { es: [1, 1] }), lieBench([[122, 88], [118, 88]])], p: [{ k: 'bench', x1: 30, y1: 152, x2: 150, y2: 152 }, eqProp(eq)] });
  T.incline = (eq) => ({ k: [{ hip: [72, 146], t: 118, f: [[36, 182], [46, 182]], ks: [1, 1], h: [[128, 108], [124, 108]], es: [1, 1] }, { hip: [72, 146], t: 118, f: [[36, 182], [46, 182]], ks: [1, 1], h: [[140, 72], [136, 72]] }], p: [{ k: 'bench', x1: 60, y1: 156, x2: 110, y2: 120 }, eqProp(eq)] });
  T.floorpress = (eq) => ({ k: [{ hip: [70, 176], t: 90, f: [[26, 182], [30, 182]], ks: [1, 1], h: [[122, 146], [118, 146]], es: [1, 1] }, { hip: [70, 176], t: 90, f: [[26, 182], [30, 182]], ks: [1, 1], h: [[122, 118], [118, 118]] }], p: [eqProp(eq)] });
  T.chestpress = { k: [seat({ h: [[110, 96], [106, 96]], es: [1, 1] }), seat({ h: [[150, 98], [146, 98]] })], p: [{ k: 'seat', x: 92, y: 146, back: true }] };
  T.fly = (eq) => ({ k: [lieBench([[150, 150], [146, 150]], { es: [1, 1] }), lieBench([[124, 88], [120, 88]])], p: [{ k: 'bench', x1: 30, y1: 152, x2: 150, y2: 152 }, eqProp(eq)] });
  T.skull = { k: [lieBench(null, { a: [[196, 240], [196, 240]] }), lieBench(null, { a: [[182, 182], [182, 182]] })], p: [{ k: 'bench', x1: 30, y1: 152, x2: 150, y2: 152 }, { k: 'db', h: [0, 1] }] };
  T.pullover = { k: [lieBench([[176, 150], [172, 150]]), lieBench([[124, 90], [120, 90]])], p: [{ k: 'bench', x1: 30, y1: 152, x2: 150, y2: 152 }, { k: 'db', h: [0] }] };
  T.support = (eq) => ({ k: [{ hip: [100, 88], t: 180, h: [[106, 94], [100, 94]], f: [[92, 166], [88, 167]], ks: [1, 1] }, { hip: [100, 86], t: 180, h: [[106, 94], [100, 94]], f: [[92, 164], [88, 165]], ks: [1, 1] }], p: [eq === 'rings' ? { k: 'rings', top: -22 } : { k: 'post', x: 106, y: 94 }] });
  T.dip = (eq) => ({ k: [{ hip: [100, 86], t: 180, h: [[106, 94], [100, 94]], f: [[90, 164], [86, 165]], ks: [1, 1] }, { hip: [98, 116], t: 166, h: [[106, 94], [100, 94]], f: [[80, 186], [76, 186]], ks: [1, 1], es: [1, 1] }], p: [eq === 'rings' ? { k: 'rings', top: -22 } : { k: 'post', x: 106, y: 94 }] });
  T.benchdip = { k: [{ hip: [84, 112], t: 178, h: [[72, 122], [68, 122]], f: [[168, 182], [164, 182]] }, { hip: [86, 142], t: 176, h: [[72, 122], [68, 122]], f: [[168, 182], [164, 182]], es: [1, 1] }], p: [{ k: 'box', x: 20, y: 124, w: 56 }] };
  T.ringfly = { k: [lineBody(30, 182, 116, [[178, 124], [174, 124]]), lineBody(30, 182, 108, [[178, 150], [174, 150]])], p: [{ k: 'rings', top: -22 }] };
  T.ringtri = { k: [lineBody(30, 182, 118, [[172, 112], [168, 112]]), lineBody(30, 182, 110, [[160, 118], [156, 118]], { es: [-1, -1] })], p: [{ k: 'rings', top: -22 }] };
  T.rollout = { k: [kneel({ hip: [70, 138], t: 150, h: [[106, 170], [102, 170]] }), kneel({ hip: [80, 150], t: 102, h: [[186, 150], [182, 150]] })], p: [{ k: 'rings', top: -22 }] };

  // Schultern & Arme
  T.lateral = (eq) => ({ k: [ST({ h: [[108, 114], [104, 114]] }), ST({ h: [[160, 56], [156, 56]] })], p: [eqProp(eq)] });
  T.revfly = (eq) => ({ k: [{ hip: [84, 102], t: 112, f: [[104, 182], [96, 182]], h: [[128, 150], [124, 150]] }, { hip: [84, 102], t: 112, f: [[104, 182], [96, 182]], h: [[118, 96], [114, 96]] }], p: [eqProp(eq)] });
  T.curl = (eq) => ({ k: [ST({ h: [[106, 114], [102, 114]] }), ST({ h: [[118, 60], [114, 60]], es: [1, 1] })], p: [eqProp(eq)] });
  T.conccurl = { k: [{ hip: [90, 142], t: 160, f: [[140, 182], [130, 182]], h: [[124, 166], [118, 140]] }, { hip: [90, 142], t: 160, f: [[140, 182], [130, 182]], h: [[120, 106], [118, 140]], es: [1, 1] }], p: [{ k: 'box', x: 58, y: 146, w: 50 }, { k: 'db', h: [0] }] };
  T.inclinecurl = { k: [{ hip: [96, 142], t: 212, f: [[146, 182], [140, 182]], h: [[74, 150], [70, 150]] }, { hip: [96, 142], t: 212, f: [[146, 182], [140, 182]], h: [[96, 86], [92, 86]], es: [1, 1] }], p: [{ k: 'bench', x1: 80, y1: 150, x2: 50, y2: 98 }, { k: 'db', h: [0, 1] }] };
  T.dbohext = { k: [ST({ a: [[184, -10], [184, -10]] }), ST({ a: [[180, 180], [180, 180]] })], p: [{ k: 'db', h: [0] }] };
  T.kickback = { k: [{ hip: [84, 102], t: 112, f: [[104, 182], [96, 182]], a: [[-70, 0], [-70, 0]] }, { hip: [84, 102], t: 112, f: [[104, 182], [96, 182]], a: [[-70, -70], [-70, -70]] }], p: [{ k: 'db', h: [0] }] };
  T.bandapart = { k: [ST({ h: [[160, 56], [156, 56]] }), ST({ h: [[104, 58], [100, 58]], es: [-1, -1] })], p: [] };

  // Beine
  const SQ0 = ST({ f: [[110, 182], [96, 182]], h: [[104, 112], [100, 112]] });
  const SQ1 = { hip: [84, 138], t: 152, f: [[112, 182], [98, 182]], h: [[152, 96], [148, 96]] };
  T.squat = { k: [ST({ f: [[110, 182], [96, 182]], h: [[150, 52], [146, 52]] }), SQ1], p: [] };
  T.goblet = { k: [ST({ f: [[110, 182], [96, 182]], h: [[116, 68], [114, 68]], es: [1, 1] }), Object.assign({}, SQ1, { h: [[124, 110], [122, 110]], es: [1, 1] })], p: [{ k: 'db', h: [0] }] };
  T.frontsq = (eq) => ({ k: [ST({ f: [[110, 182], [96, 182]], h: [[114, 54], [110, 54]], es: [1, 1] }), Object.assign({}, SQ1, { h: [[124, 96], [120, 96]], es: [1, 1] })], p: [eqProp(eq)] });
  T.backsq = { k: [ST({ f: [[110, 182], [96, 182]], h: [[84, 54], [80, 54]], es: [1, 1] }), Object.assign({}, SQ1, { t: 146, h: [[98, 100], [94, 100]], es: [1, 1] })], p: [{ k: 'bbsh' }] };
  T.legpress = { k: [{ hip: [70, 150], t: 232, f: [[122, 120], [118, 122]], ks: [1, 1], h: [[64, 150], [60, 150]] }, { hip: [70, 150], t: 232, f: [[146, 100], [142, 102]], ks: [1, 1], h: [[64, 150], [60, 150]] }], p: [{ k: 'bench', x1: 70, y1: 158, x2: 30, y2: 120 }, { k: 'footplate' }] };
  T.hack = { k: [ST({ t: 170, f: [[118, 176], [108, 176]], h: [[90, 52], [86, 52]] }), { hip: [92, 136], t: 162, f: [[118, 176], [108, 176]], h: [[98, 92], [94, 92]], es: [1, 1] }], p: [{ k: 'bench', x1: 60, y1: 176, x2: 96, y2: 20 }] };
  T.pistol = (box) => ({ k: [ST({ f: [[104, 182], [128, 164]], h: [[150, 60], [146, 60]], ks: [-1, -1] }), { hip: [84, box ? 142 : 152], t: 150, f: [[106, 182], [168, 158]], h: [[156, 104], [152, 104]] }], p: box ? [{ k: 'box', x: 50, y: 148, w: 44 }] : [] });
  T.shrimp = { k: [ST({ f: [[104, 182], [80, 150]], ks: [-1, 1], h: [[150, 60], [146, 60]] }), { hip: [86, 146], t: 150, f: [[106, 182], [52, 178]], ks: [-1, 1], h: [[156, 104], [152, 104]] }], p: [] };
  T.lunge = (eq) => ({ k: [ST({ f: [[106, 182], [96, 182]] }), { hip: [94, 128], t: 180, f: [[132, 182], [50, 182]], ks: [-1, 1], h: [[98, 140], [94, 140]] }], p: eq ? [eqProp(eq)] : [] });
  T.bss = (eq) => ({ k: [{ hip: [92, 106], t: 178, f: [[126, 182], [42, 132]], ks: [-1, 1], h: eq === 'goblet' ? [[114, 72], [112, 72]] : [[98, 118], [94, 118]], es: [1, 1] }, { hip: [90, 138], t: 172, f: [[126, 182], [42, 132]], ks: [-1, 1], h: eq === 'goblet' ? [[118, 104], [116, 104]] : [[96, 150], [92, 150]], es: [1, 1] }], p: [{ k: 'bench', x1: 16, y1: 138, x2: 60, y2: 138 }].concat(eq ? [eqProp(eq === 'goblet' ? 'db1' : eq)] : []) });
  T.stepup = { k: [{ hip: [96, 104], t: 176, f: [[132, 142], [92, 182]], h: [[100, 118], [96, 118]] }, { hip: [124, 66], t: 180, f: [[134, 142], [118, 150]], h: [[126, 80], [122, 80]], ks: [-1, -1] }], p: [{ k: 'box', x: 110, y: 144, w: 60 }, { k: 'db', h: [0] }] };
  T.cossack = { k: [ST({ f: [[120, 182], [80, 182]] }), { hip: [86, 150], t: 162, f: [[118, 182], [40, 182]], ks: [-1, 1], h: [[150, 110], [146, 110]] }], p: [] };
  T.rdl = (eq) => ({ k: [ST({ f: [[104, 182], [98, 182]], h: [[108, 112], [104, 112]] }), { hip: [82, 100], t: 108, f: [[106, 182], [100, 182]], h: [[128, 150], [124, 150]] }], p: eq ? [eqProp(eq)] : [] });
  T.slrdl = (eq) => ({ k: [ST({ f: [[104, 182], [94, 180]], h: [[108, 112], [104, 112]] }), { hip: [84, 102], t: 104, f: [[104, 182], [4, 92]], ks: [-1, -1], tp: [0, 1], h: [[128, 154], [124, 154]] }], p: eq ? [eqProp(eq)] : [] });
  T.deadlift = { k: [{ hip: [80, 128], t: 126, f: [[108, 182], [102, 182]], h: [[114, 166], [110, 166]] }, ST({ f: [[108, 182], [102, 182]], h: [[108, 112], [104, 112]] })], p: [{ k: 'bb', h: 0 }] };
  T.swing = { k: [{ hip: [80, 104], t: 118, f: [[110, 182], [100, 182]], h: [[108, 150], [106, 150]] }, ST({ f: [[110, 182], [100, 182]], h: [[160, 60], [158, 60]] })], p: [{ k: 'db', h: [0] }] };
  T.backext = { k: [{ hip: [104, 112], t: 40, f: [[40, 166], [44, 168]], ks: [1, 1], a: [[20, 20], [20, 20]] }, { hip: [104, 112], t: 118, f: [[40, 166], [44, 168]], ks: [1, 1], a: [[80, 60], [80, 60]] }], p: [{ k: 'bench', x1: 100, y1: 124, x2: 120, y2: 110, pad: true }, { k: 'bench', x1: 36, y1: 176, x2: 50, y2: 172 }] };
  T.bridge = { k: [{ hip: [100, 178], t: -88, f: [[140, 182], [136, 182]], ks: [1, 1], h: [[76, 182], [72, 182]] }, { hip: [98, 146], t: -58, f: [[140, 182], [136, 182]], ks: [1, 1], h: [[76, 182], [72, 182]] }], p: [] };
  T.hipthrust = (eq, single) => ({ k: [{ hip: [96, 176], t: -64, f: [[140, 182], single ? [150, 130] : [136, 182]], ks: [1, 1], h: [[98, 168], [94, 168]] }, { hip: [100, 136], t: -90, f: [[140, 182], single ? [178, 110] : [136, 182]], ks: [1, 1], h: [[102, 128], [98, 128]] }], p: [{ k: 'bench', x1: 14, y1: 146, x2: 60, y2: 146 }].concat(eq ? [{ k: eq === 'bb' ? 'bb' : 'db', h: [0], hipAt: true }] : []) });
  T.slide = { k: [{ hip: [110, 150], t: -66, f: [[182, 182], [178, 182]], ks: [1, 1], h: [[86, 182], [82, 182]] }, { hip: [106, 142], t: -60, f: [[146, 182], [142, 182]], ks: [1, 1], h: [[86, 182], [82, 182]] }], p: [] };
  T.ringlegcurl = { k: [{ hip: [110, 150], t: -66, f: [[182, 160], [178, 160]], ks: [1, 1], h: [[86, 182], [82, 182]] }, { hip: [106, 142], t: -60, f: [[146, 160], [142, 160]], ks: [1, 1], h: [[86, 182], [82, 182]] }], p: [{ k: 'rings', top: -22, feet: true }] };
  T.nordic = { k: [{ hip: [100, 138], t: 180, l: [[0, -90], [0, -90]], h: [[110, 110], [106, 110]] }, { hip: [130, 153], t: 130, l: [[-50, -90], [-50, -90]], h: [[176, 160], [172, 160]] }], p: [] };
  T.sissy = { k: [ST({ f: [[112, 182], [104, 182]], tp: [1, 1] }), { hip: [86, 136], t: 204, f: [[114, 180], [106, 180]], h: [[124, 96], [120, 96]], tp: [1, 1] }], p: [{ k: 'post', x: 150, y: 96 }] };
  T.legext = { k: [{ hip: [80, 140], t: 184, l: [[90, 0], [90, 0]], h: [[88, 150], [84, 150]] }, { hip: [80, 140], t: 184, l: [[90, 88], [90, 88]], h: [[88, 150], [84, 150]] }], p: [{ k: 'seat', x: 80, y: 144, back: true }] };
  T.legcurl = { k: [{ hip: [80, 140], t: 184, l: [[90, 90], [90, 90]], h: [[88, 150], [84, 150]] }, { hip: [80, 140], t: 184, l: [[90, -20], [90, -20]], h: [[88, 150], [84, 150]] }], p: [{ k: 'seat', x: 80, y: 144, back: true }] };
  T.calf = (eq) => ({ k: [ST({ hip: [100, 91], f: [[106, 174], [96, 174]] }), ST({ hip: [100, 82], f: [[106, 166], [96, 166]], tp: [1, 1] })], p: [{ k: 'box', x: 84, y: 176, w: 40 }].concat(eq ? [eqProp(eq)] : []) });
  T.abduct = { k: [{ hip: [80, 140], t: 184, l: [[90, 0], [90, 0]], h: [[88, 150], [84, 150]] }], p: [{ k: 'seat', x: 80, y: 144, back: true }] };

  // Rumpf
  T.plank = { k: [{ hip: [96, 160], t: 100, f: [[16, 180], [20, 180]], a: [[0, 90], [0, 90]], ks: [1, 1] }, { hip: [96, 158], t: 101, f: [[16, 180], [20, 180]], a: [[0, 90], [0, 90]], ks: [1, 1] }], p: [] };
  T.sideplank = { k: [{ hip: [96, 150], t: 104, f: [[16, 180], [20, 180]], a: [[4, 90], [180, 180]], ks: [1, 1] }, { hip: [96, 148], t: 105, f: [[16, 180], [20, 180]], a: [[4, 90], [180, 180]], ks: [1, 1] }], p: [] };
  T.hollow = { k: [{ hip: [110, 174], t: -80, f: [[190, 160], [188, 162]], h: [[10, 150], [12, 152]], ks: [1, 1], tp: [1, 1] }, { hip: [110, 174], t: -82, f: [[190, 156], [188, 158]], h: [[10, 146], [12, 148]], ks: [1, 1], tp: [1, 1] }], p: [] };
  T.deadbug = { k: [{ hip: [110, 178], t: -90, f: [[150, 136], [146, 138]], h: [[62, 118], [58, 118]], ks: [1, 1] }, { hip: [110, 178], t: -90, f: [[190, 170], [146, 138]], h: [[62, 118], [8, 170]], ks: [1, 1] }], p: [] };
  T.dragon = { k: [{ hip: [90, 108], t: -30, f: [[140, 40], [138, 42]], h: [[34, 148], [30, 148]], tp: [1, 1] }, { hip: [104, 132], t: -62, f: [[182, 106], [180, 108]], h: [[34, 148], [30, 148]], tp: [1, 1] }], p: [{ k: 'bench', x1: 24, y1: 158, x2: 120, y2: 158 }] };
  T.carry = (two) => ({ k: [ST({ f: [[122, 182], [80, 182]], h: [[102, 112], [98, 112]] }), ST({ f: [[80, 182], [122, 182]], h: [[102, 112], [98, 112]] })], p: [{ k: 'db', h: two ? [0, 1] : [0] }] });
  T.abmachine = { k: [seat({ t: 184, h: [[104, 44], [100, 44]], es: [1, 1] }), seat({ t: 140, h: [[140, 96], [136, 96]], es: [1, 1] })], p: [{ k: 'seat', x: 92, y: 146, back: true }] };

  // Kondition
  T.burpee = { k: [ST({ h: [[106, 112], [102, 112]] }), { hip: [90, 150], t: 132, f: [[110, 182], [104, 182]], h: [[140, 182], [136, 182]] }, plank(140, 182, 20, 181), ST({ hip: [100, 84], f: [[106, 168], [96, 168]], h: [[108, -4], [104, -4]] })], p: [] };
  T.climber = { k: [Object.assign(plank(140, 182, 20, 181), { f: [[108, 172], [24, 180]] }), Object.assign(plank(140, 182, 20, 181), { f: [[20, 180], [108, 172]] })], p: [] };
  T.thruster = { k: [Object.assign({}, SQ1, { h: [[118, 96], [114, 96]], es: [1, 1] }), ST({ f: [[110, 182], [96, 182]], h: [[106, -10], [102, -10]] })], p: [{ k: 'db', h: [0, 1] }] };
  T.jump = { k: [Object.assign({}, SQ1, { h: [[70, 150], [66, 150]] }), ST({ hip: [100, 80], f: [[106, 166], [96, 168]], tp: [1, 1], h: [[120, 0], [116, 0]] })], p: [] };

  function eqProp(eq) {
    if (eq === 'bb') return { k: 'bb', h: 0 };
    if (eq === 'db1') return { k: 'db', h: [0] };
    if (eq === 'cable') return { k: 'cable', from: [205, 186] };
    if (eq === 'band') return { k: 'band' };
    if (eq === 'mach') return { k: 'seat', x: 92, y: 146, back: true };
    if (eq === 'rings') return { k: 'rings', top: -22 };
    if (eq === 'none') return { k: 'none' };
    return { k: 'db', h: [0, 1] };
  }

  /* ---------------- Zuordnung Übung → Bild ---------------- */
  const M = {
    'dead-hang': 'hang', 'scap-pull': 'scap', 'neg-pullup': 'pullup', 'band-pullup': 'pullup', 'chinup': 'pullup', 'pullup': 'pullup', 'ring-pullup': 'ringpull', 'lsit-pullup': 'lsitpull', 'archer-pullup': 'pullup', 'oap-neg': 'pullup',
    'cable-pulldown': 'kneelpd', 'cable-1arm-pulldown': 'kneelpd', 'lat-pulldown': 'latpd',
    'table-row': 'tablerow', 'door-row': 'doorrow', 'ring-row-incline': 'ringrowinc', 'ring-row': 'ringrow', 'ring-row-elev': 'ringrowelev', 'ring-archer-row': 'ringrow', 'tuck-fl-row': 'flrow',
    'db-row': 'dbrow', 'db-row-pair': ['bentrow', 'db'], 'db-chest-row': 'chestrow', 'cable-high-row': 'highrow', 'bb-row': ['bentrow', 'bb'], 'seated-row': 'seatedrow', 'machine-row': 'machinerow', 'inverted-row': 'inverted',
    'pike-pushup': 'pike', 'pike-pushup-elev': 'pikeelev', 'wall-hspu-neg': 'hspu', 'wall-hspu': 'hspu', 'db-press': ['press', 'db'], 'db-press-1arm': ['press', 'db1'], 'arnold-press': ['press', 'db'], 'ohp': ['press', 'bb'], 'machine-shoulder': ['press', 'none', true],
    'incline-pushup': 'inclinepu', 'pushup': 'pushup', 'diamond-pushup': 'pushup', 'ring-pushup': 'ringpu', 'decline-pushup': 'declinepu', 'archer-pushup': 'pushup', 'pseudo-planche-pu': 'pseudo',
    'db-floor-press': ['floorpress', 'db'], 'db-floor-press-1arm': ['floorpress', 'db1'], 'db-bench': ['bench', 'db'], 'db-incline': ['incline', 'db'], 'bench': ['bench', 'bb'], 'incline-bench': ['incline', 'bb'], 'machine-chest': 'chestpress',
    'dip-support': ['support', 'post'], 'neg-dip': ['dip', 'post'], 'dip': ['dip', 'post'], 'ring-support': ['support', 'rings'], 'ring-dip': ['dip', 'rings'], 'rto-ring-dip': ['dip', 'rings'], 'bench-dip': 'benchdip',
    'ring-fly': 'ringfly', 'cable-fly-high': 'cfly', 'db-fly': ['fly', 'db'], 'cable-fly': 'cfly', 'pec-deck': 'chestpress',
    'db-lateral': ['lateral', 'db'], 'lean-lateral': ['lateral', 'db1'], 'cable-lateral': ['lateral', 'cable'], 'machine-lateral': ['lateral', 'mach'], 'cable-y-raise': 'yraise',
    'face-pull': 'facepull', 'cable-reverse-fly': 'creverse', 'ring-face-pull': 'ringface', 'db-reverse-fly': ['revfly', 'db'], 'band-pull-apart': 'bandapart', 'reverse-pec': ['revfly', 'mach'],
    'db-curl': ['curl', 'db'], 'hammer-curl': ['curl', 'db'], 'conc-curl': 'conccurl', 'incline-curl': 'inclinecurl', 'cable-curl-high': 'cablecurl', 'cable-curl-rope': 'bayes', 'ring-curl': 'ringcurl', 'ez-curl': ['curl', 'bb'], 'preacher-machine': ['curl', 'mach'], 'bayesian-curl': 'bayes',
    'rope-pushdown': 'pushdown', 'cable-oh-ext': 'ohext', 'db-oh-ext': 'dbohext', 'db-kickback': 'kickback', 'db-skull': 'skull', 'ring-tri-ext': 'ringtri', 'close-bench': ['bench', 'bb'], 'gym-pushdown': 'pushdown',
    'straight-arm-pd': 'straightpd', 'db-pullover': 'pullover',
    'air-squat': 'squat', 'goblet-squat': 'goblet', 'db-front-squat': ['frontsq', 'db'], 'box-pistol': ['pistol', true], 'pistol': ['pistol', false], 'shrimp-squat': 'shrimp', 'back-squat': 'backsq', 'front-squat': ['frontsq', 'bb'], 'hack-squat': 'hack', 'leg-press': 'legpress',
    'reverse-lunge': ['lunge', null], 'bss-bw': ['bss', null], 'db-bss': ['bss', 'goblet'], 'db-reverse-lunge': ['lunge', 'db1'], 'db-stepup': 'stepup', 'cossack': 'cossack', 'walking-lunge': ['lunge', 'db'],
    'sl-rdl-bw': ['slrdl', null], 'db-rdl': ['rdl', 'db1'], 'db-sl-rdl': ['slrdl', 'db1'], 'db-swing': 'swing', 'deadlift': 'deadlift', 'bb-rdl': ['rdl', 'bb'], 'back-ext': 'backext',
    'glute-bridge': 'bridge', 'sl-hip-thrust': ['hipthrust', null, true], 'db-hip-thrust': ['hipthrust', 'db'], 'bb-hip-thrust': ['hipthrust', 'bb'], 'abduction': 'abduct',
    'sliding-curl': 'slide', 'ring-leg-curl': 'ringlegcurl', 'nordic-neg': 'nordic', 'leg-curl': 'legcurl', 'sissy-squat': 'sissy', 'leg-ext': 'legext',
    'calf-sl': ['calf', 'db1'], 'calf-bw': ['calf', null], 'calf-machine': ['calf', null],
    'plank': 'plank', 'side-plank': 'sideplank', 'hollow-hold': 'hollow', 'dead-bug': 'deadbug', 'hanging-knee': 'knee', 'hanging-leg': 'legraise', 'toes-to-bar': 't2b', 'windshield': 'legraise', 'ring-rollout': 'rollout',
    'cable-crunch': 'cablecrunch', 'cable-woodchop': 'woodchop', 'dragon-flag': 'dragon', 'suitcase-carry': ['carry', false], 'farmer-carry': ['carry', true], 'ab-machine': 'abmachine',
    'tuck-lsit': 'lsittuck', 'lsit-one': 'lsitone', 'lsit': 'lsit', 'wall-hs': 'wallhs', 'free-hs': 'freehs', 'tuck-fl': 'fltuck', 'adv-tuck-fl': 'fladv', 'straddle-fl': 'fl', 'full-fl': 'fl',
    'false-grip-hang': 'falsegrip', 'mu-transition': 'mutrans', 'neg-mu': 'mu', 'muscle-up': 'mu', 'ring-mu': 'ringmu', 'skin-cat': 'skincat', 'tuck-bl': 'backlever', 'planche-lean': 'planchelean', 'tuck-planche': 'tuckplanche',
    'burpees': 'burpee', 'mountain': 'climber', 'db-thruster': 'thruster', 'swing-int': 'swing', 'jump-squat': 'jump'
  };
  const LS = (feet, o) => ({ k: [Object.assign({ hip: [96, 160], t: 180, h: [[102, 170], [98, 170]], f: feet, ks: [1, 1] }, o || {}), Object.assign({ hip: [96, 157], t: 180, h: [[102, 170], [98, 170]], f: feet, ks: [1, 1] }, o || {})], p: [{ k: 'post', x: 102, y: 170, low: true }] });
  T.lsit = LS([[178, 160], [176, 163]], { tp: [1, 1] });
  T.lsittuck = LS([[124, 150], [120, 152]]);
  T.lsitone = LS([[178, 160], [122, 152]], { tp: [1, 0] });
  const PAT_FALLBACK = { vpull: 'pullup', hpull: 'ringrow', vpush: ['press', 'db'], hpush: 'pushup', dip: ['dip', 'post'], fly: ['fly', 'db'], side: ['lateral', 'db'], rear: 'facepull', biceps: ['curl', 'db'], triceps: 'pushdown', latiso: 'straightpd', squat: 'squat', lunge: ['lunge', null], hinge: ['rdl', 'db1'], glute: 'bridge', hamcurl: 'slide', quadiso: 'legext', calf: ['calf', null], core: 'plank', skill: 'hang', cond: 'burpee' };

  function resolve(ex) {
    let m = M[ex.id] || PAT_FALLBACK[ex.pat] || 'squat';
    if (typeof m === 'string') m = [m];
    const t = T[m[0]];
    return typeof t === 'function' ? t.apply(null, m.slice(1)) : t;
  }

  /* ---------------- Zeichnen ---------------- */
  function propEls(pr, F, still, anim) {
    const J = F[still]; const out = [];
    const A = (attr, vals) => anim ? `<animate attributeName="${attr}" values="${vals.join(';')}" dur="${anim}s" repeatCount="indefinite"/>` : '';
    const at = (fn) => F.map(fn);
    const tr = (pts) => anim ? `<animateTransform attributeName="transform" type="translate" values="${pts.map(p => f1(p[0]) + ' ' + f1(p[1])).join(';')}" dur="${anim}s" repeatCount="indefinite"/>` : '';
    const g = (pts, inner) => `<g transform="translate(${f1(pts[still][0])} ${f1(pts[still][1])})">${tr(pts)}${inner}</g>`;
    const dbShape = '<rect x="-9" y="-3" width="18" height="6" rx="2" class="fp"/><rect x="-11" y="-7" width="6" height="14" rx="2" class="fp2"/><rect x="5" y="-7" width="6" height="14" rx="2" class="fp2"/>';
    switch (pr.k) {
      case 'bar': out.push(pr.rack ? `<path d="M${pr.x - 30} ${pr.y}V186M${pr.x + 30} ${pr.y}V186" class="fl" stroke-width="4"/>` : `<path d="M${pr.x - 32} ${pr.y}V-30M${pr.x + 32} ${pr.y}V-30" class="fl" stroke-width="3"/>`, `<path d="M${pr.x - 38} ${pr.y}H${pr.x + 38}" class="fp" stroke-width="6" stroke-linecap="round"/>`); break;
      case 'rings': {
        const idx = pr.feet ? 'an' : 'ha';
        [1, 0].forEach(i => {
          const pts = at(j => j[idx][i]); const top = pts[0][0];
          out.push(`<line x1="${f1(top)}" y1="${pr.top}" x2="${f1(pts[still][0])}" y2="${f1(pts[still][1])}" class="fl" stroke-width="2">${A('x2', pts.map(p => f1(p[0])))}${A('y2', pts.map(p => f1(p[1])))}</line>`);
          out.push(g(pts, '<circle r="6.5" fill="none" class="fring"/>'));
        });
        break;
      }
      case 'db': (pr.h || [0]).forEach(i => { const pts = pr.hipAt ? at(j => [j.hip[0], j.hip[1] - 6]) : at(j => j.ha[i]); out.push(g(pts, dbShape)); }); break;
      case 'bb': { const pts = pr.hipAt ? at(j => [j.hip[0], j.hip[1] - 10]) : at(j => j.ha[0]); out.push(g(pts, '<circle r="17" class="fp2"/><circle r="11" class="fp"/><circle r="3" class="fl2"/>')); break; }
      case 'bbsh': { const pts = at(j => [j.sh[0] - 6, j.sh[1] - 2]); out.push(g(pts, '<circle r="17" class="fp2"/><circle r="11" class="fp"/><circle r="3" class="fl2"/>')); break; }
      case 'cable': { const pts = at(j => j.ha[0]); out.push(`<circle cx="${pr.from[0]}" cy="${pr.from[1]}" r="6" class="fp2"/><line x1="${pr.from[0]}" y1="${pr.from[1]}" x2="${f1(pts[still][0])}" y2="${f1(pts[still][1])}" class="fl" stroke-width="2">${A('x2', pts.map(p => f1(p[0])))}${A('y2', pts.map(p => f1(p[1])))}</line>`); out.push(g(pts, '<rect x="-5" y="-5" width="10" height="10" rx="3" class="fp2"/>')); break; }
      case 'bench': { const b = `<path d="M${pr.x1} ${pr.y1}L${pr.x2} ${pr.y2}" class="fp" stroke-width="${pr.pad ? 12 : 9}" stroke-linecap="round"/>`; const legs = pr.pad ? '' : `<path d="M${Math.min(pr.x1, pr.x2) + 6} ${Math.max(pr.y1, pr.y2) + 2}V186M${Math.max(pr.x1, pr.x2) - 6} ${Math.max(pr.y1, pr.y2) + 2}V186" class="fl" stroke-width="4"/>`; out.push(legs + b); break; }
      case 'box': out.push(`<rect x="${pr.x}" y="${pr.y}" width="${pr.w}" height="${186 - pr.y}" rx="5" class="fbox"/>`); break;
      case 'post': out.push(`<path d="M${pr.x} ${pr.y}V186" class="fl" stroke-width="5"/><path d="M${pr.x - 10} ${pr.y}H${pr.x + 10}" class="fp" stroke-width="6" stroke-linecap="round"/>`); break;
      case 'wall': out.push(`<rect x="${pr.x - 8}" y="-22" width="8" height="208" class="fbox"/>`); break;
      case 'door': out.push(`<rect x="${pr.x}" y="-10" width="10" height="196" class="fbox"/><circle cx="${pr.x - 3}" cy="80" r="4" class="fp2"/>`); break;
      case 'table': out.push(`<path d="M${pr.x1} ${pr.y}H${pr.x2}" class="fp" stroke-width="7"/><path d="M${pr.x1 + 8} ${pr.y}V186M${pr.x2 - 8} ${pr.y}V186" class="fl" stroke-width="4"/>`); break;
      case 'seat': out.push(`<path d="M${pr.x - 22} ${pr.y}H${pr.x + 22}" class="fp" stroke-width="9" stroke-linecap="round"/><path d="M${pr.x} ${pr.y}V186" class="fl" stroke-width="5"/>` + (pr.back ? `<path d="M${pr.x - 20} ${pr.y}L${pr.x - 26} ${pr.y - 58}" class="fp" stroke-width="9" stroke-linecap="round"/>` : '') + (pr.pad ? `<circle cx="${pr.pad[0]}" cy="${pr.pad[1]}" r="8" class="fp"/>` : '')); break;
      case 'footplate': { const pts = at(j => j.an[0]); out.push(g(pts, '<path d="M-6 -22L10 18" class="fp" stroke-width="7" stroke-linecap="round"/>')); break; }
      case 'band': { const pts = at(j => j.ha[0]); out.push(g(pts, '<circle r="4" class="fband"/>')); break; }
    }
    return out.join('');
  }

  /* Erzeugt das SVG. opts: {anim: Sekunden oder 0, cls} */
  const cache = {};
  function svg(ex, opts) {
    opts = opts || {};
    const key = ex.id + '|' + (opts.anim || 0);
    if (cache[key]) return cache[key];
    const tpl = resolve(ex);
    const anim = opts.anim && tpl.k.length > 1 ? opts.anim * (tpl.k.length > 2 ? tpl.k.length / 2 : 1) : 0;
    const F = frames(tpl.k, anim ? 7 : 1);
    const still = anim ? 0 : Math.min(tpl.still ?? 1, tpl.k.length - 1);
    const SF = anim ? F : tpl.k.map(joints);
    const J = SF[still];
    const A = (attr, vals) => anim ? `<animate attributeName="${attr}" values="${vals.join(';')}" dur="${anim}s" repeatCount="indefinite" calcMode="linear"/>` : '';
    const path = (sel, cls, w) => { const ds = SF.map(sel).map(pth); return `<path d="${ds[still]}" class="${cls}" stroke-width="${w}">${A('d', ds)}</path>`; };
    const circ = (sel, r, cls) => { const ps = SF.map(sel); return `<circle cx="${f1(ps[still][0])}" cy="${f1(ps[still][1])}" r="${r}" class="${cls}">${A('cx', ps.map(p => f1(p[0])))}${A('cy', ps.map(p => f1(p[1])))}</circle>`; };
    const props = (tpl.p || []).filter(p => p && p.k !== 'none');
    const back = props.filter(p => ['bar', 'bench', 'box', 'post', 'wall', 'door', 'table', 'seat'].includes(p.k));
    const front = props.filter(p => !back.includes(p));
    const body =
      path(j => [j.hip, j.kn[1], j.an[1], j.to[1]], 'ffar', 11) +
      path(j => [j.sh, j.el[1], j.ha[1]], 'ffar', 9) +
      path(j => [j.hip, j.sh], 'fnear', 19) +
      circ(j => j.head, L.HR, 'fhead') +
      path(j => [j.hip, j.kn[0], j.an[0], j.to[0]], 'fnear', 12) +
      path(j => [j.sh, j.el[0], j.ha[0]], 'fnear', 9.5);
    const sc = tpl.sc || 1;
    const inner = `${props.length ? propEls({ k: 'none' }, SF, still, anim) : ''}${back.map(p => propEls(p, SF, still, anim)).join('')}${body}${front.map(p => propEls(p, SF, still, anim)).join('')}`;
    const out = `<svg class="fig ${opts.cls || ''}" viewBox="-12 -26 224 224" role="img" aria-label="${ex.name.replace(/"/g, '')}"><ellipse cx="100" cy="190" rx="74" ry="9" class="ffloor"/><g ${sc !== 1 ? `transform="translate(100 186) scale(${sc}) translate(-100 -186)"` : ''} stroke-linecap="round" stroke-linejoin="round" fill="none">${inner}</g></svg>`;
    cache[key] = out; return out;
  }
  window.FIG = { svg, templates: T, map: M };
})();
