// Kochwerk – Oberfläche. Daten liegen in localStorage unter „kochwerk_data“ (nur Präfix kochwerk_).
(function () {
  'use strict';
  const KW = window.KW;
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const KEY = 'kochwerk_data', KEY_UI = 'kochwerk_ui', KEY_DEV = 'kochwerk_device';
  const VERSION = '1.1 · Etappe 2';

  // ---------- Speicher ----------
  function load() {
    try { return KW.upgrade(JSON.parse(localStorage.getItem(KEY) || 'null')); } catch (e) { return KW.emptyDb(); }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { toast('Speichern nicht möglich'); }
  }
  function loadUi() { try { return Object.assign({ theme: 'auto' }, JSON.parse(localStorage.getItem(KEY_UI) || '{}')); } catch (e) { return { theme: 'auto' }; } }
  function saveUi() { try { localStorage.setItem(KEY_UI, JSON.stringify(ui)); } catch (e) { /* egal */ } }
  try { if (!localStorage.getItem(KEY_DEV)) localStorage.setItem(KEY_DEV, KW.uid()); } catch (e) { /* ohne Speicher */ }

  let db = load();
  const ui = loadUi();
  const S = { tab: 'heute', recipeId: null, filter: 'all', q: '', week: null };

  // ---------- Kleinigkeiten ----------
  const f0 = n => (n == null || !isFinite(n)) ? '–' : Math.round(n).toLocaleString('de-DE');
  const f1 = n => (n == null || !isFinite(n)) ? '–' : (Math.round(n * 10) / 10).toLocaleString('de-DE');
  const fNum = n => (n == null || !isFinite(n)) ? '' : String(Math.round(n * 100) / 100).replace('.', ',');
  const IC = {
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    imp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19h14"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.8-4.8"/></svg>',
    chev: '›'
  };
  let tt;
  function toast(t) { const x = $('#toast'); x.textContent = t; x.hidden = false; clearTimeout(tt); tt = setTimeout(() => { x.hidden = true; }, 2200); }
  function applyTheme() {
    if (ui.theme === 'light' || ui.theme === 'dark') document.documentElement.dataset.theme = ui.theme;
    else delete document.documentElement.dataset.theme;
  }
  const recipes = () => KW.live(db, 'recipes').sort((a, b) => a.name.localeCompare(b.name, 'de'));
  const getRecipe = id => { const r = db.recipes[id]; return r && !r.del ? r : null; };
  function todayLabel() {
    return new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
  }
  async function shareText(title, text) {
    if (navigator.share) {
      try { await navigator.share({ title, text }); return; } catch (e) { if (e && e.name === 'AbortError') return; }
    }
    try { await navigator.clipboard.writeText(text); toast('In die Zwischenablage kopiert'); } catch (e) { toast('Teilen nicht möglich'); }
  }

  // ---------- Seiten ----------
  function render(keepScroll) {
    const y = window.scrollY;
    const v = $('#view');
    const pages = { heute: pageHeute, woche: pageWoche, rezepte: pageRezepte, einkauf: pageEinkauf, mehr: pageMehr };
    v.innerHTML = '<div class="page">' + pages[S.tab]() + '</div>';
    document.querySelectorAll('.tabbar button').forEach(b => b.setAttribute('aria-current', b.dataset.tab === S.tab ? 'page' : 'false'));
    window.scrollTo(0, keepScroll ? y : 0);
  }

  // ---------- Heute ----------
  const P = KW.P;
  const today = () => KW.isoDate();
  function roomCard(date, big) {
    const rm = P.room(db, date);
    const pct = rm.target ? Math.min(100, rm.used / rm.target * 100) : 0;
    const ppct = rm.protein ? Math.min(100, rm.pUsed / rm.protein * 100) : 0;
    const sub = rm.rest >= 0 ? `etwa ${f0(Math.round(rm.rest / 10) * 10)} kcal frei` : `${f0(-rm.rest)} kcal über dem Ziel`;
    return `<div class="card room${rm.rest < -50 ? ' over' : ''}"><span class="lbl">${big ? 'Spielraum für den Rest des Tages' : 'Spielraum'}</span>
      <div class="room-big">${esc(rm.text)}</div>
      <p class="room-sub">${esc(sub)} · <b>${f0(rm.pOpen)} g Protein</b> offen</p>
      <div class="bars"><div class="bar"><i style="width:${pct}%"></i></div><span>${f0(rm.used)} / ${f0(rm.target)} kcal geplant</span>
      <div class="bar p"><i style="width:${ppct}%"></i></div><span>${f0(rm.pUsed)} / ${f0(rm.protein)} g Protein geplant</span></div></div>`;
  }
  function entryRow(e, date) {
    const r = P.recipeOf(db, e), m = P.mealById(e.meal), t = r ? P.portionOf(r) : null;
    const lab = e.meal === 'snack' ? 'Snack' : m.label;
    const sub = lab + (e.partner ? ' · 👫 mit Freundin' : '');
    if (!r) {
      return `<button class="row" data-act="slot" data-id="${e.id}"><span class="ico">${m.icon}</span><span class="mid"><span class="t muted">${e.recipeId ? 'Rezept gelöscht' : 'Noch kein Rezept'}</span><span class="s">${esc(sub)}</span></span><span class="add">Wählen</span></button>`;
    }
    return `<button class="row" data-act="slot" data-id="${e.id}"><span class="ico">${m.icon}</span><span class="mid"><span class="t">${esc(r.name)}</span><span class="s">${esc(sub)}</span></span><span class="right"><b>${f0(t.kcal)} kcal</b><span>${f0(t.p)} g P</span></span></button>`;
  }
  function dayList(date, withOff) {
    const es = P.entries(db, date);
    let rows = '';
    let k = 0;
    for (const m of P.MEALS) {
      while (k < es.length && es[k].pos < m.pos) { if (es[k].meal === 'snack') rows += entryRow(es[k], date); k++; }
      const e = es.find(x => x.meal === m.id);
      if (e) rows += entryRow(e, date);
      else if (withOff) rows += `<button class="row off" data-act="meal-on" data-date="${date}" data-meal="${m.id}"><span class="ico">${m.icon}</span><span class="mid"><span class="t">${esc(m.label)}</span><span class="s">nicht geplant</span></span><span class="add">＋</span></button>`;
    }
    for (; k < es.length; k++) if (es[k].meal === 'snack' && es[k].pos > 40) rows += entryRow(es[k], date);
    return rows;
  }
  function pageHeute() {
    const d = today(), n = recipes().length;
    let h = `<div class="top"><div><div class="eyebrow">${esc(todayLabel())}</div><h1>Heute</h1></div></div>`;
    h += roomCard(d, true);
    h += `<div class="list">${dayList(d, true)}<button class="row addrow" data-act="snack-new" data-date="${d}"><span class="ico">＋</span><span class="mid"><span class="t">Snack einfügen</span></span><span></span></button></div>`;
    if (!n) {
      h += `<div class="card empty"><span class="em">📖</span><div><b>Noch keine Rezepte</b>Rezepte als Block aus dem Chat einfügen oder das Beispiel laden.</div>
        <div class="btns" style="width:100%"><button class="btn" data-act="import">Rezepte einfügen</button><button class="btn plain" data-act="sample">Beispiel laden</button></div></div>`;
    }
    h += `<p class="hint" style="text-align:center">Alles Geplante zählt als gegessen. Die Portion deiner Freundin zählt nicht mit.</p>`;
    return h;
  }

  // ---------- Woche ----------
  function defaultWeek() {
    const d = today();
    return P.wd(d) >= 5 ? P.addDays(P.weekStart(d), 7) : P.weekStart(d);
  }
  function recentWeight() {
    const w = KW.latestWeight(db);
    return w && P.diffDays(w.date, today()) <= 6 ? w : null;
  }
  function spark(ws) {
    if (ws.length < 2) return '';
    const v = ws.slice(-10), min = Math.min(...v.map(x => x.kg)), max = Math.max(...v.map(x => x.kg)), span = Math.max(0.5, max - min);
    const W = 120, H = 36, pts = v.map((x, k) => [k * W / (v.length - 1), H - 4 - (x.kg - min) / span * (H - 8)]);
    return `<svg class="spark" viewBox="-3 -3 ${W + 6} ${H + 6}" aria-hidden="true"><polyline points="${pts.map(p => p.map(n => n.toFixed(1)).join(',')).join(' ')}" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${pts[pts.length - 1][0]}" cy="${pts[pts.length - 1][1]}" r="3.5" fill="currentColor"/></svg>`;
  }
  function pageWoche() {
    if (!S.week) S.week = defaultWeek();
    const start = S.week, days = P.weekDays(start), end = days[6];
    const range = Number(start.slice(8)) + '.' + (start.slice(5, 7) !== end.slice(5, 7) ? Number(start.slice(5, 7)) + '.' : '') + '–' + Number(end.slice(8)) + '.' + Number(end.slice(5, 7)) + '.';
    let h = `<div class="top"><div><div class="eyebrow">KW ${P.isoWeek(start)} · ${range}</div><h1>Woche</h1></div><div class="acts">
      <button class="circle" data-act="week" data-d="-7" aria-label="Woche zurück">‹</button><button class="circle" data-act="week" data-d="7" aria-label="Woche vor">›</button></div></div>`;
    // Schritt 1: Wochen-Check
    const w = recentWeight(), ws = P.weeklyWeights(db);
    if (!w) {
      h += `<button class="card check todo" data-act="weight"><span class="step-n">1</span><span class="mid"><span class="t">Gewicht eintragen</span><span class="s">Erster Schritt beim Planen: einmal pro Woche wiegen.</span></span><span class="add">＋</span></button>`;
    } else {
      const prev = ws.filter(x => x.week < P.weekStart(w.date)).pop();
      const dlt = prev ? Math.round((w.kg - prev.kg) * 10) / 10 : null;
      h += `<button class="card check" data-act="weight"><span class="step-n done">✓</span><span class="mid"><span class="t">${f1(w.kg)} kg</span><span class="s">${dlt == null ? 'Wochen-Check erledigt' : (dlt <= 0 ? '−' : '+') + f1(Math.abs(dlt)) + ' kg zur Vorwoche'}</span></span>${spark(ws)}</button>`;
    }
    const st = P.stall(db, today());
    if (st) {
      h += `<div class="card stall"><b>Dein Gewicht sinkt seit 2 Wochen nicht</b><p class="hint" style="margin:4px 0 10px">Vor 2 Wochen ${f1(st.ref.kg)} kg, jetzt ${f1(st.last.kg)} kg. Vorschlag – geändert wird nur mit deinem OK:</p>
        <div class="btns"><button class="btn tint" data-act="lighten">Mahlzeiten leichter machen</button><button class="btn tint" data-act="moremeal">Eine Mahlzeit mehr einplanen</button><button class="btn plain small" style="align-self:center" data-act="stall-ack">Später</button></div></div>`;
    }
    // Schritt 2: planen
    const es = P.weekEntries(db, start), empty = es.filter(e => P.isMain(e) && !P.recipeOf(db, e)).length;
    const plannedDays = days.filter(d => P.dayTotals(db, d).n);
    const avgP = plannedDays.length ? plannedDays.reduce((s, d) => s + P.dayTotals(db, d).p, 0) / plannedDays.length : 0;
    h += `<div class="card plan2"><div class="inline"><span class="step-n">2</span><span class="mid" style="flex:1"><span class="t">Woche planen</span><span class="s">${es.length ? `${es.length} Mahlzeiten · ${empty ? empty + ' noch leer · ' : ''}Ø ${f0(avgP)} g Protein pro Tag` : 'An den Tagen die Mahlzeiten anwählen, dann vorschlagen lassen.'}</span></span></div>
      <div class="btnrow"><button class="btn" data-act="suggest"${empty ? '' : ' disabled'}>✨ Vorschlagen</button><button class="btn plain" data-act="favs">★ Lieblingswochen</button></div></div>`;
    for (const d of days) {
      const t = P.dayTotals(db, d), isToday = d === today(), rm = P.room(db, d);
      const on = new Set(P.entries(db, d).map(e => e.meal));
      h += `<div class="daycard${isToday ? ' today' : ''}"><div class="dayhead"><b>${esc(P.DAY_LONG[P.wd(d)])} <span class="muted">${Number(d.slice(8))}.${Number(d.slice(5, 7))}.</span></b>${isToday ? '<span class="badge ok">Heute</span>' : ''}
        <span class="dsum">${t.n ? f0(t.kcal) + ' kcal · <span class="pc">' + f0(t.p) + ' g P</span>' : ''}</span></div>
        <div class="mealchips">${P.MEALS.map(m => `<button class="mchip" data-act="meal-toggle" data-date="${d}" data-meal="${m.id}" aria-pressed="${on.has(m.id)}">${m.icon} ${esc(m.short)}</button>`).join('')}</div>`;
      const rows = dayList(d, false);
      if (rows) h += `<div class="list inner">${rows}</div>`;
      h += `<div class="dayfoot"><span class="hint">${on.size ? esc(rm.text) : 'Nichts geplant'}</span><button class="link" data-act="snack-new" data-date="${d}">＋ Snack</button></div></div>`;
    }
    return h;
  }

  // ---------- Fenster: Mahlzeit ----------
  let SL = null;
  function openSlot(id) { SL = { id }; openSheet(slotSheet); }
  function slotSheet() {
    const e = db.plan[SL.id];
    if (!e || e.del) return '<div class="sheet-head"><span></span><h2>Entfernt</h2><button class="r" data-act="close">Fertig</button></div>';
    const r = P.recipeOf(db, e), m = P.mealById(e.meal), t = r ? P.portionOf(r) : null;
    const lab = (e.meal === 'snack' ? 'Snack' : m.label) + ' · ' + P.dayLabel(e.date);
    let h = `<div class="sheet-head"><span></span><h2>${esc(lab)}</h2><button class="r" data-act="close">Fertig</button></div>`;
    if (r) {
      h += `<div class="ecard"><span class="t" style="font-weight:700;font-size:19px">${esc(r.name)}</span>
        <div class="tiles"><div><b>${f0(t.kcal)}</b><span>kcal</span></div><div class="p"><b>${f0(t.p)}<small> g</small></b><span>Protein</span></div><div><b>${f0(t.c)}<small> g</small></b><span>KH</span></div><div><b>${f0(t.f)}<small> g</small></b><span>Fett</span></div></div></div>
        <div class="btns"><button class="btn tint" data-act="swap">⇄ Tauschen</button><div class="btnrow"><button class="btn plain" data-act="pick">Anderes Rezept</button><button class="btn plain" data-act="view" data-id="${r.id}">Rezept ansehen</button></div></div>`;
    } else {
      h += `<div class="btns"><button class="btn" data-act="pick">Rezept wählen</button>${e.meal !== 'snack' ? '<button class="btn tint" data-act="slot-suggest">✨ Vorschlag nehmen</button>' : ''}</div>`;
    }
    h += `<div class="set"><div class="it"><span>👫 Freundin isst mit</span><label class="switch"><input type="checkbox" data-partner="${e.id}"${e.partner ? ' checked' : ''}><span></span></label></div></div>
      <p class="hint" style="margin-top:-8px">Ihre Portion (${f0(KW.getSetting(db, 'partnerFactor') * 100)} %) kommt auf die Einkaufsliste, zählt aber nicht zu deinem Spielraum.</p>
      <button class="btn danger" data-act="slot-del">${e.meal === 'snack' ? 'Snack entfernen' : 'Mahlzeit abwählen'}</button>`;
    return h;
  }

  // ---------- Fenster: Rezept auswählen ----------
  let PK = null;
  function defaultGap(date) {
    if (date !== today()) return 15;
    const h = new Date().getHours();
    return h < 8 ? 5 : h < 11 ? 15 : h < 14 ? 25 : h < 18 ? 35 : 45;
  }
  function openPicker(opts) { PK = Object.assign({ q: '', all: false }, opts); openSheet(pickerSheet, { tall: true }); }
  function pickerSheet() {
    const meal = PK.entryId ? db.plan[PK.entryId].meal : 'snack';
    const date = PK.entryId ? db.plan[PK.entryId].date : PK.date;
    const cats = PK.all ? KW.CATS.map(c => c.id) : P.catsFor(meal);
    let h = `<div class="sheet-head"><button class="l" data-act="close">Abbrechen</button><h2>${PK.entryId ? esc(P.mealById(meal).label) : 'Snack einfügen'}</h2><span></span></div><div class="page-in">`;
    if (!PK.entryId) h += `<div class="field"><span class="lbl">Wann? (${esc(P.dayLabel(date))})</span><select id="pk-gap">${P.GAPS.map(g => `<option value="${g.pos}"${g.pos === PK.gap ? ' selected' : ''}>${esc(g.label)}</option>`).join('')}</select></div>`;
    h += `<label class="search">${IC.search}<input type="search" id="pq" placeholder="Suchen" value="${esc(PK.q)}" autocomplete="off"></label>
      <div class="seg"><button data-act="pk-all" data-v="0" aria-pressed="${!PK.all}">${meal === 'snack' ? 'Snacks' : 'Hauptmahlzeiten'}</button><button data-act="pk-all" data-v="1" aria-pressed="${PK.all}">Alle Rezepte</button></div>
      <div id="pklist">${pickList(cats, meal)}</div></div>`;
    return h;
  }
  function pickList(cats, meal) {
    const q = KW.norm(PK.q);
    const list = KW.live(db, 'recipes').filter(r => cats.includes(r.cat) && (!q || KW.norm(r.name).includes(q)))
      .map(r => ({ r, s: P.score(db, r), t: P.portionOf(r), rs: KW.ratingSummary(db, r.id) }))
      .sort((a, b) => (b.s - a.s) || a.r.name.localeCompare(b.r.name, 'de'));
    if (!list.length) return `<div class="card empty">Keine passenden Rezepte.${!PK.all ? ' Unter „Alle Rezepte“ schauen oder im Rezeptbuch anlegen.' : ''}</div>`;
    return '<div class="list">' + list.map((x, k) => {
      const bits = [KW.catById(x.r.cat).short];
      if (meal === 'box' && !x.r.box) bits.push('nicht boxtauglich');
      if (x.rs.good) bits.push('👍'); else if (x.rs.bad) bits.push('👎');
      if (k < 3 && x.s > -Infinity && !q) bits.unshift('✨ Empfohlen');
      return `<button class="row" data-act="pick-r" data-id="${x.r.id}"><span class="ico">${KW.catById(x.r.cat).icon}</span><span class="mid"><span class="t">${esc(x.r.name)}</span><span class="s">${esc(bits.join(' · '))}</span></span><span class="right"><b>${f0(x.t.kcal)} kcal</b><span>${f0(x.t.p)} g P</span></span></button>`;
    }).join('') + '</div>';
  }
  function pickRecipe(rid) {
    if (PK.entryId) P.update(db, PK.entryId, { recipeId: rid });
    else { const g = $('#pk-gap'); P.addSnack(db, PK.date, g ? +g.value : PK.gap, rid); }
    save(); closeSheet(); render(true);
  }

  // ---------- Fenster: Tauschen ----------
  function swapSheet() {
    const e = db.plan[SL.id], opts = P.swapOptions(db, e);
    let h = `<div class="sheet-head"><button class="l" data-act="slot-back">Zurück</button><h2>Tauschen</h2><span></span></div>
      <p class="hint" style="margin:0">Rezepte mit ähnlichen Werten. Oben stehen die, deren Zutaten diese Woche schon gekauft werden.</p>`;
    if (!opts.length) return h + '<div class="card empty">Kein Rezept mit ähnlichen Werten gefunden.</div>';
    const sign = n => (n > 0 ? '+' : n < 0 ? '−' : '±') + f0(Math.abs(n));
    return h + '<div class="list">' + opts.map(o => `<button class="row" data-act="swap-r" data-id="${o.r.id}"><span class="ico">${KW.catById(o.r.cat).icon}</span>
      <span class="mid"><span class="t">${esc(o.r.name)}</span><span class="s">${sign(o.dk)} kcal · ${sign(o.dp)} g P${o.shared ? ' · 🛒 ' + o.shared + (o.shared === 1 ? ' Zutat' : ' Zutaten') + ' schon da' : ''}</span></span>
      <span class="right"><b>${f0(o.t.kcal)} kcal</b><span>${f0(o.t.p)} g P</span></span></button>`).join('') + '</div>';
  }

  // ---------- Fenster: Gewicht ----------
  let WG = null;
  function openWeight(cont) { const w = KW.latestWeight(db); WG = { cont, kg: w ? fNum(w.kg) : '' }; openSheet(weightSheet); }
  function weightSheet() {
    const ws = P.weeklyWeights(db).slice().reverse();
    let h = `<div class="sheet-head"><button class="l" data-act="close">Abbrechen</button><h2>Wochen-Check</h2><button class="r" data-act="weight-save">Sichern</button></div>
      <div class="field"><label for="wg-kg">Gewicht heute (kg)</label><input id="wg-kg" inputmode="decimal" value="${esc(WG.kg)}" placeholder="z. B. 87,5" style="font-size:28px;text-align:center;font-weight:700"></div>
      <p class="hint" style="margin-top:-8px">Am besten morgens nach dem Aufstehen, immer gleich. Pro Woche zählt der letzte Wert.</p>`;
    if (ws.length) {
      h += `<div class="field"><span class="lbl">Verlauf</span><div class="list">` + ws.slice(0, 12).map((w, k) => {
        const prev = ws[k + 1], d = prev ? Math.round((w.kg - prev.kg) * 10) / 10 : null;
        return `<div class="row" style="grid-template-columns:minmax(0,1fr) auto"><span class="mid"><span class="t">KW ${P.isoWeek(w.week)}</span><span class="s">${esc(P.dayLabel(w.date))}</span></span>
          <span class="right"><b>${f1(w.kg)} kg</b>${d != null ? `<span class="${d > 0 ? 'up' : ''}">${d > 0 ? '+' : d < 0 ? '−' : '±'}${f1(Math.abs(d))} kg</span>` : '<span></span>'}</span></div>`;
      }).join('') + '</div></div>';
    }
    return h;
  }

  // ---------- Fenster: Lieblingswochen ----------
  function favSheet() {
    const favs = KW.live(db, 'favweeks').sort((a, b) => a.name.localeCompare(b.name, 'de'));
    const has = P.weekEntries(db, S.week).length;
    let h = `<div class="sheet-head"><span></span><h2>Lieblingswochen</h2><button class="r" data-act="close">Fertig</button></div>`;
    if (favs.length) {
      h += '<div class="list">' + favs.map(f => {
        const n = Object.values(f.days).reduce((s, d) => s + d.length, 0);
        return `<div class="row" style="grid-template-columns:minmax(0,1fr) auto auto"><span class="mid"><span class="t">★ ${esc(f.name)}</span><span class="s">${n} Mahlzeiten</span></span>
          <button class="btn tint small" data-act="fav-apply" data-id="${f.id}">Einplanen</button><button class="x" data-act="fav-del" data-id="${f.id}" aria-label="Löschen">✕</button></div>`;
      }).join('') + '</div>';
    } else h += '<p class="hint" style="margin:0">Noch keine Lieblingswoche. Plane eine Woche, die gut lief, und speichere sie hier.</p>';
    h += `<div class="field"><label for="fav-name">Diese Woche (KW ${P.isoWeek(S.week)}) speichern als</label><input id="fav-name" placeholder="z. B. Schulwoche" value=""></div>
      <button class="btn" data-act="fav-save"${has ? '' : ' disabled'}>★ Woche speichern</button>
      <button class="btn danger" data-act="week-clear"${has ? '' : ' disabled'}>Diese Woche leeren</button>`;
    return h;
  }

  // ---------- Fenster: leichter machen / mehr einplanen ----------
  let LT = null;
  function lightenSheet() {
    const list = LT.list;
    let h = `<div class="sheet-head"><button class="l" data-act="close">Abbrechen</button><h2>Leichter machen</h2><button class="r" data-act="lighten-ok"${list.some(x => x.on) ? '' : ' disabled'}>Übernehmen</button></div>
      <p class="hint" style="margin:0">Kohlenhydrat-Zutaten (Reis, Nudeln, Brot …) in den Rezepten dieser Woche um 25 % kürzen. Protein bleibt gleich. Geändert wird nur, was angehakt ist.</p>`;
    if (!list.length) return h + '<div class="card empty">In dieser Woche ist kein Rezept mit Kohlenhydrat-Zutaten geplant.</div>';
    return h + list.map((x, k) => `<button class="opt" data-act="lt-toggle" data-k="${k}" aria-pressed="${x.on}"><span class="chk">${x.on ? '✓' : ''}</span><span class="mid"><span class="t">${esc(x.r.name)}</span>
      <span class="s">${esc(x.changed.join(', '))} −25 %</span><span class="s">${f0(x.before.kcal)} → <b>${f0(x.after.kcal)} kcal</b> · Protein ${f0(x.before.p)} → ${f0(x.after.p)} g</span></span></button>`).join('');
  }
  let MM = null;
  function moreSheet() {
    const days = P.weekDays(S.week);
    return `<div class="sheet-head"><button class="l" data-act="close">Abbrechen</button><h2>Mahlzeit mehr</h2><button class="r" data-act="more-ok"${MM.days.size ? '' : ' disabled'}>Einplanen</button></div>
      <p class="hint" style="margin:0">Feste Mahlzeiten helfen gegen Zwischendurch-Essen. Welche Mahlzeit soll an welchen Tagen dazukommen? Die App schlägt danach Rezepte vor.</p>
      <div class="seg">${P.MEALS.map(m => `<button data-act="mm-meal" data-v="${m.id}" aria-pressed="${MM.meal === m.id}">${esc(m.short)}</button>`).join('')}</div>
      <div class="days7">${days.map(d => { const has = P.entries(db, d).some(e => e.meal === MM.meal); return `<button data-act="mm-day" data-v="${d}" aria-pressed="${MM.days.has(d)}"${has ? ' disabled' : ''}>${P.DAY_SHORT[P.wd(d)]}</button>`; }).join('')}</div>`;
  }

  // ---------- Vorschlagen ----------
  function runSuggest() {
    const res = P.suggestWeek(db, S.week);
    P.applySuggestions(db, res.fill);
    save(); render(true);
    if (res.open.length) {
      const why = { keep: 'Kein passendes Rezept hält bis dahin. Ein einfrierbares Rezept anlegen oder von Hand wählen.', box: 'Kein boxtaugliches Hauptgericht im Rezeptbuch.', none: 'Im Rezeptbuch gibt es noch keine Hauptmahlzeit.' };
      openSheet(() => `<div class="sheet-head"><span></span><h2>${res.fill.length} vorgeschlagen</h2><button class="r" data-act="close">OK</button></div>
        <p style="margin:0">${res.open.length} ${res.open.length === 1 ? 'Platz ist' : 'Plätze sind'} leer geblieben:</p>
        <div class="list">${res.open.map(o => `<div class="row" style="grid-template-columns:minmax(0,1fr)"><span class="mid"><span class="t">${esc(P.dayLabel(o.date))} · ${esc(P.mealById(db.plan[o.id].meal).label)}</span><span class="s" style="white-space:normal">${esc(why[o.why])}</span></span></div>`).join('')}</div>`);
    } else toast(res.fill.length === 1 ? '1 Mahlzeit vorgeschlagen' : res.fill.length + ' Mahlzeiten vorgeschlagen');
  }

  // ---------- Bewertung beim Öffnen ----------
  function askRating() {
    if (!KW.getSetting(db, 'setupDone') || WZ || SH) return;
    const e = P.ratingCandidate(db, today());
    if (!e) return;
    RT = { id: e.recipeId, planId: e.id, satt: null, lecker: null, ask: P.dayLabel(e.date) + ' · ' + (e.meal === 'snack' ? 'Snack' : P.mealById(e.meal).label) };
    openSheet(rateSheet);
  }

  function pageEinkauf() {
    return `<div class="top"><h1>Einkauf</h1></div><div class="card empty"><span class="em">🛒</span><div><b>Einkaufsliste kommt in Etappe 3</b>Ganze Packungen, nach Bereichen sortiert, mit Grundvorrat und Restekarte.</div></div>`;
  }

  // ---------- Rezeptbuch ----------
  function pageRezepte() {
    if (S.recipeId && getRecipe(S.recipeId)) return pageRecipe(getRecipe(S.recipeId));
    S.recipeId = null;
    const all = recipes();
    const bad = all.filter(r => KW.ratingSummary(db, r.id).bad);
    if (S.filter === 'bad' && !bad.length) S.filter = 'all';
    let h = `<div class="top"><h1>Rezepte</h1><div class="acts">
      <button class="circle" data-act="import" aria-label="Rezepte einfügen">${IC.imp}</button>
      <button class="circle" data-act="new" aria-label="Rezept anlegen">${IC.plus}</button></div></div>`;
    if (!all.length) {
      return h + `<div class="card empty"><span class="em">📖</span><div><b>Noch keine Rezepte</b>Im Claude-Chat „Kochwerk“ und ein Gericht schreiben, den Block kopieren und hier einfügen.</div>
        <div class="btns" style="width:100%"><button class="btn" data-act="import">Rezepte einfügen</button><button class="btn plain" data-act="sample">Beispielrezepte laden</button><button class="btn plain" data-act="new">Von Hand anlegen</button></div></div>`;
    }
    h += `<label class="search">${IC.search}<input type="search" id="q" placeholder="Rezept oder Zutat suchen" value="${esc(S.q)}" autocomplete="off"></label>`;
    const count = id => all.filter(r => r.cat === id).length;
    h += '<div class="chips">' + `<button class="chip" data-act="filter" data-f="all" aria-pressed="${S.filter === 'all'}">Alle ${all.length}</button>` +
      KW.CATS.filter(c => count(c.id)).map(c => `<button class="chip" data-act="filter" data-f="${c.id}" aria-pressed="${S.filter === c.id}">${c.icon} ${esc(c.short)} ${count(c.id)}</button>`).join('') +
      (bad.length ? `<button class="chip warn" data-act="filter" data-f="bad" aria-pressed="${S.filter === 'bad'}">👎 Zum Aussortieren ${bad.length}</button>` : '') + '</div>';
    h += '<div id="rlist">' + recipeList() + '</div>';
    return h;
  }
  function recipeList() {
    const q = KW.norm(S.q);
    let list = recipes();
    if (S.filter === 'bad') list = list.filter(r => KW.ratingSummary(db, r.id).bad);
    else if (S.filter !== 'all') list = list.filter(r => r.cat === S.filter);
    if (q) list = list.filter(r => KW.norm(r.name).includes(q) || r.ingredients.some(i => KW.norm(i.name).includes(q)));
    let h = '';
    if (S.filter === 'bad') h += '<p class="hint" style="margin:0 4px 10px">Diese Rezepte waren nicht satt machend oder nicht lecker. Löschen oder im Chat verbessern lassen.</p>';
    if (!list.length) return h + '<div class="card empty">Nichts gefunden.</div>';
    return h + '<div class="list">' + list.map(r => {
      const c = KW.catById(r.cat), t = KW.recipeTotals(r).portion, rs = KW.ratingSummary(db, r.id);
      const bits = [c.short, fNum(r.portions) + ' Port.', fNum(r.keepDays) + ' Tage'];
      if (r.freeze) bits.push('❄️');
      if (r.box) bits.push('Box');
      if (rs.good) bits.push('👍'); else if (rs.bad) bits.push('👎');
      return `<button class="row" data-act="open" data-id="${r.id}"><span class="ico">${c.icon}</span>
        <span class="mid"><span class="t">${esc(r.name)}</span><span class="s">${esc(bits.join(' · '))}</span></span>
        <span class="right"><b>${f0(t.kcal)} kcal</b><span>${f0(t.p)} g P</span></span></button>`;
    }).join('') + '</div>';
  }

  const SATT = [{ v: -1, e: '😕', l: 'Nicht satt' }, { v: 0, e: '😐', l: 'Geht so' }, { v: 1, e: '😋', l: 'Satt' }];
  const LECKER = [{ v: -1, e: '👎', l: 'Nicht so' }, { v: 0, e: '👌', l: 'Okay' }, { v: 1, e: '👍', l: 'Lecker' }];
  const word = (arr, v) => v == null ? '' : (v <= -0.5 ? arr[0] : v >= 0.5 ? arr[2] : arr[1]);

  function pageRecipe(r) {
    const c = KW.catById(r.cat), T = KW.recipeTotals(r), t = T.portion, rs = KW.ratingSummary(db, r.id);
    let h = `<div><button class="back" data-act="back">${IC.back}Rezepte</button></div>
      <div class="rhead"><span class="eyebrow">${c.icon} ${esc(c.label)}</span><h1>${esc(r.name)}</h1>
      <div class="facts"><span class="fact">🍽️ ${fNum(r.portions)} ${r.portions === 1 ? 'Portion' : 'Portionen'}</span>
      <span class="fact">🧊 ${fNum(r.keepDays)} ${r.keepDays === 1 ? 'Tag' : 'Tage'} haltbar</span>
      <span class="fact${r.freeze ? '' : ' no'}">❄️ Einfrierbar</span><span class="fact${r.box ? '' : ' no'}">🥡 Boxtauglich</span>
      ${r.time ? `<span class="fact">⏱️ ${f0(r.time)} min</span>` : ''}</div></div>`;
    h += `<div class="card" style="display:flex;flex-direction:column;gap:10px"><span class="lbl">Pro Portion</span>
      <div class="tiles"><div><b>${f0(t.kcal)}</b><span>kcal</span></div><div class="p"><b>${f0(t.p)}<small> g</small></b><span>Protein</span></div>
      <div><b>${f0(t.c)}<small> g</small></b><span>Kohlenhydr.</span></div><div><b>${f0(t.f)}<small> g</small></b><span>Fett</span></div></div>
      <p class="hint">Eine Portion wiegt etwa ${f0(t.g)} g. Gesamt ${f0(T.total.kcal)} kcal und ${f0(T.total.p)} g Protein.</p>
      ${T.missing ? '<div class="warnbox">Bei einigen Zutaten fehlen Werte. Die Zahlen sind deshalb zu niedrig.</div>' : ''}</div>`;
    h += `<div class="card rate"><div><span class="lbl">Bewertung</span><div class="face">${rs.n
      ? `${word(SATT, rs.satt).e} ${word(SATT, rs.satt).l} · ${word(LECKER, rs.lecker).e} ${word(LECKER, rs.lecker).l} <span class="muted">(${rs.n}×)</span>`
      : '<span class="muted">Noch nicht bewertet</span>'}</div></div><button class="btn tint small" data-act="rate" data-id="${r.id}">Bewerten</button></div>`;
    if (rs.bad) h += `<div class="errbox">Schlecht bewertet – zum Aussortieren vorgeschlagen. Im Plan wird es nicht mehr bevorzugt.</div>`;
    if (r.note) h += `<div class="card"><span class="lbl">Notiz</span><p style="margin:4px 0 0;white-space:pre-line">${esc(r.note)}</p></div>`;
    for (const tip of r.tips || []) h += `<div class="tip">${esc(tip)}</div>`;
    h += `<h2 class="sec">Zutaten</h2><div class="list ings">` + r.ingredients.map(i => {
      const g = KW.ingGrams(i), k = i.per100 && i.per100.kcal != null ? g * i.per100.kcal / 100 : null;
      const pk = i.pantry ? 'Vorrat' + (i.pack ? ' · ' + KW.packText(i.pack) : '') : (i.pack ? KW.packText(i.pack) : 'ohne Packung');
      return `<div class="row"><span class="mid"><span class="t">${esc(i.name)}</span><span class="s">${esc(pk)} · ${esc(KW.areaById(i.area).label)}</span></span>
        <span class="right"><b>${esc(KW.amountText(i))}</b><span class="muted" style="color:var(--label-2);font-weight:500">${k == null ? 'Werte fehlen' : f0(k) + ' kcal'}</span></span></div>`;
    }).join('') + '</div>';
    if (r.steps.length) {
      h += `<h2 class="sec">Schritte</h2><div class="steps">` + r.steps.map((s, k) => `<div class="step"><span class="n">${k + 1}</span><div>
        <p>${esc(s.text)}</p>${s.min ? `<div class="meta"><span class="badge ${s.passive ? 'ok' : ''}">⏱ ${fNum(s.min)} min${s.passive ? ' · nebenbei' : ''}</span></div>` : ''}
        ${s.tip ? `<div class="tip">${esc(s.tip)}</div>` : ''}</div></div>`).join('') + '</div>';
    }
    h += `<div class="btns"><button class="btn tint" data-act="edit" data-id="${r.id}">Bearbeiten</button>
      <button class="btn plain" data-act="share" data-id="${r.id}">Als Text teilen</button>
      <button class="btn danger" data-act="del" data-id="${r.id}">Rezept löschen</button></div>`;
    return h;
  }

  // ---------- Mehr / Einstellungen ----------
  function pageMehr() {
    const p = KW.profile(db), t = KW.calcTargets(p);
    const bad = recipes().filter(r => KW.ratingSummary(db, r.id).bad).length;
    const opt = (list, cur, val, lab) => list.map(o => `<option value="${esc(val(o))}"${String(val(o)) === String(cur) ? ' selected' : ''}>${esc(lab(o))}</option>`).join('');
    const days = [1, 2, 3, 4, 5, 6, 0];
    const facs = []; for (let f = 0.3; f <= 1.51; f += 0.1) facs.push(Math.round(f * 10) / 10);
    let h = `<div class="top"><h1>Mehr</h1></div>`;
    if (t) {
      h += `<div class="card" style="display:flex;flex-direction:column;gap:10px"><span class="lbl">Dein Ziel</span>
        <div class="tiles t3"><div class="p"><b>${f0(t.target)}</b><span>kcal pro Tag</span></div><div><b>${f0(t.tdee)}</b><span>Verbrauch</span></div><div><b>−${f0(t.deficit)}</b><span>Defizit</span></div></div>
        <p class="hint">Damit etwa ${f1(t.kgWeek)} kg weniger pro Woche. Grundumsatz ${f0(t.bmr)} kcal.${t.capped ? ' Das Defizit ist auf 25 % gedeckelt, damit die Muskeln bleiben.' : ''}${t.floored ? ' Das Ziel bleibt beim Grundumsatz, tiefer wäre zu wenig.' : ''}</p></div>`;
    }
    h += `<div class="group-title">Körper</div><div class="set">
      <div class="it"><span>Geschlecht</span><div class="seg"><button data-act="setv" data-k="sex" data-v="m" aria-pressed="${p.sex === 'm'}">Mann</button><button data-act="setv" data-k="sex" data-v="w" aria-pressed="${p.sex === 'w'}">Frau</button></div></div>
      <div class="it"><label for="s-age">Alter</label><input id="s-age" data-set="age" inputmode="numeric" value="${esc(p.age)}"></div>
      <div class="it"><label for="s-height">Größe (cm)</label><input id="s-height" data-set="height" inputmode="numeric" value="${esc(p.height)}"></div>
      <div class="it"><label for="s-weight">Gewicht (kg)</label><input id="s-weight" data-set="weight" inputmode="decimal" value="${esc(fNum(p.weight))}"></div>
      <div class="it"><label for="s-act">Aktivität</label><select id="s-act" data-set="activity">${opt(KW.ACTIVITY, p.activity, o => o.v, o => o.label)}</select></div>
      <div class="it"><label for="s-tempo">Abnehmtempo</label><select id="s-tempo" data-set="tempo">${opt(KW.TEMPO, p.tempo, o => o.id, o => o.label)}</select></div></div>
      <div class="group-title">Ziele</div><div class="set">
      <div class="it"><label for="s-prot">Protein pro Tag (g)</label><input id="s-prot" data-set="protein" inputmode="numeric" value="${esc(p.protein)}"></div>
      <div class="it"><label for="s-meal">Normale Mahlzeit (kcal)</label><input id="s-meal" data-set="mealKcal" inputmode="numeric" value="${esc(p.mealKcal)}"></div></div>
      <p class="hint" style="margin:-12px 4px 0">Mit der normalen Mahlzeit zeigt „Heute“ den Spielraum an, z. B. „noch Platz für etwa 2 normale Mahlzeiten“.</p>
      <div class="group-title">Kochen</div><div class="set">
      <div class="it"><label for="s-day">Standard-Kochtag</label><select id="s-day" data-set="cookDay">${opt(days, p.cookDay, d => d, d => KW.WEEKDAYS[d])}</select></div>
      <div class="it"><label for="s-fac">Portion Freundin</label><select id="s-fac" data-set="partnerFactor">${opt(facs, p.partnerFactor, f => f, f => Math.round(f * 100) + ' %')}</select></div></div>
      <div class="group-title">Rezepte</div><div class="set">
      <button class="act" data-act="format"><span>Import-Format</span><span class="chev">${IC.chev}</span></button>
      <button class="act" data-act="sample"><span>Beispielrezepte laden</span><span class="chev">${IC.chev}</span></button>
      ${bad ? `<button class="act" data-act="showbad"><span>Zum Aussortieren</span><small>${bad}</small></button>` : ''}</div>
      <div class="group-title">Darstellung</div><div class="set">
      <div class="it"><span>Farben</span><div class="seg" style="width:220px">${[['auto', 'Automatisch'], ['light', 'Hell'], ['dark', 'Dunkel']].map(([v, l]) => `<button data-act="theme" data-v="${v}" aria-pressed="${ui.theme === v}">${l}</button>`).join('')}</div></div></div>
      <div class="group-title">Abgleich & Sicherung</div><div class="set">
      <div class="it"><span class="muted">Abgleich mit dem iPad und Export/Import kommen in Etappe 5.</span><span></span></div></div>
      <div class="set"><button class="act" data-act="setup"><span>Fragebogen neu durchlaufen</span><span class="chev">${IC.chev}</span></button></div>
      <p class="hint" style="text-align:center">Kochwerk ${VERSION}<br>Die Daten liegen nur auf diesem Gerät.</p>`;
    return h;
  }
  const RANGES = { age: [12, 99], height: [120, 230], weight: [35, 250], protein: [40, 400], mealKcal: [150, 1500] };
  function onSetting(el) {
    const k = el.dataset.set;
    let v = el.value;
    if (k === 'tempo') v = String(v);
    else v = KW.num(v);
    if (RANGES[k] && !(v >= RANGES[k][0] && v <= RANGES[k][1])) { toast('Bitte einen Wert zwischen ' + RANGES[k][0] + ' und ' + RANGES[k][1] + ' eingeben'); render(true); return; }
    if (k === 'weight') KW.setWeight(db, v); else KW.setSetting(db, k, v);
    save(); render(true);
  }

  // ---------- Fenster von unten ----------
  let SH = null;
  function openSheet(fn, opts = {}) {
    SH = { fn, tall: !!opts.tall, modal: !!opts.modal };
    const w = $('#sheet');
    w.hidden = false;
    w.innerHTML = `<div class="sheet${SH.tall ? ' tall' : ''}" role="dialog" aria-modal="true"></div>`;
    document.body.style.overflow = 'hidden';
    refreshSheet();
  }
  function refreshSheet(keep) {
    if (!SH) return;
    const el = $('#sheet .sheet'), y = el.scrollTop;
    el.innerHTML = '<div class="grab"></div>' + SH.fn();
    if (keep) el.scrollTop = y;
  }
  function closeSheet() { SH = null; const w = $('#sheet'); w.hidden = true; w.innerHTML = ''; document.body.style.overflow = ''; }
  $('#sheet').addEventListener('click', e => { if (e.target.id === 'sheet' && SH && !SH.modal) closeSheet(); });
  function confirmSheet(title, text, okLabel, onOk) {
    openSheet(() => `<div class="sheet-head"><span></span><h2>${esc(title)}</h2><span></span></div>
      <p style="margin:0;text-align:center">${esc(text)}</p>
      <div class="btns"><button class="btn danger" data-act="cfm-ok">${esc(okLabel)}</button><button class="btn plain" data-act="close">Abbrechen</button></div>`);
    CFM = onOk;
  }
  let CFM = null;

  // ---------- Bewerten ----------
  let RT = null;
  function openRate(id) {
    RT = { id, satt: null, lecker: null };
    openSheet(rateSheet);
  }
  function rateSheet() {
    const r = getRecipe(RT.id);
    const row = (k, arr) => `<div class="grid3">${arr.map(o => `<button class="opt" style="flex-direction:column;gap:4px;padding:12px 6px;text-align:center" data-act="rv" data-k="${k}" data-v="${o.v}" aria-pressed="${RT[k] === o.v}"><span style="font-size:28px">${o.e}</span><span style="font-size:14px;font-weight:600">${o.l}</span></button>`).join('')}</div>`;
    return `<div class="sheet-head"><button class="l" data-act="${RT.planId ? 'rate-skip' : 'close'}">${RT.planId ? 'Später' : 'Abbrechen'}</button><h2>${RT.planId ? 'Wie war’s?' : 'Bewerten'}</h2><button class="r" data-act="rate-save"${RT.satt == null || RT.lecker == null ? ' disabled' : ''}>Sichern</button></div>
      <p style="margin:0;text-align:center;font-weight:600">${esc(r ? r.name : '')}${RT.ask ? `<br><span class="hint">${esc(RT.ask)}</span>` : ''}</p>
      <div class="field"><span class="lbl">Hat es satt gemacht?</span>${row('satt', SATT)}</div>
      <div class="field"><span class="lbl">War es lecker?</span>${row('lecker', LECKER)}</div>
      <p class="hint">Gut bewertete Rezepte schlägt der Wochenplan bevorzugt vor, schlecht bewertete landen unter „Zum Aussortieren“.</p>`;
  }

  // ---------- Rezept-Editor ----------
  const UNITS = ['g', 'ml', 'Stück', 'EL', 'TL', 'Scheibe', 'Zehe', 'Bund', 'Becher', 'Dose', 'Packung', 'Glas', 'Beutel', 'Prise', 'Handvoll', 'Tasse'];
  let ED = null;
  const blankIng = () => ({ name: '', qty: 0, unit: 'g', pieceG: null, g: 0, pack: null, pantry: false, area: 'sonst', per100: { kcal: null, p: null, c: null, f: null } });
  function openEditor(id) {
    const src = id ? getRecipe(id) : null;
    const draft = src ? JSON.parse(JSON.stringify(src)) : { id: null, name: '', cat: 'main', portions: 2, keepDays: 3, freeze: false, box: true, time: null, note: '', tips: [], ingredients: [blankIng()], steps: [{ text: '', min: null, passive: false, tip: '' }] };
    ED = { draft, open: src ? -1 : 0, text: false, isNew: !src, warn: [] };
    openSheet(editorSheet, { tall: true, modal: true });
  }
  const packValue = i => i.pantry ? 'Vorrat' + (i.pack ? ', ' + KW.packText(i.pack) : '') : (i.pack ? KW.packText(i.pack) : '');
  function edSum() {
    const t = KW.recipeTotals(ED.draft).portion;
    return `<div class="tiles"><div><b>${f0(t.kcal)}</b><span>kcal</span></div><div class="p"><b>${f0(t.p)}<small> g</small></b><span>Protein</span></div><div><b>${f0(t.c)}<small> g</small></b><span>KH</span></div><div><b>${f0(t.f)}<small> g</small></b><span>Fett</span></div></div>`;
  }
  function ingHead(i) {
    const g = KW.ingGrams(i), k = i.per100.kcal != null ? f0(g * i.per100.kcal / 100) + ' kcal' : 'Werte fehlen';
    return (i.qty ? KW.amountText(i) : 'Menge fehlt') + ' · ' + k;
  }
  function editorSheet() {
    const d = ED.draft;
    const head = `<div class="sheet-head"><button class="l" data-act="ed-cancel">Abbrechen</button><h2>${ED.isNew ? 'Neues Rezept' : 'Bearbeiten'}</h2><button class="r" data-act="ed-save">Sichern</button></div>`;
    if (ED.text) {
      return head + `<div class="page-in"><p class="hint">Das ganze Rezept als Text im Import-Format. Ändern und „Übernehmen“ tippen.</p>
        <textarea class="code" id="ed-text" rows="18" spellcheck="false">${esc(KW.recipeToText(cleanDraft(d)))}</textarea>
        ${ED.warn.length ? `<div class="warnbox">${ED.warn.map(esc).join('<br>')}</div>` : ''}
        <div class="btnrow"><button class="btn plain" data-act="ed-form">Zurück zum Formular</button><button class="btn" data-act="ed-parse">Übernehmen</button></div></div>`;
    }
    const sel = (f, list, cur) => `<select data-f="${f}">${list.map(([v, l]) => `<option value="${esc(v)}"${String(v) === String(cur) ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
    let h = `<div class="sheet-top">${head}<div id="esum">${edSum()}</div></div><div class="page-in">
      <div class="field"><label>Name</label><input data-f="name" value="${esc(d.name)}" placeholder="z. B. Chili con Carne"></div>
      <div class="field"><label>Kategorie</label>${sel('cat', KW.CATS.map(c => [c.id, c.icon + ' ' + c.label]), d.cat)}</div>
      <div class="grid3"><div class="field"><label>Portionen</label><input data-f="portions" inputmode="decimal" value="${esc(fNum(d.portions))}"></div>
        <div class="field"><label>Haltbar (Tage)</label><input data-f="keepDays" inputmode="decimal" value="${esc(fNum(d.keepDays))}"></div>
        <div class="field"><label>Zeit (min)</label><input data-f="time" inputmode="numeric" value="${esc(d.time || '')}"></div></div>
      <div class="set"><div class="it"><span>❄️ Einfrierbar</span><label class="switch"><input type="checkbox" data-f="freeze"${d.freeze ? ' checked' : ''}><span></span></label></div>
        <div class="it"><span>🥡 Boxtauglich</span><label class="switch"><input type="checkbox" data-f="box"${d.box ? ' checked' : ''}><span></span></label></div></div>
      <div class="field"><label>Notiz</label><textarea data-f="note" rows="2" placeholder="optional">${esc(d.note)}</textarea></div>
      <h2 class="sec" style="margin-bottom:-4px">Zutaten</h2>`;
    d.ingredients.forEach((i, k) => {
      if (ED.open !== k) {
        h += `<button class="ecard ehead" data-act="ing-open" data-i="${k}"><span class="mid"><span class="t">${esc(i.name || 'Neue Zutat')}</span><span class="s" data-ih="${k}">${esc(ingHead(i))}</span></span><span class="muted">${IC.chev}</span></button>`;
        return;
      }
      const count = !(i.unit === 'g' || i.unit === 'ml');
      h += `<div class="ecard"><div class="inline"><b>Zutat ${k + 1}</b><span style="display:flex;gap:8px"><button class="x red" data-act="ing-del" data-i="${k}" aria-label="Zutat löschen">✕</button><button class="x" data-act="ing-open" data-i="-1" aria-label="Zuklappen">⌃</button></span></div>
        <div class="field"><label>Name</label><input data-f="i.name" data-i="${k}" value="${esc(i.name)}" placeholder="z. B. Hähnchenbrust"></div>
        <div class="grid${count ? '3' : '2'}"><div class="field"><label>Menge</label><input data-f="i.qty" data-i="${k}" inputmode="decimal" value="${esc(fNum(i.qty) || '')}"></div>
          <div class="field"><label>Einheit</label><select data-f="i.unit" data-i="${k}">${UNITS.map(u => `<option${u === i.unit ? ' selected' : ''}>${u}</option>`).join('')}</select></div>
          ${count ? `<div class="field"><label>g pro ${esc(i.unit)}</label><input data-f="i.pieceG" data-i="${k}" inputmode="decimal" value="${esc(fNum(i.pieceG) || '')}"></div>` : ''}</div>
        <div class="grid2"><div class="field"><label>Packung</label><input data-f="i.pack" data-i="${k}" value="${esc(packValue(i))}" placeholder="Packung 500 g"></div>
          <div class="field"><label>Bereich</label><select data-f="i.area" data-i="${k}">${KW.AREAS.map(a => `<option value="${a.id}"${a.id === i.area ? ' selected' : ''}>${esc(a.label)}</option>`).join('')}</select></div></div>
        <p class="hint" data-pk="${k}">${esc(packHint(i))}</p>
        <div class="field"><span class="lbl">Werte pro 100 g</span><div class="grid4">
          ${[['kcal', 'kcal'], ['p', 'Protein'], ['c', 'KH'], ['f', 'Fett']].map(([n, l]) => `<div class="field"><span class="lbl">${l}</span><input data-f="i.${n}" data-i="${k}" inputmode="decimal" value="${esc(fNum(i.per100[n]))}"></div>`).join('')}</div></div></div>`;
    });
    h += `<button class="btn tint" data-act="ing-add">+ Zutat</button><h2 class="sec" style="margin-bottom:-4px">Schritte</h2>`;
    d.steps.forEach((s, k) => {
      h += `<div class="ecard"><div class="inline"><b>Schritt ${k + 1}</b><span style="display:flex;gap:8px">
          ${k ? `<button class="x" data-act="step-up" data-s="${k}" aria-label="Nach oben">↑</button>` : ''}<button class="x red" data-act="step-del" data-s="${k}" aria-label="Schritt löschen">✕</button></span></div>
        <textarea data-f="s.text" data-s="${k}" rows="2" placeholder="Was ist zu tun?">${esc(s.text)}</textarea>
        <div class="grid2"><div class="field"><label>Minuten</label><input data-f="s.min" data-s="${k}" inputmode="decimal" value="${esc(fNum(s.min))}"></div>
          <div class="field"><label>Nebenbei</label><div class="inline" style="min-height:46px"><span class="hint">Andere Sachen gleichzeitig</span><label class="switch"><input type="checkbox" data-f="s.passive" data-s="${k}"${s.passive ? ' checked' : ''}><span></span></label></div></div></div>
        <input data-f="s.tip" data-s="${k}" value="${esc(s.tip)}" placeholder="💡 Spar-Tipp (optional)"></div>`;
    });
    h += `<button class="btn tint" data-act="step-add">+ Schritt</button>
      <button class="btn plain" data-act="ed-textmode">Als Text bearbeiten</button></div>`;
    return h;
  }
  function packHint(i) {
    if (i.pantry) return 'Vorrat: kommt nicht auf die Wocheneinkaufsliste.';
    if (!i.pack) return 'Ohne Packung. Beispiele: „Packung 500 g“, „Dose 400 g“, „Packung 10 Stück“, „Bund“, „Vorrat“.';
    const g = KW.ingGrams(i);
    let need = null;
    if (i.pack.unit === 'Stück' && !(i.unit === 'g' || i.unit === 'ml')) need = i.qty / i.pack.size;
    else if (i.pack.unit !== 'Stück' && g) need = g / i.pack.size;
    return 'Erkannt: ' + KW.packText(i.pack) + (need ? ' · das Rezept braucht ' + fNum(Math.round(need * 100) / 100) + ' Packung' + (need === 1 ? '' : 'en') : '');
  }
  function onEditorInput(el, isChange) {
    const d = ED.draft, f = el.dataset.f;
    const val = el.type === 'checkbox' ? el.checked : el.value;
    if (f.startsWith('i.')) {
      const i = d.ingredients[+el.dataset.i], k = f.slice(2);
      if (k === 'name') i.name = val;
      else if (k === 'qty' || k === 'pieceG') { const n = KW.num(val); i[k] = isFinite(n) ? n : (k === 'qty' ? 0 : null); }
      else if (k === 'unit') { i.unit = val; if (val === 'g' || val === 'ml') i.pieceG = null; else if (!i.pieceG) i.pieceG = ({ EL: 10, TL: 4, Prise: 0.5 })[val] || null; }
      else if (k === 'area') i.area = val;
      else if (k === 'pack') { const p = KW.parsePack(val); i.pack = p.pack; i.pantry = p.pantry; }
      else { const n = KW.num(val); i.per100[k] = isFinite(n) ? n : null; }
      i.g = KW.ingGrams(i);
      const ph = document.querySelector(`[data-pk="${el.dataset.i}"]`); if (ph) ph.textContent = packHint(i);
      if (k === 'unit' && isChange) { refreshSheet(true); return; }
    } else if (f.startsWith('s.')) {
      const s = d.steps[+el.dataset.s], k = f.slice(2);
      if (k === 'min') { const n = KW.num(val); s.min = isFinite(n) && n > 0 ? n : null; }
      else s[k] = val;
    } else if (f === 'portions' || f === 'keepDays') { const n = KW.num(val); d[f] = isFinite(n) && n > 0 ? n : null; }
    else if (f === 'time') { const n = parseInt(val, 10); d.time = n > 0 ? n : null; }
    else d[f] = val;
    const sum = $('#esum'); if (sum) sum.innerHTML = edSum();
  }
  function cleanDraft(d) {
    const r = JSON.parse(JSON.stringify(d));
    r.name = (r.name || '').trim();
    r.ingredients = r.ingredients.filter(i => i.name && i.name.trim()).map(i => Object.assign(i, { name: i.name.trim(), g: KW.ingGrams(i) }));
    r.steps = r.steps.filter(s => s.text && s.text.trim()).map(s => Object.assign(s, { text: s.text.trim(), tip: (s.tip || '').trim() }));
    if (!r.portions) r.portions = 1;
    if (r.keepDays == null) r.keepDays = 3;
    return r;
  }
  function saveEditor() {
    if (ED.text && !parseEditorText()) return;
    const r = cleanDraft(ED.draft);
    if (!r.name) { toast('Bitte einen Namen eingeben'); return; }
    if (!r.ingredients.length) { toast('Mindestens eine Zutat eintragen'); return; }
    const twin = KW.findByName(db, r.name);
    if (twin && twin.id !== r.id) { toast('Es gibt schon ein Rezept mit diesem Namen'); return; }
    if (!r.created) r.created = KW.isoDate();
    KW.put(db, 'recipes', r);
    save();
    closeSheet();
    S.tab = 'rezepte'; S.recipeId = r.id;
    render(!ED.isNew);
    toast(ED.isNew ? 'Rezept angelegt' : 'Gesichert');
    ED = null;
  }
  function parseEditorText() {
    const res = KW.parseRecipes($('#ed-text').value);
    if (res.length !== 1) { ED.warn = [res.length ? 'Bitte nur ein Rezept im Text.' : 'Kein Rezept erkannt.']; refreshSheet(true); return false; }
    if (res[0].errors.length) { ED.warn = res[0].errors; refreshSheet(true); return false; }
    const keep = { id: ED.draft.id, created: ED.draft.created };
    ED.draft = Object.assign(res[0].recipe, keep);
    ED.warn = res[0].warnings;
    return true;
  }

  // ---------- Import ----------
  let IM = null;
  function openImport(text) {
    IM = { text: text || '', res: null, modes: [] };
    openSheet(importSheet, { tall: true, modal: true });
    if (text) checkImport();
  }
  function importSheet() {
    if (!IM.res) {
      return `<div class="sheet-head"><button class="l" data-act="close">Abbrechen</button><h2>Rezepte einfügen</h2><button class="r" data-act="im-check">Prüfen</button></div>
        <div class="page-in"><p class="hint">Im Claude-Chat „Kochwerk“ und ein Gericht schreiben, den Block kopieren und hier einfügen. Mehrere Rezepte auf einmal gehen auch.</p>
        <textarea class="code" id="im-text" rows="14" spellcheck="false" placeholder="=== KOCHWERK REZEPT ===&#10;Name: …">${esc(IM.text)}</textarea>
        <div class="btnrow"><button class="btn plain" data-act="im-paste">Aus Zwischenablage</button><button class="btn plain" data-act="im-sample">Beispiel</button></div>
        <button class="btn" data-act="im-check">Prüfen</button></div>`;
    }
    const ok = IM.res.filter((r, k) => !r.errors.length && IM.modes[k] !== 'skip').length;
    let h = `<div class="sheet-head"><button class="l" data-act="im-back">Zurück</button><h2>Vorschau</h2><span></span></div><div class="page-in">`;
    if (!IM.res.length) h += '<div class="errbox">Kein Rezept gefunden. Der Block beginnt mit „=== KOCHWERK REZEPT ===“ oder mit „Name: …“.</div>';
    IM.res.forEach((res, k) => {
      const r = res.recipe, c = KW.catById(r.cat), t = KW.recipeTotals(r).portion, twin = r.name && KW.findByName(db, r.name);
      h += `<div class="ecard"><div class="ehead wrap"><span class="ico">${c.icon}</span><span class="mid"><span class="t">${esc(r.name || 'Ohne Namen')}</span>
        <span class="s">${esc(c.short)} · ${fNum(r.portions)} Port. · ${r.ingredients.length} Zutaten · ${r.steps.length} Schritte</span></span>
        <span class="right"><b>${f0(t.kcal)} kcal</b><span>${f0(t.p)} g P</span></span></div>`;
      if (res.errors.length) h += `<div class="errbox"><b>Wird nicht übernommen:</b><ul>${res.errors.map(e => '<li>' + esc(e) + '</li>').join('')}</ul></div>`;
      if (res.warnings.length) h += `<div class="warnbox"><b>Bitte prüfen:</b><ul>${res.warnings.map(e => '<li>' + esc(e) + '</li>').join('')}</ul></div>`;
      if (!res.errors.length && twin) {
        h += `<div class="field"><span class="lbl">„${esc(twin.name)}“ gibt es schon</span><div class="seg">${[['replace', 'Ersetzen'], ['new', 'Als neues'], ['skip', 'Überspringen']].map(([v, l]) => `<button data-act="im-mode" data-k="${k}" data-v="${v}" aria-pressed="${IM.modes[k] === v}">${l}</button>`).join('')}</div></div>`;
      }
      h += '</div>';
    });
    h += `<button class="btn" data-act="im-go"${ok ? '' : ' disabled'}>${ok === 1 ? '1 Rezept übernehmen' : ok + ' Rezepte übernehmen'}</button></div>`;
    return h;
  }
  function checkImport() {
    const ta = $('#im-text'); if (ta) IM.text = ta.value;
    IM.res = KW.parseRecipes(IM.text);
    IM.modes = IM.res.map(r => r.errors.length ? 'skip' : (r.recipe.name && KW.findByName(db, r.recipe.name) ? 'replace' : 'new'));
    refreshSheet();
  }
  function doImport() {
    let n = 0, last = null;
    // Gleiche Namen im selben Block nicht gegenseitig ersetzen: der Reihe nach übernehmen
    IM.res.forEach((res, k) => {
      if (res.errors.length || IM.modes[k] === 'skip') return;
      const twin = KW.findByName(db, res.recipe.name);
      last = KW.importRecipe(db, res.recipe, IM.modes[k] === 'replace' && twin ? 'replace' : 'new'); n++;
    });
    save(); closeSheet();
    S.tab = 'rezepte'; S.filter = 'all'; S.q = ''; S.recipeId = n === 1 && last ? last.id : null;
    render();
    toast(n === 1 ? '1 Rezept übernommen' : n + ' Rezepte übernommen');
  }
  async function sampleText() {
    try { const r = await fetch('beispiel-rezept.txt', { cache: 'no-cache' }); if (r.ok) return await r.text(); } catch (e) { /* offline */ }
    return '';
  }

  function formatSheet() {
    return `<div class="sheet-head"><span></span><h2>Import-Format</h2><button class="r" data-act="close">Fertig</button></div>
      <div class="page-in"><p style="margin:0">Rezepte kommen als Text-Block aus dem Claude-Chat (Skill „kochwerk-rezept“). Die App rechnet Kalorien und Protein pro Portion aus den Zutaten.</p>
      <textarea class="code" readonly rows="16">${esc(FORMAT_SHORT)}</textarea>
      <div class="set"><div class="it"><span>Kategorien</span><span class="muted" style="text-align:right;font-size:14px">Hauptmahlzeit, Snack, Hungersnack, Notfall</span></div>
      <div class="it"><span>Bereiche</span><span class="muted" style="text-align:right;font-size:14px">${KW.AREAS.map(a => a.label).join(', ')}</span></div>
      <div class="it"><span>Packung</span><span class="muted" style="text-align:right;font-size:14px">Packung 500 g, Dose 400 g, Packung 10 Stück, Bund, Vorrat</span></div></div>
      <p class="hint">Werte pro 100 g so, wie die Menge angegeben ist (Reis und Nudeln trocken). Zeit in eckigen Klammern, „nebenbei“ wenn man dabei etwas anderes machen kann. Die ganze Beschreibung steht in kochwerk/IMPORT-FORMAT.md.</p>
      <div class="btnrow"><button class="btn plain" data-act="copy-format">Kopieren</button><button class="btn" data-act="sample">Beispiel laden</button></div></div>`;
  }
  const FORMAT_SHORT = `=== KOCHWERK REZEPT ===
Name: Hähnchen-Reis-Pfanne
Kategorie: Hauptmahlzeit
Portionen: 4
Haltbar: 3 Tage
Einfrierbar: ja
Boxtauglich: ja
Zutaten:
- Hähnchenbrust | 1000 g | Packung 500 g | Fleisch | 105 kcal, 23,5 P, 0 K, 1,2 F
- Eier | 4 Stück à 60 g | Packung 10 Stück | Kühlregal | 137 kcal, 12 P, 1 K, 9 F
- Olivenöl | 1 EL à 10 g | Vorrat | Gewürze/Saucen | 884 kcal, 0 P, 0 K, 100 F
Schritte:
1. Wasser im Wasserkocher aufkochen. [3 min nebenbei]
   Tipp: Spart etwa die Hälfte Strom gegenüber dem Herd.
2. Hähnchen würfeln. [5 min]
=== ENDE ===`;

  // ---------- Einrichtung ----------
  let WZ = null;
  const WSTEPS = 7;
  function openSetup() {
    const p = KW.profile(db);
    WZ = { step: 0, p: Object.assign({}, p, { weight: p.weight || '' }) };
    $('#setup').hidden = false;
    document.body.style.overflow = 'hidden';
    renderSetup();
  }
  function closeSetup() { WZ = null; $('#setup').hidden = true; $('#setup').innerHTML = ''; document.body.style.overflow = ''; }
  function wValid() {
    const p = WZ.p, n = k => KW.num(p[k]);
    if (WZ.step === 1) return n('age') >= 12 && n('age') <= 99 && n('height') >= 120 && n('height') <= 230 && n('weight') >= 35 && n('weight') <= 250;
    return true;
  }
  function wTargets(extra) {
    const p = WZ.p;
    return KW.calcTargets(Object.assign({}, p, { age: KW.num(p.age), height: KW.num(p.height), weight: KW.num(p.weight) }, extra || {}));
  }
  function renderSetup() {
    const p = WZ.p, s = WZ.step;
    let title = '', lead = '', body = '', next = 'Weiter';
    if (s === 0) {
      title = 'Willkommen bei Kochwerk';
      lead = 'Abnehmen, ohne Essen zu tracken. Ein paar Fragen, dann rechnet die App dein Ziel aus.';
      body = `<div class="card" style="display:flex;flex-direction:column;gap:16px">
        <div class="feature"><span class="em">🧮</span><div><b>Einmal rechnen statt täglich tracken</b><span>Die Werte stecken im Rezept, nicht in täglichen Eingaben.</span></div></div>
        <div class="feature"><span class="em">🗓️</span><div><b>Nur planen, was du willst</b><span>Meist 1–2 Mahlzeiten pro Tag. Die App zeigt, wie viel Spielraum bleibt.</span></div></div>
        <div class="feature"><span class="em">🥡</span><div><b>Einmal pro Woche vorkochen</b><span>Mit Einkaufsliste in ganzen Packungen und Boxen für die Woche.</span></div></div>
        <div class="feature"><span class="em">⚖️</span><div><b>Einmal pro Woche wiegen</b><span>Die einzige regelmäßige Eingabe.</span></div></div></div>`;
      next = 'Los geht’s';
    } else if (s === 1) {
      title = 'Über dich';
      lead = 'Daraus rechnet die App deinen Verbrauch.';
      body = `<div class="field"><span class="lbl">Geschlecht (für die Formel)</span><div class="seg"><button data-act="wset" data-k="sex" data-v="m" aria-pressed="${p.sex === 'm'}">Mann</button><button data-act="wset" data-k="sex" data-v="w" aria-pressed="${p.sex === 'w'}">Frau</button></div></div>
        <div class="grid3"><div class="field"><label for="w-age">Alter</label><input id="w-age" data-w="age" inputmode="numeric" value="${esc(p.age)}"></div>
        <div class="field"><label for="w-h">Größe (cm)</label><input id="w-h" data-w="height" inputmode="numeric" value="${esc(p.height)}"></div>
        <div class="field"><label for="w-w">Gewicht (kg)</label><input id="w-w" data-w="weight" inputmode="decimal" value="${esc(fNum(KW.num(p.weight)))}" placeholder="z. B. 85"></div></div>`;
    } else if (s === 2) {
      title = 'Wie aktiv bist du?';
      lead = 'Training und Baseball zählen mit. Im Zweifel die niedrigere Stufe nehmen.';
      body = '<div class="opts">' + KW.ACTIVITY.map(a => `<button class="opt" data-act="wset" data-k="activity" data-v="${a.v}" aria-pressed="${+p.activity === a.v}"><span class="chk">${+p.activity === a.v ? '✓' : ''}</span><span class="mid"><span class="t">${esc(a.label)}</span><span class="s">${esc(a.sub)}</span></span></button>`).join('') + '</div>';
    } else if (s === 3) {
      title = 'Wie schnell abnehmen?';
      lead = 'Moderat ist der beste Mittelweg: Fett runter, Muskeln bleiben.';
      body = '<div class="opts">' + KW.TEMPO.map(t => {
        const r = wTargets({ tempo: t.id });
        return `<button class="opt" data-act="wset" data-k="tempo" data-v="${t.id}" aria-pressed="${p.tempo === t.id}"><span class="chk">${p.tempo === t.id ? '✓' : ''}</span><span class="mid"><span class="t">${esc(t.label)}</span><span class="s">${esc(t.sub)}</span></span>
          <span class="right"><b>${r ? f0(r.target) + ' kcal' : ''}</b><span>${r ? '−' + f1(r.kgWeek) + ' kg/Woche' : ''}</span></span></button>`;
      }).join('') + '</div><p class="hint">Grundumsatz nach Mifflin-St Jeor mal Aktivität. Das Defizit ist höchstens 25 % und das Ziel nie unter dem Grundumsatz.</p>';
    } else if (s === 4) {
      const w = KW.num(p.weight);
      title = 'Eiweiß und Mahlzeiten';
      lead = 'Viel Eiweiß hält satt und schützt beim Abnehmen die Muskeln.';
      body = `<div class="field"><span class="lbl">Protein pro Tag</span><div class="stepper"><button data-act="wstep" data-k="protein" data-d="-5" aria-label="weniger">−</button><b>${f0(p.protein)}<small> g</small></b><button data-act="wstep" data-k="protein" data-d="5" aria-label="mehr">+</button></div>
        <p class="hint">Das sind etwa ${f1(p.protein / w)} g pro kg Körpergewicht.</p></div>
        <div class="field"><span class="lbl">Eine normale Mahlzeit hat etwa</span><div class="stepper"><button data-act="wstep" data-k="mealKcal" data-d="-50" aria-label="weniger">−</button><b>${f0(p.mealKcal)}<small> kcal</small></b><button data-act="wstep" data-k="mealKcal" data-d="50" aria-label="mehr">+</button></div>
        <p class="hint">Damit zeigt „Heute“ den Spielraum als Mahlzeiten an, z. B. „noch Platz für etwa 2 normale Mahlzeiten“.</p></div>`;
    } else if (s === 5) {
      title = 'Kochen';
      lead = 'Einmal pro Woche vorkochen. Den Tag kannst du jede Woche ändern.';
      body = `<div class="field"><span class="lbl">Standard-Kochtag</span><div class="days7">${[1, 2, 3, 4, 5, 6, 0].map(d => `<button data-act="wset" data-k="cookDay" data-v="${d}" aria-pressed="${+p.cookDay === d}">${KW.WEEKDAYS[d].slice(0, 2)}</button>`).join('')}</div></div>
        <div class="field"><span class="lbl">Portion deiner Freundin</span><div class="stepper"><button data-act="wstep" data-k="partnerFactor" data-d="-0.1" aria-label="weniger">−</button><b>${f0(p.partnerFactor * 100)}<small> %</small></b><button data-act="wstep" data-k="partnerFactor" data-d="0.1" aria-label="mehr">+</button></div>
        <p class="hint">Im Vergleich zu deiner Portion. Isst sie mit, kommt ihre Portion auf die Einkaufsliste, zählt aber nicht zu deinem Spielraum.</p></div>`;
    } else {
      const t = wTargets();
      title = 'Dein Ziel';
      lead = 'Alles lässt sich später unter „Mehr“ ändern.';
      body = `<div class="card hero"><span class="lbl">Pro Tag</span><div class="big num">${f0(t.target)}<small> kcal</small></div>
        <p class="hint">Verbrauch etwa ${f0(t.tdee)} kcal, Defizit ${f0(t.deficit)} kcal, damit etwa ${f1(t.kgWeek)} kg weniger pro Woche.</p>
        <div class="tiles t3" style="margin-top:6px"><div class="p"><b>${f0(p.protein)}<small> g</small></b><span>Protein</span></div><div><b>${f1(t.target / p.mealKcal)}</b><span>normale Mahlz.</span></div><div><b>${esc(KW.WEEKDAYS[p.cookDay].slice(0, 2))}</b><span>Kochtag</span></div></div></div>`;
      next = 'Fertig';
    }
    const canClose = KW.getSetting(db, 'setupDone');
    $('#setup').innerHTML = `<div class="in"><div class="bar">${s ? `<button class="back" data-act="wback">${IC.back}Zurück</button>` : ''}<div class="dots">${Array.from({ length: WSTEPS }, (_, k) => `<i class="${k <= s ? 'on' : ''}"></i>`).join('')}</div>${canClose ? '<button class="x" data-act="wclose" aria-label="Schließen">✕</button>' : ''}</div>
      <h1>${esc(title)}</h1><p class="lead">${esc(lead)}</p>${body}<div class="grow"></div>
      <button class="btn" id="wnext" data-act="wnext"${wValid() ? '' : ' disabled'}>${esc(next)}</button></div>`;
    $('#setup').scrollTop = 0;
  }
  function finishSetup() {
    const p = WZ.p;
    for (const k of ['sex', 'activity', 'tempo', 'protein', 'mealKcal', 'cookDay', 'partnerFactor']) {
      if (KW.getSetting(db, k) !== p[k] || !db.settings[k]) KW.setSetting(db, k, p[k]);
    }
    KW.setSetting(db, 'age', KW.num(p.age));
    KW.setSetting(db, 'height', KW.num(p.height));
    const w = KW.num(p.weight), cur = KW.latestWeight(db);
    if (!cur || cur.kg !== Math.round(w * 10) / 10) KW.setWeight(db, w);
    KW.setSetting(db, 'setupDone', true);
    save(); closeSetup();
    S.tab = 'heute'; render(); askRating();
  }

  // ---------- Ereignisse ----------
  const ACT = {
    tab: b => { const t = b.dataset.tab; if (t === S.tab && t === 'rezepte') S.recipeId = null; S.tab = t; render(); },
    open: b => { S.recipeId = b.dataset.id; render(); },
    back: () => { S.recipeId = null; render(); },
    filter: b => { S.filter = b.dataset.f; render(true); },
    import: () => openImport(),
    sample: async () => {
      const t = await sampleText();
      if (!t) { toast('Beispiel nur mit Netz ladbar'); return; }
      closeSheet(); openImport(t);
    },
    new: () => openEditor(null),
    edit: b => openEditor(b.dataset.id),
    share: b => { const r = getRecipe(b.dataset.id); if (r) shareText(r.name, KW.recipeToText(r)); },
    del: b => {
      const r = getRecipe(b.dataset.id); if (!r) return;
      confirmSheet('Rezept löschen?', '„' + r.name + '“ wird aus dem Rezeptbuch entfernt.', 'Löschen', () => {
        KW.remove(db, 'recipes', r.id); save(); closeSheet(); S.recipeId = null; render(); toast('Gelöscht');
      });
    },
    'cfm-ok': () => { const f = CFM; CFM = null; if (f) f(); },
    close: () => closeSheet(),
    rate: b => openRate(b.dataset.id),
    rv: b => { RT[b.dataset.k] = +b.dataset.v; refreshSheet(true); },
    'rate-save': () => {
      KW.put(db, 'ratings', { id: RT.planId ? 'r' + RT.planId : null, recipeId: RT.id, date: KW.isoDate(), satt: RT.satt, lecker: RT.lecker });
      save(); closeSheet(); render(true); toast('Danke, gespeichert');
    },
    'rate-skip': () => { KW.put(db, 'ratings', { id: 'r' + RT.planId, recipeId: RT.id, date: KW.isoDate(), skip: true }); save(); closeSheet(); },
    // Tagesplan
    'meal-on': b => { P.setMeal(db, b.dataset.date, b.dataset.meal, true); save(); render(true); openPicker({ entryId: P.mainId(b.dataset.date, b.dataset.meal) }); },
    'meal-toggle': b => { const on = b.getAttribute('aria-pressed') !== 'true'; const id = P.mainId(b.dataset.date, b.dataset.meal); const e = db.plan[id];
      if (!on && e && !e.del && P.recipeOf(db, e)) { confirmSheet('Mahlzeit abwählen?', P.recipeOf(db, e).name + ' wird aus dem Plan genommen.', 'Abwählen', () => { P.setMeal(db, b.dataset.date, b.dataset.meal, false); save(); closeSheet(); render(true); }); return; }
      P.setMeal(db, b.dataset.date, b.dataset.meal, on); save(); render(true); },
    slot: b => openSlot(b.dataset.id),
    'slot-back': () => { SH.fn = slotSheet; refreshSheet(); },
    'slot-del': () => { const e = db.plan[SL.id]; if (e) KW.remove(db, 'plan', e.id); save(); closeSheet(); render(true); },
    'slot-suggest': () => {
      const e = db.plan[SL.id], best = KW.live(db, 'recipes').filter(r => r.cat === 'main' && (e.meal !== 'box' || r.box)).map(r => ({ r, s: P.score(db, r) })).filter(x => x.s > -Infinity).sort((a, b) => b.s - a.s)[0];
      if (!best) { toast('Noch keine passende Hauptmahlzeit'); return; }
      P.update(db, e.id, { recipeId: best.r.id }); save(); refreshSheet(); render(true);
    },
    pick: () => { const id = SL.id; closeSheet(); openPicker({ entryId: id }); },
    'pick-r': b => pickRecipe(b.dataset.id),
    'pk-all': b => { PK.all = b.dataset.v === '1'; refreshSheet(true); },
    'snack-new': b => openPicker({ date: b.dataset.date, gap: defaultGap(b.dataset.date) }),
    swap: () => { SH.fn = swapSheet; refreshSheet(); },
    'swap-r': b => { P.update(db, SL.id, { recipeId: b.dataset.id }); save(); closeSheet(); render(true); toast('Getauscht'); },
    view: b => { closeSheet(); S.tab = 'rezepte'; S.recipeId = b.dataset.id; render(); },
    // Woche
    week: b => { S.week = P.addDays(S.week || defaultWeek(), +b.dataset.d); render(); },
    weight: () => openWeight(null),
    'weight-save': () => {
      const kg = KW.num($('#wg-kg').value);
      if (!(kg >= 35 && kg <= 250)) { toast('Bitte ein Gewicht eingeben'); return; }
      KW.setWeight(db, kg); save(); const cont = WG.cont; closeSheet(); render(true);
      if (cont === 'suggest') runSuggest(); else toast('Gewicht gespeichert');
    },
    suggest: () => { if (!recentWeight() && S.week >= P.weekStart(today())) { openWeight('suggest'); return; } runSuggest(); },
    favs: () => openSheet(favSheet),
    'fav-save': () => { const n = ($('#fav-name').value || '').trim() || 'Woche KW ' + P.isoWeek(S.week); P.saveFavWeek(db, S.week, n); save(); refreshSheet(); toast('Als Lieblingswoche gespeichert'); },
    'fav-apply': b => {
      const f = db.favweeks[b.dataset.id]; if (!f) return;
      const go = () => { const r = P.applyFavWeek(db, f, S.week); save(); closeSheet(); render(true); toast(r.missing ? r.missing + ' Rezepte fehlen inzwischen, Plätze sind leer' : '„' + f.name + '“ eingeplant'); };
      if (P.weekEntries(db, S.week).length) confirmSheet('Woche ersetzen?', 'Der Plan dieser Woche wird durch „' + f.name + '“ ersetzt.', 'Ersetzen', go); else go();
    },
    'fav-del': b => { KW.remove(db, 'favweeks', b.dataset.id); save(); refreshSheet(); },
    'week-clear': () => confirmSheet('Woche leeren?', 'Alle Mahlzeiten dieser Woche werden aus dem Plan genommen.', 'Leeren', () => { for (const e of P.weekEntries(db, S.week)) KW.remove(db, 'plan', e.id); save(); closeSheet(); render(true); }),
    'stall-ack': () => { const st = P.stall(db, today()); if (st) KW.setSetting(db, 'stallAck', st.last.id); save(); render(true); },
    lighten: () => { LT = { list: P.lightenPreview(db, S.week).map(x => Object.assign(x, { on: true })) }; openSheet(lightenSheet); },
    'lt-toggle': b => { const x = LT.list[+b.dataset.k]; x.on = !x.on; refreshSheet(true); },
    'lighten-ok': () => {
      let n = 0; for (const x of LT.list) if (x.on) { KW.put(db, 'recipes', Object.assign(x.next, { lightened: KW.isoDate() })); n++; }
      ACT['stall-ack'](); closeSheet(); toast(n === 1 ? '1 Rezept leichter gemacht' : n + ' Rezepte leichter gemacht');
    },
    moremeal: () => { MM = { meal: 'breakfast', days: new Set() }; openSheet(moreSheet); },
    'mm-meal': b => { MM.meal = b.dataset.v; MM.days = new Set(); refreshSheet(true); },
    'mm-day': b => { const d = b.dataset.v; MM.days.has(d) ? MM.days.delete(d) : MM.days.add(d); refreshSheet(true); },
    'more-ok': () => { for (const d of MM.days) P.setMeal(db, d, MM.meal, true); ACT['stall-ack'](); closeSheet(); runSuggest(); },
    showbad: () => { S.tab = 'rezepte'; S.recipeId = null; S.filter = 'bad'; render(); },
    format: () => openSheet(formatSheet),
    'copy-format': async () => { try { await navigator.clipboard.writeText(FORMAT_SHORT); toast('Kopiert'); } catch (e) { toast('Kopieren nicht möglich'); } },
    setv: b => { const k = b.dataset.k; KW.setSetting(db, k, b.dataset.v); save(); render(true); },
    theme: b => { ui.theme = b.dataset.v; saveUi(); applyTheme(); render(true); },
    setup: () => openSetup(),
    // Import
    'im-check': () => checkImport(),
    'im-back': () => { IM.res = null; refreshSheet(); },
    'im-mode': b => { IM.modes[+b.dataset.k] = b.dataset.v; refreshSheet(true); },
    'im-go': () => doImport(),
    'im-paste': async () => {
      try { const t = await navigator.clipboard.readText(); if (t) { IM.text = t; refreshSheet(); } else toast('Zwischenablage ist leer'); }
      catch (e) { toast('Bitte lange ins Feld tippen und „Einsetzen“ wählen'); }
    },
    'im-sample': async () => { const t = await sampleText(); if (t) { IM.text = t; refreshSheet(); } else toast('Beispiel nur mit Netz ladbar'); },
    // Editor
    'ed-cancel': () => { closeSheet(); ED = null; },
    'ed-save': () => saveEditor(),
    'ing-open': b => { ED.open = +b.dataset.i; refreshSheet(true); },
    'ing-add': () => { ED.draft.ingredients.push(blankIng()); ED.open = ED.draft.ingredients.length - 1; refreshSheet(true); },
    'ing-del': b => { ED.draft.ingredients.splice(+b.dataset.i, 1); ED.open = -1; refreshSheet(true); },
    'step-add': () => { ED.draft.steps.push({ text: '', min: null, passive: false, tip: '' }); refreshSheet(true); },
    'step-del': b => { ED.draft.steps.splice(+b.dataset.s, 1); refreshSheet(true); },
    'step-up': b => { const k = +b.dataset.s, s = ED.draft.steps; [s[k - 1], s[k]] = [s[k], s[k - 1]]; refreshSheet(true); },
    'ed-textmode': () => { ED.text = true; ED.warn = []; refreshSheet(); },
    'ed-form': () => { ED.text = false; ED.warn = []; refreshSheet(); },
    'ed-parse': () => { if (parseEditorText()) { ED.text = false; refreshSheet(); toast(ED.warn.length ? 'Übernommen, bitte Hinweise prüfen' : 'Übernommen'); } },
    // Einrichtung
    wnext: () => { if (!wValid()) return; if (WZ.step >= WSTEPS - 1) finishSetup(); else { WZ.step++; renderSetup(); } },
    wback: () => { WZ.step = Math.max(0, WZ.step - 1); renderSetup(); },
    wclose: () => closeSetup(),
    wset: b => { const k = b.dataset.k, v = b.dataset.v; WZ.p[k] = (k === 'sex' || k === 'tempo') ? v : +v; renderSetup(); },
    wstep: b => {
      const k = b.dataset.k, lim = { protein: [60, 300], mealKcal: [200, 1200], partnerFactor: [0.3, 1.5] }[k];
      WZ.p[k] = Math.min(lim[1], Math.max(lim[0], Math.round((+WZ.p[k] + +b.dataset.d) * 10) / 10));
      renderSetup();
    }
  };
  document.addEventListener('click', e => {
    const tab = e.target.closest('.tabbar button');
    if (tab) { ACT.tab(tab); return; }
    const b = e.target.closest('[data-act]');
    if (!b || b.disabled) return;
    const f = ACT[b.dataset.act];
    if (f) { e.preventDefault(); f(b); }
  });
  document.addEventListener('input', e => {
    const el = e.target;
    if (el.id === 'pq' && PK) { PK.q = el.value; const meal = PK.entryId ? db.plan[PK.entryId].meal : 'snack'; $('#pklist').innerHTML = pickList(PK.all ? KW.CATS.map(c => c.id) : P.catsFor(meal), meal); return; }
    if (el.id === 'q') { S.q = el.value; const l = $('#rlist'); if (l) l.innerHTML = recipeList(); return; }
    if (el.id === 'im-text' && IM) { IM.text = el.value; return; }
    if (el.dataset.w && WZ) { WZ.p[el.dataset.w] = el.value; const n = $('#wnext'); if (n) n.disabled = !wValid(); return; }
    if (el.dataset.f && ED && el.closest('#sheet')) onEditorInput(el, false);
  });
  document.addEventListener('change', e => {
    const el = e.target;
    if (el.dataset.set) { onSetting(el); return; }
    if (el.dataset.partner) { P.update(db, el.dataset.partner, { partner: el.checked }); save(); render(true); return; }
    if (el.id === 'pk-gap' && PK) { PK.gap = +el.value; return; }
    if (el.dataset.f && ED && el.closest('#sheet') && (el.tagName === 'SELECT' || el.type === 'checkbox')) onEditorInput(el, true);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && SH && !SH.modal) closeSheet();
    if (e.key === 'Enter' && e.target.dataset && e.target.dataset.set) e.target.blur();
  });

  // ---------- Start ----------
  applyTheme();
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { /* egal */ }
  S.tab = 'heute';
  render();
  if (!KW.getSetting(db, 'setupDone')) openSetup(); else askRating();
  // Zurück in die App (z. B. am nächsten Tag): Heute neu zeichnen und einmal nach dem letzten Gericht fragen
  let lastDay = today();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    if (lastDay !== today()) { lastDay = today(); if (!SH && !WZ) { S.tab = 'heute'; S.week = null; render(); } }
    askRating();
  });
  // Für Tests im Browser
  window.KochwerkApp = { get db() { return db; }, reload() { db = load(); render(); } };
})();
