import { Module } from '@nestjs/common';
import { InstructorAvailabilityController } from './instructor-availability.controller';
import { InstructorAvailabilityService } from './instructor-availability.service';
import { InstructorAvailabilityRepository } from './instructor-availability.repository';

@Module({
  controllers: [InstructorAvailabilityController],
  providers: [InstructorAvailabilityService, InstructorAvailabilityRepository],
  exports: [InstructorAvailabilityService],
})
export class InstructorAvailabilityModule {}
