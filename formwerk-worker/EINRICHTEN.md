# Formwerk-Worker einrichten (vom iPhone aus, ca. 15 Minuten)

Alles im Safari-Browser. Nichts davon kommt ins Repository – Schlüssel und Passwort liegen nur bei Cloudflare.

## 1. Garmin-Schlüssel erstellen
1. In Safari `connect.garmin.com/app/settings/personalApiToken` öffnen und mit dem Garmin-Konto anmelden.
2. „Create Key“ / „Schlüssel erstellen“, Bedingungen annehmen, **längste Gültigkeit** wählen.
3. Schlüssel **sofort kopieren** (wird nur einmal angezeigt) und kurz in der Notizen-App zwischenparken.

## 2. App-Passwort ausdenken
Ein langes Passwort, das nur du kennst (z. B. 4–5 zufällige Wörter). Es kommt gleich in Cloudflare und
später einmal in Formwerk und Satzwerk. Ebenfalls kurz in Notizen parken.

## 3. Cloudflare-Konto
1. `dash.cloudflare.com/sign-up` → E-Mail + Passwort → E-Mail bestätigen. Der kostenlose Plan reicht.

## 4. Worker aus GitHub bauen lassen
1. Im Cloudflare-Dashboard: **Compute (Workers)** → **Workers & Pages** → **Create** → **Import a repository**.
2. **GitHub verbinden** → Cloudflare-App installieren → „Only select repositories“ → `Trainingsapp-` → Install.
3. Repository `Trainingsapp-` auswählen. Einstellungen:
   - **Project name:** `formwerk` (muss so heißen)
   - **Advanced settings → Root directory / Path:** `formwerk-worker`
   - Build command leer lassen, **Deploy command:** `npx wrangler deploy` (Standard)
   - Production branch: `main`
4. **Deploy**. Der erste Lauf dauert 1–2 Minuten.

## 5. Geheimnisse setzen
1. Worker `formwerk` öffnen → **Settings** → **Variables and Secrets** → **Add**.
2. Typ **Secret**, Name `GARMIN_API_KEY`, Wert = Garmin-Schlüssel → Deploy/Save.
3. Noch einmal **Add**: Typ **Secret**, Name `APP_PASSWORD`, Wert = dein App-Passwort → Save.
4. Danach die Notiz mit Schlüssel und Passwort löschen (Passwort am besten im iPhone-Schlüsselbund speichern).

## 6. Testen
1. Im Worker oben die Adresse kopieren: `https://formwerk.<dein-name>.workers.dev`.
2. In Safari öffnen → Testseite „Garmin-Test“ → Passwort → **7 Tage laden**.
3. Oben die Tabelle „Was Formwerk daraus liest“, unten die Rohdaten jedes Abrufs (grüner Punkt = ok).
   Fehlende Spalten oder rote Punkte → Screenshot an Claude, dann wird das Auslesen angepasst.

## 7. Apps verbinden
- **Formwerk**: `hendrikcharles48-dev.github.io/Trainingsapp-/formwerk/` → Teilen → „Zum Home-Bildschirm“ →
  vom Homebildschirm öffnen → Worker-Adresse + Passwort → Verbinden.
- **Satzwerk**: Einstellungen → Daten → **Formwerk (Erholung)** → Adresse + Passwort → Verbinden.
  Die Trainings der letzten 45 Tage werden einmal übertragen.

## Später
- Jeder Merge nach `main`, der `formwerk-worker/` ändert, wird automatisch neu bereitgestellt.
- Garmin-Schlüssel abgelaufen → neuen erstellen, Secret `GARMIN_API_KEY` ersetzen (Schritt 5).
- Kosten: keine (Workers Free: 100 000 Anfragen/Tag, Durable Objects mit SQLite inklusive).
