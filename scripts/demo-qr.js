#!/usr/bin/env node
/**
 * demo-qr.js — genera una hoja imprimible con el QR de cada mesa (docs/demo/qr-mesas.html).
 *
 *   node scripts/demo-qr.js                  usa la IP de esta computadora en la red local
 *   node scripts/demo-qr.js http://192.168.1.20:5173   usa otra dirección base (por ejemplo, la web publicada)
 *
 * Los celulares deben estar en la misma red Wi-Fi que esta computadora. El QR abre la carta de esa mesa.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const QRCode = require('qrcode');

const RAIZ = path.join(__dirname, '..');

function ipLocal() {
  for (const lista of Object.values(os.networkInterfaces())) {
    for (const i of lista || []) if (i.family === 'IPv4' && !i.internal && !i.address.startsWith('169.254.')) return i.address;
  }
  return 'localhost';
}

const base = (process.argv[2] || `http://${ipLocal()}:5173`).replace(/\/$/, '');

// Mesas y códigos QR vigentes, tal como están en la base de datos
let filas = [];
try {
  const salida = execFileSync('docker', ['exec', 'tacama-postgres', 'psql', '-U', 'tacama_user', '-d', 'tacamamesa', '-tAF|', '-c', 'select numero, codigo_qr from auth.mesas where activa order by numero'], { encoding: 'utf8' });
  filas = salida.trim().split(/\r?\n/).filter(Boolean).map((l) => l.split('|'));
} catch {
  console.error('No se pudieron leer las mesas (¿está Docker en marcha?).');
  process.exit(1);
}

(async () => {
  const tarjetas = [];
  for (const [numero, codigo] of filas) {
    const url = `${base}/?mesa=${encodeURIComponent(codigo)}`;
    const svg = await QRCode.toString(url, { type: 'svg', margin: 1, width: 220, color: { dark: '#2E4310', light: '#FFFFFF' } });
    tarjetas.push(`<section class="t"><div class="m">Mesa ${String(numero).padStart(2, '0')}</div>${svg}<div class="c">Escanee para ver la carta y pedir desde su mesa</div><div class="u">${url}</div></section>`);
  }
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>QR de mesas · El Tambo de Tacama</title>
<style>
body{font-family:Arial,Helvetica,sans-serif;margin:24px;color:#1F1F1F}
h1{font-family:Georgia,serif;font-size:22px;margin:0 0 4px} p.s{margin:0 0 18px;color:#555;font-size:13px}
.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:16px}
.t{border:2px solid #577A17;border-radius:16px;padding:16px;text-align:center;break-inside:avoid}
.m{font-family:Georgia,serif;font-size:22px;font-weight:bold;color:#2E4310;margin-bottom:6px}
.c{font-size:13px;margin-top:6px}.u{font-size:9px;color:#888;margin-top:6px;word-break:break-all}
@media print{body{margin:8mm}}
</style></head><body>
<h1>El Tambo de Tacama · QR de mesas</h1>
<p class="s">Dirección base: ${base} · generado el ${new Date().toLocaleString('es-PE')}</p>
<div class="g">${tarjetas.join('')}</div></body></html>`;
  const salida = path.join(RAIZ, 'docs', 'demo', 'qr-mesas.html');
  fs.mkdirSync(path.dirname(salida), { recursive: true });
  fs.writeFileSync(salida, html);
  console.log(`QR generados para ${filas.length} mesas apuntando a ${base}`);
  console.log('Hoja imprimible: ' + salida);
})();
