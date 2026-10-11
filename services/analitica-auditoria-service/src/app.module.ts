import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service';
import { AuditoriaService } from './auditoria/auditoria.service';
import { AuditoriaController } from './auditoria/auditoria.controller';
import { IndicadoresService } from './indicadores/indicadores.service';
import { IndicadoresController } from './indicadores/indicadores.controller';
import { RabbitMQConsumer } from './eventos/rabbitmq.consumer';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
  ],
  controllers: [AuditoriaController, IndicadoresController],
  providers: [
    PrismaService,
    AuditoriaService,
    IndicadoresService,
    RabbitMQConsumer,
  ],
})
export class AppModule {}
