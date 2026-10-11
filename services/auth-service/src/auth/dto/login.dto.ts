/**
 * login.dto.ts — DTO para el endpoint POST /api/v1/auth/login
 * Validado con class-validator y documentado con @nestjs/swagger.
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'mozo1@tacama.pe',
    description: 'Correo electrónico del usuario del personal',
  })
  @IsEmail({}, { message: 'El email no tiene un formato válido' })
  email: string;

  @ApiProperty({
    example: 'Mozo2024!',
    description: 'Contraseña del usuario (mínimo 8 caracteres)',
    minLength: 8,
  })
  @IsString({ message: 'La contraseña debe ser texto' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(100)
  password: string;
}
