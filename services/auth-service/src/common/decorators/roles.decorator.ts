/**
 * roles.decorator.ts
 * Decorador @Roles() para marcar endpoints con roles requeridos.
 * Se usa junto con RolesGuard.
 */

import { SetMetadata } from '@nestjs/common';
import { RolUsuario } from '@tacamamesa/shared-types';

export const ROLES_KEY = 'roles';

/** Uso: @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.JEFE_SALON) */
export const Roles = (...roles: RolUsuario[]) => SetMetadata(ROLES_KEY, roles);
