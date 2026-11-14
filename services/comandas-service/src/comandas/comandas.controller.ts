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
         IsNumber, IsPositive, ValidateNested, ArrayMinSize, MinLength, MaxLength } from 'class-validator';
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
  @ApiProperty({ required: false, description: 'RN12: el ítem es una bebida alcohólica (por ejemplo, coctelería)' })
  @IsOptional() @IsBoolean() esAlcohol?: boolean;
  @ApiProperty() @IsString() platoId: string;
  @ApiProperty() @IsString() platoNombre: string;
  @ApiProperty() @IsNumber() @IsPositive() precioUnit: number;
  @ApiProperty({ default: 1 }) @IsNumber() @IsPositive() cantidad: number;
  @ApiProperty({ required: false }) @IsOptional() @IsString() etiquetaId?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() etiquetaNombre?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(600) notas?: string;
}

class CrearComandaDto {
  @ApiProperty() @IsString() mesaId: string;
  @ApiProperty() @IsString() sesionMesaId: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() mozoId?: string;
  @ApiProperty({ type: [ItemDto] })
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => ItemDto)
  items: ItemDto[];
  @ApiProperty({ required: false }) @IsOptional() @IsString() observaciones?: string;
  @ApiProperty({ required: false, description: 'RN12: declaración de mayoría de edad; obligatoria si hay vino o pisco' })
  @IsOptional() @IsBoolean() mayorEdad?: boolean;
  @ApiProperty({ required: false, description: 'RN02: códigos de alérgeno declarados que están presentes en los platos pedidos' })
  @IsOptional() @IsArray() conflictosAlergeno?: string[];
  @ApiProperty({ required: false, description: 'RN02: el comensal confirma expresamente los platos con alérgenos declarados' })
  @IsOptional() @IsBoolean() confirmaConflicto?: boolean;
}

class LiberarMesaDto {
  @ApiProperty({ example: 'El cliente se retiró sin pedir la cuenta' })
  @IsString() @MinLength(3) @MaxLength(200) motivo: string;
}

class NotasItemDto {
  @ApiProperty({ example: 'SIN: cebolla, ají | PEDIDO: poco picante' })
  @IsString() @MaxLength(600) notas: string;
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
/** Quien puede confirmar el pago y cerrar la mesa: personal de salón. */
const ROLES_QUE_COBRAN = ['MOZO', 'JEFE_SALON', 'ADMINISTRADOR', 'CAJA'];
/** RN02: quienes pueden aprobar la preparación de platos con alérgenos declarados (el chef y su cocina) */
const ROLES_CHEF = ['COCINA', 'ADMINISTRADOR'];
/** Personal con sesión válida: consulta y anulación de comandas (no el comensal) */
const ROLES_PERSONAL = ['MOZO', 'JEFE_SALON', 'ADMINISTRADOR', 'CAJA', 'COCINA', 'SOMMELIER', 'ALMACEN', 'ANFITRION'];

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
    @Headers('authorization') authorization?: string,
  ) {
    const sesion = sesionDelToken(authorization);
    if (!sesion || !ROLES_PERSONAL.includes(sesion.rol)) {
      throw new ForbiddenException({ mensaje: 'Solo el personal puede anular una comanda completa', codigo: 'CMD_011' });
    }
    return { data: await this.comandasService.anular(id, motivo ?? 'Anulación solicitada', sesion) };
  }

  /** GET /api/v1/comandas/:id — obtener comanda */
  @Get('comandas')
  @ApiOperation({ summary: 'Listar comandas (KDS / salón)', description: 'Filtro opcional ?estado=PENDIENTE,EN_PREPARACION,LISTA' })
  async listar(@Query('estado') estado?: string, @Headers('authorization') authorization?: string) {
    const sesion = sesionDelToken(authorization);
    if (!sesion || !ROLES_PERSONAL.includes(sesion.rol)) {
      throw new ForbiddenException({ mensaje: 'Solo el personal puede consultar las comandas', codigo: 'CMD_011' });
    }
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

  /** POST /api/v1/comandas/:id/cerrar — el mozo confirma el pago y la mesa queda libre */
  @Post('comandas/:id/cerrar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirmar el pago, cerrar la comanda y liberar la mesa' })
  async cerrar(@Param('id') id: string, @Headers('authorization') authorization?: string) {
    const sesion = this.exigirPersonalDeSalon(authorization);
    await this.comandasService.exigirResponsable(id, sesion);
    return { data: await this.comandasService.cerrar(id) };
  }

  /** POST /api/v1/comandas/:id/liberar — libera la mesa sin cuenta, con motivo (queda en auditoría) */
  @Post('comandas/:id/liberar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Liberar la mesa sin cuenta' })
  async liberar(@Param('id') id: string, @Body() dto: LiberarMesaDto, @Headers('authorization') authorization?: string) {
    const sesion = this.exigirPersonalDeSalon(authorization);
    await this.comandasService.exigirResponsable(id, sesion);
    return { data: await this.comandasService.liberarSinCuenta(id, sesion, dto.motivo.trim()) };
  }

  private exigirPersonalDeSalon(authorization?: string) {
    const sesion = sesionDelToken(authorization);
    if (!sesion || !ROLES_QUE_COBRAN.includes(sesion.rol)) {
      throw new ForbiddenException({ mensaje: 'Solo el personal de salón puede realizar esta acción', codigo: 'CMD_011' });
    }
    return sesion;
  }

  /** POST /api/v1/comandas/:id/aprobar-alergenos — el chef aprueba preparar platos con alérgenos declarados (RN02) */
  @Post('comandas/:id/aprobar-alergenos')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aprobar platos con alérgenos declarados (RN02)', description: 'Solo cocina/chef. Habilita pasar a EN_PREPARACION.' })
  async aprobarAlergenos(@Param('id') id: string, @Headers('authorization') authorization?: string) {
    const sesion = sesionDelToken(authorization);
    if (!sesion || !ROLES_CHEF.includes(sesion.rol)) {
      throw new ForbiddenException({ mensaje: 'Solo el chef o cocina pueden aprobar platos con alérgenos declarados (RN02)', codigo: 'CMD_011' });
    }
    return { data: await this.comandasService.aprobarAlergenos(id, sesion) };
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
  async anularItem(@Param('id') id: string, @Param('itemId') itemId: string, @Headers('authorization') authorization?: string) {
    return { data: await this.comandasService.anularItem(id, itemId, sesionDelToken(authorization)) };
  }

  /** PATCH /api/v1/comandas/:id/items/:itemId — el comensal cambia un plato por otro (primeros 5 minutos) */
  @Patch('comandas/:id/items/:itemId')
  @ApiOperation({ summary: 'Cambiar un plato de la comanda', description: 'Solo dentro de los 5 minutos posteriores a la confirmación.' })
  async cambiarItem(@Param('id') id: string, @Param('itemId') itemId: string, @Body() dto: CambiarItemDto, @Headers('authorization') authorization?: string) {
    return { data: await this.comandasService.cambiarItem(id, itemId, dto, sesionDelToken(authorization)) };
  }

  /** PATCH /api/v1/comandas/:id/items/:itemId/notas — el comensal personaliza un plato (primeros 5 minutos) */
  @Patch('comandas/:id/items/:itemId/notas')
  @ApiOperation({ summary: 'Personalizar un plato de la comanda', description: 'Cambia las notas para cocina; solo dentro de los 5 minutos posteriores a la confirmación.' })
  async personalizarItem(@Param('id') id: string, @Param('itemId') itemId: string, @Body() dto: NotasItemDto, @Headers('authorization') authorization?: string) {
    return { data: await this.comandasService.personalizarItem(id, itemId, dto.notas, sesionDelToken(authorization)) };
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
