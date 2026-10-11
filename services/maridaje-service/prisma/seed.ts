/**
 * seed.ts — maridaje-service
 * Etiquetas y reglas de maridaje de la carta del Tambo de Tacama
 * (infra/data/etiquetas-tacama.json + maridajes sugeridos de carta-tacama.json).
 * Ejecutar: ts-node prisma/seed.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '../generated/client';

const prisma = new PrismaClient();
const DIR = path.join(__dirname, '../../../infra/data');

async function main() {
  console.log('Iniciando seed de maridaje-service...');
  const etiquetas = JSON.parse(fs.readFileSync(path.join(DIR, 'etiquetas-tacama.json'), 'utf8')) as any[];
  const platos = JSON.parse(fs.readFileSync(path.join(DIR, 'carta-tacama.json'), 'utf8')) as any[];

  await prisma.recomendacion.deleteMany();
  await prisma.reglaMaridaje.deleteMany();
  await prisma.etiqueta.deleteMany();

  const idPorCodigo: Record<string, string> = {};
  for (const e of etiquetas) {
    const c = await prisma.etiqueta.create({
      data: {
        codigoInterno: e.codigo,
        nombre: e.nombre,
        tipo: e.tipo,
        cepa: e.cepa,
        descripcionEs: e.descripcion,
        notasDegust: e.descripcion,
        precioLista: e.precio,
        rangoPrecio: e.rango,
        activa: true,
      },
    });
    idPorCodigo[e.codigo] = c.id;
  }

  let reglas = 0;
  for (const p of platos) {
    for (const m of p.maridaje) {
      await prisma.reglaMaridaje.create({
        data: {
          platoId: p.codigo, // el maridaje referencia al plato por su código de carta
          etiquetaId: idPorCodigo[m.etiqueta],
          puntaje: m.puntaje,
          motivo: `Maridaje sugerido por la carta de El Tambo de Tacama: ${p.maridajeTexto}.`,
          creadaPor: 'Carta Tambo de Tacama',
        },
      });
      reglas += 1;
    }
  }
  console.log(`  ${etiquetas.length} etiquetas, ${reglas} reglas de maridaje`);
  console.log('Seed de maridaje-service completado.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
