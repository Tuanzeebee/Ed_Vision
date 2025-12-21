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
  LearningStatsContext,
  LearningDashboardStatsResponse,
} from './dto/dashboard-stats.dto';

@Injectable()
export class StatisticsOverviewService {
  private readonly bigquery: BigQuery;
  private readonly logger = new Logger(StatisticsOverviewService.name);
  private readonly dataset: string;

  constructor() {
    this.bigquery = new BigQuery();
    this.dataset = process.env.BIGQUERY_DATASET || 'edvision_dw';
  }

  // Helper: map semester string to number
  private mapSemesterToNumber(semester?: string): number | null {
    if (semester === 'Kỳ 1') return 1;
    if (semester === 'Kỳ 2') return 2;
    if (semester === 'Kỳ Hè') return 3;
    return null;
  }

  // Helper: get previous academic year/semester
  private getPreviousAcademicPeriod(
    academicYear: string,
    semesterNumber: number | null,
  ): { prevAcademicYear: string; prevSemesterNumber: number | null } {
    const [startStr] = academicYear.split('-');
    const startYear = Number(startStr);
    const prevStart = startYear - 1;
    if (!semesterNumber) {
      return {
        prevAcademicYear: `${prevStart}-${prevStart + 1}`,
        prevSemesterNumber: null,
      };
    }
    return {
      prevAcademicYear: `${prevStart}-${prevStart + 1}`,
      prevSemesterNumber: semesterNumber,
    };
  }

  /** * Lấy các lựa chọn filter cho dashboard */
  async getFilterOptions() {
    const sqlDepartments = `
      SELECT DISTINCT department_name 
      FROM ${this.dataset}.dim_student 
      WHERE department_name IS NOT NULL 
      ORDER BY department_name
    `;
    const sqlMajors = `
      SELECT DISTINCT major, department_name 
      FROM ${this.dataset}.dim_student 
      WHERE major IS NOT NULL 
      ORDER BY major
    `;
    const sqlClasses = `
      SELECT DISTINCT class_code, cohort_year, major AS program, department_name AS school 
      FROM ${this.dataset}.dim_student 
      WHERE class_code IS NOT NULL 
      ORDER BY class_code
    `;
    
    // Query lấy danh sách năm học và học kỳ có dữ liệu trong fact_student_course_performance
    const sqlAcademicYears = `
      SELECT DISTINCT academic_year 
      FROM ${this.dataset}.fact_student_course_performance 
      WHERE academic_year IS NOT NULL 
      ORDER BY academic_year DESC
    `;
    const sqlSemesters = `
      SELECT DISTINCT semester_number 
      FROM ${this.dataset}.fact_student_course_performance 
      WHERE semester_number IS NOT NULL 
      ORDER BY semester_number
    `;

    const [deptRows] = await this.bigquery.query({ query: sqlDepartments });
    const [majorRows] = await this.bigquery.query({ query: sqlMajors });
    const [classRows] = await this.bigquery.query({ query: sqlClasses });
    const [academicYearRows] = await this.bigquery.query({ query: sqlAcademicYears });
    const [semesterRows] = await this.bigquery.query({ query: sqlSemesters });

    const departments = (deptRows as any[]).map(r => r.department_name).filter(Boolean);
    const programs = (majorRows as any[]).map(r => ({
      program_name: r.major,
      department_name: r.department_name,
    }));
    const classGroups = (classRows as any[]).map(r => ({
      class_code: r.class_code,
      cohort_year: r.cohort_year,
      program_name: r.program,
      department_name: r.school,
    }));

    const cohortYears = Array.from(new Set(classGroups.map(c => c.cohort_year).filter(Boolean)))
      .sort()
      .map((year: number) => {
        const graduationYear = year + 6;
        return `K${graduationYear.toString().slice(-2)}`;
      });

    // Lấy danh sách năm học từ BigQuery
    const academicYears = (academicYearRows as any[])
      .map(r => r.academic_year)
      .filter(Boolean);
    
    // Lấy danh sách học kỳ và map sang tên hiển thị
    const semesterNumbers = (semesterRows as any[])
      .map(r => Number(r.semester_number))
      .filter(n => !isNaN(n));
    const semesters = semesterNumbers.map(n => {
      if (n === 1) return 'Kỳ 1';
      if (n === 2) return 'Kỳ 2';
      if (n === 3) return 'Kỳ Hè';
      return `Kỳ ${n}`;
    });

    return {
      schools: ['Tất cả các trường', ...departments],
      courseYears: ['Tất cả khóa', ...cohortYears],
      majors: programs.map((p: any) => ({ name: p.program_name, school: p.department_name })),
      classes: classGroups.map((c: any) => ({
        code: c.class_code,
        cohortYear: c.cohort_year,
        program: c.program_name,
        school: c.department_name,
      })),
      // Thêm danh sách năm học và học kỳ từ dữ liệu thực
      academicYears,
      semesters,
    };
  }

  /** * Lấy số liệu dashboard với so sánh thời gian */
  async getDashboardStats(
    query: DashboardStatsQueryDto,
  ): Promise<DashboardStatsResponse> {
    const { timeFilter = 'tháng-này' } = query;

    // Tính phạm vi thời gian dựa trên filter
    const {
      currentStart,
      currentEnd,
      previousStart,
      previousEnd,
    } = this.getDateRanges(
      timeFilter,
      query.selectedYear,
      (query as any).anchorDate,
      (query as any).sinceYear,
    );

    let totalStudents = 0;
    let previousStudents = 0;
    let totalInstructors = 0;
    let previousInstructors = 0;

    // Các biến tạm lưu dữ liệu debug nếu cần
    let atRiskCount = 0;
    let previousAtRiskCount = 0;
    let perfRows: any[] = [];
    let __debug: any = undefined;

    const curStartISO = new Date(currentStart).toISOString();
    const curEndISO = new Date(currentEnd).toISOString();
    const prevStartISO = new Date(previousStart).toISOString();
    const prevEndISO = new Date(previousEnd).toISOString();

    const startDateStr = curStartISO.slice(0, 10);
    const endDateStr = curEndISO.slice(0, 10);

    // Xây dựng filter cho query
    const { whereClauseStudent, params: studentFilterParams } = this.buildBQStudentFilters(query);
    
    // Xác định mode: ngày/tháng/năm dùng BETWEEN, tất cả dùng snapshot <=
    const isAllMode = timeFilter === 'tất-cả';

    let sqlAtRisk: string;
    try {
      if (!isAllMode) {
        // === NGÀY / THÁNG / NĂM: ĐẾM TRONG KHOẢNG THỜI GIAN BETWEEN ===
        const sqlTotalStudentsRange = `
          SELECT
            COUNT(DISTINCT IF(ds.created_at BETWEEN @startDate AND @endDate, ds.student_sk, NULL)) AS current_cnt,
            COUNT(DISTINCT IF(ds.created_at BETWEEN @prevStart AND @prevEnd, ds.student_sk, NULL)) AS previous_cnt
          FROM ${this.dataset}.dim_student ds
          INNER JOIN ${this.dataset}.dim_account a ON CAST(ds.account_id AS STRING) = CAST(a.account_sk AS STRING)
          WHERE a.status = 'active' AND a.role_code IN ('student', 'students') AND (${whereClauseStudent});
        `;

        // Tương tự với instructor
        let instructorWhere = 'TRUE';
        const instructorParams: any = {
          startDate: curStartISO,
          endDate: curEndISO,
          prevStart: prevStartISO,
          prevEnd: prevEndISO,
        };
        if (query.school && query.school !== 'Tất cả các trường') {
          instructorWhere = 'di.department_name = @school';
          instructorParams.school = query.school;
        }

        const sqlTotalInstructorsRange = `
          SELECT
            COUNT(DISTINCT IF(di.created_at BETWEEN @startDate AND @endDate, di.instructor_sk, NULL)) AS current_cnt,
            COUNT(DISTINCT IF(di.created_at BETWEEN @prevStart AND @prevEnd, di.instructor_sk, NULL)) AS previous_cnt
          FROM ${this.dataset}.dim_instructor di
          INNER JOIN ${this.dataset}.dim_account a ON CAST(di.account_id AS STRING) = CAST(a.account_sk AS STRING)
          WHERE a.status = 'active' AND a.role_code IN ('instructor', 'teacher', 'instructors') AND (${instructorWhere});
        `;

        // Query performance
        const sqlPerformance = `
          SELECT role_code, performance_rate, activity_date
          FROM ${this.dataset}.fact_daily_account_activity
          WHERE activity_date = (
            SELECT MAX(activity_date)
            FROM ${this.dataset}.fact_daily_account_activity
            WHERE activity_date BETWEEN @startDate AND @endDate
          )
          AND role_code IN ('student', 'students', 'instructor', 'teacher', 'instructors')
        `;

        sqlAtRisk = `
          SELECT
            COUNT(DISTINCT IF(ds.status = 'at-risk' AND ds.created_at BETWEEN @startDate AND @endDate, ds.student_sk, NULL)) AS current_cnt,
            COUNT(DISTINCT IF(ds.status = 'at-risk' AND ds.created_at BETWEEN @prevStart AND @prevEnd, ds.student_sk, NULL)) AS previous_cnt
          FROM ${this.dataset}.dim_student ds
          WHERE (${whereClauseStudent});
        `;

        // Thực thi song song
        const [studentRowsRes, instructorRowsRes, atRiskRowsRes, performanceRowsRes] = await Promise.all([
          this.bigquery.query({
            query: sqlTotalStudentsRange,
            params: { ...studentFilterParams, startDate: curStartISO, endDate: curEndISO, prevStart: prevStartISO, prevEnd: prevEndISO },
          }),
          this.bigquery.query({
            query: sqlTotalInstructorsRange,
            params: instructorParams,
          }),
          this.bigquery.query({
            query: sqlAtRisk,
            params: { ...studentFilterParams, startDate: curStartISO, endDate: curEndISO, prevStart: prevStartISO, prevEnd: prevEndISO },
          }),
          this.bigquery.query({
            query: sqlPerformance,
            params: { startDate: startDateStr, endDate: endDateStr },
          }),
        ]);

        const studentRows = studentRowsRes[0];
        const instructorRows = instructorRowsRes[0];
        const atRiskRows = atRiskRowsRes[0];
        perfRows = performanceRowsRes[0];

        const studentRow = (studentRows as any[])[0] || {};
        totalStudents = Number(studentRow.current_cnt ?? 0);
        previousStudents = Number(studentRow.previous_cnt ?? 0);

        const instructorRow = (instructorRows as any[])[0] || {};
        totalInstructors = Number(instructorRow.current_cnt ?? 0);
        previousInstructors = Number(instructorRow.previous_cnt ?? 0);

        // Lấy dữ liệu at-risk từ kết quả query
        const atRiskAgg = (atRiskRows as any[])[0] || {};
        atRiskCount = Number(atRiskAgg.current_cnt ?? 0);
        previousAtRiskCount = Number(atRiskAgg.previous_cnt ?? 0);

        if ((query as any)._debug === 'true') {
          __debug = {
            mode: 'range_between',
            timeFilter,
            whereClauseStudent,
            studentFilterParams,
            instructorWhere,
            instructorParams,
            curStartISO,
            curEndISO,
            prevStartISO,
            prevEndISO,
            totalStudents,
            previousStudents,
            totalInstructors,
            previousInstructors,
            atRisk: atRiskRows ? atRiskRows[0] : undefined,
            performanceSample: perfRows ? perfRows[0] : undefined,
          };
        }
      } else {
        // === TẤT CẢ: Snapshot cộng dồn (<= now) ===
        const sqlTotalStudentsSnap = `
          SELECT
            COUNT(DISTINCT IF(ds.created_at <= @endDate, ds.student_sk, NULL)) AS current_cnt,
            COUNT(DISTINCT IF(ds.created_at <= @prevEndDate, ds.student_sk, NULL)) AS previous_cnt
          FROM ${this.dataset}.dim_student ds
          INNER JOIN ${this.dataset}.dim_account a ON CAST(ds.account_id AS STRING) = CAST(a.account_sk AS STRING)
          WHERE a.status = 'active' AND a.role_code IN ('student', 'students') AND (${whereClauseStudent});
        `;

        // Filter instructor
        let instructorWhere = 'TRUE';
        const instructorParams: any = {
          endDate: curEndISO,
          prevEndDate: prevEndISO,
        };
        if (query.school && query.school !== 'Tất cả các trường') {
          instructorWhere = 'di.department_name = @school';
          instructorParams.school = query.school;
        }

        const sqlTotalInstructorsSnap = `
          SELECT
            COUNT(DISTINCT IF(di.created_at <= @endDate, di.instructor_sk, NULL)) AS current_cnt,
            COUNT(DISTINCT IF(di.created_at <= @prevEndDate, di.instructor_sk, NULL)) AS previous_cnt
          FROM ${this.dataset}.dim_instructor di
          INNER JOIN ${this.dataset}.dim_account a ON CAST(di.account_id AS STRING) = CAST(a.account_sk AS STRING)
          WHERE a.status = 'active' AND a.role_code IN ('instructor', 'teacher', 'instructors') AND (${instructorWhere});
        `;

        // Query performance
        const sqlPerformance = `
          SELECT role_code, performance_rate, activity_date
          FROM ${this.dataset}.fact_daily_account_activity
          WHERE activity_date = (
            SELECT MAX(activity_date)
            FROM ${this.dataset}.fact_daily_account_activity
            WHERE activity_date BETWEEN @startDate AND @endDate
          )
          AND role_code IN ('student', 'students', 'instructor', 'teacher', 'instructors')
        `;

        // at-risk snapshot SQL (<= endDate)
        sqlAtRisk = `
          SELECT
            COUNT(DISTINCT IF(ds.status = 'at-risk' AND ds.created_at <= @endDate, ds.student_sk, NULL)) AS current_cnt,
            COUNT(DISTINCT IF(ds.status = 'at-risk' AND ds.created_at <= @prevEndDate, ds.student_sk, NULL)) AS previous_cnt
          FROM ${this.dataset}.dim_student ds
          WHERE (${whereClauseStudent});
        `;

        // Song song
        const [studentSnapRowsRes, instructorSnapRowsRes, atRiskRowsRes, performanceRowsRes] = await Promise.all([
          this.bigquery.query({
            query: sqlTotalStudentsSnap,
            params: { ...studentFilterParams, endDate: curEndISO, prevEndDate: prevEndISO },
          }),
          this.bigquery.query({
            query: sqlTotalInstructorsSnap,
            params: instructorParams,
          }),
          this.bigquery.query({
            query: sqlAtRisk,
            params: { ...studentFilterParams, endDate: curEndISO, prevEndDate: prevEndISO },
          }),
          this.bigquery.query({
            query: sqlPerformance,
            params: { startDate: startDateStr, endDate: endDateStr },
          }),
        ]);

        const studentSnapRows = studentSnapRowsRes[0];
        const instructorSnapRows = instructorSnapRowsRes[0];
        const atRiskRows = atRiskRowsRes[0];
        perfRows = performanceRowsRes[0];

        const studentSnapRow = (studentSnapRows as any[])[0] || {};
        totalStudents = Number(studentSnapRow.current_cnt ?? 0);
        previousStudents = Number(studentSnapRow.previous_cnt ?? 0);

        const instructorSnapRow = (instructorSnapRows as any[])[0] || {};
        totalInstructors = Number(instructorSnapRow.current_cnt ?? 0);
        previousInstructors = Number(instructorSnapRow.previous_cnt ?? 0);

        // Lấy dữ liệu at-risk
        const atRiskAgg = (atRiskRows as any[])[0] || {};
        atRiskCount = Number(atRiskAgg.current_cnt ?? 0);
        previousAtRiskCount = Number(atRiskAgg.previous_cnt ?? 0);

        if ((query as any)._debug === 'true') {
          __debug = {
            mode: 'dim_snapshot_with_filters',
            whereClauseStudent,
            studentFilterParams,
            instructorWhere,
            instructorParams,
            curEndISO,
            prevEndISO,
            totalStudents,
            previousStudents,
            totalInstructors,
            previousInstructors,
            atRisk: atRiskRows ? atRiskRows[0] : undefined,
            performanceSample: perfRows ? perfRows[0] : undefined,
          };
        }
      }
    } catch (err) {
      this.logger.error('Error querying dim-based totals:', err as any);
      throw err;
    }

    // Ghi file debug nếu cần
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

    // Lấy performance từ các query đã chạy (đã lấy ở trên)
    const performanceMap = new Map<string, number>();
    let performanceDate: string | null = null;
    (perfRows as any[]).forEach(r => {
      const role = String(r.role_code);
      const rate = Number(r.performance_rate ?? 0);
      performanceMap.set(role, rate);
      if (!performanceDate && r.activity_date) {
        performanceDate = r.activity_date;
      }
    });

    const studentPerformance = performanceMap.get('student') ?? performanceMap.get('students') ?? 0;
    const instructorPerformance =
      performanceMap.get('instructor') ??
      performanceMap.get('teacher') ??
      performanceMap.get('instructors') ??
      0;

    const performance: DashboardStatsResponse['current']['performance'] = {
      student: studentPerformance,
      instructor: instructorPerformance,
    };

    const studentComparison = this.calculateComparison(totalStudents, previousStudents);
    const instructorComparison = this.calculateComparison(totalInstructors, previousInstructors);
    const atRiskComparison = this.calculateComparison(atRiskCount, previousAtRiskCount);

    // Kết quả trả về
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
        atRisk: atRiskComparison,
      },
      timeRange: timeFilter,
      filters: {
        school: query.school !== 'Tất cả các trường' ? query.school : undefined,
        courseYear: query.courseYear !== 'Tất cả khóa' ? query.courseYear : undefined,
        major: query.major !== 'Tất cả' ? query.major : undefined,
        class: query.class !== 'Tất cả' ? query.class : undefined,
      },
    };

    // Debug
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

  /** * Phân tích tổng quan Dashboard Learning (theo học kỳ / năm học) */
  async getLearningDashboardSummary(query: any): Promise<any> {
    const { academicYear, semester = 'Kỳ 1', compare = true, topLimit = 5 } = query as any;
    if (!academicYear) throw new Error('academicYear is required');

    const semesterNumber = this.mapSemesterToNumber(semester);
    if (!semesterNumber)
      throw new Error('Invalid semester value');

    const { prevAcademicYear, prevSemesterNumber } = this.getPreviousAcademicPeriod(academicYear, semesterNumber);
    const { whereClauseStudent, params } = this.buildBQStudentFilters(query);

    // Tham số chính cho query
    const bqParamsBase: any = {
      ...params,
      academicYear,
      prevAcademicYear,
      semesterNumber,
      prevSemesterNumber,
    };

    // SQL - tổng: đếm, warning (2.0-2.5), at-risk (<2.0), GPA trung bình, phân loại GPA
    const sqlSummary = `
      WITH filtered AS (
        SELECT
          fsp.student_sk,
          fsp.academic_year,
          fsp.semester_number,
          fsp.gpa,
          LOWER(COALESCE(fsp.gpa_category, 'unknown')) AS gpa_category,
          ds.department_name,
          ds.major,
          ds.class_code,
          ds.cohort_year,
          CASE
            WHEN fsp.academic_year = @academicYear AND fsp.semester_number = @semesterNumber THEN 'current'
            WHEN fsp.academic_year = @prevAcademicYear AND fsp.semester_number = @prevSemesterNumber THEN 'previous'
            ELSE NULL
          END AS period
        FROM ${this.dataset}.fact_student_course_performance fsp
        JOIN ${this.dataset}.dim_student ds ON fsp.student_sk = ds.student_sk
        WHERE (${whereClauseStudent})
          AND (fsp.academic_year = @academicYear OR fsp.academic_year = @prevAcademicYear)
      )
      SELECT
        COUNT(DISTINCT IF(period = 'current', student_sk, NULL)) AS current_students,
        COUNT(DISTINCT IF(period = 'previous', student_sk, NULL)) AS previous_students,
        -- Warning: GPA từ 2.0 đến < 2.5 (dưới ngưỡng khá)
        COUNT(DISTINCT IF(period = 'current' AND gpa >= 2.0 AND gpa < 2.5, student_sk, NULL)) AS current_warning,
        COUNT(DISTINCT IF(period = 'previous' AND gpa >= 2.0 AND gpa < 2.5, student_sk, NULL)) AS previous_warning,
        -- At-risk: GPA < 2.0 (At-Risk)
        COUNT(DISTINCT IF(period = 'current' AND gpa < 2.0, student_sk, NULL)) AS current_at_risk,
        COUNT(DISTINCT IF(period = 'previous' AND gpa < 2.0, student_sk, NULL)) AS previous_at_risk,
        AVG(IF(period = 'current', gpa, NULL)) AS avg_gpa_current,
        COUNT(IF(period = 'current' AND gpa_category = 'excellent', 1, NULL)) AS excellent_cnt,
        COUNT(IF(period = 'current' AND gpa_category = 'very good', 1, NULL)) AS very_good_cnt,
        COUNT(IF(period = 'current' AND gpa_category = 'good', 1, NULL)) AS good_cnt,
        COUNT(IF(period = 'current' AND gpa_category = 'average', 1, NULL)) AS average_cnt,
        COUNT(IF(period = 'current' AND gpa_category = 'poor', 1, NULL)) AS poor_cnt,
        COUNT(IF(period = 'current', 1, NULL)) AS total_current_cnt
      FROM filtered
      WHERE period IS NOT NULL;
    `;

    // Phân phối GPA theo trường (thang 0-4, bước nhảy 0.5)
    const sqlScoreDistribution = `
      WITH filtered AS (
        SELECT
          fsp.student_sk,
          fsp.gpa,
          ds.department_name
        FROM ${this.dataset}.fact_student_course_performance fsp
        JOIN ${this.dataset}.dim_student ds ON fsp.student_sk = ds.student_sk
        WHERE (${whereClauseStudent})
          AND fsp.academic_year = @academicYear
          AND fsp.semester_number = @semesterNumber
      )
      SELECT
        department_name,
        CAST(FLOOR(gpa * 2) / 2 AS FLOAT64) AS gpa_bucket,
        COUNT(*) AS student_count,
        SUM(gpa) AS total_gpa
      FROM filtered
      GROUP BY department_name, gpa_bucket
      ORDER BY department_name, gpa_bucket;
    `;

    // Top students
    const sqlTopStudents = `
      WITH filtered AS (
        SELECT
          fsp.student_sk,
          fsp.gpa,
          LOWER(COALESCE(fsp.gpa_category, 'unknown')) AS gpa_category,
          ds.full_name,
          ds.department_name,
          ds.major,
          ds.class_code
        FROM ${this.dataset}.fact_student_course_performance fsp
        JOIN ${this.dataset}.dim_student ds ON fsp.student_sk = ds.student_sk
        WHERE (${whereClauseStudent})
          AND fsp.academic_year = @academicYear
          AND fsp.semester_number = @semesterNumber
      )
      SELECT
        student_sk AS id,
        full_name AS name,
        department_name AS school,
        major,
        class_code AS class,
        gpa,
        gpa_category,
        ROW_NUMBER() OVER (ORDER BY gpa DESC) AS rank
      FROM filtered
      ORDER BY gpa DESC
      LIMIT @limit;
    `;

    // Số lượng giảng viên
    let instructorWhere = 'TRUE';
    const instructorParams: any = {};
    if (query.school && query.school !== 'Tất cả các trường') {
      instructorWhere = 'di.department_name = @school';
      instructorParams.school = query.school;
    }

    const sqlInstructors = `
      SELECT COUNT(DISTINCT di.instructor_sk) AS total_instructors
      FROM ${this.dataset}.dim_instructor di
      JOIN ${this.dataset}.dim_account a ON CAST(di.account_id AS STRING) = CAST(a.account_sk AS STRING)
      WHERE a.status = 'active' AND a.role_code IN ('instructor', 'teacher', 'instructors') AND (${instructorWhere});
    `;

    try {
      const [summaryRes, scoreDistRes, topRes, instructorRes] = await Promise.all([
        this.bigquery.query({ query: sqlSummary, params: bqParamsBase }),
        this.bigquery.query({ query: sqlScoreDistribution, params: bqParamsBase }),
        this.bigquery.query({ query: sqlTopStudents, params: { ...bqParamsBase, limit: topLimit } }),
        this.bigquery.query({ query: sqlInstructors, params: instructorParams }),
      ]);

      const summaryRow = (summaryRes[0] as any[])[0] || {};
      const scoreRows = (scoreDistRes[0] as any[]) || [];
      const topRows = (topRes[0] as any[]) || [];
      const insRow = (instructorRes[0] as any[])[0] || {};

      const currentStudents = Number(summaryRow.current_students ?? 0);
      const previousStudents = compare
        ? Number(summaryRow.previous_students ?? 0)
        : 0;

      // Warning: GPA từ 2.0 đến < 2.5
      const currentWarning = Number(summaryRow.current_warning ?? 0);
      const previousWarning = compare
        ? Number(summaryRow.previous_warning ?? 0)
        : 0;

      // At-risk: GPA < 2.0
      const currentAtRisk = Number(summaryRow.current_at_risk ?? 0);
      const previousAtRisk = compare
        ? Number(summaryRow.previous_at_risk ?? 0)
        : 0;

      const avgGpa = Number(summaryRow.avg_gpa_current ?? 0);
      // Thang điểm 4.0 - tính phần trăm hiệu suất
      const studentPerformance = Math.round((avgGpa / 4) * 1000) / 10;
      const totalCurrent = Number(summaryRow.total_current_cnt ?? 0);

      // Phân phối GPA (0..10)
      const gpaDist: any = {
        excellent: 0,
        veryGood: 0,
        good: 0,
        average: 0,
        weak: 0,
      };
      if (totalCurrent > 0) {
        gpaDist.excellent = Math.round(
          ((Number(summaryRow.excellent_cnt ?? 0) / totalCurrent) * 10000) / 100,
        );
        gpaDist.veryGood = Math.round(
          ((Number(summaryRow.very_good_cnt ?? 0) / totalCurrent) * 10000) / 100,
        );
        gpaDist.good = Math.round(
          ((Number(summaryRow.good_cnt ?? 0) / totalCurrent) * 10000) / 100,
        );
        gpaDist.average = Math.round(
          ((Number(summaryRow.average_cnt ?? 0) / totalCurrent) * 10000) / 100,
        );
        gpaDist.weak = Math.round(
          ((Number(summaryRow.weak_cnt ?? 0) / totalCurrent) * 10000) / 100,
        );
      }

      // Phân phối GPA theo trường - thang 0-4 với bước nhảy 0.5 (9 mốc)
      const gpaBuckets = [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0];
      const schoolMap = new Map<string, { counts: number[]; totalGpa: number; totalStudents: number; weightedSum: number }>();

      (scoreRows as any[]).forEach((r: any) => {
        const school = r.department_name || 'Unknown';
        let gpaBucket = Number(r.gpa_bucket ?? 0);
        // Đảm bảo GPA nằm trong khoảng 0-4
        gpaBucket = Math.max(0, Math.min(4.0, gpaBucket));
        // Làm tròn về mốc gần nhất
        const roundedGpa = Math.round(gpaBucket * 2) / 2;
        const bucketIndex = gpaBuckets.indexOf(roundedGpa);
        const count = Number(r.student_count ?? 0);
        const totalGpa = Number(r.total_gpa ?? 0);
        
        if (!schoolMap.has(school)) {
          schoolMap.set(school, { counts: new Array(9).fill(0), totalGpa: 0, totalStudents: 0, weightedSum: 0 });
        }
        const schoolData = schoolMap.get(school)!;
        if (bucketIndex >= 0 && bucketIndex < 9) {
          schoolData.counts[bucketIndex] += count;
          // Tính tổng GPA ước lượng từ bucket (gpaBucket * số sinh viên)
          schoolData.weightedSum += gpaBucket * count;
        }
        // Nếu có total_gpa từ SQL thì dùng, nếu không thì dùng weighted sum
        if (totalGpa > 0) {
          schoolData.totalGpa += totalGpa;
        }
        schoolData.totalStudents += count;
      });

      const scoreDistribution = {
        labels: gpaBuckets.map(g => g.toFixed(1)),
        schools: Array.from(schoolMap.entries()).map(([schoolName, data]) => {
          // Ưu tiên dùng totalGpa nếu có, nếu không thì dùng weightedSum
          const avgGpa = data.totalStudents > 0 
            ? (data.totalGpa > 0 ? data.totalGpa : data.weightedSum) / data.totalStudents 
            : 0;
          return {
            schoolName,
            scores: data.counts,
            averageGpa: Math.round(avgGpa * 100) / 100,
          };
        }),
      };

      const topStudents = topRows.map((r: any) => ({
        id: Number(r.id),
        name: String(r.name),
        school: String(r.school),
        major: String(r.major),
        class: String(r.class),
        gpa: Number(r.gpa),
        gpaCategory: String(r.gpa_category),
        rank: Number(r.rank),
      }));

      const totalInstructors = Number(insRow.total_instructors ?? 0);

      const calcComparison = (cur: number, prev: number): ComparisonData | null => {
        if (!compare) return null;
        if (prev === 0) {
          return {
            value: cur,
            percentage: cur > 0 ? 100 : 0,
            trend: (cur > 0 ? 'up' : 'stable') as 'up' | 'down' | 'stable',
          };
        }
        const diff = cur - prev;
        const pct = Math.round(Math.abs((diff / prev) * 100) * 100) / 100;
        return {
          value: diff,
          percentage: pct,
          trend: (diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable') as 'up' | 'down' | 'stable',
        };
      };

      const studentComparison = calcComparison(currentStudents, previousStudents);
      const warningComparison = calcComparison(currentWarning, previousWarning);
      const atRiskComparison = calcComparison(currentAtRisk, previousAtRisk);

      const learningContext: LearningStatsContext = {
        currentLabel: `${semester} • Năm học ${academicYear}`,
        previousLabel: compare ? `${semester} • Năm học ${prevAcademicYear}` : undefined,
      };

      const response: LearningDashboardStatsResponse = {
        current: {
          students: currentStudents,
          instructors: totalInstructors,
          warning: currentWarning,  // GPA 2.0 - 2.5
          atRisk: currentAtRisk,    // GPA < 2.0
          performance: {
            student: studentPerformance,
            instructor: studentPerformance,
          },
        },
        previous: compare
          ? {
              students: previousStudents,
              warning: previousWarning,
              atRisk: previousAtRisk,
            }
          : undefined,
        comparison: compare
          ? {
              students: studentComparison,
              warning: warningComparison,
              atRisk: atRiskComparison,
            }
          : undefined,
        gpaDistribution: gpaDist,
        scoreDistribution,
        topStudents,
        filters: {
          school: query.school,
          courseYear: query.courseYear,
          major: query.major,
          class: query.class,
          academicYear,
          semester,
        },
        learningContext,
      };

      return response;
    } catch (err) {
      this.logger.error('Error in getLearningDashboardSummary', err as any);
      throw err;
    }
  }

  /** * Thống kê dashboard học kỳ / năm học */
  async getLearningDashboardStats(
    query: DashboardStatsQueryDto,
  ): Promise<LearningDashboardStatsResponse> {
    const { semester = 'Kỳ 1', academicYear } = query as any;
    if (!academicYear) {
      throw new Error('academicYear is required for learning stats');
    }

    const semesterNumber = this.mapSemesterToNumber(semester);
    const { whereClauseStudent, params } = this.buildBQStudentFilters(query);
    const { prevAcademicYear, prevSemesterNumber } = this.getPreviousAcademicPeriod(
      academicYear,
      semesterNumber,
    );

    // Đếm số học sinh current & previous
    const baseStudentSql = `
      FROM ${this.dataset}.fact_student_course_performance fsp
      INNER JOIN ${this.dataset}.dim_student ds ON fsp.student_sk = ds.student_sk
      WHERE (${whereClauseStudent})
        AND fsp.academic_year = @academicYear
        ${semesterNumber !== null ? 'AND fsp.semester_number = @semesterNumber' : ''}
    `;

    const sqlCurrentStudents = `
      SELECT COUNT(DISTINCT fsp.student_sk) AS cnt
      ${baseStudentSql}
    `;

    const sqlPrevStudents = `
      SELECT COUNT(DISTINCT fsp.student_sk) AS cnt
      ${baseStudentSql.replace(
        'WHERE',
        `WHERE (${whereClauseStudent}) AND fsp.academic_year = @prevAcademicYear
        ${prevSemesterNumber !== null ? 'AND fsp.semester_number = @prevSemesterNumber' : ''}`,
      )}
    `;

    const [curStudentRows] = await this.bigquery.query({
      query: sqlCurrentStudents,
      params: {
        ...params,
        academicYear,
        ...(semesterNumber !== null && { semesterNumber }),
      },
    });

    const [prevStudentRows] = await this.bigquery.query({
      query: sqlPrevStudents,
      params: {
        ...params,
        prevAcademicYear,
        ...(prevSemesterNumber !== null && { prevSemesterNumber }),
      },
    });

    const totalStudents = Number((curStudentRows as any[])[0]?.cnt ?? 0);
    const previousStudents = Number((prevStudentRows as any[])[0]?.cnt ?? 0);

    // Đếm số giảng viên (từ dim_instructor, không phân biệt học kỳ)
    let instructorWhere = 'TRUE';
    const instructorParams: any = {};
    if (query.school && query.school !== 'Tất cả các trường') {
      instructorWhere = 'di.department_name = @school';
      instructorParams.school = query.school;
    }

    const sqlInstructors = `
      SELECT COUNT(DISTINCT di.instructor_sk) AS cnt
      FROM ${this.dataset}.dim_instructor di
      JOIN ${this.dataset}.dim_account a ON CAST(di.account_id AS STRING) = CAST(a.account_sk AS STRING)
      WHERE a.status = 'active' AND a.role_code IN ('instructor', 'teacher', 'instructors') AND (${instructorWhere});
    `;

    const [insRows] = await this.bigquery.query({ query: sqlInstructors, params: instructorParams });
    const totalInstructors = Number((insRows as any[])[0]?.cnt ?? 0);
    const previousInstructors = totalInstructors; // không có phân biệt theo thời gian

    // Đếm số học sinh có GPA thấp
    const sqlAtRiskCurrent = `
      SELECT COUNT(DISTINCT fsp.student_sk) AS cnt
      ${baseStudentSql}
      AND fsp.gpa < 6.5
    `;
    const sqlAtRiskPrev = `
      SELECT COUNT(DISTINCT fsp.student_sk) AS cnt
      FROM ${this.dataset}.fact_student_course_performance fsp
      INNER JOIN ${this.dataset}.dim_student ds ON fsp.student_sk = ds.student_sk
      WHERE (${whereClauseStudent})
        AND fsp.academic_year = @prevAcademicYear
        ${prevSemesterNumber !== null ? 'AND fsp.semester_number = @prevSemesterNumber' : ''}
        AND fsp.gpa < 6.5
    `;

    const [curAtRiskRows] = await this.bigquery.query({
      query: sqlAtRiskCurrent,
      params: {
        ...params,
        academicYear,
        ...(semesterNumber !== null && { semesterNumber }),
      },
    });
    const [prevAtRiskRows] = await this.bigquery.query({
      query: sqlAtRiskPrev,
      params: {
        ...params,
        prevAcademicYear,
        ...(prevSemesterNumber !== null && { prevSemesterNumber }),
      },
    });

    const atRiskCount = Number((curAtRiskRows as any[])[0]?.cnt ?? 0);
    const previousAtRiskCount = Number((prevAtRiskRows as any[])[0]?.cnt ?? 0);

    // Đánh giá điểm trung bình chung (GPA)
    const sqlPerformance = `
      SELECT AVG(fsp.gpa) AS avg_gpa
      ${baseStudentSql}
    `;
    const [perfRows] = await this.bigquery.query({
      query: sqlPerformance,
      params: {
        ...params,
        academicYear,
        ...(semesterNumber !== null && { semesterNumber }),
      },
    });
    const avgGpa = Number((perfRows as any[])[0]?.avg_gpa ?? 0);
    const studentPerformance = Math.round((avgGpa / 10) * 100 * 10) / 10;
    const instructorPerformance = studentPerformance;

    // So sánh - so sánh
    const studentComparison = this.calculateComparison(totalStudents, previousStudents);
    const instructorComparison = this.calculateComparison(totalInstructors, previousInstructors);
    const atRiskComparison = this.calculateComparison(atRiskCount, previousAtRiskCount);

    const learningContext: LearningStatsContext = {
      currentLabel: `${semester} • Năm học ${academicYear}`,
      previousLabel: `${semester} • Năm học ${prevAcademicYear}`,
    };

    const response: LearningDashboardStatsResponse = {
      current: {
        students: totalStudents,
        instructors: totalInstructors,
        atRisk: atRiskCount,
        performance: {
          student: studentPerformance,
          instructor: instructorPerformance,
        },
      },
      previous: {
        students: previousStudents,
        instructors: previousInstructors,
      },
      comparison: {
        students: studentComparison,
        instructors: instructorComparison,
        atRisk: atRiskComparison,
      },
      timeRange: 'learning',
      filters: {
        school: query.school,
        courseYear: query.courseYear,
        major: query.major,
        class: query.class,
      },
      learningContext,
    };

    return response;
  }

  // ============================================================
  // ===== MỚI THÊM: GPA Distribution từ BigQuery =====
  // ============================================================
  async getGPADistribution(query: DashboardStatsQueryDto): Promise<GPADistributionResponse> {
    const { whereClauseStudent, params } = this.buildBQStudentFilters(query);
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
      FROM ${this.dataset}.fact_student_course_performance fsp
      INNER JOIN ${this.dataset}.dim_student ds ON fsp.student_sk = ds.student_sk
      WHERE (${whereClauseStudent})
      ${semesterNumber !== null ? 'AND fsp.semester_number = @semesterNumber' : ''}
      ${query.academicYear ? 'AND fsp.academic_year = @academicYear' : ''};
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

    // Nhóm GPA theo thang 0.5: 0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0
    const sql = `
      SELECT
        ds.department_name,
        CAST(FLOOR(fsp.gpa * 2) / 2 AS FLOAT64) AS gpa_bucket,
        COUNT(*) AS student_count,
        SUM(fsp.gpa) AS total_gpa
      FROM ${this.dataset}.fact_student_course_performance fsp
      INNER JOIN ${this.dataset}.dim_student ds ON fsp.student_sk = ds.student_sk
      WHERE (${whereClauseStudent})
      ${semesterNumber !== null ? 'AND fsp.semester_number = @semesterNumber' : ''}
      ${query.academicYear ? 'AND fsp.academic_year = @academicYear' : ''}
      GROUP BY ds.department_name, gpa_bucket
      ORDER BY ds.department_name, gpa_bucket;
    `;

    const queryParams = {
      ...params,
      ...(semesterNumber !== null && { semesterNumber }),
      ...(query.academicYear && { academicYear: query.academicYear }),
    };

    const [rows] = await this.bigquery.query({ query: sql, params: queryParams });

    // Các mốc GPA: 0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0 (9 buckets)
    const gpaBuckets = [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0];
    const schoolMap = new Map<string, { counts: number[]; totalGpa: number; totalStudents: number; weightedSum: number }>();
    (rows as any[]).forEach(row => {
      const school = row.department_name || 'Unknown';
      let gpaBucket = Number(row.gpa_bucket);
      // Đảm bảo GPA nằm trong khoảng 0-4
      gpaBucket = Math.max(0, Math.min(4.0, gpaBucket));
      // Làm tròn về mốc gần nhất
      const roundedGpa = Math.round(gpaBucket * 2) / 2;
      const bucketIndex = gpaBuckets.indexOf(roundedGpa);
      const count = Number(row.student_count);
      const totalGpa = Number(row.total_gpa ?? 0);
      
      if (!schoolMap.has(school)) {
        schoolMap.set(school, { counts: new Array(9).fill(0), totalGpa: 0, totalStudents: 0, weightedSum: 0 });
      }
      const schoolData = schoolMap.get(school)!;
      if (bucketIndex >= 0 && bucketIndex < 9) {
        schoolData.counts[bucketIndex] += count;
        // Tính tổng GPA ước lượng từ bucket
        schoolData.weightedSum += gpaBucket * count;
      }
      if (totalGpa > 0) {
        schoolData.totalGpa += totalGpa;
      }
      schoolData.totalStudents += count;
    });

    return {
      labels: gpaBuckets.map(g => g.toFixed(1)),
      schools: Array.from(schoolMap.entries()).map(([schoolName, data]) => {
        const avgGpa = data.totalStudents > 0 
          ? (data.totalGpa > 0 ? data.totalGpa : data.weightedSum) / data.totalStudents 
          : 0;
        return {
          schoolName,
          scores: data.counts,
          averageGpa: Math.round(avgGpa * 100) / 100,
        };
      }),
    };
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
      FROM ${this.dataset}.fact_student_course_performance fsp
      INNER JOIN ${this.dataset}.dim_student ds ON fsp.student_sk = ds.student_sk
      WHERE (${whereClauseStudent})
      ${semesterNumber !== null ? 'AND fsp.semester_number = @semesterNumber' : ''}
      ${query.academicYear ? 'AND fsp.academic_year = @academicYear' : ''}
      ORDER BY fsp.gpa DESC
      LIMIT @limit;
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

  // ===== ACCESS TIME =====
  async getAccessTimeStats(query: DashboardStatsQueryDto): Promise<AccessTimeStatsResponse> {
    // Xác định khoảng thời gian cần lấy dữ liệu
    // Nếu có timeFilter thì sử dụng nó, ngược lại mặc định là ngày hôm nay
    const timeFilter = query.timeFilter || 'hôm-nay';
    const anchorDate = query.anchorDate;
    const selectedYear = query.selectedYear;
    const sinceYear = query.sinceYear;
    
    // Lấy khoảng thời gian dựa trên filter
    const { currentStart, currentEnd } = this.getDateRanges(
      timeFilter,
      selectedYear,
      anchorDate,
      sinceYear,
    );
    
    // Format dates cho SQL
    const startDateStr = currentStart.toISOString().split('T')[0];
    const endDateStr = currentEnd.toISOString().split('T')[0];
    
    const sql = `
      SELECT
        SUM(CASE WHEN LOWER(period) = 'morning' THEN 1 ELSE 0 END) AS morning,
        SUM(CASE WHEN LOWER(period) = 'afternoon' THEN 1 ELSE 0 END) AS afternoon,
        SUM(CASE WHEN LOWER(period) = 'evening' THEN 1 ELSE 0 END) AS evening
      FROM ${this.dataset}.fact_user_session
      WHERE period IS NOT NULL
        AND DATE(login_time) >= '${startDateStr}'
        AND DATE(login_time) <= '${endDateStr}'
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

  // Debug: Get recent sessions from BigQuery
  async debugSessions() {
    const sql = `
      SELECT session_id, account_sk, login_time, period, role_code
      FROM ${this.dataset}.fact_user_session
      ORDER BY login_time DESC
      LIMIT 20
    `;
    const [rows] = await this.bigquery.query({ query: sql });
    return { sessions: rows };
  }

  // =================== HELPER FUNCTIONS ===================
  private getDateRanges(
    timeFilter: string,
    selectedYear?: string,
    anchorDate?: string,
    sinceYear?: any,
  ): { currentStart: Date; currentEnd: Date; previousStart: Date; previousEnd: Date } {
    const parseAnchor = (d?: string) => {
      if (!d) return new Date();
      // Accept 'YYYY-MM-DD' or full ISO; ensure we construct UTC midnight
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return new Date(`${d}T00:00:00Z`);
      return new Date(d);
    };

    const startOfDayUTC = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
    const endOfDayUTC = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));

    const anchor = parseAnchor(anchorDate);

    // Default sinceYear fallback
    const since = typeof sinceYear === 'number' || (typeof sinceYear === 'string' && /^\d{4}$/.test(String(sinceYear)))
      ? Number(sinceYear)
      : undefined;

    if (timeFilter === 'hôm-nay') {
      const curStart = startOfDayUTC(anchor);
      const curEnd = endOfDayUTC(anchor);
      const prev = new Date(curStart.getTime());
      prev.setUTCDate(prev.getUTCDate() - 1);
      const prevStart = startOfDayUTC(prev);
      const prevEnd = endOfDayUTC(prev);
      return { currentStart: curStart, currentEnd: curEnd, previousStart: prevStart, previousEnd: prevEnd };
    }

    if (timeFilter === 'tuần-này') {
      // Treat week start as Monday
      const d = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), anchor.getUTCDate()));
      const dow = d.getUTCDay(); // 0 (Sun) .. 6 (Sat)
      const mondayOffset = (dow + 6) % 7; // days since Monday
      const monday = new Date(d.getTime());
      monday.setUTCDate(d.getUTCDate() - mondayOffset);
      const sunday = new Date(monday.getTime());
      sunday.setUTCDate(monday.getUTCDate() + 6);
      const curStart = startOfDayUTC(monday);
      const curEnd = endOfDayUTC(sunday);
      const prevStart = new Date(curStart.getTime());
      prevStart.setUTCDate(prevStart.getUTCDate() - 7);
      const prevEnd = new Date(curEnd.getTime());
      prevEnd.setUTCDate(prevEnd.getUTCDate() - 7);
      return { currentStart: curStart, currentEnd: curEnd, previousStart: prevStart, previousEnd: prevEnd };
    }

    if (timeFilter === 'tháng-này') {
      const y = anchor.getUTCFullYear();
      const m = anchor.getUTCMonth();
      const curStart = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0));
      const curEnd = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999));
      const prevStart = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
      const prevEnd = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
      return { currentStart: curStart, currentEnd: curEnd, previousStart: prevStart, previousEnd: prevEnd };
    }

    if (timeFilter === 'năm-này') {
      // Lọc theo năm được chọn (dựa vào anchor date)
      const y = anchor.getUTCFullYear();
      const curStart = new Date(Date.UTC(y, 0, 1, 0, 0, 0, 0)); // 1/1/Y
      const curEnd = new Date(Date.UTC(y, 11, 31, 23, 59, 59, 999)); // 31/12/Y
      const prevStart = new Date(Date.UTC(y - 1, 0, 1, 0, 0, 0, 0)); // 1/1/(Y-1)
      const prevEnd = new Date(Date.UTC(y - 1, 11, 31, 23, 59, 59, 999)); // 31/12/(Y-1)
      return { currentStart: curStart, currentEnd: curEnd, previousStart: prevStart, previousEnd: prevEnd };
    }

    // 'tất-cả' or fallback: from sinceYear (or 2022) to today; previous = same-length previous period (1 year back)
    const today = startOfDayUTC(anchor);
    const fromYear = since ?? (selectedYear ? Number(String(selectedYear).split('-')[0]) : undefined);
    const defaultSince = fromYear && !Number.isNaN(fromYear) ? fromYear : 2022;
    const curStart = new Date(Date.UTC(defaultSince, 0, 1, 0, 0, 0, 0));
    const curEnd = endOfDayUTC(anchor);
    // previous period: shift by -1 year (same calendar interval)
    const prevStart = new Date(Date.UTC(curStart.getUTCFullYear() - 1, curStart.getUTCMonth(), curStart.getUTCDate(), 0, 0, 0, 0));
    const prevEnd = new Date(Date.UTC(curEnd.getUTCFullYear() - 1, curEnd.getUTCMonth(), curEnd.getUTCDate(), 23, 59, 59, 999));
    return { currentStart: curStart, currentEnd: curEnd, previousStart: prevStart, previousEnd: prevEnd };
  }

  private buildBQStudentFilters(query: DashboardStatsQueryDto) {
    const where: string[] = ['TRUE'];
    const params: any = {};

    if (query.school && query.school !== 'Tất cả các trường') {
      where.push('(ds.department_name = @school)');
      params.school = query.school;
    }
    if (query.major && query.major !== 'Tất cả') {
      where.push('(ds.major = @major)');
      params.major = query.major;
    }
    if (query.courseYear && query.courseYear !== 'Tất cả khóa') {
      const yearMatch = query.courseYear.match(/K(\d+)/);
      if (yearMatch) {
        const lastTwo = Number(yearMatch[1]);
        const graduationYear = 2000 + lastTwo;
        const cohortYear = graduationYear - 6;
        where.push('(ds.cohort_year = @cohortYear)');
        params.cohortYear = cohortYear;
      }
    }
    if (query.class && query.class !== 'Tất cả') {
      where.push('(ds.class_code = @class)');
      params.class = query.class;
    }
    return {
      whereClauseStudent: where.join(' AND '),
      params,
    };
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
