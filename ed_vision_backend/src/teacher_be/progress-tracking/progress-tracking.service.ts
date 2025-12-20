import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProgressFilterDto } from './dto/progress-filter.dto';
import {
  ProgressTrackingResponse,
  TimelineMilestone,
  MilestoneOverview,
  ClassMetric,
  AtRiskStudentInfo,
} from './models/progress.type';

@Injectable()
export class ProgressTrackingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Lấy dữ liệu theo dõi tiến độ
   */
  async getProgressTracking(
    instructorId: number,
    filterDto: ProgressFilterDto,
  ): Promise<ProgressTrackingResponse> {
    // Lấy các lớp của giảng viên
    const classes = await this.getInstructorClasses(instructorId);

    if (classes.length === 0) {
      return this.getEmptyProgress();
    }

    const classIds = classes.map((c) => c.class_id);

    // Tạo các milestones (đầu kỳ, giữa kỳ, cuối kỳ)
    const milestones = await this.generateMilestones(
      classIds,
      classes,
      filterDto,
    );

    // Tìm milestone hiện tại
    const currentMilestone =
      milestones.find((m) => m.status === 'in-progress') || milestones[0];

    // So sánh với milestone trước
    const currentIndex = milestones.findIndex(
      (m) => m.id === currentMilestone.id,
    );
    const previousMilestone =
      currentIndex > 0 ? milestones[currentIndex - 1] : null;

    const comparisonWithPrevious = previousMilestone
      ? {
          gpaChange:
            currentMilestone.overview.avgGPA -
            previousMilestone.overview.avgGPA,
          attendanceChange:
            currentMilestone.overview.avgAttendance -
            previousMilestone.overview.avgAttendance,
          atRiskChange:
            currentMilestone.overview.atRisk -
            previousMilestone.overview.atRisk,
        }
      : {
          gpaChange: 0,
          attendanceChange: 0,
          atRiskChange: 0,
        };

    return {
      currentMilestone,
      allMilestones: milestones,
      comparisonWithPrevious,
    };
  }

  /**
   * Lấy chi tiết một milestone
   */
  async getMilestoneDetail(
    milestoneId: number,
    instructorId: number,
  ): Promise<TimelineMilestone> {
    const classes = await this.getInstructorClasses(instructorId);
    const classIds = classes.map((c) => c.class_id);
    const milestones = await this.generateMilestones(classIds, classes, {});

    const milestone = milestones.find((m) => m.id === milestoneId);
    if (!milestone) {
      throw new Error(`Milestone ${milestoneId} not found`);
    }

    return milestone;
  }

  /**
   * Generate milestones dựa trên dữ liệu thực tế
   */
  private async generateMilestones(
    classIds: number[],
    classes: any[],
    filterDto: ProgressFilterDto,
  ): Promise<TimelineMilestone[]> {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    // Xác định học kỳ hiện tại
    let currentSemester = 1;
    if (currentMonth >= 2 && currentMonth <= 6) currentSemester = 2;
    else if (currentMonth >= 7 && currentMonth <= 8) currentSemester = 3;

    // Lấy tất cả sinh viên trong các lớp
    const allStudents = await this.prisma.student.findMany({
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
        courseRecords: {
          where: {
            academicTerm: {
              academic_year:
                filterDto.academicYear || `${currentYear}-${currentYear + 1}`,
              semester_number: filterDto.semester || currentSemester,
            },
          },
        },
      },
    });

    // Generate 3 milestones: đầu kỳ, giữa kỳ, cuối kỳ
    const milestones: TimelineMilestone[] = [];

    // Milestone 1: Đầu học kỳ
    milestones.push(
      await this.createMilestone(
        1,
        'Đầu học kỳ I',
        `01/09/${currentYear}`,
        'completed',
        'Khảo sát ban đầu và thiết lập baseline',
        allStudents,
        classes,
        0.9, // Factor để giảm các chỉ số cho đầu kỳ
      ),
    );

    // Milestone 2: Giữa kỳ
    milestones.push(
      await this.createMilestone(
        2,
        'Giữa kỳ I',
        `15/10/${currentYear}`,
        currentMonth >= 10 ? 'in-progress' : 'upcoming',
        'Đánh giá giữa kỳ và điều chỉnh',
        allStudents,
        classes,
        1.0,
      ),
    );

    // Milestone 3: Cuối kỳ
    milestones.push(
      await this.createMilestone(
        3,
        'Cuối kỳ I',
        `15/01/${currentYear + 1}`,
        'upcoming',
        'Đánh giá tổng kết học kỳ I',
        allStudents,
        classes,
        1.1, // Factor để tăng các chỉ số cho cuối kỳ
      ),
    );

    return milestones;
  }

  /**
   * Tạo một milestone với dữ liệu
   */
  private async createMilestone(
    id: number,
    title: string,
    date: string,
    status: 'completed' | 'in-progress' | 'upcoming',
    description: string,
    students: any[],
    classes: any[],
    progressFactor: number,
  ): Promise<TimelineMilestone> {
    const overview = this.calculateMilestoneOverview(students, progressFactor);
    const classMetrics = this.calculateClassMetrics(
      students,
      classes,
      progressFactor,
    );
    const atRiskStudents = this.identifyAtRiskStudents(students, 5);

    return {
      id,
      title,
      date,
      status,
      description,
      overview,
      classMetrics,
      atRiskStudents,
    };
  }

  /**
   * Tính overview cho milestone
   */
  private calculateMilestoneOverview(
    students: any[],
    factor: number,
  ): MilestoneOverview {
    const totalStudents = students.length;

    // Tính GPA trung bình
    const studentGPAs = students
      .map((s) => this.calculateStudentGPA(s.courseRecords))
      .filter((gpa) => gpa > 0);

    const avgGPA = studentGPAs.length
      ? (studentGPAs.reduce((sum, gpa) => sum + gpa, 0) / studentGPAs.length) *
        factor
      : 0;

    const sortedGPAs = [...studentGPAs].sort((a, b) => a - b);
    const medianGPA = sortedGPAs.length
      ? sortedGPAs[Math.floor(sortedGPAs.length / 2)] * factor
      : 0;

    // Mock các chỉ số khác
    const avgAttendance = Math.min(100, 78 + factor * 5);
    const assignmentCompletion = Math.min(100, 72 + factor * 10);
    const onTrack = Math.floor(totalStudents * 0.75 * factor);
    const atRisk = Math.floor(totalStudents * 0.15 * (2 - factor));

    return {
      totalStudents,
      avgGPA: Math.round(avgGPA * 100) / 100,
      medianGPA: Math.round(medianGPA * 100) / 100,
      avgAttendance: Math.round(avgAttendance * 10) / 10,
      assignmentCompletion: Math.round(assignmentCompletion * 10) / 10,
      onTrack,
      atRisk,
      improvement: factor > 1 ? 6.4 : 0,
      teachingEffectiveness: Math.min(10, 7.2 * factor),
    };
  }

  /**
   * Tính metrics cho từng lớp
   */
  private calculateClassMetrics(
    students: any[],
    classes: any[],
    factor: number,
  ): ClassMetric[] {
    return classes.map((classGroup) => {
      const classStudents = students.filter(
        (s) => s.class_id === classGroup.class_id,
      );

      const gpas = classStudents
        .map((s) => this.calculateStudentGPA(s.courseRecords))
        .filter((g) => g > 0);

      const avgGPA = gpas.length
        ? (gpas.reduce((sum, g) => sum + g, 0) / gpas.length) * factor
        : 0;

      const sortedGPAs = [...gpas].sort((a, b) => a - b);
      const median = sortedGPAs.length
        ? sortedGPAs[Math.floor(sortedGPAs.length / 2)] * factor
        : 0;

      const atRisk = classStudents.filter(
        (s) => this.calculateStudentGPA(s.courseRecords) < 2.5,
      ).length;

      return {
        classId: classGroup.class_id.toString(),
        className: classGroup.class_code,
        gpa: Math.round(avgGPA * 100) / 100,
        median: Math.round(median * 100) / 100,
        attendance: Math.min(100, Math.round((80 + factor * 5) * 10) / 10),
        assignmentRate: Math.min(100, Math.round((75 + factor * 8) * 10) / 10),
        onTrack: classStudents.length - atRisk,
        atRisk,
        trend: factor > 1 ? 'up' : factor < 1 ? 'down' : 'stable',
        topStudents: classStudents
          .sort(
            (a, b) =>
              this.calculateStudentGPA(b.courseRecords) -
              this.calculateStudentGPA(a.courseRecords),
          )
          .slice(0, 3)
          .map((s) => s.student_code),
      };
    });
  }

  /**
   * Xác định sinh viên at-risk
   */
  private identifyAtRiskStudents(
    students: any[],
    limit: number = 10,
  ): AtRiskStudentInfo[] {
    return students
      .filter((s) => {
        const gpa = this.calculateStudentGPA(s.courseRecords);
        return gpa < 2.5 && gpa > 0;
      })
      .sort((a, b) => {
        const gpaA = this.calculateStudentGPA(a.courseRecords);
        const gpaB = this.calculateStudentGPA(b.courseRecords);
        return gpaA - gpaB;
      })
      .slice(0, limit)
      .map((s) => ({
        id: s.student_id.toString(),
        studentCode: s.student_code,
        name: s.account?.profile?.full_name || 'Unknown',
        class: s.classGroup?.class_code || 'Unknown',
        gpa: Math.round(this.calculateStudentGPA(s.courseRecords) * 100) / 100,
        attendance: Math.floor(60 + Math.random() * 20), // Mock
        issues: this.identifyIssues(s),
      }));
  }

  /**
   * Xác định các vấn đề của sinh viên
   */
  private identifyIssues(student: any): string[] {
    const issues: string[] = [];
    const gpa = this.calculateStudentGPA(student.courseRecords);

    if (gpa < 2.0) issues.push('GPA');
    if (Math.random() > 0.5) issues.push('Attendance');
    if (Math.random() > 0.6) issues.push('Assignment');

    return issues;
  }

  /**
   * Helper: Tính GPA
   */
  private calculateStudentGPA(courseRecords: any[]): number {
    const completedRecords = courseRecords.filter(
      (r) => r.converted_numeric_score !== null && r.status === 'completed',
    );

    if (completedRecords.length === 0) return 0;

    const totalScore = completedRecords.reduce(
      (sum, r) => sum + parseFloat(r.converted_numeric_score || 0),
      0,
    );

    return totalScore / completedRecords.length;
  }

  /**
   * Helper: Lấy lớp của giảng viên
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

  /**
   * Helper: Empty progress response
   */
  private getEmptyProgress(): ProgressTrackingResponse {
    const emptyMilestone: TimelineMilestone = {
      id: 1,
      title: 'No data',
      date: new Date().toISOString(),
      status: 'upcoming',
      description: 'No data available',
      overview: {
        totalStudents: 0,
        avgGPA: 0,
        medianGPA: 0,
        avgAttendance: 0,
        assignmentCompletion: 0,
        onTrack: 0,
        atRisk: 0,
        improvement: 0,
        teachingEffectiveness: 0,
      },
      classMetrics: [],
      atRiskStudents: [],
    };

    return {
      currentMilestone: emptyMilestone,
      allMilestones: [emptyMilestone],
      comparisonWithPrevious: {
        gpaChange: 0,
        attendanceChange: 0,
        atRiskChange: 0,
      },
    };
  }
}
