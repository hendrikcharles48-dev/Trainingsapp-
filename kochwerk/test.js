// Prüft Rezept-Import, Nährwerte, Kalorienziel und Zusammenführen: node kochwerk/test.js
const fs = require('fs'), path = require('path');
const KW = require('./core.js');
let ok = 0, bad = 0;
const eq = (name, got, want) => {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) ok++; else { bad++; console.log('✗', name, '\n   bekommen:', g, '\n   erwartet:', w); }
};
const near = (name, got, want, tol = 0.6) => { if (Math.abs(got - want) <= tol) ok++; else { bad++; console.log('✗', name, got, '≠', want); } };

// Mengen
eq('g', KW.parseAmount('1000 g'), { qty: 1000, unit: 'g', pieceG: null, g: 1000, warn: null });
eq('kg', KW.parseAmount('1,5 kg').g, 1500);
eq('l', KW.parseAmount('0,5 l'), { qty: 500, unit: 'ml', pieceG: null, g: 500, warn: null });
eq('Stück à', KW.parseAmount('4 Stück à 60 g'), { qty: 4, unit: 'Stück', pieceG: 60, g: 240, warn: null });
eq('EL Standard', KW.parseAmount('2 EL').g, 20);
eq('Stück ohne Gewicht warnt', !!KW.parseAmount('3 Stück').warn, true);
eq('Bruch', KW.parseAmount('1/2 kg').g, 500);
eq('keine Menge', KW.parseAmount('etwas'), null);

// Packungen
eq('Packung', KW.parsePack('Packung 500 g'), { pack: { kind: 'Packung', size: 500, unit: 'g' }, pantry: false });
eq('Netz kg', KW.parsePack('Netz 1 kg').pack, { kind: 'Netz', size: 1000, unit: 'g' });
eq('Stück-Packung', KW.parsePack('Packung 10 Stück').pack, { kind: 'Packung', size: 10, unit: 'Stück' });
eq('Bund', KW.parsePack('Bund').pack, { kind: 'Bund', size: 1, unit: 'Stück' });
eq('Vorrat', KW.parsePack('Vorrat'), { pack: null, pantry: true });
eq('Vorrat mit Flasche', KW.parsePack('Vorrat, Flasche 500 ml'), { pack: { kind: 'Flasche', size: 500, unit: 'ml' }, pantry: true });
eq('Strich', KW.parsePack('-'), { pack: null, pantry: false });
eq('Packungstext', KW.packText({ kind: 'Netz', size: 1000, unit: 'g' }), 'Netz 1 kg');

// Nährwerte
eq('Werte kurz', KW.parseNutr('110 kcal, 23 P, 0 K, 1,5 F').per100, { kcal: 110, p: 23, c: 0, f: 1.5 });
eq('Werte lang', KW.parseNutr('kcal 110, Protein 23, KH 0, Fett 1,5').per100, { kcal: 110, p: 23, c: 0, f: 1.5 });
eq('Werte mit g', KW.parseNutr('110 kcal / 23 g Protein / 0 g KH / 1,5 g Fett').per100, { kcal: 110, p: 23, c: 0, f: 1.5 });
eq('Werte ohne Leerzeichen', KW.parseNutr('110kcal,23P,0K,1,5F').per100, { kcal: 110, p: 23, c: 0, f: 1.5 });
eq('Werte fehlen', KW.parseNutr('110 kcal, 23 P').missing, ['c', 'f']);

// Kategorien, Bereiche
eq('Kat Haupt', KW.parseCat('Hauptmahlzeit'), 'main');
eq('Kat Hunger', KW.parseCat('Snack für den Hungerknopf'), 'hunger');
eq('Kat Snack', KW.parseCat('Snack/kleine Mahlzeit'), 'snack');
eq('Kat Notfall', KW.parseCat('Notfallgericht aus Vorrat'), 'emergency');
eq('Bereich TK', KW.parseArea('Tiefkühl'), 'tk');
eq('Bereich Kühl', KW.parseArea('Kühlregal'), 'kuehl');
eq('Bereich Obst', KW.parseArea('Obst & Gemüse'), 'obst');
eq('Bereich Gewürz', KW.parseArea('Gewürze, Öl & Soßen'), 'gewuerz');
eq('Bereich Fleisch', KW.parseArea('Fleisch & Fisch'), 'fleisch');
eq('Bereich Trocken', KW.parseArea('Trockenware'), 'trocken');

// Schritte
eq('Schritt Zeit', KW.parseStepMeta('Reis garen. [12 min nebenbei]'), { text: 'Reis garen.', min: 12, passive: true });
eq('Schritt Stunde', KW.parseStepMeta('Ziehen lassen [1 h 10 min]').min, 70);
eq('Schritt ohne Zeit', KW.parseStepMeta('Schneiden.'), { text: 'Schneiden.', min: null, passive: false });

// Beispiel-Datei
const sample = fs.readFileSync(path.join(__dirname, 'beispiel-rezept.txt'), 'utf8');
const res = KW.parseRecipes(sample);
eq('zwei Rezepte', res.length, 2);
eq('keine Fehler', res.map(r => r.errors), [[], []]);
eq('keine Warnungen', res.map(r => r.warnings), [[], []]);
const r1 = res[0].recipe;
eq('Name', r1.name, 'Hähnchen-Paprika-Pfanne mit Reis');
eq('Felder', [r1.cat, r1.portions, r1.keepDays, r1.freeze, r1.box, r1.time], ['main', 4, 3, true, true, 40]);
eq('Zutaten', r1.ingredients.length, 9);
eq('Paprika', [r1.ingredients[2].qty, r1.ingredients[2].unit, r1.ingredients[2].g, r1.ingredients[2].area], [3, 'Stück', 450, 'obst']);
eq('Öl Vorrat', [r1.ingredients[6].pantry, r1.ingredients[6].area], [true, 'gewuerz']);
eq('Schritte', r1.steps.length, 7);
eq('Tipp am Schritt', /Wasserkocher/.test(r1.steps[0].tip), true);
eq('Schritt 2 nebenbei', [r1.steps[1].min, r1.steps[1].passive], [12, true]);
const t1 = KW.recipeTotals(r1);
near('kcal pro Portion', t1.portion.kcal, 654.4);
near('Protein pro Portion', t1.portion.p, 74.1);
eq('Hungersnack', res[1].recipe.cat, 'hunger');

// Hin und zurück: Text erzeugen und wieder einlesen ergibt dasselbe Rezept
const back = KW.parseRecipes(KW.recipeToText(r1));
eq('Rundweg ohne Warnung', back[0].warnings, []);
eq('Rundweg gleich', JSON.stringify(back[0].recipe), JSON.stringify(r1));

// Chat-Text mit Markdown, ohne Start-Markierung, Komma-Zahlen
const chat = `Hier ist dein Rezept:
\`\`\`
**Name:** Linsen-Curry
**Kategorie:** Notfallgericht
**Portionen:** 2
**Haltbar:** 4
**Einfrierbar:** Ja
**Boxtauglich:** nein
**Zutaten:**
* Rote Linsen | 200 g | Packung 500 g | Trockenware | 340 kcal, 24 P, 49 K, 1,5 F
* Kokosmilch light | 400 ml | Dose 400 ml | Konserven | 75 kcal, 0,8 P, 2 K, 7 F
**Schritte:**
1. Alles in einen Topf. [15 min nebenbei]
\`\`\``;
const c = KW.parseRecipes(chat);
eq('Markdown 1 Rezept', c.length, 1);
eq('Markdown Felder', [c[0].recipe.name, c[0].recipe.cat, c[0].recipe.portions, c[0].recipe.box, c[0].recipe.ingredients.length], ['Linsen-Curry', 'emergency', 2, false, 2]);
eq('Markdown Fehler', c[0].errors, []);

// Mehrere Rezepte ohne Markierungen, nur über „Name:“ getrennt
const two = 'Name: A\nKategorie: Snack\nZutaten:\n- Quark | 250 g | Becher 250 g | Kühlregal | 67 kcal, 12 P, 4 K, 0,2 F\nName: B\nZutaten:\n- Ei | 2 Stück à 60 g | Packung 10 Stück | Kühlregal | 137 kcal, 12 P, 1 K, 9 F';
const tw = KW.parseRecipes(two);
eq('zwei ohne Markierung', tw.map(x => x.recipe.name), ['A', 'B']);
eq('Fehler ohne Zutaten', KW.parseRecipes('Name: Leer\nPortionen: 2')[0].errors, ['Keine Zutaten gefunden']);

// Format genau wie der Chat-Skill „kochwerk-rezept“ (mit Begleitsätzen vor und nach dem Block)
const skill = `Cremige Hähnchen-Pasta, etwa 560 kcal und 52 g Protein pro Portion. Von den Eiern bleiben 6 übrig.
\`\`\`
=== KOCHWERK REZEPT ===
Name: Cremige Hähnchen-Pasta
Kategorie: Hauptmahlzeit
Portionen: 4
Haltbar: 3 Tage
Einfrierbar: ja
Boxtauglich: ja
Zutaten:
- Vollkornnudeln | 250 g | Packung 500 g | Trockenware | 350 kcal, 13 P, 64 K, 2,5 F
- Hähnchenbrust | 800 g | Packung 400 g | Fleisch | 105 kcal, 23,5 P, 0 K, 1,2 F
- Kochsahne light | 200 ml | Packung 200 ml | Kühlregal | 150 kcal, 3 P, 4 K, 15 F
- Tomaten | 2 Stück à 80 g | Packung 6 Stück | Obst/Gemüse | 18 kcal, 0,9 P, 2,6 K, 0,2 F
- Rapsöl | 1 EL à 10 g | Packung Vorrat | Gewürze/Saucen | 884 kcal, 0 P, 0 K, 100 F
- Passierte Tomaten | 500 g | Packung 500 g | Konserven | 30 kcal, 1,4 P, 4,8 K, 0,2 F
Schritte:
1. Wasser im Wasserkocher aufkochen. [4 min nebenbei]
   Tipp: Wasserkocher statt Topf spart Strom.
2. Nudeln kochen. [9 min nebenbei]
=== ENDE ===
\`\`\`
Tipp: Mit einer Handvoll Spinat wird es noch grüner.`;
const sk = KW.parseRecipes(skill);
eq('Skill: ein Rezept', sk.length, 1);
eq('Skill: ohne Warnung', sk[0].warnings, []);
eq('Skill: Bereiche', sk[0].recipe.ingredients.map(i => i.area), ['trocken', 'fleisch', 'kuehl', 'obst', 'gewuerz', 'konserve']);
eq('Skill: Packung Vorrat', [sk[0].recipe.ingredients[4].pantry, sk[0].recipe.ingredients[4].pack], [true, null]);
eq('Skill: Packung ml', sk[0].recipe.ingredients[2].pack, { kind: 'Packung', size: 200, unit: 'ml' });
eq('Skill: Tipp am Schritt', sk[0].recipe.steps[0].tip, 'Wasserkocher statt Topf spart Strom.');

// Kalorienziel
const tg = KW.calcTargets({ sex: 'm', age: 25, height: 180, weight: 85, activity: 1.55, tempo: 'moderate', protein: 180 });
eq('Grundumsatz', tg.bmr, 1855);
eq('Verbrauch', tg.tdee, 2875);
eq('Ziel', tg.target, 2410);
near('kg pro Woche', tg.kgWeek, 0.43, 0.01);
const low = KW.calcTargets({ sex: 'w', age: 30, height: 160, weight: 55, activity: 1.2, tempo: 'fast' });
eq('Deckel 25 %', low.capped || low.floored, true);
eq('nie unter Grundumsatz', low.target >= low.bmr - 5, true);

// Datenbestand und Zusammenführen
const A = KW.emptyDb(), B = KW.emptyDb();
const rec = KW.importRecipe(A, r1, 'new');
B.recipes[rec.id] = JSON.parse(JSON.stringify(rec));
B.recipes[rec.id].name = 'Neuer Name'; B.recipes[rec.id].t = rec.t + 10;
KW.setSetting(A, 'protein', 170);
const m = KW.merge(A, B);
eq('neueste Änderung gewinnt', m.data.recipes[rec.id].name, 'Neuer Name');
eq('lokale Einstellung bleibt', m.data.settings.protein.v, 170);
eq('beide Richtungen', [m.fromLocal, m.fromRemote], [true, true]);
KW.remove(A, 'recipes', rec.id);
A.recipes[rec.id].t = rec.t + 20;
eq('Löschen gewinnt, wenn neuer', KW.merge(A, B).data.recipes[rec.id].del, true);
eq('Ersetzen behält id', KW.importRecipe(B, Object.assign({}, r1, { name: 'Neuer Name' }), 'replace').id, rec.id);

// Bewertung
const D = KW.emptyDb();
KW.put(D, 'ratings', { recipeId: 'x', satt: -1, lecker: 0 });
eq('schlecht bewertet', KW.ratingSummary(D, 'x').bad, true);
KW.put(D, 'ratings', { recipeId: 'y', satt: 1, lecker: 1 });
eq('gut bewertet', KW.ratingSummary(D, 'y').good, true);

console.log(bad ? `\n${bad} Fehler, ${ok} ok` : `Alles ok (${ok} Prüfungen)`);
process.exit(bad ? 1 : 0);
