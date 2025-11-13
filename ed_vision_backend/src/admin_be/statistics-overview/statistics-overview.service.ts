import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  DashboardStatsQueryDto,
  DashboardStatsResponse,
  ComparisonData,
  AccessTimeStatsResponse,
} from './dto/dashboard-stats.dto';

@Injectable()
export class StatisticsOverviewService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get filter options for dashboard
   */
  async getFilterOptions() {
    // Get all departments (schools)
    const departments = await this.prisma.department.findMany({
      where: { status: 'active' },
      select: { name: true },
      orderBy: { name: 'asc' },
    });

    // Get all programs (majors) with their department
    const programs = await this.prisma.program.findMany({
      select: {
        program_name: true,
        department: {
          select: { name: true },
        },
      },
      orderBy: { program_name: 'asc' },
    });

    // Get all class groups with cohort years
    const classGroups = await this.prisma.classGroup.findMany({
      where: { status: 'active' },
      select: {
        class_code: true,
        cohort_year: true,
        program: {
          select: {
            program_name: true,
            department: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { class_code: 'asc' },
    });

    // Extract unique cohort years and format as "K28", "K29", etc.
    // Logic: Năm nhập học + 6 = K
    // VD: 2022 + 6 = 2028 → K28
    //     2023 + 6 = 2029 → K29
    const cohortYears = Array.from(
      new Set(classGroups.map((c) => c.cohort_year).filter((year) => year !== null)),
    )
      .sort()
      .map((year) => {
        const graduationYear = year + 6; // Năm nhập học + 6 năm = năm tốt nghiệp dự kiến
        return `K${graduationYear.toString().slice(-2)}`; // 2028 → "K28"
      });

    return {
      schools: ['Tất cả các trường', ...departments.map((d) => d.name)],
      courseYears: ['Tất cả khóa', ...cohortYears],
      majors: programs.map((p) => ({
        name: p.program_name,
        school: p.department.name,
      })),
      classes: classGroups.map((c) => ({
        code: c.class_code,
        cohortYear: c.cohort_year,
        program: c.program?.program_name,
        school: c.program?.department?.name,
      })),
    };
  }

  /**
   * Get dashboard statistics with time-based comparison
   */
  async getDashboardStats(
    query: DashboardStatsQueryDto,
  ): Promise<DashboardStatsResponse> {
    const { timeFilter = 'tháng-này' } = query;

    // Calculate date ranges for current and previous periods
    const { currentStart, currentEnd, previousStart, previousEnd } =
      this.getDateRanges(timeFilter, query.selectedYear);

    console.log('📅 Date ranges:', {
      timeFilter,
      current: { start: currentStart, end: currentEnd },
      previous: { start: previousStart, end: previousEnd },
    });

    // Build WHERE clause for filtering (WITHOUT created_at - we'll add it separately)
    const baseWhereStudent = this.buildStudentWhereClause(query);
    const baseWhereInstructor = this.buildInstructorWhereClause(query);

    // CURRENT PERIOD: Count accounts created WITHIN current period (gte start AND lte end)
    const currentWhereStudent = {
      ...baseWhereStudent,
      account: {
        ...baseWhereStudent.account,
        created_at: {
          gte: currentStart,
          lte: currentEnd,
        },
      },
    };

    const currentWhereInstructor = {
      ...baseWhereInstructor,
      account: {
        ...baseWhereInstructor.account,
        created_at: {
          gte: currentStart,
          lte: currentEnd,
        },
      },
    };

    // PREVIOUS PERIOD: Count accounts created WITHIN previous period
    const previousWhereStudent = {
      ...baseWhereStudent,
      account: {
        ...baseWhereStudent.account,
        created_at: {
          gte: previousStart,
          lte: previousEnd,
        },
      },
    };

    const previousWhereInstructor = {
      ...baseWhereInstructor,
      account: {
        ...baseWhereInstructor.account,
        created_at: {
          gte: previousStart,
          lte: previousEnd,
        },
      },
    };

    // TOTAL counts (for display) - ALL accounts up to current end
    const totalWhereStudent = {
      ...baseWhereStudent,
      account: {
        ...baseWhereStudent.account,
        created_at: {
          lte: currentEnd,
        },
      },
    };

    const totalWhereInstructor = {
      ...baseWhereInstructor,
      account: {
        ...baseWhereInstructor.account,
        created_at: {
          lte: currentEnd,
        },
      },
    };

    console.log('🔍 Where clauses:', {
      student: { current: currentWhereStudent, previous: previousWhereStudent, total: totalWhereStudent },
      instructor: { current: currentWhereInstructor, previous: previousWhereInstructor, total: totalWhereInstructor },
    });

    // Get TOTAL counts (for display in cards)
    const totalStudents = await this.prisma.student.count({
      where: totalWhereStudent,
    });
    const totalInstructors = await this.prisma.instructor.count({
      where: totalWhereInstructor,
    });

    // Get current period stats (NEW accounts in this period)
    const currentStudents = await this.prisma.student.count({
      where: currentWhereStudent,
    });
    const currentInstructors = await this.prisma.instructor.count({
      where: currentWhereInstructor,
    });

    // Get previous period stats (NEW accounts in previous period)
    const previousStudents = await this.prisma.student.count({
      where: previousWhereStudent,
    });
    const previousInstructors = await this.prisma.instructor.count({
      where: previousWhereInstructor,
    });

    console.log('📊 Counts:', {
      total: { students: totalStudents, instructors: totalInstructors },
      current: { students: currentStudents, instructors: currentInstructors },
      previous: { students: previousStudents, instructors: previousInstructors },
    });

    // DEBUG: Get sample accounts to check created_at values
    const sampleStudents = await this.prisma.student.findMany({
      where: baseWhereStudent,
      select: {
        student_id: true,
        account: {
          select: {
            account_id: true,
            created_at: true,
            email: true,
          },
        },
      },
      take: 10,
      orderBy: {
        account: {
          created_at: 'desc',
        },
      },
    });

    console.log('🔍 Sample student accounts (last 10):', 
      sampleStudents.map(s => ({
        student_id: s.student_id,
        account_id: s.account?.account_id,
        email: s.account?.email,
        created_at: s.account?.created_at,
        created_at_iso: s.account?.created_at?.toISOString(),
      }))
    );

    // Calculate at-risk students
    const atRiskCount = await this.prisma.student.count({
      where: {
        ...totalWhereStudent,
        status: 'at-risk',
      },
    });

    // Calculate average performance (placeholder)
    const performance = 85.5;

    // Calculate comparisons (comparing NEW accounts created in each period)
    const studentComparison = this.calculateComparison(
      currentStudents,
      previousStudents,
    );
    const instructorComparison = this.calculateComparison(
      currentInstructors,
      previousInstructors,
    );

    return {
      current: {
        students: totalStudents, // Display TOTAL
        instructors: totalInstructors, // Display TOTAL
        atRisk: atRiskCount,
        performance: performance,
      },
      previous: {
        students: previousStudents, // NEW in previous period
        instructors: previousInstructors, // NEW in previous period
      },
      comparison: {
        students: studentComparison, // Comparison of NEW accounts
        instructors: instructorComparison, // Comparison of NEW accounts
      },
      timeRange: timeFilter,
      filters: {
        school: query.school !== 'Tất cả các trường' ? query.school : undefined,
        courseYear: query.courseYear !== 'Tất cả khóa' ? query.courseYear : undefined,
        major: query.major !== 'Tất cả' ? query.major : undefined,
        class: query.class !== 'Tất cả' ? query.class : undefined,
      },
    };
  }

  /**
   * Calculate date ranges based on time filter
   * All dates are in Vietnam timezone (UTC+7)
   */
  private getDateRanges(timeFilter: string, selectedYear?: string) {
    // Get current time in Vietnam timezone (UTC+7)
    const now = new Date();
    const vietnamOffset = 7 * 60; // +7 hours in minutes
    const localOffset = now.getTimezoneOffset(); // Current timezone offset
    const vietnamTime = new Date(now.getTime() + (vietnamOffset + localOffset) * 60 * 1000);
    
    let currentStart: Date;
    let currentEnd: Date;
    let previousStart: Date;
    let previousEnd: Date;

    switch (timeFilter) {
      case 'hôm-nay':
        // Today in Vietnam timezone: 00:00:00.000 to 23:59:59.999
        currentStart = new Date(Date.UTC(
          vietnamTime.getFullYear(), 
          vietnamTime.getMonth(), 
          vietnamTime.getDate(), 
          0 - 7, 0, 0, 0 // Subtract 7 hours to get Vietnam midnight in UTC
        ));
        currentEnd = new Date(Date.UTC(
          vietnamTime.getFullYear(), 
          vietnamTime.getMonth(), 
          vietnamTime.getDate(), 
          23 - 7, 59, 59, 999 // Subtract 7 hours
        ));
        
        // Yesterday in Vietnam timezone
        previousStart = new Date(Date.UTC(
          vietnamTime.getFullYear(), 
          vietnamTime.getMonth(), 
          vietnamTime.getDate() - 1, 
          0 - 7, 0, 0, 0
        ));
        previousEnd = new Date(Date.UTC(
          vietnamTime.getFullYear(), 
          vietnamTime.getMonth(), 
          vietnamTime.getDate() - 1, 
          23 - 7, 59, 59, 999
        ));
        break;

      case 'tuần-này':
        // This week (Monday to Sunday) in Vietnam timezone
        const dayOfWeek = vietnamTime.getDay();
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const mondayDate = new Date(vietnamTime);
        mondayDate.setDate(vietnamTime.getDate() + diffToMonday);
        
        currentStart = new Date(Date.UTC(
          mondayDate.getFullYear(),
          mondayDate.getMonth(),
          mondayDate.getDate(),
          0 - 7, 0, 0, 0
        ));
        
        const sundayDate = new Date(mondayDate);
        sundayDate.setDate(mondayDate.getDate() + 6);
        currentEnd = new Date(Date.UTC(
          sundayDate.getFullYear(),
          sundayDate.getMonth(),
          sundayDate.getDate(),
          23 - 7, 59, 59, 999
        ));
        
        // Last week
        const lastMondayDate = new Date(mondayDate);
        lastMondayDate.setDate(mondayDate.getDate() - 7);
        previousStart = new Date(Date.UTC(
          lastMondayDate.getFullYear(),
          lastMondayDate.getMonth(),
          lastMondayDate.getDate(),
          0 - 7, 0, 0, 0
        ));
        
        const lastSundayDate = new Date(sundayDate);
        lastSundayDate.setDate(sundayDate.getDate() - 7);
        previousEnd = new Date(Date.UTC(
          lastSundayDate.getFullYear(),
          lastSundayDate.getMonth(),
          lastSundayDate.getDate(),
          23 - 7, 59, 59, 999
        ));
        break;

      case 'tháng-này':
        // This month in Vietnam timezone
        currentStart = new Date(Date.UTC(
          vietnamTime.getFullYear(), 
          vietnamTime.getMonth(), 
          1, 
          0 - 7, 0, 0, 0
        ));
        
        const lastDayOfMonth = new Date(vietnamTime.getFullYear(), vietnamTime.getMonth() + 1, 0);
        currentEnd = new Date(Date.UTC(
          vietnamTime.getFullYear(), 
          vietnamTime.getMonth(), 
          lastDayOfMonth.getDate(), 
          23 - 7, 59, 59, 999
        ));
        
        // Last month
        const lastMonthDate = new Date(vietnamTime.getFullYear(), vietnamTime.getMonth() - 1, 1);
        previousStart = new Date(Date.UTC(
          lastMonthDate.getFullYear(), 
          lastMonthDate.getMonth(), 
          1, 
          0 - 7, 0, 0, 0
        ));
        
        const lastDayOfPrevMonth = new Date(vietnamTime.getFullYear(), vietnamTime.getMonth(), 0);
        previousEnd = new Date(Date.UTC(
          lastDayOfPrevMonth.getFullYear(), 
          lastDayOfPrevMonth.getMonth(), 
          lastDayOfPrevMonth.getDate(), 
          23 - 7, 59, 59, 999
        ));
        break;

      case 'tất-cả':
        // This year (or selected year) in Vietnam timezone
        const year = selectedYear ? parseInt(selectedYear) : vietnamTime.getFullYear();
        currentStart = new Date(Date.UTC(year, 0, 1, 0 - 7, 0, 0, 0));
        currentEnd = new Date(Date.UTC(year, 11, 31, 23 - 7, 59, 59, 999));
        
        // Previous year
        previousStart = new Date(Date.UTC(year - 1, 0, 1, 0 - 7, 0, 0, 0));
        previousEnd = new Date(Date.UTC(year - 1, 11, 31, 23 - 7, 59, 59, 999));
        break;

      default:
        // Default to this month
        currentStart = new Date(Date.UTC(
          vietnamTime.getFullYear(), 
          vietnamTime.getMonth(), 
          1, 
          0 - 7, 0, 0, 0
        ));
        
        const defaultLastDay = new Date(vietnamTime.getFullYear(), vietnamTime.getMonth() + 1, 0);
        currentEnd = new Date(Date.UTC(
          vietnamTime.getFullYear(), 
          vietnamTime.getMonth(), 
          defaultLastDay.getDate(), 
          23 - 7, 59, 59, 999
        ));
        
        const defaultLastMonthDate = new Date(vietnamTime.getFullYear(), vietnamTime.getMonth() - 1, 1);
        previousStart = new Date(Date.UTC(
          defaultLastMonthDate.getFullYear(), 
          defaultLastMonthDate.getMonth(), 
          1, 
          0 - 7, 0, 0, 0
        ));
        
        const defaultLastDayPrev = new Date(vietnamTime.getFullYear(), vietnamTime.getMonth(), 0);
        previousEnd = new Date(Date.UTC(
          defaultLastDayPrev.getFullYear(), 
          defaultLastDayPrev.getMonth(), 
          defaultLastDayPrev.getDate(), 
          23 - 7, 59, 59, 999
        ));
    }

    console.log('📅 Date ranges calculated (Vietnam timezone UTC+7):', {
      timeFilter,
      vietnamNow: vietnamTime.toISOString(),
      current: { 
        start: currentStart.toISOString(), 
        end: currentEnd.toISOString() 
      },
      previous: { 
        start: previousStart.toISOString(), 
        end: previousEnd.toISOString() 
      },
    });

    return { currentStart, currentEnd, previousStart, previousEnd };
  }

  /**
   * Build WHERE clause for Student query with filters (WITHOUT date range)
   */
  private buildStudentWhereClause(query: DashboardStatsQueryDto) {
    const where: any = {
      account: {
        status: 'active',
      },
    };

    // Filter by school (Department) - via ClassGroup -> Program -> Department
    if (query.school && query.school !== 'Tất cả các trường') {
      where.classGroup = {
        program: {
          department: {
            name: query.school,
          },
        },
      };
    }

    // Filter by major (Program) - via ClassGroup -> Program
    if (query.major && query.major !== 'Tất cả') {
      if (!where.classGroup) where.classGroup = {};
      where.classGroup.program = {
        ...where.classGroup.program,
        program_name: query.major,
      };
    }

    // Filter by course year (cohort_year) - extract year from "K28" -> 2022
    // Logic: K28 = tốt nghiệp 2028 → nhập học 2022 (2028 - 6 = 2022)
    if (query.courseYear && query.courseYear !== 'Tất cả khóa') {
      // Extract number from format like "K28" or "K29"
      const yearMatch = query.courseYear.match(/K(\d+)/);
      if (yearMatch) {
        const lastTwoDigits = parseInt(yearMatch[1]); // "K28" -> 28
        const graduationYear = 2000 + lastTwoDigits; // 28 -> 2028
        const cohortYear = graduationYear - 6; // 2028 - 6 = 2022
        where.cohort_year = cohortYear;
      }
    }

    // Filter by class (ClassGroup)
    if (query.class && query.class !== 'Tất cả') {
      if (!where.classGroup) where.classGroup = {};
      where.classGroup.class_code = query.class;
    }

    return where;
  }

  /**
   * Build WHERE clause for Instructor query with filters (WITHOUT date range)
   */
  private buildInstructorWhereClause(query: DashboardStatsQueryDto) {
    const where: any = {
      account: {
        status: 'active',
      },
    };

    // Filter by school (Department)
    if (query.school && query.school !== 'Tất cả các trường') {
      where.department = {
        name: query.school,
      };
    }

    return where;
  }

  /**
   * Calculate comparison between current and previous values
   */
  private calculateComparison(
    current: number,
    previous: number,
  ): ComparisonData {
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

  /**
   * Get access time statistics based on last_login_at
   * Time periods (Vietnam timezone UTC+7):
   * - Sáng (Morning): 4:30 - 10:00
   * - Trưa (Noon): 10:00 - 13:00
   * - Chiều (Afternoon): 13:00 - 18:00
   * - Tối (Evening): 18:00 - 23:00 + 0:00 - 4:30
   * - Backup: 23:00 - 0:00 (excluded - no login allowed)
   */
  async getAccessTimeStats(
    query: DashboardStatsQueryDto,
  ): Promise<AccessTimeStatsResponse> {
    // Get all accounts with last_login_at from Student and Instructor tables
    const students = await this.prisma.student.findMany({
      where: { status: 'active' },
      select: {
        account: {
          select: {
            last_login_at: true,
          },
        },
      },
    });

    const instructors = await this.prisma.instructor.findMany({
      where: { status: 'active' },
      select: {
        account: {
          select: {
            last_login_at: true,
          },
        },
      },
    });

    // Combine all login times
    const loginTimes: Date[] = [
      ...students
        .map((s) => s.account?.last_login_at)
        .filter((t): t is Date => t !== null),
      ...instructors
        .map((i) => i.account?.last_login_at)
        .filter((t): t is Date => t !== null),
    ];

    // Count logins by time period
    const counts = {
      morning: 0, // 4:30 - 10:00
      noon: 0, // 10:00 - 13:00
      afternoon: 0, // 13:00 - 18:00
      evening: 0, // 18:00 - 23:00 + 0:00 - 4:30
    };

    loginTimes.forEach((loginTime) => {
      // Convert UTC to Vietnam time (UTC+7)
      const vietnamTime = new Date(loginTime.getTime() + 7 * 60 * 60 * 1000);
      const hours = vietnamTime.getUTCHours();
      const minutes = vietnamTime.getUTCMinutes();
      const totalMinutes = hours * 60 + minutes;

      // Time ranges in minutes
      const morningStart = 4 * 60 + 30; // 4:30 = 270 minutes
      const morningEnd = 10 * 60; // 10:00 = 600 minutes
      const noonEnd = 13 * 60; // 13:00 = 780 minutes
      const afternoonEnd = 18 * 60; // 18:00 = 1080 minutes
      const eveningEnd = 23 * 60; // 23:00 = 1380 minutes

      if (totalMinutes >= morningStart && totalMinutes < morningEnd) {
        counts.morning++;
      } else if (totalMinutes >= morningEnd && totalMinutes < noonEnd) {
        counts.noon++;
      } else if (totalMinutes >= noonEnd && totalMinutes < afternoonEnd) {
        counts.afternoon++;
      } else if (
        totalMinutes >= afternoonEnd && totalMinutes < eveningEnd ||
        totalMinutes >= 0 && totalMinutes < morningStart
      ) {
        // Evening: 18:00-23:00 OR 0:00-4:30
        counts.evening++;
      }
      // 23:00-0:00 is backup time, excluded (no else clause)
    });

    const total = counts.morning + counts.noon + counts.afternoon + counts.evening;

    // Calculate percentages
    const percentages = {
      morning: total > 0 ? parseFloat(((counts.morning / total) * 100).toFixed(2)) : 0,
      noon: total > 0 ? parseFloat(((counts.noon / total) * 100).toFixed(2)) : 0,
      afternoon: total > 0 ? parseFloat(((counts.afternoon / total) * 100).toFixed(2)) : 0,
      evening: total > 0 ? parseFloat(((counts.evening / total) * 100).toFixed(2)) : 0,
    };

    return {
      data: counts,
      percentages,
      total,
    };
  }
}
