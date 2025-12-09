import { Module } from '@nestjs/common';
import { AcademicDataController } from './academic-data.controller';
import { AcademicDataService } from './academic-data.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AcademicDataController],
  providers: [AcademicDataService],
  exports: [AcademicDataService],
})
export class AcademicDataModule {}
