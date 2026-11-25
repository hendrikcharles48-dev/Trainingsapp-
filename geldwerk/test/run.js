// Geldwerk – Tests der Rechenlogik. Start: node geldwerk/test/run.js
'use strict';
const path = require('path');
const G = require('../core.js');
const P = require('../parse.js');
const MP = require('../mappe.js');
const Y = require('../sync.js');
const R26 = require('../regeln/2026.json'), R27 = require('../regeln/2027.json');
const RULES = { 2026: R26, 2027: R27 };

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; } catch (e) { fail++; console.log('✗ ' + name + '\n   ' + (e && e.message || e)); }
}
async function ta(name, fn) {
  try { await fn(); pass++; } catch (e) { fail++; console.log('✗ ' + name + '\n   ' + (e && e.message || e)); }
}
function eq(a, b, msg) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((msg || '') + ' erwartet ' + JSON.stringify(b) + ', bekommen ' + JSON.stringify(a)); }
function near(a, b, d, msg) { if (Math.abs(a - b) > (d || 0.01)) throw new Error((msg || '') + ' erwartet ≈' + b + ', bekommen ' + a); }
function ok(c, msg) { if (!c) throw new Error(msg || 'Bedingung falsch'); }

function db0() {
  const db = G.blank();
  Object.assign(db.settings, { setupDone: true, kmWork: 25.7, kmSchool: 20, vacation: { 2026: 17 } });
  return db;
}

/* ---------- Datum, Feiertage ---------- */
t('Osterformel', () => { eq(G.easter(2026), '2026-04-05'); eq(G.easter(2027), '2027-03-28'); eq(G.easter(2024), '2024-03-31'); eq(G.easter(2025), '2025-04-20'); });
t('Feiertage in Regeldateien = Berechnung', () => {
  for (const [y, r] of Object.entries(RULES)) eq(r.feiertage.tage.map(x => x[0]), G.holidaysNI(+y).map(x => x[0]), 'Jahr ' + y);
});
t('addMonths kürzt Monatsende', () => { eq(G.addMonths('2026-01-31', 1), '2026-02-28'); eq(G.addMonths('2026-03-31', -1), '2026-02-28'); eq(G.addMonths('2026-12-15', 1), '2027-01-15'); });
t('Wochentag', () => { eq(G.dow('2026-11-25'), 2); eq(G.dow('2026-11-29'), 6); });

/* ---------- Fahrten ---------- */
t('Fahrten 2026: Arbeitstage, Schultage (Ferien, Feiertage), Urlaub', () => {
  const tr = G.trips(db0(), 2026, R26);
  eq(tr.sum.work.days, 146 - 17, 'Arbeitstage');
  eq(tr.sum.school.days, 84, 'Schultage');
  eq(tr.sum.job, 44, 'Minijob-Tage');
  near(tr.sum.work.eur, 129 * 25 * 0.38, 0.001, 'volle km');
  near(tr.sum.school.eur, 84 * 20 * 0.38);
});
t('Ausnahmen: krank, anderer Weg, Prüfung am Samstag, zu Hause', () => {
  const db = db0();
  db.exc['2026-09-01'] = { t: 'krank', upd: 1 };                 // Dienstag, Schultag
  db.exc['2026-09-02'] = { t: 'weg', km: 35, upd: 1 };           // Mittwoch, anderer Weg
  db.exc['2026-09-05'] = { t: 'pruefung', upd: 1 };              // Samstag
  db.exc['2026-10-14'] = { t: 'zuhause', upd: 1 };               // Herbstferien: Lerntag zu Hause
  db.exc['2026-09-03'] = { t: 'frei', upd: 1, del: true };       // gelöschte Ausnahme zählt nicht
  const tr = G.trips(db, 2026, R26);
  eq(tr.sum.school.days, 84 - 1 + 1, 'Schultage');
  near(tr.sum.school.eur, (84 - 1) * 20 * 0.38 - 20 * 0.38 + 35 * 0.38 + 20 * 0.38 - 0 + 0, 0.001);
  eq(tr.sum.home.days, 1);
  const d = tr.days.find(x => x.d === '2026-10-12'); eq(d.k, 'none'); ok(d.ferien, 'Ferien erkannt');
  eq(tr.days.find(x => x.d === '2026-10-03').hol, true);
});
t('Fahrten ohne km: 0 €', () => { const db = G.blank(); const tr = G.trips(db, 2026, R26); eq(tr.sum.eur, 0); });

/* ---------- Steuer ---------- */
t('Tarif 2026', () => {
  eq(G.tariff(12348, R26), 0);
  eq(G.tariff(15000, R26), Math.floor((914.51 * 0.2652 + 1400) * 0.2652));
  eq(G.tariff(20000, R26), Math.floor((173.10 * 0.2201 + 2397) * 0.2201 + 1034.87));
  eq(G.tariff(100000, R26), Math.floor(0.42 * 100000 - 11135.63));
  eq(G.tariff(300000, R26), Math.floor(0.45 * 300000 - 19470.38));
  ok(G.tariff(17799, R26) <= G.tariff(17800, R26) && G.tariff(17800, R26) - G.tariff(17799, R26) <= 1, 'stetig an der Zonengrenze');
});
t('Pauschbetrag: greift unter 1.230 €, höchstens bis zum Lohn', () => {
  const db = G.blank(); db.settings.kontofuehrung = false;
  db.tax[2026] = { gross: 1000, lst: 0 };
  const r = G.taxYear(db, 2026, R26, 0);
  eq(r.mid.wkUsed, 1000); eq(r.mid.income, 0);
});
t('Steuerschätzung mit Beispielwerten', () => {
  const db = db0(); db.settings.kontofuehrung = false;
  db.tax[2026] = { gross: 21000, lst: 1900, soli: 0, kist: 0, rv: 1953, kv: 1838, pv: 504, av: 273, zuschuss: 1500 };
  db.receipts.a = { id: 'a', date: '2026-08-10', amount: 3000, cat: 'fortbildung', ok: true, upd: 1 };
  db.receipts.b = { id: 'b', date: '2026-09-01', amount: 49.9, cat: 'fachbuch', ok: true, upd: 1 };
  db.receipts.c = { id: 'c', date: '2026-09-02', amount: 1200, cat: 'technik', ok: true, upd: 1 };      // 50 % beruflich, Computer 1 Jahr
  db.receipts.d = { id: 'd', date: '2026-09-03', amount: 100, cat: 'privat', ok: true, upd: 1 };
  db.receipts.e = { id: 'e', date: '2026-09-04', amount: 80, cat: 'fachbuch', ok: false, upd: 1 };      // noch zu prüfen
  const r = G.taxYear(db, 2026, R26, 0);
  const fahrten = G.r2(129 * 25 * 0.38 + 84 * 20 * 0.38);
  const wk = G.r2(fahrten + 3000 - 1500 + 49.9 + 600 + 80);
  near(r.wk, wk, 0.01, 'Werbungskosten');
  near(r.wkLow, G.r2(wk - 80), 0.01, 'untere Spanne ohne ungeprüften Beleg');
  const vs = 1953 + Math.max(1838 * 0.96 + 504, Math.min(1900, 1838 + 504 + 273));
  const zvE = Math.floor(21000 - wk - vs - 36);
  eq(r.mid.zvE, zvE, 'zvE');
  eq(r.mid.est, G.tariff(zvE, R26));
  near(r.refund, 1900 - G.tariff(zvE, R26), 0.01, 'Erstattung');
  ok(r.range[0] <= r.refund && r.refund <= r.range[1], 'Spanne umschließt Schätzung');
});
t('Zuschuss kann Fortbildungskosten nicht unter 0 drücken', () => {
  const db = G.blank(); db.settings.kontofuehrung = false;
  db.tax[2026] = { zuschuss: 5000 };
  db.receipts.a = { id: 'a', date: '2026-08-10', amount: 1000, cat: 'fortbildung', ok: true, upd: 1 };
  const l = G.wkLines(db, 2026, R26);
  eq(l.find(x => x.key === 'zuschuss').eur, -1000);
});
t('Verlust ohne Lohn → Verlustvortrag, wandert ins nächste Jahr', () => {
  const db = db0();
  db.settings.work = { from: '2026-01-01', to: '2026-07-31', days: [0, 1, 2, 3, 4] };
  db.tax[2026] = { gross: 20000, lst: 1500 };
  db.receipts.a = { id: 'a', date: '2027-02-01', amount: 4000, cat: 'fortbildung', ok: true, upd: 1 };
  const ch = G.taxChain(db, RULES);
  eq(ch[2027].noIncome, true);
  const wk27 = ch[2027].wk;
  ok(wk27 > 4000, 'Fahrten + Lehrgang 2027');
  near(ch[2027].loss, wk27, 0.01, 'Verlust = Werbungskosten');
  near(ch[2027].carryOut, wk27 + ch[2026].carryOut, 0.01);
  eq(ch[2027].lines.some(l => l.key === 'konto'), false, 'keine Kontoführung ohne Lohn');
});
t('Verlustvortrag mindert Einkünfte vor Sonderausgaben', () => {
  const db = G.blank(); db.settings.kontofuehrung = false;
  db.tax[2026] = { gross: 15000, lst: 800, rv: 0, kv: 0, pv: 0, av: 0 };
  const r = G.taxYear(db, 2026, R26, 5000);
  eq(r.mid.carryUsed, 5000); eq(r.mid.zvE, Math.floor(15000 - 1230 - 5000 - 36)); eq(r.carryOut, 0);
});
t('Bescheid mit Verlustvortrag ersetzt eigene Rechnung', () => {
  const db = db0(); db.tax[2026] = { gross: 1000, lst: 0, bescheid: { verlust: 777 } };
  const ch = G.taxChain(db, RULES); eq(ch[2027].carryIn, 777);
});
t('Teure Arbeitsmittel verteilt, Computer sofort', () => {
  const a = { id: 'x', date: '2026-05-01', amount: 1500, cat: 'arbeitsmittel', nd: 3 };
  eq(G.receiptYearAmount(a, 2026, R26), 500); eq(G.receiptYearAmount(a, 2028, R26), 500); eq(G.receiptYearAmount(a, 2029, R26), 0);
  const c = { id: 'y', date: '2026-05-01', amount: 1500, cat: 'technik', share: 100 };
  eq(G.receiptYearAmount(c, 2026, R26), 1500); eq(G.receiptYearAmount(c, 2027, R26), 0);
});

/* ---------- Verträge ---------- */
t('Kfz: Stichtag 30.11.', () => {
  const c = { tpl: 'kfz', yearEnd: '12-31', renew: 12, notice: { n: 1, u: 'm' } };
  eq(G.nextCancel(c, '2026-11-25'), { end: '2026-12-31', deadline: '2026-11-30', days: 5, anytime: false });
  eq(G.nextCancel(c, '2026-12-01').deadline, '2027-11-30');
  eq(G.nextCancel(c, '2026-11-30').deadline, '2026-11-30');
});
t('Handy: 24 Monate, dann monatlich', () => {
  const c = { start: '2025-03-15', term: 24, renew: 1, notice: { n: 1, u: 'm' } };
  const n = G.nextCancel(c, '2026-11-25'); eq(n.end, '2027-03-14'); eq(n.deadline, '2027-02-14');
  const n2 = G.nextCancel(c, '2027-03-01'); eq(n2.end, '2027-04-14'); eq(n2.deadline, '2027-03-14'); eq(n2.anytime, true);
});
t('Fitness: 12 Monate, verlängert um 12, 3 Monate Frist', () => {
  const c = { start: '2024-01-01', term: 12, renew: 12, notice: { n: 3, u: 'm' } };
  const n = G.nextCancel(c, '2026-11-25'); eq(n.end, '2027-12-31'); eq(n.deadline, '2027-09-30');
  eq(G.nextCancel(c, '2026-09-30').deadline, '2026-09-30');
});
t('Kündigungsfrist in Wochen/Tagen', () => {
  eq(G.nextCancel({ start: '2026-01-10', term: 1, renew: 1, notice: { n: 2, u: 'w' } }, '2026-11-25').deadline, '2026-11-25');
  eq(G.nextCancel({ start: '2026-01-10', term: 1, renew: 1, notice: { n: 0, u: 'd' } }, '2026-11-25').end, '2026-12-09');
});
t('Preisänderung in Prozent', () => { eq(G.priceChange({ prices: [{ d: '2025-01-01', amount: 40 }, { d: '2026-01-01', amount: 44 }] }).pct, 10); });
t('Monatliche Kosten', () => { near(G.monthly({ amount: 600, rhythm: 'y' }), 50); near(G.monthly({ amount: 30, rhythm: 'q' }), 10); });

/* ---------- Zusammenführen ---------- */
t('Zusammenführen: neueste Änderung gewinnt, nichts geht verloren', () => {
  const a = G.blank(), b = G.blank();
  a.receipts.x = { id: 'x', amount: 10, upd: 5 }; b.receipts.x = { id: 'x', amount: 12, upd: 9 };
  a.receipts.y = { id: 'y', amount: 1, upd: 3 };
  b.receipts.z = { id: 'z', amount: 2, upd: 3 };
  a.contracts.k = { id: 'k', del: true, upd: 20 }; b.contracts.k = { id: 'k', amount: 5, upd: 10 };
  a.settings.kmWork = 30; a.settings.upd = 100; b.settings.kmWork = 20; b.settings.upd = 50;
  const m = G.merge(a, b);
  eq(m.data.receipts.x.amount, 12); ok(m.data.receipts.y && m.data.receipts.z, 'beide Seiten erhalten');
  eq(m.data.contracts.k.del, true); eq(m.data.settings.kmWork, 30);
  ok(m.fromRemote && m.fromLocal, 'Richtungen');
  const same = G.merge(m.data, m.data); ok(!same.fromRemote && !same.fromLocal, 'nichts zu tun bei Gleichstand');
});
t('Zusammenführen leerer Stand mit Sicherung = Sicherung', () => {
  const b = G.blank(); b.receipts.x = { id: 'x', amount: 3, upd: 1 }; b.settings.setupDone = true; b.settings.upd = 7;
  const m = G.merge(G.blank(), b); eq(m.data.receipts.x.amount, 3); eq(m.data.settings.setupDone, true); eq(m.fromLocal, false);
});

/* ---------- Posteingang, Erinnerungen ---------- */
t('Posteingang: unsicherer Beleg, nahe Kündigungsfrist, Abgelaufenes rot', () => {
  const db = db0();
  db.receipts.a = { id: 'a', merchant: 'Thalia', amount: 20, date: '2026-11-20', cat: 'fachbuch', ok: false, upd: 1 };
  db.contracts.k = { id: 'k', name: 'Kfz', tpl: 'kfz', yearEnd: '12-31', renew: 12, notice: { n: 1, u: 'm' }, created: '2026-11-01', upd: 1 };
  db.receipts.b = { id: 'b', merchant: 'Amazon', amount: 50, date: '2026-11-01', kind: 'online', cat: 'privat', ok: true, upd: 1 };
  const it = G.inbox(db, '2026-11-25', RULES, G.taxChain(db, RULES));
  ok(it.some(i => i.kind === 'pruefen' && i.id === 'a'), 'prüfen');
  ok(it.some(i => i.kind === 'kuendigung' && i.days === 5), 'Kündigung');
  ok(!it.some(i => i.kind === 'rueckgabe'), 'Rückgabe 15.11. abgelaufen, nicht mehr angezeigt');
  db.dismissed['u:a'] = { upd: 1 };
  ok(!G.inbox(db, '2026-11-25', RULES, G.taxChain(db, RULES)).some(i => i.key === 'u:a'), 'weggeklickt');
});
t('Erinnerungen: 14 und 3 Tage vor Kündigungsfrist, Rückgabe, Gewährleistung, Sammelhinweis', () => {
  const db = G.blank();
  db.contracts.k = { id: 'k', name: 'Kfz', tpl: 'kfz', yearEnd: '12-31', renew: 12, notice: { n: 1, u: 'm' }, upd: 1 };
  db.receipts.b = { id: 'b', merchant: 'Amazon', amount: 50, date: '2026-11-20', kind: 'online', cat: 'technik', ok: true, upd: 1 };
  const r = G.reminders(db, '2026-11-10', RULES, 2);
  ok(r.some(x => x.d === '2026-11-16' && /Kfz/.test(x.t)), '14 Tage');
  ok(r.some(x => x.d === '2026-11-27' && /Kfz/.test(x.t)), '3 Tage');
  ok(r.some(x => x.d === '2026-12-01' && /Rückgabe/.test(x.t)), 'Rückgabe 3 Tage vor 04.12.');
  ok(r.some(x => x.d === '2028-10-19' && /Gewährleistung/.test(x.t)), 'Gewährleistung 1 Monat vorher');
  ok(r.some(x => x.d === '2026-12-01' && /2 Dinge offen/.test(x.t)), 'Sammelhinweis');
  ok(r.every(x => x.t.length <= 90 && !/\d+,\d\d €/.test(x.t)), 'keine Beträge an den Worker');
});
t('Rückgabe/Gewährleistung', () => {
  eq(G.receiptDates({ date: '2026-03-10', kind: 'online', cat: 'technik' }), { returnUntil: '2026-03-24', warrantyUntil: '2028-03-09' });
  eq(G.receiptDates({ date: '2026-03-10', kind: 'laden', cat: 'fortbildung' }), {});
});

/* ---------- Texterkennung auswerten ---------- */
t('Kassenbon: Summe, Datum, Händler, Kategorie', () => {
  const txt = 'THALIA Bücher GmbH\nWeender Str. 12\n37073 Göttingen\nTabellenbuch Metall 49,90\nMwSt 7% 3,26\nSUMME EUR 49,90\nGegeben BAR 50,00\nRückgeld 0,10\n14.11.2026 15:32';
  const r = P.receipt(txt, {}, '2026-11-25');
  eq(r.amount, 49.9); eq(r.date, '2026-11-14'); eq(r.merchant, 'Thalia'); eq(r.cat, 'fachbuch'); eq(r.unsure, []); eq(r.kind, 'laden');
});
t('Rechnung online mit „Zu zahlen“ und gelerntem Händler', () => {
  const txt = 'Rechnung\nFeinmess Shop Müller\nBestellnummer 12345\nRechnungsdatum: 03.11.26\nZwischensumme 100,00\nVersand 4,90\nZu zahlen 1.104,90 €';
  const learn = { 'feinmess shop': { cat: 'arbeitsmittel', upd: 1 } };
  const r = P.receipt(txt, learn, '2026-11-25');
  eq(r.amount, 1104.9); eq(r.date, '2026-11-03'); eq(r.kind, 'online'); eq(r.merchant, 'Feinmess Shop Müller'); eq(r.cat, 'arbeitsmittel');
});
t('Unlesbarer Beleg markiert alles unsicher', () => { const r = P.receipt('xx', {}, '2026-11-25'); ok(r.unsure.includes('amount') && r.unsure.includes('date')); });
t('Zahlen deutsch', () => { eq(P.num('1.234,56'), 1234.56); eq(P.num('12,5'), 12.5); eq(P.num('12.99'), 12.99); eq(P.num('1 234,00 €'), 1234); eq(P.num('abc'), null); });

/* ---------- Geldwerk-Block ---------- */
t('Block: Lohnsteuerbescheinigung + Vertrag in einem Text', () => {
  const txt = '```\n#GELDWERK\ntyp: Lohnsteuerbescheinigung\njahr: 2026\nBruttolohn (Zeile 3): 21.345,67\nLohnsteuer (Zeile 4): 2.110,00\nSoli: 0,00\nKirchensteuer: 0\nRentenversicherung AN (Zeile 23a): 1.985,15\n#ENDE\n#GELDWERK\ntyp: Vertrag\nvorlage: Kfz-Versicherung\nanbieter: HUK-Coburg\nbetrag: 456,12\nrhythmus: jährlich\nkündigungsfrist: 1 Monat\nablauf: 31.12.\nsteuerlich: ja\n#ENDE\n```';
  const b = P.blocks(txt);
  eq(b.length, 2);
  eq(b[0].typ, 'lohnsteuer'); eq(b[0].data.gross, 21345.67); eq(b[0].data.lst, 2110); eq(b[0].data.rv, 1985.15); eq(b[0].data.jahr, 2026); eq(b[0].warn, []);
  eq(b[1].typ, 'vertrag'); eq(b[1].data.tpl, 'kfz'); eq(b[1].data.amount, 456.12); eq(b[1].data.rhythm, 'y'); eq(b[1].data.notice, { n: 1, u: 'm' }); eq(b[1].data.yearEnd, '12-31'); eq(b[1].data.tax, true);
});
t('Block ohne Kopfzeile und mit Fehlern', () => {
  const b = P.blocks('typ: beleg\nbetrag: zwölf\ndatum: 31.02.2026\nhändler: Thalia');
  eq(b.length, 1); eq(b[0].typ, 'beleg'); ok(b[0].warn.length >= 2, 'Warnungen');
});
t('Block: Steuerbescheid und Aufstiegs-BAföG', () => {
  const b = P.blocks('GELDWERK\ntyp: Steuerbescheid\njahr: 2026\nerstattung: 812,00\nverbleibender Verlustvortrag: 0\nENDE\nGELDWERK\ntyp: Aufstiegs-BAföG\njahr: 2026\nzuschuss: 2.500\ndarlehen: 2.500\nENDE');
  eq(b[0].typ, 'bescheid'); eq(b[0].data.erstattung, 812); eq(b[0].data.verlust, 0);
  eq(b[1].typ, 'bafoeg'); eq(b[1].data.zuschuss, 2500);
});

/* ---------- PDF ---------- */
t('PDF: gültiger Aufbau, Umlaute, Querverweise stimmen', () => {
  const jpeg = new Uint8Array([0xFF, 0xD8, 0xFF, 0xD9]);
  const pdf = MP.mappe({ year: 2026, headline: 'ca. 812 € zurück', headsub: 'Spanne 700–900 €', disclaimer: 'Keine Steuerberatung.', summary: [['Fahrten', '1.000 €']], wk: [{ l: 'Fahrten zur Schule', detail: '84 Tage', eur: 638.4 }],
    elster: [{ area: 'Anlage N › Werbungskosten', rows: [['Fortbildungskosten', '1.500 €']], note: 'Hinweis' }], months: [{ m: 'August', work: 0, school: 13, home: 0, eur: 98.8 }],
    receipts: [{ date: '2026-08-10', merchant: 'Technikakademie Northeim – Prüfungsgebühr „Ü“', cat: 'Lehrgang & Prüfung', amount: 3000, counted: 3000 }], rules: [{ titel: 'Entfernungspauschale', quelle: '§ 9 EStG', stand: '2026-11-25', geprueft: true }],
    images: [{ bytes: jpeg, w: 100, h: 200, caption: 'Beleg 1' }] });
  const s = Buffer.from(pdf).toString('latin1');
  ok(s.startsWith('%PDF-1.4') && s.trimEnd().endsWith('%%EOF'), 'Kopf/Ende');
  const xref = +/startxref\n(\d+)/.exec(s)[1]; ok(s.slice(xref, xref + 4) === 'xref', 'xref-Offset');
  const offs = s.slice(xref).split('\n').slice(3).filter(l => / 00000 n $/.test(l)).map(l => +l.slice(0, 10));
  offs.forEach((o, i) => ok(s.slice(o).startsWith((i + 1) + ' 0 obj'), 'Objekt ' + (i + 1)));
  ok(s.includes('\xFC') || s.includes('\xDC'), 'Umlaut als WinAnsi'); ok(s.includes('\x80'), 'Euro-Zeichen');
  ok(/\/Count \d+/.test(s), 'Seiten');
});
t('Spickzettel-PDF allein', () => { const p = MP.mappe({ year: 2026, elster: [{ area: 'X', rows: [['a', '1 €']] }] }, true); ok(Buffer.from(p).toString('latin1').includes('/Count 1')); });
t('Zeilenumbruch', () => { const l = MP.PDF.wrap('Das ist ein sehr langer Satz, der umbrochen werden muss, weil er nicht passt.', 10, 100); ok(l.length > 2 && l.every(x => MP.PDF.width(x, 10) <= 100 || !x.includes(' '))); });

/* ---------- Sicherung mit nachgebautem GitHub ---------- */
function fakeGitHub() {
  const files = {}; let sha = 0; let conflictOnce = false;
  const res = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body, text: async () => JSON.stringify(body), arrayBuffer: async () => body });
  const f = async (url, opt = {}) => {
    const p = url.replace('https://api.github.com', '');
    if (p === '/repos/me/Geldwerk-Daten') return res(200, { private: true, permissions: { push: true } });
    const m = /\/contents\/(.+)$/.exec(p); const name = m && m[1];
    if ((opt.method || 'GET') === 'GET') {
      if (!files[name]) return res(404, {});
      if (opt.headers && /raw/.test(opt.headers.Accept)) return res(200, files[name].bytes);
      return res(200, { sha: files[name].sha, content: files[name].b64, encoding: 'base64' });
    }
    const b = JSON.parse(opt.body);
    if (conflictOnce) { conflictOnce = false; files[name] = { sha: 'x' + (++sha), b64: Y.b64encode(JSON.stringify({ app: 'geldwerk', data: (() => { const d = G.blank(); d.receipts.other = { id: 'other', amount: 7, upd: 2 }; return d; })() })) }; return res(409, {}); }
    if (files[name] && files[name].sha !== b.sha && name === Y.FILE) return res(409, {});
    if (files[name] && name !== Y.FILE) return res(422, {});
    files[name] = { sha: 's' + (++sha), b64: b.content, bytes: Buffer.from(b.content, 'base64') };
    return res(201, {});
  };
  return { f, files, conflict() { conflictOnce = true; } };
}
const CFG = { repo: 'me/Geldwerk-Daten', token: 't' };
(async () => {
  await ta('Sicherung: hochladen, auf neuem Gerät zurückholen', async () => {
    const gh = fakeGitHub();
    const a = db0(); a.settings.upd = 1; a.receipts.x = { id: 'x', amount: 5, upd: 1, files: [{ id: 'f1', type: 'jpg' }] };
    eq((await Y.test(CFG, gh.f)).exists, false);
    const s1 = await Y.syncOnce(CFG, a, gh.f, 'iPhone'); ok(s1.ok && s1.uploaded, 'hochgeladen');
    ok((await Y.putFile(CFG, { id: 'f1', type: 'jpg' }, new Uint8Array([1, 2, 3]), gh.f)).ok);
    ok((await Y.putFile(CFG, { id: 'f1', type: 'jpg' }, new Uint8Array([1, 2, 3]), gh.f)).ok, 'zweites Mal = schon da');
    // neues Gerät, leer
    const s2 = await Y.syncOnce(CFG, G.blank(), gh.f, 'neu');
    ok(s2.ok && s2.fromRemote && !s2.uploaded, 'nur geholt'); eq(s2.data.receipts.x.amount, 5); eq(s2.data.settings.kmWork, 25.7);
    const g = await Y.getFile(CFG, { id: 'f1', type: 'jpg' }, gh.f); eq([...g.bytes], [1, 2, 3]);
  });
  await ta('Sicherung: anderes Gerät war schneller → neu holen und zusammenführen', async () => {
    const gh = fakeGitHub();
    await Y.syncOnce(CFG, db0(), gh.f, 'A');
    gh.conflict();
    const b = db0(); b.receipts.mine = { id: 'mine', amount: 1, upd: 3 }; b.settings.upd = 1;
    const s = await Y.syncOnce(CFG, b, gh.f, 'B');
    ok(s.ok && s.uploaded, 'hochgeladen nach Konflikt');
    ok(s.data.receipts.other && s.data.receipts.mine, 'beide Stände drin');
  });
  t('Zugangscode', () => { eq(Y.parseAccess('xx geldwerk-zugang:me/Geldwerk-Daten:github_pat_ABC yy'), { repo: 'me/Geldwerk-Daten', token: 'github_pat_ABC' }); });
  t('Export/Import-Datei', () => { const d = db0(); const p = Y.parseBackup(Y.exportText(d, { f1: 'AAA' })); eq(p.data.settings.kmWork, 25.7); eq(p.files.f1, 'AAA'); ok(Y.parseBackup('{"app":"kochwerk"}').error); });
  console.log((fail ? '✗ ' : '✓ ') + pass + ' Tests bestanden' + (fail ? ', ' + fail + ' fehlgeschlagen' : ''));
  process.exit(fail ? 1 : 0);
})();
