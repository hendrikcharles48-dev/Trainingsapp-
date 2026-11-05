// Kochwerk – Einkauf: Wochenliste in ganzen Packungen, Nachkauf, Grundvorrat, Packungsgrößen, Restekarte.
// Hängt an KW (core.js, plan.js) als KW.S. Läuft im Browser und in Node (Tests).
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) { const KW = require('./core.js'); KW.P = KW.P || require('./plan.js'); module.exports = factory(KW); }
  else root.KW.S = factory(root.KW);
})(typeof self !== 'undefined' ? self : this, function (KW) {
  'use strict';
  const P = KW.P;

  // ---------- Packungsgrößen ----------
  // Gängige Standardgrößen aus deutschen Supermärkten und Discountern, an keinen Laden gebunden.
  // [Namen (erster = Anzeige), Art, Größe, Einheit, Bereich]
  const D = [
    [['Hähnchenbrustfilet', 'Hähnchenbrust', 'Hähnchenfilet'], 'Packung', 400, 'g', 'fleisch'],
    [['Hähnchen-Innenfilet', 'Hähnchen Innenfilet'], 'Packung', 400, 'g', 'fleisch'],
    [['Putenbrust', 'Putenschnitzel', 'Putenbrustfilet'], 'Packung', 400, 'g', 'fleisch'],
    [['Putenhack', 'Hähnchenhack'], 'Packung', 400, 'g', 'fleisch'],
    [['Rinderhack', 'Rinderhackfleisch'], 'Packung', 500, 'g', 'fleisch'],
    [['Hackfleisch gemischt', 'Hackfleisch', 'Gemischtes Hack'], 'Packung', 500, 'g', 'fleisch'],
    [['Schweinefilet'], 'Packung', 500, 'g', 'fleisch'],
    [['Rindersteak', 'Rumpsteak'], 'Packung', 400, 'g', 'fleisch'],
    [['Lachsfilet', 'Lachs'], 'Packung', 250, 'g', 'fleisch'],
    [['Kochschinken'], 'Packung', 200, 'g', 'fleisch'],
    [['Hähnchenbrust-Aufschnitt', 'Geflügelaufschnitt', 'Putenaufschnitt'], 'Packung', 100, 'g', 'fleisch'],
    [['Magerquark', 'Quark'], 'Becher', 500, 'g', 'kuehl'],
    [['Skyr'], 'Becher', 500, 'g', 'kuehl'],
    [['Körniger Frischkäse', 'Hüttenkäse'], 'Becher', 200, 'g', 'kuehl'],
    [['Frischkäse'], 'Packung', 200, 'g', 'kuehl'],
    [['Griechischer Joghurt'], 'Becher', 500, 'g', 'kuehl'],
    [['Joghurt', 'Naturjoghurt'], 'Becher', 500, 'g', 'kuehl'],
    [['Milch', 'Fettarme Milch'], 'Packung', 1000, 'ml', 'kuehl'],
    [['Kochsahne', 'Kochsahne light'], 'Packung', 200, 'ml', 'kuehl'],
    [['Schmand', 'Saure Sahne'], 'Becher', 200, 'g', 'kuehl'],
    [['Mozzarella', 'Mozzarella light'], 'Packung', 125, 'g', 'kuehl'],
    [['Reibekäse', 'Geriebener Käse', 'Pizzakäse'], 'Packung', 200, 'g', 'kuehl'],
    [['Feta', 'Hirtenkäse'], 'Packung', 200, 'g', 'kuehl'],
    [['Gouda', 'Käse in Scheiben'], 'Packung', 150, 'g', 'kuehl'],
    [['Eier', 'Ei'], 'Packung', 10, 'Stück', 'kuehl'],
    [['Butter'], 'Packung', 250, 'g', 'kuehl'],
    [['Tofu'], 'Packung', 400, 'g', 'kuehl'],
    [['Proteinpudding', 'High Protein Pudding'], 'Becher', 200, 'g', 'kuehl'],
    [['Paprika'], 'Beutel', 3, 'Stück', 'obst'],
    [['Zwiebeln', 'Zwiebel'], 'Netz', 1000, 'g', 'obst'],
    [['Rote Zwiebeln'], 'Netz', 500, 'g', 'obst'],
    [['Knoblauch'], 'Netz', 3, 'Stück', 'obst'],
    [['Kartoffeln'], 'Beutel', 2000, 'g', 'obst'],
    [['Süßkartoffeln', 'Süßkartoffel'], 'Beutel', 1000, 'g', 'obst'],
    [['Tomaten'], 'Packung', 500, 'g', 'obst'],
    [['Cherrytomaten', 'Kirschtomaten'], 'Schale', 250, 'g', 'obst'],
    [['Gurke', 'Salatgurke'], 'Stück', 1, 'Stück', 'obst'],
    [['Zucchini'], 'Stück', 1, 'Stück', 'obst'],
    [['Brokkoli'], 'Stück', 1, 'Stück', 'obst'],
    [['Blumenkohl'], 'Stück', 1, 'Stück', 'obst'],
    [['Karotten', 'Möhren'], 'Beutel', 1000, 'g', 'obst'],
    [['Babyspinat', 'Spinat'], 'Beutel', 250, 'g', 'obst'],
    [['Eisbergsalat', 'Salat'], 'Stück', 1, 'Stück', 'obst'],
    [['Lauchzwiebeln', 'Frühlingszwiebeln'], 'Bund', 1, 'Stück', 'obst'],
    [['Bananen', 'Banane'], 'Bund', 1000, 'g', 'obst'],
    [['Äpfel', 'Apfel'], 'Beutel', 6, 'Stück', 'obst'],
    [['Zitronen', 'Zitrone'], 'Netz', 4, 'Stück', 'obst'],
    [['Avocado'], 'Stück', 1, 'Stück', 'obst'],
    [['Petersilie'], 'Bund', 1, 'Stück', 'obst'],
    [['Basmatireis', 'Basmati'], 'Packung', 500, 'g', 'trocken'],
    [['Reis', 'Langkornreis', 'Parboiled Reis'], 'Packung', 1000, 'g', 'trocken'],
    [['Vollkornnudeln'], 'Packung', 500, 'g', 'trocken'],
    [['Nudeln', 'Spaghetti', 'Penne', 'Fusilli'], 'Packung', 500, 'g', 'trocken'],
    [['Proteinnudeln', 'Linsennudeln'], 'Packung', 250, 'g', 'trocken'],
    [['Haferflocken'], 'Packung', 500, 'g', 'trocken'],
    [['Couscous'], 'Packung', 500, 'g', 'trocken'],
    [['Bulgur'], 'Packung', 500, 'g', 'trocken'],
    [['Rote Linsen', 'Linsen'], 'Packung', 500, 'g', 'trocken'],
    [['Mehl', 'Weizenmehl'], 'Packung', 1000, 'g', 'trocken'],
    [['Proteinpulver', 'Whey'], 'Beutel', 1000, 'g', 'trocken'],
    [['Reiswaffeln'], 'Packung', 100, 'g', 'trocken'],
    [['Nüsse', 'Mandeln', 'Walnüsse'], 'Beutel', 200, 'g', 'trocken'],
    [['Wraps', 'Tortilla', 'Tortillas'], 'Packung', 6, 'Stück', 'brot'],
    [['Vollkorntoast', 'Toast', 'Toastbrot'], 'Packung', 500, 'g', 'brot'],
    [['Vollkornbrot', 'Brot'], 'Packung', 500, 'g', 'brot'],
    [['Knäckebrot'], 'Packung', 250, 'g', 'brot'],
    [['Passierte Tomaten', 'Passata'], 'Packung', 500, 'g', 'konserve'],
    [['Gehackte Tomaten', 'Stückige Tomaten', 'Tomaten Dose'], 'Dose', 400, 'g', 'konserve'],
    [['Kidneybohnen'], 'Dose', 400, 'g', 'konserve'],
    [['Kichererbsen'], 'Dose', 400, 'g', 'konserve'],
    [['Weiße Bohnen'], 'Dose', 400, 'g', 'konserve'],
    [['Mais'], 'Dose', 340, 'g', 'konserve'],
    [['Kokosmilch'], 'Dose', 400, 'ml', 'konserve'],
    [['Thunfisch'], 'Dose', 150, 'g', 'konserve'],
    [['Tomatenmark'], 'Tube', 200, 'g', 'konserve'],
    [['Olivenöl'], 'Flasche', 500, 'ml', 'gewuerz'],
    [['Rapsöl', 'Öl'], 'Flasche', 1000, 'ml', 'gewuerz'],
    [['Sojasauce', 'Sojasoße'], 'Flasche', 250, 'ml', 'gewuerz'],
    [['Gemüsebrühe', 'Brühe'], 'Glas', 250, 'g', 'gewuerz'],
    [['Honig'], 'Glas', 500, 'g', 'gewuerz'],
    [['Senf'], 'Tube', 200, 'ml', 'gewuerz'],
    [['Pesto'], 'Glas', 190, 'g', 'gewuerz'],
    [['Brokkoli TK', 'TK Brokkoli', 'Brokkoli (TK)'], 'Beutel', 750, 'g', 'tk'],
    [['Erbsen TK', 'TK Erbsen', 'Erbsen'], 'Beutel', 750, 'g', 'tk'],
    [['Spinat TK', 'TK Spinat', 'Blattspinat'], 'Packung', 750, 'g', 'tk'],
    [['Gemüsemischung TK', 'TK Gemüse', 'Pfannengemüse'], 'Beutel', 750, 'g', 'tk'],
    [['Beerenmischung TK', 'TK Beeren', 'Beerenmischung'], 'Beutel', 750, 'g', 'tk'],
    [['Garnelen'], 'Packung', 250, 'g', 'tk'],
    [['Seelachs', 'Seelachsfilet'], 'Packung', 400, 'g', 'tk']
  ];
  const packKey = name => 'k' + KW.norm(name).replace(/\s+/g, '-');
  const DEFAULT_PACKS = D.map(([names, kind, size, unit, area]) => ({ id: packKey(names[0]), names, name: names[0], kind, size, unit, area, def: true }));

  // Liste = Standard + eigene Änderungen (gleiche id überschreibt, off = ausgeblendet)
  function packList(db) {
    const own = db.packs || {};
    const out = DEFAULT_PACKS.map(d => { const o = own[d.id]; return o && !o.del ? Object.assign({}, d, o, { def: true, changed: true }) : d; });
    for (const o of Object.values(own)) if (!o.del && !DEFAULT_PACKS.some(d => d.id === o.id)) out.push(Object.assign({ names: [o.name] }, o));
    return out.filter(p => !p.off);
  }
  // Wörter des Packungsnamens müssen am Anfang von Wörtern der Zutat stehen („Hähnchenbrust“ passt zu „Hähnchenbrustfilet“).
  // Die Packung mit den meisten passenden Wörtern gewinnt.
  function matchScore(ingName, packName) {
    const iw = KW.norm(ingName).split(' ').filter(Boolean), pw = KW.norm(packName).split(' ').filter(Boolean);
    if (!pw.length) return 0;
    // Kurze Wörter (z. B. „Ei“) nur als ganzes Wort, sonst passt „Ei“ zu „Eiweißpulver“
    if (!pw.every(w => iw.some(x => w.length <= 3 ? x === w : x.startsWith(w)))) return 0;
    return pw.length * 10 + (KW.norm(ingName) === KW.norm(packName) ? 5 : 0) + pw.join('').length / 100;
  }
  function findPack(db, name) {
    let best = null, bs = 0;
    for (const p of packList(db)) for (const n of p.names || [p.name]) {
      const s = matchScore(name, n);
      if (s > bs) { bs = s; best = p; }
    }
    return best;
  }
  // Eigene (geänderte oder neue) Packung > Packung aus dem Rezept > Standardliste
  function packFor(db, ing) {
    const m = findPack(db, ing.name);
    if (m && (m.changed || !m.def)) return { kind: m.kind, size: m.size, unit: m.unit === 'ml' ? 'g' : m.unit, label: KW.packText(m), src: 'own' };
    if (ing.pack) return { kind: ing.pack.kind, size: ing.pack.size, unit: ing.pack.unit === 'ml' ? 'g' : ing.pack.unit, label: KW.packText(ing.pack), src: 'recipe' };
    if (m) return { kind: m.kind, size: m.size, unit: m.unit === 'ml' ? 'g' : m.unit, label: KW.packText(m), src: 'list' };
    return null;
  }

  // ---------- Bedarf einer Woche ----------
  const ingKey = name => KW.norm(name);
  const isCount = i => !(i.unit === 'g' || i.unit === 'ml');
  // Gekocht wird immer das ganze Rezept: Töpfe = aufgerundete Summe der Portionen (mit Freundin zusätzlich ihr Anteil).
  function weekPots(db, start) {
    const factor = KW.getSetting(db, 'partnerFactor');
    const by = {};
    for (const e of P.weekEntries(db, start)) {
      const r = P.recipeOf(db, e); if (!r) continue;
      const x = by[r.id] = by[r.id] || { r, portions: 0, first: e.date };
      x.portions += 1 + (e.partner ? factor : 0);
      if (e.date < x.first) x.first = e.date;
    }
    return Object.values(by).map(x => Object.assign(x, { pots: Math.max(1, Math.ceil(x.portions / x.r.portions - 0.02)) }));
  }
  function weekNeeds(db, start) {
    const need = {};
    for (const pot of weekPots(db, start)) {
      for (const i of pot.r.ingredients) {
        const k = ingKey(i.name);
        const n = need[k] = need[k] || { key: k, name: i.name, area: i.area, g: 0, cnt: 0, cntUnit: null, pieceG: null, pantry: true, first: pot.first, recipes: [], ing: i };
        if (isCount(i)) { n.cnt += i.qty * pot.pots; n.cntUnit = n.cntUnit || i.unit; if (i.pieceG && !n.pieceG) n.pieceG = i.pieceG; }
        else n.g += i.qty * pot.pots;
        if (!i.pantry) { n.pantry = false; if (n.ing.pantry) n.ing = i; }
        if (pot.first < n.first) n.first = pot.first;
        if (!n.recipes.includes(pot.r.name)) n.recipes.push(pot.r.name);
      }
    }
    return need;
  }
  // Menge in der Einheit der Packung (g oder Stück). null = nicht umrechenbar.
  function amountIn(n, unit) {
    if (unit === 'Stück') {
      if (!n.g) return n.cnt;
      return n.pieceG ? n.cnt + n.g / n.pieceG : null;
    }
    if (!n.cnt) return n.g;
    return n.pieceG ? n.g + n.cnt * n.pieceG : (n.g || null);
  }

  // ---------- Reste ----------
  // Reste = gekauft (abgehakt) − verbraucht (Bedarf der Wochen mit Einkauf), pro Zutat, plus Korrekturen von Hand.
  // before: nur Wochen vor dieser Woche (für die Einkaufsliste dieser Woche).
  function restsRaw(db, before) {
    const done = KW.live(db, 'checks').filter(c => c.done && c.packs > 0 && c.size && (!before || c.week < before));
    const weeks = [...new Set(done.map(c => c.week))].sort();
    const r = {};
    for (const c of done) {
      const x = r[c.key] = r[c.key] || { key: c.key, name: c.name, area: c.area, unit: c.unit, bought: 0, used: 0 };
      if (x.unit === c.unit) x.bought += c.packs * c.size;
    }
    for (const w of weeks) {
      const need = weekNeeds(db, w);
      for (const k in r) if (need[k]) { const a = amountIn(need[k], r[k].unit); if (a != null) r[k].used += a; }
    }
    for (const x of Object.values(r)) x.amount = Math.max(0, x.bought - x.used);
    return r;
  }
  // Korrektur von Hand: { amount, asOf } – asOf ist der gerechnete Rest beim Korrigieren. Später gekaufte oder
  // verplante Mengen laufen weiter: Rest = amount + (jetzt gerechnet − asOf).
  function rests(db, before) {
    const r = restsRaw(db, before);
    for (const o of KW.live(db, 'restfix')) {
      if (before && o.week >= before) continue;
      const x = r[o.key] = r[o.key] || { key: o.key, name: o.name, area: o.area, unit: o.unit, amount: 0, bought: 0, used: 0 };
      x.amount = Math.max(0, o.amount + (x.amount - (o.asOf || 0)));
      x.fixed = true;
    }
    for (const k in r) {
      const x = r[k];
      x.amount = Math.round(x.amount * 10) / 10;
      if (x.amount < (x.unit === 'Stück' ? 0.5 : 10)) delete r[k];
    }
    return r;
  }
  function setRest(db, key, name, area, unit, amount) {
    const raw = restsRaw(db)[key];
    KW.put(db, 'restfix', { id: 'x' + key, key, name, area, unit, amount: Math.max(0, amount), asOf: raw ? raw.amount : 0, week: P.weekStart(KW.isoDate()) });
  }

  // ---------- Wochenliste ----------
  const FRESH = ['obst', 'kuehl', 'brot', 'fleisch'];
  function weekList(db, start) {
    const need = weekNeeds(db, start), rest = rests(db, start);
    const items = [], fromRest = [];
    const later = id => { const l = db.later && db.later['l' + start + '|' + id]; return !!(l && !l.del && l.on); };
    for (const n of Object.values(need)) {
      if (n.pantry) continue;
      const pk = packFor(db, n.ing);
      const unit = pk ? pk.unit : (n.cnt && !n.g ? 'Stück' : 'g');
      let amt = amountIn(n, unit);
      // Zähleinheit passt nicht zur Packung (z. B. 2 Zehen, Packung Knolle): eine Knolle hat etwa 10 Zehen,
      // Löffel und Prisen aus einer Stück-Packung brauchen höchstens eine Packung
      if (pk && unit === 'Stück' && n.cntUnit && n.cntUnit !== 'Stück' && KW.norm(n.cntUnit) !== KW.norm(pk.kind) && !n.g) {
        amt = n.cntUnit === 'Zehe' ? n.cnt / 10 : Math.min(n.cnt, pk.size);
      }
      const rs = rest[n.key] && rest[n.key].unit === unit ? rest[n.key].amount : 0;
      const buy = amt == null ? null : Math.max(0, amt - rs);
      const packs = pk && buy != null ? Math.ceil(buy / pk.size - 0.02) : null;
      const chk = db.checks && db.checks['c' + start + '|' + n.key];
      const it = { key: n.key, name: n.name, area: n.area, pack: pk, unit, need: amt, cntUnit: n.cntUnit, rest: rs, buy, packs, done: !!(chk && !chk.del && chk.done), first: n.first, recipes: n.recipes,
        lateHint: FRESH.includes(n.area) && P.wd(n.first) >= 3 && P.diffDays(start, n.first) >= 3, later: later(n.key) };
      if (it.done && chk.packs != null) it.packs = chk.packs; // abgehakt: gekaufte Menge bleibt, auch wenn sich Packungen ändern
      if (buy === 0 && !it.done) fromRest.push(it); else items.push(it);
    }
    // Grundvorrat: Zutaten der Hungerknopf-Snacks und Notfallgerichte, dazu Vorrat-Zutaten der geplanten Rezepte
    const pantry = {};
    for (const r of KW.live(db, 'recipes').filter(r => r.cat === 'hunger' || r.cat === 'emergency')) for (const i of r.ingredients) pantry[ingKey(i.name)] = pantry[ingKey(i.name)] || { key: ingKey(i.name), name: i.name, area: i.area, ing: i, why: r.cat };
    for (const n of Object.values(need)) if (n.pantry) pantry[n.key] = pantry[n.key] || { key: n.key, name: n.name, area: n.area, ing: n.ing, why: 'vorrat' };
    const stock = [];
    for (const v of Object.values(pantry)) {
      if (items.some(i => i.key === v.key) || fromRest.some(i => i.key === v.key)) continue;
      const st = db.pantry && db.pantry['v' + start + '|' + v.key];
      v.state = st && !st.del ? st.state : null;
      v.pack = packFor(db, v.ing);
      if (v.state === 'buy') {
        const chk = db.checks && db.checks['c' + start + '|' + v.key];
        items.push({ key: v.key, name: v.name, area: v.area, pack: v.pack, unit: v.pack ? v.pack.unit : 'Stück', need: null, rest: 0, buy: null, packs: v.pack ? 1 : null, done: !!(chk && !chk.del && chk.done), recipes: [], fromPantry: true, later: later(v.key) });
      }
      stock.push(v);
    }
    const order = id => KW.AREAS.findIndex(a => a.id === id);
    const sort = (a, b) => (order(a.area) - order(b.area)) || a.name.localeCompare(b.name, 'de');
    items.sort(sort); fromRest.sort(sort); stock.sort(sort);
    return { week: start, items: items.filter(i => !i.later), later: items.filter(i => i.later), fromRest, stock };
  }
  function check(db, week, it, done) {
    KW.put(db, 'checks', { id: 'c' + week + '|' + it.key, week, key: it.key, name: it.name, area: it.area, done, packs: it.packs, size: it.pack ? it.pack.size : null, unit: it.unit });
  }
  function setLater(db, week, key, on) { KW.put(db, 'later', { id: 'l' + week + '|' + key, week, key, on }); }
  function setPantry(db, week, key, state) { KW.put(db, 'pantry', { id: 'v' + week + '|' + key, week, key, state }); }

  // ---------- Texte ----------
  const fmt = n => String(Math.round(n * 10) / 10).replace('.', ',');
  function amountText(amt, unit, cntUnit) {
    if (amt == null) return '';
    if (unit === 'Stück') return fmt(amt) + ' ' + (cntUnit && cntUnit !== 'Stück' ? cntUnit : 'Stück');
    return amt >= 1000 ? fmt(amt / 1000) + ' kg' : Math.round(amt) + ' g';
  }
  function itemText(it) {
    if (it.pack && it.packs != null) return (it.packs > 1 ? it.packs + ' × ' : '') + it.name + ' (' + it.pack.label + ')';
    return it.name + (it.need ? ' – ' + amountText(it.need, it.unit, it.cntUnit) : '');
  }
  function shareText(title, items) {
    const L = [title];
    for (const a of KW.AREAS) {
      const its = items.filter(i => i.area === a.id && !i.done);
      if (!its.length) continue;
      L.push('', a.label);
      for (const i of its) L.push('☐ ' + itemText(i));
    }
    return L.join('\n');
  }

  // ---------- Rezepte, die Reste aufbrauchen ----------
  function restRecipes(db, n = 5) {
    const rs = rests(db);
    const keys = Object.keys(rs);
    if (!keys.length) return [];
    return KW.live(db, 'recipes').map(r => {
      const hits = [];
      for (const i of r.ingredients) {
        const x = rs[ingKey(i.name)];
        if (!x || i.pantry) continue;
        const nd = amountIn({ g: isCount(i) ? 0 : i.qty, cnt: isCount(i) ? i.qty : 0, pieceG: i.pieceG }, x.unit);
        if (!nd) continue;
        hits.push({ name: x.name, use: Math.min(nd, x.amount), unit: x.unit, share: Math.min(1, nd / x.amount) });
      }
      return { r, hits, score: hits.reduce((s, h) => s + h.share, 0) + hits.length * 0.1 };
    }).filter(x => x.hits.length && KW.ratingSummary(db, x.r.id).bad !== true).sort((a, b) => b.score - a.score).slice(0, n);
  }

  // ---------- Nachkauf (eigene Einträge) ----------
  function addExtra(db, name, area) { return KW.put(db, 'extra', { name: name.trim(), area: area || 'sonst', done: false, created: KW.isoDate() }); }

  return {
    DEFAULT_PACKS, packKey, packList, findPack, packFor, matchScore, weekPots, weekNeeds, amountIn, rests, setRest,
    weekList, check, setLater, setPantry, amountText, itemText, shareText, restRecipes, addExtra
  };
});
