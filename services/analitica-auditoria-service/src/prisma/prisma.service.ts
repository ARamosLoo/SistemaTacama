import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '../../generated/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Conectado a PostgreSQL (schema: analitica)');
    await this.proteger();
  }

  /**
   * RNF15: el log de auditoría no se modifica nunca y no se borra antes de 12 meses.
   * La regla vive en la base de datos (trigger), para que ni un error de código ni una consulta manual la salten.
   */
  private async proteger() {
    try {
      await this.$executeRawUnsafe(`
        CREATE OR REPLACE FUNCTION analitica.proteger_log_auditoria() RETURNS trigger AS $$
        BEGIN
          IF TG_OP = 'UPDATE' THEN
            RAISE EXCEPTION 'El log de auditoría es inmutable (RNF15)';
          END IF;
          IF OLD."timestamp" > now() - interval '12 months' THEN
            RAISE EXCEPTION 'El log de auditoría se conserva al menos 12 meses (RNF15)';
          END IF;
          RETURN OLD;
        END
        $$ LANGUAGE plpgsql`);
      await this.$executeRawUnsafe('DROP TRIGGER IF EXISTS trg_proteger_log_auditoria ON analitica.log_auditoria');
      await this.$executeRawUnsafe(
        'CREATE TRIGGER trg_proteger_log_auditoria BEFORE UPDATE OR DELETE ON analitica.log_auditoria FOR EACH ROW EXECUTE FUNCTION analitica.proteger_log_auditoria()',
      );
      this.logger.log('Protección RNF15 activa: log de auditoría inmutable y con retención de 12 meses');
    } catch (e) {
      this.logger.error('No se pudo activar la protección del log de auditoría: ' + (e as Error).message);
      // RNF15: en producción no se arranca sin la protección que el sistema promete
      if (process.env.NODE_ENV === 'production') throw e;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Desconectado de PostgreSQL');
  }
}
