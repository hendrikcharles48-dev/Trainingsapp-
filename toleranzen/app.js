/* Toleranzen – Oberfläche: Startliste mit Schnellsuche wie ein Tabellenbuch, darunter die Rechner und Tabellen */
(function () {
  'use strict';
  const T = window.TOL, WK = T.W, ZZ = T.Z;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const f = T.fmt;
  const view = $('#view');

  // Speicher auf dem Gerät (kann fehlen, z. B. im privaten Modus)
  const store = {
    get(k, d) { try { const v = localStorage.getItem('tol.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('tol.' + k, JSON.stringify(v)); } catch (e) { /* ohne Speicher weiter */ } }
  };

  // ---------- Symbole ----------
  const svg = (inner, cls = 'ico') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${inner}</svg>`;
  const I = {
    home: svg('<path d="M3.5 10.8 12 3.8l8.5 7"/><path d="M5.8 9.4V20h4.7v-5.6h3V20h4.7V9.4"/>'),
    book: svg('<path d="M12 6.6C10.1 5.1 7.6 4.5 3.6 4.5v14.2c4 0 6.5.6 8.4 2.1 1.9-1.5 4.4-2.1 8.4-2.1V4.5c-4 0-6.5.6-8.4 2.1Z"/><path d="M12 6.6v14.2"/>'),
    caliper: svg('<rect x="2.8" y="4.6" width="18.4" height="4.4" rx="1.2"/><path d="M4.6 9v9.6l2.8-2.4V9"/><path d="M13.2 9v7.4l2.8-2.2V9"/><path d="M9.4 4.6v2M11.4 4.6v2M17.6 4.6v2M19.4 4.6v2"/>'),
    chevL: svg('<path d="M15 5l-7 7 7 7"/>'),
    chevR: svg('<path d="M9 5l7 7-7 7"/>', 'ico chev'),
    table: svg('<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M3.5 9.5h17M3.5 14.5h17M9.5 9.5v10"/>'),
    plus: svg('<path d="M12 5v14M5 12h14"/>'),
    x: svg('<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>'),
    info: svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v5.2M12 7.7v.3"/>'),
    warn: svg('<path d="M12 3.8 2.8 19.5h18.4Z"/><path d="M12 9.6v4.6M12 16.9v.3"/>'),
    okc: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10.5" fill="currentColor"/><path d="M7.3 12.4l3.1 3.1 6.3-6.6" fill="none" stroke="#fff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    xc: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10.5" fill="currentColor"/><path d="M8.3 8.3l7.4 7.4M15.7 8.3l-7.4 7.4" fill="none" stroke="#fff" stroke-width="2.3" stroke-linecap="round"/></svg>',
    fc: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10.5" fill="currentColor"/><path d="M12 6.8v6.4M12 16.6v.4" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg>',
    mill: svg('<path d="M12 2.8v3.4"/><rect x="8.6" y="6.2" width="6.8" height="13" rx="1.2"/><path d="M8.6 9.6l6.8 2.4M8.6 13l6.8 2.4M8.6 16.4l6.8 2.4"/><path d="M5 21.2h14"/>'),
    list: svg('<path d="M9 6.5h11M9 12h11M9 17.5h11"/><circle cx="4.6" cy="6.5" r=".9"/><circle cx="4.6" cy="12" r=".9"/><circle cx="4.6" cy="17.5" r=".9"/>'),
    bulb: svg('<path d="M9.2 18h5.6M10.2 21h3.6"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.1V16h5v-.1c0-.8.4-1.5 1.1-2.1A6 6 0 0 0 12 3Z"/>'),
    doc: svg('<rect x="4" y="3.5" width="16" height="17" rx="2.5"/><path d="M4 14.6h16M11.4 14.6v5.9M8 7.6h8M8 10.6h5"/>'),
    ruler: svg('<rect x="2.6" y="7.6" width="18.8" height="8.8" rx="1.8"/><path d="M6.2 7.6v3.2M9.4 7.6v2.2M12.6 7.6v3.2M15.8 7.6v2.2M19 7.6v3.2"/>'),
    dia: svg('<circle cx="12" cy="12" r="7.4"/><path d="M4.6 19.4 19.4 4.6"/>'),
    camera: svg('<path d="M3.5 8.5a2 2 0 0 1 2-2h2.2l1.5-2.2h5.6l1.5 2.2h2.2a2 2 0 0 1 2 2v9.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2Z"/><circle cx="12" cy="13" r="3.8"/>'),
    photos: svg('<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="9" cy="9.5" r="1.6"/><path d="m4 17.5 5-5 4 4 2.5-2.5 5 5"/>'),
    pencil: svg('<path d="M4.5 19.5l1-4L16 5a2.1 2.1 0 0 1 3 3L8.5 18.5Z"/><path d="M14 7l3 3"/>'),
    search: svg('<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.4 15.4 20.5 20.5"/>'),
    gdt: svg('<rect x="2.5" y="7" width="19" height="10" rx="1.5"/><path d="M9 7v10M15.5 7v10"/><path d="M4.4 12.8 7.2 11"/><circle cx="12.25" cy="12" r="1.9"/><path d="M17.6 12h2.3"/>'),
    thread: svg('<path d="M8 3.5h8M8 20.5h8"/><path d="M8 6.2l8 2.4M8 9.6l8 2.4M8 13l8 2.4M8 16.4l8 2.4"/><path d="M8 3.5v17M16 3.5v17"/>'),
    hex: svg('<path d="M12 3.2 19.6 7.6v8.8L12 20.8 4.4 16.4V7.6Z"/><circle cx="12" cy="12" r="3.4"/>'),
    torque: svg('<path d="M19.2 12a7.2 7.2 0 1 1-2.1-5.1"/><path d="M17.3 3.4v3.6h-3.6"/><path d="M12 12l3.5-3.5"/><circle cx="12" cy="12" r="1.2"/>'),
    weight: svg('<path d="M6.3 8.5h11.4l2.6 11.5H3.7Z"/><circle cx="12" cy="5.6" r="2.3"/>'),
    tri: svg('<path d="M4 19.5h16L4 5.5Z"/><path d="M4 15.5h4v4"/>'),
    rough: svg('<path d="M3 15.5l2-3 1.6 2.6 2-4.6 1.8 3.6 1.7-2.4 2 3.4 1.6-5 2 4.2 2.3-2.4"/><path d="M3 19.5h18"/>'),
    trow: svg('<path d="M4 9.5h16l-1.6 9a2 2 0 0 1-2 1.6H7.6a2 2 0 0 1-2-1.6Z"/><path d="M8.5 13.5l1.5 1M12 12.5l.8 1.6M14.6 14.6l1.6-.6M10.4 16.6l1.4-.4"/><path d="M8 6.5c.8-1 1.8-1 2.6 0s1.8 1 2.6 0 1.8-1 2.6 0"/>')
  };

  // Symbole für Form und Lage (wie auf der Zeichnung)
  const gd = inner => `<svg class="gdt" viewBox="0 0 24 24" aria-hidden="true">${inner}</svg>`;
  const SYM = {
    geradheit: gd('<path d="M3.5 12h17"/>'),
    ebenheit: gd('<path d="M8 7.5h13l-5 9H3z"/>'),
    rundheit: gd('<circle cx="12" cy="12" r="7.2"/>'),
    rechtwinkligkeit: gd('<path d="M12 4.5v14.5M4 19h16"/>'),
    parallelitaet: gd('<path d="M6.5 19.5l5-15M12.5 19.5l5-15"/>'),
    position: gd('<circle cx="12" cy="12" r="5.4"/><path d="M12 2.8v18.4M2.8 12h18.4"/>'),
    rundlauf: gd('<path d="M5 19l10.4-10.4"/><path class="fillc" d="M19.5 4.5l-2 5.8-3.8-3.8z"/>'),
    profil: gd('<path d="M3.5 16.5a8.5 8.5 0 0 1 17 0z"/>'),
    zylinderform: gd('<circle cx="12" cy="12" r="5.6"/><path d="M4.5 20.5l6-17M13.5 20.5l6-17"/>'),
    linienform: gd('<path d="M3.5 16.5a8.5 8.5 0 0 1 17 0"/>'),
    neigung: gd('<path d="M4 19h16M4 19 17.5 6"/>'),
    koaxialitaet: gd('<circle cx="12" cy="12" r="7.6"/><circle cx="12" cy="12" r="3.6"/>'),
    symmetrie: gd('<path d="M4 7.5h16M2.5 12h19M4 16.5h16"/>'),
    gesamtlauf: gd('<path d="M4.5 19.5h15"/><path d="M7 19.5 13 8.5M13 19.5 19 8.5"/><path class="fillc" d="M15.4 4.2l-.9 5.6-3.3-1.8zM21.4 4.2l-.9 5.6-3.3-1.8z"/>')
  };
  const GEO_SHORT = { geradheit: 'Gerad&shy;heit', ebenheit: 'Eben&shy;heit', rundheit: 'Rund&shy;heit', rechtwinkligkeit: 'Recht&shy;winklig&shy;keit', parallelitaet: 'Paral&shy;lelität', position: 'Position', rundlauf: 'Rund&shy;lauf' };
  const fcf = cells => `<span class="fcf">${cells.map(c => `<span>${c}</span>`).join('')}</span>`;

  // ---------- Zustand und Navigation ----------
  // Startliste wie im Tabellenbuch; jeder Eintrag öffnet eine Seite, manche Seiten haben mehrere Rechner (Reiter oben)
  const PAGES = [
    { id: 'tol', title: 'Toleranzen', sub: 'ISO 286, Passung, Allgemein, Form/Lage, Maßkette, Foto', tags: 'ISO 286 · Passung · Allgemein · Form/Lage · Maßkette · Foto', icon: 'dia', color: '#5856D6', secs: ['iso', 'fit', 'gen', 'ang', 'geo', 'gdt', 'chain', 'foto'] },
    { id: 'cut', title: 'Zerspanung', sub: 'Fräsen, Bohren, Drehen, Oberfläche, Gleitschleifen', tags: 'Fräsen · Bohren · Drehen · Oberfläche · Gleitschleifen', icon: 'mill', color: '#FF3B30', secs: ['mill', 'drill', 'turn', 'cutref', 'roughtab', 'trow'] },
    { id: 'thread', title: 'Gewinde und Schrauben', sub: 'Gewinde, Kernloch, Schlüsselweite, Drehmoment', tags: 'Gewinde · Kernloch · SW · Drehmoment', icon: 'thread', color: '#FF9500', secs: ['thread', 'threadtab', 'sw', 'swtab', 'torque'] },
    { id: 'geom', title: 'Geometrie', sub: 'Dreieck, Kegel, Lochkreis, Gewicht', tags: 'Dreieck · Kegel · Lochkreis · Gewicht', icon: 'tri', color: '#34C759', secs: ['tri', 'tri2', 'cone', 'bolt', 'weight'] },
    { id: 'info', title: 'Info', sub: 'Darstellung, Normen, Hinweise', tags: '', icon: 'info', color: '#636366', secs: ['info'] }
  ];
  const pageOf = id => PAGES.find(p => p.id === id);
  // Eigene Reihenfolge der Startliste (gedrückt halten und verschieben)
  function orderedPages() {
    const ord = store.get('menuOrder', []);
    const list = (Array.isArray(ord) ? ord : []).map(pageOf).filter(Boolean);
    PAGES.forEach(p => { if (!list.includes(p)) list.push(p); });
    return list;
  }
  const pageOfSec = sec => PAGES.find(p => p.secs.includes(sec));
  const S = {
    page: pageOf(store.get('page')) ? store.get('page') : 'home',
    q: '',
    scroll: {},
    hist: 0
  };

  const OPEN = new Set(store.get('open', [])); // offene Rechenwege
  const persistNav = () => store.set('page', S.page);
  const saveScroll = () => { S.scroll[S.page] = window.scrollY; };

  function openPage(id, sec) {
    if (!pageOf(id)) return;
    if (sec) A.secs[id] = sec;
    saveA();
    if (S.page === id) { render('fade'); return; }
    saveScroll();
    S.page = id;
    try { history.pushState({ tol: 1 }, ''); S.hist++; } catch (e) { /* ohne Verlauf */ }
    render('push');
  }
  // Zu einem Rechner springen, auch auf einer anderen Seite
  function goSection(sec) {
    const pg = pageOfSec(sec);
    if (!pg) return;
    if (S.page === pg.id) showSection(sec);
    else openPage(pg.id, sec);
  }
  function popView() {
    if (S.page === 'home') return;
    saveScroll();
    S.page = 'home';
    render('pop');
  }
  function back() {
    if (S.hist > 0) { try { history.back(); return; } catch (e) { /* weiter unten */ } }
    popView();
  }
  window.addEventListener('popstate', () => {
    if (S.hist > 0) S.hist--;
    if (!$('#sheet').hidden) { closeSheet(); return; }
    popView();
  });

  function navbar({ title, back: backLabel, right }) {
    return `<header class="nav" id="nav"><div class="nav-inner">
      <div class="nav-left">${backLabel ? `<button class="nav-back" data-act="back" aria-label="Zurück zu ${esc(backLabel)}">${I.chevL}<span>${esc(backLabel)}</span></button>` : ''}</div>
      <div class="nav-title" aria-hidden="true">${esc(title)}</div>
      <div class="nav-right">${right || ''}</div>
    </div></header>`;
  }

  function render(anim) {
    view.innerHTML = S.page === 'home' ? viewHome() : viewPage();
    view.className = anim ? 'enter-' + anim : '';
    if (S.page === 'home') { renderSearch(); initMenuDrag(); }
    else { computeCurrent(); initSecDrag(); }
    window.scrollTo(0, anim === 'push' ? 0 : (S.scroll[S.page] || 0));
    onScroll();
    persistNav();
  }
  view.addEventListener('animationend', () => { view.className = ''; });

  function onScroll() {
    const nav = $('#nav');
    if (!nav) return;
    const lt = $('.large-title, .task-title');
    const th = lt ? lt.getBoundingClientRect().bottom + window.scrollY - nav.offsetHeight - 6 : 4;
    nav.classList.toggle('scrolled', window.scrollY > Math.max(4, th));
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  // ---------- Bausteine ----------
  function segHTML(key, value, options, cls = '', attr = 'data-k') {
    return `<div class="seg ${cls}" ${attr}="${esc(key)}" role="group">${options.map(o => {
      const [v, l, s] = o;
      return `<button type="button" data-v="${esc(v)}" aria-pressed="${String(value) === String(v)}">${l}${s ? `<small>${s}</small>` : ''}</button>`;
    }).join('')}</div>`;
  }
  function numInput({ id, attrs, raw, unit, signed, pm, placeholder, label }) {
    let sign = '+', val = raw == null ? '' : String(raw);
    if (signed) {
      if (/^\s*[-−]/.test(val)) { sign = '−'; val = val.replace(/^\s*[-−]\s*/, ''); } else val = val.replace(/^\s*\+\s*/, '');
    }
    return `<div class="inp">${signed ? `<button type="button" class="sign" aria-label="Vorzeichen: ${sign === '−' ? 'minus' : 'plus'}. Tippen zum Wechseln">${sign}</button>` : ''}${pm ? '<span class="pre">±</span>' : ''}<input id="${id}" ${attrs} inputmode="decimal" enterkeyhint="next" autocomplete="off" autocorrect="off" spellcheck="false" value="${esc(val)}" placeholder="${esc(placeholder || '')}"${label ? ` aria-label="${esc(label)}"` : ''}>${unit ? `<span class="unit">${esc(unit)}</span>` : ''}</div>`;
  }
  function signedValue(inp) {
    const sb = inp.parentElement.querySelector('.sign');
    const v = inp.value.trim();
    return sb && sb.textContent === '−' && v ? '-' + v : v;
  }
  function normalizeSigned(inp) {
    const sb = inp.parentElement.querySelector('.sign');
    if (!sb) return;
    const m = /^\s*([+\-−–])\s*/.exec(inp.value);
    if (m) { sb.textContent = m[1] === '+' ? '+' : '−'; inp.value = inp.value.slice(m[0].length); }
  }
  const kv = (k, v, full) => `<div${full ? ' class="full"' : ''}><span>${k}</span><b>${v}</b></div>`;
  const msgHTML = (text, kind = 'info') => `<div class="msg ${kind}">${kind === 'warn' ? I.warn : I.info}<div>${text}</div></div>`;
  function calcHTML(key, steps, label = 'Rechenweg') {
    return `<details class="calc" data-calc="${key}"${OPEN.has(key) ? ' open' : ''}><summary><span>${label}</span>${I.chevR}</summary><ol class="calc-steps">${steps.map(s => `<li><div class="cs-t">${esc(s.t)}</div><div class="cs-h">${s.h}</div></li>`).join('')}</ol></details>`;
  }
  document.addEventListener('toggle', e => {
    const d = e.target;
    if (d && d.matches && d.matches('details[data-calc]')) { if (d.open) OPEN.add(d.dataset.calc); else OPEN.delete(d.dataset.calc); store.set('open', [...OPEN]); }
  }, true);

  // Toleranzfelder zur Nulllinie, maßstäblich
  function zoneSVG(fields, title) {
    const W = 340, H = 200, top = 22, bot = 40, left = 58, right = 14;
    let hi = 0, lo = 0;
    fields.forEach(z => { hi = Math.max(hi, z.upper); lo = Math.min(lo, z.lower); });
    let span = hi - lo || 1;
    hi += span * 0.1; lo -= span * 0.1; span = hi - lo;
    const y = v => top + (hi - v) / span * (H - top - bot);
    const slot = (W - left - right) / fields.length;
    const y0 = y(0);
    let s = `<svg class="zone" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title)}">`;
    s += `<line class="z-zero" x1="${left - 4}" x2="${W - right}" y1="${y0}" y2="${y0}"/>`;
    s += `<text class="z-lbl" x="${left - 10}" y="${y0 + 4}" text-anchor="end">0 µm</text><text class="z-cap" x="${left - 10}" y="${y0 + 17}" text-anchor="end">Nulllinie</text>`;
    fields.forEach((z, i) => {
      const cx = left + slot * (i + 0.5), bw = Math.min(70, slot * 0.46);
      const y1 = y(z.upper), y2 = y(z.lower), h = Math.max(2, y2 - y1);
      s += `<rect class="${z.hole ? 'z-hole' : 'z-shaft'}" x="${(cx - bw / 2).toFixed(1)}" y="${y1.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="3"/>`;
      let ly1 = y1 + 4, ly2 = y2 + 4;
      if (y2 - y1 < 16) { const m = (y1 + y2) / 2; ly1 = m - 4; ly2 = m + 12; }
      const lx = cx + bw / 2 + 6;
      if (z.upper !== 0) s += `<text class="z-val" x="${lx.toFixed(1)}" y="${ly1.toFixed(1)}">${T.umS(z.upper)}</text>`;
      if (z.lower !== 0) s += `<text class="z-val" x="${lx.toFixed(1)}" y="${ly2.toFixed(1)}">${T.umS(z.lower)}</text>`;
      s += `<text class="z-name" x="${cx.toFixed(1)}" y="${H - 12}" text-anchor="middle">${esc(z.name)}</text>`;
    });
    return s + '</svg>';
  }

  // ---------- Tabellen zum Nachschlagen ----------
  function table(head, rows, cap) {
    return `${cap ? `<div class="tbl-cap">${cap}</div>` : ''}<div class="tbl-wrap"><table class="tbl"><thead><tr>${head.map(h => `<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map((c, i) => i === 0 ? `<th scope="row">${c}</th>` : `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  const pmv = x => x == null ? '–' : '±' + f(x);
  const TABLES = {
    '2768-1': {
      t: 'ISO 2768-1: Längen, Radien, Fasen, Winkel',
      h: () => table(['Nennmaß in mm', 'f fein', 'm mittel', 'c grob', 'v sehr grob'], T.LIN2768.ranges.map((r, i) => [T.linRangeText(i).replace(' mm', ''), ...['f', 'm', 'c', 'v'].map(c => pmv(T.LIN2768[c][i]))]), 'Längenmaße, Grenzabmaße in mm') +
        table(['Nennmaß in mm', 'f und m', 'c und v'], T.RAD2768.ranges.map((r, i) => [T.radRangeText(i).replace(' mm', ''), pmv(T.RAD2768.m[i]), pmv(T.RAD2768.c[i])]), 'Rundungshalbmesser und Fasenhöhen, Grenzabmaße in mm') +
        table(['Kürzerer Schenkel in mm', 'f und m', 'c', 'v'], T.ANG2768.ranges.map((r, i) => [T.angRangeText(i).replace(' mm', ''), T.devText(T.ANG2768.m[i]), T.devText(T.ANG2768.c[i]), T.devText(T.ANG2768.v[i])]), 'Winkelmaße, Grenzabmaße in Grad und Minuten') +
        '<p class="tbl-note">Unter 0,5 mm gibt es keine Allgemeintoleranz, die Abweichung steht dann direkt am Maß. Ein Strich heißt: für diesen Bereich kein Wert festgelegt.</p>'
    },
    '2768-2': {
      t: 'ISO 2768-2: Form und Lage',
      h: () => table(['Nennlänge in mm', 'H', 'K', 'L'], T.STRAIGHT2768.ranges.map((r, i) => [T.strRangeText(i).replace(' mm', ''), ...['H', 'K', 'L'].map(c => f(T.STRAIGHT2768[c][i]))]), 'Geradheit und Ebenheit in mm') +
        table(['Kürzerer Schenkel in mm', 'H', 'K', 'L'], T.PERP2768.ranges.map((r, i) => [T.perpRangeText(i).replace(' mm', ''), ...['H', 'K', 'L'].map(c => f(T.PERP2768[c][i]))]), 'Rechtwinkligkeit in mm') +
        table(['Kürzeres Element in mm', 'H', 'K', 'L'], T.SYM2768.ranges.map((r, i) => [T.perpRangeText(i).replace(' mm', ''), ...['H', 'K', 'L'].map(c => f(T.SYM2768[c][i]))]), 'Symmetrie in mm') +
        table(['', 'H', 'K', 'L'], [['Lauf', f(T.RUN2768.H), f(T.RUN2768.K), f(T.RUN2768.L)]], 'Lauf (Rundlauf und Planlauf) in mm') +
        '<p class="tbl-note">Rundheit: so groß wie die Durchmessertoleranz, aber höchstens so groß wie der Lauf. Parallelität: Maßtoleranz oder Ebenheit, der größere Wert gilt. Bezug ist jeweils das längere Element. Für die Position gibt es keine Tabelle, es gelten die Abstandsmaße nach ISO 2768-1.</p>'
    },
    it: {
      t: 'Grundtoleranzen (IT-Werte) in µm',
      h: () => table(['Nennmaß in mm', ...T.IT_GRADES.map(g => 'IT' + g)], T.RANGES.map((r, i) => [T.rangeText(i).replace(' mm', ''), ...T.IT_GRADES.map(g => f(T.IT[g][i]))])) +
        '<p class="tbl-note">Nach ISO 286-1. IT14 bis IT18 werden für Nennmaße bis 1 mm nicht verwendet. 1000 µm sind 1 mm.</p>'
    },
    grund: {
      t: 'Grundabmaße in µm',
      h: () => {
        const v = x => x == null ? '–' : T.fmtS(x);
        const fineRow = i => T.fineText(i).replace(' mm', '');
        const up = ['a', 'b', 'c', 'cd', 'd', 'e', 'ef', 'f', 'fg', 'g'];
        const upRows = T.FINE.map((r, i) => [fineRow(i), ...up.map(l => v(T.SHAFT_FUND[l][i])), '0']);
        const midRows = T.RANGES.map((r, i) => [T.rangeText(i).replace(' mm', ''), v(T.SHAFT_J['5'][i]), v(T.SHAFT_J['7'][i]), v(T.SHAFT_J['8'][i]), T.fmtS(T.SHAFT_K[i]), ...['m', 'n', 'p'].map(l => T.fmtS(T.SHAFT_LOWER[l][i]))]);
        const lo = ['r', 's', 't', 'u', 'v', 'x', 'y', 'z', 'za', 'zb', 'zc'];
        const loRows = T.FINE.map((r, i) => [fineRow(i), ...lo.map(l => v(T.SHAFT_FUND[l][i]))]);
        const jRows = T.RANGES.map((r, i) => [T.rangeText(i).replace(' mm', ''), ...['6', '7', '8'].map(g => T.fmtS(T.HOLE_J[g][i]))]);
        const dRows = T.RANGES.map((r, i) => [T.rangeText(i).replace(' mm', ''), ...['3', '4', '5', '6', '7', '8'].map(g => f(T.delta(g, i)))]);
        return table(['Nennmaß in mm', ...up, 'h'], upRows, 'Wellen a bis h: oberes Abmaß es') +
          '<p class="tbl-note">a und b gibt es nicht für Nennmaße bis 1 mm. cd, ef und fg sind nur bis 10 mm festgelegt (Feinwerktechnik). d bis g ändern sich nur an den groben Bereichsgrenzen.</p>' +
          table(['Nennmaß in mm', 'j IT5/6', 'j IT7', 'j IT8', 'k*', 'm', 'n', 'p'], midRows, 'Wellen j bis p: unteres Abmaß ei') +
          '<p class="tbl-note">* k: Der Wert gilt nur für IT4 bis IT7. Bei IT3 und feiner sowie ab IT8 ist das untere Abmaß 0. j gibt es nur für IT5 bis IT8, j8 nur bis 3 mm.</p>' +
          table(['Nennmaß in mm', ...lo], loRows, 'Wellen r bis zc: unteres Abmaß ei') +
          '<p class="tbl-note">Ein Strich heißt: in der Norm kein Wert. t beginnt über 24 mm, v über 14 mm, y über 18 mm.</p>' +
          table(['Nennmaß in mm', 'J IT6', 'J IT7', 'J IT8'], jRows, 'Bohrung J: oberes Abmaß ES') +
          table(['Nennmaß in mm', 'IT3', 'IT4', 'IT5', 'IT6', 'IT7', 'IT8'], dRows, 'Zuschlag (Delta) für Bohrungen') +
          `<div class="tbl-note"><p><b>Bohrungen A bis H:</b> Das untere Abmaß ist das obere Abmaß der gleichnamigen Welle mit umgedrehtem Vorzeichen. Beispiel F bei 18 bis 30 mm: Welle f hat −20 µm, Bohrung F hat +20 µm.</p>
          <p><b>Bohrung J:</b> eigene Tabelle oben, nur IT6 bis IT8.</p>
          <p><b>Bohrungen K, M, N bis IT8 sowie P bis ZC bis IT7:</b> Das obere Abmaß ist das Grundabmaß der gleichnamigen Welle mit umgedrehtem Vorzeichen plus Zuschlag. Bei K nimmst du den Wert von k aus der Spalte IT4 bis IT7.</p>
          <p><b>Darüber:</b> K ab IT9 oben 0. M ab IT9 wie Welle m mit umgedrehtem Vorzeichen. N ab IT9 oben 0, bis 3 mm −4 µm. P bis ZC ab IT8 ohne Zuschlag. Sonderfall M6 über 250 bis 315 mm: oben −9 µm.</p>
          <p><b>js und JS:</b> halber IT-Wert nach oben und unten. Bei IT7 bis IT11 wird ein ungerader IT-Wert vorher auf die nächste gerade Zahl abgerundet.</p></div>`;
      }
    }
  };
  const tableSection = id => `<section><h3>${esc(TABLES[id].t)}</h3>${TABLES[id].h()}</section>`;

  function openSheet(ids) {
    const w = $('#sheet');
    w.innerHTML = `<div class="sheet-backdrop" data-act="close-sheet"></div>
      <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
        <div class="sheet-grab" aria-hidden="true"></div>
        <div class="sheet-head"><h2 id="sheet-title">Tabellen</h2><button class="nav-btn" data-act="close-sheet">Fertig</button></div>
        <div class="sheet-body">${ids.map(tableSection).join('')}</div>
      </div>`;
    w.hidden = false;
    document.body.classList.add('sheet-open');
    document.documentElement.style.overflow = 'hidden';
    const sh = $('.sheet', w), head = $('.sheet-head', w), grab = $('.sheet-grab', w);
    let sy = null, dy = 0;
    const start = e => { sy = e.touches[0].clientY; dy = 0; sh.style.transition = 'none'; };
    const move = e => { if (sy == null) return; dy = Math.max(0, e.touches[0].clientY - sy); sh.style.transform = `translateY(${dy}px)`; };
    const end = () => { if (sy == null) return; sy = null; sh.style.transition = 'transform .25s'; if (dy > 90) closeSheet(); else sh.style.transform = ''; };
    [head, grab].forEach(el => { el.addEventListener('touchstart', start, { passive: true }); el.addEventListener('touchmove', move, { passive: true }); el.addEventListener('touchend', end); });
    setTimeout(() => $('[data-act="close-sheet"].nav-btn', w).focus({ preventScroll: true }), 50);
  }
  function closeSheet() {
    const w = $('#sheet');
    if (w.hidden) return;
    const sh = $('.sheet', w);
    if (sh) { sh.style.transition = 'transform .22s'; sh.style.transform = 'translateY(100%)'; }
    document.body.classList.remove('sheet-open');
    document.documentElement.style.overflow = '';
    setTimeout(() => { w.hidden = true; w.innerHTML = ''; }, 200);
  }

  // ================================================================
  // Startseite: Schnellsuche und Liste
  // ================================================================
  const tileIcon = (pg, cls = 'mi') => `<span class="${cls}" style="--c:${pg.color}">${I[pg.icon] || I.info}</span>`;
  function viewHome() {
    return `${navbar({ title: 'Toleranzen' })}<div class="page home">
      <h1 class="large-title">Toleranzen</h1>
      <div class="search-row">
        <label class="search">${I.search}<input id="q" type="search" value="${esc(S.q)}" placeholder="Schnellsuche (z. B. M3, 6H7)" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="search" aria-label="Schnellsuche"></label>
        <button type="button" class="search-x" data-act="q-clear" aria-label="Suche leeren"${S.q ? '' : ' hidden'}>${I.x}</button>
      </div>
      <div id="q-res"></div>
      <nav class="tiles" id="menu" aria-label="Bereiche"${S.q ? ' hidden' : ''}>${orderedPages().filter(pg => pg.id !== 'info').map(pg => `<button type="button" class="tile" data-page="${pg.id}" style="--c:${pg.color}"><span class="tile-ic">${I[pg.icon]}</span><span class="tile-t">${esc(pg.title)}</span><span class="tile-s">${esc(pg.tags)}</span></button>`).join('')}</nav>
      <button type="button" class="info-bar" data-page="info" id="info-bar"${S.q ? ' hidden' : ''}>${tileIcon(pageOf('info'))}<span class="mt"><span class="mt1">Info</span><span class="mt2">Darstellung, Bedienung, Normen</span></span>${I.chevR}</button>
      <p class="foot center">Kacheln gedrückt halten und verschieben, um die Reihenfolge zu ändern.</p>
    </div>`;
  }
  function renderSearch() {
    const box = $('#q-res'), menu = $('#menu'), x = $('[data-act="q-clear"]');
    if (!box) return;
    const q = S.q.trim();
    if (x) x.hidden = !S.q;
    if (menu) menu.hidden = !!q;
    const ib = $('#info-bar');
    if (ib) ib.hidden = !!q;
    if (!q) { box.innerHTML = ''; return; }
    const res = WK.search(q);
    box.innerHTML = res.length
      ? `<div class="menu">${res.map((r, i) => `<button type="button" class="menu-row" data-hit="${i}">${tileIcon(pageOf(r.page))}<span class="mt"><span class="mt1">${esc(r.title)}</span><span class="mt2">${esc(r.sub)}</span></span>${I.chevR}</button>`).join('')}</div>`
      : msgHTML(`Zu „${esc(q)}“ habe ich nichts gefunden. Probier zum Beispiel M8, M10x1, G1/2, 30H7, 25H7/g6, SW13, N7 oder ein Stichwort wie Kernloch.`);
    box._res = res;
  }
  function openHit(r) {
    if (!r) return;
    if (r.kind === 'thread') { A.thread.q = r.q; openPage('thread', 'thread'); return; }
    if (r.kind === 'iso') { A.iso.q = r.q; openPage('tol', 'iso'); return; }
    if (r.kind === 'fit') { A.fit.hole = r.hole; A.fit.shaft = r.shaft; openPage('tol', 'fit'); return; }
    openPage(r.page, r.sec);
  }

  // Startliste umsortieren: gedrückt halten (0,38 s), dann nach oben oder unten ziehen
  let menuClickBlock = 0;
  function initMenuDrag() {
    const menu = $('#menu');
    if (!menu) return;
    let timer = null, drag = null, sx = 0, sy = 0, raf = 0;
    function begin(tile, x, y) {
      drag = { tile, x0: x, y0: y, x, y, ox: tile.offsetLeft, oy: tile.offsetTop, sc0: window.scrollY };
      tile.classList.add('lifting');
      menu.classList.add('reordering');
      try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) { /* kein Vibrieren */ }
      const tick = () => {
        if (!drag) return;
        if (drag.y < 70) window.scrollBy(0, -6); else if (drag.y > window.innerHeight - 70) window.scrollBy(0, 6);
        update(drag.x, drag.y);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }
    function update(x, y) {
      drag.x = x; drag.y = y;
      const tiles = $$('.tile', menu);
      const target = tiles.find(t => { if (t === drag.tile) return false; const r = t.getBoundingClientRect(); return x > r.left && x < r.right && y > r.top && y < r.bottom; });
      if (target) {
        const i = tiles.indexOf(drag.tile), j = tiles.indexOf(target);
        menu.insertBefore(drag.tile, j > i ? target.nextSibling : target);
      }
      const tx = x - drag.x0 - (drag.tile.offsetLeft - drag.ox);
      const ty = y - drag.y0 + window.scrollY - drag.sc0 - (drag.tile.offsetTop - drag.oy);
      drag.tile.style.transform = `translate(${tx}px, ${ty}px) scale(1.04)`;
    }
    function finish() {
      clearTimeout(timer);
      if (!drag) return;
      cancelAnimationFrame(raf);
      drag.tile.style.transform = '';
      drag.tile.classList.remove('lifting');
      menu.classList.remove('reordering');
      drag = null;
      store.set('menuOrder', $$('.tile', menu).map(b => b.dataset.page));
      menuClickBlock = Date.now() + 450;
    }
    menu.addEventListener('touchstart', e => {
      const b = e.target.closest('.tile');
      if (!b || e.touches.length > 1) return;
      sx = e.touches[0].clientX; sy = e.touches[0].clientY;
      clearTimeout(timer);
      timer = setTimeout(() => begin(b, sx, sy), 380);
    }, { passive: true });
    menu.addEventListener('touchmove', e => {
      const t = e.touches[0];
      if (!drag) { if (Math.hypot(t.clientX - sx, t.clientY - sy) > 8) clearTimeout(timer); return; }
      e.preventDefault();
      update(t.clientX, t.clientY);
    }, { passive: false });
    menu.addEventListener('touchend', finish);
    menu.addEventListener('touchcancel', finish);
    menu.addEventListener('contextmenu', e => e.preventDefault());
    menu.addEventListener('mousedown', e => {
      const b = e.target.closest('.tile');
      if (!b || e.button !== 0) return;
      sx = e.clientX; sy = e.clientY;
      timer = setTimeout(() => begin(b, sx, sy), 380);
      const mm = ev => { if (!drag) { if (Math.hypot(ev.clientX - sx, ev.clientY - sy) > 8) clearTimeout(timer); return; } ev.preventDefault(); update(ev.clientX, ev.clientY); };
      const mu = () => { window.removeEventListener('mousemove', mm); window.removeEventListener('mouseup', mu); finish(); };
      window.addEventListener('mousemove', mm);
      window.addEventListener('mouseup', mu);
    });
  }

  // Eine Seite: Reiter oben (wenn mehrere Rechner), darunter der gewählte Rechner
  function viewPage() {
    const pg = pageOf(S.page), sec = curSection();
    const list = orderedSections();
    return `${navbar({ title: pg.title, back: 'Start' })}<div class="page">
      <h1 class="large-title">${esc(pg.title)}</h1>
      ${list.length > 1 ? `<nav class="sec-bar" id="sec-bar" aria-label="Auswahl">${list.map(x => `<button type="button" data-sec="${x.id}" aria-pressed="${x.id === sec.id}">${x.label}</button>`).join('')}</nav>` : ''}
      <div id="sec-body" class="page">${sectionHTML()}</div>
      ${list.length > 1 ? '<p class="foot">Zum Wechseln seitlich wischen. Reihenfolge ändern: Reiter gedrückt halten und verschieben.</p>' : ''}
    </div>`;
  }


  let themeSet = false;
  function applyTheme(t) {
    const r = document.documentElement;
    if (t === 'light' || t === 'dark') { r.setAttribute('data-theme', t); themeSet = true; }
    else if (themeSet) { r.removeAttribute('data-theme'); themeSet = false; }
  }


  // ================================================================
  // Anwenden
  // ================================================================
  const A_DEF = {
    ang: { L: '40', nom: '90', cls: 'm' },
    geo: { prop: 'ebenheit', ml: 'm', hk: 'K', len: '120', dia: '30', dist: '20', own: '', x: '45', y: '25' },
    iso: { q: '10H8' },
    fit: { hole: '30H7', shaft: 'g6', sys: 'EB' },
    gen: { tab: 'alt', N: '120', kind: 'len', cls: 'm', hk: 'K', mode: 'profil', pN: '50', t: '0,4', rel: 'bezug', sN: '20', sdev: '0,1' },
    foto: { ml: 'm', hk: 'K', items: [], detected: null },
    chain: { rows: [{ op: 1, N: '10', mode: 'pm', pm: '0,2', up: '', lo: '', iso: '' }, { op: 1, N: '5', mode: 'pm', pm: '0,3', up: '', lo: '', iso: '' }] },
    thread: { q: 'M8', kind: 'M', n: '' },
    mill: { sk: 'Rz', d: '10', z: '4', r: '', vc: '', n: '', fz: '', f: '', vf: '', Rz: '', Ra: '', ae: '', ap: '', Q: '', mat: 's235', tool: 'vhm', op: 'side', auto: 'on', ord: ['d', 'z'] },
    drill: { d: '8', vc: '', n: '', f: '', vf: '', Q: '', mat: 's235', tool: 'dvhm', thr: 'M8', auto: 'on', ord: ['d'] },
    turn: { sk: 'Rz', d: '50', r: '', vc: '', n: '', f: '', vf: '', Rz: '', Ra: '', ap: '', Q: '', mat: 's235', tool: 'tmed', auto: 'on', ord: ['d'] },
    mach: { nmax: '', vfmax: '', nmaxT: '' },
    sw: { d: '8' },
    torque: { d: '8', cls: '8.8' },
    weight: { shape: 'rund', d: '20', D: '', s: '', b: '', h: '', a: '', t: '', L: '1000', mat: '0', rho: '' },
    tri: { a: '30', b: '40', c: '', al: '', be: '', ord: ['a', 'b'] },
    cone: { D: '40', d: '30', L: '50', a: '', ord: ['D', 'd', 'L'] },
    bolt: { D: '100', n: '6', start: '0', cx: '0', cy: '0', dir: 'ccw' },
    tri2: { mode: 'SSS', a: '5', b: '6', c: '7', al: '', be: '' },
    trow: { V: '50', fill: '80', mix: 'fein', media: 'ker' }
  };
  const A = (() => {
    const saved = store.get('apply', {}) || {};
    const out = {};
    Object.keys(A_DEF).forEach(k => { out[k] = Object.assign({}, A_DEF[k], saved[k] && typeof saved[k] === 'object' && !Array.isArray(saved[k]) ? saved[k] : {}); });
    if (!Array.isArray(out.foto.items)) out.foto.items = [];
    if (!Array.isArray(out.chain.rows) || !out.chain.rows.length) out.chain.rows = A_DEF.chain.rows.map(r => Object.assign({}, r));
    out.secs = saved.secs && typeof saved.secs === 'object' ? saved.secs : {};
    ['mill', 'drill', 'turn'].forEach(m => {   // alte Werkstoff- und Werkzeug-Kennungen
      if (!T.Z.MATERIALS.some(x => x.id === out[m].mat)) out[m].mat = 's235';
      if (!T.Z.TOOLS.some(x => x.id === out[m].tool && x.mode === m)) out[m].tool = A_DEF[m].tool;
    });
    ['mill', 'turn'].forEach(m => {   // nur eine Oberflächenangabe sichtbar: die andere darf keine Vorgabe sein
      const o = out[m];
      if (!String(o.Rz || '').trim() && String(o.Ra || '').trim()) o.sk = 'Ra';
      if (o.sk === 'Ra') o.Rz = ''; else { o.sk = 'Rz'; o.Ra = ''; }
    });
    out.order = Array.isArray(saved.order) ? saved.order.filter(x => typeof x === 'string') : null;
    return out;
  })();
  const saveA = () => store.set('apply', A);
  const getK = k => { const [a, b] = k.split('.'); return A[a][b]; };
  const setK = (k, v) => { const [a, b] = k.split('.'); A[a][b] = v; saveA(); };
  const numOf = s => T.parseNum(s);
  const optNum = s => String(s || '').trim() ? T.parseNum(s) : null;
  const tblBtn = ids => `<button class="link-btn" data-act="open-tables" data-tables="${ids}">${I.table}Tabelle</button>`;
  const bindNum = (id, k, unit, ph, extra = {}) => numInput(Object.assign({ id, attrs: `data-k="${k}"`, raw: getK(k), unit, placeholder: ph }, extra));
  const CLS_ML = [['f', 'f', 'fein'], ['m', 'm', 'mittel'], ['c', 'c', 'grob'], ['v', 'v', 'sehr grob']];
  const CLS_HKL = [['H', 'H', 'fein'], ['K', 'K', 'mittel'], ['L', 'L', 'grob']];

  // Alle Rechner und Tabellen; welche Seite sie zeigt, steht in PAGES
  const SECTIONS = [
    { id: 'iso', label: 'ISO-Toleranz', title: 'Einzeltoleranz', tag: 'ISO 286', card: () => cardIso(), compute: () => computeIso() },
    { id: 'fit', label: 'Passung', title: 'Passung', tag: 'ISO 286', card: () => cardFit(), compute: () => computeFit() },
    { id: 'chain', label: 'Maßkette', title: 'Maßkette', tag: 'arithmetisch, Worst Case', card: () => cardChain(), compute: () => computeChain() },
    { id: 'foto', label: 'Foto', title: 'Zeichnung fotografieren', card: () => cardFoto(), compute: () => computeFoto() },
    { id: 'gen', label: 'Allgemein', title: 'Allgemeintoleranzen', card: () => cardGen(), compute: () => computeGen() },
    { id: 'ang', label: 'Winkel', title: 'Winkeltoleranz', tag: 'ISO 2768-1', card: () => cardAngle(), compute: () => computeAng() },
    { id: 'geo', label: 'Form/Lage', title: 'Form und Lage', tag: 'ISO 2768-2', card: () => cardGeo(), compute: () => computeGeo() },
    { id: 'gdt', label: 'Symbole', title: 'Symbole Form und Lage', tag: 'ISO 1101', card: () => cardGdt() },
    { id: 'thread', label: 'Gewinde', title: 'Gewinde nachschlagen', card: () => cardThread(), compute: () => computeThread() },
    { id: 'threadtab', label: 'Gewindetabellen', title: 'Gewindetabellen', card: () => cardThreadTab(), compute: () => computeThreadTab() },
    { id: 'mill', label: 'Fräsen', title: 'Fräsen', card: () => cardSolve('mill'), compute: () => computeSolve('mill') },
    { id: 'drill', label: 'Bohren', title: 'Bohren', card: () => cardSolve('drill'), compute: () => computeSolve('drill') },
    { id: 'turn', label: 'Drehen', title: 'Drehen', card: () => cardSolve('turn'), compute: () => computeSolve('turn') },
    { id: 'cutref', label: 'Richtwerte', title: 'Richtwerte Schnittgeschwindigkeit', card: () => cardCutRef() },
    { id: 'sw', label: 'Schlüsselweite', title: 'Maße einer Schraube', card: () => cardSw(), compute: () => computeSw() },
    { id: 'swtab', label: 'SW-Tabelle', title: 'Schlüsselweiten', card: () => cardSwTab() },
    { id: 'torque', label: 'Drehmoment', title: 'Anziehdrehmoment', tag: 'VDI 2230', card: () => cardTorque(), compute: () => computeTorque() },
    { id: 'weight', label: 'Gewicht', title: 'Gewicht berechnen', card: () => cardWeight(), compute: () => computeWeight() },
    { id: 'tri', label: 'Rechtwinklig', title: 'Rechtwinkliges Dreieck', card: () => cardTri(), compute: () => computeTri() },
    { id: 'tri2', label: 'Beliebig', title: 'Beliebiges Dreieck', card: () => cardTri2(), compute: () => computeTri2() },
    { id: 'cone', label: 'Kegel', title: 'Kegel drehen', card: () => cardCone(), compute: () => computeCone() },
    { id: 'bolt', label: 'Lochkreis', title: 'Lochkreis', tag: 'Koordinaten', card: () => cardBolt(), compute: () => computeBolt() },
    { id: 'roughtab', label: 'Rauheit', title: 'Rauheitswerte', tag: 'ISO 1302', card: () => cardRoughTab() },
    { id: 'trow', label: 'Gleitschleifen', title: 'Gleitschleifen (Trowalisieren)', card: () => cardTrow() + cardTrowInfo(), compute: () => computeTrow() },
    { id: 'info', label: 'Info', title: 'Über die App', card: () => cardInfo() }
  ];
  const secById = id => SECTIONS.find(x => x.id === id);
  function orderedSections() {
    const pg = pageOf(S.page);
    if (!pg) return [];
    const own = pg.secs.map(secById);
    const list = (A.order || []).map(secById).filter(x => x && own.includes(x));
    own.forEach(x => { if (!list.includes(x)) list.push(x); });
    return list;
  }
  const curSection = () => { const pg = pageOf(S.page); return secById(pg && pg.secs.includes(A.secs[S.page]) ? A.secs[S.page] : '') || orderedSections()[0]; };

  function sectionHTML() {
    const sec = curSection();
    const pg = pageOf(S.page);
    const head = pg.secs.length > 1 || sec.title !== pg.title ? `<h2 class="section-h">${sec.title}${sec.tag ? ` <span class="tag">${sec.tag}</span>` : ''}</h2>` : '';
    return head + sec.card();
  }
  function computeCurrent() { const sec = curSection(); if (sec && sec.compute) sec.compute(); }
  function showSection(id, dir = 0) {
    A.secs[S.page] = id; saveA();
    $$('#sec-bar button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.sec === id)));
    const body = $('#sec-body');
    body.innerHTML = sectionHTML();
    const anim = dir > 0 ? 'enter-push' : dir < 0 ? 'enter-pop' : 'enter-fade';
    body.classList.remove('enter-fade', 'enter-push', 'enter-pop'); void body.offsetWidth; body.classList.add(anim);
    computeCurrent();
    const bar = $('#sec-bar'), nav = $('#nav');
    if (!bar) return;
    const barTop = bar.getBoundingClientRect().top + window.scrollY - (nav ? nav.offsetHeight : 0);
    if (window.scrollY > barTop) window.scrollTo(0, barTop);
    const act = $(`#sec-bar [data-sec="${id}"]`);
    if (act) act.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }
  let secClickBlock = 0;
  function initSecDrag() {
    const bar = $('#sec-bar');
    if (!bar) return;
    let timer = null, drag = null, sx = 0, sy = 0, raf = 0;
    const pos = x => x - bar.getBoundingClientRect().left + bar.scrollLeft;
    function begin(btn, x) {
      drag = { btn, x0: pos(x), x };
      btn.classList.add('lifting');
      bar.classList.add('reordering');
      try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) { /* kein Vibrieren */ }
      const tick = () => {
        if (!drag) return;
        const r = bar.getBoundingClientRect();
        if (drag.x < r.left + 44) bar.scrollLeft -= 7;
        else if (drag.x > r.right - 44) bar.scrollLeft += 7;
        update(drag.x);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }
    function update(x) {
      drag.x = x;
      const btns = $$('button', bar), i = btns.indexOf(drag.btn);
      const before = drag.btn.offsetLeft;
      const center = before + drag.btn.offsetWidth / 2 + (pos(x) - drag.x0);
      const prev = btns[i - 1], next = btns[i + 1];
      if (next && center > next.offsetLeft + next.offsetWidth / 2) bar.insertBefore(next, drag.btn);
      else if (prev && center < prev.offsetLeft + prev.offsetWidth / 2) bar.insertBefore(drag.btn, prev);
      drag.x0 += drag.btn.offsetLeft - before;
      drag.btn.style.transform = `translateX(${pos(x) - drag.x0}px) scale(1.06)`;
    }
    function finish() {
      clearTimeout(timer);
      if (!drag) return;
      cancelAnimationFrame(raf);
      drag.btn.style.transform = '';
      drag.btn.classList.remove('lifting');
      bar.classList.remove('reordering');
      drag = null;
      const mine = $$('button', bar).map(b => b.dataset.sec);
      A.order = mine.concat((A.order || []).filter(x => !mine.includes(x)));
      saveA();
      secClickBlock = Date.now() + 450;
    }
    bar.addEventListener('touchstart', e => {
      const b = e.target.closest('button');
      if (!b || e.touches.length > 1) return;
      sx = e.touches[0].clientX; sy = e.touches[0].clientY;
      clearTimeout(timer);
      timer = setTimeout(() => begin(b, sx), 380);
    }, { passive: true });
    bar.addEventListener('touchmove', e => {
      const t = e.touches[0];
      if (!drag) { if (Math.hypot(t.clientX - sx, t.clientY - sy) > 8) clearTimeout(timer); return; }
      e.preventDefault();
      update(t.clientX);
    }, { passive: false });
    bar.addEventListener('touchend', finish);
    bar.addEventListener('touchcancel', finish);
    bar.addEventListener('contextmenu', e => e.preventDefault());
    bar.addEventListener('mousedown', e => {
      const b = e.target.closest('button');
      if (!b || e.button !== 0) return;
      sx = e.clientX; sy = e.clientY;
      timer = setTimeout(() => begin(b, sx), 380);
      const mm = ev => { if (!drag) { if (Math.hypot(ev.clientX - sx, ev.clientY - sy) > 8) clearTimeout(timer); return; } ev.preventDefault(); update(ev.clientX); };
      const mu = () => { window.removeEventListener('mousemove', mm); window.removeEventListener('mouseup', mu); finish(); };
      window.addEventListener('mousemove', mm);
      window.addEventListener('mouseup', mu);
    });
  }

  // Seitlich wischen wechselt den Rechner
  (function initSwipe() {
    let st = null;
    const skip = el => el.closest('.sec-bar, .tbl-wrap, .zone-wrap, input, select, textarea, .sheet-wrap, .crop-wrap, .foto-wrap.selecting');
    view.addEventListener('touchstart', e => {
      st = null;
      if (S.page === 'home' || orderedSections().length < 2 || e.touches.length > 1 || skip(e.target)) return;
      const body = $('#sec-body'), t = e.touches[0];
      if (!body || !body.contains(e.target) || t.clientX < 18 || t.clientX > window.innerWidth - 18) return;
      st = { x: t.clientX, y: t.clientY, t: Date.now(), mode: null, dx: 0, body };
    }, { passive: true });
    view.addEventListener('touchmove', e => {
      if (!st) return;
      const t = e.touches[0], dx = t.clientX - st.x, dy = t.clientY - st.y;
      if (!st.mode) {
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
        st.mode = Math.abs(dx) > Math.abs(dy) * 1.4 ? 'h' : 'v';
        if (st.mode === 'h') st.body.style.transition = 'none';
      }
      if (st.mode !== 'h') return;
      e.preventDefault();
      const list = orderedSections(), i = list.indexOf(curSection());
      const atEdge = (dx > 0 && i === 0) || (dx < 0 && i === list.length - 1);
      st.dx = atEdge ? dx * 0.25 : dx;
      st.body.style.transform = `translateX(${st.dx}px)`;
      st.body.style.opacity = String(1 - Math.min(0.45, Math.abs(st.dx) / 500));
    }, { passive: false });
    const end = () => {
      const s = st;
      st = null;
      if (!s || s.mode !== 'h') return;
      const list = orderedSections(), i = list.indexOf(curSection());
      const dir = s.dx < 0 ? 1 : -1, target = list[i + dir];
      const speed = Math.abs(s.dx) / Math.max(1, Date.now() - s.t);
      s.body.style.transition = 'transform .17s ease-out, opacity .17s';
      if (target && (Math.abs(s.dx) > 80 || (speed > 0.5 && Math.abs(s.dx) > 30))) {
        s.body.style.transform = `translateX(${dir > 0 ? -55 : 55}%)`;
        s.body.style.opacity = '0';
        setTimeout(() => { s.body.style.transition = 'none'; s.body.style.transform = ''; s.body.style.opacity = ''; showSection(target.id, dir); }, 160);
      } else {
        s.body.style.transform = '';
        s.body.style.opacity = '';
        setTimeout(() => { s.body.style.transition = ''; }, 200);
      }
    };
    view.addEventListener('touchend', end);
    view.addEventListener('touchcancel', end);
  })();

  const cardHead = (title, tables) => `<div class="iso-head"><h3 class="card-title">${title}</h3>${tables ? tblBtn(tables) : ''}</div>`;

  // a) Winkel
  function cardAngle() {
    return `<section class="card" id="card-ang">
      ${cardHead('Winkel ohne eigene Toleranz', '2768-1')}
      <div class="fields">
        <div class="field"><label for="a-L">Kürzerer Schenkel</label>${bindNum('a-L', 'ang.L', 'mm', 'z. B. 40')}</div>
        <div class="field"><label for="a-nom">Nennwinkel, freiwillig</label>${bindNum('a-nom', 'ang.nom', '°', 'z. B. 90')}</div>
        <div class="field full"><span class="lbl">Toleranzklasse ISO 2768-1</span>${segHTML('ang.cls', A.ang.cls, CLS_ML, 'tall')}</div>
      </div>
      <div class="result" id="res-ang" aria-live="polite"></div>
    </section>`;
  }
  function computeAng() {
    if (!String(A.ang.L).trim()) return out('res-ang', msgHTML('Gib die Länge des kürzeren Schenkels ein.'));
    const Lv = numOf(A.ang.L);
    const nomS = String(A.ang.nom).trim();
    const nom = nomS ? numOf(nomS) : null;
    if (nomS && !(nom > 0 && nom < 360)) return out('res-ang', msgHTML('Den Nennwinkel kann ich nicht lesen. Gib ihn in Grad ein, zum Beispiel 90.', 'warn'));
    const r = T.angle2768(Lv, A.ang.cls, nom);
    if (!r.ok) return out('res-ang', msgHTML(esc(r.error), 'warn'));
    out('res-ang', `<div class="res-hero"><div class="res-big">${r.text}</div><div class="res-sub">zulässige Abweichung, das sind ±${f(r.dec, 0, 3)}° · Klasse ${A.ang.cls} (${T.CLASS_ML[A.ang.cls]})</div></div>
      <div class="kv">${r.maxA != null ? kv('Größtwinkel', T.dm(r.maxA)) + kv('Kleinstwinkel', T.dm(r.minA)) : ''}${kv('Längenbereich', r.rangeText)}${kv('Am Schenkelende etwa', '±' + f(r.off, 2, 3) + ' mm')}</div>
      ${calcHTML('ang', r.steps)}`);
  }

  // a) Form und Lage
  function cardGeo() {
    const btn = p => `<button type="button" class="geo-btn" data-geo="${p}" aria-pressed="${A.geo.prop === p}">${SYM[p]}<span>${GEO_SHORT[p]}</span></button>`;
    return `<section class="card" id="card-geo">
      ${cardHead('Allgemeintoleranz für Form und Lage', '2768-2,2768-1')}
      <div class="field"><span class="lbl">Allgemeintoleranz im Schriftfeld: <span class="tb-line">ISO 2768-<b id="geo-code">${A.geo.ml}${A.geo.hk}</b></span></span>
        <div class="fields">
          <div class="field">${segHTML('geo.ml', A.geo.ml, CLS_ML.map(o => [o[0], o[1]]))}<span class="hint-line">Maße, ISO 2768-1</span></div>
          <div class="field">${segHTML('geo.hk', A.geo.hk, CLS_HKL.map(o => [o[0], o[1]]))}<span class="hint-line">Form und Lage, ISO 2768-2</span></div>
        </div>
      </div>
      <div class="geo-group"><span class="lbl">Formtoleranzen, ohne Bezug</span><div class="geo-grid c3">${['geradheit', 'ebenheit', 'rundheit'].map(btn).join('')}</div></div>
      <div class="geo-group"><span class="lbl">Lagetoleranzen, mit Bezug</span><div class="geo-grid c4">${['rechtwinkligkeit', 'parallelitaet', 'position', 'rundlauf'].map(btn).join('')}</div></div>
      <div id="geo-inputs">${geoInputs()}</div>
      <div class="result" id="res-geo" aria-live="polite"></div>
    </section>`;
  }
  function geoInputs() {
    const p = A.geo.prop;
    const fl = (id, k, label, ph, full) => `<div class="field${full ? ' full' : ''}"><label for="${id}">${label}</label>${bindNum(id, k, 'mm', ph)}</div>`;
    let inner = '';
    if (p === 'geradheit') inner = fl('g-len', 'geo.len', 'Länge der Linie', 'z. B. 120', true);
    else if (p === 'ebenheit') inner = fl('g-len', 'geo.len', 'Längere Seite der Fläche, bei runder Fläche der Durchmesser', 'z. B. 120', true);
    else if (p === 'rechtwinkligkeit') inner = fl('g-len', 'geo.len', 'Länge des kürzeren Schenkels', 'z. B. 80', true);
    else if (p === 'rundheit') inner = fl('g-dia', 'geo.dia', 'Durchmesser', 'z. B. 30') + fl('g-own', 'geo.own', 'Eigene Toleranzbreite, falls vorhanden', 'leer lassen');
    else if (p === 'parallelitaet') inner = fl('g-dist', 'geo.dist', 'Abstand der Flächen', 'z. B. 20') + fl('g-len', 'geo.len', 'Länge der Fläche', 'z. B. 150') + fl('g-own', 'geo.own', 'Eigene Toleranzbreite des Abstands, falls vorhanden', 'leer lassen', true);
    else if (p === 'position') inner = fl('g-x', 'geo.x', 'Abstand zur ersten Bezugskante', 'z. B. 45') + fl('g-y', 'geo.y', 'Abstand zur zweiten Kante', 'freiwillig');
    else return msgHTML('Für den Rundlauf brauchst du keine Maße. Der Wert hängt nur von der Klasse H, K oder L ab.');
    return `<div class="fields">${inner}</div>`;
  }
  function computeGeo() {
    const code = $('#geo-code');
    if (code) code.textContent = A.geo.ml + A.geo.hk;
    const p = A.geo.prop;
    const inp = { len: numOf(A.geo.len), dia: numOf(A.geo.dia), dist: numOf(A.geo.dist), own: optNum(A.geo.own), x: numOf(A.geo.x), y: optNum(A.geo.y) };
    const r = T.geo2768(p, inp, A.geo.ml, A.geo.hk);
    if (!r.ok) return out('res-geo', msgHTML(esc(r.error), 'warn'));
    const info = r.info, lage = !['geradheit', 'ebenheit', 'rundheit'].includes(p);
    const frame = p === 'position'
      ? `<span class="fcf"><span>${SYM.position}</span></span>`
      : fcf([SYM[p], f(r.value, 0, 3), ...(lage ? ['A'] : [])]);
    const sub = p === 'position' ? `keine Positionstoleranz, nur die Freimaßtoleranz der Abstandsmaße (ISO 2768-1, Klasse ${A.geo.ml})` : `${info.name} · ${info.art} · Klasse ${A.geo.hk}`;
    out('res-geo', `<div class="res-hero"><div class="geo-res">${frame}<div><div class="res-big">${r.valueText}</div><div class="res-sub">${sub}</div></div></div></div>
      ${p === 'position' ? '' : `<p class="foot">So sähe der Wert als eigene Angabe im Toleranzrahmen auf der Zeichnung aus${lage ? ', mit A als Bezug' : ''}.</p>`}
      <div class="info-list">
        <div><span>Was das Symbol bedeutet</span>${esc(info.bedeutung)}</div>
        <div><span>Worauf es sich bezieht</span>${esc(info.bezug)}</div>
        <div><span>Aus der Praxis</span>${esc(info.praxis)}</div>
      </div>
      ${calcHTML('geo', r.steps)}`);
  }

  // b) ISO-Toleranz
  function cardIso() {
    return `<section class="card" id="card-iso">
      ${cardHead('ISO-Toleranz berechnen', 'it,grund')}
      <div class="field"><label for="i-q">Angabe</label><div class="inp big"><input id="i-q" data-k="iso.q" value="${esc(A.iso.q)}" placeholder="z. B. 10H8" autocapitalize="off" autocorrect="off" spellcheck="false" autocomplete="off" enterkeyhint="done"></div>
        <span class="hint-line">Nennmaß 1 bis 500 mm, alle Grundabmaße von a bis zc. Großbuchstabe heißt Bohrung, Kleinbuchstabe heißt Welle.</span></div>
      <div class="result" id="res-iso" aria-live="polite"></div>
    </section>`;
  }
  function computeIso() {
    if (!A.iso.q.trim()) return out('res-iso', msgHTML('Gib eine Angabe ein, zum Beispiel 10H8 oder 30k5.'));
    const r = T.isoFromString(A.iso.q);
    if (!r.ok) return out('res-iso', msgHTML(esc(r.error), 'warn'));
    const fundText = r.fundSide === 'sym' ? 'keins, das Feld liegt symmetrisch zur Nulllinie' : `${r.fundSide === 'upper' ? 'oberes' : 'unteres'} Abmaß ${T.umS(r.fund)} µm`;
    out('res-iso', `<div class="iso-head"><div class="iso-code">${f(r.N)} ${r.cls}</div><span class="badge${r.isHole ? '' : ' shaft'}">${r.isHole ? 'Bohrung · Großbuchstabe' : 'Welle · Kleinbuchstabe'}</span></div>
      <div class="kv">
        ${kv('Nennmaß', f(r.N) + ' mm')}
        ${kv('Nennmaßbereich', esc(r.rangeText) + (r.subText ? `<br><small>für ${r.letter}: ${esc(r.subText)}</small>` : ''))}
        ${kv('IT-Grad', 'IT' + r.grade)}
        ${kv('Toleranz', T.um(r.it) + ' µm <small>' + T.mm(r.it / 1000) + ' mm</small>')}
        ${kv('Grundabmaß', fundText, true)}
        ${kv('Oberes Abmaß', T.umS(r.upper) + ' µm <small>' + T.mmS(r.upper / 1000) + ' mm</small>')}
        ${kv('Unteres Abmaß', T.umS(r.lower) + ' µm <small>' + T.mmS(r.lower / 1000) + ' mm</small>')}
        ${kv('Höchstmaß', T.mm(r.max) + ' mm')}
        ${kv('Mindestmaß', T.mm(r.min) + ' mm')}
        ${kv('Toleranzmitte fürs Programm', T.fmt(r.mid, 3, 4) + ' mm', true)}
      </div>
      <div class="zone-wrap">${zoneSVG([{ name: r.cls, upper: r.upper, lower: r.lower, hole: r.isHole }], `Toleranzfeld ${r.cls} zur Nulllinie`)}</div>
      ${r.notes.map(n => msgHTML(esc(n))).join('')}
      ${calcHTML('iso', r.steps)}`);
  }

  // c) Passung
  function cardFit() {
    return `<section class="card" id="card-fit">
      ${cardHead('Passung berechnen', 'it,grund')}
      ${segHTML('fit.sys', A.fit.sys, [['EB', 'Einheitsbohrung'], ['EW', 'Einheitswelle']], 'big')}
      <div class="fields fit-fields">
        <div class="field"><label for="p-h">Bohrung</label><div class="inp big"><input id="p-h" data-k="fit.hole" value="${esc(A.fit.hole)}" placeholder="30H7" autocapitalize="characters" autocorrect="off" spellcheck="false" autocomplete="off" enterkeyhint="next"></div></div>
        <div class="field"><label for="p-s">Welle</label><div class="inp big"><input id="p-s" data-k="fit.shaft" value="${esc(A.fit.shaft)}" placeholder="g6" autocapitalize="off" autocorrect="off" spellcheck="false" autocomplete="off" enterkeyhint="done"></div></div>
      </div>
      <span class="hint-line">Das Nennmaß reicht in einem der beiden Felder, zum Beispiel 30H7 und g6.</span>
      <div class="result" id="res-fit" aria-live="polite"></div>
    </section>`;
  }
  function computeFit() {
    if (!String(A.fit.hole).trim() && !String(A.fit.shaft).trim()) return out('res-fit', msgHTML('Trag Bohrung und Welle ein, zum Beispiel 30H7 und g6.'));
    const r = T.fitFromParts(A.fit.hole, A.fit.shaft);
    if (!r.ok) return out('res-fit', msgHTML(esc(r.error), 'warn'));
    const { H, S, N } = r;
    const name = { spiel: 'Spielpassung', uebergang: 'Übergangspassung', press: 'Presspassung' }[r.type];
    const note = {
      spiel: 'Auch im ungünstigsten Fall bleibt Spiel. Die Teile lassen sich fügen und gegeneinander bewegen.',
      uebergang: 'Je nach Istmaßen gibt es etwas Spiel oder etwas Übermaß. Fügen meist mit leichtem Druck oder Hammerschlägen.',
      press: 'Die Welle ist immer größer als die Bohrung (Übermaßpassung). Fügen nur mit Presse oder durch Erwärmen der Bohrung.'
    }[r.type];
    const sysName = { EB: 'Einheitsbohrung', EW: 'Einheitswelle', beide: 'beide Systeme (H und h)', keins: 'keins von beiden' }[r.system];
    let sysMsg = '';
    const eqH = r.equiv ? `${f(N)}${r.equiv.hole.letter}${r.equiv.hole.grade}` : '', eqS = r.equiv ? `${r.equiv.shaft.letter}${r.equiv.shaft.grade}` : '';
    const eq = r.equiv ? `${eqH}/${eqS}` : '';
    if (A.fit.sys === 'EB' && r.system === 'EW') sysMsg = msgHTML(`Diese Passung gehört zum System Einheitswelle, denn die Welle hat h. Gleichwertig im System Einheitsbohrung ist <b>${esc(eq)}</b>.<button class="btn soft" data-act="fit-equiv" data-h="${esc(eqH)}" data-s="${esc(eqS)}">${esc(eq)} übernehmen</button>`, 'warn');
    else if (A.fit.sys === 'EW' && r.system === 'EB') sysMsg = msgHTML(`Diese Passung gehört zum System Einheitsbohrung, denn die Bohrung hat H. Gleichwertig im System Einheitswelle ist <b>${esc(eq)}</b>.<button class="btn soft" data-act="fit-equiv" data-h="${esc(eqH)}" data-s="${esc(eqS)}">${esc(eq)} übernehmen</button>`, 'warn');
    else if (r.system === 'keins') sysMsg = msgHTML('Weder hat die Bohrung H noch die Welle h. Die Passung gehört zu keinem der beiden Systeme und ist unüblich.', 'warn');
    out('res-fit', `<div class="fit-hero ${r.type}"><div class="fit-type"><span class="fit-dot"></span>${name}</div>
        <div class="fit-vals"><div><span>${r.la}</span><b>${T.mm(r.a)} <small>mm</small></b></div><div><span>${r.lb}</span><b>${T.mm(r.b)} <small>mm</small></b></div></div>
        <div class="fit-note">${note}</div></div>
      ${sysMsg}
      ${r.note ? msgHTML(esc(r.note)) : ''}
      <div class="kv">
        ${kv(`Bohrung ${f(N)} ${H.cls}`, `${T.mm(H.min)} bis ${T.mm(H.max)} mm`)}
        ${kv(`Welle ${f(N)} ${S.cls}`, `${T.mm(S.min)} bis ${T.mm(S.max)} mm`)}
        ${kv('Passtoleranz', T.mm(r.passTol / 1000) + ' mm')}
        ${kv('System', sysName)}
      </div>
      <div class="zone-wrap">${zoneSVG([{ name: 'Bohrung ' + H.cls, upper: H.upper, lower: H.lower, hole: true }, { name: 'Welle ' + S.cls, upper: S.upper, lower: S.lower, hole: false }], `Toleranzfelder ${H.cls} und ${S.cls} zur Nulllinie`)}</div>
      <div class="btn-row"><button class="btn plain" data-act="iso-from" data-v="${f(N)}${H.cls}">${H.cls} einzeln</button><button class="btn plain" data-act="iso-from" data-v="${f(N)}${S.cls}">${S.cls} einzeln</button></div>
      ${calcHTML('fit', r.steps)}`);
  }

  // d) Allgemeintoleranzen
  function cardGen() {
    return `<section class="card" id="card-gen">
      ${segHTML('gen.tab', A.gen.tab, [['alt', 'Alte Tabelle', 'ISO 2768'], ['neu', 'Neue Tabelle', 'ISO 22081']], 'tall')}
      <div id="gen-body" class="result">${genBody()}</div>
      <div class="result" id="res-gen" aria-live="polite"></div>
    </section>
    ${A.gen.tab === 'alt' ? `<section class="card" id="card-gen2">
      ${cardHead('Form und Lage', '2768-2')}
      <p class="small muted">ISO 2768-2, Großbuchstabe im Schriftfeld. Die Werte gelten für das Maß von oben als maßgebende Länge.</p>
      <div class="field"><span class="lbl">Klasse für Form und Lage</span>${segHTML('gen.hk', A.gen.hk, CLS_HKL, 'tall')}</div>
      <div class="result" id="res-gen2" aria-live="polite"></div>
    </section>` : ''}`;
  }
  function genBody() {
    if (A.gen.tab === 'alt') {
      return `${cardHead('Maße · ISO 2768-1', '2768-1')}
        <div class="fields">
          <div class="field"><label for="d-N">Maß</label>${bindNum('d-N', 'gen.N', 'mm', 'z. B. 120')}</div>
          <div class="field"><span class="lbl">Art des Maßes</span>${segHTML('gen.kind', A.gen.kind, [['len', 'Länge'], ['rad', 'Radius, Fase']], 'big')}</div>
          <div class="field full"><span class="lbl">Toleranzklasse für Maße</span>${segHTML('gen.cls', A.gen.cls, CLS_ML, 'tall')}</div>
        </div>`;
    }
    const prof = A.gen.mode === 'profil';
    return `${cardHead('ISO 22081', '')}
      <p class="small muted">ISO 22081 hat keine feste Zahlentabelle. Den Wert liest du auf der Zeichnung ab und trägst ihn hier ein.</p>
      ${segHTML('gen.mode', A.gen.mode, [['profil', 'Profiltoleranz'], ['size', 'Größenmaß ±']], 'big')}
      <div class="fields">${prof
        ? `<div class="field"><label for="n-N">Nennmaß</label>${bindNum('n-N', 'gen.pN', 'mm', 'z. B. 50')}</div>
           <div class="field"><label for="n-t">Profiltoleranz aus der Zeichnung</label>${bindNum('n-t', 'gen.t', 'mm', 'z. B. 0,4')}</div>
           <div class="field full"><span class="lbl">Wie ist das Maß bemaßt?</span>${segHTML('gen.rel', A.gen.rel, [['bezug', 'vom Bezug aus'], ['zwischen', 'zwischen zwei Flächen']], 'big')}</div>`
        : `<div class="field"><label for="n-sN">Nennmaß</label>${bindNum('n-sN', 'gen.sN', 'mm', 'z. B. 20')}</div>
           <div class="field"><label for="n-sd">Größenmaßtoleranz aus der Zeichnung</label>${bindNum('n-sd', 'gen.sdev', 'mm', 'z. B. 0,1', { pm: true })}</div>`}
      </div>`;
  }
  function computeGenGeo(N, ok) {
    if (!$('#res-gen2')) return;
    if (!ok) return out('res-gen2', msgHTML('Gib oben ein gültiges Maß ein, dann erscheinen hier die Werte für Form und Lage.'));
    if (A.gen.kind === 'rad') return out('res-gen2', msgHTML('Für Radien und Fasen gibt es keine Form- und Lagewerte. Stell oben bei „Art des Maßes“ auf „Länge“.'));
    const hk = A.gen.hk, F3 = x => f(x, 0, 3);
    const si = T.strIdx(N), pi = T.perpIdx(N), run = T.RUN2768[hk];
    const lin = T.lin2768(N, A.gen.cls, 'len');
    const val = (i, tab, rt) => i < 0 ? '–<small>über 3000 mm nicht festgelegt</small>' : `${F3(tab[hk][i])} mm<small>${esc(rt(i))}</small>`;
    const rund = lin.ok ? Math.min(lin.tol, run) : null;
    const steps = [
      { t: 'Toleranzklasse', h: `Im Schriftfeld steht der Großbuchstabe <b>${hk}</b> (${T.CLASS_HKL[hk]}).` },
      { t: 'Geradheit und Ebenheit', h: si < 0 ? 'Über 3000 mm ist kein Wert festgelegt.' : `${f(N)} mm liegt im Bereich ${T.strRangeText(si)}. Spalte ${hk}: <b>${F3(T.STRAIGHT2768[hk][si])} mm</b>.` },
      { t: 'Rechtwinkligkeit und Symmetrie', h: pi < 0 ? 'Über 3000 mm ist kein Wert festgelegt.' : `Als kürzeres Element liegt ${f(N)} mm im Bereich ${T.perpRangeText(pi)}. Spalte ${hk}: Rechtwinkligkeit <b>${F3(T.PERP2768[hk][pi])} mm</b>, Symmetrie <b>${F3(T.SYM2768[hk][pi])} mm</b>.` },
      { t: 'Lauf', h: `Unabhängig von der Größe, Spalte ${hk}: <b>${F3(run)} mm</b>.` }
    ];
    if (rund != null) steps.push({ t: 'Rundheit', h: `Durchmessertoleranz bei Ø${f(N)} mm, Klasse ${A.gen.cls}: ±${f(lin.dev)} mm, also ${F3(lin.tol)} mm breit. Rundlauf ${F3(run)} mm. Der kleinere Wert gilt: <b>${F3(rund)} mm</b>.` });
    out('res-gen2', `<div class="kv">
        ${kv('Geradheit, Ebenheit', val(si, T.STRAIGHT2768, T.strRangeText))}
        ${kv('Rechtwinkligkeit', val(pi, T.PERP2768, T.perpRangeText))}
        ${kv('Symmetrie', val(pi, T.SYM2768, T.perpRangeText))}
        ${kv('Lauf', F3(run) + ' mm<small>Rundlauf und Planlauf</small>')}
        ${rund != null ? kv(`Rundheit bei Ø${f(N)} mm`, F3(rund) + ' mm<small>Durchmessertoleranz, höchstens Lauf</small>', true) : ''}
      </div>
      <p class="foot">Maßgebende Länge: bei Geradheit die Linie, bei Ebenheit die längere Seite, bei Rechtwinkligkeit und Symmetrie das kürzere Element. Parallelität und andere Fälle rechnest du genauer im Reiter „Form und Lage“.</p>
      ${calcHTML('gen-geo', steps)}`);
  }
  function computeGen() {
    if (A.gen.tab === 'alt') {
      if (!String(A.gen.N).trim()) { computeGenGeo(0, false); return out('res-gen', msgHTML('Gib ein Maß ein.')); }
      const N = numOf(A.gen.N);
      const r = T.lin2768(N, A.gen.cls, A.gen.kind);
      computeGenGeo(N, r.ok);
      if (!r.ok) return out('res-gen', msgHTML(esc(r.error), 'warn'));
      const F = x => f(x, r.dec, 4);
      return out('res-gen', `<div class="res-hero"><div class="res-big">±${f(r.dev)} mm</div><div class="res-sub">Grenzabmaß · ${A.gen.kind === 'rad' ? 'Radius oder Fase' : 'Längenmaß'} · Klasse ${A.gen.cls} (${T.CLASS_ML[A.gen.cls]})</div></div>
        <div class="kv">${kv('Höchstmaß', F(r.max) + ' mm')}${kv('Mindestmaß', F(r.min) + ' mm')}${kv('Toleranz', F(r.tol) + ' mm')}${kv('Nennmaßbereich', esc(r.rangeText))}</div>
        ${calcHTML('gen-alt', r.steps)}`);
    }
    if (A.gen.mode === 'profil') {
      if (!String(A.gen.pN).trim() || !String(A.gen.t).trim()) return out('res-gen', msgHTML('Gib Nennmaß und Profiltoleranz ein.'));
      const t = numOf(A.gen.t);
      const r = T.profile22081(numOf(A.gen.pN), t, A.gen.rel);
      if (!r.ok) return out('res-gen', msgHTML(esc(r.error), 'warn'));
      const F = x => f(x, r.dec, 4);
      return out('res-gen', `<div class="res-hero"><div class="res-big">±${f(r.dev)} mm</div><div class="res-sub">${A.gen.rel === 'bezug' ? 'je Flächenpunkt, gemessen vom Bezug' : 'Abstand zweier Flächen, ungünstigster Fall'}</div></div>
        ${msgHTML('Das ist keine Maßtoleranz im klassischen Sinn. Die Profiltoleranz legt fest, wo jeder Punkt einer Fläche liegen darf, bezogen auf die Bezüge. Die Plus-Minus-Werte gelten für den Abstand eines Flächenpunkts zum Bezug, nicht für beliebige Maße auf der Zeichnung.')}
        <div class="kv">${kv('Höchstmaß', F(r.max) + ' mm')}${kv('Mindestmaß', F(r.min) + ' mm')}${kv('Zonenbreite', f(t) + ' mm')}${kv('Je Fläche', '±' + f(r.half) + ' mm')}</div>
        <div class="card-2-block">
          <div class="eyebrow">So liest du die Angabe auf der Zeichnung</div>
          <div class="tb-line" style="margin:10px 0">ISO 22081 ${fcf([SYM.profil, esc(f(t)), 'A', 'B', 'C'])}</div>
          <div class="info-list">
            <div><span>Das Zeichen</span>Der Halbkreis mit Grundlinie ist das Flächenprofil. Es gilt für jede Fläche, die auf der Zeichnung keine eigene Angabe hat, und legt Form, Richtung und Lage auf einmal fest.</div>
            <div><span>Der Wert</span>${esc(f(t))} mm ist die Breite der Zone, in der die Fläche liegen muss. Die Zone liegt mittig um die Sollfläche aus Zeichnung oder CAD-Modell, also ${esc(f(r.half))} mm nach außen und ${esc(f(r.half))} mm nach innen.</div>
            <div><span>Die Buchstaben</span>A, B und C sind die Bezüge, von denen aus die Sollposition gemessen wird. Meist sind das die Flächen, an denen das Teil aufliegt und anschlägt, beim Fräsen also oft die Flächen, an denen du spannst und den Nullpunkt antastest.</div>
            <div><span>Die Maße</span>Die Maße ohne Toleranz geben nur die Sollgeometrie an. Wie weit du abweichen darfst, sagt allein die Profiltoleranz.</div>
          </div>
        </div>
        ${calcHTML('gen-prof', r.steps)}`);
    }
    if (!String(A.gen.sN).trim() || !String(A.gen.sdev).trim()) return out('res-gen', msgHTML('Gib Nennmaß und Größenmaßtoleranz ein.'));
    const r = T.size22081(numOf(A.gen.sN), Math.abs(numOf(A.gen.sdev)));
    if (!r.ok) return out('res-gen', msgHTML(esc(r.error), 'warn'));
    const F = x => f(x, r.dec, 4);
    return out('res-gen', `<div class="res-hero"><div class="res-big">±${f(r.dev)} mm</div><div class="res-sub">allgemeine Größenmaßtoleranz</div></div>
      <div class="kv">${kv('Höchstmaß', F(r.max) + ' mm')}${kv('Mindestmaß', F(r.min) + ' mm')}${kv('Toleranz', F(r.tol) + ' mm', true)}</div>
      <div class="info-list">
        <div><span>So liest du die Angabe</span>Beim Hinweis auf ISO 22081 steht ein Wert wie ±${esc(f(r.dev))} mm. Er gilt nur für Größenmaße ohne eigene Angabe: Durchmesser von Bohrungen und Zapfen, Breiten von Nuten und Stegen, Dicken. Wo die Flächen liegen, regelt die Profiltoleranz.</div>
      </div>
      ${calcHTML('gen-size', r.steps)}`);
  }

  // e) Maßkette
  function chainRowHTML(r, i) {
    const del = A.chain.rows.length > 1 ? `<button type="button" class="icon-btn" data-act="chain-del" data-i="${i}" aria-label="Maß ${i + 1} entfernen">${I.x}</button>` : '';
    let dev;
    if (r.mode === 'pm') dev = `<div class="full">${numInput({ id: `c${i}-pm`, attrs: `data-chain="${i}" data-f="pm"`, raw: r.pm, unit: 'mm', pm: true, placeholder: 'z. B. 0,2', label: `Maß ${i + 1}, Abmaß plus minus` })}</div>`;
    else if (r.mode === 'ul') dev = `<div class="field"><span class="lbl">oberes Abmaß</span>${numInput({ id: `c${i}-up`, attrs: `data-chain="${i}" data-f="up"`, raw: r.up, unit: 'mm', signed: true, placeholder: '0,1', label: `Maß ${i + 1}, oberes Abmaß` })}</div>
      <div class="field"><span class="lbl">unteres Abmaß</span>${numInput({ id: `c${i}-lo`, attrs: `data-chain="${i}" data-f="lo"`, raw: r.lo, unit: 'mm', signed: true, placeholder: '0', label: `Maß ${i + 1}, unteres Abmaß` })}</div>`;
    else dev = `<div class="full inp"><input id="c${i}-iso" data-chain="${i}" data-f="iso" value="${esc(r.iso)}" placeholder="Toleranzklasse, z. B. h7" autocapitalize="off" autocorrect="off" spellcheck="false" autocomplete="off" aria-label="Maß ${i + 1}, ISO-Toleranzklasse"></div>`;
    return `<div class="chain-row">
      <div class="chain-head"><span class="chain-idx">Maß ${i + 1}</span>${del}</div>
      <div class="chain-top">
        ${segHTML(String(i), r.op, [[1, '+'], [-1, '−']], '', 'data-chain-op')}
        ${numInput({ id: `c${i}-N`, attrs: `data-chain="${i}" data-f="N"`, raw: r.N, unit: 'mm', placeholder: 'Nennmaß', label: `Maß ${i + 1}, Nennmaß` })}
      </div>
      ${segHTML(String(i), r.mode, [['pm', '±'], ['ul', 'oben / unten'], ['iso', 'ISO']], '', 'data-chain-mode')}
      <div class="chain-dev">${dev}</div>
      <div class="chain-out" id="chain-out-${i}"></div>
    </div>`;
  }
  function cardChain() {
    return `<section class="card" id="card-chain">
      <p class="small muted">Trag die Maße der Kette ein. Plus heißt, das Maß wird addiert. Minus heißt, es wird abgezogen, zum Beispiel die Tiefe einer Nut in einem Absatz. Gerechnet wird für den ungünstigsten Fall.</p>
      <div class="chain" id="chain-rows">${A.chain.rows.map(chainRowHTML).join('')}</div>
      <div class="btn-row"><button type="button" class="btn soft" data-act="chain-add">${I.plus}Maß dazu</button><button type="button" class="btn plain" data-act="chain-example">Beispiel Nut</button></div>
      <div class="result" id="res-chain" aria-live="polite"></div>
    </section>`;
  }
  function chainParse(r) {
    if (!String(r.N).trim()) return { valid: false, empty: true };
    const N = numOf(r.N);
    if (!(N > 0)) return { valid: false, err: 'Das Nennmaß kann ich nicht lesen.' };
    let up = 0, lo = 0, cls = '';
    if (r.mode === 'pm') {
      if (String(r.pm).trim()) { const d = numOf(r.pm); if (!isFinite(d)) return { valid: false, err: 'Das Abmaß kann ich nicht lesen.' }; up = Math.abs(d); lo = -Math.abs(d); }
    } else if (r.mode === 'ul') {
      up = String(r.up).trim() ? numOf(r.up) : 0;
      lo = String(r.lo).trim() ? numOf(r.lo) : 0;
      if (!isFinite(up) || !isFinite(lo)) return { valid: false, err: 'Ein Abmaß kann ich nicht lesen.' };
      if (lo > up) return { valid: false, err: 'Das untere Abmaß ist größer als das obere. Prüfe die Vorzeichen.' };
    } else {
      if (!String(r.iso).trim()) return { valid: false, err: 'Trag eine Toleranzklasse ein, zum Beispiel h7.' };
      const c = T.parseClassToken(r.iso);
      if (c.error) return { valid: false, err: c.error };
      const t = T.isoTol(N, c.letter, c.grade);
      if (!t.ok) return { valid: false, err: t.error };
      up = t.upper / 1000; lo = t.lower / 1000; cls = t.cls;
    }
    return { valid: true, op: r.op > 0 ? 1 : -1, N, up: T.r6(up), lo: T.r6(lo), cls };
  }
  function computeChain() {
    const parsed = A.chain.rows.map(chainParse);
    parsed.forEach((p, i) => {
      const o = $('#chain-out-' + i);
      if (!o) return;
      o.className = 'chain-out' + (!p.valid && !p.empty ? ' err' : '');
      o.textContent = p.valid
        ? `${p.op > 0 ? 'wird addiert' : 'wird abgezogen'}${p.cls ? ' · ' + p.cls : ''} · ${f(p.N + p.lo, 0, 4)} bis ${f(p.N + p.up, 0, 4)} mm`
        : p.empty ? 'Nennmaß fehlt noch.' : p.err;
    });
    const r = T.chain(parsed);
    if (!r.ok) return out('res-chain', msgHTML('Gib mindestens ein Maß mit Nennmaß ein.'));
    const bad = parsed.map((p, i) => (!p.valid && !p.empty) ? i + 1 : 0).filter(Boolean);
    const F = x => f(x, r.dec, 4);
    out('res-chain', `${bad.length ? msgHTML(`Maß ${bad.join(' und ')} wird nicht mitgerechnet, bis die Eingabe stimmt.`, 'warn') : ''}
      <div class="res-hero"><div class="res-big">${F(r.N)} mm</div><div class="res-sub">oberes Abmaß ${T.fmtS(r.es, r.dec, 4)} mm · unteres Abmaß ${T.fmtS(r.ei, r.dec, 4)} mm</div></div>
      <div class="kv">${kv('Nennmaß der Summe', F(r.N) + ' mm')}${kv('Gesamttoleranz', F(r.tol) + ' mm')}${kv('Höchstmaß', F(r.max) + ' mm')}${kv('Mindestmaß', F(r.min) + ' mm')}</div>
      ${calcHTML('chain', r.steps)}`);
  }
  function renderChainRows() { $('#chain-rows').innerHTML = A.chain.rows.map(chainRowHTML).join(''); }

  // f) Foto einer Zeichnung: Maße erkennen und Toleranzen zeigen
  const FOTO = { phase: 'empty', src: null, srcUrl: '', quad: null, work: null, url: null, busy: false, status: '', pct: 0, error: '', regionMsg: '', regionOk: true, regionAlts: [], regionSwap: '', open: -1, log: null, editIdx: -1, sel: null, selMode: false, drag: null, selDrag: null };
  if (/[?&]debug\b/.test(location.search)) window.__FOTO = FOTO; // nur für Tests
  FOTO.regionSearch = () => regionSearch();
  let OCRW = null;
  const KIND_NAME = { iso: 'ISO-Toleranz', fit: 'Passung', pm: 'Eigene Toleranz ±', ul: 'Eigene Abmaße', lin: 'Ohne Toleranz', rad: 'Radius ohne Toleranz', fase: 'Fase ohne Toleranz', ang: 'Winkel ohne Toleranz' };

  function cardFoto() {
    return `<section class="card" id="card-foto">
      <p class="small muted">Fotografiere eine Zeichnung. Die App sucht die Maße heraus und zeigt dir zu jedem die Toleranz. Die Erkennung läuft nur auf deinem iPhone, das Foto verlässt das Gerät nicht.</p>
      <div class="btn-row">
        <label class="btn primary file-btn">${I.camera}Foto aufnehmen<input type="file" accept="image/*" capture="environment" id="foto-cam" class="visually-hidden"></label>
        <label class="btn soft file-btn">${I.photos}Aus Fotos<input type="file" accept="image/*" id="foto-lib" class="visually-hidden"></label>
      </div>
      <div id="foto-stage"></div>
      <div class="field"><span class="lbl">Allgemeintoleranz der Zeichnung: <span class="tb-line">ISO 2768-<b id="foto-code">${A.foto.ml}</b></span> <span id="foto-det"></span></span>${segHTML('foto.ml', A.foto.ml, CLS_ML, 'tall')}
        <span class="hint-line">Gilt für alle Maße ohne eigene Toleranz. Wird im Schriftfeld „ISO 2768“ erkannt, stellt die App die Klasse selbst ein.</span></div>
      <div id="foto-list" aria-live="polite"></div>
      <div class="field"><label for="foto-add" id="foto-add-lbl">Maß von Hand hinzufügen</label>
        <div class="foto-add-row"><div class="inp"><input id="foto-add" placeholder="z. B. Ø30 H7, 120, R5, 60 ±0,1" autocapitalize="off" autocorrect="off" spellcheck="false" autocomplete="off" enterkeyhint="done"></div><button type="button" class="btn soft" data-act="foto-add" id="foto-add-btn">Dazu</button></div>
        <span class="hint-line" id="foto-add-msg"></span></div>
      <details class="calc" data-calc="foto-text"${OPEN.has('foto-text') ? ' open' : ''}><summary><span>Text aus Live Text einfügen</span>${I.chevR}</summary>
        <div class="calc-steps" style="display:flex;flex-direction:column;gap:10px">
          <p class="small muted">Das iPhone erkennt Text in Fotos oft noch besser: Öffne das Foto in der Fotos-App, halte den Finger auf einen Text, tippe auf „Alles auswählen“ und dann „Kopieren“. Füge den Text hier ein.</p>
          <textarea id="foto-text" class="textarea" rows="5" placeholder="Hier einfügen"></textarea>
          <button type="button" class="btn soft" data-act="foto-text">Maße im Text suchen</button>
        </div></details>
    </section>`;
  }

  function evalDim(it) {
    const ml = A.foto.ml;
    const lin = (N, kind) => {
      const r = T.lin2768(N, ml, kind);
      if (!r.ok) return { err: r.error };
      const F = x => f(x, r.dec, 4);
      return { sum: `±${f(r.dev)} mm · ${F(r.min)} bis ${F(r.max)} mm`, rows: [['Grenzabmaß', `±${f(r.dev)} mm`], ['Nennmaßbereich', esc(r.rangeText)], ['Höchstmaß', F(r.max) + ' mm'], ['Mindestmaß', F(r.min) + ' mm']], steps: r.steps, calc: () => { Object.assign(A.gen, { tab: 'alt', N: T.fmt(N), kind, cls: ml }); return 'gen'; } };
    };
    if (it.kind === 'iso') {
      const r = T.isoTol(it.N, it.letter, it.grade);
      if (!r.ok) return { err: r.error };
      return { sub: r.isHole ? 'Bohrung' : 'Welle', sum: `${T.mm(r.min)} bis ${T.mm(r.max)} mm`, rows: [['Oberes Abmaß', T.umS(r.upper) + ' µm'], ['Unteres Abmaß', T.umS(r.lower) + ' µm'], ['Höchstmaß', T.mm(r.max) + ' mm'], ['Mindestmaß', T.mm(r.min) + ' mm'], ['Toleranzmitte fürs Programm', T.fmt(r.mid, 3, 4) + ' mm', true]], steps: r.steps, calc: () => { A.iso.q = `${f(it.N)}${r.cls}`; return 'iso'; } };
    }
    if (it.kind === 'fit') {
      const r = T.fitCalc(it.N, it.hole, it.shaft);
      if (!r.ok) return { err: r.error };
      const name = { spiel: 'Spielpassung', uebergang: 'Übergangspassung', press: 'Presspassung' }[r.type];
      return { sub: name, fit: r.type, sum: `${name} · ${r.la} ${T.mm(r.a)} mm`, rows: [[r.la, T.mm(r.a) + ' mm'], [r.lb, T.mm(r.b) + ' mm'], [`Bohrung ${r.H.cls}`, `${T.mm(r.H.min)} bis ${T.mm(r.H.max)} mm`], [`Welle ${r.S.cls}`, `${T.mm(r.S.min)} bis ${T.mm(r.S.max)} mm`]], steps: r.steps, calc: () => { A.fit.hole = `${f(it.N)}${r.H.cls}`; A.fit.shaft = r.S.cls; return 'fit'; } };
    }
    if (it.kind === 'pm' || it.kind === 'ul') {
      const dec = Math.max(T.decimals(it.up), T.decimals(it.lo), T.decimals(it.N));
      const F = x => f(x, dec, 4);
      const max = T.r6(it.N + it.up), min = T.r6(it.N + it.lo), mid = T.r6((max + min) / 2);
      return { sum: `${F(min)} bis ${F(max)} mm`, rows: [['Höchstmaß', F(max) + ' mm'], ['Mindestmaß', F(min) + ' mm'], ['Toleranz', F(T.r6(max - min)) + ' mm'], ['Toleranzmitte', f(mid, dec, 4) + ' mm']],
        steps: [{ t: 'Eigene Toleranz am Maß', h: 'Die Toleranz steht direkt am Maß. Die Allgemeintoleranz gilt dafür nicht.' }, { t: 'Grenzmaße', h: `Höchstmaß: ${F(it.N)} mm ${it.up < 0 ? '−' : '+'} ${F(Math.abs(it.up))} mm = <b>${F(max)} mm</b><br>Mindestmaß: ${F(it.N)} mm ${it.lo < 0 ? '−' : '+'} ${F(Math.abs(it.lo))} mm = <b>${F(min)} mm</b>` }] };
    }
    if (it.kind === 'lin') return lin(it.N, 'len');
    if (it.kind === 'rad' || it.kind === 'fase') return lin(it.N, 'rad');
    if (it.kind === 'ang') {
      const rows = T.ANG2768.ranges.map((r, i) => [`Schenkel ${T.angRangeText(i)}`, T.devText(T.ANG2768[ml][i])]);
      return { sum: `${T.devText(T.ANG2768[ml][4])} bis ${T.devText(T.ANG2768[ml][0])}, je nach Schenkellänge`, rows, steps: [{ t: 'Winkel ohne Toleranz', h: `Die zulässige Abweichung hängt von der Länge des kürzeren Schenkels ab. Die Tabelle zeigt die Werte für Klasse ${ml}. Den genauen Wert bekommst du im Rechner „Winkel“ mit der Schenkellänge.` }], calc: () => { Object.assign(A.ang, { nom: T.fmt(it.deg), cls: ml }); return 'ang'; } };
    }
    return { err: 'Unbekannte Art.' };
  }

  const pct = v => (v * 100).toFixed(3) + '%';
  function renderFotoStage() {
    const el = $('#foto-stage');
    if (!el) return;
    let html = '';
    if (FOTO.phase === 'crop' && FOTO.src) {
      const W = FOTO.src.width, H = FOTO.src.height;
      html += `<p class="small muted">Zieh die vier Ecken an den Rand der Zeichnung. Die App schneidet den Hintergrund weg und richtet die Zeichnung gerade aus.</p>
        <div class="crop-wrap" id="crop-wrap" style="aspect-ratio:${W} / ${H};width:min(calc(100% - 28px), calc(68vh * ${(W / H).toFixed(4)}))">
          <img src="${FOTO.srcUrl}" alt="Foto zum Zuschneiden" draggable="false">
          <svg class="crop-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path id="crop-shade" class="crop-shade" fill-rule="evenodd" d=""/><polygon id="crop-poly" class="crop-poly" points=""/></svg>
          ${[0, 1, 2, 3].map(i => `<div class="crop-h" data-c="${i}" aria-label="Ecke ${['oben links', 'oben rechts', 'unten rechts', 'unten links'][i]} verschieben"></div>`).join('')}
          <div class="loupe" id="loupe" hidden></div>
        </div>
        <div class="btn-row"><button type="button" class="btn plain" data-act="foto-rot">Drehen</button><button type="button" class="btn plain" data-act="foto-full">Ganzes Bild</button></div>
        <button type="button" class="btn primary" data-act="foto-go">Zuschneiden und Maße suchen</button>`;
    } else if (FOTO.url) {
      const boxes = A.foto.items.map((it, i) => it.box ? `<button type="button" class="foto-box${FOTO.open === i ? ' on' : ''}" data-act="foto-open" data-i="${i}" aria-label="${esc(it.label)}" style="left:${pct(it.box.x)};top:${pct(it.box.y)};width:${pct(it.box.w)};height:${pct(it.box.h)}"></button>` : '').join('');
      const sel = FOTO.sel ? `<div class="sel-box" id="sel-box" style="left:${pct(FOTO.sel.x)};top:${pct(FOTO.sel.y)};width:${pct(FOTO.sel.w)};height:${pct(FOTO.sel.h)}"></div>` : '';
      html += `<div class="foto-wrap${FOTO.selMode ? ' selecting' : ''}" id="foto-wrap"><img src="${FOTO.url}" alt="Foto der Zeichnung" draggable="false"><div class="foto-boxes">${boxes}</div>${sel}</div>`;
      if (!FOTO.busy) {
        if (FOTO.selMode) {
          html += `<p class="small muted">${FOTO.sel ? 'Passt der Rahmen? Du kannst ihn neu ziehen. Dann tippe auf „Hier genauer suchen“.' : 'Tippe im Bild auf die Stelle mit dem Maß oder zieh mit dem Finger einen Rahmen darum.'}</p>
            <div class="btn-row"><button type="button" class="btn primary" data-act="foto-sel-go"${FOTO.sel ? '' : ' disabled'}>Hier genauer suchen</button><button type="button" class="btn plain" data-act="foto-sel-cancel">Fertig</button></div>`;
        } else {
          html += `<div class="btn-row"><button type="button" class="btn soft" data-act="foto-sel">Stelle genauer ansehen</button><button type="button" class="btn plain" data-act="foto-recrop">Neu zuschneiden</button></div>`;
        }
      }
    }
    if (FOTO.busy) html += `<div class="ocr-progress"><div class="bar"><i style="width:${Math.round(FOTO.pct * 100)}%"></i></div><span>${esc(FOTO.status)}</span></div>`;
    if (FOTO.regionMsg) html += msgHTML(FOTO.regionMsg, FOTO.regionOk ? 'info' : 'warn');
    if (!FOTO.busy && FOTO.regionAlts && FOTO.regionAlts.length) html += `<p class="small muted alt-lbl">${FOTO.regionSwap ? 'Falsch gelesen? Stattdessen:' : 'Vielleicht steht hier:'}</p><div class="chips alt-chips">${FOTO.regionAlts.map((it, i) => `<button type="button" class="chip" data-act="foto-alt" data-i="${i}">${esc(it.label)}</button>`).join('')}</div>`;
    if (FOTO.error) html += msgHTML(esc(FOTO.error), 'warn');
    el.innerHTML = html;
    if (FOTO.phase === 'crop') updateCrop();
  }
  function updateCrop() {
    const W = FOTO.src.width, H = FOTO.src.height, q = FOTO.quad;
    const P = q.map(p => [p[0] / W * 100, p[1] / H * 100]);
    const poly = $('#crop-poly'), shade = $('#crop-shade');
    if (!poly) return;
    poly.setAttribute('points', P.map(p => p.join(',')).join(' '));
    shade.setAttribute('d', `M0 0H100V100H0Z M${P.map(p => p.join(' ')).join(' L')} Z`);
    $$('#crop-wrap .crop-h').forEach(h => { const p = P[+h.dataset.c]; h.style.left = p[0] + '%'; h.style.top = p[1] + '%'; });
  }
  // Ecken ziehen (Zuschneiden) und Rahmen ziehen (Stelle genauer ansehen)
  function moveCorner(e) {
    const wrap = $('#crop-wrap');
    if (!wrap) return;
    const r = wrap.getBoundingClientRect();
    const nx = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), ny = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    FOTO.quad[FOTO.drag.c] = [nx * FOTO.src.width, ny * FOTO.src.height];
    updateCrop();
    const lp = $('#loupe');
    if (lp) {
      const z = 2.6, size = 96;
      lp.hidden = false;
      lp.style.left = (nx * r.width - size / 2) + 'px';
      lp.style.top = (ny * r.height < 140 ? ny * r.height + 40 : ny * r.height - size - 40) + 'px';
      lp.style.backgroundImage = `url(${FOTO.srcUrl})`;
      lp.style.backgroundSize = `${r.width * z}px ${r.height * z}px`;
      lp.style.backgroundPosition = `${-(nx * r.width * z - size / 2)}px ${-(ny * r.height * z - size / 2)}px`;
    }
  }
  function selFromDrag(e) {
    const wrap = $('#foto-wrap'), r = wrap.getBoundingClientRect();
    const x1 = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y1 = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    const d = FOTO.selDrag;
    return { x: Math.min(d.x0, x1), y: Math.min(d.y0, y1), w: Math.abs(x1 - d.x0), h: Math.abs(y1 - d.y0), tapX: x1, tapY: y1 };
  }
  document.addEventListener('pointerdown', e => {
    const h = e.target.closest && e.target.closest('.crop-h');
    if (h && FOTO.phase === 'crop') {
      e.preventDefault();
      FOTO.drag = { c: +h.dataset.c };
      try { h.setPointerCapture(e.pointerId); } catch (x) { /* ohne Capture */ }
      moveCorner(e);
      return;
    }
    const wrap = e.target.closest && e.target.closest('#foto-wrap.selecting');
    if (wrap) {
      e.preventDefault();
      const r = wrap.getBoundingClientRect();
      FOTO.selDrag = { x0: (e.clientX - r.left) / r.width, y0: (e.clientY - r.top) / r.height };
      try { wrap.setPointerCapture(e.pointerId); } catch (x) { /* ohne Capture */ }
    }
  });
  document.addEventListener('pointermove', e => {
    if (FOTO.drag) { e.preventDefault(); moveCorner(e); return; }
    if (FOTO.selDrag) {
      const b = selFromDrag(e);
      let box = $('#sel-box');
      if (!box) { box = document.createElement('div'); box.className = 'sel-box'; box.id = 'sel-box'; $('#foto-wrap').appendChild(box); }
      Object.assign(box.style, { left: pct(b.x), top: pct(b.y), width: pct(b.w), height: pct(b.h) });
    }
  });
  const endDrag = e => {
    if (FOTO.drag) { FOTO.drag = null; const lp = $('#loupe'); if (lp) lp.hidden = true; return; }
    if (FOTO.selDrag) {
      let b = selFromDrag(e);
      if (b.w < 0.03 && b.h < 0.03) {   // nur getippt: Rahmen um die Stelle legen
        const w = 0.3, h = 0.12;
        b = { x: Math.min(1 - w, Math.max(0, b.tapX - w / 2)), y: Math.min(1 - h, Math.max(0, b.tapY - h / 2)), w, h };
      }
      FOTO.sel = { x: b.x, y: b.y, w: b.w, h: b.h };
      FOTO.selDrag = null;
      renderFotoStage();
    }
  };
  document.addEventListener('pointerup', endDrag);
  document.addEventListener('pointercancel', endDrag);

  function renderFotoList() {
    const el = $('#foto-list');
    if (!el) return;
    const code = $('#foto-code');
    if (code) code.textContent = A.foto.ml + (A.foto.detected && A.foto.detected.hk ? A.foto.detected.hk : '');
    const det = $('#foto-det');
    if (det) det.innerHTML = A.foto.detected ? `<span class="badge">im Foto erkannt</span>` : '';
    const items = A.foto.items;
    if (!items.length) {
      el.innerHTML = FOTO.busy ? '' : msgHTML('Noch keine Maße. Mach ein Foto oder füge Maße von Hand hinzu.');
      return;
    }
    el.innerHTML = `<div class="foto-head"><span class="eyebrow">${items.length} Maße gefunden</span><button type="button" class="link-btn" data-act="foto-clear">Liste leeren</button></div>
      <div class="list foto-items">${items.map((it, i) => {
        const r = evalDim(it), open = FOTO.open === i;
        return `<div class="dim-row${open ? ' open' : ''}" id="dim-${i}">
          <button type="button" class="dim-main" data-act="foto-open" data-i="${i}" aria-expanded="${open}">
            <span class="dim-label">${esc(it.label)}${it.count > 1 ? ` <small>${it.count}×</small>` : ''}</span>
            <span class="dim-kind${r.fit ? ' ' + r.fit : ''}">${esc(r.sub || KIND_NAME[it.kind])}</span>
            <span class="dim-sum">${r.err ? esc(r.err) : esc(r.sum)}${it.guess ? ' · <b class="guess">bitte prüfen</b>' : ''}</span>${I.chevR}</button>
          ${open ? `<div class="dim-detail">
            ${it.guess ? msgHTML(esc(it.guess), 'warn') : ''}
            ${r.err ? msgHTML(esc(r.err), 'warn') : `<div class="kv">${r.rows.map(([k, v, full]) => kv(esc(k), v, full)).join('')}</div>`}
            <div class="btn-row">${r.calc ? `<button type="button" class="btn soft" data-act="foto-calc" data-i="${i}">Im Rechner öffnen</button>` : ''}<button type="button" class="btn plain" data-act="foto-edit" data-i="${i}">${I.pencil}Korrigieren</button></div>
            <button type="button" class="link-btn danger" data-act="foto-del" data-i="${i}">${I.x}Aus der Liste entfernen</button>
            ${r.steps ? calcHTML('foto-steps', r.steps) : ''}
          </div>` : ''}
        </div>`;
      }).join('')}</div>
      <p class="foot">Prüfe die Liste mit der Zeichnung. Senkrechte, schräge und handschriftliche Maße sowie kleine hochgestellte Toleranzen erkennt die App nicht immer. Fehlt etwas oder stimmt ein Wert nicht, tippe auf „Korrigieren“ oder füge es unten von Hand hinzu.</p>`;
  }
  function computeFoto() { renderFotoStage(); renderFotoList(); }

  function mergeFotoItems(list) {
    const seen = new Map(A.foto.items.map(it => [it.kind + '|' + it.label, it]));
    list.forEach(it => { const k = it.kind + '|' + it.label; if (seen.has(k)) seen.get(k).count = (seen.get(k).count || 1) + (it.count || 1); else { A.foto.items.push(it); seen.set(k, it); } });
  }

  function loadScript(src) {
    return new Promise((res, rej) => { const sc = document.createElement('script'); sc.src = src; sc.onload = res; sc.onerror = () => rej(new Error('script')); document.head.appendChild(sc); });
  }
  async function getOcr() {
    if (!window.Tesseract) await loadScript('ocr/tesseract.min.js');
    if (!OCRW) {
      const base = new URL('ocr/', location.href).href;
      OCRW = await window.Tesseract.createWorker('eng', 1, { workerPath: base + 'worker.min.js', corePath: base, langPath: base, gzip: true, logger: m => { if (FOTO.log) FOTO.log(m); } });
      const psm = (window.__FOTO && (location.search.match(/psm=(\d+)/) || [])[1]) || '11';
      await OCRW.setParameters({ tessedit_pageseg_mode: psm, preserve_interword_spaces: '1' });
    }
    return OCRW;
  }
  function loadImage(file) {
    return new Promise((res, rej) => { const img = new Image(); img.onload = () => res(img); img.onerror = () => rej(new Error('bild')); img.src = URL.createObjectURL(file); });
  }
  function setSource(c) { FOTO.src = c; FOTO.srcUrl = c.toDataURL('image/jpeg', 0.85); }
  const fullQuad = c => [[0, 0], [c.width, 0], [c.width, c.height], [0, c.height]];
  // Helles Blatt auf dunklerem Untergrund finden: größte helle Fläche, ihre vier äußersten Ecken
  function detectPaper(src) {
    const s = 320 / Math.max(src.width, src.height), w = Math.max(8, Math.round(src.width * s)), h = Math.max(8, Math.round(src.height * s));
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(src, 0, 0, w, h);
    const px = ctx.getImageData(0, 0, w, h).data, g = new Uint8Array(w * h), hist = new Float64Array(256);
    for (let k = 0; k < w * h; k++) { g[k] = (px[k * 4] * 299 + px[k * 4 + 1] * 587 + px[k * 4 + 2] * 114) / 1000; hist[g[k]]++; }
    let sum = 0, sumB = 0, wB = 0, best = 0, t = 128;
    for (let i = 0; i < 256; i++) sum += i * hist[i];
    for (let i = 0; i < 256; i++) {
      wB += hist[i]; if (!wB) continue;
      const wF = w * h - wB; if (!wF) break;
      sumB += i * hist[i];
      const mB = sumB / wB, mF = (sum - sumB) / wF, v = wB * wF * (mB - mF) * (mB - mF);
      if (v > best) { best = v; t = i; }
    }
    const lab = new Int32Array(w * h), stack = [];
    let top = null;
    for (let k = 0; k < w * h; k++) {
      if (lab[k] || g[k] <= t) continue;
      const comp = { area: 0, edge: 0, tl: [0, 0, Infinity], tr: [0, 0, -Infinity], br: [0, 0, -Infinity], bl: [0, 0, Infinity] };
      lab[k] = 1; stack.push(k);
      while (stack.length) {
        const q = stack.pop(), x = q % w, y = (q - x) / w;
        comp.area++;
        if (!x || !y || x === w - 1 || y === h - 1) comp.edge++;
        if (x + y < comp.tl[2]) comp.tl = [x, y, x + y];
        if (x + y > comp.br[2]) comp.br = [x, y, x + y];
        if (x - y > comp.tr[2]) comp.tr = [x, y, x - y];
        if (x - y < comp.bl[2]) comp.bl = [x, y, x - y];
        const nb = [x > 0 ? q - 1 : -1, x < w - 1 ? q + 1 : -1, y > 0 ? q - w : -1, y < h - 1 ? q + w : -1];
        for (const n of nb) if (n >= 0 && !lab[n] && g[n] > t) { lab[n] = 1; stack.push(n); }
      }
      if (!top || comp.area > top.area) top = comp;
    }
    // Das Blatt muss sich vom Untergrund abheben: läuft die Fläche lange am Bildrand entlang, ist es kein Blatt auf dem Tisch
    if (!top || top.area < 0.2 * w * h || top.area > 0.96 * w * h || top.edge > 0.25 * (2 * (w + h) - 4)) return fullQuad(src);
    const q = [top.tl, top.tr, top.br, top.bl].map(p => [(p[0] + 0.5) / s, (p[1] + 0.5) / s]), full = fullQuad(src), tol = 0.03 * Math.max(src.width, src.height);
    // Liegt der Vorschlag fast auf den Bildecken, nicht entzerren (das würde nur unscharf machen)
    if (q.every((p, i) => Math.hypot(p[0] - full[i][0], p[1] - full[i][1]) < tol)) return full;
    return q;
  }
  // Viereck auf ein gerades Rechteck ziehen (Perspektive entzerren)
  function warp(src, q) {
    const d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
    let Wd = Math.max(d(q[0], q[1]), d(q[3], q[2])), Hd = Math.max(d(q[0], q[3]), d(q[1], q[2]));
    const sc = Math.min(1, 2600 / Math.max(Wd, Hd));
    Wd = Math.max(16, Math.round(Wd * sc)); Hd = Math.max(16, Math.round(Hd * sc));
    const out = document.createElement('canvas');
    out.width = Wd; out.height = Hd;
    const full = fullQuad(src);
    if (q.every((p, i) => Math.abs(p[0] - full[i][0]) < 1 && Math.abs(p[1] - full[i][1]) < 1)) {
      out.getContext('2d').drawImage(src, 0, 0, Wd, Hd);
      return out;
    }
    const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
    const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3, dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
    const den = dx1 * dy2 - dx2 * dy1;
    const G = Math.abs(den) < 1e-9 ? 0 : (dx3 * dy2 - dx2 * dy3) / den, Hh = Math.abs(den) < 1e-9 ? 0 : (dx1 * dy3 - dx3 * dy1) / den;
    const a = x1 - x0 + G * x1, b = x3 - x0 + Hh * x3, c = x0, dd = y1 - y0 + G * y1, e = y3 - y0 + Hh * y3, f = y0;
    const sw = src.width, sh = src.height;
    const sp = src.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, sw, sh).data;
    const octx = out.getContext('2d'), od = octx.createImageData(Wd, Hd), op = od.data;
    for (let j = 0; j < Hd; j++) {
      const v = (j + 0.5) / Hd;
      for (let i = 0; i < Wd; i++) {
        const u = (i + 0.5) / Wd, z = G * u + Hh * v + 1;
        let x = (a * u + b * v + c) / z - 0.5, y = (dd * u + e * v + f) / z - 0.5;
        x = Math.min(sw - 1.001, Math.max(0, x)); y = Math.min(sh - 1.001, Math.max(0, y));
        const xi = x | 0, yi = y | 0, fx = x - xi, fy = y - yi, k = (yi * sw + xi) * 4, o = (j * Wd + i) * 4;
        for (let ch = 0; ch < 3; ch++) {
          const p00 = sp[k + ch], p10 = sp[k + 4 + ch], p01 = sp[k + sw * 4 + ch], p11 = sp[k + sw * 4 + 4 + ch];
          op[o + ch] = (p00 * (1 - fx) + p10 * fx) * (1 - fy) + (p01 * (1 - fx) + p11 * fx) * fy;
        }
        op[o + 3] = 255;
      }
    }
    octx.putImageData(od, 0, 0);
    return out;
  }
  function rotateSource() {
    const s0 = FOTO.src, c = document.createElement('canvas');
    c.width = s0.height; c.height = s0.width;
    const ctx = c.getContext('2d');
    ctx.translate(s0.height, 0); ctx.rotate(Math.PI / 2); ctx.drawImage(s0, 0, 0);
    const H0 = s0.height, q = FOTO.quad.map(p => [H0 - p[1], p[0]]);
    FOTO.quad = [q[3], q[0], q[1], q[2]];
    setSource(c);
  }
  // Graustufen und örtliche Schwelle (gegen Schatten und graues Papier), bei rot gedreht um 90° im Uhrzeigersinn
  function prepCanvas(img, rot, fixed) {
    const w = img.naturalWidth || img.width, h = img.naturalHeight || img.height, long = Math.max(w, h);
    const sc = fixed ? 1 : long > 2600 ? 2600 / long : long < 1600 ? 1600 / long : 1;
    const W = Math.round(w * sc), H = Math.round(h * sc);
    const c = document.createElement('canvas');
    c.width = rot ? H : W; c.height = rot ? W : H;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    if (rot === 90) { ctx.translate(H, 0); ctx.rotate(Math.PI / 2); }
    if (rot === 270) { ctx.translate(0, W); ctx.rotate(-Math.PI / 2); }
    ctx.drawImage(img, 0, 0, W, H);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const cw = c.width, ch = c.height;
    const d = ctx.getImageData(0, 0, cw, ch), px = d.data;
    const g = new Float32Array(cw * ch);
    for (let i = 0, k = 0; i < px.length; i += 4, k++) { g[k] = (px[i] * 299 + px[i + 1] * 587 + px[i + 2] * 114) / 1000; px[i] = px[i + 1] = px[i + 2] = g[k]; }
    ctx.putImageData(d, 0, 0);   // erste Fassung: nur Graustufen
    // Summenbild für schnelle Mittelwerte im Fenster
    const S = new Float64Array((cw + 1) * (ch + 1)), Q = new Float64Array((cw + 1) * (ch + 1));
    for (let y = 0; y < ch; y++) {
      let rs = 0, rq = 0;
      for (let x = 0; x < cw; x++) {
        const v = g[y * cw + x];
        rs += v; rq += v * v;
        const o = (y + 1) * (cw + 1) + x + 1;
        S[o] = S[o - cw - 1] + rs; Q[o] = Q[o - cw - 1] + rq;
      }
    }
    const r = Math.max(12, Math.round(Math.min(cw, ch) / 40));
    for (let y = 0; y < ch; y++) {
      const y0 = Math.max(0, y - r), y1 = Math.min(ch, y + r + 1);
      for (let x = 0; x < cw; x++) {
        const x0 = Math.max(0, x - r), x1 = Math.min(cw, x + r + 1);
        const n = (y1 - y0) * (x1 - x0);
        const a = y1 * (cw + 1) + x1, b = y0 * (cw + 1) + x1, e = y1 * (cw + 1) + x0, f0 = y0 * (cw + 1) + x0;
        const mean = (S[a] - S[b] - S[e] + S[f0]) / n;
        const sd = Math.sqrt(Math.max(0, (Q[a] - Q[b] - Q[e] + Q[f0]) / n - mean * mean));
        // Sauvola: dunkler als der örtliche Hintergrund heißt Schrift oder Linie
        const t = mean * (1 + 0.2 * (sd / 128 - 1));
        const k = (y * cw + x) * 4;
        const v = g[y * cw + x] < t && g[y * cw + x] < 215 ? 0 : 255;
        px[k] = px[k + 1] = px[k + 2] = v;
      }
    }
    const cb = document.createElement('canvas');
    cb.width = cw; cb.height = ch;
    cb.getContext('2d').putImageData(d, 0, 0);   // zweite Fassung: Schwarzweiß
    // Dritte Fassung: lange waagrechte und senkrechte Linien (Kanten, Maßlinien, Rahmen) entfernt, damit Schrift frei steht
    const c2 = document.createElement('canvas');
    c2.width = cw; c2.height = ch;
    const ctx2 = c2.getContext('2d');
    const Lmin = Math.max(70, Math.round(Math.min(cw, ch) * 0.06));
    const blk = new Uint8Array(cw * ch);
    for (let k = 0; k < blk.length; k++) blk[k] = px[k * 4] === 0 ? 1 : 0;
    const kill = new Uint8Array(cw * ch);
    for (let y = 0; y < ch; y++) {
      let x = 0;
      while (x < cw) {
        if (!blk[y * cw + x]) { x++; continue; }
        let e = x;
        while (e < cw && blk[y * cw + e]) e++;
        if (e - x >= Lmin) for (let q = x; q < e; q++) kill[y * cw + q] = 1;
        x = e;
      }
    }
    for (let x = 0; x < cw; x++) {
      let y = 0;
      while (y < ch) {
        if (!blk[y * cw + x]) { y++; continue; }
        let e = y;
        while (e < ch && blk[e * cw + x]) e++;
        if (e - y >= Lmin) for (let q = y; q < e; q++) kill[q * cw + x] = 1;
        y = e;
      }
    }
    for (let k = 0; k < kill.length; k++) if (kill[k]) { const o = k * 4; px[o] = px[o + 1] = px[o + 2] = 255; }
    ctx2.putImageData(d, 0, 0);
    return { canvas: c, bin: cb, clean: c2, W, H };
  }
  // Ein Wort nachbessern: Das Durchmesserzeichen Ø wird oft als 2, 0 oder @ gelesen, ist aber deutlich breiter als eine Ziffer
  function fixWord(w) {
    const sy = w.symbols || [];
    let t = w.text || '';
    const bw = s => s.bbox.x1 - s.bbox.x0;
    if (sy.length >= 2 && /^[0-9@?Oo]$/.test(sy[0].text) && !/\d\.\d\d\./.test(t)) {
      const rest = sy.slice(1).filter(x => /\d/.test(x.text));
      if (rest.length) {
        const mw = rest.map(bw).sort((a, b) => a - b)[rest.length >> 1];
        if (bw(sy[0]) >= 1.3 * mw) t = 'Ø' + t.slice(sy[0].text.length);
      }
    }
    if (/^0(\d{2}|\d[.,]\d)/.test(t)) t = 'Ø' + t.slice(1);   // eine führende 0 vor einer Ziffer gibt es bei Maßen nicht
    return t;
  }
  // Zeilen aus der Erkennung holen; kleine hochgestellte Abmaße rechts neben einem Maß werden angehängt
  function linesFrom(data, rot, W, H, fixedBox, plainConf) {
    const raw = [];
    (data.blocks || []).forEach(b => (b.paragraphs || []).forEach(p => (p.lines || []).forEach(l => {
      const text = (l.words && l.words.length) ? l.words.map(fixWord).join(' ') : l.text;
      raw.push({ text: text.trim(), conf: l.confidence, bb: Object.assign({}, l.bbox) });
    })));
    const hgt = r => r.bb.y1 - r.bb.y0;
    raw.forEach(a => {
      if (a.used || !/\d\s*$/.test(a.text) || /[±+\-−–]\s*\d/.test(a.text)) return;
      const ha = hgt(a);
      const small = raw.filter(b => b !== a && !b.used && /^[+±\-−–]?\s*[0-9Oo]/.test(b.text) && hgt(b) <= 0.9 * ha &&
        b.bb.x0 >= a.bb.x1 - 3 && b.bb.x0 - a.bb.x1 <= 1.2 * ha &&
        (b.bb.y0 + b.bb.y1) / 2 >= a.bb.y0 - 0.7 * ha && (b.bb.y0 + b.bb.y1) / 2 <= a.bb.y1 + 0.4 * ha);
      if (!small.length || !small.some(b => /^[+±\-−–]/.test(b.text))) return;
      small.sort((x, y) => x.bb.y0 - y.bb.y0).slice(0, 2).forEach(b => {
        b.used = true;
        a.text += ' ' + b.text;
        a.bb = { x0: Math.min(a.bb.x0, b.bb.x0), y0: Math.min(a.bb.y0, b.bb.y0), x1: Math.max(a.bb.x1, b.bb.x1), y1: Math.max(a.bb.y1, b.bb.y1) };
      });
      if (small.length === 1 && /^[+]/.test(small[0].text)) a.text += ' 0';   // nur ein Abmaß oben: unten steht 0
    });
    return raw.filter(r => !r.used).map(r => {
      const bb = r.bb;
      if (fixedBox) return { text: r.text, conf: r.conf, minPlainConf: plainConf || 40, box: fixedBox };
      const q = rot === 90;
      const x0 = q ? bb.y0 : bb.x0, x1 = q ? bb.y1 : bb.x1, y0 = q ? H - bb.x1 : bb.y0, y1 = q ? H - bb.x0 : bb.y1;
      return { text: r.text, conf: r.conf, minPlainConf: rot ? 70 : 50, box: { x: x0 / W, y: y0 / H, w: (x1 - x0) / W, h: (y1 - y0) / H } };
    });
  }
  // Foto gewählt: auf höchstens 3000 Pixel verkleinern, Blatt suchen, Zuschneiden anbieten
  async function handleFoto(file) {
    if (FOTO.busy) return;
    FOTO.error = ''; FOTO.regionMsg = ''; FOTO.regionAlts = []; FOTO.open = -1; FOTO.sel = null; FOTO.selMode = false;
    try {
      const img = await loadImage(file);
      const w = img.naturalWidth, h = img.naturalHeight, sc = Math.min(1, 3000 / Math.max(w, h));
      const c = document.createElement('canvas');
      c.width = Math.round(w * sc); c.height = Math.round(h * sc);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      setSource(c);
      FOTO.quad = detectPaper(c);
      FOTO.phase = 'crop';
    } catch (e) {
      FOTO.error = 'Das Foto konnte ich nicht öffnen. Versuch es bitte noch einmal.';
    }
    computeFoto();
    const cw = $('#crop-wrap');
    if (cw) cw.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
  function ocrFailText() {
    return window.top !== window ? 'Im Vorschau-Link funktioniert die Texterkennung nicht. Nutze die App vom Home-Bildschirm oder die Adresse auf github.io. Maße kannst du hier trotzdem von Hand eintragen.' : 'Die Texterkennung hat nicht geklappt. Beim ersten Mal braucht die App Internet, um sie zu laden (etwa 7 MB). Versuch es noch einmal oder füge die Maße unten von Hand ein.';
  }
  function refreshFotoMl() {
    const seg = $('#card-foto [data-k="foto.ml"]');
    if (seg) $$('button', seg).forEach(x => x.setAttribute('aria-pressed', String(x.dataset.v === A.foto.ml)));
  }
  // Zugeschnittenes Bild durchsuchen: sechs Durchgänge
  async function runMain() {
    if (FOTO.busy || !FOTO.src) return;
    FOTO.busy = true; FOTO.error = ''; FOTO.regionMsg = ''; FOTO.regionAlts = []; FOTO.pct = 0; FOTO.open = -1; FOTO.sel = null; FOTO.selMode = false;
    FOTO.status = 'Zeichnung wird zugeschnitten …';
    A.foto.items = []; A.foto.detected = null; saveA();
    FOTO.phase = 'done'; FOTO.url = FOTO.srcUrl;
    computeFoto();
    await new Promise(r => setTimeout(r, 30));
    try {
      const work = warp(FOTO.src, FOTO.quad);
      FOTO.work = work; FOTO.url = work.toDataURL('image/jpeg', 0.88);
      computeFoto();
      let pass = 1;
      const PASSES = 6;
      FOTO.log = m => {
        if (m.status === 'recognizing text') { FOTO.status = `Maße werden gesucht, Durchgang ${pass} von ${PASSES} …`; FOTO.pct = (pass - 1 + (m.progress || 0)) / PASSES; }
        else { FOTO.status = 'Texterkennung wird geladen …' + (OCRW ? '' : ' Beim ersten Mal braucht das etwas Zeit und Internet.'); }
        renderFotoStage();
      };
      const worker = await getOcr();
      // Sechs Durchgänge: waagrecht und senkrecht, jeweils als Graubild, als Schwarzweißbild und ohne lange Linien
      const a = prepCanvas(work, 0), b = prepCanvas(work, 90);
      const runs = [[a.canvas, 0], [b.canvas, 90], [a.bin, 0], [b.bin, 90], [a.clean, 0], [b.clean, 90]];
      const datas = [];
      let lines = [];
      for (const [cv, rot] of runs) {
        const r = await worker.recognize(cv, {}, { blocks: true, text: true });
        datas.push(r.data);
        lines = lines.concat(linesFrom(r.data, rot, a.W, a.H));
        pass++;
      }
      FOTO.lines = lines;
      if (window.__FOTO) { FOTO.raw = [datas[0], datas[1]]; FOTO.canvas = a.canvas.toDataURL('image/png'); }
      const parsed = T.parseDrawing(lines);
      A.foto.items = parsed.items;
      if (parsed.general) { A.foto.detected = parsed.general; A.foto.ml = parsed.general.ml; if (parsed.general.hk) A.foto.hk = parsed.general.hk; }
      saveA();
      if (!parsed.items.length) FOTO.error = 'Im Foto habe ich keine Maße gefunden. Fotografiere möglichst gerade von oben, mit gutem Licht und so nah, dass die Zahlen gut lesbar sind. Mit „Stelle genauer ansehen“ kannst du einzelne Stellen noch einmal lesen lassen.';
      if (parsed.iso22081) FOTO.error = (FOTO.error ? FOTO.error + ' ' : '') + 'Auf der Zeichnung steht ISO 22081. Die Maße ohne Toleranz werden dort über die Profiltoleranz geregelt, nicht über ISO 2768. Nutze dafür den Rechner „Allgemeintoleranz“, Neue Tabelle.';
    } catch (e) {
      FOTO.error = ocrFailText();
    }
    FOTO.busy = false; FOTO.log = null;
    if (S.page === 'tol' && curSection().id === 'foto') { refreshFotoMl(); computeFoto(); }
  }
  // Eine markierte Stelle vergrößert und auf mehrere Arten lesen
  // Ausschnitt für die Nachsuche: so vergrößert, dass der Rahmen quer zur Schrift etwa th Pixel hoch ist, mit weißem Rand
  function regionCanvas(r, th, rot, stretch) {
    const vert = rot === 90 || rot === 270, across = vert ? r.w : r.h;
    const sc = Math.min(6, 2400 / Math.max(r.w, r.h), Math.max(0.5, th / across));
    const cw = Math.max(8, Math.round(r.w * sc)), ch = Math.max(8, Math.round(r.h * sc)), pad = Math.round(0.1 * across * sc);
    const c = document.createElement('canvas');
    c.width = (vert ? ch : cw) + 2 * pad; c.height = (vert ? cw : ch) + 2 * pad;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
    g.imageSmoothingQuality = 'high';
    g.translate(c.width / 2, c.height / 2); g.rotate(rot * Math.PI / 180);
    g.drawImage(FOTO.work, r.x, r.y, r.w, r.h, -cw / 2, -ch / 2, cw, ch);
    g.setTransform(1, 0, 0, 1, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height), p = d.data, n = c.width * c.height, gr = new Uint8ClampedArray(n);
    for (let i = 0; i < n; i++) gr[i] = (p[i * 4] * 299 + p[i * 4 + 1] * 587 + p[i * 4 + 2] * 114) / 1000;
    let lo = 0, hi = 255;
    if (stretch) {   // Kontrast strecken: dunkelste Schrift wird schwarz, Papier weiß (hilft bei grauem Papier und Schatten)
      const h = new Uint32Array(256);
      let m = 0;
      for (let y = pad; y < c.height - pad; y++) for (let x = pad; x < c.width - pad; x++) { h[gr[y * c.width + x]]++; m++; }
      let acc = 0; lo = -1;
      for (let v = 0; v < 256; v++) { acc += h[v]; if (lo < 0 && acc >= m * 0.02) lo = v; if (acc >= m * 0.9) { hi = v; break; } }
      if (hi - lo < 20) { lo = 0; hi = 255; }
    }
    for (let i = 0; i < n; i++) { const v = (gr[i] - lo) / (hi - lo) * 255; p[i * 4] = p[i * 4 + 1] = p[i * 4 + 2] = v; }
    g.putImageData(d, 0, 0);
    return c;
  }
  // Nachsuche in einem Rahmen: viele Lesarten, die häufigste gewinnt, die anderen werden zur Auswahl angeboten
  async function regionSearch() {
    if (FOTO.busy || !FOTO.work || !FOTO.sel) return;
    const sel = FOTO.sel, W = FOTO.work.width, H = FOTO.work.height;
    let x = sel.x * W, y = sel.y * H, w = sel.w * W, h = sel.h * H;
    x = Math.max(0, x - w * 0.04); y = Math.max(0, y - h * 0.08);
    w = Math.min(W - x, w * 1.08); h = Math.min(H - y, h * 1.16);
    const r = { x, y, w, h }, box = { x: x / W, y: y / H, w: w / W, h: h / H };
    FOTO.busy = true; FOTO.regionMsg = ''; FOTO.regionAlts = []; FOTO.error = ''; FOTO.pct = 0;
    FOTO.status = 'Die Stelle wird genauer gelesen …';
    renderFotoStage();
    // [Drehung, Rahmenhöhe in Pixel, Aufbereitung (0 grau, 1 Kontrast gestreckt, 2 lange Linien entfernt), Seitenaufteilung]
    const flat = [[0, 90, 0, '6'], [0, 90, 0, '7'], [0, 60, 0, '6'], [0, 130, 0, '7'], [0, 90, 1, '6'], [0, 90, 0, '11'], [0, 90, 2, '6']];
    const tall = [[90, 90, 0, '6'], [270, 90, 0, '6'], [90, 90, 0, '7'], [270, 90, 0, '7'], [90, 60, 1, '6'], [270, 60, 1, '6'], [90, 130, 0, '7'], [270, 130, 0, '7']];
    const ratio = h / w;
    const runs = ratio > 1.3 ? tall : ratio < 0.77 ? flat : flat.slice(0, 5).concat(tall.slice(0, 4));
    const votes = new Map();
    let lines = [], general = null;
    try {
      const worker = await getOcr();
      let n = 0;
      FOTO.log = m => { if (m.status === 'recognizing text') { FOTO.pct = (n + (m.progress || 0)) / runs.length; renderFotoStage(); } };
      for (const [rot, th, mode, psm] of runs) {
        let cv = regionCanvas(r, th, rot, mode === 1);
        if (mode === 2) cv = prepCanvas(cv, 0, true).clean;
        await worker.setParameters({ tessedit_pageseg_mode: psm });
        const res = await worker.recognize(cv, {}, { blocks: true, text: true });
        const ls = linesFrom(res.data, 0, 1, 1, box, 30).map(l => Object.assign(l, { run: n }));
        lines = lines.concat(ls);
        const p = T.parseDrawing(ls.map(l => ({ text: l.text, conf: l.conf, minPlainConf: l.minPlainConf })));   // ohne Ort: jede Lesart zählt für sich
        if (p.general && !general) general = p.general;
        new Set(p.items.map(it => it.label)).forEach(lab => {
          const it = p.items.find(q => q.label === lab), v = votes.get(lab) || { it, n: 0, conf: 0 };
          v.n++; v.conf = Math.max(v.conf, it.conf || 0);
          votes.set(lab, v);
        });
        n++;
      }
      await worker.setParameters({ tessedit_pageseg_mode: '11' });
      FOTO.rlines = lines;
      if (general && !A.foto.detected) { A.foto.detected = general; A.foto.ml = general.ml; refreshFotoMl(); }
      const core = l => l.replace(/[Ø\s]/g, '');
      // Bruchstücke (z. B. „45“ neben „45 ±0,2“) zählen für die vollständigere Lesart mit
      // Ein Ø wird oft als 2, 0, 7 oder 9 gelesen: „210 H7“ kann auch „Ø10 H7“ sein, das kommt als Vorschlag dazu
      [...votes.values()].forEach(v => {
        const m = /^[2079](\d.*)$/.exec(v.it.label);
        if (!m || v.it.dia || v.it.pre) return;
        const q = T.parseDrawing([{ text: 'Ø' + m[1] }]).items[0];
        if (!q) return;
        if (!votes.has(q.label)) votes.set(q.label, { it: q, n: 0, conf: 0, extra: v });
        else votes.get(q.label).from = v;
      });
      const cand = [...votes.values()];
      // Vollständige Angaben (Toleranzklasse, Abmaße, Winkel, Radius) sind wahrscheinlicher als eine einzelne Ziffer aus Linienresten
      const plain = it => it.kind === 'lin' && !it.dia;
      cand.forEach(a => { a.score = a.n + a.conf / 1000 + (plain(a.it) ? (a.it.N < 10 && !/[,.]/.test(a.it.label) ? -0.5 : 0) : a.it.kind === 'lin' ? 0.2 : 0.6); });
      // a ist ein Bruchstück von b: gleich ohne Ø, oder b hat hinten noch Toleranz oder Passung („45“ → „45 ±0,2“)
      const noD = l => l.replace(/Ø/g, '');
      const isFrag = (a, b) => noD(a) === noD(b) ? b.length >= a.length : noD(b).startsWith(noD(a)) && /^[\s/]/.test(noD(b).slice(noD(a).length));
      cand.forEach(a => cand.forEach(b => { if (a !== b && noD(a.it.label) !== noD(b.it.label) && isFrag(a.it.label, b.it.label)) b.score += a.n * 0.9; }));
      const inBox = b => b && b.x + b.w / 2 >= box.x && b.x + b.w / 2 <= box.x + box.w && b.y + b.h / 2 >= box.y && b.y + b.h / 2 <= box.y + box.h;
      const here = A.foto.items.filter(it => inBox(it.box));
      cand.forEach(a => {
        const src = a.extra || a.from;
        if (!src) return;
        // „210 H7“ gelesen und „10 H7“ steht auch da: dann war die 2 das Ø
        const rest = core(a.it.label), twin = cand.find(c => c !== a && !c.extra && core(c.it.label) === rest) || here.find(it => core(it.label) === rest);
        if (twin) { a.score = Math.max(a.score, src.score + (twin.n || 1)); a.extra = null; } else if (a.extra) a.score = src.score - 0.01;   // sonst Vorschlag direkt hinter seiner Lesart
      });
      cand.sort((a, b) => b.score - a.score);
      const best = [];
      // Zwei Lesarten derselben Stelle („156“ und „3156“, „10 H7“ und „210 H7“): nur die bessere nehmen
      const clash = (a, b) => core(a).includes(core(b)) || core(b).includes(core(a));
      cand.forEach(c => { if (c.extra) return; if (!best.length || (c.n >= 2 && c.score >= 0.6 * best[0].score)) { if (!best.some(b => clash(c.it.label, b.it.label))) best.push(c); } });
      // Unsicher (nur einmal gelesen ohne Toleranz, oder eine einzelne Ziffer): nicht selbst eintragen, nur vorschlagen
      if (best.length === 1 && plain(best[0].it) && ((best[0].n < 2 && best[0].conf < 60) || (best[0].it.N < 10 && best[0].n < 3))) best.length = 0;
      const known = new Set(A.foto.items.map(it => it.label));
      const alts = cand.filter(c => !best.includes(c) && !known.has(c.it.label) && !best.some(b => isFrag(c.it.label, b.it.label) || isFrag(b.it.label, c.it.label) && c.n < 2)).slice(0, 4).map(c => c.it);
      const fresh = best.map(c => c.it).filter(it => !known.has(it.label) && !A.foto.items.some(old => inBox(old.box) && isFrag(it.label, old.label)));
      fresh.forEach(it => { it.box = box; it.count = 1; delete it.guess; });
      // Unvollständige Treffer an dieser Stelle durch das vollständige Maß ersetzen
      A.foto.items = A.foto.items.filter(old => !(inBox(old.box) && fresh.some(it => isFrag(old.label, it.label))));
      A.foto.items = A.foto.items.concat(fresh);
      saveA();
      FOTO.regionAlts = alts.map(it => Object.assign(it, { box, count: 1 }));
      FOTO.regionSwap = fresh.length === 1 ? fresh[0].label : '';
      if (fresh.length) {
        FOTO.regionOk = true;
        FOTO.regionMsg = `${fresh.length === 1 ? 'Neu erkannt' : fresh.length + ' Maße neu erkannt'}: <b>${fresh.map(it => esc(it.label)).join(', ')}</b>. Prüfe ${fresh.length === 1 ? 'es' : 'sie'} unten in der Liste.`;
        FOTO.open = A.foto.items.indexOf(fresh[0]);
        FOTO.sel = null;
      } else if (best.length) {
        FOTO.regionOk = true;
        FOTO.regionMsg = `Hier steht ${best.length === 1 ? 'ein Maß, das' : 'nur, was'} schon in der Liste ${best.length === 1 ? 'ist' : 'steht'}: <b>${best.map(c => esc(c.it.label)).join(', ')}</b>.`;
      } else {
        const seen = lines.map(l => T.normalizeOcr(l.text)).filter(t => /\d/.test(t)).sort((p, q) => q.length - p.length)[0] || '';
        FOTO.regionOk = false;
        FOTO.regionMsg = seen
          ? `Hier habe ich kein vollständiges Maß erkannt. Gelesen habe ich „${esc(seen)}“. Ich habe es unten ins Feld geschrieben: Korrigiere es und tippe auf „Dazu“.`
          : 'Hier habe ich nichts lesen können. Zieh den Rahmen etwas größer um das Maß oder trag es unten von Hand ein.';
        const inp = $('#foto-add');
        if (inp && seen) inp.value = seen;
      }
    } catch (e) {
      FOTO.error = ocrFailText();
    }
    FOTO.busy = false; FOTO.log = null;
    if (S.page === 'tol' && curSection().id === 'foto') computeFoto();
  }
  // Andere Lesart aus der Nachsuche übernehmen: ersetzt das eben erkannte Maß
  function takeRegionAlt(i) {
    const alt = FOTO.regionAlts[i];
    if (!alt) return;
    const at = FOTO.regionSwap ? A.foto.items.findIndex(it => it.label === FOTO.regionSwap) : -1;
    if (A.foto.items.some(it => it.label === alt.label)) { FOTO.open = A.foto.items.findIndex(it => it.label === alt.label); }
    else if (at >= 0) {
      FOTO.regionAlts.splice(i, 1, A.foto.items[at]);
      A.foto.items.splice(at, 1, alt);
      FOTO.open = at;
    } else { A.foto.items.push(alt); FOTO.open = A.foto.items.length - 1; FOTO.regionAlts.splice(i, 1); }
    FOTO.regionSwap = alt.label;
    FOTO.regionOk = true;
    FOTO.regionMsg = `Übernommen: <b>${esc(alt.label)}</b>. Prüfe es unten in der Liste.`;
    saveA(); computeFoto();
  }
  function fotoAddFromInput() {
    const inp = $('#foto-add'), msg = $('#foto-add-msg');
    const text = inp.value.trim();
    if (!text) return;
    const r = T.parseDrawing(text.split(/[\n;]/).map(t => ({ text: t })));
    if (!r.items.length) { msg.textContent = 'Darin habe ich kein Maß erkannt. Schreib es zum Beispiel so: Ø30 H7, 120, R5, 60 ±0,1 oder 25 +0,1 -0,05.'; return; }
    if (FOTO.editIdx >= 0 && A.foto.items[FOTO.editIdx]) {
      const old = A.foto.items[FOTO.editIdx];
      A.foto.items.splice(FOTO.editIdx, 1, Object.assign(r.items[0], { box: old.box, count: old.count || 1 }));
      FOTO.open = FOTO.editIdx;
      if (r.items.length > 1) mergeFotoItems(r.items.slice(1));
    } else {
      mergeFotoItems(r.items);
      FOTO.open = A.foto.items.findIndex(it => it.label === r.items[0].label && it.kind === r.items[0].kind);
    }
    if (r.general) { A.foto.ml = r.general.ml; A.foto.detected = r.general; }
    FOTO.editIdx = -1;
    inp.value = ''; msg.textContent = '';
    $('#foto-add-lbl').textContent = 'Maß von Hand hinzufügen';
    $('#foto-add-btn').textContent = 'Dazu';
    saveA(); computeFoto();
  }

  function out(id, html) { const el = $('#' + id); if (el) el.innerHTML = html; }
  // ================================================================
  // Werkstatt-Bereiche: Gewinde, Schnittdaten, Schrauben, Drehmoment, Gewicht, Dreieck, Rauheit, Gleitschleifen, Info
  // ================================================================
  const nf = (x, d = 2) => T.fmt(x, 0, d);
  const mmv = (x, d = 3) => `${T.fmt(x, 0, d)} mm`;
  const textInp = (id, k, ph, big) => `<div class="inp${big ? ' big' : ''}"><input id="${id}" data-k="${k}" value="${esc(getK(k))}" placeholder="${esc(ph)}" autocapitalize="off" autocorrect="off" spellcheck="false" autocomplete="off" enterkeyhint="done"></div>`;
  const selInp = (id, k, opts) => `<div class="inp sel"><select id="${id}" data-k="${k}">${opts.map(([v, l]) => `<option value="${esc(v)}"${String(getK(k)) === String(v) ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select></div>`;
  const optOf = s => { const v = optNum(s); return v == null || isNaN(v) ? null : v; };

  // ---------- Form und Lage: alle Symbole ----------
  function cardGdt() {
    const groups = ['Form', 'Form oder Lage', 'Richtung', 'Ort', 'Lauf'];
    const datum = d => d === true ? 'Bezug nötig' : d === 'optional' ? 'Bezug möglich' : d === 'meist' ? 'meist mit Bezug' : 'ohne Bezug';
    return `<section class="card">
      <p class="lead-s">So stehen die Symbole im Toleranzrahmen. Links das Symbol, dann der Toleranzwert t in mm, rechts der Bezug.</p>
      <div class="fcf-demo">${fcf([SYM.parallelitaet, '0,05', 'A'])}<span class="small muted">Beispiel: parallel zu Bezug A innerhalb 0,05 mm</span></div>
      ${groups.map(g => `<div class="gdt-group"><h3 class="gdt-h">${g === 'Form oder Lage' ? 'Form oder Lage (je nach Bezug)' : g === 'Form' ? 'Formtoleranzen' : g + 'stoleranzen'}</h3>
        ${WK.GDT.filter(x => x.group === g).map(x => `<div class="gdt-row"><span class="gdt-sym">${SYM[x.id] || ''}</span><div><div class="gdt-name">${esc(x.name)} <span class="tag${x.datum === true ? ' on' : ''}">${datum(x.datum)}</span></div><div class="gdt-what">${esc(x.what)}</div></div></div>`).join('')}</div>`).join('')}
      <p class="foot">Nach ISO 1101. Für Toleranzen ohne eigene Angabe auf der Zeichnung gilt der Rechner (ISO 2768-2).</p>
    </section>`;
  }

  // ---------- Gewinde ----------
  function cardThread() {
    return `<section class="card" id="card-thread">
      <div class="field"><label for="th-q">Gewinde</label>${textInp('th-q', 'thread.q', 'z. B. M8, M10x1, G1/2', true)}
        <span class="hint-line">Metrisch (M8, M10x1), Rohrgewinde (G1/2), Zoll (1/4-20 UNC, 3/8 UNF), Trapez (Tr20x4).</span></div>
      <div class="chips">${['M3', 'M4', 'M5', 'M6', 'M8', 'M10', 'M12', 'M16', 'M10x1', 'G1/4', 'G1/2', '1/4-20 UNC', 'Tr20x4'].map(v => `<button type="button" class="chip" data-act="thread-pick" data-v="${v}">${v}</button>`).join('')}</div>
      <div class="field"><label for="th-n">Drehzahl S beim Gewindebohren, freiwillig</label>${bindNum('th-n', 'thread.n', '1/min', 'für den Vorschub in mm/min')}</div>
      <div class="result" id="res-thread" aria-live="polite"></div>
    </section>`;
  }
  function computeThread() {
    const q = String(A.thread.q || '').trim();
    if (!q) return out('res-thread', msgHTML('Gib ein Gewinde ein, zum Beispiel M8.'));
    const t = WK.parseThread(q);
    if (!t.ok) return out('res-thread', msgHTML(esc(t.error), 'warn'));
    let html = `<div class="res-hero"><div class="res-big">${esc(t.name)}</div><div class="res-sub">${t.type === 'M' ? (t.coarse ? 'Metrisches ISO-Regelgewinde' : 'Metrisches ISO-Feingewinde') : t.type === 'G' ? 'Rohrgewinde nach ISO 228-1 (zylindrisch)' : t.type === 'Tr' ? 'Metrisches ISO-Trapezgewinde' : t.type === 'UNC' ? 'Unified Grobgewinde (Zoll)' : 'Unified Feingewinde (Zoll)'}</div></div>`;
    const steps = [];
    if (t.type === 'M' || t.type === 'UNC' || t.type === 'UNF') {
      html += `<div class="kv">
        ${kv('Kernlochbohrer', `${nf(t.tap)} mm${t.type === 'M' && t.tap !== t.tapCalc ? `<small>rechnerisch ${nf(t.tapCalc, 3)} mm (d − P)</small>` : '<small>d − P</small>'}`, true)}
        ${kv('Nenndurchmesser d', mmv(t.d, 3) + (t.dIn ? `<small>${nf(t.dIn, 4)} Zoll</small>` : ''))}
        ${kv('Steigung P', mmv(t.P, 4) + (t.tpi ? `<small>${t.tpi} Gänge je Zoll</small>` : ''))}
        ${kv('Flankendurchmesser d2', mmv(t.d2))}
        ${kv('Kerndurchmesser Bolzen d3', mmv(t.d3))}
        ${kv('Kerndurchmesser Mutter D1', mmv(t.d1))}
        ${kv('Gewindetiefe Bolzen h3', mmv(t.h3))}
        ${kv('Spannungsquerschnitt As', nf(t.As, 1) + ' mm²')}
        ${kv('Flankenwinkel', '60°')}
      </div>`;
      steps.push({ t: 'Grundprofil', h: `Das Spitzgewinde hat 60° Flankenwinkel. Alle Maße folgen aus d und P: d2 = d − 0,6495 · P, D1 = d − 1,0825 · P, d3 = d − 1,2269 · P, h3 = 0,6134 · P.` });
      steps.push({ t: 'Kernloch', h: `Für Gewindebohren nimmt man etwa d − P = ${nf(t.d, 3)} − ${nf(t.P, 4)} = ${nf(t.d - t.P, 3)} mm.${t.type === 'M' && t.tap !== t.tapCalc ? ` DIN 336 nennt dafür den Bohrer ${nf(t.tap)} mm.` : ''} Beim Gewindeformen ist das Loch größer, dort gilt die Angabe des Werkzeugherstellers.` });
      steps.push({ t: 'Spannungsquerschnitt', h: t.type === 'M' ? 'As = π/4 · ((d2 + d3) / 2)², nach ISO 898-1. Er zählt für die Festigkeit der Schraube.' : 'As = π/4 · (d − 0,9743 · P)², nach ASME B1.1.' });
      const Sn = optOf(A.thread.n), tipL = WK.drillTip(t.tap);
      html += ncHTML([[`F${ncNum(t.P)}`, 'Gewindebohren mit G95: Vorschub = Steigung'], [Sn > 0 ? `S${Math.round(Sn)} F${ncNum(Sn * t.P)}` : 'F = S × ' + ncNum(t.P), Sn > 0 ? 'mit G94: Vorschub = Drehzahl × Steigung (mm/min)' : 'mit G94: unten die Drehzahl eintragen']])
        + `<div class="kv">${kv('Bohrerspitze 118° beim Kernloch', `+ ${nf(tipL, 2)} mm<small>zur nutzbaren Bohrtiefe dazurechnen</small>`, true)}</div>`;
      if (t.type === 'M' && !t.listed) html += msgHTML('Diese Steigung steht nicht in der üblichen Auswahl nach ISO 261. Die Maße sind trotzdem richtig gerechnet.', 'warn');
      if (t.type === 'M' && t.coarse) {
        const sc = WK.screw(t.d), tq = WK.torque(t.d, '8.8');
        if (sc.ok) html += `<div class="kv">${sc.swIso != null ? kv('Schlüsselweite Sechskant', `${nf(sc.swIso)} mm${sc.swDin !== sc.swIso ? `<small>alte DIN: ${nf(sc.swDin)} mm</small>` : ''}`) : ''}${sc.sw4762 != null ? kv('Innensechskant Zylinderkopf', nf(sc.sw4762) + ' mm') : ''}${sc.hole ? kv('Durchgangsloch mittel', nf(sc.hole[1]) + ' mm') : ''}${tq.ok ? kv('Anziehdrehmoment 8.8', nf(tq.MA, 1) + ' Nm') : ''}</div>
          <button type="button" class="link-btn" data-act="sw-pick" data-v="${t.d}">Alle Schraubenmaße zu ${esc(t.name)} ${I.chevR}</button>`;
      }
    } else if (t.type === 'G') {
      html += `<div class="kv">
        ${kv('Kernlochbohrer', t.tap ? nf(t.tap) + ' mm' : `etwa ${nf(t.d1, 2)} mm <small>Kerndurchmesser, Bohrer leicht darüber wählen</small>`, true)}
        ${kv('Außendurchmesser d', mmv(t.d))}
        ${kv('Gänge je Zoll', String(t.tpi) + `<small>Steigung ${nf(t.P, 3)} mm</small>`)}
        ${kv('Flankendurchmesser d2', mmv(t.d2))}
        ${kv('Kerndurchmesser d1', mmv(t.d1))}
        ${kv('Flankenwinkel', '55°')}
        ${kv('Dichtung', 'nicht im Gewinde')}
      </div>`;
      steps.push({ t: 'Größe', h: `Die Zollangabe ist keine Abmessung. G 1/2 ist ein Rohr mit „halbzölligem“ Innendurchmesser, das Gewinde hat außen ${nf(t.d, 3)} mm.` });
      steps.push({ t: 'Profil', h: 'Whitworth-Profil mit 55°. d2 = d − 0,6403 · P, d1 = d − 1,2807 · P. G nach ISO 228-1 dichtet nicht im Gewinde (Dichtring nötig). Das kegelige R-Gewinde nach ISO 7-1 dichtet im Gewinde.' });
    } else {
      html += `<div class="kv">
        ${kv('Bohrung für Mutter D1', mmv(t.D1), true)}
        ${kv('Nenndurchmesser d', mmv(t.d))}
        ${kv('Steigung P', mmv(t.P))}
        ${kv('Flankendurchmesser d2', mmv(t.d2))}
        ${kv('Kerndurchmesser Spindel d3', mmv(t.d3))}
        ${kv('Außendurchmesser Mutter D4', mmv(t.D4))}
        ${kv('Spiel am Kopf ac', mmv(t.ac, 2))}
        ${kv('Flankenwinkel', '30°')}
      </div>`;
      steps.push({ t: 'Profil', h: `Trapezgewinde nach ISO 2904: d2 = d − 0,5 · P, h3 = 0,5 · P + ac = ${nf(t.h3, 3)} mm, d3 = d − 2 · h3, D1 = d − P, D4 = d + 2 · ac. Das Spiel ac ist ${nf(t.ac, 2)} mm bei P = ${nf(t.P)} mm.` });
      if (!t.listed) html += msgHTML('Diese Kombination steht nicht in der Vorzugsreihe nach ISO 2904.', 'warn');
    }
    out('res-thread', html + calcHTML('thread', steps));
  }
  function cardThreadTab() {
    return `<section class="card" id="card-threadtab">
      ${segHTML('thread.kind', A.thread.kind, [['M', 'M'], ['MF', 'MF'], ['G', 'G'], ['UNC', 'UNC'], ['UNF', 'UNF'], ['Tr', 'Tr']])}
      <div id="res-threadtab"></div>
    </section>`;
  }
  function computeThreadTab() {
    const k = A.thread.kind;
    const row = (t, cells) => `<tr data-act="thread-pick" data-v="${esc(t.name.replace('×', 'x').replace(/-\d+ /, ' ').replace(' UNC', ' UNC').replace(' UNF', ' UNF'))}">${cells.map((c, i) => i === 0 ? `<th scope="row">${c}</th>` : `<td>${c}</td>`).join('')}</tr>`;
    let head, rows, note = 'Tippe auf eine Zeile für alle Maße.';
    if (k === 'M' || k === 'MF') {
      const list = k === 'M' ? WK.M_COARSE : WK.M_FINE;
      head = ['Gewinde', 'P', 'Kernloch', 'd2', 'd3', 'D1'];
      rows = list.map(([d, P]) => { const t = WK.metric(d, P); return row(t, [t.name.replace('×', '×'), nf(P, 3), nf(t.tap), nf(t.d2, 3), nf(t.d3, 3), nf(t.d1, 3)]); });
    } else if (k === 'G') {
      head = ['Gewinde', 'd', 'Gänge/Zoll', 'Kernloch', 'd1'];
      rows = WK.G.map(g => { const t = WK.whitworthPipe(g[0]); return row(t, [t.name, nf(t.d, 3), t.tpi, t.tap ? nf(t.tap) : '–', nf(t.d1, 3)]); });
    } else if (k === 'UNC' || k === 'UNF') {
      head = ['Gewinde', 'd mm', 'Gänge/Zoll', 'Kernloch', 'D1'];
      rows = (k === 'UNC' ? WK.UNC : WK.UNF).map(u => { const t = WK.unified(k, u[0]); return `<tr data-act="thread-pick" data-v="${esc(u[0] + '-' + u[2] + ' ' + k)}"><th scope="row">${esc(u[0])}-${u[2]}</th><td>${nf(t.d, 3)}</td><td>${t.tpi}</td><td>${nf(t.tap, 1)}</td><td>${nf(t.d1, 3)}</td></tr>`; });
      note = 'Kernloch rechnerisch d − P, auf 0,1 mm gerundet. Tippe auf eine Zeile für alle Maße.';
    } else {
      head = ['Gewinde', 'P', 'Mutter D1', 'd2', 'd3'];
      rows = WK.TR.map(([d, P]) => { const t = WK.trapez(d, P); return row(t, [t.name, nf(P), nf(t.D1), nf(t.d2), nf(t.d3)]); });
    }
    out('res-threadtab', `<div class="tbl-wrap"><table class="tbl tap-rows"><thead><tr>${head.map(h => `<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div><p class="tbl-note">Maße in mm. ${note}</p>`);
  }

  // ---------- Schnittdaten ----------
  // Zahl für das NC-Programm: Punkt statt Komma, ohne unnötige Nullen
  const ncNum = x => String(Math.round(x * 1000) / 1000);
  const ncHTML = lines => `<div class="nc"><div class="nc-h">Für das Programm</div>${lines.map(([code, note]) => `<div class="nc-l"><code>${esc(code)}</code><span>${esc(note)}</span></div>`).join('')}</div>`;
  // Zerspanung: eingeben, was man weiß, der Rest wird gerechnet
  const SV = {
    d: { s: 'Ø d', mill: 'Fräser, Messerkopf', drill: 'Bohrer', turn: 'Werkstück', u: 'mm', dec: 3 },
    z: { s: 'z', mill: 'Schneiden, Platten', u: 'Stück', dec: 0 },
    r: { s: 'rε', mill: 'Eckenradius', turn: 'Eckenradius', u: 'mm', dec: 3 },
    vc: { s: 'vc', all: 'Schnittgeschw.', u: 'm/min', dec: 1 },
    n: { s: 'n', all: 'Drehzahl S', u: '1/min', dec: 0 },
    fz: { s: 'fz', mill: 'je Zahn', u: 'mm', dec: 4 },
    f: { s: 'f', mill: 'je Umdrehung', drill: 'je Umdrehung', turn: 'je Umdrehung', u: 'mm/U', dec: 3 },
    vf: { s: 'vf', all: 'Vorschub F (G94)', u: 'mm/min', dec: 0 },
    Rz: { s: 'Rz', all: 'gemittelte Rautiefe', u: 'µm', dec: 2 },
    Ra: { s: 'Ra', all: 'Mittenrauwert', u: 'µm', dec: 2 },
    ae: { s: 'ae', mill: 'Eingriffsbreite', u: 'mm', dec: 2 },
    ap: { s: 'ap', mill: 'Schnitttiefe', turn: 'Schnitttiefe', u: 'mm', dec: 2 },
    Q: { s: 'Q', all: 'Zeitspanvolumen', u: 'cm³/min', dec: 1 }
  };
  const SV_GROUPS = {
    mill: [['Werkzeug', ['d', 'z', 'r']], ['Schnitt', ['vc', 'n']], ['Vorschub', ['fz', 'f', 'vf']], ['Oberfläche', ['Rz', 'Ra']], ['Eingriff, freiwillig', ['ae', 'ap', 'Q']]],
    drill: [['Werkzeug', ['d']], ['Schnitt', ['vc', 'n']], ['Vorschub', ['f', 'vf']], ['Zeitspanvolumen', ['Q']]],
    turn: [['Werkstück und Platte', ['d', 'r']], ['Schnitt', ['vc', 'n']], ['Vorschub', ['f', 'vf']], ['Oberfläche', ['Rz', 'Ra']], ['Spanen, freiwillig', ['ap', 'Q']]]
  };
  const svFmt = (k, x) => T.fmt(x, 0, SV[k].dec);
  function svGiven(mode) {
    const g = {};
    WK.SOLVE_VARS[mode].forEach(k => { const x = optOf(A[mode][k]); if (x != null && x > 0) g[k] = x; });
    return g;
  }
  let svCleared = '';
  function solveHook(k) {
    const [mode, key] = k.split('.');
    if (!WK.SOLVE_VARS[mode] || !WK.SOLVE_VARS[mode].includes(key)) return;
    const st = A[mode];
    st.ord = (Array.isArray(st.ord) ? st.ord : []).filter(x => x !== key && WK.SOLVE_VARS[mode].includes(x));
    if (!String(st[key]).trim()) { saveA(); return; }
    const g = svGiven(mode);
    delete g[key];
    const before = WK.solve(mode, g);
    if (before.val[key] != null && before.deps[key]) {
      const deps = before.deps[key];
      // Lieber Ergebniswerte (Oberfläche, Vorschub, Drehzahl) freigeben als Werkzeugmaße
      const PRIO = ['Ra', 'Rz', 'Q', 'fz', 'f', 'vf', 'vc', 'n', 'ae', 'ap', 'r', 'z', 'd'];
      const old = PRIO.find(x => deps.includes(x)) || deps[0];
      st[old] = '';
      st.ord = st.ord.filter(x => x !== old);
      const inp = $(`[data-k="${mode}.${old}"]`);
      if (inp) inp.value = '';
      svCleared = old;
    }
    st.ord.push(key);
    saveA();
  }
  // Werkstoffauswahl, gruppiert nach ISO-Gruppe
  const matSelect = (id, k) => `<div class="inp sel"><select id="${id}" data-k="${k}">${ZZ.GROUPS.map(g => `<optgroup label="${g.id} · ${esc(g.name)}">${ZZ.MATERIALS.filter(m => m.g === g.id).map(m => `<option value="${m.id}"${getK(k) === m.id ? ' selected' : ''}>${esc(m.name)}${m.alt ? ' · ' + esc(m.alt) : ''}</option>`).join('')}</optgroup>`).join('')}</select></div>`;
  const myTools = () => { const t = store.get('tools', []); return Array.isArray(t) ? t : []; };
  // Gewinde für Gewindebohrer und -former
  const svThread = mode => { const t = ZZ.tool(A[mode].tool); return mode === 'drill' && t && t.thread ? WK.parseThread(A[mode].thr || '') : null; };

  function cardSolve(mode) {
    const c = A[mode];
    const tool = ZZ.tool(c.tool) || ZZ.TOOLS.find(x => x.mode === mode);
    const mat = ZZ.mat(c.mat);
    const grp = ZZ.GROUPS.find(g => g.id === mat.g);
    const field = k => `<div class="field sv-f" id="svf-${mode}-${k}"><label for="sv-${mode}-${k}"><b>${SV[k].s}</b><span>${esc(SV[k][mode] || SV[k].all)}</span></label><span class="rec" id="rec-${mode}-${k}"></span>${bindNum(`sv-${mode}-${k}`, `${mode}.${k}`, SV[k].u, '')}</div>`;
    const favs = myTools().filter(t => t.mode === mode);
    const mach = mode === 'turn' ? 'Drehmaschine' : 'Fräsmaschine';
    return `<section class="card" id="card-${mode}">
      <details class="mach"${(mode === 'turn' ? A.mach.nmaxT : A.mach.nmax) ? '' : ' open'}><summary>${I.info}<span>${mach}: ${mode === 'turn' ? (A.mach.nmaxT ? 'n max ' + esc(A.mach.nmaxT) : 'keine Grenze eingetragen') : (A.mach.nmax || A.mach.vfmax ? [A.mach.nmax ? 'n max ' + esc(A.mach.nmax) : '', A.mach.vfmax ? 'F max ' + esc(A.mach.vfmax) : ''].filter(Boolean).join(' · ') : 'keine Grenzen eingetragen')}</span>${I.chevR}</summary>
        <div class="fields">${mode === 'turn'
          ? `<div class="field"><label for="m-nT">Höchste Drehzahl</label>${bindNum('m-nT', 'mach.nmaxT', '1/min', 'z. B. 4000')}</div>`
          : `<div class="field"><label for="m-n">Höchste Drehzahl</label>${bindNum('m-n', 'mach.nmax', '1/min', 'z. B. 12000')}</div><div class="field"><label for="m-vf">Höchster Vorschub</label>${bindNum('m-vf', 'mach.vfmax', 'mm/min', 'z. B. 10000')}</div>`}</div>
        <p class="foot">Einmal eintragen, dann bleiben die Vorschläge unter diesen Grenzen.</p>
      </details>
      ${favs.length ? `<div class="sv-h">Meine Werkzeuge</div><div class="chips fav-chips">${favs.map(t => `<span class="fav"><button type="button" class="chip" data-act="tool-load" data-id="${esc(t.id)}">${esc(t.name)}</button><button type="button" class="fav-x" data-act="tool-del" data-id="${esc(t.id)}" aria-label="${esc(t.name)} löschen">${I.x}</button></span>`).join('')}</div>` : ''}
      <div class="field"><label for="sv-${mode}-mat">Werkstoff <span class="grp-dot" style="--c:${grp.color}">${grp.id}</span></label>${matSelect(`sv-${mode}-mat`, mode + '.mat')}<span class="hint-line">${esc(mat.what)}</span></div>
      <div class="field"><label for="sv-${mode}-tool">Werkzeug</label>${selInp(`sv-${mode}-tool`, mode + '.tool', ZZ.TOOLS.filter(t => t.mode === mode).map(t => [t.id, t.name]))}</div>
      ${tool.op ? `<div class="field"><span class="lbl">Bearbeitung</span>${segHTML(mode + '.op', c.op, ZZ.OPS.map(o => [o.id, o.name]), 'wrap')}</div>` : ''}
      ${tool.thread && mode === 'drill' ? `<div class="field"><label for="sv-${mode}-thr">Gewinde</label>${textInp(`sv-${mode}-thr`, mode + '.thr', 'z. B. M8', true)}</div>` : ''}
      <div class="field"><span class="lbl">Fehlende Werte</span>${segHTML(mode + '.auto', c.auto, [['on', 'automatisch vorschlagen'], ['off', 'nur rechnen']])}</div>
      <div class="msg info">${I.info}<div>Gib ein, was du weißt. <span class="tag-given">Blau</span> eingegeben, <span class="tag-soft">Orange</span> vorgeschlagen, <span class="calc-tag">Grün</span> gerechnet. Klein über jedem Feld steht die Empfehlung für Werkstoff und Werkzeug.</div></div>
      ${SV_GROUPS[mode].map(([t, ks]) => ks.includes('Rz')
        ? `<div class="sv-group"><div class="sv-h">${t}</div><div class="fields"><div class="field"><span class="lbl">Angabe auf der Zeichnung</span>${segHTML(mode + '.sk', c.sk === 'Ra' ? 'Ra' : 'Rz', [['Rz', 'Rz'], ['Ra', 'Ra']])}</div>${field(c.sk === 'Ra' ? 'Ra' : 'Rz')}</div><span class="hint-line" id="sv-${mode}-other"></span></div>`
        : `<div class="sv-group"><div class="sv-h">${t}</div><div class="fields">${ks.map(field).join('')}</div></div>`).join('')}
      <div class="btn-row"><button type="button" class="btn soft" data-act="sv-accept" data-m="${mode}">Vorschläge übernehmen</button><button type="button" class="btn plain" data-act="sv-clear" data-m="${mode}">Alles leeren</button></div>
      <button type="button" class="btn plain" data-act="tool-save" data-m="${mode}">${I.plus} Dieses Werkzeug merken</button>
      <div class="result" id="res-${mode}" aria-live="polite"></div>
    </section>`;
  }

  // Rechnen mit Vorschlägen: was nicht eingegeben und nicht ableitbar ist, kommt aus der Empfehlung
  const SV_LAST = {};
  function solveWithSuggestions(mode) {
    const c = A[mode];
    const g = svGiven(mode);
    const tool = ZZ.tool(c.tool) || ZZ.TOOLS.find(x => x.mode === mode);
    const thr = svThread(mode);
    const hard = {};
    if (thr && thr.ok) { g.d = thr.d; hard.d = true; g.f = thr.P; hard.f = true; delete g.vf; }
    let r = WK.solve(mode, g);
    const rec = ZZ.recommend({ mode, mat: c.mat, tool: tool.id, d: r.val.d, op: c.op, ae: r.val.ae, thread: thr });
    const soft = {}, info = [];
    const known = ks => ks.some(k => r.val[k] != null);
    const resolve = () => { r = WK.solve(mode, Object.assign({}, g, soft)); };
    if (c.auto !== 'off' && !rec.warn.length) {
      if (mode === 'turn' && !known(['r']) && rec.r) { soft.r = rec.r; resolve(); }   // zuerst die Platte, dann kann eine Oberflächenvorgabe den Vorschub bestimmen
      if (!known(['vc', 'n']) && rec.vc) { soft.vc = rec.vc[1]; resolve(); }
      if (mode === 'mill' && !known(['fz', 'f', 'vf']) && rec.fz) { soft.fz = rec.fz[1]; resolve(); }
      if (mode !== 'mill' && !known(['f', 'vf']) && rec.f) { soft.f = rec.f[1]; resolve(); }
      if (mode === 'mill' && tool.op && !known(['ae']) && rec.ae && c.op !== 'slot') { /* ae nur als Empfehlung anzeigen */ }
      if (mode === 'mill' && c.op === 'slot' && !known(['ae']) && r.val.d) { soft.ae = r.val.d; resolve(); }
    }
    // Maschinengrenzen
    const mach = mode === 'turn' ? { nmax: optOf(A.mach.nmaxT) } : { nmax: optOf(A.mach.nmax), vfmax: optOf(A.mach.vfmax) };
    const lim = [];
    let over = ZZ.limit(r.val, mach);
    if (over.find(o => o.k === 'n')) {
      if (soft.vc != null && g.n == null) { delete soft.vc; soft.n = mach.nmax; resolve(); info.push(`Drehzahl auf das Maschinenmaximum ${nf(mach.nmax, 0)} 1/min begrenzt, dadurch ist vc kleiner als empfohlen.`); }
      else lim.push({ k: 'n', max: mach.nmax });
    }
    over = ZZ.limit(r.val, mach);
    if (over.find(o => o.k === 'vf')) {
      const sk = soft.fz != null ? 'fz' : soft.f != null ? 'f' : null;
      if (sk && g.vf == null) { delete soft[sk]; soft.vf = mach.vfmax; resolve(); info.push(`Vorschub auf das Maschinenmaximum F${nf(mach.vfmax, 0)} begrenzt, dadurch ist ${sk} kleiner als empfohlen.`); }
      else lim.push({ k: 'vf', max: mach.vfmax });
    }
    return { r, g, soft, hard, rec, tool, thr, info, lim, mach };
  }

  function computeSolve(mode) {
    const c = A[mode];
    const S0 = solveWithSuggestions(mode);
    const { r, g, soft, hard, rec, tool, thr, info, lim } = S0;
    SV_LAST[mode] = S0;
    const v = r.val;
    // Felder: eingegeben, vorgeschlagen, gerechnet
    WK.SOLVE_VARS[mode].forEach(k => {
      const inp = $(`#sv-${mode}-${k}`);
      if (!inp) return;
      const box = inp.closest('.inp'), fld = $(`#svf-${mode}-${k}`);
      const isHard = hard[k], isSoft = soft[k] != null, isGiven = g[k] != null && !isHard;
      const isCalc = !isGiven && !isSoft && !isHard && v[k] != null;
      if (isHard) inp.value = svFmt(k, v[k]);
      inp.readOnly = !!isHard;
      inp.placeholder = (isSoft || isCalc) && v[k] != null ? svFmt(k, v[k]) : isGiven || isHard ? '' : '?';
      box.classList.toggle('calc', isCalc);
      box.classList.toggle('soft', isSoft);
      box.classList.toggle('fixed', !!isHard);
      if (fld) fld.classList.toggle('given', isGiven);
      const rl = $(`#rec-${mode}-${k}`);
      if (rl) rl.innerHTML = recLine(mode, k, rec, v, tool, thr);
    });
    const oth = $(`#sv-${mode}-other`);
    if (oth) { const ok = c.sk === 'Ra' ? 'Rz' : 'Ra'; oth.textContent = v[ok] != null ? `Entspricht ${ok} ≈ ${svFmt(ok, v[ok])} µm (theoretisches Profil der Schneidenecke, Rz ≈ 3,9 · Ra)` : 'Gibst du die Oberfläche ein, rechnet die App den passenden Vorschub.'; }

    let html = '';
    if (svCleared) { html += msgHTML(`Ich habe ${esc(SV[svCleared].s)} geleert, weil du einen Wert eingegeben hast, der sonst daraus gerechnet würde.`); svCleared = ''; }
    rec.warn.forEach(w => { html += msgHTML(esc(w), 'warn'); });
    if (r.clash.length) {
      const cl = r.clash[0];
      html += msgHTML(`Das passt nicht zusammen: nach ${esc(cl.rule.f)} müsste ${esc(SV[cl.rule.out].s)} = ${svFmt(cl.rule.out, cl.want)} ${SV[cl.rule.out].u} sein, eingegeben ist ${svFmt(cl.rule.out, cl.have)}. Lass einen der Werte leer.`, 'warn');
    }
    lim.forEach(l => { html += msgHTML(`${l.k === 'n' ? 'Die Drehzahl' : 'Der Vorschub'} ${svFmt(l.k, v[l.k])} liegt über dem Maximum deiner Maschine (${nf(l.max, 0)}). <button type="button" class="btn" data-act="sv-take" data-m="${mode}" data-k="${l.k}" data-v="${l.max}">Auf ${nf(l.max, 0)} begrenzen</button>`, 'warn'); });
    info.forEach(t => { html += msgHTML(esc(t)); });
    // Hauptergebnis: S und F
    if (v.n || v.vf) {
      html += `<div class="sf-hero"><div><span>Drehzahl</span><b>S${v.n ? Math.round(v.n) : '?'}</b></div><div><span>${mode === 'turn' ? 'Vorschub je U' : 'Vorschub'}</span><b>F${mode === 'turn' ? (v.f ? ncNum(v.f) : '?') : (v.vf ? Math.round(v.vf) : '?')}</b></div></div>`;
    }
    if (mode === 'turn') {
      const lines = [];
      if (v.vc) lines.push([`G96 S${Math.round(v.vc)}${v.f ? ' F' + ncNum(v.f) : ''}`, 'konstante Schnittgeschwindigkeit, F in mm/U (G95). Drehzahl begrenzen (G92/LIMS)' + (S0.mach.nmax ? ` auf ${nf(S0.mach.nmax, 0)}` : '')]);
      if (v.n) lines.push([`G97 S${Math.round(v.n)}${v.f ? ' F' + ncNum(v.f) : ''}`, v.d ? `feste Drehzahl für Ø ${nf(v.d)} mm` : 'feste Drehzahl']);
      if (lines.length) html += ncHTML(lines);
    } else if (v.n || v.vf) {
      const lines = [[`${v.n ? 'S' + Math.round(v.n) : ''}${v.vf ? ' F' + Math.round(v.vf) : ''} M3`.trim(), 'F in mm/min (G94)']];
      if (mode === 'drill' && v.f) lines.push([`${v.n ? 'S' + Math.round(v.n) + ' ' : ''}F${ncNum(v.f)}`, thr && thr.ok ? 'F in mm/U (G95) = Steigung, im Gewindezyklus' : 'oder F in mm/U (G95)']);
      html += ncHTML(lines);
    }
    // Oberfläche gegen Werkzeug prüfen
    const fk = mode === 'mill' ? 'fz' : 'f', rf = mode === 'mill' ? rec.fz : rec.f;
    if (rf && v[fk] && (g.Rz || g.Ra) && v[fk] > rf[2] * 1.05) html += msgHTML(`Für diese Oberfläche wäre ${fk} = ${svFmt(fk, v[fk])} mm, mehr als für das Werkzeug empfohlen (bis ${svFmt(fk, rf[2])}). Mit ${fk} = ${svFmt(fk, rf[1])} wird die Oberfläche besser als verlangt. <button type="button" class="btn" data-act="sv-take" data-m="${mode}" data-k="${fk}" data-v="${T.fmt(rf[1], 0, 4)}">${fk} ${svFmt(fk, rf[1])} nehmen</button>`, 'warn');
    if (rf && v[fk] && (g.Rz || g.Ra) && v[fk] < rf[0] * 0.5) html += msgHTML(`Für diese Oberfläche ist ${fk} = ${svFmt(fk, v[fk])} mm sehr klein. Die Schneide kann dann reiben statt schneiden. Besser: größerer Eckenradius${mode === 'mill' ? ' oder eine Planschneide (Wiper)' : ' oder eine Wiper-Platte'}.`, 'warn');
    if (thr && !thr.ok) html += msgHTML(esc(thr.error), 'warn');
    if (rec.core) html += `<div class="kv">${kv('Kernloch', `Ø ${T.fmt(rec.core, 0, 2)} mm<small>${tool.id === 'form' ? 'für Gewindeformen' : 'für Gewindebohren'}</small>`)}${kv('Steigung = Vorschub', T.fmt(thr.P, 0, 3) + ' mm/U')}</div>`;
    if (rec.pre) html += `<div class="kv">${kv('Vorbohren für Reiben', `Ø ${T.fmt(rec.pre[0], 0, 2)} bis ${T.fmt(rec.pre[1], 0, 2)} mm`, true)}</div>`;
    if (rec.notes.length) html += `<div class="tips"><div class="sv-h">Tipps für dieses Werkzeug</div><ul>${rec.notes.map(n => `<li>${esc(n)}</li>`).join('')}</ul></div>`;
    const missing = WK.SOLVE_VARS[mode].filter(k => v[k] == null && !['ae', 'ap', 'Q', 'Rz', 'Ra', 'r'].includes(k) && !(mode === 'mill' && k === 'z'));
    if (missing.length) html += msgHTML(`Noch offen: ${missing.map(k => '<b>' + esc(SV[k].s) + '</b>').join(', ')}. ${!v.d ? 'Gib den Durchmesser ein.' : mode === 'mill' && !v.z ? 'Gib die Zahl der Schneiden ein.' : ''}`);
    if (mode === 'mill' && !v.z && v.fz) html += msgHTML('Für den Vorschub F fehlt noch die Zahl der Schneiden z.');
    if (mode !== 'drill' && v.Rz && !g.Rz && !g.Ra) html += `<p class="foot">Mit diesem Vorschub wird die Oberfläche theoretisch etwa Rz ${nf(v.Rz, 2)} µm (Ra ${nf(v.Ra, 2)} µm). ${mode === 'mill' ? 'Beim Fräsen gilt das, wenn alle Schneiden gleich hoch stehen.' : ''}</p>`;
    const steps = [];
    Object.keys(soft).forEach(k => steps.push({ t: `${SV[k].s} vorgeschlagen`, h: `${svFmt(k, soft[k])} ${SV[k].u}, aus der Empfehlung für ${esc(rec.mat.name)} und ${esc(tool.name)}.` }));
    r.steps.forEach(s => steps.push({ t: `${SV[s.out].s} ${SV[s.out][mode] || SV[s.out].all}`, h: `${esc(s.rule.f)} = <b>${svFmt(s.out, s.val)} ${SV[s.out].u}</b>` }));
    if (steps.length) html += calcHTML('sv-' + mode, steps);
    out('res-' + mode, html);
  }
  // Kleine Empfehlung über einem Feld
  function recLine(mode, k, rec, v, tool, thr) {
    const rr = (a, dec) => `${T.fmt(a[0], 0, dec)}–${T.fmt(a[2], 0, dec)}`;
    if (k === 'vc' && rec.vc) return `Empfohlen ${rr(rec.vc, 0)}`;
    if (k === 'n' && rec.vc && v.d) return `Empfohlen ${Math.round(rec.vc[0] * 1000 / (Math.PI * v.d))}–${Math.round(rec.vc[2] * 1000 / (Math.PI * v.d))}`;
    if (k === 'fz' && rec.fz) return `Empfohlen ${rr(rec.fz, 3)}`;
    if (k === 'f' && rec.fixedF) return 'Steigung des Gewindes';
    if (k === 'f' && rec.f) return `Empfohlen ${rr(rec.f, 3)}`;
    if (k === 'f' && mode === 'mill' && rec.fz && v.z) return `≈ ${T.fmt(rec.fz[0] * v.z, 0, 2)}–${T.fmt(rec.fz[2] * v.z, 0, 2)}`;
    if (k === 'vf' && v.n && mode === 'mill' && rec.fz && v.z) return `≈ ${Math.round(rec.fz[0] * v.z * v.n)}–${Math.round(rec.fz[2] * v.z * v.n)}`;
    if (k === 'ae' && rec.ae) return `Empfohlen ${rr(rec.ae, 1)}`;
    if (k === 'ap' && rec.ap) return `Empfohlen ${rr(rec.ap, 1)}`;
    if (k === 'r' && rec.r) return `Platte meist ${T.fmt(rec.r, 0, 1)}`;
    if (k === 'r' && mode === 'mill' && v.r && (A[mode].Rz || A[mode].Ra) && !A[mode].r) return 'nötig für diese Oberfläche';
    if (k === 'd' && thr && thr.ok) return 'aus dem Gewinde';
    if (k === 'z' && tool.id === 'face') return 'Platten im Messerkopf';
    if (k === 'z' && rec.mat.cls === 'N1') return 'Alu: 2–3 Schneiden';
    return '';
  }

  // Alle Vorschläge als Eingaben übernehmen
  function acceptSuggestions(mode) {
    const S0 = SV_LAST[mode];
    if (!S0) return;
    Object.keys(S0.soft).forEach(k => { A[mode][k] = T.fmt(S0.soft[k], 0, SV[k].dec).replace('−', '-'); A[mode].ord = (A[mode].ord || []).filter(x => x !== k).concat(k); });
    saveA();
    $('#sec-body').innerHTML = sectionHTML();
    computeCurrent();
  }
  function saveTool(mode) {
    const c = A[mode], t = ZZ.tool(c.tool);
    const d = optOf(c.d), z = optOf(c.z), r = optOf(c.r);
    const def = `${t ? t.name.replace(/ \(.*\)/, '') : 'Werkzeug'}${d ? ' Ø' + nf(d) : ''}${z ? ' z' + nf(z, 0) : ''}${r ? ' r' + nf(r) : ''}`;
    let name = def;
    try { const p = window.prompt('Name für das Werkzeug', def); if (p === null) return; name = p.trim() || def; } catch (e) { /* ohne Eingabefenster den Vorschlag nehmen */ }
    const list = myTools();
    list.push({ id: 't' + Date.now(), name, mode, tool: c.tool, op: c.op, thr: c.thr, d: c.d, z: c.z, r: c.r });
    store.set('tools', list);
    $('#sec-body').innerHTML = sectionHTML();
    computeCurrent();
  }
  function loadTool(id) {
    const t = myTools().find(x => x.id === id);
    if (!t) return;
    const c = A[t.mode];
    ['tool', 'op', 'thr'].forEach(k => { if (t[k] != null) c[k] = t[k]; });
    ['d', 'z', 'r'].forEach(k => { if (k in c) c[k] = t[k] || ''; });
    c.ord = ['d', 'z', 'r'].filter(k => String(c[k] || '').trim());
    WK.SOLVE_VARS[t.mode].forEach(k => { if (!['d', 'z', 'r', 'Rz', 'Ra'].includes(k)) c[k] = ''; });
    saveA();
    $('#sec-body').innerHTML = sectionHTML();
    computeCurrent();
  }
  function cardCutRef() {
    const cols = [['vhm', 'Schaftfräser VHM'], ['wsp', 'Messerkopf WSP'], ['hssm', 'Fräser HSS'], ['dvhm', 'Bohrer VHM'], ['dhss', 'Bohrer HSS'], ['tap', 'Gewinde­bohrer'], ['turn', 'Drehen HM']];
    const fam = ['vhm', 'hssm', 'wsp', 'dhss', 'dvhm', 'dwsp', 'ream', 'tap', 'form', 'turn', 'turnhss'];
    const v = (m, f) => { const b = ZZ.VC[m.cls][fam.indexOf(f)]; return b == null ? '–' : String(Math.round(b * m.k / 5) * 5); };
    return `<section class="card">
      <div class="tbl-cap">Schnittgeschwindigkeit vc in m/min (Mittelwert, etwa ±20 %)</div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th scope="col">Werkstoff</th>${cols.map(c => `<th scope="col">${c[1]}</th>`).join('')}</tr></thead>
      <tbody>${ZZ.GROUPS.map(g => `<tr class="grp"><th scope="row" colspan="${cols.length + 1}"><span class="grp-dot" style="--c:${g.color}">${g.id}</span> ${esc(g.name)}</th></tr>` + ZZ.MATERIALS.filter(m => m.g === g.id).map(m => `<tr><th scope="row">${esc(m.name)}<small class="tbl-sub">${esc(m.alt)}</small></th>${cols.map(c => `<td>${v(m, c[0])}</td>`).join('')}</tr>`).join('')).join('')}</tbody></table></div>
      <div class="tbl-note"><p><b>Richtwerte</b> für beschichtete Werkzeuge, stabile Aufspannung und Kühlung. Die Angaben des Werkzeugherstellers gehen immer vor. Ein Strich heißt: Werkzeug für diesen Werkstoff nicht üblich.</p>
      <p>Im Reiter Fräsen, Bohren oder Drehen rechnet die App daraus mit deinem Durchmesser Drehzahl und Vorschub und zeigt die Empfehlung klein über jedem Feld.</p></div>
    </section>`;
  }

  // ---------- Schrauben und Schlüsselweiten ----------
  function cardSw() {
    return `<section class="card" id="card-sw">
      <div class="field"><label for="s-d">Gewinde</label><div class="inp big"><span class="pre">M</span><input id="s-d" data-k="sw.d" value="${esc(A.sw.d)}" inputmode="decimal" placeholder="z. B. 8" autocomplete="off" enterkeyhint="done"></div></div>
      <div class="chips">${[3, 4, 5, 6, 8, 10, 12, 14, 16, 20, 24].map(d => `<button type="button" class="chip" data-act="sw-pick" data-v="${d}">M${d}</button>`).join('')}</div>
      <div class="result" id="res-sw" aria-live="polite"></div>
    </section>`;
  }
  function computeSw() {
    const d = numOf(String(A.sw.d).replace(/^m/i, ''));
    if (!(d > 0)) return out('res-sw', msgHTML('Gib den Gewindedurchmesser ein, zum Beispiel 8 für M8.'));
    const r = WK.screw(d);
    if (!r.ok) return out('res-sw', msgHTML(esc(r.error), 'warn'));
    const v = x => x == null ? '–' : nf(x) + ' mm';
    const tq = WK.torque(d, '8.8');
    out('res-sw', `<div class="res-hero"><div class="res-big">SW ${v(r.swIso)}</div><div class="res-sub">Sechskantschraube und Mutter ${esc(r.name)} nach ISO${r.swDin !== r.swIso ? ` · alte DIN 931/933/934: <b>${v(r.swDin)}</b>` : ''}</div></div>
      <div class="kv">
        ${kv('Zylinderkopf Innensechskant', v(r.sw4762) + '<small>ISO 4762 (DIN 912)</small>')}
        ${kv('Kopf ISO 4762', r.dk4762 ? `Ø ${nf(r.dk4762)} mm<small>Höhe ${nf(r.k4762)} mm</small>` : '–')}
        ${kv('Senkkopf Innensechskant', v(r.sw10642) + '<small>ISO 10642 (DIN 7991)</small>')}
        ${kv('Flachkopf Innensechskant', v(r.sw7380) + '<small>ISO 7380</small>')}
        ${kv('Gewindestift', v(r.sw4026) + '<small>ISO 4026 bis 4029</small>')}
        ${kv('Kernlochbohrer', r.thread ? nf(r.thread.tap) + ' mm' : '–')}
      </div>
      <div class="kv three">${r.hole ? kv('Durchgang fein', nf(r.hole[0]) + ' mm') + kv('Durchgang mittel', nf(r.hole[1]) + ' mm') + kv('Durchgang grob', nf(r.hole[2]) + ' mm') : ''}</div>
      ${r.cbore ? `<div class="kv">${kv('Senkung für ISO 4762', `Ø ${nf(r.cbore[0])} mm<small>DIN 974-1, ohne Unterlegteil</small>`)}${kv('Senktiefe', nf(r.cbore[1]) + ' mm')}</div>` : ''}
      ${tq.ok ? `<div class="kv">${kv('Anziehdrehmoment 8.8', nf(tq.MA, 1) + ' Nm')}${kv('10.9 / 12.9', `${nf(WK.torque(d, '10.9').MA, 1)} / ${nf(WK.torque(d, '12.9').MA, 1)} Nm`)}</div>` : ''}
      <p class="foot">Durchgangslöcher nach ISO 273: fein für genaue Lage, mittel ist der Normalfall.</p>`);
  }
  function cardSwTab() {
    const S2 = WK.SCREW_SIZES, v = x => x == null ? '–' : nf(x);
    return `<section class="card">
      <div class="tbl-wrap"><table class="tbl tap-rows"><thead><tr><th scope="col">Gewinde</th><th scope="col">Sechskant ISO</th><th scope="col">Sechskant DIN</th><th scope="col">Innen&shy;sechskant ISO 4762</th><th scope="col">Senkkopf ISO 10642</th><th scope="col">Flachkopf ISO 7380</th><th scope="col">Gewinde&shy;stift</th><th scope="col">Durch&shy;gang mittel</th></tr></thead>
      <tbody>${S2.map((d, i) => `<tr data-act="sw-pick" data-v="${d}"${WK.SW_DIN[i] !== WK.SW_ISO[i] ? ' class="hl"' : ''}><th scope="row">M${nf(d)}</th><td>${v(WK.SW_ISO[i])}</td><td>${v(WK.SW_DIN[i])}</td><td>${v(WK.SW_4762[i])}</td><td>${v(WK.SW_10642[i])}</td><td>${v(WK.SW_7380[i])}</td><td>${v(WK.SW_4026[i])}</td><td>${WK.HOLE_273[i] ? v(WK.HOLE_273[i][1]) : '–'}</td></tr>`).join('')}</tbody></table></div>
      <p class="tbl-note">Schlüsselweiten in mm. Farbig: Hier unterscheiden sich ISO und alte DIN (M10, M12, M14, M22). Tippe auf eine Zeile für alle Maße.</p>
    </section>`;
  }

  // ---------- Drehmoment ----------
  function cardTorque() {
    return `<section class="card" id="card-torque">
      <div class="fields">
        <div class="field"><label for="t-d">Gewinde</label>${selInp('t-d', 'torque.d', WK.TORQUE.sizes.map(d => [String(d), 'M' + d]))}</div>
        <div class="field"><span class="lbl">Festigkeitsklasse</span>${segHTML('torque.cls', A.torque.cls, [['8.8', '8.8'], ['10.9', '10.9'], ['12.9', '12.9']])}</div>
      </div>
      <div class="result" id="res-torque" aria-live="polite"></div>
    </section>`;
  }
  function computeTorque() {
    const d = numOf(A.torque.d), cls = A.torque.cls;
    const r = WK.torque(d, cls);
    if (!r.ok) return out('res-torque', msgHTML(esc(r.error), 'warn'));
    const rows = WK.TORQUE.sizes.map((x, i) => `<tr${x === d ? ' class="on"' : ''}><th scope="row">M${x}</th><td>${nf(WK.TORQUE['8.8'][i], 1)}</td><td>${nf(WK.TORQUE['10.9'][i], 1)}</td><td>${nf(WK.TORQUE['12.9'][i], 1)}</td></tr>`).join('');
    out('res-torque', `<div class="res-hero"><div class="res-big">${nf(r.MA, 1)} <small>Nm</small></div><div class="res-sub">Anziehdrehmoment M${d}, Festigkeitsklasse ${cls}</div></div>
      ${msgHTML('Gilt für Schaftschrauben mit Regelgewinde, leicht geölt, Reibwert µ = 0,12 (Gewinde und Kopfauflage), Ausnutzung 90 % der Streckgrenze. Andere Schmierung, Edelstahl, Aluminiumgewinde oder kurze Einschraubtiefe brauchen andere Werte.')}
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th scope="col">Gewinde</th><th scope="col">8.8</th><th scope="col">10.9</th><th scope="col">12.9</th></tr></thead><tbody>${rows}</tbody></table></div>
      <p class="tbl-note">Werte in Nm nach VDI 2230 Blatt 1, Tabelle für µ = 0,12.</p>`);
  }

  // ---------- Gewicht ----------
  function cardWeight() {
    const w = A.weight, sh = WK.SHAPES[w.shape] || WK.SHAPES.rund;
    return `<section class="card" id="card-weight">
      ${segHTML('weight.shape', w.shape, Object.keys(WK.SHAPES).map(k => [k, WK.SHAPES[k].name.replace(', Platte', '')]), 'wrap')}
      <div class="fields">
        ${sh.fields.map(([k, l]) => `<div class="field"><label for="w-${k}">${esc(l)}</label>${bindNum('w-' + k, 'weight.' + k, 'mm', '')}</div>`).join('')}
        <div class="field"><label for="w-L">Länge L</label>${bindNum('w-L', 'weight.L', 'mm', 'z. B. 1000')}</div>
        <div class="field full"><label for="w-mat">Werkstoff</label>${selInp('w-mat', 'weight.mat', WK.DENSITY.map((m, i) => [String(i), `${m[0]} · ${nf(m[1], 2)} g/cm³`]).concat([['own', 'Eigene Dichte']]))}</div>
        ${w.mat === 'own' ? `<div class="field"><label for="w-rho">Dichte</label>${bindNum('w-rho', 'weight.rho', 'g/cm³', 'z. B. 7,85')}</div>` : ''}
      </div>
      <div class="result" id="res-weight" aria-live="polite"></div>
    </section>`;
  }
  function computeWeight() {
    const w = A.weight, sh = WK.SHAPES[w.shape];
    const vals = {};
    sh.fields.forEach(([k]) => { vals[k] = optOf(w[k]); });
    const rho = w.mat === 'own' ? optOf(w.rho) : (WK.DENSITY[+w.mat] || WK.DENSITY[0])[1];
    const L = optOf(w.L);
    const r = WK.weight(w.shape, vals, L, rho);
    if (!r.ok) return out('res-weight', msgHTML(esc(r.error)));
    const steps = [{ t: 'Querschnitt', h: `${esc(sh.name)}: A = <b>${nf(r.A, 2)} mm²</b>.` },
      { t: 'Masse je Meter', h: `A · Dichte: ${nf(r.A, 2)} mm² · ${nf(rho, 3)} g/cm³ / 1000 = <b>${nf(r.perM, 3)} kg/m</b>. (1 m Stab mit 1 mm² Querschnitt hat 1 cm³.)` }];
    if (r.m != null) steps.push({ t: 'Masse', h: `${nf(r.perM, 3)} kg/m · ${nf(L / 1000, 4)} m = <b>${nf(r.m, 3)} kg</b>.` });
    out('res-weight', `<div class="res-hero"><div class="res-big">${r.m != null ? nf(r.m, 3) + ' <small>kg</small>' : nf(r.perM, 3) + ' <small>kg/m</small>'}</div><div class="res-sub">${r.m != null ? `${esc(sh.name)}, ${nf(L, 1)} mm lang` : 'Gib eine Länge ein für das Stückgewicht.'}</div></div>
      <div class="kv">${kv('Je Meter', nf(r.perM, 3) + ' kg/m')}${kv('Querschnitt', nf(r.A, 2) + ' mm²')}${r.m != null ? kv('Volumen', nf(r.A * L / 1000, 2) + ' cm³') + kv('In Gramm', nf(r.m * 1000, 1) + ' g') : ''}</div>
      ${calcHTML('weight', steps)}`);
  }

  // ---------- Dreieck, Kegel, Lochkreis: Skizze antippen, um ein Maß einzugeben ----------
  const dms = x => { const t = Math.round(x * 3600); const d = Math.floor(t / 3600), m = Math.floor((t - d * 3600) / 60), sec = t - d * 3600 - m * 60; return `${d}° ${String(m).padStart(2, '0')}′ ${String(sec).padStart(2, '0')}″`; };
  // Antippbarer Teil der Skizze: breite unsichtbare Fläche zum Treffen, darüber die Beschriftung mit dem Wert
  const hit = (k, d, lx, ly, anchor = 'middle', name) => `<g class="fk" data-fk="${k}" role="button" aria-label="${esc(name || k)} eingeben"><path class="fk-hit" d="${d}"/><text class="fk-lab" data-lab="${k}" x="${lx}" y="${ly}" text-anchor="${anchor}">${esc(name || '')}</text></g>`;
  // Werte in der Skizze anzeigen: given = eingegeben (Akzentfarbe), calc = gerechnet (grün)
  function figLabels(map) {
    Object.entries(map).forEach(([k, [txt, state]]) => {
      const t = $(`[data-lab="${k}"]`);
      if (!t) return;
      t.textContent = txt;
      const g = t.closest('.fk');
      if (!g) return;
      g.classList.toggle('given', state === 'given');
      g.classList.toggle('calc', state === 'calc');
    });
  }
  // Nur die zuletzt eingegebenen Werte zählen: ältere werden geleert, wenn zu viele da sind
  const LIMITS = { tri: [['a', 'b', 'c', 'al', 'be'], 2], cone: [['D', 'd', 'L', 'a'], 3] };
  let lastCleared = '', clearedBy = '';
  function keepLatest(k) {
    const [sec, key] = k.split('.');
    const lim = LIMITS[sec];
    if (k !== clearedBy) lastCleared = '';
    if (!lim || !lim[0].includes(key)) return;
    const st = A[sec];
    st.ord = (Array.isArray(st.ord) ? st.ord : []).filter(x => x !== key && lim[0].includes(x));
    if (String(st[key]).trim()) st.ord.push(key);
    const filled = lim[0].filter(x => String(st[x]).trim());
    if (filled.length > lim[1]) {
      const old = st.ord.find(x => x !== key && String(st[x]).trim()) || filled.find(x => x !== key);
      st[old] = '';
      st.ord = st.ord.filter(x => x !== old);
      const inp = $(`[data-k="${sec}.${old}"]`);
      if (inp) inp.value = '';
      lastCleared = old; clearedBy = k;
    }
    saveA();
  }
  const NAMES = { a: 'a', b: 'b', c: 'c', al: 'α', be: 'β', D: 'D', d: 'd', L: 'L' };
  const clearedNote = sec => lastCleared && clearedBy.startsWith(sec + '.') ? msgHTML(`Den älteren Wert ${esc(NAMES[lastCleared] || lastCleared)} habe ich geleert: Es zählen immer die zuletzt eingegebenen Werte.`) : '';
  const v4 = x => nf(x, 3);

  function cardTri() {
    const fig = `<svg class="tri-fig" viewBox="0 0 330 190" aria-label="Rechtwinkliges Dreieck, Seiten und Winkel antippen">
      <path class="tri-line" d="M30 160H250V30Z"/><path class="tri-ra" d="M234 160v-16h16"/>
      ${hit('tri.b', 'M30 160H250', 140, 182, 'middle', 'b')}
      ${hit('tri.a', 'M250 160V30', 262, 100, 'start', 'a')}
      ${hit('tri.c', 'M30 160L250 30', 128, 84, 'end', 'c')}
      ${hit('tri.al', 'M30 160m-2 0a30 30 0 1 0 60 0a30 30 0 1 0-60 0', 76, 150, 'start', 'α')}
      ${hit('tri.be', 'M250 30m-24 0a24 24 0 1 0 48 0a24 24 0 1 0-48 0', 238, 66, 'end', 'β')}
      <text class="pt" x="16" y="172">A</text><text class="pt" x="256" y="176">C</text><text class="pt" x="256" y="24">B</text></svg>`;
    return `<section class="card" id="card-tri">
      <div class="tri-wrap">${fig}</div>
      <p class="hint-line"><b>Seite oder Winkel in der Skizze antippen</b> und den Wert eingeben. Zwei Werte genügen, mindestens eine Seite. Der rechte Winkel liegt bei C.</p>
      <div class="fields five">
        <div class="field"><label for="tr-a">a</label>${bindNum('tr-a', 'tri.a', 'mm', '')}</div>
        <div class="field"><label for="tr-b">b</label>${bindNum('tr-b', 'tri.b', 'mm', '')}</div>
        <div class="field"><label for="tr-c">c</label>${bindNum('tr-c', 'tri.c', 'mm', '')}</div>
        <div class="field"><label for="tr-al">α</label>${bindNum('tr-al', 'tri.al', '°', '')}</div>
        <div class="field"><label for="tr-be">β</label>${bindNum('tr-be', 'tri.be', '°', '')}</div>
        <div class="field"><button type="button" class="btn plain" data-act="fig-clear" data-g="tri">Leeren</button></div>
      </div>
      <div class="result" id="res-tri" aria-live="polite"></div>
    </section>`;
  }
  function computeTri() {
    const v = {};
    ['a', 'b', 'c', 'al', 'be'].forEach(k => { const x = optOf(A.tri[k]); if (x != null) v[k] = x; });
    const r = WK.rightTriangle(v);
    const st = k => v[k] != null ? 'given' : 'calc';
    if (!r.ok) { figLabels({ 'tri.a': ['a', ''], 'tri.b': ['b', ''], 'tri.c': ['c', ''], 'tri.al': ['α', ''], 'tri.be': ['β', ''] }); Object.keys(v).forEach(k => figLabels({ ['tri.' + k]: [(NAMES[k]) + ' = ' + nf(v[k], 3) + (k.length > 1 ? '°' : ''), 'given'] })); return out('res-tri', clearedNote('tri') + msgHTML(esc(r.error))); }
    figLabels({ 'tri.a': ['a = ' + v4(r.a), st('a')], 'tri.b': ['b = ' + v4(r.b), st('b')], 'tri.c': ['c = ' + v4(r.c), st('c')], 'tri.al': ['α = ' + nf(r.al, 3) + '°', st('al')], 'tri.be': ['β = ' + nf(r.be, 3) + '°', st('be')] });
    out('res-tri', clearedNote('tri') + `<div class="kv three">${kv('a', v4(r.a) + ' mm')}${kv('b', v4(r.b) + ' mm')}${kv('c', v4(r.c) + ' mm')}${kv('α', nf(r.al, 3) + '°' + `<small>${dms(r.al)}</small>`)}${kv('β', nf(r.be, 3) + '°' + `<small>${dms(r.be)}</small>`)}${kv('Fläche', nf(r.A, 2) + ' mm²')}</div>
      <p class="foot">Blau: eingegeben, grün: gerechnet. Für eine Schräge im Programm: b ist der Weg in X (bzw. Z), a der Weg in Y (bzw. X als Radius).</p>
      ${calcHTML('tri', [{ t: 'Formeln', h: 'a² + b² = c² (Pythagoras). sin α = a / c, cos α = b / c, tan α = a / b. α + β = 90°.' }])}`);
  }

  function cardTri2() {
    const m = A.tri2.mode;
    const has = k => (m === 'SSS' ? ['a', 'b', 'c'] : m === 'SWS' ? ['b', 'c', 'al'] : ['c', 'al', 'be']).includes(k);
    const fld = (k, l, u) => `<div class="field"><label for="t2-${k}">${l}</label>${bindNum('t2-' + k, 'tri2.' + k, u, '')}</div>`;
    const fig = `<svg class="tri-fig" viewBox="0 0 300 190" aria-label="Dreieck, Seiten und Winkel antippen">
      <path class="tri-line" d="M30 160H260L175 30Z"/>
      ${hit('tri2.c', 'M30 160H260', 145, 182, 'middle', 'c')}
      ${hit('tri2.a', 'M260 160L175 30', 228, 92, 'start', 'a')}
      ${hit('tri2.b', 'M30 160L175 30', 92, 88, 'end', 'b')}
      ${hit('tri2.al', 'M30 160m-2 0a30 30 0 1 0 60 0a30 30 0 1 0-60 0', 70, 150, 'start', 'α')}
      ${hit('tri2.be', 'M260 160m-30 0a30 30 0 1 0 60 0a30 30 0 1 0-60 0', 220, 150, 'end', 'β')}
      <text class="fk-lab static" x="175" y="62" text-anchor="middle" data-lab="tri2.ga">γ</text>
      <text class="pt" x="16" y="172">A</text><text class="pt" x="266" y="172">B</text><text class="pt" x="170" y="22">C</text></svg>`;
    return `<section class="card" id="card-tri2">
      ${segHTML('tri2.mode', m, [['SSS', '3 Seiten'], ['SWS', '2 Seiten + Winkel'], ['WSW', 'Seite + 2 Winkel']], 'wrap')}
      <div class="tri-wrap">${fig}</div>
      <p class="hint-line"><b>Antippen und eingeben.</b> ${m === 'SSS' ? 'Alle drei Seiten.' : m === 'SWS' ? 'Die Seiten b und c und der Winkel α zwischen ihnen.' : 'Die Seite c und die Winkel α und β an ihren Enden.'}</p>
      <div class="fields">${['a', 'b', 'c'].filter(has).map(k => fld(k, k, 'mm')).join('')}${has('al') ? fld('al', 'α', '°') : ''}${has('be') ? fld('be', 'β', '°') : ''}</div>
      <div class="result" id="res-tri2" aria-live="polite"></div>
    </section>`;
  }
  function computeTri2() {
    const v = {};
    ['a', 'b', 'c', 'al', 'be'].forEach(k => { v[k] = optOf(A.tri2[k]); });
    const m = A.tri2.mode, gv = m === 'SSS' ? ['a', 'b', 'c'] : m === 'SWS' ? ['b', 'c', 'al'] : ['c', 'al', 'be'];
    const r = WK.triangle(m, v);
    const st = k => gv.includes(k) ? 'given' : 'calc';
    if (!r.ok) { figLabels({ 'tri2.a': ['a', ''], 'tri2.b': ['b', ''], 'tri2.c': ['c', ''], 'tri2.al': ['α', ''], 'tri2.be': ['β', ''], 'tri2.ga': ['γ', ''] }); return out('res-tri2', msgHTML(esc(r.error))); }
    figLabels({ 'tri2.a': ['a = ' + v4(r.a), st('a')], 'tri2.b': ['b = ' + v4(r.b), st('b')], 'tri2.c': ['c = ' + v4(r.c), st('c')], 'tri2.al': ['α = ' + nf(r.al, 3) + '°', st('al')], 'tri2.be': ['β = ' + nf(r.be, 3) + '°', st('be')], 'tri2.ga': ['γ = ' + nf(r.ga, 3) + '°', 'calc'] });
    out('res-tri2', `<div class="kv three">${kv('a', v4(r.a) + ' mm')}${kv('b', v4(r.b) + ' mm')}${kv('c', v4(r.c) + ' mm')}${kv('α', nf(r.al, 3) + '°')}${kv('β', nf(r.be, 3) + '°')}${kv('γ', nf(r.ga, 3) + '°')}</div><div class="kv">${kv('Fläche', nf(r.A, 2) + ' mm²')}${kv('Umfang', nf(r.U, 3) + ' mm')}</div>
      ${calcHTML('tri2', [{ t: 'Formeln', h: 'Kosinussatz: a² = b² + c² − 2 · b · c · cos α. Sinussatz: a / sin α = b / sin β = c / sin γ. Winkelsumme 180°. Fläche nach Heron.' }])}`);
  }

  // Kegel beim Drehen
  function cardCone() {
    const fig = `<svg class="tri-fig" viewBox="0 0 300 190" aria-label="Kegel, Maße antippen">
      <path class="axis" d="M14 95H290"/>
      <path class="tri-line" d="M60 35L240 65V125L60 155Z"/>
      <path class="tri-ra" d="M60 35H250" stroke-dasharray="4 4"/>
      ${hit('cone.D', 'M60 35V155', 52, 100, 'end', 'D')}
      ${hit('cone.d', 'M240 65V125', 250, 100, 'start', 'd')}
      ${hit('cone.L', 'M60 172H240', 150, 184, 'middle', 'L')}
      ${hit('cone.a', 'M180 25m-28 0a28 28 0 1 0 56 0a28 28 0 1 0-56 0', 190, 30, 'middle', 'α/2')}
      <path class="dim" d="M60 166v12M240 136v42"/></svg>`;
    return `<section class="card" id="card-cone">
      <div class="tri-wrap">${fig}</div>
      <p class="hint-line"><b>Maß in der Skizze antippen</b> und eingeben. Drei der vier Werte genügen: großer Ø D, kleiner Ø d, Länge L, Einstellwinkel α/2 (halber Kegelwinkel, den du an der Maschine einstellst).</p>
      <div class="fields">
        <div class="field"><label for="k-D">D</label>${bindNum('k-D', 'cone.D', 'mm', '')}</div>
        <div class="field"><label for="k-d">d</label>${bindNum('k-d', 'cone.d', 'mm', '')}</div>
        <div class="field"><label for="k-L">L</label>${bindNum('k-L', 'cone.L', 'mm', '')}</div>
        <div class="field"><label for="k-a">α/2</label>${bindNum('k-a', 'cone.a', '°', '')}</div>
        <div class="field full"><button type="button" class="btn plain" data-act="fig-clear" data-g="cone">Leeren</button></div>
      </div>
      <div class="result" id="res-cone" aria-live="polite"></div>
    </section>`;
  }
  function computeCone() {
    const v = {};
    ['D', 'd', 'L', 'a'].forEach(k => { const x = optOf(A.cone[k]); if (x != null) v[k] = x; });
    const r = WK.cone(v);
    const st = k => v[k] != null ? 'given' : 'calc';
    if (!r.ok) { figLabels({ 'cone.D': ['D', ''], 'cone.d': ['d', ''], 'cone.L': ['L', ''], 'cone.a': ['α/2', ''] }); return out('res-cone', clearedNote('cone') + msgHTML(esc(r.error))); }
    figLabels({ 'cone.D': ['Ø' + v4(r.D), st('D')], 'cone.d': ['Ø' + v4(r.d), st('d')], 'cone.L': [v4(r.L), st('L')], 'cone.a': [nf(r.a, 3) + '°', st('a')] });
    out('res-cone', clearedNote('cone') + `<div class="res-hero"><div class="res-big">${nf(r.a, 4)}°</div><div class="res-sub">Einstellwinkel α/2 · ${dms(r.a)}</div></div>
      <div class="kv">${kv('Kegelwinkel α', nf(r.full, 4) + '°')}${kv('Kegelverhältnis', r.C > 0 ? `1 : ${nf(r.ratio, 3)}<small>C = ${nf(r.C, 4)}</small>` : '–')}${kv('D', 'Ø ' + v4(r.D) + ' mm')}${kv('d', 'Ø ' + v4(r.d) + ' mm')}${kv('L', v4(r.L) + ' mm')}${kv('Zustellung je Seite', v4(r.dx) + ' mm<small>(D − d) / 2, im Radius</small>')}</div>
      <p class="foot">Im Programm (Durchmesserprogrammierung): von X${v4(r.d)} nach X${v4(r.D)} auf ${v4(r.L)} mm in Z.</p>
      ${calcHTML('cone', [{ t: 'Formeln', h: 'tan(α/2) = (D − d) / (2 · L). Kegelverhältnis C = (D − d) / L, geschrieben 1 : (L / (D − d)).' }])}`);
  }

  // Lochkreis: Koordinaten der Bohrungen
  function cardBolt() {
    const b = A.bolt;
    return `<section class="card" id="card-bolt">
      <div class="tri-wrap" id="bolt-fig"></div>
      <div class="fields">
        <div class="field"><label for="b-D">Teilkreis-Ø</label>${bindNum('b-D', 'bolt.D', 'mm', 'z. B. 100')}</div>
        <div class="field"><label for="b-n">Anzahl Bohrungen</label>${bindNum('b-n', 'bolt.n', 'Stück', 'z. B. 6')}</div>
        <div class="field"><label for="b-s">Startwinkel</label>${bindNum('b-s', 'bolt.start', '°', '0 = auf +X', { signed: true })}</div>
        <div class="field"><span class="lbl">Richtung</span>${segHTML('bolt.dir', b.dir, [['ccw', 'gegen Uhr'], ['cw', 'mit Uhr']])}</div>
        <div class="field"><label for="b-x">Mitte X</label>${bindNum('b-x', 'bolt.cx', 'mm', '0', { signed: true })}</div>
        <div class="field"><label for="b-y">Mitte Y</label>${bindNum('b-y', 'bolt.cy', 'mm', '0', { signed: true })}</div>
      </div>
      <div class="result" id="res-bolt" aria-live="polite"></div>
    </section>`;
  }
  function computeBolt() {
    const b = A.bolt;
    const r = WK.boltCircle({ D: optOf(b.D), n: optOf(b.n), start: optOf(b.start) || 0, cx: optOf(b.cx) || 0, cy: optOf(b.cy) || 0, cw: b.dir === 'cw' });
    const fig = $('#bolt-fig');
    if (!r.ok) { if (fig) fig.innerHTML = ''; return out('res-bolt', msgHTML(esc(r.error))); }
    const cx0 = optOf(b.cx) || 0, cy0 = optOf(b.cy) || 0, k = 70 / r.R, show = r.pts.length <= 36;
    if (fig) fig.innerHTML = `<svg class="tri-fig bolt" viewBox="0 0 220 200" aria-label="Lochkreis mit nummerierten Bohrungen">
      <path class="axis" d="M10 100H210M110 10V190"/><text class="pt" x="204" y="94" text-anchor="end">+X</text><text class="pt" x="116" y="20">+Y</text>
      <circle class="pcd" cx="110" cy="100" r="70"/>
      ${r.pts.map(p => { const x = 110 + (p.x - cx0) * k, y = 100 - (p.y - cy0) * k; return `<circle class="hole${p.i === 1 ? ' first' : ''}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${show ? 7 : 3}"/>${show ? `<text class="hn" x="${x.toFixed(1)}" y="${(y + 3.5).toFixed(1)}" text-anchor="middle">${p.i}</text>` : ''}`; }).join('')}</svg>`;
    out('res-bolt', `<div class="kv">${kv('Winkelteilung', nf(r.step, 4) + '°')}${kv('Abstand Nachbarn', v4(r.chord) + ' mm<small>Sehne</small>')}</div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th scope="col">Nr.</th><th scope="col">Winkel</th><th scope="col">X</th><th scope="col">Y</th></tr></thead><tbody>${r.pts.map(p => `<tr><th scope="row">${p.i}</th><td>${nf(p.w, 3)}°</td><td>${T.fmt(p.x, 3, 3)}</td><td>${T.fmt(p.y, 3, 3)}</td></tr>`).join('')}</tbody></table></div>
      <p class="foot">Winkel ab +X gegen den Uhrzeigersinn. Bohrung 1 ist hervorgehoben. Koordinaten absolut (G90) zur eingegebenen Mitte.</p>
      ${calcHTML('bolt', [{ t: 'Formeln', h: `X = Mitte X + R · cos(Winkel), Y = Mitte Y + R · sin(Winkel), R = ${v4(r.R)} mm. Winkel = Start ± Nr. · 360° / Anzahl. Sehne = D · sin(180° / Anzahl).` }])}`);
  }

  // ---------- Rauheit ----------
  function cardRoughTab() {
    return `<section class="card">
      <div class="tbl-cap">Rauheitsklassen nach ISO 1302</div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th scope="col">Klasse</th><th scope="col">Ra µm</th><th scope="col">Rz etwa µm</th></tr></thead>
      <tbody>${WK.N_CLASSES.map(([n, ra]) => `<tr><th scope="row">${n}</th><td>${nf(ra, 3)}</td><td>${nf(ra * 4, 2)} bis ${nf(ra * 7, 2)}</td></tr>`).join('')}</tbody></table></div>
      <p class="tbl-note">Ra und Rz lassen sich nicht genau umrechnen. Als Faustwert ist Rz etwa 4- bis 7-mal so groß wie Ra.</p>
      <div class="tbl-cap">Erreichbare Rauheit Ra je Verfahren (Richtwerte)</div>
      <div class="ra-bars">${WK.PROCESS_RA.map(([p, lo, hi]) => { const x = v => (Math.log10(v) - Math.log10(0.01)) / (Math.log10(50) - Math.log10(0.01)) * 100; return `<div class="ra-row"><span class="ra-name">${esc(p)}</span><span class="ra-track"><i style="left:${x(lo).toFixed(1)}%;width:${(x(hi) - x(lo)).toFixed(1)}%"></i></span><span class="ra-val">${nf(lo, 3)}–${nf(hi, 3)}</span></div>`; }).join('')}
        <div class="ra-row ra-axis"><span></span><span class="ra-track">${[0.1, 1, 10].map(v => `<b style="left:${((Math.log10(v) + 2) / (Math.log10(50) + 2) * 100).toFixed(1)}%">${nf(v, 2)}</b>`).join('')}</span><span>µm</span></div></div>
      <div class="tbl-note"><p><b>Auf der Zeichnung:</b> Das Haken-Symbol √ mit Wert, zum Beispiel Ra 1,6. Mit Querstrich: spanend herstellen. Mit Kreis: nicht spanend (Oberfläche bleibt wie geliefert).</p>
      <p><b>Ra</b> ist der Mittelwert der Abweichungen, <b>Rz</b> die mittlere Höhe zwischen höchster Spitze und tiefstem Tal. Rz reagiert stärker auf einzelne Riefen.</p></div>
    </section>`;
  }

  // ---------- Gleitschleifen ----------
  function cardTrow() {
    return `<section class="card" id="card-trow">
      <div class="fields">
        <div class="field"><label for="tw-V">Behältervolumen</label>${bindNum('tw-V', 'trow.V', 'l', 'z. B. 50')}</div>
        <div class="field"><label for="tw-f">Füllhöhe</label>${bindNum('tw-f', 'trow.fill', '%', '70 bis 90')}</div>
        <div class="field full"><label for="tw-mix">Ziel</label>${selInp('tw-mix', 'trow.mix', WK.MIX.map(m => [m.id, `${m.name} (1 : ${m.media})`]))}</div>
        <div class="field full"><label for="tw-med">Schleifkörper</label>${selInp('tw-med', 'trow.media', WK.MEDIA.map(m => [m.id, m.name]))}</div>
      </div>
      <div class="result" id="res-trow" aria-live="polite"></div>
    </section>`;
  }
  function computeTrow() {
    const t = A.trow;
    const r = WK.trowal(optOf(t.V), optOf(t.fill) != null ? optOf(t.fill) / 100 : null, t.mix, t.media);
    if (!r.ok) return out('res-trow', msgHTML(esc(r.error)));
    out('res-trow', `<div class="res-hero"><div class="res-big">${nf(r.Vp, 1)} <small>l Teile</small></div><div class="res-sub">höchstens, dazu ${nf(r.Vm, 1)} l ${esc(r.med.name)}</div></div>
      <div class="kv">${kv('Füllung gesamt', nf(r.Vf, 1) + ' l')}${kv('Verhältnis', `1 : ${r.mix.media}<small>${esc(r.mix.note)}</small>`)}${kv('Schleifkörper', nf(r.Vm, 1) + ' l')}${kv('Gewicht Schleifkörper', `etwa ${nf(r.mMedia, 0)} kg<small>Schüttdichte ${nf(r.med.rho, 1)} kg/l</small>`)}</div>
      ${msgHTML(esc(r.med.use))}
      <p class="foot">Richtwerte. Teilevolumen heißt das Volumen, das die Teile als Haufen einnehmen. Weniger Teile schonen die Kanten und die Teile untereinander.</p>`);
  }
  function cardTrowInfo() {
    return `<section class="card prose">
      <p><b>Trowalisieren</b> ist ein alter Markenname für das <b>Gleitschleifen</b>. Teile und Schleifkörper liegen lose in einem Behälter, der rüttelt oder dreht. Dabei reiben die Schleifkörper an den Teilen: Grate verschwinden, Kanten werden rund, die Oberfläche wird glatter.</p>
      <h3>Anlagen</h3>
      <ul><li><b>Rundvibrator:</b> Ringförmiger Behälter, die Masse wandert im Kreis. Für die meisten Kleinteile.</li><li><b>Trogvibrator:</b> Langer Trog, für lange Teile.</li><li><b>Fliehkraftanlage:</b> Drehender Teller, viel schneller, auch für kleine, harte Teile.</li><li><b>Schleppfinish:</b> Teile sind aufgespannt und werden durch die Masse gezogen. Für empfindliche, große Teile.</li></ul>
      <h3>Schleifkörper</h3>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th scope="col">Art</th><th scope="col">Wofür</th></tr></thead><tbody>${WK.MEDIA.map(m => `<tr><th scope="row">${esc(m.name)}</th><td class="wrap">${esc(m.use)}</td></tr>`).join('')}</tbody></table></div>
      <h3>Form und Größe</h3>
      <ul><li>Kegel und Pyramiden kommen in Ecken und Nuten, Zylinder und Kugeln laufen ruhiger.</li><li>Größe so wählen, dass die Körper nicht in Bohrungen, Nuten oder Gewinden stecken bleiben: deutlich größer oder deutlich kleiner als die Öffnung, nie ungefähr gleich groß.</li><li>Große Körper tragen mehr ab, kleine kommen besser an Konturen.</li></ul>
      <h3>Wasser und Compound</h3>
      <p>Nass gearbeitet wird mit Wasser und einem Zusatz (Compound). Er hält die Körper und Teile sauber, schützt vor Rost und spült den Abrieb weg. Die Dosierung steht beim Hersteller, meist wenige Prozent.</p>
      <h3>Was es mit dem Maß macht</h3>
      <ul><li>Kanten werden verrundet, je nach Körper und Zeit etwa 0,05 bis 0,3 mm.</li><li>Flächen verlieren nur wenige µm, enge Toleranzen (zum Beispiel H7) trotzdem nach dem Gleitschleifen prüfen.</li><li>Gewinde, Passbohrungen und Dichtflächen bei Bedarf abdecken.</li></ul>
      <h3>Ablauf</h3>
      <ol><li>Teile entfetten, Späne entfernen.</li><li>Schleifkörper und Wasser mit Compound einfüllen, dann die Teile.</li><li>Laufzeit von Minuten bis Stunden, mit Probeteil festlegen.</li><li>Teile trennen, spülen, trocknen (zum Beispiel in Maisgranulat), gegen Rost schützen.</li></ol>
      <p class="foot">Allgemeine Richtwerte. Für Ihre Anlage und Ihre Teile gelten die Angaben des Herstellers der Anlage und der Schleifkörper.</p>
    </section>`;
  }

  // ---------- Info ----------
  function cardInfo() {
    const theme = store.get('theme', 'auto');
    const standalone = window.navigator.standalone || (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || window.top !== window;
    return `<section class="card">
      <span class="seg-label">Darstellung</span>
      ${segHTML('theme', theme, [['auto', 'Automatisch'], ['light', 'Hell'], ['dark', 'Dunkel']])}
    </section>
    <section class="card prose">
      <h3>Was die App kann</h3>
      <p>Toleranzen nach ISO 286 (alle Grundabmaße a bis zc), Passungen, Maßketten, Maße aus einem Zeichnungsfoto, Allgemeintoleranzen nach ISO 2768-1 und ISO 22081, Form und Lage nach ISO 2768-2 und ISO 1101, Gewinde, Schnittdaten, Schrauben und Schlüsselweiten, Anziehdrehmomente, Gewichte, Dreiecke, Rauheit und Gleitschleifen.</p>
      <h3>Schnellsuche</h3>
      <p>Auf der Startseite: M8 oder M10x1 für Gewinde, G1/2 oder 1/4-20 UNC, 6H7 oder 30g6 für eine ISO-Toleranz, 25H7/g6 für eine Passung, SW13 für eine Schlüsselweite, N7 für eine Rauheitsklasse oder einfach ein Stichwort wie Kernloch.</p>
      <h3>Bedienen</h3>
      <p>Reihenfolge ändern: In der Startliste und bei den Reitern oben einen Eintrag gedrückt halten und verschieben. Bei Dreieck, Kegel und Lochkreis die Seite oder den Winkel in der Skizze antippen, dann den Wert eingeben. Zerspanung: Werkstoff und (wenn du willst) Werkzeug wählen, die App schlägt vc und Vorschub vor und zeigt die Empfehlung klein über jedem Feld. Deine Maschinengrenzen und eigene Werkzeuge kannst du speichern. Bei Fräsen, Bohren und Drehen gibst du ein, was du weißt (zum Beispiel Messerkopf Ø80, 10 Platten, Eckenradius 0,4, Drehzahl und gewünschte Rautiefe), der Rest wird gerechnet, mit fertigen Zeilen fürs Programm (S, F).</p>
      <h3>Grundlagen</h3>
      <ul><li>ISO 286-1 und -2: Grundtoleranzen, Grundabmaße, Passungen</li><li>ISO 2768-1 und -2, ISO 22081: Allgemeintoleranzen</li><li>ISO 1101: Form und Lage</li><li>ISO 68-1, 261, 724, 228-1, 2904, ASME B1.1: Gewinde · DIN 336: Kernlöcher</li><li>ISO 4014/4017/4032, ISO 4762, 10642, 7380, 4026 bis 4029, ISO 273, DIN 974-1: Schrauben</li><li>VDI 2230 Blatt 1: Anziehdrehmomente · ISO 1302: Rauheit</li></ul>
      <h3>Wichtig</h3>
      <p>Normwerte sind fest in der App gespeichert und mit Tests geprüft. Schnittdaten, erreichbare Rauheit und Gleitschleifen sind <b>Richtwerte</b>, die Angaben der Werkzeug- und Maschinenhersteller gehen vor. Im Zweifel gilt immer die Zeichnung und die Norm selbst.</p>
      <p>Die App läuft ohne Netz, Fotos und Eingaben bleiben auf dem Gerät.${standalone ? '' : ' Tipp fürs iPhone: In Safari über Teilen und „Zum Home-Bildschirm“ startet sie wie eine echte App.'}</p>
    </section>`;
  }

  function onApplyChange(k) {
    const [sk0, sk1] = k.split('.');
    if (sk1 === 'sk' && A[sk0]) {   // Oberfläche umschalten: eingegebenen Wert umrechnen
      const st = A[sk0], to = st.sk === 'Ra' ? 'Ra' : 'Rz', from = to === 'Ra' ? 'Rz' : 'Ra';
      const x = optOf(st[from]);
      if (x > 0) { st[to] = T.fmt(to === 'Ra' ? x / 3.9 : x * 3.9, 0, 2).replace('−', '-'); st[from] = ''; st.ord = (st.ord || []).map(o => o === from ? to : o); }
      saveA();
      $('#sec-body').innerHTML = sectionHTML();
      computeCurrent();
      return;
    }
    keepLatest(k);
    solveHook(k);
    if (k === 'geo.prop') $('#geo-inputs').innerHTML = geoInputs();
    if (['gen.tab', 'gen.mode', 'mill.tool', 'mill.mat', 'mill.op', 'mill.auto', 'drill.tool', 'drill.mat', 'drill.auto', 'turn.tool', 'turn.mat', 'turn.auto', 'weight.shape', 'weight.mat', 'tri2.mode'].includes(k)) {
      const ae = document.activeElement, id = ae && ae.id;
      $('#sec-body').innerHTML = sectionHTML();
      if (id && ae.tagName === 'SELECT') { const n = $('#' + id); if (n) n.focus({ preventScroll: true }); }
    }
    computeCurrent();
  }

  // ================================================================
  // Ereignisse
  // ================================================================
  function setPressed(group, btn) {
    $$('button', group).forEach(b => {
      if (b.hasAttribute('aria-checked')) b.setAttribute('aria-checked', String(b === btn));
      else b.setAttribute('aria-pressed', String(b === btn));
    });
  }
  const ACT = {
    back: () => back(),
    'open-tables': t => openSheet(t.dataset.tables.split(',').filter(Boolean)),
    'close-sheet': () => closeSheet(),
    'q-clear': () => { S.q = ''; const q = $('#q'); if (q) { q.value = ''; q.focus(); } renderSearch(); },
    'thread-pick': t => { A.thread.q = t.dataset.v; saveA(); if (S.page === 'thread' && curSection().id === 'thread') { $('#th-q').value = t.dataset.v; computeThread(); } else goSection('thread'); window.scrollTo({ top: 0, behavior: 'smooth' }); },
    'sw-pick': t => { A.sw.d = t.dataset.v; saveA(); goSection('sw'); window.scrollTo({ top: 0, behavior: 'smooth' }); },
    'sv-take': t => { const m = t.dataset.m, k = t.dataset.k; const inp = $(`[data-k="${m}.${k}"]`); A[m][k] = t.dataset.v; if (inp) inp.value = t.dataset.v; onApplyChange(m + '.' + k); },
    'sv-accept': t => acceptSuggestions(t.dataset.m),
    'tool-save': t => saveTool(t.dataset.m),
    'tool-load': t => loadTool(t.dataset.id),
    'tool-del': t => { const l = myTools(), x = l.find(y => y.id === t.dataset.id); if (x && window.confirm(`„${x.name}“ aus deinen Werkzeugen löschen?`)) { store.set('tools', l.filter(y => y !== x)); $('#sec-body').innerHTML = sectionHTML(); computeCurrent(); } },
    'sv-clear': t => { const m = t.dataset.m; WK.SOLVE_VARS[m].forEach(k => { A[m][k] = ''; }); A[m].ord = []; saveA(); $$(`#card-${m} input`).forEach(x => { x.value = ''; }); computeSolve(m); const f = $(`#sv-${m}-d`); if (f) f.focus(); },
    'fig-clear': t => { const g = t.dataset.g; Object.keys(A[g]).forEach(k => { if (k !== 'ord' && k !== 'mode' && k !== 'dir') A[g][k] = ''; }); A[g].ord = []; saveA(); $$(`[data-k^="${g}."]`).forEach(x => { if (x.tagName === 'INPUT') x.value = ''; }); computeCurrent(); const f = $(`[data-k="${g}.${g === 'tri' ? 'a' : 'D'}"]`); if (f) f.focus(); },
    'fit-equiv': t => { setK('fit.hole', t.dataset.h); setK('fit.shaft', t.dataset.s); $('#p-h').value = t.dataset.h; $('#p-s').value = t.dataset.s; onApplyChange('fit.hole'); },
    'iso-from': t => { setK('iso.q', t.dataset.v); goSection('iso'); },
    'chain-add': () => {
      A.chain.rows.push({ op: 1, N: '', mode: 'pm', pm: '', up: '', lo: '', iso: '' });
      saveA(); renderChainRows(); computeChain();
      const inp = $(`#c${A.chain.rows.length - 1}-N`);
      if (inp) inp.focus();
    },
    'foto-open': t => {
      const i = +t.dataset.i;
      FOTO.open = FOTO.open === i ? -1 : i;
      computeFoto();
      if (FOTO.open >= 0 && t.classList.contains('foto-box')) { const row = $('#dim-' + i); if (row) row.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    },
    'foto-del': t => { A.foto.items.splice(+t.dataset.i, 1); FOTO.open = -1; saveA(); computeFoto(); },
    'foto-clear': () => { A.foto.items = []; A.foto.detected = null; FOTO.open = -1; FOTO.error = ''; saveA(); computeFoto(); },
    'foto-edit': t => {
      const i = +t.dataset.i, it = A.foto.items[i];
      FOTO.editIdx = i;
      const inp = $('#foto-add');
      inp.value = it.raw || it.label;
      $('#foto-add-lbl').textContent = `„${it.label}“ korrigieren`;
      $('#foto-add-btn').textContent = 'Übernehmen';
      inp.scrollIntoView({ behavior: 'smooth', block: 'center' });
      inp.focus();
    },
    'foto-add': () => fotoAddFromInput(),
    'foto-go': () => runMain(),
    'foto-rot': () => { rotateSource(); renderFotoStage(); },
    'foto-full': () => { FOTO.quad = fullQuad(FOTO.src); updateCrop(); },
    'foto-recrop': () => { FOTO.phase = 'crop'; FOTO.selMode = false; FOTO.sel = null; FOTO.regionMsg = ''; FOTO.regionAlts = []; renderFotoStage(); const cw = $('#crop-wrap'); if (cw) cw.scrollIntoView({ block: 'center', behavior: 'smooth' }); },
    'foto-sel': () => { FOTO.selMode = true; FOTO.sel = null; FOTO.regionMsg = ''; FOTO.regionAlts = []; renderFotoStage(); const fw = $('#foto-wrap'); if (fw) fw.scrollIntoView({ block: 'center', behavior: 'smooth' }); },
    'foto-sel-go': () => regionSearch(),
    'foto-alt': t => takeRegionAlt(+t.dataset.i),
    'foto-sel-cancel': () => { FOTO.selMode = false; FOTO.sel = null; renderFotoStage(); },
    'foto-text': () => {
      const ta = $('#foto-text');
      const r = T.parseDrawing(ta.value.split(/\n/).map(t => ({ text: t })));
      if (r.general) { A.foto.ml = r.general.ml; A.foto.detected = r.general; }
      mergeFotoItems(r.items);
      FOTO.error = r.items.length ? '' : 'Im eingefügten Text habe ich keine Maße gefunden.';
      saveA(); computeFoto();
      const seg = $('#card-foto [data-k="foto.ml"]');
      if (seg) $$('button', seg).forEach(x => x.setAttribute('aria-pressed', String(x.dataset.v === A.foto.ml)));
    },
    'foto-calc': t => { const sec = evalDim(A.foto.items[+t.dataset.i]).calc(); saveA(); goSection(sec); },
    'chain-del': t => { A.chain.rows.splice(+t.dataset.i, 1); saveA(); renderChainRows(); computeChain(); },
    'chain-example': () => {
      A.chain.rows = [{ op: 1, N: '40', mode: 'pm', pm: '0,1', up: '', lo: '', iso: '' }, { op: -1, N: '12', mode: 'ul', pm: '', up: '0,1', lo: '0', iso: '' }];
      saveA(); renderChainRows(); computeChain();
      out('res-chain', msgHTML('Beispiel: Ein Absatz ist 40 ±0,1 mm hoch. Von oben ist eine Nut 12 mm tief gefräst, mit +0,1 und 0. Gesucht ist die Restdicke unter der Nut.') + $('#res-chain').innerHTML);
    }
  };

  document.addEventListener('click', e => {
    const fk = e.target.closest && e.target.closest('.fk[data-fk]');
    if (fk) {
      const inp = $(`input[data-k="${fk.dataset.fk}"]`);
      $$('.fk.act').forEach(x => x.classList.remove('act'));
      if (inp) { fk.classList.add('act'); inp.focus({ preventScroll: true }); inp.select(); inp.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
      return;
    }
    const t = e.target.closest('button, tr[data-act]');
    if (!t) return;
    if (t.dataset.sec) { if (Date.now() > secClickBlock) showSection(t.dataset.sec); return; }
    if (t.dataset.page) { if (Date.now() > menuClickBlock) openPage(t.dataset.page); return; }
    if (t.dataset.hit != null) { const box = $('#q-res'); return openHit(box && box._res && box._res[+t.dataset.hit]); }
    if (t.classList.contains('sign')) {
      t.textContent = t.textContent === '−' ? '+' : '−';
      t.setAttribute('aria-label', `Vorzeichen: ${t.textContent === '−' ? 'minus' : 'plus'}. Tippen zum Wechseln`);
      const inp = t.parentElement.querySelector('input');
      if (inp) inp.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }
    if (t.dataset.act && ACT[t.dataset.act]) return ACT[t.dataset.act](t, e);
    if (t.dataset.geo) {
      setK('geo.prop', t.dataset.geo);
      $$('.geo-btn').forEach(b => b.setAttribute('aria-pressed', String(b === t)));
      onApplyChange('geo.prop');
      return;
    }
    if (t.dataset.chip) {
      setK(t.dataset.chip, t.dataset.v);
      const inp = $(`[data-k="${t.dataset.chip}"]`);
      if (inp) inp.value = t.dataset.v;
      onApplyChange(t.dataset.chip);
      return;
    }
    const group = t.parentElement;
    if (!group || t.dataset.v == null) return;
    const v = t.dataset.v;
    if (group.dataset.k) {
      setPressed(group, t);
      const k = group.dataset.k;
      if (k === 'theme') { store.set('theme', v); applyTheme(v); return; }
      setK(k, v);
      onApplyChange(k);
    } else if (group.dataset.chainOp != null) {
      setPressed(group, t);
      A.chain.rows[+group.dataset.chainOp].op = +v;
      saveA(); computeChain();
    } else if (group.dataset.chainMode != null) {
      A.chain.rows[+group.dataset.chainMode].mode = v;
      saveA(); renderChainRows(); computeChain();
    }
  });

  function onInput(e) {
    const el = e.target;
    if (el.dataset.k) {
      if (el.parentElement.querySelector('.sign')) normalizeSigned(el);
      setK(el.dataset.k, el.value);
      onApplyChange(el.dataset.k);
    } else if (el.id === 'q') {
      S.q = el.value;
      renderSearch();
    } else if (el.dataset.chain != null) {
      const row = A.chain.rows[+el.dataset.chain];
      if (!row) return;
      if (el.parentElement.querySelector('.sign')) { normalizeSigned(el); row[el.dataset.f] = signedValue(el); } else row[el.dataset.f] = el.value;
      saveA(); computeChain();
    }
  }
  document.addEventListener('input', onInput);
  // Eingabefeld aktiv: passende Stelle in der Skizze hervorheben
  document.addEventListener('focusin', e => {
    const k = e.target.dataset && e.target.dataset.k;
    $$('.fk.act').forEach(x => x.classList.remove('act'));
    if (k) { const g = $(`.fk[data-fk="${k}"]`); if (g) g.classList.add('act'); }
  });
  document.addEventListener('change', e => {
    if (e.target.tagName === 'SELECT') onInput(e);
    if (e.target.matches && e.target.matches('#foto-cam, #foto-lib') && e.target.files && e.target.files[0]) { handleFoto(e.target.files[0]); e.target.value = ''; }
  });

  // Eingabetaste springt zum nächsten Feld, wie „Weiter“ auf der iPhone-Tastatur
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !$('#sheet').hidden) { closeSheet(); return; }
    if (e.key !== 'Enter' || e.target.tagName !== 'INPUT') return;
    e.preventDefault();
    if (e.target.id === 'foto-add') { fotoAddFromInput(); return; }
    if (e.target.id === 'q') { const box = $('#q-res'); if (box && box._res && box._res.length) openHit(box._res[0]); return; }
    const scope = e.target.closest('.card') || document;
    const inputs = $$('input', scope);
    const i = inputs.indexOf(e.target);
    if (i >= 0 && i < inputs.length - 1) inputs[i + 1].focus();
    else e.target.blur();
  });

  // Als App vom Home-Bildschirm: vom linken Rand wischen geht zurück
  const standalone = window.navigator.standalone || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);
  if (standalone) {
    let sx = null, sy = 0, dx = 0;
    addEventListener('touchstart', e => {
      if (S.page === 'home' || !$('#sheet').hidden) return;
      const t = e.touches[0];
      if (t.clientX < 22) { sx = t.clientX; sy = t.clientY; dx = 0; }
    }, { passive: true });
    addEventListener('touchmove', e => {
      if (sx == null) return;
      const t = e.touches[0];
      dx = t.clientX - sx;
      if (Math.abs(t.clientY - sy) > 50 && Math.abs(t.clientY - sy) > dx) { sx = null; view.style.transform = ''; return; }
      if (dx > 0) { view.style.transition = 'none'; view.style.transform = `translateX(${dx}px)`; }
    }, { passive: true });
    addEventListener('touchend', () => {
      if (sx == null) return;
      sx = null;
      view.style.transition = 'transform .2s';
      if (dx > 80) {
        view.style.transform = 'translateX(100%)';
        setTimeout(() => { view.style.transition = ''; view.style.transform = ''; back(); }, 190);
      } else {
        view.style.transform = '';
        setTimeout(() => { view.style.transition = ''; }, 220);
      }
    });
  }

  applyTheme(store.get('theme', 'auto'));
  render();
})();
