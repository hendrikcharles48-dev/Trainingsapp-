# Satzwerk – Hinweise für Claude

Trainings-PWA (Vanilla JS). Quellen im Repo-Root: `index.html`, `app.js`, `engine.js`,
`exercises.js`, `howto.js`, `figures.js`. `node pwa/build.js` baut nach `pwa/dist`, danach
`pwa/dist/*` nach `docs/` kopieren (GitHub Pages läuft aus `main:/docs`).
Achtung: `docs/toleranzen/`, `docs/stunden/` und `docs/kochwerk/` gehören zu anderen Apps – nie löschen oder überschreiben
(also kein `rm -rf docs/*`). Bei jedem Release `CACHE` in `pwa/sw.js` hochzählen.

## Arbeitsregeln (Satzwerk)
- **Bauplan:** `docs/ROADMAP.md` (Etappen mit Prüfkriterien). Skill `satzwerk-etappe` („nächste Etappe“) arbeitet sie ab.
- **Erst kurzen Plan zeigen, auf OK warten**, dann umsetzen (außer der Nutzer verzichtet ausdrücklich darauf).
- **Bestehende Daten nie verlieren:** gespeicherte Felder nie löschen oder umbenennen, Neues nur zusätzlich; vor jeder
  Umstellung eine Sicherung. Nur Schlüssel mit `satzwerk.`, nie `localStorage.clear()` – der Browser-Speicher wird mit
  den anderen Apps derselben Adresse geteilt (Lernwerk, Kochwerk, Stunden, Toleranzen).
- Keine fremden Dienste, kein Server, keine Bibliotheken. Das Repository ist öffentlich: keine persönlichen
  Gesundheitsdaten (Gewicht, Beschwerden, Messwerte) in Dateien schreiben.
- Sparsam lesen: `app.js` hat sehr lange Zeilen → per `grep -n … | cut -c1-300` gezielt lesen.

## Aufbau
- `index.html`: Gerüst (`#app`, `#layer`) und gesamtes CSS. `pwa/build.js` setzt Kopf und Service-Worker-Anmeldung davor/dahinter.
- `exercises.js` (`window.EXDB`: `list`, `byId`, `MUSCLES`, `GROUPS`, `PATTERNS`, `EQUIP`), `howto.js`, `figures.js` (`figSVG`).
- `engine.js` (`window.ENGINE`): Fragebogen `Q`, `buildPlan`/`fillDay`/`balancePlan`/`planVolume`, `timePlan`,
  `weekInfo`/`mesoWeek`, `prescription` (Sätze, Wdh.-Bereich, Reserve, Pause je Slot), `recommend` (Empfehlung je Satz),
  `setScore`/`sessionBest`/`historyFor`, `applyCheckin`.
- `app.js`: Zustand `st`; `render()` baut die Ansicht als HTML-Text neu. Reiter: `homeView`, `planView`, `libView`,
  `progView`, `timerView`. Overlays über `st.ov` (`workout`, `quiz`, `result`), Fenster über `st.sheet` + `SHEETS`,
  unteres Trainings-Panel `renderRest`. Klicks: `data-a` → `A[...]`; Eingaben: `data-in` → `IN[...]`.
  Training: `startWorkout` → `exState`/`curIndex` → `focusCard` → `A.doneSet` → Fenster `rir` → `commitSet` → `finishWorkout`.
- Beim Tippen nie die ganze Ansicht neu bauen (Suchfelder: nur die Trefferliste ersetzen).

## Datenmodell und Speicher
- Speicher über `Store` (`app.js`): localStorage `satzwerk.profile`, `satzwerk.workouts` (Liste), `satzwerk.active`
  (laufendes Training). In der Artifact-Version zusätzlich Online-Speicher (`Store.mode === 'db'`).
  Geplant laut Roadmap: `satzwerk.meta`, IndexedDB `satzwerk` (Sicherungen).
- `profile`: `answers` (Fragebogen), `plan`, `custom` (eigene Übungen), `settings`, `exW`, `exNotes`, `checkins`, `adapt`.
- `plan`: `{id, v, split, splitName, goal, locs, days, meso:{start,len}, next, bal, forceDeload, deloadUntil}`;
  `day`: `{id, key, name, focus, slots}`; `slot`: `{id, p, r, sets, rr, custRR, rest, ex:{home,gym}, ss}`.
  Rollen `r`: `main` Grundübung, `sec` Ergänzung, `iso`, `skill`, `core`, `cond`.
- `active`: `{id, dayIdx, dayId, name, loc, start, bw, exercises:[{key, exId, slotId, presc, sets, draft, extra, band, ss, note}], cur}`.
- `workout` (gespeichert): `{id, ts, date, name, dayId, loc, dur, bw, exercises:[{exId, sets:[{w,reps,sec,rir,band}], rirT, rr, note, best}], prs, vol}`.
- Export: JSON `{app:'satzwerk', version, profile, workouts}`; ältere Versionen müssen importierbar bleiben.

## Wissenschaftliche Regeln (Ziel: Fett reduzieren und Muskeln aufbauen)
- Volumen: ~10 harte Sätze je Muskel und Woche, Schwerpunkte mehr, Deckel 15, mitbeteiligte Muskeln halb; jeder Muskel
  möglichst 2× pro Woche. Im Defizit nicht mehr Volumen, sondern Gewicht auf der Stange halten.
- Wiederholungen: Grundübungen 6–10, Ergänzung 8–12, Isolation 10–15 (5–30 wirken ähnlich, wenn nah am Versagen).
- Reserve: 1–2 Wdh. (Grundübungen nie bis zum Versagen), Deload 3. Ehrliche Reserve-Angabe steuert alles.
- Progression: doppelt – erst Wdh. bis zur Obergrenze, dann nächstes Gewicht (Roadmap Etappe 5).
- Pausen: Grundübungen 2,5–3 min, Ergänzung 2 min, Isolation ~1,5 min; Supersätze nur bei Übungen, die sich nicht stören.
- Deload: alle 4–8 trainierten Wochen oder nach Bedarf (Check-in, fallende Leistung): halbe Sätze, Gewicht bleiben.
- Reihenfolge: Skill → Grundübung → Ergänzung → Isolation → Rumpf; Schwerpunkt-Muskel früh in der Einheit.

## Designregeln (modernes iOS, Bedienung mit einer Hand)
- Tipp-Flächen ≥ 44 px, wichtige Knöpfe unten in Daumenreichweite, höchstens 2 Tipps pro Satz.
- Eingabefelder ≥ 16 px Schrift (sonst zoomt iOS), Zahlen lieber über −/+ als über die Tastatur.
- Aktuelle Übung im Training immer sichtbar; nichts darf beim Sperren oder App-Wechsel verloren gehen.
- Sicherheitsabstände (`env(safe-area-inset-*)`) beachten, Fenster von unten, dunkles Design, ruhige Animationen.
- iPhone: keine Vibration aus Web-Apps, Ton nur ohne Stumm-Schalter – Signale immer auch sichtbar machen.
- Texte kurz, deutsch, ohne Fachwörter.

## Feste Regel des Nutzers: bei JEDEM Update eigene Übungen prüfen

Bevor ein Update hochgeladen wird, nachsehen, ob der Nutzer neue eigene Übungen angelegt hat.
Für jede gefundene Übung herausfinden, was genau gemeint ist, und sie als vollwertige Übung einbauen:

Was der Nutzer pro Übung will: Ausführung, worauf achten, häufiger Fehler – und die Übung nach
Schwierigkeit einsortieren (`lvl` 1–5 und, wenn es eine Progressionskette gibt, `grp`/`rank`
zwischen die passenden Stufen). Darüber findet der Knopf „Leichter / Schwerer“ im Training die
Nachbarn (Auswahlfenster mit empfohlener Variante).

1. `exercises.js`: Eintrag mit `X(...)` – passendes Muster, Rolle, Art, Geräte, Muskeln, Level,
   Wiederholungsbereich, ggf. `grp`/`rank` in der Progressionskette, `bwf`, `uni`, `inj`, `d`, `c`.
   Den Namen, den der Nutzer benutzt hat, als `alias` eintragen.
2. `howto.js`: Anleitung (`s` Schritte, `w` Darauf achten, `f` häufiger Fehler).
3. `figures.js`: Figur/Template + Eintrag in der `map`, Bewegung realistisch (Blickrichtung,
   Füße, Geräteposition) – mit `figcheck` prüfen.

Die App übernimmt beim Start automatisch: Passt der Name (oder ein `alias`) einer eigenen Übung
zu einer eingebauten Übung (`findBuiltin` in `app.js`), werden Verlauf, Plan und Favoriten auf die
eingebaute Übung umgestellt und die eigene Übung entfernt.

Wo die eigenen Übungen zu finden sind:
- Die installierte App (GitHub Pages) speichert nur lokal auf dem iPhone – dort nicht lesbar.
  Der Nutzer schickt sie über den Knopf „An Claude schicken“ (im Info-Fenster der eigenen Übung)
  als Text in den Chat, oder nennt sie im Chat.
- Artifact-Version: `ArtifactData` → `data/users/me/profile`, Feld `custom`
  (Artifact https://claude.ai/artifact/9rhKGs5pYvdeqRx7ymim9L).
- Wenn nichts davon vorliegt: den Nutzer kurz fragen, ob er neue Übungen angelegt hat.

Bereits eingebaut: „Pistol Squat an Ringen“ (`ring-pistol`), „L-Sit an Ringen“ (`ring-lsit`), „Tuck L-Sit an Ringen“ (`ring-tuck-lsit`).
Eigene Übungen lassen sich auch direkt beim Tauschen/Wählen anlegen („Eigene Übung anlegen“, `customFrom`).

## Trainingslogik
- Ziel Muskelaufbau, Reserve (RIR) bewusst 1–2 (Nutzerwunsch), siehe `RIR_PLAN` in `engine.js`.
- Der Nutzer spielt Baseball; Wochen-Check-in passt Volumen an.
- Effizienz-Prinzip (Nutzerwunsch, „2-5-15“ sinngemäß): pro Muskel/Woche ~10 harte Sätze,
  Schwerpunkte ~14, Deckel 15, mitbeteiligte Muskeln zählen halb, Skills nur 2×/Woche.
  `balancePlan()`/`planVolume()` in `engine.js`; läuft in `buildPlan` und einmalig für alte Pläne
  (`plan.bal`). Nach dem Pflichtprogramm gibt es „Freies Training“ mit Vorschlägen.

## Widerstandsbänder
Bei passenden Übungen (`canBand` in `engine.js`) gibt es im Training den Reiter „Widerstandsband“
(Farben in `BANDS` mit grober kg-Hilfe). Der Satz speichert `band`; `effLoad`/`setScore`/`recommend`
rechnen die Hilfe heraus, mit Band kein Zusatzgewicht. Beim nächsten Mal fragt die App
„Letztes Mal mit Band … – heute wieder?“.
Achtung: gespeicherte Sätze haben kein `done`-Feld – im Engine immer `done !== false` prüfen.

## Gewichte, Supersätze, Notizen
- Eigene Gewichtsliste pro Übung und Ort: `profile.exW[exId + '@' + loc]` (Knopf „⚖ Gewichte“),
  `loadOptions` nimmt sie vorrangig.
- Supersätze: gleiche `ss`-ID an Plan-Slots (`slot.ss`) oder Trainings-Einträgen (`entry.ss`).
  Nach einem Satz geht es direkt zum Partner (15 s), nach der Runde normale Pause (`commitSet`).
- Notizen bleiben pro Übung: `profile.exNotes[exId] = {t, d}`; angezeigt im Training, Tagesfenster,
  Plan und Übungsinfo.

## Garmin
Tagesform aus Garmin-Werten wurde gebaut und auf Wunsch des Nutzers wieder entfernt: Garmin gibt
Trainingsbereitschaft, Body Battery und (wahrscheinlich) HRV nicht an Apple Health weiter, nur
Ruhepuls/Schlaf – zu wenig Nutzen. Die Tagesform kommt aus der Satzleistung (`dayForm` in
`recommend`) und dem Wochen-Check-in. Nur wieder einbauen, wenn der Nutzer es ausdrücklich will.

## Kochwerk (eigene App in `kochwerk/`)
Abnehm-App ohne Tracking, alle 5 Etappen fertig (Rezepte, Tages-/Wochenplan, Einkauf, Kochsession/Boxen,
Abgleich iPad über privates GitHub-Repo + Export/Import). Bei größeren Änderungen erst kurz den Plan zeigen.
- Satzwerk dafür nie anfassen. Speicher nur mit Präfix `kochwerk_`. Keine Fotos speichern.
- Deploy: Dateien aus `kochwerk/` (inkl. `vendor/`) nach `docs/kochwerk/` kopieren (ohne `test.js`, `IMPORT-FORMAT.md`),
  `CACHE` in `kochwerk/sw.js` hochzählen. Tests: `node kochwerk/test.js`.
- Import-Format: `kochwerk/IMPORT-FORMAT.md`, passt zum Chat-Skill „kochwerk-rezept“. Format nur zusammen ändern.
- Plan: Sammlung `plan`, ein Eintrag pro Mahlzeit (`id` = `p<Datum>-<meal>` für Hauptmahlzeiten, `s…` für Snacks,
  `pos` 10/20/30/40, Snacks dazwischen). Bewertungsfrage speichert `ratings['r'+planId]` (auch `skip`). Logik in `plan.js`.
- Einkauf (`shop.js`): `checks` (`c<Woche>|<Zutat>`, speichert gekaufte Packungen), `later`, `pantry`, `extra`,
  `restfix` (Korrektur: Rest = amount + (gerechnet − asOf)), `packs` (eigene Packungsgrößen, gleiche id wie Standard überschreibt).
- Kochen (`cook.js`): `cooked` (`w<Woche>`, echter Kochtag + Rezepte), `thaw` (`t<planId>` erledigt). Laufende Session nur lokal in
  `kochwerk_session` (nicht abgeglichen).
- Abgleich (`sync.js`): Datei `kochwerk-daten.json` im privaten Repo des Nutzers, `KW.merge` pro Eintrag, Schlüssel nur in
  `kochwerk_sync`. `save()` stößt den Abgleich an, `persist()` speichert ohne. Neue Sammlungen werden automatisch mit abgeglichen.
- Rezeptpaket: `kochwerk/rezepte-paket.txt` (im Import-Format). Die App bietet beim Öffnen neue Rezepte daraus an
  (Karte auf „Rezepte“), Übernommenes/Abgelehntes merkt sie in der Einstellung `paketDone`. Neue Rezepte aus dem Chat
  oder einem Artefakt hier anhängen (Werte pro 100 g, Packungen, Vorrat) – Test vergleicht kcal/Protein mit Sollwerten.
- Ausrichtung ab 2.0 (Nutzerwunsch 7.11.): in erster Linie Meal-Prep-Rezepte. Reiter Rezepte · Kochen · Einkauf · Mehr (Start: Rezepte).
  „Kochen“ = Woche vorkochen (Töpfe/Boxen der Woche, Kochsession, Boxen, Auftauhinweise); der Wochenplan (`pageWoche`) ist Unterseite von Kochen.
  Navigation über `go()`/`goBack()` mit Verlauf `HIST`; Wischen vom linken Rand (≤28 px) zur Mitte = Seite davor (Nutzerwunsch).
  Rezeptfilter `PREP` (Einfrierbar, 4+ Tage, 4+ Boxen, Viel Protein, Schnell). Paket-Karte steht auf „Rezepte“.
  Symbole pro Rezept aus dem Namen: `KW.recipeIcon` (`ICON_RULES` in `core.js`, Salat → 🥗 usw., sonst Kategorie-Symbol).
  Automatisch planen (Wochenplan): Einstellungen `autoMeals`/`autoDays` (z. B. nur Mittag, Mo–So), `P.autoPlan` legt die Plätze an
  und füllt sie über `suggestWeek` (Töpfe reichen für mehrere Tage). Frühstück bevorzugt Frühstücksrezepte (`P.isBreakfast`).
  „Ein Gericht für die ganze Woche“ (Einstellung `autoOne`, Standard an, Nutzerwunsch 10.11.): `oneDishWeek` nimmt pro Mahlzeit ein
  Rezept für alle Tage, wenn höchstens doppelt gekocht (`MAX_POTS`) reicht und Haltbarkeit oder Einfrieren bis zum letzten Tag passt; sonst normal gemischt.
  Monsieur Cuisine (Lidl-Küchenmaschine des Nutzers): optionales Feld `Gerät: Monsieur Cuisine` im Import-Format → `r.mc`,
  Kennzeichen 🤖, Filter „🤖 Monsieur Cuisine“, Schalter im Editor. 20 MC-Rezepte (günstig, ≤ 600 kcal, eiweißreich) im Paket;
  Schritte nennen Zeit/Temperatur/Linkslauf/Stufe. Der Chat-Skill „kochwerk-rezept“ kennt das Feld noch nicht.
- Große Portionen (Nutzerwunsch 9.11.: großer Mann, viel Hunger, trotzdem wenig kcal): Hauptmahlzeiten ≥ 550 g (Ø ≥ 680 g),
  ≤ 700 kcal, viel Gemüse + mageres Eiweiß, Stärke sparsam. Gilt auch für neue Rezepte. Test prüft das.
  Paket-Rezepte still aktualisieren: `kochwerk/paket-alt.json` = Fingerabdrücke (`KW.recipeFp`) der VORHERIGEN Paket-Fassung.
  `checkPaket` ersetzt ein vorhandenes Rezept nur, wenn es noch genau der alten Fassung entspricht (vom Nutzer geänderte bleiben).
  Vor jeder Änderung bestehender Paket-Rezepte `paket-alt.json` aus der alten Fassung neu erzeugen (bisherige Einträge behalten).
  Rezeptseite: Karte „Boxengröße“ mit „Größere Boxen“/„Kleinere Boxen“ verteilt dieselben Zutaten auf weniger/mehr Boxen (`r-port`).
- Grundzutaten (Nutzerwunsch 10.11.): nur was wirklich jeder hat – `KW.isBasic` (Öl, Salz, Pfeffer, getrocknete Gewürze, Mehl,
  Zucker, Stärke, Essig, Brühe). Das „Vorrat“-Flag im Rezept zählt nur dafür; alles andere kommt auf die Einkaufsliste
  (`KW.fallbackPack` für Knoblauch, Honig, Tomatenmark …). Grundvorrat enthält keine Hungersnack-/Notfall-Zutaten mehr.
  Dazu wählt der Nutzer selbst, was er immer zu Hause hat: Einstellung `homeStock` (Standard Knoblauch, Honig, Tomatenmark, Senf,
  Sojasoße, Zitronensaft; Auswahl `KW.HOME_CHOICES` + eigene). `KW.isBasic(i, db)` = fest (`isFixedBasic`) oder `isHome`.
  Fenster „Grundzutaten“ unter Mehr und in Einkauf → Grundzutaten prüfen.
- Kochsession: Standard „Nacheinander“ (`CK.mode = 'one'`): pro Rezept erst Zutaten bereitlegen, dann Schritt für Schritt,
  danach nächstes Rezept. „Gleichzeitig“ (`'all'`) = alte verschachtelte Planung (`CO.schedule`). Start über „Kochen starten“ im Reiter Kochen.
- Tagebuch (`track.js`) ist optional: Schalter in „Mehr“ (`ui.track`, nur lokal, Standard aus), Seite `pageHeute` als Unterseite von Mehr.
  `log` (Einträge mit Nährwert-Schnappschuss pro 100 g; `lp<planId>` = Anpassung einer geplanten Mahlzeit, `factor` 0 = nicht gegessen),
  `foods` (eigene + Open Food Facts, `fav:<id>` = Favorit). `P.room` zählt Plan + Tagebuch. Mahlzeiten dort zugeklappt, „＋“ fragt
  Rezept einplanen oder Lebensmittel eintragen. Kamera nur für Barcodes, keine Bilder speichern.
- Datenmodell: Sammlungen `id → Eintrag` mit `t` (letzte Änderung) und Löschmarken `{id, del:true, t}`, damit
  `merge` (neueste Änderung gewinnt) funktioniert. Neue Sammlungen in `COLLECTIONS` in `core.js` eintragen.
