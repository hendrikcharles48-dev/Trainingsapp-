/* Trainings-Engine: Fragebogen, Planerstellung, Satz-für-Satz-Empfehlungen, Statistik. */
(function () {
  const DB = window.EXDB;
  const EX = DB.byId;

  /* ================= Fragebogen ================= */
  const Q = [
    { id: 'name', title: 'Wie heißt du?', hint: 'Nur für die Begrüßung.', type: 'text', placeholder: 'Vorname', optional: true },
    { id: 'sex', title: 'Geschlecht', hint: 'Hilft bei der ersten Gewichtsschätzung.', type: 'single', options: [['m', 'Männlich'], ['w', 'Weiblich'], ['d', 'Divers / keine Angabe']] },
    { id: 'age', title: 'Wie alt bist du?', type: 'number', unit: 'Jahre', min: 12, max: 99, placeholder: '30' },
    { id: 'bw', title: 'Dein Körpergewicht', hint: 'Wichtig: Bei Klimmzügen, Dips & Co. rechnet der Algorithmus mit deinem Gewicht.', type: 'number', unit: 'kg', min: 30, max: 250, step: 0.1, placeholder: '80' },
    { id: 'exp', title: 'Wie lange trainierst du schon regelmäßig?', type: 'single', options: [['new', 'Weniger als 6 Monate'], ['some', '6 Monate bis 2 Jahre'], ['exp', '2 bis 5 Jahre'], ['vet', 'Mehr als 5 Jahre']] },
    { id: 'goal', title: 'Was ist dein Hauptziel?', type: 'single', options: [['muscle', 'Muskelaufbau', 'Mehr Muskelmasse, sichtbare Form'], ['recomp', 'Fett weg & Muskeln aufbauen', 'Muskeln aufbauen oder halten, während das Körperfett sinkt'], ['strength', 'Maximalkraft', 'Schwerere Gewichte, weniger Wiederholungen'], ['skills', 'Calisthenics-Skills', 'Muscle-up, Front Lever, Handstand …'], ['fit', 'Fitness & Fettabbau', 'Kraft plus Kondition'], ['health', 'Gesund & beweglich', 'Solide Basis, schonend']] },
    { id: 'skills', title: 'Welche Skills willst du lernen?', hint: 'Mehrfachauswahl. Jede Einheit bekommt dann einen Skill-Block.', type: 'multi', options: [['pullup', 'Mehr / erste Klimmzüge'], ['mu', 'Muscle-up'], ['fl', 'Front Lever'], ['hs', 'Handstand'], ['lsit', 'L-Sit'], ['pistol', 'Pistol Squat'], ['planche', 'Planche'], ['bl', 'Back Lever / Schulterbeweglichkeit']] },
    { id: 'location', title: 'Wo trainierst du?', type: 'single', options: [['home', 'Nur zu Hause'], ['gym', 'Nur im Studio'], ['both', 'Beides', 'Der Plan bekommt für jede Einheit eine Zuhause- und eine Studio-Version']] },
    { id: 'homeEq', title: 'Was hast du zu Hause?', hint: 'Mehrfachauswahl. Körpergewicht geht immer.', type: 'multi', when: a => a.location !== 'gym', options: [['bar', 'Klimmzugstange'], ['rings', 'Turnringe'], ['db', 'Kurzhantel(n)'], ['cable', 'Seilzug von oben'], ['bench', 'Bank (oder stabiler Stuhl)'], ['band', 'Widerstandsbänder'], ['dipbar', 'Dip-Barren / Parallettes']] },
    { id: 'dbSetup', title: 'Deine Kurzhanteln', hint: 'Damit dir nur Gewichte empfohlen werden, die du wirklich hast.', type: 'db', when: a => a.location !== 'gym' && (a.homeEq || []).includes('db') },
    { id: 'cableSetup', title: 'Dein Seilzug', hint: 'Welche Gewichte kannst du einstellen?', type: 'cable', when: a => a.location !== 'gym' && (a.homeEq || []).includes('cable') },
    { id: 'addw', title: 'Kannst du bei Klimmzügen oder Dips Zusatzgewicht nutzen?', hint: 'z. B. Dip-Gürtel, Gewichtsweste oder Kurzhantel zwischen den Füßen.', type: 'single', options: [['yes', 'Ja'], ['no', 'Nein']] },
    { id: 'days', title: 'Wie viele Tage pro Woche willst du trainieren?', type: 'single', options: [['2', '2 Tage'], ['3', '3 Tage'], ['4', '4 Tage'], ['5', '5 Tage'], ['6', '6 Tage']] },
    { id: 'duration', title: 'Wie lange darf eine Einheit dauern?', type: 'single', options: [['30', '30 Minuten'], ['45', '45 Minuten'], ['60', '60 Minuten'], ['75', '75 Minuten'], ['90', '90 Minuten']] },
    { id: 'split', title: 'Welche Aufteilung?', hint: '„Automatisch“ wählt nach Trainingstagen.', type: 'single', options: [['auto', 'Automatisch (empfohlen)'], ['fb', 'Ganzkörper'], ['ul', 'Oberkörper / Unterkörper'], ['ppl', 'Push / Pull / Beine']] },
    { id: 'pullups', title: 'Wie viele saubere Klimmzüge schaffst du am Stück?', type: 'single', options: [['0', 'Keinen'], ['2', '1–3'], ['5', '4–7'], ['10', '8–12'], ['16', '13–20'], ['23', 'Mehr als 20']] },
    { id: 'pushups', title: 'Wie viele Liegestütze schaffst du am Stück?', type: 'single', options: [['2', '0–4'], ['10', '5–14'], ['22', '15–29'], ['38', '30–49'], ['55', '50 oder mehr']] },
    { id: 'dips', title: 'Wie viele Dips schaffst du?', type: 'single', options: [['-1', 'Weiß ich nicht'], ['0', 'Keinen'], ['3', '1–5'], ['9', '6–12'], ['16', '13–20'], ['25', 'Mehr als 20']] },
    { id: 'legs', title: 'Pistol Squat (einbeinige Kniebeuge)?', type: 'single', options: [['0', 'Geht noch nicht'], ['1', 'Mit Hilfe / zur Box'], ['2', 'Ja, 1–5 pro Bein'], ['3', 'Ja, 6 oder mehr']] },
    { id: 'core', title: 'Was schaffst du hängend an der Stange?', type: 'single', options: [['1', 'Knie zur Brust ziehen'], ['3', 'Gestreckte Beine bis Hüfthöhe'], ['4', 'Toes to Bar'], ['5', 'Scheibenwischer'], ['0', 'Weiß ich nicht']] },
    { id: 'priority', title: 'Welche Muskeln willst du besonders betonen?', hint: 'Bis zu 3. Diese bekommen extra Sätze.', type: 'multi', max: 3, options: Object.keys(DB.GROUPS).map(g => [g, g]) },
    { id: 'injuries', title: 'Hast du Beschwerden?', hint: 'Übungen, die diese Stellen stark belasten, werden gemieden.', type: 'multi', options: [['shoulder', 'Schulter'], ['elbow', 'Ellbogen'], ['wrist', 'Handgelenk'], ['lowback', 'Unterer Rücken'], ['knee', 'Knie']] },
    { id: 'intensity', title: 'Wie hart willst du trainieren?', hint: 'Bestimmt, wie viele Wiederholungen du im Tank lässt (Reserve).', type: 'single', options: [['mod', 'Moderat', '2–3 Wdh. Reserve'], ['hard', 'Hart', '1–2 Wdh. Reserve'], ['very', 'Sehr hart', 'Isolationsübungen bis ans Versagen']] },
    { id: 'sleep', title: 'Wie viel schläfst du normalerweise?', type: 'single', options: [['5', 'Unter 6 Stunden'], ['6', '6–7 Stunden'], ['7', '7–8 Stunden'], ['8', 'Mehr als 8 Stunden']] },
    { id: 'stress', title: 'Wie ist dein Stresslevel im Alltag?', type: 'single', options: [['low', 'Niedrig'], ['mid', 'Mittel'], ['high', 'Hoch']] },
    { id: 'finisher', title: 'Konditions-Finisher am Ende?', hint: 'Kurze Intervalle (ca. 5 Minuten) zum Schluss.', type: 'single', options: [['no', 'Nein'], ['yes', 'Ja']] }
  ];

  const EXP_LVL = { new: 1, some: 2, exp: 3, vet: 4 };
  const EXP_F = { new: 0.55, some: 0.78, exp: 1, vet: 1.12 };

  /* ================= Geräte & Gewichte ================= */
  const GYM_EQ = ['bw', 'bar', 'db', 'db2', 'cable', 'gcable', 'bench', 'dipbar', 'bb', 'mach'];

  function locEquip(profile, loc) {
    if (loc === 'gym') return new Set(GYM_EQ);
    const a = profile.answers || {};
    const s = new Set(['bw', ...(a.homeEq || [])]);
    if (s.has('db') && a.dbSetup && a.dbSetup.count >= 2) s.add('db2');
    return s;
  }
  function available(ex, eqSet) { return ex.eq.every(e => eqSet.has(e)); }

  function rangeList(min, max, step) {
    const out = []; if (!(step > 0) || !(max >= min)) return out;
    for (let v = min; v <= max + 1e-6; v += step) out.push(Math.round(v * 100) / 100);
    return out;
  }
  function dbList(profile) {
    const d = (profile.answers || {}).dbSetup;
    if (!d) return [];
    if (d.type === 'adj') return rangeList(+d.min || 2, +d.max || 20, +d.step || 2.5);
    return (d.list || []).map(Number).filter(x => x > 0).sort((a, b) => a - b);
  }
  function gymDb() { return [...rangeList(1, 10, 1), ...rangeList(12, 60, 2)]; }

  /* Mögliche Lasten für eine Übung am Ort. null = beliebig (freie Eingabe, Schritt 0.5). */
  function loadOptions(ex, loc, profile) {
    const set = profile.settings || {};
    // Von dir festgelegte Gewichte für genau diese Übung (pro Ort)
    const own = (profile.exW || {})[ex.id + '@' + loc];
    if (own && own.length && (ex.kind === 'load' || ex.kind === 'bw')) { const l = own.slice().sort((a, b) => a - b); return ex.kind === 'bw' ? [0, ...l.filter(x => x > 0)] : l; }
    if (ex.kind === 'bw') {
      if (!ex.addw || !canAdd(profile, loc)) return [0];
      const extra = loc === 'gym' ? [...rangeList(1.25, 10, 1.25), ...rangeList(12.5, 60, 2.5)] : dbList(profile);
      return [0, ...extra];
    }
    if (ex.kind !== 'load') return null;
    if (loc === 'gym') {
      if (ex.eq.includes('bb')) {
        const base = ex.id === 'ez-curl' ? 10 : 20;
        return rangeList(base, 320, set.bbStep || 2.5);
      }
      if (ex.eq.includes('mach') || ex.eq.includes('gcable')) return rangeList(set.stackStep || 2.5, 250, set.stackStep || 2.5);
      if (ex.eq.includes('cable')) return rangeList(2.5, 120, 2.5);
      return gymDb();
    }
    if (ex.eq.includes('cable')) {
      const c = (profile.answers || {}).cableSetup || {};
      return rangeList(+c.min || +c.step || 2.5, +c.max || 60, +c.step || 2.5);
    }
    if (ex.eq.includes('db') || ex.eq.includes('db2')) {
      const l = dbList(profile);
      return l.length ? l : null;
    }
    return null;
  }
  function canAdd(profile, loc) {
    if (loc === 'gym') return true;
    const a = profile.answers || {};
    return a.addw === 'yes' || (a.homeEq || []).includes('db');
  }

  /* ================= Fähigkeiten aus dem Fragebogen ================= */
  function abilities(a) {
    const P = +(a.pullups ?? 5), PU = +(a.pushups ?? 10);
    let D = +(a.dips ?? -1); if (D < 0) D = Math.max(0, Math.round((PU - 8) / 2));
    const legs = +(a.legs ?? 0), core = +(a.core ?? 0) || (P >= 5 ? 3 : 1);
    const pick = (v, table) => { let r = table[0][1]; for (const [t, rank] of table) if (v >= t) r = rank; return r; };
    return {
      pull: pick(P, [[0, 2], [1, 2.5], [4, 4.2], [8, 4.5], [13, 5.5], [21, 6]]),
      row: pick(P, [[0, 1], [1, 3], [8, 4], [13, 5]]),
      push: pick(PU, [[0, 1], [5, 2], [15, 3.3], [30, 5], [50, 6]]),
      dip: pick(D, [[0, 1.5], [1, 2], [6, 3], [13, 5], [21, 6.5]]),
      hs: pick(PU, [[0, 2], [15, 3.5], [30, 5], [50, 6]]),
      squat: [2.5, 3.5, 5, 5.2][legs] || 2.5,
      hinge: 1, glute: a.exp === 'new' ? 1 : 3,
      ham: a.exp === 'new' ? 1 : (a.exp === 'vet' ? 4 : 2),
      hang: core, plank: 1, hollow: 2,
      lsit: core >= 4 ? 2 : 1,
      fl: P >= 18 ? 3 : P >= 12 ? 2 : 1,
      mu: P >= 16 && D >= 10 ? 4 : P >= 10 ? 3 : 1,
      hsskill: PU >= 40 ? 3 : 1,
      planche: PU >= 50 ? 3 : 1,
      tests: { P, PU, D, legs }
    };
  }

  /* Kraft-Kapazität (e1RM in kg) für Körpergewichtsketten aus dem Fragebogen */
  function testCapacity(ex, profile) {
    const a = profile.answers || {}; const bw = bodyweight(profile); const t = abilities(a).tests;
    if (ex.grp === 'pull' && ex.pat === 'vpull') return bw * (1 + t.P / 30) * (t.P === 0 ? 0.85 : 1);
    if (ex.grp === 'push' && ex.pat === 'hpush') return bw * 0.64 * (1 + t.PU / 30);
    if (ex.grp === 'dip') return bw * 0.95 * (1 + t.D / 30) * (t.D === 0 ? 0.85 : 1);
    if (ex.grp === 'row') return bw * 0.6 * (1 + (6 + t.P) / 30);
    if (ex.grp === 'hs') return bw * 0.5 * (1 + (t.PU * 0.4) / 30);
    if (ex.grp === 'squat') return bw * 0.8 * (1 + [0, 1, 3, 7][t.legs] / 30) * (t.legs === 0 ? 0.85 : 1);
    return null;
  }

  function bodyweight(profile) {
    const log = profile.bwLog || [];
    if (log.length) return log[log.length - 1].kg;
    return +((profile.answers || {}).bw) || 75;
  }

  /* ================= Planerstellung ================= */
  const S = (p, r, extra) => Object.assign({ p, r }, extra || {});
  const TEMPLATES = {
    FA: { name: 'Ganzkörper A', focus: 'full', slots: [S(['vpull'], 'main'), S(['hpush', 'dip'], 'main'), S(['squat', 'lunge'], 'main'), S(['hpull'], 'sec'), S(['side'], 'iso'), S(['triceps'], 'iso'), S(['core'], 'core')] },
    FB: { name: 'Ganzkörper B', focus: 'full', slots: [S(['hinge'], 'main'), S(['vpush'], 'main'), S(['hpull'], 'main'), S(['lunge', 'squat'], 'sec'), S(['latiso', 'vpull'], 'sec'), S(['biceps'], 'iso'), S(['core'], 'core')] },
    FC: { name: 'Ganzkörper C', focus: 'full', slots: [S(['squat', 'lunge'], 'main'), S(['vpull'], 'main'), S(['dip', 'hpush'], 'sec'), S(['hinge', 'glute'], 'sec'), S(['rear'], 'iso'), S(['biceps'], 'iso'), S(['calf'], 'iso'), S(['core'], 'core')] },
    UA: { name: 'Oberkörper A', focus: 'upper', slots: [S(['vpull'], 'main'), S(['hpush'], 'main'), S(['hpull'], 'sec'), S(['vpush'], 'sec'), S(['side'], 'iso'), S(['biceps'], 'iso'), S(['triceps'], 'iso')] },
    UB: { name: 'Oberkörper B', focus: 'upper', slots: [S(['hpull'], 'main'), S(['vpush'], 'main'), S(['vpull'], 'sec'), S(['dip', 'hpush'], 'sec'), S(['rear'], 'iso'), S(['triceps'], 'iso'), S(['biceps'], 'iso')] },
    LA: { name: 'Unterkörper A', focus: 'lower', slots: [S(['squat', 'lunge'], 'main'), S(['hinge'], 'sec'), S(['lunge', 'squat'], 'sec'), S(['hamcurl'], 'iso'), S(['calf'], 'iso'), S(['core'], 'core')] },
    LB: { name: 'Unterkörper B', focus: 'lower', slots: [S(['hinge'], 'main'), S(['lunge', 'squat'], 'sec'), S(['glute'], 'sec'), S(['quadiso', 'hamcurl'], 'iso'), S(['calf'], 'iso'), S(['core'], 'core')] },
    PU: { name: 'Push', focus: 'upper', slots: [S(['hpush'], 'main'), S(['vpush'], 'main'), S(['dip', 'hpush'], 'sec'), S(['fly'], 'iso'), S(['side'], 'iso'), S(['triceps'], 'iso')] },
    PL: { name: 'Pull', focus: 'upper', slots: [S(['vpull'], 'main'), S(['hpull'], 'main'), S(['latiso', 'vpull'], 'sec'), S(['rear'], 'iso'), S(['biceps'], 'iso'), S(['biceps'], 'iso'), S(['core'], 'core')] },
    LG: { name: 'Beine', focus: 'lower', slots: [S(['squat', 'lunge'], 'main'), S(['hinge'], 'main'), S(['lunge', 'squat'], 'sec'), S(['hamcurl'], 'iso'), S(['calf'], 'iso'), S(['core'], 'core')] }
  };
  const SPLITS = {
    fb: { 2: ['FA', 'FB'], 3: ['FA', 'FB', 'FC'], 4: ['FA', 'FB', 'FC', 'FA'], 5: ['FA', 'FB', 'FC', 'FA', 'FB'], 6: ['FA', 'FB', 'FC', 'FA', 'FB', 'FC'] },
    ul: { 2: ['UA', 'LA'], 3: ['UA', 'LA', 'UB'], 4: ['UA', 'LA', 'UB', 'LB'], 5: ['UA', 'LA', 'UB', 'LB', 'FA'], 6: ['UA', 'LA', 'UB', 'LB', 'UA', 'LA'] },
    ppl: { 2: ['FA', 'FB'], 3: ['PU', 'PL', 'LG'], 4: ['PU', 'PL', 'LG', 'FA'], 5: ['UA', 'LA', 'PU', 'PL', 'LG'], 6: ['PU', 'PL', 'LG', 'PU', 'PL', 'LG'] }
  };
  const MAX_EX = 7, MIN_EX = 5, PLAN_VERSION = 3;
  const SPLIT_NAMES = { fb: 'Ganzkörper', ul: 'Oberkörper / Unterkörper', ppl: 'Push / Pull / Beine' };
  const PRIO_SLOTS = {
    Rücken: { p: ['hpull', 'latiso'], focus: ['upper', 'full'] }, Brust: { p: ['fly', 'hpush'], focus: ['upper', 'full'] },
    Schultern: { p: ['side'], focus: ['upper', 'full'] }, Arme: { p: ['biceps', 'triceps'], focus: ['upper', 'full'] },
    Beine: { p: ['hamcurl', 'quadiso', 'lunge'], focus: ['lower', 'full'] }, Po: { p: ['glute'], focus: ['lower', 'full'] },
    Bauch: { p: ['core'], focus: ['lower', 'full', 'upper'] }
  };
  const SKILL_GRP = { mu: 'mu', fl: 'fl', hs: 'hsskill', lsit: 'lsit', planche: 'planche', bl: 'bl' };

  // „Fett weg & Muskeln aufbauen“ trainiert wie Muskelaufbau, mit weniger Zusatzvolumen (Erholung im Defizit knapper)
  const baseGoal = g => !g || g === 'recomp' ? 'muscle' : g;
  function isCut(profile, plan) { return ((profile && profile.answers) || {}).goal === 'recomp' || (plan && plan.goal === 'recomp'); }
  // Standard-Pause je Rolle (Sekunden): Grundübung 2,5 min, Ergänzung 2 min, Isolation 1,5 min
  function defaultRest(role, goal) {
    // 3.15 (Nutzerwunsch: 2 min war zu kurz, Kraftverlust): längere Pausen = mehr Wdh. in den Folgesätzen = mehr Reiz
    return role === 'main' ? (goal === 'strength' ? 240 : goal === 'fit' ? 150 : 210) : role === 'sec' ? 165 : role === 'skill' ? 150 : role === 'cond' ? 20 : role === 'core' ? 90 : 120;
  }
  function goalRanges(goal) {
    goal = baseGoal(goal);
    return {
      muscle: { main: [6, 10], sec: [8, 12], iso: [10, 15] },
      strength: { main: [3, 6], sec: [6, 10], iso: [10, 15] },
      skills: { main: [5, 10], sec: [6, 12], iso: [10, 15] },
      fit: { main: [8, 12], sec: [10, 15], iso: [12, 20] },
      health: { main: [8, 12], sec: [10, 15], iso: [12, 15] }
    }[goal || 'muscle'];
  }

  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return ((h >>> 0) % 1000) / 1000; }

  /* Bewertet, wie gut eine Übung in einen Slot passt. Liefert Punktzahl und Begründungen. */
  function scoreExercise(ex, slot, ctx) {
    const { profile, loc, eqSet, used, dayUsed } = ctx;
    const a = profile.answers || {}; const ab = ctx.ab; const reasons = []; let bad = false;
    const fav = (profile.favs || []).includes(ex.id); // Favorit = Übung, die du gut kannst und verträgst
    if (!available(ex, eqSet)) return null;
    if (!slot.p.includes(ex.pat)) return null;
    const patIdx = slot.p.indexOf(ex.pat);
    let s = -patIdx * 2.5;
    const r = slot.r;
    if (r === 'skill') { if (ex.skill !== slot.skill) return null; s += 5; }
    else if (r === 'core') { if (ex.role !== 'k') return null; }
    else if (r === 'cond') { if (ex.role !== 'x') return null; }
    else if (ex.role === 's' || ex.role === 'x') return null;
    if (r === 'main') { s += ex.role === 'c' ? 6 : -4; if (ex.role !== 'c') bad = true; }
    if (r === 'sec') s += ex.role === 'c' ? 3 : 0;
    if (r === 'iso') s += ex.role === 'i' ? 4 : 0;
    const inj = (ex.inj || []).filter(t => (a.injuries || []).includes(t));
    if (inj.length && !fav) { s -= 8 * inj.length; bad = true; } else if (inj.length) { reasons.push('Von dir als gut verträglich markiert'); } else if ((a.injuries || []).length && ex.pat !== 'core') {
      const names = { shoulder: 'Schulter', elbow: 'Ellbogen', wrist: 'Handgelenk', lowback: 'unteren Rücken', knee: 'Knie' };
      const spared = (a.injuries || []).filter(t => ['shoulder', 'elbow', 'wrist', 'lowback', 'knee'].includes(t)).map(t => names[t]);
      if (spared.length && (ex.pat === 'dip' || ex.pat === 'vpush' || ex.pat === 'hpush' || ex.pat === 'squat' || ex.pat === 'hinge')) reasons.push('Schont ' + spared.join(' & '));
    }
    const goal = baseGoal(a.goal);
    if (ex.kind === 'load' && (goal === 'muscle' || goal === 'strength')) s += 1;
    if (ex.kind !== 'load' && goal === 'skills') s += 3;
    if (loc === 'gym' && (goal === 'muscle' || goal === 'strength') && ex.eq.some(e => ['bb', 'mach', 'gcable'].includes(e))) s += 2;
    if (goal === 'strength' && r === 'main' && ex.eq.includes('bb')) s += 3;
    if (loc === 'home' && ex.eq.includes('cable')) { s += 0.8; reasons.push('Nutzt deinen Seilzug'); }
    if (loc === 'home' && ex.eq.includes('rings')) { s += 0.8; reasons.push('Nutzt deine Ringe'); }
    // Progressionskette: passende Stufe zu deinem Können
    if (ex.grp && ab[ex.grp] != null) {
      const d = ex.rank - ab[ex.grp];
      if (d > 0.05) { if (!fav) { s -= d * 4; if (d > 0.6) bad = true; } else { s -= d * 1.5; if (d > 2) bad = true; } }
      else {
        const easy = -d;
        const addOk = ex.addw && canAdd(profile, loc) && (goal === 'muscle' || goal === 'strength');
        s -= easy * (addOk ? 0.6 : 1.6); if (easy > 2.2 && !addOk) bad = true;
        if (easy < 0.6) { s += 1.5; reasons.push(levelReason(ex, ab)); }
        else if (addOk) reasons.push('Mit Zusatzgewicht steigerbar');
      }
      if (ex.grp === 'squat' && (a.skills || []).includes('pistol')) s += 2;
      if (ex.grp === 'pull' && (a.skills || []).includes('pullup')) s += 1.5;
      if (ex.grp === 'hs' && (a.skills || []).includes('hs')) s += 1.5;
    } else {
      const lvl = EXP_LVL[a.exp] || 2;
      const tol = fav ? 2 : 1;
      if (ex.lvl > lvl + tol) { s -= (ex.lvl - lvl - tol) * 2.5; bad = true; }
    }
    // Passt das vorhandene Gewicht?
    if (ex.kind === 'load' && ex.std) {
      const opts = loadOptions(ex, loc, profile);
      if (opts && opts.length) {
        const need = estimate1RM(ex, profile) / (1 + 12 / 30);
        const max = opts[opts.length - 1], min = opts[0];
        if (max < need * 0.55) { s -= 5; bad = true; reasons.push('Deine Hantel ist hierfür eher leicht'); }
        else if (min > need * 1.45) { s -= 5; bad = true; }
        else if (loc === 'home') reasons.push('Gewicht passt zu deiner Ausrüstung');
        if (ex.heavy && max < ex.heavy * bodyweight(profile) * (EXP_F[a.exp] || 0.8)) s -= 3;
      }
    }
    if (r === 'main' && ex.uni) s -= 1;
    const pri = a.priority || [];
    if (r !== 'skill') for (const g of pri) if (DB.GROUPS[g].some(m => ex.prim.includes(m))) { s += 1.2; reasons.push('Priorität: ' + g); break; }
    if (dayUsed.has(ex.id)) s -= 40;
    if (used.has(ex.id)) s -= 2.5;
    s += hash(ex.id + ctx.seed) * 0.6;
    // Lieblingsübung: klar bevorzugt, aber nur wenn sie sinnvoll passt und nicht zu oft pro Woche vorkommt
    if (fav && !bad && !dayUsed.has(ex.id) && ((used.favN || {})[ex.id] || 0) < 2) { s += 5; reasons.unshift('★ Deine Lieblingsübung'); }
    return { s, reasons: [...new Set(reasons)].slice(0, 3) };
  }
  function levelReason(ex, ab) {
    const t = ab.tests;
    if (ex.grp === 'pull' || ex.grp === 'row') return `Passt zu deinem Level (${t.P === 0 ? 'noch kein Klimmzug' : '≈' + t.P + (t.P === 1 ? ' Klimmzug' : ' Klimmzüge')})`;
    if (ex.grp === 'push' || ex.grp === 'hs') return `Passt zu deinem Level (≈${t.PU} Liegestütze)`;
    if (ex.grp === 'dip') return `Passt zu deinem Level (≈${t.D} Dips)`;
    return 'Passende Schwierigkeitsstufe';
  }

  function rankFor(slot, ctx, limit) {
    const out = [];
    for (const ex of allExercises(ctx.profile)) {
      const r = scoreExercise(ex, slot, ctx);
      if (r) out.push({ ex, s: r.s, reasons: r.reasons });
    }
    out.sort((x, y) => y.s - x.s);
    return limit ? out.slice(0, limit) : out;
  }
  function allExercises(profile) { return DB.list.concat(((profile && profile.custom) || []).filter(e => !e.hidden)); }

  function buildPlan(profile) {
    const a = profile.answers || {};
    const days = Math.min(6, Math.max(2, +a.days || 3));
    let split = a.split && a.split !== 'auto' ? a.split : (days <= 3 ? 'fb' : days === 4 ? 'ul' : days === 5 ? 'ppl' : 'ppl');
    const keys = SPLITS[split][days];
    const goal = a.goal || 'muscle';
    const ranges = goalRanges(goal);
    const lvl = a.exp || 'some';
    const baseSets = { new: { main: 3, sec: 3, iso: 2 }, some: { main: 3, sec: 3, iso: 3 }, exp: { main: 4, sec: 3, iso: 3 }, vet: { main: 4, sec: 4, iso: 3 } }[lvl];
    const poorRecovery = (+a.sleep <= 5) || a.stress === 'high';
    const locs = a.location === 'both' ? ['home', 'gym'] : [a.location === 'gym' ? 'gym' : 'home'];
    const ab = abilities(a);
    const skills = (a.skills || []).filter(k => SKILL_GRP[k]);
    const restMain = goal === 'strength' ? 180 : goal === 'fit' ? 105 : 150;
    const dur = +a.duration || 60;

    const plan = { v: PLAN_VERSION, id: 'p' + Date.now().toString(36), created: new Date().toISOString(), split, splitName: SPLIT_NAMES[split], goal, days: [], meso: { start: todayISO(), len: 5 } };
    const usedBy = { home: new Set(), gym: new Set() };
    const nameCount = {};
    keys.forEach((k, di) => {
      const T = TEMPLATES[k];
      nameCount[k] = (nameCount[k] || 0) + 1;
      const slots = T.slots.map(x => Object.assign({}, x));
      if (skills.length) {
        const sk = skills[di % skills.length];
        slots.unshift(S([], 'skill', { skill: sk, p: ['skill'] }));
        if (goal === 'skills' && skills.length > 1) slots.splice(1, 0, S(['skill'], 'skill', { skill: skills[(di + 1) % skills.length] }));
      }
      for (const g of (a.priority || [])) {
        const ps = PRIO_SLOTS[g]; if (!ps || !ps.focus.includes(T.focus)) continue;
        const pat = ps.p[(di + (nameCount[k] - 1)) % ps.p.length];
        const role = ['hpull', 'hpush', 'lunge'].includes(pat) ? 'sec' : (pat === 'core' ? 'core' : 'iso');
        slots.push(S([pat], role, { prio: true }));
      }
      if (a.finisher === 'yes' || goal === 'fit') slots.push(S(['cond'], 'cond'));
      // Sätze, Wiederholungen, Pausen
      for (const sl of slots) {
        const role = sl.r;
        sl.sets = role === 'main' ? baseSets.main + (goal === 'strength' ? 1 : 0) : role === 'sec' ? baseSets.sec : role === 'iso' ? baseSets.iso : role === 'skill' ? 3 : role === 'cond' ? 5 : (lvl === 'new' ? 2 : 3);
        if (poorRecovery && (role === 'sec' || role === 'iso')) sl.sets = Math.max(2, sl.sets - 1);
        if (sl.prio) sl.sets = Math.max(2, sl.sets - (role === 'iso' ? 0 : 1));
        sl.rest = defaultRest(role, goal);
        sl.rr = ranges[role] || null;
        sl.id = 's' + Math.random().toString(36).slice(2, 8);
      }
      // Höchstens 7 Übungen pro Einheit: Unwichtigstes zuerst streichen, Grundübungen bleiben
      const keep = { main: 10, skill: 8, sec: 7, core: 5.5, iso: 4.5, cond: 2 };
      while (slots.length > MAX_EX) {
        let worst = -1, wv = Infinity;
        slots.forEach((sl, i) => { const v = keep[sl.r] + (sl.prio ? 0.8 : 0) - i * 0.01; if (v < wv) { wv = v; worst = i; } });
        slots.splice(worst, 1);
      }
      // Zeitbudget: erst Sätze kürzen, dann unwichtigste Übungen streichen (mindestens 5 Übungen)
      // Wenig Zeit: Pausen nur bei Isolation/Rumpf kürzen – Grundübungen und Ergänzungen behalten ihre Pause (3.15)
      if (dur <= 45) for (const sl of slots) if (sl.r === 'iso' || sl.r === 'core') sl.rest = Math.max(75, Math.round(sl.rest * 0.75 / 15) * 15);
      const prio = { main: 1, skill: 1.5, sec: 2, iso: 3, core: 3.5, cond: 4 };
      const est = () => 6 + slots.reduce((t, sl) => t + sl.sets * (0.75 + sl.rest / 60), 0);
      let guard = 0;
      while (est() > dur + 2 && guard++ < 60) {
        const order = slots.map((sl, i) => ({ sl, i, p: prio[sl.r] + (sl.prio ? -0.4 : 0) + i * 0.01 })).sort((x, y) => y.p - x.p);
        const red = order.find(o => o.sl.sets > (o.sl.r === 'main' ? 3 : 2) && o.sl.r !== 'cond');
        if (red) { red.sl.sets -= 1; continue; }
        const rem = order.find(o => o.sl.r !== 'main');
        if (rem && slots.length > MIN_EX) { slots.splice(rem.i, 1); continue; }
        const red2 = order.find(o => o.sl.sets > 2);
        if (red2) { red2.sl.sets -= 1; continue; }
        if (rem && slots.length > MIN_EX - 1) { slots.splice(rem.i, 1); continue; }
        break;
      }
      const day = { id: 'd' + di, key: k, name: T.name + (keys.filter(x => x === k).length > 1 ? ' ' + ['I', 'II', 'III'][nameCount[k] - 1] : ''), focus: T.focus, slots };
      for (const loc of locs) fillDay(day, loc, profile, ab, usedBy[loc], di);
      plan.days.push(day);
    });
    plan.locs = locs;
    balancePlan(plan, profile);
    return plan;
  }

  /* ================= Effizientes Wochenvolumen =================
     Pro Muskel und Woche: Grundziel ~10 harte Sätze, Schwerpunkte ~14, nie über 15 (danach kaum
     Zusatznutzen), mindestens ~5. Mittrainierte Muskeln zählen halb. Skills nur 2× pro Woche. */
  const VOL_T = { chest: 1, lats: 1, upperback: 1, sdelt: 1, rdelt: 1, biceps: 1, triceps: 1, quads: 1, hams: 1, glutes: 1, calves: 1, abs: 1 };
  const VOL_PAT = { chest: 'fly', lats: 'latiso', upperback: 'hpull', sdelt: 'side', rdelt: 'rear', biceps: 'biceps', triceps: 'triceps', quads: 'quadiso', hams: 'hamcurl', glutes: 'glute', calves: 'calf', abs: 'core' };
  const LOWER = ['quads', 'hams', 'glutes', 'calves'];
  function volTargets(profile, plan) {
    const pr = new Set(); for (const g of ((profile.answers || {}).priority || [])) for (const m of (DB.GROUPS[g] || [])) pr.add(m);
    const L = plan && plan.learn && plan.learn.T;
    const t = {}; for (const m in VOL_T) t[m] = L && L[m] != null ? L[m] : pr.has(m) ? (isCut(profile) ? 12 : 14) : 10; return t;
  }
  function mainLoc(plan, profile) { const l = plan.locs || ['home']; return l.includes('home') && (profile.answers || {}).location !== 'gym' ? 'home' : l[0]; }
  function planVolume(plan, profile, loc) {
    loc = loc || mainLoc(plan, profile);
    const exOf = id => DB.byId[id] || ((profile.custom || []).find(e => e.id === id));
    const week = {}, perDay = []; for (const m in DB.MUSCLES) week[m] = 0;
    for (const d of plan.days) {
      const dv = {}; for (const m in DB.MUSCLES) dv[m] = 0;
      for (const sl of d.slots) { const ex = sl.ex && exOf(sl.ex[loc]); if (!ex || ex.role === 's' || ex.role === 'x') continue; for (const m of ex.prim) dv[m] += sl.sets; for (const m of (ex.sec || [])) dv[m] += sl.sets * 0.5; }
      for (const m in dv) week[m] += dv[m]; perDay.push(dv);
    }
    return { week, perDay, targets: volTargets(profile, plan) };
  }
  // Tin: eigene Ziele (z. B. schrittweise beim automatischen Anpassen), tol: erlaubte Abweichung bevor etwas geändert wird
  function balancePlan(plan, profile, Tin, tol, opts) {
    opts = opts || {}; let added = 0;
    const loc = plan.place || mainLoc(plan, profile); const changes = [];
    const learned = !!(Tin || (plan.learn && plan.learn.T)); tol = tol != null ? tol : learned ? 1 : 2.5;
    const exOf = id => DB.byId[id] || ((profile.custom || []).find(e => e.id === id));
    const exAt = sl => sl.ex && exOf(sl.ex[loc]);
    const hit = (sl, m) => { const ex = exAt(sl); if (!ex || ex.role === 's' || ex.role === 'x') return 0; return ex.prim.includes(m) ? 1 : (ex.sec || []).includes(m) ? 0.5 : 0; };
    // 1) Skill-Übungen nur an 2 Tagen (gleichmäßig verteilt), außer von dir festgelegt
    const skillDays = {};
    plan.days.forEach((d, di) => d.slots.forEach(sl => { if (sl.r === 'skill') (skillDays[sl.skill || 'x'] = skillDays[sl.skill || 'x'] || []).push(di); }));
    for (const k in skillDays) {
      const ds = skillDays[k]; if (ds.length <= 2) continue;
      const keepD = new Set([ds[0], ds[Math.floor(ds.length / 2)]]);
      for (const di of ds) if (!keepD.has(di)) { const d = plan.days[di]; const rm = d.slots.filter(sl => sl.r === 'skill' && (sl.skill || 'x') === k && !(sl.locked && Object.values(sl.locked).some(Boolean))); d.slots = d.slots.filter(sl => !rm.includes(sl)); for (const sl of rm) { const ex = exAt(sl); changes.push((ex ? ex.name : 'Skill-Übung') + ' nur noch 2× pro Woche – aus ' + d.name + ' entfernt'); } }
    }
    const T = Object.assign({}, Tin || volTargets(profile, plan));
    // 2) Zu viel: über 15 Sätze → Sätze bei Ergänzung/Isolation kürzen (mind. 2 Sätze)
    for (let guard = 0; guard < 40; guard++) {
      const { week } = planVolume(plan, profile, loc);
      const over = Object.keys(T).filter(m => week[m] > Math.min(15.5, learned ? T[m] + tol : 99)).sort((a, b) => (week[b] - T[b]) - (week[a] - T[a]))[0];
      if (!over) break;
      let best = null;
      for (const d of plan.days) for (const sl of d.slots) {
        const h = hit(sl, over); if (!h || sl.sets <= 2 || (sl.r === 'main' && sl.sets <= 3) || sl.r === 'skill') continue;
        const ex = exAt(sl); const hurts = ex.prim.concat(ex.sec || []).some(m => m !== over && T[m] && week[m] - 1 < T[m] - 1);
        const v = h * 2 + (sl.r === 'iso' ? 1 : 0) - (hurts ? 3 : 0) + sl.sets * 0.1;
        if (!best || v > best.v) best = { sl, v, d };
      }
      if (!best) break;
      best.sl.sets -= 1; changes.push('−1 Satz ' + exAt(best.sl).name);
    }
    // 3) Zu wenig: erst vorhandene Übungen +1 Satz, sonst neue Übung an einem passenden Tag
    for (let guard = 0; guard < 30; guard++) {
      const { week, perDay } = planVolume(plan, profile, loc);
      const under = Object.keys(T).filter(m => week[m] < T[m] - tol).sort((a, b) => (week[a] - T[a]) - (week[b] - T[b]))[0];
      if (!under) break;
      const direct = [];
      const full = m2 => m2 !== under && T[m2] != null && week[m2] + 1 > T[m2]; // anderer Hauptmuskel schon am Ziel (z. B. Muskelkater-Deckel)
      plan.days.forEach((d, di) => d.slots.forEach(sl => { if (hit(sl, under) === 1 && sl.sets < (sl.r === 'iso' || sl.r === 'core' ? 4 : 5) && sl.r !== 'skill' && perDay[di][under] < 8 && !(learned && exAt(sl).prim.some(full))) direct.push({ sl, d }); }));
      direct.sort((a, b) => a.sl.sets - b.sl.sets);
      if (direct.length && week[under] >= T[under] - 6) { direct[0].sl.sets += 1; changes.push('+1 Satz ' + exAt(direct[0].sl).name); continue; }
      // neue Übung
      const want = LOWER.includes(under) ? ['lower', 'full'] : under === 'abs' ? ['lower', 'full', 'upper'] : ['upper', 'full'];
      const pat = VOL_PAT[under];
      // Volle Tage: eine Übung ersetzen, deren Muskeln auch ohne sie (fast) im Ziel bleiben
      const gap = T[under] - week[under];
      const spare = (d) => {
        let best = null;
        for (const y of d.slots) {
          if (y.r === 'main' || y.r === 'skill' || y.bal || (y.locked && Object.values(y.locked).some(Boolean))) continue;
          const ex = exAt(y); if (!ex) continue;
          // danach darf kein anderer Muskel schlechter dastehen als jetzt der fehlende
          const worst = Math.max(0, ...ex.prim.filter(m => T[m]).map(m => T[m] - (week[m] - y.sets)));
          if (worst <= gap - 2 && (!best || worst < best.v)) best = { y, v: worst };
        }
        return best && best.y;
      };
      const cands = plan.days.map((d, di) => ({ d, di, sp: d.slots.length >= MAX_EX ? spare(d) : null })).filter(x => want.includes(x.d.focus) && (x.d.slots.length < MAX_EX || x.sp) && !x.d.slots.some(sl => sl.p && sl.p.includes(pat)) && perDay[x.di][under] < 6).sort((a, b) => (a.sp ? 1 : 0) - (b.sp ? 1 : 0) || a.d.slots.length - b.d.slots.length);
      if (opts.maxNew != null && added >= opts.maxNew) { if (direct.length) { direct[0].sl.sets += 1; changes.push('+1 Satz ' + exAt(direct[0].sl).name); continue; } T[under] = 0; continue; }
      if (!cands.length) { if (direct.length) { direct[0].sl.sets += 1; changes.push('+1 Satz ' + exAt(direct[0].sl).name); continue; } T[under] = 0; continue; }
      const d = cands[0].d;
      if (cands[0].sp) { const y = cands[0].sp; d.slots = d.slots.filter(z => z !== y); changes.push('Ersetzt: ' + exAt(y).name); } const role = pat === 'core' ? 'core' : pat === 'hpull' ? 'sec' : 'iso';
      const sl = S([pat], role, { sets: 3, rest: defaultRest(role, plan.goal), rr: goalRanges(plan.goal || 'muscle')[role] || null, id: 's' + Math.random().toString(36).slice(2, 8), ex: {}, why: {}, bal: true });
      let ok = false;
      for (const l of (plan.locs || [loc])) {
        const used = new Set(); plan.days.forEach(x => x.slots.forEach(y => y.ex && y.ex[l] && used.add(y.ex[l])));
        const best = rankFor(sl, { profile, loc: l, eqSet: locEquip(profile, l), used, dayUsed: new Set(d.slots.map(y => y.ex && y.ex[l]).filter(Boolean)), ab: abilities(profile.answers || {}), seed: d.id + sl.id }, 8).filter(x => !(learned && x.ex.prim.some(full)))[0];
        if (best) { sl.ex[l] = best.ex.id; sl.why[l] = ['Ergänzt dein Wochenvolumen für ' + DB.MUSCLES[under]].concat(best.reasons.slice(0, 1)); if (l === loc) ok = true; }
      }
      if (!ok) { T[under] = 0; continue; }
      const ci = d.slots.findIndex(y => y.r === 'core' || y.r === 'cond'); if (ci >= 0) d.slots.splice(ci, 0, sl); else d.slots.push(sl);
      added++; changes.push('Neu: ' + exOf(sl.ex[loc]).name + ' (' + d.name + ')');
    }
    plan.bal = 1;
    return changes;
  }

  /* ================= Volumen lernen (3.19, Nutzerwunsch 18.11.: Regeneration ist der Engpass) =================
     Pro Muskel jede Woche: Leistungstrend (beste Satz-Leistung je Einheit, letzte 6 Wochen, %/Woche) + Muskelkater nach
     dem Training (Formwerk) + Erholung (Formwerk rec7/rec28) + Wochen-Check-in → Wochenziel in Sätzen anpassen.
       stärker, kaum Muskelkater, gut erholt → +1 · gleich, kaum Muskelkater, gut erholt → +1 (Reiz zu klein)
       schwächer + viel Muskelkater oder schlecht erholt → −2 · gleich + viel Muskelkater → −1
       schwächer trotz guter Erholung → halten (eher Diät/Schlaf) · zu wenig Daten → halten
     Grenzen 6–15 (bei dauerhaft niedriger Erholung 12), höchstens ±2 pro Woche. Reserve (RIR) je Plan: +1, wenn die Erholung
     schlecht ist oder mehrere Muskeln schwächer werden; zurück auf 0, wenn alles gut läuft. */
  const FW_G = { brust: ['chest'], ruecken: ['lats', 'upperback'], schultern: ['sdelt', 'rdelt'], bizeps: ['biceps'], trizeps: ['triceps'], vorn: ['quads'], hinten: ['glutes', 'hams'], waden: ['calves'], rumpf: ['abs'] };
  function learnVolume(plan, profile, ctx) {
    ctx = ctx || {}; const fw = ctx.fw || null; const ws = ctx.workouts || (WK && WK()) || [];
    const L = plan.learn || {}; const T0 = volTargets(profile, plan); const def = volTargets(profile);
    const since = todayISO(new Date(Date.now() - 42 * 864e5));
    const exOf = id => DB.byId[id] || ((profile.custom || []).find(e => e.id === id));
    const recent = ws.filter(w => w.date >= since && (!plan.place || !w.loc || w.loc === plan.place)).sort((a, b) => (a.date < b.date ? -1 : 1));
    // Leistungstrend je Übung → je Muskel (gewichtet nach Zahl der Einheiten)
    const series = {};
    for (const w of recent) for (const e of w.exercises || []) {
      const ex = exOf(e.exId); if (!ex || ex.kind === 'int') continue;
      const b = sessionBest(ex, e, w.bw); if (!(b > 0)) continue;
      (series[e.exId] = series[e.exId] || []).push({ d: w.date, b });
    }
    const tr = {}, trN = {};
    for (const id in series) {
      const a = series[id]; if (a.length < 2) continue; const ex = exOf(id);
      const days = (new Date(a[a.length - 1].d) - new Date(a[0].d)) / 864e5; if (days < 5) continue;
      const h = Math.ceil(a.length / 2); const m1 = a.slice(0, h).reduce((t, x) => t + x.b, 0) / h, m2 = a.slice(-h).reduce((t, x) => t + x.b, 0) / h;
      const pct = (m2 - m1) / m1 * 100 / Math.max(1, days * (a.length > 2 ? 0.5 : 1) / 7);
      for (const m of ex.prim) if (VOL_T[m]) { tr[m] = (tr[m] || 0) + pct * a.length; trN[m] = (trN[m] || 0) + a.length; }
    }
    const ck = (profile.checkins || []).filter(c => c.week >= todayISO(new Date(Date.now() - 14 * 864e5))).slice(-1)[0] || null;
    const rec7 = fw && fw.rec7 != null ? fw.rec7 : null, rec28 = fw && fw.rec28 != null ? fw.rec28 : null;
    const poor = (rec7 != null && rec7 < 45) || !!(ck && ck.score >= 2.5);
    const good = (rec7 == null || rec7 >= 60) && !(ck && ck.score >= 1.5);
    const hi = rec28 != null && rec28 < 55 ? 12 : 15, lo = 6;
    const soreOf = m => { if (!fw || !fw.sore) return null; for (const g in FW_G) if (FW_G[g].includes(m) && fw.sore[g] != null && (fw.soreN || {})[g] >= 1) return fw.sore[g]; return null; };
    const planned = planVolume(plan, profile, plan.place || undefined).week;
    // 3.24 (Auftrag 19.11.): +1, wenn 2 Wochen in Folge gute Erholung UND Leistung steigt · −1, wenn Erholung oft gelb/rot · Grenzen 10–20
    const wk = (fw && fw.weeks) || null; const goodBoth = !!(wk && wk.length >= 2 && wk[0].good && wk[1].good); const oftenBad = !!(wk && wk[0] && wk[0].bad >= 4);
    const T = {}, why = {}; let downs = 0; const lo10 = 10, hi20 = 20;
    for (const m in VOL_T) {
      const cur = T0[m]; const t = trN[m] >= 2 ? tr[m] / trN[m] : null;
      if (t != null && t <= -1) downs++;
      const tt = t == null ? '' : (t >= 0 ? 'Kraft +' : 'Kraft −') + Math.abs(Math.round(t * 10) / 10).toString().replace('.', ',') + ' %/Woche';
      let d = 0, txt;
      if (oftenBad) { d = -1; txt = 'Erholung oft gelb/rot → 1 Satz weniger'; }
      else if (goodBoth && t != null && t >= 1) { d = 1; txt = '2 Wochen gut erholt und stärker → 1 Satz mehr'; }
      else if (t == null) txt = 'Noch zu wenig Daten – Ziel bleibt';
      else if (!goodBoth) txt = 'Erholung noch nicht 2 Wochen gut – Ziel bleibt';
      else txt = 'Leistung steigt noch nicht – Ziel bleibt';
      let nv = Math.max(lo10, Math.min(hi20, cur + d));
      if (cur < lo10) txt += ' · Untergrenze ' + lo10 + ' Sätze';
      T[m] = nv; why[m] = [tt, txt].filter(Boolean).join(' · ');
    }
    let rir = L.rir || 0; const rirWas = rir;
    if (poor || downs >= 3) rir = Math.min(1, rir + 1); else if (good && downs === 0) rir = Math.max(0, rir - 1);
    const notes = [];
    if (rec7 != null) notes.push('Erholung 7 Tage ' + rec7 + ' %' + (rec28 != null ? ', 28 Tage ' + rec28 + ' %' : ''));
    if (ck) notes.push('Wochen-Check-in: ' + (ck.score >= 2.5 ? 'erschöpft' : ck.score <= -2 ? 'fit' : 'normal'));
    if (rir !== rirWas) notes.push(rir > rirWas ? 'Reserve +1 Wdh. (mehr Puffer zum Erholen)' : 'Reserve wieder normal');
    return { T, why, rir, rirWas, notes, def, n: recent.length };
  }

  function fillDay(day, loc, profile, ab, used, di) {
    ab = ab || abilities(profile.answers || {});
    used = used || new Set();
    const dayUsed = new Set();
    const eqSet = locEquip(profile, loc);
    for (const sl of day.slots) {
      sl.ex = sl.ex || {}; sl.why = sl.why || {};
      if (sl.ex[loc] && sl.locked && sl.locked[loc]) { dayUsed.add(sl.ex[loc]); continue; }
      const ctx = { profile, loc, eqSet, used, dayUsed, ab, seed: day.id + sl.id };
      const best = rankFor(sl, ctx, 1)[0];
      if (best) { sl.ex[loc] = best.ex.id; sl.why[loc] = best.reasons; dayUsed.add(best.ex.id); used.add(best.ex.id); if ((profile.favs || []).includes(best.ex.id)) { used.favN = used.favN || {}; used.favN[best.ex.id] = (used.favN[best.ex.id] || 0) + 1; } }
      else { sl.ex[loc] = null; }
    }
    day.slots = day.slots.filter(sl => Object.values(sl.ex).some(Boolean));
  }

  /* ================= Zeit anpassen: Einheit kürzer / länger =================
     Kürzer: unwichtigste Übungen weglassen (nie die letzte für eine Muskelgruppe, nie Grundübungen),
             die Sätze der wegfallenden Muskeln auf verwandte Übungen verteilen (+1 Satz), kürzere Pausen.
     Länger: 1–2 passende Zusatzübungen (Prioritäten zuerst), etwas mehr Pause bei schweren Übungen. */
  const KEEP = { main: 5, skill: 4, sec: 3, iso: 2, core: 1, cond: 0 };
  const EXTRA_PAT = { upper: ['side', 'rear', 'biceps', 'triceps', 'fly', 'latiso'], lower: ['calf', 'hamcurl', 'glute', 'quadiso', 'core'], full: ['side', 'rear', 'biceps', 'triceps', 'calf', 'core'] };
  const r5 = x => Math.round(x / 5) * 5;
  function timePlan(day, loc, delta, profile, plan) {
    const exOf = id => DB.byId[id] || ((profile && profile.custom) || []).find(e => e.id === id);
    const groupsOf = ex => Object.keys(DB.GROUPS).filter(g => ex.prim.some(m => DB.GROUPS[g].includes(m)));
    let items = day.slots.filter(sl => sl.ex[loc] && exOf(sl.ex[loc])).map(sl => ({ slot: sl, ex: exOf(sl.ex[loc]), role: sl.r, sets: sl.sets, rest: sl.rest, boost: 0, factor: 1 }));
    const out = { delta, removed: [], boosted: [], added: [], notes: [] };
    const favs = (profile && profile.favs) || [];
    if (delta < 0) {
      for (let n = 0; n < -delta && items.length > 3; n++) {
        const cover = {}; for (const it of items) for (const g of groupsOf(it.ex)) cover[g] = (cover[g] || 0) + 1;
        const cand = items.filter(it => it.role !== 'main').map(it => ({ it, v: KEEP[it.role] + (groupsOf(it.ex).every(g => cover[g] >= 2) ? 0 : 3) + (favs.includes(it.ex.id) ? 1.5 : 0) + (it.slot && it.slot.prio ? 3 : 0) })).sort((a, b) => a.v - b.v)[0];
        if (!cand) break;
        items = items.filter(x => x !== cand.it); out.removed.push(cand.it);
      }
      for (const rm of out.removed) {
        const gs = groupsOf(rm.ex);
        const pick = items.filter(it => it.boost === 0 && (it.role === 'main' || it.role === 'sec' || it.role === 'iso') && groupsOf(it.ex).some(g => gs.includes(g)) && it.sets + 1 <= (it.role === 'iso' ? 4 : 5))
          .sort((a, b) => (KEEP[b.role] - KEEP[a.role]) || (a.sets - b.sets))[0];
        if (pick) { pick.boost = 1; out.boosted.push(pick); }
      }
      const f = delta <= -2 ? { main: 1, sec: 0.9, iso: 0.7, core: 0.7 } : { main: 1, sec: 0.95, iso: 0.8, core: 0.8 }; // Grundübungen: Pause bleibt (3.15)
      for (const it of items) it.factor = f[it.role] || 0.8;
    } else if (delta > 0) {
      const focus = day.focus || 'full';
      const pats = []; for (const g of ((profile.answers || {}).priority || [])) { const ps = PRIO_SLOTS[g]; if (ps && ps.focus.includes(focus)) pats.push(...ps.p); }
      pats.push(...(EXTRA_PAT[focus] || EXTRA_PAT.full));
      const have = new Set(items.map(it => it.ex.pat)); const used = items.map(it => it.ex.id);
      const isoSets = (items.find(it => it.role === 'iso') || {}).sets || 3;
      for (const pat of pats) {
        if (out.added.length >= delta) break;
        if (have.has(pat)) continue;
        const role = ['hpull', 'hpush', 'lunge'].includes(pat) ? 'sec' : pat === 'core' ? 'core' : 'iso';
        const best = alternatives(S([pat], role), loc, profile, used)[0];
        if (!best || best.s <= -10) continue;
        have.add(pat); used.push(best.ex.id);
        const it = { slot: null, ex: best.ex, role, sets: role === 'sec' ? 3 : isoSets, rest: role === 'sec' ? 165 : role === 'core' ? 90 : 120, boost: 0, factor: 1, spec: S([pat], role) };
        items.push(it); out.added.push(it);
      }
      for (const it of items) if (it.role === 'main' || it.role === 'sec') it.factor = 1.15;
    }
    out.items = items;
    out.minutes = Math.round(6 + items.reduce((t, it) => t + (it.sets + it.boost) * (0.8 + r5(it.rest * it.factor) / 60), 0));
    const names = a => a.map(x => x.ex.name).join(', ');
    if (out.removed.length) out.notes.push('Weggelassen: ' + names(out.removed));
    if (out.boosted.length) out.notes.push('+1 Satz: ' + names(out.boosted));
    if (delta < 0) out.notes.push('Kürzere Pausen');
    if (out.added.length) out.notes.push('Dazu: ' + names(out.added));
    if (delta > 0 && !out.added.length) out.notes.push('Keine passende Zusatzübung gefunden – nur etwas mehr Pause');
    if (delta > 0) out.notes.push('Etwas mehr Pause bei schweren Übungen');
    return out;
  }

  function alternatives(slot, loc, profile, excludeIds) {
    const ctx = { profile, loc, eqSet: locEquip(profile, loc), used: new Set(), dayUsed: new Set(excludeIds || []), ab: abilities(profile.answers || {}), seed: 'alt' };
    const wide = Object.assign({}, slot, { p: slot.r === 'skill' || slot.r === 'core' || slot.r === 'cond' ? slot.p : widenPatterns(slot.p) });
    return rankFor(wide, ctx).filter(x => x.s > -30);
  }
  function widenPatterns(p) {
    const near = { vpull: ['hpull', 'latiso'], hpull: ['vpull'], hpush: ['dip', 'fly'], dip: ['hpush', 'triceps'], vpush: ['hpush'], squat: ['lunge'], lunge: ['squat'], hinge: ['glute', 'hamcurl'], glute: ['hinge'], hamcurl: ['hinge'], quadiso: ['squat', 'lunge'], side: ['rear', 'vpush'], rear: ['side', 'hpull'], latiso: ['vpull'], fly: ['hpush'], biceps: [], triceps: ['dip'], calf: [] };
    const out = [...p]; for (const x of p) for (const y of (near[x] || [])) if (!out.includes(y)) out.push(y);
    return out;
  }

  /* ================= Bereit-Training: müde Muskeln auslassen (Formwerk) =================
     block = { muscles:Set (noch müde → nicht trainieren), partial:Set (teilweise erholt → eher meiden), inj:Set (Schmerz-Stellen) }.
     Übungen, deren Hauptmuskel müde ist (oder die eine schmerzende Stelle belasten), fallen weg und werden durch
     gleichwertige Übungen für bereite Muskeln ersetzt (gleiche Rolle und Sätze). Vorrang: Favoriten, dann Übungen
     aus den eigenen Plänen, Muskeln mit wenig Sätzen diese Woche. Ergebnis ist ein Tag-Objekt, der Plan bleibt unverändert. */
  const READY_PATS = { main: ['squat', 'hinge', 'vpull', 'hpull', 'hpush', 'vpush', 'dip', 'lunge', 'glute'], sec: ['hpull', 'vpull', 'hpush', 'vpush', 'dip', 'lunge', 'squat', 'hinge', 'glute', 'latiso'],
    iso: ['side', 'rear', 'biceps', 'triceps', 'fly', 'latiso', 'calf', 'hamcurl', 'quadiso'], core: ['core'] };
  const ROLE_ORD = { skill: 0, main: 1, sec: 2, iso: 3, core: 4, cond: 5 };
  function readyDay(day, loc, profile, plan, block, plans) {
    const exOf = id => DB.byId[id] || ((profile && profile.custom) || []).find(e => e.id === id);
    const bm = block.muscles || new Set(), bp = block.partial || new Set(), bi = block.inj || new Set();
    const hit = ex => ex.prim.some(m => bm.has(m)) || (ex.inj || []).some(t => bi.has(t));
    const slots = day.slots.filter(sl => sl.ex[loc] && exOf(sl.ex[loc]));
    const bad = slots.filter(sl => hit(exOf(sl.ex[loc])));
    if (!bad.length) return null;
    const keep = slots.filter(sl => !bad.includes(sl)).map(sl => Object.assign({}, sl));
    for (const sl of keep) if (sl.ss && !keep.some(o => o !== sl && o.ss === sl.ss)) delete sl.ss;
    const used = new Set(keep.map(sl => sl.ex[loc]));
    const known = new Set(); for (const pl of plans || []) for (const d of pl.days || []) for (const sl of d.slots || []) for (const id of Object.values(sl.ex || {})) if (id) known.add(id);
    const favs = new Set((profile && profile.favs) || []);
    const cover = {}; const addCover = ex => { for (const m of ex.prim) cover[m] = (cover[m] || 0) + 1; };
    keep.forEach(sl => addCover(exOf(sl.ex[loc])));
    const ws = (WK && WK()) || [];
    const week = weeklyMuscleSets(ws, todayISO(startOfWeek()));
    const ctx = { profile, loc, eqSet: locEquip(profile, loc), used: new Set(), dayUsed: used, ab: abilities(profile.answers || {}), seed: 'ready' + todayISO() };
    const goal = (plan && plan.goal) || (profile.answers || {}).goal || 'muscle';
    const removed = [], added = [];
    for (const sl of [...bad].sort((a, b) => (ROLE_ORD[a.r] ?? 9) - (ROLE_ORD[b.r] ?? 9))) {
      removed.push(exOf(sl.ex[loc]));
      const role = sl.r === 'skill' ? 'iso' : sl.r;
      const pats = READY_PATS[role]; if (!pats) continue;
      let best = null;
      for (const ex of allExercises(profile)) {
        if (used.has(ex.id) || hit(ex)) continue;
        const r = scoreExercise(ex, S(pats, role), ctx); if (!r) continue;
        let v = r.s;
        if (favs.has(ex.id)) v += 8; // Favoriten klar vorn (Nutzerwunsch)
        if (known.has(ex.id)) v += 3; // kennt er schon: Verlauf und Gewichte passen
        v -= 3 * (ex.sec || []).filter(m => bm.has(m)).length;
        v -= 2 * ex.prim.filter(m => bp.has(m)).length;
        v -= 2.5 * ex.prim.reduce((t, m) => t + (cover[m] || 0), 0) / Math.max(1, ex.prim.length);
        const m0 = ex.prim[0]; if (m0 != null) v += Math.max(0, Math.min(3, (10 - (week[m0] || 0)) / 3));
        if (!best || v > best.v) best = { ex, v, why: r.reasons };
      }
      if (!best || best.v < -12) continue;
      used.add(best.ex.id); addCover(best.ex); added.push(best.ex);
      const why = favs.has(best.ex.id) ? ['★ Deine Lieblingsübung'] : known.has(best.ex.id) ? ['Aus deinen Plänen'] : best.why;
      keep.push(S([best.ex.pat], role, { id: 'r' + Math.random().toString(36).slice(2, 8), sets: sl.sets, rest: sl.r === role ? sl.rest : defaultRest(role, goal),
        rr: goalRanges(goal)[role] || null, ex: { [loc]: best.ex.id }, why: { [loc]: why }, ready: true }));
    }
    keep.sort((a, b) => (ROLE_ORD[a.r] ?? 9) - (ROLE_ORD[b.r] ?? 9));
    return { day: Object.assign({}, day, { slots: keep }), removed, added, kept: slots.length - bad.length, total: slots.length };
  }

  /* ================= Tagesanpassung aus Formwerk (3.23, Nutzerwunsch 19.11.) =================
     rd = GET /v1/readiness: {color, recovery, sore: {gruppe: 1 leicht|2 mittel|3 stark}, pain: [{k, label, inj}], yesterdayBaseball, sick}.
     Regeln (Reihenfolge): Schmerz → betroffene Übungen durch schmerzfreie Variante ersetzen, sonst streichen (nie in den Bereich trainieren) ·
     Muskelkater stark → Übung ersetzen (andere Muskelgruppe) oder streichen · leicht −1 Satz · mittel −1 (ab 4 Sätzen −2) und Gewicht −10 % ·
     gestern Baseball → Schulter, Brust/Drücken, Unterarm/Ellenbogen, Rumpf −1 (ab 4 Sätzen −2), keine schweren Überkopf-Übungen ·
     Erholung rot → Gesamtvolumen −30 %, keine Steigerung · gelb → keine Steigerung · keine Daten → Plan bleibt.
     opts.only (Set von Änderungs-IDs): nur diese anwenden (Modus „Anpassungen bestätigen“). Der Plan selbst bleibt unverändert. */
  const ADJ_G = { brust: ['chest'], ruecken: ['lats', 'upperback'], schultern: ['fdelt', 'sdelt', 'rdelt'], bizeps: ['biceps'], trizeps: ['triceps'], griff: ['forearms'], rumpf: ['abs', 'obliques', 'lowback'], vorn: ['quads'], hinten: ['glutes', 'hams'], waden: ['calves'] };
  const ADJ_GL = { brust: 'Brust', ruecken: 'Rücken', schultern: 'Schultern', bizeps: 'Bizeps', trizeps: 'Trizeps', griff: 'Unterarme', rumpf: 'Rumpf', vorn: 'Beine vorn', hinten: 'Po & Beinbeuger', waden: 'Waden' };
  const SORE_T = ['', 'leicht', 'mittel', 'stark'];
  const BB_G = new Set(['schultern', 'brust', 'griff', 'rumpf']);
  function groupsOfEx(ex) { return Object.keys(ADJ_G).filter(g => ex.prim.some(m => ADJ_G[g].includes(m))); }
  function adjustDay(day, loc, profile, plan, rd, opts) {
    opts = opts || {};
    const exOf = id => DB.byId[id] || ((profile && profile.custom) || []).find(e => e.id === id);
    const out = { slots: [], removed: [], changes: [], banner: [], any: false, noUp: false };
    const base = day.slots.filter(sl => sl.ex[loc] && exOf(sl.ex[loc]));
    if (!rd || (!rd.checkin && (!rd.color || rd.color === 'none') && !rd.yesterdayBaseball)) { out.slots = base.map(sl => Object.assign({}, sl, { _adj: [] })); return out; }
    const ok = id => !opts.only || opts.only.has(id);
    const sore = rd.sore || {}; const inj = new Set((rd.pain || []).map(p => p.inj).filter(Boolean));
    const painLbl = t => ((rd.pain || []).find(p => p.inj === t) || {}).label || t;
    const strongM = new Set(); for (const g in sore) if (sore[g] >= 3) (ADJ_G[g] || []).forEach(m => strongM.add(m));
    const bad = ex => (ex.inj || []).some(t => inj.has(t)) || ex.prim.some(m => strongM.has(m));
    const used = new Set(base.map(sl => sl.ex[loc]));
    const favs = new Set((profile && profile.favs) || []);
    const known = new Set(); for (const pl of opts.plans || [plan]) for (const d of (pl && pl.days) || []) for (const sl of d.slots || []) for (const id of Object.values(sl.ex || {})) if (id) known.add(id);
    const ctx = { profile, loc, eqSet: locEquip(profile, loc), used: new Set(), dayUsed: used, ab: abilities(profile.answers || {}), seed: 'adj' + todayISO() };
    const pick = (sl, sameFirst) => {
      // 1) gleiche Bewegung, schmerzfrei/anderer Muskel (z. B. Fliegende statt Bankdrücken bei Ellenbogen), 2) beliebige Übung gleicher Rolle für bereite Muskeln
      if (sameFirst) { const alt = alternatives(sl, loc, profile, [...used]).find(x => !bad(x.ex)); if (alt) return alt.ex; }
      const role = sl.r === 'skill' ? 'iso' : sl.r; const pats = READY_PATS[role]; if (!pats) return null;
      let best = null;
      for (const ex of allExercises(profile)) {
        if (used.has(ex.id) || bad(ex)) continue;
        const r = scoreExercise(ex, S(pats, role), ctx); if (!r) continue;
        let v = r.s + (favs.has(ex.id) ? 8 : 0) + (known.has(ex.id) ? 3 : 0);
        v -= 2 * groupsOfEx(ex).filter(g => sore[g] >= 2).length;
        if (rd.yesterdayBaseball && groupsOfEx(ex).some(g => BB_G.has(g))) v -= 2;
        if (!best || v > best.v) best = { ex, v };
      }
      return best && best.v > -12 ? best.ex : null;
    };
    const add = (o, id, kind, text) => { o._adj.push(text); out.changes.push({ id, kind, slotId: o.id, text }); out.any = true; };
    for (const sl0 of base) {
      const o = Object.assign({}, sl0, { ex: Object.assign({}, sl0.ex), _adj: [] }); let ex = exOf(o.ex[loc]);
      // Schmerz / starker Muskelkater → ersetzen oder streichen
      const painT = (ex.inj || []).filter(t => inj.has(t));
      const strongG = groupsOfEx(ex).filter(g => sore[g] >= 3);
      if (painT.length || strongG.length) {
        const why = painT.length ? 'Schmerz ' + painLbl(painT[0]) : 'Muskelkater ' + ADJ_GL[strongG[0]] + ' stark';
        const id = 'swap:' + o.id;
        if (ok(id)) {
          const nx = pick(o, !!painT.length);
          if (nx) { used.add(nx.id); out.changes.push({ id, kind: 'swap', slotId: o.id, text: ex.name + ' → ' + nx.name + ': ' + why }); out.any = true; o._adj.push('Ersetzt ' + ex.name + ': ' + why); o._from = ex.id; o.ex[loc] = nx.id; ex = nx; }
          else { out.removed.push({ ex, why, slotId: o.id }); out.changes.push({ id, kind: 'drop', slotId: o.id, text: 'Gestrichen: ' + ex.name + ' (' + why + ')' }); out.any = true; continue; }
        }
      }
      // Muskelkater leicht/mittel → Sätze, mittel auch Gewicht
      const gs = groupsOfEx(ex); const sv = Math.max(0, ...gs.map(g => sore[g] || 0)); const sg = gs.find(g => (sore[g] || 0) === sv);
      if (sv === 1 || sv === 2) {
        const id = 'sore:' + o.id;
        if (ok(id)) {
          const d = sv === 2 && o.sets >= 4 ? 2 : 1; const n = Math.max(1, o.sets - d);
          if (n < o.sets) add(o, id, 'sets', '−' + (o.sets - n) + (o.sets - n > 1 ? ' Sätze' : ' Satz') + ': Muskelkater ' + SORE_T[sv] + ' (' + ADJ_GL[sg] + ')');
          o.sets = n;
        }
        if (sv === 2 && ex.kind === 'load' && ok(id + ':w')) { o._loadF = 0.9; add(o, id + ':w', 'load', 'Gewicht −10 %: Muskelkater mittel'); }
      }
      // gestern Baseball
      if (rd.yesterdayBaseball) {
        const press = ['hpush', 'vpush', 'dip'].includes(ex.pat); const elbow = (ex.inj || []).includes('elbow') || (ex.inj || []).includes('shoulder');
        const hit = press || elbow || gs.some(g => BB_G.has(g));
        const overhead = ex.pat === 'vpush' && (ex.kind === 'load' || o.r === 'main');
        if (overhead && ok('bbo:' + o.id)) {
          const nx = pick(Object.assign({}, o, { p: ['side', 'rear'], r: 'iso' }), false);
          if (nx) { used.add(nx.id); out.changes.push({ id: 'bbo:' + o.id, kind: 'swap', slotId: o.id, text: ex.name + ' → ' + nx.name + ': gestern Baseball' }); out.any = true; o._adj.push('Ersetzt ' + ex.name + ': keine schweren Überkopf-Übungen nach Baseball'); o._from = o._from || ex.id; o.ex[loc] = nx.id; ex = nx; }
          else { out.removed.push({ ex, why: 'gestern Baseball', slotId: o.id }); out.changes.push({ id: 'bbo:' + o.id, kind: 'drop', slotId: o.id, text: 'Gestrichen: ' + ex.name + ' (gestern Baseball, Überkopf)' }); out.any = true; continue; }
        } else if (hit && ok('bb:' + o.id) && o.sets > 1) {
          const d = o.sets >= 4 ? 2 : 1; add(o, 'bb:' + o.id, 'sets', '−' + d + (d > 1 ? ' Sätze' : ' Satz') + ': gestern Baseball'); o.sets = Math.max(1, o.sets - d);
        }
      }
      out.slots.push(o);
    }
    // Erholung rot: Gesamtvolumen −30 % (erst Isolation/Ergänzung kürzen), keine Steigerung · gelb: keine Steigerung
    if (rd.color === 'red' && ok('red')) {
      const tot = out.slots.reduce((t, s) => t + s.sets, 0); let cut = tot - Math.round(tot * 0.7);
      const order = [...out.slots].sort((a, b) => (KEEP[a.r] ?? 2) - (KEEP[b.r] ?? 2) || b.sets - a.sets);
      for (let k = 0; cut > 0 && k < 20; k++) { const s = order.filter(x => x.sets > 1).sort((a, b) => b.sets - a.sets || (KEEP[a.r] ?? 2) - (KEEP[b.r] ?? 2))[0]; if (!s) break; s.sets--; s._red = (s._red || 0) + 1; cut--; }
      for (const s of out.slots) if (s._red) s._adj.push('−' + s._red + (s._red > 1 ? ' Sätze' : ' Satz') + ': Erholung rot');
      out.changes.push({ id: 'red', kind: 'volume', text: 'Erholung rot (' + rd.recovery + ' %): Volumen −30 %, keine Gewichtssteigerung' }); out.any = true; out.noUp = true;
    } else if (rd.color === 'yellow' && ok('yellow')) { out.changes.push({ id: 'yellow', kind: 'noup', text: 'Erholung gelb (' + rd.recovery + ' %): heute keine Gewichtssteigerung' }); out.any = true; out.noUp = true; }
    if (rd.sick) out.banner.push('Krank eingetragen – heute lieber Pause.');
    if ((rd.pain || []).some(p => !p.inj)) out.banner.push('Schmerz „' + rd.pain.filter(p => !p.inj).map(p => p.label).join(', ') + '“: nichts machen, was dort wehtut.');
    return out;
  }

  /* ================= Mesozyklus ================= */
  function todayISO(d) { d = d || new Date(); const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return z.toISOString().slice(0, 10); }
  /* Zyklus nach TRAINIERTEN Wochen: Woche = 1 + Zahl der Kalenderwochen seit meso.start (ohne die laufende),
     in denen mindestens ein Training war. Wochen ohne Training schieben den Deload also nicht vor. */
  let WK = null; // Zugriff auf die Trainingsliste (setzt die App)
  function setWorkouts(fn) { WK = fn; }
  function mesoWeek(plan, date) {
    if (!plan || !plan.meso) return 1;
    const len = plan.meso.len || 5;
    const ws = WK && WK();
    if (!ws) {
      const start = new Date(plan.meso.start + 'T00:00:00');
      const diff = Math.floor(((date || new Date()) - start) / (7 * 864e5));
      return ((diff % len) + len) % len + 1;
    }
    const s = todayISO(startOfWeek(new Date(plan.meso.start + 'T12:00:00'))), cur = todayISO(startOfWeek(date || new Date()));
    const weeks = new Set();
    for (const w of ws) if (w.date >= s && w.date < cur) weeks.add(todayISO(startOfWeek(new Date(w.date + 'T12:00:00'))));
    return weeks.size % len + 1;
  }
  // Nach ≥ 14 Tagen ohne Training beginnt der Zyklus neu (Einstiegswoche statt plötzlichem Deload)
  function mesoBreak(plan) {
    const ws = WK && WK(); if (!plan || !plan.meso || !ws || !ws.length) return false;
    const last = ws.reduce((m, w) => w.date > m ? w.date : m, '');
    const cur = todayISO(startOfWeek());
    if (!last || (Date.now() - new Date(last + 'T12:00:00').getTime()) / 864e5 < 14 || plan.meso.start >= cur) return false;
    plan.meso.start = cur; return true;
  }
  // Phase 0–3 (Einstieg, Aufbau, Aufbau, Peak) für beliebige Zykluslänge
  function phaseOf(w, len) { return Math.max(0, Math.min(3, Math.round((w - 1) / Math.max(1, len - 2) * 3))); }
  function weekInfo(plan, profile) {
    const autoDl = plan && plan.deloadUntil && todayISO() < plan.deloadUntil && (!plan.deloadFrom || todayISO() >= plan.deloadFrom);
    const len = (plan && plan.meso && plan.meso.len) || 5;
    const w = plan && (plan.forceDeload || autoDl) ? len : mesoWeek(plan);
    const deload = w === len;
    const phase = phaseOf(w, len);
    const label = deload ? 'Deload-Woche' : ['Einstieg', 'Aufbau', 'Aufbau', 'Peak'][phase];
    return { w, len, deload, label, phase, rirShift: 0 };
  }
  function adaptNow(profile) { const ad = profile && profile.adapt; if (!ad) return null; const t = todayISO(); return t >= ad.from && t < ad.until ? ad : null; }
  /* Reserve (RIR) pro Mesozyklus-Woche. Hypertrophie-Studien (z. B. Refalo 2023, Robinson 2024):
     0–2 Wdh. vor dem Versagen bauen am meisten Muskeln auf, mehr Reserve kostet Wachstum,
     echtes Versagen bei Grundübungen kostet viel Erholung. Darum Grundübungen 2→1, Isolation 1. */
  const RIR_PLAN = {
    mod: { main: [3, 2, 2, 2], sec: [2, 2, 2, 1], iso: [2, 2, 1, 1] },
    hard: { main: [2, 2, 1, 1], sec: [2, 1, 1, 1], iso: [1, 1, 1, 1] },
    very: { main: [2, 1, 1, 1], sec: [1, 1, 1, 0], iso: [1, 1, 0, 0] }
  };
  function targetRIR(role, kind, profile, wi) {
    if (wi.deload) return 3;
    const ad = adaptNow(profile);
    const i = (profile.answers || {}).intensity || 'hard';
    const tbl = RIR_PLAN[i] || RIR_PLAN.hard;
    const row = role === 'main' ? tbl.main : role === 'sec' ? tbl.sec : tbl.iso;
    let r = row[wi.phase ?? Math.min(row.length - 1, Math.max(0, wi.w - 1))] + (ad ? ad.rir || 0 : 0);
    const min = role === 'main' ? 1 : 0;
    if (kind === 'hold' || role === 'skill') r = Math.max(1, r);
    return Math.max(min, Math.min(3, r));
  }
  function prescription(slot, ex, profile, plan) {
    const wi = weekInfo(plan, profile);
    const role = slot ? slot.r : (ex.role === 'c' ? 'sec' : ex.role === 'i' ? 'iso' : ex.role === 's' ? 'skill' : ex.role === 'x' ? 'cond' : 'core');
    let sets = slot ? slot.sets : (role === 'iso' ? 3 : 3);
    const exp = (profile.answers || {}).exp;
    // Zusatzsatz für Grundübungen in den harten Wochen – nicht im Defizit (Ziel „Fett weg & Muskeln“)
    if (!wi.deload && (wi.phase ?? wi.w - 1) >= 2 && role === 'main' && exp !== 'new' && !isCut(profile, plan)) sets += 1;
    if (wi.deload) sets = Math.max(1, Math.round(sets * 0.6)); // 3.24: leichtere Woche = −40 % Volumen
    const ad = adaptNow(profile);
    if (ad && !wi.deload) { if (ad.sets < 0 && (role === 'sec' || role === 'iso' || role === 'core')) sets = Math.max(2, sets + ad.sets); if (ad.sets > 0 && (role === 'main' || role === 'sec')) sets += ad.sets; }
    let rr = ex.rr || [8, 12];
    if (ex.kind === 'load' && ex.role === 'c' && slot && slot.rr && !(ex.rr && ex.rr[0] > slot.rr[1])) rr = slot.rr;
    if (ex.kind === 'load' && ex.role === 'i' && slot && slot.rr) rr = [Math.max(slot.rr[0], ex.rr ? ex.rr[0] : 0), Math.max(slot.rr[1], ex.rr ? ex.rr[1] : 0)];
    if (slot && slot.custRR) rr = slot.custRR;
    const rest = slot ? slot.rest : defaultRest(role, baseGoal((profile && profile.answers || {}).goal));
    let rir = targetRIR(role, ex.kind, profile, wi);
    const lr = plan && plan.learn && plan.learn.rir; if (lr && !wi.deload) rir = Math.min(3, rir + lr); // gelernt: mehr Reserve, wenn die Erholung nicht reicht
    return { sets, rr, rir, rest, role, deload: wi.deload };
  }

  /* ================= Der Algorithmus hinter jedem Satz ================= */
  const EPL = (load, reps) => load * (1 + reps / 30);
  /* Widerstandsbänder zur Unterstützung: ungefähre Hilfe in kg (Loop-Bänder, je nach Marke unterschiedlich) */
  const BANDS = [
    { k: 'gelb', n: 'Gelb', kg: 7, c: '#F2D24B' }, { k: 'rot', n: 'Rot', kg: 11, c: '#E5484D' }, { k: 'schwarz', n: 'Schwarz', kg: 16, c: '#2A2A2E' },
    { k: 'lila', n: 'Lila', kg: 23, c: '#8E5BD9' }, { k: 'gruen', n: 'Grün', kg: 32, c: '#3DAA5C' }, { k: 'blau', n: 'Blau', kg: 45, c: '#3C7DE0' }
  ];
  const bandKg = k => { const b = BANDS.find(x => x.k === k); return b ? b.kg : 0; };
  // Übungen, bei denen ein Band zur Vereinfachung sinnvoll ist (Klimmzüge, Dips, Muscle-ups, Pistols, Nordics, Lever, Planche …)
  function canBand(ex) {
    if (!ex || ex.custom && !['vpull', 'dip', 'skill'].includes(ex.pat)) return false;
    if (['band-pullup', 'dead-hang', 'scap-pull', 'false-grip-hang', 'skin-cat', 'mu-transition'].includes(ex.id)) return false;
    if (!(ex.kind === 'bw' || ex.kind === 'hold')) return false;
    if (['vpull', 'dip'].includes(ex.pat)) return !['dip-support', 'ring-support', 'bench-dip'].includes(ex.id);
    if (ex.pat === 'skill') return ['mu', 'fl', 'bl', 'planche', 'hsskill'].includes(ex.skill) || /muscle|lever|planche|mu-/.test(ex.id);
    return ['pistol', 'box-pistol', 'shrimp-squat', 'nordic-neg', 'archer-pushup', 'pseudo-planche-pu', 'wall-hspu', 'wall-hspu-neg', 'ring-pistol', 'dragon-flag'].includes(ex.id);
  }
  // Haltezeit mit Band zählt weniger: Faktor je nach Hilfe im Verhältnis zum Körpergewicht
  const holdBandF = (k, bw) => Math.max(0.35, 1 - bandKg(k) / (bw || 80) * 1.2);
  function effLoad(ex, set, bw) {
    if (ex.kind !== 'bw') return +set.w || 0;
    const base = bw * (ex.bwf || 0);
    return Math.max(base * 0.2, base - bandKg(set.band)) + (+set.w || 0);
  }
  function setScore(ex, set, bw) {
    if (!set || set.done === false) return null; // gespeicherte Sätze haben kein done-Feld
    if (ex.kind === 'hold') return ((+set.sec || 0) + 3 * (+set.rir || 0)) * (set.band ? holdBandF(set.band, bw) : 1);
    if (ex.kind === 'int') return null;
    if (ex.kind === 'bw' && !(ex.bwf > 0)) return (+set.reps || 0) + (+set.rir || 0);
    const L = effLoad(ex, set, bw); if (!(L > 0)) return null;
    return EPL(L, (+set.reps || 0) + Math.min(+set.rir || 0, 6));
  }
  function estimate1RM(ex, profile) {
    const a = profile.answers || {}; const bw = bodyweight(profile);
    const sexF = a.sex === 'w' ? 0.62 : 1;
    const lower = ex.prim.some(m => ['quads', 'hams', 'glutes', 'calves'].includes(m));
    return (ex.std || 0.3) * bw * (EXP_F[a.exp] || 0.8) * (a.sex === 'w' && lower ? 0.78 : sexF);
  }
  function sessionBest(ex, entry, bw) {
    let best = 0; for (const s of entry.sets || []) { const v = setScore(ex, s, entry.bw || bw); if (v > best) best = v; } return best;
  }
  /* 3.27 (Nutzerwunsch 24.11.): Wie schnell steigerst du dich bei dieser Übung? Aus dem Verlauf:
     rate = Zuwachs der besten Satzleistung in %/Woche, ok/fail = Gewichtssteigerungen, nach denen du im Wdh.-Bereich geblieben bist bzw.
     darunter gefallen/zurückgegangen bist, toTop = Einheiten bis alle Sätze wieder oben. speed: 'fast' | 'normal' | 'slow' (zu wenig Verlauf = normal). */
  function progProfile(ex, hist, rr, bw) {
    const H = hist.filter(h => (h.entry.sets || []).some(s => s.done !== false && (+s.reps || 0) > 0));
    const out = { speed: 'normal', rate: null, ok: 0, fail: 0, toTop: null, n: H.length };
    if (H.length < 3 || !ex) return out;
    const best = H.map(h => sessionBest(ex, h.entry, h.bw || bw));
    const days = (new Date(H[H.length - 1].date) - new Date(H[0].date)) / 864e5;
    if (days >= 10 && best[0] > 0) { const a = (best[0] + best[1]) / 2, b = (best[best.length - 1] + best[best.length - 2]) / 2; out.rate = Math.round(((b / a) - 1) / (days / 7) * 1000) / 10; }
    const [lo, hi] = rr || ex.rr || [8, 12]; const w0 = h => +((h.entry.sets || []).find(s => s.done !== false) || {}).w || 0;
    const top = h => { const s = (h.entry.sets || []).filter(x => x.done !== false); return s.length && s.every(x => (+x.reps || 0) >= hi); };
    const tops = [];
    for (let i = 1; i < H.length; i++) {
      if (ex.kind !== 'load' && !(ex.kind === 'bw' && ex.bwf > 0)) break;
      if (!(w0(H[i]) > w0(H[i - 1]) + 1e-9)) continue;
      const first = +((H[i].entry.sets || []).find(s => s.done !== false) || {}).reps || 0;
      const back = H[i + 1] && w0(H[i + 1]) < w0(H[i]) - 1e-9;
      if (first >= lo && !back) out.ok++; else out.fail++;
      for (let k = i + 1; k < H.length && w0(H[k]) === w0(H[i]); k++) if (top(H[k])) { tops.push(k - i); break; }
    }
    if (tops.length) out.toTop = Math.round(tops.reduce((a, b) => a + b, 0) / tops.length * 10) / 10;
    const tries = out.ok + out.fail;
    if (tries >= 2) {
      const succ = out.ok / tries;
      if (succ >= 0.8 && ((out.toTop != null && out.toTop <= 2) || (out.rate != null && out.rate >= 1.5))) out.speed = 'fast';
      else if (succ < 0.5 || (out.rate != null && out.rate <= 0.3 && H.length >= 4)) out.speed = 'slow';
    } else if (out.rate != null && H.length >= 4) {
      if (out.rate >= 2.5) out.speed = 'fast'; else if (out.rate <= 0) out.speed = 'slow';
    }
    return out;
  }
  function historyFor(exId, workouts) {
    const out = [];
    for (const w of workouts) for (const e of (w.exercises || [])) if (e.exId === exId && (e.sets || []).some(s => s.done !== false)) out.push({ date: w.date, bw: w.bw, entry: e, loc: w.loc });
    out.sort((a, b) => a.date < b.date ? -1 : 1);
    return out;
  }
  function snap(value, opts, prefer) {
    if (!opts || !opts.length) return Math.max(0, Math.round(value * 2) / 2);
    let best = opts[0], bd = Infinity;
    for (const o of opts) { const d = Math.abs(o - value) + (o > value ? (prefer === 'up' ? 0 : 0.001) : 0); if (d < bd) { bd = d; best = o; } }
    return best;
  }

  /* Hauptfunktion: nächste Satzempfehlung.
     doneSets = bereits abgeschlossene Sätze dieser Übung heute. */
  // 3.23: Tagesanpassung aus Formwerk – presc.loadF (z. B. 0,9 bei Muskelkater mittel), presc.noUp (Erholung gelb/rot: keine Steigerung)
  function recommend(ex, presc, doneSets, hist, ctx) {
    const out = recommendCore(ex, presc, doneSets, hist, ctx);
    if (doneSets.some(s => s.done) || !(out.w > 0) || ex.kind !== 'load') return out;
    const opts = loadOptions(ex, ctx.loc, ctx.profile);
    const floorTo = v => { if (!opts || !opts.length) return Math.max(0, Math.floor(v * 2) / 2); const lo = opts.filter(o => o <= v + 1e-9); return lo.length ? lo[lo.length - 1] : opts[0]; };
    if (presc.noUp) {
      const lastH = hist.length ? hist[hist.length - 1] : null;
      const lastW = lastH ? Math.max(0, ...(lastH.entry.sets || []).filter(s => s.done !== false).map(s => +s.w || 0)) : 0;
      if (lastW > 0 && out.w > lastW) { out.w = floorTo(lastW); out.reps = presc.rr[1]; out.notes = out.notes.filter(n => !/Gewicht, Wdh\.|Progression/.test(n)); out.notes.push('Heute keine Gewichtssteigerung: Erholung ' + (presc.noUp === 'red' ? 'rot' : 'gelb')); }
    }
    if (presc.loadF && presc.loadF < 1) { const w = floorTo(out.w * presc.loadF); if (w < out.w) { out.w = w; out.notes.push('Gewicht −' + Math.round((1 - presc.loadF) * 100) + ' %: Muskelkater'); } }
    return out;
  }
  function recommendCore(ex, presc, doneSets, hist, ctx) {
    const { profile, loc } = ctx; const bw = bodyweight(profile);
    const [lo, hi] = presc.rr; const rirT = presc.rir;
    const done = doneSets.filter(s => s.done);
    const notes = []; let calib = false;
    const f = ex.kind === 'hold' ? 0.06 : ex.role === 'c' ? 0.03 : 0.025;
    const prevSessions = hist.slice(-3);
    let base = null;
    if (prevSessions.length) {
      const bests = prevSessions.map(h => sessionBest(ex, h.entry, bw)).filter(x => x > 0);
      if (bests.length) {
        const last = bests[bests.length - 1];
        const avg = bests.reduce((a, b) => a + b, 0) / bests.length;
        base = Math.max(last, avg * 0.97);
        const lastH = prevSessions[prevSessions.length - 1];
        const lastSets = (lastH.entry.sets || []).filter(s => s.done !== false);
        const lastRIRT = lastH.entry.rirT ?? rirT;
        const hitAll = lastSets.length && lastSets.every(s => (ex.kind === 'hold' ? true : (+s.reps || 0) >= lo) && (+s.rir || 0) <= lastRIRT + 1);
        const days = (Date.now() - new Date(lastH.date).getTime()) / 864e5;
        if (days > 45) { base *= 0.87; notes.push('Längere Pause: Start etwas leichter'); }
        else if (days > 21) { base *= 0.94; notes.push('Seit ' + Math.round(days) + ' Tagen nicht gemacht: leicht reduziert'); }
        else if (hitAll && !presc.deload) {
          const inc = ex.kind === 'hold' ? 0.04 : ((profile.answers || {}).exp === 'new' ? 0.03 : ex.role === 'c' ? 0.02 : 0.015);
          base *= 1 + inc; notes.push('Letztes Mal alle Ziele geschafft: +' + Math.round(inc * 100) + ' % Progression');
        }
      }
    }
    if (base == null) {
      calib = true;
      if (ex.kind === 'load') base = estimate1RM(ex, profile) * 0.9;
      else if (ex.kind === 'bw' && ex.bwf > 0) {
        const tc = testCapacity(ex, profile);
        base = tc || EPL(bw * ex.bwf, (lo + hi) / 2 + 2);
        if (tc) calib = false;
      } else if (ex.kind === 'bw') base = hi + 2;
      else if (ex.kind === 'hold') base = (lo + hi) / 2 + 3 * rirT;
    }
    let C = base, dayForm = null, stop = false;
    let setsRec = presc.sets;
    if (done.length) {
      const scores = done.map(s => setScore(ex, s, bw)).filter(x => x > 0);
      if (scores.length) {
        const last = scores[scores.length - 1], best = Math.max(...scores);
        C = 0.7 * last * (1 - f) + 0.3 * best * (1 - f * scores.length);
        if (!calib && base) {
          dayForm = scores[0] / base - 1;
          if (dayForm <= -0.08 && presc.sets > 2) { setsRec = presc.sets - 1; notes.push(`Tagesform ${pct(dayForm)}: 1 Satz weniger schont die Erholung`); }
          else if (dayForm >= 0.04) notes.push(`Starke Tagesform (${pct(dayForm)})`);
        }
        const drop = 1 - last / best;
        if (scores.length >= 2 && drop >= 0.15) { stop = true; setsRec = done.length; notes.push(`Leistung ${pct(-drop)} gegenüber deinem besten Satz: Übung hier beenden`); }
        if (!stop && done.length >= setsRec && !presc.deload) {
          const avgRir = done.reduce((t, s) => t + (+s.rir || 0), 0) / done.length;
          if (avgRir >= rirT + 2 && drop < 0.06 && done.length < presc.sets + 1) { setsRec = done.length + 1; notes.push('Noch viel Reserve: 1 Zusatzsatz lohnt sich'); }
        }
      }
    }
    const out = { calib, notes, setsRec, stop, dayForm, capacity: C, rir: rirT };
    if (ex.kind === 'int') { out.sec = presc.rr[0]; return out; }
    if (ex.kind === 'hold') {
      out.sec = Math.max(5, Math.round(C * (1 - (done.length ? 0 : 0)) - 3 * rirT));
      if (ctx.band) out.sec = Math.max(5, Math.round((C / holdBandF(ctx.band, bw)) - 3 * rirT));
      if (out.sec > hi * 1.6) out.harder = chainStep(ex, 1, profile, loc);
      if (out.sec < lo * 0.5) out.easier = chainStep(ex, -1, profile, loc);
      return out;
    }
    const t = Math.round(lo + 0.6 * (hi - lo));
    if (ex.kind === 'bw' && !(ex.bwf > 0)) {
      out.reps = Math.max(1, Math.round(C - rirT)); out.w = 0; return out;
    }
    const baseLoad = ex.kind === 'bw' ? Math.max(bw * ex.bwf * 0.2, bw * ex.bwf - bandKg(ctx.band)) : 0;
    let opts = ctx.band && ex.kind === 'bw' ? null : loadOptions(ex, loc, profile);
    const capReps = L => 30 * (C / L - 1) - rirT;
    if (ex.kind === 'bw' && (!opts || opts.length <= 1)) {
      const r = capReps(baseLoad);
      out.w = 0; out.reps = clampReps(r, hi);
      if (r > hi + 2 && ctx.band) notes.push('Band hilft zu viel: nimm ein leichteres Band oder trainiere ohne');
      else if (r > hi + 2) { out.harder = chainStep(ex, 1, profile, loc); notes.push('Zu leicht: ' + (out.harder ? 'nächste Stufe probieren' : 'langsamer (3 s ablassen) oder Pause am tiefsten Punkt')); }
      if (r < lo - 1) { out.easier = chainStep(ex, -1, profile, loc); if (out.easier) notes.push('Unter dem Zielbereich: leichtere Stufe wäre sinnvoll'); }
      return out;
    }
    /* Doppelte Progression (Gewichte mit fester Auswahl): erst Wdh. bis zur Obergrenze steigern, dann das
       nächste Gewicht und wieder unten anfangen. Gilt nur mit frischem Verlauf, nicht im Deload, nicht mit Band. */
    const lastH = hist.length ? hist[hist.length - 1] : null;
    const lastDays = lastH ? (Date.now() - new Date(lastH.date).getTime()) / 864e5 : 999;
    const lastSets = lastH ? (lastH.entry.sets || []).filter(s => s.done !== false && (+s.reps || 0) > 0) : [];
    if (opts && opts.length > 1 && lastSets.length && lastDays <= 21 && !presc.deload && !ctx.band && !calib) {
      const lastRIRT = lastH.entry.rirT ?? rirT;
      const anchor = snap(+lastSets[0].w || 0, opts);
      const ai = opts.indexOf(anchor);
      const capR = w => 30 * (C / (baseLoad + w) - 1) - rirT;
      const fit = r => Math.max(lo, Math.min(hi, Math.round(r)));
      const keepNotes = notes.filter(n => !/Progression$/.test(n)); notes.length = 0; notes.push(...keepNotes);
      if (!done.length) {
        const r0 = +lastSets[0].reps || 0;
        const allTop = lastSets.every(s => (+s.reps || 0) >= hi && (+s.rir || 0) <= lastRIRT + 1);
        // 3.27: gelerntes Steigerungstempo – schnell: größerer Sprung / +2 Wdh., langsam: erst 2× oben, dann kleinste Stufe
        const pg = progProfile(ex, hist, presc.rr, bodyweight(profile)); out.prog = pg;
        const prevH = hist.length > 1 ? hist[hist.length - 2] : null;
        const prevTop = prevH && snap(+((prevH.entry.sets || []).find(s => s.done !== false) || {}).w || 0, opts) === anchor && (prevH.entry.sets || []).filter(s => s.done !== false).every(s => (+s.reps || 0) >= hi);
        let w = anchor, reps;
        if (allTop && pg.speed === 'slow' && !prevTop) { reps = hi; notes.push('Hier steigerst du dich langsamer: Obergrenze noch einmal schaffen, dann mehr Gewicht'); }
        else if (allTop) {
          // 3.24: Langhantel +2,5 kg (Oberkörper) / +5 kg (Unterkörper), Kurzhantel/Maschine/Kabel kleinste Stufe; Wdh. zurück ans untere Ende
          const step = progStep(ex); let up = opts.find(o => o > anchor + 1e-9 && o >= anchor + step - 1e-9);
          if (up != null && pg.speed === 'fast') { const up2 = step ? opts.find(o => o >= anchor + 2 * step - 1e-9) : opts[opts.indexOf(up) + 1]; if (up2 != null && (up2 - anchor) / Math.max(anchor, 1) <= 0.1) up = up2; }
          if (up != null && (baseLoad + up) > 0) { w = up; reps = lo; out.up = { from: anchor, to: up, reps0: hi }; notes.push((pg.speed === 'fast' ? 'Hier steigerst du dich schnell: +' : 'Alle Sätze oben geschafft: +') + String(Math.round((up - anchor) * 10) / 10).replace('.', ',') + ' kg, Wdh. zurück auf ' + lo); }
          else { reps = hi; notes.push('Schwerstes Gewicht: langsamer ablassen (3 s) macht es härter'); }
        } else if (r0 < lo - 1) {
          const dn = ai > 0 ? opts[ai - 1] : anchor; w = dn; reps = fit(capR(dn));
          notes.push(dn < anchor ? 'Letztes Mal unter dem Zielbereich: etwas leichter' : 'Leichtestes Gewicht: so viele Wdh. wie sauber möglich');
        } else {
          const easier = (+lastSets[0].rir || 0) >= lastRIRT; const plus = easier ? (pg.speed === 'fast' ? 2 : 1) : 0;
          reps = fit(r0 + plus);
          notes.push(!easier ? 'Gleiches Gewicht und gleiche Wdh. – letztes Mal war es härter als geplant' : plus === 2 ? 'Gleiches Gewicht, 2 Wdh. mehr – hier steigerst du dich schnell' : 'Gleiches Gewicht, 1 Wdh. mehr als letztes Mal');
        }
        out.w = w; out.reps = reps; out.dp = true;
        if (ex.kind === 'load' && presc.role === 'main' && w >= 20) out.warmup = warmups(w, opts);
        return out;
      }
      if (dayForm == null || Math.abs(dayForm) < 0.08) {
        const w = +done[0].w || 0; const first = +done[0].reps || hi;
        out.w = w; out.reps = Math.max(1, Math.min(first, clampReps(capR(w), hi))); out.dp = true;
        return out;
      }
    }
    const ideal = C / (1 + (t + rirT) / 30) - baseLoad;
    if (!opts) opts = rangeList(ex.kind === 'bw' ? 0 : 0.5, Math.max(10, ideal * 2), ideal > 20 ? 2.5 : ideal > 6 ? 1 : 0.5);
    let bestO = null, bestD = Infinity;
    for (const o of opts) {
      const L = baseLoad + o; if (!(L > 0)) continue;
      const r = capReps(L);
      let d;
      if (r >= lo && r <= hi) d = Math.abs(r - t); else d = 10 + (r < lo ? (lo - r) * 1.3 : (r - hi));
      if (d < bestD - 0.25 || (Math.abs(d - bestD) <= 0.1 && o > (bestO ?? -1))) { bestD = d; bestO = o; }
    }
    if (bestO == null) bestO = snap(ideal, opts);
    const r = capReps(baseLoad + bestO);
    out.w = bestO; out.reps = clampReps(r, hi);
    if (ex.kind === 'bw' && bestO === 0 && r < hi + 1.5) {
      if (r < lo - 1) { out.easier = chainStep(ex, -1, profile, loc); if (out.easier) notes.push('Unter dem Zielbereich: leichtere Stufe wäre sinnvoll'); }
      if (calib && !done.length) notes.unshift('Geschätzt aus deinem Fragebogen: der erste Satz kalibriert alles Weitere');
      return out;
    }
    if (r > hi + 1.5) {
      if (ex.kind === 'bw') out.harder = chainStep(ex, 1, profile, loc);
      notes.push(opts[opts.length - 1] <= bestO ? 'Schwerstes verfügbares Gewicht: Wdh. über dem Zielbereich sind okay, langsameres Tempo macht es härter' : 'Mehr Wdh. als geplant');
    }
    if (r < lo - 0.5) notes.push(opts[0] >= bestO ? 'Leichtestes Gewicht: so viele Wdh. wie sauber möglich' : 'Wdh. unter dem Zielbereich');
    if (!done.length && ex.kind === 'load' && presc.role === 'main' && bestO >= 20) out.warmup = warmups(bestO, opts);
    if (calib && !done.length) notes.unshift('Erste Einheit mit dieser Übung: Gewicht ist geschätzt, dein erster Satz kalibriert alles Weitere');
    return out;
  }
  const LOWER_M = ['quads', 'hams', 'glutes'];
  function progStep(ex) { return ex.eq && ex.eq.includes('bb') ? (ex.prim.some(m => LOWER_M.includes(m)) ? 5 : 2.5) : 0; }
  // 3.24: Stillstand = in den letzten 3 Einheiten kein neuer Bestwert (mind. 4 Einheiten Verlauf, beste Satz-Leistung)
  function stalled(ex, hist, bw) {
    if (!ex || ex.kind === 'hold' || ex.kind === 'int' || hist.length < 4) return false;
    const b = hist.map(h => sessionBest(ex, h.entry, h.bw || bw)); const last3 = b.slice(-3), before = b.slice(0, -3);
    return Math.max(...last3) <= Math.max(...before) * 1.005;
  }
  function clampReps(r, hi) { return Math.max(1, Math.min(Math.floor(r + 0.35), hi + 6)); }
  function pct(x) { return (x > 0 ? '+' : '−') + Math.abs(Math.round(x * 100)) + ' %'; }
  function warmups(w, opts) {
    const out = []; const seen = new Set([w]);
    for (const [p, r] of [[0.45, 8], [0.65, 4], [0.82, 2]]) {
      const v = snap(w * p, opts); if (!seen.has(v) && v > 0) { seen.add(v); out.push({ w: v, reps: r }); }
    }
    return out;
  }
  function chainStep(ex, dir, profile, loc) {
    if (!ex.grp) return null;
    const eqSet = locEquip(profile, loc);
    const members = allExercises(profile).filter(e => e.grp === ex.grp && e.pat === ex.pat && available(e, eqSet) && e.id !== ex.id);
    const cand = members.filter(e => dir > 0 ? e.rank > ex.rank : e.rank < ex.rank).sort((a, b) => dir > 0 ? a.rank - b.rank : b.rank - a.rank);
    return cand[0] ? cand[0].id : null;
  }

  /* ================= Statistik ================= */
  function weeklyMuscleSets(workouts, since) {
    const res = {}; for (const m in DB.MUSCLES) res[m] = 0;
    for (const w of workouts) {
      if (w.date < since) continue;
      for (const e of w.exercises || []) {
        const ex = EX[e.exId] || e.custom; if (!ex) continue;
        const n = (e.sets || []).filter(s => s.done !== false).length; if (!n) continue;
        for (const m of ex.prim) res[m] += n;
        for (const m of ex.sec || []) res[m] += n * 0.5;
      }
    }
    return res;
  }
  function startOfWeek(d) { d = new Date(d || Date.now()); const day = (d.getDay() + 6) % 7; d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - day); return d; }

  /* Übungsauswahl eines bestehenden Plans neu bewerten (z. B. nach Favoriten-Änderung).
     Aufbau, Sätze und von Hand gewählte Übungen bleiben. Liefert die Änderungen. */
  function refreshSelection(plan, profile) {
    const ab = abilities(profile.answers || {}); const changes = [];
    for (const loc of plan.locs || ['home']) {
      const before = plan.days.map(d => d.slots.map(sl => sl.ex && sl.ex[loc]));
      const used = new Set();
      plan.days.forEach((d, di) => {
        for (const sl of d.slots) if (!(sl.locked && sl.locked[loc]) && sl.ex) delete sl.ex[loc];
        fillDay(d, loc, profile, ab, used, di);
      });
      plan.days.forEach((d, di) => d.slots.forEach((sl, si) => { const old = (before[di] || [])[si]; if (sl.ex[loc] && old !== sl.ex[loc]) changes.push({ day: d.name, loc, from: old, to: sl.ex[loc] }); }));
    }
    return changes;
  }

  /* ================= Wochen-Check-in ================= */
  const CHECKIN = [
    { id: 'exh', q: 'Wie erschöpft fühlst du dich?', o: [[1, 'Frisch'], [2, 'Gut'], [3, 'Normal'], [4, 'Müde'], [5, 'Platt']] },
    { id: 'sore', q: 'Wie viel Muskelkater hattest du?', o: [[1, 'Keinen'], [2, 'Leicht'], [3, 'Mittel'], [4, 'Stark'], [5, 'Sehr stark']] },
    { id: 'fit', q: 'Wie fit und leistungsfähig fühlst du dich?', o: [[5, 'Top'], [4, 'Gut'], [3, 'Okay'], [2, 'Schlapp'], [1, 'Kaputt']] },
    { id: 'sleep', q: 'Wie hast du geschlafen?', o: [[3, 'Gut'], [2, 'Okay'], [1, 'Schlecht']] },
    { id: 'pain', q: 'Gelenk- oder Sehnenschmerzen?', o: [[0, 'Keine'], [1, 'Leicht'], [2, 'Deutlich']] },
    { id: 'sport', q: 'Wie viel anderer Sport (z. B. Baseball)?', o: [[0, 'Keiner'], [1, 'Wenig'], [2, 'Normal'], [3, 'Viel']] },
    { id: 'diff', q: 'Wie haben sich die Trainings angefühlt?', o: [[-1, 'Zu leicht'], [0, 'Passend'], [1, 'Zu hart']] }
  ];
  function applyCheckin(profile, plan, ans, weekStartIso) {
    const n = k => +(ans[k] ?? 0);
    const score = (n('exh') - 3) + (n('sore') - 3) * 0.8 + (3 - n('fit')) + (2 - n('sleep')) * 0.8 + n('pain') * 1.5 + Math.max(0, n('sport') - 1) * 0.7 + n('diff') * 1.5;
    const from = weekStartIso; const until = todayISO(new Date(new Date(weekStartIso + 'T12:00:00').getTime() + 7 * 864e5));
    let res;
    if (n('pain') >= 2 || score >= 5) { plan.deloadUntil = until; res = { kind: 'deload', text: 'Diese Woche Deload: halbe Sätze und mehr Reserve, damit du dich richtig erholst.' + (n('pain') >= 2 ? ' Bei anhaltenden Schmerzen bitte ärztlich abklären lassen.' : '') }; profile.adapt = null; }
    else if (score >= 2.5) { profile.adapt = { from, until, sets: -1, rir: 1 }; res = { kind: 'less', text: 'Etwas weniger Volumen: 1 Satz weniger bei Ergänzung, Isolation und Rumpf, dazu 1 Wiederholung mehr Reserve.' }; }
    else if (score <= (isCut(profile, plan) ? -3.5 : -2.5)) { profile.adapt = { from, until, sets: 1, rir: 0 }; res = { kind: 'more', text: 'Du steckst das gut weg: 1 Satz mehr bei Grund- und Ergänzungsübungen.' }; }
    else { profile.adapt = null; res = { kind: 'same', text: 'Alles im grünen Bereich: Der Plan läuft wie vorgesehen weiter.' }; }
    profile.checkins = profile.checkins || [];
    profile.checkins = profile.checkins.filter(c => c.week !== weekStartIso).concat([{ week: weekStartIso, ans, score: Math.round(score * 10) / 10, result: res.kind }]).slice(-52);
    return Object.assign(res, { score });
  }

  window.ENGINE = {
    Q, BANDS, canBand, bandKg, abilities, buildPlan, fillDay, alternatives, timePlan, balancePlan, planVolume, prescription, recommend, historyFor, sessionBest, setScore,
    loadOptions, locEquip, available, readyDay, adjustDay, stalled, progStep, progProfile, learnVolume, volTargets, bodyweight, weekInfo, mesoWeek, todayISO, weeklyMuscleSets, startOfWeek,
    estimate1RM, allExercises, effLoad, refreshSelection, defaultRest, goalRanges, isCut, setWorkouts, mesoBreak, phaseOf, applyCheckin, CHECKIN, PLAN_VERSION, TEMPLATES, SPLIT_NAMES, chainStep, snap, EXP_LVL
  };
})();
