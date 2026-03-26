import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AtRiskReportFilterDto } from './dto/at-risk-report-filter.dto';
import {
  AtRiskReportResponse,
  AtRiskStudent,
  PerformanceReportResponse,
} from './models/report.type';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Báo cáo sinh viên at-risk
   */
  async getAtRiskReport(
    instructorId: number,
    filterDto: AtRiskReportFilterDto,
  ): Promise<AtRiskReportResponse> {
    // Lấy các lớp của giảng viên
    const classes = await this.getInstructorClasses(instructorId);
    const classIds = classes.map((c) => c.class_id);

    // Build where clause
    const where: any = {
      class_id: { in: classIds },
      status: 'active',
    };

    // Apply filters
    if (filterDto.class) {
      where.classGroup = {
        class_code: { contains: filterDto.class, mode: 'insensitive' },
      };
    }

    if (filterDto.course) {
      where.classGroup = {
        ...where.classGroup,
        cohort_year: parseInt(filterDto.course.replace('K', '')),
      };
    }

    if (filterDto.search) {
      where.OR = [
        { student_code: { contains: filterDto.search, mode: 'insensitive' } },
        {
          account: {
            profile: {
              full_name: { contains: filterDto.search, mode: 'insensitive' },
            },
          },
        },
      ];
    }

    // Lấy sinh viên
    const students = await this.prisma.student.findMany({
      where,
      include: {
        account: {
          include: {
            profile: true,
          },
        },
        classGroup: {
          include: {
            program: {
              include: {
                department: true,
              },
            },
          },
        },
        courseRecords: {
          where: {
            status: { in: ['completed', 'enrolled'] },
          },
        },
      },
    });

    // Filter by GPA (at-risk)
    const atRiskStudents: AtRiskStudent[] = students
      .map((student) => {
        const gpa = this.calculateGPA(student.courseRecords);
        const riskLevel = this.determineRiskLevel(gpa);

        return {
          id: student.student_id.toString(),
          studentCode: student.student_code,
          name: student.account?.profile?.full_name || 'Unknown',
          class: student.classGroup?.class_code || 'Unknown',
          department:
            student.classGroup?.program?.department?.name || 'Unknown',
          course: `K${student.classGroup?.cohort_year || ''}`,
          gpa: Math.round(gpa * 100) / 100,
          progress: this.calculateProgress(student.courseRecords),
          absences: Math.floor(Math.random() * 20), // Mock
          riskLevel,
          processGrade: this.getProcessGrade(student),
          midtermGrade: this.getMidtermGrade(student),
          subject: this.getCurrentSubject(student),
        };
      })
      .filter((s) => {
        // Filter only at-risk students (GPA < 2.5)
        if (s.gpa >= 2.5) return false;

        // Apply risk level filter
        if (
          filterDto.riskLevel &&
          filterDto.riskLevel !== 'all' &&
          s.riskLevel !== filterDto.riskLevel
        ) {
          return false;
        }

        return true;
      })
      .sort((a, b) => a.gpa - b.gpa);

    // Pagination
    const page = filterDto.page || 1;
    const limit = filterDto.limit || 10;
    const startIndex = (page - 1) * limit;
    const paginatedStudents = atRiskStudents.slice(
      startIndex,
      startIndex + limit,
    );

    // Calculate summary
    const summary = {
      highRisk: atRiskStudents.filter((s) => s.riskLevel === 'Nguy cơ cao')
        .length,
      mediumRisk: atRiskStudents.filter(
        (s) => s.riskLevel === 'Nguy cơ trung bình',
      ).length,
      monitor: atRiskStudents.filter((s) => s.riskLevel === 'Cần theo dõi')
        .length,
    };

    // Generate charts
    const trendChart = this.generateTrendChart();
    const distributionChart = this.generateDistributionChart(classes.length);

    return {
      students: paginatedStudents,
      total: atRiskStudents.length,
      summary,
      trendChart,
      distributionChart,
    };
  }

  /**
   * Báo cáo hiệu suất học tập
   */
  async getPerformanceReport(
    instructorId: number,
  ): Promise<PerformanceReportResponse> {
    const classes = await this.getInstructorClasses(instructorId);
    const classIds = classes.map((c) => c.class_id);

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
            status: 'completed',
          },
        },
      },
    });

    const gpas = students
      .map((s) => this.calculateGPA(s.courseRecords))
      .filter((g) => g > 0);

    const averageGPA =
      gpas.length > 0 ? gpas.reduce((sum, g) => sum + g, 0) / gpas.length : 0;

    const passRate =
      (gpas.filter((g) => g >= 2.0).length / gpas.length) * 100 || 0;

    const excellentRate =
      (gpas.filter((g) => g >= 3.2).length / gpas.length) * 100 || 0;

    // Grade distribution
    const gradeDistribution = [
      {
        range: '9.0 - 10.0',
        count: gpas.filter((g) => g >= 9.0).length,
        percentage: (gpas.filter((g) => g >= 9.0).length / gpas.length) * 100,
      },
      {
        range: '8.0 - 8.9',
        count: gpas.filter((g) => g >= 8.0 && g < 9.0).length,
        percentage:
          (gpas.filter((g) => g >= 8.0 && g < 9.0).length / gpas.length) * 100,
      },
      {
        range: '7.0 - 7.9',
        count: gpas.filter((g) => g >= 7.0 && g < 8.0).length,
        percentage:
          (gpas.filter((g) => g >= 7.0 && g < 8.0).length / gpas.length) * 100,
      },
      {
        range: '5.0 - 6.9',
        count: gpas.filter((g) => g >= 5.0 && g < 7.0).length,
        percentage:
          (gpas.filter((g) => g >= 5.0 && g < 7.0).length / gpas.length) * 100,
      },
      {
        range: '< 5.0',
        count: gpas.filter((g) => g < 5.0).length,
        percentage: (gpas.filter((g) => g < 5.0).length / gpas.length) * 100,
      },
    ];

    // Top performers
    const studentsWithGPA = students
      .map((s) => ({
        studentCode: s.student_code,
        name: s.account?.profile?.full_name || 'Unknown',
        gpa: this.calculateGPA(s.courseRecords),
        class: s.classGroup?.class_code || 'Unknown',
      }))
      .filter((s) => s.gpa > 0)
      .sort((a, b) => b.gpa - a.gpa)
      .slice(0, 10);

    return {
      summary: {
        totalStudents: students.length,
        averageGPA: Math.round(averageGPA * 100) / 100,
        passRate: Math.round(passRate * 10) / 10,
        excellentRate: Math.round(excellentRate * 10) / 10,
      },
      gradeDistribution: gradeDistribution.map((d) => ({
        ...d,
        percentage: Math.round(d.percentage * 10) / 10,
      })),
      topPerformers: studentsWithGPA.map((s) => ({
        ...s,
        gpa: Math.round(s.gpa * 100) / 100,
      })),
    };
  }

  /**
   * Helper methods
   */
  private async getInstructorClasses(instructorId: number) {
    const assignments = await this.prisma.adviserAssignment.findMany({
      where: {
        instructor_id: instructorId,
        ended_date: null,
      },
      include: {
        classGroup: true,
      },
    });
    return assignments.map((a) => a.classGroup);
  }

  private calculateGPA(courseRecords: any[]): number {
    const completed = courseRecords.filter(
      (r) => r.converted_numeric_score !== null && r.status === 'completed',
    );
    if (completed.length === 0) return 0;
    const total = completed.reduce(
      (sum, r) => sum + parseFloat(r.converted_numeric_score || 0),
      0,
    );
    return total / completed.length;
  }

  private determineRiskLevel(
    gpa: number,
  ): 'Nguy cơ cao' | 'Nguy cơ trung bình' | 'Cần theo dõi' {
    if (gpa < 1.5) return 'Nguy cơ cao';
    if (gpa < 2.0) return 'Nguy cơ trung bình';
    return 'Cần theo dõi';
  }

  private calculateProgress(courseRecords: any[]): number {
    const total = courseRecords.length;
    const completed = courseRecords.filter(
      (r) => r.status === 'completed',
    ).length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }

  private getProcessGrade(student: any): number {
    // Mock - would get from actual grades
    return Math.round((4 + Math.random() * 3) * 10) / 10;
  }

  private getMidtermGrade(student: any): number {
    // Mock
    return Math.round((3 + Math.random() * 4) * 10) / 10;
  }

  private getCurrentSubject(student: any): string {
    return student.courseRecords?.[0]?.course?.course_name || 'Unknown';
  }

  private generateTrendChart() {
    return {
      labels: [
        'Tuần 1',
        'Tuần 2',
        'Tuần 3',
        'Tuần 4',
        'Tuần 5',
        'Tuần 6',
        'Tuần 7',
        'Tuần 8',
      ],
      datasets: [
        {
          label: 'Nguy cơ cao',
          data: [12, 15, 18, 16, 20, 18, 17, 18],
          borderColor: 'rgb(220, 38, 38)',
          backgroundColor: 'rgba(220, 38, 38, 0.1)',
        },
        {
          label: 'Nguy cơ trung bình',
          data: [18, 20, 22, 19, 23, 21, 20, 21],
          borderColor: 'rgb(234, 179, 8)',
          backgroundColor: 'rgba(234, 179, 8, 0.1)',
        },
        {
          label: 'Cần theo dõi',
          data: [6, 8, 7, 9, 8, 7, 8, 8],
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
        },
      ],
    };
  }

  private generateDistributionChart(classCount: number) {
    return {
      labels: Array.from({ length: classCount }, (_, i) => `Lớp ${i + 1}`),
      datasets: [
        {
          data: Array.from({ length: classCount }, () =>
            Math.floor(Math.random() * 15 + 5),
          ),
          backgroundColor: [
            'rgb(220, 38, 38)',
            'rgb(234, 179, 8)',
            'rgb(34, 197, 94)',
            'rgb(156, 163, 175)',
            'rgb(209, 213, 219)',
          ],
        },
      ],
    };
  }
}
