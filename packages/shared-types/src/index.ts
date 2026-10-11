// ============================================================
// Tipos de dominio compartidos — TacamaMesa
// Estos tipos son los contratos entre microservicios.
// NO incluir lógica de negocio aquí.
// ============================================================

// ── Roles del personal ──────────────────────────────────────
export enum RolUsuario {
  ANFITRION = 'anfitrion',
  MOZO = 'mozo',
  SOMMELIER = 'sommelier',
  COCINA = 'cocina',
  CAJA = 'caja',
  ALMACEN = 'almacen',
  JEFE_SALON = 'jefe_salon',
  ADMINISTRADOR = 'administrador',
}

// ── Usuario autenticado (payload del JWT) ────────────────────
export interface JwtPayload {
  sub: string;         // ID del usuario
  email: string;
  rol: RolUsuario;
  iat?: number;
  exp?: number;
}

// ── Token de mesa (QR comensal) ──────────────────────────────
export interface TokenMesaPayload {
  mesaId: string;
  codigoQR: string;
  tipo: 'mesa';
  iat?: number;
  exp?: number;
}

// ── Estados de una comanda ────────────────────────────────────
export enum EstadoComanda {
  BORRADOR = 'borrador',
  PENDIENTE = 'pendiente',      // enviada a cocina
  EN_PREPARACION = 'en_preparacion',
  LISTA = 'lista',
  ENTREGADA = 'entregada',
  ANULADA = 'anulada',
}

// ── Idiomas soportados (RN08) ────────────────────────────────
export type IdiomaCode = 'es' | 'en' | 'fr' | 'pt' | 'de';
export const IDIOMA_DEFAULT: IdiomaCode = 'es';
export const IDIOMAS_SOPORTADOS: IdiomaCode[] = ['es', 'en', 'fr', 'pt', 'de'];

// ── Tipos de movimiento de inventario ─────────────────────────
export enum TipoMovimiento {
  ENTRADA = 'entrada',
  SALIDA = 'salida',
  AJUSTE = 'ajuste',
  DEVOLUCION = 'devolucion',
}

// ── Eventos de RabbitMQ ───────────────────────────────────────
export interface EventoComandaConfirmada {
  tipo: 'comanda.confirmada';
  comandaId: string;
  mesaId: string;
  items: Array<{
    platoId: string;
    cantidad: number;
    etiquetaId?: string;  // vino/pisco seleccionado
  }>;
  timestamp: string;
}

export interface EventoComandaAnulada {
  tipo: 'comanda.anulada';
  comandaId: string;
  mesaId: string;
  motivo: string;
  timestamp: string;
}

export interface EventoStockBajo {
  tipo: 'inventario.stock_bajo';
  etiquetaId: string;
  nombreEtiqueta: string;
  stockActual: number;
  umbralMinimo: number;
  timestamp: string;
}

export type EventoTacama =
  | EventoComandaConfirmada
  | EventoComandaAnulada
  | EventoStockBajo;

// ── Respuesta estándar de la API ──────────────────────────────
export interface ApiResponse<T> {
  data: T;
  meta?: {
    total?: number;
    pagina?: number;
    porPagina?: number;
  };
}

export interface ApiError {
  statusCode: number;
  error: string;
  mensaje: string;
  timestamp: string;
  path: string;
}
