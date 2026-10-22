/* Werkstatt-Tabellen: Gewinde, Schlüsselweiten, Anziehdrehmomente, Schnittdaten, Gewicht, Dreieck, Rauheit, Gleitschleifen.
   Alle Werte fest hinterlegt. Läuft im Browser und in Node (Tests in test.js). */
(function (root) {
  'use strict';
  const T = root.TOL = root.TOL || {};
  const W = T.W = {};
  const r6 = x => Math.round(x * 1e6) / 1e6;
  const PI = Math.PI;

  // ================================================================
  // Gewinde
  // ================================================================
  // Metrisches ISO-Regelgewinde (ISO 261): Nenndurchmesser und Steigung in mm
  W.M_COARSE = [[1, 0.25], [1.2, 0.25], [1.4, 0.3], [1.6, 0.35], [1.8, 0.35], [2, 0.4], [2.2, 0.45], [2.5, 0.45], [3, 0.5], [3.5, 0.6], [4, 0.7], [5, 0.8], [6, 1], [7, 1], [8, 1.25], [10, 1.5], [12, 1.75], [14, 2], [16, 2], [18, 2.5], [20, 2.5], [22, 2.5], [24, 3], [27, 3], [30, 3.5], [33, 3.5], [36, 4], [39, 4], [42, 4.5], [45, 4.5], [48, 5], [52, 5], [56, 5.5], [60, 5.5], [64, 6], [68, 6]];
  // Gebräuchliche Feingewinde (Auswahl aus ISO 261/262)
  W.M_FINE = [[6, 0.75], [8, 0.75], [8, 1], [10, 0.75], [10, 1], [10, 1.25], [12, 1], [12, 1.25], [12, 1.5], [14, 1], [14, 1.25], [14, 1.5], [16, 1], [16, 1.5], [18, 1], [18, 1.5], [18, 2], [20, 1], [20, 1.5], [20, 2], [22, 1.5], [22, 2], [24, 1.5], [24, 2], [27, 1.5], [27, 2], [30, 1.5], [30, 2], [33, 2], [36, 1.5], [36, 2], [36, 3], [39, 3], [42, 2], [42, 3], [45, 3], [48, 2], [48, 3], [52, 3], [56, 2], [56, 3], [56, 4], [60, 4], [64, 2], [64, 3], [64, 4]];
  // Kernlochbohrer nach DIN 336, wo er von d − P abweicht (Schlüssel „d×P“)
  W.TAP_DRILL_DIN = { '8x1.25': 6.8, '12x1.75': 10.2, '10x1.25': 8.8, '12x1.25': 10.8, '14x1.25': 12.8 };

  // Whitworth-Rohrgewinde G (ISO 228-1): Außendurchmesser, Gänge je Zoll, üblicher Kernlochbohrer, Flanken- und Kerndurchmesser (mm)
  W.G = [['1/16', 7.723, 28, 6.8, 7.142, 6.561], ['1/8', 9.728, 28, 8.8, 9.147, 8.566], ['1/4', 13.157, 19, 11.8, 12.301, 11.445], ['3/8', 16.662, 19, 15.25, 15.806, 14.950], ['1/2', 20.955, 14, 19, 19.793, 18.631], ['5/8', 22.911, 14, 21, 21.749, 20.587], ['3/4', 26.441, 14, 24.5, 25.279, 24.117], ['7/8', 30.201, 14, 28.25, 29.039, 27.877], ['1', 33.249, 11, 30.75, 31.770, 30.291], ['1 1/8', 37.897, 11, null, 36.418, 34.939], ['1 1/4', 41.910, 11, 39.5, 40.431, 38.952], ['1 1/2', 47.803, 11, 45.25, 46.324, 44.845], ['1 3/4', 53.746, 11, null, 52.267, 50.788], ['2', 59.614, 11, 57, 58.135, 56.656], ['2 1/4', 65.710, 11, null, 64.231, 62.752], ['2 1/2', 75.184, 11, null, 73.705, 72.226], ['2 3/4', 81.534, 11, null, 80.055, 78.576], ['3', 87.884, 11, null, 86.405, 84.926], ['4', 113.030, 11, null, 111.551, 110.072]];

  // Unified-Gewinde (ASME B1.1): Bezeichnung, Außendurchmesser in Zoll, Gänge je Zoll
  W.UNC = [['#2', 0.086, 56], ['#4', 0.112, 40], ['#5', 0.125, 40], ['#6', 0.138, 32], ['#8', 0.164, 32], ['#10', 0.19, 24], ['#12', 0.216, 24], ['1/4', 0.25, 20], ['5/16', 0.3125, 18], ['3/8', 0.375, 16], ['7/16', 0.4375, 14], ['1/2', 0.5, 13], ['9/16', 0.5625, 12], ['5/8', 0.625, 11], ['3/4', 0.75, 10], ['7/8', 0.875, 9], ['1', 1, 8]];
  W.UNF = [['#4', 0.112, 48], ['#6', 0.138, 40], ['#8', 0.164, 36], ['#10', 0.19, 32], ['1/4', 0.25, 28], ['5/16', 0.3125, 24], ['3/8', 0.375, 24], ['7/16', 0.4375, 20], ['1/2', 0.5, 20], ['9/16', 0.5625, 18], ['5/8', 0.625, 18], ['3/4', 0.75, 16], ['7/8', 0.875, 14], ['1', 1, 12]];

  // Metrisches ISO-Trapezgewinde (ISO 2904): Nenndurchmesser, Steigung
  W.TR = [[8, 1.5], [10, 2], [12, 3], [14, 3], [16, 4], [18, 4], [20, 4], [22, 5], [24, 5], [26, 5], [28, 5], [30, 6], [32, 6], [34, 6], [36, 6], [40, 7], [44, 7], [48, 8], [50, 8], [52, 8], [55, 9], [60, 9], [65, 10], [70, 10], [75, 10], [80, 10]];

  const round05 = x => Math.round(x * 20) / 20;

  // Spitzgewinde 60° (metrisch und Unified): Maße aus dem Grundprofil nach ISO 68-1 und ISO 724
  function vProfile(d, P) {
    const H = 0.866025 * P;
    const d2 = d - 0.649519 * P, d1 = d - 1.082532 * P, d3 = d - 1.226869 * P;
    const As = PI / 4 * Math.pow((d2 + d3) / 2, 2);
    return { H: r6(H), d2: r6(d2), d1: r6(d1), d3: r6(d3), As: r6(As), h3: r6(0.613343 * P) };
  }

  // Ein metrisches Gewinde beschreiben; P leer = Regelgewinde
  W.metric = function (d, P) {
    const coarse = W.M_COARSE.find(x => x[0] === d);
    if (P == null) {
      if (!coarse) return { ok: false, error: `M${T.fmt(d)} gibt es als Regelgewinde nicht. Regelgewinde: M1 bis M68, zum Beispiel M3, M8, M12.` };
      P = coarse[1];
    }
    if (!(d >= 1 && d <= 300) || !(P > 0 && P < d / 2)) return { ok: false, error: 'Durchmesser oder Steigung passen nicht zusammen.' };
    const isCoarse = !!coarse && coarse[1] === P;
    const isListedFine = W.M_FINE.some(x => x[0] === d && x[1] === P);
    const g = vProfile(d, P);
    const key = `${d}x${P}`;
    const calc = r6(d - P);
    const tap = W.TAP_DRILL_DIN[key] != null ? W.TAP_DRILL_DIN[key] : round05(calc);
    const name = isCoarse ? `M${T.fmt(d)}` : `M${T.fmt(d)}×${T.fmt(P)}`;
    return Object.assign({ ok: true, type: 'M', name, d, P, coarse: isCoarse, listed: isCoarse || isListedFine, tap, tapCalc: calc }, g);
  };

  W.whitworthPipe = function (size) {
    const g = W.G.find(x => x[0] === size);
    if (!g) return { ok: false, error: 'Diese Größe gibt es beim Rohrgewinde G nicht.' };
    const [s, d, tpi, tap, d2, d1] = g, P = 25.4 / tpi;
    return { ok: true, type: 'G', name: `G ${s}`, d, tpi, P: r6(P), d2, d1, tap, H: r6(0.960491 * P) };
  };

  W.unified = function (kind, size) {
    const list = kind === 'UNF' ? W.UNF : W.UNC;
    const u = list.find(x => x[0] === size);
    if (!u) return { ok: false, error: `${size} gibt es bei ${kind} nicht.` };
    const [s, dIn, tpi] = u, d = r6(dIn * 25.4), P = r6(25.4 / tpi);
    const g = vProfile(d, P);
    g.As = r6(PI / 4 * Math.pow(d - 0.974279 * P, 2));   // Spannungsquerschnitt nach ASME B1.1
    return Object.assign({ ok: true, type: kind, name: `${s}-${tpi} ${kind}`, d, dIn, tpi, P, tap: Math.round((d - P) * 10) / 10 }, g);
  };

  W.trapez = function (d, P) {
    const t = W.TR.find(x => x[0] === d && (P == null || x[1] === P));
    if (P == null) { if (!t) return { ok: false, error: `Tr${T.fmt(d)} ist keine Vorzugsgröße. Gib die Steigung mit an, zum Beispiel Tr20×4.` }; P = t[1]; }
    const ac = P <= 1.5 ? 0.15 : P <= 5 ? 0.25 : P <= 12 ? 0.5 : 1;
    const h3 = 0.5 * P + ac;
    return { ok: true, type: 'Tr', name: `Tr${T.fmt(d)}×${T.fmt(P)}`, d, P, ac, d2: r6(d - 0.5 * P), d3: r6(d - 2 * h3), D1: r6(d - P), D4: r6(d + 2 * ac), h3: r6(h3), listed: !!t };
  };

  // Gewindeangabe lesen: M8, M8x1, G1/2, G 1 1/4, 1/4-20 UNC, UNF 3/8, Tr20x4
  W.parseThread = function (str) {
    let s = String(str || '').trim().replace(/,/g, '.').replace(/\s+/g, ' ').replace(/[×*]/g, 'x');
    let m = /^m\s*(\d+(?:\.\d+)?)(?:\s*x\s*(\d+(?:\.\d+)?))?$/i.exec(s);
    if (m) return W.metric(parseFloat(m[1]), m[2] ? parseFloat(m[2]) : null);
    m = /^tr\s*(\d+(?:\.\d+)?)(?:\s*x\s*(\d+(?:\.\d+)?))?$/i.exec(s);
    if (m) return W.trapez(parseFloat(m[1]), m[2] ? parseFloat(m[2]) : null);
    m = /^g\s*(\d+(?:\s+\d+\/\d+|\/\d+)?)"?$/i.exec(s);
    if (m) return W.whitworthPipe(m[1].replace(/\s+/g, ' '));
    m = /^(?:(unc|unf)\s*)?(#\d+|\d+\/\d+|1)\s*(?:-\s*(\d+))?\s*(unc|unf)?$/i.exec(s);
    if (m && (m[1] || m[4] || m[3])) {
      let kind = (m[1] || m[4] || '').toUpperCase();
      const size = m[2];
      if (!kind && m[3]) kind = W.UNF.some(x => x[0] === size && x[2] === +m[3]) && !W.UNC.some(x => x[0] === size && x[2] === +m[3]) ? 'UNF' : 'UNC';
      const r = W.unified(kind, size);
      if (r.ok && m[3] && r.tpi !== +m[3]) return { ok: false, error: `${size} ${kind} hat ${r.tpi} Gänge je Zoll, nicht ${m[3]}.` };
      return r;
    }
    return { ok: false, error: 'Schreib das Gewinde zum Beispiel so: M8, M10x1, G1/2, 1/4-20 UNC oder Tr20x4.' };
  };

  // ================================================================
  // Schrauben: Schlüsselweiten, Kopfmaße, Durchgangslöcher, Senkungen
  // ================================================================
  const SIZES = [1.6, 2, 2.5, 3, 3.5, 4, 5, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 27, 30, 33, 36, 39, 42, 45, 48, 52, 56, 60, 64];
  W.SCREW_SIZES = SIZES;
  const col = obj => SIZES.map(d => obj[d] != null ? obj[d] : null);
  // Sechskantschraube und -mutter ISO 4014/4017/4032
  W.SW_ISO = col({ 1.6: 3.2, 2: 4, 2.5: 5, 3: 5.5, 3.5: 6, 4: 7, 5: 8, 6: 10, 8: 13, 10: 16, 12: 18, 14: 21, 16: 24, 18: 27, 20: 30, 22: 34, 24: 36, 27: 41, 30: 46, 33: 50, 36: 55, 39: 60, 42: 65, 45: 70, 48: 75, 52: 80, 56: 85, 60: 90, 64: 95 });
  // Alte DIN 931/933/934: anders nur bei M10, M12, M14 und M22
  W.SW_DIN = col({ 1.6: 3.2, 2: 4, 2.5: 5, 3: 5.5, 3.5: 6, 4: 7, 5: 8, 6: 10, 8: 13, 10: 17, 12: 19, 14: 22, 16: 24, 18: 27, 20: 30, 22: 32, 24: 36, 27: 41, 30: 46, 33: 50, 36: 55, 39: 60, 42: 65, 45: 70, 48: 75, 52: 80, 56: 85, 60: 90, 64: 95 });
  // Zylinderschraube mit Innensechskant ISO 4762 (DIN 912): Schlüsselweite und Kopfdurchmesser
  W.SW_4762 = col({ 1.6: 1.5, 2: 1.5, 2.5: 2, 3: 2.5, 4: 3, 5: 4, 6: 5, 8: 6, 10: 8, 12: 10, 14: 12, 16: 14, 18: 14, 20: 17, 22: 17, 24: 19, 27: 19, 30: 22, 36: 27, 42: 32, 48: 36, 56: 41, 64: 46 });
  W.DK_4762 = col({ 1.6: 3, 2: 3.8, 2.5: 4.5, 3: 5.5, 4: 7, 5: 8.5, 6: 10, 8: 13, 10: 16, 12: 18, 14: 21, 16: 24, 18: 27, 20: 30, 22: 33, 24: 36, 27: 40, 30: 45, 36: 54, 42: 63, 48: 72, 56: 84, 64: 96 });
  // Senkschraube mit Innensechskant ISO 10642, Flachkopf ISO 7380, Gewindestift ISO 4026 bis 4029
  W.SW_10642 = col({ 3: 2, 4: 2.5, 5: 3, 6: 4, 8: 5, 10: 6, 12: 8, 14: 10, 16: 10, 20: 12 });
  W.SW_7380 = col({ 3: 2, 4: 2.5, 5: 3, 6: 4, 8: 5, 10: 6, 12: 8, 16: 10 });
  W.SW_4026 = col({ 1.6: 0.7, 2: 0.9, 2.5: 1.3, 3: 1.5, 4: 2, 5: 2.5, 6: 3, 8: 4, 10: 5, 12: 6, 16: 8, 20: 10, 24: 12 });
  // Durchgangslöcher ISO 273: fein, mittel, grob
  W.HOLE_273 = col({ 1.6: [1.7, 1.8, 2], 2: [2.2, 2.4, 2.6], 2.5: [2.7, 2.9, 3.1], 3: [3.2, 3.4, 3.6], 3.5: [3.7, 3.9, 4.2], 4: [4.3, 4.5, 4.8], 5: [5.3, 5.5, 5.8], 6: [6.4, 6.6, 7], 8: [8.4, 9, 10], 10: [10.5, 11, 12], 12: [13, 13.5, 14.5], 14: [15, 15.5, 16.5], 16: [17, 17.5, 18.5], 18: [19, 20, 21], 20: [21, 22, 24], 22: [23, 24, 26], 24: [25, 26, 28], 27: [28, 30, 32], 30: [31, 33, 35], 33: [34, 36, 38], 36: [37, 39, 42], 39: [40, 42, 45], 42: [43, 45, 48], 45: [46, 48, 52], 48: [50, 52, 56], 52: [54, 56, 62], 56: [58, 62, 66], 60: [62, 66, 70], 64: [66, 70, 74] });
  // Senkung für Zylinderschrauben ISO 4762 nach DIN 974-1 (ohne Unterlegteil): Senkdurchmesser und Senktiefe
  W.CBORE_974 = col({ 3: [6.5, 3.4], 4: [8, 4.4], 5: [10, 5.4], 6: [11, 6.4], 8: [15, 8.6], 10: [18, 10.6], 12: [20, 12.6], 14: [24, 14.6], 16: [26, 16.6], 20: [33, 20.6], 24: [40, 24.8] });

  W.screw = function (d) {
    const i = SIZES.indexOf(d);
    if (i < 0) return { ok: false, error: `Für M${T.fmt(d)} sind keine Schraubenmaße hinterlegt. Möglich: M1,6 bis M64.` };
    const thr = W.metric(d, null);
    return {
      ok: true, d, name: `M${T.fmt(d)}`, swIso: W.SW_ISO[i], swDin: W.SW_DIN[i], sw4762: W.SW_4762[i], dk4762: W.DK_4762[i], k4762: W.SW_4762[i] != null ? d : null,
      sw10642: W.SW_10642[i], sw7380: W.SW_7380[i], sw4026: W.SW_4026[i], hole: W.HOLE_273[i], cbore: W.CBORE_974[i], thread: thr.ok ? thr : null
    };
  };

  // ================================================================
  // Anziehdrehmomente: VDI 2230 Blatt 1, Regelgewinde, Schaftschrauben, µG = µK = 0,12, 90 % Ausnutzung
  // ================================================================
  W.TORQUE = {
    sizes: [4, 5, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 27, 30],
    '8.8': [3.0, 5.9, 10.1, 24.6, 48, 84, 133, 206, 295, 415, 567, 714, 1050, 1420],
    '10.9': [4.4, 8.7, 14.9, 36.1, 71, 123, 195, 302, 421, 592, 807, 1017, 1496, 2033],
    '12.9': [5.1, 10.2, 17.4, 42.2, 83, 144, 229, 354, 492, 692, 945, 1190, 1750, 2380]
  };
  W.torque = function (d, cls) {
    const i = W.TORQUE.sizes.indexOf(d);
    if (i < 0) return { ok: false, error: `Für M${T.fmt(d)} ist kein Anziehdrehmoment hinterlegt. Möglich: M4 bis M30.` };
    if (!W.TORQUE[cls]) return { ok: false, error: 'Festigkeitsklasse 8.8, 10.9 oder 12.9 wählen.' };
    return { ok: true, d, cls, MA: W.TORQUE[cls][i] };
  };

  // ================================================================
  // Schnittdaten
  // ================================================================
  // Drehzahl aus Schnittgeschwindigkeit: n = vc · 1000 / (π · d)
  W.rpm = (vc, d) => vc * 1000 / (PI * d);
  W.vcFromRpm = (n, d) => PI * d * n / 1000;
  W.MATERIALS_CUT = [
    { id: 'st', name: 'Baustahl', ex: 'S235, C15', mill: [[25, 35], [150, 250]], drill: [[20, 30], [80, 120]], turn: [[30, 50], [180, 280]], fz: [0.03, 0.08] },
    { id: 'vst', name: 'Vergütungsstahl', ex: '42CrMo4, C45', mill: [[15, 25], [100, 180]], drill: [[12, 20], [60, 100]], turn: [[15, 30], [120, 200]], fz: [0.03, 0.07] },
    { id: 'ed', name: 'Edelstahl', ex: '1.4301, 1.4404', mill: [[10, 15], [80, 140]], drill: [[8, 12], [40, 70]], turn: [[12, 20], [100, 180]], fz: [0.02, 0.06] },
    { id: 'gg', name: 'Gusseisen', ex: 'EN-GJL-250', mill: [[15, 25], [100, 200]], drill: [[15, 25], [70, 110]], turn: [[15, 30], [120, 250]], fz: [0.04, 0.10] },
    { id: 'al', name: 'Aluminium', ex: 'AlMgSi1, AlZnMgCu', mill: [[100, 300], [300, 1000]], drill: [[60, 120], [150, 300]], turn: [[100, 250], [300, 1000]], fz: [0.05, 0.15] },
    { id: 'ms', name: 'Messing', ex: 'CuZn39Pb3', mill: [[40, 80], [150, 300]], drill: [[40, 60], [100, 200]], turn: [[50, 100], [200, 400]], fz: [0.04, 0.12] },
    { id: 'ku', name: 'Kunststoff', ex: 'POM, PA', mill: [[50, 150], [200, 500]], drill: [[30, 60], [100, 200]], turn: [[50, 150], [200, 500]], fz: [0.05, 0.20] },
    { id: 'ti', name: 'Titan', ex: 'Ti6Al4V', mill: [[8, 15], [40, 80]], drill: [[6, 10], [30, 50]], turn: [[10, 20], [40, 80]], fz: [0.02, 0.05] }
  ];
  // Fräsen: n, Vorschubgeschwindigkeit vf = fz · z · n, Zeitspanvolumen Q = ae · ap · vf / 1000 (cm³/min)
  W.milling = function ({ d, vc, n, z, fz, ae, ap }) {
    if (!(d > 0)) return { ok: false, error: 'Gib den Fräserdurchmesser ein.' };
    if (n == null && !(vc > 0)) return { ok: false, error: 'Gib die Schnittgeschwindigkeit vc oder die Drehzahl n ein.' };
    const N = n != null ? n : W.rpm(vc, d), VC = vc != null && n == null ? vc : W.vcFromRpm(N, d);
    const res = { ok: true, n: N, vc: VC };
    if (z > 0 && fz > 0) { res.vf = fz * z * N; if (ae > 0 && ap > 0) res.Q = ae * ap * res.vf / 1000; }
    return res;
  };
  // Bohren: vf = f · n
  W.drilling = function ({ d, vc, n, f }) {
    if (!(d > 0)) return { ok: false, error: 'Gib den Bohrerdurchmesser ein.' };
    if (n == null && !(vc > 0)) return { ok: false, error: 'Gib die Schnittgeschwindigkeit vc oder die Drehzahl n ein.' };
    const N = n != null ? n : W.rpm(vc, d), VC = vc != null && n == null ? vc : W.vcFromRpm(N, d);
    const res = { ok: true, n: N, vc: VC };
    if (f > 0) { res.vf = f * N; res.Q = PI * d * d / 4 * res.vf / 1000; }
    return res;
  };
  // Drehen: vf = f · n, Zeitspanvolumen Q = vc · ap · f (cm³/min), theoretische Rautiefe
  W.turning = function ({ d, vc, n, f, ap, r }) {
    if (!(d > 0)) return { ok: false, error: 'Gib den Werkstückdurchmesser ein.' };
    if (n == null && !(vc > 0)) return { ok: false, error: 'Gib die Schnittgeschwindigkeit vc oder die Drehzahl n ein.' };
    const N = n != null ? n : W.rpm(vc, d), VC = vc != null && n == null ? vc : W.vcFromRpm(N, d);
    const res = { ok: true, n: N, vc: VC };
    if (f > 0) { res.vf = f * N; if (ap > 0) res.Q = VC * ap * f; if (r > 0) Object.assign(res, W.roughTurn(f, r)); }
    return res;
  };

  // ----------------------------------------------------------------
  // Schnittdaten-Löser: beliebige Werte eingeben, alles Fehlende wird über die Formeln gerechnet
  // ----------------------------------------------------------------
  const RZ_RA = 31.2 / 8;   // theoretisches Profil der Schneidenecke: Rz = 3,9 · Ra
  const RULES_BASE = [
    { out: 'n', ins: ['vc', 'd'], fn: v => v.vc * 1000 / (PI * v.d), f: 'n = vc · 1000 / (π · d)' },
    { out: 'vc', ins: ['n', 'd'], fn: v => PI * v.d * v.n / 1000, f: 'vc = π · d · n / 1000' },
    { out: 'd', ins: ['vc', 'n'], fn: v => v.vc * 1000 / (PI * v.n), f: 'd = vc · 1000 / (π · n)' }
  ];
  const RULES_RA = [
    { out: 'Ra', ins: ['Rz'], fn: v => v.Rz / RZ_RA, f: 'Ra ≈ Rz / 3,9 (theoretisches Profil)' },
    { out: 'Rz', ins: ['Ra'], fn: v => v.Ra * RZ_RA, f: 'Rz ≈ 3,9 · Ra (theoretisches Profil)' }
  ];
  const RULES_FEED = [
    { out: 'vf', ins: ['f', 'n'], fn: v => v.f * v.n, f: 'vf = f · n' },
    { out: 'f', ins: ['vf', 'n'], fn: v => v.vf / v.n, f: 'f = vf / n' },
    { out: 'n', ins: ['vf', 'f'], fn: v => v.vf / v.f, f: 'n = vf / f' }
  ];
  W.RULES = {
    // Fräsen: der Vorschub je Zahn fz bestimmt die Rillen (theoretisch, alle Schneiden gleich hoch)
    mill: RULES_BASE.concat(RULES_RA, [
      { out: 'f', ins: ['fz', 'z'], fn: v => v.fz * v.z, f: 'f = fz · z' },
      { out: 'fz', ins: ['f', 'z'], fn: v => v.f / v.z, f: 'fz = f / z' }
    ], RULES_FEED, [
      { out: 'Rz', ins: ['fz', 'r'], fn: v => v.fz * v.fz / (8 * v.r) * 1000, f: 'Rz = fz² / (8 · r) · 1000' },
      { out: 'fz', ins: ['Rz', 'r'], fn: v => Math.sqrt(8 * v.r * v.Rz / 1000), f: 'fz = √(8 · r · Rz / 1000)' },
      { out: 'r', ins: ['fz', 'Rz'], fn: v => v.fz * v.fz * 1000 / (8 * v.Rz), f: 'r = fz² · 1000 / (8 · Rz)' },
      { out: 'Q', ins: ['ae', 'ap', 'vf'], fn: v => v.ae * v.ap * v.vf / 1000, f: 'Q = ae · ap · vf / 1000' },
      { out: 'vf', ins: ['Q', 'ae', 'ap'], fn: v => v.Q * 1000 / (v.ae * v.ap), f: 'vf = Q · 1000 / (ae · ap)' }
    ]),
    drill: RULES_BASE.concat(RULES_FEED, [
      { out: 'Q', ins: ['d', 'vf'], fn: v => PI * v.d * v.d / 4 * v.vf / 1000, f: 'Q = π · d² / 4 · vf / 1000' }
    ]),
    turn: RULES_BASE.concat(RULES_RA, RULES_FEED, [
      { out: 'Rz', ins: ['f', 'r'], fn: v => v.f * v.f / (8 * v.r) * 1000, f: 'Rz = f² / (8 · r) · 1000' },
      { out: 'f', ins: ['Rz', 'r'], fn: v => Math.sqrt(8 * v.r * v.Rz / 1000), f: 'f = √(8 · r · Rz / 1000)' },
      { out: 'r', ins: ['f', 'Rz'], fn: v => v.f * v.f * 1000 / (8 * v.Rz), f: 'r = f² · 1000 / (8 · Rz)' },
      { out: 'Q', ins: ['vc', 'ap', 'f'], fn: v => v.vc * v.ap * v.f, f: 'Q = vc · ap · f' },
      { out: 'ap', ins: ['Q', 'vc', 'f'], fn: v => v.Q / (v.vc * v.f), f: 'ap = Q / (vc · f)' }
    ])
  };
  W.SOLVE_VARS = {
    mill: ['d', 'z', 'r', 'vc', 'n', 'fz', 'f', 'vf', 'Rz', 'Ra', 'ae', 'ap', 'Q'],
    drill: ['d', 'vc', 'n', 'f', 'vf', 'Q'],
    turn: ['d', 'r', 'vc', 'n', 'f', 'vf', 'Rz', 'Ra', 'ap', 'Q']
  };
  // given: {Name: Zahl}. Liefert alle Werte, die Rechenschritte, welche Eingaben hinter jedem Wert stecken (deps) und Widersprüche
  W.solve = function (mode, given) {
    const rules = W.RULES[mode];
    const val = {}, deps = {}, how = {}, steps = [];
    Object.keys(given).forEach(k => { if (given[k] > 0) { val[k] = given[k]; deps[k] = [k]; } });
    let changed = true;
    while (changed) {
      changed = false;
      for (const r of rules) {
        if (val[r.out] != null || !r.ins.every(k => val[k] != null)) continue;
        const x = r.fn(val);
        if (!(x > 0) || !isFinite(x)) continue;
        val[r.out] = x;
        deps[r.out] = [...new Set(r.ins.flatMap(k => deps[k]))];
        how[r.out] = r;
        steps.push({ out: r.out, rule: r, val: x });
        changed = true;
      }
    }
    // Widerspruch: eine Formel, bei der alle Werte bekannt sind, ohne dass sie zum Rechnen benutzt wurde, geht nicht auf
    const clash = [];
    rules.forEach(r => {
      if (val[r.out] == null || how[r.out] === r || !r.ins.every(k => val[k] != null)) return;
      const x = r.fn(val);
      if (Math.abs(x - val[r.out]) > 0.005 * Math.max(Math.abs(x), Math.abs(val[r.out]))) clash.push({ rule: r, want: x, have: val[r.out] });
    });
    return { val, deps, how, steps, clash };
  };

  // ================================================================
  // Rauheit
  // ================================================================
  // Rauheitsklassen nach ISO 1302 (N1 bis N12) mit Ra in µm
  W.N_CLASSES = [['N12', 50], ['N11', 25], ['N10', 12.5], ['N9', 6.3], ['N8', 3.2], ['N7', 1.6], ['N6', 0.8], ['N5', 0.4], ['N4', 0.2], ['N3', 0.1], ['N2', 0.05], ['N1', 0.025]];
  // Erreichbare Mittenrauwerte Ra in µm (Richtwerte, üblicher Bereich)
  W.PROCESS_RA = [['Sägen', 6.3, 50], ['Brennschneiden', 12.5, 50], ['Hobeln, Stoßen', 1.6, 25], ['Bohren', 1.6, 12.5], ['Fräsen', 0.8, 12.5], ['Drehen', 0.4, 12.5], ['Senken', 1.6, 6.3], ['Reiben', 0.4, 3.2], ['Räumen', 0.4, 3.2], ['Funkenerodieren', 0.8, 6.3], ['Gleitschleifen', 0.2, 1.6], ['Rundschleifen', 0.1, 1.6], ['Flachschleifen', 0.1, 1.6], ['Honen', 0.05, 0.4], ['Läppen', 0.025, 0.2], ['Polieren', 0.012, 0.1]];
  // Theoretische Rautiefe beim Drehen: Rth = f² / (8 · r), Ra ≈ f² / (31,2 · r) (f und r in mm, Ergebnis in µm)
  W.roughTurn = (f, r) => ({ Rth: r6(f * f / (8 * r) * 1000), RaTh: r6(f * f / (31.2 * r) * 1000) });
  // Größter Vorschub für eine gewünschte Rautiefe Rz (µm) mit Eckenradius r (mm)
  W.feedForRz = (Rz, r) => Math.sqrt(8 * r * Rz / 1000);
  W.feedForRa = (Ra, r) => Math.sqrt(31.2 * r * Ra / 1000);
  W.nClass = ra => { const c = W.N_CLASSES.find(x => Math.abs(x[1] - ra) < 1e-9); return c ? c[0] : null; };

  // ================================================================
  // Gewicht
  // ================================================================
  // Dichte in g/cm³ (= kg/dm³)
  W.DENSITY = [['Stahl', 7.85], ['Edelstahl 1.4301', 7.9], ['Edelstahl 1.4404', 8.0], ['Gusseisen GJL', 7.2], ['Aluminium', 2.7], ['Messing', 8.5], ['Kupfer', 8.96], ['Bronze', 8.8], ['Titan', 4.5], ['Zink', 7.13], ['POM', 1.41], ['PA 6', 1.14], ['PE-HD', 0.95], ['PTFE', 2.2], ['PEEK', 1.31], ['PMMA (Plexiglas)', 1.19]];
  // Querschnitt in mm² je Form
  W.SHAPES = {
    rund: { name: 'Rundstab', fields: [['d', 'Durchmesser d']], area: v => PI * v.d * v.d / 4 },
    rohr: { name: 'Rohr', fields: [['D', 'Außendurchmesser D'], ['s', 'Wanddicke s']], area: v => v.s * 2 < v.D ? PI / 4 * (v.D * v.D - Math.pow(v.D - 2 * v.s, 2)) : NaN },
    flach: { name: 'Flach, Platte', fields: [['b', 'Breite b'], ['h', 'Dicke h']], area: v => v.b * v.h },
    vier: { name: 'Vierkant', fields: [['a', 'Kantenlänge a']], area: v => v.a * v.a },
    sechs: { name: 'Sechskant', fields: [['s', 'Schlüsselweite s']], area: v => Math.sqrt(3) / 2 * v.s * v.s },
    winkel: { name: 'Winkel', fields: [['a', 'Schenkel a'], ['b', 'Schenkel b'], ['t', 'Dicke t']], area: v => v.t < Math.min(v.a, v.b) ? v.t * (v.a + v.b - v.t) : NaN }
  };
  W.weight = function (shape, vals, L, rho) {
    const sh = W.SHAPES[shape];
    if (!sh) return { ok: false, error: 'Form wählen.' };
    for (const [k, l] of sh.fields) if (!(vals[k] > 0)) return { ok: false, error: `Gib ${l} ein.` };
    if (!(rho > 0)) return { ok: false, error: 'Gib die Dichte ein.' };
    const A = sh.area(vals);
    if (!(A > 0)) return { ok: false, error: 'Die Maße passen nicht zusammen. Die Wand oder Dicke ist zu groß.' };
    const perM = A * rho / 1000;            // kg je Meter: mm² · g/cm³ / 1000
    const res = { ok: true, A, perM };
    if (L > 0) res.m = perM * L / 1000;
    return res;
  };

  // ================================================================
  // Dreieck
  // ================================================================
  const rad = x => x * PI / 180, deg = x => x * 180 / PI;
  // Rechtwinklig, Winkel γ = 90° gegenüber c. Zwei Angaben, davon mindestens eine Seite.
  W.rightTriangle = function (v) {
    let { a, b, c, al, be } = v;
    const given = ['a', 'b', 'c', 'al', 'be'].filter(k => v[k] != null);
    if (given.length < 2) return { ok: false, error: 'Gib zwei Werte ein, mindestens eine Seite.' };
    if (given.length > 2) return { ok: false, error: 'Gib genau zwei Werte ein. Lass die anderen Felder leer.' };
    if (al != null && be != null) return { ok: false, error: 'Mit zwei Winkeln ist die Größe offen. Gib eine Seite und einen Winkel ein.' };
    if ([a, b, c].some(x => x != null && !(x > 0))) return { ok: false, error: 'Seiten müssen größer als 0 sein.' };
    if ([al, be].some(x => x != null && !(x > 0 && x < 90))) return { ok: false, error: 'Die Winkel α und β liegen zwischen 0° und 90°.' };
    if (be != null) al = 90 - be;
    if (al != null) {
      const s = Math.sin(rad(al)), co = Math.cos(rad(al)), t = Math.tan(rad(al));
      if (a != null) { c = a / s; b = a / t; } else if (b != null) { a = b * t; c = b / co; } else { a = c * s; b = c * co; }
    } else {
      if (a != null && b != null) c = Math.hypot(a, b);
      else if (a != null && c != null) { if (a >= c) return { ok: false, error: 'Die Hypotenuse c muss die längste Seite sein.' }; b = Math.sqrt(c * c - a * a); }
      else { if (b >= c) return { ok: false, error: 'Die Hypotenuse c muss die längste Seite sein.' }; a = Math.sqrt(c * c - b * b); }
      al = deg(Math.atan2(a, b));
    }
    be = 90 - al;
    return { ok: true, a, b, c, al, be, ga: 90, A: a * b / 2, U: a + b + c, h: a * b / c };
  };
  // Beliebiges Dreieck aus drei Angaben: SSS, SWS (Winkel zwischen den Seiten), WSW
  W.triangle = function (mode, v) {
    let a, b, c, al, be, ga;
    if (mode === 'SSS') {
      ({ a, b, c } = v);
      if (![a, b, c].every(x => x > 0)) return { ok: false, error: 'Gib alle drei Seiten ein.' };
      if (a + b <= c || a + c <= b || b + c <= a) return { ok: false, error: 'Mit diesen Seiten gibt es kein Dreieck: Zwei Seiten zusammen müssen länger sein als die dritte.' };
      al = deg(Math.acos((b * b + c * c - a * a) / (2 * b * c)));
      be = deg(Math.acos((a * a + c * c - b * b) / (2 * a * c)));
      ga = 180 - al - be;
    } else if (mode === 'SWS') {
      ({ b, c, al } = v);
      if (!(b > 0 && c > 0)) return { ok: false, error: 'Gib die Seiten b und c ein.' };
      if (!(al > 0 && al < 180)) return { ok: false, error: 'Der Winkel α liegt zwischen 0° und 180°.' };
      a = Math.sqrt(b * b + c * c - 2 * b * c * Math.cos(rad(al)));
      be = deg(Math.acos(Math.max(-1, Math.min(1, (a * a + c * c - b * b) / (2 * a * c)))));
      ga = 180 - al - be;
    } else if (mode === 'WSW') {
      ({ c, al, be } = v);
      if (!(c > 0)) return { ok: false, error: 'Gib die Seite c ein.' };
      if (!(al > 0 && be > 0 && al + be < 180)) return { ok: false, error: 'α und β müssen zusammen kleiner als 180° sein.' };
      ga = 180 - al - be;
      a = c * Math.sin(rad(al)) / Math.sin(rad(ga));
      b = c * Math.sin(rad(be)) / Math.sin(rad(ga));
    } else return { ok: false, error: 'Art wählen.' };
    const s = (a + b + c) / 2;
    return { ok: true, a, b, c, al, be, ga, A: Math.sqrt(Math.max(0, s * (s - a) * (s - b) * (s - c))), U: a + b + c };
  };

  // Kegel (Drehen): drei von D, d, L, Einstellwinkel a (halber Kegelwinkel) gegeben, der vierte wird gerechnet
  W.cone = function (v) {
    let { D, d, L, a } = v;
    const given = ['D', 'd', 'L', 'a'].filter(k => v[k] != null);
    if (given.length !== 3) return { ok: false, error: given.length < 3 ? 'Gib drei der vier Werte ein.' : 'Gib nur drei Werte ein, der vierte wird gerechnet.' };
    if (a != null && !(a > 0 && a < 90)) return { ok: false, error: 'Der Einstellwinkel liegt zwischen 0° und 90°.' };
    if ([D, d, L].some(x => x != null && !(x >= 0))) return { ok: false, error: 'Maße dürfen nicht negativ sein.' };
    const t = a != null ? Math.tan(rad(a)) : null;
    if (D == null) D = d + 2 * L * t;
    else if (d == null) { d = D - 2 * L * t; if (d < -1e-9) return { ok: false, error: 'Mit diesem Winkel und dieser Länge läuft der Kegel vorher in die Spitze aus.' }; d = Math.max(0, d); }
    else if (L == null) { if (!(D > d)) return { ok: false, error: 'D muss größer als d sein.' }; L = (D - d) / (2 * t); }
    else { if (!(D > d) || !(L > 0)) return { ok: false, error: 'D muss größer als d sein und L größer als 0.' }; a = deg(Math.atan((D - d) / (2 * L))); }
    const C = (D - d) / L;
    return { ok: true, D, d, L, a, full: 2 * a, C, ratio: C > 0 ? 1 / C : Infinity, dx: (D - d) / 2 };
  };
  // Lochkreis: Bohrungen gleichmäßig auf einem Teilkreis, Startwinkel ab +X, gegen den Uhrzeigersinn positiv
  W.boltCircle = function ({ D, n, start = 0, cx = 0, cy = 0, cw = false }) {
    if (!(D > 0)) return { ok: false, error: 'Gib den Teilkreisdurchmesser ein.' };
    if (!(n >= 1 && n <= 360 && Number.isInteger(n))) return { ok: false, error: 'Gib die Anzahl der Bohrungen als ganze Zahl ein.' };
    const R = D / 2, step = 360 / n, pts = [];
    for (let i = 0; i < n; i++) {
      const w = start + (cw ? -1 : 1) * i * step, r0 = rad(w);
      const x = cx + R * Math.cos(r0), y = cy + R * Math.sin(r0);
      pts.push({ i: i + 1, w: ((w % 360) + 360) % 360, x: Math.abs(x) < 5e-10 ? 0 : x, y: Math.abs(y) < 5e-10 ? 0 : y });
    }
    return { ok: true, R, step, chord: n > 1 ? D * Math.sin(rad(180 / n)) : 0, pts };
  };
  // Bohrerspitze: Länge der Spitze bei Spitzenwinkel sigma
  W.drillTip = (d, sigma = 118) => d / 2 / Math.tan(rad(sigma / 2));

  // ================================================================
  // Gleitschleifen (Trowalisieren)
  // ================================================================
  // Schüttdichte der Schleifkörper in kg/l (Richtwerte)
  W.MEDIA = [
    { id: 'ker', name: 'Keramik', rho: 1.5, use: 'Entgraten und Schleifen von Stahl, Edelstahl und Guss. Grob bis fein je nach Körnung.' },
    { id: 'kun', name: 'Kunststoff', rho: 1.1, use: 'Weiche Metalle wie Aluminium, Messing, Zink. Glättet und entgratet, ohne Kanten stark zu verrunden.' },
    { id: 'por', name: 'Porzellan, Polierkörper', rho: 1.4, use: 'Glätten und Vorpolieren, fast ohne Abtrag.' },
    { id: 'sta', name: 'Stahl (Kugeln, Stifte)', rho: 4.6, use: 'Glanzverdichten (Polieren durch Andrücken), kein Abtrag.' },
    { id: 'org', name: 'Organisch (Nussschale, Maiskolben)', rho: 0.7, use: 'Trocknen und Trockenpolieren.' }
  ];
  // Mischungsverhältnis Teile zu Schleifkörpern nach Volumen (Richtwerte)
  W.MIX = [
    { id: 'grob', name: 'Grob entgraten', parts: 1, media: 3, note: 'robuste Teile, kurze Zeit' },
    { id: 'fein', name: 'Fein schleifen, glätten', parts: 1, media: 5, note: 'normale Teile' },
    { id: 'pol', name: 'Polieren', parts: 1, media: 8, note: 'Oberfläche soll glänzen' },
    { id: 'emp', name: 'Empfindliche Teile', parts: 1, media: 10, note: 'Teile dürfen sich nicht berühren' }
  ];
  // Füllung des Arbeitsbehälters: fill Anteil (0,7 bis 0,9 üblich), mix aus W.MIX, rho Schüttdichte in kg/l
  W.trowal = function (V, fill, mixId, mediaId) {
    const mix = W.MIX.find(x => x.id === mixId), med = W.MEDIA.find(x => x.id === mediaId);
    if (!(V > 0)) return { ok: false, error: 'Gib das Volumen des Arbeitsbehälters ein.' };
    if (!(fill > 0 && fill <= 1)) return { ok: false, error: 'Die Füllhöhe liegt zwischen 0 und 100 %.' };
    if (!mix || !med) return { ok: false, error: 'Verhältnis und Schleifkörper wählen.' };
    const Vf = V * fill, Vp = Vf * mix.parts / (mix.parts + mix.media), Vm = Vf - Vp;
    return { ok: true, Vf, Vp, Vm, mMedia: Vm * med.rho, mix, med };
  };

  // ================================================================
  // Form und Lage: alle Symbole nach ISO 1101
  // ================================================================
  W.GDT = [
    { id: 'geradheit', group: 'Form', name: 'Geradheit', datum: false, what: 'Eine Linie oder Achse muss zwischen zwei parallelen Geraden (oder in einem Zylinder, wenn Ø davor steht) im Abstand t liegen.' },
    { id: 'ebenheit', group: 'Form', name: 'Ebenheit', datum: false, what: 'Die Fläche muss zwischen zwei parallelen Ebenen im Abstand t liegen.' },
    { id: 'rundheit', group: 'Form', name: 'Rundheit', datum: false, what: 'Jeder Querschnitt muss zwischen zwei konzentrischen Kreisen liegen, deren Radien sich um t unterscheiden.' },
    { id: 'zylinderform', group: 'Form', name: 'Zylinderform', datum: false, what: 'Die Mantelfläche muss zwischen zwei koaxialen Zylindern liegen, deren Radien sich um t unterscheiden.' },
    { id: 'linienform', group: 'Form oder Lage', name: 'Linienform', datum: 'optional', what: 'Jeder Schnitt der Fläche muss zwischen zwei Linien liegen, die Kreise mit Ø t entlang der Sollform einhüllen. Mit Bezug wird daraus eine Lagetoleranz.' },
    { id: 'profil', group: 'Form oder Lage', name: 'Flächenform', datum: 'optional', what: 'Die Fläche muss zwischen zwei Flächen liegen, die Kugeln mit Ø t entlang der Sollform einhüllen. Das ist auch das Werkzeug der ISO 22081. Mit Bezug wird daraus eine Lagetoleranz.' },
    { id: 'parallelitaet', group: 'Richtung', name: 'Parallelität', datum: true, what: 'Fläche oder Achse muss zwischen zwei Ebenen im Abstand t liegen, die parallel zum Bezug sind.' },
    { id: 'rechtwinkligkeit', group: 'Richtung', name: 'Rechtwinkligkeit', datum: true, what: 'Fläche oder Achse muss zwischen zwei Ebenen im Abstand t liegen, die rechtwinklig zum Bezug sind.' },
    { id: 'neigung', group: 'Richtung', name: 'Neigung', datum: true, what: 'Fläche oder Achse muss zwischen zwei Ebenen im Abstand t liegen, die im theoretisch genauen Winkel zum Bezug stehen.' },
    { id: 'position', group: 'Ort', name: 'Position', datum: 'meist', what: 'Achse oder Fläche muss in einer Zone der Breite t (mit Ø: in einem Zylinder Ø t) um die theoretisch genaue Lage liegen. Die Maße dazu stehen im Kästchen.' },
    { id: 'koaxialitaet', group: 'Ort', name: 'Koaxialität, Konzentrizität', datum: true, what: 'Die Achse (oder der Mittelpunkt) muss in einem Zylinder (Kreis) Ø t liegen, dessen Achse die Bezugsachse ist.' },
    { id: 'symmetrie', group: 'Ort', name: 'Symmetrie', datum: true, what: 'Die Mittelebene muss zwischen zwei Ebenen im Abstand t liegen, die symmetrisch zur Bezugsmittelebene liegen.' },
    { id: 'rundlauf', group: 'Lauf', name: 'Lauf (Rund- und Planlauf)', datum: true, what: 'Bei einer Umdrehung um die Bezugsachse darf die Messuhr an jeder Stelle höchstens t schwanken.' },
    { id: 'gesamtlauf', group: 'Lauf', name: 'Gesamtlauf', datum: true, what: 'Wie Lauf, aber die Messuhr fährt beim Drehen über die ganze Fläche. Die Schwankung über alles darf höchstens t sein.' }
  ];

  // ================================================================
  // Schnellsuche
  // ================================================================
  // Suchbare Bereiche: Seite und Reiter
  W.MENU = [
    { page: 'tol', sec: 'iso', title: 'ISO-Toleranz', kw: 'iso 286 toleranz bohrung welle it grundabmaß h7 g6' },
    { page: 'tol', sec: 'fit', title: 'Passung', kw: 'passung passungen einheitsbohrung einheitswelle spiel übermaß' },
    { page: 'tol', sec: 'gen', title: 'Allgemeintoleranzen', kw: 'allgemeintoleranz iso 2768 freimaß freimaße 22081 fmcv' },
    { page: 'tol', sec: 'ang', title: 'Winkeltoleranz', kw: 'winkeltoleranz winkel 2768' },
    { page: 'tol', sec: 'geo', title: 'Form und Lage', kw: 'form lage ebenheit geradheit rundheit position parallelität rechtwinkligkeit lauf 2768-2' },
    { page: 'tol', sec: 'gdt', title: 'Symbole Form und Lage', kw: 'symbol symbole 1101 toleranzrahmen' },
    { page: 'tol', sec: 'chain', title: 'Maßkette', kw: 'maßkette kette worst case' },
    { page: 'tol', sec: 'foto', title: 'Foto einer Zeichnung', kw: 'foto zeichnung kamera erkennen' },
    { page: 'cut', sec: 'mill', title: 'Fräsen', kw: 'fräsen fräser messerkopf schnittgeschwindigkeit drehzahl vorschub fz vf vc zahn platten oberfläche' },
    { page: 'cut', sec: 'drill', title: 'Bohren', kw: 'bohren bohrer vorschub drehzahl' },
    { page: 'cut', sec: 'turn', title: 'Drehen', kw: 'drehen drehmeißel schneidplatte vorschub drehzahl' },
    { page: 'cut', sec: 'cutref', title: 'Richtwerte Schnittdaten', kw: 'richtwerte schnittdaten werkstoff hss hartmetall vorschub rauheit oberfläche drehzahl' },
    { page: 'cut', sec: 'roughtab', title: 'Rauheit', kw: 'rauheit oberfläche ra rz n7 rautiefe' },
    { page: 'cut', sec: 'trow', title: 'Trowalisieren', kw: 'trowalisieren gleitschleifen entgraten schleifkörper vibrator' },
    { page: 'thread', sec: 'thread', title: 'Gewinde', kw: 'gewinde metrisch feingewinde kernloch kernlochbohrer steigung rohrgewinde unc unf trapez' },
    { page: 'thread', sec: 'sw', title: 'Schlüsselweite', kw: 'schlüsselweite sw innensechskant inbus sechskant durchgangsbohrung senkung kopf schraube 4762 912 933' },
    { page: 'thread', sec: 'torque', title: 'Drehmoment', kw: 'anziehdrehmoment anzugsmoment drehmoment nm 8.8 10.9 12.9 vdi 2230' },
    { page: 'geom', sec: 'tri', title: 'Dreieck', kw: 'dreieck winkel pythagoras sinus kosinus hypotenuse trigonometrie schräge' },
    { page: 'geom', sec: 'cone', title: 'Kegel', kw: 'kegel konus kegelwinkel verjüngung' },
    { page: 'geom', sec: 'bolt', title: 'Lochkreis', kw: 'lochkreis teilkreis bohrbild koordinaten' },
    { page: 'geom', sec: 'weight', title: 'Gewicht', kw: 'gewicht masse dichte kg rundstab rohr platte flach' },
    { page: 'info', sec: 'info', title: 'Info', kw: 'info hilfe darstellung dunkel hell über' }
  ];


  // Liefert Treffer: direkte Werte (Gewinde, ISO-Toleranz, Passung, Schlüsselweite, Rauheitsklasse) und passende Bereiche
  W.search = function (q) {
    const raw = String(q || '').trim();
    if (!raw) return [];
    const out = [];
    const s = raw.replace(/\s+/g, ' ');
    // Gewinde
    if (/^(m|tr|g)\s*\d|unc|unf|^#\d|^\d+\/\d+\s*-\s*\d+/i.test(s)) {
      const t = W.parseThread(s);
      if (t.ok) out.push({ kind: 'thread', page: 'thread', q: t.name, title: `Gewinde ${t.name}`, sub: threadSub(t) });
    }
    // Schlüsselweite: SW13 oder „sw 13“
    let m = /^sw\s*(\d+(?:[.,]\d+)?)$/i.exec(s);
    if (m) {
      const sw = parseFloat(m[1].replace(',', '.'));
      const hits = [];
      SIZES.forEach((d, i) => {
        if (W.SW_ISO[i] === sw) hits.push(`M${T.fmt(d)} Sechskant ISO`);
        if (W.SW_DIN[i] === sw && W.SW_DIN[i] !== W.SW_ISO[i]) hits.push(`M${T.fmt(d)} Sechskant DIN`);
        if (W.SW_4762[i] === sw) hits.push(`M${T.fmt(d)} Zylinderkopf Innensechskant`);
      });
      out.push({ kind: 'sw', page: 'thread', sec: 'swtab', q: '', title: `Schlüsselweite ${T.fmt(sw)}`, sub: hits.length ? hits.join(', ') : 'Keine Schraube mit dieser Schlüsselweite hinterlegt.' });
    }
    // Passung
    if (T.parseFit && /\d/.test(s) && /[a-z]\d.*[a-z]\d/i.test(s)) {
      const p = T.parseFit(s);
      if (!p.error) { const r = T.fitCalc(p.N, p.hole, p.shaft); if (r.ok) out.push({ kind: 'fit', page: 'tol', sec: 'fit', hole: `${T.fmt(p.N)}${p.hole.letter}${p.hole.grade}`, shaft: `${p.shaft.letter}${p.shaft.grade}`, title: `Passung ${T.fmt(p.N)} ${p.hole.letter}${p.hole.grade}/${p.shaft.letter}${p.shaft.grade}`, sub: { spiel: 'Spielpassung', uebergang: 'Übergangspassung', press: 'Übermaßpassung' }[r.type] }); }
    }
    // ISO-Toleranz
    if (T.parseIso && /^\d/.test(s)) {
      const p = T.parseIso(s);
      if (!p.error) { const r = T.isoTol(p.N, p.letter, p.grade); if (r.ok) out.push({ kind: 'iso', page: 'tol', sec: 'iso', q: `${T.fmt(p.N)}${p.letter}${p.grade}`, title: `ISO-Toleranz ${T.fmt(p.N)} ${r.cls}`, sub: `${T.umS(r.upper)} / ${T.umS(r.lower)} µm · ${T.mm(r.min)} bis ${T.mm(r.max)} mm` }); }
    }
    // Rauheitsklasse
    m = /^n\s*(\d{1,2})$/i.exec(s);
    if (m) { const c = W.N_CLASSES.find(x => x[0] === 'N' + m[1]); if (c) out.push({ kind: 'rough', page: 'cut', sec: 'roughtab', title: `Rauheitsklasse ${c[0]}`, sub: `Ra ${T.fmt(c[1])} µm` }); }
    // Bereiche nach Stichwort
    const low = s.toLowerCase();
    W.MENU.forEach(it => {
      if (it.title.toLowerCase().includes(low) || it.kw.split(' ').some(w => w.startsWith(low) || (low.length >= 4 && w.includes(low)))) out.push({ kind: 'page', page: it.page, sec: it.sec, title: it.title, sub: 'öffnen' });
    });
    return out;
  };
  function threadSub(t) {
    if (t.type === 'G') return `Steigung ${T.fmt(t.P, 0, 3)} mm (${t.tpi} Gänge/Zoll)${t.tap ? ' · Kernloch ' + T.fmt(t.tap) + ' mm' : ''}`;
    if (t.type === 'Tr') return `Steigung ${T.fmt(t.P)} mm · Kernloch Mutter ${T.fmt(t.D1)} mm`;
    return `Steigung ${T.fmt(t.P, 0, 3)} mm · Kernloch ${T.fmt(t.tap)} mm`;
  }
  W.threadSub = threadSub;
})(typeof window !== 'undefined' ? window : globalThis);
