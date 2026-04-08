import { Module } from '@nestjs/common';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { BookingRepository } from './booking.repository';
import { BookingCronService } from './booking-cron.service';
import { DevAuthGuard } from '../common/guards/dev-auth.guard';
import { NotificationModule } from '../admin_be/notification/notification.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [NotificationModule, PrismaModule],
  controllers: [BookingController],
  providers: [
    BookingService,
    BookingRepository,
    BookingCronService,
    DevAuthGuard,
  ],
  exports: [BookingService],
})
export class BookingModule {}
