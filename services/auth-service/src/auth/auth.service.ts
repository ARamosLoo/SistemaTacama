/**
 * auth.service.ts — Lógica de autenticación del personal.
 * Métodos:
 *  - login(): valida credenciales y emite JWT de personal
 *  - validarUsuario(): comparación de password con bcrypt
 *  - generarTokenMesa(): emite JWT temporal para comensal (por QR)
 *  - revocarSesionMesa(): cierra sesión de mesa (al cerrar cuenta)
 */

import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { UsuariosService } from '../usuarios/usuarios.service';
import { MesasService } from '../mesas/mesas.service';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { TokenResponseDto, TokenMesaResponseDto } from './dto/auth-response.dto';
import { JwtPayload, TokenMesaPayload, RolUsuario } from '@tacamamesa/shared-types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly mesasService: MesasService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Valida email y password. Retorna el usuario sin el hash.
   * Retorna null si las credenciales son incorrectas.
   */
  async validarUsuario(email: string, password: string) {
    const usuario = await this.usuariosService.findByEmail(email);
    if (!usuario || !usuario.activo) return null;

    const coincide = await bcrypt.compare(password, usuario.passwordHash);
    if (!coincide) return null;

    // Nunca retornar el hash de contraseña
    const { passwordHash: _, ...usuarioSeguro } = usuario;
    return usuarioSeguro;
  }

  /**
   * Login del personal: valida credenciales y retorna JWT firmado.
   * POST /api/v1/auth/login
   */
  async login(loginDto: LoginDto): Promise<TokenResponseDto> {
    const usuario = await this.validarUsuario(loginDto.email, loginDto.password);

    if (!usuario) {
      this.logger.warn(`Intento de login fallido para: ${loginDto.email}`);
      throw new UnauthorizedException({
        mensaje: 'Credenciales incorrectas',
        codigo: 'AUTH_003',
      });
    }

    // Construir payload del JWT
    // El nombre viaja en la sesión para que los demás servicios identifiquen al mozo responsable de una mesa
    const payload = {
      sub: usuario.id,
      email: usuario.email,
      rol: usuario.rol as RolUsuario,
      nombre: usuario.nombre,
    } as JwtPayload;

    const accessToken = this.jwtService.sign(payload);
    const expiresIn = this.parsearExpiracion(
      this.config.get<string>('JWT_EXPIRES_IN', '8h'),
    );

    this.logger.log(`Login exitoso: ${usuario.email} (${usuario.rol})`);

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol as RolUsuario,
      },
    };
  }

  /**
   * Genera un token de mesa temporal al escanear el QR.
   * GET /api/v1/mesas/{codigoQR}/sesion
   * El token usa JWT_MESA_SECRET (diferente al del personal).
   */
  async generarTokenMesa(codigoQR: string): Promise<TokenMesaResponseDto> {
    // Buscar la mesa por código QR
    const mesa = await this.mesasService.findByQR(codigoQR);

    if (!mesa || !mesa.activa) {
      throw new NotFoundException({
        mensaje: 'El código QR no corresponde a ninguna mesa activa',
        codigo: 'AUTH_005',
      });
    }

    // Calcular expiración
    const expiracion = this.config.get<string>('JWT_MESA_EXPIRES_IN', '4h');
    const segundos = this.parsearExpiracion(expiracion);
    const expiraEn = new Date(Date.now() + segundos * 1000);

    // Construir payload del token de mesa
    const payload: TokenMesaPayload = {
      mesaId: mesa.id,
      codigoQR: mesa.codigoQR,
      tipo: 'mesa',
    };

    const tokenMesa = this.jwtService.sign(payload, {
      secret: this.config.getOrThrow<string>('JWT_MESA_SECRET'),
      expiresIn: expiracion,
      // Identificador único: dos escaneos del mismo QR en el mismo segundo generaban el mismo token
      // y la restricción única de la base de datos respondía 500 (la carta no cargaba)
      jwtid: randomUUID(),
    });

    // Registrar sesión en la base de datos
    await this.prisma.sesionMesa.create({
      data: {
        mesaId: mesa.id,
        token: tokenMesa,
        expiraEn,
        activa: true,
      },
    });

    this.logger.log(`Sesión de mesa creada: Mesa ${mesa.numero} (QR: ${codigoQR})`);

    return {
      tokenMesa,
      mesaId: mesa.id,
      numeroMesa: mesa.numero,
      expiraEn: expiraEn.toISOString(),
    };
  }

  /**
   * Cierra la sesión activa de una mesa (anfitrión / fin de turno).
   */
  async cerrarSesionMesa(mesaId: string): Promise<void> {
    await this.prisma.sesionMesa.updateMany({
      where: { mesaId, activa: true },
      data: { activa: false, cerradaEn: new Date() },
    });
    this.logger.log(`Sesión cerrada para mesa: ${mesaId}`);
  }

  /**
   * Convierte strings tipo "8h", "4h", "30m" a segundos.
   */
  private parsearExpiracion(valor: string): number {
    const match = valor.match(/^(\d+)([smhd])$/);
    if (!match) return 28800; // 8h por defecto
    const [, num, unidad] = match;
    const multiplicadores: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
    return parseInt(num) * (multiplicadores[unidad] ?? 3600);
  }
}
