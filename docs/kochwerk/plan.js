// Kochwerk – Planung: Tagesplan, Spielraum, Wochenvorschlag, Tauschen, Lieblingswoche, Wochen-Check.
// Hängt an KW (core.js) als KW.P. Läuft im Browser und in Node (Tests).
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory(require('./core.js'));
  else root.KW.P = factory(root.KW);
})(typeof self !== 'undefined' ? self : this, function (KW) {
  'use strict';

  // ---------- Datum (immer als „YYYY-MM-DD“, gerechnet in UTC, damit Sommerzeit nichts verschiebt) ----------
  const toUTC = iso => { const [y, m, d] = iso.split('-').map(Number); return Date.UTC(y, m - 1, d); };
  const fromUTC = ms => new Date(ms).toISOString().slice(0, 10);
  const addDays = (iso, n) => fromUTC(toUTC(iso) + n * 86400000);
  const diffDays = (a, b) => Math.round((toUTC(b) - toUTC(a)) / 86400000); // b − a
  const wd = iso => (new Date(toUTC(iso)).getUTCDay() + 6) % 7; // 0 = Montag … 6 = Sonntag
  const weekStart = iso => addDays(iso, -wd(iso));
  const weekDays = start => Array.from({ length: 7 }, (_, k) => addDays(start, k));
  function isoWeek(iso) {
    const d = new Date(toUTC(iso));
    d.setUTCDate(d.getUTCDate() + 3 - (d.getUTCDay() + 6) % 7);
    const y = d.getUTCFullYear(), jan4 = new Date(Date.UTC(y, 0, 4));
    return 1 + Math.round(((d - jan4) / 86400000 - 3 + (jan4.getUTCDay() + 6) % 7) / 7);
  }
  const DAY_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  const DAY_LONG = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
  const dayLabel = iso => DAY_SHORT[wd(iso)] + ' ' + Number(iso.slice(8)) + '.' + Number(iso.slice(5, 7)) + '.';

  // ---------- Mahlzeiten ----------
  const MEALS = [
    { id: 'breakfast', label: 'Frühstück', short: 'Frühst.', pos: 10, icon: '🥣' },
    { id: 'box', label: 'Box in der Schule', short: 'Box', pos: 20, icon: '🥡' },
    { id: 'lunch', label: 'Mittag', short: 'Mittag', pos: 30, icon: '🍽️' },
    { id: 'dinner', label: 'Abendessen', short: 'Abend', pos: 40, icon: '🌙' }
  ];
  const mealById = id => MEALS.find(m => m.id === id) || { id: 'snack', label: 'Snack', short: 'Snack', pos: 0, icon: '🥪' };
  // Lücken für Snacks: vor dem Frühstück (5), danach (15) … nach dem Abendessen (45)
  const GAPS = [
    { pos: 5, label: 'Vor dem Frühstück' }, { pos: 15, label: 'Vormittags' }, { pos: 25, label: 'Nach der Box' },
    { pos: 35, label: 'Nachmittags' }, { pos: 45, label: 'Abends' }
  ];
  const mainId = (date, meal) => 'p' + date + '-' + meal;
  const isMain = e => e.meal !== 'snack';

  const entries = (db, date) => KW.live(db, 'plan').filter(e => e.date === date).sort((a, b) => a.pos - b.pos);
  const weekEntries = (db, start) => { const end = addDays(start, 6); return KW.live(db, 'plan').filter(e => e.date >= start && e.date <= end).sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : a.pos - b.pos); };
  const recipeOf = (db, e) => { const r = e && e.recipeId && db.recipes[e.recipeId]; return r && !r.del ? r : null; };
  const portionOf = r => r ? KW.recipeTotals(r).portion : null;

  function setMeal(db, date, meal, on) {
    const id = mainId(date, meal), cur = db.plan[id];
    if (on && (!cur || cur.del)) KW.put(db, 'plan', { id, date, meal, pos: mealById(meal).pos, recipeId: null, partner: false });
    if (!on && cur && !cur.del) KW.remove(db, 'plan', id);
  }
  function addSnack(db, date, gapPos, recipeId) {
    const inGap = entries(db, date).filter(e => e.meal === 'snack' && Math.floor(e.pos / 10) === Math.floor(gapPos / 10));
    const pos = gapPos + inGap.length * 0.1;
    return KW.put(db, 'plan', { id: 's' + KW.uid(), date, meal: 'snack', pos: Math.round(pos * 10) / 10, recipeId, partner: false });
  }
  function update(db, id, patch) {
    const e = db.plan[id]; if (!e || e.del) return null;
    return KW.put(db, 'plan', Object.assign({}, e, patch));
  }

  // ---------- Spielraum ----------
  // Alles Geplante gilt als gegessen (eine Portion für mich). Die Portion der Freundin zählt nicht.
  function dayTotals(db, date) {
    const t = { kcal: 0, p: 0, c: 0, f: 0, n: 0, empty: 0 };
    for (const e of entries(db, date)) {
      const pr = portionOf(recipeOf(db, e));
      if (!pr) { if (isMain(e)) t.empty++; continue; }
      t.kcal += pr.kcal; t.p += pr.p; t.c += pr.c; t.f += pr.f; t.n++;
    }
    return t;
  }
  function room(db, date) {
    const prof = KW.profile(db), tg = KW.calcTargets(prof);
    const t = dayTotals(db, date);
    const target = tg ? tg.target : 0, rest = target - t.kcal;
    const meals = Math.floor(Math.max(0, rest) / prof.mealKcal * 2) / 2;
    return { target, used: t.kcal, rest, meals, pOpen: Math.max(0, prof.protein - t.p), protein: prof.protein, pUsed: t.p, totals: t, mealKcal: prof.mealKcal, text: roomText(rest, meals) };
  }
  function half(n) {
    const w = Math.floor(n), h = n - w >= 0.5;
    return (w ? String(w) : '') + (h ? '½' : '');
  }
  function roomText(rest, meals) {
    if (rest < -50) return 'Heute schon etwa ' + Math.round(-rest / 10) * 10 + ' kcal über dem Ziel';
    if (rest < 100) return 'Tagesziel erreicht';
    if (meals < 0.5) return 'Noch Platz für einen kleinen Snack';
    if (meals === 0.5) return 'Noch Platz für eine halbe Mahlzeit';
    if (meals === 1) return 'Noch Platz für etwa eine normale Mahlzeit';
    return 'Noch Platz für etwa ' + half(meals) + ' normale Mahlzeiten';
  }

  // ---------- Rezepte bewerten für den Plan ----------
  // Punkte = Protein pro 100 kcal + Protein pro Portion / 10, gut bewertet +2, ungewertet 0. Schlecht bewertet: ausgeschlossen.
  function score(db, r) {
    const t = portionOf(r);
    if (!t || !(t.kcal > 0)) return -Infinity;
    const rs = KW.ratingSummary(db, r.id);
    if (rs.bad) return -Infinity;
    return t.p * 100 / t.kcal + t.p / 10 + (rs.good ? 2 : 0) + (rs.n ? rs.score / 2 : 0);
  }
  const SNACK_CATS = ['snack', 'hunger'];
  const catsFor = meal => meal === 'snack' ? SNACK_CATS : ['main'];

  // Kochtag vor oder in der Woche: Sa/So → vor dem Montag, Mo–Fr → in dieser Woche
  function cookDate(db, start) {
    const c = (KW.getSetting(db, 'cookDay') + 6) % 7;
    return addDays(start, c >= 5 ? c - 7 : c);
  }

  // Wochenvorschlag: füllt nur leere, angewählte Hauptmahlzeiten.
  // Gekocht wird einmal pro Woche: ein gewähltes Rezept füllt der Reihe nach so viele Mahlzeiten, wie es Portionen hat
  // (Freundin isst mit = zusätzlich ihr Anteil). Nicht einfrierbare Rezepte nur bis zur Haltbarkeit nach dem Kochtag.
  function suggestWeek(db, start) {
    const slots = weekEntries(db, start).filter(e => isMain(e) && !recipeOf(db, e));
    if (!slots.length) return { fill: [], open: [] };
    const factor = KW.getSetting(db, 'partnerFactor');
    const cook = cookDate(db, start);
    const pool = KW.live(db, 'recipes').filter(r => r.cat === 'main').map(r => ({ r, s: score(db, r) })).filter(x => x.s > -Infinity).sort((a, b) => b.s - a.s);
    if (!pool.length) return { fill: [], open: slots.map(e => ({ id: e.id, date: e.date, why: 'none' })) };
    // Rezepte, die in der Woche schon stehen, laufen als angebrochene Töpfe weiter
    const batches = [];
    const need = e => 1 + (e.partner ? factor : 0);
    for (const e of weekEntries(db, start)) {
      const r = recipeOf(db, e); if (!r || !isMain(e)) continue;
      let b = batches.find(x => x.r.id === r.id);
      if (!b) { b = { r, left: r.portions }; batches.push(b); }
      b.left -= need(e);
    }
    const used = new Set(batches.map(b => b.r.id));
    const fits = (r, e) => (e.meal !== 'box' || r.box) && (r.freeze || diffDays(cook, e.date) <= r.keepDays);
    const out = [], open = [];
    const dayHas = (date, rid) => out.some(o => o.date === date && o.recipeId === rid) || entries(db, date).some(x => x.recipeId === rid);
    for (const e of slots) {
      let b = batches.find(x => x.left >= need(e) - 0.01 && fits(x.r, e) && !dayHas(e.date, x.r.id));
      if (!b) {
        const pick = pool.find(x => !used.has(x.r.id) && fits(x.r, e)) || pool.find(x => fits(x.r, e) && !dayHas(e.date, x.r.id)) || pool.find(x => fits(x.r, e));
        if (!pick) { open.push({ id: e.id, date: e.date, why: pool.some(x => (e.meal !== 'box' || x.r.box)) ? 'keep' : 'box' }); continue; }
        b = { r: pick.r, left: pick.r.portions }; batches.push(b); used.add(pick.r.id);
      }
      b.left -= need(e);
      out.push({ id: e.id, date: e.date, recipeId: b.r.id });
    }
    return { fill: out, open };
  }
  function applySuggestions(db, list) { for (const s of list) update(db, s.id, { recipeId: s.recipeId }); }

  // ---------- Tauschen ----------
  // Ähnliche Werte (±20 % kcal, sonst ±35 %), bevorzugt mit Zutaten, die diese Woche schon gekauft werden.
  function swapOptions(db, entry, n = 5) {
    const cur = recipeOf(db, entry), cats = catsFor(entry.meal);
    const base = cur ? portionOf(cur) : null;
    const weekIngs = new Set();
    for (const e of weekEntries(db, weekStart(entry.date))) {
      const r = recipeOf(db, e); if (!r || (cur && r.id === cur.id && e.id === entry.id)) continue;
      for (const i of r.ingredients) if (!i.pantry) weekIngs.add(KW.norm(i.name));
    }
    const all = KW.live(db, 'recipes').filter(r => cats.includes(r.cat) && (!cur || r.id !== cur.id) && (entry.meal !== 'box' || r.box));
    const rate = (tol) => all.map(r => {
      const t = portionOf(r), s = score(db, r);
      if (s === -Infinity) return null;
      if (base && base.kcal > 0 && Math.abs(t.kcal - base.kcal) > base.kcal * tol) return null;
      const shared = r.ingredients.filter(i => !i.pantry && weekIngs.has(KW.norm(i.name))).length;
      return { r, t, shared, s, dk: base ? t.kcal - base.kcal : 0, dp: base ? t.p - base.p : 0 };
    }).filter(Boolean);
    let list = rate(0.2);
    if (list.length < 2) list = rate(0.35);
    if (!base) list = rate(Infinity);
    list.sort((a, b) => (b.shared - a.shared) || (b.s - a.s) || (Math.abs(a.dk) - Math.abs(b.dk)));
    return list.slice(0, n);
  }

  // ---------- Lieblingswoche ----------
  function saveFavWeek(db, start, name) {
    const days = {};
    for (const e of weekEntries(db, start)) {
      const k = wd(e.date);
      (days[k] = days[k] || []).push({ meal: e.meal, pos: e.pos, recipeId: e.recipeId || null, partner: !!e.partner });
    }
    return KW.put(db, 'favweeks', { name, days, created: KW.isoDate() });
  }
  function applyFavWeek(db, fav, start) {
    for (const e of weekEntries(db, start)) KW.remove(db, 'plan', e.id);
    let missing = 0;
    for (const k in fav.days) {
      const date = addDays(start, +k);
      for (const x of fav.days[k]) {
        let rid = x.recipeId;
        if (rid && !(db.recipes[rid] && !db.recipes[rid].del)) { rid = null; missing++; }
        const id = x.meal === 'snack' ? 's' + KW.uid() : mainId(date, x.meal);
        if (x.meal === 'snack' && !rid) continue;
        KW.put(db, 'plan', { id, date, meal: x.meal, pos: x.pos, recipeId: rid, partner: x.partner });
      }
    }
    return { missing };
  }

  // ---------- Bewertung nach dem Essen ----------
  // Letztes geplantes Gericht vor heute (höchstens 7 Tage zurück), noch nicht gefragt. Die Bewertung bekommt die id „r“ + Plan-id,
  // damit beide Geräte nicht doppelt fragen.
  function ratingCandidate(db, today) {
    const from = addDays(today, -7);
    const list = KW.live(db, 'plan').filter(e => e.date < today && e.date >= from && recipeOf(db, e))
      .sort((a, b) => a.date < b.date ? 1 : a.date > b.date ? -1 : b.pos - a.pos);
    const e = list[0];
    if (!e || db.ratings['r' + e.id]) return null;
    return e;
  }

  // ---------- Wochen-Check ----------
  // Pro Woche zählt das letzte eingetragene Gewicht.
  function weeklyWeights(db) {
    const by = {};
    for (const w of KW.live(db, 'weights')) {
      const k = weekStart(w.date);
      if (!by[k] || by[k].date < w.date) by[k] = w;
    }
    return Object.keys(by).sort().map(k => ({ week: k, date: by[k].date, kg: by[k].kg, id: by[k].id }));
  }
  // Sinkt das Gewicht seit 2 Wochen nicht (aktuelle Woche nicht unter der von vor 2 Wochen)?
  function stall(db, today) {
    const ws = weeklyWeights(db);
    if (ws.length < 3) return null;
    const last = ws[ws.length - 1];
    if (diffDays(last.week, weekStart(today)) > 7) return null;
    const ref = ws.find(w => w.week === addDays(last.week, -14)) || ws[ws.length - 3];
    if (diffDays(ref.week, last.week) < 14) return null;
    if (last.kg < ref.kg - 0.1) return null;
    if (KW.getSetting(db, 'stallAck') === last.id) return null;
    return { last, ref, diff: Math.round((last.kg - ref.kg) * 10) / 10 };
  }

  // Leichter machen: Zutaten mit vielen Kohlenhydraten (≥ 15 g/100 g und mehr als 2,5 × so viel wie Protein) um 25 % kürzen.
  const isCarb = i => i.per100 && i.per100.c != null && i.per100.c >= 15 && i.per100.c > 2.5 * (i.per100.p || 0) && !i.pantry;
  function lighten(r, factor = 0.75) {
    const n = JSON.parse(JSON.stringify(r));
    const changed = [];
    for (const i of n.ingredients) {
      if (!isCarb(i)) continue;
      if (i.unit === 'g' || i.unit === 'ml') i.qty = Math.max(5, Math.round(i.qty * factor / 5) * 5);
      else i.qty = Math.max(0.5, Math.round(i.qty * factor * 2) / 2);
      i.g = KW.ingGrams(i);
      changed.push(i.name);
    }
    return { recipe: n, changed };
  }
  function lightenPreview(db, start) {
    const ids = [...new Set(weekEntries(db, start).map(e => e.recipeId).filter(Boolean))];
    return ids.map(id => recipeOf(db, { recipeId: id })).filter(Boolean).map(r => {
      const l = lighten(r);
      return { r, next: l.recipe, changed: l.changed, before: portionOf(r), after: portionOf(l.recipe) };
    }).filter(x => x.changed.length);
  }

  return {
    addDays, diffDays, wd, weekStart, weekDays, isoWeek, DAY_SHORT, DAY_LONG, dayLabel,
    MEALS, mealById, GAPS, mainId, isMain, entries, weekEntries, recipeOf, portionOf,
    setMeal, addSnack, update, dayTotals, room, roomText, half, score, catsFor, cookDate,
    suggestWeek, applySuggestions, swapOptions, saveFavWeek, applyFavWeek, ratingCandidate,
    weeklyWeights, stall, isCarb, lighten, lightenPreview
  };
});
