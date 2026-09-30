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
    dia: svg('<circle cx="12" cy="12" r="7.4"/><path d="M4.6 19.4 19.4 4.6"/>')
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
    if (S.tab === 'apply') computeAll();
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
    fit: { q: '30H7/g6', sys: 'EB' },
    gen: { tab: 'alt', N: '120', kind: 'len', cls: 'm', hk: 'K', mode: 'profil', pN: '50', t: '0,4', rel: 'bezug', sN: '20', sdev: '0,1' },
    chain: { rows: [{ op: 1, N: '10', mode: 'pm', pm: '0,2', up: '', lo: '', iso: '' }, { op: 1, N: '5', mode: 'pm', pm: '0,3', up: '', lo: '', iso: '' }] }
  };
  const A = (() => {
    const saved = store.get('apply', {}) || {};
    const out = {};
    Object.keys(A_DEF).forEach(k => { out[k] = Object.assign({}, A_DEF[k], saved[k] && typeof saved[k] === 'object' ? saved[k] : {}); });
    if (!Array.isArray(out.chain.rows) || !out.chain.rows.length) out.chain.rows = A_DEF.chain.rows.map(r => Object.assign({}, r));
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

  function viewApply() {
    const secs = [['sec-wfl', 'Winkel, Form, Lage'], ['sec-iso', 'ISO-Toleranz'], ['sec-fit', 'Passung'], ['sec-gen', 'Allgemeintoleranz'], ['sec-chain', 'Maßkette']];
    return `${navbar({ title: 'Anwenden' })}<div class="page">
      <h1 class="large-title">Anwenden</h1>
      <p class="lead">Werte eingeben, Ergebnis sofort ablesen. Unter jedem Ergebnis steht der Rechenweg zum Aufklappen.</p>
      <nav class="jump" aria-label="Abschnitte">${secs.map(([id, l]) => `<a href="#${id}" data-jump="${id}">${l}</a>`).join('')}</nav>

      <h2 class="section-h" id="sec-wfl">Winkel, Form und Lage</h2>
      ${cardAngle()}
      ${cardGeo()}
      <h2 class="section-h" id="sec-iso">Einzeltoleranz <span class="tag">ISO 286</span></h2>
      ${cardIso()}
      <h2 class="section-h" id="sec-fit">Passung</h2>
      ${cardFit()}
      <h2 class="section-h" id="sec-gen">Allgemeintoleranzen</h2>
      ${cardGen()}
      <h2 class="section-h" id="sec-chain">Maßkette <span class="tag">arithmetisch, Worst Case</span></h2>
      ${cardChain()}
    </div>`;
  }
  const cardHead = (title, tables) => `<div class="iso-head"><h3 class="card-title">${title}</h3>${tables ? tblBtn(tables) : ''}</div>`;

  // a) Winkel
  function cardAngle() {
    return `<section class="card" id="card-ang">
      ${cardHead('Winkeltoleranz', '2768-1')}
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
      ${cardHead('Form- und Lagetoleranz', '2768-2,2768-1')}
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
    const sub = p === 'position' ? `je Abstandsmaß nach ISO 2768-1 · Klasse ${A.geo.ml}` : `${info.name} · ${info.art} · Klasse ${A.geo.hk}`;
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
  const ISO_EX = ['10H8', '30k5', '25g6', '40JS7', '60P7', '8H7', '120f7', '50s6', '300M6', '20N9'];
  function cardIso() {
    return `<section class="card" id="card-iso">
      ${cardHead('ISO-Toleranz berechnen', 'it,grund')}
      <div class="field"><label for="i-q">Angabe</label><div class="inp big"><input id="i-q" data-k="iso.q" value="${esc(A.iso.q)}" placeholder="z. B. 10H8" autocapitalize="off" autocorrect="off" spellcheck="false" autocomplete="off" enterkeyhint="done"></div>
        <span class="hint-line">Nennmaß 1 bis 500 mm. Großbuchstabe heißt Bohrung, Kleinbuchstabe heißt Welle.</span></div>
      <div class="chips">${ISO_EX.map(c => `<button type="button" class="chip" data-chip="iso.q" data-v="${c}">${c}</button>`).join('')}</div>
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
  const FIT_EX = { EB: ['H7/g6', 'H7/h6', 'H7/k6', 'H7/n6', 'H7/p6', 'H7/s6', 'H8/f7', 'H11/d9'], EW: ['G7/h6', 'F8/h7', 'JS7/h6', 'K7/h6', 'N7/h6', 'P7/h6', 'S7/h6', 'D10/h9'] };
  function fitChips() {
    const m = /\d+(?:[.,]\d+)?/.exec(A.fit.q || '');
    const N = m ? m[0] : '30';
    return FIT_EX[A.fit.sys].map(c => `<button type="button" class="chip" data-chip="fit.q" data-v="${N}${c}">${c}</button>`).join('');
  }
  function cardFit() {
    return `<section class="card" id="card-fit">
      ${cardHead('Passung berechnen', 'it,grund')}
      ${segHTML('fit.sys', A.fit.sys, [['EB', 'Einheitsbohrung'], ['EW', 'Einheitswelle']], 'big')}
      <div class="field"><label for="p-q">Passung</label><div class="inp big"><input id="p-q" data-k="fit.q" value="${esc(A.fit.q)}" placeholder="z. B. 30H7/g6" autocapitalize="off" autocorrect="off" spellcheck="false" autocomplete="off" enterkeyhint="done"></div>
        <span class="hint-line">Nennmaß, Bohrung und Welle, zum Beispiel 30H7/g6.</span></div>
      <div class="chips" id="fit-chips">${fitChips()}</div>
      <div class="result" id="res-fit" aria-live="polite"></div>
    </section>`;
  }
  function computeFit() {
    if (!A.fit.q.trim()) return out('res-fit', msgHTML('Gib eine Passung ein, zum Beispiel 30H7/g6.'));
    const r = T.fitFromString(A.fit.q);
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
    const eq = r.equiv ? `${f(N)}${r.equiv.hole.letter}${r.equiv.hole.grade}/${r.equiv.shaft.letter}${r.equiv.shaft.grade}` : '';
    if (A.fit.sys === 'EB' && r.system === 'EW') sysMsg = msgHTML(`Diese Passung gehört zum System Einheitswelle, denn die Welle hat h. Gleichwertig im System Einheitsbohrung ist <b>${esc(eq)}</b>.<button class="btn soft" data-act="fit-equiv" data-v="${esc(eq)}">${esc(eq)} übernehmen</button>`, 'warn');
    else if (A.fit.sys === 'EW' && r.system === 'EB') sysMsg = msgHTML(`Diese Passung gehört zum System Einheitsbohrung, denn die Bohrung hat H. Gleichwertig im System Einheitswelle ist <b>${esc(eq)}</b>.<button class="btn soft" data-act="fit-equiv" data-v="${esc(eq)}">${esc(eq)} übernehmen</button>`, 'warn');
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
    </section>`;
  }
  function genBody() {
    if (A.gen.tab === 'alt') {
      return `${cardHead('ISO 2768-1 und -2', '2768-1,2768-2')}
        <div class="fields">
          <div class="field"><label for="d-N">Maß</label>${bindNum('d-N', 'gen.N', 'mm', 'z. B. 120')}</div>
          <div class="field"><span class="lbl">Art des Maßes</span>${segHTML('gen.kind', A.gen.kind, [['len', 'Länge'], ['rad', 'Radius, Fase']], 'big')}</div>
          <div class="field full"><span class="lbl">Toleranzklasse für Maße</span>${segHTML('gen.cls', A.gen.cls, CLS_ML, 'tall')}</div>
          <div class="field full"><span class="lbl">Klasse für Form und Lage</span>${segHTML('gen.hk', A.gen.hk, CLS_HKL, 'tall')}</div>
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
  function computeGen() {
    if (A.gen.tab === 'alt') {
      if (!String(A.gen.N).trim()) return out('res-gen', msgHTML('Gib ein Maß ein.'));
      const N = numOf(A.gen.N);
      const r = T.lin2768(N, A.gen.cls, A.gen.kind);
      if (!r.ok) return out('res-gen', msgHTML(esc(r.error), 'warn'));
      const F = x => f(x, r.dec, 4);
      let geo = '';
      if (A.gen.kind === 'len') {
        const hk = A.gen.hk;
        const si = T.strIdx(N), pi = T.perpIdx(N);
        const g = i => i < 0 ? '–' : null;
        geo = `<div class="eyebrow">Form und Lage bei ${f(N)} mm · ISO 2768-2 Klasse ${hk}</div>
          <div class="kv">
            ${kv('Geradheit, Ebenheit', g(si) || f(T.STRAIGHT2768[hk][si]) + ' mm')}
            ${kv('Rechtwinkligkeit', g(pi) || f(T.PERP2768[hk][pi]) + ' mm')}
            ${kv('Symmetrie', g(pi) || f(T.SYM2768[hk][pi]) + ' mm')}
            ${kv('Lauf', f(T.RUN2768[hk]) + ' mm')}
          </div>
          <p class="foot">Gilt, wenn ${f(N)} mm die maßgebende Länge ist: bei Ebenheit die längere Seite, bei Rechtwinkligkeit und Symmetrie das kürzere Element. Mehr dazu oben bei Form und Lage.</p>`;
      }
      return out('res-gen', `<div class="res-hero"><div class="res-big">±${f(r.dev)} mm</div><div class="res-sub">Grenzabmaß · ${A.gen.kind === 'rad' ? 'Radius oder Fase' : 'Längenmaß'} · Klasse ${A.gen.cls} (${T.CLASS_ML[A.gen.cls]})</div></div>
        <div class="kv">${kv('Höchstmaß', F(r.max) + ' mm')}${kv('Mindestmaß', F(r.min) + ' mm')}${kv('Toleranz', F(r.tol) + ' mm')}${kv('Nennmaßbereich', esc(r.rangeText))}</div>
        ${geo}
        ${calcHTML('gen-alt', r.steps)}`);
    }
    if (A.gen.mode === 'profil') {
      if (!String(A.gen.pN).trim() || !String(A.gen.t).trim()) return out('res-gen', msgHTML('Gib Nennmaß und Profiltoleranz ein.'));
      const t = numOf(A.gen.t);
      const r = T.profile22081(numOf(A.gen.pN), t, A.gen.rel);
      if (!r.ok) return out('res-gen', msgHTML(esc(r.error), 'warn'));
      const F = x => f(x, r.dec, 4);
      return out('res-gen', `<div class="res-hero"><div class="res-big">±${f(r.dev)} mm</div><div class="res-sub">${A.gen.rel === 'bezug' ? 'Abweichung des Maßes vom Bezug aus' : 'Abweichung des Maßes zwischen zwei Flächen'}</div></div>
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

  function out(id, html) { const el = $('#' + id); if (el) el.innerHTML = html; }
  function computeAll() { computeAng(); computeGeo(); computeIso(); computeFit(); computeGen(); computeChain(); }
  function onApplyChange(k) {
    const sec = k.split('.')[0];
    if (k === 'geo.prop') $('#geo-inputs').innerHTML = geoInputs();
    if (k === 'fit.sys' || k === 'fit.q') { const c = $('#fit-chips'); if (c) c.innerHTML = fitChips(); }
    if (k === 'gen.tab' || k === 'gen.mode') $('#gen-body').innerHTML = genBody();
    ({ ang: computeAng, geo: computeGeo, iso: computeIso, fit: computeFit, gen: computeGen })[sec]();
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
    'fit-equiv': t => { setK('fit.q', t.dataset.v); $('#p-q').value = t.dataset.v; onApplyChange('fit.q'); },
    'iso-from': t => {
      setK('iso.q', t.dataset.v);
      $('#i-q').value = t.dataset.v;
      computeIso();
      const c = $('#card-iso');
      c.scrollIntoView({ behavior: 'smooth', block: 'start' });
      c.classList.remove('flash'); void c.offsetWidth; c.classList.add('flash');
    },
    'chain-add': () => {
      A.chain.rows.push({ op: 1, N: '', mode: 'pm', pm: '', up: '', lo: '', iso: '' });
      saveA(); renderChainRows(); computeChain();
      const inp = $(`#c${A.chain.rows.length - 1}-N`);
      if (inp) inp.focus();
    },
    'chain-del': t => { A.chain.rows.splice(+t.dataset.i, 1); saveA(); renderChainRows(); computeChain(); },
    'chain-example': () => {
      A.chain.rows = [{ op: 1, N: '40', mode: 'pm', pm: '0,1', up: '', lo: '', iso: '' }, { op: -1, N: '12', mode: 'ul', pm: '', up: '0,1', lo: '0', iso: '' }];
      saveA(); renderChainRows(); computeChain();
      out('res-chain', msgHTML('Beispiel: Ein Absatz ist 40 ±0,1 mm hoch. Von oben ist eine Nut 12 mm tief gefräst, mit +0,1 und 0. Gesucht ist die Restdicke unter der Nut.') + $('#res-chain').innerHTML);
    }
  };

  document.addEventListener('click', e => {
    const t = e.target.closest('button, a[data-jump]');
    if (!t) return;
    if (t.dataset.tab) return goTab(t.dataset.tab);
    if (t.dataset.topic) return push({ v: 'topic', id: t.dataset.topic, seg: 'erkl' });
    if (t.dataset.task) return push({ v: 'task', id: t.dataset.task });
    if (t.dataset.jump) {
      e.preventDefault();
      const el = $('#' + t.dataset.jump);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
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
  document.addEventListener('change', e => { if (e.target.tagName === 'SELECT') onInput(e); });

  // Eingabetaste springt zum nächsten Feld, wie „Weiter“ auf der iPhone-Tastatur
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !$('#sheet').hidden) { closeSheet(); return; }
    if (e.key !== 'Enter' || e.target.tagName !== 'INPUT') return;
    e.preventDefault();
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
