Prüfstand für den Reiter „Foto“: 15 Testzeichnungen mit Soll-Ergebnis (drawings.js), teils mit Handyfoto-Effekten.
run.js rendert sie mit Playwright, lässt sie durch die App laufen und zählt gefundene, fehlende und falsche Maße.
Voraussetzung: docs/toleranzen wird auf http://localhost:8766 ausgeliefert (z. B. npx http-server -p 8766 docs/toleranzen).
Aufruf: node toleranzen/pruefstand/run.js   oder nur einzelne Zeichnungen: node toleranzen/pruefstand/run.js 1,6,9
Stand 30.09.2026: 63 von 79 Maßen gefunden (80 %), 7 falsche zusätzlich, Schriftfeld 15 von 15 richtig.
