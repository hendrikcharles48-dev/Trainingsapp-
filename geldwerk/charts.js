/* Geldwerk – kleine Diagramme als SVG/HTML ohne Bibliothek.
   Eine Farbe (Eisblau), Größe über Länge/Höhe, Auswahl per Tipp (data-a="chSel"), Wert als Pille über dem gewählten Punkt.
   Kontraste auf --surface: Eisblau 8,3:1, gedämpfte Balken #557AA6 4,1:1, Raster/Achsen zurückhaltend. */
(function (root) {
  'use strict';
  const G = root.GW;
  const ACC = 'var(--accent)', MUTE = '#557AA6', GRID = 'var(--line)', TXT = 'var(--muted)', INK = 'var(--ink)';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const short = v => { const a = Math.abs(v); return (v < 0 ? '−' : '') + (a >= 10000 ? Math.round(a / 1000) + ' Tsd. €' : G.eur(Math.round(a))); };
  // Pille mit Wert über einem Punkt (bleibt im Bild)
  function pill(x, y, text, W) {
    const w = Math.max(44, text.length * 6.6 + 18), h = 24;
    const px = Math.min(W - w - 2, Math.max(2, x - w / 2));
    return '<g><rect x="' + px.toFixed(1) + '" y="' + (y - h - 8).toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + h + '" rx="12" fill="var(--navy2)" stroke="var(--accent)" stroke-width="1"/>' +
      '<text x="' + (px + w / 2).toFixed(1) + '" y="' + (y - 8 - 7.5).toFixed(1) + '" text-anchor="middle" font-size="12.5" font-weight="700" fill="' + INK + '">' + esc(text) + '</text></g>';
  }
  // Monoton steigende Kurve (Fritsch-Carlson) – schießt nicht über die Punkte hinaus
  function smooth(P) {
    if (P.length < 3) return 'M' + P.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('L');
    const n = P.length, d = [], m = [];
    for (let i = 0; i < n - 1; i++) d.push((P[i + 1][1] - P[i][1]) / (P[i + 1][0] - P[i][0]));
    m[0] = d[0]; m[n - 1] = d[n - 2];
    for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
    for (let i = 0; i < n - 1; i++) { if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; } const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b; if (s > 9) { const t = 3 / Math.sqrt(s); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; } }
    let p = 'M' + P[0][0].toFixed(1) + ',' + P[0][1].toFixed(1);
    for (let i = 0; i < n - 1; i++) { const h = (P[i + 1][0] - P[i][0]) / 3; p += 'C' + (P[i][0] + h).toFixed(1) + ',' + (P[i][1] + m[i] * h).toFixed(1) + ' ' + (P[i + 1][0] - h).toFixed(1) + ',' + (P[i + 1][1] - m[i + 1] * h).toFixed(1) + ' ' + P[i + 1][0].toFixed(1) + ',' + P[i + 1][1].toFixed(1); }
    return p;
  }
  // Linie (z. B. gesammelte Werbungskosten über das Jahr) mit Bezugslinie (Pauschbetrag)
  function line(o) {
    const W = 340, H = 168, T = 40, B = 22, L = 4, R = 4;
    const pts = o.pts, n = pts.length, last = o.upto != null ? o.upto : n - 1;
    const max = Math.max(1, ...pts.map(p => p.v), o.ref ? o.ref.v * 1.12 : 0) * 1.05;
    const X = i => L + (W - L - R) * (n === 1 ? 0.5 : i / (n - 1)), Yv = v => T + (H - T - B) * (1 - v / max);
    const P = pts.slice(0, last + 1).map((p, i) => [X(i), Yv(p.v)]);
    const sel = Math.min(o.sel != null ? o.sel : last, last);
    let s = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.label || '') + '">';
    s += '<line x1="0" x2="' + W + '" y1="' + (H - B) + '" y2="' + (H - B) + '" stroke="' + GRID + '" stroke-width="1"/>';
    if (o.ref) { const y = Yv(o.ref.v); s += '<line x1="0" x2="' + W + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '" stroke="' + TXT + '" stroke-width="1" stroke-dasharray="3 4"/><text x="' + (W - 2) + '" y="' + (y - 5).toFixed(1) + '" text-anchor="end" font-size="10.5" fill="' + TXT + '">' + esc(o.ref.l) + '</text>'; }
    if (P.length > 1) {
      const path = smooth(P);
      s += '<path d="' + path + 'L' + P[P.length - 1][0].toFixed(1) + ',' + (H - B) + 'L' + P[0][0].toFixed(1) + ',' + (H - B) + 'Z" fill="' + ACC + '" fill-opacity=".12"/>';
      s += '<path d="' + path + '" fill="none" stroke="' + ACC + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
    }
    const sx = X(sel), sy = Yv(pts[sel].v);
    s += '<line x1="' + sx.toFixed(1) + '" x2="' + sx.toFixed(1) + '" y1="' + sy.toFixed(1) + '" y2="' + (H - B) + '" stroke="' + TXT + '" stroke-width="1"/>';
    s += '<circle cx="' + sx.toFixed(1) + '" cy="' + sy.toFixed(1) + '" r="5" fill="' + ACC + '" stroke="var(--chart-bg, var(--surface))" stroke-width="2"/>';
    s += pill(sx, sy, short(pts[sel].v), W);
    pts.forEach((p, i) => { if (n > 7 && i % 2 && i !== sel) return; if (n > 7 && i !== sel && Math.abs(i - sel) === 1) return; s += '<text x="' + X(i).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="' + (i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle') + '" font-size="10.5" font-weight="' + (i === sel ? 700 : 500) + '" fill="' + (i === sel ? INK : TXT) + '">' + esc(p.l) + '</text>'; });
    for (let i = 0; i <= last; i++) { const x0 = i === 0 ? 0 : (X(i - 1) + X(i)) / 2, x1 = i === n - 1 ? W : (X(i) + X(i + 1)) / 2; s += '<rect data-a="chSel" data-c="' + o.id + '" data-i="' + i + '" x="' + x0.toFixed(1) + '" y="0" width="' + (x1 - x0).toFixed(1) + '" height="' + H + '" fill="transparent"/>'; }
    return s + '</svg>';
  }
  // Säulen je Monat; gewählte Säule hell, die anderen gedämpft
  function bars(o) {
    const W = 340, H = 158, T = 40, B = 22;
    const pts = o.pts, n = pts.length;
    const max = Math.max(1, ...pts.map(p => p.v)) * 1.05;
    const slot = W / n, bw = Math.min(26, slot - 8);
    let s = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.label || '') + '">';
    s += '<line x1="0" x2="' + W + '" y1="' + (H - B) + '" y2="' + (H - B) + '" stroke="' + GRID + '" stroke-width="1"/>';
    pts.forEach((p, i) => {
      const x = slot * i + (slot - bw) / 2, h = p.v > 0 ? Math.max(3, (H - T - B) * p.v / max) : 0, y = H - B - h, on = i === o.sel, r = Math.min(4, h / 2);
      if (h) s += '<path d="M' + x.toFixed(1) + ',' + (H - B) + 'V' + (y + r).toFixed(1) + 'Q' + x.toFixed(1) + ',' + y.toFixed(1) + ' ' + (x + r).toFixed(1) + ',' + y.toFixed(1) + 'H' + (x + bw - r).toFixed(1) + 'Q' + (x + bw).toFixed(1) + ',' + y.toFixed(1) + ' ' + (x + bw).toFixed(1) + ',' + (y + r).toFixed(1) + 'V' + (H - B) + 'Z" fill="' + (on ? ACC : MUTE) + '"/>';
      s += '<text x="' + (x + bw / 2).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="middle" font-size="10.5" font-weight="' + (on ? 700 : 500) + '" fill="' + (on ? INK : TXT) + '">' + esc(p.l) + '</text>';
      s += '<rect data-a="chSel" data-c="' + o.id + '" data-i="' + i + '" x="' + (slot * i).toFixed(1) + '" y="0" width="' + slot.toFixed(1) + '" height="' + H + '" fill="transparent"/>';
    });
    if (o.sel != null && pts[o.sel]) { const p = pts[o.sel], h = p.v > 0 ? Math.max(3, (H - T - B) * p.v / max) : 0; s += pill(slot * o.sel + slot / 2, H - B - h, short(p.v), W); }
    return s + '</svg>';
  }
  // Waagerechte Balken mit Beschriftung (Kategorien, Zusammensetzung); optional Markierung (z. B. Pauschbetrag)
  function hbars(rows, o = {}) {
    const max = Math.max(1, ...rows.map(r => Math.abs(r.v)), o.mark ? o.mark.v : 0);
    let h = '<div class="hbars">';
    for (const r of rows) {
      const w = Math.max(r.v ? 1.5 : 0, Math.abs(r.v) / max * 100);
      h += '<div class="hb"' + (r.a ? ' data-a="' + r.a + '"' + (r.d ? ' data-d="' + esc(r.d) + '"' : '') + ' role="button" tabindex="0"' : '') + '><div class="hb-top"><span class="ell">' + (r.icon || '') + esc(r.l) + (r.tag ? ' <span class="tag grey">' + esc(r.tag) + '</span>' : '') + '</span><b>' + esc(r.txt != null ? r.txt : G.eur(Math.round(r.v))) + '</b></div><div class="hb-track"><i style="width:' + w.toFixed(1) + '%' + (r.v < 0 ? ';background:var(--muted)' : '') + '"></i></div></div>';
    }
    if (o.mark) h += '<div class="hb-mark" style="--m:' + (o.mark.v / max * 100).toFixed(1) + '%"><span>' + esc(o.mark.l) + '</span></div>';
    return h + '</div>';
  }
  // Fortschrittsring (z. B. Checkliste 3 von 5)
  function ring(done, total, size = 64) {
    const r = size / 2 - 5, c = 2 * Math.PI * r, f = total ? done / total : 0;
    return '<svg class="ring" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '" role="img" aria-label="' + done + ' von ' + total + '"><circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="var(--line)" stroke-width="6"/>' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="' + (f >= 1 ? 'var(--green)' : ACC) + '" stroke-width="6" stroke-linecap="round" stroke-dasharray="' + (c * f).toFixed(1) + ' ' + c.toFixed(1) + '" transform="rotate(-90 ' + size / 2 + ' ' + size / 2 + ')"/>' +
      '<text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-size="' + (size / 4.2).toFixed(0) + '" font-weight="800" fill="' + INK + '">' + done + '/' + total + '</text></svg>';
  }
  // Spanne der Schätzung als Band mit Punkt (unten/oben beschriftet)
  function range(low, mid, high, o = {}) {
    const lo = Math.min(low, mid), hi = Math.max(high, mid), span = Math.max(1, hi - lo), pad = span * 0.6 + 50;
    const a = lo - pad, b = hi + pad, P = v => ((v - a) / (b - a) * 100).toFixed(1);
    const close = P(hi) - P(lo) < 34;
    return '<div class="range" aria-label="Spanne ' + esc(G.eur(low)) + ' bis ' + esc(G.eur(high)) + '"><div class="range-track"><i style="left:' + P(lo) + '%;width:' + Math.max(1, P(hi) - P(lo)).toFixed(1) + '%"></i><b style="left:' + P(mid) + '%"></b></div>' +
      '<div class="range-lab">' + (close ? '<span class="one" style="left:' + P(mid) + '%">Spanne ' + esc(o.bothL || (G.eur(Math.round(low)) + ' – ' + G.eur(Math.round(high)))) + '</span>' : '<span style="left:' + P(lo) + '%">' + esc(o.lowL || G.eur(Math.round(low))) + '</span><span style="left:' + P(hi) + '%">' + esc(o.highL || G.eur(Math.round(high))) + '</span>') + '</div></div>';
  }
  G.Chart = { line, bars, hbars, ring, range, short };
})(typeof self !== 'undefined' ? self : this);
