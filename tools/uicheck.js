#!/usr/bin/env node
/* UI-Prüfung für alle Apps unter docs/ (Satzwerk, Kochwerk, Formwerk, Stunden, Toleranzen, Geldwerk …)
   Öffnet die App in Chromium (Playwright), tippt jeden sichtbaren Knopf an (eine Ebene, mit --deep zwei Ebenen)
   und meldet: Programmfehler (JS-Fehler), Überlappungen (Text/Symbol über Text/Symbol), Inhalte über den Rand.
   Benutzt nur localStorage im eigenen Test-Browser – echte Daten auf dem iPhone werden nie berührt.

   Aufruf:
     node tools/uicheck.js <seite> [--width 375,390] [--deep] [--storage datei.json] [--skip "regex"] [--max 120] [--out ordner] [--root ordner]
   Beispiele:
     node tools/uicheck.js index.html                       # Satzwerk
     node tools/uicheck.js kochwerk/index.html --deep
     node tools/uicheck.js formwerk/index.html --storage /tmp/fw-seed.json
   <seite> ist relativ zu docs/. --storage: JSON {"schlüssel": wert} wird vor dem Laden in localStorage geschrieben
   (Objekte werden als JSON gespeichert) – z. B. echte Sicherung aus dem Scratchpad, nie ins Repo legen.
   Ergebnis: Liste der Funde + Bildschirmfotos je Fund im --out-Ordner (Standard: /tmp/uicheck). Ende mit Code 1, wenn es Funde gibt.
*/
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');

const args = process.argv.slice(2); const opt = { width: '375,390', max: 120, out: '/tmp/uicheck', skip: '' };
const pages = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--deep') opt.deep = true;
  else if (a.startsWith('--')) opt[a.slice(2)] = args[++i];
  else pages.push(a);
}
if (!pages.length) { console.log('Aufruf: node tools/uicheck.js <seite relativ zu docs/> [--width 375,390] [--deep] [--storage datei.json]'); process.exit(2); }
const ROOT = path.resolve(opt.root || path.join(__dirname, '..', 'docs'));
// Knöpfe, die Daten löschen, verschicken oder die Seite verlassen, werden nicht angetippt
const SKIP = new RegExp(['lösch', 'delete', 'entfern', 'zurücksetzen', 'reset', 'verwerf', 'export', 'import', 'teilen', 'share', 'abmeld', 'logout',
  'herunterladen', 'download', 'hochladen', 'upload', 'senden', 'schicken', 'kopier', 'copy', 'drucken', 'print', 'alles ersetzen', 'neu laden'].join('|') + (opt.skip ? '|' + opt.skip : ''), 'i');

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.txt': 'text/plain' };
function serve() {
  return new Promise(res => {
    const srv = http.createServer((q, r) => {
      let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
      const f = path.join(ROOT, path.normalize(p));
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
      r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
    }).listen(0, '127.0.0.1', () => res(srv));
  });
}

// ---- läuft im Browser: Überlappungen / Überlauf finden ----
function inPageCheck() {
  const W = innerWidth, H = innerHeight, out = [];
  const vis = el => { const cs = getComputedStyle(el); return cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0.05; };
  const shown = el => { for (let e = el; e && e !== document.documentElement; e = e.parentElement) if (!vis(e)) return false; return true; };
  const layerOf = el => { for (let e = el; e && e !== document.body; e = e.parentElement) { const p = getComputedStyle(e).position; if (p === 'fixed' || p === 'sticky') return e; } return document.body; };
  const clip = (el, r) => { let { left, top, right, bottom } = r; for (let e = el; e && e !== document.documentElement; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') { const c = e.getBoundingClientRect(); if (cs.overflowX !== 'visible') { left = Math.max(left, c.left); right = Math.min(right, c.right); } if (cs.overflowY !== 'visible') { top = Math.max(top, c.top); bottom = Math.min(bottom, c.bottom); } } } return { left, top, right, bottom }; };
  const name = e => e.tagName.toLowerCase() + (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : '') + ' "' + (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 30) + '"';
  const items = [];
  for (const e of document.body.querySelectorAll('*')) {
    const tag = e.tagName.toLowerCase(); if (e.closest('svg') && tag !== 'svg') continue; if (tag === 'script' || tag === 'style') continue;
    if (!shown(e)) continue; const icon = tag === 'svg' || tag === 'img'; const rects = [];
    if (icon) { const r = e.getBoundingClientRect(); if (r.width > 2 && r.height > 2) rects.push(r); }
    else for (const n of e.childNodes) if (n.nodeType === 3 && n.textContent.trim()) { const g = document.createRange(); g.selectNodeContents(n); for (const r of g.getClientRects()) if (r.width > 1 && r.height > 1) rects.push(r); }
    for (const r0 of rects) { const r = clip(e, r0); if (r.right - r.left < 1 || r.bottom - r.top < 1 || r.bottom < 0 || r.top > H) continue; items.push({ e, r, layer: layerOf(e), icon }); }
  }
  // Text in einem Ring (Kreis mit Strich) ist gewollt, solange er den Strich nicht berührt
  const ringOk = (sv, t) => { if (sv.e.tagName.toLowerCase() !== 'svg' || t.icon) return false; const c = sv.e.querySelector('circle[r]'); if (!c) return false; const b = sv.e.getBoundingClientRect(); const vb = sv.e.viewBox && sv.e.viewBox.baseVal; const sc = b.width / ((vb && vb.width) || b.width); const inner = +c.getAttribute('r') * sc - parseFloat(getComputedStyle(c).strokeWidth || 0) * sc / 2; const cx = b.left + b.width / 2, cy = b.top + b.height / 2; return [[t.r.left, t.r.top], [t.r.right, t.r.top], [t.r.left, t.r.bottom], [t.r.right, t.r.bottom]].every(([x, y]) => Math.hypot(x - cx, y - cy) <= inner); };
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    const a = items[i], b = items[j]; if (a.e === b.e || a.layer !== b.layer || a.e.contains(b.e) || b.e.contains(a.e)) continue;
    const x = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left), y = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top); if (x <= 1.5 || y <= 1.5) continue;
    const sm = Math.min((a.r.right - a.r.left) * (a.r.bottom - a.r.top), (b.r.right - b.r.left) * (b.r.bottom - b.r.top)); if (x * y < 0.15 * sm) continue;
    if (ringOk(a, b) || ringOk(b, a)) continue;
    // Bild/Figur als Hintergrund-Kachel (großes SVG) gegen kleinen Text: nur melden, wenn wirklich gezeichnete Teile darunter liegen
    const big = [a, b].find(o => o.icon && (o.r.right - o.r.left) * (o.r.bottom - o.r.top) > 6 * sm);
    if (big) { const other = big === a ? b : a; let hit = false; for (const g of big.e.querySelectorAll('path,line,circle,rect,ellipse,polyline,polygon,text')) { const q = g.getBoundingClientRect(); if (q.width * q.height > 0.6 * (big.r.right - big.r.left) * (big.r.bottom - big.r.top)) continue; const xx = Math.min(q.right, other.r.right) - Math.max(q.left, other.r.left), yy = Math.min(q.bottom, other.r.bottom) - Math.max(q.top, other.r.top); if (xx > 2 && yy > 2) { hit = true; break; } } if (!hit) continue; }
    const cx = (Math.max(a.r.left, b.r.left) + Math.min(a.r.right, b.r.right)) / 2, cy = (Math.max(a.r.top, b.r.top) + Math.min(a.r.bottom, b.r.bottom)) / 2;
    out.push({ k: 'UEBERLAPPUNG', t: name(a.e) + ' <> ' + name(b.e), x: Math.round(cx), y: Math.round(cy) });
  }
  for (const e of document.body.querySelectorAll('*')) {
    if (!shown(e)) continue; const r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1) continue;
    if (r.right > W + 1 || r.left < -1) { let sc = false; for (let p = e.parentElement; p; p = p.parentElement) { const ox = getComputedStyle(p).overflowX; if (ox !== 'visible') { sc = true; break; } } if (!sc) out.push({ k: 'RAND', t: name(e) + ' ' + Math.round(r.left) + '..' + Math.round(r.right) + ' px', x: Math.round(Math.min(W - 5, Math.max(5, r.left))), y: Math.round(r.top + r.height / 2) }); }
  }
  if (document.documentElement.scrollWidth > W + 1) out.push({ k: 'SEITE', t: 'Seite breiter als Bildschirm: ' + document.documentElement.scrollWidth + ' px', x: W - 5, y: 50 });
  const seen = new Set(); return out.filter(o => { const s = o.k + o.t; if (seen.has(s)) return false; seen.add(s); return true; });
}
// Antippbare Elemente (sichtbar, nicht gefährlich) – stabile Kennung aus Text + Attributen
function clickables(skipSrc) {
  const SK = new RegExp(skipSrc, 'i');
  const sel = 'button, [role=button], a[href^="#"], [data-a], [onclick], summary, label[for], input[type=checkbox], input[type=radio], select';
  const out = [];
  for (const e of document.querySelectorAll(sel)) {
    const r = e.getBoundingClientRect(); if (r.width < 4 || r.height < 4 || e.disabled) continue;
    const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.pointerEvents === 'none') continue;
    const label = ((e.getAttribute('aria-label') || '') + ' ' + (e.innerText || e.value || '')).trim().replace(/\s+/g, ' ').slice(0, 50);
    if (SK.test(label) || SK.test(e.getAttribute('data-a') || '') || e.type === 'file') continue;
    const key = [e.tagName, e.getAttribute('data-a') || '', Object.entries(e.dataset || {}).map(x => x.join('=')).join('&'), label].join('|');
    out.push({ key, label: label || e.getAttribute('data-a') || e.tagName.toLowerCase() });
  }
  return out;
}

(async () => {
  const srv = await serve(); const base = 'http://127.0.0.1:' + srv.address().port + '/';
  const storage = opt.storage ? JSON.parse(fs.readFileSync(opt.storage, 'utf8')) : null;
  fs.mkdirSync(opt.out, { recursive: true });
  const browser = await chromium.launch(); let total = 0; const report = [];
  for (const pg of pages) for (const W of String(opt.width).split(',').map(Number)) {
    const ctx = await browser.newContext({ viewport: { width: W, height: 812 }, serviceWorkers: 'block' });
    // nur die eigene Testseite – alles Fremde (Server, GitHub, Worker) wird geblockt, Schriften dürfen fehlen
    await ctx.route('**/*', r => r.request().url().startsWith(base) ? r.continue() : r.abort());
    const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.dismiss().catch(() => {}));
    const fresh = async () => {
      await p.goto(base + pg);
      if (storage) await p.evaluate(s => { for (const [k, v] of Object.entries(s)) localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)); }, storage);
      await p.reload(); await p.waitForTimeout(700);
    };
    const finds = new Map();
    const check = async (where) => {
      for (const f of await p.evaluate(inPageCheck)) { const k = f.k + ' ' + f.t; if (!finds.has(k)) { const shot = path.join(opt.out, 'fund-' + (finds.size + 1) + '-' + W + '.png'); await p.screenshot({ path: shot, clip: { x: 0, y: Math.max(0, f.y - 120), width: W, height: 240 } }).catch(() => {}); finds.set(k, { ...f, where: [where], shot }); } else finds.get(k).where.push(where); }
      for (const e of errs.splice(0)) { const k = 'FEHLER ' + e; if (!finds.has(k)) finds.set(k, { k: 'FEHLER', t: e, where: [where] }); else finds.get(k).where.push(where); }
    };
    const clickKey = async (key) => p.evaluate(([key, skip]) => {
      const sel = 'button, [role=button], a[href^="#"], [data-a], [onclick], summary, label[for], input[type=checkbox], input[type=radio], select';
      for (const e of document.querySelectorAll(sel)) { const label = ((e.getAttribute('aria-label') || '') + ' ' + (e.innerText || e.value || '')).trim().replace(/\s+/g, ' ').slice(0, 50);
        const k = [e.tagName, e.getAttribute('data-a') || '', Object.entries(e.dataset || {}).map(x => x.join('=')).join('&'), label].join('|');
        if (k === key) { const r = e.getBoundingClientRect(); if (r.width < 4) continue; e.scrollIntoView({ block: 'center' }); e.click(); return true; } }
      return false; }, [key, SKIP.source]);
    await fresh(); await check('Start');
    const full = await p.evaluate(() => document.documentElement.scrollHeight); await p.setViewportSize({ width: W, height: Math.min(full, 4000) }); await p.waitForTimeout(150); await check('Start (ganze Seite)'); await p.setViewportSize({ width: W, height: 812 });
    const list = (await p.evaluate(clickables, SKIP.source)).slice(0, +opt.max); const done = new Set();
    for (const c of list) {
      if (done.has(c.key)) continue; done.add(c.key);
      await fresh(); if (!(await clickKey(c.key))) continue; await p.waitForTimeout(350); await check(c.label);
      if (opt.deep) { const before = new Set(list.map(x => x.key)); const inner = (await p.evaluate(clickables, SKIP.source)).filter(x => !before.has(x.key)).slice(0, 10);
        for (const d of inner) { if (await clickKey(d.key)) { await p.waitForTimeout(250); await check(c.label + ' > ' + d.label); } } }
    }
    for (const f of finds.values()) { total++; report.push({ seite: pg, breite: W, ...f }); console.log(`[${pg} @${W}] ${f.k}: ${f.t}\n     bei: ${f.where.slice(0, 3).join(' | ')}${f.where.length > 3 ? ' (+' + (f.where.length - 3) + ')' : ''}${f.shot ? '\n     Foto: ' + f.shot : ''}`); }
    console.log(`[${pg} @${W}] ${list.length} Knöpfe geprüft, ${finds.size} Funde`);
    await ctx.close();
  }
  fs.writeFileSync(path.join(opt.out, 'bericht.json'), JSON.stringify(report, null, 1));
  console.log(total ? `\n${total} Funde – Bericht: ${path.join(opt.out, 'bericht.json')}` : '\nKeine Funde.');
  await browser.close(); srv.close(); process.exit(total ? 1 : 0);
})();
