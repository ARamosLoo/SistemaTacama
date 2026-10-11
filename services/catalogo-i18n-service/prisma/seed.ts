/**
 * seed.ts — catalogo-i18n-service
 * Carga la carta completa de El Tambo de Tacama desde infra/data/carta-tacama.json
 * (alérgenos inferidos de la descripción de cada plato; validar con cocina).
 * Ejecutar: ts-node prisma/seed.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '../generated/client';

const prisma = new PrismaClient();
const DATA = path.join(__dirname, '../../../infra/data/carta-tacama.json');
const I18N = path.join(__dirname, '../../../infra/data/carta-i18n.json');

const ALERGENOS = [
  { codigo: 'GLUTEN', nombreEs: 'Gluten (trigo, cebada, centeno)', nombreEn: 'Gluten' },
  { codigo: 'LACTEOS', nombreEs: 'Lácteos', nombreEn: 'Dairy' },
  { codigo: 'HUEVO', nombreEs: 'Huevo', nombreEn: 'Egg' },
  { codigo: 'MARISCOS', nombreEs: 'Mariscos y crustáceos', nombreEn: 'Shellfish' },
  { codigo: 'PESCADO', nombreEs: 'Pescado', nombreEn: 'Fish' },
  { codigo: 'SOYA', nombreEs: 'Soya', nombreEn: 'Soy' },
  { codigo: 'NUECES', nombreEs: 'Frutos secos (nueces, pecanas)', nombreEn: 'Tree nuts (pecans, walnuts)' },
  { codigo: 'MOSTAZA', nombreEs: 'Mostaza', nombreEn: 'Mustard' },
  { codigo: 'SULFITOS', nombreEs: 'Sulfitos (vino)', nombreEn: 'Sulphites (wine)' },
];

async function main() {
  console.log('Iniciando seed de catalogo-i18n-service (carta Tambo de Tacama)...');
  const platos = JSON.parse(fs.readFileSync(DATA, 'utf8')) as any[];
  const i18n = JSON.parse(fs.readFileSync(I18N, 'utf8')) as Record<string, Record<string, { n: string; d: string }>>;

  const idAlergeno: Record<string, string> = {};
  for (const a of ALERGENOS) {
    const r = await prisma.alergeno.upsert({ where: { codigo: a.codigo }, update: a, create: a });
    idAlergeno[a.codigo] = r.id;
  }

  // Reemplaza el catálogo anterior
  await prisma.traduccion.deleteMany();
  await prisma.platoAlergeno.deleteMany();
  await prisma.platoIngrediente.deleteMany();
  await prisma.plato.deleteMany();

  for (const p of platos) {
    await prisma.plato.create({
      data: {
        codigoInterno: p.codigo,
        categoria: p.categoria,
        nombreEs: p.nombreEs,
        descripcionEs: p.descEs,
        precioBase: p.precio,
        imagenUrl: p.imagen ? `/platos/${p.imagen}.jpg` : null,
        disponible: true,
        tiempoPrep: p.tiempoPrep,
        seccion: p.seccion,
        esVegetariano: p.esVegetariano,
        libreLactosa: p.libreLactosa,
        picante: p.picante,
        estilo: p.estilo,
        tags: p.tags,
        maridajeTexto: p.maridajeTexto,
        rol: p.rol,
        momentos: p.momentos,
        traducciones: {
          create: [
            { idioma: 'en', nombre: p.nombreEn, descripcion: p.descEn },
            ...(['fr', 'pt', 'de'] as const).map((l) => ({ idioma: l, nombre: i18n[p.codigo][l].n, descripcion: i18n[p.codigo][l].d })),
          ],
        },
        alergenos: { create: p.alergenos.map((c: string) => ({ alergenoId: idAlergeno[c] })) },
      },
    });
  }

  console.log(`  ${platos.length} platos y bebidas de la carta`);
  console.log(`  ${ALERGENOS.length} alérgenos`);
  console.log('Seed de catalogo-i18n-service completado.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
