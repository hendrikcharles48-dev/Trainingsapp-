#!/usr/bin/env node
/* Prüft den Push-Teil des Service Workers (pwa/sw.js) mit Attrappen: node tools/sw-push.test.js */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const src = fs.readFileSync(path.join(__dirname, '..', 'pwa', 'sw.js'), 'utf8');
const handlers = {}, shown = [], store = new Map(); let fetched = null, opened = null;
const cache = { put: async (k, v) => { store.set(k, await v.text()); }, match: async k => (store.has(k) ? new Response(store.get(k)) : undefined), delete: async k => store.delete(k) };
const self = { registration: { scope: 'https://x.example/app/', showNotification: async (t, o) => { shown.push([t, o]); } }, addEventListener: (n, f) => { handlers[n] = f; }, skipWaiting() { }, clients: { claim() { }, matchAll: async () => [], openWindow: async u => { opened = u; } } };
const ctx = { self, caches: { open: async () => cache, keys: async () => [], match: async () => undefined, delete: async () => true }, fetch: async u => { fetched = String(u); return new Response(JSON.stringify({ title: 'Pause bis 12:00', body: 'Bankdrücken · Satz 2/4 · 60 kg × 8 Wdh.' })); }, URL, Response, Request: class { }, location: { origin: 'https://x.example' }, console };
vm.createContext(ctx); vm.runInContext(src, ctx);
const run = async (name, ev) => { let p; handlers[name](Object.assign({ waitUntil: x => { p = x; } }, ev)); await p; };
let n = 0, fails = 0; const t = async (name, fn) => { n++; try { await fn(); console.log('ok   ' + name); } catch (e) { fails++; console.log('FAIL ' + name + '\n     ' + e.message); } };
(async () => {
  await t('Push ohne Zugang: neutrale Mitteilung', async () => { shown.length = 0; await run('push', {}); assert.equal(shown.length, 1); assert.equal(shown[0][1].tag, 'satzwerk-live'); });
  await t('Zugang speichern, Push holt den Text mit Token und ersetzt per tag', async () => {
    await run('message', { data: { type: 'live-cfg', cfg: { url: 'https://w.example/', token: 'a+b' } } });
    shown.length = 0; await run('push', {});
    assert.equal(fetched, 'https://w.example/v1/live/state?t=a%2Bb'); assert.equal(shown[0][0], 'Pause bis 12:00'); assert.equal(shown[0][1].body, 'Bankdrücken · Satz 2/4 · 60 kg × 8 Wdh.'); assert.equal(shown[0][1].renotify, true);
  });
  await t('Zugang löschen', async () => { await run('message', { data: { type: 'live-cfg', cfg: null } }); assert.equal(store.size, 0); });
  await t('Tipp auf Mitteilung öffnet die App', async () => { let closed = false; await run('notificationclick', { notification: { close: () => { closed = true; } } }); assert.ok(closed); assert.equal(opened, 'https://x.example/app/'); });
  console.log(`\n${n - fails}/${n} Tests bestanden`); if (fails) process.exit(1);
})();
