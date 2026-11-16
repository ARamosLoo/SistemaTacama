/** Pruebas unitarias del catálogo: RN08 (idioma), RN10 (precios), RF19 (alérgenos e ingredientes) y verificación del token. */
import { createHmac } from 'crypto';
import { CartaService } from '../src/carta/carta.service';
import { AdminService } from '../src/admin/admin.service';
import { AdminController } from '../src/admin/admin.controller';
import { rolDelToken } from '../src/common/sesion';

const SECRETO = 'secreto-de-prueba';
const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
function token(rol: string, secreto = SECRETO, exp = Math.floor(Date.now() / 1000) + 3600) {
  const h = b64({ alg: 'HS256', typ: 'JWT' }), p = b64({ sub: 'u1', rol, exp });
  return `Bearer ${h}.${p}.${createHmac('sha256', secreto).update(`${h}.${p}`).digest('base64url')}`;
}
const codigoDe = async (p: Promise<unknown>) => { try { await p; return null; } catch (e: any) { return e?.response?.codigo ?? e?.message; } };

describe('RN08 · idioma de la carta', () => {
  const carta = new CartaService({} as any, {} as any, {} as any);
  it.each([
    ['en-US,en;q=0.9', 'en'],
    ['fr-FR', 'fr'],
    ['pt-BR', 'pt'],
    ['de-DE,fr;q=0.8', 'de'],
    ['es-PE', 'es'],
    ['ja,pt;q=0.5', 'pt'],
  ])('Accept-Language "%s" → %s', (cabecera, esperado) => {
    expect(carta.resolverIdioma(cabecera)).toBe(esperado);
  });
  it.each(['ja-JP', 'zh-CN,ko;q=0.8', '', undefined as any])('idioma no soportado (%s) → español', (cabecera) => {
    expect(carta.resolverIdioma(cabecera)).toBe('es');
  });
});

describe('Verificación del token (rolDelToken)', () => {
  beforeEach(() => { process.env.JWT_SECRET = SECRETO; });
  afterAll(() => { delete process.env.JWT_SECRET; });
  it('lee el rol de un token válido', () => expect(rolDelToken(token('JEFE_SALON'))).toBe('JEFE_SALON'));
  it('rechaza firma falsa', () => expect(rolDelToken(token('ADMINISTRADOR', 'otra'))).toBeNull());
  it('rechaza token vencido', () => expect(rolDelToken(token('ADMINISTRADOR', SECRETO, 1))).toBeNull());
  it('rechaza ausencia de token', () => expect(rolDelToken(undefined)).toBeNull());
  it('rechaza un token firmado pero sin vencimiento (exp)', () => {
    const h = b64({ alg: 'HS256', typ: 'JWT' }), p = b64({ sub: 'u1', rol: 'ADMINISTRADOR' });
    expect(rolDelToken(`Bearer ${h}.${p}.${createHmac('sha256', SECRETO).update(`${h}.${p}`).digest('base64url')}`)).toBeNull();
  });
});

describe('RN10 · precios solo para jefe de salón y administrador', () => {
  beforeEach(() => { process.env.JWT_SECRET = SECRETO; });
  afterAll(() => { delete process.env.JWT_SECRET; });
  const crear = () => {
    const admin = { actualizar: jest.fn().mockResolvedValue({}), listar: jest.fn().mockResolvedValue([]), composicion: jest.fn().mockResolvedValue({}), actualizarComposicion: jest.fn().mockResolvedValue({}) };
    return { c: new AdminController(admin as any), admin };
  };
  it.each(['MOZO', 'COCINA', 'SOMMELIER', 'ALMACEN'])('%s no puede cambiar precios (CAT_005)', async (rol) => {
    expect(await codigoDe(crear().c.actualizar('p1', { precioBase: 10 }, token(rol)))).toBe('CAT_005');
  });
  it.each(['JEFE_SALON', 'ADMINISTRADOR'])('%s sí puede', async (rol) => {
    const { c, admin } = crear();
    await c.actualizar('p1', { precioBase: 10 }, token(rol));
    expect(admin.actualizar).toHaveBeenCalledWith('p1', { precioBase: 10 });
  });
  it('un token falsificado no sirve', async () => {
    expect(await codigoDe(crear().c.actualizar('p1', { precioBase: 10 }, token('ADMINISTRADOR', 'falsa')))).toBe('CAT_005');
  });
  it('editar alérgenos e ingredientes también es solo de jefatura', async () => {
    const { c, admin } = crear();
    expect(await codigoDe(c.actualizarComposicion('p1', { alergenos: [] }, token('MOZO')))).toBe('CAT_005');
    await c.actualizarComposicion('p1', { alergenos: ['GLUTEN'] }, token('JEFE_SALON'));
    expect(admin.actualizarComposicion).toHaveBeenCalled();
  });
});

describe('AdminService', () => {
  const plato = { id: 'p1', codigoInterno: 'TAC-001', alergenos: [{ alergeno: { codigo: 'GLUTEN' } }], ingredientes: [{ ingrediente: { nombreEs: 'Ají amarillo' } }] };
  function crear() {
    const prisma: any = {
      plato: { findUnique: jest.fn().mockResolvedValue(plato), update: jest.fn() },
      alergeno: { findMany: jest.fn() },
      platoAlergeno: { deleteMany: jest.fn(), createMany: jest.fn() },
      ingrediente: { upsert: jest.fn().mockImplementation(async ({ where }: any) => ({ id: 'i-' + where.nombreEs })) },
      platoIngrediente: { deleteMany: jest.fn(), createMany: jest.fn() },
      $transaction: jest.fn().mockResolvedValue([]),
    };
    const carta = { invalidar: jest.fn().mockResolvedValue(undefined) };
    return { svc: new AdminService(prisma, carta as any), prisma, carta };
  }
  it('rechaza precios fuera de rango (CAT_002)', async () => {
    const { svc } = crear();
    expect(await codigoDe(svc.actualizar('p1', { precioBase: -1 }))).toBe('CAT_002');
    expect(await codigoDe(svc.actualizar('p1', { precioBase: 9000 }))).toBe('CAT_002');
  });
  it('un cambio de precio invalida la caché de la carta', async () => {
    const { svc, prisma, carta } = crear();
    prisma.plato.update.mockResolvedValue({ codigoInterno: 'TAC-001', precioBase: 12.5 });
    await svc.actualizar('p1', { precioBase: 12.5 });
    expect(carta.invalidar).toHaveBeenCalled();
  });
  it('RF19: lee la composición del plato y el catálogo de alérgenos', async () => {
    const { svc, prisma } = crear();
    prisma.alergeno.findMany.mockResolvedValue([{ codigo: 'GLUTEN', nombreEs: 'Gluten' }, { codigo: 'LACTEOS', nombreEs: 'Lácteos' }]);
    const r = await svc.composicion('p1');
    expect(r.alergenos).toEqual(['GLUTEN']);
    expect(r.ingredientes).toEqual(['Ají amarillo']);
    expect(r.catalogoAlergenos).toHaveLength(2);
  });
  it('RF19: un alérgeno desconocido se rechaza (CAT_006)', async () => {
    const { svc, prisma } = crear();
    prisma.alergeno.findMany.mockResolvedValue([{ id: 'a1', codigo: 'GLUTEN' }]);
    expect(await codigoDe(svc.actualizarComposicion('p1', { alergenos: ['GLUTEN', 'INVENTADO'] }))).toBe('CAT_006');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
  it('RF19: reemplaza alérgenos e ingredientes y refresca la carta', async () => {
    const { svc, prisma, carta } = crear();
    prisma.alergeno.findMany.mockResolvedValue([{ id: 'a1', codigo: 'LACTEOS' }]);
    await svc.actualizarComposicion('p1', { alergenos: ['lacteos'], ingredientes: ['Queso', ' Queso ', 'Pallares', ''] });
    expect(prisma.platoAlergeno.createMany).toHaveBeenCalledWith({ data: [{ platoId: 'p1', alergenoId: 'a1' }] });
    expect(prisma.ingrediente.upsert).toHaveBeenCalledTimes(2);
    expect(prisma.platoIngrediente.createMany).toHaveBeenCalledWith({ data: [{ platoId: 'p1', ingredienteId: 'i-Queso' }, { platoId: 'p1', ingredienteId: 'i-Pallares' }] });
    expect(carta.invalidar).toHaveBeenCalled();
  });
  it('RF19: un plato inexistente da CAT_001', async () => {
    const { svc, prisma } = crear();
    prisma.plato.findUnique.mockResolvedValue(null);
    expect(await codigoDe(svc.composicion('x'))).toBe('CAT_001');
    expect(await codigoDe(svc.actualizarComposicion('x', { alergenos: [] }))).toBe('CAT_001');
  });
});
