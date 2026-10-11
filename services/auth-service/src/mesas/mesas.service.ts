/**
 * mesas.service.ts — Consulta y gestión de mesas.
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MesasService {
  constructor(private readonly prisma: PrismaService) {}

  /** Busca una mesa por su código QR */
  async findByQR(codigoQR: string) {
    return this.prisma.mesa.findUnique({ where: { codigoQR } });
  }

  /** Busca una mesa por su ID */
  async findById(id: string) {
    return this.prisma.mesa.findUnique({ where: { id } });
  }

  /** Lista todas las mesas activas */
  async findAllActivas() {
    return this.prisma.mesa.findMany({
      where: { activa: true },
      orderBy: { numero: 'asc' },
    });
  }
}
