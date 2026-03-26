import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GPACalculatorService } from '../../student_be/transcript-upload/gpa-calculator.service';

@Injectable()
export class GpaMetricsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gpaCalculator: GPACalculatorService,
  ) {}

  /**
   * Lấy GPA hiện tại và GPA dự đoán cho tất cả SV trong lớp
   */
  async getClassGpaMetrics(classCode: string) {
    const students = await this.prisma.student.findMany({
      where: {
        status: 'active',
        classGroup: {
          class_code: classCode,
        },
      },
      include: {
        account: {
          include: { profile: true },
        },
      },
    });

    const results = await Promise.all(
      students.map(async (s) => {
        const current = await this.gpaCalculator.calculateCurrentGPA(s.student_id);
        const predicted = await this.gpaCalculator.calculatePredictedGPA(s.student_id);
        return {
          student_id: s.student_id,
          student_code: s.student_code,
          name: s.account?.profile?.full_name || 'Unknown',
          currentGPA: current.currentGPA,
          predictedGPA: predicted.predictedGPA,
        };
      }),
    );

    return {
      class_code: classCode,
      count: results.length,
      metrics: results,
    };
  }

  /**
   * Lấy GPA hiện tại và GPA dự đoán cho 1 SV
   */
  async getStudentGpaMetrics(studentId: number) {
    const student = await this.prisma.student.findUnique({
      where: { student_id: studentId },
      include: {
        account: { include: { profile: true } },
        classGroup: true,
      },
    });

    if (!student) {
      return { success: false, message: 'Student not found' };
    }

    const current = await this.gpaCalculator.calculateCurrentGPA(studentId);
    const predicted = await this.gpaCalculator.calculatePredictedGPA(studentId);

    return {
      success: true,
      data: {
        student_id: student.student_id,
        student_code: student.student_code,
        name: student.account?.profile?.full_name || 'Unknown',
        class_code: student.classGroup?.class_code || null,
        currentGPA: current.currentGPA,
        predictedGPA: predicted.predictedGPA,
      },
    };
  }
}

