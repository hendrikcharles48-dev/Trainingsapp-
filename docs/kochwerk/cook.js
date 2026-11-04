// Kochwerk – Kochsession (mehrere Rezepte gleichzeitig), Boxen, Gefrierfach, Auftau-Hinweis, Hungerknopf, Notfall.
// Hängt an KW als KW.C. Läuft im Browser und in Node (Tests).
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    const KW = require('./core.js'); KW.P = KW.P || require('./plan.js'); KW.S = KW.S || require('./shop.js'); module.exports = factory(KW);
  } else root.KW.C = factory(root.KW);
})(typeof self !== 'undefined' ? self : this, function (KW) {
  'use strict';
  const P = KW.P, S = KW.S;

  // ---------- Ablauf für mehrere Rezepte ----------
  // Ein Paar Hände: Handarbeit belegt die Hände, „nebenbei“-Schritte laufen nach kurzem Ansetzen (1 min) im Hintergrund.
  // Innerhalb eines Rezepts gilt die Reihenfolge. Nach einer langen Wartezeit (> 5 min, z. B. Reis köchelt, Ofen) darf es
  // mit dem nächsten Handgriff weitergehen; kurze Wartezeiten (Wasser kocht) werden abgewartet. Der letzte Schritt
  // eines Rezepts (Verteilen, Abfüllen) wartet, bis alles darin fertig ist.
  // Auswahl: was am frühesten starten kann; bei Gleichstand zuerst Wartezeiten ansetzen, dann das Rezept mit der meisten Restzeit.
  const DEF_MIN = 3;
  function schedule(items) {
    const R = items.map((x, ri) => ({ ri, r: x.r, pots: x.pots || 1, k: 0, earliest: 0, passiveEnds: [], lastPassive: null }));
    const rest = x => x.r.steps.slice(x.k).reduce((s, st) => s + (st.min || DEF_MIN), 0);
    const out = [];
    let hands = 0;
    for (let guard = 0; guard < 500; guard++) {
      const open = R.filter(x => x.k < x.r.steps.length);
      if (!open.length) break;
      const cand = open.map(x => {
        const st = x.r.steps[x.k], last = x.k === x.r.steps.length - 1;
        let e = x.earliest;
        if (last) e = Math.max(e, ...x.passiveEnds, 0);
        return { x, st, start: Math.max(hands, e) };
      });
      cand.sort((a, b) => (a.start - b.start) || ((b.st.passive ? 1 : 0) - (a.st.passive ? 1 : 0)) || (rest(b.x) - rest(a.x)));
      const c = cand[0], st = c.st, dur = st.min || DEF_MIN;
      const wait = c.start > hands ? c.start - hands : 0;
      const step = { ri: c.x.ri, rid: c.x.r.id, name: c.x.r.name, k: c.x.k, n: c.x.k + 1, of: c.x.r.steps.length, text: st.text, tip: st.tip || '', min: st.min || null, passive: !!st.passive, start: c.start, end: c.start + dur, wait, pots: c.x.pots };
      out.push(step);
      if (st.passive) {
        hands = c.start + Math.min(1, dur);
        c.x.passiveEnds.push(c.start + dur);
        c.x.earliest = dur > 5 ? hands : c.start + dur;
      } else {
        hands = c.start + dur;
        c.x.earliest = hands;
      }
      c.x.k++;
    }
    const total = out.reduce((m, s) => Math.max(m, s.end), 0);
    const sequential = items.reduce((s, x) => s + x.r.steps.reduce((a, st) => a + (st.min || DEF_MIN), 0), 0);
    return { steps: out, total, sequential };
  }

  // ---------- Boxen ----------
  const cookedOf = (db, week) => { const c = db.cooked && db.cooked['w' + week]; return c && !c.del ? c : null; };
  // Wohin kommt welche Box? Kühlschrank, solange die Haltbarkeit ab Kochtag reicht, sonst Gefrierfach (Auftauen am Vorabend).
  // Nicht einfrierbar und zu spät: Warnung. Übrige Portionen aus ganzen Töpfen: Reserve.
  function boxes(db, week, opt = {}) {
    const ck = cookedOf(db, week);
    const cd = opt.cookDate || (ck && ck.date) || P.cookDate(db, week);
    const only = opt.recipeIds || (ck && ck.recipeIds) || null;
    const factor = KW.getSetting(db, 'partnerFactor');
    const list = [], used = {};
    for (const e of P.weekEntries(db, week)) {
      const r = P.recipeOf(db, e);
      if (!r || (only && !only.includes(r.id))) continue;
      const diff = P.diffDays(cd, e.date);
      if (diff < 0) continue;
      used[r.id] = (used[r.id] || 0) + 1 + (e.partner ? factor : 0);
      let place, thaw = null;
      if (diff <= r.keepDays) place = 'fridge';
      else if (r.freeze) { place = 'freezer'; thaw = P.addDays(e.date, -1); }
      else place = 'late';
      list.push({ id: e.id, date: e.date, meal: e.meal, rid: r.id, name: r.name, partner: !!e.partner, count: e.partner ? 2 : 1, place, thaw, keepUntil: P.addDays(cd, r.keepDays) });
    }
    const reserve = [];
    for (const pot of S.weekPots(db, week)) {
      if (only && !only.includes(pot.r.id)) continue;
      const left = Math.floor(pot.pots * pot.r.portions - (used[pot.r.id] || 0) + 0.05);
      if (left > 0) reserve.push({ rid: pot.r.id, name: pot.r.name, count: left, place: pot.r.freeze ? 'freezer' : 'fridge', keepUntil: P.addDays(cd, pot.r.keepDays) });
    }
    list.sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
    return { cookDate: cd, list, reserve };
  }
  function finishCooking(db, week, date, recipeIds) { return KW.put(db, 'cooked', { id: 'w' + week, week, date, recipeIds }); }

  // Auftau-Hinweis: Box aus dem Gefrierfach, die morgen gegessen wird (am Vorabend), oder heute (falls vergessen).
  function thawHints(db, today) {
    const out = [];
    for (const ck of KW.live(db, 'cooked')) {
      if (P.diffDays(today, ck.week) > 7 || P.diffDays(ck.week, today) > 14) continue;
      for (const b of boxes(db, ck.week).list) {
        if (b.place !== 'freezer' || (db.thaw && db.thaw['t' + b.id] && !db.thaw['t' + b.id].del)) continue;
        if (b.thaw === today) out.push(Object.assign({ when: 'evening' }, b));
        else if (b.date === today) out.push(Object.assign({ when: 'today' }, b));
      }
    }
    return out;
  }
  function thawDone(db, id) { KW.put(db, 'thaw', { id: 't' + id, done: true }); }

  // ---------- Hungerknopf und Notfall ----------
  // 2–3 schnelle Proteinsnacks, nur als Idee. Täglich wechselnde Auswahl aus den besten (Protein pro kcal).
  function hungerIdeas(db, today, n = 3) {
    const list = KW.live(db, 'recipes').filter(r => r.cat === 'hunger').map(r => ({ r, t: P.portionOf(r), s: P.score(db, r) })).filter(x => x.s > -Infinity);
    list.sort((a, b) => b.s - a.s);
    const top = list.slice(0, Math.max(n, 6));
    const seed = Number(String(today).replace(/-/g, '')) % 997;
    const rot = top.map((x, k) => ({ x, o: (k * 7919 + seed) % 101 + (k < 2 ? -30 : 0) })).sort((a, b) => a.o - b.o).map(y => y.x);
    return rot.slice(0, n).sort((a, b) => b.s - a.s);
  }
  function emergencyIdeas(db) {
    return KW.live(db, 'recipes').filter(r => r.cat === 'emergency').map(r => ({ r, t: P.portionOf(r), s: P.score(db, r) })).filter(x => x.s > -Infinity).sort((a, b) => b.s - a.s);
  }

  return { schedule, boxes, cookedOf, finishCooking, thawHints, thawDone, hungerIdeas, emergencyIdeas };
});
