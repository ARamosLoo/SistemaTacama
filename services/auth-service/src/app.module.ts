/**
 * app.module.ts — auth-service
 * Módulo raíz: importa ConfigModule, PrismaModule, AuthModule y MesasModule.
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { MesasModule } from './mesas/mesas.module';
import { UsuariosModule } from './usuarios/usuarios.module';

@Module({
  imports: [
    // ── Variables de entorno (.env) ──────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,          // disponible en todos los módulos
      envFilePath: '.env',
    }),

    // ── Rate limiting: 100 req/min por IP ───────────────────
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '60000'),
        limit: parseInt(process.env.RATE_LIMIT_MAX ?? '100'),
      },
    ]),

    // ── Módulos internos ────────────────────────────────────
    PrismaModule,
    UsuariosModule,
    AuthModule,
    MesasModule,
  ],
})
export class AppModule {}
