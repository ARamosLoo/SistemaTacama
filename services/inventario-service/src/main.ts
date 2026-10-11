import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('TacamaMesa — Inventario Service')
    .setDescription('Gestión de stock de etiquetas (vinos y piscos Tacama). Adaptador sandbox de bodega.')
    .setVersion('1.0')
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));

  const port = process.env.PORT ?? 3005;
  await app.listen(port);
  logger.log(`inventario-service en http://localhost:${port}/api/v1`);
  logger.log(`RabbitMQ consumer activo (ComandaConfirmada + ComandaAnulada)`);
}
bootstrap();
