/**
 * platos.service.ts — Detalle de un plato con glosario de ingredientes.
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IdiomaCode } from '@tacamamesa/shared-types';

@Injectable()
export class PlatosService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string, idioma: IdiomaCode) {
    const plato = await this.prisma.plato.findUnique({
      where: { id },
      include: {
        traducciones:  { where: { idioma: idioma as any } },
        ingredientes: {
          include: {
            ingrediente: {
              select: {
                id: true, nombreEs: true, esPeru: true,
                glosarioEs: true, glosarioEn: true,
                glosarioFr: true, glosarioPt: true, glosarioDe: true,
              },
            },
          },
        },
        alergenos: {
          include: { alergeno: true },
        },
      },
    });

    if (!plato) return null;

    const trad = plato.traducciones[0];

    // Mapear glosario según idioma
    const glosarioCampo: Record<IdiomaCode, string> = {
      es: 'glosarioEs', en: 'glosarioEn', fr: 'glosarioFr',
      pt: 'glosarioPt', de: 'glosarioDe',
    };

    return {
      id:           plato.id,
      codigoInterno: plato.codigoInterno,
      categoria:    plato.categoria,
      nombre:       trad?.nombre      ?? plato.nombreEs,
      descripcion:  trad?.descripcion ?? plato.descripcionEs,
      precioBase:   Number(plato.precioBase),
      imagenUrl:    plato.imagenUrl,
      tiempoPrep:   plato.tiempoPrep,
      idioma,
      ingredientes: plato.ingredientes.map(({ ingrediente, esOpcional, cantidad }) => ({
        id:        ingrediente.id,
        nombre:    ingrediente.nombreEs,
        esOpcional,
        cantidad,
        esPeru:    ingrediente.esPeru,
        // Glosario en el idioma solicitado; fallback a español
        glosario: (ingrediente as Record<string, string | boolean | null>)[glosarioCampo[idioma]]
                  ?? ingrediente.glosarioEs,
      })),
      alergenos: plato.alergenos.map(({ alergeno, esTrazas }) => ({
        codigo:   alergeno.codigo,
        nombre:   idioma === 'en' ? alergeno.nombreEn : alergeno.nombreEs,
        esTrazas,
      })),
    };
  }
}
