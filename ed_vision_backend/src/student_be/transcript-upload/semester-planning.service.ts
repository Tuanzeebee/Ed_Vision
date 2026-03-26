import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { StudentCacheService } from './student-cache.service';
import { PrismaService } from '../../prisma/prisma.service';

export interface PlannedCourse {
  course_id: number;
  course_code: string;
  course_name: string;
  credits_unit: number;
  predicted_gpa: number; // Thang 10
  predicted_gpa_4: number; // Thang 4
  prediction_confidence: number | null;
  academic_year: string | null;
  semester_number: number | null;
  term_id: number | null;
}

export interface SemesterPlanResult {
  student_id: number;
  student_code: string;
  major: string | null;
  study_time_hours: number | null; // Thời gian học tập/tuần từ survey
  total_planned_credits: number; // Tổng tín chỉ của các môn dự đoán
  planned_courses_count: number; // Số môn dự đoán
  planned_courses: PlannedCourse[]; // Danh sách môn học dự đoán
}

@Injectable()
export class SemesterPlanningService {
  private readonly logger = new Logger(SemesterPlanningService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: StudentCacheService,
  ) {}

  /**
   * Convert GPA from 10-point scale to 4-point scale
   * Sử dụng bảng chuyển đổi chuẩn
   */
  private convertGPA10To4(gpa10: number): number {
    if (gpa10 >= 9.0) return 4.0;
    if (gpa10 >= 8.5) return 3.8;
    if (gpa10 >= 8.0) return 3.5;
    if (gpa10 >= 7.5) return 3.3;
    if (gpa10 >= 7.0) return 3.0;
    if (gpa10 >= 6.5) return 2.7;
    if (gpa10 >= 6.0) return 2.3;
    if (gpa10 >= 5.5) return 2.0;
    if (gpa10 >= 5.0) return 1.7;
    if (gpa10 >= 4.0) return 1.3;
    if (gpa10 >= 3.0) return 1.0;
    return 0.0;
  }

  /**
   * Lấy Recommended Semester Plan cho sinh viên
   * Bao gồm:
   * - Các môn dự đoán từ PredictionResult
   * - Thông tin học kỳ từ AcademicTerm
   * - Thông tin môn học từ Course
   * - Thời gian học tập từ StudentSurveyFactors
   * - Tổng tín chỉ của các môn dự đoán
   *
   * @param studentId - Student ID
   * @returns Semester plan với danh sách môn học dự đoán
   */
  async getRecommendedSemesterPlan(
    studentId: number,
  ): Promise<SemesterPlanResult> {
    const key = `student:${studentId}:plan:recommended`;
    return this.cache.wrap(key, 3 * 60 * 1000, async () => {
      this.logger.log(
        `Getting recommended semester plan for student ${studentId}`,
      );

      // 1. Lấy thông tin sinh viên
      const student = await this.prisma.student.findUnique({
        where: { student_id: studentId },
        select: {
          student_id: true,
          student_code: true,
          major: true,
        },
      });

      if (!student) {
        throw new NotFoundException(`Student with ID ${studentId} not found`);
      }

      // 2. Lấy thời gian học tập từ StudentSurveyFactors
      const surveyFactors = await this.prisma.studentSurveyFactors.findUnique({
        where: { student_id: studentId },
        select: {
          study_time_hours: true,
        },
      });

      const studyTimeHours = surveyFactors?.study_time_hours || null;
      this.logger.log(
        `Student ${student.student_code} study time: ${studyTimeHours} hours/week`,
      );

      // 3. Lấy các môn dự đoán từ PredictionResult
      // Join với Course và AcademicTerm
      const predictions = await this.prisma.predictionResult.findMany({
        where: {
          student_id: studentId,
          prediction_status: 'active',
          predicted_gpa: { not: null },
        },
        include: {
          course: {
            select: {
              course_id: true,
              course_code: true,
              course_name: true,
              credits_unit: true,
            },
          },
          academicTerm: {
            select: {
              term_id: true,
              academic_year: true,
              semester_number: true,
            },
          },
        },
        orderBy: [
          { academicTerm: { academic_year: 'asc' } },
          { academicTerm: { semester_number: 'asc' } },
        ],
      });

      this.logger.log(
        `Found ${predictions.length} predicted courses for student ${studentId}`,
      );

      // 4. Xử lý dữ liệu và tính tổng tín chỉ
      let totalPlannedCredits = 0;
      const plannedCourses: PlannedCourse[] = predictions.map((pred) => {
        const credits = pred.course?.credits_unit || 0;
        totalPlannedCredits += credits;

        const predictedGpa10 = Number(pred.predicted_gpa);
        const predictedGpa4 = this.convertGPA10To4(predictedGpa10);

        return {
          course_id: pred.course_id,
          course_code: pred.course?.course_code || '',
          course_name: pred.course?.course_name || '',
          credits_unit: credits,
          predicted_gpa: predictedGpa10,
          predicted_gpa_4: predictedGpa4,
          prediction_confidence: pred.prediction_confidence,
          academic_year: pred.academicTerm?.academic_year || null,
          semester_number: pred.academicTerm?.semester_number || null,
          term_id: pred.term_id,
        };
      });

      this.logger.log(
        `Semester Plan Summary for student ${student.student_code}: ` +
          `${plannedCourses.length} courses, ` +
          `${totalPlannedCredits} total credits, ` +
          `${studyTimeHours || 'N/A'} hours/week study time`,
      );

      return {
        student_id: student.student_id,
        student_code: student.student_code,
        major: student.major,
        study_time_hours: studyTimeHours,
        total_planned_credits: totalPlannedCredits,
        planned_courses_count: plannedCourses.length,
        planned_courses: plannedCourses,
      };
    });
  }

  /**
   * Group các môn học theo học kỳ
   * Trả về object với key là "Fall 2024", "Spring 2025", etc.
   */
  async getSemesterPlanGrouped(studentId: number): Promise<{
    student_info: {
      student_id: number;
      student_code: string;
      major: string | null;
      study_time_hours: number | null;
    };
    semesters: Array<{
      season: string;
      year: string;
      term_id: number | null;
      academic_year: string | null;
      semester_number: number | null;
      total_credits: number;
      courses_count: number;
      courses: PlannedCourse[];
    }>;
  }> {
    const key = `student:${studentId}:plan:grouped`;
    return this.cache.wrap(key, 3 * 60 * 1000, async () => {
      const plan = await this.getRecommendedSemesterPlan(studentId);

      // Group courses by semester
      const semesterMap = new Map<string, PlannedCourse[]>();

      for (const course of plan.planned_courses) {
        // Tạo key dạng "Fall 2024" hoặc "Spring 2025"
        let semesterKey: string;
        if (course.semester_number === 1) {
          semesterKey = `Fall ${course.academic_year}`;
        } else if (course.semester_number === 2) {
          semesterKey = `Spring ${course.academic_year}`;
        } else if (course.semester_number === 3) {
          semesterKey = `Summer ${course.academic_year}`;
        } else {
          semesterKey = `Unknown ${course.academic_year || 'N/A'}`;
        }

        if (!semesterMap.has(semesterKey)) {
          semesterMap.set(semesterKey, []);
        }
        semesterMap.get(semesterKey)!.push(course);
      }

      // Convert map to array
      const semesters = Array.from(semesterMap.entries()).map(
        ([key, courses]) => {
          const [season, year] = key.split(' ');
          const totalCredits = courses.reduce(
            (sum, c) => sum + c.credits_unit,
            0,
          );

          return {
            season,
            year,
            term_id: courses[0]?.term_id || null,
            academic_year: courses[0]?.academic_year || null,
            semester_number: courses[0]?.semester_number || null,
            total_credits: totalCredits,
            courses_count: courses.length,
            courses,
          };
        },
      );

      return {
        student_info: {
          student_id: plan.student_id,
          student_code: plan.student_code,
          major: plan.major,
          study_time_hours: plan.study_time_hours,
        },
        semesters,
      };
    });
  }
}
