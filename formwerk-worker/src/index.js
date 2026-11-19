// Formwerk-Worker: Zentrale zwischen Garmin, Formwerk und Satzwerk.
// - Garmin-Schlüssel nur als Secret GARMIN_API_KEY, Zugang für die Apps nur mit Secret APP_PASSWORD.
// - Speicher: Durable Object „FormwerkStore“ (SQLite, Free-Plan). Schnittstelle: formwerk/SCHNITTSTELLE.md
import { Garmin, PATHS, chunks, addDays } from './garmin.js';
import { mergeDays, list, activityFrom, hrFrom } from './normalize.js';
import { buildSummary, DEFAULT_SETTINGS, MODEL_VERSION, estimateHr, GROUPS, PAIN_AREAS, volumeSignals, normCheckin, planned, sportKind, detectBaseball, readinessFor } from './model.js';
const GROUP_KEYS = new Set(GROUPS.map(g => g.k)), PAIN_KEYS = new Set(PAIN_AREAS.map(a => a.k));
import { PAGE } from './page.js';
import { vapidKeys, sendPush, b64u } from './push.js';

export const WORKER_VERSION = '2.10.0';
// Wird diese Zahl erhöht, lädt der Worker die Garmin-Daten einmal komplett neu (z. B. nach Änderungen in normalize.js)
const NORM_VERSION = 3; // 2: Tageswerte v2 verschachtelt; 3: Schlaf mit SpO2 (Stresszeichen)
const HISTORY_DAYS = 120;          // 90 Tage Verlauf + 30 Tage Basis
const AUTO_REFRESH_MIN = 30;       // ohne Ziehen höchstens alle 30 min zu Garmin
const NIGHT_RETRY_MIN = 3;
const FORCE_REFRESH_SEC = 90;      // „Ziehen zum Aktualisieren“ höchstens alle 90 s
const KEEP_SESSIONS_DAYS = 400;

const MUSCLE_KEYS = new Set(['chest', 'lats', 'upperback', 'lowback', 'fdelt', 'sdelt', 'rdelt', 'biceps', 'triceps', 'forearms', 'quads', 'hams', 'glutes', 'calves', 'abs', 'obliques']);

function localDate(tz, ts = Date.now()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz || 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).format(ts);
}
// Abstand der Zeitzone zu UTC in ms (positiv östlich von UTC)
function tzOffset(tz, ts = Date.now()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: tz || 'Europe/Berlin', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(ts).map(x => [x.type, x.value]));
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - Math.floor(ts / 1000) * 1000;
}

/* ---------------- Worker (Eingang) ---------------- */
function cors(env, req) {
  const origin = req.headers.get('Origin') || '';
  const allowed = (env.ALLOWED_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
  const h = { 'Vary': 'Origin' };
  if (allowed.includes(origin)) Object.assign(h, {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400'
  });
  return h;
}
const json = (data, status = 200, extra = {}) => new Response(JSON.stringify(data), { status, headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, extra) });

async function sameSecret(a, b) {
  const enc = new TextEncoder();
  const [x, y] = await Promise.all([crypto.subtle.digest('SHA-256', enc.encode(a)), crypto.subtle.digest('SHA-256', enc.encode(b))]);
  // Vergleich der Prüfsummen ohne frühen Abbruch (gleiche Länge, gleiche Laufzeit)
  const a8 = new Uint8Array(x), b8 = new Uint8Array(y); let d = 0;
  for (let i = 0; i < a8.length; i++) d |= a8[i] ^ b8[i];
  return d === 0;
}
async function authorized(req, env) {
  if (!env.APP_PASSWORD) return false;
  const h = req.headers.get('Authorization') || '';
  const m = /^Bearer\s+(.+)$/i.exec(h);
  return !!m && await sameSecret(m[1].trim(), String(env.APP_PASSWORD).trim());
}
const store = env => env.STORE.get(env.STORE.idFromName('main'));

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const ch = cors(env, req);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: ch });
    if (url.pathname === '/' || url.pathname === '/index.html') return new Response(PAGE, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Frame-Options': 'DENY' } });
    if (!url.pathname.startsWith('/v1/')) return json({ error: 'not_found' }, 404, ch);
    if (!env.APP_PASSWORD) return json({ error: 'setup', message: 'Secret APP_PASSWORD fehlt im Worker.' }, 503, ch);
    if (url.pathname !== '/v1/live/state' && !(await authorized(req, env))) { await new Promise(r => setTimeout(r, 800)); return json({ error: 'auth', message: 'Passwort falsch.' }, 401, ch); }
    try {
      const res = await store(env).fetch(new Request('https://store' + url.pathname + url.search, { method: req.method, headers: { 'Content-Type': 'application/json' }, body: req.method === 'GET' ? undefined : await req.text() }));
      const out = new Response(res.body, res);
      for (const [k, v] of Object.entries(ch)) out.headers.set(k, v);
      return out;
    } catch (e) {
      return json({ error: 'internal', message: String(e && e.message || e) }, 500, ch);
    }
  },
  async scheduled(event, env, ctx) {
    // Der 8-Uhr-Abruf läuft zu zwei UTC-Zeiten (Sommer/Winter) – nur der mit lokal 8 Uhr wird ausgeführt
    if (event.cron === '0 6,7 * * *') {
      const h = +new Intl.DateTimeFormat('en-GB', { timeZone: env.TZ || 'Europe/Berlin', hour: '2-digit', hourCycle: 'h23' }).format(new Date(event.scheduledTime || Date.now()));
      if (h !== 8) return;
    }
    ctx.waitUntil(store(env).fetch('https://store/internal/refresh', { method: 'POST' }).catch(() => {}));
  }
};

/* ---------------- Durable Object (Speicher + Logik) ---------------- */
export class FormwerkStore {
  constructor(ctx, env) { this.ctx = ctx; this.env = env; this.st = ctx.storage; this.running = null; this.rawCache = null; }

  async fetch(req) {
    const url = new URL(req.url); const p = url.pathname;
    try {
      if (p === '/internal/refresh') { await this.refresh('cron'); return json({ ok: true }); }
      if (p === '/v1/ping') return json({ ok: true, worker: WORKER_VERSION, model: MODEL_VERSION, garminKey: !!this.env.GARMIN_API_KEY, meta: await this.meta() });
      if (p === '/v1/raw') return json(await this.raw(Math.min(14, Math.max(1, +url.searchParams.get('days') || 7))));
      if (p === '/v1/summary') return json(await this.summary(url.searchParams.get('force') === '1', 'full'));
      if (p === '/v1/today') return json(await this.summary(url.searchParams.get('force') === '1', 'today'));
      if (p === '/v1/push/key') return json({ key: (await vapidKeys(this.st)).pub });
      if (p === '/v1/push/subscribe' && req.method === 'POST') return json(await this.pushSubscribe(await req.json()));
      if (p === '/v1/push/off' && req.method === 'POST') { await this.st.delete(['push:sub', 'live']); await this.st.deleteAlarm(); return json({ ok: true }); }
      if (p === '/v1/live' && req.method === 'POST') return json(await this.putLive(await req.json()));
      if (p === '/v1/live/state') return this.liveState(url.searchParams.get('t'));
      if (p === '/v1/readiness') return json(await this.readiness(url.searchParams.get('date')));
      if (p === '/v1/sessions' && req.method === 'POST') return json(await this.putSessions(await req.json()));
      if (p === '/v1/sessions') return json({ sessions: await this.sessions(+url.searchParams.get('days') || 60) });
      if (p === '/v1/settings' && (req.method === 'PUT' || req.method === 'POST')) return json(await this.putSettings(await req.json()));
      if (p === '/v1/settings') return json(await this.settings());
      if (p === '/v1/checkin' && req.method === 'POST') return json(await this.putCheckin(await req.json()));
      if (p === '/v1/checkin') return json({ checkins: await this.checkins(+url.searchParams.get('days') || 90) });
      if (p === '/v1/weight' && req.method === 'POST') return json(await this.putWeights(await req.json()));
      if (p === '/v1/weight') return json({ weights: await this.weights() });
      if (p === '/v1/backup/satzwerk' && req.method === 'PUT') return json(await this.putBackup('satzwerk', await req.text()));
      if (p === '/v1/backup/satzwerk') return this.getBackup('satzwerk');
      if (p === '/v1/coach' && (req.method === 'PUT' || req.method === 'POST')) return json(await this.putCoach(await req.text()));
      if (p === '/v1/coach') return json({ coach: (await this.st.get('coach')) || null, prev: (await this.st.get('coachPrev')) || null });
      if (p === '/v1/refetch' && req.method === 'POST') { const m = await this.meta(); m.backfilled = false; m.lastFetch = 0; await this.st.put('meta', m); await this.refresh('force'); return json({ ok: true, meta: await this.meta() }); }
      return json({ error: 'not_found' }, 404);
    } catch (e) {
      return json({ error: 'internal', message: String(e && e.message || e) }, 500);
    }
  }

  tz() { return this.env.TZ || 'Europe/Berlin'; }
  today() { return localDate(this.tz()); }
  async meta() { return (await this.st.get('meta')) || { backfilled: false, lastFetch: 0, lastWeekSync: null, error: null, norm: NORM_VERSION }; }
  async settings() { return Object.assign({}, DEFAULT_SETTINGS, (await this.st.get('settings')) || {}); }
  async putSettings(b) {
    const cur = await this.settings();
    if (Array.isArray(b.sportDays)) cur.sportDays = [...new Set(b.sportDays.map(Number).filter(x => Number.isInteger(x) && x >= 0 && x <= 6))].sort();
    // feste Baseball-Zeiten je Tag {from 'HH:MM', dur Minuten, since Datum}: zählen ab „since“ automatisch
    const T = Object.assign({}, cur.sportTimes || {}); const inT = b.sportTimes && typeof b.sportTimes === 'object' ? b.sportTimes : {};
    for (const d of cur.sportDays) {
      const prev = T[d] || { from: '18:00', dur: 120, since: this.today() }; const n = inT[d] || {};
      T[d] = { from: /^([01]\d|2[0-3]):[0-5]\d$/.test(n.from || '') ? n.from : prev.from, dur: Math.min(300, Math.max(30, Math.round(+n.dur || prev.dur))), since: prev.since || this.today() };
    }
    for (const k of Object.keys(T)) if (!cur.sportDays.includes(+k)) delete T[k];
    cur.sportTimes = T;
    if (b.strengthPerWeek != null) cur.strengthPerWeek = Math.min(6, Math.max(1, Math.round(+b.strengthPerWeek) || 2));
    await this.st.put('settings', cur);
    return cur;
  }

  /* ----- Garmin abrufen und speichern ----- */
  async refresh(mode) {
    if (this.running) return this.running;
    this.running = this._refresh(mode).finally(() => { this.running = null; });
    return this.running;
  }
  async _refresh(mode) {
    const meta = await this.meta();
    const now = Date.now();
    const age = (now - (meta.lastFetch || 0)) / 1000;
    // Morgens fehlt die Nacht oft noch kurz (Garmin rechnet den Schlaf erst nach HRV/Puls fertig):
    // solange heute Schlaf oder HRV fehlen, schon nach 3 min erneut fragen statt erst nach 30.
    let autoMin = AUTO_REFRESH_MIN;
    if (mode === 'auto' && age < AUTO_REFRESH_MIN * 60 && age >= NIGHT_RETRY_MIN * 60) {
      const d = await this.st.get('d:' + this.today());
      if (!d || !d.sleep || !d.sleep.total || d.hrv == null) autoMin = NIGHT_RETRY_MIN;
    }
    if (mode === 'auto' && age < autoMin * 60) return meta;
    if (mode === 'force' && age < FORCE_REFRESH_SEC) return meta;
    if (mode === 'cron' && age < 20 * 60) return meta;
    const today = this.today();
    if (meta.norm !== NORM_VERSION) { meta.backfilled = false; meta.norm = NORM_VERSION; }
    const from = !meta.backfilled ? addDays(today, -(HISTORY_DAYS - 1)) : meta.lastWeekSync !== today ? addDays(today, -6) : addDays(today, -2);
    const g = new Garmin(this.env.GARMIN_API_KEY, this.st);
    const errors = [];
    const src = { hrv: [], sleep: [], daily: [], bb: [], stress: [], steps: [], weight: [] };
    const acts = [];
    try {
      await g.token(false);
      for (const [a, b] of chunks(from, today)) {
        const res = await Promise.all([
          g.safe(PATHS.hrvRange(a, b)), g.safe(PATHS.sleepRange(a, b)), g.safe(PATHS.dailySummaries(a, b)),
          g.safe(PATHS.bodyBattery(a, b)), g.safe(PATHS.activities(a, b, 0, 100)), g.safe(PATHS.weight(a, b))
        ]);
        const [hrv, sleep, daily, bb, act, wt] = res;
        if (wt.ok) src.weight.push(wt.data); // Gewicht ist optional – Fehler hier nicht melden
        for (const [name, r] of [['HRV', hrv], ['Schlaf', sleep], ['Tageswerte', daily], ['Body Battery', bb], ['Aktivitäten', act]]) if (!r.ok) errors.push(name + ': ' + r.error);
        if (hrv.ok) src.hrv.push(hrv.data);
        if (sleep.ok) src.sleep.push(sleep.data);
        if (daily.ok) src.daily.push(daily.data);
        if (bb.ok) src.bb.push(bb.data);
        if (act.ok) acts.push(...list(act.data));
      }
      // Detail-Schlaf (Phasen, Schlafwert) und HRV der letzten Nacht einzeln – die Zusammenfassungen sind manchmal knapper
      const [sd, hd, hz] = await Promise.all([g.safe(PATHS.sleepDay(today)), g.safe(PATHS.hrvDay(today)), meta.hrDay !== today ? g.safe(PATHS.hrZones()) : Promise.resolve({ ok: false })]);
      if (hz.ok) { const hr = hrFrom(hz.data); if (hr) { await this.st.put('hr', hr); meta.hrDay = today; } }
      if (sd.ok && sd.data) src.sleep.push(withDate(sd.data, today));
      if (hd.ok && hd.data) src.hrv.push(withDate(hd.data, today));
      // Stress/Schritte nur, wenn die Tageszusammenfassung sie nicht enthält
      let days = mergeDays(src);
      if (!days[today] || days[today].steps == null) {
        for (const [a, b] of chunks(from, today)) {
          const [s1, s2] = await Promise.all([g.safe(PATHS.stress(a, b)), g.safe(PATHS.steps(a, b))]);
          if (s1.ok) src.stress.push(s1.data);
          if (s2.ok) src.steps.push(s2.data);
        }
        days = mergeDays(src);
      }
      // speichern (neue Werte ergänzen/überschreiben vorhandene)
      const keys = Object.keys(days).map(d => 'd:' + d);
      const old = new Map();
      for (let i = 0; i < keys.length; i += 100) for (const [k, v] of await this.st.get(keys.slice(i, i + 100))) old.set(k, v);
      const put = {};
      for (const [d, v] of Object.entries(days)) { const prev = old.get('d:' + d) || {}; put['d:' + d] = Object.assign({}, prev, v, { sleep: v.sleep ? Object.assign({}, prev.sleep || {}, v.sleep) : prev.sleep }); }
      // Aktivitäten: Tage im abgefragten Fenster komplett ersetzen (gelöschte verschwinden)
      if (!errors.some(e => e.startsWith('Aktivitäten'))) {
        const byDate = {};
        for (const raw of acts) { const a = activityFrom(raw); if (a.date) (byDate[a.date] = byDate[a.date] || []).push(a); }
        for (let d = from; d <= today; d = addDays(d, 1)) put['a:' + d] = byDate[d] || [];
      }
      const entries = Object.entries(put);
      for (let i = 0; i < entries.length; i += 100) await this.st.put(Object.fromEntries(entries.slice(i, i + 100)));
      meta.lastFetch = now; meta.calls = g.calls; meta.error = errors.length ? errors.join(' · ') : null;
      // Fehlerart für die App: Schlüssel abgelehnt / Garmin bremst / sonst
      meta.errorKind = !errors.length ? null : errors.every(e => /401|403/.test(e)) ? 'key' : errors.some(e => /429/.test(e)) ? 'rate' : 'partial';
      if (!errors.length) meta.lastOk = now;
      if (!meta.backfilled && !errors.some(e => e.startsWith('HRV') || e.startsWith('Schlaf'))) meta.backfilled = true;
      if (meta.backfilled) meta.lastWeekSync = today;
      meta.firstDate = meta.firstDate && meta.firstDate < from ? meta.firstDate : from;
    } catch (e) {
      meta.error = String(e && e.message || e); meta.lastFetch = now - (AUTO_REFRESH_MIN - 5) * 60e3; // nach 5 min erneut versuchen
      meta.errorKind = e && (e.status === 401 || e.status === 403) ? 'key' : e && e.status === 429 ? 'rate' : 'other';
    }
    meta.lastTry = now;
    await this.st.put('meta', meta);
    return meta;
  }

  async range(prefix, from, to) {
    const m = await this.st.list({ prefix, start: prefix + from, end: prefix + to + '~' });
    const out = {}; for (const [k, v] of m) out[k.slice(prefix.length)] = v; return out;
  }
  async sessions(days) {
    const m = await this.st.list({ prefix: 's:' });
    const min = addDays(this.today(), -days);
    return [...m.values()].filter(s => s.date >= min).sort((a, b) => (a.end || 0) - (b.end || 0));
  }

  async summary(force, kind) {
    const meta = await this.refresh(force ? 'force' : 'auto');
    const today = this.today();
    const from = addDays(today, -(HISTORY_DAYS + 28));
    const [days, acts, sessions, settings, hrz, checkins] = await Promise.all([this.range('d:', from, today), this.range('a:', from, today), this.sessions(120), this.settings(), this.st.get('hr'), this.checkins(100)]);
    const now = Date.now();
    settings.autoBB = await this.autoBaseball(today, settings, acts, checkins, now, hrz);
    const sum = buildSummary({ days, actsByDate: acts, sessions, settings, today, now, manualWeights: await this.weights(), checkins, hr: hrz ? { max: hrz.max, rest: hrz.rest || estimateHr(days, acts).rest } : null, tzOff: tzOffset(this.tz(), now), histDays: 90 });
    const status = { generated: now, lastFetch: meta.lastFetch || null, lastOk: meta.lastOk || null, errorKind: meta.error ? meta.errorKind || 'other' : null, error: meta.error || null, backfilled: !!meta.backfilled, firstDate: meta.firstDate || null, garminKey: !!this.env.GARMIN_API_KEY, worker: WORKER_VERSION };
    if (kind === 'today') {
      const r = sum.recovery, c = sum.recommendation;
      return { date: today, status, recovery: { score: r.score, color: r.color, building: r.building, provisional: r.provisional, estimated: !!r.estimated }, recommendation: { level: c.level, title: c.title, text: c.text, good: c.good, notes: c.notes.slice(0, 2), week: c.week }, sleep: { total: sum.sleep.total ?? null, short: !!sum.sleep.short }, weight: sum.weight.latest, weights: sum.weight.series.slice(-60), pain: sum.body.pain.map(p => ({ k: p.k, label: p.label, lvl: p.lvl, inj: p.inj, days: p.days })), checkin: !!sum.body.checkin, bbToday: !!(sum.body.flags && sum.body.flags.bbToday),
        muscles: sum.muscles.map(m => ({ k: m.k, label: m.label, status: m.status, pct: m.pct, sore: m.sore || 0, m: (GROUPS.find(g => g.k === m.k) || {}).m || [] })),
        vol: volumeSignals({ checkins, sessions, history: sum.history, today }),
        signals: sum.signals, prefill: sum.prefill, plan: { sportDays: settings.sportDays || [], baseballToday: !!sum.body.baseball.today.on, strengthDays: sum.body.insights.strengthDays.idx || [] } };
    }
    return Object.assign(sum, { status, settings, vol: volumeSignals({ checkins, sessions, history: sum.history, today }) });
  }

  /* ----- Mitteilung im Training (Worker 2.10): ersetzt sich bei jedem Satz, „Pause vorbei“ kommt per Alarm ----- */
  async pushSubscribe(b) {
    const s = b && b.sub; if (!s || typeof s.endpoint !== 'string' || !/^https:\/\//.test(s.endpoint) || s.endpoint.length > 600) return { ok: false, error: 'Abo ungültig' };
    await this.st.put('push:sub', { endpoint: s.endpoint, t: Date.now() });
    let token = await this.st.get('push:token');
    if (!token) { token = b64u(crypto.getRandomValues(new Uint8Array(24))); await this.st.put('push:token', token); }
    return { ok: true, token };
  }
  async pushNow() {
    const sub = await this.st.get('push:sub'); if (!sub) return { ok: false, error: 'kein Abo' };
    try { const r = await sendPush(this.st, sub, 'https://formwerk.workers.dev'); if (r.gone) await this.st.delete('push:sub'); return r; }
    catch (e) { return { ok: false, error: String(e && e.message || e) }; }
  }
  async putLive(b) {
    if (!(await this.st.get('push:sub'))) return { ok: false, error: 'kein Abo' };
    const now = Date.now(); const cut = (x, n) => String(x == null ? '' : x).slice(0, n);
    const live = { title: cut(b.title, 80), body: cut(b.body, 160), t: now };
    const restEnd = +b.restEnd > now && +b.restEnd - now < 20 * 60e3 ? +b.restEnd : 0;
    if (restEnd) Object.assign(live, { restEnd, endTitle: cut(b.endTitle, 80), endBody: cut(b.endBody, 160) });
    await this.st.put('live', live);
    if (restEnd) await this.st.setAlarm(restEnd); else await this.st.deleteAlarm();
    const r = await this.pushNow();
    return { ok: !!r.ok, status: r.status || null, error: r.error || null };
  }
  async liveState(t) {
    const token = await this.st.get('push:token');
    if (!token || !t || t !== token) return json({ error: 'auth' }, 401);
    const live = await this.st.get('live');
    return json(live ? { title: live.title, body: live.body } : { title: 'Satzwerk', body: '' });
  }
  async alarm() {
    const live = await this.st.get('live'); if (!live || !live.restEnd) return;
    await this.st.put('live', { title: live.endTitle || 'Pause vorbei', body: live.endBody || '', t: Date.now() });
    await this.pushNow();
  }

  /* ----- Tageszustand für Satzwerk (Erholung, Ampel, Muskelkater, Schmerz, gestern Baseball) ----- */
  async readiness(dateIn) {
    const today = this.today(); const date = /^\d{4}-\d{2}-\d{2}$/.test(dateIn || '') && dateIn <= today ? dateIn : today;
    if (date === today) {
      const sum = await this.summary(false);
      const ckBy = Object.fromEntries((await this.checkins(3)).map(c => [c.date, c]));
      const acts = await this.range('a:', addDays(today, -2), today); const S = sum.settings;
      const r = readinessFor({ days: { [today]: { syncedUntil: sum.vitals && sum.vitals.syncedUntil } }, ckBy, S, acts, date, today, rec: sum.recovery });
      const by = sum.body && sum.body.baseball && sum.body.baseball.yesterday; if (by) { r.yesterdayBaseball = !!by.on; r.baseballSource = by.recorded ? 'uhr' : by.on ? 'eingetragen' : null; }
      return Object.assign(r, { synced: sum.vitals ? sum.vitals.syncedUntil : null, watchLast: sum.vitals ? sum.vitals.watchLast : null, advice: sum.recommendation ? sum.recommendation.title : null, status: { lastFetch: sum.status.lastFetch, errorKind: sum.status.errorKind } });
    }
    const from = addDays(date, -(HISTORY_DAYS + 28));
    const [days, acts, settings, checkins] = await Promise.all([this.range('d:', from, date), this.range('a:', addDays(date, -2), date), this.settings(), this.checkins(Math.min(400, 3 + Math.round((Date.parse(today) - Date.parse(date)) / 864e5)))]);
    const ckBy = Object.fromEntries(checkins.map(c => [c.date, c]));
    return readinessFor({ days, ckBy, S: settings, acts, date, today });
  }

  /* ----- Morgen-Check: Muskelkater und Schmerz ----- */
  async checkins(days) { const m = await this.st.list({ prefix: 'c:', start: 'c:' + addDays(this.today(), -days) }); return [...m.values()].map(normCheckin); }
  async putCheckin(b) {
    const date = b && /^\d{4}-\d{2}-\d{2}$/.test(b.date || '') ? b.date : this.today();
    if (date > this.today()) return { ok: false, error: 'Datum in der Zukunft' };
    const lv = (o, max, keys) => Object.fromEntries(Object.entries(o && typeof o === 'object' ? o : {}).filter(([k, v]) => keys.has(k) && Number.isInteger(v) && v >= 1 && v <= max));
    const old = normCheckin(await this.st.get('c:' + date));
    // nur die Baseball-Frage beantwortet: kein vollständiger Check (Muskelkater/Schmerz bleiben offen)
    // Nur Baseball-Schalter (gestern/heute): ändert keinen Muskelkater/Schmerz; ohne Check bleibt er „offen“ (partial)
    const flags = c => {
      for (const f of ['bb', 'bbToday']) { if (b[f] === true || b[f] === false) c[f] = b[f]; else if (old && old[f] != null) c[f] = old[f]; }
      // eigene Schlafangabe, wenn die Uhr nachts nichts gemessen hat: {h: 3–12 Stunden, q: 0 schlecht / 1 okay / 2 gut}
      if (b.sleepEst === null) delete c.sleepEst;
      else if (b.sleepEst && typeof b.sleepEst === 'object') { const h = Math.round(+b.sleepEst.h * 2) / 2, q = +b.sleepEst.q; if (h >= 3 && h <= 12) c.sleepEst = { h, q: [0, 1, 2].includes(q) ? q : 1 }; }
      else if (old && old.sleepEst) c.sleepEst = old.sleepEst;
      if (b.sick === true || b.sick === false) c.sick = b.sick; else if (old && old.sick != null) c.sick = old.sick;
      return c;
    };
    if (b.bbOnly) { const c0 = flags(Object.assign({ date, sore: {}, pain: {} }, old || { partial: true }, { t: Date.now() })); await this.st.put('c:' + date, c0); return { ok: true, checkin: c0 }; }
    const c = flags({ date, v: 5, sore: lv(b.sore, 5, GROUP_KEYS), pain: lv(b.pain, 5, PAIN_KEYS), t: Date.now() });
    await this.st.put('c:' + date, c);
    return { ok: true, checkin: c };
  }

  /* ----- Körpergewicht (von Hand in Formwerk, Übernahme aus Satzwerk) ----- */
  async weights() { const m = await this.st.list({ prefix: 'w:' }); return [...m.values()].sort((a, b) => (a.date < b.date ? -1 : 1)); }
  async putWeights(b) {
    const list = Array.isArray(b && b.entries) ? b.entries.slice(0, 1000) : [b];
    const today = this.today(); const put = {}, del = [];
    for (const e of list) {
      if (!e || !/^\d{4}-\d{2}-\d{2}$/.test(e.date || '') || e.date > today) continue;
      if (e.kg === null) { del.push('w:' + e.date); continue; }
      const kg = Number(e.kg); if (!(kg >= 25 && kg <= 300)) continue;
      // „nur ergänzen“: Übernahmen aus Satzwerk überschreiben keinen Eintrag, der schon da ist
      if (e.ifMissing && (await this.st.get('w:' + e.date))) continue;
      put['w:' + e.date] = { date: e.date, kg: Math.round(kg * 10) / 10, src: e.src === 'satzwerk' ? 'satzwerk' : 'formwerk', t: Date.now() };
    }
    const ent = Object.entries(put);
    for (let i = 0; i < ent.length; i += 100) await this.st.put(Object.fromEntries(ent.slice(i, i + 100)));
    if (del.length) await this.st.delete(del);
    return { ok: true, stored: ent.length, deleted: del.length };
  }

  /* ----- Sicherung von Satzwerk (Export-JSON, in Stücken; die vorige Fassung bleibt erhalten) ----- */
  // Wochenbericht von Claude (Satzwerk zeigt ihn an, nichts wird automatisch geändert). Vorige Fassung bleibt.
  async putCoach(text) {
    if (!text || text.length > 64000) return { ok: false, error: 'Bericht leer oder zu groß' };
    let j; try { j = JSON.parse(text); } catch (e) { return { ok: false, error: 'Kein gültiges JSON' }; }
    if (!j || j.v !== 1 || typeof j.id !== 'string' || typeof j.title !== 'string') return { ok: false, error: 'Kein Wochenbericht (v 1, id, title)' };
    const old = await this.st.get('coach'); if (old && old.id !== j.id) await this.st.put('coachPrev', old);
    j.stored = Date.now(); await this.st.put('coach', j);
    return { ok: true, id: j.id, stored: j.stored };
  }
  async putBackup(app, text) {
    if (!text || text.length > 12e6) return { ok: false, error: 'Sicherung leer oder zu groß' };
    try { const j = JSON.parse(text); if (!j || j.app !== app) return { ok: false, error: 'Keine ' + app + '-Sicherung' }; } catch (e) { return { ok: false, error: 'Kein gültiges JSON' }; }
    const meta = (await this.st.get('bk:' + app)) || {};
    const slot = meta.slot === 'a' ? 'b' : 'a';
    const size = 100000, n = Math.ceil(text.length / size), put = {};
    for (let i = 0; i < n; i++) put['bk:' + app + ':' + slot + ':' + i] = text.slice(i * size, (i + 1) * size);
    const ent = Object.entries(put);
    for (let i = 0; i < ent.length; i += 50) await this.st.put(Object.fromEntries(ent.slice(i, i + 50)));
    const old = (await this.st.list({ prefix: 'bk:' + app + ':' + slot + ':' })).keys();
    const stale = [...old].filter(k => +k.split(':').pop() >= n); if (stale.length) await this.st.delete(stale);
    const m = { slot, n, len: text.length, t: Date.now(), prev: meta.slot ? { slot: meta.slot, n: meta.n, t: meta.t } : null };
    await this.st.put('bk:' + app, m);
    return { ok: true, t: m.t, len: m.len };
  }
  async getBackup(app) {
    const meta = await this.st.get('bk:' + app);
    if (!meta) return json({ error: 'none', message: 'Noch keine Sicherung im Worker.' }, 404);
    const keys = Array.from({ length: meta.n }, (_, i) => 'bk:' + app + ':' + meta.slot + ':' + i);
    const parts = await this.st.get(keys);
    const text = keys.map(k => parts.get(k) || '').join('');
    return new Response(text, { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Backup-Time': String(meta.t) } });
  }

  /* ----- Baseball am Puls erkennen (feste Zeiten, gestern und heute) ----- */
  async autoBaseball(today, settings, acts, checkins, now, hrz) {
    const cache = (await this.st.get('bbauto')) || {};
    const ckBy = Object.fromEntries((checkins || []).map(c => [c.date, c]));
    const tzOff = tzOffset(this.tz(), now); let g = null, changed = false;
    // Lernen: Puls-Schnitt der Tage, an denen du „ja, war da“ bestätigt hast (Antwort am Morgen danach oder „Heute Baseball“)
    const yesMeans = Object.entries(cache).filter(([d, v]) => v.mean && ((ckBy[addDays(d, 1)] || {}).bb === true || (ckBy[d] || {}).bbToday === true)).map(([, v]) => v.mean);
    const learned = yesMeans.length >= 2 ? { minMean: Math.min(...yesMeans) } : null;
    for (const d of [addDays(today, -1), today]) {
      const p = planned(settings, d); if (!p) continue;
      if ((acts[d] || []).some(a => sportKind(a.type, a.name) === 'baseball')) continue;       // Uhr-Aktivität zählt ohnehin
      if ((ckBy[addDays(d, 1)] || {}).bb != null || (ckBy[d] || {}).bbToday != null) continue;  // du hast schon geantwortet
      const start = Date.parse(d + 'T' + p.from + ':00Z') - tzOff, end = start + p.dur * 60e3;
      const c = cache[d];
      if (c && c.complete) continue;
      if (now < end + 20 * 60e3 || (c && now - c.checked < 30 * 60e3)) continue;               // erst nach dem Termin, höchstens alle 30 min
      g = g || new Garmin(this.env.GARMIN_API_KEY, this.st);
      const r = await g.safe(PATHS.heartRateDay(d));
      if (!r.ok) continue;
      const rest = (r.data && r.data.restingHeartRate) || (hrz && hrz.rest) || 55;
      cache[d] = Object.assign(detectBaseball(r.data, start, end, rest, learned), { checked: now }); changed = true;
    }
    for (const k of Object.keys(cache)) if (k < addDays(today, -120)) { delete cache[k]; changed = true; }
    if (changed) await this.st.put('bbauto', cache);
    return Object.fromEntries(Object.entries(cache).filter(([, v]) => v.v != null).map(([k, v]) => [k, v.v]));
  }

  /* ----- Satzwerk-Einheiten ----- */
  async putSessions(body) {
    const inS = Array.isArray(body && body.sessions) ? body.sessions.slice(0, 200) : [];
    const del = Array.isArray(body && body.deleted) ? body.deleted.slice(0, 500) : [];
    const put = {}; let n = 0;
    for (const s of inS) { const c = cleanSession(s); if (c) { put['s:' + c.id] = c; n++; } }
    if (n) await this.st.put(put);
    const delKeys = del.filter(id => typeof id === 'string' && id.length <= 80).map(id => 's:' + id);
    if (delKeys.length) await this.st.delete(delKeys);
    // aufräumen: sehr alte Einheiten
    const all = await this.st.list({ prefix: 's:' });
    const tooOld = addDays(this.today(), -KEEP_SESSIONS_DAYS);
    const old = [...all.entries()].filter(([, v]) => v.date < tooOld).map(([k]) => k);
    if (old.length) await this.st.delete(old);
    const since = addDays(this.today(), -60); const have = {};
    for (const [k, v] of all) if (!old.includes(k) && !delKeys.includes(k) && v.date >= since) have[k.slice(2)] = v.sig || '';
    for (const c of Object.values(put)) if (c.date >= since) have[c.id] = c.sig || '';
    return { ok: true, stored: n, deleted: delKeys.length, have };
  }

  /* ----- Testseite: Rohdaten der letzten Tage ----- */
  async raw(days) {
    if (this.rawCache && this.rawCache.days === days && Date.now() - this.rawCache.t < 120e3) return this.rawCache.data;
    const today = this.today(); const from = addDays(today, -(days - 1)); const yest = addDays(today, -1);
    const g = new Garmin(this.env.GARMIN_API_KEY, this.st);
    const calls = {
      'HRV Zeitraum': PATHS.hrvRange(from, today), 'HRV heute (Detail)': PATHS.hrvDay(today),
      'Schlaf Zeitraum': PATHS.sleepRange(from, today), 'Schlaf heute (Detail)': PATHS.sleepDay(today), 'Schlaf gestern (Detail)': PATHS.sleepDay(yest),
      'Body Battery': PATHS.bodyBattery(from, today), 'Tageszusammenfassungen': PATHS.dailySummaries(from, today),
      'Stress': PATHS.stress(from, today), 'Schritte': PATHS.steps(from, today),
      'Aktivitäten': PATHS.activities(from, today, 0, 50), 'Herzfrequenz-Zonen': PATHS.hrZones(), 'Puls gestern (Tag)': PATHS.heartRateDay(yest), 'Gewicht': PATHS.weight(from, today)
    };
    const out = { range: [from, today], worker: WORKER_VERSION, calls: {} };
    try { await g.token(false); } catch (e) { return { range: [from, today], error: e.message, status: e.status, body: e.body }; }
    const names = Object.keys(calls);
    const res = await Promise.all(names.map(k => g.safe(calls[k])));
    names.forEach((k, i) => { out.calls[k] = Object.assign({ path: calls[k] }, res[i]); });
    const r = k => (out.calls[k].ok ? [out.calls[k].data] : []);
    const det = (k, d) => r(k).filter(Boolean).map(x => withDate(x, d));
    out.parsed = mergeDays({ hrv: [...r('HRV Zeitraum'), ...det('HRV heute (Detail)', today)], sleep: [...r('Schlaf Zeitraum'), ...det('Schlaf gestern (Detail)', yest), ...det('Schlaf heute (Detail)', today)], daily: r('Tageszusammenfassungen'), bb: r('Body Battery'), stress: r('Stress'), steps: r('Schritte') });
    out.activities = r('Aktivitäten').flatMap(x => list(x)).map(activityFrom);
    out.garminCalls = g.calls;
    this.rawCache = { days, t: Date.now(), data: out };
    return out;
  }
}

// Einzeltag-Antwort ohne eigenes Datum mit dem abgefragten Datum versehen
function withDate(x, d) {
  if (!x || typeof x !== 'object' || Array.isArray(x)) return x;
  if (x.calendarDate || x.date || (x.dailySleepDTO && x.dailySleepDTO.calendarDate) || (x.hrvSummary && x.hrvSummary.calendarDate)) return x;
  return Object.assign({ calendarDate: d }, x);
}

/* ---------------- Eingangsprüfung Satzwerk-Einheit ---------------- */
const str = (v, n) => (typeof v === 'string' ? v.slice(0, n) : '');
const num = (v, lo, hi) => { const x = Number(v); return v === null || v === undefined || v === '' || !isFinite(x) ? null : Math.min(hi, Math.max(lo, x)); };
function cleanSession(s) {
  if (!s || typeof s !== 'object') return null;
  const id = str(s.id, 80); const date = str(s.date, 10);
  if (!id || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const exercises = (Array.isArray(s.exercises) ? s.exercises : []).slice(0, 40).map(e => ({
    id: str(e.id, 80), name: str(e.name, 80),
    muscles: {
      primary: (e.muscles && Array.isArray(e.muscles.primary) ? e.muscles.primary : []).filter(m => MUSCLE_KEYS.has(m)).slice(0, 6),
      secondary: (e.muscles && Array.isArray(e.muscles.secondary) ? e.muscles.secondary : []).filter(m => MUSCLE_KEYS.has(m)).slice(0, 8)
    },
    sets: (Array.isArray(e.sets) ? e.sets : []).slice(0, 30).map(x => ({ reps: num(x.reps, 0, 500), kg: num(x.kg, -200, 1000), sec: num(x.sec, 0, 36000), rir: num(x.rir, 0, 10), band: str(x.band, 20) || undefined }))
  })).filter(e => e.sets.length);
  return { id, date, start: num(s.start, 0, 9e15), end: num(s.end, 0, 9e15), name: str(s.name, 80), source: str(s.source, 20) || 'satzwerk', sig: str(s.sig, 40), exercises };
}
