---
name: satzwerk-etappe
description: Setzt die nächste offene Etappe der Satzwerk-Roadmap um. Nutzen bei „nächste Etappe“, „weiter mit Satzwerk“, „Roadmap“ oder wenn der Nutzer eine bestimmte Satzwerk-Etappe nennt.
---

# Satzwerk – nächste Etappe umsetzen

Grundregel: **Bestehende Trainingsdaten, Verlauf, Pläne und Rekorde nie verlieren.**

## Ablauf

1. `CLAUDE.md` und `docs/ROADMAP.md` lesen (Roadmap ganz: Regeln oben + die betroffene Etappe genau).
2. Die erste Etappe ohne Haken wählen (oder die vom Nutzer genannte). In Etappe 6 den nächsten offenen Vorschlag
   bzw. alle nicht abgelehnten.
3. Dem Nutzer einen **kurzen Plan** zeigen (3–6 Zeilen: was sich für ihn ändert, Datenrisiko) und **auf OK warten**.
   Ausnahme: Der Nutzer hat ausdrücklich gesagt, dass nicht gefragt werden muss.
4. Sparsam arbeiten: `app.js` hat sehr lange Zeilen – gezielt per Suche lesen (`grep -n`, `cut -c`), nicht die ganze
   Datei. Keine Subagenten, keine Netzrecherche.
5. Umsetzen wie in der Roadmap beschrieben. Nur Satzwerk-Dateien anfassen (nicht `kochwerk/`, `stunden/`, `toleranzen/`
   und deren Ordner in `docs/`).
6. Prüfen:
   - `node --check app.js && node --check engine.js`
   - `node pwa/build.js`
   - Prüfkriterien der Etappe mit Chromium (Playwright, 390×844) gegen `pwa/dist` durchgehen, soweit möglich.
   - Bei Änderungen an gespeicherten Daten: mit einem alten Datenstand (vor der Etappe) starten und zeigen, dass
     Verlauf, Plan und Rekorde vollständig bleiben.
7. Ausliefern:
   - `APP_VERSION` in `app.js` erhöhen, `CACHE` in `pwa/sw.js` hochzählen.
   - `cp pwa/dist/* docs/` (nie `rm -rf docs/*`).
   - Regel „eigene Übungen prüfen“ aus `CLAUDE.md` beachten.
8. `docs/ROADMAP.md`: Etappe abhaken (`[x]`, Datum, Version). `CLAUDE.md` aktualisieren, wenn sich Aufbau,
   Datenmodell, Speicherschlüssel oder Trainingsregeln geändert haben.
9. Committen und pushen, dann Pull Request nach `main` anlegen und mergen (dauerhafte Freigabe des Nutzers: jedes Update
   direkt live). Dem Nutzer kurz sagen, was neu ist und was er **am iPhone prüfen** soll (App einmal ganz schließen und neu
   öffnen; Versionsnummer steht unten in den Einstellungen).

## Verbote

- Keine gespeicherten Felder löschen oder umbenennen; neue Felder nur zusätzlich.
- Kein `localStorage.clear()`, nur Schlüssel mit `satzwerk.`.
- Keine fremden Dienste, kein Server, keine neuen Bibliotheken.
- Keine persönlichen Gesundheitsdaten in Repo-Dateien (Repository ist öffentlich).
