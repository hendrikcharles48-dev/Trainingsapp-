# Satzwerk – Roadmap (Bauplan)

Stand der Analyse: 10.11.2026, App-Stand `CACHE = 'satzwerk-v23'`.
Dieser Plan ist so geschrieben, dass ein Modell jede Etappe **ohne Rückfragen** umsetzen kann.
Reihenfolge einhalten: Fehler → Datensicherheit → eigene Pläne → Trainingswissenschaft → Komfort.

Abhaken: Wenn eine Etappe fertig ist, in der Übersicht `[ ]` zu `[x]` machen und Datum + Version dazuschreiben.

## Übersicht

- [ ] **Etappe 1** – Suche ruhig, Versionsanzeige (klein, Datenrisiko: keins)
- [ ] **Etappe 2** – Training flüssig, aktuelle Übung immer sichtbar, übersteht Sperren/App-Wechsel (mittel, Risiko: gering)
- [ ] **Etappe 3** – Datensicherheit (mittel, Risiko: mittel – nur zusätzliche Kopien, nichts wird umgezogen)
- [ ] **Etappe 4** – Eigene Pläne (groß, Risiko: mittel – `plans` kommt dazu, `plan` bleibt als Spiegel)
- [ ] **Etappe 5** – Trainingswissenschaft (mittel, Risiko: gering – nur Rechenregeln)
- [ ] **Etappe 6** – Eigene Vorschläge und Komfort V1–V8 (mittel, Risiko: gering) – jeder Vorschlag einzeln abwählbar

## Regeln für jede Etappe

1. **Bestehende Daten nie verlieren.** Keine Etappe löscht oder benennt gespeicherte Felder um. Neue Felder kommen
   dazu, alte bleiben lesbar. Vor jeder Umstellung gespeicherter Daten eine Sicherung anlegen (ab Etappe 3: `Backup.snapshot`).
2. Nur Satzwerk anfassen: `index.html`, `app.js`, `engine.js`, `exercises.js`, `howto.js`, `figures.js`, `pwa/*`, und die
   gebauten Kopien direkt in `docs/` (nicht `docs/kochwerk`, `docs/stunden`, `docs/toleranzen`).
3. Nur Speicher mit Präfix `satzwerk.` (localStorage) bzw. Datenbank `satzwerk` (IndexedDB). Nie `localStorage.clear()`.
4. Die Artifact-Variante (`Store.mode === 'db'`, `window.claude`) muss weiter funktionieren – Speicherlogik immer über `Store`.
5. Gespeicherte Sätze haben kein `done`-Feld → im Engine `done !== false` prüfen.
6. Keine fremden Dienste, kein Server, keine neuen Bibliotheken. Vanilla JS wie bisher.
7. Abschluss jeder Etappe:
   - `node --check app.js && node --check engine.js`
   - `node pwa/build.js`, dann `cp pwa/dist/* docs/` (nur Dateien, keine Ordner löschen)
   - `CACHE` in `pwa/sw.js` hochzählen, `APP_VERSION` in `app.js` hochzählen (ab Etappe 1)
   - Regel aus `CLAUDE.md` „eigene Übungen prüfen“ beachten
   - committen, Etappe hier abhaken, `CLAUDE.md` anpassen, falls Aufbau oder Datenmodell sich geändert haben
   - Live ist die App erst, wenn der Stand auf `main` liegt (GitHub Pages läuft aus `main:/docs`).
8. Prüfen ohne iPhone: Chromium/Playwright ist in Cloud-Sitzungen vorhanden. Mit iPhone-Größe (390×844) `docs/index.html`
   über einen lokalen Webserver öffnen und die Prüfkriterien durchklicken. Was nur am echten iPhone prüfbar ist, steht je
   Etappe unter „Am iPhone prüfen“ – das dem Nutzer am Ende als kurze Liste nennen.

## Ausgangslage (Bestandsaufnahme)

**Aufbau.** Eine Seite, kein Framework. `app.js` (ca. 1540 sehr lange Zeilen) hält den Zustand in `st` und baut jede Ansicht
als HTML-Text neu (`render()` → `app.innerHTML`). Fenster (`SHEETS`), Training/Fragebogen als Overlay (`st.ov`), Aktionen in
`A` (Klick, `data-a`), Eingaben in `IN` (`data-in`). `engine.js` enthält Planbau, Volumen, Zyklus, Empfehlung pro Satz.

**Was die App kann.** Fragebogen → Plan (Ganzkörper / OK-UK / PPL, 2–6 Tage, Zuhause/Studio), Training mit Empfehlung pro
Satz (Gewicht, Wdh., Reserve), Pausentimer, Supersätze, Bänder, Leichter/Schwerer-Kette, Notizen, eigene Gewichtslisten,
eigene Übungen, Wochen-Check-in, Zyklus mit Deload, Fortschritt (Diagramme, Rekorde, Abzeichen), Timer, Export/Import.

**Gefundene Schwächen (mit Fundstelle).**

| Nr | Problem | Fundstelle |
|---|---|---|
| A1 | Suche baut bei jedem Buchstaben die ganze Seite neu (Suchfeld inklusive) und setzt den Cursor per Trick zurück → Springen | `IN.libQ`, `IN.pickQ`, `IN.plateW` in `app.js` |
| A2 | Übungsliste zeichnet alle Übungen mit Bild auf einmal neu | `libView` |
| A3 | Im Training baut `render()` auch die Startseite hinter dem Overlay neu | `render()`, `commitSet`, viele Aktionen |
| A4 | `exState()` wird pro Neuaufbau für jede Übung 3–4× gerechnet, jedes Mal mit Suche durch den ganzen Verlauf | `curIndex`, `workoutView`, `focusCard`, `renderRest`, `E.historyFor` |
| A5 | Nach Neuladen (iOS wirft die App nach Sperren/App-Wechsel aus dem Speicher) öffnet sich das Training nicht wieder, nur ein Hinweis für 3,5 s | `boot()` am Dateiende |
| A6 | Pausentimer (`st.rest`) und Halte-Timer (`st.hold`) werden nicht gespeichert | `startRest` |
| A7 | Nach einem Satz bleibt die Scrollposition stehen; die aktuelle Übung (oben) ist dann nicht zu sehen. Gescrollt wird nur beim Übungswechsel, zu einer Marke `ex-…` | `renderOverlay` (`keep`), `commitSet` |
| A8 | Service Worker fragt immer zuerst das Netz, ohne Zeitlimit; Google-Schriften blockieren den Seitenaufbau → Hänger bei schlechtem Empfang | `pwa/sw.js`, `index.html` Zeile 3–5 |
| A9 | `LS.set` verschluckt Speicherfehler; `LS.get` liefert bei kaputtem Inhalt `null` → App sähe wie neu aus und würde überschreiben | `LS` |
| A10 | Import ersetzt das Profil sofort, ohne Vorschau und ohne Sicherung; Zurücksetzen ebenso | `importData`, `A.resetYes` |
| A11 | Nur ein Plan (`profile.plan`); Tage nicht anlegbar/umbenennbar/löschbar | `planView` |
| A12 | „Plan neu berechnen“ und das automatische Plan-Update bei neuer `PLAN_VERSION` überschreiben eigene Änderungen | `A.rebuildYes`, `boot()` |
| A13 | Zyklus zählt Kalenderwochen ab Start – auch Wochen ohne Training; Deload kommt dann zur falschen Zeit | `mesoWeek` |
| A14 | Kein Ziel „Fett weg und Muskeln aufbauen“ | `Q` (Frage `goal`), `goalRanges` |
| A15 | Steigerung läuft über verdeckte Prozente; Gewicht kann von Einheit zu Einheit wechseln, statt erst Wdh. dann Gewicht | `recommend` |
| A16 | Pause bei Isolationsübungen 75 s (etwas kurz) | `buildPlan` (`sl.rest`) |
| A17 | Vibration (`navigator.vibrate`) gibt es auf dem iPhone nicht; Ton ist im Stumm-Modus aus → Pausenende leicht zu übersehen | `buzz`, `beep`, `tickRest` |
| A18 | Keine sichtbare Versionsnummer | – |

---

## Etappe 1 – Suche ruhig, Versionsanzeige

**Nutzen:** Suche bleibt beim Tippen stehen. **Aufwand:** klein. **Datenrisiko:** keins (nichts Gespeichertes ändert sich).

### Bauen

1. **Übungen-Reiter** (`libView`): Den Teil unter den Filtern in eine eigene Funktion `libResults()` auslagern
   (Zeile „N Übungen“ + Raster bzw. Leer-Hinweis) und in `<div id="libRes">…</div>` ausgeben.
   `IN.libQ(t)`: nur `st.libQ = t.value` setzen und – mit 120 ms Verzögerung (`clearTimeout`/`setTimeout`) –
   `$('#libRes').innerHTML = libResults()`. **Kein** `render()`, **kein** `focus()`/`setSelectionRange` mehr.
2. **Raster begrenzen:** `libResults()` zeigt höchstens `st.libMax` (Start 40) Kacheln und darunter einen Knopf
   „Mehr anzeigen“ (`A.libMore`: `st.libMax += 60`, nur `#libRes` neu). Bei geänderter Suche/Filter `st.libMax = 40`.
3. **Übung wählen** (`SHEETS.pick`): Trefferliste in `pickResults(s)` auslagern, Ausgabe in `<div class="list" id="pickRes">`.
   `IN.pickQ(t)`: `st.sheet.q = t.value`, dann nur `#pickRes` neu (120 ms verzögert). Das Fenster bekommt eine feste
   Mindesthöhe (`min-height: 70dvh` für dieses Fenster), damit es beim Tippen nicht schrumpft und hüpft.
4. **Scheibenrechner** (`IN.plateW`): gleiche Art – nur den Ergebnisteil neu, Eingabefeld stehen lassen.
5. **Kein Zoom beim Tippen:** In `index.html` prüfen, dass alle `input`, `select`, `textarea` mindestens `font-size:16px`
   haben (iOS zoomt sonst hinein und die Ansicht springt). Fehlende ergänzen.
6. **Version:** in `app.js` oben `const APP_VERSION = '3.0.0';`. Anzeige unten im Fenster „Einstellungen“
   („Satzwerk 3.0.0“). Ab jetzt je Etappe erhöhen (3.1.0, 3.2.0 …; Fehlerkorrekturen dritte Stelle).

### Prüfkriterien

- In „Übungen“ und in „Übung wählen“ ein Wort tippen: Tastatur bleibt offen, Cursor bleibt, Feld bewegt sich nicht,
  nur die Treffer wechseln. Löschen bis leer zeigt wieder alles.
- Filter-Chips und Reiter (Alle/Favoriten/Meine) funktionieren weiter.
- **Am iPhone prüfen:** schnelles Tippen mit einer Hand, deutsche Umlaute, Diktat.

---

## Etappe 2 – Training flüssig und immer sichtbar

**Nutzen:** kein Stocken, aktuelle Übung immer zu sehen, nichts weg nach Sperren. **Aufwand:** mittel.
**Datenrisiko:** gering (nur neue Felder im laufenden Training `active`).

### Bauen

1. **Nur neu bauen, was sichtbar ist.** `render()`: Wenn `st.ov` gesetzt ist, `#app` nicht neu aufbauen – nur
   `renderLayer()`. Merker `st.appDirty = true` setzen; beim Schließen des Overlays (`A.wMin`, `finishWorkout`, Quiz-Ende,
   `A.tab`) einmal `#app` neu bauen. Prüfen, dass alle Stellen, die das Overlay schließen, danach `render()` rufen.
2. **Verlauf vorsortieren.** In `app.js` einen Index `histIdx` (Map `exId → Liste`) einführen, gefüllt über
   `E.historyFor` beim ersten Zugriff; leeren, sobald sich `st.workouts` ändert (eine Hilfsfunktion `workoutsChanged()`,
   aufgerufen in `finishWorkout`, `importData`, `upgradeCustom`, Löschen eines Trainings, `resetYes`).
   Alle Aufrufe `E.historyFor(id, st.workouts)` in `app.js` auf `histOf(id)` umstellen.
3. **`exState` zwischenspeichern.** Zwischenspeicher `exCache` (Map `entry.key → {sig, S}`).
   `sig` = `exId|sets.length|letzter Satz t|band|extra|closed|ignoreStop|st.workouts.length|Wochen-Nr.`.
   Bei gleichem `sig` das gespeicherte Ergebnis zurückgeben. Bei `finishWorkout` leeren.
   (Entwurfswerte `draft` gehen nicht in `exState` ein – bleibt so.)
4. **Training öffnet sich von selbst wieder.** In `boot()`: wenn `st.active` vorhanden →
   - Start jünger als 12 Stunden: `openWorkout()` direkt (statt Hinweis-Toast).
   - Älter: Fenster `staleWorkout` mit drei Knöpfen „Weiter trainieren“, „Speichern und beenden“
     (`finishWorkout(true)` – Dauer dann aus letztem Satz-Zeitpunkt `t` statt jetzt berechnen), „Verwerfen“ (mit Rückfrage).
5. **Pause und Halten speichern.** `startRest`, `A.restAdj`, `A.restSkip`, Ablauf in `tickRest`: jeweils
   `st.active.rest = st.rest ? {end,total,len,label} : null` und `Store.saveActive()`. Ebenso `st.active.hold = st.hold`.
   `boot()` und `openWorkout()` stellen `st.rest`/`st.hold` daraus wieder her (Pause nur, wenn `end > jetzt − 4 s`).
6. **Rückkehr in die App.** `visibilitychange`:
   - `hidden` → `Store.saveActive(true)` (auch bei `pagehide`).
   - `visible` → sofort `timerTick()`; wenn eine Pause in der Abwesenheit abgelaufen ist: Panel zeigt
     „Pause seit m:ss vorbei“ (Zeit seit `rest.end`), kein nachträglicher Piepton.
7. **Aktuelle Übung immer oben.** Hilfsfunktion `toFocus()`: `const o = $('#ov'); if (o) o.scrollTop = 0;`.
   Aufrufen nach `commitSet` (beide Zweige), `A.focusEx`, `A.restSkip`, Übungstausch, `openWorkout`.
   Die alten `scrollIntoView`-Aufrufe auf `ex-…` in `commitSet` entfernen (die Fokus-Karte steht immer oben).
   `renderOverlay` behält die Scrollposition nur noch, wenn sich die Fokus-Übung nicht geändert hat.
8. **Übungsname im unteren Panel.** `renderRest`: über den drei Spalten eine Zeile mit dem Namen der aktuellen Übung
   (eine Zeile, abgeschnitten mit `…`), antippbar → `toFocus()`. So ist die Übung auch sichtbar, wenn man in der Liste
   nach unten gescrollt hat.
9. **Doppeltipp-Schutz.** `commitSet` ignoriert einen zweiten Aufruf innerhalb von 400 ms (`st.lastCommit`).
10. **Start ohne Warten aufs Netz** (`pwa/sw.js`): für eigene Dateien „Cache zuerst, im Hintergrund auffrischen“:
    ```js
    e.respondWith(caches.match(e.request).then(hit => {
      const net = fetch(e.request).then(res => { if (res.ok || res.type === 'opaque') { const c = res.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); } return res; });
      return hit || net.catch(() => caches.match('./index.html'));
    }));
    ```
    Damit neue Versionen trotzdem ankommen: `install` lädt alle `FILES` mit `cache: 'reload'` in den neuen `CACHE`,
    `skipWaiting` + `clients.claim` bleiben. In `pwa/build.js` (Anhang `tail`): auf `controllerchange` hören und
    – **nur wenn kein Training läuft** (`localStorage['satzwerk.active']` leer/`null`) – einmal `location.reload()`;
    sonst nichts tun (die neue Version greift beim nächsten Start).
11. **Schriften blockieren nicht mehr.** `index.html` Zeile 5: Stylesheet nicht-blockierend laden
    (`<link rel="stylesheet" media="print" onload="this.media='all'" …>`), in den CSS-Schriftfamilien eine Systemschrift
    als Ersatz dahinter (`-apple-system, system-ui, sans-serif`). Schriftdateien laufen über den Service Worker
    („Cache zuerst“ gilt auch für `fonts.g…`).
12. **Animation sparen.** Die animierte Figur in der Fokus-Karte (`figSVG(ex, { anim: 2.6 })`) nur bei Übungswechsel neu
    erzeugen: Bei gleichem `entry.key` und gleicher Satzzahl das vorhandene `.stage`-Element behalten ist aufwendig –
    einfacher Weg: `prefers-reduced-motion` beachten und die Animation pausieren, solange ein Fenster (`st.sheet`) offen ist
    (CSS-Klasse am `#ov`). Kein Muss, wenn Punkt 1–3 reichen (mit Chromium-Messung prüfen: Neuaufbau nach Satz < 50 ms
    bei 150 gespeicherten Trainings; dafür Testdaten im Skript erzeugen, nicht im Repo ablegen).

### Prüfkriterien

- Satz abhaken → Ansicht steht oben bei der Übung, Pause läuft. Seite neu laden → Training ist sofort wieder offen,
  Pausentimer läuft mit richtiger Restzeit weiter.
- Flugmodus an, App schließen und öffnen → startet sofort.
- Mit 150 Test-Trainings: Abhaken ohne spürbare Verzögerung.
- **Am iPhone prüfen:** im Training sperren (1 min), entsperren; zu einer anderen App wechseln und zurück;
  App im Umschalter wegwischen und neu öffnen – jedes Mal ist die aktuelle Übung zu sehen und kein Satz fehlt.

---

## Etappe 3 – Datensicherheit

**Nutzen:** kein stiller Datenverlust, Rückweg bei Fehlern. **Aufwand:** mittel.
**Datenrisiko:** mittel – aber es werden nur **zusätzliche** Kopien angelegt; die bisherigen Schlüssel
`satzwerk.profile`, `satzwerk.workouts`, `satzwerk.active` bleiben unverändert die Wahrheit.

### Bauen

1. **Speicherfehler sichtbar.** `LS.set` gibt `true/false` zurück. Bei `false`: `st.saveErr = true` und dauerhaftes
   rotes Band oben („Speichern fehlgeschlagen – bitte jetzt Backup exportieren“, Knopf „Backup“). Verschwindet nach
   dem nächsten erfolgreichen Speichern.
2. **Kaputten Inhalt nicht überschreiben.** `LS.get`: Bei JSON-Fehler den Rohtext nach `satzwerk.corrupt.<key>`
   kopieren, `st.corrupt = true`. Dann beim Start **nicht** den Willkommens-Bildschirm zeigen, sondern das Fenster
   „Daten wiederherstellen“ (siehe Punkt 4).
3. **Sicherungen in IndexedDB.** Neues Objekt `Backup` in `app.js`:
   - Datenbank `satzwerk`, Speicher `snap` (Schlüssel `id` = Zeitstempel).
   - `Backup.snapshot(grund)` speichert `{id, ts, grund, version: APP_VERSION, profile, workouts, active}`.
     Höchstens 8 behalten (älteste löschen), aber immer mindestens eine pro `grund`-Art „vor…“.
   - Aufrufen: nach jedem gespeicherten Training (`grund: 'training'`), **vor** Import, Zurücksetzen,
     „Plan neu berechnen“, automatischem Plan-Update in `boot()`, und vor jeder späteren Datenumstellung (`'vor-…'`).
   - Alles in `try/catch`; wenn IndexedDB fehlt, läuft die App normal weiter.
4. **Fenster „Sicherungen“** (Einstellungen → „Sicherungen“): Liste (Datum, Grund, Anzahl Trainings),
   je Eintrag „Wiederherstellen“ (mit Rückfrage; legt vorher selbst eine Sicherung an) und „Als Datei speichern“.
   Beim Start: wenn `profile` leer/kaputt ist und es Sicherungen gibt → dieses Fenster automatisch anbieten.
5. **Dauerhafter Speicher.** Einmal nach dem ersten gespeicherten Training `navigator.storage.persist()` anfragen
   (falls vorhanden). In „Sicherungen“ Belegung anzeigen (`navigator.storage.estimate()`), Hinweis:
   „Der Speicher wird mit den anderen Apps auf dieser Adresse (z. B. Lernwerk, Kochwerk) geteilt.“
6. **Export besser.** Reihenfolge: `window.claude…downloads` (wie bisher) → `navigator.share({files:[File]})`
   (iPhone: Teilen-Menü → „In Dateien sichern“) → Download-Link → Zwischenablage. Format `version: 2`, zusätzlich
   `appVersion` und `active`. Nach Erfolg `profile.lastExport = heute` speichern.
7. **Backup-Erinnerung.** Startseite: kleine Karte, wenn seit `lastExport` mehr als 14 Tage **und** mindestens
   3 neue Trainings: „Backup sichern“ / „Später“ (`st`-Merker, nur für diese Sitzung).
8. **Import mit Vorschau.** `importData` liest die Datei, prüft (`app === 'satzwerk'`, `profile` Objekt, `workouts` Liste,
   jedes Training mit `id` und `exercises`), öffnet dann Fenster `importPreview`:
   „Datei vom …, N Trainings (davon M neu), Plan: …“ mit zwei Wegen:
   - **Zusammenführen** (Standard): nur fehlende Trainings ergänzen; Profil bleibt, außer es gibt noch keins.
   - **Alles ersetzen**: Profil und Trainings aus der Datei (Rückfrage; `Backup.snapshot('vor-import')` vorher).
   Version 1 und 2 beide annehmen.
9. **Zurücksetzen** (`A.resetYes`): vorher `Backup.snapshot('vor-reset')`; Text der Rückfrage ergänzt:
   „Eine Sicherung bleibt unter Einstellungen → Sicherungen.“
10. **Merker für spätere Umstellungen:** `satzwerk.meta = { schema: 1 }` anlegen (Etappe 4 setzt 2).

### Prüfkriterien

- Training speichern → in „Sicherungen“ steht ein neuer Eintrag. Wiederherstellen eines älteren Stands funktioniert.
- `satzwerk.profile` im Browser von Hand auf `{kaputt` setzen → App bietet Wiederherstellung an, überschreibt nichts.
- Import einer alten Backup-Datei (Version 1) zeigt Vorschau; „Zusammenführen“ verdoppelt nichts.
- Schlüssel anderer Apps (`kochwerk_…` usw.) bleiben unberührt (vorher/nachher vergleichen).
- **Am iPhone prüfen:** Export landet über das Teilen-Menü in „Dateien“; Import derselben Datei klappt.

---

## Etappe 4 – Eigene Pläne

**Nutzen:** beliebig viele eigene Pläne, die App arbeitet damit wie mit dem empfohlenen. **Aufwand:** groß.
**Datenrisiko:** mittel. Schutz: `profile.plan` bleibt bestehen (als Spiegel des aktiven Plans), sodass auch eine ältere
App-Version oder ein altes Backup weiter funktionieren. Vor der Umstellung `Backup.snapshot('vor-plaene')`.

### Datenmodell

```
profile.plans   = [plan, …]        // alle Pläne
profile.planId  = 'p…'             // aktiver Plan
profile.plan    = <derselbe Plan wie plans[aktiv]>   // Spiegel, wird bei jedem Speichern mitgeschrieben

plan = { id, name, v, created, split, splitName, goal, locs, days:[day], meso:{start,len}, next, bal,
         forceDeload, deloadUntil,
         custom: true|false,   // true = vom Nutzer gebaut
         edited: true|false }  // true = Nutzer hat einen empfohlenen Plan verändert
day  = { id, key, name, focus, slots:[slot] }      // id bei neuen Tagen: 'd' + uid()
slot = { id, p:[muster], r:'main|sec|iso|skill|core|cond', sets, rr:[lo,hi], custRR, rest, ex:{home,gym}, ss }
workout.planId, active.planId      // neu, rein informativ
```

### Bauen

1. **Umstellung beim Start** (`normalizePlans()` in `boot()` nach `Store.init()`):
   - Wenn `profile.plan` existiert und `profile.plans` fehlt: Sicherung anlegen, dann
     `plans = [profile.plan]`, `planId = plan.id` (falls `id` fehlt: vergeben), `plan.name = plan.splitName`.
   - Immer: `profile.plan` auf das Objekt in `plans` mit `planId` zeigen lassen (gleiche Referenz!). Wenn `planId`
     ungültig: ersten Plan nehmen. Dadurch funktioniert sämtlicher bestehender Code mit `plan()` / `P().plan` unverändert.
   - `satzwerk.meta.schema = 2`.
   - Nach `importData` und nach Wiederherstellen einer Sicherung ebenfalls `normalizePlans()` rufen.
2. **Pläne-Fenster** (`SHEETS.plans`, Knopf „Pläne“ oben im Plan-Reiter neben dem Zahnrad; der Plan-Reiter zeigt den
   Plannamen als Überschrift):
   - Liste aller Pläne: Name, „N Tage“, Kennzeichen „Empfohlen“ / „Eigener Plan“, aktiver Plan markiert.
   - Je Plan: **Aktivieren**, **Umbenennen**, **Duplizieren**, **Löschen** (nicht der letzte; Rückfrage; Sicherung vorher).
     Aktivieren ist gesperrt, solange ein Training läuft (Hinweis).
   - **＋ Neuer Plan** → Auswahl: „Leer“, „Aus Vorlage“ (Ganzkörper / OK-UK / PPL mit Tageszahl – nutzt `E.buildPlan`
     mit einer Kopie des Profils und gesetztem `split`/`days`, Ergebnis `custom: true`), „Kopie des aktuellen Plans“,
     „Neu empfehlen lassen (Fragebogen)“ (bisheriger Weg `quizEdit`).
3. **Tage bearbeiten.** Im Plan-Reiter neben jedem Tagesnamen ein „⋯“-Knopf → `SHEETS.dayEdit`:
   Name ändern, Tag nach oben/unten, duplizieren, löschen (Rückfrage; mindestens ein Tag bleibt).
   Unter dem letzten Tag: Knopf „＋ Tag hinzufügen“ (Name abfragen, `focus: 'full'`, leere `slots`).
   Nach Verschieben/Löschen `plan.next` so anpassen, dass derselbe Tag als nächster bleibt (über `day.id` merken).
4. **Übungen im Tag** (vorhandenes `SHEETS.slot` erweitern): Sätze, Wdh. von/bis (bei Halteübungen Sekunden),
   Pause, **Rolle** wählbar (Grundübung / Ergänzung / Isolation / Rumpf / Skill / Kondition), Tauschen, Supersatz, Löschen.
   Sätze und Wdh. mit großen Minus/Plus-Knöpfen statt nur Zahlenfeld.
   `addToPlan(di, id)`: neuer Slot mit `p:[ex.pat]`, `r: roleOfEx(ex)`, `sets` 3, `rr` aus `E.goalRanges(goal)[r]` oder
   `ex.rr`, `rest` nach Rolle (wie `buildPlan`), `ex[loc] = id`. Für den zweiten Ort (wenn `locs.length > 1`):
   dieselbe Übung, falls dort die Geräte da sind (`E.available`), sonst beste Alternative über `E.alternatives`, sonst leer.
5. **Jede Änderung markiert den Plan:** Hilfsfunktion `touchPlan()` setzt bei empfohlenen Plänen `edited = true`
   (Slot ändern, tauschen, löschen, hinzufügen, Reihenfolge, Tage). Überall dort aufrufen, wo heute `Store.saveProfile()`
   nach einer Planänderung steht.
6. **Nie mehr ungefragt überschreiben:**
   - `boot()`: automatisches Neuberechnen bei alter `PLAN_VERSION` **nur** für Pläne mit `!custom && !edited`.
     Bei den anderen nur `plan.v` hochsetzen.
   - Einmaliges `balancePlan` in `boot()` (`!plan.bal`): ebenfalls nur für `!custom && !edited`.
   - `A.rebuildYes` („Plan neu berechnen“): erzeugt einen **neuen** Plan in der Liste und aktiviert ihn; der alte bleibt
     als „<Name> (vorher)“ erhalten. Zyklus (`meso`) wird übernommen.
   - `A.acceptPlan` (Fragebogen-Ergebnis): fügt den Plan der Liste hinzu und aktiviert ihn, alter bleibt.
   - `E.refreshSelection` und alles, was Übungen selbsttätig austauscht: für `custom`/`edited` überspringen
     (Fundstellen per Suche prüfen).
   - `A.balanceNow` bleibt als Knopf; bei eigenen Plänen zeigt er vorher, was er ändern würde (vorhandenes
     `balanceInfo`-Fenster als Vorschau mit „Übernehmen“ / „Abbrechen“).
7. **Gleiche Logik für eigene Pläne.** Prüfen und sicherstellen, dass für `custom`-Pläne funktionieren:
   Startseite (nächster Tag, Tageswahl), `startWorkout`, `timePlan` (kürzer/länger), Zyklus/Deload
   (`meso` beim Anlegen setzen: `{start: heute, len: 5}`), `prescription` (Sätze, Reserve, Deload), `recommend`,
   Wochen-Check-in, Volumen-Karte, Supersätze, Notizen, Rekorde/Verlauf (hängen an der Übung, nicht am Plan).
   Ein Tag ohne Übungen kann nicht gestartet werden (Knopf aus, Hinweis „Füge Übungen hinzu“).
8. **Fragebogen fehlt?** Eigene Pläne setzen `profile.answers` voraus (Ort, Geräte, Erfahrung). Der Weg zum ersten
   eigenen Plan führt deshalb weiter über den Fragebogen; auf der Ergebnis-Seite zusätzlicher Knopf
   „Lieber eigenen Plan bauen“ (legt leeren `custom`-Plan an und öffnet den Plan-Reiter).
9. **Wochen-Volumen als Hilfe beim Bauen.** `volumeCard` für eigene Pläne mit klaren Hinweisen:
   unter 6 Sätze „wenig“, 6–15 „gut“, über 15 „viel“ je Muskel, und „nur 1× pro Woche“ wenn ein Muskel nur an einem
   Tag vorkommt. Nur Hinweise, keine Sperre.

### Prüfkriterien

- Nach dem Update: alter Plan ist unverändert da und aktiv, Verlauf und Rekorde vollständig.
- Neuen leeren Plan anlegen, 3 Tage, Übungen, Sätze/Wdh. setzen, aktivieren, Training starten, speichern →
  nächster Tag rückt weiter, Empfehlung beim zweiten Mal nutzt den Verlauf.
- Zwischen zwei Plänen wechseln: jeder merkt sich seinen nächsten Tag und Zyklus.
- „Plan neu berechnen“ lässt den alten Plan in der Liste.
- Export → Zurücksetzen → Import: alle Pläne wieder da.
- Altes Backup (vor Etappe 4) importieren → wird sauber umgestellt.
- **Am iPhone prüfen:** Plan bauen mit einer Hand; Ziehen zum Umsortieren funktioniert weiter.

---

## Etappe 5 – Trainingswissenschaft

**Nutzen:** Logik passt zum Ziel „Fett weg und Muskeln aufbauen“, Steigerung nachvollziehbar. **Aufwand:** mittel.
**Datenrisiko:** gering (nur Rechenregeln; neue Felder `answers.goal = 'recomp'`, `meso.len`).

### Bewertung des heutigen Stands

| Thema | Heute | Urteil | Änderung |
|---|---|---|---|
| Volumen | 10 Sätze/Muskel/Woche, Schwerpunkt 14, Deckel 15, Mitbeteiligung halb | gut (Bereich mit dem besten Verhältnis Nutzen/Aufwand; Nutzerregel) | Untergrenze 5 → 6; Häufigkeit ≥ 2×/Woche anzeigen |
| Wdh.-Bereiche | Grund 6–10, Ergänzung 8–12, Isolation 10–15 | gut (5–30 Wdh. bauen ähnlich auf, wenn nah am Versagen) | keine |
| Reserve (RIR) | Grundübungen 2→1, Isolation 1, Deload 3 | gut, Nutzerwunsch 1–2 | keine |
| Progression | verdeckte +1,5–3 % auf die Leistungszahl | unklar für den Nutzer | **doppelte Progression** |
| Pausen | Grund 150 s, Ergänzung 120 s, Isolation 75 s | Isolation etwas kurz | Isolation 90 s |
| Deload | jede 5. Kalenderwoche, halbe Sätze, RIR 3 | Inhalt gut, Zeitpunkt starr | nach **trainierten** Wochen, Länge wählbar, zusätzlich nach Bedarf |
| Reihenfolge | Skill → Grund → Ergänzung → Isolation → Rumpf | gut | Hinweis bei eigenen Plänen |
| Ziel | kein „Fett weg + Muskeln“ | fehlt | neues Ziel `recomp` |
| Abbruchregel | Übung beenden bei −15 % zum besten Satz | gut | keine |

### Bauen

1. **Neues Ziel `recomp`** („Fett weg & Muskeln aufbauen“, Untertitel „Muskeln aufbauen oder halten, während das
   Körperfett sinkt“) in `Q` (Frage `goal`) als zweite Option; Namen in `planView` (`goalN`) ergänzen.
   `goalRanges('recomp')` = wie `muscle`. Hilfsfunktion `E.isCut(profile)` = Ziel `recomp`.
   Bestehende Nutzer: einmalige Karte auf der Startseite „Neues Ziel verfügbar: Fett weg & Muskeln aufbauen“ mit
   „Umstellen“ (setzt nur `answers.goal` und `plan.goal`, **baut den Plan nicht um**) / „Nein danke“
   (`profile.seen.recomp = true`).
   Wirkung von `isCut` (Erholung ist im Kaloriendefizit knapper; das Gewicht auf der Stange hält die Muskeln):
   - `volTargets`: Schwerpunkt 12 statt 14, Grundziel bleibt 10.
   - `prescription`: der Zusatzsatz für Grundübungen in Woche 3/4 entfällt.
   - `applyCheckin`: „mehr Volumen“ erst ab Punktzahl ≤ −3,5 (statt −2,5).
   - Rückmeldung nach dem Satz/Training: gleiche Leistung wie letztes Mal gilt als Erfolg („Kraft gehalten – genau
     richtig beim Abnehmen“).
   - `restMain` 150 s wie bei `muscle`; kein Pflicht-Finisher.
   - Info-Text (Plan-Reiter, einklappbar, allgemein gehalten, keine persönlichen Werte):
     reichlich Eiweiß (Richtwert 1,6–2,2 g je kg Körpergewicht), mäßiges Defizit (etwa 0,5 % Körpergewicht pro Woche),
     Schlaf, tägliche Schritte; Kraftwerte halten ist das Zeichen, dass die Muskeln bleiben.
2. **Doppelte Progression** in `recommend` (für `kind === 'load'` und für `bw` mit Zusatzgewicht, nicht mit Band,
   nicht im Deload, nur wenn es einen Verlauf gibt und die letzte Einheit ≤ 21 Tage her ist; sonst bisherige Logik):
   - `anker` = Gewicht des ersten Satzes der letzten Einheit, auf die verfügbare Liste `opts` gerastet (`snap`).
   - **Alle** Sätze der letzten Einheit ≥ `hi` Wdh. bei Reserve ≤ Ziel + 1 → nächstschwereres Gewicht aus `opts`
     (höchstens +10 %; gibt es keins: Gewicht bleiben, Hinweis „Schwerstes Gewicht: langsamer ablassen“).
     Ziel-Wdh. erster Satz = `lo` (mindestens das, was die Leistungszahl hergibt, höchstens `hi`).
     Hinweis: „Obergrenze geschafft: Gewicht hoch, Wdh. beginnen wieder unten“.
   - Erster Satz der letzten Einheit < `lo` − 1 → nächstleichteres Gewicht.
   - Sonst: Gewicht = `anker`, Ziel-Wdh. = (Wdh. des entsprechenden Satzes der letzten Einheit) + 1, begrenzt auf
     `[lo, hi]`. Hinweis: „Gleiches Gewicht, 1 Wdh. mehr als letztes Mal“.
   - Innerhalb der Einheit (ab Satz 2) bleibt das Gewicht stehen; die Wdh. kommen weiter aus der Leistungszahl `C`
     (Ermüdung), nie über dem Ziel des ersten Satzes. Weicht der erste Satz stark ab (Tagesform ≤ −8 % oder ≥ +8 %),
     gilt wie bisher die Leistungszahl – auch für das Gewicht.
   - Körpergewichtsübungen ohne Zusatzgewicht: gleiche Regel nur über Wdh.; bei `hi` + 2 erreicht → Hinweis auf die
     nächste Stufe (vorhandenes `out.harder`).
   - Die bisherige Zeile „Letztes Mal alle Ziele geschafft: +x % Progression“ entfällt in diesen Fällen.
   Mit einem kleinen Node-Skript (Engine mit `window`-Attrappe laden) fünf Fälle durchrechnen und die Ausgabe im
   Commit-Text nennen: erster Tag ohne Verlauf; Mitte des Bereichs; Obergrenze geschafft; unter Untergrenze; lange Pause.
3. **Zyklus nach trainierten Wochen** (`mesoWeek`): Woche = 1 + Anzahl der Kalenderwochen seit `meso.start`
   (ohne die laufende), in denen mindestens ein Training gespeichert wurde, modulo `len`. Dafür bekommt `mesoWeek`/
   `weekInfo` die Trainingsliste (`ctx.workouts`; in `app.js` überall `st.workouts` mitgeben – Fundstellen per Suche
   `weekInfo(` und `prescription(`; fehlt die Liste, gilt die alte Kalenderrechnung).
   Pause von ≥ 14 Tagen ohne Training → `meso.start` auf die aktuelle Woche setzen (Zyklus beginnt bei „Einstieg“,
   kein Deload nötig) und Hinweis-Toast.
   **Länge wählbar:** im Plan-Reiter in der Zyklus-Karte „Deload alle 4 / 5 / 6 / 8 Wochen“ (`meso.len`, Standard bleibt 5;
   Text der Karte anpassen, statt fest „Woche 5“). `RIR_PLAN`-Zeilen und Wochen-Namen auf beliebige Länge abbilden:
   `i = Math.round((w − 1) / Math.max(1, len − 2) * 3)`.
   **Deload nach Bedarf:** Wenn bei mindestens zwei Grund-/Ergänzungsübungen die beste Satzleistung (`sessionBest`)
   zweimal hintereinander gefallen ist (jeweils > 3 %), Karte auf der Startseite „Leistung fällt – Deload-Woche
   empfohlen“ mit „Deload starten“ (`deloadUntil` = heute + 7 Tage) / „Nein“. Höchstens einmal pro 3 Wochen zeigen.
4. **Pausen:** `buildPlan`: Isolation 90 s statt 75 s. Bestehende **empfohlene, unveränderte** Pläne (`!custom && !edited`):
   einmalig Isolation-Slots mit genau 75 s auf 90 s (`plan.restV = 2`). Eigene/veränderte Pläne nicht anfassen.
5. **Volumen:** in `balancePlan` Untergrenze 6 statt 5 (Konstante suchen). `volumeCard`: je Muskel zusätzlich
   „1×“/„2×“ pro Woche anzeigen; bei nur 1× und ≥ 3 Trainingstagen Hinweis „besser auf zwei Tage verteilen“.
6. **Reihenfolge-Hinweis:** Im Plan-Reiter bei einem Tag, in dem eine Isolationsübung vor einer Grundübung steht, die
   denselben Muskel braucht (z. B. Trizeps vor Bankdrücken): kleiner Hinweis „Grundübung zuerst bringt mehr“. Nur Hinweis.
7. **Kommentare im Code** bei `RIR_PLAN`, `VOL_T`, `recommend`, `mesoWeek` auf die Regeln in `CLAUDE.md`
   („Wissenschaftliche Regeln“) abstimmen.

### Prüfkriterien

- Ziel umstellen ändert weder Plan noch Verlauf; Volumen-Karte zeigt neue Zielwerte.
- Übung mit Verlauf 3×8/8/7 bei 8–12: Empfehlung gleiches Gewicht, 9 Wdh. Nach 3×12: nächstes Gewicht, 8 Wdh.
- Zwei Wochen nicht trainiert → Zyklus steht nicht plötzlich auf Deload.
- Deload-Abstand auf 6 gestellt → Karte zeigt „Woche x von 6“.
- **Am iPhone prüfen:** Empfehlungen wirken plausibel im echten Training (erste zwei Einheiten beobachten).

---

## Etappe 6 – Eigene Vorschläge und Komfort

Jeder Punkt ist ein **Eigener Vorschlag** und einzeln umsetzbar. Sagt der Nutzer zu einem „Nein“, hier durchstreichen.
**Aufwand:** zusammen mittel. **Datenrisiko:** gering (nur neue, zusätzliche Felder).

- [ ] **V1 – Werte ohne Tastatur ändern.** Grund: Zahlen tippen mit einer Hand ist mühsam.
  In der Fokus-Karte neben Gewicht und Wdh. große −/+-Knöpfe (mindestens 44 px; Gewicht springt durch die verfügbare
  Liste `E.loadOptions`, sonst `wStep`). Das Reserve-Fenster bleibt (2 Tipps pro Satz: „Satz fertig“ → Reserve), die
  Knöpfe darin werden größer (2 Reihen à 3, mindestens 64 px hoch), Ziel-Reserve farbig hervorgehoben.
  Zusätzlich Einstellung „Schnell abhaken“ (`settings.quick`, Standard aus): „Satz fertig“ speichert sofort mit
  Ziel-Reserve; Antippen der Satznummer korrigiert wie bisher.
- [ ] **V2 – Rückgängig.** Grund: Fehltipp zwischen den Sätzen. Der Toast nach dem Abhaken bekommt für 6 s einen Knopf
  „Rückgängig“ (entfernt den letzten Satz, stellt `cur`, Pause und Entwurf wieder her).
- [ ] **V3 – „Gerät besetzt“.** Grund: Alltag im Studio. In der Fokus-Karte Knopf „Später“ (schiebt die Übung ans Ende
  der noch offenen Übungen, nur heute) neben „Tauschen“. Supersatz-Partner wandern gemeinsam.
- [ ] **V4 – Gewichtstrend.** Grund: Beim Abnehmen zählt der Trend, nicht der Tageswert. Im Fortschritt-Reiter „Körper“:
  Mittel der letzten 7 Tage gegen die 7 Tage davor, Anzeige „−0,4 % pro Woche“. Bei Ziel `recomp`: grün bei −0,25 bis
  −0,75 %/Woche, Hinweis „zu schnell – Muskeln in Gefahr“ unter −1 %, „kaum Bewegung“ über −0,1 % (erst ab 3 Wochen Daten).
  Nur lokal; nichts davon in Repo-Texte schreiben.
- [ ] **V5 – Baseball-Tage.** Grund: schwere Beine/Schultern direkt vor dem Spiel schaden. Einstellung „Spiel-/
  Trainingstage“ (Wochentage, `profile.sportDays`). Startseite: Wenn morgen ein solcher Tag ist und der nächste Plan-Tag
  eine schwere Bein- oder Überkopf-Grundübung enthält → Hinweis mit Knopf „Anderen Tag vorziehen“ (nutzt die vorhandene
  Tageswahl `homeDay`).
- [ ] **V6 – Pausenende deutlicher.** Grund: iPhone vibriert nicht aus Web-Apps, Ton ist im Stumm-Modus aus (A17).
  Bei Ablauf blinkt das untere Panel dreimal kräftig (Farbe wechselt auf Lime), große Schrift „Los geht’s“.
  In den Einstellungen ehrlicher Hinweis: „Vibration gibt es auf dem iPhone nicht; Ton nur, wenn der Stumm-Schalter aus
  ist. Bei gesperrtem Bildschirm kann die App nichts melden.“ Der Bildschirm bleibt im Training an (vorhandenes
  `keepAwake`); nach Rückkehr `keepAwake(true)` erneut.
- [ ] **V7 – Rekord in Reichweite.** Grund: Motivation ohne Mehraufwand. In der Ziel-Box eine Zeile, wenn die Empfehlung
  höchstens 3 % unter dem bisherigen Bestwert der Übung liegt: „Rekord bei 9 Wdh. mit 60 kg“ (über `E.setScore`
  zurückgerechnet).
- [ ] **V8 – iOS-Feinschliff.** Grund: Bedienung mit einer Hand. Alle Tipp-Flächen ≥ 44 px prüfen (besonders `.btn.sm`
  in der Fuß-Leiste der Übung – in ein „⋯ Mehr“-Fenster zusammenfassen, sichtbar bleiben nur „+ Satz“, „Tauschen“,
  „Notiz“); Fenster schließen sich auch per Wisch nach unten (vorhanden – prüfen); `-webkit-tap-highlight-color`
  aus; `touch-action: manipulation` auf Knöpfen (kein Doppeltipp-Zoom); Sicherheitsabstände (`safe-area`) am unteren
  Panel prüfen.

### Prüfkriterien

- Je Vorschlag einmal im Training durchspielen; nichts davon verändert alte Trainings.
- **Am iPhone prüfen:** V1 mit dem Daumen, V6 Sichtbarkeit aus zwei Metern.

---

## Später (nicht geplant, nur merken)

- Abgleich zwischen Geräten über ein privates GitHub-Repo (wie Kochwerk) – erst wenn gewünscht.
- Garmin/Apple Health: bewusst nicht (siehe `CLAUDE.md`).
