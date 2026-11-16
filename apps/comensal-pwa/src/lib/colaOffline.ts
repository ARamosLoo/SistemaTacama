// RNF14: pedido guardado en el dispositivo cuando no hay red; se envía solo al volver la conexión.
const CLAVE = 'tacama.cola.pedido';

export interface PedidoEnCola {
  cuerpo: Record<string, unknown>; // cuerpo de POST /comandas
  codigos: string[]; // alérgenos declarados
  claveComanda: string; // dónde recordar la comanda en este dispositivo
  comandaId?: string; // ya creada en el servidor (por si la red cayó a mitad del envío)
  restriccionesOk?: boolean;
  intentos?: number; // reintentos hechos: pasado un tope se avisa al comensal en vez de insistir sin fin
  creadoEn: string;
}

export const leerCola = (): PedidoEnCola | null => {
  try { const t = localStorage.getItem(CLAVE); return t ? (JSON.parse(t) as PedidoEnCola) : null; } catch { return null; }
};
export const guardarCola = (p: PedidoEnCola) => { try { localStorage.setItem(CLAVE, JSON.stringify(p)); } catch { /* sin almacenamiento */ } };
export const borrarCola = () => { try { localStorage.removeItem(CLAVE); } catch { /* sin almacenamiento */ } };
