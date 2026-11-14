// Formwerk-Modell: Erholung, Belastung, Muskel-Ermüdung, Empfehlung.
// Reine Funktionen ohne Netz/Speicher – getestet in test/model.test.js.
// Alles relativ zur EIGENEN Basis (gleitender Durchschnitt), nie zu Normwerten. Trainingshilfe, keine Medizin.

export const MODEL_VERSION = 1;

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
const sd = a => { if (a.length < 2) return 0; const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1)); };
const round = (x, d = 0) => (x == null || isNaN(x) ? null : Math.round(x * 10 ** d) / 10 ** d);
export function addDays(iso, k) { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + k); return d.toISOString().slice(0, 10); }
export function weekday(iso) { return (new Date(iso + 'T12:00:00Z').getUTCDay() + 6) % 7; } // 0 = Mo … 6 = So
const DAYN = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

/* =====================================================================
   1) ERHOLUNG (0–100 %)
   ---------------------------------------------------------------------
   Bausteine (jeweils 0–100):
   - HRV (Gewicht 50 %): nächtlicher HRV-Mittelwert (rMSSD, ms). Verglichen wird der Logarithmus
     mit Mittelwert und Streuung der letzten 30 Nächte (ohne heute) → z-Wert. ln(rMSSD) ist der in der
     Forschung übliche Weg (Plews/Buchheit), weil HRV schief verteilt ist.
   - Ruhepuls (25 %): z-Wert gegen 30-Tage-Basis, umgekehrt (niedriger = besser). Streuung mind. 1,5 Schläge.
   - Schlaf (25 %): 65 % Dauer im Verhältnis zum eigenen Bedarf (30-Tage-Schnitt, begrenzt auf 7–9 h),
     35 % Qualität (Garmin-Schlafwert, sonst Anteil Tief- + REM-Schlaf, Ziel 40 %).
   Umrechnung z → Punkte: 100 / (1 + e^-(0,9 + 1,2·z)). Ein Tag genau auf der Basis ergibt 71 Punkte,
   eine Standardabweichung darunter 43, zwei darunter 18. So ist „normal“ knapp grün, Abweichungen zählen.
   Fehlt HRV, zählen Ruhepuls und Schlaf je 50 %.
   Ampel: grün ≥ 67, gelb 34–66, rot < 34.
   Body Battery wird NUR angezeigt und fließt nicht ein (Nutzerwunsch).
   Basis: mindestens 5 Nächte mit HRV oder Ruhepuls im 30-Tage-Fenster, sonst „Basis wird aufgebaut“;
   unter 14 Nächten gilt der Wert als vorläufig.
   ===================================================================== */
export const REC = { window: 30, minBase: 5, solidBase: 14, w: { hrv: 0.5, rhr: 0.25, sleep: 0.25 }, green: 67, red: 34 };
export const zToScore = z => 100 / (1 + Math.exp(-(0.9 + 1.2 * z)));
export const color = s => (s == null ? 'none' : s >= REC.green ? 'green' : s >= REC.red ? 'yellow' : 'red');

export function baselines(days, date) {
  const win = [];
  for (let k = 1; k <= REC.window; k++) { const d = days[addDays(date, -k)]; if (d) win.push(d); }
  const hrv = win.map(d => d.hrv).filter(v => v > 0);
  const rhr = win.map(d => d.rhr).filter(v => v > 0);
  const sl = win.map(d => d.sleep && d.sleep.total).filter(v => v > 0);
  const lnh = hrv.map(Math.log);
  return {
    nHrv: hrv.length, nRhr: rhr.length, nSleep: sl.length,
    hrv: hrv.length ? Math.exp(mean(lnh)) : null,
    lnHrvMean: lnh.length ? mean(lnh) : null,
    lnHrvSd: lnh.length ? Math.max(sd(lnh), 0.05) : null,
    rhr: rhr.length ? mean(rhr) : null,
    rhrSd: rhr.length ? Math.max(sd(rhr), 1.5) : null,
    sleep: sl.length ? mean(sl) : null,
    need: clamp(sl.length >= 5 ? mean(sl) : 8 * 3600, 7 * 3600, 9 * 3600)
  };
}

export function sleepQuality(s) {
  if (!s) return null;
  if (s.score != null) return clamp(s.score, 0, 100);
  if (s.deep != null && s.rem != null && s.total) return clamp(((s.deep + s.rem) / s.total) / 0.4 * 100, 0, 100);
  return null;
}

export function recovery(days, date) {
  const d = days[date] || { date };
  const b = baselines(days, date);
  const parts = [];
  if (d.hrv > 0 && b.nHrv >= REC.minBase) {
    const z = (Math.log(d.hrv) - b.lnHrvMean) / b.lnHrvSd;
    parts.push({ k: 'hrv', label: 'HRV', unit: 'ms', value: round(d.hrv), base: round(b.hrv), z: round(z, 2), score: zToScore(z), deltaPct: round((d.hrv / b.hrv - 1) * 100) });
  }
  if (d.rhr > 0 && b.nRhr >= REC.minBase) {
    const z = (b.rhr - d.rhr) / b.rhrSd;
    parts.push({ k: 'rhr', label: 'Ruhepuls', unit: 'bpm', value: round(d.rhr), base: round(b.rhr, 1), z: round(z, 2), score: zToScore(z), delta: round(d.rhr - b.rhr, 1) });
  }
  if (d.sleep && d.sleep.total) {
    const durPart = clamp(d.sleep.total / b.need, 0, 1.1);
    const q = sleepQuality(d.sleep);
    const score = clamp(100 * (0.65 * Math.min(1, durPart) ** 1.5 + 0.35 * (q == null ? 70 : q) / 100), 0, 100);
    parts.push({ k: 'sleep', label: 'Schlaf', unit: 'h', value: round(d.sleep.total / 3600, 3), base: round(b.need / 3600, 3), score, quality: q == null ? null : round(q), ofNeed: round(durPart * 100) });
  }
  const has = k => parts.some(p => p.k === k);
  const building = !has('hrv') && !has('rhr');
  let w = Object.assign({}, REC.w);
  if (!has('hrv')) { w = { hrv: 0, rhr: has('rhr') ? 0.5 : 0, sleep: has('rhr') ? 0.5 : 1 }; }
  if (!has('sleep')) { const t = w.hrv + w.rhr; if (t) { w.hrv /= t; w.rhr /= t; } w.sleep = 0; }
  const wsum = parts.reduce((s, p) => s + w[p.k], 0);
  const score = building || !wsum ? null : Math.round(parts.reduce((s, p) => s + w[p.k] * p.score, 0) / wsum);
  for (const p of parts) { p.weight = Math.round(w[p.k] / (wsum || 1) * 100); p.score = Math.round(p.score); }
  const nBase = Math.max(b.nHrv, b.nRhr);
  return {
    date, score, color: color(score), building, provisional: !building && nBase < REC.solidBase,
    baseNights: nBase, hasData: !!(d.hrv || d.rhr || d.sleep), parts, why: explain(parts, score)
  };
}

// „Warum heute gelb?“ – kurze Sätze, stärkster Einfluss zuerst
export function explain(parts, score) {
  if (score == null) return [];
  const out = [];
  const sorted = parts.slice().sort((a, b) => Math.abs(b.score - 71) * b.weight - Math.abs(a.score - 71) * a.weight);
  for (const p of sorted) {
    if (p.k === 'hrv') {
      const dir = p.deltaPct <= -3 ? `${Math.abs(p.deltaPct)} % unter` : p.deltaPct >= 3 ? `${p.deltaPct} % über` : 'auf';
      out.push({ k: p.k, good: p.score >= 60, text: `HRV ${p.value} ms – ${dir} deiner Basis (${p.base} ms).` });
    } else if (p.k === 'rhr') {
      const dir = p.delta >= 1.5 ? `${p.delta} Schläge über` : p.delta <= -1.5 ? `${Math.abs(p.delta)} Schläge unter` : 'auf';
      out.push({ k: p.k, good: p.score >= 60, text: `Ruhepuls ${p.value} – ${dir} deiner Basis (${p.base}).` });
    } else if (p.k === 'sleep') {
      out.push({ k: p.k, good: p.score >= 60, text: `Schlaf ${fmtH(p.value)} von ${fmtH(p.base)} Bedarf${p.quality != null ? `, Qualität ${p.quality}/100` : ''}.` });
    }
  }
  return out;
}
const fmtH = h => { const m = Math.round(h * 60); return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')} h`; };

/* =====================================================================
   2) BELASTUNG (Herz-Kreislauf, 0–100)
   ---------------------------------------------------------------------
   Zonen-TRIMP nach Edwards: Minuten in Zone 1–5 × 1–5. Fehlen Zonen, Banister-TRIMP aus Dauer und
   Durchschnittspuls (HFR-Anteil). Plus Alltag: 1,2 Punkte je 1000 Schritte (ohne die ersten 3000).
   Tageswert = 100 · (1 − e^(−TRIMP/220)) – flacht oben ab: 1 h locker ≈ 35, 2 h Baseball ≈ 55–65,
   harte 60 min ≈ 65–75. Zählt jede Garmin-Aktivität (Baseball, Rad, Laufen …).
   Wochensicht: akute (7 Tage) zu chronischer (28 Tage) Last; > 1,5 = deutlich mehr als gewohnt.
   ===================================================================== */
export const LOAD = { k: 220, zoneW: [1, 2, 3, 4, 5], stepsPer1000: 1.2, stepsFree: 3000 };

export function activityTrimp(a, hr) {
  if (a.zones && a.zones.some(Boolean)) return a.zones.reduce((s, sec, i) => s + sec / 60 * LOAD.zoneW[i], 0);
  if (a.avgHr && a.dur && hr && hr.max > hr.rest) {
    const x = clamp((a.avgHr - hr.rest) / (hr.max - hr.rest), 0, 1);
    return a.dur / 60 * x * 0.64 * Math.exp(1.92 * x);
  }
  return a.dur ? a.dur / 60 * 1.5 : 0; // ohne Puls: wie lockere Bewegung
}
export const loadScore = trimp => Math.round(100 * (1 - Math.exp(-trimp / LOAD.k)));

export function dayLoad(day, acts, hr) {
  const list = (acts || []).map(a => ({ id: a.id, name: a.name, type: a.type, time: a.time, dur: a.dur, avgHr: a.avgHr, trimp: round(activityTrimp(a, hr), 1) }));
  for (const a of list) a.score = loadScore(a.trimp);
  const actT = list.reduce((s, a) => s + a.trimp, 0);
  const stepsT = day && day.steps ? Math.max(0, day.steps - LOAD.stepsFree) / 1000 * LOAD.stepsPer1000 : 0;
  const trimp = actT + stepsT;
  return { trimp: round(trimp, 1), score: loadScore(trimp), activities: list, steps: day ? day.steps ?? null : null, stepsTrimp: round(stepsT, 1) };
}

export function loadRatio(loadByDate, date) {
  const sum = n => { let s = 0; for (let k = 0; k < n; k++) s += (loadByDate[addDays(date, -k)] || 0); return s; };
  const acute = sum(7) / 7, chronic = sum(28) / 28;
  return { acute: round(acute, 1), chronic: round(chronic, 1), ratio: chronic > 5 ? round(acute / chronic, 2) : null };
}

/* =====================================================================
   3) KRAFT: MUSKEL-ERMÜDUNG (der Unterschied zu Whoop)
   ---------------------------------------------------------------------
   Pro Satz: Reiz = Anstrengung(Reserve) × (1 Hauptmuskel | 0,5 mitbeteiligt).
     Reserve 0 → 1,0 · 1 → 0,95 · 2 → 0,85 · 3 → 0,7 · 4 → 0,55 · ≥5 → 0,4 · unbekannt → 0,8
   Ermüdung je Muskel = Σ Reiz · e^(−Stunden/τ). 5 volle harte Sätze = 100 % (Low-Volume/HIT: wenige, sehr harte Sätze).
   Status: ab 55 % ermüdet, ab 25 % teilweise, darunter erholt.
   τ (Zeitkonstante in Stunden) nach Muskelgröße und exzentrischer Last – große Beinmuskeln und
   unterer Rücken brauchen am längsten (typisch 48–72 h), Arme/Waden/Bauch erholen schneller (24–48 h):
   ===================================================================== */
export const TAU = { quads: 40, hams: 40, glutes: 36, lowback: 40, chest: 32, lats: 30, upperback: 30, fdelt: 26, sdelt: 24, rdelt: 24, biceps: 24, triceps: 24, forearms: 20, calves: 22, abs: 20, obliques: 20 };
export const FULL_SETS = 5;
export const effort = rir => (rir == null || rir === '' || isNaN(rir) ? 0.8 : rir <= 0 ? 1 : rir <= 1 ? 0.95 : rir <= 2 ? 0.85 : rir <= 3 ? 0.7 : rir <= 4 ? 0.55 : 0.4);
// Anzeige-Gruppen (Satzwerk-Muskelnamen siehe formwerk/SCHNITTSTELLE.md)
export const GROUPS = [
  { k: 'brust', label: 'Brust', m: ['chest'] },
  { k: 'ruecken', label: 'Rücken', m: ['lats', 'upperback'] },
  { k: 'schultern', label: 'Schultern', m: ['fdelt', 'sdelt', 'rdelt'] },
  { k: 'bizeps', label: 'Bizeps', m: ['biceps'] },
  { k: 'trizeps', label: 'Trizeps', m: ['triceps'] },
  { k: 'griff', label: 'Unterarme', m: ['forearms'] },
  { k: 'rumpf', label: 'Rumpf', m: ['abs', 'obliques', 'lowback'] },
  { k: 'vorn', label: 'Beine vorn', m: ['quads'] },
  { k: 'hinten', label: 'Po & Beinbeuger', m: ['glutes', 'hams'] },
  { k: 'waden', label: 'Waden', m: ['calves'] }
];
// Sport aus Garmin belastet bestimmte Muskeln mit (Reiz je 60 min, nach Intensität skaliert).
// Baseball: Werfen/Schlagen (Schulter, Rumpfrotation, Griff), Sprints (Beinbeuger, Po).
export const SPORT = {
  baseball: { rdelt: 1.2, sdelt: 0.8, upperback: 0.8, obliques: 1.2, forearms: 1, hams: 1, glutes: 0.8 },
  cycling: { quads: 1.4, glutes: 0.8, calves: 0.5 },
  running: { calves: 1.2, hams: 0.8, quads: 0.8, glutes: 0.6 },
  hiking: { quads: 0.6, calves: 0.6, glutes: 0.4 }
};
export function sportKind(type, name) {
  const t = (type || '') + ' ' + (name || '').toLowerCase();
  if (/baseball|softball/.test(t)) return 'baseball';
  if (/cycl|bike|biking|rad|gravel|mountain/.test(t)) return 'cycling';
  if (/run|lauf|trail/.test(t)) return 'running';
  if (/hik|walk|wander/.test(t)) return 'hiking';
  return null;
}

// sessions: Satzwerk-Einheiten (Format siehe SCHNITTSTELLE.md), acts: Garmin-Aktivitäten mit {ts, type, name, dur, trimp}
export function muscleFatigue(sessions, acts, now) {
  const f = {}; const last = {};
  const add = (m, v, ts) => { const h = (now - ts) / 3600e3; if (h < 0 || !TAU[m]) return; f[m] = (f[m] || 0) + v * Math.exp(-h / TAU[m]); if (!last[m] || ts > last[m]) last[m] = ts; };
  for (const s of sessions || []) {
    const ts = s.end || s.start || Date.parse(s.date + 'T18:00:00');
    for (const ex of s.exercises || []) {
      const prim = (ex.muscles && ex.muscles.primary) || [], sec = (ex.muscles && ex.muscles.secondary) || [];
      for (const set of ex.sets || []) {
        const e = effort(set.rir);
        for (const m of prim) add(m, e, ts);
        for (const m of sec) add(m, e * 0.5, ts);
      }
    }
  }
  for (const a of acts || []) {
    const kind = sportKind(a.type, a.name); if (!kind || !a.ts) continue;
    const intensity = clamp((a.trimp || a.dur / 60 * 1.5) / Math.max(1, a.dur / 60) / 2.5, 0.4, 1.4);
    for (const [m, v] of Object.entries(SPORT[kind])) add(m, v * a.dur / 3600 * intensity, a.ts + a.dur * 1000);
  }
  const pct = m => clamp(Math.round((f[m] || 0) / FULL_SETS * 100), 0, 100);
  return GROUPS.map(g => {
    const p = Math.max(...g.m.map(pct));
    const lastTs = Math.max(0, ...g.m.map(m => last[m] || 0));
    // Stunden bis „erholt“ (< 25 %) für den langsamsten Muskel der Gruppe
    const hrs = Math.max(0, ...g.m.map(m => { const v = (f[m] || 0) / FULL_SETS * 100; return v > 25 ? TAU[m] * Math.log(v / 25) : 0; }));
    return { k: g.k, label: g.label, pct: p, status: p >= 55 ? 'tired' : p >= 25 ? 'partial' : 'fresh', last: lastTs || null, readyIn: Math.round(hrs) };
  });
}

/* =====================================================================
   4) EMPFEHLUNG FÜR HEUTE
   ---------------------------------------------------------------------
   Rhythmus: Ziel 2 Kraft-Einheiten pro Woche (Low-Volume/HIT), Baseball Di + Do abends (einstellbar).
   Reihenfolge der Regeln:
   1. Heute schon Kraft trainiert → „Erledigt“.
   2. Rot → „Pause“.
   3. Baseball heute → Kraft höchstens leicht (frisch bleiben für abends), Beine/Schultern schonen.
   4. Letzte Kraft-Einheit < 48 h und Hauptmuskeln noch müde → „Kraft-Pause“ (aktive Erholung).
   5. Grün → „Kraft voll“, gelb → „Kraft leicht / Technik“, Basis im Aufbau → nach Schlaf/Gefühl.
   Abzüge um eine Stufe: Schlaf < 75 % des Bedarfs, Belastungsquote > 1,5.
   Wochenziel erreicht → Kraft wird „optional“. Tag vor Baseball → keine schweren Beine/Überkopf.
   ===================================================================== */
export const DEFAULT_SETTINGS = { sportDays: [1, 3], strengthPerWeek: 2 };

export function recommend({ date, rec, muscles, sessions, ratio, sleepPart, settings, now }) {
  const S = Object.assign({}, DEFAULT_SETTINGS, settings || {});
  const wd = weekday(date);
  const sportToday = S.sportDays.includes(wd), sportTomorrow = S.sportDays.includes((wd + 1) % 7);
  const mondayIso = addDays(date, -wd);
  const weekS = (sessions || []).filter(s => s.date >= mondayIso && s.date <= date);
  const todayS = weekS.filter(s => s.date === date);
  const lastS = (sessions || []).filter(s => s.date <= date).sort((a, b) => (b.end || 0) - (a.end || 0))[0];
  const hoursSince = lastS ? (now - (lastS.end || Date.parse(lastS.date + 'T18:00:00'))) / 3600e3 : null;
  const freshM = muscles.filter(m => m.status === 'fresh');
  const tired = muscles.filter(m => m.status === 'tired').map(m => m.label);
  const notes = [];
  const levels = ['rest', 'light', 'full'];
  let level, title, text;

  if (todayS.length) {
    level = 'done'; title = 'Kraft erledigt'; text = 'Heute schon trainiert – jetzt essen, trinken, gut schlafen.';
  } else if (rec.color === 'red') {
    level = 'rest'; title = 'Pause'; text = 'Dein Körper ist heute deutlich unter seiner Basis. Spazieren, Mobilität, früh schlafen.';
  } else {
    let lv = rec.color === 'green' ? 2 : rec.color === 'yellow' ? 1 : (sleepPart ? (sleepPart.ofNeed < 80 ? 1 : 2) : 1);
    if (!rec.hasData) notes.push('Noch keine Werte von heute Nacht – Uhr in Garmin Connect synchronisieren und neu laden.');
    if (sleepPart && sleepPart.ofNeed < 75 && lv > 1) { lv--; notes.push('Wenig Schlaf – lieber eine Stufe leichter.'); }
    if (ratio && ratio.ratio > 1.5 && lv > 1) { lv--; notes.push('Deutlich mehr Belastung als sonst diese Woche.'); }
    const recentHeavy = hoursSince != null && hoursSince < 48 && tired.length >= 2;
    if (recentHeavy) { lv = Math.min(lv, 0); notes.push(`Letzte Kraft-Einheit vor ${Math.round(hoursSince)} h – ${tired.join(', ')} noch müde.`); }
    if (sportToday && lv > 1) { lv = 1; notes.push('Heute Abend Baseball: frisch bleiben, keine schweren Beine oder Überkopf.'); }
    else if (sportToday) notes.push('Heute Abend Baseball.');
    if (!sportToday && sportTomorrow && lv >= 1) notes.push('Morgen Baseball: Beine und Schultern heute nicht bis ans Limit.');
    level = levels[lv];
    if (level === 'full') { title = 'Kraft voll'; text = 'Gute Voraussetzungen – harte Sätze, 1–2 Wdh. Reserve.'; }
    else if (level === 'light') { title = 'Kraft leicht / Technik'; text = 'Weniger Sätze (etwa ⅔), 3 Wdh. Reserve, saubere Technik.'; }
    else { title = recentHeavy ? 'Kraft-Pause' : 'Pause'; text = 'Heute aktive Erholung: Spaziergang, lockeres Rad, Mobilität.'; }
    if (rec.building) notes.unshift('Basis wird noch aufgebaut – Empfehlung vorläufig, hör auf dein Gefühl.');
  }
  const goalMet = weekS.length >= S.strengthPerWeek;
  if (goalMet && level !== 'done') { notes.push(`Wochenziel (${S.strengthPerWeek}× Kraft) erreicht – zusätzliche Einheit ist optional.`); }
  // Gut heute: erholte Gruppen; bei Baseball heute/morgen Beine & Schultern ausklammern
  const avoid = (sportToday || sportTomorrow) ? new Set(['vorn', 'hinten', 'schultern']) : new Set();
  const good = level === 'rest' || level === 'done' ? [] : freshM.filter(m => !avoid.has(m.k)).map(m => m.label);
  return {
    level, title, text, notes, good, avoid: muscles.filter(m => avoid.has(m.k)).map(m => m.label), tired,
    week: { done: weekS.length, goal: S.strengthPerWeek, goalMet },
    sportToday, sportTomorrow, sportDays: S.sportDays.map(i => DAYN[i])
  };
}

/* =====================================================================
   5) SCHLAF
   ===================================================================== */
export function sleepView(days, date) {
  const d = days[date]; const b = baselines(days, date);
  if (!d || !d.sleep) return { date, has: false, avg: b.sleep };
  const s = d.sleep;
  const ofAvg = b.sleep ? s.total / b.sleep : null;
  return {
    date, has: true, total: s.total, deep: s.deep, light: s.light, rem: s.rem, awake: s.awake, score: s.score ?? null,
    start: s.start || null, end: s.end || null, local: !!s.local, avg: b.sleep ? Math.round(b.sleep) : null, need: Math.round(b.need),
    ofAvg: ofAvg == null ? null : Math.round(ofAvg * 100),
    short: ofAvg != null && ofAvg < 0.85 && b.nSleep >= 5
  };
}

/* =====================================================================
   GESAMT: alles für die App in einem Rutsch
   ===================================================================== */
// days: {iso: Tageswerte}, actsByDate: {iso: [Aktivität]}, sessions: [Satzwerk-Einheit], hr: {rest, max}
export function buildSummary({ days, actsByDate, sessions, settings, today, now, hr, tzOff = 0, histDays = 90 }) {
  const hrv = hr || estimateHr(days, actsByDate);
  const loadBy = {}, loads = {};
  for (let k = 0; k < histDays + 28; k++) {
    const d = addDays(today, -k);
    const L = dayLoad(days[d], actsByDate[d], hrv);
    loads[d] = L; loadBy[d] = L.trimp;
  }
  // Muskeln: Satzwerk + Sport-Aktivitäten der letzten 7 Tage
  const recentActs = [];
  for (let k = 0; k < 7; k++) { const d = addDays(today, -k); for (const a of actsByDate[d] || []) recentActs.push(Object.assign({}, a, { trimp: activityTrimp(a, hrv), ts: Date.parse(d + 'T' + (a.time || '18:00') + ':00Z') - tzOff })); }
  const recentS = (sessions || []).filter(s => s.date >= addDays(today, -10));
  const muscles = muscleFatigue(recentS, recentActs, now);
  const rec = recovery(days, today);
  const sleep = sleepView(days, today);
  const ratio = loadRatio(loadBy, today);
  const sleepPart = rec.parts.find(p => p.k === 'sleep');
  const recommendation = recommend({ date: today, rec, muscles, sessions, ratio, sleepPart, settings, now });
  const t = days[today] || {};
  const history = [];
  for (let k = histDays - 1; k >= 0; k--) {
    const d = addDays(today, -k); const x = days[d] || {};
    const r = recovery(days, d);
    const strength = (sessions || []).filter(s => s.date === d);
    history.push({
      date: d, rec: r.score, color: r.color, hrv: x.hrv ?? null, rhr: x.rhr ?? null,
      sleep: x.sleep ? round(x.sleep.total / 3600, 2) : null, sleepScore: x.sleep ? x.sleep.score ?? null : null,
      load: loads[d].score, strength: strength.length, sets: strength.reduce((s, x2) => s + (x2.exercises || []).reduce((u, e) => u + (e.sets || []).length, 0), 0),
      bb: x.bbHigh ?? null
    });
  }
  const b = baselines(days, today);
  return {
    model: MODEL_VERSION, date: today,
    recovery: rec,
    recommendation,
    muscles,
    sleep,
    load: Object.assign({}, loads[today], { ratio }),
    bodyBattery: { high: t.bbHigh ?? null, low: t.bbLow ?? null, now: t.bbNow ?? null, wake: t.bbWake ?? null, charged: t.bbCharged ?? null, drained: t.bbDrained ?? null, curve: t.bbCurve || [] },
    vitals: { hrv: t.hrv ?? null, hrvBase: round(b.hrv), hrvStatus: t.hrvStatus || null, rhr: t.rhr ?? null, rhrBase: round(b.rhr, 1), stress: t.stress ?? null, steps: t.steps ?? null },
    strength: { last: (sessions || []).filter(s => s.date <= today).sort((a, c) => (c.end || 0) - (a.end || 0))[0] || null },
    history
  };
}

// Ruhe- und Maximalpuls schätzen (für Banister-TRIMP ohne Zonen): Ruhepuls = Median der letzten Wochen,
// Maximalpuls = höchster gemessener Wert, mindestens 185.
export function estimateHr(days, actsByDate) {
  const r = Object.values(days).map(d => d.rhr).filter(v => v > 0).sort((a, b) => a - b);
  const mx = Math.max(185, ...Object.values(actsByDate).flat().map(a => a.maxHr || 0));
  return { rest: r.length ? r[Math.floor(r.length / 2)] : 60, max: mx };
}
