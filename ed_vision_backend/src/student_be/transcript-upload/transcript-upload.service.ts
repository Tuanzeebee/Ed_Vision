import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  UploadTranscriptDto,
  TranscriptRecordDto,
} from './dto/upload-transcript.dto';
import {
  TranscriptUploadResponse,
  StudentTranscriptResponse,
} from './models/transcript-upload-response.type';
import { TranscriptPredictionService, StudentCacheService } from './logic';

@Injectable()
export class TranscriptUploadService {
  private readonly logger = new Logger(TranscriptUploadService.name);

  constructor(
    private prisma: PrismaService,
    private predictionService: TranscriptPredictionService,
    private cache: StudentCacheService,
  ) {}

  /**
   * Upload và lưu transcript records vào database
   */
  async uploadTranscript(
    uploadDto: UploadTranscriptDto,
  ): Promise<TranscriptUploadResponse> {
    const { records } = uploadDto;
    let successfulRecords = 0;
    let failedRecords = 0;
    const errors: Array<{ row: number; error: string }> = [];
    const touchedStudents = new Set<number>();

    // Validate students exist - use student_code instead of student_id
    const studentCodes = [...new Set(records.map((r) => r.student_code))];
    const students = await this.prisma.student.findMany({
      where: { student_code: { in: studentCodes } },
      select: { student_id: true, student_code: true },
    });

    const studentCodeToIdMap = new Map(
      students.map((s) => [s.student_code, s.student_id]),
    );

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      try {
        // Validate required fields
        if (
          !record.student_code ||
          !record.course_code ||
          !record.year ||
          !record.semester_number
        ) {
          errors.push({
            row: i + 2,
            error:
              'Missing required fields (student_code, course_code, year, or semester_number)',
          });
          failedRecords++;
          continue;
        }

        // Validate semester_number is valid
        if (
          isNaN(record.semester_number) ||
          record.semester_number < 1 ||
          record.semester_number > 3
        ) {
          errors.push({
            row: i + 2,
            error: 'Invalid semester_number. Must be 1, 2, or 3',
          });
          failedRecords++;
          continue;
        }

        const studentId = studentCodeToIdMap.get(record.student_code);
        if (!studentId) {
          throw new Error(`Student with code ${record.student_code} not found`);
        }

        // Find or create academic term
        const academicYear = this.constructAcademicYear(
          record.year,
          record.semester_number,
        );
        let academicTerm = await this.prisma.academicTerm.findFirst({
          where: {
            academic_year: academicYear,
            semester_number: record.semester_number,
          },
        });

        if (!academicTerm) {
          academicTerm = await this.prisma.academicTerm.create({
            data: {
              academic_year: academicYear,
              semester_number: record.semester_number,
              is_summer: record.semester_number === 3,
              status: 'active',
            },
          });
        }

        // Find existing course only (do NOT auto-create)
        // NOTE: Schema uses unique constraint on [course_code, study_format]
        // Try find by composite (course_code + study_format), then fallback to course_code only
        const studyFormatRaw = record.study_format || 'offline';
        const studyFormat = String(studyFormatRaw).trim();

        let course = await this.prisma.course.findUnique({
          where: {
            course_code_study_format: {
              course_code: record.course_code,
              study_format: studyFormat,
            },
          },
        });

        if (!course) {
          course = await this.prisma.course.findFirst({
            where: {
              course_code: record.course_code,
              credits_unit: record.credits_unit,
            },
          });
        }

        if (!course) {
          course = await this.prisma.course.findFirst({
            where: { course_code: record.course_code },
          });
        }

        if (!course) {
          throw new BadRequestException(
            `Course not found for code '${record.course_code}'${studyFormat ? ` with format '${studyFormat}'` : ''}. Please ensure the course exists in the catalog.`,
          );
        }

        // Create or update student course record
        await this.prisma.studentCourseRecord.upsert({
          where: {
            student_id_course_id: {
              student_id: studentId,
              course_id: course.course_id,
            },
          },
          update: {
            term_id: academicTerm.term_id,
            status:
              record.raw_score !== undefined && record.raw_score !== null
                ? 'completed'
                : 'planned',
            raw_score: record.raw_score,
            converted_score: record.converted_score,
            converted_numeric_score: record.converted_numeric_score,
          },
          create: {
            student_id: studentId,
            course_id: course.course_id,
            term_id: academicTerm.term_id,
            status:
              record.raw_score !== undefined && record.raw_score !== null
                ? 'completed'
                : 'planned',
            raw_score: record.raw_score,
            converted_score: record.converted_score,
            converted_numeric_score: record.converted_numeric_score,
          },
        });

        successfulRecords++;
        touchedStudents.add(studentId);
      } catch (error) {
        failedRecords++;
        errors.push({
          row: i + 1,
          error: error.message || 'Unknown error occurred',
        });
      }
    }

    if (touchedStudents.size > 0) {
      for (const id of touchedStudents) {
        this.cache.clearByStudent(id);
      }
    }

    // Trigger prediction if upload was successful
    if (successfulRecords > 0 && studentCodes.length > 0) {
      // Run prediction asynchronously (don't block response)
      this.triggerPredictionsForStudents(studentCodes).catch((err) => {
        this.logger.error('Failed to trigger predictions:', err);
      });
    }

    return {
      success: failedRecords === 0,
      message:
        failedRecords === 0
          ? 'All records uploaded successfully'
          : `Uploaded ${successfulRecords} records, ${failedRecords} failed`,
      data: {
        totalRecords: records.length,
        successfulRecords,
        failedRecords,
        errors: errors.length > 0 ? errors : undefined,
      },
    };
  }

  /**
   * Trigger predictions for all uploaded students
   */
  private async triggerPredictionsForStudents(
    studentCodes: string[],
  ): Promise<void> {
    this.logger.log(
      `Triggering predictions for ${studentCodes.length} students...`,
    );

    for (const studentCode of studentCodes) {
      try {
        await this.predictionService.triggerPredictionAfterUpload(studentCode);
      } catch (error) {
        this.logger.error(
          `Failed to predict for student ${studentCode}:`,
          error.message,
        );
        // Continue with other students even if one fails
      }
    }

    this.logger.log('Prediction trigger completed for all students');
  }

  /**
   * Lấy transcript của student theo student_id
   * Sử dụng JOIN để lấy thông tin từ Account và Profile
   * CHỈ TÍNH GPA VỚI CÁC MÔN CÓ ĐIỂM (converted_numeric_score NOT NULL)
   */
  async getStudentTranscript(
    studentId: number,
  ): Promise<StudentTranscriptResponse> {
    // JOIN trực tiếp: Student -> Account -> Profile
    const student = await this.prisma.student.findUnique({
      where: { student_id: studentId },
      include: {
        account: {
          include: {
            profile: true,
          },
        },
        courseRecords: {
          include: {
            course: true,
            academicTerm: true,
          },
          orderBy: [
            { academicTerm: { academic_year: 'asc' } },
            { academicTerm: { semester_number: 'asc' } },
          ],
        },
      },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${studentId} not found`);
    }

    const records = student.courseRecords.map((record) => ({
      record_id: record.record_id,
      student_id: record.student_id!,
      course_code: record.course?.course_code || '',
      course_name: record.course?.course_name || '',
      academic_year: record.academicTerm?.academic_year || '',
      semester_number: record.academicTerm?.semester_number || 0,
      credits_unit: record.course?.credits_unit || 0,
      raw_score: record.raw_score ? Number(record.raw_score) : undefined,
      converted_score: record.converted_score || undefined,
      status: record.status || 'planned',
    }));

    const totalCredits = records.reduce((sum, r) => sum + r.credits_unit, 0);
    const normalizeCode = (code: string | undefined) =>
      (code || '').replace(/\s|[-_]/g, '').toUpperCase();
    const completedCredits = student.courseRecords
      .filter((r) => r.status === 'completed')
      .filter((r) => r.course?.study_format !== 'DEM')
      .filter((r) => normalizeCode(r.course?.course_code) !== 'ES100')
      .reduce((sum, r) => sum + (r.course?.credits_unit || 0), 0);

    // Calculate GPA - CHỈ TÍNH CÁC MÔN CÓ ĐIỂM (converted_numeric_score NOT NULL)
    const completedRecordsWithScore = student.courseRecords.filter(
      (r) => r.status === 'completed' && r.converted_numeric_score !== null,
    );

    let weightedSum = 0;
    let totalCreditsForGPA = 0;

    for (const record of completedRecordsWithScore) {
      const score = Number(record.converted_numeric_score);
      const credits = record.course?.credits_unit || 0;

      if (credits > 0) {
        weightedSum += score * credits;
        totalCreditsForGPA += credits;
      }
    }

    const gpa =
      totalCreditsForGPA > 0
        ? Number((weightedSum / totalCreditsForGPA).toFixed(2))
        : undefined;

    return {
      studentId: student.student_id,
      studentCode: student.student_code,
      fullName: student.account.profile?.full_name || '',
      major: student.major || undefined,
      cohortYear: student.cohort_year || undefined,
      records,
      totalCredits,
      completedCredits,
      gpa,
    };
  }

  /**
   * Xóa tất cả transcript records của student
   */
  async deleteStudentTranscript(studentId: number): Promise<void> {
    const student = await this.prisma.student.findUnique({
      where: { student_id: studentId },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${studentId} not found`);
    }

    await this.prisma.studentCourseRecord.deleteMany({
      where: { student_id: studentId },
    });
  }

  /**
   * Helper function để tạo academic year string
   * Ví dụ: year=2023, semester=1 => "2023-2024"
   *        year=2023, semester=2 => "2023-2024"
   */
  private constructAcademicYear(year: number, semester: number): string {
    if (semester === 1) {
      return `${year}-${year + 1}`;
    } else {
      // Semester 2 hoặc 3 (summer) thường thuộc năm học bắt đầu từ năm trước
      return `${year - 1}-${year}`;
    }
  }
}
