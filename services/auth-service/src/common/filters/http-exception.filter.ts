/**
 * http-exception.filter.ts
 * Filtro global: transforma todas las excepciones HTTP en una
 * respuesta JSON estandarizada con código de error TacamaMesa.
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface RespuestaError {
  statusCode: number;
  error: string;
  mensaje: string;
  codigo?: string;
  timestamp: string;
  path: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Determinar status y mensaje
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let mensaje = 'Error interno del servidor';
    let codigo: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const respuesta = exception.getResponse();

      if (typeof respuesta === 'string') {
        mensaje = respuesta;
      } else if (typeof respuesta === 'object' && respuesta !== null) {
        const obj = respuesta as Record<string, unknown>;
        // class-validator devuelve 'message' como array
        mensaje = Array.isArray(obj['message'])
          ? (obj['message'] as string[]).join('; ')
          : ((obj['message'] ?? obj['mensaje']) as string) ?? mensaje;
        codigo = obj['codigo'] as string | undefined;
      }
    } else if (exception instanceof Error) {
      this.logger.error(`Error no controlado: ${exception.message}`, exception.stack);
    }

    const cuerpoRespuesta: RespuestaError = {
      statusCode: status,
      error: HttpStatus[status] ?? 'ERROR',
      mensaje,
      ...(codigo && { codigo }),
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Log de errores 5xx
    if (status >= 500) {
      this.logger.error(
        `[${request.method}] ${request.url} → ${status}: ${mensaje}`,
      );
    } else {
      this.logger.warn(
        `[${request.method}] ${request.url} → ${status}: ${mensaje}`,
      );
    }

    response.status(status).json(cuerpoRespuesta);
  }
}
