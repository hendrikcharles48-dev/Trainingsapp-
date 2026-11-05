// Kochwerk – Kern: Datenmodell, Rezept-Import, Nährwerte, Kalorienziel, Zusammenführen.
// Läuft im Browser (window.KW) und in Node (require) für die Tests.
(function (root) {
  'use strict';

  // ---------- Grundlagen ----------
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const now = () => Date.now();
  const num = s => {
    if (s == null) return NaN;
    s = String(s).trim().replace(/\s/g, '');
    if (s === '½') return 0.5;
    if (s === '¼') return 0.25;
    if (s === '¾') return 0.75;
    const fr = /^(\d+)\/(\d+)$/.exec(s);
    if (fr) return +fr[1] / +fr[2];
    return parseFloat(s.replace(',', '.'));
  };
  const round = (n, d = 0) => { const f = Math.pow(10, d); return Math.round(n * f) / f; };
  const norm = s => String(s || '').toLowerCase().replace(/ß/g, 'ss').replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/[^a-z0-9]+/g, ' ').trim();
  const isoDate = (d = new Date()) => { const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return z.toISOString().slice(0, 10); };

  // ---------- Feste Listen ----------
  const CATS = [
    { id: 'main', label: 'Hauptmahlzeit', short: 'Haupt', icon: '🍲' },
    { id: 'snack', label: 'Snack / kleine Mahlzeit', short: 'Snack', icon: '🥪' },
    { id: 'hunger', label: 'Snack für den Hungerknopf', short: 'Hungerknopf', icon: '🥜' },
    { id: 'emergency', label: 'Notfallgericht aus Vorrat', short: 'Notfall', icon: '🥫' }
  ];
  const catById = id => CATS.find(c => c.id === id) || CATS[0];

  // Bereiche im Supermarkt, in der Reihenfolge eines typischen Rundgangs
  const AREAS = [
    { id: 'obst', label: 'Obst & Gemüse' },
    { id: 'brot', label: 'Brot & Backwaren' },
    { id: 'kuehl', label: 'Kühlregal' },
    { id: 'fleisch', label: 'Fleisch & Fisch' },
    { id: 'trocken', label: 'Trockenware' },
    { id: 'konserve', label: 'Konserven & Gläser' },
    { id: 'gewuerz', label: 'Gewürze, Öl & Soßen' },
    { id: 'tk', label: 'Tiefkühl' },
    { id: 'getraenke', label: 'Getränke' },
    { id: 'sonst', label: 'Sonstiges' }
  ];
  const areaById = id => AREAS.find(a => a.id === id) || AREAS[AREAS.length - 1];

  const ACTIVITY = [
    { v: 1.2, label: 'Kaum Bewegung', sub: 'Sitzen in Schule oder Büro, kein Sport' },
    { v: 1.375, label: 'Leicht aktiv', sub: '1–3× Sport pro Woche' },
    { v: 1.55, label: 'Aktiv', sub: '3–5× Sport pro Woche' },
    { v: 1.725, label: 'Sehr aktiv', sub: 'Fast täglich Sport oder körperliche Arbeit' }
  ];
  const TEMPO = [
    { id: 'slow', pct: 0.0025, label: 'Langsam', sub: 'Am leichtesten durchzuhalten' },
    { id: 'moderate', pct: 0.005, label: 'Moderat', sub: 'Empfohlen: Fett runter, Muskeln bleiben' },
    { id: 'fast', pct: 0.0075, label: 'Zügig', sub: 'Spürbar weniger Essen, nur mit viel Protein' }
  ];
  const WEEKDAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

  const DEFAULTS = {
    sex: 'm', age: 25, height: 180, activity: 1.55, tempo: 'moderate',
    protein: 180, mealKcal: 600, cookDay: 0, partnerFactor: 0.8, setupDone: false
  };

  // Gewicht für Zähl-Einheiten ohne Angabe „à … g“
  const COUNT_UNITS = {
    'stuck': 'Stück', 'stk': 'Stück', 'st': 'Stück', 'stueck': 'Stück',
    'el': 'EL', 'essloffel': 'EL', 'tl': 'TL', 'teeloffel': 'TL',
    'prise': 'Prise', 'prisen': 'Prise', 'scheibe': 'Scheibe', 'scheiben': 'Scheibe',
    'zehe': 'Zehe', 'zehen': 'Zehe', 'bund': 'Bund', 'dose': 'Dose', 'dosen': 'Dose',
    'packung': 'Packung', 'packungen': 'Packung', 'pck': 'Packung', 'becher': 'Becher',
    'handvoll': 'Handvoll', 'ei': 'Stück', 'eier': 'Stück', 'glas': 'Glas', 'beutel': 'Beutel', 'tasse': 'Tasse'
  };
  const UNIT_DEFAULT_G = { 'EL': 10, 'TL': 4, 'Prise': 0.5 };

  // ---------- Einzelne Angaben lesen ----------
  const NUM = '(\\d+(?:[.,]\\d+)?(?:\\s*\\/\\s*\\d+)?|½|¼|¾)';

  // „1000 g“, „1 kg“, „250 ml“, „0,5 l“, „4 Stück à 60 g“, „1 EL“
  function parseAmount(str) {
    const s = String(str || '').trim().replace(/^(ca\.?|etwa|circa)\s*/i, '');
    const m = new RegExp('^' + NUM + '\\s*([A-Za-zÄÖÜäöüß.]+)?(?:\\s*(?:à|á|a|je|zu je|x)\\s*' + NUM + '\\s*(g|ml)\\b)?', 'i').exec(s);
    if (!m) return null;
    const qty = num(m[1]);
    if (!isFinite(qty)) return null;
    const u = (m[2] || '').replace(/\.$/, '');
    const un = norm(u);
    let unit, g, pieceG = null, warn = null;
    if (!u || un === 'g' || un === 'gramm' || un === 'gr') { unit = 'g'; g = qty; }
    else if (un === 'kg') { unit = 'g'; g = qty * 1000; }
    else if (un === 'ml') { unit = 'ml'; g = qty; }
    else if (un === 'l' || un === 'liter') { unit = 'ml'; g = qty * 1000; }
    else if (un === 'cl') { unit = 'ml'; g = qty * 10; }
    else if (COUNT_UNITS[un]) {
      unit = COUNT_UNITS[un];
      if (m[3]) pieceG = num(m[3]);
      else if (UNIT_DEFAULT_G[unit]) pieceG = UNIT_DEFAULT_G[unit];
      else warn = 'Gewicht pro ' + unit + ' fehlt (z. B. „' + qty + ' ' + unit + ' à 60 g“)';
      g = pieceG ? qty * pieceG : 0;
    } else return null;
    // Bei g/ml in Kilo/Liter-Angaben die Menge in Grundeinheit führen
    const outQty = (unit === 'g' || unit === 'ml') ? g : qty;
    return { qty: round(outQty, 2), unit, pieceG, g: round(g, 2), warn };
  }

  // Packung: „Packung 500 g“, „Dose 400 g“, „Netz 1 kg“, „Packung 10 Stück“, „Bund“, „Stück“, „Vorrat“, „-“
  function parsePack(str) {
    let s = String(str || '').trim();
    if (!s || /^[-–—]$/.test(s) || /^(keine?|ohne)$/i.test(s)) return { pack: null, pantry: false };
    if (/vorrat|grundvorrat|im haus|haben wir/i.test(s)) {
      // „Vorrat“ allein oder „Vorrat, Flasche 500 ml“
      const rest = s.replace(/grundvorrat|vorrat|im haus|haben wir/ig, '').replace(/^[\s,;:()-]+|[\s,;:()-]+$/g, '');
      const p = /\d/.test(rest) ? parsePack(rest) : { pack: null };
      return { pack: p.pack || null, pantry: true };
    }
    // Klammer merken: „(250 g abgetropft)“ oder „(ca. 800 g)“
    let paren = null;
    s = s.replace(/\(([^)]*)\)/g, (all, x) => { paren = x.trim(); return ' '; }).replace(/\s+/g, ' ').trim();
    s = s.replace(/^\d+\s*[x×]\s*/i, '');
    // „Packung“ als Füllwort: „Packung Glas 120 g“, „Packung Dose 400 g“, „Packung 1 Knolle“, „Packung Tube 200 ml“
    if (/^packung\s+\S/i.test(s) && !new RegExp('^packung\\s+' + NUM + '\\s*(g|kg|ml|l|stück|stk|st)?\\.?$', 'i').test(s)) s = s.replace(/^packung\s+/i, '');
    let kind = null, size = null, u = '';
    let m = new RegExp('^([A-Za-zÄÖÜäöüß-]+)?\\s*' + NUM + '?\\s*(g|kg|ml|l|stück|stk|st)?\\.?$', 'i').exec(s);
    if (m && (m[1] || m[2])) { kind = m[1] || null; size = m[2] ? num(m[2]) : 1; u = norm(m[3] || ''); }
    else if ((m = new RegExp('^' + NUM + '\\s+([A-Za-zÄÖÜäöüß-]+)$', 'i').exec(s))) { kind = m[2]; size = num(m[1]); u = 'stuck'; } // „1 Knolle“, „1 Bund“
    else return { pack: null, pantry: false, warn: 'Packung nicht erkannt: „' + str + '“' };
    let unit;
    if (u === 'g') unit = 'g';
    else if (u === 'kg') { unit = 'g'; size *= 1000; }
    else if (u === 'ml') unit = 'ml';
    else if (u === 'l') { unit = 'ml'; size *= 1000; }
    else unit = 'Stück';
    if (!isFinite(size) || size <= 0) return { pack: null, pantry: false, warn: 'Packungsgröße nicht erkannt: „' + str + '“' };
    if (!kind) kind = unit === 'Stück' && size === 1 ? 'Stück' : 'Packung';
    kind = kind[0].toUpperCase() + kind.slice(1);
    if (kind === 'Packung' && unit === 'Stück' && size === 1) kind = 'Stück';
    const pack = { kind, size: round(size, 2), unit };
    if (paren) {
      const pm = new RegExp(NUM + '\\s*(g|kg|ml|l)\\b', 'i').exec(paren);
      const pg = pm ? num(pm[1]) * (/^(kg|l)$/i.test(pm[2]) ? 1000 : 1) : null;
      if (pg && /abgetropft|abtropf/i.test(paren)) {
        // Gerechnet wird mit dem Abtropfgewicht, angezeigt wird die ganze Dose
        pack.label = packText(pack) + ' (' + paren + ')'; pack.size = round(pg, 2); pack.unit = 'g';
      } else if (pg && unit === 'Stück' && size === 1) {
        // „1 Stück (ca. 800 g)“: ein Stück mit ungefährem Gewicht
        pack.label = kind + ' (' + paren + ')'; pack.size = round(pg, 2); pack.unit = /ml|l/i.test(pm[2]) ? 'ml' : 'g';
      } else pack.label = packText(pack) + ' (' + paren + ')';
    }
    return { pack, pantry: false };
  }
  function packText(p) {
    if (!p) return '';
    if (p.label) return p.label;
    if (p.unit === 'Stück') return p.size === 1 ? p.kind : p.kind + ' ' + fmtNum(p.size) + ' Stück';
    if (p.unit === 'g' && p.size >= 1000) return p.kind + ' ' + fmtNum(p.size / 1000) + ' kg';
    if (p.unit === 'ml' && p.size >= 1000) return p.kind + ' ' + fmtNum(p.size / 1000) + ' l';
    return p.kind + ' ' + fmtNum(p.size) + ' ' + p.unit;
  }

  // Werte pro 100 g: „110 kcal, 23 P, 0 K, 1,5 F“ oder „kcal 110, Protein 23, KH 0, Fett 1,5“
  const LBL = {
    kcal: 'kcal', kcals: 'kcal', kalorien: 'kcal', cal: 'kcal',
    p: 'p', e: 'p', protein: 'p', eiweiss: 'p', eiweis: 'p',
    k: 'c', kh: 'c', c: 'c', kohlenhydrate: 'c', carbs: 'c',
    f: 'f', fett: 'f', fat: 'f'
  };
  function parseNutr(str) {
    const s = String(str || '').replace(/pro\s*100\s*(g|ml)/ig, ' ').replace(/\/\s*100\s*(g|ml)/ig, ' ');
    const out = { kcal: null, p: null, c: null, f: null };
    const set = (lbl, v) => { const k = LBL[norm(lbl).replace(/\s/g, '')]; if (k && out[k] == null && isFinite(v)) out[k] = v; };
    const labelFirst = /^\s*[A-Za-zÄÖÜäöüß]/.test(s);
    const L = '(kcal|kcals|kalorien|protein|eiweiß|eiweiss|kohlenhydrate|carbs|kh|fett|fat|p|e|k|c|f)';
    const re = labelFirst
      ? new RegExp(L + '\\s*:?\\s*' + '(\\d+(?:[.,]\\d+)?)', 'ig')
      : new RegExp('(\\d+(?:[.,]\\d+)?)\\s*(?:g\\s+)?' + L + '(?![A-Za-zÄÖÜäöüß])', 'ig');
    let m;
    while ((m = re.exec(s))) labelFirst ? set(m[1], num(m[2])) : set(m[2], num(m[1]));
    const missing = Object.keys(out).filter(k => out[k] == null);
    return { per100: out, missing };
  }

  const CAT_WORDS = [
    ['hunger', /hunger/],
    ['emergency', /notfall|vorrat|plan geplatzt/],
    ['snack', /snack|klein/],
    ['main', /haupt|mahlzeit|gericht|meal/]
  ];
  function parseCat(str) {
    const s = norm(str);
    for (const [id, re] of CAT_WORDS) if (re.test(s)) return id;
    return null;
  }
  const AREA_WORDS = [
    ['tk', /tiefkuhl|tiefgekuhlt|\btk\b|gefroren|frost/],
    ['fleisch', /fleisch|fisch|wurst|theke|gefluegel|geflugel/],
    ['kuehl', /kuhl|molkerei|milch|frische theke/],
    ['obst', /obst|gemuse|salat|frisch/],
    ['brot', /brot|backwaren|backer|backerei/],
    ['konserve', /konserve|dose|glas|glaser/],
    ['gewuerz', /gewurz|ol\b|ole\b|sosse|sossen|sauce|essig|wurz/],
    ['getraenke', /getrank/],
    ['trocken', /trocken|nudel|reis|backen|backzutat|musli|cerealien|vorrat|regal/],
    ['sonst', /sonst/]
  ];
  function parseArea(str) {
    const s = norm(str);
    if (!s) return null;
    for (const [id, re] of AREA_WORDS) if (re.test(s)) return id;
    return null;
  }
  function parseBool(str) {
    const s = norm(str);
    if (/^(ja|j|yes|y|x|true|1|geht|gut)\b/.test(s)) return true;
    if (/^(nein|n|no|false|0|nicht|schlecht)\b/.test(s)) return false;
    return null;
  }
  // „[12 min nebenbei]“, „[1 h 10 min]“, „[Timer 30 s]“
  function parseStepMeta(text) {
    let min = null, passive = false;
    const t = text.replace(/\[([^\]]*)\]/g, (all, inner) => {
      const i = inner.toLowerCase();
      if (!/\d/.test(i) || !/(min|std|h\b|stunde|sek|\bs\b)/.test(i)) return all;
      let m = 0;
      const h = /(\d+(?:[.,]\d+)?)\s*(h|std|stunde)/.exec(i); if (h) m += num(h[1]) * 60;
      const mm = /(\d+(?:[.,]\d+)?)\s*min/.exec(i); if (mm) m += num(mm[1]);
      const sec = /(\d+)\s*(sek|s\b)/.exec(i); if (sec) m += num(sec[1]) / 60;
      if (min == null) min = round(m, 2);
      if (/nebenbei|passiv|warten|ziehen|quellen|ruhen|abkuhlen|abkühlen/.test(i)) passive = true;
      return '';
    }).replace(/\s{2,}/g, ' ').trim();
    return { text: t, min, passive };
  }

  // ---------- Rezept-Block lesen ----------
  const START = /^=+\s*(kochwerk\s*[-–]?\s*)?rezept\s*=+$/i;
  const END = /^=+\s*ende\s*=+$/i;
  const KEYS = [
    ['name', /^(name|titel|rezept)$/],
    ['cat', /^(kategorie|art|typ)$/],
    ['portions', /^(portionen|portion|port)$/],
    ['keepDays', /^(haltbar|haltbarkeit|kuhlschrank|haltbar im kuhlschrank)$/],
    ['freeze', /^(einfrierbar|einfrieren|tiefkuhlgeeignet|gefrierfach)$/],
    ['box', /^(boxtauglich|box|schulbox|box tauglich)$/],
    ['time', /^(zeit|dauer|gesamtzeit|arbeitszeit)$/],
    ['note', /^(notiz|hinweis|anmerkung)$/],
    ['tip', /^(tipp|spartipp|spar tipp|tipps|energie tipp|energietipp)$/],
    ['ings', /^(zutaten)$/],
    ['steps', /^(schritte|zubereitung|anleitung)$/]
  ];
  function keyOf(label) {
    const n = norm(label);
    for (const [k, re] of KEYS) if (re.test(n)) return k;
    return null;
  }
  function cleanLine(line) {
    return line.replace(/\r/g, '')
      .replace(/^\s*>+\s?/, '')
      .replace(/\*\*|__/g, '')
      .replace(/^\s*#{1,6}\s*/, '')
      .replace(/`/g, '')
      .replace(/^\s*[*•·–—]\s+/, '- ')
      .replace(/ /g, ' ')
      .replace(/\s+$/, '');
  }

  function blankRecipe() {
    return { id: null, name: '', cat: null, portions: null, keepDays: null, freeze: null, box: null, time: null, note: '', tips: [], ingredients: [], steps: [] };
  }

  function parseIngredient(line, warn) {
    const raw = line.replace(/^\s*-\s*/, '').trim();
    if (!raw) return null;
    const cols = raw.split('|').map(c => c.trim());
    const ing = { name: cols[0], qty: 0, unit: 'g', pieceG: null, g: 0, pack: null, pantry: false, area: 'sonst', per100: { kcal: null, p: null, c: null, f: null } };
    if (!ing.name) return null;
    let nutrCol = null, amountCol = null, packCol = null, areaCol = null;
    for (const c of cols.slice(1)) {
      if (!c) continue;
      if (nutrCol == null && /kcal|kalorien/i.test(c)) { nutrCol = c; continue; }
      if (amountCol == null && parseAmount(c)) { amountCol = c; continue; }
      if (areaCol == null && parseArea(c) && !/\d/.test(c) && !/vorrat/i.test(c)) { areaCol = c; continue; }
      if (packCol == null) { packCol = c; continue; }
      if (areaCol == null) areaCol = c;
    }
    if (cols.length < 2) warn('Zutat „' + ing.name + '“: Spalten mit | trennen (Name | Menge | Packung | Bereich | Werte)');
    if (amountCol) {
      const a = parseAmount(amountCol);
      Object.assign(ing, { qty: a.qty, unit: a.unit, pieceG: a.pieceG, g: a.g });
      if (a.warn) warn('Zutat „' + ing.name + '“: ' + a.warn);
    } else warn('Zutat „' + ing.name + '“: Menge fehlt');
    if (packCol != null) {
      const p = parsePack(packCol);
      ing.pack = p.pack; ing.pantry = p.pantry;
      if (p.warn) warn('Zutat „' + ing.name + '“: ' + p.warn);
    }
    if (areaCol != null) {
      const a = parseArea(areaCol);
      if (a) ing.area = a; else warn('Zutat „' + ing.name + '“: Bereich „' + areaCol + '“ unbekannt, steht unter Sonstiges');
    } else if (ing.pantry) ing.area = 'gewuerz';
    if (nutrCol) {
      const n = parseNutr(nutrCol);
      ing.per100 = n.per100;
      if (n.missing.length) warn('Zutat „' + ing.name + '“: Werte fehlen (' + n.missing.map(k => ({ kcal: 'kcal', p: 'Protein', c: 'KH', f: 'Fett' })[k]).join(', ') + ')');
    } else warn('Zutat „' + ing.name + '“: Werte pro 100 g fehlen');
    return ing;
  }

  // Liest einen Text mit einem oder mehreren Rezepten.
  // Rückgabe: [{ recipe, warnings: [], errors: [] }]
  function parseRecipes(text) {
    const lines = String(text || '').split('\n').map(cleanLine);
    const out = [];
    let cur = null, mode = null, sawStart = false;
    const begin = () => { cur = { recipe: blankRecipe(), warnings: [], errors: [] }; mode = null; };
    const finish = () => {
      if (!cur) return;
      const r = cur.recipe;
      const empty = !r.name && !r.ingredients.length && !r.steps.length;
      if (!empty) out.push(finalize(cur));
      cur = null; mode = null;
    };
    for (const line of lines) {
      const t = line.trim();
      if (START.test(t)) { finish(); begin(); sawStart = true; continue; }
      if (END.test(t)) { finish(); continue; }
      if (/^[-=_*]{3,}$/.test(t) || /^```/.test(t)) continue;
      if (!t) continue;
      const kv = /^([A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß \-/]{0,30}?)\s*:\s*(.*)$/.exec(t);
      const key = kv ? keyOf(kv[1]) : null;
      if (key === 'name') {
        // Neues Rezept beginnt, auch ohne Start-Markierung
        if (!cur || cur.recipe.name) { finish(); begin(); }
        cur.recipe.name = kv[2].trim();
        continue;
      }
      if (!cur) { if (sawStart || key) begin(); else continue; }
      const r = cur.recipe, warn = w => cur.warnings.push(w);
      if (key) {
        const v = kv[2].trim();
        switch (key) {
          case 'cat': r.cat = parseCat(v); if (!r.cat) warn('Kategorie „' + v + '“ unbekannt, als Hauptmahlzeit eingetragen'); continue;
          case 'portions': r.portions = num(v); if (!(r.portions > 0)) { r.portions = null; } continue;
          case 'keepDays': r.keepDays = num((/(\d+(?:[.,]\d+)?)/.exec(v) || [])[1]); if (!isFinite(r.keepDays)) r.keepDays = null; continue;
          case 'freeze': r.freeze = parseBool(v); continue;
          case 'box': r.box = parseBool(v); continue;
          case 'time': { const m = /(\d+)/.exec(v); r.time = m ? +m[1] * (/std|h\b|stunde/i.test(v) && !/min/i.test(v) ? 60 : 1) : null; continue; }
          case 'note': r.note = (r.note ? r.note + '\n' : '') + v; continue;
          case 'tip':
            if (mode === 'steps' && r.steps.length) { const s = r.steps[r.steps.length - 1]; s.tip = (s.tip ? s.tip + ' ' : '') + v; }
            else r.tips.push(v);
            continue;
          case 'ings': mode = 'ing'; if (v) { const ing = parseIngredient(v, warn); if (ing) r.ingredients.push(ing); } continue;
          case 'steps': mode = 'steps'; if (v) r.steps.push(Object.assign(parseStepMeta(v), { tip: '' })); continue;
        }
      }
      if (mode === 'ing') {
        if (/^-/.test(t) || t.includes('|')) { const ing = parseIngredient(t, warn); if (ing) r.ingredients.push(ing); }
        continue; // Zwischenüberschriften wie „Für die Soße“ ignorieren
      }
      if (mode === 'steps') {
        const sm = /^(?:\d+\s*[.)]|-)\s*(.*)$/.exec(t);
        if (sm) r.steps.push(Object.assign(parseStepMeta(sm[1]), { tip: '' }));
        else if (r.steps.length) {
          const s = r.steps[r.steps.length - 1], more = parseStepMeta(t);
          s.text = (s.text + ' ' + more.text).trim();
          if (s.min == null && more.min != null) { s.min = more.min; s.passive = more.passive; }
        } else r.steps.push(Object.assign(parseStepMeta(t), { tip: '' }));
        continue;
      }
      if (!key) warn('Zeile nicht verstanden: „' + t.slice(0, 60) + '“');
    }
    finish();
    return out;
  }

  function finalize(res) {
    const r = res.recipe, err = e => res.errors.push(e), warn = w => res.warnings.push(w);
    if (!r.name) err('Name fehlt');
    if (!r.cat) { if (r.cat === null && !res.warnings.some(w => /Kategorie/.test(w))) warn('Kategorie fehlt, als Hauptmahlzeit eingetragen'); r.cat = 'main'; }
    if (!r.portions) { warn('Portionen fehlen, mit 1 gerechnet'); r.portions = 1; }
    if (r.keepDays == null) { warn('Haltbarkeit fehlt, mit 3 Tagen gerechnet'); r.keepDays = 3; }
    if (r.freeze == null) { warn('Einfrierbar fehlt, als „nein“ eingetragen'); r.freeze = false; }
    if (r.box == null) { warn('Boxtauglich fehlt, als „ja“ eingetragen'); r.box = true; }
    if (!r.ingredients.length) err('Keine Zutaten gefunden');
    if (!r.steps.length) warn('Keine Schritte gefunden');
    return res;
  }

  // ---------- Nährwerte ----------
  function ingGrams(i) {
    if (i.unit === 'g' || i.unit === 'ml') return +i.qty || 0;
    return (+i.qty || 0) * (+i.pieceG || 0);
  }
  function recipeTotals(r) {
    const tot = { kcal: 0, p: 0, c: 0, f: 0, g: 0 };
    let missing = 0;
    for (const i of r.ingredients || []) {
      const g = ingGrams(i);
      tot.g += g;
      for (const k of ['kcal', 'p', 'c', 'f']) {
        const v = i.per100 && i.per100[k];
        if (v == null || !isFinite(v)) { if (k === 'kcal' || k === 'p') missing++; continue; }
        tot[k] += g * v / 100;
      }
    }
    const n = r.portions > 0 ? r.portions : 1;
    const per = {};
    for (const k in tot) per[k] = tot[k] / n;
    return { total: tot, portion: per, missing };
  }

  // ---------- Kalorienziel ----------
  // Grundumsatz nach Mifflin-St Jeor, mal Aktivität = Verbrauch. Defizit aus dem Abnehmtempo
  // (Anteil des Körpergewichts pro Woche, 1 kg Fett ≈ 7700 kcal), gedeckelt bei 25 % und nie unter dem Grundumsatz.
  function calcTargets(p) {
    const w = +p.weight, h = +p.height, a = +p.age;
    if (!(w > 0 && h > 0 && a > 0)) return null;
    const bmr = 10 * w + 6.25 * h - 5 * a + (p.sex === 'w' ? -161 : 5);
    const tdee = bmr * (+p.activity || 1.55);
    const tempo = TEMPO.find(t => t.id === p.tempo) || TEMPO[1];
    const wanted = w * tempo.pct * 7700 / 7;
    let deficit = Math.min(wanted, tdee * 0.25);
    let target = tdee - deficit;
    let floored = false, capped = deficit < wanted;
    if (target < bmr) { target = bmr; deficit = tdee - bmr; floored = true; }
    target = Math.round(target / 10) * 10;
    return {
      bmr: Math.round(bmr), tdee: Math.round(tdee), deficit: Math.round(deficit), target,
      kgWeek: round(deficit * 7 / 7700, 2), capped, floored, protein: +p.protein || 180
    };
  }

  // ---------- Text-Ausgabe eines Rezepts (zum Teilen und „Als Text bearbeiten“) ----------
  function fmtNum(n) {
    if (n == null || !isFinite(n)) return '';
    return String(round(n, 2)).replace('.', ',');
  }
  function amountText(i) {
    if (i.unit === 'g') return i.qty >= 1000 && i.qty % 100 === 0 ? fmtNum(i.qty / 1000) + ' kg' : fmtNum(i.qty) + ' g';
    if (i.unit === 'ml') return i.qty >= 1000 && i.qty % 100 === 0 ? fmtNum(i.qty / 1000) + ' l' : fmtNum(i.qty) + ' ml';
    return fmtNum(i.qty) + ' ' + i.unit + (i.pieceG ? ' à ' + fmtNum(i.pieceG) + ' g' : '');
  }
  function nutrText(p) {
    const v = k => p && p[k] != null ? fmtNum(p[k]) : '?';
    return v('kcal') + ' kcal, ' + v('p') + ' P, ' + v('c') + ' K, ' + v('f') + ' F';
  }
  function recipeToText(r) {
    const L = ['=== KOCHWERK REZEPT ===', 'Name: ' + r.name, 'Kategorie: ' + ({ main: 'Hauptmahlzeit', snack: 'Snack', hunger: 'Hungersnack', emergency: 'Notfall' })[r.cat],
      'Portionen: ' + fmtNum(r.portions), 'Haltbar: ' + fmtNum(r.keepDays) + (r.keepDays === 1 ? ' Tag' : ' Tage'), 'Einfrierbar: ' + (r.freeze ? 'ja' : 'nein'), 'Boxtauglich: ' + (r.box ? 'ja' : 'nein')];
    if (r.time) L.push('Zeit: ' + r.time + ' min');
    if (r.note) L.push('Notiz: ' + r.note.replace(/\n/g, ' '));
    for (const t of r.tips || []) L.push('Tipp: ' + t);
    L.push('Zutaten:');
    for (const i of r.ingredients) {
      L.push('- ' + [i.name, amountText(i), i.pantry ? (i.pack ? 'Vorrat, ' + packText(i.pack) : 'Vorrat') : (i.pack ? packText(i.pack) : '-'), areaById(i.area).label, nutrText(i.per100)].join(' | '));
    }
    L.push('Schritte:');
    r.steps.forEach((s, k) => {
      const meta = s.min ? ' [' + fmtNum(s.min) + ' min' + (s.passive ? ' nebenbei' : '') + ']' : '';
      L.push((k + 1) + '. ' + s.text + meta);
      if (s.tip) L.push('   Tipp: ' + s.tip);
    });
    L.push('=== ENDE ===');
    return L.join('\n');
  }

  // ---------- Datenbestand ----------
  // Jede Sammlung ist ein Objekt id → Eintrag. Jeder Eintrag hat t (letzte Änderung, ms).
  // Gelöschte Einträge bleiben als { id, del: true, t } stehen, damit der Abgleich das Löschen kennt.
  const COLLECTIONS = ['recipes', 'ratings', 'weights', 'settings', 'plan', 'favweeks', 'packs', 'checks', 'later', 'pantry', 'restfix', 'extra', 'cooked', 'thaw', 'log', 'foods'];
  function emptyDb() {
    const db = { app: 'kochwerk', v: 1 };
    for (const c of COLLECTIONS) db[c] = {};
    return db;
  }
  function upgrade(db) {
    if (!db || typeof db !== 'object' || db.app !== 'kochwerk') db = emptyDb();
    for (const c of COLLECTIONS) if (!db[c] || typeof db[c] !== 'object') db[c] = {};
    return db;
  }
  const live = (db, col) => Object.values(db[col] || {}).filter(x => x && !x.del);
  function put(db, col, rec) {
    if (!rec.id) rec.id = uid();
    rec.t = Math.max(now(), ((db[col][rec.id] || {}).t || 0) + 1);
    db[col][rec.id] = rec;
    return rec;
  }
  function remove(db, col, id) {
    const old = db[col][id];
    db[col][id] = { id, del: true, t: Math.max(now(), ((old || {}).t || 0) + 1) };
  }
  function getSetting(db, k) {
    const s = db.settings[k];
    return s && !s.del && s.v !== undefined ? s.v : DEFAULTS[k];
  }
  function setSetting(db, k, v) { put(db, 'settings', { id: k, v }); }
  function profile(db) {
    const p = {};
    for (const k in DEFAULTS) p[k] = getSetting(db, k);
    const w = latestWeight(db);
    p.weight = w ? w.kg : null;
    return p;
  }
  function latestWeight(db) {
    return live(db, 'weights').sort((a, b) => a.date < b.date ? 1 : -1)[0] || null;
  }
  function setWeight(db, kg, date = isoDate()) { put(db, 'weights', { id: 'w' + date, date, kg: round(+kg, 1) }); }

  // Bewertungen: satt / lecker je −1 (nein), 0 (geht so), 1 (ja)
  function ratingSummary(db, recipeId) {
    const rs = live(db, 'ratings').filter(r => r.recipeId === recipeId && !r.skip);
    if (!rs.length) return { n: 0, satt: null, lecker: null, score: 0, bad: false, good: false };
    const avg = k => rs.reduce((s, r) => s + (+r[k] || 0), 0) / rs.length;
    const satt = avg('satt'), lecker = avg('lecker');
    const score = satt + lecker;
    return { n: rs.length, satt, lecker, score, bad: satt <= -0.5 || lecker <= -0.5, good: score >= 1 && satt >= 0 && lecker >= 0 };
  }

  // Zwei Stände zusammenführen: pro Eintrag gewinnt die neuere Änderung.
  function merge(local, remote) {
    const a = upgrade(local), b = upgrade(remote);
    const out = emptyDb();
    let fromRemote = false, fromLocal = false;
    for (const c of COLLECTIONS) {
      const ids = new Set([...Object.keys(a[c]), ...Object.keys(b[c])]);
      for (const id of ids) {
        const x = a[c][id], y = b[c][id];
        if (x && (!y || x.t >= y.t)) { out[c][id] = x; if (!y || x.t > y.t) fromLocal = true; }
        else { out[c][id] = y; fromRemote = true; }
      }
    }
    return { data: out, fromRemote, fromLocal };
  }

  // Rezepte aus dem Import übernehmen. mode pro Ergebnis: 'new' | 'replace' | 'skip'
  function findByName(db, name) {
    const n = norm(name);
    return live(db, 'recipes').find(r => norm(r.name) === n) || null;
  }
  function importRecipe(db, parsed, mode) {
    if (mode === 'skip') return null;
    const r = JSON.parse(JSON.stringify(parsed));
    if (mode === 'replace') {
      const old = findByName(db, r.name);
      if (old) { r.id = old.id; r.created = old.created; }
    } else r.id = null;
    if (!r.created) r.created = isoDate();
    return put(db, 'recipes', r);
  }

  const KW = {
    uid, num, round, norm, isoDate, fmtNum, CATS, catById, AREAS, areaById, ACTIVITY, TEMPO, WEEKDAYS, DEFAULTS, COUNT_UNITS,
    parseAmount, parsePack, packText, parseNutr, parseCat, parseArea, parseBool, parseStepMeta, parseRecipes,
    ingGrams, recipeTotals, calcTargets, amountText, nutrText, recipeToText,
    COLLECTIONS, emptyDb, upgrade, live, put, remove, getSetting, setSetting, profile, latestWeight, setWeight,
    ratingSummary, merge, findByName, importRecipe
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = KW; else root.KW = KW;
})(typeof self !== 'undefined' ? self : this);
