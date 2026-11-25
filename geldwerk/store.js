/* Geldwerk – Speicher auf dem Gerät.
   IndexedDB „geldwerk“: Speicher „kv“ (Schlüssel „db“ = alle Daten) und „files“ (Belegfotos/PDFs als Blob).
   localStorage nur mit Präfix „geldwerk_“ (Zugänge, Stand der Sicherung) – nie localStorage.clear(), die Adresse teilen sich mehrere Apps. */
(function () {
  'use strict';
  const G = window.GW;
  const DBN = 'geldwerk';
  let dbp = null;
  function idb() {
    if (dbp) return dbp;
    dbp = new Promise((res, rej) => {
      const r = indexedDB.open(DBN, 1);
      r.onupgradeneeded = () => { const d = r.result; if (!d.objectStoreNames.contains('kv')) d.createObjectStore('kv'); if (!d.objectStoreNames.contains('files')) d.createObjectStore('files'); };
      r.onsuccess = () => { const d = r.result; d.onversionchange = () => { d.close(); dbp = null; }; res(d); };
      r.onerror = () => rej(r.error);
      r.onblocked = () => rej(new Error('blockiert'));
    });
    return dbp;
  }
  async function tx(store, mode, fn) {
    const d = await idb();
    return new Promise((res, rej) => {
      const t = d.transaction(store, mode), s = t.objectStore(store);
      let out; const r = fn(s);
      if (r && 'onsuccess' in r) r.onsuccess = () => { out = r.result; };
      t.oncomplete = () => res(out); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error);
    });
  }
  const LS = {
    get(k, d) { try { const v = localStorage.getItem('geldwerk_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('geldwerk_' + k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del(k) { try { localStorage.removeItem('geldwerk_' + k); } catch (e) { } },
    raw(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    keys() { const out = []; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith('geldwerk_')) out.push(k); } } catch (e) { } return out; }
  };
  const Store = {
    LS,
    async load() { try { return G.upgrade(await tx('kv', 'readonly', s => s.get('db'))); } catch (e) { return G.upgrade(LS.get('notfall', null)); } },
    async save(data) {
      try { await tx('kv', 'readwrite', s => s.put(data, 'db')); LS.del('notfall'); return true; }
      catch (e) { LS.set('notfall', data); return false; }
    },
    async putFile(f) { await tx('files', 'readwrite', s => s.put(f, f.id)); },
    async getFile(id) { try { return await tx('files', 'readonly', s => s.get(id)); } catch (e) { return null; } },
    async fileKeys() { try { return await tx('files', 'readonly', s => s.getAllKeys()); } catch (e) { return []; } },
    async markUp(id) { const f = await Store.getFile(id); if (f && !f.up) { f.up = true; await Store.putFile(f); } },
    async delFile(id) { await tx('files', 'readwrite', s => s.delete(id)); },
    // Alles von Geldwerk auf diesem Gerät löschen (nur eigene Daten)
    async wipe() {
      for (const k of LS.keys()) try { localStorage.removeItem(k); } catch (e) { }
      try { const d = await idb(); d.close(); } catch (e) { }
      dbp = null;
      await new Promise(res => { const r = indexedDB.deleteDatabase(DBN); r.onsuccess = r.onerror = r.onblocked = () => res(); });
      try { const ks = await caches.keys(); await Promise.all(ks.filter(k => k.startsWith('geldwerk-push')).map(k => caches.delete(k))); } catch (e) { }
    }
  };
  // Foto verkleinern: lange Kante höchstens 1600 px, JPEG. Rückgabe { blob, w, h }
  async function compress(file, max = 1600, q = 0.74) {
    let img, w, h;
    try { img = await createImageBitmap(file, { imageOrientation: 'from-image' }); w = img.width; h = img.height; }
    catch (e) {
      img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Bild nicht lesbar')); i.src = URL.createObjectURL(file); });
      w = img.naturalWidth; h = img.naturalHeight;
    }
    const k = Math.min(1, max / Math.max(w, h));
    const cw = Math.max(1, Math.round(w * k)), ch = Math.max(1, Math.round(h * k));
    const c = document.createElement('canvas'); c.width = cw; c.height = ch;
    const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, cw, ch); x.drawImage(img, 0, 0, cw, ch);
    if (img.close) img.close();
    const blob = await new Promise(res => c.toBlob(res, 'image/jpeg', q));
    return { blob, w: cw, h: ch, canvas: c };
  }
  async function canvasJpeg(c, q = 0.74) { return new Promise(res => c.toBlob(res, 'image/jpeg', q)); }
  window.GW.Store = Store;
  window.GW.compress = compress;
  window.GW.canvasJpeg = canvasJpeg;
})();
