#!/usr/bin/env node
/* Satzwerk-Wochenbericht: Fakten aus der Sicherung ausrechnen und einen Bericht prüfen.
   Nur für Claude-Sitzungen (wird nicht ausgeliefert). Persönliche Daten nie ins Repository schreiben –
   Eingabe- und Ausgabedateien liegen im Scratchpad.

   node tools/coach.js facts  <backup.json> [summary.json] [checkins.json]   → Fakten (JSON) auf stdout
   node tools/coach.js check  <backup.json> <bericht.json>                   → prüft den Bericht gegen Plan/Übungen
   node tools/coach.js custom <backup.json>                                   → eigene Übungen, die noch nicht eingebaut sind

   Bericht-Format (v1), wird per PUT /v1/coach im Formwerk-Worker abgelegt und von Satzwerk angezeigt:
   { v: 1, id: '2026-W46', created: ISO, title, summary, points: [{t, d}],
     actions: [{ id, kind: 'swap'|'sets'|'rr'|'deload', label, why, planId, dayId, slotId, loc, to, sets, rr: [lo, hi] }],
     built: ['Name eingebauter eigener Übungen'] } */
'use strict';
const fs = require('fs'), path = require('path');
global.window = global;
require(path.join(__dirname, '..', 'exercises.js'));
require(path.join(__dirname, '..', 'engine.js'));
const E = window.ENGINE, D = window.EXDB;

const read = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const iso = d => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
const daysAgo = n => iso(new Date(Date.now() - n * 864e5));
const r1 = x => Math.round(x * 10) / 10;

// wie findBuiltin in app.js
const STOP = new Set(['an', 'am', 'mit', 'der', 'die', 'das', 'den', 'auf', 'im', 'in', 'zur', 'zum', 'und', 'von', 'kh', 'lh']);
const nameKey = n => String(n || '').toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, ' ').trim().split(' ')
  .filter(w => w && !STOP.has(w)).map(w => w.length > 4 ? w.replace(/(en|e|n|s)$/, '') : w).sort().join(' ');
const findBuiltin = name => { const k = nameKey(name); return k ? D.list.find(e => nameKey(e.name) === k || (e.alias || []).some(a => nameKey(a) === k)) || null : null; };

function load(f) {
  const b = read(f); if (!b || b.app !== 'satzwerk' || !b.profile) throw new Error('Keine Satzwerk-Sicherung: ' + f);
  const p = b.profile, ws = (b.workouts || []).slice().sort((x, y) => (x.ts || 0) - (y.ts || 0));
  for (const c of p.custom || []) D.byId[c.id] = D.byId[c.id] || c;
  E.setWorkouts(() => ws);
  const plan = (p.plans || []).find(x => x.id === p.planId) || p.plan;
  return { b, p, ws, plan };
}
const exOf = (p, id) => D.byId[id] || (p.custom || []).find(c => c.id === id) || null;

function facts(f, summaryF, checkF) {
  const { b, p, ws, plan } = load(f);
  const loc = (p.answers || {}).location === 'gym' ? 'gym' : (plan && plan.locs || ['home'])[0];
  const wk = ws.filter(w => w.date >= daysAgo(7)), prev = ws.filter(w => w.date >= daysAgo(14) && w.date < daysAgo(7));
  // harte Sätze je Muskel (Hauptmuskel 1, mitbeteiligt 0,5; ohne Skill/Kondition)
  const vol = list => { const v = {}; for (const m in D.MUSCLES) v[m] = 0; for (const w of list) for (const e of w.exercises || []) { const ex = exOf(p, e.exId); if (!ex || ex.role === 's' || ex.role === 'x') continue; const n = (e.sets || []).filter(s => s.done !== false).length; for (const m of ex.prim) v[m] += n; for (const m of ex.sec || []) v[m] += n * 0.5; } return v; };
  const pv = plan ? E.planVolume(plan, p) : null;
  const done7 = vol(wk);
  const muscles = Object.keys(D.MUSCLES).map(m => ({ m, name: D.MUSCLES[m], target: pv ? pv.targets[m] : 10, planned: pv ? r1(pv.week[m]) : null, done7: r1(done7[m]) }));
  // Übungen im Plan: Verlauf, Stillstand
  const slots = [];
  if (plan) for (const d of plan.days) for (const sl of d.slots) {
    const ex = exOf(p, sl.ex && sl.ex[loc]); if (!ex) continue;
    const h = E.historyFor(ex.id, ws); const bests = h.slice(-6).map(x => ({ date: x.date, best: r1(E.sessionBest(ex, x.entry, x.bw || E.bodyweight(p))), sets: (x.entry.sets || []).map(s => [s.w, s.reps, s.sec, s.rir].filter(v => v != null).join('/')) }));
    const last3 = bests.slice(-3).map(x => x.best), before = bests.slice(0, -3).map(x => x.best);
    const stalled = bests.length >= 4 && Math.max(...last3) <= Math.max(...before, 0) && (Date.now() - new Date(bests[bests.length - 4].date).getTime()) / 864e5 >= 18;
    const rirs = h.slice(-3).flatMap(x => (x.entry.sets || []).map(s => s.rir).filter(v => v != null));
    slots.push({ planId: plan.id, dayId: d.id, day: d.name, slotId: sl.id, role: sl.r, exId: ex.id, ex: ex.name, custom: !!ex.custom, lvl: ex.lvl, grp: ex.grp || null, sets: sl.sets, rr: sl.custRR || sl.rr, rest: sl.rest, locked: !!(sl.locked && sl.locked[loc]), sessions: h.length, recent: bests, stalled, avgRir3: rirs.length ? r1(rirs.reduce((a, c) => a + c, 0) / rirs.length) : null,
      alternatives: E.alternatives ? E.alternatives(sl, loc, p, []).filter(a => a.ex.id !== ex.id).slice(0, 4).map(a => ({ id: a.ex.id, name: a.ex.name, lvl: a.ex.lvl })) : [] });
  }
  // Reserve ehrlich?
  const allSets = wk.flatMap(w => (w.exercises || []).flatMap(e => (e.sets || []).filter(s => s.done !== false && s.rir != null)));
  const rir = { n: allSets.length, avg: allSets.length ? r1(allSets.reduce((a, s) => a + s.rir, 0) / allSets.length) : null, zero: allSets.filter(s => s.rir === 0).length, easy: allSets.filter(s => s.rir >= 4).length };
  // Körpergewicht: 7-Tage-Schnitt gegen die Woche davor
  const bw = (p.bwLog || []).slice().sort((a, c) => a.d < c.d ? -1 : 1);
  const avg = (from, to) => { const x = bw.filter(e => e.d >= from && e.d < to); return x.length ? x.reduce((a, e) => a + e.kg, 0) / x.length : null; };
  const a1 = avg(daysAgo(7), daysAgo(-1)), a0 = avg(daysAgo(14), daysAgo(7));
  const weight = { n7: bw.filter(e => e.d >= daysAgo(7)).length, trendPctPerWeek: a1 && a0 ? r1((a1 - a0) / a0 * 1000) / 10 : null, goalRange: E.isCut(p) ? [-0.75, -0.25] : null };
  const out = {
    today: iso(new Date()), appVersion: b.appVersion, exported: b.exported, goal: (p.answers || {}).goal, recomp: E.isCut(p), name: (p.answers || {}).name || null,
    plan: plan ? { id: plan.id, name: plan.name, custom: !!plan.custom, edited: !!plan.edited, auto: !plan.custom && !plan.edited, days: plan.days.length, meso: plan.meso, mesoWeek: E.mesoWeek(plan), forceDeload: !!plan.forceDeload, loc } : null,
    week: { sessions: wk.length, prevSessions: prev.length, planned: plan ? plan.days.length : null, list: wk.map(w => ({ date: w.date, name: w.name, min: Math.round((w.dur || 0) / 60), rating: w.rating || null, prs: (w.prs || []).length })) },
    totalWorkouts: ws.length, lastWorkout: ws.length ? ws[ws.length - 1].date : null,
    muscles, slots, rir, weight,
    checkins: (p.checkins || []).slice(-3), sportDays: p.sportDays || [],
    coachDone: p.coachDone || {},
    customOpen: customOpen(p, ws).map(c => c.name)
  };
  if (summaryF && fs.existsSync(summaryF)) { const s = read(summaryF); out.formwerk = { recovery: s.recovery, recommendation: s.recommendation, sleep: s.sleep, load: s.load, signals: s.signals, muscles: s.muscles, vitals: s.vitals, pain: s.pain, weight: s.weight }; }
  if (checkF && fs.existsSync(checkF)) { const c = read(checkF); out.morning = (c.checkins || c).slice ? (c.checkins || c).slice(-10) : c; }
  return out;
}

function customOpen(p, ws) {
  return (p.custom || []).filter(c => !c.hidden && !findBuiltin(c.name)).map(c => ({ id: c.id, name: c.name, pat: c.pat, kind: c.kind, eq: c.eq, prim: c.prim, rr: c.rr, skill: c.skill || null, info: c.info || null,
    sessions: ws.filter(w => (w.exercises || []).some(e => e.exId === c.id)).length, note: ((p.exNotes || {})[c.id] || {}).t || null }));
}

function check(f, rf) {
  const { p } = load(f); const r = read(rf); const err = [];
  if (r.v !== 1) err.push('v muss 1 sein');
  for (const k of ['id', 'title', 'summary']) if (!r[k] || typeof r[k] !== 'string') err.push('fehlt: ' + k);
  if (r.summary && r.summary.length > 600) err.push('summary zu lang (max. 600 Zeichen)');
  if (!Array.isArray(r.points) || r.points.length > 6) err.push('points: Liste mit höchstens 6 Einträgen');
  if (!Array.isArray(r.actions) || r.actions.length > 4) err.push('actions: Liste mit höchstens 4 Einträgen');
  const ids = new Set();
  for (const a of r.actions || []) {
    const tag = 'Aktion ' + a.id + ': ';
    if (!a.id || ids.has(a.id)) err.push(tag + 'id fehlt oder doppelt'); ids.add(a.id);
    if (!a.label || !a.why) err.push(tag + 'label und why nötig');
    const pl = (p.plans || [p.plan]).find(x => x && x.id === a.planId); if (!pl) { err.push(tag + 'Plan ' + a.planId + ' gibt es nicht'); continue; }
    if (a.kind === 'deload') continue;
    const d = pl.days.find(x => x.id === a.dayId); const sl = d && d.slots.find(x => x.id === a.slotId);
    if (!sl) { err.push(tag + 'Tag/Platz nicht gefunden'); continue; }
    if (a.kind === 'swap') { if (sl.ex && sl.ex[a.loc] === a.to) err.push(tag + 'ist schon diese Übung'); if (!exOf(p, a.to) || exOf(p, a.to).hidden) err.push(tag + 'Übung ' + a.to + ' gibt es nicht'); if (!['home', 'gym'].includes(a.loc)) err.push(tag + 'loc home|gym'); }
    else if (a.kind === 'sets') { if (!(a.sets >= 1 && a.sets <= 6 && Number.isInteger(a.sets))) err.push(tag + 'sets 1–6'); }
    else if (a.kind === 'rr') { if (!Array.isArray(a.rr) || !(a.rr[0] >= 3 && a.rr[1] <= 30 && a.rr[0] < a.rr[1])) err.push(tag + 'rr [lo, hi], 3–30'); }
    else err.push(tag + 'kind swap|sets|rr|deload');
  }
  return err;
}

const [cmd, a, b2, c] = process.argv.slice(2);
try {
  if (cmd === 'facts') console.log(JSON.stringify(facts(a, b2, c), null, 1));
  else if (cmd === 'check') { const e = check(a, b2); if (e.length) { console.log('FEHLER\n- ' + e.join('\n- ')); process.exit(1); } console.log('OK'); }
  else if (cmd === 'custom') { const { p, ws } = load(a); console.log(JSON.stringify(customOpen(p, ws), null, 1)); }
  else { console.log('node tools/coach.js facts|check|custom …'); process.exit(2); }
} catch (e) { console.error(e.message); process.exit(1); }
