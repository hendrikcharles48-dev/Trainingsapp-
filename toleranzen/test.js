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
  ['500h6', 0, -40], ['1h18', 0, -1400], ['400H7', 57, 0], ['401H7', 63, 0], ['30h01', 0, -0.6],
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
eq('parse falscher Buchstabe', !!T.parseIso('20c6').error, true);
eq('parse IT19', !!T.parseIso('20h19').error, true);
eq('parse ohne Nennmaß', !!T.parseIso('H7').error, true);
eq('Nennmaß 600', T.isoFromString('600H7').ok, false);
eq('K2 nicht genormt', T.isoFromString('25K2').ok, false);
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

if (typeof require !== 'undefined') {
  try { require('./lernen.js'); } catch (e) { console.log('lernen.js fehlt noch'); }
  const L = globalThis.TOL.LEARN;
  if (L) {
    // Jede Aufgabe viele Male erzeugen: Lösung muss ihre eigenen Schritte bestehen
    let gen = 0;
    L.topics.forEach(tp => tp.tasks.forEach(task => {
      for (let n = 0; n < 300; n++) {
        const a = task.make();
        gen++;
        const vals = {};
        a.steps.forEach(s => { vals[s.id] = L.answerString(s); });
        a.steps.forEach(s => {
          const r = L.checkStep(s, vals[s.id], vals, a.steps);
          count++;
          if (r.state !== 'ok') { fails++; console.log('Aufgabe', task.id, s.id, 'Musterlösung falsch bewertet:', r, vals[s.id]); }
        });
        if (!a.solution || !a.solution.length) { fails++; console.log('Aufgabe ohne Lösungsweg', task.id); }
      }
    }));
    console.log('Aufgaben erzeugt:', gen);
  }
}

console.log(`${count - fails} von ${count} Prüfungen bestanden`);
process.exit(fails ? 1 : 0);
