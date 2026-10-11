/**
 * mesas.controller.ts — Endpoint para obtener sesión por QR.
 * GET /api/v1/mesas/{codigoQR}/sesion
 * Endpoint público: el comensal no tiene token previo.
 */

import { Controller, Get, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from '../auth/auth.service';
import { MesasService } from './mesas.service';
import { TokenMesaResponseDto } from '../auth/dto/auth-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { RolUsuario } from '@tacamamesa/shared-types';

@ApiTags('mesas')
@Controller('mesas')
export class MesasController {
  constructor(
    private readonly authService: AuthService,
    private readonly mesasService: MesasService,
  ) {}

  /** GET /api/v1/mesas — lista de mesas activas (portal de salón) */
  @Public()
  @Get()
  @ApiOperation({ summary: 'Listar mesas activas' })
  async listar() {
    return { data: await this.mesasService.findAllActivas() };
  }

  /**
   * GET /api/v1/mesas/:codigoQR/sesion
   * El comensal escanea el QR y obtiene su token de mesa.
   * No requiere autenticación previa.
   */
  @Public()
  @Get(':codigoQR/sesion')
  @ApiOperation({
    summary: 'Obtener sesión de mesa por QR',
    description:
      'Al escanear el código QR de la mesa, el comensal recibe un token temporal ' +
      'válido por 4 horas para acceder a la carta y realizar pedidos.',
  })
  @ApiParam({
    name: 'codigoQR',
    example: 'QR-MESA-002',
    description: 'Código QR impreso en la mesa',
  })
  @ApiResponse({
    status: 200,
    description: 'Token de mesa generado exitosamente',
    type: TokenMesaResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'QR inválido o mesa inactiva',
    schema: {
      example: {
        statusCode: 404,
        error: 'NOT_FOUND',
        mensaje: 'El código QR no corresponde a ninguna mesa activa',
        codigo: 'AUTH_005',
        timestamp: '2024-01-15T12:00:00.000Z',
        path: '/api/v1/mesas/QR-INVALIDO/sesion',
      },
    },
  })
  obtenerSesion(
    @Param('codigoQR') codigoQR: string,
  ): Promise<TokenMesaResponseDto> {
    return this.authService.generarTokenMesa(codigoQR);
  }

  /**
   * DELETE /api/v1/mesas/:mesaId/sesion
   * Cierra la sesión activa de una mesa (anfitrión o jefe de salón).
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ANFITRION, RolUsuario.JEFE_SALON, RolUsuario.ADMINISTRADOR)
  @Delete(':mesaId/sesion')
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Cerrar sesión de mesa',
    description: 'El anfitrión cierra la sesión de una mesa al liberar la cuenta.',
  })
  @ApiResponse({ status: 200, description: 'Sesión cerrada' })
  async cerrarSesion(@Param('mesaId') mesaId: string) {
    await this.authService.cerrarSesionMesa(mesaId);
    return { data: { mensaje: 'Sesión de mesa cerrada correctamente' } };
  }
}
