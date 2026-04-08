// Export all API services
export { instructorAvailabilityApi } from './instructorAvailability';
export { classManagementAPI } from './classManagement';
export { dashboardAPI } from './dashboard';

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

export type { DashboardStats, AtRiskStudent, DashboardResponse } from './dashboard';

// Export config
export { API_CONFIG } from './config';
