import type { EtiquetaTacama } from '../types';
import type { ClaveTexto } from './i18n';

type T = (clave: ClaveTexto, vars?: Record<string, string | number>) => string;

/**
 * Aviso de stock para una etiqueta: depende de cuántas botellas quedan y de qué tan rápido se están pidiendo.
 * Devuelve null cuando hay stock de sobra.
 */
export function mensajeStock(e: Pick<EtiquetaTacama, 'nivel' | 'stockActual' | 'minutosRestantes'>, t: T): string | null {
  if (e.nivel === 'AGOTADO' || e.stockActual <= 0) return t('etqAgotada');
  if (e.nivel !== 'CRITICO' && e.nivel !== 'BAJO') return null;
  const base = e.nivel === 'CRITICO' ? t('stockUltimas', { n: e.stockActual }) : t('stockQuedan', { n: e.stockActual });
  const min = e.minutosRestantes;
  if (min === null || min === undefined || min > 180) return base;
  // Redondea a múltiplos de 5 minutos para no mostrar una precisión falsa
  return base + ' · ' + t('stockAgotaEn', { m: Math.max(5, Math.round(min / 5) * 5) });
}
