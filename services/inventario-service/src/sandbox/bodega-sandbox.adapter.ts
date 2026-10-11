/**
 * bodega-sandbox.adapter.ts — Adaptador al sandbox de la bodega Tacama.
 * NUNCA conectar a la base de producción de la bodega.
 * Simula: consultar stock externo y registrar movimientos.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class BodegaSandboxAdapter {
  private readonly logger = new Logger(BodegaSandboxAdapter.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = config.get<string>('BODEGA_SANDBOX_URL', 'http://bodega-sandbox:8080/sandbox');
    this.apiKey  = config.get<string>('BODEGA_SANDBOX_API_KEY', 'sandbox-key');
  }

  /** Consulta el stock de una etiqueta en el sandbox de la bodega */
  async consultarStockExterno(codigoInterno: string): Promise<number | null> {
    try {
      const { data } = await axios.get(`${this.baseUrl}/existencias`, {
        headers: { 'X-API-Key': this.apiKey },
        timeout: 2000,
      });

      const etiqueta = data.existencias?.find(
        (e: { codigoInterno: string; stock: number }) => e.codigoInterno === codigoInterno,
      );

      this.logger.debug(`Stock externo (sandbox): ${codigoInterno} → ${etiqueta?.stock ?? 'N/A'}`);
      return etiqueta?.stock ?? null;
    } catch (err) {
      // El sandbox es opcional; no bloqueamos la operación si no responde
      this.logger.warn(`Sandbox no disponible: ${(err as Error).message}`);
      return null;
    }
  }

  /** Registra un movimiento en el sandbox de la bodega */
  async notificarMovimiento(payload: {
    codigoInterno: string;
    tipo: 'entrada' | 'salida';
    cantidad: number;
    referencia: string;
  }): Promise<string | null> {
    try {
      const { data } = await axios.post(`${this.baseUrl}/movimientos`, payload, {
        headers: { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' },
        timeout: 2000,
      });

      this.logger.log(`Movimiento notificado al sandbox: ${data.id}`);
      return data.id;
    } catch (err) {
      this.logger.warn(`No se pudo notificar al sandbox: ${(err as Error).message}`);
      return null;
    }
  }
}
