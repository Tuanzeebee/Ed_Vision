import apiClient from "./apiClient";
import { tryDecryptString, decryptRecord } from "../cryptoUtils";

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
  exam_score?: number | null;
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
  progress_percent?: number;
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
  listening_baseline?: number;
  reading_baseline?: number;
  has_taken_listening_exam?: boolean;
  has_taken_reading_exam?: boolean;
}

export interface ToeicLeaderboardEntry {
  account_id: number;
  name: string;
  score: number;
  streak: number;
  isCurrentUser: boolean;
}

export interface ToeicRepositoryOptionResponse {
  id: number;
  option_key: "A" | "B" | "C" | "D";
  option_text: string;
  is_correct: boolean;
  rationale?: string | null;
  sort_order?: number;
  option_audio_url?: string | null;
}

export interface ToeicRepositoryDetailResponse {
  repository_id: number;
  slug: string;
  title: string;
  description?: string | null;
  skill_area: "listening" | "reading" | "grammar" | string;
  full_audio_url?: string | null;
  total_items: number;
  pass_score: number;
  answer_key_configured_items?: number;
  answer_key_missing_items?: number;
  answer_key_ready?: boolean;
  active_session_id?: number | null;
  items: Array<{
    id: number;
    item_order: number;
    part?: number | null;
    title?: string | null;
    stem?: string | null;
    reading_passage?: string | null;
    media_audio_url?: string | null;
    media_image_url?: string | null;
    explanation?: string | null;
    score_weight?: number | null;
    estimated_seconds?: number | null;
    options: ToeicRepositoryOptionResponse[];
  }>;
}

export interface ToeicExplainAnswerPayload {
  item_id: number;
  selected_option_id: number;
}

export interface ToeicExplainAnswerResponse {
  item_id: number;
  selected_option_id: number;
  correct_option_id: number;
  is_correct: boolean;
  explanation: string | null;
  model: string;
  source: "cache" | "ollama" | "fallback" | "skipped";
}

export interface ToeicOcrImportPayload {
  repository_slug?: string;
  repository_title?: string;
  repository_description?: string;
  skill_area?: "listening" | "reading";
  replace_existing?: boolean;
  exam_year?: number;
}

export interface ToeicOcrImportResponse {
  repository_id: number;
  slug: string;
  skill_area: "listening" | "reading";
  imported_count: number;
  skipped_count: number;
  total_detected: number;
  source_filename: string;
}

export interface IeltsOcrImportPayload {
  repository_slug: string;
  repository_title: string;
  repository_description?: string;
  skill_area?: "listening" | "reading" | "speaking" | "writing";
  replace_existing?: boolean;
  band_range?: string;
  exam_year?: string;
  audio_url?: string;
}

export interface IeltsOcrImportResponse {
  repository_id: number;
  slug: string;
  skill_area: string;
  imported_count: number;
  skipped_count: number;
  total_detected: number;
  source_filename: string;
  passages?: number;
}

export interface ToeicAnswerKeyImportPayload {
  repository_slug: string;
  clear_existing?: boolean;
}

export interface ToeicAnswerKeyImportResponse {
  repository_id: number;
  slug: string;
  skill_area: "listening" | "reading";
  source_filename: string;
  total_answers_detected: number;
  applied_items: number;
  unanswered_items: number;
  unknown_question_numbers: number[];
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

export interface ToeicSkillFeedbackResponse {
  answer: string;
  model: string;
  source: "cache" | "ollama" | "fallback" | "static";
  window: "week" | "day";
  current: { listening: number; reading: number };
  previous: { listening: number; reading: number };
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

export async function resetToeicProgress(): Promise<{ success: boolean }> {
  const res = await apiClient.post<{ success: boolean }>(
    "/student/certificate/toeic/reset-progress",
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

export async function getToeicExamRepositoryDetail(
  examType: "listening" | "reading",
): Promise<ToeicRepositoryDetailResponse> {
  const res = await apiClient.get<ToeicRepositoryDetailResponse>(
    `/student/certificate/toeic-repository/exam/${encodeURIComponent(examType)}`,
  );
  return decryptRepositoryDetail(res.data);
}

// ── TOEIC Exam Simulation Session (server-driven countdown + resume) ─────────

export interface ExamSessionAnswer {
  question_id: number;
  selected_key: "A" | "B" | "C" | "D" | null;
  is_flagged: boolean;
}

export interface ExamSessionState {
  session_id: number;
  repository_id: number;
  repository_slug: string;
  repository_title: string;
  started_at: string;
  duration_sec: number;
  remaining_sec: number;
  submitted_at: string | null;
  auto_submitted: boolean;
  current_index: number;
  total_questions: number;
  answers: ExamSessionAnswer[];
}

export interface ExamSubmitResult {
  session_id: number;
  correct_count: number;
  total_count: number;
  total_score: number;
  auto_submitted: boolean;
  submitted_at: string;
  question_results: Array<{
    question_id: number;
    selected_key: string | null;
    correct_key: string | null;
    is_correct: boolean;
  }>;
}

export async function startExamSession(
  repositorySlug: string,
  durationSecHint?: number,
): Promise<ExamSessionState> {
  const res = await apiClient.post<ExamSessionState>(
    `/student/certificate/toeic-exam/start`,
    { repository_slug: repositorySlug, duration_sec_hint: durationSecHint },
  );
  return res.data;
}

export async function getExamSession(
  sessionId: number,
): Promise<ExamSessionState> {
  const res = await apiClient.get<ExamSessionState>(
    `/student/certificate/toeic-exam/${sessionId}`,
  );
  return res.data;
}

export async function upsertExamAnswer(
  sessionId: number,
  payload: {
    question_id: number;
    selected_key: "A" | "B" | "C" | "D" | null;
    is_flagged?: boolean;
  },
): Promise<{ ok: true; remaining_sec: number }> {
  const res = await apiClient.patch<{ ok: true; remaining_sec: number }>(
    `/student/certificate/toeic-exam/${sessionId}/answer`,
    payload,
  );
  return res.data;
}

export async function updateExamCursor(
  sessionId: number,
  currentIndex: number,
): Promise<{ ok: true }> {
  const res = await apiClient.patch<{ ok: true }>(
    `/student/certificate/toeic-exam/${sessionId}/cursor`,
    { current_index: currentIndex },
  );
  return res.data;
}

export async function submitExamSession(
  sessionId: number,
  reason: "manual" | "timeout" = "manual",
): Promise<ExamSubmitResult> {
  const res = await apiClient.post<ExamSubmitResult>(
    `/student/certificate/toeic-exam/${sessionId}/submit`,
    { reason },
  );
  return res.data;
}

export async function explainToeicAnswer(
  slug: string,
  payload: ToeicExplainAnswerPayload,
): Promise<ToeicExplainAnswerResponse> {
  const res = await apiClient.post<ToeicExplainAnswerResponse>(
    `/student/certificate/toeic-repository/${encodeURIComponent(slug)}/explain-answer`,
    payload,
  );
  const data = res.data;
  if (data.explanation) {
    data.explanation =
      (await tryDecryptString(data.explanation)) ?? data.explanation;
  }
  return data;
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

export async function getToeicSkillFeedback(): Promise<
  ToeicSkillFeedbackResponse
> {
  const res = await apiClient.get<ToeicSkillFeedbackResponse>(
    "/student/certificate/toeic/skill-feedback",
  );
  return res.data;
}

export interface ToeicChatGroqMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ToeicChatGroqPayload {
  question_id: number;
  user_message: string;
  chat_history?: ToeicChatGroqMessage[];
}

export interface ToeicChatGroqResponse {
  answer: string;
}

export async function chatGroqTutor(
  payload: ToeicChatGroqPayload,
): Promise<ToeicChatGroqResponse> {
  const res = await apiClient.post<ToeicChatGroqResponse>(
    "/student/certificate/ai-tutor/groq-chat",
    payload,
  );
  return res.data;
}

export interface IeltsChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface IeltsChatGroqPayload {
  skill: "listening" | "reading" | "writing" | "speaking" | "vocabulary" | "grammar";
  context_text: string;
  user_message: string;
  chat_history?: IeltsChatMessage[];
  band_target?: number;
}

export interface IeltsChatGroqResponse {
  answer: string;
}

export async function chatIeltsGroqTutor(
  payload: IeltsChatGroqPayload,
): Promise<IeltsChatGroqResponse> {
  const res = await apiClient.post<IeltsChatGroqResponse>(
    "/ielts-adaptive/groq-tutor/chat",
    payload,
  );
  return res.data;
}

/**
 * Stream chat tutor qua SSE.
 * onToken: callback nhận từng token text
 * onDone: callback khi stream kết thúc
 * onError: callback khi có lỗi
 * Returns: abort function để cancel stream
 */
export function streamChatTutor(
  payload: ToeicChatGroqPayload,
  onToken: (token: string) => void,
  onDone: () => void,
  onError: (msg: string) => void,
): () => void {
  const controller = new AbortController();

  const token = localStorage.getItem("token") ?? "";
  const baseUrl = (import.meta.env.VITE_API_BASE_URL as string) ?? "";

  (async () => {
    try {
      const res = await fetch(
        `${baseUrl}/student/certificate/ai-tutor/stream-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          signal: controller.signal,
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok || !res.body) {
        onError("Lỗi kết nối trợ lý AI.");
        onDone();
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (data === "[DONE]") {
            onDone();
            return;
          }
          try {
            const parsed = JSON.parse(data) as {
              token?: string;
              error?: string;
            };
            if (parsed.error) {
              onError(parsed.error);
              onDone();
              return;
            }
            if (parsed.token) onToken(parsed.token);
          } catch {
            /* ignore */
          }
        }
      }
      onDone();
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      onError("Đã có lỗi xảy ra. Vui lòng thử lại sau.");
      onDone();
    }
  })();

  return () => controller.abort();
}

export async function importToeicExamFromOcrFile(
  payload: ToeicOcrImportPayload,
  file: File,
): Promise<ToeicOcrImportResponse> {
  const formData = new FormData();
  formData.append("file", file);

  if (payload.repository_slug) {
    formData.append("repository_slug", payload.repository_slug);
  }
  if (payload.repository_title) {
    formData.append("repository_title", payload.repository_title);
  }
  if (payload.repository_description) {
    formData.append("repository_description", payload.repository_description);
  }
  if (payload.skill_area) {
    formData.append("skill_area", payload.skill_area);
  }
  if (typeof payload.replace_existing === "boolean") {
    formData.append("replace_existing", String(payload.replace_existing));
  }
  if (typeof payload.exam_year === "number") {
    formData.append("exam_year", String(payload.exam_year));
  }

  const res = await apiClient.post<ToeicOcrImportResponse>(
    "/teacher/toeic-repository/import-ocr-file",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return res.data;
}

export async function importToeicAnswerKeyFromFile(
  payload: ToeicAnswerKeyImportPayload,
  file: File,
): Promise<ToeicAnswerKeyImportResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("repository_slug", payload.repository_slug);

  if (typeof payload.clear_existing === "boolean") {
    formData.append("clear_existing", String(payload.clear_existing));
  }

  const res = await apiClient.post<ToeicAnswerKeyImportResponse>(
    "/teacher/toeic-repository/import-answer-key-file",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return res.data;
}

export async function importDiagnosticAnswerKey(
  payload: { repository_slug: string },
  file: File,
): Promise<any> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("repository_slug", payload.repository_slug);

  const res = await apiClient.post<any>(
    "/teacher/toeic-repository/import-diagnostic-answer-key",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return res.data;
}

export async function importIeltsExamFromOcrFile(
  payload: IeltsOcrImportPayload,
  file: File,
): Promise<IeltsOcrImportResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("repository_slug", payload.repository_slug);
  formData.append("repository_title", payload.repository_title);

  if (payload.repository_description) {
    formData.append("repository_description", payload.repository_description);
  }
  if (payload.skill_area) {
    formData.append("skill_area", payload.skill_area);
  }
  if (typeof payload.replace_existing === "boolean") {
    formData.append("replace_existing", String(payload.replace_existing));
  }
  if (payload.band_range) {
    formData.append("band_range", payload.band_range);
  }
  if (payload.exam_year) {
    formData.append("exam_year", payload.exam_year);
  }
  if (payload.audio_url) {
    formData.append("audio_url", payload.audio_url);
  }

  const res = await apiClient.post<IeltsOcrImportResponse>(
    "/teacher/ielts-repository/import-ocr",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return res.data;
}

// ── Listening Import ──────────────────────────────────────────────────────────

export interface ToeicListeningImageAsset {
  filename: string;
  url: string;
  page: number;
  part_hint: number;
  width: number;
  height: number;
  size_bytes: number;
}

export interface ToeicListeningImportPayload {
  repository_slug?: string;
  repository_title?: string;
  replace_existing?: boolean;
  exam_year?: number;
}

export interface ToeicListeningImportResponse {
  repository_id: number;
  slug: string;
  skill_area: "listening";
  imported_count: number;
  skipped_count: number;
  total_detected: number;
  source_filename: string;
  image_assets: ToeicListeningImageAsset[];
  image_extract_error?: string;
}

export async function importToeicListeningFromPdfFile(
  payload: ToeicListeningImportPayload,
  file: File,
): Promise<ToeicListeningImportResponse> {
  const formData = new FormData();
  formData.append("file", file);
  if (payload.repository_slug)
    formData.append("repository_slug", payload.repository_slug);
  if (payload.repository_title)
    formData.append("repository_title", payload.repository_title);
  if (typeof payload.replace_existing === "boolean")
    formData.append("replace_existing", String(payload.replace_existing));
  if (typeof payload.exam_year === "number")
    formData.append("exam_year", String(payload.exam_year));

  const res = await apiClient.post<ToeicListeningImportResponse>(
    "/teacher/toeic-repository/import-listening-file",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data;
}

// ── Audio Chunking ────────────────────────────────────────────────────────────

export interface ToeicAudioChunk {
  filename: string;
  url: string;
  part: number;
  question_number: number;
  type: "question" | "talk";
  duration_seconds: number;
  transcript_hint?: string;
}

export interface ToeicAudioChunkResponse {
  repository_id: number;
  slug: string;
  method_used: string;
  total_chunks: number;
  chunks: ToeicAudioChunk[];
  auto_mapped_count: number;
}

export async function chunkListeningAudio(
  payload: { repository_slug: string; method?: string; auto_map?: boolean },
  file: File,
): Promise<ToeicAudioChunkResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("repository_slug", payload.repository_slug);
  if (payload.method) formData.append("method", payload.method);
  if (typeof payload.auto_map === "boolean")
    formData.append("auto_map", String(payload.auto_map));
  const res = await apiClient.post<ToeicAudioChunkResponse>(
    "/teacher/toeic-repository/chunk-listening-audio",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data;
}

export interface FullAudioUploadResponse {
  slug: string;
  full_audio_url: string;
}

export async function uploadFullListeningAudio(
  repositorySlug: string,
  file: File,
): Promise<FullAudioUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("repository_slug", repositorySlug);
  const res = await apiClient.post<FullAudioUploadResponse>(
    "/teacher/toeic-repository/upload-full-audio",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data;
}

// ── Repository Management ─────────────────────────────────────────────────────

export interface ToeicRepositoryListItem {
  id: number;
  slug: string;
  title: string;
  skill_area: string;
  total_items: number;
  is_published: boolean;
  created_at: string;
  has_answer_key?: boolean;
}

export interface IeltsRepositoryListItem {
  id: number;
  slug: string;
  title: string;
  skill_area: string;
  total_items: number;
  is_published: boolean;
  created_at: string;
  has_answer_key?: boolean;
}

export async function listToeicRepositories(
  skillArea?: string,
): Promise<ToeicRepositoryListItem[]> {
  const params = skillArea ? `?skill_area=${skillArea}` : "";
  const res = await apiClient.get<ToeicRepositoryListItem[]>(
    `/teacher/toeic-repository/list${params}`,
  );
  return res.data;
}

export async function deleteToeicRepository(
  slug: string,
): Promise<{ slug: string; deleted: boolean; items_deleted: number }> {
  const res = await apiClient.delete(
    `/teacher/toeic-repository/${encodeURIComponent(slug)}`,
  );
  return res.data;
}

export interface DiagnosticRepositoryListItem {
  id: number;
  cert_type: string;
  title: string;
  slug: string;
  description: string | null;
  total_items: number;
  created_at: string;
  has_answer_key?: boolean;
}

export interface PracticeSetListItem {
  practice_set_id: string;
  skill_area: string;
  total_items: number;
  created_at: string;
  has_answer_key?: boolean;
}

export async function listDiagnosticRepositories(): Promise<DiagnosticRepositoryListItem[]> {
  const res = await apiClient.get<DiagnosticRepositoryListItem[]>(
    "/teacher/toeic-repository/diagnostic/list",
  );
  return res.data;
}

export async function deleteDiagnosticRepository(
  slug: string,
): Promise<{ slug: string; deleted: boolean }> {
  const res = await apiClient.delete(
    `/teacher/toeic-repository/diagnostic/${encodeURIComponent(slug)}`,
  );
  return res.data;
}

export async function listToeicPracticeSets(): Promise<PracticeSetListItem[]> {
  const res = await apiClient.get<PracticeSetListItem[]>(
    "/teacher/toeic-repository/practice/list",
  );
  return res.data;
}

export async function deleteToeicPracticeSet(
  practiceSetId: string,
): Promise<{ practice_set_id: string; deleted: boolean }> {
  const res = await apiClient.delete(
    `/teacher/toeic-repository/practice-set/${encodeURIComponent(practiceSetId)}`,
  );
  return res.data;
}

export async function listIeltsRepositories(
  skillArea?: string,
): Promise<IeltsRepositoryListItem[]> {
  const params = skillArea ? `?skill_area=${skillArea}` : "";
  const res = await apiClient.get<IeltsRepositoryListItem[]>(
    `/teacher/ielts-repository/list${params}`,
  );
  return res.data;
}

export async function deleteIeltsRepository(
  slug: string,
): Promise<{ slug: string; deleted: boolean; items_deleted: number }> {
  const res = await apiClient.delete(
    `/teacher/ielts-repository/${encodeURIComponent(slug)}`,
  );
  return res.data;
}

// ── TOEIC Practice Session ────────────────────────────────────────────────────

export interface ToeicPracticeQuestionOption {
  id: number;
  option_key: string;
  option_text: string;
  is_correct: boolean;
  sort_order?: number;
}

export interface ToeicPracticeQuestion {
  id: number;
  stem: string;
  reading_passage?: string | null;
  context_image?: string | null;
  context_audio?: string | null;
  ai_explanation?: string | null;
  options: ToeicPracticeQuestionOption[];
}

export interface ToeicPracticeQuestionsResponse {
  part: number;
  skill_area: "listening" | "reading";
  score_band_min: number;
  score_band_max: number;
  unlock_threshold: number;
  current_reserve_points: number;
  questions: ToeicPracticeQuestion[];
}

export interface ToeicPracticeSessionSubmitPayload {
  toeic_part: number;
  question_ids: number[];
  answers: Record<string, string>;
}

export interface ToeicPracticeSessionSubmitResponse {
  toeic_part: number;
  correct_count: number;
  total_questions: number;
  earned_points: number;
  attempt_points?: number;
  previous_best_points_for_part?: number;
  best_points_for_part?: number;
  awarded_points?: number;
  new_reserve_points: number;
  unlock_threshold: number;
  exam_unlocked: boolean;
  correct_answers: Record<string, string>;
  explanations: Record<string, string | null>;
}

export interface ToeicReservePointsPartSession {
  toeic_part: number;
  correct_count: number;
  total_questions: number;
  earned_points: number;
  completed_at: string | null;
}

export interface ToeicReservePointsResponse {
  reserve_points: number;
  exam_unlocked: boolean;
  unlock_threshold: number;
  part_sessions: ToeicReservePointsPartSession[];
  // Aggregate stats across ALL practice sessions (not just the 20 recent).
  exam_sessions_count?: number;
  listening_sessions_count?: number;
  reading_sessions_count?: number;
  listening_correct?: number;
  listening_total?: number;
  reading_correct?: number;
  reading_total?: number;
  listening_accuracy?: number;
  reading_accuracy?: number;
  completed_parts?: number[];
}

export async function getToeicPracticeQuestions(
  part: number,
  count?: number,
): Promise<ToeicPracticeQuestionsResponse> {
  const url = count !== undefined
    ? `/student/certificate/toeic/practice-questions/${part}?count=${count}`
    : `/student/certificate/toeic/practice-questions/${part}`;
  const res = await apiClient.get<ToeicPracticeQuestionsResponse>(url);
  return decryptPracticeQuestionsResponse(res.data);
}

export async function submitToeicPracticeSession(
  payload: ToeicPracticeSessionSubmitPayload,
): Promise<ToeicPracticeSessionSubmitResponse> {
  const res = await apiClient.post<ToeicPracticeSessionSubmitResponse>(
    "/student/certificate/toeic/practice-session/submit",
    payload,
  );
  return decryptPracticeSessionSubmitResponse(res.data);
}

export async function getToeicReservePoints(): Promise<ToeicReservePointsResponse> {
  const res = await apiClient.get<ToeicReservePointsResponse>(
    "/student/certificate/toeic/reserve-points",
  );
  return res.data;
}

// ─── Personal Scores (Điểm Gốc + Điểm Ôn Tập + EXP) ──────────────────────

export interface PersonalScoresResponse {
  current_score: number | null; // Điểm Gốc (from diagnostic test)
  reserve_points: number; // Điểm Ôn Tập (accumulated from practice)
  target_score: number | null; // Điểm mục tiêu
  exam_score: number | null; // Điểm thi thử gần nhất
  total_exp: number; // Tổng EXP tích lũy
  weekly_exp: number; // EXP tuần này
  exam_simulation_unlocked: boolean; // Đã mở khóa thi thử chưa
  progress_percent: number; // % tiến độ đến target_score
  remaining_points: number | null; // Điểm còn cần tích lũy
}

export async function getPersonalScores(): Promise<PersonalScoresResponse> {
  const res = await apiClient.get<PersonalScoresResponse>(
    "/student/certificate/me/scores",
  );
  return res.data;
}

// ─── Practice Question Import (Teacher) ────────────────────────────────────

export interface ImportPracticeQuestionsPayload {
  toeic_part?: number; // 1-7 (required when import_scope = single_part)
  import_scope?: "single_part" | "full_reading" | "full_listening";
  score_band_min?: number; // e.g. 0
  score_band_max?: number; // e.g. 400
  replace_existing?: boolean; // default false (append)
}

export interface ImportPracticeQuestionsResponse {
  imported_count: number;
  skipped_count: number;
  score_band_min?: number;
  score_band_max?: number;
  practice_set_id: string;
  detected_parts: number[];
  extracted_image_count?: number;
  skipped_duplicates: Array<{
    question_number: number;
    part: number;
    existing_question_id: number | null;
    reason: string;
  }>;
  manual_fill_suggestions: Array<{
    part: number;
    missing_count: number;
    question_numbers: number[];
  }>;
}

export interface PracticeManualSupplementItem {
  toeic_part: number;
  question_number?: number;
  stem: string;
  reading_passage?: string;
  options: Array<{
    option_key: "A" | "B" | "C" | "D";
    option_text: string;
  }>;
  correct_option_key: "A" | "B" | "C" | "D";
}

export interface ImportPracticeManualSupplementPayload {
  score_band_min?: number;
  score_band_max?: number;
  practice_set_id?: string;
  items: PracticeManualSupplementItem[];
}

export interface ImportPracticeManualSupplementResponse {
  inserted_count: number;
  skipped_count: number;
  practice_set_id: string;
  skipped_duplicates: Array<{
    question_number: number;
    part: number;
    existing_question_id: number | null;
    reason: string;
  }>;
}

export interface ResetToeicPracticeProgressResponse {
  sessions_deleted: number;
  enrollments_reset: number;
}

export interface PracticeQuestionListItem {
  id: number;
  part: number | null;
  skill_area: string;
  practice_set_id?: string | null;
  question_number?: number | null;
  has_answer_key?: boolean;
  stem: string;
  reading_passage?: string | null;
  score_band_min: number;
  score_band_max: number;
  difficulty_label: string;
  is_published: boolean;
  options: Array<{
    id: number;
    option_key: string;
    option_text: string;
    is_correct: boolean;
    sort_order: number;
  }>;
}

export interface PracticeQuestionsListResponse {
  total: number;
  items: PracticeQuestionListItem[];
}

export async function importToeicPracticeQuestions(
  payload: ImportPracticeQuestionsPayload,
  file: File,
): Promise<ImportPracticeQuestionsResponse> {
  const formData = new FormData();
  formData.append("file", file);
  if (typeof payload.toeic_part === "number") {
    formData.append("toeic_part", String(payload.toeic_part));
  }
  if (payload.import_scope) {
    formData.append("import_scope", payload.import_scope);
  }
  if (typeof payload.score_band_min === "number") {
    formData.append("score_band_min", String(payload.score_band_min));
  }
  if (typeof payload.score_band_max === "number") {
    formData.append("score_band_max", String(payload.score_band_max));
  }
  if (typeof payload.replace_existing === "boolean") {
    formData.append("replace_existing", String(payload.replace_existing));
  }
  const res = await apiClient.post<ImportPracticeQuestionsResponse>(
    "/teacher/toeic-repository/import-practice-questions",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data;
}

export async function importToeicPracticeManualSupplement(
  payload: ImportPracticeManualSupplementPayload,
): Promise<ImportPracticeManualSupplementResponse> {
  const res = await apiClient.post<ImportPracticeManualSupplementResponse>(
    "/teacher/toeic-repository/import-practice-manual",
    payload,
  );
  return res.data;
}

export async function listToeicPracticeQuestions(filters?: {
  part?: number;
  score_band_min?: number;
  score_band_max?: number;
  skill_area?: string;
  practice_set_id?: string;
}): Promise<PracticeQuestionsListResponse> {
  const params = new URLSearchParams();
  if (filters?.part !== undefined) params.append("part", String(filters.part));
  if (filters?.score_band_min !== undefined)
    params.append("score_band_min", String(filters.score_band_min));
  if (filters?.score_band_max !== undefined)
    params.append("score_band_max", String(filters.score_band_max));
  if (filters?.skill_area) params.append("skill_area", filters.skill_area);
  if (filters?.practice_set_id)
    params.append("practice_set_id", filters.practice_set_id);
  const res = await apiClient.get<PracticeQuestionsListResponse>(
    `/teacher/toeic-repository/practice-questions?${params.toString()}`,
  );
  return res.data;
}

export interface ImportPracticeAnswerKeyPayload {
  practice_set_id: string;
  clear_existing?: boolean;
}

export interface ImportPracticeAnswerKeyResponse {
  practice_set_id: string;
  total_answers_detected: number;
  matched_questions: number;
  updated_questions: number;
  unanswered_questions: number;
  unmatched_question_numbers: number[];
  missing_option_question_numbers?: number[];
}

export async function importToeicPracticeAnswerKey(
  payload: ImportPracticeAnswerKeyPayload,
  file: File,
): Promise<ImportPracticeAnswerKeyResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("practice_set_id", payload.practice_set_id);
  if (typeof payload.clear_existing === "boolean") {
    formData.append("clear_existing", String(payload.clear_existing));
  }

  const res = await apiClient.post<ImportPracticeAnswerKeyResponse>(
    "/teacher/toeic-repository/import-practice-answer-key",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );

  return res.data;
}

export async function deleteToeicPracticeQuestions(
  ids: number[],
): Promise<void> {
  await apiClient.delete("/teacher/toeic-repository/practice-questions", {
    data: { ids },
  });
}

// ── Practice Listening Audio Chunking ─────────────────────────────────────────

export interface ImportPracticeAudioResponse {
  practice_set_id: string;
  total_chunks: number;
  auto_mapped_count: number;
  image_mapped_count?: number;
}

export async function importPracticeAudio(
  practiceSetId: string,
  file: File,
): Promise<ImportPracticeAudioResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("practice_set_id", practiceSetId);
  try {
    const res = await apiClient.post<ImportPracticeAudioResponse>(
      "/teacher/toeic-repository/import-practice-audio",
      formData,
      { headers: { "Content-Type": "multipart/form-data" }, timeout: 0 },
    );
    return res.data;
  } catch (error: any) {
    if (error?.response?.status === 524 || error?.status === 524) {
      // Cloudflare 100s timeout occurred, but backend is still processing
      return {
        practice_set_id: practiceSetId,
        total_chunks: -1,
        auto_mapped_count: -1,
      };
    }
    throw error;
  }
}

// ── Practice Listening Image Import ──────────────────────────────────────────

export interface ImportPracticeImagesResponse {
  practice_set_id: string;
  extracted_count: number;
  part1_mapped: number;
}

export async function importPracticeImages(
  practiceSetId: string,
  file: File,
): Promise<ImportPracticeImagesResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("practice_set_id", practiceSetId);
  const res = await apiClient.post<ImportPracticeImagesResponse>(
    "/teacher/toeic-repository/import-practice-images",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data;
}

export async function resetToeicPracticeProgress(
  resetReservePoints = true,
): Promise<ResetToeicPracticeProgressResponse> {
  const res = await apiClient.post<ResetToeicPracticeProgressResponse>(
    "/teacher/toeic-repository/reset-practice-progress",
    {
      reset_reserve_points: resetReservePoints,
    },
  );
  return res.data;
}

// ──────────────────────────────────────────────────────────────────────────────
// Auto-decrypt helpers (transparent to consumers)
// ──────────────────────────────────────────────────────────────────────────────

async function decryptRepositoryDetail(
  data: ToeicRepositoryDetailResponse,
): Promise<ToeicRepositoryDetailResponse> {
  const items = await Promise.all(
    data.items.map(async (item) => ({
      ...item,
      stem: (await tryDecryptString(item.stem ?? null)) ?? item.stem ?? null,
      reading_passage:
        (await tryDecryptString(item.reading_passage)) ?? item.reading_passage,
      explanation:
        (await tryDecryptString(item.explanation)) ?? item.explanation,
      options: await Promise.all(
        item.options.map(async (opt) => ({
          ...opt,
          option_text:
            (await tryDecryptString(opt.option_text)) ?? opt.option_text,
          rationale: (await tryDecryptString(opt.rationale)) ?? opt.rationale,
        })),
      ),
    })),
  );
  return { ...data, items };
}

async function decryptPracticeQuestionsResponse(
  data: ToeicPracticeQuestionsResponse,
): Promise<ToeicPracticeQuestionsResponse> {
  const questions = await Promise.all(
    data.questions.map(async (q) => ({
      ...q,
      stem: (await tryDecryptString(q.stem)) ?? q.stem,
      reading_passage:
        (await tryDecryptString(q.reading_passage)) ?? q.reading_passage,
      ai_explanation:
        (await tryDecryptString(q.ai_explanation)) ?? q.ai_explanation,
      options: await Promise.all(
        q.options.map(async (opt) => ({
          ...opt,
          option_text:
            (await tryDecryptString(opt.option_text)) ?? opt.option_text,
        })),
      ),
    })),
  );
  return { ...data, questions };
}

async function decryptPracticeSessionSubmitResponse(
  data: ToeicPracticeSessionSubmitResponse,
): Promise<ToeicPracticeSessionSubmitResponse> {
  const correct_answers = (await decryptRecord(
    data.correct_answers as Record<string, string | null>,
  )) as Record<string, string>;
  const explanations = await decryptRecord(
    data.explanations as Record<string, string | null>,
  );
  return { ...data, correct_answers, explanations };
}

// ── Diagnostic Import (Teacher) ────────────────────────────────────────────────

export interface DiagnosticImportPayload {
  title?: string;
  description?: string;
  cert_type?: string;
  skill_area?: string;
}

export interface DiagnosticImportResponse {
  diagnostic_set_id: string;
  imported_count: number;
}

export async function importDiagnosticTest(
  payload: DiagnosticImportPayload,
  file: File,
): Promise<DiagnosticImportResponse> {
  const formData = new FormData();
  formData.append("file", file);
  if (payload.title) {
    formData.append("title", payload.title);
  }
  if (payload.description) {
    formData.append("description", payload.description);
  }
  if (payload.cert_type) {
    formData.append("cert_type", payload.cert_type);
  }
  if (payload.skill_area) {
    formData.append("skill_area", payload.skill_area);
  }

  const res = await apiClient.post<DiagnosticImportResponse>(
    "/teacher/toeic-repository/import-diagnostic",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data;
}

export interface DiagnosticAudioImportResponse {
  repository_id: number;
  slug: string;
  total_chunks: number;
  auto_mapped_count: number;
}

export async function importDiagnosticAudio(
  slug: string,
  file: File,
): Promise<DiagnosticAudioImportResponse> {
  const formData = new FormData();
  formData.append("repository_slug", slug);
  formData.append("file", file);

  const res = await apiClient.post<DiagnosticAudioImportResponse>(
    "/teacher/toeic-repository/import-diagnostic-audio",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data;
}

// ── Diagnostic Test (Student) ──────────────────────────────────────────────────

export interface DiagnosticQuestionOption {
  id: number;
  option_key: string;
  option_text: string;
}

export interface DiagnosticQuestion {
  id: number;
  item_order: number;
  part: number;
  skill_area: string;
  stem: string;
  reading_passage: string | null;
  media_audio_url?: string | null;
  media_image_url?: string | null;
  options: DiagnosticQuestionOption[];
}

export interface DiagnosticSubmitResult {
  correct_count: number;
  total_questions: number;
  estimated_score: number;
}

export async function generateDiagnosticTest(
  targetScore: number,
): Promise<DiagnosticQuestion[]> {
  const res = await apiClient.get<DiagnosticQuestion[]>(
    `/student/certificate/toeic-diagnostic/generate?target_score=${targetScore}`,
  );
  // Decrypt items
  return Promise.all(
    res.data.map(async (q) => ({
      ...q,
      stem: (await tryDecryptString(q.stem)) ?? q.stem,
      reading_passage:
        (await tryDecryptString(q.reading_passage)) ?? q.reading_passage,
      options: await Promise.all(
        q.options.map(async (opt) => ({
          ...opt,
          option_text:
            (await tryDecryptString(opt.option_text)) ?? opt.option_text,
        })),
      ),
    })),
  );
}

export async function submitDiagnosticTest(
  questionIds: number[],
  answers: Record<string, string>,
): Promise<DiagnosticSubmitResult> {
  const res = await apiClient.post<DiagnosticSubmitResult>(
    `/student/certificate/toeic-diagnostic/submit`,
    { question_ids: questionIds, answers },
  );
  return res.data;
}

// ── Vocabulary Highlight ──────────────────────────────────────────────────────

export interface VocabDefinition {
  pos: string;
  meaning: string;
  example_en: string;
  example_vi: string;
}

export interface LookupWordPayload {
  word: string;
  context?: string;
  skill_area?: string;
  part?: number;
}

export interface LookupWordResponse {
  status: "exists" | "new";
  wordId?: number;
  word: string;
  topicId?: number;
  topicSlug?: string;
  topicTitleVI?: string;
  alreadyInBank?: boolean;
  suggestedTopicSlug?: string;
  suggestedTopicTitleVI?: string;
  definitions: VocabDefinition[];
  level?: string;
  freq?: number;
}

export interface SaveFromReadingPayload {
  word: string;
  topic_slug: string;
  definitions: VocabDefinition[];
  source_context?: string;
}

export interface SaveFromReadingResponse {
  wordId: number;
  added: boolean;
  message: string;
}

export async function lookupVocabWord(
  enrollmentId: number,
  payload: LookupWordPayload,
): Promise<LookupWordResponse> {
  const res = await apiClient.post<LookupWordResponse>(
    `/student/vocab/lookup?enrollment_id=${enrollmentId}`,
    payload,
  );
  return res.data;
}

export async function saveVocabFromReading(
  enrollmentId: number,
  payload: SaveFromReadingPayload,
): Promise<SaveFromReadingResponse> {
  const res = await apiClient.post<SaveFromReadingResponse>(
    `/student/vocab/save-from-reading?enrollment_id=${enrollmentId}`,
    payload,
  );
  return res.data;
}

// ── IELTS Answer Key Import ───────────────────────────────────────────────────
export interface IeltsAnswerKeyImportPayload {
  repository_slug: string;
  clear_existing?: boolean;
}

export interface IeltsAnswerKeyImportResponse {
  repository_id: number;
  slug: string;
  skill_area: string;
  source_filename: string;
  total_answers_detected: number;
  applied_items: number;
  unanswered_items: number;
  unknown_question_numbers: number[];
}

export async function importIeltsAnswerKeyFromFile(
  payload: IeltsAnswerKeyImportPayload,
  file: File,
): Promise<IeltsAnswerKeyImportResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("repository_slug", payload.repository_slug);
  if (typeof payload.clear_existing === "boolean") {
    formData.append("clear_existing", String(payload.clear_existing));
  }
  const res = await apiClient.post<IeltsAnswerKeyImportResponse>(
    "/teacher/ielts-repository/import-answer-key",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data;
}

// ── IELTS Practice Questions Import ──────────────────────────────────────────
export interface IeltsPracticeImportPayload {
  skill_area: "reading" | "listening" | "speaking" | "writing";
  band_min: number;
  band_max: number;
  replace_existing?: boolean;
}

export interface IeltsPracticeImportResponse {
  slug?: string;
  imported_count: number;
  skipped_count: number;
  total_detected: number;
  skill_area: string;
  band_min: number;
  band_max: number;
  source_filename: string;
}

export async function importIeltsPracticeQuestions(
  payload: IeltsPracticeImportPayload,
  file: File,
): Promise<IeltsPracticeImportResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("skill_area", payload.skill_area);
  formData.append("band_min", String(payload.band_min));
  formData.append("band_max", String(payload.band_max));
  if (typeof payload.replace_existing === "boolean") {
    formData.append("replace_existing", String(payload.replace_existing));
  }
  const res = await apiClient.post<IeltsPracticeImportResponse>(
    "/teacher/ielts-repository/import-practice",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data;
}

// ── IELTS IRT Re-calibration ──────────────────────────────────────────────────
export interface IeltsRecalibratePayload {
  min_responses?: number;
  skill?: string;
}

export interface IeltsRecalibrateResponse {
  recalibrated_count: number;
  skipped_count: number;
  details: Array<{
    question_id: string;
    old_irt_b: number;
    new_irt_b: number;
    response_count: number;
  }>;
}

export async function recalibrateIeltsIrt(
  payload?: IeltsRecalibratePayload,
): Promise<IeltsRecalibrateResponse> {
  const res = await apiClient.post<IeltsRecalibrateResponse>(
    "/teacher/ielts-repository/recalibrate",
    payload ?? {},
  );
  return res.data;
}

