import { Module } from '@nestjs/common';
import { QuestionManagementController } from './question-management.controller';
import { QuestionManagementService } from './question-management.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [QuestionManagementController],
  providers: [QuestionManagementService],
  exports: [QuestionManagementService],
})
export class QuestionManagementModule {}
