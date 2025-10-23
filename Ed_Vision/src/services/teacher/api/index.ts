// Export all API services
export { instructorAvailabilityApi } from './instructorAvailability';

// Export types
export type {
  TimeSlotDto,
  AddAvailabilityDateDto,
  BulkCreateAvailabilityDto,
  TimeSlotResponse,
  AvailabilityDateResponse,
  AvailabilityStatistics,
  AvailabilityResponse,
  ApiResponse,
} from './types';

// Export config
export { API_CONFIG } from './config';
