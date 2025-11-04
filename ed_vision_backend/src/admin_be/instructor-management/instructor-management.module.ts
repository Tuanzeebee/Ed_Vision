import { Module } from '@nestjs/common';
import { InstructorManagementController } from './instructor-management.controller';
import { InstructorManagementService } from './instructor-management.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InstructorManagementController],
  providers: [InstructorManagementService],
  exports: [InstructorManagementService],
})
export class InstructorManagementModule {}
