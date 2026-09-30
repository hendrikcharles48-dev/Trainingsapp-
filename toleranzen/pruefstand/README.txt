Prüfstand für den Reiter „Foto“: 17 Testzeichnungen mit Soll-Ergebnis (drawings.js), teils mit Handyfoto-Effekten
und zwei Fotos eines Blatts schräg auf einem Tisch (Zuschneiden und Entzerren).
run.js rendert sie mit Playwright, lässt sie durch die App laufen (mit dem Zuschneide-Schritt) und zählt gefundene, fehlende und falsche Maße.
region.js prüft „Stelle genauer ansehen“: um jedes Maß, das der normale Lauf nicht gefunden hat, wird ein Rahmen gezogen.
Voraussetzung: docs/toleranzen wird auf http://localhost:8766 ausgeliefert (z. B. npx http-server -p 8766 docs/toleranzen),
und run.js ist einmal gelaufen (es legt die Bilder in out/ ab, die region.js braucht).
Aufruf: node toleranzen/pruefstand/run.js   oder nur einzelne Zeichnungen: node toleranzen/pruefstand/run.js 1,6,9
        node toleranzen/pruefstand/region.js
Stand 30.09.2026: 75 von 90 Maßen gefunden (83 %), 10 falsche zusätzlich, Schriftfeld 17 von 17 richtig.
Nachsuche: von 15 fehlenden Maßen 10 direkt gefunden, 2 weitere als Auswahl angeboten.
(Zeichnung 6 hat zufälliges Rauschen, ihr Ergebnis schwankt von Lauf zu Lauf.)
