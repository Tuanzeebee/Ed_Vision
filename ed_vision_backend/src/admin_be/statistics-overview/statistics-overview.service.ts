import { Injectable, Logger } from '@nestjs/common';
import { BigQuery } from '@google-cloud/bigquery';
import * as fs from 'fs';
import * as path from 'path';
import {
  DashboardStatsQueryDto,
  DashboardStatsResponse,
  ComparisonData,
  AccessTimeStatsResponse,
  GPADistributionResponse,
  ScoreDistributionResponse,
  TopStudentResponse,
} from './dto/dashboard-stats.dto';

@Injectable()
export class StatisticsOverviewService {
  private readonly bigquery: BigQuery;
  private readonly logger = new Logger(StatisticsOverviewService.name);

  constructor() {
    this.bigquery = new BigQuery();
  }

  /**
   * Get filter options for dashboard
   */
  async getFilterOptions() {
    const sqlDepartments = 'SELECT DISTINCT department_name FROM `vuong_dw.dim_student` WHERE department_name IS NOT NULL ORDER BY department_name';
    const sqlMajors = 'SELECT DISTINCT major, department_name FROM `vuong_dw.dim_student` WHERE major IS NOT NULL ORDER BY major';
    const sqlClasses = 'SELECT DISTINCT class_code, cohort_year, major as program, department_name as school FROM `vuong_dw.dim_student` WHERE class_code IS NOT NULL ORDER BY class_code';

    const [deptRows] = await this.bigquery.query({ query: sqlDepartments });
    const [majorRows] = await this.bigquery.query({ query: sqlMajors });
    const [classRows] = await this.bigquery.query({ query: sqlClasses });

    const departments = (deptRows as any[]).map(r => r.department_name).filter(Boolean);
    const programs = (majorRows as any[]).map(r => ({ program_name: r.major, department_name: r.department_name }));
    const classGroups = (classRows as any[]).map(r => ({ class_code: r.class_code, cohort_year: r.cohort_year, program_name: r.program, department_name: r.school }));

    const cohortYears = Array.from(new Set(classGroups.map(c => c.cohort_year).filter(Boolean)))
      .sort()
      .map((year: number) => {
        const graduationYear = year + 6;
        return `K${graduationYear.toString().slice(-2)}`;
      });

    return {
      schools: ['Tất cả các trường', ...departments],
      courseYears: ['Tất cả khóa', ...cohortYears],
      majors: programs.map((p: any) => ({ name: p.program_name, school: p.department_name })),
      classes: classGroups.map((c: any) => ({ code: c.class_code, cohortYear: c.cohort_year, program: c.program_name, school: c.department_name })),
    };
  }

  /**
   * Get dashboard statistics with time-based comparison
   */
  async getDashboardStats(
    query: DashboardStatsQueryDto,
  ): Promise<DashboardStatsResponse> {
    const { timeFilter = 'tháng-này' } = query;

    const { currentStart, currentEnd, previousStart, previousEnd } =
      this.getDateRanges(timeFilter, query.selectedYear);

    const hasFilters = Boolean(
      query.school && query.school !== 'Tất cả các trường' ||
      query.major && query.major !== 'Tất cả' ||
      query.courseYear && query.courseYear !== 'Tất cả khóa' ||
      query.class && query.class !== 'Tất cả'
    );

    let totalStudents = 0;
    let previousStudents = 0;
    let totalInstructors = 0;
    let previousInstructors = 0;
    let __debug: any = undefined;

    const startDateStr = new Date(currentStart).toISOString().slice(0, 10);
    const endDateStr = new Date(currentEnd).toISOString().slice(0, 10);
    const prevStartDateStr = new Date(previousStart).toISOString().slice(0, 10);
    const prevEndDateStr = new Date(previousEnd).toISOString().slice(0, 10);

    if (!hasFilters) {
      // Use aggregated fact table for totals (NO FILTERS)
      const sqlFactLatestInRange = `
        SELECT role_code, total_accounts
        FROM \`vuong_dw.fact_daily_account_activity\`
        WHERE activity_date = (
          SELECT MAX(activity_date) FROM \`vuong_dw.fact_daily_account_activity\`
          WHERE activity_date BETWEEN @startDate AND @endDate
        )
      `;

      const [currentFactRows] = await this.bigquery.query({
        query: sqlFactLatestInRange,
        params: { startDate: startDateStr, endDate: endDateStr }
      });

      const [previousFactRows] = await this.bigquery.query({
        query: sqlFactLatestInRange,
        params: { startDate: prevStartDateStr, endDate: prevEndDateStr }
      });

      const currentMap = new Map((currentFactRows as any[]).map(r => [String(r.role_code), Number(r.total_accounts ?? 0)]));
      const previousMap = new Map((previousFactRows as any[]).map(r => [String(r.role_code), Number(r.total_accounts ?? 0)]));

      totalStudents = currentMap.get('student') ?? currentMap.get('students') ?? 0;
      previousStudents = previousMap.get('student') ?? previousMap.get('students') ?? 0;
      totalInstructors = currentMap.get('instructor') ?? currentMap.get('teacher') ?? currentMap.get('instructors') ?? 0;
      previousInstructors = previousMap.get('instructor') ?? previousMap.get('teacher') ?? previousMap.get('instructors') ?? 0;

      if (query && (query as any)._debug === 'true') {
        __debug = {
          mode: 'fact',
          startDateStr,
          endDateStr,
          currentFactRows: (currentFactRows as any[]).length,
          previousFactRows: (previousFactRows as any[]).length,
        };
      }
    } else {
      // WITH FILTERS: Query directly from dim_student/dim_instructor
      const { whereClauseStudent, params } = this.buildBQStudentFilters(query);

      try {
        // If frontend requested a specific academicYear or semester, count from
        // fact_student_course_performance (fsp) joined to dim_student so that
        // semester/year filters actually apply. Otherwise fall back to dim_student counts.
        let semesterNumber: number | null = null;
        if (query.semester === 'Kỳ 1') semesterNumber = 1;
        else if (query.semester === 'Kỳ 2') semesterNumber = 2;
        else if (query.semester === 'Kỳ Hè') semesterNumber = 3;

        // Normalize academicYear input to canonical form (e.g. 2025/2026 -> 2025-2026)
        let normalizedAcademicYear: string | undefined = undefined;
        if (query.academicYear) {
          normalizedAcademicYear = String(query.academicYear).trim().replace(/\s+/g, '').replace(/\//g, '-');
        }

        if (normalizedAcademicYear || semesterNumber !== null) {
          const sqlStudentCountFsp = `
            SELECT COUNT(DISTINCT fsp.student_sk) AS cnt
            FROM \`vuong_dw.fact_student_course_performance\` fsp
            INNER JOIN \`vuong_dw.dim_student\` ds ON fsp.student_sk = ds.student_sk
            INNER JOIN \`vuong_dw.dim_account\` a ON CAST(ds.account_id AS STRING) = CAST(a.account_sk AS STRING)
            WHERE a.status = 'active'
              AND a.role_code IN ('student', 'students')
              AND (${whereClauseStudent})
              ${semesterNumber !== null ? 'AND fsp.semester_number = @semesterNumber' : ''}
              ${normalizedAcademicYear ? 'AND fsp.academic_year = @academicYear' : ''}
          `;

          const studentCountParams: any = { ...params };
          if (semesterNumber !== null) studentCountParams.semesterNumber = semesterNumber;
          if (normalizedAcademicYear) studentCountParams.academicYear = normalizedAcademicYear;

          const [currentStudentRows] = await this.bigquery.query({ query: sqlStudentCountFsp, params: studentCountParams });
          totalStudents = Number((currentStudentRows as any[])[0]?.cnt ?? 0);
          previousStudents = totalStudents;
        } else {
          const sqlStudentCount = `
            SELECT COUNT(DISTINCT ds.student_sk) AS cnt
            FROM \`vuong_dw.dim_student\` ds
            INNER JOIN \`vuong_dw.dim_account\` a 
              ON CAST(ds.account_id AS STRING) = CAST(a.account_sk AS STRING)
            WHERE a.status = 'active'
              AND a.role_code IN ('student', 'students')
              AND (${whereClauseStudent})
          `;

          const [currentStudentRows] = await this.bigquery.query({ query: sqlStudentCount, params });
          totalStudents = Number((currentStudentRows as any[])[0]?.cnt ?? 0);
          previousStudents = totalStudents;
        }

        let instructorWhere = 'TRUE';
        const instructorParams: any = {};

        if (query.school && query.school !== 'Tất cả các trường') {
          instructorWhere = 'di.department_name = @school';
          instructorParams.school = query.school;
        }

        const sqlInstructorCount = `
          SELECT COUNT(DISTINCT di.instructor_sk) AS cnt
          FROM \`vuong_dw.dim_instructor\` di
          INNER JOIN \`vuong_dw.dim_account\` a 
            ON CAST(di.account_id AS STRING) = CAST(a.account_sk AS STRING)
          WHERE a.status = 'active'
            AND a.role_code IN ('instructor', 'teacher', 'instructors')
            AND (${instructorWhere})
        `;

        const [currentInstructorRows] = await this.bigquery.query({ query: sqlInstructorCount, params: instructorParams });
        totalInstructors = Number((currentInstructorRows as any[])[0]?.cnt ?? 0);
        previousInstructors = totalInstructors;

        if (query && (query as any)._debug === 'true') {
          __debug = {
            mode: 'dim_tables_filtered',
            whereClauseStudent,
            instructorWhere,
            params,
            instructorParams,
            totalStudents,
            totalInstructors,
            note: 'Filtering from dim tables - no time-based comparison (counts are the same for current and previous)',
          };
        }
      } catch (error) {
        this.logger.error('Error querying filtered data:', error);
        this.logger.error('Error details:', JSON.stringify(error, null, 2));
        throw error;
      }
    }

    // Write debug file if requested
    if (__debug) {
      try {
        const debugDir = path.join(process.cwd(), 'ed_vision_backend', 'tmp');
        fs.mkdirSync(debugDir, { recursive: true });
        const debugPath = path.join(debugDir, 'dashboard_stats_debug.json');
        fs.writeFileSync(debugPath, JSON.stringify(__debug, null, 2), { encoding: 'utf8' });
        this.logger.log(`Wrote debug file to ${debugPath}`);
      } catch (err) {
        this.logger.error('Failed to write debug file', err as any);
      }
    }

    // atRisk
    const { whereClauseStudent, params } = this.buildBQStudentFilters(query);
    const pCurrentEnd = new Date(currentEnd).toISOString();

    const sqlAtRisk = `
      SELECT COUNT(DISTINCT student_sk) AS cnt 
      FROM \`vuong_dw.dim_student\` 
      WHERE ${whereClauseStudent} 
        AND status = 'at-risk' 
        AND created_at <= @currentEnd
    `;

    const [atRiskRows] = await this.bigquery.query({
      query: sqlAtRisk,
      params: { ...params, currentEnd: pCurrentEnd }
    });

    const atRiskCount = Number((atRiskRows as any[])[0]?.cnt ?? 0);

    // === PERFORMANCE: LẤY THEO NGÀY MỚI NHẤT TRONG KHOẢNG ===
    const sqlPerformance = `
      SELECT 
        role_code,
        performance_rate,
        activity_date
      FROM \`vuong_dw.fact_daily_account_activity\`
      WHERE activity_date = (
        SELECT MAX(activity_date) 
        FROM \`vuong_dw.fact_daily_account_activity\`
        WHERE activity_date BETWEEN @startDate AND @endDate
      )
      AND role_code IN ('student', 'students', 'instructor', 'teacher', 'instructors')
    `;

    const [performanceRows] = await this.bigquery.query({
      query: sqlPerformance,
      params: { startDate: startDateStr, endDate: endDateStr }
    });

    const performanceMap = new Map<string, number>();
    let performanceDate: string | null = null;

    (performanceRows as any[]).forEach(r => {
      const role = String(r.role_code);
      const rate = Number(r.performance_rate ?? 0);
      performanceMap.set(role, rate);
      if (!performanceDate && r.activity_date) {
        performanceDate = r.activity_date;
      }
    });

    const studentPerformance = performanceMap.get('student') ?? performanceMap.get('students') ?? 0;
    const instructorPerformance = performanceMap.get('instructor') ?? performanceMap.get('teacher') ?? performanceMap.get('instructors') ?? 0;

    const performance: DashboardStatsResponse['current']['performance'] = {
      student: studentPerformance,
      instructor: instructorPerformance,
    };

    const studentComparison = this.calculateComparison(totalStudents, previousStudents);
    const instructorComparison = this.calculateComparison(totalInstructors, previousInstructors);

    // === RETURN ===
    const response: DashboardStatsResponse = {
      current: {
        students: totalStudents,
        instructors: totalInstructors,
        atRisk: atRiskCount,
        performance,
      },
      previous: {
        students: previousStudents,
        instructors: previousInstructors,
      },
      comparison: {
        students: studentComparison,
        instructors: instructorComparison,
      },
      timeRange: timeFilter,
      filters: {
        school: query.school !== 'Tất cả các trường' ? query.school : undefined,
        courseYear: query.courseYear !== 'Tất cả khóa' ? query.courseYear : undefined,
        major: query.major !== 'Tất cả' ? query.major : undefined,
        class: query.class !== 'Tất cả' ? query.class : undefined,
      },
    };

    // === DEBUG ===
    if ((query as any)._debug === 'true') {
      const debugResponse = {
        ...response,
        _debug: {
          performanceDate,
          timeFilter,
          startDate: startDateStr,
          endDate: endDateStr,
          ...__debug,
        },
      };
      try {
        const debugDir = path.join(process.cwd(), 'ed_vision_backend', 'tmp');
        fs.mkdirSync(debugDir, { recursive: true });
        const debugPath = path.join(debugDir, 'dashboard_stats_debug.json');
        fs.writeFileSync(debugPath, JSON.stringify(debugResponse, null, 2), { encoding: 'utf8' });
        this.logger.log(`Wrote debug file to ${debugPath}`);
      } catch (err) {
        this.logger.error('Failed to write debug file', err as any);
      }
    }

    return response;
  }

  // ============================================================
  // ===== MỚI THÊM: GPA Distribution từ BigQuery =====
  // ============================================================
  async getGPADistribution(query: DashboardStatsQueryDto): Promise<GPADistributionResponse> {
    const { whereClauseStudent, params } = this.buildBQStudentFilters(query);

    // Xử lý semester_number
    let semesterNumber: number | null = null;
    if (query.semester === 'Kỳ 1') semesterNumber = 1;
    else if (query.semester === 'Kỳ 2') semesterNumber = 2;
    else if (query.semester === 'Kỳ Hè') semesterNumber = 3;

    const sql = `
      SELECT
        SUM(CASE WHEN fsp.gpa >= 8.0 THEN 1 ELSE 0 END) AS excellent,
        SUM(CASE WHEN fsp.gpa >= 6.5 AND fsp.gpa < 8.0 THEN 1 ELSE 0 END) AS good,
        SUM(CASE WHEN fsp.gpa < 6.5 THEN 1 ELSE 0 END) AS average,
        COUNT(*) AS total
      FROM \`vuong_dw.fact_student_course_performance\` fsp
      INNER JOIN \`vuong_dw.dim_student\` ds ON fsp.student_sk = ds.student_sk
      WHERE (${whereClauseStudent})
        ${semesterNumber !== null ? 'AND fsp.semester_number = @semesterNumber' : ''}
        ${query.academicYear ? 'AND fsp.academic_year = @academicYear' : ''}
    `;

    const queryParams = {
      ...params,
      ...(semesterNumber !== null && { semesterNumber }),
      ...(query.academicYear && { academicYear: query.academicYear }),
    };

    const [rows] = await this.bigquery.query({ query: sql, params: queryParams });
    const row = (rows as any[])[0] || {};

    const total = Number(row.total ?? 0);
    if (total === 0) {
      return { excellent: 0, good: 0, average: 0 };
    }

    return {
      excellent: parseFloat(((Number(row.excellent ?? 0) / total) * 100).toFixed(2)),
      good: parseFloat(((Number(row.good ?? 0) / total) * 100).toFixed(2)),
      average: parseFloat(((Number(row.average ?? 0) / total) * 100).toFixed(2)),
    };
  }

  // ============================================================
  // ===== MỚI THÊM: Score Distribution (0-10) từ BigQuery =====
  // ============================================================
  async getScoreDistribution(query: DashboardStatsQueryDto): Promise<ScoreDistributionResponse> {
    const { whereClauseStudent, params } = this.buildBQStudentFilters(query);

    let semesterNumber: number | null = null;
    if (query.semester === 'Kỳ 1') semesterNumber = 1;
    else if (query.semester === 'Kỳ 2') semesterNumber = 2;
    else if (query.semester === 'Kỳ Hè') semesterNumber = 3;

    // Query để lấy distribution theo từng trường
    const sql = `
      SELECT
        ds.department_name,
        FLOOR(fsp.gpa) AS score,
        COUNT(*) AS student_count
      FROM \`vuong_dw.fact_student_course_performance\` fsp
      INNER JOIN \`vuong_dw.dim_student\` ds ON fsp.student_sk = ds.student_sk
      WHERE (${whereClauseStudent})
        ${semesterNumber !== null ? 'AND fsp.semester_number = @semesterNumber' : ''}
        ${query.academicYear ? 'AND fsp.academic_year = @academicYear' : ''}
      GROUP BY ds.department_name, score
      ORDER BY ds.department_name, score
    `;

    const queryParams = {
      ...params,
      ...(semesterNumber !== null && { semesterNumber }),
      ...(query.academicYear && { academicYear: query.academicYear }),
    };

    const [rows] = await this.bigquery.query({ query: sql, params: queryParams });

    // Xử lý dữ liệu thành format chart cần
    const schoolMap = new Map<string, number[]>();

    (rows as any[]).forEach(row => {
      const school = row.department_name || 'Unknown';
      const score = Math.min(10, Math.max(0, Number(row.score))); // Đảm bảo 0-10
      const count = Number(row.student_count);

      if (!schoolMap.has(school)) {
        schoolMap.set(school, new Array(11).fill(0)); // [0,1,2,...,10]
      }

      const scores = schoolMap.get(school)!;
      scores[score] += count;
    });

    const schools = Array.from(schoolMap.entries()).map(([schoolName, scores]) => ({
      schoolName,
      scores,
    }));

    return { schools };
  }

  // ============================================================
  // ===== MỚI THÊM: Top Students từ BigQuery =====
  // ============================================================
  async getTopStudents(query: DashboardStatsQueryDto): Promise<TopStudentResponse> {
    const { whereClauseStudent, params } = this.buildBQStudentFilters(query);

    let semesterNumber: number | null = null;
    if (query.semester === 'Kỳ 1') semesterNumber = 1;
    else if (query.semester === 'Kỳ 2') semesterNumber = 2;
    else if (query.semester === 'Kỳ Hè') semesterNumber = 3;

    const limit = query.school === 'Tất cả các trường' ? 10 : 5;

    const sql = `
      SELECT
        ds.student_sk AS id,
        ds.full_name AS name,
        ds.department_name AS school,
        ds.major,
        ds.class_code AS class,
        fsp.gpa,
        ROW_NUMBER() OVER (ORDER BY fsp.gpa DESC) AS rank
      FROM \`vuong_dw.fact_student_course_performance\` fsp
      INNER JOIN \`vuong_dw.dim_student\` ds ON fsp.student_sk = ds.student_sk
      WHERE (${whereClauseStudent})
        ${semesterNumber !== null ? 'AND fsp.semester_number = @semesterNumber' : ''}
        ${query.academicYear ? 'AND fsp.academic_year = @academicYear' : ''}
      ORDER BY fsp.gpa DESC
      LIMIT @limit
    `;

    const queryParams = {
      ...params,
      ...(semesterNumber !== null && { semesterNumber }),
      ...(query.academicYear && { academicYear: query.academicYear }),
      limit,
    };

    const [rows] = await this.bigquery.query({ query: sql, params: queryParams });

    const students = (rows as any[]).map(row => ({
      id: Number(row.id),
      name: String(row.name),
      school: String(row.school),
      major: String(row.major),
      class: String(row.class),
      gpa: Number(row.gpa),
      rank: Number(row.rank),
    }));

    return { students };
  }

  // ============================================================
  // ===== Access Time Stats (GIỮ NGUYÊN) =====
  // ============================================================
  async getAccessTimeStats(query: DashboardStatsQueryDto): Promise<AccessTimeStatsResponse> {
    const sql = `
      SELECT
        SUM(CASE WHEN LOWER(period) = 'morning' THEN 1 ELSE 0 END) AS morning,
        SUM(CASE WHEN LOWER(period) = 'afternoon' THEN 1 ELSE 0 END) AS afternoon,
        SUM(CASE WHEN LOWER(period) = 'evening' THEN 1 ELSE 0 END) AS evening
      FROM \`vuong_dw.fact_user_session\`
      WHERE period IS NOT NULL
    `;

    const [rows] = await this.bigquery.query({ query: sql });
    const counts = {
      morning: Number((rows as any[])[0]?.morning ?? 0),
      afternoon: Number((rows as any[])[0]?.afternoon ?? 0),
      evening: Number((rows as any[])[0]?.evening ?? 0),
    };

    const total = counts.morning + counts.afternoon + counts.evening;
    const percentages = {
      morning: total > 0 ? parseFloat(((counts.morning / total) * 100).toFixed(2)) : 0,
      afternoon: total > 0 ? parseFloat(((counts.afternoon / total) * 100).toFixed(2)) : 0,
      evening: total > 0 ? parseFloat(((counts.evening / total) * 100).toFixed(2)) : 0,
    };

    return { data: counts, percentages, total };
  }

  // ============================================================
  // ===== HELPER FUNCTIONS (GIỮ NGUYÊN) =====
  // ============================================================
  private getDateRanges(timeFilter: string, selectedYear?: string) {
    const now = new Date();
    const vietnamOffset = 7 * 60;
    const localOffset = now.getTimezoneOffset();
    const vietnamTime = new Date(now.getTime() + (vietnamOffset + localOffset) * 60 * 1000);

    let currentStart: Date;
    let currentEnd: Date;
    let previousStart: Date;
    let previousEnd: Date;

    switch (timeFilter) {
      case 'hôm-nay':
        currentStart = new Date(Date.UTC(vietnamTime.getFullYear(), vietnamTime.getMonth(), vietnamTime.getDate(), 0 - 7, 0, 0, 0));
        currentEnd = new Date(Date.UTC(vietnamTime.getFullYear(), vietnamTime.getMonth(), vietnamTime.getDate(), 23 - 7, 59, 59, 999));
        previousStart = new Date(Date.UTC(vietnamTime.getFullYear(), vietnamTime.getMonth(), vietnamTime.getDate() - 1, 0 - 7, 0, 0, 0));
        previousEnd = new Date(Date.UTC(vietnamTime.getFullYear(), vietnamTime.getMonth(), vietnamTime.getDate() - 1, 23 - 7, 59, 59, 999));
        break;

      case 'tuần-này':
        const dayOfWeek = vietnamTime.getDay();
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const mondayDate = new Date(vietnamTime);
        mondayDate.setDate(vietnamTime.getDate() + diffToMonday);

        currentStart = new Date(Date.UTC(mondayDate.getFullYear(), mondayDate.getMonth(), mondayDate.getDate(), 0 - 7, 0, 0, 0));
        const sundayDate = new Date(mondayDate);
        sundayDate.setDate(mondayDate.getDate() + 6);
        currentEnd = new Date(Date.UTC(sundayDate.getFullYear(), sundayDate.getMonth(), sundayDate.getDate(), 23 - 7, 59, 59, 999));

        const lastMondayDate = new Date(mondayDate);
        lastMondayDate.setDate(mondayDate.getDate() - 7);
        previousStart = new Date(Date.UTC(lastMondayDate.getFullYear(), lastMondayDate.getMonth(), lastMondayDate.getDate(), 0 - 7, 0, 0, 0));

        const lastSundayDate = new Date(sundayDate);
        lastSundayDate.setDate(sundayDate.getDate() - 7);
        previousEnd = new Date(Date.UTC(lastSundayDate.getFullYear(), lastSundayDate.getMonth(), lastSundayDate.getDate(), 23 - 7, 59, 59, 999));
        break;

      case 'tháng-này':
        currentStart = new Date(Date.UTC(vietnamTime.getFullYear(), vietnamTime.getMonth(), 1, 0 - 7, 0, 0, 0));
        const lastDayOfMonth = new Date(vietnamTime.getFullYear(), vietnamTime.getMonth() + 1, 0);
        currentEnd = new Date(Date.UTC(vietnamTime.getFullYear(), vietnamTime.getMonth(), lastDayOfMonth.getDate(), 23 - 7, 59, 59, 999));

        const lastMonthDate = new Date(vietnamTime.getFullYear(), vietnamTime.getMonth() - 1, 1);
        previousStart = new Date(Date.UTC(lastMonthDate.getFullYear(), lastMonthDate.getMonth(), 1, 0 - 7, 0, 0, 0));

        const lastDayOfPrevMonth = new Date(vietnamTime.getFullYear(), vietnamTime.getMonth(), 0);
        previousEnd = new Date(Date.UTC(lastDayOfPrevMonth.getFullYear(), lastDayOfPrevMonth.getMonth(), lastDayOfPrevMonth.getDate(), 23 - 7, 59, 59, 999));
        break;

      case 'tất-cả':
        const year = selectedYear ? parseInt(selectedYear) : vietnamTime.getFullYear();
        currentStart = new Date(Date.UTC(year, 0, 1, 0 - 7, 0, 0, 0));
        currentEnd = new Date(Date.UTC(year, 11, 31, 23 - 7, 59, 59, 999));
        previousStart = new Date(Date.UTC(year - 1, 0, 1, 0 - 7, 0, 0, 0));
        previousEnd = new Date(Date.UTC(year - 1, 11, 31, 23 - 7, 59, 59, 999));
        break;

      default:
        currentStart = new Date(Date.UTC(vietnamTime.getFullYear(), vietnamTime.getMonth(), 1, 0 - 7, 0, 0, 0));
        const defaultLastDay = new Date(vietnamTime.getFullYear(), vietnamTime.getMonth() + 1, 0);
        currentEnd = new Date(Date.UTC(vietnamTime.getFullYear(), vietnamTime.getMonth(), defaultLastDay.getDate(), 23 - 7, 59, 59, 999));

        const defaultLastMonthDate = new Date(vietnamTime.getFullYear(), vietnamTime.getMonth() - 1, 1);
        previousStart = new Date(Date.UTC(defaultLastMonthDate.getFullYear(), defaultLastMonthDate.getMonth(), 1, 0 - 7, 0, 0, 0));

        const defaultLastDayPrev = new Date(vietnamTime.getFullYear(), vietnamTime.getMonth(), 0);
        previousEnd = new Date(Date.UTC(defaultLastDayPrev.getFullYear(), defaultLastDayPrev.getMonth(), defaultLastDayPrev.getDate(), 23 - 7, 59, 59, 999));
    }

    return { currentStart, currentEnd, previousStart, previousEnd };
  }

  private buildBQStudentFilters(query: DashboardStatsQueryDto) {
    const where: string[] = ['TRUE'];
    const params: any = {};

    if (query.school && query.school !== 'Tất cả các trường') {
      where.push('(department_name = @school)');
      params.school = query.school;
    }

    if (query.major && query.major !== 'Tất cả') {
      where.push('(major = @major)');
      params.major = query.major;
    }

    if (query.courseYear && query.courseYear !== 'Tất cả khóa') {
      const yearMatch = query.courseYear.match(/K(\d+)/);
      if (yearMatch) {
        const lastTwo = Number(yearMatch[1]);
        const graduationYear = 2000 + lastTwo;
        const cohortYear = graduationYear - 6;
        where.push('(cohort_year = @cohortYear)');
        params.cohortYear = cohortYear;
      }
    }

    if (query.class && query.class !== 'Tất cả') {
      where.push('(class_code = @class)');
      params.class = query.class;
    }

    return { whereClauseStudent: where.join(' AND '), params };
  }

  private calculateComparison(current: number, previous: number): ComparisonData {
    if (previous === 0) {
      return {
        value: current,
        percentage: current > 0 ? 100 : 0,
        trend: current > 0 ? 'up' : 'stable',
      };
    }

    const diff = current - previous;
    const percentage = parseFloat(((diff / previous) * 100).toFixed(2));

    return {
      value: diff,
      percentage: Math.abs(percentage),
      trend: diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable',
    };
  }
}