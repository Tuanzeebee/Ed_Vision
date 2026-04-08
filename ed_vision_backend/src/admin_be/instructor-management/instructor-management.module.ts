import { Module } from '@nestjs/common';
import { InstructorManagementController } from './instructor-management.controller';
import { InstructorManagementService } from './instructor-management.service';
import { InstructorStatsGateway } from './instructor-stats.gateway';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InstructorManagementController],
  providers: [InstructorManagementService, InstructorStatsGateway],
  exports: [InstructorManagementService, InstructorStatsGateway],
})
export class InstructorManagementModule {}
