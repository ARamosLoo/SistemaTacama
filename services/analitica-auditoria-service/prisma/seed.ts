/**
 * seed.ts — analitica-auditoria-service
 * Inserta un log de auditoría de sistema para validar la tabla inmutable.
 */

import { PrismaClient } from '../generated/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed de analitica-auditoria-service...\n');

  // Registro inicial de sistema (evento de arranque)
  await prisma.logAuditoria.create({
    data: {
      entidad: 'Sistema',
      accion: 'INICIALIZACION',
      datosDespues: { mensaje: 'TacamaMesa inicializado correctamente', version: '0.1.0' },
      categoria: 'SISTEMA',
      servicio: 'analitica-auditoria-service',
    },
  });

  console.log('  Log de inicialización del sistema registrado.');
  console.log('\nSeed de analitica-auditoria-service completado.');
}

main()
  .catch((e) => { console.error('Error:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
