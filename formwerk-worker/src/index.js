// Formwerk-Worker: Zentrale zwischen Garmin, Formwerk und Satzwerk.
// - Garmin-Schlüssel nur als Secret GARMIN_API_KEY, Zugang für die Apps nur mit Secret APP_PASSWORD.
// - Speicher: Durable Object „FormwerkStore“ (SQLite, Free-Plan). Schnittstelle: formwerk/SCHNITTSTELLE.md
import { Garmin, PATHS, chunks, addDays } from './garmin.js';
import { mergeDays, list, activityFrom } from './normalize.js';
import { buildSummary, DEFAULT_SETTINGS, MODEL_VERSION } from './model.js';
import { PAGE } from './page.js';

export const WORKER_VERSION = '1.0.0';
// Wird diese Zahl erhöht, lädt der Worker die Garmin-Daten einmal komplett neu (z. B. nach Änderungen in normalize.js)
const NORM_VERSION = 1;
const HISTORY_DAYS = 120;          // 90 Tage Verlauf + 30 Tage Basis
const AUTO_REFRESH_MIN = 30;       // ohne Ziehen höchstens alle 30 min zu Garmin
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
    if (!(await authorized(req, env))) { await new Promise(r => setTimeout(r, 800)); return json({ error: 'auth', message: 'Passwort falsch.' }, 401, ch); }
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
      if (p === '/v1/sessions' && req.method === 'POST') return json(await this.putSessions(await req.json()));
      if (p === '/v1/sessions') return json({ sessions: await this.sessions(+url.searchParams.get('days') || 60) });
      if (p === '/v1/settings' && (req.method === 'PUT' || req.method === 'POST')) return json(await this.putSettings(await req.json()));
      if (p === '/v1/settings') return json(await this.settings());
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
    if (mode === 'auto' && age < AUTO_REFRESH_MIN * 60) return meta;
    if (mode === 'force' && age < FORCE_REFRESH_SEC) return meta;
    if (mode === 'cron' && age < 20 * 60) return meta;
    const today = this.today();
    if (meta.norm !== NORM_VERSION) { meta.backfilled = false; meta.norm = NORM_VERSION; }
    const from = !meta.backfilled ? addDays(today, -(HISTORY_DAYS - 1)) : meta.lastWeekSync !== today ? addDays(today, -6) : addDays(today, -2);
    const g = new Garmin(this.env.GARMIN_API_KEY, this.st);
    const errors = [];
    const src = { hrv: [], sleep: [], daily: [], bb: [], stress: [], steps: [] };
    const acts = [];
    try {
      await g.token(false);
      for (const [a, b] of chunks(from, today)) {
        const res = await Promise.all([
          g.safe(PATHS.hrvRange(a, b)), g.safe(PATHS.sleepRange(a, b)), g.safe(PATHS.dailySummaries(a, b)),
          g.safe(PATHS.bodyBattery(a, b)), g.safe(PATHS.activities(a, b, 0, 100))
        ]);
        const [hrv, sleep, daily, bb, act] = res;
        for (const [name, r] of [['HRV', hrv], ['Schlaf', sleep], ['Tageswerte', daily], ['Body Battery', bb], ['Aktivitäten', act]]) if (!r.ok) errors.push(name + ': ' + r.error);
        if (hrv.ok) src.hrv.push(hrv.data);
        if (sleep.ok) src.sleep.push(sleep.data);
        if (daily.ok) src.daily.push(daily.data);
        if (bb.ok) src.bb.push(bb.data);
        if (act.ok) acts.push(...list(act.data));
      }
      // Detail-Schlaf (Phasen, Schlafwert) und HRV der letzten Nacht einzeln – die Zusammenfassungen sind manchmal knapper
      const [sd, hd] = await Promise.all([g.safe(PATHS.sleepDay(today)), g.safe(PATHS.hrvDay(today))]);
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
      if (!meta.backfilled && !errors.some(e => e.startsWith('HRV') || e.startsWith('Schlaf'))) meta.backfilled = true;
      if (meta.backfilled) meta.lastWeekSync = today;
      meta.firstDate = meta.firstDate && meta.firstDate < from ? meta.firstDate : from;
    } catch (e) {
      meta.error = String(e && e.message || e); meta.lastFetch = now - (AUTO_REFRESH_MIN - 5) * 60e3; // nach 5 min erneut versuchen
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
    const [days, acts, sessions, settings] = await Promise.all([this.range('d:', from, today), this.range('a:', from, today), this.sessions(120), this.settings()]);
    const now = Date.now();
    const sum = buildSummary({ days, actsByDate: acts, sessions, settings, today, now, tzOff: tzOffset(this.tz(), now), histDays: 90 });
    const status = { generated: now, lastFetch: meta.lastFetch || null, error: meta.error || null, backfilled: !!meta.backfilled, firstDate: meta.firstDate || null, garminKey: !!this.env.GARMIN_API_KEY, worker: WORKER_VERSION };
    if (kind === 'today') {
      const r = sum.recovery, c = sum.recommendation;
      return { date: today, status, recovery: { score: r.score, color: r.color, building: r.building, provisional: r.provisional }, recommendation: { level: c.level, title: c.title, text: c.text, good: c.good, notes: c.notes.slice(0, 2), week: c.week }, sleep: { total: sum.sleep.total ?? null, short: !!sum.sleep.short } };
    }
    return Object.assign(sum, { status, settings });
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
      'Aktivitäten': PATHS.activities(from, today, 0, 50), 'Herzfrequenz-Zonen': PATHS.hrZones()
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
