// ── Prisma (copiado del auth-service) ────────────────────────
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '../../generated/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  constructor() {
    super({ log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'] });
  }
  async onModuleInit()    { await this.$connect(); this.logger.log('PostgreSQL conectado'); }
  async onModuleDestroy() { await this.$disconnect(); }
}
