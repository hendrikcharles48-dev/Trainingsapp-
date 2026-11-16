// Formwerk-Modell: Erholung, Belastung, Muskel-Ermüdung, Empfehlung.
// Reine Funktionen ohne Netz/Speicher – getestet in test/model.test.js.
// Alles relativ zur EIGENEN Basis (gleitender Durchschnitt), nie zu Normwerten. Trainingshilfe, keine Medizin.

export const MODEL_VERSION = 2;

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

// Ruhepuls zählt nur, wenn die Nacht gemessen wurde (Schlaf oder HRV da). Ohne Nacht rechnet Garmin ihn aus
// Tageswerten – der liegt immer höher und würde Erholung und Basis verfälschen (Nutzer 16.11.: 41 % nach unbemessener Nacht).
const FEEL_Q = [40, 70, 90];
// floor = kleinste Streuung, damit normale Tagesschwankungen nie als Ausreißer gelten (Ruhepuls 1,5 Schläge, ln-HRV 0,08)
export function trimOut(vals, f = x => x, floor = 0) {
  if (vals.length < 10) return vals;
  const t = vals.map(f), m = mean(t), s0 = Math.max(sd(t), floor) || 1;
  return vals.filter((v, i) => Math.abs(t[i] - m) <= 2.5 * s0);
}
export const rhrValid = d => (d && (d.sleep || d.hrv > 0) ? d.rhr : null);
export function baselines(days, date) {
  const win = [];
  // Kranke Tage (Morgen-Check „krank“) zählen nicht zur Basis; einzelne Ausreißer (> 2,5 SD) werden gekappt,
  // damit eine Erkältungswoche die Basis nicht verschiebt und danach alles zu gut aussieht.
  for (let k = 1; k <= REC.window; k++) { const d = days[addDays(date, -k)]; if (d && !d.sick) win.push(d); }
  const hrv = trimOut(win.map(d => d.hrv).filter(v => v > 0), Math.log, 0.08);
  const rhr = trimOut(win.map(rhrValid).filter(v => v > 0), x => x, 1.5);
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

// opts: { ck: Check-in des Tages (sleepEst = eigene Schlafangabe), settled: Tag ist synchronisiert (Nacht fehlt wirklich) }
export function recovery(days, date, opts = {}) {
  // Nacht nur teilweise gemessen: Garmin-Schlaf (zu kurz) nicht werten, eigene Angabe stattdessen; HRV/Ruhepuls zählen weiter
  if (opts.partial) {
    const se = opts.ck && opts.ck.sleepEst;
    const c = recoveryCore(days, date, { skipSleep: true, sleepEst: se });
    c.partialNight = true;
    c.why = [{ k: 'part', good: true, text: `Nacht nur teilweise gemessen – der Schlaf von Garmin ist zu kurz und zählt nicht${se ? ', stattdessen deine Angabe' : ''}.` }].concat(c.why || []);
    if (c.score != null) return c;
    return estimateRecovery(days, date, c, opts.ck);
  }
  const core = recoveryCore(days, date);
  if (core.score != null || core.hasNight || !opts.settled) return core;
  return estimateRecovery(days, date, core, opts.ck);
}
/* Nacht ohne Messung (Uhr nicht getragen): Erholung SCHÄTZEN statt aus dem Tages-Ruhepuls rechnen.
   Basis = gewichteter Schnitt der letzten bis zu 3 gemessenen Tage (3:2:1) aus den 7 Tagen davor.
   Mit eigener Schlafangabe (Stunden, Gefühl schlecht/okay/gut) zählt die Angabe 40 %, die Basis 60 %. */
export function estimateRecovery(days, date, core, ck) {
  const prev = [];
  for (let k = 1; k <= 7 && prev.length < 3; k++) { const r = recoveryCore(days, addDays(date, -k)); if (r.score != null && r.hasNight) prev.push(r.score); }
  const wts = [3, 2, 1].slice(0, prev.length);
  const base = prev.length ? prev.reduce((s, v, i) => s + v * wts[i], 0) / wts.reduce((a, b) => a + b, 0) : null;
  const se = ck && ck.sleepEst; const b = baselines(days, date);
  let sleepSub = null;
  if (se && se.h) sleepSub = clamp(100 * (0.65 * Math.min(1, se.h * 3600 / b.need) ** 1.5 + 0.35 * (FEEL_Q[se.q ?? 1] / 100)), 0, 100);
  const score = base == null && sleepSub == null ? null : Math.round(base == null ? sleepSub : sleepSub == null ? base : 0.6 * base + 0.4 * sleepSub);
  const why = [{ k: 'est', good: true, text: `Nacht ohne Messung (Uhr nicht getragen) – geschätzt aus ${prev.length ? `deinen letzten ${prev.length} gemessenen Tagen (Ø ${Math.round(base)} %)` : 'deiner Angabe'}${sleepSub != null ? ` und deiner Schlafangabe (${String(se.h).replace('.', ',')} h, ${['schlecht', 'okay', 'gut'][se.q ?? 1]})` : ''}. Der Ruhepuls von heute ist ein Tageswert und zählt nicht.` }];
  return Object.assign({}, core, { score, color: color(score), building: score == null, estimated: true, estBase: base == null ? null : Math.round(base), estSleep: sleepSub == null ? null : Math.round(sleepSub), parts: [], why, hasData: true });
}
export function sleepScoreFrom(totalSec, quality, need) {
  return clamp(100 * (0.65 * Math.min(1, clamp(totalSec / need, 0, 1.1)) ** 1.5 + 0.35 * (quality == null ? 70 : quality) / 100), 0, 100);
}
// o.skipSleep: Garmin-Schlaf nicht werten (Nacht nur teilweise gemessen); o.sleepEst: eigene Angabe {h, q} statt dessen
export function recoveryCore(days, date, o = {}) {
  const d = days[date] || { date };
  const b = baselines(days, date);
  const parts = [];
  if (d.hrv > 0 && b.nHrv >= REC.minBase) {
    const z = (Math.log(d.hrv) - b.lnHrvMean) / b.lnHrvSd;
    parts.push({ k: 'hrv', label: 'HRV', unit: 'ms', value: round(d.hrv), base: round(b.hrv), z: round(z, 2), score: zToScore(z), deltaPct: round((d.hrv / b.hrv - 1) * 100) });
  }
  if (rhrValid(d) > 0 && b.nRhr >= REC.minBase) {
    const z = (b.rhr - d.rhr) / b.rhrSd;
    parts.push({ k: 'rhr', label: 'Ruhepuls', unit: 'bpm', value: round(d.rhr), base: round(b.rhr, 1), z: round(z, 2), score: zToScore(z), delta: round(d.rhr - b.rhr, 1) });
  }
  if (o.sleepEst && o.sleepEst.h) {
    const q = FEEL_Q[o.sleepEst.q ?? 1];
    parts.push({ k: 'sleep', label: 'Schlaf (deine Angabe)', unit: 'h', value: o.sleepEst.h, base: round(b.need / 3600, 3), score: sleepScoreFrom(o.sleepEst.h * 3600, q, b.need), quality: q, ofNeed: round(o.sleepEst.h * 3600 / b.need * 100), est: true });
  } else if (d.sleep && d.sleep.total && !o.skipSleep) {
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
    baseNights: nBase, hasData: !!(d.hrv || d.rhr || d.sleep), hasNight: !!(d.hrv > 0 || d.sleep), parts, why: explain(parts, score)
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
  // Krafttraining nur auf der Uhr (ohne Satzwerk): grob Ganzkörper je 60 min
  strength: { chest: 2.2, lats: 2, upperback: 1.6, fdelt: 1.2, sdelt: 0.6, biceps: 1.2, triceps: 1.2, quads: 2.2, glutes: 1.8, hams: 1.2, abs: 1 },
  baseball: { rdelt: 1.2, sdelt: 0.8, upperback: 0.8, obliques: 1.2, forearms: 1, hams: 1, glutes: 0.8 },
  cycling: { quads: 1.4, glutes: 0.8, calves: 0.5 },
  running: { calves: 1.2, hams: 0.8, quads: 0.8, glutes: 0.6 },
  hiking: { quads: 0.6, calves: 0.6, glutes: 0.4 }
};
export function sportKind(type, name) {
  const t = (type || '') + ' ' + (name || '').toLowerCase();
  if (/baseball|softball/.test(t)) return 'baseball';
  if (/strength|kraft|weight|gym|hiit|functional/.test(t)) return 'strength';
  if (/cycl|bike|biking|rad|gravel|mountain/.test(t)) return 'cycling';
  if (/run|lauf|trail/.test(t)) return 'running';
  if (/hik|walk|wander/.test(t)) return 'hiking';
  return null;
}

// sessions: Satzwerk-Einheiten (Format siehe SCHNITTSTELLE.md), acts: Garmin-Aktivitäten mit {ts, type, name, dur, trimp}
// calib (Stufe 2, gelernt): {gruppe: {s: Faktor Kraft, b: Faktor Baseball/Sport}} – fehlt er, gilt 1.
// Ergebnis je Gruppe: pct (kalibriert), raw = {s, b} ungekalibrierte Anteile in % (für das Lernen)
export function muscleFatigue(sessions, acts, now, calib) {
  const fS = {}, fB = {}; const last = {};
  const add = (bag, m, v, ts) => { const h = (now - ts) / 3600e3; if (h < 0 || !TAU[m]) return; bag[m] = (bag[m] || 0) + v * Math.exp(-h / TAU[m]); if (!last[m] || ts > last[m]) last[m] = ts; };
  for (const s of sessions || []) {
    const ts = s.end || s.start || Date.parse(s.date + 'T18:00:00');
    for (const ex of s.exercises || []) {
      const prim = (ex.muscles && ex.muscles.primary) || [], sec = (ex.muscles && ex.muscles.secondary) || [];
      for (const set of ex.sets || []) {
        const e = effort(set.rir);
        for (const m of prim) add(fS, m, e, ts);
        for (const m of sec) add(fS, m, e * 0.5, ts);
      }
    }
  }
  for (const a of acts || []) {
    const kind = sportKind(a.type, a.name); if (!kind || !a.ts) continue;
    const intensity = kind === 'strength' ? 1 : clamp((a.trimp || a.dur / 60 * 1.5) / Math.max(1, a.dur / 60) / 2.5, 0.4, 1.4);
    for (const [m, v] of Object.entries(SPORT[kind])) add(fB, m, v * a.dur / 3600 * intensity, a.ts + a.dur * 1000);
  }
  const P = v => (v || 0) / FULL_SETS * 100;
  return GROUPS.map(g => {
    const c = (calib && calib[g.k]) || {}; const cs = c.s || 1, cb = c.b || 1;
    const per = g.m.map(m => ({ m, s: P(fS[m]), b: P(fB[m]), v: P(fS[m]) * cs + P(fB[m]) * cb }));
    const top = per.reduce((x, y) => (y.v > x.v ? y : x), per[0]);
    const p = clamp(Math.round(top.v), 0, 100);
    const lastTs = Math.max(0, ...g.m.map(m => last[m] || 0));
    // Stunden bis „erholt“ (< 25 %) für den langsamsten Muskel der Gruppe
    const hrs = Math.max(0, ...per.map(x => (x.v > 25 ? TAU[x.m] * Math.log(x.v / 25) : 0)));
    return { k: g.k, label: g.label, pct: p, status: p >= 55 ? 'tired' : p >= 25 ? 'partial' : 'fresh', last: lastTs || null, readyIn: Math.round(hrs), raw: { s: round(top.s, 1), b: round(top.b, 1) } };
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
// Baseball-Tage: Standard keine (unregelmäßig) – gespielt wird per Schalter „Heute/Gestern Baseball“ oder Uhr-Aktivität
export const DEFAULT_SETTINGS = { sportDays: [], sportTimes: {}, strengthPerWeek: 2 };

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
    else if (rec.estimated) notes.push('Erholung geschätzt (Nacht ohne Messung) – hör zusätzlich auf dein Gefühl.');
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
  if (!d || !d.sleep) {
    // Warum fehlt die Nacht? Garmin kennt den Tag schon (synchronisiert nach dem Aufwachen), hat aber keinen Schlaf
    // → Uhr war nachts nicht am Handgelenk (lange ohne Messung) – kein Synchronisierungsproblem.
    const synced = d && d.syncedUntil ? String(d.syncedUntil).slice(11, 16) : null;
    const reason = !d || !synced || synced < '06:00' ? 'notSynced' : (d.noMeasureMin || 0) >= 180 ? 'notWorn' : 'noSleep';
    return { date, has: false, avg: b.sleep, reason, syncedUntil: synced, noMeasureMin: d ? d.noMeasureMin ?? null : null };
  }
  const s = d.sleep;
  const ofAvg = b.sleep ? s.total / b.sleep : null;
  // Teilweise gemessen: deutlich kürzer als sonst UND ≥ 90 min ohne Messung (Uhr abgelegt/Akku leer)
  const synced = d.syncedUntil ? String(d.syncedUntil).slice(11, 16) : null;
  const partial = !!(ofAvg != null && ofAvg < 0.8 && (d.noMeasureMin || 0) >= 90 && b.nSleep >= 5);
  return {
    reason: partial ? 'partial' : null, noMeasureMin: d.noMeasureMin ?? null, syncedUntil: synced,
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
export function buildSummary({ days, actsByDate, sessions, settings, today, now, hr, tzOff = 0, histDays = 90, manualWeights = [], checkins = [] }) {
  const weight = weightView(days, manualWeights, today);
  const kgBy = Object.fromEntries(weight.series.map(x => [x.date, x.kg]));
  const hrv = hr || estimateHr(days, actsByDate);
  const loadBy = {}, loads = {};
  for (let k = 0; k < histDays + 28; k++) {
    const d = addDays(today, -k);
    const L = dayLoad(days[d], actsByDate[d], hrv);
    loads[d] = L; loadBy[d] = L.trimp;
  }
  const S = Object.assign({}, DEFAULT_SETTINGS, settings || {});
  checkins = (checkins || []).map(normCheckin);
  const ckBy = Object.fromEntries(checkins.map(c => [c.date, c]));
  // kranke Tage markieren (zählen nicht zur Basis)
  if (checkins.some(c => c.sick)) { days = Object.assign({}, days); for (const c of checkins) if (c.sick) days[c.date] = Object.assign({ date: c.date }, days[c.date], { sick: true }); }
  // Krafttraining auf der Uhr ohne passende Satzwerk-Einheit (± 3 h) → zählt grob für Muskeln, Woche und Wiedereinstieg
  const covered = (a, d) => (sessions || []).some(s => s.date === d && (!s.end || !a.ts || Math.abs(s.end - (a.ts + (a.dur || 0) * 1000)) < 3 * 3600e3));
  const watchStrength = [];
  for (let k = 0; k < 30; k++) { const d = addDays(today, -k); for (const a of actsByDate[d] || []) if (sportKind(a.type, a.name) === 'strength') { const ts = Date.parse(d + 'T' + (a.time || '18:00') + ':00Z') - tzOff; if (!covered(Object.assign({ ts }, a), d)) watchStrength.push({ id: 'uhr-' + (a.id || d), date: d, time: a.time, dur: a.dur, end: ts + (a.dur || 0) * 1000, exercises: [], watch: true }); } }
  // Muskeln: Satzwerk + Sport-Aktivitäten der letzten 7 Tage
  const recentActs = [];
  for (let k = 0; k < 7; k++) { const d = addDays(today, -k); for (const a of actsByDate[d] || []) if (sportKind(a.type, a.name) !== 'strength' || watchStrength.some(w => w.date === d && w.time === a.time)) recentActs.push(Object.assign({}, a, { trimp: activityTrimp(a, hrv), ts: Date.parse(d + 'T' + (a.time || '18:00') + ':00Z') - tzOff })); }
  const allActs = withCheckinBaseball(actsByDate, ckBy, hrv, tzOff, S, today);
  for (let k = 0; k < 7; k++) { const d = addDays(today, -k); for (const a of allActs[d] || []) if (a.assumed) recentActs.push(a); }
  const calib = calibrate({ sessions, allActs, checkins, today, tzOff, hr: hrv });
  const recentS = (sessions || []).filter(s => s.date >= addDays(today, -10));
  const muscles = applySoreness(muscleFatigue(recentS, recentActs, now, calib.groups), ckBy[today]);
  const pain = painToday(ckBy, today);
  const sleepNow = sleepView(days, today);
  const rec = recovery(days, today, { ck: ckBy[today], settled: sleepNow.reason === 'notWorn' || sleepNow.reason === 'noSleep', partial: sleepNow.reason === 'partial' });
  const allStrength = (sessions || []).concat(watchStrength);
  const sleep = sleepView(days, today);
  const ratio = loadRatio(loadBy, today);
  const sleepPart = rec.parts.find(p => p.k === 'sleep');
  const ckT = ckBy[today] || {};
  const bbT = baseballDay(ckBy, S, today, actsByDate), bbY = baseballDay(ckBy, S, addDays(today, -1), actsByDate);
  const S2 = Object.assign({}, S, { sportDays: bbT.on ? [...new Set(S.sportDays.concat(weekday(today)))] : S.sportDays.filter(x => x !== weekday(today)) });
  let recommendation = applyPain(recommend({ date: today, rec, muscles, sessions: allStrength, ratio, sleepPart, settings: S2, now }), pain, muscles);
  recommendation = applyLife(recommendation, { today, ck: ckBy[today], allStrength, watchStrength, rec });
  const body = { flags: { bb: ckT.bb ?? null, bbToday: ckT.bbToday ?? null, sleepEst: ckT.sleepEst || null }, baseball: { today: bbT, yesterday: bbY }, checkin: ckBy[today] && !ckBy[today].partial ? ckBy[today] : null, askBaseball: bbY.planned && !bbY.recorded && bbY.auto == null && ckT.bb == null && !(ckBy[addDays(today, -1)] && ckBy[addDays(today, -1)].bbToday != null) ? { date: addDays(today, -1), from: bbY.from } : false, sick: !!ckT.sick, watchStrength: watchStrength.filter(w => w.date >= addDays(today, -3)), pain, calib, insights: insights({ ckBy, allActs, today, calib, settings: S }) };
  const t = days[today] || {};
  const history = [];
  for (let k = histDays - 1; k >= 0; k--) {
    const d = addDays(today, -k); const x = days[d] || {};
    const r = recovery(days, d, { ck: ckBy[d], settled: d < today });
    const strength = (sessions || []).filter(s => s.date === d);
    history.push({
      date: d, rec: r.score, color: r.color, hrv: x.hrv ?? null, rhr: x.rhr ?? null,
      sleep: x.sleep ? round(x.sleep.total / 3600, 2) : null, sleepScore: x.sleep ? x.sleep.score ?? null : null,
      load: loads[d].score, strength: strength.length, sets: strength.reduce((s, x2) => s + (x2.exercises || []).reduce((u, e) => u + (e.sets || []).length, 0), 0),
      bb: x.bbHigh ?? null, kg: kgBy[d] ?? null
    });
  }
  const signals = physio(days, today, history, ckBy);
  recommendation = applySignals(recommendation, signals);
  const prefill = prefillFor({ days, today, history, ckBy, rec, sleep, recommendation, muscles, pain, allActs });
  const b = baselines(days, today);
  return {
    model: MODEL_VERSION, date: today, signals, prefill,
    recovery: rec,
    recommendation,
    muscles,
    sleep,
    load: Object.assign({}, loads[today], { ratio }),
    bodyBattery: { high: t.bbHigh ?? null, low: t.bbLow ?? null, now: t.bbNow ?? null, wake: t.bbWake ?? null, charged: t.bbCharged ?? null, drained: t.bbDrained ?? null, curve: t.bbCurve || [] },
    vitals: { hrv: t.hrv ?? null, hrvBase: round(b.hrv), hrvStatus: t.hrvStatus || null, rhr: t.rhr ?? null, rhrDay: !!(t.rhr && !rhrValid(t)), rhrBase: round(b.rhr, 1), stress: t.stress ?? null, steps: t.steps ?? null, syncedUntil: t.syncedUntil ? String(t.syncedUntil).slice(11, 16) : null,
      // letzte Synchronisierung der Uhr überhaupt (für „Uhr hat seit … nicht synchronisiert“)
      watchLast: Object.values(days).map(x => x.syncedUntil).filter(Boolean).map(v => String(v).slice(0, 16)).sort().pop() || null },
    weight,
    body,
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

/* =====================================================================
   6) KÖRPERGEWICHT
   ---------------------------------------------------------------------
   Quellen: von Hand (Formwerk, übernommene Satzwerk-Werte) und Garmin (falls in Garmin Connect gewogen).
   Von Hand gewinnt am selben Tag. Trend: Schnitt der letzten 7 Tage gegen die 7 Tage davor, in % pro Woche
   (Ziel beim Abnehmen mit Muskelerhalt: −0,25 bis −0,75 %/Woche).
   ===================================================================== */
export function weightView(days, manual, today) {
  const by = {};
  for (const d of Object.values(days || {})) if (d.gKg) by[d.date] = { date: d.date, kg: d.gKg, src: 'garmin' };
  for (const m of manual || []) if (m && m.kg) by[m.date] = { date: m.date, kg: m.kg, src: m.src || 'formwerk' };
  const series = Object.values(by).filter(x => x.date <= today).sort((a, b) => (a.date < b.date ? -1 : 1));
  const avg = (from, to) => { const v = series.filter(x => x.date > from && x.date <= to).map(x => x.kg); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
  const a = avg(addDays(today, -7), today), b = avg(addDays(today, -14), addDays(today, -7));
  return { latest: series[series.length - 1] || null, series, trend: a && b ? { pct: round((a / b - 1) * 100, 2), a: round(a, 1), b: round(b, 1) } : null };
}

/* =====================================================================
   7) KÖRPERGEFÜHL: MUSKELKATER UND SCHMERZ (Morgen-Check)
   ---------------------------------------------------------------------
   Check-in je Tag: {date, v: 5, sore: {gruppe: 1–5}, pain: {stelle: 1–5}, bb/bbToday: Baseball}
   Stufe 1 – heute: Muskelkater hebt die Gruppe auf mindestens 25/35/50/70/85 % (Stufe 1–5; ab 3 „teilweise“, ab 4 „ermüdet“).
     Schmerz ist kein Muskelkater: ab 2/5 werden die Gruppen geschont, ab 4/5 heute keine Kraft,
     ab 2/5 an 3 von 5 Tagen → Hinweis „abklären lassen“. Keine Diagnose.
   Stufe 2 – lernen: An Check-in-Tagen wird die Rechnung (morgens 8 Uhr) mit deiner Angabe verglichen
     (keiner 10 %, Stufe 1–5: 25/35/50/70/85 %). Daraus je Gruppe ein Faktor für Kraft- bzw. Baseball-Ermüdung,
     vorsichtig zur 1 hin gezogen (n/(n+6)), 0,6–1,8, wirksam ab 4 passenden Tagen.
   Stufe 3 – Muster (6 Wochen): wiederkehrende Beschwerden, Zusammenhang mit Baseball, gute Kraft-Tage.
   ===================================================================== */
export const PAIN_AREAS = [
  { k: 'nacken', label: 'Nacken', groups: ['schultern'] },
  { k: 'schulter', label: 'Schulter', groups: ['schultern', 'brust'], inj: 'shoulder' },
  { k: 'ellbogen', label: 'Ellbogen', groups: ['bizeps', 'trizeps', 'griff'], inj: 'elbow' },
  { k: 'handgelenk', label: 'Handgelenk', groups: ['griff'], inj: 'wrist' },
  { k: 'oberer_ruecken', label: 'Oberer Rücken', groups: ['ruecken'] },
  { k: 'unterer_ruecken', label: 'Unterer Rücken', groups: ['rumpf', 'hinten'], inj: 'lowback' },
  { k: 'huefte', label: 'Hüfte', groups: ['hinten', 'vorn'] },
  { k: 'leiste', label: 'Leiste', groups: ['vorn', 'hinten'] },
  { k: 'oberschenkel', label: 'Oberschenkel hinten', groups: ['hinten'] },
  { k: 'knie', label: 'Knie', groups: ['vorn'], inj: 'knee' },
  { k: 'sprunggelenk', label: 'Sprunggelenk', groups: ['waden'] },
  { k: 'achilles', label: 'Achillessehne / Wade', groups: ['waden'] }
];
const AREA = Object.fromEntries(PAIN_AREAS.map(a => [a.k, a]));
const GLABEL = Object.fromEntries(GROUPS.map(g => [g.k, g.label]));
// Skala ab Worker 1.7: Muskelkater und Schmerz je 1–5 (1 sehr leicht/kaum … 5 sehr stark).
// Ältere Check-ins (Muskelkater 1–2, Schmerz 1–3, ohne v: 5) werden beim Lesen umgerechnet (gespeichert bleibt alles, wie es war).
const SORE_PCT = [10, 25, 35, 50, 70, 85];
const PAIN_PCT = [0, 20, 35, 55, 70, 85];
export function normCheckin(c) {
  if (!c || c.v === 5) return c;
  const map = (o, m) => Object.fromEntries(Object.entries(o || {}).map(([k, v]) => [k, m[v] || v]));
  return Object.assign({}, c, { sore: map(c.sore, { 1: 2, 2: 4 }), pain: map(c.pain, { 1: 2, 2: 3, 3: 4 }), v: 5 });
}
const TIPS = {
  schulter: 'Schulter-Vorbeugung 2× pro Woche (Außenrotation mit Band, Face Pulls); Überkopf-Kraft nicht am Tag nach Baseball.',
  ellbogen: 'Wurf- und Zugvolumen dosieren, Unterarme langsam kräftigen (Hängen, Handgelenk-Curls).',
  handgelenk: 'Stütz-Übungen mit neutralem Griff oder Parallettes, Unterarme kräftigen.',
  nacken: 'Schulterblätter kräftigen (Face Pulls), Nacken zwischendurch lockern.',
  oberer_ruecken: 'Zugübungen sauber ausführen, Brustwirbelsäule mobilisieren.',
  unterer_ruecken: 'Rumpf-Stabilität (Plank, Dead Bug); Hüftbeuge-Übungen sauber und nicht bis ans Limit.',
  huefte: 'Hüftmobilität täglich ein paar Minuten, Po kräftigen; Sprints gut aufwärmen.',
  leiste: 'Adduktoren behutsam kräftigen (leichte Copenhagen-Plank), Sprints gut aufwärmen.',
  oberschenkel: 'Beinbeuger exzentrisch kräftigen (Nordic Curls) – nicht am Tag nach Baseball.',
  knie: 'Kniebeugen-Tiefe und Gewicht anpassen, Oberschenkel vorn und Po kräftigen.',
  sprunggelenk: 'Waden und Fußgelenk kräftigen, Sprünge dosieren.',
  achilles: 'Waden exzentrisch kräftigen (langsam absenken), Sprünge dosieren.'
};

// Baseball aus dem Check-in („gestern Baseball? ja“), wenn Garmin dafür keine Aktivität hat: 2 h mittlere Intensität
// Baseball ohne Uhr-Aktivität: feste Zeiten zählen automatisch (ab ihrem „since“), außer abgewählt
// („heute kein Baseball“ bzw. am nächsten Morgen „gestern nein“); dazu von Hand angetippte Tage.
export function planned(S, date) {
  const t = (S.sportTimes || {})[weekday(date)];
  return (S.sportDays || []).includes(weekday(date)) && t && (!t.since || date >= t.since) ? t : null;
}
export function baseballDay(ckBy, S, date, acts) {
  const recorded = (acts[date] || []).some(a => sportKind(a.type, a.name) === 'baseball' && !a.assumed);
  const c = ckBy[date] || {}, n = ckBy[addDays(date, 1)] || {}; const p = planned(S, date);
  // Reihenfolge: Uhr-Aktivität > deine Antwort > Puls-Erkennung im festen Zeitfenster (S.autoBB) > fester Termin
  const auto = p && S.autoBB && S.autoBB[date] != null ? S.autoBB[date] : null;
  const on = recorded || (n.bb != null ? n.bb : c.bbToday != null ? c.bbToday : auto != null ? auto : !!p);
  return { recorded, planned: !!p, auto, on, from: p ? p.from : '18:30', dur: p ? p.dur : 120 };
}
export function withCheckinBaseball(actsByDate, ckBy, hr, tzOff = 0, S = DEFAULT_SETTINGS, today = null, back = 100) {
  const out = Object.assign({}, actsByDate);
  const end = today || Object.keys(ckBy).sort().pop(); if (!end) return out;
  for (let k = 0; k <= back; k++) {
    const y = addDays(end, -k); const b = baseballDay(ckBy, S, y, actsByDate);
    if (!b.on || b.recorded) continue;
    out[y] = (out[y] || []).concat([{ id: 'ck-' + y, date: y, time: b.from, name: b.planned ? 'Baseball (feste Zeit)' : 'Baseball (angetippt)', type: 'baseball', dur: b.dur * 60, avgHr: null, assumed: true, trimp: Math.round(b.dur * 1.5), ts: Date.parse(y + 'T' + b.from + ':00Z') - tzOff }]);
  }
  return out;
}

export function applySoreness(muscles, ck) {
  if (!ck) return muscles;
  return muscles.map(m => {
    const lv = (ck.sore || {})[m.k] || 0; const pn = Math.max(0, ...PAIN_AREAS.filter(a => a.groups.includes(m.k)).map(a => (ck.pain || {})[a.k] || 0));
    const x = Object.assign({}, m, { sore: lv || 0, pain: pn || 0 });
    if (lv) x.pct = Math.max(x.pct, SORE_PCT[lv]);
    if (pn) x.pct = Math.max(x.pct, PAIN_PCT[pn]);
    x.status = x.pct >= 55 ? 'tired' : x.pct >= 25 ? 'partial' : 'fresh';
    return x;
  });
}

export function painToday(ckBy, today) {
  const ck = ckBy[today]; if (!ck || !ck.pain) return [];
  return Object.entries(ck.pain).filter(([k, v]) => v > 0 && AREA[k]).map(([k, lvl]) => {
    let days = 0; for (let i = 0; i < 5; i++) { const c = ckBy[addDays(today, -i)]; if (c && c.pain && c.pain[k] >= 2) days++; }
    return { k, label: AREA[k].label, lvl, inj: AREA[k].inj || null, days, groups: AREA[k].groups };
  }).sort((a, b) => b.lvl - a.lvl);
}

export function applyPain(r, pain, muscles) {
  if (!pain || !pain.length) return r;
  const x = Object.assign({}, r, { notes: r.notes.slice() });
  const hard = pain.filter(p => p.lvl >= 4);
  if (hard.length && x.level !== 'done') { x.level = 'rest'; x.title = 'Pause'; x.text = `Starker Schmerz (${hard.map(p => p.label).join(', ')}): heute keine Kraft. Schonen, nur was schmerzfrei geht.`; x.good = []; }
  for (const p of pain) {
    x.notes.unshift(p.lvl >= 2 ? `${p.label} schmerzt (${p.lvl}/5): schonen – keine Übungen, die ${p.label === 'Nacken' ? 'den Nacken' : 'diese Stelle'} belasten.` : `${p.label} leicht spürbar (1/5) – im Blick behalten.`);
    if (p.days >= 3) x.notes.unshift(`${p.label} schmerzt seit ${p.days} von 5 Tagen – bitte abklären lassen (Arzt oder Physio).`);
  }
  const blocked = new Set(pain.filter(p => p.lvl >= 2).flatMap(p => p.groups));
  x.good = (x.good || []).filter(l => !muscles.some(m => m.label === l && blocked.has(m.k)));
  return x;
}

// Stufe 2: Faktoren je Gruppe aus Check-ins der letzten 90 Tage
export function calibrate({ sessions, allActs, checkins, today, tzOff = 0, hr }) {
  const acc = {}; let used = 0;
  // Krafttraining von der Uhr nicht mitlernen (meist auch in Satzwerk – sonst doppelt)
  const flatActs = Object.entries(allActs).flatMap(([d, list]) => (list || []).filter(a => sportKind(a.type, a.name) !== 'strength').map(a => Object.assign({}, a, { trimp: a.trimp || activityTrimp(a, hr), ts: a.ts || Date.parse(d + 'T' + (a.time || '18:00') + ':00Z') - tzOff })));
  for (const c of checkins || []) {
    if (!c || c.partial || c.date > today || c.date < addDays(today, -90)) continue;
    const t = Date.parse(c.date + 'T08:00:00Z') - tzOff;
    const ses = (sessions || []).filter(s => s.date >= addDays(c.date, -10) && s.date <= c.date);
    const ac = flatActs.filter(a => a.ts < t && a.ts > t - 7 * 864e5);
    const pred = muscleFatigue(ses, ac, t, null);
    let any = false;
    for (const m of pred) {
      const rep = (c.sore || {})[m.k] || 0; const P = m.raw.s + m.raw.b;
      if (P < 10 && !rep) continue; // ruhiger Tag ohne Aussage
      const k = m.raw.b > m.raw.s ? 'b' : 's';
      const g = acc[m.k] || (acc[m.k] = { s: { t: 0, p: 0, n: 0 }, b: { t: 0, p: 0, n: 0 } });
      g[k].t += SORE_PCT[rep]; g[k].p += P; g[k].n++; any = true;
    }
    if (any) used++;
  }
  const groups = {}, info = [];
  for (const [k, g] of Object.entries(acc)) {
    const f = x => { if (x.n < 4) return 1; const raw = (x.t + 5) / (x.p + 5); return round(clamp(1 + (clamp(raw, 0.4, 2.5) - 1) * x.n / (x.n + 6), 0.6, 1.8), 2); };
    groups[k] = { s: f(g.s), b: f(g.b), nS: g.s.n, nB: g.b.n };
    for (const [kind, val] of [['s', groups[k].s], ['b', groups[k].b]]) if (Math.abs(val - 1) >= 0.15) info.push({ k, label: GLABEL[k], kind, f: val });
  }
  return { groups, info, checkins: (checkins || []).filter(c => c.date >= addDays(today, -90)).length, used };
}

// Stufe 3: Muster der letzten 6 Wochen und gute Kraft-Tage
export function insights({ ckBy, allActs, today, calib, settings }) {
  const from = addDays(today, -41);
  const cks = Object.values(ckBy).filter(c => c.date >= from && c.date <= today && !c.partial);
  const afterBB = c => c.bb === true || (allActs[addDays(c.date, -1)] || []).some(a => sportKind(a.type, a.name) === 'baseball');
  const out = [];
  for (const a of PAIN_AREAS) {
    const hit = cks.filter(c => (c.pain || {})[a.k] >= 2); if (hit.length < 2) continue;
    const nb = hit.filter(afterBB).length;
    out.push({ kind: 'pain', k: a.k, n: hit.length, bb: nb, text: `${a.label}: ${hit.length}× Schmerz in 6 Wochen${nb ? `, davon ${nb}× am Tag nach Baseball` : ''}.`, tip: TIPS[a.k] });
  }
  const bbGroups = [];
  for (const g of GROUPS) {
    const hit = cks.filter(c => (c.sore || {})[g.k] >= 2); if (hit.length < 3) continue;
    const nb = hit.filter(afterBB).length;
    if (nb / hit.length >= 0.6) { bbGroups.push(g.k); out.push({ kind: 'sore', k: g.k, n: hit.length, bb: nb, text: `${g.label}: Muskelkater meist nach Baseball (${nb} von ${hit.length}).`, tip: 'Diese Muskeln nicht am Tag nach Baseball hart trainieren.' }); }
    else out.push({ kind: 'sore', k: g.k, n: hit.length, bb: nb, text: `${g.label}: ${hit.length}× Muskelkater in 6 Wochen.`, tip: '' });
  }
  for (const i of (calib && calib.info) || []) out.push({ kind: 'learn', k: i.k, text: `${i.label} ${i.kind === 'b' ? 'nach Baseball' : 'nach Kraft'}: erholt sich bei dir ${i.f > 1 ? 'langsamer' : 'schneller'} als gedacht (${i.f > 1 ? '+' : '−'}${Math.round(Math.abs(i.f - 1) * 100)} %) – Formwerk rechnet jetzt so.`, tip: '' });
  // gute Kraft-Tage: nicht an Baseball-Tagen, ungern am Tag davor; Tag danach schlechter, wenn Baseball dich spürbar ermüdet
  const sd = settings.sportDays || [];
  const bbHurts = bbGroups.length >= 1 || out.some(x => x.kind === 'pain' && x.bb >= 2);
  const score = [0, 1, 2, 3, 4, 5, 6].map(d => {
    let v = 0; if (sd.includes(d)) v -= 5; if (sd.includes((d + 1) % 7)) v -= 1; if (sd.includes((d + 6) % 7)) v -= bbHurts ? 2 : 0.5;
    return { d, v };
  });
  const want = Math.max(1, Math.min(4, settings.strengthPerWeek || 2)); const pick = [];
  for (const x of score.slice().sort((a, b) => b.v - a.v || a.d - b.d)) {
    if (pick.length >= want) break;
    if (x.v <= -5) continue;
    if (pick.some(p => Math.min(Math.abs(p - x.d), 7 - Math.abs(p - x.d)) < 2)) continue; // mind. 1 Tag Pause dazwischen
    pick.push(x.d);
  }
  pick.sort((a, b) => a - b);
  return {
    items: out, checkins: cks.length, enough: cks.length >= 14,
    strengthDays: { idx: pick, days: pick.map(d => DAYN[d]), why: bbHurts ? 'Nicht an Baseball-Tagen, nicht am Tag davor – und weil Baseball dich spürbar ermüdet, auch nicht direkt danach.' : 'Nicht an Baseball-Tagen und möglichst nicht am Tag davor, mit mindestens einem Tag Pause dazwischen.' }
  };
}

/* =====================================================================
   8) SIGNALE: STRESSZEICHEN UND LEICHTERE WOCHE (alles relativ zur eigenen Basis)
   ---------------------------------------------------------------------
   Stresszeichen (heute, „Körper kämpft vielleicht mit etwas“ – keine Diagnose):
     nächtliche Atemfrequenz ≥ Basis + max(1,0; 2·SD)  UND  (Ruhepuls ≥ Basis + 3  ODER  HRV-z ≤ −1,5),
     oder zwei der drei ohne Atemfrequenz, plus Sauerstoff (SpO2) ≥ 2 Punkte unter Basis als Zusatzgrund.
     Dann: heute locker (Empfehlung „Locker bleiben“).
   Leichtere Woche (Deload-Melder, 7 Tage gegen die 30 Tage davor):
     HRV-Schnitt deutlich unter Basis (ln-HRV ≤ −0,5 SD) · Ruhepuls-Schnitt ≥ Basis + 2 · Erholung im Schnitt < 50 ·
     an ≥ 3 Morgen-Checks starker Muskelkater oder Schmerz. Ab 2 Zeichen → Vorschlag; Satzwerk nimmt seine Leistung dazu.
   ===================================================================== */
function windowStats(vals) { const v = vals.filter(x => x != null && !isNaN(x)); return v.length ? { n: v.length, m: mean(v), sd: sd(v) } : { n: 0 }; }
export function physio(days, today, history, ckBy) {
  const day = k => days[addDays(today, -k)] || {};
  const base = (f, from, to) => windowStats(Array.from({ length: to - from + 1 }, (_, i) => f(day(from + i))));
  // heute
  const t = day(0); const reasons = [];
  const rb = base(d => d.sleep && d.sleep.resp, 1, 30), hb = base(d => (d.hrv > 0 ? Math.log(d.hrv) : null), 1, 30), pb = base(d => rhrValid(d), 1, 30), ob = base(d => d.sleep && d.sleep.spo2, 1, 30);
  let resp = false, rhr = false, hrv = false, spo2 = false;
  if (t.sleep && t.sleep.resp && rb.n >= 7) resp = t.sleep.resp >= rb.m + Math.max(1, 2 * rb.sd);
  if (rhrValid(t) && pb.n >= 7) rhr = t.rhr >= pb.m + 3;
  if (t.hrv > 0 && hb.n >= 7) hrv = (Math.log(t.hrv) - hb.m) / Math.max(hb.sd, 0.05) <= -1.5;
  if (t.sleep && t.sleep.spo2 && ob.n >= 7) spo2 = t.sleep.spo2 <= ob.m - 2;
  if (resp) reasons.push(`Atemfrequenz nachts ${round(t.sleep.resp, 1)} statt ~${round(rb.m, 1)}`);
  if (rhr) reasons.push(`Ruhepuls ${t.rhr} statt ~${round(pb.m)}`);
  if (hrv) reasons.push(`HRV ${t.hrv} ms deutlich unter deiner Basis`);
  if (spo2) reasons.push(`Sauerstoff nachts ${t.sleep.spo2} % statt ~${round(ob.m)} %`);
  const stress = (resp && (rhr || hrv)) || (rhr && hrv);
  // Woche
  const wk = [], h7 = history.slice(-7);
  const lnh7 = base(d => (d.hrv > 0 ? Math.log(d.hrv) : null), 0, 6), lnhB = base(d => (d.hrv > 0 ? Math.log(d.hrv) : null), 7, 36);
  if (lnh7.n >= 4 && lnhB.n >= 10 && (lnh7.m - lnhB.m) / Math.max(lnhB.sd, 0.05) <= -0.5) wk.push(`HRV seit einer Woche unter deiner Basis (Ø ${round(Math.exp(lnh7.m))} statt ${round(Math.exp(lnhB.m))} ms)`);
  const r7 = base(d => rhrValid(d), 0, 6), rB = base(d => rhrValid(d), 7, 36);
  if (r7.n >= 4 && rB.n >= 10 && r7.m >= rB.m + 2) wk.push(`Ruhepuls seit einer Woche erhöht (Ø ${round(r7.m, 1)} statt ${round(rB.m, 1)})`);
  const rec7 = h7.map(x => x.rec).filter(x => x != null);
  if (rec7.length >= 4 && mean(rec7) < 50) wk.push(`Erholung im Wochenschnitt nur ${Math.round(mean(rec7))} %`);
  const ck7 = Array.from({ length: 7 }, (_, i) => ckBy[addDays(today, -i)]).filter(c => c && !c.partial);
  const hard = ck7.filter(c => Object.values(c.sore || {}).some(v => v >= 4) || Object.values(c.pain || {}).some(v => v >= 3)).length;
  if (hard >= 3) wk.push(`An ${hard} Morgen-Checks starker Muskelkater oder Schmerz`);
  return { stress: { flag: !!stress, reasons }, deload: { suggest: wk.length >= 2, count: wk.length, reasons: wk } };
}
export function applySignals(r, sig) {
  if (!sig) return r;
  const x = Object.assign({}, r, { notes: r.notes.slice() });
  if (sig.stress.flag && x.level !== 'done') {
    x.level = 'rest'; x.title = 'Locker bleiben'; x.good = [];
    x.text = 'Dein Körper zeigt heute Stresszeichen. Nur lockere Bewegung, viel trinken, früh schlafen.';
    x.notes.unshift('Stresszeichen: ' + sig.stress.reasons.join(' · ') + '. Fühlst du dich krank: ganz Pause.');
  }
  if (sig.deload.suggest) x.notes.push('Leichtere Woche empfohlen: ' + sig.deload.reasons.join(' · ') + '.');
  return x;
}

// Vorschläge für Satzwerk: Tagesform vor dem Training und Wochen-Check-in (der Nutzer bestätigt immer selbst)
export function prefillFor({ days, today, history, ckBy, rec, sleep, recommendation, muscles, pain, allActs }) {
  const why = [];
  let en = null, sl = null;
  if (rec.score != null) {
    en = recommendation.level === 'rest' || rec.score < 40 ? 0 : rec.score >= 75 && !muscles.some(m => m.sore >= 4) ? 2 : 1;
    why.push(`Erholung ${rec.score} %`);
  } else if (recommendation.level === 'rest') en = 0;
  if (pain.some(p => p.lvl >= 3) && en === 2) en = 1;
  if (recommendation.title === 'Wiedereinstieg' && en === 2) en = 1;
  if (ckBy[today] && ckBy[today].sick) en = 0;
  const se = ckBy[today] && ckBy[today].sleepEst;
  if (sleep && !sleep.has && se && se.h) { sl = se.h < 6 || se.q === 0 ? 0 : se.h >= 7.5 && se.q === 2 ? 2 : 1; why.push(`Schlaf ~${String(se.h).replace('.', ',')} h (deine Angabe)`); }
  if (rec.estimated && rec.score != null) why[0] = `Erholung geschätzt ${rec.score} %`;
  if (sleep && sleep.has) {
    sl = sleep.short ? 0 : (sleep.ofAvg >= 98 && (sleep.score == null || sleep.score >= 75)) ? 2 : 1;
    why.push(`Schlaf ${Math.floor(sleep.total / 3600)}:${String(Math.round(sleep.total % 3600 / 60)).padStart(2, '0')} h`);
  }
  // Woche: die letzten 7 Tage
  const h7 = history.slice(-7); const rec7 = h7.map(x => x.rec).filter(x => x != null);
  const ck7 = Array.from({ length: 7 }, (_, i) => ckBy[addDays(today, -i)]).filter(c => c && !c.partial);
  const ans = {}, src = {};
  if (rec7.length >= 3) { const r = mean(rec7);
    ans.exh = r >= 85 ? 1 : r >= 70 ? 2 : r >= 55 ? 3 : r >= 40 ? 4 : 5; ans.fit = r >= 85 ? 5 : r >= 70 ? 4 : r >= 55 ? 3 : r >= 40 ? 2 : 1; src.exh = src.fit = `Erholung Ø ${Math.round(r)} %`; }
  const sl7 = h7.map(x => x.sleep).filter(x => x != null);
  if (sl7.length >= 3) { const need = Math.max(7, Math.min(9, mean(history.slice(-37, -7).map(x => x.sleep).filter(x => x != null)) || 8)); const q = mean(sl7) / need;
    ans.sleep = q >= 0.95 ? 3 : q >= 0.85 ? 2 : 1; src.sleep = `Schlaf Ø ${round(mean(sl7), 1)} h`; }
  if (ck7.length >= 3) {
    const strong = ck7.filter(c => Object.values(c.sore || {}).some(v => v >= 4)).length, any = ck7.filter(c => Object.values(c.sore || {}).some(v => v >= 2)).length;
    ans.sore = strong >= 3 ? 4 : strong >= 1 ? 3 : any ? 2 : 1; src.sore = `${ck7.length} Morgen-Checks`;
    const pmax = Math.max(0, ...ck7.flatMap(c => Object.values(c.pain || {})));
    ans.pain = pmax >= 3 ? 2 : pmax >= 1 ? 1 : 0; src.pain = src.sore;
  }
  let games = 0, other = 0;
  for (let i = 0; i < 7; i++) for (const a of allActs[addDays(today, -i)] || []) { const k = sportKind(a.type, a.name); if (k === 'baseball') games++; else if (k) other++; }
  const sp = games + other * 0.5; ans.sport = sp >= 3 ? 3 : sp >= 2 ? 2 : sp >= 0.5 ? 1 : 0; src.sport = `${games}× Baseball${other ? `, ${other}× anderer Sport` : ''}`;
  return { tf: { en, sl, why: why.join(' · ') }, week: { ans, src } };
}

/* =====================================================================
   9) ALLTAG: krank, Wiedereinstieg nach Pause, Kraft nur auf der Uhr
   ---------------------------------------------------------------------
   Krank (Morgen-Check): heute Pause, Tag zählt nicht zur Basis.
   ≥ 10 Tage ohne Kraft: „Wiedereinstieg“ (höchstens leicht), danach wieder normal.
   Krafttraining nur auf der Uhr (ohne Satzwerk): zählt grob, Hinweis „in Satzwerk nachtragen“.
   ===================================================================== */
export function applyLife(r, { today, ck, allStrength, watchStrength, rec }) {
  const x = Object.assign({}, r, { notes: r.notes.slice() });
  if (ck && ck.sick) {
    return Object.assign(x, { level: 'rest', title: 'Krank – Pause', text: 'Erst gesund werden: kein Training, viel schlafen und trinken. Kranke Tage zählen nicht zu deiner Basis.', good: [], notes: x.notes.filter(n => !/Baseball/.test(n)) });
  }
  const before = allStrength.filter(s => s.date < today).map(s => s.date).sort();
  const last = before[before.length - 1];
  const gap = last ? Math.round((Date.parse(today) - Date.parse(last)) / 864e5) : null;
  const doneToday = allStrength.some(s => s.date === today);
  if (gap != null && gap >= 10 && !doneToday && x.level !== 'rest') {
    x.level = 'light'; x.title = 'Wiedereinstieg';
    x.text = `Nach ${gap} Tagen ohne Kraft: leichter einsteigen – etwa ⅔ der Sätze, 3 Wdh. Reserve. Ab der zweiten Einheit wieder normal.`;
  }
  for (const w of watchStrength.filter(w => w.date >= addDays(today, -3))) {
    x.notes.push(`Krafttraining auf der Uhr ${w.date === today ? 'heute' : 'am ' + w.date.slice(8, 10) + '.' + w.date.slice(5, 7) + '.'} ohne Satzwerk – Muskeln grob geschätzt. In Satzwerk nachtragen für genaue Werte.`);
  }
  return x;
}

/* =====================================================================
   10) BASEBALL AM PULS ERKENNEN (feste Zeiten, Nutzerwunsch 16.11.)
   ---------------------------------------------------------------------
   Im festen Zeitfenster den Tagespuls der Uhr ansehen: getragen (≥ 40 % des Fensters mit Werten) und
   ≥ 20 % der Werte über Ruhepuls + 30 ODER Schnitt ≥ Ruhepuls + 22 → warst da. Getragen, aber ruhig → warst nicht da.
   Kaum Werte (Uhr nicht getragen) → unbekannt (dann zählt der Termin und Formwerk fragt am Morgen).
   ===================================================================== */
export function detectBaseball(hrJson, startTs, endTs, rest = 55) {
  let vals = hrJson && (hrJson.heartRateValues || hrJson.values || (Array.isArray(hrJson) ? hrJson : null));
  if (!Array.isArray(vals)) return { v: null, reason: 'keine Daten', complete: false };
  vals = vals.map(x => (Array.isArray(x) ? [Number(x[0]), Number(x[1])] : [Number(x.timestamp || x.startGMT), Number(x.value || x.heartRate)])).filter(x => x[0] > 0);
  const maxTs = vals.length ? Math.max(...vals.map(x => x[0])) : 0;
  const complete = maxTs >= endTs - 5 * 60e3;
  const ts = vals.map(x => x[0]).sort((a, b) => a - b); const gaps = [];
  for (let i = 1; i < ts.length; i++) { const g = ts[i] - ts[i - 1]; if (g > 0 && g < 30 * 60e3) gaps.push(g); }
  gaps.sort((a, b) => a - b); const step = gaps.length ? gaps[Math.floor(gaps.length / 2)] : 120e3;
  const win = vals.filter(x => x[0] >= startTs && x[0] <= endTs && x[1] > 0);
  const coverage = Math.min(1, win.length * step / Math.max(1, endTs - startTs));
  if (coverage < 0.4) return { v: null, reason: 'Uhr im Zeitfenster kaum getragen', coverage: round(coverage, 2), complete };
  const m = mean(win.map(x => x[1])); const active = win.filter(x => x[1] >= rest + 30).length / win.length;
  return { v: active >= 0.2 || m >= rest + 22, coverage: round(coverage, 2), active: round(active, 2), mean: Math.round(m), complete };
}
