// Kochwerk – Abgleich zwischen iPhone und iPad über eine Datei in einem privaten GitHub-Repository.
// Beide Geräte nutzen denselben Zugangsschlüssel (Fine-grained Token, nur dieses Repository, Contents: Read and write).
// Ablauf wie in Lernwerk: erst holen und zusammenführen (pro Eintrag gewinnt die neueste Änderung), dann hochladen.
// War ein anderes Gerät schneller (409/422), beginnt es von vorn, höchstens dreimal. Nie blind überschreiben.
// Der Schlüssel liegt nur auf dem Gerät (localStorage „kochwerk_sync“) und steht nie in der Datei oder einer Sicherung.
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory(require('./core.js'));
  else root.KW.Y = factory(root.KW);
})(typeof self !== 'undefined' ? self : this, function (KW) {
  'use strict';
  const API = 'https://api.github.com';
  const FILE = 'kochwerk-daten.json';

  function b64encode(text) {
    if (typeof Buffer !== 'undefined') return Buffer.from(text, 'utf8').toString('base64');
    const b = new TextEncoder().encode(text);
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
    if (status === 401) return 'Der Schlüssel stimmt nicht oder ist abgelaufen. Auf GitHub einen neuen erstellen und hier eintragen.';
    if (status === 403) return 'Der Schlüssel darf nicht schreiben. Bei „Contents“ muss „Read and write“ stehen.';
    if (status === 404) return 'Repository nicht gefunden. Name prüfen und ob der Schlüssel für dieses Repository gilt.';
    return 'GitHub antwortet mit Fehler ' + status + '. Später noch einmal.';
  }
  function client(cfg, fetchFn) {
    const f = fetchFn || (typeof fetch !== 'undefined' ? fetch.bind(globalThis) : null);
    return (path, opt = {}) => f(API + path, Object.assign({}, opt, {
      cache: 'no-store',
      headers: Object.assign({ Authorization: 'Bearer ' + cfg.token, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' }, opt.headers || {})
    }));
  }

  // Zugang prüfen: Repository muss existieren und privat sein.
  async function test(cfg, fetchFn) {
    const gh = client(cfg, fetchFn);
    try {
      const r = await gh('/repos/' + cleanRepo(cfg.repo));
      if (!r.ok) return { ok: false, msg: message(r.status) };
      const j = await r.json();
      if (!j.private) return { ok: false, msg: 'Dieses Repository ist öffentlich. Für den Abgleich brauchst du ein privates Repository.' };
      const f = await gh('/repos/' + cleanRepo(cfg.repo) + '/contents/' + FILE);
      if (f.status === 404) return { ok: true, exists: false };
      if (!f.ok) return { ok: false, msg: message(f.status) };
      return { ok: true, exists: true };
    } catch (e) { return { ok: false, msg: 'Keine Verbindung zu GitHub. Internet prüfen.' }; }
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
    let data = null;
    try { data = JSON.parse(text); } catch (e) { return { error: 'Die Datei auf GitHub ist beschädigt.' }; }
    return { sha: j.sha, data };
  }

  // Ein Abgleich. Rückgabe: { ok, data (zusammengeführt), fromRemote (neue Daten vom anderen Gerät), uploaded, error }
  async function syncOnce(cfg, local, fetchFn, device) {
    const gh = client(cfg, fetchFn), repo = cleanRepo(cfg.repo);
    try {
      for (let attempt = 0; attempt < 3; attempt++) {
        const remote = await pull(gh, repo);
        if (remote.error) return { ok: false, error: remote.error };
        let data = KW.upgrade(local), fromRemote = false, upload = true;
        if (remote.data) {
          const m = KW.merge(local, remote.data);
          data = m.data; fromRemote = m.fromRemote; upload = m.fromLocal;
        }
        if (!upload) return { ok: true, data, fromRemote, uploaded: false };
        const body = { message: 'Abgleich ' + (device || '') + ' ' + new Date().toISOString().slice(0, 16).replace('T', ' '), content: b64encode(JSON.stringify(data)) };
        if (remote.sha) body.sha = remote.sha;
        const r = await gh('/repos/' + repo + '/contents/' + FILE, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (r.status === 409 || r.status === 422) continue; // anderes Gerät war schneller: neu holen und zusammenführen
        if (!r.ok) return { ok: false, error: message(r.status) };
        return { ok: true, data, fromRemote, uploaded: true };
      }
      return { ok: false, error: 'Das andere Gerät gleicht gerade ab. Gleich noch einmal.' };
    } catch (e) {
      return { ok: false, offline: true, error: 'Offline – wird nachgeholt.' };
    }
  }

  // Zugang zum Weitergeben ans andere Gerät (als Text, z. B. per AirDrop oder Nachricht an sich selbst)
  const accessCode = cfg => 'kochwerk-zugang:' + cleanRepo(cfg.repo) + ':' + cfg.token.trim();
  function parseAccess(text) {
    const m = /kochwerk-zugang:([^:\s]+\/[^:\s]+):(\S+)/.exec(String(text || ''));
    return m ? { repo: m[1], token: m[2] } : null;
  }

  // ---------- Datensicherung (Export/Import wie in Satzwerk) ----------
  function exportText(db) { return JSON.stringify({ app: 'kochwerk', exported: new Date().toISOString(), data: db }, null, 1); }
  function parseBackup(text) {
    let j;
    try { j = JSON.parse(text); } catch (e) { return { error: 'Die Datei ist keine Kochwerk-Sicherung.' }; }
    const d = j && j.app === 'kochwerk' && j.data ? j.data : j;
    if (!d || d.app !== 'kochwerk' || !d.recipes) return { error: 'Die Datei ist keine Kochwerk-Sicherung.' };
    return { data: KW.upgrade(d), exported: j.exported || null, recipes: KW.live(KW.upgrade(d), 'recipes').length };
  }

  return { FILE, b64encode, b64decode, cleanRepo, test, syncOnce, accessCode, parseAccess, exportText, parseBackup };
});
