# Toleranzen-App: alle Tabellenwerte und Rechenregeln zum Gegenprüfen

Diese Übersicht wurde automatisch aus den Dateien erzeugt, mit denen die App rechnet (tables.js und calc.js). Grundlage: ISO 286-1:2010, ISO 2768-1:1989, ISO 2768-2:1989, ISO 22081:2021. Nennmaßbereiche „über a bis b“: a gehört nicht dazu, b gehört dazu. Alle ISO-Werte in µm (1000 µm = 1 mm).

Bitte prüfen: 1. Stimmen die Tabellenwerte mit der Norm bzw. einem Tabellenbuch überein? 2. Stimmen die Rechenregeln? 3. Stimmen die Beispielergebnisse am Ende?

## 1. ISO 286-1: Grundtoleranzen (IT-Werte) in µm

| Nennmaß mm | IT01 | IT0 | IT1 | IT2 | IT3 | IT4 | IT5 | IT6 | IT7 | IT8 | IT9 | IT10 | IT11 | IT12 | IT13 | IT14 | IT15 | IT16 | IT17 | IT18 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| bis 3 | 0,3 | 0,5 | 0,8 | 1,2 | 2 | 3 | 4 | 6 | 10 | 14 | 25 | 40 | 60 | 100 | 140 | 250 | 400 | 600 | 1000 | 1400 |
| über 3 bis 6 | 0,4 | 0,6 | 1 | 1,5 | 2,5 | 4 | 5 | 8 | 12 | 18 | 30 | 48 | 75 | 120 | 180 | 300 | 480 | 750 | 1200 | 1800 |
| über 6 bis 10 | 0,4 | 0,6 | 1 | 1,5 | 2,5 | 4 | 6 | 9 | 15 | 22 | 36 | 58 | 90 | 150 | 220 | 360 | 580 | 900 | 1500 | 2200 |
| über 10 bis 18 | 0,5 | 0,8 | 1,2 | 2 | 3 | 5 | 8 | 11 | 18 | 27 | 43 | 70 | 110 | 180 | 270 | 430 | 700 | 1100 | 1800 | 2700 |
| über 18 bis 30 | 0,6 | 1 | 1,5 | 2,5 | 4 | 6 | 9 | 13 | 21 | 33 | 52 | 84 | 130 | 210 | 330 | 520 | 840 | 1300 | 2100 | 3300 |
| über 30 bis 50 | 0,6 | 1 | 1,5 | 2,5 | 4 | 7 | 11 | 16 | 25 | 39 | 62 | 100 | 160 | 250 | 390 | 620 | 1000 | 1600 | 2500 | 3900 |
| über 50 bis 80 | 0,8 | 1,2 | 2 | 3 | 5 | 8 | 13 | 19 | 30 | 46 | 74 | 120 | 190 | 300 | 460 | 740 | 1200 | 1900 | 3000 | 4600 |
| über 80 bis 120 | 1 | 1,5 | 2,5 | 4 | 6 | 10 | 15 | 22 | 35 | 54 | 87 | 140 | 220 | 350 | 540 | 870 | 1400 | 2200 | 3500 | 5400 |
| über 120 bis 180 | 1,2 | 2 | 3,5 | 5 | 8 | 12 | 18 | 25 | 40 | 63 | 100 | 160 | 250 | 400 | 630 | 1000 | 1600 | 2500 | 4000 | 6300 |
| über 180 bis 250 | 2 | 3 | 4,5 | 7 | 10 | 14 | 20 | 29 | 46 | 72 | 115 | 185 | 290 | 460 | 720 | 1150 | 1850 | 2900 | 4600 | 7200 |
| über 250 bis 315 | 2,5 | 4 | 6 | 8 | 12 | 16 | 23 | 32 | 52 | 81 | 130 | 210 | 320 | 520 | 810 | 1300 | 2100 | 3200 | 5200 | 8100 |
| über 315 bis 400 | 3 | 5 | 7 | 9 | 13 | 18 | 25 | 36 | 57 | 89 | 140 | 230 | 360 | 570 | 890 | 1400 | 2300 | 3600 | 5700 | 8900 |
| über 400 bis 500 | 4 | 6 | 8 | 10 | 15 | 20 | 27 | 40 | 63 | 97 | 155 | 250 | 400 | 630 | 970 | 1550 | 2500 | 4000 | 6300 | 9700 |

Hinweis der App: IT14 bis IT18 werden für Nennmaße bis 1 mm nicht verwendet. Die App deckt Nennmaße von 1 bis 500 mm ab.

## 2. ISO 286-1: Grundabmaße der Wellen in µm

d, e, f, g, h: Grundabmaß = oberes Abmaß (es). k, m, n, p, r, s: Grundabmaß = unteres Abmaß (ei).

| Nennmaß mm | d (es) | e (es) | f (es) | g (es) | h (es) | k (ei, nur IT4 bis IT7) | m (ei) | n (ei) | p (ei) |
|---|---|---|---|---|---|---|---|---|---|
| bis 3 | −20 | −14 | −6 | −2 | 0 | 0 | +2 | +4 | +6 |
| über 3 bis 6 | −30 | −20 | −10 | −4 | 0 | +1 | +4 | +8 | +12 |
| über 6 bis 10 | −40 | −25 | −13 | −5 | 0 | +1 | +6 | +10 | +15 |
| über 10 bis 18 | −50 | −32 | −16 | −6 | 0 | +1 | +7 | +12 | +18 |
| über 18 bis 30 | −65 | −40 | −20 | −7 | 0 | +2 | +8 | +15 | +22 |
| über 30 bis 50 | −80 | −50 | −25 | −9 | 0 | +2 | +9 | +17 | +26 |
| über 50 bis 80 | −100 | −60 | −30 | −10 | 0 | +2 | +11 | +20 | +32 |
| über 80 bis 120 | −120 | −72 | −36 | −12 | 0 | +3 | +13 | +23 | +37 |
| über 120 bis 180 | −145 | −85 | −43 | −14 | 0 | +3 | +15 | +27 | +43 |
| über 180 bis 250 | −170 | −100 | −50 | −15 | 0 | +4 | +17 | +31 | +50 |
| über 250 bis 315 | −190 | −110 | −56 | −17 | 0 | +4 | +20 | +34 | +56 |
| über 315 bis 400 | −210 | −125 | −62 | −18 | 0 | +4 | +21 | +37 | +62 |
| über 400 bis 500 | −230 | −135 | −68 | −20 | 0 | +5 | +23 | +40 | +68 |

k: Für IT3 und feiner sowie ab IT8 ist ei = 0.

### Wellen r und s, unteres Abmaß ei in µm (über 50 mm Unterbereiche)

| Nennmaß mm | r | s |
|---|---|---|
| bis 3 | +10 | +14 |
| über 3 bis 6 | +15 | +19 |
| über 6 bis 10 | +19 | +23 |
| über 10 bis 18 | +23 | +28 |
| über 18 bis 30 | +28 | +35 |
| über 30 bis 50 | +34 | +43 |
| über 50 bis 65 | +41 | +53 |
| über 65 bis 80 | +43 | +59 |
| über 80 bis 100 | +51 | +71 |
| über 100 bis 120 | +54 | +79 |
| über 120 bis 140 | +63 | +92 |
| über 140 bis 160 | +65 | +100 |
| über 160 bis 180 | +68 | +108 |
| über 180 bis 200 | +77 | +122 |
| über 200 bis 225 | +80 | +130 |
| über 225 bis 250 | +84 | +140 |
| über 250 bis 280 | +94 | +158 |
| über 280 bis 315 | +98 | +170 |
| über 315 bis 355 | +108 | +190 |
| über 355 bis 400 | +114 | +208 |
| über 400 bis 450 | +126 | +232 |
| über 450 bis 500 | +132 | +252 |

## 3. Zuschlag (Delta) für Bohrungen in µm

Die App rechnet Delta als IT-Wert des Grades minus IT-Wert des nächstfeineren Grades im selben Bereich; im Bereich bis 3 mm ist Delta immer 0. Ergebnis:

| Nennmaß mm | IT3 | IT4 | IT5 | IT6 | IT7 | IT8 |
|---|---|---|---|---|---|---|
| bis 3 | 0 | 0 | 0 | 0 | 0 | 0 |
| über 3 bis 6 | 1 | 1,5 | 1 | 3 | 4 | 6 |
| über 6 bis 10 | 1 | 1,5 | 2 | 3 | 6 | 7 |
| über 10 bis 18 | 1 | 2 | 3 | 3 | 7 | 9 |
| über 18 bis 30 | 1,5 | 2 | 3 | 4 | 8 | 12 |
| über 30 bis 50 | 1,5 | 3 | 4 | 5 | 9 | 14 |
| über 50 bis 80 | 2 | 3 | 5 | 6 | 11 | 16 |
| über 80 bis 120 | 2 | 4 | 5 | 7 | 13 | 19 |
| über 120 bis 180 | 3 | 4 | 6 | 7 | 15 | 23 |
| über 180 bis 250 | 3 | 4 | 6 | 9 | 17 | 26 |
| über 250 bis 315 | 4 | 4 | 7 | 9 | 20 | 29 |
| über 315 bis 400 | 4 | 5 | 7 | 11 | 21 | 32 |
| über 400 bis 500 | 5 | 5 | 7 | 13 | 23 | 34 |

## 4. Rechenregeln ISO 286

- Wellen d bis h: es = Tabellenwert, ei = es − IT.
- Wellen k bis s: ei = Tabellenwert (bei k nur für IT4 bis IT7, sonst 0), es = ei + IT.
- js und JS: ±IT/2. Bei IT7 bis IT11 wird ein ungerader IT-Wert vorher auf die nächste gerade Zahl abgerundet (z. B. IT7 = 21 µm → ±10 µm). Sonst exakt IT/2 (z. B. js6 bei 18–30 mm = ±6,5 µm).
- Bohrungen D bis H: EI = −es der gleichnamigen Welle, ES = EI + IT.
- Bohrungen K, M, N bis einschließlich IT8: ES = −ei der gleichnamigen Welle + Delta (bei K wird der k-Wert aus der Spalte IT4 bis IT7 genommen). EI = ES − IT.
- K ab IT9: ES = 0. M ab IT9: ES = −ei(m). N ab IT9: ES = 0, im Bereich bis 3 mm ES = −4 µm.
- Bohrungen P, R, S bis einschließlich IT7: ES = −ei der gleichnamigen Welle + Delta. Ab IT8: ES = −ei. EI = ES − IT.
- Sonderfall: M6 im Bereich über 250 bis 315 mm: ES = −9 µm.
- K, M, N, P, R, S mit IT01, IT0, IT1, IT2: in der App nicht berechnet (in der Norm nicht vorgesehen).
- Höchstmaß = Nennmaß + oberes Abmaß, Mindestmaß = Nennmaß + unteres Abmaß, Toleranzmitte = Nennmaß + (oberes + unteres Abmaß) / 2.

## 5. Passungen

- Größte Bohrung minus kleinste Welle = ES − ei. Kleinste Bohrung minus größte Welle = EI − es. Positiv = Spiel, negativ = Übermaß.
- EI − es ≥ 0: Spielpassung (Höchstspiel = ES − ei, Mindestspiel = EI − es).
- ES − ei ≤ 0: Übermaßpassung/Presspassung (Höchstübermaß = es − EI, Mindestübermaß = ei − ES).
- Sonst: Übergangspassung (Höchstspiel = ES − ei, Höchstübermaß = es − EI).
- Passtoleranz = IT Bohrung + IT Welle.
- System: Bohrung H = Einheitsbohrung, Welle h = Einheitswelle. Gleichwertige Passung im anderen System: H7/g6 ↔ G7/h6 usw.

## 6. ISO 2768-1: Freimaßtoleranzen

### Längenmaße, Grenzabmaße in mm

| Nennmaß mm | f fein | m mittel | c grob | v sehr grob |
|---|---|---|---|---|
| 0,5 bis 3 | ±0,05 | ±0,1 | ±0,2 | – |
| über 3 bis 6 | ±0,05 | ±0,1 | ±0,3 | ±0,5 |
| über 6 bis 30 | ±0,1 | ±0,2 | ±0,5 | ±1 |
| über 30 bis 120 | ±0,15 | ±0,3 | ±0,8 | ±1,5 |
| über 120 bis 400 | ±0,2 | ±0,5 | ±1,2 | ±2,5 |
| über 400 bis 1000 | ±0,3 | ±0,8 | ±2 | ±4 |
| über 1000 bis 2000 | ±0,5 | ±1,2 | ±3 | ±6 |
| über 2000 bis 4000 | – | ±2 | ±4 | ±8 |

Unter 0,5 mm keine Allgemeintoleranz. Strich = kein Wert festgelegt.

### Rundungshalbmesser und Fasenhöhen, Grenzabmaße in mm

| Nennmaß mm | f | m | c | v |
|---|---|---|---|---|
| 0,5 bis 3 | ±0,2 | ±0,2 | ±0,4 | ±0,4 |
| über 3 bis 6 | ±0,5 | ±0,5 | ±1 | ±1 |
| über 6 | ±1 | ±1 | ±2 | ±2 |

### Winkelmaße nach Länge des kürzeren Schenkels

| Kürzerer Schenkel mm | f | m | c | v |
|---|---|---|---|---|
| bis 10 | ±1° | ±1° | ±1° 30′ | ±3° |
| über 10 bis 50 | ±0° 30′ | ±0° 30′ | ±1° | ±2° |
| über 50 bis 120 | ±0° 20′ | ±0° 20′ | ±0° 30′ | ±1° |
| über 120 bis 400 | ±0° 10′ | ±0° 10′ | ±0° 15′ | ±0° 30′ |
| über 400 | ±0° 5′ | ±0° 5′ | ±0° 10′ | ±0° 20′ |

Die App zeigt zusätzlich die seitliche Abweichung am Schenkelende = Schenkellänge × tan(Winkelabweichung).

## 7. ISO 2768-2: Form und Lage in mm

### Geradheit und Ebenheit (nach Nennlänge)

| Nennlänge mm | H | K | L |
|---|---|---|---|
| bis 10 | 0,02 | 0,05 | 0,1 |
| über 10 bis 30 | 0,05 | 0,1 | 0,2 |
| über 30 bis 100 | 0,1 | 0,2 | 0,4 |
| über 100 bis 300 | 0,2 | 0,4 | 0,8 |
| über 300 bis 1000 | 0,3 | 0,6 | 1,2 |
| über 1000 bis 3000 | 0,4 | 0,8 | 1,6 |

### Rechtwinkligkeit (nach Länge des kürzeren Schenkels)

| Kürzerer Schenkel mm | H | K | L |
|---|---|---|---|
| bis 100 | 0,2 | 0,4 | 0,6 |
| über 100 bis 300 | 0,3 | 0,6 | 1 |
| über 300 bis 1000 | 0,4 | 0,8 | 1,5 |
| über 1000 bis 3000 | 0,5 | 1 | 2 |

### Symmetrie (nach Länge des kürzeren Elements)

| Kürzeres Element mm | H | K | L |
|---|---|---|---|
| bis 100 | 0,5 | 0,6 | 0,6 |
| über 100 bis 300 | 0,5 | 0,6 | 1 |
| über 300 bis 1000 | 0,5 | 0,8 | 1,5 |
| über 1000 bis 3000 | 0,5 | 1 | 2 |

### Lauf (Rundlauf, Planlauf)

|  | H | K | L |
|---|---|---|---|
| Lauf | 0,1 | 0,2 | 0,5 |

### Regeln der App

- Geradheit: Länge der Linie. Ebenheit: längere Seite der Fläche bzw. Durchmesser einer runden Fläche.
- Rechtwinkligkeit: längeres Element = Bezug, Tabelle nach Länge des kürzeren.
- Rundheit = Toleranzbreite des Durchmessers (bei Freimaß 2 × Grenzabmaß nach ISO 2768-1), höchstens aber der Lauf-Wert.
- Parallelität = größerer Wert aus Maßtoleranz des Abstands (Toleranzbreite) und Geradheit/Ebenheit; längeres Element = Bezug.
- Position: ISO 2768-2 hat keine Tabelle; die App nimmt die Grenzabmaße der Abstandsmaße nach ISO 2768-1.

## 8. ISO 22081 (neue Allgemeintoleranz)

- Keine feste Zahlentabelle: Profiltoleranz t steht auf der Zeichnung (Flächenprofil mit Bezügen, z. B. 0,4 zu A, B, C).
- Maß vom Bezug aus: ±t/2. Maß zwischen zwei Flächen ohne Bezug: ±t (beide Flächen je ±t/2, Worst Case).
- Allgemeine Größenmaßtoleranz ±x: gilt für Größenmaße (Durchmesser, Nutbreiten, Dicken); Grenzmaße = Nennmaß ± x.

## 9. Maßketten (arithmetisch, Worst Case)

- Nennmaß = Summe der addierten Nennmaße − Summe der abgezogenen Nennmaße.
- Höchstmaß = Summe der Höchstmaße der addierten Maße − Summe der Mindestmaße der abgezogenen Maße.
- Mindestmaß = Summe der Mindestmaße der addierten Maße − Summe der Höchstmaße der abgezogenen Maße.
- Gesamttoleranz = Höchstmaß − Mindestmaß = Summe aller Einzeltoleranzen.

## 10. Beispielergebnisse der App (zum Vergleich)

### ISO-Toleranzen

| Angabe | Bereich | IT µm | oberes Abmaß µm | unteres Abmaß µm | Höchstmaß mm | Mindestmaß mm |
|---|---|---|---|---|---|---|
| 8H7 | über 6 bis 10 mm | 15 | +15 | 0 | 8,015 | 8,000 |
| 10H8 | über 6 bis 10 mm | 22 | +22 | 0 | 10,022 | 10,000 |
| 25g6 | über 18 bis 30 mm | 13 | −7 | −20 | 24,993 | 24,980 |
| 25f7 | über 18 bis 30 mm | 21 | −20 | −41 | 24,980 | 24,959 |
| 25h6 | über 18 bis 30 mm | 13 | 0 | −13 | 25,000 | 24,987 |
| 25js6 | über 18 bis 30 mm | 13 | +6,5 | −6,5 | 25,0065 | 24,9935 |
| 25js7 | über 18 bis 30 mm | 21 | +10 | −10 | 25,010 | 24,990 |
| 40js7 | über 30 bis 50 mm | 25 | +12 | −12 | 40,012 | 39,988 |
| 25k6 | über 18 bis 30 mm | 13 | +15 | +2 | 25,015 | 25,002 |
| 30k5 | über 18 bis 30 mm | 9 | +11 | +2 | 30,011 | 30,002 |
| 25m6 | über 18 bis 30 mm | 13 | +21 | +8 | 25,021 | 25,008 |
| 25n6 | über 18 bis 30 mm | 13 | +28 | +15 | 25,028 | 25,015 |
| 25p6 | über 18 bis 30 mm | 13 | +35 | +22 | 25,035 | 25,022 |
| 25r6 | über 18 bis 30 mm | 13 | +41 | +28 | 25,041 | 25,028 |
| 25s6 | über 18 bis 30 mm | 13 | +48 | +35 | 25,048 | 25,035 |
| 60r6 | über 50 bis 80 mm (über 50 bis 65 mm) | 19 | +60 | +41 | 60,060 | 60,041 |
| 60s6 | über 50 bis 80 mm (über 50 bis 65 mm) | 19 | +72 | +53 | 60,072 | 60,053 |
| 100s6 | über 80 bis 120 mm (über 80 bis 100 mm) | 22 | +93 | +71 | 100,093 | 100,071 |
| 25e8 | über 18 bis 30 mm | 33 | −40 | −73 | 24,960 | 24,927 |
| 25d9 | über 18 bis 30 mm | 52 | −65 | −117 | 24,935 | 24,883 |
| 120g6 | über 80 bis 120 mm | 22 | −12 | −34 | 119,988 | 119,966 |
| 120f7 | über 80 bis 120 mm | 35 | −36 | −71 | 119,964 | 119,929 |
| 25K7 | über 18 bis 30 mm | 21 | +6 | −15 | 25,006 | 24,985 |
| 25M7 | über 18 bis 30 mm | 21 | 0 | −21 | 25,000 | 24,979 |
| 25N7 | über 18 bis 30 mm | 21 | −7 | −28 | 24,993 | 24,972 |
| 25P7 | über 18 bis 30 mm | 21 | −14 | −35 | 24,986 | 24,965 |
| 25K6 | über 18 bis 30 mm | 13 | +2 | −11 | 25,002 | 24,989 |
| 25N6 | über 18 bis 30 mm | 13 | −11 | −24 | 24,989 | 24,976 |
| 25K8 | über 18 bis 30 mm | 33 | +10 | −23 | 25,010 | 24,977 |
| 25M8 | über 18 bis 30 mm | 33 | +4 | −29 | 25,004 | 24,971 |
| 25N8 | über 18 bis 30 mm | 33 | −3 | −36 | 24,997 | 24,964 |
| 15K7 | über 10 bis 18 mm | 18 | +6 | −12 | 15,006 | 14,988 |
| 5K7 | über 3 bis 6 mm | 12 | +3 | −9 | 5,003 | 4,991 |
| 8M7 | über 6 bis 10 mm | 15 | 0 | −15 | 8,000 | 7,985 |
| 2K7 | bis 3 mm | 10 | 0 | −10 | 2,000 | 1,990 |
| 2N9 | bis 3 mm | 25 | −4 | −29 | 1,996 | 1,971 |
| 25N9 | über 18 bis 30 mm | 52 | 0 | −52 | 25,000 | 24,948 |
| 300M6 | über 250 bis 315 mm | 32 | −9 | −41 | 299,991 | 299,959 |
| 60R7 | über 50 bis 80 mm (über 50 bis 65 mm) | 30 | −30 | −60 | 59,970 | 59,940 |
| 60S7 | über 50 bis 80 mm (über 50 bis 65 mm) | 30 | −42 | −72 | 59,958 | 59,928 |
| 25F8 | über 18 bis 30 mm | 33 | +53 | +20 | 25,053 | 25,020 |
| 25G7 | über 18 bis 30 mm | 21 | +28 | +7 | 25,028 | 25,007 |
| 25E9 | über 18 bis 30 mm | 52 | +92 | +40 | 25,092 | 25,040 |
| 25D10 | über 18 bis 30 mm | 84 | +149 | +65 | 25,149 | 25,065 |
| 40JS7 | über 30 bis 50 mm | 25 | +12 | −12 | 40,012 | 39,988 |
| 500h6 | über 400 bis 500 mm | 40 | 0 | −40 | 500,000 | 499,960 |
| 2h18 | bis 3 mm | 1400 | 0 | −1400 | 2,000 | 0,600 |
| 30h01 | über 18 bis 30 mm | 0,6 | 0 | −0,6 | 30,000 | 29,9994 |

### Passungen

| Passung | Art | Wert 1 | Wert 2 | Passtoleranz mm |
|---|---|---|---|---|
| 30H7/g6 | Spielpassung | Höchstspiel 0,041 mm | Mindestspiel 0,007 mm | 0,034 |
| 30H7/f7 | Spielpassung | Höchstspiel 0,062 mm | Mindestspiel 0,020 mm | 0,042 |
| 25H7/h6 | Spielpassung | Höchstspiel 0,034 mm | Mindestspiel 0,000 mm | 0,034 |
| 25H7/k6 | Übergangspassung | Höchstspiel 0,019 mm | Höchstübermaß 0,015 mm | 0,034 |
| 25K7/h6 | Übergangspassung | Höchstspiel 0,019 mm | Höchstübermaß 0,015 mm | 0,034 |
| 25H7/n6 | Übergangspassung | Höchstspiel 0,006 mm | Höchstübermaß 0,028 mm | 0,034 |
| 25H7/p6 | Übermaßpassung | Höchstübermaß 0,035 mm | Mindestübermaß 0,001 mm | 0,034 |
| 25H7/s6 | Übermaßpassung | Höchstübermaß 0,048 mm | Mindestübermaß 0,014 mm | 0,034 |
| 50H8/e8 | Spielpassung | Höchstspiel 0,128 mm | Mindestspiel 0,050 mm | 0,078 |
| 60H7/r6 | Übermaßpassung | Höchstübermaß 0,060 mm | Mindestübermaß 0,011 mm | 0,049 |
| 100H7/s6 | Übermaßpassung | Höchstübermaß 0,093 mm | Mindestübermaß 0,036 mm | 0,057 |
| 20H11/d9 | Spielpassung | Höchstspiel 0,247 mm | Mindestspiel 0,065 mm | 0,182 |

### ISO 2768-1

| Maß mm | Klasse | Bereich | Grenzabmaß | Höchstmaß | Mindestmaß |
|---|---|---|---|---|---|
| 0,5 | f | 0,5 bis 3 mm | ±0,05 | 0,55 | 0,45 |
| 3 | m | 0,5 bis 3 mm | ±0,1 | 3,1 | 2,9 |
| 6 | m | über 3 bis 6 mm | ±0,1 | 6,1 | 5,9 |
| 30 | c | über 6 bis 30 mm | ±0,5 | 30,5 | 29,5 |
| 42 | m | über 30 bis 120 mm | ±0,3 | 42,3 | 41,7 |
| 120 | m | über 30 bis 120 mm | ±0,3 | 120,3 | 119,7 |
| 121 | m | über 120 bis 400 mm | ±0,5 | 121,5 | 120,5 |
| 400 | f | über 120 bis 400 mm | ±0,2 | 400,2 | 399,8 |
| 1500 | v | über 1000 bis 2000 mm | ±6 | 1506 | 1494 |
| 3000 | c | über 2000 bis 4000 mm | ±4 | 3004 | 2996 |

| Kürzerer Schenkel mm | Klasse | Abweichung | bei 90°: Größtwinkel | Kleinstwinkel |
|---|---|---|---|---|
| 8 | m | ±1° | 91° 00′ | 89° 00′ |
| 10 | c | ±1° 30′ | 91° 30′ | 88° 30′ |
| 40 | m | ±0° 30′ | 90° 30′ | 89° 30′ |
| 50 | v | ±2° | 92° 00′ | 88° 00′ |
| 80 | f | ±0° 20′ | 90° 20′ | 89° 40′ |
| 150 | c | ±0° 15′ | 90° 15′ | 89° 45′ |
| 500 | v | ±0° 20′ | 90° 20′ | 89° 40′ |

### ISO 2768-2

| Eigenschaft | Eingabe | Klasse | Ergebnis |
|---|---|---|---|
| Ebenheit | {"len":120} | mK | 0,4 mm |
| Geradheit | {"len":10} | mH | 0,02 mm |
| Rechtwinkligkeit | {"len":100} | mL | 0,6 mm |
| Rundheit | {"dia":30} | mK | 0,2 mm |
| Rundheit | {"dia":30} | mH | 0,1 mm |
| Parallelität | {"dist":20,"len":150} | mK | 0,4 mm |
| Parallelität | {"dist":200,"len":50} | mH | 1 mm |
| Rundlauf | {} | mL | 0,5 mm |

### Maßketten

- 10 ±0,2 + 5 ±0,3: Nennmaß 15 mm, Höchstmaß 15,5 mm, Mindestmaß 14,5 mm, Gesamttoleranz 1 mm
- 40 ±0,1 − 12 (+0,1/0): Nennmaß 28 mm, Höchstmaß 28,1 mm, Mindestmaß 27,8 mm, Gesamttoleranz 0,3 mm

## 11. Vollständige Rechenwege, wie sie die App anzeigt

### 25f7
1. Nennmaßbereich bestimmen: Das Nennmaß 25 mm liegt im Bereich über 18 bis 30 mm.
2. IT-Wert ablesen: In der Tabelle der Grundtoleranzen steht in der Zeile über 18 bis 30 mm und der Spalte IT7 der Wert 21 µm. So breit ist das Toleranzfeld. 21 µm sind 0,021 mm.
3. Grundabmaß ablesen: Der Kleinbuchstabe f steht für eine Welle. Bei den Wellen a bis h ist das Grundabmaß das obere Abmaß, denn es liegt der Nulllinie am nächsten. In der Tabelle der Grundabmaße für Wellen steht bei f im Bereich über 18 bis 30 mm: −20 µm. Das ist das obere Abmaß.
4. Zweites Abmaß über den IT-Wert: Das untere Abmaß liegt um den IT-Wert tiefer: −20 µm − 21 µm = −41 µm.
5. Grenzmaße ausrechnen: Die Abmaße in Millimeter umrechnen (1000 µm sind 1 mm): −20 µm sind −0,020 mm, −41 µm sind −0,041 mm.
   Höchstmaß: Nennmaß plus oberes Abmaß: 25,000 mm − 0,020 mm = 24,980 mm
   Mindestmaß: Nennmaß plus unteres Abmaß: 25,000 mm − 0,041 mm = 24,959 mm
6. Toleranzmitte fürs CNC-Programm: Wenn du auf die Mitte des Toleranzfelds zielen willst: Die Mitte zwischen −20 µm und −41 µm liegt bei −30,5 µm. Programmiermaß: 25,000 mm − 0,0305 mm = 24,9695 mm.

### 25K7
1. Nennmaßbereich bestimmen: Das Nennmaß 25 mm liegt im Bereich über 18 bis 30 mm.
2. IT-Wert ablesen: In der Tabelle der Grundtoleranzen steht in der Zeile über 18 bis 30 mm und der Spalte IT7 der Wert 21 µm. So breit ist das Toleranzfeld. 21 µm sind 0,021 mm.
3. Grundabmaß ablesen: Der Großbuchstabe K steht für eine Bohrung. Für K, M und N bis IT8 gilt eine Sonderregel: Du nimmst das Grundabmaß der Welle k mit umgedrehtem Vorzeichen und rechnest einen Zuschlag dazu. Das Ergebnis ist das obere Abmaß.
   Die Welle k hat im Bereich über 18 bis 30 mm (Spalte IT4 bis IT7) ein unteres Abmaß von +2 µm. Mit umgedrehtem Vorzeichen: −2 µm.
   Zuschlag: IT7 minus IT6 im selben Bereich: 21 µm − 13 µm = 8 µm. In vielen Tabellenbüchern steht dieser Zuschlag als Delta in einer eigenen Spalte.
   Oberes Abmaß: −2 µm + 8 µm = +6 µm.
4. Zweites Abmaß über den IT-Wert: Das untere Abmaß liegt um den IT-Wert tiefer: +6 µm − 21 µm = −15 µm.
5. Grenzmaße ausrechnen: Die Abmaße in Millimeter umrechnen (1000 µm sind 1 mm): +6 µm sind +0,006 mm, −15 µm sind −0,015 mm.
   Höchstmaß: Nennmaß plus oberes Abmaß: 25,000 mm + 0,006 mm = 25,006 mm
   Mindestmaß: Nennmaß plus unteres Abmaß: 25,000 mm − 0,015 mm = 24,985 mm
6. Toleranzmitte fürs CNC-Programm: Wenn du auf die Mitte des Toleranzfelds zielen willst: Die Mitte zwischen +6 µm und −15 µm liegt bei −4,5 µm. Programmiermaß: 25,000 mm − 0,0045 mm = 24,9955 mm.

### 25js7
1. Nennmaßbereich bestimmen: Das Nennmaß 25 mm liegt im Bereich über 18 bis 30 mm.
2. IT-Wert ablesen: In der Tabelle der Grundtoleranzen steht in der Zeile über 18 bis 30 mm und der Spalte IT7 der Wert 21 µm. So breit ist das Toleranzfeld. 21 µm sind 0,021 mm.
3. Grundabmaß ablesen: js bedeutet: Das Toleranzfeld liegt symmetrisch zur Nulllinie, halb darüber und halb darunter. Ein Grundabmaß aus der Tabelle brauchst du nicht. Beide Abmaße sind halb so groß wie der IT-Wert: 21 µm geteilt durch 2 = 10,5 µm. Bei IT7 bis IT11 rundet die Norm einen ungeraden IT-Wert auf die nächste gerade Zahl ab, damit ganze Mikrometer herauskommen: 20 µm geteilt durch 2 = 10 µm. So steht es auch in den Tabellenbüchern.
4. Abmaße festlegen: Oberes Abmaß +10 µm, unteres Abmaß −10 µm.
5. Grenzmaße ausrechnen: Die Abmaße in Millimeter umrechnen (1000 µm sind 1 mm): +10 µm sind +0,010 mm, −10 µm sind −0,010 mm.
   Höchstmaß: Nennmaß plus oberes Abmaß: 25,000 mm + 0,010 mm = 25,010 mm
   Mindestmaß: Nennmaß plus unteres Abmaß: 25,000 mm − 0,010 mm = 24,990 mm
6. Toleranzmitte fürs CNC-Programm: Wenn du auf die Mitte des Toleranzfelds zielen willst: Die Mitte zwischen +10 µm und −10 µm liegt bei 0 µm. Programmiermaß: 25,000 mm + 0,000 mm = 25,000 mm.

### 60s6
1. Nennmaßbereich bestimmen: Das Nennmaß 60 mm liegt im Bereich über 50 bis 80 mm. Für s ist der Bereich über 50 mm feiner unterteilt: Für das Grundabmaß zählt der Unterbereich über 50 bis 65 mm.
2. IT-Wert ablesen: In der Tabelle der Grundtoleranzen steht in der Zeile über 50 bis 80 mm und der Spalte IT6 der Wert 19 µm. So breit ist das Toleranzfeld. 19 µm sind 0,019 mm.
3. Grundabmaß ablesen: Der Kleinbuchstabe s steht für eine Welle. Bei den Wellen k bis zc ist das Grundabmaß das untere Abmaß. In der Tabelle der Grundabmaße für Wellen steht bei s im Bereich über 50 bis 65 mm: +53 µm.
4. Zweites Abmaß über den IT-Wert: Das obere Abmaß liegt um den IT-Wert höher: +53 µm + 19 µm = +72 µm.
5. Grenzmaße ausrechnen: Die Abmaße in Millimeter umrechnen (1000 µm sind 1 mm): +72 µm sind +0,072 mm, +53 µm sind +0,053 mm.
   Höchstmaß: Nennmaß plus oberes Abmaß: 60,000 mm + 0,072 mm = 60,072 mm
   Mindestmaß: Nennmaß plus unteres Abmaß: 60,000 mm + 0,053 mm = 60,053 mm
6. Toleranzmitte fürs CNC-Programm: Wenn du auf die Mitte des Toleranzfelds zielen willst: Die Mitte zwischen +72 µm und +53 µm liegt bei +62,5 µm. Programmiermaß: 60,000 mm + 0,0625 mm = 60,0625 mm.

### 300M6
1. Nennmaßbereich bestimmen: Das Nennmaß 300 mm liegt im Bereich über 250 bis 315 mm.
2. IT-Wert ablesen: In der Tabelle der Grundtoleranzen steht in der Zeile über 250 bis 315 mm und der Spalte IT6 der Wert 32 µm. So breit ist das Toleranzfeld. 32 µm sind 0,032 mm.
3. Grundabmaß ablesen: Der Großbuchstabe M steht für eine Bohrung. Für K, M und N bis IT8 gilt eine Sonderregel: Du nimmst das Grundabmaß der Welle m mit umgedrehtem Vorzeichen und rechnest einen Zuschlag dazu. Das Ergebnis ist das obere Abmaß.
   Die Welle m hat im Bereich über 250 bis 315 mm ein unteres Abmaß von +20 µm. Mit umgedrehtem Vorzeichen: −20 µm.
   Zuschlag: IT6 minus IT5 im selben Bereich: 32 µm − 23 µm = 9 µm. In vielen Tabellenbüchern steht dieser Zuschlag als Delta in einer eigenen Spalte.
   Oberes Abmaß: −20 µm + 9 µm = −11 µm. Sonderfall der Norm: Für M6 im Bereich über 250 bis 315 mm gilt stattdessen −9 µm.
4. Zweites Abmaß über den IT-Wert: Das untere Abmaß liegt um den IT-Wert tiefer: −9 µm − 32 µm = −41 µm.
5. Grenzmaße ausrechnen: Die Abmaße in Millimeter umrechnen (1000 µm sind 1 mm): −9 µm sind −0,009 mm, −41 µm sind −0,041 mm.
   Höchstmaß: Nennmaß plus oberes Abmaß: 300,000 mm − 0,009 mm = 299,991 mm
   Mindestmaß: Nennmaß plus unteres Abmaß: 300,000 mm − 0,041 mm = 299,959 mm
6. Toleranzmitte fürs CNC-Programm: Wenn du auf die Mitte des Toleranzfelds zielen willst: Die Mitte zwischen −9 µm und −41 µm liegt bei −25 µm. Programmiermaß: 300,000 mm − 0,025 mm = 299,975 mm.

### Passung 30H7/g6
1. Bohrung 30 H7: Oberes Abmaß +21 µm, unteres Abmaß 0 µm. Höchstmaß 30,021 mm, Mindestmaß 30,000 mm. Den ausführlichen Weg siehst du, wenn du H7 einzeln rechnest.
2. Welle 30 g6: Oberes Abmaß −7 µm, unteres Abmaß −20 µm. Höchstmaß 29,993 mm, Mindestmaß 29,980 mm.
3. Größte Bohrung minus kleinste Welle: 30,021 mm − 29,980 mm = +0,041 mm. Positiv heißt: Hier bleibt Spiel.
4. Kleinste Bohrung minus größte Welle: 30,000 mm − 29,993 mm = +0,007 mm. Positiv heißt: Auch hier bleibt Spiel.
5. Passungsart bestimmen: Beide Ergebnisse sind positiv oder null. Die Bohrung ist also immer mindestens so groß wie die Welle: Spielpassung. Höchstspiel 0,041 mm, Mindestspiel 0,007 mm.
6. Passtoleranz: So stark kann das Spiel zwischen zwei Paarungen schwanken: IT-Wert der Bohrung plus IT-Wert der Welle: 21 µm + 13 µm = 34 µm, also 0,034 mm.

### Freimaß 120 mm, ISO 2768-m
1. Toleranzklasse: Im Schriftfeld steht der Kleinbuchstabe m, also die Klasse mittel.
2. Nennmaßbereich bestimmen: 120 mm liegt im Bereich über 30 bis 120 mm. 120 mm liegt genau auf der Grenze. Die obere Zahl eines Bereichs gehört noch dazu.
3. Grenzabmaß ablesen: In der Tabelle für Längenmaße steht in der Zeile über 30 bis 120 mm und der Spalte mittel: ±0,3 mm.
4. Grenzmaße ausrechnen: Höchstmaß: 120,0 mm + 0,3 mm = 120,3 mm
   Mindestmaß: 120,0 mm − 0,3 mm = 119,7 mm
5. Toleranz: Höchstmaß minus Mindestmaß: 120,3 mm − 119,7 mm = 0,6 mm.

### Winkel 90°, kürzerer Schenkel 40 mm, Klasse m
1. Kürzeren Schenkel nehmen: Für die Winkeltoleranz zählt die Länge des kürzeren Schenkels: 40 mm.
2. Längenbereich bestimmen: 40 mm liegt im Bereich über 10 bis 50 mm.
3. Abweichung ablesen: In der Tabelle für Winkelmaße steht in der Zeile über 10 bis 50 mm und der Spalte mittel: ±0° 30′. Das sind 30 Winkelminuten. 60 Minuten sind 1 Grad, also 30 geteilt durch 60 = 0,5°.
4. Größt- und Kleinstwinkel: Größtwinkel: 90° 00′ + 30 Minuten = 90° 30′
   Kleinstwinkel: 90° 00′ − 30 Minuten = 89° 30′
   Denk beim Rechnen daran: 60 Minuten sind 1 Grad.
5. Was das am Werkstück heißt: Am Ende des 40 mm langen Schenkels darf die Kante dadurch etwa 0,349 mm seitlich abweichen. Das ist die Schenkellänge mal Tangens von 0,5°. So kannst du den Winkel auch mit Messuhr oder Höhenmessgerät prüfen.

### ISO 22081, Profiltoleranz 0,4 mm, Maß 50 mm vom Bezug
1. Angabe lesen: Die Zeichnung verlangt eine allgemeine Profiltoleranz von 0,4 mm. Das ist die Breite der Zone, in der jede Fläche ohne eigene Angabe liegen muss.
2. Zone halbieren: Die Zone liegt mittig um die Sollfläche aus Zeichnung oder CAD-Modell: 0,4 mm geteilt durch 2 = 0,2 mm nach jeder Seite.
3. Abstand vom Bezug: Jeder Punkt der Fläche muss in dieser Zone liegen. Gemessen vom Bezug aus darf also jeder Punkt höchstens ±0,2 mm von seiner Sollposition abweichen. Das gilt nur für den Abstand zu einem Bezug der Angabe, nicht für beliebige Maße auf der Zeichnung.
4. Grenzmaße ausrechnen: Höchstmaß: 50,0 mm + 0,2 mm = 50,2 mm
   Mindestmaß: 50,0 mm − 0,2 mm = 49,8 mm
