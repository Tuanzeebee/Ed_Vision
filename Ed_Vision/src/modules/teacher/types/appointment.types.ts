export interface TimeSlot {
  slotId?: number; // Optional slot ID from backend
  start: string;
  end: string;
  meetingType?: 'online' | 'offline' | 'both';
  capacity?: number;
}

export interface AvailableDate {
  date: string;
  timeSlots: TimeSlot[];
  weekId?: number; // Optional week ID from backend
  isAvailable?: boolean; // Whether the date is enabled by instructor
}

// Backend-compatible types
export interface BackendTimeSlot {
  slot_id?: number;
  week_id?: number;
  day_of_week?: number;
  start_time_local: string;
  end_time_local: string;
  period_label?: string;
  capacity: number;
  is_open: boolean;
  note?: string;
  auto_accept: boolean;
  meeting_type: 'online' | 'offline' | 'both';
}

export interface BackendAvailabilityDate {
  date_id?: number;
  week_id?: number;
  specific_date: string;
  is_available: boolean;
  note?: string;
  created_at?: string;
  timeSlots?: BackendTimeSlot[];
}

export interface BackendAvailabilityWeek {
  week_id?: number;
  instructor_id?: number;
  week_start_date: string;
  created_at?: string;
  instructorWeeklySlots?: BackendTimeSlot[];
  instructorAvailabilityDates?: BackendAvailabilityDate[];
}

export interface AppointmentRequest {
  id: number;
  parentName: string;
  parentAvatar: string;
  studentName: string;
  studentClass: string;
  type: 'online' | 'offline';
  status: 'pending' | 'accepted' | 'rejected';
  desiredDate: string;
  desiredTime: string;
  reason: string;
  requestedAt: string;
  platform?: string;
}

export type FilterType = 'all' | 'pending' | 'online' | 'offline';

export type RejectReason =
  | 'schedule_conflict'
  | 'personal_leave'
  | 'meeting_conflict'
  | 'health_issue'
  | 'reschedule'
  | 'custom';

export interface RejectFormData {
  reason: RejectReason;
  customReason?: string;
  suggestDate?: string;
  suggestTime?: string;
}