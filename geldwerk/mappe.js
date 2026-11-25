/* Geldwerk – kleiner PDF-Schreiber ohne Bibliothek (Text in Helvetica, Fotos als JPEG) und Aufbau der Steuermappe.
   Koordinaten oben links in Punkt (A4 = 595 × 842). In Node testbar. */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory(require('./core.js'));
  else root.GW = Object.assign(root.GW || {}, factory(root.GW));
})(typeof self !== 'undefined' ? self : this, function (G) {
  'use strict';
  const W = 595, H = 842;
  // Zeichenbreiten Helvetica (AFM, 1/1000) für 32–126
  const WID = [278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584];
  const CP = { '€': 0x80, '‚': 0x82, '„': 0x84, '…': 0x85, '‘': 0x91, '’': 0x92, '“': 0x93, '”': 0x94, '•': 0x95, '–': 0x96, '—': 0x97, '›': 0x9B, '‹': 0x8B };
  const SUB = { '−': '-', '→': '->', '✓': 'ok', '≈': 'ca.', '·': '·' };
  // Text → einzelne Bytes in WinAnsi (als Zeichen 0–255)
  function enc(s) {
    let o = '';
    for (let ch of String(s == null ? '' : s)) {
      if (SUB[ch] && SUB[ch] !== ch) ch = SUB[ch];
      for (const c of ch) {
        const code = c.charCodeAt(0);
        if (CP[c]) o += String.fromCharCode(CP[c]);
        else if (code < 256) o += c;
        else o += '?';
      }
    }
    return o;
  }
  function charW(code) {
    if (code >= 32 && code <= 126) return WID[code - 32];
    if ([0xE4, 0xF6, 0xFC, 0x80, 0x96].includes(code)) return 556;
    if (code === 0xC4) return 667; if (code === 0xD6) return 778; if (code === 0xDC) return 722; if (code === 0xDF) return 611;
    if (code === 0x84 || code === 0x93 || code === 0x94) return 333;
    return 556;
  }
  function width(s, size, bold) { let w = 0; for (const c of enc(s)) w += charW(c.charCodeAt(0)); return w * size / 1000 * (bold ? 1.06 : 1); }
  function wrap(s, size, maxW, bold) {
    const out = [];
    for (const para of String(s == null ? '' : s).split('\n')) {
      let line = '';
      for (const word of para.split(' ')) {
        const t = line ? line + ' ' + word : word;
        if (width(t, size, bold) <= maxW || !line) line = t; else { out.push(line); line = word; }
      }
      out.push(line);
    }
    return out;
  }
  const esc = s => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  const col = c => (c || [0.08, 0.1, 0.13]).map(x => x.toFixed(3)).join(' ');

  function doc() {
    const pages = [], images = [];
    function page() {
      const ops = [];
      const p = {
        ops,
        text(x, y, s, o = {}) { const size = o.size || 10; ops.push('BT /' + (o.bold ? 'F2' : 'F1') + ' ' + size + ' Tf ' + col(o.color) + ' rg ' + x.toFixed(2) + ' ' + (H - y - size).toFixed(2) + ' Td (' + esc(enc(s)) + ') Tj ET'); return p; },
        right(xr, y, s, o = {}) { return p.text(xr - width(s, o.size || 10, o.bold), y, s, o); },
        rect(x, y, w, h, c) { ops.push(col(c) + ' rg ' + x.toFixed(2) + ' ' + (H - y - h).toFixed(2) + ' ' + w.toFixed(2) + ' ' + h.toFixed(2) + ' re f'); return p; },
        line(x1, y1, x2, y2, w = 0.5, c) { ops.push(col(c || [0.8, 0.82, 0.85]) + ' RG ' + w + ' w ' + x1.toFixed(2) + ' ' + (H - y1).toFixed(2) + ' m ' + x2.toFixed(2) + ' ' + (H - y2).toFixed(2) + ' l S'); return p; },
        image(ref, x, y, w, h) { ops.push('q ' + w.toFixed(2) + ' 0 0 ' + h.toFixed(2) + ' ' + x.toFixed(2) + ' ' + (H - y - h).toFixed(2) + ' cm /Im' + ref + ' Do Q'); return p; }
      };
      pages.push(p);
      return p;
    }
    function jpeg(bytes, w, h) { images.push({ bytes, w, h }); return images.length - 1; }
    function build() {
      const parts = [], offs = [];
      let len = 0;
      const add = x => { const b = typeof x === 'string' ? latin(x) : x; parts.push(b); len += b.length; };
      const obj = (n, body) => { offs[n] = len; add(n + ' 0 obj\n'); if (Array.isArray(body)) body.forEach(add); else add(body); add('\nendobj\n'); };
      add('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
      // 1 Katalog, 2 Seiten, 3/4 Schriften, dann Bilder, dann je Seite Seite + Inhalt
      const imgBase = 5, pageBase = imgBase + images.length;
      const kids = pages.map((_, i) => (pageBase + 2 * i) + ' 0 R').join(' ');
      obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
      obj(2, '<< /Type /Pages /Kids [' + kids + '] /Count ' + pages.length + ' >>');
      obj(3, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
      obj(4, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
      images.forEach((im, i) => obj(imgBase + i, ['<< /Type /XObject /Subtype /Image /Width ' + im.w + ' /Height ' + im.h + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + im.bytes.length + ' >>\nstream\n', im.bytes, '\nendstream']));
      const xo = images.length ? ' /XObject << ' + images.map((_, i) => '/Im' + i + ' ' + (imgBase + i) + ' 0 R').join(' ') + ' >>' : '';
      pages.forEach((p, i) => {
        const n = pageBase + 2 * i, content = p.ops.join('\n');
        obj(n, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + W + ' ' + H + '] /Resources << /Font << /F1 3 0 R /F2 4 0 R >>' + xo + ' >> /Contents ' + (n + 1) + ' 0 R >>');
        obj(n + 1, '<< /Length ' + latin(content).length + ' >>\nstream\n' + content + '\nendstream');
      });
      const xref = len, count = pageBase + 2 * pages.length;
      let x = 'xref\n0 ' + count + '\n0000000000 65535 f \n';
      for (let i = 1; i < count; i++) x += String(offs[i] || 0).padStart(10, '0') + ' 00000 n \n';
      add(x + 'trailer\n<< /Size ' + count + ' /Root 1 0 R /Info << /Producer (Geldwerk) >> >>\nstartxref\n' + xref + '\n%%EOF\n');
      const out = new Uint8Array(len); let o = 0;
      for (const b of parts) { out.set(b, o); o += b.length; }
      return out;
    }
    return { page, jpeg, build, pages };
  }
  function latin(s) { const b = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i) & 255; return b; }

  /* ---------------- Steuermappe ---------------- */
  const INK = [0.08, 0.1, 0.13], MUTED = [0.42, 0.46, 0.52], ACC = [0.08, 0.16, 0.3], GREEN = [0.1, 0.45, 0.25], LINE = [0.85, 0.87, 0.9];
  // m = { year, title, created, headline, headsub, summary:[[l,v]], wk:[{l,detail,eur,unsure}], elster:[{area, rows:[[l,v]], note}],
  //       months:[{m, work, school, home, eur}], receipts:[{date, merchant, cat, amount, counted, note}], rules:[{titel, quelle, stand, geprueft}],
  //       images:[{bytes, w, h, caption}], disclaimer }
  function mappe(m, onlyCheat) {
    const d = doc();
    let p, y;
    const M = 48, R = W - 48;
    const newPage = (head) => {
      p = d.page(); y = 48;
      p.text(M, 26, 'Geldwerk · ' + (onlyCheat ? 'ELSTER-Spickzettel ' : 'Steuermappe ') + m.year, { size: 8, color: MUTED });
      p.right(R, 26, 'Seite ' + d.pages.length, { size: 8, color: MUTED });
      if (head) { p.text(M, y, head, { size: 18, bold: true, color: ACC }); y += 30; }
    };
    const need = h => { if (y + h > H - 50) newPage(); };
    const para = (s, o = {}) => { for (const l of wrap(s, o.size || 9.5, o.w || (R - M), o.bold)) { need(14); p.text(o.x || M, y, l, Object.assign({ size: 9.5, color: INK }, o)); y += (o.size || 9.5) * 1.35; } };
    const row = (l, v, o = {}) => {
      const lines = wrap(l, o.size || 10, R - M - 120, o.bold);
      need(lines.length * 14 + 4);
      lines.forEach((t, i) => p.text(M + (o.indent || 0), y + i * 13, t, { size: o.size || 10, bold: o.bold, color: o.color || INK }));
      if (v != null) p.right(R, y, v, { size: o.size || 10, bold: o.bold, color: o.vcolor || o.color || INK });
      y += lines.length * 13 + (o.sub ? 0 : 3);
      if (o.sub) { for (const t of wrap(o.sub, 8.5, R - M - 140)) { need(12); p.text(M + (o.indent || 0), y, t, { size: 8.5, color: MUTED }); y += 11; } y += 3; }
      if (o.rule) { p.line(M, y, R, y, 0.4, LINE); y += 5; }
    };
    const h2 = t => { need(40); y += 8; p.text(M, y, t, { size: 12.5, bold: true, color: ACC }); y += 20; };

    if (!onlyCheat) {
      newPage('Steuermappe ' + m.year);
      para(m.disclaimer, { size: 8.5, color: MUTED });
      y += 8;
      p.rect(M, y, R - M, 58, [0.93, 0.95, 0.98]);
      p.text(M + 14, y + 12, m.headline, { size: 20, bold: true, color: m.green ? GREEN : ACC });
      p.text(M + 14, y + 38, m.headsub || '', { size: 9, color: MUTED });
      y += 74;
      h2('Zusammenfassung');
      for (const [l, v] of m.summary) row(l, v, { rule: true });
      h2('Werbungskosten im Einzelnen');
      for (const w of m.wk) row(w.l, G.eur(w.eur), { sub: w.detail + (w.unsure ? ' · ungeprüft' : ''), rule: true });
    }
    // Spickzettel
    newPage(onlyCheat ? 'ELSTER-Spickzettel ' + m.year : 'ELSTER-Spickzettel');
    para('Welcher Betrag in welchen Bereich gehört. Zeilennummern stehen nur, wenn sie für das Jahr geprüft sind – sonst die Bereichsnamen wie in „Mein ELSTER“.', { size: 9, color: MUTED });
    y += 6;
    for (const e of m.elster) {
      need(40);
      p.text(M, y, e.area, { size: 10.5, bold: true, color: ACC }); y += 16;
      for (const [l, v] of e.rows) row(l, v, { indent: 10, size: 9.5 });
      if (e.note) para(e.note, { size: 8.5, color: MUTED, x: M + 10, w: R - M - 10 });
      p.line(M, y + 2, R, y + 2, 0.4, LINE); y += 10;
    }
    if (onlyCheat) return d.build();
    // Fahrten
    if (m.months && m.months.length) {
      newPage('Fahrten ' + m.year);
      para(m.tripNote || '', { size: 9, color: MUTED }); y += 4;
      const cx = [M, M + 150, M + 250, M + 350, R];
      p.text(cx[0], y, 'Monat', { size: 9, bold: true }); p.right(cx[1] + 60, y, 'Arbeit', { size: 9, bold: true }); p.right(cx[2] + 60, y, 'Schule', { size: 9, bold: true }); p.right(cx[3] + 60, y, 'zu Hause', { size: 9, bold: true }); p.right(R, y, 'Betrag', { size: 9, bold: true });
      y += 16;
      for (const r of m.months) {
        need(16);
        p.text(cx[0], y, r.m, { size: 9.5 }); p.right(cx[1] + 60, y, String(r.work || '–'), { size: 9.5 }); p.right(cx[2] + 60, y, String(r.school || '–'), { size: 9.5 }); p.right(cx[3] + 60, y, String(r.home || '–'), { size: 9.5 }); p.right(R, y, G.eur(r.eur, 2), { size: 9.5 });
        y += 14; p.line(M, y - 2, R, y - 2, 0.3, LINE);
      }
      if (m.tripFoot) { y += 6; para(m.tripFoot, { size: 8.5, color: MUTED }); }
      if (m.exceptions && m.exceptions.length) { y += 6; h2('Ausnahmen'); for (const [l, v] of m.exceptions) row(l, v, { size: 9.5 }); }
    }
    // Belegliste
    newPage('Belege ' + m.year);
    if (!m.receipts.length) para('Keine Belege für dieses Jahr.', { color: MUTED });
    for (const r of m.receipts) row(G.fmtDate(r.date) + '  ' + r.merchant, G.eur(r.amount, 2), { sub: r.cat + (r.counted != null && Math.abs(r.counted - r.amount) > 0.005 ? ' · zählt ' + G.eur(r.counted, 2) : '') + (r.note ? ' · ' + r.note : ''), rule: true, size: 9.5 });
    // Belegbilder, je eins pro Seite
    for (const im of m.images || []) {
      newPage();
      p.text(M, y, im.caption, { size: 11, bold: true }); y += 22;
      const maxW = R - M, maxH = H - y - 50, k = Math.min(maxW / im.w, maxH / im.h);
      p.image(d.jpeg(im.bytes, im.w, im.h), M, y, im.w * k, im.h * k);
    }
    // Quellen
    newPage('Regeln und Quellen');
    for (const r of m.rules) row(r.titel + (r.geprueft ? '' : ' (ungeprüft)'), null, { sub: r.quelle + ' · Stand ' + G.fmtDate(r.stand), rule: true, size: 9.5 });
    return d.build();
  }
  return { PDF: { doc, wrap, width, enc }, mappe };
});
