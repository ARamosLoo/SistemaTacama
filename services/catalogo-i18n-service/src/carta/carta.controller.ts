/**
 * carta.controller.ts
 * GET /api/v1/carta          → carta según Accept-Language
 * GET /api/v1/platos/:id     → detalle de un plato
 */

import { Controller, Get, Param, Headers, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CartaService } from './carta.service';
import { PlatosService } from '../platos/platos.service';

@ApiTags('carta')
@Controller()
export class CartaController {
  constructor(
    private readonly cartaService: CartaService,
    private readonly platosService: PlatosService,
  ) {}

  /**
   * GET /api/v1/carta
   * Retorna la carta completa localizada según el idioma del navegador.
   * Header Accept-Language: en, fr, pt, de → traducido; otro → español (RN08)
   */
  @Get('carta')
  @ApiOperation({
    summary: 'Obtener carta localizada',
    description:
      'Devuelve todos los platos disponibles en el idioma del navegador ' +
      '(Accept-Language). Español por defecto si el idioma no está soportado (RN08). ' +
      'Resultado cacheado en Redis por 5 minutos.',
  })
  @ApiHeader({
    name: 'Accept-Language',
    description: 'Idioma deseado: es | en | fr | pt | de',
    example: 'en-US,en;q=0.9',
    required: false,
  })
  @ApiResponse({ status: 200, description: 'Lista de platos localizada' })
  async getCarta(@Headers('accept-language') acceptLanguage: string) {
    const carta = await this.cartaService.obtenerCarta(acceptLanguage ?? 'es');
    return { data: carta };
  }

  /**
   * GET /api/v1/platos/:id
   * Retorna el detalle completo de un plato con ingredientes y alérgenos.
   */
  @Get('platos/:id')
  @ApiTags('platos')
  @ApiOperation({ summary: 'Detalle de un plato', description: 'Incluye ingredientes, alérgenos y glosario de insumos peruanos.' })
  @ApiParam({ name: 'id', description: 'UUID del plato' })
  @ApiResponse({ status: 200, description: 'Detalle del plato' })
  @ApiResponse({ status: 404, description: 'Plato no encontrado' })
  async getPlato(
    @Param('id') id: string,
    @Headers('accept-language') acceptLanguage: string,
  ) {
    const idioma = this.cartaService.resolverIdioma(acceptLanguage ?? 'es');
    const plato  = await this.platosService.findById(id, idioma);

    if (!plato) {
      throw new NotFoundException({
        mensaje: 'El plato solicitado no existe en la carta',
        codigo: 'CAT_001',
      });
    }

    return { data: plato };
  }
}
