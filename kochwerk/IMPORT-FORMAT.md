# Kochwerk – Import-Format für Rezepte

Kochwerk liest Rezepte als Text-Block ein, der aus dem Claude-Chat kommt
(Skill „kochwerk-rezept“). Den Block kopiert man, öffnet in der App **Rezepte → ⤓ (Rezepte einfügen)**,
fügt ihn ein und tippt auf **Prüfen**. Die App zeigt eine Vorschau mit Warnungen und übernimmt die
Rezepte erst nach einer Bestätigung.

Kalorien, Protein, Kohlenhydrate und Fett **pro Portion** rechnet die App selbst aus den Werten pro
100 g jeder Zutat. Diese Werte müssen also stimmen.

## Aufbau eines Rezepts

```
=== KOCHWERK REZEPT ===
Name: <Name>
Kategorie: <Hauptmahlzeit | Snack | Hungersnack | Notfall>
Portionen: <Zahl>
Haltbar: <Zahl> Tage
Einfrierbar: <ja | nein>
Boxtauglich: <ja | nein>
Zeit: <Zahl> min                      (optional, Gesamtzeit)
Notiz: <Text>                         (optional, z. B. was von Packungen übrig bleibt)
Zutaten:
- <Zutat> | <Menge> | <Packung> | <Bereich> | <kcal> kcal, <Protein> P, <Kohlenhydrate> K, <Fett> F
Schritte:
1. <Schritt> [<Zeit> min]
   Tipp: <Spar-Tipp, optional>
2. <Schritt> [<Zeit> min nebenbei]
=== ENDE ===
```

- Jede Angabe steht in einer eigenen Zeile, Feldname und Doppelpunkt am Anfang.
- **Mehrere Rezepte:** die Blöcke direkt untereinander, alles in einem einzigen Codeblock.
- **Dezimalzahlen** mit Komma (`1,5`). Ein Punkt geht auch.
- Text vor dem ersten und nach dem letzten Block wird ignoriert, ebenso die Codeblock-Zeichen
  ` ``` ` und Markdown-Fettschrift (`**Name:**`).

## Felder

| Feld | Pflicht | Werte | Bedeutung |
|---|---|---|---|
| `Name` | ja | Text | Eindeutiger Name. Gibt es den Namen schon, fragt die App: ersetzen, als neues anlegen oder überspringen. |
| `Kategorie` | ja | `Hauptmahlzeit`, `Snack`, `Hungersnack`, `Notfall` | Hauptmahlzeit = normale geplante Mahlzeit. Snack = kleine Mahlzeit zum Einfügen in den Tagesplan. Hungersnack = schneller Proteinsnack für den Knopf „Ich hab Hunger“. Notfall = Gericht aus haltbaren Vorräten für „Plan geplatzt“. |
| `Portionen` | ja | Zahl | Für wie viele Portionen die Zutatenmengen gelten. |
| `Haltbar` | ja | Zahl (Tage) | Im Kühlschrank, realistisch meist höchstens 3 bis 4 Tage. Daraus rechnet die App später, welche Boxen ins Gefrierfach müssen. |
| `Einfrierbar` | ja | `ja` / `nein` | Ehrlich angeben (Eier, Salate, gekochte Kartoffeln, rohe Gurken und Tomaten eignen sich schlecht). |
| `Boxtauglich` | ja | `ja` / `nein` | Lässt sich gut in Boxen packen und aufwärmen oder kalt essen. |
| `Zeit` | nein | Zahl `min` | Gesamtzeit. |
| `Notiz` | nein | Text | Freier Hinweis. |
| `Zutaten:` | ja | Liste | Eine Zutat pro Zeile, beginnt mit `- `. |
| `Schritte:` | ja | Liste | Nummeriert `1.`, `2.` … |

Fehlt ein Pflichtfeld außer Name und Zutaten, übernimmt die App einen Standardwert (Kategorie
Hauptmahlzeit, 1 Portion, 3 Tage haltbar, nicht einfrierbar, boxtauglich) und zeigt eine Warnung.
Ohne Name oder ohne Zutaten wird das Rezept nicht übernommen.

## Zutatenzeile

```
- Hähnchenbrustfilet | 1000 g | Packung 500 g | Fleisch | 105 kcal, 23,5 P, 0 K, 1,2 F
  ^ Name               ^ Menge  ^ Packung       ^ Bereich ^ Werte pro 100 g
```

Fünf Spalten, getrennt mit `|`.

**Menge** – wie viel das Rezept braucht:
- Gewicht oder Volumen: `1000 g`, `1 kg`, `250 ml`, `0,5 l`
- Stückzahl immer mit Gewicht pro Stück: `4 Stück à 60 g`, `2 Zehen à 4 g`, `3 Scheiben à 25 g`
- Löffel: `1 EL à 10 g`, `1 TL à 4 g` (ohne „à“ rechnet die App 1 EL = 10 g, 1 TL = 4 g)
- Zähl-Einheiten: Stück, EL, TL, Scheibe, Zehe, Bund, Becher, Dose, Packung, Glas, Beutel, Prise, Handvoll, Tasse

**Packung** – eine gängige Standardgröße, die man in den meisten deutschen Supermärkten und
Discountern bekommt:
- `Packung 500 g`, `Dose 400 g`, `Becher 500 g`, `Netz 1 kg`, `Flasche 500 ml`
- `Packung 10 Stück` (Eier), `Beutel 3 Stück` (Paprika), `Bund`, `Stück`
- Auch erkannt: `Packung Glas 120 g`, `Packung Tube 200 ml`, `Packung 1 Knolle` (das Wort „Packung“ davor stört nicht),
  `Packung Dose 400 g (250 g abgetropft)` – gerechnet wird mit dem Abtropfgewicht – und `Packung 1 Stück (ca. 800 g)`
  für Kohl, Lauch oder Bund mit ungefährem Gewicht. Knoblauch in Zehen: eine Knolle reicht für etwa 10 Zehen.
- `Vorrat` oder `Packung Vorrat` für Sachen, die man ohnehin im Haus hat (Öl, Brühe, Gewürze).
  Sie kommen nicht auf die Wocheneinkaufsliste.
- Ganze Packungen: Die Mengen so wählen, dass jede gekaufte Packung aufgebraucht wird. Geht eine
  Packung nicht auf, landet der Rest später in der Restekarte.

**Bereich** – wo die Zutat im Laden liegt (für die sortierte Einkaufsliste):

| Bereich | erkannt auch als |
|---|---|
| Obst & Gemüse | Obst/Gemüse, Gemüse, Salat |
| Brot & Backwaren | Brot, Bäcker |
| Kühlregal | Kühl, Molkerei, Milchprodukte |
| Fleisch & Fisch | Fleisch, Fisch, Wurst, Geflügel |
| Trockenware | Nudeln, Reis, Backzutaten, Müsli |
| Konserven & Gläser | Konserven, Dose, Glas |
| Gewürze, Öl & Soßen | Gewürze/Saucen, Öl, Soße, Essig |
| Tiefkühl | TK, gefroren |
| Getränke | |
| Sonstiges | |

**Werte pro 100 g** – vier Zahlen, immer im Zustand der angegebenen Menge (Reis, Nudeln,
Couscous trocken, Fleisch roh). Reihenfolge egal, Kennbuchstaben:
`kcal`, `P` (Protein), `K` (Kohlenhydrate), `F` (Fett).
Auch erkannt: `Protein 23`, `Eiweiß 23`, `KH 0`, `Fett 1,5`, `23 g Protein`.
Bei Flüssigkeiten gelten die Werte pro 100 ml.

## Schritte

- `1. Text [12 min]` – Zeit in eckigen Klammern, auch `[1 h 10 min]` oder `[30 s]`.
- `[12 min nebenbei]` – man kann währenddessen etwas anderes tun (Reis köchelt, Ofen läuft,
  Abkühlen). Die Kochsession nutzt das später, um mehrere Rezepte gleichzeitig zu führen.
- `Tipp: …` direkt unter einem Schritt gehört zu diesem Schritt: Energie- und Zeitspar-Tipps
  (Wasserkocher statt Topf, Restwärme, Deckel drauf, Ofen nur wenn nötig).
- Weitere Zeilen ohne Nummer werden an den Schritt davor angehängt.

## Beispiel

Siehe `beispiel-rezept.txt` (Hauptmahlzeit und Hungersnack). In der App: **Mehr → Beispielrezepte laden**.

```
=== KOCHWERK REZEPT ===
Name: Skyr mit Beeren
Kategorie: Hungersnack
Portionen: 1
Haltbar: 1 Tag
Einfrierbar: nein
Boxtauglich: ja
Zutaten:
- Skyr natur | 250 g | Becher 500 g | Kühlregal | 63 kcal, 11 P, 4 K, 0,2 F
- Beerenmischung (TK) | 100 g | Beutel 750 g | Tiefkühl | 40 kcal, 1 P, 6 K, 0,4 F
Schritte:
1. Beeren gefroren auf den Skyr geben und 5 Minuten antauen lassen. [5 min nebenbei]
   Tipp: Abends in die Box geben, dann sind die Beeren mittags aufgetaut.
=== ENDE ===
```

## Prüfen

`node kochwerk/test.js` liest das Beispiel und einen Block genau im Format des Chat-Skills ein und
prüft alle Felder.
