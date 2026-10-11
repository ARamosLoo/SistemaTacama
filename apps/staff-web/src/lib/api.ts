// Cliente HTTP mínimo hacia el API Gateway (en desarrollo, proxy de Vite).
const BASE = '/api/v1';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// Token JWT del personal (sesión del navegador)
export const TOKEN_KEY = 'tacama.staff.token';
const tokenActual = (explicito?: string) => {
  if (explicito) return explicito;
  try {
    return sessionStorage.getItem(TOKEN_KEY) ?? undefined;
  } catch {
    return undefined;
  }
};

export async function api<T = any>(
  path: string,
  opts: { method?: string; body?: unknown; idioma?: string; token?: string } = {},
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: opts.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(opts.idioma ? { 'Accept-Language': opts.idioma } : {}),
      ...(tokenActual(opts.token) ? { Authorization: `Bearer ${tokenActual(opts.token)}` } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
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
