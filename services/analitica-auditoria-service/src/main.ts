import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap - Analítica & Auditoría');
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('TacamaMesa — Analítica y Auditoría Service')
    .setDescription('Servicio de métricas de negocio, indicadores KPI y log de auditoría inmutable (TOGAF ADM)')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT_ANALITICA || 3006;
  await app.listen(port);
  logger.log(`Servicio de Analítica & Auditoría corriendo en http://localhost:${port}`);
  logger.log(`Documentación Swagger en http://localhost:${port}/api/docs`);
}

bootstrap();
