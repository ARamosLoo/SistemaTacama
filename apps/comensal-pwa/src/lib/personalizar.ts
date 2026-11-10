import { QUITAR, PERSONALIZABLES, AhorroIngrediente } from './nutricion';
import { nombreIngrediente, idIngredientePorNombreEs } from './ingredientes';

/** Lo que el comensal pide para un plato: ingredientes que se quitan, si es por alergia y un pedido en sus palabras. */
export interface Personalizacion {
  sin: string[];
  sinAlergia: boolean;
  pedido: string;
}
export const SIN_PERSONALIZAR: Personalizacion = { sin: [], sinAlergia: false, pedido: '' };
export const MAX_PEDIDO = 120;

export const esPersonalizable = (codigo?: string) => !!codigo && PERSONALIZABLES.includes(codigo);
export const opcionesDe = (codigo?: string): string[] => (codigo && QUITAR[codigo] ? Object.keys(QUITAR[codigo]) : []);
export const hayPersonalizacion = (p?: Partial<Personalizacion> | null) => !!p && ((p.sin?.length ?? 0) > 0 || !!p.pedido?.trim());

/** Energía y macronutrientes que se descuentan por los ingredientes quitados. */
export function ahorroDe(codigo: string | undefined, sin: string[] | undefined): AhorroIngrediente {
  const total: AhorroIngrediente = { kcal: 0, kj: 0, proteinas: 0, grasas: 0, carbohidratos: 0 };
  if (!codigo || !sin) return total;
  for (const id of sin) {
    const a = QUITAR[codigo]?.[id];
    if (!a) continue;
    total.kcal += a.kcal; total.kj += a.kj; total.proteinas += a.proteinas; total.grasas += a.grasas; total.carbohidratos += a.carbohidratos;
  }
  return total;
}

// Las notas de un ítem son partes separadas por " | " (comensal, alergias, maridaje, SIN, PEDIDO). Los prefijos llevan
// dos puntos para no confundirse con un nombre de comensal ("Sinthia"). La pantalla de cocina de staff-web repite estos
// prefijos (CocinaKdsPage.tsx): si cambian aquí, cambian allá.
const SEPARADOR = ' | ';
export const MAX_NOTAS = 600; // igual que el límite del servidor
const PREFIJO_SIN = 'SIN: ';
const PREFIJO_SIN_ALERGIA = 'SIN (ALERGIA): ';
const PREFIJO_PEDIDO = 'PEDIDO: ';
const parteEsSin = (parte: string) => parte.startsWith(PREFIJO_SIN) || parte.startsWith(PREFIJO_SIN_ALERGIA);
const parteEsPedido = (parte: string) => parte.startsWith(PREFIJO_PEDIDO);
const esParteDePersonalizacion = (parte: string) => parteEsSin(parte) || parteEsPedido(parte);

/** Une partes de nota en una sola cadena: cada parte sin el separador (para no partir una nota en dos) y dentro del límite. */
export const unirNotas = (partes: (string | null | undefined)[]): string =>
  partes
    .map((p) => (p ?? '').replace(/\s*\|\s*/g, ' / ').trim())
    .filter(Boolean)
    .join(SEPARADOR)
    .slice(0, MAX_NOTAS);
const partirNotas = (notas?: string | null): string[] => (notas ?? '').split(SEPARADOR).filter(Boolean);

/** Texto para la cocina (siempre en español): "SIN: cebolla, ají | PEDIDO: poco picante". */
export function notaPersonalizacion(p?: Partial<Personalizacion> | null): string {
  if (!p) return '';
  const partes: string[] = [];
  if (p.sin?.length) partes.push((p.sinAlergia ? PREFIJO_SIN_ALERGIA : PREFIJO_SIN) + p.sin.map((id) => nombreIngrediente(id, 'es')).join(', '));
  if (p.pedido?.trim()) partes.push(PREFIJO_PEDIDO + p.pedido.trim().slice(0, MAX_PEDIDO));
  return unirNotas(partes);
}

/** Las notas de un ítem sin la parte de personalización (queda comensal, alergias, maridaje...). */
export const notasSinPersonalizacion = (notas?: string | null): string => unirNotas(partirNotas(notas).filter((x) => !esParteDePersonalizacion(x)));

/** Lee de las notas de un ítem ya enviado lo que el comensal había pedido, para volver a editarlo. */
export function leerPersonalizacion(notas?: string | null): Personalizacion {
  const out: Personalizacion = { sin: [], sinAlergia: false, pedido: '' };
  for (const parte of partirNotas(notas)) {
    if (parteEsSin(parte)) {
      out.sinAlergia = parte.startsWith(PREFIJO_SIN_ALERGIA);
      const lista = parte.slice(parte.indexOf(':') + 1);
      out.sin = lista.split(',').map((n) => idIngredientePorNombreEs(n)).filter((x): x is string => !!x);
    } else if (parteEsPedido(parte)) {
      out.pedido = parte.slice(PREFIJO_PEDIDO.length).trim();
    }
  }
  return out;
}
