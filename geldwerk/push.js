/* Geldwerk – Erinnerungen per Web-Push über den Formwerk-Worker (Endpunkte /v1/gw/…, Worker 2.12).
   Der Worker bekommt nur Datum + kurzen Titel (keine Beträge, keine Belege) und das Push-Abo.
   Zugang (Adresse + App-Passwort) liegt nur auf dem Gerät: geldwerk_worker. Wird still aus Formwerk/Satzwerk übernommen,
   wenn die Apps denselben Speicher sehen. */
(function () {
  'use strict';
  const G = window.GW, LS = G.Store.LS;
  const DEFAULT_URL = 'https://formwerk.hendrikcharles48.workers.dev';
  function cfg() {
    const c = LS.get('worker', null);
    if (c && c.url && c.pw) return c;
    for (const k of ['formwerk_cfg', 'satzwerk.formwerk']) {
      try { const x = JSON.parse(LS.raw(k) || 'null'); if (x && x.url && x.pw) return { url: x.url, pw: x.pw, adopted: k.split(/[_.]/)[0] }; } catch (e) { }
    }
    return null;
  }
  const standalone = () => (window.navigator.standalone === true) || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);
  const supported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  async function api(path, o = {}) {
    const c = o.cfg || cfg(); if (!c) throw new Error('Worker nicht verbunden');
    const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 15000);
    try {
      const r = await fetch(c.url.replace(/\/+$/, '') + path, { method: o.method || 'GET', headers: Object.assign({ Authorization: 'Bearer ' + c.pw }, o.body ? { 'Content-Type': 'application/json' } : {}), body: o.body ? JSON.stringify(o.body) : undefined, signal: ctl.signal, cache: 'no-store' });
      let j = null; try { j = await r.json(); } catch (e) { }
      if (r.status === 401) throw new Error('Passwort falsch');
      if (r.status === 404) throw new Error('Der Worker kennt Geldwerk noch nicht (Version 2.12 nötig)');
      if (!r.ok) throw new Error((j && j.message) || 'Fehler ' + r.status);
      return j;
    } catch (e) { throw new Error(e.name === 'AbortError' ? 'Zeitüberschreitung' : e instanceof TypeError ? 'Keine Verbindung zum Worker' : e.message); }
    finally { clearTimeout(tm); }
  }
  const keyBytes = b64 => { const p = b64.replace(/-/g, '+').replace(/_/g, '/'); return Uint8Array.from(atob(p + '='.repeat((4 - p.length % 4) % 4)), ch => ch.charCodeAt(0)); };
  async function swSend(msg) { const reg = await navigator.serviceWorker.ready; const t = reg.active || navigator.serviceWorker.controller; if (t) t.postMessage(msg); }
  async function connect(url, pw) {
    const c = { url: String(url || DEFAULT_URL).trim().replace(/\/+$/, ''), pw: String(pw || '').trim() };
    if (!/^https:\/\//.test(c.url)) return { ok: false, error: 'Bitte die https-Adresse des Workers eingeben.' };
    if (!c.pw) return { ok: false, error: 'Bitte das App-Passwort eingeben.' };
    try { await api('/v1/gw/reminders', { cfg: c }); LS.set('worker', c); return { ok: true }; }
    catch (e) { return { ok: false, error: e.message }; }
  }
  async function enable() {
    if (!supported()) return { ok: false, error: standalone() ? 'Dieses Gerät kann keine Web-Mitteilungen (iOS 16.4 oder neuer nötig).' : 'Mitteilungen gehen nur, wenn Geldwerk auf dem Home-Bildschirm liegt: Teilen → „Zum Home-Bildschirm“.' };
    const c = cfg(); if (!c) return { ok: false, error: 'Erst den Worker verbinden (Adresse + Passwort).', needCfg: true };
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') return { ok: false, error: 'Mitteilungen sind nicht erlaubt. iPhone: Einstellungen → Mitteilungen → Geldwerk.' };
      const reg = await navigator.serviceWorker.ready;
      const { key } = await api('/v1/push/key');
      let sub = await reg.pushManager.getSubscription();
      if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(key) });
      const r = await api('/v1/gw/subscribe', { method: 'POST', body: { sub: sub.toJSON() } });
      if (!r || !r.ok) return { ok: false, error: (r && r.error) || 'Anmelden fehlgeschlagen.' };
      await swSend({ type: 'gw-push-cfg', cfg: { url: c.url, token: r.token } });
      if (c.adopted) LS.set('worker', { url: c.url, pw: c.pw });
      LS.set('push', { on: true, since: Date.now(), sent: null });
      return { ok: true };
    } catch (e) { return { ok: false, error: e.message || String(e) }; }
  }
  async function disable() {
    try { await api('/v1/gw/off', { method: 'POST', body: {} }); } catch (e) { }
    try { await swSend({ type: 'gw-push-cfg', cfg: null }); const reg = await navigator.serviceWorker.ready; const s = await reg.pushManager.getSubscription(); if (s) await s.unsubscribe(); } catch (e) { }
    LS.set('push', { on: false });
  }
  const isOn = () => !!(LS.get('push', {}) || {}).on;
  // Termine an den Worker geben – nur wenn sich etwas geändert hat
  let timer = null;
  function send(items) {
    if (!isOn() || !cfg()) return;
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const sig = JSON.stringify(items);
      const P = LS.get('push', {});
      if (P.sig === sig && P.sentAt && Date.now() - P.sentAt < 3 * 864e5) return;
      try { await api('/v1/gw/reminders', { method: 'PUT', body: { items } }); LS.set('push', Object.assign(LS.get('push', {}), { sig, sentAt: Date.now(), err: null })); }
      catch (e) { LS.set('push', Object.assign(LS.get('push', {}), { err: e.message })); }
    }, 1500);
  }
  async function test() { try { const r = await api('/v1/gw/test', { method: 'POST', body: {} }); return r && r.ok ? { ok: true } : { ok: false, error: r && r.gone ? 'Abo abgelaufen – bitte Mitteilungen aus- und wieder einschalten.' : 'Senden fehlgeschlagen.' }; } catch (e) { return { ok: false, error: e.message }; } }
  G.Push = { cfg, connect, enable, disable, isOn, send, test, standalone, supported, DEFAULT_URL };
})();
