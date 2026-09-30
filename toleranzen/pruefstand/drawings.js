// 15 Testzeichnungen mit Soll-Ergebnis für die Fotoerkennung
const W = 1600, H = 1100;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
function txt(x, y, t, o = {}) {
  const size = o.size || 30, anchor = o.anchor || 'start';
  const tr = o.rot ? ` transform="rotate(${o.rot} ${x} ${y})"` : '';
  const st = o.italic ? ' font-style="italic"' : '';
  return `<text x="${x}" y="${y}" font-size="${size}" text-anchor="${anchor}"${tr}${st} fill="#000" stroke="none">${esc(t)}</text>`;
}
const arrow = (x, y, dir) => {
  const d = { r: `M${x} ${y} l14 -5 v10z`, l: `M${x} ${y} l-14 -5 v10z`, d: `M${x} ${y} l-5 14 h10z`, u: `M${x} ${y} l-5 -14 h10z` }[dir];
  return `<path d="${d}" fill="#000" stroke="none"/>`;
};
function dimH(x1, x2, y, label, o = {}) {
  return `<path d="M${x1} ${y} H${x2}" stroke-width="1.6"/>${arrow(x1, y, 'r')}${arrow(x2, y, 'l')}` + txt((x1 + x2) / 2, y - (o.through ? -9 : 10), label, Object.assign({ anchor: 'middle' }, o));
}
function dimV(y1, y2, x, label, o = {}) {
  const mid = (y1 + y2) / 2;
  return `<path d="M${x} ${y1} V${y2}" stroke-width="1.6"/>${arrow(x, y1, 'd')}${arrow(x, y2, 'u')}` + txt(x - 10, mid, label, Object.assign({ anchor: 'middle', rot: -90 }, o));
}
function stacked(x, y, base, up, lo, size = 30) {
  const w = base.length * size * 0.56;
  const s = Math.round(size * 0.62);
  return txt(x, y, base, { size }) + txt(x + w + 6, y - size * 0.42, up, { size: s }) + txt(x + w + 6, y + size * 0.12, lo, { size: s });
}
function titleBlock(lines, o = {}) {
  let s = `<rect x="900" y="860" width="660" height="210" stroke-width="3"/><path d="M900 930 H1560 M900 1000 H1560 M1230 860 V1000" stroke-width="1.5"/>`;
  const pos = [[915, 905], [1245, 905], [915, 975], [1245, 975], [915, 1045]];
  lines.forEach((l, i) => { s += txt(pos[i][0], pos[i][1], l, { size: o.size || 22, italic: o.italic }); });
  return s;
}
const svg = (inner, o = {}) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="${o.font || 'Liberation Sans'}" fill="none" stroke="#000" style="background:#fff${o.stretch ? ';' : ''}">${o.stretch ? `<g transform="scale(${o.stretch} 1)">` : '<g>'}${inner}</g></svg>`;

const D = [];

// 1 Platte, sauber
const plate = (fs = 30) => svg(
  `<rect x="300" y="250" width="800" height="400" stroke-width="4"/><circle cx="700" cy="450" r="80" stroke-width="3"/><circle cx="400" cy="560" r="25" stroke-width="3"/><circle cx="1000" cy="560" r="25" stroke-width="3"/>` +
  dimH(300, 1100, 190, '120', { size: fs }) + dimV(250, 650, 1180, '80', { size: fs }) +
  `<path d="M750 390 L820 170 H960" stroke-width="1.6"/>` + txt(830, 160, 'Ø10 H7', { size: fs }) +
  txt(320, 300, 'R5', { size: fs }) + `<path d="M400 535 L380 720 H330" stroke-width="1.6"/>` + txt(320, 740, '2x Ø6,6', { size: fs }) +
  titleBlock(['Benennung Platte', 'Maßstab 1:1', 'Werkstoff EN AW-6082', 'Datum 12.03.2026', 'Allgemeintoleranzen ISO 2768-mK']));
D.push({ id: 1, name: 'Platte, sauber', html: plate(), expect: ['120', '80', 'Ø10 H7', 'R5', 'Ø6,6'], general: 'mK' });

// 2 Welle mit senkrechten Durchmessern
const shaft = () => svg(
  `<rect x="200" y="400" width="300" height="250" stroke-width="4"/><rect x="500" y="350" width="400" height="350" stroke-width="4"/><rect x="900" y="425" width="400" height="200" stroke-width="4"/><path d="M150 525 H1350" stroke-dasharray="30 8 6 8" stroke-width="1.5"/>` +
  dimV(400, 650, 170, 'Ø25 k6', { size: 28 }) + dimV(350, 700, 470, 'Ø30 h6', { size: 28 }) + dimV(425, 625, 1330, 'Ø20 g6', { size: 28 }) +
  dimH(200, 500, 780, '40', { size: 28 }) + dimH(500, 900, 780, '60', { size: 28 }) + dimH(200, 1300, 860, '150', { size: 28 }) +
  `<path d="M1300 425 L1380 330 H1480" stroke-width="1.6"/>` + txt(1390, 320, '1x45°', { size: 28 }) +
  titleBlock(['Benennung Welle', 'Maßstab 1:1', 'Werkstoff C45', 'Datum 02.09.2026', 'Allgemeintoleranzen ISO 2768-fH'], {}), { font: 'DejaVu Sans' });
D.push({ id: 2, name: 'Welle, senkrechte Ø', html: shaft(), expect: ['Ø25 k6', 'Ø30 h6', 'Ø20 g6', '40', '60', '150', '1 × 45°'], general: 'fH' });

// 3 Winkel mit senkrechten Maßen, Plus-Minus, Winkelangaben
const angle = () => svg(
  `<path d="M300 800 V300 H420 V680 H1000 V800 Z" stroke-width="4"/>` +
  dimV(300, 800, 250, '50', { size: 30 }) + dimV(680, 800, 1060, '35 ±0,05', { size: 30 }) + dimH(300, 1000, 880, '70', { size: 30 }) +
  dimH(300, 420, 250, '18 +0,1/0', { size: 30 }) + txt(500, 640, '90°', { size: 30 }) + txt(700, 520, '30°', { size: 30 }) + `<path d="M420 680 L700 530" stroke-width="1.5"/>` +
  titleBlock(['Benennung Winkel', 'Maßstab 1:2', 'Werkstoff S235JR', 'Datum 30.09.2026', 'DIN ISO 2768-m']));
D.push({ id: 3, name: 'Winkel, senkrecht und ±', html: angle(), expect: ['50', '35 ±0,05', '70', '18 +0,1/0', '90°', '30°'], general: 'm' });

// 4 Hochgestellte Abmaße
const stackedDwg = () => svg(
  `<rect x="300" y="300" width="900" height="350" stroke-width="4"/><circle cx="750" cy="475" r="60" stroke-width="3"/>` +
  `<path d="M300 220 H700" stroke-width="1.6"/>${arrow(300, 220, 'r')}${arrow(700, 220, 'l')}` + stacked(470, 208, '25', '+0,1', '−0,05') +
  `<path d="M700 160 H1200" stroke-width="1.6"/>${arrow(700, 160, 'r')}${arrow(1200, 160, 'l')}` + stacked(920, 148, '40', '+0,2', '0') +
  `<path d="M300 740 H1200" stroke-width="1.6"/>${arrow(300, 740, 'r')}${arrow(1200, 740, 'l')}` + stacked(720, 728, '60', '−0,1', '−0,3') +
  `<path d="M790 430 L870 250 H990" stroke-width="1.6"/>` + txt(880, 240, 'Ø16 H7') +
  titleBlock(['Benennung Deckel', 'Maßstab 1:1', 'Werkstoff 1.4301', 'Datum 11.08.2026', 'Allgemeintoleranzen ISO 2768-mK']));
D.push({ id: 4, name: 'Hochgestellte Abmaße', html: stackedDwg(), expect: ['25 +0,1/−0,05', '40 +0,2/0', '60 −0,1/−0,3', 'Ø16 H7'], general: 'mK' });

// 5 Kursive ISO-Schrift, schmal
const italic = () => svg(
  `<rect x="330" y="300" width="900" height="380" stroke-width="4"/><circle cx="780" cy="490" r="90" stroke-width="3"/>` +
  dimH(330, 1230, 240, '100', { italic: true }) + dimV(300, 680, 290, '55', { italic: true }) +
  `<path d="M840 420 L930 200 H1060" stroke-width="1.6"/>` + txt(940, 190, 'Ø40 H7/g6', { italic: true }) +
  txt(350, 350, 'R10', { italic: true }) + txt(1050, 640, '15°', { italic: true }) +
  titleBlock(['Benennung Lagerbock', 'Maßstab 1:1', 'Werkstoff GJL-250', 'Datum 05.05.2026', 'Allgemeintoleranzen ISO 2768-mK'], { italic: true }), { font: 'DejaVu Sans', stretch: 0.88 });
D.push({ id: 5, name: 'Kursive, schmale Schrift', html: italic(), expect: ['100', '55', 'Ø40 H7/g6', 'R10', '15°'], general: 'mK' });

// 6 bis 9: Fotoeffekte
D.push({ id: 6, name: 'Platte als Handyfoto (schief, unscharf, Rauschen)', html: plate(), fx: { rot: 3, blur: 0.8, noise: 0.18, jpeg: 55 }, expect: D[0].expect, general: 'mK' });
D.push({ id: 7, name: 'Welle mit Schatten, graues Papier', html: shaft(), fx: { shadow: true, paper: true, contrast: 0.75, jpeg: 65 }, expect: D[1].expect, general: 'fH' });
D.push({ id: 8, name: 'Winkel in Perspektive', html: angle(), fx: { persp: true, blur: 0.5, jpeg: 70 }, expect: D[2].expect, general: 'm' });
D.push({ id: 9, name: 'Platte aus der Ferne (kleine Schrift)', html: plate(), fx: { scale: 0.55, jpeg: 75 }, expect: D[0].expect, general: 'mK' });

// 10 Passungen und Winkel
const fits = () => svg(
  `<rect x="250" y="300" width="1000" height="380" stroke-width="4"/><circle cx="450" cy="490" r="50" stroke-width="3"/><circle cx="750" cy="490" r="40" stroke-width="3"/><circle cx="1050" cy="490" r="70" stroke-width="3"/>` +
  `<path d="M480 450 L520 220 H620" stroke-width="1.6"/>` + txt(530, 210, '20 H7/g6') +
  `<path d="M770 460 L820 180 H930" stroke-width="1.6"/>` + txt(830, 170, '12 H7/n6') +
  `<path d="M1090 430 L1150 240 H1300" stroke-width="1.6"/>` + txt(1160, 230, 'Ø40 H8/f7') +
  txt(300, 760, '30°') + txt(600, 760, '120°') + dimH(250, 1250, 840, '45 ±0,2') +
  titleBlock(['Benennung Aufnahme', 'Maßstab 1:1', 'Werkstoff 42CrMo4', 'Datum 19.07.2026', 'Allgemeintoleranzen ISO 2768-cL']), { font: 'FreeSans' });
D.push({ id: 10, name: 'Passungen und Winkel', html: fits(), expect: ['20 H7/g6', '12 H7/n6', 'Ø40 H8/f7', '30°', '120°', '45 ±0,2'], general: 'cL' });

// 11 Maßlinien durch den Text, Schraffur
const crossed = () => {
  let hatch = '';
  for (let i = 0; i < 18; i++) hatch += `<path d="M${320 + i * 25} 640 l60 -60" stroke-width="1"/>`;
  return svg(`<rect x="300" y="300" width="900" height="340" stroke-width="4"/>${hatch}<circle cx="800" cy="470" r="70" stroke-width="3"/>` +
    `<path d="M300 200 H1200" stroke-width="1.6"/>${arrow(300, 200, 'r')}${arrow(1200, 200, 'l')}` + txt(750, 210, '150', { anchor: 'middle' }) +
    `<path d="M730 470 H1300" stroke-width="1.6"/>` + txt(1000, 480, 'Ø32 H7', { anchor: 'middle' }) +
    dimV(300, 640, 250, '75') + txt(330, 360, 'R8') + `<path d="M310 350 L420 350" stroke-width="1.2"/>` +
    titleBlock(['Benennung Flansch', 'Maßstab 1:1', 'Werkstoff S355', 'Datum 21.04.2026', 'Allgemeintoleranzen ISO 2768-mK']));
};
D.push({ id: 11, name: 'Maßlinien durch den Text', html: crossed(), expect: ['150', 'Ø32 H7', '75', 'R8'], general: 'mK' });

// 12 Viele Maße
const dense = () => {
  let s = `<rect x="300" y="250" width="900" height="500" stroke-width="4"/>`;
  const hs = [['10', 300, 360], ['15', 360, 450], ['20', 450, 570], ['25', 570, 720], ['35', 720, 900], ['45', 900, 1200]];
  hs.forEach(([t, a, b], i) => { s += dimH(a, b, 200 - (i % 2) * 45, t); });
  const vs = [['55', 250, 420], ['65', 420, 600], ['85', 600, 750]];
  vs.forEach(([t, a, b]) => { s += dimV(a, b, 250, t); });
  s += dimH(300, 1200, 830, '130') + dimV(250, 750, 1270, '105') + dimH(500, 1200, 890, '95') + dimV(300, 750, 1340, '175') + dimH(300, 1100, 950, '210');
  return svg(s + titleBlock(['Benennung Grundplatte', 'Maßstab 1:5', 'Werkstoff S235JR', 'Datum 07.07.2026', 'Allgemeintoleranzen ISO 2768-m']));
};
D.push({ id: 12, name: 'Viele Maße', html: dense(), expect: ['10', '15', '20', '25', '35', '45', '55', '65', '85', '130', '105', '95', '175', '210'], general: 'm' });

// 13 Schriftfeld-Schreibweisen
const tbv = () => svg(`<rect x="300" y="300" width="700" height="300" stroke-width="4"/><circle cx="650" cy="450" r="40" stroke-width="3"/>` +
  dimH(300, 1000, 240, '200') + `<path d="M680 420 L740 230 H840" stroke-width="1.6"/>` + txt(750, 220, 'Ø12') +
  titleBlock(['Benennung Leiste', 'Maßstab 1:2', 'Werkstoff S235JR', 'Blatt 1/2', 'Allgemeintoleranzen: DIN ISO 2768 - c L']));
D.push({ id: 13, name: 'Schriftfeld anders geschrieben', html: tbv(), expect: ['200', 'Ø12'], general: 'cL' });

// 14 Nur Text, keine Maße (darf nichts finden)
const neg = () => svg(txt(200, 200, 'Hinweise:', { size: 30 }) + txt(200, 260, 'Alle Kanten entgratet', { size: 28 }) + txt(200, 320, 'Gewinde M8x1 nach Norm', { size: 28 }) + txt(200, 380, 'Oberfläche Ra 1,6', { size: 28 }) +
  txt(200, 440, 'Gewicht 0,35 kg', { size: 28 }) + txt(200, 500, 'Zeichnungsnr. 4711-02', { size: 28 }) +
  titleBlock(['Benennung Hinweisblatt', 'Maßstab 2:1', 'Werkstoff 1.4301', 'Datum 01.10.2026', 'Blatt 1 von 2']));
D.push({ id: 14, name: 'Nur Hinweise, keine Maße', html: neg(), expect: [], general: null });

// 15 ISO 22081
const iso22081 = () => svg(`<rect x="300" y="300" width="800" height="350" stroke-width="4"/><circle cx="700" cy="470" r="50" stroke-width="3"/>` +
  dimH(300, 1100, 240, '50') + dimV(300, 650, 250, '30') + `<path d="M730 440 L800 200 H900" stroke-width="1.6"/>` + txt(810, 190, 'Ø12 H7') +
  txt(920, 900, 'ISO 22081', { size: 26 }) + `<rect x="920" y="930" width="360" height="54" stroke-width="2"/><path d="M990 930 V984 M1090 930 V984 M1150 930 V984 M1215 930 V984" stroke-width="2"/><path d="M935 972 a20 20 0 0 1 40 0 z" stroke-width="2"/>` +
  txt(1010, 968, '0,4', { size: 26 }) + txt(1110, 968, 'A', { size: 26 }) + txt(1172, 968, 'B', { size: 26 }) + txt(1238, 968, 'C', { size: 26 }));
D.push({ id: 15, name: 'ISO 22081 statt ISO 2768', html: iso22081(), expect: ['50', '30', 'Ø12 H7'], general: null, iso22081: true });

// 16, 17: Blatt schräg auf dunklem Tisch (Zuschneiden und Entzerren)
D.push({ id: 16, name: 'Platte auf dem Tisch, schräg', html: plate(), fx: { table: { rx: 18, ry: -10, rz: -4 }, jpeg: 70 }, shotCrop: true, expect: D[0].expect, general: 'mK' });
D.push({ id: 17, name: 'Passungen auf dem Tisch, gedreht', html: fits(), fx: { table: { rx: 8, ry: 12, rz: 7 }, blur: 0.4, jpeg: 70 }, expect: D[9].expect, general: 'cL' });
module.exports = D;
