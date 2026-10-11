/**
 * auth-response.dto.ts — Respuestas de autenticación para Swagger
 */

import { ApiProperty } from '@nestjs/swagger';
import { RolUsuario } from '@tacamamesa/shared-types';

export class TokenResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType: string;

  @ApiProperty({ example: 28800, description: 'Segundos hasta expiración' })
  expiresIn: number;

  @ApiProperty({ example: { id: 'uuid', nombre: 'Pedro Mozo', rol: 'MOZO' } })
  usuario: {
    id: string;
    nombre: string;
    email: string;
    rol: RolUsuario;
  };
}

export class TokenMesaResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  tokenMesa: string;

  @ApiProperty({ example: 'mesa-uuid-123' })
  mesaId: string;

  @ApiProperty({ example: 2 })
  numeroMesa: number;

  @ApiProperty({ example: '2024-01-15T20:00:00.000Z' })
  expiraEn: string;
}
