/**
 * public.decorator.ts — Marca un endpoint como público (sin JWT).
 * Uso: @Public() sobre el método del controlador.
 */

import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
