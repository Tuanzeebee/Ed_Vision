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
<<<<<<< HEAD
  status: "active" | "completed";
  learning_status: "not_started" | "in_progress" | "completed";
=======
  status: 'active'| 'completed';
  learning_status: 'not_started' | 'in_progress' | 'completed';
>>>>>>> origin/main
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

<<<<<<< HEAD
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
=======
export interface ToeicRepositoryOverviewItem {
  repository_id: number;
  slug: string;
  topic_key: string;
  title: string;
  description?: string | null;
  skill_area: 'listening' | 'reading' | 'grammar' | 'vocabulary' | string;
  milestone_score: number;
  unlock_score: number;
  question_count: number;
  estimated_minutes: number;
  is_unlocked: boolean;
}

export interface ToeicRepositoryOverviewResponse {
  current_score: number;
  target_score: number;
  projected_score: number;
  items: ToeicRepositoryOverviewItem[];
}

export interface ToeicRepositoryOption {
  id: number;
  option_key: string;
  option_text: string;
  is_correct: boolean;
  rationale?: string | null;
  sort_order: number;
}

export interface ToeicRepositoryItem {
  id: number;
  item_order: number;
  item_type: string;
  title?: string | null;
  stem: string;
  reading_passage?: string | null;
  media_audio_url?: string | null;
  explanation?: string | null;
  estimated_seconds?: number | null;
  score_weight: number;
  options: ToeicRepositoryOption[];
}

export interface ToeicRepositoryDetailResponse {
  repository_id: number;
  slug: string;
  title: string;
  description?: string | null;
  skill_area?: string | null;
  milestone_score: number;
  estimated_minutes: number;
  pass_score: number;
  total_items: number;
  items: ToeicRepositoryItem[];
}

export interface ToeicRepositorySubmitAnswer {
  item_id: number;
  option_id: number;
}

export interface ToeicRepositorySubmitRequest {
  answers: ToeicRepositorySubmitAnswer[];
  elapsed_seconds?: number;
}

export interface ToeicRepositorySubmitResponse {
  repository_id: number;
  slug: string;
  skill_area: string | null;
  correct_count: number;
  total_count: number;
  pass_score: number;
  is_passed: boolean;
  gained_score: number;
  projected_score: number;
  updated_plan: ToeicPlanSyncResponse;
}

export interface ToeicReadingImportPayload {
  file: File;
  repository_slug?: string;
  repository_title?: string;
  repository_description?: string;
  required_section_keywords?: string;
  excluded_section_keywords?: string;
  strict_section_filter?: boolean;
  milestone_score?: number;
  unlock_score?: number;
}

export interface ToeicReadingImportResponse {
  repository_id: number;
  slug: string;
  imported_count: number;
  skipped_count: number;
  total_rows: number;
}

export interface ToeicManualListeningCreatePayload {
  repository_slug?: string;
  repository_title?: string;
  repository_description?: string;
  milestone_score?: number;
  unlock_score?: number;
  item_order?: number;
  title?: string;
  stem: string;
  reading_passage?: string;
  explanation?: string;
  estimated_seconds?: number;
  options_json?: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  correct_option_key?: string;
  audio_file?: File;
  image_file?: File;
}

export interface ToeicManualListeningCreateResponse {
  repository_id: number;
  slug: string;
  item_id: number;
  item_order: number;
  media_audio_url?: string | null;
  media_image_url?: string | null;
}

export interface ToeicExplainAnswerRequest {
  item_id: number;
  selected_option_id: number;
}

export interface ToeicExplainAnswerResponse {
  item_id: number;
  selected_option_id: number;
  correct_option_id: number;
  is_correct: boolean;
  explanation: string;
  model: string;
  source: 'cache' | 'ollama' | 'fallback';
}

function appendFormDataValue(formData: FormData, key: string, value: string | number | boolean | undefined): void {
  if (value === undefined) return;
  formData.append(key, String(value));
>>>>>>> origin/main
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
<<<<<<< HEAD
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
=======
  const res = await apiClient.get<ToeicPlanSyncResponse | null>('/student/certificate/toeic-plan');
  return res.data ?? null;
}

export async function saveToeicPlanSync(payload: ToeicPlanSyncPayload): Promise<ToeicPlanSyncResponse> {
  const res = await apiClient.patch<ToeicPlanSyncResponse>('/student/certificate/toeic-plan', payload);
  return res.data;
}

export async function getToeicLeaderboard(limit = 10): Promise<ToeicLeaderboardEntry[]> {
  const res = await apiClient.get<ToeicLeaderboardEntry[]>(`/student/certificate/toeic-leaderboard?limit=${limit}`);
  return Array.isArray(res.data) ? res.data : [];
}

export async function getToeicRepositoryOverview(): Promise<ToeicRepositoryOverviewResponse> {
  const res = await apiClient.get<ToeicRepositoryOverviewResponse>('/student/certificate/toeic-repository/overview');
  return res.data;
}

export async function getToeicRepositoryDetail(slug: string): Promise<ToeicRepositoryDetailResponse> {
  const res = await apiClient.get<ToeicRepositoryDetailResponse>(`/student/certificate/toeic-repository/${encodeURIComponent(slug)}`);
  return res.data;
}

export async function submitToeicRepositoryAnswers(
  slug: string,
  payload: ToeicRepositorySubmitRequest,
): Promise<ToeicRepositorySubmitResponse> {
  const res = await apiClient.post<ToeicRepositorySubmitResponse>(
    `/student/certificate/toeic-repository/${encodeURIComponent(slug)}/submit`,
    payload,
  );
  return res.data;
}

export async function importToeicReadingFromFile(
  payload: ToeicReadingImportPayload,
): Promise<ToeicReadingImportResponse> {
  const formData = new FormData();
  formData.append('file', payload.file);
  appendFormDataValue(formData, 'repository_slug', payload.repository_slug);
  appendFormDataValue(formData, 'repository_title', payload.repository_title);
  appendFormDataValue(formData, 'repository_description', payload.repository_description);
  appendFormDataValue(formData, 'required_section_keywords', payload.required_section_keywords);
  appendFormDataValue(formData, 'excluded_section_keywords', payload.excluded_section_keywords);
  appendFormDataValue(formData, 'strict_section_filter', payload.strict_section_filter);
  appendFormDataValue(formData, 'milestone_score', payload.milestone_score);
  appendFormDataValue(formData, 'unlock_score', payload.unlock_score);

  const res = await apiClient.post<ToeicReadingImportResponse>(
    '/student/certificate/toeic-repository/import-reading-file',
    formData,
  );
  return res.data;
}

export async function createToeicListeningManualItem(
  payload: ToeicManualListeningCreatePayload,
): Promise<ToeicManualListeningCreateResponse> {
  const formData = new FormData();
  appendFormDataValue(formData, 'repository_slug', payload.repository_slug);
  appendFormDataValue(formData, 'repository_title', payload.repository_title);
  appendFormDataValue(formData, 'repository_description', payload.repository_description);
  appendFormDataValue(formData, 'milestone_score', payload.milestone_score);
  appendFormDataValue(formData, 'unlock_score', payload.unlock_score);
  appendFormDataValue(formData, 'item_order', payload.item_order);
  appendFormDataValue(formData, 'title', payload.title);
  appendFormDataValue(formData, 'stem', payload.stem);
  appendFormDataValue(formData, 'reading_passage', payload.reading_passage);
  appendFormDataValue(formData, 'explanation', payload.explanation);
  appendFormDataValue(formData, 'estimated_seconds', payload.estimated_seconds);
  appendFormDataValue(formData, 'options_json', payload.options_json);
  appendFormDataValue(formData, 'option_a', payload.option_a);
  appendFormDataValue(formData, 'option_b', payload.option_b);
  appendFormDataValue(formData, 'option_c', payload.option_c);
  appendFormDataValue(formData, 'option_d', payload.option_d);
  appendFormDataValue(formData, 'correct_option_key', payload.correct_option_key);
  if (payload.audio_file) {
    formData.append('audio_file', payload.audio_file);
  }
  if (payload.image_file) {
    formData.append('image_file', payload.image_file);
  }

  const res = await apiClient.post<ToeicManualListeningCreateResponse>(
    '/student/certificate/toeic-repository/listening/manual-item',
    formData,
  );
  return res.data;
}

export async function explainToeicAnswer(
  slug: string,
  payload: ToeicExplainAnswerRequest,
): Promise<ToeicExplainAnswerResponse> {
  const res = await apiClient.post<ToeicExplainAnswerResponse>(
    `/student/certificate/toeic-repository/${encodeURIComponent(slug)}/explain-answer`,
    payload,
  );
>>>>>>> origin/main
  return res.data;
}
