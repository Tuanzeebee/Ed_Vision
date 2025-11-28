export interface InstructorInfoResponse {
  instructor_id: number;
  account_id: number;
  employee_code: string;
  full_name: string;
  academic_title: string;
  position: string;
  department: {
    id?: number;
    name: string;
    code: string;
  };
  email: string;
}

export interface StudentInSlot {
  id: number; // student_id
  student_id: number; // Thêm explicit student_id
  account_id: number; // Thêm account_id
  student_code: string;
  name: string;
  class_name: string;
  email: string;
  appointment_id: number;
  meeting_purpose: string;
  status: string;
  meeting_type: string;
}

export interface StudentInSlotResponse {
  slot_id: number | null;
  date: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  period_label: string;
  meeting_location: string;
  meeting_link: string;
  meeting_type: string;
  students: StudentInSlot[];
  total_students: number;
  capacity: number;
}

export interface MeetingLogResponse {
  id: number;
  instructor_id: number;
  slot_id?: number;
  date: string;
  start_time: string;
  end_time: string;
  content: string;
  student_ids: number[];
  location?: string;
  created_at: Date;
  updated_at: Date;
}
