/** valoracion.service.ts — Registro de CSAT del comensal */

import { Injectable, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RabbitMQProducer } from '../eventos/rabbitmq.producer';

@Injectable()
export class ValoracionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mqProducer: RabbitMQProducer,
  ) {}

  async crear(dto: {
    comandaId: string;
    mesaId: string;
    puntuacion: number;
    comentario?: string;
    mozoId?: string;
  }) {
    // Se califica con el pedido ya entregado por el mozo
    const comanda = await this.prisma.comanda.findUnique({ where: { id: dto.comandaId } });
    if (!comanda) throw new NotFoundException({ mensaje: 'Comanda no encontrada', codigo: 'CMD_001' });
    if (comanda.estado !== 'ENTREGADA' && comanda.estado !== 'CERRADA') {
      throw new ForbiddenException({ mensaje: 'Podrás calificar cuando el mozo confirme la entrega', codigo: 'CMD_006' });
    }
    const existe = await this.prisma.valoracion.findUnique({ where: { comandaId: dto.comandaId } });
    if (existe) throw new ConflictException({ mensaje: 'Esta comanda ya tiene una valoración', codigo: 'GEN_001' });

    const valoracion = await this.prisma.valoracion.create({
      data: {
        comandaId:  dto.comandaId,
        mesaId:     dto.mesaId,
        puntuacion: dto.puntuacion,
        comentario: dto.comentario,
        mozoId:     dto.mozoId,
        turno:      this.detectarTurno(),
      },
    });

    // Alimenta el CSAT del dashboard de analítica
    await this.mqProducer.publicar('valoracion.registrada', {
      tipo: 'valoracion.registrada',
      comandaId: dto.comandaId,
      mesaId: dto.mesaId,
      puntuacion: dto.puntuacion,
      origen: 'comandas-service',
      timestamp: new Date().toISOString(),
    });
    return valoracion;
  }

  private detectarTurno(): string {
    const hora = new Date().getHours();
    return hora >= 12 && hora < 17 ? 'almuerzo' : 'cena';
  }
}
