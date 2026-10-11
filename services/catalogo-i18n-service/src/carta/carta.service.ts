/**
 * carta.service.ts — ObtenerCartaLocalizada
 * Implementa RN08: español por defecto si el idioma no está soportado.
 * Caché Redis con TTL de 5 min (REDIS_TTL_CARTA).
 * Cumple el NFR: carta < 3 s.
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { ConfigService } from '@nestjs/config';
import { IDIOMAS_SOPORTADOS, IdiomaCode, IDIOMA_DEFAULT } from '@tacamamesa/shared-types';

// Clave de caché por idioma: "carta:es", "carta:en", etc.
const cacheKey = (idioma: string) => `carta:${idioma}`;

@Injectable()
export class CartaService {
  private readonly logger = new Logger(CartaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Retorna la carta completa localizada al idioma solicitado.
   * Si el idioma no está soportado, usa español (RN08).
   * Resultado cacheado en Redis por REDIS_TTL_CARTA segundos.
   */
  async obtenerCarta(idiomaHeader: string): Promise<object[]> {
    // ── 1. Resolver idioma ────────────────────────────────────
    const idioma = this.resolverIdioma(idiomaHeader);

    // ── 2. Revisar caché ──────────────────────────────────────
    const cacheado = await this.redis.get<object[]>(cacheKey(idioma));
    if (cacheado) {
      this.logger.debug(`Carta en caché para idioma: ${idioma}`);
      return cacheado;
    }

    // ── 3. Consultar base de datos ────────────────────────────
    const platos = await this.prisma.plato.findMany({
      include: {
        traducciones: { where: { idioma: idioma as any } },
        alergenos: {
          include: {
            alergeno: { select: { codigo: true, nombreEs: true, nombreEn: true } },
          },
        },
      },
      orderBy: [{ codigoInterno: 'asc' }],
    });

    // ── 4. Mapear y localizar ─────────────────────────────────
    const cartaLocalizada = platos.map((plato) => {
      const trad = plato.traducciones[0]; // traducción al idioma solicitado
      return {
        id:           plato.id,
        codigoInterno: plato.codigoInterno,
        categoria:    plato.categoria,
        // Si no hay traducción, usar español (RN08)
        nombre:       trad?.nombre      ?? plato.nombreEs,
        descripcion:  trad?.descripcion ?? plato.descripcionEs,
        precioBase:   Number(plato.precioBase),
        imagenUrl:    plato.imagenUrl,
        disponible:   plato.disponible,
        tiempoPrep:   plato.tiempoPrep,
        seccion:       plato.seccion,
        esVegetariano: plato.esVegetariano,
        libreLactosa:  plato.libreLactosa,
        picante:       plato.picante,
        estilo:        plato.estilo,
        tags:          plato.tags,
        maridajeTexto: plato.maridajeTexto,
        rol:           plato.rol,
        momentos:      plato.momentos,
        idioma,
        alergenos: plato.alergenos.map((pa) => ({
          codigo:   pa.alergeno.codigo,
          nombre:   idioma === 'en' ? pa.alergeno.nombreEn : pa.alergeno.nombreEs,
          esTrazas: pa.esTrazas,
        })),
      };
    });

    // ── 5. Guardar en caché ───────────────────────────────────
    const ttl = this.config.get<number>('REDIS_TTL_CARTA', 300);
    await this.redis.set(cacheKey(idioma), cartaLocalizada, ttl);
    this.logger.log(`Carta generada en DB para idioma: ${idioma} (${platos.length} platos)`);

    return cartaLocalizada;
  }

  /**
   * ResolverIdioma: extrae el idioma del header Accept-Language.
   * Soportados: es, en, fr, pt, de. Fallback: es (RN08).
   */
  /** Invalida la caché de todos los idiomas (tras un cambio de administración). */
  async invalidar() {
    await this.redis.del(...IDIOMAS_SOPORTADOS.map((i) => cacheKey(i)));
  }

  resolverIdioma(acceptLanguage: string): IdiomaCode {
    if (!acceptLanguage) return IDIOMA_DEFAULT;

    // Accept-Language puede ser "en-US,en;q=0.9,es;q=0.8"
    // Tomamos el primer código de idioma
    const candidatos = acceptLanguage
      .split(',')
      .map((l) => l.split(';')[0].trim().toLowerCase().slice(0, 2));

    for (const c of candidatos) {
      if (IDIOMAS_SOPORTADOS.includes(c as IdiomaCode)) {
        return c as IdiomaCode;
      }
    }

    return IDIOMA_DEFAULT; // RN08: español por defecto
  }
}
