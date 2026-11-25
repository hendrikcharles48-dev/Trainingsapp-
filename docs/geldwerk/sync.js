/* Geldwerk – Sicherung in ein PRIVATES GitHub-Repository (Muster aus kochwerk/sync.js).
   Daten: geldwerk-daten.json; Belegfotos/PDFs: belege/<id>.<jpg|pdf> (einmal hochgeladen, danach unverändert).
   Ablauf: holen → zusammenführen (pro Eintrag neueste Änderung) → hochladen; bei 409/422 von vorn (max. 3×). Nie blind überschreiben.
   Zugang nur im Gerät (localStorage geldwerk_sync), nie in der Datei oder in einer Sicherung. */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory(require('./core.js'));
  else root.GW = Object.assign(root.GW || {}, { Y: factory(root.GW) });
})(typeof self !== 'undefined' ? self : this, function (G) {
  'use strict';
  const API = 'https://api.github.com';
  const FILE = 'geldwerk-daten.json';
  const REPO_NAME = 'Geldwerk-Daten';

  function b64encode(text) {
    if (typeof Buffer !== 'undefined') return Buffer.from(text, 'utf8').toString('base64');
    return bytesToB64(new TextEncoder().encode(text));
  }
  function bytesToB64(b) {
    if (typeof Buffer !== 'undefined') return Buffer.from(b).toString('base64');
    let s = '';
    for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
    return btoa(s);
  }
  function b64decode(b64) {
    const clean = String(b64 || '').replace(/\s/g, '');
    if (typeof Buffer !== 'undefined') return Buffer.from(clean, 'base64').toString('utf8');
    const bin = atob(clean), b = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(b);
  }
  const cleanRepo = r => String(r || '').trim().replace(/^https?:\/\/github\.com\//i, '').replace(/\.git$/, '').replace(/\/+$/, '');
  function message(status) {
    if (status === 401) return 'Der GitHub-Schlüssel stimmt nicht oder ist abgelaufen.';
    if (status === 403) return 'Der Schlüssel darf nicht schreiben. Bei „Contents“ muss „Read and write“ stehen.';
    if (status === 404) return 'Repository „' + REPO_NAME + '“ nicht gefunden oder der Schlüssel gilt nicht dafür.';
    return 'GitHub antwortet mit Fehler ' + status + '.';
  }
  function client(cfg, fetchFn) {
    const f = fetchFn || (typeof fetch !== 'undefined' ? fetch.bind(globalThis) : null);
    return (path, opt = {}) => f(API + path, Object.assign({}, opt, {
      cache: 'no-store',
      headers: Object.assign({ Authorization: 'Bearer ' + cfg.token, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' }, opt.headers || {})
    }));
  }
  // Zugang prüfen: Repository muss existieren, privat sein und Schreiben erlauben
  async function test(cfg, fetchFn) {
    const gh = client(cfg, fetchFn);
    try {
      const r = await gh('/repos/' + cleanRepo(cfg.repo));
      if (!r.ok) return { ok: false, status: r.status, msg: message(r.status) };
      const j = await r.json();
      if (!j.private) return { ok: false, msg: 'Das Repository ist öffentlich. Für Belege bitte ein PRIVATES Repository nehmen.' };
      if (j.permissions && j.permissions.push === false) return { ok: false, msg: message(403) };
      const f = await gh('/repos/' + cleanRepo(cfg.repo) + '/contents/' + FILE);
      if (f.status === 404) return { ok: true, exists: false };
      if (!f.ok) return { ok: false, msg: message(f.status) };
      return { ok: true, exists: true };
    } catch (e) { return { ok: false, offline: true, msg: 'Keine Verbindung zu GitHub.' }; }
  }
  async function pull(gh, repo) {
    const path = '/repos/' + repo + '/contents/' + FILE;
    const r = await gh(path);
    if (r.status === 404) return { sha: null, data: null };
    if (!r.ok) return { error: message(r.status) };
    const j = await r.json();
    let text;
    if (j.content && j.encoding === 'base64') text = b64decode(j.content);
    else {
      const raw = await gh(path, { headers: { Accept: 'application/vnd.github.raw+json' } });
      if (!raw.ok) return { error: message(raw.status) };
      text = await raw.text();
    }
    try { const d = JSON.parse(text); return { sha: j.sha, data: d && d.app === 'geldwerk' ? d.data : d }; }
    catch (e) { return { error: 'Die Datei auf GitHub ist beschädigt.' }; }
  }
  // Ein Abgleich der Daten. Rückgabe { ok, data, fromRemote, uploaded, error }
  async function syncOnce(cfg, local, fetchFn, device) {
    const gh = client(cfg, fetchFn), repo = cleanRepo(cfg.repo);
    try {
      for (let attempt = 0; attempt < 3; attempt++) {
        const remote = await pull(gh, repo);
        if (remote.error) return { ok: false, error: remote.error };
        let data = G.upgrade(local), fromRemote = false, upload = true;
        if (remote.data) { const m = G.merge(local, remote.data); data = m.data; fromRemote = m.fromRemote; upload = m.fromLocal; }
        if (!upload) return { ok: true, data, fromRemote, uploaded: false };
        const body = { message: 'Sicherung ' + (device || '') + ' ' + new Date().toISOString().slice(0, 16).replace('T', ' '), content: b64encode(JSON.stringify({ app: 'geldwerk', saved: new Date().toISOString(), data })) };
        if (remote.sha) body.sha = remote.sha;
        const r = await gh('/repos/' + repo + '/contents/' + FILE, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (r.status === 409 || r.status === 422) continue;
        if (!r.ok) return { ok: false, error: message(r.status) };
        return { ok: true, data, fromRemote, uploaded: true };
      }
      return { ok: false, error: 'Ein anderes Gerät sichert gerade. Gleich noch einmal.' };
    } catch (e) { return { ok: false, offline: true, error: 'Offline – wird nachgeholt.' }; }
  }
  const filePath = f => 'belege/' + f.id + '.' + (f.type === 'pdf' ? 'pdf' : 'jpg');
  // Eine Belegdatei hochladen (bytes = Uint8Array). Existiert sie schon (422), gilt sie als hochgeladen.
  async function putFile(cfg, f, bytes, fetchFn) {
    const gh = client(cfg, fetchFn);
    try {
      const r = await gh('/repos/' + cleanRepo(cfg.repo) + '/contents/' + filePath(f), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'Beleg ' + f.id, content: bytesToB64(bytes) }) });
      if (r.ok || r.status === 422) return { ok: true };
      return { ok: false, error: message(r.status) };
    } catch (e) { return { ok: false, offline: true }; }
  }
  async function getFile(cfg, f, fetchFn) {
    const gh = client(cfg, fetchFn);
    try {
      const r = await gh('/repos/' + cleanRepo(cfg.repo) + '/contents/' + filePath(f), { headers: { Accept: 'application/vnd.github.raw+json' } });
      if (!r.ok) return { ok: false, status: r.status };
      return { ok: true, bytes: new Uint8Array(await r.arrayBuffer()) };
    } catch (e) { return { ok: false, offline: true }; }
  }
  // Zugangscode zum Weitergeben ans neue Gerät
  const accessCode = cfg => 'geldwerk-zugang:' + cleanRepo(cfg.repo) + ':' + String(cfg.token).trim();
  function parseAccess(text) {
    const m = /(?:geldwerk|kochwerk)-zugang:([^:\s]+\/[^:\s]+):(\S+)/.exec(String(text || ''));
    return m ? { repo: m[1], token: m[2] } : null;
  }
  // Export-Datei (inkl. Belegdateien als Base64)
  function exportText(db, files) { return JSON.stringify({ app: 'geldwerk', version: 1, exported: new Date().toISOString(), data: db, files: files || {} }); }
  function parseBackup(text) {
    let j;
    try { j = JSON.parse(text); } catch (e) { return { error: 'Die Datei ist keine Geldwerk-Sicherung.' }; }
    if (!j || j.app !== 'geldwerk' || !j.data) return { error: 'Die Datei ist keine Geldwerk-Sicherung.' };
    return { data: G.upgrade(j.data), files: j.files || {}, exported: j.exported || null };
  }
  return { FILE, REPO_NAME, b64encode, b64decode, bytesToB64, cleanRepo, test, syncOnce, putFile, getFile, filePath, accessCode, parseAccess, exportText, parseBackup };
});
