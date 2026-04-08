import { Injectable, Inject } from '@nestjs/common';
import { checkMongoConnection } from './mongodb/database.utils';
import { ReminderSchedulerService } from './admin_be/notification/reminder-scheduler.service';
import { PrismaService } from './prisma/prisma.service';
import { RedisService } from './redis/redis.service';

@Injectable()
export class AppService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    @Inject(ReminderSchedulerService)
    private readonly reminderScheduler: ReminderSchedulerService,
  ) {}

  async getHealthStatus() {
    let postgresConnected = false;

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      postgresConnected = true;
    } catch (error) {
      postgresConnected = false;
    }

    const mongoConnected = await checkMongoConnection();
    const redisConnected = this.redisService.isReady();

    return {
      status: postgresConnected && mongoConnected ? 'ok' : 'degraded',
      postgresConnected,
      mongoConnected,
      redisConnected,
    };
  }

  async getMongoStatus() {
    const isConnected = await checkMongoConnection();
    return { mongoConnected: isConnected };
  }
}
