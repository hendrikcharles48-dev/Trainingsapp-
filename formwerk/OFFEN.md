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
- [x] 6. Testseite `https://formwerk.<name>.workers.dev` öffnen → Passwort → „7 Tage laden“
- [x] 7. Screenshot der Tabelle „Was Formwerk daraus liest“ (bei roten Punkten auch Rohdaten) + Worker-Adresse an Claude schicken
- [x] 8. Formwerk in Safari öffnen → Teilen → „Zum Home-Bildschirm“ → Adresse + Passwort → Verbinden
- [ ] 9. Satzwerk: Einstellungen → Daten → „Formwerk (Erholung)“ → Adresse + Passwort → Verbinden

## Claude (nach Schritt 7)
- [x] Garmin-Auslesen (`formwerk-worker/src/normalize.js`) an die echten Antworten anpassen, `NORM_VERSION` erhöhen
- [x] Worker-Adresse als `DEFAULT_URL` in `formwerk/app.js` und als Vorbelegung in `formwerk-link.js` eintragen
      (Adresse ist kein Geheimnis; Passwort NIE eintragen)
- [ ] Prüfen: Einheit in Satzwerk beenden → erscheint in Formwerk bei den Muskelgruppen; Satzwerk zeigt die Erholung

Hinweis: Vivoactive 5 liefert HRV, Schlaf (Phasen, Schlafwert), Ruhepuls, Stress, Schritte, Body Battery, HF-Zonen (Worker 1.1.0 liest alles).
Aktivitäten waren im Test leer – Baseball/Rad nur in der Belastung, wenn sie auf der Uhr als Aktivität aufgezeichnet werden.

## Noch zu prüfen (Stand 19.11.)
- [ ] Neuer Morgen-Check (Formwerk 1.9): Muskelkater 4 Stufen per Tipp, Schmerz ja/nein – am iPhone einmal durchtippen
- [ ] Satzwerk 3.23: Einheit mit Muskelkater/Schmerz starten → Zeilen über den Übungen stimmen? (Worker 2.7 muss gebaut sein: /v1/readiness)
- [ ] Satzwerk 3.24: im Modus „Bestätigen“ testen; wenn alles passt, in Einstellungen → Anpassungen auf „Vollautomatisch“ stellen
- [ ] Nach 2–3 Wochen prüfen: Sätze je Muskel (10–20) und leichtere Woche sinnvoll? Zyklus wurde einmalig auf 6 Wochen gestellt
- [ ] Streifen unten / Tab-Leiste nach iOS-Höhenausgleich (Satzwerk 3.10.3, Formwerk 1.0.5) auf dem iPhone bestätigt? Sonst Zeile „Anzeige …“ unter Mehr erfragen
- [ ] Satzwerk verbunden (Schritt 9) → Muskelgruppen in Formwerk + Karte auf Satzwerk-„Heute“
- [x] Cron-Vorabruf morgens aktiv (04:40 + 05:40 UTC, im Dashboard bestätigt 15.11.)
- [ ] Körpergefühl: nach ~14 Morgen-Checks prüfen, ob Muster/Lernen sinnvoll aussehen (Verlauf → Körpergefühl)
