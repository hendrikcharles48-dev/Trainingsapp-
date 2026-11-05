// Kochwerk – Oberfläche. Daten liegen in localStorage unter „kochwerk_data“ (nur Präfix kochwerk_).
(function () {
  'use strict';
  const KW = window.KW;
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const KEY = 'kochwerk_data', KEY_UI = 'kochwerk_ui', KEY_DEV = 'kochwerk_device';
  const VERSION = '1.7';

  // ---------- Speicher ----------
  function load() {
    try { return KW.upgrade(JSON.parse(localStorage.getItem(KEY) || 'null')); } catch (e) { return KW.emptyDb(); }
  }
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); return true; } catch (e) { toast('Speichern nicht möglich'); return false; }
  }
  // Speichern und kurz danach mit dem anderen Gerät abgleichen
  function save() { if (persist()) scheduleSync(); }
  function loadUi() { try { return Object.assign({ theme: 'auto' }, JSON.parse(localStorage.getItem(KEY_UI) || '{}')); } catch (e) { return { theme: 'auto' }; } }
  function saveUi() { try { localStorage.setItem(KEY_UI, JSON.stringify(ui)); } catch (e) { /* egal */ } }
  try { if (!localStorage.getItem(KEY_DEV)) localStorage.setItem(KEY_DEV, KW.uid()); } catch (e) { /* ohne Speicher */ }

  let db = load();
  const ui = loadUi();
  const S = { tab: 'heute', recipeId: null, filter: 'all', q: '', week: null, shopWeek: null, shopTab: 'week' };

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
    if (S.tab === 'einkauf') { S.tab = 'woche'; S.weekView = 'shop'; }
    const pages = { heute: pageHeute, tagebuch: pageTagebuch, woche: pageWoche, rezepte: pageRezepte, mehr: pageMehr };
    v.innerHTML = '<div class="page">' + pages[S.tab]() + '</div>';
    document.querySelectorAll('.tabbar button').forEach(b => b.setAttribute('aria-current', b.dataset.tab === S.tab ? 'page' : 'false'));
    window.scrollTo(0, keepScroll ? y : 0);
    navTitle();
  }
  // Kompakte Titelleiste wie bei iOS, sobald der große Titel weggescrollt ist
  function navTitle() {
    const nb = $('#navbar'), h1 = document.querySelector('#view .top h1');
    if (!nb) return;
    nb.querySelector('span').textContent = h1 ? h1.textContent : '';
    nb.classList.toggle('show', !!h1 && window.scrollY > h1.offsetTop + h1.offsetHeight - 8);
  }
  addEventListener('scroll', navTitle, { passive: true });

  // ---------- Heute ----------
  const P = KW.P;
  const today = () => KW.isoDate();
  // Zwei Ringe wie bei iOS: außen Kalorien, innen Eiweiß
  function ringSvg(kp, pp, over) {
    const R1 = 50, R2 = 36, c1 = 2 * Math.PI * R1, c2 = 2 * Math.PI * R2;
    const a = Math.max(0, Math.min(1, kp)), b = Math.max(0, Math.min(1, pp));
    return `<svg class="rings" viewBox="0 0 120 120" aria-hidden="true">
      <circle cx="60" cy="60" r="${R1}" class="rt k"/><circle cx="60" cy="60" r="${R2}" class="rt p"/>
      ${a > 0.005 ? `<circle cx="60" cy="60" r="${R1}" class="rv k${over ? ' over' : ''}" stroke-dasharray="${(a * c1).toFixed(1)} ${c1.toFixed(1)}"/>` : ''}
      ${b > 0.005 ? `<circle cx="60" cy="60" r="${R2}" class="rv p" stroke-dasharray="${(b * c2).toFixed(1)} ${c2.toFixed(1)}"/>` : ''}</svg>`;
  }
  function roomCard(date, big) {
    const rm = P.room(db, date), over = rm.rest < -50;
    return `<div class="card hero2${over ? ' over' : ''}"><div class="ring-wrap">${ringSvg(rm.used / (rm.target || 1), rm.pUsed / (rm.protein || 1), over)}
      <div class="ring-in"><b class="num${Math.abs(rm.rest) >= 995 ? ' long' : ''}">${f0(Math.abs(Math.round(rm.rest / 10) * 10))}</b><span>${rm.rest >= 0 ? 'kcal frei' : 'kcal drüber'}</span></div></div>
      <div class="hero-txt"><span class="lbl">${big ? 'Spielraum heute' : 'Spielraum'}</span><div class="room-big">${esc(rm.text)}</div>
      <div class="legend2"><span><i class="lg k"></i><b class="num">${f0(rm.used)}</b> / ${f0(rm.target)} kcal</span><span><i class="lg p"></i><b class="num">${f0(rm.pUsed)}</b> / ${f0(rm.protein)} g Eiweiß</span></div></div></div>`;
  }
  function entryRow(e, date) {
    const r = P.recipeOf(db, e), m = P.mealById(e.meal), t = r ? P.portionOf(r) : null;
    const lab = e.meal === 'snack' ? 'Snack' : m.label;
    const sub = lab + (e.partner ? ' · 👫 mit Freundin' : '');
    if (!r) {
      return `<button class="row" data-act="slot" data-id="${e.id}"><span class="ico m-${e.meal}">${m.icon}</span><span class="mid"><span class="t muted">${e.recipeId ? 'Rezept gelöscht' : 'Noch kein Rezept'}</span><span class="s">${esc(sub)}</span></span><span class="add">Wählen</span></button>`;
    }
    const ov = db.log && db.log['lp' + e.id], fac = ov && !ov.del && ov.factor != null ? ov.factor : 1;
    const sub2 = sub + (fac === 0 ? ' · nicht gegessen' : fac !== 1 ? ' · ' + fNum(fac) + ' Portion' : '');
    return `<button class="row${fac === 0 ? ' tb off' : ''}" data-act="slot" data-id="${e.id}"><span class="ico m-${e.meal}">${m.icon}</span><span class="mid"><span class="t">${esc(r.name)}</span><span class="s">${esc(sub2)}</span></span><span class="right"><b>${fac === 0 ? '–' : f0(t.kcal * fac) + ' kcal'}</b><span>${fac === 0 ? '' : f0(t.p * fac) + ' g P'}</span></span></button>`;
  }
  function dayList(date, withOff) {
    const es = P.entries(db, date);
    let rows = '';
    let k = 0;
    for (const m of P.MEALS) {
      while (k < es.length && es[k].pos < m.pos) { if (es[k].meal === 'snack') rows += entryRow(es[k], date); k++; }
      const e = es.find(x => x.meal === m.id);
      if (e) rows += entryRow(e, date);
      else if (withOff) withOff.push(m);
    }
    for (; k < es.length; k++) if (es[k].meal === 'snack' && es[k].pos > 40) rows += entryRow(es[k], date);
    return rows;
  }
  // Heute: pro Mahlzeit das geplante Rezept und alles einzeln Eingetragene
  function trackRow(e) {
    const v = T.nutr(e.per100, e.grams);
    return `<button class="row tb" data-act="tb-item" data-id="${e.id}"><span class="mid"><span class="t">${esc(e.name)}${e.brand ? ' <span class="muted" style="font-weight:500">· ' + esc(e.brand) + '</span>' : ''}</span>
      <span class="s">${esc(e.portion ? e.portion + ' (' + Math.round(e.grams) + ' g)' : Math.round(e.grams) + ' g')} · eingetragen</span></span><span class="right"><b>${f0(v.kcal)} kcal</b><span>${fv(v.p)} g P</span></span></button>`;
  }
  // Geplante Mahlzeit in der Mahlzeit-Karte: ohne eigenes Symbol, mit Hinweis „geplant“
  function planRow(e) {
    const r = P.recipeOf(db, e);
    if (!r) return `<button class="row tb" data-act="slot" data-id="${e.id}"><span class="mid"><span class="t muted">${e.recipeId ? 'Rezept gelöscht' : 'Noch kein Rezept'}</span><span class="s">geplant${e.meal === 'snack' ? ' · Snack' : ''}</span></span><span class="add">Wählen</span></button>`;
    const t = P.portionOf(r), ov = db.log && db.log['lp' + e.id], fac = ov && !ov.del && ov.factor != null ? ov.factor : 1;
    const sub = (fac === 0 ? 'nicht gegessen' : fac !== 1 ? fNum(fac) + ' Portion' : '1 Portion') + ' · geplant' + (e.partner ? ' · 👫' : '');
    return `<button class="row tb${fac === 0 ? ' off' : ''}" data-act="slot" data-id="${e.id}"><span class="mid"><span class="t">🍲 ${esc(r.name)}</span><span class="s">${esc(sub)}</span></span>
      <span class="right"><b>${fac === 0 ? '–' : f0(t.kcal * fac) + ' kcal'}</b><span>${fac === 0 ? '' : f0(t.p * fac) + ' g P'}</span></span></button>`;
  }
  function todayMeals(d) {
    const plan = P.entries(db, d), logs = KW.live(db, 'log').filter(e => e.date === d && !e.planId);
    let h = `<div class="sect"><h2 class="sec">Mahlzeiten</h2><span class="sect-r">${f0(P.room(db, d).used)} kcal</span></div>`;
    for (const m of T.MEALS) {
      const pe = plan.filter(e => T.mealOfPlan(e.meal) === m.id), le = logs.filter(e => e.meal === m.id);
      if (!pe.length && !le.length) {
        h += `<button class="card mealempty" data-act="meal-add" data-meal="${m.id}"><span class="ico sm m-${m.id}">${m.icon}</span><span class="t">${esc(m.label === 'Box' ? 'Box in der Schule' : m.label)}</span><span class="add">＋</span></button>`;
        continue;
      }
      const kc = T.dayItems(db, d).filter(i => i.meal === m.id && !(i.plan && !i.eaten)).reduce((s, i) => s + (T.nutr(i.per100, i.grams).kcal || 0), 0);
      h += `<div class="list mealcard"><div class="mealhead"><span class="ico sm m-${m.id}">${m.icon}</span><b>${esc(m.label === 'Box' ? 'Box in der Schule' : m.label)}</b><span class="sect-r">${f0(kc)} kcal</span>
        <button class="mh-add" data-act="meal-add" data-meal="${m.id}" aria-label="${esc(m.label)} ergänzen">＋</button></div>`;
      h += pe.map(e => planRow(e, d)).join('') + le.map(trackRow).join('') + '</div>';
    }
    return h;
  }
  // „＋“ bei einer Mahlzeit: Rezept einplanen oder einzelne Lebensmittel eintragen
  let MC = null;
  function mealChoiceSheet() {
    const m = T.MEALS.find(x => x.id === MC.meal), planned = MC.meal !== 'snack' && P.entries(db, MC.date).some(e => e.meal === MC.meal);
    return `<div class="sheet-head"><span></span><h2>${esc(m.label === 'Box' ? 'Box in der Schule' : m.label)}</h2><button class="r" data-act="close">Abbrechen</button></div>
      <div class="opts"><button class="opt" data-act="mc-track"><span class="qi" style="--c:var(--blue)">📒</span><span class="mid"><span class="t">Lebensmittel eintragen</span><span class="s">Einzeln, z. B. 2 Brötchen, Käse und Kaffee – mit Suche, Barcode und Favoriten</span></span></button>
      <button class="opt" data-act="mc-plan"><span class="qi" style="--c:var(--accent)">🍲</span><span class="mid"><span class="t">Rezept einplanen</span><span class="s">${planned ? 'Für diese Mahlzeit ist schon ein Rezept geplant – antippen zum Tauschen' : 'Eine Portion aus deinem Rezeptbuch'}</span></span></button></div>`;
  }
  function pageHeute() {
    const d = today(), n = recipes().length;
    let h = `<div class="top"><div><div class="eyebrow">${esc(todayLabel())}</div><h1>Heute</h1></div></div>`;
    for (const t of CO.thawHints(db, d)) {
      h += t.when === 'evening'
        ? `<div class="card thaw"><span class="em">❄️</span><div class="mid"><b>Heute Abend auftauen</b><span>„${esc(t.name)}“ für morgen (${esc(P.dayLabel(t.date))} · ${esc(t.meal === 'snack' ? 'Snack' : P.mealById(t.meal).short)}) aus dem Gefrierfach in den Kühlschrank.</span></div><button class="btn tint small" data-act="thaw-done" data-id="${t.id}">Erledigt</button></div>`
        : `<div class="card thaw today"><span class="em">⏱️</span><div class="mid"><b>Noch im Gefrierfach?</b><span>„${esc(t.name)}“ ist für heute geplant. Sonst in der Mikrowelle auftauen.</span></div><button class="btn tint small" data-act="thaw-done" data-id="${t.id}">Ist raus</button></div>`;
    }
    if (PAKET) h += `<button class="card cookcard" data-act="paket"><span class="em">📦</span><span class="mid"><b>${PAKET.list.length} ${PAKET.list.length === 1 ? 'Rezept' : 'Rezepte'} aus dem Chat</b><span>Antippen, ansehen und übernehmen</span></span><span class="add">›</span></button>`;
    const ckOld = ckLoad();
    if (ckOld && ckOld.phase === 'run') h += `<button class="card cookcard" data-act="cook" data-week="${ckOld.week}"><span class="em">🍳</span><span class="mid"><b>Kochsession fortsetzen</b><span>KW ${P.isoWeek(ckOld.week)}</span></span><span class="add">›</span></button>`;
    else for (const wk of [P.weekStart(d), P.addDays(P.weekStart(d), 7)]) {
      if (P.cookDate(db, wk) === d && !CO.cookedOf(db, wk) && SH3.weekPots(db, wk).length) h += `<button class="card cookcard" data-act="cook" data-week="${wk}"><span class="em">🍳</span><span class="mid"><b>Heute ist Kochtag</b><span>${SH3.weekPots(db, wk).length} Rezepte für KW ${P.isoWeek(wk)} · Kochsession starten</span></span><span class="add">›</span></button>`;
    }
    h += roomCard(d, true);
    h += `<div class="quick3"><button data-act="hunger"><span class="qi" style="--c:var(--accent)">🍏</span>Ich hab Hunger</button><button data-act="crash"><span class="qi" style="--c:var(--orange)">💥</span>Plan geplatzt</button><button data-act="tb-quick"><span class="qi" style="--c:var(--blue)">📒</span>Eintragen</button></div>`;
    h += todayMeals(d);
    if (!n) {
      h += `<div class="card empty"><span class="em">📖</span><div><b>Noch keine Rezepte</b>Rezepte als Block aus dem Chat einfügen oder das Beispiel laden.</div>
        <div class="btns" style="width:100%"><button class="btn" data-act="import">Rezepte einfügen</button><button class="btn plain" data-act="sample">Beispiel laden</button></div></div>`;
    }
    h += `<p class="hint" style="text-align:center">Geplantes zählt automatisch als gegessen. Mit ＋ trägst du bei jeder Mahlzeit einzelne Lebensmittel ein. Die Portion deiner Freundin zählt nicht mit.</p>`;
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
  function weekSeg() {
    return `<div class="seg big">${[['plan', '🗓️ Plan'], ['shop', '🛒 Einkauf']].map(([v, l]) => `<button data-act="week-view" data-v="${v}" aria-pressed="${(S.weekView || 'plan') === v}">${l}</button>`).join('')}</div>`;
  }
  // Kurzform für die Tageskarten: „≈ 2½ Mahlzeiten frei“
  function shortRoom(rm) {
    if (rm.rest < -50) return f0(-rm.rest) + ' kcal über dem Ziel';
    if (rm.rest < 100) return 'Tagesziel erreicht';
    return rm.meals >= 0.5 ? '≈ ' + P.half(rm.meals) + (rm.meals === 1 ? ' Mahlzeit' : ' Mahlzeiten') + ' frei' : 'Platz für einen Snack';
  }
  function pageWoche() {
    if (S.weekView === 'shop') return pageEinkauf();
    if (!S.week) S.week = defaultWeek();
    const start = S.week, days = P.weekDays(start), end = days[6];
    const range = Number(start.slice(8)) + '.' + (start.slice(5, 7) !== end.slice(5, 7) ? Number(start.slice(5, 7)) + '.' : '') + '–' + Number(end.slice(8)) + '.' + Number(end.slice(5, 7)) + '.';
    let h = `<div class="top"><div><div class="eyebrow">KW ${P.isoWeek(start)} · ${range}</div><h1>Woche</h1></div><div class="acts">
      <button class="circle" data-act="week" data-d="-7" aria-label="Woche zurück">‹</button><button class="circle" data-act="week" data-d="7" aria-label="Woche vor">›</button></div></div>` + weekSeg();
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
      <div class="pills"><button class="pill-btn${empty ? ' pri' : ''}" data-act="suggest"${empty ? '' : ' disabled'}>✨ Vorschlagen</button><button class="pill-btn" data-act="favs">★ Favoriten</button></div></div>`;
    const ck = CO.cookedOf(db, start), cdt = P.cookDate(db, start);
    h += `<div class="card plan2"><div class="inline"><span class="step-n${ck ? ' done' : ''}">${ck ? '✓' : '3'}</span><span class="mid" style="flex:1"><span class="t">Kochen & Boxen</span><span class="s">${ck ? 'Gekocht am ' + esc(P.dayLabel(ck.date)) : 'Kochtag ' + esc(P.dayLabel(cdt)) + ' · einmal vorkochen für die Woche'}</span></span></div>
      <div class="pills"><button class="pill-btn${ck || !es.length ? '' : ' pri'}" data-act="cook" data-week="${start}"${es.length ? '' : ' disabled'}>🍳 Kochsession</button><button class="pill-btn" data-act="boxes"${es.length ? '' : ' disabled'}>🥡 Boxen</button></div></div>`;
    for (const d of days) {
      const t = P.dayTotals(db, d), isToday = d === today(), rm = P.room(db, d);
      const on = new Set(P.entries(db, d).map(e => e.meal));
      h += `<div class="daycard${isToday ? ' today' : ''}"><div class="dayhead"><span class="dnum${isToday ? ' on' : ''}"><small>${P.DAY_SHORT[P.wd(d)]}</small>${Number(d.slice(8))}</span><b>${isToday ? 'Heute' : esc(P.DAY_LONG[P.wd(d)])}</b>
        <span class="dsum">${t.n ? f0(t.kcal) + ' kcal · <span class="pc">' + f0(t.p) + ' g P</span>' : ''}</span></div>
        <div class="mealchips">${P.MEALS.map(m => `<button class="mchip" data-act="meal-toggle" data-date="${d}" data-meal="${m.id}" aria-pressed="${on.has(m.id)}">${m.icon} ${esc(m.short)}</button>`).join('')}</div>`;
      const rows = dayList(d, false);
      if (rows) h += `<div class="list inner">${rows}</div>`;
      h += `<div class="dayfoot"><span class="hint">${on.size ? esc(shortRoom(rm)) : 'Nichts geplant'}</span><button class="link" data-act="snack-new" data-date="${d}">＋ Snack</button></div></div>`;
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

  // ---------- Einkauf ----------
  const SH3 = KW.S;
  const amt = (n, unit, cu) => SH3.amountText(n, unit, cu);
  function packLine(it) {
    if (it.pack && it.packs != null) return (it.packs > 1 ? it.packs + ' × ' : '') + it.pack.label;
    return it.need != null ? amt(it.need, it.unit, it.cntUnit) : '1 ×';
  }
  function shopRow(it, week) {
    const bits = [];
    if (it.need != null && it.pack) bits.push('braucht ' + amt(it.need, it.unit, it.cntUnit));
    if (it.rest) bits.push(amt(it.rest, it.unit) + ' aus Resten');
    if (it.fromPantry) bits.push('Grundvorrat');
    if (it.lateHint && !it.later) bits.push('erst ab ' + P.DAY_SHORT[P.wd(it.first)] + ' gebraucht');
    return `<div class="srow${it.done ? ' done' : ''}"><button class="chk" data-act="chk" data-key="${esc(it.key)}" data-week="${week}" aria-pressed="${it.done}" aria-label="Abhaken">${it.done ? '✓' : ''}</button>
      <button class="mid" data-act="item" data-key="${esc(it.key)}"><span class="t"><span class="nm">${esc(it.name)}</span></span><span class="s"><b class="pk">${esc(packLine(it))}</b>${bits.length ? ' · ' + esc(bits.join(' · ')) : ''}</span></button></div>`;
  }
  function byArea(items, rowFn) {
    let h = '';
    for (const a of KW.AREAS) {
      const its = items.filter(i => i.area === a.id);
      if (!its.length) continue;
      h += `<div class="group-title">${esc(a.label)}</div><div class="list slist">${its.map(rowFn).join('')}</div>`;
    }
    return h;
  }
  function extras() { return KW.live(db, 'extra').sort((a, b) => (a.done - b.done) || a.name.localeCompare(b.name, 'de')); }
  function pageEinkauf() {
    if (!S.shopOwn) S.shopWeek = S.week || defaultWeek();
    const L = SH3.weekList(db, S.shopWeek);
    const nLater = L.later.filter(i => !i.done).length + extras().filter(x => !x.done).length;
    const nRest = Object.keys(SH3.rests(db)).length;
    const tab = S.shopTab || 'week';
    let h = `<div class="top"><h1>Woche</h1><div class="acts">${tab !== 'rest' ? `<button class="circle" data-act="shop-share" aria-label="Teilen"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7.5 7.5 12 3l4.5 4.5M6 11H5v9h14v-9h-1"/></svg></button>` : ''}</div></div>
      ${weekSeg()}<div class="seg sm">${[['week', 'Liste'], ['later', 'Nachkauf' + (nLater ? ' ' + nLater : '')], ['rest', 'Reste' + (nRest ? ' ' + nRest : '')]].map(([v, l]) => `<button data-act="shop-tab" data-v="${v}" aria-pressed="${tab === v}">${l}</button>`).join('')}</div>`;
    if (tab === 'week') h += shopWeekView(L);
    else if (tab === 'later') h += shopLaterView(L);
    else h += shopRestView();
    return h;
  }
  function shopWeekView(L) {
    const start = L.week, end = P.addDays(start, 6), cook = P.cookDate(db, start);
    let h = `<div class="weeknav"><button class="circle" data-act="shop-week" data-d="-7" aria-label="Woche zurück">‹</button><div><b>KW ${P.isoWeek(start)}</b><span class="hint">${P.dayLabel(start)} – ${P.dayLabel(end)} · Kochtag ${P.dayLabel(cook)}</span></div><button class="circle" data-act="shop-week" data-d="7" aria-label="Woche vor">›</button></div>`;
    if (!L.items.length && !L.fromRest.length && !L.later.length) {
      return h + `<div class="card empty"><span class="em">🛒</span><div><b>Noch nichts zu kaufen</b>Für diese Woche ist noch nichts geplant.</div><button class="btn" data-act="tab" data-tab="woche">Woche planen</button></div>` + stockView(L);
    }
    const done = L.items.filter(i => i.done).length;
    h += `<div class="card prog"><div class="inline"><b>${done} von ${L.items.length} im Wagen</b><span class="hint">ganze Packungen</span></div><div class="meter p"><i style="width:${L.items.length ? done / L.items.length * 100 : 0}%"></i></div></div>`;
    h += byArea(L.items, it => shopRow(it, start));
    const fresh = L.items.filter(i => i.lateHint && !i.done);
    if (fresh.length) h += `<div class="tip" style="margin-top:-4px">${fresh.length === 1 ? '1 frische Sache wird' : fresh.length + ' frische Sachen werden'} erst später in der Woche gebraucht. Antippen und „Später kaufen“ wählen, dann stehen sie auf der Nachkaufliste.</div>`;
    h += stockView(L);
    if (L.fromRest.length) h += `<div class="group-title">Schon da (Reste)</div><div class="list slist">${L.fromRest.map(i => `<div class="srow done"><span class="chk" aria-hidden="true">✓</span><span class="mid"><span class="t"><span class="nm">${esc(i.name)}</span></span><span class="s">braucht ${esc(amt(i.need, i.unit, i.cntUnit))}, Rest reicht</span></span></div>`).join('')}</div>`;
    return h;
  }
  function stockView(L) {
    if (!L.stock.length) return '';
    const why = { hunger: 'Hungerknopf', emergency: 'Notfallgericht', vorrat: 'Vorrat fürs Rezept' };
    const open = L.stock.filter(v => !v.state).length, buy = L.stock.filter(v => v.state === 'buy').length;
    let h = `<button class="card stockhead" data-act="stock-toggle" aria-expanded="${!!S.stockOpen}"><span class="ico c-emergency">🥫</span><span class="mid"><span class="t">Grundvorrat prüfen</span>
      <span class="s">${open ? open + ' offen · ' : ''}${buy ? buy + ' auf der Liste · ' : ''}${L.stock.length} Sachen</span></span><span class="chev2">${S.stockOpen ? '⌃' : '⌄'}</span></button>`;
    if (!S.stockOpen) return h;
    h += `<div class="list slist">${L.stock.map(v => `<div class="srow stock"><span class="mid"><span class="t"><span class="nm">${esc(v.name)}</span></span><span class="s">${esc(why[v.why] || '')}${v.pack ? ' · ' + esc(v.pack.label) : ''}</span></span>
      <div class="seg mini"><button data-act="pantry" data-key="${esc(v.key)}" data-v="have" aria-pressed="${v.state === 'have'}">Noch da</button><button data-act="pantry" data-key="${esc(v.key)}" data-v="buy" aria-pressed="${v.state === 'buy'}">Kaufen</button></div></div>`).join('')}</div>`;
    if (open) h += '<button class="btn plain small" style="align-self:center" data-act="stock-all">Rest ist alles noch da</button>';
    return h;
  }
  function shopLaterView(L) {
    let h = `<p class="hint" style="margin:0 4px">Kleine Liste für unter der Woche, z. B. frische Sachen. Gilt für KW ${P.isoWeek(L.week)}.</p>
      <div class="addbar"><input id="ex-name" placeholder="Was fehlt?" autocomplete="off"><select id="ex-area">${KW.AREAS.map(a => `<option value="${a.id}">${esc(a.label)}</option>`).join('')}</select><button class="circle" data-act="extra-add" aria-label="Hinzufügen">${IC.plus}</button></div>`;
    const ex = extras();
    const all = L.later.map(i => Object.assign({}, i, { kind: 'later' })).concat(ex.map(x => ({ key: x.id, name: x.name, area: x.area, done: x.done, kind: 'extra' })));
    if (!all.length) return h + `<div class="card empty"><span class="em">🧺</span><div><b>Nachkaufliste ist leer</b>Etwas oben eintragen oder auf der Wochenliste eine Zeile antippen und „Später kaufen“ wählen.</div></div>`;
    h += byArea(all, it => it.kind === 'later' ? shopRow(it, L.week) : `<div class="srow${it.done ? ' done' : ''}"><button class="chk" data-act="extra-chk" data-id="${it.key}" aria-pressed="${it.done}" aria-label="Abhaken">${it.done ? '✓' : ''}</button><span class="mid"><span class="t"><span class="nm">${esc(it.name)}</span></span></span><button class="x" data-act="extra-del" data-id="${it.key}" aria-label="Löschen">✕</button></div>`);
    if (ex.some(x => x.done)) h += `<button class="btn plain" data-act="extra-clear">Erledigte entfernen</button>`;
    return h;
  }
  function shopRestView() {
    const rs = Object.values(SH3.rests(db)).sort((a, b) => a.name.localeCompare(b.name, 'de'));
    let h = `<p class="hint" style="margin:0 4px">Angebrochene Packungen: gekauft minus verplant. Stimmt etwas nicht, antippen und korrigieren.</p>`;
    if (!rs.length) h += `<div class="card empty"><span class="em">🥡</span><div><b>Keine Reste</b>Reste entstehen, wenn du auf der Wochenliste abhakst und eine Packung nicht ganz verplant ist.</div></div>`;
    else h += `<div class="list slist">${rs.map(x => `<button class="srow" data-act="rest-edit" data-key="${esc(x.key)}"><span class="mid"><span class="t"><span class="nm">${esc(x.name)}</span></span><span class="s">${esc(KW.areaById(x.area).label)}${x.fixed ? ' · korrigiert' : ''}</span></span><b class="amt">${esc(amt(x.amount, x.unit))}</b></button>`).join('')}</div>`;
    h += `<button class="btn tint" data-act="rest-new">+ Rest eintragen</button>`;
    const rr = SH3.restRecipes(db);
    if (rr.length) {
      h += `<h2 class="sec">Damit aufbrauchen</h2><div class="list">${rr.map(x => { const t = P.portionOf(x.r); return `<button class="row" data-act="view" data-id="${x.r.id}"><span class="ico">${KW.catById(x.r.cat).icon}</span><span class="mid"><span class="t">${esc(x.r.name)}</span><span class="s">nutzt ${esc(x.hits.map(hh => hh.name + ' ' + amt(hh.use, hh.unit)).join(', '))}</span></span><span class="right"><b>${f0(t.kcal)} kcal</b><span>${f0(t.p)} g P</span></span></button>`; }).join('')}</div>`;
    }
    return h;
  }
  function findItem(key, week) {
    const L = SH3.weekList(db, week || S.shopWeek);
    return L.items.concat(L.later).find(i => i.key === key) || null;
  }

  // ---------- Fenster: Zeile der Einkaufsliste ----------
  let IT = null;
  function itemSheet() {
    const it = findItem(IT.key);
    if (!it) return '<div class="sheet-head"><span></span><h2></h2><button class="r" data-act="close">Fertig</button></div><p>Nicht mehr auf der Liste.</p>';
    const bits = [];
    if (it.need != null) bits.push('Die Woche braucht ' + amt(it.need, it.unit, it.cntUnit) + (it.rest ? ', davon ' + amt(it.rest, it.unit) + ' aus Resten' : '') + '.');
    if (it.recipes && it.recipes.length) bits.push('Für: ' + it.recipes.join(', ') + '.');
    if (it.pack) bits.push('Packung: ' + it.pack.label + ({ own: ' (deine Packungsliste)', recipe: ' (aus dem Rezept)', list: ' (Standardliste)' })[it.pack.src || 'own'] + '.');
    return `<div class="sheet-head"><span></span><h2>${esc(it.name)}</h2><button class="r" data-act="close">Fertig</button></div>
      <div class="ecard"><b style="font-size:20px">${esc(packLine(it))}</b><p class="hint" style="margin:0">${esc(bits.join(' '))}</p></div>
      <div class="btns"><button class="btn tint" data-act="${it.later ? 'later-off' : 'later-on'}">${it.later ? 'Zurück auf die Wochenliste' : 'Später kaufen (Nachkauf)'}</button>
      <button class="btn plain" data-act="pack-edit-ing" data-name="${esc(it.name)}" data-area="${esc(it.area)}">Packungsgröße ändern</button></div>`;
  }

  // ---------- Fenster: Packungsgrößen ----------
  let PL = null, PE = null;
  function packsSheet() {
    const q = KW.norm(PL.q);
    const list = SH3.packList(db).filter(p => !q || (p.names || [p.name]).some(n => KW.norm(n).includes(q)));
    let h = `<div class="sheet-head"><button class="l" data-act="pack-new">＋ Neu</button><h2>Packungsgrößen</h2><button class="r" data-act="close">Fertig</button></div>
      <p class="hint" style="margin:0">Gängige Größen aus deutschen Supermärkten und Discountern. Deine Änderungen haben Vorrang vor der Packung im Rezept und gelten ab jetzt. Schon abgehakte Einkäufe bleiben, wie sie sind.</p>
      <label class="search">${IC.search}<input type="search" id="ps" placeholder="Suchen" value="${esc(PL.q)}" autocomplete="off"></label><div id="pslist">`;
    h += packRows(list) + '</div>';
    return h;
  }
  function packRows(list) {
    let h = '';
    for (const a of KW.AREAS) {
      const ps = list.filter(p => p.area === a.id).sort((x, y) => x.name.localeCompare(y.name, 'de'));
      if (!ps.length) continue;
      h += `<div class="group-title" style="margin:6px 4px 4px">${esc(a.label)}</div><div class="list slist">${ps.map(p => `<button class="srow" data-act="pack-edit" data-id="${p.id}"><span class="mid"><span class="t"><span class="nm">${esc(p.name)}</span></span>${p.changed || !p.def ? `<span class="s">${p.def ? 'geändert' : 'eigene'}</span>` : ''}</span><b class="amt">${esc(KW.packText(p))}</b></button>`).join('')}</div>`;
    }
    return h || '<div class="card empty">Nichts gefunden.</div>';
  }
  function openPackEdit(p, back) {
    PE = p ? { id: p.id, name: p.name, names: p.names, kind: p.kind, size: fNum(p.size), unit: p.unit, area: p.area, def: !!p.def, changed: !!p.changed, back }
      : { id: null, name: '', kind: 'Packung', size: '', unit: 'g', area: 'sonst', def: false, back };
    if (SH) { SH.fn = packEditSheet; SH.tall = false; $('#sheet .sheet').classList.remove('tall'); refreshSheet(); } else openSheet(packEditSheet);
  }
  function packEditSheet() {
    const own = PE.id && db.packs[PE.id] && !db.packs[PE.id].del;
    return `<div class="sheet-head"><button class="l" data-act="pack-back">${PE.back === 'list' ? 'Zurück' : 'Abbrechen'}</button><h2>${PE.id ? 'Packung' : 'Neue Packung'}</h2><button class="r" data-act="pack-save">Sichern</button></div>
      <div class="field"><label>Name</label><input id="pe-name" value="${esc(PE.name)}"${PE.def ? ' readonly' : ''} placeholder="z. B. Skyr"></div>
      ${PE.def && PE.names && PE.names.length > 1 ? `<p class="hint" style="margin-top:-8px">Passt auch zu: ${esc(PE.names.slice(1).join(', '))}</p>` : ''}
      <div class="grid3"><div class="field"><label>Art</label><input id="pe-kind" value="${esc(PE.kind)}" placeholder="Packung"></div>
        <div class="field"><label>Größe</label><input id="pe-size" inputmode="decimal" value="${esc(PE.size)}"></div>
        <div class="field"><label>Einheit</label><select id="pe-unit">${['g', 'ml', 'Stück'].map(u => `<option${u === PE.unit ? ' selected' : ''}>${u}</option>`).join('')}</select></div></div>
      <div class="field"><label>Bereich</label><select id="pe-area">${KW.AREAS.map(a => `<option value="${a.id}"${a.id === PE.area ? ' selected' : ''}>${esc(a.label)}</option>`).join('')}</select></div>
      ${PE.def && own ? '<button class="btn plain" data-act="pack-reset">Auf Standard zurücksetzen</button>' : ''}
      ${PE.id ? `<button class="btn danger" data-act="pack-del">${PE.def ? 'Aus der Liste nehmen' : 'Löschen'}</button>` : ''}`;
  }

  // ---------- Fenster: Rest ----------
  let RS = null;
  function restSheet() {
    return `<div class="sheet-head"><button class="l" data-act="close">Abbrechen</button><h2>${RS.isNew ? 'Rest eintragen' : esc(RS.name)}</h2><button class="r" data-act="rest-save">Sichern</button></div>
      ${RS.isNew ? `<div class="field"><label>Zutat</label><input id="rs-name" placeholder="z. B. Haferflocken" value="${esc(RS.name)}"></div>` : ''}
      <div class="grid2"><div class="field"><label>Menge</label><input id="rs-amt" inputmode="decimal" value="${esc(fNum(RS.amount))}"></div>
        <div class="field"><label>Einheit</label><select id="rs-unit"${RS.isNew ? '' : ' disabled'}>${['g', 'Stück'].map(u => `<option${u === RS.unit ? ' selected' : ''}>${u}</option>`).join('')}</select></div></div>
      ${RS.isNew ? `<div class="field"><label>Bereich</label><select id="rs-area">${KW.AREAS.map(a => `<option value="${a.id}"${a.id === RS.area ? ' selected' : ''}>${esc(a.label)}</option>`).join('')}</select></div>` : '<button class="btn danger" data-act="rest-gone">Aufgebraucht / weg</button>'}`;
  }
  function shopShare() {
    const L = SH3.weekList(db, S.shopWeek);
    if ((S.shopTab || 'week') === 'week') {
      const its = L.items.filter(i => !i.done);
      if (!its.length) { toast('Alles abgehakt'); return; }
      shareText('Einkauf KW ' + P.isoWeek(L.week), SH3.shareText('Einkauf KW ' + P.isoWeek(L.week), its));
    } else {
      const its = L.later.filter(i => !i.done).concat(extras().filter(x => !x.done).map(x => ({ name: x.name, area: x.area, done: false })));
      if (!its.length) { toast('Nachkaufliste ist leer'); return; }
      shareText('Nachkauf', SH3.shareText('Nachkauf', its));
    }
  }

  // ---------- Kochsession ----------
  const CO = KW.C;
  const KEY_CK = 'kochwerk_session';
  const COLORS = ['#34C76A', '#FF9F0A', '#5AA9FF', '#BF5AF2', '#FF6961', '#64D2FF'];
  let CK = null, ckTick = null, wake = null, audio = null;
  function ckSave() { try { localStorage.setItem(KEY_CK, JSON.stringify(CK)); } catch (e) { /* egal */ } }
  function ckLoad() { try { return JSON.parse(localStorage.getItem(KEY_CK) || 'null'); } catch (e) { return null; } }
  function ckPlan() {
    const pots = SH3.weekPots(db, CK.week).filter(x => CK.sel.includes(x.r.id));
    return CO.schedule(pots.map(x => ({ r: x.r, pots: x.pots })));
  }
  function openCook(week) {
    const old = ckLoad();
    if (old && old.week === week && old.phase !== 'pick') CK = old;
    else CK = { week, phase: 'pick', sel: SH3.weekPots(db, week).map(x => x.r.id), idx: 0, timers: [] };
    $('#cook').hidden = false; document.body.style.overflow = 'hidden';
    renderCook();
  }
  function closeCook() {
    $('#cook').hidden = true; $('#cook').innerHTML = ''; document.body.style.overflow = '';
    clearInterval(ckTick); ckTick = null; releaseWake();
    if (CK && CK.phase === 'end') { try { localStorage.removeItem(KEY_CK); } catch (e) { /* egal */ } } else ckSave();
    CK = null; render(true);
  }
  async function keepAwake() {
    try { if ('wakeLock' in navigator && !wake) { wake = await navigator.wakeLock.request('screen'); wake.addEventListener('release', () => { wake = null; }); } } catch (e) { wake = null; }
  }
  function releaseWake() { try { if (wake) wake.release(); } catch (e) { /* egal */ } wake = null; }
  function beep() {
    try {
      if (!audio) return;
      const o = audio.createOscillator(), g = audio.createGain();
      o.connect(g); g.connect(audio.destination); o.frequency.value = 880; g.gain.value = 0.25;
      o.start(); o.stop(audio.currentTime + 0.6);
      setTimeout(() => { try { const o2 = audio.createOscillator(); o2.connect(g); o2.frequency.value = 660; o2.start(); o2.stop(audio.currentTime + 0.6); } catch (e) { /* egal */ } }, 750);
    } catch (e) { /* ohne Ton */ }
    try { if (navigator.vibrate) navigator.vibrate([300, 150, 300]); } catch (e) { /* egal */ }
  }
  const mmss = s => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  function timersHtml() {
    if (!CK.timers.length) return '';
    const nowT = Date.now();
    return '<div class="timers">' + CK.timers.map(t => { const left = (t.end - nowT) / 1000; return `<button class="timer${left <= 0 ? ' ring' : ''}" data-act="ck-timer-x" data-id="${t.id}" style="--c:${t.c}"><b>${left <= 0 ? 'Fertig!' : mmss(left)}</b><span>${esc(t.label)}</span></button>`; }).join('') + '</div>';
  }
  function tickTimers() {
    if (!CK) return;
    const nowT = Date.now();
    for (const t of CK.timers) if (!t.rang && t.end <= nowT) { t.rang = true; beep(); toast('⏰ ' + t.label + ' ist fertig'); ckSave(); }
    const el = $('#ck-timers'); if (el) el.innerHTML = timersHtml();
  }
  function renderCook() {
    const el = $('#cook'), start = CK.week;
    let h = '';
    if (CK.phase === 'pick') {
      const pots = SH3.weekPots(db, start), cd = P.cookDate(db, start);
      const sel = pots.filter(x => CK.sel.includes(x.r.id));
      const sc = CO.schedule(sel.map(x => ({ r: x.r, pots: x.pots })));
      h = `<div class="in"><div class="bar"><button class="back" data-act="ck-close">${IC.back}Zurück</button><span></span></div>
        <h1>Kochsession</h1><p class="lead">KW ${P.isoWeek(start)} · Kochtag ${esc(P.dayLabel(cd))} – welche Rezepte kochst du heute?</p>`;
      if (!pots.length) h += `<div class="card empty"><span class="em">🍳</span><div><b>Nichts zu kochen</b>Für diese Woche ist noch kein Rezept geplant.</div></div>`;
      h += '<div class="opts">' + pots.map((x, k) => { const on = CK.sel.includes(x.r.id); return `<button class="opt" data-act="ck-sel" data-id="${x.r.id}" aria-pressed="${on}"><span class="chk">${on ? '✓' : ''}</span><span class="mid"><span class="t">${esc(x.r.name)}</span><span class="s">${x.pots > 1 ? x.pots + ' × Rezept (' + fNum(x.pots * x.r.portions) + ' Portionen)' : fNum(x.r.portions) + ' Portionen'} · ${x.r.steps.length} ${x.r.steps.length === 1 ? 'Schritt' : 'Schritte'}</span></span><span class="dot" style="background:${COLORS[k % COLORS.length]}"></span></button>`; }).join('') + '</div>';
      if (sel.length) h += `<p class="hint">Alles zusammen etwa ${f0(sc.total)} min${sc.sequential > sc.total + 4 ? ` statt ${f0(sc.sequential)} min nacheinander` : ''}. Die App sagt dir, was als Nächstes dran ist.</p>`;
      h += `<div class="grow"></div><button class="btn" data-act="ck-start"${sel.length ? '' : ' disabled'}>Los geht’s</button></div>`;
    } else if (CK.phase === 'run') {
      const sc = ckPlan(), st = sc.steps[CK.idx];
      if (!st) { CK.phase = 'end'; return renderCook(); }
      const ri = SH3.weekPots(db, start).findIndex(x => x.r.id === st.rid);
      const c = COLORS[(ri < 0 ? st.ri : ri) % COLORS.length];
      const next = sc.steps.slice(CK.idx + 1, CK.idx + 3);
      const hasTimer = CK.timers.some(t => t.step === CK.idx);
      h = `<div class="in"><div class="bar"><button class="back" data-act="ck-close">${IC.back}Pause</button><div class="dots">${sc.steps.map((_, k) => `<i class="${k <= CK.idx ? 'on' : ''}"></i>`).join('')}</div><span class="hint">${CK.idx + 1}/${sc.steps.length}</span></div>
        <div class="awake">📱 Das Display bleibt an. Timer laufen nur, solange Kochwerk geöffnet ist.</div>
        <div id="ck-timers">${timersHtml()}</div>
        <div class="stepcard" style="--c:${c}"><span class="rtag">${esc(st.name)} · Schritt ${st.n}/${st.of}</span>
          ${st.n === 1 && st.pots > 1 ? `<div class="warnbox">Doppelte Menge: ${st.pots} × Rezept.</div>` : ''}
          <p class="big-step">${esc(st.text)}</p>
          ${st.min ? `<span class="badge ${st.passive ? 'ok' : ''}">⏱ ${fNum(st.min)} min${st.passive ? ' · nebenbei, du kannst weitermachen' : ''}</span>` : ''}
          ${st.tip ? `<div class="tip">${esc(st.tip)}</div>` : ''}</div>
        ${st.min && !hasTimer ? `<button class="btn tint" data-act="ck-timer" data-min="${st.min}">⏱ Timer ${fNum(st.min)} min starten</button>` : ''}
        ${next.length ? `<div class="field"><span class="lbl">Danach</span><div class="list">${next.map(n => `<div class="row" style="grid-template-columns:10px minmax(0,1fr)"><span class="dot" style="background:${COLORS[Math.max(0, SH3.weekPots(db, start).findIndex(x => x.r.id === n.rid)) % COLORS.length]}"></span><span class="mid"><span class="t" style="font-weight:500;white-space:normal">${esc(n.text)}</span><span class="s">${esc(n.name)}${n.min ? ' · ' + fNum(n.min) + ' min' : ''}</span></span></div>`).join('')}</div></div>` : ''}
        <div class="grow"></div><div class="btnrow">${CK.idx ? '<button class="btn plain" style="flex:0 0 30%" data-act="ck-prev">Zurück</button>' : ''}<button class="btn" data-act="ck-next">${CK.idx === sc.steps.length - 1 ? 'Fertig gekocht' : 'Erledigt, weiter'}</button></div></div>`;
      if (!ckTick) ckTick = setInterval(tickTimers, 1000);
      keepAwake();
    } else {
      const b = CO.boxes(db, start, { cookDate: today(), recipeIds: CK.sel });
      h = `<div class="in"><div class="bar"><span></span></div><h1>Fertig gekocht! 🎉</h1><p class="lead">So kommt alles in die Boxen. Die Übersicht findest du später unter Woche → Boxen.</p>
        ${boxesHtml(b)}<div class="grow"></div><button class="btn" data-act="ck-finish">Fertig</button></div>`;
    }
    el.innerHTML = h;
    el.scrollTop = 0;
  }
  const PLACE = { fridge: ['🧊', 'Kühlschrank'], freezer: ['❄️', 'Gefrierfach'], late: ['⚠️', 'Hält nicht so lange'] };
  function boxesHtml(b) {
    const cnt = k => b.list.filter(x => x.place === k).reduce((s, x) => s + x.count, 0) + b.reserve.filter(x => x.place === k).reduce((s, x) => s + x.count, 0);
    let h = `<div class="tiles t3"><div><b>${cnt('fridge')}</b><span>🧊 Kühlschrank</span></div><div><b>${cnt('freezer')}</b><span>❄️ Gefrierfach</span></div><div><b>${b.list.reduce((s, x) => s + x.count, 0) + b.reserve.reduce((s, x) => s + x.count, 0)}</b><span>Boxen gesamt</span></div></div>`;
    if (b.list.some(x => x.place === 'late')) h += `<div class="warnbox">Nicht einfrierbar und hält nicht bis zum geplanten Tag. Lieber früher essen oder in der Woche tauschen.</div>`;
    h += `<div class="field"><span class="lbl">Box-Reihenfolge (gekocht ${esc(P.dayLabel(b.cookDate))})</span><div class="list">` + b.list.map(x => {
      const [ic, lb] = PLACE[x.place];
      const sub = (x.place === 'freezer' ? `auftauen: ${P.DAY_SHORT[P.wd(x.thaw)]} abends in den Kühlschrank` : x.place === 'late' ? `hält nur bis ${P.dayLabel(x.keepUntil)}` : `${lb}, hält bis ${P.dayLabel(x.keepUntil)}`) + (x.partner ? ' · 2 Boxen (mit Freundin)' : '');
      return `<div class="row"><span class="ico">${ic}</span><span class="mid"><span class="t">${esc(P.dayLabel(x.date))} · ${esc(x.meal === 'snack' ? 'Snack' : P.mealById(x.meal).short)}</span><span class="s" style="white-space:normal">${esc(x.name)} · ${esc(sub)}</span></span><span></span></div>`;
    }).join('') + '</div></div>';
    if (b.reserve.length) h += `<div class="field"><span class="lbl">Übrige Portionen (ganze Töpfe)</span><div class="list">${b.reserve.map(x => `<div class="row"><span class="ico">${PLACE[x.place][0]}</span><span class="mid"><span class="t">${x.count} × ${esc(x.name)}</span><span class="s" style="white-space:normal">${x.place === 'freezer' ? 'Reserve ins Gefrierfach' : 'Kühlschrank, bis ' + esc(P.dayLabel(x.keepUntil)) + ' essen'}</span></span><span></span></div>`).join('')}</div></div>`;
    return h;
  }
  function boxSheet() {
    const b = CO.boxes(db, S.week);
    return `<div class="sheet-head"><span></span><h2>Boxen</h2><button class="r" data-act="close">Fertig</button></div>` +
      (b.list.length || b.reserve.length ? boxesHtml(b) : '<div class="card empty">In dieser Woche ist noch nichts geplant.</div>') +
      (CO.cookedOf(db, S.week) ? '' : '<p class="hint">Vorschau mit Standard-Kochtag. Nach der Kochsession gilt der echte Kochtag.</p>');
  }

  // ---------- Hunger und Notfall ----------
  function ideaRows(list) {
    return '<div class="list">' + list.map(x => `<button class="row" data-act="view" data-id="${x.r.id}"><span class="ico">${KW.catById(x.r.cat).icon}</span><span class="mid"><span class="t">${esc(x.r.name)}</span><span class="s">${x.r.time ? f0(x.r.time) + ' min · ' : ''}${esc(KW.catById(x.r.cat).short)}</span></span><span class="right"><b>${f0(x.t.kcal)} kcal</b><span>${f0(x.t.p)} g P</span></span></button>`).join('') + '</div>';
  }
  function hungerSheet() {
    const list = CO.hungerIdeas(db, today());
    return `<div class="sheet-head"><span></span><h2>Ich hab Hunger</h2><button class="r" data-act="close">OK</button></div>
      <p style="margin:0">Schnelle Proteinsnacks aus deiner Liste. <b>Nur als Idee</b> – es wird nichts eingetragen oder abgezogen.</p>` +
      (list.length ? ideaRows(list) : '<div class="card empty">Noch keine Hungersnacks. Im Chat „Kochwerk 3 Hungersnacks“ schreiben und den Block importieren.</div>');
  }
  function crashSheet() {
    const list = CO.emergencyIdeas(db);
    return `<div class="sheet-head"><span></span><h2>Plan geplatzt</h2><button class="r" data-act="close">OK</button></div>
      <p style="margin:0">Kein Problem. Gerichte aus haltbaren Vorräten – Zutaten stehen im Grundvorrat.</p>` +
      (list.length ? ideaRows(list) : '<div class="card empty">Noch keine Notfallgerichte. Im Chat „Kochwerk 3 Notfallgerichte aus Vorrat“ schreiben und importieren.</div>');
  }

  // ---------- Abgleich mit dem iPad ----------
  const Y = KW.Y;
  const KEY_SYNC = 'kochwerk_sync';
  function loadSync() { try { return Object.assign({ repo: '', token: '', on: false }, JSON.parse(localStorage.getItem(KEY_SYNC) || '{}')); } catch (e) { return { repo: '', token: '', on: false }; } }
  const SC = loadSync();
  function saveSync() { try { localStorage.setItem(KEY_SYNC, JSON.stringify(SC)); } catch (e) { /* egal */ } }
  function deviceName() {
    const ua = navigator.userAgent || '';
    if (/iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'iPad';
    if (/iPhone/.test(ua)) return 'iPhone';
    return 'Gerät';
  }
  let syncTimer = null, syncing = null, syncAgain = false, fromSetup = false;
  function scheduleSync(ms) {
    if (!SC.on) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => runSync(false), ms == null ? 2000 : ms);
  }
  async function runSync(manual) {
    if (!SC.on) return null;
    if (syncing) { syncAgain = true; return syncing; }
    syncing = (async () => {
      const res = await Y.syncOnce(SC, db, null, deviceName());
      if (res.ok) {
        SC.last = new Date().toISOString(); SC.err = null;
        if (res.fromRemote) {
          // Änderungen, die während des Abgleichs hier entstanden sind, bleiben erhalten
          const m = KW.merge(db, res.data);
          db = m.data; persist();
          if (m.fromLocal) syncAgain = true;
          afterRemote();
          if (manual !== 'quiet') toast('Stand vom anderen Gerät übernommen');
        } else if (manual === true) toast('Abgeglichen');
      } else {
        SC.err = res.offline ? null : res.error;
        if (manual === true) toast(res.error);
      }
      saveSync();
      if (S.tab === 'mehr' && !SH && !WZ && !CK) render(true);
      if (SH && SH.fn === syncSheet) refreshSheet(true);
      return res;
    })();
    try { return await syncing; } finally {
      syncing = null;
      if (syncAgain) { syncAgain = false; scheduleSync(500); }
    }
  }
  function afterRemote() {
    if (PAKET) checkPaket();
    if (WZ && KW.getSetting(db, 'setupDone')) { closeSetup(); render(); checkPaket(); return; }
    if (CK || WZ) return;
    if (SH && !SH.modal) refreshSheet(true);
    render(true);
  }
  function whenText(iso) {
    if (!iso) return 'noch nie';
    const d = new Date(iso), t = d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    return KW.isoDate(d) === today() ? 'heute ' + t : d.toLocaleDateString('de-DE', { day: 'numeric', month: 'numeric' }) + ' ' + t;
  }
  function repoGuess() {
    const m = /^([a-z0-9-]+)\.github\.io$/i.exec(location.hostname);
    return (m ? m[1] : 'dein-name') + '/Kochwerk-Daten';
  }
  let SYF = null;
  function syncSheet() {
    if (SC.on) {
      return `<div class="sheet-head"><span></span><h2>Abgleich</h2><button class="r" data-act="close">Fertig</button></div>
        <div class="ecard"><b>${SC.err ? '⚠️ Problem beim Abgleich' : '✓ Verbunden'}</b><span class="hint">${esc(SC.repo)} · zuletzt ${esc(whenText(SC.last))}</span>${SC.err ? `<div class="errbox">${esc(SC.err)}</div>` : ''}</div>
        <p class="hint" style="margin:0">Abgleich beim Öffnen der App und kurz nach jeder Änderung. Ändert ihr denselben Eintrag auf beiden Geräten, gilt die neueste Änderung.</p>
        <div class="btns"><button class="btn" data-act="sync-now">Jetzt abgleichen</button>
        <button class="btn plain" data-act="sync-share">Zugang ans iPad schicken</button>
        <button class="btn danger" data-act="sync-off">Abgleich trennen</button></div>
        <p class="hint">Der Zugang enthält den Schlüssel. Nur an dein eigenes Gerät oder das deiner Freundin schicken, z. B. per AirDrop.</p>`;
    }
    const f = SYF || { repo: SC.repo || repoGuess(), token: SC.token || '', msg: null, busy: false };
    SYF = f;
    return `<div class="sheet-head"><button class="l" data-act="sync-cancel">Abbrechen</button><h2>Abgleich einrichten</h2><span></span></div>
      <p style="margin:0">So bleiben iPhone und iPad gleich – ohne gemeinsame iCloud. Die Daten liegen in einem privaten GitHub-Repository.</p>
      <div class="card" style="background:var(--fill-2)"><ol class="howto">
        <li>Auf <b>github.com</b> ein neues Repository anlegen, z. B. <b>Kochwerk-Daten</b>, Sichtbarkeit <b>Private</b>.</li>
        <li>Settings → Developer settings → Personal access tokens → <b>Fine-grained tokens</b> → Generate new token. Repository access: nur <b>Kochwerk-Daten</b>. Permissions: <b>Contents: Read and write</b>.</li>
        <li>Repository und Schlüssel hier eintragen. Auf dem iPad dasselbe – oder dort den Zugang einfügen, den du mit „Zugang ans iPad schicken“ sendest.</li></ol></div>
      <div class="field"><label for="sy-code">Zugang einfügen (vom anderen Gerät)</label><input id="sy-code" placeholder="kochwerk-zugang:…" autocomplete="off" autocapitalize="off" spellcheck="false"></div>
      <div class="field"><label for="sy-repo">Repository</label><input id="sy-repo" value="${esc(f.repo)}" autocomplete="off" autocapitalize="off" spellcheck="false"></div>
      <div class="field"><label for="sy-token">Schlüssel (Token)</label><input id="sy-token" type="password" value="${esc(f.token)}" placeholder="github_pat_…" autocomplete="off" autocapitalize="off" spellcheck="false"></div>
      ${f.msg ? `<div class="errbox">${esc(f.msg)}</div>` : ''}
      <button class="btn" data-act="sync-connect"${f.busy ? ' disabled' : ''}>${f.busy ? 'Prüfe …' : 'Verbinden'}</button>
      <p class="hint">Der Schlüssel bleibt nur auf diesem Gerät. Er steht nie in der Datei auf GitHub und nie in einer Sicherung.</p>`;
  }
  async function syncConnect() {
    const code = Y.parseAccess($('#sy-code').value);
    const repo = code ? code.repo : Y.cleanRepo($('#sy-repo').value), token = code ? code.token : $('#sy-token').value.trim();
    SYF = { repo, token, msg: null, busy: true };
    if (!repo || !token || !repo.includes('/')) { SYF.busy = false; SYF.msg = 'Bitte Repository (name/Repository) und Schlüssel eintragen.'; refreshSheet(true); return; }
    refreshSheet(true);
    const t = await Y.test({ repo, token });
    if (!t.ok) { SYF.busy = false; SYF.msg = t.msg; refreshSheet(true); return; }
    Object.assign(SC, { repo, token, on: true, err: null }); saveSync();
    SYF = null;
    const res = await runSync('quiet');
    refreshSheet();
    if (res && res.ok) toast(res.fromRemote ? 'Verbunden – Stand vom anderen Gerät übernommen' : 'Verbunden');
    if (fromSetup) { fromSetup = false; if (KW.getSetting(db, 'setupDone')) closeSheet(); }
  }

  // ---------- Datensicherung ----------
  async function exportBackup() {
    const text = Y.exportText(db), name = 'kochwerk-sicherung-' + today() + '.json';
    let done = false;
    try {
      const file = new File([text], name, { type: 'application/json' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'Kochwerk-Sicherung' }); done = true; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    if (!done) {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
      a.download = name; document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    }
    ui.lastBackup = new Date().toISOString(); saveUi(); render(true); toast('Sicherung erstellt');
  }
  let BK = null;
  function backupSheet() {
    return `<div class="sheet-head"><button class="l" data-act="close">Abbrechen</button><h2>Sicherung importieren</h2><span></span></div>
      <div class="ecard"><b>${BK.recipes} Rezepte</b><span class="hint">${BK.exported ? 'Gesichert am ' + esc(new Date(BK.exported).toLocaleString('de-DE')) : ''}</span></div>
      <div class="btns"><button class="btn" data-act="bk-merge">Zusammenführen (empfohlen)</button><button class="btn danger" data-act="bk-replace">Alles hier ersetzen</button></div>
      <p class="hint">Zusammenführen behält alles, was hier neuer ist. Ersetzen übernimmt nur die Sicherung${SC.on ? ' – beim nächsten Abgleich kommen neuere Einträge vom anderen Gerät aber zurück' : ''}.</p>`;
  }

  // ---------- Tagebuch ----------
  const T = KW.T;
  const SRC = { base: 'Grundliste', off: 'Open Food Facts', own: 'Eigenes', recipe: 'Rezept' };
  const fv = (v, k) => v == null ? '–' : k === 'kcal' ? f0(v) : (v < 10 ? f1(v) : f0(v));
  function amountLabel(it) {
    const g = Math.round(it.grams);
    if (it.plan) return it.factor === 1 ? '1 Portion (' + g + ' g)' : it.factor ? fNum(it.factor) + ' Portion (' + g + ' g)' : 'nicht gegessen';
    return it.portion ? it.portion + ' (' + g + ' g)' : g + ' g';
  }
  function dayName(d) {
    const t = today(), diff = P.diffDays(d, t);
    const lbl = diff === 0 ? 'Heute' : diff === 1 ? 'Gestern' : diff === -1 ? 'Morgen' : P.DAY_LONG[P.wd(d)];
    return lbl + ', ' + Number(d.slice(8)) + '.' + Number(d.slice(5, 7)) + '.';
  }
  function pageTagebuch() {
    const d = S.day || today();
    const tt = T.dayTotals(db, d), prof = KW.profile(db), tg = KW.calcTargets(prof);
    const target = tg ? tg.target : 0, rest = target - tt.kcal;
    const items = T.dayItems(db, d);
    let h = `<div class="top"><h1>Tagebuch</h1><div class="acts">
      <button class="circle" data-act="tb-scan" aria-label="Barcode scannen"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2M8 8v8M11 8v8M14 8v8M17 8v8"/></svg></button>
      <button class="circle" data-act="tb-add" data-meal="" aria-label="Eintragen">${IC.plus}</button></div></div>
      <div class="weeknav"><button class="circle" data-act="tb-day" data-d="-1" aria-label="Tag zurück">‹</button><div><b>${esc(dayName(d))}</b>${d !== today() ? '<button class="link" data-act="tb-today" style="padding:0">Zu heute</button>' : ''}</div><button class="circle" data-act="tb-day" data-d="1" aria-label="Tag vor">›</button></div>`;
    const pct = target ? tt.kcal / target * 100 : 0;
    const pm = k => tt.partial[k] ? '≥ ' : '';
    const over = rest < -50;
    h += `<div class="card hero2 col${over ? ' over' : ''}"><div class="hero-row"><div class="ring-wrap">${ringSvg(tt.kcal / (target || 1), tt.p / (prof.protein || 1), over)}
      <div class="ring-in"><b class="num${tt.kcal >= 1000 ? ' long' : ''}">${f0(tt.kcal)}</b><span>von ${f0(target)}</span></div></div>
      <div class="hero-txt"><span class="lbl">Gegessen</span><div class="room-big">${rest >= 0 ? 'Noch ' + f0(rest) + ' kcal frei' : f0(-rest) + ' kcal über dem Ziel'}</div>
      <div class="legend2"><span><i class="lg k"></i>Kalorien ${f0(pct)} %</span><span><i class="lg p"></i><b class="num">${f0(tt.p)}</b> / ${f0(prof.protein)} g Eiweiß</span></div></div></div>
      <div class="tiles"><div><b>${f0(tt.c)}<small> g</small></b><span>KH</span></div><div><b>${pm('sug')}${f0(tt.sug)}<small> g</small></b><span>Zucker</span></div><div><b>${f0(tt.f)}<small> g</small></b><span>Fett</span></div><div><b>${pm('fib')}${f0(tt.fib)}<small> g</small></b><span>Ballastst.</span></div></div>
      <button class="link" data-act="tb-all" style="align-self:flex-start">Alle Nährwerte ›</button></div>`;
    for (const m of T.MEALS) {
      const its = items.filter(i => i.meal === m.id);
      const kc = its.reduce((s, i) => s + (i.plan && !i.eaten ? 0 : T.nutr(i.per100, i.grams).kcal || 0), 0);
      h += `<div class="sect"><h2 class="sec"><span class="ico sm m-${m.id}">${m.icon}</span>${esc(m.label)}</h2><span class="sect-r">${kc ? f0(kc) + ' kcal' : ''}</span></div><div class="list">`;
      for (const it of its) {
        const v = T.nutr(it.per100, it.grams), off = it.plan && !it.eaten;
        h += `<button class="row tb${off ? ' off' : ''}" data-act="tb-item" data-id="${it.id}"><span class="mid"><span class="t">${esc(it.name)}${it.brand ? ' <span class="muted" style="font-weight:500">· ' + esc(it.brand) + '</span>' : ''}</span>
          <span class="s">${esc(amountLabel(it))}${it.plan ? ' · aus dem Plan' : ''}</span></span><span class="right"><b>${off ? '–' : f0(v.kcal) + ' kcal'}</b><span>${off ? '' : fv(v.p) + ' g P'}</span></span></button>`;
      }
      h += `<button class="row addrow" data-act="tb-add" data-meal="${m.id}"><span class="mid"><span class="t">＋ Hinzufügen</span></span><span></span></button></div>`;
    }
    // Woche
    const ws = T.weekStats(db, P.weekStart(d)), withData = ws.filter(x => x.n);
    const max = Math.max(target, ...ws.map(x => x.kcal), 1);
    h += `<div class="card"><span class="lbl">Diese Woche</span><div class="wbars">${ws.map(x => `<button class="wb${x.date === d ? ' on' : ''}" data-act="tb-goto" data-d="${x.date}"><span class="bar-o"><i style="height:${x.kcal / max * 100}%" class="${x.kcal > target + 50 ? 'over' : ''}"></i><em style="bottom:${target / max * 100}%"></em></span><small>${P.DAY_SHORT[P.wd(x.date)]}</small></button>`).join('')}</div>
      <p class="hint">${withData.length ? `Ø ${f0(withData.reduce((s, x) => s + x.kcal, 0) / withData.length)} kcal und ${f0(withData.reduce((s, x) => s + x.p, 0) / withData.length)} g Eiweiß an ${withData.length} ${withData.length === 1 ? 'Tag' : 'Tagen'} mit Einträgen. Linie = Tagesziel.` : 'Noch keine Einträge in dieser Woche.'}</p></div>`;
    return h;
  }
  function allNutrSheet() {
    const d = S.day || today(), tt = T.dayTotals(db, d);
    return `<div class="sheet-head"><span></span><h2>Nährwerte ${esc(dayName(d))}</h2><button class="r" data-act="close">Fertig</button></div>
      <div class="list">${T.FIELDS.map(k => `<div class="row nt${k === 'sug' || k === 'sat' ? ' sub' : ''}"><span class="mid"><span class="t">${esc(T.LABELS[k])}</span></span><span class="right"><b>${tt.partial[k] ? '≥ ' : ''}${fv(tt[k], k)} ${k === 'kcal' ? 'kcal' : 'g'}</b></span></div>`).join('')}</div>
      ${Object.keys(tt.partial).length ? '<p class="hint">≥ heißt: Bei Rezepten sind nur kcal, Eiweiß, Kohlenhydrate und Fett hinterlegt. Zucker, gesättigte Fettsäuren, Ballaststoffe und Salz fehlen dort, der echte Wert ist also etwas höher.</p>' : ''}`;
  }

  // Hinzufügen: Suche in Grundliste, eigenen Lebensmitteln, Rezepten und Open Food Facts
  let TB = null;
  function openAdd(meal) {
    const d = S.day || today();
    TB = { date: d, meal: meal || (d === today() ? T.mealByTime(new Date().getHours()) : 'lunch'), q: '', tab: 'recent', off: null };
    openSheet(addSheet, { tall: true });
  }
  function foodRow(f) {
    const v = f.per100;
    return `<button class="row tb" data-act="tb-food" data-id="${esc(f.id)}"><span class="mid"><span class="t">${esc(f.name)}</span><span class="s">${esc([f.brand, SRC[f.src]].filter(Boolean).join(' · '))}</span></span><span class="right"><b>${fv(v.kcal, 'kcal')} kcal</b><span>${fv(v.p)} g P · 100 g</span></span></button>`;
  }
  function addResults() {
    const q = TB.q.trim();
    let list;
    if (q) list = T.search(db, q, 30);
    else if (TB.tab === 'fav') list = T.favorites(db);
    else if (TB.tab === 'own') list = KW.live(db, 'foods').filter(f => !f.hidden && f.src === 'own');
    else list = T.recent(db, 25);
    let h = list.length ? '<div class="list">' + list.map(foodRow).join('') + '</div>'
      : `<div class="card empty">${q ? 'Nichts in der Grundliste gefunden.' : TB.tab === 'fav' ? 'Noch keine Favoriten. Beim Eintragen den Stern antippen.' : TB.tab === 'own' ? 'Noch keine eigenen Lebensmittel.' : 'Noch nichts gegessen. Oben suchen.'}</div>`;
    if (q.length >= 2) {
      const o = TB.off && TB.off.q === q ? TB.off : null;
      h += `<div class="group-title" style="margin:6px 4px 4px">Open Food Facts</div>`;
      if (!o) h += `<button class="btn tint" data-act="tb-off">🔎 ${T.isBarcode(q) ? 'Barcode' : '„' + esc(q) + '“'} in Open Food Facts suchen</button>`;
      else if (o.loading) h += '<div class="card empty">Suche läuft …</div>';
      else if (o.err) h += `<div class="errbox">${esc(o.err)}</div>`;
      else if (!o.res.length) h += '<div class="card empty">Nichts gefunden. Anderes Wort probieren oder selbst anlegen.</div>';
      else h += '<div class="list">' + o.res.map(foodRow).join('') + '</div>';
    }
    return h;
  }
  function addSheet() {
    return `<div class="sheet-head"><button class="l" data-act="close">Abbrechen</button><h2>Eintragen</h2><button class="r" data-act="tb-scan">Scannen</button></div>
      <div class="seg">${T.MEALS.map(m => `<button data-act="tb-meal" data-v="${m.id}" aria-pressed="${TB.meal === m.id}">${esc(m.label === 'Abendessen' ? 'Abend' : m.label)}</button>`).join('')}</div>
      <label class="search">${IC.search}<input type="search" id="tbq" placeholder="Lebensmittel oder Barcode" value="${esc(TB.q)}" autocomplete="off" enterkeyhint="search"></label>
      ${TB.q ? '' : `<div class="chips">${[['recent', 'Zuletzt'], ['fav', '★ Favoriten'], ['own', 'Eigene']].map(([v, l]) => `<button class="chip" data-act="tb-tab" data-v="${v}" aria-pressed="${TB.tab === v}">${l}</button>`).join('')}</div>`}
      <div id="tbres">${addResults()}</div>
      <button class="btn plain" data-act="tb-own">Eigenes Lebensmittel anlegen</button>`;
  }
  async function runOff() {
    const q = TB.q.trim();
    TB.off = { q, loading: true };
    const el = $('#tbres'); if (el) el.innerHTML = addResults();
    try {
      const res = T.isBarcode(q) ? [await T.offBarcode(q)].filter(Boolean) : await T.offSearch(q);
      TB.off = { q, res };
      offCache = Object.assign(offCache || {}, Object.fromEntries(res.map(f => [f.id, f])));
    } catch (e) { TB.off = { q, err: navigator.onLine === false ? 'Keine Internetverbindung. Open Food Facts braucht Internet.' : 'Open Food Facts antwortet gerade nicht. Gleich noch einmal versuchen.' }; }
    if (SH && SH.fn === addSheet) { const r = $('#tbres'); if (r) r.innerHTML = addResults(); }
  }
  let offCache = {};
  const getFood = id => T.findFood(db, id) || offCache[id] || null;

  // Menge wählen
  let AM = null;
  function openAmount(food, opt = {}) {
    const p = food.portions && food.portions[0];
    AM = Object.assign({ food, meal: TB ? TB.meal : 'snack', date: S.day || today(), unit: p ? 0 : -1, qty: p ? 1 : 100, edit: null }, opt);
    if (SH) { SH.fn = amountSheet; SH.tall = true; $('#sheet .sheet').classList.add('tall'); refreshSheet(); } else openSheet(amountSheet, { tall: true });
  }
  const amGrams = () => AM.unit < 0 ? AM.qty : AM.qty * AM.food.portions[AM.unit].g;
  function amTable() {
    const g = amGrams(), v = T.nutr(AM.food.per100, g);
    return `<div class="list">${T.FIELDS.map(k => `<div class="row nt${k === 'sug' || k === 'sat' ? ' sub' : ''}"><span class="mid"><span class="t">${esc(T.LABELS[k])}</span></span><span class="right"><b>${fv(v[k], k)} ${k === 'kcal' ? 'kcal' : 'g'}</b><span class="muted" style="font-weight:500;color:var(--label-2)">${fv(AM.food.per100[k], k)} / 100 g</span></span></div>`).join('')}</div>`;
  }
  function amountSheet() {
    const f = AM.food, fav = f.src !== 'recipe' && T.isFav(db, f);
    return `<div class="sheet-head"><button class="l" data-act="${AM.edit ? 'close' : 'tb-back'}">${AM.edit ? 'Abbrechen' : 'Zurück'}</button><h2>${esc(f.name)}</h2><button class="r" data-act="tb-save">${AM.edit ? 'Sichern' : 'Eintragen'}</button></div>
      <div class="inline"><span class="hint">${esc([f.brand, SRC[f.src]].filter(Boolean).join(' · '))}</span>${f.src !== 'recipe' ? `<button class="link" data-act="tb-fav">${fav ? '★ Favorit' : '☆ Favorit'}</button>` : ''}</div>
      <div class="grid2"><div class="field"><label for="am-qty">Menge</label><input id="am-qty" inputmode="decimal" value="${esc(fNum(AM.qty))}"></div>
        <div class="field"><label for="am-unit">Einheit</label><select id="am-unit"><option value="-1"${AM.unit < 0 ? ' selected' : ''}>g</option>${(f.portions || []).map((p, k) => `<option value="${k}"${AM.unit === k ? ' selected' : ''}>${esc(p.label)} (${f0(p.g)} g)</option>`).join('')}</select></div></div>
      <div class="seg">${T.MEALS.map(m => `<button data-act="am-meal" data-v="${m.id}" aria-pressed="${AM.meal === m.id}">${esc(m.label === 'Abendessen' ? 'Abend' : m.label)}</button>`).join('')}</div>
      <div id="amtab">${amTable()}</div>
      ${AM.edit ? '<button class="btn danger" data-act="tb-del">Eintrag löschen</button>' : ''}`;
  }
  // Geplante Mahlzeit anpassen
  let PI = null;
  function planItemSheet() {
    const it = T.plannedItems(db, PI.date).find(x => x.planId === PI.planId);
    if (!it) return '<div class="sheet-head"><span></span><h2></h2><button class="r" data-act="close">Fertig</button></div>';
    const opt = [[1, 'Ganze Portion'], [0.5, 'Halbe'], [1.5, 'Anderthalb'], [0, 'Nicht gegessen']];
    return `<div class="sheet-head"><span></span><h2>${esc(it.name)}</h2><button class="r" data-act="close">Fertig</button></div>
      <p class="hint" style="margin:0">Aus dem Plan (${esc(P.mealById(it.planMeal).label)}). Geplantes zählt automatisch als gegessen – hier anpassen, wenn es anders war.</p>
      <div class="grid2">${opt.map(([v, l]) => `<button class="opt" style="justify-content:center" data-act="pi-f" data-v="${v}" aria-pressed="${it.factor === v}">${l}</button>`).join('')}</div>
      <div class="field"><label for="pi-f">Andere Menge (Portionen)</label><input id="pi-f" inputmode="decimal" value="${esc(fNum(it.factor))}"></div>
      <button class="btn plain" data-act="view" data-id="${it.foodId.slice(2)}">Rezept ansehen</button>`;
  }

  // Eigenes Lebensmittel
  let OF = null;
  function ownSheet() {
    return `<div class="sheet-head"><button class="l" data-act="tb-back">Zurück</button><h2>Eigenes Lebensmittel</h2><button class="r" data-act="of-save">Sichern</button></div>
      <div class="field"><label for="of-name">Name</label><input id="of-name" value="${esc(OF.name)}" placeholder="z. B. Omas Kartoffelsalat"></div>
      <div class="grid2"><div class="field"><label for="of-brand">Marke (optional)</label><input id="of-brand" value="${esc(OF.brand)}"></div>
        <div class="field"><label for="of-code">Barcode (optional)</label><input id="of-code" inputmode="numeric" value="${esc(OF.code)}"></div></div>
      <span class="lbl">Nährwerte pro 100 g (von der Packung)</span>
      <div class="grid2">${T.FIELDS.map(k => `<div class="field"><label for="of-${k}">${esc(T.LABELS[k])}${k === 'kcal' ? '' : ' (g)'}</label><input id="of-${k}" inputmode="decimal" value="${esc(fNum(OF.per100[k]))}"></div>`).join('')}</div>
      <div class="grid2"><div class="field"><label for="of-pl">Portion (optional)</label><input id="of-pl" value="${esc(OF.pl)}" placeholder="z. B. 1 Stück"></div>
        <div class="field"><label for="of-pg">Gramm pro Portion</label><input id="of-pg" inputmode="decimal" value="${esc(fNum(OF.pg))}"></div></div>`;
  }

  // ---------- Barcode scannen (Kamera, es werden keine Bilder gespeichert) ----------
  let SC2 = null, zxReader = null;
  function loadZxing() {
    if (window.ZXing) return Promise.resolve();
    return new Promise((ok, bad) => { const s = document.createElement('script'); s.src = 'vendor/zxing.min.js'; s.onload = ok; s.onerror = bad; document.head.appendChild(s); });
  }
  function stopScan() { try { if (zxReader) zxReader.reset(); } catch (e) { /* egal */ } zxReader = null; }
  function scanSheet() {
    return `<div class="sheet-head"><button class="l" data-act="scan-close">Abbrechen</button><h2>Barcode scannen</h2><span></span></div>
      <div class="scanbox"><video id="scanvid" playsinline muted autoplay></video><i class="scanline"></i></div>
      <p class="hint" id="scanmsg" style="text-align:center">${esc(SC2.msg || 'Strichcode der Packung in den Rahmen halten.')}</p>
      ${SC2.notFound ? `<div class="warnbox">Barcode ${esc(SC2.notFound)} ist nicht in Open Food Facts. Werte von der Packung selbst eintragen?</div><button class="btn" data-act="scan-own">Selbst anlegen</button>` : ''}
      <div class="addbar" style="grid-template-columns:minmax(0,1fr) 44px"><input id="scancode" inputmode="numeric" placeholder="oder Nummer eintippen"><button class="circle" data-act="scan-go" aria-label="Nachschlagen">›</button></div>
      <p class="hint">Die Kamera liest nur den Strichcode. Es werden keine Bilder gespeichert.</p>`;
  }
  async function openScan() {
    stopScan();
    SC2 = { msg: null, notFound: null, busy: false };
    if (SH) { SH.fn = scanSheet; SH.tall = true; SH.modal = true; $('#sheet .sheet').classList.add('tall'); refreshSheet(); } else openSheet(scanSheet, { tall: true, modal: true });
    try {
      await loadZxing();
      const hints = new Map();
      hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, [ZXing.BarcodeFormat.EAN_13, ZXing.BarcodeFormat.EAN_8, ZXing.BarcodeFormat.UPC_A, ZXing.BarcodeFormat.UPC_E]);
      zxReader = new ZXing.BrowserMultiFormatReader(hints);
      await zxReader.decodeFromVideoDevice(undefined, 'scanvid', res => { if (res && SC2 && !SC2.busy) { SC2.busy = true; stopScan(); lookupCode(res.getText()); } });
    } catch (e) {
      SC2.msg = 'Kamera nicht verfügbar. Kochwerk braucht die Erlaubnis für die Kamera – oder die Nummer unten eintippen.';
      const m = $('#scanmsg'); if (m) m.textContent = SC2.msg;
    }
  }
  async function lookupCode(code) {
    code = String(code || '').replace(/\D/g, '');
    if (!T.isBarcode(code)) { toast('Bitte 8 bis 14 Ziffern'); if (SC2) SC2.busy = false; return; }
    const own = KW.live(db, 'foods').find(f => f.code === code && !f.hidden);
    if (own) { stopScan(); openAmount(own); return; }
    const m = $('#scanmsg'); if (m) m.textContent = 'Schlage ' + code + ' nach …';
    try {
      const f = await T.offBarcode(code);
      if (f) { offCache[f.id] = f; stopScan(); openAmount(f); return; }
      SC2.notFound = code; SC2.msg = null; refreshSheet(true);
    } catch (e) {
      SC2.msg = 'Keine Verbindung zu Open Food Facts. Internet prüfen.'; SC2.busy = false; refreshSheet(true);
    }
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
    const row = r => {
      const c = KW.catById(r.cat), t = KW.recipeTotals(r).portion, rs = KW.ratingSummary(db, r.id);
      const bits = [fNum(r.portions) + ' Port.', fNum(r.keepDays) + ' Tage'];
      if (r.freeze) bits.push('❄️');
      if (r.box) bits.push('🥡');
      if (rs.good) bits.push('👍'); else if (rs.bad) bits.push('👎');
      return `<button class="row rrow" data-act="open" data-id="${r.id}"><span class="ico c-${r.cat}">${c.icon}</span>
        <span class="mid"><span class="t">${esc(r.name)}</span><span class="s">${esc(bits.join(' · '))}</span></span>
        <span class="right"><b>${f0(t.kcal)}</b><span>${f0(t.p)} g P</span></span></button>`;
    };
    // „Alle“ ohne Suche: nach Kategorie gruppiert
    if (S.filter === 'all' && !q) {
      return KW.CATS.map(c => { const l = list.filter(r => r.cat === c.id); return l.length ? `<div class="sect"><h2 class="sec">${esc(c.label)}</h2><span class="sect-r">${l.length}</span></div><div class="list">${l.map(row).join('')}</div>` : ''; }).join('');
    }
    return h + '<div class="list">' + list.map(row).join('') + '</div>';
  }

  const SATT = [{ v: -1, e: '😕', l: 'Nicht satt' }, { v: 0, e: '😐', l: 'Geht so' }, { v: 1, e: '😋', l: 'Satt' }];
  const LECKER = [{ v: -1, e: '👎', l: 'Nicht so' }, { v: 0, e: '👌', l: 'Okay' }, { v: 1, e: '👍', l: 'Lecker' }];
  const word = (arr, v) => v == null ? '' : (v <= -0.5 ? arr[0] : v >= 0.5 ? arr[2] : arr[1]);

  function pageRecipe(r) {
    const c = KW.catById(r.cat), T = KW.recipeTotals(r), t = T.portion, rs = KW.ratingSummary(db, r.id);
    let h = `<div><button class="back" data-act="back">${IC.back}Rezepte</button></div>
      <div class="rhead"><span class="rhero ico c-${r.cat}">${c.icon}</span><span class="eyebrow">${esc(c.label)}</span><h1>${esc(r.name)}</h1>
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
      <div class="it"><span class="sl"><span class="si" style="--c:#8E8E93">🧍</span>Geschlecht</span><div class="seg"><button data-act="setv" data-k="sex" data-v="m" aria-pressed="${p.sex === 'm'}">Mann</button><button data-act="setv" data-k="sex" data-v="w" aria-pressed="${p.sex === 'w'}">Frau</button></div></div>
      <div class="it"><label for="s-age"><span class="si" style="--c:#FF9F0A">🎂</span>Alter</label><input id="s-age" data-set="age" inputmode="numeric" value="${esc(p.age)}"></div>
      <div class="it"><label for="s-height"><span class="si" style="--c:#5AC8FA">📏</span>Größe (cm)</label><input id="s-height" data-set="height" inputmode="numeric" value="${esc(p.height)}"></div>
      <div class="it"><label for="s-weight"><span class="si" style="--c:#34C759">⚖️</span>Gewicht (kg)</label><input id="s-weight" data-set="weight" inputmode="decimal" value="${esc(fNum(p.weight))}"></div>
      <div class="it"><label for="s-act"><span class="si" style="--c:#FF3B30">🏃</span>Aktivität</label><select id="s-act" data-set="activity">${opt(KW.ACTIVITY, p.activity, o => o.v, o => o.label)}</select></div>
      <div class="it"><label for="s-tempo"><span class="si" style="--c:#AF52DE">📉</span>Abnehmtempo</label><select id="s-tempo" data-set="tempo">${opt(KW.TEMPO, p.tempo, o => o.id, o => o.label)}</select></div></div>
      <div class="group-title">Ziele</div><div class="set">
      <div class="it"><label for="s-prot"><span class="si" style="--c:#34C759">🥚</span>Protein pro Tag (g)</label><input id="s-prot" data-set="protein" inputmode="numeric" value="${esc(p.protein)}"></div>
      <div class="it"><label for="s-meal"><span class="si" style="--c:#FF9F0A">🍽️</span>Mahlzeit (kcal)</label><input id="s-meal" data-set="mealKcal" inputmode="numeric" value="${esc(p.mealKcal)}"></div></div>
      <p class="hint" style="margin:-12px 4px 0">Mit der normalen Mahlzeit zeigt „Heute“ den Spielraum an, z. B. „noch Platz für etwa 2 normale Mahlzeiten“.</p>
      <div class="group-title">Kochen</div><div class="set">
      <div class="it"><label for="s-day"><span class="si" style="--c:#FF9500">🍳</span>Standard-Kochtag</label><select id="s-day" data-set="cookDay">${opt(days, p.cookDay, d => d, d => KW.WEEKDAYS[d])}</select></div>
      <div class="it"><label for="s-fac"><span class="si" style="--c:#FF2D55">👫</span>Portion Freundin</label><select id="s-fac" data-set="partnerFactor">${opt(facs, p.partnerFactor, f => f, f => Math.round(f * 100) + ' %')}</select></div></div>
      <div class="group-title">Rezepte</div><div class="set">
      <button class="act" data-act="format"><span class="sl"><span class="si" style="--c:#007AFF">📄</span>Import-Format</span><span class="chev">${IC.chev}</span></button>
      <button class="act" data-act="sample"><span class="sl"><span class="si" style="--c:#34C759">📖</span>Beispielrezepte laden</span><span class="chev">${IC.chev}</span></button>
      <button class="act" data-act="packs"><span class="sl"><span class="si" style="--c:#A2845E">📦</span>Packungsgrößen</span><span class="chev">${IC.chev}</span></button>
      ${bad ? `<button class="act" data-act="showbad"><span class="sl"><span class="si" style="--c:#FF3B30">👎</span>Zum Aussortieren</span><small>${bad}</small></button>` : ''}</div>
      <div class="group-title">Darstellung</div><div class="set">
      <div class="it"><span class="sl"><span class="si" style="--c:#5856D6">🎨</span>Farben</span><div class="seg" style="width:220px">${[['auto', 'Automatisch'], ['light', 'Hell'], ['dark', 'Dunkel']].map(([v, l]) => `<button data-act="theme" data-v="${v}" aria-pressed="${ui.theme === v}">${l}</button>`).join('')}</div></div></div>
      <div class="group-title">Abgleich & Sicherung</div><div class="set">
      <button class="act" data-act="sync-open"><span class="sl"><span class="si" style="--c:#007AFF">🔄</span>Abgleich mit dem iPad</span><small>${SC.on ? (SC.err ? '⚠️ Problem' : '✓ ' + esc(whenText(SC.last))) : 'aus'}</small></button>
      <button class="act" data-act="backup-export"><span class="sl"><span class="si" style="--c:#34C759">📤</span>Sicherung exportieren</span><small>${ui.lastBackup ? esc(whenText(ui.lastBackup)) : ''}</small></button>
      <button class="act" data-act="backup-import"><span class="sl"><span class="si" style="--c:#FF9500">📥</span>Sicherung importieren</span><span class="chev">${IC.chev}</span></button></div>
      <div class="set"><button class="act" data-act="setup"><span class="sl"><span class="si" style="--c:#8E8E93">📝</span>Fragebogen neu durchlaufen</span><span class="chev">${IC.chev}</span></button></div>
      <p class="hint" style="text-align:center">Kochwerk ${VERSION}<br>${SC.on ? 'Abgleich über GitHub ist an.' : 'Die Daten liegen nur auf diesem Gerät.'}</p>`;
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
  function closeSheet() { stopScan(); SH = null; const w = $('#sheet'); w.hidden = true; w.innerHTML = ''; document.body.style.overflow = ''; }
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
  // ---------- Rezeptpaket: neue Rezepte, die Claude in rezepte-paket.txt mitliefert ----------
  let PAKET = null;
  async function checkPaket() {
    if (!KW.getSetting(db, 'setupDone')) return;
    try {
      const r = await fetch('rezepte-paket.txt', { cache: 'no-cache' });
      if (!r.ok) return;
      const done = new Set(KW.getSetting(db, 'paketDone') || []);
      // Neu, oder schon da, aber früher ohne erkannte Packungen importiert → zum Ersetzen anbieten
      const broken = old => old.ingredients.some(i => !i.pack && !i.pantry);
      const list = KW.parseRecipes(await r.text()).filter(x => {
        if (x.errors.length) return false;
        const old = KW.findByName(db, x.recipe.name);
        if (!old) return !done.has(x.recipe.name);
        return broken(old) && x.recipe.ingredients.every(i => i.pack || i.pantry) && !done.has('fix:' + x.recipe.name);
      });
      const had = !!PAKET;
      PAKET = list.length ? { list } : null;
      if ((had || PAKET) && S.tab === 'heute' && !SH && !WZ && !CK) render(true);
    } catch (e) { /* offline: beim nächsten Mal */ }
  }
  function paketDone(names) {
    const all = new Set(KW.getSetting(db, 'paketDone') || []);
    for (const n of names) { all.add(n); all.add('fix:' + n); }
    KW.setSetting(db, 'paketDone', [...all]);
    PAKET = null;
  }
  function openImport(text, paket) {
    IM = { text: text || '', res: null, modes: [], paket: paket || null };
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
      if (!res.errors.length && !twin && IM.paket) {
        h += `<div class="seg">${[['new', 'Übernehmen'], ['skip', 'Überspringen']].map(([v, l]) => `<button data-act="im-mode" data-k="${k}" data-v="${v}" aria-pressed="${IM.modes[k] === v}">${l}</button>`).join('')}</div>`;
      }
      if (!res.errors.length && twin) {
        h += `<div class="field"><span class="lbl">„${esc(twin.name)}“ gibt es schon</span><div class="seg">${[['replace', 'Ersetzen'], ['new', 'Als neues'], ['skip', 'Überspringen']].map(([v, l]) => `<button data-act="im-mode" data-k="${k}" data-v="${v}" aria-pressed="${IM.modes[k] === v}">${l}</button>`).join('')}</div></div>`;
      }
      h += '</div>';
    });
    h += `<button class="btn" data-act="im-go"${ok ? '' : ' disabled'}>${ok === 1 ? '1 Rezept übernehmen' : ok + ' Rezepte übernehmen'}</button>${IM.paket ? '<button class="btn plain" data-act="paket-no">Nicht übernehmen</button>' : ''}</div>`;
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
    if (IM.paket) paketDone(IM.paket);
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
      lead = 'Abnehmen mit Plan: einmal beim Rezept rechnen, den Rest zeigt die App. Ein paar Fragen, dann steht dein Ziel.';
      body = `<div class="card" style="display:flex;flex-direction:column;gap:16px">
        <div class="feature"><span class="em">🧮</span><div><b>Einmal rechnen statt täglich zählen</b><span>Die Werte stecken im Rezept. Geplantes zählt automatisch als gegessen.</span></div></div>
        <div class="feature"><span class="em">🗓️</span><div><b>Nur planen, was du willst</b><span>Meist 1–2 Mahlzeiten pro Tag. Die App zeigt, wie viel Spielraum bleibt.</span></div></div>
        <div class="feature"><span class="em">🥡</span><div><b>Einmal pro Woche vorkochen</b><span>Mit Einkaufsliste in ganzen Packungen und Boxen für die Woche.</span></div></div>
        <div class="feature"><span class="em">📒</span><div><b>Tagebuch, wenn du willst</b><span>Ungeplantes eintragen, mit Barcode und Lebensmittel-Datenbank.</span></div></div>
        <div class="feature"><span class="em">⚖️</span><div><b>Einmal pro Woche wiegen</b><span>Der Wochen-Check zeigt, ob es läuft.</span></div></div></div>
        <button class="btn plain" data-act="setup-sync">Schon auf dem anderen Gerät eingerichtet? Abgleichen</button>`;
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
    S.tab = 'heute'; render(); askRating(); checkPaket();
  }

  // ---------- Ereignisse ----------
  const ACT = {
    tab: b => { let t = b.dataset.tab; if (t === 'einkauf') { t = 'woche'; S.weekView = 'shop'; } if (t === S.tab && t === 'rezepte') S.recipeId = null; if (t === 'tagebuch' && S.tab !== 'tagebuch') S.day = null; S.tab = t; render(); },
    'week-view': b => { S.weekView = b.dataset.v; render(); },
    'meal-add': b => { MC = { meal: b.dataset.meal, date: today() }; openSheet(mealChoiceSheet); },
    'mc-track': () => { const m = MC.meal; closeSheet(); S.day = null; openAdd(m); },
    'mc-plan': () => {
      const d = MC.date, m = MC.meal; closeSheet();
      if (m === 'snack') { openPicker({ date: d, gap: defaultGap(d) }); return; }
      const ex = db.plan[P.mainId(d, m)];
      if (ex && !ex.del && P.recipeOf(db, ex)) { openSlot(ex.id); return; }
      P.setMeal(db, d, m, true); save(); render(true); openPicker({ entryId: P.mainId(d, m) });
    },
    'stock-toggle': () => { S.stockOpen = !S.stockOpen; render(true); },
    'stock-all': () => { for (const v of SH3.weekList(db, S.shopWeek).stock) if (!v.state) SH3.setPantry(db, S.shopWeek, v.key, 'have'); save(); render(true); },
    // Tagebuch
    'tb-add': b => openAdd(b.dataset.meal || ''),
    'tb-quick': () => { S.day = null; openAdd(''); },
    'tb-day': b => { S.day = P.addDays(S.day || today(), +b.dataset.d); render(); },
    'tb-today': () => { S.day = null; render(); },
    'tb-goto': b => { S.day = b.dataset.d; render(true); },
    'tb-all': () => openSheet(allNutrSheet),
    'tb-meal': b => { TB.meal = b.dataset.v; refreshSheet(true); },
    'tb-tab': b => { TB.tab = b.dataset.v; refreshSheet(true); },
    'tb-off': () => runOff(),
    'tb-food': b => { const f = getFood(b.dataset.id); if (f) openAmount(f, { meal: TB.meal, date: TB.date }); },
    'tb-back': () => { stopScan(); if (!TB || AM && AM.edit) { closeSheet(); return; } SH.fn = addSheet; SH.modal = false; refreshSheet(); },
    'tb-fav': () => {
      let f = AM.food;
      if (f.src === 'off' && !(db.foods[f.id] && !db.foods[f.id].del)) f = T.saveFood(db, f);
      T.toggleFav(db, T.findFood(db, f.id) || f); AM.food = T.findFood(db, f.id) || f; save(); refreshSheet(true);
    },
    'am-meal': b => { AM.meal = b.dataset.v; refreshSheet(true); },
    'tb-save': () => {
      const qty = KW.num($('#am-qty').value);
      if (!(qty > 0)) { toast('Bitte eine Menge eingeben'); return; }
      AM.qty = qty; AM.unit = +$('#am-unit').value;
      let f = AM.food;
      if (f.src === 'off' && !(db.foods[f.id] && !db.foods[f.id].del)) f = T.saveFood(db, f); // für „Zuletzt“ und offline
      const pp = AM.unit >= 0 ? f.portions[AM.unit] : null;
      const pl = pp ? (AM.qty === 1 ? pp.label : fNum(AM.qty) + ' × ' + pp.label.replace(/^1\s+/, '')) : null;
      if (AM.edit) { const e = db.log[AM.edit]; KW.put(db, 'log', Object.assign({}, e, { grams: Math.round(amGrams() * 10) / 10, portion: pl, meal: AM.meal })); }
      else T.addLog(db, AM.date, AM.meal, f, amGrams(), pl);
      const ed = AM.edit; save(); closeSheet(); render(true); toast(ed ? 'Gesichert' : 'Eingetragen');
    },
    'tb-del': () => { KW.remove(db, 'log', AM.edit); save(); closeSheet(); render(true); toast('Gelöscht'); },
    'tb-item': b => {
      const id = b.dataset.id;
      if (id.startsWith('lp')) { PI = { planId: id.slice(2), date: S.day || today() }; openSheet(planItemSheet); return; }
      const e = db.log[id]; if (!e || e.del) return;
      const base = T.findFood(db, e.foodId) || { id: e.foodId, name: e.name, brand: e.brand, src: e.src, portions: [] };
      TB = null;
      openAmount(Object.assign({}, base, { per100: e.per100 }), { edit: id, meal: e.meal, date: e.date, unit: -1, qty: e.grams });
    },
    'pi-f': b => { T.setPlanFactor(db, PI.planId, PI.date, +b.dataset.v); save(); refreshSheet(true); render(true); },
    'tb-own': () => { OF = { name: TB.q && !T.isBarcode(TB.q) ? TB.q.trim() : '', brand: '', code: T.isBarcode(TB.q) ? TB.q.trim() : '', per100: {}, pl: '', pg: null }; SH.fn = ownSheet; refreshSheet(); },
    'of-save': () => {
      const name = $('#of-name').value.trim(), kcal = KW.num($('#of-kcal').value);
      if (!name) { toast('Bitte einen Namen eingeben'); return; }
      if (!(kcal >= 0)) { toast('Bitte kcal pro 100 g eingeben'); return; }
      const per100 = {}; for (const k of T.FIELDS) { const v = KW.num($('#of-' + k).value); per100[k] = isFinite(v) ? v : (k === 'kcal' ? 0 : null); }
      const pl = $('#of-pl').value.trim(), pg = KW.num($('#of-pg').value);
      const code = $('#of-code').value.replace(/\D/g, '');
      const f = T.saveFood(db, { name, brand: $('#of-brand').value.trim(), code: code || null, per100, portions: pl && pg > 0 ? [{ label: /^\d/.test(pl) ? pl : '1 ' + pl, g: pg }] : [], src: 'own' });
      save(); if (!TB) TB = { date: S.day || today(), meal: T.mealByTime(new Date().getHours()), q: '', tab: 'recent', off: null };
      SH.modal = false; openAmount(f, { meal: TB.meal, date: TB.date });
    },
    'tb-scan': () => { if (!TB || !SH) TB = { date: S.day || today(), meal: T.mealByTime(new Date().getHours()), q: '', tab: 'recent', off: null }; openScan(); },
    'scan-close': () => { stopScan(); closeSheet(); },
    'scan-go': () => { if (SC2) SC2.busy = true; stopScan(); lookupCode($('#scancode').value); },
    'scan-own': () => { stopScan(); OF = { name: '', brand: '', code: SC2.notFound, per100: {}, pl: '', pg: null }; SH.fn = ownSheet; refreshSheet(); },
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
    paket: () => { if (!PAKET) return; openImport(PAKET.list.map(x => KW.recipeToText(x.recipe)).join('\n\n'), PAKET.list.map(x => x.recipe.name)); },
    'paket-no': () => { paketDone(IM.paket || []); save(); closeSheet(); render(true); toast('Nicht übernommen'); },
    // Abgleich und Sicherung
    'sync-open': () => { SYF = null; openSheet(syncSheet, { modal: !SC.on }); },
    'sync-cancel': () => { SYF = null; closeSheet(); if (fromSetup) { fromSetup = false; openSetup(); } },
    'sync-connect': () => syncConnect(),
    'sync-now': () => runSync(true),
    'sync-share': () => shareText('Kochwerk-Zugang', Y.accessCode(SC)),
    'sync-off': () => confirmSheet('Abgleich trennen?', 'Die Daten bleiben auf diesem Gerät und auf GitHub. Der Schlüssel wird hier gelöscht.', 'Trennen', () => { Object.assign(SC, { on: false, token: '', err: null }); saveSync(); closeSheet(); render(true); toast('Abgleich getrennt'); }),
    'setup-sync': () => { closeSetup(); fromSetup = true; SYF = null; openSheet(syncSheet, { modal: true }); },
    'backup-export': () => exportBackup(),
    'backup-import': () => { const f = $('#bk-file'); f.value = ''; f.click(); },
    'bk-merge': () => { db = KW.merge(db, BK.data).data; save(); closeSheet(); render(true); toast('Sicherung zusammengeführt'); },
    'bk-replace': () => confirmSheet('Alles ersetzen?', 'Alle Daten auf diesem Gerät werden durch die Sicherung ersetzt.', 'Ersetzen', () => { db = BK.data; save(); closeSheet(); render(true); toast('Sicherung übernommen'); }),
    // Kochsession, Boxen, Hunger
    cook: b => openCook(b.dataset.week || S.week || defaultWeek()),
    boxes: () => openSheet(boxSheet, { tall: true }),
    hunger: () => openSheet(hungerSheet),
    crash: () => openSheet(crashSheet),
    'thaw-done': b => { CO.thawDone(db, b.dataset.id); save(); render(true); },
    'ck-close': () => closeCook(),
    'ck-sel': b => { const id = b.dataset.id; CK.sel = CK.sel.includes(id) ? CK.sel.filter(x => x !== id) : CK.sel.concat(id); renderCook(); },
    'ck-start': () => { try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { audio = null; } CK.phase = 'run'; CK.idx = 0; CK.timers = []; ckSave(); renderCook(); },
    'ck-timer': b => {
      try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); if (audio.state === 'suspended') audio.resume(); } catch (e) { audio = null; }
      const st = ckPlan().steps[CK.idx]; if (!st) return;
      const ri = SH3.weekPots(db, CK.week).findIndex(x => x.r.id === st.rid);
      CK.timers.push({ id: KW.uid(), step: CK.idx, label: st.name.split(' ').slice(0, 2).join(' ') + ': ' + st.text.split(' ').slice(0, 4).join(' '), end: Date.now() + (+b.dataset.min) * 60000, c: COLORS[Math.max(0, ri) % COLORS.length] });
      ckSave(); renderCook();
    },
    'ck-timer-x': b => { const t = CK.timers.find(x => x.id === b.dataset.id); if (!t) return; if (t.end <= Date.now()) { CK.timers = CK.timers.filter(x => x !== t); ckSave(); tickTimers(); } else toast('Läuft noch ' + mmss((t.end - Date.now()) / 1000)); },
    'ck-next': () => { const n = ckPlan().steps.length; CK.idx++; if (CK.idx >= n) CK.phase = 'end'; ckSave(); renderCook(); },
    'ck-prev': () => { CK.idx = Math.max(0, CK.idx - 1); ckSave(); renderCook(); },
    'ck-finish': () => { CO.finishCooking(db, CK.week, today(), CK.sel); save(); closeCook(); toast('Guten Appetit!'); },
    // Einkauf
    'shop-tab': b => { S.shopTab = b.dataset.v; render(); },
    'shop-week': b => { S.shopOwn = true; S.shopWeek = P.addDays(S.shopWeek || defaultWeek(), +b.dataset.d); render(); },
    'shop-share': () => shopShare(),
    chk: b => { const it = findItem(b.dataset.key, b.dataset.week); if (!it) return; SH3.check(db, b.dataset.week, it, !it.done); save(); render(true); },
    item: b => { IT = { key: b.dataset.key }; openSheet(itemSheet); },
    'later-on': () => { SH3.setLater(db, S.shopWeek, IT.key, true); save(); closeSheet(); render(true); toast('Auf der Nachkaufliste'); },
    'later-off': () => { SH3.setLater(db, S.shopWeek, IT.key, false); save(); closeSheet(); render(true); toast('Zurück auf der Wochenliste'); },
    pantry: b => { SH3.setPantry(db, S.shopWeek, b.dataset.key, b.dataset.v); save(); render(true); },
    'extra-add': () => { const n = $('#ex-name').value.trim(); if (!n) { $('#ex-name').focus(); return; } SH3.addExtra(db, n, $('#ex-area').value); save(); render(true); const f = $('#ex-name'); if (f) f.focus(); },
    'extra-chk': b => { const x = db.extra[b.dataset.id]; if (x) { KW.put(db, 'extra', Object.assign({}, x, { done: !x.done })); save(); render(true); } },
    'extra-del': b => { KW.remove(db, 'extra', b.dataset.id); save(); render(true); },
    'extra-clear': () => { for (const x of extras()) if (x.done) KW.remove(db, 'extra', x.id); save(); render(true); },
    packs: () => { PL = { q: '' }; openSheet(packsSheet, { tall: true }); },
    'pack-edit': b => openPackEdit(SH3.packList(db).find(p => p.id === b.dataset.id), 'list'),
    'pack-new': () => openPackEdit(null, 'list'),
    'pack-edit-ing': b => { const m = SH3.findPack(db, b.dataset.name); openPackEdit(m || { id: null, name: b.dataset.name, kind: 'Packung', size: '', unit: 'g', area: b.dataset.area }, 'item'); if (!m) PE.id = null; },
    'pack-back': () => { if (PE.back === 'list') { SH.fn = packsSheet; SH.tall = true; $('#sheet .sheet').classList.add('tall'); refreshSheet(); } else if (PE.back === 'item') { SH.fn = itemSheet; refreshSheet(); } else closeSheet(); },
    'pack-save': () => {
      const name = $('#pe-name').value.trim(), size = KW.num($('#pe-size').value);
      if (!name) { toast('Bitte einen Namen eingeben'); return; }
      if (!(size > 0)) { toast('Bitte eine Größe eingeben'); return; }
      const id = PE.id || SH3.packKey(name);
      KW.put(db, 'packs', { id, name: PE.def ? PE.name : name, kind: $('#pe-kind').value.trim() || 'Packung', size, unit: $('#pe-unit').value, area: $('#pe-area').value });
      save(); toast('Gilt ab jetzt'); ACT['pack-back'](); render(true);
    },
    'pack-reset': () => { KW.remove(db, 'packs', PE.id); save(); toast('Standard wiederhergestellt'); ACT['pack-back'](); render(true); },
    'pack-del': () => { if (PE.def) KW.put(db, 'packs', { id: PE.id, name: PE.name, off: true }); else KW.remove(db, 'packs', PE.id); save(); ACT['pack-back'](); render(true); },
    'rest-edit': b => { const x = SH3.rests(db)[b.dataset.key]; if (!x) return; RS = { key: x.key, name: x.name, area: x.area, unit: x.unit, amount: x.amount }; openSheet(restSheet); },
    'rest-new': () => { RS = { isNew: true, name: '', area: 'trocken', unit: 'g', amount: '' }; openSheet(restSheet); },
    'rest-save': () => {
      const a = KW.num($('#rs-amt').value);
      if (!(a >= 0)) { toast('Bitte eine Menge eingeben'); return; }
      if (RS.isNew) { const n = $('#rs-name').value.trim(); if (!n) { toast('Bitte eine Zutat eingeben'); return; } SH3.setRest(db, KW.norm(n), n, $('#rs-area').value, $('#rs-unit').value, a); }
      else SH3.setRest(db, RS.key, RS.name, RS.area, RS.unit, a);
      save(); closeSheet(); render(true);
    },
    'rest-gone': () => { SH3.setRest(db, RS.key, RS.name, RS.area, RS.unit, 0); save(); closeSheet(); render(true); toast('Als aufgebraucht markiert'); },
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
    if (el.id === 'tbq' && TB) { TB.q = el.value; const r = $('#tbres'); if (r) r.innerHTML = addResults(); return; }
    if (el.id === 'am-qty' && AM) { const q = KW.num(el.value); if (q > 0) { AM.qty = q; const t = $('#amtab'); if (t) t.innerHTML = amTable(); } return; }
    if (el.id === 'pq' && PK) { PK.q = el.value; const meal = PK.entryId ? db.plan[PK.entryId].meal : 'snack'; $('#pklist').innerHTML = pickList(PK.all ? KW.CATS.map(c => c.id) : P.catsFor(meal), meal); return; }
    if (el.id === 'ps' && PL) { PL.q = el.value; const q = KW.norm(PL.q); $('#pslist').innerHTML = packRows(SH3.packList(db).filter(p => !q || (p.names || [p.name]).some(n => KW.norm(n).includes(q)))); return; }
    if (el.id === 'q') { S.q = el.value; const l = $('#rlist'); if (l) l.innerHTML = recipeList(); return; }
    if (el.id === 'im-text' && IM) { IM.text = el.value; return; }
    if (el.dataset.w && WZ) { WZ.p[el.dataset.w] = el.value; const n = $('#wnext'); if (n) n.disabled = !wValid(); return; }
    if (el.dataset.f && ED && el.closest('#sheet')) onEditorInput(el, false);
  });
  document.addEventListener('change', e => {
    const el = e.target;
    if (el.dataset.set) { onSetting(el); return; }
    if (el.id === 'bk-file' && el.files && el.files[0]) {
      el.files[0].text().then(t => { const b = Y.parseBackup(t); if (b.error) { toast(b.error); return; } BK = b; openSheet(backupSheet); });
      return;
    }
    if (el.id === 'am-unit' && AM) {
      const g = amGrams(), u = +el.value;
      AM.unit = u; AM.qty = u < 0 ? Math.round(g) : Math.max(0.5, Math.round(g / AM.food.portions[u].g * 2) / 2);
      refreshSheet(true); return;
    }
    if (el.id === 'pi-f' && PI) { const f = KW.num(el.value); if (f >= 0) { T.setPlanFactor(db, PI.planId, PI.date, f); save(); refreshSheet(true); render(true); } return; }
    if (el.dataset.partner) { P.update(db, el.dataset.partner, { partner: el.checked }); save(); render(true); return; }
    if (el.id === 'pk-gap' && PK) { PK.gap = +el.value; return; }
    if (el.dataset.f && ED && el.closest('#sheet') && (el.tagName === 'SELECT' || el.type === 'checkbox')) onEditorInput(el, true);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && SH && !SH.modal) closeSheet();
    if (e.key === 'Enter' && e.target.id === 'ex-name') { e.preventDefault(); ACT['extra-add'](); }
    if (e.key === 'Enter' && e.target.id === 'tbq' && TB && TB.q.trim().length >= 2) { e.preventDefault(); e.target.blur(); runOff(); }
    if (e.key === 'Enter' && e.target.id === 'scancode') { e.preventDefault(); ACT['scan-go'](); }
    if (e.key === 'Enter' && e.target.dataset && e.target.dataset.set) e.target.blur();
  });

  // ---------- Start ----------
  applyTheme();
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { /* egal */ }
  S.tab = 'heute';
  render();
  if (!KW.getSetting(db, 'setupDone')) openSetup(); else askRating();
  if (SC.on) runSync('quiet');
  checkPaket();
  addEventListener('online', () => { if (SC.on) runSync('quiet'); });
  // Zurück in die App (z. B. am nächsten Tag): Heute neu zeichnen und einmal nach dem letzten Gericht fragen
  let lastDay = today();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    if (CK && CK.phase === 'run') { keepAwake(); tickTimers(); }
    if (SC.on && (!SC.last || Date.now() - new Date(SC.last).getTime() > 20000)) runSync('quiet');
    if (lastDay !== today()) { lastDay = today(); if (!SH && !WZ) { S.tab = 'heute'; S.week = null; render(); } }
    askRating();
  });
  // Für Tests im Browser
  window.KochwerkApp = { get db() { return db; }, reload() { db = load(); render(); } };
})();
