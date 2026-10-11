import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service';
import { RedisService } from './redis/redis.service';
import { CartaService } from './carta/carta.service';
import { CartaController } from './carta/carta.controller';
import { PlatosService } from './platos/platos.service';
import { AdminController } from './admin/admin.controller';
import { AdminService } from './admin/admin.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
  ],
  controllers: [CartaController, AdminController],
  providers: [PrismaService, RedisService, CartaService, PlatosService, AdminService],
})
export class AppModule {}
