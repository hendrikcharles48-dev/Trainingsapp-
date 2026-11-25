/* Geldwerk – reine Rechenlogik (ohne Oberfläche, in Node testbar: node geldwerk/test/run.js).
   Datum immer als Text 'JJJJ-MM-TT', gerechnet in UTC (keine Sommerzeit-Fehler).
   Daten (db): { v, settings, receipts{id:…}, contracts{id:…}, exc{datum:…}, tax{jahr:…}, learn{händler:…}, dismissed{key:…} }
   Jeder Eintrag hat upd (ms) – Grundlage fürs Zusammenführen; gelöschte Einträge bleiben als { del: true, upd }. */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.GW = Object.assign(root.GW || {}, factory());
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---------------- Datum ---------------- */
  const pad = n => String(n).padStart(2, '0');
  const P = s => new Date(s + 'T00:00:00Z');
  const F = d => d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
  const addDays = (s, n) => { const d = P(s); d.setUTCDate(d.getUTCDate() + n); return F(d); };
  function addMonths(s, n) {
    const d = P(s), day = d.getUTCDate();
    const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1));
    const last = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate();
    t.setUTCDate(Math.min(day, last));
    return F(t);
  }
  const dow = s => (P(s).getUTCDay() + 6) % 7;            // 0 = Montag … 6 = Sonntag
  const diffDays = (a, b) => Math.round((P(b) - P(a)) / 864e5); // b − a
  const todayStr = (now = new Date()) => now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
  const isDate = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && F(P(s)) === s;
  const DOW = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  const fmtDate = s => s ? s.slice(8, 10) + '.' + s.slice(5, 7) + '.' + s.slice(0, 4) : '';
  const fmtShort = s => s ? s.slice(8, 10) + '.' + s.slice(5, 7) + '.' : '';

  // Osterformel (Gauß/Meeus) – dient als Gegenprobe für die Feiertage in den Regeldateien
  function easter(y) {
    const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25),
      g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4,
      l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
      month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
    return y + '-' + pad(month) + '-' + pad(day);
  }
  // Gesetzliche Feiertage Niedersachsen (NFeiertagsG § 2) – berechnet
  function holidaysNI(y) {
    const e = easter(y);
    return [[y + '-01-01', 'Neujahr'], [addDays(e, -2), 'Karfreitag'], [addDays(e, 1), 'Ostermontag'], [y + '-05-01', 'Tag der Arbeit'],
      [addDays(e, 39), 'Christi Himmelfahrt'], [addDays(e, 50), 'Pfingstmontag'], [y + '-10-03', 'Tag der Deutschen Einheit'],
      [y + '-10-31', 'Reformationstag'], [y + '-12-25', '1. Weihnachtstag'], [y + '-12-26', '2. Weihnachtstag']];
  }

  /* ---------------- Geld ---------------- */
  const r2 = x => Math.round((+x || 0) * 100) / 100;
  function eur(x, dec) {
    const v = +x || 0, d = dec == null ? (Math.abs(v - Math.round(v)) < 0.005 ? 0 : 2) : dec;
    const s = Math.abs(v).toFixed(d).split('.');
    s[0] = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return (v < 0 ? '−' : '') + s.join(',') + ' €';
  }
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  /* ---------------- Grunddaten ---------------- */
  const DEFAULT_SETTINGS = {
    setupDone: false,
    kmWork: null, kmSchool: null,
    work: { from: '2026-01-01', to: '2026-07-31', days: [0, 1, 2, 3, 4], place: 'Göttingen-Grone' },
    school: { from: '2026-08-01', to: '2028-07-31', days: [0, 1, 2, 3, 4], place: 'Technikakademie Northeim' },
    jobDays: [1, 3],
    vacation: { 2026: 17 },
    kontofuehrung: true,
    carry2025: 0
  };
  function blank() {
    return { v: 1, settings: Object.assign(JSON.parse(JSON.stringify(DEFAULT_SETTINGS)), { upd: 0 }), receipts: {}, contracts: {}, exc: {}, tax: {}, learn: {}, dismissed: {} };
  }
  const COLL = ['receipts', 'contracts', 'exc', 'tax', 'learn', 'dismissed'];
  function upgrade(db) {
    const b = blank();
    if (!db || typeof db !== 'object') return b;
    const out = Object.assign({}, db);
    out.v = 1;
    out.settings = Object.assign({}, b.settings, db.settings || {});
    for (const k of ['work', 'school']) out.settings[k] = Object.assign({}, b.settings[k], (db.settings || {})[k] || {});
    for (const c of COLL) out[c] = Object.assign({}, db[c] || {});
    return out;
  }
  const live = (db, c) => Object.values(db[c] || {}).filter(x => x && !x.del);

  /* ---------------- Kategorien und Händler ---------------- */
  // area = Bereich in der Steuererklärung (Anlage N bzw. Sonderausgaben). share = Vorbelegung beruflicher Anteil.
  const CATS = [
    { k: 'fortbildung', l: 'Lehrgang & Prüfung', area: 'fortbildung', share: 100 },
    { k: 'fachbuch', l: 'Fachbücher', area: 'arbeitsmittel', share: 100 },
    { k: 'technik', l: 'Computer & Software', area: 'arbeitsmittel', share: 50, computer: true },
    { k: 'arbeitsmittel', l: 'Werkzeug & Arbeitsmittel', area: 'arbeitsmittel', share: 100 },
    { k: 'buero', l: 'Büro & Schreibwaren', area: 'arbeitsmittel', share: 100 },
    { k: 'kleidung', l: 'Arbeitskleidung', area: 'arbeitsmittel', share: 100 },
    { k: 'reise', l: 'Fahrten & Reisen', area: 'reise', share: 100 },
    { k: 'bewerbung', l: 'Bewerbung', area: 'weitere', share: 100 },
    { k: 'spende', l: 'Spende', area: 'spende', share: 100 },
    { k: 'privat', l: 'Privat (nur Garantie)', area: null, share: 0 }
  ];
  const CAT = Object.fromEntries(CATS.map(c => [c.k, c]));
  // Bereiche im Aufbau der Steuererklärung (ELSTER). Zeilennummern bewusst nicht, solange nicht für das Jahr geprüft.
  const AREAS = {
    fahrten: { l: 'Wege Wohnung – erste Tätigkeitsstätte', elster: 'Anlage N › Werbungskosten › Wege zwischen Wohnung und erster Tätigkeitsstätte' },
    fortbildung: { l: 'Fortbildungskosten', elster: 'Anlage N › Werbungskosten › Fortbildungskosten' },
    arbeitsmittel: { l: 'Arbeitsmittel', elster: 'Anlage N › Werbungskosten › Arbeitsmittel' },
    reise: { l: 'Reisekosten', elster: 'Anlage N › Werbungskosten › Reisekosten' },
    weitere: { l: 'Weitere Werbungskosten', elster: 'Anlage N › Werbungskosten › Weitere Werbungskosten' },
    tagespauschale: { l: 'Tagespauschale', elster: 'Anlage N › Werbungskosten › Tagespauschale bei Tätigkeit in der häuslichen Wohnung' },
    spende: { l: 'Spenden', elster: 'Anlage Sonderausgaben › Zuwendungen (Spenden)' }
  };
  const MERCHANTS = [
    ['thalia', 'fachbuch'], ['hugendubel', 'fachbuch'], ['lehmanns', 'fachbuch'], ['mayersche', 'fachbuch'], ['osiander', 'fachbuch'],
    ['buchhandlung', 'fachbuch'], ['europa-lehrmittel', 'fachbuch'], ['europa lehrmittel', 'fachbuch'], ['beuth', 'fachbuch'], ['dinmedia', 'fachbuch'],
    ['vde verlag', 'fachbuch'], ['vogel', 'fachbuch'], ['springer', 'fachbuch'], ['hanser', 'fachbuch'], ['westermann', 'fachbuch'], ['bücher', 'fachbuch'],
    ['mediamarkt', 'technik'], ['media markt', 'technik'], ['saturn', 'technik'], ['cyberport', 'technik'], ['notebooksbilliger', 'technik'],
    ['alternate', 'technik'], ['apple', 'technik'], ['gravis', 'technik'], ['mindfactory', 'technik'], ['conrad', 'technik'], ['reichelt', 'technik'],
    ['microsoft', 'technik'], ['adobe', 'technik'], ['autodesk', 'technik'], ['solidworks', 'technik'], ['dassault', 'technik'], ['logitech', 'technik'],
    ['mcpaper', 'buero'], ['staples', 'buero'], ['schreibwaren', 'buero'], ['viking', 'buero'], ['office', 'buero'], ['papier', 'buero'],
    ['würth', 'arbeitsmittel'], ['wuerth', 'arbeitsmittel'], ['hoffmann', 'arbeitsmittel'], ['hornbach', 'arbeitsmittel'], ['obi', 'arbeitsmittel'],
    ['bauhaus', 'arbeitsmittel'], ['toom', 'arbeitsmittel'], ['hagebau', 'arbeitsmittel'], ['mitutoyo', 'arbeitsmittel'], ['casio', 'arbeitsmittel'],
    ['engelbert strauss', 'kleidung'], ['strauss', 'kleidung'], ['uvex', 'kleidung'],
    ['technikakademie', 'fortbildung'], ['ihk', 'fortbildung'], ['tüv', 'fortbildung'], ['dekra', 'fortbildung'], ['bbs', 'fortbildung'], ['landkreis northeim', 'fortbildung'],
    ['deutsche bahn', 'reise'], ['db fernverkehr', 'reise'], ['flixbus', 'reise'], ['metronom', 'reise'], ['cantus', 'reise'],
    ['unicef', 'spende'], ['spende', 'spende'], ['caritas', 'spende'], ['diakonie', 'spende'], ['rotes kreuz', 'spende']
  ];
  const normMerchant = s => String(s || '').toLowerCase().replace(/[^a-z0-9äöüß ]+/g, ' ').replace(/\s+/g, ' ').trim();
  // Kategorie zum Händler: erst Gelerntes (eigene Korrekturen), dann Vorbelegung
  function guessCat(merchant, learn) {
    const n = normMerchant(merchant);
    if (!n) return null;
    const L = learn || {};
    const key = n.split(' ').slice(0, 2).join(' ');
    if (L[key] && !L[key].del && L[key].cat) return { cat: L[key].cat, sure: true };
    for (const [k, c] of MERCHANTS) if (n.includes(k)) return { cat: c, sure: true };
    return null;
  }
  const learnKey = merchant => normMerchant(merchant).split(' ').slice(0, 2).join(' ');

  /* ---------------- Rückgabe, Gewährleistung ---------------- */
  // Kaufart: 'laden' (kein gesetzliches Rückgaberecht) oder 'online' (14 Tage Widerruf ab Erhalt)
  function receiptDates(r) {
    const out = {};
    if (!r || !r.date) return out;
    const ret = r.returnDays != null ? +r.returnDays : (r.kind === 'online' ? 14 : 0);
    if (ret > 0) out.returnUntil = addDays(r.date, ret);
    if (r.cat !== 'fortbildung' && r.cat !== 'spende' && r.cat !== 'reise' && r.cat !== 'bewerbung' && r.warranty !== false) out.warrantyUntil = addDays(addMonths(r.date, 24), -1);
    if (r.guaranteeYears > 0) out.guaranteeUntil = addDays(addMonths(r.date, 12 * r.guaranteeYears), -1);
    return out;
  }

  /* ---------------- Fahrten ---------------- */
  // Liefert je Tag die Art: work | school | home | none (+ Grund), dazu Summen. rules = Regeldatei des Jahres.
  const EXC = {
    krank: { l: 'Krank', k: 'none' }, frei: { l: 'Frei / Urlaub', k: 'none' }, pruefung: { l: 'Prüfung', k: 'school' },
    weg: { l: 'Anderer Weg', k: null }, zuhause: { l: 'Lernen zu Hause', k: 'home' },
    schule: { l: 'Zusätzlicher Schultag', k: 'school' }, arbeit: { l: 'Zusätzlicher Arbeitstag', k: 'work' }
  };
  function inR(d, r) { return r && r.from && r.to && d >= r.from && d <= r.to; }
  function ferienOf(rules, d) {
    for (const f of ((rules && rules.ferien && rules.ferien.zeiten) || [])) if (d >= f[0] && d <= f[1]) return f[2];
    return null;
  }
  function holidayMap(rules, y) {
    const m = {};
    const list = (rules && rules.feiertage && rules.feiertage.tage) || holidaysNI(y);
    for (const [d, n] of list) m[d] = n;
    return m;
  }
  function dayInfo(d, s, rules, hol, exc) {
    const w = dow(d);
    const info = { d, k: 'none', why: '', job: false, km: 0 };
    if (hol[d]) { info.why = hol[d]; info.hol = true; }
    else if (inR(d, s.work) && (s.work.days || []).includes(w)) { info.k = 'work'; info.km = +s.kmWork || 0; }
    else if (inR(d, s.school) && (s.school.days || []).includes(w)) {
      const f = ferienOf(rules, d);
      if (f) { info.why = f; info.ferien = true; } else { info.k = 'school'; info.km = +s.kmSchool || 0; }
    } else if (w >= 5) info.why = 'Wochenende';
    if (!hol[d] && inR(d, s.school) && (s.jobDays || []).includes(w)) info.job = true;
    info.base = info.k;
    const e = exc && exc[d];
    if (e && !e.del && e.t && EXC[e.t]) {
      info.exc = e.t; info.why = EXC[e.t].l;
      if (e.t === 'weg') { if (info.k !== 'none') info.km = +e.km || info.km; }
      else {
        info.k = EXC[e.t].k;
        info.km = info.k === 'work' ? (+e.km || +s.kmWork || 0) : info.k === 'school' ? (+e.km || +s.kmSchool || 0) : 0;
      }
    }
    return info;
  }
  function trips(db, year, rules) {
    const s = db.settings || DEFAULT_SETTINGS;
    const rate = rules && rules.regeln && rules.regeln.entfernungspauschale ? rules.regeln.entfernungspauschale.wert : 0.38;
    const hol = holidayMap(rules, year);
    const days = [];
    const sum = { work: { days: 0, eur: 0, km: +s.kmWork || 0 }, school: { days: 0, eur: 0, km: +s.kmSchool || 0 }, home: { days: 0 }, job: 0, vacation: 0, rate };
    for (let d = year + '-01-01'; d <= year + '-12-31'; d = addDays(d, 1)) {
      const i = dayInfo(d, s, rules, hol, db.exc);
      days.push(i);
      if (i.k === 'work' || i.k === 'school') { sum[i.k].days++; sum[i.k].eur += Math.floor(i.km) * rate; }
      else if (i.k === 'home') sum.home.days++;
      if (i.job) sum.job++;
    }
    // Urlaubstage (pauschal aus den Einstellungen) ziehen Arbeitstage ab
    const vac = Math.min(sum.work.days, Math.max(0, Math.round(+((s.vacation || {})[year]) || 0)));
    if (vac) { sum.work.days -= vac; sum.work.eur -= vac * Math.floor(+s.kmWork || 0) * rate; sum.vacation = vac; }
    sum.work.eur = r2(Math.max(0, sum.work.eur)); sum.school.eur = r2(sum.school.eur);
    sum.eur = r2(sum.work.eur + sum.school.eur);
    return { days, sum };
  }

  /* ---------------- Einkommensteuer ---------------- */
  function tariff(zvE, rules) {
    const t = rules.regeln.tarif;
    const x = Math.floor(Math.max(0, zvE));
    for (const z of t.zonen) {
      if (z.bis != null && x > z.bis) continue;
      if (z.typ === 'null') return 0;
      if (z.typ === 'y') { const y = (x - z.ab) / 10000; return Math.floor((z.a * y + z.b) * y); }
      if (z.typ === 'z') { const q = (x - z.ab) / 10000; return Math.floor((z.a * q + z.b) * q + z.c); }
      return Math.floor(z.a * x - z.c);
    }
    return 0;
  }
  function soliOf(est, rules) {
    const s = rules.regeln.soli || { freigrenze: 20350, satz: 5.5, milderung: 11.9 };
    if (est <= s.freigrenze) return 0;
    return r2(Math.min(est * s.satz / 100, (est - s.freigrenze) * s.milderung / 100));
  }
  // Vorsorge (Sonderausgaben) aus Lohnsteuerbescheinigung oder geschätzt
  function vorsorge(t, rules) {
    const gross = +t.gross || 0;
    const has = ['rv', 'kv', 'pv'].some(k => t[k] != null && t[k] !== '');
    const rv = has ? +t.rv || 0 : gross * 0.093, kv = has ? +t.kv || 0 : gross * 0.0875, pv = has ? +t.pv || 0 : gross * 0.024, av = has ? +t.av || 0 : gross * 0.013;
    const basis = kv * 0.96 + pv;
    const hoechst = (rules.regeln.sonderausgaben && rules.regeln.sonderausgaben.hoechst_sonstige) || 1900;
    const sonst = Math.max(basis, Math.min(hoechst, kv + pv + av));
    return { sum: r2(rv + sonst), estimated: !has };
  }

  // Werbungskosten-Posten eines Jahres. Jede Zeile: { key, area, l, eur, sure, rule, detail }
  function wkLines(db, year, rules, tr) {
    const R = rules.regeln, s = db.settings, lines = [];
    const T = tr || trips(db, year, rules);
    if (T.sum.work.days) lines.push({ key: 'fahrt-arbeit', area: 'fahrten', l: 'Fahrten zur Arbeit', eur: T.sum.work.eur, sure: true, rule: 'entfernungspauschale', detail: T.sum.work.days + ' Tage × ' + Math.floor(T.sum.work.km) + ' km × ' + String(T.sum.rate).replace('.', ',') + ' €' + (T.sum.vacation ? ' (ohne ' + T.sum.vacation + ' Urlaubstage)' : '') });
    if (T.sum.school.days) lines.push({ key: 'fahrt-schule', area: 'fahrten', l: 'Fahrten zur Schule', eur: T.sum.school.eur, sure: true, rule: 'bildungseinrichtung', detail: T.sum.school.days + ' Tage × ' + Math.floor(T.sum.school.km) + ' km × ' + String(T.sum.rate).replace('.', ',') + ' €' });
    // Belege nach Bereich
    const by = {};
    for (const r of live(db, 'receipts')) {
      const c = CAT[r.cat]; if (!c || !c.area || c.area === 'spende') continue;
      const amt = receiptYearAmount(r, year, rules);
      if (!amt) continue;
      const a = by[c.area] || (by[c.area] = { eur: 0, sureEur: 0, n: 0, unsure: 0 });
      a.eur += amt; a.n++;
      if (isUnsure(r)) a.unsure += amt; else a.sureEur += amt;
    }
    const zuschuss = +((db.tax[year] || {}).zuschuss) || 0;
    for (const area of ['fortbildung', 'arbeitsmittel', 'reise', 'weitere']) {
      const a = by[area];
      if (!a && !(area === 'fortbildung' && zuschuss)) continue;
      if (a) lines.push({ key: 'belege-' + area, area, l: AREAS[area].l, eur: r2(a.eur), sureEur: r2(a.sureEur), sure: !a.unsure, rule: area === 'fortbildung' ? 'fortbildung' : area === 'arbeitsmittel' ? 'arbeitsmittel' : null, detail: a.n + (a.n === 1 ? ' Beleg' : ' Belege') + (a.unsure ? ' (' + eur(a.unsure) + ' noch zu prüfen)' : '') });
      if (area === 'fortbildung' && zuschuss) {
        const base = a ? a.eur : 0;
        lines.push({ key: 'zuschuss', area: 'fortbildung', l: 'Abzug Zuschuss Aufstiegs-BAföG', eur: -r2(Math.min(zuschuss, base)), sure: true, rule: 'zuschuss', detail: 'Zuschussanteil am Maßnahmebeitrag ' + eur(zuschuss) + (zuschuss > base ? ' (höher als die erfassten Lehrgangskosten – Belege fehlen?)' : '') });
      }
    }
    // Verträge mit steuerlichem Anteil (Telefon/Internet)
    let tel = 0;
    for (const c of live(db, 'contracts')) if (c.tax && TEMPLATES[c.tpl] && TEMPLATES[c.tpl].taxKind === 'telefon') tel += Math.min(240, contractYearCost(c, year) * 0.2);
    if (tel) lines.push({ key: 'telefon', area: 'weitere', l: 'Telefon & Internet (20 %)', eur: r2(Math.min(tel, 240)), sure: false, rule: 'telefon', detail: '20 % der Kosten, höchstens 20 € im Monat' });
    // Tagespauschale Lernen zu Hause
    if (T.sum.home.days) {
      const tp = R.tagespauschale || { wert: 6, max_tage: 210 };
      const n = Math.min(T.sum.home.days, tp.max_tage);
      lines.push({ key: 'tagespauschale', area: 'tagespauschale', l: 'Lernen zu Hause', eur: n * tp.wert, sure: !!tp.geprueft, rule: 'tagespauschale', detail: n + ' Tage × ' + tp.wert + ' €' });
    }
    // Kontoführung nur in Jahren mit Lohn
    const hasWage = T.sum.work.days > 0 || +((db.tax[year] || {}).gross) > 0;
    if (s.kontofuehrung !== false && hasWage && R.kontofuehrung) lines.push({ key: 'konto', area: 'weitere', l: 'Kontoführung (pauschal)', eur: R.kontofuehrung.wert, sure: !!R.kontofuehrung.geprueft, rule: 'kontofuehrung', detail: 'ohne Nachweis' });
    return lines;
  }
  // Betrag eines Belegs, der in einem Jahr steuerlich zählt (beruflicher Anteil, Verteilung bei teuren Arbeitsmitteln)
  function receiptYearAmount(r, year, rules) {
    if (!r || r.del || !r.date) return 0;
    const c = CAT[r.cat]; if (!c || !c.area) return 0;
    const share = (r.share != null ? +r.share : c.share) / 100;
    const total = (+r.amount || 0) * share;
    const y0 = +r.date.slice(0, 4);
    const nd = spreadYears(r, rules);
    if (nd <= 1) return year === y0 ? r2(total) : 0;
    if (year < y0 || year >= y0 + nd) return 0;
    return r2(total / nd);
  }
  function spreadYears(r, rules) {
    const c = CAT[r.cat];
    if (!c || c.area !== 'arbeitsmittel' || c.computer) return 1;   // Computer/Software: 1 Jahr Nutzungsdauer
    const g = (rules && rules.regeln && rules.regeln.arbeitsmittel && rules.regeln.arbeitsmittel.brutto) || 952;
    if ((+r.amount || 0) <= g) return 1;
    return Math.max(2, Math.round(+r.nd || 3));
  }
  const isUnsure = r => !r.ok || (r.unsure && r.unsure.length > 0);

  // Steuerschätzung eines Jahres; carryIn = Verlustvortrag aus dem Vorjahr
  function taxYear(db, year, rules, carryIn) {
    const R = rules.regeln, t = db.tax[year] || {};
    const tr = trips(db, year, rules);
    const lines = wkLines(db, year, rules, tr);
    const sumBy = f => r2(lines.filter(f).reduce((a, l) => a + l.eur, 0));
    const wkAll = sumBy(() => true);
    // untere Spanne: ohne ungeprüfte Posten und ohne noch zu prüfende Belege
    const wkLow = r2(lines.reduce((a, l) => a + (l.sure ? l.eur : l.sureEur != null ? l.sureEur : 0), 0));
    const gross = +t.gross || 0, hasLSt = t.gross != null && t.gross !== '' && t.lst != null && t.lst !== '';
    const pb = R.an_pauschbetrag.wert;
    const spenden = r2(live(db, 'receipts').reduce((a, r) => a + (r.cat === 'spende' ? receiptYearAmount(r, year, rules) : 0), 0));
    const saPausch = (R.sonderausgaben && R.sonderausgaben.pauschbetrag) || 36;
    const vs = vorsorge(t, rules);
    function calc(wk, vsAdj) {
      const wkUsed = wk > pb ? wk : Math.min(pb, gross);
      const income = r2(gross - wkUsed);
      let carry = +carryIn || 0, loss = 0, used = 0, zvE = 0;
      if (income < 0) { loss = -income; }
      else {
        used = Math.min(carry, income);
        const sa = Math.max(saPausch, spenden) + vs.sum * vsAdj;
        zvE = Math.max(0, Math.floor(income - used - sa));
      }
      const est = tariff(zvE, rules);
      const soli = soliOf(est, rules);
      const kist = +t.kist > 0 ? r2(est * ((R.kirchensteuer && R.kirchensteuer.satz) || 9) / 100) : 0;
      const paid = (+t.lst || 0) + (+t.soli || 0) + (+t.kist || 0);
      return { wk, wkUsed, pausch: wk <= pb, income, zvE, est, soli, kist, refund: r2(paid - est - soli - kist), loss: r2(loss), carryUsed: r2(used), carryOut: r2(carry - used + loss) };
    }
    const mid = calc(wkAll, 1);
    const low = calc(wkLow, vs.estimated ? 0.9 : 1);
    const high = calc(wkAll, vs.estimated ? 1.1 : 1);
    const missing = [];
    if (!hasLSt && (tr.sum.work.days > 0)) missing.push('lohnsteuer');
    const deadline = (R.fristen || {});
    return {
      year, lines, trips: tr.sum, wk: wkAll, wkLow, pausch: pb, gross, hasLSt, vorsorge: vs, spenden,
      mid, low, high, refund: hasLSt ? mid.refund : null, range: hasLSt ? [Math.min(low.refund, high.refund), Math.max(low.refund, high.refund)] : null,
      loss: mid.loss, carryIn: +carryIn || 0, carryOut: mid.carryOut, missing, deadline,
      noIncome: gross <= 0 && tr.sum.work.days === 0
    };
  }
  // Alle Jahre mit Regeldatei der Reihe nach rechnen (Verlustvortrag wandert weiter).
  // Ein eingetragener Steuerbescheid mit „verbleibender Verlustvortrag“ ersetzt die eigene Rechnung.
  function taxChain(db, rulesByYear) {
    const years = Object.keys(rulesByYear).map(Number).sort();
    const out = {};
    let carry = +db.settings.carry2025 || 0;
    for (const y of years) {
      const res = taxYear(db, y, rulesByYear[y], carry);
      out[y] = res;
      const b = (db.tax[y] || {}).bescheid;
      carry = b && b.verlust != null && b.verlust !== '' ? +b.verlust : res.carryOut;
    }
    return out;
  }

  /* ---------------- Verträge ---------------- */
  const RHYTHM = { m: { l: 'monatlich', n: 1 }, q: { l: 'vierteljährlich', n: 3 }, h: { l: 'halbjährlich', n: 6 }, y: { l: 'jährlich', n: 12 } };
  const TEMPLATES = {
    kfz: { l: 'Kfz-Versicherung', rhythm: 'y', term: 12, renew: 12, notice: { n: 1, u: 'm' }, yearEnd: '12-31', hint: 'Stichtag 30.11.: bis dahin muss die Kündigung beim Versicherer sein.', taxKind: 'vorsorge' },
    handy: { l: 'Handy', rhythm: 'm', term: 24, renew: 1, notice: { n: 1, u: 'm' }, taxKind: 'telefon' },
    internet: { l: 'Internet', rhythm: 'm', term: 24, renew: 1, notice: { n: 1, u: 'm' }, taxKind: 'telefon' },
    strom: { l: 'Strom', rhythm: 'm', term: 12, renew: 1, notice: { n: 1, u: 'm' } },
    streaming: { l: 'Streaming', rhythm: 'm', term: 1, renew: 1, notice: { n: 0, u: 'd' } },
    fitness: { l: 'Fitness', rhythm: 'm', term: 12, renew: 1, notice: { n: 1, u: 'm' } },
    sonst: { l: 'Sonstiges', rhythm: 'm', term: 12, renew: 1, notice: { n: 1, u: 'm' } }
  };
  const monthly = c => (+c.amount || 0) / ((RHYTHM[c.rhythm] || RHYTHM.m).n);
  function contractYearCost(c, year) {
    const from = c.start && c.start > year + '-01-01' ? c.start : year + '-01-01';
    const to = c.ended && c.ended < year + '-12-31' ? c.ended : year + '-12-31';
    if (to < from) return 0;
    const months = Math.max(0, Math.round(diffDays(from, to) / 30.44));
    return r2(monthly(c) * months);
  }
  function minusNotice(s, n) {
    if (!n || !n.n) return s;
    if (n.u === 'm') return addMonths(s, -n.n);
    if (n.u === 'w') return addDays(s, -7 * n.n);
    return addDays(s, -n.n);
  }
  // Nächstes Laufzeitende, das man noch erreicht, und der letzte Tag, an dem die Kündigung ankommen muss.
  function nextCancel(c, today) {
    if (!c || c.ended) return null;
    const notice = c.notice || { n: 1, u: 'm' };
    const renew = Math.max(1, +c.renew || 12);
    let end;
    if (c.yearEnd) {                                  // festes Vertragsjahr (Kfz: endet am 31.12.)
      const y = +today.slice(0, 4);
      end = y + '-' + c.yearEnd;
      if (end < today) end = (y + 1) + '-' + c.yearEnd;
      if (c.start && +c.term > 0) { const first = addDays(addMonths(c.start, +c.term), -1); while (end < first) end = (+end.slice(0, 4) + 1) + '-' + c.yearEnd; }
    } else if (c.start) {
      const term = Math.max(0, +c.term || 0);
      end = addDays(addMonths(c.start, term || renew), -1);
    } else return { unknown: true };
    const deadlineOf = e => addDays(minusNotice(addDays(e, 1), notice), -1);
    let guard = 0;
    while (deadlineOf(end) < today && guard++ < 600) end = c.yearEnd ? (+end.slice(0, 4) + 1) + '-' + c.yearEnd : addDays(addMonths(addDays(end, 1), renew), -1);
    const deadline = deadlineOf(end);
    return { end, deadline, days: diffDays(today, deadline), anytime: renew <= 1 && (notice.u !== 'm' || notice.n <= 1) };
  }
  function priceChange(c) {
    const p = (c.prices || []).filter(x => x && x.amount != null).sort((a, b) => a.d < b.d ? -1 : 1);
    if (p.length < 2) return null;
    const a = +p[p.length - 2].amount, b = +p[p.length - 1].amount;
    if (!a) return null;
    return { from: a, to: b, pct: Math.round((b - a) / a * 1000) / 10, d: p[p.length - 1].d };
  }
  function cancelText(c, me) {
    const nc = nextCancel(c, todayStr()) || {};
    const name = (me && me.name) || '[Dein Name]';
    return 'Kündigung' + (c.customerNo ? ' – Kundennummer ' + c.customerNo : '') + (c.contractNo ? ', Vertragsnummer ' + c.contractNo : '') + '\n\n' +
      'Sehr geehrte Damen und Herren,\n\n' +
      'hiermit kündige ich meinen Vertrag' + (c.name ? ' „' + c.name + '“' : '') + ' fristgerecht zum ' + (nc.end ? fmtDate(nc.end) : 'nächstmöglichen Zeitpunkt') + ', hilfsweise zum nächstmöglichen Zeitpunkt.\n\n' +
      'Bitte bestätigen Sie mir die Kündigung und das Vertragsende schriftlich. Einer Kontaktaufnahme zu Werbezwecken widerspreche ich.\n\n' +
      'Mit freundlichen Grüßen\n' + name;
  }

  /* ---------------- Zusammenführen (Sicherung) ---------------- */
  // Pro Eintrag gewinnt die neueste Änderung (upd). Gleich alt → lokal. Nichts geht verloren, Löschungen bleiben als Grabstein.
  function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
  function merge(localIn, remoteIn) {
    const local = upgrade(localIn), remote = upgrade(remoteIn);
    const out = upgrade(local);
    let fromRemote = false, fromLocal = false;
    for (const c of COLL) {
      const keys = new Set([...Object.keys(local[c]), ...Object.keys(remote[c])]);
      out[c] = {};
      for (const k of keys) {
        const L = local[c][k], Rm = remote[c][k];
        if (L && !Rm) { out[c][k] = L; fromLocal = true; continue; }
        if (Rm && !L) { out[c][k] = Rm; fromRemote = true; continue; }
        if ((+Rm.upd || 0) > (+L.upd || 0)) { out[c][k] = Rm; if (!same(L, Rm)) fromRemote = true; }
        else { out[c][k] = L; if (!same(L, Rm)) fromLocal = true; }
      }
    }
    const ls = local.settings, rs = remote.settings;
    if ((+rs.upd || 0) > (+ls.upd || 0) || (!(+ls.upd) && !ls.setupDone && rs.setupDone)) { out.settings = rs; if (!same(ls, rs)) fromRemote = true; }
    else { out.settings = ls; if (!same(ls, rs)) fromLocal = true; }
    return { data: out, fromRemote, fromLocal };
  }
  // Belegdateien, die irgendwo referenziert sind
  function fileIds(db) {
    const s = new Set();
    for (const r of live(db, 'receipts')) for (const f of r.files || []) s.add(f.id);
    for (const c of live(db, 'contracts')) for (const f of c.files || []) s.add(f.id);
    return [...s];
  }

  /* ---------------- Posteingang und Erinnerungen ---------------- */
  function deadlinesOf(db, today) {
    const out = [];
    for (const c of live(db, 'contracts')) {
      const n = nextCancel(c, today);
      if (n && n.deadline) out.push({ key: 'k:' + c.id + ':' + n.deadline, kind: 'kuendigung', id: c.id, d: n.deadline, t: (c.name || c.provider || 'Vertrag'), sub: 'Kündigen bis ' + fmtDate(n.deadline) + (n.end ? ' (Ende ' + fmtDate(n.end) + ')' : ''), anytime: n.anytime });
    }
    for (const r of live(db, 'receipts')) {
      const x = receiptDates(r);
      if (x.returnUntil && x.returnUntil >= addDays(today, -1)) out.push({ key: 'r:' + r.id, kind: 'rueckgabe', id: r.id, d: x.returnUntil, t: r.merchant || 'Beleg', sub: 'Rückgabe bis ' + fmtDate(x.returnUntil) });
      if (x.warrantyUntil && x.warrantyUntil >= today) out.push({ key: 'w:' + r.id, kind: 'gewaehr', id: r.id, d: x.warrantyUntil, t: r.merchant || 'Beleg', sub: 'Gewährleistung endet ' + fmtDate(x.warrantyUntil) });
      if (x.guaranteeUntil && x.guaranteeUntil >= today) out.push({ key: 'g:' + r.id, kind: 'garantie', id: r.id, d: x.guaranteeUntil, t: r.merchant || 'Beleg', sub: 'Garantie endet ' + fmtDate(x.guaranteeUntil) });
    }
    return out.sort((a, b) => a.d < b.d ? -1 : 1);
  }
  // Fällige Dinge für „Zu erledigen“. rulesByYear für Steuerfristen.
  function inbox(db, today, rulesByYear, chain) {
    const items = [];
    const dis = db.dismissed || {};
    const isDis = k => dis[k] && !dis[k].del;
    for (const r of live(db, 'receipts')) if (isUnsure(r)) items.push({ key: 'u:' + r.id, kind: 'pruefen', id: r.id, t: (r.merchant || 'Beleg') + (r.amount ? ' · ' + eur(r.amount) : ''), sub: !r.amount ? 'Betrag fehlt' : !r.date ? 'Datum fehlt' : 'Bitte kurz prüfen', sev: 'normal', d: r.date || today });
    const warnDays = { kuendigung: 30, rueckgabe: 7, gewaehr: 30, garantie: 30 };
    for (const x of deadlinesOf(db, today)) {
      const days = diffDays(today, x.d);
      if (x.kind === 'kuendigung' && x.anytime) continue;       // jederzeit kündbar: keine Frist-Meldung
      if (days <= warnDays[x.kind] && !isDis(x.key)) items.push(Object.assign({}, x, { sev: days < 0 ? 'red' : 'normal', days }));
    }
    // Einmal im Jahr: Vertrag noch nötig?
    for (const c of live(db, 'contracts')) {
      if (c.ended) continue;
      const last = c.checked || c.created || null;
      if (last && diffDays(last, today) >= 365) items.push({ key: 'n:' + c.id + ':' + today.slice(0, 4), kind: 'noetig', id: c.id, t: (c.name || c.provider || 'Vertrag'), sub: 'Noch nötig? Einmal im Jahr kurz prüfen', sev: 'normal', d: today });
    }
    // Steuer: Lohnsteuerbescheinigung fehlt (ab März des Folgejahres), Abgabefrist
    for (const y of Object.keys(rulesByYear || {}).map(Number)) {
      const res = chain && chain[y];
      const R = rulesByYear[y].regeln;
      if (res && res.missing.includes('lohnsteuer') && today >= (y + 1) + '-03-01') items.push({ key: 'l:' + y, kind: 'lohnsteuer', year: y, t: 'Lohnsteuerbescheinigung ' + y, sub: 'Zahlen eintragen oder als Block einfügen – dann steht die Erstattung fest', sev: 'normal', d: (y + 1) + '-03-01' });
      const f = R.fristen; if (!f || (db.tax[y] || {}).filed) continue;
      const due = res && res.loss > 0 && !res.gross ? f.verlust : res && res.refund != null && res.refund > 0 ? f.freiwillig : f.pflicht;
      if (today > y + '-12-31') {
        const days = diffDays(today, f.pflicht);
        if (days <= 60 && days >= -400) items.push({ key: 'f:' + y, kind: 'steuerfrist', year: y, t: 'Steuererklärung ' + y + ' abgeben', sub: (res && res.loss > 0 ? 'Damit der Verlustvortrag gesichert ist. ' : '') + 'Pflicht-Frist ' + fmtDate(f.pflicht) + (due !== f.pflicht ? ' (freiwillig bis ' + fmtDate(due) + ')' : ''), sev: days < 0 && due === f.pflicht ? 'red' : 'normal', d: f.pflicht, days });
      }
    }
    return items.filter(i => !isDis(i.key)).sort((a, b) => (a.sev === 'red' ? -1 : 0) - (b.sev === 'red' ? -1 : 0) || (a.d < b.d ? -1 : 1));
  }
  // Termine für Web-Push (Worker speichert nur Datum + kurzen Titel)
  function reminders(db, today, rulesByYear, openCount) {
    const out = [];
    const push = (d, t) => { if (d >= today) out.push({ d, t: t.slice(0, 90) }); };
    for (const x of deadlinesOf(db, today)) {
      if (x.kind === 'kuendigung' && !x.anytime) { push(addDays(x.d, -14), 'Kündigen: ' + x.t + ' – noch 14 Tage (bis ' + fmtShort(x.d) + ')'); push(addDays(x.d, -3), 'Kündigen: ' + x.t + ' – noch 3 Tage (bis ' + fmtShort(x.d) + ')'); }
      if (x.kind === 'rueckgabe') push(addDays(x.d, -3), 'Rückgabe: ' + x.t + ' – noch 3 Tage (bis ' + fmtShort(x.d) + ')');
      if (x.kind === 'gewaehr' || x.kind === 'garantie') push(addMonths(x.d, -1), (x.kind === 'gewaehr' ? 'Gewährleistung' : 'Garantie') + ': ' + x.t + ' endet am ' + fmtShort(x.d));
    }
    for (const y of Object.keys(rulesByYear || {}).map(Number)) {
      const f = rulesByYear[y].regeln.fristen; if (!f || (db.tax[y] || {}).filed) continue;
      push(addDays(f.pflicht, -30), 'Steuererklärung ' + y + ': Frist ' + fmtShort(f.pflicht) + f.pflicht.slice(0, 4) + ' (noch 30 Tage)');
      push(addDays(f.pflicht, -7), 'Steuererklärung ' + y + ': Frist in 7 Tagen');
    }
    // Monatlicher Sammelhinweis am 1. des nächsten Monats
    if (openCount > 0) { const first = addMonths(today.slice(0, 8) + '01', 1); push(first, 'Geldwerk: ' + openCount + (openCount === 1 ? ' Sache' : ' Dinge') + ' offen'); }
    const seen = new Set();
    return out.filter(x => { const k = x.d + x.t; if (seen.has(k)) return false; seen.add(k); return true; }).sort((a, b) => a.d < b.d ? -1 : 1).slice(0, 200);
  }

  return {
    pad, P, F, addDays, addMonths, dow, diffDays, todayStr, isDate, DOW, MONTHS, fmtDate, fmtShort, easter, holidaysNI,
    r2, eur, uid, DEFAULT_SETTINGS, blank, upgrade, live, COLL,
    CATS, CAT, AREAS, MERCHANTS, normMerchant, guessCat, learnKey, receiptDates,
    EXC, trips, dayInfo, holidayMap, ferienOf, tariff, soliOf, vorsorge, wkLines, receiptYearAmount, spreadYears, isUnsure, taxYear, taxChain,
    RHYTHM, TEMPLATES, monthly, contractYearCost, nextCancel, priceChange, cancelText,
    merge, fileIds, deadlinesOf, inbox, reminders
  };
});
