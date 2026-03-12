import apiClient from './apiClient';

// ──────────────────────────────────────────────────────────────────────────────
// DTOs (mirror the backend)
// ──────────────────────────────────────────────────────────────────────────────

export interface CreateEnrollmentDto {
  cert_type: string;
  target_band: string;
}

export interface CompleteTopicDto {
  topic_key: string;
}

export interface EnrollmentResponse {
  id: number;
  cert_type: string;
  target_band: string;
  status: 'active' | 'completed';
  enrolled_at: string;
  completed_at: string | null;
  completed_topics: string[];
  total_topics: number;
}

// ──────────────────────────────────────────────────────────────────────────────
// API calls
// ──────────────────────────────────────────────────────────────────────────────

/** Get the current active (or most-recent) enrollment for a cert type, or null. */
export async function getEnrollment(certType: string): Promise<EnrollmentResponse | null> {
  const res = await apiClient.get<EnrollmentResponse | null>(
    `/student/certificate/enrollment?certType=${encodeURIComponent(certType)}`
  );
  return res.data ?? null;
}

/** Get all enrollments (active + completed) for the current student. */
export async function getAllEnrollments(): Promise<EnrollmentResponse[]> {
  const res = await apiClient.get<EnrollmentResponse[]>('/student/certificate/enrollments');
  return res.data;
}

/** Create a new enrollment. Throws with backend error message on validation failure. */
export async function createEnrollment(dto: CreateEnrollmentDto): Promise<EnrollmentResponse> {
  const res = await apiClient.post<EnrollmentResponse>('/student/certificate/enroll', dto);
  return res.data;
}

/** Mark a topic as completed for an enrollment. */
export async function completeTopic(
  enrollmentId: number,
  topicKey: string
): Promise<EnrollmentResponse> {
  const res = await apiClient.patch<EnrollmentResponse>(
    `/student/certificate/enrollment/${enrollmentId}/complete-topic`,
    { topic_key: topicKey } satisfies CompleteTopicDto
  );
  return res.data;
}

/** Manually mark an entire band/level as completed. */
export async function completeBand(enrollmentId: number): Promise<EnrollmentResponse> {
  const res = await apiClient.patch<EnrollmentResponse>(
    `/student/certificate/enrollment/${enrollmentId}/complete`
  );
  return res.data;
}
