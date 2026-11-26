# Geldwerk – eigene Entscheidungen

Kurz festgehalten, was ich ohne Rückfrage entschieden habe (Leitlinie: wenig Arbeit für Hendrik, übersichtlich, kostenlos).

1. **Texterkennung und PDF-Leser liegen im Repository** (`vendor/`: Tesseract.js 6 mit deutschem LSTM-Modell, pdf.js 4.10)
   statt von einem CDN. Grund: kein fremder Dienst sieht die Belege, und offline geht es auch. Nur die SIMD-Variante
   des Tesseract-Kerns (iPhone 16 / iOS 18 kann SIMD) – spart 4 MB.
2. **Kein Tesseract-Speicher in IndexedDB** (`cacheMethod: 'none'`): Tesseract würde sonst eine fremde Datenbank
   „keyval-store“ auf der gemeinsamen Adresse anlegen. Stattdessen eigener Cache `geldwerk-vendor-1` im Service Worker.
3. **Eigener PDF-Schreiber** (`mappe.js`, ~150 Zeilen) statt einer PDF-Bibliothek: Text in Helvetica + JPEG-Fotos reichen für
   die Steuermappe. PDF-Rechnungen werden beim Erfassen als Seitenbilder abgelegt und so in die Mappe übernommen; das
   Original-PDF liegt zusätzlich in der Sicherung.
4. **Push über den bestehenden Formwerk-Worker** (neue Endpunkte `/v1/gw/…`, Version 2.12) statt eines neuen Workers:
   gleicher Zugang, gleicher VAPID-Schlüssel, täglicher 8-Uhr-Lauf existiert schon. Gespeichert wird nur Datum + Titel
   (max. 90 Zeichen, keine Beträge – Test prüft das).
5. **Zugänge werden still übernommen**, wenn die Apps denselben Speicher sehen: Worker-Passwort aus Formwerk/Satzwerk,
   GitHub-Schlüssel aus Kochwerk/Satzwerk – aber nur, wenn derselbe Schlüssel auch für `Geldwerk-Daten` gilt (wird geprüft).
   Auf dem iPhone haben Home-Bildschirm-Apps oft getrennte Speicher; dann einmal eintragen.
6. **Urlaubstage pauschal** (Vorbelegung 17 = 30 Tage anteilig für Jan–Jul) statt jeden Tag im Kalender: eine Zahl statt
   17 Tipps. Kranktage einzeln im Kalender, weil selten.
7. **Fahrten zum Minijob zählen nicht** (pauschal versteuert → keine Werbungskosten). An Tagen mit Schule und Minijob
   zählt nur der Weg zur Schule. Minijob-Tage stehen nur zur Übersicht im Kalender („·J“).
8. **Ferien gelten für die Technikakademie** wie für alle Schulen in Niedersachsen (Fachschule an einer BBS). Weicht der
   Stundenplan ab: Tag im Kalender antippen.
9. **Beruflicher Anteil bei Computer/Software 50 %** vorbelegt (Annahme, sichtbar „ungeprüft“), alle anderen Kategorien 100 %.
   Ein Tipp auf „100 %“ ändert es.
10. **Steuerjahr = Jahr der Zahlung** (Belegdatum). Teure Arbeitsmittel über 952 € (außer Computer/Software) werden über
    die Nutzungsdauer verteilt (Vorbelegung 3 Jahre, ungeprüft, ohne Monats-Anteil).
11. **Spanne der Schätzung**: unten ohne ungeprüfte Posten (Kontoführung, Telefon, Tagespauschale) und ohne noch zu
    prüfende Belege; fehlt die Sozialversicherung, wird sie mit 21,75 % ± 10 % geschätzt.
12. **Tarif 2027 = Tarif 2026, sichtbar „ungeprüft“** – der Tarif 2027 war bei der Recherche noch nicht Gesetz.
13. **Zeilennummern im ELSTER-Spickzettel: keine** – für 2026 nicht geprüft. Es stehen die Bereichsnamen aus „Mein ELSTER“.
14. **„Zu erledigen“ zeigt Kündigungsfristen ab 30 Tagen vorher**, Rückgaben ab 7 Tagen, Gewährleistung ab 30 Tagen.
    Verträge, die jederzeit kündbar sind, erzeugen keine Frist-Meldung. Erledigtes lässt sich wegtippen.
15. **Übersicht/Steuer zeigen bis Ende Juli das Vorjahr**, solange dessen Erklärung nicht als abgegeben markiert ist
    (Lohnsteuerbescheinigung kommt im Februar, Frist 31.07.).
16. **Oberflächen-Prüfung mit Chromium im iPhone-Format** (390 × 844, Touch, iOS-Kennung): WebKit ließ sich in der
    Prüfumgebung nicht herunterladen. Getestet wird trotzdem jeder Bildschirm automatisch auf zu kleine Tippflächen,
    abgeschnittene Texte, waagerechtes Scrollen und Verdecken durch die Tab-Leiste.
17. **Systemschrift** (SF Pro auf dem iPhone) statt Inter von Google Fonts – wirkt nativer und lädt nichts von außen.
18. **Sicherung bündelt** Änderungen 8 s, beim Verlassen der App sofort; Fotos werden genau einmal hochgeladen.

## Version 1.1 (26.11.2026, Design-Wunsch mit Vorlagen)
19. **Kein Zoomen:** `maximum-scale=1, user-scalable=no`, `touch-action: manipulation` (kein Doppeltipp-Zoom) und
    Abfangen der iOS-Gesten (`gesturestart`) gegen Zwei-Finger-Zoom. Eingabefelder bleiben ≥ 16 px (sonst zoomt iOS beim Tippen).
20. **Look aus den Vorlagen, Farben aus Geldwerk:** Karten wie Bankkarten (Tiefblau mit dunklerer Wellenform und dünner
    Eisblau-Linie statt Orange), runde Symbol-Kacheln für Kategorien/Verträge wie bei Umsätzen, Schnellaktionen-Reihe,
    Begrüßung mit Datum, Wert-Pille über dem gewählten Punkt. Dunkel bleibt, keine Verläufe, Grün nur für Geld zurück.
21. **Diagramme nur in einer Farbe** (Eisblau, gedämpfte Balken #557AA6 mit 4:1 Kontrast) und als Balken/Linie statt
    Torte – Längen sind leichter zu vergleichen, und nichts wird bunt. Auswahl per Tipp, auf der Übersicht auch per Wischen.
22. **Aus vergleichbaren Apps übernommen** (WISO, Taxfix, Finanzguru): Erstattung live mit Spanne, Checkliste „Bereit für
    die Erklärung“, Fixkosten nach Art, Preiserhöhungen, Suche über Belege und Verträge, Warnung bei doppeltem Beleg,
    mehrseitige Belege, Belegliste als CSV. Bewusst nicht: Bankanbindung, E-Mail-Import (bräuchte einen Server).

## Version 1.2 (26.11.2026, heller und einladender)
23. **Hell als Grundstil, dunkel automatisch:** folgt der iPhone-Einstellung; Einstellungen → Darstellung: Automatisch / Hell /
    Dunkel (nur auf dem Gerät, `geldwerk_theme`). Alle Farben als Variablen in `style.css`, Diagramme über CSS-Klassen
    (Safari kennt keine Variablen in SVG-Attributen).
24. **Farbwelt aus den Vorlagen:** Indigo statt Eisblau, weiße Karten mit weichem Schatten, Bankkarte in kräftigem Indigo mit
    orangem Schmuck-Fleck (Orange nur als Schmuck und Hinweis-Pille), runde Systemschrift (SF Rounded) für Titel und Zahlen.
    Kontraste geprüft: Indigo 5,8:1 auf Weiß, Grau-Text 4,9:1, Grün 4,6:1; dunkel Indigo 5,7:1.
25. **Statusleiste „default“** statt durchsichtig: sonst wäre die Uhrzeit im hellen Modus weiß auf hell. Gilt ab dem nächsten
    Hinzufügen zum Home-Bildschirm.

## Version 1.3 (26.11.2026, Farben mit Bedeutung)
26. **Farbe nur dort, wo sie etwas sagt.** Drei Bereichsfarben (vom dataviz-Prüfskript freigegeben, alle Paare, hell und dunkel:
    Farbschwäche ΔE ≥ 11,1, Normalsicht ΔE ≥ 21,1): **Indigo** = Fortbildung bzw. Arbeit, **Türkis** = Arbeitsmittel bzw. Schule,
    **Gelb** = Fahrten & Reisen bzw. zu Hause; Rest grau. Blau neben Indigo und Pink neben Türkis fielen in der Prüfung durch – darum nicht.
27. **Statusfarben fest:** Grün = erledigt / Geld zurück / jederzeit kündbar / günstiger; **Orange** = bald fällig (Kündigung ≤ 14 Tage,
    sonst ≤ 7) / teurer geworden / Nachzahlung; Rot = abgelaufen. Farbe steht nie allein – immer mit Text oder Symbol.
28. Symbole in getönten Kreisen (Kontrast ≥ 4,4:1), gewählte Kategorie-Chips in Bereichsfarbe (hell weiße, dunkel dunkle Schrift, ≥ 5:1).
    Ausgaben je Monat bleiben einfarbig (eine Größe, keine Kategorien).

## Version 1.4 (26.11.2026, Einführung)
29. **Rundgang mit Sprechblasen** (10 Schritte) einmal nach der Einrichtung bzw. beim ersten Start nach dem Update
    (`geldwerk_tourDone`), jederzeit wieder über das Fragezeichen oben auf der Übersicht oder Einstellungen → Hilfe.
    Hervorhebung mit Rahmen in Warm-Orange, Blase immer neben dem Ziel (Test prüft: sichtbar, verdeckt nichts).
30. **Seite „Was kann Geldwerk?“** mit allen Funktionen in neun kurzen Abschnitten, in den Bereichsfarben.

## Version 1.4.1 (26.11.2026)
31. **Schnellaktionen kräftig statt pastell:** Rückmeldung „Farben nebeneinander zu ähnlich“. Jede Aktion eigene volle Farbe
    (Indigo, Türkis, Orange, Blau, Gelb, Pink) in einer Reihenfolge, in der Nachbarn klar verschieden sind (Prüfskript hell + dunkel:
    Farbschwäche ΔE ≥ 11,7, Normalsicht ≥ 22). Beschriftung „Pauschbetrag“ im Verlauf links, damit die Wert-Pille sie nicht verdeckt.
32. **1.4.2 – wieder blass** (Rückmeldung „Blass war schöner“): Pastell bleibt, aber sechs verschiedene Farbtöne statt je zwei gleicher;
    Symbol in kräftigem Ton (Kontrast ≥ 4,2:1), dunkel helles Symbol auf getöntem Grund.
