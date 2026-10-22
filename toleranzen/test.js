// Prüft den Rechenkern gegen bekannte Werte aus ISO 286-2 und ISO 2768 (node toleranzen/test.js)
require('./tables.js');
require('./calc.js');
const T = globalThis.TOL;
let fails = 0, count = 0;
function eq(name, got, want) {
  count++;
  if (JSON.stringify(got) !== JSON.stringify(want)) { fails++; console.log('FEHLER', name, 'ist', got, 'soll', want); }
}

// ISO 286-2: [Angabe, oberes Abmaß, unteres Abmaß] in µm
const iso = [
  ['10H8', 22, 0], ['30k5', 11, 2], ['25g6', -7, -20], ['25f7', -20, -41], ['25h6', 0, -13], ['25js6', 6.5, -6.5],
  ['25js7', 10, -10], ['40js7', 12, -12], ['100js9', 43, -43], ['5js11', 37, -37], ['15js8', 13, -13],
  ['25k6', 15, 2], ['25m6', 21, 8], ['25n6', 28, 15], ['25p6', 35, 22], ['25r6', 41, 28], ['25s6', 48, 35],
  ['50r6', 50, 34], ['60r6', 60, 41], ['60s6', 72, 53], ['100r6', 73, 51], ['100s6', 93, 71], ['200s6', 151, 122],
  ['25e8', -40, -73], ['25d9', -65, -117], ['8H7', 15, 0], ['30H7', 21, 0], ['30H11', 130, 0],
  ['25K7', 6, -15], ['25M7', 0, -21], ['25N7', -7, -28], ['25P7', -14, -35], ['25K6', 2, -11], ['25N6', -11, -24],
  ['25P6', -18, -31], ['25K8', 10, -23], ['25M8', 4, -29], ['25N8', -3, -36], ['25K5', 1, -8],
  ['15K7', 6, -12], ['5K7', 3, -9], ['8K7', 5, -10], ['8M7', 0, -15], ['5M7', 0, -12],
  ['300M6', -9, -41], ['60R7', -30, -60], ['60S7', -42, -72], ['25R7', -20, -41], ['25S7', -27, -48],
  ['25F8', 53, 20], ['25G7', 28, 7], ['25E9', 92, 40], ['25D10', 149, 65], ['25JS7', 10, -10],
  ['2K7', 0, -10], ['2M7', -2, -12], ['2N7', -4, -14], ['2P7', -6, -16], ['2N9', -4, -29], ['25N9', 0, -52],
  ['25K9', 0, -52], ['25M9', -8, -60], ['25P8', -22, -55], ['2k6', 6, 0], ['25k8', 33, 0], ['25k3', 4, 0],
  ['500h6', 0, -40], ['2h18', 0, -1400], ['400H7', 57, 0], ['401H7', 63, 0], ['30h01', 0, -0.6],
  ['120g6', -12, -34], ['120f7', -36, -71], ['80m6', 30, 11], ['80n6', 39, 20], ['80p6', 51, 32]
];
iso.forEach(([s, up, lo]) => {
  const r = T.isoFromString(s);
  eq(s, r.ok ? [r.upper, r.lower] : r.error, [up, lo]);
});

// Parser
eq('parse Ø 30 k5', T.parseIso('Ø 30 k5').letter, 'k');
eq('parse 20,5 JS 6', [T.parseIso('20,5 JS 6').N, T.parseIso('20,5 JS 6').letter], [20.5, 'JS']);
eq('parse Js6 ist Bohrung', T.parseIso('20Js6').letter, 'JS');
eq('parse falscher Buchstabe', !!T.parseIso('20w6').error, true);
eq('parse zwei Buchstaben', [T.parseIso('8 cd7').letter, T.parseIso('30ZA7').letter, T.parseIso('30Zc7').letter], ['cd', 'ZA', 'ZC']);
// Alle Grundabmaße a bis zc: Werte aus ISO 286-2 [Angabe, oben, unten] in µm
[['50a11', -320, -480], ['25b11', -160, -290], ['30c11', -110, -240], ['45c11', -130, -290], ['5cd7', -46, -58], ['8ef6', -18, -27], ['4fg5', -6, -11],
 ['25j6', 9, -4], ['40j7', 15, -10], ['2j8', 8, -6], ['300j5', 7, -16], ['25t6', 54, 41], ['45t6', 70, 54], ['20u6', 54, 41], ['35u6', 76, 60], ['16v6', 50, 39], ['12x6', 51, 40],
 ['25J7', 12, -9], ['100J8', 34, -20], ['2J6', 2, -4], ['40C11', 280, 120], ['60A11', 530, 340], ['20B11', 290, 160], ['20U7', -33, -54], ['30T7', -33, -54], ['50T7', -45, -70],
 ['450zc9', 2555, 2400], ['2za7', 42, 32], ['2ZA7', -32, -42], ['100X8', -178, -232]
].forEach(([s, up, lo]) => { const r = T.isoFromString(s); eq('ISO ' + s, r.ok ? [r.upper, r.lower] : r.error, [up, lo]); });
['20t6', '1a11', '1B11', '20cd6', '20j9', '20j8', '20J9', '10v6', '15y6', '2ZA2'].forEach(x => eq('nicht festgelegt ' + x, T.isoFromString(x).ok, false));
eq('parse IT19', !!T.parseIso('20h19').error, true);
eq('parse ohne Nennmaß', !!T.parseIso('H7').error, true);
eq('Nennmaß 600', T.isoFromString('600H7').ok, false);
eq('K2 nicht genormt', T.isoFromString('25K2').ok, false);
eq('1h18 gesperrt', T.isoFromString('1h18').ok, false);
eq('1h13 erlaubt', T.isoFromString('1h13').ok, true);
eq('Toleranzmitte 4 Stellen', T.fmt(T.isoFromString('25f7').mid, 3, 4), '24,9695');
eq('parseNum', [T.parseNum('0,5'), T.parseNum(' -0,013 '), T.parseNum('−2'), T.parseNum('12 mm'), T.parseNum('abc')].map(String), ['0.5', '-0.013', '-2', '12', 'NaN']);

// Passungen
const fit = (s) => { const r = T.fitFromString(s); return r.ok ? [r.type, r.maxC, r.minC] : r.error; };
eq('30H7/g6', fit('30H7/g6'), ['spiel', 41, 7]);
eq('30g6/H7', fit('30g6/H7'), ['spiel', 41, 7]);
eq('30 h7 g6', fit('30 h7 g6'), ['spiel', 41, 7]);
eq('25H7/k6', fit('25H7/k6'), ['uebergang', 19, -15]);
eq('25K7/h6', fit('25K7/h6'), ['uebergang', 19, -15]);
eq('25H7/s6', fit('25H7/s6'), ['press', -14, -48]);
eq('25H7/h6', fit('25H7/h6'), ['spiel', 34, 0]);
const fp = (h, w) => { const r = T.fitFromParts(h, w); return r.ok ? [r.type, r.maxC, r.minC] : 'Fehler'; };
eq('Felder 30H7 + g6', fp('30H7', 'g6'), ['spiel', 41, 7]);
eq('Felder H7 + 30g6', fp('H7', '30g6'), ['spiel', 41, 7]);
eq('Felder 30h7 + 30G6 (Schreibweise)', fp('30h7', '30G6'), ['spiel', 41, 7]);
eq('Felder ohne Nennmaß', fp('H7', 'g6'), 'Fehler');
eq('Felder verschiedene Nennmaße', fp('30H7', '32g6'), 'Fehler');
eq('System EB', T.fitFromString('30H7/g6').system, 'EB');
eq('Gegenstück', T.fitFromString('30H7/g6').equiv, { hole: { letter: 'G', grade: '7' }, shaft: { letter: 'h', grade: '6' } });

// ISO 2768-1
const lin = (N, c, k) => { const r = T.lin2768(N, c, k); return r.ok ? [r.dev, r.max, r.min] : 'err'; };
eq('120 m', lin(120, 'm'), [0.3, 120.3, 119.7]);
eq('121 m', lin(121, 'm'), [0.5, 121.5, 120.5]);
eq('0,5 f', lin(0.5, 'f'), [0.05, 0.55, 0.45]);
eq('3 v', lin(3, 'v'), 'err');
eq('3000 f', lin(3000, 'f'), 'err');
eq('R4 c', lin(4, 'c', 'rad'), [1, 5, 3]);
eq('R10 m', lin(10, 'm', 'rad'), [1, 11, 9]);
eq('Winkel 40 m', T.angle2768(40, 'm', 90).text, '±0° 30′');
eq('Winkel 10 c', T.angle2768(10, 'c').text, '±1° 30′');
eq('Winkel 500 v', T.angle2768(500, 'v').text, '±0° 20′');
eq('Winkel max/min', [T.dm(T.angle2768(40, 'm', 90).maxA), T.dm(T.angle2768(40, 'm', 90).minA)], ['90° 30′', '89° 30′']);

// ISO 2768-2
eq('Ebenheit 120 K', T.geo2768('ebenheit', { len: 120 }, 'm', 'K').value, 0.4);
eq('Geradheit 10 H', T.geo2768('geradheit', { len: 10 }, 'm', 'H').value, 0.02);
eq('Rechtw. 100 L', T.geo2768('rechtwinkligkeit', { len: 100 }, 'm', 'L').value, 0.6);
eq('Rundheit Ø30 mK', T.geo2768('rundheit', { dia: 30 }, 'm', 'K').value, 0.2);
eq('Rundheit Ø30 mH', T.geo2768('rundheit', { dia: 30 }, 'm', 'H').value, 0.1);
eq('Rundheit Ø30 eigene 0,021', T.geo2768('rundheit', { dia: 30, own: 0.021 }, 'm', 'K').value, 0.021);
eq('Parallel. 20/150 mK', T.geo2768('parallelitaet', { dist: 20, len: 150 }, 'm', 'K').value, 0.4);
eq('Parallel. 200/50 mH', T.geo2768('parallelitaet', { dist: 200, len: 50 }, 'm', 'H').value, 1);
eq('Rundlauf L', T.geo2768('rundlauf', {}, 'm', 'L').value, 0.5);

// ISO 22081 und Maßketten
eq('Profil 0,4 vom Bezug', [T.profile22081(50, 0.4, 'bezug').max, T.profile22081(50, 0.4, 'bezug').min], [50.2, 49.8]);
eq('Profil 0,4 zwischen', [T.profile22081(20, 0.4, 'zwischen').max, T.profile22081(20, 0.4, 'zwischen').min], [20.4, 19.6]);
const ch = T.chain([{ valid: true, op: 1, N: 10, up: 0.2, lo: -0.2 }, { valid: true, op: 1, N: 5, up: 0.3, lo: -0.3 }]);
eq('Kette 10±0,2 + 5±0,3', [ch.N, ch.max, ch.min, ch.tol], [15, 15.5, 14.5, 1]);
const ch2 = T.chain([{ valid: true, op: 1, N: 40, up: 0.1, lo: -0.1 }, { valid: true, op: -1, N: 12, up: 0.1, lo: 0 }]);
eq('Kette 40±0,1 − 12+0,1/0', [ch2.N, ch2.max, ch2.min, ch2.tol], [28, 28.1, 27.8, 0.3]);

// Zuschläge = Tabellenwerte Delta aus ISO 286-1
const deltaTable = { 1: [1, 1.5, 1, 3, 4, 6], 5: [1.5, 3, 4, 5, 9, 14], 12: [5, 5, 7, 13, 23, 34] };
Object.entries(deltaTable).forEach(([ri, vals]) => vals.forEach((v, k) => eq(`Delta IT${k + 3} Bereich ${ri}`, T.delta(String(k + 3), +ri), v)));

// Maße aus Zeichnungstext
const pd = T.parseDrawing([
  { text: 'Ø30 H7' }, { text: '120' }, { text: '60 ±0,1' }, { text: 'R5' }, { text: '2x45°' }, { text: '90°' },
  { text: '25 +0,1 -0,05' }, { text: 'Ø20' }, { text: '4x Ø6,6' }, { text: 'M8x1' }, { text: 'Ra 3,2' }, { text: '30H7/g6' },
  { text: 'Allgemeintoleranzen ISO 2768-mK' }, { text: 'Maßstab 1:1  Datum 12.03.2026' }, { text: '120 R5' }, { text: '40 +-0.2' }, { text: '120' }
]);
const lab = pd.items.map(i => i.kind + ':' + i.label);
eq('Foto: Allgemeintoleranz erkannt', pd.general, { ml: 'm', hk: 'K' });
['fit:30 H7/g6', 'iso:Ø30 H7', 'pm:60 ±0,1', 'pm:40 ±0,2', 'ul:25 +0,1/−0,05', 'lin:120', 'lin:Ø20', 'lin:Ø6,6', 'rad:R5', 'fase:2 × 45°', 'ang:90°']
  .forEach(x => eq('Foto erkennt ' + x, lab.includes(x), true));
eq('Foto: 120 nur einmal gelistet, dreimal gezählt', pd.items.filter(i => i.label === '120').length === 1 && pd.items.find(i => i.label === '120').count, 3);
eq('Foto: keine Datums-, Maßstabs-, Gewinde- oder Rauheitszahlen', lab.filter(x => /:(1|12|2026|3,2|8|4)$/.test(x)), []);
eq('Foto: 120 R5 nicht als ISO', lab.includes('iso:120 R5'), false);
const pd2 = T.parseDrawing([{ text: 'Allgemeintoleranzen 1SO 2[768-mK' }, { text: '60 +0,1', conf: 72 }, { text: '— 1', conf: 67 }]);
eq('Foto: verlesenes Schriftfeld', pd2.general, { ml: 'm', hk: 'K' });
eq('Foto: B10 HY als Ø10 H7', T.parseDrawing([{ text: 'B10 HY' }, { text: 'P12 H7' }]).items.map(i => i.label), ['Ø10 H7', 'Ø12 H7']);
eq('Foto: Hilfsmaß in Klammern bleibt', T.parseDrawing([{ text: '(120)' }]).items.map(i => i.label), ['120']);
eq('Foto: Schriftfeld ohne Maße', T.parseDrawing([{ text: 'Datum Ø2.09.2026' }, { text: 'Blatt Ø/2' }]).items.length, 0);
eq('Foto: X 26,6 als Ø6,6', T.parseDrawing([{ text: 'X 26,6' }]).items.map(i => i.label + ':' + !!i.guess), ['Ø6,6:true']);
eq('Foto: -03 als -0,3', T.parseDrawing([{ text: '60 -0,1 -03' }]).items.map(i => i.label), ['60 −0,1/−0,3']);
eq('Foto: Schriftfeld 2768-mi', T.parseDrawing([{ text: 'Allgemeintoleranzen ISO 2768-mi' }]).general, { ml: 'm', hk: null });
eq('Foto: 4x 76,6 als Ø6,6', T.parseDrawing([{ text: '4x 76,6' }]).items.map(i => i.label + ':' + !!i.guess), ['Ø6,6:true']);
const fl = t => T.parseDrawing([{ text: t, conf: 90 }]).items.map(i => i.label);
eq('Foto: 150 bleibt ein Maß', fl('150'), ['150']);
eq('Foto: 150 2768 ist ISO 2768', T.parseDrawing([{ text: 'Allgemeintoleranzen 150 2768-m' }]).general, { ml: 'm', hk: null });
eq('Foto: 2768.mK mit Punkt', T.parseDrawing([{ text: 'Allgemeintoleranzen 1SO 2768.mk' }]).general, { ml: 'm', hk: 'K' });
eq('Foto: Maßlinie am Text', fl('—R8-'), ['R8']);
eq('Foto: Maßlinie zwischen Zahl und Klasse', fl('—B32-H7—'), ['Ø32 H7']);
eq('Foto: RS als R5', fl('RS'), ['R5']);
eq('Foto: gb als g6, 020 als Ø20', fl('020 gb'), ['Ø20 g6']);
eq('Foto: Ø doppelt gelesen', fl('ØD40 H8/f7'), ['Ø40 H8/f7']);
eq('Foto: x als % gelesen', fl('2% D6,6'), ['Ø6,6']);
eq('Foto: 2x 36,6 als Ø6,6', fl('2X 36,6'), ['Ø6,6']);
eq('Foto: ± als 1 gelesen', fl('45 10,2'), ['45 ±0,2']);
eq('Foto: Abmaße mit Minus bleiben', fl('60 -0,1 -0,3'), ['60 −0,1/−0,3']);
eq('Foto: + als ± vermutet', pd2.items.map(i => i.kind + ':' + i.label + ':' + !!i.guess), ['pm:60 ±0,1:true']);

require('./werkstatt.js');
require('./zerspanung.js');
require('./test-werkstatt.js')(T, eq);
{
  const Z = T.Z, rr = (x, d) => Math.round(x * 10 ** d) / 10 ** d;
  Z.MATERIALS.forEach(m => eq('Werkstoff hat Tabelle ' + m.id, !!Z.VC[m.cls] && Z.FEED[m.cls] > 0, true));
  eq('Werkstoff-Kennungen eindeutig', new Set(Z.MATERIALS.map(m => m.id)).size, Z.MATERIALS.length);
  eq('Werkzeug-Kennungen eindeutig', new Set(Z.TOOLS.map(t => t.id)).size, Z.TOOLS.length);
  Object.values(Z.VC).forEach(row => eq('VC-Zeile 11 Spalten', row.length, 11));
  const a = Z.recommend({ mode: 'mill', mat: 'c45', tool: 'vhm', d: 10, op: 'side' });
  eq('VHM Ø10 in C45', [rr(a.vc[1], 0), rr(a.fz[1], 4)], [170, 0.045]);
  const b = Z.recommend({ mode: 'mill', mat: '6082', tool: 'face', d: 80 });
  eq('Messerkopf Alu', [rr(b.vc[1], 0), rr(b.fz[1], 3)], [900, 0.18]);
  eq('Former in Guss ungeeignet', Z.recommend({ mode: 'drill', mat: 'gjl250', tool: 'form', d: 8 }).warn.length, 1);
  const th = T.W.parseThread('M8');
  const c = Z.recommend({ mode: 'drill', mat: 's235', tool: 'tap', thread: th });
  eq('Gewindebohrer f = P', [c.fixedF, c.core], [1.25, 6.8]);
  eq('Gewindeformer Kernloch', Z.recommend({ mode: 'drill', mat: 's235', tool: 'form', thread: th }).core, 7.38);
  const d = Z.recommend({ mode: 'drill', mat: 's235', tool: 'ream', d: 10 });
  eq('Reiben Vorbohrer', d.pre, [9.7, 9.8]);
  const e = Z.recommend({ mode: 'turn', mat: '1.4301', tool: 'tfin' });
  eq('Drehen Schlichten 1.4301', [rr(e.vc[1], 0), e.r], [198, 0.4]);
  eq('Spanverdünnung', [rr(Z.chipThin(1, 10), 3), Z.chipThin(5, 10)], [1.667, 1]);
  eq('Auskragung 3d voll, 5d reduziert', [Z.overhang(3).vc, Z.overhang(5).fz], [1, 0.7]);
  eq('Auskragung senkt Empfehlung', Z.recommend({ mode: 'mill', mat: 'c45', tool: 'vhm', d: 10, L: 50 }).vc[1] < a.vc[1], true);
  eq('Bohrfutter mit VHM warnt', Z.recommend({ mode: 'drill', mat: 's235', tool: 'dvhm', d: 8, holder: 'chuck' }).warn.length, 1);
  eq('Kugel wirksamer Ø', rr(Z.ballDeff(10, 0.3), 3), rr(2 * Math.sqrt(0.3 * 9.7), 3));
  const ml = Z.millLoad({ cls: 'P2', d: 10, z: 4, fz: 0.04, ae: 3, ap: 15, n: 5000, vf: 800 });
  eq('Fräsen Leistung = Q · kc / 60000', rr(ml.Pc, 4), rr(36 * ml.kc / 60000, 4));
  eq('Drehen Leistung', rr(Z.turnLoad({ cls: 'P1', vc: 250, ap: 3, f: 0.3 }).Pc, 3), rr(250 * 3 * 0.3 * Z.kc('P1', 0.3 * Math.sin(85 * Math.PI / 180)) / 60000, 3));
  const dl = Z.millLoad({ cls: 'P2', d: 10, z: 4, fz: 0.04, ae: 3, ap: 15, n: 5000, vf: 800, L: 40, lc: 40 });
  eq('Durchbiegung Biegebalken', rr(dl.defl, 5), rr(0.6 * dl.Fc * Math.pow(40, 3) / (3 * 600000 * Math.PI * Math.pow(8, 4) / 64), 5));
  eq('Maschinengrenze', Z.limit({ n: 15000, vf: 500 }, { nmax: 12000, vfmax: 10000 }).map(x => x.k), ['n']);
}

console.log(`${count - fails} von ${count} Prüfungen bestanden`);
process.exit(fails ? 1 : 0);
