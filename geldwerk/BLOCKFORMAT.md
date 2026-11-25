# Geldwerk-Block – Format

Ein Geldwerk-Block ist einfacher Text, den Claude im Chat aus einem Foto erzeugt (Lohnsteuerbescheinigung,
Steuerbescheid, Aufstiegs-BAföG-Bescheid, Versicherungsschein, Vertrag, Rechnung). In Geldwerk:
**Plus → Block einfügen → „Aus Zwischenablage einfügen“ → Vorschau prüfen → „Übernehmen“.**

Diese Datei ist so geschrieben, dass sie direkt als Anleitung für einen Claude-Skill „geldwerk-block“ taugt.

## Regeln für Claude (Skill-Anleitung)

Wenn Hendrik ein Foto eines Dokuments schickt und „Geldwerk“ schreibt:

1. Dokumentart erkennen und **genau einen Block pro Dokument** ausgeben – in einem Codeblock, damit er ihn mit einem
   Tipp kopieren kann. Mehrere Dokumente = mehrere Blöcke hintereinander im selben Codeblock.
2. Jeder Block beginnt mit `#GELDWERK` und endet mit `#ENDE`. Dazwischen eine Angabe pro Zeile: `feld: wert`.
3. Nur Werte eintragen, die **auf dem Dokument stehen**. Nichts schätzen oder raten. Fehlt etwas: Zeile weglassen.
4. Beträge deutsch schreiben (`1.234,56`), ohne €-Zeichen. Datum als `TT.MM.JJJJ`.
5. Keine IBAN, keine Steuer-ID, keine Sozialversicherungsnummer, keine Adresse in den Block schreiben – die App braucht
   sie nicht.
6. Unter dem Codeblock in einem Satz sagen, was unsicher war (z. B. „Zeile 26 war schlecht lesbar – bitte prüfen“).

Groß-/Kleinschreibung, Umlaute und Zusätze in Klammern bei den Feldnamen sind egal
(`Bruttolohn (Zeile 3)` = `bruttolohn`). Unbekannte Felder zeigt die App als Hinweis an und übernimmt sie nicht.

## Typen und Felder

### `typ: Lohnsteuerbescheinigung`
| Feld | Bedeutung |
|---|---|
| `jahr` | Kalenderjahr der Bescheinigung (Pflicht) |
| `bruttolohn` | Bruttoarbeitslohn (Pflicht) |
| `lohnsteuer` | einbehaltene Lohnsteuer (Pflicht) |
| `soli` | einbehaltener Solidaritätszuschlag |
| `kirchensteuer` | einbehaltene Kirchensteuer (Arbeitnehmer) |
| `rentenversicherung` | Arbeitnehmeranteil Rentenversicherung |
| `krankenversicherung` | Arbeitnehmeranteil Krankenversicherung |
| `pflegeversicherung` | Arbeitnehmeranteil Pflegeversicherung |
| `arbeitslosenversicherung` | Arbeitnehmeranteil Arbeitslosenversicherung |
| `arbeitgeber` | Name des Arbeitgebers |

Mehrere Bescheinigungen im selben Jahr (z. B. Hauptjob + individuell versteuerter Nebenjob): Beträge addieren und
im Satz darunter erwähnen. Ein **pauschal versteuerter Minijob** hat keine Lohnsteuerbescheinigung und gehört nicht in den Block.

```
#GELDWERK
typ: Lohnsteuerbescheinigung
jahr: 2026
arbeitgeber: Muster Zerspanung GmbH
bruttolohn: 22.416,00
lohnsteuer: 2.391,50
soli: 0,00
kirchensteuer: 0,00
rentenversicherung: 2.084,69
krankenversicherung: 1.961,40
pflegeversicherung: 537,98
arbeitslosenversicherung: 291,41
#ENDE
```

### `typ: Steuerbescheid`
| Feld | Bedeutung |
|---|---|
| `jahr` | Jahr, für das der Bescheid gilt (Pflicht) |
| `festgesetzt` | festgesetzte Einkommensteuer |
| `erstattung` | Erstattungsbetrag (positiv) |
| `nachzahlung` | Nachzahlungsbetrag (positiv) |
| `verlustvortrag` | verbleibender Verlustvortrag laut Feststellungsbescheid (wird ins Folgejahr übernommen) |
| `datum` | Datum des Bescheids |

Die App markiert das Jahr dann als „abgegeben“ und nimmt den Verlustvortrag als Startwert fürs nächste Jahr.

```
#GELDWERK
typ: Steuerbescheid
jahr: 2027
festgesetzt: 0,00
verlustvortrag: 4.812,00
datum: 12.05.2028
#ENDE
```

### `typ: Aufstiegs-BAföG`
| Feld | Bedeutung |
|---|---|
| `jahr` | Jahr, in dem die Gebühren gezahlt wurden (Pflicht) |
| `zuschuss` | **Zuschussanteil** zu Lehrgangs- und Prüfungsgebühren (wird von den Fortbildungskosten abgezogen) |
| `darlehen` | Darlehensanteil (nur zur Info, mindert nichts) |
| `lehrgangsgebuehren` | bewilligte Lehrgangsgebühren gesamt (Info) |
| `pruefungsgebuehr` | bewilligte Prüfungsgebühr (Info) |

Verteilt sich die Förderung auf mehrere Jahre: je Jahr einen Block mit dem Zuschuss, der zu den in diesem Jahr gezahlten
Gebühren gehört. Unterhaltsbeitrag nicht eintragen.

```
#GELDWERK
typ: Aufstiegs-BAföG
jahr: 2026
zuschuss: 2.500,00
darlehen: 2.500,00
#ENDE
```

### `typ: Vertrag` (auch Versicherungsschein, Abo)
| Feld | Bedeutung |
|---|---|
| `vorlage` | `Kfz-Versicherung`, `Handy`, `Internet`, `Strom`, `Streaming`, `Fitness` oder `Sonstiges` |
| `anbieter` | Firma (Pflicht) |
| `name` | Tarif/Bezeichnung |
| `betrag` | Beitrag je Zahlung |
| `rhythmus` | `monatlich`, `vierteljährlich`, `halbjährlich`, `jährlich` |
| `beginn` | Vertragsbeginn |
| `mindestlaufzeit` | in Monaten (oder „2 Jahre“) |
| `verlaengerung` | Monate, um die er sich danach verlängert (1 = monatlich kündbar) |
| `kuendigungsfrist` | z. B. `1 Monat`, `3 Monate`, `14 Tage` |
| `ablauf` | festes Vertragsjahr-Ende, z. B. `31.12.` (Kfz: Hauptfälligkeit) |
| `kundennummer`, `vertragsnummer` | für die Kündigung |
| `email` | Adresse für Kündigungen, falls angegeben |
| `steuerlich` | `ja`/`nein` |

```
#GELDWERK
typ: Vertrag
vorlage: Kfz-Versicherung
anbieter: HUK-Coburg
name: Kfz-Haftpflicht + Teilkasko
betrag: 456,12
rhythmus: jährlich
ablauf: 31.12.
kuendigungsfrist: 1 Monat
vertragsnummer: 123/456789-X
steuerlich: ja
#ENDE
```

### `typ: Beleg` (Rechnung ohne Foto in der App)
| Feld | Bedeutung |
|---|---|
| `haendler` | Händler/Aussteller |
| `betrag` | Gesamtbetrag brutto (Pflicht) |
| `datum` | Rechnungs- bzw. Zahlungsdatum |
| `kategorie` | `Lehrgang`, `Fachbuch`, `Computer`, `Arbeitsmittel`, `Büro`, `Kleidung`, `Reise`, `Bewerbung`, `Spende`, `Privat` |
| `kaufart` | `Laden` oder `Online` |
| `beruflich` | beruflicher Anteil in % |
| `garantie` | Herstellergarantie in Jahren |
| `notiz` | kurz, z. B. Seriennummer |

```
#GELDWERK
typ: Beleg
haendler: Technikakademie Northeim
betrag: 1.450,00
datum: 15.08.2026
kategorie: Lehrgang
notiz: Lehrgangsgebühr 1. Semester
#ENDE
```

## Technik
Der Leser steht in `parse.js` (`blocks()`), Tests in `test/run.js` („Block: …“).
