# Satzwerk Training

Trainings-App für Zuhause (Klimmzugstange, Ringe, Kurzhantel, Seilzug) und Studio.

- **Fragebogen** mit 26 Fragen: Ziele, Ausrüstung, Level-Tests, Beschwerden und Erholung
- **Automatischer Plan** (Ganzkörper, OK/UK oder PPL) mit Zuhause- und Studio-Version und einer Begründung für jede Übung
- **Satz-für-Satz-Algorithmus** (`engine.js → recommend`): Nach jedem Satz wird aus Gewicht, Wiederholungen und Reserve (RIR) ein geschätztes Maximum berechnet (Epley). Daraus kommen das nächste Gewicht (nur Gewichte, die du wirklich hast), die Wiederholungen und die Satzanzahl (Abbruch bei mehr als 15 % Leistungsabfall, Zusatzsatz bei viel Reserve, Tagesform)
- **5-Wochen-Zyklus** mit steigender Intensität und Deload
- **Übungsbibliothek** mit rund 140 Übungen, animierten Übungsbildern (`figures.js`), Filtern und Progressionsstufen, dazu eigene Übungen
- **Wie große Trainings-Apps:** Vorher-Werte pro Satz, Scheibenrechner, Muskel-Erholung, 1RM-Tabelle, Notizen pro Übung, Erfolge
- **Fortschritt**: Kraftkurven, Rekorde, Sätze pro Muskelgruppe, Körpergewicht
- **Timer**: Pause, Intervall (Tabata, EMOM), Stoppuhr

## Dateien
- `exercises.js`: Übungsdatenbank
- `engine.js`: Fragebogen, Planerstellung, Empfehlungsalgorithmus, Statistik
- `figures.js`: Übungsbilder (Figuren per inverser Kinematik, als SVG animiert)
- `app.js`: Oberfläche und Speicherung (Claude-Artifact-Datenbank oder localStorage)
- `index.html`: Styles und Einstieg
- `pwa/`: eigenständige, offline-fähige Version (`node pwa/build.js` baut nach `pwa/dist`)

## Als echte App installieren (eigenes Hosting)
1. GitHub Pages: Settings → Pages → „Deploy from a branch“ → Branch `main`, Ordner `/docs`. (Nach Änderungen `node pwa/build.js && cp -r pwa/dist/. docs/` ausführen.)
2. Die Seite auf dem Handy öffnen.
3. iPhone: Safari → Teilen → „Zum Home-Bildschirm“. Android: Chrome → Menü → „App installieren“.

In dieser Version liegen die Daten nur auf dem Gerät. Über Einstellungen → Backup kannst du sie sichern und übertragen.

---

# Toleranzen

Eigenständige Lern- und Rechen-App im iOS-Design (Hell und Dunkel) für Zerspanungsmechaniker, im Ordner `toleranzen/`.

- **Deckblatt** mit den Kacheln „Lernen“ und „Anwenden“
- **Lernen:** Allgemeintoleranzen, Freimaßtoleranzen und ISO-Toleranzen, jeweils mit Praxisbeispiel aus dem CNC-Fräsen, Fachbegriffen, Merksatz, Eselsbrücken und 24 Aufgabentypen mit immer neuen Zahlen. Du rechnest selbst, die App prüft jeden Schritt, zeigt den Fehler an der richtigen Stelle (auch Folgefehler, Vorzeichen, Einheit, falsche Tabellenzeile) und zeigt den Lösungsweg nur auf Knopfdruck.
- **Anwenden:** Winkeltoleranz, Form und Lage (ISO 2768-2), Einzeltoleranz nach ISO 286 (1 bis 500 mm, IT01 bis IT18, d, e, f, g, h, js, k, m, n, p, r, s und D, E, F, G, H, JS, K, M, N, P, R, S), Passungen mit Einheitsbohrung/Einheitswelle, Allgemeintoleranzen alt (ISO 2768) und neu (ISO 22081), Maßketten (Worst Case). Überall mit aufklappbarem Rechenweg.
- Alle Tabellenwerte sind fest in `tables.js` hinterlegt, die App funktioniert offline.

## Dateien
- `tables.js`: Normtabellen (ISO 286-1, ISO 2768-1, ISO 2768-2)
- `calc.js`: Rechenkern mit Rechenwegen in ganzen Sätzen
- `lernen.js`: Lerninhalte und Aufgaben mit Schrittprüfung
- `app.js`, `style.css`, `index.html`: Oberfläche
- `test.js`: Prüft den Rechenkern gegen Tabellenbuchwerte und jede Aufgabe gegen ihre Musterlösung (`node toleranzen/test.js`)

## Auf dem iPhone nutzen
Nach Änderungen `toleranzen/` nach `docs/toleranzen/` kopieren (ohne `test.js`). Mit GitHub Pages (Branch `main`, Ordner `/docs`) liegt die App dann unter `…/toleranzen/`. In Safari öffnen, Teilen, „Zum Home-Bildschirm“.
