export interface ComandaCocina {
  id: string;
  codigo: string;
  mesa: string;
  mozo: string;
  estado: 'CONFIRMADA' | 'EN_PREPARACION' | 'LISTA' | 'SERVIDA' | 'ANULADA';
  minutosTranscurridos: number;
  modificadaHaceMin?: number; // el comensal cambió o anuló un plato hace estos minutos
  alergiasMesa: string[];
  requiereAprobacionChef?: boolean; // RN02: platos con alérgenos declarados pendientes de aprobación del chef
  alergenoAprobadoPor?: string;
  observaciones?: string; // por ejemplo "ALERGIA (otras): ..." escrita por el comensal
  items: {
    id: string;
    nombre: string;
    cantidad: number;
    categoria: 'ENTRADA' | 'FONDO' | 'POSTRE' | 'VINO';
    notas?: string;
    alergenos?: string[];
  }[];
}

export interface ComandaMesa {
  id: string;
  codigo: string;
  estado: string; // PENDIENTE | EN_PREPARACION | LISTA | ENTREGADA
  cuentaSolicitada: boolean;
  puntuacion?: number; // calificación del comensal, si la dio
  sinCalificar: boolean; // el comensal prefirió pedir la cuenta sin calificar
  total: number;
  modificadaEn?: string; // el comensal cambió o anuló un plato
  metodoPago?: string; // EFECTIVO | TARJETA | TRANSFERENCIA
  pagaCon?: number; // efectivo: monto con el que pagará
}

export interface MesaStatus {
  id: string;
  numero: number;
  zona: 'Terraza Principal' | 'Jardín de Viñedos' | 'Salón Bodega 1540';
  capacidad: number;
  estado: 'LIBRE' | 'OCUPADA' | 'PIDIENDO_CUENTA' | 'RESERVADA';
  comandaActivaId?: string;
  mozoId?: string; // mozo responsable de la mesa
  comandas?: ComandaMesa[]; // comandas activas de la mesa (estado del backend)
  mozoAsignado?: string;
  tiempoOcupadaMin?: number;
}

export interface ReglaMaridaje {
  id: string;
  platoId: string;
  platoNombre: string;
  etiquetaId: string;
  etiquetaNombre: string;
  linea: string;
  afinidad: number;
  explicacion: string;
  creadoPor: string;
}

export interface IndicadorDashboard {
  tasaVentaCruzada: number;
  totalComandas: number;
  comandasAnuladas: number;
  ventaTotalPEN: number;
  ticketPromedioPEN: number;
  csatPromedio: number;
  totalValoraciones: number;
}
