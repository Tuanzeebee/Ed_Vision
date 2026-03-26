import { Module } from '@nestjs/common';
import { ClassManagementController } from './class-management.controller';
import { ClassManagementService } from './class-management.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { DevAuthGuard } from '../../common/guards/dev-auth.guard';

@Module({
  imports: [PrismaModule],
  controllers: [ClassManagementController],
  providers: [ClassManagementService, DevAuthGuard],
  exports: [ClassManagementService],
})
export class ClassManagementModule {}
