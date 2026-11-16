/**
 * Pruebas unitarias de ComandasService: reglas RN01, RN02, RN03, RN07, RN09, RN11, RN12, RNF11
 * y flujo de servicio y cierre. Prisma, RabbitMQ y el gateway se simulan.
 */
import { ComandasService, VENTANA_CAMBIO_MS } from '../src/comandas/comandas.service';

function crearServicio() {
  const prisma: any = {
    comanda: { findUnique: jest.fn(), findFirst: jest.fn().mockResolvedValue(null), findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
    restriccionAlergeno: { create: jest.fn(), deleteMany: jest.fn().mockResolvedValue({ count: 2 }) },
    detalleComanda: { delete: jest.fn(), update: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
    $transaction: jest.fn(async (ops: Promise<unknown>[]) => Promise.all(ops)),
  };
  const mq = { publicar: jest.fn().mockResolvedValue(undefined) };
  const gateway = { emitirNuevaComanda: jest.fn(), emitirCambioEstado: jest.fn() };
  return { svc: new ComandasService(prisma, mq as any, gateway as any), prisma, mq, gateway };
}
const codigoDe = async (p: Promise<unknown>) => {
  try { await p; return null; } catch (e: any) { return e?.response?.codigo ?? e?.message; }
};
const item = (extra: object = {}) => ({ platoId: 'p1', platoNombre: 'Lomo', cantidad: 1, precioUnit: 30, ...extra });

describe('RN01 · declaración de alergias antes de cocina', () => {
  it('rechaza confirmar una comanda sin declaración (CMD_002)', async () => {
    const { svc, prisma } = crearServicio();
    prisma.comanda.findUnique.mockResolvedValue({ id: 'c1', alergiasDeclaradas: false, estado: 'BORRADOR', items: [], restricciones: [] });
    expect(await codigoDe(svc.confirmar('c1'))).toBe('CMD_002');
  });

  it('confirma cuando ya declaró, publica el evento y avisa a cocina', async () => {
    const { svc, prisma, mq, gateway } = crearServicio();
    prisma.comanda.findUnique.mockResolvedValue({ id: 'c1', alergiasDeclaradas: true, estado: 'BORRADOR', items: [item()], restricciones: [{ alergenos: ['GLUTEN'] }] });
    prisma.comanda.update.mockResolvedValue({ id: 'c1', mesaId: 'm1', totalPEN: 30, items: [item()] });
    await svc.confirmar('c1');
    expect(mq.publicar).toHaveBeenCalledWith('comanda.confirmada', expect.objectContaining({ comandaId: 'c1' }));
    expect(gateway.emitirNuevaComanda).toHaveBeenCalledWith(expect.objectContaining({ tieneAlerta: true }));
  });

  it('solo se puede declarar alergias en BORRADOR (CMD_003)', async () => {
    const { svc, prisma } = crearServicio();
    prisma.comanda.findUnique.mockResolvedValue({ id: 'c1', estado: 'PENDIENTE' });
    expect(await codigoDe(svc.registrarRestricciones('c1', [], true))).toBe('CMD_003');
  });
});

describe('RN09 · consentimiento de datos de salud', () => {
  it('acepta la declaración sin consentimiento y la guarda solo para la comanda (consentimiento=false)', async () => {
    const { svc, prisma } = crearServicio();
    prisma.comanda.findUnique.mockResolvedValue({ id: 'c1', estado: 'BORRADOR' });
    await svc.registrarRestricciones('c1', ['GLUTEN'], false);
    expect(prisma.restriccionAlergeno.create).toHaveBeenCalledWith({ data: expect.objectContaining({ comandaId: 'c1', consentimiento: false }) });
    expect(prisma.restriccionAlergeno.deleteMany).toHaveBeenCalledWith({ where: { comandaId: 'c1' } }); // un reintento reemplaza, no duplica
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.comanda.update).toHaveBeenCalledWith({ where: { id: 'c1' }, data: { alergiasDeclaradas: true } });
  });
});

describe('RN12 · bebidas alcohólicas solo para mayores de edad', () => {
  it('rechaza vino o pisco sin declarar mayoría de edad (CMD_020)', async () => {
    const { svc } = crearServicio();
    expect(await codigoDe(svc.crear({ mesaId: 'm1', sesionMesaId: 's', items: [item({ etiquetaId: 'VIN-BL-001' })] }))).toBe('CMD_020');
  });
  it('rechaza coctelería marcada como alcohol sin declarar mayoría de edad (CMD_020)', async () => {
    const { svc } = crearServicio();
    expect(await codigoDe(svc.crear({ mesaId: 'm1', sesionMesaId: 's', items: [item({ esAlcohol: true })] }))).toBe('CMD_020');
  });
  it('acepta alcohol con la declaración de mayoría de edad', async () => {
    const { svc, prisma } = crearServicio();
    prisma.comanda.create.mockResolvedValue({ id: 'c1', items: [] });
    await svc.crear({ mesaId: 'm1', sesionMesaId: 's', mayorEdad: true, items: [item({ etiquetaId: 'VIN-BL-001' })] });
    expect(prisma.comanda.create).toHaveBeenCalled();
  });
  it('un pedido sin alcohol no exige la declaración', async () => {
    const { svc, prisma } = crearServicio();
    prisma.comanda.create.mockResolvedValue({ id: 'c1', items: [] });
    await svc.crear({ mesaId: 'm1', sesionMesaId: 's', items: [item()] });
    expect(prisma.comanda.create).toHaveBeenCalled();
  });
});

describe('RN02 · platos con alérgenos declarados', () => {
  it('exige la confirmación expresa del comensal (CMD_021)', async () => {
    const { svc } = crearServicio();
    expect(await codigoDe(svc.crear({ mesaId: 'm1', sesionMesaId: 's', items: [item()], conflictosAlergeno: ['GLUTEN'] }))).toBe('CMD_021');
  });
  it('con la confirmación guarda el conflicto en la comanda', async () => {
    const { svc, prisma } = crearServicio();
    prisma.comanda.create.mockResolvedValue({ id: 'c1', items: [] });
    await svc.crear({ mesaId: 'm1', sesionMesaId: 's', items: [item()], conflictosAlergeno: ['GLUTEN', 'LACTEOS', 'GLUTEN'], confirmaConflicto: true });
    expect(prisma.comanda.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ conflictoAlergeno: 'GLUTEN,LACTEOS', conflictoConfirmadoComensal: true }),
      include: { items: true },
    });
  });
  it('cocina no puede preparar sin la aprobación del chef (CMD_022)', async () => {
    const { svc, prisma } = crearServicio();
    prisma.comanda.findUnique.mockResolvedValue({ id: 'c1', estado: 'PENDIENTE', conflictoAlergeno: 'GLUTEN', alergenoAprobadoEn: null });
    expect(await codigoDe(svc.cambiarEstado('c1', 'EN_PREPARACION'))).toBe('CMD_022');
  });
  it('tras la aprobación del chef se puede preparar', async () => {
    const { svc, prisma, gateway } = crearServicio();
    prisma.comanda.findUnique.mockResolvedValue({ id: 'c1', estado: 'PENDIENTE', conflictoAlergeno: 'GLUTEN', alergenoAprobadoEn: new Date() });
    prisma.comanda.update.mockResolvedValue({ id: 'c1', estado: 'EN_PREPARACION' });
    await svc.cambiarEstado('c1', 'EN_PREPARACION');
    expect(gateway.emitirCambioEstado).toHaveBeenCalledWith('c1', 'EN_PREPARACION');
  });
  it('el chef aprueba y queda registrado en auditoría', async () => {
    const { svc, prisma, mq } = crearServicio();
    prisma.comanda.findUnique.mockResolvedValue({ id: 'c1', mesaId: 'm1', conflictoAlergeno: 'GLUTEN', alergenoAprobadoEn: null });
    prisma.comanda.update.mockResolvedValue({ id: 'c1' });
    await svc.aprobarAlergenos('c1', { id: 'u1', rol: 'COCINA', nombre: 'Chef Luis' });
    expect(prisma.comanda.update).toHaveBeenCalledWith({ where: { id: 'c1' }, data: expect.objectContaining({ alergenoAprobadoPor: 'Chef Luis' }) });
    expect(mq.publicar).toHaveBeenCalledWith('comanda.alergeno-aprobado', expect.objectContaining({ usuario: 'Chef Luis', rol: 'COCINA' }));
  });
  it('aprobar es idempotente y no repite el registro', async () => {
    const { svc, prisma, mq } = crearServicio();
    prisma.comanda.findUnique.mockResolvedValue({ id: 'c1', conflictoAlergeno: 'GLUTEN', alergenoAprobadoEn: new Date() });
    await svc.aprobarAlergenos('c1', { id: 'u1', rol: 'COCINA', nombre: 'Chef' });
    expect(prisma.comanda.update).not.toHaveBeenCalled();
    expect(mq.publicar).not.toHaveBeenCalled();
  });
  it('no hay nada que aprobar si la comanda no tiene conflicto (CMD_024)', async () => {
    const { svc, prisma } = crearServicio();
    prisma.comanda.findUnique.mockResolvedValue({ id: 'c1', conflictoAlergeno: null });
    expect(await codigoDe(svc.aprobarAlergenos('c1', { id: 'u1', rol: 'COCINA', nombre: 'Chef' }))).toBe('CMD_024');
  });
});

describe('RN03 · existencias al confirmar', () => {
  const comandaConVino = { id: 'c1', alergiasDeclaradas: true, estado: 'BORRADOR', restricciones: [], items: [item({ etiquetaId: 'VIN-BL-001', etiquetaNombre: 'Blanco', cantidad: 2 })] };
  const stockDe = (n: number) => jest.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { stockActual: n } }) });
  afterEach(() => { delete (global as any).fetch; });

  it('rechaza si ya no alcanza la existencia (CMD_023)', async () => {
    const { svc, prisma } = crearServicio();
    (global as any).fetch = stockDe(1);
    prisma.comanda.findUnique.mockResolvedValue(comandaConVino);
    expect(await codigoDe(svc.confirmar('c1'))).toBe('CMD_023');
  });
  it('confirma si hay existencia suficiente', async () => {
    const { svc, prisma, mq } = crearServicio();
    (global as any).fetch = stockDe(5);
    prisma.comanda.findUnique.mockResolvedValue(comandaConVino);
    prisma.comanda.update.mockResolvedValue({ id: 'c1', mesaId: 'm1', totalPEN: 1, items: comandaConVino.items });
    await svc.confirmar('c1');
    expect(mq.publicar).toHaveBeenCalledWith('comanda.confirmada', expect.anything());
  });
  it('si el inventario no responde no bloquea el pedido', async () => {
    const { svc, prisma, mq } = crearServicio();
    (global as any).fetch = jest.fn().mockRejectedValue(new Error('sin red'));
    prisma.comanda.findUnique.mockResolvedValue(comandaConVino);
    prisma.comanda.update.mockResolvedValue({ id: 'c1', mesaId: 'm1', totalPEN: 1, items: comandaConVino.items });
    await svc.confirmar('c1');
    expect(mq.publicar).toHaveBeenCalledWith('comanda.confirmada', expect.anything());
  });
  it('registra la aceptación de un maridaje sugerido (venta cruzada)', async () => {
    const { svc, prisma, mq } = crearServicio();
    (global as any).fetch = stockDe(9);
    const items = [item({ etiquetaId: 'VIN-BL-001', notas: 'Maridaje sugerido para Lomo' })];
    prisma.comanda.findUnique.mockResolvedValue({ ...comandaConVino, items });
    prisma.comanda.update.mockResolvedValue({ id: 'c1', mesaId: 'm1', totalPEN: 1, items });
    await svc.confirmar('c1');
    expect(mq.publicar).toHaveBeenCalledWith('maridaje.aceptado', expect.objectContaining({ etiquetaId: 'VIN-BL-001' }));
  });
});

describe('RN07 y RN11 · anulación y modificaciones', () => {
  it('anular una comanda enviada publica la anulación (revierte stock) y deja auditoría con usuario y motivo', async () => {
    const { svc, prisma, mq } = crearServicio();
    prisma.comanda.findUnique.mockResolvedValue({ id: 'c1', mesaId: 'm1', estado: 'PENDIENTE' });
    prisma.comanda.update.mockResolvedValue({ id: 'c1', estado: 'ANULADA' });
    await svc.anular('c1', 'Pedido equivocado', { id: 'u1', rol: 'MOZO', nombre: 'Mozo Uno' });
    expect(mq.publicar).toHaveBeenCalledWith('comanda.anulada', expect.objectContaining({ comandaId: 'c1', motivo: 'Pedido equivocado' }));
    expect(mq.publicar).toHaveBeenCalledWith('comanda.modificada', expect.objectContaining({ accion: 'ANULACION', motivo: 'Pedido equivocado', usuario: 'Mozo Uno', rol: 'MOZO' }));
  });
  it('un borrador se anula sin registrar modificación', async () => {
    const { svc, prisma, mq } = crearServicio();
    prisma.comanda.findUnique.mockResolvedValue({ id: 'c1', mesaId: 'm1', estado: 'BORRADOR' });
    prisma.comanda.update.mockResolvedValue({ id: 'c1' });
    await svc.anular('c1', 'cancelado');
    expect(mq.publicar).not.toHaveBeenCalledWith('comanda.modificada', expect.anything());
  });
  it('no se puede anular una comanda ya entregada (CMD_003)', async () => {
    const { svc, prisma } = crearServicio();
    prisma.comanda.findUnique.mockResolvedValue({ id: 'c1', estado: 'ENTREGADA' });
    expect(await codigoDe(svc.anular('c1', 'x'))).toBe('CMD_003');
  });
  it('pasados los 5 minutos no se puede anular un plato (CMD_016)', async () => {
    const { svc, prisma } = crearServicio();
    prisma.comanda.findUnique.mockResolvedValue({ id: 'c1', estado: 'PENDIENTE', confirmadaEn: new Date(Date.now() - VENTANA_CAMBIO_MS - 1000), items: [{ id: 'i1' }, { id: 'i2' }] });
    expect(await codigoDe(svc.anularItem('c1', 'i1'))).toBe('CMD_016');
  });
  it('anular un plato de vino devuelve su stock y queda registrado con el actor', async () => {
    const { svc, prisma, mq } = crearServicio();
    (global as any).fetch = jest.fn().mockResolvedValue({ ok: true });
    const items = [
      { id: 'a', subtotal: 100, etiquetaId: 'VIN-BL-001', cantidad: 1, platoNombre: 'Blanco' },
      { id: 'b', subtotal: 30, cantidad: 1, platoNombre: 'Lomo' },
    ];
    prisma.comanda.findUnique.mockResolvedValue({ id: 'c1', mesaId: 'm1', estado: 'PENDIENTE', confirmadaEn: new Date(), items });
    prisma.comanda.update.mockResolvedValue({ id: 'c1', items: [items[1]] });
    await svc.anularItem('c1', 'a', null);
    expect(prisma.detalleComanda.delete).toHaveBeenCalledWith({ where: { id: 'a' } });
    expect((global as any).fetch).toHaveBeenCalledWith(expect.stringContaining('/existencias/movimientos'), expect.objectContaining({ method: 'POST' }));
    expect(mq.publicar).toHaveBeenCalledWith('comanda.modificada', expect.objectContaining({ accion: 'ANULACION_ITEM', usuario: 'Comensal (mesa)' }));
    delete (global as any).fetch;
  });
  it('personalizar un plato conserva el aviso de alergia y registra la modificación', async () => {
    const { svc, prisma, mq } = crearServicio();
    const items = [{ id: 'a', platoNombre: 'Lomo', notas: 'ALERGIA: Gluten | SIN: ají' }];
    prisma.comanda.findUnique.mockResolvedValue({ id: 'c1', mesaId: 'm1', estado: 'PENDIENTE', confirmadaEn: new Date(), items });
    prisma.comanda.update.mockResolvedValue({ id: 'c1', items });
    await svc.personalizarItem('c1', 'a', 'SIN: cebolla', null);
    expect(prisma.detalleComanda.update).toHaveBeenCalledWith({ where: { id: 'a' }, data: { notas: 'ALERGIA: Gluten | SIN: cebolla' } });
    expect(mq.publicar).toHaveBeenCalledWith('comanda.modificada', expect.objectContaining({ accion: 'PERSONALIZACION_ITEM' }));
  });
});

describe('Flujo de servicio y cierre', () => {
  it('las transiciones de estado inválidas se rechazan (CMD_005)', async () => {
    const { svc, prisma } = crearServicio();
    prisma.comanda.findUnique.mockResolvedValue({ id: 'c1', estado: 'PENDIENTE', conflictoAlergeno: null });
    expect(await codigoDe(svc.cambiarEstado('c1', 'LISTA'))).toBe('CMD_005');
  });
  it('no se pide la cuenta antes de la entrega (CMD_006)', async () => {
    const { svc, prisma } = crearServicio();
    prisma.comanda.findUnique.mockResolvedValue({ id: 'c1', estado: 'LISTA', items: [], valoracion: null });
    expect(await codigoDe(svc.solicitarCuenta('c1', true, 'TARJETA'))).toBe('CMD_006');
  });
  it('exige calificar o declarar que prefiere no hacerlo (CMD_007)', async () => {
    const { svc, prisma } = crearServicio();
    prisma.comanda.findUnique.mockResolvedValue({ id: 'c1', estado: 'ENTREGADA', items: [], valoracion: null });
    expect(await codigoDe(svc.solicitarCuenta('c1', false, 'TARJETA'))).toBe('CMD_007');
  });
  it('el efectivo declarado debe cubrir el total (CMD_012)', async () => {
    const { svc, prisma } = crearServicio();
    prisma.comanda.findUnique.mockResolvedValue({ id: 'c1', estado: 'ENTREGADA', valoracion: { id: 'v' }, items: [{ subtotal: 50 }] });
    expect(await codigoDe(svc.solicitarCuenta('c1', false, 'EFECTIVO', 20))).toBe('CMD_012');
  });
  it('pide la cuenta entregada y calificada, y avisa al salón', async () => {
    const { svc, prisma, gateway } = crearServicio();
    prisma.comanda.findUnique.mockResolvedValue({ id: 'c1', estado: 'ENTREGADA', valoracion: { id: 'v' }, items: [{ subtotal: 50 }] });
    prisma.comanda.update.mockResolvedValue({ id: 'c1' });
    await svc.solicitarCuenta('c1', false, 'EFECTIVO', 60);
    expect(gateway.emitirCambioEstado).toHaveBeenCalledWith('c1', 'CUENTA_SOLICITADA');
  });
  it('el mozo no cierra si el comensal no pidió la cuenta (CMD_010)', async () => {
    const { svc, prisma } = crearServicio();
    prisma.comanda.findUnique.mockResolvedValue({ id: 'c1', cuentaSolicitadaEn: null });
    expect(await codigoDe(svc.cerrar('c1'))).toBe('CMD_010');
  });
  it('un mozo solo actúa sobre las mesas que tomó (CMD_014)', async () => {
    const { svc, prisma } = crearServicio();
    prisma.comanda.findUnique.mockResolvedValue({ id: 'c1', mozoId: 'otro', mozoNombre: 'Otro' });
    expect(await codigoDe(svc.exigirResponsable('c1', { id: 'u1', rol: 'MOZO', nombre: 'Yo' }))).toBe('CMD_014');
  });
  it('la jefatura no tiene esa restricción', async () => {
    const { svc } = crearServicio();
    await expect(svc.exigirResponsable('c1', { id: 'u1', rol: 'JEFE_SALON', nombre: 'Jefe' })).resolves.toBeUndefined();
  });
  it('otro mozo no puede quitarle la mesa (CMD_014) pero la jefatura sí', async () => {
    const { svc, prisma } = crearServicio();
    prisma.comanda.findUnique.mockResolvedValue({ id: 'c1', mesaId: 'm1', estado: 'ENTREGADA' });
    prisma.comanda.findMany.mockResolvedValue([{ id: 'c1', mozoId: 'otro', mozoNombre: 'Otro' }]);
    prisma.comanda.updateMany = jest.fn();
    expect(await codigoDe(svc.atenderMesa('c1', { id: 'u1', rol: 'MOZO', nombre: 'Yo' }))).toBe('CMD_014');
    await expect(svc.atenderMesa('c1', { id: 'u2', rol: 'JEFE_SALON', nombre: 'Jefe' })).resolves.toMatchObject({ mozoId: 'u2' });
  });
});

describe('RNF11 · eliminación de datos de salud', () => {
  const cerrada = (extra: object = {}) => ({
    id: 'c1', mesaId: 'm1', sesionMesaId: 'ses-1', estado: 'CERRADA', observaciones: 'ALERGIA (otras): kiwi',
    items: [{ id: 'a', notas: 'ALERGIA: Gluten | SIN: cebolla' }], ...extra,
  });

  it('no se eliminan mientras el pedido está en preparación (CMD_025)', async () => {
    const { svc, prisma } = crearServicio();
    prisma.comanda.findUnique.mockResolvedValue(cerrada({ estado: 'EN_PREPARACION' }));
    expect(await codigoDe(svc.eliminarDatosSalud('c1', 'ses-1'))).toBe('CMD_025');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
  it('un borrador tampoco: quitar el aviso saltaría la aprobación del chef (RN02)', async () => {
    const { svc, prisma } = crearServicio();
    prisma.comanda.findUnique.mockResolvedValue(cerrada({ estado: 'BORRADOR', conflictoAlergeno: 'GLUTEN' }));
    expect(await codigoDe(svc.eliminarDatosSalud('c1', 'ses-1'))).toBe('CMD_025');
    expect(prisma.comanda.update).not.toHaveBeenCalled();
  });
  it('sin la sesión de la mesa se rechaza (CMD_026)', async () => {
    const { svc, prisma } = crearServicio();
    prisma.comanda.findUnique.mockResolvedValue(cerrada());
    expect(await codigoDe(svc.eliminarDatosSalud('c1'))).toBe('CMD_026');
    expect(await codigoDe(svc.eliminarDatosSalud('c1', 'sesion-de-otra-mesa'))).toBe('CMD_026');
    expect(await codigoDe(svc.eliminarDatosSalud('c1', 'ses-1', { id: 'u', rol: 'MOZO', nombre: 'Mozo' }))).toBeNull();
  });
  it('la jefatura puede pedirlo sin la sesión de la mesa', async () => {
    const { svc, prisma } = crearServicio();
    prisma.comanda.findUnique.mockResolvedValue(cerrada());
    await expect(svc.eliminarDatosSalud('c1', undefined, { id: 'u', rol: 'JEFE_SALON', nombre: 'Jefe' })).resolves.toMatchObject({ registrosEliminados: 2 });
  });
  it('al cerrar el servicio borra las restricciones y limpia los avisos, todo en una transacción', async () => {
    const { svc, prisma, mq } = crearServicio();
    prisma.comanda.findUnique.mockResolvedValue(cerrada());
    const r = await svc.eliminarDatosSalud('c1', 'ses-1');
    expect(r.registrosEliminados).toBe(2);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.detalleComanda.update).toHaveBeenCalledWith({ where: { id: 'a' }, data: { notas: 'SIN: cebolla' } });
    expect(prisma.comanda.update).toHaveBeenCalledWith({ where: { id: 'c1' }, data: { observaciones: null, conflictoAlergeno: null } });
    expect(mq.publicar).toHaveBeenCalledWith('comanda.datos-eliminados', expect.objectContaining({ registros: 2, usuario: 'Comensal (mesa)' }));
  });
});

describe('Reintentos del pedido (idempotencia, RNF14)', () => {
  it('crear con la misma clave devuelve la comanda ya creada y no crea otra', async () => {
    const { svc, prisma } = crearServicio();
    prisma.comanda.findUnique.mockResolvedValue({ id: 'c-previa', items: [] });
    const r = await svc.crear({ mesaId: 'm1', sesionMesaId: 's', items: [item()], claveIdempotencia: 'clave-1' });
    expect(r.id).toBe('c-previa');
    expect(prisma.comanda.create).not.toHaveBeenCalled();
  });
  it('con una clave nueva sí crea la comanda y la guarda con su clave', async () => {
    const { svc, prisma } = crearServicio();
    prisma.comanda.findUnique.mockResolvedValue(null);
    prisma.comanda.create.mockResolvedValue({ id: 'c1', items: [] });
    await svc.crear({ mesaId: 'm1', sesionMesaId: 's', items: [item()], claveIdempotencia: 'clave-2' });
    expect(prisma.comanda.create).toHaveBeenCalledWith({ data: expect.objectContaining({ claveIdempotencia: 'clave-2' }), include: { items: true } });
  });
  it('confirmar una comanda que ya estaba confirmada la devuelve sin repetir ni publicar', async () => {
    const { svc, prisma, mq } = crearServicio();
    prisma.comanda.findUnique.mockResolvedValue({ id: 'c1', estado: 'EN_PREPARACION', confirmadaEn: new Date(), items: [], restricciones: [] });
    const r = await svc.confirmar('c1');
    expect(r.id).toBe('c1');
    expect(prisma.comanda.update).not.toHaveBeenCalled();
    expect(mq.publicar).not.toHaveBeenCalled();
  });
  it('una comanda anulada no se puede confirmar de nuevo', async () => {
    const { svc, prisma } = crearServicio();
    prisma.comanda.findUnique.mockResolvedValue({ id: 'c1', estado: 'ANULADA', confirmadaEn: new Date(), alergiasDeclaradas: true, items: [], restricciones: [] });
    expect(await codigoDe(svc.confirmar('c1'))).toBe('CMD_003');
  });
});
