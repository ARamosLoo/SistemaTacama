/**
 * ilustraciones.js — genera ilustraciones para los ítems de la carta que no tienen foto en el PDF
 * (bebidas, cocteles, guarniciones, helado kids) y para los vinos y piscos por tipo.
 * Son ilustraciones, no fotos: llevan el prefijo "ilu_" y la app las marca como "Ilustración".
 * Cuando el restaurante tenga la foto real, basta con guardarla como <CODIGO>.jpg en
 * apps/comensal-pwa/public/platos/ (tiene prioridad sobre la ilustración).
 *
 * Requiere el paquete "canvas":  NODE_PATH=<carpeta con node_modules/canvas> node ilustraciones.js
 */
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

const OUT = path.join(__dirname, '../../apps/comensal-pwa/public/platos');
const W = 600, H = 450;

let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

function nuevo() {
  const cv = createCanvas(W, H);
  const c = cv.getContext('2d');
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#F6F9EC');
  g.addColorStop(0.7, '#E3EDC8');
  g.addColorStop(1, '#D4E2AE');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  // mesa
  const t = c.createLinearGradient(0, 330, 0, H);
  t.addColorStop(0, '#EADFC6'); t.addColorStop(1, '#D9CBA8');
  c.fillStyle = t; c.fillRect(0, 335, W, H - 335);
  c.strokeStyle = 'rgba(120,90,40,.12)'; c.lineWidth = 2;
  for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(0, 360 + i * 25); c.lineTo(W, 360 + i * 25); c.stroke(); }
  return { cv, c };
}

const sombra = (c, x, y, w) => {
  c.fillStyle = 'rgba(60,40,10,.22)';
  c.beginPath(); c.ellipse(x, y, w, w * 0.14, 0, 0, Math.PI * 2); c.fill();
};
const poly = (c, pts, fill) => { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fillStyle = fill; c.fill(); };
const rr = (c, x, y, w, h, r, fill) => { c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, r) : c.rect(x, y, w, h); c.fillStyle = fill; c.fill(); };
const circ = (c, x, y, r, fill) => { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fillStyle = fill; c.fill(); };
const elip = (c, x, y, rx, ry, fill, rot = 0) => { c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); c.fillStyle = fill; c.fill(); };

// ── Vasos y copas ─────────────────────────────────────────────
function hielo(c, cx, ytop, n, w, h) {
  for (let i = 0; i < n; i++) {
    const x = cx - w / 2 + 14 + rnd() * (w - 56), y = ytop + 10 + rnd() * (h - 60);
    c.save(); c.translate(x, y); c.rotate((rnd() - 0.5) * 0.7);
    rr(c, 0, 0, 34, 34, 6, 'rgba(255,255,255,.55)');
    c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 2; c.strokeRect(2, 2, 30, 30);
    c.restore();
  }
}
function rodaje(c, x, y, r, a, b) {
  circ(c, x, y, r, a); circ(c, x, y, r - 4, b);
  c.strokeStyle = a; c.lineWidth = 2;
  for (let k = 0; k < 8; k++) { c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(k * Math.PI / 4) * (r - 5), y + Math.sin(k * Math.PI / 4) * (r - 5)); c.stroke(); }
}
function vasoAlto(c, cx, color, { nivel = 0.85, hielos = 0, rodaja = null, pajilla = false, ancho = 130, alto = 250, romero = false } = {}) {
  const base = 335, top = base - alto, wt = ancho, wb = ancho * 0.78;
  sombra(c, cx, base + 6, wt * 0.75);
  poly(c, [[cx - wt / 2, top], [cx + wt / 2, top], [cx + wb / 2, base], [cx - wb / 2, base]], 'rgba(255,255,255,.55)');
  const ly = top + alto * (1 - nivel), lw = (y) => wt - (wt - wb) * ((y - top) / alto);
  poly(c, [[cx - lw(ly) / 2 + 4, ly], [cx + lw(ly) / 2 - 4, ly], [cx + wb / 2 - 4, base - 6], [cx - wb / 2 + 4, base - 6]], color);
  if (hielos) hielo(c, cx, ly, hielos, wb, base - ly);
  poly(c, [[cx - wt / 2 + 12, top + 10], [cx - wt / 2 + 24, top + 10], [cx - wb / 2 + 22, base - 14], [cx - wb / 2 + 12, base - 14]], 'rgba(255,255,255,.45)');
  c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 3;
  c.beginPath(); c.moveTo(cx - wt / 2, top); c.lineTo(cx - wb / 2, base); c.lineTo(cx + wb / 2, base); c.lineTo(cx + wt / 2, top); c.stroke();
  if (pajilla) { c.strokeStyle = '#E0B84C'; c.lineWidth = 7; c.beginPath(); c.moveTo(cx + 10, base - 30); c.lineTo(cx + 46, top - 50); c.stroke(); }
  if (romero) { c.strokeStyle = '#4B7A33'; c.lineWidth = 4; for (let k = 0; k < 5; k++) { c.beginPath(); c.moveTo(cx - 30, top + 10); c.lineTo(cx - 40 + k * 8, top - 40 - k * 3); c.stroke(); } }
  if (rodaja) rodaje(c, cx + wt / 2 - 8, top + 4, 30, rodaja[0], rodaja[1]);
}
function jarra(c, cx, color, grande) {
  const base = 335, w = grande ? 210 : 170, h = grande ? 270 : 220, top = base - h;
  sombra(c, cx, base + 6, w * 0.7);
  rr(c, cx - w / 2, top, w, h, 14, 'rgba(255,255,255,.55)');
  rr(c, cx - w / 2 + 6, top + h * 0.2, w - 12, h * 0.8 - 6, 10, color);
  c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 3; c.beginPath(); c.roundRect ? c.roundRect(cx - w / 2, top, w, h, 14) : c.rect(cx - w / 2, top, w, h); c.stroke();
  c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 12; c.beginPath(); c.ellipse(cx + w / 2 + 6, top + h * 0.45, 34, h * 0.28, 0, -Math.PI / 2, Math.PI / 2); c.stroke();
  rr(c, cx - w / 2 + 14, top + 14, 14, h - 40, 6, 'rgba(255,255,255,.4)');
  hielo(c, cx, top + h * 0.25, 5, w - 20, h * 0.6);
}
function copaCoctel(c, cx, color, { espuma = false, rodaja = null } = {}) {
  sombra(c, cx, 340, 90);
  rr(c, cx - 5, 235, 10, 95, 4, 'rgba(255,255,255,.75)');
  elip(c, cx, 335, 62, 9, 'rgba(255,255,255,.7)');
  c.beginPath(); c.moveTo(cx - 105, 140); c.lineTo(cx + 105, 140); c.quadraticCurveTo(cx + 95, 235, cx, 240); c.quadraticCurveTo(cx - 95, 235, cx - 105, 140); c.closePath();
  c.fillStyle = 'rgba(255,255,255,.55)'; c.fill();
  c.beginPath(); c.moveTo(cx - 92, 158); c.lineTo(cx + 92, 158); c.quadraticCurveTo(cx + 84, 228, cx, 232); c.quadraticCurveTo(cx - 84, 228, cx - 92, 158); c.closePath();
  c.fillStyle = color; c.fill();
  if (espuma) { elip(c, cx, 158, 92, 14, '#FFF6DD'); for (let k = 0; k < 3; k++) circ(c, cx - 20 + k * 20, 156, 3, '#7A4B1E'); }
  c.strokeStyle = 'rgba(255,255,255,.95)'; c.lineWidth = 3;
  c.beginPath(); c.moveTo(cx - 105, 140); c.lineTo(cx + 105, 140); c.quadraticCurveTo(cx + 95, 235, cx, 240); c.quadraticCurveTo(cx - 95, 235, cx - 105, 140); c.stroke();
  if (rodaja) rodaje(c, cx + 100, 140, 28, rodaja[0], rodaja[1]);
}
function vasoCorto(c, cx, color, { cubo = true, piel = false } = {}) {
  const base = 335, top = 215;
  sombra(c, cx, base + 6, 110);
  poly(c, [[cx - 85, top], [cx + 85, top], [cx + 75, base], [cx - 75, base]], 'rgba(255,255,255,.55)');
  poly(c, [[cx - 80, top + 35], [cx + 80, top + 35], [cx + 72, base - 8], [cx - 72, base - 8]], color);
  if (cubo) { rr(c, cx - 38, top + 40, 80, 80, 12, 'rgba(255,255,255,.55)'); c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 2; c.strokeRect(cx - 34, top + 44, 72, 72); }
  c.strokeStyle = 'rgba(255,255,255,.95)'; c.lineWidth = 4;
  c.beginPath(); c.moveTo(cx - 85, top); c.lineTo(cx - 75, base); c.lineTo(cx + 75, base); c.lineTo(cx + 85, top); c.stroke();
  if (piel) { c.strokeStyle = '#E8892B'; c.lineWidth = 8; c.beginPath(); c.arc(cx + 70, top - 4, 24, 0.4, 3.2); c.stroke(); }
}
function copaVino(c, cx, color, { rodaja = null } = {}) {
  sombra(c, cx, 340, 85);
  rr(c, cx - 5, 245, 10, 88, 4, 'rgba(255,255,255,.75)');
  elip(c, cx, 335, 62, 9, 'rgba(255,255,255,.7)');
  c.beginPath(); c.moveTo(cx - 80, 100); c.quadraticCurveTo(cx - 95, 230, cx, 250); c.quadraticCurveTo(cx + 95, 230, cx + 80, 100); c.closePath();
  c.fillStyle = 'rgba(255,255,255,.5)'; c.fill();
  c.beginPath(); c.moveTo(cx - 86, 170); c.lineTo(cx + 86, 170); c.quadraticCurveTo(cx + 92, 235, cx, 246); c.quadraticCurveTo(cx - 92, 235, cx - 86, 170); c.closePath();
  c.fillStyle = color; c.fill();
  elip(c, cx, 170, 86, 10, 'rgba(255,255,255,.25)');
  c.strokeStyle = 'rgba(255,255,255,.95)'; c.lineWidth = 3;
  c.beginPath(); c.moveTo(cx - 80, 100); c.quadraticCurveTo(cx - 95, 230, cx, 250); c.quadraticCurveTo(cx + 95, 230, cx + 80, 100); c.stroke();
  if (rodaja) rodaje(c, cx + 84, 108, 28, rodaja[0], rodaja[1]);
}
function taza(c, cx, color, { espuma = false, alta = false, vapor = true, ancho = 170 } = {}) {
  const base = 335, h = alta ? 120 : 140, top = base - h - 18;
  sombra(c, cx, base + 6, ancho * 0.9);
  elip(c, cx, base - 6, ancho * 0.95, 20, '#FFFFFF');
  elip(c, cx, base - 10, ancho * 0.8, 14, '#F0EFE9');
  c.beginPath(); c.moveTo(cx - ancho / 2, top); c.lineTo(cx + ancho / 2, top); c.quadraticCurveTo(cx + ancho / 2 - 10, base - 12, cx, base - 12); c.quadraticCurveTo(cx - ancho / 2 + 10, base - 12, cx - ancho / 2, top); c.closePath();
  c.fillStyle = '#FFFFFF'; c.fill(); c.strokeStyle = '#E4E2DA'; c.lineWidth = 2; c.stroke();
  c.strokeStyle = '#FFFFFF'; c.lineWidth = 14; c.beginPath(); c.arc(cx + ancho / 2 + 6, top + h * 0.45, 32, -Math.PI / 2, Math.PI / 2); c.stroke();
  c.strokeStyle = '#E4E2DA'; c.lineWidth = 2; c.beginPath(); c.arc(cx + ancho / 2 + 6, top + h * 0.45, 39, -Math.PI / 2, Math.PI / 2); c.stroke();
  elip(c, cx, top + 4, ancho / 2 - 8, 14, color);
  if (espuma) {
    elip(c, cx, top + 4, ancho / 2 - 18, 10, '#F2DFC1');
    c.strokeStyle = '#8A5A2B'; c.lineWidth = 4; c.beginPath(); c.moveTo(cx, top + 10); c.bezierCurveTo(cx - 22, top - 6, cx - 8, top - 8, cx, top + 1); c.bezierCurveTo(cx + 8, top - 8, cx + 22, top - 6, cx, top + 10); c.stroke();
  }
  if (vapor) {
    c.strokeStyle = 'rgba(120,120,120,.35)'; c.lineWidth = 6; c.lineCap = 'round';
    for (let k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(cx + k * 34, top - 14); c.bezierCurveTo(cx + k * 34 - 18, top - 44, cx + k * 34 + 18, top - 64, cx + k * 34, top - 94); c.stroke(); }
    c.lineCap = 'butt';
  }
}
function tazaTe(c, cx, color, { canela = false, sobre = true } = {}) {
  taza(c, cx, color, { alta: true, ancho: 190, vapor: true });
  if (sobre) { c.strokeStyle = '#8B7B5A'; c.lineWidth = 2; c.beginPath(); c.moveTo(cx - 40, 268); c.quadraticCurveTo(cx - 100, 280, cx - 120, 330); c.stroke(); rr(c, cx - 132, 326, 26, 30, 3, '#E7D9A8'); }
  if (canela) { c.strokeStyle = '#8B4A22'; c.lineWidth = 9; c.beginPath(); c.moveTo(cx - 40, 240); c.lineTo(cx + 40, 168); c.stroke(); circ(c, cx - 50, 290, 6, '#3B2A1A'); }
}
function botella(c, cx, color, { tapa = '#333', etiqueta = '#FFF', altura = 280, ancho = 80, texto = null, espumante = false } = {}) {
  const base = 335, top = base - altura;
  sombra(c, cx, base + 6, ancho);
  rr(c, cx - ancho / 2, top + 70, ancho, altura - 70, 14, color);
  c.beginPath(); c.moveTo(cx - ancho / 2, top + 100); c.quadraticCurveTo(cx - ancho / 2, top + 70, cx - 14, top + 56); c.lineTo(cx - 14, top + 6); c.lineTo(cx + 14, top + 6); c.lineTo(cx + 14, top + 56); c.quadraticCurveTo(cx + ancho / 2, top + 70, cx + ancho / 2, top + 100); c.closePath();
  c.fillStyle = color; c.fill();
  rr(c, cx - 15, top, 30, 18, 4, tapa);
  if (espumante) rr(c, cx - 17, top + 4, 34, 60, 4, '#C9A646');
  rr(c, cx - ancho / 2 + 6, top + altura * 0.5, ancho - 12, altura * 0.3, 4, etiqueta);
  if (texto) { c.fillStyle = '#5A5A5A'; c.font = 'bold 12px sans-serif'; c.textAlign = 'center'; c.fillText(texto, cx, top + altura * 0.66); }
  rr(c, cx - ancho / 2 + 10, top + 110, 9, altura - 150, 4, 'rgba(255,255,255,.35)');
}

// ── Platos de acompañamiento ──────────────────────────────────
function plato(c, cx, cy, rx, color = '#FFFFFF') {
  sombra(c, cx, cy + rx * 0.2, rx * 0.95);
  elip(c, cx, cy, rx, rx * 0.34, color);
  elip(c, cx, cy, rx * 0.82, rx * 0.27, '#F1EFEA');
  c.strokeStyle = '#DDD9CF'; c.lineWidth = 2; c.beginPath(); c.ellipse(cx, cy, rx, rx * 0.34, 0, 0, Math.PI * 2); c.stroke();
}
function bol(c, cx, cy, rx, alto) {
  sombra(c, cx, cy + alto + 8, rx);
  c.beginPath(); c.moveTo(cx - rx, cy); c.quadraticCurveTo(cx - rx + 10, cy + alto + 20, cx, cy + alto + 20); c.quadraticCurveTo(cx + rx - 10, cy + alto + 20, cx + rx, cy); c.closePath();
  c.fillStyle = '#FFFFFF'; c.fill(); c.strokeStyle = '#DDD9CF'; c.lineWidth = 2; c.stroke();
  elip(c, cx, cy, rx, rx * 0.26, '#FFFFFF'); c.strokeStyle = '#DDD9CF'; c.stroke();
  elip(c, cx, cy + 2, rx - 10, rx * 0.22, '#EFEDE6');
}
const montículo = (c, cx, cy, rx, h, color) => {
  c.beginPath(); c.moveTo(cx - rx, cy); c.quadraticCurveTo(cx - rx * 0.7, cy - h, cx, cy - h); c.quadraticCurveTo(cx + rx * 0.7, cy - h, cx + rx, cy); c.closePath(); c.fillStyle = color; c.fill();
};

const DIBUJOS = {
  arroz(c) { bol(c, 300, 270, 140, 70); montículo(c, 300, 272, 120, 85, '#FDFCF6'); for (let i = 0; i < 90; i++) { const a = rnd() * Math.PI, r = rnd() * 105; c.save(); c.translate(300 + Math.cos(a) * r * (rnd() < .5 ? 1 : -1), 255 - Math.sin(a) * r * 0.6); c.rotate(rnd() * 3); elip(c, 0, 0, 5, 2, 'rgba(210,205,190,.6)'); c.restore(); } },
  salsaCriolla(c) { bol(c, 300, 270, 130, 60); montículo(c, 300, 272, 110, 50, '#E9A3B5'); for (let i = 0; i < 40; i++) { c.strokeStyle = rnd() < .5 ? '#D9728F' : '#F2C3CF'; c.lineWidth = 5; const x = 215 + rnd() * 170, y = 235 + rnd() * 30; c.beginPath(); c.arc(x, y, 14 + rnd() * 6, 0, 2.4); c.stroke(); } for (let i = 0; i < 12; i++) { circ(c, 230 + rnd() * 140, 240 + rnd() * 25, 3, '#4B8A33'); } },
  chipsCamote(c) { plato(c, 300, 290, 200); for (let i = 0; i < 26; i++) { const x = 200 + rnd() * 200, y = 215 + rnd() * 70; c.save(); c.translate(x, y); c.rotate(rnd() * 3); elip(c, 0, 0, 36, 14, i % 3 ? '#F0A33C' : '#E58B24'); elip(c, 0, 0, 28, 9, 'rgba(255,214,130,.55)'); c.restore(); } },
  papasFritas(c) { plato(c, 300, 290, 200); for (let i = 0; i < 34; i++) { const x = 205 + rnd() * 190, y = 190 + rnd() * 90; c.save(); c.translate(x, y); c.rotate(-0.9 + rnd() * 1.8); rr(c, -8, -50, 16, 100, 4, i % 2 ? '#F2C14E' : '#E5A830'); c.restore(); } },
  palta(c) { plato(c, 300, 290, 200); for (const dx of [-75, 75]) { elip(c, 300 + dx, 245, 58, 78, '#3E6B2A', 0.15 * Math.sign(dx)); elip(c, 300 + dx, 247, 49, 69, '#B6D26B', 0.15 * Math.sign(dx)); elip(c, 300 + dx, 262, 24, 28, '#7B4B28'); elip(c, 296 + dx, 255, 7, 9, 'rgba(255,255,255,.35)'); } },
  pure(c, color, extra) { bol(c, 300, 270, 140, 65); montículo(c, 300, 272, 122, 70, color); c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 5; for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(300, 262, 28 + k * 22, 3.6, 5.8); c.stroke(); } if (extra) extra(c); },
  guiso(c, base, trozos, tono) { bol(c, 300, 270, 140, 65); elip(c, 300, 272, 126, 28, base); for (const [col, r, n] of trozos) for (let i = 0; i < n; i++) circ(c, 220 + rnd() * 160, 262 + rnd() * 22, r, col); if (tono) { c.fillStyle = tono; elip(c, 300, 266, 40, 8, tono); } },
  sopaSeca(c) { plato(c, 300, 290, 200); montículo(c, 300, 285, 150, 90, '#C98A3C'); for (let i = 0; i < 70; i++) { c.strokeStyle = i % 2 ? '#B06C24' : '#E0A650'; c.lineWidth = 3; const x = 200 + rnd() * 200, y = 215 + rnd() * 60; c.beginPath(); c.arc(x, y, 18 + rnd() * 24, rnd() * 3, rnd() * 3 + 2.6); c.stroke(); } for (let i = 0; i < 6; i++) elip(c, 230 + rnd() * 140, 230 + rnd() * 30, 9, 5, '#4B8A33', rnd() * 3); },
  heladoKids(c) {
    sombra(c, 300, 340, 100);
    c.beginPath(); c.moveTo(210, 215); c.lineTo(390, 215); c.quadraticCurveTo(380, 300, 300, 305); c.quadraticCurveTo(220, 300, 210, 215); c.closePath(); c.fillStyle = 'rgba(255,255,255,.6)'; c.fill();
    rr(c, 292, 300, 16, 36, 4, 'rgba(255,255,255,.8)'); elip(c, 300, 338, 60, 8, 'rgba(255,255,255,.8)');
    circ(c, 300, 195, 62, '#FFF4D6'); circ(c, 270, 205, 42, '#FFF9E8'); circ(c, 335, 208, 40, '#FFF0C8');
    c.fillStyle = '#4A2A14'; c.beginPath(); c.moveTo(240, 175); c.quadraticCurveTo(300, 140, 360, 175); c.lineTo(366, 210); c.quadraticCurveTo(350, 235, 340, 205); c.quadraticCurveTo(325, 240, 308, 205); c.quadraticCurveTo(290, 230, 274, 200); c.quadraticCurveTo(255, 235, 244, 205); c.closePath(); c.fill();
    c.strokeStyle = '#D9B98A'; c.lineWidth = 10; c.beginPath(); c.moveTo(340, 170); c.lineTo(395, 95); c.stroke();
  },
};

// ── Mapeo código → dibujo ─────────────────────────────────────
const CALIMON = ['#6BA832', '#CFE69A'];
const ILU = {
  // Coctelería
  'TAC-072': (c) => vasoAlto(c, 300, 'rgba(240,214,120,.85)', { hielos: 5, rodaja: CALIMON, pajilla: true, ancho: 120 }),
  'TAC-073': (c) => vasoAlto(c, 300, 'rgba(244,160,40,.9)', { hielos: 5, rodaja: CALIMON, pajilla: true, ancho: 120 }),
  'TAC-074': (c) => copaCoctel(c, 300, 'rgba(244,226,150,.95)', { espuma: true }),
  'TAC-075': (c) => copaCoctel(c, 300, 'rgba(244,168,40,.95)', { espuma: true }),
  'TAC-076': (c) => vasoCorto(c, 300, 'rgba(132,52,22,.92)', { piel: true }),
  'TAC-077': (c) => vasoAlto(c, 300, 'rgba(250,196,60,.92)', { hielos: 4, rodaja: ['#E8892B', '#FFD58A'], pajilla: true, ancho: 130 }),
  'TAC-078': (c) => copaCoctel(c, 300, 'rgba(236,98,128,.95)', { rodaja: ['#C2395E', '#F5A3B6'] }),
  'TAC-079': (c) => copaVino(c, 300, 'rgba(240,138,150,.95)', { rodaja: ['#E8892B', '#FFD58A'] }),
  'TAC-080': (c) => copaVino(c, 300, 'rgba(110,22,44,.96)'),
  'TAC-081': (c) => vasoAlto(c, 300, 'rgba(235,240,230,.5)', { hielos: 5, romero: true, ancho: 130, nivel: 0.9 }),
  'TAC-082': (c) => vasoAlto(c, 300, 'rgba(176,28,70,.9)', { hielos: 5, ancho: 130, nivel: 0.9 }),
  'TAC-083': (c) => vasoCorto(c, 300, 'rgba(244,196,60,.92)', { cubo: true }),
  'TAC-084': (c) => vasoCorto(c, 300, 'rgba(150,30,34,.93)', { piel: true }),
  // Bebidas
  'TAC-085': (c) => botella(c, 300, '#3A2218', { tapa: '#C0272D', etiqueta: '#C0272D', altura: 290, ancho: 90 }),
  'TAC-086': (c) => botella(c, 300, 'rgba(176,214,238,.8)', { tapa: '#2D7FB8', etiqueta: '#FFFFFF', altura: 290, ancho: 84, texto: 'MUNAY' }),
  'TAC-087': (c) => botella(c, 300, 'rgba(176,214,238,.8)', { tapa: '#2D7FB8', etiqueta: '#FFFFFF', altura: 290, ancho: 84, texto: 'MUNAY' }),
  'TAC-088': (c) => vasoAlto(c, 300, 'rgba(92,20,70,.92)', { hielos: 3, pajilla: true }),
  'TAC-089': (c) => jarra(c, 300, 'rgba(92,20,70,.92)', false),
  'TAC-090': (c) => jarra(c, 300, 'rgba(92,20,70,.92)', true),
  'TAC-091': (c) => vasoAlto(c, 300, 'rgba(250,176,40,.95)', { hielos: 3, pajilla: true }),
  'TAC-092': (c) => jarra(c, 300, 'rgba(250,176,40,.95)', false),
  'TAC-093': (c) => jarra(c, 300, 'rgba(250,176,40,.95)', true),
  'TAC-094': (c) => vasoAlto(c, 300, 'rgba(236,236,150,.92)', { hielos: 3, pajilla: true, rodaja: CALIMON }),
  'TAC-095': (c) => jarra(c, 300, 'rgba(236,236,150,.92)', false),
  'TAC-096': (c) => jarra(c, 300, 'rgba(236,236,150,.92)', true),
  // Café
  'TAC-097': (c) => taza(c, 300, '#2A1A10'),
  'TAC-098': (c) => taza(c, 300, '#3A2214', { ancho: 120, alta: true }),
  'TAC-099': (c) => taza(c, 300, '#3A2214', { ancho: 150, alta: true }),
  'TAC-100': (c) => taza(c, 300, '#7A4B28', { ancho: 130, alta: true }),
  'TAC-101': (c) => taza(c, 300, '#C79A6B', { espuma: true }),
  // Infusiones
  'TAC-102': (c) => tazaTe(c, 300, '#F1DB7A'),
  'TAC-103': (c) => tazaTe(c, 300, '#C0702E', { canela: true }),
  'TAC-104': (c) => tazaTe(c, 300, '#BFD97A'),
  // Guarniciones
  'TAC-062': DIBUJOS.salsaCriolla,
  'TAC-063': DIBUJOS.arroz,
  'TAC-064': DIBUJOS.chipsCamote,
  'TAC-065': DIBUJOS.papasFritas,
  'TAC-066': DIBUJOS.palta,
  'TAC-067': (c) => DIBUJOS.pure(c, '#F7E3A0'),
  'TAC-068': (c) => DIBUJOS.pure(c, '#A8CF7E'),
  'TAC-069': (c) => DIBUJOS.guiso(c, '#EFC24A', [['#FFF6D8', 9, 26], ['#E39A2C', 5, 10]]),
  'TAC-070': (c) => DIBUJOS.guiso(c, '#8A4326', [['#E7C77A', 13, 8], ['#5E2A15', 6, 14]]),
  'TAC-071': DIBUJOS.sopaSeca,
  'TAC-044': DIBUJOS.heladoKids,
};

// Vinos y piscos por tipo (se usan cuando la etiqueta no tiene foto propia)
const ETIQ = {
  vino_tinto: (c) => { botella(c, 255, '#3B1226', { tapa: '#222', etiqueta: '#F6EFD8', altura: 300, ancho: 84, texto: 'TACAMA' }); copaVino(c, 400, 'rgba(110,22,44,.96)'); },
  vino_blanco: (c) => { botella(c, 255, '#B8C98A', { tapa: '#C9C49A', etiqueta: '#FFFFFF', altura: 300, ancho: 84, texto: 'TACAMA' }); copaVino(c, 400, 'rgba(238,224,140,.95)'); },
  vino_espumante: (c) => { botella(c, 255, '#24402B', { tapa: '#C9A646', etiqueta: '#F6EFD8', altura: 310, ancho: 92, texto: 'TACAMA', espumante: true }); copaCoctel(c, 400, 'rgba(244,230,160,.95)'); },
  pisco_puro: (c) => { botella(c, 255, 'rgba(235,238,236,.85)', { tapa: '#6B4A2B', etiqueta: '#F6EFD8', altura: 300, ancho: 84, texto: 'DEMONIO' }); vasoCorto(c, 405, 'rgba(240,244,236,.7)', { cubo: false }); },
  pisco_acholado: (c) => { botella(c, 255, 'rgba(236,230,214,.85)', { tapa: '#6B4A2B', etiqueta: '#EADFC0', altura: 300, ancho: 84, texto: 'DEMONIO' }); vasoCorto(c, 405, 'rgba(238,226,190,.7)', { cubo: false }); },
};

function guardar(nombre, fn) {
  seed = 11;
  const { cv, c } = nuevo();
  fn(c);
  fs.writeFileSync(path.join(OUT, nombre + '.jpg'), cv.toBuffer('image/jpeg', { quality: 0.9 }));
}

for (const [cod, fn] of Object.entries(ILU)) guardar('ilu_' + cod, fn);
for (const [t, fn] of Object.entries(ETIQ)) guardar('ilu_' + t, fn);
console.log('Ilustraciones:', Object.keys(ILU).length + Object.keys(ETIQ).length);
