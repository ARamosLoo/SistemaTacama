/**
 * seed.ts — auth-service
 * Datos de prueba: 6 mesas con QR y usuarios por rol
 * Ejecutar: ts-node prisma/seed.ts
 */

import { PrismaClient } from '../generated/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Contraseña por defecto para desarrollo (CAMBIAR EN PRODUCCIÓN)
const SALT_ROUNDS = 12;

async function hashPwd(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function main() {
  console.log('Iniciando seed de auth-service...\n');

  // ── 1. Usuarios por rol ──────────────────────────────────────
  const usuarios = [
    {
      nombre: 'Carlos Administrador',
      email: 'admin@tacama.pe',
      password: 'Admin2024!',
      rol: 'ADMINISTRADOR' as const,
    },
    {
      nombre: 'María Jefa de Salón',
      email: 'jefe@tacama.pe',
      password: 'JefeSalon2024!',
      rol: 'JEFE_SALON' as const,
    },
    {
      nombre: 'Pedro Mozo',
      email: 'mozo1@tacama.pe',
      password: 'Mozo2024!',
      rol: 'MOZO' as const,
    },
    {
      nombre: 'Lucía Paredes',
      email: 'mozo2@tacama.pe',
      password: 'Mozo2024!',
      rol: 'MOZO' as const,
    },
    {
      nombre: 'Diego Rivas',
      email: 'mozo3@tacama.pe',
      password: 'Mozo2024!',
      rol: 'MOZO' as const,
    },
    {
      nombre: 'Ana Sommelière',
      email: 'sommelier@tacama.pe',
      password: 'Sommelier2024!',
      rol: 'SOMMELIER' as const,
    },
    {
      nombre: 'Chef Luis Cocina',
      email: 'cocina@tacama.pe',
      password: 'Cocina2024!',
      rol: 'COCINA' as const,
    },
    {
      nombre: 'Rosa Almacén',
      email: 'almacen@tacama.pe',
      password: 'Almacen2024!',
      rol: 'ALMACEN' as const,
    },
  ];

  for (const u of usuarios) {
    const passwordHash = await hashPwd(u.password);
    await prisma.usuario.upsert({
      where: { email: u.email },
      update: { nombre: u.nombre, rol: u.rol, activo: true },
      create: {
        nombre: u.nombre,
        email: u.email,
        passwordHash,
        rol: u.rol,
        activo: true,
      },
    });
    console.log(`  Usuario creado: ${u.email} (${u.rol})`);
  }

  // ── 2. Mesas con códigos QR ──────────────────────────────────
  // El codigoQR en producción sería un UUID + firma HMAC.
  // En desarrollo usamos un código legible.
  const mesas = [
    { numero: 1, codigoQR: 'QR-MESA-001', capacidad: 2 },
    { numero: 2, codigoQR: 'QR-MESA-002', capacidad: 4 },
    { numero: 3, codigoQR: 'QR-MESA-003', capacidad: 4 },
    { numero: 4, codigoQR: 'QR-MESA-004', capacidad: 6 },
    { numero: 5, codigoQR: 'QR-MESA-005', capacidad: 6 },
    { numero: 6, codigoQR: 'QR-MESA-006', capacidad: 8 },
  ];

  for (const m of mesas) {
    await prisma.mesa.upsert({
      where: { numero: m.numero },
      update: { codigoQR: m.codigoQR, capacidad: m.capacidad },
      create: {
        numero: m.numero,
        codigoQR: m.codigoQR,
        capacidad: m.capacidad,
        activa: true,
      },
    });
    console.log(`  Mesa ${m.numero} creada (QR: ${m.codigoQR})`);
  }

  console.log('\nSeed de auth-service completado.');
  console.log('\nCredenciales de acceso:');
  console.log('  admin@tacama.pe       → Admin2024!');
  console.log('  jefe@tacama.pe        → JefeSalon2024!');
  console.log('  mozo1@tacama.pe       → Mozo2024!  (también mozo2@ y mozo3@)');
  console.log('  sommelier@tacama.pe   → Sommelier2024!');
  console.log('  cocina@tacama.pe      → Cocina2024!');
  console.log('  almacen@tacama.pe     → Almacen2024!');
}

main()
  .catch((e) => {
    console.error('Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
