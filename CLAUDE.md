# Satzwerk – Hinweise für Claude

Trainings-PWA (Vanilla JS). Quellen im Repo-Root: `index.html`, `app.js`, `engine.js`,
`exercises.js`, `howto.js`, `figures.js`. `node pwa/build.js` baut nach `pwa/dist`, danach
`pwa/dist/*` nach `docs/` kopieren (GitHub Pages läuft aus `main:/docs`).
Achtung: `docs/toleranzen/`, `docs/stunden/`, `docs/kochwerk/`, `docs/formwerk/` und `docs/geldwerk/` gehören zu anderen Apps – nie löschen oder überschreiben
(also kein `rm -rf docs/*`). Bei jedem Release `CACHE` in `pwa/sw.js` hochzählen.

## Arbeitsregeln (Satzwerk)
- **Bauplan:** `docs/ROADMAP.md` (Etappen mit Prüfkriterien). Skill `satzwerk-etappe` („nächste Etappe“) arbeitet sie ab.
- **Jedes Update direkt live stellen** (Nutzerwunsch 12.11.2026, dauerhafte Freigabe): nach Build, Kopie nach `docs/` und
  Commit einen Pull Request nach `main` anlegen und sofort mergen – erst dann sieht der Nutzer es in der App auf dem iPhone.
  Danach den Arbeits-Branch für die nächste Arbeit wieder von `origin/main` starten.
- **Antworten kurz** (Nutzerwunsch 15.11.): nach einem Update Änderungen nicht ausführlich aufzählen – nur Wichtiges, Neues oder
  was er am iPhone tun muss.
- Wochenbericht: geplante Aufgabe „Satzwerk-Wochenbericht“ sonntags 17:55 Uhr (Nutzerwunsch: ca. 18 Uhr).
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
  (Schlüssel enthält `st.ev`, das jede Klick/Eingabe hochzählt). Die Trainingsseite springt nie von selbst (3.27.2: `renderOverlay` hält die Übungsliste `#wList` an ihrer Stelle); nach oben nur per Tipp auf „Als Nächstes“/Übungsname (`toFocus`). Trainingsleiste `.panel` kompakt ganz unten am Rand, Pausenleiste flach (3.27.3: Ring 64 px, eine Zeile Pause · Dauer · Als Nächstes; 3.27.5: Zeit ab 5 Zeichen kleiner (`b.long`), „von …“ dann ausgeblendet – Text berührt nie den Ring). Favoriten-Stern in der Übungsinfo rechts neben den Muskel-Chips (`.favbtn.inl`), nicht auf dem Bild.
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
- Pausen (3.15, Nutzerwunsch: 2 min war zu kurz, Kraftverlust): Grundübungen 3,5 min (Kraftziel 4), Ergänzung 2:45, Isolation 2,
  Rumpf 1,5, Skill 2,5 (`E.defaultRest`). Bei wenig Zeit nur Isolation/Rumpf kürzen. Pause lernt pro Übung (`learnRest` beim Abschluss,
  `profile.restAdj[exId] = {s, d}`, in `newEntry` addiert, max. 5 min): Wdh.-Einbruch ≥ 3 bzw. ≥ 25 % bei gleichem Gewicht → +30 s;
  regelmäßig ≥ 30 s länger pausiert ohne Verlust → echte Pause übernehmen. Timer ist Untergrenze: nach Ablauf normales Panel mit
  „+0:40“ und „Satz fertig“ (bis 15 min). Alte Pläne einmalig angehoben (`restV 3`, nur Werte auf altem Standard). Supersätze nur bei
  Übungen, die sich nicht stören.
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
   Füße, Geräteposition). **Ausrichtung prüfen (Nutzerwunsch 15.11.): Brustkorb, Ellbogen, Knie, Füße.**
   `node tools/figcheck.js <id>` muss 0 melden, dann `node tools/figcheck.js --sheet <datei.html> <id>` mit Playwright
   fotografieren und ansehen. Regeln: Knie beugt nur nach hinten, Ellbogen nur nach vorn, Zehen zur Schienbein-Vorderseite,
   Bauchlage/brustgestützt = Brust zum Polster/Boden, Rückenlage = Brust nach oben. Seit 3.14.5 wählt `figures.js` Knie
   und Füße bei Ziel-Füßen (`f`) automatisch anatomisch (außer Beugung > 140°, z. B. Tuck: Vorlage `ks` entscheidet,
   oder `kfree: true`). Echte Haltung zuerst: liegt die Person auf der Bank, kniet sie, stehen die Füße weit hinten?

Ab 3.14.4 mit Bestätigung (Nutzerwunsch 15.11.): Passt der Name (oder ein `alias`) einer eigenen Übung zu einer
eingebauten (`findBuiltin`), zeigt die App auf Heute die Karte „Neue feste Übung“ (`cxReadyCard`, auch im Wochenbericht)
mit allen Daten (Fenster `cxReady`: Bild, Muskeln, Geräte, Stufe, Ziel, Anleitung). „Bestätigen“ → `upgradeOne`
(Verlauf, alle Pläne, Favoriten, Notizen, Gewichtslisten umstellen, eigene Übung entfernen, vorher Sicherung).
„Passt nicht“ → `profile.cxNo[eigeneId] = festeId`; `tools/coach.js custom` listet sie dann wieder (`rejected`) zum Nachbessern.

Wo die eigenen Übungen zu finden sind:
- Zuerst (ab 3.14): Sicherung im Formwerk-Worker (`GET /v1/backup/satzwerk`) → `node tools/coach.js custom <datei>` listet
  noch nicht eingebaute eigene Übungen. Die Sonntags-Aufgabe (Skill `satzwerk-wochenbericht`) macht das jede Woche automatisch.
- Eigene Übungen haben das Feld „Gerät & Hinweise“ (`ex.info`, z. B. Hersteller/Modell/Winkel). Vor dem Einbau danach recherchieren
  (WebSearch), was genau gemeint ist (Nutzerwunsch 15.11.).
- Die installierte App (GitHub Pages) speichert nur lokal auf dem iPhone – dort nicht lesbar.
  Der Nutzer schickt sie über den Knopf „An Claude schicken“ (im Info-Fenster der eigenen Übung)
  als Text in den Chat, oder nennt sie im Chat.
- Artifact-Version: `ArtifactData` → `data/users/me/profile`, Feld `custom`
  (Artifact https://claude.ai/artifact/9rhKGs5pYvdeqRx7ymim9L).
- Wenn nichts davon vorliegt: den Nutzer kurz fragen, ob er neue Übungen angelegt hat.

Übungsbestand: 250 (Version 3.6 hat 75 ergänzt, Block „Erweiterung 3.6“ am Ende von `exercises.js`/`howto.js`/`map` in `figures.js`;
neue Figuren nutzen vorhandene Vorlagen). Prüfen: jede Übung braucht Eintrag in allen drei Dateien.
Bereits eingebaut: „Pistol Squat an Ringen“ (`ring-pistol`), „L-Sit an Ringen“ (`ring-lsit`), „Tuck L-Sit an Ringen“ (`ring-tuck-lsit`),
„Hohes Rudern an der Maschine (brustgestützt)“ (`machine-high-row`, gym80 High Row; Block „Eigene Übungen des Nutzers“ am Ende von
`exercises.js`/`howto.js`), „Beinpresse einbeinig im sitzen“ (`leg-press-single`, gym80, Figur `legpress1`). Namen nie doppelt (vorher prüfen); den Namen des Nutzers als `alias`, sinnvollen Namen als `name`.
Eigene Übungen lassen sich auch direkt beim Tauschen/Wählen anlegen („Eigene Übung anlegen“, `customFrom`).
Reiter „Eigene“ in Übungen (`st.libTab = 'own'`): Bearbeiten (`cxEdit`, gleiche ID, Verlauf bleibt) und Löschen (`cxDelYes`):
aus allen Plänen nehmen (anderer Ort springt ein, sonst Platz weg), aus Favoriten; mit Verlauf nur `hidden: true`
(`E.allExercises` blendet aus, `getEx` findet sie weiter), ohne Verlauf ganz entfernen. Vorher `Backup.snapshot`.

## Trainingslogik
- Tagesanpassung aus Formwerk (3.23, Nutzerwunsch 19.11.: Körperzustand nur noch in Formwerk eingeben, Satzwerk fragt nicht mehr):
  `FW.fetchReadiness()`/`FW.readyData()` (Worker `GET /v1/readiness`, Cache `satzwerk.formwerkReady`, 5 min) → `E.adjustDay(day, loc, profile, plan, rd, {only})`
  (Regeln im Kommentar dort: Schmerz/Muskelkater stark ersetzen oder streichen, leicht −1, mittel −1/−2 + Gewicht −10 % `presc.loadF`, gestern Baseball (3.27.6: nur mit Schmerz oder Muskelkater an Schultern/Armen/Beinen, `E.bbHurt`, wie Worker `bbRelevant`; ebenso `sportHint` mit Formwerk),
  Erholung rot −30 %/gelb ohne Steigerung `presc.noUp`). `dayAdjust` in app.js; Zeilen über der Übung (`.adjline`, `entry.adj`) auf Einheit-Seite,
  im Startfenster (`SHEETS.time`, nur noch „Zeit“) und im Training. `planDiff` wertet Tagesanpassungen nicht als Planänderung (`adjRemoved`, `adjEx`).
  Auf Heute steht Formwerk nur noch als eine Zeile in der „Nächste Einheit“-Kachel (`fwBox`, Erholung · Titel · Änderungen/Gut heute, Tipp öffnet das Formwerk-Fenster) – keine eigene Karte oben mehr (3.24.2).
  Wochen-Check-in nur ohne Formwerk. Platz unten im Training = Höhe der Leiste (`--rbh`). Tests: `node tools/engine.test.js`.
- Automatische Progression (3.24, Auftrag 19.11.): Doppelprogression mit festen Stufen (`progStep`: Langhantel +2,5 kg Oberkörper / +5 kg
  Unterkörper, sonst kleinste Stufe; Wdh. zurück ans untere Ende, `rec.up`). Sätze je Muskel (`learnVolume`): +1 bei 2 guten Wochen
  (`fw.weeks`, Worker 2.8) und steigender Leistung, −1 bei oft gelb/rot (≥ 4 Tage), Grenzen 10–20. Leichtere Woche −40 % Sätze (`prescription`),
  ausgelöst durch Stillstand (`E.stalled`: 3 Einheiten ohne Bestwert) in `deloadNeeded` oder spätestens alle 6 Wochen (`meso.len` einmalig
  auf 6, alter Wert `meso.lenOld`, `mesoV 2`); `plan.deloadFrom` = späterer Start. Schalter Einstellungen → Anpassungen: `settings.adjMode`
  `'confirm'` (Standard: Tagesanpassung mit Haken im Startfenster `acc`, Steigerung per Knopf `upOk`, Wochen-Volumen `learn.pending` →
  `volAccept`/`volReject`, Deload-Karte) / `'auto'` (alles ohne Nachfrage, Deload automatisch beim Start).
- Mitteilung im Training (3.25 / Worker 2.10, Nutzerwunsch 19.11.: Sperrbildschirm, echte Live-Aktivität geht für Web-Apps nicht): Web-Push ohne Nutzlast.
  Worker erzeugt das VAPID-Paar selbst (`vapid` im Durable Object, `push.js`), `/v1/push/key|subscribe|off`, `POST /v1/live {title, body, restEnd, endTitle, endBody}`
  (sofort Push + Alarm zum Pausenende), `GET /v1/live/state?t=<Token>` ohne Passwort (Token `push:token`). `pwa/sw.js`: `push` holt den Text, `showNotification`
  mit `tag: 'satzwerk-live'` (ersetzt die vorige), Zugang im Cache `live-cfg`. App: `liveSend()` bei Pausenstart/-Stopp/-Änderung, Trainingsstart, Ende;
  `FW.liveEnable()` nur auf Tipp (Schalter `settings.live` unter Einstellungen → Signale, nur mit Formwerk). Tests: `node tools/sw-push.test.js`, Worker-Test „Mitteilung im Training“.
- Startfenster „Dein Training heute“ (3.26, Nutzerwunsch 24.11.): `startCalc(s)` = Tagesanpassung → bestätigte Vorschläge (`setSuggestions`: Wochenvolumen je Muskel =
  diese Woche + heute + offene Plan-Tage gegen `volTargets`; ≥ 2 darunter → +1 Satz, ≥ 3 darüber → −1, höchstens 4, antippen = übernehmen, im Modus „auto“ vorgewählt)
  → eigene Satz-Änderungen (−/+ je Übung, `s.dm`) → Zeit kürzer/länger. Dauer = `trainTime` (Satzzeit `setWorkSec` + Pausen + Aufwärmen), gleiche Rechnung in `estMinutes`
  (Heute-Kachel, Einheit-Seite). Änderungen gelten nur für heute; `tfGo` übergibt den gerechneten Tag an `startWorkout`.
- Dropsatz/Myo-Reps (3.28, Nutzerwunsch 24.11.: Volumen reinholen, Kraft bleibt Priorität): `setSuggestions` schlägt höchstens 2 vor – nur Isolation/Rumpf,
  Muskel ≥ 3 Sätze unter Ziel (nach +1-Vorschlägen), Erholung nicht gelb/rot/krank, kein Muskelkater an der Gruppe, kein Schmerz passend zu `inj`, keine leichtere Woche.
  Last-Übung = Dropsatz, sonst Myo-Reps. Antippen → `slot.tech` → `entry.tech` + Zeile `TECH_TXT` über der Übung; gespeichert `workout.exercises[].tech` (Zusatzfeld);
  `E.weeklyMuscleSets` zählt so eine Übung +0,5 Satz. Grundübungen nie.
- Steigerungstempo je Übung (3.27, Nutzerwunsch 24.11.): `E.progProfile(ex, hist, rr, bw)` → `speed` fast/normal/slow (Rate %/Woche der besten Satzleistung,
  geklappte/gescheiterte Gewichtssteigerungen, Einheiten bis wieder oben; < 3 Einheiten = normal). In `recommendCore` (Doppelprogression): schnell = doppelte Stufe
  (max. +10 %) bzw. +2 Wdh., langsam = erst nach 2× Obergrenze steigern. Anzeige in der Übungsinfo („Dein Tempo“), Stand je Übung in `profile.prog[exId]` (nach jedem Training).
- Wochenbericht auffälliger (3.27 / Worker 2.11): ungelesen = Navy-Karte mit „Neu“ ganz oben auf Heute (`coachUnseen`, bis geöffnet; 3.27.1); im Training springt die Seite beim Antippen einer Übung nicht mehr nach oben; neuer Bericht per `PUT /v1/coach` → Mitteilung „Dein Wochenbericht ist da“
  (gleiches Abo wie die Training-Mitteilung, nicht während eines laufenden Trainings, nur einmal je Bericht).
- Im Training sind erledigte Übungen antippbar (`a.pin`, bleibt offen bis zum nächsten Satz; Panel-Knopf „Nächste Übung“ = `nextOpen`) (3.26.1).
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

## Weitere Apps im Repo (eigene CLAUDE.md in ihrem Ordner, lädt nur dort)
- `kochwerk/` – Abnehm-App Kochwerk: Regeln in `kochwerk/CLAUDE.md`. Satzwerk dafür nie anfassen, Speicher nur mit Präfix `kochwerk_`.
- `geldwerk/` – Steuer-Sammler, Verträge, Belege: Regeln in `geldwerk/CLAUDE.md`. Satzwerk dafür nie anfassen, Speicher nur `geldwerk_` / IndexedDB `geldwerk`.
- `formwerk/` und `formwerk-worker/` – Whoop-Alternative Formwerk: Regeln in `formwerk/CLAUDE.md`, offene Schritte in `formwerk/OFFEN.md` (zuerst lesen, Nutzer erinnern).

## Sparregeln (gelten immer)
- Große Dateien nie komplett lesen: erst `grep -n`, dann gezielt Zeilenbereiche. Dieselbe Datei nicht mehrfach lesen.
- Suche über viele Dateien an den Explore-Subagenten geben (läuft auf Haiku), nur das Ergebnis übernehmen.
- Test- und Build-Ausgaben gekürzt holen (`| tail -30`, nur Fehlerzeilen), nie komplette Logs.
- Plan höchstens 15 Zeilen, ohne fertigen Code; dann auf OK warten.
- Nach Abschluss nur das Wichtigste melden, keinen Diff wiederholen.
- Wenn eine Aufgabe Routine ist (Texte, Inhalte, kleine UI-Änderung), vorschlagen, sie mit Sonnet statt Opus zu machen.
- Neues Thema = neue Sitzung empfehlen statt im vollen Kontext weiterzuarbeiten.
