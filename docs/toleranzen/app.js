/* Toleranzen – Oberfläche: Navigation wie in iOS, Lernen mit Aufgaben, Anwenden mit Rechnern */
(function () {
  'use strict';
  const T = window.TOL, L = T.LEARN;
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
    pencil: svg('<path d="M4.5 19.5l1-4L16 5a2.1 2.1 0 0 1 3 3L8.5 18.5Z"/><path d="M14 7l3 3"/>')
  };
  const TOPIC_ICON = { doc: I.doc, ruler: I.ruler, target: I.dia };

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
    profil: gd('<path d="M3.5 16.5a8.5 8.5 0 0 1 17 0z"/>')
  };
  const GEO_SHORT = { geradheit: 'Gerad&shy;heit', ebenheit: 'Eben&shy;heit', rundheit: 'Rund&shy;heit', rechtwinkligkeit: 'Recht&shy;winklig&shy;keit', parallelitaet: 'Paral&shy;lelität', position: 'Position', rundlauf: 'Rund&shy;lauf' };
  const fcf = cells => `<span class="fcf">${cells.map(c => `<span>${c}</span>`).join('')}</span>`;

  // ---------- Zustand und Navigation ----------
  function sanitizeStack(st) {
    const out = [{ v: 'learn' }];
    if (Array.isArray(st)) st.slice(1).forEach(e => {
      if (!e) return;
      if (e.v === 'topic' && L.topic(e.id) && out.length === 1) out.push({ v: 'topic', id: e.id, seg: e.seg === 'ueb' ? 'ueb' : 'erkl' });
      else if (e.v === 'task' && L.task(e.id) && out[out.length - 1].v === 'topic') out.push({ v: 'task', id: e.id });
    });
    return out;
  }
  const S = {
    tab: ['start', 'learn', 'apply'].includes(store.get('tab')) ? store.get('tab') : 'start',
    stack: sanitizeStack(store.get('stack', null)),
    scroll: {},
    hist: 0
  };
  let CUR = null; // aktuelle Aufgabe
  const OPEN = new Set(store.get('open', [])); // offene Rechenwege

  const topEntry = () => S.stack[S.stack.length - 1];
  const viewKey = () => S.tab === 'learn' ? topEntry().v + ':' + (topEntry().id || '') : S.tab;
  const persistNav = () => { store.set('tab', S.tab); store.set('stack', S.stack); };
  const saveScroll = () => { S.scroll[viewKey()] = window.scrollY; };

  function goTab(tab) {
    if (tab === S.tab) {
      if (tab === 'learn' && S.stack.length > 1) { S.stack = [S.stack[0]]; render('pop'); return; }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    saveScroll();
    S.tab = tab;
    render('fade');
  }
  function push(entry) {
    saveScroll();
    S.tab = 'learn';
    S.stack.push(entry);
    try { history.pushState({ tol: S.stack.length }, ''); S.hist++; } catch (e) { /* ohne Verlauf */ }
    render('push');
  }
  function popView() {
    if (S.stack.length < 2) return;
    if (S.tab !== 'learn') { S.stack.pop(); persistNav(); return; }
    saveScroll();
    S.stack.pop();
    render('pop');
  }
  function back() {
    if (S.hist > 0) { try { history.back(); return; } catch (e) { /* weiter unten */ } }
    popView();
  }
  window.addEventListener('popstate', () => {
    if (S.hist > 0) S.hist--;
    if (!$('#sheet').hidden) closeSheet();
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
    const key = viewKey();
    let html;
    CUR = null;
    if (S.tab === 'start') html = viewCover();
    else if (S.tab === 'apply') html = viewApply();
    else {
      const e = topEntry();
      html = e.v === 'learn' ? viewLearn() : e.v === 'topic' ? viewTopic(e) : viewTask(e);
    }
    view.innerHTML = html;
    view.className = anim ? 'enter-' + anim : '';
    if (S.tab === 'apply') { computeAll(); initSecDrag(); }
    if (CUR && CUR.st.checked) runCheck(false);
    renderTabbar();
    window.scrollTo(0, anim === 'push' ? 0 : (S.scroll[key] || 0));
    onScroll();
    persistNav();
  }
  view.addEventListener('animationend', () => { view.className = ''; });

  function renderTabbar() {
    const items = [['start', 'Start', I.home], ['learn', 'Lernen', I.book], ['apply', 'Anwenden', I.caliper]];
    $('#tabbar').innerHTML = items.map(([k, l, ic]) => `<button data-tab="${k}"${S.tab === k ? ' aria-current="page"' : ''}>${ic}<span>${l}</span></button>`).join('');
  }

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
        const rows = T.RANGES.map((r, i) => [T.rangeText(i).replace(' mm', ''), ...['d', 'e', 'f', 'g'].map(l => T.fmtS(T.SHAFT_UPPER[l][i])), '0', T.fmtS(T.SHAFT_K[i]), ...['m', 'n', 'p'].map(l => T.fmtS(T.SHAFT_LOWER[l][i]))]);
        const rsRows = T.RANGES.slice(0, 6).map((r, i) => [T.rangeText(i).replace(' mm', ''), T.fmtS(T.SHAFT_RS.r.main[i]), T.fmtS(T.SHAFT_RS.s.main[i])])
          .concat(T.SUBRANGES.map((r, i) => [T.subText(i).replace(' mm', ''), T.fmtS(T.SHAFT_RS.r.sub[i]), T.fmtS(T.SHAFT_RS.s.sub[i])]));
        const dRows = T.RANGES.map((r, i) => [T.rangeText(i).replace(' mm', ''), ...['3', '4', '5', '6', '7', '8'].map(g => f(T.delta(g, i)))]);
        return table(['Nennmaß in mm', 'd', 'e', 'f', 'g', 'h', 'k*', 'm', 'n', 'p'], rows, 'Wellen: d bis h oberes Abmaß, k bis p unteres Abmaß') +
          '<p class="tbl-note">* k: Der Wert gilt nur für IT4 bis IT7. Bei IT3 und feiner sowie ab IT8 ist das untere Abmaß 0.</p>' +
          table(['Nennmaß in mm', 'r', 's'], rsRows, 'Wellen r und s: unteres Abmaß, über 50 mm feiner unterteilt') +
          table(['Nennmaß in mm', 'IT3', 'IT4', 'IT5', 'IT6', 'IT7', 'IT8'], dRows, 'Zuschlag (Delta) für Bohrungen') +
          `<div class="tbl-note"><p><b>Bohrungen D bis H:</b> Das untere Abmaß ist das obere Abmaß der gleichnamigen Welle mit umgedrehtem Vorzeichen. Beispiel F bei 18 bis 30 mm: Welle f hat −20 µm, Bohrung F hat +20 µm.</p>
          <p><b>Bohrungen K, M, N bis IT8 sowie P, R, S bis IT7:</b> Das obere Abmaß ist das Grundabmaß der gleichnamigen Welle mit umgedrehtem Vorzeichen plus Zuschlag. Bei K nimmst du den Wert von k aus der Spalte IT4 bis IT7.</p>
          <p><b>Darüber:</b> K ab IT9 oben 0. M ab IT9 wie Welle m mit umgedrehtem Vorzeichen. N ab IT9 oben 0, bis 3 mm −4 µm. P, R, S ab IT8 ohne Zuschlag. Sonderfall M6 über 250 bis 315 mm: oben −9 µm.</p>
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
  // Deckblatt
  // ================================================================
  function viewCover() {
    const theme = store.get('theme', 'auto');
    const standalone = window.navigator.standalone || (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || window.top !== window;
    return `<div class="page cover">
      <header>
        <div class="cover-eyebrow">Zerspanung · CNC-Fräsen</div>
        <h1 class="cover-title">Toleranzen <span class="dimtol" aria-hidden="true"><span>+0,05</span><span>−0,05</span></span></h1>
        <p class="cover-lead">Lerne Allgemein-, Freimaß- und ISO-Toleranzen so, wie du sie an der Fräsmaschine brauchst, und rechne sie mit den fest hinterlegten Normtabellen direkt nach.</p>
      </header>
      <div class="tiles">
        <button class="tile tile-learn" data-tab="learn">
          <span class="tile-deco" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7.4"/><path d="M4.6 19.4 19.4 4.6"/></svg></span>
          <span class="tile-icon">${I.book}</span>
          <span><span class="tile-title">Lernen</span><span class="tile-sub">Erklärungen aus der Praxis und Aufgaben zum Selberrechnen</span></span>
        </button>
        <button class="tile tile-apply" data-tab="apply">
          <span class="tile-deco" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5.4"/><path d="M12 2.8v18.4M2.8 12h18.4"/></svg></span>
          <span class="tile-icon">${I.caliper}</span>
          <span><span class="tile-title">Anwenden</span><span class="tile-sub">Rechner für Winkel, Form und Lage, ISO-Toleranzen, Passungen und Maßketten</span></span>
        </button>
      </div>
      <div class="cover-foot">
        <div class="card">
          <span class="seg-label">Darstellung</span>
          ${segHTML('theme', theme, [['auto', 'Automatisch'], ['light', 'Hell'], ['dark', 'Dunkel']])}
          <p class="foot">Alle Tabellenwerte sind in der App gespeichert, sie funktioniert auch ohne Netz. Grundlage: ISO 286-1, ISO 2768-1 und -2, ISO 22081.${standalone ? '' : ' Tipp fürs iPhone: In Safari über Teilen und „Zum Home-Bildschirm“ startet die App wie eine echte App.'}</p>
        </div>
      </div>
    </div>`;
  }

  let themeSet = false;
  function applyTheme(t) {
    const r = document.documentElement;
    if (t === 'light' || t === 'dark') { r.setAttribute('data-theme', t); themeSet = true; }
    else if (themeSet) { r.removeAttribute('data-theme'); themeSet = false; }
  }

  // ================================================================
  // Lernen
  // ================================================================
  function viewLearn() {
    const solved = store.get('solved', {});
    return `${navbar({ title: 'Lernen' })}<div class="page">
      <h1 class="large-title">Lernen</h1>
      <p class="lead">Drei Themen mit Erklärung aus der Praxis, Fachbegriffen, Merksatz und vielen Aufgaben. Du rechnest selbst, die App prüft nur.</p>
      ${L.topics.map((tp, i) => {
        const n = tp.tasks.reduce((a, t) => a + (solved[t.id] || 0), 0);
        const types = tp.tasks.filter(t => solved[t.id]).length;
        return `<button class="topic-card" data-topic="${tp.id}">
          <span class="topic-icon t${i + 1}">${TOPIC_ICON[tp.icon]}</span>
          <span class="row-main"><span class="row-title">${esc(tp.title)}</span><span class="row-sub">${esc(tp.short)}</span>
          <span class="row-sub">${tp.tasks.length} Aufgabentypen${n ? ` · ${n} gelöst` : ''}</span>
          <span class="progress" aria-hidden="true"><i style="width:${Math.round(types / tp.tasks.length * 100)}%"></i></span></span>${I.chevR}</button>`;
      }).join('')}
      <p class="foot">Die Aufgaben bauen aufeinander auf. Jeden Aufgabentyp gibt es mit immer neuen Zahlen: „Neue Aufgabe“ würfelt eine neue Variante.</p>
    </div>`;
  }

  function figureHTML(id) {
    if (id === 'schriftfeld') {
      return `<section class="card figure">
        <div class="tblock" role="img" aria-label="Schriftfeld mit dem Eintrag Allgemeintoleranzen ISO 2768-mK">
          <div><span class="lab">Benennung</span>Spannhalter</div><div><span class="lab">Werkstoff</span>EN AW-6082</div>
          <div><span class="lab">Maßstab</span>1 : 1</div><div><span class="lab">Zeichnungsnummer</span>SH-104</div>
          <div class="wide"><span class="lab">Allgemeintoleranzen</span><strong>ISO 2768-<i class="tb-m">m</i><i class="tb-k">K</i></strong></div>
        </div>
        <div class="tb-legend">
          <div><b class="tb-m">m</b> Maße nach ISO 2768-1: Längen, Radien, Fasen und Winkel</div>
          <div><b class="tb-k">K</b> Form und Lage nach ISO 2768-2: Geradheit, Ebenheit, Rechtwinkligkeit, Symmetrie und Lauf</div>
        </div></section>`;
    }
    if (id === 'zahlenstrahl') {
      return `<section class="card figure"><svg viewBox="0 0 340 124" role="img" aria-label="Zahlenstrahl: Mindestmaß 119,7 mm, Nennmaß 120 mm, Höchstmaß 120,3 mm">
        <line class="z-grid" x1="14" x2="326" y1="66" y2="66"/>
        <rect class="z-hole" x="70" y="52" width="200" height="28" rx="6"/>
        <line class="z-zero" x1="170" x2="170" y1="44" y2="88"/>
        <text class="z-lbl" x="70" y="40" text-anchor="middle">Mindestmaß</text>
        <text class="z-lbl" x="170" y="32" text-anchor="middle">Nennmaß</text>
        <text class="z-lbl" x="270" y="40" text-anchor="middle">Höchstmaß</text>
        <text class="z-cap" x="120" y="70" text-anchor="middle">−0,3 mm</text>
        <text class="z-cap" x="220" y="70" text-anchor="middle">+0,3 mm</text>
        <text class="z-val" x="70" y="104" text-anchor="middle">119,7</text>
        <text class="z-val" x="170" y="104" text-anchor="middle">120</text>
        <text class="z-val" x="270" y="104" text-anchor="middle">120,3</text>
        <text class="z-cap" x="170" y="120" text-anchor="middle">Toleranz 0,6 mm</text>
      </svg><p class="fig-cap">Die Grundplatte mit 120 mm und ISO 2768-m: Jedes Istmaß in der markierten Zone ist in Ordnung.</p></section>`;
    }
    if (id === 'nulllinie') {
      const H = T.isoTol(8, 'H', '7'), M = T.isoTol(8, 'm', '6');
      return `<section class="card figure"><div class="zone-wrap">${zoneSVG([{ name: 'Ø8 H7', upper: H.upper, lower: H.lower, hole: true }, { name: 'Ø8 m6', upper: M.upper, lower: M.lower, hole: false }], 'Toleranzfelder Ø8 H7 und Ø8 m6 zur Nulllinie')}</div>
        <p class="fig-cap">Die Passbohrung Ø8 H7 beginnt an der Nulllinie und ist ${T.um(H.it)} µm breit. Ein Zylinderstift Ø8 m6 liegt ${T.um(M.lower)} µm über der Nulllinie, das ist sein Grundabmaß, und ist ${T.um(M.it)} µm breit. Die Felder überschneiden sich: Je nach Istmaß hat der Stift etwas Spiel oder sitzt stramm.</p></section>`;
    }
    return '';
  }

  function viewTopic(e) {
    const tp = L.topic(e.id);
    const seg = e.seg || 'erkl';
    return `${navbar({ title: tp.title, back: 'Lernen' })}<div class="page">
      <h1 class="large-title">${esc(tp.title)}</h1>
      ${segHTML('topicseg', seg, [['erkl', 'Erklärung'], ['ueb', 'Übungen']], 'big')}
      ${seg === 'erkl' ? topicExplain(tp) : topicTasks(tp)}
    </div>`;
  }

  function topicExplain(tp) {
    const extras = tp.extras.map(x => `<section class="card"><h2>${esc(x.t)}</h2>
      ${x.ul ? `<ul>${x.ul.map(li => `<li>${esc(li)}</li>`).join('')}</ul>` : ''}
      ${x.ol ? `<ol>${x.ol.map(li => `<li>${esc(li)}</li>`).join('')}</ol>` : ''}
      ${x.p ? x.p.map(p => `<p>${esc(p)}</p>`).join('') : ''}
      ${x.t.includes('22081') ? `<div class="tb-line">ISO 22081 ${fcf([SYM.profil, '0,4', 'A', 'B', 'C'])}</div>` : ''}
    </section>`).join('');
    return `<section class="card praxis"><div class="card-eyebrow">${I.mill} Aus der Praxis</div>${tp.praxis.map(p => `<p>${esc(p)}</p>`).join('')}</section>
      ${figureHTML(tp.figure)}
      <section class="card"><div class="card-eyebrow">${I.list} Fachbegriffe</div><dl class="terms">${tp.begriffe.map(([t, d]) => `<div><dt>${esc(t)}</dt><dd>${esc(d)}</dd></div>`).join('')}</dl></section>
      <section class="card merk"><div class="card-eyebrow">${I.bulb} Merksatz</div><p class="merk-text">${esc(tp.merksatz)}</p></section>
      ${extras}
      <details class="tables"><summary><span>Tabellen zum Nachschlagen</span>${I.chevR}</summary><div class="tables-body">${tp.tables.map(tableSection).join('')}</div></details>
      <button class="btn primary" data-act="to-ueb">Zu den Übungen</button>`;
  }

  function topicTasks(tp) {
    const solved = store.get('solved', {});
    return `<p class="muted small">Die Aufgaben werden von oben nach unten anspruchsvoller. Du rechnest selbst und trägst jeden Schritt ein. „Prüfen“ zeigt dir, an welcher Stelle etwas nicht stimmt. Den Lösungsweg siehst du nur, wenn du ihn ausdrücklich öffnest.</p>
      <div class="list">${tp.tasks.map((t, i) => `<button class="list-row" data-task="${t.id}">
        <span class="row-num${solved[t.id] ? ' done' : ''}">${i + 1}</span>
        <span class="row-main"><span class="row-title">${esc(t.title)}</span><span class="row-sub">${esc(t.desc)}</span></span>
        ${solved[t.id] ? `<span class="row-badge">${solved[t.id]}× gelöst</span>` : ''}${I.chevR}</button>`).join('')}</div>
      <button class="btn soft" data-act="open-tables" data-tables="${tp.tables.join(',')}">${I.table} Tabellen öffnen</button>`;
  }

  // ---------- Aufgaben ----------
  function taskState(id) {
    let st = store.get('task.' + id, null);
    if (!st || typeof st.seed !== 'number' || typeof st.vals !== 'object') {
      st = { seed: L.newSeed(), vals: {}, checked: false, sol: false };
      store.set('task.' + id, st);
    }
    return st;
  }
  const saveTask = () => { if (CUR) store.set('task.' + CUR.id, CUR.st); };

  function viewTask(e) {
    const task = L.task(e.id);
    const tp = L.topics.find(t => t.tasks.includes(task));
    const st = taskState(e.id);
    const inst = task.make(L.rng(st.seed));
    CUR = { id: e.id, task, tp, st, inst };
    const idx = tp.tasks.indexOf(task) + 1;
    const anySigned = inst.steps.some(s => s.signed);
    return `${navbar({ title: task.title, back: tp.title, right: `<button class="nav-btn icon" data-act="open-tables" data-tables="${tp.tables.join(',')}" aria-label="Tabellen öffnen">${I.table}</button>` })}
    <div class="page">
      <div class="task-head"><div class="eyebrow">${esc(tp.title)} · Aufgabentyp ${idx} von ${tp.tasks.length}</div><h1 class="task-title">${esc(task.title)}</h1></div>
      <section class="card prompt">${inst.prompt}</section>
      <div id="banner"></div>
      <ol class="steps">${inst.steps.map((s, i) => stepHTML(s, i, st.vals[s.id])).join('')}</ol>
      ${anySigned ? '<p class="foot">Vorzeichen: Tippe auf das Plus- oder Minuszeichen links im Feld, um es zu wechseln.</p>' : ''}
      <div class="task-actions">
        <button class="btn primary" data-act="check">Prüfen</button>
        <div class="btn-row"><button class="btn plain" data-act="solution">${st.sol ? 'Lösungsweg ausblenden' : 'Lösungsweg zeigen'}</button><button class="btn plain" data-act="newtask">Neue Aufgabe</button></div>
      </div>
      <section class="card solution" id="solution"${st.sol ? '' : ' hidden'}>
        <div class="card-eyebrow">${I.bulb} Lösungsweg</div>
        <ol class="calc-steps">${inst.solution.map(s => `<li><div class="cs-t">${esc(s.t)}</div><div class="cs-h">${s.h}</div></li>`).join('')}</ol>
      </section>
    </div>`;
  }

  function stepHTML(s, i, raw) {
    const id = 'st-' + s.id;
    let input;
    if (s.kind === 'num') {
      input = numInput({ id, attrs: `data-step="${s.id}"`, raw, unit: s.unit, signed: s.signed, pm: s.pm });
    } else if (s.kind === 'angle') {
      const [d = '', m = ''] = String(raw || '').split('|');
      input = `<div class="angle-inp">
        <div class="inp"><input id="${id}" data-step="${s.id}" inputmode="decimal" enterkeyhint="next" autocomplete="off" value="${esc(d)}" aria-label="${esc(s.q)}, Grad"><span class="unit">Grad</span></div>
        <div class="inp"><input id="${id}-m" data-step="${s.id}" inputmode="decimal" enterkeyhint="next" autocomplete="off" value="${esc(m)}" aria-label="${esc(s.q)}, Minuten"><span class="unit">Minuten</span></div></div>`;
    } else {
      const o = s.options;
      if (o.length <= 3 && o.every(x => x.l.length <= 15)) {
        input = `<div class="seg big" data-step="${s.id}" role="radiogroup" aria-label="${esc(s.q)}">${o.map(x => `<button type="button" data-v="${esc(x.v)}" aria-pressed="${raw === x.v}">${esc(x.l)}</button>`).join('')}</div>`;
      } else if (o.length <= 5) {
        input = `<div class="opt-list" data-step="${s.id}" role="radiogroup" aria-label="${esc(s.q)}">${o.map(x => `<button type="button" class="opt" role="radio" data-v="${esc(x.v)}" aria-checked="${raw === x.v}"><span class="radio"></span><span>${esc(x.l)}</span></button>`).join('')}</div>`;
      } else {
        input = `<div class="inp sel"><select id="${id}" data-step="${s.id}" aria-label="${esc(s.q)}"><option value="">Bitte wählen</option>${o.map(x => `<option value="${esc(x.v)}"${raw === x.v ? ' selected' : ''}>${esc(x.l)}</option>`).join('')}</select></div>`;
      }
    }
    return `<li class="step" id="step-${s.id}"><div class="step-q"><span class="step-no">${i + 1}</span><label for="${id}">${esc(s.q)}</label><span class="step-state"></span></div>${input}<div class="step-msg" hidden></div></li>`;
  }

  function clearStep(sid) {
    const li = $('#step-' + sid);
    if (!li) return;
    li.classList.remove('ok', 'wrong', 'follow', 'empty');
    $('.step-state', li).innerHTML = '';
    $('.step-msg', li).hidden = true;
    const b = $('#banner');
    if (b) b.innerHTML = '';
  }

  function runCheck(scroll = true) {
    if (!CUR) return;
    const { inst, st } = CUR;
    const res = L.checkAll(inst.steps, st.vals);
    let firstBad = null, firstEmpty = null, allOk = true, anyFollow = false;
    inst.steps.forEach((s, i) => {
      const r = res[s.id], li = $('#step-' + s.id);
      li.classList.remove('ok', 'wrong', 'follow', 'empty');
      li.classList.add(r.state);
      $('.step-state', li).innerHTML = r.state === 'ok' ? I.okc : r.state === 'wrong' ? I.xc : r.state === 'follow' ? I.fc : '';
      const m = $('.step-msg', li);
      m.textContent = r.msg || '';
      m.hidden = !r.msg;
      if (r.state !== 'ok') allOk = false;
      if (r.state === 'follow') anyFollow = true;
      if (r.state === 'wrong' && !firstBad) firstBad = { s, i };
      if (r.state === 'empty' && !firstEmpty) firstEmpty = { s, i };
    });
    let html;
    if (allOk) {
      html = `<div class="banner ok">${I.okc}<div><b>Alles richtig.</b>Jeder Schritt stimmt. Mit „Neue Aufgabe“ bekommst du neue Zahlen.</div></div>`;
      if (st.counted !== st.seed) {
        const sv = store.get('solved', {});
        sv[CUR.id] = (sv[CUR.id] || 0) + 1;
        store.set('solved', sv);
        st.counted = st.seed;
      }
    } else if (firstBad) {
      html = `<div class="banner bad">${I.xc}<div><b>In Schritt ${firstBad.i + 1} ist es schiefgegangen.</b>Rot markierte Schritte stimmen nicht${anyFollow ? ', orange markierte sind Folgefehler und stimmen mit deinen eigenen Zwischenwerten' : ''}. Korrigiere und prüfe noch einmal.</div></div>`;
    } else if (firstEmpty) {
      html = `<div class="banner ok">${I.okc}<div><b>Bis hierhin stimmt alles.</b>In Schritt ${firstEmpty.i + 1} fehlt noch deine Eingabe.</div></div>`;
    }
    $('#banner').innerHTML = html || '';
    st.checked = true;
    saveTask();
    if (scroll) {
      const target = firstBad ? $('#step-' + firstBad.s.id) : firstEmpty ? $('#step-' + firstEmpty.s.id) : $('#banner');
      if (target) target.scrollIntoView({ behavior: 'smooth', block: firstBad || firstEmpty ? 'center' : 'start' });
    }
  }

  function readStepInput(el) {
    const sid = el.dataset.step;
    const s = CUR.inst.steps.find(x => x.id === sid);
    if (!s) return;
    if (s.kind === 'num') {
      if (s.signed) normalizeSigned(el);
      CUR.st.vals[sid] = s.signed ? signedValue(el) : el.value;
    } else if (s.kind === 'angle') {
      CUR.st.vals[sid] = $('#st-' + sid).value + '|' + $('#st-' + sid + '-m').value;
    } else {
      CUR.st.vals[sid] = el.value;
    }
    CUR.st.checked = false;
    saveTask();
    clearStep(sid);
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
    chain: { rows: [{ op: 1, N: '10', mode: 'pm', pm: '0,2', up: '', lo: '', iso: '' }, { op: 1, N: '5', mode: 'pm', pm: '0,3', up: '', lo: '', iso: '' }] }
  };
  const A = (() => {
    const sec = (store.get('apply', {}) || {}).sec;
    const saved = store.get('apply', {}) || {};
    const out = {};
    Object.keys(A_DEF).forEach(k => { out[k] = Object.assign({}, A_DEF[k], saved[k] && typeof saved[k] === 'object' ? saved[k] : {}); });
    if (!Array.isArray(out.foto.items)) out.foto.items = [];
    if (!Array.isArray(out.chain.rows) || !out.chain.rows.length) out.chain.rows = A_DEF.chain.rows.map(r => Object.assign({}, r));
    out.sec = typeof sec === 'string' ? sec : 'gen';
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

  // Reihenfolge nach Wichtigkeit: oberster Eintrag steht in der Auswahl vorne
  const SECTIONS = [
    { id: 'gen', label: 'Allgemeintoleranz', title: 'Allgemeintoleranzen', card: () => cardGen() },
    { id: 'ang', label: 'Winkel', title: 'Winkeltoleranz', tag: 'ISO 2768-1', card: () => cardAngle() },
    { id: 'geo', label: 'Form und Lage', title: 'Form und Lage', tag: 'ISO 2768-2', card: () => cardGeo() },
    { id: 'iso', label: 'ISO-Toleranz', title: 'Einzeltoleranz', tag: 'ISO 286', card: () => cardIso() },
    { id: 'fit', label: 'Passung', title: 'Passung', card: () => cardFit() },
    { id: 'chain', label: 'Maßkette', title: 'Maßkette', tag: 'arithmetisch, Worst Case', card: () => cardChain() },
    { id: 'foto', label: 'Foto', title: 'Zeichnung fotografieren', card: () => cardFoto() }
  ];
  function orderedSections() {
    const list = (A.order || []).map(id => SECTIONS.find(x => x.id === id)).filter(Boolean);
    SECTIONS.forEach(x => { if (!list.includes(x)) list.push(x); });
    return list;
  }
  const curSection = () => SECTIONS.find(x => x.id === A.sec) || orderedSections()[0];

  function sectionHTML() {
    const sec = curSection();
    return `<h2 class="section-h">${sec.title}${sec.tag ? ` <span class="tag">${sec.tag}</span>` : ''}</h2>${sec.card()}`;
  }
  function viewApply() {
    const sec = curSection();
    return `${navbar({ title: 'Anwenden' })}<div class="page">
      <h1 class="large-title">Anwenden</h1>
      <nav class="sec-bar" id="sec-bar" aria-label="Rechner auswählen">${orderedSections().map(x => `<button type="button" data-sec="${x.id}" aria-pressed="${x.id === sec.id}">${x.label}</button>`).join('')}</nav>
      <div id="sec-body" class="page">${sectionHTML()}</div>
      <p class="foot">Zum Wechseln seitlich über den Bildschirm wischen. Reihenfolge ändern: Reiter oben gedrückt halten und verschieben.</p>
    </div>`;
  }
  function showSection(id, dir = 0) {
    A.sec = id; saveA();
    $$('#sec-bar button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.sec === id)));
    const body = $('#sec-body');
    body.innerHTML = sectionHTML();
    const anim = dir > 0 ? 'enter-push' : dir < 0 ? 'enter-pop' : 'enter-fade';
    body.classList.remove('enter-fade', 'enter-push', 'enter-pop'); void body.offsetWidth; body.classList.add(anim);
    computeAll();
    const bar = $('#sec-bar'), nav = $('#nav');
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
      A.order = $$('button', bar).map(b => b.dataset.sec);
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
    const skip = el => el.closest('.sec-bar, .tbl-wrap, .zone-wrap, input, select, textarea, .sheet-wrap');
    view.addEventListener('touchstart', e => {
      st = null;
      if (S.tab !== 'apply' || e.touches.length > 1 || skip(e.target)) return;
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
        <span class="hint-line">Nennmaß 1 bis 500 mm. Großbuchstabe heißt Bohrung, Kleinbuchstabe heißt Welle.</span></div>
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
  const FOTO = { url: null, busy: false, status: '', pct: 0, error: '', open: -1, log: null, editIdx: -1 };
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

  function renderFotoStage() {
    const el = $('#foto-stage');
    if (!el) return;
    let html = '';
    if (FOTO.url) {
      const boxes = A.foto.items.map((it, i) => it.box ? `<button type="button" class="foto-box${FOTO.open === i ? ' on' : ''}" data-act="foto-open" data-i="${i}" aria-label="${esc(it.label)}" style="left:${(it.box.x * 100).toFixed(2)}%;top:${(it.box.y * 100).toFixed(2)}%;width:${(it.box.w * 100).toFixed(2)}%;height:${(it.box.h * 100).toFixed(2)}%"></button>` : '').join('');
      html += `<div class="foto-wrap"><img src="${FOTO.url}" alt="Foto der Zeichnung"><div class="foto-boxes">${boxes}</div></div>`;
    }
    if (FOTO.busy) html += `<div class="ocr-progress"><div class="bar"><i style="width:${Math.round(FOTO.pct * 100)}%"></i></div><span>${esc(FOTO.status)}</span></div>`;
    if (FOTO.error) html += msgHTML(esc(FOTO.error), 'warn');
    el.innerHTML = html;
  }

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
      await OCRW.setParameters({ tessedit_pageseg_mode: '11', preserve_interword_spaces: '1' });
    }
    return OCRW;
  }
  function loadImage(file) {
    return new Promise((res, rej) => { const img = new Image(); img.onload = () => res(img); img.onerror = () => rej(new Error('bild')); img.src = URL.createObjectURL(file); });
  }
  // Graustufen, Kontrast strecken, bei rot = 90 im Uhrzeigersinn gedreht (für senkrechte Maße)
  function prepCanvas(img, rot) {
    const w = img.naturalWidth, h = img.naturalHeight, long = Math.max(w, h);
    const sc = long > 2400 ? 2400 / long : long < 1400 ? 1400 / long : 1;
    const W = Math.round(w * sc), H = Math.round(h * sc);
    const c = document.createElement('canvas');
    c.width = rot ? H : W; c.height = rot ? W : H;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    if (rot) { ctx.translate(H, 0); ctx.rotate(Math.PI / 2); }
    ctx.drawImage(img, 0, 0, W, H);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const d = ctx.getImageData(0, 0, c.width, c.height), px = d.data, hist = new Uint32Array(256);
    for (let i = 0; i < px.length; i += 4) { const g = (px[i] * 299 + px[i + 1] * 587 + px[i + 2] * 114) / 1000 | 0; px[i] = g; hist[g]++; }
    const n = px.length / 4;
    let lo = 0, hi = 255, acc = 0;
    for (let i = 0; i < 256; i++) { acc += hist[i]; if (acc > n * 0.02) { lo = i; break; } }
    acc = 0;
    for (let i = 255; i >= 0; i--) { acc += hist[i]; if (acc > n * 0.02) { hi = i; break; } }
    const span = Math.max(1, hi - lo);
    for (let i = 0; i < px.length; i += 4) { const v = Math.max(0, Math.min(255, (px[i] - lo) * 255 / span)); px[i] = px[i + 1] = px[i + 2] = v; }
    ctx.putImageData(d, 0, 0);
    return { canvas: c, W, H };
  }
  function linesFrom(data, rot, W, H) {
    const out = [];
    (data.blocks || []).forEach(b => (b.paragraphs || []).forEach(p => (p.lines || []).forEach(l => {
      const bb = l.bbox;
      const x0 = rot ? bb.y0 : bb.x0, x1 = rot ? bb.y1 : bb.x1, y0 = rot ? H - bb.x1 : bb.y0, y1 = rot ? H - bb.x0 : bb.y1;
      out.push({ text: l.text, conf: l.confidence, minPlainConf: rot ? 70 : 50, box: { x: x0 / W, y: y0 / H, w: (x1 - x0) / W, h: (y1 - y0) / H } });
    })));
    return out;
  }
  async function handleFoto(file) {
    if (FOTO.busy) return;
    FOTO.busy = true; FOTO.error = ''; FOTO.pct = 0; FOTO.open = -1;
    FOTO.status = 'Foto wird vorbereitet …';
    if (FOTO.url) URL.revokeObjectURL(FOTO.url);
    A.foto.items = []; A.foto.detected = null; saveA();
    computeFoto();
    try {
      const img = await loadImage(file);
      FOTO.url = img.src;
      computeFoto();
      let pass = 1;
      FOTO.log = m => {
        if (m.status === 'recognizing text') { FOTO.status = `Maße werden gesucht, Durchgang ${pass} von 2 (${pass === 1 ? 'waagrechte' : 'senkrechte'} Schrift) …`; FOTO.pct = (pass - 1 + (m.progress || 0)) / 2; }
        else { FOTO.status = 'Texterkennung wird geladen …' + (OCRW ? '' : ' Beim ersten Mal braucht das etwas Zeit und Internet.'); }
        renderFotoStage();
      };
      const worker = await getOcr();
      const a = prepCanvas(img, false);
      const r0 = await worker.recognize(a.canvas, {}, { blocks: true, text: true });
      pass = 2;
      const b = prepCanvas(img, true);
      const r1 = await worker.recognize(b.canvas, {}, { blocks: true, text: true });
      const lines = linesFrom(r0.data, false, a.W, a.H).concat(linesFrom(r1.data, true, a.W, a.H));
      FOTO.lines = lines;
      const parsed = T.parseDrawing(lines);
      A.foto.items = parsed.items;
      if (parsed.general) { A.foto.detected = parsed.general; A.foto.ml = parsed.general.ml; if (parsed.general.hk) A.foto.hk = parsed.general.hk; }
      saveA();
      if (!parsed.items.length) FOTO.error = 'Im Foto habe ich keine Maße gefunden. Fotografiere möglichst gerade von oben, mit gutem Licht und so nah, dass die Zahlen gut lesbar sind. Oder füge die Maße unten von Hand ein.';
      if (parsed.iso22081) FOTO.error = (FOTO.error ? FOTO.error + ' ' : '') + 'Auf der Zeichnung steht ISO 22081. Die Maße ohne Toleranz werden dort über die Profiltoleranz geregelt, nicht über ISO 2768. Nutze dafür den Rechner „Allgemeintoleranz“, Neue Tabelle.';
    } catch (e) {
      FOTO.error = window.top !== window ? 'Im Vorschau-Link funktioniert die Texterkennung nicht. Nutze die App vom Home-Bildschirm oder die Adresse auf github.io. Maße kannst du hier trotzdem von Hand eintragen.' : 'Die Texterkennung hat nicht geklappt. Beim ersten Mal braucht die App Internet, um sie zu laden (etwa 7 MB). Versuch es noch einmal oder füge die Maße unten von Hand ein.';
    }
    FOTO.busy = false; FOTO.log = null;
    if (S.tab === 'apply' && A.sec === 'foto') {
      const seg = $('#card-foto [data-k="foto.ml"]');
      if (seg) $$('button', seg).forEach(x => x.setAttribute('aria-pressed', String(x.dataset.v === A.foto.ml)));
      computeFoto();
    }
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
  function computeAll() { computeAng(); computeGeo(); computeIso(); computeFit(); computeGen(); computeChain(); computeFoto(); }
  function onApplyChange(k) {
    const sec = k.split('.')[0];
    if (k === 'geo.prop') $('#geo-inputs').innerHTML = geoInputs();
    if (k === 'gen.tab' || k === 'gen.mode') $('#sec-body').innerHTML = sectionHTML();
    ({ ang: computeAng, geo: computeGeo, iso: computeIso, fit: computeFit, gen: computeGen, foto: computeFoto })[sec]();
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
    'to-ueb': () => { topEntry().seg = 'ueb'; render('fade'); window.scrollTo(0, 0); },
    'open-tables': t => openSheet(t.dataset.tables.split(',').filter(Boolean)),
    'close-sheet': () => closeSheet(),
    check: () => runCheck(true),
    solution: t => {
      CUR.st.sol = !CUR.st.sol;
      saveTask();
      const s = $('#solution');
      s.hidden = !CUR.st.sol;
      t.textContent = CUR.st.sol ? 'Lösungsweg ausblenden' : 'Lösungsweg zeigen';
      if (CUR.st.sol) s.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    newtask: () => {
      store.set('task.' + CUR.id, { seed: L.newSeed(), vals: {}, checked: false, sol: false });
      render('fade');
      window.scrollTo(0, 0);
    },
    'fit-equiv': t => { setK('fit.hole', t.dataset.h); setK('fit.shaft', t.dataset.s); $('#p-h').value = t.dataset.h; $('#p-s').value = t.dataset.s; onApplyChange('fit.hole'); },
    'iso-from': t => { setK('iso.q', t.dataset.v); showSection('iso'); },
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
    'foto-calc': t => { const sec = evalDim(A.foto.items[+t.dataset.i]).calc(); saveA(); showSection(sec, 0); },
    'chain-del': t => { A.chain.rows.splice(+t.dataset.i, 1); saveA(); renderChainRows(); computeChain(); },
    'chain-example': () => {
      A.chain.rows = [{ op: 1, N: '40', mode: 'pm', pm: '0,1', up: '', lo: '', iso: '' }, { op: -1, N: '12', mode: 'ul', pm: '', up: '0,1', lo: '0', iso: '' }];
      saveA(); renderChainRows(); computeChain();
      out('res-chain', msgHTML('Beispiel: Ein Absatz ist 40 ±0,1 mm hoch. Von oben ist eine Nut 12 mm tief gefräst, mit +0,1 und 0. Gesucht ist die Restdicke unter der Nut.') + $('#res-chain').innerHTML);
    }
  };

  document.addEventListener('click', e => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.dataset.sec) { if (Date.now() > secClickBlock) showSection(t.dataset.sec); return; }
    if (t.dataset.tab) return goTab(t.dataset.tab);
    if (t.dataset.topic) return push({ v: 'topic', id: t.dataset.topic, seg: 'erkl' });
    if (t.dataset.task) return push({ v: 'task', id: t.dataset.task });
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
      if (k === 'topicseg') { topEntry().seg = v; persistNav(); render('fade'); return; }
      setK(k, v);
      onApplyChange(k);
    } else if (group.dataset.step) {
      setPressed(group, t);
      CUR.st.vals[group.dataset.step] = v;
      CUR.st.checked = false;
      saveTask();
      clearStep(group.dataset.step);
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
    } else if (el.dataset.step && CUR) {
      readStepInput(el);
    } else if (el.dataset.chain != null) {
      const row = A.chain.rows[+el.dataset.chain];
      if (!row) return;
      if (el.parentElement.querySelector('.sign')) { normalizeSigned(el); row[el.dataset.f] = signedValue(el); } else row[el.dataset.f] = el.value;
      saveA(); computeChain();
    }
  }
  document.addEventListener('input', onInput);
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
    const scope = e.target.closest('.steps, .card') || document;
    const inputs = $$('input', scope);
    const i = inputs.indexOf(e.target);
    if (i >= 0 && i < inputs.length - 1) inputs[i + 1].focus();
    else e.target.blur();
  });

  // Tastatur offen: Tab-Leiste ausblenden (nur auf Touch-Geräten)
  const coarse = window.matchMedia && matchMedia('(pointer: coarse)').matches;
  if (coarse) {
    document.addEventListener('focusin', e => { if (e.target.matches('input, select')) document.body.classList.add('kb'); });
    document.addEventListener('focusout', () => setTimeout(() => {
      const a = document.activeElement;
      if (!a || !a.matches || !a.matches('input, select')) document.body.classList.remove('kb');
    }, 80));
  }

  // Als App vom Home-Bildschirm: vom linken Rand wischen geht zurück
  const standalone = window.navigator.standalone || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);
  if (standalone) {
    let sx = null, sy = 0, dx = 0;
    addEventListener('touchstart', e => {
      if (S.tab !== 'learn' || S.stack.length < 2 || !$('#sheet').hidden) return;
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
