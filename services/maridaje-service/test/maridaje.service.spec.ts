/** Pruebas unitarias de maridaje: RN03, RN04, RN05, RN13, RF07, RF08, RF09. */
import { createHmac } from 'crypto';
import axios from 'axios';
import { MaridajeService } from '../src/maridaje/maridaje.service';
import { MaridajeController } from '../src/maridaje/maridaje.controller';
import { ReglaService } from '../src/reglas/regla.service';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

const SECRETO = 'secreto-de-prueba';
const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
function token(rol: string) {
  const h = b64({ alg: 'HS256', typ: 'JWT' }), p = b64({ sub: 'u1', rol, exp: Math.floor(Date.now() / 1000) + 3600 });
  return `Bearer ${h}.${p}.${createHmac('sha256', SECRETO).update(`${h}.${p}`).digest('base64url')}`;
}
const codigoDe = async (p: Promise<unknown>) => { try { await p; return null; } catch (e: any) { return e?.response?.codigo ?? e?.message; } };

const regla = (codigo: string, puntaje: number, rango: string, segmento: string | null = null) => ({
  id: 'r-' + codigo, puntaje, motivo: 'motivo ' + codigo, segmento,
  etiqueta: { id: 'id-' + codigo, codigoInterno: codigo, nombre: 'Vino ' + codigo, tipo: 'VINO_TINTO', cepa: null, descripcionEs: 'd', precioLista: 100, rangoPrecio: rango, imagenUrl: null },
});

function crear(reglas: any[], stock: Record<string, number>) {
  const prisma: any = {
    reglaMaridaje: { findMany: jest.fn().mockResolvedValue(reglas), findUnique: jest.fn(), findFirst: jest.fn() },
    etiqueta: { findFirst: jest.fn() },
    recomendacion: { create: jest.fn(), groupBy: jest.fn() },
  };
  const redis: any = { get: jest.fn().mockResolvedValue(null), set: jest.fn(), del: jest.fn() };
  const config: any = { get: jest.fn((_k: string, d: any) => d) };
  axiosMock.post.mockResolvedValue({} as any);
  axiosMock.get.mockImplementation(async (_u: string, o: any) => ({ data: { data: { stockActual: stock[o.params.etiqueta] ?? 0 } } }) as any);
  return { svc: new MaridajeService(prisma, redis, config), prisma, redis };
}
const codigos = (r: any[]) => r.map((x) => x.codigoInterno);

describe('Recomendación de maridaje', () => {
  it('RN03: nunca sugiere etiquetas sin existencia', async () => {
    const { svc } = crear([regla('A', 9, 'ALTO'), regla('B', 8, 'MEDIO'), regla('C', 7, 'BAJO')], { A: 0, B: 4, C: 2 });
    expect(codigos((await svc.recomendar('p1')) as any[])).toEqual(['B', 'C']);
  });
  it('devuelve como máximo 3 etiquetas, ordenadas por puntaje', async () => {
    const { svc } = crear([regla('A', 9, 'ALTO'), regla('B', 8, 'MEDIO'), regla('C', 7, 'BAJO'), regla('D', 6, 'BAJO')], { A: 5, B: 5, C: 5, D: 5 });
    expect(codigos((await svc.recomendar('p1')) as any[])).toEqual(['A', 'B', 'C']);
  });
  it('RN05: si las 3 primeras son del mismo rango, entra una de otro rango', async () => {
    const { svc } = crear([regla('A', 9, 'ALTO'), regla('B', 8, 'ALTO'), regla('C', 7, 'ALTO'), regla('D', 6, 'BAJO')], { A: 5, B: 5, C: 5, D: 5 });
    const r = (await svc.recomendar('p1')) as any[];
    expect(codigos(r)).toEqual(['A', 'B', 'D']);
    expect(new Set(r.map((x) => x.rangoPrecio)).size).toBeGreaterThan(1);
  });
  it('RN05: si no existe otro rango, igual responde', async () => {
    const { svc } = crear([regla('A', 9, 'ALTO'), regla('B', 8, 'ALTO')], { A: 5, B: 5 });
    expect(codigos((await svc.recomendar('p1')) as any[])).toEqual(['A', 'B']);
  });
  it('RN13: aplica las reglas sin segmento y las del segmento del comensal', async () => {
    const reglas = [regla('A', 9, 'ALTO'), regla('B', 8, 'MEDIO', 'EXTRANJERO'), regla('C', 7, 'BAJO', 'NACIONAL')];
    const stock = { A: 5, B: 5, C: 5 };
    expect(codigos((await crear(reglas, stock).svc.recomendar('p1', 'EXTRANJERO')) as any[])).toEqual(['A', 'B']);
    expect(codigos((await crear(reglas, stock).svc.recomendar('p1', 'nacional')) as any[])).toEqual(['A', 'C']);
  });
  it('RN13: el segmento no cambia los precios de las etiquetas', async () => {
    const reglas = [regla('A', 9, 'ALTO')];
    const nac = (await crear(reglas, { A: 5 }).svc.recomendar('p1', 'NACIONAL')) as any[];
    const ext = (await crear(reglas, { A: 5 }).svc.recomendar('p1', 'EXTRANJERO')) as any[];
    expect(nac[0].precioLista).toBe(ext[0].precioLista);
  });
  it('sin reglas vigentes devuelve una lista vacía', async () => {
    const { svc } = crear([], {});
    expect(await svc.recomendar('p1')).toEqual([]);
  });
  it('usa el caché de reglas pero consulta el stock siempre', async () => {
    const { svc, redis, prisma } = crear([regla('A', 9, 'ALTO')], { A: 5 });
    redis.get.mockResolvedValue([regla('A', 9, 'ALTO')]);
    await svc.recomendar('p1');
    expect(prisma.reglaMaridaje.findMany).not.toHaveBeenCalled();
    expect(axiosMock.get).toHaveBeenCalled();
  });
});

describe('RF08 · respuesta del comensal', () => {
  it('registra aceptada, modificada o rechazada', async () => {
    const { svc, prisma } = crear([], {});
    prisma.reglaMaridaje.findUnique.mockResolvedValue({ id: 'r1', etiquetaId: 'e1' });
    await svc.registrarRespuesta('r1', 's1', 'RECHAZADA');
    expect(prisma.recomendacion.create).toHaveBeenCalledWith({ data: expect.objectContaining({ respuesta: 'RECHAZADA', aceptada: false, etiquetaId: 'e1' }) });
    await svc.registrarRespuesta('r1', 's1', 'ACEPTADA');
    expect(prisma.recomendacion.create).toHaveBeenLastCalledWith({ data: expect.objectContaining({ respuesta: 'ACEPTADA', aceptada: true }) });
  });
  it('regla inexistente da MAR_001', async () => {
    const { svc, prisma } = crear([], {});
    prisma.reglaMaridaje.findUnique.mockResolvedValue(null);
    expect(await codigoDe(svc.registrarRespuesta('x', 's1', 'ACEPTADA'))).toBe('MAR_001');
  });
  it('resume las respuestas', async () => {
    const { svc, prisma } = crear([], {});
    prisma.recomendacion.groupBy.mockResolvedValue([{ respuesta: 'ACEPTADA', _count: { _all: 3 } }, { respuesta: 'RECHAZADA', _count: { _all: 1 } }]);
    expect(await svc.resumenRespuestas()).toEqual({ total: 4, porRespuesta: { ACEPTADA: 3, RECHAZADA: 1 } });
  });
});

describe('RF09 · guion de apoyo para el mozo', () => {
  const etiqueta = { id: 'e1', codigoInterno: 'VIN-BL-001', nombre: 'Gran Tinto', cepa: 'Malbec', anada: 2019, descripcionEs: 'Intenso y frutal', notasDegust: 'Frutos rojos', maridajeGeneral: 'Carnes', precioLista: 120, rangoPrecio: 'ALTO' };
  it('arma frase y argumentos de venta, con el motivo de la regla si existe', async () => {
    const { svc, prisma } = crear([], {});
    prisma.etiqueta.findFirst.mockResolvedValue(etiqueta);
    prisma.reglaMaridaje.findFirst.mockResolvedValue({ motivo: 'El tanino equilibra la grasa' });
    const g = await svc.guion('VIN-BL-001', 'TAC-010');
    expect(g.frase).toContain('Gran Tinto');
    expect(g.argumentos.join(' ')).toContain('El tanino equilibra la grasa');
    expect(g.argumentos.join(' ')).toContain('S/ 120.00');
  });
  it('etiqueta inexistente da MAR_003', async () => {
    const { svc, prisma } = crear([], {});
    prisma.etiqueta.findFirst.mockResolvedValue(null);
    expect(await codigoDe(svc.guion('x'))).toBe('MAR_003');
  });
});

describe('RN04 y RF07 · reglas solo del sommelier', () => {
  beforeEach(() => { process.env.JWT_SECRET = SECRETO; });
  afterAll(() => { delete process.env.JWT_SECRET; });
  const dto = { platoId: 'p1', etiquetaId: 'e1', puntaje: 8 };
  const controlador = () => {
    const reglaSvc = { crear: jest.fn().mockResolvedValue({ id: 'r1' }), actualizar: jest.fn().mockResolvedValue({}), findAll: jest.fn().mockResolvedValue([]) };
    const maridaje = { resumenRespuestas: jest.fn().mockResolvedValue({}) };
    return { c: new MaridajeController(maridaje as any, reglaSvc as any), reglaSvc };
  };
  it.each(['MOZO', 'ADMINISTRADOR', 'JEFE_SALON', 'COCINA', 'ALMACEN'])('%s no puede crear reglas (MAR_005)', async (rol) => {
    expect(await codigoDe(controlador().c.crearRegla(dto, token(rol)))).toBe('MAR_005');
  });
  it('sin sesión tampoco', async () => {
    expect(await codigoDe(controlador().c.crearRegla(dto, undefined))).toBe('MAR_005');
  });
  it('el sommelier crea y queda registrado como autor', async () => {
    const { c, reglaSvc } = controlador();
    await c.crearRegla(dto, token('SOMMELIER'));
    expect(reglaSvc.crear).toHaveBeenCalledWith(dto, 'u1');
  });
  it('el sommelier edita y desactiva; otros roles no', async () => {
    const { c, reglaSvc } = controlador();
    await c.actualizarRegla('r1', { activa: false }, token('SOMMELIER'));
    expect(reglaSvc.actualizar).toHaveBeenCalledWith('r1', { activa: false });
    expect(await codigoDe(c.actualizarRegla('r1', { activa: false }, token('MOZO')))).toBe('MAR_005');
  });
  it('listar reglas y ver el resumen también es solo del sommelier', async () => {
    const { c } = controlador();
    expect(await codigoDe(c.getReglas(token('MOZO')))).toBe('MAR_005');
    expect(await codigoDe(c.resumenRespuestas(token('MOZO')))).toBe('MAR_005');
    await expect(c.getReglas(token('SOMMELIER'))).resolves.toBeDefined();
  });
});

describe('ReglaService', () => {
  const crearRegla = () => {
    const prisma: any = { reglaMaridaje: { findUnique: jest.fn(), create: jest.fn().mockResolvedValue({ id: 'r1' }), update: jest.fn().mockResolvedValue({}) } };
    const redis: any = { del: jest.fn() };
    return { svc: new ReglaService(prisma, redis), prisma, redis };
  };
  it('rechaza una regla duplicada (MAR_002)', async () => {
    const { svc, prisma } = crearRegla();
    prisma.reglaMaridaje.findUnique.mockResolvedValue({ id: 'x' });
    expect(await codigoDe(svc.crear({ platoId: 'p1', etiquetaId: 'e1', puntaje: 5 }))).toBe('MAR_002');
  });
  it('al crear invalida el caché con la misma clave que usa la recomendación', async () => {
    const { svc, prisma, redis } = crearRegla();
    prisma.reglaMaridaje.findUnique.mockResolvedValue(null);
    await svc.crear({ platoId: 'p1', etiquetaId: 'e1', puntaje: 5, segmento: 'EXTRANJERO' }, 'u1');
    expect(redis.del).toHaveBeenCalledWith('maridaje:reglas:p1');
    expect(prisma.reglaMaridaje.create).toHaveBeenCalledWith({ data: expect.objectContaining({ creadaPor: 'u1', segmento: 'EXTRANJERO' }) });
  });
  it('actualizar una regla inexistente da MAR_001; si existe invalida el caché de su plato', async () => {
    const { svc, prisma, redis } = crearRegla();
    prisma.reglaMaridaje.findUnique.mockResolvedValueOnce(null);
    expect(await codigoDe(svc.actualizar('x', { activa: false }))).toBe('MAR_001');
    prisma.reglaMaridaje.findUnique.mockResolvedValueOnce({ id: 'r1', platoId: 'p9' });
    await svc.actualizar('r1', { activa: false, vigenciaHasta: '2027-01-01' });
    expect(redis.del).toHaveBeenCalledWith('maridaje:reglas:p9');
    expect(prisma.reglaMaridaje.update).toHaveBeenCalledWith({ where: { id: 'r1' }, data: expect.objectContaining({ activa: false, vigenciaHasta: new Date('2027-01-01') }) });
  });
});
