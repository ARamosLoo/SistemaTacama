/**
 * usuarios-admin.controller.ts — Administración de cuentas del personal (solo ADMINISTRADOR).
 * GET   /api/v1/auth/usuarios        lista todas las cuentas
 * POST  /api/v1/auth/usuarios        crea una cuenta
 * PATCH /api/v1/auth/usuarios/:id    cambia nombre, rol, estado o contraseña
 *
 * Las contraseñas se guardan solo como hash (bcrypt); nunca se devuelven.
 */

import {
  Controller, Get, Post, Patch, Param, Body, Request, UseGuards,
  ForbiddenException, ConflictException, NotFoundException, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsEmail, IsString, IsIn, IsOptional, IsBoolean, MinLength, MaxLength, Matches } from 'class-validator';
import * as bcrypt from 'bcrypt';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { Rol } from '../../generated/client';

const SALT_ROUNDS = 12;
// Roles que puede asignar el administrador desde el portal
const ROLES_PERMITIDOS: Rol[] = ['ADMINISTRADOR', 'JEFE_SALON', 'MOZO', 'COCINA', 'SOMMELIER', 'ALMACEN'];
// bcrypt solo usa los primeros 72 caracteres: se limita a eso para que ninguna contraseña quede "medio ignorada"
const REGLA_CLAVE = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/;
const MENSAJE_CLAVE = 'La contraseña debe tener de 8 a 72 caracteres, con letras y números';

class CrearUsuarioDto {
  @IsString() @MinLength(2) @MaxLength(80) nombre: string;
  @IsEmail({}, { message: 'El correo no tiene un formato válido' }) email: string;
  @IsIn(ROLES_PERMITIDOS, { message: 'Rol no válido' }) rol: Rol;
  @Matches(REGLA_CLAVE, { message: MENSAJE_CLAVE }) password: string;
}

class ActualizarUsuarioDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(80) nombre?: string;
  @IsOptional() @IsIn(ROLES_PERMITIDOS, { message: 'Rol no válido' }) rol?: Rol;
  @IsOptional() @IsBoolean() activo?: boolean;
  @IsOptional() @Matches(REGLA_CLAVE, { message: MENSAJE_CLAVE }) password?: string;
}

const SELECCION = { id: true, nombre: true, email: true, rol: true, activo: true, createdAt: true, updatedAt: true } as const;

interface PeticionConUsuario { user?: { id?: string; rol?: string } }

@ApiTags('usuarios')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('auth/usuarios')
export class UsuariosAdminController {
  constructor(private readonly prisma: PrismaService) {}

  /** El rol del token puede venir en mayúsculas (base de datos) o minúsculas (enumeración compartida). */
  private exigirAdministrador(req: PeticionConUsuario) {
    if (String(req.user?.rol ?? '').toUpperCase() !== 'ADMINISTRADOR') {
      throw new ForbiddenException({ mensaje: 'Solo el administrador puede gestionar las cuentas', codigo: 'AUTH_004' });
    }
  }

  @Get()
  @ApiOperation({ summary: 'Listar las cuentas del personal' })
  async listar(@Request() req: PeticionConUsuario) {
    this.exigirAdministrador(req);
    const data = await this.prisma.usuario.findMany({ select: SELECCION, orderBy: [{ activo: 'desc' }, { nombre: 'asc' }] });
    return { data };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una cuenta del personal' })
  async crear(@Request() req: PeticionConUsuario, @Body() dto: CrearUsuarioDto) {
    this.exigirAdministrador(req);
    const email = dto.email.trim().toLowerCase();
    if (await this.prisma.usuario.findUnique({ where: { email } })) {
      throw new ConflictException({ mensaje: 'Ya existe una cuenta con ese correo', codigo: 'AUTH_010' });
    }
    const data = await this.prisma.usuario.create({
      data: {
        nombre: dto.nombre.trim(), email, rol: dto.rol, activo: true,
        passwordHash: await bcrypt.hash(dto.password, SALT_ROUNDS),
      },
      select: SELECCION,
    });
    return { data };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una cuenta: nombre, rol, estado o contraseña' })
  async actualizar(@Request() req: PeticionConUsuario, @Param('id') id: string, @Body() dto: ActualizarUsuarioDto) {
    this.exigirAdministrador(req);
    const actual = await this.prisma.usuario.findUnique({ where: { id } });
    if (!actual) throw new NotFoundException({ mensaje: 'Cuenta no encontrada', codigo: 'AUTH_011' });

    // El administrador no puede quitarse a sí mismo el acceso ni el rol
    const esYo = req.user?.id === id;
    if (esYo && (dto.activo === false || (dto.rol && dto.rol !== 'ADMINISTRADOR'))) {
      throw new ForbiddenException({ mensaje: 'No puedes desactivar tu propia cuenta ni cambiar tu rol', codigo: 'AUTH_012' });
    }
    const dejaDeSerAdminActivo = actual.rol === 'ADMINISTRADOR' && actual.activo && (dto.activo === false || (dto.rol && dto.rol !== 'ADMINISTRADOR'));
    const passwordHash = dto.password !== undefined ? await bcrypt.hash(dto.password, SALT_ROUNDS) : undefined;

    // La comprobación "queda otro administrador activo" y el cambio van juntos en una transacción serializable:
    // así dos administradores que se desactiven a la vez no pueden dejar el sistema sin ninguno.
    const data = await this.prisma.$transaction(
      async (tx) => {
        if (dejaDeSerAdminActivo) {
          const otros = await tx.usuario.count({ where: { rol: 'ADMINISTRADOR', activo: true, id: { not: id } } });
          if (otros === 0) throw new ForbiddenException({ mensaje: 'Debe quedar al menos un administrador activo', codigo: 'AUTH_013' });
        }
        return tx.usuario.update({
          where: { id },
          data: {
            ...(dto.nombre !== undefined ? { nombre: dto.nombre.trim() } : {}),
            ...(dto.rol !== undefined ? { rol: dto.rol } : {}),
            ...(dto.activo !== undefined ? { activo: dto.activo } : {}),
            ...(passwordHash !== undefined ? { passwordHash } : {}),
          },
          select: SELECCION,
        });
      },
      { isolationLevel: 'Serializable' },
    );
    return { data };
  }
}
