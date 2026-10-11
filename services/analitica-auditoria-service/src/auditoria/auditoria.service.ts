/**
 * auditoria.service.ts — Gestión inmutable del log de auditoría (RF22, RN11).
 * Solo operaciones INSERT y SELECT (nunca UPDATE ni DELETE).
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface RegistrarLogDto {
  entidad: string;
  entidadId?: string;
  accion: string;
  datosAntes?: any;
  datosDespues?: any;
  usuarioId?: string;
  mesaId?: string;
  ipOrigen?: string;
  userAgent?: string;
  categoria: 'AUTENTICACION' | 'CATALOGO' | 'COMANDA' | 'INVENTARIO' | 'MARIDAJE' | 'VALORACION' | 'SISTEMA';
  servicio: string;
}

export interface FiltrosAuditoriaDto {
  entidad?: string;
  accion?: string;
  categoria?: any;
  usuarioId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  limit?: number;
  offset?: number;
}

@Injectable()
export class AuditoriaService {
  private readonly logger = new Logger(AuditoriaService.name);

  constructor(private readonly prisma: PrismaService) {}

  async registrar(dto: RegistrarLogDto) {
    try {
      const log = await this.prisma.logAuditoria.create({
        data: {
          entidad: dto.entidad,
          entidadId: dto.entidadId,
          accion: dto.accion,
          datosAntes: dto.datosAntes ?? undefined,
          datosDespues: dto.datosDespues ?? undefined,
          usuarioId: dto.usuarioId,
          mesaId: dto.mesaId,
          ipOrigen: dto.ipOrigen,
          userAgent: dto.userAgent,
          categoria: dto.categoria,
          servicio: dto.servicio,
        },
      });
      return log;
    } catch (error) {
      this.logger.error(`Error al registrar log de auditoría: ${error.message}`);
      throw error;
    }
  }

  async consultar(filtros: FiltrosAuditoriaDto) {
    const where: any = {};

    if (filtros.entidad) {
      where.entidad = filtros.entidad;
    }
    if (filtros.accion) {
      where.accion = filtros.accion;
    }
    if (filtros.categoria) {
      where.categoria = filtros.categoria;
    }
    if (filtros.usuarioId) {
      where.usuarioId = filtros.usuarioId;
    }

    if (filtros.fechaDesde || filtros.fechaHasta) {
      where.timestamp = {};
      if (filtros.fechaDesde) {
        where.timestamp.gte = new Date(filtros.fechaDesde);
      }
      if (filtros.fechaHasta) {
        where.timestamp.lte = new Date(filtros.fechaHasta);
      }
    }

    const limit = filtros.limit ? Number(filtros.limit) : 50;
    const offset = filtros.offset ? Number(filtros.offset) : 0;

    const [total, logs] = await Promise.all([
      this.prisma.logAuditoria.count({ where }),
      this.prisma.logAuditoria.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
      }),
    ]);

    return {
      total,
      limit,
      offset,
      data: logs,
    };
  }
}
