/**
 * auth.module.ts — Módulo de autenticación.
 * Configura JwtModule con el secreto de .env y registra estrategias.
 */

import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtMesaStrategy } from './strategies/jwt-mesa.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { MesasModule } from '../mesas/mesas.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // JWT asíncrono: lee el secreto desde ConfigService (variables de entorno)
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRES_IN', '8h'),
        },
      }),
    }),

    UsuariosModule,
    forwardRef(() => MesasModule),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtMesaStrategy,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [
    AuthService,
    JwtAuthGuard,
    RolesGuard,
    JwtModule,
  ],
})
export class AuthModule {}
