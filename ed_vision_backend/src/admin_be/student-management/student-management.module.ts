import { Module } from '@nestjs/common';
import { StudentManagementController } from './student-management.controller';
import { StudentManagementService } from './student-management.service';
import { StudentStatsGateway } from './student-stats.gateway';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StudentManagementController],
  providers: [StudentManagementService, StudentStatsGateway],
  exports: [StudentManagementService, StudentStatsGateway],
})
export class StudentManagementModule {}
