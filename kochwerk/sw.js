// Netz zuerst (Updates kommen sofort an), ohne Netz aus dem Zwischenspeicher.
// Löscht nur eigene Caches (kochwerk-…), nie die anderen Apps unter derselben Adresse.
const CACHE = 'kochwerk-v6';
const FILES = ['./', './index.html', './style.css', './core.js', './plan.js', './shop.js', './cook.js', './sync.js', './app.js', './beispiel-rezept.txt', './rezepte-paket.txt', './manifest.webmanifest', './icon.svg', './icon-180.png', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x.startsWith('kochwerk-') && x !== CACHE).map(x => caches.delete(x)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin || !url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;
  e.respondWith(fetch(e.request).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return res;
  }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(hit => hit || caches.match('./index.html'))));
});
