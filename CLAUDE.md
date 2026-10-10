# Satzwerk – Hinweise für Claude

Trainings-PWA (Vanilla JS). Quellen im Repo-Root: `index.html`, `app.js`, `engine.js`,
`exercises.js`, `howto.js`, `figures.js`. `node pwa/build.js` baut nach `pwa/dist`, danach
`pwa/dist/*` nach `docs/` kopieren (GitHub Pages läuft aus `main:/docs`).
Achtung: `docs/toleranzen/` gehört zu einer anderen App – nie löschen oder überschreiben
(also kein `rm -rf docs/*`). Bei jedem Release `CACHE` in `pwa/sw.js` hochzählen.

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
