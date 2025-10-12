export interface TimeSlot {
  start: string;
  end: string;
}

export interface AvailableDate {
  date: string;
  timeSlots: TimeSlot[];
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
