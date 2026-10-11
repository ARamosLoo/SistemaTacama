/**
 * main.ts — catalogo-i18n-service (puerto 3002)
 */

import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Las fotos de los platos llegan como data URL (hasta 5 MB)
  app.useBodyParser('json', { limit: '8mb' });
  // Fotos subidas desde la administración
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/api/v1/uploads/' });

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableCors({ origin: process.env.CORS_ORIGINS?.split(',') ?? ['http://localhost:5173'] });

  const config = new DocumentBuilder()
    .setTitle('TacamaMesa — Catálogo i18n')
    .setDescription('Carta multiidioma, platos, ingredientes, alérgenos y glosario peruano')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
    .addTag('carta', 'Carta localizada según Accept-Language')
    .addTag('platos', 'Detalle de platos')
    .build();

  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));

  const port = process.env.PORT ?? 3002;
  await app.listen(port);
  logger.log(`catalogo-i18n-service en http://localhost:${port}/api/v1`);
  logger.log(`Swagger en http://localhost:${port}/api/docs`);
}

bootstrap();
