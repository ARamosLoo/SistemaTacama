import { Plato, PerfilComensal, Momento } from '../types';
import { contieneAlergia } from './alergias';

export const PROTEINA_TAGS: Record<string, string[]> = {
  res: ['res'],
  cerdo: ['cerdo'],
  pollo: ['pollo'],
  pescado: ['pescado', 'mariscos'],
  vegetariano: ['vegetariano'],
};

export interface PlatoRecomendado {
  plato: Plato;
  coincidencia: number; // 0-100
}

const sinAlergenos = (p: Plato, alergias: string[]) => !contieneAlergia(p, alergias);
const enMomento = (p: Plato, momento: Momento) => p.momentos.includes(momento.toUpperCase());

// Toda recomendación prioriza la cocina de Ica: un plato iqueño suma el máximo y uno criollo/tradicional, la mitad
const PESO_ICA = 4;
const puntosTradicion = (p: Plato) =>
  p.tags.includes('tradicional_ica') ? PESO_ICA : p.tags.some((t) => t === 'tradicional' || t === 'criollo') ? PESO_ICA / 2 : 0;

/** Puntaje bruto de un plato contra el perfil: proteína 4, estilo 3, intensidad hasta 2, tradición de Ica hasta 4. */
function puntuar(p: Plato, perfil: PerfilComensal, estiloBuscado: string | null) {
  let pts = 0;
  const buscaProteina = perfil.proteinas.filter((x) => x !== 'cualquiera');
  if (buscaProteina.length === 0) pts += 2;
  else if (buscaProteina.some((x) => (PROTEINA_TAGS[x] ?? []).some((t) => p.tags.includes(t)))) pts += 4;

  if (estiloBuscado && p.estilo === estiloBuscado) pts += 3;
  if (perfil.intensidad !== null) {
    const dif = Math.abs(p.picante - perfil.intensidad);
    pts += dif === 0 ? 2 : dif === 1 ? 1 : 0;
  }
  if (perfil.tradicional) pts += puntosTradicion(p);
  const max = 4 + 3 + 2 + (perfil.tradicional ? PESO_ICA : 0);
  return { pts, coincidencia: Math.min(100, Math.round((pts / max) * 100)) };
}

/**
 * Puntúa los platos de la carta según el gusto declarado (bloque "Recomendados para usted").
 * Solo platos del momento elegido (desayuno o almuerzo) con rol de entrada, fondo o desayuno
 * (y postres si busca algo dulce). Excluye platos con alérgenos declarados.
 */
export function recomendarPlatos(
  platos: Plato[],
  perfil: PerfilComensal,
  alergias: string[],
  momento: Momento,
  limite = 6,
): PlatoRecomendado[] {
  const quiereDulce = perfil.estilo === 'dulce';
  const nino = perfil.esNino && momento === 'almuerzo';
  const roles = nino ? ['KIDS', 'KIDS_POSTRE'] : ['ENTRADA', 'FONDO', 'DESAYUNO', ...(quiereDulce ? ['POSTRE'] : [])];

  return platos
    .filter((p) => p.disponible && enMomento(p, momento) && roles.includes(p.rol))
    .filter((p) => sinAlergenos(p, alergias))
    .map((p) => ({ plato: p, coincidencia: puntuar(p, perfil, perfil.estilo).coincidencia }))
    .filter((r) => r.coincidencia >= 40)
    .sort((a, b) => b.coincidencia - a.coincidencia || a.plato.precioPEN - b.plato.precioPEN)
    .slice(0, limite);
}

// Posición en la lista de más solicitados (los que no figuran van al final)
const indicePopular = (p: Plato) => { const i = MAS_SOLICITADOS.indexOf(p.codigo); return i < 0 ? 999 : i; };

/** Cantidad de opciones que se ofrecen por curso (la primera es la mejor). */
export const OPCIONES_POR_CURSO = 3;

export interface MenuRecomendado {
  populares?: boolean; // true: no hay gustos que comparar; se sugieren los más solicitados
  sinFondoVegetariano?: boolean; // vegetariano estricto y la carta no tiene plato de fondo vegetariano
  entrada: PlatoRecomendado[];
  fondo: PlatoRecomendado[]; // en desayuno es el plato principal de desayuno
  postre: PlatoRecomendado[];
  piqueo: PlatoRecomendado[]; // para compartir en la mesa (pizzas, tablas, piqueos); solo almuerzo
}

// Etiquetas de sabor que corresponden a cada opción de entrada y de postre
export const ENTRADA_TAGS: Record<string, string[]> = {
  fresca: ['frío', 'ensalada'],
  crocante: ['frito'],
  cremosa: ['queso'],
  marina: ['mariscos', 'pescado'],
  tradicional: ['tradicional_ica', 'tradicional'],
};
export const POSTRE_TAGS: Record<string, string[]> = {
  chocolate: ['chocolate'],
  cremoso: ['cremoso'],
  frutal: ['frutal', 'caliente'],
  frutos: ['frutos_secos'],
  variado: ['variado'],
};

export const esTradicional = (p: Plato) => p.tags.some((t) => t === 'tradicional' || t === 'tradicional_ica' || t === 'criollo');

/** Puntaje de una entrada o postre contra su propia preferencia (independiente del plato de fondo). */
function puntuarCurso(p: Plato, prefs: string[], mapa: Record<string, string[]>, perfil: PerfilComensal, pesoPref: number, usaIntensidad: boolean) {
  let pts = 0;
  if (prefs.some((k) => (mapa[k] ?? []).some((t) => p.tags.includes(t)))) pts += pesoPref;
  if (usaIntensidad && perfil.intensidad !== null) {
    const dif = Math.abs(p.picante - perfil.intensidad);
    pts += dif === 0 ? 2 : dif === 1 ? 1 : 0;
  }
  if (perfil.tradicional) pts += puntosTradicion(p);
  const max = pesoPref + (usaIntensidad ? 2 : 0) + (perfil.tradicional ? PESO_ICA : 0);
  return { pts, coincidencia: Math.min(100, Math.round((pts / max) * 100)) };
}

/**
 * Arma la recomendación de una comida según el momento del día (hasta 3 opciones por curso, ordenadas de mejor a peor):
 * - Almuerzo: entrada (si la pidió), plato de fondo (rol FONDO) y postre (si lo pidió).
 * - Desayuno: entrada (si la pidió) y plato principal de desayuno (rol DESAYUNO); sin postre.
 * Los sandwiches de desayuno nunca se sugieren como plato de fondo.
 * Entrada y postre se eligen por su propia preferencia de sabor, independiente del principal.
 * Se excluyen platos con alérgenos declarados y, si es vegetariano, los que no lo son.
 */
// Menú kids en el orden en que se ofrece (el helado es el postre kids)
const ORDEN_KIDS = ['TAC-041', 'TAC-042', 'TAC-043'];

/** Niños en el almuerzo: platos y postre del menú kids, sin alérgenos declarados. En desayuno comen de la carta normal. */
function armarMenuKids(platos: Plato[], alergias: string[]): MenuRecomendado {
  const lista = (rol: string) =>
    platos
      .filter((p) => p.disponible && p.rol === rol && sinAlergenos(p, alergias))
      .sort((a, b) => (ORDEN_KIDS.indexOf(a.codigo) + 1 || 99) - (ORDEN_KIDS.indexOf(b.codigo) + 1 || 99))
      .slice(0, OPCIONES_POR_CURSO)
      .map((plato) => ({ plato, coincidencia: 100 }));
  return { entrada: [], fondo: lista('KIDS'), postre: lista('KIDS_POSTRE'), piqueo: [] };
}

export function armarMenuRecomendado(platos: Plato[], perfil: PerfilComensal, alergias: string[], momento: Momento): MenuRecomendado {
  if (perfil.esNino && momento === 'almuerzo') return armarMenuKids(platos, alergias);
  const soloVegetariano =
    perfil.proteinas.includes('vegetariano') && perfil.proteinas.filter((x) => x !== 'cualquiera').length === 1;

  const elegir = (
    rol: string,
    puntuador: (p: Plato) => { pts: number; coincidencia: number },
    excluirCompartir: boolean,
  ): PlatoRecomendado[] => {
    const candidatos = platos
      .filter((p) => p.disponible && p.rol === rol && enMomento(p, momento) && sinAlergenos(p, alergias))
      .filter((p) => !excluirCompartir || !p.tags.includes('compartir')) // platos para varias personas no entran en una comida individual
      .filter((p) => !soloVegetariano || p.esVegetariano)
      .map((p) => ({ plato: p, ...puntuador(p) }))
      // Con igual puntaje se prefiere lo más pedido de la casa y, después, lo más económico
      .sort((a, b) => b.pts - a.pts || (indicePopular(a.plato) - indicePopular(b.plato)) || a.plato.precioPEN - b.plato.precioPEN);
    return candidatos.slice(0, OPCIONES_POR_CURSO).map((c) => ({ plato: c.plato, coincidencia: c.coincidencia }));
  };

  const estiloFondo = perfil.estilo === 'ligero' ? 'ligero' : 'contundente';
  const esDesayuno = momento === 'desayuno';
  const fondo = elegir(esDesayuno ? 'DESAYUNO' : 'FONDO', (p) => puntuar(p, perfil, estiloFondo), true);

  return {
    sinFondoVegetariano: soloVegetariano && fondo.length === 0,
    // El desayuno no lleva entrada
    entrada:
      !esDesayuno && perfil.quiereEntrada === true
        ? elegir('ENTRADA', (p) => puntuarCurso(p, perfil.entradaPref ?? [], ENTRADA_TAGS, perfil, 5, true), true)
        : [],
    fondo,
    postre:
      !esDesayuno && perfil.quierePostre === true
        ? elegir('POSTRE', (p) => puntuarCurso(p, perfil.postrePref ?? [], POSTRE_TAGS, perfil, 6, false), false)
        : [],
    piqueo: esDesayuno ? [] : elegir('PIQUEO', (p) => puntuar(p, perfil, estiloFondo), false),
  };
}

// Platos más solicitados de la casa, de mayor a menor (códigos de la carta). Es el respaldo cuando
// no hay un perfil de gustos con el cual recomendar.
const MAS_SOLICITADOS = [
  'TAC-012', 'TAC-011', 'TAC-013', 'TAC-009', 'TAC-008', 'TAC-019', 'TAC-021', // entradas (tamalito y humita, solo desayuno)
  'TAC-033', 'TAC-024', 'TAC-022', 'TAC-023', 'TAC-025', 'TAC-028', // fondos
  'TAC-057', 'TAC-055', 'TAC-056', 'TAC-058', // postres
  'TAC-051', 'TAC-050', 'TAC-052', // desayunos
  'TAC-010', 'TAC-048', 'TAC-007', 'TAC-046', // piqueos para compartir
];

/** Los más solicitados por curso y momento, sin alérgenos declarados (hasta 3 por curso). */
export function armarMenuPopular(platos: Plato[], alergias: string[], momento: Momento): MenuRecomendado {
  const top = (rol: string): PlatoRecomendado[] =>
    platos
      .filter((p) => p.disponible && p.rol === rol && enMomento(p, momento) && sinAlergenos(p, alergias) && MAS_SOLICITADOS.includes(p.codigo))
      .sort((a, b) => MAS_SOLICITADOS.indexOf(a.codigo) - MAS_SOLICITADOS.indexOf(b.codigo))
      .slice(0, OPCIONES_POR_CURSO)
      .map((plato) => ({ plato, coincidencia: 0 }));
  const esDesayuno = momento === 'desayuno';
  return { populares: true, entrada: esDesayuno ? [] : top('ENTRADA'), fondo: top(esDesayuno ? 'DESAYUNO' : 'FONDO'), postre: esDesayuno ? [] : top('POSTRE'), piqueo: esDesayuno ? [] : top('PIQUEO') };
}
