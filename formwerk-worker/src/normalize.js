// Garmin-Rohdaten → einheitliche Tageswerte.
// Garmin dokumentiert die Antwortformen der Personal API nicht im Client, deshalb liest dieser Teil bewusst
// tolerant: mehrere bekannte Feldnamen (aus Garmin Connect) und notfalls eine Tiefensuche nach dem Feldnamen.
// Was tatsächlich ankommt, zeigt die Testseite des Workers (Rohdaten + „Was Formwerk daraus liest“).

const isObj = x => x && typeof x === 'object' && !Array.isArray(x);
const n = v => (v === null || v === undefined || v === '' || isNaN(Number(v)) ? null : Number(v));

// Wert über einen von mehreren Pfaden ("a.b.c") holen
export function pick(o, ...paths) {
  for (const p of paths) {
    let cur = o;
    for (const k of p.split('.')) { if (cur == null) break; cur = cur[k]; }
    if (cur !== undefined && cur !== null && cur !== '') return cur;
  }
  return null;
}
// Tiefensuche nach dem ersten Feld mit einem dieser Namen (max. 4 Ebenen)
export function deep(o, names, depth = 0) {
  if (!o || typeof o !== 'object' || depth > 4) return null;
  for (const k of names) if (o[k] !== undefined && o[k] !== null && typeof o[k] !== 'object') return o[k];
  for (const v of Object.values(o)) { if (v && typeof v === 'object') { const r = deep(v, names, depth + 1); if (r !== null) return r; } }
  return null;
}
// Liste aus einer Antwort holen (Array direkt oder in einem bekannten/ersten Array-Feld)
export function list(x) {
  if (Array.isArray(x)) return x;
  if (!isObj(x)) return [];
  for (const k of ['data', 'hrvSummaries', 'dailySleepSummaries', 'sleepSummaries', 'activityList', 'activities', 'items', 'entries', 'results', 'dailySummaries']) if (Array.isArray(x[k])) return x[k];
  for (const v of Object.values(x)) if (Array.isArray(v) && v.length && isObj(v[0])) return v;
  return [x];
}
export function dateOf(o) {
  const d = pick(o, 'calendarDate', 'date', 'summaryDate', 'dailySleepDTO.calendarDate', 'hrvSummary.calendarDate', 'statisticsStartDate');
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d)) return d.slice(0, 10);
  return null;
}

/* ---------- einzelne Quellen ---------- */
export function hrvFrom(o) {
  const s = o && o.hrvSummary ? o.hrvSummary : o;
  if (!s) return null;
  const avg = n(pick(s, 'lastNightAvg', 'lastNightAverage', 'avgOvernightHrv'));
  if (avg === null) return null;
  return {
    hrv: avg,
    hrvWeek: n(pick(s, 'weeklyAvg', 'weeklyAverage')),
    hrvHigh: n(pick(s, 'lastNight5MinHigh')),
    hrvStatus: pick(s, 'status', 'hrvStatus') || null,
    hrvGarminLow: n(pick(s, 'baseline.balancedLow', 'baseline.lowUpper')),
    hrvGarminHigh: n(pick(s, 'baseline.balancedUpper'))
  };
}

export function sleepFrom(o) {
  if (!o) return null;
  const s = o.dailySleepDTO || o;
  const total = n(pick(s, 'sleepTimeSeconds', 'sleepTimeInSeconds', 'totalSleepSeconds', 'durationInSeconds'));
  if (total === null || total <= 0) return null;
  const out = {
    total,
    deep: n(pick(s, 'deepSleepSeconds', 'deepSleepDurationInSeconds')),
    light: n(pick(s, 'lightSleepSeconds', 'lightSleepDurationInSeconds')),
    rem: n(pick(s, 'remSleepSeconds', 'remSleepInSeconds', 'remSleepDurationInSeconds')),
    awake: n(pick(s, 'awakeSleepSeconds', 'awakeDurationInSeconds')),
    score: n(pick(s, 'sleepScores.overall.value', 'sleepScore.value', 'overallSleepScore.value', 'sleepScore', 'overallSleepScore')),
    start: n(pick(s, 'sleepStartTimestampLocal', 'sleepStartTimestampGMT', 'startTimeInSeconds')),
    end: n(pick(s, 'sleepEndTimestampLocal', 'sleepEndTimestampGMT')),
    // Garmin liefert die Zeitstempel teils als lokale Millisekunden: für die Uhrzeit-Anzeige als „lokal“ markieren
    local: pick(s, 'sleepStartTimestampLocal') != null,
    resp: n(pick(s, 'averageRespirationValue', 'avgSleepRespirationValue')),
    sleepRhr: n(pick(o, 'restingHeartRate', 'dailySleepDTO.restingHeartRate')),
    sleepHrv: n(pick(o, 'avgOvernightHrv', 'dailySleepDTO.avgOvernightHrv'))
  };
  if (out.start && out.start < 1e11) out.start *= 1000;
  if (out.end && out.end < 1e11) out.end *= 1000;
  return out;
}

export function dailyFrom(o) {
  if (!o) return null;
  return {
    rhr: n(pick(o, 'restingHeartRate', 'restingHeartRateInBeatsPerMinute', 'values.restingHR')),
    steps: n(pick(o, 'totalSteps', 'steps', 'values.totalSteps')),
    stress: n(pick(o, 'averageStressLevel', 'avgStressLevel', 'values.overallStressLevel')),
    bbHigh: n(pick(o, 'bodyBatteryHighestValue', 'bodyBatteryHighValue')),
    bbLow: n(pick(o, 'bodyBatteryLowestValue', 'bodyBatteryLowValue')),
    bbWake: n(pick(o, 'bodyBatteryAtWakeTime', 'bodyBatteryMostRecentValue')),
    bbCharged: n(pick(o, 'bodyBatteryChargedValue')),
    bbDrained: n(pick(o, 'bodyBatteryDrainedValue')),
    intensity: (n(pick(o, 'moderateIntensityMinutes')) || 0) + 2 * (n(pick(o, 'vigorousIntensityMinutes')) || 0) || null
  };
}

export function bodyBatteryFrom(o) {
  if (!o) return null;
  const arr = pick(o, 'bodyBatteryValuesArray') || [];
  const vals = Array.isArray(arr) ? arr.map(v => (Array.isArray(v) ? n(v[v.length - 1] ?? null) : n(pick(v || {}, 'value', 'level')))).filter(v => v !== null) : [];
  // Verlauf für eine kleine Linie (max. 48 Punkte)
  const step = Math.max(1, Math.ceil(vals.length / 48));
  return {
    bbCharged: n(pick(o, 'charged')),
    bbDrained: n(pick(o, 'drained')),
    bbHigh: vals.length ? Math.max(...vals) : null,
    bbLow: vals.length ? Math.min(...vals) : null,
    bbNow: vals.length ? vals[vals.length - 1] : null,
    bbCurve: vals.filter((_, i) => i % step === 0)
  };
}

export function stressFrom(o) { const v = n(pick(o, 'values.overallStressLevel', 'overallStressLevel', 'averageStressLevel')); return v === null || v < 0 ? null : { stress: v }; }
export function stepsFrom(o) { const v = n(pick(o, 'totalSteps', 'values.totalSteps', 'steps')); return v === null ? null : { steps: v }; }

// Aktivität → kompakter Eintrag (Belastung wird in model.js berechnet)
export function activityFrom(o) {
  const startLocal = pick(o, 'startTimeLocal', 'startTimeGMT');
  const date = typeof startLocal === 'string' ? startLocal.slice(0, 10) : null;
  const zones = [1, 2, 3, 4, 5].map(z => n(pick(o, 'hrTimeInZone_' + z, 'timeInHrZone' + z)) || 0);
  return {
    id: String(pick(o, 'activityId', 'summaryId') ?? ''),
    date,
    time: typeof startLocal === 'string' ? startLocal.slice(11, 16) : null,
    name: pick(o, 'activityName') || '',
    type: String(pick(o, 'activityType.typeKey', 'activityType', 'activityTypeDTO.typeKey') || 'other').toLowerCase(),
    dur: n(pick(o, 'duration', 'durationInSeconds', 'movingDuration')) || 0,
    avgHr: n(pick(o, 'averageHR', 'averageHeartRateInBeatsPerMinute', 'avgHr')),
    maxHr: n(pick(o, 'maxHR', 'maxHeartRateInBeatsPerMinute', 'maxHr')),
    kcal: n(pick(o, 'calories', 'activeKilocalories')),
    zones: zones.some(Boolean) ? zones : null,
    garminLoad: n(pick(o, 'activityTrainingLoad'))
  };
}

/* ---------- Zusammenführen ---------- */
// sources: { hrv:[raw…], sleep:[raw…], daily:[raw…], bb:[raw…], stress:[raw…], steps:[raw…] }
// Ergebnis: { 'YYYY-MM-DD': {date, hrv, rhr, sleep:{…}, …} }
export function mergeDays(sources) {
  const days = {};
  const put = (d, obj) => { if (!d || !obj) return; const t = days[d] || (days[d] = { date: d });
    for (const [k, v] of Object.entries(obj)) if (v !== null && v !== undefined && !(Array.isArray(v) && !v.length)) t[k] = v; };
  for (const raw of sources.hrv || []) for (const o of list(raw)) put(dateOf(o), hrvFrom(o));
  for (const raw of sources.daily || []) for (const o of list(raw)) put(dateOf(o), dailyFrom(o));
  for (const raw of sources.stress || []) for (const o of list(raw)) put(dateOf(o), stressFrom(o));
  for (const raw of sources.steps || []) for (const o of list(raw)) put(dateOf(o), stepsFrom(o));
  for (const raw of sources.bb || []) for (const o of list(raw)) put(dateOf(o), bodyBatteryFrom(o));
  for (const raw of sources.sleep || []) for (const o of list(raw)) {
    const s = sleepFrom(o); const d = dateOf(o);
    if (!s || !d) continue;
    const t = days[d] || (days[d] = { date: d });
    // Detail-Abruf ergänzt die Zusammenfassung (Phasen, Score), überschreibt aber keine vorhandenen Werte mit null
    t.sleep = Object.assign({}, t.sleep || {}, Object.fromEntries(Object.entries(s).filter(([, v]) => v !== null)));
    if (s.sleepHrv && t.hrv == null) t.hrv = s.sleepHrv;
    if (s.sleepRhr && t.rhr == null) t.rhr = s.sleepRhr;
  }
  return days;
}
