/**
 * roles.guard.ts — Guard de autorización por rol.
 * Verifica que el usuario autenticado tenga alguno de los roles
 * definidos con el decorador @Roles().
 *
 * DEBE usarse SIEMPRE junto con JwtAuthGuard:
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *   @Roles(RolUsuario.ADMINISTRADOR)
 */

import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolUsuario } from '@tacamamesa/shared-types';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Obtener roles requeridos del decorador @Roles()
    const rolesRequeridos = this.reflector.getAllAndOverride<RolUsuario[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si no hay @Roles(), permitir paso (solo JwtAuthGuard aplica)
    if (!rolesRequeridos || rolesRequeridos.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException({
        mensaje: 'No tienes permisos para realizar esta acción',
        codigo: 'AUTH_004',
      });
    }

    const tieneRol = rolesRequeridos.some((rol) => user.rol === rol);

    if (!tieneRol) {
      throw new ForbiddenException({
        mensaje: `Esta acción requiere uno de los roles: ${rolesRequeridos.join(', ')}`,
        codigo: 'AUTH_004',
      });
    }

    return true;
  }
}
