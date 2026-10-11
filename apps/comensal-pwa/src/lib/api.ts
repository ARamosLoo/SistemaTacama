// Cliente HTTP mínimo hacia el API Gateway (en desarrollo, proxy de Vite).
const BASE = '/api/v1';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function api<T = any>(
  path: string,
  opts: { method?: string; body?: unknown; idioma?: string; token?: string } = {},
): Promise<T> {
  const metodo = opts.method ?? 'GET';
  // Las lecturas se reintentan ante caídas momentáneas del servicio (red o error 5xx)
  const intentos = metodo === 'GET' ? 4 : 1;

  for (let n = 1; ; n++) {
    try {
      const res = await fetch(`${BASE}${path}`, {
        method: metodo,
        headers: {
          'Content-Type': 'application/json',
          ...(opts.idioma ? { 'Accept-Language': opts.idioma } : {}),
          ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
        },
        body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new ApiError(res.status, json?.mensaje ?? json?.message ?? `HTTP ${res.status}`);
      return json as T;
    } catch (e) {
      const transitorio = !(e instanceof ApiError) || e.status >= 500;
      if (n >= intentos || !transitorio) throw e;
      await esperar(700 * n);
    }
  }
}
