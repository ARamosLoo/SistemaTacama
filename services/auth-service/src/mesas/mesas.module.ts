import { Module, forwardRef } from '@nestjs/common';
import { MesasService } from './mesas.service';
import { MesasController } from './mesas.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [MesasController],
  providers: [MesasService],
  exports: [MesasService],
})
export class MesasModule {}
