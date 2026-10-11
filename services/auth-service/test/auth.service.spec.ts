/**
 * auth.service.spec.ts — Tests unitarios del AuthService.
 * Valida el flujo de login y generación de token de mesa.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import { AuthService } from '../src/auth/auth.service';
import { UsuariosService } from '../src/usuarios/usuarios.service';
import { MesasService } from '../src/mesas/mesas.service';
import { PrismaService } from '../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

// ── Mocks ─────────────────────────────────────────────────────
const mockUsuariosService = {
  findByEmail: jest.fn(),
  findById: jest.fn(),
};

const mockMesasService = {
  findByQR: jest.fn(),
};

const mockPrisma = {
  sesionMesa: {
    create: jest.fn(),
    updateMany: jest.fn(),
  },
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock.jwt.token'),
};

const mockConfigService = {
  getOrThrow: jest.fn().mockReturnValue('test-secret'),
  get: jest.fn().mockReturnValue('8h'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsuariosService, useValue: mockUsuariosService },
        { provide: MesasService, useValue: mockMesasService },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  // ── Login ──────────────────────────────────────────────────
  describe('login()', () => {
    it('debe retornar un accessToken cuando las credenciales son correctas', async () => {
      // Arrange
      const hashReal = await bcrypt.hash('Mozo2024!', 10);
      mockUsuariosService.findByEmail.mockResolvedValue({
        id: 'user-uuid',
        nombre: 'Pedro Mozo',
        email: 'mozo1@tacama.pe',
        passwordHash: hashReal,
        rol: 'MOZO',
        activo: true,
      });

      // Act
      const resultado = await service.login({
        email: 'mozo1@tacama.pe',
        password: 'Mozo2024!',
      });

      // Assert
      expect(resultado.accessToken).toBe('mock.jwt.token');
      expect(resultado.tokenType).toBe('Bearer');
      expect(resultado.usuario.rol).toBe('MOZO');
      expect(mockJwtService.sign).toHaveBeenCalledTimes(1);
    });

    it('debe lanzar UnauthorizedException con credenciales incorrectas', async () => {
      // Arrange
      const hashReal = await bcrypt.hash('PasswordCorrecto!', 10);
      mockUsuariosService.findByEmail.mockResolvedValue({
        id: 'user-uuid',
        email: 'mozo1@tacama.pe',
        passwordHash: hashReal,
        activo: true,
      });

      // Act & Assert
      await expect(
        service.login({ email: 'mozo1@tacama.pe', password: 'PasswordIncorrecto!' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('debe lanzar UnauthorizedException si el usuario no existe', async () => {
      mockUsuariosService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'noexiste@tacama.pe', password: 'cualquier' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('debe lanzar UnauthorizedException si el usuario está inactivo', async () => {
      const hashReal = await bcrypt.hash('Mozo2024!', 10);
      mockUsuariosService.findByEmail.mockResolvedValue({
        email: 'inactivo@tacama.pe',
        passwordHash: hashReal,
        activo: false, // ← inactivo
      });

      await expect(
        service.login({ email: 'inactivo@tacama.pe', password: 'Mozo2024!' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ── Token de mesa ──────────────────────────────────────────
  describe('generarTokenMesa()', () => {
    it('debe retornar tokenMesa para un QR válido', async () => {
      // Arrange
      mockMesasService.findByQR.mockResolvedValue({
        id: 'mesa-uuid',
        numero: 2,
        codigoQR: 'QR-MESA-002',
        activa: true,
      });
      mockPrisma.sesionMesa.create.mockResolvedValue({});

      // Act
      const resultado = await service.generarTokenMesa('QR-MESA-002');

      // Assert
      expect(resultado.tokenMesa).toBe('mock.jwt.token');
      expect(resultado.numeroMesa).toBe(2);
      expect(mockPrisma.sesionMesa.create).toHaveBeenCalledTimes(1);
    });

    it('debe lanzar NotFoundException para QR inválido', async () => {
      mockMesasService.findByQR.mockResolvedValue(null);

      await expect(
        service.generarTokenMesa('QR-INVALIDO'),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar NotFoundException para mesa inactiva', async () => {
      mockMesasService.findByQR.mockResolvedValue({
        id: 'mesa-uuid',
        numero: 3,
        codigoQR: 'QR-MESA-003',
        activa: false, // ← inactiva
      });

      await expect(
        service.generarTokenMesa('QR-MESA-003'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
