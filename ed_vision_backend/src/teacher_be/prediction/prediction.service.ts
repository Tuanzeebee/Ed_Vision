import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import * as XLSX from 'xlsx';
import { Readable } from 'stream';
import { StudentGrade, StudentRecord } from './schemas/student-grade.schema';
import {
  UploadGradesDto,
  UploadGradesResponseDto,
} from './dto/upload-grades.dto';
import {
  UpdateBehaviorDto,
  BulkUpdateBehaviorDto,
} from './dto/update-behavior.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { GradeStructure } from '../../mongodb/schemas/grade-structure.schema';


type ServiceResponse<T = any> = Promise<{
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}>;
@Injectable()
export class PredictionService {
  constructor(
    @Inject('STUDENT_GRADE_MODEL')
    private studentGradeModel: Model<StudentGrade>,
    @Inject('GRADE_STRUCTURE_MODEL')
    private gradeStructureModel: Model<GradeStructure>,
    private readonly prismaService: PrismaService,
  ) {}

  /**
   * Get instructor_id from account_id
   */
  private async getInstructorId(accountId: number): Promise<string> {
    const instructor = await this.prismaService.instructor.findUnique({
      where: { account_id: accountId },
      select: { instructor_id: true },
    });

    if (!instructor) {
      throw new NotFoundException(
        'Instructor profile not found for this account',
      );
    }

    return instructor.instructor_id.toString();
  }

  /**
   * Fetch behavior data from StudentSurveyFactors table
   * Returns a map of student_code -> behavior data
   * If no data found, returns default medium values
   */
  private async fetchBehaviorDataForStudents(studentCodes: string[]): Promise<
    Map<
      string,
      {
        weekly_study_hours: number;
        part_time_hours: number;
        financial_support: number;
        emotional_support: number;
        has_survey_data: boolean; // true nếu có dữ liệu thực từ khảo sát, false nếu dùng default
        full_name?: string; // Họ tên từ Profile (chỉ có khi has_survey_data = true)
      }
    >
  > {
    try {
      // Fetch students with their survey factors, account, and profile
      const studentsWithSurveyFactors =
        await this.prismaService.student.findMany({
          where: {
            student_code: {
              in: studentCodes,
            },
          },
          select: {
            student_code: true,
            surveyFactors: {
              select: {
                study_time_hours: true,
                work_time_hours: true,
                financial_support_score: true,
                mental_health_score: true,
              },
            },
            account: {
              select: {
                profile: {
                  select: {
                    full_name: true,
                  },
                },
              },
            },
          },
        });

      // Create a map of student_code -> behavior data
      const behaviorMap = new Map<
        string,
        {
          weekly_study_hours: number;
          part_time_hours: number;
          financial_support: number;
          emotional_support: number;
          has_survey_data: boolean;
          full_name?: string;
        }
      >();

      // Default medium values (middle of range)
      const DEFAULT_VALUES = {
        weekly_study_hours: 20, // Default: 20 hours/week
        part_time_hours: 10, // Default: 10 hours/week
        financial_support: 2, // Default: 2/3 (medium - 0: Thấp, 1: TB, 2: Cao, 3: Rất cao)
        emotional_support: 2, // Default: 2/3 (medium - 0: Thấp, 1: TB, 2: Cao, 3: Rất cao)
        has_survey_data: false, // Đánh dấu là giá trị mặc định
      };

      for (const studentCode of studentCodes) {
        const studentData = studentsWithSurveyFactors.find(
          (s) => s.student_code === studentCode,
        );

        if (studentData?.surveyFactors) {
          // Use actual survey data if available
          behaviorMap.set(studentCode, {
            weekly_study_hours:
              studentData.surveyFactors.study_time_hours ??
              DEFAULT_VALUES.weekly_study_hours,
            part_time_hours:
              studentData.surveyFactors.work_time_hours ??
              DEFAULT_VALUES.part_time_hours,
            financial_support:
              studentData.surveyFactors.financial_support_score ??
              DEFAULT_VALUES.financial_support,
            emotional_support:
              studentData.surveyFactors.mental_health_score ??
              DEFAULT_VALUES.emotional_support,
            has_survey_data: true, // Có dữ liệu khảo sát thực tế
            full_name: studentData.account?.profile?.full_name, // Lấy full_name từ Profile
          });
        } else {
          // Use default medium values if student not found or no survey data
          behaviorMap.set(studentCode, DEFAULT_VALUES);
        }
      }

      return behaviorMap;
    } catch (error) {
      // If any error occurs, return default values for all students
      console.error('Error fetching behavior data:', error);
      const DEFAULT_VALUES = {
        weekly_study_hours: 20,
        part_time_hours: 10,
        financial_support: 2,
        emotional_support: 2,
        has_survey_data: false,
      };

      const behaviorMap = new Map<string, typeof DEFAULT_VALUES>();
      for (const studentCode of studentCodes) {
        behaviorMap.set(studentCode, DEFAULT_VALUES);
      }
      return behaviorMap;
    }
  }

  /**
   * Upload và parse file điểm (CSV hoặc Excel)
   */
  async uploadGrades(
    file: Express.Multer.File,
    uploadDto: UploadGradesDto,
    accountId: number,
  ): Promise<UploadGradesResponseDto> {
    try {
      // Get instructor_id from account_id
      const teacherId = await this.getInstructorId(accountId);

      // Validate required fields
      if (!uploadDto.academic_year || !uploadDto.semester) {
        throw new BadRequestException(
          'Academic year and semester are required',
        );
      }

      const academicYear = uploadDto.academic_year;
      const semester = uploadDto.semester;

      // Validate file
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }

      // Validate file type
      const allowedMimeTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ];

      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          'Invalid file type. Only CSV and Excel files are allowed.',
        );
      }

      // Parse file based on type
      let parsedData: any[];

      if (file.mimetype === 'text/csv') {
        parsedData = await this.parseCSV(file.buffer);
      } else {
        parsedData = await this.parseExcel(file.buffer);
      }

      if (!parsedData || parsedData.length === 0) {
        throw new BadRequestException('File is empty or invalid');
      }

      // Process and validate data
      const processedStudents: StudentRecord[] = [];
      const errors: string[] = [];
      let processedCount = 0;
      let failedCount = 0;

      for (let i = 0; i < parsedData.length; i++) {
        try {
          const row = parsedData[i];

          // Validate required fields
          if (!row.student_id && !row.Student_ID && !row.StudentID) {
            errors.push(`Row ${i + 1}: Missing student_id`);
            failedCount++;
            continue;
          }

          // Extract student_id with flexible field names
          const studentId =
            row.student_id || row.Student_ID || row.StudentID || row.STUDENT_ID;
          const studentName =
            row.student_name ||
            row.Student_Name ||
            row.StudentName ||
            row.STUDENT_NAME ||
            '';

          // Separate grades from behavior fields
          const grades: Record<string, any> = {};
          const excludedFields = [
            'student_id',
            'Student_ID',
            'StudentID',
            'STUDENT_ID',
            'student_name',
            'Student_Name',
            'StudentName',
            'STUDENT_NAME',
            'weekly_study_hours_by_course',
            'part_time_hours_by_course',
            'financial_support_by_course',
            'emotional_support_by_course',
            'No',
            'no',
            'NO',
            'STT',
            'stt', // Exclude số thứ tự columns
          ];

          for (const [key, value] of Object.entries(row)) {
            if (!excludedFields.includes(key)) {
              grades[key] = value;
            }
          }

          const studentRecord: StudentRecord = {
            student_id: String(studentId),
            student_name: studentName,
            grades: grades,
            weekly_study_hours_by_course: null,
            part_time_hours_by_course: null,
            financial_support_by_course: null,
            emotional_support_by_course: null,
            final_pred: null,
            confidence: null,
            created_at: new Date(),
            updated_at: new Date(),
          } as StudentRecord;

          processedStudents.push(studentRecord);
          processedCount++;
        } catch (error) {
          errors.push(`Row ${i + 1}: ${error.message}`);
          failedCount++;
        }
      }

      if (processedStudents.length === 0) {
        throw new BadRequestException('No valid student records found in file');
      }

      // Save to MongoDB first
      const gradeDocument = new this.studentGradeModel({
        teacher_id: teacherId,
        course_code: uploadDto.course_code,
        class_code: uploadDto.class_code, // Lưu mã lớp
        semester: semester, // Lấy từ GradeStructure hoặc uploadDto
        academic_year: academicYear, // Lấy từ GradeStructure hoặc uploadDto
        upload_date: new Date(),
        students: processedStudents,
      });

      const savedDocument = await gradeDocument.save();

      // Immediately fetch behavior data from StudentSurveyFactors and update MongoDB
      try {
        const studentCodes = processedStudents.map((s) => s.student_id);
        const behaviorMap =
          await this.fetchBehaviorDataForStudents(studentCodes);

        // Update each student with behavior data
        for (let i = 0; i < savedDocument.students.length; i++) {
          const student = savedDocument.students[i];
          const behaviorData = behaviorMap.get(student.student_id);

          if (behaviorData) {
            student.weekly_study_hours_by_course =
              behaviorData.weekly_study_hours;
            student.part_time_hours_by_course = behaviorData.part_time_hours;
            student.financial_support_by_course =
              behaviorData.financial_support;
            student.emotional_support_by_course =
              behaviorData.emotional_support;
            student.has_survey_data = behaviorData.has_survey_data; // Lưu flag có dữ liệu khảo sát hay không
            student.full_name = behaviorData.full_name; // Lưu full_name từ Profile
          }
        }

        // Save updated document with behavior data
        await savedDocument.save();

        console.log(
          `[UploadGrades] Enriched ${studentCodes.length} students with behavior data from StudentSurveyFactors`,
        );
      } catch (behaviorError) {
        console.error(
          '[UploadGrades] Failed to enrich behavior data:',
          behaviorError,
        );
        // Don't fail the upload if behavior enrichment fails
      }

      return {
        success: true,
        message: 'File uploaded and processed successfully',
        data: {
          upload_id: String(savedDocument._id),
          total_students: parsedData.length,
          processed_students: processedCount,
          failed_students: failedCount,
          upload_date: savedDocument.upload_date,
        },
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to upload grades: ${error.message}`,
      );
    }
  }

  /**
   * Parse CSV file
   */
  private async parseCSV(buffer: Buffer): Promise<any[]> {
    try {
      // Convert buffer to workbook using xlsx (it can also parse CSV)
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      return data;
    } catch (error) {
      throw new BadRequestException(
        `Failed to parse CSV file: ${error.message}`,
      );
    }
  }

  /**
   * Parse Excel file
   */
  private async parseExcel(buffer: Buffer): Promise<any[]> {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      return data;
    } catch (error) {
      throw new BadRequestException(
        `Failed to parse Excel file: ${error.message}`,
      );
    }
  }

  /**
   * Get uploaded grades by upload_id
   */
  async getUploadedGrades(uploadId: string, teacherId?: string) {
    try {
      const query: any = { _id: uploadId };
      if (teacherId) {
        query.teacher_id = teacherId;
      }

      const gradeDocument = await this.studentGradeModel.findOne(query).lean<any>();
      if (!gradeDocument) {
        throw new BadRequestException('Upload not found');
      }

      // Extract student codes from the grade document
      const studentCodes = gradeDocument.students.map((s) => s.student_id);

      // Fetch behavior data from StudentSurveyFactors table
      const behaviorMap = await this.fetchBehaviorDataForStudents(studentCodes);

      // Enrich student data with behavior information
      const enrichedStudents = gradeDocument.students.map((student) => {
        const behaviorData = behaviorMap.get(student.student_id);

        // Only update if behavior data is not already set (null values)
        if (
          behaviorData &&
          (student.weekly_study_hours_by_course === null ||
            student.part_time_hours_by_course === null ||
            student.financial_support_by_course === null ||
            student.emotional_support_by_course === null)
        ) {
          return {
            ...student,
            weekly_study_hours_by_course:
              student.weekly_study_hours_by_course ??
              behaviorData.weekly_study_hours,
            part_time_hours_by_course:
              student.part_time_hours_by_course ?? behaviorData.part_time_hours,
            financial_support_by_course:
              student.financial_support_by_course ??
              behaviorData.financial_support,
            emotional_support_by_course:
              student.emotional_support_by_course ??
              behaviorData.emotional_support,
            has_survey_data: behaviorData.has_survey_data, // Cập nhật flag
          };
        }

        return student;
      });

      return {
        success: true,
        data: {
          ...gradeDocument,
          students: enrichedStudents,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to retrieve grades: ${error.message}`,
      );
    }
  }

  /**
   * Get all uploads for a teacher
   */
  async getTeacherUploads(teacherId: string, courseCode?: string) {
    try {
      const query: any = { teacher_id: teacherId };
      if (courseCode) {
        query.course_code = courseCode;
      }

      const uploads = await this.studentGradeModel
      .find(query)
      .sort({ upload_date: -1 })
      .select('_id course_code class_code semester academic_year upload_date students')
      .lean<any[]>();

      // Add summary info
      const uploadsWithSummary = uploads.map((upload) => ({
        ...upload,
        total_students: upload.students.length,
        students_with_behavior: upload.students.filter(
          (s) => s.weekly_study_hours_by_course !== null,
        ).length,
        students_with_prediction: upload.students.filter(
          (s) => s.final_pred !== null,
        ).length,
      }));

      return {
        success: true,
        data: uploadsWithSummary,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to retrieve uploads: ${error.message}`,
      );
    }
  }

  /**
   * Update behavior data for a single student
   */
  async updateStudentBehavior(updateDto: UpdateBehaviorDto) {
    try {
      const result = await this.studentGradeModel.updateOne(
        {
          _id: updateDto.upload_id,
          'students.student_id': updateDto.student_id,
        },
        {
          $set: {
            'students.$.weekly_study_hours_by_course':
              updateDto.weekly_study_hours_by_course,
            'students.$.part_time_hours_by_course':
              updateDto.part_time_hours_by_course,
            'students.$.financial_support_by_course':
              updateDto.financial_support_by_course,
            'students.$.emotional_support_by_course':
              updateDto.emotional_support_by_course,
            'students.$.updated_at': new Date(),
          },
        },
      );

      if (result.matchedCount === 0) {
        throw new BadRequestException('Student or upload not found');
      }

      return {
        success: true,
        message: 'Behavior data updated successfully',
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to update behavior: ${error.message}`,
      );
    }
  }

  /**
   * Bulk update behavior data for all students in an upload
   */
  async bulkUpdateBehavior(bulkUpdateDto: BulkUpdateBehaviorDto) {
    try {
      const result = await this.studentGradeModel.updateOne(
        { _id: bulkUpdateDto.upload_id },
        {
          $set: {
            'students.$[].weekly_study_hours_by_course':
              bulkUpdateDto.weekly_study_hours_by_course,
            'students.$[].part_time_hours_by_course':
              bulkUpdateDto.part_time_hours_by_course,
            'students.$[].financial_support_by_course':
              bulkUpdateDto.financial_support_by_course,
            'students.$[].emotional_support_by_course':
              bulkUpdateDto.emotional_support_by_course,
            'students.$[].updated_at': new Date(),
          },
        },
      );

      if (result.matchedCount === 0) {
        throw new BadRequestException('Upload not found');
      }

      return {
        success: true,
        message: 'Behavior data updated for all students successfully',
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to bulk update behavior: ${error.message}`,
      );
    }
  }

  /**
   * Delete an upload
   */
  async deleteUpload(uploadId: string, teacherId?: string) {
    try {
      const query: any = { _id: uploadId };
      if (teacherId) {
        query.teacher_id = teacherId;
      }

      const result = await this.studentGradeModel.deleteOne(query);

      if (result.deletedCount === 0) {
        throw new BadRequestException('Upload not found or unauthorized');
      }

      return {
        success: true,
        message: 'Upload deleted successfully',
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to delete upload: ${error.message}`,
      );
    }
  }

  /**
   * Send survey notification to students
   */
  async sendSurveyNotification(uploadId: string) {
    try {
      // Get upload data
      const upload = await this.studentGradeModel.findById(uploadId).lean();

      if (!upload) {
        throw new BadRequestException('Upload not found');
      }

      // Get student codes from upload
      const studentCodes = upload.students.map((s) => s.student_id);

      // Find students in database with their accounts
      const students = await this.prismaService.student.findMany({
        where: {
          student_code: {
            in: studentCodes,
          },
        },
        select: {
          student_id: true,
          student_code: true,
          account: {
            select: {
              account_id: true,
              email: true,
              profile: {
                select: {
                  full_name: true,
                },
              },
            },
          },
        },
      });

      // Filter students who have accounts
      const studentsWithAccounts = students.filter((s) => s.account);
      const accountIds = studentsWithAccounts.map((s) => s.account.account_id);

      if (accountIds.length === 0) {
        throw new BadRequestException(
          'No students with accounts found in this upload',
        );
      }

      // Create notification master
      const notificationMaster =
        await this.prismaService.notificationMaster.create({
          data: {
            title: ' Khảo sát Behavior - Dự đoán Kết quả Học tập',
            body: `Chào bạn! Giảng viên đã yêu cầu bạn hoàn tất khảo sát hành vi học tập cho môn ${upload.course_code} - ${upload.class_code}. Khảo sát này giúp hệ thống dự đoán chính xác hơn kết quả học tập của bạn. Vui lòng hoàn tất khảo sát trong mục "Khảo sát" trên hệ thống.`,
            type: 'Khảo Sát',
            priority: 'Cao',
            target: 'Sinh viên',
            channel: 'in_app',
            created_by: 1, // System/Admin account
          },
        });

      // Create notification recipients for each student
      await this.prismaService.notificationRecipient.createMany({
        data: accountIds.map((accountId) => ({
          master_id: notificationMaster.id,
          account_id: accountId,
          delivered_at: new Date(),
        })),
      });

      return {
        success: true,
        message: `Survey notification sent to ${accountIds.length} students successfully`,
        data: {
          total_students: studentCodes.length,
          students_with_accounts: accountIds.length,
          students_without_accounts: studentCodes.length - accountIds.length,
          notification_id: notificationMaster.id,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to send survey notification: ${error.message}`,
      );
    }
  }

  /**
   * Get students by upload ID
   */
  async getStudentsByUploadId(uploadId: string) {
    try {
      const upload = await this.studentGradeModel.findById(uploadId).lean();

      if (!upload) {
        throw new BadRequestException('Upload not found');
      }

      // Extract student codes from the upload
      const studentCodes = upload.students.map((s) => s.student_id);

      // Fetch behavior data from StudentSurveyFactors table
      const behaviorMap = await this.fetchBehaviorDataForStudents(studentCodes);

      // Enrich student data with behavior information
      const enrichedStudents = upload.students.map((student) => {
        const behaviorData = behaviorMap.get(student.student_id);

        if (behaviorData) {
          // Always update full_name and has_survey_data if behavior data exists
          const enriched = {
            ...student,
            has_survey_data: behaviorData.has_survey_data,
            full_name: behaviorData.full_name,
          };

          // Only update behavior fields if they are currently null
          if (
            student.weekly_study_hours_by_course === null ||
            student.part_time_hours_by_course === null ||
            student.financial_support_by_course === null ||
            student.emotional_support_by_course === null
          ) {
            enriched.weekly_study_hours_by_course =
              student.weekly_study_hours_by_course ??
              behaviorData.weekly_study_hours;
            enriched.part_time_hours_by_course =
              student.part_time_hours_by_course ?? behaviorData.part_time_hours;
            enriched.financial_support_by_course =
              student.financial_support_by_course ??
              behaviorData.financial_support;
            enriched.emotional_support_by_course =
              student.emotional_support_by_course ??
              behaviorData.emotional_support;
          }

          return enriched;
        }

        return student;
      });

      return {
        _id: upload._id,
        teacher_id: upload.teacher_id,
        course_code: upload.course_code,
        class_code: upload.class_code,
        semester: upload.semester,
        academic_year: upload.academic_year,
        upload_date: upload.upload_date,
        students: enrichedStudents,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to get students: ${error.message}`,
      );
    }
  }

  /**
   * Update prediction for a single student
   */
  async updateStudentPrediction(
    uploadId: string,
    studentId: string,
    finalPred: number | null,
    confidence: 'high' | 'medium' | 'low' | null,
  ) {
    try {
      const result = await this.studentGradeModel.updateOne(
        {
          _id: uploadId,
          'students.student_id': studentId,
        },
        {
          $set: {
            'students.$.final_pred': finalPred,
            'students.$.confidence': confidence,
            'students.$.updated_at': new Date(),
          },
        },
      );

      if (result.matchedCount === 0) {
        throw new BadRequestException('Student or upload not found');
      }

      return {
        success: true,
        message: 'Prediction updated successfully',
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to update prediction: ${error.message}`,
      );
    }
  }

  /**
   * Get available academic years and semesters from GradeStructure
   * Optionally filter by courseCode
   */
  async getAvailableAcademicTerms(courseCode?: string) {
    try {
      const filter: any = { isActive: true };

      // If courseCode is provided, filter by it
      if (courseCode) {
        filter.courseCode = courseCode;
      }

      // Get distinct academic years and semesters with filter
      const academicYears = await this.gradeStructureModel
        .distinct('academicYear', filter)
        .exec();

      const semesters = await this.gradeStructureModel
        .distinct('semester', filter)
        .exec();

      return {
        success: true,
        data: {
          academicYears: academicYears.sort().reverse(), // Sort descending (newest first)
          semesters: semesters.sort(), // Sort ascending (1, 2, 3)
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to fetch academic terms: ${error.message}`,
      );
    }
  }

  /**
   * Tính điểm cần thiết để pass môn (≥5.0)
   * Dựa trên grade structure và điểm hiện tại của sinh viên
   */
  async calculatePassThreshold(uploadId: string) {
    try {
      // 1. Lấy thông tin upload
      const upload = await this.studentGradeModel.findById(uploadId).exec();
      if (!upload) {
        throw new NotFoundException('Upload not found');
      }

      // 2. Lấy grade structure
      const gradeStructure = await this.gradeStructureModel
        .findOne({
          courseCode: upload.course_code,
          academicYear: upload.academic_year,
          semester: upload.semester,
        })
        .exec();

      if (!gradeStructure) {
        throw new NotFoundException(
          'Grade structure not found for this course',
        );
      }

      // 3. Tính toán cho từng sinh viên
      const studentsWithThreshold = upload.students.map(
        (student: StudentRecord) => {
          const grades = student.grades;
          let currentScore = 0;
          let currentWeightUsed = 0;
          let finalWeightNeeded = 0;
          let finalColumnKey = '';

          // Tìm cột final (chưa có điểm)
          const finalColumn = gradeStructure.columns.find(
            (col) =>
              col.key === 'final' ||
              col.key === 'finalexam' ||
              col.key.includes('final'),
          );

          if (finalColumn) {
            finalWeightNeeded = finalColumn.weight;
            finalColumnKey = finalColumn.key;
          }

          // Tính điểm hiện tại từ các cột đã có
          gradeStructure.columns.forEach((column) => {
            const gradeValue = grades[column.key];
            if (
              gradeValue !== null &&
              gradeValue !== undefined &&
              column.key !== finalColumnKey
            ) {
              // Normalize về thang 10
              const normalizedGrade = (gradeValue / column.maxScore) * 10;
              // Cộng điểm có trọng số
              currentScore += (normalizedGrade * column.weight) / 100;
              currentWeightUsed += column.weight;
            }
          });

          // Tính điểm final cần thiết để đạt 5.0
          const passingScore = 5.0;
          const remainingWeight = 100 - currentWeightUsed;
          let finalScoreNeeded = 0;

          if (remainingWeight > 0) {
            // Công thức: currentScore + (finalScore * remainingWeight / 100) = 5.0
            // => finalScore = (5.0 - currentScore) * 100 / remainingWeight
            finalScoreNeeded =
              ((passingScore - currentScore) * 100) / remainingWeight;
            finalScoreNeeded = Math.max(0, Math.min(10, finalScoreNeeded)); // Clamp 0-10
          }

          return {
            student_id: student.student_id,
            currentScore: parseFloat(currentScore.toFixed(2)),
            currentWeightUsed: parseFloat(currentWeightUsed.toFixed(2)),
            finalWeightNeeded: parseFloat(remainingWeight.toFixed(2)),
            finalScoreNeeded: parseFloat(finalScoreNeeded.toFixed(2)),
            finalColumnKey,
            isPassing: currentScore >= passingScore,
            canPass: finalScoreNeeded <= 10, // Có thể pass nếu điểm final cần ≤ 10
          };
        },
      );

      return {
        gradeStructure: {
          courseCode: gradeStructure.courseCode,
          courseName: gradeStructure.courseName,
          columns: gradeStructure.columns,
          totalWeight: gradeStructure.totalWeight,
        },
        students: studentsWithThreshold,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to calculate pass threshold: ${error.message}`,
      );
    }
  }
}
