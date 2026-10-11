import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService }    from './prisma/prisma.service';
import { ComandasService }  from './comandas/comandas.service';
import { ComandasController } from './comandas/comandas.controller';
import { RabbitMQProducer } from './eventos/rabbitmq.producer';
import { CocinaGateway }    from './gateway/cocina.gateway';
import { ValoracionService } from './valoracion/valoracion.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [ComandasController],
  providers: [
    PrismaService,
    ComandasService,
    ValoracionService,
    RabbitMQProducer,
    CocinaGateway,
  ],
})
export class AppModule {}
