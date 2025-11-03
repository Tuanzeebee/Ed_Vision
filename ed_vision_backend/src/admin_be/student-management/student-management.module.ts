import { Module } from '@nestjs/common';
import { StudentManagementController } from './student-management.controller';
import { StudentManagementService } from './student-management.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StudentManagementController],
  providers: [StudentManagementService],
  exports: [StudentManagementService],
})
export class StudentManagementModule {}
