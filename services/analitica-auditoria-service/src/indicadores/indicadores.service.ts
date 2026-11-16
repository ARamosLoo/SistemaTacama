/**
 * indicadores.service.ts — Cálculo de KPIs y métricas del restaurante.
 * - Tasa de venta cruzada (maridajes)
 * - Ticket promedio y volumen de comandas
 * - Satisfacción del cliente (CSAT)
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IndicadoresService {
  private readonly logger = new Logger(IndicadoresService.name);

  constructor(private readonly prisma: PrismaService) {}

  async obtenerVentaCruzada(fechaInicio?: string, fechaFin?: string) {
    const where: any = {};
    if (fechaInicio || fechaFin) {
      where.fecha = {};
      if (fechaInicio) where.fecha.gte = new Date(fechaInicio);
      if (fechaFin) where.fecha.lte = new Date(fechaFin);
    }

    const registros = await this.prisma.indicadorDiario.findMany({
      where,
      orderBy: { fecha: 'desc' },
    });

    const totalRecomendadas = registros.reduce((acc, r) => acc + r.recomendacionesEmitidas, 0);
    const totalAceptadas = registros.reduce((acc, r) => acc + r.recomendacionesAceptadas, 0);
    const tasaPromedio = totalRecomendadas > 0 ? (totalAceptadas / totalRecomendadas) * 100 : 0;

    return {
      recomendacionesEmitidas: totalRecomendadas,
      recomendacionesAceptadas: totalAceptadas,
      tasaConversionPorcentaje: Number(tasaPromedio.toFixed(2)),
      historico: registros.map((r) => ({
        fecha: r.fecha,
        emitidas: r.recomendacionesEmitidas,
        aceptadas: r.recomendacionesAceptadas,
        tasa: r.tasaVentaCruzada ? Number(r.tasaVentaCruzada) : 0,
      })),
    };
  }

  async registrarEvento(tipo: string, payload: object) {
    await this.prisma.eventoNegocio.create({ data: { tipo, payload: payload as any, procesado: true } });
    return { ok: true };
  }

  /**
   * KPIs generales. Las cuentas y la suma de ventas las hace la base de datos (GROUP BY y SUM):
   * traer todos los eventos a memoria tardaba más de un segundo con 50 usuarios simultáneos.
   */
  async obtenerKpisGenerales() {
    const filas = await this.prisma.eventoNegocio.groupBy({
      by: ['tipo'],
      where: { tipo: { in: ['comanda.confirmada', 'comanda.anulada', 'maridaje.recomendado', 'maridaje.aceptado'] } },
      _count: { _all: true },
    });
    const cuenta = (tipo: string) => filas.find((x) => x.tipo === tipo)?._count._all ?? 0;

    const ventas = await this.prisma.$queryRaw<{ total: number }[]>`
      SELECT COALESCE(SUM((payload->>'total')::numeric), 0)::float8 AS total
      FROM analitica.eventos_negocio
      WHERE tipo = 'comanda.confirmada' AND payload->>'total' ~ '^[0-9]+(\\.[0-9]+)?$'`;
    const totalVentaPEN = Number(ventas[0]?.total ?? 0);

    const confirmadas = cuenta('comanda.confirmada');
    const anuladas = cuenta('comanda.anulada');
    const ticketPromedio = confirmadas > 0 ? totalVentaPEN / confirmadas : 0;

    const maridajesEmitidos = cuenta('maridaje.recomendado');
    const maridajesAceptados = cuenta('maridaje.aceptado');
    const tasaMaridaje = maridajesEmitidos > 0 ? (maridajesAceptados / maridajesEmitidos) * 100 : 0;

    return {
      totalComandas: confirmadas + anuladas,
      comandasConfirmadas: confirmadas,
      comandasAnuladas: anuladas,
      ventaTotalPEN: Number(totalVentaPEN.toFixed(2)),
      ticketPromedioPEN: Number(ticketPromedio.toFixed(2)),
      maridajesEmitidos,
      maridajesAceptados,
      tasaMaridajePorcentaje: Number(tasaMaridaje.toFixed(2)),
    };
  }

  async obtenerCsat() {
    const logsValoracion = await this.prisma.logAuditoria.findMany({
      where: { categoria: 'VALORACION' },
    });

    let sumaPuntuaciones = 0;
    let totalValoraciones = 0;

    for (const log of logsValoracion) {
      const datos = log.datosDespues as any;
      if (datos && datos.puntuacion) {
        sumaPuntuaciones += Number(datos.puntuacion);
        totalValoraciones++;
      }
    }

    const csatPromedio = totalValoraciones > 0 ? sumaPuntuaciones / totalValoraciones : 0;

    return {
      totalValoraciones,
      csatPromedio: Number(csatPromedio.toFixed(2)),
      escala: '1 a 5 estrellas',
    };
  }
}
