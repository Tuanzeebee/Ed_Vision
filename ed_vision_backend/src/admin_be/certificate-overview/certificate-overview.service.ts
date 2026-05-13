import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CertificateOverviewActivity,
  CertificateOverviewDistribution,
  CertificateOverviewKpis,
  CertificateOverviewQueryDto,
  CertificateOverviewResponse,
  CertificateOverviewRetention,
  CertificateOverviewTimeRange,
  CertificateOverviewTraffic,
  KpiValue,
  Trend,
} from './dto/certificate-overview.dto';

/** Day-of-week labels matching the UI (Mon..Sun). */
const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

/** Distribution buckets shown in the doughnut chart. */
const DISTRIBUTION_BUCKETS: Array<{
  label: string;
  matches: string[];
}> = [
  { label: 'IELTS', matches: ['ielts'] },
  { label: 'TOEIC', matches: ['toeic'] },
  {
    label: 'Giao tiếp',
    matches: ['communication', 'speaking', 'conversation'],
  },
];

const MS_PER_DAY = 24 * 60 * 60 * 1000;

interface CountRow {
  cnt: number | string | bigint;
}

interface CertTypeCountRow {
  cert_type: string;
  cnt: number | string | bigint;
}

interface WeekdayCountRow {
  day_index: number | string;
  cnt: number | string | bigint;
}

interface AccountFirstActivityRow {
  account_id: number;
  first_activity: Date;
  last_activity: Date;
}

interface RecentEnrollmentRow {
  cert_type: string;
  cnt: number | string | bigint;
}

@Injectable()
export class CertificateOverviewService {
  private readonly logger = new Logger(CertificateOverviewService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolve the requested time window to inclusive [start, end] bounds plus a
   * "previous" window of identical duration used for trend comparisons.
   */
  private resolveRange(timeRange: CertificateOverviewTimeRange): {
    start: Date;
    end: Date;
    prevStart: Date;
    prevEnd: Date;
  } {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (timeRange) {
      case 'last-month': {
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        end = new Date(end.getTime() - 1);
        break;
      }
      case 'this-quarter': {
        const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
        start = new Date(now.getFullYear(), quarterStartMonth, 1, 0, 0, 0, 0);
        end = now;
        break;
      }
      case 'this-year': {
        start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        end = now;
        break;
      }
      case 'this-month':
      default: {
        start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        end = now;
        break;
      }
    }

    const durationMs = end.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(start.getTime() - durationMs);
    return { start, end, prevStart, prevEnd };
  }

  private toNumber(value: number | string | bigint | null | undefined): number {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'bigint') return Number(value);
    if (typeof value === 'string') return Number.parseFloat(value) || 0;
    return value;
  }

  /** Compare two integer/percent values and produce a KPI payload. */
  private buildKpi(current: number, previous: number): KpiValue {
    let change = 0;
    if (previous > 0) {
      change = Math.round(((current - previous) / previous) * 100);
    } else if (current > 0) {
      change = 100;
    }

    let trend: Trend = 'stable';
    if (change > 0) trend = 'up';
    else if (change < 0) trend = 'down';

    return {
      value: Math.round(current * 100) / 100,
      change,
      trend,
    };
  }

  /**
   * Count distinct students with at least one active certificate enrollment as
   * of `asOf`. Used for the "Tổng sinh viên" KPI.
   */
  private async countTotalEnrolledStudents(asOf: Date): Promise<number> {
    const rows = await this.prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(DISTINCT student_id)::int AS cnt
      FROM "CertificateEnrollment"
      WHERE enrolled_at <= ${asOf}
    `;
    return this.toNumber(rows[0]?.cnt);
  }

  /**
   * Count distinct accounts that had any platform activity (study session or
   * activity log) inside [start, end].
   */
  private async countActiveAccounts(start: Date, end: Date): Promise<number> {
    const rows = await this.prisma.$queryRaw<CountRow[]>`
      WITH events AS (
        SELECT DISTINCT account_id
          FROM "UserActivityLog"
         WHERE created_at >= ${start} AND created_at <= ${end}
        UNION
        SELECT DISTINCT account_id
          FROM "StudySession"
         WHERE started_at >= ${start} AND started_at <= ${end}
      )
      SELECT COUNT(*)::int AS cnt FROM events
    `;
    return this.toNumber(rows[0]?.cnt);
  }

  /**
   * Return rate = % of active accounts who had platform activity on 2 or more
   * distinct days during the window.
   */
  private async computeReturnRate(start: Date, end: Date): Promise<number> {
    const rows = await this.prisma.$queryRaw<
      {
        total: number | string | bigint | null;
        returning: number | string | bigint | null;
      }[]
    >`
      WITH events AS (
        SELECT account_id, DATE(created_at) AS d
          FROM "UserActivityLog"
         WHERE created_at >= ${start} AND created_at <= ${end}
        UNION
        SELECT account_id, DATE(started_at) AS d
          FROM "StudySession"
         WHERE started_at >= ${start} AND started_at <= ${end}
      ),
      per_account AS (
        SELECT account_id, COUNT(DISTINCT d) AS active_days
        FROM events
        GROUP BY account_id
      )
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE active_days >= 2)::int AS returning
      FROM per_account
    `;
    const row = rows[0];
    const total = this.toNumber(row?.total);
    const returning = this.toNumber(row?.returning);
    if (total <= 0) return 0;
    return Math.round((returning / total) * 1000) / 10;
  }

  /**
   * Completion rate = % of enrollments that were marked completed during the
   * window over all enrollments that were started before or during the window.
   */
  private async computeCompletionRate(start: Date, end: Date): Promise<number> {
    const rows = await this.prisma.$queryRaw<
      {
        total: number | string | bigint | null;
        completed: number | string | bigint | null;
      }[]
    >`
      WITH eligible AS (
        SELECT *
        FROM "CertificateEnrollment"
        WHERE enrolled_at <= ${end}
      )
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (
          WHERE completed_at IS NOT NULL
            AND completed_at >= ${start}
            AND completed_at <= ${end}
        )::int AS completed
      FROM eligible
    `;
    const row = rows[0];
    const total = this.toNumber(row?.total);
    const completed = this.toNumber(row?.completed);
    if (total <= 0) return 0;
    return Math.round((completed / total) * 1000) / 10;
  }

  /**
   * Distinct active accounts per weekday inside the window — powers the line
   * chart "Lượt truy cập theo thời gian".
   */
  private async buildTraffic(
    start: Date,
    end: Date,
  ): Promise<CertificateOverviewTraffic> {
    const rows = await this.prisma.$queryRaw<WeekdayCountRow[]>`
      WITH events AS (
        SELECT account_id, DATE(created_at) AS d,
               (CAST(EXTRACT(ISODOW FROM created_at) AS INTEGER) - 1) AS day_index
          FROM "UserActivityLog"
         WHERE created_at >= ${start} AND created_at <= ${end}
        UNION
        SELECT account_id, DATE(started_at) AS d,
               (CAST(EXTRACT(ISODOW FROM started_at) AS INTEGER) - 1) AS day_index
          FROM "StudySession"
         WHERE started_at >= ${start} AND started_at <= ${end}
      )
      SELECT day_index, COUNT(DISTINCT (account_id, d))::int AS cnt
      FROM events
      GROUP BY day_index
    `;

    const values = Array(DAY_LABELS.length).fill(0) as number[];
    for (const row of rows) {
      const index = Number(row.day_index);
      if (index >= 0 && index < values.length) {
        values[index] = this.toNumber(row.cnt);
      }
    }

    return { labels: DAY_LABELS, values };
  }

  /**
   * Distribution of active enrollments by cert type. Anything that does not
   * fall into a defined bucket is grouped under "Khác".
   */
  private async buildDistribution(
    start: Date,
    end: Date,
  ): Promise<CertificateOverviewDistribution> {
    const rows = await this.prisma.$queryRaw<CertTypeCountRow[]>`
      SELECT cert_type, COUNT(*)::int AS cnt
      FROM "CertificateEnrollment"
      WHERE enrolled_at <= ${end}
        AND (last_activity_at IS NULL OR last_activity_at >= ${start})
        AND (status IS NULL OR status <> 'archived')
      GROUP BY cert_type
    `;

    const labels = [...DISTRIBUTION_BUCKETS.map((b) => b.label), 'Khác'];
    const values = Array(labels.length).fill(0) as number[];

    for (const row of rows) {
      const certType = (row.cert_type || '').toLowerCase().trim();
      const count = this.toNumber(row.cnt);
      const bucketIndex = DISTRIBUTION_BUCKETS.findIndex((bucket) =>
        bucket.matches.includes(certType),
      );
      if (bucketIndex >= 0) {
        values[bucketIndex] += count;
      } else {
        values[values.length - 1] += count;
      }
    }

    return { labels, values };
  }

  /**
   * Per-week split between "new" (first ever activity) and "returning" (had
   * prior activity outside the week). We bucket the most recent 4 weeks of the
   * window into the standard "Tuần 1..Tuần 4" labels expected by the UI.
   */
  private async buildRetention(
    start: Date,
    end: Date,
  ): Promise<CertificateOverviewRetention> {
    const totalDurationMs = end.getTime() - start.getTime();
    const weeks = totalDurationMs > 0 ? Math.min(4, Math.max(1, 4)) : 4;

    // Always render 4 weekly buckets aligned to the end of the window, but
    // never start earlier than the window's start.
    const buckets: Array<{ start: Date; end: Date }> = [];
    for (let i = weeks - 1; i >= 0; i--) {
      const bucketEnd = new Date(end.getTime() - i * 7 * MS_PER_DAY);
      const bucketStart = new Date(bucketEnd.getTime() - 7 * MS_PER_DAY + 1);
      buckets.push({
        start: bucketStart < start ? start : bucketStart,
        end: bucketEnd,
      });
    }

    const rows = await this.prisma.$queryRaw<AccountFirstActivityRow[]>`
      WITH events AS (
        SELECT account_id, created_at AS occurred_at
          FROM "UserActivityLog"
         WHERE created_at <= ${end}
        UNION ALL
        SELECT account_id, started_at AS occurred_at
          FROM "StudySession"
         WHERE started_at <= ${end}
        UNION ALL
        SELECT account_id, enrolled_at AS occurred_at
          FROM "CertificateEnrollment"
         WHERE enrolled_at <= ${end}
      )
      SELECT account_id,
             MIN(occurred_at) AS first_activity,
             MAX(occurred_at) AS last_activity
      FROM events
      WHERE occurred_at >= ${buckets[0].start}
      GROUP BY account_id
    `;

    // For each account, also load the per-week activity buckets (was the user
    // active in week N at all?). We can do this in-memory using the same
    // queryRaw output by re-querying per-week distinct accounts efficiently.
    const newStudents = Array(buckets.length).fill(0) as number[];
    const returningStudents = Array(buckets.length).fill(0) as number[];

    // To determine "active in week i", run an aggregate per bucket.
    const activeAccountsPerBucket: Set<number>[] = [];
    for (const bucket of buckets) {
      const activeRows = await this.prisma.$queryRaw<{ account_id: number }[]>`
        SELECT DISTINCT account_id FROM (
          SELECT account_id FROM "UserActivityLog"
           WHERE created_at >= ${bucket.start} AND created_at <= ${bucket.end}
          UNION
          SELECT account_id FROM "StudySession"
           WHERE started_at >= ${bucket.start} AND started_at <= ${bucket.end}
          UNION
          SELECT account_id FROM "CertificateEnrollment"
           WHERE enrolled_at >= ${bucket.start} AND enrolled_at <= ${bucket.end}
        ) AS events
      `;
      activeAccountsPerBucket.push(
        new Set(activeRows.map((r) => Number(r.account_id))),
      );
    }

    const firstActivityByAccount = new Map<number, number>();
    for (const row of rows) {
      firstActivityByAccount.set(
        Number(row.account_id),
        new Date(row.first_activity).getTime(),
      );
    }

    for (let i = 0; i < buckets.length; i++) {
      const bucket = buckets[i];
      const activeAccounts = activeAccountsPerBucket[i];
      for (const accountId of activeAccounts) {
        const firstTs = firstActivityByAccount.get(accountId);
        if (
          firstTs !== undefined &&
          firstTs >= bucket.start.getTime() &&
          firstTs <= bucket.end.getTime()
        ) {
          newStudents[i] += 1;
        } else {
          returningStudents[i] += 1;
        }
      }
    }

    const labels = buckets.map((_, i) => `Tuần ${i + 1}`);
    return { labels, newStudents, returningStudents };
  }

  /**
   * Build the right-hand "Hoạt động gần đây" feed. We synthesize highlights
   * from the most recent enrollments, completions and inactivity warnings —
   * preferring real DB rows over hard-coded copy.
   */
  private async buildRecentActivities(
    start: Date,
    end: Date,
  ): Promise<CertificateOverviewActivity[]> {
    const items: CertificateOverviewActivity[] = [];

    // 1) Enrollments grouped by cert type in the last 24h of the window.
    const recentEnrollWindowStart = new Date(end.getTime() - MS_PER_DAY);
    const newEnrollRows = await this.prisma.$queryRaw<RecentEnrollmentRow[]>`
      SELECT cert_type, COUNT(*)::int AS cnt
      FROM "CertificateEnrollment"
      WHERE enrolled_at >= ${recentEnrollWindowStart}
        AND enrolled_at <= ${end}
      GROUP BY cert_type
      ORDER BY cnt DESC
      LIMIT 2
    `;

    for (const row of newEnrollRows) {
      const count = this.toNumber(row.cnt);
      if (count <= 0) continue;
      const label = this.formatCertLabel(row.cert_type);
      items.push({
        id: `enroll-${row.cert_type}`,
        text: `${count} SV mới đăng ký ${label}`,
        time: this.formatRelativeTime(recentEnrollWindowStart, end),
        color: 'bg-blue-500',
      });
    }

    // 2) Highest-progress cert type in the window.
    const progressRows = await this.prisma.$queryRaw<
      {
        cert_type: string;
        avg_progress: number | string | null;
      }[]
    >`
      SELECT cert_type,
             AVG(progress_percent)::float AS avg_progress
      FROM "CertificateEnrollment"
      WHERE last_activity_at >= ${start} AND last_activity_at <= ${end}
      GROUP BY cert_type
      ORDER BY avg_progress DESC NULLS LAST
      LIMIT 1
    `;
    const topProgress = progressRows[0];
    if (topProgress) {
      const pct = Math.round(this.toNumber(topProgress.avg_progress));
      if (pct > 0) {
        items.push({
          id: `progress-${topProgress.cert_type}`,
          text: `${pct}% tiến độ trung bình ${this.formatCertLabel(topProgress.cert_type)}`,
          time: 'Tuần này',
          color: 'bg-green-500',
        });
      }
    }

    // 3) Inactive learners (no activity for 7+ days but enrolled within window).
    const inactiveThreshold = new Date(end.getTime() - 7 * MS_PER_DAY);
    const inactiveRows = await this.prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(DISTINCT student_id)::int AS cnt
      FROM "CertificateEnrollment"
      WHERE enrolled_at <= ${end}
        AND (
          last_activity_at IS NULL
          OR last_activity_at < ${inactiveThreshold}
        )
        AND (status IS NULL OR status <> 'archived')
        AND completed_at IS NULL
    `;
    const inactiveCount = this.toNumber(inactiveRows[0]?.cnt);
    if (inactiveCount > 0) {
      items.push({
        id: 'inactive-warning',
        text: `Cảnh báo: ${inactiveCount} SV vắng mặt 7 ngày`,
        time: 'Hôm nay',
        color: 'bg-orange-500',
      });
    }

    return items.slice(0, 4);
  }

  private formatCertLabel(certType: string | null | undefined): string {
    const value = (certType || '').toLowerCase().trim();
    if (value === 'ielts') return 'IELTS';
    if (value === 'toeic') return 'TOEIC';
    if (['communication', 'speaking', 'conversation'].includes(value)) {
      return 'Giao tiếp';
    }
    return certType ? certType.toUpperCase() : 'Khác';
  }

  private formatRelativeTime(start: Date, end: Date): string {
    const diffMs = Math.max(0, end.getTime() - start.getTime());
    const hours = Math.floor(diffMs / (60 * 60 * 1000));
    if (hours < 1) return 'Vừa xong';
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
  }

  private buildKpis(
    currentTotal: number,
    previousTotal: number,
    currentActive: number,
    previousActive: number,
    currentReturn: number,
    previousReturn: number,
    currentCompletion: number,
    previousCompletion: number,
  ): CertificateOverviewKpis {
    return {
      totalStudents: this.buildKpi(currentTotal, previousTotal),
      activeStudents: this.buildKpi(currentActive, previousActive),
      returnRate: this.buildKpi(currentReturn, previousReturn),
      completionRate: this.buildKpi(currentCompletion, previousCompletion),
    };
  }

  async getCertificateOverview(
    query: CertificateOverviewQueryDto,
  ): Promise<CertificateOverviewResponse> {
    const timeRange: CertificateOverviewTimeRange =
      query.timeRange || 'this-month';
    const { start, end, prevStart, prevEnd } = this.resolveRange(timeRange);

    try {
      const [
        currentTotal,
        previousTotal,
        currentActive,
        previousActive,
        currentReturn,
        previousReturn,
        currentCompletion,
        previousCompletion,
        traffic,
        distribution,
        retention,
        recentActivities,
      ] = await Promise.all([
        this.countTotalEnrolledStudents(end),
        this.countTotalEnrolledStudents(prevEnd),
        this.countActiveAccounts(start, end),
        this.countActiveAccounts(prevStart, prevEnd),
        this.computeReturnRate(start, end),
        this.computeReturnRate(prevStart, prevEnd),
        this.computeCompletionRate(start, end),
        this.computeCompletionRate(prevStart, prevEnd),
        this.buildTraffic(start, end),
        this.buildDistribution(start, end),
        this.buildRetention(start, end),
        this.buildRecentActivities(start, end),
      ]);

      return {
        timeRange,
        rangeStart: start.toISOString(),
        rangeEnd: end.toISOString(),
        previousRangeStart: prevStart.toISOString(),
        previousRangeEnd: prevEnd.toISOString(),
        kpis: this.buildKpis(
          currentTotal,
          previousTotal,
          currentActive,
          previousActive,
          currentReturn,
          previousReturn,
          currentCompletion,
          previousCompletion,
        ),
        traffic,
        distribution,
        retention,
        recentActivities,
      };
    } catch (err) {
      this.logger.error(
        'Failed to build certificate overview dashboard',
        err as Error,
      );
      // Degrade gracefully — return a well-formed, empty payload instead of
      // 500ing so the UI can still render its skeleton state.
      const emptyKpi: KpiValue = { value: 0, change: 0, trend: 'stable' };
      return {
        timeRange,
        rangeStart: start.toISOString(),
        rangeEnd: end.toISOString(),
        previousRangeStart: prevStart.toISOString(),
        previousRangeEnd: prevEnd.toISOString(),
        kpis: {
          totalStudents: emptyKpi,
          activeStudents: emptyKpi,
          returnRate: emptyKpi,
          completionRate: emptyKpi,
        },
        traffic: {
          labels: DAY_LABELS,
          values: Array(DAY_LABELS.length).fill(0),
        },
        distribution: {
          labels: [...DISTRIBUTION_BUCKETS.map((b) => b.label), 'Khác'],
          values: Array(DISTRIBUTION_BUCKETS.length + 1).fill(0),
        },
        retention: {
          labels: ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'],
          newStudents: [0, 0, 0, 0],
          returningStudents: [0, 0, 0, 0],
        },
        recentActivities: [],
      };
    }
  }
}
