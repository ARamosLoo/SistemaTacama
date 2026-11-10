import type { Plato } from '../types';

/**
 * Alergias que el comensal escribe con sus palabras ("Otros"): se guardan en la misma lista de alergias como
 * "OTRO:<texto>", una entrada por palabra. Sirven de límite de la recomendación: se excluyen los platos que
 * nombran esa palabra (en el nombre, la descripción o las etiquetas) y no se ofrece el gusto que la contiene.
 * Es una coincidencia por texto, no un análisis de ingredientes: la cocina siempre recibe el aviso.
 */
export const PREFIJO_OTRO = 'OTRO:';
export const MAX_OTROS = 6;
export const MAX_LARGO_OTRO = 40;

export const esOtro = (codigo: string) => codigo.startsWith(PREFIJO_OTRO);
export const textoDeOtro = (codigo: string) => codigo.slice(PREFIJO_OTRO.length);
export const textosOtros = (alergias: string[]) => alergias.filter(esOtro).map(textoDeOtro);
export const soloCodigosDeAlergeno = (alergias: string[]) => alergias.filter((c) => !esOtro(c));

/** Minúsculas y sin tildes, para comparar "maní" con "mani". */
export const normalizar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** Convierte lo que el comensal escribió ("maní, kiwi; ají", "maní y kiwi") en entradas de la lista de alergias. */
export const otrosDesdeTexto = (crudo: string): string[] => {
  const vistos = new Set<string>();
  const out: string[] = [];
  for (const parte of crudo.split(/[,;\n]|\s+y\s+|\s+e\s+|\s+and\s+/i)) {
    const t = parte.trim().replace(/\s+/g, ' ').slice(0, MAX_LARGO_OTRO);
    const k = normalizar(t);
    if (t.length < 2 || vistos.has(k)) continue;
    vistos.add(k);
    out.push(PREFIJO_OTRO + t);
    if (out.length >= MAX_OTROS) break;
  }
  return out;
};

// ── Comparación de palabras: sin tildes, con z=c (nuez/nueces), singular y plural ──
const canon = (s: string) => normalizar(s).replace(/z/g, 'c');
const palabrasDe = (s: string) => canon(s).split(/[^a-zñ]+/).filter(Boolean);
/** Quita el plural simple ("ajíes" y "ajis" quedan como "aji"; "camarones" como "camaron"). */
const singular = (p: string) => (p.length > 4 && p.endsWith('es') ? p.slice(0, -2) : p.length > 3 && p.endsWith('s') ? p.slice(0, -1) : p);

/** ¿Es la misma palabra, o una variante de ella (plural, o la raíz de otra más larga como "camaron" y "camaronero")? */
const mismaPalabra = (a: string, b: string): boolean => {
  const x = singular(a);
  const y = singular(b);
  if (x === y) return true;
  const corta = x.length <= y.length ? x : y;
  const larga = x.length <= y.length ? y : x;
  return corta.length >= 5 && larga.startsWith(corta);
};

/** ¿Menciona el texto la alergia escrita? Todas las palabras de lo escrito deben aparecer en el texto. */
const menciona = (texto: string, escrito: string): boolean => {
  const buscadas = palabrasDe(escrito);
  if (buscadas.length === 0 || buscadas.join('').length < 2) return false;
  const delTexto = palabrasDe(texto);
  return buscadas.every((p) => delTexto.some((w) => mismaPalabra(w, p)));
};

/** Platos o ítems que nombran alguna de las palabras escritas: devuelve las entradas "OTRO:…" que coinciden. */
export const otrosQueCoinciden = (texto: string, alergias: string[]): string[] =>
  alergias.filter((c) => esOtro(c) && menciona(texto, textoDeOtro(c)));

const textoDePlato = (p: Plato) => `${p.nombre} ${p.descripcion} ${p.tags.join(' ')}`;

/** Códigos de alergia (estándar y "Otros") con los que choca un plato. */
export function conflictosDe(p: Plato, alergias: string[]): string[] {
  const estandar = p.alergenos.map((a) => a.codigo).filter((c) => alergias.includes(c));
  return [...estandar, ...otrosQueCoinciden(textoDePlato(p), alergias)];
}

export const contieneAlergia = (p: Plato, alergias: string[]) => conflictosDe(p, alergias).length > 0;

// Palabras que identifican cada gusto de proteína
const PALABRAS_DE_PROTEINA: Record<string, string[]> = {
  res: ['res', 'vacuno', 'vaca', 'lomo'],
  cerdo: ['cerdo', 'chancho', 'puerco', 'porcino', 'tocino', 'panceta'],
  pollo: ['pollo', 'gallina', 'ave'],
  pescado: ['pescado', 'marisco', 'mariscos', 'camaron', 'langostino', 'pulpo', 'calamar', 'pota', 'concha', 'crustaceo', 'choro'],
};

/** ¿La alergia declarada impide ofrecer este gusto ("¿Qué le gusta comer?")? Compara palabras completas. */
export function excluyeProteina(clave: string, alergias: string[]): boolean {
  if (clave === 'pescado' && (alergias.includes('PESCADO') || alergias.includes('MARISCOS'))) return true;
  const palabras = PALABRAS_DE_PROTEINA[clave];
  if (!palabras) return false;
  return textosOtros(alergias).some((t) => palabrasDe(t).some((p) => palabras.some((w) => mismaPalabra(p, canon(w)))));
}
