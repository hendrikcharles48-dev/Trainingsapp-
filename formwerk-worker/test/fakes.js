// Nachgebaute Garmin-Antworten und Durable-Object-Speicher für Tests und Bildschirmfotos
import assert from 'node:assert/strict';
import { addDays } from '../src/model.js';

export class FakeStorage {
  constructor() { this.m = new Map(); }
  async get(k) { if (Array.isArray(k)) { assert.ok(k.length <= 128, 'get > 128 Schlüssel'); return new Map(k.filter(x => this.m.has(x)).map(x => [x, structuredClone(this.m.get(x))])); } return structuredClone(this.m.get(k)); }
  async put(k, v) { if (typeof k === 'object') { assert.ok(Object.keys(k).length <= 128, 'put > 128'); for (const [a, b] of Object.entries(k)) this.m.set(a, structuredClone(b)); } else this.m.set(k, structuredClone(v)); }
  async delete(k) { for (const x of [].concat(k)) this.m.delete(x); }
  async list({ prefix = '', start, end } = {}) { return new Map([...this.m.entries()].filter(([k]) => k.startsWith(prefix) && (!start || k >= start) && (!end || k < end)).sort(([a], [b]) => (a < b ? -1 : 1))); }
}
const jwt = 'x.' + btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 86400 })).replace(/=+$/, '') + '.y';
export const counter = { calls: 0 };
export function installFakeGarmin() { globalThis.fetch = async (url, opt = {}) => {
  counter.calls++;
  const u = new URL(url); const p = u.pathname;
  if (p.includes('/token')) { assert.match(opt.headers.Authorization, /^ApiKey /); return new Response(jwt); }
  assert.match(opt.headers.Authorization, /^Bearer /);
  const range = (a, b) => { const out = []; for (let d = a; d <= b; d = addDays(d, 1)) out.push(d); return out; };
  const qa = u.searchParams.get('startDate'), qb = u.searchParams.get('endDate');
  const seg = p.split('/'); const sa = seg[seg.length - 2], sb = seg[seg.length - 1];
  const J = x => new Response(JSON.stringify(x), { headers: { 'Content-Type': 'application/json' } });
  if (p.startsWith('/hrv-service/hrv/daily/')) return J({ hrvSummaries: range(sa, sb).map((d, i) => ({ calendarDate: d, lastNightAvg: 50 + (i % 7), weeklyAvg: 53, status: 'BALANCED' })) });
  if (p.startsWith('/hrv-service/hrv/')) return J({ hrvSummary: { calendarDate: sb, lastNightAvg: 47 } });
  if (p.endsWith('dailySleepSummariesByDate')) return J(range(qa, qb).map(d => ({ calendarDate: d, sleepTimeSeconds: 26000 + 300 * (d.charCodeAt(9) % 5), deepSleepSeconds: 4800, remSleepSeconds: 5400 })));
  if (p.endsWith('/dailySleep')) return J({ dailySleepDTO: { calendarDate: u.searchParams.get('date'), sleepTimeSeconds: 25000, deepSleepSeconds: 4000, lightSleepSeconds: 15000, remSleepSeconds: 5000, awakeSleepSeconds: 1000, sleepScores: { overall: { value: 72 } } } });
  if (p.includes('bodyBattery')) return J(range(qa, qb).map(d => ({ date: d, charged: 50, drained: 60, bodyBatteryValuesArray: [[1, 40], [2, 85], [3, 30]] })));
  if (p.endsWith('dailysummaries')) return J({ data: range(qa, qb).map((d, i) => ({ calendarDate: d, restingHeartRate: 51 + (i % 3), totalSteps: 8000, averageStressLevel: 30 })) });
  if (p.includes('/activities/search/')) return J([{ activityId: 9, activityName: 'Baseball', activityType: { typeKey: 'baseball' }, startTimeLocal: qb + ' 18:00:00', duration: 7200, averageHR: 120, maxHR: 175 }]);
  if (p.includes('stats/stress') || p.includes('stats/steps')) return J([]);
  if (p.includes('heartRateZones')) return J([]);
  return new Response('not found', { status: 404 });
}; }
