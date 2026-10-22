/* Zerspanungs-Helfer: Werkstoffe, Werkzeuge und empfohlene Schnittdaten.
   Alle Werte sind Richtwerte für beschichtete Hartmetall- bzw. HSS-E-Werkzeuge in einer stabilen Aufspannung.
   Die Angaben des Werkzeugherstellers gehen immer vor. Läuft im Browser und in Node. */
(function (root) {
  'use strict';
  const T = root.TOL = root.TOL || {};
  const Z = T.Z = {};

  // ----------------------------------------------------------------
  // Werkstoffgruppen nach ISO 513 (P Stahl, M rostfrei, K Guss, N NE-Metalle und Kunststoff, S Titan, H gehärtet)
  // ----------------------------------------------------------------
  Z.GROUPS = [
    { id: 'P', name: 'Stahl', color: '#007AFF' },
    { id: 'M', name: 'Edelstahl (rostfrei)', color: '#FFCC00' },
    { id: 'K', name: 'Gusseisen', color: '#FF3B30' },
    { id: 'N', name: 'Alu, Buntmetall, Kunststoff', color: '#34C759' },
    { id: 'S', name: 'Titan', color: '#FF9500' },
    { id: 'H', name: 'Gehärtet', color: '#8E8E93' }
  ];

  // Werkstoffe: Klasse (für die Tabelle), Faktor für die Schnittgeschwindigkeit innerhalb der Klasse, Hinweis
  Z.MATERIALS = [
    { id: 's235', g: 'P', cls: 'P1', k: 1.0, name: 'S235JR', alt: 'St37, 1.0038', what: 'Baustahl' },
    { id: 's355', g: 'P', cls: 'P1', k: 0.95, name: 'S355J2', alt: 'St52, 1.0577', what: 'Baustahl, zäher' },
    { id: 'c15', g: 'P', cls: 'P1', k: 1.0, name: 'C15', alt: '1.0401', what: 'Einsatzstahl, unlegiert' },
    { id: '16mncr5', g: 'P', cls: 'P1', k: 0.9, name: '16MnCr5', alt: '1.7131', what: 'Einsatzstahl' },
    { id: '11smnpb30', g: 'P', cls: 'P1', k: 1.25, name: '11SMnPb30', alt: '9SMnPb28, 1.0718', what: 'Automatenstahl, sehr gut zerspanbar' },
    { id: 'c45', g: 'P', cls: 'P2', k: 1.0, name: 'C45', alt: '1.0503', what: 'Vergütungsstahl, normalgeglüht' },
    { id: '42crmo4', g: 'P', cls: 'P2', k: 0.85, name: '42CrMo4 vergütet', alt: '1.7225, etwa 900–1100 N/mm²', what: 'Vergütungsstahl' },
    { id: '34crnimo6', g: 'P', cls: 'P2', k: 0.8, name: '34CrNiMo6 vergütet', alt: '1.6582', what: 'Vergütungsstahl, hochfest' },
    { id: '1.2312', g: 'P', cls: 'P3', k: 1.0, name: '1.2312 vorvergütet', alt: '40CrMnMoS8-6, etwa 30 HRC', what: 'Werkzeugstahl (Formenbau)' },
    { id: '1.2842', g: 'P', cls: 'P3', k: 1.05, name: '1.2842 geglüht', alt: '90MnCrV8', what: 'Werkzeugstahl, Kaltarbeit' },
    { id: '1.2343', g: 'P', cls: 'P3', k: 0.95, name: '1.2343 geglüht', alt: 'X37CrMoV5-1', what: 'Werkzeugstahl, Warmarbeit' },
    { id: '1.2379', g: 'P', cls: 'P3', k: 0.8, name: '1.2379 geglüht', alt: 'X153CrMoV12', what: 'Werkzeugstahl, Kaltarbeit, verschleißfest' },
    { id: '1.4301', g: 'M', cls: 'M1', k: 1.0, name: '1.4301', alt: 'X5CrNi18-10, V2A', what: 'austenitisch, der Standard-Edelstahl' },
    { id: '1.4305', g: 'M', cls: 'M1', k: 1.2, name: '1.4305', alt: 'X8CrNiS18-9, V2A Automaten', what: 'austenitisch, mit Schwefel besser zerspanbar' },
    { id: '1.4307', g: 'M', cls: 'M1', k: 1.0, name: '1.4307', alt: 'X2CrNi18-9, 304L', what: 'austenitisch' },
    { id: '1.4404', g: 'M', cls: 'M1', k: 0.9, name: '1.4404', alt: 'X2CrNiMo17-12-2, V4A, 316L', what: 'austenitisch, säurebeständig' },
    { id: '1.4571', g: 'M', cls: 'M1', k: 0.85, name: '1.4571', alt: 'X6CrNiMoTi17-12-2, V4A', what: 'austenitisch, säurebeständig' },
    { id: '1.4104', g: 'M', cls: 'M2', k: 1.1, name: '1.4104', alt: 'X14CrMoS17', what: 'ferritisch, Automaten-Edelstahl' },
    { id: '1.4021', g: 'M', cls: 'M2', k: 1.0, name: '1.4021', alt: 'X20Cr13', what: 'martensitisch' },
    { id: '1.4057', g: 'M', cls: 'M2', k: 0.9, name: '1.4057', alt: 'X17CrNi16-2', what: 'martensitisch, vergütet' },
    { id: '1.4542', g: 'M', cls: 'M3', k: 1.0, name: '1.4542', alt: 'X5CrNiCuNb16-4, 17-4PH', what: 'ausscheidungshärtend' },
    { id: '1.4462', g: 'M', cls: 'M3', k: 0.9, name: '1.4462', alt: 'X2CrNiMoN22-5-3, Duplex', what: 'Duplex, zäh' },
    { id: 'gjl200', g: 'K', cls: 'K1', k: 1.1, name: 'EN-GJL-200', alt: 'GG20', what: 'Grauguss' },
    { id: 'gjl250', g: 'K', cls: 'K1', k: 1.0, name: 'EN-GJL-250', alt: 'GG25', what: 'Grauguss' },
    { id: 'gjs400', g: 'K', cls: 'K2', k: 1.0, name: 'EN-GJS-400-15', alt: 'GGG40', what: 'Sphäroguss' },
    { id: 'gjs600', g: 'K', cls: 'K2', k: 0.8, name: 'EN-GJS-600-3', alt: 'GGG60', what: 'Sphäroguss, fest' },
    { id: '6082', g: 'N', cls: 'N1', k: 1.0, name: 'EN AW-6082', alt: 'AlMgSi1, 3.2315', what: 'Aluminium, Knetlegierung' },
    { id: '5083', g: 'N', cls: 'N1', k: 0.9, name: 'EN AW-5083', alt: 'AlMg4,5Mn, 3.3547', what: 'Aluminium, eher schmierend' },
    { id: '7075', g: 'N', cls: 'N1', k: 1.0, name: 'EN AW-7075', alt: 'AlZnMgCu1,5, 3.4365', what: 'Aluminium, hochfest' },
    { id: '2007', g: 'N', cls: 'N1', k: 1.1, name: 'EN AW-2007', alt: 'AlCuMgPb, 3.1645', what: 'Aluminium, Automatenlegierung' },
    { id: 'alsi', g: 'N', cls: 'N2', k: 1.0, name: 'AlSi10Mg (Guss)', alt: 'EN AC-43000', what: 'Aluminiumguss, mit Silizium' },
    { id: 'cuzn39pb3', g: 'N', cls: 'N3', k: 1.0, name: 'CuZn39Pb3', alt: 'Ms58, 2.0401', what: 'Messing, Automaten' },
    { id: 'cuzn37', g: 'N', cls: 'N3', k: 0.7, name: 'CuZn37', alt: 'Ms63, 2.0321', what: 'Messing ohne Blei, schmierend' },
    { id: 'cu', g: 'N', cls: 'N4', k: 1.0, name: 'Cu-ETP', alt: 'E-Cu, 2.0065', what: 'Kupfer, weich und schmierend' },
    { id: 'cusn8', g: 'N', cls: 'N4', k: 0.8, name: 'CuSn8', alt: 'Bronze, 2.1030', what: 'Zinnbronze' },
    { id: 'pom', g: 'N', cls: 'N5', k: 1.0, name: 'POM', alt: 'Delrin, Hostaform', what: 'Kunststoff, gut zerspanbar' },
    { id: 'pa6', g: 'N', cls: 'N5', k: 0.9, name: 'PA 6', alt: 'Polyamid', what: 'Kunststoff, zäh' },
    { id: 'pe', g: 'N', cls: 'N5', k: 1.0, name: 'PE-HD / PE-UHMW', alt: 'Polyethylen', what: 'Kunststoff, weich' },
    { id: 'peek', g: 'N', cls: 'N5', k: 0.7, name: 'PEEK', alt: '', what: 'Hochleistungskunststoff' },
    { id: 'tigr2', g: 'S', cls: 'S1', k: 1.0, name: 'Titan Grade 2', alt: '3.7035', what: 'Reintitan' },
    { id: 'ti64', g: 'S', cls: 'S1', k: 0.7, name: 'Ti6Al4V', alt: 'Grade 5, 3.7165', what: 'Titanlegierung' },
    { id: 'h50', g: 'H', cls: 'H1', k: 1.0, name: 'Gehärtet 45–55 HRC', alt: 'z. B. 1.2343 gehärtet', what: 'gehärteter Stahl' },
    { id: 'h60', g: 'H', cls: 'H2', k: 1.0, name: 'Gehärtet 55–62 HRC', alt: 'z. B. 1.2379 gehärtet', what: 'gehärteter Stahl' }
  ];

  // Werkzeuge. fam = Spalte in der Tabelle, mode = Reiter
  Z.TOOLS = [
    { id: 'gen', mode: 'mill', name: 'Fräser allgemein (VHM)', fam: 'vhm', op: true },
    { id: 'vhm', mode: 'mill', name: 'Schaftfräser VHM', fam: 'vhm', op: true },
    { id: 'hssm', mode: 'mill', name: 'Schaftfräser HSS', fam: 'hssm', op: true },
    { id: 'face', mode: 'mill', name: 'Messerkopf (Planfräser, WSP)', fam: 'wsp', inserts: true },
    { id: 'shoulder', mode: 'mill', name: 'Eckfräser (WSP)', fam: 'wsp', inserts: true, op: true },
    { id: 'chamfer', mode: 'mill', name: 'Fasenfräser VHM', fam: 'vhm', vcf: 0.8, fzf: 0.6 },
    { id: 'ball', mode: 'mill', name: 'Kugel- / Torusfräser VHM', fam: 'vhm', fzf: 0.8 },
    { id: 'tmill', mode: 'mill', name: 'Gewindefräser VHM', fam: 'vhm', vcf: 0.7, fzf: 0.5, thread: true },
    { id: 'dgen', mode: 'drill', name: 'Bohrer allgemein (VHM)', fam: 'dvhm' },
    { id: 'dhss', mode: 'drill', name: 'Spiralbohrer HSS', fam: 'dhss' },
    { id: 'dvhm', mode: 'drill', name: 'Bohrer VHM', fam: 'dvhm' },
    { id: 'dwsp', mode: 'drill', name: 'Wendeplattenbohrer', fam: 'dwsp' },
    { id: 'spot', mode: 'drill', name: 'NC-Anbohrer / Zentrierbohrer', fam: 'dvhm', vcf: 0.8, ff: 0.6 },
    { id: 'csink', mode: 'drill', name: 'Kegelsenker HSS', fam: 'dhss', vcf: 0.6, ff: 0.7 },
    { id: 'ream', mode: 'drill', name: 'Reibahle VHM', fam: 'ream', ream: true },
    { id: 'tap', mode: 'drill', name: 'Gewindebohrer HSS-E', fam: 'tap', thread: true },
    { id: 'form', mode: 'drill', name: 'Gewindeformer HSS-E', fam: 'form', thread: true },
    { id: 'tgen', mode: 'turn', name: 'Drehen allgemein (HM)', fam: 'turn' },
    { id: 'trough', mode: 'turn', name: 'Schruppen (HM-Platte)', fam: 'turn', plate: 'rough' },
    { id: 'tmed', mode: 'turn', name: 'Mittlere Bearbeitung (HM-Platte)', fam: 'turn', plate: 'med' },
    { id: 'tfin', mode: 'turn', name: 'Schlichten (HM-Platte)', fam: 'turn', plate: 'fin' },
    { id: 'tcermet', mode: 'turn', name: 'Schlichten Cermet', fam: 'turn', plate: 'fin', vcf: 1.15 },
    { id: 'thss', mode: 'turn', name: 'Drehmeißel HSS', fam: 'turnhss', plate: 'med' }
  ];

  // Schnittgeschwindigkeit in m/min je Werkstoffklasse und Werkzeugfamilie (Mittelwert, Bereich etwa ±20 %); null = nicht geeignet
  const FAM = ['vhm', 'hssm', 'wsp', 'dhss', 'dvhm', 'dwsp', 'ream', 'tap', 'form', 'turn', 'turnhss'];
  Z.VC = {
    P1: [220, 35, 260, 30, 120, 220, 70, 15, 25, 280, 45],
    P2: [170, 25, 210, 22, 100, 180, 55, 10, 18, 220, 30],
    P3: [130, 18, 170, 15, 75, 140, 40, 7, 12, 170, 22],
    M1: [110, 15, 180, 12, 60, 150, 25, 6, 10, 180, 20],
    M2: [140, 18, 200, 15, 75, 160, 35, 8, 12, 200, 25],
    M3: [80, 10, 120, 8, 45, 100, 20, 4, 6, 120, 12],
    K1: [200, 25, 230, 25, 110, 180, 60, 15, null, 250, 30],
    K2: [160, 20, 190, 20, 90, 160, 50, 12, null, 200, 25],
    N1: [600, 150, 900, 80, 200, 350, 120, 20, 30, 600, 150],
    N2: [400, 100, 600, 60, 150, 250, 90, 15, null, 400, 100],
    N3: [300, 60, 350, 50, 150, 250, 80, 15, null, 300, 80],
    N4: [250, 50, 300, 40, 120, 200, 60, 12, 20, 250, 60],
    N5: [300, 100, 400, 40, 120, 200, 60, 15, null, 300, 100],
    S1: [60, 10, 70, 8, 35, 60, 15, 4, 5, 60, 10],
    H1: [90, null, 120, null, 45, null, 15, null, null, 120, null],
    H2: [60, null, 80, null, 30, null, 10, null, null, 90, null]
  };
  // Vorschub-Faktor je Klasse (Stahl P1 = 1)
  Z.FEED = { P1: 1.0, P2: 0.9, P3: 0.8, M1: 0.8, M2: 0.9, M3: 0.7, K1: 1.1, K2: 1.0, N1: 1.4, N2: 1.2, N3: 1.2, N4: 1.0, N5: 1.5, S1: 0.7, H1: 0.5, H2: 0.4 };
  // Vorschub je Zahn für VHM-Schaftfräser in Stahl P1 bei seitlichem Fräsen (ae bis d/2), nach Durchmesser
  Z.FZ_VHM = [[1, 0.005], [3, 0.015], [6, 0.03], [10, 0.05], [12, 0.06], [16, 0.075], [20, 0.09], [25, 0.1], [32, 0.11], [50, 0.12]];
  // Bearbeitungsarten beim Schaftfräser: Faktoren für vc und fz, empfohlene ae und ap als Vielfaches von d
  Z.OPS = [
    { id: 'side', name: 'Seitlich schruppen', vcf: 1.0, fzf: 1.0, ae: [0.25, 0.5], ap: [1, 1.5] },
    { id: 'slot', name: 'Nut (Vollnut)', vcf: 0.85, fzf: 0.8, ae: [1, 1], ap: [0.5, 1] },
    { id: 'fin', name: 'Schlichten', vcf: 1.1, fzf: 0.7, ae: [0.02, 0.1], ap: [1, 2] },
    { id: 'hpc', name: 'Trochoidal / dynamisch', vcf: 1.3, fzf: 1.0, ae: [0.05, 0.15], ap: [2, 3] }
  ];
  // Drehen: Plattentyp mit Eckenradius, Vorschub und Schnitttiefe (Stahl P1)
  Z.PLATES = {
    fin: { name: 'Schlichten', r: 0.4, f: [0.05, 0.15], ap: [0.2, 1], vcf: 1.1 },
    med: { name: 'Mittel', r: 0.8, f: [0.15, 0.35], ap: [1, 4], vcf: 1.0 },
    rough: { name: 'Schruppen', r: 1.2, f: [0.3, 0.6], ap: [3, 8], vcf: 0.85 }
  };
  // Reiben: Aufmaß im Durchmesser
  Z.reamAllowance = d => d <= 5 ? [0.1, 0.2] : d <= 20 ? [0.2, 0.3] : [0.3, 0.5];

  // Werkzeugaufnahmen: Rundlauf in µm (typisch), Faktor für den Vorschub, ob für dynamisches Fräsen geeignet
  Z.HOLDERS = [
    { id: 'shrink', name: 'Schrumpffutter', ro: 3, f: 1.0, hpc: true, modes: ['mill', 'drill'] },
    { id: 'hydro', name: 'Hydrodehnspannfutter', ro: 3, f: 1.0, hpc: true, modes: ['mill', 'drill'], note: 'Hydrodehnspannfutter: sehr guter Rundlauf, dämpft Schwingungen. Für schweres Schruppen mit großen Seitenkräften eher Schrumpf- oder Kraftspannfutter.' },
    { id: 'power', name: 'Kraftspannfutter (Powerchuck)', ro: 5, f: 1.0, hpc: true, modes: ['mill'] },
    { id: 'er', name: 'Spannzange ER', ro: 10, f: 0.85, modes: ['mill', 'drill'], note: 'Spannzange: Rundlauf meist 5–15 µm und weniger steif als Schrumpf- oder Hydrodehnspannfutter. Für hohe Zustellungen und dynamisches Fräsen eine steifere Aufnahme nehmen.' },
    { id: 'weldon', name: 'Weldon (Seitenspannung)', ro: 10, f: 0.95, modes: ['mill', 'drill'], note: 'Weldon hält sicher (kein Herausziehen beim Schruppen), läuft aber einseitig: Rundlauf meist 10 µm und mehr.' },
    { id: 'arbor', name: 'Aufsteckfräsdorn (Messerkopf)', ro: 10, f: 1.0, modes: ['mill'] },
    { id: 'chuck', name: 'Bohrfutter', ro: 30, f: 0.7, modes: ['drill'], note: 'Bohrfutter: Rundlauf oft 30 µm und mehr, für VHM-Bohrer ungeeignet (bricht). Nur für HSS-Bohrer.' }
  ];
  // Kühlung: Faktor für vc
  Z.COOL = [
    { id: 'emul', name: 'Emulsion außen', vc: 1.0 },
    { id: 'inner', name: 'Innenkühlung', vc: 1.1 },
    { id: 'mms', name: 'Minimalmenge (MMS)', vc: 0.95 },
    { id: 'air', name: 'Trocken / Luft', vc: 0.9 }
  ];
  // Auskragung L/D: Faktoren für vc, fz und Zustellung (ab 3 × d)
  Z.OVERHANG = [[3, 1, 1, 1], [4, 0.9, 0.85, 0.8], [5, 0.8, 0.7, 0.65], [6, 0.7, 0.55, 0.5], [8, 0.6, 0.45, 0.4], [10, 0.5, 0.35, 0.3]];
  Z.overhang = ld => {
    const t = Z.OVERHANG;
    if (!(ld > t[0][0])) return { vc: 1, fz: 1, a: 1 };
    for (let i = 1; i < t.length; i++) if (ld <= t[i][0]) { const a = t[i - 1], b = t[i], q = (ld - a[0]) / (b[0] - a[0]); return { vc: a[1] + (b[1] - a[1]) * q, fz: a[2] + (b[2] - a[2]) * q, a: a[3] + (b[3] - a[3]) * q }; }
    const l = t[t.length - 1]; return { vc: l[1], fz: l[2], a: l[3] };
  };
  // Bohrtiefe L/D: Faktor für den Vorschub
  Z.drillDepth = ld => !(ld > 3) ? 1 : ld <= 5 ? 0.9 : ld <= 8 ? 0.8 : 0.7;
  // Spezifische Schnittkraft: kc1 in N/mm² bei 1 mm Spanungsdicke, Exponent mc (Richtwerte je Klasse, wie in Herstellerkatalogen)
  Z.KC = { P1: [1500, 0.25], P2: [1700, 0.25], P3: [2000, 0.25], M1: [2000, 0.21], M2: [1850, 0.25], M3: [2350, 0.21], K1: [1100, 0.28], K2: [1350, 0.28], N1: [600, 0.25], N2: [750, 0.25], N3: [700, 0.25], N4: [1000, 0.25], N5: [250, 0.2], S1: [1450, 0.23], H1: [2800, 0.25], H2: [3500, 0.25] };
  Z.kc = (cls, h) => { const [k, mc] = Z.KC[cls]; return k * Math.pow(Math.max(h, 0.005), -mc); };
  // Fräsen: mittlere Spanungsdicke, Schnittleistung, Drehmoment, Schnittkraft, Durchbiegung des Fräsers
  Z.millLoad = function ({ cls, d, z, fz, ae, ap, n, vf, L, lc, hss }) {
    if (!(d > 0 && fz > 0 && ae > 0 && ap > 0 && n > 0 && vf > 0)) return null;
    const e = Math.min(ae, d);
    const phi = Math.acos(1 - 2 * e / d) * 180 / Math.PI;                 // Eingriffswinkel in Grad
    const hm = 360 / (Math.PI * phi) * fz * (e / d);                    // mittlere Spanungsdicke
    const kc = Z.kc(cls, hm);
    const Pc = e * ap * vf * kc / 60e6;                                  // kW
    const Mc = Pc * 30e3 / (Math.PI * n);                                // Nm
    const Fc = 2 * Mc * 1000 / d;                                        // mittlere Schnittkraft am Umfang, N
    const res = { phi, hm, kc, Pc, Mc, Fc, Q: e * ap * vf / 1000 };
    if (L > 0) {
      // Biegebalken: Schaft (voller Ø) bis zur Schneidenlänge, dann der genutete Teil mit etwa 0,8 · d.
      // Die Kraft quer zum Fräser ist etwa 0,6 · Schnittkraft (Mittel der Radial- und Tangentialanteile).
      const E = hss ? 210000 : 600000, I1 = Math.PI * Math.pow(d, 4) / 64, I2 = Math.PI * Math.pow(0.8 * d, 4) / 64;
      const l2 = Math.min(lc > 0 ? lc : L, L);
      res.defl = 0.6 * Fc * ((Math.pow(L, 3) - Math.pow(l2, 3)) / (3 * I1) + Math.pow(l2, 3) / (3 * I2)) / E;   // mm
    }
    return res;
  };
  // Bohren: Schnittleistung Pc = f · vc · d · kc / 240 000 (kW), Spitzenwinkel 140° bzw. 118°
  Z.drillLoad = function ({ cls, d, f, vc, n }) {
    if (!(d > 0 && f > 0 && vc > 0 && n > 0)) return null;
    const hm = f / 2 * Math.sin(70 * Math.PI / 180), kc = Z.kc(cls, hm);
    const Pc = f * vc * d * kc / 240000, Mc = Pc * 30e3 / (Math.PI * n);
    return { hm, kc, Pc, Mc, Ff: 0.5 * kc * d / 2 * f * Math.sin(70 * Math.PI / 180) };
  };
  // Drehen: Pc = vc · ap · f · kc / 60 000 (kW), Einstellwinkel 95°
  Z.turnLoad = function ({ cls, vc, ap, f, n }) {
    if (!(vc > 0 && ap > 0 && f > 0)) return null;
    const hm = f * Math.sin(85 * Math.PI / 180), kc = Z.kc(cls, hm);
    const Fc = kc * ap * f, Pc = Fc * vc / 60e3;
    return { hm, kc, Fc, Pc, Mc: n > 0 ? Pc * 30e3 / (Math.PI * n) : null };
  };
  // Wirksamer Durchmesser beim Kugelfräser bei Zustellung ap
  Z.ballDeff = (d, ap) => ap > 0 && ap < d / 2 ? 2 * Math.sqrt(ap * (d - ap)) : d;

  const interp = (pts, x) => {
    if (x <= pts[0][0]) return pts[0][1] * x / pts[0][0];
    for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; return y0 + (y1 - y0) * (x - x0) / (x1 - x0); }
    return pts[pts.length - 1][1];
  };
  const rng = (mid, lo = 0.8, hi = 1.2) => [mid * lo, mid, mid * hi];
  Z.mat = id => Z.MATERIALS.find(m => m.id === id) || Z.MATERIALS[0];
  Z.tool = id => Z.TOOLS.find(t => t.id === id);
  // Spandickenverdünnung: bei ae < d/2 ist der Span dünner als fz, man darf fz erhöhen (höchstens 2,5-fach)
  Z.chipThin = (ae, d) => { const x = ae / d; if (!(x > 0) || x >= 0.5) return 1; return Math.min(2.5, 1 / (2 * Math.sqrt(x * (1 - x)))); };

  // Empfehlung: liefert vc, fz bzw. f, ae, ap, r als [von, mitte, bis] und Hinweise
  Z.recommend = function ({ mode, mat, tool, d, op, ae, thread, L, lc, holder, cool, depth, ap }) {
    const m = Z.mat(mat), t = Z.tool(tool) || Z.TOOLS.find(x => x.mode === mode);
    const res = { mat: m, tool: t, notes: [], warn: [] };
    const col = FAM.indexOf(t.fam);
    const base = Z.VC[m.cls][col];
    if (base == null) { res.warn.push(`${t.name} ist für ${m.name} nicht geeignet. ${t.fam === 'form' ? 'Gewindeformen geht nur in verformbaren Werkstoffen (nicht in Guss, Messing mit Blei, Kunststoff).' : 'Nimm ein Hartmetall-Werkzeug.'}`); return res; }
    const kf0 = Z.FEED[m.cls];
    let vc = base * m.k * (t.vcf || 1);
    // Aufspannung: Auskragung, Aufnahme, Kühlung
    const ld = L > 0 && d > 0 ? L / d : 0;
    const oh = mode === 'turn' ? { vc: 1, fz: 1, a: 1 } : Z.overhang(ld);
    const ho = Z.HOLDERS.find(h => h.id === holder);
    const co = Z.COOL.find(c => c.id === cool);
    let coolF = co ? co.vc : 1;
    if (co && co.id === 'air' && (m.g === 'M' || m.g === 'S' || m.cls === 'N1' || t.fam === 'hssm' || t.fam === 'dhss' || t.fam === 'turnhss')) coolF = 0.75;
    vc *= oh.vc * coolF;
    const kf = kf0 * oh.fz * (ho ? ho.f : 1) * (mode === 'drill' && depth > 0 && d > 0 ? Z.drillDepth(depth / d) : 1);
    res.factors = { ld, oh, holder: ho, cool: co, coolF };
    if (ld > 3) res.notes.push(`Auskragung ${T.fmt(ld, 0, 1)} × d: vc auf ${Math.round(oh.vc * 100)} %, Vorschub auf ${Math.round(oh.fz * 100)} %${mode === 'mill' ? ` und Zustellung auf ${Math.round(oh.a * 100)} %` : ''} reduziert. So kurz wie möglich spannen.`);
    if (ho && ho.note) res.notes.push(ho.note);
    if (ho && ho.id === 'chuck' && (t.fam === 'dvhm' || t.fam === 'vhm')) res.warn.push('VHM-Werkzeuge nicht im Bohrfutter spannen: Der Rundlauf ist zu schlecht, das Werkzeug bricht.');
    if (ho && mode === 'mill' && op === 'hpc' && !ho.hpc) res.notes.push('Dynamisches Fräsen braucht eine steife Aufnahme mit gutem Rundlauf (Schrumpf-, Hydrodehn- oder Kraftspannfutter).');
    if (co && co.id === 'air' && coolF < 0.8) res.notes.push(m.g === 'S' ? 'Titan nicht trocken bearbeiten, Kühlschmierstoff nötig.' : `Trocken: vc auf ${Math.round(coolF * 100)} % reduziert. ${m.cls === 'N1' ? 'Alu klebt ohne Kühlung an der Schneide.' : 'Für diesen Werkstoff besser mit Kühlung.'}`);
    if (co && co.id === 'air' && (m.g === 'P' || m.g === 'K' || m.g === 'H') && (t.fam === 'vhm' || t.fam === 'wsp')) res.notes.push('Hartmetall in Stahl, Guss und gehärtet: trocken mit Luft ist oft sogar besser (keine Temperaturschocks).');
    if (co && co.id === 'inner' && mode === 'drill') res.notes.push('Innenkühlung: tiefe Bohrungen ohne Entspanen möglich, Druck nach Herstellerangabe.');
    if (mode === 'mill') {
      const o = Z.OPS.find(x => x.id === op) || Z.OPS[0];
      if (t.op) vc *= o.vcf;
      res.vc = rng(vc);
      if (t.inserts) {
        const fz = 0.15 * Math.min(kf, 1.2);
        res.fz = rng(fz, 0.65, 1.35);
        res.notes.push('Wendeschneidplatten: Vorschub je Zahn laut Plattenhersteller (Spanformer). Zum Schlichten eine Planschneide (Wiper) nehmen.');
        if (t.id === 'face') { res.ae = d ? [0.6 * d, 0.7 * d, 0.8 * d] : null; res.notes.push('Messerkopf außermittig ansetzen, Eingriff etwa 60–80 % des Durchmessers, dann läuft er ruhig.'); }
        else if (d) { res.ae = [0.25 * d, 0.4 * d, 0.5 * d]; }
      } else if (d) {
        let fz = interp(Z.FZ_VHM, d) * kf * (t.fam === 'hssm' ? 0.6 : 1) * (t.fzf || 1) * (t.op ? o.fzf : 1);
        if (t.op) {
          res.ae = [o.ae[0] * d, (o.ae[0] + o.ae[1]) / 2 * d, o.ae[1] * d].map(x => o.id === 'slot' ? x : x * oh.a);
          res.ap = [o.ap[0] * d, (o.ap[0] + o.ap[1]) / 2 * d, o.ap[1] * d].map(x => x * (o.id === 'slot' ? oh.a : 1));
          if (lc > 0 && res.ap[2] > lc) { res.ap = res.ap.map(x => Math.min(x, lc)); res.notes.push(`Schneidenlänge ${T.fmt(lc, 0, 1)} mm: Die Zustellung ap ist darauf begrenzt.`); }
          const aeUse = ae > 0 ? ae : res.ae[1];
          const ct = Z.chipThin(aeUse, d);
          if (ct > 1.05 && o.id !== 'slot') { fz *= ct; res.notes.push(`Schmaler Eingriff (ae ${T.fmt(aeUse, 0, 2)} mm): Der Span ist dünner, deshalb ist fz um den Faktor ${T.fmt(ct, 0, 2)} erhöht.`); }
        }
        res.fz = rng(fz);
      }
      if (t.id === 'chamfer') res.notes.push('Fasenfräser: als d den wirksamen Durchmesser an der Fase eingeben (dort, wo geschnitten wird).');
      if (t.id === 'ball') {
        if (d > 0 && ap > 0 && ap < d / 2) { res.deff = Z.ballDeff(d, ap); res.notes.push(`Kugelfräser: Bei ap ${T.fmt(ap, 0, 2)} mm schneidet er nur mit Ø ${T.fmt(res.deff, 0, 2)} mm. Die empfohlene Drehzahl ist darauf gerechnet, sonst wäre vc dort viel zu klein.`); }
        else res.notes.push('Kugelfräser: Gib die Zustellung ap ein, dann rechnet die App mit dem wirksamen Durchmesser.');
      }
      if (t.thread) res.notes.push('Gewindefräsen: Bahn und Steigung kommen aus dem Zyklus der Steuerung, fz gilt am Werkzeugumfang.');
    } else if (mode === 'drill') {
      res.vc = rng(vc);
      if (t.thread) {
        res.vc = rng(vc, 0.8, 1.1);
        if (thread && thread.ok) {
          res.f = [thread.P, thread.P, thread.P];
          res.fixedF = thread.P;
          res.core = t.id === 'form' ? Math.round((thread.d - 0.5 * thread.P) * 100) / 100 : thread.tap;
          res.notes.push(t.id === 'form' ? `Gewindeformen: Vorschub = Steigung. Das Kernloch ist größer als beim Schneiden, etwa d − 0,5 · P = ${T.fmt(res.core, 0, 2)} mm. Gut schmieren (Öl).` : `Gewindebohren: Vorschub = Steigung. Kernloch ${T.fmt(res.core, 0, 2)} mm. Für Sacklöcher spiralgenutet, für Durchgangslöcher mit Schälanschnitt.`);
        }
      } else if (d) {
        let f;
        if (t.fam === 'dwsp') f = 0.08 * Math.min(kf, 1.2);
        else if (t.ream) f = Math.min(0.5, Math.max(0.08, 0.02 * d * Math.min(kf, 1.2)));
        else f = Math.min(t.fam === 'dhss' ? 0.4 : 0.5, Math.max(0.02, (t.fam === 'dhss' ? 0.018 : 0.025) * d * kf));
        f *= t.ff || 1;
        res.f = rng(f, 0.75, 1.25);
        if (t.ream) {
          const a = Z.reamAllowance(d);
          res.allow = a;
          res.pre = [d - a[1], d - a[0]];
          res.notes.push(`Reiben: Aufmaß ${T.fmt(a[0], 0, 2)} bis ${T.fmt(a[1], 0, 2)} mm im Durchmesser, also vorbohren mit Ø ${T.fmt(d - a[1], 0, 2)} bis ${T.fmt(d - a[0], 0, 2)} mm.`);
        }
        const dd = depth > 0 && d > 0 ? depth / d : 0;
        if (dd > 3) res.notes.push(`Bohrtiefe ${T.fmt(dd, 0, 1)} × d: Vorschub auf ${Math.round(Z.drillDepth(dd) * 100)} % reduziert. ${t.fam === 'dhss' ? 'Mit HSS entspanen (Zyklus mit Rückzug).' : dd > 8 ? 'Ab 8 × d mit Pilotbohrung (2–3 × d, gleicher Ø) und Langbohrer mit Innenkühlung.' : 'VHM mit Innenkühlung bis etwa 8 × d ohne Entspanen.'}`);
        else if (t.fam === 'dhss' && !t.vcf) res.notes.push('Ab etwa 3 · d Bohrtiefe entspanen (Bohren mit Spanbruch oder Entspanen).');
        if (t.id === 'spot') res.notes.push('Anbohren: nur so tief, dass der folgende Bohrer an der Fase zentriert (Anbohrer-Ø etwas größer als der Bohrer, 90°).');
      }
    } else {
      const pl = Z.PLATES[t.plate] || Z.PLATES.med;
      vc *= pl.vcf;
      res.vc = rng(vc, 0.85, 1.15);
      const ff = Math.sqrt(Math.min(kf, 1.2));
      res.f = [pl.f[0] * ff, (pl.f[0] + pl.f[1]) / 2 * ff, pl.f[1] * ff];
      res.ap = [pl.ap[0], (pl.ap[0] + pl.ap[1]) / 2, pl.ap[1]];
      res.r = pl.r;
      res.notes.push(`Faustregel: Vorschub höchstens halb so groß wie der Eckenradius (bei r ${T.fmt(pl.r, 0, 1)} also bis ${T.fmt(pl.r / 2, 0, 2)} mm). Schnitttiefe mindestens etwa so groß wie der Eckenradius, sonst drückt die Platte.`);
      if (m.g === 'M') res.notes.push('Edelstahl: nicht zu wenig Vorschub und Schnitttiefe, sonst verfestigt die Oberfläche. Scharfe, positive Platten nehmen.');
      if (m.g === 'S') res.notes.push('Titan: viel Kühlschmierstoff, scharfe Schneiden, niedrige Schnittgeschwindigkeit.');
    }
    if (m.g === 'N' && m.cls === 'N1' && mode !== 'turn') res.notes.push('Aluminium: 2- oder 3-Schneider mit polierten Spannuten, sonst klebt der Span.');
    if (m.g === 'M' && mode === 'mill') res.notes.push('Edelstahl: im Gleichlauf fräsen, nicht reiben lassen, Kühlung.');
    if (m.g === 'H') res.notes.push('Gehärteter Stahl: nur mit Werkzeugen für harte Werkstoffe, kleine Zustellungen, trocken mit Luft.');
    const fzMid = res.fz ? res.fz[1] : null;
    if (ho && fzMid && mode === 'mill' && ho.ro / 1000 > 0.2 * fzMid) res.notes.push(`Rundlauf der Aufnahme etwa ${ho.ro} µm ist groß im Vergleich zu fz ${T.fmt(fzMid, 0, 3)} mm: Eine Schneide trägt deutlich mehr und verschleißt schneller. Bessere Aufnahme oder weniger Schneiden.`);
    return res;
  };

  // Begrenzen auf die Maschine: liefert Hinweise, wenn n oder vf zu hoch sind
  Z.limit = function (v, mach) {
    const out = [];
    if (mach.nmax > 0 && v.n > mach.nmax * 1.001) out.push({ k: 'n', max: mach.nmax });
    if (mach.vfmax > 0 && v.vf > mach.vfmax * 1.001) out.push({ k: 'vf', max: mach.vfmax });
    return out;
  };
})(typeof window !== 'undefined' ? window : globalThis);
