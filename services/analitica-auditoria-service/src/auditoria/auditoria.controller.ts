/**
 * auditoria.controller.ts — Endpoints para consulta y registro manual de auditoría.
 * GET  /api/v1/auditoria
 * POST /api/v1/auditoria
 */

import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { AuditoriaService, RegistrarLogDto, FiltrosAuditoriaDto } from './auditoria.service';

@ApiTags('Auditoría')
@Controller('auditoria')
export class AuditoriaController {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  @Get()
  @ApiOperation({ summary: 'Consultar logs de auditoría con filtros (RF22)' })
  @ApiQuery({ name: 'entidad', required: false, type: String })
  @ApiQuery({ name: 'accion', required: false, type: String })
  @ApiQuery({ name: 'categoria', required: false, enum: ['AUTENTICACION', 'CATALOGO', 'COMANDA', 'INVENTARIO', 'MARIDAJE', 'VALORACION', 'SISTEMA'] })
  @ApiQuery({ name: 'usuarioId', required: false, type: String })
  @ApiQuery({ name: 'fechaDesde', required: false, type: String })
  @ApiQuery({ name: 'fechaHasta', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async consultarLogs(@Query() query: FiltrosAuditoriaDto) {
    return this.auditoriaService.consultar(query);
  }

  @Post()
  @ApiOperation({ summary: 'Registrar un nuevo log de auditoría inmutable' })
  @ApiResponse({ status: 201, description: 'Log registrado exitosamente' })
  async registrarLog(@Body() dto: RegistrarLogDto) {
    return this.auditoriaService.registrar(dto);
  }
}
