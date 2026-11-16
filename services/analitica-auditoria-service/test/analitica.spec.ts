/** Pruebas unitarias de analítica y auditoría: KPIs, CSAT, registro de auditoría y protección RNF15. */
import { IndicadoresService } from '../src/indicadores/indicadores.service';
import { AuditoriaService } from '../src/auditoria/auditoria.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('IndicadoresService', () => {
  const crear = (p: object) => new IndicadoresService(p as any);

  it('KPIs: ventas, ticket promedio y tasa de maridaje agregados en la base de datos', async () => {
    const groupBy = jest.fn().mockResolvedValue([
      { tipo: 'comanda.confirmada', _count: { _all: 2 } },
      { tipo: 'comanda.anulada', _count: { _all: 1 } },
      { tipo: 'maridaje.recomendado', _count: { _all: 4 } },
      { tipo: 'maridaje.aceptado', _count: { _all: 1 } },
    ]);
    const queryRaw = jest.fn().mockResolvedValue([{ total: 150 }]);
    const k = await crear({ eventoNegocio: { groupBy }, $queryRaw: queryRaw }).obtenerKpisGenerales();
    expect(k).toEqual({
      totalComandas: 3, comandasConfirmadas: 2, comandasAnuladas: 1,
      ventaTotalPEN: 150, ticketPromedioPEN: 75,
      maridajesEmitidos: 4, maridajesAceptados: 1, tasaMaridajePorcentaje: 25,
    });
    expect(groupBy).toHaveBeenCalledTimes(1); // una sola consulta de conteo, sin traer los eventos a memoria
  });
  it('KPIs sin datos no divide entre cero', async () => {
    const k = await crear({ eventoNegocio: { groupBy: jest.fn().mockResolvedValue([]) }, $queryRaw: jest.fn().mockResolvedValue([{ total: 0 }]) }).obtenerKpisGenerales();
    expect(k.ticketPromedioPEN).toBe(0);
    expect(k.tasaMaridajePorcentaje).toBe(0);
    expect(k.totalComandas).toBe(0);
  });
  it('CSAT: promedio de las valoraciones registradas', async () => {
    const logs = [{ datosDespues: { puntuacion: 5 } }, { datosDespues: { puntuacion: 4 } }, { datosDespues: {} }];
    const r = await crear({ logAuditoria: { findMany: jest.fn().mockResolvedValue(logs) } }).obtenerCsat();
    expect(r).toMatchObject({ totalValoraciones: 2, csatPromedio: 4.5 });
  });
  it('venta cruzada: tasa de conversión sobre los indicadores diarios', async () => {
    const filas = [
      { fecha: new Date('2026-11-01'), recomendacionesEmitidas: 10, recomendacionesAceptadas: 3, tasaVentaCruzada: 30 },
      { fecha: new Date('2026-11-02'), recomendacionesEmitidas: 10, recomendacionesAceptadas: 5, tasaVentaCruzada: 50 },
    ];
    const r = await crear({ indicadorDiario: { findMany: jest.fn().mockResolvedValue(filas) } }).obtenerVentaCruzada();
    expect(r).toMatchObject({ recomendacionesEmitidas: 20, recomendacionesAceptadas: 8, tasaConversionPorcentaje: 40 });
    expect(r.historico).toHaveLength(2);
  });
  it('registra un evento de negocio', async () => {
    const create = jest.fn();
    await crear({ eventoNegocio: { create } }).registrarEvento('maridaje.recomendado', { platoId: 'p1' });
    expect(create).toHaveBeenCalledWith({ data: { tipo: 'maridaje.recomendado', payload: { platoId: 'p1' }, procesado: true } });
  });
});

describe('AuditoriaService (RF22, RN11)', () => {
  const crear = (p: object) => new AuditoriaService(p as any);
  it('registra el log con usuario, categoría y servicio de origen', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'l1' });
    await crear({ logAuditoria: { create } }).registrar({ entidad: 'Comanda', entidadId: 'c1', accion: 'ANULAR', usuarioId: 'u1', categoria: 'COMANDA', servicio: 'comandas-service' });
    expect(create).toHaveBeenCalledWith({ data: expect.objectContaining({ entidad: 'Comanda', accion: 'ANULAR', usuarioId: 'u1', categoria: 'COMANDA' }) });
  });
  it('propaga el error si no se pudo registrar', async () => {
    await expect(crear({ logAuditoria: { create: jest.fn().mockRejectedValue(new Error('db caída')) } }).registrar({ entidad: 'x', accion: 'y', categoria: 'SISTEMA', servicio: 's' })).rejects.toThrow('db caída');
  });
  it('consulta con filtros, paginación y orden descendente', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const count = jest.fn().mockResolvedValue(0);
    await crear({ logAuditoria: { findMany, count } }).consultar({ entidad: 'Comanda', usuarioId: 'u1', fechaDesde: '2026-11-01', limit: 10, offset: 20 });
    expect(findMany).toHaveBeenCalledWith({
      where: { entidad: 'Comanda', usuarioId: 'u1', timestamp: { gte: new Date('2026-11-01') } },
      orderBy: { timestamp: 'desc' }, take: 10, skip: 20,
    });
  });
  it('el servicio solo ofrece registrar y consultar: no expone modificar ni borrar', () => {
    const metodos = Object.getOwnPropertyNames(Object.getPrototypeOf(crear({}))).filter((m) => m !== 'constructor');
    expect(metodos.some((m) => /actualizar|modificar|editar|eliminar|borrar|delete|update/i.test(m))).toBe(false);
  });
});

describe('RNF15 · protección del log de auditoría en la base de datos', () => {
  it('crea un trigger que impide modificar y borrar antes de 12 meses', async () => {
    const svc = new PrismaService();
    const sql: string[] = [];
    (svc as any).$executeRawUnsafe = jest.fn(async (q: string) => { sql.push(q); return 0; });
    await (svc as any).proteger();
    const todo = sql.join('\n');
    expect(sql).toHaveLength(3);
    expect(todo).toContain("TG_OP = 'UPDATE'");
    expect(todo).toContain("interval '12 months'");
    expect(todo).toContain('BEFORE UPDATE OR DELETE ON analitica.log_auditoria');
  });
  it('en producción, si el trigger no se puede crear, el servicio no arranca (RNF15)', async () => {
    const svc = new PrismaService();
    (svc as any).$executeRawUnsafe = jest.fn().mockRejectedValue(new Error('sin permisos'));
    const antes = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      await expect((svc as any).proteger()).rejects.toThrow('sin permisos');
    } finally {
      process.env.NODE_ENV = antes;
    }
  });
  it('fuera de producción, si la base falla, el servicio sigue arrancando y registra el error', async () => {
    const svc = new PrismaService();
    (svc as any).$executeRawUnsafe = jest.fn().mockRejectedValue(new Error('sin permisos'));
    await expect((svc as any).proteger()).resolves.toBeUndefined();
  });
});
