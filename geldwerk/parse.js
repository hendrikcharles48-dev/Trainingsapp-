/* Geldwerk – Texte auswerten: erkannter Belegtext (Texterkennung/PDF) und Geldwerk-Blöcke aus dem Claude-Chat.
   Format der Blöcke: geldwerk/BLOCKFORMAT.md. In Node testbar. */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory(require('./core.js'));
  else root.GW = Object.assign(root.GW || {}, factory(root.GW));
})(typeof self !== 'undefined' ? self : this, function (G) {
  'use strict';

  /* ---------------- Zahlen und Datum ---------------- */
  // "1.234,56" | "1234,56" | "12.99" | "12,9" | "1 234,56 €" → Zahl
  function num(v) {
    if (typeof v === 'number') return isFinite(v) ? v : null;
    let s = String(v == null ? '' : v).replace(/[€\s]|EUR|Euro/gi, '').replace(/[−–]/g, '-');
    if (!s) return null;
    if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, '').replace(',', '.');
    else if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, '');
    else s = s.replace(',', '.');
    const n = parseFloat(s);
    return isFinite(n) && /^-?\d*\.?\d+$/.test(s) ? Math.round(n * 100) / 100 : null;
  }
  const MON = { jan: 1, feb: 2, 'mär': 3, mar: 3, maer: 3, apr: 4, mai: 5, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, okt: 10, oct: 10, nov: 11, dez: 12, dec: 12 };
  function mkDate(d, m, y) {
    y = +y; if (y < 100) y += 2000;
    const s = y + '-' + G.pad(+m) + '-' + G.pad(+d);
    return G.isDate(s) ? s : null;
  }
  // Datum aus Text: "12.03.2026", "12.03.26", "2026-03-12", "12. März 2026"
  function date(v) {
    const s = String(v == null ? '' : v).trim();
    let m = /(\d{4})-(\d{2})-(\d{2})/.exec(s); if (m) return mkDate(m[3], m[2], m[1]);
    m = /(\d{1,2})\s*[./]\s*(\d{1,2})\s*[./]\s*(\d{4}|\d{2})(?!\d)/.exec(s); if (m) return mkDate(m[1], m[2], m[3]);
    m = /(\d{1,2})\.?\s*(jan|feb|mär|mar|maer|apr|mai|may|jun|jul|aug|sep|okt|oct|nov|dez|dec)[a-zä]*\.?\s*(\d{4})/i.exec(s);
    if (m) return mkDate(m[1], MON[m[2].toLowerCase()], m[3]);
    return null;
  }

  /* ---------------- Belegtext ---------------- */
  const AMT = /(?:^|[^\d,.])(-?\d{1,3}(?:\.\d{3})*,\d{2}|-?\d+,\d{2}|-?\d+\.\d{2})(?![\d%])/g;
  const PRETTY = { mediamarkt: 'MediaMarkt', 'media markt': 'MediaMarkt', mcpaper: 'McPaper', notebooksbilliger: 'notebooksbilliger.de', ihk: 'IHK', 'tüv': 'TÜV', dekra: 'DEKRA', obi: 'OBI', 'würth': 'Würth', wuerth: 'Würth', db: 'Deutsche Bahn', 'deutsche bahn': 'Deutsche Bahn', 'engelbert strauss': 'Engelbert Strauss', amazon: 'Amazon' };
  const title = s => s.replace(/\b([a-zäöü])/g, c => c.toUpperCase());
  function amountsIn(line) { const out = []; let m; AMT.lastIndex = 0; while ((m = AMT.exec(line))) { const n = num(m[1]); if (n != null) out.push(n); } return out; }

  function receipt(text, learn, today) {
    const T = String(text || '').replace(/\r/g, '');
    const lines = T.split('\n').map(l => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
    const now = today || G.todayStr();
    const out = { amount: null, date: null, merchant: '', cat: null, kind: 'laden', unsure: [] };
    // Betrag: Zeile mit Summen-Wort, bevorzugt „zu zahlen“/„gesamt“/„summe“
    const KEYS = [[/zu\s*zahlen|zahlbetrag|endbetrag|rechnungsbetrag|gesamtbetrag|betrag\s*brutto|bruttobetrag/i, 3], [/\bgesamt|\bsumme|\btotal\b/i, 2], [/\b(bar|ec[- ]?karte|girocard|kartenzahlung|visa|mastercard|maestro|paypal|gegeben)\b/i, 1]];
    const BAD = /mwst|ust\b|ust\.|netto|steuer|rückgeld|rueckgeld|zurück|%|rabatt|pfand|zwischensumme|anzahl|stk/i;
    let best = null;
    lines.forEach((l, i) => {
      for (const [re, w] of KEYS) {
        if (!re.test(l) || (BAD.test(l) && w < 3)) continue;
        let a = amountsIn(l);
        if (!a.length && lines[i + 1]) a = amountsIn(lines[i + 1]);
        if (!a.length) continue;
        const v = Math.max(...a);
        if (v > 0 && (!best || w > best.w || (w === best.w && v > best.v))) best = { v, w };
        break;
      }
    });
    if (best) { out.amount = best.v; if (best.w < 2) out.unsure.push('amount'); }
    else {
      const all = lines.filter(l => !BAD.test(l)).flatMap(amountsIn).filter(v => v > 0 && v < 20000);
      if (all.length) { out.amount = Math.max(...all); out.unsure.push('amount'); } else out.unsure.push('amount');
    }
    // Datum: erstes plausibles (nicht in der Zukunft, höchstens 3 Jahre alt)
    const min = G.addDays(now, -3 * 366), max = G.addDays(now, 1);
    for (const l of lines) { const d = date(l); if (d && d >= min && d <= max) { out.date = d; break; } }
    if (!out.date) out.unsure.push('date');
    // Händler: bekannter Name im Kopf des Belegs, sonst erste Zeile mit Buchstaben
    const head = lines.slice(0, 10).join(' \n ').toLowerCase();
    let known = null;
    for (const [k] of G.MERCHANTS) if (k.length > 2 && head.includes(k)) { known = k; break; }
    if (!known && /amazon/i.test(head)) known = 'amazon';
    if (known) out.merchant = PRETTY[known] || title(known);
    else {
      const cand = lines.slice(0, 6).find(l => /[a-zäöü]{3,}/i.test(l) && !/kassenbon|kassenbeleg|rechnung|quittung|beleg|www\.|tel\.?|telefon|fax|str\.|straße|strasse|\b\d{5}\b|datum|uhrzeit|filiale|willkommen|ust-?id/i.test(l));
      if (cand) out.merchant = cand.replace(/[^\wäöüÄÖÜß&.\- ]+/g, '').trim().slice(0, 40);
      out.unsure.push('merchant');
    }
    const g = G.guessCat(out.merchant + ' ' + (known ? '' : head.slice(0, 200)), learn);
    if (g) out.cat = g.cat; else out.unsure.push('cat');
    if (/bestellnummer|bestell-nr|bestellung|lieferschein|versand|lieferdatum|amazon|online-?shop|www\.[a-z]/i.test(T)) out.kind = 'online';
    return out;
  }

  /* ---------------- Geldwerk-Block ---------------- */
  const keyOf = k => String(k).toLowerCase().trim().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/\(.*?\)/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  const ALIAS = {
    // Lohnsteuerbescheinigung
    bruttolohn: 'gross', bruttoarbeitslohn: 'gross', brutto: 'gross', zeile_3: 'gross',
    lohnsteuer: 'lst', einbehaltene_lohnsteuer: 'lst', zeile_4: 'lst',
    soli: 'soli', solidaritaetszuschlag: 'soli', zeile_5: 'soli',
    kirchensteuer: 'kist', kirchensteuer_an: 'kist',
    rentenversicherung: 'rv', rv: 'rv', rv_an: 'rv', rentenversicherung_an: 'rv', zeile_23a: 'rv', zeile_23: 'rv',
    krankenversicherung: 'kv', kv: 'kv', kv_an: 'kv', krankenversicherung_an: 'kv', zeile_25: 'kv',
    pflegeversicherung: 'pv', pv: 'pv', pv_an: 'pv', pflegeversicherung_an: 'pv', zeile_26: 'pv',
    arbeitslosenversicherung: 'av', av: 'av', av_an: 'av', arbeitslosenversicherung_an: 'av', zeile_27: 'av',
    arbeitgeber: 'employer', zeitraum: 'period',
    // Steuerbescheid
    festgesetzt: 'festgesetzt', einkommensteuer: 'festgesetzt', festgesetzte_einkommensteuer: 'festgesetzt',
    erstattung: 'erstattung', nachzahlung: 'nachzahlung', verlustvortrag: 'verlust', verbleibender_verlustvortrag: 'verlust',
    bescheid_datum: 'datum', datum_bescheid: 'datum',
    // Aufstiegs-BAföG
    zuschuss: 'zuschuss', zuschuss_lehrgang: 'zuschuss', zuschussanteil: 'zuschuss', massnahmebeitrag_zuschuss: 'zuschuss', darlehen: 'darlehen', darlehen_lehrgang: 'darlehen', lehrgangsgebuehren: 'gebuehren', pruefungsgebuehr: 'pruefung',
    // Vertrag
    vorlage: 'tpl', art: 'tpl', anbieter: 'provider', name: 'name', bezeichnung: 'name', tarif: 'name', betrag: 'amount', beitrag: 'amount', preis: 'amount',
    rhythmus: 'rhythm', zahlweise: 'rhythm', beginn: 'start', vertragsbeginn: 'start', start: 'start', mindestlaufzeit: 'term', laufzeit: 'term',
    verlaengerung: 'renew', kuendigungsfrist: 'notice', frist: 'notice', kundennummer: 'customerNo', vertragsnummer: 'contractNo', versicherungsnummer: 'contractNo', versicherungsscheinnummer: 'contractNo',
    steuerlich: 'tax', steuerlich_relevant: 'tax', email: 'email', e_mail: 'email', kuendigung_an: 'email', notiz: 'note', hinweis: 'note', ablauf: 'yearEnd', hauptfaelligkeit: 'yearEnd',
    // Beleg
    haendler: 'merchant', geschaeft: 'merchant', laden: 'merchant', kategorie: 'cat', kaufart: 'kind', steuerjahr: 'year', garantie: 'guaranteeYears', garantie_jahre: 'guaranteeYears', anteil: 'share', beruflich: 'share',
    // allgemein
    typ: 'typ', jahr: 'jahr', datum: 'date'
  };
  const MONEY = new Set(['gross', 'lst', 'soli', 'kist', 'rv', 'kv', 'pv', 'av', 'festgesetzt', 'erstattung', 'nachzahlung', 'verlust', 'zuschuss', 'darlehen', 'gebuehren', 'pruefung', 'amount']);
  const TYPES = {
    lohnsteuerbescheinigung: 'lohnsteuer', lohnsteuer: 'lohnsteuer', lstb: 'lohnsteuer',
    steuerbescheid: 'bescheid', bescheid: 'bescheid', einkommensteuerbescheid: 'bescheid',
    aufstiegs_bafoeg: 'bafoeg', aufstiegsbafoeg: 'bafoeg', bafoeg: 'bafoeg', afbg: 'bafoeg', meister_bafoeg: 'bafoeg',
    vertrag: 'vertrag', versicherung: 'vertrag', versicherungsschein: 'vertrag', abo: 'vertrag',
    beleg: 'beleg', rechnung: 'beleg', kassenbon: 'beleg', quittung: 'beleg'
  };
  const TPL = { kfz: 'kfz', kfz_versicherung: 'kfz', autoversicherung: 'kfz', auto: 'kfz', handy: 'handy', mobilfunk: 'handy', internet: 'internet', dsl: 'internet', strom: 'strom', streaming: 'streaming', netflix: 'streaming', fitness: 'fitness', fitnessstudio: 'fitness', sonstiges: 'sonst', sonst: 'sonst', versicherung: 'sonst' };
  const RH = { monatlich: 'm', monat: 'm', m: 'm', vierteljaehrlich: 'q', quartal: 'q', q: 'q', halbjaehrlich: 'h', h: 'h', jaehrlich: 'y', jahr: 'y', y: 'y' };
  const CATK = { fortbildung: 'fortbildung', lehrgang: 'fortbildung', pruefung: 'fortbildung', fachbuch: 'fachbuch', fachbuecher: 'fachbuch', buch: 'fachbuch', technik: 'technik', computer: 'technik', software: 'technik', arbeitsmittel: 'arbeitsmittel', werkzeug: 'arbeitsmittel', buero: 'buero', kleidung: 'kleidung', arbeitskleidung: 'kleidung', reise: 'reise', fahrt: 'reise', bewerbung: 'bewerbung', spende: 'spende', privat: 'privat' };
  const yes = v => /^(ja|yes|true|1|x|wahr)$/i.test(String(v).trim());
  function notice(v) {
    const m = /(\d+)\s*(monat|woche|tag|m|w|t|d)/i.exec(String(v || ''));
    if (!m) return /keine|0|jederzeit|sofort/i.test(String(v)) ? { n: 0, u: 'd' } : null;
    const u = m[2].toLowerCase()[0];
    return { n: +m[1], u: u === 'm' ? 'm' : u === 'w' ? 'w' : 'd' };
  }

  // Text → Liste von Blöcken { typ, data, warn[] }. Unbekannte Zeilen werden gemeldet, nicht verworfen.
  function blocks(text) {
    const lines = String(text || '').replace(/\r/g, '').split('\n');
    const out = [];
    let cur = null;
    const start = () => { cur = { raw: {}, warn: [] }; out.push(cur); };
    for (const lineRaw of lines) {
      const line = lineRaw.replace(/^[\s>*`-]+|[`*]+$/g, '').trim();
      if (!line) continue;
      if (/^#*\s*geldwerk(-?block)?\b/i.test(line) && !/:/.test(line)) { start(); continue; }
      if (/^#*\s*(ende|end)\b\s*#*$/i.test(line)) { cur = null; continue; }
      const m = /^([^:=]{1,60})[:=]\s*(.*)$/.exec(line);
      if (!m) continue;
      const k = keyOf(m[1]);
      if (!cur || (k === 'typ' && cur.raw.typ)) start();
      cur.raw[k] = m[2].trim();
    }
    return out.filter(b => Object.keys(b.raw).length).map(normalize);
  }
  function normalize(b) {
    const raw = b.raw, warn = [];
    const typ = TYPES[keyOf(raw.typ || '')] || null;
    if (!typ) warn.push('Unbekannter Typ „' + (raw.typ || '') + '“');
    const data = {};
    for (const [k0, v] of Object.entries(raw)) {
      if (k0 === 'typ') continue;
      const k = ALIAS[k0] || (k0.startsWith('zeile_') ? null : k0);
      if (!k) { warn.push('Feld „' + k0 + '“ nicht erkannt'); continue; }
      if (v === '' || /^(-|—|unbekannt|k\.?\s?a\.?|leer)$/i.test(v)) continue;
      if (MONEY.has(k)) { const n = num(v); if (n == null) warn.push(k0 + ': „' + v + '“ ist keine Zahl'); else data[k] = n; continue; }
      if (k === 'jahr' || k === 'year') { const y = parseInt(v, 10); if (y > 2000 && y < 2100) data.jahr = y; else warn.push('Jahr „' + v + '“ unklar'); continue; }
      if (k === 'date' || k === 'start' || k === 'datum') { const d = date(v); if (d) data[k === 'datum' ? 'date' : k] = d; else warn.push(k0 + ': Datum „' + v + '“ unklar'); continue; }
      if (k === 'term' || k === 'renew') { const n = parseInt(v, 10); if (n >= 0) data[k] = /jahr/i.test(v) ? n * 12 : n; continue; }
      if (k === 'notice') { const n = notice(v); if (n) data.notice = n; else warn.push('Kündigungsfrist „' + v + '“ unklar'); continue; }
      if (k === 'rhythm') { const r = RH[keyOf(v)]; if (r) data.rhythm = r; else warn.push('Rhythmus „' + v + '“ unklar'); continue; }
      if (k === 'tpl') { data.tpl = TPL[keyOf(v)] || 'sonst'; continue; }
      if (k === 'tax') { data.tax = yes(v); continue; }
      if (k === 'cat') { const c = CATK[keyOf(v)]; if (c) data.cat = c; else warn.push('Kategorie „' + v + '“ unklar'); continue; }
      if (k === 'kind') { data.kind = /online|internet|versand/i.test(v) ? 'online' : 'laden'; continue; }
      if (k === 'share') { const n = num(String(v).replace('%', '')); if (n != null) data.share = Math.max(0, Math.min(100, n)); continue; }
      if (k === 'guaranteeYears') { const n = parseInt(v, 10); if (n >= 0) data.guaranteeYears = n; continue; }
      if (k === 'yearEnd') { const d = /(\d{1,2})\.(\d{1,2})\.?/.exec(v); if (d) data.yearEnd = G.pad(+d[2]) + '-' + G.pad(+d[1]); continue; }
      data[k] = String(v).slice(0, 200);
    }
    if (typ === 'lohnsteuer' && (data.gross == null || data.lst == null)) warn.push('Bruttolohn und Lohnsteuer werden gebraucht');
    if ((typ === 'lohnsteuer' || typ === 'bescheid' || typ === 'bafoeg') && !data.jahr) warn.push('Jahr fehlt');
    if (typ === 'vertrag' && !data.provider && !data.name) warn.push('Anbieter fehlt');
    if (typ === 'beleg' && data.amount == null) warn.push('Betrag fehlt');
    return { typ, data, warn };
  }

  const TYP_LABEL = { lohnsteuer: 'Lohnsteuerbescheinigung', bescheid: 'Steuerbescheid', bafoeg: 'Aufstiegs-BAföG-Bescheid', vertrag: 'Vertrag', beleg: 'Beleg' };
  const FIELD_LABEL = {
    jahr: 'Jahr', gross: 'Bruttolohn', lst: 'Lohnsteuer', soli: 'Soli', kist: 'Kirchensteuer', rv: 'Rentenversicherung', kv: 'Krankenversicherung', pv: 'Pflegeversicherung', av: 'Arbeitslosenversicherung',
    employer: 'Arbeitgeber', period: 'Zeitraum', festgesetzt: 'Festgesetzte Steuer', erstattung: 'Erstattung', nachzahlung: 'Nachzahlung', verlust: 'Verbleibender Verlustvortrag', date: 'Datum',
    zuschuss: 'Zuschuss (Lehrgang/Prüfung)', darlehen: 'Darlehen', gebuehren: 'Lehrgangsgebühren', pruefung: 'Prüfungsgebühr',
    tpl: 'Vorlage', provider: 'Anbieter', name: 'Name', amount: 'Betrag', rhythm: 'Rhythmus', start: 'Beginn', term: 'Mindestlaufzeit (Monate)', renew: 'Verlängerung (Monate)', notice: 'Kündigungsfrist',
    customerNo: 'Kundennummer', contractNo: 'Vertragsnummer', tax: 'Steuerlich relevant', email: 'Kündigung an', note: 'Notiz', yearEnd: 'Vertragsjahr endet',
    merchant: 'Händler', cat: 'Kategorie', kind: 'Kaufart', year: 'Steuerjahr', guaranteeYears: 'Garantie (Jahre)', share: 'Beruflicher Anteil (%)'
  };
  return { num, date, receipt, blocks, TYP_LABEL, FIELD_LABEL };
});
