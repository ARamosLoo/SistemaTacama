/** Pruebas unitarias de inventario: RN06, RN07 (idempotente), RN10 (umbrales) y alertas. */
import { createHmac } from 'crypto';
import { ExistenciasService } from '../src/existencias/existencias.service';
import { ExistenciasController } from '../src/existencias/existencias.controller';

const SECRETO = 'secreto-de-prueba';
const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
function token(rol: string) {
  const h = b64({ alg: 'HS256', typ: 'JWT' }), p = b64({ sub: 'u1', rol, exp: Math.floor(Date.now() / 1000) + 3600 });
  return `Bearer ${h}.${p}.${createHmac('sha256', SECRETO).update(`${h}.${p}`).digest('base64url')}`;
}
const codigoDe = async (p: Promise<unknown>) => { try { await p; return null; } catch (e: any) { return e?.response?.codigo ?? e?.message; } };

function crear() {
  const prisma: any = {
    etiqueta: { findFirst: jest.fn().mockResolvedValue({ id: 'e1' }), update: jest.fn() },
    existencia: { findUnique: jest.fn(), update: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
    movimientoInventario: { create: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
  };
  return { svc: new ExistenciasService(prisma), prisma };
}
const existencia = (stock: number, extra: object = {}) => ({ etiquetaId: 'e1', stockActual: stock, etiqueta: { nombre: 'Blanco', tipo: 'VINO', umbralMinimo: 2, activa: true, ...extra } });

describe('RN06 · descuento de existencias', () => {
  it('descuenta y registra una SALIDA trazable', async () => {
    const { svc, prisma } = crear();
    prisma.existencia.findUnique.mockResolvedValue(existencia(5));
    await svc.descontarStock({ etiquetaId: 'VIN-BL-001', cantidad: 2, comandaId: 'c1', motivo: 'Comanda confirmada' });
    expect(prisma.existencia.update).toHaveBeenCalledWith({ where: { etiquetaId: 'e1' }, data: { stockActual: 3 } });
    expect(prisma.movimientoInventario.create).toHaveBeenCalledWith({ data: expect.objectContaining({ tipo: 'SALIDA', cantidad: -2, comandaId: 'c1' }) });
  });
  it('rechaza si no hay stock suficiente (INV_002)', async () => {
    const { svc, prisma } = crear();
    prisma.existencia.findUnique.mockResolvedValue(existencia(1));
    expect(await codigoDe(svc.descontarStock({ etiquetaId: 'e1', cantidad: 2, comandaId: 'c1', motivo: 'x' }))).toBe('INV_002');
    expect(prisma.existencia.update).not.toHaveBeenCalled();
  });
  it('una etiqueta desconocida se ignora sin romper el flujo', async () => {
    const { svc, prisma } = crear();
    prisma.existencia.findUnique.mockResolvedValue(null);
    await expect(svc.descontarStock({ etiquetaId: 'x', cantidad: 1, comandaId: 'c1', motivo: 'x' })).resolves.toBeUndefined();
  });
});

describe('RN07 · devolución idempotente', () => {
  it('repone lo descontado por la comanda', async () => {
    const { svc, prisma } = crear();
    prisma.movimientoInventario.findMany.mockResolvedValue([{ etiquetaId: 'e1', tipo: 'SALIDA', cantidad: -2 }]);
    await svc.registrarDevolucion({ comandaId: 'c1', motivo: 'Comanda anulada' });
    expect(prisma.existencia.update).toHaveBeenCalledWith({ where: { etiquetaId: 'e1' }, data: { stockActual: { increment: 2 } } });
    expect(prisma.movimientoInventario.create).toHaveBeenCalledWith({ data: expect.objectContaining({ tipo: 'DEVOLUCION', cantidad: 2 }) });
  });
  it('no devuelve dos veces si el evento llega repetido', async () => {
    const { svc, prisma } = crear();
    prisma.movimientoInventario.findMany.mockResolvedValue([
      { etiquetaId: 'e1', tipo: 'SALIDA', cantidad: -2 },
      { etiquetaId: 'e1', tipo: 'DEVOLUCION', cantidad: 2 },
    ]);
    await svc.registrarDevolucion({ comandaId: 'c1', motivo: 'Comanda anulada' });
    expect(prisma.existencia.update).not.toHaveBeenCalled();
  });
  it('descuenta lo que el comensal ya anuló por separado', async () => {
    const { svc, prisma } = crear();
    prisma.movimientoInventario.findMany.mockResolvedValue([
      { etiquetaId: 'e1', tipo: 'SALIDA', cantidad: -3 },
      { etiquetaId: 'e1', tipo: 'ENTRADA', cantidad: 1 },
    ]);
    await svc.registrarDevolucion({ comandaId: 'c1', motivo: 'Comanda anulada' });
    expect(prisma.existencia.update).toHaveBeenCalledWith({ where: { etiquetaId: 'e1' }, data: { stockActual: { increment: 2 } } });
  });
});

describe('Consulta y alertas', () => {
  it('una etiqueta marcada como agotada se informa sin stock', async () => {
    const { svc, prisma } = crear();
    prisma.existencia.findUnique.mockResolvedValue(existencia(7, { activa: false }));
    expect((await svc.consultar('VIN-BL-001')).stockActual).toBe(0);
  });
  it('consultar una etiqueta inexistente da INV_001', async () => {
    const { svc, prisma } = crear();
    prisma.existencia.findUnique.mockResolvedValue(null);
    expect(await codigoDe(svc.consultar('x'))).toBe('INV_001');
  });
  it('el listado marca el nivel de reposición según stock y umbral', async () => {
    const { svc, prisma } = crear();
    const fila = (n: string, stock: number) => ({ etiquetaId: n.toLowerCase(), stockActual: stock, etiqueta: { nombre: n, tipo: 'VINO', umbralMinimo: 5, activa: true, codigoInterno: n } });
    prisma.existencia.findMany.mockResolvedValue([fila('A', 0), fila('B', 1), fila('C', 4), fila('D', 30)]);
    const niveles = Object.fromEntries((await svc.listarTodas()).map((x) => [x.sku, x.nivel]));
    expect(niveles).toEqual({ A: 'AGOTADO', B: 'CRITICO', C: 'BAJO', D: 'OK' });
  });
  it('valida el rango del stock y del umbral', async () => {
    const { svc, prisma } = crear();
    prisma.existencia.findUnique.mockResolvedValue(existencia(5));
    expect(await codigoDe(svc.actualizarEtiqueta('e1', { stockActual: -1 }))).toBe('INV_003');
    expect(await codigoDe(svc.actualizarEtiqueta('e1', { umbralMinimo: 5000 }))).toBe('INV_004');
  });
  it('un ajuste de stock deja un movimiento AJUSTE', async () => {
    const { svc, prisma } = crear();
    prisma.existencia.findUnique.mockResolvedValue(existencia(5));
    await svc.actualizarEtiqueta('e1', { stockActual: 9, motivo: 'Inventario físico' }, 'u1');
    expect(prisma.movimientoInventario.create).toHaveBeenCalledWith({ data: expect.objectContaining({ tipo: 'AJUSTE', cantidad: 4, usuarioId: 'u1' }) });
  });
});

describe('RN10 · umbrales de reposición solo para jefatura', () => {
  beforeEach(() => { process.env.JWT_SECRET = SECRETO; });
  afterAll(() => { delete process.env.JWT_SECRET; });
  const crearControlador = () => {
    const servicio = { actualizarEtiqueta: jest.fn().mockResolvedValue({ ok: true }) };
    return { ctl: new ExistenciasController(servicio as any), servicio };
  };
  it.each(['ALMACEN', 'SOMMELIER'])('%s no puede cambiar el umbral (INV_006)', async (rol) => {
    const { ctl } = crearControlador();
    expect(await codigoDe(ctl.actualizar('VIN-BL-001', { umbralMinimo: 3 }, token(rol)))).toBe('INV_006');
  });
  it.each(['JEFE_SALON', 'ADMINISTRADOR'])('%s sí puede cambiar el umbral', async (rol) => {
    const { ctl, servicio } = crearControlador();
    await ctl.actualizar('VIN-BL-001', { umbralMinimo: 3 }, token(rol));
    expect(servicio.actualizarEtiqueta).toHaveBeenCalled();
  });
  it('almacén sí puede ajustar el stock', async () => {
    const { ctl, servicio } = crearControlador();
    await ctl.actualizar('VIN-BL-001', { stockActual: 10 }, token('ALMACEN'));
    expect(servicio.actualizarEtiqueta).toHaveBeenCalled();
  });
  it('un mozo no puede modificar el stock (INV_005)', async () => {
    const { ctl } = crearControlador();
    expect(await codigoDe(ctl.actualizar('VIN-BL-001', { stockActual: 10 }, token('MOZO')))).toBe('INV_005');
  });
  it('sin sesión se rechaza (INV_005)', async () => {
    const { ctl } = crearControlador();
    expect(await codigoDe(ctl.actualizar('VIN-BL-001', { stockActual: 10 }, undefined))).toBe('INV_005');
  });
});
