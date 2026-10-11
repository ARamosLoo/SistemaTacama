/**
 * rabbitmq.consumer.ts — Consumidor de eventos de RabbitMQ para analítica y auditoría.
 * Captura todos los eventos del topic exchange 'tacama.events' y los persiste de manera inmutable.
 */

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RabbitMQConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQConsumer.name);
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect() {
    const url = this.configService.get<string>('RABBITMQ_URL', 'amqp://tacama:tacama_secret@localhost:5672');
    const exchange = 'tacama.events';
    const queueName = 'analitica.eventos.q';

    try {
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();

      await this.channel.assertExchange(exchange, 'topic', { durable: true });
      const q = await this.channel.assertQueue(queueName, { durable: true });

      // Escuchamos todos los eventos publicados en tacama.events (*.*)
      await this.channel.bindQueue(q.queue, exchange, '#');

      this.logger.log(`RabbitMQ Consumer conectado y suscrito a [${exchange}] -> [${queueName}]`);

      this.channel.consume(
        q.queue,
        async (msg) => {
          if (msg) {
            try {
              const routingKey = msg.fields.routingKey;
              const content = JSON.parse(msg.content.toString());
              await this.procesarEvento(routingKey, content);
              this.channel?.ack(msg);
            } catch (err) {
              this.logger.error(`Error procesando mensaje: ${err.message}`);
              this.channel?.nack(msg, false, false); // descartar o enviar a DLQ
            }
          }
        },
        { noAck: false },
      );
    } catch (error) {
      this.logger.warn(`No se pudo conectar a RabbitMQ: ${error.message}. Modo offline.`);
    }
  }

  private async procesarEvento(tipo: string, payload: any) {
    this.logger.log(`Evento recibido [${tipo}]`);

    // 1. Guardar en EventoNegocio
    await this.prisma.eventoNegocio.create({
      data: {
        tipo,
        payload,
        procesado: true,
      },
    });

    // 2. Registrar en LogAuditoria según tipo
    let categoria: any = 'SISTEMA';
    let entidad = 'Evento';
    let accion = tipo.toUpperCase();

    if (tipo.startsWith('comanda.')) {
      categoria = 'COMANDA';
      entidad = 'Comanda';
    } else if (tipo.startsWith('auth.') || tipo.startsWith('sesion.')) {
      categoria = 'AUTENTICACION';
      entidad = 'Sesion';
    } else if (tipo.startsWith('inventario.')) {
      categoria = 'INVENTARIO';
      entidad = 'Stock';
    } else if (tipo.startsWith('valoracion.')) {
      categoria = 'VALORACION';
      entidad = 'Comanda';
    } else if (tipo.startsWith('maridaje.')) {
      categoria = 'MARIDAJE';
      entidad = 'ReglaMaridaje';
    }

    await this.prisma.logAuditoria.create({
      data: {
        entidad,
        entidadId: payload.id || payload.comandaId || payload.etiquetaId,
        accion,
        datosDespues: payload,
        usuarioId: payload.usuarioId,
        mesaId: payload.mesaId,
        categoria,
        servicio: payload.origen || 'rabbitmq-events',
      },
    });
  }

  private async disconnect() {
    try {
      if (this.channel) await this.channel.close();
      if (this.connection) await this.connection.close();
      this.logger.log('Desconectado de RabbitMQ');
    } catch (e) {
      this.logger.error(`Error al desconectar de RabbitMQ: ${e.message}`);
    }
  }
}
