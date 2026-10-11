/**
 * usuarios.service.ts — Consultas de usuarios en la base de datos.
 * Solo operaciones de lectura (la creación es por seed/admin).
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  /** Busca un usuario por su ID (para validar el JWT) */
  async findById(id: string) {
    return this.prisma.usuario.findUnique({ where: { id } });
  }

  /** Busca un usuario por email (para el login) */
  async findByEmail(email: string) {
    return this.prisma.usuario.findUnique({ where: { email } });
  }

  /** Lista todos los usuarios activos (solo administrador) */
  async findAllActivos() {
    return this.prisma.usuario.findMany({
      where: { activo: true },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        createdAt: true,
      },
      orderBy: { nombre: 'asc' },
    });
  }
}
