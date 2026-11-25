/* Geldwerk – Texterkennung auf dem Gerät, kostenlos und ohne fremden Dienst:
   Tesseract.js (deutsch) und pdf.js liegen im Ordner vendor/ und werden erst beim ersten Beleg geladen.
   Danach hält der Service Worker sie offline bereit. */
(function () {
  'use strict';
  const base = new URL('vendor/', location.href).href;
  let tessP = null, workerP = null, pdfP = null;
  function script(src) { return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('Laden fehlgeschlagen')); document.head.appendChild(s); }); }
  let progressCb = null;
  async function worker(onProgress) {
    progressCb = onProgress || null;
    if (!tessP) tessP = window.Tesseract ? Promise.resolve() : script(base + 'tesseract/tesseract.min.js');
    await tessP;
    if (!workerP) {
      workerP = window.Tesseract.createWorker('deu', 1, {
        workerPath: base + 'tesseract/worker.min.js',
        corePath: base + 'tesseract/tesseract-core-simd-lstm.wasm.js',
        langPath: base + 'tesseract',
        cacheMethod: 'none',         // keine Kopie in fremder IndexedDB – der Service Worker hält die Datei
        workerBlobURL: false,
        logger: m => { if (progressCb && m && typeof m.progress === 'number') progressCb(m.status, m.progress); }
      }).catch(e => { workerP = null; throw e; });
    }
    return workerP;
  }
  async function image(blobOrCanvas, onProgress) {
    const w = await worker(onProgress);
    const r = await w.recognize(blobOrCanvas);
    return (r && r.data && r.data.text) || '';
  }
  async function pdfLib() {
    if (!pdfP) pdfP = import(base + 'pdfjs/pdf.min.mjs').then(m => { m.GlobalWorkerOptions.workerSrc = base + 'pdfjs/pdf.worker.min.mjs'; return m; }).catch(e => { pdfP = null; throw e; });
    return pdfP;
  }
  // PDF: Text auslesen und die ersten Seiten als Bild (für Vorschau und Steuermappe). Gescannte PDFs → Texterkennung.
  async function pdf(blob, onProgress, maxPages = 3) {
    const lib = await pdfLib();
    const doc = await lib.getDocument({ data: new Uint8Array(await blob.arrayBuffer()), isEvalSupported: false }).promise;
    let text = '';
    const pages = [];
    const n = Math.min(doc.numPages, maxPages);
    for (let i = 1; i <= n; i++) {
      const pg = await doc.getPage(i);
      const tc = await pg.getTextContent();
      let line = '', lastY = null;
      for (const it of tc.items) {
        const y = it.transform ? Math.round(it.transform[5]) : null;
        if (lastY != null && y != null && Math.abs(y - lastY) > 3) { text += line + '\n'; line = ''; }
        line += (line && !line.endsWith(' ') ? ' ' : '') + it.str; lastY = y;
        if (it.hasEOL) { text += line + '\n'; line = ''; lastY = null; }
      }
      text += line + '\n';
      const vp1 = pg.getViewport({ scale: 1 });
      const scale = Math.min(2.5, 1600 / Math.max(vp1.width, vp1.height));
      const vp = pg.getViewport({ scale });
      const c = document.createElement('canvas'); c.width = Math.round(vp.width); c.height = Math.round(vp.height);
      const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
      await pg.render({ canvasContext: ctx, viewport: vp }).promise;
      pages.push({ blob: await window.GW.canvasJpeg(c, 0.78), w: c.width, h: c.height, canvas: c });
      if (onProgress) onProgress('PDF', i / n);
    }
    if (text.replace(/\s/g, '').length < 25 && pages[0]) text = await image(pages[0].canvas, onProgress);
    return { text, pages, numPages: doc.numPages };
  }
  window.GW.OCR = { image, pdf, warm: () => worker().catch(() => null) };
})();
