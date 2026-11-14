/**
 * maridaje.service.ts — RecomendarMaridaje
 * RN03: máx. 3 etiquetas con stock > 0
 * RN05: al menos una de diferente rango de precio
 * Caché Redis por REDIS_TTL_MARIDAJE segundos (< 1 s NFR).
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

// Se cachean solo las reglas del plato; el stock se consulta en cada petición (cambia con cada pedido y desde administración)
const cacheKey = (platoId: string) => `maridaje:reglas:${platoId}`;

@Injectable()
export class MaridajeService {
  private readonly logger = new Logger(MaridajeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {}

  /**
   * RecomendarMaridaje: devuelve máx. 3 etiquetas Tacama
   * que maridan con el plato, filtradas por stock > 0 (RN03)
   * y con variedad de precios (RN05).
   */
  async recomendar(platoId: string, segmento?: string): Promise<object[]> {
    // Telemetría de venta cruzada: una recomendación emitida por consulta (no bloquea la respuesta)
    this.reportarRecomendacion(platoId);

    // ── 1. Reglas del plato (caché) ───────────────────────────
    let reglas = await this.redis.get<any[]>(cacheKey(platoId));
    if (!reglas) {
      const filas = await this.prisma.reglaMaridaje.findMany({
        where: {
          platoId,
          activa: true,
          OR: [{ vigenciaHasta: null }, { vigenciaHasta: { gt: new Date() } }],
        },
        include: {
          etiqueta: {
            select: {
              id: true, codigoInterno: true, nombre: true, tipo: true, cepa: true,
              descripcionEs: true, precioLista: true, rangoPrecio: true, imagenUrl: true,
            },
          },
        },
        orderBy: { puntaje: 'desc' },
      });
      reglas = filas.map((r) => ({ ...r, etiqueta: { ...r.etiqueta, precioLista: Number(r.etiqueta.precioLista) } }));
      const ttl = this.config.get<number>('REDIS_TTL_MARIDAJE', 600);
      await this.redis.set(cacheKey(platoId), reglas, ttl);
    }
    // RN13: se aplican las reglas sin segmento y las del segmento del comensal; el precio de la etiqueta no cambia
    const seg = segmento?.toUpperCase();
    reglas = reglas.filter((r) => !r.segmento || r.segmento === seg);
    if (reglas.length === 0) return [];

    // ── 2. Stock actual del inventario-service (vigente en cada consulta) ──
    const etiquetasConStock = await this.filtrarPorStock(reglas.map((r) => r.etiqueta.codigoInterno));

    // ── 3. Filtrar reglas con stock > 0 (RN03) ────────────────
    const reglasConStock = reglas.filter((r) => etiquetasConStock.has(r.etiqueta.codigoInterno));

    // ── 4. Aplicar RN05: variedad de precios ──────────────────
    const seleccionadas = this.aplicarVariedadPrecios(reglasConStock);

    // ── 5. Mapear respuesta (máx. 3) ─────────────────────────
    return seleccionadas.slice(0, 3).map((r) => ({
      reglaId:    r.id,
      etiquetaId: r.etiqueta.id,
      codigoInterno: r.etiqueta.codigoInterno,
      nombre:     r.etiqueta.nombre,
      tipo:       r.etiqueta.tipo,
      cepa:       r.etiqueta.cepa,
      descripcion: r.etiqueta.descripcionEs,
      precioLista: Number(r.etiqueta.precioLista),
      rangoPrecio:  r.etiqueta.rangoPrecio,
      puntaje:     r.puntaje,
      motivo:      r.motivo,
      stockDisponible: etiquetasConStock.get(r.etiqueta.codigoInterno) ?? 0,
    }));
  }

  /**
   * Registra si una recomendación fue aceptada o rechazada.
   * Para analítica: tasa de venta cruzada (RF).
   */
  private reportarRecomendacion(platoId: string) {
    const url = this.config.get<string>('ANALITICA_SERVICE_URL', 'http://localhost:3006');
    axios
      .post(`${url}/api/v1/indicadores/eventos`, { tipo: 'maridaje.recomendado', payload: { platoId } }, { timeout: 800 })
      .catch(() => undefined);
  }

  /** Catálogo de etiquetas activas */
  async listarEtiquetas() {
    const e = await this.prisma.etiqueta.findMany({ where: { activa: true }, orderBy: { precioLista: 'desc' } });
    return e.map((x) => ({ ...x, precioLista: Number(x.precioLista) }));
  }

  async registrarAceptacion(
    reglaId: string,
    sesionMesaId: string,
    aceptada: boolean,
    comandaId?: string,
  ) {
    return this.prisma.recomendacion.create({
      data: {
        reglaId,
        etiquetaId: (await this.prisma.reglaMaridaje.findUniqueOrThrow({ where: { id: reglaId } })).etiquetaId,
        sesionMesaId,
        aceptada,
        comandaId,
      },
    });
  }

  /**
   * RN05: la recomendación incluye al menos una etiqueta de un rango de precio distinto al de la mejor,
   * siempre que exista alguna. Se toman las 3 de mayor puntaje y, si todas son del mismo rango, la última
   * se reemplaza por la de mayor puntaje de otro rango.
   */
  private aplicarVariedadPrecios(reglas: any[]) {
    const top = reglas.slice(0, 3);
    if (top.length <= 1) return top;
    const rangoMejor = top[0].etiqueta.rangoPrecio;
    if (top.some((r) => r.etiqueta.rangoPrecio !== rangoMejor)) return top;
    const otra = reglas.slice(3).find((r) => r.etiqueta.rangoPrecio !== rangoMejor);
    if (otra) top[top.length - 1] = otra;
    return top;
  }

  /**
   * Consulta el stock actual al inventario-service via HTTP.
   * Retorna un Map<etiquetaId, stockActual> para etiquetas con stock > 0.
   */
  private async filtrarPorStock(etiquetaIds: string[]): Promise<Map<string, number>> {
    const stockMap = new Map<string, number>();

    try {
      const inventarioUrl = this.config.get<string>(
        'INVENTARIO_SERVICE_URL',
        'http://localhost:3005',
      );

      // Consulta en paralelo (Promise.allSettled para resiliencia)
      const resultados = await Promise.allSettled(
        etiquetaIds.map((id) =>
          axios.get<{ data: { stockActual: number } }>(
            `${inventarioUrl}/api/v1/existencias`,
            { params: { etiqueta: id }, timeout: 800 },
          ),
        ),
      );

      resultados.forEach((r, i) => {
        if (r.status === 'fulfilled' && r.value.data.data.stockActual > 0) {
          stockMap.set(etiquetaIds[i], r.value.data.data.stockActual);
        }
      });
    } catch (err) {
      // Si el inventario no responde, NO bloqueamos el maridaje.
      // Log de warning y retornamos todas las etiquetas como disponibles.
      this.logger.warn('No se pudo consultar stock; mostrando todas las etiquetas');
      etiquetaIds.forEach((id) => stockMap.set(id, 999));
    }

    return stockMap;
  }
}
