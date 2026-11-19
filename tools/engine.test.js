#!/usr/bin/env node
/* Tests für die Trainingslogik in engine.js (ohne Browser): node tools/engine.test.js
   Nur erfundene Beispieldaten – keine echten Nutzerdaten ins Repository. */
'use strict';
const path = require('path'); const assert = require('assert');
global.window = global;
require(path.join(__dirname, '..', 'exercises.js'));
require(path.join(__dirname, '..', 'engine.js'));
const E = window.ENGINE, D = window.EXDB;

let n = 0, fails = 0;
function t(name, fn) { n++; try { fn(); console.log('ok   ' + name); } catch (e) { fails++; console.log('FAIL ' + name + '\n     ' + (e && e.stack || e).split('\n').slice(0, 3).join('\n     ')); } }

const iso = d => d.toISOString().slice(0, 10);
const profile = () => ({ answers: { location: 'gym', goal: 'muscle', exp: 'some', intensity: 'hard' }, favs: [], custom: [], settings: {} });
const slot = (id, exId, r, sets) => ({ id, p: [D.byId[exId].pat], r, sets, rest: 120, rr: [8, 12], ex: { gym: exId }, why: {}, locked: { gym: true } });
const mkPlan = () => ({ id: 'p1', name: 'Test', place: 'gym', locs: ['gym'], goal: 'muscle', meso: { start: iso(new Date()), len: 6 },
  days: [{ id: 'd1', name: 'Tag A', focus: 'full', slots: [slot('s1', 'bench', 'main', 4), slot('s2', 'lat-pulldown', 'sec', 3), slot('s3', 'ohp', 'sec', 3), slot('s4', 'db-lateral', 'iso', 3), slot('s5', 'leg-press', 'main', 4)] }] });
const adj = (rd, o) => { const p = mkPlan(); return E.adjustDay(p.days[0], 'gym', profile(), p, rd, o); };
const by = (out, id) => out.slots.find(s => s.id === id);
E.setWorkouts(() => []);

t('Keine Daten: Plan bleibt', () => {
  const o = adj(null); assert.equal(o.any, false); assert.deepEqual(o.slots.map(s => s.sets), [4, 3, 3, 3, 4]);
  const o2 = adj({ checkin: false, color: 'none', sore: {}, pain: [] }); assert.equal(o2.any, false);
});
t('Muskelkater leicht: −1 Satz', () => {
  const o = adj({ checkin: true, color: 'green', sore: { ruecken: 1 }, pain: [] });
  assert.equal(by(o, 's2').sets, 2); assert.match(by(o, 's2')._adj[0], /−1 Satz: Muskelkater leicht/); assert.equal(by(o, 's1').sets, 4);
});
t('Muskelkater mittel: −1/−2 Sätze, Gewicht −10 %', () => {
  const o = adj({ checkin: true, color: 'green', sore: { brust: 2, vorn: 2 }, pain: [] });
  assert.equal(by(o, 's1').sets, 2, '4 Sätze → −2'); assert.equal(by(o, 's1')._loadF, 0.9); assert.equal(by(o, 's5').sets, 2);
});
t('Muskelkater stark: Übung ersetzt (andere Gruppe) oder gestrichen', () => {
  const o = adj({ checkin: true, color: 'green', sore: { ruecken: 3 }, pain: [] });
  const s = by(o, 's2'); if (s) { const ex = D.byId[s.ex.gym]; assert.ok(!ex.prim.some(m => ['lats', 'upperback'].includes(m)), ex.name); assert.equal(s._from, 'lat-pulldown'); }
  else assert.ok(o.removed.some(r => r.ex.id === 'lat-pulldown'));
});
t('Schmerz Schulter: keine Übung mit Schulterbelastung mehr', () => {
  const o = adj({ checkin: true, color: 'green', sore: {}, pain: [{ k: 'schulter', label: 'Schulter', inj: 'shoulder' }] });
  for (const s of o.slots) assert.ok(!(D.byId[s.ex.gym].inj || []).includes('shoulder'), D.byId[s.ex.gym].name);
  assert.ok(o.changes.some(c => /Schmerz Schulter/.test(c.text)));
});
t('Gestern Baseball: Drücken/Schulter −1, kein schweres Überkopf', () => {
  const o = adj({ checkin: true, color: 'green', sore: {}, pain: [], yesterdayBaseball: true });
  assert.ok(!o.slots.some(s => s.ex.gym === 'ohp'), 'Schulterdrücken weg');
  assert.equal(by(o, 's1').sets, 2, 'Bankdrücken 4 → 2'); assert.equal(by(o, 's5').sets, 4, 'Beine unverändert'); assert.equal(by(o, 's2').sets, 3, 'Ziehen unverändert');
});
t('Erholung rot: −30 % Volumen, keine Steigerung · gelb: nur keine Steigerung', () => {
  const o = adj({ checkin: false, color: 'red', recovery: 25, sore: {}, pain: [] });
  const tot = o.slots.reduce((a, s) => a + s.sets, 0); assert.equal(tot, Math.round(17 * 0.7)); assert.equal(o.noUp, true);
  const y = adj({ checkin: false, color: 'yellow', recovery: 50, sore: {}, pain: [] });
  assert.equal(y.slots.reduce((a, s) => a + s.sets, 0), 17); assert.equal(y.noUp, true);
});
t('Bestätigen: nur angenommene Änderungen', () => {
  const rd = { checkin: true, color: 'green', sore: { ruecken: 1, brust: 1 }, pain: [] };
  const all = adj(rd); assert.equal(all.changes.length, 2);
  const one = adj(rd, { only: new Set(['sore:s2']) }); assert.equal(by(one, 's1').sets, 4); assert.equal(by(one, 's2').sets, 2);
});

// ---------- Etappe A2: Progression, Volumen, Deload ----------
const daysAgo = k => iso(new Date(Date.now() - k * 864e5));
const H = (exId, w, reps, k, rir = 1) => ({ date: daysAgo(k), bw: 80, entry: { exId, rirT: 2, sets: [1, 2, 3].map(() => ({ w, reps, rir })) } });
t('Doppelprogression: Langhantel Oberkörper +2,5 kg, Wdh. unten', () => {
  const ex = D.byId['bench']; const presc = { sets: 3, rr: [6, 10], rir: 2, role: 'main' };
  const r = E.recommend(ex, presc, [], [H('bench', 60, 10, 10), H('bench', 60, 10, 3)], { profile: profile(), loc: 'gym' });
  assert.equal(r.w, 62.5); assert.equal(r.reps, 6); assert.deepEqual([r.up.from, r.up.to], [60, 62.5]);
});
t('Doppelprogression: Langhantel Unterkörper +5 kg', () => {
  const ex = D.byId['back-squat']; const presc = { sets: 3, rr: [6, 10], rir: 2, role: 'main' };
  const r = E.recommend(ex, presc, [], [H('back-squat', 80, 10, 10), H('back-squat', 80, 10, 3)], { profile: profile(), loc: 'gym' });
  assert.equal(r.w, 85); assert.equal(r.reps, 6);
});
t('Doppelprogression: nicht oben → gleiches Gewicht, +1 Wdh.', () => {
  const ex = D.byId['bench']; const presc = { sets: 3, rr: [6, 10], rir: 2, role: 'main' };
  const r = E.recommend(ex, presc, [], [H('bench', 60, 8, 10, 2), H('bench', 60, 8, 3, 2)], { profile: profile(), loc: 'gym' });
  assert.equal(r.w, 60); assert.equal(r.reps, 9); assert.ok(!r.up);
});
t('Erholung gelb: keine Steigerung · Muskelkater mittel: −10 %', () => {
  const ex = D.byId['bench']; const hist = [H('bench', 60, 10, 10), H('bench', 60, 10, 3)];
  const r = E.recommend(ex, { sets: 3, rr: [6, 10], rir: 2, role: 'main', noUp: 'yellow' }, [], hist, { profile: profile(), loc: 'gym' });
  assert.equal(r.w, 60);
  const r2 = E.recommend(ex, { sets: 3, rr: [6, 10], rir: 2, role: 'main', loadF: 0.9 }, [], [H('bench', 60, 8, 10, 2), H('bench', 60, 8, 3, 2)], { profile: profile(), loc: 'gym' });
  assert.ok(r2.w <= 54 && r2.w >= 50, 'gerundet auf die Stufe darunter: ' + r2.w);
});
t('Stillstand: 3 Einheiten ohne neuen Bestwert', () => {
  const ex = D.byId['bench'];
  assert.equal(E.stalled(ex, [H('bench', 60, 8, 30), H('bench', 60, 8, 20), H('bench', 60, 7, 10), H('bench', 60, 8, 3)], 80), true);
  assert.equal(E.stalled(ex, [H('bench', 60, 8, 30), H('bench', 60, 8, 20), H('bench', 60, 9, 10), H('bench', 60, 8, 3)], 80), false);
  assert.equal(E.stalled(ex, [H('bench', 60, 8, 20), H('bench', 60, 8, 3)], 80), false, 'zu wenig Verlauf');
});
t('Leichtere Woche: −40 % Sätze, Reserve 3; Start erst ab deloadFrom', () => {
  const p = mkPlan(); p.deloadUntil = daysAgo(-7); const ex = D.byId['bench'];
  const pr = E.prescription(p.days[0].slots[0], ex, profile(), p); assert.equal(pr.sets, Math.round(4 * 0.6)); assert.equal(pr.rir, 3); assert.equal(pr.deload, true);
  p.deloadFrom = daysAgo(-3); assert.equal(E.prescription(p.days[0].slots[0], ex, profile(), p).deload, false);
});
t('Sätze je Muskel: +1 bei 2 guten Wochen und steigender Leistung, −1 bei oft gelb/rot, Grenzen 10–20', () => {
  const p = mkPlan(); p.learn = { T: { chest: 12, lats: 20, upperback: 10 } };
  const ws = [0, 7, 14, 21].map((k, i) => ({ date: daysAgo(k + 1), loc: 'gym', bw: 80, exercises: [{ exId: 'bench', sets: [{ w: 60 + (3 - i) * 2.5, reps: 8, rir: 1 }] }, { exId: 'lat-pulldown', sets: [{ w: 50 + (3 - i) * 2.5, reps: 10, rir: 1 }] }] })).reverse();
  const good = { weeks: [{ good: true, bad: 0 }, { good: true, bad: 1 }] };
  const r = E.learnVolume(p, profile(), { workouts: ws, fw: good });
  assert.equal(r.T.chest, 13); assert.equal(r.T.lats, 20, 'Deckel 20');
  const bad = E.learnVolume(p, profile(), { workouts: ws, fw: { weeks: [{ good: false, bad: 5 }, { good: true, bad: 0 }] } });
  assert.equal(bad.T.chest, 11); assert.equal(bad.T.upperback, 10, 'Untergrenze 10');
  const none = E.learnVolume(p, profile(), { workouts: ws, fw: null }); assert.equal(none.T.chest, 12);
});

console.log(`\n${n - fails}/${n} Tests bestanden`);
if (fails) process.exit(1);
