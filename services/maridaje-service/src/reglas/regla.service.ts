/**
 * regla.service.ts — CRUD de reglas de maridaje para el sommelier (RN04, RF07).
 */

import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

// Misma clave que usa MaridajeService para cachear las reglas de un plato
const cacheKey = (platoId: string) => `maridaje:reglas:${platoId}`;

@Injectable()
export class ReglaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /** Reglas activas (las desactivadas se reactivan con PATCH /reglas-maridaje/:id) */
  async findAll() {
    return this.prisma.reglaMaridaje.findMany({
      where: { activa: true },
      include: { etiqueta: { select: { nombre: true, tipo: true, rangoPrecio: true } } },
      orderBy: { puntaje: 'desc' },
    });
  }

  async crear(dto: { platoId: string; etiquetaId: string; puntaje: number; motivo?: string; segmento?: string }, creadaPor?: string) {
    const existe = await this.prisma.reglaMaridaje.findUnique({
      where: { platoId_etiquetaId: { platoId: dto.platoId, etiquetaId: dto.etiquetaId } },
    });

    if (existe) {
      throw new ConflictException({
        mensaje: 'Ya existe una regla de maridaje para esta combinación plato-etiqueta',
        codigo: 'MAR_002',
      });
    }

    const regla = await this.prisma.reglaMaridaje.create({ data: { ...dto, creadaPor } });
    await this.redis.del(cacheKey(dto.platoId));
    return regla;
  }

  /** Edita puntaje, motivo, vigencia o activa/desactiva una regla (RF07) */
  async actualizar(
    id: string,
    dto: { puntaje?: number; motivo?: string; activa?: boolean; segmento?: string; vigenciaHasta?: string | null },
  ) {
    const existe = await this.prisma.reglaMaridaje.findUnique({ where: { id } });
    if (!existe) throw new NotFoundException({ mensaje: 'Regla de maridaje no encontrada', codigo: 'MAR_001' });

    const { vigenciaHasta, ...resto } = dto;
    const regla = await this.prisma.reglaMaridaje.update({
      where: { id },
      data: {
        ...resto,
        ...(vigenciaHasta !== undefined ? { vigenciaHasta: vigenciaHasta ? new Date(vigenciaHasta) : null } : {}),
      },
    });
    await this.redis.del(cacheKey(existe.platoId));
    return regla;
  }
}
