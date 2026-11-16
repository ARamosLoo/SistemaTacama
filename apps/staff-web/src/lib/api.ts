// Cliente HTTP mínimo hacia el API Gateway (en desarrollo, proxy de Vite).
const BASE = '/api/v1';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// Token JWT del personal. Sin "guardar mi cuenta" vive solo en la pestaña (sessionStorage); con esa opción
// también se guarda en el dispositivo (localStorage) hasta que el token venza o se cierre la sesión.
// La contraseña nunca se guarda: eso lo hace, si el usuario lo acepta, el administrador de contraseñas del navegador.
export const TOKEN_KEY = 'tacama.staff.token';
export const USER_KEY = 'tacama.staff.usuario';
export const EMAIL_KEY = 'tacama.staff.email';

const leer = (clave: string): string | null => {
  try { return sessionStorage.getItem(clave) ?? localStorage.getItem(clave); } catch { return null; }
};
export const leerSesion = <U,>(): { token: string; usuario: U } | null => {
  const token = leer(TOKEN_KEY);
  const raw = leer(USER_KEY);
  if (!token || !raw) return null;
  try { return { token, usuario: JSON.parse(raw) as U }; } catch { return null; }
};
export const guardarSesion = (token: string, usuario: { email?: string }, recordar: boolean) => {
  const datos: [string, string][] = [[TOKEN_KEY, token], [USER_KEY, JSON.stringify(usuario)]];
  try {
    for (const [k, v] of datos) sessionStorage.setItem(k, v);
    for (const [k, v] of datos) (recordar ? localStorage.setItem(k, v) : localStorage.removeItem(k));
    if (recordar) localStorage.setItem(EMAIL_KEY, usuario.email ?? '');
    else localStorage.removeItem(EMAIL_KEY);
  } catch { /* almacenamiento no disponible */ }
};
export const borrarSesion = () => {
  // Cada almacén en su propio try: si uno falla, el token no debe quedar vivo en el otro
  for (const almacen of [() => sessionStorage, () => localStorage]) {
    try { for (const k of [TOKEN_KEY, USER_KEY]) almacen().removeItem(k); } catch { /* noop */ }
  }
};
export const emailRecordado = (): string => leer(EMAIL_KEY) ?? '';

const tokenActual = (explicito?: string) => explicito ?? leer(TOKEN_KEY) ?? undefined;

// ── RNF14: acciones del mozo guardadas sin conexión ─────────────
// Si no hay red, la acción (tomar mesa, entregar, cobrar) se guarda en el dispositivo y se envía al volver la conexión.
const CLAVE_COLA = 'tacama.staff.cola';
interface AccionEnCola { path: string; method: string; body?: unknown; creada: string }
const leerColaAcciones = (): AccionEnCola[] => {
  try { return JSON.parse(localStorage.getItem(CLAVE_COLA) ?? '[]') as AccionEnCola[]; } catch { return []; }
};
const guardarColaAcciones = (c: AccionEnCola[]) => { try { localStorage.setItem(CLAVE_COLA, JSON.stringify(c)); } catch { /* sin almacenamiento */ } };
export const pendientesEnCola = () => leerColaAcciones().length;

/** Envía en orden lo que quedó guardado; se detiene si sigue sin haber red. Devuelve cuántas acciones quedan. */
export async function vaciarCola(): Promise<number> {
  let cola = leerColaAcciones();
  while (cola.length > 0) {
    const a = cola[0];
    try {
      await api(a.path, { method: a.method, body: a.body });
    } catch (e) {
      if (!(e instanceof ApiError)) break; // sigue sin red: se conserva
      // El servidor la rechazó (p. ej. la mesa ya cambió de estado): no se reintenta
    }
    cola = cola.slice(1);
    guardarColaAcciones(cola);
  }
  return cola.length;
}

export async function api<T = any>(
  path: string,
  opts: { method?: string; body?: unknown; idioma?: string; token?: string; cola?: boolean } = {},
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method: opts.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(opts.idioma ? { 'Accept-Language': opts.idioma } : {}),
        ...(tokenActual(opts.token) ? { Authorization: `Bearer ${tokenActual(opts.token)}` } : {}),
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
  } catch (e) {
    // Sin red: las acciones del mozo se guardan para enviarlas luego (RNF14)
    if (opts.cola) {
      guardarColaAcciones([...leerColaAcciones(), { path, method: opts.method ?? 'POST', body: opts.body, creada: new Date().toISOString() }]);
      throw new ApiError(0, 'Sin conexión: la acción quedó guardada y se enviará sola al volver la red.');
    }
    throw e;
  }
  const json = await res.json().catch(() => ({}));
  // Token vencido o cuenta desactivada: se cierra la sesión y se vuelve al ingreso
  if (res.status === 401 && tokenActual(opts.token) && path !== '/auth/login') {
    borrarSesion();
    window.location.reload();
  }
  if (!res.ok) throw new ApiError(res.status, json?.mensaje ?? json?.message ?? `HTTP ${res.status}`);
  return json as T;
}

// ── Catálogos compartidos por las pantallas del portal ─────────
export const nombreMesa = (numero: number) => `Mesa ${String(numero).padStart(2, '0')}`;

export const tiempoRelativo = (iso?: string | null) => {
  if (!iso) return '—';
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (min < 1) return 'Hace instantes';
  if (min < 60) return `Hace ${min} min`;
  return `Hace ${Math.round(min / 60)} h`;
};
