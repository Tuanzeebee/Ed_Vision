import apiClient from "./apiClient";

// ──────────────────────────────────────────────────────────────────────────────
// DTOs (mirror the backend)
// ──────────────────────────────────────────────────────────────────────────────

export interface CreateEnrollmentDto {
  cert_type: string;
  target_score?: number;
}

export interface CompleteTopicDto {
  topic_key: string;
}

export interface EnrollmentResponse {
  id: number;
  cert_type: string;
  status: "active" | "completed";
  learning_status: "not_started" | "in_progress" | "completed";
  progress_percent: number;
  current_score?: number | null;
  target_score?: number | null;
  enrolled_at: string;
  completed_at: string | null;
  completed_topics: string[];
  total_topics: number;
}

export interface ToeicPlanSyncPayload {
  current_score: number;
  target_score: number;
  total_boost: number;
  listening_sessions: number;
  reading_sessions: number;
  foundation_completed: string[];
  foundation_skipped: boolean;
  first_guide_shown?: boolean;
  has_activity?: boolean;
}

export interface ToeicPlanSyncResponse {
  current_score: number;
  target_score: number;
  total_boost: number;
  listening_sessions: number;
  reading_sessions: number;
  foundation_completed: string[];
  foundation_skipped: boolean;
  first_guide_shown: boolean;
}

export interface ToeicLeaderboardEntry {
  account_id: number;
  name: string;
  score: number;
  streak: number;
  isCurrentUser: boolean;
}

export interface CertificateTutorAskPayload {
  cert_type: string;
  question: string;
  topic_key?: string;
  learning_context?: string;
  concise?: boolean;
}

export interface CertificateTutorAskResponse {
  cert_type: string;
  answer: string;
  model: string;
  source: "cache" | "ollama" | "fallback";
}

// ──────────────────────────────────────────────────────────────────────────────
// API calls
// ──────────────────────────────────────────────────────────────────────────────

/** Get the current active (or most-recent) enrollment for a cert type, or null. */
export async function getEnrollment(
  certType: string,
): Promise<EnrollmentResponse | null> {
  const res = await apiClient.get<EnrollmentResponse | null>(
    `/student/certificate/enrollment?certType=${encodeURIComponent(certType)}`,
  );
  return res.data ?? null;
}

/** Get all enrollments (active + completed) for the current student. */
export async function getAllEnrollments(): Promise<EnrollmentResponse[]> {
  const res = await apiClient.get<EnrollmentResponse[]>(
    "/student/certificate/enrollments",
  );
  return res.data;
}

/** Create a new enrollment. Throws with backend error message on validation failure. */
export async function createEnrollment(
  dto: CreateEnrollmentDto,
): Promise<EnrollmentResponse> {
  const res = await apiClient.post<EnrollmentResponse>(
    "/student/certificate/enroll",
    dto,
  );
  return res.data;
}

/** Mark a topic as completed for an enrollment. */
export async function completeTopic(
  enrollmentId: number,
  topicKey: string,
): Promise<EnrollmentResponse> {
  const res = await apiClient.patch<EnrollmentResponse>(
    `/student/certificate/enrollment/${enrollmentId}/complete-topic`,
    { topic_key: topicKey } satisfies CompleteTopicDto,
  );
  return res.data;
}

/** Manually mark an entire band/level as completed. */
export async function completeBand(
  enrollmentId: number,
): Promise<EnrollmentResponse> {
  const res = await apiClient.patch<EnrollmentResponse>(
    `/student/certificate/enrollment/${enrollmentId}/complete`,
  );
  return res.data;
}

export async function getToeicPlanSync(): Promise<ToeicPlanSyncResponse | null> {
  const res = await apiClient.get<ToeicPlanSyncResponse | null>(
    "/student/certificate/toeic-plan",
  );
  return res.data ?? null;
}

export async function saveToeicPlanSync(
  payload: ToeicPlanSyncPayload,
): Promise<ToeicPlanSyncResponse> {
  const res = await apiClient.patch<ToeicPlanSyncResponse>(
    "/student/certificate/toeic-plan",
    payload,
  );
  return res.data;
}

export async function getToeicLeaderboard(
  limit = 10,
): Promise<ToeicLeaderboardEntry[]> {
  const res = await apiClient.get<ToeicLeaderboardEntry[]>(
    `/student/certificate/toeic-leaderboard?limit=${limit}`,
  );
  return Array.isArray(res.data) ? res.data : [];
}

export async function askCertificateTutor(
  payload: CertificateTutorAskPayload,
): Promise<CertificateTutorAskResponse> {
  const FRONTEND_TIMEOUT_MS = 60_000;

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(
      () =>
        reject(
          new Error("AI timeout — model phản hồi quá chậm. Vui lòng thử lại."),
        ),
      FRONTEND_TIMEOUT_MS,
    ),
  );

  const requestPromise = apiClient.post<CertificateTutorAskResponse>(
    "/student/certificate/ai-tutor/ask",
    payload,
  );

  const res = await Promise.race([requestPromise, timeoutPromise]);
  return res.data;
}
