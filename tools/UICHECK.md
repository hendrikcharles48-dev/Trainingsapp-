# App-Prüfung (für jedes Modell, gedacht für Haiku)

Ziel: Anzeigefehler finden und beheben – **ohne** an Funktionen oder gespeicherten Daten etwas zu ändern.

## Werkzeuge
- `node tools/uicheck.js <seite> --width 375,390 --deep` – tippt jeden Knopf an und meldet Programmfehler,
  Überlappungen (Text/Symbol über Text/Symbol) und Inhalte über den Rand. Fotos je Fund im `--out`-Ordner.
  Seiten (relativ zu `docs/`): `index.html` (Satzwerk), `kochwerk/index.html`, `formwerk/index.html`,
  `stunden/index.html`, `toleranzen/index.html`, `geldwerk/index.html`.
  Vorher die App bauen, falls sie eine Build-Stufe hat (Satzwerk: `node pwa/build.js` + Kopie nach `docs/`, siehe CLAUDE.md).
  Mit `--storage datei.json` echte Daten (z. B. Sicherung im Scratchpad) laden – solche Dateien nie ins Repo.
- Tests: `node tools/engine.test.js`, `node tools/sw-push.test.js`, `node kochwerk/test.js`, `node toleranzen/test.js`,
  `node formwerk-worker/test/model.test.js` – nur Fehlerzeilen ansehen (`| tail -5`).

## Ablauf
1. Regeln der App lesen (`CLAUDE.md` der App, Abschnitt Design).
2. Tests + `uicheck.js` bei 375 und 390 px laufen lassen.
3. Jeden Fund **als Foto ansehen**. Echter Anzeigefehler → mit CSS beheben (kürzen mit „…“, Abstand, Größe, Umbruch).
   Gewollt ist z. B. Zahl im Ring oder ein Knopf auf einer Bildkachel ohne gezeichnete Teile darunter.
4. Erneut prüfen, bis 0 Funde. Dann nach den Regeln in `CLAUDE.md` live stellen (Version/Cache erhöhen, PR, mergen).

## Grenzen – was dieses Modell NICHT selbst ändert, sondern für Sonnet notiert
- Programmfehler (`FEHLER: …`), deren Ursache nicht in einer Zeile offensichtlich ist.
- Alles, was Rechnung, Trainings-/Ernährungslogik, Speicher, Sync, Worker oder Mitteilungen betrifft.
- Wenn eine Funktion anders arbeitet, als es in `CLAUDE.md` steht.
- Wenn eine CSS-Korrektur nach 2 Versuchen den Fund nicht beseitigt.
Diese Punkte kommen in die Schlussmeldung unter „Für Sonnet“ – mit Seite, Knopf, Fundtext und vermuteter Datei.
