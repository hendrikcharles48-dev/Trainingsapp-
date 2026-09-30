/* Toleranzen – Lerninhalte und Übungsaufgaben.
   Jede Aufgabe besteht aus Schritten. Der Nutzer rechnet selbst, die App prüft nur und zeigt,
   wo es schiefgegangen ist. Der Lösungsweg kommt erst auf Knopfdruck. */
(function (root) {
  'use strict';
  const T = root.TOL;
  const L = T.LEARN = {};
  const f = T.fmt, r6 = T.r6;
  const f3 = x => T.fmt(x, 0, 3);

  // ---------- Zufall mit Startwert: dieselbe Aufgabe lässt sich nach dem Neustart wieder herstellen ----------
  L.rng = function (seed) {
    let a = seed >>> 0;
    const next = () => {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    return {
      next,
      int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
      pick: arr => arr[Math.floor(next() * arr.length)],
      chance: p => next() < p,
      shuffle: arr => { const c = arr.slice(); for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [c[i], c[j]] = [c[j], c[i]]; } return c; }
    };
  };
  L.newSeed = () => Math.floor(Math.random() * 4294967295);

  // ---------- Schritte ----------
  const num = (id, q, ans, o = {}) => Object.assign({ id, kind: 'num', q, ans: r6(ans), unit: 'mm', tol: 1e-6, alts: [] }, o);
  const choice = (id, q, options, ans, o = {}) => Object.assign({ id, kind: 'choice', q, options, ans: String(ans), alts: [] }, o);
  const angle = (id, q, ans, o = {}) => Object.assign({ id, kind: 'angle', q, ans, alts: [] }, o);
  const opts = arr => arr.map(x => Array.isArray(x) ? { v: String(x[0]), l: x[1] } : { v: String(x), l: String(x) });
  const alt = (v, m) => ({ v: typeof v === 'number' ? r6(v) : String(v), m });

  const MSG = {
    range: 'Das ist der Wert aus einem Nachbarbereich. Prüfe den Nennmaßbereich: Die obere Zahl eines Bereichs gehört noch dazu, die untere nicht.',
    rangeHint: 'Such die Zeile, in der das Maß liegt. Bei „über … bis …“ gehört die obere Zahl noch dazu, die untere nicht.',
    itHint: 'Lies in der Tabelle der Grundtoleranzen ab: Zeile Nennmaßbereich, Spalte IT-Grad.',
    linHint: 'Lies in der Tabelle ISO 2768-1 ab: Zeile Nennmaßbereich, Spalte Toleranzklasse.',
    maxHint: 'Höchstmaß ist Nennmaß plus oberes Abmaß. Rechne die µm vorher in mm um.',
    minHint: 'Mindestmaß ist Nennmaß plus unteres Abmaß, bei negativem Abmaß also weniger als das Nennmaß.',
    rangeSel: 'Das ist ein Nachbarbereich. Denk daran: Bei „über … bis …“ gehört die obere Zahl noch dazu, die untere nicht.',
    itcol: 'Das ist der Wert aus einer Nachbarspalte. Prüfe den IT-Grad.',
    cls: 'Das ist der Wert einer anderen Toleranzklasse. Prüfe, in welcher Spalte du abliest.',
    hkl: 'Das ist der Wert einer anderen Klasse (H, K oder L). Prüfe, in welcher Spalte du abliest.',
    half: 'Das ist nur das Grenzabmaß nach einer Seite. Gefragt ist die ganze Toleranzbreite, also Höchstmaß minus Mindestmaß.',
    umToMm: 'Denk daran, µm in mm umzurechnen: 1000 µm sind 1 mm.',
    comma: 'Prüfe die Kommastelle beim Umrechnen: 1 µm sind 0,001 mm.',
    maxUsesUpper: 'Beim Höchstmaß gehört das obere Abmaß dazu.',
    minUsesLower: 'Beim Mindestmaß gehört das untere Abmaß dazu.'
  };

  const close = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol + 1e-9;

  L.parseAngle = function (raw) {
    if (raw == null) return NaN;
    const [d = '', m = ''] = String(raw).split('|');
    if (!d.trim() && !m.trim()) return NaN;
    const D = d.trim() ? T.parseNum(d) : 0, M = m.trim() ? T.parseNum(m) : 0;
    if (!isFinite(D) || !isFinite(M)) return NaN;
    return D * 60 + M;
  };

  L.value = function (step, raw) {
    if (step.kind === 'choice') return raw == null ? '' : String(raw);
    if (step.kind === 'angle') return L.parseAngle(raw);
    let v = T.parseNum(raw);
    if (step.pm && isFinite(v)) v = Math.abs(v);
    return v;
  };

  function check(s, raw, g, steps, res) {
    const empty = raw == null || String(raw).replace('|', '').trim() === '';
    if (empty) return { state: 'empty', msg: 'Hier fehlt noch deine Eingabe.' };
    const v = L.value(s, raw);
    if (s.kind !== 'choice' && !isFinite(v)) return { state: 'wrong', msg: 'Das kann ich nicht als Zahl lesen. Schreib zum Beispiel 0,021 oder 13.' };
    const same = (a, b) => s.kind === 'choice' ? a === b : close(a, b, s.tol);
    if (same(v, s.ans)) {
      let msg = s.okMsg || '';
      if (s.kind === 'angle') { const m = T.parseNum(String(raw).split('|')[1] || '0'); if (m >= 60) msg = 'Stimmt. Üblich ist aber, die Minuten unter 60 zu halten, denn 60 Minuten sind 1 Grad.'; }
      return { state: 'ok', msg };
    }
    const accepted = (s.accept || []).find(a => same(v, a.v));
    if (accepted) return { state: 'ok', msg: accepted.m };
    if (s.follow && s.dep) {
      const bad = s.dep.filter(d => res[d] && res[d].state !== 'ok' && res[d].state !== 'empty');
      if (bad.length) {
        let fv;
        try { fv = s.follow(g); } catch (e) { fv = undefined; }
        const valid = s.kind === 'choice' ? (fv != null && fv !== '') : (typeof fv === 'number' && isFinite(fv));
        if (valid && same(v, s.kind === 'choice' ? String(fv) : r6(fv))) {
          const root = res[bad[0]].root || bad[0];
          const n = steps.findIndex(x => x.id === root) + 1;
          return { state: 'follow', root, msg: `Folgefehler: Mit deinem Wert aus Schritt ${n} hast du hier richtig weitergerechnet. Der eigentliche Fehler steckt in Schritt ${n}.` };
        }
      }
    }
    const answers = [s.ans].concat((s.accept || []).map(a => a.v));
    for (const a of s.alts) if (!answers.some(x => same(x, a.v)) && same(v, a.v)) return { state: 'wrong', msg: a.m };
    if (s.kind === 'num') {
      if (s.ans !== 0 && close(v, -s.ans, s.tol)) return { state: 'wrong', msg: 'Der Betrag stimmt, aber das Vorzeichen nicht.' };
      if (s.unit === 'mm' && s.ans !== 0 && close(v, s.ans * 1000, s.tol * 1000)) return { state: 'wrong', msg: 'Das sieht nach µm aus. Hier ist der Wert in mm gefragt: 1000 µm sind 1 mm.' };
      if (s.unit === 'µm' && s.ans !== 0 && close(v, s.ans / 1000, 1e-7)) return { state: 'wrong', msg: 'Das sieht nach mm aus. Hier ist der Wert in µm gefragt: 1 mm sind 1000 µm.' };
    }
    return { state: 'wrong', msg: s.hint || (s.kind === 'choice' ? 'Diese Auswahl stimmt nicht.' : 'Dieser Wert stimmt nicht.') };
  }

  L.checkAll = function (steps, vals) {
    const res = {};
    const g = id => { const s = steps.find(x => x.id === id); return s ? L.value(s, vals[id]) : NaN; };
    steps.forEach(s => { res[s.id] = check(s, vals[s.id], g, steps, res); });
    return res;
  };
  L.checkStep = (s, raw, vals, steps) => L.checkAll(steps, Object.assign({}, vals, { [s.id]: raw }))[s.id];

  // Nur für die automatischen Tests: die Musterlösung als Eingabetext
  L.answerString = function (s) {
    if (s.kind === 'choice') return s.ans;
    if (s.kind === 'angle') return `${Math.floor(s.ans / 60)}|${s.ans % 60}`;
    return T.fmt(s.ans, 0, 6).replace('−', '-');
  };

  // ---------- gemeinsame Bausteine ----------
  const isoRangeOpts = () => T.RANGES.map((r, i) => ({ v: String(i), l: T.rangeText(i) }));
  const linRangeOpts = () => T.LIN2768.ranges.map((r, i) => ({ v: String(i), l: T.linRangeText(i) }));
  const radRangeOpts = () => T.RAD2768.ranges.map((r, i) => ({ v: String(i), l: T.radRangeText(i) }));
  const strRangeOpts = () => T.STRAIGHT2768.ranges.map((r, i) => ({ v: String(i), l: T.strRangeText(i) }));
  const perpRangeOpts = () => T.PERP2768.ranges.map((r, i) => ({ v: String(i), l: T.perpRangeText(i) }));
  const code = s => `<span class="code">${s}</span>`;
  const mlName = c => `${c} (${T.CLASS_ML[c]})`;

  // Nachbarbereiche als typische Verwechslung
  function rangeSelAlts(idx, N, ranges) {
    const out = [];
    [idx - 1, idx + 1].forEach(j => {
      if (j < 0 || j >= ranges.length) return;
      const onUpper = N === ranges[idx][1] && j === idx + 1;
      out.push(alt(j, onUpper ? `Grenzfall: ${f(N)} mm liegt genau auf einer Bereichsgrenze. Bei „über … bis …“ gehört die obere Zahl noch zum Bereich.` : MSG.rangeSel));
    });
    return out;
  }
  function neighborVals(arr, idx, msg) {
    const out = [];
    [idx - 1, idx + 1].forEach(j => { if (j >= 0 && j < arr.length && arr[j] != null) out.push(alt(arr[j], msg)); });
    return out;
  }
  const otherClassVals = (tab, idx, cls, classes, msg) => classes.filter(c => c !== cls && tab[c][idx] != null).map(c => alt(tab[c][idx], msg));

  // Nennmaße für ISO-Aufgaben (mit Bereichsgrenzen, damit das Ablesen geübt wird)
  const ISO_N = [3, 4, 5, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 25, 28, 30, 32, 35, 36, 40, 45, 48, 50, 55, 60, 63, 65, 70, 75, 80, 85, 90, 100, 110, 120, 125, 140, 150, 160, 180, 200, 220, 240, 250, 280, 300, 315, 320, 350, 400, 420, 450, 500];

  // ================================================================
  // Block 1: Allgemeintoleranzen
  // ================================================================
  const allg = {
    id: 'allg',
    title: 'Allgemeintoleranzen',
    short: 'Die Sammelregel im Schriftfeld für Maße, Form und Lage',
    icon: 'doc',
    praxis: [
      'Du bekommst die Zeichnung für einen Spannhalter aus Aluminium. Zwei Passbohrungen haben ein eigenes Toleranzzeichen, alle anderen Maße stehen einfach so da. Nirgends steht, wie eben die Auflagefläche sein muss oder wie rechtwinklig die Seitenwand zur Grundfläche stehen soll.',
      'Trotzdem darfst du nicht fräsen, wie du willst. Unten rechts im Schriftfeld steht „Allgemeintoleranzen ISO 2768-mK“. Dieser eine Eintrag regelt alles, was auf der Zeichnung nicht einzeln toleriert ist.',
      'Für dich an der Maschine heißt das: Bevor du das erste Werkzeug einwechselst, schaust du ins Schriftfeld. Dann weißt du, wie genau die freien Maße sein müssen und ob eine Fläche nach dem Umspannen noch eben genug ist.'
    ],
    begriffe: [
      ['Allgemeintoleranz', 'Eine Toleranz, die für alle Maße und Formen gilt, die keine eigene Toleranzangabe haben. Sie steht einmal im oder neben dem Schriftfeld.'],
      ['ISO 2768-1 (Kleinbuchstabe)', 'Regelt Längenmaße, Radien, Fasen und Winkel. Klassen f (fein), m (mittel), c (grob) und v (sehr grob). Die Zahlen dazu lernst du im Block Freimaßtoleranzen.'],
      ['ISO 2768-2 (Großbuchstabe)', 'Regelt Form und Lage: Geradheit, Ebenheit, Rechtwinkligkeit, Symmetrie und Lauf. Klassen H (fein), K (mittel) und L (grob). Rundheit und Parallelität ergeben sich über Regeln aus anderen Werten.'],
      ['Formtoleranz', 'Beschreibt die Form eines einzelnen Elements, zum Beispiel wie eben eine Fläche ist. Sie braucht keinen Bezug.'],
      ['Lagetoleranz', 'Beschreibt, wie ein Element zu einem anderen liegt, zum Beispiel wie rechtwinklig eine Wand zur Grundfläche steht. Dafür braucht es einen Bezug.'],
      ['Bezug', 'Das Element, von dem aus gemessen wird. Bei der Allgemeintoleranz ist es meist das längere der beiden Elemente. In der Praxis ist das oft die Fläche, auf der das Teil beim Messen aufliegt.'],
      ['ISO 22081', 'Die neue Norm für Allgemeintoleranzen von 2021 und der Nachfolger von ISO 2768-2. Statt fester Tabellen steht auf der Zeichnung eine allgemeine Profiltoleranz mit Wert und Bezügen, zum Beispiel 0,4 mm zu den Bezügen A, B und C.']
    ],
    merksatz: 'Was nicht am Maß steht, steht im Schriftfeld: Der kleine Buchstabe gilt für die Maße, der große für Form und Lage.',
    extras: [
      {
        t: 'Eselsbrücken', ul: [
          'Erst die Maße, dann die Form: In „mK“ steht der Buchstabe für die Maße vorne, so wie du auch erst auf Maß fräst und danach die Ebenheit prüfst.',
          'H, K, L: H wie hochgenau, K wie klassisch (der Normalfall), L wie locker.',
          'Der Längere ist der Chef: Bei Rechtwinkligkeit und Parallelität ist ohne andere Angabe immer das längere Element der Bezug.',
          'Einzelangabe schlägt Allgemeintoleranz: Steht eine Toleranz am Maß, gilt nur diese.',
          'ISO 22081: Profilwert halbieren, dann weißt du, wie weit jeder Punkt der Fläche von seiner Sollposition abweichen darf.'
        ]
      },
      {
        t: 'So gehst du bei Form und Lage vor', ol: [
          'Im Schriftfeld den Großbuchstaben suchen (H, K oder L).',
          'Klären, um welche Eigenschaft es geht: Geradheit, Ebenheit, Rechtwinkligkeit, Symmetrie oder Lauf.',
          'Die maßgebende Länge bestimmen: bei Ebenheit die längere Seite der Fläche, bei Rechtwinkligkeit den kürzeren Schenkel.',
          'Längenbereich suchen und den Wert ablesen.',
          'Sonderregeln: Rundheit ist so groß wie die Durchmessertoleranz, aber höchstens so groß wie der Rundlauf. Parallelität ist die Maßtoleranz oder die Ebenheit, der größere Wert gilt.'
        ]
      },
      {
        t: 'Die neue Norm ISO 22081', p: [
          'Bei ISO 22081 gibt es keine Tabelle mit festen Zahlen. Auf der Zeichnung steht ein Hinweis auf ISO 22081 und ein Toleranzrahmen mit dem Zeichen für Flächenprofil, einem Wert und Bezugsbuchstaben, zum Beispiel 0,4 mm zu A, B und C.',
          'Das heißt: Jede Fläche ohne eigene Angabe muss in einer 0,4 mm breiten Zone liegen. Die Zone liegt mittig um die Sollfläche. Die Fläche darf also 0,2 mm nach außen und 0,2 mm nach innen abweichen, gemessen von den Bezügen A, B und C aus.',
          'Dazu kann eine allgemeine Größenmaßtoleranz kommen, zum Beispiel ±0,1 mm. Sie gilt für Durchmesser, Nutbreiten und Dicken ohne eigene Angabe.'
        ]
      }
    ],
    figure: 'schriftfeld',
    tables: ['2768-1', '2768-2'],
    tasks: []
  };

  const CONCEPTS = [
    R => ({ q: 'An einem Maß steht 25 ±0,05. Welche Toleranz gilt dafür?', o: ['nur die Angabe am Maß', 'nur die Allgemeintoleranz', 'die größere von beiden'], a: 0, e: 'Eine Toleranz direkt am Maß geht immer vor. Die Allgemeintoleranz gilt nur für das, was nicht einzeln toleriert ist.' }),
    R => { const p = R.pick([['f', 'c'], ['m', 'v'], ['f', 'm'], ['H', 'L'], ['H', 'K'], ['K', 'L']]); const pr = R.shuffle(p); return { q: `Welche Klasse ist genauer: ${pr[0]} oder ${pr[1]}?`, o: pr, a: pr.indexOf(p[0]), e: 'Bei den Maßen ist f (fein) die genaueste Klasse und v (sehr grob) die gröbste. Bei Form und Lage ist H die genaueste und L die gröbste.' }; },
    R => ({ q: 'Braucht die Ebenheit einen Bezug?', o: ['Ja', 'Nein'], a: 1, e: 'Ebenheit ist eine Formtoleranz. Sie beschreibt nur die Fläche selbst und braucht deshalb keinen Bezug.' }),
    R => ({ q: 'Braucht die Parallelität einen Bezug?', o: ['Ja', 'Nein'], a: 0, e: 'Parallelität ist eine Lagetoleranz. Parallel kann etwas nur zu etwas anderem sein, deshalb braucht sie einen Bezug.' }),
    R => ({ q: 'Welches Element ist bei der Rechtwinkligkeit nach Allgemeintoleranz der Bezug?', o: ['das längere', 'das kürzere'], a: 0, e: 'Ohne andere Angabe ist das längere Element der Bezug. Das kürzere wird toleriert.' }),
    R => ({ q: 'Welche Norm arbeitet ohne feste Zahlentabelle, mit einer Profiltoleranz auf der Zeichnung?', o: ['ISO 2768-1', 'ISO 2768-2', 'ISO 22081'], a: 2, e: 'ISO 22081 legt keine festen Zahlen fest. Der Wert der Profiltoleranz steht auf der Zeichnung.' }),
    R => ({ q: 'Hat ISO 2768-2 eine eigene Tabelle für die Position von Bohrungen?', o: ['Ja', 'Nein'], a: 1, e: 'Nein. Die Lage einer Bohrung ergibt sich aus den Freimaßtoleranzen der Abstandsmaße nach ISO 2768-1.' })
  ];

  allg.tasks.push({
    id: 'allg-schriftfeld', title: 'Schriftfeld lesen', desc: 'Welcher Buchstabe gilt wofür?',
    make(R = L.rng(L.newSeed())) {
      const ml = R.pick(['f', 'm', 'c', 'v']), hk = R.pick(['H', 'K', 'L']);
      const things = [['ein Längenmaß von 45 mm', 'k'], ['ein Radius R3', 'k'], ['ein Winkel von 90°', 'k'], ['eine Fase 1 × 45°', 'k'],
        ['die Ebenheit einer Auflagefläche', 'g'], ['die Geradheit einer Kante', 'g'], ['die Rechtwinkligkeit einer Seitenwand', 'g'], ['der Rundlauf eines Absatzes', 'g'], ['die Symmetrie einer Nut', 'g']];
      const th = R.pick(things);
      const cs = R.shuffle(CONCEPTS).slice(0, 2).map(c => c(R));
      const steps = [
        choice('ml', 'Welche Toleranzklasse gilt für Längenmaße, Radien und Winkel?', opts([['f', 'fein (f)'], ['m', 'mittel (m)'], ['c', 'grob (c)'], ['v', 'sehr grob (v)']]), ml,
          { alts: [], hint: 'Für Maße gilt der Kleinbuchstabe im Schriftfeld.' }),
        choice('hk', 'Welche Klasse gilt für Form und Lage?', opts([['H', 'H (fein)'], ['K', 'K (mittel)'], ['L', 'L (grob)']]), hk, { hint: 'Für Form und Lage gilt der Großbuchstabe.' }),
        choice('which', `Welcher Buchstabe gilt für ${th[0]}?`, opts([['k', `der Kleinbuchstabe ${ml}`], ['g', `der Großbuchstabe ${hk}`]]), th[1],
          { hint: 'Überleg, ob es um ein Maß geht (ISO 2768-1) oder um Form und Lage (ISO 2768-2).' })
      ];
      cs.forEach((c, i) => steps.push(choice('c' + i, c.q, c.o.map((x, j) => ({ v: String(j), l: x })), c.a)));
      return {
        prompt: `<p>Im Schriftfeld deiner Zeichnung steht: ${code('Allgemeintoleranzen ISO 2768-' + ml + hk)}</p><p>Beantworte die Fragen Schritt für Schritt.</p>`,
        steps,
        solution: [
          { t: 'Schriftfeld lesen', h: `ISO 2768-${ml}${hk}: Der Kleinbuchstabe ${ml} (${T.CLASS_ML[ml]}) gilt nach ISO 2768-1 für Längenmaße, Radien, Fasen und Winkel. Der Großbuchstabe ${hk} (${T.CLASS_HKL[hk]}) gilt nach ISO 2768-2 für Form und Lage.` },
          { t: 'Maß oder Form?', h: `${th[0][0].toUpperCase() + th[0].slice(1)}: ${th[1] === 'k' ? `Das ist ein Maß, also gilt der Kleinbuchstabe ${ml}.` : `Das ist eine Form- oder Lageeigenschaft, also gilt der Großbuchstabe ${hk}.`}` }
        ].concat(cs.map(c => ({ t: c.q, h: `Richtig ist: <b>${c.o[c.a]}</b>. ${c.e}` })))
      };
    }
  });

  allg.tasks.push({
    id: 'allg-ebenheit', title: 'Geradheit und Ebenheit', desc: 'Maßgebende Länge finden und Wert ablesen',
    make(R = L.rng(L.newSeed())) {
      const hk = R.pick(['H', 'K', 'L']), ml = R.pick(['f', 'm', 'c']);
      const S = T.STRAIGHT2768;
      const variant = R.pick(['rect', 'rect', 'round', 'line']);
      const sizes = [8, 10, 12, 18, 25, 30, 35, 45, 60, 80, 100, 110, 120, 150, 200, 250, 300, 320, 400, 600, 800, 1000, 1200];
      let a = R.pick(sizes), b = R.pick(sizes);
      while (b === a) b = R.pick(sizes);
      let prompt, len, lenQ, lenAlts = [], prop;
      if (variant === 'rect') {
        prop = 'Ebenheit'; len = Math.max(a, b);
        prompt = `<p>Du hast eine rechteckige Auflagefläche von ${f(a)} mm × ${f(b)} mm geplant. Im Schriftfeld steht ${code('ISO 2768-' + ml + hk)}.</p><p>Wie eben muss die Fläche sein?</p>`;
        lenQ = 'Welche Länge zählt für die Tabelle? (mm)';
        lenAlts = [alt(Math.min(a, b), 'Bei der Ebenheit zählt die längere Seite der Fläche.'), alt(a + b, 'Nicht zusammenzählen. Bei der Ebenheit zählt die längere Seite der Fläche.')];
      } else if (variant === 'round') {
        prop = 'Ebenheit'; len = a;
        prompt = `<p>Du hast die runde Stirnfläche eines Flansches mit Ø${f(a)} mm plangefräst. Im Schriftfeld steht ${code('ISO 2768-' + ml + hk)}.</p><p>Wie eben muss die Fläche sein?</p>`;
        lenQ = 'Welche Länge zählt für die Tabelle? (mm)';
        lenAlts = [alt(a / 2, 'Bei einer runden Fläche zählt der ganze Durchmesser, nicht der Radius.')];
      } else {
        prop = 'Geradheit'; len = a;
        prompt = `<p>An einer gefrästen Leiste ist eine Kante ${f(a)} mm lang. Im Schriftfeld steht ${code('ISO 2768-' + ml + hk)}.</p><p>Wie gerade muss die Kante sein?</p>`;
        lenQ = 'Welche Länge zählt für die Tabelle? (mm)';
      }
      const idx = T.strIdx(len), val = S[hk][idx];
      const altsVal = neighborVals(S[hk], idx, MSG.range).concat(otherClassVals(S, idx, hk, ['H', 'K', 'L'], MSG.hkl));
      if (variant === 'rect') { const j = T.strIdx(Math.min(a, b)); if (j !== idx) altsVal.unshift(alt(S[hk][j], 'Das ist der Wert für die kürzere Seite. Bei der Ebenheit zählt die längere Seite.')); }
      return {
        prompt,
        steps: [
          num('len', lenQ, len, { alts: lenAlts }),
          choice('range', 'In welchem Längenbereich liegt diese Länge?', strRangeOpts(), idx, { hint: MSG.rangeHint, alts: rangeSelAlts(idx, len, S.ranges), dep: ['len'], follow: g => T.strIdx(g('len')) }),
          num('tol', `${prop}stoleranz in mm`, val, { alts: altsVal, dep: ['range'], follow: g => S[hk][+g('range')] })
        ],
        solution: [
          { t: 'Maßgebende Länge', h: variant === 'rect' ? `Bei der Ebenheit zählt die längere Seite der Fläche: <b>${f(len)} mm</b>.` : variant === 'round' ? `Bei einer runden Fläche zählt der Durchmesser: <b>${f(len)} mm</b>.` : `Bei der Geradheit zählt die Länge der Linie: <b>${f(len)} mm</b>.` },
          { t: 'Längenbereich', h: `${f(len)} mm liegt im Bereich <b>${T.strRangeText(idx)}</b>.` },
          { t: 'Ablesen', h: `ISO 2768-2, Tabelle Geradheit und Ebenheit, Zeile ${T.strRangeText(idx)}, Spalte ${hk}: <b>${f3(val)} mm</b>.` }
        ]
      };
    }
  });

  allg.tasks.push({
    id: 'allg-rechtwinklig', title: 'Rechtwinkligkeit', desc: 'Bezug, kürzerer Schenkel, Tabellenwert',
    make(R = L.rng(L.newSeed())) {
      const hk = R.pick(['H', 'K', 'L']), ml = R.pick(['f', 'm', 'c']);
      const P = T.PERP2768;
      const lens = [20, 35, 50, 80, 100, 120, 150, 200, 250, 300, 350, 500, 800, 1000, 1200];
      let base = R.pick(lens), wall = R.pick(lens);
      while (wall === base) wall = R.pick(lens);
      const shorter = Math.min(base, wall), longer = Math.max(base, wall);
      const idx = T.perpIdx(shorter), val = P[hk][idx];
      const altsVal = neighborVals(P[hk], idx, MSG.range).concat(otherClassVals(P, idx, hk, ['H', 'K', 'L'], MSG.hkl));
      const jl = T.perpIdx(longer);
      if (jl !== idx) altsVal.unshift(alt(P[hk][jl], 'Das ist der Wert für den längeren Schenkel. Für die Tabelle zählt der kürzere.'));
      const bezugAns = base > wall ? 'base' : 'wall';
      return {
        prompt: `<p>Du fräst einen Winkel. Die Grundfläche ist ${f(base)} mm lang, die Seitenwand ${f(wall)} mm hoch. Beide sollen rechtwinklig zueinander stehen, eine eigene Angabe gibt es nicht. Im Schriftfeld steht ${code('ISO 2768-' + ml + hk)}.</p>`,
        steps: [
          choice('bezug', 'Welches Element ist der Bezug?', opts([['base', `die Grundfläche (${f(base)} mm)`], ['wall', `die Seitenwand (${f(wall)} mm)`]]), bezugAns, { hint: 'Ohne andere Angabe ist das längere Element der Bezug.' }),
          num('len', 'Welche Länge zählt für die Tabelle? (mm)', shorter, { alts: [alt(longer, 'Für die Tabelle zählt der kürzere Schenkel, also das tolerierte Element.')] }),
          choice('range', 'In welchem Längenbereich liegt diese Länge?', perpRangeOpts(), idx, { hint: MSG.rangeHint, alts: rangeSelAlts(idx, shorter, P.ranges), dep: ['len'], follow: g => T.perpIdx(g('len')) }),
          num('tol', 'Rechtwinkligkeitstoleranz in mm', val, { alts: altsVal, dep: ['range'], follow: g => P[hk][+g('range')] })
        ],
        solution: [
          { t: 'Bezug', h: `Das längere Element ist der Bezug: <b>${base > wall ? 'die Grundfläche' : 'die Seitenwand'}</b> mit ${f(longer)} mm.` },
          { t: 'Maßgebende Länge', h: `Toleriert wird das kürzere Element, seine Länge zählt: <b>${f(shorter)} mm</b>.` },
          { t: 'Längenbereich', h: `${f(shorter)} mm liegt im Bereich <b>${T.perpRangeText(idx)}</b>.` },
          { t: 'Ablesen', h: `ISO 2768-2, Tabelle Rechtwinkligkeit, Zeile ${T.perpRangeText(idx)}, Spalte ${hk}: <b>${f3(val)} mm</b>.` }
        ]
      };
    }
  });

  allg.tasks.push({
    id: 'allg-rundheit', title: 'Rundheit', desc: 'Durchmessertoleranz gegen Rundlauf abwägen',
    make(R = L.rng(L.newSeed())) {
      const hk = R.pick(['H', 'K', 'L']), ml = R.pick(['f', 'm', 'c']);
      const d = R.pick([4, 5, 8, 10, 12, 16, 20, 25, 30, 32, 40, 50, 63, 80, 100, 120, 125, 160, 200, 250]);
      const own = R.chance(0.3) ? R.pick([0.01, 0.02, 0.03, 0.05, 0.1]) : null;
      let dt, dtHint;
      const alts1 = [];
      if (own) {
        dt = r6(2 * own);
        alts1.push(alt(own, MSG.half));
      } else {
        const r = T.lin2768(d, ml, 'len');
        dt = r.tol;
        alts1.push(alt(r.dev, MSG.half));
        ['f', 'm', 'c', 'v'].filter(c => c !== ml).forEach(c => { const x = T.lin2768(d, c, 'len'); if (x.ok) alts1.push(alt(x.tol, MSG.cls)); });
      }
      const run = T.RUN2768[hk], ans = Math.min(dt, run);
      return {
        prompt: `<p>Du fräst einen Zapfen mit ${own ? `Ø${f(d)} ±${f(own)} mm` : `Ø${f(d)} mm ohne eigene Toleranz`} zirkular. Im Schriftfeld steht ${code('ISO 2768-' + ml + hk)}.</p><p>Wie groß ist die Rundheitstoleranz?</p>`,
        steps: [
          num('dt', 'Toleranzbreite des Durchmessers in mm', dt, { alts: alts1 }),
          num('run', 'Rundlauftoleranz nach ISO 2768-2 in mm', run, { alts: ['H', 'K', 'L'].filter(c => c !== hk).map(c => alt(T.RUN2768[c], MSG.hkl)) }),
          num('rund', 'Rundheitstoleranz in mm', ans, { dep: ['dt', 'run'], follow: g => Math.min(g('dt'), g('run')), alts: [alt(Math.max(dt, run), 'Du hast den größeren Wert genommen. Bei der Rundheit gilt der kleinere der beiden.')] })
        ],
        solution: [
          { t: 'Regel', h: 'Rundheit hat keine eigene Tabelle. Sie ist so groß wie die Toleranz des Durchmessers, aber höchstens so groß wie die Rundlauftoleranz.' },
          { t: 'Durchmessertoleranz', h: own ? `Der Durchmesser ist mit ±${f(own)} mm toleriert. Toleranzbreite: ${f(own)} mm + ${f(own)} mm = <b>${f3(dt)} mm</b>.` : `Ø${f(d)} ohne eigene Toleranz: ISO 2768-1, Klasse ${ml}, ergibt ±${f(dt / 2)} mm. Toleranzbreite: <b>${f3(dt)} mm</b>.` },
          { t: 'Rundlauf', h: `ISO 2768-2, Tabelle Lauf, Spalte ${hk}: <b>${f3(run)} mm</b>.` },
          { t: 'Kleineren Wert nehmen', h: `${f3(dt)} mm oder ${f3(run)} mm: Es gilt <b>${f3(ans)} mm</b>.` }
        ]
      };
    }
  });

  allg.tasks.push({
    id: 'allg-parallel', title: 'Parallelität', desc: 'Maßtoleranz oder Ebenheit, der größere Wert gilt',
    make(R = L.rng(L.newSeed())) {
      const hk = R.pick(['H', 'K', 'L']), ml = R.pick(['f', 'm', 'c']);
      const h = R.pick([5, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 80, 100, 120, 150]);
      const len = R.pick([40, 60, 80, 100, 120, 150, 200, 250, 300, 400, 500, 800]);
      const r = T.lin2768(h, ml, 'len');
      const mt = r.tol;
      const idx = T.strIdx(len), eb = T.STRAIGHT2768[hk][idx];
      const ans = Math.max(mt, eb);
      const altsMt = [alt(r.dev, MSG.half)];
      ['f', 'm', 'c', 'v'].filter(c => c !== ml).forEach(c => { const x = T.lin2768(h, c, 'len'); if (x.ok) altsMt.push(alt(x.tol, MSG.cls)); });
      return {
        prompt: `<p>Eine Platte ist ${f(h)} mm dick und ${f(len)} mm lang. Die Dicke hat keine eigene Toleranz. Im Schriftfeld steht ${code('ISO 2768-' + ml + hk)}.</p><p>Wie parallel müssen Ober- und Unterseite zueinander sein?</p>`,
        steps: [
          num('mt', `Maßtoleranz der Dicke ${f(h)} mm (Toleranzbreite in mm)`, mt, { alts: altsMt }),
          num('eb', `Ebenheitstoleranz für ${f(len)} mm Länge in mm`, eb, { alts: neighborVals(T.STRAIGHT2768[hk], idx, MSG.range).concat(otherClassVals(T.STRAIGHT2768, idx, hk, ['H', 'K', 'L'], MSG.hkl)) }),
          num('par', 'Parallelitätstoleranz in mm', ans, { dep: ['mt', 'eb'], follow: g => Math.max(g('mt'), g('eb')), alts: [alt(Math.min(mt, eb), 'Du hast den kleineren Wert genommen. Bei der Parallelität gilt der größere der beiden.')] }),
          choice('art', 'Was für eine Toleranz ist die Parallelität?', opts([['form', 'Formtoleranz, ohne Bezug'], ['lage', 'Lagetoleranz, mit Bezug']]), 'lage', { hint: 'Parallel kann etwas nur zu etwas anderem sein.' })
        ],
        solution: [
          { t: 'Regel', h: 'Parallelität hat keine eigene Tabelle. Sie ist so groß wie die Maßtoleranz des Abstands oder die Ebenheitstoleranz, der größere Wert gilt.' },
          { t: 'Maßtoleranz', h: `Dicke ${f(h)} mm, ISO 2768-1 Klasse ${ml}: ±${f(r.dev)} mm, Toleranzbreite <b>${f3(mt)} mm</b>.` },
          { t: 'Ebenheit', h: `Länge ${f(len)} mm, Bereich ${T.strRangeText(idx)}, Spalte ${hk}: <b>${f3(eb)} mm</b>.` },
          { t: 'Größeren Wert nehmen', h: `${f3(mt)} mm oder ${f3(eb)} mm: Es gilt <b>${f3(ans)} mm</b>.` },
          { t: 'Art', h: 'Parallelität ist eine <b>Lagetoleranz</b> (Richtungstoleranz) und braucht einen Bezug. Bei der Allgemeintoleranz ist das die längere Fläche.' }
        ]
      };
    }
  });

  allg.tasks.push({
    id: 'allg-22081', title: 'ISO 22081: Profiltoleranz', desc: 'Zone halbieren, Grenzmaße ausrechnen',
    make(R = L.rng(L.newSeed())) {
      const t = R.pick([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 1, 1.2, 1.6, 2]);
      const N = R.pick([8, 12, 15, 20, 25, 30, 40, 45, 50, 60, 75, 80, 100, 120, 150]);
      const half = r6(t / 2);
      const halfStep = num('half', 'Wie weit darf eine Fläche nach jeder Seite abweichen? (mm)', half, { alts: [alt(t, 'Das ist die ganze Zonenbreite. Die Zone liegt mittig um die Sollfläche, also halbieren.')] });
      if (R.chance(0.5)) {
        return {
          prompt: `<p>Auf der Zeichnung steht: Allgemeintoleranz nach ${code('ISO 22081')}, Flächenprofil ${code(f(t) + ' mm')} zu den Bezügen A, B und C.</p><p>Eine Fläche liegt nach Zeichnung ${f(N)} mm von Bezug A entfernt. In welchen Grenzen darf der Abstand liegen?</p>`,
          steps: [
            halfStep,
            num('max', 'Höchstmaß des Abstands in mm', N + half, { dep: ['half'], follow: g => N + g('half'), alts: [alt(N + t, 'Nur die halbe Zonenbreite kommt dazu, denn die Zone liegt mittig.')] }),
            num('min', 'Mindestmaß des Abstands in mm', N - half, { dep: ['half'], follow: g => N - g('half'), alts: [alt(N - t, 'Nur die halbe Zonenbreite geht ab, denn die Zone liegt mittig.')] })
          ],
          solution: T.profile22081(N, t, 'bezug').steps
        };
      }
      return {
        prompt: `<p>Eine Wand ist nach Zeichnung ${f(N)} mm dick. Beide Seiten haben keine eigene Angabe, es gilt die allgemeine Profiltoleranz ${code(f(t) + ' mm')} nach ISO 22081. Keine der beiden Seiten ist ein Bezug.</p><p>Wie dick darf die Wand höchstens und mindestens werden?</p>`,
        steps: [
          halfStep,
          num('dev', 'Um wie viel kann sich die Wanddicke im ungünstigsten Fall ändern? (mm, nach oben oder unten)', t, { dep: ['half'], follow: g => 2 * g('half'), alts: [alt(half, 'Das gilt nur für eine Fläche. Beide Seiten dürfen wandern, im ungünstigsten Fall in entgegengesetzte Richtungen.')] }),
          num('max', 'Höchstmaß der Wanddicke in mm', N + t, { dep: ['dev'], follow: g => N + g('dev') }),
          num('min', 'Mindestmaß der Wanddicke in mm', N - t, { dep: ['dev'], follow: g => N - g('dev') })
        ],
        solution: T.profile22081(N, t, 'zwischen').steps
      };
    }
  });

  allg.tasks.push({
    id: 'allg-position', title: 'Lage einer Bohrung', desc: 'Ohne Positionstoleranz gelten die Abstandsmaße',
    make(R = L.rng(L.newSeed())) {
      const ml = R.pick(['f', 'm', 'c']), hk = R.pick(['H', 'K', 'L']);
      const vals = [4, 6, 8, 12, 15, 20, 25, 30, 35, 45, 60, 80, 100, 120, 125, 150, 200, 300, 400, 450];
      const x = R.pick(vals); let y = R.pick(vals);
      while (y === x) y = R.pick(vals);
      const rx = T.lin2768(x, ml), ry = T.lin2768(y, ml);
      return {
        prompt: `<p>Eine Bohrung ist von der linken Kante ${f(x)} mm und von der unteren Kante ${f(y)} mm entfernt bemaßt, ohne Toleranzangabe und ohne Positionstoleranz. Im Schriftfeld steht ${code('ISO 2768-' + ml + hk)}.</p><p>Wie genau muss die Bohrungsmitte liegen?</p>`,
        steps: [
          choice('which', 'Welcher Buchstabe aus dem Schriftfeld gilt hier?', opts([['ml', `${ml} (Maße, ISO 2768-1)`], ['hk', `${hk} (Form und Lage, ISO 2768-2)`]]), 'ml', { alts: [alt('hk', 'ISO 2768-2 hat keine Tabelle für die Position. Die Lage ergibt sich aus den beiden Abstandsmaßen.')] }),
          num('dx', `Grenzabmaß für ${f(x)} mm (± in mm)`, rx.dev, { pm: true, alts: neighborVals(T.LIN2768[ml], rx.idx, MSG.range).concat(otherClassVals(T.LIN2768, rx.idx, ml, ['f', 'm', 'c', 'v'], MSG.cls)) }),
          num('dy', `Grenzabmaß für ${f(y)} mm (± in mm)`, ry.dev, { pm: true, alts: neighborVals(T.LIN2768[ml], ry.idx, MSG.range).concat(otherClassVals(T.LIN2768, ry.idx, ml, ['f', 'm', 'c', 'v'], MSG.cls)) }),
          num('wx', 'Wie breit ist die erlaubte Zone von links nach rechts? (mm)', 2 * rx.dev, { dep: ['dx'], follow: g => 2 * g('dx'), alts: [alt(rx.dev, 'Die Mitte darf nach links und nach rechts wandern. Die Zone ist also doppelt so breit wie das Grenzabmaß.')] }),
          num('wy', 'Wie hoch ist die erlaubte Zone von unten nach oben? (mm)', 2 * ry.dev, { dep: ['dy'], follow: g => 2 * g('dy'), alts: [alt(ry.dev, 'Die Mitte darf nach oben und nach unten wandern. Die Zone ist also doppelt so hoch wie das Grenzabmaß.')] })
        ],
        solution: [
          { t: 'Welche Norm?', h: 'ISO 2768-2 hat keine Tabelle für die Position. Es gelten die Freimaßtoleranzen der beiden Abstandsmaße nach ISO 2768-1, also der <b>Kleinbuchstabe</b>.' },
          { t: 'Abstand links', h: `${f(x)} mm liegt im Bereich ${rx.rangeText}, Klasse ${ml}: <b>±${f(rx.dev)} mm</b>.` },
          { t: 'Abstand unten', h: `${f(y)} mm liegt im Bereich ${ry.rangeText}, Klasse ${ml}: <b>±${f(ry.dev)} mm</b>.` },
          { t: 'Form der Zone', h: `Die Bohrungsmitte darf in einem Rechteck von <b>${f3(2 * rx.dev)} mm</b> mal <b>${f3(2 * ry.dev)} mm</b> liegen. Das ist keine echte Positionstoleranz, sondern nur die Folge der beiden Freimaße. Mit einer Positionstoleranz auf der Zeichnung wäre die Zone ein Kreis um die genaue Sollposition.` }
        ]
      };
    }
  });

  // ================================================================
  // Block 2: Freimaßtoleranzen
  // ================================================================
  const frei = {
    id: 'frei',
    title: 'Freimaßtoleranzen',
    short: 'Maße ohne eigene Toleranz: Längen, Radien, Fasen, Winkel',
    icon: 'ruler',
    praxis: [
      'Du fräst eine Grundplatte mit 120 mm Länge. Auf der Zeichnung steht nur „120“, kein Plus und kein Minus.',
      'Exakt 120,000 mm schafft niemand: Der Fräser nutzt sich ab, die Spindel wird warm, und jedes Messmittel hat eine Grenze. Wie viel Abweichung erlaubt ist, sagt die Freimaßtoleranz. Steht im Schriftfeld „ISO 2768-m“, darf die Platte ±0,3 mm abweichen. Alles zwischen 119,7 mm und 120,3 mm ist in Ordnung.',
      'Genauer zu fräsen als nötig kostet nur Zeit: langsamerer Vorschub, zusätzlicher Schlichtgang, öfter messen. Wer die Freimaßtoleranz kennt, weiß, wann er aufhören kann.'
    ],
    begriffe: [
      ['Freimaß', 'Ein Maß ohne eigene Toleranzangabe. Für Freimaße gilt die Allgemeintoleranz nach ISO 2768-1.'],
      ['Nennmaß', 'Das Maß, das auf der Zeichnung steht, hier 120 mm.'],
      ['Grenzabmaß', 'Wie weit du vom Nennmaß abweichen darfst, zum Beispiel ±0,3 mm.'],
      ['Höchstmaß und Mindestmaß', 'Das größte und das kleinste erlaubte Maß, zusammen die Grenzmaße. Hier 120,3 mm und 119,7 mm.'],
      ['Toleranz', 'Der Abstand zwischen Höchstmaß und Mindestmaß. Hier 120,3 mm minus 119,7 mm = 0,6 mm.'],
      ['Istmaß', 'Das Maß, das du am fertigen Teil misst.'],
      ['Toleranzklassen', 'f (fein), m (mittel), c (grob) und v (sehr grob). Die Buchstaben kommen aus dem Englischen: fine, medium, coarse, very coarse.'],
      ['Nennmaßbereich', 'Die Tabelle ist in Bereiche eingeteilt. „Über 30 bis 120“ heißt: 30 mm gehört nicht mehr dazu, 120 mm schon.']
    ],
    merksatz: 'Kein Plus, kein Minus am Maß? Dann gilt die Freimaßtoleranz aus dem Schriftfeld, und die obere Bereichsgrenze gehört immer dazu.',
    extras: [
      {
        t: 'Eselsbrücken', ul: [
          'Material drauf heißt Nacharbeit, Material weg heißt Ausschuss. Ist eine Platte zu breit, fräst du noch mal nach. Ist sie zu schmal, ist sie Schrott. Bei einer Tasche oder Nut ist es genau umgekehrt.',
          'Je größer das Teil, desto größer die erlaubte Abweichung. Ein langes Teil dehnt sich bei Wärme stärker und ist schwerer genau zu messen.',
          'Radien und Fasen haben eine eigene, kleine Tabelle: bis 3 mm, bis 6 mm und darüber.',
          'Beim Winkel zählt der kürzere Schenkel. Je kürzer der Schenkel, desto mehr Grad sind erlaubt, weil ein Winkelfehler an einem kurzen Schenkel kaum auffällt.',
          'Toleranzen addieren sich in einer Maßkette immer, auch wenn ein Maß abgezogen wird.'
        ]
      },
      {
        t: 'So gehst du vor', ol: [
          'Klasse im Schriftfeld suchen: f, m, c oder v.',
          'Passende Tabelle wählen: Längenmaße, Radien und Fasen oder Winkel.',
          'Nennmaßbereich suchen. Die obere Grenze gehört dazu.',
          'Grenzabmaß ablesen.',
          'Höchstmaß ist Nennmaß plus Abmaß, Mindestmaß ist Nennmaß minus Abmaß.'
        ]
      }
    ],
    figure: 'zahlenstrahl',
    tables: ['2768-1'],
    tasks: []
  };

  const LIN_POOL = [0.8, 1.5, 2, 2.5, 4, 5, 8, 12, 16, 25, 28, 35, 42, 50, 64, 80, 95, 110, 125, 150, 180, 250, 320, 380, 410, 500, 650, 800, 950, 1100, 1500, 1900, 2200, 3000, 3800];
  const LIN_EDGE = [0.5, 3, 6, 30, 120, 400, 1000, 2000, 4000];
  const linOk = (N, c) => { const r = T.lin2768(N, c, 'len'); return r.ok; };

  frei.tasks.push({
    id: 'frei-bereich', title: 'Nennmaßbereich finden', desc: 'Drei Maße in die richtige Zeile einordnen',
    make(R = L.rng(L.newSeed())) {
      const edge = R.pick(LIN_EDGE);
      const others = R.shuffle(LIN_POOL).slice(0, 2);
      const list = R.shuffle([edge].concat(others));
      const steps = list.map((N, i) => {
        const idx = T.linIdx(N);
        return choice('r' + i, `${f(N)} mm liegt im Bereich …`, linRangeOpts(), idx, { hint: MSG.rangeHint, alts: rangeSelAlts(idx, N, T.LIN2768.ranges) });
      });
      return {
        prompt: `<p>Auf deiner Zeichnung stehen diese Längenmaße ohne Toleranz: ${list.map(n => code(f(n) + ' mm')).join(' ')}</p><p>Ordne jedes Maß dem richtigen Nennmaßbereich der Tabelle ISO 2768-1 zu.</p>`,
        steps,
        solution: list.map(N => { const i = T.linIdx(N); return { t: `${f(N)} mm`, h: `liegt im Bereich <b>${T.linRangeText(i)}</b>.${N === T.LIN2768.ranges[i][1] && i < 7 ? ' Es liegt genau auf der Grenze, und die obere Zahl gehört noch dazu.' : ''}${N === 0.5 ? ' 0,5 mm ist der Anfang der Tabelle und gehört zum ersten Bereich.' : ''}` }; })
      };
    }
  });

  frei.tasks.push({
    id: 'frei-abmass', title: 'Grenzabmaß ablesen', desc: 'Zeile und Spalte in der Tabelle finden',
    make(R = L.rng(L.newSeed())) {
      let N, cls;
      do { N = R.chance(0.3) ? R.pick(LIN_EDGE) : R.pick(LIN_POOL); cls = R.pick(['f', 'm', 'c', 'v']); } while (!linOk(N, cls));
      const r = T.lin2768(N, cls, 'len');
      return {
        prompt: `<p>Ein Maß von ${code(f(N) + ' mm')} hat keine eigene Toleranz. Im Schriftfeld steht ${code('ISO 2768-' + cls)}.</p>`,
        steps: [
          choice('range', 'In welchem Nennmaßbereich liegt das Maß?', linRangeOpts(), r.idx, { hint: MSG.rangeHint, alts: rangeSelAlts(r.idx, N, T.LIN2768.ranges) }),
          num('dev', 'Grenzabmaß (± in mm)', r.dev, { pm: true, hint: MSG.linHint, dep: ['range'], follow: g => T.LIN2768[cls][+g('range')], alts: neighborVals(T.LIN2768[cls], r.idx, MSG.range).concat(otherClassVals(T.LIN2768, r.idx, cls, ['f', 'm', 'c', 'v'], MSG.cls)) })
        ],
        solution: r.steps.slice(0, 3)
      };
    }
  });

  frei.tasks.push({
    id: 'frei-grenzmasse', title: 'Grenzmaße berechnen', desc: 'Höchstmaß, Mindestmaß und Toleranz',
    make(R = L.rng(L.newSeed())) {
      let N, cls;
      do {
        N = R.chance(0.25) ? R.pick(LIN_EDGE) : R.pick(LIN_POOL.concat([12.5, 22.5, 47.5, 65.5]));
        cls = R.pick(['f', 'm', 'm', 'c', 'v']);
      } while (!linOk(N, cls));
      const r = T.lin2768(N, cls, 'len');
      return {
        prompt: `<p>Du fräst ein Maß von ${code(f(N) + ' mm')} ohne eigene Toleranz. Im Schriftfeld steht ${code('ISO 2768-' + cls)}.</p><p>Berechne Höchstmaß, Mindestmaß und Toleranz.</p>`,
        steps: [
          choice('range', 'Nennmaßbereich', linRangeOpts(), r.idx, { hint: MSG.rangeHint, alts: rangeSelAlts(r.idx, N, T.LIN2768.ranges) }),
          num('dev', 'Grenzabmaß (± in mm)', r.dev, { pm: true, hint: MSG.linHint, dep: ['range'], follow: g => T.LIN2768[cls][+g('range')], alts: neighborVals(T.LIN2768[cls], r.idx, MSG.range).concat(otherClassVals(T.LIN2768, r.idx, cls, ['f', 'm', 'c', 'v'], MSG.cls)) }),
          num('max', 'Höchstmaß in mm', r.max, { dep: ['dev'], follow: g => N + g('dev'), alts: [alt(r.min, 'Beim Höchstmaß wird das Abmaß addiert.')] }),
          num('min', 'Mindestmaß in mm', r.min, { dep: ['dev'], follow: g => N - g('dev'), alts: [alt(r.max, 'Beim Mindestmaß wird das Abmaß abgezogen.')] }),
          num('tol', 'Toleranz in mm', r.tol, { dep: ['max', 'min'], follow: g => g('max') - g('min'), alts: [alt(r.dev, 'Das ist nur das Grenzabmaß. Die Toleranz ist Höchstmaß minus Mindestmaß.')] })
        ],
        solution: r.steps
      };
    }
  });

  frei.tasks.push({
    id: 'frei-radien', title: 'Radien und Fasen', desc: 'Die eigene kleine Tabelle nutzen',
    make(R = L.rng(L.newSeed())) {
      const x = R.pick([0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20]);
      const cls = R.pick(['f', 'm', 'c', 'v']);
      const isRad = R.chance(0.6);
      const r = T.lin2768(x, cls, 'rad');
      const lin = T.lin2768(x, cls, 'len');
      const devAlts = neighborVals(T.RAD2768[cls], r.idx, MSG.range).concat(otherClassVals(T.RAD2768, r.idx, cls, ['f', 'm', 'c', 'v'], MSG.cls));
      if (lin.ok) devAlts.unshift(alt(lin.dev, 'Das ist der Wert aus der Tabelle für Längenmaße. Für Radien und Fasen gibt es eine eigene Tabelle.'));
      const what = isRad ? `einen Radius ${code('R' + f(x))}` : `eine Fase ${code(f(x) + ' × 45°')}`;
      return {
        prompt: `<p>An einer Außenkante fräst du ${what} ohne eigene Toleranz. Im Schriftfeld steht ${code('ISO 2768-' + cls)}.</p>${isRad ? '' : '<p>Bei einer Fase zählt die Fasenhöhe.</p>'}`,
        steps: [
          choice('tab', 'Welche Tabelle brauchst du?', opts([['len', 'Längenmaße'], ['rad', 'Rundungshalbmesser und Fasenhöhen'], ['ang', 'Winkelmaße']]), 'rad', { alts: [alt('len', 'Radien und Fasen haben in ISO 2768-1 eine eigene Tabelle.'), alt('ang', 'Die 45° der Fase sind hier nicht gefragt. Es geht um die Fasenhöhe.')] }),
          choice('range', 'In welchem Bereich liegt das Maß?', radRangeOpts(), r.idx, { hint: MSG.rangeHint, alts: rangeSelAlts(r.idx, x, T.RAD2768.ranges) }),
          num('dev', 'Grenzabmaß (± in mm)', r.dev, { pm: true, dep: ['range'], follow: g => T.RAD2768[cls][+g('range')], alts: devAlts }),
          num('max', `Größter erlaubter ${isRad ? 'Radius' : 'Fasenwert'} in mm`, r.max, { dep: ['dev'], follow: g => x + g('dev') }),
          num('min', `Kleinster erlaubter ${isRad ? 'Radius' : 'Fasenwert'} in mm`, r.min, { dep: ['dev'], follow: g => x - g('dev') })
        ],
        solution: [{ t: 'Tabelle', h: 'Für Radien und Fasen gibt es in ISO 2768-1 eine eigene Tabelle: Rundungshalbmesser und Fasenhöhen.' }].concat(r.steps.slice(1, 4))
      };
    }
  });

  frei.tasks.push({
    id: 'frei-winkel', title: 'Winkel', desc: 'Grad und Minuten richtig rechnen',
    make(R = L.rng(L.newSeed())) {
      const legs = [5, 8, 10, 12, 20, 35, 50, 60, 80, 120, 150, 250, 400, 450, 600];
      let a = R.pick(legs), b = R.pick(legs);
      while (b === a) b = R.pick(legs);
      const nom = R.pick([90, 90, 45, 30, 60, 120, 135]);
      const cls = R.pick(['f', 'm', 'c', 'v']);
      const Ls = Math.min(a, b), Ll = Math.max(a, b);
      const r = T.angle2768(Ls, cls, nom);
      const idx = T.angIdx(Ls);
      const devAlts = neighborVals(T.ANG2768[cls], idx, MSG.range).concat(otherClassVals(T.ANG2768, idx, cls, ['f', 'm', 'c', 'v'], MSG.cls));
      const jl = T.angIdx(Ll);
      if (jl !== idx) devAlts.unshift(alt(T.ANG2768[cls][jl], 'Das ist der Wert für den längeren Schenkel. Beim Winkel zählt der kürzere.'));
      const n = nom * 60;
      return {
        prompt: `<p>Zwei gefräste Flächen bilden einen Winkel von ${code(nom + '°')} ohne eigene Toleranz. Die Schenkel sind ${f(a)} mm und ${f(b)} mm lang. Im Schriftfeld steht ${code('ISO 2768-' + cls)}.</p><p>Gib Winkel in Grad und Minuten an. 60 Minuten sind 1 Grad.</p>`,
        steps: [
          num('L', 'Länge des kürzeren Schenkels in mm', Ls, { alts: [alt(Ll, 'Für die Winkeltoleranz zählt der kürzere Schenkel.')] }),
          angle('dev', 'Zulässige Abweichung (±)', r.min, { dep: ['L'], follow: g => T.ANG2768[cls][T.angIdx(g('L'))], alts: devAlts }),
          angle('max', 'Größtwinkel', n + r.min, { dep: ['dev'], follow: g => n + g('dev') }),
          angle('min', 'Kleinstwinkel', n - r.min, { dep: ['dev'], follow: g => n - g('dev') })
        ],
        solution: r.steps.filter(s => s.t !== 'Was das am Werkstück heißt')
      };
    }
  });

  frei.tasks.push({
    id: 'frei-messen', title: 'Messen und entscheiden', desc: 'In Ordnung, Nacharbeit oder Ausschuss?',
    make(R = L.rng(L.newSeed())) {
      let N, cls;
      do { N = R.pick([12, 18, 25, 30, 36, 42, 50, 64, 80, 100, 120, 150, 180, 250, 320, 400, 480]); cls = R.pick(['f', 'm', 'c']); } while (!linOk(N, cls));
      const r = T.lin2768(N, cls, 'len');
      const outer = R.chance(0.5);
      const scen = outer
        ? R.pick([`Die Breite einer Platte`, `Die Länge eines Absatzes`, `Die Dicke eines Stegs`, `Die Länge eines Zapfens`])
        : R.pick([`Die Länge einer Tasche`, `Die Breite einer Nut`, `Die Breite eines Durchbruchs`, `Die Weite einer Aussparung`]);
      const pos = R.pick(['in', 'in', 'over', 'under']);
      const dec = cls === 'f' ? 3 : 2;
      const step = cls === 'f' ? 0.005 : 0.01;
      let meas;
      if (pos === 'in') meas = r.min + step * R.int(0, Math.round(2 * r.dev / step));
      else if (pos === 'over') meas = r.max + step * R.int(1, cls === 'f' ? 8 : 12);
      else meas = r.min - step * R.int(1, cls === 'f' ? 8 : 12);
      meas = r6(meas);
      const judge = (hi, lo) => {
        if (meas <= hi + 1e-9 && meas >= lo - 1e-9) return 'io';
        const tooBig = meas > hi;
        return outer ? (tooBig ? 'nach' : 'aus') : (tooBig ? 'aus' : 'nach');
      };
      const ans = judge(r.max, r.min);
      const why = ans === 'io' ? 'Das Istmaß liegt zwischen Mindest- und Höchstmaß.'
        : ans === 'nach' ? (outer ? 'Das Außenmaß ist zu groß. Es ist noch Material da, du kannst nachfräsen.' : 'Das Innenmaß ist zu klein. Es ist noch Material da, du kannst nachfräsen.')
          : (outer ? 'Das Außenmaß ist zu klein. Das fehlende Material kannst du nicht mehr anbringen.' : 'Das Innenmaß ist zu groß. Das weggefräste Material kannst du nicht mehr anbringen.');
      return {
        prompt: `<p>${scen} ist mit ${code(f(N) + ' mm')} bemaßt, ohne eigene Toleranz. Im Schriftfeld steht ${code('ISO 2768-' + cls)}. Das ist ein ${outer ? '<b>Außenmaß</b>' : '<b>Innenmaß</b>'}.</p><p>Du misst ${code(T.fmt(meas, dec, 3) + ' mm')}.</p>`,
        steps: [
          num('max', 'Höchstmaß in mm', r.max, { alts: [alt(r.min, 'Beim Höchstmaß wird das Abmaß addiert.')].concat(otherClassVals(T.LIN2768, r.idx, cls, ['f', 'm', 'c', 'v'], MSG.cls).map(a => alt(N + a.v, MSG.cls))) }),
          num('min', 'Mindestmaß in mm', r.min, { dep: ['max'], follow: g => 2 * N - g('max'), alts: [alt(r.max, 'Beim Mindestmaß wird das Abmaß abgezogen.')] }),
          choice('urteil', 'Wie bewertest du das Teil?', opts([['io', 'In Ordnung'], ['nach', 'Nacharbeit'], ['aus', 'Ausschuss']]), ans, {
            dep: ['max', 'min'], follow: g => judge(g('max'), g('min')),
            alts: [alt(ans === 'nach' ? 'aus' : 'nach', 'Überleg, ob an der Stelle noch Material zum Wegfräsen da ist. Bei einem Außenmaß ist zu groß noch zu retten, bei einem Innenmaß zu klein.')]
          })
        ],
        solution: r.steps.slice(1, 4).concat([{ t: 'Bewerten', h: `Gemessen: ${T.fmt(meas, dec, 3)} mm. ${why} Ergebnis: <b>${ans === 'io' ? 'In Ordnung' : ans === 'nach' ? 'Nacharbeit' : 'Ausschuss'}</b>.` }])
      };
    }
  });

  frei.tasks.push({
    id: 'frei-kette', title: 'Maßkette aus Freimaßen', desc: 'Schlussmaß mit Höchst- und Mindestmaß',
    make(R = L.rng(L.newSeed())) {
      const cls = R.pick(['f', 'm', 'c']);
      const sub = R.chance(0.5);
      let a = R.pick([20, 25, 30, 40, 50, 60, 80, 100, 120, 150, 200]), b = R.pick([5, 8, 10, 12, 15, 20, 25, 30, 40, 60]);
      if (sub && b >= a) { const t = a; a = b + t; }
      const ra = T.lin2768(a, cls), rb = T.lin2768(b, cls);
      const n = sub ? a - b : a + b;
      const mx = r6(n + ra.dev + rb.dev), mn = r6(n - ra.dev - rb.dev), tol = r6(2 * (ra.dev + rb.dev));
      const prompt = sub
        ? `<p>Ein Teil ist ${code(f(a) + ' mm')} lang. Davon ist ein Absatz ${code(f(b) + ' mm')} lang. Beide Maße sind Freimaße, im Schriftfeld steht ${code('ISO 2768-' + cls)}.</p><p>Das Restmaß ist nicht bemaßt. In welchen Grenzen liegt es?</p>`
        : `<p>Zwei Absätze liegen hintereinander: A = ${code(f(a) + ' mm')} und B = ${code(f(b) + ' mm')}. Beide sind Freimaße, im Schriftfeld steht ${code('ISO 2768-' + cls)}.</p><p>Das Gesamtmaß ist nicht bemaßt. In welchen Grenzen liegt es?</p>`;
      return {
        prompt,
        steps: [
          num('da', `Grenzabmaß von ${f(a)} mm (± in mm)`, ra.dev, { pm: true, alts: neighborVals(T.LIN2768[cls], ra.idx, MSG.range).concat(otherClassVals(T.LIN2768, ra.idx, cls, ['f', 'm', 'c', 'v'], MSG.cls)) }),
          num('db', `Grenzabmaß von ${f(b)} mm (± in mm)`, rb.dev, { pm: true, alts: neighborVals(T.LIN2768[cls], rb.idx, MSG.range).concat(otherClassVals(T.LIN2768, rb.idx, cls, ['f', 'm', 'c', 'v'], MSG.cls)) }),
          num('n', `Nennmaß des ${sub ? 'Restmaßes' : 'Gesamtmaßes'} in mm`, n),
          num('max', 'Höchstmaß in mm', mx, { dep: ['n', 'da', 'db'], follow: g => g('n') + g('da') + g('db'), alts: sub ? [alt(n + ra.dev - rb.dev, 'Für das größte Restmaß brauchst du das Mindestmaß des abgezogenen Absatzes. Wer weniger abzieht, behält mehr.')] : [] }),
          num('min', 'Mindestmaß in mm', mn, { dep: ['n', 'da', 'db'], follow: g => g('n') - g('da') - g('db'), alts: sub ? [alt(n - ra.dev + rb.dev, 'Für das kleinste Restmaß brauchst du das Höchstmaß des abgezogenen Absatzes.')] : [] }),
          num('tol', 'Gesamttoleranz in mm', tol, { dep: ['max', 'min'], follow: g => g('max') - g('min'), alts: [alt(Math.abs(2 * (ra.dev - rb.dev)), 'Toleranzen werden immer addiert, auch bei abgezogenen Maßen.')] })
        ],
        solution: [
          { t: 'Grenzabmaße', h: `${f(a)} mm: Bereich ${ra.rangeText}, Klasse ${cls}, ±${f(ra.dev)} mm. ${f(b)} mm: Bereich ${rb.rangeText}, Klasse ${cls}, ±${f(rb.dev)} mm.` }
        ].concat(T.chain([{ valid: true, op: 1, N: a, up: ra.dev, lo: -ra.dev }, { valid: true, op: sub ? -1 : 1, N: b, up: rb.dev, lo: -rb.dev }]).steps)
      };
    }
  });

  // ================================================================
  // Block 3: ISO-Toleranzen
  // ================================================================
  const iso = {
    id: 'iso',
    title: 'ISO-Toleranzen',
    short: 'Kurzzeichen wie H7 oder g6 lesen und ausrechnen, Passungen',
    icon: 'target',
    praxis: [
      'Für einen Zylinderstift Ø8 sollst du eine Passbohrung fräsen. Mit Freimaßtoleranz wären ±0,2 mm erlaubt. Die Bohrung dürfte dann 8,2 mm groß sein, und der Stift würde wackeln.',
      'Deshalb steht auf der Zeichnung „Ø8 H7“. Das heißt: Die Bohrung darf zwischen 8,000 mm und 8,015 mm groß werden. Diese 15 Tausendstel schaffst du nicht mehr, indem du einfach mit einem 8er-Fräser eintauchst. Du bohrst vor und reibst auf, oder du fräst zirkular, misst mit Innenmessschraube oder Lehrdorn und korrigierst den Radius im Werkzeugspeicher.',
      'Und damit du beim Korrigieren nicht an die Grenze fährst, zielst du im Programm auf die Toleranzmitte: bei 8 H7 also auf 8,0075 mm.'
    ],
    begriffe: [
      ['Toleranzklasse', 'Ein Kurzzeichen aus Buchstabe und Zahl direkt am Maß, zum Beispiel H7. Geregelt in ISO 286.'],
      ['Bohrung und Welle', 'Großbuchstabe heißt Bohrung, also jedes Innenmaß, auch eine Nut oder Tasche. Kleinbuchstabe heißt Welle, also jedes Außenmaß, auch eine Passfeder oder ein Zapfen.'],
      ['Nulllinie', 'Die Linie, die das Nennmaß darstellt. Abmaße über der Nulllinie sind positiv, darunter negativ.'],
      ['Grundabmaß', 'Das Abmaß, das der Nulllinie am nächsten liegt. Der Buchstabe legt fest, wie groß es ist und ob es oben oder unten liegt.'],
      ['Toleranzgrad (IT-Grad)', 'Die Zahl hinter dem Buchstaben, von IT01 (sehr fein) bis IT18 (sehr grob).'],
      ['Grundtoleranz (IT-Wert)', 'Die Breite des Toleranzfelds in µm. Sie hängt vom IT-Grad und vom Nennmaßbereich ab.'],
      ['Oberes und unteres Abmaß', 'Bei Bohrungen ES und EI, bei Wellen es und ei. Oberes minus unteres Abmaß ergibt immer den IT-Wert.'],
      ['Mikrometer (µm)', 'Ein Tausendstel Millimeter. 21 µm sind 0,021 mm.'],
      ['Passung', 'Bohrung und Welle zusammen, zum Beispiel 30 H7/g6. Je nach Lage der Felder ergibt sich Spiel, Übermaß oder beides möglich.']
    ],
    merksatz: 'Der Buchstabe sagt, wo das Toleranzfeld liegt. Die Zahl sagt, wie breit es ist.',
    extras: [
      {
        t: 'Eselsbrücken', ul: [
          'Groß ist das Loch: Großbuchstabe heißt Bohrung, Kleinbuchstabe heißt Welle.',
          'H und h fangen am Nennmaß an. Eine H-Bohrung wird nie kleiner, eine h-Welle nie größer als das Nennmaß. Du startest also dort, wo das meiste Material ist, und nimmst nur noch weg.',
          'Je höher die IT-Zahl, desto gröber. Grob gesagt: IT6 schleifen, IT7 reiben oder feinbohren, IT8 bis IT9 schlichten, IT11 bohren mit dem Spiralbohrer.',
          'Wellen zur H7-Bohrung: f wie frei, g wie gleitet, h wie haargenau am Nennmaß, k wie klemmt leicht, n wie nur mit Hammer, p wie pressen, s wie schrumpfen.',
          'js heißt symmetrisch: halber IT-Wert nach oben, halber nach unten.',
          'Größte Bohrung minus kleinste Welle, kleinste Bohrung minus größte Welle. Beide positiv: Spiel. Beide negativ: Übermaß. Gemischt: Übergang.'
        ]
      },
      {
        t: 'So gehst du mit dem Tabellenbuch vor', ol: [
          'Nennmaßbereich bestimmen. Die obere Grenze gehört dazu.',
          'IT-Wert ablesen: Zeile Nennmaßbereich, Spalte IT-Grad.',
          'Grundabmaß ablesen: Tabelle für Wellen oder für Bohrungen, Zeile Nennmaßbereich, Spalte Buchstabe.',
          'Zweites Abmaß ausrechnen: Grundabmaß plus oder minus IT-Wert, je nachdem, ob das Feld nach oben oder unten weitergeht.',
          'Grenzmaße ausrechnen: µm in mm umrechnen und zum Nennmaß dazurechnen.'
        ]
      },
      {
        t: 'Einheitsbohrung und Einheitswelle', p: [
          'Bei der Einheitsbohrung haben alle Bohrungen das Grundabmaß H. Ob es locker oder fest sitzt, entscheidet die Welle. Das ist im Maschinenbau üblich, weil es Reibahlen und Lehrdorne für H7 in jeder Größe gibt.',
          'Bei der Einheitswelle haben alle Wellen das Grundabmaß h, und die Bohrungen machen den Unterschied. Das nimmt man zum Beispiel bei gezogenem Blankstahl oder bei langen Wellen, auf denen mehrere Teile mit unterschiedlichem Sitz sitzen.'
        ]
      },
      {
        t: 'Bohrungen K, M, N und P mit Zuschlag', p: [
          'Für diese Bohrungen nimmst du das Grundabmaß der gleichnamigen Welle mit umgedrehtem Vorzeichen und rechnest einen kleinen Zuschlag dazu. Der Zuschlag ist der Unterschied zwischen dem IT-Wert der Bohrung und dem nächstfeineren IT-Wert im selben Bereich.',
          'Beispiel 25 K7: Welle k hat im Bereich über 18 bis 30 mm +2 µm, umgedreht −2 µm. Zuschlag: IT7 minus IT6 = 21 µm − 13 µm = 8 µm. Oberes Abmaß: −2 µm + 8 µm = +6 µm. Unteres Abmaß: +6 µm − 21 µm = −15 µm.',
          'Der Zuschlag sorgt dafür, dass zum Beispiel K7/h6 genau dasselbe Spiel und Übermaß ergibt wie H7/k6.'
        ]
      }
    ],
    figure: 'nulllinie',
    tables: ['it', 'grund'],
    tasks: []
  };

  function isoValueAlts(N, grade, ri) {
    const out = [];
    [ri - 1, ri + 1].forEach(j => { if (j >= 0 && j < 13) out.push(alt(T.IT[grade][j], MSG.range)); });
    const gi = T.IT_GRADES.indexOf(grade);
    [gi - 1, gi + 1].forEach(j => { if (j >= 0 && j < T.IT_GRADES.length) out.push(alt(T.IT[T.IT_GRADES[j]][ri], MSG.itcol)); });
    return out;
  }
  const mmAlts = (N, dev) => [alt(N + dev, MSG.umToMm), alt(N + dev / 100, MSG.comma), alt(N + dev / 10000, MSG.comma)];

  iso.tasks.push({
    id: 'iso-lesen', title: 'Kurzzeichen lesen', desc: 'Nennmaß, Grad, Welle oder Bohrung, Lage',
    make(R = L.rng(L.newSeed())) {
      const letter = R.pick(['H', 'H', 'h', 'h', 'f', 'g', 'k', 'm', 'n', 'p', 's', 'js', 'JS', 'F', 'G', 'D', 'E', 'N', 'P', 'e', 'd']);
      const grade = String(R.int(5, 11));
      const N = R.pick(ISO_N);
      const r = T.isoTol(N, letter, grade);
      if (!r.ok) return this.make(R);
      const lage = r.lower >= 0 ? 'oben' : r.upper <= 0 ? 'unten' : 'beide';
      const fund = r.fundSide === 'sym' ? 'sym' : r.fundSide;
      return {
        prompt: `<p>Auf der Zeichnung steht ${code('Ø' + f(N) + ' ' + letter + grade)}.</p>`,
        steps: [
          num('N', 'Nennmaß in mm', N),
          num('g', 'Toleranzgrad (nur die Zahl)', +grade, { unit: '' }),
          choice('art', 'Welle oder Bohrung?', opts([['welle', 'Welle (Außenmaß)'], ['bohrung', 'Bohrung (Innenmaß)']]), r.isHole ? 'bohrung' : 'welle', { hint: 'Großbuchstaben stehen für Bohrungen, Kleinbuchstaben für Wellen.' }),
          choice('lage', 'Wo liegt das Toleranzfeld?', opts([['oben', 'über der Nulllinie (größer als Nennmaß)'], ['unten', 'unter der Nulllinie (kleiner als Nennmaß)'], ['beide', 'auf beiden Seiten der Nulllinie']]), lage, { hint: 'Überleg, was der Buchstabe über die Lage sagt. H beginnt an der Nulllinie und geht nach oben, h geht nach unten.' }),
          choice('fund', 'Welches Abmaß ist das Grundabmaß?', opts([['upper', 'das obere Abmaß'], ['lower', 'das untere Abmaß'], ['sym', 'keins, das Feld ist symmetrisch']]), fund, { hint: 'Das Grundabmaß ist das Abmaß, das der Nulllinie am nächsten liegt.' })
        ],
        solution: [
          { t: 'Aufbau', h: `Ø${f(N)} ${letter}${grade}: Nennmaß <b>${f(N)} mm</b>, Buchstabe ${letter} für das Grundabmaß, Toleranzgrad <b>IT${grade}</b>.` },
          { t: 'Welle oder Bohrung', h: `${letter} ist ein ${r.isHole ? 'Großbuchstabe, also eine <b>Bohrung</b>' : 'Kleinbuchstabe, also eine <b>Welle</b>'}.` },
          { t: 'Lage', h: `${letter}${grade} hat bei ${f(N)} mm die Abmaße ${T.umS(r.upper)} µm und ${T.umS(r.lower)} µm. Das Feld liegt ${lage === 'oben' ? '<b>über der Nulllinie</b>' : lage === 'unten' ? '<b>unter der Nulllinie</b>' : '<b>auf beiden Seiten der Nulllinie</b>'}.` },
          { t: 'Grundabmaß', h: fund === 'sym' ? 'Bei js und JS liegt das Feld symmetrisch. Es gibt kein Grundabmaß aus der Tabelle, beide Abmaße sind halb so groß wie der IT-Wert.' : `Das Grundabmaß ist das Abmaß, das der Nulllinie am nächsten liegt: hier das <b>${fund === 'upper' ? 'obere' : 'untere'} Abmaß</b> (${T.umS(r.fund)} µm).` }
        ]
      };
    }
  });

  iso.tasks.push({
    id: 'iso-itwert', title: 'IT-Wert ablesen', desc: 'Zeile und Spalte der Grundtoleranzen',
    make(R = L.rng(L.newSeed())) {
      const edges = [3, 6, 10, 18, 30, 50, 80, 120, 180, 250, 315, 400, 500];
      const gradePool = ['5', '6', '6', '7', '7', '8', '9', '10', '11', '12', '13', '14', '01', '0', '1', '3', '16', '18'];
      const items = [];
      while (items.length < 2) {
        const N = R.chance(0.4) ? R.pick(edges) : R.pick(ISO_N.concat([2, 7, 13, 19, 33, 47, 95, 130, 175, 210, 270, 330, 390, 470]));
        const g = R.pick(gradePool);
        if (!items.some(x => x.N === N)) items.push({ N, g, ri: T.rangeIdx(N) });
      }
      const steps = [];
      items.forEach((it, k) => {
        steps.push(choice('r' + k, `${f(it.N)} mm: Nennmaßbereich`, isoRangeOpts(), it.ri, { hint: MSG.rangeHint, alts: rangeSelAlts(it.ri, it.N, T.RANGES) }));
        steps.push(num('it' + k, `IT${it.g} bei ${f(it.N)} mm (in µm)`, T.IT[it.g][it.ri], { unit: 'µm', dep: ['r' + k], follow: g => T.IT[it.g][+g('r' + k)], hint: MSG.itHint, alts: isoValueAlts(it.N, it.g, it.ri) }));
      });
      return {
        prompt: `<p>Lies die Grundtoleranzen ab:</p><p>${items.map(it => code(`IT${it.g} bei ${f(it.N)} mm`)).join(' ')}</p>`,
        steps,
        solution: items.map(it => ({ t: `IT${it.g} bei ${f(it.N)} mm`, h: `${f(it.N)} mm liegt im Bereich ${T.rangeText(it.ri)}.${it.N === T.RANGES[it.ri][1] && it.ri < 12 ? ' Die obere Grenze gehört dazu.' : ''} In der Spalte IT${it.g} steht <b>${T.um(T.IT[it.g][it.ri])} µm</b>, das sind ${T.mm(T.IT[it.g][it.ri] / 1000)} mm.` }))
      };
    }
  });

  iso.tasks.push({
    id: 'iso-hh', title: 'H-Bohrung und h-Welle', desc: 'Die Null liegt am Nennmaß',
    make(R = L.rng(L.newSeed())) {
      const letter = R.pick(['H', 'h']);
      const grade = R.pick(['6', '7', '7', '8', '9', '11', '5', '10']);
      const N = R.pick(ISO_N);
      const r = T.isoTol(N, letter, grade);
      const H = letter === 'H';
      return {
        prompt: `<p>Berechne die Grenzmaße für ${code('Ø' + f(N) + ' ' + letter + grade)}.</p><p>Abmaße in µm, Grenzmaße in mm.</p>`,
        steps: [
          num('it', 'IT-Wert in µm', r.it, { unit: 'µm', hint: MSG.itHint, alts: isoValueAlts(N, grade, r.ri) }),
          num('es', 'Oberes Abmaß in µm', r.upper, { unit: 'µm', signed: true, dep: ['it'], follow: g => H ? g('it') : 0, alts: H ? [alt(0, 'Bei H liegt die Null unten: Die Bohrung wird nie kleiner als das Nennmaß.')] : [alt(r.it, 'Bei h liegt die Null oben: Die Welle wird nie größer als das Nennmaß.')] }),
          num('ei', 'Unteres Abmaß in µm', r.lower, { unit: 'µm', signed: true, dep: ['it'], follow: g => H ? 0 : -g('it'), alts: H ? [alt(r.it, 'Bei H liegt die Null unten: Das untere Abmaß ist 0.')] : [alt(0, 'Bei h ist das obere Abmaß 0, das untere liegt um den IT-Wert tiefer.')] }),
          num('max', 'Höchstmaß in mm', r.max, { hint: MSG.maxHint, dep: ['es'], follow: g => N + g('es') / 1000, alts: mmAlts(N, r.upper).concat([alt(r.min, MSG.maxUsesUpper)]) }),
          num('min', 'Mindestmaß in mm', r.min, { hint: MSG.minHint, dep: ['ei'], follow: g => N + g('ei') / 1000, alts: mmAlts(N, r.lower).concat([alt(r.max, MSG.minUsesLower)]) })
        ],
        solution: r.steps.slice(0, 5)
      };
    }
  });

  iso.tasks.push({
    id: 'iso-wellen', title: 'Wellen f, g, k, m, n, p', desc: 'Grundabmaß aus der Tabelle, zweites Abmaß rechnen',
    make(R = L.rng(L.newSeed())) {
      const letter = R.pick(['f', 'f', 'g', 'g', 'k', 'k', 'm', 'n', 'p', 'e', 'd', 'r', 's']);
      let grade;
      if (letter === 'k') grade = R.pick(['5', '6', '6', '7', '8']);
      else if (letter === 'g') grade = R.pick(['5', '6', '6', '7']);
      else if (letter === 'd' || letter === 'e') grade = R.pick(['7', '8', '9', '10']);
      else if (letter === 'f') grade = R.pick(['6', '7', '7', '8']);
      else grade = R.pick(['5', '6', '6', '7']);
      const N = R.pick(ISO_N);
      const r = T.isoTol(N, letter, grade);
      const up = r.fundSide === 'upper';
      const ri = r.ri;
      const fundTab = (idx) => {
        if (up) return T.SHAFT_UPPER[letter][idx];
        if (letter === 'k') return T.SHAFT_K[idx];
        if (letter === 'r' || letter === 's') return N > 50 ? r.fund : T.SHAFT_RS[letter].main[Math.min(idx, 5)];
        return T.SHAFT_LOWER[letter][idx];
      };
      const fundAlts = [];
      if (!(letter === 'r' || letter === 's') || N <= 50) {
        [ri - 1, ri + 1].forEach(j => { if (j >= 0 && j < 13) fundAlts.push(alt(fundTab(j), MSG.range)); });
      } else {
        const si = T.subIdx(N);
        [si - 1, si + 1].forEach(j => { if (j >= 0 && j < T.SUBRANGES.length) fundAlts.push(alt(T.SHAFT_RS[letter].sub[j], 'Das ist der Wert aus einem Nachbar-Unterbereich. Bei r und s ist der Bereich über 50 mm feiner unterteilt.')); });
      }
      if (letter === 'k' && r.fund === 0 && T.SHAFT_K[ri] !== 0) fundAlts.push(alt(T.SHAFT_K[ri], 'Bei k gilt der Tabellenwert nur für IT4 bis IT7. Schau auf deinen IT-Grad.'));
      const fundFollow = (letter === 'r' || letter === 's') && N > 50 ? undefined : (g => (letter === 'k' && !(+grade >= 4 && +grade <= 7)) ? 0 : fundTab(+g('range')));
      return {
        prompt: `<p>Berechne die Grenzmaße für die Welle ${code('Ø' + f(N) + ' ' + letter + grade)}.</p><p>Abmaße in µm, Grenzmaße in mm.</p>`,
        steps: [
          choice('range', 'Nennmaßbereich', isoRangeOpts(), ri, { hint: MSG.rangeHint, alts: rangeSelAlts(ri, N, T.RANGES) }),
          num('it', 'IT-Wert in µm', r.it, { unit: 'µm', dep: ['range'], follow: g => T.IT[grade][+g('range')], hint: MSG.itHint, alts: isoValueAlts(N, grade, ri) }),
          choice('side', 'Welches Abmaß ist das Grundabmaß?', opts([['upper', 'das obere Abmaß (es)'], ['lower', 'das untere Abmaß (ei)']]), up ? 'upper' : 'lower', { hint: 'Das Grundabmaß ist das Abmaß, das der Nulllinie am nächsten liegt. Überleg, ob die Welle über oder unter der Nulllinie liegt.' }),
          num('fund', 'Grundabmaß aus der Tabelle in µm', r.fund, { unit: 'µm', signed: true, dep: fundFollow ? ['range'] : undefined, follow: fundFollow, alts: fundAlts }),
          num('es', 'Oberes Abmaß es in µm', r.upper, { unit: 'µm', signed: true, dep: up ? ['fund'] : ['fund', 'it'], follow: up ? (g => g('fund')) : (g => g('fund') + g('it')), alts: up ? [] : [alt(r.fund - r.it, 'Bei k bis zc liegt das zweite Abmaß über dem Grundabmaß: IT-Wert dazuzählen.')] }),
          num('ei', 'Unteres Abmaß ei in µm', r.lower, { unit: 'µm', signed: true, dep: up ? ['es', 'it'] : ['fund'], follow: up ? (g => g('es') - g('it')) : (g => g('fund')), alts: up ? [alt(r.fund + r.it, 'Bei a bis h liegt das zweite Abmaß unter dem Grundabmaß: IT-Wert abziehen.')] : [] }),
          num('max', 'Höchstmaß in mm', r.max, { hint: MSG.maxHint, dep: ['es'], follow: g => N + g('es') / 1000, alts: mmAlts(N, r.upper).concat([alt(r.min, MSG.maxUsesUpper)]) }),
          num('min', 'Mindestmaß in mm', r.min, { hint: MSG.minHint, dep: ['ei'], follow: g => N + g('ei') / 1000, alts: mmAlts(N, r.lower).concat([alt(r.max, MSG.minUsesLower)]) })
        ],
        solution: r.steps.slice(0, 5)
      };
    }
  });

  iso.tasks.push({
    id: 'iso-js', title: 'js und JS (symmetrisch)', desc: 'Halber IT-Wert nach oben und unten',
    make(R = L.rng(L.newSeed())) {
      const letter = R.pick(['js', 'JS']);
      const grade = R.pick(['5', '6', '6', '7', '7', '8', '9', '11']);
      const N = R.pick(ISO_N);
      const r = T.isoTol(N, letter, grade);
      const exact = r.it / 2;
      const accept = exact !== r.upper ? [{ v: r6(exact), m: `Stimmt. In den Tabellenbüchern steht hier ±${T.um(r.upper)} µm, weil die Norm bei IT7 bis IT11 auf ganze Mikrometer abrundet. Beides wird als richtig gewertet.` }] : [];
      return {
        prompt: `<p>Berechne die Grenzmaße für ${code('Ø' + f(N) + ' ' + letter + grade)}.</p>`,
        steps: [
          num('it', 'IT-Wert in µm', r.it, { unit: 'µm', hint: MSG.itHint, alts: isoValueAlts(N, grade, r.ri) }),
          num('half', 'Abmaß nach oben und unten (± in µm)', r.upper, { unit: 'µm', pm: true, accept, dep: ['it'], follow: g => g('it') / 2, alts: [alt(r.it, 'Das ist der ganze IT-Wert. Bei js und JS geht die Hälfte nach oben und die Hälfte nach unten.')] }),
          num('max', 'Höchstmaß in mm', r.max, { hint: MSG.maxHint, dep: ['half'], follow: g => N + g('half') / 1000, alts: mmAlts(N, r.upper) }),
          num('min', 'Mindestmaß in mm', r.min, { hint: MSG.minHint, dep: ['half'], follow: g => N - g('half') / 1000, alts: mmAlts(N, r.lower) })
        ],
        solution: r.steps.slice(1, 5)
      };
    }
  });

  iso.tasks.push({
    id: 'iso-kmnp', title: 'Bohrungen K, M, N, P', desc: 'Mit Zuschlag selbst ausrechnen',
    make(R = L.rng(L.newSeed())) {
      const letter = R.pick(['K', 'K', 'M', 'N', 'N', 'P', 'P']);
      const grade = letter === 'P' ? R.pick(['6', '7', '7']) : R.pick(['6', '7', '7', '8']);
      let N;
      do { N = R.pick(ISO_N.filter(n => n > 3)); } while (letter === 'M' && grade === '6' && T.rangeIdx(N) === 10);
      const r = T.isoTol(N, letter, grade);
      const ri = r.ri, l = letter.toLowerCase(), g = +grade;
      const baseTab = idx => l === 'k' ? T.SHAFT_K[idx] : T.SHAFT_LOWER[l][idx];
      const base = baseTab(ri);
      const d = T.delta(grade, ri);
      const baseAlts = [];
      [ri - 1, ri + 1].forEach(j => { if (j >= 0 && j < 13) baseAlts.push(alt(baseTab(j), MSG.range)); });
      const dAlts = [String(g - 1), String(g + 1)].filter(x => +x >= 3 && +x <= 8).map(x => alt(T.delta(x, ri), 'Das ist der Zuschlag für einen anderen IT-Grad. Rechne IT-Wert deines Grads minus IT-Wert des nächstfeineren Grads.'));
      dAlts.push(alt(T.IT[String(g - 1)][ri], 'Das ist der IT-Wert des feineren Grads. Der Zuschlag ist der Unterschied zwischen beiden IT-Werten.'));
      return {
        prompt: `<p>Berechne die Grenzmaße für die Bohrung ${code('Ø' + f(N) + ' ' + letter + grade)} selbst aus den Grundtabellen.</p><p>Regel für ${letter}: Grundabmaß der Welle ${l} mit umgedrehtem Vorzeichen, plus Zuschlag. Der Zuschlag ist IT${g} minus IT${g - 1} im selben Bereich. Das Ergebnis ist das obere Abmaß.</p>`,
        steps: [
          choice('range', 'Nennmaßbereich', isoRangeOpts(), ri, { hint: MSG.rangeHint, alts: rangeSelAlts(ri, N, T.RANGES) }),
          num('it', `IT${g} in µm`, r.it, { unit: 'µm', dep: ['range'], follow: gg => T.IT[grade][+gg('range')], hint: MSG.itHint, alts: isoValueAlts(N, grade, ri) }),
          num('base', `Grundabmaß der Welle ${l} aus der Tabelle in µm${l === 'k' ? ' (Spalte IT4 bis IT7)' : ''}`, base, { unit: 'µm', signed: true, dep: ['range'], follow: gg => baseTab(+gg('range')), alts: baseAlts }),
          num('delta', `Zuschlag: IT${g} minus IT${g - 1} in µm`, d, { unit: 'µm', dep: ['it', 'range'], follow: gg => gg('it') - T.IT[String(g - 1)][+gg('range')], alts: dAlts }),
          num('ES', 'Oberes Abmaß ES in µm', r.upper, { unit: 'µm', signed: true, dep: ['base', 'delta'], follow: gg => -gg('base') + gg('delta'), alts: [alt(base + d, 'Das Grundabmaß der Welle kommt mit umgedrehtem Vorzeichen.'), alt(-base, 'Der Zuschlag fehlt noch.'), alt(-base - d, 'Der Zuschlag wird dazugezählt, nicht abgezogen.')] }),
          num('EI', 'Unteres Abmaß EI in µm', r.lower, { unit: 'µm', signed: true, dep: ['ES', 'it'], follow: gg => gg('ES') - gg('it'), alts: [alt(r.upper + r.it, 'Hier ist das Grundabmaß das obere Abmaß. Das untere liegt um den IT-Wert tiefer.')] }),
          num('max', 'Höchstmaß in mm', r.max, { hint: MSG.maxHint, dep: ['ES'], follow: gg => N + gg('ES') / 1000, alts: mmAlts(N, r.upper).concat([alt(r.min, MSG.maxUsesUpper)]) }),
          num('min', 'Mindestmaß in mm', r.min, { hint: MSG.minHint, dep: ['EI'], follow: gg => N + gg('EI') / 1000, alts: mmAlts(N, r.lower).concat([alt(r.max, MSG.minUsesLower)]) })
        ],
        solution: r.steps.slice(0, 5)
      };
    }
  });

  iso.tasks.push({
    id: 'iso-mitte', title: 'Toleranzmitte fürs CNC-Programm', desc: 'Auf welches Maß programmierst du?',
    make(R = L.rng(L.newSeed())) {
      const cls = R.pick(['H7', 'H7', 'H8', 'H6', 'G7', 'F7', 'K7', 'M7', 'N7', 'P7', 'JS7', 'h6', 'h7', 'g6', 'f7', 'k6', 'm6', 'n6', 'p6', 'js6', 'e8']);
      const letter = cls.replace(/\d+$/, ''), grade = cls.match(/\d+$/)[0];
      const N = R.pick(ISO_N.filter(n => n >= 6 && n <= 200));
      const r = T.isoTol(N, letter, grade);
      const hole = r.isHole;
      return {
        prompt: hole
          ? `<p>Du fräst die Bohrung ${code('Ø' + f(N) + ' ' + cls)} zirkular. Damit du beim Korrigieren Luft nach beiden Seiten hast, zielst du im Programm auf die Mitte des Toleranzfelds.</p>`
          : `<p>Du fräst einen Zapfen ${code('Ø' + f(N) + ' ' + cls)} zirkular. Damit du beim Korrigieren Luft nach beiden Seiten hast, zielst du im Programm auf die Mitte des Toleranzfelds.</p>`,
        steps: [
          num('es', 'Oberes Abmaß in µm', r.upper, { unit: 'µm', signed: true, alts: [alt(r.lower, 'Das ist das untere Abmaß. Oben liegt der größere Wert.')] }),
          num('ei', 'Unteres Abmaß in µm', r.lower, { unit: 'µm', signed: true, alts: [alt(r.upper, 'Das ist das obere Abmaß. Unten liegt der kleinere Wert.')] }),
          num('mid', 'Mitte des Toleranzfelds in µm', r.midDev, { unit: 'µm', signed: true, dep: ['es', 'ei'], follow: g => (g('es') + g('ei')) / 2, alts: [alt((r.upper - r.lower) / 2, 'Das ist die halbe Toleranzbreite. Für die Mitte zählst du beide Abmaße mit Vorzeichen zusammen und teilst durch 2.')] }),
          num('prog', 'Programmiermaß in mm', r.mid, { tol: 0.0005, dep: ['mid'], follow: g => N + g('mid') / 1000, alts: mmAlts(N, r.midDev) })
        ],
        solution: r.steps.slice(2, 3).concat([
          { t: 'Abmaße', h: `Oberes Abmaß <b>${T.umS(r.upper)} µm</b>, unteres Abmaß <b>${T.umS(r.lower)} µm</b>.` },
          { t: 'Mitte', h: `${T.umS(r.upper)} µm und ${T.umS(r.lower)} µm zusammengezählt ergeben ${T.umS(r.upper + r.lower)} µm, geteilt durch 2 = <b>${T.umS(r.midDev)} µm</b>.` },
          { t: 'Programmiermaß', h: `${T.plusText(N, r.midDev / 1000, 'mm', T.mm)}. Gerundet auf Tausendstel reicht in der Praxis: <b>${T.fmt(r.mid, 3, 3)} mm</b>.` }
        ])
      };
    }
  });

  function fitTask(id, title, desc, fits) {
    return {
      id, title, desc,
      make(R = L.rng(L.newSeed())) {
        const fit = R.pick(fits);
        const N = R.pick(ISO_N.filter(n => n >= 4 && n <= 250));
        const [hc, sc] = fit.split('/');
        const p = T.parseFit(`${N}${hc}/${sc}`);
        const r = T.fitCalc(N, p.hole, p.shaft);
        const H = r.H, S = r.S;
        const d1 = r6((H.upper - S.lower) / 1000), d2 = r6((H.lower - S.upper) / 1000);
        const art = r.type;
        const artOf = (a, b) => (b >= 0 ? 'spiel' : a <= 0 ? 'press' : 'uebergang');
        return {
          prompt: `<p>Berechne die Passung ${code('Ø' + f(N) + ' ' + hc + '/' + sc)}.</p><p>Abmaße in µm, Differenzen in mm. Plus heißt Spiel, minus heißt Übermaß.</p>`,
          steps: [
            num('ES', `Bohrung ${hc}: oberes Abmaß in µm`, H.upper, { unit: 'µm', signed: true }),
            num('EI', `Bohrung ${hc}: unteres Abmaß in µm`, H.lower, { unit: 'µm', signed: true }),
            num('es', `Welle ${sc}: oberes Abmaß in µm`, S.upper, { unit: 'µm', signed: true }),
            num('ei', `Welle ${sc}: unteres Abmaß in µm`, S.lower, { unit: 'µm', signed: true }),
            num('d1', 'Größte Bohrung minus kleinste Welle in mm', d1, { signed: true, dep: ['ES', 'ei'], follow: g => (g('ES') - g('ei')) / 1000, alts: [alt((H.upper - S.upper) / 1000, 'Hier gehören die größte Bohrung und die kleinste Welle zusammen, also oberes Abmaß der Bohrung und unteres Abmaß der Welle.'), alt(H.upper - S.lower, MSG.umToMm)] }),
            num('d2', 'Kleinste Bohrung minus größte Welle in mm', d2, { signed: true, dep: ['EI', 'es'], follow: g => (g('EI') - g('es')) / 1000, alts: [alt((H.lower - S.lower) / 1000, 'Hier gehören die kleinste Bohrung und die größte Welle zusammen, also unteres Abmaß der Bohrung und oberes Abmaß der Welle.'), alt(H.lower - S.upper, MSG.umToMm)] }),
            choice('art', 'Passungsart', opts([['spiel', 'Spielpassung'], ['uebergang', 'Übergangspassung'], ['press', 'Übermaßpassung (Presspassung)']]), art, { dep: ['d1', 'd2'], follow: g => artOf(g('d1'), g('d2')), hint: 'Beide Ergebnisse positiv: Spiel. Beide negativ: Übermaß. Eins positiv, eins negativ: Übergang.' })
          ],
          solution: r.steps.slice(0, 5)
        };
      }
    };
  }
  iso.tasks.push(fitTask('iso-spiel', 'Spielpassungen', 'Höchst- und Mindestspiel ausrechnen', ['H7/g6', 'H7/f7', 'H8/f7', 'H7/h6', 'H8/h7', 'H8/e8', 'G7/h6', 'F8/h7', 'H6/g5', 'H11/d9', 'H9/d10', 'E9/h8']));
  iso.tasks.push(fitTask('iso-uebergang', 'Übergangs- und Presspassungen', 'Wann gibt es Übermaß?', ['H7/k6', 'H7/m6', 'H7/n6', 'H7/p6', 'H7/r6', 'H7/s6', 'H7/js6', 'K7/h6', 'M7/h6', 'N7/h6', 'P7/h6', 'H6/k5', 'H6/n5', 'R7/h6', 'S7/h6']));

  iso.tasks.push({
    id: 'iso-system', title: 'Einheitsbohrung oder Einheitswelle?', desc: 'Passungen dem System zuordnen',
    make(R = L.rng(L.newSeed())) {
      const EB = ['H7/g6', 'H7/k6', 'H8/f7', 'H7/p6', 'H7/n6', 'H11/d9', 'H7/s6', 'H6/k5', 'H7/r6'];
      const EW = ['G7/h6', 'F8/h7', 'K7/h6', 'N7/h6', 'P7/h6', 'D10/h9', 'M7/h6', 'S7/h6', 'JS7/h6'];
      const NO = ['F7/k6', 'G7/m6', 'K7/g6'];
      const list = R.shuffle([R.pick(EB), R.pick(EB), R.pick(EW), R.pick(EW), R.chance(0.4) ? R.pick(NO) : R.pick(EB)]);
      const uniq = [...new Set(list)].slice(0, 4);
      while (uniq.length < 4) { const x = R.pick(EB.concat(EW)); if (!uniq.includes(x)) uniq.push(x); }
      const sys = x => x.startsWith('H') && x.split('/')[1][0] !== 'h' ? 'EB' : x.split('/')[1].startsWith('h') && !x.startsWith('H') ? 'EW' : 'keins';
      const o = opts([['EB', 'Einheitsbohrung'], ['EW', 'Einheitswelle'], ['keins', 'keins von beiden']]);
      const steps = uniq.map((x, i) => choice('f' + i, `${x}`, o, sys(x), { hint: 'Einheitsbohrung: Die Bohrung hat H. Einheitswelle: Die Welle hat h.' }));
      steps.push(choice('why', 'Welches System ist im Maschinenbau üblicher?', opts([['EB', 'Einheitsbohrung'], ['EW', 'Einheitswelle']]), 'EB', { hint: 'Überleg, welche Werkzeuge und Lehren es fertig zu kaufen gibt: Reibahlen und Lehrdorne in H7.' }));
      return {
        prompt: '<p>Zu welchem Passungssystem gehören diese Passungen?</p>',
        steps,
        solution: uniq.map(x => ({ t: x, h: sys(x) === 'EB' ? 'Die Bohrung hat das Grundabmaß H: <b>Einheitsbohrung</b>.' : sys(x) === 'EW' ? 'Die Welle hat das Grundabmaß h: <b>Einheitswelle</b>.' : 'Weder die Bohrung hat H noch die Welle h: <b>keins von beiden</b>. So eine Passung ist unüblich.' }))
          .concat([{ t: 'Üblich im Maschinenbau', h: '<b>Einheitsbohrung</b>. Bohrungen stellt man mit Reibahlen oder Feinbohrköpfen her und prüft sie mit Lehrdornen. Beides gibt es fertig in H7. Wellen lassen sich beim Drehen oder Schleifen leicht auf jedes Maß bringen.' }])
      };
    }
  });

  L.topics = [allg, frei, iso];
  L.topic = id => L.topics.find(t => t.id === id);
  L.task = id => { for (const tp of L.topics) { const x = tp.tasks.find(t => t.id === id); if (x) return x; } return null; };
})(typeof window !== 'undefined' ? window : globalThis);
