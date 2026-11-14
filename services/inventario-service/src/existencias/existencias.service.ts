/**
 * existencias.service.ts — ConsultarExistencia + descuento + devolución.
 * Implementa RN06 y RN07. Emite alerta si stock < umbralMinimo.
 */

import {
  Injectable, NotFoundException, BadRequestException, Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExistenciasService {
  private readonly logger = new Logger(ExistenciasService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** GET /api/v1/existencias?etiqueta={id} */
  /** Resuelve UUID o código interno (VIN-BL-001) al id de etiqueta de este servicio */
  private async resolverEtiquetaId(ref: string): Promise<string> {
    const e = await this.prisma.etiqueta.findFirst({
      where: { OR: [{ codigoInterno: ref }, { id: ref }] },
      select: { id: true },
    }).catch(() => null);
    return e?.id ?? ref;
  }

  /**
   * Consumo promedio por hora de cada etiqueta según la frecuencia real de los pedidos:
   * se toma el mayor entre el ritmo de las últimas 6 horas y el promedio de la última semana
   * (10 horas de servicio por día). Las devoluciones y los platos anulados restan.
   */
  private async ritmosDeConsumo(): Promise<Map<string, number>> {
    const ahora = Date.now();
    const desde7d = new Date(ahora - 7 * 24 * 3600 * 1000);
    const desde6h = new Date(ahora - 6 * 3600 * 1000);
    const movs = await this.prisma.movimientoInventario.findMany({
      where: { timestamp: { gte: desde7d }, OR: [{ tipo: 'SALIDA' }, { tipo: 'DEVOLUCION' }, { tipo: 'ENTRADA', motivo: { startsWith: 'Ítem anulado' } }] },
      select: { etiquetaId: true, tipo: true, cantidad: true, timestamp: true },
    });
    const c7 = new Map<string, number>();
    const c6 = new Map<string, number>();
    for (const m of movs) {
      const consumo = m.tipo === 'SALIDA' ? -m.cantidad : -Math.abs(m.cantidad); // salidas suman; devoluciones restan
      c7.set(m.etiquetaId, (c7.get(m.etiquetaId) ?? 0) + consumo);
      if (m.timestamp >= desde6h) c6.set(m.etiquetaId, (c6.get(m.etiquetaId) ?? 0) + consumo);
    }
    const out = new Map<string, number>();
    for (const id of new Set([...c7.keys(), ...c6.keys()])) {
      const porHora6 = Math.max(0, c6.get(id) ?? 0) / 6;
      const porHora7 = Math.max(0, c7.get(id) ?? 0) / (7 * 10);
      out.set(id, Math.max(porHora6, porHora7));
    }
    return out;
  }

  async listarTodas() {
    const [filas, ritmos] = await Promise.all([
      this.prisma.existencia.findMany({ include: { etiqueta: true }, orderBy: { etiqueta: { nombre: 'asc' } } }),
      this.ritmosDeConsumo(),
    ]);
    return filas.map((e) => {
      const ritmo = ritmos.get(e.etiquetaId) ?? 0;
      const agotado = e.stockActual <= 0 || !e.etiqueta.activa;
      const minutosRestantes = !agotado && ritmo > 0 ? Math.round((e.stockActual / ritmo) * 60) : null;
      // Mensaje dinámico: depende del stock y de qué tan rápido se está pidiendo
      const nivel = agotado
        ? 'AGOTADO'
        : (minutosRestantes !== null && minutosRestantes <= 60) || e.stockActual <= 2
          ? 'CRITICO'
          : (minutosRestantes !== null && minutosRestantes <= 180) || e.stockActual <= e.etiqueta.umbralMinimo
            ? 'BAJO'
            : 'OK';
      return {
        etiquetaId: e.etiquetaId,
        sku: e.etiqueta.codigoInterno,
        nombre: e.etiqueta.nombre,
        tipo: e.etiqueta.tipo,
        stockActual: e.stockActual,
        umbralMinimo: e.etiqueta.umbralMinimo,
        activa: e.etiqueta.activa,
        agotado,
        disponible: !agotado,
        stockBajo: e.stockActual <= e.etiqueta.umbralMinimo,
        ritmoPorHora: Math.round(ritmo * 100) / 100,
        minutosRestantes,
        nivel,
        ultimaActualizacion: e.ultimaActualizacion,
      };
    });
  }

  /**
   * Administración de bodega: fija el stock exacto, el umbral de alerta y/o marca la etiqueta como agotada.
   * Deja un movimiento de AJUSTE para conservar la trazabilidad.
   */
  async actualizarEtiqueta(
    ref: string,
    dto: { stockActual?: number; umbralMinimo?: number; agotado?: boolean; motivo?: string },
    usuarioId?: string,
  ) {
    const etiquetaId = await this.resolverEtiquetaId(ref);
    const existencia = await this.prisma.existencia.findUnique({ where: { etiquetaId }, include: { etiqueta: true } });
    if (!existencia) throw new NotFoundException({ mensaje: 'Etiqueta no encontrada en inventario', codigo: 'INV_001' });

    if (dto.stockActual !== undefined) {
      if (!Number.isInteger(dto.stockActual) || dto.stockActual < 0 || dto.stockActual > 10000) {
        throw new BadRequestException({ mensaje: 'El stock debe ser un entero entre 0 y 10000', codigo: 'INV_003' });
      }
      const delta = dto.stockActual - existencia.stockActual;
      if (delta !== 0) {
        await this.prisma.existencia.update({ where: { etiquetaId }, data: { stockActual: dto.stockActual } });
        await this.prisma.movimientoInventario.create({
          data: { etiquetaId, tipo: 'AJUSTE', cantidad: delta, motivo: dto.motivo ?? 'Ajuste de stock desde administración', usuarioId },
        });
      }
    }
    const datosEtiqueta: { umbralMinimo?: number; activa?: boolean } = {};
    if (dto.umbralMinimo !== undefined) {
      if (!Number.isInteger(dto.umbralMinimo) || dto.umbralMinimo < 0 || dto.umbralMinimo > 1000) {
        throw new BadRequestException({ mensaje: 'El umbral debe ser un entero entre 0 y 1000', codigo: 'INV_004' });
      }
      datosEtiqueta.umbralMinimo = dto.umbralMinimo;
    }
    if (dto.agotado !== undefined) datosEtiqueta.activa = !dto.agotado;
    if (Object.keys(datosEtiqueta).length) await this.prisma.etiqueta.update({ where: { id: etiquetaId }, data: datosEtiqueta });

    this.logger.log(`Etiqueta ${existencia.etiqueta.nombre} actualizada: ${JSON.stringify(dto)}`);
    return (await this.listarTodas()).find((e) => e.etiquetaId === etiquetaId);
  }

  async consultar(etiquetaRef: string) {
    // Acepta UUID de etiqueta o código interno (p. ej. VIN-BL-001), ya que cada servicio genera sus propios UUID
    const etiqueta = await this.prisma.etiqueta.findFirst({
      where: { OR: [{ id: etiquetaRef }, { codigoInterno: etiquetaRef }] },
      select: { id: true },
    }).catch(() => null);
    const etiquetaId = etiqueta?.id ?? etiquetaRef;
    const existencia = await this.prisma.existencia.findUnique({
      where: { etiquetaId },
      include: { etiqueta: { select: { nombre: true, tipo: true, umbralMinimo: true, activa: true } } },
    });

    if (!existencia) {
      throw new NotFoundException({ mensaje: 'Etiqueta no encontrada en inventario', codigo: 'INV_001' });
    }

    return {
      etiquetaId,
      nombre:       existencia.etiqueta.nombre,
      tipo:         existencia.etiqueta.tipo,
      // Una etiqueta marcada como agotada se informa sin stock para que no se ofrezca
      stockActual:  existencia.etiqueta.activa ? existencia.stockActual : 0,
      umbralMinimo: existencia.etiqueta.umbralMinimo,
      stockBajo:    existencia.stockActual <= existencia.etiqueta.umbralMinimo,
    };
  }

  /** RN06: descuenta stock al confirmar comanda */
  async descontarStock(dto: {
    etiquetaId: string;
    cantidad: number;
    comandaId: string;
    motivo: string;
  }) {
    dto.etiquetaId = await this.resolverEtiquetaId(dto.etiquetaId);
    // Obtener existencia actual
    const existencia = await this.prisma.existencia.findUnique({
      where: { etiquetaId: dto.etiquetaId },
      include: { etiqueta: true },
    });

    if (!existencia) {
      this.logger.warn(`Etiqueta ${dto.etiquetaId} no encontrada en inventario`);
      return;
    }

    if (existencia.stockActual < dto.cantidad) {
      throw new BadRequestException({ mensaje: 'Stock insuficiente para completar el pedido', codigo: 'INV_002' });
    }

    const nuevoStock = existencia.stockActual - dto.cantidad;

    // Actualizar existencia
    await this.prisma.existencia.update({
      where: { etiquetaId: dto.etiquetaId },
      data: { stockActual: nuevoStock },
    });

    // Registrar movimiento (insert-only para trazabilidad)
    await this.prisma.movimientoInventario.create({
      data: {
        etiquetaId: dto.etiquetaId,
        tipo:       'SALIDA',
        cantidad:   -dto.cantidad,
        comandaId:  dto.comandaId,
        motivo:     dto.motivo,
      },
    });

    this.logger.log(`Stock descontado: ${existencia.etiqueta.nombre} → ${nuevoStock} uds.`);

    // Verificar umbral de alerta
    if (nuevoStock <= existencia.etiqueta.umbralMinimo) {
      this.logger.warn(
        `STOCK BAJO: ${existencia.etiqueta.nombre} — ` +
        `${nuevoStock} uds. (umbral: ${existencia.etiqueta.umbralMinimo})`,
      );
      // En fase 2: publicar evento StockBajo en RabbitMQ
    }
  }

  /**
   * RN07: revierte las salidas de una comanda anulada. Es idempotente: solo repone lo que aún no se devolvió
   * (descontando devoluciones previas y los ítems que el comensal ya anuló por separado).
   */
  async registrarDevolucion(dto: { comandaId: string; motivo: string }) {
    const movimientos = await this.prisma.movimientoInventario.findMany({
      where: {
        OR: [
          { comandaId: dto.comandaId, tipo: { in: ['SALIDA', 'DEVOLUCION'] } },
          { referencia: dto.comandaId, tipo: 'ENTRADA', motivo: { startsWith: 'Ítem anulado' } },
        ],
      },
    });

    // Neto por etiqueta: salidas (negativas) + devoluciones/entradas (positivas)
    const pendiente = new Map<string, number>();
    for (const m of movimientos) {
      pendiente.set(m.etiquetaId, (pendiente.get(m.etiquetaId) ?? 0) - m.cantidad);
    }

    for (const [etiquetaId, cantidadARevertir] of pendiente) {
      if (cantidadARevertir <= 0) continue;

      await this.prisma.existencia.update({
        where: { etiquetaId },
        data: { stockActual: { increment: cantidadARevertir } },
      });
      await this.prisma.movimientoInventario.create({
        data: {
          etiquetaId,
          tipo:      'DEVOLUCION',
          cantidad:  cantidadARevertir,
          comandaId: dto.comandaId,
          motivo:    dto.motivo,
        },
      });
      this.logger.log(`Stock revertido (RN07): +${cantidadARevertir} para comanda ${dto.comandaId}`);
    }
  }

  /** POST /api/v1/existencias/movimientos — registro manual (almacén) */
  async registrarMovimiento(dto: {
    etiquetaId: string;
    tipo: string;
    cantidad: number;
    referencia?: string;
    motivo?: string;
    usuarioId?: string;
  }) {
    dto.etiquetaId = await this.resolverEtiquetaId(dto.etiquetaId);
    const existencia = await this.prisma.existencia.findUnique({ where: { etiquetaId: dto.etiquetaId } });
    if (!existencia) throw new NotFoundException({ mensaje: 'Etiqueta no encontrada', codigo: 'INV_001' });

    const delta = dto.tipo === 'ENTRADA' ? dto.cantidad : -dto.cantidad;
    await this.prisma.existencia.update({
      where: { etiquetaId: dto.etiquetaId },
      data: { stockActual: { increment: delta } },
    });

    return this.prisma.movimientoInventario.create({
      data: {
        etiquetaId:  dto.etiquetaId,
        tipo:        dto.tipo as any,
        cantidad:    delta,
        referencia:  dto.referencia,
        motivo:      dto.motivo,
        usuarioId:   dto.usuarioId,
      },
    });
  }
}
