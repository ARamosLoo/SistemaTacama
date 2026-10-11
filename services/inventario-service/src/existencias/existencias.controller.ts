/**
 * existencias.controller.ts
 * GET  /api/v1/existencias?etiqueta={id}
 * POST /api/v1/existencias/movimientos
 */

import { Controller, Get, Post, Put, Param, Query, Body, Headers, ForbiddenException, BadRequestException } from '@nestjs/common';
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';
import { sesionDelToken } from '../common/sesion';
import { ApiTags, ApiOperation, ApiQuery, ApiBody, ApiResponse } from '@nestjs/swagger';
import { ExistenciasService } from './existencias.service';

class ActualizarEtiquetaDto {
  @IsOptional() @IsInt() stockActual?: number;
  @IsOptional() @IsInt() umbralMinimo?: number;
  @IsOptional() @IsBoolean() agotado?: boolean;
  @IsOptional() @IsString() motivo?: string;
}

const ROLES_BODEGA = ['ADMINISTRADOR', 'JEFE_SALON', 'SOMMELIER', 'ALMACEN'];

@ApiTags('inventario')
@Controller('existencias')
export class ExistenciasController {
  constructor(private readonly existenciasService: ExistenciasService) {}

  @Get('todas')
  @ApiOperation({ summary: 'Listar existencias de todas las etiquetas' })
  async listarTodas() {
    return { data: await this.existenciasService.listarTodas() };
  }

  @Put(':ref')
  @ApiOperation({ summary: 'Ajustar stock, umbral o marcar agotado (bodega)' })
  async actualizar(@Param('ref') ref: string, @Body() dto: ActualizarEtiquetaDto, @Headers('authorization') authorization?: string) {
    const sesion = sesionDelToken(authorization);
    if (!sesion || !ROLES_BODEGA.includes(sesion.rol)) {
      throw new ForbiddenException({ mensaje: 'Solo bodega y administración pueden modificar el stock', codigo: 'INV_005' });
    }
    return { data: await this.existenciasService.actualizarEtiqueta(ref, dto, sesion.id) };
  }

  @Get()
  @ApiOperation({ summary: 'Consultar existencia de una etiqueta' })
  @ApiQuery({ name: 'etiqueta', description: 'UUID de la etiqueta', required: true })
  @ApiResponse({ status: 200, description: 'Stock actual y umbral' })
  async consultar(@Query('etiqueta') etiquetaId: string) {
    if (!etiquetaId) throw new BadRequestException({ mensaje: 'El parámetro "etiqueta" es obligatorio', codigo: 'GEN_002' });
    return { data: await this.existenciasService.consultar(etiquetaId) };
  }

  @Post('movimientos')
  @ApiOperation({ summary: 'Registrar movimiento manual (almacén)' })
  @ApiBody({
    schema: {
      example: {
        etiquetaId: 'uuid', tipo: 'ENTRADA', cantidad: 12,
        referencia: 'COMPRA-2024-001', motivo: 'Reposición de bodega',
      },
    },
  })
  async registrarMovimiento(@Body() dto: {
    etiquetaId: string; tipo: string; cantidad: number;
    referencia?: string; motivo?: string; usuarioId?: string;
  }) {
    return { data: await this.existenciasService.registrarMovimiento(dto) };
  }
}
