// Garmin Connect Personal API – nur lesend.
// Endpunkte 1:1 aus Garmins offiziellem Client „connect-personal-api-python“ 1.0.0
// (github.com/garmin/connect-personal-api-python, garmin_personal_api/client.py + constants.py).
// Token: POST mit „Authorization: ApiKey …“, Antwort = JWT als reiner Text (Ablauf im exp-Feld, ca. 24 h).
// Kein Refresh-Token – bei Bedarf wird einfach ein neues geholt.

export const BASE = 'https://personal.connectapi.garmin.com';
const TOKEN_PATH = '/personalapitoken-service/personal-api/personal-api-key/token';

// Zeitraum-Grenzen (Garmin: Schlaf/Body Battery max. 31 Tage, Stress/Schritte 28) – wir teilen immer in 28-Tage-Stücke.
export const CHUNK_DAYS = 28;

export const PATHS = {
  hrvDay: d => `/hrv-service/hrv/${d}`,
  hrvRange: (a, b) => `/hrv-service/hrv/daily/${a}/${b}`,
  sleepDay: d => `/sleep-service/sleep/dailySleep?date=${d}`,
  sleepRange: (a, b) => `/sleep-service/sleep/dailySleepSummariesByDate?startDate=${a}&endDate=${b}`,
  bodyBattery: (a, b) => `/wellness-service/wellness/bodyBattery/reports/daily?startDate=${a}&endDate=${b}`,
  dailySummaries: (a, b) => `/usersummary-service/v2/dailysummaries?startDate=${a}&endDate=${b}`,
  stress: (a, b) => `/usersummary-service/stats/stress/daily/${a}/${b}`,
  steps: (a, b) => `/usersummary-service/stats/steps/daily/${a}/${b}`,
  activities: (a, b, start = 0, limit = 100) => `/activitylist-service/activities/search/activities?start=${start}&limit=${limit}&startDate=${a}&endDate=${b}`,
  activity: id => `/activity-service/activity/${id}`,
  hrZones: () => '/biometric-service/heartRateZones/v2'
};

export class GarminError extends Error {
  constructor(msg, status, body) { super(msg); this.status = status; this.body = body; }
}

function jwtExp(token) {
  try {
    const p = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = JSON.parse(atob(p + '='.repeat((4 - p.length % 4) % 4)));
    return Number(json.exp) * 1000;
  } catch (e) { return Date.now() + 20 * 3600e3; }
}

export class Garmin {
  // storage: Durable-Object-Speicher (get/put), key: API-Key aus dem Secret
  constructor(apiKey, storage) { this.key = (apiKey || '').trim(); this.storage = storage; this.calls = 0; }

  async token(force) {
    if (!this.key) throw new GarminError('Kein Garmin-Schlüssel hinterlegt (Secret GARMIN_API_KEY fehlt).', 0);
    if (!force) {
      const t = await this.storage.get('garmin:token');
      // eine Stunde Puffer wie im offiziellen Client
      if (t && t.exp - Date.now() > 3600e3) return t.token;
    }
    this.calls++;
    const r = await fetch(BASE + TOKEN_PATH, { method: 'POST', headers: { Accept: '*/*', Authorization: 'ApiKey ' + this.key } });
    const text = (await r.text()).trim();
    if (!r.ok) throw new GarminError(r.status === 401 || r.status === 403 ? 'Garmin lehnt den Schlüssel ab (abgelaufen oder falsch?).' : 'Garmin-Token fehlgeschlagen (' + r.status + ').', r.status, text.slice(0, 400));
    await this.storage.put('garmin:token', { token: text, exp: jwtExp(text) });
    return text;
  }

  async get(path) {
    let tok = await this.token(false);
    for (let attempt = 0; attempt < 2; attempt++) {
      this.calls++;
      const r = await fetch(BASE + path, { headers: { Accept: 'application/json', Authorization: 'Bearer ' + tok } });
      if (r.status === 401 && attempt === 0) { tok = await this.token(true); continue; }
      const text = await r.text();
      if (!r.ok) throw new GarminError('Garmin ' + r.status + ' bei ' + path.split('?')[0], r.status, text.slice(0, 400));
      if (!text) return null;
      try { return JSON.parse(text); } catch (e) { throw new GarminError('Garmin-Antwort ist kein JSON (' + path.split('?')[0] + ')', r.status, text.slice(0, 200)); }
    }
  }

  // Wie get, aber Fehler werden als Objekt zurückgegeben (für die Rohdaten-Testseite und Teil-Ausfälle)
  async safe(path) {
    try { return { ok: true, data: await this.get(path) }; }
    catch (e) { return { ok: false, status: e.status || 0, error: e.message, body: e.body }; }
  }
}

// Datumsbereich [a, b] in Stücke zu höchstens n Tagen teilen (beide Grenzen inklusive)
export function chunks(a, b, n = CHUNK_DAYS) {
  const out = []; let s = a;
  while (s <= b) { const e = minIso(addDays(s, n - 1), b); out.push([s, e]); s = addDays(e, 1); }
  return out;
}
export function addDays(iso, n) { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
const minIso = (x, y) => (x < y ? x : y);
