import { Module } from '@nestjs/common';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { BookingRepository } from './booking.repository';
import { DevAuthGuard } from '../common/guards/dev-auth.guard';

@Module({
	controllers: [BookingController],
	providers: [BookingService, BookingRepository, DevAuthGuard],
	exports: [BookingService],
})
export class BookingModule {}

