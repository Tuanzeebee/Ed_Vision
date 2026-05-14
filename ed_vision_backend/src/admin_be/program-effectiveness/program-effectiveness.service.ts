import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ProgramEffectivenessAchievement,
  ProgramEffectivenessBadgeTone,
  ProgramEffectivenessCertType,
  ProgramEffectivenessGroup,
  ProgramEffectivenessIconKey,
  ProgramEffectivenessModuleImpact,
  ProgramEffectivenessQueryDto,
  ProgramEffectivenessRatingTone,
  ProgramEffectivenessResponse,
  ProgramEffectivenessScoreComparison,
} from './dto/program-effectiveness.dto';

const IELTS_SKILL_LABELS = ['Listening', 'Reading', 'Writing', 'Speaking'];
const TOEIC_SKILL_LABELS = ['Listening', 'Reading'];
const ALL_SKILL_LABELS = ['Listening', 'Reading', 'Writing', 'Speaking'];

const IELTS_BAND_DIVISOR = 10; // StudentTestResult stores IELTS band × 10
const TOEIC_LR_BAND_DIVISOR = 55; // ≈ 495 / 9 — projects TOEIC L/R onto 0–9
const TOEIC_WS_BAND_DIVISOR = 22.2; // ≈ 200 / 9 — projects TOEIC W/S onto 0–9

const IELTS_TARGET_BAND = 6.5;
const TOEIC_TARGET_SCORE = 750;

const MODULE_LABELS: Record<string, string> = {
  module_grammar: 'Module Ngữ pháp ứng dụng',
  module_grammar_application: 'Module Ngữ pháp ứng dụng',
  module_mock_test: 'Module Luyện đề Mock Test',
  module_mock: 'Module Luyện đề Mock Test',
  module_writing: 'Module Writing Workshop',
  module_writing_workshop: 'Module Writing Workshop',
  module_speaking: 'Module Speaking Practice',
  module_speaking_practice: 'Module Speaking Practice',
  module_listening: 'Module Listening Drill',
  module_listening_drill: 'Module Listening Drill',
  module_reading: 'Module Reading Comprehension',
  module_reading_comprehension: 'Module Reading Comprehension',
  module_vocabulary: 'Module Vocabulary Builder',
  module_vocab: 'Module Vocabulary Builder',
  module_diagnostic: 'Module Diagnostic Test',
};

interface ScoreAggregateRow {
  cert_type: string;
  avg_listening: number | string | null;
  avg_reading: number | string | null;
  avg_writing: number | string | null;
  avg_speaking: number | string | null;
  listening_count: number | string | bigint | null;
  reading_count: number | string | bigint | null;
  writing_count: number | string | bigint | null;
  speaking_count: number | string | bigint | null;
  /** Distinct students contributing any score in the bucket for this cert. */
  student_count: number | string | bigint | null;
}

interface AchievementBucketRow {
  total: number | string | bigint | null;
  reached: number | string | bigint | null;
}

interface ModuleMetricRow {
  id: number;
  cert_type: string;
  program_component: string;
  total_students: number | string | bigint | null;
  avg_improvement: number | string | null;
  completion_rate: number | string | null;
  dropout_rate: number | string | null;
  effectiveness_rank: number | string | bigint | null;
  needs_attention: boolean;
  attention_reason: string | null;
  period_end: Date | null;
}

interface CohortRow {
  id: number;
  cohort_type: string;
  cohort_id: string;
  cohort_name: string;
  cert_type: string | null;
  total_students: number | string | bigint | null;
  avg_improvement: number | string | null;
  success_rate_percent: number | string | null;
  period_end: Date | null;
}

@Injectable()
export class ProgramEffectivenessService {
  private readonly logger = new Logger(ProgramEffectivenessService.name);

  constructor(private readonly prisma: PrismaService) {}

  private toNumber(value: number | string | bigint | null | undefined): number {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'bigint') return Number(value);
    if (typeof value === 'string') return Number.parseFloat(value) || 0;
    return value;
  }

  private round1(value: number): number {
    return Math.round(value * 10) / 10;
  }

  /**
   * Project a raw averaged score for a given certificate type and skill onto
   * the IELTS 0–9 band scale used by the score comparison chart.
   */
  private bandify(
    avg: number,
    certType: 'ielts' | 'toeic',
    skill: number,
  ): number {
    if (avg <= 0) return 0;
    if (certType === 'ielts') {
      return avg / IELTS_BAND_DIVISOR;
    }
    // TOEIC: listening/reading use the 0–495 range, writing/speaking use 0–200.
    const divisor = skill <= 1 ? TOEIC_LR_BAND_DIVISOR : TOEIC_WS_BAND_DIVISOR;
    return avg / divisor;
  }

  private async aggregateScores(
    phase: 'entry' | 'exit',
    certType: ProgramEffectivenessCertType,
  ): Promise<ScoreAggregateRow[]> {
    const includeIelts = certType === 'ielts' || certType === 'all';
    const includeToeic = certType === 'toeic' || certType === 'all';

    /*
     * For entry we use the explicit `is_baseline = true` row when present and
     * fall back to `test_phase = 'entry'`. For exit we take the most recent
     * test per student (preferring `test_phase = 'exit'`/`final` when set).
     *
     * Aggregation is split per cert_type so IELTS scores (band × 10) and
     * TOEIC scores (raw 0–495 / 0–200) can be rescaled independently before
     * being combined on the IELTS band-equivalent scale.
     */
    const rows = await this.prisma.$queryRaw<ScoreAggregateRow[]>`
      WITH base AS (
        SELECT student_id, cert_type, listening_score, reading_score,
               writing_score, speaking_score, completed_at, is_baseline,
               test_phase, attempt_number, created_at
        FROM "StudentTestResult"
        WHERE (${includeIelts}::boolean AND cert_type = 'ielts')
           OR (${includeToeic}::boolean AND cert_type = 'toeic')
      ),
      ranked AS (
        SELECT *,
               ROW_NUMBER() OVER (
                 PARTITION BY student_id, cert_type
                 ORDER BY
                   CASE
                     WHEN ${phase}::text = 'entry' AND is_baseline = true THEN 0
                     WHEN ${phase}::text = 'entry' AND test_phase = 'entry' THEN 1
                     WHEN ${phase}::text = 'exit' AND test_phase IN ('exit', 'final') THEN 0
                     ELSE 2
                   END,
                   CASE WHEN ${phase}::text = 'exit'
                        THEN COALESCE(completed_at, created_at)
                        ELSE NULL END DESC NULLS LAST,
                   CASE WHEN ${phase}::text = 'entry'
                        THEN COALESCE(completed_at, created_at)
                        ELSE NULL END ASC NULLS LAST,
                   attempt_number ASC
               ) AS rk
        FROM base
      ),
      chosen AS (
        SELECT * FROM ranked WHERE rk = 1
      )
      SELECT
        cert_type,
        AVG(listening_score)::float AS avg_listening,
        AVG(reading_score)::float   AS avg_reading,
        AVG(writing_score)::float   AS avg_writing,
        AVG(speaking_score)::float  AS avg_speaking,
        COUNT(listening_score)::int AS listening_count,
        COUNT(reading_score)::int   AS reading_count,
        COUNT(writing_score)::int   AS writing_count,
        COUNT(speaking_score)::int  AS speaking_count,
        COUNT(DISTINCT student_id)::int AS student_count
      FROM chosen
      GROUP BY cert_type
    `;

    return rows;
  }

  /**
   * Returns averaged entry vs exit scores per skill on the IELTS 0–9 band
   * scale. When mixing certificates, scores are weighted by how many students
   * contributed to each cert/skill bucket and then averaged on the band scale
   * to produce a single number per skill.
   */
  private async buildScoreComparison(
    certType: ProgramEffectivenessCertType,
  ): Promise<ProgramEffectivenessScoreComparison> {
    const [entryRows, exitRows] = await Promise.all([
      this.aggregateScores('entry', certType),
      this.aggregateScores('exit', certType),
    ]);

    const skillAvgKeys = [
      'avg_listening',
      'avg_reading',
      'avg_writing',
      'avg_speaking',
    ] as const;
    const skillCountKeys = [
      'listening_count',
      'reading_count',
      'writing_count',
      'speaking_count',
    ] as const;

    const projectSkill = (rows: ScoreAggregateRow[], skill: number): number => {
      if (rows.length === 0) return 0;
      let weightedBand = 0;
      let totalCount = 0;
      for (const row of rows) {
        const count = this.toNumber(row[skillCountKeys[skill]]);
        if (count <= 0) continue;
        const avg = this.toNumber(row[skillAvgKeys[skill]]);
        const cert: 'ielts' | 'toeic' =
          row.cert_type === 'ielts' ? 'ielts' : 'toeic';
        const band = this.bandify(avg, cert, skill);
        weightedBand += band * count;
        totalCount += count;
      }
      if (totalCount <= 0) return 0;
      return weightedBand / totalCount;
    };

    const totalStudents = (rows: ScoreAggregateRow[]): number =>
      rows.reduce((sum, row) => sum + this.toNumber(row.student_count), 0);

    // TOEIC only has Listening + Reading (indices 0, 1)
    // IELTS / all has all 4 skills (indices 0, 1, 2, 3)
    const skillIndices = certType === 'toeic' ? [0, 1] : [0, 1, 2, 3];
    const labels =
      certType === 'toeic'
        ? TOEIC_SKILL_LABELS
        : certType === 'ielts'
          ? IELTS_SKILL_LABELS
          : ALL_SKILL_LABELS;

    const entryValues = skillIndices.map((i) =>
      this.round1(projectSkill(entryRows, i)),
    );
    const exitValues = skillIndices.map((i) =>
      this.round1(projectSkill(exitRows, i)),
    );

    return {
      labels,
      entry: entryValues,
      exit: exitValues,
      scaleMax: 9,
      entrySampleSize: totalStudents(entryRows),
      exitSampleSize: totalStudents(exitRows),
    };
  }

  /**
   * Standards-achievement doughnut. Uses `StudentLearningProgress` for the
   * overall metric (compares `last_band_score` against the per-enrollment
   * `target_band`), and per-cert breakdowns use the canonical 6.5 / 750
   * thresholds shown in the UI.
   */
  private async buildAchievement(
    certType: ProgramEffectivenessCertType,
  ): Promise<ProgramEffectivenessAchievement> {
    const includeIelts = certType === 'ielts' || certType === 'all';
    const includeToeic = certType === 'toeic' || certType === 'all';

    const overallRows = await this.prisma.$queryRaw<AchievementBucketRow[]>`
      SELECT COUNT(*)::int AS total,
             COUNT(*) FILTER (
               WHERE target_band IS NOT NULL
                 AND last_band_score IS NOT NULL
                 AND last_band_score >= target_band
             )::int AS reached
      FROM "StudentLearningProgress"
      WHERE (${includeIelts}::boolean AND cert_type = 'ielts')
         OR (${includeToeic}::boolean AND cert_type = 'toeic')
    `;

    const ieltsRows = await this.prisma.$queryRaw<AchievementBucketRow[]>`
      SELECT COUNT(*)::int AS total,
             COUNT(*) FILTER (
               WHERE last_band_score IS NOT NULL AND last_band_score >= ${IELTS_TARGET_BAND}
             )::int AS reached
      FROM "StudentLearningProgress"
      WHERE cert_type = 'ielts'
    `;

    const toeicRows = await this.prisma.$queryRaw<AchievementBucketRow[]>`
      SELECT COUNT(*)::int AS total,
             COUNT(*) FILTER (
               WHERE last_total_score IS NOT NULL AND last_total_score >= ${TOEIC_TARGET_SCORE}
             )::int AS reached
      FROM "StudentLearningProgress"
      WHERE cert_type = 'toeic'
    `;

    const overall = overallRows[0];
    const ielts = ieltsRows[0];
    const toeic = toeicRows[0];

    const overallTotal = this.toNumber(overall?.total);
    const overallReached = this.toNumber(overall?.reached);
    const ieltsTotal = this.toNumber(ielts?.total);
    const ieltsReached = this.toNumber(ielts?.reached);
    const toeicTotal = this.toNumber(toeic?.total);
    const toeicReached = this.toNumber(toeic?.reached);

    return {
      successRate:
        overallTotal > 0
          ? Math.round((overallReached / overallTotal) * 100)
          : 0,
      totalEvaluated: overallTotal,
      ieltsAchievementRate:
        ieltsTotal > 0 ? Math.round((ieltsReached / ieltsTotal) * 100) : 0,
      ieltsEvaluated: ieltsTotal,
      toeicAchievementRate:
        toeicTotal > 0 ? Math.round((toeicReached / toeicTotal) * 100) : 0,
      toeicEvaluated: toeicTotal,
    };
  }

  private formatModuleName(component: string): string {
    const normalised = (component || '').toLowerCase().trim();
    const direct = MODULE_LABELS[normalised];
    if (direct) return direct;
    // Generic fallback: turn `module_writing_workshop` → `Module Writing Workshop`.
    const cleaned = normalised
      .replace(/^module[_-]?/, '')
      .replace(/[_-]+/g, ' ')
      .trim();
    if (!cleaned) return component;
    const titled = cleaned
      .split(' ')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
    return `Module ${titled}`;
  }

  private buildModuleDescription(row: ModuleMetricRow): string {
    if (row.needs_attention) {
      const dropout = this.toNumber(row.dropout_rate);
      if (dropout > 0) {
        return `Tỷ lệ bỏ dở cao (${this.round1(dropout)}%)`;
      }
      const completion = this.toNumber(row.completion_rate);
      if (completion > 0) {
        return `Hoàn thành thấp (${this.round1(completion)}%)`;
      }
      return row.attention_reason
        ? `Cần tối ưu: ${row.attention_reason}`
        : 'Cần tối ưu';
    }

    const improvement = this.toNumber(row.avg_improvement);
    if (improvement > 0) {
      return `Cải thiện trung bình +${this.round1(improvement)} band`;
    }
    const completion = this.toNumber(row.completion_rate);
    if (completion > 0) {
      return `Hoàn thành ${this.round1(completion)}%`;
    }
    return 'Đang theo dõi';
  }

  private buildModuleBadge(
    rank: number,
    needsAttention: boolean,
  ): {
    badge: string;
    badgeTone: ProgramEffectivenessBadgeTone;
    iconKey: ProgramEffectivenessIconKey;
  } {
    if (needsAttention) {
      return {
        badge: 'Cần tối ưu',
        badgeTone: 'warning',
        iconKey: 'attention',
      };
    }
    if (rank === 1) {
      return { badge: 'Top 1', badgeTone: 'success', iconKey: 'improvement' };
    }
    if (rank === 2) {
      return { badge: 'Top 2', badgeTone: 'info', iconKey: 'improvement' };
    }
    return { badge: `Top ${rank}`, badgeTone: 'info', iconKey: 'improvement' };
  }

  /**
   * Module impact list — up to 2 best-ranked modules plus 1 module flagged
   * `needs_attention`. Top-ranked modules are deduplicated against the
   * attention slot so the same row never appears twice.
   */
  private async buildModuleImpact(
    certType: ProgramEffectivenessCertType,
  ): Promise<ProgramEffectivenessModuleImpact[]> {
    const includeIelts = certType === 'ielts' || certType === 'all';
    const includeToeic = certType === 'toeic' || certType === 'all';

    const rows = await this.prisma.$queryRaw<ModuleMetricRow[]>`
      WITH latest AS (
        SELECT *,
               ROW_NUMBER() OVER (
                 PARTITION BY cert_type, program_component
                 ORDER BY period_end DESC
               ) AS rk
        FROM "ProgramEffectivenessMetric"
        WHERE (${includeIelts}::boolean AND cert_type = 'ielts')
           OR (${includeToeic}::boolean AND cert_type = 'toeic')
      )
      SELECT id, cert_type, program_component, total_students, avg_improvement,
             completion_rate, dropout_rate, effectiveness_rank,
             needs_attention, attention_reason, period_end
      FROM latest
      WHERE rk = 1
    `;

    const topRanked = rows
      .filter((r) => !r.needs_attention && r.effectiveness_rank !== null)
      .sort(
        (a, b) =>
          this.toNumber(a.effectiveness_rank) -
          this.toNumber(b.effectiveness_rank),
      )
      .slice(0, 2);

    const attention = rows
      .filter((r) => r.needs_attention && !topRanked.some((t) => t.id === r.id))
      .sort(
        (a, b) => this.toNumber(b.dropout_rate) - this.toNumber(a.dropout_rate),
      )[0];

    const ordered: ModuleMetricRow[] = [...topRanked];
    if (attention) ordered.push(attention);

    return ordered.map((row, index) => {
      const isAttention = row.needs_attention;
      const rank = isAttention ? 0 : index + 1;
      const { badge, badgeTone, iconKey } = this.buildModuleBadge(
        rank,
        isAttention,
      );
      return {
        id: `module-${row.id}`,
        programComponent: row.program_component,
        name: this.formatModuleName(row.program_component),
        description: this.buildModuleDescription(row),
        badge,
        badgeTone,
        iconKey,
        improvement:
          row.avg_improvement === null
            ? null
            : this.round1(this.toNumber(row.avg_improvement)),
        dropoutRate:
          row.dropout_rate === null
            ? null
            : this.round1(this.toNumber(row.dropout_rate)),
        completionRate:
          row.completion_rate === null
            ? null
            : this.round1(this.toNumber(row.completion_rate)),
        totalStudents: this.toNumber(row.total_students),
        effectivenessRank:
          row.effectiveness_rank === null
            ? null
            : this.toNumber(row.effectiveness_rank),
        needsAttention: row.needs_attention,
      };
    });
  }

  private resolveRating(successRate: number): {
    rating: string;
    ratingTone: ProgramEffectivenessRatingTone;
  } {
    if (successRate >= 90) return { rating: 'Xuất sắc', ratingTone: 'success' };
    if (successRate >= 80) return { rating: 'Rất tốt', ratingTone: 'success' };
    if (successRate >= 65) return { rating: 'Tốt', ratingTone: 'info' };
    if (successRate >= 50) {
      return { rating: 'Trung bình', ratingTone: 'warning' };
    }
    return { rating: 'Cần cải thiện', ratingTone: 'danger' };
  }

  /**
   * Group effectiveness table. Returns up to 5 most recently-evaluated
   * cohorts that match the requested cert filter, biased to those with the
   * largest student populations.
   */
  private async buildGroupEffectiveness(
    certType: ProgramEffectivenessCertType,
  ): Promise<ProgramEffectivenessGroup[]> {
    const includeAll = certType === 'all';
    const certFilter = certType === 'all' ? null : certType;

    /*
     * For a specific cert, only show cohort rows matching that cert_type. For
     * `all`, include every cohort row regardless of cert_type so the table
     * stays populated even when no aggregate (cert_type IS NULL) rows exist.
     */
    const rows = await this.prisma.$queryRaw<CohortRow[]>`
      WITH latest AS (
        SELECT *,
               ROW_NUMBER() OVER (
                 PARTITION BY cohort_type, cohort_id, cert_type
                 ORDER BY period_end DESC
               ) AS rk
        FROM "CohortPerformance"
        WHERE ${includeAll}::boolean
           OR cert_type = ${certFilter}
      )
      SELECT id, cohort_type, cohort_id, cohort_name, cert_type,
             total_students, avg_improvement, success_rate_percent, period_end
      FROM latest
      WHERE rk = 1
      ORDER BY total_students DESC NULLS LAST, period_end DESC NULLS LAST
      LIMIT 5
    `;

    return rows.map((row) => {
      const successRate = Math.round(this.toNumber(row.success_rate_percent));
      const { rating, ratingTone } = this.resolveRating(successRate);
      return {
        id: `cohort-${row.id}`,
        cohortType: row.cohort_type,
        cohortId: row.cohort_id,
        cohortName: row.cohort_name,
        totalStudents: this.toNumber(row.total_students),
        avgImprovement: this.round1(this.toNumber(row.avg_improvement)),
        successRate,
        rating,
        ratingTone,
      };
    });
  }

  async getProgramEffectiveness(
    query: ProgramEffectivenessQueryDto,
  ): Promise<ProgramEffectivenessResponse> {
    const certType: ProgramEffectivenessCertType = query.certType || 'all';

    try {
      const [scoreComparison, achievement, moduleImpact, groupEffectiveness] =
        await Promise.all([
          this.buildScoreComparison(certType),
          this.buildAchievement(certType),
          this.buildModuleImpact(certType),
          this.buildGroupEffectiveness(certType),
        ]);

      return {
        certType,
        scoreComparison,
        achievement,
        moduleImpact,
        groupEffectiveness,
      };
    } catch (err) {
      this.logger.error(
        'Failed to build program effectiveness dashboard',
        err as Error,
      );
      return {
        certType,
        scoreComparison: {
          labels: ALL_SKILL_LABELS,
          entry: [0, 0, 0, 0],
          exit: [0, 0, 0, 0],
          scaleMax: 9,
          entrySampleSize: 0,
          exitSampleSize: 0,
        },
        achievement: {
          successRate: 0,
          totalEvaluated: 0,
          ieltsAchievementRate: 0,
          ieltsEvaluated: 0,
          toeicAchievementRate: 0,
          toeicEvaluated: 0,
        },
        moduleImpact: [],
        groupEffectiveness: [],
      };
    }
  }
}
