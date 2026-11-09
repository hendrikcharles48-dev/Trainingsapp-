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

// ---------- Planung (plan.js) ----------
const P = require('./plan.js');
eq('Wochentag Mo', P.wd('2026-11-09'), 0);
eq('Wochentag So', P.wd('2026-11-08'), 6);
eq('Wochenstart', P.weekStart('2026-11-08'), '2026-11-02');
eq('Tage addieren über Monatsende', P.addDays('2026-10-30', 3), '2026-11-02');
eq('Sommerzeit egal', P.addDays('2026-03-28', 2), '2026-03-30');
eq('KW', P.isoWeek('2026-11-04'), 45);
eq('KW Jahreswechsel', P.isoWeek('2027-01-01'), 53);
eq('Tag kurz', P.dayLabel('2026-11-09'), 'Mo 9.11.');

const Q = KW.emptyDb();
KW.setSetting(Q, 'age', 25); KW.setSetting(Q, 'height', 180); KW.setWeight(Q, 85, '2026-11-02');
KW.setSetting(Q, 'activity', 1.55); KW.setSetting(Q, 'cookDay', 0);
const mk = (name, kcal, p, opt = {}) => { const r = Object.assign({ name, cat: 'main', portions: 4, keepDays: 4, freeze: false, box: true, tips: [], steps: [] }, opt);
  r.ingredients = [{ name: name + ' Zutat', qty: 100 * r.portions, unit: 'g', g: 100 * r.portions, pack: null, pantry: false, area: 'sonst', per100: { kcal, p, c: 10, f: 5 } }];
  return KW.importRecipe(Q, r, 'new'); };
const hi = mk('Protein hoch', 500, 55), mid = mk('Protein mittel', 600, 40, { freeze: true }), lowR = mk('Kaum Protein', 700, 10, { box: false });
mk('Protein gut', 550, 45, { freeze: true });
const snack = mk('Quark', 200, 25, { cat: 'snack', portions: 1 });
const day = '2026-11-09';
P.setMeal(Q, day, 'box', true); P.setMeal(Q, day, 'dinner', true);
eq('Mahlzeiten angewählt', P.entries(Q, day).map(e => e.meal), ['box', 'dinner']);
P.setMeal(Q, day, 'box', true);
eq('doppelt anwählen bleibt eins', P.entries(Q, day).length, 2);
P.update(Q, P.mainId(day, 'box'), { recipeId: hi.id });
P.addSnack(Q, day, 25, snack.id);
eq('Snack an der richtigen Stelle', P.entries(Q, day).map(e => e.meal), ['box', 'snack', 'dinner']);
const rm = P.room(Q, day);
eq('Spielraum kcal', Math.round(rm.used), 700);
eq('Ziel', rm.target, 2410);
eq('Mahlzeiten frei', rm.meals, 2.5);
eq('Text', rm.text, 'Noch Platz für etwa 2½ normale Mahlzeiten');
eq('Protein offen', Math.round(rm.pOpen), 100);
P.update(Q, P.mainId(day, 'dinner'), { recipeId: mid.id, partner: true });
eq('Freundin zählt nicht', Math.round(P.room(Q, day).used), 1300);
eq('über dem Ziel', P.roomText(-300, 0), 'Heute schon etwa 300 kcal über dem Ziel');
eq('kleiner Snack', P.roomText(200, 0), 'Noch Platz für einen kleinen Snack');
eq('eine Mahlzeit', P.roomText(650, 1), 'Noch Platz für etwa eine normale Mahlzeit');
P.setMeal(Q, day, 'dinner', false);
eq('abwählen', P.entries(Q, day).map(e => e.meal), ['box', 'snack']);

// Wochenvorschlag: Mo–Fr Box + Abend, Box schon mit „Protein hoch“ belegt
const wk = P.weekStart(day);
eq('Kochtag Sonntag vor der Woche', P.cookDate(Q, wk), '2026-11-08');
for (let k = 0; k < 5; k++) { const d = P.addDays(wk, k); P.setMeal(Q, d, 'box', true); P.setMeal(Q, d, 'dinner', true); }
const sugAll = P.suggestWeek(Q, wk), sug = sugAll.fill;
eq('nichts offen', sugAll.open, []);
eq('9 leere Plätze gefüllt', sug.length, 9);
eq('Box nur boxtauglich', sug.filter(s => s.id.endsWith('box')).every(s => Q.recipes[s.recipeId].box), true);
eq('kein Rezept mit wenig Protein, solange genug da', sug.some(s => s.recipeId === lowR.id), false);
const cnt = {}; for (const s of sug) cnt[s.recipeId] = (cnt[s.recipeId] || 0) + 1;
eq('wenige Rezepte pro Woche (Meal-Prep)', Object.keys(cnt).length <= 3, true);
eq('erster Topf wird erst leer gegessen', (cnt[hi.id] || 0) + 1, 4);
eq('nicht zweimal dasselbe am selben Tag', [...new Set(sug.map(s => s.date))].every(d => { const ids = sug.filter(s => s.date === d).map(s => s.recipeId).concat(P.entries(Q, d).map(e => e.recipeId).filter(Boolean)); return new Set(ids).size === ids.length; }), true);
P.applySuggestions(Q, sug);
eq('alles belegt', P.weekEntries(Q, wk).filter(e => P.isMain(e) && !e.recipeId).length, 0);
// Haltbarkeit: nicht einfrierbar, 2 Tage haltbar → nicht für Freitag
const shortR = mk('Kurz haltbar', 400, 60, { keepDays: 2 });
const Fr = P.addDays(wk, 4); P.setMeal(Q, Fr, 'lunch', true);
eq('Haltbarkeit beachtet', P.suggestWeek(Q, wk).fill.every(s => s.recipeId !== shortR.id), true);
const Z = KW.emptyDb(); KW.importRecipe(Z, Object.assign({}, KW.parseRecipes(sample)[0].recipe, { freeze: false }), 'new');
P.setMeal(Z, P.addDays(wk, 4), 'dinner', true);
eq('offen mit Grund Haltbarkeit', P.suggestWeek(Z, wk).open.map(o => o.why), ['keep']);

// Tauschen
const opt = P.swapOptions(Q, P.entries(Q, day)[0]);
eq('Tauschen ohne aktuelles Rezept', opt.every(o => o.r.id !== hi.id), true);
eq('Tauschen nur boxtauglich', opt.every(o => o.r.box), true);
eq('Tauschen ähnliche kcal', opt.every(o => Math.abs(o.dk) <= 500 * 0.35 + 1), true);

// Lieblingswoche
const fav = P.saveFavWeek(Q, wk, 'Schulwoche');
const next = P.addDays(wk, 7);
P.applyFavWeek(Q, fav, next);
eq('Lieblingswoche übernommen', P.weekEntries(Q, next).length, P.weekEntries(Q, wk).length);
eq('Lieblingswoche gleiche Rezepte', P.weekEntries(Q, next).map(e => e.recipeId).join(), P.weekEntries(Q, wk).map(e => e.recipeId).join());

// Bewertungsfrage
eq('Frage nach letztem Gericht', P.ratingCandidate(Q, P.addDays(wk, 5)).date, Fr);
const cand = P.ratingCandidate(Q, P.addDays(wk, 5));
KW.put(Q, 'ratings', { id: 'r' + cand.id, recipeId: cand.recipeId, skip: true });
eq('nur einmal fragen', (P.ratingCandidate(Q, P.addDays(wk, 5)) || {}).id !== cand.id, true);
eq('übersprungen zählt nicht', KW.ratingSummary(Q, cand.recipeId).n, 0);

// Wochen-Check
const W = KW.emptyDb();
KW.setWeight(W, 88, '2026-10-19'); KW.setWeight(W, 87.5, '2026-10-26'); KW.setWeight(W, 87.6, '2026-11-02'); KW.setWeight(W, 87.9, '2026-11-09');
eq('Wochenwerte', P.weeklyWeights(W).map(w => w.kg), [88, 87.5, 87.6, 87.9]);
eq('Stillstand erkannt', !!P.stall(W, '2026-11-10'), true);
KW.setWeight(W, 87.0, '2026-11-11');
eq('kein Stillstand bei Abnahme', P.stall(W, '2026-11-11'), null);
KW.setWeight(W, 87.9, '2026-11-11');
KW.setSetting(W, 'stallAck', P.stall(W, '2026-11-11').last.id);
eq('Hinweis weggeklickt', P.stall(W, '2026-11-11'), null);

// Leichter machen
const rice = { name: 'R', portions: 2, ingredients: [
  { name: 'Reis', qty: 250, unit: 'g', per100: { kcal: 350, p: 7.5, c: 77, f: 0.6 } },
  { name: 'Hähnchen', qty: 500, unit: 'g', per100: { kcal: 105, p: 23.5, c: 0, f: 1.2 } },
  { name: 'Linsen', qty: 100, unit: 'g', per100: { kcal: 340, p: 24, c: 49, f: 1.5 } },
  { name: 'Brötchen', qty: 2, unit: 'Stück', pieceG: 60, per100: { kcal: 270, p: 9, c: 52, f: 2 } }] };
const li = P.lighten(rice);
eq('nur Kohlenhydrat-Zutaten', li.changed, ['Reis', 'Brötchen']);
eq('Reis −25 %', li.recipe.ingredients[0].qty, 190);
eq('Brötchen −25 %', li.recipe.ingredients[3].qty, 1.5);
eq('Protein bleibt fast gleich', Math.abs(KW.recipeTotals(li.recipe).portion.p - KW.recipeTotals(rice).portion.p) < 5, true);

// ---------- Einkauf (shop.js) ----------
const S = require('./shop.js');
const pk = n => (S.findPack(KW.emptyDb(), n) || {}).name;
eq('Packung Hähnchenbrustfilet', pk('Hähnchenbrustfilet'), 'Hähnchenbrustfilet');
eq('Packung TK vor frisch', pk('Brokkoli (TK)'), 'Brokkoli TK');
eq('Packung frisch', pk('Brokkoli'), 'Brokkoli');
eq('Packung Ei', pk('Ei'), 'Eier');
eq('Ei passt nicht zu Eiweißpulver', pk('Eiweißpulver'), undefined);
eq('Rote Zwiebeln', pk('Rote Zwiebeln'), 'Rote Zwiebeln');
eq('Zwiebeln', pk('Zwiebeln'), 'Zwiebeln');
eq('Standardliste groß genug', S.DEFAULT_PACKS.length >= 75, true);

const E = KW.emptyDb();
KW.setSetting(E, 'partnerFactor', 0.8);
const pf = KW.importRecipe(E, KW.parseRecipes(sample)[0].recipe, 'new');
const sk2 = KW.importRecipe(E, KW.parseRecipes(sample)[1].recipe, 'new');
const W1 = '2026-11-09', W2 = '2026-11-16';
for (let k = 0; k < 3; k++) { P.setMeal(E, P.addDays(W1, k), 'box', true); P.update(E, P.mainId(P.addDays(W1, k), 'box'), { recipeId: pf.id }); }
eq('3 Portionen = 1 Topf', S.weekPots(E, W1)[0].pots, 1);
P.update(E, P.mainId(W1, 'box'), { partner: true });
eq('mit Freundin 3,8 Portionen = 1 Topf', S.weekPots(E, W1)[0].pots, 1);
P.setMeal(E, P.addDays(W1, 3), 'box', true); P.update(E, P.mainId(P.addDays(W1, 3), 'box'), { recipeId: pf.id });
eq('4,8 Portionen = 2 Töpfe', S.weekPots(E, W1)[0].pots, 2);
P.update(E, P.mainId(W1, 'box'), { partner: false });
const L1 = S.weekList(E, W1);
const it = n => L1.items.find(i => i.name.startsWith(n));
eq('Hähnchen 2 × 500 g (Rezept-Packung)', [it('Hähnchen').packs, it('Hähnchen').pack.size, it('Hähnchen').need], [2, 500, 1000]);
eq('Reis halbe Packung = 1 Packung', it('Basmati').packs, 1);
eq('Paprika in Stück', [it('Paprika').packs, it('Paprika').unit, it('Paprika').need], [1, 'Stück', 3]);
eq('Zwiebeln Stück in g umgerechnet', [it('Zwiebeln').need, it('Zwiebeln').packs], [160, 1]);
eq('Vorrat nicht auf der Liste', L1.items.some(i => i.name === 'Olivenöl'), false);
eq('Grundvorrat: nur echte Grundzutaten', L1.stock.map(v => v.name).sort(), ['Gemüsebrühe (Pulver)', 'Olivenöl', 'Paprikapulver edelsüß']);
eq('Grundzutaten erkannt', ['Öl', 'Rapsöl', 'Salz', 'Pfeffer', 'Mehl', 'Zucker', 'Speisestärke', 'Gemüsebrühe, Pulver', 'Brühwürfel', 'Currypulver', 'Paprikapulver edelsüß', 'Chili-Gewürz', 'Zimt', 'Kreuzkümmel'].filter(n => !KW.isBasic(n)), []);
eq('keine Grundzutaten', ['Knoblauch', 'Honig', 'Tomatenmark', 'Sojasoße', 'Senf (mittelscharf)', 'Zitronensaft', 'Backkakao', 'Skyr natur', 'Haferflocken', 'Paprika', 'Kräuter (TK)', 'Rote Linsen', 'Thunfisch im eigenen Saft'].filter(n => KW.isBasic(n)), []);
eq('„Vorrat“-Knoblauch bekommt Packung Knolle', KW.fallbackPack({ name: 'Knoblauch' }).kind, 'Knolle');
eq('sortiert nach Bereichen', L1.items[0].area, 'obst');
eq('frisch erst ab Do: Hinweis', L1.items.filter(i => i.lateHint).map(i => i.name), []);
// eigene Packungsgröße gilt ab dann
KW.put(E, 'packs', { id: S.packKey('Hähnchenbrustfilet'), name: 'Hähnchenbrustfilet', kind: 'Packung', size: 400, unit: 'g', area: 'fleisch' });
eq('eigene Packung hat Vorrang', S.weekList(E, W1).items.find(i => i.name.startsWith('Hähnchen')).packs, 3);
// Abhaken, Nachkauf, Grundvorrat kaufen
for (const i of S.weekList(E, W1).items) S.check(E, W1, i, true);
KW.put(E, 'packs', { id: S.packKey('Hähnchenbrustfilet'), name: 'Hähnchenbrustfilet', kind: 'Packung', size: 1000, unit: 'g', area: 'fleisch' });
eq('abgehakt bleibt gekaufte Menge', S.weekList(E, W1).items.find(i => i.name.startsWith('Hähnchen')).packs, 3);
S.setPantry(E, W1, KW.norm('Olivenöl'), 'buy');
eq('Grundvorrat „kaufen“ kommt auf die Liste', S.weekList(E, W1).items.some(i => i.name === 'Olivenöl'), true);
S.setPantry(E, W1, KW.norm('Olivenöl'), 'have');
S.setLater(E, W1, KW.norm('Paprika'), true);
eq('später kaufen → Nachkauf', [S.weekList(E, W1).items.some(i => i.name === 'Paprika'), S.weekList(E, W1).later.map(i => i.name)], [false, ['Paprika']]);
// Reste
const R = S.rests(E);
eq('Rest Reis', R[KW.norm('Basmatireis (roh)')].amount, 250);
eq('Rest Hähnchen 3×400 − 1000', R[KW.norm('Hähnchenbrustfilet')].amount, 200);
eq('Rest Zwiebeln', R[KW.norm('Zwiebeln')].amount, 840);
eq('kein Rest bei Paprika', R[KW.norm('Paprika')], undefined);
// Nächste Woche: Reste werden zuerst verbraucht
P.setMeal(E, W2, 'box', true); P.update(E, P.mainId(W2, 'box'), { recipeId: pf.id });
const L2 = S.weekList(E, W2);
eq('Reis aus Resten', L2.fromRest.map(i => i.name).includes('Basmatireis (roh)'), true);
eq('Hähnchen nur Rest abziehen', L2.items.find(i => i.name.startsWith('Hähnchen')).buy, 800);
// Rest von Hand: Zwiebeln weg
S.setRest(E, KW.norm('Zwiebeln'), 'Zwiebeln', 'obst', 'g', 0);
eq('Rest weg', S.rests(E)[KW.norm('Zwiebeln')], undefined);
S.setRest(E, KW.norm('Haferflocken'), 'Haferflocken', 'trocken', 'g', 300);
eq('Rest von Hand ergänzt', S.rests(E)[KW.norm('Haferflocken')].amount, 300);
eq('Restekarte schlägt Rezept vor', S.restRecipes(E)[0].r.id, pf.id);
// Teilen
const txt = S.shareText('Einkauf', S.weekList(E, W2).items);
eq('Teilen-Text mit Bereichen', /Fleisch & Fisch\n☐ /.test(txt), true);
eq('Teilen ganze Packungen', /☐ \d × Hähnchenbrustfilet \(Packung 1 kg\)|☐ Hähnchenbrustfilet \(Packung 1 kg\)/.test(txt), true);

{
// ---------- Kochsession, Boxen (cook.js) ----------
const C = require('./cook.js');
const rA = KW.parseRecipes(sample)[0].recipe;
const sch = C.schedule([{ r: rA, pots: 1 }]);
eq('alle Schritte im Ablauf', sch.steps.length, rA.steps.length);
eq('Reihenfolge im Rezept bleibt', sch.steps.map(s => s.n), [1, 2, 3, 4, 5, 6, 7]);
eq('Schneiden während der Reis köchelt', sch.steps.find(s => s.n === 3).start < sch.steps.find(s => s.n === 2).end, true);
eq('Reis erst, wenn das Wasser kocht', sch.steps.find(s => s.n === 2).start >= sch.steps.find(s => s.n === 1).end, true);
eq('letzter Schritt wartet auf alles', sch.steps[6].start >= Math.max(...sch.steps.slice(0, 6).filter(s => s.passive).map(s => s.end)), true);
eq('schneller als nacheinander', sch.total < sch.sequential, true);
const rB = { id: 'b', name: 'Ofengemüse', steps: [{ text: 'Schneiden', min: 10 }, { text: 'Ofen', min: 30, passive: true }, { text: 'Verteilen', min: 3 }] };
const twoS = C.schedule([{ r: rA }, { r: rB }]);
eq('zwei Rezepte: alle Schritte', twoS.steps.length, 10);
eq('zwei Rezepte gleichzeitig schneller', twoS.total < twoS.sequential, true);
eq('Hände nie doppelt belegt', (() => { let t = 0; for (const s of twoS.steps) { if (s.start < t - 1e-9) return false; t = s.start + (s.passive ? Math.min(1, s.min || 3) : (s.min || 3)); } return true; })(), true);

// Boxen: Kochtag So 8.11., Hähnchen 3 Tage haltbar, einfrierbar
const B = KW.emptyDb();
const hb = KW.importRecipe(B, KW.parseRecipes(sample)[0].recipe, 'new');
const wB = '2026-11-09';
for (let k = 0; k < 5; k++) { const d = P.addDays(wB, k); P.setMeal(B, d, 'box', true); P.update(B, P.mainId(d, 'box'), { recipeId: hb.id }); }
const bx = C.boxes(B, wB);
eq('Kochtag', bx.cookDate, '2026-11-08');
eq('Mo–Mi Kühlschrank, Do–Fr Gefrierfach', bx.list.map(b => b.place), ['fridge', 'fridge', 'fridge', 'freezer', 'freezer']);
eq('Auftauen am Vorabend', bx.list[3].thaw, '2026-11-11');
eq('2 Töpfe für 5 Portionen: 3 Reserve', bx.reserve[0].count, 3);
const nf = KW.importRecipe(B, Object.assign({}, KW.parseRecipes(sample)[0].recipe, { name: 'Salat', freeze: false, keepDays: 2 }), 'new');
P.update(B, P.mainId(P.addDays(wB, 4), 'box'), { recipeId: nf.id });
eq('nicht einfrierbar und zu spät: Warnung', C.boxes(B, wB).list[4].place, 'late');
P.update(B, P.mainId(P.addDays(wB, 4), 'box'), { recipeId: hb.id });
eq('vor dem Kochen kein Hinweis', C.thawHints(B, '2026-11-11'), []);
C.finishCooking(B, wB, '2026-11-08', [hb.id]);
eq('Auftau-Hinweis am Vorabend', C.thawHints(B, '2026-11-11').map(h => [h.date, h.when]), [['2026-11-12', 'evening']]);
eq('vergessen: am Tag selbst', C.thawHints(B, '2026-11-12').map(h => h.when), ['today', 'evening']);
C.thawDone(B, bx.list[3].id);
eq('erledigt: weg', C.thawHints(B, '2026-11-11'), []);

// Hungerknopf und Notfall
const H = KW.emptyDb();
for (const [n, p] of [['Skyr', 25], ['Quark', 30], ['Jerky', 20], ['Riegel', 15], ['Ei', 12]]) KW.importRecipe(H, { name: n, cat: 'hunger', portions: 1, keepDays: 3, freeze: false, box: true, tips: [], steps: [], ingredients: [{ name: n, qty: 100, unit: 'g', per100: { kcal: 150, p, c: 5, f: 3 } }] }, 'new');
KW.importRecipe(H, { name: 'Linsen-Dal', cat: 'emergency', portions: 2, keepDays: 3, freeze: true, box: true, tips: [], steps: [], ingredients: [{ name: 'Linsen', qty: 200, unit: 'g', per100: { kcal: 340, p: 24, c: 49, f: 1.5 } }] }, 'new');
const hi3 = C.hungerIdeas(H, '2026-11-04');
eq('Hungerknopf: 3 Ideen', hi3.length, 3);
eq('Hungerknopf: nur Hungersnacks', hi3.every(x => x.r.cat === 'hunger'), true);
eq('Hungerknopf: proteinreich zuerst', hi3[0].t.p >= hi3[2].t.p, true);
eq('Notfall', C.emergencyIdeas(H).map(x => x.r.name), ['Linsen-Dal']);

}

// ---------- Rezeptpaket aus dem Chat (rezepte-paket.txt) ----------
{
  const paket = KW.parseRecipes(fs.readFileSync(path.join(__dirname, 'rezepte-paket.txt'), 'utf8'));
  eq('Paket: mindestens 13 Rezepte', paket.length >= 13, true);
  eq('Paket: ohne Fehler und Warnungen', paket.filter(x => x.errors.length || x.warnings.length).map(x => [x.recipe.name, x.errors, x.warnings]), []);
  // Große Portionen (Nutzerwunsch 9.11.): satt werden bei moderaten kcal
  const mains = paket.filter(x => x.recipe.cat === 'main').map(x => Object.assign({ n: x.recipe.name }, KW.recipeTotals(x.recipe).portion));
  eq('Paket: Hauptmahlzeiten mind. 550 g und höchstens 700 kcal', mains.filter(t => t.g < 550 || t.kcal > 700).map(t => t.n), []);
  eq('Paket: Hauptmahlzeiten im Schnitt mind. 680 g', mains.reduce((s, t) => s + t.g, 0) / mains.length >= 680, true);
  eq('Paket: Fingerabdrücke der alten Fassung vorhanden', Object.keys(JSON.parse(fs.readFileSync(path.join(__dirname, 'paket-alt.json'), 'utf8'))).length >= 62, true);
  eq('Paket: Notfallgericht dabei', paket.some(x => x.recipe.cat === 'emergency'), true);
  eq('Paket: 20 Monsieur-Cuisine-Rezepte', paket.filter(x => x.recipe.mc).length, 20);
  eq('Paket: MC-Rezepte günstig und leicht (≤ 700 kcal pro Portion)', paket.filter(x => x.recipe.mc && KW.recipeTotals(x.recipe).portion.kcal > 700).map(x => x.recipe.name), []);
  eq('Paket: keine doppelten Namen', paket.length, new Set(paket.map(x => KW.norm(x.recipe.name))).size);
}

// Gerät: Monsieur Cuisine
{
  const g = KW.parseRecipes('Name: MC-Test\nKategorie: Snack\nPortionen: 1\nHaltbar: 1 Tag\nEinfrierbar: nein\nBoxtauglich: ja\nGerät: Monsieur Cuisine\nZutaten:\n- Skyr natur | 250 g | Becher 500 g | Kühlregal | 63 kcal, 11 P, 4 K, 0,2 F\nSchritte:\n1. 10 Sek./Stufe 4 rühren. [1 min]')[0];
  eq('Gerät erkannt', [g.recipe.mc, g.warnings], [true, []]);
  eq('Gerät im Text', /Gerät: Monsieur Cuisine/.test(KW.recipeToText(g.recipe)), true);
  eq('ohne Gerät: kein MC', KW.parseRecipes('Name: X\nZutaten:\n- Skyr | 100 g | Becher 500 g | Kühlregal | 63 kcal, 11 P, 4 K, 0,2 F')[0].recipe.mc, false);
}
// Packungs-Schreibweisen aus dem Chat (Skill schreibt „Packung …“ vor die Art)
eq('Packung Glas', KW.parsePack('Packung Glas 120 g').pack, { kind: 'Glas', size: 120, unit: 'g' });
eq('Packung Dose abgetropft', KW.parsePack('Packung Dose 400 g (250 g abgetropft)').pack, { kind: 'Dose', size: 250, unit: 'g', label: 'Dose 400 g (250 g abgetropft)' });
eq('Packung Knolle', KW.parsePack('Packung 1 Knolle').pack, { kind: 'Knolle', size: 1, unit: 'Stück' });
eq('Packung Stück ca.', KW.parsePack('Packung 1 Stück (ca. 800 g)').pack, { kind: 'Stück', size: 800, unit: 'g', label: 'Stück (ca. 800 g)' });
eq('Packung Tube', KW.parsePack('Packung Tube 200 ml').pack, { kind: 'Tube', size: 200, unit: 'ml' });
eq('Packung 1 Stück', KW.parsePack('Packung 1 Stück').pack, { kind: 'Stück', size: 1, unit: 'Stück' });
{
  const Z = KW.emptyDb();
  const r = KW.importRecipe(Z, KW.parseRecipes('Name: Dip\nPortionen: 2\nZutaten:\n- Knoblauch | 2 Zehen à 4 g | Packung 1 Knolle | Obst/Gemüse | 140 kcal, 6 P, 28 K, 0,1 F\n- Spitzkohl | 800 g | Packung 1 Stück (ca. 800 g) | Obst/Gemüse | 28 kcal, 1,6 P, 4 K, 0,3 F\n- Mais, abgetropft | 140 g | Packung Dose 150 g (140 g abgetropft) | Konserven | 85 kcal, 3 P, 15 K, 1,2 F')[0].recipe, 'new');
  P.setMeal(Z, '2026-11-09', 'box', true); P.update(Z, P.mainId('2026-11-09', 'box'), { recipeId: r.id });
  const L = S.weekList(Z, '2026-11-09');
  const it = n => L.items.find(i => i.name.startsWith(n));
  eq('2 Zehen = 1 Knolle', it('Knoblauch').packs, 1);
  eq('Spitzkohl 1 Stück', [it('Spitzkohl').packs, it('Spitzkohl').pack.label], [1, 'Stück (ca. 800 g)']);
  eq('Mais 1 Dose', [it('Mais').packs, it('Mais').pack.label], [1, 'Dose 150 g (140 g abgetropft)']);
}
// Rezeptblock aus dem Chat vom 5.11.: alles muss ohne Warnung durchgehen
{
  const p2 = fs.existsSync(path.join(__dirname, 'rezepte-paket.txt')) ? KW.parseRecipes(fs.readFileSync(path.join(__dirname, 'rezepte-paket.txt'), 'utf8')) : [];
  eq('Chat-Rezepte im Paket ohne Warnung', p2.filter(x => x.warnings.length || x.errors.length).map(x => x.recipe.name + ': ' + x.warnings.concat(x.errors).join('; ')), []);
}

// ---------- Tagebuch (track.js) ----------
{
  const T = require('./track.js');
  eq('Grundliste groß', T.BASE.length >= 170, true);
  eq('Grundliste: alle 8 Werte', T.BASE.filter(f => T.FIELDS.some(k => f.per100[k] == null || !isFinite(f.per100[k]))).map(f => f.name), []);
  eq('Grundliste: kcal passen zu Nährstoffen (±25 %)', T.BASE.filter(f => { const v = f.per100, e = v.p * 4 + v.c * 4 + v.f * 9 + v.fib * 2; return f.name !== 'Bier' && v.kcal > 20 && Math.abs(e - v.kcal) / v.kcal > 0.25; }).map(f => f.name), []);
  eq('Grundliste: ids eindeutig', new Set(T.BASE.map(f => f.id)).size, T.BASE.length);
  const D2 = KW.emptyDb();
  KW.setSetting(D2, 'age', 25); KW.setSetting(D2, 'height', 180); KW.setWeight(D2, 85, '2026-11-02');
  eq('Suche Karotte findet Möhre', T.search(D2, 'karotte')[0].name, 'Möhre');
  eq('Suche Anfang zuerst', T.search(D2, 'Ei')[0].name, 'Ei');
  eq('Suche Döner', T.search(D2, 'döner')[0].name, 'Döner Kebab');
  const pf = KW.importRecipe(D2, KW.parseRecipes(sample)[0].recipe, 'new');
  eq('Rezept als Lebensmittel', T.search(D2, 'hähnchen-paprika')[0].src, 'recipe');
  const d = '2026-11-09';
  P.setMeal(D2, d, 'box', true); P.update(D2, P.mainId(d, 'box'), { recipeId: pf.id });
  const apfel = T.findFood(D2, 'b:apfel');
  T.addLog(D2, d, 'snack', apfel, 150, '1 Stück');
  const items = T.dayItems(D2, d);
  eq('Tag: Plan + Apfel', items.map(i => [i.name, i.meal]), [['Hähnchen-Paprika-Pfanne mit Reis', 'box'], ['Apfel', 'snack']]);
  const tt = T.dayTotals(D2, d);
  near('Tag kcal = Rezeptportion + Apfel', tt.kcal, KW.recipeTotals(pf).portion.kcal + 78, 1);
  eq('Zucker beim Rezept unbekannt', tt.partial.sug, true);
  eq('Spielraum zieht Getracktes ab', Math.round(P.room(D2, d).used), Math.round(tt.kcal));
  T.setPlanFactor(D2, P.mainId(d, 'box'), d, 0);
  near('nicht gegessen zählt nicht', T.dayTotals(D2, d).kcal, 78, 0.5);
  T.setPlanFactor(D2, P.mainId(d, 'box'), d, 0.5);
  near('halbe Portion', T.dayTotals(D2, d).kcal, KW.recipeTotals(pf).portion.kcal / 2 + 78, 1);
  eq('Zuletzt gegessen', T.recent(D2).map(f => f.name), ['Apfel']);
  T.toggleFav(D2, apfel);
  eq('Favorit Grundliste', [T.isFav(D2, apfel), T.favorites(D2).map(f => f.name)], [true, ['Apfel']]);
  eq('Favorit-Marke taucht nicht als Lebensmittel auf', T.search(D2, 'apfel').filter(f => f.name === 'Apfel').length, 1);
  const own = T.saveFood(D2, { name: 'Omas Kuchen', per100: { kcal: 350, p: 5, c: 45, sug: 30, f: 16, sat: 9, fib: 1, salt: 0.3 }, portions: [{ label: '1 Stück', g: 90 }] });
  eq('Eigenes Lebensmittel suchbar', T.search(D2, 'omas')[0].id, own.id);
  // Open Food Facts (nachgebaute Antworten)
  const prod = { code: '4061458061727', product_name: 'Skyr Natur', brands: 'Milbona,Lidl', quantity: '500 g', serving_size: '150 g', serving_quantity: 150,
    nutriments: { 'energy-kcal_100g': 63, proteins_100g: 11, carbohydrates_100g: 4, sugars_100g: 4, fat_100g: 0.2, 'saturated-fat_100g': 0.1, fiber_100g: 0, salt_100g: 0.1 } };
  const fakeOff = async url => ({ ok: true, status: 200, json: async () => /product\//.test(url) ? (url.includes('4061458061727') ? { status: 1, product: prod } : { status: 0 }) : { products: [prod, { code: '1', product_name: 'ohne Werte' }] } });
  (async () => {
    const f = await T.offBarcode('4061458061727', fakeOff);
    eq('OFF Barcode', [f.name, f.brand, f.per100.p, f.per100.salt, f.portions.map(p => p.g)], ['Skyr Natur', 'Milbona', 11, 0.1, [150, 500]]);
    eq('OFF Barcode unbekannt', await T.offBarcode('123', fakeOff), null);
    eq('OFF Suche ohne kaputte Treffer', (await T.offSearch('skyr', fakeOff)).length, 1);
    eq('OFF kJ umgerechnet', T.fromOff({ code: '2', product_name: 'X', nutriments: { energy_100g: 418.4 } }).per100.kcal, 100);
  })();
  eq('Barcode erkannt', [T.isBarcode('4061458061727'), T.isBarcode('skyr')], [true, false]);
}

// ---------- Abgleich (sync.js) mit nachgebautem GitHub ----------
(async () => {
  const Y = require('./sync.js');
  eq('Base64 mit Umlauten', Y.b64decode(Y.b64encode('Hähnchen ½ 🥡')), 'Hähnchen ½ 🥡');
  eq('Repo aus Link', Y.cleanRepo('https://github.com/hendrik/Kochwerk-Daten/'), 'hendrik/Kochwerk-Daten');
  eq('Zugang hin und zurück', Y.parseAccess(Y.accessCode({ repo: 'h/K', token: 'github_pat_123' })), { repo: 'h/K', token: 'github_pat_123' });
  // Nachgebautes GitHub: eine Datei mit sha, PUT nur mit passender sha
  const gh = { file: null, sha: null, n: 0, beforePut: null, priv: true };
  const res = (status, body) => ({ status, ok: status >= 200 && status < 300, json: async () => body, text: async () => typeof body === 'string' ? body : JSON.stringify(body) });
  const fake = async (url, opt = {}) => {
    const path = url.replace('https://api.github.com', '');
    if (/^\/repos\/[^/]+\/[^/]+$/.test(path)) return res(200, { private: gh.priv });
    if (!opt.method) return gh.file == null ? res(404, {}) : res(200, { sha: gh.sha, encoding: 'base64', content: gh.file });
    if (gh.beforePut) { const f = gh.beforePut; gh.beforePut = null; await f(); }
    const b = JSON.parse(opt.body);
    if ((b.sha || null) !== gh.sha) return res(409, {});
    gh.file = b.content; gh.sha = 's' + (++gh.n);
    return res(200, { content: { sha: gh.sha } });
  };
  const cfg = { repo: 'h/Kochwerk-Daten', token: 't' };
  eq('Zugang ok, Datei fehlt noch', await Y.test(cfg, fake), { ok: true, exists: false });
  gh.priv = false; eq('öffentliches Repo abgelehnt', (await Y.test(cfg, fake)).ok, false); gh.priv = true;
  let A = KW.emptyDb(), B2 = KW.emptyDb();
  const ra = KW.importRecipe(A, KW.parseRecipes(sample)[0].recipe, 'new');
  let r1 = await Y.syncOnce(cfg, A, fake, 'iPhone');
  eq('iPhone lädt hoch', [r1.ok, r1.uploaded, r1.fromRemote], [true, true, false]);
  let r2 = await Y.syncOnce(cfg, B2, fake, 'iPad');
  B2 = r2.data;
  eq('iPad bekommt Rezept', [r2.fromRemote, KW.live(B2, 'recipes').length], [true, 1]);
  // beide ändern verschiedene Dinge
  await new Promise(r => setTimeout(r, 5));
  KW.setSetting(B2, 'protein', 170);
  P.setMeal(A, '2026-11-09', 'box', true);
  A = (await Y.syncOnce(cfg, A, fake, 'iPhone')).data;
  B2 = (await Y.syncOnce(cfg, B2, fake, 'iPad')).data;
  A = (await Y.syncOnce(cfg, A, fake, 'iPhone')).data;
  eq('Änderungen beider Geräte zusammengeführt', [KW.getSetting(A, 'protein'), KW.getSetting(B2, 'protein'), !!A.plan[P.mainId('2026-11-09', 'box')], !!B2.plan[P.mainId('2026-11-09', 'box')]], [170, 170, true, true]);
  // gleicher Eintrag auf beiden Geräten: neueste Änderung gewinnt
  KW.put(A, 'recipes', Object.assign({}, A.recipes[ra.id], { name: 'Name vom iPhone' }));
  await new Promise(r => setTimeout(r, 5));
  KW.put(B2, 'recipes', Object.assign({}, B2.recipes[ra.id], { name: 'Name vom iPad' }));
  A = (await Y.syncOnce(cfg, A, fake)).data; B2 = (await Y.syncOnce(cfg, B2, fake)).data; A = (await Y.syncOnce(cfg, A, fake)).data;
  eq('neueste Änderung gewinnt auf beiden', [A.recipes[ra.id].name, B2.recipes[ra.id].name], ['Name vom iPad', 'Name vom iPad']);
  // Löschen kommt an
  await new Promise(r => setTimeout(r, 5));
  KW.remove(A, 'recipes', ra.id);
  A = (await Y.syncOnce(cfg, A, fake)).data; B2 = (await Y.syncOnce(cfg, B2, fake)).data;
  eq('Löschen kommt auf dem iPad an', KW.live(B2, 'recipes').length, 0);
  // Gleichzeitig: iPad lädt zwischen Holen und Hochladen des iPhones hoch → iPhone beginnt neu, nichts geht verloren
  KW.setSetting(A, 'mealKcal', 650);
  gh.beforePut = async () => { KW.setSetting(B2, 'cookDay', 3); B2 = (await Y.syncOnce(cfg, B2, fake)).data; };
  const r3 = await Y.syncOnce(cfg, A, fake); A = r3.data;
  eq('Konflikt: neu geholt, beides erhalten', [r3.ok, KW.getSetting(A, 'mealKcal'), KW.getSetting(A, 'cookDay')], [true, 650, 3]);
  B2 = (await Y.syncOnce(cfg, B2, fake)).data;
  eq('iPad hat danach auch alles', [KW.getSetting(B2, 'mealKcal'), KW.getSetting(B2, 'cookDay')], [650, 3]);
  const r4 = await Y.syncOnce(cfg, A, fake);
  eq('nichts Neues: kein Hochladen', r4.uploaded, false);
  // Offline
  const r5 = await Y.syncOnce(cfg, A, async () => { throw new Error('offline'); });
  eq('offline: kein Absturz', [r5.ok, r5.offline], [false, true]);
  // Schlüssel nie in der Datei
  eq('Schlüssel nicht in der Datei', Y.b64decode(gh.file).includes('"token"'), false);
  // Sicherung
  const bk = Y.parseBackup(Y.exportText(A));
  eq('Sicherung lesbar', [!bk.error, bk.data.app], [true, 'kochwerk']);
  eq('fremde Datei abgelehnt', !!Y.parseBackup('{"foo":1}').error, true);
  console.log(bad ? `\n${bad} Fehler, ${ok} ok` : `Alles ok (${ok} Prüfungen)`);
  process.exit(bad ? 1 : 0);
})();
