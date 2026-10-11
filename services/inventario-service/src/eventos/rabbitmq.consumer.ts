/**
 * rabbitmq.consumer.ts — Consume eventos de comandas para gestionar stock.
 * RN06: descuenta stock al confirmar comanda (ComandaConfirmada)
 * RN07: revierte stock al anular comanda (ComandaAnulada)
 */

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqplib from 'amqplib';
import { ExistenciasService } from '../existencias/existencias.service';
import { EventoComandaConfirmada, EventoComandaAnulada } from '@tacamamesa/shared-types';

@Injectable()
export class RabbitMQConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQConsumer.name);
  private connection: any = null;
  private channel: any = null;

  constructor(
    private readonly config: ConfigService,
    private readonly existenciasService: ExistenciasService,
  ) {}

  async onModuleInit() { await this.conectarYConsumir(); }
  async onModuleDestroy() {
    try { await this.channel?.close(); await this.connection?.close(); } catch {}
  }

  private async conectarYConsumir() {
    try {
      const url = this.config.getOrThrow<string>('RABBITMQ_URL');
      this.connection = await amqplib.connect(url);
      this.channel    = await this.connection.createChannel();

      // Prefetch 1: procesar un mensaje a la vez (garantiza orden)
      await this.channel.prefetch(1);

      // ── Consumir ComandaConfirmada (RN06) ────────────────────
      await this.channel.consume(
        'inventario.comanda-confirmada',
        async (msg: amqplib.Message | null) => {
          if (!msg) return;
          try {
            const evento: EventoComandaConfirmada = JSON.parse(msg.content.toString());
            this.logger.log(`ComandaConfirmada recibida: ${evento.comandaId}`);
            await this.procesarConfirmada(evento);
            this.channel.ack(msg);
          } catch (err) {
            this.logger.error('Error procesando ComandaConfirmada', err);
            // NACK sin requeue para evitar loops; irá al DLX
            this.channel.nack(msg, false, false);
          }
        },
      );

      // ── Consumir ComandaAnulada (RN07) ────────────────────────
      await this.channel.consume(
        'inventario.comanda-anulada',
        async (msg: amqplib.Message | null) => {
          if (!msg) return;
          try {
            const evento: EventoComandaAnulada = JSON.parse(msg.content.toString());
            this.logger.log(`ComandaAnulada recibida: ${evento.comandaId}`);
            await this.procesarAnulada(evento);
            this.channel.ack(msg);
          } catch (err) {
            this.logger.error('Error procesando ComandaAnulada', err);
            this.channel.nack(msg, false, false);
          }
        },
      );

      this.logger.log('RabbitMQ consumer listo — escuchando comandas');
    } catch (err) {
      this.logger.error('Error conectando consumer RabbitMQ', err);
      setTimeout(() => this.conectarYConsumir(), 5000);
    }
  }

  /** RN06: descuenta stock de cada etiqueta seleccionada en la comanda */
  private async procesarConfirmada(evento: EventoComandaConfirmada) {
    for (const item of evento.items) {
      if (!item.etiquetaId) continue; // solo si hay etiqueta seleccionada

      await this.existenciasService.descontarStock({
        etiquetaId: item.etiquetaId,
        cantidad:   item.cantidad,
        comandaId:  evento.comandaId,
        motivo:     `Comanda confirmada: ${evento.comandaId}`,
      });
    }
  }

  /** RN07: revierte stock (devolución) de cada etiqueta de la comanda anulada */
  private async procesarAnulada(evento: EventoComandaAnulada) {
    // Para revertir necesitamos saber qué etiquetas tenía la comanda.
    // En este MVP registramos el movimiento con referencia a la comanda.
    await this.existenciasService.registrarDevolucion({
      comandaId: evento.comandaId,
      motivo:    `Comanda anulada: ${evento.motivo}`,
    });
  }
}
