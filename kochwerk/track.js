// Kochwerk – Tagebuch: jedes Lebensmittel einzeln mit allen Nährwerten.
// Quellen: Grundliste (offline, Durchschnittswerte), Open Food Facts (online, Markenprodukte, kostenlos ohne Schlüssel),
// eigene Lebensmittel und Kochwerk-Rezepte. Geplante Mahlzeiten erscheinen automatisch („aus dem Plan“).
// Hängt an KW als KW.T. Läuft im Browser und in Node (Tests).
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    const KW = require('./core.js'); KW.P = KW.P || require('./plan.js'); module.exports = KW.T = factory(KW);
  } else root.KW.T = factory(root.KW);
})(typeof self !== 'undefined' ? self : this, function (KW) {
  'use strict';
  const P = KW.P;

  // ---------- Nährwerte ----------
  const FIELDS = ['kcal', 'p', 'c', 'sug', 'f', 'sat', 'fib', 'salt'];
  const LABELS = { kcal: 'Kalorien', p: 'Eiweiß', c: 'Kohlenhydrate', sug: 'davon Zucker', f: 'Fett', sat: 'davon gesättigte Fettsäuren', fib: 'Ballaststoffe', salt: 'Salz' };
  const SHORT = { kcal: 'kcal', p: 'Eiweiß', c: 'KH', sug: 'Zucker', f: 'Fett', sat: 'ges. Fett', fib: 'Ballastst.', salt: 'Salz' };
  const UNIT = { kcal: 'kcal' };

  // ---------- Grundliste ----------
  // Durchschnittswerte pro 100 g (EU-Kohlenhydrate ohne Ballaststoffe), roh bzw. wie üblich gekauft.
  // [Name|Suchwörter, kcal, Eiweiß, KH, Zucker, Fett, ges. Fett, Ballaststoffe, Salz, Portion „Name:Gramm“]
  const B = [
    // Obst
    ['Apfel|Äpfel', 52, 0.3, 11.4, 10.3, 0.2, 0, 2.4, 0, 'Stück:150'],
    ['Banane', 89, 1.1, 20, 12, 0.3, 0.1, 2.6, 0, 'Stück:120'],
    ['Birne', 57, 0.4, 12, 10, 0.1, 0, 3.1, 0, 'Stück:160'],
    ['Orange|Apfelsine', 47, 0.9, 9, 8.5, 0.1, 0, 2.2, 0, 'Stück:150'],
    ['Mandarine|Clementine', 53, 0.8, 11, 10.5, 0.3, 0, 1.8, 0, 'Stück:60'],
    ['Kiwi', 61, 1.1, 10.5, 9, 0.5, 0, 3, 0, 'Stück:75'],
    ['Erdbeeren', 32, 0.7, 5.5, 4.9, 0.3, 0, 2, 0, 'Handvoll:100'],
    ['Heidelbeeren|Blaubeeren', 57, 0.7, 12, 10, 0.3, 0, 2.4, 0, 'Handvoll:80'],
    ['Himbeeren', 52, 1.2, 5.4, 4.4, 0.7, 0, 6.5, 0, 'Handvoll:80'],
    ['Weintrauben|Trauben', 69, 0.7, 16, 16, 0.2, 0.1, 0.9, 0, 'Handvoll:100'],
    ['Ananas', 50, 0.5, 12, 10, 0.1, 0, 1.4, 0, 'Scheibe:80'],
    ['Mango', 60, 0.8, 13, 13, 0.4, 0.1, 1.6, 0, 'Stück:300'],
    ['Wassermelone|Melone', 30, 0.6, 7.6, 6.2, 0.2, 0, 0.4, 0, 'Scheibe:250'],
    ['Pfirsich', 39, 0.9, 9, 8.4, 0.3, 0, 1.5, 0, 'Stück:150'],
    ['Nektarine', 44, 1.1, 9, 7.9, 0.3, 0, 1.7, 0, 'Stück:140'],
    ['Pflaumen|Zwetschgen', 46, 0.7, 10, 10, 0.3, 0, 1.4, 0, 'Stück:35'],
    ['Avocado', 160, 2, 1.9, 0.7, 14.7, 2.1, 6.7, 0, 'Stück:150'],
    ['Zitrone', 29, 1.1, 3, 2.5, 0.3, 0, 2.8, 0, 'Stück:100'],
    ['Beerenmischung (TK)|Beeren TK', 40, 1, 6, 5, 0.4, 0, 4, 0, 'Handvoll:80'],
    ['Datteln (getrocknet)', 282, 2.5, 66, 63, 0.4, 0, 8, 0, 'Stück:8'],
    ['Rosinen', 299, 3.1, 76, 59, 0.5, 0.1, 3.7, 0, 'EL:15'],
    // Gemüse
    ['Tomate|Tomaten', 18, 0.9, 2.6, 2.6, 0.2, 0, 1.2, 0, 'Stück:100'],
    ['Cherrytomaten|Kirschtomaten', 22, 1, 3.5, 3, 0.3, 0, 1.3, 0, 'Handvoll:100'],
    ['Gurke|Salatgurke', 12, 0.6, 1.8, 1.7, 0.2, 0, 0.5, 0, 'Stück:400'],
    ['Paprika', 31, 1, 6, 4.2, 0.3, 0, 2.1, 0, 'Stück:150'],
    ['Möhre|Karotte|Möhren|Karotten', 36, 0.9, 7, 4.7, 0.2, 0, 2.8, 0.1, 'Stück:80'],
    ['Brokkoli', 34, 2.8, 2.7, 1.7, 0.4, 0, 3, 0, 'Portion:200'],
    ['Blumenkohl', 25, 2, 2.3, 2.2, 0.3, 0, 2.9, 0, 'Portion:200'],
    ['Zucchini', 19, 1.6, 2.3, 2, 0.4, 0.1, 1, 0, 'Stück:250'],
    ['Aubergine', 24, 1, 2.5, 2.4, 0.2, 0, 2.8, 0, 'Stück:300'],
    ['Spinat|Blattspinat', 23, 2.9, 0.6, 0.4, 0.4, 0.1, 2.6, 0.2, 'Portion:150'],
    ['Feldsalat', 21, 1.8, 0.7, 0.5, 0.4, 0, 1.5, 0, 'Portion:50'],
    ['Eisbergsalat', 14, 0.9, 1.6, 1.6, 0.2, 0, 1.2, 0, 'Portion:80'],
    ['Kopfsalat|Blattsalat', 14, 1.3, 1.1, 1, 0.2, 0, 1.4, 0, 'Portion:80'],
    ['Rucola', 25, 2.6, 2, 2, 0.7, 0.1, 1.6, 0, 'Portion:40'],
    ['Weißkohl', 25, 1.4, 4.2, 3.8, 0.2, 0, 2.5, 0, 'Portion:200'],
    ['Rotkohl', 29, 1.5, 3.5, 3.3, 0.2, 0, 2.5, 0, 'Portion:200'],
    ['Spitzkohl', 28, 1.6, 4, 3.5, 0.3, 0, 2.5, 0, 'Portion:200'],
    ['Sauerkraut', 20, 1.5, 1.5, 0.8, 0.3, 0, 2.1, 1.3, 'Portion:150'],
    ['Lauch|Porree', 30, 2, 4, 2.5, 0.3, 0, 2.3, 0, 'Stück:250'],
    ['Zwiebel|Zwiebeln', 40, 1.2, 9, 4.7, 0.1, 0, 1.8, 0, 'Stück:80'],
    ['Knoblauch', 140, 6, 28, 1.6, 0.5, 0.1, 1.8, 0, 'Zehe:4'],
    ['Champignons|Pilze', 22, 3.1, 0.6, 0.2, 0.3, 0, 2, 0, 'Portion:100'],
    ['Mais (Dose, abgetropft)|Mais', 80, 2.9, 15, 4, 1.2, 0.2, 2.6, 0.6, 'Dose:140'],
    ['Erbsen (TK)|Erbsen', 80, 5.5, 11, 4, 0.5, 0.1, 5, 0, 'Portion:150'],
    ['Grüne Bohnen|Bohnen grün', 33, 1.8, 5, 1.5, 0.2, 0, 2, 0, 'Portion:150'],
    ['Kartoffeln|Kartoffel', 70, 2, 15, 0.8, 0.1, 0, 1.4, 0, 'Stück:100'],
    ['Süßkartoffel', 86, 1.6, 18, 4.2, 0.1, 0, 3, 0.1, 'Stück:250'],
    ['Kürbis (Hokkaido)|Kürbis', 63, 1.7, 12.6, 5, 0.6, 0.1, 2.5, 0, 'Portion:200'],
    ['Rote Bete', 43, 1.6, 8.4, 7, 0.1, 0, 2.5, 0.2, 'Stück:100'],
    ['Radieschen', 16, 1, 2.1, 1.9, 0.1, 0, 1.6, 0, 'Bund:150'],
    ['Staudensellerie|Sellerie', 16, 0.7, 2.2, 1.3, 0.2, 0, 1.6, 0.2, 'Stange:40'],
    ['Frühlingszwiebeln|Lauchzwiebeln', 32, 1.8, 4.7, 2.3, 0.2, 0, 2.6, 0, 'Stück:15'],
    ['Kichererbsen (Dose, abgetropft)|Kichererbsen', 120, 7, 15, 0.5, 2.6, 0.3, 5, 0.6, 'Dose:240'],
    ['Kidneybohnen (Dose, abgetropft)|Kidneybohnen', 100, 7.5, 13, 0.5, 0.5, 0.1, 6, 0.5, 'Dose:250'],
    ['Rote Linsen (trocken)|Linsen', 340, 24, 49, 2, 1.5, 0.2, 11, 0, 'Portion:60'],
    ['Linsen (gekocht)', 116, 9, 17, 1.8, 0.4, 0.1, 8, 0, 'Portion:150'],
    // Getreide, Beilagen, Brot
    ['Reis (roh)|Reis trocken|Basmatireis', 350, 7.5, 77, 0.2, 0.6, 0.2, 1.4, 0, 'Portion:75'],
    ['Reis (gekocht)', 130, 2.7, 28, 0.1, 0.3, 0.1, 0.4, 0, 'Portion:200'],
    ['Vollkornreis (roh)', 350, 7.5, 72, 0.7, 2.7, 0.6, 3.5, 0, 'Portion:75'],
    ['Nudeln (roh)|Spaghetti|Pasta', 355, 12, 70, 3, 1.5, 0.3, 3, 0, 'Portion:100'],
    ['Nudeln (gekocht)', 150, 5, 30, 0.6, 0.9, 0.2, 1.8, 0, 'Portion:250'],
    ['Vollkornnudeln (roh)', 350, 13, 64, 3, 2.5, 0.4, 8, 0, 'Portion:100'],
    ['Haferflocken', 372, 13.5, 58.7, 0.7, 7, 1.3, 10, 0, 'Portion:50'],
    ['Couscous (roh)', 355, 12, 72, 0.5, 1.5, 0.3, 5, 0, 'Portion:75'],
    ['Bulgur (roh)', 350, 12, 69, 0.4, 1.5, 0.2, 8, 0, 'Portion:75'],
    ['Quinoa (roh)', 368, 14, 64, 0, 6, 0.7, 7, 0, 'Portion:75'],
    ['Müsli (ohne Zuckerzusatz)|Müsli', 365, 10, 60, 15, 7, 1.2, 9, 0.1, 'Portion:50'],
    ['Cornflakes', 377, 7, 84, 8, 0.9, 0.2, 3, 1.1, 'Portion:30'],
    ['Vollkornbrot', 220, 7, 38, 3, 1.5, 0.3, 7, 1.1, 'Scheibe:50'],
    ['Mischbrot|Brot', 240, 7, 47, 2, 1.3, 0.3, 5, 1.2, 'Scheibe:45'],
    ['Toastbrot|Toast', 260, 8, 47, 5, 3.5, 0.6, 3, 1.2, 'Scheibe:25'],
    ['Vollkorntoast', 245, 9, 40, 4, 3.5, 0.6, 6, 1.1, 'Scheibe:28'],
    ['Brötchen|Semmel|Weizenbrötchen', 270, 9, 54, 2, 1.5, 0.3, 3, 1.3, 'Stück:55'],
    ['Vollkornbrötchen', 245, 9, 43, 2.5, 2.5, 0.4, 6, 1.1, 'Stück:65'],
    ['Laugenbrezel|Brezel', 270, 8, 54, 1, 2.5, 0.4, 2.5, 2.4, 'Stück:80'],
    ['Knäckebrot', 360, 10, 66, 2, 2, 0.3, 15, 1, 'Scheibe:10'],
    ['Wrap (Weizen)|Tortilla', 300, 8.5, 50, 2.5, 7, 2.5, 3, 1.2, 'Stück:60'],
    ['Reiswaffel', 385, 8, 80, 0.5, 3, 0.6, 4, 0.1, 'Stück:8'],
    ['Croissant', 410, 8, 45, 8, 21, 13, 2, 0.9, 'Stück:60'],
    // Milchprodukte, Eier
    ['Milch 1,5 %|Milch fettarm|Milch', 47, 3.4, 4.8, 4.8, 1.5, 1, 0, 0.1, 'Glas:200'],
    ['Milch 3,5 %|Vollmilch', 64, 3.3, 4.8, 4.8, 3.5, 2.3, 0, 0.1, 'Glas:200'],
    ['Haferdrink|Hafermilch', 46, 0.5, 6.7, 4, 1.5, 0.2, 0.8, 0.1, 'Glas:200'],
    ['Magerquark|Quark', 67, 12, 4, 4, 0.2, 0.1, 0, 0.1, 'Becher:250'],
    ['Speisequark 20 %', 109, 12, 3.5, 3.5, 5, 3, 0, 0.1, 'Becher:250'],
    ['Skyr', 63, 11, 4, 4, 0.2, 0.1, 0, 0.1, 'Becher:150'],
    ['Naturjoghurt 1,5 %|Joghurt', 50, 4, 6, 6, 1.5, 1, 0, 0.1, 'Becher:150'],
    ['Naturjoghurt 3,5 %', 63, 3.5, 4.7, 4.7, 3.5, 2.3, 0, 0.1, 'Becher:150'],
    ['Griechischer Joghurt 10 %', 125, 4, 4, 4, 10, 7, 0, 0.1, 'Portion:150'],
    ['Körniger Frischkäse|Hüttenkäse', 98, 12, 2.6, 2.6, 4.3, 2.8, 0, 0.7, 'Becher:200'],
    ['Frischkäse light', 115, 11, 4, 4, 6, 4, 0, 0.8, 'EL:20'],
    ['Frischkäse (Doppelrahm)|Frischkäse', 260, 6, 3.5, 3.5, 24, 16, 0, 0.8, 'EL:20'],
    ['Gouda', 360, 25, 0, 0, 28, 19, 0, 1.8, 'Scheibe:25'],
    ['Gouda light (30 % Fett i. Tr.)|Käse light', 270, 30, 0, 0, 16, 11, 0, 1.8, 'Scheibe:25'],
    ['Mozzarella', 250, 18, 1, 1, 19, 13, 0, 0.6, 'Kugel:125'],
    ['Mozzarella light', 160, 19, 1, 1, 9, 6, 0, 0.6, 'Kugel:125'],
    ['Feta|Hirtenkäse', 260, 17, 0.7, 0.7, 21, 14, 0, 2.7, 'Portion:50'],
    ['Feta light', 180, 17, 1, 1, 12, 8, 0, 2.7, 'Portion:50'],
    ['Parmesan', 390, 35, 0, 0, 28, 18, 0, 1.6, 'EL:5'],
    ['Butter', 741, 0.7, 0.6, 0.6, 82, 52, 0, 0, 'TL:5'],
    ['Ei|Eier|Hühnerei', 143, 12.6, 0.7, 0.7, 9.5, 2.7, 0, 0.3, 'Stück:60'],
    ['Eiklar|Eiweiß', 48, 10.9, 0.7, 0.7, 0.2, 0, 0, 0.4, 'Stück:35'],
    ['Sahne 30 %|Schlagsahne', 290, 2.4, 3, 3, 30, 20, 0, 0.1, 'EL:15'],
    ['Kochsahne 15 %|Kochsahne', 150, 3, 4, 4, 15, 10, 0, 0.1, 'EL:15'],
    ['Proteinpudding', 75, 10, 6, 4, 1.5, 1, 0, 0.2, 'Becher:200'],
    ['Tofu (natur)|Tofu', 145, 15, 1.5, 0.5, 8.5, 1.3, 2, 0, 'Portion:100'],
    // Fleisch, Wurst, Fisch
    ['Hähnchenbrust (roh)|Hähnchen|Hühnchen', 105, 23.5, 0, 0, 1.2, 0.3, 0, 0.15, 'Stück:150'],
    ['Hähnchenbrust (gebraten)', 150, 30, 0, 0, 3, 0.8, 0, 0.2, 'Stück:110'],
    ['Hähnchenschenkel (roh)', 170, 18, 0, 0, 11, 3, 0, 0.2, 'Stück:200'],
    ['Putenbrust (roh)|Pute', 105, 24, 0, 0, 1, 0.3, 0, 0.15, 'Stück:150'],
    ['Putenhack', 140, 20, 0, 0, 6.5, 2, 0, 0.2, 'Portion:125'],
    ['Rinderhack 5 %', 125, 21, 0, 0, 5, 2, 0, 0.2, 'Portion:125'],
    ['Rinderhack 20 %|Rinderhack', 250, 17, 0, 0, 20, 8, 0, 0.2, 'Portion:125'],
    ['Hackfleisch gemischt|Hackfleisch', 260, 17, 0, 0, 21, 8, 0, 0.2, 'Portion:125'],
    ['Rindersteak|Steak', 140, 22, 0, 0, 5.5, 2.4, 0, 0.15, 'Stück:200'],
    ['Schweinefilet', 110, 21, 0, 0, 2.5, 0.9, 0, 0.15, 'Portion:150'],
    ['Schweineschnitzel|Schnitzel', 115, 22, 0, 0, 2.5, 1, 0, 0.15, 'Stück:150'],
    ['Kochschinken|Schinken', 110, 20, 1, 1, 3, 1, 0, 2.2, 'Scheibe:20'],
    ['Geflügelaufschnitt|Hähnchenbrust-Aufschnitt|Putenaufschnitt', 100, 20, 1.5, 1, 1.5, 0.5, 0, 2, 'Scheibe:15'],
    ['Salami', 380, 22, 1, 0.5, 32, 12, 0, 4.5, 'Scheibe:10'],
    ['Bratwurst', 280, 13, 1, 0.5, 25, 9, 0, 1.8, 'Stück:100'],
    ['Wiener Würstchen|Würstchen', 270, 13, 0.5, 0.5, 24, 9, 0, 2, 'Stück:50'],
    ['Lachs', 200, 20, 0, 0, 13, 3, 0, 0.1, 'Stück:125'],
    ['Seelachs|Alaska-Seelachs', 75, 17, 0, 0, 0.8, 0.1, 0, 0.2, 'Stück:125'],
    ['Thunfisch (Dose, im eigenen Saft)|Thunfisch', 110, 25, 0, 0, 1, 0.3, 0, 0.9, 'Dose:150'],
    ['Garnelen', 70, 16, 0, 0, 0.8, 0.2, 0, 1, 'Portion:100'],
    ['Fischstäbchen', 200, 12, 18, 1, 8.5, 0.9, 1, 0.8, 'Stück:30'],
    // Fertig- und Imbissgerichte
    ['Döner Kebab|Döner', 215, 12, 22, 2, 9, 3, 1.5, 1.2, 'Stück:400'],
    ['Dürüm', 210, 12, 21, 2, 9, 3, 1.5, 1.2, 'Stück:400'],
    ['Pizza Margherita|Pizza', 250, 10, 32, 3, 9, 4, 2, 1.2, 'Stück:350'],
    ['Cheeseburger|Burger', 265, 13, 30, 6, 11, 5, 1.5, 1.5, 'Stück:120'],
    ['Pommes frites|Pommes', 290, 3.5, 35, 0.5, 15, 1.5, 3.5, 0.7, 'Portion:150'],
    ['Currywurst mit Soße|Currywurst', 230, 9, 8, 6, 18, 7, 0.5, 2, 'Portion:250'],
    ['Chicken Nuggets', 260, 15, 16, 0.5, 15, 2.5, 1, 1.2, 'Stück:18'],
    ['Lasagne', 160, 8, 13, 3, 8, 4, 1.5, 0.8, 'Portion:400'],
    // Nüsse, Soja, Aufstriche
    ['Sojagranulat', 340, 50, 15, 7, 1.5, 0.2, 18, 0, 'Portion:50'],
    ['Erdnüsse', 600, 25, 13, 4, 49, 7, 8, 0, 'Handvoll:30'],
    ['Mandeln', 590, 21, 6, 4, 53, 4, 12, 0, 'Handvoll:30'],
    ['Walnüsse', 670, 15, 7, 3, 65, 6, 6, 0, 'Handvoll:30'],
    ['Cashews|Cashewkerne', 580, 18, 30, 6, 46, 9, 3, 0, 'Handvoll:30'],
    ['Erdnussbutter|Erdnussmus', 620, 25, 12, 6, 50, 10, 7, 0.5, 'EL:15'],
    ['Chiasamen', 490, 17, 8, 0, 31, 3.3, 34, 0, 'EL:10'],
    ['Hummus', 250, 7, 13, 0.5, 18, 2, 6, 1.2, 'EL:20'],
    ['Honig', 304, 0.3, 82, 82, 0, 0, 0, 0, 'TL:8'],
    ['Marmelade|Konfitüre', 250, 0.4, 60, 55, 0.1, 0, 1, 0, 'TL:10'],
    ['Nuss-Nougat-Creme|Nutella', 539, 6.3, 57, 56, 31, 10.6, 3.4, 0.1, 'TL:10'],
    // Süßes, Snacks
    ['Proteinriegel', 370, 33, 30, 3, 12, 6, 10, 0.5, 'Stück:60'],
    ['Vollmilchschokolade|Schokolade', 540, 7, 56, 55, 31, 19, 2, 0.2, 'Reihe:20'],
    ['Zartbitterschokolade 70 %', 580, 8, 34, 28, 42, 25, 11, 0, 'Reihe:20'],
    ['Gummibärchen|Fruchtgummi', 340, 7, 77, 46, 0.5, 0.1, 0, 0.1, 'Handvoll:30'],
    ['Kartoffelchips|Chips', 535, 6, 50, 3, 34, 3, 4, 1.4, 'Handvoll:30'],
    ['Butterkeks|Kekse', 440, 7, 73, 22, 12, 6, 2.5, 0.8, 'Stück:8'],
    ['Müsliriegel', 410, 6, 63, 30, 13, 5, 5, 0.3, 'Stück:25'],
    ['Vanilleeis|Eis', 210, 3.5, 24, 21, 11, 7, 0, 0.1, 'Kugel:60'],
    ['Rührkuchen|Kuchen', 400, 6, 50, 28, 19, 10, 1, 0.5, 'Stück:80'],
    // Getränke (pro 100 ml)
    ['Cola', 42, 0, 10.6, 10.6, 0, 0, 0, 0, 'Glas:250'],
    ['Cola Zero|Cola light', 0.3, 0, 0, 0, 0, 0, 0, 0.02, 'Glas:250'],
    ['Apfelsaft', 46, 0.1, 11, 10, 0.1, 0, 0.2, 0, 'Glas:200'],
    ['Orangensaft', 45, 0.7, 9.5, 8.5, 0.2, 0, 0.2, 0, 'Glas:200'],
    ['Apfelschorle|Schorle', 24, 0, 5.5, 5.5, 0, 0, 0, 0, 'Glas:300'],
    ['Bier', 42, 0.5, 3, 0, 0, 0, 0, 0, 'Flasche:500'],
    ['Energy Drink', 45, 0, 11, 11, 0, 0, 0, 0.1, 'Dose:250'],
    ['Kaffee (schwarz)|Kaffee', 2, 0.1, 0.3, 0, 0, 0, 0, 0, 'Tasse:150'],
    ['Cappuccino', 40, 2.2, 3, 3, 2, 1.3, 0, 0.1, 'Tasse:200'],
    ['Whey-Proteinpulver|Proteinpulver|Whey', 380, 75, 7, 5, 6, 3.5, 1, 0.5, 'Messlöffel:30'],
    // Öle, Soßen
    ['Rapsöl|Öl', 884, 0, 0, 0, 100, 7, 0, 0, 'EL:10'],
    ['Olivenöl', 884, 0, 0, 0, 100, 14, 0, 0, 'EL:10'],
    ['Ketchup', 100, 1.2, 23, 22, 0.1, 0, 0.3, 1.8, 'EL:15'],
    ['Mayonnaise', 680, 1, 1.5, 1, 75, 6, 0, 1.5, 'EL:15'],
    ['Senf', 90, 6, 6, 3, 4, 0.3, 3, 3, 'TL:5'],
    ['Sojasoße', 60, 8, 6, 1, 0, 0, 0, 14, 'EL:15'],
    ['Pesto', 450, 5, 6, 4, 45, 6, 2, 2.5, 'EL:15'],
    ['Passierte Tomaten|Tomatensoße', 30, 1.4, 5, 4, 0.2, 0, 1.5, 0.3, 'Portion:100'],
    ['Gemüsebrühe (Pulver)', 230, 8, 25, 10, 10, 5, 1, 50, 'TL:5']
  ];
  const slug = s => KW.norm(s).replace(/\s+/g, '-');
  const BASE = B.map(a => {
    const names = a[0].split('|');
    const per100 = {}; FIELDS.forEach((f, k) => { per100[f] = a[k + 1]; });
    const portions = [];
    if (a[9]) { const [l, g] = a[9].split(':'); portions.push({ label: '1 ' + l, g: +g }); }
    return { id: 'b:' + slug(names[0]), name: names[0], alt: names.slice(1), per100, portions, src: 'base' };
  });

  // ---------- Lebensmittel aus allen Quellen ----------
  function recipeFood(r) {
    const t = KW.recipeTotals(r), g = t.portion.g || 1;
    const per100 = { kcal: t.portion.kcal / g * 100, p: t.portion.p / g * 100, c: t.portion.c / g * 100, f: t.portion.f / g * 100, sug: null, sat: null, fib: null, salt: null };
    return { id: 'r:' + r.id, rid: r.id, name: r.name, per100, portions: [{ label: '1 Portion', g: Math.round(g) }], src: 'recipe' };
  }
  const ownFoods = db => KW.live(db, 'foods').filter(f => !f.hidden);
  function allFoods(db) {
    return ownFoods(db).concat(BASE, KW.live(db, 'recipes').map(recipeFood));
  }
  function findFood(db, id) {
    if (!id) return null;
    if (id.startsWith('b:')) return BASE.find(f => f.id === id) || null;
    if (id.startsWith('r:')) { const r = db.recipes[id.slice(2)]; return r && !r.del ? recipeFood(r) : null; }
    const f = db.foods && db.foods[id]; return f && !f.del ? f : null;
  }
  // Suche: Anfang des Namens vor Wortanfang vor irgendwo. Oft Gegessenes und Favoriten zuerst.
  function search(db, q, n = 40) {
    const nq = KW.norm(q);
    const use = usage(db);
    const rank = f => {
      const names = [f.name].concat(f.alt || [], f.brand ? [f.brand + ' ' + f.name] : []).map(KW.norm);
      let s = 0;
      for (const x of names) {
        if (!nq) s = Math.max(s, 1);
        else if (x === nq) s = Math.max(s, 100);
        else if (x.startsWith(nq)) s = Math.max(s, 60);
        else if (x.split(' ').some(w => w.startsWith(nq))) s = Math.max(s, 40);
        else if (x.includes(nq)) s = Math.max(s, 20);
        else if (nq.split(' ').every(w => x.includes(w))) s = Math.max(s, 15);
      }
      if (!s) return 0;
      const u = use[f.id];
      return s + (f.fav ? 30 : 0) + (u ? Math.min(25, u.n * 3) : 0) + (f.src === 'recipe' ? 2 : 0);
    };
    return allFoods(db).map(f => ({ f, s: rank(f) })).filter(x => x.s > 0).sort((a, b) => b.s - a.s || a.f.name.localeCompare(b.f.name, 'de')).slice(0, n).map(x => x.f);
  }
  function usage(db) {
    const u = {};
    for (const e of KW.live(db, 'log')) if (e.foodId) { const x = u[e.foodId] = u[e.foodId] || { n: 0, last: '' }; x.n++; if (e.date > x.last) x.last = e.date; }
    return u;
  }
  function recent(db, n = 20) {
    const u = usage(db);
    return Object.keys(u).sort((a, b) => u[b].last.localeCompare(u[a].last) || u[b].n - u[a].n).map(id => findFood(db, id)).filter(Boolean).slice(0, n);
  }
  const favorites = db => ownFoods(db).filter(f => f.fav).concat(BASE.filter(b => db.foods && db.foods['fav:' + b.id] && !db.foods['fav:' + b.id].del));
  function isFav(db, f) { return f.src === 'base' ? !!(db.foods['fav:' + f.id] && !db.foods['fav:' + f.id].del) : !!f.fav; }
  function toggleFav(db, f) {
    if (f.src === 'base') { if (isFav(db, f)) KW.remove(db, 'foods', 'fav:' + f.id); else KW.put(db, 'foods', { id: 'fav:' + f.id, favOf: f.id, name: f.name, hidden: true }); return; }
    if (f.src === 'recipe') return;
    KW.put(db, 'foods', Object.assign({}, f, { fav: !f.fav }));
  }
  // Eigene oder aus Open Food Facts gespeicherte Lebensmittel
  function saveFood(db, f) {
    const rec = Object.assign({}, f);
    if (!rec.id) rec.id = 'u:' + KW.uid();
    if (!rec.src) rec.src = 'own';
    return KW.put(db, 'foods', rec);
  }

  // ---------- Open Food Facts ----------
  const OFF = 'https://world.openfoodfacts.org';
  const OFF_FIELDS = 'code,product_name,product_name_de,generic_name_de,brands,quantity,serving_size,serving_quantity,nutriments';
  const n2 = v => (v == null || v === '' || !isFinite(+v)) ? null : Math.round(+v * 100) / 100;
  function fromOff(p) {
    if (!p) return null;
    const nm = p.nutriments || {};
    let kcal = n2(nm['energy-kcal_100g']);
    if (kcal == null && nm.energy_100g != null) kcal = n2(nm.energy_100g / 4.184);
    const name = (p.product_name_de || p.product_name || p.generic_name_de || '').trim();
    if (!name || kcal == null) return null;
    const per100 = { kcal, p: n2(nm.proteins_100g), c: n2(nm.carbohydrates_100g), sug: n2(nm.sugars_100g), f: n2(nm.fat_100g), sat: n2(nm['saturated-fat_100g']), fib: n2(nm.fiber_100g), salt: n2(nm.salt_100g) };
    const portions = [];
    const sq = n2(p.serving_quantity);
    if (sq && sq > 0) portions.push({ label: '1 Portion', g: sq });
    const q = /^(\d+(?:[.,]\d+)?)\s*(g|ml)\b/i.exec(String(p.quantity || '').trim());
    if (q) portions.push({ label: '1 Packung', g: n2(q[1].replace(',', '.')) });
    return { id: 'o:' + p.code, code: String(p.code), name, brand: (p.brands || '').split(',')[0].trim(), per100, portions, src: 'off' };
  }
  async function offBarcode(code, fetchFn) {
    const f = fetchFn || fetch.bind(globalThis);
    const r = await f(OFF + '/api/v2/product/' + encodeURIComponent(code) + '.json?fields=' + OFF_FIELDS);
    if (r.status === 404) return null;
    if (!r.ok) throw new Error('off ' + r.status);
    const j = await r.json();
    return j && j.status === 1 ? fromOff(Object.assign({ code }, j.product)) : null;
  }
  async function offSearch(q, fetchFn) {
    const f = fetchFn || fetch.bind(globalThis);
    const url = OFF + '/cgi/search.pl?search_terms=' + encodeURIComponent(q) + '&search_simple=1&action=process&json=1&page_size=24&sort_by=unique_scans_n'
      + '&tagtype_0=countries&tag_contains_0=contains&tag_0=germany&fields=' + OFF_FIELDS;
    const r = await f(url);
    if (!r.ok) throw new Error('off ' + r.status);
    const j = await r.json();
    return (j.products || []).map(fromOff).filter(Boolean);
  }
  const isBarcode = s => /^\d{8,14}$/.test(String(s || '').trim());

  // ---------- Tagebuch ----------
  const MEALS = [
    { id: 'breakfast', label: 'Frühstück', icon: '🥣' },
    { id: 'lunch', label: 'Mittag', icon: '🍽️' },
    { id: 'dinner', label: 'Abendessen', icon: '🌙' },
    { id: 'snack', label: 'Snacks', icon: '🍏' }
  ];
  const mealOfPlan = m => m === 'box' ? 'lunch' : (m === 'breakfast' || m === 'lunch' || m === 'dinner') ? m : 'snack';
  function mealByTime(h) { return h < 10 ? 'breakfast' : h < 15 ? 'lunch' : h < 17 ? 'snack' : h < 22 ? 'dinner' : 'snack'; }
  function nutr(per100, g) {
    const o = {};
    for (const k of FIELDS) o[k] = per100 && per100[k] != null ? per100[k] * g / 100 : null;
    return o;
  }
  function addLog(db, date, meal, food, grams, portionLabel) {
    return KW.put(db, 'log', { date, meal, foodId: food.id, name: food.name, brand: food.brand || '', src: food.src, per100: Object.assign({}, food.per100), grams: Math.round(grams * 10) / 10, portion: portionLabel || null });
  }
  // Geplante Mahlzeiten als Einträge. Anpassung: log['lp'+planId] = { factor } (0 = nicht gegessen)
  function plannedItems(db, date) {
    const out = [];
    for (const e of P.entries(db, date)) {
      const r = P.recipeOf(db, e); if (!r) continue;
      const fd = recipeFood(r), g = fd.portions[0].g;
      const ov = db.log && db.log['lp' + e.id];
      const factor = ov && !ov.del && ov.factor != null ? ov.factor : 1;
      out.push({ id: 'lp' + e.id, planId: e.id, plan: true, date, meal: mealOfPlan(e.meal), planMeal: e.meal, foodId: fd.id, name: r.name, src: 'recipe', per100: fd.per100, grams: g * factor, factor, portion: factor === 1 ? '1 Portion' : null, eaten: factor > 0 });
    }
    return out;
  }
  function setPlanFactor(db, planId, date, factor) { KW.put(db, 'log', { id: 'lp' + planId, planId, date, factor }); }
  function dayItems(db, date) {
    const logged = KW.live(db, 'log').filter(e => e.date === date && !e.planId);
    return plannedItems(db, date).concat(logged);
  }
  // Summen des Tages. partial: Werte, die bei manchen Einträgen fehlen (z. B. Zucker bei Rezepten)
  function dayTotals(db, date) {
    const t = { n: 0, partial: {} };
    for (const k of FIELDS) t[k] = 0;
    for (const it of dayItems(db, date)) {
      if (it.plan && !it.eaten) continue;
      const v = nutr(it.per100, it.grams);
      t.n++;
      for (const k of FIELDS) { if (v[k] == null) t.partial[k] = true; else t[k] += v[k]; }
    }
    return t;
  }
  function weekStats(db, start) {
    return P.weekDays(start).map(d => Object.assign({ date: d }, dayTotals(db, d)));
  }

  return {
    FIELDS, LABELS, SHORT, UNIT, BASE, MEALS, mealOfPlan, mealByTime, nutr, recipeFood, allFoods, findFood, search, usage, recent, favorites, isFav, toggleFav, saveFood,
    fromOff, offBarcode, offSearch, isBarcode, addLog, plannedItems, setPlanFactor, dayItems, dayTotals, weekStats
  };
});
