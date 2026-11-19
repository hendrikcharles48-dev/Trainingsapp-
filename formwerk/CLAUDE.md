# Formwerk – Hinweise für Claude (Ordner `formwerk/` und `formwerk-worker/`)

Wird nur geladen, wenn in diesem Ordner gearbeitet wird. Allgemeine Satzwerk-Regeln stehen in der CLAUDE.md im Repo-Wurzelordner.
Wichtig beim Deploy: `CLAUDE.md` nie nach `docs/formwerk/` kopieren.

**Offene Schritte (Einrichtung Cloudflare/Garmin, Anpassung an echte Daten): `formwerk/OFFEN.md` – zuerst lesen und den Nutzer erinnern.**
Whoop-Alternative für die Garmin Vivoactive 5, Fokus Krafttraining. Erholung (HRV 50 %, Ruhepuls 25 %, Schlaf 25 % gegen die
eigene 30-Tage-Basis, Body Battery nur Anzeige), Belastung (Zonen-TRIMP aus Garmin-Aktivitäten), Muskel-Ermüdung aus Satzwerk,
Empfehlung (Baseball-Zeiten einstellbar, 2× Kraft/Woche). Keine medizinischen Aussagen.
- Rechnen nur im Worker: `formwerk-worker/src/model.js` (Formeln dort dokumentiert), Garmin-Auslesen tolerant in `normalize.js`,
  Endpunkte in `garmin.js` (aus Garmins offiziellem Python-Client, nicht raten). Nach Änderungen an `normalize.js`
  `NORM_VERSION` in `src/index.js` erhöhen (lädt Garmin einmal neu). Tests: `node formwerk-worker/test/model.test.js`.
- Worker: Cloudflare Workers Builds (Root `formwerk-worker/`, Name `formwerk`), Speicher Durable Object (SQLite, keine KV-ID nötig).
  Secrets `GARMIN_API_KEY`, `APP_PASSWORD` nur im Dashboard – nie ins Repo. Einrichtung: `formwerk-worker/EINRICHTEN.md`.
- Schnittstelle: `formwerk/SCHNITTSTELLE.md`. Satzwerk-Seite NUR in `formwerk-link.js` (Abgleich über Prüfsummen, Karte auf
  „Heute“, Fenster `SHEETS.formwerk`, Einstellungen → Daten). In `app.js` nur Aufrufe über `FW` (`FW.changed()` in
  `Store.saveWorkout/deleteWorkout`, `FW.init` in `boot`, `FW.card()` in `homeView`). Speicher `satzwerk.formwerk*`.
- Körpergewicht (Satzwerk 3.11): Eingabe nur in Formwerk (Worker `w:<Datum>`, Garmin-Gewicht `gKg`), Satzwerk übernimmt per
  `syncWeight` in `bwLog` (nur ergänzen) und blendet seine Gewichtseingabe aus, solange Formwerk verbunden ist (`FW.configured()`).
- Automatische Sicherung: ohne GitHub-Zugang sichert Satzwerk über den Worker (`Cloud.cfg()` → `{worker:true}`, `Cloud.where()`,
  `FW.backupPut/backupGet`, Worker `bk:satzwerk` mit zwei Fassungen). Ausschalten setzt `cloudState.wOff`.
- Körpergefühl (Formwerk 1.2/Worker 1.3, ab Worker 1.8 Skala 1–5 für beides, Nutzerwunsch): Morgen-Check `c:<Datum>` (`v: 5`; ältere
  Einträge mit 1–2/1–3 rechnet `normCheckin` beim Lesen um, gespeichert bleibt alles), `bb` Baseball gestern,
  `partial` = nur Baseball-Frage). Stufe 1 `applySoreness`/`applyPain` (Schmerz ab 2 schonen, ab 4 Pause, ≥ 2 an 3 von 5 Tagen → „abklären lassen“, keine Diagnose),
  Stufe 2 `calibrate` (Faktor je Gruppe für Kraft `s` und Baseball `b`, ab 4 Tagen, 0,6–1,8), Stufe 3 `insights` (Muster 6 Wochen,
  gute Kraft-Tage). Satzwerk: `FW.painHint(ex)` im Training über `ex.inj`.
- Baseball (Nutzerwunsch 15.11.): feste Zeiten in Mehr (`settings.sportDays` + `sportTimes[tag] = {from, dur, since}`) zählen ab `since`
  automatisch (`baseballDay`/`withCheckinBaseball`), abwählbar über „Heute Baseball“ (`bbToday:false`) bzw. am Morgen danach „Gestern Baseball“
  (`bb:false`). Ohne feste Zeiten: antippen. Uhr-Aktivität zählt immer (Schalter dann fest „(Uhr)“). Standard: keine festen Zeiten.
- Signale (Worker 1.6): `physio` – Stresszeichen heute (Atemfrequenz/SpO2 aus dem Schlaf, Ruhepuls, HRV gegen Basis → „Locker bleiben“,
  keine Diagnose) und Deload-Melder (7 Tage: HRV, Ruhepuls, Erholung, Morgen-Checks; ab 2 Zeichen). `prefillFor` liefert Vorschläge.
- Wochenbericht (Satzwerk 3.14, Worker 1.7): geplante Aufgabe sonntags → Skill `satzwerk-wochenbericht` → `tools/coach.js`
  (`facts`/`check`/`custom`, lädt engine.js in Node) → `PUT /v1/coach` (Worker `coach` + `coachPrev`). Satzwerk holt `GET /v1/coach`
  (`FW.coach()`, `refreshCoach`, höchstens alle 3 h, Speicher `satzwerk.formwerkCoach`), Karte `coachCard()` auf Heute (bis „Gelesen“)
  und unter Fortschritt, Fenster `SHEETS.coach`. Aktionen `swap|sets|rr|deload` nur per Tipp (`coachYes`, vorher
  `Backup.snapshot('vor-wochenbericht')`, Plan wird `edited`), Antworten in `profile.coachDone[id] = {seen, closed, a:{id:'ok'|'no'}}`.
- Satzwerk nutzt Formwerk (3.13, nur Vorschläge, Nutzer bestätigt): Tagesform-Fenster vorausgefüllt (`FW.tfPrefill`, Hinweis „Vorausgefüllt
  aus Formwerk“), Wochen-Check-in vorausgefüllt (`FW.weekPrefill`, nur „diff“ bleibt offen), `deloadNeeded` = Leistung ODER Formwerk-Signale
  (2 Zeichen oder 1 + fallende Leistung), Baseball-Tage aus Formwerk (`sportDaysEff()`, `FW.plan().baseballToday`), gute Kraft-Tage in der
  Wochenleiste (`.wd.good`). Ohne Formwerk alles wie vorher.
- Bereit-Training (Satzwerk 3.16, Worker 2.4, Nutzerwunsch 18.11.): `/v1/today` liefert `muscles` (Status je Gruppe + Muskel-Schlüssel `m`),
  `FW.readiness()` → `{muscles (müde), partial, inj (Schmerz ≥ 2)}`. `E.readyDay(day, loc, profile, plan, block, plans)` ersetzt Übungen mit müdem
  Hauptmuskel durch Übungen für bereite Muskeln (gleiche Rolle/Sätze; Favoriten +8, aus eigenen Plänen +3, wenig Wochensätze bevorzugt), Plan bleibt
  unverändert. Heute-Karte zeigt Hinweis, Tagesform-Fenster Auswahl „Für heute empfohlen“/„Dein Plan“ (`s.mode`), „Andere Einheit“ zeigt „x von y bereit“.
  Zählt nur als Plan-Tag, wenn ≥ Hälfte der Übungen bleibt (sonst `dayIdx: null`, Tag bleibt dran). Ort Zuhause/Studio bleibt gespeichert (`settings.homeLoc`).
- Pläne pro Ort (Satzwerk 3.18, Nutzerwunsch 18.11.): `plan.place` `'home'|'gym'` (ohne = alter Plan für beide Orte, `locs` beide),
  `profile.planBy = {home, gym}` = aktiver Plan je Ort; `profile.plan/planId` = Plan des gewählten Orts (`curLoc()`). Schalter Zuhause/Studio
  (`switchLoc`) wechselt Ort UND Plan (Heute, Plan, „Andere Einheit“). Neue Pläne/Vorlagen/Kopien bekommen den aktuellen Ort (`onlyLoc`).
  Pläne-Fenster nach Ort gruppiert („Neuer Plan für …“ = `planNewAt`), Plan-Menü „Gilt für“ (`planPlace`) und Aufteilen (`splitPlan`:
  zwei Pläne „… Zuhause“/„… Studio“, alter bleibt, vorher Sicherung `vor-aufteilen`). Karte `splitCard` bis `seen.splitAsk`; kein Plan für den
  Ort → `noPlanCard`. Plan übernehmen/Bereit-Training wirken nur auf den Plan des Orts.
- Volumen lernen (Satzwerk 3.19 / Worker 2.5, Nutzerwunsch 18.11.: Regeneration ist sein Engpass, trainiert zurzeit nur im Studio):
  `/v1/today.vol` = `volumeSignals` (rec7/rec28, Muskelkater 1–2 Tage nach jeder Einheit je Gruppe `sore`/`soreN`, Schmerz 14 Tage), `FW.volSignals()`.
  `E.learnVolume(plan, profile, {workouts, fw})` → Ziel je Muskel (`plan.learn.T`, Regeln im Kommentar dort; bei viel Muskelkater/knapper Erholung
  nie über das jetzige Plan-Volumen) + Reserve je Plan (`plan.learn.rir` 0/1, in `prescription` addiert). `volTargets(profile, plan)` nimmt `learn.T`.
  `weeklyLearn()` (4 s nach dem Start, einmal pro Woche `learn.wk`, aktive Pläne je Ort, nicht im Deload, `learn.auto !== false`):
  `learnPlan` → `balancePlan(plan, profile, Ts, 1, {maxNew: 1})` mit Schritt-Zielen (±2 zum jetzigen Volumen), Sicherung `vor-volumen`,
  `learn.last {ch, undo}` → Karte `volLastCard` (OK/Warum?/Rückgängig). Neuer Plan startet mit dem Durchschnitt (`avgLearn`).
  Plan-Ansicht unten: Karte „Volumen & Erholung“ (`volumeCard`: Ziel je Muskel + Begründung, Schalter, „Plan ausbalancieren“, „Neu berechnen“).
  Tipp auf einen Plan in „Pläne“ öffnet ihn (`planGo`); Umbenennen/Ort/Kopieren/Löschen über „⋯“ → „Diesen Plan bearbeiten“.
- Einheit als eigene Seite (Satzwerk 3.20, Nutzerwunsch 18.11.): Planübersicht listet Einheiten (`dayOpen` → `st.planDay` = Tag-ID,
  `dayView`: Zurück `dayBack`, Start, Übungen, unten `dayVolCard`). Ziel der Einheit = Wochenziel × Anteil ihrer Sätze (`dayTargets`;
  kein Tag trainiert den Muskel → gleichmäßig). „Einheit ausbalancieren“ (`balanceDay`, Vorschau, ändert nur diese Einheit).
  Automatik je Einheit (`day.noAuto`); Wochenlauf gleicht nur Einheiten ohne `noAuto` an (Ziele minus Volumen der anderen).
  Plan-Tab erneut antippen, Plan- oder Ortswechsel → zurück zur Übersicht.
- Volumen mit dem Wochenbericht (Satzwerk 3.21, Worker 2.6, Nutzerwunsch 18.11.): `weeklyLearn` läuft, wenn ein neuer Bericht da ist
  (`FW.coach().id` ≠ `learn.rep`, Bericht < 4 Tage alt) → Ziele für die NÄCHSTE Woche (`learn.wk` = Woche, für die angepasst wurde);
  ohne Bericht ab Dienstag als Ersatz. Änderungen im Bericht-Fenster („Volumen für nächste Woche“, `volReport`, Rückgängig/Warum?),
  Karte auf Heute nur noch ohne Bericht. Auch über `FW.init onChange` angestoßen. Worker-Zusammenfassung enthält `vol`;
  `tools/coach.js facts` → `volume` (gleiche Rechnung), Skill erklärt es im Text, keine eigenen `sets`-Vorschläge bei Automatik.
  Untergrenze 6 nur beim Senken von oben; gesenkte Ziele steigen ohne Kraftdaten bei wenig Muskelkater + guter Erholung um 1 pro Woche.
- Wischen vom linken Rand (≤ 28 px, > 80 px nach rechts) = `goBack()`: Fenster schließen → Training minimieren → Fragebogen zurück →
  Einheit-Seite → Übersicht. Pfeil `#edgeBack` zeigt es an.
- Training → Plan übernehmen (Satzwerk 3.17, Nutzerwunsch 18.11.): `planDiff(active)` vergleicht mit dem Plan-Tag (nur Plan-Trainings,
  nicht frei/angepasst): Getauscht, Neu (`tpx` = von „länger“ ergänzt, zählt nicht), Raus, Sätze, Reihenfolge. Fenster `finish` zeigt die Liste,
  „Speichern & Plan übernehmen“ (`finishAdopt`, vorher `Backup.snapshot('vor-plan-anpassen')`). Deload/Tagesform-Länge: keine Sätze/Raus.
  Nur der Ort des Trainings ändert sich: geteilte Plätze werden vor Satz-/Reihenfolge-Änderung abgetrennt (`own`).
- Fehlende Nacht (16.11. geprüft: Synchronisierung lief, Uhr maß 0–7 Uhr nichts): `sleepView` liefert `reason` (`notWorn` = Garmin bis
  nach 6 Uhr synchronisiert und ≥ 3 h ohne Messung laut `stress.uncategorizedDurationInMillis`, `noSleep`, `notSynced`); Formwerk erklärt das.
- Nacht ohne Messung (Nutzerwunsch 16.11.): Ruhepuls zählt nur mit Nachtdaten (`rhrValid`, sonst Tageswert – auch nicht für die Basis).
  `recovery(days, date, {ck, settled})` schätzt dann (`estimateRecovery`: letzte ≤ 3 gemessene Tage 3:2:1, mit eigener Schlafangabe
  `checkin.sleepEst {h, q}` 60/40), `estimated: true` → Ring „geschätzt“, Karte „Nacht ohne Messung“ mit Schlafangabe (`nightSet`).
- Sonderfälle (Worker 2.0 / Formwerk 1.8, Nutzerwunsch 16.11.): Teilnacht (`sleepView.reason 'partial'`: < 80 % Schlaf + ≥ 90 min ohne Messung →
  Garmin-Schlaf zählt nicht, eigene Angabe schon), krank (`checkin.sick` → „Krank – Pause“, Tag aus der Basis; Basis kappt Ausreißer
  `trimOut` mit Mindeststreuung), Wiedereinstieg nach ≥ 10 Tagen ohne Kraft (`applyLife`), Krafttraining nur auf der Uhr (`sportKind
  'strength'`, nicht doppelt mit Satzwerk ± 3 h, nicht im Lernen), Baseball-Rückfrage am Morgen (`body.askBaseball`), Schlüssel abgelaufen
  (`status.errorKind 'key'` mit Anleitung), Uhr > 14 h nicht synchronisiert (`vitals.watchLast`).
- Baseball am Puls (Worker 2.1, Nutzerwunsch 16.11.): feste Zeiten → nach dem Termin `dailyHeartRate` holen, `detectBaseball` (Fenster ≥ 40 %
  getragen; ja: Schnitt ≥ Ruhe+35 und ≥ 30 % über Ruhe+40, oder ≥ 20 % über Ruhe+50, oder gelernt aus bestätigten Tagen; nein: Schnitt
  < Ruhe+22; dazwischen unbekannt → Rückfrage; an echtem Alltag geprüft: max. Schnitt Ruhe+29), Ergebnis im Worker `bbauto`, in `S.autoBB`. Vorrang: Uhr-Aktivität >
  Antwort > Puls > Termin. Nicht getragen → Termin zählt + Rückfrage.
- Abrufe (Worker 2.2): Cron `40 4,5 * * *` (≈ 5:40/6:40) und `0 6,7 * * *` (8:00 deutscher Zeit, nur der Lauf mit lokal 8 Uhr, Sommer/Winter) in `wrangler.jsonc`.
- Fenster in Formwerk: `openSheet` sperrt die Seite (`html.sheet-open`), nur das Fenster scrollt (`max-height: calc(100% - 40px)`, nicht vh).
- App: Vanilla JS, Speicher nur `formwerk_…`. Deploy: `formwerk/*` (ohne `SCHNITTSTELLE.md`, `OFFEN.md`) nach `docs/formwerk/` kopieren,
  `CACHE` in `formwerk/sw.js` und `VERSION` in `formwerk/app.js` hochzählen. Ansicht bei 390/375 px prüfen.
