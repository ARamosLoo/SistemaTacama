/**
 * seed.ts — inventario-service
 * Stock inicial de las etiquetas de infra/data/etiquetas-tacama.json (espejo del maridaje-service).
 * Ejecutar: ts-node prisma/seed.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '../generated/client';

const prisma = new PrismaClient();
const DATA = path.join(__dirname, '../../../infra/data/etiquetas-tacama.json');

async function main() {
  console.log('Iniciando seed de inventario-service...');
  const etiquetas = JSON.parse(fs.readFileSync(DATA, 'utf8')) as any[];

  await prisma.movimientoInventario.deleteMany();
  await prisma.existencia.deleteMany();
  await prisma.lote.deleteMany();
  await prisma.etiqueta.deleteMany();

  for (const e of etiquetas) {
    const etiqueta = await prisma.etiqueta.create({
      data: { codigoInterno: e.codigo, nombre: e.nombre, tipo: e.tipo, umbralMinimo: e.umbral, activa: true },
    });
    const lote = await prisma.lote.create({
      data: {
        etiquetaId: etiqueta.id,
        codigoLote: `LOTE-INI-${e.codigo}`,
        cantidadIngreso: e.stock,
        fechaIngreso: new Date('2024-01-15'),
        refBodega: `SANDBOX-${e.codigo}`,
        observaciones: 'Stock inicial cargado por seed de desarrollo',
      },
    });
    await prisma.existencia.create({ data: { etiquetaId: etiqueta.id, stockActual: e.stock } });
    await prisma.movimientoInventario.create({
      data: {
        etiquetaId: etiqueta.id,
        tipo: 'ENTRADA',
        cantidad: e.stock,
        loteId: lote.id,
        referencia: `SEED-INI-${e.codigo}`,
        motivo: 'Carga inicial de stock para ambiente de desarrollo',
        timestamp: new Date('2024-01-15'),
      },
    });
  }
  console.log(`  ${etiquetas.length} etiquetas con stock inicial`);
  console.log('Seed de inventario-service completado.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
