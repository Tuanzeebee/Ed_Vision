import { buildUrl } from './config';

export interface InstructorInfo {
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
  student_id: number; // Explicit student_id
  account_id: number; // Account ID của student
  student_code: string;
  name: string;
  class_name: string;
  email: string;
  appointment_id: number;
  meeting_purpose: string;
  status: string;
  meeting_type: string;
}

export interface SlotStudentsResponse {
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

export interface CreateMeetingLogRequest {
  instructor_id: number;
  slot_id?: number;
  date: string;
  start_time: string;
  end_time: string;
  content: string;
  student_ids: number[];
  location?: string;
}

export interface MeetingLog {
  id: number;
  instructor_id: number;
  slot_id?: number;
  date: string;
  start_time: string;
  end_time: string;
  content: string;
  student_ids: number[];
  location?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Lấy thông tin instructor theo account_id
 */
export const getInstructorInfo = async (accountId: number): Promise<InstructorInfo> => {
  const url = buildUrl(`/teacher/meeting-logs/instructor/${accountId}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch instructor info');
  }
  return response.json();
};

/**
 * Lấy danh sách sinh viên đã đặt lịch cho slot cụ thể
 */
export const getStudentsBySlot = async (slotId: number): Promise<SlotStudentsResponse> => {
  const url = buildUrl(`/teacher/meeting-logs/slot/${slotId}/students`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch students by slot');
  }
  return response.json();
};

/**
 * Lấy danh sách sinh viên theo thời gian cụ thể
 */
export const getStudentsByTimeSlot = async (
  instructorId: number,
  date: string,
  startTime: string,
  endTime: string
): Promise<SlotStudentsResponse> => {
  const params = new URLSearchParams({
    instructorId: instructorId.toString(),
    date,
    startTime,
    endTime,
  });
  const url = buildUrl(`/teacher/meeting-logs/time-slot?${params}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch students by time slot');
  }
  return response.json();
};

/**
 * Tạo nhật ký cuộc họp mới
 */
export const createMeetingLog = async (
  data: CreateMeetingLogRequest
): Promise<MeetingLog> => {
  const url = buildUrl(`/teacher/meeting-logs`);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to create meeting log');
  }
  return response.json();
};

/**
 * Lấy danh sách nhật ký của instructor
 */
export const getMeetingLogs = async (
  instructorId: number,
  startDate?: string,
  endDate?: string
): Promise<MeetingLog[]> => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  const url = buildUrl(
    `/teacher/meeting-logs/instructor/${instructorId}/logs?${params}`
  );
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch meeting logs');
  }
  return response.json();
};
