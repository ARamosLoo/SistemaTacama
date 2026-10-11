import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service';
import { RedisService } from './redis/redis.service';
import { MaridajeService } from './maridaje/maridaje.service';
import { MaridajeController } from './maridaje/maridaje.controller';
import { ReglaService } from './reglas/regla.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [MaridajeController],
  providers: [PrismaService, RedisService, MaridajeService, ReglaService],
})
export class AppModule {}
