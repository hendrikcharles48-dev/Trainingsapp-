// Web-Push ohne Nutzlast (Worker 2.10, Satzwerk-Mitteilung im Training): der Push „weckt“ nur den Service Worker der App,
// der den Text danach selbst von GET /v1/live/state holt. So braucht es keine Verschlüsselung der Nutzlast – nur die
// VAPID-Signatur (ES256), die der Push-Dienst (Apple/Google) zur Prüfung verlangt. Das Schlüsselpaar erzeugt der Worker
// selbst und legt es im Speicher des Durable Object ab (kein Secret im Repository, nichts im Dashboard einzutragen).

const enc = new TextEncoder();
export const b64u = buf => { const u = buf instanceof Uint8Array ? buf : new Uint8Array(buf); let s = ''; for (const x of u) s += String.fromCharCode(x); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };

export async function vapidKeys(st) {
  let k = await st.get('vapid');
  if (!k) {
    const kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
    k = { priv: await crypto.subtle.exportKey('jwk', kp.privateKey), pub: b64u(await crypto.subtle.exportKey('raw', kp.publicKey)) };
    await st.put('vapid', k);
  }
  return k;
}

export async function vapidHeader(k, endpoint, sub) {
  const head = b64u(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const claims = b64u(enc.encode(JSON.stringify({ aud: new URL(endpoint).origin, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub })));
  const key = await crypto.subtle.importKey('jwk', k.priv, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(head + '.' + claims));
  return 'vapid t=' + head + '.' + claims + '.' + b64u(sig) + ', k=' + k.pub;
}

// Ergebnis: { ok, status, gone } – gone = Abo abgelaufen/abgemeldet (404/410) → Abo löschen
export async function sendPush(st, subscription, subClaim) {
  const k = await vapidKeys(st);
  const r = await fetch(subscription.endpoint, { method: 'POST', headers: { Authorization: await vapidHeader(k, subscription.endpoint, subClaim), TTL: '120', Urgency: 'high' } });
  return { ok: r.ok, status: r.status, gone: r.status === 404 || r.status === 410 };
}
