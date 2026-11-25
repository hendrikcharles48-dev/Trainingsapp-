# Geldwerk – Bauplan

Steuer-Sammler, Verträge und Belege in einer Web-App (GitHub Pages, Home-Bildschirm-App).
Adresse: https://hendrikcharles48-dev.github.io/Trainingsapp-/geldwerk/

## Übernommene Muster aus dem Repository
- **Sicherung über privates GitHub-Repository** wie Kochwerk (`kochwerk/sync.js`): erst holen und pro Eintrag
  zusammenführen (neueste Änderung gewinnt, Löschungen als Grabstein), dann hochladen, bei 409/422 neu versuchen.
  Zugang nur im Gerät (`geldwerk_sync`), nie in Datei oder Sicherung. Belegfotos als eigene Dateien `belege/<id>.jpg`.
- **Web-Push ohne Nutzlast** wie Satzwerk 3.25 (`formwerk-worker/src/push.js`, `pwa/sw.js`): Worker weckt den
  Service Worker, der holt den Text mit einem Token von `GET /v1/gw/state`. Gleicher Formwerk-Worker, eigener Bereich `gw:`.
- **Service Worker** wie Kochwerk: eigener Ordner, eigener Cache-Name `geldwerk-…`, löscht nie fremde Caches.
- **Speicher**: nur `geldwerk_…`-Schlüssel in localStorage (Zugänge, Stand), Daten in IndexedDB `geldwerk`.
- **Design** Satzwerk 3.7: Graphit / Tiefblau / Eisblau, Grün nur für Geld zurück/erledigt, Rot nur für abgelaufene Fristen.

## Aufbau
| Datei | Inhalt |
|---|---|
| `index.html`, `style.css` | Gerüst, Tab-Leiste, gesamtes CSS |
| `core.js` | reine Rechenlogik (Node-testbar): Datum, Feiertage, Fahrten, Steuer, Verträge, Zusammenführen, Posteingang, Erinnerungen |
| `parse.js` | Texterkennung auswerten (Datum, Betrag, Händler, Kategorie), Geldwerk-Block lesen |
| `mappe.js` | eigener kleiner PDF-Schreiber (Text + JPEG) für Steuermappe und Spickzettel |
| `store.js` | IndexedDB, Bilder verkleinern (lange Kante 1600 px, JPEG) |
| `sync.js` | Sicherung ins private Repository `Geldwerk-Daten` |
| `ocr.js` | Tesseract.js (deutsch) und pdf.js – lokal im Ordner `vendor/`, erst bei Bedarf geladen |
| `push.js` | Anbindung an den Formwerk-Worker (Erinnerungen) |
| `app.js` | Oberfläche |
| `sw.js` | Offline, Push |
| `regeln/2026.json`, `regeln/2027.json` | Steuerregeln je Jahr mit Quelle, Link, Stand, geprüft ja/nein; Feiertage, Ferien |
| `test/*.test.js` | Node-Tests (`node geldwerk/test/run.js`) |

## Etappen
1. [x] Grundgerüst, Design, Einrichtung, Belege mit Texterkennung, Posteingang, Sicherung
2. [x] Fahrten automatisch, Steuer-Reiter mit Regeldatei 2026 und Schätzung
3. [x] Verträge, Garantie/Rückgabe, Push über den Worker
4. [x] Steuermappe-PDF, ELSTER-Spickzettel, Geldwerk-Block
5. [x] Qualitätsschleife: Tests, iPhone-Prüfung 390×844 (WebKit), Durchlauf als neuer Nutzer

## Rechenregeln (Kurzfassung, Details mit Quellen in `regeln/<jahr>.json`)
- Fahrten: Arbeitstage im Arbeitszeitraum (Wochentage, ohne Feiertage NI, minus Urlaubstage) × volle km × 0,38 €;
  Schultage im Schulzeitraum (ohne Ferien und Feiertage) × km × 0,38 €. Minijob-Fahrten zählen nicht (pauschal versteuert).
  Ausnahmen je Tag: krank, frei, Prüfung, anderer Weg (eigene km), Lernen zu Hause (Tagespauschale), Zusatztag.
- Werbungskosten = Fahrten + Belege (beruflicher Anteil) − Zuschuss Aufstiegs-BAföG + Pauschalen. Mindestens
  Arbeitnehmer-Pauschbetrag 1.230 € (höchstens bis zur Höhe des Lohns).
- Einkünfte − Verlustvortrag − Sonderausgaben (Vorsorge, Spenden, 36 €) → zu versteuerndes Einkommen → Tarif § 32a.
  Erstattung = einbehaltene Lohnsteuer (+ Soli + KiSt) − berechnete Steuer. Spanne: ohne/mit ungeprüften Posten und unsicheren Belegen.
- Negativer Gesamtbetrag → Verlust feststellen lassen, Vortrag ins nächste Jahr.
- Verträge: Laufzeitenden ab Beginn (Mindestlaufzeit, dann Verlängerung), Kündigungsdatum = Ende + 1 Tag − Frist − 1 Tag.

## Stand (25.11.2026)
Alle Etappen umgesetzt und geprüft: 40 Logik-Tests, Worker-Tests 44/44, Oberflächen-Durchlauf als neuer Nutzer
(Einrichtung, Foto mit echter Texterkennung, PDF, Block, 2 Verträge, Steuer-Reiter, Mappe-PDF, Löschen + Wiederherstellen,
Offline-Start) ohne Befund.

Offen (nur durch Hendrik am iPhone): privates Repository + Schlüssel, Worker-Passwort in Geldwerk, Mitteilungen erlauben.
Ungeprüft und sichtbar markiert: Tarif 2027, Tagespauschale für Lerntage, Kontoführungs-/Telefonpauschale, Soli/KiSt/Vorsorge-Werte,
Ferien ab Sommer 2027, Zeilennummern im ELSTER-Spickzettel (darum nur Bereichsnamen).
