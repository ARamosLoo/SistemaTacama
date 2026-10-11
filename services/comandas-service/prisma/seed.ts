/**
 * seed.ts — comandas-service
 * No hay datos fijos de negocio que pre-cargar.
 * Las comandas las crean los comensales en tiempo real.
 */

import { PrismaClient } from '../generated/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seed de comandas-service: sin datos iniciales (las comandas son dinámicas).');
  console.log('   Las tablas se crearán con la migración de Prisma.\n');
  console.log('Listo.');
}

main()
  .catch((e) => { console.error('Error:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
