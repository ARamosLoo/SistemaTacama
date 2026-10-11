/**
 * comandas.controller.ts — Endpoints del ciclo de vida de comandas.
 * POST   /api/v1/comandas/:id/restricciones  → declarar alergias (RN01)
 * POST   /api/v1/comandas                    → crear comanda
 * PATCH  /api/v1/comandas/:id               → confirmar / cambiar estado
 * DELETE /api/v1/comandas/:id               → anular comanda
 * POST   /api/v1/valoraciones               → CSAT del comensal
 */

import {
  Controller, Post, Patch, Delete, Get, Query,
  Body, Param, HttpCode, HttpStatus, Headers, ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiParam, ApiBody, ApiResponse,
} from '@nestjs/swagger';
import { IsString, IsArray, IsBoolean, IsOptional, IsIn,
         IsNumber, IsPositive, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ComandasService } from './comandas.service';
import { sesionDelToken } from '../common/sesion';
import { ValoracionService } from '../valoracion/valoracion.service';

// ── DTOs ─────────────────────────────────────────────────────

class RestriccionDto {
  @ApiProperty({ example: ['GLUTEN', 'LACTEOS'], isArray: true })
  @IsArray() alergenos: string[];
  @ApiProperty({ example: true })
  @IsBoolean() consentimiento: boolean;
  @ApiProperty({ required: false, example: '2026-10' })
  @IsOptional() @IsString() versionTerminos?: string;
}

class ItemDto {
  @ApiProperty() @IsString() platoId: string;
  @ApiProperty() @IsString() platoNombre: string;
  @ApiProperty() @IsNumber() @IsPositive() precioUnit: number;
  @ApiProperty({ default: 1 }) @IsNumber() @IsPositive() cantidad: number;
  @ApiProperty({ required: false }) @IsOptional() @IsString() etiquetaId?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() etiquetaNombre?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() notas?: string;
}

class CrearComandaDto {
  @ApiProperty() @IsString() mesaId: string;
  @ApiProperty() @IsString() sesionMesaId: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() mozoId?: string;
  @ApiProperty({ type: [ItemDto] })
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => ItemDto)
  items: ItemDto[];
  @ApiProperty({ required: false }) @IsOptional() @IsString() observaciones?: string;
}

class ConfirmarComandaDto {
  @ApiProperty({ example: 'PENDIENTE' }) @IsString() estado: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() motivo?: string;
}

class ValoracionDto {
  @ApiProperty() @IsString() comandaId: string;
  @ApiProperty() @IsString() mesaId: string;
  @ApiProperty({ minimum: 1, maximum: 5 }) @IsNumber() puntuacion: number;
  @ApiProperty({ required: false }) @IsOptional() @IsString() comentario?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() mozoId?: string;
}

// ── Entrega en mesa: solo salón ───────────────────────────────
// Roles que pueden confirmar que la comanda llegó a la mesa (cocina no).
const ROLES_QUE_ENTREGAN = ['MOZO', 'JEFE_SALON', 'ADMINISTRADOR'];

/** Rol declarado en el JWT del personal (sin verificar firma: es una regla de flujo, no de seguridad). */
function rolDelToken(authorization?: string): string | null {
  const token = authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1] ?? '', 'base64url').toString('utf8'));
    return typeof payload.rol === 'string' ? payload.rol : null;
  } catch {
    return null;
  }
}

// ── Controller ────────────────────────────────────────────────
/** Quien puede emitir el comprobante y cerrar la mesa: personal de salón y caja. */
const ROLES_QUE_COBRAN = ['MOZO', 'JEFE_SALON', 'ADMINISTRADOR', 'CAJA'];

export class CambiarItemDto {
  @ApiProperty() @IsString() platoId: string;
  @ApiProperty() @IsString() platoNombre: string;
  @ApiProperty() @IsNumber() @IsPositive() precioUnit: number;
  @ApiProperty({ required: false }) @IsOptional() @IsString() notas?: string;
}

export class SolicitarCuentaDto {
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() omitirCalificacion?: boolean;
  @ApiProperty({ enum: ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA'] }) @IsIn(['EFECTIVO', 'TARJETA', 'TRANSFERENCIA']) metodoPago: string;
  @ApiProperty({ required: false, description: 'Efectivo: monto con el que pagará (para preparar el vuelto)' }) @IsOptional() @IsNumber() efectivoPagaCon?: number;
}

@ApiTags('comandas')
@Controller()
export class ComandasController {
  constructor(
    private readonly comandasService: ComandasService,
    private readonly valoracionService: ValoracionService,
  ) {}

  /** POST /api/v1/comandas/:id/restricciones — declarar alergias (RN01) */
  @Post('comandas/:id/restricciones')
  @ApiOperation({
    summary: 'Declarar alergias (RN01)',
    description: 'Obligatorio antes de confirmar la comanda. ' +
      'Datos de salud tratados con consentimiento explícito (Ley 29733).',
  })
  @ApiParam({ name: 'id', description: 'UUID de la comanda' })
  @ApiBody({ type: RestriccionDto })
  @ApiResponse({ status: 201, description: 'Restricciones registradas' })
  async registrarRestricciones(
    @Param('id') id: string,
    @Body() dto: RestriccionDto,
  ) {
    const resultado = await this.comandasService.registrarRestricciones(
      id, dto.alergenos, dto.consentimiento, dto.versionTerminos,
    );
    return { data: resultado };
  }

  /** POST /api/v1/comandas — crear comanda en estado BORRADOR */
  @Post('comandas')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear comanda', description: 'Crea un borrador de comanda. Máximo 3 toques para agregar ítems desde la PWA.' })
  @ApiBody({ type: CrearComandaDto })
  @ApiResponse({ status: 201, description: 'Comanda creada en estado BORRADOR' })
  async crearComanda(@Body() dto: CrearComandaDto) {
    return { data: await this.comandasService.crear(dto) };
  }

  /** PATCH /api/v1/comandas/:id — confirmar o actualizar estado */
  @Patch('comandas/:id')
  @ApiOperation({ summary: 'Confirmar comanda', description: 'Confirma la comanda: publica evento RabbitMQ y notifica cocina vía WebSocket.' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: ConfirmarComandaDto })
  async actualizarComanda(
    @Param('id') id: string,
    @Body() dto: ConfirmarComandaDto,
    @Headers('authorization') authorization?: string,
  ) {
    // La entrega en mesa la confirma el personal de salón; cocina solo prepara y marca la comanda como lista.
    if (dto.estado === 'ENTREGADA') {
      const sesion = sesionDelToken(authorization);
      if (!sesion || !ROLES_QUE_ENTREGAN.includes(sesion.rol)) {
        throw new ForbiddenException({ mensaje: 'La entrega en mesa la confirma el mozo', codigo: 'CMD_004' });
      }
      await this.comandasService.exigirResponsable(id, sesion);
    }
    if (dto.estado === 'PENDIENTE') {
      return { data: await this.comandasService.confirmar(id) };
    }
    if (['EN_PREPARACION', 'LISTA', 'ENTREGADA'].includes(dto.estado)) {
      return { data: await this.comandasService.cambiarEstado(id, dto.estado as any) };
    }
    return { data: { mensaje: `Estado ${dto.estado} no manejado en este endpoint` } };
  }

  /** DELETE /api/v1/comandas/:id — anular comanda */
  @Delete('comandas/:id')
  @ApiOperation({ summary: 'Anular comanda', description: 'Anula la comanda y publica evento para revertir stock (RN07).' })
  @ApiParam({ name: 'id' })
  async anularComanda(
    @Param('id') id: string,
    @Body('motivo') motivo: string,
  ) {
    return { data: await this.comandasService.anular(id, motivo ?? 'Anulación solicitada') };
  }

  /** GET /api/v1/comandas/:id — obtener comanda */
  @Get('comandas')
  @ApiOperation({ summary: 'Listar comandas (KDS / salón)', description: 'Filtro opcional ?estado=PENDIENTE,EN_PREPARACION,LISTA' })
  async listar(@Query('estado') estado?: string) {
    return { data: await this.comandasService.listar(estado ? estado.split(',') : undefined) };
  }

  @Get('comandas/:id')
  @ApiOperation({ summary: 'Obtener comanda por ID' })
  async getComanda(@Param('id') id: string) {
    return { data: await this.comandasService.findById(id) };
  }

  /** POST /api/v1/comandas/:id/cuenta — el comensal pide la cuenta (tras calificar u omitir) */
  @Post('comandas/:id/cuenta')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pedir la cuenta', description: 'Solo con la comanda entregada y calificada (o con omitirCalificacion).' })
  async solicitarCuenta(@Param('id') id: string, @Body() dto: SolicitarCuentaDto) {
    return { data: await this.comandasService.solicitarCuenta(id, !!dto.omitirCalificacion, dto.metodoPago, dto.efectivoPagaCon) };
  }

  /** POST /api/v1/comandas/:id/boleta — el personal emite el comprobante de consumo */
  @Post('comandas/:id/boleta')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Emitir comprobante de consumo' })
  async emitirBoleta(@Param('id') id: string, @Headers('authorization') authorization?: string) {
    const sesion = this.exigirPersonalDeSalon(authorization);
    await this.comandasService.exigirResponsable(id, sesion);
    return { data: await this.comandasService.emitirBoleta(id) };
  }

  /** GET /api/v1/comandas/:id/boleta — detalle del comprobante emitido (comensal y personal) */
  @Get('comandas/:id/boleta')
  @ApiOperation({ summary: 'Obtener comprobante de consumo emitido' })
  async obtenerBoleta(@Param('id') id: string) {
    return { data: await this.comandasService.obtenerBoleta(id) };
  }

  /** POST /api/v1/comandas/:id/cerrar — el personal cierra la mesa tras el comprobante */
  @Post('comandas/:id/cerrar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar comanda y liberar la mesa' })
  async cerrar(@Param('id') id: string, @Headers('authorization') authorization?: string) {
    const sesion = this.exigirPersonalDeSalon(authorization);
    await this.comandasService.exigirResponsable(id, sesion);
    return { data: await this.comandasService.cerrar(id) };
  }

  private exigirPersonalDeSalon(authorization?: string) {
    const sesion = sesionDelToken(authorization);
    if (!sesion || !ROLES_QUE_COBRAN.includes(sesion.rol)) {
      throw new ForbiddenException({ mensaje: 'Solo el personal de salón puede realizar esta acción', codigo: 'CMD_011' });
    }
    return sesion;
  }

  /** POST /api/v1/comandas/:id/atender — un mozo toma la mesa y queda como responsable */
  @Post('comandas/:id/atender')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atender mesa', description: 'El mozo se hace responsable de la mesa hasta que se cierre la última comanda.' })
  async atender(@Param('id') id: string, @Headers('authorization') authorization?: string) {
    const sesion = sesionDelToken(authorization);
    if (!sesion || !['MOZO', 'JEFE_SALON', 'ADMINISTRADOR'].includes(sesion.rol)) {
      throw new ForbiddenException({ mensaje: 'Solo mozos y jefatura pueden atender mesas', codigo: 'CMD_011' });
    }
    return { data: await this.comandasService.atenderMesa(id, sesion) };
  }

  /** DELETE /api/v1/comandas/:id/items/:itemId — el comensal anula un plato (primeros 5 minutos) */
  @Delete('comandas/:id/items/:itemId')
  @ApiOperation({ summary: 'Anular un plato de la comanda', description: 'Solo dentro de los 5 minutos posteriores a la confirmación.' })
  async anularItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    return { data: await this.comandasService.anularItem(id, itemId) };
  }

  /** PATCH /api/v1/comandas/:id/items/:itemId — el comensal cambia un plato por otro (primeros 5 minutos) */
  @Patch('comandas/:id/items/:itemId')
  @ApiOperation({ summary: 'Cambiar un plato de la comanda', description: 'Solo dentro de los 5 minutos posteriores a la confirmación.' })
  async cambiarItem(@Param('id') id: string, @Param('itemId') itemId: string, @Body() dto: CambiarItemDto) {
    return { data: await this.comandasService.cambiarItem(id, itemId, dto) };
  }

  /** POST /api/v1/valoraciones — CSAT del comensal */
  @Post('valoraciones')
  @ApiTags('valoraciones')
  @ApiOperation({ summary: 'Valoración del comensal (CSAT)', description: 'Puntuación 1-5 sobre la experiencia de la comanda.' })
  @ApiBody({ type: ValoracionDto })
  async valorar(@Body() dto: ValoracionDto) {
    return { data: await this.valoracionService.crear(dto) };
  }
}
