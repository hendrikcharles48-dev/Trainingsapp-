# Kochwerk – Hinweise für Claude (Ordner `kochwerk/`)

Wird nur geladen, wenn in diesem Ordner gearbeitet wird. Allgemeine Satzwerk-Regeln stehen in der CLAUDE.md im Repo-Wurzelordner.
Wichtig beim Deploy: `CLAUDE.md` nie nach `docs/kochwerk/` kopieren.

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
