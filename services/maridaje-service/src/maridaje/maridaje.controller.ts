/**
 * maridaje.controller.ts
 * GET  /api/v1/maridajes?plato={id}   → recomendaciones
 * GET  /api/v1/reglas-maridaje        → listar reglas (sommelier)
 * POST /api/v1/reglas-maridaje        → crear regla (sommelier)
 */

import {
  Controller, Get, Post, Body, Query,
  BadRequestException, UseGuards,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiQuery, ApiResponse,
  ApiBearerAuth, ApiBody,
} from '@nestjs/swagger';
import { IsString, IsInt, Min, Max, IsOptional } from 'class-validator';
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
  async getMaridajes(@Query('plato') platoId: string) {
    if (!platoId) {
      throw new BadRequestException({
        mensaje: 'El parámetro "plato" es obligatorio',
        codigo: 'GEN_002',
      });
    }
    const recomendaciones = await this.maridajeService.recomendar(platoId);
    return { data: recomendaciones };
  }

  /**
   * GET /api/v1/reglas-maridaje
   * Lista todas las reglas activas (sommelier / administrador).
   */
  @Get('etiquetas')
  @ApiOperation({ summary: 'Catálogo de etiquetas Tacama (vinos y piscos)' })
  async getEtiquetas() {
    return { data: await this.maridajeService.listarEtiquetas() };
  }

  @Get('reglas-maridaje')
  @ApiTags('reglas')
  @ApiOperation({ summary: 'Listar reglas de maridaje', description: 'Solo accesible por sommelier y administrador.' })
  @ApiResponse({ status: 200, description: 'Lista de reglas' })
  async getReglas() {
    return { data: await this.reglaService.findAll() };
  }

  /**
   * POST /api/v1/reglas-maridaje
   * Crea o actualiza una regla (sommelier).
   */
  @Post('reglas-maridaje')
  @ApiTags('reglas')
  @ApiOperation({ summary: 'Crear regla de maridaje', description: 'Solo el sommelier puede crear reglas.' })
  @ApiBody({ type: CrearReglaDto })
  @ApiResponse({ status: 201, description: 'Regla creada' })
  async crearRegla(@Body() dto: CrearReglaDto) {
    return { data: await this.reglaService.crear(dto) };
  }
}
