/* Formwerk-Anbindung für Satzwerk – eigenständiges Modul (Schnittstelle: formwerk/SCHNITTSTELLE.md).
   - Sendet beendete Einheiten an den Formwerk-Worker (Abgleich über Prüfsummen: neue/geänderte/gelöschte).
     Offline bleibt nichts liegen: die Einheiten liegen ohnehin in Satzwerk, beim nächsten Abgleich gehen sie raus.
   - Liest die heutige Erholung + Empfehlung (rein lesend, ändert nichts am Plan).
   Satzwerk ruft nur auf: FormwerkLink.init({...}), .changed(), .card(), .sheet(). Alles andere ist intern.
   Speicher nur unter satzwerk.formwerk* (nie im Export, nie in Sicherungen). */
(function () {
  'use strict';
  const K = { cfg: 'satzwerk.formwerk', sync: 'satzwerk.formwerkSync', today: 'satzwerk.formwerkToday' };
  const WINDOW_DAYS = 45;
  const DEFAULT_URL = 'https://formwerk.hendrikcharles48.workers.dev'; // Adresse des Formwerk-Workers (kein Geheimnis)
  const get = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
  const set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } };
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  let opt = { workouts: () => [], getEx: () => null, onChange: () => { }, bwLog: () => [], onWeight: () => { } };
  let timer = null, busy = false, msg = '';

  function cfg() { const c = get(K.cfg, null); return c && c.url && c.pw ? c : null; }
  function hash(s) { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }

  // Satzwerk-Training → Schnittstellenformat
  function payload(w) {
    const exercises = (w.exercises || []).map(e => {
      const ex = opt.getEx(e.exId) || {};
      return {
        id: e.exId, name: ex.name || '',
        muscles: { primary: (ex.prim || []).slice(), secondary: (ex.sec || []).slice() },
        sets: (e.sets || []).filter(s => s.done !== false).map(s => { const o = {}; if (s.reps != null) o.reps = s.reps; if (s.w != null) o.kg = s.w; if (s.sec != null) o.sec = s.sec; if (s.rir != null) o.rir = s.rir; if (s.band) o.band = s.band; return o; })
      };
    }).filter(e => e.sets.length);
    const end = w.ts || Date.parse(w.date + 'T18:00:00');
    const p = { id: String(w.id), date: w.date, start: w.dur ? end - w.dur * 1000 : null, end, name: w.name || '', source: 'satzwerk', exercises };
    p.sig = hash(JSON.stringify(p));
    return p;
  }

  async function api(path, o = {}) {
    const c = cfg(); if (!c) throw new Error('nicht eingerichtet');
    const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), o.timeout || 20000);
    try {
      const r = await fetch(c.url.replace(/\/+$/, '') + path, { method: o.method || 'GET', headers: Object.assign({ Authorization: 'Bearer ' + c.pw }, o.body || o.raw ? { 'Content-Type': 'application/json' } : {}), body: o.raw != null ? o.raw : o.body ? JSON.stringify(o.body) : undefined, signal: ctl.signal, cache: 'no-store' });
      if (o.text && r.ok) return await r.text();
      if (o.text && r.status === 404) return null;
      let j = null; try { j = await r.json(); } catch (e) { }
      if (!r.ok) throw new Error(r.status === 401 ? 'Passwort falsch' : (j && j.message) || 'Fehler ' + r.status);
      return j;
    } catch (e) { throw new Error(e.name === 'AbortError' ? 'Zeitüberschreitung' : e instanceof TypeError ? 'offline' : e.message); }
    finally { clearTimeout(tm); }
  }

  async function sync() {
    if (!cfg() || busy || (typeof navigator !== 'undefined' && navigator.onLine === false)) return;
    busy = true;
    const S = get(K.sync, { sent: {} });
    try {
      const all = opt.workouts() || [];
      const min = iso(new Date(Date.now() - WINDOW_DAYS * 864e5));
      const ids = new Set(all.map(w => String(w.id)));
      const changed = all.filter(w => w.date >= min).map(payload).filter(p => S.sent[p.id] !== p.sig);
      const deleted = Object.keys(S.sent).filter(id => !ids.has(id));
      if (!changed.length && !deleted.length && S.last && Date.now() - S.last < 24 * 3600e3) { busy = false; return; }
      let res = null;
      for (let i = 0; i < Math.max(1, changed.length); i += 50) res = await api('/v1/sessions', { method: 'POST', body: { sessions: changed.slice(i, i + 50), deleted: i === 0 ? deleted : [] } });
      // Einmalig: bisherige Gewichtseinträge aus Satzwerk an Formwerk geben (überschreibt dort nichts)
      let bwSent = S.bwSent;
      if (!bwSent) { const log = (opt.bwLog() || []).filter(x => x && x.d && x.kg); if (log.length) await api('/v1/weight', { method: 'POST', body: { entries: log.map(x => ({ date: x.d, kg: x.kg, ifMissing: true, src: 'satzwerk' })) } }); bwSent = Date.now(); }
      set(K.sync, { sent: (res && res.have) || {}, last: Date.now(), err: null, bwSent });
      if (changed.some(p => p.date === iso(new Date()))) refreshToday(true);
    } catch (e) {
      set(K.sync, Object.assign(S, { err: e.message, errAt: Date.now() }));
    }
    busy = false;
  }

  async function refreshToday(quiet) {
    if (!cfg()) return;
    try { const j = await api('/v1/today'); set(K.today, { t: Date.now(), data: j }); if (j && j.weight) try { opt.onWeight(j.weight, j.weights || []); } catch (e) { } }
    catch (e) { const T = get(K.today, {}); set(K.today, Object.assign(T, { err: e.message })); }
    opt.onChange();
  }

  const COLOR = { green: '#7FBF9A', yellow: '#D9C27F', red: '#D98F8F', none: '#8D97A8' };
  // Kleine Karte für die Startseite (leer, wenn nicht eingerichtet oder keine Werte von heute)
  function card() {
    if (!cfg()) return '';
    const T = get(K.today, null); const d = T && T.data;
    if (!d || d.date !== iso(new Date())) return '';
    const r = d.recovery || {}, c = d.recommendation || {};
    const val = r.building ? 'Basis im Aufbau' : r.score == null ? 'noch keine Werte' : r.score + ' %';
    const good = (c.good || []).slice(0, 4).join(', ');
    return `<button class="card fwcard" data-a="formwerkSheet" style="display:flex;align-items:center;gap:14px;width:100%;text-align:left;border:1px solid var(--line,#232A35);padding:14px 16px;min-height:64px;color:inherit">
      <span style="width:12px;height:12px;flex:0 0 12px;border-radius:50%;background:${COLOR[r.color] || COLOR.none}"></span>
      <span style="flex:1;min-width:0"><span style="display:block;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted,#8D97A8);font-weight:600">Formwerk · Erholung ${esc(val)}</span>
      <b style="display:block;font-size:17px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(c.title || '–')}</b>
      ${good ? `<span style="display:block;font-size:13px;color:var(--muted,#8D97A8);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Gut heute: ${esc(good)}</span>` : ''}${(d.pain || []).length ? `<span style="display:block;font-size:13px;color:var(--highlight,#C9D8EA);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Schonen: ${esc(d.pain.map(p => p.label).join(', '))}</span>` : ''}</span></button>`;
  }

  // Fenster „Formwerk“ (Einstellungen + heutige Details). Knöpfe über data-fw, nicht über Satzwerks data-a.
  function sheet() {
    const c = cfg() || get(K.cfg, {}) || {}; const S = get(K.sync, {}); const T = get(K.today, null); const d = T && T.data;
    const ago = t => { if (!t) return 'noch nie'; const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'gerade eben' : m < 60 ? 'vor ' + m + ' min' : m < 1440 ? 'vor ' + Math.round(m / 60) + ' h' : 'am ' + new Date(t).toLocaleDateString('de-DE'); };
    const today = d && d.date === iso(new Date()) ? d : null;
    return `<div class="stack"><div><div class="eyebrow">Anbindung</div><h2>Formwerk</h2>
      <div class="small muted">Satzwerk schickt jede beendete Einheit an Formwerk und zeigt hier die heutige Erholung. Am Plan ändert sich nichts.</div></div>
      ${today ? `<div class="card" style="border:1px solid var(--line)"><div class="eyebrow">Heute</div><b style="font-size:20px">${esc(today.recommendation.title)}</b><div class="small muted">Erholung ${today.recovery.building ? 'wird aufgebaut' : today.recovery.score == null ? '–' : today.recovery.score + ' %'}${today.recommendation.week ? ' · Kraft diese Woche ' + today.recommendation.week.done + '/' + today.recommendation.week.goal : ''}</div>
        <div class="small" style="margin-top:6px">${esc(today.recommendation.text || '')}</div>${(today.recommendation.notes || []).map(n => `<div class="small muted" style="margin-top:4px">· ${esc(n)}</div>`).join('')}</div>` : ''}
      <div><label class="lbl" for="fw-url">Worker-Adresse</label><input class="field" id="fw-url" inputmode="url" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="https://formwerk.….workers.dev" value="${esc(c.url || DEFAULT_URL)}"></div>
      <div><label class="lbl" for="fw-pw">App-Passwort</label><input class="field" id="fw-pw" type="password" autocomplete="current-password" value="${esc(c.pw || '')}"></div>
      <div class="small" id="fw-msg" style="min-height:20px;color:var(--muted)">${esc(msg || (cfg() ? 'Zuletzt abgeglichen: ' + ago(S.last) + (S.err ? ' · Fehler: ' + S.err : '') : 'Noch nicht verbunden.'))}</div>
      <button class="btn primary" data-fw="save">${cfg() ? 'Speichern & abgleichen' : 'Verbinden'}</button>
      ${cfg() ? '<button class="btn ghost danger" data-fw="off">Verbindung trennen</button>' : ''}</div>`;
  }

  async function save() {
    const url = (document.getElementById('fw-url') || {}).value || ''; const pw = (document.getElementById('fw-pw') || {}).value || '';
    const m = document.getElementById('fw-msg');
    if (!/^https:\/\/[^\s/]+\.[^\s/]+/.test(url.trim())) { if (m) m.textContent = 'Bitte die vollständige https-Adresse eingeben.'; return; }
    if (!pw.trim()) { if (m) m.textContent = 'Bitte das App-Passwort eingeben.'; return; }
    const prev = get(K.cfg, null);
    set(K.cfg, { url: url.trim().replace(/\/+$/, ''), pw: pw.trim() });
    if (m) m.textContent = 'Verbinde …';
    try {
      await api('/v1/ping');
      // neue Adresse = neuer Abgleich (alles im Fenster erneut senden)
      if (!prev || prev.url !== url.trim().replace(/\/+$/, '')) set(K.sync, { sent: {} });
      msg = 'Verbunden.'; await sync(); await refreshToday(true);
      const S = get(K.sync, {}); msg = S.err ? 'Verbunden, aber Abgleich fehlgeschlagen: ' + S.err : 'Verbunden und abgeglichen.';
    } catch (e) { set(K.cfg, prev); msg = 'Nicht verbunden: ' + e.message; }
    opt.onChange(true); setTimeout(() => { msg = ''; }, 8000);
  }
  function off() { try { localStorage.removeItem(K.cfg); localStorage.removeItem(K.sync); localStorage.removeItem(K.today); } catch (e) { } msg = 'Verbindung getrennt.'; opt.onChange(true); }

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-fw]'); if (!b) return; e.preventDefault();
    if (b.dataset.fw === 'save') save(); else if (b.dataset.fw === 'off') off();
  });

  window.FormwerkLink = {
    // workouts(): alle gespeicherten Trainings, getEx(id): Übung mit prim/sec, onChange(): Ansicht neu zeichnen
    init(o) {
      opt = Object.assign(opt, o || {});
      if (!cfg()) return;
      setTimeout(sync, 2500);
      const T = get(K.today, null);
      if (!T || Date.now() - T.t > 20 * 60e3) setTimeout(() => refreshToday(true), 1200);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState !== 'visible' || !cfg()) return;
        const t = get(K.today, null); if (!t || Date.now() - t.t > 20 * 60e3) refreshToday(true);
        sync();
      });
      addEventListener('online', () => sync());
    },
    // nach jeder Änderung an Trainings (speichern/löschen) – gebündelt nach 4 s
    changed() { if (!cfg()) return; clearTimeout(timer); timer = setTimeout(sync, 4000); },
    card, sheet,
    // Heutige Formwerk-Daten (nur wenn von heute) – Grundlage für Vorschläge in Satzwerk
    today() { const T = get(K.today, null); const d = T && T.data; return d && d.date === iso(new Date()) ? d : null; },
    plan() { const T = get(K.today, null); return cfg() && T && T.data && T.data.plan ? T.data.plan : null; }, // Baseball-Tage/gute Kraft-Tage gelten auch von gestern
    tfPrefill() { const d = this.today(); const p = d && d.prefill && d.prefill.tf; if (!p || (p.en == null && p.sl == null)) return {}; const o = { fw: p.why || 'Formwerk' }; if (p.en != null) o.en = p.en; if (p.sl != null) o.sl = p.sl; return o; },
    weekPrefill() { const d = this.today(); return (d && d.prefill && d.prefill.week) || null; },
    signals() { const d = this.today(); return (d && d.signals) || null; },
    // Schmerz aus dem Formwerk-Morgen-Check: Hinweis bei Übungen, die diese Stelle belasten (ex.inj)
    painHint(ex) {
      const T = get(K.today, null); const d = T && T.data; if (!d || d.date !== iso(new Date()) || !ex || !ex.inj) return '';
      const hit = (d.pain || []).filter(p => p.inj && ex.inj.includes(p.inj) && p.lvl >= 2); if (!hit.length) return '';
      const p = hit[0];
      return `<div class="card flat small" style="border:1px solid var(--highlight,#C9D8EA);margin-top:8px"><b>${esc(p.label)} schmerzt heute (${p.lvl}/5)</b> – diese Übung belastet sie. ${p.lvl >= 4 ? 'Heute besser auslassen.' : 'Leichter oder über „Tauschen“ eine schonendere Variante wählen.'}${p.days >= 3 ? ' Seit mehreren Tagen – bitte abklären lassen.' : ''}</div>`;
    },
    // Sicherung von Satzwerk im Worker (Export-JSON). get → Objekt oder null (noch keine), Fehler werfen.
    async backupPut(text) { const r = await api('/v1/backup/satzwerk', { method: 'PUT', raw: text, timeout: 60000 }); if (!r || !r.ok) throw new Error((r && r.error) || 'Sicherung fehlgeschlagen'); return r; },
    async backupGet() { const t = await api('/v1/backup/satzwerk', { text: true, timeout: 60000 }); return t ? JSON.parse(t) : null; },
    configured: () => !!cfg(),
    statusLine() { if (!cfg()) return 'Nicht verbunden'; const S = get(K.sync, {}); return S.err ? 'Fehler: ' + S.err : 'Verbunden' + (S.last ? ' · abgeglichen ' + new Date(S.last).toLocaleDateString('de-DE') : ''); },
    _payload: payload, _sync: sync
  };
})();
