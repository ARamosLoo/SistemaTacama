import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service';
import { ExistenciasService } from './existencias/existencias.service';
import { ExistenciasController } from './existencias/existencias.controller';
import { RabbitMQConsumer } from './eventos/rabbitmq.consumer';
import { BodegaSandboxAdapter } from './sandbox/bodega-sandbox.adapter';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [ExistenciasController],
  providers: [
    PrismaService,
    ExistenciasService,
    BodegaSandboxAdapter,
    RabbitMQConsumer,  // inicia al arrancar el módulo
  ],
})
export class AppModule {}
