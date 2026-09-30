// Prüft „Stelle genauer ansehen“: nach dem normalen Lauf wird um jedes fehlende Maß ein Rahmen gezogen
const { chromium, devices } = require('/opt/node22/lib/node_modules/playwright');
const OUT = __dirname + '/out';
const R = (x0, y0, x1, y1) => ({ x: x0 / 1600, y: y0 / 1100, w: (x1 - x0) / 1600, h: (y1 - y0) / 1100 });
const PL = { 'R5': R(305, 265, 370, 315), 'Ø6,6': R(305, 705, 440, 755), 'Ø10 H7': R(815, 125, 960, 175) };
const PA = { 'Ø40 H8/f7': R(1145, 195, 1310, 242), '45 ±0,2': R(685, 795, 815, 842) };
const T = [
  [1, 'png', PL], [6, 'jpg', PL], [9, 'jpg', PL], [16, 'jpg', PL],
  [11, 'png', { '150': R(705, 175, 795, 222), 'Ø32 H7': R(935, 445, 1065, 492), 'R8': R(315, 325, 385, 372) }],
  [2, 'png', { 'Ø20 g6': R(1285, 470, 1330, 580), '150': R(705, 815, 795, 862) }],
  [7, 'jpg', { 'Ø20 g6': R(1285, 470, 1330, 580), '150': R(705, 815, 795, 862) }],
  [3, 'png', { '90°': R(485, 605, 560, 652) }],
  [4, 'png', { '40 +0,2/0': R(905, 110, 1010, 160) }],
  [10, 'png', PA], [17, 'jpg', PA]
];
const only = process.argv[2] ? process.argv[2].split(',').map(Number) : null;
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 13'] });
  const app = await ctx.newPage();
  const errs = [];
  app.on('pageerror', e => errs.push(e.message));
  await app.goto('http://localhost:8766/index.html?debug');
  await app.evaluate(() => localStorage.clear());
  await app.reload();
  await app.click('[data-tab="apply"]');
  await app.click('[data-sec="foto"]');
  let ok = 0, all = 0, alt = 0;
  for (const [id, ext, regs] of T) {
    if (only && !only.includes(id)) continue;
    const fs = require('fs');
    const file = `${OUT}/d${id}.${fs.existsSync(`${OUT}/d${id}.${ext}`) ? ext : ext === 'png' ? 'jpg' : 'png'}`;
    await app.setInputFiles('#foto-lib', file);
    await app.waitForSelector('[data-act="foto-go"]', { timeout: 20000 });
    await app.click('[data-act="foto-go"]');
    await app.waitForTimeout(150);
    await app.waitForFunction(() => !document.querySelector('.ocr-progress'), null, { timeout: 180000 });
    const labels = () => app.evaluate(() => JSON.parse(localStorage.getItem('tol.apply')).foto.items.map(i => i.label));
    const before = await labels();
    console.log(`d${id}: vorher ${before.join(' | ')}`);
    for (const [want, sel] of Object.entries(regs)) {
      if (before.includes(want)) continue;
      all++;
      const t0 = Date.now();
      await app.evaluate(s => { window.__FOTO.sel = s; window.__FOTO.selMode = true; return window.__FOTO.regionSearch(); }, sel);
      await app.waitForFunction(() => !window.__FOTO.busy, null, { timeout: 180000 });
      const after = await labels();
      const msg = await app.evaluate(() => window.__FOTO.regionMsg.replace(/<[^>]+>/g, '') + (window.__FOTO.regionAlts.length ? '  [andere: ' + window.__FOTO.regionAlts.map(a => a.label).join(', ') + ']' : ''));
      const rl = await app.evaluate(() => (window.__FOTO.rlines || []).map(l => l.run + ":" + l.text.trim() + "(" + Math.round(l.conf) + ")").join("  "));
      console.log("        gelesen: " + rl);
      const hit = after.includes(want) || await app.evaluate(w => window.__FOTO.regionAlts.some(a => a.label === w), want);
      const top = after.includes(want);
      if (top) ok++; else if (hit) alt++;
      console.log(`   ${top ? 'OK  ' : hit ? 'AUSW' : 'FEHL'} ${want.padEnd(10)} ${((Date.now() - t0) / 1000).toFixed(1)} s  → ${msg}`);
      console.log(`        Liste: ${after.join(' | ')}`);
    }
  }
  console.log(`\nNachsuchen: ${ok}/${all} fehlende Maße direkt gefunden, ${alt} weitere als Auswahl angeboten`, errs.length ? errs : '');
  await b.close();
})();
