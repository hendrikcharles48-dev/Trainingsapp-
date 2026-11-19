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

console.log(`\n${n - fails}/${n} Tests bestanden`);
if (fails) process.exit(1);
