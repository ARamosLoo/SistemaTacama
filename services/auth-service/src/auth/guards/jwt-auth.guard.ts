/**
 * jwt-auth.guard.ts — Guard que protege rutas del personal con JWT.
 * Uso: @UseGuards(JwtAuthGuard) en el controlador o método.
 */

import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Si el endpoint está marcado como @Public(), omitir validación
    const esPublico = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (esPublico) return true;

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any): any {
    if (err || !user) {
      throw new UnauthorizedException({
        mensaje: 'Token de acceso inválido o expirado',
        codigo: 'AUTH_002',
      });
    }
    return user;
  }
}
