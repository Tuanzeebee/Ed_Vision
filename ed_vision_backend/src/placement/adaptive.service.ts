import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { TestResultRecorderService } from '../admin_be/program-effectiveness/test-result-recorder.service';
import {
  estimateThetaEAP,
  getFullEstimateEAP,
  selectOptimalItem,
  shouldStop,
  thetaToBand,
  bandToTheta,
  icc,
  type ItemResponse,
  type IrtParams,
  type ThetaEstimate,
} from './irt.engine';

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

const MAX_QUESTIONS = 20;
const MIN_QUESTIONS = 12;
const SEM_TARGET = 0.45;
const SKILL_QUOTA_MIN = 2;
const SKILL_QUOTA_MAX = 7; // 3×7 + 1 speaking = 22 > MAX_QUESTIONS(20) → quotas never exhaust before test ends
const SPEAKING_QUOTA = 1;       // Speaking chỉ hỏi đúng 1 câu/test
const SPEAKING_FORCE_AFTER = 7; // Force speaking by this question order if not yet served
const SPEAKING_SKILL = 'speaking';
const IRT_SKILLS = ['reading', 'listening', 'writing', 'vocabulary'];
const INITIAL_BAND = 5.0;
const ALLOWED_TYPES = [
  'mcq',
  'multiple_choice',
  'gap_fill',
  'true_false_ng',
  'true_false_not_given',
  'yes_no_not_given',
  'matching_headings',
  'matching_information',
  'matching_features',
  'sentence_completion',
  'summary_completion',
  'note_completion',
  'table_completion',
  'flow_chart',
  'diagram_labelling',
  'short_answer',
  'speaking',
  'part1',
  'part2',
  'part3',
];
const STRENGTH_THRESHOLD = 0.75;
const WEAKNESS_THRESHOLD = -0.75;

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export interface StartTestInput {
  accountId: number;
  skillsToTest: string[];
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
  contextType: 'passage' | 'audio' | 'standalone';
  skill: string;
  passage: {
    id: string;
    title: string;
    content: string;
    audioUrl: string | null;
  } | null;
}

export interface StartTestResult {
  sessionId: string;
  firstQuestion: QuestionPayload;
}

export interface AnswerResult {
  isCorrect: boolean;
  nextQuestion: QuestionPayload | null;
  progress: { current: number; total: number };
  currentBand: number;
  actualTotal: number;
}

export interface TestResult {
  finalBand: number;
  skillBands: Record<string, number | null>;
  confidenceLevel: 'low' | 'medium' | 'high';
  sem: number;
  patterns: {
    strengths: string[];
    weaknesses: string[];
    balanced: string[];
    insights: string[];
  };
  note: Record<string, string>;
}

interface SkillPattern {
  strengths: string[];
  weaknesses: string[];
  balanced: string[];
  insights: string[];
}

@Injectable()
export class AdaptiveService {
  private readonly logger = new Logger(AdaptiveService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly testResultRecorder: TestResultRecorderService,
  ) {}

  async getAvailableSkills(): Promise<string[]> {
    const rows = await this.prisma.$queryRaw<{ skill: string }[]>`
      SELECT DISTINCT q.skill
      FROM ielts_questions q
      LEFT JOIN ielts_passages p ON q.passage_id = p.id
      WHERE q.is_placement = true AND q.status = 'approved'
        AND q.irt_a IS NOT NULL AND q.irt_b IS NOT NULL
        AND (q.skill != 'listening' OR (q.passage_id IS NOT NULL AND p.audio_url IS NOT NULL))
      ORDER BY q.skill
    `;
    return rows.map((r) => r.skill);
  }

  async startPlacementTest(input: StartTestInput): Promise<StartTestResult> {
    const existing = await this.prisma.ieltsPlacementSession.findFirst({
      where: { accountId: input.accountId, status: 'in_progress' },
    });

    if (existing) {
      await this.prisma.ieltsPlacementSession.update({
        where: { id: existing.id },
        data: { status: 'abandoned', completedAt: new Date() },
      });
    }

    const session = await this.prisma.ieltsPlacementSession.create({
      data: {
        accountId: input.accountId,
        skillsTested: input.skillsToTest,
        currentEstimatedBand: INITIAL_BAND,
        status: 'in_progress',
      },
    });

    const initialTheta = bandToTheta(INITIAL_BAND);
    const initSkillsAnswered = Object.fromEntries(
      input.skillsToTest.map((s) => [s, 0]),
    );
    const initSkillThetas = Object.fromEntries(
      input.skillsToTest.map((s) => [s, 0]),
    );

    const firstQuestion = await this.selectNextQuestion({
      currentTheta: initialTheta,
      skillsTested: input.skillsToTest,
      usedQuestionIds: [],
      questionOrder: 1,
      skillsAnswered: initSkillsAnswered,
      skillThetas: initSkillThetas,
    });

    return { sessionId: session.id, firstQuestion };
  }

  async submitAnswer(input: AnswerInput): Promise<AnswerResult> {
    // ✅ Handle SPEAKING_SKIPPED — check ngay đầu hàm
    if (input.userAnswer === 'SPEAKING_SKIPPED') {
      const session = await this.prisma.ieltsPlacementSession.findUniqueOrThrow(
        {
          where: { id: input.sessionId },
          include: {
            answers: {
              orderBy: { questionOrder: 'asc' },
              include: { question: true },
            },
          },
        },
      );

      const skillsAnsweredRaw = session.skillsAnswered;
      const skillThetasRaw = session.skillThetas;
      const prevSkillsAnswered: Record<string, number> =
        skillsAnsweredRaw &&
        typeof skillsAnsweredRaw === 'object' &&
        !Array.isArray(skillsAnsweredRaw)
          ? (skillsAnsweredRaw as Record<string, number>)
          : {};
      const prevSkillThetas: Record<string, number> =
        skillThetasRaw &&
        typeof skillThetasRaw === 'object' &&
        !Array.isArray(skillThetasRaw)
          ? (skillThetasRaw as Record<string, number>)
          : {};

      // Increment skillsAnswered for 'speaking'
      const currentSkillsAnswered = { ...prevSkillsAnswered };
      currentSkillsAnswered['speaking'] =
        (currentSkillsAnswered['speaking'] ?? 0) + 1;

      // Optionally update skillThetas for 'speaking' (no answer, so just keep previous)
      const currentSkillThetas = { ...prevSkillThetas };

      const newTotal = session.totalQuestionsAsked + 1;
      const usedIds = [...session.usedQuestionIds, input.questionId];

      await this.prisma.ieltsPlacementSession.update({
        where: { id: input.sessionId },
        data: {
          usedQuestionIds: usedIds,
          totalQuestionsAsked: newTotal,
          skillsAnswered: currentSkillsAnswered,
          skillThetas: currentSkillThetas,
        } as any,
      });

      const isLast = newTotal >= MAX_QUESTIONS;

      if (isLast) {
        const updatedSession =
          await this.prisma.ieltsPlacementSession.findUniqueOrThrow({
            where: { id: input.sessionId },
            include: { answers: true },
          });
        const estimate = getFullEstimateEAP(
          [],
          bandToTheta(Number(updatedSession.currentEstimatedBand)),
        );
        await this.finalizeResult(
          input.sessionId,
          estimate,
          updatedSession.answers,
        );
        return {
          isCorrect: false,
          nextQuestion: null,
          progress: { current: newTotal, total: MAX_QUESTIONS },
          currentBand: Number(updatedSession.currentEstimatedBand),
          actualTotal: newTotal,
        };
      }

      const nextQuestion = await this.selectNextQuestion({
        currentTheta: bandToTheta(Number(session.currentEstimatedBand)),
        skillsTested: session.skillsTested,
        usedQuestionIds: usedIds,
        questionOrder: newTotal + 1,
        skillsAnswered: currentSkillsAnswered,
        skillThetas: currentSkillThetas,
      });

      return {
        isCorrect: false,
        nextQuestion,
        progress: { current: newTotal, total: MAX_QUESTIONS },
        currentBand: Number(session.currentEstimatedBand),
        actualTotal: MAX_QUESTIONS,
      };
    }

    const session = await this.prisma.ieltsPlacementSession.findUniqueOrThrow({
      where: { id: input.sessionId },
      include: {
        answers: {
          orderBy: { questionOrder: 'asc' },
          include: { question: true },
        },
      },
    });

    const skillsAnsweredRaw = session.skillsAnswered;
    const skillThetasRaw = session.skillThetas;

    const prevSkillsAnswered: Record<string, number> =
      skillsAnsweredRaw &&
      typeof skillsAnsweredRaw === 'object' &&
      !Array.isArray(skillsAnsweredRaw)
        ? (skillsAnsweredRaw as Record<string, number>)
        : {};

    const prevSkillThetas: Record<string, number> =
      skillThetasRaw &&
      typeof skillThetasRaw === 'object' &&
      !Array.isArray(skillThetasRaw)
        ? (skillThetasRaw as Record<string, number>)
        : {};

    if (session.status !== 'in_progress') {
      const err = new Error('Session đã kết thúc.') as Error & {
        statusCode?: number;
        code?: string;
      };
      err.statusCode = 409;
      err.code = 'SESSION_ENDED';
      throw err;
    }

    const question = await this.prisma.ieltsQuestion.findUniqueOrThrow({
      where: { id: input.questionId },
    });

    if (!question.skill) {
      throw new Error(
        'Question skill is missing. Cannot evaluate skill-aware test.',
      );
    }

    const isCorrect = this.checkAnswer(
      question.correctAnswer,
      input.userAnswer,
      question.questionType,
    );
    const questionOrder = session.totalQuestionsAsked + 1;
    const bandMid = (Number(question.bandMin) + Number(question.bandMax)) / 2;

    await this.prisma.ieltsPlacementAnswer.create({
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
        irtASnapshot: question.irtA,
        irtBSnapshot: question.irtB,
        irtCSnapshot: question.irtC,
        skill: question.skill,
      } as Prisma.IeltsPlacementAnswerUncheckedCreateInput,
    });

    // ✅ Update question metrics (usedCount, correctRate)
    const newUsedCount = (question.usedCount ?? 0) + 1;
    const currentCorrectCount = Math.round(
      Number(question.correctRate ?? 0) * (question.usedCount ?? 0),
    );
    const newCorrectCount = currentCorrectCount + (isCorrect ? 1 : 0);
    const newCorrectRate = newCorrectCount / newUsedCount;

    await this.prisma.ieltsQuestion.update({
      where: { id: input.questionId },
      data: {
        usedCount: newUsedCount,
        correctRate: newCorrectRate,
      },
    });

    const currentAnswer = {
      isCorrect,
      irtASnapshot: question.irtA,
      irtBSnapshot: question.irtB,
      irtCSnapshot: question.irtC,
      skill: question.skill,
      questionOrder,
    };

    const allAnswersSoFar = [
      ...(session.answers as any[]).map((a) => ({
        isCorrect: a.isCorrect,
        irtASnapshot: a.irtASnapshot,
        irtBSnapshot: a.irtBSnapshot,
        irtCSnapshot: a.irtCSnapshot,
        irtA: a.question?.irtA,
        irtB: a.question?.irtB,
        irtC: a.question?.irtC,
        skill: a.skill,
        questionOrder: a.questionOrder,
      })),
      currentAnswer,
    ];

    const responseHistory = this.buildResponseHistory(allAnswersSoFar);
    const estimate = getFullEstimateEAP(
      responseHistory,
      bandToTheta(Number(session.currentEstimatedBand)),
    );
    const newBand = estimate.band;
    const newTotal = session.totalQuestionsAsked + 1;
    const usedIds = [...session.usedQuestionIds, input.questionId];

    const currentSkillsAnswered = { ...prevSkillsAnswered };
    currentSkillsAnswered[question.skill] =
      (currentSkillsAnswered[question.skill] ?? 0) + 1;

    const currentSkillThetas = { ...prevSkillThetas };
    const allAnswersIncludingCurrent = [
      ...(session.answers as any[]),
      currentAnswer,
    ];

    const skillResponses: ItemResponse[] = allAnswersIncludingCurrent
      .filter((a) => a.skill === question.skill && a.isCorrect !== null)
      .map((a) => ({
        correct: a.isCorrect as boolean,
        params: {
          a: Number(a.irtASnapshot ?? a.irtA) || 1.0,
          b: Number(a.irtBSnapshot ?? a.irtB) || 0.0,
          c: Number(a.irtCSnapshot ?? a.irtC) || 0.25,
        },
      }));

    if (skillResponses.length > 0) {
      const skillTheta = estimateThetaEAP(
        skillResponses,
        currentSkillThetas[question.skill] ?? 0,
      );
      currentSkillThetas[question.skill] = skillTheta;
    }

    const stopEarly = shouldStop(
      responseHistory,
      estimate.theta,
      MIN_QUESTIONS,
      SEM_TARGET,
    );
    const isLast = newTotal >= MAX_QUESTIONS || stopEarly;

    await this.prisma.ieltsPlacementSession.update({
      where: { id: input.sessionId },
      data: {
        currentEstimatedBand: newBand,
        usedQuestionIds: usedIds,
        totalQuestionsAsked: newTotal,
        consecutiveCorrect: 0,
        consecutiveWrong: 0,
        skillsAnswered: currentSkillsAnswered,
        skillThetas: currentSkillThetas,
        status: isLast ? 'completed' : 'in_progress',
        completedAt: isLast ? new Date() : undefined,
      } as Prisma.IeltsPlacementSessionUncheckedUpdateInput,
    });

    if (isLast) {
      await this.finalizeResult(input.sessionId, estimate, allAnswersSoFar);
      return {
        isCorrect,
        nextQuestion: null,
        progress: { current: newTotal, total: MAX_QUESTIONS },
        currentBand: newBand,
        actualTotal: newTotal,
      };
    }

    let nextQuestion: QuestionPayload | null = null;
    try {
      nextQuestion = await this.selectNextQuestion({
        currentTheta: estimate.theta,
        skillsTested: session.skillsTested,
        usedQuestionIds: usedIds,
        questionOrder: newTotal + 1,
        skillsAnswered: currentSkillsAnswered,
        skillThetas: currentSkillThetas,
      });
    } catch (err) {
      const error = err as Error;
      const isQuotaExhausted =
        error.message === 'SPEAKING_SKIP' ||
        error.message.includes('đủ quota tối đa') ||
        error.message.includes('quota');
      if (isQuotaExhausted) {
        if (error.message === 'SPEAKING_SKIP') {
          currentSkillsAnswered[SPEAKING_SKILL] = SPEAKING_QUOTA;
          await this.prisma.ieltsPlacementSession.update({
            where: { id: input.sessionId },
            data: { skillsAnswered: currentSkillsAnswered } as Prisma.IeltsPlacementSessionUncheckedUpdateInput,
          });
        }
        await this.finalizeResult(input.sessionId, estimate, allAnswersSoFar);
        return {
          isCorrect,
          nextQuestion: null,
          progress: { current: newTotal, total: MAX_QUESTIONS },
          currentBand: newBand,
          actualTotal: newTotal,
        };
      }
      this.logger.error('Error selecting next question:', error.message);
      throw error;
    }

    return {
      isCorrect,
      nextQuestion,
      progress: { current: newTotal, total: MAX_QUESTIONS },
      currentBand: newBand,
      actualTotal: MAX_QUESTIONS,
    };
  }

  async abandonSession(sessionId: string): Promise<void> {
    await this.prisma.ieltsPlacementSession.update({
      where: { id: sessionId },
      data: { status: 'abandoned', completedAt: new Date() },
    });
  }

  async getPlacementResult(sessionId: string): Promise<TestResult> {
    const session = await this.prisma.ieltsPlacementSession.findUniqueOrThrow({
      where: { id: sessionId },
    });

    const rawSkillBands = session.skillBands as any;
    const patterns = rawSkillBands?._patterns as SkillPattern;
    const sem = Number(rawSkillBands?._sem) || 0;

    const skillBands: Record<string, number | null> = {};
    if (rawSkillBands) {
      for (const [k, v] of Object.entries(rawSkillBands)) {
        if (!k.startsWith('_')) {
          skillBands[k] = v === null ? null : Number(v);
        }
      }
    }

    return {
      finalBand: Number(session.finalBand),
      skillBands,
      confidenceLevel: session.confidenceLevel as 'low' | 'medium' | 'high',
      sem,
      patterns: patterns || {
        strengths: [],
        weaknesses: [],
        balanced: [],
        insights: [],
      },
      note: {},
    };
  }

  private async selectNextQuestion(params: {
    currentTheta: number;
    skillsTested: string[];
    usedQuestionIds: string[];
    questionOrder: number;
    skillsAnswered: Record<string, number>;
    skillThetas: Record<string, number>;
  }): Promise<QuestionPayload> {
    const {
      currentTheta,
      skillsTested,
      usedQuestionIds,
      questionOrder,
      skillsAnswered,
      skillThetas,
    } = params;

    const allowedSkills = skillsTested.filter((skill) => {
      const count = skillsAnswered[skill] ?? 0;

      if (skill === SPEAKING_SKILL) {
        return count < SPEAKING_QUOTA;
      }

      return count >= SKILL_QUOTA_MIN ? count < SKILL_QUOTA_MAX : true;
    });

    if (allowedSkills.length === 0)
      throw new Error('Tất cả skills đã đủ quota tối đa.');

    const prioritySkills = allowedSkills.filter(
      (s) => (skillsAnswered[s] ?? 0) < SKILL_QUOTA_MIN,
    );
    const targetSkills =
      prioritySkills.length > 0 ? prioritySkills : allowedSkills;

    const speakingDue =
      skillsTested.includes(SPEAKING_SKILL) &&
      (skillsAnswered[SPEAKING_SKILL] ?? 0) < SPEAKING_QUOTA;

    // Force speaking after SPEAKING_FORCE_AFTER questions regardless of other quotas
    const speakingForced =
      speakingDue && questionOrder > SPEAKING_FORCE_AFTER;

    if (
      speakingDue &&
      (speakingForced ||
        (targetSkills.length === 1 && targetSkills[0] === SPEAKING_SKILL))
    ) {
      return this.selectSpeakingQuestion({
        currentTheta,
        usedQuestionIds,
        questionOrder,
      });
    }

    // ── Force least-served skill during priority phase ───────────────────────
    // Without this, IRT picks freely among all priority skills and biases toward
    // whichever skill has more questions in the DB (e.g. reading/grammar).
    let forcedSkill: string | null = null;
    let nonSpeakingPriority: string[] = [];
    if (prioritySkills.length > 0) {
      nonSpeakingPriority = prioritySkills.filter(
        (s) => s !== SPEAKING_SKILL,
      );
      if (nonSpeakingPriority.length > 0) {
        // Sort by count ascending; among ties use cyclic selection
        const sorted = [...nonSpeakingPriority].sort(
          (a, b) => (skillsAnswered[a] ?? 0) - (skillsAnswered[b] ?? 0),
        );
        const minCount = skillsAnswered[sorted[0]] ?? 0;
        const tied = sorted.filter(
          (s) => (skillsAnswered[s] ?? 0) === minCount,
        );
        forcedSkill = tied[questionOrder % tied.length];
      }
    }

    const irtTargetSkills = forcedSkill
      ? [forcedSkill]
      : targetSkills.filter((s) => s !== SPEAKING_SKILL);
    const finalTargetSkills =
      irtTargetSkills.length > 0 ? irtTargetSkills : targetSkills;

    const candidates: any[] = [];
    const nonSpeakingSkills = finalTargetSkills.filter(
      (s) => s !== SPEAKING_SKILL,
    );

    if (nonSpeakingSkills.length > 0) {
      const rows = await this.prisma.$queryRaw<any[]>`
        SELECT q.id, q.question_text, q.question_type, q.options, q.expected_time_sec,
               q.band_min, q.band_max, q.irt_a, q.irt_b, q.irt_c, q.passage_id, q.context_type, q.skill
        FROM ielts_questions q
        LEFT JOIN ielts_passages p ON q.passage_id = p.id
        WHERE q.skill = ANY(${nonSpeakingSkills}::text[])
          AND q.status = 'approved' AND q.is_placement = true
          AND q.question_type = ANY(${ALLOWED_TYPES}::text[])
          AND q.irt_a IS NOT NULL AND q.irt_b IS NOT NULL
          AND q.id != ALL(${usedQuestionIds}::uuid[])
          AND (q.skill != 'listening' OR (q.passage_id IS NOT NULL AND p.audio_url IS NOT NULL))
      `;
      candidates.push(...rows);
    }

    // ── If forced skill has no candidates (e.g. listening has no audio questions),
    //    fall back to other priority skills so the test doesn't get stuck ───────
    if (candidates.length === 0 && forcedSkill && nonSpeakingPriority.length > 1) {
      const widened = nonSpeakingPriority.filter((s) => s !== forcedSkill);
      if (widened.length > 0) {
        const widenedRows = await this.prisma.$queryRaw<any[]>`
          SELECT q.id, q.question_text, q.question_type, q.options, q.expected_time_sec,
                 q.band_min, q.band_max, q.irt_a, q.irt_b, q.irt_c, q.passage_id, q.context_type, q.skill
          FROM ielts_questions q
          LEFT JOIN ielts_passages p ON q.passage_id = p.id
          WHERE q.skill = ANY(${widened}::text[])
            AND q.status = 'approved' AND q.is_placement = true
            AND q.question_type = ANY(${ALLOWED_TYPES}::text[])
            AND q.irt_a IS NOT NULL AND q.irt_b IS NOT NULL
            AND q.id != ALL(${usedQuestionIds}::uuid[])
            AND (q.skill != 'listening' OR (q.passage_id IS NOT NULL AND p.audio_url IS NOT NULL))
        `;
        candidates.push(...widenedRows);
      }
    }

    if (candidates.length === 0) {
      // ── Fallback tier 1: same skill filter, relax question_type constraint ───
      if (nonSpeakingSkills.length > 0) {
        const bandRelaxRows = await this.prisma.$queryRaw<any[]>`
          SELECT q.id, q.question_text, q.question_type, q.options, q.expected_time_sec,
                 q.band_min, q.band_max, q.irt_a, q.irt_b, q.irt_c, q.passage_id, q.context_type, q.skill
          FROM ielts_questions q
          LEFT JOIN ielts_passages p ON q.passage_id = p.id
          WHERE q.skill = ANY(${nonSpeakingSkills}::text[])
            AND q.status = 'approved' AND q.is_placement = true
            AND q.irt_a IS NOT NULL AND q.irt_b IS NOT NULL
            AND q.id != ALL(${usedQuestionIds}::uuid[])
            AND (q.skill != 'listening' OR (q.passage_id IS NOT NULL AND p.audio_url IS NOT NULL))
          LIMIT 20
        `;
        candidates.push(...bandRelaxRows);
      }
    }

    if (candidates.length === 0) {
      // ── Fallback tier 2: any allowed skill in the session (skill pool empty) ──
      const allSessionSkills = skillsTested.filter((s) => s !== SPEAKING_SKILL);
      if (allSessionSkills.length > 0) {
        const anySkillRows = await this.prisma.$queryRaw<any[]>`
          SELECT q.id, q.question_text, q.question_type, q.options, q.expected_time_sec,
                 q.band_min, q.band_max, q.irt_a, q.irt_b, q.irt_c, q.passage_id, q.context_type, q.skill
          FROM ielts_questions q
          LEFT JOIN ielts_passages p ON q.passage_id = p.id
          WHERE q.skill = ANY(${allSessionSkills}::text[])
            AND q.status = 'approved' AND q.is_placement = true
            AND q.question_type = ANY(${ALLOWED_TYPES}::text[])
            AND q.irt_a IS NOT NULL AND q.irt_b IS NOT NULL
            AND q.id != ALL(${usedQuestionIds}::uuid[])
            AND (q.skill != 'listening' OR (q.passage_id IS NOT NULL AND p.audio_url IS NOT NULL))
          LIMIT 20
        `;
        candidates.push(...anySkillRows);
      }
    }

    if (candidates.length === 0) {
      throw new Error(
        `Pool placement không đủ câu cho theta=${currentTheta.toFixed(2)}, skills=${finalTargetSkills.join(',')}. Vui lòng nạp thêm câu hỏi placement vào hệ thống.`,
      );
    }

    const candidatesWithParams = candidates.map((q) => ({
      id: q.id,
      params: {
        a: Number(q.irt_a ?? 1.0),
        b: Number(q.irt_b ?? 0.0),
        c: Number(q.irt_c ?? 0.25),
      } as IrtParams,
      raw: q,
    }));

    const bestId = selectOptimalItem(
      currentTheta,
      candidatesWithParams.map((c) => ({ id: c.id, params: c.params })),
    );
    const selected = candidatesWithParams.find((c) => c.id === bestId)!;
    const q = selected.raw;
    const band = thetaToBand(currentTheta);
    const timeLimitSec =
      band <= 5.0
        ? Number(q.expected_time_sec) || 90
        : Number(q.expected_time_sec) || 60;

    let passageData: QuestionPayload['passage'] = null;
    const contextType: QuestionPayload['contextType'] =
      q.context_type === 'audio'
        ? 'audio'
        : q.context_type === 'passage'
          ? 'passage'
          : 'standalone';

    if (q.passage_id) {
      const passage = await this.prisma.$queryRaw<any[]>`
        SELECT id, title, content, audio_url FROM ielts_passages WHERE id = ${q.passage_id}::uuid LIMIT 1
      `;
      if (passage.length > 0) {
        const p = passage[0];
        passageData = {
          id: p.id,
          title: p.title,
          content: p.content,
          audioUrl: p.audio_url ?? null,
        };
      }
    }

    return {
      id: q.id,
      questionText: q.question_text,
      questionType: q.question_type,
      options: q.options,
      timeLimitSec,
      progress: { current: questionOrder, total: MAX_QUESTIONS },
      contextType,
      skill: q.skill,
      passage: passageData,
    };
  }

  private async selectSpeakingQuestion(params: {
    currentTheta: number;
    usedQuestionIds: string[];
    questionOrder: number;
  }): Promise<QuestionPayload> {
    const { currentTheta, usedQuestionIds, questionOrder } = params;

    const band = thetaToBand(currentTheta);
    const tolerance = 1.5;

    let candidates: any[] = [];

    if (usedQuestionIds.length === 0) {
      candidates = await this.prisma.$queryRaw<any[]>`
        SELECT id, question_text, question_type, options,
               expected_time_sec, band_min, band_max,
               context_type, passage_id, skill
        FROM   ielts_questions
        WHERE  skill         = ${SPEAKING_SKILL}
          AND  status        = 'approved'
          AND  is_placement  = true
          AND  band_min     <= ${band + tolerance}
          AND  band_max     >= ${band - tolerance}
        ORDER BY RANDOM()
        LIMIT 1
      `;
    } else {
      candidates = await this.prisma.$queryRaw<any[]>`
        SELECT id, question_text, question_type, options,
               expected_time_sec, band_min, band_max,
               context_type, passage_id, skill
        FROM   ielts_questions
        WHERE  skill         = ${SPEAKING_SKILL}
          AND  status        = 'approved'
          AND  is_placement  = true
          AND  band_min     <= ${band + tolerance}
          AND  band_max     >= ${band - tolerance}
          AND  id           != ALL(${usedQuestionIds}::uuid[])
        ORDER BY RANDOM()
        LIMIT 1
      `;
    }

    if (candidates.length === 0) {
      candidates = await this.prisma.$queryRaw<any[]>`
        SELECT id, question_text, question_type, options,
               expected_time_sec, band_min, band_max,
               context_type, passage_id, skill
        FROM   ielts_questions
        WHERE  skill        = ${SPEAKING_SKILL}
          AND  status       = 'approved'
          AND  is_placement = true
          AND  id          != ALL(${usedQuestionIds.length > 0 ? usedQuestionIds : ['']}::uuid[])
        ORDER BY RANDOM()
        LIMIT 1
      `;
    }

    if (candidates.length === 0) {
      throw new Error('SPEAKING_SKIP');
    }

    const q = candidates[0];

    return {
      id: q.id,
      skill: q.skill,
      questionText: q.question_text,
      questionType: q.question_type,
      options: q.options,
      timeLimitSec: Number(q.expected_time_sec) || 90,
      progress: { current: questionOrder, total: MAX_QUESTIONS },
      contextType: 'standalone',
      passage: null,
    };
  }

  private buildResponseHistory(answers: any[]): ItemResponse[] {
    return answers
      .filter((a) => a.isCorrect !== null)
      .map((a) => {
        const isSpeak = a.skill === 'speaking';
        return {
          correct: a.isCorrect as boolean,
          params: {
            a: isSpeak ? 1.0 : Number(a.irtASnapshot ?? a.irtA) || 1.0,
            b: isSpeak ? 0.0 : Number(a.irtBSnapshot ?? a.irtB) || 0.0,
            c: isSpeak ? 0.25 : Number(a.irtCSnapshot ?? a.irtC) || 0.25,
          },
        };
      });
  }

  private detectPatterns(
    skillEstimates: Record<
      string,
      { theta: number; band: number; sem: number }
    >,
    allAnswers: any[],
  ): SkillPattern {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const balanced: string[] = [];

    for (const [skill, est] of Object.entries(skillEstimates)) {
      if (est.theta > STRENGTH_THRESHOLD) strengths.push(skill);
      else if (est.theta < WEAKNESS_THRESHOLD) weaknesses.push(skill);
      else balanced.push(skill);
    }

    const accuracyBySkill: Record<string, { correct: number; total: number }> =
      {};
    for (const ans of allAnswers) {
      if (!ans.skill) continue;
      if (!accuracyBySkill[ans.skill])
        accuracyBySkill[ans.skill] = { correct: 0, total: 0 };
      accuracyBySkill[ans.skill].total++;
      if (ans.isCorrect) accuracyBySkill[ans.skill].correct++;
    }

    const insights: string[] = [];
    const skillLabels: Record<string, string> = {
      reading: 'Reading',
      listening: 'Listening',
      writing: 'Writing',
      speaking: 'Speaking',
    };

    for (const skill of strengths) {
      const acc = accuracyBySkill[skill];
      const pct = acc ? Math.round((acc.correct / acc.total) * 100) : 0;
      insights.push(
        `${skillLabels[skill]}: Tốt (${pct}% chính xác — band ~${skillEstimates[skill].band})`,
      );
    }
    for (const skill of weaknesses) {
      const acc = accuracyBySkill[skill];
      const pct = acc ? Math.round((acc.correct / acc.total) * 100) : 0;
      insights.push(
        `${skillLabels[skill]}: Cần cải thiện (${pct}% chính xác — band ~${skillEstimates[skill].band})`,
      );
    }
    for (const skill of balanced) {
      insights.push(
        `${skillLabels[skill]}: Trung bình (band ~${skillEstimates[skill].band})`,
      );
    }

    return { strengths, weaknesses, balanced, insights };
  }

  private async finalizeResult(
    sessionId: string,
    estimate: ThetaEstimate,
    allAnswers: any[],
  ): Promise<void> {
    // Build bySkill dynamically from the answers themselves so any skill
    // (including 'vocabulary') is correctly bucketed without hardcoding.
    const bySkill: Record<string, ItemResponse[]> = {};

    for (const ans of allAnswers) {
      if (!ans.skill) continue;
      const resultSkill = ans.skill;
      const irtA = ans.irtASnapshot ?? ans.irtA;
      const irtB = ans.irtBSnapshot ?? ans.irtB;
      const irtC = ans.irtCSnapshot ?? ans.irtC;
      if (irtA == null) continue;
      if (!bySkill[resultSkill]) bySkill[resultSkill] = [];
      bySkill[resultSkill].push({
        correct: ans.isCorrect ?? false,
        params: {
          a: Number(irtA) || 1.0,
          b: Number(irtB) || 0.0,
          c: Number(irtC) || 0.25,
        },
      });
    }

    const skillEstimates: Record<
      string,
      { theta: number; band: number; sem: number }
    > = {};
    for (const [skill, responses] of Object.entries(bySkill)) {
      if (responses.length === 0) {
        skillEstimates[skill] = { theta: 0, band: thetaToBand(0), sem: 0.99 };
        continue;
      }
      const est = getFullEstimateEAP(responses, 0);
      skillEstimates[skill] = {
        theta: est.theta,
        band: est.band,
        sem: est.sem,
      };
    }

    const skillBands: Record<string, number | null> = {};
    for (const skill of Object.keys(bySkill)) {
      skillBands[skill] =
        bySkill[skill].length > 0 ? skillEstimates[skill].band : null;
    }

    const skillWeights: Record<string, number> = {
      reading: 0.3,
      listening: 0.3,
      writing: 0.2,
      speaking: 0.2,
    };
    let totalWeight = 0;
    let weightedTheta = 0;

    for (const [skill, est] of Object.entries(skillEstimates)) {
      if (bySkill[skill].length === 0) continue;
      const w = skillWeights[skill] ?? 0.25;
      weightedTheta += est.theta * w;
      totalWeight += w;
    }

    const overallTheta = totalWeight > 0 ? weightedTheta / totalWeight : 0;
    const finalBand = thetaToBand(overallTheta);
    const patterns = this.detectPatterns(skillEstimates, allAnswers);

    await this.prisma.ieltsPlacementSession.update({
      where: { id: sessionId },
      data: {
        finalBand,
        skillBands: {
          ...skillBands,
          _patterns: patterns,
          _sem: estimate.sem,
        } as any,
        confidenceLevel: estimate.confidence,
      } as Prisma.IeltsPlacementSessionUncheckedUpdateInput,
    });

    // Fire-and-forget: record placement result to StudentTestResult
    this.recordPlacementResult(sessionId, finalBand, skillBands, allAnswers.length).catch(() => {});
  }

  private async recordPlacementResult(
    sessionId: string,
    finalBand: number,
    skillBands: Record<string, number | null>,
    totalQuestions: number,
  ): Promise<void> {
    const session = await this.prisma.ieltsPlacementSession.findUnique({
      where: { id: sessionId },
      select: { accountId: true, startedAt: true, completedAt: true },
    });
    if (!session) return;

    // Find active IELTS enrollment
    const student = await this.prisma.student.findUnique({
      where: { account_id: session.accountId },
      select: { student_id: true },
    });
    let enrollmentId: number | null = null;
    if (student) {
      const enrollment = await this.prisma.certificateEnrollment.findFirst({
        where: { student_id: student.student_id, cert_type: 'ielts', status: 'active' },
        select: { id: true },
      });
      enrollmentId = enrollment?.id ?? null;
    }

    const bandX10 = Math.round(finalBand * 10);
    const durationMin = session.completedAt && session.startedAt
      ? Math.ceil((session.completedAt.getTime() - session.startedAt.getTime()) / 60000)
      : null;

    await this.testResultRecorder.record({
      accountId: session.accountId,
      certType: 'ielts',
      testType: 'placement',
      testPhase: 'entry',
      isBaseline: true,
      enrollmentId,
      totalScore: bandX10,
      bandScore: finalBand,
      listeningScore: skillBands.listening != null ? Math.round(skillBands.listening * 10) : null,
      readingScore: skillBands.reading != null ? Math.round(skillBands.reading * 10) : null,
      writingScore: skillBands.writing != null ? Math.round(skillBands.writing * 10) : null,
      speakingScore: skillBands.speaking != null ? Math.round(skillBands.speaking * 10) : null,
      totalQuestions,
      durationMinutes: durationMin,
      startedAt: session.startedAt,
      completedAt: session.completedAt ?? new Date(),
    });
  }

  private checkAnswer(
    correct: string,
    userAnswer: string,
    type: string,
  ): boolean {
    if (type === 'speaking') {
      const band = parseFloat(userAnswer);
      if (!isNaN(band)) return band >= 5.0;
      return true;
    }

    const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
    if (type === 'mcq' || type === 'true_false_ng')
      return norm(correct) === norm(userAnswer);
    if (type === 'gap_fill') {
      const dist = this.levenshtein(norm(correct), norm(userAnswer));
      return dist <= (correct.length <= 5 ? 0 : 1);
    }
    return norm(correct) === norm(userAnswer);
  }

  private levenshtein(a: string, b: string): number {
    const m = a.length,
      n = b.length;
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
}
