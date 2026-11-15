# Formwerk – offene Schritte (Stand 15.11.2026)

Worker läuft: https://formwerk.hendrikcharles48.workers.dev (Secrets gesetzt, Deploy command `npx wrangler deploy`, Root `/formwerk-worker`).

Claude: Diese Liste bei jeder Formwerk-/Satzwerk-Sitzung zuerst lesen, den Nutzer an den nächsten offenen
Schritt erinnern und erledigte Punkte abhaken. Ausführliche Anleitung: `formwerk-worker/EINRICHTEN.md`.

## Nutzer (am iPhone)
- [x] 1. Garmin-Schlüssel erstellen: connect.garmin.com/app/settings/personalApiToken → „Create Key“, längste Gültigkeit, sofort kopieren
- [x] 2. App-Passwort ausdenken (lang, nur für Formwerk/Satzwerk)
- [x] 3. Cloudflare-Konto anlegen: dash.cloudflare.com/sign-up
- [x] 4. Worker anlegen: Workers & Pages → Create → Import a repository → GitHub (nur `Trainingsapp-`) →
        Project name `formwerk`, Root directory `formwerk-worker`, Deploy
- [x] 5. Secrets setzen: Worker → Settings → Variables and Secrets → `GARMIN_API_KEY`, `APP_PASSWORD` (Typ Secret)
- [ ] 6. Testseite `https://formwerk.<name>.workers.dev` öffnen → Passwort → „7 Tage laden“
- [ ] 7. Screenshot der Tabelle „Was Formwerk daraus liest“ (bei roten Punkten auch Rohdaten) + Worker-Adresse an Claude schicken
- [ ] 8. Formwerk in Safari öffnen → Teilen → „Zum Home-Bildschirm“ → Adresse + Passwort → Verbinden
- [ ] 9. Satzwerk: Einstellungen → Daten → „Formwerk (Erholung)“ → Adresse + Passwort → Verbinden

## Claude (nach Schritt 7)
- [ ] Garmin-Auslesen (`formwerk-worker/src/normalize.js`) an die echten Antworten anpassen, `NORM_VERSION` erhöhen
- [x] Worker-Adresse als `DEFAULT_URL` in `formwerk/app.js` und als Vorbelegung in `formwerk-link.js` eintragen
      (Adresse ist kein Geheimnis; Passwort NIE eintragen)
- [ ] Prüfen: Einheit in Satzwerk beenden → erscheint in Formwerk bei den Muskelgruppen; Satzwerk zeigt die Erholung
