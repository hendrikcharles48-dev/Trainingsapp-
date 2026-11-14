// Tests: node test/model.test.js  (ohne Abhängigkeiten)
import assert from 'node:assert/strict';
import { recovery, zToScore, dayLoad, muscleFatigue, recommend, buildSummary, addDays, effort, loadScore } from '../src/model.js';
import { mergeDays, activityFrom } from '../src/normalize.js';
import worker, { FormwerkStore } from '../src/index.js';
import { FakeStorage, installFakeGarmin, counter } from './fakes.js';

let fails = 0, n = 0;
async function t(name, fn) { n++; try { await fn(); console.log('ok  ', name); } catch (e) { fails++; console.log('FAIL', name, '\n    ', e && e.stack || e); } }

const today = '2026-11-14';
function synthDays(nDays, f) {
  const days = {};
  for (let k = 0; k < nDays; k++) { const d = addDays(today, -k); days[d] = Object.assign({ date: d, hrv: 55 + (k % 5) - 2, rhr: 52 + (k % 3) - 1, sleep: { total: 7.6 * 3600, deep: 1.3 * 3600, rem: 1.7 * 3600, light: 4.6 * 3600, awake: 0.3 * 3600, score: 78 } }, f ? f(k, d) : {}); }
  return days;
}

await t('z → Punkte: Basis 71, −1 SD 43, −2 SD 18', () => {
  assert.equal(Math.round(zToScore(0)), 71); assert.equal(Math.round(zToScore(-1)), 43); assert.equal(Math.round(zToScore(-2)), 18);
});
await t('Erholung: normaler Tag grün/knapp, Werte transparent', () => {
  const r = recovery(synthDays(40), today);
  assert.ok(r.score >= 55 && r.score <= 85, 'score ' + r.score);
  assert.equal(r.parts.length, 3); assert.equal(r.building, false); assert.ok(r.why.length === 3);
});
await t('Erholung: niedrige HRV + hoher Ruhepuls → rot', () => {
  const days = synthDays(40); days[today].hrv = 38; days[today].rhr = 60; days[today].sleep.total = 5 * 3600;
  const r = recovery(days, today);
  assert.equal(r.color, 'red', 'score ' + r.score);
  assert.match(r.why[0].text, /unter deiner Basis|Schläge über/);
});
await t('Erholung: Basis im Aufbau bei < 5 Nächten', () => {
  const r = recovery(synthDays(3), today); assert.equal(r.building, true); assert.equal(r.score, null);
});
await t('Erholung: Body Battery fließt nicht ein', () => {
  const a = synthDays(40), b = synthDays(40); b[today].bbHigh = 5; a[today].bbHigh = 100;
  assert.equal(recovery(a, today).score, recovery(b, today).score);
});
await t('Belastung: Zonen-TRIMP und Skala', () => {
  const L = dayLoad({ steps: 3000 }, [{ id: 1, dur: 3600, zones: [600, 1200, 1200, 600, 0] }], { rest: 50, max: 190 });
  assert.equal(L.trimp, 10 + 40 + 60 + 40); assert.equal(L.score, loadScore(150));
  assert.ok(L.score > 40 && L.score < 60);
});
await t('Belastung: ohne Zonen Banister-TRIMP', () => {
  const L = dayLoad({}, [{ id: 1, dur: 5400, avgHr: 120 }], { rest: 55, max: 190 });
  assert.ok(L.trimp > 50 && L.trimp < 200, 'trimp ' + L.trimp);
});
await t('Muskeln: 5 harte Beinsätze → Beine vorn müde, nach 3 Tagen erholt', () => {
  const now = Date.parse('2026-11-14T08:00:00Z');
  const s = [{ id: 'a', date: '2026-11-13', end: now - 14 * 3600e3, exercises: [{ muscles: { primary: ['quads', 'glutes'], secondary: ['hams'] }, sets: Array(5).fill({ reps: 8, rir: 1 }) }] }];
  const m = muscleFatigue(s, [], now);
  assert.equal(m.find(x => x.k === 'vorn').status, 'tired');
  assert.equal(m.find(x => x.k === 'brust').status, 'fresh');
  const later = muscleFatigue(s, [], now + 72 * 3600e3);
  assert.equal(later.find(x => x.k === 'vorn').status, 'fresh');
});
await t('Muskeln: Baseball belastet Schultern/Rumpf', () => {
  const now = Date.parse('2026-11-14T08:00:00Z');
  const m = muscleFatigue([], [{ type: 'baseball', dur: 7200, trimp: 250, ts: now - 12 * 3600e3 }], now);
  assert.ok(m.find(x => x.k === 'rumpf').pct > 0 && m.find(x => x.k === 'schultern').pct > 0);
});
await t('Reserve → Anstrengung', () => { assert.equal(effort(0), 1); assert.equal(effort(2), 0.85); assert.equal(effort(null), 0.8); });
const fresh = ['brust', 'ruecken', 'schultern', 'bizeps', 'trizeps', 'griff', 'rumpf', 'vorn', 'hinten', 'waden'].map(k => ({ k, label: k, status: 'fresh' }));
await t('Empfehlung: grün an Samstag → Kraft voll', () => {
  const r = recommend({ date: '2026-11-14', rec: { color: 'green', hasData: true }, muscles: fresh, sessions: [], ratio: null, sleepPart: { ofNeed: 100 }, now: Date.now() });
  assert.equal(r.level, 'full'); assert.equal(r.title, 'Kraft voll');
});
await t('Empfehlung: grün an Baseball-Dienstag → höchstens leicht', () => {
  const r = recommend({ date: '2026-11-10', rec: { color: 'green', hasData: true }, muscles: fresh, sessions: [], ratio: null, sleepPart: { ofNeed: 100 }, now: Date.now() });
  assert.equal(r.level, 'light'); assert.ok(r.sportToday); assert.ok(!r.good.includes('vorn'));
});
await t('Empfehlung: rot → Pause; Training heute → erledigt', () => {
  assert.equal(recommend({ date: today, rec: { color: 'red', hasData: true }, muscles: fresh, sessions: [], now: Date.now() }).level, 'rest');
  assert.equal(recommend({ date: today, rec: { color: 'green', hasData: true }, muscles: fresh, sessions: [{ date: today, end: Date.now() }], now: Date.now() }).level, 'done');
});
await t('Zusammenfassung baut 90 Tage Verlauf', () => {
  const s = buildSummary({ days: synthDays(120), actsByDate: {}, sessions: [], settings: {}, today, now: Date.parse(today + 'T07:00:00Z') });
  assert.equal(s.history.length, 90); assert.ok(s.recovery.score != null); assert.ok(s.sleep.has);
});
await t('Normalisieren: bekannte Garmin-Formen', () => {
  const d = mergeDays({
    hrv: [{ hrvSummaries: [{ calendarDate: '2026-11-13', lastNightAvg: 61, weeklyAvg: 58, status: 'BALANCED', baseline: { balancedLow: 50, balancedUpper: 66 } }] }],
    sleep: [{ dailySleepDTO: { calendarDate: '2026-11-13', sleepTimeSeconds: 27000, deepSleepSeconds: 5000, remSleepSeconds: 6000, lightSleepSeconds: 15000, awakeSleepSeconds: 900, sleepScores: { overall: { value: 81 } } }, restingHeartRate: 50 }],
    daily: [{ data: [{ calendarDate: '2026-11-13', restingHeartRate: 49, totalSteps: 9000, averageStressLevel: 28 }] }],
    bb: [[{ date: '2026-11-13', charged: 60, drained: 55, bodyBatteryValuesArray: [[1, 30], [2, 90], [3, 25]] }]]
  });
  const x = d['2026-11-13'];
  assert.equal(x.hrv, 61); assert.equal(x.rhr, 49); assert.equal(x.sleep.total, 27000); assert.equal(x.sleep.score, 81); assert.equal(x.bbHigh, 90); assert.equal(x.steps, 9000);
  const a = activityFrom({ activityId: 5, activityName: 'Baseball', activityType: { typeKey: 'baseball' }, startTimeLocal: '2026-11-12 18:30:00', duration: 7200, averageHR: 118, hrTimeInZone_1: 1000, hrTimeInZone_2: 2000 });
  assert.equal(a.date, '2026-11-12'); assert.equal(a.type, 'baseball'); assert.deepEqual(a.zones, [1000, 2000, 0, 0, 0]);
});

/* ---------- Worker komplett mit nachgebauten Garmin-Antworten ---------- */
installFakeGarmin();
const storage = new FakeStorage();
const doObj = new FormwerkStore({ storage }, { GARMIN_API_KEY: 'k', TZ: 'Europe/Berlin' });
const env = { APP_PASSWORD: 'geheim', ALLOWED_ORIGIN: 'https://hendrikcharles48-dev.github.io', STORE: { idFromName: () => 1, get: () => ({ fetch: r => doObj.fetch(r) }) } };
const call = (path, opt = {}) => worker.fetch(new Request('https://w.example' + path, Object.assign({ headers: { Authorization: 'Bearer geheim', Origin: 'https://hendrikcharles48-dev.github.io' } }, opt)), env);

await t('Worker: ohne Passwort 401, falsches Origin ohne CORS', async () => {
  const r = await worker.fetch(new Request('https://w.example/v1/ping', { headers: { Origin: 'https://evil.example' } }), env);
  assert.equal(r.status, 401); assert.equal(r.headers.get('Access-Control-Allow-Origin'), null);
});
await t('Worker: Testseite ohne Passwort erreichbar', async () => { const r = await worker.fetch(new Request('https://w.example/'), env); assert.equal(r.status, 200); assert.match(await r.text(), /Garmin-Test/); });
await t('Worker: Zusammenfassung lädt Verlauf und rechnet', async () => {
  const r = await call('/v1/summary'); assert.equal(r.status, 200);
  assert.equal(r.headers.get('Access-Control-Allow-Origin'), 'https://hendrikcharles48-dev.github.io');
  const j = await r.json();
  assert.equal(j.status.error, null, j.status.error); assert.ok(j.status.backfilled);
  assert.ok(j.recovery.score != null, 'Erholung ' + JSON.stringify(j.recovery));
  assert.ok(counter.calls < 50, 'Garmin-Abrufe ' + counter.calls);
  assert.equal(j.history.length, 90); assert.ok(j.load.activities.length === 1);
});
await t('Worker: zweiter Abruf nutzt Cache', async () => { const before = counter.calls; await call('/v1/today'); assert.equal(counter.calls, before); });
await t('Worker: Satzwerk-Einheit landet bei den Muskeln', async () => {
  const d = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(Date.now());
  const s = { id: 'w1', date: d, start: Date.now() - 3600e3, end: Date.now() - 60e3, name: 'Ganzkörper', sig: 'abc', exercises: [{ id: 'pullup', name: 'Klimmzüge', muscles: { primary: ['lats', 'biceps'], secondary: ['upperback', 'xxx'] }, sets: [{ reps: 8, rir: 1 }, { reps: 7, rir: 1 }, { reps: 6, rir: 0 }, { reps: 6, rir: 0 }] }] };
  const r = await call('/v1/sessions', { method: 'POST', body: JSON.stringify({ sessions: [s] }) });
  const j = await r.json(); assert.equal(j.stored, 1); assert.equal(j.have.w1, 'abc');
  const sum = await (await call('/v1/summary')).json();
  assert.notEqual(sum.muscles.find(m => m.k === 'ruecken').status, 'fresh');
  assert.equal(sum.recommendation.level, 'done');
  const t2 = await (await call('/v1/today')).json(); assert.equal(t2.recommendation.level, 'done');
  const del = await (await call('/v1/sessions', { method: 'POST', body: JSON.stringify({ deleted: ['w1'] }) })).json(); assert.equal(del.have.w1, undefined);
});
await t('Worker: Rohdaten-Test', async () => { const j = await (await call('/v1/raw?days=7')).json(); assert.ok(Object.keys(j.parsed).length >= 7); assert.ok(j.calls['HRV Zeitraum'].ok); });
await t('Worker: Einstellungen', async () => { const j = await (await call('/v1/settings', { method: 'PUT', body: JSON.stringify({ sportDays: [1, 3, 9], strengthPerWeek: 3 }) })).json(); assert.deepEqual(j.sportDays, [1, 3]); assert.equal(j.strengthPerWeek, 3); });

console.log(`\n${n - fails}/${n} Tests bestanden`);
if (fails) process.exit(1);
