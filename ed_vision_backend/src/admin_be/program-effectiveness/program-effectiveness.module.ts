import { Module } from '@nestjs/common';
import { ProgramEffectivenessController } from './program-effectiveness.controller';
import { ProgramEffectivenessService } from './program-effectiveness.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProgramEffectivenessController],
  providers: [ProgramEffectivenessService],
  exports: [ProgramEffectivenessService],
})
export class ProgramEffectivenessModule {}
