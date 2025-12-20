import { Injectable } from '@nestjs/common';
import { StudentCacheService } from './student-cache.service';
import { PrismaService } from '../../prisma/prisma.service';

export interface GPACalculationResult {
  currentGPA: number;
  totalCredits: number;
  completedCredits: number;
  totalCourses: number;
  completedCourses: number;
  failedCourses: number;
  previousSemesterGPA?: number; // GPA của học kỳ trước
  gpaChange?: number; // Thay đổi GPA so với học kỳ trước
  major?: string; // ✅ Thêm major cho student
}

export interface PredictedGPAResult {
  predictedGPA: number;
  totalCredits: number;
  completedCredits: number;
  plannedCredits: number;
  totalCourses: number;
  completedCourses: number;
  plannedCourses: number;
  plannedCoursesWithPrediction: number;
}

export interface PhysicalEducationGPAResult {
  averageGPA4: number; // Điểm trung bình thang 4 của các môn DEM đã hoàn thành
  averageGPA10: number; // Điểm trung bình thang 10 (averageGPA4 * 2.5)
  isPassing: boolean; // Pass nếu >= 5.0 thang 10, Fail nếu < 5.0
  totalCourses: number; // Tổng số môn DEM đã hoàn thành
  requiredCourses: number; // Số môn DEM yêu cầu (thường là 3)
  courses: Array<{
    course_code: string;
    course_name: string;
    score: number; // Điểm thang 10
    score4: number; // Điểm thang 4
  }>;
  isEligible: boolean; // Đủ điều kiện (>= 3 môn DEM)
  note: string; // Note về số môn đã tính (e.g., "Calculated from 2/3 required courses")
}

@Injectable()
export class GPACalculatorService {

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: StudentCacheService,
  ) {}

  /**
   * Convert GPA from 10-point scale to 4-point scale
   * Sử dụng bảng chuyển đổi chuẩn của Việt Nam
   *
   * @param gpa10 - GPA trên thang 10
   * @returns GPA trên thang 4
   */
  private convertGPA10To4(gpa10: number): number {
    // Bảng chuyển đổi chuẩn
    if (gpa10 >= 9.0) return 4.0; // A+
    if (gpa10 >= 8.5) return 3.8; // A
    if (gpa10 >= 8.0) return 3.5; // A-
    if (gpa10 >= 7.5) return 3.3; // B+
    if (gpa10 >= 7.0) return 3.0; // B
    if (gpa10 >= 6.5) return 2.7; // B-
    if (gpa10 >= 6.0) return 2.3; // C+
    if (gpa10 >= 5.5) return 2.0; // C
    if (gpa10 >= 5.0) return 1.7; // C-
    if (gpa10 >= 4.0) return 1.3; // D+
    if (gpa10 >= 3.0) return 1.0; // D
    return 0.0; // F
  }

  /**
   * Calculate current GPA for a student
   * GPA = Σ(điểm × tín chỉ) / Σ(tín chỉ)
   * CHỈ TÍNH CÁC MÔN CÓ ĐIỂM (converted_numeric_score NOT NULL)
   *
   * @param studentId - Student ID
   * @returns GPA calculation result
   */
  async calculateCurrentGPA(studentId: number): Promise<GPACalculationResult> {
    const key = `student:${studentId}:gpa:current`;
    return this.cache.wrap(key, 3 * 60 * 1000, async () => {
      this.logger.log(`Calculating GPA for student ${studentId}`);

      // Get all completed courses with scores (CHỈ LẤY MÔN CÓ ĐIỂM)
      const completedRecords = await this.prisma.studentCourseRecord.findMany({
        where: {
          student_id: studentId,
          status: 'completed',
          converted_numeric_score: { not: null }, // ✅ CHỈ LẤY MÔN CÓ ĐIỂM, BỎ QUA NULL
          course: {
            study_format: { not: 'DEM' }, // Exclude DEM courses
          },
        },
        include: {
          course: {
            select: {
              course_code: true,
              course_name: true,
              credits_unit: true,
              study_format: true,
            },
          },
        },
      });

      this.logger.log(
        `Found ${completedRecords.length} completed courses with scores for student ${studentId}`,
      );

      if (completedRecords.length === 0) {
        // Log để debug: kiểm tra xem có records nào không
        const allRecords = await this.prisma.studentCourseRecord.count({
          where: { student_id: studentId },
        });
        const withScores = await this.prisma.studentCourseRecord.count({
          where: {
            student_id: studentId,
            converted_numeric_score: { not: null },
          },
        });
        const completedCount = await this.prisma.studentCourseRecord.count({
          where: {
            student_id: studentId,
            status: 'completed',
          },
        });

        this.logger.warn(
          `No completed courses with scores found for student ${studentId}. ` +
            `Total records: ${allRecords}, ` +
            `With scores: ${withScores}, ` +
            `Completed status: ${completedCount}`,
        );

        return {
          currentGPA: 0,
          totalCredits: 0,
          completedCredits: 0,
          totalCourses: 0,
          completedCourses: 0,
          failedCourses: 0,
        };
      }

      // Calculate weighted sum and total credits (CHỈ TÍNH CÁC MÔN CÓ ĐIỂM)
      let weightedSum = 0;
      let totalCredits = 0;
      let failedCourses = 0;

      for (const record of completedRecords) {
        const score = Number(record.converted_numeric_score);
        const credits = record.course?.credits_unit || 0;

        // Skip if missing data
        if (credits === 0) {
          this.logger.warn(
            `Skipping course ${record.course?.course_code} - missing credits_unit`,
          );
          continue;
        }

        weightedSum += score * credits;
        totalCredits += credits;

        // Count failed courses (score < 1.0 in 4.0 scale)
        if (score < 1.0) {
          failedCourses++;
        }

        this.logger.debug(
          `Course: ${record.course?.course_code}, Score: ${score}, Credits: ${credits}, Running Total: ${weightedSum}/${totalCredits}`,
        );
      }

      // Calculate GPA (CHỈ TÍNH TRÊN CÁC MÔN CÓ ĐIỂM)
      const currentGPA = totalCredits > 0 ? weightedSum / totalCredits : 0;

      // Get all completed courses (with numeric scores) để tính tổng tín chỉ đã hoàn thành
      // EXCLUDE: DEM courses và môn ES 100 (không tính vào tín chỉ tốt nghiệp)
      const allCompletedRecords =
        await this.prisma.studentCourseRecord.findMany({
          where: {
            student_id: studentId,
            status: 'completed',
            course: {
              study_format: { not: 'DEM' },
              course_code: { notIn: ['ES 100', 'ES100', 'ES-100', 'ES_100'] },
            },
          },
          include: {
            course: {
              select: {
                course_code: true,
                credits_unit: true,
              },
            },
          },
        });

      this.logger.log(
        `All completed courses (excluding DEM and ES 100): ${allCompletedRecords.length} courses`,
      );

      // Log chi tiết các môn completed
      allCompletedRecords.forEach((record) => {
        this.logger.debug(
          `Completed course: ${record.course?.course_code}, Credits: ${record.course?.credits_unit}`,
        );
      });

      // Tổng tín chỉ đã hoàn thành (kể cả chưa có điểm chuyển đổi)
      const totalCompletedCredits = allCompletedRecords.reduce(
        (sum, r) => sum + (r.course?.credits_unit || 0),
        0,
      );

      this.logger.log(
        `Total Completed Credits (all completed courses): ${totalCompletedCredits}`,
      );

      // Get all courses (including planned) để tính tổng số môn
      // EXCLUDE: DEM courses, Pass/Fail courses
      const allRecords = await this.prisma.studentCourseRecord.findMany({
        where: {
          student_id: studentId,
          course: {
            study_format: { not: 'DEM' },
          },
          // ✅ Exclude Pass/Fail courses from total count
          NOT: [
            { converted_score: { contains: 'P' } },
            { converted_score: { contains: 'F' } },
          ],
        },
        include: {
          course: {
            select: {
              credits_unit: true,
            },
          },
        },
      });

      const totalCoursesCount = allRecords.length;
      const totalCreditsAll = allRecords.reduce(
        (sum, r) => sum + (r.course?.credits_unit || 0),
        0,
      );

      this.logger.log(
        `GPA Calculation for student ${studentId}: GPA=${currentGPA.toFixed(2)}, ` +
          `Credits for GPA calculation=${totalCredits}, ` +
          `Total Completed Credits=${totalCompletedCredits}/${totalCreditsAll}, ` +
          `Courses=${completedRecords.length}/${totalCoursesCount}, ` +
          `Failed=${failedCourses}`,
      );

      const auditCompleted = await this.prisma.studentCourseRecord.findMany({
        where: { student_id: studentId, status: 'completed' },
        include: {
          course: {
            select: {
              course_code: true,
              course_name: true,
              credits_unit: true,
              study_format: true,
            },
          },
        },
      });

      // ✅ Log tổng tín chỉ TRƯỚC KHI loại bỏ DEM và ES 100
       const totalCreditsBeforeExclusion = auditCompleted.reduce(
      (sum, r) => sum + (r.course?.credits_unit || 0),
      0
    );

      const excludedDetails = auditCompleted
        .filter((r) => {
          const code = (r.course?.course_code || '')
            .replace(/\s|-/g, '')
            .toUpperCase();
          return r.course?.study_format === 'DEM' || code === 'ES100';
        })
        .map((r) => {
          const reasons: string[] = [];
          const codeNorm = (r.course?.course_code || '')
            .replace(/\s|-/g, '')
            .toUpperCase();
          if (r.course?.study_format === 'DEM') reasons.push('DEM');
          if (codeNorm === 'ES100') reasons.push('ES100');
          return {
            course_code: r.course?.course_code || 'N/A',
            credits: r.course?.credits_unit || 0,
            study_format: r.course?.study_format || 'N/A',
            reasons: reasons.join(', '),
          };
        });

      if (excludedDetails.length > 0) {
        this.logger.warn(
          `Credits exclusion list for student ${studentId}: ${excludedDetails.length} courses`,
        );
        excludedDetails.forEach((d) => {
          this.logger.warn(
            `Excluded: code=${d.course_code}, credits=${d.credits}, format=${d.study_format}, reasons=${d.reasons}`,
          );
        });
      }

      // Tính GPA change so với 2 học kỳ trước (để có cumulative GPA trend)
      let previousSemesterGPA: number | undefined;
      let gpaChange: number | undefined;

      try {
        const breakdown = await this.getGPABreakdownBySemester(studentId);

        if (breakdown.length >= 2) {
          // Lấy GPA tích lũy của học kỳ trước học kỳ hiện tại
          const previousSemester = breakdown[breakdown.length - 2];
          previousSemesterGPA = previousSemester.cumulative_gpa;
          gpaChange = currentGPA - previousSemesterGPA;

          this.logger.log(
            `GPA Trend: Previous cumulative GPA=${previousSemesterGPA.toFixed(2)}, ` +
              `Change=${gpaChange >= 0 ? '+' : ''}${gpaChange.toFixed(2)}`,
          );
        }
      } catch (error) {
        this.logger.warn(`Could not calculate GPA change: ${error.message}`);
      }

      return {
        currentGPA: Number(currentGPA.toFixed(2)),
        totalCredits: totalCreditsAll,
        completedCredits: totalCompletedCredits, // ✅ Tổng tín chỉ đã hoàn thành (kể cả chưa có điểm)
        totalCourses: totalCoursesCount,
        completedCourses: allCompletedRecords.length, // ✅ Số môn đã hoàn thành
        failedCourses,
        previousSemesterGPA: previousSemesterGPA
          ? Number(previousSemesterGPA.toFixed(2))
          : undefined,
        gpaChange: gpaChange ? Number(gpaChange.toFixed(2)) : undefined,
      };
    });
  }

  /**
   * Calculate PROJECTED GPA including planned courses with predictions
   * This includes both completed courses AND ALL planned courses
   * Used for AcademicPlanningDashboard to show future GPA projection
   *
   * @param studentId - Student ID
   * @returns Projected GPA calculation result
   */
  async calculateProjectedGPA(
    studentId: number,
  ): Promise<GPACalculationResult> {
    const key = `student:${studentId}:gpa:projected`;
    return this.cache.wrap(key, 3 * 60 * 1000, async () => {
      this.logger.log(
        `Calculating PROJECTED GPA (completed + planned) for student ${studentId}`,
      );

      // Get student info (including major)
      const student = await this.prisma.student.findUnique({
        where: { student_id: studentId },
        select: { major: true },
      });

      const completedCourses = await this.prisma.studentCourseRecord.findMany({
        where: {
          student_id: studentId,
          status: 'completed',
          converted_numeric_score: { not: null },
          course: {
            study_format: { not: 'DEM' },
            course_code: { notIn: ['ES 100', 'ES100', 'ES-100', 'ES_100'] },
          },
        },
        include: {
          course: {
            select: {
              course_code: true,
              course_name: true,
              credits_unit: true,
            },
          },
        },
      });

      const plannedCourses = await this.prisma.studentCourseRecord.findMany({
        where: {
          student_id: studentId,
          status: 'planned',
          course: {
            study_format: { not: 'DEM' },
            course_code: { notIn: ['ES 100', 'ES100', 'ES-100', 'ES_100'] },
          },
        },
        include: {
          course: {
            select: {
              course_code: true,
              course_name: true,
              credits_unit: true,
              predictionResults: {
                where: {
                  student_id: studentId,
                  prediction_status: 'active',
                },
                select: {
                  predicted_gpa: true,
                },
                take: 1,
              },
            },
          },
        },
      });

      this.logger.log(
        `Found ${completedCourses.length} completed courses and ${plannedCourses.length} planned courses`,
      );

      // Calculate total credits (completed + planned)
      // ✅ Only count completed courses with score >= 1.7 and planned courses with predicted_gpa >= 1.7 (>= 5.0/10)
      const completedCredits = completedCourses.reduce(
        (sum, r) => sum + (r.course?.credits_unit || 0),
        0,
      );

      const plannedCredits = plannedCourses.reduce(
        (sum, r) => sum + (r.course?.credits_unit || 0),
        0,
      );

      const totalCredits = completedCredits + plannedCredits;
      const totalCourses = completedCourses.length + plannedCourses.length;

      this.logger.log(
        `Credits: Completed=${completedCredits}, Planned=${plannedCredits}, Total=${totalCredits}`,
      );

      // Calculate weighted GPA (completed + planned with predictions)
      let weightedSum = 0;
      let creditsWithScores = 0;
      let failedCourses = 0;

      // Add completed courses to GPA calculation
      for (const record of completedCourses) {
        const credits = record.course?.credits_unit || 0;
        if (credits === 0) continue;

        const score = Number(record.converted_numeric_score);
        weightedSum += score * credits;
        creditsWithScores += credits;

        if (score < 1.0) {
          failedCourses++;
        }

        this.logger.debug(
          `Completed: ${record.course?.course_code}, Score: ${score.toFixed(2)}, Credits: ${credits}`,
        );
      }

      // Add planned courses with predictions to GPA calculation
      // ✅ Only count courses with predicted_gpa >= 1.7 (passing grade, equivalent to >= 5.0/10)
      for (const record of plannedCourses) {
        const credits = record.course?.credits_unit || 0;
        if (credits === 0) continue;

        const prediction = record.course?.predictionResults?.[0];
        if (prediction && prediction.predicted_gpa) {
          const predictedGpa10 = Number(prediction.predicted_gpa);
          if (predictedGpa10 >= 4) {
            const predictedGpa4 = this.convertGPA10To4(predictedGpa10);
            weightedSum += predictedGpa4 * credits;
            creditsWithScores += credits;

            this.logger.debug(
              `Planned: ${record.course?.course_code}, Predicted GPA (10): ${predictedGpa10.toFixed(2)}, Credits: ${credits} ✓ Passing (>= 4.0/10)`,
            );
          } else {
            this.logger.debug(
              `Planned: ${record.course?.course_code}, Predicted GPA (10): ${predictedGpa10.toFixed(2)} ✗ Below passing grade (< 4.0/10), not counted`,
            );
          }
        } else {
          this.logger.debug(
            `Planned: ${record.course?.course_code} - No prediction, skipped from GPA calculation`,
          );
        }
      }

      const projectedGPA =
        creditsWithScores > 0 ? weightedSum / creditsWithScores : 0;

      this.logger.log(
        `Projected GPA for student ${studentId}: GPA=${projectedGPA.toFixed(2)}, ` +
          `Total Credits=${totalCredits} (Completed: ${completedCredits}, Planned: ${plannedCredits}), ` +
          `Total Courses=${totalCourses}`,
      );

      return {
        currentGPA: Number(projectedGPA.toFixed(2)),
        totalCredits: totalCredits, // ✅ Tổng tín chỉ (completed + planned)
        completedCredits: completedCredits, // ✅ Tín chỉ đã hoàn thành
        totalCourses: totalCourses, // ✅ Tổng số môn
        completedCourses: completedCourses.length, // ✅ Số môn đã hoàn thành
        failedCourses,
        major: student?.major || 'Unknown Major', // ✅ Thêm major
      };
    });
  }

  /**
   * Calculate GPA for a specific set of courses
   * Useful for calculating semester GPA or GPA for specific courses
   */
  async calculateGPAForCourses(courseRecordIds: number[]): Promise<number> {
    const records = await this.prisma.studentCourseRecord.findMany({
      where: {
        record_id: { in: courseRecordIds },
        status: 'completed',
        converted_numeric_score: { not: null },
      },
      include: {
        course: {
          select: {
            credits_unit: true,
          },
        },
      },
    });

    let weightedSum = 0;
    let totalCredits = 0;

    for (const record of records) {
      const score = Number(record.converted_numeric_score);
      const credits = record.course?.credits_unit || 0;

      if (credits > 0) {
        weightedSum += score * credits;
        totalCredits += credits;
      }
    }

    return totalCredits > 0
      ? Number((weightedSum / totalCredits).toFixed(2))
      : 0;
  }

  /**
   * Calculate semester GPA
   * CHỈ TÍNH CÁC MÔN CÓ ĐIỂM (converted_numeric_score NOT NULL)
   */
  async calculateSemesterGPA(
    studentId: number,
    termId: number,
  ): Promise<number> {
    const records = await this.prisma.studentCourseRecord.findMany({
      where: {
        student_id: studentId,
        term_id: termId,
        status: 'completed',
        converted_numeric_score: { not: null }, // ✅ CHỈ LẤY MÔN CÓ ĐIỂM
        course: {
          study_format: { not: 'DEM' },
        },
      },
      include: {
        course: {
          select: {
            credits_unit: true,
          },
        },
      },
    });

    let weightedSum = 0;
    let totalCredits = 0;

    for (const record of records) {
      const score = Number(record.converted_numeric_score);
      const credits = record.course?.credits_unit || 0;

      if (credits > 0) {
        weightedSum += score * credits;
        totalCredits += credits;
      }
    }

    return totalCredits > 0
      ? Number((weightedSum / totalCredits).toFixed(2))
      : 0;
  }

  /**
   * Get detailed GPA breakdown by semester
   * CHỈ TÍNH CÁC MÔN CÓ ĐIỂM (converted_numeric_score NOT NULL)
   */
  async getGPABreakdownBySemester(studentId: number) {
    const records = await this.prisma.studentCourseRecord.findMany({
      where: {
        student_id: studentId,
        status: 'completed',
        converted_numeric_score: { not: null }, // ✅ CHỈ LẤY MÔN CÓ ĐIỂM
        course: {
          study_format: { not: 'DEM' },
        },
      },
      include: {
        course: {
          select: {
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

    // Group by semester
    const semesterMap = new Map<number, typeof records>();
    for (const record of records) {
      if (record.term_id) {
        if (!semesterMap.has(record.term_id)) {
          semesterMap.set(record.term_id, []);
        }
        semesterMap.get(record.term_id)!.push(record);
      }
    }

    // Calculate GPA for each semester (CHỈ TÍNH CÁC MÔN CÓ ĐIỂM)
    const breakdown: Array<{
      term_id: number;
      academic_year: string | undefined;
      semester_number: number | undefined;
      semester_gpa: number;
      cumulative_gpa: number;
      credits: number;
      courses_count: number;
    }> = [];
    let cumulativeWeightedSum = 0;
    let cumulativeCredits = 0;

    for (const [termId, termRecords] of semesterMap) {
      let semesterWeightedSum = 0;
      let semesterCredits = 0;

      for (const record of termRecords) {
        const score = Number(record.converted_numeric_score);
        const credits = record.course?.credits_unit || 0;

        if (credits > 0) {
          semesterWeightedSum += score * credits;
          semesterCredits += credits;
        }
      }

      cumulativeWeightedSum += semesterWeightedSum;
      cumulativeCredits += semesterCredits;

      const semesterGPA =
        semesterCredits > 0
          ? Number((semesterWeightedSum / semesterCredits).toFixed(2))
          : 0;

      const cumulativeGPA =
        cumulativeCredits > 0
          ? Number((cumulativeWeightedSum / cumulativeCredits).toFixed(2))
          : 0;

      breakdown.push({
        term_id: termId,
        academic_year: termRecords[0].academicTerm?.academic_year,
        semester_number: termRecords[0].academicTerm?.semester_number,
        semester_gpa: semesterGPA,
        cumulative_gpa: cumulativeGPA,
        credits: semesterCredits,
        courses_count: termRecords.length,
      });
    }

    return breakdown;
  }

  /**
   * Calculate PREDICTED GPA for a student
   * Bao gồm:
   * - Các môn đã hoàn thành (completed): dùng điểm thật từ converted_numeric_score
   * - Các môn đang plan (planned): dùng điểm dự đoán từ PredictionResult.predicted_gpa (đổi sang thang 4)
   *
   * Công thức:
   * GPA dự đoán = [Σ(điểm thật × tín chỉ) + Σ(điểm dự đoán × tín chỉ)] / Σ(tổng tín chỉ)
   *
   * Chuyển đổi điểm:
   * - predicted_gpa trong DB là thang 10 (0-10)
   * - Cần đổi sang thang 4: gpa_4 = (predicted_gpa / 10) * 4
   *
   * @param studentId - Student ID
   * @returns Predicted GPA calculation result
   */
  async calculatePredictedGPA(studentId: number): Promise<PredictedGPAResult> {
    const key = `student:${studentId}:gpa:predicted`;
    return this.cache.wrap(key, 3 * 60 * 1000, async () => {
      this.logger.log(`Calculating PREDICTED GPA for student ${studentId}`);

      // 1. Lấy các môn đã hoàn thành (completed) - dùng điểm thật
      const completedRecords = await this.prisma.studentCourseRecord.findMany({
        where: {
          student_id: studentId,
          status: 'completed',
          converted_numeric_score: { not: null },
          course: {
            study_format: { not: 'DEM' },
          },
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
        },
      });

      // 2. Lấy các môn đang plan (planned) - cần dùng điểm dự đoán
      const plannedRecords = await this.prisma.studentCourseRecord.findMany({
        where: {
          student_id: studentId,
          status: 'planned',
          course: {
            study_format: { not: 'DEM' },
          },
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
        },
      });

      this.logger.log(
        `Found ${completedRecords.length} completed courses and ${plannedRecords.length} planned courses`,
      );

      // 3. Tính điểm weighted sum cho các môn đã hoàn thành
      let completedWeightedSum = 0;
      let completedCredits = 0;

      for (const record of completedRecords) {
        const score = Number(record.converted_numeric_score);
        const credits = record.course?.credits_unit || 0;

        if (credits > 0) {
          completedWeightedSum += score * credits;
          completedCredits += credits;

          this.logger.debug(
            `Completed: ${record.course?.course_code}, Score: ${score}, Credits: ${credits}`,
          );
        }
      }

      // 4. Lấy điểm dự đoán cho các môn planned từ bảng PredictionResult
      const courseIds = plannedRecords
        .map((r) => r.course_id)
        .filter(Boolean) as number[];

      const predictions = await this.prisma.predictionResult.findMany({
        where: {
          student_id: studentId,
          course_id: { in: courseIds },
          prediction_status: 'active',
          predicted_gpa: { not: null },
        },
        select: {
          course_id: true,
          predicted_gpa: true,
          model_type: true,
          prediction_confidence: true,
        },
      });

      // Tạo map để tra cứu nhanh predicted_gpa theo course_id
      const predictionMap = new Map<number, (typeof predictions)[0]>();
      for (const pred of predictions) {
        // Ưu tiên model_type 'student', nếu không có thì dùng 'teacher'
        if (
          !predictionMap.has(pred.course_id) ||
          pred.model_type === 'student'
        ) {
          predictionMap.set(pred.course_id, pred);
        }
      }

      this.logger.log(
        `Found ${predictions.length} predictions for planned courses`,
      );

      // 5. Tính điểm weighted sum cho các môn planned (có prediction)
      let plannedWeightedSum = 0;
      let plannedCredits = 0;
      let plannedCoursesWithPrediction = 0;

      for (const record of plannedRecords) {
        const courseId = record.course_id;
        const credits = record.course?.credits_unit || 0;

        if (credits === 0 || !courseId) continue;

        const prediction = predictionMap.get(courseId);

        if (prediction && prediction.predicted_gpa) {
          // Đổi từ thang 10 sang thang 4 bằng bảng chuyển đổi chuẩn
          const predictedGpa10 = Number(prediction.predicted_gpa);
          const predictedGpa4 = this.convertGPA10To4(predictedGpa10);

          plannedWeightedSum += predictedGpa4 * credits;
          plannedCredits += credits;
          plannedCoursesWithPrediction++;

          this.logger.debug(
            `Planned: ${record.course?.course_code}, ` +
              `Predicted GPA (10): ${predictedGpa10}, ` +
              `Predicted GPA (4): ${predictedGpa4.toFixed(2)}, ` +
              `Credits: ${credits}, ` +
              `Model: ${prediction.model_type}`,
          );
        } else {
          this.logger.warn(
            `No prediction found for planned course: ${record.course?.course_code} (ID: ${courseId})`,
          );
        }
      }

      // 6. Tính GPA dự đoán tổng hợp
      const totalWeightedSum = completedWeightedSum + plannedWeightedSum;
      const totalCredits = completedCredits + plannedCredits;
      const predictedGPA =
        totalCredits > 0 ? totalWeightedSum / totalCredits : 0;

      this.logger.log(
        `PREDICTED GPA Calculation for student ${studentId}: ` +
          `Predicted GPA=${predictedGPA.toFixed(2)}, ` +
          `Total Credits=${totalCredits} (Completed: ${completedCredits}, Planned: ${plannedCredits}), ` +
          `Courses=${completedRecords.length + plannedRecords.length} ` +
          `(Completed: ${completedRecords.length}, Planned: ${plannedRecords.length}, ` +
          `With Prediction: ${plannedCoursesWithPrediction})`,
      );

      return {
        predictedGPA: Number(predictedGPA.toFixed(2)),
        totalCredits: totalCredits,
        completedCredits: completedCredits,
        plannedCredits: plannedCredits,
        totalCourses: completedRecords.length + plannedRecords.length,
        completedCourses: completedRecords.length,
        plannedCourses: plannedRecords.length,
        plannedCoursesWithPrediction: plannedCoursesWithPrediction,
      };
    });
  }

  /**
   * Calculate Physical Education (DEM) average GPA
   * Tính điểm trung bình 3 môn Giáo dục thể chất (study_format = 'DEM')
   * Chuyển điểm từ thang 10 sang thang 4 rồi tính trung bình
   *
   * @param studentId - ID của sinh viên
   * @returns Physical Education GPA result
   */
  async calculatePhysicalEducationGPA(
    studentId: number,
  ): Promise<PhysicalEducationGPAResult> {
    const key = `student:${studentId}:gpa:dem`;
    return this.cache.wrap(key, 5 * 60 * 1000, async () => {
      this.logger.log(
        `Calculating Physical Education GPA for student ${studentId}`,
      );

      // Lấy tất cả các môn DEM đã hoàn thành
      const demCourses = await this.prisma.studentCourseRecord.findMany({
        where: {
          student_id: studentId,
          status: 'completed',
          course: {
            study_format: 'DEM',
            course_code: { notIn: ['ES 100', 'ES100', 'ES-100', 'ES_100'] },
          },
        },
        include: {
          course: {
            select: {
              course_code: true,
              course_name: true,
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
        `Found ${demCourses.length} DEM courses for student ${studentId}`,
      );

      const REQUIRED_DEM_COURSES = 3; // Số môn DEM yêu cầu để tốt nghiệp

      // Nếu không có môn DEM nào
      if (demCourses.length === 0) {
        return {
          averageGPA4: 0,
          averageGPA10: 0,
          isPassing: false,
          totalCourses: 0,
          requiredCourses: REQUIRED_DEM_COURSES,
          courses: [],
          isEligible: false,
          note: `No Physical Education courses completed yet. Required: ${REQUIRED_DEM_COURSES} courses`,
        };
      }

      // Lấy 3 môn DEM gần nhất có raw_score để tính
      const demRawRecords = demCourses.filter(
        (r) => r.raw_score !== null && Number(r.raw_score) > 0,
      );
      const consideredRecords = demRawRecords.slice(-REQUIRED_DEM_COURSES); // lấy 3 môn mới nhất theo học kỳ
      const demWithRaw = consideredRecords.map((record) => {
        const raw10 = Number(record.raw_score);
        const score4 = (raw10 / 10) * 4; // Chuyển tuyến tính sang thang 4
        this.logger.log(
          `DEM Course: ${record.course?.course_code} - raw_score=${record.raw_score}, score4_linear=${score4.toFixed(2)}`,
        );
        return {
          course_code: record.course?.course_code || 'N/A',
          course_name: record.course?.course_name || 'N/A',
          score: raw10,
          score4,
        };
      });

      if (demRawRecords.length === 0) {
        this.logger.warn(
          `Student ${studentId} has ${demCourses.length} DEM courses but none have raw scores yet`,
        );
        return {
          averageGPA4: 0,
          averageGPA10: 0,
          isPassing: false,
          totalCourses: 0,
          requiredCourses: REQUIRED_DEM_COURSES,
          courses: [],
          isEligible: false,
          note: `${demCourses.length} Physical Education courses enrolled but no raw scores available yet. Required: ${REQUIRED_DEM_COURSES} courses`,
        };
      }

      // Chỉ tính 3 môn DEM theo yêu cầu (nếu có hơn 3 thì lấy 3 môn đầu theo thứ tự)
      const consideredCourses = demWithRaw;

      // Tính trung bình thang 10 chia cho 3 (yêu cầu: /3)
      const sum10 = consideredCourses.reduce((sum, c) => sum + c.score, 0);
      const averageGPA10 = sum10 / REQUIRED_DEM_COURSES;

      // Trung bình thang 4 (tuyến tính)
      const averageGPA4 = averageGPA10 / 2.5;

      // Kiểm tra Pass/Fail: >= 5.0 thang 10 = Pass, < 5.0 = Fail
      const isPassing = averageGPA10 >= 5.0;

      // Kiểm tra điều kiện đủ 3 môn DEM (có điểm)
      const isEligible = demWithRaw.length >= REQUIRED_DEM_COURSES;

      // Tạo note về số môn đã tính
      const note = isEligible
        ? `Calculated from ${consideredCourses.length} Physical Education courses (Eligible for graduation)`
        : `Calculated from ${consideredCourses.length}/${REQUIRED_DEM_COURSES} required courses (${REQUIRED_DEM_COURSES - consideredCourses.length} more needed)`;

      this.logger.log(
        `Physical Education GPA for student ${studentId}: ` +
          `Average GPA (4-scale linear)=${averageGPA4.toFixed(2)}, (10-scale raw)=${averageGPA10.toFixed(2)}, ` +
          `Pass status=${isPassing ? 'PASS' : 'FAIL'}, ` +
          `Considered DEM courses=${consideredCourses.length}/${REQUIRED_DEM_COURSES} (${demCourses.length} enrolled), ` +
          `Eligible for graduation=${isEligible}`,
      );

      return {
        averageGPA4: Number(averageGPA4.toFixed(2)),
        averageGPA10: Number(averageGPA10.toFixed(2)),
        isPassing: isPassing,
        totalCourses: consideredCourses.length, // Số môn được tính
        requiredCourses: REQUIRED_DEM_COURSES,
        courses: consideredCourses, // Trả về 3 môn đã tính
        isEligible: isEligible,
        note: note,
      };
    });
  }
}
