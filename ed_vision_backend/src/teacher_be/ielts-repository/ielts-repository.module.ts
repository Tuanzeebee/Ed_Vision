import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { IeltsRepositoryModule as CoreIeltsRepositoryModule } from '../../ielts-repository/ielts-repository.module';
import { IeltsRepositoryController } from './ielts-repository.controller';
import { IeltsImportService } from './ielts-import.service';

@Module({
  imports: [PrismaModule, CoreIeltsRepositoryModule],
  controllers: [IeltsRepositoryController],
  providers: [IeltsImportService],
  exports: [IeltsImportService],
})
export class IeltsRepositoryModule {}
