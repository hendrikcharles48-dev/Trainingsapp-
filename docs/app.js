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
  const APP_VERSION = '3.7.0';
  // Kurz verzögert ausführen (z. B. Suchfelder), damit beim Tippen nichts flackert
  const later = (key, ms, fn) => { clearTimeout(later[key]); later[key] = setTimeout(fn, ms); };

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
    // Kaputter Inhalt wird nie stillschweigend überschrieben: Rohtext nach satzwerk.corrupt.<k> retten
    get(k) {
      let v = null; try { v = localStorage.getItem('satzwerk.' + k); } catch (e) { return null; }
      if (!v) return null;
      try { return JSON.parse(v); } catch (e) { try { localStorage.setItem('satzwerk.corrupt.' + k, v); } catch (e2) { } st.corrupt = true; return null; }
    },
    set(k, v) {
      try { localStorage.setItem('satzwerk.' + k, JSON.stringify(v)); if (st.saveErr) { st.saveErr = false; renderSaveErr(); } return true; }
      catch (e) { if (!st.saveErr) { st.saveErr = true; renderSaveErr(); } return false; }
    }
  };
  /* ================= Sicherungen (IndexedDB „satzwerk“, Speicher „snap“) ================= */
  const SNAP_LBL = { training: 'Nach Training', 'vor-import': 'Vor Import', 'vor-reset': 'Vor „Alle Daten löschen“', 'vor-plan': 'Vor Plan-Neuberechnung', 'vor-update': 'Vor automatischem Plan-Update', 'vor-restore': 'Vor Wiederherstellen', 'vor-loeschen': 'Vor Löschen eines Trainings', 'vor-plaene': 'Vor Umstellung auf mehrere Pläne', 'vor-planloeschen': 'Vor Löschen eines Plans', manuell: 'Von Hand' };
  const Backup = {
    p: null,
    open() {
      if (!this.p) {
        this.p = new Promise((res, rej) => {
          if (!window.indexedDB) return rej(new Error('kein IndexedDB'));
          const r = indexedDB.open('satzwerk', 1);
          r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains('snap')) r.result.createObjectStore('snap', { keyPath: 'id' }); };
          r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
        });
        this.p.catch(() => { this.p = null; });
      }
      return this.p;
    },
    req(mode, fn) { return this.open().then(db => new Promise((res, rej) => { const t = db.transaction('snap', mode); const r = fn(t.objectStore('snap')); t.oncomplete = () => res(r && r.result); t.onerror = () => rej(t.error); })); },
    async list() { try { return ((await this.req('readonly', s => s.getAll())) || []).sort((a, b) => b.id - a.id); } catch (e) { return []; } },
    async get(id) { try { return await this.req('readonly', s => s.get(id)); } catch (e) { return null; } },
    // Kopie wird sofort (synchron) gezogen, gespeichert wird danach im Hintergrund
    snapshot(reason) {
      if (!st.profile && !st.workouts.length) return Promise.resolve();
      const rec = { id: Date.now() + Math.random(), ts: Date.now(), reason, version: APP_VERSION, profile: clone(st.profile), workouts: clone(st.workouts), active: clone(st.active) };
      return this.req('readwrite', s => s.put(rec)).then(() => this.prune()).catch(() => { });
    },
    async prune() {
      const all = await this.list(); const keep = new Set(all.slice(0, 8).map(x => x.id)); const seen = new Set();
      for (const x of all) if (x.reason !== 'training' && !seen.has(x.reason)) { seen.add(x.reason); keep.add(x.id); }
      const del = all.filter(x => !keep.has(x.id)); if (del.length) await this.req('readwrite', s => { for (const x of del) s.delete(x.id); });
    }
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
    wv: 0,
    saveWorkout(w) {
      this.wv++;
      LS.set('workouts', st.workouts);
      if (this.mode === 'db') this.write('w' + w.id, () => this.wCol().doc(w.id).set(clone(w)));
    },
    deleteWorkout(id) {
      this.wv++;
      LS.set('workouts', st.workouts);
      if (this.mode === 'db') this.write('w' + id, () => this.wCol().doc(id).delete());
    }
  };

  /* ================= Mehrere Pläne =================
     profile.plans = alle Pläne, profile.planId = aktiver Plan, profile.plan = derselbe Plan (Spiegel, damit
     alter Code, alte Backups und ältere App-Versionen weiter funktionieren). */
  function normalizePlans() {
    const p = st.profile; if (!p) return;
    let changed = false;
    if (p.plan && !Array.isArray(p.plans)) {
      Backup.snapshot('vor-plaene');
      if (!p.plan.id) p.plan.id = 'p' + uid();
      p.plans = [p.plan]; changed = true;
    }
    if (!Array.isArray(p.plans)) return;
    if (p.plan) { // p.plan ist maßgeblich (nach dem Laden ein eigenes Objekt mit gleichem Inhalt)
      if (!p.plan.id) p.plan.id = 'p' + uid();
      const i = p.plans.findIndex(x => x.id === p.plan.id);
      if (i >= 0) p.plans[i] = p.plan; else { p.plans.push(p.plan); changed = true; }
      if (p.planId !== p.plan.id) { p.planId = p.plan.id; changed = true; }
    } else if (p.plans.length) { p.plan = p.plans.find(x => x.id === p.planId) || p.plans[0]; p.planId = p.plan.id; changed = true; }
    for (const x of p.plans) if (!x.name) { x.name = x.custom ? 'Eigener Plan' : (x.splitName || 'Plan'); changed = true; }
    if (changed) { const m = LS.get('meta') || {}; if ((m.schema || 1) < 2) LS.set('meta', Object.assign(m, { schema: 2 })); Store.saveProfile(true); }
  }
  // Empfohlene Pläne, an denen der Nutzer etwas geändert hat, werden nie mehr automatisch umgebaut
  function touchPlan() { const p = plan(); if (p && !p.custom) p.edited = true; }
  const autoPlan = p => p && !p.custom && !p.edited;
  function activatePlan(id) {
    const pr = P(); const np = (pr.plans || []).find(x => x.id === id); if (!np) return false;
    pr.plan = np; pr.planId = id; st.homeDay = null; Store.saveProfile(true); return true;
  }
  function emptyPlan(name, nDays) {
    const a = P().answers || {};
    return { v: E.PLAN_VERSION, id: 'p' + uid(), name, custom: true, created: new Date().toISOString(), split: 'custom', splitName: 'Eigener Plan', goal: a.goal || 'muscle',
      locs: locs(), days: Array.from({ length: nDays }, (_, i) => ({ id: 'd' + uid(), key: 'C', name: 'Tag ' + 'ABCDEF'[i], focus: 'full', slots: [] })), meso: { start: E.todayISO(), len: 5 }, next: 0, bal: true };
  }
  function lockAll(pl) { for (const d of pl.days) for (const sl of d.slots) { sl.locked = sl.locked || {}; for (const l of pl.locs || []) sl.locked[l] = true; } return pl; }
  function addPlan(np, activate) { const pr = P(); pr.plans = pr.plans || []; pr.plans.push(np); if (activate) { pr.plan = np; pr.planId = np.id; st.homeDay = null; } Store.saveProfile(true); }
  // Tagesreihenfolge geändert: derselbe Tag bleibt „als Nächstes dran“
  function keepNext(fn) {
    const p = plan(); const nd = p.days[(p.next || 0) % p.days.length]; const nid = nd && nd.id; const old = p.next || 0;
    fn(p);
    const i = p.days.findIndex(d => d.id === nid); p.next = i >= 0 ? i : Math.min(old, p.days.length - 1);
    st.homeDay = null; touchPlan(); Store.saveProfile();
  }

  /* ================= Hilfen ================= */
  const P = () => st.profile;
  const plan = () => st.profile && st.profile.plan;
  const settings = () => Object.assign({ sound: true, vib: true, autoRest: true, bbStep: 2.5, stackStep: 2.5, rpe: false }, (st.profile && st.profile.settings) || {});
  function getEx(id) { return D.byId[id] || ((P() && P().custom) || []).find(e => e.id === id) || null; }
  function registerCustom() { for (const c of (P() && P().custom) || []) D.byId[c.id] = c; }
  /* Eigene Übungen ↔ eingebaute Übungen: gleiche Wörter (ohne Füllwörter, Plural-Endungen) oder Alias = gleiche Übung */
  const STOP = new Set(['an', 'am', 'mit', 'der', 'die', 'das', 'den', 'auf', 'im', 'in', 'zur', 'zum', 'und', 'von', 'kh', 'lh']);
  function nameKey(n) {
    return String(n || '').toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, ' ').trim().split(' ')
      .filter(w => w && !STOP.has(w)).map(w => w.length > 4 ? w.replace(/(en|e|n|s)$/, '') : w).sort().join(' ');
  }
  function findBuiltin(name) {
    const k = nameKey(name); if (!k) return null;
    return D.list.find(e => nameKey(e.name) === k || (e.alias || []).some(a => nameKey(a) === k)) || null;
  }
  // Wenn ein Update eine eigene Übung als richtige Übung nachliefert: Verlauf, Plan und Favoriten übernehmen
  function upgradeCustom() {
    const pr = P(); if (!pr || !(pr.custom || []).length) return [];
    const done = [];
    for (const c of pr.custom.slice()) {
      const b = findBuiltin(c.name); if (!b) continue;
      const from = JSON.stringify(c.id), to = JSON.stringify(b.id);
      const swap = o => o == null ? o : JSON.parse(JSON.stringify(o).split(from).join(to));
      pr.plan = swap(pr.plan); pr.favs = swap(pr.favs);
      if (st.active) { st.active = swap(st.active); Store.saveActive(true); }
      st.workouts = st.workouts.map(w => { if (!JSON.stringify(w).includes(from)) return w; const nw = swap(w); Store.saveWorkout(nw); return nw; });
      pr.custom = pr.custom.filter(x => x.id !== c.id); delete D.byId[c.id];
      done.push(b.name);
    }
    if (done.length) Store.saveProfile(true);
    return done;
  }
  function customReport(ex) {
    return `Satzwerk – neue eigene Übung, bitte mit allen Daten einbauen:\nName: ${ex.name}\nBewegung: ${D.PATTERNS[ex.pat] || ex.pat}\nArt: ${ex.kind === 'load' ? 'mit Gewicht' : ex.kind === 'bw' ? 'Körpergewicht' : 'Halten'}\nMuskeln: ${ex.prim.map(m => D.MUSCLES[m]).join(', ') || '–'}\nGeräte: ${ex.eq.map(e => D.EQUIP[e]).join(', ')}\nZiel: ${ex.rr[0]}–${ex.rr[1]}`;
  }
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
  const isFav = id => ((P() && P().favs) || []).includes(id);
  const favMark = id => isFav(id) ? '<span style="color:var(--lime)">★</span> ' : '';
  const figSVG = (ex, o) => ex ? window.FIG.svg(ex, o) : '';
  const thumb = ex => `<div class="thumb">${figSVG(ex)}</div>`;
  // Hinweis, wenn eine Isolationsübung vor einer Grundübung für denselben Muskel steht
  // Diese Woche Mo–So: heute in Navy, Baseball als feste Termine, erledigte Trainings mit Haken
  function weekList(p) {
    const sow = E.startOfWeek(); const todayIdx = (new Date().getDay() + 6) % 7; const sport = new Set(P().sportDays || []);
    const LONG = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
    const rows = LONG.map((dn, i) => {
      const iso = E.todayISO(new Date(sow.getTime() + i * 864e5)); const ws = st.workouts.filter(w => w.date === iso);
      let what = ws.length ? `<span class="ell">${esc(ws.map(w => w.name).join(', '))}</span><i class="ok">${I.check}</i>` : '';
      if (!ws.length && i === todayIdx) what = `<span class="ell">${esc((p.days[nextDayIdx()] || {}).name || '')}</span><span class="tagx">heute</span>`;
      if (!ws.length && i !== todayIdx && i > todayIdx) what = '<span class="muted">–</span>';
      if (!ws.length && i < todayIdx) what = '<span class="muted">frei</span>';
      if (sport.has(i)) what = `<span class="ell">Baseball${ws.length ? ' + ' + esc(ws.map(w => w.name).join(', ')) : ''}</span><span class="tagx fix">fix</span>`;
      return `<div class="wkrow ${i === todayIdx ? 'today' : ''}"><b>${dn.slice(0, 2)}</b><div class="grow row" style="gap:8px;min-width:0">${what}</div></div>`;
    }).join('');
    return `<div class="card stack" style="gap:6px"><div class="row between"><div class="eyebrow">Diese Woche</div>${sport.size ? '' : '<button class="btn ghost sm" data-a="settings">Baseball-Tage</button>'}</div>${rows}</div>`;
  }
  function orderHint(day, loc) {
    const exs = day.slots.map(sl => ({ sl, ex: getEx(sl.ex[loc]) })).filter(x => x.ex);
    for (let i = 0; i < exs.length; i++) {
      if (!['iso', 'core'].includes(exs[i].sl.r)) continue;
      const m = new Set(exs[i].ex.prim);
      const later = exs.slice(i + 1).find(x => x.sl.r === 'main' && x.ex.prim.concat(x.ex.sec || []).some(z => m.has(z)));
      if (later) return `<div class="tiny muted" style="margin:-4px 0 6px">Tipp: „${esc(later.ex.name)}“ vor „${esc(exs[i].ex.name)}“ bringt mehr – Grundübung zuerst.</div>`;
    }
    return '';
  }
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
  // Verlauf je Übung zwischenspeichern; ungültig, sobald sich die Trainingsliste ändert
  let histCache = { ref: null, wv: -1, n: -1, m: {} };
  function histOf(exId) {
    const c = histCache;
    if (c.ref !== st.workouts || c.wv !== Store.wv || c.n !== st.workouts.length) histCache = { ref: st.workouts, wv: Store.wv, n: st.workouts.length, m: {} };
    const m = histCache.m; return m[exId] || (m[exId] = E.historyFor(exId, st.workouts));
  }
  function prevEntry(exId) { const h = histOf(exId); return h.length ? h[h.length - 1] : null; }
  const bandOf = k => (E.BANDS || []).find(b => b.k === k);
  const bandDot = k => { const b = bandOf(k); return b ? `<span class="bdot" style="background:${b.c}" title="Band ${b.n}"></span>` : ''; };
  const shortSet0 = (ex, s) => !s ? '–' : (ex.kind === 'hold' || ex.kind === 'int') ? fmt(s.sec) + ' s' : ex.kind === 'load' ? fmt(s.w) + '×' + fmt(s.reps) : ((s.w ? '+' + fmt(s.w) + '×' : '') + fmt(s.reps));
  const shortSet = (ex, s) => shortSet0(ex, s) + (s && s.band ? ' ' + bandDot(s.band) : '');
  // Band, das zuletzt bei dieser Übung benutzt wurde (letzter Satz der letzten Einheit)
  function lastBand(exId) { const h = histOf(exId); const l = h.length ? h[h.length - 1] : null; if (!l) return null; const ss = (l.entry.sets || []).filter(x => x.done !== false); return ss.length ? (ss[ss.length - 1].band || '') : null; }
  // act = { a: Aktion, l: Beschriftung } für einen Knopf im Hinweis (z. B. „Rückgängig“)
  function toast(msg, ms, act) { st.toast = msg; st.toastAct = act || null; renderToast(); clearTimeout(toast.t); toast.t = setTimeout(() => { st.toast = null; st.toastAct = null; renderToast(); }, ms || 2600); }

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
    document.documentElement.dataset.font = 'inter'; // eine Schrift (Inter); alte Schriftwahl wird ignoriert
    const app = $('#app');
    // Bei offenem Training/Fragebogen die Seite dahinter nicht neu bauen (spart Zeit nach jedem Satz)
    if (st.ov) { st.appDirty = true; renderLayer(); return; }
    st.appDirty = false;
    if (!P() || !P().plan) { app.innerHTML = welcomeView(); renderTabs(false); renderLayer(); return; }
    const v = { heute: homeView, plan: planView, uebungen: libView, fortschritt: progView, timer: timerView }[st.tab] || homeView;
    app.innerHTML = v();
    renderTabs(true); renderLayer();
  }
  function renderTabs(show) {
    let t = $('#tabs');
    if (!show) { if (t) t.remove(); return; }
    if (!t) { t = document.createElement('div'); t.id = 'tabs'; t.className = 'tabs'; document.body.appendChild(t); }
    const tabs = [['heute', 'Heute', I.home], ['plan', 'Plan', I.plan], ['fortschritt', 'Fortschritt', I.chart], ['uebungen', 'Übungen', I.dumbbell]];
    t.innerHTML = '<nav>' + tabs.map(([k, n, ic]) => `<button data-a="tab" data-k="${k}" aria-label="${n}" ${st.tab === k ? 'aria-current="page"' : ''}>${ic}<span>${n}</span></button>`).join('') + '</nav>';
  }
  function layerEl(id) { let el = document.getElementById(id); if (!el) { el = document.createElement('div'); el.id = id; $('#layer').appendChild(el); } return el; }
  function renderLayer() { renderOverlay(); renderSheet(); renderRest(); renderToast(); }
  function renderOverlay() {
    const el = layerEl('ov');
    if (!st.ov) { el.className = ''; el.innerHTML = ''; document.body.style.overflow = ''; return; }
    const html = { workout: workoutView, quiz: quizView, result: resultView }[st.ov.type]();
    const keep = el.scrollTop;
    // Die Fokus-Übung steht oben: wechselt sie, springt die Ansicht nach oben
    const fk = st.ov.type === 'workout' && st.active ? (st.active.exercises[curIndex()] || {}).key : st.ov.type + (st.ov.i ?? '');
    el.className = 'overlay'; el.innerHTML = '<div class="inner">' + html + '</div>'; el.scrollTop = fk === st.ovKey ? keep : 0; st.ovKey = fk;
    if (st.ov.type === 'workout') renderRest();
    document.body.style.overflow = 'hidden';
  }
  // Hintergrund sperren, solange ein Fenster offen ist (sonst scrollt iOS die Seite dahinter mit)
  let bgLock = null;
  function lockBg(on) {
    const b = document.body;
    if (on && !bgLock) {
      bgLock = { y: window.scrollY };
      document.documentElement.classList.add('sheet-open');
      Object.assign(b.style, { position: 'fixed', top: -bgLock.y + 'px', left: '0', right: '0', width: '100%' });
    } else if (!on && bgLock) {
      const y = bgLock.y; bgLock = null;
      document.documentElement.classList.remove('sheet-open');
      Object.assign(b.style, { position: '', top: '', left: '', right: '', width: '' });
      window.scrollTo(0, y);
    }
  }
  function renderSheet() {
    const el = layerEl('sh');
    lockBg(!!st.sheet && !!SHEETS[st.sheet.type]);
    if (!st.sheet) { el.innerHTML = ''; return; }
    const fn = SHEETS[st.sheet.type]; if (!fn) { st.sheet = null; el.innerHTML = ''; return; }
    const prev = el.querySelector('.sheet'); const keep = prev ? prev.scrollTop : 0;
    el.innerHTML = `<div class="scrim" data-a="scrim"><div class="sheet" role="dialog" aria-modal="true"><div class="sheettop"><div class="grab"></div><button class="sheetx" data-a="closeSheet" aria-label="Schließen">${I.x}</button></div>${fn(st.sheet)}</div></div>`;
    const s = el.querySelector('.sheet'); if (s && st.sheet.keepScroll) s.scrollTop = keep;
    st.sheet.keepScroll = true;
  }
  function renderSaveErr() {
    const el = layerEl('se');
    el.innerHTML = st.saveErr ? `<div class="saveerr" role="alert"><span>Speichern fehlgeschlagen – bitte jetzt ein Backup sichern.</span><button class="btn sm" data-a="exportData">Backup</button></div>` : '';
  }
  function renderToast() { const el = layerEl('ts'); el.innerHTML = st.toast ? `<div class="toast ${st.ov ? 'top' : ''}" role="status"><span>${esc(st.toast)}</span>${st.toastAct ? `<button class="tbtn" data-a="${st.toastAct.a}">${esc(st.toastAct.l)}</button>` : ''}</div>` : ''; }
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
    const sport = new Set(P().sportDays || []);
    const di = st.homeDay ?? nextDayIdx(); const day = p.days[di] || p.days[0];
    const loc = st.homeLoc || defLoc();
    const slots = day.slots.filter(s => s.ex[loc]);
    const setsPlan = slots.reduce((t, sl) => { const ex = getEx(sl.ex[loc]); return t + (ex ? E.prescription(sl, ex, P(), p).sets : 0); }, 0);
    const hx = heroEx(day, loc);
    const last = st.workouts[st.workouts.length - 1];
    const setsWeek = weekW.reduce((t, w) => t + w.exercises.reduce((u, e) => u + e.sets.length, 0), 0);
    const prsTotal = st.workouts.reduce((t, w) => t + ((w.prs || []).length), 0);
    const name = (a.name || '').trim();
    const dateTxt = new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
    const rec = recovery();
    const week = DAYS.map((d, i) => { const dt = new Date(sow.getTime() + i * 864e5); const cls = [i === todayIdx ? 'today' : '', doneDays.has(i) ? 'done' : '', sport.has(i) ? 'sport' : ''].join(' ');
      return `<div class="wd ${cls}"><span>${d}</span><b>${dt.getDate()}</b><i>${doneDays.has(i) ? I.check : sport.has(i) ? '<em></em>' : ''}</i></div>`; }).join('');
    const hero = st.active ? `<div class="card navy nextcard"><div class="nexttop"><div class="grow stack" style="gap:6px;min-width:0"><div class="eyebrow">Training läuft · ${durTxt((Date.now() - st.active.start) / 1000)}</div><h2 class="xl clamp2">${esc(st.active.name)}</h2><div class="small ink2">${st.active.exercises.reduce((t, e) => t + e.sets.filter(s => s.done).length, 0)} Sätze erledigt</div></div><div class="figtile hero">${figSVG(getEx((st.active.exercises[st.active.cur || 0] || {}).exId), { anim: 2.8 })}</div></div>
        <button class="btn primary big" data-a="resume">${I.play} Weiter trainieren</button></div>`
      : `<div class="card navy nextcard"><div class="nexttop"><div class="grow stack" style="gap:6px;min-width:0"><div class="eyebrow">${st.homeDay != null ? 'Ausgewählt' : 'Nächste Einheit'} · Woche ${wi.w}/${wi.len}${wi.deload ? ' · Deload' : ''}</div><h2 class="xl clamp2">${esc(day.name)}</h2><div class="small ink2 ell">${esc(dayFocus(day, loc))}</div></div><div class="figtile hero">${figSVG(hx, { anim: 2.8 })}</div></div>
        ${locs().length > 1 ? `<div class="seg onlight">${['home', 'gym'].map(l => `<button data-a="homeLoc" data-l="${l}" aria-pressed="${loc === l}">${LOCN[l]}</button>`).join('')}</div>` : ''}
        <div class="minis"><div><b>${slots.length}</b><span>Übungen</span></div><div><b>${setsPlan}</b><span>Sätze</span></div><div><b>${estMinutes(day, loc)}</b><span>Minuten</span></div></div>
        <button class="btn primary big" data-a="startWorkout" data-d="${di}" data-l="${loc}">Training starten</button></div>`;
    return `<div class="homebar"><div class="row"><div class="eyebrow grow ell">${dateTxt}</div><button class="iconbtn" data-a="tab" data-k="timer" aria-label="Timer">${I.timer}</button><button class="iconbtn" data-a="settings" aria-label="Einstellungen">${I.gear}</button></div><h1 class="ell">Moin${name ? ', ' + esc(name) : ''}</h1></div>
    <div class="stack">
      <div class="weekstrip" aria-label="Diese Woche">${week}</div>
      ${sport.size ? `<div class="legend"><span><i class="lg-done">${I.check}</i>erledigt</span><span><i class="lg-sport"></i>Baseball</span><span class="grow"></span><span>${weekW.length} von ${+a.days || p.days.length} Trainings</span></div>` : ''}
      ${hero}
      <div class="tiles3"><div><b>${weeksStreak()}</b><span>Wochen Serie</span></div><div><b>${setsWeek}</b><span>Sätze diese Woche</span></div><div><b>${prsTotal}</b><span>Rekorde</span></div></div>
      ${last ? `<div class="section"><div class="head"><h3>Zuletzt</h3><button class="btn ghost sm" data-a="progGo" data-k="history">Alle</button></div>${workoutRow(last)}</div>` : ''}
      ${checkinDue() ? checkinCard() : ''}${homeCards()}
      <div class="section"><div class="head"><h3>Deine Einheiten</h3><button class="btn ghost sm" data-a="tab" data-k="plan">Plan</button></div>
        <div class="list">${p.days.map((d, i) => { const n = d.slots.filter(s => s.ex[loc]).length; return `<button class="li" data-a="dayOpen" data-i="${i}">${thumb(heroEx(d, loc))}<div class="grow"><div class="ell" style="font-weight:700">${esc(d.name)}</div><div class="small muted ell">${n} Übungen · ${estMinutes(d, loc)} min${i === nextDayIdx() ? ' · als Nächstes' : ''}</div></div><span class="chev">${I.chev}</span></button>`; }).join('')}</div></div>
      <div class="card stack"><div class="row between"><h3>Erholung</h3><span class="small muted">Muskelgruppen</span></div>
        <div class="bars">${rec.map(r => `<div class="bar"><span class="ell">${r.g}</span><div class="track"><i class="${r.pct < 50 ? 'warn' : ''}" style="width:${r.pct}%"></i></div><span class="num small" style="text-align:right">${r.pct}%</span></div>`).join('')}</div>
        <div class="tiny muted">Geschätzt aus Sätzen und Zeit seit dem letzten Training. Voller Balken = bereit.</div></div>
      <button class="btn" data-a="freeWorkout">${I.plus} Freies Training</button>
      ${bwNudge()}
    </div>`;
  }
  function bwNudge() {
    const log = P().bwLog || []; const lastD = log.length ? log[log.length - 1].d : null;
    if (lastD && (Date.now() - new Date(lastD).getTime()) < 14 * 864e5) return '';
    return `<div class="card row"><div class="grow"><b>Körpergewicht aktuell?</b><div class="small muted">Klimmzüge, Dips & Co. werden damit berechnet. Aktuell: ${fmt(E.bodyweight(P()), 1)} kg</div></div><button class="btn sm" data-a="bwSheet">Eintragen</button></div>`;
  }
  function checkinDue() {
    if (!plan() || st.ciLater) return false;
    const sow = E.todayISO(E.startOfWeek());
    if ((P().checkins || []).some(c => c.week === sow)) return false;
    return st.workouts.some(w => w.date < sow);
  }
  function checkinCard() {
    return `<div class="card lav stack" style="gap:8px"><div class="row between"><b style="font-size:1.15em">Wochen-Check-in</b><span class="tag">1 Minute</span></div><div class="small" style="opacity:.8">7 kurze Fragen zu Erschöpfung, Muskelkater, Fitness und anderem Sport. Danach passe ich das Volumen dieser Woche an.</div><div class="row"><button class="btn dark grow" data-a="ciOpen">Jetzt ausfüllen</button><button class="btn" data-a="ciLater">Später</button></div></div>`;
  }
  function workoutRow(w) {
    const sets = w.exercises.reduce((t, e) => t + e.sets.length, 0);
    return `<button class="li card" data-a="wDetail" data-id="${w.id}">${thumb(getEx((w.exercises[0] || {}).exId))}<div class="grow"><div style="font-weight:800">${esc(w.name)}</div><div class="small muted">${dateDE(w.date)} · ${LOCN[w.loc] || ''} · ${durTxt(w.dur || 0)} · ${sets} Sätze${w.prs && w.prs.length ? ` · <span class="pr">${w.prs.length} Rekord${w.prs.length > 1 ? 'e' : ''}</span>` : ''}</div></div><span class="chev">${I.chev}</span></button>`;
  }

  /* ================= Plan ================= */
  function volumeCard(p, loc) {
    const v = E.planVolume(p, P(), loc); const T = v.targets;
    const freq = m => v.perDay.filter(dv => dv[m] >= 2).length;
    const once = Object.keys(T).filter(m => v.week[m] >= 4 && freq(m) === 1);
    const rows = Object.keys(T).map(m => { const val = Math.round(v.week[m] * 2) / 2, t = T[m]; const st_ = val < t - 2.5 ? 'low' : val > 15.5 ? 'high' : 'ok';
      const col = { low: 'var(--highlight)', ok: 'var(--lime)', high: 'var(--highlight)' }[st_];
      return `<div class="volrow"><span class="small">${D.MUSCLES[m]}</span><div class="volbar"><i style="width:${Math.min(100, val / 20 * 100)}%;background:${col}"></i><b style="left:${t / 20 * 100}%"></b><b class="cap" style="left:${15 / 20 * 100}%"></b></div><span class="small num" style="color:${col}">${fmt(val)}</span></div>`; }).join('');
    return `<div class="card stack" style="gap:10px"><div class="row between"><b>Sätze pro Muskel & Woche</b><span class="tiny muted">Strich = Ziel · rot ab 15</span></div>
      <div class="tiny muted">Effizienz-Prinzip: ~10 harte Sätze pro Muskel (Schwerpunkte ~14), 2× pro Woche, über 15 bringt kaum noch mehr. Mittrainierte Muskeln zählen halb.</div>
      <div class="stack" style="gap:6px">${rows}</div>
      ${once.length && p.days.length >= 3 ? `<div class="tiny" style="color:var(--highlight)">Nur an einem Tag trainiert: ${once.map(m => D.MUSCLES[m]).join(', ')} – besser auf zwei Tage verteilen.</div>` : ''}
      <button class="btn sm" style="align-self:flex-start" data-a="balanceNow">Plan ausbalancieren</button></div>`;
  }
  function planView() {
    const p = plan(); const loc = st.planLoc || defLoc(); const wi = E.weekInfo(p, P());
    const goalN = { muscle: 'Muskelaufbau', recomp: 'Fett weg & Muskeln', strength: 'Maximalkraft', skills: 'Calisthenics-Skills', fit: 'Fitness & Fettabbau', health: 'Gesund & beweglich' }[p.goal] || '';
    return `<div class="topbar"><h1>Plan</h1><button class="btn sm" data-a="plans" style="margin-left:auto;margin-right:8px">Pläne${(P().plans || []).length > 1 ? ' (' + P().plans.length + ')' : ''}</button><button class="iconbtn" data-a="settings" aria-label="Einstellungen">${I.gear}</button></div>
    <div class="stack">
      <div class="card lime rings-bg stack">
        <b style="font-size:19px">${esc(p.name || p.splitName)}</b>
        <div class="row wrap" style="gap:6px">${p.custom ? '<span class="tag">Eigener Plan</span>' : (p.name || '') !== p.splitName ? `<span class="tag">${esc(p.splitName)}</span>` : ''}<span class="tag">${p.days.length}× pro Woche</span><span class="tag">${goalN}</span></div>
        <div class="row between"><div><div class="eyebrow">Zyklus</div><h2>Woche ${wi.w} von ${wi.len} · ${wi.label}</h2></div>
        <button class="btn dark sm" data-a="deloadToggle">${p.forceDeload ? 'Deload beenden' : 'Deload jetzt'}</button></div>
        <div class="cycbar">${Array.from({ length: wi.len }, (_, k) => `<div class="${k + 1 === wi.w ? 'cur' : k + 1 < wi.w ? 'past' : ''}"><i></i><span>${k + 1 === wi.len ? 'Deload' : 'W' + (k + 1)}</span></div>`).join('')}</div>
        <div class="small" style="font-weight:700;opacity:.7">Erst locker, dann Aufbau, zuletzt am härtesten; in Woche ${wi.len} Deload mit halben Sätzen. Gezählt werden nur Wochen, in denen du trainiert hast.</div>
        <div class="row" style="gap:8px;align-items:center"><span class="small" style="font-weight:800">Deload alle</span><div class="seg" style="flex:1">${[4, 5, 6, 8].map(n => `<button data-a="mesoLen" data-n="${n}" aria-pressed="${wi.len === n}">${n}</button>`).join('')}</div><span class="small" style="font-weight:800">Wochen</span></div>
        ${(() => { const c = (P().checkins || []).slice(-1)[0]; const txt = { deload: 'Deload diese Woche', less: 'Weniger Volumen diese Woche', more: 'Mehr Volumen diese Woche', same: 'Volumen wie geplant' }; return c ? `<div class="small" style="font-weight:800">Letzter Check-in (${dateDE(c.week, { day: 'numeric', month: 'short' })}): ${txt[c.result] || ''}</div>` : ''; })()}
        <button class="btn dark sm" style="align-self:flex-start" data-a="ciOpen">Wochen-Check-in ausfüllen</button>
      </div>
      ${weekList(p)}
      ${locs().length > 1 ? `<div class="seg">${['home', 'gym'].map(l => `<button data-a="planLoc" data-l="${l}" aria-pressed="${loc === l}">${LOCN[l]}</button>`).join('')}</div>` : ''}
      ${p.days.map((d, di) => `<div class="section"><div class="head"><h2>${esc(d.name)}</h2><span class="small muted">${d.slots.filter(s => s.ex[loc]).length} Übungen · ≈ ${estMinutes(d, loc)} min</span><button class="iconbtn" data-a="dayEdit" data-d="${di}" aria-label="Tag bearbeiten" style="width:44px;height:44px;font-weight:900">⋯</button></div>${orderHint(d, loc)}
        <div class="list">${d.slots.map((sl, si) => { const ex = getEx(sl.ex[loc]); if (!ex) return `<div class="li"><div class="thumb"></div><div class="grow muted small">Keine passende Übung ${loc === 'home' ? 'zu Hause' : 'im Studio'}</div></div>`; const pr = E.prescription(sl, ex, P(), p);
          const SLp = ssLabels(d.slots);
          return `<button class="li ${SLp[si] ? 'ss' : ''}" data-a="slotSheet" data-drag="1" data-d="${di}" data-s="${si}">${thumb(ex)}<div class="grow"><div class="row" style="gap:6px"><span class="plate p-${sl.r}" style="width:20px;height:20px;font-size:10px">${ROLE[sl.r][0]}</span><b>${SLp[si] ? `<span class="sstag">${SLp[si]}</span>` : ''}${favMark(ex.id)}${esc(ex.name)}</b></div>${noteChip(ex.id)}<div class="small muted">${pr.sets} × ${rrText(pr.rr, ex)}${ex.uni ? ' pro Seite' : ''} · Pause ${sl.rest} s</div>${(sl.why && sl.why[loc] && sl.why[loc].length) ? `<div class="why" style="margin-top:4px">${sl.why[loc].slice(0, 2).map(w => `<span>${esc(w)}</span>`).join('')}</div>` : ''}</div><span class="chev">${I.chev}</span></button>`; }).join('')}
        <button class="li" data-a="pickEx" data-mode="plan" data-d="${di}" style="color:var(--lime);font-weight:800"><div class="thumb" style="display:grid;place-items:center">${I.plus.replace('<svg', '<svg width="22" height="22"')}</div> Übung hinzufügen</button></div></div>`).join('')}
      ${E.isCut(P(), p) ? `<details class="card flat small"><summary style="font-weight:800;cursor:pointer">So klappt „Fett weg & Muskeln“</summary><ul style="margin:8px 0 0;padding-left:18px">
        <li>Schwer trainieren bleibt das Signal für die Muskeln – Gewicht und Wdh. halten ist beim Abnehmen schon ein Erfolg.</li>
        <li>Viel Eiweiß: Richtwert 1,6–2,2 g pro kg Körpergewicht am Tag, über die Mahlzeiten verteilt.</li>
        <li>Mäßiges Defizit: etwa 0,5 % Körpergewicht pro Woche abnehmen; schneller kostet eher Muskeln.</li>
        <li>Genug Schlaf und viele Alltagsschritte helfen mehr als zusätzliche Sätze.</li>
        <li>Der Plan gibt im Defizit etwas weniger Zusatzvolumen vor, weil die Erholung knapper ist.</li></ul></details>` : ''}
      ${volumeCard(p, loc)}
      <button class="btn" data-a="dayAdd">${I.plus} Tag hinzufügen</button>
      <div class="card flat small" style="margin-bottom:10px">↕ <b>Tipp:</b> Übung kurz gedrückt halten und nach oben oder unten ziehen, um die Reihenfolge zu ändern.</div>
      <div class="card flat small"><div class="row wrap" style="gap:12px">${Object.keys(ROLE).map(r => `<span class="row" style="gap:6px">${plateHTML(r)} ${ROLE[r][1]}</span>`).join('')}</div><p class="muted tiny" style="margin:10px 0 0">Jede Einheit hat 5–7 Übungen: Grundübungen zuerst, dann Ergänzung, Isolation und Rumpf.</p></div>
      <div class="row wrap"><button class="btn grow" data-a="rebuildAsk">${p.custom ? 'Plan empfehlen lassen' : 'Plan neu berechnen'}</button><button class="btn grow" data-a="quizEdit">Fragebogen bearbeiten</button></div>
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
      && (!st.libAvail || st.libTab === 'fav' || E.available(ex, eqs)) && (st.libTab !== 'mine' || trained.has(ex.id)) && (st.libTab !== 'fav' || isFav(ex.id)))
      .sort((a, b) => a.pat.localeCompare(b.pat) || (a.rank || a.lvl) - (b.rank || b.lvl));
  }
  function libResults() {
    const list = libList(); const F = st.libF || {};
    const key = JSON.stringify([st.libQ, F, st.libAvail, st.libTab]);
    if (key !== st.libKey) { st.libKey = key; st.libMax = 40; }
    const max = st.libMax || 40;
    return `<div class="row between"><span class="small muted">${list.length} Übungen</span>${(F.lvl || F.group || F.pat || F.eq) ? '<button class="btn ghost sm" data-a="libReset">Filter zurücksetzen</button>' : ''}</div>
      ${list.length ? `${(() => { // nach Kategorie gruppiert, mit Überschrift
        const groups = []; for (const ex of list.slice(0, max)) { const g = groups[groups.length - 1]; if (g && g.pat === ex.pat) g.items.push(ex); else groups.push({ pat: ex.pat, items: [ex] }); }
        const row = ex => `<button class="exrow" data-a="exInfo" data-id="${ex.id}"><div class="figtile">${figSVG(ex)}</div><div class="grow"><b class="ell">${esc(ex.name)}</b><span class="ell">${ex.prim.map(m => D.MUSCLES[m]).join(', ')} · ${ex.eq.map(e => D.EQUIP[e]).join(' + ')}</span></div><div class="exmeta">${isFav(ex.id) ? `<span class="favdot" aria-label="Favorit">${I.check}</span>` : ''}${ex.lvl ? `<small class="lvlbar" aria-label="Schwierigkeit ${ex.lvl} von 5">${[1, 2, 3, 4, 5].map(k => `<i class="${k <= ex.lvl ? 'on' : ''}"></i>`).join('')}</small>` : ''}</div></button>`;
        return groups.map(g => `<div class="grouphead">${esc(D.PATTERNS[g.pat] || g.pat)}<span>${list.filter(x => x.pat === g.pat).length}</span></div><div class="exlist">${g.items.map(row).join('')}</div>`).join(''); })()}${list.length > max ? `<button class="btn" data-a="libMore">Mehr anzeigen (${list.length - max} weitere)</button>` : ''}` : `<div class="empty">${st.libTab === 'mine' ? 'Noch keine Übung trainiert.' : st.libTab === 'fav' ? 'Noch keine Favoriten. Öffne eine Übung und tippe auf den ★.' : 'Keine Übung gefunden.'}</div>`}`;
  }
  function libView() {
    const F = st.libF || {};
    const chip = (k, label, val) => `<button class="chip ${val ? 'set' : ''}" data-a="libFilter" data-k="${k}">${val ? esc(val) : label} ▾</button>`;
    return `<div class="topbar"><h1>Übungen</h1><button class="iconbtn" data-a="customEx" aria-label="Eigene Übung">${I.plus}</button></div>
    <div class="stack">
      <div class="toptabs"><button data-a="libTab" data-k="all" aria-pressed="${st.libTab !== 'mine' && st.libTab !== 'fav'}">Alle</button><button data-a="libTab" data-k="fav" aria-pressed="${st.libTab === 'fav'}">★ Favoriten</button><button data-a="libTab" data-k="mine" aria-pressed="${st.libTab === 'mine'}">Trainiert</button></div>
      ${st.libTab === 'fav' ? `<div class="card lime" style="padding:14px 16px"><b>Deine Lieblingsübungen</b><div class="small" style="opacity:.75">Mit ★ markierte Übungen gelten als „kann ich und vertrage ich“: Der Plan wählt sie bevorzugt, wenn die Ausrüstung da ist, sie an eine passende Stelle passen und höchstens 2 Stufen über deinem Level liegen. Maximal 2× pro Woche. Aufbau, Sätze und Volumen bestimmt weiter der Algorithmus.</div></div>` : ''}
      <label class="search">${I.search}<input id="libq" data-in="libQ" type="search" placeholder="Übungen suchen …" value="${esc(st.libQ)}" aria-label="Übungen suchen"></label>
      <div class="chips">${chip('lvl', 'Schwierigkeit', F.lvl && LVL[F.lvl - 1][1])}${chip('group', 'Muskelgruppe', F.group)}${chip('pat', 'Kategorie', F.pat && D.PATTERNS[F.pat])}${chip('eq', 'Ausrüstung', F.eq && D.EQUIP[F.eq])}<button class="chip ${st.libAvail ? 'on' : ''}" data-a="libAvailT">Meine Geräte</button></div>
      <div class="stack" id="libRes">${libResults()}</div>
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
    const sport = new Set(P().sportDays || []); const todayIso = E.todayISO(); const firstIso = st.workouts.length ? st.workouts[0].date : todayIso;
    let heat = ''; for (let i = 0; i < 84; i++) { const d = new Date(start.getTime() + i * 864e5); const iso = E.todayISO(d); const c = byDay[iso] || 0; const sp = !c && iso <= todayIso && iso >= firstIso && sport.has(i % 7); heat += `<span class="${c ? 'l2' : sp ? 'sp' : ''}${iso === todayIso ? ' td' : ''}" title="${dateDE(iso)}${c ? ': ' + c + ' Training' : sp ? ': Baseball' : ''}"></span>`; }
    const exWithHist = [...new Set(st.workouts.flatMap(w => w.exercises.map(e => e.exId)))].filter(id => getEx(id));
    if (!st.chartEx || !exWithHist.includes(st.chartEx)) st.chartEx = mostFrequent(exWithHist);
    if (!total) return `<div class="empty">Noch keine Trainings gespeichert. Nach deinem ersten Training siehst du hier Kraftkurven, Rekorde und Sätze pro Muskelgruppe.</div>`;
    return `<div class="kpis"><div class="kpi"><b>${total}</b><span>Trainings gesamt</span></div><div class="kpi"><b>${w7.length}</b><span>Letzte 7 Tage</span></div><div class="kpi"><b>${weeksStreak()}</b><span>Wochen am Stück</span></div></div>
      <div class="section"><div class="head"><h3>Kraftentwicklung</h3></div>
        <div class="chips">${exWithHist.slice().sort((x, y) => (x === st.chartEx ? -1 : y === st.chartEx ? 1 : 0)).slice(0, 14).map(id => `<button class="chip ${id === st.chartEx ? 'on' : ''}" data-a="chartPick" data-id="${id}">${esc(getEx(id).name)}</button>`).join('')}</div>
        <div class="card stack" style="gap:6px"><div class="eyebrow">Geschätztes Maximum (1 Wdh.)</div>${exChart(st.chartEx)}</div></div>
      ${(() => { const r = records().sort((x, y) => (y.date || '').localeCompare(x.date || '')).slice(0, 5); return r.length ? `<div class="section"><div class="head"><h3>Rekorde</h3><button class="btn ghost sm" data-a="progSeg" data-k="records">Alle</button></div><div class="list">${r.map(x => `<div class="li">${thumb(x.ex)}<div class="grow"><div class="ell" style="font-weight:700">${esc(x.ex.name)}</div><div class="small muted ell">${setTxt(x.ex, x.set)} · ${dateDE(x.date)}</div></div></div>`).join('')}</div></div>` : ''; })()}
      <div class="section"><div class="head"><h3>Sätze pro Muskelgruppe</h3><span class="small muted">letzte 7 Tage</span></div>
        <div class="card"><div class="bars">${Object.keys(gs).map(g => { const v = gs[g]; const lo = pri.includes(g) ? 14 : 10, hi = pri.includes(g) ? 22 : 20; return `<div class="bar"><span>${g}${pri.includes(g) ? ' ★' : ''}</span><div class="track"><span class="band" style="left:${lo / maxV * 100}%;width:${(hi - lo) / maxV * 100}%"></span><i style="width:${Math.min(100, v / maxV * 100)}%"></i></div><span class="num" style="text-align:right;font-size:17px">${fmt(v, 1)}</span></div>`; }).join('')}</div>
        <p class="tiny muted" style="margin:12px 0 0">Markierter Bereich = sinnvolle Wochensätze für Muskelaufbau (10–20, bei Priorität 14–22). Nebenmuskeln zählen halb. ${vol ? 'Bewegte Last: ' + fmt(Math.round(vol)) + ' kg.' : ''}</p></div></div>
      <div class="section"><div class="head"><h3>Trainingstage</h3><span class="small muted">12 Wochen</span></div><div class="card"><div class="heat" style="margin-bottom:6px">${DAYS.map(d => `<div class="tiny muted" style="text-align:center">${d}</div>`).join('')}</div><div class="heat">${heat}</div><div class="legend" style="margin-top:10px"><span><i class="lg-kraft"></i>Kraft</span>${sport.size ? '<span><i class="lg-sport"></i>Baseball</span>' : ''}</div></div></div>`;
  }
  function mostFrequent(ids) { const c = {}; for (const w of st.workouts) for (const e of w.exercises) c[e.exId] = (c[e.exId] || 0) + 1; return ids.sort((a, b) => (c[b] || 0) - (c[a] || 0))[0]; }
  function exSeries(exId) {
    const ex = getEx(exId); if (!ex) return [];
    return histOf(exId).map(h => ({ x: h.date, y: E.sessionBest(ex, h.entry, h.bw || E.bodyweight(P())) })).filter(p => p.y > 0);
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
    if (ex.kind === 'bw') return (s.w ? '+' + fmt(s.w) + ' kg × ' : '') + fmt(s.reps) + ' Wdh.' + (s.band ? ' (Band ' + (bandOf(s.band) || { n: s.band }).n + ')' : '');
    return fmt(s.w) + ' kg × ' + fmt(s.reps);
  }
  function progRecords() {
    const r = records(); if (!r.length) return '<div class="empty">Noch keine Rekorde.</div>';
    return `<div class="card tbl"><table><thead><tr><th>Übung</th><th>Bester Satz</th><th class="r">Leistung</th></tr></thead><tbody>${r.map(x => `<tr data-a="exInfo" data-id="${x.ex.id}" style="cursor:pointer"><td style="white-space:normal">${esc(x.ex.name)}<div class="tiny muted">${dateDE(x.date)}</div></td><td>${setTxt(x.ex, x.set)}</td><td class="r num" style="font-size:17px">${fmt(x.best, 1)} ${exUnit(x.ex)}</td></tr>`).join('')}</tbody></table></div>
      <p class="tiny muted">Leistung = geschätztes Maximum aus Gewicht, Wiederholungen und angegebener Reserve (Epley-Formel). So sind Sätze mit unterschiedlichen Wiederholungszahlen vergleichbar.</p>`;
  }
  // Gewichtstrend: Mittel der letzten 7 Tage gegen die 7 Tage davor, in % pro Woche
  function bwTrend(log) {
    const day = d => (Date.now() - new Date(d + 'T12:00:00').getTime()) / 864e5;
    const avg = xs => xs.length ? xs.reduce((t, x) => t + x.kg, 0) / xs.length : null;
    const a = avg(log.filter(x => day(x.d) < 7)), b = avg(log.filter(x => day(x.d) >= 7 && day(x.d) < 14));
    if (a == null || b == null) return '';
    const pct = (a - b) / b * 100; const weeks = log.length ? day(log[0].d) / 7 : 0;
    let hint = '', col = 'var(--ink)';
    if (E.isCut(P(), plan()) && weeks >= 3) {
      if (pct < -1) { hint = 'Zu schnell – da gehen leicht Muskeln mit. Etwas mehr essen.'; col = 'var(--highlight)'; }
      else if (pct <= -0.25 && pct >= -0.75) { hint = 'Genau im Zielkorridor (−0,25 bis −0,75 % pro Woche).'; col = 'var(--lime)'; }
      else if (pct > -0.1) { hint = 'Kaum Bewegung – ein kleines Defizit mehr hilft.'; col = 'var(--highlight)'; }
    }
    return `<div class="card stack" style="gap:4px"><div class="eyebrow">Trend (7-Tage-Schnitt)</div><div class="num" style="font-size:28px;font-weight:700;color:${col}">${pct > 0 ? '+' : '−'}${fmt(Math.abs(pct), 2)} % pro Woche</div><div class="small muted">${fmt(a, 1)} kg gegenüber ${fmt(b, 1)} kg in der Woche davor.${hint ? ' ' + hint : ''}</div></div>`;
  }
  function progBody() {
    const log = P().bwLog || [];
    const pts = log.map(x => ({ x: x.d, y: x.kg }));
    const trend = bwTrend(log.slice().sort((x, y) => x.d < y.d ? -1 : 1));
    return `<div class="card stack"><div class="row between"><div><div class="eyebrow">Körpergewicht</div><div class="num" style="font-size:36px;font-weight:700">${fmt(E.bodyweight(P()), 1)} kg</div></div><button class="btn primary" data-a="bwSheet">Eintragen</button></div>
      ${pts.length >= 2 ? lineChart(pts, 'kg') : '<div class="small muted">Trage dein Gewicht regelmäßig ein, dann erscheint hier der Verlauf. Die App nutzt immer den neuesten Wert für Körpergewichtsübungen.</div>'}</div>
      ${trend || (log.length ? '<div class="tiny muted">Den Trend gibt es, sobald du in zwei aufeinanderfolgenden Wochen gewogen hast. Am besten morgens, mehrmals pro Woche.</div>' : '')}
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
      return `<div class="bigtimer">${mmss(left)}</div>${T.restEnd ? `<div class="restof">von ${mmss(T.restDur || 90)} Pause</div>` : ''}
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
  function startRest(sec, label) { if (!settings().autoRest) return; st.rest = { end: Date.now() + sec * 1000, total: sec, len: sec, label: label || '' }; renderRest(); }
  // Pause und Halte-Timer im laufenden Training mitspeichern (übersteht Neuladen durch iOS)
  function syncTimers() {
    const a = st.active; if (!a) return;
    const r = st.rest && !st.rest.fired ? { end: st.rest.end, total: st.rest.total, len: st.rest.len, label: st.rest.label || '' } : null;
    const h = st.hold ? { i: st.hold.i, start: st.hold.start, name: st.hold.name } : null;
    if (JSON.stringify([r, h]) === JSON.stringify([a.rest || null, a.hold || null])) return;
    a.rest = r; a.hold = h; Store.saveActive();
  }
  function restoreTimers() {
    const a = st.active; if (!a) return;
    const now = Date.now();
    if (a.rest && !st.rest) { if (a.rest.end > now - 4000) st.rest = Object.assign({}, a.rest); else { toast('Pause seit ' + mmss((now - a.rest.end) / 1000) + ' vorbei'); a.rest = null; } }
    if (a.hold && !st.hold) st.hold = Object.assign({}, a.hold);
  }
  function toFocus() { const o = document.getElementById('ov'); if (o) o.scrollTop = 0; }
  function renderRest() {
    const el = layerEl('rb');
    syncTimers();
    if (!st.ov || st.ov.type !== 'workout' || !st.active) { el.innerHTML = st.hold ? holdPanel() : ''; return; }
    if (st.hold) { el.innerHTML = holdPanel(); return; }
    const a = st.active; const ci = curIndex(); const S = ci >= 0 ? exState(a.exercises[ci]) : null;
    const left = st.rest ? (st.rest.end - Date.now()) / 1000 : 0;
    const resting = st.rest && left > -4;
    if (resting) {
      const C = 2 * Math.PI * 52, fr = Math.max(0, Math.min(1, left / (st.rest.total || 1)));
      const nx = S ? `${esc(S.ex.name)}` : 'Training beenden';
      const nd = S ? `Satz ${Math.min(S.done.length + 1, S.planned)} von ${S.planned} · ${S.ex.kind === 'hold' || S.ex.kind === 'int' ? fmt(S.rec.sec) + ' s' : (S.rec.w ? fmt(S.rec.w) + ' kg × ' : '') + fmt(S.rec.reps) + ' Wdh.'}` : '';
      el.innerHTML = `<div class="panel resting"><div class="restrow"><div class="ring"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="rtrack" cx="60" cy="60" r="52"/><circle id="restRing" class="rbar ${left <= 10 ? 'hot' : ''}" cx="60" cy="60" r="52" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * (1 - fr)).toFixed(1)}" transform="rotate(-90 60 60)"/></svg><div class="rtxt"><b id="restT">${mmss(Math.max(0, left))}</b><small id="restOf">von ${mmss(st.rest.len ?? st.rest.total)}</small></div></div>
        <div class="grow stack" style="gap:8px;min-width:0"><div class="eyebrow" id="restLbl">${left > 0 ? 'Pause' : 'Los geht’s'}</div><button class="nextup" data-a="toFocus"><small>Als Nächstes</small><b class="ell">${nx}</b><span class="ell">${nd}</span></button><div class="tiny muted">Dauer <span class="num" id="pElapsed">${mmss((Date.now() - a.start) / 1000)}</span></div></div></div>
        <div class="ctrl"><button data-a="restAdj" data-s="-15">−15 s</button><button class="go" data-a="restSkip">Stopp</button><button data-a="restAdj" data-s="15">+15 s</button></div></div>`;
      return;
    }
    el.innerHTML = `<div class="panel">${S ? `<button class="pname" data-a="toFocus">${esc(S.ex.name)}</button>` : ''}<div class="cols"><div><small>Dauer</small><div class="v" id="pElapsed">${mmss((Date.now() - a.start) / 1000)}</div></div>
      <div><small style="text-align:center" id="restLbl">${resting ? (left > 0 ? 'Pause' : 'Los geht’s') : S ? 'Nächster Satz' : 'Fertig'}</small><div class="big" id="restT">${resting ? mmss(Math.max(0, left)) : S ? (S.ex.kind === 'hold' || S.ex.kind === 'int' ? fmt(S.rec.sec) + 's' : fmt(S.rec.reps) + '×') : '✓'}</div>${resting ? `<div class="restof" id="restOf">von ${mmss(st.rest.len ?? st.rest.total)} Pause</div>` : ''}</div>
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
    const rg = $('#restRing'); if (rg) { const C = 2 * Math.PI * 52; rg.setAttribute('stroke-dashoffset', (C * (1 - Math.max(0, Math.min(1, left / (st.rest.total || 1))))).toFixed(1)); rg.classList.toggle('hot', left <= 10); }
    if (left <= 3 && left > 0 && st.rest.beeped !== Math.ceil(left)) { st.rest.beeped = Math.ceil(left); beep(700, 0.1); }
    if (left < -4 && !st.rest.fired) { const over = -left; st.rest = null; renderRest(); toast('Pause seit ' + mmss(over) + ' vorbei'); return; }
    if (left <= 0 && !st.rest.fired) { st.rest.fired = true; syncTimers(); flashPanel(); beep(1100, 0.45); buzz([250, 120, 250]); const l = $('#restLbl'); if (l) l.textContent = 'Los geht’s'; setTimeout(() => { if (st.rest && st.rest.fired) { st.rest = null; renderRest(); } }, 4000); }
  }
  function tickHold(now) { if (st.hold) { const t = $('#holdT'); if (t) t.textContent = mmss((now - st.hold.start) / 1000); } }

  /* ================= Training ================= */
  function newEntry(exId, slot) {
    const ex = getEx(exId);
    const presc = E.prescription(slot || null, ex, P(), plan());
    return Object.assign({ key: uid(), exId, slotId: slot ? slot.id : null, presc, sets: [], extra: 0 }, slot && slot.ss ? { ss: slot.ss } : {});
  }
  function startWorkout(di, loc, delta) {
    const p = plan(); const day = p.days[di];
    let exercises, timeNote = null;
    if (delta) {
      const tp = E.timePlan(day, loc, delta, P(), p);
      exercises = tp.items.map(it => {
        const e = newEntry(it.ex.id, it.slot);
        if (it.spec) { e.presc.sets = it.sets; e.presc.rest = it.rest; e.extraEx = true; }
        else { e.presc.sets += it.boost; e.presc.rest = Math.max(30, Math.round(e.presc.rest * it.factor / 5) * 5); }
        return e;
      });
      timeNote = { delta, minutes: tp.minutes, notes: tp.notes };
    } else exercises = day.slots.filter(s => s.ex[loc]).map(s => newEntry(s.ex[loc], s));
    st.active = { id: uid(), planId: p.id, dayIdx: di, dayId: day.id, name: day.name, loc, start: Date.now(), bw: E.bodyweight(P()), exercises, cur: 0, timeNote };
    st.homeDay = null;
    Store.saveActive(true); openWorkout();
  }
  function openWorkout() { st.ov = { type: 'workout' }; restoreTimers(); keepAwake(true); render(); }
  function flashPanel() { const p = document.querySelector('#rb .panel'); if (!p) return; p.classList.remove('flash'); void p.offsetWidth; p.classList.add('flash'); }
  // exState wird pro Neuaufbau mehrfach gebraucht: Ergebnis merken, bis sich etwas ändert (jede Eingabe zählt st.ev hoch)
  const exCache = new Map();
  function exState(entry) {
    const last = entry.sets[entry.sets.length - 1];
    const sig = [st.ev || 0, Store.wv, st.workouts.length, entry.exId, entry.sets.length, last ? last.t : 0, entry.band || '', entry.extra || 0, entry.closed ? 1 : 0, entry.ignoreStop ? 1 : 0, entry.presc && entry.presc.sets, E.todayISO()].join('|');
    const c = exCache.get(entry.key); if (c && c.sig === sig) return c.S;
    const S = exStateCalc(entry); exCache.set(entry.key, { sig, S }); return S;
  }
  function exStateCalc(entry) {
    const ex = getEx(entry.exId); const presc = entry.presc;
    const done = entry.sets.filter(s => s.done);
    const hist = histOf(entry.exId);
    const rec = E.recommend(ex, presc, done, hist, { profile: P(), loc: st.active.loc, band: entry.band || null });
    let planned = Math.max(1, rec.setsRec + (entry.extra || 0));
    if (rec.stop && !entry.ignoreStop) planned = Math.max(done.length, 1);
    if (entry.closed && done.length) planned = done.length;
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
      <div class="segbar" aria-label="Fortschritt">${a.exercises.map((e, i) => `<i class="${exState(e).finished ? 'on' : i === ci ? 'cur' : ''}"></i>`).join('')}</div>
      <div class="stack">
        ${ci >= 0 ? focusCard(a.exercises[ci], ci) : `<div class="card lime rings-bg stack"><h2 class="xl">Alles erledigt!</h2><div style="font-weight:700">Speichere dein Training oder hänge noch eine Übung an.</div><button class="btn dark big" data-a="finishAsk">Training speichern</button></div>${freeCard()}`}
        <div class="section"><div class="head"><h3>Übungen</h3><span class="small muted">${a.exercises.filter(e => exState(e).finished).length}/${a.exercises.length} fertig</span></div>
          <div class="tiny muted" style="margin:-4px 0 2px">Gedrückt halten und ziehen, um die Reihenfolge zu ändern.</div>${a.timeNote ? `<div class="card flat tiny" style="margin:2px 0"><b>${a.timeNote.delta < 0 ? 'Kürzere' : 'Längere'} Einheit (≈ ${a.timeNote.minutes} min)</b><br>${esc(a.timeNote.notes.join(' · '))}</div>` : ''}
          ${(() => { const SL = ssLabels(a.exercises); return a.exercises.map((e, i) => { const S = exState(e); if (!S.ex) return ''; return `<button class="qrow ${S.finished ? 'done' : ''} ${SL[i] ? 'ss' : ''}" data-a="focusEx" data-i="${i}" data-drag="wo" data-s="${i}" ${i === ci ? 'style="box-shadow:inset 0 0 0 2px var(--lime)"' : ''}>${thumb(S.ex)}<div class="grow"><b>${SL[i] ? `<span class="sstag">${SL[i]}</span>` : ''}${esc(S.ex.name)}</b><div class="small muted">${S.done.length ? S.done.map(x => shortSet(S.ex, x)).join(' · ') : S.planned + ' Sätze · ' + rrText(S.presc.rr, S.ex)}</div></div><span class="num small" style="color:${S.finished ? 'var(--good)' : 'var(--muted)'}">${S.finished ? '✓' : S.done.length + '/' + S.planned}</span></button>`; }).join(''); })()}
          <button class="btn" data-a="pickEx" data-mode="workout">${I.plus} Übung hinzufügen</button></div>
      </div>`;
  }
  const UNIT_RX = /^(Kilo|Wdh\.|Sekunden|Gesamtgewicht)/;
  function howtoHTML(ex, compact) {
    const h = (window.HOWTO || {})[ex.id];
    const units = (ex.c || []).filter(c => UNIT_RX.test(c));
    if (!h) {
      const cues = (ex.c || []).filter(c => !UNIT_RX.test(c));
      return `<p style="margin:0" class="ink2">${esc(ex.d)}</p>${cues.length ? `<div class="howlist">${cues.map(c => `<div class="howtip"><span class="hk ok">✓</span><span>${esc(c)}</span></div>`).join('')}</div>` : ''}`;
    }
    const tips = h.w.filter(c => !UNIT_RX.test(c));
    return `${compact ? '' : `<p style="margin:0" class="ink2">${esc(ex.d)}</p>`}
      <div class="howsec"><div class="howh">So geht's</div><ol class="howsteps">${h.s.map(x => `<li><span>${esc(x)}</span></li>`).join('')}</ol></div>
      <div class="howsec"><div class="howh">Darauf achten</div><div class="howlist">${tips.map(c => `<div class="howtip"><span class="hk ok">✓</span><span>${esc(c)}</span></div>`).join('')}
      ${h.f ? `<div class="howtip bad"><span class="hk no">✗</span><span><b>Häufiger Fehler:</b> ${esc(h.f)}</span></div>` : ''}</div></div>
      ${units.length && !compact ? `<div class="small muted">${units.map(esc).join(' · ')}</div>` : ''}`;
  }
  /* Leichtere / schwerere Variante: zuerst Progressionskette, sonst gleiche Bewegung mit anderem Level */
  function levelNeighbors(entry) {
    const ex = getEx(entry.exId); if (!ex) return {};
    const loc = st.active.loc;
    if (ex.grp) { const e = E.chainStep(ex, -1, P(), loc), h = E.chainStep(ex, 1, P(), loc); if (e || h) return { easier: e && getEx(e), harder: h && getEx(h) }; }
    const slot = findSlot(entry) || { p: [ex.pat], r: entry.presc.role };
    const used = st.active.exercises.map(e => e.exId);
    const alts = E.alternatives(Object.assign({}, slot, { p: [ex.pat] }), loc, P(), used).filter(x => x.ex.id !== ex.id && x.ex.pat === ex.pat);
    const pick = f => { const c = alts.filter(x => f(x.ex)); return c.length ? c[0].ex : null; };
    const near = (a, b) => Math.abs(a.lvl - b.lvl);
    const easierL = alts.filter(x => x.ex.lvl < ex.lvl).sort((a, b) => near(a.ex, ex) - near(b.ex, ex) || b.s - a.s)[0];
    const harderL = alts.filter(x => x.ex.lvl > ex.lvl).sort((a, b) => near(a.ex, ex) - near(b.ex, ex) || b.s - a.s)[0];
    // Bei Gewichtsübungen ohne höheres Level: einarmige/einbeinige Variante ist die schwerere
    const harder = harderL ? harderL.ex : (ex.kind === 'load' && !ex.uni ? pick(e => e.uni) : null);
    const easier = easierL ? easierL.ex : (ex.uni ? pick(e => !e.uni && e.lvl <= ex.lvl) : null);
    return { easier, harder };
  }
  function levelRec(entry, S, nb) {
    const r = S.rec;
    if (r.harder && nb.harder) return 'harder';
    if (r.easier && nb.easier) return 'easier';
    if (nb.harder && (r.notes || []).some(n => /Schwerstes verfügbares Gewicht|Mehr Wdh\. als geplant|Zu leicht/.test(n))) return 'harder';
    if (nb.easier && r.dayForm != null && r.dayForm <= -0.08) return 'easier';
    return 'cur';
  }
  function freeCard() {
    const a = st.active; const p = plan(); const day = p && p.days[a.dayIdx];
    let sug = [];
    if (day) { const have = new Set(a.exercises.map(e => e.exId)); sug = E.timePlan(day, a.loc, 3, P(), p).added.map(x => x.ex).filter(x => !have.has(x.id)).slice(0, 3); }
    return `<div class="card stack" style="gap:10px"><div><b style="font-size:1.1em">Noch Lust? Freies Training</b><div class="small muted">Dein Pflichtprogramm ist geschafft. Häng noch Übungen dran – die Empfehlung passt sich wie gewohnt nach jedem Satz an.</div></div>
      ${sug.length ? `<div class="list">${sug.map(x => `<button class="li" data-a="freeAdd" data-id="${x.id}">${thumb(x)}<div class="grow"><b>${esc(x.name)}</b><div class="small muted">${x.prim.map(m => D.MUSCLES[m]).join(', ')} · passt zu heute</div></div><span class="chev">${I.plus}</span></button>`).join('')}</div>` : ''}
      <button class="btn" data-a="pickEx" data-mode="workout">${I.plus} Andere Übung wählen</button></div>`;
  }
  function bandRow(entry, idx, ex) {
    if (!E.canBand(ex)) return '';
    const last = lastBand(ex.id); const cur = entry.band;
    const chips = `<div class="bandchips">${E.BANDS.map(b => `<button class="bchip ${cur === b.k ? 'on' : ''}" data-a="bandSet" data-i="${idx}" data-k="${b.k}"><span class="bdot" style="background:${b.c}"></span>${b.n}</button>`).join('')}<button class="bchip ${cur === '' ? 'on' : ''}" data-a="bandSet" data-i="${idx}" data-k="">Ohne</button></div>`;
    if (cur === undefined && last) {
      const b = bandOf(last);
      return `<div class="bandbox ask"><div class="small"><b>Letztes Mal mit Band ${bandDot(last)} ${esc(b ? b.n : last)}</b> – heute wieder?</div><div class="row wrap" style="gap:6px"><button class="btn sm primary" data-a="bandSet" data-i="${idx}" data-k="${last}">Ja, ${esc(b ? b.n : last)}</button><button class="btn sm" data-a="bandSet" data-i="${idx}" data-k="">Ohne Band</button><button class="btn sm ghost" data-a="bandOpen" data-i="${idx}">Andere Farbe</button></div>${st.bandOpen === entry.key ? chips : ''}</div>`;
    }
    const b = bandOf(cur);
    return `<div class="bandbox"><button class="bandtgl" data-a="bandOpen" data-i="${idx}">${b ? bandDot(cur) : '<span class="bdot none"></span>'}<span>Widerstandsband: <b>${b ? b.n : 'ohne'}</b>${b ? ` <span class="muted">· ≈ ${b.kg} kg Hilfe</span>` : ''}</span><span class="chev" style="transform:rotate(${st.bandOpen === entry.key ? -90 : 90}deg)">${I.chev}</span></button>${st.bandOpen === entry.key ? chips + '<div class="tiny muted">Die Empfehlung rechnet die Hilfe des Bands mit ein. Kg-Werte sind grobe Richtwerte, je nach Marke verschieden.</div>' : ''}</div>`;
  }
  // Supersätze: Gruppen-Buchstaben A, B, … in Reihenfolge
  function ssLabels(list) { const m = {}; let n = 0; const out = {}; list.forEach((e, i) => { if (!e || !e.ss) return; const cnt = list.filter(x => x && x.ss === e.ss).length; if (cnt < 2) return; if (!(e.ss in m)) m[e.ss] = { L: String.fromCharCode(65 + n++), k: 0 }; out[i] = m[e.ss].L + (++m[e.ss].k); }); return out; }
  function linkSS(list, i) { const a = list[i], b = list[i + 1]; if (!a || !b) return false; const id = a.ss || b.ss || ('ss' + uid()); a.ss = id; b.ss = id; return true; }
  function unlinkSS(list, i) { const id = list[i] && list[i].ss; if (!id) return; for (const x of list) if (x && x.ss === id) delete x.ss; }
  // Notizen bleiben bei der Übung, bis du sie änderst
  const exNote = id => ((P() && P().exNotes) || {})[id] || null;
  function noteChip(id, extra) { const n = exNote(id); return n && n.t ? `<div class="notechip" ${extra || ''}>${I.note.replace('<svg', '<svg width="14" height="14" style="vertical-align:-2px;flex:none"')}<span>${esc(n.t)}</span></div>` : ''; }
  const ownW = (ex, loc) => ((P() && P().exW) || {})[ex.id + '@' + loc] || null;
  const parseW = v => [...new Set(String(v || '').split(/[;\s]+|,(?=\s)/).map(x => parseFloat(x.replace(',', '.'))).filter(x => x >= 0 && x < 500))].sort((a, b) => a - b);
  const wChips = v => parseW(v).map(x => `<span class="chip on">${fmt(x)} kg</span>`).join('') || '<span class="tiny muted">Noch keine Gewichte</span>';
  // Rekord in Reichweite: Zeile, wenn die Empfehlung höchstens 3 % unter dem bisherigen Bestwert liegt
  function recordLine(ex, S, w, reps) {
    if (S.finished || !S.hist.length || ex.kind === 'hold' || ex.kind === 'int' || reps == null) return '';
    const bw = E.bodyweight(P());
    const best = Math.max(...S.hist.map(h => E.sessionBest(ex, h.entry, h.bw || bw)).filter(x => x > 0), ...S.done.map(s => E.setScore(ex, s, bw) || 0));
    if (!(best > 0)) return '';
    const sc = r => E.setScore(ex, { done: true, w, reps: r, rir: S.rec.rir }, bw) || 0;
    if (sc(reps) < best * 0.97) return '';
    if (sc(reps) > best * 1.005) return `<div class="note" style="font-weight:800">Mit dieser Empfehlung knackst du deinen Rekord</div>`;
    for (let r = reps + 1; r <= reps + 3; r++) if (sc(r) > best * 1.005) return `<div class="note" style="font-weight:800">Rekord bei ${r} Wdh.${w ? ' mit ' + fmt(w) + ' kg' : ''}</div>`;
    return '';
  }
  function focusCard(entry, idx) {
    const S = exState(entry); const { ex, presc, done, rec, planned, finished } = S;
    if (!ex) return '';
    const kind = ex.kind; const isHold = kind === 'hold' || kind === 'int';
    const showW = kind === 'load' || (kind === 'bw' && ex.addw && !entry.band && (E.loadOptions(ex, st.active.loc, P()) || []).length > 1);
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
        ${(() => { // Werte ohne Tastatur anpassen (große Plus/Minus-Knöpfe)
          const cell = (f, l, v) => `<div><small>${l}</small><div class="mini"><button data-a="qAdj" data-i="${idx}" data-f="${f}" data-d="-1" aria-label="${l} weniger">−</button><b class="num">${fmt(v ?? 0)}</b><button data-a="qAdj" data-i="${idx}" data-f="${f}" data-d="1" aria-label="${l} mehr">+</button></div></div>`;
          if (kind === 'int') return '';
          return `<div class="qadj">${isHold ? cell('sec', 'Sekunden', nextS) : (showW ? cell('w', kind === 'bw' ? 'Zusatz kg' : 'kg', nextW) : '') + cell('reps', 'Wdh.', nextR)}</div>`; })()}
        ${recordLine(ex, S, nextW, nextR)}
        <div class="note">Ziel ${rrText(presc.rr, ex)}${unitNote}${prevSets[done.length] ? ' · Letztes Mal: ' + shortSet(ex, prevSets[done.length]) : ''}</div>
        ${rec.warmup && rec.warmup.length ? `<div class="note">Aufwärmen: ${rec.warmup.map(w => fmt(w.w) + ' kg × ' + w.reps).join(' · ')}</div>` : ''}
        ${rec.notes.map(t => `<div class="note">${esc(t)}</div>`).join('')}
        ${rec.stop && !entry.ignoreStop ? `<div class="row"><button class="btn sm" data-a="ignoreStop" data-i="${idx}">Trotzdem weiter</button></div>` : ''}
        ${(() => { const nb = levelNeighbors(entry); if (!nb.easier && !nb.harder) return ''; const rc = levelRec(entry, S, nb); return `<div class="row"><button class="btn sm" data-a="levelOpen" data-i="${idx}">${I.swap} Leichter / Schwerer${rc !== 'cur' ? `<span class="recdot">${rc === 'harder' ? '▲' : '▼'} Tipp</span>` : ''}</button></div>`; })()}
      </div>`;
    } else target = `<div class="target"><b>Übung erledigt ✓</b><div class="note">Tippe unten auf die nächste Übung oder „+ Satz“ für mehr.</div></div>`;
    const cols = isHold ? ['#', 'Vorher', 'Sek.', 'Res.', ''] : showW ? ['#', 'Vorher', kind === 'bw' ? '+kg' : 'kg', 'Wdh.', 'Res.', ''] : ['#', 'Vorher', 'Wdh.', 'Res.', ''];
    let rows = ''; const total = finished ? done.length : planned;
    for (let i = 0; i < total; i++) {
      const s = done[i]; const pv = `<td class="prev">${shortSet(ex, prevSets[i])}</td>`;
      if (s) rows += `<tr class="done"><td class="setno" data-a="editSet" data-i="${idx}" data-s="${i}">${i + 1}</td>${pv}${isHold ? `<td class="num" style="font-size:19px">${fmt(s.sec)}${s.band ? ' ' + bandDot(s.band) : ''}</td>` : `${showW ? `<td class="num" style="font-size:19px">${fmt(s.w || 0)}</td>` : ''}<td class="num" style="font-size:19px">${fmt(s.reps)}${s.band ? ' ' + bandDot(s.band) : ''}</td>`}<td class="rirtag">${rirLabel(s.rir, ex)}</td><td><button class="check" data-a="editSet" data-i="${idx}" data-s="${i}" aria-label="Satz bearbeiten">${I.check}</button></td></tr>`;
      else if (i === done.length) rows += `<tr class="next"><td class="setno">${i + 1}</td>${pv}${isHold ? `<td><input id="in-${entry.key}-sec" inputmode="numeric" data-in="draft" data-i="${idx}" data-f="sec" value="${nextS ?? ''}"></td>` : `${showW ? `<td><input id="in-${entry.key}-w" inputmode="decimal" data-in="draft" data-i="${idx}" data-f="w" value="${nextW != null ? fmt(nextW) : ''}"></td>` : ''}<td><input id="in-${entry.key}-reps" inputmode="numeric" data-in="draft" data-i="${idx}" data-f="reps" value="${nextR ?? ''}"></td>`}<td class="muted small">${rirLabel(rec.rir, ex)}</td><td><button class="check" data-a="doneSet" data-i="${idx}" aria-label="Satz abschließen">${I.check}</button></td></tr>`;
      else rows += `<tr><td class="setno">${i + 1}</td>${pv}${isHold ? `<td class="muted num">${fmt(rec.sec)}</td>` : `${showW ? `<td class="muted num">${fmt(rec.w)}</td>` : ''}<td class="muted num">${fmt(rec.reps)}</td>`}<td class="muted small">${rirLabel(rec.rir, ex)}</td><td></td></tr>`;
    }
    const isBB = ex.eq.includes('bb') && ex.kind === 'load';
    return `<div class="stage"><div class="over"><div class="eyebrow ell">${ROLE[presc.role] ? ROLE[presc.role][1] : ''} · ${ex.prim.map(m => D.MUSCLES[m]).join(', ')}</div><h2>${esc(ex.name)}</h2></div>${figSVG(ex, { anim: 2.6 })}<div class="setpill" aria-label="Satz ${done.length} von ${planned}">${pills}<b>${done.length}/${planned}</b></div></div>
      ${target}
      ${(() => { const L = ssLabels(st.active.exercises)[idx]; if (!L) return ''; const partners = st.active.exercises.filter((x, k) => k !== idx && x.ss === entry.ss).map(x => getEx(x.exId).name); return `<div class="sschip">⇄ Supersatz ${L} · mit ${esc(partners.join(', '))}<span class="tiny muted"> – nach jedem Satz direkt weiter</span></div>`; })()}
      ${bandRow(entry, idx, ex)}
      <div class="card flat howcard"><button class="howtgl" data-a="howToggle" aria-expanded="${!!st.howOpen}"><span>${I.info} So geht's: ${esc(ex.name)}</span><span class="chev" style="transform:rotate(${st.howOpen ? -90 : 90}deg)">${I.chev}</span></button>${st.howOpen ? `<div class="stack" style="gap:12px;margin-top:10px">${howtoHTML(ex, true)}</div>` : ''}</div>
      ${(() => { const n = entry.note || (exNote(ex.id) || {}).t || lastNote; if (!n) return ''; const src = entry.note ? '' : '<span class="muted">Deine Notiz:</span> '; return `<div class="card flat small notecard" data-a="noteOpen" data-i="${idx}" style="cursor:pointer">${I.note.replace('<svg', '<svg width="16" height="16" style="vertical-align:-3px"')} ${src}${esc(n)}</div>`; })()}
      <table class="sets"><thead><tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>
      <div class="exfoot">${isHold && !finished && kind === 'hold' ? `<button class="btn sm primary" data-a="holdStart" data-i="${idx}">${I.play} Halten starten</button>` : ''}${kind === 'int' && !finished ? `<button class="btn sm primary" data-a="intStart" data-i="${idx}">${I.play} Intervall</button>` : ''}
        <button class="btn sm" data-a="setPlus" data-i="${idx}">+ Satz</button>
        <button class="btn sm" data-a="swapWorkout" data-i="${idx}">${I.swap} Tauschen</button>${!finished && st.active.exercises.some((x, k) => k !== idx && !(entry.ss && x.ss === entry.ss) && !exState(x).finished) ? `<button class="btn sm" data-a="exLater" data-i="${idx}" title="Gerät besetzt">Später</button>` : ''}<button class="btn sm" data-a="noteOpen" data-i="${idx}">${I.note} Notiz</button><button class="btn sm ghost" data-a="exMenu" data-i="${idx}">⋯ Mehr</button></div>`;
  }

  function commitSet(idx, vals, rir) {
    if (Date.now() - (st.lastCommit || 0) < 400) return; // Doppeltipp-Schutz
    st.lastCommit = Date.now(); st.ev = (st.ev || 0) + 1;
    const a = st.active; const entry = a.exercises[idx]; const ex = getEx(entry.exId);
    const undoCur = a.cur;
    const before = exState(entry);
    const set = { done: true, rir, t: Date.now() };
    if (ex.kind === 'hold' || ex.kind === 'int') set.sec = vals.sec || 0; else { set.reps = vals.reps || 0; if (vals.w != null) set.w = vals.w; }
    if (entry.band) set.band = entry.band;
    entry.sets.push(set); entry.draft = null;
    st.undo = { key: entry.key, t: set.t, cur: undoCur, draft: { w: vals.w, reps: vals.reps, sec: vals.sec } };
    const UNDO = { a: 'undoSet', l: 'Rückgängig' };
    const after = exState(entry);
    // Rückmeldung
    const sc = E.setScore(ex, set, E.bodyweight(P()));
    let msg = '';
    if (ex.kind !== 'int') {
      const targetSc = E.setScore(ex, { done: true, w: before.rec.w, reps: before.rec.reps, sec: before.rec.sec, rir: before.rec.rir }, E.bodyweight(P()));
      if (sc && targetSc) { const d = sc / targetSc - 1; msg = d > 0.03 ? 'Stärker als erwartet (' + (d > 0 ? '+' : '') + Math.round(d * 100) + ' %). ' : d < -0.05 ? 'Etwas unter dem Ziel, Empfehlung angepasst. ' : E.isCut(P(), plan()) ? 'Kraft gehalten – genau richtig beim Abnehmen. ' : 'Genau im Ziel. '; }
    }
    // Supersatz: direkt zur Partnerübung, Pause erst nach der Runde
    const grp = entry.ss ? a.exercises.map((e, i) => ({ e, i })).filter(x => x.e.ss === entry.ss) : [];
    if (grp.length > 1) {
      const pos = grp.findIndex(x => x.i === idx); let nxt = null, k = 1;
      for (; k <= grp.length; k++) { const c = grp[(pos + k) % grp.length]; if (c.i !== idx && !exState(c.e).finished) { nxt = c; break; } }
      if (nxt) {
        a.cur = nxt.i; const roundDone = pos + k >= grp.length; const nm = getEx(nxt.e.exId).name;
        msg += roundDone ? 'Runde fertig – Pause, dann ' + nm + '.' : 'Supersatz: direkt weiter mit ' + nm + '.';
        startRest(roundDone ? Math.max(...grp.map(x => x.e.presc.rest)) : 15, 'Nächste: ' + nm);
        toast(msg, 6000, UNDO); Store.saveActive(); closeSheet(); render(); toFocus();
        return;
      }
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
    toast(msg, 6000, UNDO);
    Store.saveActive(); closeSheet(); render(); toFocus();
  }

  function finishWorkout(save, endTs) {
    const a = st.active; if (!a) return;
    if (save) {
      const bw = E.bodyweight(P());
      const exs = a.exercises.map(e => { const ex = getEx(e.exId); const sets = e.sets.filter(s => s.done).map(s => { const o = { rir: s.rir }; if (s.w != null) o.w = s.w; if (s.reps != null) o.reps = s.reps; if (s.sec != null) o.sec = s.sec; if (s.band) o.band = s.band; return o; }); return { exId: e.exId, sets, rirT: e.presc.rir, rr: e.presc.rr, note: (e.note || '').trim() || undefined, best: ex ? E.sessionBest(ex, { sets: sets.map(s => Object.assign({ done: true }, s)) }, bw) : 0 }; }).filter(e => e.sets.length);
      const prs = [];
      for (const e of exs) {
        const ex = getEx(e.exId); if (!ex || !e.best) continue;
        const prev = histOf(e.exId).map(h => E.sessionBest(ex, h.entry, h.bw || bw));
        if (prev.length && e.best > Math.max(...prev) * 1.005) prs.push(e.exId);
      }
      const vol = exs.reduce((t, e) => { const ex = getEx(e.exId); return t + e.sets.reduce((u, s) => u + (ex && ex.kind === 'load' ? (s.w || 0) * (s.reps || 0) : ex && ex.kind === 'bw' ? (bw * (ex.bwf || 0) + (s.w || 0)) * (s.reps || 0) : 0), 0); }, 0);
      const w = { id: a.id, planId: a.planId || undefined, ts: Date.now(), date: E.todayISO(new Date(a.start)), name: a.name, dayId: a.dayId || null, loc: a.loc, dur: Math.round(((endTs || Date.now()) - a.start) / 1000), bw, exercises: exs, prs, vol: Math.round(vol) };
      if (exs.length) {
        st.workouts.push(w); Store.saveWorkout(w); Backup.snapshot('training');
        try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => { }); } catch (e) { }
        if (a.dayIdx != null && plan() && (!a.planId || a.planId === plan().id)) { const di = a.dayId ? plan().days.findIndex(d => d.id === a.dayId) : a.dayIdx; plan().next = ((di >= 0 ? di : a.dayIdx) + 1) % plan().days.length; Store.saveProfile(); }
        st.summary = w;
      }
    }
    st.active = null; st.rest = null; st.hold = null; st.undo = null; st.toast = null; st.toastAct = null; renderToast(); exCache.clear(); Store.saveActive(true); keepAwake(false);
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
      <button class="btn" data-a="resultOwn">Lieber eigenen Plan bauen</button>
      <button class="btn" data-a="reroll">Andere Übungsauswahl vorschlagen</button></div>`;
  }

  /* ================= Sheets ================= */
  // Tagesform-Check → eine der vorhandenen Längen (−2 … +2), keine neue Trainingslogik
  function tfDelta(s) {
    const en = s.en ?? 1, sl = s.sl ?? 1, ti = s.ti ?? 1;
    let d = (ti === 0 ? -1 : ti === 2 ? 1 : 0) + (en === 0 ? -1 : 0) + (sl === 0 ? -1 : 0);
    if (ti === 2 && en === 2 && sl === 2) d = 2;
    return Math.max(-2, Math.min(2, d));
  }
  function plateRes(s) { return SHEETS._plateRes(s); }
  function pickResults(s) {
    const q = (s.q || '').trim().toLowerCase();
    const loc = st.active ? st.active.loc : (st.planLoc || defLoc());
    const eq = E.locEquip(P(), loc);
    const list = E.allExercises(P()).filter(ex => (!q || ex.name.toLowerCase().includes(q) || (D.PATTERNS[ex.pat] || '').toLowerCase().includes(q) || (ex.alias || []).some(a => String(a).toLowerCase().includes(q))) && (s.all || E.available(ex, eq))).sort((a, b) => a.name.localeCompare(b.name));
    if (!list.length) return `<div class="empty">Keine Übung gefunden.</div>`;
    return list.slice(0, 80).map(ex => `<button class="li" data-a="pickDo" data-id="${ex.id}"><div class="grow"><div style="font-weight:600">${esc(ex.name)}</div><div class="small muted">${esc(D.PATTERNS[ex.pat] || '')} · ${ex.eq.map(e => D.EQUIP[e]).join(' + ')}</div></div></button>`).join('');
  }
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
      const h = histOf(ex.id);
      const easier = ex.grp ? E.chainStep(ex, -1, P(), defLoc()) : null, harder = ex.grp ? E.chainStep(ex, 1, P(), defLoc()) : null;
      const chain = ex.grp ? E.allExercises(P()).filter(e => e.grp === ex.grp && e.pat === ex.pat).sort((a, b) => a.rank - b.rank) : [];
      const last = h.slice(-5).reverse();
      const bw = E.bodyweight(P());
      const best = h.reduce((m, x) => Math.max(m, E.sessionBest(ex, x.entry, x.bw || bw)), 0);
      const pctTable = ex.kind === 'load' && best > 0 ? `<div class="card stack" style="gap:8px"><div class="row between"><b>1RM-Tabelle</b><span class="small muted">geschätztes Maximum ${fmt(best, 1)} kg</span></div><div class="tbl"><table><thead><tr><th>%</th><th class="r">Gewicht</th><th class="r">≈ Wdh.</th></tr></thead><tbody>${[100, 95, 90, 85, 80, 75, 70, 65, 60].map(p => `<tr><td>${p} %</td><td class="r num">${fmt(Math.round(best * p / 100 * 2) / 2)} kg</td><td class="r num">${p === 100 ? 1 : Math.max(1, Math.round(30 * (100 / p - 1)))}</td></tr>`).join('')}</tbody></table></div></div>` : '';
      return `<div class="stack"><div class="stage" style="aspect-ratio:1/0.82"><div class="over"><div class="eyebrow">${esc(D.PATTERNS[ex.pat] || '')}</div><h2>${esc(ex.name)}</h2></div><button class="favbtn ${isFav(ex.id) ? 'on' : ''}" data-a="favToggle" data-id="${ex.id}" aria-label="${isFav(ex.id) ? 'Favorit entfernen' : 'Als Favorit markieren'}" aria-pressed="${isFav(ex.id)}">★</button>${figSVG(ex, { anim: 2.6 })}<div class="setpill" style="gap:4px">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= ex.lvl ? 'on' : ''}"></i>`).reverse().join('')}<b>Lvl ${ex.lvl}</b></div></div>
        <div class="row wrap" style="gap:6px">${ex.prim.map(m => `<span class="chip on">${D.MUSCLES[m]}</span>`).join('')}${(ex.sec || []).map(m => `<span class="chip">${D.MUSCLES[m]}</span>`).join('')}</div>
        ${noteChip(ex.id)}
        ${ex.kind === 'load' || (ex.kind === 'bw' && ex.addw) ? `<button class="btn sm" style="align-self:flex-start" data-a="wOpen" data-id="${ex.id}">⚖ Verfügbare Gewichte${ownW(ex, st.active ? st.active.loc : defLoc()) ? ': ' + ownW(ex, st.active ? st.active.loc : defLoc()).map(x => fmt(x)).join(', ') + ' kg' : ' festlegen'}</button>` : ''}
        <div class="card stack" style="gap:12px"><b>Anleitung</b>${howtoHTML(ex)}
        <div class="small muted">${ex.eq.map(e => D.EQUIP[e]).join(' + ')} · ${ex.kind === 'load' ? 'mit Gewicht' : ex.kind === 'bw' ? 'Körpergewicht' + (ex.addw ? ' (+ Zusatzgewicht möglich)' : '') : ex.kind === 'hold' ? 'Haltezeit' : 'Intervall'} · Ziel ${rrText(ex.rr, ex)}${ex.uni ? ' pro Seite' : ''}</div></div>
        ${chain.length > 1 ? `<div class="stack" style="gap:8px"><b>Progressionsstufen</b><div class="chips" style="gap:10px">${chain.map(c => `<button class="extile" style="width:92px;flex:none" data-a="exInfo" data-id="${c.id}"><div class="tile" style="${c.id === ex.id ? 'box-shadow:inset 0 0 0 2px var(--lime)' : ''}">${figSVG(c)}</div><span>${c.id === harder ? '▲ ' : c.id === easier ? '▼ ' : ''}${esc(c.name)}</span></button>`).join('')}</div></div>` : ''}
        ${h.length ? `<div class="card stack" style="gap:8px"><b>Deine Leistung</b>${h.length >= 2 ? lineChart(exSeries(ex.id), exUnit(ex)) : ''}<div class="list" style="background:var(--surface2)">${last.map(x => `<div class="li"><div class="grow small">${dateDE(x.date)}</div><div class="small">${x.entry.sets.map(z => setTxt(ex, z)).join(' · ')}</div></div>`).join('')}</div></div>` : '<div class="small muted">Noch nicht trainiert.</div>'}
        ${pctTable}
        <div class="row wrap">${st.active ? `<button class="btn primary grow" data-a="addToWorkout" data-id="${ex.id}">${I.plus} Ins Training</button>` : ''}<button class="btn grow" data-a="addToPlanAsk" data-id="${ex.id}">${I.plus} In den Plan</button><button class="btn ${isFav(ex.id) ? 'primary' : ''} grow" data-a="favToggle" data-id="${ex.id}">★ ${isFav(ex.id) ? 'Favorit' : 'Favorit machen'}</button>${ex.custom ? `<button class="btn danger" data-a="delCustom" data-id="${ex.id}">Löschen</button>` : ''}</div>
        ${ex.custom ? `<div class="card flat stack" style="gap:8px"><b>Bild & Anleitung ergänzen lassen</b><div class="small muted">Eigene Übungen liegen nur auf deinem Handy. Schick sie Claude – beim nächsten Update kommt die Übung mit Bild, Anleitung und allen Daten zurück, dein Verlauf bleibt erhalten.</div><button class="btn" data-a="shareCustom" data-id="${ex.id}">An Claude schicken</button></div>` : ''}</div>`;
    },
    checkin(s) {
      const done = E.CHECKIN.filter(q => s.ans[q.id] != null).length;
      return `<div class="stack"><div><h2>Wochen-Check-in</h2><div class="small muted">Wie war die letzte Woche? Daraus passe ich Sätze und Reserve für diese Woche an.</div></div>
        ${E.CHECKIN.map(q => `<div class="stack" style="gap:8px"><b>${q.q}</b><div class="chips" style="flex-wrap:wrap">${q.o.map(([v, n]) => `<button class="chip ${s.ans[q.id] === v ? 'on' : ''}" data-a="ciPick" data-q="${q.id}" data-v="${v}">${n}</button>`).join('')}</div></div>`).join('')}
        <button class="btn primary big" data-a="ciSave" ${done < E.CHECKIN.length ? 'disabled' : ''}>Auswerten (${done}/${E.CHECKIN.length})</button></div>`;
    },
    checkinDone(s) {
      const col = { deload: 'lilac', less: 'lav', more: 'lime', same: 'lime' }[s.res.kind];
      const title = { deload: 'Erholungswoche', less: 'Etwas weniger', more: 'Etwas mehr', same: 'Weiter wie geplant' }[s.res.kind];
      return `<div class="stack"><div class="card ${col} rings-bg stack" style="gap:8px"><div class="eyebrow">Ergebnis</div><h2 class="xl">${title}</h2><div style="font-weight:700">${esc(s.res.text)}</div></div>
        <div class="small muted">Gilt für diese Woche. Nächste Woche fragt die App erneut. Die Wochen des Zyklus (Aufbau, Peak, Deload) laufen normal weiter.</div>
        <button class="btn primary" data-a="closeSheet">Alles klar</button></div>`;
    },
    day(s) {
      const p = plan(); const d = p.days[s.i]; const loc = s.loc || st.homeLoc || defLoc();
      const sl = d.slots.filter(x => x.ex[loc]);
      return `<div class="stack"><div class="card ${s.i % 2 ? 'lilac' : 'lav'} daycard" style="min-height:150px"><div class="txt"><h2>${esc(d.name)}</h2><span class="tag" style="align-self:flex-start">${sl.length} Übungen</span><div class="small" style="font-weight:800;margin-top:auto">${esc(dayFocus(d, loc))}</div></div><div class="minbadge">${estMinutes(d, loc)}<small>min</small></div><div class="figwrap figdark">${figSVG(heroEx(d, loc), { anim: 2.8 })}</div></div>
        ${locs().length > 1 ? `<div class="seg">${['home', 'gym'].map(l => `<button data-a="dayLoc" data-l="${l}" aria-pressed="${loc === l}">${LOCN[l]}</button>`).join('')}</div>` : ''}
        <div class="list">${sl.map(x => { const ex = getEx(x.ex[loc]); const pr = E.prescription(x, ex, P(), p); return `<button class="li" data-a="exInfo" data-id="${ex.id}">${thumb(ex)}<div class="grow"><b>${favMark(ex.id)}${esc(ex.name)}</b>${noteChip(ex.id)}<div class="small muted">${pr.sets} × ${rrText(pr.rr, ex)}${ex.uni ? ' pro Seite' : ''}</div></div><span class="chev">${I.chev}</span></button>`; }).join('')}</div>
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
    weights(s) {
      const ex = getEx(s.id); const loc = st.active ? st.active.loc : (st.planLoc || defLoc());
      const own = ownW(ex, loc); const std = (() => { const p = clone(P()); if (p.exW) delete p.exW[ex.id + '@' + loc]; return E.loadOptions(ex, loc, p) || []; })().filter(x => x > 0);
      if (s.v == null) s.v = (own || []).map(x => fmt(x)).join('; ');
      return `<div class="stack"><div><div class="eyebrow">${LOCN[loc]} · ${ex.kind === 'bw' ? 'Zusatzgewicht' : 'Gewicht'}</div><h2>Gewichte für ${esc(ex.name)}</h2><div class="small muted">Trag nur die Gewichte ein, die du bei dieser Übung wirklich einstellen kannst. Die Empfehlung wählt dann immer eins davon.</div></div>
        <div><label class="lbl" for="w-list">Gewichte in kg (mit ; trennen)</label><input class="field" id="w-list" inputmode="text" data-in="wList" value="${esc(s.v)}" placeholder="z. B. 4; 6; 8; 12,5"></div>
        <div class="chips" id="w-prev" style="flex-wrap:wrap">${wChips(s.v)}</div>
        <div class="tiny muted">Ohne eigene Liste gilt: ${std.length ? std.slice(0, 12).map(x => fmt(x)).join(', ') + (std.length > 12 ? ' …' : '') + ' kg' : 'Standard aus deinem Fragebogen'}.</div>
        <div class="row"><button class="btn primary grow" data-a="wSave">Speichern</button>${own ? '<button class="btn" data-a="wReset">Standard</button>' : ''}</div></div>`;
    },
    note(s) {
      const e = st.active.exercises[s.i]; const ex = getEx(e.exId); const prev = prevEntry(ex.id); const keep = exNote(ex.id);
      if (s.v == null) s.v = e.note || (keep && keep.t) || '';
      return `<div class="stack"><h2>Notiz · ${esc(ex.name)}</h2>${prev && prev.entry.note && prev.entry.note !== s.v ? `<div class="card flat small"><span class="muted">Letztes Mal:</span> ${esc(prev.entry.note)}</div>` : ''}
        <textarea class="field" id="noteText" data-in="noteText" rows="4" placeholder="z. B. Griffbreite, Sitzhöhe, Schmerzen, Tempo …">${esc(s.v)}</textarea>
        <div class="tiny muted">Die Notiz bleibt bei dieser Übung und wird in allen kommenden Einheiten, im Plan und in der Übungsinfo angezeigt – bis du sie änderst oder löschst.</div>
        <div class="row"><button class="btn primary grow" data-a="noteSave">Speichern</button>${s.v ? '<button class="btn" data-a="noteClear">Löschen</button>' : ''}</div></div>`;
    },
    plates(s) {
      const bar = s.bar || 20; const w = s.w || 60;
      return `<div class="stack"><h2>Scheibenrechner</h2><div class="small muted" style="margin-top:-8px">Gesamtgewicht und Stange wählen</div>
        <div class="stepper"><button data-a="plateStep" data-d="-2.5">−</button><input id="plateW" inputmode="decimal" data-in="plateW" value="${fmt(w)}" aria-label="Zielgewicht"><button data-a="plateStep" data-d="2.5">+</button></div>
        <div class="seg">${[20, 15, 10].map(b => `<button data-a="plateBar" data-b="${b}" aria-pressed="${bar === b}">${b} kg</button>`).join('')}</div>
        <div class="card" id="plateRes">${plateRes(s)}</div></div>`;
    },
    _plateRes(s) {
      const bar = s.bar || 20; const w = s.w || 60;
      const per = Math.max(0, (w - bar) / 2); const PL = [[25, 'var(--rose)'], [20, 'var(--lav)'], [15, 'var(--warn)'], [10, 'var(--good)'], [5, '#fff'], [2.5, '#9C9CA7'], [1.25, '#6E6E78']];
      let rest = per; const use = [];
      for (const [p, c] of PL) while (rest >= p - 1e-6) { use.push([p, c]); rest = Math.round((rest - p) * 100) / 100; }
      const h = p => 34 + p * 3.2;
      const side = use.map(([p, c]) => `<div class="pl" style="height:${h(p)}px;background:${c}">${fmt(p)}</div>`).join('');
      return `<div class="platebar"><div class="sleeve"></div>${[...use].reverse().map(([p, c]) => `<div class="pl" style="height:${h(p)}px;background:${c}">${fmt(p)}</div>`).join('')}<div class="bar"></div>${side}<div class="sleeve"></div></div>
        <div class="small ink2" style="text-align:center">${use.length ? 'Pro Seite: ' + use.map(u => fmt(u[0])).join(' + ') + ' kg' : 'Nur die Stange'}${rest > 0 ? ' · ' + fmt(rest * 2) + ' kg nicht darstellbar' : ''}</div>`;
    },
    slot(s) {
      const p = plan(); const day = p.days[s.d]; const sl = day.slots[s.s]; const loc = st.planLoc || defLoc();
      const ex = getEx(sl.ex[loc]);
      const alts = E.alternatives(sl, loc, P(), day.slots.filter(x => x !== sl).map(x => x.ex[loc])).filter(x => x.ex.id !== (ex && ex.id)).slice(0, 12);
      const pr = ex ? E.prescription(sl, ex, P(), p) : null; const rr = sl.custRR || (pr && pr.rr) || [8, 12];
      return `<div class="stack"><div><div class="eyebrow">${esc(day.name)} · ${ROLE[sl.r][1]}</div><h2>${ex ? esc(ex.name) : 'Keine Übung'}</h2></div>
        <div class="minigrid">${[['sets', 'Sätze', sl.sets, 1], ['rest', 'Pause (Sek.)', sl.rest, 15], ['lo', (ex && (ex.kind === 'hold' || ex.kind === 'int') ? 'Sek.' : 'Wdh.') + ' von', rr[0], ex && ex.kind === 'hold' ? 5 : 1], ['hi', (ex && (ex.kind === 'hold' || ex.kind === 'int') ? 'Sek.' : 'Wdh.') + ' bis', rr[1], ex && ex.kind === 'hold' ? 5 : 1]].map(([k, l, v, st1]) => `<div><label class="lbl" for="sl-${k}">${l}</label><div class="mini"><button data-a="slotStep" data-k="${k}" data-d="${-st1}" aria-label="weniger">−</button><input class="num" id="sl-${k}" inputmode="numeric" data-in="slot" data-k="${k}" value="${v}"><button data-a="slotStep" data-k="${k}" data-d="${st1}" aria-label="mehr">+</button></div></div>`).join('')}</div>
        <div><div class="lbl">Rolle im Plan</div><div class="chips">${Object.keys(ROLE).map(r => `<button class="chip ${sl.r === r ? 'set' : ''}" data-a="slotRole" data-r="${r}">${ROLE[r][1]}</button>`).join('')}</div></div>
        ${sl.ss && day.slots.filter(x => x.ss === sl.ss).length > 1 ? `<button class="btn sm" data-a="ssUnlinkP">⇄ Supersatz auflösen</button>` : s.s < day.slots.length - 1 && day.slots[s.s + 1].ex[loc] ? `<button class="btn sm" data-a="ssLinkP">⇄ Supersatz mit „${esc((getEx(day.slots[s.s + 1].ex[loc]) || {}).name || 'nächster Übung')}“</button>` : ''}
        ${ex ? noteChip(ex.id) : ''}
        <div class="row"><button class="btn sm" data-a="slotMove" data-dir="-1">Nach oben</button><button class="btn sm" data-a="slotMove" data-dir="1">Nach unten</button><span class="grow"></span>${s.confirm ? '<button class="btn sm danger" data-a="slotDelYes">Wirklich entfernen</button>' : '<button class="btn sm danger" data-a="slotDel">Entfernen</button>'}</div>
        <div class="section"><div class="head"><h3>Tauschen gegen</h3><span class="small muted">beste Treffer zuerst</span></div>
        <div class="list">${alts.map(x => `<button class="li" data-a="slotSwap" data-id="${x.ex.id}"><div class="grow"><div style="font-weight:600">${esc(x.ex.name)}</div><div class="small muted">${x.ex.eq.map(e => D.EQUIP[e]).join(' + ')}</div>${x.reasons.length ? `<div class="why" style="margin-top:3px">${x.reasons.map(w => `<span>${esc(w)}</span>`).join('')}</div>` : ''}</div><span class="chev">${I.swap}</span></button>`).join('') || '<div class="li muted small">Keine Alternativen mit deiner Ausrüstung.</div>'}</div>
        <button class="btn" data-a="pickEx" data-mode="slot" data-d="${s.d}" data-s="${s.s}">Aus allen Übungen wählen</button></div></div>`;
    },
    pick(s) {
      const loc = st.active ? st.active.loc : (st.planLoc || defLoc());
      return `<div class="stack pickbox"><h2>Übung wählen</h2><input class="field" id="pickq" type="search" data-in="pickQ" placeholder="Suchen" value="${esc(s.q || '')}">
        <label class="row small"><input type="checkbox" data-a="pickAll" ${s.all ? 'checked' : ''}> Auch Übungen ohne passende Ausrüstung (${LOCN[loc]})</label>
        <button class="btn" data-a="customFrom">${I.plus} Nicht dabei? Eigene Übung anlegen</button>
        <div class="list" id="pickRes">${pickResults(s)}</div></div>`;
    },
    backups(s) {
      if (!s.items) return `<div class="stack"><h2>Sicherungen</h2><div class="muted">Lädt …</div></div>`;
      const est = s.est ? `<div class="small muted">Belegt: ${fmt(s.est.usage / 1048576, 1)} MB${s.est.quota ? ' von ' + fmt(s.est.quota / 1048576, 0) + ' MB' : ''}${s.persisted ? ' · dauerhaft geschützt' : ''}</div>` : '';
      return `<div class="stack"><h2>Sicherungen</h2>
        ${s.warn ? `<div class="card" style="border:2px solid var(--rose)"><b>Deine Daten wurden nicht gefunden oder sind beschädigt.</b><div class="small">Stelle eine Sicherung wieder her. Beschädigte Daten bleiben unter „satzwerk.corrupt.*“ erhalten.</div></div>` : ''}
        <div class="small muted">Satzwerk legt automatisch Sicherungen auf diesem Gerät an (nach jedem Training und vor jeder größeren Änderung). Der Speicher wird mit den anderen Apps auf dieser Adresse geteilt (z. B. Lernwerk, Kochwerk) – exportiere deshalb ab und zu ein Backup in „Dateien“.</div>${est}
        ${s.items.length ? `<div class="list">${s.items.map(x => `<div class="li" style="flex-wrap:wrap"><div class="grow"><b>${new Date(x.ts).toLocaleString('de-DE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</b><div class="small muted">${esc(SNAP_LBL[x.reason] || x.reason)} · ${(x.workouts || []).length} Trainings${x.profile && x.profile.plan ? ' · ' + esc(x.profile.plan.name || x.profile.plan.splitName || '') : ''}</div></div>
          ${s.confirm === x.id ? `<button class="btn danger sm" data-a="bkRestoreYes" data-id="${x.id}">Wirklich wiederherstellen</button>` : `<button class="btn sm" data-a="bkRestore" data-id="${x.id}">Wiederherstellen</button>`}<button class="btn sm" data-a="bkFile" data-id="${x.id}">Als Datei</button></div>`).join('')}</div>` : '<div class="empty">Noch keine Sicherung vorhanden.</div>'}</div>`;
    },
    importPreview(s) {
      const d = s.d; const have = new Set(st.workouts.map(w => w.id)); const ws = d.workouts || []; const nNew = ws.filter(w => !have.has(w.id)).length;
      const pl = d.profile.plan; const plName = (d.profile.plans || []).length > 1 ? d.profile.plans.length + ' Pläne' : pl ? (pl.name || pl.splitName || 'Plan') : 'kein Plan';
      return `<div class="stack"><h2>Backup importieren</h2>
        <div class="card stack" style="gap:4px"><div>Datei vom <b>${d.exported ? dateDE(d.exported.slice(0, 10)) : 'unbekannt'}</b>${d.appVersion ? ' · Version ' + esc(d.appVersion) : ''}</div><div>${ws.length} Trainings, davon <b>${nNew} neu</b></div><div>Plan: ${esc(plName)}</div></div>
        <button class="btn primary big" data-a="impMerge">Zusammenführen</button>
        <div class="tiny muted" style="margin-top:-6px">Fehlende Trainings werden ergänzt${st.profile ? ', dein Plan und deine Einstellungen bleiben' : ''}.</div>
        ${s.confirm ? '<button class="btn danger" data-a="impReplaceYes">Wirklich alles ersetzen</button>' : '<button class="btn" data-a="impReplace">Alles ersetzen</button>'}
        <div class="tiny muted">Vorher wird automatisch eine Sicherung angelegt.</div></div>`;
    },
    stale(s) {
      const a = st.active; const n = a.exercises.reduce((t, e) => t + e.sets.filter(x => x.done).length, 0);
      return `<div class="stack"><h2>Training noch offen</h2><div class="small muted">${esc(a.name)} · begonnen ${dateDE(E.todayISO(new Date(a.start)))} · ${n} Sätze erledigt</div>
        <button class="btn primary big" data-a="staleSave" ${n ? '' : 'disabled'}>Speichern und beenden</button>
        <button class="btn" data-a="staleGo">Weiter trainieren</button>
        ${s.confirm ? '<button class="btn danger" data-a="staleDropYes">Wirklich verwerfen</button>' : '<button class="btn ghost" data-a="staleDrop">Verwerfen</button>'}</div>`;
    },
    plans() {
      const pr = P(); const list = pr.plans || [plan()];
      return `<div class="stack"><h2>Deine Pläne</h2><div class="small muted">Tippe auf einen Plan, um ihn zu aktivieren, umzubenennen, zu kopieren oder zu löschen. Verlauf und Rekorde gehören zu den Übungen und bleiben bei jedem Plan erhalten.</div>
        <div class="list">${list.map(x => `<button class="li" data-a="planOpen" data-id="${x.id}" ${x.id === pr.planId ? 'style="box-shadow:inset 0 0 0 2px var(--lime)"' : ''}><div class="grow"><b>${esc(x.name || x.splitName)}</b><div class="small muted">${x.days.length} Tage · ${x.custom ? 'Eigener Plan' : 'Empfohlen' + (x.edited ? ', angepasst' : '')}${x.id === pr.planId ? ' · <b style="color:var(--lime)">aktiv</b>' : ''}</div></div><span class="chev">${I.chev}</span></button>`).join('')}</div>
        <button class="btn primary" data-a="planNew">${I.plus} Neuer Plan</button></div>`;
    },
    planMenu(s) {
      const pr = P(); const x = (pr.plans || []).find(p => p.id === s.id); if (!x) return '<div class="stack"><h2>Plan nicht gefunden</h2></div>';
      const act = x.id === pr.planId;
      return `<div class="stack"><h2>${esc(x.name || x.splitName)}</h2>
        <div><label class="lbl" for="pl-name">Name</label><input class="field" id="pl-name" data-in="planName" data-id="${x.id}" value="${esc(x.name || '')}"></div>
        <div class="small muted">${x.days.map(d => esc(d.name)).join(' · ')}</div>
        ${act ? '<div class="small" style="font-weight:800">Dieser Plan ist aktiv.</div>' : `<button class="btn primary big" data-a="planAct" data-id="${x.id}">Diesen Plan aktivieren</button>`}
        <button class="btn" data-a="planDup" data-id="${x.id}">Kopieren</button>
        ${(pr.plans || []).length > 1 ? (s.confirm ? `<button class="btn danger" data-a="planDelYes" data-id="${x.id}">Wirklich löschen</button>` : `<button class="btn ghost" data-a="planDel">Plan löschen</button>`) : ''}
        <button class="btn ghost" data-a="plans">Zurück zur Liste</button></div>`;
    },
    planNew(s) {
      const segN = [1, 2, 3, 4, 5, 6].map(n => `<button data-a="pnN" data-n="${n}" aria-pressed="${s.n === n}">${n}</button>`).join('');
      return `<div class="stack"><h2>Neuer Plan</h2>
        <div><label class="lbl" for="pn-name">Name</label><input class="field" id="pn-name" data-in="pnName" value="${esc(s.name)}"></div>
        <div><div class="lbl">Tage pro Woche</div><div class="seg">${segN}</div></div>
        <button class="btn primary" data-a="pnCreate" data-k="empty">Leer anfangen (${s.n} Tage)</button>
        <div class="card stack" style="gap:10px"><b>Aus Vorlage</b><div class="seg">${[['fb', 'Ganzkörper'], ['ul', 'OK / UK'], ['ppl', 'Push/Pull/Beine']].map(([k, n]) => `<button data-a="pnSplit" data-k="${k}" aria-pressed="${s.split === k}">${n}</button>`).join('')}</div>
          <div class="small muted">Übungen passend zu deiner Ausrüstung; danach frei änderbar.</div><button class="btn" data-a="pnCreate" data-k="tpl" ${s.n < 2 ? 'disabled' : ''}>Vorlage mit ${s.n} Tagen</button></div>
        <button class="btn" data-a="pnCreate" data-k="copy">Kopie des aktuellen Plans</button>
        <button class="btn ghost" data-a="quizEdit">Neu empfehlen lassen (Fragebogen)</button></div>`;
    },
    dayEdit(s) {
      const p = plan(); const d = p.days[s.d]; if (!d) return '';
      return `<div class="stack"><h2>${s.fresh ? 'Neuer Tag' : 'Tag bearbeiten'}</h2>
        <div><label class="lbl" for="day-name">Name</label><input class="field" id="day-name" data-in="dayName" value="${esc(d.name)}"></div>
        <div class="row"><button class="btn grow" data-a="dayMove" data-dir="-1" ${s.d === 0 ? 'disabled' : ''}>Nach oben</button><button class="btn grow" data-a="dayMove" data-dir="1" ${s.d === p.days.length - 1 ? 'disabled' : ''}>Nach unten</button></div>
        <button class="btn" data-a="pickEx" data-mode="plan" data-d="${s.d}">${I.plus} Übung hinzufügen</button>
        <button class="btn" data-a="dayDup">Tag kopieren</button>
        ${p.days.length > 1 ? (s.confirm ? '<button class="btn danger" data-a="dayDelYes">Wirklich löschen</button>' : '<button class="btn ghost" data-a="dayDel">Tag löschen</button>') : ''}
        <button class="btn primary" data-a="closeSheet">Fertig</button></div>`;
    },
    balanceInfo(s) {
      const ch = s.ch || [];
      return `<div class="stack"><div><div class="eyebrow">Effizienz</div><h2>${ch.length ? 'Plan ausbalanciert' : 'Plan passt schon'}</h2><div class="small muted">Ziel: jeder Muskel ~10 harte Sätze pro Woche (Schwerpunkte ~14), nicht über 15. Deine eigenen Übungen und die Reihenfolge bleiben, festgelegte Übungen werden nicht angefasst.</div></div>
        ${ch.length ? `<div class="list">${ch.map(c => `<div class="li small">${esc(c)}</div>`).join('')}</div>` : '<div class="small">Alle Muskeln liegen schon im effizienten Bereich.</div>'}
        ${s.preview && ch.length ? '<div class="small" style="font-weight:800">Das würde sich ändern. Übernehmen?</div><button class="btn primary" data-a="balanceApply">Übernehmen</button><button class="btn ghost" data-a="closeSheet">Abbrechen</button>' : '<button class="btn primary" data-a="closeSheet">Alles klar</button>'}</div>`;
    },
    time(s) {
      const p = plan(); const day = p.days[s.d];
      const en = s.en ?? 1, sl = s.sl ?? 1, ti = s.ti ?? 1;
      const delta = tfDelta(s);
      const tp = delta ? E.timePlan(day, s.l, delta, P(), p) : null;
      const items = tp ? tp.items.map(it => ({ ex: it.ex, sets: it.spec ? it.sets : E.prescription(it.slot, it.ex, P(), p).sets + (it.boost || 0) }))
        : day.slots.filter(x => x.ex[s.l]).map(x => { const ex = getEx(x.ex[s.l]); return { ex, sets: ex ? E.prescription(x, ex, P(), p).sets : 0 }; }).filter(x => x.ex);
      const min = tp ? tp.minutes : estMinutes(day, s.l);
      const grp = (k, label, opts, v) => `<div><div class="eyebrow" style="margin-bottom:8px">${label}</div><div class="tfrow">${opts.map((o, i) => `<button class="tf" data-a="tfPick" data-k="${k}" data-v="${i}" aria-pressed="${v === i}">${o}</button>`).join('')}</div></div>`;
      const label = { '-2': 'Deutlich kürzer', '-1': 'Etwas kürzer', '0': 'Wie geplant', '1': 'Etwas länger', '2': 'Deutlich länger' }[delta];
      return `<div class="stack"><div><div class="eyebrow">${esc(day.name)}</div><h2>Wie geht’s dir heute?</h2></div>
        ${grp('en', 'Energie', ['Niedrig', 'Normal', 'Hoch'], en)}${grp('sl', 'Schlaf', ['Schlecht', 'Okay', 'Gut'], sl)}${grp('ti', 'Zeit', ['Knapp', 'Normal', 'Viel'], ti)}
        <div class="card navy stack" style="gap:10px"><div class="row between"><div class="eyebrow">Dein Plan heute</div><span class="small ink2 num">${label} · ≈ ${min} min</span></div>
          <div class="planlist">${items.map(it => `<div class="pl-row">${thumb(it.ex)}<span class="grow ell">${esc(it.ex.name)}</span><span class="num muted">${it.sets} Sätze</span></div>`).join('')}</div>
          ${tp && tp.notes.length ? `<div class="tiny ink2">${esc(tp.notes.join(' · '))}</div>` : ''}</div>
        <button class="btn primary big" data-a="tfGo">Training starten</button>
        <div class="tiny muted">Energie und Schlaf ändern nur die Länge der Einheit: kürzer heißt, weniger wichtige Übungen entfallen. Gewichte und Wiederholungen bestimmt weiter deine Satzleistung.</div></div>`;
    },
    level(s) {
      const entry = st.active.exercises[s.i]; const S = exState(entry); const ex = S.ex; const nb = levelNeighbors(entry); const rc = levelRec(entry, S, nb);
      const [lo, hi] = S.presc.rr; const u = ex.kind === 'hold' ? ' s' : ' Wdh.';
      const why = { easier: ex.kind === 'load' ? `Wenn du heute weniger als ${lo}${u} sauber schaffst oder die Form leidet` : `Wenn du weniger als ${lo}${u} schaffst oder heute nicht dein Tag ist`, cur: `Wenn du im Zielbereich ${lo}–${hi}${u} landest`, harder: ex.kind === 'load' ? `Wenn das Gewicht zu leicht ist und du mehr als ${hi}${u} schaffst` : `Wenn du locker mehr als ${hi}${u} schaffst` };
      const recWhy = { easier: S.rec.dayForm != null && S.rec.dayForm <= -0.08 ? 'Deine Tagesform ist heute niedriger' : 'Du liegst unter dem Zielbereich', harder: ex.kind === 'load' ? 'Das Gewicht ist für dich zu leicht' : 'Du schaffst mehr als den Zielbereich', cur: S.done.length || (S.hist && S.hist.length) ? 'Du liegst gut im Zielbereich' : 'Passt zu deinem aktuellen Stand' };
      const card = (k, e, label) => !e ? '' : `<button class="lvlopt ${rc === k ? 'rec' : ''}" ${k === 'cur' ? 'data-a="closeSheet"' : `data-a="levelPick" data-id="${e.id}"`}>${thumb(e)}<div class="grow" style="min-width:0"><div class="row between" style="gap:6px"><span class="eyebrow">${label}</span>${rc === k ? '<span class="rectag">Empfohlen</span>' : ''}</div><b>${esc(e.name)}</b><div class="tiny muted">Lvl ${e.lvl} · ${esc(why[k])}</div>${rc === k ? `<div class="tiny" style="color:var(--lime);margin-top:2px">${esc(recWhy[k])}</div>` : ''}</div></button>`;
      return `<div class="stack"><div><div class="eyebrow">Heute anpassen</div><h2>Leichter oder schwerer?</h2></div>
        <div class="stack" style="gap:10px">${card('harder', nb.harder, '▲ Schwerer')}${card('cur', ex, '● Aktuell')}${card('easier', nb.easier, '▼ Leichter')}</div>
        <div class="tiny muted">Bereits gemachte Sätze bleiben gespeichert. Der Plan ändert sich nicht.</div></div>`;
    },
    swapWorkout(s) {
      const entry = st.active.exercises[s.i]; const ex = getEx(entry.exId);
      const slot = findSlot(entry) || { p: [ex.pat], r: entry.presc.role };
      const alts = E.alternatives(slot, st.active.loc, P(), st.active.exercises.map(e => e.exId)).filter(x => x.ex.id !== ex.id).slice(0, 12);
      return `<div class="stack"><div><div class="eyebrow">Tauschen</div><h2>${esc(ex.name)}</h2></div>
        ${entry.slotId ? `<label class="row small"><input type="checkbox" id="swapPlan" data-a="swapPlanToggle" ${s.plan ? 'checked' : ''}> Auch dauerhaft im Plan tauschen</label>` : ''}
        <div class="list">${alts.map(x => `<button class="li" data-a="swapDo" data-id="${x.ex.id}"><div class="grow"><div style="font-weight:600">${esc(x.ex.name)}</div><div class="small muted">${x.ex.eq.map(e => D.EQUIP[e]).join(' + ')}</div>${x.reasons.length ? `<div class="why" style="margin-top:3px">${x.reasons.map(w => `<span>${esc(w)}</span>`).join('')}</div>` : ''}</div></button>`).join('')}</div>
        <div class="row wrap"><button class="btn grow" data-a="pickEx" data-mode="swapWorkout" data-i="${s.i}">Aus allen Übungen wählen</button><button class="btn grow" data-a="customFrom">${I.plus} Eigene Übung anlegen</button></div></div>`;
    },
    exMenu(s) {
      const entry = st.active.exercises[s.i]; const ex = getEx(entry.exId);
      return `<div class="stack"><h2>${esc(ex.name)}</h2>
        <button class="btn" data-a="exInfo" data-id="${ex.id}">${I.info} Anleitung & Verlauf</button>
        ${(() => { const S = exState(entry); return S.planned > Math.max(1, S.done.length) ? `<button class="btn" data-a="setMinus" data-i="${s.i}">− 1 Satz weniger</button>` : ''; })()}
        ${ex.eq.includes('bb') && ex.kind === 'load' ? `<button class="btn" data-a="plates" data-i="${s.i}">Scheibenrechner</button>` : ''}
        ${entry.ss && st.active.exercises.filter(x => x.ss === entry.ss).length > 1 ? `<button class="btn" data-a="ssUnlinkW" data-i="${s.i}">⇄ Supersatz auflösen</button>` : s.i < st.active.exercises.length - 1 ? `<button class="btn" data-a="ssLinkW" data-i="${s.i}">⇄ Supersatz mit „${esc(getEx(st.active.exercises[s.i + 1].exId).name)}“</button>` : ''}
        ${ex.kind === 'load' || (ex.kind === 'bw' && ex.addw) ? `<button class="btn" data-a="wOpen" data-id="${ex.id}">⚖ Verfügbare Gewichte festlegen</button>` : ''}
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
      const gs = {}; for (const g in D.GROUPS) gs[g] = 0;
      for (const e of w.exercises) { const ex = getEx(e.exId); if (!ex) continue; const n = e.sets.length; for (const g in D.GROUPS) { const ms = D.GROUPS[g]; if (ex.prim.some(m => ms.includes(m))) gs[g] += n; else if ((ex.sec || []).some(m => ms.includes(m))) gs[g] += n * 0.5; } }
      const gl = Object.keys(gs).filter(g => gs[g] > 0).sort((a, b) => gs[b] - gs[a]); const mx = Math.max(1, ...gl.map(g => gs[g]));
      const vol = w.vol >= 10000 ? fmt(w.vol / 1000, 1) + ' t' : fmt(w.vol || 0) + ' kg';
      return `<div class="stack"><div><div class="eyebrow">Gespeichert · ${esc(w.name)}</div><h2 style="font-size:30px;font-weight:900">Starkes Training</h2></div>
        <div class="kpi4"><div><b>${durTxt(w.dur)}</b><span>Dauer</span></div><div><b>${sets}</b><span>Sätze</span></div><div><b class="ell">${vol}</b><span>Volumen</span></div><div><b>${w.prs.length}</b><span>Rekorde</span></div></div>
        ${w.prs.length ? `<div class="reccard"><div class="eyebrow">Neuer Rekord</div>${w.prs.map(id => `<div class="ell" style="font-weight:800;font-size:17px">${esc(getEx(id).name)}</div>`).join('')}</div>` : ''}
        ${gl.length ? `<div class="card stack" style="gap:10px"><div class="eyebrow">Trainierte Muskeln</div><div class="bars">${gl.map(g => `<div class="bar"><span class="ell">${g}</span><div class="track"><i style="width:${gs[g] / mx * 100}%"></i></div><span class="num small" style="text-align:right">${fmt(gs[g], 1)}</span></div>`).join('')}</div></div>` : ''}
        <div class="card stack" style="gap:10px"><div class="eyebrow">Wie war das Training?</div><div class="rate">${[1, 2, 3, 4, 5].map(r => `<button data-a="rateW" data-r="${r}" aria-pressed="${w.rating === r}">${r}</button>`).join('')}</div><div class="row between tiny muted"><span>schwer</span><span>super</span></div></div>
        <p class="small ink2" style="margin:0">Nächste Einheit: <b>${esc((plan().days[nextDayIdx()] || {}).name || '')}</b>.</p>
        <button class="btn primary big" data-a="closeSheet">Fertig</button></div>`;
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
        <div class="list">${tog('autoRest', 'Pausentimer automatisch', 'Startet nach jedem Satz')}${tog('quick', 'Schnell abhaken', '„Satz fertig“ speichert sofort mit der Ziel-Reserve – antippen der Satznummer korrigiert')}${tog('sound', 'Töne', 'Auf dem iPhone nur, wenn der Stumm-Schalter aus ist')}${tog('vib', 'Vibration', 'Geht auf dem iPhone in Web-Apps nicht – dafür blinkt das Pausenfeld')}${tog('rpe', 'RPE statt Reserve anzeigen', 'RPE 8 = 2 Wdh. Reserve')}</div>
        <div class="tiny muted" style="margin-top:-6px">Bei gesperrtem Bildschirm kann eine Web-App nichts melden. Im Training bleibt der Bildschirm deshalb an.</div>
        <div class="card stack" style="gap:8px"><b>Spiel- und Trainingstage (z. B. Baseball)</b><div class="small muted">An diesen Tagen und am Tag davor warnt die App vor schweren Bein- und Überkopfübungen.</div><div class="seg">${DAYS.map((d, k) => `<button data-a="sportDay" data-k="${k}" aria-pressed="${(P().sportDays || []).includes(k)}">${d}</button>`).join('')}</div></div>
        <div class="card stack"><b>Studio-Gewichte</b><div class="row"><div class="grow"><label class="lbl" for="set-bb">Langhantel-Schritt</label><select class="field" id="set-bb" data-in="setNum" data-k="bbStep">${[1, 2, 2.5, 5].map(v => `<option value="${v}" ${se.bbStep == v ? 'selected' : ''}>${fmt(v)} kg</option>`).join('')}</select></div><div class="grow"><label class="lbl" for="set-st">Maschinen-Schritt</label><select class="field" id="set-st" data-in="setNum" data-k="stackStep">${[1.25, 2.5, 5, 7].map(v => `<option value="${v}" ${se.stackStep == v ? 'selected' : ''}>${fmt(v)} kg</option>`).join('')}</select></div></div></div>
        <div class="card stack"><b>Datensicherung</b><div class="small muted">${Store.mode === 'db' ? 'Deine Daten werden in deinem Konto gespeichert und sind auf allen Geräten verfügbar, auf denen du angemeldet bist.' : 'Deine Daten liegen nur in diesem Browser. Mach ab und zu ein Backup.'}</div>
          <div class="small muted">${P() && P().lastExport ? 'Letztes Backup: ' + dateDE(P().lastExport) : 'Noch kein Backup exportiert.'}</div>
          <button class="btn" data-a="backups">Sicherungen auf diesem Gerät</button>
          <div class="row wrap"><button class="btn grow" data-a="exportData">Backup exportieren</button><label class="btn grow" for="importFile" style="cursor:pointer">Backup importieren</label><input type="file" id="importFile" accept=".json,application/json" data-in="importFile" hidden></div></div>
        <button class="btn" data-a="quizEdit">Fragebogen bearbeiten</button>
        ${s.confirm ? '<div class="small muted">Eine Sicherung bleibt unter „Sicherungen“ erhalten.</div><button class="btn danger" data-a="resetYes">Wirklich alles löschen</button>' : '<button class="btn danger" data-a="reset">Alle Daten löschen</button>'}
        <p class="tiny muted" style="margin:0">Satzwerk ersetzt keine ärztliche Beratung. Bei Schmerzen Übung abbrechen.</p>
        <p class="tiny muted" style="margin:0;text-align:center">Satzwerk ${APP_VERSION}</p></div>`;
    },
    rebuild() {
      return `<div class="stack"><h2>Neuen Plan berechnen?</h2><p class="ink2" style="margin:0">Mit deinen Antworten aus dem Fragebogen wird ein neuer Plan erstellt und aktiviert. Dein bisheriger Plan bleibt unter „Pläne“ erhalten, dein Trainingsverlauf sowieso.</p><button class="btn primary" data-a="rebuildYes">Neu berechnen</button><button class="btn ghost" data-a="closeSheet">Abbrechen</button></div>`;
    },
    addToPlan(s) {
      const ex = getEx(s.id);
      return `<div class="stack"><h2>${esc(ex.name)} hinzufügen</h2><div class="list">${plan().days.map((d, i) => `<button class="li" data-a="addToPlanDo" data-d="${i}" data-id="${ex.id}"><div class="grow">${esc(d.name)}</div><span class="chev">${I.chev}</span></button>`).join('')}</div></div>`;
    },
    custom(s) {
      const c = s.c || (s.c = { name: '', pat: 'biceps', kind: 'load', prim: [], eq: ['bw'], lo: 8, hi: 12 });
      return `<div class="stack"><div>${s.ret ? `<div class="eyebrow">${s.ret.mode === 'swapWorkout' || s.ret.mode === 'slot' ? 'Ersetzt ' + esc(s.base || 'die Übung') : s.ret.mode === 'plan' ? 'Kommt in den Plan' : 'Kommt ins Training'}</div>` : ''}<h2>Eigene Übung</h2>${s.base ? `<div class="small muted">Vorausgefüllt wie „${esc(s.base)}“ – nur Name und Unterschiede anpassen.</div>` : ''}</div>
        <div><label class="lbl" for="cx-name">Name</label><input class="field" id="cx-name" data-in="cx" data-k="name" value="${esc(c.name)}" placeholder="z. B. Zottman-Curls"><div id="cx-hit">${cxHit(c.name, !!s.ret)}</div></div>
        <div class="row"><div class="grow"><label class="lbl" for="cx-pat">Bewegung</label><select class="field" id="cx-pat" data-in="cx" data-k="pat">${Object.entries(D.PATTERNS).map(([k, v]) => `<option value="${k}" ${c.pat === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
        <div class="grow"><label class="lbl" for="cx-kind">Art</label><select class="field" id="cx-kind" data-in="cx" data-k="kind">${[['load', 'Mit Gewicht'], ['bw', 'Körpergewicht'], ['hold', 'Halten (Sekunden)']].map(([k, v]) => `<option value="${k}" ${c.kind === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div></div>
        <div><div class="lbl">Muskeln</div><div class="row wrap">${Object.entries(D.MUSCLES).map(([k, v]) => `<button class="chip ${c.prim.includes(k) ? 'on' : ''}" data-a="cxMuscle" data-k="${k}">${v}</button>`).join('')}</div></div>
        <div><div class="lbl">Geräte</div><div class="row wrap">${Object.entries(D.EQUIP).map(([k, v]) => `<button class="chip ${c.eq.includes(k) ? 'on' : ''}" data-a="cxEq" data-k="${k}">${v}</button>`).join('')}</div></div>
        <div class="row"><div class="grow"><label class="lbl" for="cx-lo">${c.kind === 'hold' ? 'Sek. min' : 'Wdh. min'}</label><input class="field" id="cx-lo" inputmode="numeric" data-in="cx" data-k="lo" value="${c.lo}"></div><div class="grow"><label class="lbl" for="cx-hi">${c.kind === 'hold' ? 'Sek. max' : 'Wdh. max'}</label><input class="field" id="cx-hi" inputmode="numeric" data-in="cx" data-k="hi" value="${c.hi}"></div></div>
        <button class="btn primary" data-a="cxSave">${s.ret ? 'Anlegen & einsetzen' : 'Speichern'}</button></div>`;
    }
  };
  function cxHit(name, ret) { const b = name && name.trim().length > 3 ? findBuiltin(name) : null; return b ? `<button class="card flat row" style="margin-top:8px;width:100%;text-align:left;gap:10px" data-a="${ret ? 'cxUseBuiltin' : 'exInfo'}" data-id="${b.id}">${thumb(b)}<div class="grow small"><b>Gibt es schon:</b> ${esc(b.name)}<div class="muted">${ret ? 'Antippen, um diese Übung direkt einzusetzen' : 'Mit Bild, Anleitung und Empfehlungen – antippen'}</div></div></button>` : ''; }
  function wStep(ex) { const o = E.loadOptions(ex, st.active.loc, P()); if (o && o.length > 1) { let m = Infinity; for (let i = 1; i < o.length; i++) m = Math.min(m, o[i] - o[i - 1]); return isFinite(m) && m > 0 ? m : 2.5; } return ex.kind === 'bw' ? 2.5 : 1; }
  function findSlot(entry) { const p = plan(); if (!p || !entry.slotId) return null; for (const d of p.days) for (const s of d.slots) if (s.id === entry.slotId) return s; return null; }

  /* ================= Aktionen ================= */
  const A = {
    bandOpen(t) { const e = st.active.exercises[+t.dataset.i]; st.bandOpen = st.bandOpen === e.key ? null : e.key; renderOverlay(); },
    bandSet(t) { const e = st.active.exercises[+t.dataset.i]; e.band = t.dataset.k; e.draft = null; st.bandOpen = null; Store.saveActive(); renderOverlay(); const b = bandOf(e.band); toast(b ? 'Band ' + b.n + ' – Empfehlung angepasst' : 'Ohne Band'); },
    wOpen(t) { openSheet({ type: 'weights', id: t.dataset.id }); },
    wSave() { const s = st.sheet; const ex = getEx(s.id); const loc = st.active ? st.active.loc : (st.planLoc || defLoc()); const l = parseW(s.v); const p = P(); p.exW = p.exW || {}; if (l.length) p.exW[ex.id + '@' + loc] = l; else delete p.exW[ex.id + '@' + loc]; if (st.active) for (const e of st.active.exercises) if (e.exId === ex.id) e.draft = null; Store.saveProfile(); if (st.active) Store.saveActive(); closeSheet(); render(); toast(l.length ? 'Gewichte gespeichert: ' + l.map(x => fmt(x)).join(', ') + ' kg' : 'Standard-Gewichte'); },
    wReset() { st.sheet.v = ''; A.wSave(); },
    noteSave() { const s = st.sheet; const e = st.active.exercises[s.i]; const v = (s.v || '').trim(); e.note = v; const p = P(); p.exNotes = p.exNotes || {}; if (v) p.exNotes[e.exId] = { t: v, d: E.todayISO() }; else delete p.exNotes[e.exId]; Store.saveProfile(); Store.saveActive(); closeSheet(); render(); toast(v ? 'Notiz gespeichert – bleibt bei der Übung' : 'Notiz gelöscht'); },
    noteClear() { st.sheet.v = ''; A.noteSave(); },
    ssLinkW(t) { const i = +t.dataset.i; linkSS(st.active.exercises, i); Store.saveActive(); closeSheet(); renderOverlay(); toast('Supersatz erstellt'); },
    ssUnlinkW(t) { unlinkSS(st.active.exercises, +t.dataset.i); Store.saveActive(); closeSheet(); renderOverlay(); toast('Supersatz aufgelöst'); },
    ssLinkP() { const s = st.sheet; linkSS(plan().days[s.d].slots, s.s); touchPlan(); Store.saveProfile(); renderSheet(); render(); toast('Supersatz im Plan erstellt'); },
    ssUnlinkP() { const s = st.sheet; unlinkSS(plan().days[s.d].slots, s.s); touchPlan(); Store.saveProfile(); renderSheet(); render(); toast('Supersatz aufgelöst'); },
    howToggle() { st.howOpen = !st.howOpen; render(); },
    favToggle(t) {
      const id = t.dataset.id; const ex = getEx(id); const f = P().favs = P().favs || [];
      const i = f.indexOf(id); const on = i < 0;
      if (on) f.push(id); else f.splice(i, 1);
      if (autoPlan(plan())) E.refreshSelection(plan(), P());
      Store.saveProfile(); renderSheet(); render();
      const where = []; plan().days.forEach(d => d.slots.forEach(sl => { for (const l of locs()) if (sl.ex[l] === id) where.push(d.name + (locs().length > 1 ? ' (' + LOCN[l] + ')' : '')); }));
      if (!on) toast('Favorit entfernt. Die Übungsauswahl wurde neu bewertet.', 3500);
      else toast(where.length ? '★ Favorit. Passt gut und ist jetzt im Plan: ' + [...new Set(where)].join(', ') : '★ Favorit gespeichert. Sie wird bevorzugt, sobald sie sinnvoll passt. Gerade passt sie an keine freie Stelle, die Ausrüstung fehlt oder sie liegt noch zu weit über deinem Level.', 5000);
    },
    ciOpen() { openSheet({ type: 'checkin', ans: {} }); },
    ciPick(t) { st.sheet.ans[t.dataset.q] = +t.dataset.v; renderSheet(); },
    ciSave() {
      const s2 = st.sheet; if (E.CHECKIN.some(q => s2.ans[q.id] == null)) { toast('Bitte alle Fragen beantworten'); return; }
      const res = E.applyCheckin(P(), plan(), s2.ans, E.todayISO(E.startOfWeek()));
      Store.saveProfile(); st.sheet = { type: 'checkinDone', res }; renderSheet(); render();
    },
    ciLater() { st.ciLater = true; render(); },
    homeFilter(t) { st.homeFilter = t.dataset.k; render(); },
    dayOpen(t) { openSheet({ type: 'day', i: +t.dataset.i }); },
    dayLoc(t) { st.sheet.loc = t.dataset.l; st.homeLoc = t.dataset.l; renderSheet(); render(); },
    progGo(t) { st.tab = 'fortschritt'; st.progSeg = t.dataset.k; render(); window.scrollTo(0, 0); },
    libTab(t) { st.libTab = t.dataset.k; render(); },
    libMore() { st.libMax = (st.libMax || 40) + 60; const el = $('#libRes'); if (el) el.innerHTML = libResults(); },
    libFilter(t) { openSheet({ type: 'filter', k: t.dataset.k }); },
    filterPick(t) { const k = st.sheet.k; const v = t.dataset.v; st.libF = Object.assign({}, st.libF, { [k]: v === '' ? null : (k === 'lvl' ? +v : v) }); closeSheet(); render(); },
    libAvailT() { st.libAvail = !st.libAvail; render(); },
    libReset() { st.libF = {}; render(); },
    manualRest() { const ci = curIndex(); const e = ci >= 0 ? st.active.exercises[ci] : null; const sec = e ? e.presc.rest : 90; st.rest = { end: Date.now() + sec * 1000, total: sec, len: sec, label: '' }; renderRest(); },
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
      if (old && old.meso) r.plan.meso = clone(old.meso);
      if (!r.plan.name) r.plan.name = r.plan.splitName;
      if (old) Backup.snapshot('vor-plan');
      prof.plan = r.plan; st.profile = prof; registerCustom(); normalizePlans();
      Store.saveProfile(true); st.ov = null; st.tab = 'heute'; render(); toast(old ? 'Neuer Plan aktiv – der alte bleibt unter „Pläne“' : 'Plan gespeichert. Viel Erfolg!');
    },
    resultOwn() {
      const r = st.ov; const prof = r.prof; st.profile = prof; registerCustom();
      const np = emptyPlan('Mein Plan', 3); prof.plan = np; normalizePlans();
      Store.saveProfile(true); st.ov = null; st.tab = 'plan'; render(); toast('Leerer Plan angelegt: füge jedem Tag Übungen hinzu');
    },
    plans() { openSheet({ type: 'plans' }); },
    planOpen(t) { openSheet({ type: 'planMenu', id: t.dataset.id }); },
    planAct(t) {
      if (st.active) { toast('Erst das laufende Training beenden'); return; }
      if (activatePlan(t.dataset.id)) { closeSheet(); render(); toast('Plan aktiv: ' + plan().name); }
    },
    planDup(t) { const src = (P().plans || []).find(x => x.id === t.dataset.id); if (!src) return; const np = clone(src); np.id = 'p' + uid(); np.name = (src.name || 'Plan') + ' (Kopie)'; np.custom = true; np.edited = false; np.created = new Date().toISOString(); np.next = 0; lockAll(np); addPlan(np, false); openSheet({ type: 'plans' }); toast('Kopie angelegt'); },
    planDel() { st.sheet.confirm = true; renderSheet(); },
    async planDelYes(t) {
      const pr = P(); if ((pr.plans || []).length < 2) return; const id = t.dataset.id;
      if (st.active && pr.planId === id) { toast('Erst das laufende Training beenden'); return; }
      await Backup.snapshot('vor-planloeschen');
      pr.plans = pr.plans.filter(x => x.id !== id);
      if (pr.planId === id) { pr.plan = pr.plans[0]; pr.planId = pr.plan.id; st.homeDay = null; }
      Store.saveProfile(true); openSheet({ type: 'plans' }); render(); toast('Plan gelöscht');
    },
    planNew() { openSheet({ type: 'planNew', n: 3, split: 'fb', name: 'Eigener Plan ' + (((P().plans || []).filter(x => x.custom).length) + 1) }); },
    pnN(t) { st.sheet.n = +t.dataset.n; renderSheet(); },
    pnSplit(t) { st.sheet.split = t.dataset.k; renderSheet(); },
    pnCreate(t) {
      const s = st.sheet; const kind = t.dataset.k; const name = (s.name || '').trim() || 'Eigener Plan'; let np;
      if (kind === 'empty') np = emptyPlan(name, s.n);
      else if (kind === 'tpl') {
        const prof = clone(P()); prof.answers = Object.assign({}, prof.answers, { split: s.split, days: String(s.n) });
        np = lockAll(E.buildPlan(prof)); np.id = 'p' + uid(); np.custom = true; np.name = name; np.next = 0; np.meso = { start: E.todayISO(), len: 5 };
      } else { np = lockAll(clone(plan())); np.id = 'p' + uid(); np.custom = true; np.edited = false; np.name = name; np.next = 0; np.created = new Date().toISOString(); }
      if (st.active) { addPlan(np, false); toast('Plan angelegt – aktivieren kannst du ihn nach dem Training'); closeSheet(); render(); return; }
      addPlan(np, true); closeSheet(); st.tab = 'plan'; render(); window.scrollTo(0, 0); toast('Plan angelegt und aktiv');
    },
    dayEdit(t) { openSheet({ type: 'dayEdit', d: +t.dataset.d }); },
    dayAdd() {
      const p = plan(); const used = new Set(p.days.map(d => d.name)); let k = 0; while (used.has('Tag ' + 'ABCDEFGHIJ'[k]) && k < 9) k++;
      keepNext(p => p.days.push({ id: 'd' + uid(), key: 'C', name: 'Tag ' + 'ABCDEFGHIJ'[k], focus: 'full', slots: [] }));
      render(); openSheet({ type: 'dayEdit', d: p.days.length - 1, fresh: true });
    },
    dayMove(t) { const s = st.sheet; const j = s.d + +t.dataset.dir; const p = plan(); if (j < 0 || j >= p.days.length) return; keepNext(p => { [p.days[s.d], p.days[j]] = [p.days[j], p.days[s.d]]; }); s.d = j; renderSheet(); render(); },
    dayDup() { const s = st.sheet; const p = plan(); const nd = clone(p.days[s.d]); nd.id = 'd' + uid(); nd.name += ' (Kopie)'; for (const sl of nd.slots) { sl.id = 's' + uid(); delete sl.ss; } keepNext(p => p.days.splice(s.d + 1, 0, nd)); closeSheet(); render(); toast('Tag kopiert'); },
    dayDel() { st.sheet.confirm = true; renderSheet(); },
    dayDelYes() { const s = st.sheet; if (plan().days.length < 2) return; keepNext(p => p.days.splice(s.d, 1)); closeSheet(); render(); toast('Tag gelöscht'); },
    slotStep(t) {
      const s = st.sheet; const sl = plan().days[s.d].slots[s.s]; const k = t.dataset.k; const d = +t.dataset.d; const loc = st.planLoc || defLoc();
      if (k === 'sets') sl.sets = Math.max(1, Math.min(10, (sl.sets || 3) + d));
      else if (k === 'rest') sl.rest = Math.max(15, Math.min(600, (sl.rest || 90) + d));
      else { const ex = getEx(sl.ex[loc]); const cur = sl.custRR || (ex ? E.prescription(sl, ex, P(), plan()).rr : sl.rr) || [8, 12]; const rr = [...cur]; const i = k === 'lo' ? 0 : 1; rr[i] = Math.max(1, rr[i] + d); if (rr[0] > rr[1]) rr[i ? 0 : 1] = rr[i]; sl.custRR = rr; }
      touchPlan(); Store.saveProfile(); renderSheet(); render();
    },
    slotRole(t) {
      const s = st.sheet; const sl = plan().days[s.d].slots[s.s]; const r = t.dataset.r; if (sl.r === r) return; const goal = plan().goal;
      if (sl.rest === E.defaultRest(sl.r, goal)) sl.rest = E.defaultRest(r, goal);
      sl.r = r; sl.rr = (E.goalRanges(goal) || {})[r] || null; touchPlan(); Store.saveProfile(); renderSheet(); render();
    },
    homeLoc(t) { st.homeLoc = t.dataset.l; render(); },
    homeDay(t) { st.homeDay = +t.dataset.i; render(); },
    planLoc(t) { st.planLoc = t.dataset.l; render(); },
    startWorkout(t) { st.sheet = null; renderSheet(); if (st.active) { openWorkout(); return; }
      const d0 = plan().days[+t.dataset.d]; if (!d0 || !d0.slots.some(s => s.ex[t.dataset.l])) { st.tab = 'plan'; render(); toast('Füge diesem Tag zuerst Übungen hinzu'); return; }
      openSheet({ type: 'time', d: +t.dataset.d, l: t.dataset.l }); },
    rateW(t) { const w = st.summary; if (!w) return; w.rating = +t.dataset.r; Store.saveWorkout(w); renderSheet(); },
    chartPick(t) { st.chartEx = t.dataset.id; render(); },
    tfPick(t) { st.sheet[t.dataset.k] = +t.dataset.v; renderSheet(); },
    tfGo() { const s = st.sheet; const d = tfDelta(s); closeSheet(); startWorkout(s.d, s.l, d); },
    timePick(t) { const d = st.sheet.d, l = st.sheet.l; closeSheet(); startWorkout(d, l, +t.dataset.delta); },
    freeWorkout() { if (st.active) { openWorkout(); return; } st.active = { id: uid(), dayIdx: null, name: 'Freies Training', loc: st.homeLoc || defLoc(), start: Date.now(), bw: E.bodyweight(P()), exercises: [], cur: 0 }; Store.saveActive(true); openWorkout(); openSheet({ type: 'pick', mode: 'workout', q: '' }); },
    resume() { openWorkout(); },
    wMin() { st.ov = null; keepAwake(false); render(); },
    focusEx(t) { st.active.cur = +t.dataset.i; Store.saveActive(); renderOverlay(); renderRest(); toFocus(); },
    toFocus() { toFocus(); },
    undoSet() {
      const u = st.undo; const a = st.active; if (!u || !a) return;
      const e = a.exercises.find(x => x.key === u.key); if (!e) return;
      const i = e.sets.findIndex(s => s.t === u.t); if (i < 0) return;
      e.sets.splice(i, 1); e.draft = u.draft; a.cur = u.cur != null ? u.cur : a.exercises.indexOf(e); st.rest = null; st.undo = null;
      Store.saveActive(); toast('Satz zurückgenommen'); render(); toFocus();
    },
    qAdj(t) {
      const i = +t.dataset.i; const e = st.active.exercises[i]; const S = exState(e); const f = t.dataset.f; const d = +t.dataset.d; const v = Object.assign({}, e.draft);
      if (f === 'w') {
        const opts = E.loadOptions(S.ex, st.active.loc, P()); const cur = v.w ?? S.rec.w ?? 0;
        if (opts && opts.length > 1) { const j = opts.indexOf(E.snap(cur, opts)); v.w = opts[Math.max(0, Math.min(opts.length - 1, j + d))]; }
        else v.w = Math.max(0, Math.round((cur + d * wStep(S.ex)) * 100) / 100);
      } else { const cur = v[f] ?? S.rec[f] ?? 0; v[f] = Math.max(0, cur + d * (f === 'sec' ? 5 : 1)); }
      e.draft = v; Store.saveActive(); renderOverlay();
    },
    exLater(t) {
      const a = st.active; const i = +t.dataset.i; const e = a.exercises[i];
      const move = e.ss ? a.exercises.filter(x => x.ss === e.ss) : [e];
      a.exercises = a.exercises.filter(x => !move.includes(x)).concat(move);
      const k = a.exercises.findIndex(x => !move.includes(x) && !exState(x).finished); a.cur = k >= 0 ? k : a.exercises.indexOf(move[0]);
      Store.saveActive(); closeSheet(); render(); toFocus(); toast(getEx(e.exId).name + ' kommt später dran');
    },
    sportDay(t) { const p = P(); const k = +t.dataset.k; const s = new Set(p.sportDays || []); s.has(k) ? s.delete(k) : s.add(k); p.sportDays = [...s].sort(); Store.saveProfile(); renderSheet(); },
    bkLater() { st.bkLater = true; render(); },
    recompYes() { const p = P(); p.answers.goal = 'recomp'; plan().goal = 'recomp'; p.seen = Object.assign({}, p.seen, { recomp: true }); Store.saveProfile(true); render(); toast('Ziel: Fett weg & Muskeln aufbauen'); },
    recompNo() { P().seen = Object.assign({}, P().seen, { recomp: true }); Store.saveProfile(); render(); },
    dlYes() { plan().deloadUntil = E.todayISO(new Date(Date.now() + 7 * 864e5)); P().dlAsk = E.todayISO(); Store.saveProfile(true); render(); toast('Deload-Woche läuft bis ' + dateDE(plan().deloadUntil)); },
    dlNo() { P().dlAsk = E.todayISO(); Store.saveProfile(); render(); },
    mesoLen(t) { const p = plan(); p.meso = Object.assign({ start: E.todayISO() }, p.meso, { len: +t.dataset.n }); Store.saveProfile(); render(); },
    async backups() {
      openSheet({ type: 'backups', items: null, warn: !!st.corrupt });
      const items = await Backup.list(); let est = null, persisted = false;
      try { est = navigator.storage && navigator.storage.estimate ? await navigator.storage.estimate() : null; persisted = navigator.storage && navigator.storage.persisted ? await navigator.storage.persisted() : false; } catch (e) { }
      if (st.sheet && st.sheet.type === 'backups') { Object.assign(st.sheet, { items, est, persisted }); renderSheet(); }
    },
    bkRestore(t) { st.sheet.confirm = +t.dataset.id; renderSheet(); },
    async bkRestoreYes(t) {
      const x = await Backup.get(+t.dataset.id); if (!x) { toast('Sicherung nicht gefunden'); return; }
      await Backup.snapshot('vor-restore'); replaceAll(x); st.corrupt = false;
      closeSheet(); st.ov = null; render(); toast('Sicherung wiederhergestellt: ' + (x.workouts || []).length + ' Trainings');
    },
    async bkFile(t) { const x = await Backup.get(+t.dataset.id); if (x) exportData(x); },
    async impMerge() { const d = st.sheet.d; await Backup.snapshot('vor-import'); const n = mergeImport(d); closeSheet(); render(); toast('Backup importiert: ' + n + ' neue Trainings'); },
    impReplace() { st.sheet.confirm = true; renderSheet(); },
    async impReplaceYes() { const d = st.sheet.d; await Backup.snapshot('vor-import'); replaceAll(d); closeSheet(); st.ov = null; render(); toast('Backup übernommen: ' + (d.workouts || []).length + ' Trainings'); },
    staleGo() { closeSheet(); openWorkout(); },
    staleSave() { const a = st.active; const ts = a.exercises.flatMap(e => e.sets.map(s => s.t || 0)); closeSheet(); finishWorkout(true, Math.max(a.start, ...ts)); },
    staleDrop() { st.sheet.confirm = true; renderSheet(); },
    staleDropYes() { closeSheet(); finishWorkout(false); },
    doneSet(t) {
      const i = +t.dataset.i; const entry = st.active.exercises[i]; const ex = getEx(entry.exId); const S = exState(entry);
      const d = entry.draft || {};
      const vals = { w: d.w ?? S.rec.w, reps: d.reps ?? S.rec.reps, sec: d.sec ?? S.rec.sec };
      if (ex.kind === 'int') { commitSet(i, vals, 2); return; }
      if (st.rest) { st.rest = null; renderRest(); }
      if (settings().quick) { commitSet(i, vals, S.rec.rir); return; } // Schnell abhaken: Ziel-Reserve übernehmen
      openSheet({ type: 'rir', i, vals });
    },
    rirStep(t) { const s = st.sheet; const f = t.dataset.f; s.vals[f] = Math.max(0, Math.round(((s.vals[f] || 0) + +t.dataset.d) * 100) / 100); const inp = $('#rs-' + f); if (inp) inp.value = fmt(s.vals[f]); },
    rirPick(t) { const s = st.sheet; commitSet(s.i, s.vals, +t.dataset.r); },
    editSet(t) { openSheet({ type: 'editSet', i: +t.dataset.i, s: +t.dataset.s }); },
    delSet() { st.sheet.confirm = true; renderSheet(); },
    delSetYes() { const s = st.sheet; const entry = st.active.exercises[s.i]; const doneSets = entry.sets.filter(x => x.done); const target = doneSets[s.s]; entry.sets = entry.sets.filter(x => x !== target); Store.saveActive(); closeSheet(); render(); },
    setPlus(t) { const e = st.active.exercises[+t.dataset.i]; if (e.closed) { e.closed = false; const S0 = exState(e); e.extra = (e.extra || 0) + S0.done.length - S0.planned; } e.extra = (e.extra || 0) + 1; if (exState(e).rec.stop) e.ignoreStop = true; st.active.cur = +t.dataset.i; Store.saveActive(); renderOverlay(); },
    setMinus(t) { const e = st.active.exercises[+t.dataset.i]; e.extra = (e.extra || 0) - 1; Store.saveActive(); renderOverlay(); },
    ignoreStop(t) { st.active.exercises[+t.dataset.i].ignoreStop = true; Store.saveActive(); renderOverlay(); },
    switchEx(t) { doSwapWorkout(+t.dataset.i, t.dataset.id, false); },
    levelOpen(t) { openSheet({ type: 'level', i: +t.dataset.i }); },
    levelPick(t) { const i = st.sheet.i; closeSheet(); doSwapWorkout(i, t.dataset.id, false); },
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
    pickDo(t) { applyPick(st.sheet, t.dataset.id); },
    customFrom() {
      const s = st.sheet; let ret, base = null;
      if (s.type === 'swapWorkout') { ret = { mode: 'swapWorkout', i: s.i, plan: !!s.plan }; base = getEx(st.active.exercises[s.i].exId); }
      else { ret = { mode: s.mode, i: s.i, d: s.d, s: s.s }; if (s.mode === 'swapWorkout' && st.active) base = getEx(st.active.exercises[s.i].exId); if (s.mode === 'slot') base = getEx(plan().days[s.d].slots[s.s].ex[st.planLoc || defLoc()]); }
      const c = base ? { name: s.q || '', pat: base.pat, kind: base.kind === 'int' ? 'bw' : base.kind, prim: base.prim.slice(), eq: base.eq.slice(), lo: (base.rr || [8])[0], hi: (base.rr || [8, 12])[1], skill: base.skill } : null;
      openSheet(Object.assign({ type: 'custom', ret, base: base && base.name }, c ? { c } : {}));
      setTimeout(() => { const n = $('#cx-name'); if (n) n.focus(); }, 80);
    },
    cxUseBuiltin(t) { const r = st.sheet.ret; applyPick(r, t.dataset.id); },
    addToWorkout(t) { addToWorkout(t.dataset.id); },
    balanceApply() { const cp = st.sheet.preview; if (!cp) return; plan().days = cp.days; Store.saveProfile(true); closeSheet(); render(); toast('Plan ausbalanciert'); },
    balanceNow() { if (!autoPlan(plan())) { const cp = clone(plan()); const ch = E.balancePlan(cp, P()); openSheet({ type: 'balanceInfo', ch, preview: cp }); return; } const ch = E.balancePlan(plan(), P()); Store.saveProfile(); render(); openSheet({ type: 'balanceInfo', ch }); },
    freeAdd(t) { addToWorkout(t.dataset.id); const e = st.active.exercises[st.active.exercises.length - 1]; if (e) { e.extraEx = true; Store.saveActive(); } toast('Hinzugefügt – viel Spaß!'); },
    addToPlanAsk(t) { openSheet({ type: 'addToPlan', id: t.dataset.id }); },
    addToPlanDo(t) { addToPlan(+t.dataset.d, t.dataset.id); },
    slotSheet(t) { openSheet({ type: 'slot', d: +t.dataset.d, s: +t.dataset.s }); },
    slotSwap(t) { const s = st.sheet; const sl = plan().days[s.d].slots[s.s]; const loc = st.planLoc || defLoc(); const alts = E.alternatives(sl, loc, P(), []); const a = alts.find(x => x.ex.id === t.dataset.id); sl.ex[loc] = t.dataset.id; sl.why[loc] = a ? a.reasons : []; sl.locked = Object.assign({}, sl.locked, { [loc]: true }); if (getEx(t.dataset.id).pat !== sl.p[0] && !sl.p.includes(getEx(t.dataset.id).pat)) sl.p = [getEx(t.dataset.id).pat, ...sl.p]; touchPlan(); Store.saveProfile(); st.sheet.keepScroll = false; renderSheet(); render(); toast('Getauscht: ' + getEx(t.dataset.id).name); },
    slotMove(t) { const s = st.sheet; const d = plan().days[s.d]; const j = s.s + +t.dataset.dir; if (j < 0 || j >= d.slots.length) return; [d.slots[s.s], d.slots[j]] = [d.slots[j], d.slots[s.s]]; s.s = j; touchPlan(); Store.saveProfile(); renderSheet(); render(); },
    slotDel() { st.sheet.confirm = true; renderSheet(); },
    slotDelYes() { const s = st.sheet; plan().days[s.d].slots.splice(s.s, 1); touchPlan(); Store.saveProfile(); closeSheet(); render(); },
    deloadToggle() { const p = plan(); p.forceDeload = !p.forceDeload; if (!p.forceDeload) p.meso.start = E.todayISO(); Store.saveProfile(); render(); toast(p.forceDeload ? 'Deload aktiv: halbe Sätze, mehr Reserve' : 'Neuer Zyklus startet mit Woche 1'); },
    rebuildAsk() { openSheet({ type: 'rebuild' }); },
    rebuildYes() { Backup.snapshot('vor-plan'); const old = plan(); const np = E.buildPlan(P()); np.meso = clone(old.meso); np.next = 0; np.name = np.splitName; if (old.name && !/\(vorher\)$/.test(old.name)) old.name += ' (vorher)'; addPlan(np, true); closeSheet(); render(); toast('Neuer Plan aktiv – der alte bleibt unter „Pläne“'); },
    progSeg(t) { st.progSeg = t.dataset.k; render(); },
    chartTip(t) { const el = $('#chartTip', t.closest('.card, .sheet')) || $('#chartTip'); if (el) el.textContent = t.dataset.t; },
    wDetail(t) { openSheet({ type: 'wDetail', id: t.dataset.id }); },
    wDel() { st.sheet.confirm = true; renderSheet(); },
    wDelYes(t) { Backup.snapshot('vor-loeschen'); st.workouts = st.workouts.filter(w => w.id !== t.dataset.id); Store.deleteWorkout(t.dataset.id); closeSheet(); render(); toast('Training gelöscht'); },
    bwSheet() { openSheet({ type: 'bw' }); },
    bwStep(t) { const i = $('#bwIn'); i.value = fmt((num(i.value) || 0) + +t.dataset.d, 1); },
    bwSave() { const v = num($('#bwIn').value); if (!(v > 25 && v < 300)) { toast('Bitte ein Gewicht zwischen 25 und 300 kg eingeben'); return; } const log = P().bwLog = P().bwLog || []; const today = E.todayISO(); const ex = log.find(x => x.d === today); if (ex) ex.kg = v; else log.push({ d: today, kg: v }); log.sort((a, b) => a.d < b.d ? -1 : 1); Store.saveProfile(); closeSheet(); render(); toast('Gespeichert: ' + fmt(v, 1) + ' kg'); },
    bwDel(t) { P().bwLog.splice(+t.dataset.i, 1); Store.saveProfile(); render(); },
    libGroup(t) { st.libGroup = t.dataset.g; render(); },
    libAvail(t) { st.libAvail = t.checked; render(); },
    customEx() { openSheet({ type: 'custom' }); },
    async shareCustom(t) {
      const ex = getEx(t.dataset.id); if (!ex) return; const text = customReport(ex);
      try { if (navigator.share) { await navigator.share({ text }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
      try { await navigator.clipboard.writeText(text); toast('Kopiert – füge es im Chat mit Claude ein'); } catch (e) { toast('Teilen hier nicht möglich'); }
    },
    cxMuscle(t) { const c = st.sheet.c; const k = t.dataset.k; const i = c.prim.indexOf(k); if (i >= 0) c.prim.splice(i, 1); else c.prim.push(k); renderSheet(); },
    cxEq(t) { const c = st.sheet.c; const k = t.dataset.k; const i = c.eq.indexOf(k); if (i >= 0) c.eq.splice(i, 1); else c.eq.push(k); if (!c.eq.length) c.eq = ['bw']; renderSheet(); },
    cxSave() {
      const c = st.sheet.c; if (!c.name.trim()) { toast('Bitte einen Namen eingeben'); return; } if (!c.prim.length) { toast('Bitte mindestens einen Muskel wählen'); return; }
      const ex = { id: 'c-' + uid(), custom: true, name: c.name.trim(), pat: c.pat, role: ['core'].includes(c.pat) ? 'k' : ['skill'].includes(c.pat) ? 's' : ['cond'].includes(c.pat) ? 'x' : ['vpull', 'hpull', 'vpush', 'hpush', 'dip', 'squat', 'lunge', 'hinge'].includes(c.pat) ? 'c' : 'i', kind: c.kind, eq: c.eq.length ? c.eq : ['bw'], prim: c.prim, sec: [], lvl: 2, rr: [+c.lo || 8, +c.hi || 12], d: 'Eigene Übung.', c: [], std: 0.3, bwf: c.kind === 'bw' ? 0.6 : undefined };
      if (c.skill && ex.pat === 'skill') ex.skill = c.skill;
      P().custom = P().custom || []; P().custom.push(ex); registerCustom(); Store.saveProfile();
      const ret = st.sheet.ret;
      if (ret) { closeSheet(); applyPick(ret, ex.id); toast('Übung angelegt und eingesetzt'); return; }
      render(); openSheet({ type: 'exInfo', id: ex.id }); toast('Übung angelegt');
    },
    delCustom(t) { P().custom = (P().custom || []).filter(x => x.id !== t.dataset.id); Store.saveProfile(); closeSheet(); render(); },
    setFont(t) { P().settings = Object.assign(settings(), { font: t.dataset.k }); Store.saveProfile(); render(); },
    setToggle(t) { P().settings = Object.assign(settings(), { [t.dataset.k]: t.checked }); Store.saveProfile(); render(); },
    exportData() { exportData(); },
    reset() { st.sheet.confirm = true; renderSheet(); },
    async resetYes() { await Backup.snapshot('vor-reset'); for (const w of st.workouts) Store.deleteWorkout(w.id); st.workouts = []; st.active = null; st.profile = null; LS.set('profile', null); LS.set('workouts', []); Store.saveActive(true); if (Store.mode === 'db') Store.write('p', () => Store.pRef().delete()); closeSheet(); render(); toast('Alle Daten gelöscht'); },
    timerMode(t) { T.mode = t.dataset.k; render(); },
    restPreset(t) { T.restDur = +t.dataset.s; if (T.restEnd) T.restEnd = Date.now() + T.restDur * 1000; render(); },
    restToggle() { T.restEnd = T.restEnd ? null : Date.now() + (T.restDur || 90) * 1000; beep(880, 0.08); render(); },
    ivPreset(t) { const [w, r, n] = t.dataset.v.split(',').map(Number); T.iv = { work: w, rest: r, rounds: n }; render(); },
    ivStart() { T.ivRun = { start: Date.now() + 3000 }; lastBeep = {}; beep(700, 0.1); render(); toast('Start in 3 Sekunden'); },
    ivStop() { T.ivRun = null; render(); },
    swToggle() { const sw = T.sw; if (sw.start) { sw.acc += Date.now() - sw.start; sw.start = null; } else sw.start = Date.now(); render(); },
    swLap() { const sw = T.sw; sw.laps.unshift(sw.acc + (Date.now() - sw.start)); render(); },
    swReset() { T.sw = { start: null, acc: 0, laps: [] }; render(); },
    restAdj(t) { if (!st.rest) return; st.rest.end += +t.dataset.s * 1000; st.rest.len = Math.max(0, (st.rest.len ?? st.rest.total) + +t.dataset.s); const o = $('#restOf'); if (o) o.textContent = 'von ' + mmss(st.rest.len) + ' Pause'; st.rest.total = Math.max(st.rest.total, (st.rest.end - Date.now()) / 1000); st.rest.fired = false; tickRest(Date.now()); },
    restSkip() { st.rest = null; renderRest(); toFocus(); }
  };
  function applyPick(s, id) {
      const ex = getEx(id);
      if (s.mode === 'workout') { addToWorkout(id); return; }
      if (s.mode === 'swapWorkout') { doSwapWorkout(s.i, id, !!s.plan); return; }
      if (s.mode === 'plan') { addToPlan(s.d, id); return; }
      if (s.mode === 'slot') { const sl = plan().days[s.d].slots[s.s]; const loc = st.planLoc || defLoc(); sl.ex[loc] = id; sl.why[loc] = ['Von dir gewählt']; sl.locked = Object.assign({}, sl.locked, { [loc]: true }); touchPlan(); Store.saveProfile(); closeSheet(); render(); toast(ex.name + ' im Plan'); }
    }
  function addToWorkout(id) {
    if (!st.active) return;
    st.active.exercises.push(newEntry(id, null)); st.active.cur = st.active.exercises.length - 1;
    Store.saveActive(); closeSheet(); if (!st.ov) openWorkout(); else renderOverlay();
    toFocus();
  }
  function addToPlan(di, id) {
    const ex = getEx(id); const p = plan(); const day = p.days[di]; const r = roleOfEx(ex);
    const sl = { id: 's' + uid(), p: [ex.pat], r, sets: 3, rest: E.defaultRest(r, p.goal), rr: (E.goalRanges(p.goal) || {})[r] || null, ex: {}, why: {}, locked: {} };
    for (const l of (p.locs || locs())) {
      if (E.available(ex, E.locEquip(P(), l)) || l === (st.planLoc || defLoc())) { sl.ex[l] = id; sl.why[l] = ['Von dir hinzugefügt']; }
      else { const alt = E.alternatives(sl, l, P(), day.slots.map(x => x.ex[l]))[0]; if (alt) { sl.ex[l] = alt.ex.id; sl.why[l] = ['Ersatz für ' + ex.name]; } }
      sl.locked[l] = true;
    }
    day.slots.push(sl); touchPlan(); Store.saveProfile(); closeSheet(); render(); toast(ex.name + ' zu ' + day.name + ' hinzugefügt');
  }
  function doSwapWorkout(i, id, alsoPlan) {
    const e = st.active.exercises[i]; const ex = getEx(id);
    const slot = findSlot(e);
    if (e.sets.some(s => s.done)) { const n = newEntry(id, slot); const nd = e.sets.filter(s => s.done).length; e.closed = true; n.extra = -nd; st.active.exercises.splice(i + 1, 0, n); st.active.cur = i + 1; }
    else { e.exId = id; e.presc = E.prescription(slot, ex, P(), plan()); e.draft = null; }
    if (alsoPlan && slot) { slot.ex[st.active.loc] = id; slot.why[st.active.loc] = ['Von dir gewählt']; slot.locked = Object.assign({}, slot.locked, { [st.active.loc]: true }); touchPlan(); Store.saveProfile(); }
    Store.saveActive(); closeSheet(); renderOverlay(); toast('Getauscht: ' + ex.name);
  }
  // Export: Konto-Download (Artifact) → Teilen-Menü (iPhone: „In Dateien sichern“) → Download → Zwischenablage
  async function exportData(src) {
    const d = src || { profile: st.profile, workouts: st.workouts, active: st.active };
    const data = JSON.stringify({ app: 'satzwerk', version: 2, appVersion: APP_VERSION, exported: new Date().toISOString(), profile: d.profile, workouts: d.workouts, active: d.active || null }, null, 1);
    const name = 'satzwerk-backup-' + E.todayISO() + '.json';
    const ok = msg => { toast(msg); if (!src && st.profile) { st.profile.lastExport = E.todayISO(); Store.saveProfile(); if (!st.ov) render(); } };
    try {
      const dl = window.claude && window.claude.use ? await window.claude.use('downloads') : null;
      if (dl) { await dl.save({ filename: name, data }); ok('Backup gespeichert'); return; }
    } catch (e) { if (e && e.code === 'declined') return; }
    try {
      const file = new File([data], name, { type: 'application/json' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'Satzwerk-Backup' }); ok('Backup geteilt'); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); ok('Backup erstellt'); return; } catch (e) { }
    try { await navigator.clipboard.writeText(data); ok('Backup in die Zwischenablage kopiert'); } catch (e) { toast('Export hier nicht möglich'); }
  }
  function validBackup(d) {
    return d && d.app === 'satzwerk' && d.profile && typeof d.profile === 'object' && Array.isArray(d.workouts || []) && (d.workouts || []).every(w => w && w.id && Array.isArray(w.exercises));
  }
  function importData(file) {
    const r = new FileReader();
    r.onload = () => {
      let d = null; try { d = JSON.parse(r.result); } catch (e) { }
      if (!validBackup(d)) { toast('Diese Datei ist kein Satzwerk-Backup'); return; }
      openSheet({ type: 'importPreview', d });
    };
    r.readAsText(file);
  }
  // Nach jedem Laden/Ersetzen von Daten (Import, Wiederherstellen)
  function afterDataLoad() {
    registerCustom(); exCache.clear(); st.workouts.sort((x, y) => (x.ts || 0) - (y.ts || 0));
    if (typeof normalizePlans === 'function') normalizePlans();
  }
  // Ersetzt alle Daten (vorher immer Backup.snapshot aufrufen)
  function replaceAll(d) {
    const newIds = new Set((d.workouts || []).map(w => w.id));
    const gone = st.workouts.filter(w => !newIds.has(w.id)).map(w => w.id);
    st.profile = clone(d.profile) || null; st.workouts = clone(d.workouts || []); st.active = clone(d.active) || null; st.rest = null; st.hold = null;
    afterDataLoad();
    if (st.profile) Store.saveProfile(true); else LS.set('profile', null);
    for (const id of gone) Store.deleteWorkout(id);
    if (Store.mode === 'db') for (const w of st.workouts) Store.saveWorkout(w); else { Store.wv++; LS.set('workouts', st.workouts); }
    Store.saveActive(true);
  }
  function mergeImport(d) {
    if (!st.profile) st.profile = clone(d.profile);
    else { // eigene Übungen ergänzen, damit importierte Trainings ihre Übungen finden
      const mine = st.profile.custom = st.profile.custom || []; const ids = new Set(mine.map(c => c.id));
      for (const c of d.profile.custom || []) if (!ids.has(c.id)) mine.push(c);
    }
    const have = new Set(st.workouts.map(w => w.id)); let n = 0;
    for (const w of d.workouts || []) if (!have.has(w.id)) { st.workouts.push(clone(w)); n++; }
    afterDataLoad(); Store.saveProfile(true);
    if (Store.mode === 'db') { for (const w of st.workouts) if (!have.has(w.id)) Store.saveWorkout(w); } else { Store.wv++; LS.set('workouts', st.workouts); }
    return n;
  }
  // Leistung fällt bei mehreren Grund-/Ergänzungsübungen zweimal hintereinander (> 3 %) → Deload vorschlagen
  function deloadNeeded() {
    const p = plan(); if (!p || E.weekInfo(p, P()).deload) return false;
    const asked = P().dlAsk; if (asked && (Date.now() - new Date(asked + 'T12:00:00').getTime()) / 864e5 < 21) return false;
    const ids = new Set(); for (const d of p.days) for (const sl of d.slots) if (sl.r === 'main' || sl.r === 'sec') for (const l of p.locs || []) if (sl.ex[l]) ids.add(sl.ex[l]);
    let falling = 0;
    for (const id of ids) {
      const ex = getEx(id); if (!ex || ex.kind === 'hold' || ex.kind === 'int') continue;
      const h = histOf(id).slice(-3); if (h.length < 3) continue;
      const b = h.map(x => E.sessionBest(ex, x.entry, x.bw || E.bodyweight(P())));
      if (b[1] < b[0] * 0.97 && b[2] < b[1] * 0.97) falling++;
    }
    return falling >= 2;
  }
  // Baseball & Co.: vor/an Spieltagen keine schweren Bein- oder Überkopf-Grundübungen
  function heavyDay(d, loc) { return d.slots.some(sl => sl.r === 'main' && (getEx(sl.ex[loc]) || {}).pat && ['squat', 'hinge', 'lunge', 'vpush'].includes(getEx(sl.ex[loc]).pat)); }
  function sportHint() {
    const sd = P().sportDays || []; if (!sd.length || st.active) return '';
    const ti = (new Date().getDay() + 6) % 7; const tm = (ti + 1) % 7;
    const when = sd.includes(ti) ? 'Heute' : sd.includes(tm) ? 'Morgen' : ''; if (!when) return '';
    const p = plan(); const loc = st.homeLoc || defLoc(); const di = st.homeDay ?? nextDayIdx(); const d = p.days[di];
    if (!d || !heavyDay(d, loc)) return '';
    const alt = p.days.map((x, i) => ({ x, i })).find(o => o.i !== di && o.x.slots.some(s => s.ex[loc]) && !heavyDay(o.x, loc));
    return `<div class="card stack" style="gap:10px"><b>${when} ist Spiel-/Trainingstag</b><div class="small muted">„${esc(d.name)}“ hat schwere Bein- oder Überkopfübungen. Die stecken in den Beinen und Schultern, wenn du werfen und sprinten willst.</div>${alt ? `<button class="btn primary" data-a="homeDay" data-i="${alt.i}">„${esc(alt.x.name)}“ vorziehen</button>` : '<div class="small">Tipp: heute leichter (kürzere Einheit) oder einen Tag schieben.</div>'}</div>`;
  }
  function homeCards() {
    const p = P(); let out = '';
    const g = (p.answers || {}).goal;
    if (!(p.seen || {}).recomp && ['muscle', 'fit', 'health'].includes(g)) out += `<div class="card stack" style="gap:10px"><b>Neues Ziel: Fett weg & Muskeln aufbauen</b><div class="small muted">Für die Zeit, in der du Körperfett verlierst: gleiche Übungen, etwas weniger Zusatzvolumen, Fokus darauf, die Kraft zu halten. Dein Plan bleibt, wie er ist.</div><div class="row"><button class="btn primary grow" data-a="recompYes">Umstellen</button><button class="btn grow" data-a="recompNo">Nein danke</button></div></div>`;
    out += sportHint();
    if (deloadNeeded()) out += `<div class="card stack" style="gap:10px"><b>Leistung fällt – Deload-Woche empfohlen</b><div class="small muted">Bei mehreren Grundübungen ist deine Leistung zweimal hintereinander gesunken. Eine leichtere Woche (halbe Sätze, mehr Reserve) bringt dich meist stärker zurück.</div><div class="row"><button class="btn primary grow" data-a="dlYes">Deload starten</button><button class="btn grow" data-a="dlNo">Nein</button></div></div>`;
    const since = p.lastExport || ''; const nNew = st.workouts.filter(w => w.date > since).length;
    const days = since ? (Date.now() - new Date(since + 'T12:00:00').getTime()) / 864e5 : 999;
    if (Store.mode !== 'db' && !st.bkLater && nNew >= 3 && days > 14) out += `<div class="card stack" style="gap:10px"><b>Backup sichern</b><div class="small muted">${since ? 'Letztes Backup am ' + dateDE(since) + '. ' : ''}${nNew} Trainings sind nur auf diesem iPhone gespeichert.</div><div class="row"><button class="btn primary grow" data-a="exportData">Backup sichern</button><button class="btn grow" data-a="bkLater">Später</button></div></div>`;
    return out;
  }

  /* ================= Eingaben ================= */
  const IN = {
    noteText(t) { st.sheet.v = t.value; },
    wList(t) { st.sheet.v = t.value; const el = $('#w-prev'); if (el) el.innerHTML = wChips(t.value); },
    plateW(t) { const v = num(t.value); if (v != null) { st.sheet.w = v; const el = $('#plateRes'); if (el) el.innerHTML = plateRes(st.sheet); } },
    // Suche: nur die Treffer neu zeichnen, Suchfeld und Tastatur bleiben unberührt
    libQ(t) { st.libQ = t.value; later('libQ', 120, () => { const el = $('#libRes'); if (el) el.innerHTML = libResults(); }); },
    chartEx(t) { st.chartEx = t.value; render(); },
    quiz(t) { const q = E.Q.find(x => x.id === t.dataset.q); const v = q.type === 'number' ? num(t.value) : t.value; st.ov.answers[q.id] = v; const b = $('[data-a="qNext"]'); if (b) b.disabled = !(q.optional || (v != null && v !== '')); },
    dbList(t) { st.ov.answers.dbSetup.list = t.value.split(/[\s;]+/).map(num).filter(x => x > 0); },
    dbNum(t) { st.ov.answers.dbSetup[t.dataset.k] = num(t.value); },
    cableNum(t) { st.ov.answers.cableSetup[t.dataset.k] = num(t.value); },
    draft(t) { const e = st.active.exercises[+t.dataset.i]; e.draft = Object.assign({}, e.draft, { [t.dataset.f]: num(t.value) }); Store.saveActive(); },
    rirVal(t) { st.sheet.vals[t.dataset.f] = num(t.value); },
    editSet(t) { const s = st.sheet; const entry = st.active.exercises[s.i]; const set = entry.sets.filter(x => x.done)[s.s]; set[t.dataset.k] = num(t.value) ?? 0; },
    planName(t) { const x = (P().plans || []).find(p => p.id === t.dataset.id); if (x) { x.name = t.value; Store.saveProfile(); later('plR', 400, () => { if (!st.ov) render(); }); } },
    pnName(t) { st.sheet.name = t.value; },
    dayName(t) { const d = plan().days[st.sheet.d]; if (d) { d.name = t.value; touchPlan(); Store.saveProfile(); later('dnR', 400, () => { if (!st.ov) render(); }); } },
    slot(t) { const s = st.sheet; const sl = plan().days[s.d].slots[s.s]; const v = num(t.value); if (v == null) return; const k = t.dataset.k; touchPlan();
      if (k === 'sets') sl.sets = Math.max(1, Math.min(10, Math.round(v))); else if (k === 'rest') sl.rest = Math.max(15, Math.min(600, Math.round(v)));
      else { const ex = getEx(sl.ex[st.planLoc || defLoc()]); const cur = sl.custRR || E.prescription(sl, ex, P(), plan()).rr; const rr = [...cur]; rr[k === 'lo' ? 0 : 1] = Math.max(1, Math.round(v)); if (rr[1] >= rr[0]) sl.custRR = rr; }
      Store.saveProfile(); render(); },
    pickQ(t) { st.sheet.q = t.value; later('pickQ', 120, () => { const el = $('#pickRes'); if (el && st.sheet) el.innerHTML = pickResults(st.sheet); }); },
    iv(t) { T.iv[t.dataset.k] = Math.max(0, Math.round(num(t.value) || 0)); },
    setNum(t) { P().settings = Object.assign(settings(), { [t.dataset.k]: num(t.value) }); Store.saveProfile(); },
    importFile(t) { if (t.files && t.files[0]) importData(t.files[0]); t.value = ''; },
    cx(t) { const c = st.sheet.c; c[t.dataset.k] = t.value; if (t.dataset.k === 'kind') renderSheet(); if (t.dataset.k === 'name') { const h = $('#cx-hit'); if (h) h.innerHTML = cxHit(t.value, !!st.sheet.ret); } }
  };

  document.addEventListener('click', e => {
    if (Date.now() < (st.noClickUntil || 0)) { e.preventDefault(); return; }
    st.ev = (st.ev || 0) + 1;
    const t = e.target.closest('[data-a]'); if (!t) return;
    if (t.tagName === 'INPUT' && t.type === 'checkbox') { /* Checkbox: Aktion nach Zustandswechsel */ }
    const fn = A[t.dataset.a]; if (!fn) return;
    if (t.dataset.a === 'scrim' && e.target !== t) return;
    if (!actx && settings().sound) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (err) { } }
    fn(t, e);
  });
  document.addEventListener('input', e => { const t = e.target; st.ev = (st.ev || 0) + 1; if (t.dataset && t.dataset.in && IN[t.dataset.in] && t.type !== 'file' && t.tagName !== 'SELECT') IN[t.dataset.in](t); });
  document.addEventListener('change', e => { const t = e.target; st.ev = (st.ev || 0) + 1; if (t.dataset && t.dataset.in && IN[t.dataset.in] && (t.type === 'file' || t.tagName === 'SELECT')) IN[t.dataset.in](t); });
  // Plan: Übung gedrückt halten und ziehen, um die Reihenfolge zu ändern
  let lp = null;
  function lpStart(el, y) {
    lp = { el, y0: y, dy: 0, active: false, d: +el.dataset.d, s: +el.dataset.s };
    lp.timer = setTimeout(() => {
      if (!lp) return;
      lp.active = true; buzz(15);
      const list = el.parentElement; lp.rows = [...list.querySelectorAll('[data-drag]')];
      lp.rects = lp.rows.map(r => r.getBoundingClientRect()); lp.to = lp.s;
      el.classList.add('dragging'); lp.rows.forEach(r => { if (r !== el) r.classList.add('shift'); });
    }, 380);
  }
  function lpMove(y, e) {
    if (!lp) return; const dy = y - lp.y0;
    if (!lp.active) { if (Math.abs(dy) > 8) { clearTimeout(lp.timer); lp = null; } return; }
    if (e && e.cancelable) e.preventDefault();
    lp.dy = dy; lp.el.style.transform = `translateY(${dy}px) scale(1.02)`;
    const me = lp.rects[lp.s]; const mid = me.top + me.height / 2 + dy;
    let to = lp.s; lp.rects.forEach((r, i) => { const c = r.top + r.height / 2; if (i < lp.s && mid < c) to = Math.min(to, i); if (i > lp.s && mid > c) to = Math.max(to, i); });
    lp.to = to;
    lp.rows.forEach((r, i) => { if (i === lp.s) return; let sh = 0; if (lp.s < to && i > lp.s && i <= to) sh = -me.height; if (lp.s > to && i < lp.s && i >= to) sh = me.height; r.style.transform = sh ? `translateY(${sh}px)` : ''; });
  }
  function lpEnd() {
    if (!lp) return; clearTimeout(lp.timer); const L = lp; lp = null;
    if (!L.active) return;
    st.noClickUntil = Date.now() + 450;
    if (L.to !== L.s && L.el.dataset.drag === 'wo' && st.active) {
      const a = st.active; const curKey = a.cur != null && a.exercises[a.cur] ? a.exercises[a.cur].key : null;
      const [m] = a.exercises.splice(L.s, 1); a.exercises.splice(L.to, 0, m);
      if (curKey) a.cur = a.exercises.findIndex(e => e.key === curKey);
      Store.saveActive(); toast('Reihenfolge geändert');
    } else if (L.to !== L.s) { const slots = plan().days[L.d].slots; const [m] = slots.splice(L.s, 1); slots.splice(L.to, 0, m); touchPlan(); Store.saveProfile(); toast('Reihenfolge geändert'); }
    render();
  }
  document.addEventListener('touchstart', e => { const el = e.target.closest && e.target.closest('[data-drag]'); if (el && !st.sheet) lpStart(el, e.touches[0].clientY); }, { passive: true });
  document.addEventListener('touchmove', e => { if (lp) lpMove(e.touches[0].clientY, e); }, { passive: false });
  document.addEventListener('touchend', lpEnd); document.addEventListener('touchcancel', lpEnd);
  document.addEventListener('mousedown', e => { const el = e.target.closest && e.target.closest('[data-drag]'); if (el && !st.sheet && e.button === 0) lpStart(el, e.clientY); });
  document.addEventListener('mousemove', e => { if (lp) lpMove(e.clientY, e); });
  document.addEventListener('mouseup', lpEnd);
  document.addEventListener('contextmenu', e => { if (e.target.closest && e.target.closest('[data-drag]')) e.preventDefault(); });

  // Fenster nach unten wischen zum Schließen
  let drag = null;
  document.addEventListener('touchstart', e => {
    const sh = e.target.closest && e.target.closest('.sheet'); if (!sh) return;
    const onTop = e.target.closest('.sheettop');
    if (sh.scrollTop > 0 && !onTop) return;
    if (e.target.closest('input,textarea,select')) return;
    drag = { sh, y0: e.touches[0].clientY, dy: 0, top: !!onTop };
  }, { passive: true });
  let tch = null;
  document.addEventListener('touchstart', e => { tch = st.sheet ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null; }, { passive: true });
  document.addEventListener('touchmove', e => {
    if (drag) {
      const dy = e.touches[0].clientY - drag.y0;
      if (dy <= 0 || (!drag.top && drag.sh.scrollTop > 0)) { drag.dy = 0; drag.sh.style.transform = ''; }
      else { drag.dy = dy; drag.sh.style.transition = 'none'; drag.sh.style.transform = `translateY(${dy}px)`; if (e.cancelable) e.preventDefault(); return; }
    }
    // Wischen im offenen Fenster darf nie die Seite dahinter bewegen
    if (!st.sheet || !tch || !e.cancelable) return;
    const t = e.touches[0]; const vertical = Math.abs(t.clientY - tch.y) > Math.abs(t.clientX - tch.x);
    if (!vertical || (e.target.closest && e.target.closest('input,textarea,select'))) return;
    const sh = e.target.closest && e.target.closest('.sheet');
    if (!sh) { e.preventDefault(); return; }
    if (sh.scrollHeight <= sh.clientHeight + 1) { e.preventDefault(); return; }
    const down = t.clientY > tch.y;
    if ((down && sh.scrollTop <= 0) || (!down && sh.scrollTop + sh.clientHeight >= sh.scrollHeight - 1)) e.preventDefault();
  }, { passive: false });
  document.addEventListener('touchend', () => {
    if (!drag) return; const d = drag; drag = null;
    if (d.dy > 90) { d.sh.style.transition = 'transform .18s ease-in'; d.sh.style.transform = 'translateY(100%)'; setTimeout(closeSheet, 170); }
    else { d.sh.style.transition = 'transform .2s ease-out'; d.sh.style.transform = ''; }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && st.sheet) closeSheet();
    if (e.key === 'Enter' && st.ov && st.ov.type === 'quiz' && e.target.tagName === 'INPUT') { const b = $('[data-a="qNext"]'); if (b && !b.disabled) quizNext(); }
  });
  // Sperren / App-Wechsel: sofort speichern; bei Rückkehr Zeiten nachziehen
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') { if (st.active) { syncTimers(); Store.saveActive(true); } return; }
    if (st.ov && st.ov.type === 'workout') { keepAwake(true); timerTick(); renderRest(); }
  });
  window.addEventListener('pagehide', () => { if (st.active) { syncTimers(); Store.saveActive(true); } });

  setInterval(() => {
    timerTick();
  }, 250);

  /* ================= Start ================= */
  (async function boot() {
    await Store.init();
    E.setWorkouts(() => st.workouts);
    // 3.6: neue Standardschrift (System) – alte Handschrift-Voreinstellung einmalig umstellen, wählbar bleibt sie
    if (st.profile && st.profile.settings && st.profile.settings.font === 'hand' && !(st.profile.seen || {}).sysfont) { delete st.profile.settings.font; st.profile.seen = Object.assign({}, st.profile.seen, { sysfont: true }); Store.saveProfile(); }
    normalizePlans();
    // Pausen bei Isolationsübungen 75 → 90 s (nur unveränderte empfohlene Pläne)
    for (const pl of (st.profile && st.profile.plans) || []) if ((pl.restV || 1) < 2) { if (autoPlan(pl)) for (const d of pl.days) for (const sl of d.slots) if (sl.r === 'iso' && sl.rest === 75) sl.rest = 90; pl.restV = 2; Store.saveProfile(); }
    if (plan() && E.mesoBreak(plan())) { Store.saveProfile(); setTimeout(() => toast('Nach der Pause beginnt dein Zyklus neu mit der Einstiegswoche', 4000), 500); }
    if (!LS.get('meta')) LS.set('meta', { schema: 1 });
    registerCustom();
    if (st.profile && st.profile.health) { delete st.profile.health; Store.saveProfile(true); }
    let balCh = null; if (st.profile && st.profile.plan && st.profile.answers && !st.profile.plan.bal && autoPlan(st.profile.plan)) { Backup.snapshot('vor-update'); balCh = E.balancePlan(st.profile.plan, st.profile); Store.saveProfile(true); }
    const up = upgradeCustom(); if (up.length) setTimeout(() => toast('Eigene Übung jetzt mit Anleitung & Bild: ' + up.join(', '), 4500), 600);
    if (st.profile && st.profile.plan && !autoPlan(st.profile.plan) && (st.profile.plan.v || 1) < E.PLAN_VERSION) { st.profile.plan.v = E.PLAN_VERSION; Store.saveProfile(true); }
    if (st.profile && st.profile.plan && st.profile.answers && (st.profile.plan.v || 1) < E.PLAN_VERSION) { Backup.snapshot('vor-update');
      const old = st.profile.plan; const np = E.buildPlan(st.profile); np.id = old.id; np.name = old.name;
      np.meso = old.meso || np.meso; np.next = (old.next || 0) % np.days.length; np.forceDeload = old.forceDeload;
      st.profile.plan = np; normalizePlans(); Store.saveProfile(true);
      setTimeout(() => toast('Plan aktualisiert: jetzt 5–7 Übungen pro Einheit', 4000), 400);
    }
    restoreTimers();
    render();
    // Daten beschädigt oder verschwunden? Sicherungen anbieten
    let missing = false; try { missing = !st.profile && localStorage.getItem('satzwerk.profile') === null; } catch (e) { }
    if (st.corrupt || missing) Backup.list().then(l => { if (l.length || st.corrupt) A.backups(); });
    // Laufendes Training sofort wieder öffnen (iOS lädt die App nach Sperren/App-Wechsel oft neu)
    if (st.profile && st.profile.plan && st.active) {
      if (Date.now() - (st.active.start || 0) < 12 * 3600e3) openWorkout();
      else openSheet({ type: 'stale' });
    }
    if (balCh && balCh.length) setTimeout(() => openSheet({ type: 'balanceInfo', ch: balCh }), 700);
  })();
})();
