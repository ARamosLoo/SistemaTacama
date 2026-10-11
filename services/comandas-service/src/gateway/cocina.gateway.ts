/**
 * cocina.gateway.ts — WebSocket Gateway para la pantalla de cocina.
 * Emite eventos en tiempo real cuando una comanda llega o cambia de estado.
 *
 * El cliente (staff-web) se conecta con Socket.IO al puerto 3004.
 * Namespaces: /cocina
 */

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

// ── Eventos emitidos (server → cliente) ────────────────────────
export const WS_EVENTOS = {
  NUEVA_COMANDA:    'cocina:nueva_comanda',    // pantalla cocina
  ESTADO_CAMBIADO:  'cocina:estado_cambiado',  // actualización de estado
  ALERTA_ALERGENOS: 'cocina:alerta_alergenos', // alerta visible en cocina
  STOCK_BAJO:       'salon:stock_bajo',        // alerta para jefe de salón
} as const;

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') ?? ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
  },
  namespace: '/cocina',
})
export class CocinaGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(CocinaGateway.name);

  afterInit() {
    this.logger.log('WebSocket Gateway /cocina inicializado');
  }

  handleConnection(client: Socket) {
    const rol = client.handshake.query['rol'] as string;
    this.logger.log(`Cliente conectado: ${client.id} (rol: ${rol ?? 'desconocido'})`);

    // Unir al cliente a la sala correspondiente según su rol
    if (rol === 'cocina' || rol === 'barra') client.join('sala-cocina');
    if (rol === 'jefe_salon' || rol === 'mozo') client.join('sala-salon');
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado: ${client.id}`);
  }

  // ── El mozo puede marcar comanda en preparación ──────────────
  @SubscribeMessage('comanda:en_preparacion')
  handleEnPreparacion(client: Socket, data: { comandaId: string }) {
    this.server.to('sala-salon').emit(WS_EVENTOS.ESTADO_CAMBIADO, {
      comandaId: data.comandaId,
      estado: 'EN_PREPARACION',
      timestamp: new Date().toISOString(),
    });
  }

  // ── Métodos llamados desde ComandasService ────────────────────

  /**
   * Emite una nueva comanda a la pantalla de cocina.
   * Si tiene alérgenos, emite una alerta adicional.
   */
  emitirNuevaComanda(payload: {
    comanda: object;
    alergenosDeclarados: string[];
    tieneAlerta: boolean;
  }) {
    // Emitir comanda a cocina
    this.server.to('sala-cocina').emit(WS_EVENTOS.NUEVA_COMANDA, {
      ...payload,
      timestamp: new Date().toISOString(),
    });

    // Emitir alerta de alérgenos si aplica
    if (payload.tieneAlerta) {
      this.server.to('sala-cocina').emit(WS_EVENTOS.ALERTA_ALERGENOS, {
        comanda:   payload.comanda,
        alergenos: payload.alergenosDeclarados,
        mensaje:   `ALERTA: Comensal con alérgenos: ${payload.alergenosDeclarados.join(', ')}`,
        timestamp: new Date().toISOString(),
      });
      this.logger.warn(`Alerta de alérgenos emitida: ${payload.alergenosDeclarados.join(', ')}`);
    }
  }

  /** Emite actualización de estado de una comanda */
  emitirCambioEstado(comandaId: string, estado: string) {
    this.server.emit(WS_EVENTOS.ESTADO_CAMBIADO, {
      comandaId,
      estado,
      timestamp: new Date().toISOString(),
    });
  }
}
