---
name: satzwerk-wochenbericht
description: Wöchentlicher Satzwerk-Bericht wie von einem Trainer – liest Sicherung, Garmin-Werte und Morgen-Checks aus dem Formwerk-Worker, baut neue eigene Übungen ein und legt den Bericht für die App ab. Nutzen bei „Wochenbericht“, in der geplanten Sonntags-Aufgabe oder wenn der Nutzer eine Auswertung seines Trainings will.
---

# Satzwerk – Wochenbericht

Grundregeln: **Am Plan nichts selbst ändern** – nur Vorschläge, die der Nutzer in der App annimmt. **Persönliche Daten
(Sicherung, Gewicht, Garmin, Schmerz) nie ins Repository schreiben** – nur in den Scratchpad und in den Worker.
Texte kurz, deutsch, ohne Fachwörter. Der Nutzer heißt so, wie `facts.name` sagt (nie fest eintragen).

## 1. Daten holen

Worker: `https://formwerk.hendrikcharles48.workers.dev` (Adresse ist kein Geheimnis). Das Passwort ist als
Zugangsdaten der Umgebung gespeichert, der Netzwerk-Proxy setzt es ein – im Befehl nur einen Platzhalter senden:

```bash
S=<scratchpad>; U=https://formwerk.hendrikcharles48.workers.dev; H='Authorization: Bearer platzhalter'
curl -sf -H "$H" $U/v1/backup/satzwerk -o $S/bk.json
curl -sf -H "$H" "$U/v1/summary" -o $S/summary.json
curl -sf -H "$H" "$U/v1/checkin?days=21" -o $S/checkins.json
curl -sf -H "$H" $U/v1/coach -o $S/coach-alt.json
```

Kommt 401/403 oder „no rule allows host“: einmal etwa eine Minute warten und wiederholen. Klappt es dann nicht,
abbrechen und melden (Zugangsdaten fehlen) – nichts erfinden.

## 2. Eigene Übungen einbauen

`node tools/coach.js custom $S/bk.json` listet eigene Übungen, die noch nicht eingebaut sind. Für jede: Regel
„eigene Übungen“ aus `CLAUDE.md` (exercises.js mit `alias` = Name des Nutzers, howto.js, figures.js-`map`).
Danach `node --check`, `node pwa/build.js`, kurz mit Playwright prüfen, `APP_VERSION`/`CACHE` hochzählen,
`cp pwa/dist/* docs/`, committen, Pull Request nach `main` und mergen (dauerhafte Freigabe). Namen in `built` des Berichts.
Unklar, was gemeint ist (z. B. „Übung 1“)? Nicht raten – im Bericht als Punkt nachfragen.

## 3. Fakten rechnen

`node tools/coach.js facts $S/bk.json $S/summary.json $S/checkins.json > $S/facts.json` und lesen. Darin u. a.:
Einheiten der Woche gegen Plan, harte Sätze je Muskel (`done7`) gegen Ziel/Plan, Übungen mit Verlauf und `stalled`
(≥ 4 Einheiten, seit ≥ 18 Tagen kein neuer Bestwert), Alternativen je Platz, Reserve (`rir`), Gewichtstrend
(`weight.trendPctPerWeek`, Ziel bei `recomp` −0,25 bis −0,75), Zyklus-Woche, Formwerk (Erholung, Schlaf, Signale,
Schmerz), Morgen-Checks, `coachDone` (was der Nutzer letzte Woche angenommen/abgelehnt hat).

## 4. Bericht schreiben (`$S/bericht.json`)

```json
{ "v": 1, "id": "2026-W46", "created": "<ISO>", "title": "…", "summary": "…",
  "points": [{ "t": "…", "d": "…" }],
  "actions": [{ "id": "a1", "kind": "swap|sets|rr|deload", "label": "…", "why": "…",
                "planId": "…", "dayId": "…", "slotId": "…", "loc": "home|gym", "to": "<exId>", "sets": 4, "rr": [8, 12] }],
  "built": [] }
```

- `id` = ISO-Kalenderwoche. `title` ≤ 60 Zeichen, `summary` 2–3 Sätze (≤ 600 Zeichen), höchstens 6 `points`, 4 `actions`.
- Erst das Gute, dann das Wichtigste. Zahlen nennen, die der Nutzer kennt (Sätze, kg, Wdh., Prozent).
- Vorschläge nur mit klarem Grund aus den Fakten und nach den Regeln in `CLAUDE.md` (Wissenschaftliche Regeln):
  - `swap`: Übung steht still (`stalled`) → Variante aus `alternatives` (gleiche Bewegung, Level passend, Geräte da).
    Bei Schmerz an einer Stelle (Formwerk `pain`) eine schonendere Variante.
  - `sets`: Muskel klar unter Ziel (geplant) → +1 Satz an einem passenden Platz, Deckel 15 je Muskel und Woche,
    im Defizit (`recomp`) eher nicht mehr Volumen. Klar über Deckel → −1.
  - `rr`: Wiederholungsbereich, wenn z. B. die Obergrenze dauernd gerissen wird oder Gelenke meckern.
  - `deload`: nur bei mehreren Zeichen (Leistung fällt, Formwerk-Signale, schlechter Schlaf, Check-in) und nicht in der Einstiegswoche.
  - Nichts vorschlagen, was in `coachDone` letzte Woche abgelehnt wurde. Plan `custom`/`edited` darf Vorschläge bekommen –
    der Nutzer entscheidet.
- Wenig Daten (0–1 Einheiten)? Kurzer, freundlicher Bericht ohne Vorschläge.

## 5. Prüfen und ablegen

```bash
node tools/coach.js check $S/bk.json $S/bericht.json      # muss OK melden, sonst Bericht korrigieren
curl -sf -X PUT -H "$H" -H 'Content-Type: application/json' --data-binary @$S/bericht.json $U/v1/coach
```

Satzwerk holt den Bericht beim nächsten Öffnen (Karte „Wochenbericht“ auf Heute, auch unter Fortschritt).
Zum Schluss in 2–3 Zeilen melden: Titel, Anzahl Vorschläge, eingebaute Übungen.
