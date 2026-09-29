/* Satzwerk – App-Oberfläche */
(function () {
  const E = window.ENGINE, D = window.EXDB;
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clone = o => o == null ? o : JSON.parse(JSON.stringify(o));
  const num = v => { if (v === '' || v == null) return null; const n = parseFloat(String(v).replace(',', '.')); return isFinite(n) ? n : null; };
  const fmt = (n, d) => n == null || !isFinite(n) ? '–' : Number(n).toLocaleString('de-DE', { maximumFractionDigits: d ?? 2 });
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  const st = { profile: null, workouts: [], active: null, tab: 'heute', ov: null, sheet: null, rest: null, hold: null, toast: null, progSeg: 'overview', libQ: '', libGroup: '', libAvail: true, libTab: 'all', libF: {}, homeFilter: 'all', chartEx: null, timer: { mode: 'rest' }, planLoc: null, homeLoc: null };

  /* ================= Icons ================= */
  const I = {
    dumbbell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/></svg>',
    plan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="4" width="16" height="17" rx="2.5"/><path d="M8 2.5v3M16 2.5v3M8 10h8M8 14h8M8 18h5"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15zM4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20h18M5 16l4.5-5 3.5 3 6-7"/></svg>',
    timer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 2M9.5 2.5h5"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    chev: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    swap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h13l-3.5-3.5M20 16H7l3.5 3.5"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l13-7.5z"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M9 7h8v8"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>',
    note: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 4h14v16H5zM9 9h6M9 13h6M9 17h3"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-5h4v5"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4.5" width="4" height="15" rx="1"/><rect x="14" y="4.5" width="4" height="15" rx="1"/></svg>'
  };

  /* ================= Speicher ================= */
  const LS = {
    get(k) { try { const v = localStorage.getItem('satzwerk.' + k); return v ? JSON.parse(v) : null; } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem('satzwerk.' + k, JSON.stringify(v)); } catch (e) { } }
  };
  const Store = {
    mode: 'local', db: null, uid: null, q: {}, timers: {},
    async init() {
      try {
        if (window.claude && typeof window.claude.use === 'function') {
          const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
          if (db && user) { const id = await user.id(); if (id) { this.db = db; this.uid = id; this.mode = 'db'; } }
        }
      } catch (e) { this.mode = 'local'; }
      if (this.mode === 'db') {
        try {
          const [p, a, ws] = await Promise.all([this.pRef().get(), this.aRef().get(), this.wCol().limit(1000).get()]);
          st.profile = p.exists ? clone(p.data()) : null;
          st.active = a.exists && a.data().active ? clone(a.data().active) : null;
          st.workouts = ws.docs.map(d => clone(d.data()));
          if (!st.profile && LS.get('profile')) {
            st.profile = LS.get('profile'); st.workouts = LS.get('workouts') || []; st.active = LS.get('active');
            this.saveProfile(true); for (const w of st.workouts) this.saveWorkout(w); this.saveActive(true);
          }
        } catch (e) { this.mode = 'local'; this.loadLocal(); toast('Online-Speicher nicht erreichbar, nutze Gerätespeicher'); }
      } else this.loadLocal();
      st.workouts.sort((x, y) => (x.ts || 0) - (y.ts || 0));
    },
    loadLocal() { st.profile = LS.get('profile'); st.workouts = LS.get('workouts') || []; st.active = LS.get('active'); },
    pRef() { return this.db.doc('data/users/' + this.uid + '/profile'); },
    aRef() { return this.db.doc('data/users/' + this.uid + '/active'); },
    wCol() { return this.pRef().collection('workouts'); },
    write(key, fn) {
      const run = () => fn().catch(err => { if (err && err.code === 'unavailable') return new Promise(r => setTimeout(r, 800 + Math.random() * 800)).then(fn).catch(() => toast('Speichern fehlgeschlagen, bitte später erneut')); if (err && err.code === 'quota_exceeded') toast('Speicher voll: bitte alte Trainings löschen'); else if (err) toast('Speichern fehlgeschlagen'); });
      this.q[key] = (this.q[key] || Promise.resolve()).then(run); return this.q[key];
    },
    debounce(key, ms, fn) { clearTimeout(this.timers[key]); this.timers[key] = setTimeout(fn, ms); },
    saveProfile(now) {
      LS.set('profile', st.profile);
      if (this.mode !== 'db') return;
      const go = () => this.write('p', () => this.pRef().set(clone(st.profile)));
      now ? go() : this.debounce('p', 700, go);
    },
    saveActive(now) {
      LS.set('active', st.active);
      if (this.mode !== 'db') return;
      const go = () => this.write('a', () => this.aRef().set({ active: clone(st.active) || null }));
      now ? go() : this.debounce('a', 1200, go);
    },
    saveWorkout(w) {
      LS.set('workouts', st.workouts);
      if (this.mode === 'db') this.write('w' + w.id, () => this.wCol().doc(w.id).set(clone(w)));
    },
    deleteWorkout(id) {
      LS.set('workouts', st.workouts);
      if (this.mode === 'db') this.write('w' + id, () => this.wCol().doc(id).delete());
    }
  };

  /* ================= Hilfen ================= */
  const P = () => st.profile;
  const plan = () => st.profile && st.profile.plan;
  const settings = () => Object.assign({ sound: true, vib: true, autoRest: true, bbStep: 2.5, stackStep: 2.5, rpe: false }, (st.profile && st.profile.settings) || {});
  function getEx(id) { return D.byId[id] || ((P() && P().custom) || []).find(e => e.id === id) || null; }
  function registerCustom() { for (const c of (P() && P().custom) || []) D.byId[c.id] = c; }
  function defLoc() { const a = (P() && P().answers) || {}; return a.location === 'gym' ? 'gym' : 'home'; }
  function locs() { const a = (P() && P().answers) || {}; return a.location === 'both' ? ['home', 'gym'] : [defLoc()]; }
  const LOCN = { home: 'Zuhause', gym: 'Studio' };
  const ROLE = { main: ['G', 'Grundübung'], sec: ['E', 'Ergänzung'], iso: ['I', 'Isolation'], skill: ['S', 'Skill'], core: ['R', 'Rumpf'], cond: ['K', 'Kondition'] };
  const plateHTML = r => `<span class="plate p-${r}" title="${ROLE[r] ? ROLE[r][1] : ''}">${ROLE[r] ? ROLE[r][0] : ''}</span>`;
  function roleOfEx(ex) { return ex.role === 'c' ? 'sec' : ex.role === 'i' ? 'iso' : ex.role === 's' ? 'skill' : ex.role === 'x' ? 'cond' : 'core'; }
  function unitFor(ex) { return ex.kind === 'hold' || ex.kind === 'int' ? 's' : ''; }
  function rrText(rr, ex) { if (!rr) return ''; return ex && (ex.kind === 'hold' || ex.kind === 'int') ? `${rr[0]}–${rr[1]} s` : `${rr[0]}–${rr[1]}`; }
  function estMinutes(day, loc) { return Math.round(6 + day.slots.filter(s => s.ex[loc]).reduce((t, sl) => t + sl.sets * (0.8 + sl.rest / 60), 0)); }
  function dateDE(iso, opts) { const d = new Date(iso.length <= 10 ? iso + 'T12:00:00' : iso); return d.toLocaleDateString('de-DE', opts || { weekday: 'short', day: 'numeric', month: 'short' }); }
  function durTxt(sec) { const m = Math.round(sec / 60); return m >= 60 ? Math.floor(m / 60) + ' h ' + (m % 60) + ' min' : m + ' min'; }
  function mmss(s) { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
  function rirLabel(r, ex) {
    if (ex && ex.kind === 'hold') return r * 3 >= 15 ? '15+ s' : (r * 3) + ' s';
    return settings().rpe ? 'RPE ' + fmt(Math.max(5, 10 - r), 1) : (r >= 5 ? '5+' : String(r));
  }
  const figSVG = (ex, o) => ex ? window.FIG.svg(ex, o) : '';
  const thumb = ex => `<div class="thumb">${figSVG(ex)}</div>`;
  function dayFocus(day, loc) {
    const cnt = {}; for (const sl of day.slots) { const ex = getEx(sl.ex[loc]); if (!ex) continue; for (const g in D.GROUPS) if (ex.prim.some(m => D.GROUPS[g].includes(m))) cnt[g] = (cnt[g] || 0) + (sl.r === 'main' ? 2 : 1); }
    return Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a]).slice(0, 3).join(' / ');
  }
  function heroEx(day, loc) { const sl = day.slots.find(x => x.r === 'main' && x.ex[loc]) || day.slots.find(x => x.ex[loc]); return sl ? getEx(sl.ex[loc]) : null; }
  function recovery() {
    const last = {}; const now = Date.now();
    for (const w of st.workouts) {
      const per = {};
      for (const e of w.exercises) { const ex = getEx(e.exId); if (!ex) continue; const n = e.sets.length; for (const g in D.GROUPS) if (ex.prim.some(m => D.GROUPS[g].includes(m))) per[g] = (per[g] || 0) + n; }
      for (const g in per) if (!last[g] || last[g].ts < w.ts) last[g] = { ts: w.ts || 0, sets: per[g] };
    }
    return Object.keys(D.GROUPS).map(g => { const l = last[g]; if (!l) return { g, pct: 100, fresh: true }; const need = l.sets >= 6 ? 72 : l.sets >= 3 ? 48 : 24; const h = (now - l.ts) / 36e5; return { g, pct: Math.max(5, Math.min(100, Math.round(h / need * 100))), h }; });
  }
  function prevEntry(exId) { const h = E.historyFor(exId, st.workouts); return h.length ? h[h.length - 1] : null; }
  const shortSet = (ex, s) => !s ? '–' : (ex.kind === 'hold' || ex.kind === 'int') ? fmt(s.sec) + ' s' : ex.kind === 'load' ? fmt(s.w) + '×' + fmt(s.reps) : ((s.w ? '+' + fmt(s.w) + '×' : '') + fmt(s.reps));
  function toast(msg, ms) { st.toast = msg; renderToast(); clearTimeout(toast.t); toast.t = setTimeout(() => { st.toast = null; renderToast(); }, ms || 2600); }

  /* Ton & Vibration */
  let actx = null;
  function beep(freq, dur, when) {
    if (!settings().sound) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const o = actx.createOscillator(), g = actx.createGain(); const t = actx.currentTime + (when || 0);
      o.frequency.value = freq || 880; o.type = 'sine'; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + (dur || 0.18));
      o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + (dur || 0.18) + 0.05);
    } catch (e) { }
  }
  function buzz(p) { if (settings().vib && navigator.vibrate) try { navigator.vibrate(p); } catch (e) { } }
  let wakeLock = null;
  async function keepAwake(on) {
    try { if (on && !wakeLock && navigator.wakeLock) { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', () => { wakeLock = null; }); } else if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; } } catch (e) { }
  }

  /* ================= Rendering ================= */
  function render() {
    document.documentElement.dataset.font = settings().font === 'classic' ? 'classic' : 'hand';
    const app = $('#app');
    if (!P() || !P().plan) { app.innerHTML = welcomeView(); renderTabs(false); renderLayer(); return; }
    const v = { heute: homeView, plan: planView, uebungen: libView, fortschritt: progView, timer: timerView }[st.tab] || homeView;
    app.innerHTML = v();
    renderTabs(true); renderLayer();
  }
  function renderTabs(show) {
    let t = $('#tabs');
    if (!show) { if (t) t.remove(); return; }
    if (!t) { t = document.createElement('div'); t.id = 'tabs'; t.className = 'tabs'; document.body.appendChild(t); }
    const tabs = [['heute', 'Start', I.home], ['plan', 'Plan', I.plan], ['uebungen', 'Übungen', I.dumbbell], ['fortschritt', 'Fortschritt', I.chart], ['timer', 'Timer', I.timer]];
    t.innerHTML = '<nav>' + tabs.map(([k, n, ic]) => `<button data-a="tab" data-k="${k}" aria-label="${n}" ${st.tab === k ? 'aria-current="page"' : ''}>${ic}<span>${n}</span></button>`).join('') + '</nav>';
  }
  function layerEl(id) { let el = document.getElementById(id); if (!el) { el = document.createElement('div'); el.id = id; $('#layer').appendChild(el); } return el; }
  function renderLayer() { renderOverlay(); renderSheet(); renderRest(); renderToast(); }
  function renderOverlay() {
    const el = layerEl('ov');
    if (!st.ov) { el.className = ''; el.innerHTML = ''; document.body.style.overflow = ''; return; }
    const html = { workout: workoutView, quiz: quizView, result: resultView }[st.ov.type]();
    const keep = el.scrollTop;
    el.className = 'overlay'; el.innerHTML = '<div class="inner">' + html + '</div>'; el.scrollTop = keep;
    document.body.style.overflow = 'hidden';
  }
  function renderSheet() {
    const el = layerEl('sh');
    if (!st.sheet) { el.innerHTML = ''; return; }
    const fn = SHEETS[st.sheet.type]; if (!fn) { st.sheet = null; el.innerHTML = ''; return; }
    const prev = el.querySelector('.sheet'); const keep = prev ? prev.scrollTop : 0;
    el.innerHTML = `<div class="scrim" data-a="scrim"><div class="sheet" role="dialog" aria-modal="true"><div class="sheettop"><div class="grab"></div><button class="sheetx" data-a="closeSheet" aria-label="Schließen">${I.x}</button></div>${fn(st.sheet)}</div></div>`;
    const s = el.querySelector('.sheet'); if (s && st.sheet.keepScroll) s.scrollTop = keep;
    st.sheet.keepScroll = true;
  }
  function renderToast() { const el = layerEl('ts'); el.innerHTML = st.toast ? `<div class="toast ${st.ov ? 'top' : ''}" role="status">${esc(st.toast)}</div>` : ''; }
  function openSheet(s) { st.sheet = s; renderSheet(); }
  function closeSheet() { st.sheet = null; renderSheet(); }

  /* ================= Willkommen ================= */
  function welcomeView() {
    return `<div class="topbar"><h1>Satzwerk</h1></div>
    <div class="stack">
      <div class="card lime rings-bg stack">
        <div class="eyebrow">Dein Trainingsplan · Zuhause & Studio</div>
        <div class="figdark" style="width:46%;align-self:flex-end;margin:-10px -10px -30px 0">${figSVG(D.byId["pullup"], { anim: 2.6 })}</div>
        <h2>Ein Fragebogen, ein Plan, jeder Satz neu berechnet.</h2>
        <p style="margin:0;opacity:.92">Satzwerk wählt Übungen passend zu deiner Ausrüstung (Klimmzugstange, Ringe, Kurzhantel, Seilzug oder Studio) und deinem Können. Nach jedem Satz rechnet der Algorithmus Gewicht, Wiederholungen und Satzanzahl neu aus.</p>
        <button class="btn dark big" data-a="quizStart">Fragebogen starten</button>
        <button class="btn" data-a="quickStart" style="background:rgba(20,20,22,.1);color:var(--on-light)">Mit Beispielprofil ausprobieren</button>
        <p class="tiny" style="margin:0;opacity:.85">Der Fragebogen dauert etwa 3 Minuten und hat ${E.Q.length} Fragen.</p>
      </div>
      <div class="list">
        ${[['1', 'Fragebogen', 'Ziele, Ausrüstung, Level-Tests, Beschwerden, Erholung'], ['2', 'Plan mit Begründung', 'Jede Übung zeigt, warum sie für dich gewählt wurde'], ['3', 'Training', 'Empfehlung vor jedem Satz, Reserve eintragen, Pausentimer läuft'], ['4', 'Fortschritt', 'Kraftkurven, Rekorde, Sätze pro Muskel und Woche']].map(x => `<div class="li"><span class="plate p-main">${x[0]}</span><div class="grow"><b>${x[1]}</b><div class="small muted">${x[2]}</div></div></div>`).join('')}
      </div>
    </div>`;
  }

  /* ================= Heute ================= */
  function nextDayIdx() { const p = plan(); return p ? (p.next || 0) % p.days.length : 0; }
  function homeView() {
    const p = plan(), a = P().answers || {};
    const wi = E.weekInfo(p, P());
    const sow = E.startOfWeek(); const sowIso = E.todayISO(sow);
    const weekW = st.workouts.filter(w => w.date >= sowIso);
    const doneDays = new Set(weekW.map(w => (new Date(w.date + 'T12:00:00').getDay() + 6) % 7));
    const todayIdx = (new Date().getDay() + 6) % 7;
    const di = st.homeDay ?? nextDayIdx(); const day = p.days[di] || p.days[0];
    const loc = st.homeLoc || defLoc();
    const slots = day.slots.filter(s => s.ex[loc]);
    const goal = +a.days || p.days.length; const cnt = weekW.length; const pct = Math.min(100, Math.round(cnt / goal * 100));
    const goalN = { muscle: 'Muskelaufbau', strength: 'Maximalkraft', skills: 'Calisthenics', fit: 'Fitness', health: 'Gesundheit' }[p.goal] || 'Training';
    const hx = heroEx(day, loc);
    const R = 20, C = 2 * Math.PI * R;
    const last = st.workouts[st.workouts.length - 1];
    const setsWeek = weekW.reduce((t, w) => t + w.exercises.reduce((u, e) => u + e.sets.length, 0), 0);
    const filt = st.homeFilter || 'all';
    const focusN = { full: 'Ganzkörper', upper: 'Oberkörper', lower: 'Unterkörper' };
    const foci = [...new Set(p.days.map(d => d.focus))];
    const rec = recovery();
    return `<div class="topbar"><div class="avatar">${esc((a.name || 'S').trim()[0] || 'S').toUpperCase()}</div><div class="grow"><h1 style="font-size:21px;text-transform:uppercase">Hi${a.name ? ' ' + esc(a.name) : ''}</h1><div class="small muted">⚡ ${goalN} · Woche ${wi.w} von ${wi.len}</div></div><button class="iconbtn" data-a="settings" aria-label="Einstellungen">${I.gear}</button></div>
    <div class="stack">
      <div class="card" style="padding:14px 10px"><div class="row between" style="padding:0 8px 8px"><b class="num" style="font-size:17px">${new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}</b><span class="small muted">${cnt} von ${goal} Trainings</span></div>
        <div class="cal">${DAYS.map((d, i) => { const dt = new Date(sow.getTime() + i * 864e5); return `<div><div class="d">${d}</div><div class="n ${i === todayIdx ? 'today' : ''} ${doneDays.has(i) ? 'done' : ''}">${dt.getDate()}</div></div>`; }).join('')}</div></div>
      ${st.active ? `<div class="card lime rings-bg stack"><div class="eyebrow">Training läuft · ${durTxt((Date.now() - st.active.start) / 1000)}</div><h2 class="xl">${esc(st.active.name)}</h2><div class="small" style="font-weight:800">${st.active.exercises.reduce((t, e) => t + e.sets.filter(s => s.done).length, 0)} Sätze erledigt</div><button class="btn dark big" data-a="resume">${I.play} Weiter trainieren</button></div>` : `
      <div class="card lime rings-bg" style="position:relative;min-height:230px;padding:20px">
        <div style="position:relative;z-index:2;max-width:60%" class="stack">
          <div class="eyebrow">${st.homeDay != null ? 'Ausgewählt' : 'Heute dran'}</div>
          <div><h2 class="xl">${esc(day.name)}</h2><div class="small" style="font-weight:800;margin-top:4px;opacity:.75">${esc(dayFocus(day, loc))} · ${estMinutes(day, loc)} min</div></div>
          ${locs().length > 1 ? `<div class="seg onlight" style="max-width:220px">${['home', 'gym'].map(l => `<button data-a="homeLoc" data-l="${l}" aria-pressed="${loc === l}">${LOCN[l]}</button>`).join('')}</div>` : ''}
          <button class="btn dark" data-a="startWorkout" data-d="${di}" data-l="${loc}" style="align-self:flex-start;padding-right:10px">${slots.length} Übungen starten <span style="display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:var(--lime);color:var(--on-light)">${I.arrow}</span></button>
        </div>
        <svg class="ringnum" width="54" height="54" viewBox="0 0 54 54" style="position:absolute;top:14px;right:14px;z-index:3" aria-label="Woche ${pct} Prozent"><circle cx="27" cy="27" r="${R}" fill="none" stroke="rgba(20,20,22,.15)" stroke-width="5"/><circle cx="27" cy="27" r="${R}" fill="none" stroke="#141416" stroke-width="5" stroke-linecap="round" stroke-dasharray="${(C * pct / 100).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 27 27)"/><text x="27" y="31" text-anchor="middle" style="font:800 12px var(--display);fill:#141416">${pct}%</text></svg>
        <div class="figdark" style="position:absolute;right:-8px;bottom:-10px;width:50%;z-index:1">${figSVG(hx, { anim: 2.8 })}</div>
      </div>`}
      <div class="section" style="margin-top:6px"><div class="head"><h2>Dein Plan</h2><button class="btn ghost sm" data-a="tab" data-k="plan">Bearbeiten</button></div>
        <div class="chips">${[['all', 'Alle Einheiten'], ...foci.map(f => [f, focusN[f]])].map(([k, n]) => `<button class="chip ${filt === k ? 'on' : ''}" data-a="homeFilter" data-k="${k}">${n}</button>`).join('')}</div>
        ${p.days.map((d, i) => ({ d, i })).filter(x => filt === 'all' || x.d.focus === filt).map(({ d, i }) => { const ex = heroEx(d, loc); const n = d.slots.filter(s => s.ex[loc]).length; return `<button class="daycard ${i % 2 ? 'card lilac' : 'card lav'}" data-a="dayOpen" data-i="${i}"><div class="txt"><h3 style="font-size:20px">${esc(d.name)}</h3><div class="row wrap" style="gap:6px"><span class="tag">${n} Übungen</span>${i === nextDayIdx() ? '<span class="tag" style="background:#141416;color:#fff">Als Nächstes</span>' : ''}</div><div class="small" style="font-weight:800;margin-top:auto">${esc(dayFocus(d, loc))}</div></div><div class="minbadge">${estMinutes(d, loc)}<small>min</small></div><div class="figwrap figdark">${figSVG(ex)}</div></button>`; }).join('')}
      </div>
      <div class="duo">
        <div class="card lilac stack" style="gap:6px"><div class="row between"><b>Sätze</b><span class="tag">Woche</span></div><div class="num" style="font-size:32px;font-weight:800">${setsWeek}</div><div class="small" style="font-weight:700;opacity:.7">abgeschlossene Sätze</div></div>
        <div class="card lav stack" style="gap:6px"><b>Wochenziel</b><div class="small" style="font-weight:700;opacity:.75">${cnt >= goal ? 'Geschafft! Stark.' : 'Noch ' + (goal - cnt) + ' Training' + (goal - cnt > 1 ? 's' : '') + ' bis zum Ziel.'}</div><span class="pillpct" style="--p:${pct}%;align-self:flex-end;margin-top:auto"><i></i>${pct}%</span></div>
      </div>
      <div class="card stack"><div class="row between"><h3>Erholung</h3><span class="small muted">Muskelgruppen</span></div>
        <div class="bars">${rec.map(r => `<div class="bar"><span>${r.g}</span><div class="track"><i class="${r.pct >= 90 ? 'lime' : r.pct < 50 ? 'warn' : ''}" style="width:${r.pct}%"></i></div><span class="num small" style="text-align:right">${r.pct}%</span></div>`).join('')}</div>
        <div class="tiny muted">Geschätzt aus Sätzen und Zeit seit dem letzten Training. Grün = bereit.</div></div>
      <div class="row"><button class="btn grow" data-a="freeWorkout">${I.plus} Freies Training</button><button class="btn grow" data-a="tab" data-k="timer">${I.timer} Timer</button></div>
      ${last ? `<div class="section"><div class="head"><h3>Letztes Training</h3><button class="btn ghost sm" data-a="progGo" data-k="history">Alle</button></div>${workoutRow(last)}</div>` : ''}
      ${bwNudge()}
    </div>`;
  }
  function bwNudge() {
    const log = P().bwLog || []; const lastD = log.length ? log[log.length - 1].d : null;
    if (lastD && (Date.now() - new Date(lastD).getTime()) < 14 * 864e5) return '';
    return `<div class="card row"><div class="grow"><b>Körpergewicht aktuell?</b><div class="small muted">Klimmzüge, Dips & Co. werden damit berechnet. Aktuell: ${fmt(E.bodyweight(P()), 1)} kg</div></div><button class="btn sm" data-a="bwSheet">Eintragen</button></div>`;
  }
  function workoutRow(w) {
    const sets = w.exercises.reduce((t, e) => t + e.sets.length, 0);
    return `<button class="li card" data-a="wDetail" data-id="${w.id}">${thumb(getEx((w.exercises[0] || {}).exId))}<div class="grow"><div style="font-weight:800">${esc(w.name)}</div><div class="small muted">${dateDE(w.date)} · ${LOCN[w.loc] || ''} · ${durTxt(w.dur || 0)} · ${sets} Sätze${w.prs && w.prs.length ? ` · <span class="pr">${w.prs.length} Rekord${w.prs.length > 1 ? 'e' : ''}</span>` : ''}</div></div><span class="chev">${I.chev}</span></button>`;
  }

  /* ================= Plan ================= */
  function planView() {
    const p = plan(); const loc = st.planLoc || defLoc(); const wi = E.weekInfo(p, P());
    const goalN = { muscle: 'Muskelaufbau', strength: 'Maximalkraft', skills: 'Calisthenics-Skills', fit: 'Fitness & Fettabbau', health: 'Gesund & beweglich' }[p.goal] || '';
    return `<div class="topbar"><h1>Plan</h1><button class="iconbtn" data-a="settings" aria-label="Einstellungen">${I.gear}</button></div>
    <div class="stack">
      <div class="card lime rings-bg stack">
        <div class="row wrap" style="gap:6px"><span class="tag">${esc(p.splitName)}</span><span class="tag">${p.days.length}× pro Woche</span><span class="tag">${goalN}</span></div>
        <div class="row between"><div><div class="eyebrow">Zyklus</div><h2>Woche ${wi.w} von ${wi.len} · ${wi.label}</h2></div>
        <button class="btn dark sm" data-a="deloadToggle">${p.forceDeload ? 'Deload beenden' : 'Deload jetzt'}</button></div>
        <div class="meter"><i style="width:${wi.w / wi.len * 100}%"></i></div>
        <div class="small" style="font-weight:700;opacity:.7">Woche 1 locker, Woche 2–3 Aufbau, Woche 4 am härtesten, Woche 5 Deload mit halben Sätzen.</div>
      </div>
      ${locs().length > 1 ? `<div class="seg">${['home', 'gym'].map(l => `<button data-a="planLoc" data-l="${l}" aria-pressed="${loc === l}">${LOCN[l]}</button>`).join('')}</div>` : ''}
      ${p.days.map((d, di) => `<div class="section"><div class="head"><h2>${esc(d.name)}</h2><span class="small muted">${d.slots.filter(s => s.ex[loc]).length} Übungen · ≈ ${estMinutes(d, loc)} min</span></div>
        <div class="list">${d.slots.map((sl, si) => { const ex = getEx(sl.ex[loc]); if (!ex) return `<div class="li"><div class="thumb"></div><div class="grow muted small">Keine passende Übung ${loc === 'home' ? 'zu Hause' : 'im Studio'}</div></div>`; const pr = E.prescription(sl, ex, P(), p);
          return `<button class="li" data-a="slotSheet" data-d="${di}" data-s="${si}">${thumb(ex)}<div class="grow"><div class="row" style="gap:6px"><span class="plate p-${sl.r}" style="width:20px;height:20px;font-size:10px">${ROLE[sl.r][0]}</span><b>${esc(ex.name)}</b></div><div class="small muted">${pr.sets} × ${rrText(pr.rr, ex)}${ex.uni ? ' pro Seite' : ''} · Pause ${sl.rest} s</div>${(sl.why && sl.why[loc] && sl.why[loc].length) ? `<div class="why" style="margin-top:4px">${sl.why[loc].slice(0, 2).map(w => `<span>${esc(w)}</span>`).join('')}</div>` : ''}</div><span class="chev">${I.chev}</span></button>`; }).join('')}
        <button class="li" data-a="pickEx" data-mode="plan" data-d="${di}" style="color:var(--lime);font-weight:800"><div class="thumb" style="display:grid;place-items:center">${I.plus.replace('<svg', '<svg width="22" height="22"')}</div> Übung hinzufügen</button></div></div>`).join('')}
      <div class="card flat small"><div class="row wrap" style="gap:12px">${Object.keys(ROLE).map(r => `<span class="row" style="gap:6px">${plateHTML(r)} ${ROLE[r][1]}</span>`).join('')}</div><p class="muted tiny" style="margin:10px 0 0">Jede Einheit hat 5–7 Übungen: Grundübungen zuerst, dann Ergänzung, Isolation und Rumpf.</p></div>
      <div class="row wrap"><button class="btn grow" data-a="rebuildAsk">Plan neu berechnen</button><button class="btn grow" data-a="quizEdit">Fragebogen bearbeiten</button></div>
    </div>`;
  }

  /* ================= Übungen ================= */
  const LVL = [[1, 'Einsteiger'], [2, 'Leicht'], [3, 'Mittel'], [4, 'Fortgeschritten'], [5, 'Profi']];
  function libList() {
    const eqs = new Set([...E.locEquip(P(), 'home'), ...(locs().includes('gym') ? E.locEquip(P(), 'gym') : [])]);
    const q = st.libQ.trim().toLowerCase(); const F = st.libF || {};
    const trained = new Set(st.workouts.flatMap(w => w.exercises.map(e => e.exId)));
    return E.allExercises(P()).filter(ex => (!q || ex.name.toLowerCase().includes(q) || (D.PATTERNS[ex.pat] || '').toLowerCase().includes(q) || ex.prim.some(m => D.MUSCLES[m].toLowerCase().includes(q)))
      && (!F.group || D.GROUPS[F.group].some(m => ex.prim.includes(m))) && (!F.lvl || ex.lvl === F.lvl) && (!F.pat || ex.pat === F.pat) && (!F.eq || ex.eq.includes(F.eq))
      && (!st.libAvail || E.available(ex, eqs)) && (st.libTab !== 'mine' || trained.has(ex.id)))
      .sort((a, b) => a.pat.localeCompare(b.pat) || (a.rank || a.lvl) - (b.rank || b.lvl));
  }
  function libView() {
    const list = libList(); const F = st.libF || {};
    const chip = (k, label, val) => `<button class="chip ${val ? 'set' : ''}" data-a="libFilter" data-k="${k}">${val ? esc(val) : label} ▾</button>`;
    return `<div class="topbar"><h1>Übungen</h1><button class="iconbtn" data-a="customEx" aria-label="Eigene Übung">${I.plus}</button></div>
    <div class="stack">
      <div class="toptabs"><button data-a="libTab" data-k="all" aria-pressed="${st.libTab !== 'mine'}">Alle Übungen</button><button data-a="libTab" data-k="mine" aria-pressed="${st.libTab === 'mine'}">Trainiert</button></div>
      <label class="search">${I.search}<input id="libq" data-in="libQ" type="search" placeholder="Übungen suchen …" value="${esc(st.libQ)}" aria-label="Übungen suchen"></label>
      <div class="chips">${chip('lvl', 'Schwierigkeit', F.lvl && LVL[F.lvl - 1][1])}${chip('group', 'Muskelgruppe', F.group)}${chip('pat', 'Kategorie', F.pat && D.PATTERNS[F.pat])}${chip('eq', 'Ausrüstung', F.eq && D.EQUIP[F.eq])}<button class="chip ${st.libAvail ? 'on' : ''}" data-a="libAvailT">Meine Geräte</button></div>
      <div class="row between"><span class="small muted">${list.length} Übungen</span>${(F.lvl || F.group || F.pat || F.eq) ? '<button class="btn ghost sm" data-a="libReset">Filter zurücksetzen</button>' : ''}</div>
      ${list.length ? `<div class="exgrid">${list.map(ex => `<button class="extile" data-a="exInfo" data-id="${ex.id}"><div class="tile">${figSVG(ex)}</div><span>${esc(ex.name)}</span></button>`).join('')}</div>` : `<div class="empty">${st.libTab === 'mine' ? 'Noch keine Übung trainiert.' : 'Keine Übung gefunden.'}</div>`}
    </div>`;
  }

  /* ================= Fortschritt ================= */
  function progView() {
    const seg = st.progSeg;
    const tabs = [['overview', 'Übersicht'], ['history', 'Verlauf'], ['records', 'Rekorde'], ['badges', 'Erfolge'], ['body', 'Körper']];
    const body = { overview: progOverview, history: progHistory, records: progRecords, badges: progBadges, body: progBody }[seg]();
    return `<div class="topbar"><h1>Fortschritt</h1><button class="iconbtn" data-a="settings" aria-label="Einstellungen">${I.gear}</button></div>
      <div class="stack"><div class="chips">${tabs.map(([k, n]) => `<button class="chip ${seg === k ? 'on' : ''}" data-a="progSeg" data-k="${k}">${n}</button>`).join('')}</div>${body}</div>`;
  }
  function badgeList() {
    const W = st.workouts; const n = W.length;
    const sets = W.reduce((t, w) => t + w.exercises.reduce((u, e) => u + e.sets.length, 0), 0);
    const prs = W.reduce((t, w) => t + ((w.prs || []).length), 0);
    const vol = W.reduce((t, w) => t + (w.vol || 0), 0);
    const early = W.some(w => new Date((w.ts || 0) - (w.dur || 0) * 1000).getHours() < 8);
    const skill = W.some(w => w.exercises.some(e => { const x = getEx(e.exId); return x && x.role === 's'; }));
    const both = new Set(W.map(w => w.loc)).size > 1;
    const streak = weeksStreak();
    return [
      ['1', 'Erster Schritt', 'Erstes Training gespeichert', n >= 1], ['10', 'Dranbleiber', '10 Trainings', n >= 10], ['25', 'Routine', '25 Trainings', n >= 25], ['50', 'Eisern', '50 Trainings', n >= 50], ['100', 'Legende', '100 Trainings', n >= 100],
      ['4W', 'Serie', '4 Wochen am Stück', streak >= 4], ['12W', 'Unaufhaltsam', '12 Wochen am Stück', streak >= 12],
      ['PR', 'Rekordjäger', 'Erster persönlicher Rekord', prs >= 1], ['10', 'Rekordserie', '10 Rekorde', prs >= 10],
      ['500', 'Satzwerk', '500 Sätze', sets >= 500], ['10t', 'Schwerlast', '10 Tonnen bewegt', vol >= 10000],
      ['6h', 'Frühaufsteher', 'Training vor 8 Uhr', early], ['S', 'Artist', 'Einen Skill trainiert', skill], ['2×', 'Flexibel', 'Zuhause und im Studio', both]
    ];
  }
  function progBadges() {
    const b = badgeList(); const got = b.filter(x => x[3]).length;
    return `<div class="card lav stack" style="gap:6px"><b>${got} von ${b.length} Erfolgen</b><div class="meter" style="background:rgba(20,20,22,.12)"><i style="width:${got / b.length * 100}%;background:#141416"></i></div></div>
      <div class="badges">${b.map(([ic, t, d, ok]) => `<div class="badge ${ok ? 'got' : ''}"><div class="ic">${ic}</div><b>${t}</b><span>${d}</span></div>`).join('')}</div>`;
  }
  function weeksStreak() {
    const target = Math.max(1, Math.min(+((P().answers || {}).days) || 3, 7) - 1);
    let n = 0; let ws = E.startOfWeek();
    const count = s => st.workouts.filter(w => w.date >= E.todayISO(s) && w.date < E.todayISO(new Date(s.getTime() + 7 * 864e5))).length;
    if (count(ws) >= target) n++;
    for (let i = 0; i < 104; i++) { ws = new Date(ws.getTime() - 7 * 864e5); if (count(ws) >= target) n++; else break; }
    return n;
  }
  function groupSets(sinceIso) {
    const out = {}; for (const g in D.GROUPS) out[g] = 0;
    for (const w of st.workouts) {
      if (w.date < sinceIso) continue;
      for (const e of w.exercises) {
        const ex = getEx(e.exId); if (!ex) continue; const n = e.sets.filter(s => s.done !== false).length;
        for (const g in D.GROUPS) { const ms = D.GROUPS[g]; if (ex.prim.some(m => ms.includes(m))) out[g] += n; else if ((ex.sec || []).some(m => ms.includes(m))) out[g] += n * 0.5; }
      }
    }
    return out;
  }
  function progOverview() {
    const total = st.workouts.length;
    const since7 = E.todayISO(new Date(Date.now() - 6 * 864e5));
    const w7 = st.workouts.filter(w => w.date >= since7);
    const gs = groupSets(since7);
    const pri = (P().answers || {}).priority || [];
    const maxV = Math.max(24, ...Object.values(gs));
    const vol = w7.reduce((t, w) => t + (w.vol || 0), 0);
    // Heatmap 12 Wochen
    const start = new Date(E.startOfWeek().getTime() - 11 * 7 * 864e5);
    const byDay = {}; for (const w of st.workouts) byDay[w.date] = (byDay[w.date] || 0) + 1;
    let heat = ''; for (let i = 0; i < 84; i++) { const d = new Date(start.getTime() + i * 864e5); const iso = E.todayISO(d); const c = byDay[iso] || 0; heat += `<span class="${c > 1 ? 'l2' : c ? 'l2' : ''}" title="${dateDE(iso)}${c ? ': ' + c + ' Training' : ''}"></span>`; }
    const exWithHist = [...new Set(st.workouts.flatMap(w => w.exercises.map(e => e.exId)))].filter(id => getEx(id));
    if (!st.chartEx || !exWithHist.includes(st.chartEx)) st.chartEx = mostFrequent(exWithHist);
    if (!total) return `<div class="empty">Noch keine Trainings gespeichert. Nach deinem ersten Training siehst du hier Kraftkurven, Rekorde und Sätze pro Muskelgruppe.</div>`;
    return `<div class="kpis"><div class="kpi"><b>${total}</b><span>Trainings gesamt</span></div><div class="kpi"><b>${w7.length}</b><span>Letzte 7 Tage</span></div><div class="kpi"><b>${weeksStreak()}</b><span>Wochen am Stück</span></div></div>
      <div class="section"><div class="head"><h3>Kraftentwicklung</h3></div>
        <select class="field" data-in="chartEx" id="chartEx">${exWithHist.map(id => `<option value="${id}" ${id === st.chartEx ? 'selected' : ''}>${esc(getEx(id).name)}</option>`).join('')}</select>
        <div class="card">${exChart(st.chartEx)}</div></div>
      <div class="section"><div class="head"><h3>Sätze pro Muskelgruppe</h3><span class="small muted">letzte 7 Tage</span></div>
        <div class="card"><div class="bars">${Object.keys(gs).map(g => { const v = gs[g]; const lo = pri.includes(g) ? 14 : 10, hi = pri.includes(g) ? 22 : 20; return `<div class="bar"><span>${g}${pri.includes(g) ? ' ★' : ''}</span><div class="track"><span class="band" style="left:${lo / maxV * 100}%;width:${(hi - lo) / maxV * 100}%"></span><i style="width:${Math.min(100, v / maxV * 100)}%"></i></div><span class="num" style="text-align:right;font-size:17px">${fmt(v, 1)}</span></div>`; }).join('')}</div>
        <p class="tiny muted" style="margin:12px 0 0">Markierter Bereich = sinnvolle Wochensätze für Muskelaufbau (10–20, bei Priorität 14–22). Nebenmuskeln zählen halb. ${vol ? 'Bewegte Last: ' + fmt(Math.round(vol)) + ' kg.' : ''}</p></div></div>
      <div class="section"><div class="head"><h3>Trainingstage</h3><span class="small muted">12 Wochen</span></div><div class="card"><div class="heat" style="margin-bottom:6px">${DAYS.map(d => `<div class="tiny muted" style="text-align:center">${d}</div>`).join('')}</div><div class="heat">${heat}</div></div></div>`;
  }
  function mostFrequent(ids) { const c = {}; for (const w of st.workouts) for (const e of w.exercises) c[e.exId] = (c[e.exId] || 0) + 1; return ids.sort((a, b) => (c[b] || 0) - (c[a] || 0))[0]; }
  function exSeries(exId) {
    const ex = getEx(exId); if (!ex) return [];
    return E.historyFor(exId, st.workouts).map(h => ({ x: h.date, y: E.sessionBest(ex, h.entry, h.bw || E.bodyweight(P())) })).filter(p => p.y > 0);
  }
  function exUnit(ex) { return ex.kind === 'hold' ? 's' : (ex.kind === 'bw' && !(ex.bwf > 0)) ? 'Wdh.' : 'kg'; }
  function exChart(exId) {
    const ex = getEx(exId); if (!ex) return '<div class="muted small">Keine Daten.</div>';
    const pts = exSeries(exId);
    if (pts.length < 2) return `<div class="small muted">${pts.length ? 'Ein Training erfasst (' + fmt(pts[0].y, 1) + ' ' + exUnit(ex) + '). Ab zwei Trainings erscheint hier die Kurve.' : 'Noch keine Daten.'}</div>`;
    const label = ex.kind === 'hold' ? 'Beste Haltezeit inkl. Reserve (s)' : ex.kind === 'bw' && !(ex.bwf > 0) ? 'Wdh. inkl. Reserve' : 'Geschätztes 1RM (kg)' + (ex.kind === 'bw' ? ', inkl. Körpergewichtsanteil' : '');
    return `<div class="small muted" style="margin-bottom:6px">${label}</div>` + lineChart(pts, exUnit(ex));
  }
  function lineChart(pts, unit) {
    const W = 340, H = 170, pl = 38, pr = 12, pt = 12, pb = 26;
    const ys = pts.map(p => p.y); let min = Math.min(...ys), max = Math.max(...ys);
    const pad = Math.max((max - min) * 0.15, max * 0.03, 1); min = Math.max(0, min - pad); max = max + pad;
    const step = niceStep((max - min) / 3); min = Math.floor(min / step) * step; max = Math.ceil(max / step) * step;
    const t0 = new Date(pts[0].x).getTime(), t1 = new Date(pts[pts.length - 1].x).getTime() || t0 + 1;
    const X = x => pl + ((new Date(x).getTime() - t0) / Math.max(1, t1 - t0)) * (W - pl - pr);
    const Y = y => pt + (1 - (y - min) / (max - min || 1)) * (H - pt - pb);
    let grid = ''; for (let v = min; v <= max + 1e-9; v += step) grid += `<line class="grid" x1="${pl}" x2="${W - pr}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${pl - 6}" y="${Y(v) + 4}" text-anchor="end">${fmt(v, step < 1 ? 1 : 0)}</text>`;
    const d = pts.map((p, i) => (i ? 'L' : 'M') + X(p.x).toFixed(1) + ' ' + Y(p.y).toFixed(1)).join(' ');
    const area = d + ` L${X(pts[pts.length - 1].x).toFixed(1)} ${H - pb} L${X(pts[0].x).toFixed(1)} ${H - pb} Z`;
    const lp = pts[pts.length - 1];
    const xl = `<text x="${pl}" y="${H - 6}">${dateDE(pts[0].x, { day: 'numeric', month: 'short' })}</text><text x="${W - pr}" y="${H - 6}" text-anchor="end">${dateDE(lp.x, { day: 'numeric', month: 'short' })}</text>`;
    const hits = pts.map((p, i) => `<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="14" fill="transparent" data-a="chartTip" data-t="${esc(dateDE(p.x) + ': ' + fmt(p.y, 1) + ' ' + unit)}"/>`).join('');
    const chg = pts.length > 1 ? (lp.y / pts[0].y - 1) : 0;
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Verlauf">${grid}<path class="ar" d="${area}"/><path class="ln" d="${d}"/>${pts.map((p, i) => `<circle class="pt" cx="${X(p.x)}" cy="${Y(p.y)}" r="${i === pts.length - 1 ? 5.5 : 3.5}"/>`).join('')}${xl}${hits}</svg>
      <div class="row between" style="margin-top:6px"><span class="tip" id="chartTip">Punkt antippen für Details</span><span class="small ${chg >= 0 ? '' : 'muted'}"><b class="num" style="font-size:18px">${fmt(lp.y, 1)} ${unit}</b> · ${chg >= 0 ? '+' : '−'}${fmt(Math.abs(chg * 100), 0)} % seit Start</span></div>`;
  }
  function niceStep(r) { const p = Math.pow(10, Math.floor(Math.log10(r || 1))); const n = r / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p; }
  function progHistory() {
    if (!st.workouts.length) return '<div class="empty">Noch keine Trainings.</div>';
    const ws = [...st.workouts].reverse(); let out = '', lastM = '';
    for (const w of ws) { const m = dateDE(w.date, { month: 'long', year: 'numeric' }); if (m !== lastM) { out += `<div class="eyebrow" style="margin-top:8px">${m}</div>`; lastM = m; } out += workoutRow(w); }
    return out;
  }
  function records() {
    const rec = {};
    for (const w of st.workouts) for (const e of w.exercises) {
      const ex = getEx(e.exId); if (!ex) continue;
      for (const s of e.sets) {
        const sc = E.setScore(ex, Object.assign({ done: true }, s), w.bw || E.bodyweight(P())); if (!sc) continue;
        const r = rec[e.exId] = rec[e.exId] || { ex, best: 0, set: null, date: null, maxReps: 0 };
        if (sc > r.best) { r.best = sc; r.set = s; r.date = w.date; }
        if ((s.reps || 0) > r.maxReps) r.maxReps = s.reps;
      }
    }
    return Object.values(rec).sort((a, b) => a.ex.name.localeCompare(b.ex.name));
  }
  function setTxt(ex, s) {
    if (!s) return '';
    if (ex.kind === 'hold' || ex.kind === 'int') return fmt(s.sec) + ' s';
    if (ex.kind === 'bw') return (s.w ? '+' + fmt(s.w) + ' kg × ' : '') + fmt(s.reps) + ' Wdh.';
    return fmt(s.w) + ' kg × ' + fmt(s.reps);
  }
  function progRecords() {
    const r = records(); if (!r.length) return '<div class="empty">Noch keine Rekorde.</div>';
    return `<div class="card tbl"><table><thead><tr><th>Übung</th><th>Bester Satz</th><th class="r">Leistung</th></tr></thead><tbody>${r.map(x => `<tr data-a="exInfo" data-id="${x.ex.id}" style="cursor:pointer"><td style="white-space:normal">${esc(x.ex.name)}<div class="tiny muted">${dateDE(x.date)}</div></td><td>${setTxt(x.ex, x.set)}</td><td class="r num" style="font-size:17px">${fmt(x.best, 1)} ${exUnit(x.ex)}</td></tr>`).join('')}</tbody></table></div>
      <p class="tiny muted">Leistung = geschätztes Maximum aus Gewicht, Wiederholungen und angegebener Reserve (Epley-Formel). So sind Sätze mit unterschiedlichen Wiederholungszahlen vergleichbar.</p>`;
  }
  function progBody() {
    const log = P().bwLog || [];
    const pts = log.map(x => ({ x: x.d, y: x.kg }));
    return `<div class="card stack"><div class="row between"><div><div class="eyebrow">Körpergewicht</div><div class="num" style="font-size:36px;font-weight:700">${fmt(E.bodyweight(P()), 1)} kg</div></div><button class="btn primary" data-a="bwSheet">Eintragen</button></div>
      ${pts.length >= 2 ? lineChart(pts, 'kg') : '<div class="small muted">Trage dein Gewicht regelmäßig ein, dann erscheint hier der Verlauf. Die App nutzt immer den neuesten Wert für Körpergewichtsübungen.</div>'}</div>
      ${log.length ? `<div class="list">${[...log].reverse().slice(0, 30).map((x, i) => `<div class="li"><div class="grow">${dateDE(x.d)}</div><b class="num" style="font-size:18px">${fmt(x.kg, 1)} kg</b><button class="btn ghost sm" data-a="bwDel" data-i="${log.length - 1 - i}" aria-label="Löschen">${I.x.replace('<svg', '<svg width="16" height="16"')}</button></div>`).join('')}</div>` : ''}`;
  }

  /* ================= Timer ================= */
  const T = st.timer;
  function timerView() {
    const m = T.mode;
    return `<div class="topbar"><h1>Timer</h1></div><div class="stack">
      <div class="seg">${[['rest', 'Pause'], ['interval', 'Intervall'], ['stopwatch', 'Stoppuhr']].map(([k, n]) => `<button data-a="timerMode" data-k="${k}" aria-pressed="${m === k}">${n}</button>`).join('')}</div>
      <div class="hero stack" id="timerBox">${timerBox()}</div></div>`;
  }
  function timerBox() {
    const m = T.mode, now = Date.now();
    if (m === 'rest') {
      const left = T.restEnd ? Math.max(0, (T.restEnd - now) / 1000) : (T.restDur || 90);
      return `<div class="bigtimer">${mmss(left)}</div>
        <div class="chips" style="justify-content:center;flex-wrap:wrap">${[45, 60, 90, 120, 180, 240].map(s => `<button class="chip ${(T.restDur || 90) === s ? 'on' : ''}" data-a="restPreset" data-s="${s}">${mmss(s)}</button>`).join('')}</div>
        <button class="btn primary big" data-a="restToggle">${T.restEnd ? 'Stopp' : 'Start'}</button>`;
    }
    if (m === 'interval') {
      const cfg = T.iv || (T.iv = { work: 40, rest: 20, rounds: 8 });
      if (T.ivRun) {
        const r = T.ivRun; const el = (now - r.start) / 1000;
        if (el < 0) return `<div class="phase muted">Bereit machen</div><div class="bigtimer">${Math.ceil(-el)}</div><button class="btn big" data-a="ivStop">Abbrechen</button>`;
        const cyc = Math.max(1, +cfg.work + +cfg.rest); const round = Math.floor(el / cyc) + 1; const inC = el % cyc; const work = inC < cfg.work;
        const left = work ? cfg.work - inC : cyc - inC; const done = round > cfg.rounds;
        return `<div class="phase" style="color:${done ? 'var(--good)' : work ? 'var(--accent)' : 'var(--muted)'}">${done ? 'Fertig' : work ? 'Belastung' : 'Pause'}</div>
          <div class="bigtimer">${done ? '0:00' : mmss(left)}</div><div style="text-align:center" class="muted">Runde ${Math.min(round, cfg.rounds)} / ${cfg.rounds}</div>
          <button class="btn big" data-a="ivStop">Beenden</button>`;
      }
      const f = (k, l) => `<div class="grow"><label class="lbl" for="iv-${k}">${l}</label><input class="field num" id="iv-${k}" inputmode="numeric" data-in="iv" data-k="${k}" value="${cfg[k]}"></div>`;
      return `<div class="row">${f('work', 'Belastung (s)')}${f('rest', 'Pause (s)')}${f('rounds', 'Runden')}</div>
        <div class="chips" style="flex-wrap:wrap">${[['Tabata', 20, 10, 8], ['40/20', 40, 20, 10], ['EMOM 10', 60, 0, 10], ['30/30', 30, 30, 12]].map(p => `<button class="chip" data-a="ivPreset" data-v="${p.slice(1).join(',')}">${p[0]}</button>`).join('')}</div>
        <div class="muted small">Gesamt: ${mmss(cfg.rounds * (+cfg.work + +cfg.rest))}</div>
        <button class="btn primary big" data-a="ivStart">Start</button>`;
    }
    const sw = T.sw || (T.sw = { start: null, acc: 0, laps: [] });
    const el = sw.acc + (sw.start ? (now - sw.start) : 0);
    const f = ms => { const s = ms / 1000; return mmss(s) + ',' + Math.floor((ms % 1000) / 100); };
    return `<div class="bigtimer">${f(el)}</div><div class="row"><button class="btn primary big grow" data-a="swToggle">${sw.start ? 'Stopp' : 'Start'}</button><button class="btn big grow" data-a="${sw.start ? 'swLap' : 'swReset'}">${sw.start ? 'Runde' : 'Reset'}</button></div>
      ${sw.laps.length ? `<div class="list">${sw.laps.map((l, i) => `<div class="li"><span class="grow">Runde ${sw.laps.length - i}</span><span class="num">${f(l)}</span></div>`).join('')}</div>` : ''}`;
  }
  let lastBeep = {};
  function timerTick() {
    const now = Date.now();
    if (T.restEnd && now >= T.restEnd) { T.restEnd = null; beep(990, 0.4); buzz([200, 100, 200]); toast('Pause vorbei'); }
    if (T.ivRun && T.iv) {
      const cfg = T.iv, r = T.ivRun; const el = (now - r.start) / 1000; const cyc = Math.max(1, +cfg.work + +cfg.rest);
      if (el < 0) { const k = 'c' + Math.ceil(-el); if (lastBeep.k !== k) { lastBeep.k = k; beep(600, 0.1); } } else {
      const round = Math.floor(el / cyc) + 1; const inC = el % cyc; const work = inC < cfg.work; const left = work ? cfg.work - inC : cyc - inC;
      const key = round + (work ? 'w' : 'r') + Math.ceil(left);
      if (round > cfg.rounds) { if (!r.done) { r.done = true; beep(660, 0.25); beep(880, 0.25, 0.3); beep(1100, 0.5, 0.6); buzz([300, 100, 300]); } }
      else if (Math.ceil(left) <= 3 && lastBeep.k !== key) { lastBeep.k = key; beep(Math.ceil(left) === 1 ? 1200 : 700, 0.12); }
      else if (Math.ceil(left) === Math.ceil(work ? cfg.work : cfg.rest) && lastBeep.p !== round + (work ? 'w' : 'r')) { lastBeep.p = round + (work ? 'w' : 'r'); buzz(work ? 250 : 120); }
      }
    }
    if (st.tab === 'timer' && !st.ov) { const b = $('#timerBox'); if (b) b.innerHTML = timerBox(); }
    tickRest(now); tickHold(now);
  }

  /* ================= Pausentimer im Training ================= */
  function startRest(sec, label) { if (!settings().autoRest) return; st.rest = { end: Date.now() + sec * 1000, total: sec, label: label || '' }; renderRest(); }
  function renderRest() {
    const el = layerEl('rb');
    if (!st.ov || st.ov.type !== 'workout' || !st.active) { el.innerHTML = st.hold ? holdPanel() : ''; return; }
    if (st.hold) { el.innerHTML = holdPanel(); return; }
    const a = st.active; const ci = curIndex(); const S = ci >= 0 ? exState(a.exercises[ci]) : null;
    const left = st.rest ? (st.rest.end - Date.now()) / 1000 : 0;
    const resting = st.rest && left > -4;
    el.innerHTML = `<div class="panel"><div class="cols"><div><small>Dauer</small><div class="v" id="pElapsed">${mmss((Date.now() - a.start) / 1000)}</div></div>
      <div><small style="text-align:center" id="restLbl">${resting ? (left > 0 ? 'Pause' : 'Los geht’s') : S ? 'Nächster Satz' : 'Fertig'}</small><div class="big" id="restT">${resting ? mmss(Math.max(0, left)) : S ? (S.ex.kind === 'hold' || S.ex.kind === 'int' ? fmt(S.rec.sec) + 's' : fmt(S.rec.reps) + '×') : '✓'}</div></div>
      <div style="text-align:right"><small>Satz</small><div class="v">${S ? Math.min(S.done.length + 1, S.planned) + '/' + S.planned : '–'}</div></div></div>
      ${resting ? `<div class="prog"><i id="restProg" style="width:${Math.max(0, Math.min(100, (1 - left / st.rest.total) * 100))}%"></i></div>` : ''}
      <div class="ctrl">${resting ? `<button data-a="restAdj" data-s="-15">−15 s</button><button data-a="restAdj" data-s="15">+15 s</button><button class="go" data-a="restSkip">Weiter</button>` : S ? `<button data-a="manualRest">${I.timer.replace('<svg', '<svg width="16" height="16" style="vertical-align:-3px"')} Pause</button><button class="go" data-a="doneCur">Satz fertig ✓</button>` : `<button class="go" data-a="finishAsk">Training beenden</button>`}</div></div>`;
  }
  function holdPanel() { return `<div class="panel"><div class="cols"><div><small>Halten</small><div class="v" style="font-size:14px">${esc(st.hold.name)}</div></div><div><small style="text-align:center">Sekunden</small><div class="big" id="holdT">${mmss((Date.now() - st.hold.start) / 1000)}</div></div><div></div></div><div class="ctrl"><button class="go" data-a="holdStop">Stopp</button></div></div>`; }
  function tickRest(now) {
    const pe = $('#pElapsed'); if (pe && st.active) pe.textContent = mmss((now - st.active.start) / 1000);
    if (!st.rest) return;
    const left = (st.rest.end - now) / 1000;
    const t = $('#restT'), p = $('#restProg');
    if (t && left > -4) t.textContent = mmss(Math.max(0, left));
    if (p) p.style.width = Math.max(0, Math.min(100, (1 - left / st.rest.total) * 100)) + '%';
    if (left <= 3 && left > 0 && st.rest.beeped !== Math.ceil(left)) { st.rest.beeped = Math.ceil(left); beep(700, 0.1); }
    if (left <= 0 && !st.rest.fired) { st.rest.fired = true; beep(1100, 0.45); buzz([250, 120, 250]); const l = $('#restLbl'); if (l) l.textContent = 'Los geht’s'; setTimeout(() => { if (st.rest && st.rest.fired) { st.rest = null; renderRest(); } }, 4000); }
  }
  function tickHold(now) { if (st.hold) { const t = $('#holdT'); if (t) t.textContent = mmss((now - st.hold.start) / 1000); } }

  /* ================= Training ================= */
  function newEntry(exId, slot) {
    const ex = getEx(exId);
    const presc = E.prescription(slot || null, ex, P(), plan());
    return { key: uid(), exId, slotId: slot ? slot.id : null, presc, sets: [], extra: 0 };
  }
  function startWorkout(di, loc) {
    const p = plan(); const day = p.days[di];
    st.active = { id: uid(), dayIdx: di, dayId: day.id, name: day.name, loc, start: Date.now(), bw: E.bodyweight(P()), exercises: day.slots.filter(s => s.ex[loc]).map(s => newEntry(s.ex[loc], s)), cur: 0 };
    st.homeDay = null;
    Store.saveActive(true); openWorkout();
  }
  function openWorkout() { st.ov = { type: 'workout' }; keepAwake(true); render(); }
  function exState(entry) {
    const ex = getEx(entry.exId); const presc = entry.presc;
    const done = entry.sets.filter(s => s.done);
    const hist = E.historyFor(entry.exId, st.workouts);
    const rec = E.recommend(ex, presc, done, hist, { profile: P(), loc: st.active.loc });
    let planned = Math.max(1, rec.setsRec + (entry.extra || 0));
    if (rec.stop && !entry.ignoreStop) planned = Math.max(done.length, 1);
    planned = Math.max(planned, done.length);
    return { ex, presc, done, rec, planned, finished: done.length >= planned && done.length > 0, hist };
  }
  function curIndex() {
    const a = st.active; if (!a) return -1;
    if (a.cur != null && a.exercises[a.cur] && !exState(a.exercises[a.cur]).finished) return a.cur;
    const i = a.exercises.findIndex(e => !exState(e).finished); return i;
  }
  function workoutView() {
    const a = st.active; if (!a) return '';
    const ci = curIndex();
    const wi = E.weekInfo(plan(), P());
    return `<div class="ohead"><button class="iconbtn" data-a="wMin" aria-label="Minimieren">${I.back}</button><div class="grow"><div class="eyebrow">${LOCN[a.loc]} · Woche ${wi.w}${wi.deload ? ' · Deload' : ''}</div><h2 style="font-size:20px">${esc(a.name)}</h2></div><button class="btn primary sm" data-a="finishAsk">Beenden</button></div>
      <div class="stack">
        ${ci >= 0 ? focusCard(a.exercises[ci], ci) : `<div class="card lime rings-bg stack"><h2 class="xl">Alles erledigt!</h2><div style="font-weight:700">Speichere dein Training oder hänge noch eine Übung an.</div><button class="btn dark big" data-a="finishAsk">Training speichern</button></div>`}
        <div class="section"><div class="head"><h3>Übungen</h3><span class="small muted">${a.exercises.filter(e => exState(e).finished).length}/${a.exercises.length} fertig</span></div>
          ${a.exercises.map((e, i) => { const S = exState(e); if (!S.ex) return ''; return `<button class="qrow ${S.finished ? 'done' : ''}" data-a="focusEx" data-i="${i}" ${i === ci ? 'style="box-shadow:inset 0 0 0 2px var(--lime)"' : ''}>${thumb(S.ex)}<div class="grow"><b>${esc(S.ex.name)}</b><div class="small muted">${S.done.length ? S.done.map(x => shortSet(S.ex, x)).join(' · ') : S.planned + ' Sätze · ' + rrText(S.presc.rr, S.ex)}</div></div><span class="num small" style="color:${S.finished ? 'var(--good)' : 'var(--muted)'}">${S.finished ? '✓' : S.done.length + '/' + S.planned}</span></button>`; }).join('')}
          <button class="btn" data-a="pickEx" data-mode="workout">${I.plus} Übung hinzufügen</button></div>
      </div>`;
  }
  function focusCard(entry, idx) {
    const S = exState(entry); const { ex, presc, done, rec, planned, finished } = S;
    if (!ex) return '';
    const kind = ex.kind; const isHold = kind === 'hold' || kind === 'int';
    const showW = kind === 'load' || (kind === 'bw' && ex.addw && (E.loadOptions(ex, st.active.loc, P()) || []).length > 1);
    const v = entry.draft || {};
    const nextW = v.w ?? rec.w, nextR = v.reps ?? rec.reps, nextS = v.sec ?? rec.sec;
    const unitNote = ex.uni ? ' pro Seite' : '';
    const prev = prevEntry(ex.id); const prevSets = prev ? prev.entry.sets : [];
    const lastNote = prev && prev.entry.note;
    const pills = Array.from({ length: Math.min(planned, 8) }, (_, i) => `<i class="${i < done.length ? 'on' : i === done.length ? 'cur' : ''}"></i>`).join('');
    let target = '';
    if (!finished) {
      const n = done.length + 1;
      const main = isHold ? `${fmt(rec.sec)} s${unitNote}` : (showW ? (kind === 'bw' ? (rec.w ? '+' + fmt(rec.w) + ' kg · ' : 'Körpergewicht · ') : fmt(rec.w) + ' kg · ') : '') + `${fmt(rec.reps)} Wdh.${unitNote}`;
      target = `<div class="target"><div class="row between"><span class="eyebrow">Satz ${n} von ${planned} · Empfehlung</span><span class="small" style="font-weight:800;opacity:.65">Reserve ${rirLabel(rec.rir, ex)}</span></div><b>${main}</b>
        <div class="note">Ziel ${rrText(presc.rr, ex)}${unitNote}${prevSets[done.length] ? ' · Letztes Mal: ' + shortSet(ex, prevSets[done.length]) : ''}</div>
        ${rec.warmup && rec.warmup.length ? `<div class="note">Aufwärmen: ${rec.warmup.map(w => fmt(w.w) + ' kg × ' + w.reps).join(' · ')}</div>` : ''}
        ${rec.notes.map(t => `<div class="note">${esc(t)}</div>`).join('')}
        ${rec.stop && !entry.ignoreStop ? `<div class="row"><button class="btn sm" data-a="ignoreStop" data-i="${idx}">Trotzdem weiter</button></div>` : ''}
        ${rec.harder ? `<div class="row"><button class="btn sm" data-a="switchEx" data-i="${idx}" data-id="${rec.harder}">${I.swap} Schwerer: ${esc(getEx(rec.harder).name)}</button></div>` : ''}
        ${rec.easier ? `<div class="row"><button class="btn sm" data-a="switchEx" data-i="${idx}" data-id="${rec.easier}">${I.swap} Leichter: ${esc(getEx(rec.easier).name)}</button></div>` : ''}
      </div>`;
    } else target = `<div class="target"><b>Übung erledigt ✓</b><div class="note">Tippe unten auf die nächste Übung oder „+ Satz“ für mehr.</div></div>`;
    const cols = isHold ? ['#', 'Vorher', 'Sek.', 'Res.', ''] : showW ? ['#', 'Vorher', kind === 'bw' ? '+kg' : 'kg', 'Wdh.', 'Res.', ''] : ['#', 'Vorher', 'Wdh.', 'Res.', ''];
    let rows = ''; const total = finished ? done.length : planned;
    for (let i = 0; i < total; i++) {
      const s = done[i]; const pv = `<td class="prev">${shortSet(ex, prevSets[i])}</td>`;
      if (s) rows += `<tr class="done"><td class="setno" data-a="editSet" data-i="${idx}" data-s="${i}">${i + 1}</td>${pv}${isHold ? `<td class="num" style="font-size:19px">${fmt(s.sec)}</td>` : `${showW ? `<td class="num" style="font-size:19px">${fmt(s.w || 0)}</td>` : ''}<td class="num" style="font-size:19px">${fmt(s.reps)}</td>`}<td class="rirtag">${rirLabel(s.rir, ex)}</td><td><button class="check" data-a="editSet" data-i="${idx}" data-s="${i}" aria-label="Satz bearbeiten">${I.check}</button></td></tr>`;
      else if (i === done.length) rows += `<tr class="next"><td class="setno">${i + 1}</td>${pv}${isHold ? `<td><input id="in-${entry.key}-sec" inputmode="numeric" data-in="draft" data-i="${idx}" data-f="sec" value="${nextS ?? ''}"></td>` : `${showW ? `<td><input id="in-${entry.key}-w" inputmode="decimal" data-in="draft" data-i="${idx}" data-f="w" value="${nextW != null ? fmt(nextW) : ''}"></td>` : ''}<td><input id="in-${entry.key}-reps" inputmode="numeric" data-in="draft" data-i="${idx}" data-f="reps" value="${nextR ?? ''}"></td>`}<td class="muted small">${rirLabel(rec.rir, ex)}</td><td><button class="check" data-a="doneSet" data-i="${idx}" aria-label="Satz abschließen">${I.check}</button></td></tr>`;
      else rows += `<tr><td class="setno">${i + 1}</td>${pv}${isHold ? `<td class="muted num">${fmt(rec.sec)}</td>` : `${showW ? `<td class="muted num">${fmt(rec.w)}</td>` : ''}<td class="muted num">${fmt(rec.reps)}</td>`}<td class="muted small">${rirLabel(rec.rir, ex)}</td><td></td></tr>`;
    }
    const isBB = ex.eq.includes('bb') && ex.kind === 'load';
    return `<div class="stage"><div class="over"><div class="eyebrow">${ROLE[presc.role] ? ROLE[presc.role][1] : ''} · ${ex.prim.map(m => D.MUSCLES[m]).join(', ')}</div><h2>${esc(ex.name)}</h2></div>${figSVG(ex, { anim: 2.6 })}<div class="setpill" aria-label="Satz ${done.length} von ${planned}">${pills}<b>${done.length}/${planned}</b></div></div>
      ${target}
      ${entry.note || lastNote ? `<div class="card flat small" data-a="noteOpen" data-i="${idx}" style="cursor:pointer">${I.note.replace('<svg', '<svg width="16" height="16" style="vertical-align:-3px"')} ${entry.note ? esc(entry.note) : '<span class="muted">Letztes Mal:</span> ' + esc(lastNote)}</div>` : ''}
      <table class="sets"><thead><tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>
      <div class="exfoot">${isHold && !finished && kind === 'hold' ? `<button class="btn sm primary" data-a="holdStart" data-i="${idx}">${I.play} Halten starten</button>` : ''}${kind === 'int' && !finished ? `<button class="btn sm primary" data-a="intStart" data-i="${idx}">${I.play} Intervall</button>` : ''}
        <button class="btn sm" data-a="setPlus" data-i="${idx}">+ Satz</button><button class="btn sm" data-a="setMinus" data-i="${idx}" ${planned <= Math.max(1, done.length) ? 'disabled' : ''}>− Satz</button>
        <button class="btn sm" data-a="swapWorkout" data-i="${idx}">${I.swap} Tauschen</button><button class="btn sm" data-a="noteOpen" data-i="${idx}">${I.note} Notiz</button>${isBB ? `<button class="btn sm" data-a="plates" data-i="${idx}">Scheiben</button>` : ''}<button class="btn sm" data-a="exInfo" data-id="${ex.id}">${I.info}</button><button class="btn sm ghost" data-a="exMenu" data-i="${idx}">Mehr</button></div>`;
  }

  function commitSet(idx, vals, rir) {
    const a = st.active; const entry = a.exercises[idx]; const ex = getEx(entry.exId);
    const before = exState(entry);
    const set = { done: true, rir, t: Date.now() };
    if (ex.kind === 'hold' || ex.kind === 'int') set.sec = vals.sec || 0; else { set.reps = vals.reps || 0; if (vals.w != null) set.w = vals.w; }
    entry.sets.push(set); entry.draft = null;
    const after = exState(entry);
    // Rückmeldung
    const sc = E.setScore(ex, set, E.bodyweight(P()));
    let msg = '';
    if (ex.kind !== 'int') {
      const targetSc = E.setScore(ex, { done: true, w: before.rec.w, reps: before.rec.reps, sec: before.rec.sec, rir: before.rec.rir }, E.bodyweight(P()));
      if (sc && targetSc) { const d = sc / targetSc - 1; msg = d > 0.03 ? 'Stärker als erwartet (' + (d > 0 ? '+' : '') + Math.round(d * 100) + ' %). ' : d < -0.05 ? 'Etwas unter dem Ziel, Empfehlung angepasst. ' : 'Genau im Ziel. '; }
    }
    if (after.finished) {
      a.cur = a.exercises.findIndex((e, i) => i > idx && !exState(e).finished);
      if (a.cur < 0) a.cur = a.exercises.findIndex(e => !exState(e).finished);
      msg += a.cur >= 0 ? 'Übung fertig.' : 'Alle Übungen erledigt!';
      const nextE = a.cur >= 0 ? a.exercises[a.cur] : null;
      if (nextE) startRest(Math.min(entry.presc.rest, 150), 'Nächste: ' + getEx(nextE.exId).name);
    } else {
      a.cur = idx;
      const r = after.rec; const isHold = ex.kind === 'hold' || ex.kind === 'int';
      msg += 'Nächster Satz: ' + (isHold ? fmt(r.sec) + ' s' : (ex.kind === 'load' ? fmt(r.w) + ' kg × ' : (r.w ? '+' + fmt(r.w) + ' kg × ' : '')) + fmt(r.reps));
      startRest(entry.presc.rest, getEx(entry.exId).name);
    }
    toast(msg, 3800);
    Store.saveActive(); closeSheet(); render();
    if (after.finished && a.cur >= 0) setTimeout(() => { const el = document.getElementById('ex-' + a.exercises[a.cur].key); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 60);
  }

  function finishWorkout(save) {
    const a = st.active; if (!a) return;
    if (save) {
      const bw = E.bodyweight(P());
      const exs = a.exercises.map(e => { const ex = getEx(e.exId); const sets = e.sets.filter(s => s.done).map(s => { const o = { rir: s.rir }; if (s.w != null) o.w = s.w; if (s.reps != null) o.reps = s.reps; if (s.sec != null) o.sec = s.sec; return o; }); return { exId: e.exId, sets, rirT: e.presc.rir, rr: e.presc.rr, note: (e.note || '').trim() || undefined, best: ex ? E.sessionBest(ex, { sets: sets.map(s => Object.assign({ done: true }, s)) }, bw) : 0 }; }).filter(e => e.sets.length);
      const prs = [];
      for (const e of exs) {
        const ex = getEx(e.exId); if (!ex || !e.best) continue;
        const prev = E.historyFor(e.exId, st.workouts).map(h => E.sessionBest(ex, h.entry, h.bw || bw));
        if (prev.length && e.best > Math.max(...prev) * 1.005) prs.push(e.exId);
      }
      const vol = exs.reduce((t, e) => { const ex = getEx(e.exId); return t + e.sets.reduce((u, s) => u + (ex && ex.kind === 'load' ? (s.w || 0) * (s.reps || 0) : ex && ex.kind === 'bw' ? (bw * (ex.bwf || 0) + (s.w || 0)) * (s.reps || 0) : 0), 0); }, 0);
      const w = { id: a.id, ts: Date.now(), date: E.todayISO(new Date(a.start)), name: a.name, dayId: a.dayId || null, loc: a.loc, dur: Math.round((Date.now() - a.start) / 1000), bw, exercises: exs, prs, vol: Math.round(vol) };
      if (exs.length) {
        st.workouts.push(w); Store.saveWorkout(w);
        if (a.dayIdx != null && plan()) { plan().next = (a.dayIdx + 1) % plan().days.length; Store.saveProfile(); }
        st.summary = w;
      }
    }
    st.active = null; st.rest = null; st.hold = null; Store.saveActive(true); keepAwake(false);
    st.ov = null; st.tab = 'heute';
    if (save && st.summary) openSheet({ type: 'summary' }); else closeSheet();
    render();
  }

  /* ================= Fragebogen ================= */
  function quizSteps(ans) { return E.Q.filter(q => !q.when || q.when(ans)); }
  function quizView() {
    const qz = st.ov; const steps = quizSteps(qz.answers); const i = Math.min(qz.i, steps.length - 1); const q = steps[i];
    const v = qz.answers[q.id];
    let body = '';
    if (q.type === 'text' || q.type === 'number') {
      body = `<input class="field" id="q-${q.id}" data-in="quiz" data-q="${q.id}" ${q.type === 'number' ? `inputmode="decimal"` : ''} placeholder="${esc(q.placeholder || '')}" value="${esc(v ?? '')}">${q.unit ? `<div class="small muted">${q.unit}</div>` : ''}`;
    } else if (q.type === 'single' || q.type === 'multi') {
      const arr = q.type === 'multi' ? (v || []) : null;
      body = q.options.map(([k, l, sub]) => { const on = q.type === 'multi' ? arr.includes(k) : v === k; return `<button class="opt ${q.type === 'multi' ? 'multi' : ''}" data-a="qOpt" data-q="${q.id}" data-k="${k}" aria-pressed="${on}"><span class="dot"></span><span class="grow"><b>${esc(l)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</span></button>`; }).join('');
      if (q.id === 'priority' && arr && arr.length >= 3) body += '<div class="small muted">Maximal 3 auswählbar.</div>';
    } else if (q.type === 'db') {
      const d = qz.answers.dbSetup || (qz.answers.dbSetup = { count: 1, type: 'fixed', list: [12.5], min: 2.5, max: 20, step: 2.5 });
      body = `<label class="lbl">Anzahl</label><div class="seg"><button data-a="dbSet" data-k="count" data-v="1" aria-pressed="${d.count == 1}">Eine Kurzhantel</button><button data-a="dbSet" data-k="count" data-v="2" aria-pressed="${d.count == 2}">Ein Paar oder mehr</button></div>
        <label class="lbl" style="margin-top:8px">Art</label><div class="seg"><button data-a="dbSet" data-k="type" data-v="fixed" aria-pressed="${d.type === 'fixed'}">Feste Gewichte</button><button data-a="dbSet" data-k="type" data-v="adj" aria-pressed="${d.type === 'adj'}">Verstellbar</button></div>
        ${d.type === 'fixed' ? `<label class="lbl" for="dbList" style="margin-top:8px">Gewichte in kg (mit Leerzeichen trennen)</label><input class="field" id="dbList" data-in="dbList" inputmode="decimal" value="${esc((d.list || []).map(x => fmt(x)).join(' '))}" placeholder="z. B. 12,5 oder 5 10 15"><div class="small muted">Pro Hantel. Mehrere Hanteln verschiedener Gewichte einfach alle eintragen.</div>`
          : `<div class="row" style="margin-top:8px">${[['min', 'Min. kg'], ['max', 'Max. kg'], ['step', 'Schritt']].map(([k, l]) => `<div class="grow"><label class="lbl" for="db-${k}">${l}</label><input class="field" id="db-${k}" inputmode="decimal" data-in="dbNum" data-k="${k}" value="${fmt(d[k])}"></div>`).join('')}</div><div class="small muted">Pro Hantel, z. B. 2,5 bis 24 kg in 2,5er-Schritten.</div>`}`;
    } else if (q.type === 'cable') {
      const c = qz.answers.cableSetup || (qz.answers.cableSetup = { min: 5, max: 50, step: 5 });
      body = `<div class="row">${[['min', 'Min. kg'], ['max', 'Max. kg'], ['step', 'Schritt']].map(([k, l]) => `<div class="grow"><label class="lbl" for="cb-${k}">${l}</label><input class="field" id="cb-${k}" inputmode="decimal" data-in="cableNum" data-k="${k}" value="${fmt(c[k])}"></div>`).join('')}</div><div class="small muted">Bei Hantelscheiben am Seilzug: kleinstes Gewicht, größtes Gewicht und kleinste Steigerung.</div>`;
    }
    const canNext = q.optional || q.type === 'multi' || q.type === 'db' || q.type === 'cable' || (v != null && v !== '');
    return `<div class="ohead"><button class="iconbtn" data-a="qBack" aria-label="Zurück">${i === 0 ? I.x : I.back}</button><div class="grow"><div class="qprog"><i style="width:${(i + 1) / steps.length * 100}%"></i></div></div><span class="small muted num" style="font-size:16px">${i + 1}/${steps.length}</span></div>
      <div class="stack" style="margin-top:14px"><h1 style="font-size:30px">${esc(q.title)}</h1>${q.hint ? `<p class="ink2" style="margin:0">${esc(q.hint)}</p>` : ''}${body}
      <button class="btn primary big" data-a="qNext" ${canNext ? '' : 'disabled'}>${i === steps.length - 1 ? 'Plan erstellen' : 'Weiter'}</button>
      ${q.type === 'multi' && !(v || []).length ? '<div class="small muted" style="text-align:center">Nichts zutreffend? Einfach weiter.</div>' : ''}</div>`;
  }
  function quizNext() {
    const qz = st.ov; const steps = quizSteps(qz.answers);
    if (qz.i < steps.length - 1) { qz.i++; renderOverlay(); $('#ov').scrollTop = 0; focusQuizInput(); return; }
    // Fertig: Plan bauen
    const prof = st.profile ? clone(st.profile) : { created: new Date().toISOString(), settings: {}, bwLog: [], custom: [] };
    const oldBw = E.bodyweight(prof);
    prof.answers = clone(qz.answers);
    if (!prof.bwLog || !prof.bwLog.length || (+prof.answers.bw && +prof.answers.bw !== oldBw)) { prof.bwLog = prof.bwLog || []; if (+prof.answers.bw) prof.bwLog.push({ d: E.todayISO(), kg: +prof.answers.bw }); }
    const newPlan = E.buildPlan(prof);
    st.ov = { type: 'result', prof, plan: newPlan, loc: newPlan.locs[0] };
    renderOverlay(); $('#ov').scrollTop = 0;
  }
  function focusQuizInput() { setTimeout(() => { const i = document.querySelector('#ov input.field'); if (i && !i.value) i.focus(); }, 50); }
  function resultView() {
    const r = st.ov; const p = r.plan; const loc = r.loc;
    const a = r.prof.answers; const ab = E.abilities(a);
    return `<div class="ohead"><button class="iconbtn" data-a="resultBack" aria-label="Zurück">${I.back}</button><div class="grow"><div class="eyebrow">Dein Ergebnis</div></div></div>
      <div class="stack"><h1>${esc(p.splitName)}, ${p.days.length}× pro Woche</h1>
      <p class="ink2" style="margin:0">Aus ${E.allExercises(r.prof).length} Übungen wurden die ausgewählt, die zu deiner Ausrüstung, deinem Level (≈${ab.tests.P} Klimmzüge, ≈${ab.tests.PU} Liegestütze) ${(a.injuries || []).length ? 'und deinen Beschwerden ' : ''}passen. Tippe im Plan später auf eine Übung, um sie zu tauschen.</p>
      ${p.locs.length > 1 ? `<div class="seg">${p.locs.map(l => `<button data-a="resultLoc" data-l="${l}" aria-pressed="${loc === l}">${LOCN[l]}</button>`).join('')}</div>` : ''}
      ${p.days.map(d => `<div class="section"><div class="head"><h2>${esc(d.name)}</h2><span class="small muted">≈ ${estMinutes(d, loc)} min</span></div><div class="list">${d.slots.filter(s => s.ex[loc]).map(sl => { const ex = getEx(sl.ex[loc]); const pr = E.prescription(sl, ex, r.prof, p); return `<div class="li">${plateHTML(sl.r)}<div class="grow"><div style="font-weight:600">${esc(ex.name)}</div><div class="small muted">${pr.sets} × ${rrText(pr.rr, ex)}${ex.uni ? ' pro Seite' : ''}</div>${sl.why[loc] && sl.why[loc].length ? `<div class="why" style="margin-top:4px">${sl.why[loc].map(w => `<span>${esc(w)}</span>`).join('')}</div>` : ''}</div></div>`; }).join('')}</div></div>`).join('')}
      <button class="btn primary big" data-a="acceptPlan">Plan übernehmen</button>
      <button class="btn" data-a="reroll">Andere Übungsauswahl vorschlagen</button></div>`;
  }

  /* ================= Sheets ================= */
  const SHEETS = {
    rir(s) {
      const entry = st.active.exercises[s.i]; const ex = getEx(entry.exId); const S = exState(entry);
      const isHold = ex.kind === 'hold' || ex.kind === 'int';
      const showW = ex.kind === 'load' || (ex.kind === 'bw' && ex.addw && (E.loadOptions(ex, st.active.loc, P()) || []).length > 1);
      const vals = s.vals;
      const stepper = (f, label, step) => `<div><label class="lbl" for="rs-${f}">${label}</label><div class="stepper"><button data-a="rirStep" data-f="${f}" data-d="${-step}" aria-label="weniger">−</button><input id="rs-${f}" inputmode="decimal" data-in="rirVal" data-f="${f}" value="${fmt(vals[f] ?? 0)}"><button data-a="rirStep" data-f="${f}" data-d="${step}" aria-label="mehr">+</button></div></div>`;
      const opts = isHold ? [0, 1, 2, 3, 4, 5] : [0, 1, 2, 3, 4, 5];
      const lbl = isHold ? ['0 s', '3 s', '6 s', '9 s', '12 s', '15+ s'] : ['0', '1', '2', '3', '4', '5+'];
      const sub = isHold ? ['am Limit', '', '', '', '', 'locker'] : ['Versagen', 'sehr hart', 'hart', 'mittel', 'leicht', 'locker'];
      return `<div class="stack"><div><div class="eyebrow">${esc(ex.name)} · Satz ${S.done.length + 1}</div><h2>${isHold ? 'Wie lange hättest du noch halten können?' : 'Wie viele Wiederholungen wären noch gegangen?'}</h2></div>
        ${isHold ? stepper('sec', 'Gehaltene Sekunden', 1) : `<div class="row" style="align-items:flex-end">${showW ? `<div class="grow">${stepper('w', ex.kind === 'bw' ? 'Zusatzgewicht kg' : 'Gewicht kg', wStep(ex))}</div>` : ''}<div class="grow">${stepper('reps', 'Wiederholungen', 1)}</div></div>`}
        <div class="rirgrid">${opts.map((o, k) => `<button data-a="rirPick" data-r="${o}" class="${o === S.rec.rir ? 'suggest' : ''}"><b>${lbl[k]}</b><span>${settings().rpe && !isHold ? 'RPE ' + fmt(Math.max(5, 10 - o)) : sub[k]}</span></button>`).join('')}</div>
        <p class="tiny muted" style="margin:0">Ehrlich schätzen: Diese „Reserve“ ist die wichtigste Zahl für den Algorithmus. Umrandet = geplantes Ziel (${rirLabel(S.rec.rir, ex)}).</p></div>`;
    },
    editSet(s) {
      const entry = st.active.exercises[s.i]; const ex = getEx(entry.exId); const set = entry.sets.filter(x => x.done)[s.s];
      const isHold = ex.kind === 'hold' || ex.kind === 'int';
      const f = (k, l) => `<div class="grow"><label class="lbl" for="es-${k}">${l}</label><input class="field num" id="es-${k}" inputmode="decimal" data-in="editSet" data-k="${k}" value="${fmt(set[k] ?? 0)}"></div>`;
      return `<div class="stack"><h2>Satz ${s.s + 1} bearbeiten</h2><div class="row">${isHold ? f('sec', 'Sekunden') : (ex.kind !== 'bw' || set.w ? f('w', 'kg') : '') + f('reps', 'Wdh.')}${f('rir', 'Reserve')}</div>
        <button class="btn primary" data-a="closeSheetRender">Fertig</button>${s.confirm ? `<button class="btn danger" data-a="delSetYes">Wirklich löschen</button>` : `<button class="btn danger" data-a="delSet">Satz löschen</button>`}</div>`;
    },
    exInfo(s) {
      const ex = getEx(s.id); if (!ex) return '';
      const h = E.historyFor(ex.id, st.workouts);
      const easier = ex.grp ? E.chainStep(ex, -1, P(), defLoc()) : null, harder = ex.grp ? E.chainStep(ex, 1, P(), defLoc()) : null;
      const chain = ex.grp ? E.allExercises(P()).filter(e => e.grp === ex.grp && e.pat === ex.pat).sort((a, b) => a.rank - b.rank) : [];
      const last = h.slice(-5).reverse();
      const bw = E.bodyweight(P());
      const best = h.reduce((m, x) => Math.max(m, E.sessionBest(ex, x.entry, x.bw || bw)), 0);
      const pctTable = ex.kind === 'load' && best > 0 ? `<div class="card stack" style="gap:8px"><div class="row between"><b>1RM-Tabelle</b><span class="small muted">geschätztes Maximum ${fmt(best, 1)} kg</span></div><div class="tbl"><table><thead><tr><th>%</th><th class="r">Gewicht</th><th class="r">≈ Wdh.</th></tr></thead><tbody>${[100, 95, 90, 85, 80, 75, 70, 65, 60].map(p => `<tr><td>${p} %</td><td class="r num">${fmt(Math.round(best * p / 100 * 2) / 2)} kg</td><td class="r num">${p === 100 ? 1 : Math.max(1, Math.round(30 * (100 / p - 1)))}</td></tr>`).join('')}</tbody></table></div></div>` : '';
      return `<div class="stack"><div class="stage" style="aspect-ratio:1/0.82"><div class="over"><div class="eyebrow">${esc(D.PATTERNS[ex.pat] || '')}</div><h2>${esc(ex.name)}</h2></div>${figSVG(ex, { anim: 2.6 })}<div class="setpill" style="gap:4px">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= ex.lvl ? 'on' : ''}"></i>`).reverse().join('')}<b>Lvl ${ex.lvl}</b></div></div>
        <div class="row wrap" style="gap:6px">${ex.prim.map(m => `<span class="chip on">${D.MUSCLES[m]}</span>`).join('')}${(ex.sec || []).map(m => `<span class="chip">${D.MUSCLES[m]}</span>`).join('')}</div>
        <div class="card stack" style="gap:10px"><b>Anleitung</b><p style="margin:0" class="ink2">${esc(ex.d)}</p>
        ${ex.c && ex.c.length ? `<div class="stack" style="gap:6px">${ex.c.map((c, i) => `<div class="row" style="align-items:flex-start"><span class="plate p-main" style="width:22px;height:22px;font-size:11px">${i + 1}</span><span>${esc(c)}</span></div>`).join('')}</div>` : ''}
        <div class="small muted">${ex.eq.map(e => D.EQUIP[e]).join(' + ')} · ${ex.kind === 'load' ? 'mit Gewicht' : ex.kind === 'bw' ? 'Körpergewicht' + (ex.addw ? ' (+ Zusatzgewicht möglich)' : '') : ex.kind === 'hold' ? 'Haltezeit' : 'Intervall'} · Ziel ${rrText(ex.rr, ex)}${ex.uni ? ' pro Seite' : ''}</div></div>
        ${chain.length > 1 ? `<div class="stack" style="gap:8px"><b>Progressionsstufen</b><div class="chips" style="gap:10px">${chain.map(c => `<button class="extile" style="width:92px;flex:none" data-a="exInfo" data-id="${c.id}"><div class="tile" style="${c.id === ex.id ? 'box-shadow:inset 0 0 0 2px var(--lime)' : ''}">${figSVG(c)}</div><span>${c.id === harder ? '▲ ' : c.id === easier ? '▼ ' : ''}${esc(c.name)}</span></button>`).join('')}</div></div>` : ''}
        ${h.length ? `<div class="card stack" style="gap:8px"><b>Deine Leistung</b>${h.length >= 2 ? lineChart(exSeries(ex.id), exUnit(ex)) : ''}<div class="list" style="background:var(--surface2)">${last.map(x => `<div class="li"><div class="grow small">${dateDE(x.date)}</div><div class="small">${x.entry.sets.map(z => setTxt(ex, z)).join(' · ')}</div></div>`).join('')}</div></div>` : '<div class="small muted">Noch nicht trainiert.</div>'}
        ${pctTable}
        <div class="row wrap">${st.active ? `<button class="btn primary grow" data-a="addToWorkout" data-id="${ex.id}">${I.plus} Ins Training</button>` : ''}<button class="btn grow" data-a="addToPlanAsk" data-id="${ex.id}">${I.plus} In den Plan</button>${ex.custom ? `<button class="btn danger" data-a="delCustom" data-id="${ex.id}">Löschen</button>` : ''}</div></div>`;
    },
    day(s) {
      const p = plan(); const d = p.days[s.i]; const loc = s.loc || st.homeLoc || defLoc();
      const sl = d.slots.filter(x => x.ex[loc]);
      return `<div class="stack"><div class="card ${s.i % 2 ? 'lilac' : 'lav'} daycard" style="min-height:150px"><div class="txt"><h2>${esc(d.name)}</h2><span class="tag" style="align-self:flex-start">${sl.length} Übungen</span><div class="small" style="font-weight:800;margin-top:auto">${esc(dayFocus(d, loc))}</div></div><div class="minbadge">${estMinutes(d, loc)}<small>min</small></div><div class="figwrap figdark">${figSVG(heroEx(d, loc), { anim: 2.8 })}</div></div>
        ${locs().length > 1 ? `<div class="seg">${['home', 'gym'].map(l => `<button data-a="dayLoc" data-l="${l}" aria-pressed="${loc === l}">${LOCN[l]}</button>`).join('')}</div>` : ''}
        <div class="list">${sl.map(x => { const ex = getEx(x.ex[loc]); const pr = E.prescription(x, ex, P(), p); return `<button class="li" data-a="exInfo" data-id="${ex.id}">${thumb(ex)}<div class="grow"><b>${esc(ex.name)}</b><div class="small muted">${pr.sets} × ${rrText(pr.rr, ex)}${ex.uni ? ' pro Seite' : ''}</div></div><span class="chev">${I.chev}</span></button>`; }).join('')}</div>
        <button class="btn primary big" data-a="startWorkout" data-d="${s.i}" data-l="${loc}">${I.play} Training starten</button></div>`;
    },
    filter(s) {
      const F = st.libF || {}; let opts = [];
      if (s.k === 'lvl') opts = LVL.map(([v, n]) => [v, n]);
      if (s.k === 'group') opts = Object.keys(D.GROUPS).map(g => [g, g]);
      if (s.k === 'pat') opts = Object.entries(D.PATTERNS).map(([k, v]) => [k, v]);
      if (s.k === 'eq') opts = Object.entries(D.EQUIP).map(([k, v]) => [k, v]);
      const title = { lvl: 'Schwierigkeit', group: 'Muskelgruppe', pat: 'Kategorie', eq: 'Ausrüstung' }[s.k];
      return `<div class="stack"><h2>${title}</h2><div class="chips" style="flex-wrap:wrap"><button class="chip ${F[s.k] == null ? 'on' : ''}" data-a="filterPick" data-v="">Alle</button>${opts.map(([v, n]) => `<button class="chip ${F[s.k] == v ? 'on' : ''}" data-a="filterPick" data-v="${esc(v)}">${esc(n)}</button>`).join('')}</div></div>`;
    },
    note(s) {
      const e = st.active.exercises[s.i]; const ex = getEx(e.exId); const prev = prevEntry(ex.id);
      return `<div class="stack"><h2>Notiz · ${esc(ex.name)}</h2>${prev && prev.entry.note ? `<div class="card flat small"><span class="muted">Letztes Mal:</span> ${esc(prev.entry.note)}</div>` : ''}
        <textarea class="field" id="noteText" data-in="noteText" rows="4" placeholder="z. B. Griffbreite, Sitzhöhe, Schmerzen, Tempo …">${esc(e.note || '')}</textarea>
        <button class="btn primary" data-a="closeSheetRender">Speichern</button></div>`;
    },
    plates(s) {
      const bar = s.bar || 20; const w = s.w || 60;
      const per = Math.max(0, (w - bar) / 2); const PL = [[25, 'var(--rose)'], [20, 'var(--lav)'], [15, 'var(--warn)'], [10, 'var(--good)'], [5, '#fff'], [2.5, '#9C9CA7'], [1.25, '#6E6E78']];
      let rest = per; const use = [];
      for (const [p, c] of PL) while (rest >= p - 1e-6) { use.push([p, c]); rest = Math.round((rest - p) * 100) / 100; }
      const h = p => 34 + p * 3.2;
      const side = use.map(([p, c]) => `<div class="pl" style="height:${h(p)}px;background:${c}">${fmt(p)}</div>`).join('');
      return `<div class="stack"><h2>Scheibenrechner</h2><div class="small muted" style="margin-top:-8px">Gesamtgewicht und Stange wählen</div>
        <div class="stepper"><button data-a="plateStep" data-d="-2.5">−</button><input id="plateW" inputmode="decimal" data-in="plateW" value="${fmt(w)}" aria-label="Zielgewicht"><button data-a="plateStep" data-d="2.5">+</button></div>
        <div class="seg">${[20, 15, 10].map(b => `<button data-a="plateBar" data-b="${b}" aria-pressed="${bar === b}">${b} kg</button>`).join('')}</div>
        <div class="card"><div class="platebar"><div class="sleeve"></div>${[...use].reverse().map(([p, c]) => `<div class="pl" style="height:${h(p)}px;background:${c}">${fmt(p)}</div>`).join('')}<div class="bar"></div>${side}<div class="sleeve"></div></div>
        <div class="small ink2" style="text-align:center">${use.length ? 'Pro Seite: ' + use.map(u => fmt(u[0])).join(' + ') + ' kg' : 'Nur die Stange'}${rest > 0 ? ' · ' + fmt(rest * 2) + ' kg nicht darstellbar' : ''}</div></div></div>`;
    },
    slot(s) {
      const p = plan(); const day = p.days[s.d]; const sl = day.slots[s.s]; const loc = st.planLoc || defLoc();
      const ex = getEx(sl.ex[loc]);
      const alts = E.alternatives(sl, loc, P(), day.slots.filter(x => x !== sl).map(x => x.ex[loc])).filter(x => x.ex.id !== (ex && ex.id)).slice(0, 12);
      const pr = ex ? E.prescription(sl, ex, P(), p) : null; const rr = sl.custRR || (pr && pr.rr) || [8, 12];
      return `<div class="stack"><div><div class="eyebrow">${esc(day.name)} · ${ROLE[sl.r][1]}</div><h2>${ex ? esc(ex.name) : 'Keine Übung'}</h2></div>
        <div class="row">${[['sets', 'Sätze', sl.sets], ['lo', 'Wdh. min', rr[0]], ['hi', 'Wdh. max', rr[1]], ['rest', 'Pause s', sl.rest]].map(([k, l, v]) => `<div class="grow"><label class="lbl" for="sl-${k}">${l}</label><input class="field num" id="sl-${k}" inputmode="numeric" data-in="slot" data-k="${k}" value="${v}"></div>`).join('')}</div>
        <div class="row"><button class="btn sm" data-a="slotMove" data-dir="-1">Nach oben</button><button class="btn sm" data-a="slotMove" data-dir="1">Nach unten</button><span class="grow"></span>${s.confirm ? '<button class="btn sm danger" data-a="slotDelYes">Wirklich entfernen</button>' : '<button class="btn sm danger" data-a="slotDel">Entfernen</button>'}</div>
        <div class="section"><div class="head"><h3>Tauschen gegen</h3><span class="small muted">beste Treffer zuerst</span></div>
        <div class="list">${alts.map(x => `<button class="li" data-a="slotSwap" data-id="${x.ex.id}"><div class="grow"><div style="font-weight:600">${esc(x.ex.name)}</div><div class="small muted">${x.ex.eq.map(e => D.EQUIP[e]).join(' + ')}</div>${x.reasons.length ? `<div class="why" style="margin-top:3px">${x.reasons.map(w => `<span>${esc(w)}</span>`).join('')}</div>` : ''}</div><span class="chev">${I.swap}</span></button>`).join('') || '<div class="li muted small">Keine Alternativen mit deiner Ausrüstung.</div>'}</div>
        <button class="btn" data-a="pickEx" data-mode="slot" data-d="${s.d}" data-s="${s.s}">Aus allen Übungen wählen</button></div></div>`;
    },
    pick(s) {
      const q = (s.q || '').toLowerCase();
      const loc = st.active ? st.active.loc : (st.planLoc || defLoc());
      const eq = E.locEquip(P(), loc);
      const list = E.allExercises(P()).filter(ex => (!q || ex.name.toLowerCase().includes(q) || (D.PATTERNS[ex.pat] || '').toLowerCase().includes(q)) && (s.all || E.available(ex, eq))).sort((a, b) => a.name.localeCompare(b.name));
      return `<div class="stack"><h2>Übung wählen</h2><input class="field" id="pickq" type="search" data-in="pickQ" placeholder="Suchen" value="${esc(s.q || '')}">
        <label class="row small"><input type="checkbox" data-a="pickAll" ${s.all ? 'checked' : ''}> Auch Übungen ohne passende Ausrüstung (${LOCN[loc]})</label>
        <div class="list">${list.slice(0, 80).map(ex => `<button class="li" data-a="pickDo" data-id="${ex.id}"><div class="grow"><div style="font-weight:600">${esc(ex.name)}</div><div class="small muted">${esc(D.PATTERNS[ex.pat] || '')} · ${ex.eq.map(e => D.EQUIP[e]).join(' + ')}</div></div></button>`).join('')}</div></div>`;
    },
    swapWorkout(s) {
      const entry = st.active.exercises[s.i]; const ex = getEx(entry.exId);
      const slot = findSlot(entry) || { p: [ex.pat], r: entry.presc.role };
      const alts = E.alternatives(slot, st.active.loc, P(), st.active.exercises.map(e => e.exId)).filter(x => x.ex.id !== ex.id).slice(0, 12);
      return `<div class="stack"><div><div class="eyebrow">Tauschen</div><h2>${esc(ex.name)}</h2></div>
        ${entry.slotId ? `<label class="row small"><input type="checkbox" id="swapPlan" data-a="swapPlanToggle" ${s.plan ? 'checked' : ''}> Auch dauerhaft im Plan tauschen</label>` : ''}
        <div class="list">${alts.map(x => `<button class="li" data-a="swapDo" data-id="${x.ex.id}"><div class="grow"><div style="font-weight:600">${esc(x.ex.name)}</div><div class="small muted">${x.ex.eq.map(e => D.EQUIP[e]).join(' + ')}</div>${x.reasons.length ? `<div class="why" style="margin-top:3px">${x.reasons.map(w => `<span>${esc(w)}</span>`).join('')}</div>` : ''}</div></button>`).join('')}</div>
        <button class="btn" data-a="pickEx" data-mode="swapWorkout" data-i="${s.i}">Aus allen Übungen wählen</button></div>`;
    },
    exMenu(s) {
      const entry = st.active.exercises[s.i]; const ex = getEx(entry.exId);
      return `<div class="stack"><h2>${esc(ex.name)}</h2>
        <button class="btn" data-a="exInfo" data-id="${ex.id}">${I.info} Anleitung & Verlauf</button>
        <button class="btn" data-a="exMove" data-i="${s.i}" data-dir="-1">Nach oben verschieben</button>
        <button class="btn" data-a="exMove" data-i="${s.i}" data-dir="1">Nach unten verschieben</button>
        ${s.confirm ? `<button class="btn danger" data-a="exRemoveYes" data-i="${s.i}">Wirklich entfernen</button>` : `<button class="btn danger" data-a="exRemove" data-i="${s.i}">Aus dem Training entfernen</button>`}</div>`;
    },
    finish(s) {
      const a = st.active; const done = a.exercises.reduce((t, e) => t + e.sets.filter(x => x.done).length, 0);
      const open = a.exercises.filter(e => !exState(e).finished).length;
      return `<div class="stack"><h2>Training beenden?</h2><div class="kpis"><div class="kpi"><b>${durTxt((Date.now() - a.start) / 1000)}</b><span>Dauer</span></div><div class="kpi"><b>${done}</b><span>Sätze</span></div><div class="kpi"><b>${open}</b><span>Übungen offen</span></div></div>
        <button class="btn primary big" data-a="finishSave" ${done ? '' : 'disabled'}>Speichern</button>
        ${s.confirm ? '<button class="btn danger" data-a="finishDiscardYes">Wirklich verwerfen</button>' : '<button class="btn danger" data-a="finishDiscard">Verwerfen</button>'}
        <button class="btn ghost" data-a="closeSheet">Weiter trainieren</button></div>`;
    },
    summary() {
      const w = st.summary; if (!w) return '';
      const sets = w.exercises.reduce((t, e) => t + e.sets.length, 0);
      return `<div class="stack"><div class="eyebrow">Gespeichert</div><h2>Starkes Training!</h2>
        <div class="kpis"><div class="kpi"><b>${durTxt(w.dur)}</b><span>Dauer</span></div><div class="kpi"><b>${sets}</b><span>Sätze</span></div><div class="kpi"><b>${w.prs.length}</b><span>Rekorde</span></div></div>
        ${w.prs.length ? `<div class="list">${w.prs.map(id => `<div class="li"><span class="plate p-skill">★</span><div class="grow">${esc(getEx(id).name)}</div></div>`).join('')}</div>` : ''}
        <p class="small ink2" style="margin:0">Deine Ergebnisse fließen in die Empfehlungen fürs nächste Mal ein. Nächste Einheit: <b>${esc(plan().days[nextDayIdx()].name)}</b>.</p>
        <button class="btn primary" data-a="closeSheet">Fertig</button></div>`;
    },
    wDetail(s) {
      const w = st.workouts.find(x => x.id === s.id); if (!w) return '';
      return `<div class="stack"><div><div class="eyebrow">${dateDE(w.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div><h2>${esc(w.name)}</h2><div class="small muted">${LOCN[w.loc] || ''} · ${durTxt(w.dur || 0)} · ${fmt(w.bw, 1)} kg Körpergewicht</div></div>
        ${w.exercises.map(e => { const ex = getEx(e.exId); return ex ? `<div class="card"><div class="row between"><b>${esc(ex.name)}</b>${(w.prs || []).includes(e.exId) ? '<span class="pr small">Rekord</span>' : ''}</div><div class="small ink2" style="margin-top:4px">${e.sets.map((z, i) => `${i + 1}. ${setTxt(ex, z)} <span class="muted">(R ${rirLabel(z.rir, ex)})</span>`).join('<br>')}</div></div>` : ''; }).join('')}
        ${s.confirm ? `<button class="btn danger" data-a="wDelYes" data-id="${w.id}">Wirklich löschen</button>` : `<button class="btn danger" data-a="wDel" data-id="${w.id}">Training löschen</button>`}</div>`;
    },
    bw() {
      return `<div class="stack"><h2>Körpergewicht</h2><div class="stepper"><button data-a="bwStep" data-d="-0.5">−</button><input id="bwIn" inputmode="decimal" value="${fmt(E.bodyweight(P()), 1)}"><button data-a="bwStep" data-d="0.5">+</button></div><button class="btn primary" data-a="bwSave">Speichern</button></div>`;
    },
    settings(s) {
      const se = settings();
      const tog = (k, l, sub) => `<label class="li" style="cursor:pointer"><div class="grow"><div style="font-weight:600">${l}</div>${sub ? `<div class="small muted">${sub}</div>` : ''}</div><input type="checkbox" data-a="setToggle" data-k="${k}" ${se[k] ? 'checked' : ''} style="width:22px;height:22px"></label>`;
      return `<div class="stack"><h2>Einstellungen</h2>
        <div class="card stack" style="gap:10px"><b>Schrift</b><div class="seg">${[['hand', 'Handschrift'], ['classic', 'Klassisch']].map(([k, n]) => `<button data-a="setFont" data-k="${k}" aria-pressed="${(se.font === 'classic' ? 'classic' : 'hand') === k}">${n}</button>`).join('')}</div></div>
        <div class="list">${tog('autoRest', 'Pausentimer automatisch', 'Startet nach jedem Satz')}${tog('sound', 'Töne')}${tog('vib', 'Vibration')}${tog('rpe', 'RPE statt Reserve anzeigen', 'RPE 8 = 2 Wdh. Reserve')}</div>
        <div class="card stack"><b>Studio-Gewichte</b><div class="row"><div class="grow"><label class="lbl" for="set-bb">Langhantel-Schritt</label><select class="field" id="set-bb" data-in="setNum" data-k="bbStep">${[1, 2, 2.5, 5].map(v => `<option value="${v}" ${se.bbStep == v ? 'selected' : ''}>${fmt(v)} kg</option>`).join('')}</select></div><div class="grow"><label class="lbl" for="set-st">Maschinen-Schritt</label><select class="field" id="set-st" data-in="setNum" data-k="stackStep">${[1.25, 2.5, 5, 7].map(v => `<option value="${v}" ${se.stackStep == v ? 'selected' : ''}>${fmt(v)} kg</option>`).join('')}</select></div></div></div>
        <div class="card stack"><b>Datensicherung</b><div class="small muted">${Store.mode === 'db' ? 'Deine Daten werden in deinem Konto gespeichert und sind auf allen Geräten verfügbar, auf denen du angemeldet bist.' : 'Deine Daten liegen nur in diesem Browser. Mach ab und zu ein Backup.'}</div>
          <div class="row wrap"><button class="btn grow" data-a="exportData">Backup exportieren</button><label class="btn grow" for="importFile" style="cursor:pointer">Backup importieren</label><input type="file" id="importFile" accept=".json,application/json" data-in="importFile" hidden></div></div>
        <button class="btn" data-a="quizEdit">Fragebogen bearbeiten</button>
        ${s.confirm ? '<button class="btn danger" data-a="resetYes">Wirklich alles löschen</button>' : '<button class="btn danger" data-a="reset">Alle Daten löschen</button>'}
        <p class="tiny muted" style="margin:0">Satzwerk ersetzt keine ärztliche Beratung. Bei Schmerzen Übung abbrechen.</p></div>`;
    },
    rebuild() {
      return `<div class="stack"><h2>Plan neu berechnen?</h2><p class="ink2" style="margin:0">Mit deinen bisherigen Antworten wird eine neue Übungsauswahl erstellt. Deine manuellen Änderungen am Plan gehen dabei verloren. Dein Trainingsverlauf bleibt erhalten.</p><button class="btn primary" data-a="rebuildYes">Neu berechnen</button><button class="btn ghost" data-a="closeSheet">Abbrechen</button></div>`;
    },
    addToPlan(s) {
      const ex = getEx(s.id);
      return `<div class="stack"><h2>${esc(ex.name)} hinzufügen</h2><div class="list">${plan().days.map((d, i) => `<button class="li" data-a="addToPlanDo" data-d="${i}" data-id="${ex.id}"><div class="grow">${esc(d.name)}</div><span class="chev">${I.chev}</span></button>`).join('')}</div></div>`;
    },
    custom(s) {
      const c = s.c || (s.c = { name: '', pat: 'biceps', kind: 'load', prim: [], eq: ['bw'], lo: 8, hi: 12 });
      return `<div class="stack"><h2>Eigene Übung</h2>
        <div><label class="lbl" for="cx-name">Name</label><input class="field" id="cx-name" data-in="cx" data-k="name" value="${esc(c.name)}" placeholder="z. B. Zottman-Curls"></div>
        <div class="row"><div class="grow"><label class="lbl" for="cx-pat">Bewegung</label><select class="field" id="cx-pat" data-in="cx" data-k="pat">${Object.entries(D.PATTERNS).map(([k, v]) => `<option value="${k}" ${c.pat === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
        <div class="grow"><label class="lbl" for="cx-kind">Art</label><select class="field" id="cx-kind" data-in="cx" data-k="kind">${[['load', 'Mit Gewicht'], ['bw', 'Körpergewicht'], ['hold', 'Halten (Sekunden)']].map(([k, v]) => `<option value="${k}" ${c.kind === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div></div>
        <div><div class="lbl">Muskeln</div><div class="row wrap">${Object.entries(D.MUSCLES).map(([k, v]) => `<button class="chip ${c.prim.includes(k) ? 'on' : ''}" data-a="cxMuscle" data-k="${k}">${v}</button>`).join('')}</div></div>
        <div><div class="lbl">Geräte</div><div class="row wrap">${Object.entries(D.EQUIP).map(([k, v]) => `<button class="chip ${c.eq.includes(k) ? 'on' : ''}" data-a="cxEq" data-k="${k}">${v}</button>`).join('')}</div></div>
        <div class="row"><div class="grow"><label class="lbl" for="cx-lo">${c.kind === 'hold' ? 'Sek. min' : 'Wdh. min'}</label><input class="field" id="cx-lo" inputmode="numeric" data-in="cx" data-k="lo" value="${c.lo}"></div><div class="grow"><label class="lbl" for="cx-hi">${c.kind === 'hold' ? 'Sek. max' : 'Wdh. max'}</label><input class="field" id="cx-hi" inputmode="numeric" data-in="cx" data-k="hi" value="${c.hi}"></div></div>
        <button class="btn primary" data-a="cxSave">Speichern</button></div>`;
    }
  };
  function wStep(ex) { const o = E.loadOptions(ex, st.active.loc, P()); if (o && o.length > 1) { let m = Infinity; for (let i = 1; i < o.length; i++) m = Math.min(m, o[i] - o[i - 1]); return isFinite(m) && m > 0 ? m : 2.5; } return ex.kind === 'bw' ? 2.5 : 1; }
  function findSlot(entry) { const p = plan(); if (!p || !entry.slotId) return null; for (const d of p.days) for (const s of d.slots) if (s.id === entry.slotId) return s; return null; }

  /* ================= Aktionen ================= */
  const A = {
    homeFilter(t) { st.homeFilter = t.dataset.k; render(); },
    dayOpen(t) { openSheet({ type: 'day', i: +t.dataset.i }); },
    dayLoc(t) { st.sheet.loc = t.dataset.l; st.homeLoc = t.dataset.l; renderSheet(); render(); },
    progGo(t) { st.tab = 'fortschritt'; st.progSeg = t.dataset.k; render(); window.scrollTo(0, 0); },
    libTab(t) { st.libTab = t.dataset.k; render(); },
    libFilter(t) { openSheet({ type: 'filter', k: t.dataset.k }); },
    filterPick(t) { const k = st.sheet.k; const v = t.dataset.v; st.libF = Object.assign({}, st.libF, { [k]: v === '' ? null : (k === 'lvl' ? +v : v) }); closeSheet(); render(); },
    libAvailT() { st.libAvail = !st.libAvail; render(); },
    libReset() { st.libF = {}; render(); },
    manualRest() { const ci = curIndex(); const e = ci >= 0 ? st.active.exercises[ci] : null; st.rest = { end: Date.now() + (e ? e.presc.rest : 90) * 1000, total: e ? e.presc.rest : 90, label: '' }; renderRest(); },
    doneCur() { const ci = curIndex(); if (ci >= 0) A.doneSet({ dataset: { i: ci } }); },
    noteOpen(t) { openSheet({ type: 'note', i: +t.dataset.i }); setTimeout(() => { const n = $('#noteText'); if (n) n.focus(); }, 80); },
    plates(t) { const e = st.active.exercises[+t.dataset.i]; const S = exState(e); openSheet({ type: 'plates', w: (e.draft && e.draft.w) ?? S.rec.w ?? 60, bar: 20 }); },
    plateStep(t) { st.sheet.w = Math.max(0, (st.sheet.w || 0) + +t.dataset.d); renderSheet(); },
    plateBar(t) { st.sheet.bar = +t.dataset.b; renderSheet(); },
    tab(t) { st.tab = t.dataset.k; if (st.ov && st.ov.type === 'workout') st.ov = null; render(); window.scrollTo(0, 0); },
    scrim(t, e) { if (e.target === t) closeSheet(); },
    closeSheet() { closeSheet(); },
    closeSheetRender() { closeSheet(); Store.saveActive(); render(); },
    settings() { openSheet({ type: 'settings' }); },
    quizStart() { st.ov = { type: 'quiz', i: 0, answers: { location: 'both', homeEq: ['bar', 'rings', 'db', 'cable'], skills: [], priority: [], injuries: [] } }; render(); focusQuizInput(); },
    quizEdit() { closeSheet(); st.ov = { type: 'quiz', i: 0, answers: clone(P().answers || {}) }; render(); },
    quickStart() {
      const answers = { name: '', sex: 'm', age: 30, bw: 80, exp: 'some', goal: 'muscle', skills: ['pullup', 'mu'], location: 'both', homeEq: ['bar', 'rings', 'db', 'cable', 'bench'], dbSetup: { count: 1, type: 'fixed', list: [12.5] }, cableSetup: { min: 5, max: 50, step: 5 }, addw: 'yes', days: '4', duration: '60', split: 'auto', pullups: '5', pushups: '22', dips: '9', legs: '1', core: '3', priority: ['Rücken', 'Arme'], injuries: [], intensity: 'hard', sleep: '7', stress: 'mid', finisher: 'no' };
      st.ov = { type: 'quiz', i: 0, answers }; st.ov.i = quizSteps(answers).length - 1; quizNext();
      toast('Beispielprofil geladen. Im Plan unter „Fragebogen bearbeiten“ an dich anpassen.', 4500);
    },
    qOpt(t) {
      const qz = st.ov; const q = E.Q.find(x => x.id === t.dataset.q); const k = t.dataset.k;
      if (q.type === 'multi') { const arr = qz.answers[q.id] = qz.answers[q.id] || []; const i = arr.indexOf(k); if (i >= 0) arr.splice(i, 1); else if (!q.max || arr.length < q.max) arr.push(k); renderOverlay(); }
      else { qz.answers[q.id] = k; renderOverlay(); setTimeout(quizNext, 170); }
    },
    qNext() { quizNext(); },
    qBack() { const qz = st.ov; if (qz.i === 0) { st.ov = null; render(); } else { qz.i--; renderOverlay(); } },
    dbSet(t) { const d = st.ov.answers.dbSetup; d[t.dataset.k] = t.dataset.k === 'count' ? +t.dataset.v : t.dataset.v; renderOverlay(); },
    resultLoc(t) { st.ov.loc = t.dataset.l; renderOverlay(); },
    resultBack() { const ans = st.ov.prof.answers; st.ov = { type: 'quiz', i: quizSteps(ans).length - 1, answers: ans }; renderOverlay(); },
    reroll() { const r = st.ov; r.prof.answers._seed = (r.prof.answers._seed || 0) + 1; const pl = E.buildPlan(r.prof); // leichte Variation
      for (const d of pl.days) for (const loc of pl.locs) { for (const sl of d.slots) if (sl.r !== 'main' && sl.r !== 'skill') { const alts = E.alternatives(sl, loc, r.prof, d.slots.map(x => x.ex[loc])).filter(x => x.ex.pat === (getEx(sl.ex[loc]) || {}).pat); const pick = alts[(r.prof.answers._seed) % Math.max(1, Math.min(3, alts.length))]; if (pick) { sl.ex[loc] = pick.ex.id; sl.why[loc] = pick.reasons; } } }
      r.plan = pl; renderOverlay(); toast('Neue Auswahl erstellt'); },
    acceptPlan() {
      const r = st.ov; const prof = r.prof; const old = plan();
      if (old && old.meso) r.plan.meso = old.meso;
      prof.plan = r.plan; st.profile = prof; registerCustom();
      Store.saveProfile(true); st.ov = null; st.tab = 'heute'; render(); toast('Plan gespeichert. Viel Erfolg!');
    },
    homeLoc(t) { st.homeLoc = t.dataset.l; render(); },
    homeDay(t) { st.homeDay = +t.dataset.i; render(); },
    planLoc(t) { st.planLoc = t.dataset.l; render(); },
    startWorkout(t) { st.sheet = null; renderSheet(); if (st.active) { openWorkout(); return; } startWorkout(+t.dataset.d, t.dataset.l); },
    freeWorkout() { if (st.active) { openWorkout(); return; } st.active = { id: uid(), dayIdx: null, name: 'Freies Training', loc: st.homeLoc || defLoc(), start: Date.now(), bw: E.bodyweight(P()), exercises: [], cur: 0 }; Store.saveActive(true); openWorkout(); openSheet({ type: 'pick', mode: 'workout', q: '' }); },
    resume() { openWorkout(); },
    wMin() { st.ov = null; keepAwake(false); render(); },
    focusEx(t) { st.active.cur = +t.dataset.i; renderOverlay(); },
    doneSet(t) {
      const i = +t.dataset.i; const entry = st.active.exercises[i]; const ex = getEx(entry.exId); const S = exState(entry);
      const d = entry.draft || {};
      const vals = { w: d.w ?? S.rec.w, reps: d.reps ?? S.rec.reps, sec: d.sec ?? S.rec.sec };
      if (ex.kind === 'int') { commitSet(i, vals, 2); return; }
      if (st.rest) { st.rest = null; renderRest(); }
      openSheet({ type: 'rir', i, vals });
    },
    rirStep(t) { const s = st.sheet; const f = t.dataset.f; s.vals[f] = Math.max(0, Math.round(((s.vals[f] || 0) + +t.dataset.d) * 100) / 100); const inp = $('#rs-' + f); if (inp) inp.value = fmt(s.vals[f]); },
    rirPick(t) { const s = st.sheet; commitSet(s.i, s.vals, +t.dataset.r); },
    editSet(t) { openSheet({ type: 'editSet', i: +t.dataset.i, s: +t.dataset.s }); },
    delSet() { st.sheet.confirm = true; renderSheet(); },
    delSetYes() { const s = st.sheet; const entry = st.active.exercises[s.i]; const doneSets = entry.sets.filter(x => x.done); const target = doneSets[s.s]; entry.sets = entry.sets.filter(x => x !== target); Store.saveActive(); closeSheet(); render(); },
    setPlus(t) { const e = st.active.exercises[+t.dataset.i]; e.extra = (e.extra || 0) + 1; if (exState(e).rec.stop) e.ignoreStop = true; st.active.cur = +t.dataset.i; Store.saveActive(); renderOverlay(); },
    setMinus(t) { const e = st.active.exercises[+t.dataset.i]; e.extra = (e.extra || 0) - 1; Store.saveActive(); renderOverlay(); },
    ignoreStop(t) { st.active.exercises[+t.dataset.i].ignoreStop = true; Store.saveActive(); renderOverlay(); },
    switchEx(t) { doSwapWorkout(+t.dataset.i, t.dataset.id, false); },
    swapWorkout(t) { openSheet({ type: 'swapWorkout', i: +t.dataset.i, plan: false }); },
    swapPlanToggle(t) { st.sheet.plan = t.checked; },
    swapDo(t) { doSwapWorkout(st.sheet.i, t.dataset.id, st.sheet.plan); },
    exMenu(t) { openSheet({ type: 'exMenu', i: +t.dataset.i }); },
    exMove(t) { const a = st.active; const i = +t.dataset.i, j = i + +t.dataset.dir; if (j < 0 || j >= a.exercises.length) return; [a.exercises[i], a.exercises[j]] = [a.exercises[j], a.exercises[i]]; a.cur = j; Store.saveActive(); closeSheet(); renderOverlay(); },
    exRemove() { st.sheet.confirm = true; renderSheet(); },
    exRemoveYes(t) { st.active.exercises.splice(+t.dataset.i, 1); st.active.cur = null; Store.saveActive(); closeSheet(); renderOverlay(); },
    holdStart(t) { const e = st.active.exercises[+t.dataset.i]; st.hold = { i: +t.dataset.i, start: Date.now(), name: getEx(e.exId).name }; st.rest = null; beep(880, 0.12); renderRest(); },
    holdStop() { const h = st.hold; st.hold = null; const sec = Math.round((Date.now() - h.start) / 1000); const e = st.active.exercises[h.i]; e.draft = Object.assign({}, e.draft, { sec }); beep(660, 0.2); renderRest(); renderOverlay(); A.doneSet({ dataset: { i: h.i } }); },
    intStart(t) { const e = st.active.exercises[+t.dataset.i]; const S = exState(e); T.mode = 'interval'; T.iv = { work: S.presc.rr[0], rest: S.presc.rest || 20, rounds: S.planned - S.done.length }; T.ivRun = { start: Date.now() }; st.ov = null; st.tab = 'timer'; render(); toast('Intervall läuft. Danach im Training die Runden abhaken.'); },
    finishAsk() { openSheet({ type: 'finish' }); },
    finishSave() { finishWorkout(true); },
    finishDiscard() { st.sheet.confirm = true; renderSheet(); },
    finishDiscardYes() { finishWorkout(false); },
    exInfo(t) { openSheet({ type: 'exInfo', id: t.dataset.id }); },
    pickEx(t) { openSheet({ type: 'pick', mode: t.dataset.mode, d: t.dataset.d != null ? +t.dataset.d : null, s: t.dataset.s != null ? +t.dataset.s : null, i: t.dataset.i != null ? +t.dataset.i : null, q: '' }); setTimeout(() => { const q = $('#pickq'); if (q) q.focus(); }, 80); },
    pickAll(t) { st.sheet.all = t.checked; renderSheet(); },
    pickDo(t) {
      const s = st.sheet; const id = t.dataset.id; const ex = getEx(id);
      if (s.mode === 'workout') { addToWorkout(id); return; }
      if (s.mode === 'swapWorkout') { doSwapWorkout(s.i, id, false); return; }
      if (s.mode === 'plan') { addToPlan(s.d, id); return; }
      if (s.mode === 'slot') { const sl = plan().days[s.d].slots[s.s]; const loc = st.planLoc || defLoc(); sl.ex[loc] = id; sl.why[loc] = ['Von dir gewählt']; sl.locked = Object.assign({}, sl.locked, { [loc]: true }); Store.saveProfile(); closeSheet(); render(); toast(ex.name + ' im Plan'); }
    },
    addToWorkout(t) { addToWorkout(t.dataset.id); },
    addToPlanAsk(t) { openSheet({ type: 'addToPlan', id: t.dataset.id }); },
    addToPlanDo(t) { addToPlan(+t.dataset.d, t.dataset.id); },
    slotSheet(t) { openSheet({ type: 'slot', d: +t.dataset.d, s: +t.dataset.s }); },
    slotSwap(t) { const s = st.sheet; const sl = plan().days[s.d].slots[s.s]; const loc = st.planLoc || defLoc(); const alts = E.alternatives(sl, loc, P(), []); const a = alts.find(x => x.ex.id === t.dataset.id); sl.ex[loc] = t.dataset.id; sl.why[loc] = a ? a.reasons : []; sl.locked = Object.assign({}, sl.locked, { [loc]: true }); if (getEx(t.dataset.id).pat !== sl.p[0] && !sl.p.includes(getEx(t.dataset.id).pat)) sl.p = [getEx(t.dataset.id).pat, ...sl.p]; Store.saveProfile(); st.sheet.keepScroll = false; renderSheet(); render(); toast('Getauscht: ' + getEx(t.dataset.id).name); },
    slotMove(t) { const s = st.sheet; const d = plan().days[s.d]; const j = s.s + +t.dataset.dir; if (j < 0 || j >= d.slots.length) return; [d.slots[s.s], d.slots[j]] = [d.slots[j], d.slots[s.s]]; s.s = j; Store.saveProfile(); renderSheet(); render(); },
    slotDel() { st.sheet.confirm = true; renderSheet(); },
    slotDelYes() { const s = st.sheet; plan().days[s.d].slots.splice(s.s, 1); Store.saveProfile(); closeSheet(); render(); },
    deloadToggle() { const p = plan(); p.forceDeload = !p.forceDeload; if (!p.forceDeload) p.meso.start = E.todayISO(); Store.saveProfile(); render(); toast(p.forceDeload ? 'Deload aktiv: halbe Sätze, mehr Reserve' : 'Neuer Zyklus startet mit Woche 1'); },
    rebuildAsk() { openSheet({ type: 'rebuild' }); },
    rebuildYes() { const old = plan(); const np = E.buildPlan(P()); np.meso = old.meso; np.next = 0; P().plan = np; Store.saveProfile(true); closeSheet(); render(); toast('Plan neu berechnet'); },
    progSeg(t) { st.progSeg = t.dataset.k; render(); },
    chartTip(t) { const el = $('#chartTip', t.closest('.card, .sheet')) || $('#chartTip'); if (el) el.textContent = t.dataset.t; },
    wDetail(t) { openSheet({ type: 'wDetail', id: t.dataset.id }); },
    wDel() { st.sheet.confirm = true; renderSheet(); },
    wDelYes(t) { st.workouts = st.workouts.filter(w => w.id !== t.dataset.id); Store.deleteWorkout(t.dataset.id); closeSheet(); render(); toast('Training gelöscht'); },
    bwSheet() { openSheet({ type: 'bw' }); },
    bwStep(t) { const i = $('#bwIn'); i.value = fmt((num(i.value) || 0) + +t.dataset.d, 1); },
    bwSave() { const v = num($('#bwIn').value); if (!(v > 25 && v < 300)) { toast('Bitte ein Gewicht zwischen 25 und 300 kg eingeben'); return; } const log = P().bwLog = P().bwLog || []; const today = E.todayISO(); const ex = log.find(x => x.d === today); if (ex) ex.kg = v; else log.push({ d: today, kg: v }); log.sort((a, b) => a.d < b.d ? -1 : 1); Store.saveProfile(); closeSheet(); render(); toast('Gespeichert: ' + fmt(v, 1) + ' kg'); },
    bwDel(t) { P().bwLog.splice(+t.dataset.i, 1); Store.saveProfile(); render(); },
    libGroup(t) { st.libGroup = t.dataset.g; render(); },
    libAvail(t) { st.libAvail = t.checked; render(); },
    customEx() { openSheet({ type: 'custom' }); },
    cxMuscle(t) { const c = st.sheet.c; const k = t.dataset.k; const i = c.prim.indexOf(k); if (i >= 0) c.prim.splice(i, 1); else c.prim.push(k); renderSheet(); },
    cxEq(t) { const c = st.sheet.c; const k = t.dataset.k; const i = c.eq.indexOf(k); if (i >= 0) c.eq.splice(i, 1); else c.eq.push(k); if (!c.eq.length) c.eq = ['bw']; renderSheet(); },
    cxSave() {
      const c = st.sheet.c; if (!c.name.trim()) { toast('Bitte einen Namen eingeben'); return; } if (!c.prim.length) { toast('Bitte mindestens einen Muskel wählen'); return; }
      const ex = { id: 'c-' + uid(), custom: true, name: c.name.trim(), pat: c.pat, role: ['core'].includes(c.pat) ? 'k' : ['skill'].includes(c.pat) ? 's' : ['cond'].includes(c.pat) ? 'x' : ['vpull', 'hpull', 'vpush', 'hpush', 'dip', 'squat', 'lunge', 'hinge'].includes(c.pat) ? 'c' : 'i', kind: c.kind, eq: c.eq.length ? c.eq : ['bw'], prim: c.prim, sec: [], lvl: 2, rr: [+c.lo || 8, +c.hi || 12], d: 'Eigene Übung.', c: [], std: 0.3, bwf: c.kind === 'bw' ? 0.6 : undefined };
      P().custom = P().custom || []; P().custom.push(ex); registerCustom(); Store.saveProfile(); closeSheet(); render(); toast('Übung angelegt');
    },
    delCustom(t) { P().custom = (P().custom || []).filter(x => x.id !== t.dataset.id); Store.saveProfile(); closeSheet(); render(); },
    setFont(t) { P().settings = Object.assign(settings(), { font: t.dataset.k }); Store.saveProfile(); render(); },
    setToggle(t) { P().settings = Object.assign(settings(), { [t.dataset.k]: t.checked }); Store.saveProfile(); },
    exportData() { exportData(); },
    reset() { st.sheet.confirm = true; renderSheet(); },
    async resetYes() { for (const w of st.workouts) Store.deleteWorkout(w.id); st.workouts = []; st.active = null; st.profile = null; LS.set('profile', null); LS.set('workouts', []); Store.saveActive(true); if (Store.mode === 'db') Store.write('p', () => Store.pRef().delete()); closeSheet(); render(); toast('Alle Daten gelöscht'); },
    timerMode(t) { T.mode = t.dataset.k; render(); },
    restPreset(t) { T.restDur = +t.dataset.s; if (T.restEnd) T.restEnd = Date.now() + T.restDur * 1000; render(); },
    restToggle() { T.restEnd = T.restEnd ? null : Date.now() + (T.restDur || 90) * 1000; beep(880, 0.08); render(); },
    ivPreset(t) { const [w, r, n] = t.dataset.v.split(',').map(Number); T.iv = { work: w, rest: r, rounds: n }; render(); },
    ivStart() { T.ivRun = { start: Date.now() + 3000 }; lastBeep = {}; beep(700, 0.1); render(); toast('Start in 3 Sekunden'); },
    ivStop() { T.ivRun = null; render(); },
    swToggle() { const sw = T.sw; if (sw.start) { sw.acc += Date.now() - sw.start; sw.start = null; } else sw.start = Date.now(); render(); },
    swLap() { const sw = T.sw; sw.laps.unshift(sw.acc + (Date.now() - sw.start)); render(); },
    swReset() { T.sw = { start: null, acc: 0, laps: [] }; render(); },
    restAdj(t) { if (!st.rest) return; st.rest.end += +t.dataset.s * 1000; st.rest.total = Math.max(st.rest.total, (st.rest.end - Date.now()) / 1000); st.rest.fired = false; tickRest(Date.now()); },
    restSkip() { st.rest = null; renderRest(); }
  };
  function addToWorkout(id) {
    if (!st.active) return;
    st.active.exercises.push(newEntry(id, null)); st.active.cur = st.active.exercises.length - 1;
    Store.saveActive(); closeSheet(); if (!st.ov) openWorkout(); else renderOverlay();
    setTimeout(() => { const e = st.active.exercises[st.active.cur]; const el = document.getElementById('ex-' + e.key); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 60);
  }
  function addToPlan(di, id) {
    const ex = getEx(id); const day = plan().days[di]; const r = roleOfEx(ex);
    const sl = { id: 's' + uid(), p: [ex.pat], r, sets: r === 'iso' ? 3 : 3, rest: r === 'sec' ? 120 : r === 'iso' ? 75 : r === 'skill' ? 120 : 60, rr: null, ex: {}, why: {}, locked: {} };
    for (const l of locs()) { sl.ex[l] = id; sl.why[l] = ['Von dir hinzugefügt']; sl.locked[l] = true; }
    day.slots.push(sl); Store.saveProfile(); closeSheet(); render(); toast(ex.name + ' zu ' + day.name + ' hinzugefügt');
  }
  function doSwapWorkout(i, id, alsoPlan) {
    const e = st.active.exercises[i]; const ex = getEx(id);
    const slot = findSlot(e);
    if (e.sets.some(s => s.done)) { const n = newEntry(id, slot); st.active.exercises.splice(i + 1, 0, n); st.active.cur = i + 1; }
    else { e.exId = id; e.presc = E.prescription(slot, ex, P(), plan()); e.draft = null; }
    if (alsoPlan && slot) { slot.ex[st.active.loc] = id; slot.why[st.active.loc] = ['Von dir gewählt']; slot.locked = Object.assign({}, slot.locked, { [st.active.loc]: true }); Store.saveProfile(); }
    Store.saveActive(); closeSheet(); renderOverlay(); toast('Getauscht: ' + ex.name);
  }
  async function exportData() {
    const data = JSON.stringify({ app: 'satzwerk', version: 1, exported: new Date().toISOString(), profile: st.profile, workouts: st.workouts }, null, 1);
    const name = 'satzwerk-backup-' + E.todayISO() + '.json';
    try {
      const dl = window.claude && window.claude.use ? await window.claude.use('downloads') : null;
      if (dl) { await dl.save({ filename: name, data }); toast('Backup gespeichert'); return; }
    } catch (e) { if (e && e.code === 'declined') return; }
    try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); toast('Backup erstellt'); return; } catch (e) { }
    try { await navigator.clipboard.writeText(data); toast('Backup in die Zwischenablage kopiert'); } catch (e) { toast('Export hier nicht möglich'); }
  }
  function importData(file) {
    const r = new FileReader();
    r.onload = () => {
      try {
        const d = JSON.parse(r.result); if (d.app !== 'satzwerk' || !d.profile) throw new Error('bad');
        st.profile = d.profile; registerCustom(); Store.saveProfile(true);
        const have = new Set(st.workouts.map(w => w.id)); for (const w of d.workouts || []) if (!have.has(w.id)) { st.workouts.push(w); Store.saveWorkout(w); }
        st.workouts.sort((x, y) => (x.ts || 0) - (y.ts || 0)); closeSheet(); render(); toast('Backup importiert: ' + (d.workouts || []).length + ' Trainings');
      } catch (e) { toast('Diese Datei ist kein Satzwerk-Backup'); }
    };
    r.readAsText(file);
  }

  /* ================= Eingaben ================= */
  const IN = {
    noteText(t) { const e = st.active.exercises[st.sheet.i]; e.note = t.value; Store.saveActive(); },
    plateW(t) { const v = num(t.value); if (v != null) { st.sheet.w = v; const pos = t.selectionStart; renderSheet(); const n = $('#plateW'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) { } } } },
    libQ(t) { st.libQ = t.value; const pos = t.selectionStart; render(); const n = $('#libq'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) { } } },
    chartEx(t) { st.chartEx = t.value; render(); },
    quiz(t) { const q = E.Q.find(x => x.id === t.dataset.q); const v = q.type === 'number' ? num(t.value) : t.value; st.ov.answers[q.id] = v; const b = $('[data-a="qNext"]'); if (b) b.disabled = !(q.optional || (v != null && v !== '')); },
    dbList(t) { st.ov.answers.dbSetup.list = t.value.split(/[\s;]+/).map(num).filter(x => x > 0); },
    dbNum(t) { st.ov.answers.dbSetup[t.dataset.k] = num(t.value); },
    cableNum(t) { st.ov.answers.cableSetup[t.dataset.k] = num(t.value); },
    draft(t) { const e = st.active.exercises[+t.dataset.i]; e.draft = Object.assign({}, e.draft, { [t.dataset.f]: num(t.value) }); Store.saveActive(); },
    rirVal(t) { st.sheet.vals[t.dataset.f] = num(t.value); },
    editSet(t) { const s = st.sheet; const entry = st.active.exercises[s.i]; const set = entry.sets.filter(x => x.done)[s.s]; set[t.dataset.k] = num(t.value) ?? 0; },
    slot(t) { const s = st.sheet; const sl = plan().days[s.d].slots[s.s]; const v = num(t.value); if (v == null) return; const k = t.dataset.k;
      if (k === 'sets') sl.sets = Math.max(1, Math.min(10, Math.round(v))); else if (k === 'rest') sl.rest = Math.max(15, Math.min(600, Math.round(v)));
      else { const ex = getEx(sl.ex[st.planLoc || defLoc()]); const cur = sl.custRR || E.prescription(sl, ex, P(), plan()).rr; const rr = [...cur]; rr[k === 'lo' ? 0 : 1] = Math.max(1, Math.round(v)); if (rr[1] >= rr[0]) sl.custRR = rr; }
      Store.saveProfile(); render(); },
    pickQ(t) { st.sheet.q = t.value; const pos = t.selectionStart; renderSheet(); const n = $('#pickq'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) { } } },
    iv(t) { T.iv[t.dataset.k] = Math.max(0, Math.round(num(t.value) || 0)); },
    setNum(t) { P().settings = Object.assign(settings(), { [t.dataset.k]: num(t.value) }); Store.saveProfile(); },
    importFile(t) { if (t.files && t.files[0]) importData(t.files[0]); },
    cx(t) { const c = st.sheet.c; c[t.dataset.k] = t.value; if (t.dataset.k === 'kind') renderSheet(); }
  };

  document.addEventListener('click', e => {
    const t = e.target.closest('[data-a]'); if (!t) return;
    if (t.tagName === 'INPUT' && t.type === 'checkbox') { /* Checkbox: Aktion nach Zustandswechsel */ }
    const fn = A[t.dataset.a]; if (!fn) return;
    if (t.dataset.a === 'scrim' && e.target !== t) return;
    if (!actx && settings().sound) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (err) { } }
    fn(t, e);
  });
  document.addEventListener('input', e => { const t = e.target; if (t.dataset && t.dataset.in && IN[t.dataset.in] && t.type !== 'file' && t.tagName !== 'SELECT') IN[t.dataset.in](t); });
  document.addEventListener('change', e => { const t = e.target; if (t.dataset && t.dataset.in && IN[t.dataset.in] && (t.type === 'file' || t.tagName === 'SELECT')) IN[t.dataset.in](t); });
  // Fenster nach unten wischen zum Schließen
  let drag = null;
  document.addEventListener('touchstart', e => {
    const sh = e.target.closest && e.target.closest('.sheet'); if (!sh) return;
    const onTop = e.target.closest('.sheettop');
    if (sh.scrollTop > 0 && !onTop) return;
    if (e.target.closest('input,textarea,select')) return;
    drag = { sh, y0: e.touches[0].clientY, dy: 0, top: !!onTop };
  }, { passive: true });
  document.addEventListener('touchmove', e => {
    if (!drag) return;
    const dy = e.touches[0].clientY - drag.y0;
    if (dy <= 0 || (!drag.top && drag.sh.scrollTop > 0)) { drag.dy = 0; drag.sh.style.transform = ''; return; }
    drag.dy = dy; drag.sh.style.transition = 'none'; drag.sh.style.transform = `translateY(${dy}px)`;
  }, { passive: true });
  document.addEventListener('touchend', () => {
    if (!drag) return; const d = drag; drag = null;
    if (d.dy > 90) { d.sh.style.transition = 'transform .18s ease-in'; d.sh.style.transform = 'translateY(100%)'; setTimeout(closeSheet, 170); }
    else { d.sh.style.transition = 'transform .2s ease-out'; d.sh.style.transform = ''; }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && st.sheet) closeSheet();
    if (e.key === 'Enter' && st.ov && st.ov.type === 'quiz' && e.target.tagName === 'INPUT') { const b = $('[data-a="qNext"]'); if (b && !b.disabled) quizNext(); }
  });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && st.ov && st.ov.type === 'workout') keepAwake(true); });

  setInterval(() => {
    timerTick();
  }, 250);

  /* ================= Start ================= */
  (async function boot() {
    await Store.init();
    registerCustom();
    if (st.profile && st.profile.plan && st.profile.answers && (st.profile.plan.v || 1) < E.PLAN_VERSION) {
      const old = st.profile.plan; const np = E.buildPlan(st.profile);
      np.meso = old.meso || np.meso; np.next = (old.next || 0) % np.days.length; np.forceDeload = old.forceDeload;
      st.profile.plan = np; Store.saveProfile(true);
      setTimeout(() => toast('Plan aktualisiert: jetzt 5–7 Übungen pro Einheit', 4000), 400);
    }
    if (st.profile && st.profile.plan && st.active) toast('Dein Training läuft noch: tippe auf „Weiter trainieren“', 3500);
    render();
  })();
})();
