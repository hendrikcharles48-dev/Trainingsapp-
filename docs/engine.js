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
    { id: 'goal', title: 'Was ist dein Hauptziel?', type: 'single', options: [['muscle', 'Muskelaufbau', 'Mehr Muskelmasse, sichtbare Form'], ['strength', 'Maximalkraft', 'Schwerere Gewichte, weniger Wiederholungen'], ['skills', 'Calisthenics-Skills', 'Muscle-up, Front Lever, Handstand …'], ['fit', 'Fitness & Fettabbau', 'Kraft plus Kondition'], ['health', 'Gesund & beweglich', 'Solide Basis, schonend']] },
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

  function goalRanges(goal) {
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
    const goal = a.goal || 'muscle';
    if (ex.kind === 'load' && (goal === 'muscle' || goal === 'strength')) s += 1;
    if (ex.kind !== 'load' && goal === 'skills') s += 3;
    if (loc === 'gym' && (goal === 'muscle' || goal === 'strength') && ex.eq.some(e => ['bb', 'mach', 'gcable'].includes(e))) s += 2;
    if (goal === 'strength' && r === 'main' && ex.eq.includes('bb')) s += 3;
    if (loc === 'home' && ex.eq.includes('cable')) { s += 0.8; reasons.push('Nutzt deinen Seilzug'); }
    if (loc === 'home' && ex.eq.includes('rings')) { s += 0.8; reasons.push('Nutzt deine Ringe'); }
    // Progressionskette: passende Stufe zu deinem Können
    if (ex.grp && ab[ex.grp] != null) {
      const d = ex.rank - ab[ex.grp];
      if (d > 0.05) { if (!fav) { s -= d * 4; if (d > 0.6) bad = true; } }
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
      if (ex.lvl > lvl + 1 && !fav) { s -= (ex.lvl - lvl - 1) * 2.5; bad = true; }
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
  function allExercises(profile) { return DB.list.concat((profile && profile.custom) || []); }

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
        sl.rest = role === 'main' ? restMain : role === 'sec' ? 120 : role === 'skill' ? 120 : role === 'cond' ? 20 : role === 'core' ? 60 : 75;
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
      if (dur <= 45) for (const sl of slots) sl.rest = Math.max(sl.r === 'main' ? 90 : 45, Math.round(sl.rest * 0.75 / 15) * 15);
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
    return plan;
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

  /* ================= Mesozyklus ================= */
  function todayISO(d) { d = d || new Date(); const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return z.toISOString().slice(0, 10); }
  function mesoWeek(plan, date) {
    if (!plan || !plan.meso) return 1;
    const start = new Date(plan.meso.start + 'T00:00:00');
    const diff = Math.floor(((date || new Date()) - start) / (7 * 864e5));
    const len = plan.meso.len || 5;
    return ((diff % len) + len) % len + 1;
  }
  function weekInfo(plan, profile) {
    const autoDl = plan && plan.deloadUntil && todayISO() < plan.deloadUntil;
    const w = plan && (plan.forceDeload || autoDl) ? (plan.meso.len || 5) : mesoWeek(plan);
    const len = (plan && plan.meso && plan.meso.len) || 5;
    const deload = w === len;
    const label = deload ? 'Deload-Woche' : ['Einstieg', 'Aufbau', 'Aufbau', 'Peak'][w - 1] || 'Aufbau';
    return { w, len, deload, label, rirShift: deload ? 0 : [1, 0, 0, -1][w - 1] ?? 0 };
  }
  function adaptNow(profile) { const ad = profile && profile.adapt; if (!ad) return null; const t = todayISO(); return t >= ad.from && t < ad.until ? ad : null; }
  function targetRIR(role, kind, profile, wi) {
    if (wi.deload) return 4;
    const ad = adaptNow(profile);
    const i = (profile.answers || {}).intensity || 'hard';
    const base = role === 'main' ? { mod: 3, hard: 2, very: 2 }[i] : role === 'sec' ? { mod: 2, hard: 2, very: 1 }[i] : { mod: 2, hard: 1, very: 0 }[i];
    let r = base + wi.rirShift + (ad ? ad.rir || 0 : 0);
    const min = role === 'main' ? 1 : 0;
    if (kind === 'hold' || role === 'skill') r = Math.max(1, r);
    return Math.max(min, Math.min(4, r));
  }
  function prescription(slot, ex, profile, plan) {
    const wi = weekInfo(plan, profile);
    const role = slot ? slot.r : (ex.role === 'c' ? 'sec' : ex.role === 'i' ? 'iso' : ex.role === 's' ? 'skill' : ex.role === 'x' ? 'cond' : 'core');
    let sets = slot ? slot.sets : (role === 'iso' ? 3 : 3);
    const exp = (profile.answers || {}).exp;
    if (!wi.deload && (wi.w === 3 || wi.w === 4) && role === 'main' && exp !== 'new') sets += 1;
    if (wi.deload) sets = Math.max(1, Math.ceil(sets / 2));
    const ad = adaptNow(profile);
    if (ad && !wi.deload) { if (ad.sets < 0 && (role === 'sec' || role === 'iso' || role === 'core')) sets = Math.max(2, sets + ad.sets); if (ad.sets > 0 && (role === 'main' || role === 'sec')) sets += ad.sets; }
    let rr = ex.rr || [8, 12];
    if (ex.kind === 'load' && ex.role === 'c' && slot && slot.rr && !(ex.rr && ex.rr[0] > slot.rr[1])) rr = slot.rr;
    if (ex.kind === 'load' && ex.role === 'i' && slot && slot.rr) rr = [Math.max(slot.rr[0], ex.rr ? ex.rr[0] : 0), Math.max(slot.rr[1], ex.rr ? ex.rr[1] : 0)];
    if (slot && slot.custRR) rr = slot.custRR;
    const rest = slot ? slot.rest : (role === 'iso' ? 75 : 120);
    return { sets, rr, rir: targetRIR(role, ex.kind, profile, wi), rest, role, deload: wi.deload };
  }

  /* ================= Der Algorithmus hinter jedem Satz ================= */
  const EPL = (load, reps) => load * (1 + reps / 30);
  function effLoad(ex, set, bw) { return ex.kind === 'bw' ? bw * (ex.bwf || 0) + (+set.w || 0) : (+set.w || 0); }
  function setScore(ex, set, bw) {
    if (!set || !set.done) return null;
    if (ex.kind === 'hold') return (+set.sec || 0) + 3 * (+set.rir || 0);
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
  function historyFor(exId, workouts) {
    const out = [];
    for (const w of workouts) for (const e of (w.exercises || [])) if (e.exId === exId && (e.sets || []).some(s => s.done)) out.push({ date: w.date, bw: w.bw, entry: e, loc: w.loc });
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
  function recommend(ex, presc, doneSets, hist, ctx) {
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
        const lastSets = (lastH.entry.sets || []).filter(s => s.done);
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
      if (out.sec > hi * 1.6) out.harder = chainStep(ex, 1, profile, loc);
      if (out.sec < lo * 0.5) out.easier = chainStep(ex, -1, profile, loc);
      return out;
    }
    const t = Math.round(lo + 0.6 * (hi - lo));
    if (ex.kind === 'bw' && !(ex.bwf > 0)) {
      out.reps = Math.max(1, Math.round(C - rirT)); out.w = 0; return out;
    }
    const baseLoad = ex.kind === 'bw' ? bw * ex.bwf : 0;
    let opts = loadOptions(ex, loc, profile);
    const capReps = L => 30 * (C / L - 1) - rirT;
    if (ex.kind === 'bw' && (!opts || opts.length <= 1)) {
      const r = capReps(baseLoad);
      out.w = 0; out.reps = clampReps(r, hi);
      if (r > hi + 2) { out.harder = chainStep(ex, 1, profile, loc); notes.push('Zu leicht: ' + (out.harder ? 'nächste Stufe probieren' : 'langsamer (3 s ablassen) oder Pause am tiefsten Punkt')); }
      if (r < lo - 1) { out.easier = chainStep(ex, -1, profile, loc); if (out.easier) notes.push('Unter dem Zielbereich: leichtere Stufe wäre sinnvoll'); }
      return out;
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
        const n = (e.sets || []).filter(s => s.done).length; if (!n) continue;
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
    else if (score <= -2.5) { profile.adapt = { from, until, sets: 1, rir: 0 }; res = { kind: 'more', text: 'Du steckst das gut weg: 1 Satz mehr bei Grund- und Ergänzungsübungen.' }; }
    else { profile.adapt = null; res = { kind: 'same', text: 'Alles im grünen Bereich: Der Plan läuft wie vorgesehen weiter.' }; }
    profile.checkins = profile.checkins || [];
    profile.checkins = profile.checkins.filter(c => c.week !== weekStartIso).concat([{ week: weekStartIso, ans, score: Math.round(score * 10) / 10, result: res.kind }]).slice(-52);
    return Object.assign(res, { score });
  }

  window.ENGINE = {
    Q, abilities, buildPlan, fillDay, alternatives, prescription, recommend, historyFor, sessionBest, setScore,
    loadOptions, locEquip, available, bodyweight, weekInfo, mesoWeek, todayISO, weeklyMuscleSets, startOfWeek,
    estimate1RM, allExercises, effLoad, refreshSelection, applyCheckin, CHECKIN, PLAN_VERSION, TEMPLATES, SPLIT_NAMES, chainStep, snap, EXP_LVL
  };
})();
