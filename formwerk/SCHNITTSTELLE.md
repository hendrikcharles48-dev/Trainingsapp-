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

`pain`: `[{k, label, lvl 1–3, inj, days}]` heutiger Schmerz (`inj` = Satzwerk-Belastung `shoulder|elbow|wrist|lowback|knee`), `checkin`: heute eingetragen.
`weight`: `{date, kg, src}` (neuester Wert, `src` `formwerk`/`satzwerk`/`garmin`), `weights`: die letzten 60 Werte.
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
| `POST /v1/weight` | Körpergewicht `{date, kg}` (kg `null` = löschen) oder `{entries:[{date, kg, ifMissing, src}]}` |
| `POST /v1/checkin` | Morgen-Check `{date, sore: {gruppe: 1–2}, pain: {stelle: 1–3}, bb}`; `{bbOnly: true, bb}` = nur „gestern Baseball?“ |
| `GET /v1/checkin?days=90` | Check-ins |
| `GET /v1/weight` | alle von Hand eingetragenen Gewichte |
| `PUT/GET /v1/coach` | Wochenbericht von Claude (`{v:1, id, title, summary, points, actions, built}`, max. 64 KB); GET → `{coach, prev}`. Format: Skill `satzwerk-wochenbericht` |
| `PUT/GET /v1/backup/satzwerk` | Satzwerk-Sicherung (Export-JSON, `app: 'satzwerk'`); vorige Fassung bleibt im Worker |

## Garmin-Abruf (sparsam)

- Ohne Ziehen höchstens alle 30 min, mit Ziehen höchstens alle 90 s, dazu morgens 2× per Cron vorab.
- Erster Abruf: 120 Tage (Basis + Verlauf) in 28-Tage-Stücken. Danach die letzten 3 Tage, einmal täglich 7 Tage.
- Endpunkte laut Garmins offiziellem Client `connect-personal-api-python` 1.0.0 (`formwerk-worker/src/garmin.js`).

## Körpergewicht und Sicherung (ab Satzwerk 3.11 / Worker 1.2)

- Eingetragen wird nur noch in **Formwerk** (Karte „Körpergewicht“). Garmin-Werte (falls in Garmin Connect gewogen) zählen
  auch, von Hand gewinnt am selben Tag. Satzwerk übernimmt die Werte aus `/v1/today` in `profile.bwLog` (nur ergänzen).
  Beim ersten Abgleich schickt Satzwerk sein bisheriges `bwLog` mit `ifMissing: true` (überschreibt nichts).
- Satzwerk sichert automatisch in den Worker (`Cloud` mit `cfg().worker`), wenn Formwerk verbunden ist und kein
  GitHub-Zugang eingerichtet ist. Gleicher Schutz wie bei GitHub: fehlen hier Trainings, die in der Sicherung liegen,
  wird nicht überschrieben.

## Körpergefühl (Worker 1.3, Formwerk 1.2, Satzwerk 3.12)

- Gruppen: `brust, ruecken, schultern, bizeps, trizeps, griff, rumpf, vorn, hinten, waden`.
- Schmerz-Stellen: `nacken, schulter, ellbogen, handgelenk, oberer_ruecken, unterer_ruecken, huefte, leiste, oberschenkel, knie, sprunggelenk, achilles`.
- Satzwerk zeigt `pain` im Training bei Übungen mit passendem `inj` (`FormwerkLink.painHint(ex)`) und auf der Formwerk-Karte.

## Vorschläge und Signale (Worker 1.6, Satzwerk 3.13)

`GET /v1/today` enthält zusätzlich:
- `signals`: `{stress: {flag, reasons}, deload: {suggest, count, reasons}}`
- `prefill`: `{tf: {en 0–2, sl 0–2, why}, week: {ans: {exh, fit, sleep, sore, pain, sport}, src}}` – Werte wie in Satzwerks
  Tagesform (Energie/Schlaf: 0 niedrig/schlecht, 1 normal/okay, 2 hoch/gut) und `E.CHECKIN`.
- `plan`: `{sportDays, baseballToday, strengthDays}` (0 = Mo … 6 = So).
