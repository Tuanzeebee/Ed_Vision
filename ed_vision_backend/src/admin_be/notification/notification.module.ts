import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationGateway } from './notification.gateway';
import { ReminderSchedulerService } from './reminder-scheduler.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationGateway, ReminderSchedulerService],
  exports: [NotificationService, NotificationGateway, ReminderSchedulerService],
})
export class NotificationModule {}
