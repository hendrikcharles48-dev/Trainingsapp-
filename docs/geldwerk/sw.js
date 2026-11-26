// Geldwerk – Service Worker. Eigene Dateien: Cache zuerst, im Hintergrund auffrischen (Start ohne Netz).
// Texterkennung/PDF-Leser (vendor/) erst bei Bedarf geladen, danach aus dem Cache. Löscht nur eigene Caches (geldwerk-app-…).
const CACHE = 'geldwerk-app-v2';
const VENDOR = 'geldwerk-vendor-1';
const CORE = ['./', './index.html', './style.css', './core.js', './parse.js', './mappe.js', './charts.js', './sync.js', './store.js', './ocr.js', './push.js', './app.js',
  './regeln/2026.json', './regeln/2027.json', './manifest.webmanifest', './icon.svg', './icon-180.png', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(f => fetch(f, { cache: 'reload' }).then(r => { if (r.ok) return c.put(f, r); }).catch(() => { })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x.startsWith('geldwerk-app-') && x !== CACHE).map(x => caches.delete(x)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const scope = new URL(self.registration.scope);
  if (url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;
  // Große Bibliotheken (vendor/): einmal laden, dann nur noch aus dem eigenen Cache – überdauert App-Updates
  if (url.pathname.includes('/vendor/')) {
    e.respondWith(caches.open(VENDOR).then(c => c.match(e.request).then(hit => hit || fetch(e.request).then(res => { if (res.ok) c.put(e.request, res.clone()); return res; }))));
    return;
  }
  e.respondWith(caches.open(CACHE).then(c => c.match(e.request, { ignoreSearch: true }).then(hit => {
    const net = fetch(e.request).then(res => { if (res.ok) c.put(e.request, res.clone()); return res; });
    if (hit) { e.waitUntil(net.catch(() => { })); return hit; }
    return net.catch(() => e.request.mode === 'navigate' ? c.match('./index.html') : Response.error());
  })));
});

// Erinnerungen: Push kommt ohne Text, der Text wird mit dem Token vom Worker geholt (Zugang im Cache „geldwerk-push-cfg“).
const CFG_KEY = () => self.registration.scope + 'push-cfg.json';
self.addEventListener('message', e => {
  const d = e.data; if (!d || d.type !== 'gw-push-cfg') return;
  e.waitUntil(caches.open('geldwerk-push-cfg').then(c => d.cfg ? c.put(CFG_KEY(), new Response(JSON.stringify(d.cfg))) : c.delete(CFG_KEY())));
});
self.addEventListener('push', e => e.waitUntil((async () => {
  let msg = { title: 'Geldwerk', body: 'Eine Frist steht an – öffne Geldwerk.' };
  try {
    const c = await caches.open('geldwerk-push-cfg'); const r = await c.match(CFG_KEY()); const cfg = r && await r.json();
    if (cfg && cfg.url && cfg.token) { const res = await fetch(cfg.url.replace(/\/+$/, '') + '/v1/gw/state?t=' + encodeURIComponent(cfg.token), { cache: 'no-store' }); if (res.ok) msg = await res.json(); }
  } catch (err) { }
  await self.registration.showNotification(msg.title || 'Geldwerk', { body: msg.body || '', tag: 'geldwerk', renotify: true, icon: './icon-192.png', badge: './icon-192.png' });
})()));
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cl => (cl.length ? cl[0].focus() : self.clients.openWindow(self.registration.scope))));
});
