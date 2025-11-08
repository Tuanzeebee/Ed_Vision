// API Request DTOs
export interface TimeSlotDto {
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  meetingType: 'online' | 'offline' | 'both';
  capacity: number;
  note?: string;
}

export interface AddAvailabilityDateDto {
  date: string; // YYYY-MM-DD format
  timeSlots?: TimeSlotDto[];
}

export interface BulkCreateAvailabilityDto {
  availabilities: AddAvailabilityDateDto[];
}

// API Response types
export interface TimeSlotResponse {
  slotId: number;
  startTime: string;
  endTime: string;
  meetingType: string;
  capacity: number;
  isOpen: boolean;
  autoAccept: boolean;
  note?: string;
  bookedCount?: number;
}

export interface AvailabilityDateResponse {
  date: string;
  dayOfWeek: number;
  weekId: number;
  isAvailable: boolean;
  timeSlots: TimeSlotResponse[];
}

export interface AvailabilityStatistics {
  totalDates: number;
  totalTimeSlots: number;
  totalHours: number;
  upcomingDates: number;
  totalCapacity: number;
  bookedSlots: number;
}

export interface AvailabilityResponse {
  availabilities: AvailabilityDateResponse[];
  statistics: AvailabilityStatistics;
}

export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}
