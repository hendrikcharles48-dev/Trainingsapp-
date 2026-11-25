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
