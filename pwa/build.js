// Baut die eigenständige PWA nach pwa/dist (node pwa/build.js)
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), out = path.join(__dirname, 'dist');
fs.mkdirSync(out, { recursive: true });
const page = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const head = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<link rel="manifest" href="manifest.webmanifest"><meta name="theme-color" content="#111113"><link rel="apple-touch-icon" href="icon-192.png">
<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta name="apple-mobile-web-app-title" content="Satzwerk">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style></head><body>`;
const tail = `<script>if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('sw.js'));</script></body></html>`;
fs.writeFileSync(path.join(out, 'index.html'), head + page + tail);
for (const f of ['exercises.js', 'howto.js', 'engine.js', 'figures.js', 'app.js']) fs.copyFileSync(path.join(root, f), path.join(out, f));
for (const f of ['sw.js', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png']) fs.copyFileSync(path.join(__dirname, f), path.join(out, f));
console.log('PWA gebaut in', out);
