// Tests: node test/model.test.js  (ohne Abhängigkeiten)
import assert from 'node:assert/strict';
import { recovery, zToScore, dayLoad, muscleFatigue, recommend, buildSummary, addDays, effort, loadScore, calibrate, baseballDay, withCheckinBaseball, physio, weekday, prefillFor, recoveryCore, sleepView, applyLife, baselines, detectBaseball, volumeSignals, readinessFor, soreCat } from '../src/model.js';
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
  const r = recommend({ date: '2026-11-10', rec: { color: 'green', hasData: true }, muscles: fresh, sessions: [], ratio: null, sleepPart: { ofNeed: 100 }, settings: { sportDays: [1, 3] }, now: Date.now() });
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

await t('Lernen: wer länger Muskelkater hat, bekommt einen höheren Faktor', () => {
  const today = '2026-11-14'; const sessions = [], checkins = [];
  for (let w = 0; w < 8; w++) {
    const d = addDays(today, -7 * w - 3);
    sessions.push({ id: 's' + w, date: d, end: Date.parse(d + 'T18:00:00Z'), exercises: [{ muscles: { primary: ['quads'], secondary: [] }, sets: Array(3).fill({ rir: 1 }) }] });
    checkins.push({ date: addDays(d, 2), sore: { vorn: 2 } }); // zwei Tage später noch starker Muskelkater
  }
  const c = calibrate({ sessions, allActs: {}, checkins, today, hr: { rest: 50, max: 190 } });
  assert.ok(c.groups.vorn.s > 1.2, 'Faktor ' + JSON.stringify(c.groups.vorn));
  const base = muscleFatigue(sessions.slice(0, 1), [], Date.parse(addDays(today, -1) + 'T08:00:00Z'));
  const cal = muscleFatigue(sessions.slice(0, 1), [], Date.parse(addDays(today, -1) + 'T08:00:00Z'), c.groups);
  assert.ok(cal.find(m => m.k === 'vorn').pct > base.find(m => m.k === 'vorn').pct);
});

await t('Baseball: feste Zeiten zählen automatisch, abwählbar, sonst antippen', () => {
  const S = { sportDays: [0], sportTimes: { 0: { from: '19:00', dur: 90, since: '2026-11-01' } } }; // 0 = Montag
  const mo = '2026-11-09', di = '2026-11-10', moAlt = '2026-10-26';
  assert.equal(baseballDay({}, S, mo, {}).on, true);
  assert.equal(baseballDay({}, S, moAlt, {}).on, false, 'vor „since“ nicht rückwirkend');
  assert.equal(baseballDay({ [mo]: { bbToday: false } }, S, mo, {}).on, false, 'heute abgewählt');
  assert.equal(baseballDay({ [di]: { bb: false } }, S, mo, {}).on, false, 'am Morgen danach abgewählt');
  assert.equal(baseballDay({ [di]: { bbToday: true } }, S, di, {}).on, true, 'Dienstag angetippt');
  assert.equal(baseballDay({}, S, di, {}).on, false);
  const acts = withCheckinBaseball({}, {}, null, 0, S, '2026-11-15', 20);
  assert.equal(acts[mo][0].time, '19:00'); assert.equal(acts[mo][0].dur, 5400); assert.ok(!acts[di]);
});

await t('Signale: Stresszeichen und leichtere Woche', () => {
  const days = synthDays(45, (k) => ({ sleep: { total: 7.5 * 3600, resp: 14 + (k % 3) * 0.2, spo2: 95 } }));
  let sig = physio(days, today, [], {});
  assert.equal(sig.stress.flag, false); assert.equal(sig.deload.suggest, false);
  days[today].sleep.resp = 17.5; days[today].rhr = 58;
  sig = physio(days, today, [], {});
  assert.equal(sig.stress.flag, true, JSON.stringify(sig.stress)); assert.ok(sig.stress.reasons.length >= 2);
  const d2 = synthDays(45); for (let k = 0; k < 7; k++) { d2[addDays(today, -k)].hrv = 40; d2[addDays(today, -k)].rhr = 57; }
  sig = physio(d2, today, [], {});
  assert.equal(sig.deload.suggest, true, JSON.stringify(sig.deload));
  const r = buildSummary({ days, actsByDate: {}, sessions: [], settings: {}, today, now: Date.parse(today + 'T07:00:00Z') });
  assert.equal(r.recommendation.title, 'Locker bleiben'); assert.equal(r.prefill.tf.en, 0);
});
await t('Vorschläge: Tagesform und Wochen-Check-in aus Formwerk', () => {
  const days = synthDays(45);
  const ckBy = {}; for (let i = 0; i < 4; i++) ckBy[addDays(today, -i)] = { date: addDays(today, -i), sore: i === 1 ? { vorn: 2 } : {}, pain: {} };
  const s = buildSummary({ days, actsByDate: { [addDays(today, -2)]: [{ id: 1, type: 'baseball', dur: 7200, time: '18:00' }] }, sessions: [], settings: {}, today, now: Date.parse(today + 'T07:00:00Z'), checkins: Object.values(ckBy) });
  assert.ok([1, 2].includes(s.prefill.tf.en)); assert.ok([1, 2].includes(s.prefill.tf.sl));
  const w = s.prefill.week.ans; assert.equal(w.sore, 3); assert.equal(w.pain, 0); assert.equal(w.sport, 1); assert.ok(w.exh >= 1 && w.exh <= 5); assert.ok(w.sleep >= 1);
  assert.ok(Array.isArray(s.body.insights.strengthDays.idx));
});

await t('Skala 1–5: alte Check-ins werden umgerechnet', async () => {
  const { normCheckin } = await import('../src/model.js');
  const c = normCheckin({ date: '2026-11-01', sore: { vorn: 2, brust: 1 }, pain: { knie: 3 } });
  assert.deepEqual(c.sore, { vorn: 4, brust: 2 }); assert.deepEqual(c.pain, { knie: 4 }); assert.equal(c.v, 5);
  assert.deepEqual(normCheckin({ date: 'x', v: 5, sore: { vorn: 2 } }).sore, { vorn: 2 });
});

await t('Nacht ohne Messung: geschätzt statt Tages-Ruhepuls, eigene Schlafangabe zählt', () => {
  const days = synthDays(40);
  delete days[today].hrv; delete days[today].sleep; days[today].rhr = 60; days[today].syncedUntil = today + 'T12:15:00.0'; days[today].noMeasureMin = 420;
  assert.equal(recoveryCore(days, today).score, null, 'Tages-Ruhepuls zählt nicht');
  const prev = recoveryCore(days, addDays(today, -1)).score;
  let s = buildSummary({ days, actsByDate: {}, sessions: [], settings: {}, today, now: Date.parse(today + 'T12:00:00Z') });
  assert.equal(s.recovery.estimated, true); assert.ok(Math.abs(s.recovery.score - prev) <= 12, s.recovery.score + ' vs ' + prev);
  assert.equal(s.vitals.rhrDay, true); assert.ok(s.recommendation.notes.some(n => /geschätzt/.test(n)));
  s = buildSummary({ days, actsByDate: {}, sessions: [], settings: {}, today, now: Date.parse(today + 'T12:00:00Z'), checkins: [{ date: today, v: 5, sore: {}, pain: {}, sleepEst: { h: 5, q: 0 }, partial: true }] });
  assert.ok(s.recovery.score < prev, 'kurze schlechte Nacht senkt die Schätzung'); assert.equal(s.prefill.tf.sl, 0);
  // noch nicht synchronisiert → keine Schätzung, sondern „noch keine Werte“
  delete days[today].syncedUntil;
  s = buildSummary({ days, actsByDate: {}, sessions: [], settings: {}, today, now: Date.parse(today + 'T06:00:00Z') });
  assert.equal(s.recovery.score, null); assert.ok(!s.recovery.estimated);
});

await t('Teilnacht: zu kurzer Schlaf mit Messlücke zählt nicht, eigene Angabe schon', () => {
  const days = synthDays(40); days[today].sleep = Object.assign({}, days[today].sleep, { total: 3.5 * 3600 }); days[today].noMeasureMin = 240; days[today].syncedUntil = today + 'T09:00:00.0';
  assert.equal(sleepView(days, today).reason, 'partial');
  const full = buildSummary({ days, actsByDate: {}, sessions: [], settings: {}, today, now: Date.parse(today + 'T09:00:00Z') });
  assert.ok(full.recovery.partialNight); assert.ok(!full.recovery.parts.some(p => p.k === 'sleep' && !p.est));
  const short = recoveryCore(days, today).score; assert.ok(full.recovery.score > short, 'ohne Strafe für Messlücke höher: ' + full.recovery.score + ' > ' + short);
  const withEst = buildSummary({ days, actsByDate: {}, sessions: [], settings: {}, today, now: Date.parse(today + 'T09:00:00Z'), checkins: [{ date: today, v: 5, sore: {}, pain: {}, sleepEst: { h: 8, q: 2 }, partial: true }] });
  assert.ok(withEst.recovery.parts.some(p => p.est));
});
await t('Krank: Pause, Tag zählt nicht zur Basis', () => {
  const days = synthDays(40); const sickDay = addDays(today, -3); days[sickDay].hrv = 45; days[sickDay].rhr = 55;
  const s = buildSummary({ days, actsByDate: {}, sessions: [], settings: {}, today, now: Date.parse(today + 'T08:00:00Z'), checkins: [{ date: sickDay, v: 5, sore: {}, pain: {}, sick: true }, { date: today, v: 5, sore: {}, pain: {}, sick: true }] });
  assert.equal(s.recommendation.title, 'Krank – Pause'); assert.equal(s.prefill.tf.en, 0);
  const marked = Object.assign({}, days, { [sickDay]: Object.assign({}, days[sickDay], { sick: true }) });
  assert.ok(baselines(marked, today).rhr < baselines(days, today).rhr, 'kranker Tag hebt die Ruhepuls-Basis nicht mehr');
});
await t('Wiedereinstieg nach ≥ 10 Tagen ohne Kraft, Uhr-Krafttraining zählt', () => {
  const old = [{ id: 'a', date: addDays(today, -14), end: Date.parse(addDays(today, -14) + 'T18:00:00Z'), exercises: [] }];
  const r = applyLife({ level: 'full', title: 'Kraft voll', text: '', notes: [], good: [] }, { today, ck: null, allStrength: old, watchStrength: [], rec: {} });
  assert.equal(r.title, 'Wiedereinstieg'); assert.equal(r.level, 'light');
  const days = synthDays(40);
  const s = buildSummary({ days, actsByDate: { [addDays(today, -1)]: [{ id: 7, type: 'strength_training', name: 'Krafttraining', dur: 3600, time: '18:00' }] }, sessions: old, settings: {}, today, now: Date.parse(today + 'T08:00:00Z') });
  assert.notEqual(s.recommendation.title, 'Wiedereinstieg', 'Uhr-Kraft gestern beendet die Pause');
  assert.ok(s.recommendation.notes.some(n => /ohne Satzwerk/.test(n)));
  assert.notEqual(s.muscles.find(m => m.k === 'vorn').status, 'fresh');
  // dieselbe Einheit auch in Satzwerk → nicht doppelt
  const both = buildSummary({ days, actsByDate: { [addDays(today, -1)]: [{ id: 7, type: 'strength_training', dur: 3600, time: '18:00' }] }, sessions: old.concat([{ id: 'b', date: addDays(today, -1), end: Date.parse(addDays(today, -1) + 'T19:00:00Z'), exercises: [] }]), settings: {}, today, now: Date.parse(today + 'T08:00:00Z') });
  assert.ok(!both.recommendation.notes.some(n => /ohne Satzwerk/.test(n)));
});
await t('Baseball: Rückfrage am Morgen nach festem Termin ohne Uhr', () => {
  const S = { sportDays: [weekday(addDays(today, -1))], sportTimes: { [weekday(addDays(today, -1))]: { from: '18:00', dur: 120, since: '2026-01-01' } } };
  const s = buildSummary({ days: synthDays(40), actsByDate: {}, sessions: [], settings: S, today, now: Date.parse(today + 'T08:00:00Z') });
  assert.equal(s.body.askBaseball.from, '18:00');
  const s2 = buildSummary({ days: synthDays(40), actsByDate: {}, sessions: [], settings: S, today, now: Date.parse(today + 'T08:00:00Z'), checkins: [{ date: today, v: 5, sore: {}, pain: {}, bb: false, partial: true }] });
  assert.equal(s2.body.askBaseball, false);
});

await t('Baseball am Puls erkennen', () => {
  const start = Date.parse('2026-11-10T17:00:00Z'), end = start + 2 * 3600e3;
  const mk = f => ({ heartRateValues: Array.from({ length: 24 * 30 }, (_, i) => { const ts = Date.parse('2026-11-10T00:00:00Z') + i * 120e3; return [ts, f(ts)]; }) });
  assert.equal(detectBaseball(mk(ts => (ts >= start && ts <= end ? (ts % 600e3 < 240e3 ? 125 : 98) : 62)), start, end, 53).v, true);
  assert.equal(detectBaseball(mk(() => 64), start, end, 53).v, false);
  // normaler Tag (echte Werte 16.11.: Schnitt +21…+29, ≤ 13 % über +40) darf nie „warst da“ sein
  assert.notEqual(detectBaseball(mk(ts => (ts >= start && ts <= end ? (ts % 600e3 < 80e3 ? 93 : 76) : 62)), start, end, 51).v, true);
  // gelernt: dein Baseball-Puls liegt bei Schnitt 88 → ähnlicher Abend wird erkannt
  assert.equal(detectBaseball(mk(ts => (ts >= start && ts <= end ? 86 : 62)), start, end, 51, { minMean: 88 }).v, true);
  assert.equal(detectBaseball(mk(ts => (ts >= start && ts <= end ? null : 62)), start, end, 53).v, null, 'nicht getragen → unbekannt');
  // Erkennung schlägt den festen Termin, deine Antwort schlägt die Erkennung
  const S = { sportDays: [1], sportTimes: { 1: { from: '18:00', dur: 120, since: '2026-01-01' } }, autoBB: { '2026-11-10': false } };
  assert.equal(baseballDay({}, S, '2026-11-10', {}).on, false);
  assert.equal(baseballDay({ '2026-11-11': { bb: true } }, S, '2026-11-10', {}).on, true);
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
await t('Worker: Tageswerte v2 (verschachtelt) werden gelesen', async () => {
  const j = await (await call('/v1/summary')).json();
  assert.ok(j.vitals.rhr >= 51 && j.vitals.rhr <= 53, 'Ruhepuls ' + j.vitals.rhr);
  assert.equal(j.vitals.steps, 8000); assert.equal(j.vitals.stress, 30); assert.equal(j.bodyBattery.high, 90);
  assert.ok(j.recovery.parts.some(p => p.k === 'rhr'), 'Ruhepuls fließt ein');
  assert.equal(j.sleep.score, 72);
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
await t('Worker: Gewicht – Garmin, von Hand, Übernahme nur ergänzend', async () => {
  const d = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(Date.now());
  let j = await (await call('/v1/summary')).json();
  assert.equal(j.weight.latest.kg, 90.5); assert.equal(j.weight.latest.src, 'garmin');
  await call('/v1/weight', { method: 'POST', body: JSON.stringify({ date: d, kg: 91.2 }) });
  await call('/v1/weight', { method: 'POST', body: JSON.stringify({ entries: [{ date: d, kg: 80, ifMissing: true, src: 'satzwerk' }, { date: '2026-10-01', kg: 93, ifMissing: true, src: 'satzwerk' }] }) });
  j = await (await call('/v1/summary')).json();
  assert.equal(j.weight.latest.kg, 91.2, 'von Hand gewinnt, Übernahme überschreibt nicht');
  assert.ok(j.weight.series.some(x => x.date === '2026-10-01' && x.kg === 93));
  const t2 = await (await call('/v1/today')).json(); assert.equal(t2.weight.kg, 91.2);
  const bad = await (await call('/v1/weight', { method: 'POST', body: JSON.stringify({ date: d, kg: 5 }) })).json(); assert.equal(bad.stored, 0);
});
await t('Worker: Satzwerk-Sicherung speichern und laden (große Datei, vorige bleibt)', async () => {
  const big = JSON.stringify({ app: 'satzwerk', version: 2, workouts: Array.from({ length: 3000 }, (_, i) => ({ id: 'w' + i, name: 'x'.repeat(60) })) });
  assert.ok(big.length > 200000);
  const r = await (await call('/v1/backup/satzwerk', { method: 'PUT', body: big })).json(); assert.ok(r.ok);
  const back = await (await call('/v1/backup/satzwerk')).text(); assert.equal(back, big);
  const small = JSON.stringify({ app: 'satzwerk', version: 2, workouts: [] });
  await call('/v1/backup/satzwerk', { method: 'PUT', body: small });
  assert.equal(await (await call('/v1/backup/satzwerk')).text(), small);
  const wrong = await (await call('/v1/backup/satzwerk', { method: 'PUT', body: '{"app":"kochwerk"}' })).json(); assert.equal(wrong.ok, false);
});
await t('Worker: Wochenbericht ablegen und lesen, vorige Fassung bleibt', async () => {
  assert.equal((await (await call('/v1/coach')).json()).coach, null);
  const put = b => call('/v1/coach', { method: 'PUT', body: JSON.stringify(b) }).then(r => r.json());
  assert.equal((await put({ v: 1, id: '2026-W46', title: 'A', summary: 's', points: [], actions: [] })).ok, true);
  assert.equal((await put({ v: 2, id: 'x', title: 'B' })).ok, false);
  assert.equal((await put({ v: 1, id: '2026-W47', title: 'B', summary: 's', points: [], actions: [] })).ok, true);
  const g = await (await call('/v1/coach')).json(); assert.equal(g.coach.id, '2026-W47'); assert.equal(g.prev.id, '2026-W46');
  assert.equal((await worker.fetch(new Request('https://w.example/v1/coach'), env)).status, 401);
});
await t('Körpergefühl: Muskelkater/Schmerz heute, Pause bei starkem Schmerz, Hinweis bei anhaltendem Schmerz', async () => {
  const d = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(Date.now());
  for (let i = 3; i >= 1; i--) await call('/v1/checkin', { method: 'POST', body: JSON.stringify({ date: addDays(d, -i), pain: { schulter: 2 } }) });
  const r = await (await call('/v1/checkin', { method: 'POST', body: JSON.stringify({ date: d, sore: { vorn: 5, xyz: 2 }, pain: { schulter: 3 }, bb: true }) })).json();
  assert.deepEqual(r.checkin.sore, { vorn: 5 });
  let j = await (await call('/v1/summary')).json();
  assert.equal(j.muscles.find(m => m.k === 'vorn').status, 'tired');
  assert.equal(j.muscles.find(m => m.k === 'schultern').pain, 3);
  assert.ok(!j.recommendation.good.includes('Schultern'));
  assert.ok(j.recommendation.notes.some(n => /abklären/.test(n)), 'Hinweis abklären');
  assert.ok(j.body.insights.items.some(x => x.kind === 'pain' && x.k === 'schulter'));
  assert.equal(j.body.insights.strengthDays.days.length, 2);
  const t2 = await (await call('/v1/today')).json(); assert.equal(t2.pain[0].inj, 'shoulder'); assert.equal(t2.checkin, true);
  await call('/v1/checkin', { method: 'POST', body: JSON.stringify({ date: d, pain: { knie: 5 } }) });
  j = await (await call('/v1/summary')).json(); assert.equal(j.recommendation.level, j.recommendation.level === 'done' ? 'done' : 'rest');
  await call('/v1/checkin', { method: 'POST', body: JSON.stringify({ date: d, sore: { schultern: 2 } }) }); // Baseball wirkt nur mit eingetragenem Muskelkater/Schmerz
  const y = addDays(d, 5); // Baseball-Frage allein zählt nicht als Check
  await call('/v1/checkin', { method: 'POST', body: JSON.stringify({ date: d, bbOnly: true, bbToday: true }) });
  let jj = await (await call('/v1/summary')).json(); assert.ok(jj.recommendation.sportToday, 'Heute Baseball wirkt'); assert.ok(jj.recommendation.level !== 'full');
  await call('/v1/checkin', { method: 'POST', body: JSON.stringify({ date: d, bbOnly: true, bbToday: false }) });
  jj = await (await call('/v1/summary')).json(); assert.ok(jj.body.baseball.today.recorded ? jj.recommendation.sportToday : !jj.recommendation.sportToday, 'Uhr-Aktivität zählt immer, sonst abgewählt');
  const o = await (await call('/v1/checkin', { method: 'POST', body: JSON.stringify({ date: addDays(d, -10), bbOnly: true, bb: true }) })).json(); assert.equal(o.checkin.partial, true);
});
await t('Worker: Rohdaten-Test', async () => { const j = await (await call('/v1/raw?days=7')).json(); assert.ok(Object.keys(j.parsed).length >= 7); assert.ok(j.calls['HRV Zeitraum'].ok); });
await t('Worker: Einstellungen', async () => { const j = await (await call('/v1/settings', { method: 'PUT', body: JSON.stringify({ sportDays: [1, 3, 9], strengthPerWeek: 3 }) })).json(); assert.deepEqual(j.sportDays, [1, 3]); assert.equal(j.strengthPerWeek, 3); });

await t('Volumen-Signale: Muskelkater nach Einheiten, Erholung', () => {
  const today = '2026-11-20';
  const sessions = [{ date: '2026-11-17', exercises: [{ muscles: { primary: ['chest'] } }, { muscles: { primary: ['lats'] } }] }, { date: '2026-11-10', exercises: [{ muscles: { primary: ['chest'] } }] }];
  const checkins = [{ date: '2026-11-18', sore: { brust: 2, ruecken: 3 }, pain: {} }, { date: '2026-11-19', sore: { brust: 4 }, pain: { schulter: 2 } }, { date: '2026-11-11', sore: {}, pain: {} }];
  const history = [{ date: '2026-11-19', rec: 40 }, { date: '2026-11-18', rec: 60 }, { date: '2026-10-01', rec: 90 }];
  const v = volumeSignals({ checkins, sessions, history, today });
  assert.equal(v.sore.brust, 2, 'Brust: (4 + 0) / 2'); assert.equal(v.sore.ruecken, 3); assert.equal(v.soreN.brust, 2);
  assert.equal(v.rec7, 50); assert.equal(v.pain.schulter, 2);
  assert.equal(v.weeks.length, 2); assert.equal(v.weeks[0].bad, 2); assert.equal(v.weeks[0].good, false);
});

await t('Readiness: Stufen, Schmerz ja/nein, gestern Baseball', () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5].map(soreCat), [0, 1, 1, 2, 3, 3]);
  const d = '2026-11-19', y = '2026-11-18';
  const ckBy = { [d]: { date: d, v: 5, sore: { brust: 2, ruecken: 5, bizeps: 3 }, pain: { ellbogen: 3, sonstiges: 3 } } };
  const r = readinessFor({ days: {}, ckBy, acts: { [y]: [{ type: 'baseball', name: 'Baseball', dur: 7200 }] }, date: d, today: d, rec: { score: 30 } });
  assert.deepEqual(r.sore, { brust: 1, ruecken: 3, bizeps: 2 });
  assert.deepEqual(r.pain.map(p => p.k + ':' + p.inj), ['ellbogen:elbow', 'sonstiges:null']);
  assert.equal(r.color, 'red'); assert.equal(r.yesterdayBaseball, true); assert.equal(r.baseballSource, 'uhr');
  const r2 = readinessFor({ days: {}, ckBy: {}, acts: {}, date: d, today: d, rec: { score: null } });
  assert.equal(r2.checkin, false); assert.equal(r2.yesterdayBaseball, false); assert.equal(r2.color, 'none');
  const r3 = readinessFor({ days: {}, ckBy: { [d]: { date: d, bb: true, sore: {}, pain: {} } }, acts: {}, date: d, today: d, rec: { score: 70 } });
  assert.equal(r3.yesterdayBaseball, true, 'Schalter am Morgen'); assert.equal(r3.color, 'green');
});
await t('Worker: /v1/readiness', async () => {
  const j = await (await call('/v1/readiness')).json(); assert.ok('recovery' in j && 'sore' in j && 'pain' in j && 'yesterdayBaseball' in j, JSON.stringify(j).slice(0, 200));
});

await t('Empfehlung: Baseball nur mit eingetragenem Schmerz/Muskelkater', () => {
  const muscles = [{ k: 'schultern', label: 'Schultern', status: 'fresh', pct: 5 }, { k: 'trizeps', label: 'Trizeps', status: 'fresh', pct: 5 }];
  const base = { date: '2026-11-19', rec: { color: 'green', hasData: true, parts: [] }, muscles, sessions: [], ratio: null, sleepPart: null, now: Date.parse('2026-11-19T12:00:00Z') };
  const S = { sportDays: [weekday('2026-11-19'), (weekday('2026-11-19') + 1) % 7] };
  const off = recommend(Object.assign({}, base, { settings: Object.assign({ bbRelevant: false }, S) }));
  assert.deepEqual(off.avoid, []); assert.ok(!off.notes.some(x => /Baseball/.test(x))); assert.equal(off.level, 'full');
  const on = recommend(Object.assign({}, base, { settings: Object.assign({ bbRelevant: true }, S) }));
  assert.ok(on.avoid.includes('Schultern')); assert.ok(on.notes.some(x => /Baseball/.test(x)));
});

console.log(`\n${n - fails}/${n} Tests bestanden`);
if (fails) process.exit(1);
