// Export module
export { InstructorAvailabilityModule } from './instructor-availability.module';

// Export service for use in other modules
export { InstructorAvailabilityService } from './instructor-availability.service';

// Export DTOs
export { CreateTimeSlotDto } from './dto/create-time-slot.dto';
export { AddAvailabilityDateDto } from './dto/add-availability-date.dto';
export { UpdateTimeSlotDto } from './dto/update-time-slot.dto';
export { BulkCreateAvailabilityDto } from './dto/bulk-create-availability.dto';

// Export types
export * from './models/availability.types';

