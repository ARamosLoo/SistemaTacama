export interface Alergeno {
  codigo: string;
  nombre: string;
}

export interface Plato {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  precioPEN: number;
  categoria: 'ENTRADA' | 'FONDO' | 'POSTRE' | 'BEBIDA';
  imagenUrl?: string;
  alergenos: Alergeno[];
  disponible: boolean;
  seccion: string;
  esVegetariano: boolean;
  libreLactosa: boolean;
  picante: number;
  estilo: string | null;
  tags: string[];
  maridajeTexto: string | null;
  rol: string; // ENTRADA | FONDO | DESAYUNO | POSTRE | COMPLEMENTO | KIDS | BEBIDA
  momentos: string[]; // DESAYUNO y/o ALMUERZO
}

export type Momento = 'desayuno' | 'almuerzo';

export type Origen = 'peruano' | 'extranjero';

/** Preferencias de gusto declaradas en la pantalla de bienvenida */
export interface PerfilComensal {
  origen: Origen;
  proteinas: string[]; // res | cerdo | pollo | pescado | vegetariano | cualquiera
  intensidad: 0 | 1 | 2 | null;
  estilo: 'ligero' | 'contundente' | 'dulce' | null;
  tradicional: boolean | null;
  // Entrada y postre se consultan por separado, independientes del plato de fondo
  quiereEntrada: boolean | null;
  entradaPref: string[]; // fresca | crocante | cremosa | marina | tradicional
  quierePostre: boolean | null;
  postrePref: string[]; // chocolate | cremoso | frutal | frutos | variado
  alergiasRespondidas: boolean; // declaró alergias o indicó que no tiene ninguna
  omitido: boolean; // peruano que prefirió ver toda la carta
  esNino?: boolean; // el comensal es un niño: se recomienda del menú kids y sin alcohol
}

export interface EtiquetaTacama {
  id: string; // código interno (VIN-BL-001): identifica la etiqueta en todos los servicios
  nombre: string;
  linea: string;
  tipo: string;
  precioBotellaPEN: number;
  precioCopaPEN?: number;
  stockActual: number;
  notaCata: string;
  maridajeSugerido: string;
  imagenUrl?: string;
  agotado?: boolean; // marcada como agotada o sin stock
  nivel?: 'AGOTADO' | 'CRITICO' | 'BAJO' | 'OK'; // según stock y frecuencia de pedidos
  minutosRestantes?: number | null; // a este ritmo de pedidos, minutos hasta agotarse
}

export interface MaridajeRecomendacion {
  etiquetaId: string;
  nombre: string;
  linea: string;
  tipo: string;
  precioBotellaPEN: number;
  precioCopaPEN?: number;
  stockActual: number;
  explicacionSommelier: string;
  puntuacionAfinidad: number;
}

export interface ItemCarrito {
  id: string;
  tipo: 'PLATO' | 'VINO' | 'PISCO';
  nombre: string;
  precioPEN: number;
  cantidad: number;
  notas?: string;
  alergenos?: string[];
  imagenUrl?: string; // miniatura del ítem en la comanda
  etiquetaId?: string;
  comensalId?: string; // comensal de la mesa para quien se pide el ítem
  lineaId?: string; // identifica la línea del pedido (ítem + comensal)
}

export type EstadoComanda = 'CREADA' | 'CONFIRMADA' | 'EN_PREPARACION' | 'LISTA' | 'SERVIDA' | 'CERRADA' | 'ANULADA';

/** Persona sentada en la mesa: cada una tiene su propio perfil de alergias y gustos. */
export interface Comensal {
  id: string;
  nombre: string; // alias opcional; si está vacío se muestra "Comensal N"
  perfil: PerfilComensal | null;
  alergias: string[]; // códigos de alérgeno declarados por este comensal
}
