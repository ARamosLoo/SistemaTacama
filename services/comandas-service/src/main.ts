import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableCors({ origin: process.env.CORS_ORIGINS?.split(',') ?? ['http://localhost:5173', 'http://localhost:5174'], credentials: true });

  const config = new DocumentBuilder()
    .setTitle('TacamaMesa — Comandas Service')
    .setDescription('Gestión de comandas, alérgenos y valoraciones. WebSocket en /cocina.')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));

  const port = process.env.PORT ?? 3004;
  await app.listen(port);
  logger.log(`comandas-service en http://localhost:${port}/api/v1`);
  logger.log(`WebSocket en ws://localhost:${port}/cocina`);
}
bootstrap();
