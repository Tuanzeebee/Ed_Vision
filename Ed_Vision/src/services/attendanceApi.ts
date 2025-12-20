import apiClient from './api/apiClient';

export interface CreateSessionDto {
  appointmentId?: number;
  slotId?: number;
  qrRefreshInterval?: number;
  qrExpirySeconds?: number;
}

export interface QRCodeResponse {
  sessionId: string;
  qrToken: string;
  qrData: string;
  expiresAt: string;
  refreshInterval: number;
}

export interface VerifyAttendanceDto {
  sessionId: string;
  qrToken: string;
  deviceFingerprint: string;
  networkContext?: {
    ipAddress: string;
    wifiSSID?: string;
  };
  gpsData?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
}

export interface AttendanceAttempt {
  attemptId: number;
  accountId: number;
  accountName: string;
  accountType: 'student' | 'parent';
  timestamp: string;
  trustScore: number;
  status: 'verified' | 'pending' | 'rejected';
  verificationDetails: any;
}

export interface SessionStatusResponse {
  sessionId: string;
  appointmentId: number;
  status: 'active' | 'ended';
  startedAt: string;
  endedAt?: string;
  attempts: AttendanceAttempt[];
  verifiedCount: number;
  pendingCount: number;
}

const attendanceApi = {
  // Create a new attendance session
  createSession: async (data: CreateSessionDto): Promise<{ session_id: string; appointment_id?: number; instructor_id: number; student_id?: number; started_at: string; status: string; qr_refresh_interval: number; qr_expiry_seconds: number }> => {
    const response = await apiClient.post('/attendance/session', data);
    return response.data;
  },

  // Get current QR code for a session
  getQRCode: async (sessionId: string): Promise<QRCodeResponse> => {
    const response = await apiClient.get(`/attendance/session/${sessionId}/qr`);
    return response.data;
  },

  // Verify attendance (for student/parent)
  verifyAttendance: async (data: VerifyAttendanceDto): Promise<any> => {
    const response = await apiClient.post('/attendance/verify', data);
    return response.data;
  },

  // Get session status and attempts
  getSessionStatus: async (sessionId: string): Promise<SessionStatusResponse> => {
    const response = await apiClient.get(`/attendance/session/${sessionId}`);
    return response.data;
  },

  // Approve a pending attempt
  approveAttempt: async (attemptId: number, approved: boolean): Promise<any> => {
    const response = await apiClient.put(`/attendance/attempt/${attemptId}/approve`, {
      approved,
    });
    return response.data;
  },

  // End session
  endSession: async (sessionId: string): Promise<any> => {
    const response = await apiClient.put(`/attendance/session/${sessionId}/end`);
    return response.data;
  },
};

export default attendanceApi;
