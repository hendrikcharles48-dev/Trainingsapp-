// Prüft die Werkstatt-Tabellen gegen bekannte Normwerte (wird von test.js aufgerufen)
module.exports = function (T, eq) {
  const W = T.W;
  const r = (x, d) => Math.round(x * 10 ** d) / 10 ** d;

  // Metrisches Regelgewinde: Steigung, Flanken-, Kerndurchmesser, Spannungsquerschnitt (ISO 724, ISO 898-1), Kernloch (DIN 336)
  [['M3', 0.5, 2.675, 2.387, 2.459, 5.03, 2.5], ['M4', 0.7, 3.545, 3.141, 3.242, 8.78, 3.3], ['M5', 0.8, 4.480, 4.019, 4.134, 14.2, 4.2],
   ['M6', 1, 5.350, 4.773, 4.917, 20.1, 5], ['M8', 1.25, 7.188, 6.466, 6.647, 36.6, 6.8], ['M10', 1.5, 9.026, 8.160, 8.376, 58.0, 8.5],
   ['M12', 1.75, 10.863, 9.853, 10.106, 84.3, 10.2], ['M16', 2, 14.701, 13.546, 13.835, 157, 14], ['M20', 2.5, 18.376, 16.933, 17.294, 245, 17.5],
   ['M24', 3, 22.051, 20.319, 20.752, 353, 21], ['M30', 3.5, 27.727, 25.706, 26.211, 561, 26.5]
  ].forEach(([q, P, d2, d3, D1, As, tap]) => {
    const t = W.parseThread(q);
    eq('Gewinde ' + q, [t.P, r(t.d2, 3), r(t.d3, 3), r(t.d1, 3), As >= 100 ? Math.round(t.As) : r(t.As, As >= 10 ? 1 : 2), t.tap], [P, d2, d3, D1, As, tap]);
  });
  eq('Feingewinde M10x1', [W.parseThread('M10x1').P, W.parseThread('M10x1').tap, W.parseThread('M10 x 1,25').tap, W.parseThread('m12x1.5').tap], [1, 9, 8.8, 10.5]);
  eq('Regelgewinde mit Steigung erkannt', W.parseThread('M8x1.25').name, 'M8');
  eq('Kein Regelgewinde M99', W.parseThread('M99').ok, false);

  // Rohrgewinde G nach ISO 228-1
  [['G1/8', 9.728, 28, 9.147, 8.566], ['G1/4', 13.157, 19, 12.301, 11.445], ['G3/8', 16.662, 19, 15.806, 14.950], ['G1/2', 20.955, 14, 19.793, 18.631],
   ['G3/4', 26.441, 14, 25.279, 24.117], ['G1', 33.249, 11, 31.770, 30.291], ['G 1 1/4', 41.910, 11, 40.431, 38.952], ['G2', 59.614, 11, 58.135, 56.656]
  ].forEach(([q, d, tpi, d2, d1]) => { const t = W.parseThread(q); eq('Gewinde ' + q, [t.d, t.tpi, r(t.d2, 3), r(t.d1, 3)], [d, tpi, d2, d1]); });

  // Tabellenwerte G passen zum Whitworth-Profil (d2 = d − 0,6403 P, d1 = d − 1,2807 P)
  W.G.forEach(g => { const P = 25.4 / g[2]; eq('G-Profil ' + g[0], Math.abs(g[4] - (g[1] - 0.640327 * P)) < 0.0015 && Math.abs(g[5] - (g[1] - 1.280654 * P)) < 0.0015, true); });

  // Unified: Spannungsquerschnitt 1/4-20 UNC = 0,0318 in² = 20,5 mm², 1/2-13 UNC = 0,1419 in² = 91,5 mm²
  eq('1/4-20 UNC', [W.parseThread('1/4-20 UNC').tpi, r(W.parseThread('1/4-20 UNC').As, 1)], [20, 20.5]);
  eq('1/2-13 UNC', r(W.parseThread('1/2-13').As, 1), 91.5);
  eq('1/4-28 ist UNF', W.parseThread('1/4-28').type, 'UNF');
  eq('3/8 UNF', W.parseThread('UNF 3/8').tpi, 24);

  // Trapezgewinde ISO 2904
  [['Tr20x4', 18, 15.5, 16, 20.5], ['Tr16x4', 14, 11.5, 12, 16.5], ['Tr40x7', 36.5, 32, 33, 41], ['Tr10x2', 9, 7.5, 8, 10.5]
  ].forEach(([q, d2, d3, D1, D4]) => { const t = W.parseThread(q); eq('Gewinde ' + q, [t.d2, t.d3, t.D1, t.D4], [d2, d3, D1, D4]); });

  // Schlüsselweiten
  eq('SW M10 ISO und DIN', [W.screw(10).swIso, W.screw(10).swDin, W.screw(10).sw4762], [16, 17, 8]);
  eq('SW M12', [W.screw(12).swIso, W.screw(12).swDin, W.screw(12).sw4762], [18, 19, 10]);
  eq('SW M8', [W.screw(8).swIso, W.screw(8).sw4762, W.screw(8).sw10642], [13, 6, 5]);
  eq('Durchgang M8', W.screw(8).hole, [8.4, 9, 10]);
  eq('Spalten gleich lang', [W.SW_ISO, W.SW_DIN, W.SW_4762, W.DK_4762, W.SW_10642, W.SW_7380, W.SW_4026, W.HOLE_273, W.CBORE_974].every(a => a.length === W.SCREW_SIZES.length), true);
  // ISO-Sechskant ist nie kleiner als der Innensechskant, Senkung größer als der Kopf
  W.SCREW_SIZES.forEach((d, i) => { if (W.CBORE_974[i]) eq('Senkung > Kopf M' + d, W.CBORE_974[i][0] > W.DK_4762[i], true); if (W.HOLE_273[i]) eq('Durchgang steigt M' + d, W.HOLE_273[i][0] > d && W.HOLE_273[i][0] < W.HOLE_273[i][1] && W.HOLE_273[i][1] < W.HOLE_273[i][2], true); });

  // Drehmoment: 10.9 und 12.9 stehen im Verhältnis der Streckgrenzen zu 8.8 (bis M16: 640, darüber 660 N/mm²)
  W.TORQUE.sizes.forEach((d, i) => {
    const r1 = W.TORQUE['10.9'][i] / W.TORQUE['8.8'][i], want = 940 / (d <= 16 ? 640 : 660);
    eq('Drehmoment Verhältnis M' + d, Math.abs(r1 / want - 1) < 0.02, true);
    eq('Drehmoment 12.9/10.9 M' + d, Math.abs(W.TORQUE['12.9'][i] / W.TORQUE['10.9'][i] / (1100 / 940) - 1) < 0.02, true);
  });
  eq('Drehmoment M8 8.8', W.torque(8, '8.8').MA, 24.6);

  // Schnittdaten
  eq('Drehzahl vc 100, d 10', Math.round(W.rpm(100, 10)), 3183);
  eq('Fräsen vf', Math.round(W.milling({ d: 10, vc: 100, z: 4, fz: 0.05 }).vf), 637);
  eq('Fräsen vc aus n', r(W.milling({ d: 10, n: 3183.1 }).vc, 1), 100);
  eq('Drehen Q', W.turning({ d: 50, vc: 200, f: 0.2, ap: 2 }).Q, 80);

  // Rauheit
  eq('Rth f 0,2 r 0,8', W.roughTurn(0.2, 0.8).Rth, 6.25);
  eq('Vorschub für Rz 6,25', r(W.feedForRz(6.25, 0.8), 4), 0.2);
  eq('N7', W.nClass(1.6), 'N7');

  // Gewicht: Rundstahl Ø20 mm, 1 m = 2,466 kg; Rohr 30×2; Sechskant SW 20
  eq('Gewicht Rund 20', r(W.weight('rund', { d: 20 }, 1000, 7.85).m, 3), 2.466);
  eq('Gewicht Rohr 30x2', r(W.weight('rohr', { D: 30, s: 2 }, 1000, 7.85).perM, 3), 1.381);
  eq('Gewicht Sechskant 20', r(W.weight('sechs', { s: 20 }, 1000, 7.85).perM, 3), 2.719);
  eq('Rohr zu dick', W.weight('rohr', { D: 10, s: 6 }, 100, 7.85).ok, false);

  // Dreieck
  const rt = W.rightTriangle({ a: 3, b: 4 });
  eq('Pythagoras', [rt.c, r(rt.al, 4)], [5, 36.8699]);
  eq('Rechtwinklig c und α', [r(W.rightTriangle({ c: 10, al: 30 }).a, 6)], [5]);
  eq('Zu viele Werte', W.rightTriangle({ a: 3, b: 4, c: 5 }).ok, false);
  eq('Hypotenuse zu kurz', W.rightTriangle({ a: 5, c: 4 }).ok, false);
  eq('SWS', r(W.triangle('SWS', { b: 4, c: 3, al: 90 }).a, 6), 5);
  eq('WSW', r(W.triangle('WSW', { c: 10, al: 60, be: 60 }).a, 6), 10);
  eq('SSS unmöglich', W.triangle('SSS', { a: 1, b: 2, c: 5 }).ok, false);

  // Gleitschleifen
  const tw = W.trowal(60, 0.8, 'fein', 'ker');
  eq('Gleitschleifen', [tw.Vf, tw.Vp, tw.Vm], [48, 8, 40]);

  // Schnellsuche
  const kinds = q => W.search(q).map(x => x.kind + ':' + x.title);
  eq('Suche M3', kinds('M3')[0], 'thread:Gewinde M3');
  eq('Suche 6H7', kinds('6H7')[0], 'iso:ISO-Toleranz 6 H7');
  eq('Suche Passung', kinds('25H7/g6')[0], 'fit:Passung 25 H7/g6');
  eq('Suche SW13', W.search('SW13')[0].sub, 'M8 Sechskant ISO');
  eq('Suche Kernloch', W.search('Kernloch').some(x => x.page === 'thread'), true);
  eq('Suche G1/2', kinds('G1/2')[0], 'thread:Gewinde G 1/2');
};
