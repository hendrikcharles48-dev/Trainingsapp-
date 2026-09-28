# Satzwerk Training

Trainings-App für Zuhause (Klimmzugstange, Ringe, Kurzhantel, Seilzug) und Studio.

- **Fragebogen** mit 26 Fragen: Ziele, Ausrüstung, Level-Tests, Beschwerden und Erholung
- **Automatischer Plan** (Ganzkörper, OK/UK oder PPL) mit Zuhause- und Studio-Version und einer Begründung für jede Übung
- **Satz-für-Satz-Algorithmus** (`engine.js → recommend`): Nach jedem Satz wird aus Gewicht, Wiederholungen und Reserve (RIR) ein geschätztes Maximum berechnet (Epley). Daraus kommen das nächste Gewicht (nur Gewichte, die du wirklich hast), die Wiederholungen und die Satzanzahl (Abbruch bei mehr als 15 % Leistungsabfall, Zusatzsatz bei viel Reserve, Tagesform)
- **5-Wochen-Zyklus** mit steigender Intensität und Deload
- **Übungsbibliothek** mit rund 140 Übungen und Progressionsstufen, dazu eigene Übungen
- **Fortschritt**: Kraftkurven, Rekorde, Sätze pro Muskelgruppe, Körpergewicht
- **Timer**: Pause, Intervall (Tabata, EMOM), Stoppuhr

## Dateien
- `exercises.js`: Übungsdatenbank
- `engine.js`: Fragebogen, Planerstellung, Empfehlungsalgorithmus, Statistik
- `app.js`: Oberfläche und Speicherung (Claude-Artifact-Datenbank oder localStorage)
- `index.html`: Styles und Einstieg
- `pwa/`: eigenständige, offline-fähige Version (`node pwa/build.js` baut nach `pwa/dist`)

## Als echte App installieren (eigenes Hosting)
1. GitHub Pages: Settings → Pages → „Deploy from a branch“ → Branch `main`, Ordner `/docs`. (Nach Änderungen `node pwa/build.js && cp -r pwa/dist/. docs/` ausführen.)
2. Die Seite auf dem Handy öffnen.
3. iPhone: Safari → Teilen → „Zum Home-Bildschirm“. Android: Chrome → Menü → „App installieren“.

In dieser Version liegen die Daten nur auf dem Gerät. Über Einstellungen → Backup kannst du sie sichern und übertragen.
