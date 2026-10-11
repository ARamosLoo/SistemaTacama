#!/usr/bin/env node
/**
 * demo-reset.js — deja el sistema listo para una demostración (solo entorno local de demo).
 *
 *   node scripts/demo-reset.js                 restablece todo y carga el historial de ejemplo
 *   node scripts/demo-reset.js --sin-historial restablece todo sin datos de ejemplo
 *
 * Qué hace:
 *   - Borra comandas, valoraciones, movimientos de inventario, eventos y auditoría de pruebas anteriores.
 *   - Restablece la carta (precios, disponibilidad y fotos) y el stock de la bodega a los valores iniciales.
 *   - Borra las fotos subidas desde administración y vacía la caché (Redis).
 *   - Carga un historial de EJEMPLO (comandas, calificaciones, venta cruzada y consumo de vinos) para que
 *     los indicadores y los avisos de stock se vean con vida. Esos números son ficticios.
 * Requiere los contenedores de Docker en marcha (tacama-postgres y tacama-redis).
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const SIN_HISTORIAL = process.argv.includes('--sin-historial');
const q = (s) => "'" + String(s).replace(/'/g, "''") + "'";

// Generador pseudoaleatorio con semilla fija: el historial de ejemplo siempre es el mismo
let semilla = 20261011;
const rnd = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647);
const entre = (a, b) => a + Math.floor(rnd() * (b - a + 1));

function psql(sql) {
  return execFileSync('docker', ['exec', '-i', 'tacama-postgres', 'psql', '-U', 'tacama_user', '-d', 'tacamamesa', '-v', 'ON_ERROR_STOP=1', '-q'], {
    input: sql, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'],
  });
}

function leerEnv(clave) {
  const linea = fs.readFileSync(path.join(RAIZ, '.env'), 'utf8').split(/\r?\n/).find((l) => l.startsWith(clave + '='));
  return linea ? linea.slice(clave.length + 1).trim() : '';
}

const platos = JSON.parse(fs.readFileSync(path.join(RAIZ, 'infra/data/carta-tacama.json'), 'utf8'));
const etiquetas = JSON.parse(fs.readFileSync(path.join(RAIZ, 'infra/data/etiquetas-tacama.json'), 'utf8'));
const listaPlatos = platos.platos || platos;

const sql = [];
sql.push('BEGIN;');
// ── Operación: se borra lo de pruebas anteriores
sql.push('TRUNCATE comandas.valoraciones, comandas.restricciones_alergenos, comandas.detalle_comandas, comandas.comandas CASCADE;');
sql.push('TRUNCATE inventario.movimientos_inventario;');
sql.push('TRUNCATE analitica.eventos_negocio;');
sql.push('DELETE FROM analitica.log_auditoria;');
sql.push('DELETE FROM analitica.indicadores_diarios;');

// ── Carta: precios, disponibilidad y fotos originales
for (const p of listaPlatos) {
  const img = p.imagen ? q('/platos/' + p.imagen + '.jpg') : 'NULL';
  sql.push(`UPDATE catalogo.platos SET precio_base = ${Number(p.precio)}, disponible = true, rol = ${q(p.rol)}, imagen_url = ${img} WHERE codigo_interno = ${q(p.codigo)};`);
}

// ── Bodega: stock y umbral iniciales, todo disponible
for (const e of etiquetas) {
  sql.push(`UPDATE inventario.etiquetas SET activa = true, umbral_minimo = ${Number(e.umbral)} WHERE codigo_interno = ${q(e.codigo)};`);
  sql.push(`UPDATE inventario.existencias x SET stock_actual = ${Number(e.stock)}, ultima_actualizacion = now() FROM inventario.etiquetas t WHERE t.id = x.etiqueta_id AND t.codigo_interno = ${q(e.codigo)};`);
}

// ── Historial de ejemplo
const resumen = {};
if (!SIN_HISTORIAL) {
  const dias = 6;
  const evento = (tipo, minutosAtras, payload) =>
    `INSERT INTO analitica.eventos_negocio (id, tipo, payload, procesado, "timestamp") VALUES (gen_random_uuid(), ${q(tipo)}, ${q(JSON.stringify({ ...payload, origen: 'demo' }))}::jsonb, true, now() - interval '${minutosAtras} minutes');`;
  const auditoria = (cat, entidad, accion, datos, minutosAtras) =>
    `INSERT INTO analitica.log_auditoria (id, entidad, accion, datos_despues, categoria, servicio, "timestamp") VALUES (gen_random_uuid(), ${q(entidad)}, ${q(accion)}, ${q(JSON.stringify({ ...datos, origen: 'demo' }))}::jsonb, ${q(cat)}::analitica."CategoriaEvento", 'demo', now() - interval '${minutosAtras} minutes');`;

  // Momento de servicio dentro de los últimos días (entre 12:00 y 20:00)
  const minutosAtras = () => entre(1, dias) * 24 * 60 + entre(60, 8 * 60) + 90;

  let comandas = 26, anuladas = 2;
  for (let i = 0; i < comandas; i++) {
    const m = minutosAtras();
    const total = entre(58, 214) + (rnd() < 0.5 ? 0.5 : 0);
    sql.push(evento('comanda.confirmada', m, { comandaId: 'demo-' + i, total }));
    sql.push(auditoria('COMANDA', 'Comanda', 'COMANDA.CONFIRMADA', { comandaId: 'demo-' + i, total }, m));
  }
  for (let i = 0; i < anuladas; i++) {
    const m = minutosAtras();
    sql.push(evento('comanda.anulada', m, { comandaId: 'demo-anulada-' + i, motivo: 'Anulada por el comensal' }));
  }
  const emitidos = 44, aceptados = 17;
  for (let i = 0; i < emitidos; i++) sql.push(evento('maridaje.recomendado', minutosAtras(), { platoId: 'demo' }));
  for (let i = 0; i < aceptados; i++) sql.push(evento('maridaje.aceptado', minutosAtras(), { etiquetaId: 'demo' }));
  const notas = [5, 5, 5, 5, 4, 4, 4, 4, 5, 4, 3, 5, 4, 5, 2, 4, 5, 5, 4, 3];
  for (const n of notas) sql.push(auditoria('VALORACION', 'Comanda', 'VALORACION.REGISTRADA', { puntuacion: n }, minutosAtras()));

  // Consumo reciente de vinos: alimenta los avisos de "se está acabando" según la frecuencia de pedidos
  const consumo = (sku, stock, salidas, horas) => {
    sql.push(`UPDATE inventario.existencias x SET stock_actual = ${stock} FROM inventario.etiquetas t WHERE t.id = x.etiqueta_id AND t.codigo_interno = ${q(sku)};`);
    for (let i = 0; i < salidas; i++) {
      const min = entre(10, horas * 60);
      sql.push(`INSERT INTO inventario.movimientos_inventario (id, etiqueta_id, tipo, cantidad, motivo, "timestamp") SELECT gen_random_uuid(), id, 'SALIDA', -1, 'Comanda de demostración', now() - interval '${min} minutes' FROM inventario.etiquetas WHERE codigo_interno = ${q(sku)};`);
    }
  };
  consumo('TIN-DMP', 2, 5, 5); // Don Manuel Petit Verdot: pocas botellas y pidiéndose seguido
  consumo('TIN-TON', 3, 3, 6); // Toñuz: en el umbral
  consumo('BLA-TRI', 40, 6, 6); // Blanco de Blancos: mucho consumo pero con stock de sobra
  sql.push(`UPDATE inventario.existencias x SET stock_actual = 0 FROM inventario.etiquetas t WHERE t.id = x.etiqueta_id AND t.codigo_interno = 'BLA-AMB';`);
  Object.assign(resumen, { comandas, anuladas, emitidos, aceptados, valoraciones: notas.length, prom: (notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(2) });
}
sql.push('COMMIT;');

try {
  psql(sql.join('\n'));
} catch (e) {
  console.error('No se pudo restablecer la base de datos. ¿Está Docker en marcha (tacama-postgres)?\n' + (e.stderr || e.message));
  process.exit(1);
}

// ── Fotos subidas desde administración
const dirFotos = path.join(RAIZ, 'services/catalogo-i18n-service/uploads/platos');
let fotos = 0;
if (fs.existsSync(dirFotos)) {
  for (const f of fs.readdirSync(dirFotos)) { fs.unlinkSync(path.join(dirFotos, f)); fotos++; }
}

// ── Caché
try {
  execFileSync('docker', ['exec', 'tacama-redis', 'redis-cli', '-a', leerEnv('REDIS_PASSWORD') || 'redis_secret_2024', '--no-auth-warning', 'FLUSHALL'], { stdio: 'ignore' });
} catch { console.warn('Aviso: no se pudo vaciar la caché de Redis.'); }

console.log('Demo lista.');
console.log(`  Carta: ${listaPlatos.length} platos con precios y disponibilidad iniciales (${fotos} fotos subidas eliminadas).`);
console.log(`  Bodega: ${etiquetas.length} etiquetas con su stock inicial.`);
if (SIN_HISTORIAL) console.log('  Sin historial de ejemplo.');
else console.log(`  Historial de EJEMPLO (ficticio): ${resumen.comandas} comandas, ${resumen.anuladas} anuladas, venta cruzada ${resumen.aceptados}/${resumen.emitidos}, ${resumen.valoraciones} calificaciones (promedio ${resumen.prom}).`);
