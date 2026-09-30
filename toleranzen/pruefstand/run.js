// Prüfstand: rendert die Testzeichnungen, lässt sie durch die App laufen und vergleicht mit dem Soll
const { chromium, devices } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const D = require('./drawings.js');
const OUT = __dirname + '/out';
fs.mkdirSync(OUT, { recursive: true });
const only = process.argv[2] ? process.argv[2].split(',').map(Number) : null;

function page(d) {
  const fx = d.fx || {};
  const sc = fx.scale || 1;
  let html = d.html;
  if (fx.paper) html = html.replace('background:#fff', 'background:transparent');
  const tf = [];
  if (sc !== 1) tf.push(`scale(${sc})`);
  if (fx.rot) tf.push(`rotate(${fx.rot}deg)`);
  if (fx.persp) tf.push('perspective(1800px) rotateX(14deg) rotateY(-9deg)');
  const filt = [];
  if (fx.blur) filt.push(`blur(${fx.blur}px)`);
  if (fx.contrast) filt.push(`contrast(${fx.contrast})`);
  return `<html><body style="margin:0;background:${fx.paper ? '#d9d4c7' : '#fff'};width:${Math.round(1600 * sc)}px;height:${Math.round(1100 * sc)}px;overflow:hidden;position:relative">
    <div style="width:1600px;height:1100px;transform-origin:${sc !== 1 ? '0 0' : '50% 50%'};transform:${tf.join(' ') || 'none'};filter:${filt.join(' ') || 'none'}">${html}</div>
    ${fx.shadow ? '<div style="position:absolute;inset:0;background:linear-gradient(115deg,rgba(0,0,0,.5),rgba(0,0,0,0) 65%);mix-blend-mode:multiply"></div>' : ''}
    ${fx.noise ? `<canvas id="n" width="${Math.round(1600 * sc)}" height="${Math.round(1100 * sc)}" style="position:absolute;inset:0;opacity:${fx.noise}"></canvas><script>const c=document.getElementById('n'),x=c.getContext('2d'),d=x.createImageData(c.width,c.height);for(let i=0;i<d.data.length;i+=4){const v=Math.random()*255;d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=255}x.putImageData(d,0,0)</script>` : ''}
  </body></html>`;
}

(async () => {
  const b = await chromium.launch();
  const render = await b.newPage();
  const ctx = await b.newContext({ ...devices['iPhone 13'] });
  const app = await ctx.newPage();
  const errs = [];
  app.on('pageerror', e => errs.push(e.message));
  await app.goto('http://localhost:8766/index.html?debug');
  await app.evaluate(() => localStorage.clear());
  await app.reload();
  await app.click('[data-tab="apply"]');
  await app.click('[data-sec="foto"]');
  const results = [];
  for (const d of D) {
    if (only && !only.includes(d.id)) continue;
    const fx = d.fx || {};
    const sc = fx.scale || 1;
    await render.setViewportSize({ width: Math.round(1600 * sc), height: Math.round(1100 * sc) });
    await render.setContent(page(d));
    await render.waitForTimeout(150);
    const file = `${OUT}/d${d.id}.${fx.jpeg ? 'jpg' : 'png'}`;
    await render.screenshot(fx.jpeg ? { path: file, type: 'jpeg', quality: fx.jpeg } : { path: file });
    const t0 = Date.now();
    await app.setInputFiles('#foto-lib', file);
    await app.waitForTimeout(100);
    await app.waitForFunction(() => !document.querySelector('.ocr-progress'), null, { timeout: 180000 });
    const sec = (Date.now() - t0) / 1000;
    const st = await app.evaluate(() => {
      const a = JSON.parse(localStorage.getItem('tol.apply'));
      return { items: a.foto.items.map(i => ({ label: i.label, guess: !!i.guess, hits: i.hits, conf: Math.round(i.conf), count: i.count })), detected: a.foto.detected, lines: (window.__FOTO.lines || []).map(l => [l.text.trim(), Math.round(l.conf), l.minPlainConf === 70 ? 'senkrecht' : 'waagrecht']), error: window.__FOTO.error };
    });
    const labels = st.items.map(i => i.label);
    const found = d.expect.filter(e => labels.includes(e));
    const missing = d.expect.filter(e => !labels.includes(e));
    const extra = labels.filter(l => !d.expect.includes(l));
    const gen = st.detected ? st.detected.ml + (st.detected.hk || '') : null;
    const genOk = (d.general || null) === gen;
    const i22081 = /22081/.test(st.error || '');
    results.push({ items: st.items, id: d.id, name: d.name, sec, expect: d.expect.length, found: found.length, missing, extra, gen, genOk, i22081Ok: !d.iso22081 || i22081, guesses: st.items.filter(i => i.guess).map(i => i.label), lines: st.lines });
  }
  fs.writeFileSync(OUT + '/results.json', JSON.stringify(results, null, 1));
  let tf = 0, te = 0, tx = 0, tg = 0;
  results.forEach(r => {
    tf += r.found; te += r.expect; tx += r.extra.length; tg += r.genOk ? 1 : 0;
    console.log(`${String(r.id).padStart(2)} ${r.name.padEnd(48)} ${r.found}/${r.expect} gefunden, ${r.extra.length} zu viel, Schriftfeld ${r.genOk ? 'ok' : 'FALSCH (' + r.gen + ')'}${r.i22081Ok ? '' : ', 22081 fehlt'}, ${r.sec.toFixed(1)} s`);
    if (r.missing.length) console.log('     fehlt:    ', r.missing.join(' | '));
    if (r.extra.length) console.log('     zu viel:  ', r.extra.join(' | '));
    console.log('     alle:     ', r.items.map(i => i.label + '[' + i.hits + '/' + i.conf + (i.count > 1 ? ' ' + i.count + 'x' : '') + ']').join(' '));
  });
  console.log(`\nGESAMT: ${tf}/${te} Maße gefunden (${Math.round(tf / te * 100)} %), ${tx} falsche zusätzlich, Schriftfeld ${tg}/${results.length} richtig`, errs.length ? errs : '');
  await b.close();
})();
