/**
 * certificate-prompts.ts
 *
 * Tập trung toàn bộ prompt template cho chứng chỉ vào một chỗ.
 * Thiết kế cho qwen2.5:3b — ngắn gọn, rõ ràng, không xung đột instruction.
 */

// ─── Cert-level system persona ────────────────────────────────────────────────

export const CERT_PERSONA: Record<string, string> = {
  toeic:
    'Bạn là gia sư TOEIC. Chỉ ra bẫy keyword, bẫy ngữ pháp và bẫy ngữ cảnh để học viên hiểu cách chọn đáp án.',
  ielts:
    'Bạn là gia sư IELTS. Tập trung 4 kỹ năng Listening/Reading/Writing/Speaking, giải thích rõ ràng và từng bước.',
  'mos-word':
    'Bạn là gia sư MOS Word. Hướng dẫn thao tác từng bước, nêu rõ tên ribbon/menu/command.',
  'mos-excel':
    'Bạn là gia sư MOS Excel. Giải thích hàm, công thức, thao tác bảng tính và mẹo tránh lỗi.',
  'mos-powerpoint':
    'Bạn là gia sư MOS PowerPoint. Hướng dẫn bố cục, định dạng, animation và quy trình tạo bài đúng chuẩn thi.',
};

export const DEFAULT_PERSONA =
  'Bạn là gia sư chứng chỉ học tập. Hướng dẫn ngắn gọn, rõ ràng, đúng trọng tâm.';

// ─── Ollama params ─────────────────────────────────────────────────────────────

/** Params cho callOllamaExplanation (explain khi chọn đúng đáp án) */
export const OLLAMA_EXPLANATION_OPTIONS = {
  temperature: 0.1,
  num_predict: 600,
  num_ctx: 2048,
  top_p: 0.9,
  repeat_penalty: 1.1,
} as const;

/** Params cho callOllamaTutorAnswer (ai-tutor/ask) */
export const OLLAMA_TUTOR_OPTIONS = {
  temperature: 0.2,
  num_predict: 600,
  num_ctx: 2048,
  top_p: 0.9,
  repeat_penalty: 1.1,
} as const;

/** Timeout tối đa cho mỗi lần gọi Ollama (ms) */
export const OLLAMA_TIMEOUT_MS = 45_000;

// ─── Explanation prompt (4 đáp án, dùng cho explainToeicAnswerWithOllama) ──────

export interface ExplanationPromptParams {
  stem: string;
  readingPassage?: string | null;
  options: Array<{
    option_key: string;
    option_text: string;
    is_correct: boolean;
  }>;
  baseExplanation?: string | null;
}

export function buildExplanationPrompt(
  params: ExplanationPromptParams,
): string {
  const { stem, readingPassage, options, baseExplanation } = params;

  const correctOpt = options.find((o) => o.is_correct);
  const optLines = options
    .map((o) => `${o.option_key}. ${o.option_text}`)
    .join('\n');

  const passageSnippet = readingPassage ? readingPassage.slice(0, 400) : null;

  return [
    'Bạn là gia sư TOEIC. Trả lời bằng tiếng Việt, ngắn gọn, đúng trọng tâm.',
    'Nhiệm vụ: giải thích vì sao đáp án đúng là chính xác và vì sao các đáp án còn lại sai.',
    'BẮT BUỘC FORMAT: tách thành các đoạn riêng, có một dòng trống giữa các đoạn.',
    'BẮT BUỘC theo đúng khung sau (không gộp chung một đoạn):',
    'Đáp án đúng: ...',
    'A: ...',
    'B: ...',
    'C: ...',
    'D: ...',
    'Không trả JSON. Không dùng markdown list.',
    passageSnippet ? `Đoạn văn: ${passageSnippet}` : '',
    `Câu hỏi: ${stem}`,
    `Các lựa chọn:\n${optLines}`,
    `Đáp án đúng: ${correctOpt?.option_key ?? '?'}. ${correctOpt?.option_text ?? ''}`,
    baseExplanation && baseExplanation.trim().length > 0
      ? `Gợi ý: ${baseExplanation.trim()}`
      : '',
  ]
    .filter((line) => line.length > 0)
    .join('\n');
}

// ─── Tutor prompt (dùng cho askCertificateTutor) ──────────────────────────────

export interface TutorPromptParams {
  certType: string;
  /** Câu hỏi học viên gửi (đã strip [FULL_EXPLANATION]/[HINT_ONLY] tag) */
  questionText: string;
  /** Learning context từ frontend (options, context, yêu cầu chất lượng…) */
  learningContext?: string;
  /** Tóm tắt enrollment hiện tại */
  enrollmentSummary?: string;
  /** topic_key để debug/log */
  topicKey?: string;
  /** Chế độ gợi ý — không lộ đáp án đúng */
  hintOnly: boolean;
  /** Chế độ giải thích đầy đủ A/B/C/D */
  fullExplanation: boolean;
  /** Rút ngắn output */
  concise?: boolean;
}

export function buildTutorPrompt(params: TutorPromptParams): string {
  const {
    certType,
    questionText,
    learningContext,
    hintOnly,
    fullExplanation,
    concise,
  } = params;

  // Cắt context để không vượt context window
  const contextSnippet = (learningContext ?? '').slice(0, 800);

  const modeInstruction = hintOnly
    ? 'Chế độ HINT_ONLY: chỉ gợi ý định hướng, không tiết lộ đáp án đúng trực tiếp.'
    : fullExplanation
      ? 'Chế độ FULL_EXPLANATION: giải thích đầy đủ đáp án đúng và lý do sai của từng lựa chọn còn lại.'
      : 'Giải thích ngắn gọn, tập trung phần học viên dễ nhầm.';

  const formatInstruction = fullExplanation
    ? [
        'BẮT BUỘC FORMAT cho FULL_EXPLANATION: mỗi mục là một đoạn riêng và có một dòng trống giữa các đoạn.',
        'Đáp án đúng: ...',
        'A: ...',
        'B: ...',
        'C: ...',
        'D: ...',
      ].join('\n')
    : '';

  const brevityInstruction = concise
    ? 'Giới hạn câu trả lời tối đa 4 câu.'
    : 'Giữ câu trả lời súc tích, dễ đọc.';

  return [
    `Bạn là gia sư ${certType.toUpperCase()}. Trả lời bằng tiếng Việt.`,
    modeInstruction,
    brevityInstruction,
    formatInstruction,
    contextSnippet.length > 0 ? `Dữ liệu câu hỏi:\n${contextSnippet}` : '',
    `Câu hỏi: ${questionText.slice(0, 500)}`,
  ]
    .filter((line) => line.length > 0)
    .join('\n\n');
}

// ─── Fallback messages ────────────────────────────────────────────────────────

export function buildExplanationFallback(
  stem: string,
  correctOptionText: string,
  baseExplanation: string | null,
): string {
  const hint =
    baseExplanation && baseExplanation.trim().length > 0
      ? ` ${baseExplanation.trim()}`
      : '';
  return `Đáp án đúng: "${correctOptionText}".${hint} (Xem lại câu hỏi: ${stem.slice(0, 80)})`;
}

export function buildTutorFallback(
  hintOnly: boolean,
  concise: boolean,
): string {
  if (hintOnly) {
    return 'AI đang tạm thời quá tải. Vui lòng bấm "Thử lại AI" để nhận gợi ý.';
  }
  if (concise) {
    return 'AI đang tạm thời quá tải. Vui lòng bấm "Thử lại AI" để nhận phân tích ngắn.';
  }
  return 'AI đang tạm thời quá tải. Vui lòng bấm "Thử lại AI" để nhận giải thích chi tiết.';
}
