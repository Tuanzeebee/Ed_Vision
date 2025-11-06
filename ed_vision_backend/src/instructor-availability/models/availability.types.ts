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
