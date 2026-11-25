// Geldwerk – Oberflächen-Durchlauf als neuer Nutzer im iPhone-Format (390 × 844) mit nachgebautem GitHub.
// Start: Server im Repo-Root (python3 -m http.server 8123), dann: node geldwerk/test/ui.js [Ordner-für-Bilder]
// Prüft: Einrichtung, Beleg per Foto (echte Texterkennung), PDF-Rechnung, Block, 2 Verträge, Steuer-Reiter, Mappe-PDF,
// Löschen und Wiederherstellen aus der Sicherung. Dazu je Bildschirm: Überlappungen, zu kleine Tippflächen, abgeschnittene Texte.
'use strict';
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const MP = require('../mappe.js');
const OUT = process.argv[2] || path.join(__dirname, 'shots');
fs.mkdirSync(OUT, { recursive: true });
const BASE = process.env.GW_URL || 'http://127.0.0.1:8123/geldwerk/';
let failures = 0; const notes = [];
const ok = (c, m) => { if (!c) { failures++; console.log('✗ ' + m); } else console.log('✓ ' + m); };

// ---- nachgebautes GitHub (privates Repository) ----
const gh = { files: {}, sha: 0 };
async function ghRoute(route) {
  const req = route.request(), url = new URL(req.url()), p = url.pathname, method = req.method();
  const json = (status, body) => route.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(body) });
  if (method === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,PUT' } });
  if (req.headers().authorization !== 'Bearer github_pat_TEST') return json(401, {});
  if (p === '/repos/tester/Geldwerk-Daten') return json(200, { private: true, permissions: { push: true } });
  const m = /^\/repos\/tester\/Geldwerk-Daten\/contents\/(.+)$/.exec(p); if (!m) return json(404, {});
  const name = decodeURIComponent(m[1]);
  if (method === 'GET') {
    const f = gh.files[name]; if (!f) return json(404, {});
    if (/raw/.test(req.headers().accept || '')) return route.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*' }, body: Buffer.from(f.b64, 'base64') });
    return json(200, { sha: f.sha, content: f.b64, encoding: 'base64' });
  }
  const b = JSON.parse(req.postData());
  const f = gh.files[name];
  if (f && name !== 'geldwerk-daten.json') return json(422, {});
  if (f && f.sha !== b.sha) return json(409, {});
  gh.files[name] = { sha: 's' + (++gh.sha), b64: b.content };
  return json(201, {});
}

// ---- Prüfungen je Bildschirm ----
async function audit(page, name) {
  const r = await page.evaluate(() => {
    const out = { small: [], overflow: [], hscroll: document.documentElement.scrollWidth > innerWidth + 1, overlap: [] };
    const root = document.querySelector('#sheet:not([hidden])') || document.querySelector('#page:not([hidden])') || document;
    const vis = el => { const s = getComputedStyle(el); const b = el.getBoundingClientRect(); return s.visibility !== 'hidden' && s.display !== 'none' && b.width > 0 && b.height > 0 && b.bottom > 0 && b.top < innerHeight; };
    for (const el of root.querySelectorAll('button, a, input, select, textarea, [data-a]')) {
      if (!vis(el) || el.closest('.cal') && el.classList.contains('pad')) continue;
      const b = el.getBoundingClientRect();
      if ((b.height < 43.5 && !el.matches('input[type=date]')) || (b.width < 43.5 && !el.closest('.chips,.seg'))) out.small.push((el.dataset.a || el.tagName) + ' ' + Math.round(b.width) + '×' + Math.round(b.height) + ' „' + (el.textContent || el.value || '').trim().slice(0, 20) + '“');
    }
    for (const el of root.querySelectorAll('.t, .s, .v, h1, h2, .big, .mid, .lbl, .btn, .chip, .tag, .sub, .q, .lead, label > span')) {
      if (!vis(el)) continue;
      if (el.scrollWidth > el.clientWidth + 1 && !el.classList.contains('ell')) out.overflow.push(el.className + ' „' + el.textContent.trim().slice(0, 30) + '“');
      const b = el.getBoundingClientRect(); if (b.right > innerWidth + 0.5 || b.left < -0.5) out.overflow.push('außerhalb: ' + el.className + ' „' + el.textContent.trim().slice(0, 30) + '“');
    }
    // Tab-Leiste/Aktionsleiste darf Inhalte am Ende nicht verdecken
    const tb = document.querySelector('.tabbar'); const tbv = tb && getComputedStyle(tb).visibility !== 'hidden' && !document.body.classList.contains('overlay');
    if (tbv) { const last = [...document.querySelectorAll('#view > *')].pop(); if (last) { window.scrollTo(0, document.body.scrollHeight); const lb = last.getBoundingClientRect(); if (lb.bottom > tb.getBoundingClientRect().top + 1) out.overlap.push('letzter Inhalt unter der Tab-Leiste'); window.scrollTo(0, 0); } }
    return out;
  });
  const issues = [...r.small.map(x => 'Tippfläche zu klein: ' + x), ...r.overflow.map(x => 'abgeschnitten: ' + x), ...(r.hscroll ? ['waagerechtes Scrollen'] : []), ...r.overlap];
  if (issues.length) { notes.push(name + ':\n   ' + issues.join('\n   ')); }
  return issues;
}
async function shot(page, name, full) {
  await page.waitForTimeout(350);
  await page.screenshot({ path: path.join(OUT, name + '.png'), fullPage: !!full });
  const i = await audit(page, name);
  console.log('  ' + name + (i.length ? ' – ' + i.length + ' Hinweise' : ' – ohne Befund'));
}
const tap = async (page, sel) => { await page.locator(sel).first().click(); await page.waitForTimeout(250); };

(async () => {
  // Testbilder: Kassenbon als Foto, Rechnung als PDF
  const browser = await chromium.launch();
  const helper = await browser.newPage({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 2 });
  await helper.setContent(`<div id="r" style="width:360px;padding:26px 22px;background:#fbfaf6;font:20px/1.45 'DejaVu Sans Mono',monospace;color:#111">
    <div style="text-align:center;font-weight:bold;font-size:28px">THALIA</div><div style="text-align:center">Bücher GmbH<br>Weender Str. 12<br>37073 Göttingen</div><br>
    Tabellenbuch Metall<span style="float:right">49,90</span><br>Fachkunde Metall<span style="float:right">42,00</span><br>------------------------------<br>
    <b>SUMME EUR<span style="float:right">91,90</span></b><br>MwSt 7% <span style="float:right">6,01</span><br>Gegeben BAR<span style="float:right">100,00</span><br>Rückgeld<span style="float:right">8,10</span><br><br>
    14.11.2026 15:32 Kasse 2</div>`);
  const receiptPng = path.join(OUT, '_kassenbon.png');
  await helper.locator('#r').screenshot({ path: receiptPng });
  await helper.close();
  const d = MP.PDF.doc(); const pg = d.page();
  [['Würth GmbH – Rechnung', 16, true], ['Rechnungsdatum: 03.11.2026', 11], ['Bestellnummer 4711', 11], ['Messschieber digital 150 mm   1 x 89,90', 11], ['Versand 4,90', 11], ['Rechnungsbetrag 94,80 EUR', 12, true]].forEach(([t, s, b], i) => pg.text(60, 70 + i * 26, t, { size: s, bold: b }));
  const pdfPath = path.join(OUT, '_rechnung.pdf'); fs.writeFileSync(pdfPath, d.build());

  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, locale: 'de-DE', timezoneId: 'Europe/Berlin',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1', permissions: ['clipboard-read', 'clipboard-write'] });
  await ctx.route('https://api.github.com/**', ghRoute);
  // Fremde Apps auf derselben Adresse: deren Daten dürfen nicht angefasst werden
  await ctx.addInitScript(() => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('satzwerk.profile', '{"x":1}'); localStorage.setItem('kochwerk_db', '{"y":2}'); sessionStorage.setItem('seeded', '1'); } });
  let page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('response', r => { if (r.status() >= 400 && !/api\.github\.com/.test(r.url())) errs.push(r.status() + ' ' + r.url()); });
  await page.goto(BASE); await page.waitForSelector('.setup');
  await shot(page, '01-einrichtung-start');
  await tap(page, '[data-a=setupNext]');
  await shot(page, '02-km-arbeit');
  await page.fill('[data-in=setKm][data-k=kmWork]', '28,6'); await tap(page, '[data-a=setupNext]');
  await shot(page, '03-arbeitszeit'); await tap(page, '[data-a=setupNext]');
  await shot(page, '04-urlaub'); await tap(page, '[data-a=setupNext]');
  await page.fill('[data-in=setKm][data-k=kmSchool]', '21'); await shot(page, '05-km-schule'); await tap(page, '[data-a=setupNext]');
  await shot(page, '06-schulzeit'); await tap(page, '[data-a=setupNext]');
  await shot(page, '07-minijob'); await tap(page, '[data-a=setupNext]');
  await page.fill('[data-in=lst][data-k=gross]', '22.400'); await page.fill('[data-in=lst][data-k=lst]', '2.380'); await shot(page, '08-lohn'); await tap(page, '[data-a=setupNext]');
  await page.fill('[data-in=pf][data-k=repo]', 'tester/Geldwerk-Daten'); await page.fill('[data-in=pf][data-k=token]', 'github_pat_TEST');
  await tap(page, '[data-a=syncConnect]'); await page.waitForTimeout(800);
  await shot(page, '09-sicherung');
  ok(await page.locator('text=Verbunden').count() > 0, 'Sicherung verbunden');
  await tap(page, '[data-a=setupNext]');
  await shot(page, '10-mitteilungen'); await tap(page, '[data-a=setupNext][data-skip]');
  await shot(page, '11-fertig');
  const tripsTxt = await page.locator('#page .card').first().innerText();
  ok(/Arbeitstage/.test(tripsTxt), 'Fahrten nach der Einrichtung berechnet: ' + tripsTxt.replace(/\s+/g, ' '));
  await tap(page, '[data-a=setupFinish]');
  await shot(page, '12-uebersicht-leer');

  // Beleg per Foto (echte Texterkennung)
  await tap(page, '.tabbar .plus'); await shot(page, '13-plus-blatt');
  const t0 = Date.now();
  await page.locator('#f-cam').setInputFiles(receiptPng);
  await page.waitForSelector('.page .ocr'); await shot(page, '14-beleg-erkennung');
  await page.waitForFunction(() => { const o = document.querySelector('#page .ocr'); return o && !o.querySelector('.spin'); }, null, { timeout: 120000 });
  console.log('  Texterkennung: ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');
  await shot(page, '15-beleg-erkannt');
  const amt = await page.inputValue('[data-in=rf][data-k=amount]'), mer = await page.inputValue('[data-in=rf][data-k=merchant]'), dat = await page.inputValue('[data-ch=rfDate]');
  ok(amt === '91,9' || amt === '91,90', 'Betrag erkannt: ' + amt); ok(/thalia/i.test(mer), 'Händler erkannt: ' + mer); ok(dat === '2026-11-14', 'Datum erkannt: ' + dat);
  ok(await page.locator('[data-a=rCat].on[data-c=fachbuch]').count() === 1, 'Kategorie Fachbücher vorgeschlagen');
  await tap(page, '[data-a=receiptSave]'); // „Passt“
  ok(await page.evaluate(() => Object.values(window.__gw.st.db.receipts).length) === 1, 'Kassenbon mit einem Tipp gespeichert');

  // PDF-Rechnung
  await tap(page, '.tabbar .plus'); await page.locator('#f-file').setInputFiles(pdfPath);
  await page.waitForFunction(() => { const o = document.querySelector('#page .ocr'); return o && !o.querySelector('.spin'); }, null, { timeout: 120000 });
  await shot(page, '16-pdf-erkannt');
  ok((await page.inputValue('[data-in=rf][data-k=amount]')).startsWith('94,8'), 'PDF: Betrag ' + await page.inputValue('[data-in=rf][data-k=amount]'));
  ok(await page.inputValue('[data-ch=rfDate]') === '2026-11-03', 'PDF: Datum');
  ok(await page.locator('.seg button.on', { hasText: 'Online' }).count() === 1, 'PDF: Online-Kauf erkannt');
  await tap(page, '[data-a=receiptSave]');

  // Block: Lohnsteuerbescheinigung + Kfz-Vertrag + Beleg ohne Foto
  await tap(page, '.tabbar .plus'); await tap(page, '[data-a=openBlock]');
  await page.fill('textarea[data-in=blockText]', '#GELDWERK\ntyp: Lohnsteuerbescheinigung\njahr: 2026\nbruttolohn: 22.416,00\nlohnsteuer: 2.391,50\nrentenversicherung: 2.084,69\nkrankenversicherung: 1.961,40\npflegeversicherung: 537,98\narbeitslosenversicherung: 291,41\n#ENDE\n\n#GELDWERK\ntyp: Vertrag\nvorlage: Kfz-Versicherung\nanbieter: HUK-Coburg\nbetrag: 456,12\nrhythmus: jährlich\nkündigungsfrist: 1 Monat\nablauf: 31.12.\nsteuerlich: ja\n#ENDE\n\n#GELDWERK\ntyp: Beleg\nhändler: Technikakademie Northeim\nbetrag: 1.450,00\ndatum: 15.08.2026\nkategorie: Lehrgang\n#ENDE');
  await page.waitForTimeout(700);
  await shot(page, '17-block-vorschau', true);
  await tap(page, '[data-a=applyBlock]');
  ok(await page.evaluate(() => window.__gw.st.db.tax[2026].gross) === 22416, 'Block: Lohnsteuerbescheinigung übernommen');

  // Zweiter Vertrag per Hand: Handy
  await tap(page, '.tabbar [data-tab=vertraege]'); await shot(page, '18-vertraege');
  await tap(page, '[data-a=newContract]'); await tap(page, '[data-a=cTpl][data-t=handy]');
  await page.fill('[data-in=cf][data-k=provider]', 'Telekom'); await page.fill('[data-in=cf][data-k=amount]', '29,95');
  await page.locator('[data-ch=cStart]').fill('2025-03-15'); await page.locator('[data-ch=cStart]').dispatchEvent('change');
  await shot(page, '19-vertrag-neu', true);
  await tap(page, '[data-a=contractSave]');
  await shot(page, '20-vertraege-liste');
  ok(await page.locator('#view .row').count() === 2, '2 Verträge');
  await tap(page, '#view [data-a=openContract]'); await tap(page, '[data-a=cCancelSheet]'); await shot(page, '21-kuendigung'); await tap(page, '#sheet'); await page.mouse.click(195, 30); await page.waitForTimeout(200);
  if (await page.locator('#sheet:not([hidden])').count()) await page.evaluate(() => document.querySelector('#sheet').click());
  await tap(page, '[data-a=back]');

  // Belege, Steuer, Kalender, Spickzettel, Mappe
  await tap(page, '.tabbar [data-tab=belege]'); await shot(page, '22-belege');
  await page.fill('[data-in=q]', 'würth'); await page.waitForTimeout(200); ok(await page.locator('#rlist .row').count() === 1, 'Suche findet PDF-Rechnung'); await page.fill('[data-in=q]', '');
  await tap(page, '.tabbar [data-tab=steuer]'); await shot(page, '23-steuer'); await shot(page, '23b-steuer-ganz', true);
  const hero = await page.locator('.hero').innerText();
  ok(/zurück|nach/.test(hero), 'Steuer-Reiter zeigt Schätzung: ' + hero.replace(/\s+/g, ' ').slice(0, 90));
  ok(await page.locator('text=Keine Steuerberatung').count() > 0, 'Hinweis „Keine Steuerberatung“ sichtbar');
  await tap(page, '[data-a=year][data-y="2027"]'); await shot(page, '23c-steuer-2027');
  ok(/verlustvortrag/i.test(await page.locator('.hero').innerText()), '2027 ohne Lohn: Verlustvortrag angezeigt');
  await tap(page, '[data-a=year][data-y="2026"]');
  await tap(page, '[data-a=openCal]'); await shot(page, '24-kalender');
  await tap(page, '.cal .d.school'); await shot(page, '25-tag'); await tap(page, '[data-a=setExc][data-t=krank]');
  await tap(page, '[data-a=back]');
  await tap(page, '[data-a=rules]'); await shot(page, '26-regeln'); await tap(page, '[data-a=back]');
  await tap(page, '[data-a=cheat]'); await shot(page, '27-spickzettel', true); await tap(page, '[data-a=back]');
  await tap(page, '[data-a=mappe]');
  await page.waitForSelector('[data-a=mappeShare]', { timeout: 30000 }); await shot(page, '28-mappe');
  const pdfInfo = await page.evaluate(async () => { const b = window.__gw.st.mappeBlob; const t = new TextDecoder('latin1').decode(new Uint8Array(await b.arrayBuffer())); return { size: b.size, head: t.slice(0, 8), pages: (/\/Count (\d+)/.exec(t) || [])[1], images: (t.match(/\/Subtype \/Image/g) || []).length }; });
  ok(pdfInfo.head === '%PDF-1.4' && pdfInfo.images >= 2, 'Steuermappe-PDF: ' + JSON.stringify(pdfInfo));
  const pdfB64 = await page.evaluate(async () => { const b = new Uint8Array(await window.__gw.st.mappeBlob.arrayBuffer()); let s = ''; for (const x of b) s += String.fromCharCode(x); return btoa(s); });
  fs.writeFileSync(path.join(OUT, 'Steuermappe-2026.pdf'), Buffer.from(pdfB64, 'base64'));
  await page.evaluate(() => document.querySelector('#sheet').click());
  await tap(page, '.tabbar [data-tab=home]'); await shot(page, '29-uebersicht');
  await tap(page, '[data-a=settings]'); await shot(page, '30-einstellungen', true);

  // Sicherung abwarten, dann alles löschen und wiederherstellen
  await page.evaluate(() => { document.dispatchEvent(new Event('visibilitychange')); });
  await tap(page, '[data-a=syncNow]'); await page.waitForTimeout(2500);
  const backedUp = Object.keys(gh.files);
  ok(backedUp.includes('geldwerk-daten.json') && backedUp.filter(f => f.startsWith('belege/')).length >= 3, 'Im Repository: ' + backedUp.length + ' Dateien (Daten + Fotos/PDF)');
  const before = await page.evaluate(() => ({ r: Object.values(window.__gw.st.db.receipts).filter(x => !x.del).length, c: Object.values(window.__gw.st.db.contracts).filter(x => !x.del).length, km: window.__gw.st.db.settings.kmWork }));
  await tap(page, '[data-a=wipeAsk]'); await shot(page, '31-loeschen'); await tap(page, '[data-a=confirmYes]');
  await page.waitForSelector('.setup', { timeout: 10000 });
  ok(await page.evaluate(() => localStorage.getItem('satzwerk.profile') === '{"x":1}' && localStorage.getItem('kochwerk_db') === '{"y":2}'), 'Daten von Satzwerk/Kochwerk unberührt');
  ok(await page.evaluate(() => localStorage.getItem('geldwerk_sync') === null), 'Geldwerk-Zugang auf dem Gerät gelöscht');
  await tap(page, '[data-a=restoreStart]');
  await page.fill('#sheet [data-in=pf][data-k=repo]', 'tester/Geldwerk-Daten'); await page.fill('#sheet [data-in=pf][data-k=token]', 'github_pat_TEST');
  await shot(page, '32-wiederherstellen');
  await tap(page, '[data-a=restoreGo]');
  await page.waitForFunction(() => window.__gw && window.__gw.st.db.settings.setupDone, null, { timeout: 15000 });
  await page.waitForTimeout(2500);
  const after = await page.evaluate(() => ({ r: Object.values(window.__gw.st.db.receipts).filter(x => !x.del).length, c: Object.values(window.__gw.st.db.contracts).filter(x => !x.del).length, km: window.__gw.st.db.settings.kmWork }));
  ok(JSON.stringify(after) === JSON.stringify(before), 'Wiederhergestellt: ' + JSON.stringify(after));
  const nFiles = await page.evaluate(async () => (await window.GW.Store.fileKeys()).length);
  ok(nFiles >= 3, 'Fotos/PDF zurückgeholt: ' + nFiles);
  await tap(page, '.tabbar [data-tab=belege]'); await shot(page, '33-belege-wiederhergestellt');
  // Offline-Start (Service Worker)
  await page.waitForTimeout(1500);
  await ctx.setOffline(true); await page.reload(); await page.waitForSelector('.tabbar', { timeout: 10000 });
  ok(await page.locator('#view h1').count() === 1, 'Startet offline');
  await ctx.setOffline(false);
  ok(errs.length === 0, 'Keine Skriptfehler' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  console.log(notes.length ? '\nHinweise:\n' + notes.join('\n') : '\nKeine Oberflächen-Hinweise.');
  console.log(failures ? '✗ ' + failures + ' Prüfungen fehlgeschlagen' : '✓ Durchlauf ohne Fehler');
  await browser.close();
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
