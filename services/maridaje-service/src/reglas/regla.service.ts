/**
 * regla.service.ts — CRUD de reglas de maridaje para el sommelier.
 */

import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class ReglaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async findAll() {
    return this.prisma.reglaMaridaje.findMany({
      where: { activa: true },
      include: { etiqueta: { select: { nombre: true, tipo: true, rangoPrecio: true } } },
      orderBy: { puntaje: 'desc' },
    });
  }

  async crear(dto: { platoId: string; etiquetaId: string; puntaje: number; motivo?: string }) {
    // Verificar duplicado
    const existe = await this.prisma.reglaMaridaje.findUnique({
      where: { platoId_etiquetaId: { platoId: dto.platoId, etiquetaId: dto.etiquetaId } },
    });

    if (existe) {
      throw new ConflictException({
        mensaje: 'Ya existe una regla de maridaje para esta combinación plato-etiqueta',
        codigo: 'MAR_002',
      });
    }

    const regla = await this.prisma.reglaMaridaje.create({ data: dto });

    // Invalidar caché de maridaje para este plato
    await this.redis.del(`maridaje:${dto.platoId}`);

    return regla;
  }
}
