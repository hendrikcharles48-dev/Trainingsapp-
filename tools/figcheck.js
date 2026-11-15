#!/usr/bin/env node
/* Figuren-Prüfung (Nutzerwunsch 15.11.: Ausrichtung von Brustkorb, Ellbogen, Knien und Füßen).
   node tools/figcheck.js                 → prüft alle Übungen (alle Bilder der Bewegung), listet Auffälligkeiten
   node tools/figcheck.js <id> [<id> …]   → nur diese Übungen, mit Gelenkwerten
   node tools/figcheck.js --sheet <datei.html> [<id> …] → Übersichtsseite (groß, Start- und Endbild) zum Ansehen
     (mit Playwright fotografieren: Figuren brauchen die CSS-Farben aus index.html – sind in der Seite eingebettet)

   Regeln (Seitenansicht; Vorderseite = Blickrichtung fd, auf jedes Glied gedreht):
   - Knie beugt nur nach hinten: der Unterschenkel geht bei gebeugtem Knie zur Rückseite des Oberschenkels.
   - Ellbogen beugt nur nach vorn: der Unterarm geht zur Vorderseite des Oberarms.
   - Füße zeigen nach vorn: Zehen zur Vorderseite des Unterschenkels (außer Zehenstand/Spitzfuß `tp`).
   - Brustkorb: Bauchlage/brustgestützt → Brust zeigt nach unten bzw. zum Polster; Rückenlage/Bankdrücken → nach oben.
   Frontansichten (`fr`) werden übersprungen. */
'use strict';
const fs = require('fs'), path = require('path');
global.window = global;
require(path.join(__dirname, '..', 'exercises.js'));
require(path.join(__dirname, '..', 'figures.js'));
const D = window.EXDB, F = window.FIG;

const rot = (v, a) => { const c = Math.cos(a * Math.PI / 180), s = Math.sin(a * Math.PI / 180); return [v[0] * c - v[1] * s, v[0] * s + v[1] * c]; };
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const nrm = v => { const n = Math.hypot(v[0], v[1]) || 1; return [v[0] / n, v[1] / n]; };
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const ang = (a, b) => Math.acos(Math.max(-1, Math.min(1, dot(nrm(a), nrm(b))))) * 180 / Math.PI;

const PRONE = /bauchlage|brustgest|seal|prone|liegestütz|push.?up|plank|planke|unterarmstütz|t-bar|superman|reverse.?hyper|nordic|kriech/i;
const SUPINE = /rückenlage|bankdrück|bench.?press|floor.?press|hüftheben|glute.?bridge|hip.?thrust|crunch|dead.?bug|pullover|fliegende|flys?\b|beinheben liegend|schulterbrücke/i;

// Von Hand im Bild geprüft (15.11.2026): Oberarm gedreht (Stange auf dem Rücken, über Kopf, Face Pull, Arme auf der Bank,
// Hang am Ring/an der Stange) – Ellbogen in der Seitenansicht richtig; bzw. Brust bewusst nach unten (Ring-Flys, Kabel-Crunch).
const OK_ELBOW = new Set(['cable-high-row', 'face-pull', 'ring-curl', 'cable-oh-ext', 'db-oh-ext', 'ring-tri-ext', 'back-squat', 'box-squat',
  'glute-bridge', 'sl-hip-thrust', 'db-hip-thrust', 'bb-hip-thrust', 'machine-hip-thrust', 'frog-pump', 'db-glute-bridge', 'sliding-curl',
  'ring-leg-curl', 'adv-tuck-fl', 'straddle-fl', 'full-fl', 'skin-cat']);
const OK_CHEST = new Set(['ring-fly', 'cable-crunch']);
function check(ex) {
  const tpl = F._resolve(ex); if (!tpl || !tpl.k) return [];
  const out = []; const K = tpl.k;
  if (K[0].fr) return out;
  const frames = F._frames(K, 6);
  frames.forEach((J, fi) => {
    const tag = 'Bild ' + fi;
    const down = nrm(sub(J.hip, J.sh)); const sg = dot(rot(down, -90), J.fd) >= 0 ? 1 : -1;
    const ant = v => rot(nrm(v), -90 * sg); // Vorderseite eines Glieds
    for (const i of [0, 1]) {
      const side = i ? 'hinter' : 'vorder';
      const th = sub(J.kn[i], J.hips[i]), sk = sub(J.an[i], J.kn[i]);
      if (ang(th, sk) > 15 && ang(th, sk) <= 140 && dot(nrm(sk), ant(th)) > 0.2) out.push(`${tag}: ${side}es Knie knickt nach vorn durch`);
      const ua = sub(J.el[i], J.shs[i]), fa = sub(J.ha[i], J.el[i]);
      if (!OK_ELBOW.has(ex.id) && ang(ua, fa) > 15 && dot(nrm(fa), ant(ua)) < -0.2) out.push(`${tag}: ${side}er Ellbogen knickt nach hinten durch`);
      const tp = K.some(k => k.tp && k.tp[i] > 0.5);
      if (!tp && dot(nrm(sub(J.to[i], J.an[i])), ant(sk)) < -0.3) out.push(`${tag}: ${side}er Fuß zeigt nach hinten`);
    }
    const tr = nrm(sub(J.sh, J.hip)); const flat = Math.abs(tr[1]) < 0.6;
    const nm = ex.name + ' ' + (ex.alias || []).join(' ') + ' ' + (ex.d || '');
    if (OK_CHEST.has(ex.id)) return;
    if (flat && PRONE.test(nm) && !SUPINE.test(ex.name) && J.fd[1] < 0.2) out.push(`${tag}: Brust sollte nach unten/zum Polster zeigen (Bauchlage)`);
    if (flat && SUPINE.test(ex.name) && !PRONE.test(ex.name) && J.fd[1] > -0.2) out.push(`${tag}: Brust sollte nach oben zeigen (Rückenlage)`);
  });
  // gleiche Meldung aus mehreren Bildern zusammenfassen
  const by = {}; for (const m of out) { const [f, t] = m.split(': '); (by[t] = by[t] || []).push(f.replace('Bild ', '')); }
  return Object.entries(by).map(([t, f]) => `${t} (Bild ${f.length > 4 ? f[0] + '–' + f[f.length - 1] : f.join(', ')})`);
}

const args = process.argv.slice(2);
if (args[0] === '--sheet') {
  const file = args[1]; const ids = args.slice(2); const list = ids.length ? ids.map(id => D.byId[id]).filter(Boolean) : D.list;
  const css = (fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8').match(/<style>([\s\S]*?)<\/style>/) || [, ''])[1];
  const cells = list.map(ex => { const n = F._resolve(ex).k.length; return `<div class="c"><b>${ex.id}</b><span>${ex.name}</span><div class="r">${[0, n - 1].map(f => `<div class="figtile">${F.svg(ex, { frame: f })}</div>`).join('')}</div><i>${check(ex).join('<br>')}</i></div>`; }).join('');
  fs.writeFileSync(file, `<!doctype html><meta charset="utf-8"><style>${css}body{background:#090B0F;color:#EEF2F7;font:13px Inter,system-ui;padding:12px}.g{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.c{background:#12161D;border-radius:14px;padding:10px}.c b{display:block}.c span{color:#8D97A8}.r{display:flex;gap:6px;margin-top:6px}.r .figtile{flex:1;aspect-ratio:1;border-radius:10px}.r svg{width:100%;height:100%}i{color:#D98F8F;font-style:normal;font-size:12px}</style><div class="g">${cells}</div>`);
  console.log('Übersicht: ' + file + ' (' + list.length + ' Übungen)');
} else {
  const list = args.length ? args.map(id => D.byId[id]).filter(Boolean) : D.list;
  let bad = 0;
  for (const ex of list) { const r = check(ex); if (r.length) { bad++; console.log(ex.id + ' – ' + ex.name + '\n  ' + r.join('\n  ')); } }
  console.log(`\n${list.length} Übungen geprüft, ${bad} auffällig.`);
  process.exitCode = bad ? 1 : 0;
}
