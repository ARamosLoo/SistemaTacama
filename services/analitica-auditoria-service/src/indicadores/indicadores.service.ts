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

  async obtenerKpisGenerales() {
    const eventosComandas = await this.prisma.eventoNegocio.findMany({
      where: {
        tipo: { in: ['comanda.confirmada', 'comanda.anulada', 'maridaje.recomendado', 'maridaje.aceptado'] },
      },
    });

    const confirmadas = eventosComandas.filter((e) => e.tipo === 'comanda.confirmada');
    const anuladas = eventosComandas.filter((e) => e.tipo === 'comanda.anulada');

    let totalVentaPEN = 0;
    for (const e of confirmadas) {
      const payload = e.payload as any;
      if (payload && payload.total) {
        totalVentaPEN += Number(payload.total);
      }
    }

    const ticketPromedio = confirmadas.length > 0 ? totalVentaPEN / confirmadas.length : 0;

    const maridajesEmitidos = eventosComandas.filter((e) => e.tipo === 'maridaje.recomendado').length;
    const maridajesAceptados = eventosComandas.filter((e) => e.tipo === 'maridaje.aceptado').length;
    const tasaMaridaje = maridajesEmitidos > 0 ? (maridajesAceptados / maridajesEmitidos) * 100 : 0;

    return {
      totalComandas: confirmadas.length + anuladas.length,
      comandasConfirmadas: confirmadas.length,
      comandasAnuladas: anuladas.length,
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
