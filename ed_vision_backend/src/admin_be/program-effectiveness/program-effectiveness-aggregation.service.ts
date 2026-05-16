import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Scheduled aggregation that keeps `ProgramEffectivenessMetric` and
 * `CohortPerformance` tables up to date.
 *
 * Runs daily at 02:00 (server time). Can also be triggered manually via
 * `runAggregation()`.
 */
@Injectable()
export class ProgramEffectivenessAggregationService {
  private readonly logger = new Logger(
    ProgramEffectivenessAggregationService.name,
  );

  constructor(private readonly prisma: PrismaService) {}

  // ── Cron entry point ──────────────────────────────────────────────────────

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleCron(): Promise<void> {
    this.logger.log('Starting daily program-effectiveness aggregation');
    await this.runAggregation();
    this.logger.log('Daily program-effectiveness aggregation finished');
  }

  /**
   * Public entry point so other code (e.g. admin controllers) can trigger a
   * manual refresh.
   */
  async runAggregation(): Promise<void> {
    try {
      await this.aggregateModuleMetrics();
      await this.aggregateCohortPerformance();
    } catch (err) {
      this.logger.error('Aggregation failed', err);
    }
  }

  // ── Module effectiveness ──────────────────────────────────────────────────

  /**
   * Aggregate `ProgramEffectivenessMetric` from certificate-topic-progress
   * and learning-progress data.
   *
   * For each (cert_type, program_component) pair we compute:
   *   - total_students:   distinct students who started the module
   *   - avg_improvement:  average band improvement for students who finished
   *   - completion_rate:  % of students who completed ≥ 80 % of the module
   *   - dropout_rate:     % of students who stopped before 20 % completion
   *   - effectiveness_rank: ordered by avg_improvement DESC
   */
  private async aggregateModuleMetrics(): Promise<void> {
    const now = new Date();
    const periodStart = new Date(
      now.getTime() - 90 * 24 * 60 * 60 * 1000,
    );

    // Get module-level stats from CertificateTopicProgress
    const moduleRows = await this.prisma.$queryRaw<
      Array<{
        cert_type: string;
        program_component: string;
        total_students: number | bigint;
        avg_improvement: number | null;
        completion_rate: number | null;
        dropout_rate: number | null;
      }>
    >`
      WITH module_stats AS (
        SELECT
          ce.cert_type,
          CONCAT('module_', LOWER(REPLACE(ctp.topic_name, ' ', '_'))) AS program_component,
          COUNT(DISTINCT ce.student_id)::int AS total_students,
          AVG(
            CASE WHEN ctp.progress_percent >= 80
              THEN slp.improvement_band
              ELSE NULL
            END
          )::float AS avg_improvement,
          (COUNT(*) FILTER (WHERE ctp.progress_percent >= 80) * 100.0 /
            NULLIF(COUNT(*), 0))::float AS completion_rate,
          (COUNT(*) FILTER (WHERE ctp.progress_percent < 20 AND ctp.progress_percent > 0) * 100.0 /
            NULLIF(COUNT(*), 0))::float AS dropout_rate
        FROM "CertificateTopicProgress" ctp
        JOIN "CertificateEnrollment" ce ON ce.id = ctp.enrollment_id
        LEFT JOIN "StudentLearningProgress" slp ON slp.enrollment_id = ce.id
        WHERE ce.status = 'active'
        GROUP BY ce.cert_type, ctp.topic_name
        HAVING COUNT(DISTINCT ce.student_id) >= 1
      )
      SELECT * FROM module_stats
      ORDER BY cert_type, avg_improvement DESC NULLS LAST
    `;

    if (moduleRows.length === 0) {
      this.logger.log(
        'No module data found — falling back to enrollment-based aggregation',
      );
      await this.aggregateModuleMetricsFallback(periodStart, now);
      return;
    }

    // Upsert metrics with ranking
    const byCert = new Map<string, typeof moduleRows>();
    for (const row of moduleRows) {
      const list = byCert.get(row.cert_type) ?? [];
      list.push(row);
      byCert.set(row.cert_type, list);
    }

    for (const [certType, rows] of byCert) {
      // Rank by avg_improvement DESC
      const sorted = [...rows].sort(
        (a, b) => (b.avg_improvement ?? 0) - (a.avg_improvement ?? 0),
      );

      for (let i = 0; i < sorted.length; i++) {
        const row = sorted[i];
        const rank = i + 1;
        const dropout = Number(row.dropout_rate ?? 0);
        const needsAttention = dropout > 15 || (row.avg_improvement ?? 0) < 0.3;

        await this.prisma.$executeRaw`
          INSERT INTO "ProgramEffectivenessMetric" (
            cert_type, program_component, total_students, avg_improvement,
            completion_rate, dropout_rate, effectiveness_rank,
            needs_attention, attention_reason,
            period_start, period_end, created_at, updated_at
          ) VALUES (
            ${certType}, ${row.program_component}, ${Number(row.total_students)},
            ${row.avg_improvement ?? 0}, ${row.completion_rate ?? 0},
            ${dropout}, ${rank}, ${needsAttention},
            ${needsAttention ? (dropout > 15 ? 'high_dropout' : 'low_improvement') : null},
            ${periodStart}, ${now}, NOW(), NOW()
          )
          ON CONFLICT (cert_type, program_component, period_start)
          DO UPDATE SET
            total_students = EXCLUDED.total_students,
            avg_improvement = EXCLUDED.avg_improvement,
            completion_rate = EXCLUDED.completion_rate,
            dropout_rate = EXCLUDED.dropout_rate,
            effectiveness_rank = EXCLUDED.effectiveness_rank,
            needs_attention = EXCLUDED.needs_attention,
            attention_reason = EXCLUDED.attention_reason,
            period_end = EXCLUDED.period_end,
            updated_at = NOW()
        `;
      }

      this.logger.log(
        `Aggregated ${sorted.length} module metrics for ${certType}`,
      );
    }
  }

  /**
   * Fallback: when CertificateTopicProgress is empty, derive module metrics
   * from test results grouped by test_type.
   */
  private async aggregateModuleMetricsFallback(
    periodStart: Date,
    periodEnd: Date,
  ): Promise<void> {
    const rows = await this.prisma.$queryRaw<
      Array<{
        cert_type: string;
        test_type: string;
        total_students: number | bigint;
        avg_improvement: number | null;
      }>
    >`
      SELECT
        cert_type,
        test_type,
        COUNT(DISTINCT student_id)::int AS total_students,
        AVG(improvement_from_baseline)::float AS avg_improvement
      FROM "StudentTestResult"
      WHERE completed_at >= ${periodStart}
        AND completed_at <= ${periodEnd}
      GROUP BY cert_type, test_type
      HAVING COUNT(DISTINCT student_id) >= 1
    `;

    const componentMap: Record<string, string> = {
      diagnostic: 'module_diagnostic',
      placement: 'module_diagnostic',
      mock: 'module_mock_test',
      practice: 'module_grammar',
      official: 'module_mock_test',
    };

    for (const [idx, row] of rows.entries()) {
      const component = componentMap[row.test_type] ?? `module_${row.test_type}`;
      const rank = idx + 1;

      await this.prisma.$executeRaw`
        INSERT INTO "ProgramEffectivenessMetric" (
          cert_type, program_component, total_students, avg_improvement,
          completion_rate, dropout_rate, effectiveness_rank,
          needs_attention, period_start, period_end, created_at, updated_at
        ) VALUES (
          ${row.cert_type}, ${component}, ${Number(row.total_students)},
          ${row.avg_improvement ?? 0}, ${0}, ${0}, ${rank}, ${false},
          ${periodStart}, ${periodEnd}, NOW(), NOW()
        )
        ON CONFLICT (cert_type, program_component, period_start)
        DO UPDATE SET
          total_students = EXCLUDED.total_students,
          avg_improvement = EXCLUDED.avg_improvement,
          effectiveness_rank = EXCLUDED.effectiveness_rank,
          period_end = EXCLUDED.period_end,
          updated_at = NOW()
      `;
    }

    this.logger.log(
      `Fallback: aggregated ${rows.length} module metrics from test results`,
    );
  }

  // ── Cohort performance ────────────────────────────────────────────────────

  /**
   * Aggregate cohort-level performance from enrollments + learning-progress.
   * Groups by (cohort_year, major) from the Student table and by cert_type.
   */
  private async aggregateCohortPerformance(): Promise<void> {
    const now = new Date();
    const periodStart = new Date(
      now.getTime() - 90 * 24 * 60 * 60 * 1000,
    );

    const rows = await this.prisma.$queryRaw<
      Array<{
        cohort_type: string;
        cohort_id: string;
        cohort_name: string;
        cert_type: string;
        total_students: number | bigint;
        active_students: number | bigint;
        tested_students: number | bigint;
        avg_baseline: number | null;
        avg_current: number | null;
        avg_improvement: number | null;
        reached_target: number | bigint;
      }>
    >`
      WITH cohort_data AS (
        SELECT
          CASE
            WHEN s.cohort_year IS NOT NULL THEN 'year'
            ELSE 'department'
          END AS cohort_type,
          COALESCE('Y' || s.cohort_year::text, COALESCE(s.major, 'unknown')) AS cohort_id,
          CASE
            WHEN s.cohort_year IS NOT NULL
              THEN CONCAT('Năm ', (EXTRACT(YEAR FROM NOW())::int - s.cohort_year + 1), ' - ', COALESCE(s.major, 'Chung'))
            ELSE COALESCE(s.major, 'Chung')
          END AS cohort_name,
          ce.cert_type,
          s.student_id,
          ce.id AS enrollment_id,
          ce.last_activity_at,
          slp.baseline_band_score,
          slp.last_band_score,
          slp.improvement_band,
          slp.target_band,
          CASE WHEN slp.last_band_score >= slp.target_band THEN 1 ELSE 0 END AS reached
        FROM "Student" s
        JOIN "CertificateEnrollment" ce ON ce.student_id = s.student_id
          AND ce.status = 'active'
        LEFT JOIN "StudentLearningProgress" slp ON slp.enrollment_id = ce.id
      )
      SELECT
        cohort_type,
        cohort_id,
        cohort_name,
        cert_type,
        COUNT(DISTINCT student_id)::int AS total_students,
        COUNT(DISTINCT student_id) FILTER (
          WHERE last_activity_at >= ${periodStart}
        )::int AS active_students,
        COUNT(DISTINCT student_id) FILTER (
          WHERE last_band_score IS NOT NULL
        )::int AS tested_students,
        AVG(baseline_band_score)::float AS avg_baseline,
        AVG(last_band_score)::float AS avg_current,
        AVG(improvement_band)::float AS avg_improvement,
        SUM(reached)::int AS reached_target
      FROM cohort_data
      GROUP BY cohort_type, cohort_id, cohort_name, cert_type
      HAVING COUNT(DISTINCT student_id) >= 3
      ORDER BY total_students DESC
      LIMIT 20
    `;

    for (const row of rows) {
      const totalStudents = Number(row.total_students);
      const reachedTarget = Number(row.reached_target);
      const successRate =
        totalStudents > 0
          ? Math.round((reachedTarget / totalStudents) * 100)
          : 0;

      await this.prisma.$executeRaw`
        INSERT INTO "CohortPerformance" (
          cohort_type, cohort_id, cohort_name, cert_type,
          period_type, period_start, period_end,
          total_students, active_students, tested_students,
          avg_baseline_band, avg_current_band, avg_improvement,
          target_band, students_reached_target, success_rate_percent,
          created_at, updated_at
        ) VALUES (
          ${row.cohort_type}, ${row.cohort_id}, ${row.cohort_name}, ${row.cert_type},
          'quarterly', ${periodStart}, ${now},
          ${totalStudents}, ${Number(row.active_students)}, ${Number(row.tested_students)},
          ${row.avg_baseline}, ${row.avg_current}, ${row.avg_improvement},
          ${row.cert_type === 'ielts' ? 6.5 : 6.8},
          ${reachedTarget}, ${successRate},
          NOW(), NOW()
        )
        ON CONFLICT (cohort_type, cohort_id, cert_type, period_type, period_start)
        DO UPDATE SET
          cohort_name = EXCLUDED.cohort_name,
          total_students = EXCLUDED.total_students,
          active_students = EXCLUDED.active_students,
          tested_students = EXCLUDED.tested_students,
          avg_baseline_band = EXCLUDED.avg_baseline_band,
          avg_current_band = EXCLUDED.avg_current_band,
          avg_improvement = EXCLUDED.avg_improvement,
          students_reached_target = EXCLUDED.students_reached_target,
          success_rate_percent = EXCLUDED.success_rate_percent,
          period_end = EXCLUDED.period_end,
          updated_at = NOW()
      `;
    }

    this.logger.log(`Aggregated ${rows.length} cohort performance rows`);
  }
}
