/**
 * jwt.strategy.ts — Estrategia Passport para validar JWT del personal.
 * Lee el token del header Authorization: Bearer <token>
 * y adjunta el payload al objeto request.user.
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '@tacamamesa/shared-types';
import { UsuariosService } from '../../usuarios/usuarios.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly usuariosService: UsuariosService,
  ) {
    super({
      // Extrae el token del header Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  /**
   * Valida el payload del JWT.
   * Passport llama este método DESPUÉS de verificar la firma.
   * Si retorna null, Passport lanza 401 automáticamente.
   */
  async validate(payload: JwtPayload) {
    const usuario = await this.usuariosService.findById(payload.sub);

    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException('Usuario no encontrado o inactivo');
    }

    // El objeto retornado se adjunta a request.user. El rol es el de la base de datos: si un administrador
    // cambia el rol de alguien, el cambio vale de inmediato y no cuando venza el token que ya tenía.
    return {
      id: payload.sub,
      email: payload.email,
      rol: usuario.rol,
    };
  }
}
