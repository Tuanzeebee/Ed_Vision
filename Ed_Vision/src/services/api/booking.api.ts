import apiClient from './apiClient';

export interface Appointment {
  appointment_id: number;
  slot_id: number;
  booker_account_id: number;
  booker_role: string;
  student_id?: number;
  instructor_id?: number;
  meeting_purpose?: string;
  status: string;
  cancel_reason?: string;
  created_at: string;
  updated_at?: string;
  canceled_at?: string;
  attendance_checked_at?: string;
  attendance_status?: string;
  attended?: boolean;
  meeting_type: 'online'| 'offline'| 'both';
  slot: {
    slot_id: number;
    date_id: number;
    start_time_local: string;
    end_time_local: string;
    period_label?: string;
    capacity: number;
    is_open: boolean;
    note?: string;
    auto_accept: boolean;
    meeting_link?: string;
    meeting_location?: string;
    meeting_type: 'online'| 'offline'| 'both';
    date: {
      date_id: number;
      week_id: number;
      specific_date: string;
      is_available: boolean;
      note?: string;
      created_at: string;
      week: {
        week_id: number;
        instructor_id: number;
        week_start_date: string;
        created_at: string;
      };
    };
  };
  instructor?: {
    instructor_id: number;
    account_id: number;
    employee_code: string;
    academic_title?: string;
    position?: string;
    department_id?: number;
    hire_date?: string;
    status: string;
    account: {
      account_id: number;
      profile?: {
        profile_id: number;
        account_id: number;
        full_name: string;
        phone_number?: string;
        date_of_birth?: string;
        gender?: string;
        address?: string;
        avatar_url?: string;
        nationality?: string;
      };
    };
  };
  student?: {
    student_id: number;
    account_id: number;
    student_code: string;
    major?: string;
    cohort_year?: number;
    class_id?: number;
    status: string;
    account: {
      account_id: number;
    };
  };
  appointmentContact?: {
    appointment_id: number;
    contact_name?: string;
    contact_phone?: string;
    contact_email?: string;
    relationship_to_student?: string;
  };
}

export class BookingApiService {
  /**
   * Get all appointments for the current user
   */
  static async getAppointments(): Promise<Appointment[]> {
    const response = await apiClient.get('/booking');
    return response.data;
  }

  /**
   * Cancel an appointment
   */
  static async cancelAppointment(appointmentId: number, reason?: string): Promise<void> {
    await apiClient.delete(`/booking/${appointmentId}`, {
      params: reason ? { reason } : undefined,
    });
  }

  /**
   * Update appointment status (for instructors)
   */
  static async updateAppointmentStatus(appointmentId: number, status: string): Promise<Appointment> {
    const response = await apiClient.put(`/booking/${appointmentId}/status`, { status });
    return response.data;
  }

  /**
   * Get appointment details by ID
   */
  static async getAppointmentById(appointmentId: number): Promise<Appointment> {
    const response = await apiClient.get(`/booking/${appointmentId}`);
    return response.data;
  }
}
