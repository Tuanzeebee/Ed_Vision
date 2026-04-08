import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateGradeStructureDto } from './dto/create-grade-structure.dto';
import { PredictionInputDto } from './dto/prediction-input.dto';
import {
  GradeStructureResponse,
  StudentGrade,
  PredictionResponse,
  StudentPrediction,
} from './models/grade.type';

@Injectable()
export class GradeManagementService {
  constructor(private prisma: PrismaService) {}

  /**
   * Tạo cấu trúc bảng điểm mới
   */
  async createGradeStructure(
    dto: CreateGradeStructureDto,
  ): Promise<GradeStructureResponse> {
    // Validate tổng trọng số = 100%
    const totalWeight = dto.columns.reduce((sum, col) => sum + col.weight, 0);
    if (totalWeight !== 100) {
      throw new BadRequestException(
        `Total weight must equal 100%. Current: ${totalWeight}%`,
      );
    }

    // Lấy danh sách sinh viên trong lớp
    const classId = parseInt(dto.classId);
    const students = await this.prisma.student.findMany({
      where: {
        class_id: classId,
        status: 'active',
      },
      include: {
        account: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (students.length === 0) {
      throw new NotFoundException(`No students found in class ${dto.classId}`);
    }

    // Tạo cấu trúc response
    const columns = dto.columns.map((col, index) => ({
      id: `col_${index}`,
      name: col.name,
      maxScore: col.maxScore,
      weight: col.weight,
    }));

    const studentGrades: StudentGrade[] = students.map((student) => ({
      studentId: student.student_id.toString(),
      studentCode: student.student_code,
      name: student.account?.profile?.full_name || 'Unknown',
      grades: {}, // Empty grades initially
      totalScore: 0,
    }));

    return {
      structureId: `struct_${Date.now()}`,
      classId: dto.classId,
      subjectCode: dto.subjectCode,
      subjectName: dto.subjectName,
      columns,
      students: studentGrades,
    };
  }

  /**
   * Lấy cấu trúc bảng điểm và điểm số
   */
  async getGradeStructure(
    classId: string,
    subjectCode: string,
  ): Promise<GradeStructureResponse> {
    // TODO: In production, load from database
    // For now, return mock structure
    const students = await this.prisma.student.findMany({
      where: {
        class_id: parseInt(classId),
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
            course: {
              course_code: subjectCode,
            },
          },
        },
      },
    });

    const studentGrades: StudentGrade[] = students.map((student) => {
      // Use existing grades if available
      const record = student.courseRecords[0];
      const totalScore = record?.converted_numeric_score
        ? parseFloat(record.converted_numeric_score.toString())
        : 0;

      return {
        studentId: student.student_id.toString(),
        studentCode: student.student_code,
        name: student.account?.profile?.full_name || 'Unknown',
        grades: {}, // Would be populated from grade details table
        totalScore,
      };
    });

    // Mock columns
    const columns = [
      { id: 'col_0', name: 'Điểm chuyên cần', maxScore: 10, weight: 10 },
      { id: 'col_1', name: 'Điểm giữa kỳ', maxScore: 10, weight: 30 },
      { id: 'col_2', name: 'Điểm cuối kỳ', maxScore: 10, weight: 60 },
    ];

    return {
      structureId: 'struct_mock',
      classId,
      subjectCode,
      subjectName: 'Subject Name',
      columns,
      students: studentGrades,
    };
  }

  /**
   * Cập nhật điểm số cho sinh viên
   */
  async updateStudentGrades(
    structureId: string,
    studentId: string,
    grades: Record<string, number>,
  ): Promise<{ success: boolean; totalScore: number }> {
    // TODO: Save to database
    // For now, calculate total score

    // Mock weights
    const weights = {
      col_0: 0.1,
      col_1: 0.3,
      col_2: 0.6,
    };

    let totalScore = 0;
    Object.entries(grades).forEach(([columnId, grade]) => {
      const weight = weights[columnId as keyof typeof weights] || 0;
      totalScore += (grade / 10) * 10 * weight; // Normalize to 10-point scale
    });

    return {
      success: true,
      totalScore: Math.round(totalScore * 100) / 100,
    };
  }

  /**
   * Dự đoán điểm dựa trên các yếu tố support
   */
  async predictGrades(
    classId: string,
    predictionInput: PredictionInputDto,
  ): Promise<PredictionResponse> {
    // Lấy sinh viên và điểm hiện tại
    const students = await this.prisma.student.findMany({
      where: {
        class_id: parseInt(classId),
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
            status: { in: ['completed', 'enrolled'] },
          },
        },
      },
    });

    const predictions: StudentPrediction[] = students.map((student) => {
      // Tính GPA hiện tại
      const currentAverage = this.calculateGPA(student.courseRecords);

      // Dự đoán điểm dựa trên input factors
      let predictedGrade = currentAverage;

      // Ảnh hưởng của thời gian làm việc (càng nhiều thì điểm càng giảm)
      const workImpact =
        predictionInput.workTime > 20
          ? -0.5
          : predictionInput.workTime > 10
            ? -0.2
            : 0;

      // Ảnh hưởng của hỗ trợ tinh thần (càng cao thì điểm càng tăng)
      const mentalImpact = (predictionInput.mentalSupport - 5) * 0.1;

      // Ảnh hưởng của hỗ trợ tài chính (càng cao thì điểm càng tăng)
      const financialImpact = (predictionInput.financialSupport - 5) * 0.15;

      predictedGrade += workImpact + mentalImpact + financialImpact;

      // Đảm bảo điểm trong khoảng 0-10
      predictedGrade = Math.max(0, Math.min(10, predictedGrade));

      // Xác định mức độ rủi ro và đề xuất
      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      let recommendation = '';

      if (predictedGrade < 4) {
        riskLevel = 'high';
        recommendation = 'Cần hỗ trợ khẩn cấp về học tập và tài chính';
      } else if (predictedGrade < 6.5) {
        riskLevel = 'medium';
        recommendation =
          'Cần tăng cường hỗ trợ tinh thần và giảm thời gian làm việc';
      } else {
        riskLevel = 'low';
        recommendation = 'Duy trì hiện trạng, có thể tăng thêm thử thách';
      }

      return {
        studentId: student.student_id.toString(),
        studentCode: student.student_code,
        name: student.account?.profile?.full_name || 'Unknown',
        currentAverage: Math.round(currentAverage * 100) / 100,
        predictedGrade: Math.round(predictedGrade * 100) / 100,
        riskLevel,
        recommendation,
      };
    });

    // Tính summary
    const summary = {
      lowRisk: predictions.filter((p) => p.riskLevel === 'low').length,
      mediumRisk: predictions.filter((p) => p.riskLevel === 'medium').length,
      highRisk: predictions.filter((p) => p.riskLevel === 'high').length,
    };

    return {
      predictions,
      summary,
    };
  }

  /**
   * Export template Excel
   */
  async exportTemplate(classId: string): Promise<any> {
    const students = await this.prisma.student.findMany({
      where: {
        class_id: parseInt(classId),
        status: 'active',
      },
      include: {
        account: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: {
        student_code: 'asc',
      },
    });

    // Return data structure for Excel generation on frontend
    return {
      headers: ['STT', 'Mã SV', 'Họ và tên', 'Điểm 1', 'Điểm 2', 'Điểm 3'],
      data: students.map((student, index) => ({
        stt: index + 1,
        studentCode: student.student_code,
        name: student.account?.profile?.full_name || 'Unknown',
      })),
    };
  }

  /**
   * Helper: Tính GPA
   */
  private calculateGPA(courseRecords: any[]): number {
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
}
