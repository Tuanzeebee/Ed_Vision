import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Shared service that records test results into `StudentTestResult`
 * and keeps `StudentLearningProgress` in sync.
 *
 * Called from:
 *   - ToeicExamSessionService  (after gradeAndFinalize)
 *   - IeltsAdaptiveService     (after submitBandTest)
 *   - AdaptivePlacementService (after finalizeResult)
 */

export interface RecordTestResultInput {
  /** The account_id of the student who took the test. */
  accountId: number;
  /** Certificate type. */
  certType: 'ielts' | 'toeic';
  /** Kind of test. */
  testType: 'diagnostic' | 'placement' | 'mock' | 'official' | 'practice';
  /** Phase in the learning journey. */
  testPhase: 'entry' | 'midterm' | 'final' | 'exit';
  /** Linked enrollment (optional but strongly recommended). */
  enrollmentId?: number | null;
  /** Source session id for traceability. */
  sessionId?: number | null;
  /** Source repository id. */
  repositoryId?: number | null;
  /** Per-skill scores. For IELTS: band × 10.  For TOEIC: raw points. */
  listeningScore?: number | null;
  readingScore?: number | null;
  writingScore?: number | null;
  speakingScore?: number | null;
  /** Aggregate score.  TOEIC: 0-990.  IELTS: band × 10 (e.g. 65 = 6.5). */
  totalScore?: number | null;
  /** IELTS band (1.0 – 9.0). */
  bandScore?: number | null;
  /** Whether this is the very first / baseline test. */
  isBaseline?: boolean;
  /** How long the test took (minutes). */
  durationMinutes?: number | null;
  totalQuestions?: number | null;
  correctCount?: number | null;
  accuracyPercent?: number | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
}

@Injectable()
export class TestResultRecorderService {
  private readonly logger = new Logger(TestResultRecorderService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Public entry point ────────────────────────────────────────────────────

  /**
   * Record a test result and refresh the student's learning-progress summary.
   * Designed to be fire-and-forget (errors are logged, never thrown).
   */
  async record(input: RecordTestResultInput): Promise<void> {
    try {
      const studentId = await this.resolveStudentId(input.accountId);
      if (!studentId) {
        this.logger.warn(
          `No Student row for account ${input.accountId} — skipping test-result recording`,
        );
        return;
      }

      // Determine attempt number
      const attemptNumber = await this.nextAttemptNumber(
        studentId,
        input.certType,
        input.enrollmentId ?? undefined,
      );

      // Determine if baseline
      const isBaseline =
        input.isBaseline ??
        (input.testPhase === 'entry' && attemptNumber === 1);

      const testResult = await this.prisma.studentTestResult.create({
        data: {
          student_id: studentId,
          enrollment_id: input.enrollmentId ?? null,
          cert_type: input.certType,
          test_type: input.testType,
          test_phase: input.testPhase,
          session_id: input.sessionId ?? null,
          repository_id: input.repositoryId ?? null,
          listening_score: input.listeningScore ?? null,
          reading_score: input.readingScore ?? null,
          writing_score: input.writingScore ?? null,
          speaking_score: input.speakingScore ?? null,
          total_score: input.totalScore ?? null,
          band_score: input.bandScore ?? null,
          attempt_number: attemptNumber,
          is_baseline: isBaseline,
          duration_minutes: input.durationMinutes ?? null,
          total_questions: input.totalQuestions ?? null,
          correct_count: input.correctCount ?? null,
          accuracy_percent: input.accuracyPercent ?? null,
          started_at: input.startedAt ?? null,
          completed_at: input.completedAt ?? new Date(),
        },
      });

      this.logger.log(
        `Recorded StudentTestResult #${testResult.id} for student ${studentId} ` +
          `(${input.certType} / ${input.testType} / attempt ${attemptNumber})`,
      );

      // Refresh learning progress if enrollment is known
      if (input.enrollmentId) {
        await this.refreshLearningProgress(
          studentId,
          input.enrollmentId,
          input.certType,
        );
      }
    } catch (err) {
      this.logger.error('Failed to record test result', err);
    }
  }

  // ── Learning-progress updater ─────────────────────────────────────────────

  /**
   * Recompute `StudentLearningProgress` from all `StudentTestResult` rows
   * belonging to the given enrollment.
   */
  private async refreshLearningProgress(
    studentId: number,
    enrollmentId: number,
    certType: string,
  ): Promise<void> {
    const results = await this.prisma.studentTestResult.findMany({
      where: { student_id: studentId, enrollment_id: enrollmentId },
      orderBy: { completed_at: 'asc' },
    });

    if (results.length === 0) return;

    // Baseline = first entry test or first test with is_baseline flag
    const baseline =
      results.find((r) => r.is_baseline) ??
      results.find((r) => r.test_phase === 'entry') ??
      results[0];

    // Latest = most recent completed test
    const latest = results[results.length - 1];

    const baselineBand = baseline.band_score ?? this.inferBand(baseline, certType);
    const lastBand = latest.band_score ?? this.inferBand(latest, certType);

    const improvementBand =
      baselineBand != null && lastBand != null
        ? Math.round((lastBand - baselineBand) * 10) / 10
        : null;

    // Skill improvements
    const skillImprovement = (
      field: 'listening_score' | 'reading_score' | 'writing_score' | 'speaking_score',
    ): number | null => {
      const bv = baseline[field];
      const lv = latest[field];
      if (bv == null || lv == null) return null;
      if (certType === 'ielts') return Math.round((lv - bv)) / 10; // band diff
      return lv - bv; // raw score diff
    };

    // Resolve target from enrollment
    const enrollment = await this.prisma.certificateEnrollment.findUnique({
      where: { id: enrollmentId },
      select: { target_score: true },
    });

    const targetBand =
      certType === 'ielts'
        ? 6.5
        : enrollment?.target_score
          ? enrollment.target_score / 110
          : 6.8;

    const atRisk = lastBand != null && lastBand < targetBand * 0.7;

    await this.prisma.studentLearningProgress.upsert({
      where: { enrollment_id: enrollmentId },
      update: {
        cert_type: certType,
        last_test_id: latest.id,
        last_band_score: lastBand,
        last_total_score: latest.total_score,
        last_test_date: latest.completed_at,
        improvement_band: improvementBand,
        tests_completed: results.length,
        listening_improvement: skillImprovement('listening_score'),
        reading_improvement: skillImprovement('reading_score'),
        writing_improvement: skillImprovement('writing_score'),
        speaking_improvement: skillImprovement('speaking_score'),
        at_risk: atRisk,
      },
      create: {
        student_id: studentId,
        enrollment_id: enrollmentId,
        cert_type: certType,
        baseline_test_id: baseline.id,
        baseline_band_score: baselineBand,
        baseline_total_score: baseline.total_score,
        last_test_id: latest.id,
        last_band_score: lastBand,
        last_total_score: latest.total_score,
        last_test_date: latest.completed_at,
        improvement_band: improvementBand,
        tests_completed: results.length,
        target_band: targetBand,
        target_score: certType === 'ielts' ? 65 : 750,
        listening_improvement: skillImprovement('listening_score'),
        reading_improvement: skillImprovement('reading_score'),
        writing_improvement: skillImprovement('writing_score'),
        speaking_improvement: skillImprovement('speaking_score'),
        at_risk: atRisk,
      },
    });

    this.logger.log(
      `Refreshed StudentLearningProgress for enrollment ${enrollmentId}`,
    );
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async resolveStudentId(accountId: number): Promise<number | null> {
    const student = await this.prisma.student.findUnique({
      where: { account_id: accountId },
      select: { student_id: true },
    });
    return student?.student_id ?? null;
  }

  private async nextAttemptNumber(
    studentId: number,
    certType: string,
    enrollmentId?: number,
  ): Promise<number> {
    const where: any = { student_id: studentId, cert_type: certType };
    if (enrollmentId) where.enrollment_id = enrollmentId;
    const count = await this.prisma.studentTestResult.count({ where });
    return count + 1;
  }

  /**
   * Infer an approximate band from the raw scores when `band_score` is null.
   */
  private inferBand(
    result: {
      total_score: number | null;
      listening_score: number | null;
      reading_score: number | null;
      writing_score: number | null;
      speaking_score: number | null;
    },
    certType: string,
  ): number | null {
    if (certType === 'ielts') {
      // IELTS: total_score is band × 10
      if (result.total_score != null) return result.total_score / 10;
      // Average of skill scores (each band × 10)
      const skills = [
        result.listening_score,
        result.reading_score,
        result.writing_score,
        result.speaking_score,
      ].filter((s): s is number => s != null);
      if (skills.length > 0) {
        return (
          Math.round(
            (skills.reduce((a, b) => a + b, 0) / skills.length / 10) * 2,
          ) / 2
        );
      }
      return null;
    }
    // TOEIC: total_score is 0–990 → project onto ~0–9 scale
    if (result.total_score != null) return result.total_score / 110;
    return null;
  }
}
