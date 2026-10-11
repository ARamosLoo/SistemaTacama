import { EtiquetaTacama } from '../types';

/** Imagen de un vino o pisco: la foto de la etiqueta si existe; si no, la ilustración de su tipo. */
export const fotoEtiqueta = (e: Pick<EtiquetaTacama, 'tipo' | 'imagenUrl'>): string =>
  e.imagenUrl || '/platos/ilu_' + e.tipo.toLowerCase() + '.jpg';

/** Las imágenes de ilustración (prefijo ilu_) y las referenciales (ref_) se rotulan como tales. */
export const rotuloFoto = (url?: string): 'fotoIlu' | 'fotoRef' | null =>
  url?.includes('/ilu_') ? 'fotoIlu' : url?.includes('/ref_') ? 'fotoRef' : null;
