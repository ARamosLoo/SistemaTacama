/**
 * main.ts — auth-service
 * Punto de entrada: configura Swagger, pipes de validación,
 * filtro de excepciones y habilita CORS.
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // ── Prefijo global de API ────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  // ── Pipe global de validación (class-validator) ─────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,          // elimina propiedades no definidas en el DTO
      forbidNonWhitelisted: true,
      transform: true,          // convierte tipos automáticamente
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── Filtro global de excepciones HTTP ───────────────────────
  app.useGlobalFilters(new HttpExceptionFilter());

  // ── CORS ────────────────────────────────────────────────────
  const origenes = process.env.CORS_ORIGINS?.split(',') ?? ['http://localhost:5173'];
  app.enableCors({ origin: origenes, credentials: true });

  // ── Swagger / OpenAPI ────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('TacamaMesa — Auth Service')
    .setDescription('Autenticación JWT por rol y token de mesa temporal por QR')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
    .addTag('auth', 'Login y refresh de tokens')
    .addTag('mesas', 'Sesiones de mesa por QR')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // ── Arranque ─────────────────────────────────────────────────
  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  logger.log(`auth-service escuchando en http://localhost:${port}/api/v1`);
  logger.log(`Swagger disponible en http://localhost:${port}/api/docs`);
}

bootstrap();
