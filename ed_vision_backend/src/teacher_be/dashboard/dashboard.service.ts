import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DashboardFilterDto } from './dto/dashboard-filter.dto';
import {
  DashboardResponse,
  DashboardStats,
  AtRiskStudent,
  ChartData,
} from './models/dashboard-stats.type';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  /**
   * Lấy thống kê tổng quan cho giảng viên
   */
  async getDashboardStats(
    instructorId: number,
    filterDto: DashboardFilterDto,
  ): Promise<DashboardResponse> {
    // Lấy danh sách lớp mà giảng viên phụ trách (adviser)
    let classes = await this.getInstructorClasses(instructorId);

    if (!classes || classes.length === 0) {
      return this.getEmptyDashboard();
    }

    // Filter classes by faculty if provided
    if (filterDto.faculty) {
      classes = classes.filter(
        (c) => c.program?.department?.name === filterDto.faculty,
      );
    }

    // Filter classes by intake/cohort (e.g., "K28") if provided
    if (filterDto.course) {
      // Extract year from "K28" format
      const cohortMatch = filterDto.course.match(/K(\d+)/);
      if (cohortMatch) {
        const cohortYear = parseInt(cohortMatch[1]);
        classes = classes.filter((c) => c.cohort_year === cohortYear);
      } else {
        // If not in K format, filter by class_code
        classes = classes.filter((c) => c.class_code === filterDto.course);
      }
    }

    if (classes.length === 0) {
      return this.getEmptyDashboard();
    }

    const classIds = classes.map((c) => c.class_id);

    // Lấy danh sách sinh viên trong các lớp
    const students = await this.prisma.student.findMany({
      where: {
        class_id: { in: classIds },
        status: 'active',
      },
      include: {
        account: {
          include: {
            profile: true,
          },
        },
        classGroup: true,
        courseRecords: {
          where: {
            raw_score: { not: null }, // Chỉ lấy môn có điểm
          },
          include: {
            course: true,
            academicTerm: true,
          },
        },
      },
    });

    // Tính toán stats
    const stats = await this.calculateStats(students);
    const atRiskStudents = this.identifyAtRiskStudents(students);
    const weeklyProgressChart = this.generateWeeklyProgressChart(students);
    const majorComparisonChart = this.generateMajorComparisonChart(
      students,
      classes,
    );

    return {
      stats,
      atRiskStudents: atRiskStudents.slice(0, 4), // Top 4 at-risk students
      weeklyProgressChart,
      majorComparisonChart,
    };
  }

  /**
   * Lấy danh sách lớp mà giảng viên làm cố vấn
   * Pattern giống instructor-management.service.ts (đã work)
   */
  private async getInstructorClasses(instructorId: number) {
    const assignments = await this.prisma.adviserAssignment.findMany({
      where: {
        instructor_id: instructorId,
        OR: [{ ended_date: null }, { ended_date: { gte: new Date() } }],
      },
      include: {
        classGroup: {
          include: {
            program: {
              include: {
                department: true,
              },
            },
            students: true,
          },
        },
      },
    });

    return assignments.map((a) => a.classGroup);
  }

  /**
   * Xây dựng filter cho academic term
   */
  private buildTermFilter(filterDto: DashboardFilterDto) {
    const filter: any = {};

    if (filterDto.academicYear) {
      filter.academic_year = filterDto.academicYear;
    }

    if (filterDto.semester) {
      filter.semester_number = filterDto.semester;
    }

    return filter;
  }

  /**
   * Tính toán thống kê từ dữ liệu sinh viên (dùng logic giống ClassManagement)
   */
  private async calculateStats(students: any[]): Promise<DashboardStats> {
    const totalStudents = students.length;

    // Tính GPA cho từng sinh viên (4-point scale)
    const studentGPAs = students.map((student) => {
      const records = student.courseRecords;
      if (!records || records.length === 0) {
        return null;
      }

      const recordsWithScore = records.filter((r: any) => r.raw_score !== null);
      if (recordsWithScore.length === 0) {
        return null;
      }

      const gpa = this.calculateGPA(recordsWithScore);
      return gpa;
    });

    const validGPAs = studentGPAs.filter((gpa) => gpa !== null);
    const studentsWithGPA = validGPAs.length;
    const studentsWithoutGPA = totalStudents - studentsWithGPA;

    const averageGPA =
      validGPAs.length > 0
        ? validGPAs.reduce((sum, gpa) => sum + gpa, 0) / validGPAs.length
        : 0;

    // Tính median GPA
    const sortedGPAs = [...validGPAs].sort((a, b) => a - b);
    const medianGPA =
      sortedGPAs.length > 0 ? sortedGPAs[Math.floor(sortedGPAs.length / 2)] : 0;

    const minGPA = sortedGPAs.length > 0 ? sortedGPAs[0] : 0;
    const maxGPA =
      sortedGPAs.length > 0 ? sortedGPAs[sortedGPAs.length - 1] : 0;

    // Phân phối điểm (4-point scale)
    const gradeDistribution = {
      low: validGPAs.filter((gpa) => gpa < 2.0).length, // < 2.0 (At Risk)
      medium: validGPAs.filter((gpa) => gpa >= 2.0 && gpa < 3.2).length, // 2.0-3.19 (Average)
      high: validGPAs.filter((gpa) => gpa >= 3.2).length, // >= 3.2 (Excellent)
    };

    // Sinh viên at-risk (GPA < 2.0)
    const atRiskCount = validGPAs.filter((gpa) => gpa < 2.0).length;
    const atRiskPercentage =
      studentsWithGPA > 0 ? (atRiskCount / studentsWithGPA) * 100 : 0;

    // Tính số lớp (unique class_id)
    const uniqueClassIds = new Set(
      students.map((s) => s.class_id).filter(Boolean),
    );
    const totalClasses = uniqueClassIds.size;

    return {
      totalStudents,
      totalClasses,
      atRiskPercentage: Math.round(atRiskPercentage * 10) / 10,
      atRiskCount,
      gradeDistribution,
      averageGPA: Math.round(averageGPA * 100) / 100,
      medianGPA: Math.round(medianGPA * 100) / 100,
      minGPA: Math.round(minGPA * 100) / 100,
      maxGPA: Math.round(maxGPA * 100) / 100,
    };
  }

  /**
   * Tính GPA từ courseRecords (giống logic trong ClassManagement)
   */
  private calculateGPA(courseRecords: any[]): number {
    if (courseRecords.length === 0) return 0;

    let totalPoints = 0;
    let totalCredits = 0;

    courseRecords.forEach((record) => {
      const score = parseFloat(record.raw_score?.toString() || '0');
      const credits = record.course?.credits_unit || 3;

      // Convert 10-point scale to 4-point scale
      let point4Scale = 0;
      if (score >= 9.0) point4Scale = 4.0;
      else if (score >= 8.5) point4Scale = 3.7;
      else if (score >= 8.0) point4Scale = 3.5;
      else if (score >= 7.0) point4Scale = 3.0;
      else if (score >= 6.5) point4Scale = 2.5;
      else if (score >= 5.5) point4Scale = 2.0;
      else if (score >= 5.0) point4Scale = 1.5;
      else if (score >= 4.0) point4Scale = 1.0;
      else point4Scale = 0;

      totalPoints += point4Scale * credits;
      totalCredits += credits;
    });

    return totalCredits > 0 ? totalPoints / totalCredits : 0;
  }

  /**
   * Xác định sinh viên at-risk (dùng logic giống ClassManagement)
   */
  private identifyAtRiskStudents(students: any[]): AtRiskStudent[] {
    const atRiskStudents: AtRiskStudent[] = [];

    for (const student of students) {
      const records = student.courseRecords || [];
      const recordsWithScore = records.filter((r: any) => r.raw_score !== null);

      if (recordsWithScore.length === 0) continue;

      const gpa = this.calculateGPA(recordsWithScore);

      // At-risk if GPA < 2.0 (4-point scale)
      if (gpa < 2.0) {
        const debtCourses = records.filter(
          (r: any) => r.status === 'failed',
        ).length;

        let riskLevel: 'high' | 'medium' | 'low' = 'low';
        if (gpa < 1.0) riskLevel = 'high';
        else if (gpa < 1.5) riskLevel = 'medium';

        atRiskStudents.push({
          studentId: student.student_id.toString(),
          studentCode: student.student_code,
          name: student.account?.profile?.full_name || 'Unknown',
          class: student.classGroup?.class_code || 'Unknown',
          avatar: student.account?.profile?.avatar_url,
          gpa: Math.round(gpa * 100) / 100,
          absences: 0, // Chờ dữ liệu attendance thật
          debtCourses,
          riskLevel,
        });
      }
    }

    // Sắp xếp theo mức độ rủi ro (cao -> thấp) và GPA (thấp -> cao)
    return atRiskStudents.sort((a, b) => {
      const riskOrder = { high: 0, medium: 1, low: 2 };
      if (riskOrder[a.riskLevel] !== riskOrder[b.riskLevel]) {
        return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
      }
      return a.gpa - b.gpa;
    });
  }

  /**
   * Tạo dữ liệu biểu đồ tiến độ theo tuần
   */
  private generateWeeklyProgressChart(students: any[]): ChartData {
    // Mock data - in production would calculate from actual weekly data
    return {
      labels: [
        'T1',
        'T2',
        'T3',
        'T4',
        'T5',
        'T6',
        'T7',
        'T8',
        'T9',
        'T10',
        'T11',
        'T12',
      ],
      datasets: [
        {
          label: 'Average GPA',
          data: [6.5, 7.2, 6.8, 7.5, 7.8, 8.2, 8.5, 8.3, 8.8, 9.0, 8.7, 9.2],
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
        },
      ],
    };
  }

  /**
   * Tạo dữ liệu biểu đồ so sánh theo ngành
   */
  private generateMajorComparisonChart(
    students: any[],
    classes: any[],
  ): ChartData {
    // Group by program
    const programStats = new Map<string, { totalGPA: number; count: number }>();

    for (const student of students) {
      const records = student.courseRecords || [];
      const completedRecords = records.filter(
        (r: any) =>
          r.converted_numeric_score !== null && r.status === 'completed',
      );

      if (completedRecords.length === 0) continue;

      const gpa =
        completedRecords.reduce(
          (sum: number, r: any) =>
            sum + parseFloat(r.converted_numeric_score || 0),
          0,
        ) / completedRecords.length;

      const classInfo = classes.find((c) => c.class_id === student.class_id);
      const programName = classInfo?.program?.program_name || 'Unknown Program';

      if (!programStats.has(programName)) {
        programStats.set(programName, { totalGPA: 0, count: 0 });
      }

      const stats = programStats.get(programName)!;
      stats.totalGPA += gpa;
      stats.count += 1;
    }

    const labels: string[] = [];
    const data: number[] = [];

    programStats.forEach((stats, programName) => {
      labels.push(programName);
      data.push(Math.round((stats.totalGPA / stats.count) * 100) / 100);
    });

    return {
      labels,
      datasets: [
        {
          label: 'Average GPA by Program',
          data,
          backgroundColor: 'rgba(99, 102, 241, 0.8)',
        },
      ],
    };
  }

  /**
   * Trả về dashboard rỗng khi không có dữ liệu
   */
  private getEmptyDashboard(): DashboardResponse {
    return {
      stats: {
        totalStudents: 0,
        totalClasses: 0,
        atRiskPercentage: 0,
        atRiskCount: 0,
        gradeDistribution: { low: 0, medium: 0, high: 0 },
        averageGPA: 0,
        medianGPA: 0,
        minGPA: 0,
        maxGPA: 0,
      },
      atRiskStudents: [],
      weeklyProgressChart: { labels: [], datasets: [] },
      majorComparisonChart: { labels: [], datasets: [] },
    };
  }

  /**
   * Lấy danh sách filter options cho giảng viên
   */
  async getFilterOptions(instructorId: number) {
    // Lấy danh sách lớp mà giảng viên phụ trách
    const classes = await this.getInstructorClasses(instructorId);

    // Extract unique values
    const faculties = Array.from(
      new Set(classes.map((c) => c.program?.department?.name).filter(Boolean)),
    );

    const courses = Array.from(
      new Set(
        classes
          .map((c) => {
            const year = c.cohort_year;
            if (!year) return null;
            const graduationYear = year + 6;
            return `K${graduationYear.toString().slice(-2)}`;
          })
          .filter(Boolean),
      ),
    ).sort();

    // Lấy academic years từ database
    const academicTerms = await this.prisma.academicTerm.findMany({
      distinct: ['academic_year'],
      select: { academic_year: true },
      orderBy: { academic_year: 'desc' },
    });

    const academicYears = academicTerms
      .map((term) => term.academic_year)
      .filter(Boolean);

    // Semesters
    const semesters = [1, 2];

    return {
      faculties: ['Tất cả', ...faculties],
      courses: ['Tất cả khóa', ...courses],
      academicYears:
        academicYears.length > 0 ? academicYears : ['2024-2025', '2023-2024'],
      semesters,
      classes: classes.map((c) => ({
        code: c.class_code,
        cohortYear: c.cohort_year,
        program: c.program?.program_name,
        school: c.program?.department?.name,
      })),
    };
  }
}
