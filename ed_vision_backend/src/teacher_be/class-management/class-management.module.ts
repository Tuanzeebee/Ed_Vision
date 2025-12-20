import { Module } from '@nestjs/common';
import { ClassManagementController } from './class-management.controller';
import { ClassManagementService } from './class-management.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ClassManagementController],
  providers: [ClassManagementService],
  exports: [ClassManagementService],
})
export class ClassManagementModule {}
