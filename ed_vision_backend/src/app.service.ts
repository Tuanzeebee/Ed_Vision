import { Injectable, Inject } from '@nestjs/common';
import { checkMongoConnection } from './mongodb/database.utils';
import { ReminderSchedulerService } from './admin_be/notification/reminder-scheduler.service';

@Injectable()
export class AppService {
  constructor(
    @Inject(ReminderSchedulerService)
    private readonly reminderScheduler: ReminderSchedulerService,
  ) {}

  async getMongoStatus() {
    const isConnected = await checkMongoConnection();
    return { mongoConnected: isConnected };
  }
}
