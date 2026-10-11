import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;
  constructor(private readonly config: ConfigService) {}
  onModuleInit() {
    this.client = new Redis({
      host: this.config.get('REDIS_HOST', 'localhost'),
      port: this.config.get<number>('REDIS_PORT', 6379),
      password: this.config.get('REDIS_PASSWORD'),
    });
    this.client.on('error', (e) => this.logger.error('Redis error', e));
  }
  async onModuleDestroy() { await this.client.quit(); }
  async get<T>(key: string): Promise<T | null> {
    const d = await this.client.get(key);
    return d ? JSON.parse(d) : null;
  }
  async set(key: string, value: unknown, ttl: number) {
    await this.client.setex(key, ttl, JSON.stringify(value));
  }
  async del(...keys: string[]) { if (keys.length) await this.client.del(...keys); }
}
