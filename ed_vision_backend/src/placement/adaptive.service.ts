// ============================================================
// BƯỚC 3: src/placement/adaptive.service.ts
// Adaptive Testing Engine — dùng Account thay vì User
// ============================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

const TOTAL_QUESTIONS = 10;
const CALIBRATION_CUTOFF = 2; // câu 1-2 là calibration, không tính band cuối
const INITIAL_BAND = 5.0;
const BAND_STEP_NORMAL = 0.5; // ±0.5 sau 1 câu
const BAND_STEP_STREAK = 1.0; // ±1.0 khi đúng/sai liên tiếp ≥2
const BAND_MIN = 3.0;
const BAND_MAX = 9.0;
const ALLOWED_TYPES = ['mcq', 'gap_fill', 'true_false_ng'];

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export interface StartTestInput {
  accountId: number; // Int — khớp với Account.account_id
  skillsToTest: string[]; // ['vocabulary','reading','listening']
}

export interface AnswerInput {
  sessionId: string;
  questionId: string;
  userAnswer: string;
  timeTakenSec: number;
}

export interface QuestionPayload {
  id: string;
  questionText: string;
  questionType: string;
  options: unknown;
  timeLimitSec: number;
  progress: { current: number; total: number };
}

export interface StartTestResult {
  sessionId: string;
  firstQuestion: QuestionPayload;
}

export interface AnswerResult {
  isCorrect: boolean;
  nextQuestion: QuestionPayload | null; // null = test kết thúc
  progress: { current: number; total: number };
}

export interface TestResult {
  finalBand: number;
  skillBands: Record<string, number>;
  confidenceLevel: 'low' | 'medium' | 'high';
}

// ─────────────────────────────────────────────────────────────
// 1. BẮT ĐẦU TEST
// ─────────────────────────────────────────────────────────────

export async function startPlacementTest(
  input: StartTestInput,
): Promise<StartTestResult> {
  // Kiểm tra session đang dở dang — tránh tạo session trùng
  const existing = await prisma.ieltsPlacementSession.findFirst({
    where: {
      accountId: input.accountId,
      status: 'in_progress',
    },
  });

  if (existing) {
    throw new Error(
      `Account đang có session chưa hoàn thành (id: ${existing.id}). ` +
        `Gọi POST /placement-test/abandon để huỷ session cũ trước.`,
    );
  }

  const session = await prisma.ieltsPlacementSession.create({
    data: {
      accountId: input.accountId,
      skillsTested: input.skillsToTest,
      currentEstimatedBand: INITIAL_BAND,
      status: 'in_progress',
    },
  });

  const firstQuestion = await selectNextQuestion({
    targetBand: INITIAL_BAND,
    skillsTested: input.skillsToTest,
    usedQuestionIds: [],
    questionOrder: 1,
  });

  return { sessionId: session.id, firstQuestion };
}

// ─────────────────────────────────────────────────────────────
// 2. NHẬN CÂU TRẢ LỜI + TRẢ VỀ CÂU TIẾP THEO
// ─────────────────────────────────────────────────────────────

export async function submitAnswer(input: AnswerInput): Promise<AnswerResult> {
  const session = await prisma.ieltsPlacementSession.findUniqueOrThrow({
    where: { id: input.sessionId },
    include: {
      answers: { orderBy: { questionOrder: 'asc' } },
    },
  });

  if (session.status !== 'in_progress') {
    throw new Error('Session đã kết thúc.');
  }

  const question = await prisma.ieltsQuestion.findUniqueOrThrow({
    where: { id: input.questionId },
  });

  const isCorrect = checkAnswer(
    question.correctAnswer,
    input.userAnswer,
    question.questionType,
  );

  const questionOrder = session.totalQuestionsAsked + 1;
  const bandMid = (Number(question.bandMin) + Number(question.bandMax)) / 2;

  // Lưu câu trả lời
  await prisma.ieltsPlacementAnswer.create({
    data: {
      sessionId: input.sessionId,
      questionId: input.questionId,
      questionOrder,
      bandAtTime: session.currentEstimatedBand,
      bandMid,
      difficultyWeight: question.difficultyWeight,
      userAnswer: input.userAnswer,
      isCorrect,
      timeTakenSec: input.timeTakenSec,
    },
  });

  // Tính band + streak mới
  const { newBand, newConsecutiveCorrect, newConsecutiveWrong } =
    computeNextBand({
      currentBand: Number(session.currentEstimatedBand),
      isCorrect,
      consecutiveCorrect: session.consecutiveCorrect,
      consecutiveWrong: session.consecutiveWrong,
    });

  const newUsedIds = [...session.usedQuestionIds, input.questionId];
  const newTotal = session.totalQuestionsAsked + 1;
  const isLastQuestion = newTotal >= TOTAL_QUESTIONS;

  // Cập nhật session
  await prisma.ieltsPlacementSession.update({
    where: { id: input.sessionId },
    data: {
      currentEstimatedBand: newBand,
      usedQuestionIds: newUsedIds,
      totalQuestionsAsked: newTotal,
      consecutiveCorrect: newConsecutiveCorrect,
      consecutiveWrong: newConsecutiveWrong,
      status: isLastQuestion ? 'completed' : 'in_progress',
      completedAt: isLastQuestion ? new Date() : undefined,
    },
  });

  if (isLastQuestion) {
    const allAnswers = [
      ...session.answers.map((a) => ({
        isCorrect: a.isCorrect ?? false,
        bandMid: Number(a.bandMid),
        difficultyWeight: Number(a.difficultyWeight),
        questionOrder: a.questionOrder,
      })),
      { isCorrect, bandMid, difficultyWeight: Number(question.difficultyWeight), questionOrder },
    ];
    await finalizeResult(input.sessionId, allAnswers);
    return {
      isCorrect,
      nextQuestion: null,
      progress: { current: newTotal, total: TOTAL_QUESTIONS },
    };
  }

  const nextQuestion = await selectNextQuestion({
    targetBand: newBand,
    skillsTested: session.skillsTested,
    usedQuestionIds: newUsedIds,
    questionOrder: questionOrder + 1,
  });

  return {
    isCorrect,
    nextQuestion,
    progress: { current: newTotal, total: TOTAL_QUESTIONS },
  };
}

// ─────────────────────────────────────────────────────────────
// 3. ABANDON SESSION
// ─────────────────────────────────────────────────────────────

export async function abandonSession(sessionId: string): Promise<void> {
  await prisma.ieltsPlacementSession.update({
    where: { id: sessionId },
    data: { status: 'abandoned', completedAt: new Date() },
  });
}

// ─────────────────────────────────────────────────────────────
// 4. LẤY KẾT QUẢ SAU KHI HOÀN THÀNH
// ─────────────────────────────────────────────────────────────

export async function getPlacementResult(
  sessionId: string,
): Promise<TestResult> {
  const session = await prisma.ieltsPlacementSession.findUniqueOrThrow({
    where: { id: sessionId },
  });

  if (session.status !== 'completed') {
    throw new Error('Test chưa hoàn thành.');
  }

  return {
    finalBand: Number(session.finalBand),
    skillBands: (session.skillBands ?? {}) as Record<string, number>,
    confidenceLevel: session.confidenceLevel as 'low' | 'medium' | 'high',
  };
}

// ─────────────────────────────────────────────────────────────
// INTERNAL: Chọn câu hỏi tiếp theo
// FIX: tách 2 query — có/không có usedQuestionIds
// ─────────────────────────────────────────────────────────────

async function selectNextQuestion(params: {
  targetBand: number;
  skillsTested: string[];
  usedQuestionIds: string[];
  questionOrder: number;
}): Promise<QuestionPayload> {
  const { targetBand, skillsTested, usedQuestionIds, questionOrder } = params;

  // Mở rộng tolerance dần nếu không tìm được câu
  const tolerances = [0.5, 1.0, 1.5, 2.0];
  let found: any[] = [];

  for (const tol of tolerances) {
    const lo = targetBand - tol;
    const hi = targetBand + tol;

    if (usedQuestionIds.length === 0) {
      found = await prisma.$queryRaw<any[]>`
        SELECT
          id, question_text, question_type, options,
          band_min, band_max, difficulty_weight, expected_time_sec,
          ((band_min + band_max) / 2.0)                      AS band_mid,
          ABS(((band_min + band_max) / 2.0) - ${targetBand}) AS band_distance
        FROM ielts_questions
        WHERE skill           = ANY(${skillsTested}::text[])
          AND band_min       <= ${hi}
          AND band_max       >= ${lo}
          AND status          = 'approved'
          AND question_type   = ANY(${ALLOWED_TYPES}::text[])
        ORDER BY band_distance ASC, correct_rate DESC NULLS LAST, RANDOM()
        LIMIT 1
      `;
    } else {
      found = await prisma.$queryRaw<any[]>`
        SELECT
          id, question_text, question_type, options,
          band_min, band_max, difficulty_weight, expected_time_sec,
          ((band_min + band_max) / 2.0)                      AS band_mid,
          ABS(((band_min + band_max) / 2.0) - ${targetBand}) AS band_distance
        FROM ielts_questions
        WHERE skill           = ANY(${skillsTested}::text[])
          AND band_min       <= ${hi}
          AND band_max       >= ${lo}
          AND status          = 'approved'
          AND question_type   = ANY(${ALLOWED_TYPES}::text[])
          AND id             != ALL(${usedQuestionIds}::uuid[])
        ORDER BY band_distance ASC, correct_rate DESC NULLS LAST, RANDOM()
        LIMIT 1
      `;
    }

    if (found.length > 0) break;
  }

  if (found.length === 0) {
    throw new Error(
      `Không đủ câu hỏi approved cho band ${targetBand}, ` +
        `skills: ${skillsTested.join(', ')}. Cần seed thêm câu.`,
    );
  }

  const q = found[0];
  const timeLimitSec = targetBand <= 5.0
    ? (Number(q.expected_time_sec) || 90)
    : (Number(q.expected_time_sec) || 60);

  return {
    id: q.id,
    questionText: q.question_text,
    questionType: q.question_type,
    options: q.options,
    timeLimitSec,
    progress: { current: questionOrder, total: TOTAL_QUESTIONS },
  };
}

// ─────────────────────────────────────────────────────────────
// INTERNAL: Tính band mới sau mỗi câu
// ─────────────────────────────────────────────────────────────

function computeNextBand(params: {
  currentBand: number;
  isCorrect: boolean;
  consecutiveCorrect: number;
  consecutiveWrong: number;
}): {
  newBand: number;
  newConsecutiveCorrect: number;
  newConsecutiveWrong: number;
} {
  const { currentBand, isCorrect, consecutiveCorrect, consecutiveWrong } =
    params;

  if (isCorrect) {
    const streak = consecutiveCorrect + 1;
    const delta = streak >= 2 ? BAND_STEP_STREAK : BAND_STEP_NORMAL;
    return {
      newBand: clampBand(currentBand + delta),
      newConsecutiveCorrect: streak,
      newConsecutiveWrong: 0,
    };
  } else {
    const streak = consecutiveWrong + 1;
    const delta = streak >= 2 ? BAND_STEP_STREAK : BAND_STEP_NORMAL;
    return {
      newBand: clampBand(currentBand - delta),
      newConsecutiveCorrect: 0,
      newConsecutiveWrong: streak,
    };
  }
}

function clampBand(band: number): number {
  const rounded = Math.round(band * 2) / 2;
  return Math.min(Math.max(rounded, BAND_MIN), BAND_MAX);
}

// ─────────────────────────────────────────────────────────────
// INTERNAL: Tính kết quả cuối và lưu vào session
// ─────────────────────────────────────────────────────────────

async function finalizeResult(
  sessionId: string,
  answers: Array<{
    isCorrect: boolean;
    bandMid: number;
    difficultyWeight: number;
    questionOrder: number;
  }>,
): Promise<void> {
  // Bỏ calibration — chỉ tính từ câu CALIBRATION_CUTOFF + 1 trở đi
  const scored = answers.filter((a) => a.questionOrder > CALIBRATION_CUTOFF);

  if (scored.length === 0) {
    await prisma.ieltsPlacementSession.update({
      where: { id: sessionId },
      data: { finalBand: INITIAL_BAND, skillBands: {}, confidenceLevel: 'low' },
    });
    return;
  }

  // Weighted average: đúng → band câu hỏi, sai → band - 0.5
  let weightedSum = 0;
  let weightTotal = 0;
  const samples: number[] = [];

  for (const ans of scored) {
    const mid = ans.bandMid;
    const weight = ans.difficultyWeight;
    const ability = ans.isCorrect ? mid : mid - 0.5;

    weightedSum += ability * weight;
    weightTotal += weight;
    samples.push(ability);
  }

  const rawBand = weightedSum / weightTotal;
  const finalBand = clampBand(rawBand);

  // Standard deviation → confidence
  const mean = rawBand;
  const sd = Math.sqrt(
    samples.reduce((acc, b) => acc + Math.pow(b - mean, 2), 0) / samples.length,
  );
  const confidenceLevel: 'low' | 'medium' | 'high' =
    sd < 0.5 ? 'high' : sd < 1.0 ? 'medium' : 'low';

  await prisma.ieltsPlacementSession.update({
    where: { id: sessionId },
    data: { finalBand, skillBands: {}, confidenceLevel },
  });
}

// ─────────────────────────────────────────────────────────────
// INTERNAL: Kiểm tra đáp án
// ─────────────────────────────────────────────────────────────

function checkAnswer(
  correct: string,
  userAnswer: string,
  type: string,
): boolean {
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

  if (type === 'mcq' || type === 'true_false_ng') {
    return norm(correct) === norm(userAnswer);
  }

  if (type === 'gap_fill') {
    const dist = levenshtein(norm(correct), norm(userAnswer));
    const threshold = correct.length <= 5 ? 0 : 1;
    return dist <= threshold;
  }

  return norm(correct) === norm(userAnswer);
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}
