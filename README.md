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

Eigenständige Werkstatt-App im iOS-Design (Hell und Dunkel) für Zerspanungsmechaniker, im Ordner `toleranzen/`. Aufbau wie ein Tabellenbuch: Startseite mit Schnellsuche (z. B. M3, 6H7, 25H7/g6, G1/2, SW13, N7) und einer Liste der Bereiche.

- **Toleranzen:** Einzeltoleranz nach ISO 286 (1 bis 500 mm, IT01 bis IT18, alle Grundabmaße a bis zc und A bis ZC), Passungen, Maßketten (Worst Case), Foto einer Zeichnung mit Maßerkennung
- **Allgemeintoleranzen:** ISO 2768-1 (alt) und ISO 22081 (neu), Winkel
- **Form-/Lagetoleranzen:** Rechner nach ISO 2768-2 und alle Symbole nach ISO 1101
- **Gewinde:** M, MF, G, UNC, UNF, Tr mit Flanken- und Kerndurchmessern, Spannungsquerschnitt, Kernlochbohrer
- **Schnittdaten:** Drehzahl, Vorschubgeschwindigkeit, Zeitspanvolumen für Fräsen, Bohren, Drehen und Richtwerte
- **Schlüsselweite:** Sechskant ISO und DIN, Innensechskant, Durchgangslöcher ISO 273, Senkungen DIN 974-1
- **Drehmoment:** Anziehdrehmomente 8.8, 10.9, 12.9 nach VDI 2230
- **Dreieck:** rechtwinklig, beliebig, Kegel, Lochkreis – Maße direkt in der Skizze antippen
- **Gewicht, Rauheit, Trowalisieren (Gleitschleifen), Info**

Startliste und Reiter lassen sich durch Gedrückthalten umsortieren. Schnittdaten und Gewinde zeigen fertige NC-Zeilen (S, F).

Überall mit aufklappbarem Rechenweg. Alle Werte sind fest hinterlegt, die App funktioniert offline.

**Foto:** Zeichnung fotografieren, zuschneiden (die App schlägt die Blattecken vor und entzerrt schräge Fotos), dann erkennt die App Maße, Toleranzangaben und die Allgemeintoleranz im Schriftfeld (Texterkennung tesseract.js direkt auf dem Gerät). Mit „Stelle genauer ansehen“ rahmt man ein fehlendes Maß ein, die App liest diese Stelle mehrfach vergrößert.

## Dateien
- `tables.js`: Normtabellen (ISO 286-1, ISO 2768-1, ISO 2768-2)
- `calc.js`: Rechenkern Toleranzen mit Rechenwegen in ganzen Sätzen
- `werkstatt.js`: Gewinde, Schrauben, Drehmomente, Schnittdaten, Gewicht, Dreieck, Rauheit, Gleitschleifen, Schnellsuche
- `app.js`, `style.css`, `index.html`: Oberfläche
- `test.js`, `test-werkstatt.js`: Prüfen alles gegen Normwerte (`node toleranzen/test.js`)

## Auf dem iPhone nutzen
Nach Änderungen `toleranzen/` nach `docs/toleranzen/` kopieren (ohne `test.js` und `test-werkstatt.js`). Die Texterkennung (`ocr/`, etwa 11 MB) liegt nur in `docs/toleranzen/ocr/`; zum lokalen Testen des Foto-Reiters `docs/toleranzen` ausliefern. Mit GitHub Pages (Branch `main`, Ordner `/docs`) liegt die App dann unter `…/toleranzen/`. In Safari öffnen, Teilen, „Zum Home-Bildschirm“.

---

# Stundenzettel

Eigenständige App im iOS-Design (dunkel als Standard) für einen Minijob, im Ordner `stunden/`.

- **Monat:** Ring bis zur Monatsgrenze, Grundlohn und Spätzulage getrennt, was noch frei ist, alle Schichten (antippen zum Bearbeiten oder Löschen). Startet jeden Monat bei 0, mit ‹ › zu alten Monaten.
- **Schicht eintragen** (Plus-Knopf): Beginn und Ende, Ab mehr als 6 Std muss man angeben, wann die Pause liegt (Vorschlag: direkt vor 20 Uhr, `suggestPause`), Länge mindestens 30 bzw. 45 Min; eine Pause nach 20 Uhr senkt die Spätzulage. Gespeichert als `pause` + `pauseVon`. Alternativ nur Dauer.
- **Planer – Kalender:** Arbeitstage antippen, die App verteilt den Rest bis zur Grenze in Viertelstunden auf diese Tage, möglichst bis 6 Std (ohne Pause), „Volle Tage“ oder „Gleichmäßig“; reicht das nicht, Vorschlag mit Pause. Tag antippen: feste Zeit, Höchstdauer (z. B. höchstens 4 Std), Beginn oder als Schicht eintragen. KW antippen: Tage der Woche wählen oder ganze Woche frei. „Meine normale Woche“ als Vorlage für alle offenen Wochen. Eigenes Monatsziel unter der Grenze (`S.ziel`).
- **Planer – Wochenmuster:** Schichtmuster pro Woche oder Monat, prüft gegen die Grenze (4,35 Wochen pro Monat) und rechnet aus, bis wann man an Zusatztagen arbeiten kann.
- **Übersicht:** Monate, Jahr gegen 12 × Grenze, Einstellungen (Lohn 18,39 €, Grenze 603 €, 25 % ab 20 Uhr, Zulage zählt zur Grenze), Hell/Dunkel, Backup.
- **Nicht gestempelt** (Übersicht → zweiter Reiter): extra notierte Stunden in `st.offen` mit `status` offen/gemeldet, zählen nirgends mit; „zu den Schichten“ verschiebt nach `st.entries`.
- Daten liegen nur auf dem Gerät (`localStorage`, Schlüssel `stundenzettel-v2`).

## Auf dem iPhone nutzen
Nach Änderungen `stunden/` nach `docs/stunden/` kopieren und `CACHE` in `stunden/sw.js` hochzählen. Mit GitHub Pages liegt die App unter `…/stunden/`. In Safari öffnen, Teilen, „Zum Home-Bildschirm“.
