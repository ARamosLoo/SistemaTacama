/**
 * http-exception.filter.ts — Filtro compartido (copiado en cada servicio)
 * Centraliza el formato de errores JSON para TacamaMesa.
 */

import {
  ExceptionFilter, Catch, ArgumentsHost,
  HttpException, HttpStatus, Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx      = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request  = ctx.getRequest<Request>();

    let status  = HttpStatus.INTERNAL_SERVER_ERROR;
    let mensaje = 'Error interno del servidor';
    let codigo: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        mensaje = body;
      } else if (typeof body === 'object' && body !== null) {
        const obj = body as Record<string, unknown>;
        mensaje = Array.isArray(obj['message'])
          ? (obj['message'] as string[]).join('; ')
          : ((obj['message'] ?? obj['mensaje']) as string) ?? mensaje;
        codigo = obj['codigo'] as string | undefined;
      }
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
    }

    if (status >= 500) this.logger.error(`[${request.method}] ${request.url} → ${status}`);
    else               this.logger.warn(`[${request.method}] ${request.url} → ${status}: ${mensaje}`);

    response.status(status).json({
      statusCode: status,
      error: HttpStatus[status] ?? 'ERROR',
      mensaje,
      ...(codigo && { codigo }),
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
