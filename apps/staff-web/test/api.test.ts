/** Pruebas unitarias del portal del personal: cliente HTTP y cola de acciones del mozo sin conexión (RNF14). */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { api, ApiError, pendientesEnCola, vaciarCola, guardarSesion, borrarSesion } from '../src/lib/api';

const respuesta = (status: number, cuerpo: unknown = {}) => ({ ok: status >= 200 && status < 300, status, json: async () => cuerpo }) as Response;

beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });
afterEach(() => vi.unstubAllGlobals());

describe('api()', () => {
  it('envía el token del personal en Authorization', async () => {
    const f = vi.fn().mockResolvedValue(respuesta(200, { data: 1 }));
    vi.stubGlobal('fetch', f);
    guardarSesion('tok123', { email: 'a@b.pe' }, false);
    await api('/comandas');
    expect(f.mock.calls[0][1].headers.Authorization).toBe('Bearer tok123');
    borrarSesion();
  });
  it('un error del servidor se convierte en ApiError con su mensaje', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respuesta(403, { mensaje: 'Solo jefatura' })));
    await expect(api('/x', { method: 'POST' })).rejects.toMatchObject({ status: 403, message: 'Solo jefatura' });
  });
  it('sin red y sin cola, el error de red se propaga', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(api('/x', { method: 'POST' })).rejects.toBeInstanceOf(TypeError);
    expect(pendientesEnCola()).toBe(0);
  });
});

describe('RNF14 · acciones del mozo sin conexión', () => {
  it('sin red, una acción con cola se guarda y avisa con un error claro', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(api('/comandas/c1/atender', { method: 'POST', cola: true })).rejects.toMatchObject({ status: 0 });
    expect(pendientesEnCola()).toBe(1);
  });
  it('al volver la red se envían en orden y la cola queda vacía', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await api('/comandas/c1/atender', { method: 'POST', cola: true }).catch(() => undefined);
    await api('/comandas/c1', { method: 'PATCH', body: { estado: 'ENTREGADA' }, cola: true }).catch(() => undefined);
    expect(pendientesEnCola()).toBe(2);

    const f = vi.fn().mockResolvedValue(respuesta(200, {}));
    vi.stubGlobal('fetch', f);
    expect(await vaciarCola()).toBe(0);
    expect(f.mock.calls.map((c) => `${c[1].method} ${c[0]}`)).toEqual(['POST /api/v1/comandas/c1/atender', 'PATCH /api/v1/comandas/c1']);
    expect(pendientesEnCola()).toBe(0);
  });
  it('si sigue sin red, conserva las acciones pendientes', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await api('/comandas/c1/cerrar', { method: 'POST', cola: true }).catch(() => undefined);
    expect(await vaciarCola()).toBe(1);
    expect(pendientesEnCola()).toBe(1);
  });
  it('si el servidor rechaza una acción guardada, se descarta y se sigue con la siguiente', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await api('/comandas/c1/cerrar', { method: 'POST', cola: true }).catch(() => undefined);
    await api('/comandas/c2/cerrar', { method: 'POST', cola: true }).catch(() => undefined);
    const f = vi.fn().mockResolvedValueOnce(respuesta(403, { mensaje: 'ya cambió' })).mockResolvedValueOnce(respuesta(200, {}));
    vi.stubGlobal('fetch', f);
    expect(await vaciarCola()).toBe(0);
    expect(f).toHaveBeenCalledTimes(2);
  });
  it('un ApiError conserva su estado HTTP', () => {
    expect(new ApiError(409, 'x').status).toBe(409);
  });
});
