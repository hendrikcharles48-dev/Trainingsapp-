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

- **Toleranzen:** ISO 286 (alle Grundabmaße a bis zc), Passung, Allgemeintoleranzen (ISO 2768, ISO 22081), Winkel, Form und Lage mit allen Symbolen, Maßkette, Foto einer Zeichnung mit Maßerkennung
- **Zerspanung:** Schnittdaten-Helfer mit 44 gängigen Werkstoffen (P, M, K, N, S, H) und 23 Werkzeugarten (Schaftfräser, Messerkopf, Fasen-, Kugel-, Gewindefräser, Bohrer, Anbohrer, Senker, Reibahle, Gewindebohrer und -former, Drehplatten). Empfehlungen klein über jedem Feld, fehlende Werte werden vorgeschlagen, Maschinengrenzen (Drehzahl, Vorschub, Spindelleistung) und eigene Werkzeuge speicherbar. Berücksichtigt Auskraglänge, Schneidenlänge, Aufnahme, Kühlung, Bohrtiefe und wirksamen Ø beim Kugelfräser; rechnet Schnittleistung, Drehmoment, Schnittkraft, Durchbiegung und Bearbeitungszeit (`zerspanung.js`). Fräsen, Bohren, Drehen als Löser: eingeben, was man weiß (z. B. Messerkopf Ø80, 10 Platten, Eckenradius 0,4, Drehzahl, gewünschtes Rz), der Rest wird gerechnet, mit NC-Zeilen (S, F). Dazu Richtwerte, Rauheit und Gleitschleifen
- **Gewinde und Schrauben:** M, MF, G, UNC, UNF, Tr mit Kernloch, Schlüsselweiten, Durchgangslöcher, Senkungen, Anziehdrehmomente
- **Geometrie:** Dreieck (rechtwinklig, beliebig), Kegel, Lochkreis – Maße direkt in der Skizze antippen –, Gewicht

Startliste und Reiter lassen sich durch Gedrückthalten umsortieren. Überall mit aufklappbarem Rechenweg. Alle Werte sind fest hinterlegt, die App funktioniert offline.

**Foto:** Zeichnung fotografieren, zuschneiden (die App schlägt die Blattecken vor und entzerrt schräge Fotos), dann erkennt die App Maße, Toleranzangaben und die Allgemeintoleranz im Schriftfeld (Texterkennung tesseract.js direkt auf dem Gerät). Mit „Stelle genauer ansehen“ rahmt man ein fehlendes Maß ein, die App liest diese Stelle mehrfach vergrößert.

## Dateien
- `tables.js`: Normtabellen (ISO 286-1, ISO 2768-1, ISO 2768-2)
- `calc.js`: Rechenkern Toleranzen mit Rechenwegen in ganzen Sätzen
- `zerspanung.js`: Werkstoffe, Werkzeuge, empfohlene Schnittdaten
- `werkstatt.js`: Gewinde, Schrauben, Drehmomente, Schnittdaten, Gewicht, Dreieck, Rauheit, Gleitschleifen, Schnellsuche
- `app.js`, `style.css`, `index.html`: Oberfläche
- `test.js`, `test-werkstatt.js`: Prüfen alles gegen Normwerte (`node toleranzen/test.js`)

## Auf dem iPhone nutzen
Nach Änderungen `toleranzen/` nach `docs/toleranzen/` kopieren (ohne `test.js` und `test-werkstatt.js`). Die Texterkennung (`ocr/`, etwa 11 MB) liegt nur in `docs/toleranzen/ocr/`; zum lokalen Testen des Foto-Reiters `docs/toleranzen` ausliefern. Mit GitHub Pages (Branch `main`, Ordner `/docs`) liegt die App dann unter `…/toleranzen/`. In Safari öffnen, Teilen, „Zum Home-Bildschirm“.

---

# Stundenzettel

Eigenständige App im iOS-Design (dunkel als Standard) für einen Minijob, im Ordner `stunden/`.

- **Monat:** Ring bis zur Monatsgrenze, Grundlohn und Spätzulage getrennt, was noch frei ist, alle Schichten (antippen zum Bearbeiten oder Löschen). Startet jeden Monat bei 0, mit ‹ › zu alten Monaten.
- **Schicht eintragen** (Plus-Knopf): Beginn und Ende, Ab mehr als 6 Std muss man angeben, wann die Pause liegt (Beginn + Dauer oder von–bis) (Vorschlag: direkt vor 20 Uhr, `suggestPause`), Länge mindestens 30 bzw. 45 Min; eine Pause nach 20 Uhr senkt die Spätzulage. Gespeichert als `pause` + `pauseVon`. Alternativ nur Dauer.
- **Planer – Kalender:** Arbeitstage antippen, die App verteilt den Rest bis zur Grenze in Viertelstunden auf diese Tage, möglichst bis 6 Std (ohne Pause), „Volle Tage“ oder „Gleichmäßig“; reicht das nicht, Vorschlag mit Pause. Tag antippen: feste Zeit, Höchstdauer (z. B. höchstens 4 Std), Beginn oder als Schicht eintragen. KW antippen: Tage der Woche wählen oder ganze Woche frei. „Meine normale Woche“ als Vorlage für alle offenen Wochen. Eigenes Monatsziel unter der Grenze (`S.ziel`).
- **Planer – Wochenmuster:** Schichtmuster pro Woche oder Monat, prüft gegen die Grenze (4,35 Wochen pro Monat) und rechnet aus, bis wann man an Zusatztagen arbeiten kann.
- **Übersicht:** Monate, Jahr gegen 12 × Grenze, Einstellungen (Lohn 18,39 €, Grenze 603 €, 25 % ab 20 Uhr, Zulage zählt zur Grenze), Hell/Dunkel, Backup.
- **Extra** (vierter Reiter): Konto für nicht gestempelte Stunden, nur Tag + Dauer; `st.offen` mit `typ` plus (aufgeschrieben) oder minus (genommen), Eingabe als Dauer oder gekommen–gegangen (`von`/`bis`), oben der Stand insgesamt. Zählt nirgends mit.
- Daten liegen nur auf dem Gerät (`localStorage`, Schlüssel `stundenzettel-v2`, `navigator.storage.persist()`). Nach jedem Eintrag erscheint „Backup sichern“ (`nudge`), Datei `stundenzettel-backup.json` über das Teilen-Menü; `st.lastBackup` steht in der Übersicht.

## Auf dem iPhone nutzen
Nach Änderungen `stunden/` nach `docs/stunden/` kopieren und `CACHE` in `stunden/sw.js` hochzählen. Mit GitHub Pages liegt die App unter `…/stunden/`. In Safari öffnen, Teilen, „Zum Home-Bildschirm“.

---

# Kochwerk

Eigenständige App im iOS-Design (hell und dunkel nach Systemeinstellung) zum Abnehmen ohne Tracking, im Ordner `kochwerk/`. Prinzip: einmal beim Rezept rechnen statt täglich tracken. Wird in Etappen gebaut.

- **Etappe 1 (fertig):** Einrichtung (Größe, Gewicht, Alter, Aktivität, Abnehmtempo, Protein 180 g, normale Mahlzeit, Kochtag, Portion Freundin), Kalorienziel, Rezept-Import als Text-Block aus dem Chat (Format in `kochwerk/IMPORT-FORMAT.md`, Skill „kochwerk-rezept“), Rezeptbuch mit Suche, Filtern, Bearbeiten (Formular oder als Text), von Hand anlegen, löschen, teilen, Bewertung „satt?“ und „lecker?“ mit „Zum Aussortieren“.
- **Etappe 2 (fertig):** Tagesplan mit Frühstück, Box, Mittag, Abend (pro Tag anwählbar) und eingefügten Snacks. „Heute“ zeigt den Spielraum groß als normale Mahlzeiten, klein als kcal und offenes Protein. Alles Geplante zählt als gegessen, die Portion der Freundin nicht. Woche (Mo–So): Wochen-Check mit Gewicht als Schritt 1, Mahlzeiten-Chips pro Tag, „Vorschlagen“, Tauschen, Lieblingswochen, „Freundin isst mit“. Bewertungsfrage beim Öffnen nach dem letzten geplanten Gericht. Stillstand-Hinweis nach 2 Wochen ohne Abnahme mit „leichter machen“ (Kohlenhydrat-Zutaten −25 %) oder „Mahlzeit mehr“, nur mit OK.
- **Vorschlagsregel (`suggestWeek` in `plan.js`):** Punkte = Protein pro 100 kcal + Protein pro Portion / 10, gut bewertet +2, schlecht bewertet ausgeschlossen. Ein Rezept füllt der Reihe nach so viele Mahlzeiten, wie es Portionen hat (mit Freundin zusätzlich ihr Anteil), erst dann kommt ein neues. Box nur boxtaugliche Rezepte, nicht einfrierbare nur bis zur Haltbarkeit nach dem Kochtag, möglichst nicht zweimal dasselbe am Tag. Was nicht passt, bleibt leer, und die App sagt warum.
- **Kalorienziel:** Grundumsatz nach Mifflin-St Jeor × Aktivität (1,2–1,725). Defizit aus dem Tempo (langsam 0,25 %, moderat 0,5 %, zügig 0,75 % des Körpergewichts pro Woche, 1 kg ≈ 7700 kcal), höchstens 25 % des Verbrauchs, Ziel nie unter dem Grundumsatz (`calcTargets` in `core.js`).
- Daten nur in `localStorage` unter `kochwerk_data` (Gerätekennung `kochwerk_device`, Darstellung `kochwerk_ui`). Jeder Eintrag hat `id` und `t` (letzte Änderung), Gelöschtes bleibt als `{id, del:true, t}` stehen, damit der spätere Abgleich mit dem iPad Eintrag für Eintrag zusammenführen kann (`merge` in `core.js`). Keine Fotos.

## Dateien
- `core.js`: Datenmodell, Import-Parser, Nährwerte, Kalorienziel, Zusammenführen (läuft auch in Node)
- `plan.js`: Tagesplan, Spielraum, Wochenvorschlag, Tauschen, Lieblingswoche, Wochen-Check (`KW.P`)
- `app.js`, `style.css`, `index.html`: Oberfläche
- `IMPORT-FORMAT.md`: Import-Format, `beispiel-rezept.txt`: Beispielrezepte
- `test.js`: `node kochwerk/test.js`

## Auf dem iPhone nutzen
Nach Änderungen `kochwerk/` nach `docs/kochwerk/` kopieren (ohne `test.js` und `IMPORT-FORMAT.md`) und `CACHE` in `kochwerk/sw.js` hochzählen. Mit GitHub Pages liegt die App unter `…/kochwerk/`. In Safari öffnen, Teilen, „Zum Home-Bildschirm“.
