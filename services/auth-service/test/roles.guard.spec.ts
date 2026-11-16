/** Pruebas de la guardia de roles: la comparación no distingue mayúsculas (el enum compartido va en minúsculas). */
import { ForbiddenException } from '@nestjs/common';
import { RolesGuard } from '../src/auth/guards/roles.guard';

const contexto = (user: any) => ({
  getHandler: () => undefined,
  getClass: () => undefined,
  switchToHttp: () => ({ getRequest: () => ({ user }) }),
}) as any;
const guardia = (roles?: string[]) => new RolesGuard({ getAllAndOverride: () => roles } as any);

describe('RolesGuard', () => {
  it('sin @Roles deja pasar', () => {
    expect(guardia(undefined).canActivate(contexto({ rol: 'MOZO' }))).toBe(true);
    expect(guardia([]).canActivate(contexto({ rol: 'MOZO' }))).toBe(true);
  });
  it('acepta el rol de la base de datos (mayúsculas) aunque el enum esté en minúsculas', () => {
    expect(guardia(['anfitrion', 'mozo', 'jefe_salon', 'administrador']).canActivate(contexto({ rol: 'ADMINISTRADOR' }))).toBe(true);
    expect(guardia(['anfitrion', 'mozo']).canActivate(contexto({ rol: 'MOZO' }))).toBe(true);
  });
  it('rechaza un rol que no está en la lista (AUTH_004)', () => {
    expect(() => guardia(['anfitrion', 'mozo']).canActivate(contexto({ rol: 'COCINA' }))).toThrow(ForbiddenException);
  });
  it('rechaza si no hay usuario autenticado', () => {
    expect(() => guardia(['mozo']).canActivate(contexto(undefined))).toThrow(ForbiddenException);
  });
});
