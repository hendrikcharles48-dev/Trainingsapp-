/* Geldwerk – Oberfläche. Zustand st, Ansichten als HTML-Text, Klicks über data-a → A[...], Eingaben über data-in → IN[...].
   Vollbild-Seiten als Stapel (st.stack), Blätter von unten (st.sheet). Daten ändern nur über commit() (speichert, rechnet neu, sichert gebündelt). */
(function () {
  'use strict';
  const G = window.GW, S = G.Store, LS = S.LS, Y = G.Y;
  const VERSION = '1.0.0';
  const RULE_YEARS = [2026, 2027];
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const today = () => G.todayStr();
  const eur = (x, d) => G.eur(x, d);
  const money = v => v == null || v === '' ? '' : String(v).replace('.', ',');
  const money2 = v => v == null || v === '' ? '' : typeof v === 'number' ? v.toFixed(2).replace('.', ',') : String(v);
  const now = () => Date.now();

  const I = {
    gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    back: '<svg viewBox="0 0 24 24" style="width:22px;height:22px"><path d="M15 5l-7 7 7 7"/></svg>',
    chev: '<svg class="chev" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>',
    cam: '<svg viewBox="0 0 24 24"><path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.5-2h6l1.5 2h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z"/><circle cx="12" cy="13" r="3.5"/></svg>',
    file: '<svg viewBox="0 0 24 24"><path d="M7 3.5h7l4 4v13H7z"/><path d="M14 3.5v4h4"/></svg>',
    doc: '<svg viewBox="0 0 24 24"><path d="M7 3.5h7l4 4v13H7z"/><path d="M14 3.5v4h4M9.5 12.5h6M9.5 16h4"/></svg>',
    block: '<svg viewBox="0 0 24 24"><rect x="6" y="4.5" width="12" height="16" rx="2"/><path d="M9.5 4.5V3.5h5v1M9 10h6M9 13.5h6M9 17h3"/></svg>',
    receipt: '<svg viewBox="0 0 24 24"><path d="M6 3.5h12v17l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3z"/><path d="M9 8h6M9 11.5h6M9 15h3.5"/></svg>',
    car: '<svg viewBox="0 0 24 24"><path d="M5 16.5V12l2-5h10l2 5v4.5M3.5 16.5h17M7 19v-2.5M17 19v-2.5"/><circle cx="8" cy="13.5" r=".8"/><circle cx="16" cy="13.5" r=".8"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    trash: '<svg viewBox="0 0 24 24"><path d="M5 7h14M10 7V4.5h4V7M7 7l1 13h8l1-13"/></svg>',
    copy: '<svg viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/></svg>',
    mail: '<svg viewBox="0 0 24 24"><rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M4 7l8 6 8-6"/></svg>',
    cal: '<svg viewBox="0 0 24 24"><rect x="4" y="5.5" width="16" height="14.5" rx="2"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/></svg>',
    info: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8v.2"/></svg>',
    bell: '<svg viewBox="0 0 24 24"><path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/></svg>',
    alert: '<svg viewBox="0 0 24 24"><path d="M12 4l9 16H3z"/><path d="M12 10v4.5M12 17.2v.2"/></svg>',
    euro: '<svg viewBox="0 0 24 24"><path d="M17.5 6.5A7 7 0 1 0 17.5 17.5M4.5 10.5h9M4.5 13.5h9"/></svg>',
    share: '<svg viewBox="0 0 24 24"><path d="M12 3.5v11M8 7.5l4-4 4 4M6 11v8.5h12V11"/></svg>',
    cloud: '<svg viewBox="0 0 24 24"><path d="M7 18.5a4.5 4.5 0 0 1-.6-9A6 6 0 0 1 18 10a4 4 0 0 1-.5 8.5z"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    school: '<svg viewBox="0 0 24 24"><path d="M3 9.5 12 5l9 4.5-9 4.5z"/><path d="M7 11.5V16c2.8 2 7.2 2 10 0v-4.5M21 9.5v5"/></svg>',
    shield: '<svg viewBox="0 0 24 24"><path d="M12 3.5 19 6v6c0 4.2-3 7.2-7 8.5-4-1.3-7-4.3-7-8.5V6z"/></svg>'
  };

  const st = { db: null, rules: {}, chain: {}, inbox: [], tab: LS.get('tab', 'home'), year: null, q: '', filter: 'alle', stack: [], sheet: null, files: {}, ocrJobs: {} };

  /* ================= Daten ================= */
  function recalc() {
    st.chain = G.taxChain(st.db, st.rules);
    st.inbox = G.inbox(st.db, today(), st.rules, st.chain);
    if (G.Push) G.Push.send(G.reminders(st.db, today(), st.rules, st.inbox.length));
  }
  let saveT = null;
  function commit(opts = {}) {
    recalc();
    clearTimeout(saveT);
    saveT = setTimeout(() => S.save(st.db), 50);
    Sync.schedule(opts.now ? 1500 : 8000);
    if (opts.render !== false) refresh();
  }
  const touch = o => { o.upd = now(); return o; };
  const setS = (k, v) => { st.db.settings[k] = v; st.db.settings.upd = now(); };

  /* ================= Hilfen ================= */
  function toast(msg, ms = 2600, act) {
    const t = $('#toast');
    t.innerHTML = '<span>' + esc(msg) + '</span>' + (act ? '<button type="button" data-a="toastAct">' + esc(act.l) + '</button>' : '');
    t.hidden = false; st.toastAct = act ? act.fn : null;
    clearTimeout(t._t); t._t = setTimeout(() => { t.hidden = true; }, act ? Math.max(ms, 5000) : ms);
  }
  const haptic = () => { try { navigator.vibrate && navigator.vibrate(8); } catch (e) { } };
  const daysWord = n => n === 0 ? 'heute' : n === 1 ? 'morgen' : n === -1 ? 'gestern' : n < 0 ? 'vor ' + (-n) + ' Tagen' : 'in ' + n + ' Tagen';
  const catL = k => (G.CAT[k] || {}).l || 'Ohne Kategorie';
  const fileURL = id => st.files[id] || null;
  async function loadFileURL(id) {
    if (st.files[id]) return st.files[id];
    const f = await S.getFile(id); if (!f || !f.blob) return null;
    st.files[id] = URL.createObjectURL(f.blob); return st.files[id];
  }
  function thumbOf(r) {
    const f = (r.files || []).find(x => x.type === 'jpg');
    if (!f) return '<span class="thumb">' + I.receipt + '</span>';
    const u = fileURL(f.id);
    if (!u) { loadFileURL(f.id).then(x => { if (x) document.querySelectorAll('[data-thumb="' + f.id + '"]').forEach(im => { im.src = x; }); }); }
    return '<img class="thumb" alt="" data-thumb="' + f.id + '" src="' + (u || 'data:image/gif;base64,R0lGODlhAQABAAAAACw=') + '">';
  }
  function head(title, lead, extra) {
    return '<header class="top"><div class="top-row"><h1>' + esc(title) + '</h1>' + (extra || '') + '<button class="icon-btn" type="button" data-a="settings" aria-label="Einstellungen">' + I.gear + '</button></div>' + (lead ? '<p class="lead">' + lead + '</p>' : '') + '</header>';
  }
  // Jahr, um das es gerade geht: bis die Erklärung des Vorjahres abgegeben ist, das Vorjahr (Jan–Jul: Lohnsteuerbescheinigung, Abgabe)
  const defaultYear = () => {
    const y = +today().slice(0, 4);
    if (RULE_YEARS.includes(y - 1) && st.db && !(st.db.tax[y - 1] || {}).filed && today() <= y + '-07-31') return y - 1;
    return RULE_YEARS.includes(y) ? y : y > RULE_YEARS[RULE_YEARS.length - 1] ? RULE_YEARS[RULE_YEARS.length - 1] : RULE_YEARS[0];
  };

  /* ================= Ansichten (Reiter) ================= */
  function render() {
    document.querySelectorAll('.tabbar [data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === st.tab));
    const v = $('#view');
    v.innerHTML = st.tab === 'belege' ? viewBelege() : st.tab === 'vertraege' ? viewVertraege() : st.tab === 'steuer' ? viewSteuer() : viewHome();
  }
  function refresh() { render(); if (st.stack.length) renderPage(); if (st.sheet) renderSheet(); }

  // ---------- Übersicht ----------
  function inboxRow(i) {
    const icon = { pruefen: I.receipt, kuendigung: I.doc, rueckgabe: I.receipt, gewaehr: I.shield, garantie: I.shield, noetig: I.doc, lohnsteuer: I.euro, steuerfrist: I.cal }[i.kind] || I.info;
    const when = i.days != null && i.kind !== 'pruefen' ? ' · ' + daysWord(i.days) : '';
    return '<button type="button" class="row" data-a="inboxOpen" data-key="' + esc(i.key) + '"><span class="ic' + (i.sev === 'red' ? ' red' : '') + '">' + icon + '</span><span class="main"><span class="t ell">' + esc(i.t) + '</span><span class="s">' + esc(i.sub) + '<span class="' + (i.sev === 'red' ? 'red' : '') + '">' + esc(when) + '</span></span></span>' + I.chev + '</button>';
  }
  function viewHome() {
    const yr = defaultYear();
    const res = st.chain[yr];
    let h = head('Übersicht', 'Hier steht nur, was du tun musst. Belege, Fahrten und Fristen sammelt Geldwerk von selbst.');
    h += '<div class="sec-h"><h2>Zu erledigen</h2>' + (st.inbox.length ? '<span class="muted">' + st.inbox.length + '</span>' : '') + '</div>';
    if (!st.inbox.length) h += '<div class="card done"><div class="check">' + I.check + '</div><b>Alles erledigt</b><span class="muted">Neue Belege einfach mit dem Plus fotografieren.</span></div>';
    else h += '<div class="list">' + st.inbox.slice(0, 8).map(inboxRow).join('') + '</div>' + (st.inbox.length > 8 ? '<p class="hint">… und ' + (st.inbox.length - 8) + ' weitere</p>' : '');
    // Kacheln
    h += '<div class="sec-h"><h2>Auf einen Blick</h2></div><div class="tiles">';
    h += '<button type="button" class="tile wide" data-a="tab" data-t="steuer">' + refundTile(res, yr) + '</button>';
    const cs = G.live(st.db, 'contracts').filter(c => !c.ended);
    const fix = cs.reduce((a, c) => a + G.monthly(c), 0);
    h += '<button type="button" class="tile" data-a="tab" data-t="vertraege"><span class="lbl">Fixkosten</span><span class="mid">' + eur(Math.round(fix)) + '</span><span class="sub">pro Monat · ' + cs.length + (cs.length === 1 ? ' Vertrag' : ' Verträge') + '</span></button>';
    const nx = nextDeadline();
    h += '<button type="button" class="tile" data-a="' + (nx ? 'inboxOpenDl' : 'tab') + '" data-t="vertraege" data-key="' + (nx ? esc(nx.key) : '') + '"><span class="lbl">Nächste Frist</span>' +
      (nx ? '<span class="mid' + (nx.days < 0 ? ' red' : '') + '">' + (nx.days === 0 ? 'Heute' : nx.days === 1 ? '1 Tag' : nx.days + ' Tage') + '</span><span class="sub ell" style="white-space:normal">' + esc(nx.label) + '</span>' : '<span class="mid">–</span><span class="sub">Keine Frist offen</span>') + '</button>';
    h += '</div>';
    h += syncStatusLine();
    return h;
  }
  function refundTile(res, yr) {
    if (!res) return '<span class="lbl">Steuer</span>';
    if (res.noIncome && res.loss > 0) return '<span class="lbl">Steuer ' + yr + '</span><span class="big">' + eur(Math.round(res.carryOut)) + '</span><span class="sub">Verlustvortrag gesichert, sobald du die Erklärung abgibst</span>';
    if (res.refund != null) return '<span class="lbl">Erstattung ' + yr + '</span><span class="big ' + (res.refund >= 0 ? 'green' : '') + '">' + (res.refund >= 0 ? 'ca. ' + eur(Math.round(res.refund / 10) * 10) : eur(Math.round(res.refund))) + '</span><span class="sub">' + (res.refund >= 0 ? 'zurück · Spanne ' + eur(Math.max(0, Math.floor(res.range[0] / 10) * 10)) + ' – ' + eur(Math.ceil(res.range[1] / 10) * 10) : 'Nachzahlung möglich') + ' · Schätzung</span>';
    return '<span class="lbl">Steuer ' + yr + '</span><span class="big">' + eur(Math.round(res.wk)) + '</span><span class="sub">Werbungskosten gesammelt. Die Erstattung erscheint, sobald Lohn und Lohnsteuer eingetragen sind.</span>';
  }
  function nextDeadline() {
    const t = today();
    const list = G.deadlinesOf(st.db, t).filter(x => !(x.kind === 'kuendigung' && x.anytime) && x.d >= t).map(x => ({ key: x.key, d: x.d, days: G.diffDays(t, x.d), label: x.t + ': ' + x.sub }));
    for (const y of RULE_YEARS) { const f = st.rules[y] && st.rules[y].regeln.fristen; if (f && !(st.db.tax[y] || {}).filed && t > y + '-12-31' && f.pflicht >= t) list.push({ key: 'f:' + y, d: f.pflicht, days: G.diffDays(t, f.pflicht), label: 'Steuererklärung ' + y }); }
    return list.sort((a, b) => a.d < b.d ? -1 : 1)[0] || null;
  }
  function syncStatusLine() {
    const c = Sync.cfg(), s = LS.get('syncState', {});
    if (!c) return '<p class="status">Nur auf diesem Gerät gespeichert. <button type="button" data-a="settings" data-sec="sync">Sicherung einrichten</button></p>';
    if (s.err) return '<p class="status"><span class="red">Sicherung: ' + esc(s.err) + '</span> <button type="button" data-a="syncNow">Erneut</button></p>';
    return '<p class="status">' + (s.last ? 'Gesichert ' + ago(s.last) : 'Sicherung eingerichtet') + (s.pendingFiles ? ' · ' + s.pendingFiles + ' Fotos warten' : '') + '</p>';
  }
  const ago = t => { const m = Math.round((now() - t) / 60000); return m < 1 ? 'gerade eben' : m < 60 ? 'vor ' + m + ' Min.' : m < 1440 ? 'vor ' + Math.round(m / 60) + ' Std.' : 'am ' + G.fmtDate(new Date(t).toISOString().slice(0, 10)); };

  // ---------- Belege ----------
  function receiptMatches(r, q) {
    if (!q) return true;
    const s = (r.merchant + ' ' + catL(r.cat) + ' ' + (r.note || '') + ' ' + G.fmtDate(r.date) + ' ' + money(r.amount) + ' ' + (r.text || '').slice(0, 2000)).toLowerCase();
    return q.toLowerCase().split(/\s+/).every(w => s.includes(w));
  }
  function receiptList() {
    const t = today(), y = st.year;
    let list = G.live(st.db, 'receipts').filter(r => receiptMatches(r, st.q));
    if (st.filter === 'steuer') list = list.filter(r => G.CAT[r.cat] && G.CAT[r.cat].area && G.receiptYearAmount(r, y, st.rules[y]) > 0);
    if (st.filter === 'garantie') list = list.filter(r => { const x = G.receiptDates(r); return (x.warrantyUntil && x.warrantyUntil >= t) || (x.guaranteeUntil && x.guaranteeUntil >= t); });
    if (st.filter === 'pruefen') list = list.filter(G.isUnsure);
    list.sort((a, b) => (b.date || '') < (a.date || '') ? -1 : (b.date || '') > (a.date || '') ? 1 : (b.upd || 0) - (a.upd || 0));
    return list;
  }
  function receiptRow(r) {
    const x = G.receiptDates(r), t = today();
    let badge = '';
    if (G.isUnsure(r)) badge = '<span class="tag warn">prüfen</span> ';
    else if (x.returnUntil && x.returnUntil >= t) badge = '<span class="tag">Rückgabe bis ' + G.fmtShort(x.returnUntil) + '</span> ';
    return '<button type="button" class="row" data-a="openReceipt" data-id="' + r.id + '">' + thumbOf(r) + '<span class="main"><span class="t ell">' + esc(r.merchant || 'Beleg') + '</span><span class="s ell">' + badge + esc(catL(r.cat)) + (r.date ? ' · ' + G.fmtShort(r.date) : '') + '</span></span><span class="v">' + (r.amount != null ? eur(r.amount, 2) : '–') + '</span></button>';
  }
  function receiptListHtml() {
    const list = receiptList();
    if (!list.length) return '<div class="empty">' + (G.live(st.db, 'receipts').length ? 'Nichts gefunden.' : 'Noch keine Belege. Tippe unten auf Plus und fotografiere den ersten Kassenbon.') + '</div>';
    let h = '', cur = null, buf = [];
    const flush = () => { if (buf.length) h += '<div class="month-h">' + esc(cur) + '</div><div class="list">' + buf.join('') + '</div>'; buf = []; };
    for (const r of list) { const m = r.date ? G.MONTHS[+r.date.slice(5, 7) - 1] + ' ' + r.date.slice(0, 4) : 'Ohne Datum'; if (m !== cur) { flush(); cur = m; } buf.push(receiptRow(r)); }
    flush();
    return h;
  }
  function viewBelege() {
    const n = G.live(st.db, 'receipts').length, un = G.live(st.db, 'receipts').filter(G.isUnsure).length;
    let h = head('Belege', 'Jeden Beleg mit dem Plus fotografieren – Datum, Betrag und Kategorie erkennt Geldwerk selbst.');
    h += '<div class="search"><input class="inp" type="search" placeholder="Suchen: Händler, Betrag, Text …" value="' + esc(st.q) + '" data-in="q" enterkeyhint="search" autocomplete="off" aria-label="Belege durchsuchen"></div>';
    const F = [['alle', 'Alle ' + n], ['steuer', 'Steuer ' + String(st.year).slice(2)], ['garantie', 'Garantie'], ['pruefen', 'Prüfen' + (un ? ' ' + un : '')]];
    h += '<div class="filters">' + F.map(([k, l]) => '<button type="button" class="chip' + (st.filter === k ? ' on' : '') + '" data-a="filter" data-f="' + k + '">' + esc(l) + '</button>').join('') + '</div>';
    h += '<div id="rlist">' + receiptListHtml() + '</div>';
    return h;
  }

  // ---------- Verträge ----------
  function viewVertraege() {
    const t = today();
    const dl = c => (G.nextCancel(c, t) || {}).deadline || 'z';
    const cs = G.live(st.db, 'contracts').sort((a, b) => (!!a.ended - !!b.ended) || (dl(a) < dl(b) ? -1 : dl(a) > dl(b) ? 1 : 0));
    const active = cs.filter(c => !c.ended);
    const fix = active.reduce((a, c) => a + G.monthly(c), 0);
    let h = head('Verträge', 'Jeden Vertrag einmal eintragen – Geldwerk sagt dir rechtzeitig, bis wann du kündigen kannst.');
    h += '<div class="card navy"><span class="flabel" style="margin:0">FIXKOSTEN</span><div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap"><b style="font-size:34px;font-weight:900;letter-spacing:-.02em">' + eur(Math.round(fix)) + '</b><span class="muted">pro Monat · ' + eur(Math.round(fix * 12)) + ' im Jahr</span></div></div>';
    h += '<div class="sec-h"><h2>Deine Verträge</h2><button type="button" data-a="newContract">+ Vertrag</button></div>';
    if (!cs.length) return h + '<div class="empty">Noch keine Verträge. Tippe auf „+ Vertrag“ und wähle eine Vorlage – z. B. Kfz-Versicherung.</div>';
    h += '<div class="list">' + cs.map(c => {
      const n = G.nextCancel(c, t), pc = G.priceChange(c);
      let s = c.ended ? 'Gekündigt zum ' + G.fmtDate(c.ended) : !n || n.unknown ? 'Beginn fehlt – Frist unbekannt' : n.anytime ? 'Jederzeit kündbar · Ende frühestens ' + G.fmtShort(n.end) + n.end.slice(0, 4) : 'Kündigen bis ' + G.fmtDate(n.deadline) + ' · ' + daysWord(n.days);
      const soon = n && !n.anytime && n.days != null && n.days <= 30 && !c.ended;
      return '<button type="button" class="row" data-a="openContract" data-id="' + c.id + '"><span class="ic">' + I.doc + '</span><span class="main"><span class="t ell">' + esc(c.name || c.provider || 'Vertrag') + (c.name && c.provider ? ' <span class="muted" style="font-weight:400">· ' + esc(c.provider) + '</span>' : '') + '</span><span class="s">' + (soon ? '<span class="tag">' + esc(s) + '</span>' : esc(s)) + (pc && pc.pct ? ' <span class="tag grey">' + (pc.pct > 0 ? '+' : '') + String(pc.pct).replace('.', ',') + ' %</span>' : '') + '</span></span><span class="v">' + (c.amount != null ? eur(c.amount, 2) : '–') + '<span class="s" style="display:block;font-weight:400">' + esc((G.RHYTHM[c.rhythm] || G.RHYTHM.m).l) + '</span></span></button>';
    }).join('') + '</div>';
    return h;
  }

  // ---------- Steuer ----------
  function viewSteuer() {
    const y = st.year, res = st.chain[y], R = st.rules[y];
    let h = '<header class="top"><div class="top-row"><h1>Steuer</h1><button class="icon-btn" type="button" data-a="settings" aria-label="Einstellungen">' + I.gear + '</button></div>';
    h += '<div class="seg yearseg" role="tablist">' + RULE_YEARS.map(x => '<button type="button" class="' + (x === y ? 'on' : '') + '" data-a="year" data-y="' + x + '">' + x + '</button>').join('') + '</div>';
    h += '<button type="button" class="disc" data-a="rules">' + I.info + '<span>Keine Steuerberatung – Regeln mit Quelle und Stand ›</span></button></header>';
    if (!res || !R) return h + '<div class="empty">Für ' + y + ' gibt es noch keine Regeldatei.</div>';
    // Ergebnis
    h += '<div class="hero">';
    if (res.noIncome && res.loss > 0) h += '<div class="lbl">Verlustvortrag ' + y + '</div><div class="big">' + eur(Math.round(res.carryOut)) + '</div><div class="sub">Gesichert, sobald du die Erklärung abgibst – er senkt später die Steuer auf deinen Lohn. Abgabe bis ' + G.fmtDate(R.regeln.fristen.verlust) + '.</div>';
    else if (res.refund != null) {
      const pos = res.refund >= 0;
      h += '<div class="lbl">' + (pos ? 'Erstattung ' : 'Nachzahlung ') + y + ' · Schätzung</div><div class="big ' + (pos ? 'green' : '') + '">ca. ' + eur(Math.abs(Math.round(res.refund / 10) * 10)) + '</div><div class="sub">' + (pos ? 'zurück vom Finanzamt · ' : '') + 'Spanne ' + eur(Math.floor(res.range[0] / 10) * 10) + ' bis ' + eur(Math.ceil(res.range[1] / 10) * 10) + (res.loss > 0 ? ' · Verlust ' + eur(Math.round(res.loss)) + ' wird vorgetragen' : '') + (!R.regeln.tarif.geprueft ? ' · Tarif ungeprüft' : '') + (res.vorsorge.estimated ? ' · Sozialversicherung geschätzt' : '') + '</div>';
    } else h += '<div class="lbl">Werbungskosten ' + y + '</div><div class="big">' + eur(Math.round(res.wk)) + '</div><div class="sub">' + (res.trips.work.days ? 'Für die Erstattung fehlen noch Bruttolohn und Lohnsteuer – trag sie unten ein oder füge die Lohnsteuerbescheinigung als Block ein.' : 'Gesammelt für dieses Jahr.') + '</div>';
    h += '</div>';
    // Werbungskosten
    h += '<div class="sec-h"><h2>So setzt es sich zusammen</h2></div><div class="list lines">';
    for (const l of res.lines) {
      const act = l.area === 'fahrten' || l.key === 'tagespauschale' ? 'data-a="openCal"' : l.key.startsWith('belege-') || l.key === 'zuschuss' ? 'data-a="filterTax"' : l.rule ? 'data-a="rules"' : '';
      h += '<button type="button" class="row" ' + act + '><span class="main"><span class="t">' + esc(l.l) + (l.sure ? '' : ' <span class="tag grey">ungeprüft</span>') + '</span><span class="s">' + esc(l.detail || '') + '</span></span><span class="v' + (l.eur < 0 ? ' muted' : '') + '">' + eur(l.eur, 0) + '</span></button>';
    }
    if (!res.lines.length) h += '<div class="row"><span class="main"><span class="s">Noch nichts gesammelt. Fahrten erscheinen, sobald die Kilometer eingetragen sind.</span></span></div>';
    h += '<div class="sum-row"><span>Werbungskosten</span><span>' + eur(Math.round(res.wk)) + '</span></div></div>';
    if (res.gross > 0 || res.trips.work.days) h += '<p class="hint">' + (res.wk > res.pausch ? 'Mehr als der Arbeitnehmer-Pauschbetrag (' + eur(res.pausch) + ') – es zählen deine echten Kosten.' : 'Weniger als der Arbeitnehmer-Pauschbetrag – das Finanzamt rechnet automatisch mit ' + eur(res.pausch) + '.') + '</p>';
    // Angaben
    const t = st.db.tax[y] || {};
    h += '<div class="sec-h"><h2>Deine Angaben ' + y + '</h2></div><div class="list">';
    h += '<button type="button" class="row" data-a="sheetLst"><span class="ic">' + I.euro + '</span><span class="main"><span class="t">Lohn und Lohnsteuer</span><span class="s">' + (res.hasLSt ? 'Brutto ' + eur(t.gross) + ' · Lohnsteuer ' + eur(t.lst) : res.trips.work.days ? 'Fehlt noch – aus Gehaltsabrechnung oder Lohnsteuerbescheinigung' : 'Kein Lohn in diesem Jahr (Minijob zählt nicht)') + '</span></span>' + I.chev + '</button>';
    h += '<button type="button" class="row" data-a="sheetZuschuss"><span class="ic">' + I.school + '</span><span class="main"><span class="t">Aufstiegs-BAföG</span><span class="s">' + (t.zuschuss ? 'Zuschuss Lehrgang/Prüfung ' + eur(t.zuschuss) + ' wird abgezogen' : 'Zuschussanteil Lehrgangs- und Prüfungsgebühren eintragen') + '</span></span>' + I.chev + '</button>';
    h += '<button type="button" class="row" data-a="sheetCarry"><span class="ic">' + I.cal + '</span><span class="main"><span class="t">Verlustvortrag aus ' + (y - 1) + '</span><span class="s">' + eur(res.carryIn) + (y === RULE_YEARS[0] ? ' · aus deiner letzten Erklärung' : ' · aus ' + (y - 1) + ' übernommen') + '</span></span>' + I.chev + '</button>';
    h += '</div>';
    // Abgabe
    const f = R.regeln.fristen, filed = !!t.filed;
    h += '<div class="sec-h"><h2>Abgabe</h2></div><div class="card"><div class="muted" style="font-size:14.5px">' + esc(f.text) + (f.geprueft ? '' : ' <span class="tag grey">ungeprüft</span>') + '</div>';
    if (res.loss > 0) h += '<div class="info"><b>Tipp:</b> Auch ohne Lohn abgeben – nur dann wird der Verlust von ' + eur(Math.round(res.loss)) + ' festgestellt und senkt später deine Steuer.</div>';
    h += '<button type="button" class="toggle' + (filed ? ' on' : '') + '" data-a="filed" style="margin-top:8px"><span class="main"><b>Erklärung ' + y + ' abgegeben</b><div class="muted" style="font-size:13.5px">Stoppt die Erinnerungen an die Frist</div></span><span class="sw"></span></button></div>';
    // Jahresende
    h += '<div class="sec-h"><h2>Für die Erklärung</h2></div>';
    h += '<button type="button" class="bigopt" data-a="cheat"><span class="ic">' + I.doc + '</span><span>ELSTER-Spickzettel<small>Welcher Betrag in welchen Bereich gehört</small></span></button>';
    h += '<button type="button" class="bigopt" data-a="mappe"><span class="ic">' + I.share + '</span><span>Steuermappe als PDF<small>Übersicht, Fahrten, alle Belege mit Fotos</small></span></button>';
    h += '<button type="button" class="bigopt" data-a="openCal"><span class="ic">' + I.car + '</span><span>Fahrten-Kalender ' + y + '<small>' + res.trips.work.days + ' Arbeitstage, ' + res.trips.school.days + ' Schultage – Ausnahmen antippen</small></span></button>';
    return h;
  }

  /* ================= Vollbild-Seiten ================= */
  function pushPage(p) { st.stack.push(p); renderPage(true); }
  function popPage() {
    const el = $('#page');
    const p = st.stack.pop();
    if (p && p.onClose) p.onClose();
    if (!st.stack.length) { el.classList.add('out'); setTimeout(() => { if (!st.stack.length) { el.hidden = true; el.classList.remove('out'); el.innerHTML = ''; document.body.classList.remove('overlay'); } }, 200); render(); }
    else renderPage();
  }
  function closeAllPages() { while (st.stack.length) { const p = st.stack.pop(); if (p.onClose) p.onClose(); } $('#page').hidden = true; $('#page').innerHTML = ''; document.body.classList.remove('overlay'); render(); }
  function renderPage(anim) {
    const p = st.stack[st.stack.length - 1]; if (!p) return;
    const el = $('#page');
    const keepScroll = !anim ? el.scrollTop : 0;
    const ae = document.activeElement; let fk = null, sel = null;
    if (!anim && ae && el.contains(ae) && ae.dataset && (ae.dataset.in || ae.dataset.ch)) { fk = (ae.dataset.in || ae.dataset.ch) + '|' + (ae.dataset.k || ''); try { sel = [ae.selectionStart, ae.selectionEnd]; } catch (e) { } }
    el.innerHTML = PAGES[p.k](p);
    if (fk) { const n = [...el.querySelectorAll('[data-in],[data-ch]')].find(x => (x.dataset.in || x.dataset.ch) + '|' + (x.dataset.k || '') === fk); if (n) { n.focus({ preventScroll: true }); try { if (sel && sel[0] != null) n.setSelectionRange(sel[0], sel[1]); } catch (e) { } } }
    el.hidden = false; document.body.classList.add('overlay');
    if (anim) { el.classList.remove('up'); void el.offsetWidth; el.style.animation = 'none'; void el.offsetWidth; el.style.animation = ''; }
    el.scrollTop = keepScroll;
  }
  const bar = (title, left, right) => '<div class="pbar"><button type="button" data-a="' + (left && left.a || 'back') + '">' + (left && left.l != null ? esc(left.l) : I.back + 'Zurück') + '</button><span class="pt ell">' + esc(title) + '</span>' + (right ? '<button type="button" data-a="' + right.a + '">' + esc(right.l) + '</button>' : '<span style="min-width:64px"></span>') + '</div>';
  const PAGES = {};

  // ---------- Einrichtung ----------
  const WD = [0, 1, 2, 3, 4, 5, 6];
  const dayChips = (key, sel) => '<div class="chips">' + WD.map(d => '<button type="button" class="chip' + (sel.includes(d) ? ' on' : '') + '" data-a="setupDay" data-k="' + key + '" data-d="' + d + '" aria-pressed="' + sel.includes(d) + '">' + G.DOW[d] + '</button>').join('') + '</div>';
  const SETUP_STEPS = ['welcome', 'kmWork', 'work', 'vacation', 'kmSchool', 'school', 'job', 'wage', 'backup', 'push', 'done'];
  PAGES.setup = p => {
    const s = st.db.settings, k = SETUP_STEPS[p.step];
    let h = '<div class="setup">';
    h += '<div class="pbar">' + (p.step > 0 && k !== 'done' ? '<button type="button" data-a="setupBack">' + I.back + 'Zurück</button>' : '<span style="min-width:64px"></span>') + '<div class="dots">' + SETUP_STEPS.slice(1, -1).map((_, i) => '<i class="' + (i + 1 === p.step ? 'on' : '') + '"></i>').join('') + '</div>' + (['wage', 'backup', 'push'].includes(k) ? '<button type="button" data-a="setupNext" data-skip="1">Später</button>' : '<span style="min-width:64px"></span>') + '</div><div class="pbody">';
    const next = (label, dis) => '<div class="grow"></div><div class="btns" style="margin-top:22px"><button type="button" class="btn primary" data-a="setupNext"' + (dis ? ' disabled' : '') + '>' + (label || 'Weiter') + '</button></div>';
    if (k === 'welcome') {
      h += '<img class="logo" src="icon-192.png" alt=""><div class="q">Willkommen bei Geldwerk</div><p class="lead">Belege, Fahrten und Verträge sammeln sich hier fast von selbst. Am Jahresende bekommst du eine fertige Steuermappe.</p>';
      h += '<div class="info">9 kurze Fragen, dauert 2–3 Minuten. Alles ist später in den Einstellungen änderbar.</div>';
      h += '<div class="grow"></div><div class="btns" style="margin-top:22px"><button type="button" class="btn primary" data-a="setupNext">Los geht’s</button><button type="button" class="btn ghost" data-a="restoreStart">Ich habe schon eine Sicherung</button></div>';
    } else if (k === 'kmWork') {
      h += '<div class="q">Wie weit ist es von deiner Wohnung zur Arbeit?</div><p class="lead">' + esc(s.work.place) + ' · einfache Strecke, kürzeste Straßenverbindung</p>';
      h += '<label class="field"><span>Kilometer</span><input class="inp big" type="text" inputmode="decimal" placeholder="z. B. 28" value="' + esc(money(s.kmWork)) + '" data-in="setKm" data-k="kmWork" autocomplete="off"></label>';
      h += '<p class="hint">Gezählt werden nur volle Kilometer (28,9 km → 28 km). Routenplaner: kürzeste Strecke.</p>' + next('Weiter', !(+s.kmWork > 0));
    } else if (k === 'work') {
      h += '<div class="q">Wann hast du dort gearbeitet?</div><p class="lead">Vollzeit bis zur Fortbildung, an diesen Wochentagen.</p>';
      h += '<div class="two" style="margin-top:14px"><label class="field"><span>Von</span><input class="inp" type="date" value="' + s.work.from + '" data-ch="setRange" data-k="work" data-f="from"></label><label class="field"><span>Bis</span><input class="inp" type="date" value="' + s.work.to + '" data-ch="setRange" data-k="work" data-f="to"></label></div>';
      h += '<div class="field"><span class="flabel">Arbeitstage</span>' + dayChips('work', s.work.days) + '</div><p class="hint">Feiertage in Niedersachsen zieht Geldwerk selbst ab.</p>' + next();
    } else if (k === 'vacation') {
      const y = +s.work.from.slice(0, 4);
      h += '<div class="q">Wie viele Urlaubstage hattest du bis ' + G.fmtDate(s.work.to).slice(0, 6) + '?</div><p class="lead">An Urlaubstagen bist du nicht zur Arbeit gefahren. Vorbelegt: 30 Tage im Jahr anteilig.</p>';
      h += '<div class="field"><div class="stepper"><button type="button" data-a="vacStep" data-d="-1" aria-label="Weniger">−</button><input type="text" inputmode="numeric" value="' + ((s.vacation || {})[y] || 0) + '" data-in="vac" aria-label="Urlaubstage"><button type="button" data-a="vacStep" data-d="1" aria-label="Mehr">+</button></div></div>';
      h += '<p class="hint">Krankheitstage kannst du später im Fahrten-Kalender antippen.</p>' + next();
    } else if (k === 'kmSchool') {
      h += '<div class="q">Wie weit ist es zur Schule?</div><p class="lead">' + esc(s.school.place) + ' · einfache Strecke</p>';
      h += '<label class="field"><span>Kilometer</span><input class="inp big" type="text" inputmode="decimal" placeholder="z. B. 22" value="' + esc(money(s.kmSchool)) + '" data-in="setKm" data-k="kmSchool" autocomplete="off"></label>';
      h += '<p class="hint">Die Schule zählt bei Vollzeit-Fortbildung als erste Tätigkeitsstätte: 0,38 € je km und Schultag.</p>' + next('Weiter', !(+s.kmSchool > 0));
    } else if (k === 'school') {
      h += '<div class="q">Wann gehst du zur Schule?</div><p class="lead">Ferien und Feiertage in Niedersachsen zieht Geldwerk selbst ab.</p>';
      h += '<div class="two" style="margin-top:14px"><label class="field"><span>Von</span><input class="inp" type="date" value="' + s.school.from + '" data-ch="setRange" data-k="school" data-f="from"></label><label class="field"><span>Bis</span><input class="inp" type="date" value="' + s.school.to + '" data-ch="setRange" data-k="school" data-f="to"></label></div>';
      h += '<div class="field"><span class="flabel">Schultage</span>' + dayChips('school', s.school.days) + '</div>' + next();
    } else if (k === 'job') {
      h += '<div class="q">An welchen Tagen ist dein Minijob?</div><p class="lead">Nur zur Übersicht im Kalender.</p>';
      h += '<div class="field">' + dayChips('jobDays', s.jobDays) + '</div><div class="info">Der Minijob ist pauschal versteuert. Dafür gibt es keine Werbungskosten – die Fahrten dorthin zählen nicht. An Tagen mit Schule zählt nur der Weg zur Schule.</div>' + next();
    } else if (k === 'wage') {
      const y = +s.work.from.slice(0, 4), t = st.db.tax[y] || {};
      h += '<div class="q">Lohn ' + y + ' bis Juli</div><p class="lead">Damit Geldwerk die Erstattung schon jetzt schätzen kann. Steht auf deiner letzten Gehaltsabrechnung unter „Jahreswerte“ – oder später auf der Lohnsteuerbescheinigung.</p>';
      h += lstFields(y, t, true) + next('Weiter');
    } else if (k === 'backup') {
      h += '<div class="q">Sicherung in dein privates GitHub</div><p class="lead">Fotos und Daten liegen zusätzlich im privaten Repository „' + Y.REPO_NAME + '“. Bei einem neuen iPhone kommt alles zurück.</p>';
      h += backupForm(p);
      h += '<div class="grow"></div><div class="btns" style="margin-top:22px">' + (Sync.cfg() ? '<button type="button" class="btn primary" data-a="setupNext">Weiter</button>' : '<button type="button" class="btn primary" data-a="syncConnect">Verbinden</button><button type="button" class="btn ghost" data-a="setupNext" data-skip="1">Später einrichten</button>') + '</div>';
    } else if (k === 'push') {
      h += '<div class="q">Erinnerungen aufs iPhone</div><p class="lead">Kündigungsfristen 14 und 3 Tage vorher, Rückgabe, Gewährleistung, Steuerfrist – um 8 Uhr morgens. Ohne Mitteilungen stehen dieselben Fristen in der Übersicht.</p>';
      h += pushForm(p);
      h += '<div class="grow"></div><div class="btns" style="margin-top:22px">' + (G.Push.isOn() ? '<button type="button" class="btn primary" data-a="setupNext">Weiter</button>' : '<button type="button" class="btn primary" data-a="pushOn">Mitteilungen erlauben</button><button type="button" class="btn ghost" data-a="setupNext" data-skip="1">Später</button>') + '</div>';
    } else if (k === 'done') {
      const res = st.chain[defaultYear()];
      h += '<div class="done" style="margin-top:40px"><div class="check">' + I.check + '</div><b>Fertig eingerichtet</b></div>';
      if (res) h += '<div class="card" style="margin-top:10px"><div class="flabel" style="margin:0 0 4px">FAHRTEN ' + defaultYear() + ' – SCHON BERECHNET</div><div style="font-size:30px;font-weight:900">' + eur(Math.round(res.trips.eur || 0)) + '</div><div class="muted">' + res.trips.work.days + ' Arbeitstage und ' + res.trips.school.days + ' Schultage</div></div>';
      h += '<p class="lead" style="margin-top:14px">Ab jetzt: Beleg bekommen → Plus → fotografieren → „Passt“. Mehr ist nicht zu tun.</p>';
      h += '<div class="grow"></div><div class="btns" style="margin-top:22px"><button type="button" class="btn primary" data-a="setupFinish">Zur Übersicht</button></div>';
    }
    return h + '</div></div>';
  };
  function lstFields(y, t, compact) {
    const f = (k, l, hint) => '<label class="field"><span>' + l + '</span><input class="inp" type="text" inputmode="decimal" placeholder="0,00" value="' + esc(money2(t[k])) + '" data-in="lst" data-y="' + y + '" data-k="' + k + '" autocomplete="off">' + (hint ? '<div class="hint">' + hint + '</div>' : '') + '</label>';
    let h = '<div class="two" style="margin-top:14px">' + f('gross', 'Bruttolohn') + f('lst', 'Lohnsteuer') + '</div>';
    h += '<div class="two" style="margin-top:10px">' + f('kist', 'Kirchensteuer') + f('soli', 'Soli') + '</div>';
    if (!compact) h += '<div class="flabel" style="margin-top:18px">SOZIALVERSICHERUNG (ARBEITNEHMERANTEIL)</div><div class="two">' + f('rv', 'Renten&shy;versicherung') + f('kv', 'Kranken&shy;versicherung') + '</div><div class="two" style="margin-top:10px">' + f('pv', 'Pflege&shy;versicherung') + f('av', 'Arbeitslosen&shy;versicherung') + '</div><p class="hint">Leer lassen = Geldwerk schätzt sie (gut 21 % vom Brutto). Mit den echten Werten wird die Schätzung genauer.</p>';
    return h;
  }
  function backupForm(p) {
    const c = Sync.cfg(), s = LS.get('syncState', {});
    if (c) return '<div class="info"><b>Verbunden</b> mit ' + esc(c.repo) + (c.from ? ' (Zugang aus ' + esc(c.from) + ' übernommen)' : '') + '.' + (s.last ? ' Zuletzt gesichert ' + ago(s.last) + '.' : '') + '</div>';
    const owner = Sync.ownerGuess();
    let h = '<div class="info" style="margin-top:14px"><b>Einmalig auf github.com:</b><br>1. Neues privates Repository „' + Y.REPO_NAME + '“ anlegen.<br>2. Fine-grained Token: nur dieses Repository, „Contents: Read and write“.<br>Ausführlich: Abschlussanleitung, Schritt 2.</div>';
    h += '<label class="field"><span>Repository</span><input class="inp" type="text" autocapitalize="off" autocorrect="off" spellcheck="false" value="' + esc((p && p.repo != null) ? p.repo : owner + '/' + Y.REPO_NAME) + '" placeholder="name/' + Y.REPO_NAME + '" data-in="pf" data-k="repo"></label>';
    h += '<label class="field"><span>Schlüssel (Token) oder Zugangscode</span><input class="inp" type="password" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="github_pat_…" value="' + esc((p && p.token) || '') + '" data-in="pf" data-k="token"></label>';
    if (p && p.err) h += '<p class="err">' + esc(p.err) + '</p>';
    if (p && p.busy) h += '<p class="ocr"><span class="spin"></span>Prüfe Zugang …</p>';
    return h;
  }
  function pushForm(p) {
    const c = G.Push.cfg();
    let h = '';
    if (!G.Push.standalone()) h += '<div class="info">Mitteilungen gehen auf dem iPhone nur, wenn Geldwerk auf dem Home-Bildschirm liegt: in Safari <b>Teilen → „Zum Home-Bildschirm“</b>, dann von dort öffnen.</div>';
    if (G.Push.isOn()) return h + '<div class="info"><b>Mitteilungen sind an.</b> Fristen kommen um 8 Uhr.</div>';
    if (!c || (p && p.needCfg)) {
      h += '<p class="hint">Versand über deinen Formwerk-Worker (speichert nur Datum und kurzen Titel, keine Beträge).</p>';
      h += '<label class="field"><span>Worker-Adresse</span><input class="inp" type="text" inputmode="url" autocapitalize="off" autocorrect="off" spellcheck="false" value="' + esc((p && p.url) || (c && c.url) || G.Push.DEFAULT_URL) + '" data-in="pf" data-k="url"></label>';
      h += '<label class="field"><span>App-Passwort (wie in Formwerk)</span><input class="inp" type="password" autocomplete="current-password" value="' + esc((p && p.pw) || '') + '" data-in="pf" data-k="pw"></label>';
    } else if (c.adopted) h += '<div class="info">Worker-Zugang aus ' + esc(c.adopted === 'formwerk' ? 'Formwerk' : 'Satzwerk') + ' übernommen.</div>';
    if (p && p.err) h += '<p class="err">' + esc(p.err) + '</p>';
    if (p && p.busy) h += '<p class="ocr"><span class="spin"></span>Einen Moment …</p>';
    return h;
  }
  function openSetup(step) { st.stack = []; pushPage({ k: 'setup', step: step || 0 }); }

  // ---------- Beleg ----------
  function receiptDraft(r) { return JSON.parse(JSON.stringify(r)); }
  PAGES.receipt = p => {
    const d = p.d, isNew = p.isNew, un = new Set(d.unsure || []);
    const R = st.rules[defaultYear()];
    const img = (d.files || []).find(f => f.type === 'jpg'), pdf = (d.files || []).find(f => f.type === 'pdf');
    let h = bar(isNew ? 'Neuer Beleg' : 'Beleg', { a: 'receiptCancel', l: isNew ? 'Abbrechen' : null }, isNew ? null : { a: 'receiptDelete', l: 'Löschen' });
    h += '<div class="pbody">';
    if (img) { const u = fileURL(img.id); if (!u) loadFileURL(img.id).then(x => { const el = $('#rimg'); if (el && x) el.src = x; }); h += '<div class="photo" data-a="fullImg" data-id="' + img.id + '"><img id="rimg" alt="Beleg" src="' + (u || 'data:image/gif;base64,R0lGODlhAQABAAAAACw=') + '"></div>'; }
    else if (pdf) h += '<div class="photo"><div class="pdfbox">' + I.file + ' PDF</div></div>';
    if (p.ocr) h += '<div class="ocr">' + (p.ocr.done ? (p.ocr.err ? '<span class="red">' + esc(p.ocr.err) + '</span>' : (un.size ? 'Erkannt – gestrichelte Felder kurz prüfen.' : 'Alles erkannt.')) : '<span class="spin"></span>' + esc(p.ocr.msg || 'Text wird gelesen …')) + '</div>';
    const fl = (k, l, inner, extra) => '<label class="field' + (un.has(k) ? ' unsure' : '') + '"' + (extra || '') + '><span>' + l + '</span>' + inner + '</label>';
    h += fl('amount', 'Betrag in €', '<input class="inp big" type="text" inputmode="decimal" placeholder="0,00" value="' + esc(money2(d.amount)) + '" data-in="rf" data-k="amount" autocomplete="off">');
    h += fl('merchant', 'Händler', '<input class="inp" type="text" placeholder="z. B. Thalia" value="' + esc(d.merchant) + '" data-in="rf" data-k="merchant" autocomplete="off" list="merchants">');
    h += '<datalist id="merchants">' + [...new Set(G.live(st.db, 'receipts').map(r => r.merchant).filter(Boolean))].slice(0, 60).map(m => '<option value="' + esc(m) + '">').join('') + '</datalist>';
    h += fl('date', 'Datum', '<input class="inp" type="date" value="' + esc(d.date || '') + '" data-ch="rfDate">');
    h += '<div class="field"><span class="flabel' + (un.has('cat') ? ' unsure' : '') + '">Kategorie</span><div class="chips' + (un.has('cat') ? ' unsure' : '') + '">' + G.CATS.map(c => '<button type="button" class="chip' + (d.cat === c.k ? ' on' : '') + '" data-a="rCat" data-c="' + c.k + '">' + esc(c.l) + '</button>').join('') + '</div></div>';
    const cat = G.CAT[d.cat];
    if (cat && cat.area === 'arbeitsmittel') {
      const share = d.share != null ? +d.share : cat.share;
      h += '<div class="field"><span class="flabel">Beruflicher Anteil</span><div class="seg">' + [100, 50].map(v => '<button type="button" class="' + (share === v ? 'on' : '') + '" data-a="rShare" data-v="' + v + '">' + v + ' %</button>').join('') + '</div>' + (cat.computer ? '<p class="hint">Vorbelegt 50 %, weil Technik meist auch privat genutzt wird (Annahme, ungeprüft). Nutzt du es fast nur für Schule/Beruf: 100 %.</p>' : '') + '</div>';
      if (!cat.computer && +d.amount > ((R && R.regeln.arbeitsmittel.brutto) || 952)) h += '<label class="field"><span>Nutzungsdauer in Jahren</span><input class="inp" type="text" inputmode="numeric" value="' + esc(d.nd || 3) + '" data-in="rf" data-k="nd"><div class="hint">Über 952 € (800 € netto) wird der Betrag auf mehrere Jahre verteilt. Werte aus der AfA-Tabelle – ungeprüft.</div></label>';
    }
    if (d.date) h += '<p class="hint">Zählt für das Steuerjahr <b>' + d.date.slice(0, 4) + '</b> (Jahr der Zahlung).</p>';
    // Kauf und Fristen
    if (d.cat !== 'fortbildung' && d.cat !== 'spende' && d.cat !== 'reise') {
      h += '<div class="field"><span class="flabel">Gekauft</span><div class="seg">' + [['laden', 'Im Laden'], ['online', 'Online']].map(([k, l]) => '<button type="button" class="' + ((d.kind || 'laden') === k ? 'on' : '') + '" data-a="rKind" data-v="' + k + '">' + l + '</button>').join('') + '</div></div>';
      const x = G.receiptDates(d);
      h += '<div class="two" style="margin-top:14px"><label class="field"><span>Rückgabe bis</span><input class="inp" type="date" value="' + esc(x.returnUntil || '') + '" data-ch="rfReturn"></label><div class="field"><span class="flabel">Gewährleistung</span><div class="inp" style="display:flex;align-items:center;color:var(--muted)">' + (x.warrantyUntil ? 'bis ' + G.fmtDate(x.warrantyUntil) : '–') + '</div></div></div>';
      h += '<p class="hint">' + ((d.kind || 'laden') === 'online' ? 'Online: 14 Tage Widerruf ab Erhalt.' : 'Im Laden gibt es kein gesetzliches Rückgaberecht – nur, was der Händler freiwillig gewährt.') + ' Gewährleistung 2 Jahre.</p>';
      h += '<div class="field"><span class="flabel">Herstellergarantie</span><div class="chips">' + [0, 1, 2, 3, 5].map(n => '<button type="button" class="chip' + ((+d.guaranteeYears || 0) === n ? ' on' : '') + '" data-a="rGuar" data-v="' + n + '">' + (n ? n + (n === 1 ? ' Jahr' : ' Jahre') : 'Keine') + '</button>').join('') + '</div></div>';
    }
    h += '<label class="field"><span>Notiz</span><input class="inp" type="text" placeholder="optional, z. B. Seriennummer" value="' + esc(d.note || '') + '" data-in="rf" data-k="note"></label>';
    if (d.text && !isNew) h += '<details style="margin-top:16px"><summary class="muted" style="min-height:44px;display:flex;align-items:center">Erkannter Text</summary><pre class="copy">' + esc(d.text.slice(0, 3000)) + '</pre></details>';
    h += '<div class="actionbar"><button type="button" class="btn primary" data-a="receiptSave">' + (isNew ? 'Passt' : 'Speichern') + '</button></div>';
    return h + '</div>';
  };
  // Neuer Beleg aus Datei/Foto
  async function newReceiptFromFile(file) {
    if (!file) return;
    const isPdf = /pdf/i.test(file.type) || /\.pdf$/i.test(file.name || '');
    const d = { id: G.uid(), files: [], kind: 'laden', cat: null, date: today(), amount: null, merchant: '', unsure: ['amount', 'date', 'merchant', 'cat'], ok: false, src: isPdf ? 'pdf' : 'foto' };
    const page = { k: 'receipt', d, isNew: true, touched: {}, ocr: { msg: isPdf ? 'PDF wird gelesen …' : 'Foto wird vorbereitet …' } };
    closeSheet(); pushPage(page);
    try {
      let text = '';
      if (isPdf) {
        if (file.size > 8e6) throw new Error('Die PDF ist größer als 8 MB.');
        const pid = G.uid();
        await S.putFile({ id: pid, type: 'pdf', blob: file, up: false });
        d.files.push({ id: pid, type: 'pdf' });
        const out = await G.OCR.pdf(file, (s, pr) => setOcr(page, 'PDF wird gelesen … ' + Math.round(pr * 100) + ' %')); cacheVendor();
        for (const pg of out.pages) { const fid = G.uid(); await S.putFile({ id: fid, type: 'jpg', blob: pg.blob, w: pg.w, h: pg.h, up: false }); d.files.push({ id: fid, type: 'jpg', w: pg.w, h: pg.h }); }
        text = out.text;
      } else {
        const c = await G.compress(file);
        const fid = G.uid();
        await S.putFile({ id: fid, type: 'jpg', blob: c.blob, w: c.w, h: c.h, up: false });
        d.files.push({ id: fid, type: 'jpg', w: c.w, h: c.h });
        renderIfTop(page);
        const first = !LS.get('ocrReady', false);
        setOcr(page, first ? 'Texterkennung wird einmalig geladen (ca. 5 MB) …' : 'Text wird gelesen …');
        text = await G.OCR.image(c.canvas, (s, pr) => setOcr(page, (/load|init/i.test(s) && first ? 'Texterkennung wird einmalig geladen … ' : 'Text wird gelesen … ') + Math.round(pr * 100) + ' %'));
        LS.set('ocrReady', true); cacheVendor();
      }
      applyOcr(page, text);
    } catch (e) {
      page.ocr = { done: true, err: 'Texterkennung ging nicht (' + (e && e.message || e) + '). Bitte Betrag und Datum eintippen.' };
      page.ocrFailed = true;
      renderIfTop(page);
      if (page.saved) finishLateOcr(page, null);
    }
  }
  // Texterkennung und PDF-Leser fest für offline ablegen (eigener Cache, bleibt bei App-Updates erhalten)
  function cacheVendor() {
    if (!('caches' in window)) return;
    const files = ['tesseract/tesseract.min.js', 'tesseract/worker.min.js', 'tesseract/tesseract-core-simd-lstm.wasm.js', 'tesseract/deu.traineddata.gz', 'pdfjs/pdf.min.mjs', 'pdfjs/pdf.worker.min.mjs'].map(f => new URL('vendor/' + f, location.href).href);
    caches.open('geldwerk-vendor-1').then(async c => { for (const f of files) if (!(await c.match(f))) await c.add(f).catch(() => { }); }).catch(() => { });
  }
  function setOcr(page, msg) { page.ocr = { msg }; const el = $('#page .ocr'); if (el && st.stack[st.stack.length - 1] === page) el.innerHTML = '<span class="spin"></span>' + esc(msg); }
  function renderIfTop(page) { if (st.stack[st.stack.length - 1] === page) renderPage(); }
  function applyOcr(page, text) {
    const r = G.receipt(text, st.db.learn, today());
    const d = page.d;
    d.text = String(text || '').slice(0, 6000);
    const un = new Set(d.unsure);
    for (const k of ['amount', 'date', 'merchant', 'cat']) {
      if (page.touched[k]) continue;
      if (r[k] != null && r[k] !== '') d[k] = r[k];
      if (r.unsure.includes(k)) un.add(k); else un.delete(k);
    }
    if (!page.touched.kind) d.kind = r.kind;
    d.unsure = [...un];
    page.ocr = { done: true };
    if (page.saved) finishLateOcr(page, d); else renderIfTop(page);
  }
  // „Passt“ wurde schon getippt, die Erkennung kam danach: gespeicherten Beleg ergänzen (Unsicheres bleibt im Posteingang)
  function finishLateOcr(page, d) {
    const r = st.db.receipts[page.d.id]; if (!r || r.del) return;
    if (d) { for (const k of ['amount', 'date', 'merchant', 'cat', 'kind', 'text']) if (!page.touched[k] && (r[k] == null || r[k] === '' || page.pending.includes(k))) r[k] = d[k]; r.unsure = d.unsure.filter(k => !page.touched[k]); }
    else r.unsure = ['amount', 'date', 'merchant', 'cat'].filter(k => !page.touched[k] && (r[k] == null || r[k] === ''));
    touch(r); commit({ now: true });
    toast('Beleg ergänzt: ' + (r.merchant || 'Beleg') + (r.amount != null ? ' · ' + eur(r.amount, 2) : ''));
  }
  function saveReceipt(page) {
    const d = page.d;
    const r = Object.assign({}, d);
    delete r.unsureOld;
    if (r.amount != null) r.amount = G.r2(r.amount);
    const running = page.isNew && page.ocr && !page.ocr.done;
    const missing = [];
    if (r.amount == null || r.amount === '') missing.push('amount');
    if (!r.date) missing.push('date');
    page.pending = running ? ['amount', 'date', 'merchant', 'cat'].filter(k => !page.touched[k]) : [];
    r.unsure = [...new Set([...missing, ...page.pending])];
    if (!r.merchant && !page.pending.includes('merchant')) r.merchant = '';
    r.ok = true;
    if (page.isNew) r.created = today();
    touch(r);
    // Lernen: Händler → Kategorie (nur eigene Korrekturen)
    if (r.merchant && r.cat && page.touched.cat) { const g = G.guessCat(r.merchant, {}); if (!g || g.cat !== r.cat) st.db.learn[G.learnKey(r.merchant)] = { cat: r.cat, upd: now() }; }
    st.db.receipts[r.id] = r;
    page.saved = true;
    haptic();
    commit({ now: true });
    popPage();
    toast(page.isNew ? (running ? 'Gespeichert – Text wird noch gelesen' : 'Gespeichert' + (r.amount != null ? ': ' + eur(r.amount, 2) : '')) : 'Gespeichert');
  }

  // ---------- Vertrag ----------
  PAGES.contract = p => {
    const c = p.d, t = today();
    let h = bar(p.isNew ? 'Neuer Vertrag' : 'Vertrag', { a: 'back', l: p.isNew ? 'Abbrechen' : null }, p.isNew ? null : { a: 'contractDelete', l: 'Löschen' });
    h += '<div class="pbody">';
    if (p.isNew) h += '<div class="field"><span class="flabel">Vorlage</span><div class="chips">' + Object.entries(G.TEMPLATES).map(([k, v]) => '<button type="button" class="chip' + (c.tpl === k ? ' on' : '') + '" data-a="cTpl" data-t="' + k + '">' + esc(v.l) + '</button>').join('') + '</div></div>';
    if (p.check) h += '<div class="info"><b>Noch nötig?</b> Einmal im Jahr kurz prüfen, ob du den Vertrag noch brauchst – oder ob es günstiger geht.<div class="two" style="margin-top:10px"><button type="button" class="btn" data-a="cKeep">Ja, behalten</button><button type="button" class="btn" data-a="cCancelSheet">Kündigen</button></div></div>';
    const tp = G.TEMPLATES[c.tpl] || G.TEMPLATES.sonst;
    h += '<div class="two" style="margin-top:14px"><label class="field"><span>Anbieter</span><input class="inp" type="text" value="' + esc(c.provider || '') + '" placeholder="z. B. HUK" data-in="cf" data-k="provider"></label><label class="field"><span>Name</span><input class="inp" type="text" value="' + esc(c.name || '') + '" placeholder="' + esc(tp.l) + '" data-in="cf" data-k="name"></label></div>';
    h += '<label class="field"><span>Betrag in €</span><input class="inp big" type="text" inputmode="decimal" placeholder="0,00" value="' + esc(money2(c.amount)) + '" data-in="cf" data-k="amount"></label>';
    h += '<div class="field"><div class="seg">' + Object.entries(G.RHYTHM).map(([k, v]) => '<button type="button" class="' + (c.rhythm === k ? 'on' : '') + '" data-a="cRh" data-v="' + k + '">' + esc(v.l.replace('vierteljährlich', '¼-jährl.').replace('halbjährlich', '½-jährl.')) + '</button>').join('') + '</div></div>';
    const pc = G.priceChange(c);
    if (pc) h += '<p class="hint">Preis ' + (pc.pct >= 0 ? 'gestiegen' : 'gesunken') + ': ' + eur(pc.from, 2) + ' → ' + eur(pc.to, 2) + ' (<b>' + (pc.pct > 0 ? '+' : '') + String(pc.pct).replace('.', ',') + ' %</b>) am ' + G.fmtDate(pc.d) + '</p>';
    if (c.yearEnd) h += '<div class="field"><span class="flabel">Vertragsjahr endet am</span><input class="inp" type="text" inputmode="numeric" value="' + esc(c.yearEnd.slice(3) + '.' + c.yearEnd.slice(0, 2) + '.') + '" data-ch="cYearEnd" placeholder="31.12."></div>';
    h += '<label class="field"><span>Beginn' + (c.yearEnd ? ' (optional)' : '') + '</span><input class="inp" type="date" value="' + esc(c.start || '') + '" data-ch="cStart"></label>';
    if (!c.yearEnd) {
      h += '<div class="two" style="margin-top:14px"><div class="field"><span class="flabel">Mindestlaufzeit</span><div class="stepper"><button type="button" data-a="cStep" data-k="term" data-d="-1" aria-label="Weniger">−</button><input type="text" inputmode="numeric" value="' + (+c.term || 0) + '" data-in="cf" data-k="term" aria-label="Monate"><button type="button" data-a="cStep" data-k="term" data-d="1" aria-label="Mehr">+</button></div><div class="hint">Monate</div></div>';
      h += '<div class="field"><span class="flabel">Danach</span><div class="seg" style="flex-direction:column"><button type="button" class="' + (+c.renew <= 1 ? 'on' : '') + '" data-a="cRenew" data-v="1">monatlich</button><button type="button" class="' + (+c.renew === 12 ? 'on' : '') + '" data-a="cRenew" data-v="12">+12 Monate</button></div></div></div>';
    }
    const n = c.notice || { n: 1, u: 'm' };
    h += '<div class="field"><span class="flabel">Kündigungsfrist</span><div class="two"><div class="stepper"><button type="button" data-a="cNotice" data-d="-1" aria-label="Weniger">−</button><input type="text" inputmode="numeric" value="' + n.n + '" data-in="cNoticeN" aria-label="Frist"><button type="button" data-a="cNotice" data-d="1" aria-label="Mehr">+</button></div><div class="seg">' + [['d', 'Tage'], ['w', 'Wochen'], ['m', 'Monate']].map(([k, l]) => '<button type="button" class="' + (n.u === k ? 'on' : '') + '" data-a="cNoticeU" data-v="' + k + '">' + l + '</button>').join('') + '</div></div></div>';
    const nc = G.nextCancel(c, t);
    h += '<div class="info">' + (c.ended ? 'Gekündigt zum <b>' + G.fmtDate(c.ended) + '</b>.' : !nc || nc.unknown ? 'Trag den <b>Beginn</b> ein, dann rechnet Geldwerk das Kündigungsdatum aus.' : nc.anytime ? 'Jederzeit kündbar. Kündigst du heute, endet der Vertrag am <b>' + G.fmtDate(nc.end) + '</b>.' : 'Kündigen bis <b>' + G.fmtDate(nc.deadline) + '</b> (' + daysWord(nc.days) + ') – dann endet er am ' + G.fmtDate(nc.end) + '. Sonst verlängert er sich.') + (tp.hint && c.tpl === 'kfz' ? '<br><span class="muted">' + esc(tp.hint) + '</span>' : '') + '</div>';
    h += '<div class="two" style="margin-top:14px"><label class="field"><span>Kundennummer</span><input class="inp" type="text" value="' + esc(c.customerNo || '') + '" data-in="cf" data-k="customerNo"></label><label class="field"><span>Vertragsnummer</span><input class="inp" type="text" value="' + esc(c.contractNo || '') + '" data-in="cf" data-k="contractNo"></label></div>';
    h += '<label class="field"><span>Kündigung an (E-Mail)</span><input class="inp" type="email" autocapitalize="off" value="' + esc(c.email || '') + '" placeholder="kuendigung@anbieter.de" data-in="cf" data-k="email"></label>';
    const tk = tp.taxKind;
    h += '<button type="button" class="toggle' + (c.tax ? ' on' : '') + '" data-a="cTax" style="margin-top:10px"><span class="main"><b>Steuerlich relevant</b><div class="muted" style="font-size:13.5px">' + (tk === 'telefon' ? 'Fließt mit 20 % (max. 20 €/Monat) in die Werbungskosten – ungeprüft.' : tk === 'vorsorge' ? 'Kfz-Haftpflicht zählt zu den Vorsorgeaufwendungen – wirkt sich meist nicht aus, weil der Höchstbetrag schon durch die Krankenversicherung erreicht ist. Nur zur Info im Spickzettel.' : 'Nur zur Info im Spickzettel.') + '</div></span><span class="sw"></span></button>';
    h += '<label class="field"><span>Notiz</span><input class="inp" type="text" value="' + esc(c.note || '') + '" data-in="cf" data-k="note"></label>';
    if (!p.isNew && !c.ended) h += '<div class="btns" style="margin-top:18px"><button type="button" class="btn" data-a="cCancelSheet">' + I.mail + 'Kündigung vorbereiten</button><button type="button" class="btn ghost" data-a="cEnded">Ist gekündigt</button></div>';
    if (!p.isNew && c.ended) h += '<div class="btns" style="margin-top:18px"><button type="button" class="btn ghost" data-a="cReopen">Doch nicht gekündigt</button></div>';
    h += '<div class="actionbar"><button type="button" class="btn primary" data-a="contractSave">Speichern</button></div>';
    return h + '</div>';
  };
  function newContract(tpl) {
    const t = G.TEMPLATES[tpl || 'sonst'];
    const c = { id: G.uid(), tpl: tpl || 'sonst', provider: '', name: tpl && tpl !== 'sonst' ? t.l : '', amount: null, rhythm: t.rhythm, term: t.term, renew: t.renew, notice: Object.assign({}, t.notice), yearEnd: t.yearEnd || null, tax: !!t.taxKind && t.taxKind === 'telefon', prices: [] };
    return c;
  }
  function applyTpl(c, tpl) {
    const t = G.TEMPLATES[tpl];
    Object.assign(c, { tpl, rhythm: t.rhythm, term: t.term, renew: t.renew, notice: Object.assign({}, t.notice), yearEnd: t.yearEnd || null, tax: t.taxKind === 'telefon' });
    if (!c.name || Object.values(G.TEMPLATES).some(x => x.l === c.name)) c.name = tpl === 'sonst' ? '' : t.l;
  }
  function saveContract(p) {
    const c = p.d, old = st.db.contracts[c.id];
    if (c.amount != null && (!old || old.amount !== c.amount)) { c.prices = (c.prices || []).filter(x => x.d !== today()); c.prices.push({ d: today(), amount: c.amount }); }
    if (p.isNew) c.created = today();
    st.db.contracts[c.id] = touch(c);
    commit({ now: true }); popPage(); toast('Vertrag gespeichert');
  }

  // ---------- Fahrten-Kalender ----------
  PAGES.cal = p => {
    const y = p.year, R = st.rules[y], tr = G.trips(st.db, y, R), s = st.db.settings;
    const m = p.month;
    let h = bar('Fahrten ' + y) + '<div class="pbody">';
    h += '<p class="lead" style="margin-top:0">Fahrten rechnen sich selbst. Nur Ausnahmen antippen: krank, frei, Prüfung, anderer Weg, Lernen zu Hause.</p>';
    h += '<div class="statrow"><div class="stat"><b>' + tr.sum.work.days + '</b><span>Arbeit · ' + eur(Math.round(tr.sum.work.eur)) + '</span></div><div class="stat"><b>' + tr.sum.school.days + '</b><span>Schule · ' + eur(Math.round(tr.sum.school.eur)) + '</span></div><div class="stat"><b>' + tr.sum.home.days + '</b><span>zu Hause</span></div></div>';
    if (!(+s.kmWork > 0) || !(+s.kmSchool > 0)) h += '<div class="info">Kilometer fehlen – <button type="button" class="link" data-a="settings">in den Einstellungen eintragen</button>.</div>';
    h += '<div class="cal-nav"><button type="button" data-a="calMonth" data-d="-1" aria-label="Voriger Monat">' + I.back + '</button><b>' + G.MONTHS[m] + ' ' + y + '</b><button type="button" data-a="calMonth" data-d="1" aria-label="Nächster Monat" style="transform:scaleX(-1)">' + I.back + '</button></div>';
    h += '<div class="cal">' + G.DOW.map(d => '<div class="dh">' + d + '</div>').join('');
    const first = y + '-' + G.pad(m + 1) + '-01';
    for (let i = 0; i < G.dow(first); i++) h += '<div class="d pad"></div>';
    const t = today();
    for (const di of tr.days.filter(x => x.d.slice(5, 7) === G.pad(m + 1))) {
      const lab = di.k === 'work' ? 'Arbeit' : di.k === 'school' ? 'Schule' : di.k === 'home' ? 'Haus' : di.hol ? 'Feiert.' : di.ferien ? 'Ferien' : di.exc === 'krank' ? 'krank' : di.exc === 'frei' ? 'frei' : '';
      const cls = di.k === 'none' ? (di.hol || di.ferien || G.dow(di.d) >= 5 || di.exc ? 'off' : 'off') : di.k;
      h += '<button type="button" class="d ' + cls + (di.exc ? ' exc' : '') + (di.d === t ? ' today' : '') + '" data-a="calDay" data-d="' + di.d + '" aria-label="' + G.fmtDate(di.d) + ' ' + lab + '">' + (+di.d.slice(8)) + '<small>' + lab + (di.job && di.k !== 'none' ? '·J' : '') + '</small></button>';
    }
    h += '</div>';
    h += '<div class="legend"><span><i style="background:var(--navy)"></i>Arbeit</span><span><i style="background:var(--navy2)"></i>Schule</span><span><i style="background:var(--accent);border-radius:50%;width:8px;height:8px"></i>Ausnahme</span><span>·J = Minijob (zählt nicht)</span></div>';
    if (tr.sum.vacation) h += '<p class="hint">' + tr.sum.vacation + ' Urlaubstage werden pauschal von den Arbeitstagen abgezogen (Einstellungen).</p>';
    const fer = R && R.ferien; if (fer) h += '<p class="hint">Ferien: ' + esc(fer.quelle) + (fer.hinweis ? '. ' + esc(fer.hinweis) : '') + '</p>';
    return h + '</div>';
  };

  // ---------- Einstellungen ----------
  PAGES.settings = p => {
    const s = st.db.settings, y0 = +s.work.from.slice(0, 4);
    let h = bar('Einstellungen') + '<div class="pbody">';
    h += '<div class="sec-h"><h2>Fahrten</h2></div><div class="card">';
    h += '<div class="two"><label class="field"><span>km zur Arbeit</span><input class="inp" type="text" inputmode="decimal" value="' + esc(money(s.kmWork)) + '" data-ch="setKmCh" data-k="kmWork"></label><label class="field"><span>km zur Schule</span><input class="inp" type="text" inputmode="decimal" value="' + esc(money(s.kmSchool)) + '" data-ch="setKmCh" data-k="kmSchool"></label></div>';
    h += '<div class="flabel" style="margin-top:16px">ARBEIT (' + esc(s.work.place) + ')</div><div class="two"><input class="inp" type="date" aria-label="Arbeit von" value="' + s.work.from + '" data-ch="setRange" data-k="work" data-f="from"><input class="inp" type="date" aria-label="Arbeit bis" value="' + s.work.to + '" data-ch="setRange" data-k="work" data-f="to"></div><div style="margin-top:8px">' + dayChips('work', s.work.days) + '</div>';
    h += '<label class="field"><span>Urlaubstage ' + y0 + '</span><input class="inp" type="text" inputmode="numeric" value="' + ((s.vacation || {})[y0] || 0) + '" data-ch="vacCh" data-y="' + y0 + '"></label>';
    h += '<div class="flabel" style="margin-top:16px">SCHULE (' + esc(s.school.place) + ')</div><div class="two"><input class="inp" type="date" aria-label="Schule von" value="' + s.school.from + '" data-ch="setRange" data-k="school" data-f="from"><input class="inp" type="date" aria-label="Schule bis" value="' + s.school.to + '" data-ch="setRange" data-k="school" data-f="to"></div><div style="margin-top:8px">' + dayChips('school', s.school.days) + '</div>';
    h += '<div class="flabel" style="margin-top:16px">MINIJOB (ZÄHLT NICHT)</div>' + dayChips('jobDays', s.jobDays) + '</div>';
    h += '<div class="sec-h"><h2>Steuer</h2></div><div class="card"><button type="button" class="toggle' + (s.kontofuehrung !== false ? ' on' : '') + '" data-a="toggleKonto"><span class="main"><b>Kontoführungspauschale 16 €</b><div class="muted" style="font-size:13.5px">Verwaltungspraxis, ungeprüft – nur in Jahren mit Lohn</div></span><span class="sw"></span></button></div>';
    // Sicherung
    const c = Sync.cfg(), ss = LS.get('syncState', {});
    h += '<div class="sec-h" id="sec-sync"><h2>Sicherung (GitHub)</h2></div><div class="card">';
    if (c) {
      h += '<div class="muted" style="font-size:14.5px">Repository <b style="color:var(--ink)">' + esc(c.repo) + '</b>' + (c.from ? ' · Zugang aus ' + esc(c.from) : '') + '<br>' + (ss.last ? 'Zuletzt gesichert ' + ago(ss.last) : 'Noch nicht gesichert') + (ss.pendingFiles ? ' · ' + ss.pendingFiles + ' Fotos warten' : '') + (ss.err ? '<br><span class="red">' + esc(ss.err) + '</span>' : '') + '</div>';
      h += '<div class="btns" style="margin-top:12px"><button type="button" class="btn" data-a="syncNow">' + I.cloud + 'Jetzt sichern</button><button type="button" class="btn" data-a="copyAccess">' + I.copy + 'Zugangscode kopieren (für neues Gerät)</button><button type="button" class="btn ghost" data-a="syncOff">Sicherung trennen</button></div>';
    } else {
      h += backupForm(p) + '<div class="btns" style="margin-top:12px"><button type="button" class="btn primary" data-a="syncConnect">Verbinden</button></div>';
    }
    h += '</div>';
    // Mitteilungen
    h += '<div class="sec-h"><h2>Mitteilungen</h2></div><div class="card">';
    if (G.Push.isOn()) { const ps = LS.get('push', {}); h += '<div class="muted" style="font-size:14.5px">An. Fristen kommen um 8 Uhr.' + (ps.err ? '<br><span class="red">' + esc(ps.err) + '</span>' : ps.sentAt ? '<br>Termine übertragen ' + ago(ps.sentAt) : '') + '</div><div class="btns" style="margin-top:12px"><button type="button" class="btn" data-a="pushTest">' + I.bell + 'Test-Mitteilung senden</button><button type="button" class="btn ghost" data-a="pushOff">Ausschalten</button></div>'; }
    else h += pushForm(p) + '<div class="btns" style="margin-top:12px"><button type="button" class="btn primary" data-a="pushOn">Mitteilungen einschalten</button></div>';
    h += '</div>';
    // Daten
    h += '<div class="sec-h"><h2>Daten</h2></div><div class="card"><div class="btns"><button type="button" class="btn" data-a="exportFile">' + I.share + 'Als Datei sichern</button><button type="button" class="btn" data-a="importFile">Datei laden (wird zusammengeführt)</button><button type="button" class="btn" data-a="openBlock">' + I.block + 'Geldwerk-Block einfügen</button><button type="button" class="btn danger" data-a="wipeAsk">Alle Daten auf diesem Gerät löschen</button></div><p class="hint">Löschen betrifft nur Geldwerk auf diesem Gerät. Mit Sicherung kommt alles über „Ich habe schon eine Sicherung“ zurück.</p></div>';
    h += '<div class="sec-h"><h2>Über</h2></div><div class="list"><button type="button" class="row" data-a="rules"><span class="main"><span class="t">Regeln und Quellen</span><span class="s">Steuerregeln je Jahr mit Stand</span></span>' + I.chev + '</button><div class="row"><span class="main"><span class="t">Geldwerk ' + VERSION + '</span><span class="s">Keine Steuerberatung. Daten nur auf dem Gerät und in deinem privaten Repository.</span></span></div></div>';
    return h + '</div>';
  };

  // ---------- Regeln ----------
  PAGES.rules = p => {
    const y = p.year || st.year, R = st.rules[y];
    let h = bar('Regeln ' + y) + '<div class="pbody"><p class="lead" style="margin-top:0">Keine Steuerberatung. Jede Regel mit Quelle und Stand. „Ungeprüft“ heißt: nicht in einer amtlichen Quelle für dieses Jahr bestätigt.</p>';
    h += '<div class="seg" style="margin-top:12px">' + RULE_YEARS.map(x => '<button type="button" class="' + (x === y ? 'on' : '') + '" data-a="rulesYear" data-y="' + x + '">' + x + '</button>').join('') + '</div>';
    if (!R) return h + '</div>';
    h += '<div class="list" style="margin-top:14px">' + Object.values(R.regeln).map(r => '<div class="rule"><b>' + esc(r.titel) + '</b> ' + (r.geprueft ? '<span class="tag green">geprüft</span>' : '<span class="tag grey">ungeprüft</span>') + '<p>' + esc(r.text) + '</p><small>' + esc(r.quelle) + ' · Stand ' + G.fmtDate(r.stand) + '</small>' + (r.link ? '<small><a href="' + esc(r.link) + '" target="_blank" rel="noopener">' + esc(r.link.replace(/^https?:\/\//, '').slice(0, 60)) + '</a></small>' : '') + '</div>').join('');
    h += '<div class="rule"><b>Feiertage Niedersachsen ' + y + '</b> <span class="tag green">geprüft</span><p>' + R.feiertage.tage.map(x => G.fmtShort(x[0]) + ' ' + esc(x[1])).join(' · ') + '</p><small>' + esc(R.feiertage.quelle) + '</small></div>';
    h += '<div class="rule"><b>Schulferien</b> ' + (R.ferien.zeiten.some(z => z[3] === false) ? '<span class="tag grey">teils ungeprüft</span>' : '<span class="tag green">geprüft</span>') + '<p>' + R.ferien.zeiten.map(z => esc(z[2]) + ' ' + G.fmtShort(z[0]) + '–' + G.fmtDate(z[1]) + (z[3] === false ? ' (ungeprüft)' : '')).join('<br>') + '</p><small>' + esc(R.ferien.quelle) + (R.ferien.link ? ' · <a href="' + esc(R.ferien.link) + '" target="_blank" rel="noopener">Kultusministerium</a>' : '') + '</small></div>';
    return h + '</div></div>';
  };

  // ---------- ELSTER-Spickzettel ----------
  function cheatModel(y) {
    const res = st.chain[y], s = st.db.settings, t = st.db.tax[y] || {}, out = [];
    if (!res) return out;
    const L = k => res.lines.find(l => l.key === k);
    if (res.gross > 0 || res.trips.work.days) out.push({ area: 'Anlage N › Angaben zum Arbeitslohn', rows: [['Bruttoarbeitslohn', res.gross ? eur(res.gross, 2) : 'aus Lohnsteuerbescheinigung'], ['Einbehaltene Lohnsteuer', t.lst != null ? eur(t.lst, 2) : '–']], note: 'Kommt automatisch aus der Lohnsteuerbescheinigung („Belegabruf“ in ELSTER) – nur vergleichen.' });
    const fr = [];
    if (res.trips.work.days) fr.push(['Tätigkeitsstätte 1: ' + s.work.place, res.trips.work.days + ' Tage · ' + Math.floor(+s.kmWork || 0) + ' km'], ['  Zeitraum', G.fmtShort(s.work.from) + '–' + G.fmtDate(s.work.to)]);
    if (res.trips.school.days) fr.push(['Tätigkeitsstätte 2: ' + s.school.place + ' (Bildungseinrichtung, Vollzeit)', res.trips.school.days + ' Tage · ' + Math.floor(+s.kmSchool || 0) + ' km'], ['  Zeitraum', G.fmtShort(s.school.from > y + '-01-01' ? s.school.from : y + '-01-01') + '–' + G.fmtDate(s.school.to < y + '-12-31' ? s.school.to : y + '-12-31')]);
    if (fr.length) out.push({ area: G.AREAS.fahrten.elster, rows: fr.concat([['Ergibt (Entfernungspauschale)', eur(res.trips.eur, 2)]]), note: 'Verkehrsmittel: eigener Pkw. Höchstbetrag 4.500 € gilt dann nicht. Die Schule als erste Tätigkeitsstätte: § 9 Abs. 4 Satz 8 EStG.' });
    const fb = L('belege-fortbildung'), zs = L('zuschuss');
    if (fb || zs) out.push({ area: G.AREAS.fortbildung.elster, rows: [['Lehrgang, Prüfung u. a.', eur(fb ? fb.eur : 0, 2)]].concat(zs ? [['Steuerfreier Zuschuss Aufstiegs-BAföG', eur(-zs.eur, 2)], ['Abziehbar', eur((fb ? fb.eur : 0) + zs.eur, 2)]] : []), note: zs ? 'Den Zuschuss nicht doppelt abziehen: entweder Kosten minus Zuschuss eintragen oder Kosten und Zuschuss getrennt angeben – je nachdem, was das Formular abfragt.' : '' });
    const am = L('belege-arbeitsmittel');
    if (am) out.push({ area: G.AREAS.arbeitsmittel.elster, rows: [['Arbeitsmittel (beruflicher Anteil)', eur(am.eur, 2)]].concat(topReceipts(y, 'arbeitsmittel')), note: 'Einzelposten stehen in der Steuermappe. Computer/Software: Nutzungsdauer 1 Jahr (BMF 22.02.2022).' });
    const rk = L('belege-reise'); if (rk) out.push({ area: G.AREAS.reise.elster, rows: [['Fahrten und Reisen (z. B. Exkursion)', eur(rk.eur, 2)]] });
    const tp = L('tagespauschale'); if (tp) out.push({ area: G.AREAS.tagespauschale.elster, rows: [['Tage zu Hause gelernt', String(res.trips.home.days)], ['Ergibt', eur(tp.eur, 2)]], note: 'Ungeprüft für reine Lerntage einer Vollzeit-Fortbildung – nur an Tagen ohne Schule.' });
    const w = []; const ko = L('konto'), te = L('telefon'), bw = L('belege-weitere');
    if (ko) w.push(['Kontoführung (pauschal)', eur(ko.eur, 2)]); if (te) w.push(['Telefon/Internet (20 %)', eur(te.eur, 2)]); if (bw) w.push(['Bewerbung u. a.', eur(bw.eur, 2)]);
    if (w.length) out.push({ area: G.AREAS.weitere.elster, rows: w });
    if (res.spenden) out.push({ area: G.AREAS.spende.elster, rows: [['Spenden', eur(res.spenden, 2)]] });
    if (res.loss > 0 || res.carryIn > 0) out.push({ area: 'Hauptvordruck › Verlustabzug', rows: res.loss > 0 ? [['Feststellung des verbleibenden Verlustvortrags beantragen', 'ankreuzen'], ['Erwarteter Verlust ' + y, eur(res.loss, 2)]] : [['Verlustvortrag aus ' + (y - 1), eur(res.carryIn, 2)]], note: 'Wird vom Finanzamt aus dem Vorjahresbescheid übernommen.' });
    out.push({ area: 'Nicht eintragen', rows: [['Minijob (pauschal versteuert)', '–'], ['Aufstiegs-BAföG Unterhaltsbeitrag', '–']], note: 'Pauschal versteuerter Lohn bleibt außen vor; dafür auch keine Werbungskosten.' });
    const kfz = G.live(st.db, 'contracts').filter(c => c.tax && G.TEMPLATES[c.tpl] && G.TEMPLATES[c.tpl].taxKind === 'vorsorge' && !c.ended);
    if (kfz.length) out.push({ area: 'Anlage Vorsorgeaufwand › weitere sonstige Vorsorgeaufwendungen', rows: kfz.map(c => [c.name || c.provider, eur(G.contractYearCost(c, y), 2)]), note: 'Wirkt sich meist nicht aus (Höchstbetrag schon durch Kranken-/Pflegeversicherung erreicht).' });
    return out;
  }
  function topReceipts(y, area) {
    return G.live(st.db, 'receipts').filter(r => G.CAT[r.cat] && G.CAT[r.cat].area === area && G.receiptYearAmount(r, y, st.rules[y]) > 0).sort((a, b) => b.amount - a.amount).slice(0, 5).map(r => ['  ' + (r.merchant || 'Beleg') + ' ' + G.fmtShort(r.date), eur(G.receiptYearAmount(r, y, st.rules[y]), 2)]);
  }
  PAGES.cheat = p => {
    const y = st.year, m = cheatModel(y);
    let h = bar('ELSTER ' + y, null, { a: 'cheatPdf', l: 'PDF' }) + '<div class="pbody cheat"><p class="lead" style="margin-top:0">Welcher Betrag in welchen Bereich von „Mein ELSTER“ gehört. Zeilennummern sind für ' + y + ' nicht geprüft – darum stehen hier die Bereichsnamen.</p><div class="list" style="margin-top:12px">';
    for (const e of m) h += '<div class="area">' + esc(e.area) + '</div>' + e.rows.map(([l, v]) => '<div class="kv"><span>' + esc(l) + '</span><b>' + esc(v) + '</b></div>').join('') + '<div class="note">' + esc(e.note || '') + '</div>';
    return h + '</div><p class="hint">Keine Steuerberatung. Grundlage: Regeldatei ' + y + ' (Stand ' + G.fmtDate(st.rules[y].stand) + ').</p></div>';
  };

  // ---------- Block ----------
  PAGES.block = p => {
    let h = bar('Geldwerk-Block') + '<div class="pbody"><p class="lead" style="margin-top:0">Fotografiere ein Dokument im Claude-Chat und lass dir einen Geldwerk-Block machen. Hier einfügen – Geldwerk füllt die Felder, du bestätigst.</p>';
    h += '<div class="btns" style="margin-top:14px"><button type="button" class="btn" data-a="pasteBlock">' + I.copy + 'Aus Zwischenablage einfügen</button></div>';
    h += '<label class="field"><span>Block</span><textarea class="inp" data-in="blockText" placeholder="#GELDWERK&#10;typ: Lohnsteuerbescheinigung&#10;jahr: 2026&#10;bruttolohn: 21.345,67&#10;…&#10;#ENDE" autocapitalize="off" autocorrect="off" spellcheck="false">' + esc(p.text || '') + '</textarea></label>';
    return h + '<div id="blockPrev">' + blockPreview(p.text) + '</div></div>';
  };
  function blockPreview(text) {
    const bl = text ? G.blocks(text) : [];
    let h = '';
    if (text && !bl.length) h += '<p class="err">Kein Block erkannt. Er beginnt mit „#GELDWERK“ und hat Zeilen wie „typ: …“.</p>';
    for (const b of bl) h += '<div class="card preview" style="margin-top:12px"><b style="font-size:17px">' + esc(G.TYP_LABEL[b.typ] || 'Unbekannt') + '</b>' + Object.entries(b.data).map(([k, v]) => '<div class="kv"><span>' + esc(G.FIELD_LABEL[k] || k) + '</span><b>' + esc(fmtVal(k, v)) + '</b></div>').join('') + (b.warn.length ? '<p class="err">' + b.warn.map(esc).join('<br>') + '</p>' : '') + '</div>';
    if (bl.some(b => b.typ)) h += '<div class="actionbar"><button type="button" class="btn primary" data-a="applyBlock">Übernehmen (' + bl.filter(b => b.typ).length + ')</button></div>';
    return h;
  }
  function fmtVal(k, v) {
    if (typeof v === 'number' && !['jahr', 'term', 'renew', 'guaranteeYears', 'share'].includes(k)) return eur(v, 2);
    if (k === 'notice') return v.n + ' ' + ({ d: 'Tage', w: 'Wochen', m: 'Monate' })[v.u];
    if (k === 'tpl') return (G.TEMPLATES[v] || {}).l || v;
    if (k === 'rhythm') return (G.RHYTHM[v] || {}).l || v;
    if (k === 'cat') return catL(v);
    if (k === 'tax') return v ? 'ja' : 'nein';
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return G.fmtDate(v);
    if (k === 'yearEnd') return v.slice(3) + '.' + v.slice(0, 2) + '.';
    return String(v);
  }
  function applyBlocks(text) {
    const bl = G.blocks(text).filter(b => b.typ);
    const done = [];
    for (const b of bl) {
      const d = b.data, y = d.jahr || (d.date ? +d.date.slice(0, 4) : defaultYear());
      if (b.typ === 'lohnsteuer') { const t = st.db.tax[y] = Object.assign({}, st.db.tax[y] || {}); for (const k of ['gross', 'lst', 'soli', 'kist', 'rv', 'kv', 'pv', 'av', 'employer']) if (d[k] != null) t[k] = d[k]; t.fromLStB = true; touch(t); done.push('Lohnsteuer ' + y); }
      else if (b.typ === 'bescheid') { const t = st.db.tax[y] = Object.assign({}, st.db.tax[y] || {}); t.bescheid = { festgesetzt: d.festgesetzt, erstattung: d.erstattung, nachzahlung: d.nachzahlung, verlust: d.verlust, date: d.date }; t.filed = true; touch(t); done.push('Bescheid ' + y); }
      else if (b.typ === 'bafoeg') { const t = st.db.tax[y] = Object.assign({}, st.db.tax[y] || {}); if (d.zuschuss != null) t.zuschuss = d.zuschuss; if (d.darlehen != null) t.darlehen = d.darlehen; touch(t); done.push('Aufstiegs-BAföG ' + y); }
      else if (b.typ === 'vertrag') {
        const c = newContract(d.tpl || 'sonst');
        for (const k of ['provider', 'name', 'amount', 'rhythm', 'start', 'term', 'renew', 'notice', 'customerNo', 'contractNo', 'email', 'note', 'yearEnd', 'tax']) if (d[k] != null) c[k] = d[k];
        c.prices = c.amount != null ? [{ d: today(), amount: c.amount }] : []; c.created = today();
        st.db.contracts[c.id] = touch(c); done.push('Vertrag ' + (c.name || c.provider));
      } else if (b.typ === 'beleg') {
        const r = { id: G.uid(), files: [], merchant: d.merchant || '', amount: d.amount, date: d.date || null, cat: d.cat || (G.guessCat(d.merchant || '', st.db.learn) || {}).cat || null, kind: d.kind || 'laden', note: d.note || '', share: d.share, guaranteeYears: d.guaranteeYears, ok: true, created: today(), src: 'block' };
        r.unsure = ['amount', 'date', 'cat'].filter(k => r[k] == null);
        st.db.receipts[r.id] = touch(r); done.push('Beleg ' + (r.merchant || ''));
      }
    }
    return done;
  }

  /* ================= Blätter von unten ================= */
  function openSheet(s) { st.sheet = s; renderSheet(); }
  function closeSheet() { st.sheet = null; const w = $('#sheet'); w.hidden = true; w.innerHTML = ''; }
  function renderSheet() {
    const s = st.sheet; if (!s) return;
    const w = $('#sheet');
    w.innerHTML = '<div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>' + SHEETS[s.k](s) + '</div>';
    w.hidden = false;
  }
  const SHEETS = {};
  SHEETS.plus = () => '<h2>Neu</h2><p class="lead">Was möchtest du erfassen?</p>' +
    '<button type="button" class="bigopt" data-a="cam"><span class="ic">' + I.cam + '</span><span>Beleg fotografieren<small>Kassenbon, Rechnung – Texterkennung auf dem iPhone</small></span></button>' +
    '<button type="button" class="bigopt" data-a="pickFile"><span class="ic">' + I.file + '</span><span>Datei wählen<small>PDF-Rechnung oder Bild aus Dateien/Fotos</small></span></button>' +
    '<button type="button" class="bigopt" data-a="newContract"><span class="ic">' + I.doc + '</span><span>Vertrag<small>Versicherung, Handy, Internet, Abo …</small></span></button>' +
    '<button type="button" class="bigopt" data-a="openBlock"><span class="ic">' + I.block + '</span><span>Block einfügen<small>Aus dem Claude-Chat: Lohnsteuer, Bescheid, Vertrag</small></span></button>';
  SHEETS.day = s => {
    const R = st.rules[+s.d.slice(0, 4)];
    const di = G.dayInfo(s.d, st.db.settings, R, G.holidayMap(R, +s.d.slice(0, 4)), st.db.exc);
    const e = st.db.exc[s.d];
    const what = di.k === 'work' ? 'Arbeitstag · ' + Math.floor(di.km) + ' km · ' + eur(Math.floor(di.km) * 0.38, 2) : di.k === 'school' ? 'Schultag · ' + Math.floor(di.km) + ' km · ' + eur(Math.floor(di.km) * 0.38, 2) : di.k === 'home' ? 'Lernen zu Hause · Tagespauschale' : (di.why || 'Keine Fahrt');
    let h = '<h2>' + G.DOW[G.dow(s.d)] + ', ' + G.fmtDate(s.d) + '</h2><p class="lead">' + esc(what) + (di.job ? ' · Minijob (zählt nicht)' : '') + '</p><div class="list">';
    const opts = [['', 'Normal (automatisch)'], ['krank', 'Krank'], ['frei', 'Frei / Urlaub'], ['pruefung', 'Prüfung'], ['weg', 'Anderer Weg (andere km)'], ['zuhause', 'Lernen zu Hause'], ['schule', 'Zusätzlicher Schultag'], ['arbeit', 'Zusätzlicher Arbeitstag']];
    const cur = e && !e.del ? e.t : '';
    h += opts.map(([k, l]) => '<button type="button" class="row" data-a="setExc" data-t="' + k + '"><span class="main"><span class="t">' + esc(l) + '</span></span>' + (cur === k ? '<span class="green">' + I.check + '</span>' : '') + '</button>').join('') + '</div>';
    if (cur === 'weg' || cur === 'pruefung') h += '<label class="field"><span>Kilometer an diesem Tag (einfache Strecke)</span><input class="inp" type="text" inputmode="decimal" value="' + esc(money(e.km || '')) + '" placeholder="' + Math.floor(di.km || 0) + '" data-ch="excKm"></label>';
    if (cur === 'zuhause') h += '<p class="hint">Tagespauschale 6 € – nur an Tagen ohne Schule. Ob reine Lerntage zählen, ist nicht sicher geklärt (ungeprüft).</p>';
    return h;
  };
  SHEETS.lst = s => {
    const y = st.year, t = st.db.tax[y] || {};
    return '<h2>Lohn und Lohnsteuer ' + y + '</h2><p class="lead">Von der Lohnsteuerbescheinigung (kommt bis Ende Februar) oder vorab aus der letzten Gehaltsabrechnung (Jahreswerte). Schneller: als Block einfügen.</p>' + lstFields(y, t, false) + '<div class="btns" style="margin-top:16px"><button type="button" class="btn primary" data-a="sheetDone">Fertig</button><button type="button" class="btn ghost" data-a="openBlock">Block einfügen</button></div>';
  };
  SHEETS.zuschuss = s => {
    const y = st.year, t = st.db.tax[y] || {};
    return '<h2>Aufstiegs-BAföG ' + y + '</h2><p class="lead">Nur der <b>Zuschussanteil</b> zu Lehrgangs- und Prüfungsgebühren (steht im Bescheid) wird von den Fortbildungskosten abgezogen. Darlehen und Unterhaltsbeitrag nicht.</p>' +
      '<label class="field"><span>Zuschuss Lehrgang/Prüfung in ' + y + '</span><input class="inp big" type="text" inputmode="decimal" placeholder="0,00" value="' + esc(money(t.zuschuss)) + '" data-in="tax" data-y="' + y + '" data-k="zuschuss"></label>' +
      '<div class="info">' + esc(st.rules[y].regeln.afbg_erlass.text) + ' <span class="tag grey">ungeprüft</span></div><div class="btns" style="margin-top:16px"><button type="button" class="btn primary" data-a="sheetDone">Fertig</button></div>';
  };
  SHEETS.carry = s => {
    const y = st.year;
    if (y !== RULE_YEARS[0]) return '<h2>Verlustvortrag aus ' + (y - 1) + '</h2><p class="lead">Wird automatisch aus ' + (y - 1) + ' übernommen: ' + eur(st.chain[y].carryIn, 2) + '. Liegt der Bescheid für ' + (y - 1) + ' vor, füge ihn als Block ein – dann zählt der festgestellte Betrag.</p><div class="btns"><button type="button" class="btn primary" data-a="sheetDone">OK</button></div>';
    return '<h2>Verlustvortrag aus ' + (y - 1) + '</h2><p class="lead">Steht im Bescheid über den verbleibenden Verlustvortrag. Meist 0 €.</p><label class="field"><span>Betrag</span><input class="inp big" type="text" inputmode="decimal" value="' + esc(money(st.db.settings.carry2025 || 0)) + '" data-in="carry"></label><div class="btns" style="margin-top:16px"><button type="button" class="btn primary" data-a="sheetDone">Fertig</button></div>';
  };
  SHEETS.cancel = s => {
    const c = st.stack[st.stack.length - 1].d, txt = G.cancelText(c, { name: st.db.settings.name || '' });
    const subj = 'Kündigung' + (c.contractNo ? ' Vertrag ' + c.contractNo : c.customerNo ? ' Kundennummer ' + c.customerNo : '');
    return '<h2>Kündigung</h2><p class="lead">Text kopieren oder direkt als Mail öffnen. Bestätigung aufheben!</p><label class="field" style="margin-top:0"><span>Dein Name (für die Unterschrift)</span><input class="inp" type="text" value="' + esc(st.db.settings.name || '') + '" placeholder="Vor- und Nachname" data-ch="myName" autocomplete="name"></label><pre class="copy" style="margin-top:12px">' + esc(txt) + '</pre>' +
      '<div class="btns"><button type="button" class="btn" data-a="copyCancel">' + I.copy + 'Text kopieren</button>' + '<a class="btn primary" style="text-decoration:none" href="mailto:' + encodeURIComponent(c.email || '') + '?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(txt) + '">' + I.mail + 'Als Mail öffnen</a></div>';
  };
  SHEETS.confirm = s => '<h2>' + esc(s.title) + '</h2><p class="lead">' + esc(s.text) + '</p><div class="btns"><button type="button" class="btn danger" data-a="confirmYes">' + esc(s.yes) + '</button><button type="button" class="btn" data-a="closeSheet">Abbrechen</button></div>';
  SHEETS.restore = s => '<h2>Aus Sicherung wiederherstellen</h2><p class="lead">Zugangscode (aus den Einstellungen des alten Geräts: „Zugangscode kopieren“) oder Repository und Schlüssel eingeben.</p>' + backupForm(s) + '<div class="btns" style="margin-top:14px"><button type="button" class="btn primary" data-a="restoreGo">Wiederherstellen</button><button type="button" class="btn ghost" data-a="importFile">Stattdessen Datei laden</button></div>';
  SHEETS.mappe = s => '<h2>Steuermappe ' + st.year + '</h2>' + (s.busy ? '<p class="ocr"><span class="spin"></span>' + esc(s.busy) + '</p>' : s.err ? '<p class="err">' + esc(s.err) + '</p>' : '<p class="lead">Fertig: ' + esc(s.name) + ' (' + Math.round(s.size / 1024) + ' KB)</p><div class="btns"><button type="button" class="btn primary" data-a="mappeShare">' + I.share + 'Teilen / Sichern</button><a class="btn" style="text-decoration:none" href="' + s.url + '" download="' + esc(s.name) + '" target="_blank">Öffnen</a></div>');

  /* ================= Sicherung ================= */
  const Sync = {
    busy: false, t: null,
    cfg() {
      const c = LS.get('sync', null);
      return c && c.repo && c.token ? c : null;
    },
    ownerGuess() {
      for (const k of ['kochwerk_sync', 'satzwerk.cloud']) { try { const x = JSON.parse(LS.raw(k) || 'null'); if (x && x.repo && /\//.test(x.repo)) return Y.cleanRepo(x.repo).split('/')[0]; } catch (e) { } }
      return 'hendrikcharles48-dev';
    },
    // Zugang aus Kochwerk/Satzwerk still übernehmen, wenn derselbe Schlüssel auch für Geldwerk-Daten gilt
    async adopt() {
      if (Sync.cfg() || LS.get('syncOff', false)) return false;
      const last = LS.get('adoptTried', 0); if (Date.now() - last < 864e5) return false;
      LS.set('adoptTried', Date.now());
      for (const [k, from] of [['kochwerk_sync', 'Kochwerk'], ['satzwerk.cloud', 'Satzwerk']]) {
        let x = null; try { x = JSON.parse(LS.raw(k) || 'null'); } catch (e) { }
        if (!x || !x.repo || !x.token) continue;
        const cfg = { repo: Y.cleanRepo(x.repo).split('/')[0] + '/' + Y.REPO_NAME, token: String(x.token).trim() };
        const r = await Y.test(cfg);
        if (r.ok) { LS.set('sync', Object.assign(cfg, { from })); return true; }
      }
      return false;
    },
    schedule(ms) { if (!Sync.cfg()) return; clearTimeout(Sync.t); Sync.t = setTimeout(() => Sync.run(), ms || 8000); },
    async run(force) {
      const c = Sync.cfg(); if (!c || Sync.busy) return;
      if (navigator.onLine === false) { Sync.state({ err: null, offline: true }); return; }
      Sync.busy = true;
      try {
        const r = await Y.syncOnce(c, st.db, null, /iPhone/.test(navigator.userAgent) ? 'iPhone' : 'Gerät');
        if (!r.ok) { Sync.state({ err: r.offline ? null : r.error, offline: !!r.offline }); return; }
        if (r.fromRemote) { st.db = r.data; await S.save(st.db); recalc(); refresh(); }
        Sync.state({ last: Date.now(), err: null, offline: false });
        await Sync.files(c);
      } finally { Sync.busy = false; if (st.tab === 'home' && !st.stack.length) render(); }
    },
    state(o) { LS.set('syncState', Object.assign(LS.get('syncState', {}), o)); },
    // Fotos hochladen (einmal) und fehlende vom Repository holen
    async files(c) {
      const keys = new Set(await S.fileKeys());
      const refs = new Map();
      for (const r of G.live(st.db, 'receipts')) for (const f of r.files || []) refs.set(f.id, f);
      let pending = 0;
      for (const id of keys) {
        if (!refs.has(id)) continue;
        const f = await S.getFile(id); if (!f || f.up) continue;
        const bytes = new Uint8Array(await f.blob.arrayBuffer());
        const r = await Y.putFile(c, { id, type: f.type }, bytes);
        if (r.ok) await S.markUp(id); else { pending++; if (r.offline) break; }
      }
      for (const [id, meta] of refs) {
        if (keys.has(id)) continue;
        const g = await Y.getFile(c, meta);
        if (g.ok) await S.putFile({ id, type: meta.type, w: meta.w, h: meta.h, blob: new Blob([g.bytes], { type: meta.type === 'pdf' ? 'application/pdf' : 'image/jpeg' }), up: true });
        else if (g.offline) break;
      }
      Sync.state({ pendingFiles: pending });
    }
  };
  async function connectSync(p, restore) {
    const acc = Y.parseAccess(p.token || '');
    const cfg = acc || { repo: Y.cleanRepo(p.repo != null ? p.repo : Sync.ownerGuess() + '/' + Y.REPO_NAME), token: String(p.token || '').trim() };
    if (!/^[^/\s]+\/[^/\s]+$/.test(cfg.repo)) { p.err = 'Repository bitte als „name/' + Y.REPO_NAME + '“ eingeben.'; return false; }
    if (!cfg.token) { p.err = 'Bitte den Schlüssel einfügen.'; return false; }
    p.busy = true; p.err = null; rerender();
    const r = await Y.test(cfg);
    p.busy = false;
    if (!r.ok) { p.err = r.msg; rerender(); return false; }
    LS.set('sync', cfg); LS.del('syncOff');
    if (restore && !r.exists) { p.err = 'Verbunden, aber im Repository liegt noch keine Sicherung.'; rerender(); return false; }
    await Sync.run(true);
    return true;
  }
  function rerender() { if (st.sheet) renderSheet(); else if (st.stack.length) renderPage(); }

  /* ================= Steuermappe ================= */
  async function buildMappe(y, onlyCheat) {
    const res = st.chain[y], R = st.rules[y], s = st.db.settings;
    const months = [];
    if (!onlyCheat) {
      const tr = G.trips(st.db, y, R);
      for (let m = 0; m < 12; m++) {
        const ds = tr.days.filter(d => +d.d.slice(5, 7) === m + 1);
        const work = ds.filter(d => d.k === 'work').length, school = ds.filter(d => d.k === 'school').length, home = ds.filter(d => d.k === 'home').length;
        const e = ds.reduce((a, d) => a + (d.k === 'work' || d.k === 'school' ? Math.floor(d.km) * tr.sum.rate : 0), 0);
        if (work || school || home) months.push({ m: G.MONTHS[m], work, school, home, eur: e });
      }
    }
    const pos = res.refund != null && res.refund >= 0;
    const model = {
      year: y, disclaimer: 'Keine Steuerberatung. Erstellt mit Geldwerk am ' + G.fmtDate(today()) + ' nach der Regeldatei ' + y + ' (Stand ' + G.fmtDate(R.stand) + '). Beträge ohne Gewähr – Regeln mit Quellen am Ende.',
      green: pos,
      headline: res.noIncome && res.loss > 0 ? 'Verlustvortrag ca. ' + eur(Math.round(res.carryOut)) : res.refund != null ? (pos ? 'ca. ' + eur(Math.round(res.refund / 10) * 10) + ' Erstattung' : 'ca. ' + eur(-Math.round(res.refund)) + ' Nachzahlung') : 'Werbungskosten ' + eur(Math.round(res.wk)),
      headsub: res.refund != null ? 'Schätzung, Spanne ' + eur(Math.floor(res.range[0] / 10) * 10) + ' bis ' + eur(Math.ceil(res.range[1] / 10) * 10) : 'Erstattung erst mit Lohnsteuerbescheinigung',
      summary: [['Werbungskosten gesamt', eur(res.wk, 2)], ['Arbeitnehmer-Pauschbetrag', eur(res.pausch, 2)], ['Angesetzt', eur(res.mid.wkUsed, 2)], ['Bruttolohn', eur(res.gross, 2)], ['Zu versteuerndes Einkommen (geschätzt)', eur(res.mid.zvE, 0)], ['Einkommensteuer (geschätzt)', eur(res.mid.est, 0)], ['Einbehaltene Lohnsteuer', eur((st.db.tax[y] || {}).lst || 0, 2)]].concat(res.loss > 0 ? [['Verlust ' + y, eur(res.loss, 2)]] : []).concat(res.carryIn ? [['Verlustvortrag aus ' + (y - 1), eur(res.carryIn, 2)]] : []),
      wk: res.lines.map(l => ({ l: l.l, detail: l.detail, eur: l.eur, unsure: !l.sure })),
      elster: cheatModel(y),
      months, tripNote: 'Einfache Entfernung: Arbeit ' + Math.floor(+s.kmWork || 0) + ' km (' + s.work.place + '), Schule ' + Math.floor(+s.kmSchool || 0) + ' km (' + s.school.place + '). ' + String(res.trips.rate).replace('.', ',') + ' € je km und Tag. Feiertage Niedersachsen und Schulferien abgezogen.',
      tripFoot: (res.trips.vacation ? res.trips.vacation + ' Urlaubstage wurden pauschal von den Arbeitstagen abgezogen. ' : '') + 'Minijob-Tage zählen nicht (pauschal versteuert).',
      exceptions: Object.entries(st.db.exc).filter(([d, e]) => d.startsWith(String(y)) && e && !e.del && e.t).sort().map(([d, e]) => [G.fmtDate(d), G.EXC[e.t].l + (e.km ? ' (' + e.km + ' km)' : '')]),
      receipts: [], images: [], rules: Object.values(R.regeln).map(r => ({ titel: r.titel, quelle: r.quelle, stand: r.stand, geprueft: r.geprueft }))
    };
    if (!onlyCheat) {
      const list = G.live(st.db, 'receipts').filter(r => r.date && (+r.date.slice(0, 4) === y || G.receiptYearAmount(r, y, R) > 0)).sort((a, b) => a.date < b.date ? -1 : 1);
      let n = 0;
      for (const r of list) {
        n++;
        const counted = G.CAT[r.cat] && G.CAT[r.cat].area ? G.receiptYearAmount(r, y, R) : 0;
        model.receipts.push({ date: r.date, merchant: n + '. ' + (r.merchant || 'Beleg'), cat: catL(r.cat), amount: +r.amount || 0, counted, note: (G.isUnsure(r) ? 'noch zu prüfen' : '') + (r.note ? (G.isUnsure(r) ? ' · ' : '') + r.note : '') });
        for (const f of (r.files || []).filter(f => f.type === 'jpg')) {
          const fl = await S.getFile(f.id); if (!fl || !fl.blob) continue;
          model.images.push({ bytes: new Uint8Array(await fl.blob.arrayBuffer()), w: fl.w || f.w, h: fl.h || f.h, caption: n + '. ' + (r.merchant || 'Beleg') + ' · ' + G.fmtDate(r.date) + ' · ' + eur(r.amount || 0, 2) });
        }
      }
    }
    return G.mappe(model, onlyCheat);
  }
  async function makePdf(onlyCheat) {
    const y = st.year;
    const name = (onlyCheat ? 'ELSTER-Spickzettel-' : 'Steuermappe-') + y + '.pdf';
    openSheet({ k: 'mappe', busy: 'PDF wird erstellt …' });
    try {
      const bytes = await buildMappe(y, onlyCheat);
      const blob = new Blob([bytes], { type: 'application/pdf' });
      if (st.mappeUrl) URL.revokeObjectURL(st.mappeUrl);
      st.mappeUrl = URL.createObjectURL(blob); st.mappeBlob = blob;
      openSheet({ k: 'mappe', name, size: blob.size, url: st.mappeUrl });
    } catch (e) { openSheet({ k: 'mappe', err: 'PDF ging nicht: ' + (e && e.message || e) }); }
  }

  /* ================= Aktionen ================= */
  const A = {};
  A.tab = el => { st.tab = el.dataset.t || el.dataset.tab; LS.set('tab', st.tab); closeAllPages(); window.scrollTo(0, 0); };
  A.plus = () => { haptic(); openSheet({ k: 'plus' }); };
  A.closeSheet = () => closeSheet();
  A.toastAct = () => { $('#toast').hidden = true; if (st.toastAct) st.toastAct(); };
  A.cam = () => { closeSheet(); $('#f-cam').value = ''; $('#f-cam').click(); };
  A.pickFile = () => { closeSheet(); $('#f-file').value = ''; $('#f-file').click(); };
  A.settings = el => { closeSheet(); pushPage({ k: 'settings' }); if (el && el.dataset.sec === 'sync') setTimeout(() => { const s = $('#sec-sync'); if (s) s.scrollIntoView({ block: 'start' }); }, 60); };
  A.back = () => popPage();
  A.year = el => { st.year = +el.dataset.y; LS.set('year', st.year); render(); };
  A.filter = el => { st.filter = el.dataset.f; render(); };
  A.filterTax = () => { st.tab = 'belege'; st.filter = 'steuer'; st.q = ''; LS.set('tab', 'belege'); render(); window.scrollTo(0, 0); };
  A.rules = () => pushPage({ k: 'rules', year: st.year });
  A.rulesYear = el => { st.stack[st.stack.length - 1].year = +el.dataset.y; renderPage(); };
  A.cheat = () => pushPage({ k: 'cheat' });
  A.cheatPdf = () => makePdf(true);
  A.mappe = () => makePdf(false);
  A.mappeShare = async () => {
    const f = new File([st.mappeBlob], (st.sheet && st.sheet.name) || 'Steuermappe.pdf', { type: 'application/pdf' });
    try { if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: f.name }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
    const a = document.createElement('a'); a.href = st.mappeUrl; a.download = f.name; document.body.appendChild(a); a.click(); a.remove();
  };
  A.openCal = () => { const y = st.year; const t = today(); const m = t.startsWith(String(y)) ? +t.slice(5, 7) - 1 : (y < +t.slice(0, 4) ? 11 : 0); pushPage({ k: 'cal', year: y, month: m }); };
  A.calMonth = el => { const p = st.stack[st.stack.length - 1]; p.month = Math.min(11, Math.max(0, p.month + +el.dataset.d)); renderPage(); };
  A.calDay = el => openSheet({ k: 'day', d: el.dataset.d });
  A.setExc = el => {
    const d = st.sheet.d, t = el.dataset.t;
    st.db.exc[d] = t ? touch(Object.assign({}, st.db.exc[d] && !st.db.exc[d].del ? st.db.exc[d] : {}, { t, del: false })) : touch({ del: true });
    haptic(); commit({ render: false }); render(); renderPage();
    if (t === 'weg' || t === 'pruefung') renderSheet(); else closeSheet();
  };
  A.inboxOpen = el => {
    const it = st.inbox.find(i => i.key === el.dataset.key); if (!it) return;
    if (it.kind === 'pruefen' || it.kind === 'rueckgabe' || it.kind === 'gewaehr' || it.kind === 'garantie') { const r = st.db.receipts[it.id]; if (r) { pushPage({ k: 'receipt', d: receiptDraft(r), touched: {}, dlKey: it.kind !== 'pruefen' ? it.key : null }); if (it.kind !== 'pruefen') toast(it.sub, 4000, { l: 'Erledigt', fn: () => dismiss(it.key) }); } }
    else if (it.kind === 'kuendigung' || it.kind === 'noetig') { const c = st.db.contracts[it.id]; if (c) { pushPage({ k: 'contract', d: JSON.parse(JSON.stringify(c)), check: it.kind === 'noetig' ? it.key : null }); if (it.kind === 'kuendigung') toast(it.sub, 4000, { l: 'Erledigt', fn: () => dismiss(it.key) }); } }
    else if (it.kind === 'lohnsteuer') { st.year = it.year; openSheet({ k: 'lst' }); }
    else if (it.kind === 'steuerfrist') { st.year = it.year; st.tab = 'steuer'; render(); }
  };
  A.inboxOpenDl = el => {
    const key = el.dataset.key;
    if (key.startsWith('f:')) { st.year = +key.slice(2); st.tab = 'steuer'; render(); return; }
    const id = key.split(':')[1];
    if (key.startsWith('k:')) { const c = st.db.contracts[id]; if (c) pushPage({ k: 'contract', d: JSON.parse(JSON.stringify(c)) }); }
    else { const r = st.db.receipts[id]; if (r) pushPage({ k: 'receipt', d: receiptDraft(r), touched: {} }); }
  };
  function dismiss(key) { st.db.dismissed[key] = touch({}); commit(); toast('Erledigt'); }
  // Belege
  A.openReceipt = el => { const r = st.db.receipts[el.dataset.id]; if (r) pushPage({ k: 'receipt', d: receiptDraft(r), touched: {} }); };
  A.receiptCancel = async () => {
    const p = st.stack[st.stack.length - 1];
    if (p.isNew && !p.saved) for (const f of p.d.files || []) S.delFile(f.id).catch(() => { });
    popPage();
  };
  A.receiptSave = () => saveReceipt(st.stack[st.stack.length - 1]);
  A.receiptDelete = () => {
    const p = st.stack[st.stack.length - 1], id = p.d.id, old = st.db.receipts[id];
    st.db.receipts[id] = touch({ id, del: true }); commit(); popPage();
    toast('Beleg gelöscht', 5000, { l: 'Rückgängig', fn: () => { st.db.receipts[id] = touch(old); commit(); } });
  };
  A.rCat = el => { const p = st.stack[st.stack.length - 1]; p.d.cat = el.dataset.c; p.touched.cat = true; p.d.unsure = (p.d.unsure || []).filter(k => k !== 'cat'); if (G.CAT[p.d.cat] && G.CAT[p.d.cat].area === 'arbeitsmittel' && p.d.share == null) p.d.share = G.CAT[p.d.cat].share; else if (!G.CAT[p.d.cat] || G.CAT[p.d.cat].area !== 'arbeitsmittel') delete p.d.share; renderPage(); };
  A.rShare = el => { const p = st.stack[st.stack.length - 1]; p.d.share = +el.dataset.v; renderPage(); };
  A.rKind = el => { const p = st.stack[st.stack.length - 1]; p.d.kind = el.dataset.v; p.touched.kind = true; delete p.d.returnDays; renderPage(); };
  A.rGuar = el => { const p = st.stack[st.stack.length - 1]; p.d.guaranteeYears = +el.dataset.v; renderPage(); };
  A.fullImg = async el => { const u = await loadFileURL(el.dataset.id); if (!u) return; const d = document.createElement('div'); d.className = 'fullimg'; d.innerHTML = '<img alt="" src="' + u + '">'; d.onclick = () => d.remove(); document.body.appendChild(d); };
  // Verträge
  A.newContract = () => { closeSheet(); pushPage({ k: 'contract', d: newContract('kfz'), isNew: true }); };
  A.openContract = el => { const c = st.db.contracts[el.dataset.id]; if (c) pushPage({ k: 'contract', d: JSON.parse(JSON.stringify(c)) }); };
  const cp = () => st.stack[st.stack.length - 1].d;
  A.cTpl = el => { applyTpl(cp(), el.dataset.t); renderPage(); };
  A.cRh = el => { cp().rhythm = el.dataset.v; renderPage(); };
  A.cStep = el => { const c = cp(); c[el.dataset.k] = Math.max(0, (+c[el.dataset.k] || 0) + +el.dataset.d); renderPage(); };
  A.cRenew = el => { cp().renew = +el.dataset.v; renderPage(); };
  A.cNotice = el => { const c = cp(); c.notice = Object.assign({ n: 1, u: 'm' }, c.notice); c.notice.n = Math.max(0, c.notice.n + +el.dataset.d); renderPage(); };
  A.cNoticeU = el => { const c = cp(); c.notice = Object.assign({ n: 1, u: 'm' }, c.notice, { u: el.dataset.v }); renderPage(); };
  A.cTax = () => { const c = cp(); c.tax = !c.tax; renderPage(); };
  A.contractSave = () => saveContract(st.stack[st.stack.length - 1]);
  A.contractDelete = () => {
    const id = cp().id, old = st.db.contracts[id];
    st.db.contracts[id] = touch({ id, del: true }); commit(); popPage();
    toast('Vertrag gelöscht', 5000, { l: 'Rückgängig', fn: () => { st.db.contracts[id] = touch(old); commit(); } });
  };
  A.cCancelSheet = () => openSheet({ k: 'cancel' });
  A.copyCancel = async () => { const t = $('#sheet pre.copy').textContent; try { await navigator.clipboard.writeText(t); toast('Kopiert'); } catch (e) { toast('Kopieren ging nicht – Text lange drücken'); } };
  A.cKeep = () => { const p = st.stack[st.stack.length - 1]; const c = p.d; c.checked = today(); if (p.check) st.db.dismissed[p.check] = touch({}); st.db.contracts[c.id] = touch(Object.assign({}, st.db.contracts[c.id], { checked: today() })); p.check = null; commit(); toast('Behalten – nächste Frage in einem Jahr'); };
  A.cEnded = () => { const c = cp(); const n = G.nextCancel(c, today()); c.ended = (n && n.end) || today(); saveContract(st.stack[st.stack.length - 1]); };
  A.cReopen = () => { const c = cp(); delete c.ended; renderPage(); };
  // Steuer-Angaben
  A.sheetLst = () => openSheet({ k: 'lst' });
  A.sheetZuschuss = () => openSheet({ k: 'zuschuss' });
  A.sheetCarry = () => openSheet({ k: 'carry' });
  A.sheetDone = () => { closeSheet(); commit(); };
  A.filed = () => { const y = st.year; const t = st.db.tax[y] = Object.assign({}, st.db.tax[y] || {}); t.filed = !t.filed; touch(t); haptic(); commit(); };
  A.toggleKonto = () => { setS('kontofuehrung', st.db.settings.kontofuehrung === false); commit(); };
  // Block
  A.openBlock = () => { closeSheet(); pushPage({ k: 'block', text: '' }); };
  A.pasteBlock = async () => { try { const t = await navigator.clipboard.readText(); st.stack[st.stack.length - 1].text = t; renderPage(); } catch (e) { toast('Zwischenablage gesperrt – lange ins Feld tippen und „Einsetzen“'); } };
  A.applyBlock = () => { const p = st.stack[st.stack.length - 1]; const done = applyBlocks(p.text); commit({ now: true }); popPage(); toast('Übernommen: ' + done.join(', ')); };
  // Einrichtung
  A.setupNext = el => {
    const p = st.stack[st.stack.length - 1];
    const k = SETUP_STEPS[p.step];
    if (k === 'kmWork' && !(+st.db.settings.kmWork > 0) && !(el && el.dataset.skip)) return;
    p.step = Math.min(SETUP_STEPS.length - 1, p.step + 1); p.err = null;
    if (SETUP_STEPS[p.step] === 'wage' && !(+st.db.settings.work.to.slice(0, 4) >= 2026)) p.step++;
    commit({ render: false });
    renderPage(true); $('#page').scrollTop = 0;
  };
  A.setupBack = () => { const p = st.stack[st.stack.length - 1]; p.step = Math.max(0, p.step - 1); p.err = null; renderPage(); };
  A.setupDay = el => {
    const k = el.dataset.k, d = +el.dataset.d, s = st.db.settings;
    const arr = k === 'jobDays' ? s.jobDays.slice() : s[k].days.slice();
    const i = arr.indexOf(d); if (i >= 0) arr.splice(i, 1); else arr.push(d); arr.sort();
    if (k === 'jobDays') s.jobDays = arr; else s[k] = Object.assign({}, s[k], { days: arr });
    s.upd = now(); commit({ render: false }); haptic(); renderPage();
  };
  A.vacStep = el => { const s = st.db.settings, y = +s.work.from.slice(0, 4); s.vacation = Object.assign({}, s.vacation, { [y]: Math.max(0, ((s.vacation || {})[y] || 0) + +el.dataset.d) }); s.upd = now(); renderPage(); };
  A.setupFinish = () => { setS('setupDone', true); commit({ now: true }); closeAllPages(); st.tab = 'home'; render(); };
  A.restoreStart = () => openSheet({ k: 'restore' });
  A.restoreGo = async () => {
    const s = st.sheet; const ok = await connectSync(s, true);
    if (ok) { closeSheet(); if (st.db.settings.setupDone) { closeAllPages(); toast('Wiederhergestellt – Fotos laden im Hintergrund'); } else { renderPage(); toast('Sicherung geladen'); } }
  };
  // Sicherung
  A.syncConnect = async () => { const p = st.sheet || st.stack[st.stack.length - 1]; const ok = await connectSync(p, false); if (ok) { toast('Sicherung verbunden'); rerender(); } };
  A.syncNow = async () => { toast('Sichere …'); await Sync.run(true); const s = LS.get('syncState', {}); toast(s.err ? 'Fehler: ' + s.err : s.offline ? 'Offline – wird nachgeholt' : 'Gesichert'); rerender(); render(); };
  A.syncOff = () => openSheet({ k: 'confirm', title: 'Sicherung trennen?', text: 'Die Daten bleiben auf dem Gerät und im Repository. Es wird nur nicht mehr automatisch gesichert.', yes: 'Trennen', fn: () => { LS.del('sync'); LS.set('syncOff', true); rerender(); } });
  A.copyAccess = async () => { const c = Sync.cfg(); try { await navigator.clipboard.writeText(Y.accessCode(c)); toast('Zugangscode kopiert – nur an dich selbst schicken'); } catch (e) { toast('Kopieren ging nicht'); } };
  // Mitteilungen
  A.pushOn = async () => {
    const p = st.stack[st.stack.length - 1];
    p.busy = true; p.err = null; renderPage();
    if (p.pw || p.url) { const c = await G.Push.connect(p.url || G.Push.DEFAULT_URL, p.pw); if (!c.ok) { p.busy = false; p.err = c.error; p.needCfg = true; renderPage(); return; } }
    const r = await G.Push.enable();
    p.busy = false;
    if (!r.ok) { p.err = r.error; p.needCfg = !!r.needCfg || /Passwort|Worker/.test(r.error); renderPage(); return; }
    recalc(); toast('Mitteilungen sind an'); renderPage();
  };
  A.pushOff = async () => { await G.Push.disable(); renderPage(); toast('Mitteilungen aus'); };
  A.pushTest = async () => { toast('Sende …'); const r = await G.Push.test(); toast(r.ok ? 'Gesendet – kommt gleich' : r.error); };
  // Daten
  A.exportFile = async () => {
    toast('Datei wird erstellt …');
    const files = {};
    for (const id of await S.fileKeys()) { const f = await S.getFile(id); if (f && f.blob) files[id] = { type: f.type, w: f.w, h: f.h, b64: Y.bytesToB64(new Uint8Array(await f.blob.arrayBuffer())) }; }
    const blob = new Blob([Y.exportText(st.db, files)], { type: 'application/json' });
    const name = 'geldwerk-sicherung-' + today() + '.json';
    const file = new File([blob], name, { type: 'application/json' });
    try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: name }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
  };
  A.importFile = () => { $('#f-backup').value = ''; $('#f-backup').click(); };
  A.wipeAsk = () => openSheet({ k: 'confirm', title: 'Alles auf diesem Gerät löschen?', text: 'Belege, Fotos, Verträge und Einstellungen von Geldwerk werden auf diesem Gerät gelöscht. Andere Apps bleiben unberührt. Die Sicherung im Repository bleibt.', yes: 'Endgültig löschen', fn: async () => { try { await G.Push.disable(); } catch (e) { } await S.wipe(); location.reload(); } });
  A.confirmYes = async () => { const f = st.sheet && st.sheet.fn; closeSheet(); if (f) await f(); };

  /* ================= Eingaben ================= */
  const IN = {};
  const num = v => { const n = G.num(v); return n == null ? null : n; };
  IN.q = el => { st.q = el.value; const l = $('#rlist'); if (l) l.innerHTML = receiptListHtml(); };
  IN.setKm = el => { setS(el.dataset.k, num(el.value)); const b = $('#page .btn.primary'); if (b) b.disabled = !(+st.db.settings[el.dataset.k] > 0); };
  IN.vac = el => { const s = st.db.settings, y = +s.work.from.slice(0, 4); s.vacation = Object.assign({}, s.vacation, { [y]: Math.max(0, parseInt(el.value, 10) || 0) }); s.upd = now(); };
  IN.lst = el => { const y = +el.dataset.y; const t = st.db.tax[y] = Object.assign({}, st.db.tax[y] || {}); const v = num(el.value); if (v == null) delete t[el.dataset.k]; else t[el.dataset.k] = v; touch(t); deferCommit(); };
  IN.tax = el => { const y = +el.dataset.y; const t = st.db.tax[y] = Object.assign({}, st.db.tax[y] || {}); const v = num(el.value); if (v == null) delete t[el.dataset.k]; else t[el.dataset.k] = v; touch(t); deferCommit(); };
  IN.carry = el => { setS('carry2025', num(el.value) || 0); deferCommit(); };
  IN.rf = el => { const p = st.stack[st.stack.length - 1], k = el.dataset.k; p.touched[k] = true; p.d.unsure = (p.d.unsure || []).filter(x => x !== k); el.closest('.field').classList.remove('unsure'); p.d[k] = k === 'amount' ? num(el.value) : k === 'nd' ? parseInt(el.value, 10) || 3 : el.value; if (k === 'merchant' && !p.touched.cat) { const g = G.guessCat(el.value, st.db.learn); if (g && g.cat !== p.d.cat) { p.d.cat = g.cat; p.d.unsure = p.d.unsure.filter(x => x !== 'cat'); document.querySelectorAll('#page [data-a="rCat"]').forEach(b => b.classList.toggle('on', b.dataset.c === g.cat)); } } };
  IN.cf = el => { const c = cp(), k = el.dataset.k; c[k] = k === 'amount' ? num(el.value) : k === 'term' ? parseInt(el.value, 10) || 0 : el.value; };
  IN.cNoticeN = el => { const c = cp(); c.notice = Object.assign({ n: 1, u: 'm' }, c.notice, { n: Math.max(0, parseInt(el.value, 10) || 0) }); };
  IN.pf = el => { const p = st.sheet || st.stack[st.stack.length - 1]; p[el.dataset.k] = el.value; };
  IN.blockText = el => { const p = st.stack[st.stack.length - 1]; p.text = el.value; later(() => { const b = $('#blockPrev'); if (b) b.innerHTML = blockPreview(p.text); }, 400); };
  let dT = null; function deferCommit() { clearTimeout(dT); dT = setTimeout(() => commit({ render: false }), 400); }
  let lT = null; function later(fn, ms) { clearTimeout(lT); lT = setTimeout(fn, ms || 500); }
  // Änderungen (beim Verlassen des Feldes)
  const CH = {};
  CH.setRange = el => { const s = st.db.settings, k = el.dataset.k; if (!G.isDate(el.value)) return; s[k] = Object.assign({}, s[k], { [el.dataset.f]: el.value }); s.upd = now(); commit({ render: false }); };
  CH.setKmCh = el => { setS(el.dataset.k, num(el.value)); commit(); };
  CH.vacCh = el => { const s = st.db.settings; s.vacation = Object.assign({}, s.vacation, { [el.dataset.y]: Math.max(0, parseInt(el.value, 10) || 0) }); s.upd = now(); commit(); };
  CH.rfDate = el => { const p = st.stack[st.stack.length - 1]; p.d.date = el.value || null; p.touched.date = true; p.d.unsure = (p.d.unsure || []).filter(x => x !== 'date'); renderPage(); };
  CH.rfReturn = el => { const p = st.stack[st.stack.length - 1]; if (el.value && p.d.date) p.d.returnDays = Math.max(0, G.diffDays(p.d.date, el.value)); else p.d.returnDays = 0; renderPage(); };
  CH.cStart = el => { cp().start = el.value || null; renderPage(); };
  CH.cYearEnd = el => { const m = /(\d{1,2})\.(\d{1,2})/.exec(el.value); if (m) cp().yearEnd = G.pad(+m[2]) + '-' + G.pad(+m[1]); renderPage(); };
  CH.excKm = el => { const d = st.sheet.d; const e = st.db.exc[d]; if (!e) return; e.km = num(el.value); touch(e); commit({ render: false }); render(); renderPage(); };
  CH.myName = el => { setS('name', el.value.trim()); commit({ render: false }); renderSheet(); };

  /* ================= Start ================= */
  function bind() {
    document.addEventListener('click', e => {
      const t = e.target.closest('[data-tab]');
      if (t && t.closest('.tabbar')) { A.tab(t); return; }
      const el = e.target.closest('[data-a]');
      if (el && A[el.dataset.a]) { if (el.tagName === 'A' && el.getAttribute('href')) return; e.preventDefault(); A[el.dataset.a](el, e); return; }
      if (e.target.id === 'sheet') closeSheet();
    });
    document.addEventListener('input', e => { const el = e.target.closest('[data-in]'); if (el && IN[el.dataset.in]) IN[el.dataset.in](el); });
    document.addEventListener('change', e => { const el = e.target.closest('[data-ch]'); if (el && CH[el.dataset.ch]) CH[el.dataset.ch](el); });
    document.addEventListener('focusin', e => { if (e.target.matches('input,textarea')) setTimeout(() => { try { e.target.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (x) { } }, 300); });
    $('#f-cam').addEventListener('change', e => newReceiptFromFile(e.target.files[0]));
    $('#f-file').addEventListener('change', e => newReceiptFromFile(e.target.files[0]));
    $('#f-backup').addEventListener('change', async e => {
      const f = e.target.files[0]; if (!f) return;
      const p = Y.parseBackup(await f.text());
      if (p.error) { toast(p.error); return; }
      const m = G.merge(st.db, p.data); st.db = m.data;
      for (const [id, x] of Object.entries(p.files || {})) { if (await S.getFile(id)) continue; const bin = atob(x.b64), b = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i); await S.putFile({ id, type: x.type, w: x.w, h: x.h, blob: new Blob([b], { type: x.type === 'pdf' ? 'application/pdf' : 'image/jpeg' }), up: false }); }
      await S.save(st.db); closeSheet(); commit({ now: true });
      if (st.db.settings.setupDone) closeAllPages();
      toast('Datei geladen und zusammengeführt');
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (st.sheet) closeSheet(); else if (st.stack.length && st.stack[0].k !== 'setup') popPage(); } });
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') { S.save(st.db); if (Sync.cfg()) Sync.run(); } else { recalc(); if (!st.stack.length) render(); } });
    window.addEventListener('online', () => Sync.schedule(1000));
  }
  async function loadRules() {
    await Promise.all(RULE_YEARS.map(async y => {
      try { const r = await fetch('regeln/' + y + '.json', { cache: 'no-cache' }); if (r.ok) st.rules[y] = await r.json(); } catch (e) { }
    }));
  }
  async function boot() {
    bind();
    st.db = await S.load();
    await loadRules();
    st.year = LS.get('year', null) || defaultYear();
    if (!RULE_YEARS.includes(st.year)) st.year = defaultYear();
    recalc();
    render();
    if (!st.db.settings.setupDone) {
      await Sync.adopt().catch(() => false);
      if (Sync.cfg()) { await Sync.run(true); }
      if (!st.db.settings.setupDone) openSetup(0); else { recalc(); render(); }
    } else {
      Sync.adopt().then(ok => { if (ok) Sync.run(); }).catch(() => { });
      Sync.schedule(2500);
    }
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { }
    window.__gw = { st, commit, G };   // für die automatischen Oberflächen-Tests
  }
  boot();
})();
