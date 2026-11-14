# Satzwerk – Hinweise für Claude

Trainings-PWA (Vanilla JS). Quellen im Repo-Root: `index.html`, `app.js`, `engine.js`,
`exercises.js`, `howto.js`, `figures.js`. `node pwa/build.js` baut nach `pwa/dist`, danach
`pwa/dist/*` nach `docs/` kopieren (GitHub Pages läuft aus `main:/docs`).
Achtung: `docs/toleranzen/`, `docs/stunden/`, `docs/kochwerk/` und `docs/formwerk/` gehören zu anderen Apps – nie löschen oder überschreiben
(also kein `rm -rf docs/*`). Bei jedem Release `CACHE` in `pwa/sw.js` hochzählen.

## Arbeitsregeln (Satzwerk)
- **Bauplan:** `docs/ROADMAP.md` (Etappen mit Prüfkriterien). Skill `satzwerk-etappe` („nächste Etappe“) arbeitet sie ab.
- **Jedes Update direkt live stellen** (Nutzerwunsch 12.11.2026, dauerhafte Freigabe): nach Build, Kopie nach `docs/` und
  Commit einen Pull Request nach `main` anlegen und sofort mergen – erst dann sieht der Nutzer es in der App auf dem iPhone.
  Danach den Arbeits-Branch für die nächste Arbeit wieder von `origin/main` starten.
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
- Beim Tippen nie die ganze Ansicht neu bauen (Suchfelder: nur die Trefferliste ersetzen: `libResults`/`#libRes`,
  `pickResults`/`#pickRes`, `later()` verzögert). Bei offenem Overlay baut `render()` die Seite dahinter nicht neu.
- Training schnell halten: Verlauf über `histOf(exId)` (Cache, ungültig über `Store.wv`), `exState` hat einen Cache
  (Schlüssel enthält `st.ev`, das jede Klick/Eingabe hochzählt). Nach Satz/Übungswechsel `toFocus()` (Fokus-Übung oben).
- Version: `APP_VERSION` in `app.js` (Anzeige in den Einstellungen) + `CACHE` in `pwa/sw.js` bei jedem Release erhöhen.
- Service Worker: Satzwerks eigene Dateien und Schriften „Cache zuerst, im Hintergrund auffrischen“; Unterordner (andere
  Apps) Netz zuerst. Neue Version lädt die Seite nur neu, wenn kein Training läuft (`build.js`, `controllerchange`).

## Datenmodell und Speicher
- Speicher über `Store` (`app.js`): localStorage `satzwerk.profile`, `satzwerk.workouts` (Liste), `satzwerk.active`
  (laufendes Training), `satzwerk.meta` (`{schema: 2}`), Rettung beschädigter Inhalte `satzwerk.corrupt.<key>`.
  In der Artifact-Version zusätzlich Online-Speicher (`Store.mode === 'db'`). Alle Änderungen an Trainings über
  `Store.saveWorkout`/`deleteWorkout` (zählen `Store.wv` hoch). `LS.set` meldet Fehler (rotes Band `renderSaveErr`).
- Automatische Sicherung (3.9, `Cloud` in `app.js`): nach Änderungen (15 s verzögert, nach Training 3 s, beim Verlassen sofort)
  Datei `satzwerk-backup.json` (Export-Format) per GitHub-API ins private Repository des Nutzers. Zugang nur in
  `satzwerk.cloud` `{repo, token}` (nie im Export/in Sicherungen), Stand in `satzwerk.cloudState` (`last`, `sum` = Prüfsumme,
  `err`, `checked`, `conflict`, `off`). Beim Start wird der Kochwerk-Zugang (`kochwerk_sync`, nur lesen) still übernommen,
  wenn nichts eingerichtet und nicht bewusst ausgeschaltet. Lädt nur bei geänderten Daten hoch; nur private Repositorys.
  Schutz: Vor dem ersten Hochladen eines Geräts wird die GitHub-Datei geholt – fehlen hier Trainings, die dort liegen,
  wird nicht überschrieben (`conflict`, Hinweis auf Heute, „Aus GitHub laden“ → Import-Vorschau). Fenster `SHEETS.cloud`.
- Sicherungen: IndexedDB `satzwerk`, Speicher `snap` (`Backup.snapshot(grund)`, max. 8 + je eine pro „vor-…“-Grund).
  Vor jeder Umstellung/jedem Ersetzen `Backup.snapshot('vor-…')` aufrufen (Kopie wird synchron gezogen).
  Fenster „Sicherungen“ (`A.backups`), Import mit Vorschau (`importPreview`: Zusammenführen/Alles ersetzen),
  nach Laden/Ersetzen `afterDataLoad()` (ruft `normalizePlans`).
- `profile`: `answers` (Fragebogen), `plans` (alle Pläne), `planId` (aktiv), `plan` (Spiegel = aktiver Plan, gleiches
  Objekt; `normalizePlans()` beim Start hält es zusammen, `profile.plan` ist maßgeblich), `custom` (eigene Übungen),
  `settings` (u. a. `quick` = Schnell abhaken), `exW`, `exNotes`, `checkins`, `adapt`, `bwLog`, `favs`, `lastExport`,
  `seen` (einmalige Hinweise), `dlAsk` (Deload-Vorschlag zuletzt), `sportDays` (0 = Mo … 6 = So).
- `plan`: `{id, name, v, custom, edited, split, splitName, goal, locs, days, meso:{start,len}, next, bal, restV, forceDeload, deloadUntil}`;
  `custom` = vom Nutzer gebaut, `edited` = empfohlener Plan vom Nutzer verändert (`touchPlan()` bei jeder Planänderung).
  Nur `autoPlan(p)` (= `!custom && !edited`) darf automatisch umgebaut werden (Balance, Plan-Update, Favoriten-Auswahl).
  `day`: `{id, key, name, focus, slots}`; `slot`: `{id, p, r, sets, rr, custRR, rest, ex:{home,gym}, why, locked, ss}`.
  Rollen `r`: `main` Grundübung, `sec` Ergänzung, `iso`, `skill`, `core`, `cond`. Tage ändern über `keepNext()`.
- `active`: `{id, planId, dayIdx, dayId, name, loc, start, bw, exercises:[{key, exId, slotId, presc, sets:[{done,w,reps,sec,rir,band,t}], draft, extra, band, ss, note}], cur, rest, hold}`
  (`rest`/`hold` = laufende Timer, `syncTimers`/`restoreTimers`). Beim Start öffnet sich ein laufendes Training sofort (`boot`), nach 12 h Fenster `stale`.
- `workout` (gespeichert): `{id, planId, rating, ts, date, name, dayId, loc, dur, bw, exercises:[{exId, sets:[{w,reps,sec,rir,band}], rirT, rr, note, best}], prs, vol}`.
- Export: JSON `{app:'satzwerk', version: 2, appVersion, exported, profile, workouts, active}`; Version 1 bleibt importierbar.

## Wissenschaftliche Regeln (Ziel: Fett reduzieren und Muskeln aufbauen)
- Volumen: ~10 harte Sätze je Muskel und Woche, Schwerpunkte mehr, Deckel 15, mitbeteiligte Muskeln halb; jeder Muskel
  möglichst 2× pro Woche. Im Defizit nicht mehr Volumen, sondern Gewicht auf der Stange halten.
- Wiederholungen: Grundübungen 6–10, Ergänzung 8–12, Isolation 10–15 (5–30 wirken ähnlich, wenn nah am Versagen).
- Reserve: 1–2 Wdh. (Grundübungen nie bis zum Versagen), Deload 3. Ehrliche Reserve-Angabe steuert alles.
- Progression: doppelt (`recommend`, Gewichte mit Auswahlliste): gleiches Gewicht +1 Wdh. (gleich viele, wenn es härter
  war als geplant), alle Sätze an der Obergrenze → nächstes Gewicht und unten anfangen, unter der Untergrenze → leichter.
  Ab Satz 2 bleibt das Gewicht; bei Tagesform ±8 % und ohne frischen Verlauf (> 21 Tage) gilt die Leistungszahl.
- Pausen: Grundübungen 2,5–3 min, Ergänzung 2 min, Isolation 1,5 min (`E.defaultRest`); Supersätze nur bei Übungen, die sich nicht stören.
- Deload: Zyklus zählt nur trainierte Wochen (`mesoWeek`, `E.setWorkouts`), Länge 4/5/6/8 wählbar (`meso.len`),
  nach ≥ 14 Tagen Pause Neustart (`mesoBreak`); zusätzlich nach Bedarf (Check-in, `deloadNeeded` bei fallender Leistung):
  halbe Sätze, Reserve 3, Gewicht bleibt.
- Ziel `recomp` („Fett weg & Muskeln aufbauen“, `E.isCut`): wie Muskelaufbau, Schwerpunkte 12 statt 14 Sätze, kein
  Zusatzsatz in den harten Wochen, Check-in gibt erst später mehr Volumen; Gewichtstrend im Fortschritt (Ziel −0,25 bis −0,75 %/Woche).
- Reihenfolge: Skill → Grundübung → Ergänzung → Isolation → Rumpf; Schwerpunkt-Muskel früh in der Einheit.

## Designregeln (modernes iOS, Bedienung mit einer Hand)
- Tipp-Flächen ≥ 44 px, wichtige Knöpfe unten in Daumenreichweite, höchstens 2 Tipps pro Satz.
- Eingabefelder ≥ 16 px Schrift (sonst zoomt iOS), Zahlen lieber über −/+ als über die Tastatur.
- Aktuelle Übung im Training immer sichtbar; nichts darf beim Sperren oder App-Wechsel verloren gehen.
- Sicherheitsabstände (`env(safe-area-inset-*)`) beachten, Fenster von unten, dunkles Design, ruhige Animationen.
- iPhone: keine Vibration aus Web-Apps, Ton nur ohne Stumm-Schalter – Signale immer auch sichtbar machen (`flashPanel`).
- Im Training: Plus/Minus für Gewicht/Wdh. (`qAdj`), Reserve-Fenster oder „Schnell abhaken“, „Rückgängig“ im Hinweis
  (`toast(msg, ms, {a, l})`, `undoSet`), „Später“ (`exLater`), seltene Knöpfe im „⋯ Mehr“-Fenster (`exMenu`).
- Texte kurz, deutsch, ohne Fachwörter.
- Design „Graphit / Tiefblau / Eisblau“ (ab 3.7, Nutzervorgabe): nur dunkel. Variablen in `index.html`:
  `--bg #090B0F`, `--surface #12161D`, `--surface2 #1A202A`, `--line #232A35`, `--ink #EEF2F7`, `--muted #8D97A8`,
  `--accent #8FB3D9` (Eisblau, EINZIGE Akzentfarbe), `--navy #14203A`/`--navy2 #1C2B4A` (aktiv/heute, Kacheln),
  `--highlight #C9D8EA` (Rekorde, Baseball). Alte Namen (`--lime`, `--lav`, `--rose`, `--r-*` …) sind darauf abgebildet –
  nichts Buntes einführen. Keine Verläufe, keine Schatten, keine Emojis, Linien-Icons (`I` in `app.js`).
- Schrift Inter (Google Fonts) mit Tabellenziffern; große Titel 34–46 px Gewicht 900, Labels 11–13 px Großbuchstaben.
  Keine Schriftwahl mehr (`settings.font` wird ignoriert).
- Formen: Karten 22–30 px Rundung, Knöpfe 20 px, Hauptknopf 58 px Eisblau mit dunkler Schrift.
- Figuren nur per CSS gefärbt (`figures.js` unverändert) und immer in eigener Kachel (`.figtile`, `.thumb`, `.tile`, Navy).
- Stepper (`.mini`): eine Pille, −/+ fest 30 px (`flex:0 0 30px`), Zahl `flex:1; min-width:0` – nie überlappend (102,5 geprüft).
  Lange Namen mit „…“ kürzen (`.ell`, `.clamp2`). Jede Ansicht bei 390 und 375 px prüfen.
- Aufgeräumt (3.8): Zusammengehöriges an einem Ort. Heute: Hinweise gebündelt (Check-in, Backup, Ziel, Deload, Baseball,
  Körpergewicht unter „Hinweise“), „Andere Einheit“ (`dayPick`) + „Freies Training“; keine Einheitenliste, Erholung steht
  unter Fortschritt. Plan: Tage zum Aufklappen (`dayToggle`, `st.planOpen`, Standard offen = nächster Tag), Zyklus-Fenster
  (`cycleSheet`: Deload-Abstand, Deload jetzt, Check-in), „⋯“ = Plan verwalten (`planTools`), Volumen aufklappbar
  (`details.fold`). Einstellungen in Abschnitten (Training, Signale, Baseball-Tage, Studio-Gewichte, Profil, Daten).
  Training: Werkzeugleiste `.toolbar` (Satz, Tauschen, Später, Notiz, Mehr).
- Ansichten: Tab-Leiste Heute/Plan/Fortschritt/Übungen (Timer über Symbol oben auf „Heute“). Heute: Datum, „Moin, Name“
  (Name aus dem Fragebogen, nie fest im Code), Wochenleiste (erledigt = Haken, Baseball = Eisweiß-Rand, heute = weiße Kachel),
  Navy-Karte „Nächste Einheit“ mit Figur, 3 Mini-Kacheln, Kacheln Serie/Sätze/Rekorde, „Zuletzt“.
  Vor dem Training: Tagesform-Check (`SHEETS.time`, `tfDelta`) – Energie/Schlaf/Zeit wählen NUR unter den vorhandenen
  Längen −2…+2 von `timePlan`, keine eigene Trainingslogik. Training: Segment-Fortschritt (`.segbar`), Pause als Ring
  (`#restRing`, letzte 10 s Eisweiß) mit „Als Nächstes“. Abschluss: 4 Kennzahlen, Rekordkarte, Muskel-Balken,
  Bewertung 1–5 (`workout.rating`). Plan: Zyklus-Balken (`.cycbar`), Wochenliste (`weekList`). Übungen: Liste (`.exrow`).

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

Übungsbestand: 248 (Version 3.6 hat 75 ergänzt, Block „Erweiterung 3.6“ am Ende von `exercises.js`/`howto.js`/`map` in `figures.js`;
neue Figuren nutzen vorhandene Vorlagen). Prüfen: jede Übung braucht Eintrag in allen drei Dateien.
Bereits eingebaut: „Pistol Squat an Ringen“ (`ring-pistol`), „L-Sit an Ringen“ (`ring-lsit`), „Tuck L-Sit an Ringen“ (`ring-tuck-lsit`).
Eigene Übungen lassen sich auch direkt beim Tauschen/Wählen anlegen („Eigene Übung anlegen“, `customFrom`).
Reiter „Eigene“ in Übungen (`st.libTab = 'own'`): Bearbeiten (`cxEdit`, gleiche ID, Verlauf bleibt) und Löschen (`cxDelYes`):
aus allen Plänen nehmen (anderer Ort springt ein, sonst Platz weg), aus Favoriten; mit Verlauf nur `hidden: true`
(`E.allExercises` blendet aus, `getEx` findet sie weiter), ohne Verlauf ganz entfernen. Vorher `Backup.snapshot`.

## Trainingslogik
- Ziel Muskelaufbau, Reserve (RIR) bewusst 1–2 (Nutzerwunsch), siehe `RIR_PLAN` in `engine.js`.
- Der Nutzer spielt Baseball; Wochen-Check-in passt Volumen an. Spiel-/Trainingstage (`sportDays`) → Hinweis auf der
  Startseite, wenn heute/morgen Spieltag ist und der nächste Tag schwere Bein-/Überkopf-Grundübungen hat (`sportHint`).
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

## Formwerk (eigene App in `formwerk/`, Worker in `formwerk-worker/`)
Whoop-Alternative für die Garmin Vivoactive 5, Fokus Krafttraining. Erholung (HRV 50 %, Ruhepuls 25 %, Schlaf 25 % gegen die
eigene 30-Tage-Basis, Body Battery nur Anzeige), Belastung (Zonen-TRIMP aus Garmin-Aktivitäten), Muskel-Ermüdung aus Satzwerk,
Empfehlung (Baseball Di/Do, 2× Kraft/Woche, einstellbar). Keine medizinischen Aussagen.
- Rechnen nur im Worker: `formwerk-worker/src/model.js` (Formeln dort dokumentiert), Garmin-Auslesen tolerant in `normalize.js`,
  Endpunkte in `garmin.js` (aus Garmins offiziellem Python-Client, nicht raten). Nach Änderungen an `normalize.js`
  `NORM_VERSION` in `src/index.js` erhöhen (lädt Garmin einmal neu). Tests: `node formwerk-worker/test/model.test.js`.
- Worker: Cloudflare Workers Builds (Root `formwerk-worker/`, Name `formwerk`), Speicher Durable Object (SQLite, keine KV-ID nötig).
  Secrets `GARMIN_API_KEY`, `APP_PASSWORD` nur im Dashboard – nie ins Repo. Einrichtung: `formwerk-worker/EINRICHTEN.md`.
- Schnittstelle: `formwerk/SCHNITTSTELLE.md`. Satzwerk-Seite NUR in `formwerk-link.js` (Abgleich über Prüfsummen, Karte auf
  „Heute“, Fenster `SHEETS.formwerk`, Einstellungen → Daten). In `app.js` nur Aufrufe über `FW` (`FW.changed()` in
  `Store.saveWorkout/deleteWorkout`, `FW.init` in `boot`, `FW.card()` in `homeView`). Speicher `satzwerk.formwerk*`.
- App: Vanilla JS, Speicher nur `formwerk_…`. Deploy: `formwerk/*` (ohne `SCHNITTSTELLE.md`) nach `docs/formwerk/` kopieren,
  `CACHE` in `formwerk/sw.js` und `VERSION` in `formwerk/app.js` hochzählen. Ansicht bei 390/375 px prüfen.
