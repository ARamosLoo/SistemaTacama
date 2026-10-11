/**
 * jwt-mesa.strategy.ts — Estrategia Passport para el token de mesa (QR).
 * Usa un secreto DIFERENTE al del personal (JWT_MESA_SECRET).
 * Solo da acceso a rutas del comensal.
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { TokenMesaPayload } from '@tacamamesa/shared-types';

@Injectable()
export class JwtMesaStrategy extends PassportStrategy(Strategy, 'jwt-mesa') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_MESA_SECRET'),
    });
  }

  async validate(payload: TokenMesaPayload) {
    // Verificar que sea un token de tipo 'mesa'
    if (payload.tipo !== 'mesa') {
      throw new UnauthorizedException('Token no válido para esta operación');
    }

    return {
      mesaId: payload.mesaId,
      codigoQR: payload.codigoQR,
      tipo: 'mesa',
    };
  }
}
