import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { sesionDelToken } from './sesion';

/**
 * Los KPIs y la auditoría solo los consulta la dirección (jefe de salón y administrador) con un JWT firmado vigente.
 * Los POST internos (otros servicios que registran eventos) no pasan por este guard.
 */
@Injectable()
export class SoloDireccionGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const sesion = sesionDelToken(req.headers?.authorization);
    if (!sesion || !['JEFE_SALON', 'ADMINISTRADOR'].includes(sesion.rol)) {
      throw new ForbiddenException({ mensaje: 'Solo la dirección puede consultar indicadores y auditoría', codigo: 'ANA_001' });
    }
    return true;
  }
}
