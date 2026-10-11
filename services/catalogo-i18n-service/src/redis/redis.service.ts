/**
 * redis.service.ts — Wrapper de ioredis para caché de catálogo.
 * TTL configurados por variable de entorno.
 */

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
      host:     this.config.get<string>('REDIS_HOST', 'localhost'),
      port:     this.config.get<number>('REDIS_PORT', 6379),
      password: this.config.get<string>('REDIS_PASSWORD'),
      lazyConnect: true,
    });

    this.client.on('connect', () => this.logger.log('Redis conectado'));
    this.client.on('error',   (err) => this.logger.error('Redis error', err));

    this.client.connect().catch((e) => this.logger.error('Redis connect error', e));
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  /** Obtiene un valor cacheado (retorna null si no existe) */
  async get<T>(key: string): Promise<T | null> {
    const data = await this.client.get(key);
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  }

  /** Guarda un valor con TTL en segundos */
  async set(key: string, value: unknown, ttlSegundos: number): Promise<void> {
    await this.client.setex(key, ttlSegundos, JSON.stringify(value));
  }

  /** Elimina una o varias claves (invalida caché) */
  async del(...keys: string[]): Promise<void> {
    if (keys.length > 0) await this.client.del(...keys);
  }
}
