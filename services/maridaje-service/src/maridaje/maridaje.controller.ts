/**
 * maridaje.controller.ts
 * GET  /api/v1/maridajes?plato={id}   → recomendaciones
 * GET  /api/v1/reglas-maridaje        → listar reglas (sommelier)
 * POST /api/v1/reglas-maridaje        → crear regla (sommelier)
 */

import {
  Controller, Get, Post, Patch, Body, Query, Param, Headers,
  BadRequestException, ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiQuery, ApiResponse,
  ApiBearerAuth, ApiBody,
} from '@nestjs/swagger';
import { IsString, IsInt, Min, Max, IsOptional, IsBoolean, IsIn } from 'class-validator';
import { sesionDelToken } from '../common/sesion';
import { ApiProperty } from '@nestjs/swagger';
import { MaridajeService } from './maridaje.service';
import { ReglaService } from '../reglas/regla.service';

// ── DTO para crear regla ──────────────────────────────────────
class CrearReglaDto {
  @ApiProperty({ example: 'uuid-plato' }) @IsString() platoId: string;
  @ApiProperty({ example: 'uuid-etiqueta' }) @IsString() etiquetaId: string;
  @ApiProperty({ example: 9, minimum: 1, maximum: 10 })
  @IsInt() @Min(1) @Max(10) puntaje: number;
  @ApiProperty({ example: 'Maridaje clásico para ceviche', required: false })
  @IsOptional() @IsString() motivo?: string;
  @ApiProperty({ required: false, enum: ['NACIONAL', 'EXTRANJERO'] })
  @IsOptional() @IsIn(['NACIONAL', 'EXTRANJERO']) segmento?: string;
}

class RespuestaDto {
  @ApiProperty() @IsString() reglaId: string;
  @ApiProperty() @IsString() sesionMesaId: string;
  @ApiProperty({ enum: ['ACEPTADA', 'MODIFICADA', 'RECHAZADA'] }) @IsIn(['ACEPTADA', 'MODIFICADA', 'RECHAZADA']) respuesta: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() comandaId?: string;
}

class ActualizarReglaDto {
  @ApiProperty({ required: false, minimum: 1, maximum: 10 }) @IsOptional() @IsInt() @Min(1) @Max(10) puntaje?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsString() motivo?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() activa?: boolean;
  @ApiProperty({ required: false, enum: ['NACIONAL', 'EXTRANJERO'] }) @IsOptional() @IsIn(['NACIONAL', 'EXTRANJERO']) segmento?: string;
  @ApiProperty({ required: false, description: 'ISO 8601; null = sin vencimiento' }) @IsOptional() @IsString() vigenciaHasta?: string | null;
}

// RN04: las reglas de maridaje las define y aprueba exclusivamente el sommelier 
const ROLES_REGLAS = ['SOMMELIER'];
function exigirSommelier(authorization?: string) {
  const sesion = sesionDelToken(authorization);
  if (!sesion || !ROLES_REGLAS.includes(sesion.rol)) {
    throw new ForbiddenException({ mensaje: 'Solo el sommelier define las reglas de maridaje (RN04)', codigo: 'MAR_005' });
  }
  return sesion;
}

@ApiTags('maridaje')
@Controller()
export class MaridajeController {
  constructor(
    private readonly maridajeService: MaridajeService,
    private readonly reglaService: ReglaService,
  ) {}

  /**
   * GET /api/v1/maridajes?plato={id}
   * Retorna hasta 3 recomendaciones de etiquetas Tacama.
   * Endpoint público para el comensal (usa token de mesa).
   */
  @Get('maridajes')
  @ApiOperation({
    summary: 'Recomendaciones de maridaje para un plato',
    description:
      'Devuelve máx. 3 etiquetas de vino/pisco con stock > 0 (RN03) ' +
      'y al menos una de diferente rango de precio (RN05).',
  })
  @ApiQuery({ name: 'plato', description: 'UUID del plato', required: true })
  @ApiResponse({ status: 200, description: 'Lista de recomendaciones' })
  async getMaridajes(@Query('plato') platoId: string, @Query('segmento') segmento?: string) {
    if (!platoId) {
      throw new BadRequestException({
        mensaje: 'El parámetro "plato" es obligatorio',
        codigo: 'GEN_002',
      });
    }
    const recomendaciones = await this.maridajeService.recomendar(platoId, segmento);
    return { data: recomendaciones };
  }

  /** POST /api/v1/maridajes/respuesta — RF08: el comensal acepta, modifica o rechaza la recomendación */
  @Post('maridajes/respuesta')
  @ApiOperation({ summary: 'Registrar la respuesta a una recomendación (RF08)' })
  async registrarRespuesta(@Body() dto: RespuestaDto) {
    return { data: await this.maridajeService.registrarRespuesta(dto.reglaId, dto.sesionMesaId, dto.respuesta, dto.comandaId) };
  }

  /** GET /api/v1/maridajes/guion?etiqueta=VIN-BL-001&plato=TAC-001 — RF09: guion de apoyo para el mozo */
  @Get('maridajes/guion')
  @ApiOperation({ summary: 'Guion de apoyo con argumentos de venta de una etiqueta (RF09)' })
  async guion(@Query('etiqueta') etiqueta: string, @Query('plato') plato?: string) {
    if (!etiqueta) throw new BadRequestException({ mensaje: 'El parámetro "etiqueta" es obligatorio', codigo: 'GEN_002' });
    return { data: await this.maridajeService.guion(etiqueta, plato) };
  }

  @Get('etiquetas')
  @ApiOperation({ summary: 'Catálogo de etiquetas Tacama (vinos y piscos)' })
  async getEtiquetas() {
    return { data: await this.maridajeService.listarEtiquetas() };
  }

  /** GET /api/v1/reglas-maridaje — lista las reglas activas (solo sommelier) */
  @Get('reglas-maridaje')
  @ApiTags('reglas')
  @ApiOperation({ summary: 'Listar reglas de maridaje', description: 'Solo accesible por sommelier y administrador.' })
  @ApiResponse({ status: 200, description: 'Lista de reglas' })
  async getReglas(@Headers('authorization') authorization?: string) {
    exigirSommelier(authorization);
    return { data: await this.reglaService.findAll() };
  }

  /** GET /api/v1/reglas-maridaje/respuestas — RF08: resumen de aceptadas, modificadas y rechazadas (sommelier) */
  @Get('reglas-maridaje/respuestas')
  @ApiTags('reglas')
  @ApiOperation({ summary: 'Resumen de respuestas a las recomendaciones (RF08)' })
  async resumenRespuestas(@Headers('authorization') authorization?: string) {
    exigirSommelier(authorization);
    return { data: await this.maridajeService.resumenRespuestas() };
  }

  /** POST /api/v1/reglas-maridaje — crea una regla (solo sommelier) */
  @Post('reglas-maridaje')
  @ApiTags('reglas')
  @ApiOperation({ summary: 'Crear regla de maridaje', description: 'Solo el sommelier puede crear reglas.' })
  @ApiBody({ type: CrearReglaDto })
  @ApiResponse({ status: 201, description: 'Regla creada' })
  async crearRegla(@Body() dto: CrearReglaDto, @Headers('authorization') authorization?: string) {
    const sesion = exigirSommelier(authorization);
    return { data: await this.reglaService.crear(dto, sesion.id) };
  }

  /** PATCH /api/v1/reglas-maridaje/:id — editar, activar o desactivar una regla (RF07) */
  @Patch('reglas-maridaje/:id')
  @ApiTags('reglas')
  @ApiOperation({ summary: 'Editar, activar o desactivar una regla', description: 'Solo el sommelier (RN04).' })
  async actualizarRegla(@Param('id') id: string, @Body() dto: ActualizarReglaDto, @Headers('authorization') authorization?: string) {
    exigirSommelier(authorization);
    return { data: await this.reglaService.actualizar(id, dto) };
  }
}
