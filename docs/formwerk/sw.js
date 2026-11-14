// Formwerk: eigene Dateien „Cache zuerst, im Hintergrund auffrischen“ (startet sofort, auch offline).
// Daten vom Worker gehen nie über diesen Cache (andere Adresse). Löscht nur eigene Caches (formwerk-…).
const CACHE = 'formwerk-v1';
const FILES = ['./', './index.html', './style.css', './app.js', './manifest.webmanifest', './icon.svg', './icon-180.png', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(FILES.map(f => fetch(f, { cache: 'reload' }).then(r => { if (r.ok) return c.put(f, r); })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x.startsWith('formwerk-') && x !== CACHE).map(x => caches.delete(x)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const fonts = url.hostname.includes('fonts.g');
  const scope = new URL(self.registration.scope).pathname;
  if (!fonts && (url.origin !== location.origin || !url.pathname.startsWith(scope))) return;
  e.respondWith(caches.open(CACHE).then(c => c.match(e.request, { ignoreSearch: !fonts }).then(hit => {
    const net = fetch(e.request).then(res => { if (res.ok || res.type === 'opaque') c.put(e.request, res.clone()); return res; });
    if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
    return net.catch(() => c.match('./index.html'));
  })));
});
