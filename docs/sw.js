// Cache zuerst (Start ohne Warten aufs Netz), im Hintergrund auffrischen; neue Version über CACHE-Namen
const CACHE = 'satzwerk-v76';
const FILES = ['./', './index.html', './exercises.js', './howto.js', './engine.js', './figures.js', './formwerk-link.js', './app.js', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(FILES.map(f => fetch(f, { cache: 'reload' }).then(r => { if (r.ok) return c.put(f, r); })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x.startsWith('satzwerk-') && x !== CACHE).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const fonts = url.hostname.includes('fonts.g');
  if (url.origin !== location.origin && !fonts) return;
  // Nur Satzwerks eigene Dateien (direkt im App-Ordner) und Schriften kommen zuerst aus dem Cache;
  // Unterordner (andere Apps auf derselben Adresse) wie bisher: Netz zuerst
  const base = new URL('./', self.registration.scope).pathname;
  const own = fonts || (url.pathname.startsWith(base) && !url.pathname.slice(base.length).includes('/'));
  if (!own) {
    e.respondWith(fetch(e.request).then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); } return res; }).catch(() => caches.match(e.request)));
    return;
  }
  e.respondWith(caches.open(CACHE).then(c => c.match(e.request, { ignoreSearch: !fonts }).then(hit => {
    const net = fetch(e.request).then(res => { if (res.ok || res.type === 'opaque') c.put(e.request, res.clone()); return res; });
    if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
    return net.catch(() => c.match('./index.html'));
  })));
});

/* 3.25: Mitteilung im Training. Der Push kommt ohne Text; hier wird er mit dem Token von der Anbindung geholt.
   Zugang liegt im Cache „live-cfg“ (nicht „satzwerk-…“, sonst räumt ihn activate ab). Gleiches tag = ersetzt die vorige Mitteilung. */
self.addEventListener('message', e => {
  const d = e.data; if (!d || d.type !== 'live-cfg') return;
  e.waitUntil(caches.open('live-cfg').then(c => d.cfg ? c.put(self.registration.scope + 'live-cfg.json', new Response(JSON.stringify(d.cfg))) : c.delete(self.registration.scope + 'live-cfg.json')));
});
self.addEventListener('push', e => e.waitUntil((async () => {
  let msg = { title: 'Satzwerk', body: 'Training läuft' };
  try {
    const c = await caches.open('live-cfg'); const r = await c.match(self.registration.scope + 'live-cfg.json'); const cfg = r && await r.json();
    if (cfg && cfg.url && cfg.token) { const res = await fetch(cfg.url.replace(/\/+$/, '') + '/v1/live/state?t=' + encodeURIComponent(cfg.token), { cache: 'no-store' }); if (res.ok) msg = await res.json(); }
  } catch (err) { }
  await self.registration.showNotification(msg.title || 'Satzwerk', { body: msg.body || '', tag: 'satzwerk-live', renotify: true, icon: './icon-192.png' });
})()));
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cl => (cl.length ? cl[0].focus() : self.clients.openWindow(self.registration.scope))));
});
