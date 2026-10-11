/**
 * indicadores.controller.ts — Endpoints de analítica de negocio.
 * GET /api/v1/indicadores/venta-cruzada
 * GET /api/v1/indicadores/kpis
 * GET /api/v1/indicadores/csat
 */

import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { IndicadoresService } from './indicadores.service';

@ApiTags('Indicadores')
@Controller('indicadores')
export class IndicadoresController {
  constructor(private readonly indicadoresService: IndicadoresService) {}

  @Get('venta-cruzada')
  @ApiOperation({ summary: 'Obtener tasa de conversión de venta cruzada (maridajes recomendados vs aceptados)' })
  @ApiQuery({ name: 'fechaInicio', required: false, type: String })
  @ApiQuery({ name: 'fechaFin', required: false, type: String })
  async getVentaCruzada(
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ) {
    return this.indicadoresService.obtenerVentaCruzada(fechaInicio, fechaFin);
  }

  @Post('eventos')
  @ApiOperation({ summary: 'Registrar un evento de negocio (p. ej. maridaje.recomendado)' })
  async registrarEvento(@Body() body: { tipo: string; payload?: object }) {
    return this.indicadoresService.registrarEvento(body.tipo, body.payload ?? {});
  }

  @Get('kpis')
  @ApiOperation({ summary: 'Obtener KPIs generales de ventas, comandas y ticket promedio' })
  async getKpis() {
    return this.indicadoresService.obtenerKpisGenerales();
  }

  @Get('csat')
  @ApiOperation({ summary: 'Obtener métricas de satisfacción del cliente (CSAT)' })
  async getCsat() {
    return this.indicadoresService.obtenerCsat();
  }
}
