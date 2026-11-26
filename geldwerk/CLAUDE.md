# Geldwerk – Hinweise für Claude

Steuer-Sammler, Verträge und Belege (Vanilla JS, keine Bibliotheken außer `vendor/` Tesseract.js + pdf.js).
Live: https://hendrikcharles48-dev.github.io/Trainingsapp-/geldwerk/ (Quelle `geldwerk/`, Kopie nach `docs/geldwerk/`).
Bauplan `PLAN.md`, eigene Entscheidungen `ENTSCHEIDUNGEN.md`, Blockformat `BLOCKFORMAT.md`.

## Regeln
- Speicher nur `geldwerk_…` (localStorage) und IndexedDB `geldwerk`; nie `localStorage.clear()`, nie fremde Schlüssel ändern
  (Satzwerk, Kochwerk, Lernwerk, Formwerk teilen die Adresse). Gespeicherte Felder nie umbenennen/löschen, Neues nur zusätzlich.
- Repository ist öffentlich: keine Daten, Tokens, Belege im Code oder in Commits.
- Steuerregeln nur aus `regeln/<jahr>.json` (Quelle, Link, Stand, `geprueft`). Ungeprüftes zeigt die App als „ungeprüft“.
  Neues Steuerjahr: Datei anlegen, Feiertage (Test prüft gegen Osterformel) und Ferien eintragen, `RULE_YEARS` in `app.js`
  und `CORE` in `sw.js` ergänzen.
- Bei jedem Release `CACHE` in `sw.js` hochzählen und `VERSION` in `app.js`.
- Design (1.2): hell + dunkel über Variablen in `style.css` (`:root`, Dunkel-Block zweimal: Media-Query und `[data-theme=dark]`).
  Keine festen Farben in HTML/SVG – Diagramme nur über Klassen `ch-…`, `ring-…`, `bl-…`.
- Tests: `node geldwerk/test/run.js` (Logik) und mit Server im Repo-Root (`python3 -m http.server 8123`)
  `node geldwerk/test/ui.js <ordner>` (Durchlauf als neuer Nutzer im iPhone-Format, nachgebautes GitHub).
  Worker: `cd formwerk-worker && node test/model.test.js`.

## Aufbau
- `core.js` (`GW`): Datum, Feiertage NI, `trips` (Fahrten), `taxYear`/`taxChain` (Schätzung, Verlustvortrag), `nextCancel`
  (Kündigungsdatum), `merge` (Sicherung), `inbox` (Zu erledigen), `reminders` (Push-Termine).
- `parse.js`: `receipt(text)` (Texterkennung auswerten), `blocks(text)` (Geldwerk-Block). `mappe.js`: PDF-Schreiber + Steuermappe.
- `charts.js` (`GW.Chart`): `line`, `bars`, `hbars`, `ring`, `range` als SVG/HTML, eine Farbe; Auswahl `data-a="chSel"` (`st.chSel`, `st.month`).
- `sync.js` (`GW.Y`): privates Repo `Geldwerk-Daten`, Datei `geldwerk-daten.json`, Fotos `belege/<id>.jpg|pdf`.
- `push.js`: Formwerk-Worker `/v1/gw/subscribe|reminders|test|off`, `GET /v1/gw/state?t=` (ohne Passwort, Token).
- `app.js`: Zustand `st`, Reiter `viewHome/viewBelege/viewVertraege/viewSteuer`, Seiten-Stapel `PAGES` (setup, receipt,
  contract, cal, settings, rules, cheat, block), Blätter `SHEETS`, Klicks `data-a` → `A`, Eingaben `data-in` → `IN`,
  `data-ch` → `CH`. Daten nur über `commit()` ändern (speichert, rechnet neu, sichert gebündelt).
- Daten (`db`): `settings`, `receipts{}`, `contracts{}`, `exc{datum}` (Fahrten-Ausnahmen), `tax{jahr}`, `learn{händler}`,
  `dismissed{key}`; jeder Eintrag mit `upd`, Löschen als `{del:true, upd}`.
