# Formwerk-Schnittstelle (Worker ⇄ Satzwerk ⇄ Formwerk)

Stand: Worker 1.0.0 · Modell 1. Diese Datei ist der Vertrag zwischen den Apps. Wenn Satzwerk umgebaut wird,
muss nur `formwerk-link.js` (Repo-Root) dieses Format weiter liefern – sonst nichts.

## Grundsätze

- Einziger Server: Cloudflare Worker `formwerk-worker/` (Free-Plan). Adresse z. B. `https://formwerk.<konto>.workers.dev`.
- Jede Anfrage unter `/v1/…` braucht den Kopf `Authorization: Bearer <APP_PASSWORD>`. Ohne/falsch → `401`.
- CORS nur für `ALLOWED_ORIGIN` (`https://hendrikcharles48-dev.github.io`, in `wrangler.jsonc`).
- Kein gemeinsamer Browser-Speicher zwischen den Apps (iOS trennt Homebildschirm-Apps). Austausch nur über den Worker.
- Geheimnisse (`GARMIN_API_KEY`, `APP_PASSWORD`) nur als Cloudflare-Secrets, nie im Repository.
- Datumsangaben `YYYY-MM-DD` in Ortszeit (`TZ`, Standard `Europe/Berlin`), Zeitpunkte in ms seit 1970 (UTC).

## Satzwerk → Worker: Einheiten senden

`POST /v1/sessions`

```json
{
  "sessions": [{
    "id": "w-lx3k9",                 // Satzwerk-Trainings-ID (eindeutig, max. 80 Zeichen)
    "date": "2026-11-14",            // Trainingstag (Ortszeit)
    "start": 1794660000000,          // Beginn (ms), optional
    "end": 1794663600000,            // Ende (ms) – ab hier klingt die Ermüdung ab
    "name": "Ganzkörper A",
    "source": "satzwerk",
    "sig": "1y8fejq",                // Prüfsumme des Inhalts (ändert sich bei jeder Bearbeitung)
    "exercises": [{
      "id": "pullup", "name": "Klimmzüge",
      "muscles": { "primary": ["lats", "biceps"], "secondary": ["upperback", "forearms"] },
      "sets": [{ "reps": 8, "kg": 0, "sec": null, "rir": 1, "band": "rot" }]
    }]
  }],
  "deleted": ["w-alt123"]            // in Satzwerk gelöschte Trainings
}
```

- `muscles`: Satzwerks Muskelnamen (andere werden ignoriert):
  `chest, lats, upperback, lowback, fdelt, sdelt, rdelt, biceps, triceps, forearms, quads, hams, glutes, calves, abs, obliques`.
- `rir` = Wiederholungen in Reserve (0 = Versagen). Fehlt sie, rechnet Formwerk mit „ziemlich hart“.
- Gleiche `id` noch einmal senden = ersetzen. Höchstens 200 Einheiten pro Anfrage (Satzwerk schickt 50er-Pakete).
- Antwort: `{ ok, stored, deleted, have: { "<id>": "<sig>", … } }` – `have` = alle Einheiten der letzten 60 Tage im Worker.
  Satzwerk merkt sich `have` und schickt beim nächsten Mal nur, was fehlt, anders ist oder gelöscht wurde
  (selbstheilend; offline wird einfach später abgeglichen). Einheiten älter als 400 Tage räumt der Worker weg.

## Worker → Satzwerk: heutige Erholung

`GET /v1/today` (klein, für die Karte auf „Heute“)

```json
{
  "date": "2026-11-14",
  "recovery": { "score": 72, "color": "green", "building": false, "provisional": false },
  "recommendation": { "level": "full", "title": "Kraft voll", "text": "…", "good": ["Brust", "Rücken"], "notes": ["…"], "week": { "done": 1, "goal": 2 } },
  "sleep": { "total": 27000, "short": false },
  "status": { "lastFetch": 1794660000000, "error": null }
}
```

`color`: `green` | `yellow` | `red` | `none`. `level`: `full` | `light` | `rest` | `done`.
Satzwerk zeigt das nur an und ändert nichts am Plan.

## Worker → Formwerk

| Anfrage | Zweck |
|---|---|
| `GET /v1/summary[?force=1]` | Alles für die App: `recovery` (inkl. `parts`, `why`), `recommendation`, `muscles`, `sleep`, `load`, `bodyBattery`, `vitals`, `strength`, `history` (90 Tage), `status`, `settings`. `force=1` = Ziehen zum Aktualisieren (höchstens alle 90 s zu Garmin). |
| `GET/PUT /v1/settings` | `{ sportDays: [1,3], strengthPerWeek: 2 }` (0 = Mo … 6 = So) |
| `POST /v1/refetch` | Garmin-Daten (120 Tage) komplett neu laden |
| `GET /v1/ping` | Verbindungstest |
| `GET /v1/raw?days=7` | Rohdaten von Garmin + was daraus gelesen wurde (Testseite unter `/`) |
| `GET /v1/sessions?days=60` | gespeicherte Satzwerk-Einheiten (zur Kontrolle) |

## Garmin-Abruf (sparsam)

- Ohne Ziehen höchstens alle 30 min, mit Ziehen höchstens alle 90 s, dazu morgens 2× per Cron vorab.
- Erster Abruf: 120 Tage (Basis + Verlauf) in 28-Tage-Stücken. Danach die letzten 3 Tage, einmal täglich 7 Tage.
- Endpunkte laut Garmins offiziellem Client `connect-personal-api-python` 1.0.0 (`formwerk-worker/src/garmin.js`).
