import { Module } from '@nestjs/common';
import { AccountManagementController } from './account-management.controller';
import { AccountManagementService } from './account-management.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AccountManagementController],
  providers: [AccountManagementService],
  exports: [AccountManagementService],
})
export class AccountManagementModule {}
