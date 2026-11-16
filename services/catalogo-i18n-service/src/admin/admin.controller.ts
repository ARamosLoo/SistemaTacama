/**
 * admin.controller.ts — Administración de la carta (solo administrador y jefe de salón)
 * GET   /api/v1/admin/platos            → todos los platos, también los agotados
 * PATCH /api/v1/admin/platos/:id        → precio y disponibilidad
 * POST  /api/v1/admin/platos/:id/foto   → foto del plato (data URL base64)
 */
import { Controller, Get, Patch, Post, Put, Param, Body, Headers, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { AdminService } from './admin.service';
import { rolDelToken } from '../common/sesion';

class ActualizarPlatoDto {
  @IsOptional() @IsNumber() precioBase?: number;
  @IsOptional() @IsBoolean() disponible?: boolean;
}

class ComposicionDto {
  @IsOptional() @IsArray() @IsString({ each: true }) alergenos?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) ingredientes?: string[];
}

class FotoDto {
  @IsString() imagen: string;
}

const ROLES_ADMIN = ['ADMINISTRADOR', 'JEFE_SALON'];

function exigir(authorization?: string) {
  const rol = rolDelToken(authorization);
  if (!rol || !ROLES_ADMIN.includes(rol)) {
    throw new ForbiddenException({ mensaje: 'Solo administración puede modificar la carta', codigo: 'CAT_005' });
  }
}

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('platos')
  @ApiOperation({ summary: 'Listar todos los platos (incluye agotados)' })
  async listar(@Headers('authorization') a?: string) {
    exigir(a);
    return { data: await this.admin.listar() };
  }

  @Patch('platos/:id')
  @ApiOperation({ summary: 'Cambiar precio o marcar agotado' })
  async actualizar(@Param('id') id: string, @Body() dto: ActualizarPlatoDto, @Headers('authorization') a?: string) {
    exigir(a);
    return { data: await this.admin.actualizar(id, dto) };
  }

  @Get('platos/:id/composicion')
  @ApiOperation({ summary: 'Alérgenos e ingredientes de un plato (RF19)' })
  async composicion(@Param('id') id: string, @Headers('authorization') a?: string) {
    exigir(a);
    return { data: await this.admin.composicion(id) };
  }

  @Put('platos/:id/composicion')
  @ApiOperation({ summary: 'Editar alérgenos e ingredientes de un plato (RF19)' })
  async actualizarComposicion(@Param('id') id: string, @Body() dto: ComposicionDto, @Headers('authorization') a?: string) {
    exigir(a);
    return { data: await this.admin.actualizarComposicion(id, dto) };
  }

  @Post('platos/:id/foto')
  @ApiOperation({ summary: 'Subir foto del plato' })
  async foto(@Param('id') id: string, @Body() dto: FotoDto, @Headers('authorization') a?: string) {
    exigir(a);
    return { data: await this.admin.subirFoto(id, dto.imagen) };
  }
}
