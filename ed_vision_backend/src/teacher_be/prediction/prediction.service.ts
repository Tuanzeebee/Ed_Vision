import { Injectable, BadRequestException, InternalServerErrorException, Inject, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import * as XLSX from 'xlsx';
import { Readable } from 'stream';
import { StudentGrade, StudentRecord } from './schemas/student-grade.schema';
import { UploadGradesDto, UploadGradesResponseDto } from './dto/upload-grades.dto';
import { UpdateBehaviorDto, BulkUpdateBehaviorDto } from './dto/update-behavior.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PredictionService {
  constructor(
    @Inject('STUDENT_GRADE_MODEL')
    private studentGradeModel: Model<StudentGrade>,
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
      throw new NotFoundException('Instructor profile not found for this account');
    }

    return instructor.instructor_id.toString();
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
        throw new BadRequestException('Invalid file type. Only CSV and Excel files are allowed.');
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
          const studentId = row.student_id || row.Student_ID || row.StudentID || row.STUDENT_ID;
          const studentName = row.student_name || row.Student_Name || row.StudentName || row.STUDENT_NAME || '';

          // Separate grades from behavior fields
          const grades: Record<string, any> = {};
          const excludedFields = [
            'student_id', 'Student_ID', 'StudentID', 'STUDENT_ID',
            'student_name', 'Student_Name', 'StudentName', 'STUDENT_NAME',
            'weekly_study_hours_by_course', 'part_time_hours_by_course',
            'financial_support_by_course', 'emotional_support_by_course',
            'No', 'no', 'NO', 'STT', 'stt' // Exclude số thứ tự columns
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

      // Save to MongoDB
      const gradeDocument = new this.studentGradeModel({
        teacher_id: teacherId,
        course_code: uploadDto.course_code,
        semester: uploadDto.semester,
        year: uploadDto.year,
        upload_date: new Date(),
        students: processedStudents,
      });

      const savedDocument = await gradeDocument.save();

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
      throw new InternalServerErrorException(`Failed to upload grades: ${error.message}`);
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
      throw new BadRequestException(`Failed to parse CSV file: ${error.message}`);
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
      throw new BadRequestException(`Failed to parse Excel file: ${error.message}`);
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

      const gradeDocument = await this.studentGradeModel.findOne(query);
      
      if (!gradeDocument) {
        throw new BadRequestException('Upload not found');
      }

      return {
        success: true,
        data: gradeDocument,
      };
    } catch (error) {
      throw new InternalServerErrorException(`Failed to retrieve grades: ${error.message}`);
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
        .select('_id course_code semester year upload_date students')
        .lean();

      // Add summary info
      const uploadsWithSummary = uploads.map(upload => ({
        ...upload,
        total_students: upload.students.length,
        students_with_behavior: upload.students.filter(
          s => s.weekly_study_hours_by_course !== null
        ).length,
        students_with_prediction: upload.students.filter(
          s => s.final_pred !== null
        ).length,
      }));

      return {
        success: true,
        data: uploadsWithSummary,
      };
    } catch (error) {
      throw new InternalServerErrorException(`Failed to retrieve uploads: ${error.message}`);
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
            'students.$.weekly_study_hours_by_course': updateDto.weekly_study_hours_by_course,
            'students.$.part_time_hours_by_course': updateDto.part_time_hours_by_course,
            'students.$.financial_support_by_course': updateDto.financial_support_by_course,
            'students.$.emotional_support_by_course': updateDto.emotional_support_by_course,
            'students.$.updated_at': new Date(),
          },
        }
      );

      if (result.matchedCount === 0) {
        throw new BadRequestException('Student or upload not found');
      }

      return {
        success: true,
        message: 'Behavior data updated successfully',
      };
    } catch (error) {
      throw new InternalServerErrorException(`Failed to update behavior: ${error.message}`);
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
            'students.$[].weekly_study_hours_by_course': bulkUpdateDto.weekly_study_hours_by_course,
            'students.$[].part_time_hours_by_course': bulkUpdateDto.part_time_hours_by_course,
            'students.$[].financial_support_by_course': bulkUpdateDto.financial_support_by_course,
            'students.$[].emotional_support_by_course': bulkUpdateDto.emotional_support_by_course,
            'students.$[].updated_at': new Date(),
          },
        }
      );

      if (result.matchedCount === 0) {
        throw new BadRequestException('Upload not found');
      }

      return {
        success: true,
        message: 'Behavior data updated for all students successfully',
      };
    } catch (error) {
      throw new InternalServerErrorException(`Failed to bulk update behavior: ${error.message}`);
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
      throw new InternalServerErrorException(`Failed to delete upload: ${error.message}`);
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

      return {
        _id: upload._id,
        teacher_id: upload.teacher_id,
        course_code: upload.course_code,
        semester: upload.semester,
        year: upload.year,
        upload_date: upload.upload_date,
        students: upload.students,
      };
    } catch (error) {
      throw new InternalServerErrorException(`Failed to get students: ${error.message}`);
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
        }
      );

      if (result.matchedCount === 0) {
        throw new BadRequestException('Student or upload not found');
      }

      return {
        success: true,
        message: 'Prediction updated successfully',
      };
    } catch (error) {
      throw new InternalServerErrorException(`Failed to update prediction: ${error.message}`);
    }
  }
}
