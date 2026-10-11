import type { Plato, PerfilComensal } from '../types';
import type { ClaveTexto } from './i18n';
import { PROTEINA_TAGS, ENTRADA_TAGS, POSTRE_TAGS, esTradicional } from './recomendar';

/** Un motivo de recomendación: clave de texto + variables (literales o claves de texto a traducir). */
export interface Motivo {
  k: ClaveTexto;
  /** variables que son claves de texto (se traducen) */
  vt?: Record<string, ClaveTexto>;
  /** variables literales */
  v?: Record<string, string | number>;
}

const ETIQ_ENTRADA: Record<string, ClaveTexto> = { fresca: 'eFresca', crocante: 'eCrocante', cremosa: 'eCremosa', marina: 'eMarina', tradicional: 'eTradicional' };
const ETIQ_POSTRE: Record<string, ClaveTexto> = { chocolate: 'pChocolate', cremoso: 'pCremoso', frutal: 'pFrutal', frutos: 'pFrutos', variado: 'pVariado' };
const INTENSIDAD: ClaveTexto[] = ['suave', 'moderado', 'intenso'];

/**
 * Por qué se recomienda un plato: cada motivo corresponde a algo que el comensal indicó
 * (proteína, estilo, intensidad, cocina tradicional, tipo de entrada o de postre) y que el plato cumple.
 * Si no hay gustos que comparar, el motivo es que es de los más pedidos; para niños, que es del menú kids.
 */
export function motivosDeRecomendacion(
  plato: Plato,
  curso: 'entrada' | 'fondo' | 'postre' | 'piqueo',
  perfil: PerfilComensal | null,
  ctx: { populares: boolean; esNino: boolean; alergias?: string[] },
): Motivo[] {
  // Los platos recomendados nunca llevan los alérgenos declarados: se dice expresamente
  const seguro: Motivo[] = ctx.alergias?.length ? [{ k: 'motivoSinAlergenos' as ClaveTexto, v: { a: ctx.alergias.join(', ') } }] : [];
  if (ctx.esNino) return [{ k: 'motivoKids' as ClaveTexto }, ...seguro].slice(0, 3);
  if (!perfil) return [{ k: 'motivoPopular' as ClaveTexto }, ...seguro];
  // Sin gustos que comparar (omitió las preguntas) o sin coincidencias: se explica por qué se muestra lo más pedido
  if (perfil.omitido) return [{ k: 'motivoPopularOmitido' as ClaveTexto }, ...seguro];
  if (ctx.populares) return [{ k: 'motivoPopularSinCoincidencia' as ClaveTexto }, ...seguro];

  const out: Motivo[] = [];
  if (curso === 'piqueo') out.push({ k: 'motivoPiqueo' });

  if (curso === 'entrada') {
    const tipo = (perfil.entradaPref ?? []).find((x) => (ENTRADA_TAGS[x] ?? []).some((t) => plato.tags.includes(t)));
    if (tipo) out.push({ k: 'motivoEntrada', vt: { e: ETIQ_ENTRADA[tipo] } });
  } else if (curso === 'postre') {
    const tipo = (perfil.postrePref ?? []).find((x) => (POSTRE_TAGS[x] ?? []).some((t) => plato.tags.includes(t)));
    if (tipo) out.push({ k: 'motivoPostre', vt: { e: ETIQ_POSTRE[tipo] } });
  } else {
    const prot = perfil.proteinas.filter((x) => x !== 'cualquiera').find((x) => (PROTEINA_TAGS[x] ?? []).some((t) => plato.tags.includes(t)));
    if (prot) out.push({ k: 'motivoProteina', vt: { p: prot as ClaveTexto } });
    if (curso === 'fondo' && perfil.estilo && plato.estilo === perfil.estilo) out.push({ k: 'motivoEstilo', vt: { e: perfil.estilo } });
  }
  if (curso !== 'postre' && perfil.intensidad !== null && plato.picante === perfil.intensidad) {
    out.push({ k: 'motivoIntensidad', vt: { i: INTENSIDAD[perfil.intensidad] } });
  }
  if (perfil.tradicional && esTradicional(plato)) out.push({ k: 'motivoTradicional' });

  const sinMotivo: Motivo[] = curso === 'fondo' ? [{ k: 'motivoGenerico' as ClaveTexto }] : [{ k: 'motivoPopularSimple' as ClaveTexto }];
  return [...(out.length ? out : sinMotivo), ...seguro].slice(0, 4);
}
