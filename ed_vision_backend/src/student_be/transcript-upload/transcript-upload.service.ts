import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadTranscriptDto, TranscriptRecordDto } from './dto/upload-transcript.dto';
import { TranscriptUploadResponse, StudentTranscriptResponse } from './models/transcript-upload-response.type';

@Injectable()
export class TranscriptUploadService {
  constructor(private prisma: PrismaService) {}

  /**
   * Upload và lưu transcript records vào database
   */
  async uploadTranscript(uploadDto: UploadTranscriptDto): Promise<TranscriptUploadResponse> {
    const { records } = uploadDto;
    let successfulRecords = 0;
    let failedRecords = 0;
    const errors: Array<{ row: number; error: string }> = [];

    // Validate students exist - use student_code instead of student_id
    const studentCodes = [...new Set(records.map(r => r.student_code))];
    const students = await this.prisma.student.findMany({
      where: { student_code: { in: studentCodes } },
      select: { student_id: true, student_code: true },
    });

    const studentCodeToIdMap = new Map(
      students.map(s => [s.student_code, s.student_id])
    );

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      try {
        // Validate required fields
        if (!record.student_code || !record.course_code || !record.year || !record.semester_number) {
          errors.push({
            row: i + 2,
            error: 'Missing required fields (student_code, course_code, year, or semester_number)',
          });
          failedRecords++;
          continue;
        }

        // Validate semester_number is valid
        if (isNaN(record.semester_number) || record.semester_number < 1 || record.semester_number > 3) {
          errors.push({
            row: i + 2,
            error: 'Invalid semester_number. Must be 1, 2, or 3',
          });
          failedRecords++;
          continue;
        }

        // Get student_id from student_code
        const studentId = studentCodeToIdMap.get(record.student_code);
        if (!studentId) {
          throw new Error(`Student with code ${record.student_code} not found`);
        }

        // Find or create academic term
        const academicYear = this.constructAcademicYear(record.year, record.semester_number);
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

        // Find or create course
        let course = await this.prisma.course.findUnique({
          where: { course_code: record.course_code },
        });

        if (!course) {
          course = await this.prisma.course.create({
            data: {
              course_code: record.course_code,
              course_name: record.course_name,
              credits_unit: record.credits_unit,
              study_format: record.study_format || 'offline',
            },
          });
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
            status: record.raw_score !== undefined && record.raw_score !== null ? 'completed' : 'planned',
            raw_score: record.raw_score,
            converted_score: record.converted_score,
            converted_numeric_score: record.converted_numeric_score,
          },
          create: {
            student_id: studentId,
            course_id: course.course_id,
            term_id: academicTerm.term_id,
            status: record.raw_score !== undefined && record.raw_score !== null ? 'completed' : 'planned',
            raw_score: record.raw_score,
            converted_score: record.converted_score,
            converted_numeric_score: record.converted_numeric_score,
          },
        });

        successfulRecords++;
      } catch (error) {
        failedRecords++;
        errors.push({
          row: i + 1,
          error: error.message || 'Unknown error occurred',
        });
      }
    }

    return {
      success: failedRecords === 0,
      message: failedRecords === 0 
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
   * Lấy transcript của student theo student_id
   */
  async getStudentTranscript(studentId: number): Promise<StudentTranscriptResponse> {
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

    const records = student.courseRecords.map(record => ({
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

    // Calculate credits
    const totalCredits = records.reduce((sum, r) => sum + r.credits_unit, 0);
    const completedCredits = records
      .filter(r => r.status === 'completed' && r.raw_score !== undefined)
      .reduce((sum, r) => sum + r.credits_unit, 0);

    // Calculate GPA (simple average of converted_numeric_score)
    const completedRecordsWithScore = student.courseRecords.filter(
      r => r.status === 'completed' && r.converted_numeric_score !== null,
    );
    const gpa = completedRecordsWithScore.length > 0
      ? completedRecordsWithScore.reduce(
          (sum, r) => sum + Number(r.converted_numeric_score),
          0,
        ) / completedRecordsWithScore.length
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
      gpa: gpa ? Number(gpa.toFixed(2)) : undefined,
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
