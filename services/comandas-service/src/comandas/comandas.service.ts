/**
 * comandas.service.ts — RegistrarComanda + ValidarAlergenos
 *
 * Flujo:
 * 1. POST /comandas/:id/restricciones → declara alergias (RN01)
 * 2. POST /comandas                   → crea comanda (valida alergias declaradas)
 * 3. PATCH /comandas/:id              → confirma → emite evento RabbitMQ + WebSocket
 * 4. DELETE /comandas/:id             → anula → revierte stock (RN07)
 */

import {
  Injectable, BadRequestException, NotFoundException,
  ForbiddenException, ConflictException, Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RabbitMQProducer } from '../eventos/rabbitmq.producer';
import { CocinaGateway } from '../gateway/cocina.gateway';
import { SesionPersonal } from '../common/sesion';
import {
  EventoComandaConfirmada,
  EventoComandaAnulada,
  EstadoComanda,
} from '@tacamamesa/shared-types';

// ── DTOs internos ─────────────────────────────────────────────
interface ItemComanda {
  platoId: string;
  platoNombre: string;
  cantidad: number;
  precioUnit: number;
  etiquetaId?: string;
  etiquetaNombre?: string;
  notas?: string;
}

interface CrearComandaDto {
  mesaId: string;
  sesionMesaId: string;
  mozoId?: string;
  items: ItemComanda[];
  observaciones?: string;
}

// Comandas que mantienen ocupada una mesa (hasta que el mozo cierra la última)
const ACTIVAS = ['PENDIENTE', 'EN_PREPARACION', 'LISTA', 'ENTREGADA'];
// Tiempo para cambiar o anular un plato desde la confirmación del pedido
export const VENTANA_CAMBIO_MS = 5 * 60 * 1000;

@Injectable()
export class ComandasService {
  private readonly logger = new Logger(ComandasService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mqProducer: RabbitMQProducer,
    private readonly cocinaGateway: CocinaGateway,
  ) {}

  // ── 1. Declarar restricciones de alérgenos (RN01) ──────────
  async registrarRestricciones(
    comandaId: string,
    alergenos: string[],
    consentimiento: boolean,
    versionTerminos?: string,
  ) {
    if (!consentimiento) {
      throw new BadRequestException({
        mensaje: 'El comensal debe otorgar consentimiento explícito para procesar datos de salud (Ley 29733)',
        codigo: 'CMD_002',
      });
    }

    // Verificar que la comanda existe y está en BORRADOR
    const comanda = await this.prisma.comanda.findUnique({ where: { id: comandaId } });
    if (!comanda) throw new NotFoundException({ mensaje: 'Comanda no encontrada', codigo: 'CMD_001' });
    if (comanda.estado !== 'BORRADOR') {
      throw new ForbiddenException({ mensaje: 'Solo se pueden declarar alergias en estado BORRADOR', codigo: 'CMD_003' });
    }

    // Crear o actualizar restricciones
    await this.prisma.restriccionAlergeno.create({
      data: { comandaId, alergenos, consentimiento, versionTerminos },
    });

    // Marcar alergias como declaradas en la comanda
    await this.prisma.comanda.update({
      where: { id: comandaId },
      data: { alergiasDeclaradas: true },
    });

    return {
      comandaId,
      alergenos,
      mensaje: alergenos.length === 0
        ? 'Sin restricciones declaradas'
        : `${alergenos.length} alergeno(s) declarado(s)`,
    };
  }

  // ── 2. Crear borrador de comanda ───────────────────────────
  async crear(dto: CrearComandaDto) {
    const total = dto.items.reduce(
      (acc, i) => acc + i.precioUnit * i.cantidad, 0,
    );

    // Si la mesa ya tiene un mozo responsable, la nueva comanda queda a su cargo
    const atendida = await this.prisma.comanda.findFirst({
      where: { mesaId: dto.mesaId, estado: { in: ACTIVAS as any[] }, mozoId: { not: null } },
      orderBy: { mozoTomadaEn: 'desc' },
    });
    const comanda = await this.prisma.comanda.create({
      data: {
        mesaId:       dto.mesaId,
        sesionMesaId: dto.sesionMesaId,
        mozoId:       dto.mozoId ?? atendida?.mozoId ?? undefined,
        mozoNombre:   atendida?.mozoNombre ?? undefined,
        mozoTomadaEn: atendida?.mozoTomadaEn ?? undefined,
        estado:       'BORRADOR',
        totalPEN:     total,
        observaciones: dto.observaciones,
        items: {
          create: dto.items.map((i) => ({
            platoId:       i.platoId,
            platoNombre:   i.platoNombre,
            cantidad:      i.cantidad,
            precioUnit:    i.precioUnit,
            subtotal:      i.precioUnit * i.cantidad,
            etiquetaId:    i.etiquetaId,
            etiquetaNombre: i.etiquetaNombre,
            notas:         i.notas,
          })),
        },
      },
      include: { items: true },
    });

    this.logger.log(`Comanda creada: ${comanda.id} — Mesa: ${dto.mesaId}`);
    return comanda;
  }

  // ── 3. Confirmar comanda (BORRADOR → PENDIENTE) ────────────
  async confirmar(id: string) {
    const comanda = await this.prisma.comanda.findUnique({
      where: { id },
      include: { items: true, restricciones: true },
    });

    if (!comanda) throw new NotFoundException({ mensaje: 'Comanda no encontrada', codigo: 'CMD_001' });

    // RN01: No se puede confirmar sin declaración de alergias
    if (!comanda.alergiasDeclaradas) {
      throw new BadRequestException({
        mensaje: 'Debe declarar alergias o indicar que no tiene antes de enviar a cocina (RN01)',
        codigo: 'CMD_002',
      });
    }

    if (comanda.estado !== 'BORRADOR') {
      throw new ForbiddenException({ mensaje: 'Solo se puede confirmar una comanda en estado BORRADOR', codigo: 'CMD_003' });
    }

    // Obtener alérgenos declarados
    const alergenosDeclarados = comanda.restricciones.flatMap((r) => r.alergenos);

    // Actualizar estado
    const confirmada = await this.prisma.comanda.update({
      where: { id },
      data: {
        estado:        'PENDIENTE',
        confirmadaEn:  new Date(),
        updatedAt:     new Date(),
      },
      include: { items: true },
    });

    // ── Publicar evento en RabbitMQ (ComandaConfirmada) ──────
    const evento: EventoComandaConfirmada = {
      tipo: 'comanda.confirmada',
      comandaId: confirmada.id,
      mesaId:    confirmada.mesaId,
      items: confirmada.items.map((i) => ({
        platoId:    i.platoId,
        cantidad:   i.cantidad,
        etiquetaId: i.etiquetaId ?? undefined,
      })),
      timestamp: new Date().toISOString(),
      // Campos adicionales para analítica (venta y venta cruzada)
      ...({ total: Number(confirmada.totalPEN ?? 0) } as object),
    };
    await this.mqProducer.publicar('comanda.confirmada', evento);

    // Venta cruzada: bebidas añadidas desde una sugerencia de maridaje
    for (const i of confirmada.items) {
      if (i.etiquetaId && i.notas?.startsWith('Maridaje sugerido')) {
        await this.mqProducer.publicar('maridaje.aceptado', {
          comandaId: confirmada.id, mesaId: confirmada.mesaId,
          etiquetaId: i.etiquetaId, origen: 'comandas-service',
        });
      }
    }

    // ── Emitir a cocina via WebSocket ────────────────────────
    this.cocinaGateway.emitirNuevaComanda({
      comanda: confirmada,
      alergenosDeclarados,
      tieneAlerta: alergenosDeclarados.length > 0,
    });

    this.logger.log(`Comanda confirmada: ${id} → evento publicado`);
    return confirmada;
  }

  // ── 4. Anular comanda (RN07: revierte stock) ───────────────
  async anular(id: string, motivo: string) {
    const comanda = await this.prisma.comanda.findUnique({ where: { id } });

    if (!comanda) throw new NotFoundException({ mensaje: 'Comanda no encontrada', codigo: 'CMD_001' });

    // Estados del esquema (el enum compartido usa minúsculas y no coincide con los de la base de datos)
    const estadosAnulables: string[] = ['BORRADOR', 'PENDIENTE', 'EN_PREPARACION'];

    if (!estadosAnulables.includes(comanda.estado)) {
      throw new ForbiddenException({ mensaje: 'La comanda no puede ser anulada en su estado actual', codigo: 'CMD_003' });
    }

    const anulada = await this.prisma.comanda.update({
      where: { id },
      data: { estado: 'ANULADA', anulada_en: new Date(), motivoAnulacion: motivo },
    });

    // Publicar evento ComandaAnulada → inventario revierte stock (RN07)
    const evento: EventoComandaAnulada = {
      tipo: 'comanda.anulada',
      comandaId: id,
      mesaId:    comanda.mesaId,
      motivo,
      timestamp: new Date().toISOString(),
    };
    await this.mqProducer.publicar('comanda.anulada', evento);

    this.logger.log(`Comanda anulada: ${id} — ${motivo}`);
    return anulada;
  }

  // ── Obtener comanda por ID ─────────────────────────────────
  /** Lista comandas (para KDS / salón), opcionalmente filtradas por estado */
  async listar(estados?: string[]) {
    return this.prisma.comanda.findMany({
      where: estados?.length ? { estado: { in: estados as any[] } } : {},
      include: { items: true, restricciones: true, valoracion: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** Avanza el estado operativo de la comanda y notifica por WebSocket */
  async cambiarEstado(id: string, estado: 'EN_PREPARACION' | 'LISTA' | 'ENTREGADA') {
    const comanda = await this.prisma.comanda.findUnique({ where: { id } });
    if (!comanda) throw new NotFoundException({ mensaje: 'Comanda no encontrada', codigo: 'CMD_001' });
    if (comanda.estado === 'BORRADOR' || comanda.estado === 'ANULADA') {
      throw new ForbiddenException({ mensaje: 'La comanda no está activa en cocina', codigo: 'CMD_003' });
    }
    // Flujo operativo: cocina prepara (EN_PREPARACION → LISTA) y el mozo entrega (LISTA → ENTREGADA)
    const PREVIO: Record<string, string[]> = { EN_PREPARACION: ['PENDIENTE'], LISTA: ['EN_PREPARACION'], ENTREGADA: ['LISTA'] };
    if (comanda.estado !== estado && !PREVIO[estado].includes(comanda.estado)) {
      throw new ForbiddenException({ mensaje: `No se puede pasar de ${comanda.estado} a ${estado}`, codigo: 'CMD_005' });
    }
    const actualizada = await this.prisma.comanda.update({ where: { id }, data: { estado } });
    this.cocinaGateway.emitirCambioEstado(id, estado);
    return actualizada;
  }

  /**
   * El comensal pide la cuenta. Solo después de que el mozo confirmó la entrega, y habiendo calificado
   * la experiencia (o dejando constancia de que prefiere no hacerlo).
   */
  async solicitarCuenta(id: string, omitirCalificacion: boolean, metodoPago: string, efectivoPagaCon?: number) {
    const comanda = await this.prisma.comanda.findUnique({ where: { id }, include: { valoracion: true, items: true } });
    if (!comanda) throw new NotFoundException({ mensaje: 'Comanda no encontrada', codigo: 'CMD_001' });
    if (comanda.estado !== 'ENTREGADA') {
      throw new ForbiddenException({ mensaje: 'La cuenta se puede pedir cuando el mozo confirme la entrega del pedido', codigo: 'CMD_006' });
    }
    if (!comanda.valoracion && !omitirCalificacion) {
      throw new ForbiddenException({ mensaje: 'Antes de pedir la cuenta, califica tu experiencia', codigo: 'CMD_007' });
    }
    if (comanda.cuentaSolicitadaEn) return comanda;
    // El efectivo declarado debe cubrir el total (el mozo prepara el vuelto)
    const total = comanda.items.reduce((acc, i) => acc + Number(i.subtotal), 0);
    if (metodoPago === 'EFECTIVO' && efectivoPagaCon != null && efectivoPagaCon < total) {
      throw new ForbiddenException({ mensaje: 'El monto en efectivo no cubre el total de la cuenta', codigo: 'CMD_012' });
    }
    const actualizada = await this.prisma.comanda.update({
      where: { id },
      data: {
        cuentaSolicitadaEn: new Date(),
        calificacionOmitida: !comanda.valoracion,
        metodoPago,
        efectivoPagaCon: metodoPago === 'EFECTIVO' && efectivoPagaCon != null ? efectivoPagaCon : null,
      },
    });
    this.cocinaGateway.emitirCambioEstado(id, 'CUENTA_SOLICITADA');
    return actualizada;
  }

  /** Comprobante de consumo: solo con la cuenta solicitada. Marca la emisión y devuelve el detalle. */
  async emitirBoleta(id: string) {
    const comanda = await this.prisma.comanda.findUnique({ where: { id } });
    if (!comanda) throw new NotFoundException({ mensaje: 'Comanda no encontrada', codigo: 'CMD_001' });
    if (!comanda.cuentaSolicitadaEn) {
      throw new ForbiddenException({ mensaje: 'El comensal aún no pidió la cuenta', codigo: 'CMD_008' });
    }
    if (!comanda.boletaEmitidaEn) {
      await this.prisma.comanda.update({ where: { id }, data: { boletaEmitidaEn: new Date() } });
      this.cocinaGateway.emitirCambioEstado(id, 'BOLETA_EMITIDA');
    }
    return this.obtenerBoleta(id);
  }

  /** Detalle del comprobante (los precios de la carta ya incluyen 10% de servicio y 18% de IGV). */
  async obtenerBoleta(id: string) {
    const c = await this.prisma.comanda.findUnique({ where: { id }, include: { items: true } });
    if (!c) throw new NotFoundException({ mensaje: 'Comanda no encontrada', codigo: 'CMD_001' });
    if (!c.boletaEmitidaEn) {
      throw new ForbiddenException({ mensaje: 'El comprobante aún no fue emitido', codigo: 'CMD_009' });
    }
    const total = c.items.reduce((acc, i) => acc + Number(i.subtotal), 0);
    const base = Math.round((total / 1.18) * 100) / 100;
    return {
      comandaId: c.id,
      codigo: 'CMD-' + c.id.slice(0, 4).toUpperCase(),
      mesaId: c.mesaId,
      emitidaEn: c.boletaEmitidaEn,
      metodoPago: c.metodoPago,
      items: c.items.map((i) => ({
        nombre: i.platoNombre, cantidad: i.cantidad, precioUnit: Number(i.precioUnit), subtotal: Number(i.subtotal), notas: i.notas,
      })),
      subtotal: base,
      igv: Math.round((total - base) * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }

  /** El mozo cierra la comanda una vez emitido el comprobante: la mesa queda libre. */
  async cerrar(id: string) {
    const comanda = await this.prisma.comanda.findUnique({ where: { id } });
    if (!comanda) throw new NotFoundException({ mensaje: 'Comanda no encontrada', codigo: 'CMD_001' });
    if (!comanda.boletaEmitidaEn) {
      throw new ForbiddenException({ mensaje: 'Emite el comprobante antes de cerrar la mesa', codigo: 'CMD_010' });
    }
    const cerrada = await this.prisma.comanda.update({ where: { id }, data: { estado: 'CERRADA', cerradaEn: new Date() } });
    this.cocinaGateway.emitirCambioEstado(id, 'CERRADA');
    return cerrada;
  }

  /**
   * Un mozo toma la mesa: queda como responsable de todas sus comandas activas hasta que se cierre
   * la última y la mesa se libere. Jefe de salón y administrador pueden reasignarla.
   */
  async atenderMesa(comandaId: string, sesion: SesionPersonal) {
    const comanda = await this.prisma.comanda.findUnique({ where: { id: comandaId } });
    if (!comanda) throw new NotFoundException({ mensaje: 'Comanda no encontrada', codigo: 'CMD_001' });
    if (!ACTIVAS.includes(comanda.estado)) {
      throw new ForbiddenException({ mensaje: 'La mesa no tiene comandas activas', codigo: 'CMD_013' });
    }
    const activas = await this.prisma.comanda.findMany({ where: { mesaId: comanda.mesaId, estado: { in: ACTIVAS as any[] } } });
    const otro = activas.find((a) => a.mozoId && a.mozoId !== sesion.id);
    const esJefatura = ['JEFE_SALON', 'ADMINISTRADOR'].includes(sesion.rol);
    if (otro && !esJefatura) {
      throw new ConflictException({ mensaje: `La mesa ya la atiende ${otro.mozoNombre ?? 'otro mozo'}`, codigo: 'CMD_014' });
    }
    await this.prisma.comanda.updateMany({
      where: { id: { in: activas.map((a) => a.id) } },
      data: { mozoId: sesion.id, mozoNombre: sesion.nombre, mozoTomadaEn: new Date() },
    });
    this.cocinaGateway.emitirCambioEstado(comandaId, 'MESA_TOMADA');
    return { mesaId: comanda.mesaId, mozoId: sesion.id, mozoNombre: sesion.nombre };
  }

  /** Un mozo solo actúa sobre las mesas que tomó; jefatura y caja no tienen esa restricción. */
  async exigirResponsable(comandaId: string, sesion: SesionPersonal) {
    if (sesion.rol !== 'MOZO') return;
    const comanda = await this.prisma.comanda.findUnique({ where: { id: comandaId } });
    if (!comanda) throw new NotFoundException({ mensaje: 'Comanda no encontrada', codigo: 'CMD_001' });
    if (!comanda.mozoId) {
      throw new ForbiddenException({ mensaje: 'Toma la mesa primero con el botón Atender', codigo: 'CMD_013' });
    }
    if (comanda.mozoId !== sesion.id) {
      throw new ForbiddenException({ mensaje: `Esta mesa la atiende ${comanda.mozoNombre ?? 'otro mozo'}`, codigo: 'CMD_014' });
    }
  }

  // ── Cambiar o anular un plato: solo los primeros 5 minutos desde la confirmación ──
  private validarVentanaDeCambio(c: { estado: string; confirmadaEn: Date | null }) {
    if (!['PENDIENTE', 'EN_PREPARACION'].includes(c.estado) || !c.confirmadaEn) {
      throw new ForbiddenException({ mensaje: 'Este pedido ya no se puede modificar', codigo: 'CMD_015' });
    }
    if (Date.now() - c.confirmadaEn.getTime() > VENTANA_CAMBIO_MS) {
      throw new ForbiddenException({ mensaje: 'Pasaron los 5 minutos para cambiar o anular platos. Consulta con tu mozo.', codigo: 'CMD_016' });
    }
  }

  private async devolverStock(etiquetaId: string, cantidad: number, comandaId: string) {
    try {
      const base = process.env.INVENTARIO_URL ?? 'http://localhost:3005/api/v1';
      await fetch(`${base}/existencias/movimientos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ etiquetaId, tipo: 'ENTRADA', cantidad, referencia: comandaId, motivo: 'Ítem anulado por el comensal' }),
      });
    } catch (e) {
      this.logger.warn(`No se pudo devolver el stock de ${etiquetaId}: ${(e as Error).message}`);
    }
  }

  async anularItem(id: string, itemId: string) {
    const comanda = await this.prisma.comanda.findUnique({ where: { id }, include: { items: true } });
    if (!comanda) throw new NotFoundException({ mensaje: 'Comanda no encontrada', codigo: 'CMD_001' });
    this.validarVentanaDeCambio(comanda);
    const item = comanda.items.find((i) => i.id === itemId);
    if (!item) throw new NotFoundException({ mensaje: 'Plato no encontrado en la comanda', codigo: 'CMD_017' });

    // Si era el único plato, se anula la comanda completa (revierte stock)
    if (comanda.items.length === 1) {
      return this.anular(id, 'Anulada por el comensal (único plato)');
    }
    await this.prisma.detalleComanda.delete({ where: { id: itemId } });
    const restantes = comanda.items.filter((i) => i.id !== itemId);
    const total = restantes.reduce((acc, i) => acc + Number(i.subtotal), 0);
    const actualizada = await this.prisma.comanda.update({ where: { id }, data: { totalPEN: total, modificadaEn: new Date() }, include: { items: true } });
    if (item.etiquetaId) await this.devolverStock(item.etiquetaId, item.cantidad, id);
    this.cocinaGateway.emitirCambioEstado(id, 'COMANDA_MODIFICADA');
    return actualizada;
  }

  async cambiarItem(id: string, itemId: string, dto: { platoId: string; platoNombre: string; precioUnit: number; notas?: string }) {
    const comanda = await this.prisma.comanda.findUnique({ where: { id }, include: { items: true } });
    if (!comanda) throw new NotFoundException({ mensaje: 'Comanda no encontrada', codigo: 'CMD_001' });
    this.validarVentanaDeCambio(comanda);
    const item = comanda.items.find((i) => i.id === itemId);
    if (!item) throw new NotFoundException({ mensaje: 'Plato no encontrado en la comanda', codigo: 'CMD_017' });
    if (item.etiquetaId) {
      throw new BadRequestException({ mensaje: 'Los vinos y piscos se anulan y se piden de nuevo', codigo: 'CMD_018' });
    }
    await this.prisma.detalleComanda.update({
      where: { id: itemId },
      data: {
        platoId: dto.platoId,
        platoNombre: dto.platoNombre,
        precioUnit: dto.precioUnit,
        subtotal: dto.precioUnit * item.cantidad,
        notas: dto.notas ?? item.notas,
      },
    });
    const items = await this.prisma.detalleComanda.findMany({ where: { comandaId: id } });
    const total = items.reduce((acc, i) => acc + Number(i.subtotal), 0);
    const actualizada = await this.prisma.comanda.update({ where: { id }, data: { totalPEN: total, modificadaEn: new Date() }, include: { items: true } });
    this.cocinaGateway.emitirCambioEstado(id, 'COMANDA_MODIFICADA');
    return actualizada;
  }

  async findById(id: string) {
    const comanda = await this.prisma.comanda.findUnique({
      where: { id },
      include: { items: true, restricciones: true, valoracion: true },
    });
    if (!comanda) throw new NotFoundException({ mensaje: 'Comanda no encontrada', codigo: 'CMD_001' });
    // Hora límite para cambiar o anular platos (y hora del servidor, para no depender del reloj del celular)
    return {
      ...comanda,
      ventanaCambioHasta: comanda.confirmadaEn && ['PENDIENTE', 'EN_PREPARACION'].includes(comanda.estado)
        ? new Date(comanda.confirmadaEn.getTime() + VENTANA_CAMBIO_MS).toISOString()
        : null,
      ahoraServidor: new Date().toISOString(),
    };
  }
}
