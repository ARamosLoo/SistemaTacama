/**
 * admin.service.ts — Administración de la carta: disponibilidad (agotado), precios y fotos.
 * Cada cambio invalida la caché de la carta para que los comensales lo vean enseguida.
 */
import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { CartaService } from '../carta/carta.service';

const DIR_FOTOS = path.join(process.cwd(), 'uploads', 'platos');
const PREFIJO_URL = '/api/v1/uploads/platos/';
const MAX_BYTES = 5 * 1024 * 1024;
const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly prisma: PrismaService, private readonly carta: CartaService) {}

  async listar() {
    const platos = await this.prisma.plato.findMany({
      orderBy: [{ seccion: 'asc' }, { codigoInterno: 'asc' }],
      select: {
        id: true, codigoInterno: true, nombreEs: true, categoria: true, seccion: true, rol: true,
        precioBase: true, disponible: true, imagenUrl: true, updatedAt: true,
      },
    });
    return platos.map((p) => ({ ...p, precioBase: Number(p.precioBase) }));
  }

  async actualizar(id: string, dto: { precioBase?: number; disponible?: boolean }) {
    const existe = await this.prisma.plato.findUnique({ where: { id }, select: { id: true } });
    if (!existe) throw new NotFoundException({ mensaje: 'Plato no encontrado', codigo: 'CAT_001' });
    if (dto.precioBase !== undefined && (!Number.isFinite(dto.precioBase) || dto.precioBase < 0 || dto.precioBase > 5000)) {
      throw new BadRequestException({ mensaje: 'El precio debe estar entre 0 y 5000 soles', codigo: 'CAT_002' });
    }
    const actualizado = await this.prisma.plato.update({
      where: { id },
      data: {
        ...(dto.precioBase !== undefined ? { precioBase: Math.round(dto.precioBase * 100) / 100 } : {}),
        ...(dto.disponible !== undefined ? { disponible: dto.disponible } : {}),
      },
    });
    await this.carta.invalidar();
    this.logger.log(`Plato ${actualizado.codigoInterno} actualizado: ${JSON.stringify(dto)}`);
    return { ...actualizado, precioBase: Number(actualizado.precioBase) };
  }

  /** Recibe la imagen como data URL (base64), la guarda y la asocia al plato. */
  async subirFoto(id: string, imagen: string) {
    const plato = await this.prisma.plato.findUnique({ where: { id } });
    if (!plato) throw new NotFoundException({ mensaje: 'Plato no encontrado', codigo: 'CAT_001' });
    const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(imagen ?? '');
    if (!m) throw new BadRequestException({ mensaje: 'La foto debe ser JPG, PNG o WEBP', codigo: 'CAT_003' });
    const buf = Buffer.from(m[2], 'base64');
    if (buf.length > MAX_BYTES) throw new BadRequestException({ mensaje: 'La foto supera los 5 MB', codigo: 'CAT_004' });

    fs.mkdirSync(DIR_FOTOS, { recursive: true });
    const archivo = `${plato.codigoInterno}-${Date.now()}.${EXT[m[1]]}`;
    fs.writeFileSync(path.join(DIR_FOTOS, archivo), buf);

    // Borra la foto subida anteriormente (las del PDF original no se tocan)
    if (plato.imagenUrl?.startsWith(PREFIJO_URL)) {
      fs.promises.unlink(path.join(DIR_FOTOS, path.basename(plato.imagenUrl))).catch(() => undefined);
    }
    const actualizado = await this.prisma.plato.update({ where: { id }, data: { imagenUrl: PREFIJO_URL + archivo } });
    await this.carta.invalidar();
    this.logger.log(`Foto de ${plato.codigoInterno} actualizada (${Math.round(buf.length / 1024)} KB)`);
    return { imagenUrl: actualizado.imagenUrl };
  }
}
