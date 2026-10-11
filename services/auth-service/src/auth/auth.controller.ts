/**
 * auth.controller.ts — Endpoints de autenticación del personal.
 * POST /api/v1/auth/login   → JWT personal
 * POST /api/v1/auth/logout  → invalidar sesión (stateless: solo cliente borra token)
 * GET  /api/v1/auth/me      → perfil del usuario autenticado
 */

import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { TokenResponseDto } from './dto/auth-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/v1/auth/login
   * Autentica un usuario del personal y retorna JWT.
   * Endpoint público (no requiere token previo).
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login del personal',
    description: 'Autentica con email y contraseña. Devuelve JWT válido por 8 horas.',
  })
  @ApiResponse({
    status: 200,
    description: 'Login exitoso',
    type: TokenResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales incorrectas',
    schema: {
      example: {
        statusCode: 401,
        error: 'UNAUTHORIZED',
        mensaje: 'Credenciales incorrectas',
        codigo: 'AUTH_003',
        timestamp: '2024-01-15T12:00:00.000Z',
        path: '/api/v1/auth/login',
      },
    },
  })
  login(@Body() loginDto: LoginDto): Promise<TokenResponseDto> {
    return this.authService.login(loginDto);
  }

  /**
   * GET /api/v1/auth/me
   * Retorna el perfil del usuario actualmente autenticado.
   * Requiere JWT válido.
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Perfil del usuario autenticado',
    description: 'Retorna los datos del usuario cuyo JWT fue enviado en el header.',
  })
  @ApiResponse({ status: 200, description: 'Perfil del usuario' })
  @ApiResponse({ status: 401, description: 'Token inválido o expirado' })
  getMe(@Request() req: Express.Request & { user: { id: string; email: string; rol: string } }) {
    return {
      data: req.user,
    };
  }

  /**
   * POST /api/v1/auth/logout
   * En un sistema JWT stateless, el cliente simplemente elimina el token.
   * Este endpoint confirma la acción y puede usarse para audit log.
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Cierre de sesión',
    description: 'El cliente debe eliminar el token. Este endpoint registra el evento.',
  })
  logout(@Request() req: Express.Request & { user: { id: string } }) {
    return {
      data: { mensaje: 'Sesión cerrada correctamente' },
    };
  }
}
