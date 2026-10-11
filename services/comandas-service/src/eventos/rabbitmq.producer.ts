/**
 * rabbitmq.producer.ts — Publica eventos en RabbitMQ.
 * Exchange: tacama.events (topic)
 * Routing keys: comanda.confirmada, comanda.anulada
 */

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqplib from 'amqplib';

@Injectable()
export class RabbitMQProducer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQProducer.name);
  private connection: amqplib.Connection | null = null;
  private channel: amqplib.Channel | null = null;
  private readonly exchange = 'tacama.events';

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    await this.conectar();
  }

  async onModuleDestroy() {
    try {
      await this.channel?.close();
      await this.connection?.close();
    } catch { /* ignorar errores al cerrar */ }
  }

  private async conectar() {
    try {
      const url = this.config.getOrThrow<string>('RABBITMQ_URL');
      this.connection = await amqplib.connect(url) as unknown as amqplib.Connection;
      this.channel    = await (this.connection as any).createChannel();

      // Declarar el exchange (idempotente)
      await (this.channel as any).assertExchange(this.exchange, 'topic', { durable: true });

      this.logger.log('RabbitMQ conectado — producer listo');
    } catch (err) {
      this.logger.error('Error conectando a RabbitMQ', err);
      // Reintentar después de 5 segundos
      setTimeout(() => this.conectar(), 5000);
    }
  }

  /**
   * Publica un evento en el exchange de TacamaMesa.
   * @param routingKey  p.ej. 'comanda.confirmada'
   * @param payload     objeto serializable a JSON
   */
  async publicar(routingKey: string, payload: object): Promise<void> {
    if (!this.channel) {
      this.logger.warn('Canal RabbitMQ no disponible, reintentando conexión...');
      await this.conectar();
      return;
    }

    try {
      const buffer = Buffer.from(JSON.stringify(payload));
      (this.channel as any).publish(this.exchange, routingKey, buffer, {
        persistent:  true,       // sobrevive restart del broker
        contentType: 'application/json',
        timestamp:   Date.now(),
        appId:       'comandas-service',
      });

      this.logger.log(`Evento publicado: [${routingKey}]`);
    } catch (err) {
      this.logger.error(`Error publicando evento [${routingKey}]`, err);
      throw err;
    }
  }
}
