import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  DurationResponse,
  FeatureUsageItem,
  FeatureUsageResponse,
  HeatmapResponse,
  UsageBehaviorQueryDto,
  UsageBehaviorResponse,
  UsageTimeRange,
} from './dto/usage-behavior.dto';

/** Maps an ISO weekday number (1=Mon..7=Sun) to the index used by the UI. */
const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

/**
 * Three coarse time-of-day buckets matching the UI rows
 * (08:00 → morning, 14:00 → afternoon, 20:00 → evening).
 */
const HOUR_BUCKETS: Array<{
  label: string;
  startHour: number;
  endHour: number;
}> = [
  { label: '08:00', startHour: 6, endHour: 12 },
  { label: '14:00', startHour: 12, endHour: 18 },
  { label: '20:00', startHour: 18, endHour: 24 },
];

interface HeatmapBucketRow {
  hour_bucket: number | string;
  day_index: number | string;
  cnt: number | string | bigint;
}

interface DurationRow {
  day_index: number | string;
  avg_minutes: number | string | null;
}

interface CountRow {
  cnt: number | string | bigint;
}

interface FeatureRow {
  feature: string;
  cnt: number | string | bigint;
}

@Injectable()
export class UsageBehaviorService {
  private readonly logger = new Logger(UsageBehaviorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Resolve the requested time window to an inclusive [start, end] pair. */
  private resolveRange(timeRange: UsageTimeRange): {
    start: Date;
    end: Date;
  } {
    const days = timeRange === '90d' ? 90 : timeRange === '30d' ? 30 : 7;
    const end = new Date();
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
    return { start, end };
  }

  private toNumber(value: number | string | bigint | null | undefined): number {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'bigint') return Number(value);
    if (typeof value === 'string') return Number.parseFloat(value) || 0;
    return value;
  }

  /**
   * Build a 3 (hour bucket) × 7 (weekday) matrix and a normalized 0..4 intensity
   * matrix that the UI can map directly to Tailwind color shades.
   *
   * Data source: union of UserActivityLog (when populated) and StudySession —
   * both contain real activity timestamps for accounts.
   */
  private async buildHeatmap(start: Date, end: Date): Promise<HeatmapResponse> {
    const rows = await this.prisma.$queryRaw<HeatmapBucketRow[]>`
      WITH events AS (
        SELECT created_at AS occurred_at
          FROM "UserActivityLog"
         WHERE created_at >= ${start} AND created_at <= ${end}
        UNION ALL
        SELECT started_at AS occurred_at
          FROM "StudySession"
         WHERE started_at >= ${start} AND started_at <= ${end}
      )
      SELECT
        CASE
          WHEN EXTRACT(HOUR FROM occurred_at) >= 6  AND EXTRACT(HOUR FROM occurred_at) < 12 THEN 0
          WHEN EXTRACT(HOUR FROM occurred_at) >= 12 AND EXTRACT(HOUR FROM occurred_at) < 18 THEN 1
          WHEN EXTRACT(HOUR FROM occurred_at) >= 18 AND EXTRACT(HOUR FROM occurred_at) < 24 THEN 2
          ELSE -1
        END AS hour_bucket,
        (
          (CAST(EXTRACT(ISODOW FROM occurred_at) AS INTEGER) - 1)
        ) AS day_index,
        COUNT(*)::int AS cnt
      FROM events
      GROUP BY hour_bucket, day_index
    `;

    const matrix: number[][] = HOUR_BUCKETS.map(() =>
      Array(DAY_LABELS.length).fill(0),
    );
    for (const row of rows) {
      const hourBucket = Number(row.hour_bucket);
      const dayIndex = Number(row.day_index);
      if (
        hourBucket < 0 ||
        hourBucket >= HOUR_BUCKETS.length ||
        dayIndex < 0 ||
        dayIndex >= DAY_LABELS.length
      ) {
        continue;
      }
      matrix[hourBucket][dayIndex] = this.toNumber(row.cnt);
    }

    const flat = matrix.flat();
    const max = flat.length ? Math.max(...flat) : 0;
    const intensity: number[][] = matrix.map((row) =>
      row.map((value) => {
        if (max <= 0) return 0;
        const ratio = value / max;
        if (ratio === 0) return 0;
        if (ratio <= 0.25) return 1;
        if (ratio <= 0.5) return 2;
        if (ratio <= 0.75) return 3;
        return 4;
      }),
    );

    return {
      hours: HOUR_BUCKETS.map((b) => b.label),
      days: DAY_LABELS,
      matrix,
      intensity,
    };
  }

  /**
   * Average study-session duration (minutes) per weekday — directly powers the
   * bar chart "Thời lượng học trung bình / phiên".
   */
  private async buildDuration(
    start: Date,
    end: Date,
  ): Promise<DurationResponse> {
    const rows = await this.prisma.$queryRaw<DurationRow[]>`
      SELECT
        (CAST(EXTRACT(ISODOW FROM started_at) AS INTEGER) - 1) AS day_index,
        AVG(NULLIF(duration_minutes, 0))::float AS avg_minutes
      FROM "StudySession"
      WHERE started_at >= ${start}
        AND started_at <= ${end}
        AND duration_minutes IS NOT NULL
      GROUP BY day_index
    `;

    const values = Array(DAY_LABELS.length).fill(0);
    for (const row of rows) {
      const dayIndex = Number(row.day_index);
      if (dayIndex < 0 || dayIndex >= DAY_LABELS.length) continue;
      values[dayIndex] = Math.round(this.toNumber(row.avg_minutes));
    }

    return { labels: DAY_LABELS, values };
  }

  /**
   * Count distinct activity events per feature category in the window.
   *
   * Combines explicit UserActivityLog rows (preferred) with proxy counts from
   * pre-existing session tables so the dashboard shows real data even before
   * the activity logger is fully wired up across the app.
   */
  private async buildFeatureUsage(
    start: Date,
    end: Date,
  ): Promise<FeatureUsageResponse> {
    const [
      activityLogByFeature,
      toeicExamCount,
      ieltsPlacementCount,
      ieltsBandTestCount,
      toeicPracticeCount,
      vocabTestCount,
      ieltsPracticeCount,
      certificateActivityCount,
      roomParticipantCount,
      studySessionRoomCount,
    ] = await Promise.all([
      this.prisma.$queryRaw<FeatureRow[]>`
        SELECT feature, COUNT(*)::int AS cnt
        FROM "UserActivityLog"
        WHERE created_at >= ${start} AND created_at <= ${end}
        GROUP BY feature
      `,
      this.prisma.$queryRaw<CountRow[]>`
        SELECT COUNT(*)::int AS cnt FROM "ToeicExamSession"
        WHERE started_at >= ${start} AND started_at <= ${end}
      `,
      this.prisma.$queryRaw<CountRow[]>`
        SELECT COUNT(*)::int AS cnt FROM "ielts_placement_sessions"
        WHERE started_at >= ${start} AND started_at <= ${end}
      `,
      this.prisma.$queryRaw<CountRow[]>`
        SELECT COUNT(*)::int AS cnt FROM "IeltsBandTest"
        WHERE created_at >= ${start} AND created_at <= ${end}
      `,
      this.prisma.$queryRaw<CountRow[]>`
        SELECT COUNT(*)::int AS cnt FROM "ToeicPracticePartSession"
        WHERE completed_at >= ${start} AND completed_at <= ${end}
      `,
      this.prisma.$queryRaw<CountRow[]>`
        SELECT COUNT(*)::int AS cnt FROM "VocabTestSession"
        WHERE started_at >= ${start} AND started_at <= ${end}
      `,
      this.prisma.$queryRaw<CountRow[]>`
        SELECT COUNT(*)::int AS cnt FROM "IeltsPracticeSession"
        WHERE created_at >= ${start} AND created_at <= ${end}
      `,
      this.prisma.$queryRaw<CountRow[]>`
        SELECT COUNT(*)::int AS cnt FROM "CertificateEnrollment"
        WHERE last_activity_at IS NOT NULL
          AND last_activity_at >= ${start}
          AND last_activity_at <= ${end}
      `,
      this.prisma.$queryRaw<CountRow[]>`
        SELECT COUNT(*)::int AS cnt FROM "RoomParticipant"
        WHERE joined_at >= ${start} AND joined_at <= ${end}
      `,
      this.prisma.$queryRaw<CountRow[]>`
        SELECT COUNT(*)::int AS cnt FROM "StudySession"
        WHERE started_at >= ${start}
          AND started_at <= ${end}
          AND room_id IS NOT NULL
      `,
    ]);

    const logCounts: Record<string, number> = {};
    for (const row of activityLogByFeature) {
      logCounts[row.feature] =
        (logCounts[row.feature] || 0) + this.toNumber(row.cnt);
    }

    const testFromLogs =
      (logCounts['exam'] || 0) +
      (logCounts['test'] || 0) +
      (logCounts['diagnostic'] || 0);
    const videoFromLogs =
      (logCounts['lesson'] || 0) + (logCounts['video'] || 0);
    const practiceFromLogs = logCounts['practice'] || 0;
    const certificateFromLogs = logCounts['certificate'] || 0;

    const tests =
      testFromLogs +
      this.toNumber(toeicExamCount[0]?.cnt) +
      this.toNumber(ieltsPlacementCount[0]?.cnt) +
      this.toNumber(ieltsBandTestCount[0]?.cnt);

    /**
     * "Xem Video" — no first-party video table exists yet, so we count
     * live-room / study-room sessions (participants and study sessions
     * associated with a room) as a proxy for "watching content together".
     */
    const videos =
      videoFromLogs +
      this.toNumber(roomParticipantCount[0]?.cnt) +
      this.toNumber(studySessionRoomCount[0]?.cnt);

    const exercises =
      practiceFromLogs +
      this.toNumber(toeicPracticeCount[0]?.cnt) +
      this.toNumber(vocabTestCount[0]?.cnt) +
      this.toNumber(ieltsPracticeCount[0]?.cnt);

    const certificates =
      certificateFromLogs + this.toNumber(certificateActivityCount[0]?.cnt);

    const rawItems: Array<Omit<FeatureUsageItem, 'percent'>> = [
      { id: 'test', name: 'Làm bài Test', count: tests },
      { id: 'video', name: 'Xem Video', count: videos },
      { id: 'exercise', name: 'Làm bài tập', count: exercises },
      { id: 'certificate', name: 'Xem chứng chỉ', count: certificates },
    ];

    const total = rawItems.reduce((sum, item) => sum + item.count, 0);
    const items: FeatureUsageItem[] = rawItems.map((item) => ({
      ...item,
      percent: total > 0 ? Math.round((item.count / total) * 100) : 0,
    }));

    return { items, total };
  }

  async getUsageBehavior(
    query: UsageBehaviorQueryDto,
  ): Promise<UsageBehaviorResponse> {
    const timeRange = query.timeRange || '7d';
    const { start, end } = this.resolveRange(timeRange);

    try {
      const [heatmap, duration, featureUsage] = await Promise.all([
        this.buildHeatmap(start, end),
        this.buildDuration(start, end),
        this.buildFeatureUsage(start, end),
      ]);

      return {
        timeRange,
        rangeStart: start.toISOString(),
        rangeEnd: end.toISOString(),
        heatmap,
        duration,
        featureUsage,
      };
    } catch (err) {
      this.logger.error(
        'Failed to build usage behavior dashboard',
        err as Error,
      );
      // Surface an empty, well-formed payload so the UI degrades gracefully
      // instead of crashing on a 500.
      return {
        timeRange,
        rangeStart: start.toISOString(),
        rangeEnd: end.toISOString(),
        heatmap: {
          hours: HOUR_BUCKETS.map((b) => b.label),
          days: DAY_LABELS,
          matrix: HOUR_BUCKETS.map(() => Array(DAY_LABELS.length).fill(0)),
          intensity: HOUR_BUCKETS.map(() => Array(DAY_LABELS.length).fill(0)),
        },
        duration: {
          labels: DAY_LABELS,
          values: Array(DAY_LABELS.length).fill(0),
        },
        featureUsage: {
          items: [
            { id: 'test', name: 'Làm bài Test', count: 0, percent: 0 },
            { id: 'video', name: 'Xem Video', count: 0, percent: 0 },
            { id: 'exercise', name: 'Làm bài tập', count: 0, percent: 0 },
            { id: 'certificate', name: 'Xem chứng chỉ', count: 0, percent: 0 },
          ],
          total: 0,
        },
      };
    }
  }
}
