// Cache zuerst (Start ohne Warten aufs Netz), im Hintergrund auffrischen; neue Version über CACHE-Namen
const CACHE = 'satzwerk-v32';
const FILES = ['./', './index.html', './exercises.js', './howto.js', './engine.js', './figures.js', './app.js', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
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
