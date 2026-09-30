/* Toleranzen – Rechenkern: Eingaben lesen, Tabellen nachschlagen, Rechenwege in ganzen Sätzen.
   Läuft im Browser und in Node (für die Tests in test.js). */
(function (root) {
  'use strict';
  const T = root.TOL = root.TOL || {};

  // ---------- Zahlen ----------
  const r6 = x => Math.round(x * 1e6) / 1e6;
  T.r6 = r6;

  // Tolerant lesen: Komma oder Punkt, Leerzeichen, Einheiten, verschiedene Minuszeichen
  T.parseNum = function (s) {
    if (s == null) return NaN;
    let t = String(s).trim().replace(/[−–—]/g, '-').replace(/\s+/g, '');
    t = t.replace(/(mm|µm|μm|um|°|grad)$/i, '').replace(/^±/, '');
    if ((t.match(/,/g) || []).length === 1 && !t.includes('.')) t = t.replace(',', '.');
    if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(t)) return NaN;
    return parseFloat(t);
  };

  // Deutsche Schreibweise mit echtem Minuszeichen
  T.fmt = function (x, minDec = 0, maxDec = 4) {
    if (x == null || !isFinite(x)) return '–';
    const v = r6(x);
    let [i, d = ''] = Math.abs(v).toFixed(maxDec).split('.');
    d = d.replace(/0+$/, '');
    while (d.length < minDec) d += '0';
    return (v < 0 ? '−' : '') + i + (d ? ',' + d : '');
  };
  T.fmtS = (x, minDec = 0, maxDec = 4) => (r6(x) > 0 ? '+' : '') + T.fmt(x, minDec, maxDec);
  T.mm = x => T.fmt(x, 3, 4);          // Millimeter mit mindestens drei Stellen
  T.mmS = x => T.fmtS(x, 3, 4);
  T.um = x => T.fmt(x, 0, 2);          // Mikrometer
  T.umS = x => T.fmtS(x, 0, 2);
  T.decimals = x => { const s = String(r6(Math.abs(x))); return s.includes('.') ? s.split('.')[1].length : 0; };

  // „a + b = c“ bzw. „a − b = c“ mit Einheit
  T.plusText = (a, b, unit, f = T.fmt) => `${f(a)} ${unit} ${b < 0 ? '−' : '+'} ${f(Math.abs(b))} ${unit} = ${f(r6(a + b))} ${unit}`;

  // ---------- Nennmaßbereiche ISO 286 ----------
  T.rangeIdx = function (N) {
    for (let i = 0; i < T.RANGES.length; i++) if (N > T.RANGES[i][0] && N <= T.RANGES[i][1]) return i;
    return -1;
  };
  T.rangeText = i => i === 0 ? 'bis 3 mm' : `über ${T.RANGES[i][0]} bis ${T.RANGES[i][1]} mm`;
  T.subIdx = function (N) {
    for (let i = 0; i < T.SUBRANGES.length; i++) if (N > T.SUBRANGES[i][0] && N <= T.SUBRANGES[i][1]) return i;
    return -1;
  };
  T.subText = i => `über ${T.SUBRANGES[i][0]} bis ${T.SUBRANGES[i][1]} mm`;
  T.gradeNum = g => g === '01' ? -1 : parseInt(g, 10);
  T.itText = g => 'IT' + g;

  // Zuschlag (Delta) für Bohrungen K bis ZC: Unterschied zum nächstfeineren Grad, bis 3 mm immer 0
  T.delta = function (grade, ri) {
    const g = T.gradeNum(grade);
    if (ri === 0 || g < 3) return 0;
    return r6(T.IT[String(g)][ri] - T.IT[String(g - 1)][ri]);
  };

  // ---------- Toleranzklasse lesen ----------
  T.parseClassToken = function (tok) {
    const s = String(tok || '').replace(/\s+/g, '');
    const m = /^([a-z]{1,2})(\d{1,2})$/i.exec(s);
    if (!m) return { error: 'Schreib die Toleranzklasse als Buchstabe und Zahl, zum Beispiel H7 oder g6.' };
    let L = m[1];
    const isHole = L[0] === L[0].toUpperCase();
    if (L.toLowerCase() === 'js') L = isHole ? 'JS' : 'js';
    const list = isHole ? T.HOLE_LETTERS : T.SHAFT_LETTERS;
    if (!list.includes(L)) {
      return { error: `Das Grundabmaß „${m[1]}“ ist in der App nicht hinterlegt. Möglich sind bei Bohrungen ${T.HOLE_LETTERS.join(', ')} und bei Wellen ${T.SHAFT_LETTERS.join(', ')}.` };
    }
    let g = m[2];
    if (g !== '01' && g !== '0') g = String(parseInt(g, 10));
    if (!T.IT_GRADES.includes(g)) return { error: `Den Toleranzgrad „${m[2]}“ gibt es nicht. Möglich sind IT01, IT0 und IT1 bis IT18.` };
    return { letter: L, grade: g, isHole };
  };

  function cleanInput(str) {
    return String(str || '')
      .replace(/[Øø⌀∅]/g, '')
      .replace(/(\d)\s*mm/gi, '$1')
      .replace(/[−–—]/g, '-')
      .replace(/\s+/g, '')
      .replace(/,/g, '.');
  }

  // „10H8“, „Ø 30 k5“, „20,5 js6“
  T.parseIso = function (str) {
    const s = cleanInput(str);
    if (!s) return { error: 'Gib eine Angabe ein, zum Beispiel 10H8 oder 30k5.' };
    const m = /^(\d+(?:\.\d+)?)([a-z]{1,2}\d{1,2})$/i.exec(s);
    if (!m) {
      if (/^[a-z]{1,2}\d{1,2}$/i.test(s)) return { error: 'Es fehlt das Nennmaß. Schreib es vor die Toleranzklasse, zum Beispiel 10H8.' };
      return { error: 'Die Angabe verstehe ich nicht. Schreib zuerst das Nennmaß, dann Buchstabe und Zahl, zum Beispiel 10H8 oder 30k5.' };
    }
    const c = T.parseClassToken(m[2]);
    if (c.error) return c;
    return Object.assign({ N: parseFloat(m[1]) }, c);
  };

  // „30H7/g6“, „30 H7 g6“, „30g6/H7“
  T.parseFit = function (str) {
    const s = cleanInput(str);
    if (!s) return { error: 'Gib eine Passung ein, zum Beispiel 30H7/g6.' };
    const m = /^(\d+(?:\.\d+)?)([a-z]{1,2}\d{1,2})[\/\-:|]?([a-z]{1,2}\d{1,2})$/i.exec(s);
    if (!m) return { error: 'Die Passung verstehe ich nicht. Schreib Nennmaß, Bohrung und Welle, zum Beispiel 30H7/g6.' };
    let a = m[2], b = m[3], note = '';
    const upA = a[0] === a[0].toUpperCase(), upB = b[0] === b[0].toUpperCase();
    if (upA === upB) {
      // Beide gleich geschrieben: Bei Passungen steht die Bohrung vorne
      a = a.replace(/^[a-z]{1,2}/i, x => x.toUpperCase());
      b = b.replace(/^[a-z]{1,2}/i, x => x.toLowerCase());
      note = `Beide Buchstaben waren gleich geschrieben. Ich habe ${a} als Bohrung und ${b} als Welle gelesen, weil bei Passungen die Bohrung vorne steht.`;
    } else if (!upA) {
      [a, b] = [b, a];
    }
    const hole = T.parseClassToken(a), shaft = T.parseClassToken(b);
    if (hole.error) return hole;
    if (shaft.error) return shaft;
    return { N: parseFloat(m[1]), hole, shaft, note };
  };

  // ---------- ISO-Toleranz berechnen ----------
  T.isoTol = function (N, letter, grade) {
    if (!(N >= 1 && N <= 500)) return { ok: false, error: 'Das Nennmaß muss zwischen 1 und 500 mm liegen.' };
    const ri = T.rangeIdx(N);
    const g = T.gradeNum(grade);
    if (N <= 1 && g >= 14) return { ok: false, error: 'Nach ISO 286-1 sind IT14 bis IT18 für Nennmaße bis 1 mm nicht vorgesehen. Die Toleranz wäre größer als das Teil selbst.' };
    if (N <= 1 && letter === 'N' && g > 8) return { ok: false, error: 'Nach ISO 286-1 ist N über IT8 für Nennmaße bis 1 mm nicht vorgesehen.' };
    const it = T.IT[grade][ri];
    const isHole = letter[0] === letter[0].toUpperCase();
    const l = letter.toLowerCase();
    const rt = T.rangeText(ri);
    const steps = [], notes = [];
    let upper, lower, fund, fundSide, subText = '';
    const f = T.fmt, uS = T.umS, u = T.um;

    // Schritt 1: Bereich
    let s1 = `Das Nennmaß ${f(N)} mm liegt im Bereich <b>${rt}</b>.`;
    if (N === T.RANGES[ri][1] && ri < T.RANGES.length - 1) s1 += ` ${f(N)} mm liegt genau auf der Grenze. Bei „über … bis …“ gehört die obere Zahl noch dazu, deshalb gehört ${f(N)} mm in diesen Bereich und nicht in den nächsten.`;
    if ((l === 'r' || l === 's') && N > 50) {
      const si = T.subIdx(N);
      subText = T.subText(si);
      s1 += ` Für ${letter} ist der Bereich über 50 mm feiner unterteilt: Für das Grundabmaß zählt der Unterbereich <b>${subText}</b>.`;
    }
    steps.push({ t: 'Nennmaßbereich bestimmen', h: s1 });

    // Schritt 2: IT-Wert
    steps.push({ t: 'IT-Wert ablesen', h: `In der Tabelle der Grundtoleranzen steht in der Zeile ${rt} und der Spalte IT${grade} der Wert <b>${u(it)} µm</b>. So breit ist das Toleranzfeld. ${u(it)} µm sind ${T.mm(it / 1000)} mm.` });

    const tableWord = isHole ? 'Bohrung' : 'Welle';
    let s3 = '', s4 = '';
    const half = (g >= 7 && g <= 11 && it % 2 === 1) ? (it - 1) / 2 : it / 2;

    if (l === 'js') {
      fundSide = 'sym';
      upper = half; lower = -half; fund = half;
      s3 = `${letter} bedeutet: Das Toleranzfeld liegt symmetrisch zur Nulllinie, halb darüber und halb darunter. Ein Grundabmaß aus der Tabelle brauchst du nicht. Beide Abmaße sind halb so groß wie der IT-Wert: ${u(it)} µm geteilt durch 2 = ${u(it / 2)} µm.`;
      if (half !== it / 2) s3 += ` Bei IT7 bis IT11 rundet die Norm einen ungeraden IT-Wert auf die nächste gerade Zahl ab, damit ganze Mikrometer herauskommen: ${u(it - 1)} µm geteilt durch 2 = <b>${u(half)} µm</b>. So steht es auch in den Tabellenbüchern.`;
      s4 = `Oberes Abmaß <b>+${u(half)} µm</b>, unteres Abmaß <b>−${u(half)} µm</b>.`;
    } else if (!isHole && ['d', 'e', 'f', 'g', 'h'].includes(l)) {
      fundSide = 'upper';
      upper = T.SHAFT_UPPER[l][ri]; lower = r6(upper - it); fund = upper;
      s3 = l === 'h'
        ? `Der Kleinbuchstabe h steht für eine ${tableWord}. Bei h ist das obere Abmaß immer <b>0 µm</b>. Die Welle wird also nie größer als das Nennmaß.`
        : `Der Kleinbuchstabe ${l} steht für eine ${tableWord}. Bei den Wellen a bis h ist das Grundabmaß das obere Abmaß, denn es liegt der Nulllinie am nächsten. In der Tabelle der Grundabmaße für Wellen steht bei ${l} im Bereich ${rt}: <b>${uS(upper)} µm</b>. Das ist das obere Abmaß.`;
      s4 = `Das untere Abmaß liegt um den IT-Wert tiefer: ${uS(upper)} µm − ${u(it)} µm = <b>${uS(lower)} µm</b>.`;
    } else if (!isHole) {
      fundSide = 'lower';
      if (l === 'k') {
        const kv = T.SHAFT_K[ri];
        lower = (g >= 4 && g <= 7) ? kv : 0;
        s3 = `Der Kleinbuchstabe k steht für eine ${tableWord}. Bei den Wellen k bis zc ist das Grundabmaß das untere Abmaß. Für k steht in der Tabelle nur für IT4 bis IT7 ein Wert, im Bereich ${rt} sind das ${uS(kv)} µm. `;
        s3 += (g >= 4 && g <= 7)
          ? `Dein Grad IT${grade} liegt in diesem Band, also ist das untere Abmaß <b>${uS(lower)} µm</b>.`
          : `Dein Grad IT${grade} liegt außerhalb von IT4 bis IT7. Dann ist das untere Abmaß <b>0 µm</b>.`;
      } else if (l === 'r' || l === 's') {
        lower = N > 50 ? T.SHAFT_RS[l].sub[T.subIdx(N)] : T.SHAFT_RS[l].main[ri];
        s3 = `Der Kleinbuchstabe ${l} steht für eine ${tableWord}. Bei den Wellen k bis zc ist das Grundabmaß das untere Abmaß. In der Tabelle der Grundabmaße für Wellen steht bei ${l} im Bereich ${N > 50 ? subText : rt}: <b>${uS(lower)} µm</b>.`;
      } else {
        lower = T.SHAFT_LOWER[l][ri];
        s3 = `Der Kleinbuchstabe ${l} steht für eine ${tableWord}. Bei den Wellen k bis zc ist das Grundabmaß das untere Abmaß, denn es liegt der Nulllinie am nächsten. In der Tabelle der Grundabmaße für Wellen steht bei ${l} im Bereich ${rt}: <b>${uS(lower)} µm</b>.`;
      }
      fund = lower; upper = r6(lower + it);
      s4 = `Das obere Abmaß liegt um den IT-Wert höher: ${uS(lower)} µm + ${u(it)} µm = <b>${uS(upper)} µm</b>.`;
    } else if (['D', 'E', 'F', 'G', 'H'].includes(letter)) {
      fundSide = 'lower';
      const es = T.SHAFT_UPPER[l][ri];
      lower = r6(-es); fund = lower; upper = r6(lower + it);
      s3 = letter === 'H'
        ? `Der Großbuchstabe H steht für eine Bohrung. Bei H ist das untere Abmaß immer <b>0 µm</b>. Die Bohrung wird also nie kleiner als das Nennmaß.`
        : `Der Großbuchstabe ${letter} steht für eine Bohrung. Bei den Bohrungen A bis H ist das Grundabmaß das untere Abmaß. Es ist genauso groß wie das obere Abmaß der Welle ${l}, nur mit umgedrehtem Vorzeichen. Die Welle ${l} hat im Bereich ${rt} ${uS(es)} µm, also hat die Bohrung ${letter} ein unteres Abmaß von <b>${uS(lower)} µm</b>. Viele Tabellenbücher haben den Wert für ${letter} auch direkt in der Tabelle für Bohrungen.`;
      s4 = `Das obere Abmaß liegt um den IT-Wert höher: ${uS(lower)} µm + ${u(it)} µm = <b>${uS(upper)} µm</b>.`;
    } else {
      // K, M, N, P, R, S
      fundSide = 'upper';
      if (g < 3) return { ok: false, error: `Für ${letter} ist IT${grade} in der Norm nicht vorgesehen. Die Tabellen für ${letter} beginnen bei IT3.` };
      let base; // Grundabmaß der gleichnamigen Welle
      if (l === 'k') base = T.SHAFT_K[ri];
      else if (l === 'r' || l === 's') base = N > 50 ? T.SHAFT_RS[l].sub[T.subIdx(N)] : T.SHAFT_RS[l].main[ri];
      else base = T.SHAFT_LOWER[l][ri];
      const withDelta = (['K', 'M', 'N'].includes(letter) && g <= 8) || (['P', 'R', 'S'].includes(letter) && g <= 7);
      const d = T.delta(grade, ri);
      const baseWhere = (l === 'r' || l === 's') && N > 50 ? subText : rt;
      const baseText = `Die Welle ${l} hat im Bereich ${baseWhere}${l === 'k' ? ' (Spalte IT4 bis IT7)' : ''} ein unteres Abmaß von ${uS(base)} µm. Mit umgedrehtem Vorzeichen: ${uS(-base)} µm.`;
      if (withDelta) {
        const group = ['K', 'M', 'N'].includes(letter) ? 'K, M und N bis IT8' : 'P bis ZC bis IT7';
        s3 = `Der Großbuchstabe ${letter} steht für eine Bohrung. Für ${group} gilt eine Sonderregel: Du nimmst das Grundabmaß der Welle ${l} mit umgedrehtem Vorzeichen und rechnest einen Zuschlag dazu. Das Ergebnis ist das obere Abmaß.<br>${baseText}<br>`;
        if (ri === 0) {
          s3 += `Im Bereich bis 3 mm gibt es keinen Zuschlag. Das obere Abmaß ist <b>${uS(-base)} µm</b>.`;
          upper = r6(-base);
        } else {
          const itA = T.IT[String(g)][ri], itB = T.IT[String(g - 1)][ri];
          upper = r6(-base + d);
          s3 += `Zuschlag: IT${g} minus IT${g - 1} im selben Bereich: ${u(itA)} µm − ${u(itB)} µm = ${u(d)} µm. In vielen Tabellenbüchern steht dieser Zuschlag als Delta in einer eigenen Spalte.<br>Oberes Abmaß: ${uS(-base)} µm + ${u(d)} µm = <b>${uS(upper)} µm</b>.`;
          if (letter === 'M' && g === 6 && ri === 10) {
            upper = -9;
            s3 += ` Sonderfall der Norm: Für M6 im Bereich über 250 bis 315 mm gilt stattdessen <b>−9 µm</b>.`;
          }
        }
      } else if (letter === 'K') {
        upper = 0;
        s3 = `Der Großbuchstabe K steht für eine Bohrung. Bei K ab IT9 ist das obere Abmaß <b>0 µm</b>.`;
      } else if (letter === 'N') {
        upper = ri === 0 ? -4 : 0;
        s3 = ri === 0
          ? `Der Großbuchstabe N steht für eine Bohrung. Bei N ab IT9 im Bereich bis 3 mm ist das obere Abmaß <b>−4 µm</b>.`
          : `Der Großbuchstabe N steht für eine Bohrung. Bei N ab IT9 ist das obere Abmaß <b>0 µm</b>.`;
      } else {
        upper = r6(-base);
        s3 = `Der Großbuchstabe ${letter} steht für eine Bohrung. Das Grundabmaß ist das obere Abmaß. ${letter === 'M' ? 'Ab IT9' : 'Ab IT8'} gibt es keinen Zuschlag: Du nimmst einfach das Grundabmaß der Welle ${l} mit umgedrehtem Vorzeichen.<br>${baseText} Das obere Abmaß ist also <b>${uS(upper)} µm</b>.`;
      }
      fund = upper; lower = r6(upper - it);
      s4 = `Das untere Abmaß liegt um den IT-Wert tiefer: ${uS(upper)} µm − ${u(it)} µm = <b>${uS(lower)} µm</b>.`;
    }

    steps.push({ t: 'Grundabmaß ablesen', h: s3 });
    steps.push({ t: fundSide === 'sym' ? 'Abmaße festlegen' : 'Zweites Abmaß über den IT-Wert', h: s4 });

    const max = r6(N + upper / 1000), min = r6(N + lower / 1000);
    steps.push({
      t: 'Grenzmaße ausrechnen',
      h: `Die Abmaße in Millimeter umrechnen (1000 µm sind 1 mm): ${uS(upper)} µm sind ${T.mmS(upper / 1000)} mm, ${uS(lower)} µm sind ${T.mmS(lower / 1000)} mm.<br>` +
        `Höchstmaß: Nennmaß plus oberes Abmaß: ${T.plusText(N, upper / 1000, 'mm', T.mm).replace(/= ([^ ]+) mm$/, '= <b>$1 mm</b>')}<br>` +
        `Mindestmaß: Nennmaß plus unteres Abmaß: ${T.plusText(N, lower / 1000, 'mm', T.mm).replace(/= ([^ ]+) mm$/, '= <b>$1 mm</b>')}`
    });
    const midDev = r6((upper + lower) / 2), mid = r6(N + midDev / 1000);
    steps.push({
      t: 'Toleranzmitte fürs CNC-Programm',
      h: `Wenn du auf die Mitte des Toleranzfelds zielen willst: Die Mitte zwischen ${uS(upper)} µm und ${uS(lower)} µm liegt bei ${uS(midDev)} µm. Programmiermaß: ${T.plusText(N, midDev / 1000, 'mm', T.mm)}.`
    });

    const cls = letter + grade;
    const common = T.COMMON_CLASSES.includes(cls);
    if (!common) notes.push(`Die Klasse ${cls} steht in vielen Tabellenbüchern nicht fertig ausgerechnet drin. Mit dem Rechenweg bekommst du sie trotzdem aus den Grundtabellen.`);

    return {
      ok: true, N, letter, grade, cls, isHole, ri, rangeText: rt, subText, it, g,
      fundSide, fund, upper, lower, max, min, midDev, mid, common, steps, notes,
      code: T.fmt(N) + ' ' + cls
    };
  };

  T.isoFromString = function (str) {
    const p = T.parseIso(str);
    if (p.error) return { ok: false, error: p.error };
    return T.isoTol(p.N, p.letter, p.grade);
  };

  // ---------- Passungen ----------
  T.fitCalc = function (N, hc, sc) {
    const H = T.isoTol(N, hc.letter, hc.grade);
    if (!H.ok) return H;
    const S = T.isoTol(N, sc.letter, sc.grade);
    if (!S.ok) return S;
    const maxC = r6(H.upper - S.lower), minC = r6(H.lower - S.upper); // µm, positiv = Spiel
    const type = minC >= 0 ? 'spiel' : maxC <= 0 ? 'press' : 'uebergang';
    const system = hc.letter === 'H' && sc.letter === 'h' ? 'beide' : hc.letter === 'H' ? 'EB' : sc.letter === 'h' ? 'EW' : 'keins';
    let equiv = null;
    if (system === 'EB') equiv = { hole: { letter: sc.letter.toUpperCase(), grade: hc.grade }, shaft: { letter: 'h', grade: sc.grade } };
    if (system === 'EW') equiv = { hole: { letter: 'H', grade: hc.grade }, shaft: { letter: hc.letter.toLowerCase(), grade: sc.grade } };

    const mm = T.mm, f = T.fmt;
    const d1 = r6(maxC / 1000), d2 = r6(minC / 1000);
    const steps = [
      { t: `Bohrung ${f(N)} ${H.cls}`, h: `Oberes Abmaß ${T.umS(H.upper)} µm, unteres Abmaß ${T.umS(H.lower)} µm. Höchstmaß <b>${mm(H.max)} mm</b>, Mindestmaß <b>${mm(H.min)} mm</b>. Den ausführlichen Weg siehst du, wenn du ${H.cls} einzeln rechnest.` },
      { t: `Welle ${f(N)} ${S.cls}`, h: `Oberes Abmaß ${T.umS(S.upper)} µm, unteres Abmaß ${T.umS(S.lower)} µm. Höchstmaß <b>${mm(S.max)} mm</b>, Mindestmaß <b>${mm(S.min)} mm</b>.` },
      { t: 'Größte Bohrung minus kleinste Welle', h: `${mm(H.max)} mm − ${mm(S.min)} mm = <b>${T.mmS(d1)} mm</b>. ${d1 > 0 ? 'Positiv heißt: Hier bleibt Spiel.' : d1 < 0 ? 'Negativ heißt: Selbst hier ist die Welle größer, es gibt Übermaß.' : 'Null heißt: Die Teile sind hier genau gleich groß.'}` },
      { t: 'Kleinste Bohrung minus größte Welle', h: `${mm(H.min)} mm − ${mm(S.max)} mm = <b>${T.mmS(d2)} mm</b>. ${d2 > 0 ? 'Positiv heißt: Auch hier bleibt Spiel.' : d2 < 0 ? 'Negativ heißt: Hier ist die Welle größer als die Bohrung, es gibt Übermaß.' : 'Null heißt: Die Teile sind hier genau gleich groß.'}` }
    ];
    let a, b, la, lb, verdict;
    if (type === 'spiel') {
      la = 'Höchstspiel'; a = d1; lb = 'Mindestspiel'; b = d2;
      verdict = `Beide Ergebnisse sind positiv oder null. Die Bohrung ist also immer mindestens so groß wie die Welle: <b>Spielpassung</b>. Höchstspiel ${mm(a)} mm, Mindestspiel ${mm(b)} mm.`;
    } else if (type === 'press') {
      la = 'Höchstübermaß'; a = r6(-d2); lb = 'Mindestübermaß'; b = r6(-d1);
      verdict = `Beide Ergebnisse sind negativ oder null. Die Welle ist also immer mindestens so groß wie die Bohrung: <b>Übermaßpassung (Presspassung)</b>. Ein negatives Spiel nennt man Übermaß: Höchstübermaß ${mm(a)} mm, Mindestübermaß ${mm(b)} mm.`;
    } else {
      la = 'Höchstspiel'; a = d1; lb = 'Höchstübermaß'; b = r6(-d2);
      verdict = `Ein Ergebnis ist positiv, das andere negativ. Je nachdem, wie Bohrung und Welle ausfallen, gibt es Spiel oder Übermaß: <b>Übergangspassung</b>. Höchstspiel ${mm(a)} mm, Höchstübermaß ${mm(b)} mm.`;
    }
    steps.push({ t: 'Passungsart bestimmen', h: verdict });
    const pt = r6(H.it + S.it);
    steps.push({ t: 'Passtoleranz', h: `So stark kann das Spiel zwischen zwei Paarungen schwanken: IT-Wert der Bohrung plus IT-Wert der Welle: ${T.um(H.it)} µm + ${T.um(S.it)} µm = ${T.um(pt)} µm, also ${mm(pt / 1000)} mm.` });

    return { ok: true, N, H, S, maxC, minC, type, system, equiv, la, a, lb, b, steps, passTol: pt };
  };

  // Zwei getrennte Felder: Bohrung und Welle. Das Nennmaß reicht in einem Feld.
  T.parseFitParts = function (holeStr, shaftStr) {
    const one = (str, isHole) => {
      const s = cleanInput(str);
      if (!s) return { empty: true };
      const m = /^(\d+(?:\.\d+)?)?([a-z]{1,2})(\d{1,2})$/i.exec(s);
      if (!m) return { error: isHole ? 'Die Bohrung verstehe ich nicht. Schreib zum Beispiel 30H7 oder H7.' : 'Die Welle verstehe ich nicht. Schreib zum Beispiel 30g6 oder g6.' };
      const typed = m[2];
      const L = isHole ? typed.toUpperCase() : typed.toLowerCase();
      const c = T.parseClassToken(L + m[3]);
      if (c.error) return c;
      const note = typed !== L ? `Im Feld ${isHole ? 'Bohrung' : 'Welle'} habe ich ${typed}${m[3]} als ${L}${c.grade} gelesen, weil ${isHole ? 'Bohrungen Großbuchstaben' : 'Wellen Kleinbuchstaben'} haben.` : '';
      return Object.assign({ N: m[1] ? parseFloat(m[1]) : null, note }, c);
    };
    const h = one(holeStr, true), w = one(shaftStr, false);
    if (h.empty) return { error: 'Trag die Bohrung ein, zum Beispiel 30H7.' };
    if (w.empty) return { error: 'Trag die Welle ein, zum Beispiel g6.' };
    if (h.error) return h;
    if (w.error) return w;
    if (h.N == null && w.N == null) return { error: 'Es fehlt das Nennmaß. Schreib es in eines der beiden Felder, zum Beispiel 30H7.' };
    if (h.N != null && w.N != null && h.N !== w.N) return { error: `Bohrung und Welle haben verschiedene Nennmaße (${T.fmt(h.N)} mm und ${T.fmt(w.N)} mm). Bei einer Passung ist das Nennmaß gleich.` };
    return { N: h.N != null ? h.N : w.N, hole: { letter: h.letter, grade: h.grade }, shaft: { letter: w.letter, grade: w.grade }, note: [h.note, w.note].filter(Boolean).join(' ') };
  };
  T.fitFromParts = function (holeStr, shaftStr) {
    const p = T.parseFitParts(holeStr, shaftStr);
    if (p.error) return { ok: false, error: p.error };
    const r = T.fitCalc(p.N, p.hole, p.shaft);
    if (r.ok) r.note = p.note;
    return r;
  };

  T.fitFromString = function (str) {
    const p = T.parseFit(str);
    if (p.error) return { ok: false, error: p.error };
    const r = T.fitCalc(p.N, p.hole, p.shaft);
    if (r.ok) r.note = p.note;
    return r;
  };

  // ---------- Allgemeintoleranzen ISO 2768 ----------
  function findRange(ranges, x, firstIncl) {
    for (let i = 0; i < ranges.length; i++) {
      const [lo, hi] = ranges[i];
      if ((i === 0 && firstIncl ? x >= lo : x > lo) && x <= hi) return i;
    }
    return -1;
  }
  T.findRange = findRange;
  const rtx = (ranges, i, firstFrom) => {
    const [lo, hi] = ranges[i];
    if (hi === Infinity) return `über ${T.fmt(lo)} mm`;
    if (i === 0) return firstFrom ? `${T.fmt(lo)} bis ${T.fmt(hi)} mm` : `bis ${T.fmt(hi)} mm`;
    return `über ${T.fmt(lo)} bis ${T.fmt(hi)} mm`;
  };
  T.linRangeText = i => rtx(T.LIN2768.ranges, i, true);
  T.radRangeText = i => rtx(T.RAD2768.ranges, i, true);
  T.angRangeText = i => rtx(T.ANG2768.ranges, i, false);
  T.strRangeText = i => rtx(T.STRAIGHT2768.ranges, i, false);
  T.perpRangeText = i => rtx(T.PERP2768.ranges, i, false);
  T.linIdx = N => findRange(T.LIN2768.ranges, N, true);
  T.radIdx = N => findRange(T.RAD2768.ranges, N, true);
  T.angIdx = L => findRange(T.ANG2768.ranges, L, false);
  T.strIdx = L => findRange(T.STRAIGHT2768.ranges, L, false);
  T.perpIdx = L => findRange(T.PERP2768.ranges, L, false);

  const boundaryNote = (x, ranges, i) =>
    (x === ranges[i][1] && i < ranges.length - 1) ? ` ${T.fmt(x)} mm liegt genau auf der Grenze. Die obere Zahl eines Bereichs gehört noch dazu.` : '';

  // Grenzabmaß für Längenmaße ('len') oder Radien/Fasen ('rad')
  T.lin2768 = function (N, cls, kind = 'len') {
    const tab = kind === 'rad' ? T.RAD2768 : T.LIN2768;
    const name = T.CLASS_ML[cls];
    if (!(N > 0)) return { ok: false, error: 'Gib ein Maß größer als 0 ein.' };
    if (N < 0.5) return { ok: false, error: 'Für Maße unter 0,5 mm legt ISO 2768-1 keine Allgemeintoleranz fest. Die Abweichung muss dann direkt am Maß stehen.' };
    const i = findRange(tab.ranges, N, true);
    if (i < 0) return { ok: false, error: 'Die Tabelle für Längenmaße reicht bis 4000 mm.' };
    const rt = rtx(tab.ranges, i, true);
    const dev = tab[cls][i];
    if (dev == null) return { ok: false, error: `In der Klasse ${cls} (${name}) ist für den Bereich ${rt} kein Wert festgelegt. Hier muss die Toleranz direkt am Maß stehen.` };
    const dec = Math.max(T.decimals(dev), T.decimals(N));
    const F = x => T.fmt(x, dec, 4);
    const max = r6(N + dev), min = r6(N - dev), tol = r6(2 * dev);
    const what = kind === 'rad' ? 'Rundungshalbmesser und Fasenhöhen' : 'Längenmaße';
    const steps = [
      { t: 'Toleranzklasse', h: `Im Schriftfeld steht der Kleinbuchstabe <b>${cls}</b>, also die Klasse ${name}.` },
      { t: 'Nennmaßbereich bestimmen', h: `${T.fmt(N)} mm liegt im Bereich <b>${rt}</b>.${boundaryNote(N, tab.ranges, i)}` },
      { t: 'Grenzabmaß ablesen', h: `In der Tabelle für ${what} steht in der Zeile ${rt} und der Spalte ${name}: <b>±${T.fmt(dev)} mm</b>.` },
      { t: 'Grenzmaße ausrechnen', h: `Höchstmaß: ${F(N)} mm + ${F(dev)} mm = <b>${F(max)} mm</b><br>Mindestmaß: ${F(N)} mm − ${F(dev)} mm = <b>${F(min)} mm</b>` },
      { t: 'Toleranz', h: `Höchstmaß minus Mindestmaß: ${F(max)} mm − ${F(min)} mm = <b>${F(tol)} mm</b>.` }
    ];
    return { ok: true, N, cls, kind, dev, max, min, tol, rangeText: rt, idx: i, steps, dec };
  };

  T.dm = function (totalMin) {
    const t = Math.round(Math.abs(totalMin) * 100) / 100;
    const d = Math.floor(t / 60), m = r6(t - d * 60);
    return `${d}° ${T.fmt(m, 0, 2).padStart(2, '0')}′`;
  };
  T.devText = function (min) {
    const d = Math.floor(min / 60), m = min % 60;
    return m === 0 ? `±${d}°` : `±${d}° ${m}′`;
  };

  T.angle2768 = function (L, cls, nominal) {
    const name = T.CLASS_ML[cls];
    if (!(L > 0)) return { ok: false, error: 'Gib die Länge des kürzeren Schenkels in mm ein.' };
    const i = T.angIdx(L);
    const rt = T.angRangeText(i);
    const min = T.ANG2768[cls][i];
    const dec = r6(min / 60);
    const text = T.devText(min);
    const off = L * Math.tan(dec * Math.PI / 180);
    const steps = [
      { t: 'Kürzeren Schenkel nehmen', h: `Für die Winkeltoleranz zählt die Länge des kürzeren Schenkels: <b>${T.fmt(L)} mm</b>.` },
      { t: 'Längenbereich bestimmen', h: `${T.fmt(L)} mm liegt im Bereich <b>${rt}</b>.${boundaryNote(L, T.ANG2768.ranges, i)}` },
      { t: 'Abweichung ablesen', h: `In der Tabelle für Winkelmaße steht in der Zeile ${rt} und der Spalte ${name}: <b>${text}</b>. Das sind ${min} Winkelminuten. 60 Minuten sind 1 Grad, also ${min} geteilt durch 60 = ${T.fmt(dec, 0, 3)}°.` }
    ];
    let maxA = null, minA = null;
    if (nominal != null && isFinite(nominal) && nominal > 0) {
      const nm = Math.round(nominal * 60);
      maxA = nm + min; minA = nm - min;
      steps.push({ t: 'Größt- und Kleinstwinkel', h: `Größtwinkel: ${T.dm(nm)} + ${min} Minuten = <b>${T.dm(maxA)}</b><br>Kleinstwinkel: ${T.dm(nm)} − ${min} Minuten = <b>${T.dm(minA)}</b>${min >= 60 || nm % 60 < min ? '<br>Denk beim Rechnen daran: 60 Minuten sind 1 Grad.' : ''}` });
    }
    steps.push({ t: 'Was das am Werkstück heißt', h: `Am Ende des ${T.fmt(L)} mm langen Schenkels darf die Kante dadurch etwa <b>${T.fmt(off, 2, 3)} mm</b> seitlich abweichen. Das ist die Schenkellänge mal Tangens von ${T.fmt(dec, 0, 3)}°. So kannst du den Winkel auch mit Messuhr oder Höhenmessgerät prüfen.` });
    return { ok: true, L, cls, min, dec, text, off, maxA, minA, rangeText: rt, steps };
  };

  // ---------- Form und Lage (ISO 2768-2) ----------
  T.GEO_PROPS = ['geradheit', 'ebenheit', 'rundheit', 'rechtwinkligkeit', 'parallelitaet', 'position', 'rundlauf'];
  T.GEO_INFO = {
    geradheit: {
      name: 'Geradheit', art: 'Formtoleranz',
      bedeutung: 'Die tolerierte Linie muss zwischen zwei parallelen Geraden liegen. Ihr Abstand ist der Toleranzwert.',
      bezug: 'Kein Bezug nötig. Die Toleranz gilt für die Linie selbst, zum Beispiel eine Kante, eine Mantellinie oder die Achse eines Zapfens.',
      praxis: 'Eine lange, dünne Leiste verzieht sich nach dem Fräsen, weil Spannungen frei werden. Die Geradheit sagt, wie stark sie sich höchstens durchbiegen darf.'
    },
    ebenheit: {
      name: 'Ebenheit', art: 'Formtoleranz',
      bedeutung: 'Die Fläche muss zwischen zwei parallelen Ebenen liegen. Ihr Abstand ist der Toleranzwert.',
      bezug: 'Kein Bezug nötig. Die Toleranz gilt für die ganze Fläche. Für die Tabelle zählt die längere Seite der Fläche, bei einer runden Fläche der Durchmesser.',
      praxis: 'Eine gefräste Auflagefläche: Du fährst sie mit der Messuhr ab. Die Anzeige darf höchstens um den Toleranzwert schwanken, wenn das Teil richtig ausgerichtet ist.'
    },
    rundheit: {
      name: 'Rundheit', art: 'Formtoleranz',
      bedeutung: 'In jedem Querschnitt muss der Umfang zwischen zwei Kreisen mit gleichem Mittelpunkt liegen. Ihre Radien unterscheiden sich um den Toleranzwert.',
      bezug: 'Kein Bezug nötig. Die Toleranz gilt für jeden einzelnen Querschnitt einer Bohrung oder eines Zapfens.',
      praxis: 'Beim Zirkularfräsen entsteht durch Umkehrspiel der Achsen oft eine leicht unrunde Bohrung. Die Rundheit begrenzt das.'
    },
    rechtwinkligkeit: {
      name: 'Rechtwinkligkeit', art: 'Richtungstoleranz (Lagetoleranz)',
      bedeutung: 'Das tolerierte Element muss zwischen zwei parallelen Ebenen liegen, die genau rechtwinklig zum Bezug stehen. Ihr Abstand ist der Toleranzwert.',
      bezug: 'Braucht einen Bezug. Bei der Allgemeintoleranz ist das längere der beiden Elemente der Bezug. Das kürzere wird toleriert, und seine Länge zählt für die Tabelle.',
      praxis: 'Die Seitenwand eines Winkels soll senkrecht zur Grundfläche stehen. Du legst die lange Grundfläche auf und prüfst die kurze Wand mit Anschlagwinkel oder Messuhr.'
    },
    parallelitaet: {
      name: 'Parallelität', art: 'Richtungstoleranz (Lagetoleranz)',
      bedeutung: 'Das tolerierte Element muss zwischen zwei Ebenen liegen, die parallel zum Bezug sind. Ihr Abstand ist der Toleranzwert.',
      bezug: 'Braucht einen Bezug. Bei der Allgemeintoleranz ist das längere der beiden Elemente der Bezug.',
      praxis: 'Ober- und Unterseite einer Platte: Du legst die Unterseite auf die Messplatte und fährst die Oberseite mit der Messuhr ab.'
    },
    position: {
      name: 'Position', art: 'Ortstoleranz (Lagetoleranz)',
      bedeutung: 'Die Mitte oder Achse eines Elements, zum Beispiel einer Bohrung, muss in einer Zone um die genaue Sollposition liegen. Mit Positionstoleranz ist das meist ein Kreis mit dem Toleranzwert als Durchmesser.',
      bezug: 'Braucht Bezüge, meist zwei oder drei Flächen, von denen aus die Sollposition bemaßt ist. In der Praxis sind das oft die Kanten, an denen du das Teil antastest.',
      praxis: 'Die Lage einer Bohrung, gemessen von zwei Anlagekanten. Steht keine Positionstoleranz auf der Zeichnung, begrenzen in der Werkstattpraxis nur die Freimaßtoleranzen der beiden Abstandsmaße die Lage. Das ist keine echte Positionstoleranz. Kommt es auf die Lage an, gehört eine Positionstoleranz auf die Zeichnung.'
    },
    rundlauf: {
      name: 'Rundlauf', art: 'Lauftoleranz (Lagetoleranz)',
      bedeutung: 'Beim Drehen des Teils um die Bezugsachse darf die Messuhr in jedem Querschnitt höchstens um den Toleranzwert ausschlagen.',
      bezug: 'Braucht eine Bezugsachse. Bei der Allgemeintoleranz sind das die Lagerstellen, wenn sie als Bezug angegeben sind, sonst das längere der beiden Elemente.',
      praxis: 'Ein Absatz an einer Welle: Du spannst die Welle an den Lagerstellen zwischen Spitzen oder im Prisma, drehst sie und liest die Schwankung an der Messuhr ab.'
    }
  };

  T.geo2768 = function (prop, inp, cls, hkl) {
    const info = T.GEO_INFO[prop];
    const hn = T.CLASS_HKL[hkl];
    const steps = [{ t: 'Toleranzklasse', h: `Im Schriftfeld steht der Großbuchstabe <b>${hkl}</b> (${hn}). Er gilt für Form und Lage nach ISO 2768-2.` }];
    const f = x => T.fmt(x, 0, 3);
    const lookupStraight = (L, what) => {
      if (!(L > 0)) return { error: `Gib die ${what} in mm ein.` };
      const i = T.strIdx(L);
      if (i < 0) return { error: 'Die Tabelle für Geradheit und Ebenheit reicht bis 3000 mm.' };
      return { i, v: T.STRAIGHT2768[hkl][i], rt: T.strRangeText(i) };
    };
    const sizeTol = (D, own, what) => {
      if (own != null && isFinite(own) && own > 0) {
        return { v: own, h: `Das ${what} hat eine eigene Toleranz. Ihre Breite ist <b>${f(own)} mm</b>.` };
      }
      const r = T.lin2768(D, cls, 'len');
      if (!r.ok) return { error: r.error };
      return { v: r.tol, h: `Das ${what} ${T.fmt(D)} mm hat keine eigene Toleranz, also gilt ISO 2768-1 Klasse ${cls}: ±${T.fmt(r.dev)} mm. Die Toleranzbreite ist ${T.fmt(r.dev)} mm + ${T.fmt(r.dev)} mm = <b>${f(r.tol)} mm</b>.` };
    };
    let value, valueText, extra = null;

    if (prop === 'geradheit' || prop === 'ebenheit') {
      const what = prop === 'geradheit' ? 'Länge der Linie' : 'längere Seite der Fläche';
      const r = lookupStraight(inp.len, what);
      if (r.error) return { ok: false, error: r.error };
      steps.push({ t: 'Maßgebende Länge', h: prop === 'geradheit' ? `Für die Geradheit zählt die Länge der tolerierten Linie: <b>${T.fmt(inp.len)} mm</b>.` : `Für die Ebenheit zählt die längere Seite der Fläche, bei einer runden Fläche der Durchmesser: <b>${T.fmt(inp.len)} mm</b>.` });
      steps.push({ t: 'Längenbereich bestimmen', h: `${T.fmt(inp.len)} mm liegt im Bereich <b>${r.rt}</b>.${boundaryNote(inp.len, T.STRAIGHT2768.ranges, r.i)}` });
      steps.push({ t: 'Wert ablesen', h: `In der Tabelle für Geradheit und Ebenheit steht in der Zeile ${r.rt} und der Spalte ${hkl}: <b>${f(r.v)} mm</b>.` });
      value = r.v;
    } else if (prop === 'rechtwinkligkeit') {
      if (!(inp.len > 0)) return { ok: false, error: 'Gib die Länge des kürzeren Schenkels in mm ein.' };
      const i = T.perpIdx(inp.len);
      if (i < 0) return { ok: false, error: 'Die Tabelle für Rechtwinkligkeit reicht bis 3000 mm.' };
      const rt = T.perpRangeText(i);
      value = T.PERP2768[hkl][i];
      steps.push({ t: 'Bezug und Länge', h: `Das längere Element ist der Bezug. Toleriert wird das kürzere, und seine Länge zählt: <b>${T.fmt(inp.len)} mm</b>.` });
      steps.push({ t: 'Längenbereich bestimmen', h: `${T.fmt(inp.len)} mm liegt im Bereich <b>${rt}</b>.${boundaryNote(inp.len, T.PERP2768.ranges, i)}` });
      steps.push({ t: 'Wert ablesen', h: `In der Tabelle für Rechtwinkligkeit steht in der Zeile ${rt} und der Spalte ${hkl}: <b>${f(value)} mm</b>.` });
    } else if (prop === 'rundheit') {
      if (!(inp.dia > 0)) return { ok: false, error: 'Gib den Durchmesser in mm ein.' };
      const s = sizeTol(inp.dia, inp.own, 'Durchmessermaß');
      if (s.error) return { ok: false, error: s.error };
      const run = T.RUN2768[hkl];
      value = Math.min(s.v, run);
      steps.push({ t: 'Regel', h: 'Für die Rundheit gibt es keine eigene Tabelle. Sie ist so groß wie die Toleranz des Durchmessers, darf aber nicht größer sein als die Rundlauftoleranz.' });
      steps.push({ t: 'Durchmessertoleranz', h: s.h });
      steps.push({ t: 'Rundlauftoleranz', h: `In der Tabelle für Lauf steht in der Spalte ${hkl}: <b>${f(run)} mm</b>.` });
      steps.push({ t: 'Kleineren Wert nehmen', h: `${f(s.v)} mm oder ${f(run)} mm, der kleinere Wert gilt: <b>${f(value)} mm</b>.` });
    } else if (prop === 'parallelitaet') {
      if (!(inp.dist > 0)) return { ok: false, error: 'Gib den Abstand der beiden Flächen in mm ein.' };
      const s = sizeTol(inp.dist, inp.own, 'Abstandsmaß');
      if (s.error) return { ok: false, error: s.error };
      const r = lookupStraight(inp.len, 'Länge der Fläche');
      if (r.error) return { ok: false, error: r.error };
      value = Math.max(s.v, r.v);
      steps.push({ t: 'Regel', h: 'Für die Parallelität gibt es keine eigene Tabelle. Sie ist so groß wie die Maßtoleranz des Abstands oder die Ebenheitstoleranz, je nachdem, welcher Wert größer ist. Das längere Element ist der Bezug.' });
      steps.push({ t: 'Maßtoleranz des Abstands', h: s.h });
      steps.push({ t: 'Ebenheitstoleranz', h: `Die Fläche ist ${T.fmt(inp.len)} mm lang, Bereich ${r.rt}. In der Tabelle für Geradheit und Ebenheit steht in der Spalte ${hkl}: <b>${f(r.v)} mm</b>.` });
      steps.push({ t: 'Größeren Wert nehmen', h: `${f(s.v)} mm oder ${f(r.v)} mm, der größere Wert gilt: <b>${f(value)} mm</b>.` });
    } else if (prop === 'position') {
      if (!(inp.x > 0)) return { ok: false, error: 'Gib den Abstand der Bohrungsmitte von der ersten Bezugskante in mm ein.' };
      const rx = T.lin2768(inp.x, cls, 'len');
      if (!rx.ok) return { ok: false, error: rx.error };
      let ry = null;
      if (inp.y > 0) { ry = T.lin2768(inp.y, cls, 'len'); if (!ry.ok) return { ok: false, error: ry.error }; }
      steps.push({ t: 'Regel', h: 'ISO 2768-2 legt keine Positionstoleranz fest. Ohne Positionstoleranz auf der Zeichnung begrenzen in der Werkstattpraxis die Freimaßtoleranzen der Abstandsmaße nach ISO 2768-1 die Lage (Kleinbuchstabe im Schriftfeld). Streng genommen ist das keine Positionstoleranz: Nach ISO 14405-2 sind Plus-Minus-Toleranzen an Abständen nicht eindeutig. Die Werte unten sind deshalb eine Orientierung, keine Positionstoleranz.' });
      steps.push({ t: 'Abstand 1', h: `${T.fmt(inp.x)} mm, Bereich ${rx.rangeText}, Klasse ${cls}: <b>±${T.fmt(rx.dev)} mm</b>.` });
      if (ry) steps.push({ t: 'Abstand 2', h: `${T.fmt(inp.y)} mm, Bereich ${ry.rangeText}, Klasse ${cls}: <b>±${T.fmt(ry.dev)} mm</b>.` });
      const w1 = r6(2 * rx.dev), w2 = ry ? r6(2 * ry.dev) : null;
      steps.push({ t: 'Form der Zone', h: ry ? `Die Mitte darf in einem Rechteck von ${f(w1)} mm mal ${f(w2)} mm liegen. Eine Positionstoleranz mit Kreiszone wäre dagegen in alle Richtungen gleich groß.` : `In dieser Richtung darf die Mitte in einem Streifen von ${f(w1)} mm Breite liegen.` });
      value = rx.dev;
      valueText = ry ? `±${T.fmt(rx.dev)} / ±${T.fmt(ry.dev)} mm` : `±${T.fmt(rx.dev)} mm`;
      extra = { dx: rx.dev, dy: ry ? ry.dev : null };
    } else if (prop === 'rundlauf') {
      value = T.RUN2768[hkl];
      steps.push({ t: 'Wert ablesen', h: `Für Lauf (Rundlauf und Planlauf) gibt es nur einen Wert je Klasse, unabhängig von der Größe. In der Spalte ${hkl} steht <b>${f(value)} mm</b>.` });
    } else {
      return { ok: false, error: 'Unbekannte Eigenschaft.' };
    }
    return { ok: true, prop, info, value, valueText: valueText || `${f(value)} mm`, steps, extra };
  };

  // ---------- ISO 22081 ----------
  T.profile22081 = function (N, t, mode) {
    if (!(N > 0)) return { ok: false, error: 'Gib das Nennmaß in mm ein.' };
    if (!(t > 0)) return { ok: false, error: 'Gib die Profiltoleranz aus der Zeichnung in mm ein.' };
    const half = r6(t / 2), dev = mode === 'zwischen' ? t : half;
    const dec = Math.max(T.decimals(half), T.decimals(N), T.decimals(dev));
    const F = x => T.fmt(x, dec, 4);
    const max = r6(N + dev), min = r6(N - dev);
    const steps = [
      { t: 'Angabe lesen', h: `Die Zeichnung verlangt eine allgemeine Profiltoleranz von <b>${T.fmt(t)} mm</b>. Das ist die Breite der Zone, in der jede Fläche ohne eigene Angabe liegen muss.` },
      { t: 'Zone halbieren', h: `Die Zone liegt mittig um die Sollfläche aus Zeichnung oder CAD-Modell: ${T.fmt(t)} mm geteilt durch 2 = <b>${T.fmt(half)} mm</b> nach jeder Seite.` }
    ];
    if (mode === 'zwischen') {
      steps.push({ t: 'Zwei Flächen ohne Bezug', h: `Beide Flächen dürfen je ${T.fmt(half)} mm wandern, im ungünstigsten Fall in entgegengesetzte Richtungen. Der Abstand zwischen ihnen kann sich also um ${T.fmt(half)} mm + ${T.fmt(half)} mm = <b>${T.fmt(dev)} mm</b> ändern. Das ist eine Abschätzung für den ungünstigsten Fall. Ist der Abstand ein Größenmaß wie eine Wanddicke und steht eine allgemeine Größenmaßtoleranz auf der Zeichnung, gilt für das Maß selbst diese.` });
    } else {
      steps.push({ t: 'Abstand vom Bezug', h: `Jeder Punkt der Fläche muss in dieser Zone liegen. Gemessen vom Bezug aus darf also jeder Punkt höchstens <b>±${T.fmt(dev)} mm</b> von seiner Sollposition abweichen. Das gilt nur für den Abstand zu einem Bezug der Angabe, nicht für beliebige Maße auf der Zeichnung.` });
    }
    steps.push({ t: 'Grenzmaße ausrechnen', h: `Höchstmaß: ${F(N)} mm + ${F(dev)} mm = <b>${F(max)} mm</b><br>Mindestmaß: ${F(N)} mm − ${F(dev)} mm = <b>${F(min)} mm</b>` });
    return { ok: true, N, t, half, dev, max, min, mode, steps, dec };
  };

  T.size22081 = function (N, dev) {
    if (!(N > 0)) return { ok: false, error: 'Gib das Nennmaß in mm ein.' };
    if (!(dev > 0)) return { ok: false, error: 'Gib die allgemeine Größenmaßtoleranz aus der Zeichnung ein, zum Beispiel 0,1 für ±0,1 mm.' };
    const dec = Math.max(T.decimals(dev), T.decimals(N));
    const F = x => T.fmt(x, dec, 4);
    const max = r6(N + dev), min = r6(N - dev);
    const steps = [
      { t: 'Angabe lesen', h: `Die allgemeine Größenmaßtoleranz <b>±${T.fmt(dev)} mm</b> gilt für Größenmaße ohne eigene Angabe, also für Durchmesser, Nutbreiten, Absatzbreiten und Dicken. Abstände zwischen Flächen regelt dagegen die Profiltoleranz.` },
      { t: 'Grenzmaße ausrechnen', h: `Höchstmaß: ${F(N)} mm + ${F(dev)} mm = <b>${F(max)} mm</b><br>Mindestmaß: ${F(N)} mm − ${F(dev)} mm = <b>${F(min)} mm</b>` }
    ];
    return { ok: true, N, dev, max, min, tol: r6(2 * dev), steps, dec };
  };

  // ---------- Maßketten (arithmetisch, Worst Case) ----------
  T.chain = function (rows) {
    const list = rows.filter(r => r && r.valid);
    if (!list.length) return { ok: false, error: 'Gib mindestens ein Maß ein.' };
    let dec = 0;
    list.forEach(r => { dec = Math.max(dec, T.decimals(r.N), T.decimals(r.up), T.decimals(r.lo)); });
    dec = Math.min(dec, 4);
    const F = x => T.fmt(x, dec, 4);
    let N = 0, max = 0, min = 0, tol = 0;
    const partsN = [], partsMax = [], partsMin = [], partsT = [];
    list.forEach((r, i) => {
      const hi = r6(r.N + r.up), lo = r6(r.N + r.lo);
      const sign = (i === 0 && r.op > 0) ? '' : (r.op > 0 ? ' + ' : ' − ');
      const lead = (i === 0 && r.op < 0) ? '−' : '';
      N = r6(N + r.op * r.N);
      if (r.op > 0) { max = r6(max + hi); min = r6(min + lo); } else { max = r6(max - lo); min = r6(min - hi); }
      tol = r6(tol + (r.up - r.lo));
      partsN.push(`${sign}${lead}${F(r.N)}`);
      partsMax.push(`${sign}${lead}${F(r.op > 0 ? hi : lo)}`);
      partsMin.push(`${sign}${lead}${F(r.op > 0 ? lo : hi)}`);
      partsT.push(`${i ? ' + ' : ''}${F(r6(r.up - r.lo))}`);
    });
    const es = r6(max - N), ei = r6(min - N);
    const hasMinus = list.some(r => r.op < 0);
    const steps = [
      { t: 'Nennmaß der Summe', h: `Nennmaße mit ihrem Rechenzeichen zusammenrechnen: ${partsN.join('')} = <b>${F(N)} mm</b>.` },
      { t: 'Höchstmaß', h: `Für das größte Ergebnis nimmst du bei jedem addierten Maß das Höchstmaß${hasMinus ? ' und bei jedem abgezogenen Maß das Mindestmaß, denn wer weniger abzieht, behält mehr' : ''}: ${partsMax.join('')} = <b>${F(max)} mm</b>.` },
      { t: 'Mindestmaß', h: `Für das kleinste Ergebnis ist es umgekehrt: addierte Maße mit ihrem Mindestmaß${hasMinus ? ', abgezogene Maße mit ihrem Höchstmaß' : ''}: ${partsMin.join('')} = <b>${F(min)} mm</b>.` },
      { t: 'Gesamttoleranz', h: `Höchstmaß minus Mindestmaß: ${F(max)} mm − ${F(min)} mm = <b>${F(r6(max - min))} mm</b>. Probe: Die Einzeltoleranzen zusammengezählt ergeben ${partsT.join('')} = ${F(tol)} mm. Toleranzen werden immer addiert, auch bei abgezogenen Maßen.` },
      { t: 'Ergebnis als Maß mit Abmaßen', h: `${F(N)} mm mit oberem Abmaß ${T.fmtS(es, dec, 4)} mm und unterem Abmaß ${T.fmtS(ei, dec, 4)} mm.` }
    ];
    return { ok: true, N, max, min, tol, es, ei, dec, steps, count: list.length };
  };

  // ---------- Maße aus dem Text einer Zeichnung (Foto oder eingefügter Text) ----------
  const DIA = '[Øø⌀∅ΦφΘ@]';
  const NUM = '\\d{1,4}(?:[.,]\\d{1,3})?';
  const DEV = '\\d{1,2}(?:[.,]\\d{1,3})?';
  const TITLE_WORDS = /stab\b|maßstab|massstab|datum|blatt|zeichn|nr\.|nummer|gewicht|\bkg\b|werkstoff|material|gepr|bearb|name|index|menge|stück|stueck|format|oberfläche|oberflaeche|kante|teil|benennung/i;
  const num = x => parseFloat(String(x).replace(',', '.').replace(/\s+/g, ''));

  T.normalizeOcr = s => String(s || '')
    .replace(/[“”„"'`´\[\]{}|]/g, '')
    .replace(/[−–—‒]/g, '-')
    .replace(/(^|\s)[-_~=]+(?=[A-Za-zØ])/g, '$1')                     // Reste der Maßlinie vor und hinter dem Text
    .replace(/([A-Za-z0-9°])[-_~=]+(?=\s|$)/g, '$1')
    // „1SO“ oder „IS0“ ist ISO; die Zahl 150 aber nur, wenn eine Normnummer folgt
    .replace(/\b([1lI][S5][O0])\b/g, (m, a, off, str) => /^\d+$/.test(a) && !/^\s*\d{3,5}\b/.test(str.slice(off + 3)) ? a : 'ISO')
    .replace(/(^|\s)\[?[BPDQ@](?=\d)/g, '$1Ø')                 // Ø als B, P, D oder Q gelesen
    .replace(/Ø\s*[BPDQ@Ø](?=\d)/g, 'Ø')                           // Ø doppelt gelesen („ØD40“)
    .replace(/(\d)-(?=(?:js|JS|[A-Za-z]{1,2})\d)/g, '$1 ')           // „32-H7“: Maßlinie zwischen Zahl und Klasse
    .replace(/(^|\s)(\d{1,2})\s*%(?=\s*[\dØ])/g, '$1$2x')           // „2% Ø6“: das x als % gelesen
    .replace(/£(?=\s*0[.,]\d)/g, '±')
    .replace(/(\d\s*[A-HJ-NP-Za-hj-np-z]{1,2})[Yy](?![A-Za-z])/g, '$17')   // H7 als HY gelesen
    .replace(/(^|\s)R(?=[\dSB])([\dSOB]{1,3})(?=[\s,]|$)/g, (m, a, b) => a + 'R' + b.replace(/S/g, '5').replace(/O/g, '0').replace(/B/g, '8'))   // R5 als RS gelesen
    .replace(/(\d\s*)(js|JS|[a-hj-zA-HJ-Z])b(?![A-Za-z\d])/g, '$1$26')  // g6 als gb gelesen
    .replace(/(^|\s)[0Oo](?=\d{1,3}(?:[.,]\d+)?\s*(?:js|JS|[A-Za-z])\d{1,2}(?![\d.,]))/g, '$1Ø')   // „020 g6“: die Null vorne war das Ø
    .replace(/[º˚]/g, '°')
    .replace(/\+\s*\/\s*-/g, '±')
    .replace(/\+\s*-(?=\s*\d)/g, '±')
    .replace(/(\d)\s*,\s*(\d)/g, '$1,$2')
    .replace(/(^|\s)(\d{1,4})\s+1(0[.,]\d{1,3})(?=\s|$)/g, '$1$2 ±$3')   // „45 10,2“: das ± als 1 gelesen
    .replace(/([+±-]\s*)0(\d{1,3})(?![\d.,])/g, '$10,$2')
    .replace(/(\d)\s*\.\s*(\d)/g, '$1.$2')
    .replace(/\s+/g, ' ')
    .trim();

  // Ein Stück Text durchsuchen; conf = Erkennungssicherheit der Zeile (0 bis 100)
  T.parseDimText = function (text, conf = 100, minPlainConf = 0) {
    let s = ' ' + T.normalizeOcr(text) + ' ';
    const items = [];
    let general = null, iso22081 = false;
    const titleLine = TITLE_WORDS.test(s);
    const take = (re, fn) => {
      s = s.replace(re, (...m) => {
        const r = fn(m);
        if (r === false) return m[0];
        if (r) items.push(Object.assign({ raw: m[0].trim() }, r));
        return ' '.repeat(m[0].length);
      });
    };
    const dia = d => d ? 'Ø' : '';
    if (titleLine) {   // Schriftfeld: nur die Allgemeintoleranz, keine Maße
      s.replace(/(?:DIN\s*)?(?:ISO\s*)?2768\s*[-–:.]?\s*([fmcv])\s*([HKL](?![a-z]))?/i, (m0, a, b) => { general = { ml: a.toLowerCase(), hk: b ? b.toUpperCase() : null }; });
      if (/ISO\s*22081/i.test(s)) iso22081 = true;
      return { items, general, iso22081 };
    }

    // Allgemeintoleranz im Schriftfeld
    take(/(?:DIN\s*)?(?:ISO\s*)?2768\s*[-–:.]?\s*([fmcv])\s*([HKL](?![a-z]))?/gi, m => { general = { ml: m[1].toLowerCase(), hk: m[2] ? m[2].toUpperCase() : null }; return null; });
    take(/ISO\s*22081/gi, () => { iso22081 = true; return null; });
    take(/\b(?:DIN\s*EN\s*ISO|DIN\s*ISO|DIN\s*EN|ISO|DIN|EN)\s*\d+(?:[-–]\d+)?/gi, () => null);
    take(/\d{1,2}\.\d{1,2}\.\d{2,4}/g, () => null);                   // Datum
    take(/\b\d+\s*:\s*\d+\b/g, () => null);                             // Maßstab
    take(/\bR[az]\s*\d+(?:[.,]\d+)?/g, () => null);                      // Rauheit Ra, Rz

    // Passung: 30H7/g6
    take(new RegExp(`(${DIA})?\\s*(${NUM})\\s*([A-Za-z]{1,2})\\s*(\\d{1,2})\\s*\\/\\s*([A-Za-z]{1,2})\\s*(\\d{1,2})(?![\\d.,])`, 'g'), m => {
      const p = T.parseFit(`${m[2]}${m[3]}${m[4]}/${m[5]}${m[6]}`);
      if (p.error) return false;
      const r = T.fitCalc(p.N, p.hole, p.shaft);
      if (!r.ok) return false;
      return { kind: 'fit', N: p.N, hole: p.hole, shaft: p.shaft, label: `${dia(m[1])}${T.fmt(p.N)} ${p.hole.letter}${p.hole.grade}/${p.shaft.letter}${p.shaft.grade}` };
    });
    // Fase: 2x45°
    take(new RegExp(`(${DEV})\\s*[x×X]\\s*45\\s*°?`, 'g'), m => ({ kind: 'fase', N: num(m[1]), label: `${T.fmt(num(m[1]))} × 45°` }));
    // „4x 76,6“: nach einer Anzahl steht fast immer Ø, die Erkennung liest es oft als 7, 0 oder 9
    take(new RegExp(`(?:\\b\\d{1,2}\\s*[x×X]|^\\s*[x×X])\\s*(?:[2709oO](${NUM})|[3568](\\d{1,2}[.,]\\d{1,2}))(?![\\d.,])(?!\\s*[A-Za-z]{1,2}\\d)`, 'g'), m => {
      const N = num(m[1] || m[2]);
      if (!(N >= 0.5 && N <= 4000)) return false;
      return { kind: 'lin', N, dia: true, guess: 'Vor der Zahl stand vermutlich das Durchmesserzeichen Ø. Bitte mit der Zeichnung prüfen.', label: `Ø${T.fmt(N)}` };
    });
    // Anzahl wie „4x Ø6“ überspringen
    take(new RegExp(`\\b\\d{1,2}\\s*[x×X]\\s*(?=${DIA}|R|\\d)`, 'g'), () => null);
    // ISO-Toleranz: Ø30 H7, 25g6
    take(new RegExp(`(${DIA})?\\s*(${NUM})(\\s*)(JS|Js|js|[A-Za-z])\\s*(\\d{1,2})(?![\\d.,°])`, 'g'), m => {
      if (m[3] && /^[Rr]$/.test(m[4])) return false;  // „120 R5“ ist ein Maß und ein Radius
      const c = T.parseClassToken(m[4] + m[5]);
      if (c.error) return false;
      const N = num(m[2]);
      const r = T.isoTol(N, c.letter, c.grade);
      if (!r.ok) return false;
      return { kind: 'iso', N, letter: c.letter, grade: c.grade, dia: !!m[1], label: `${dia(m[1])}${T.fmt(N)} ${c.letter}${c.grade}` };
    });
    // Gewinde M6, M8x1 überspringen
    take(/\bM\s?\d{1,2}(?:[.,]\d+)?(?:\s*[x×]\s*\d+(?:[.,]\d+)?)?/g, () => null);
    // Plus-Minus: 60 ±0,1
    take(new RegExp(`(${DIA}|R)?\\s*(${NUM})\\s*±\\s*(${DEV})`, 'g'), m => {
      const N = num(m[2]), d = num(m[3]);
      if (!(N > 0) || !(d > 0) || d >= N) return false;
      const pre = m[1] === 'R' ? 'R' : dia(m[1]);
      return { kind: 'pm', N, up: d, lo: -d, pre, label: `${pre}${T.fmt(N)} ±${T.fmt(d)}` };
    });
    // Oberes und unteres Abmaß: 25 +0,1 -0,05 oder 25 +0,1/0
    take(new RegExp(`(${DIA})?\\s*(${NUM})\\s*([+-]\\s*${DEV})\\s*\\/?\\s*([+-]\\s*${DEV}|0(?![.,\\d]))`, 'g'), m => {
      const N = num(m[2]);
      let a = num(m[3].replace(/\s+/g, '')), b = num(m[4].replace(/\s+/g, ''));
      if (!(N > 0) || a === b) return false;
      const up = Math.max(a, b), lo = Math.min(a, b);
      return { kind: 'ul', N, up: r6(up), lo: r6(lo), pre: dia(m[1]), label: `${dia(m[1])}${T.fmt(N)} ${T.fmtS(up) || '0'}/${T.fmtS(lo) || '0'}` };
    });
    // Einzelnes „+0,1“ hinter einem Maß: die Erkennung liest ± oft als +
    take(new RegExp(`(${DIA})?\\s*(${NUM})\\s*\\+\\s*(${DEV})(?![\\d.,])(?!\\s*[/+-])`, 'g'), m => {
      const N = num(m[2]), d = num(m[3]);
      if (!(N > 0) || !(d > 0) || d >= N) return false;
      return { kind: 'pm', N, up: d, lo: -d, pre: dia(m[1]), guess: 'Im Foto stand hier vermutlich ±. Bitte mit der Zeichnung prüfen.', label: `${dia(m[1])}${T.fmt(N)} ±${T.fmt(d)}` };
    });
    // Winkel: 90°, 30°15'
    take(/(\d{1,3}(?:[.,]\d{1,2})?)\s*°(?:\s*(\d{1,2})\s*['′])?/g, m => {
      const deg = num(m[1]) + (m[2] ? num(m[2]) / 60 : 0);
      if (!(deg > 0 && deg <= 360)) return false;
      return { kind: 'ang', deg: r6(deg), label: m[2] ? `${T.fmt(num(m[1]))}° ${m[2]}′` : `${T.fmt(deg)}°` };
    });
    // Radius: R5, SR10
    take(new RegExp(`\\bS?R\\s*(${NUM})(?![\\d.,])`, 'g'), m => {
      const N = num(m[1]);
      if (!(N >= 0.5)) return false;
      return { kind: 'rad', N, label: `R${T.fmt(N)}` };
    });
    // Durchmesser ohne Toleranz: Ø20
    take(new RegExp(`(${DIA})\\s*(${NUM})(?![\\d.,])`, 'g'), m => {
      const N = num(m[2]);
      if (!(N >= 0.5 && N <= 4000)) return false;
      return { kind: 'lin', N, dia: true, label: `Ø${T.fmt(N)}` };
    });
    // Einfache Maße ohne Toleranz
    if (!titleLine && conf >= minPlainConf) {
      take(new RegExp(`(?<![\\d.,A-Za-z])(${NUM})(?![\\d.,A-Za-z])`, 'g'), m => {
        const N = num(m[1]);
        if (!(N >= 0.5 && N <= 4000)) return false;
        if (m[1].length === 1 && conf < 80) return false;
        if (/^0\d/.test(m[1])) return false;               // Maße haben keine führende Null   // einzelne Ziffern sind oft Reste von Maßlinien
        return { kind: 'lin', N, label: T.fmt(N) };
      });
    }
    return { items, general, iso22081 };
  };

  // Mehrere erkannte Zeilen zusammenführen. Dasselbe Maß an derselben Stelle (aus mehreren Durchgängen) zählt einmal.
  const near = (a, b) => {
    if (!a || !b) return false;
    const ax = a.x + a.w / 2, ay = a.y + a.h / 2, bx = b.x + b.w / 2, by = b.y + b.h / 2;
    const tol = Math.max(a.h, b.h, a.w * 0.3, b.w * 0.3, 0.01);
    return Math.abs(ax - bx) <= tol * 1.5 && Math.abs(ay - by) <= tol * 1.5;
  };
  T.parseDrawing = function (lines) {
    let out = [];
    let general = null, iso22081 = false;
    lines.forEach(line => {
      const conf = line.conf == null ? 100 : line.conf;
      const r = T.parseDimText(line.text, conf, line.minPlainConf || 0);
      if (r.general && (!general || (r.general.hk && !general.hk))) general = r.general;
      if (r.iso22081) iso22081 = true;
      r.items.forEach(it => {
        const same = line.box && out.find(o => o.kind === it.kind && o.label === it.label && o.boxes.some(b => near(b, line.box)));
        if (same) { same.hits++; same.conf = Math.max(same.conf, conf); return; }
        out.push(Object.assign({ hits: 1, conf, box: line.box || null, boxes: line.box ? [line.box] : [] }, it));
      });
    });
    // Gleiches Maß an verschiedenen Stellen: einmal auflisten, Stellen zählen
    const merged = [];
    out.forEach(it => {
      const m = merged.find(o => o.kind === it.kind && o.label === it.label);
      if (m) { m.count += 1; m.hits += it.hits; m.conf = Math.max(m.conf, it.conf); m.boxes = m.boxes.concat(it.boxes); return; }
      merged.push(Object.assign(it, { count: 1 }));
    });
    out = merged;
    // Halb gelesene Doppelungen an derselben Stelle entfernen
    const sameSpot = (a, b) => a.boxes.some(x => b.boxes.some(y => near(x, y)));
    const lostDigit = (short, long) => short.length < long.length && long.endsWith(short);
    const drop = new Set();
    out.forEach(a => out.forEach(b => {
      if (a === b || drop.has(b) || !sameSpot(a, b)) return;
      if (a.kind === 'iso' && b.kind === 'iso' && a.letter === b.letter && a.grade === b.grade) {
        const as = String(a.N), bs = String(b.N);
        if ((as === bs && b.dia && !a.dia) || lostDigit(as, bs)) drop.add(a);
      }
      if (a.kind === 'iso' && b.kind === 'fit' && a.N === b.N && a.letter === b.hole.letter && a.grade === b.hole.grade) drop.add(a);
      if (a.kind === 'ul' && b.kind === 'ul' && a.N === b.N && a.up === b.up && a.lo === 0 && b.lo !== 0) drop.add(a);
      if (a.kind === 'lin' && ['fit', 'iso', 'pm', 'ul'].includes(b.kind) && a.N === b.N) drop.add(a);
      if (a.kind === 'lin' && b.kind === 'lin' && a.dia === b.dia && lostDigit(String(a.N), String(b.N)) && a.hits <= b.hits) drop.add(a);
      if (a.kind === 'lin' && b.kind === 'lin' && !a.dia && b.dia && a.N === b.N) drop.add(a);
    }));
    out = out.filter(it => !drop.has(it));
    // Einmal und unsicher gelesen: Maße ohne Toleranz weglassen (meist Bruchstücke), andere zum Prüfen markieren
    out = out.filter(it => !(it.kind === 'lin' && it.hits === 1 && it.conf < 60 && it.boxes.length));
    out.forEach(it => {
      if (it.boxes.length && it.hits === 1 && it.conf < 60 && !it.guess) it.guess = 'Diese Angabe war im Foto schlecht zu lesen. Bitte mit der Zeichnung prüfen.';
      delete it.boxes;
    });
    const order = { fit: 0, iso: 1, pm: 2, ul: 3, lin: 4, rad: 5, fase: 6, ang: 7 };
    out.sort((a, b) => (order[a.kind] - order[b.kind]) || ((a.N || a.deg || 0) - (b.N || b.deg || 0)));
    return { items: out, general, iso22081 };
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = T;
})(typeof window !== 'undefined' ? window : globalThis);
