import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '../../generated/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Conectado a PostgreSQL (schema: analitica)');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Desconectado de PostgreSQL');
  }
}
