/* Formwerk – Erholung & Belastung für Krafttraining. Die Berechnung passiert im Worker (formwerk-worker/src/model.js),
   die App zeigt an. Speicher nur mit Präfix „formwerk_“ (geteilte Adresse mit Satzwerk, Kochwerk …). */
(function () {
  'use strict';
  const VERSION = '1.0.1';
  // Vorbelegung der Worker-Adresse (keine Geheimnisse – das Passwort gibt der Nutzer einmal ein)
  const DEFAULT_URL = '';

  /* ---------- Speicher ---------- */
  const LS = {
    get(k, d) { try { const v = localStorage.getItem('formwerk_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('formwerk_' + k, JSON.stringify(v)); } catch (e) { } },
    del(k) { try { localStorage.removeItem('formwerk_' + k); } catch (e) { } }
  };
  const st = {
    cfg: LS.get('cfg', null),            // {url, pw}
    data: LS.get('summary', null),       // letzte Zusammenfassung vom Worker
    fetchedAt: LS.get('fetchedAt', 0),   // wann die App sie geholt hat
    tab: LS.get('tab', 'heute'),
    range: LS.get('range', 7),
    loading: false, error: null, sel: {}
  };

  /* ---------- Helfer ---------- */
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (x, d = 0) => (x == null || isNaN(x) ? '–' : Number(x).toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d }));
  const hm = sec => { if (sec == null) return '–'; const m = Math.round(sec / 60); return Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0'); };
  const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  const wd = iso => (new Date(iso + 'T12:00:00').getDay() + 6) % 7;
  const dShort = iso => DAYS[wd(iso)] + ' ' + +iso.slice(8, 10) + '.' + +iso.slice(5, 7) + '.';
  const todayIso = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const clock = ts => new Date(ts).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  const ago = ts => { const m = Math.round((Date.now() - ts) / 60000); if (m < 1) return 'gerade eben'; if (m < 60) return 'vor ' + m + ' min'; const h = Math.round(m / 60); if (h < 24) return 'vor ' + h + ' h'; return 'am ' + new Date(ts).toLocaleDateString('de-DE', { day: 'numeric', month: 'numeric' }); };
  const COL = { green: 'var(--green)', yellow: 'var(--yellow)', red: 'var(--red)', none: 'var(--muted)' };
  const COLTXT = { green: 'Gut erholt', yellow: 'Teilweise erholt', red: 'Wenig erholt', none: 'Keine Bewertung' };
  const I = {
    today: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 1 8.5 8.5" stroke-width="3"/></svg>',
    hist: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
    more: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h10"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5v.5"/></svg>',
    chev: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m9 6 6 6-6 6"/></svg>'
  };
  function toast(msg, ms) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), ms || 2400); }

  /* ---------- Worker ---------- */
  const base = () => ((st.cfg && st.cfg.url) || DEFAULT_URL).trim().replace(/\/+$/, '');
  async function api(path, opt = {}) {
    const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), opt.timeout || 30000);
    try {
      const r = await fetch(base() + path, { method: opt.method || 'GET', headers: Object.assign({ Authorization: 'Bearer ' + (st.cfg ? st.cfg.pw : '') }, opt.body ? { 'Content-Type': 'application/json' } : {}), body: opt.body ? JSON.stringify(opt.body) : undefined, signal: ctl.signal, cache: 'no-store' });
      let j = null; try { j = await r.json(); } catch (e) { }
      if (!r.ok) { const err = new Error((j && j.message) || ('Fehler ' + r.status)); err.status = r.status; throw err; }
      return j;
    } catch (e) {
      if (e.name === 'AbortError') throw new Error('Zeitüberschreitung – Worker antwortet nicht.');
      if (e instanceof TypeError) throw new Error('Keine Verbindung zum Worker (offline oder Adresse falsch).');
      throw e;
    } finally { clearTimeout(tm); }
  }
  async function load(force) {
    if (!st.cfg || st.loading) return;
    st.loading = true; st.error = null; renderHead();
    try {
      const j = await api('/v1/summary' + (force ? '?force=1' : ''));
      st.data = j; st.fetchedAt = Date.now(); LS.set('summary', j); LS.set('fetchedAt', st.fetchedAt);
    } catch (e) {
      st.error = e.message;
      if (e.status === 401) { toast('Passwort falsch – bitte neu eingeben'); }
    }
    st.loading = false; render();
  }

  /* ---------- Ansichten ---------- */
  function render() {
    renderTabs();
    const v = $('#view');
    if (!st.cfg) v.innerHTML = setupView();
    else v.innerHTML = st.tab === 'verlauf' ? histView() : st.tab === 'mehr' ? moreView() : todayView();
    requestAnimationFrame(animateRing);
  }
  function renderTabs() {
    const tabs = [['heute', 'Heute', I.today], ['verlauf', 'Verlauf', I.hist], ['mehr', 'Mehr', I.more]];
    $('#tabs').hidden = !st.cfg;
    $('#tabs').innerHTML = tabs.map(([k, l, ic]) => `<button data-a="tab" data-k="${k}" ${st.tab === k ? 'aria-current="page"' : ''}>${ic}<span>${l}</span></button>`).join('');
  }
  function renderHead() { const b = $('#refreshBtn'); if (b) b.classList.toggle('busy', st.loading); }

  function standLine() {
    const d = st.data; if (!d) return '';
    const lf = d.status && d.status.lastFetch;
    const cls = st.error || (d.status && d.status.error) ? 'err' : (Date.now() - (lf || 0) < 3 * 3600e3 ? 'fresh' : 'old');
    return `<div class="stand ${cls}"><i></i><span class="ell">Stand ${lf ? clock(lf) : '–'}${lf && Date.now() - lf > 20 * 3600e3 ? ' (' + ago(lf) + ')' : ''} · Garmin</span></div>`;
  }
  function header(title) {
    const dt = new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
    return `<div class="head"><div class="grow"><div class="eyebrow ell">${dt}</div><h1>${title}</h1>${standLine()}</div>
      <button class="iconbtn ${st.loading ? 'busy' : ''}" id="refreshBtn" data-a="refresh" aria-label="Aktualisieren">${I.refresh}</button></div>`;
  }
  function banners() {
    const d = st.data; let h = '';
    if (st.error) h += `<div class="banner bad"><div><b>Nicht aktualisiert.</b> ${esc(st.error)}${d ? ' Angezeigt wird der letzte Stand.' : ''}</div></div>`;
    if (d && d.status && d.status.error) h += `<div class="banner warn"><div><b>Garmin meldet ein Problem.</b> ${esc(d.status.error)}</div></div>`;
    if (d && d.date && d.date !== todayIso() && !st.loading) h += `<div class="banner warn"><div>Die Daten sind vom ${dShort(d.date)} – zum Aktualisieren nach unten ziehen.</div></div>`;
    return h;
  }

  /* ----- Heute ----- */
  function todayView() {
    const d = st.data;
    if (!d) return header('Heute') + banners() + (st.loading ? '<div class="stack"><div class="skeleton" style="height:340px"></div><div class="skeleton"></div><div class="skeleton"></div></div>' : `<div class="card"><p class="ink2" style="margin:0">Noch keine Daten. Nach unten ziehen oder oben rechts aktualisieren.</p></div>`);
    return header('Heute') + `<div class="stack">${banners()}${ringCard(d)}${recCard(d)}${muscleCard(d)}${sleepCard(d)}${loadCard(d)}${bbCard(d)}</div>`;
  }
  function ringCard(d) {
    const r = d.recovery, v = d.vitals;
    const score = r.score, col = r.color || 'none';
    const C = 2 * Math.PI * 100;
    const center = r.building
      ? `<div class="pending">Basis wird aufgebaut</div><div class="lbl">${r.baseNights || 0} von 5 Nächten</div>`
      : score == null ? `<div class="pending">Noch keine Werte von heute Nacht</div>`
      : `<div class="big num">${score}<small>%</small></div><div class="lbl">Erholung</div>`;
    const hp = (r.parts || []).find(p => p.k === 'hrv');
    const hrvDelta = hp ? hp.deltaPct : null;
    const rp = (r.parts || []).find(p => p.k === 'rhr');
    const rhrDelta = rp ? rp.delta : null;
    const sl = d.sleep;
    return `<div class="card ringcard">
      <div class="ring"><svg viewBox="0 0 232 232"><circle class="trk" cx="116" cy="116" r="100" fill="none" stroke-width="16"/>
        <circle class="val" id="ringVal" cx="116" cy="116" r="100" fill="none" stroke="${COL[col]}" stroke-width="16" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C}" data-to="${C * (1 - (score || 0) / 100)}"/></svg>
        <div class="center">${center}</div></div>
      ${score != null ? `<div class="chip ${'c-' + col}"><i class="${'bg-' + col}"></i>${COLTXT[col]}${r.provisional ? ' · vorläufig' : ''}</div>` : ''}
      <div class="vitals">
        <div><span>HRV</span><b class="num">${fmt(v.hrv)}<small>ms</small></b><em>${hrvDelta == null ? (v.hrvBase ? 'Ø ' + fmt(v.hrvBase) : '&nbsp;') : hrvDelta === 0 ? 'wie dein Ø' : (hrvDelta > 0 ? '+' : '−') + Math.abs(hrvDelta) + ' % zum Ø'}</em></div>
        <div><span>Ruhepuls</span><b class="num">${fmt(v.rhr)}<small>bpm</small></b><em>${rhrDelta == null ? (v.rhrBase ? 'Ø ' + fmt(v.rhrBase, 0) : '&nbsp;') : Math.abs(rhrDelta) < 0.5 ? 'wie dein Ø' : (rhrDelta > 0 ? '+' : '−') + fmt(Math.abs(rhrDelta), 1) + ' zum Ø'}</em></div>
        <div><span>Schlaf</span><b class="num">${sl.has ? hm(sl.total) : '–'}<small>h</small></b><em>${sl.has && sl.ofAvg ? sl.ofAvg + ' % vom Ø' : sl.avg ? 'Ø ' + hm(sl.avg) : '&nbsp;'}</em></div>
      </div>
      <button class="why" data-a="why">${I.info} ${score == null ? 'So entsteht der Wert' : 'Warum heute ' + ({ green: 'grün', yellow: 'gelb', red: 'rot' }[col] || '') + '?'}</button>
    </div>`;
  }
  function animateRing() { const c = $('#ringVal'); if (c) c.style.strokeDashoffset = c.dataset.to; }

  function recCard(d) {
    const c = d.recommendation; const w = c.week || { done: 0, goal: 2 };
    const dots = Array.from({ length: Math.max(w.goal, w.done) }, (_, i) => `<i class="${i < w.done ? 'on' : ''}"></i>`).join('');
    return `<div class="card navy rec"><div class="eyebrow">Empfehlung für heute</div>
      <div class="title">${esc(c.title)}</div><p>${esc(c.text)}</p>
      ${c.good && c.good.length ? `<div class="eyebrow" style="margin-top:14px">Gut heute</div><div class="pills">${c.good.map(g => `<span class="pill">${esc(g)}</span>`).join('')}</div>` : ''}
      ${c.avoid && c.avoid.length && c.level !== 'rest' && c.level !== 'done' ? `<div class="eyebrow" style="margin-top:12px">Wegen Baseball schonen</div><div class="pills">${c.avoid.map(g => `<span class="pill dim">${esc(g)}</span>`).join('')}</div>` : ''}
      ${c.notes && c.notes.length ? `<ul class="notes">${c.notes.map(n => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}
      <div class="weekdots"><div class="dots">${dots}</div><span>Kraft diese Woche: ${w.done} von ${w.goal}</span></div></div>`;
  }

  function muscleCard(d) {
    const ms = d.muscles || []; const last = d.strength && d.strength.last;
    const txt = m => m.status === 'fresh' ? 'erholt' : (m.status === 'tired' ? 'ermüdet' : 'teilweise') + (m.readyIn ? ' · ~' + (m.readyIn >= 36 ? Math.round(m.readyIn / 24) + ' T' : m.readyIn + ' h') : '');
    const lastTxt = last ? `${esc(last.name || 'Kraft')} · ${last.date === todayIso() ? 'heute' : dShort(last.date)}` : 'Noch keine Einheit von Satzwerk';
    return `<div class="card"><div class="ctitle"><h3>Muskelgruppen</h3><span class="aside ell">${lastTxt}</span></div>
      <div class="muscles">${ms.map(m => `<div class="mus ${m.status}"><div class="top"><b class="ell">${esc(m.label)}</b><span>${txt(m)}</span></div><div class="bar"><i style="width:${Math.max(3, m.pct)}%"></i></div></div>`).join('')}</div>
      <div class="legend"><span><i style="background:var(--accent)"></i>erholt</span><span><i style="background:var(--yellow)"></i>teilweise</span><span><i style="background:var(--red)"></i>ermüdet</span><span>Balken = Restermüdung</span></div></div>`;
  }

  function sleepTime(ts, local) { return ts ? new Date(ts).toLocaleTimeString('de-DE', Object.assign({ hour: '2-digit', minute: '2-digit' }, local ? { timeZone: 'UTC' } : {})) : null; }
  function sleepCard(d) {
    const s = d.sleep;
    if (!s.has) return `<div class="card"><div class="ctitle"><h3>Schlaf</h3></div><p class="muted" style="margin:0">Für heute Nacht noch kein Schlaf von Garmin. Uhr synchronisieren und neu laden.</p></div>`;
    const parts = [['deep', 'Tief', s.deep], ['light', 'Leicht', s.light], ['rem', 'REM', s.rem], ['awake', 'Wach', s.awake]];
    const tot = parts.reduce((t, p) => t + (p[2] || 0), 0);
    const from = sleepTime(s.start, s.local), to = sleepTime(s.end, s.local);
    return `<div class="card"><div class="ctitle"><h3>Schlaf</h3><span class="aside">${from && to ? from + ' – ' + to : ''}</span></div>
      <div class="split"><div class="bigval num">${hm(s.total)}<small>h</small></div>
        <div style="text-align:right"><div class="small ink2">${s.ofAvg != null ? s.ofAvg + ' % deines Schnitts' : ''}</div><div class="tiny muted">Schnitt ${hm(s.avg)}${s.score != null ? ' · Schlafwert ' + s.score : ''}</div></div></div>
      ${tot ? `<div class="phases">${parts.filter(p => p[2]).map(p => `<i class="ph-${p[0]}" style="flex:${p[2]}"></i>`).join('')}</div>
      <div class="phleg">${parts.map(p => `<div><i class="ph-${p[0]}"></i>${p[1]}<b class="num">${p[2] != null ? hm(p[2]) : '–'}</b></div>`).join('')}</div>` : '<div class="tiny muted" style="margin-top:10px">Keine Schlafphasen von Garmin.</div>'}
      ${s.short ? `<div class="banner warn" style="margin-top:12px"><div><b>Deutlich weniger als sonst.</b> Heute lieber früher ins Bett – Schlaf ist dein stärkster Erholungshebel.</div></div>` : ''}</div>`;
  }

  function loadCard(d) {
    const L = d.load; const hist = (d.history || []).slice(-7);
    const max = Math.max(30, ...hist.map(h => h.load || 0));
    const ratio = L.ratio && L.ratio.ratio;
    const ratioTxt = ratio == null ? '' : ratio > 1.5 ? 'deutlich mehr als gewohnt' : ratio > 1.2 ? 'etwas mehr als gewohnt' : ratio < 0.7 ? 'weniger als gewohnt' : 'im üblichen Rahmen';
    const acts = (L.activities || []).map(a => `<div class="act"><div class="grow"><b class="ell" style="display:block">${esc(a.name || actName(a.type))}</b><div class="tiny muted">${a.time ? a.time + ' · ' : ''}${Math.round((a.dur || 0) / 60)} min${a.avgHr ? ' · Ø ' + a.avgHr + ' bpm' : ''}</div></div><span class="pts num">${a.score}</span></div>`).join('');
    return `<div class="card"><div class="ctitle"><h3>Belastung heute</h3><span class="aside">${L.steps != null ? fmt(L.steps) + ' Schritte' : ''}</span></div>
      <div class="split"><div class="bigval num">${L.score}<small>/ 100</small></div><div class="small ink2" style="text-align:right">${ratioTxt ? 'Woche: ' + ratioTxt : ''}</div></div>
      ${acts ? `<div class="acts">${acts}</div>` : '<div class="tiny muted" style="margin-top:8px">Keine Aktivität aufgezeichnet – nur Alltag.</div>'}
      <div class="minibars" aria-label="Belastung der letzten 7 Tage">${hist.map((h, i) => `<div class="${i === hist.length - 1 ? 'today' : ''}"><i style="height:${Math.max(4, (h.load || 0) / max * 100)}%"></i><span>${DAYS[wd(h.date)]}</span></div>`).join('')}</div>
      <div class="tiny muted" style="margin-top:8px">Aus Herzfrequenz-Zonen deiner Garmin-Aktivitäten (auch Baseball, Rad). Kraft zählt bei den Muskelgruppen.</div></div>`;
  }
  function actName(t) { return ({ baseball: 'Baseball', cycling: 'Radfahren', road_biking: 'Rennrad', running: 'Laufen', walking: 'Gehen', hiking: 'Wandern', strength_training: 'Krafttraining' })[t] || (t || 'Aktivität').replace(/_/g, ' '); }

  function bbCard(d) {
    const b = d.bodyBattery; if (b.high == null && b.now == null) return '';
    const c = b.curve || []; let path = '';
    if (c.length > 1) { const mx = 100; path = c.map((v, i) => `${(i / (c.length - 1) * 100).toFixed(1)},${(30 - v / mx * 28).toFixed(1)}`).join(' '); }
    return `<div class="card"><div class="ctitle"><h3>Body Battery</h3><span class="aside">nur Info</span></div>
      <div class="kpis"><div><b class="num">${fmt(b.high)}</b><span>Höchster</span></div><div><b class="num">${fmt(b.low)}</b><span>Tiefster</span></div>${b.charged != null ? `<div><b class="num">+${fmt(b.charged)}</b><span>Geladen</span></div>` : ''}</div>
      <div class="tiny muted" style="margin-top:8px">Fließt bewusst nicht in die Erholung ein.</div>${path ? `<svg viewBox="0 0 100 32" preserveAspectRatio="none" style="width:100%;height:46px;margin-top:10px"><polyline points="${path}" fill="none" stroke="var(--muted)" stroke-width="1.4" vector-effect="non-scaling-stroke"/></svg>` : ''}</div>`;
  }

  /* ----- Verlauf ----- */
  function histView() {
    const d = st.data;
    const segs = [[7, 'Woche'], [30, 'Monat'], [90, '3 Monate']];
    const seg = `<div class="seg" role="group" aria-label="Zeitraum">${segs.map(([n, l]) => `<button data-a="range" data-n="${n}" aria-pressed="${st.range === n}">${l}</button>`).join('')}</div>`;
    if (!d || !d.history) return header('Verlauf') + banners() + seg + '<div class="card" style="margin-top:12px"><p class="muted" style="margin:0">Noch keine Daten.</p></div>';
    const h = d.history.slice(-st.range);
    const avg = k => { const v = h.map(x => x[k]).filter(x => x != null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
    const recCol = x => COL[x.color] || COL.none;
    return header('Verlauf') + `<div class="stack">${banners()}${seg}
      ${chartCard('rec', 'Erholung', h, { key: 'rec', type: 'bar', max: 100, color: recCol, unit: '%', aside: avg('rec') != null ? 'Ø ' + fmt(avg('rec')) + ' %' : '' })}
      ${chartCard('hrv', 'HRV', h, { key: 'hrv', type: 'line', unit: 'ms', avg: avg('hrv'), aside: avg('hrv') != null ? 'Ø ' + fmt(avg('hrv')) + ' ms' : '' })}
      ${chartCard('rhr', 'Ruhepuls', h, { key: 'rhr', type: 'line', unit: 'bpm', avg: avg('rhr'), aside: avg('rhr') != null ? 'Ø ' + fmt(avg('rhr'), 1) + ' bpm' : '' })}
      ${chartCard('sleep', 'Schlaf', h, { key: 'sleep', type: 'bar', unit: 'h', fmtv: v => hm(v * 3600) + ' h', avg: avg('sleep'), aside: avg('sleep') != null ? 'Ø ' + hm(avg('sleep') * 3600) + ' h' : '' })}
      ${chartCard('load', 'Belastung', h, { key: 'load', type: 'bar', max: 100, unit: '', marks: 'strength', aside: (() => { const n = h.reduce((t, x) => t + (x.strength || 0), 0); return n + '× Kraft'; })() })}
      <div class="tiny muted" style="text-align:center">Auf ein Diagramm tippen zeigt den Tageswert. Punkte unter der Belastung = Kraft-Einheit aus Satzwerk.</div></div>`;
  }
  function chartCard(id, title, h, o) {
    const W = 300, H = 120, n = h.length;
    const vals = h.map(x => x[o.key]);
    const have = vals.filter(v => v != null);
    if (!have.length) return `<div class="card"><div class="ctitle"><h3>${title}</h3></div><p class="muted small" style="margin:0">Keine Werte im Zeitraum.</p></div>`;
    let lo = o.type === 'bar' ? 0 : Math.min(...have), hi = o.max || Math.max(...have);
    if (o.type === 'line') { const pad = Math.max(2, (hi - lo) * 0.25); lo -= pad; hi += pad; }
    if (hi <= lo) hi = lo + 1;
    const y = v => H - (v - lo) / (hi - lo) * H;
    const step = W / n, bw = Math.max(1.5, step * (n > 60 ? 0.7 : 0.62));
    let body = '';
    if (o.avg != null) body += `<line x1="0" x2="${W}" y1="${y(o.avg).toFixed(1)}" y2="${y(o.avg).toFixed(1)}" stroke="var(--line)" stroke-dasharray="4 4" vector-effect="non-scaling-stroke"/>`;
    if (o.type === 'bar') {
      body += h.map((x, i) => x[o.key] == null ? '' : `<rect x="${(i * step + (step - bw) / 2).toFixed(1)}" y="${y(x[o.key]).toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(1, H - y(x[o.key])).toFixed(1)}" rx="${Math.min(3, bw / 2).toFixed(1)}" fill="${o.color ? o.color(x) : 'var(--accent)'}" opacity="${st.sel[id] == null || st.sel[id] === i ? 1 : .45}"/>`).join('');
    } else {
      const pts = h.map((x, i) => x[o.key] == null ? null : [(i * step + step / 2), y(x[o.key])]);
      let dpath = ''; let pen = false;
      for (const p of pts) { if (!p) { pen = false; continue; } dpath += (pen ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); pen = true; }
      body += `<path d="${dpath}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`;
      if (n <= 31) body += pts.map((p, i) => p ? `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${st.sel[id] === i ? 4.5 : 2.6}" fill="${st.sel[id] === i ? 'var(--highlight)' : 'var(--accent)'}"/>` : '').join('');
    }
    if (o.marks) body += h.map((x, i) => x[o.marks] ? `<circle cx="${(i * step + step / 2).toFixed(1)}" cy="${H + 8}" r="2.6" fill="var(--highlight)"/>` : '').join('');
    if (st.sel[id] != null && o.type === 'line' && h[st.sel[id]]) body += `<line x1="${(st.sel[id] * step + step / 2).toFixed(1)}" x2="${(st.sel[id] * step + step / 2).toFixed(1)}" y1="0" y2="${H}" stroke="var(--line)" vector-effect="non-scaling-stroke"/>`;
    const si = st.sel[id]; const sx = si != null ? h[si] : null;
    const fv = v => v == null ? 'kein Wert' : o.fmtv ? o.fmtv(v) : fmt(v, o.key === 'rhr' ? 0 : 0) + (o.unit ? ' ' + o.unit : '');
    const selTxt = sx ? `${dShort(sx.date)}: <b>${fv(sx[o.key])}</b>${o.marks && sx.strength ? ' · Kraft ' + sx.sets + ' Sätze' : ''}` : '&nbsp;';
    const lbl = i => n <= 7 ? DAYS[wd(h[i].date)] : dShort(h[i].date).slice(3);
    const axis = n <= 7 ? h.map((_, i) => `<span>${lbl(i)}</span>`).join('') : `<span>${lbl(0)}</span><span>${lbl(Math.floor(n / 2))}</span><span>${lbl(n - 1)}</span>`;
    return `<div class="card"><div class="ctitle"><h3>${title}</h3><span class="aside">${o.aside || ''}</span></div>
      <div class="chart" data-a="chartSel" data-id="${id}" data-n="${n}"><svg viewBox="0 0 ${W} ${H + (o.marks ? 12 : 0)}" preserveAspectRatio="none" style="height:${o.marks ? 144 : 132}px">${body}</svg>
      <div class="axis">${axis}</div><div class="sel">${selTxt}</div></div></div>`;
  }

  /* ----- Mehr ----- */
  function moreView() {
    const d = st.data; const s = (d && d.settings) || { sportDays: [1, 3], strengthPerWeek: 2 };
    const status = d && d.status;
    return header('Mehr') + `<div class="stack">
      <div class="eyebrow sethead">Mein Wochenrhythmus</div>
      <div class="card stack"><div><div class="lblf">Baseball (abends)</div><div class="days7">${DAYS.map((l, i) => `<button data-a="sport" data-k="${i}" aria-pressed="${s.sportDays.includes(i)}">${l}</button>`).join('')}</div></div>
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px"><div><div style="font-weight:600">Kraft-Einheiten pro Woche</div><div class="tiny muted">Ziel für die Empfehlung</div></div>
        <div class="stepper"><button data-a="spw" data-d="-1" aria-label="Weniger">−</button><b class="num">${s.strengthPerWeek}</b><button data-a="spw" data-d="1" aria-label="Mehr">+</button></div></div></div>
      <div class="eyebrow sethead">Verstehen</div>
      <div class="list"><button class="li" data-a="explain"><div class="grow"><b>So rechnet Formwerk</b><div class="small muted">Erholung, Belastung, Muskeln, Empfehlung</div></div><span class="chev">${I.chev}</span></button></div>
      <div class="eyebrow sethead">Verbindung</div>
      <div class="list">
        <div class="li"><div class="grow"><b>Worker</b><div class="small muted ell">${esc(base().replace(/^https:\/\//, ''))}</div></div></div>
        <div class="li"><div class="grow"><b>Garmin</b><div class="small muted">${status ? (status.lastFetch ? 'Zuletzt abgerufen ' + ago(status.lastFetch) : 'Noch nie abgerufen') + (status.firstDate ? ' · Daten ab ' + dShort(status.firstDate) : '') : '–'}</div>${status && status.error ? `<div class="small c-red">${esc(status.error)}</div>` : ''}</div></div>
        <button class="li" data-a="refetch"><div class="grow"><b>Garmin-Daten komplett neu laden</b><div class="small muted">120 Tage – nur nötig, wenn etwas fehlt</div></div><span class="chev">${I.chev}</span></button>
        <button class="li" data-a="openTest"><div class="grow"><b>Rohdaten-Testseite</b><div class="small muted">Zeigt, was Garmin wirklich liefert</div></div><span class="chev">${I.chev}</span></button>
        <button class="li" data-a="setupEdit"><div class="grow"><b>Adresse oder Passwort ändern</b></div><span class="chev">${I.chev}</span></button>
      </div>
      <div class="eyebrow sethead">App</div>
      <div class="list"><button class="li" data-a="forget"><div class="grow"><b class="c-red">Auf diesem Gerät abmelden</b><div class="small muted">Löscht nur Formwerks Zugang und Zwischenspeicher hier</div></div></button></div>
      <p class="tiny muted" style="text-align:center;margin:8px 0 0">Formwerk ${VERSION}${status ? ' · Worker ' + esc(status.worker || '') : ''}<br>Trainingshilfe – keine medizinischen Aussagen.</p></div>`;
  }

  /* ----- Einrichtung ----- */
  function setupView(edit) {
    const c = st.cfg || {};
    return `<div class="setup"><img class="logo" src="icon-192.png" alt=""><div><div class="eyebrow">Willkommen</div><h1>Formwerk</h1>
      <p class="ink2" style="margin:8px 0 0">Erholung, Schlaf und Belastung aus deiner Garmin-Uhr – mit Muskelgruppen aus Satzwerk.</p></div>
      <div><label class="lblf" for="su-url">Worker-Adresse</label><input class="field" id="su-url" inputmode="url" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="https://formwerk.….workers.dev" value="${esc(c.url || DEFAULT_URL)}"></div>
      <div><label class="lblf" for="su-pw">App-Passwort</label><input class="field" id="su-pw" type="password" autocomplete="current-password" placeholder="wie im Cloudflare-Secret APP_PASSWORD" value="${esc(c.pw || '')}"></div>
      <div class="small c-red" id="su-err"></div>
      <button class="btn primary block" data-a="connect">Verbinden</button>
      ${edit ? '<button class="btn ghost block" data-a="closeSheet">Abbrechen</button>' : ''}
      <p class="tiny muted" style="margin:0">Die Worker-Adresse bekommst du erst, wenn der Worker bei Cloudflare läuft (Anleitung: formwerk-worker/EINRICHTEN.md). Der Garmin-Schlüssel kommt nie hier hinein. Das Passwort bleibt nur auf diesem Gerät. Ohne Passwort gibt der Worker keine Daten heraus.</p></div>`;
  }

  /* ---------- Fenster ---------- */
  function openSheet(html) {
    const L = $('#layer'); L.innerHTML = `<div class="dim" data-a="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div>`;
    requestAnimationFrame(() => L.classList.add('open'));
  }
  function closeSheet() { const L = $('#layer'); L.classList.remove('open'); setTimeout(() => { if (!L.classList.contains('open')) L.innerHTML = ''; }, 300); }
  function whySheet() {
    const r = st.data.recovery; const col = r.color;
    const parts = r.parts.map(p => `<div class="part"><div class="score ${p.score >= 60 ? 'c-green' : p.score >= 34 ? 'c-yellow' : 'c-red'}">${p.score}<span>${p.weight} %</span></div><div class="grow" style="min-width:0"><b>${p.label}</b><div class="small ink2">${partText(p)}</div></div></div>`).join('');
    const head = r.score == null ? (r.building ? `Für eine faire Bewertung braucht Formwerk mindestens 5 Nächte mit HRV oder Ruhepuls. Bisher: ${r.baseNights}. Garmin-Daten der letzten Wochen werden automatisch nachgeladen.` : 'Für heute Nacht liegen noch keine Werte vor.')
      : `Heute <b>${r.score} %</b> – ${COLTXT[col].toLowerCase()}. ${r.why && r.why[0] ? esc(r.why[0].text) : ''}`;
    openSheet(`<div class="stack"><div><div class="eyebrow">Erholung</div><h2>${r.score == null ? 'So entsteht der Wert' : 'Warum heute ' + ({ green: 'grün', yellow: 'gelb', red: 'rot' }[col]) + '?'}</h2></div>
      <p class="ink2" style="margin:0">${head}</p>
      ${parts ? `<div>${parts}</div>` : ''}
      <div class="formula">Erholung = 50 % HRV + 25 % Ruhepuls + 25 % Schlaf, jeweils verglichen mit <b>deinem</b> Schnitt der letzten 30 Tage. Ein Tag genau auf deiner Basis ergibt 71 Punkte. Grün ab 67, rot unter 34.${r.provisional ? ' Vorläufig, solange weniger als 14 Nächte Basis vorliegen.' : ''} Body Battery zählt nicht mit.</div>
      <button class="btn block" data-a="closeSheet">Schließen</button></div>`);
  }
  function partText(p) {
    if (p.k === 'hrv') return `${p.value} ms · Basis ${p.base} ms (${p.deltaPct > 0 ? '+' : ''}${p.deltaPct} %)`;
    if (p.k === 'rhr') return `${p.value} bpm · Basis ${fmt(p.base, 1)} (${p.delta > 0 ? '+' : ''}${fmt(p.delta, 1)})`;
    if (p.k === 'sleep') return `${hm(p.value * 3600)} h · Bedarf ${hm(p.base * 3600)} h (${p.ofNeed} %)${p.quality != null ? ' · Qualität ' + p.quality : ''}`;
    return '';
  }
  function explainSheet() {
    openSheet(`<div class="stack"><div><div class="eyebrow">Transparent</div><h2>So rechnet Formwerk</h2></div><div class="prose">
      <p><b>Erholung (0–100 %).</b> Nächtliche HRV (50 %), Ruhepuls (25 %) und Schlaf (25 %) – immer im Vergleich zu deinem eigenen 30-Tage-Schnitt, nie zu Normwerten. HRV wird logarithmisch verglichen (übliche Methode in der Sportwissenschaft). Schlaf = Dauer im Verhältnis zu deinem Bedarf (dein Schnitt, 7–9 h) plus Qualität (Garmin-Schlafwert). Grün ab 67, gelb 34–66, rot darunter. Body Battery wird nur angezeigt.</p>
      <p><b>Belastung (0–100).</b> Aus der Zeit in deinen Herzfrequenz-Zonen bei jeder Garmin-Aktivität (Zone 1 zählt 1×, Zone 5 zählt 5×) plus Alltagsschritte. Die Skala flacht oben ab: 1 h locker ≈ 35, 2 h Baseball ≈ 55–65.</p>
      <p><b>Muskelgruppen.</b> Jeder Satz aus Satzwerk zählt für die Hauptmuskeln voll, für mitbeteiligte halb – je weniger Wiederholungen in Reserve, desto mehr. 5 sehr harte Sätze = voll ermüdet. Die Ermüdung klingt ab: große Beinmuskeln und unterer Rücken am langsamsten (2–3 Tage), Arme, Waden und Bauch schneller (1–2 Tage). Baseball belastet Schultern, Rumpf, Unterarme und Beinbeuger mit.</p>
      <p><b>Empfehlung.</b> Rot → Pause. Grün → Kraft voll, gelb → Kraft leicht (⅔ der Sätze, 3 Wdh. Reserve). Eine Stufe leichter bei wenig Schlaf oder deutlich mehr Wochenbelastung als gewohnt. An Baseball-Tagen höchstens leicht, am Tag davor keine schweren Beine/Überkopf. Letzte Kraft-Einheit unter 48 h und Muskeln noch müde → Kraft-Pause. Ziel: ${(st.data && st.data.settings && st.data.settings.strengthPerWeek) || 2} Einheiten pro Woche.</p>
      <p class="muted">Trainingshilfe, keine medizinische Aussage. Wenn du dich krank fühlst, zählt dein Gefühl.</p></div>
      <button class="btn block" data-a="closeSheet">Schließen</button></div>`);
  }

  /* ---------- Aktionen ---------- */
  const A = {
    tab(t) { st.tab = t.dataset.k; LS.set('tab', st.tab); render(); $('#scroller').scrollTop = 0; },
    refresh() { load(true); },
    why() { if (st.data) whySheet(); },
    explain: explainSheet,
    closeSheet,
    range(t) { st.range = +t.dataset.n; st.sel = {}; LS.set('range', st.range); render(); },
    chartSel(t, e) {
      const r = t.getBoundingClientRect(); const n = +t.dataset.n; const id = t.dataset.id;
      const i = Math.max(0, Math.min(n - 1, Math.floor((e.clientX - r.left) / r.width * n)));
      st.sel[id] = st.sel[id] === i ? null : i; const top = $('#scroller').scrollTop; render(); $('#scroller').scrollTop = top;
    },
    async sport(t) { const s = Object.assign({ sportDays: [1, 3], strengthPerWeek: 2 }, st.data && st.data.settings); const k = +t.dataset.k; const sd = s.sportDays.includes(k) ? s.sportDays.filter(x => x !== k) : s.sportDays.concat(k).sort(); await saveSettings({ sportDays: sd }); },
    async spw(t) { const s = Object.assign({ strengthPerWeek: 2 }, st.data && st.data.settings); const v = Math.min(6, Math.max(1, s.strengthPerWeek + +t.dataset.d)); await saveSettings({ strengthPerWeek: v }); },
    async refetch() { if (!confirm('Garmin-Daten der letzten 120 Tage neu laden? Das dauert etwa 20 Sekunden.')) return; toast('Lade Garmin-Daten neu …', 4000); try { await api('/v1/refetch', { method: 'POST', timeout: 60000 }); await load(false); toast('Neu geladen'); } catch (e) { toast(e.message, 4000); } },
    openTest() { window.open(base() + '/', '_blank'); },
    setupEdit() { openSheet(setupView(true)); },
    forget() { if (!confirm('Formwerk auf diesem Gerät abmelden? Deine Daten im Worker bleiben erhalten.')) return; for (const k of ['cfg', 'summary', 'fetchedAt', 'tab', 'range']) LS.del(k); st.cfg = null; st.data = null; render(); },
    async connect() {
      const url = ($('#layer #su-url') || $('#su-url')).value.trim().replace(/\/+$/, ''); const pw = ($('#layer #su-pw') || $('#su-pw')).value.trim();
      const err = $('#layer #su-err') || $('#su-err');
      if (/^GCDC_|^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(url) || /^GCDC_/i.test(pw)) { err.textContent = 'Das ist dein Garmin-Schlüssel – der gehört NICHT in die App, sondern nur als Secret GARMIN_API_KEY in Cloudflare. Hier kommt die Worker-Adresse hin (https://formwerk.….workers.dev), die es erst nach der Cloudflare-Einrichtung gibt.'; return; }
      if (!/^https:\/\/[^/\s]+\.[^/\s]+/.test(url)) { err.textContent = 'Bitte die vollständige https-Adresse des Workers eingeben.'; return; }
      if (!pw) { err.textContent = 'Bitte das App-Passwort eingeben.'; return; }
      const prev = st.cfg; st.cfg = { url, pw }; err.textContent = 'Verbinde …';
      try { await api('/v1/ping', { timeout: 15000 }); LS.set('cfg', st.cfg); closeSheet(); st.tab = 'heute'; render(); toast('Verbunden'); load(false); }
      catch (e) { st.cfg = prev; err.textContent = e.status === 401 ? 'Passwort falsch.' : e.message; }
    }
  };
  async function saveSettings(patch) {
    try { const s = await api('/v1/settings', { method: 'PUT', body: patch }); if (st.data) { st.data.settings = s; LS.set('summary', st.data); } render(); load(true); }
    catch (e) { toast(e.message, 3500); }
  }
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-a]'); if (!t) return;
    const f = A[t.dataset.a]; if (f) { e.preventDefault(); f(t, e); }
  });

  /* ---------- Ziehen zum Aktualisieren ---------- */
  (function pull() {
    const sc = $('#scroller'), v = $('#view'), ind = $('#ptr'); let y0 = null, dy = 0;
    sc.addEventListener('touchstart', e => { if (sc.scrollTop <= 0 && st.cfg && !st.loading && !$('#layer').classList.contains('open')) { y0 = e.touches[0].clientY; dy = 0; } else y0 = null; }, { passive: true });
    sc.addEventListener('touchmove', e => {
      if (y0 == null) return; dy = e.touches[0].clientY - y0;
      if (dy <= 0) { v.style.transform = ''; ind.classList.remove('show'); return; }
      if (e.cancelable) e.preventDefault();
      const pullY = Math.min(110, dy * 0.5); v.classList.add('pulling'); v.style.transform = `translateY(${pullY}px)`;
      ind.classList.add('show'); ind.style.setProperty('--r', (dy * 1.6) + 'deg');
    }, { passive: false });
    const end = () => {
      if (y0 == null) return; v.classList.remove('pulling'); v.style.transform = '';
      if (dy * 0.5 > 60) { ind.classList.add('spin'); load(true).finally(() => { ind.classList.remove('spin', 'show'); }); }
      else ind.classList.remove('show');
      y0 = null; dy = 0;
    };
    sc.addEventListener('touchend', end); sc.addEventListener('touchcancel', end);
  })();

  // Beim Zurückkehren in die App auffrischen, wenn älter als 15 min
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && st.cfg && Date.now() - st.fetchedAt > 15 * 60e3) load(false); });

  render();
  if (st.cfg) load(false);
  window.Formwerk = { st, render, load, VERSION };
})();
