import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Logger,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TranscriptUploadService } from './transcript-upload.service';
import { TranscriptPredictionService, GPACalculatorService, SemesterPlanningService } from './logic';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadTranscriptDto } from './dto/upload-transcript.dto';
import { TranscriptUploadResponse, StudentTranscriptResponse } from './models/transcript-upload-response.type';
import { PredictionsResponse } from './dto/get-predictions.dto';
import * as XLSX from 'xlsx';
import { parse } from 'csv-parse/sync';
import { DevAuthGuard } from '../../common/guards/dev-auth.guard';

@Controller('student/transcript')
export class TranscriptUploadController {
  private readonly logger = new Logger(TranscriptUploadController.name);
  
  constructor(
    private readonly transcriptUploadService: TranscriptUploadService,
    private readonly predictionService: TranscriptPredictionService,
    private readonly gpaCalculatorService: GPACalculatorService,
    private readonly semesterPlanningService: SemesterPlanningService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * POST /student/transcript/upload
   * Upload transcript từ JSON data
   */
  @Post('upload')
  @UseGuards(DevAuthGuard)
  async uploadTranscript(
    @Body() uploadDto: UploadTranscriptDto,
    @Req() req: any,
  ): Promise<TranscriptUploadResponse> {
    const accountId = req.user?.account_id;
    if (!accountId) {
      throw new BadRequestException('User not authenticated');
    }

    const student = await this.prisma.student.findUnique({
      where: { account_id: accountId },
      select: { student_id: true, student_code: true },
    });

    if (!student) {
      throw new BadRequestException('Student not found for current account');
    }

    const normalizedRecords = (uploadDto.records || []).map((r) => ({
      ...r,
      student_code: student.student_code,
    }));

    const dto: UploadTranscriptDto = { records: normalizedRecords };
    return this.transcriptUploadService.uploadTranscript(dto);
  }

  /**
   * POST /student/transcript/upload-file
   * Upload transcript từ file (CSV hoặc Excel)
   */
  @Post('upload-file')
  @UseInterceptors(FileInterceptor('file'))
  @UseGuards(DevAuthGuard)
  async uploadTranscriptFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ): Promise<TranscriptUploadResponse> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      // Parse file based on type
      let records;
      const filename = file.originalname.toLowerCase();

      if (filename.endsWith('.csv')) {
        records = this.parseCSV(file.buffer);
      } else if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
        records = this.parseExcel(file.buffer);
      } else {
        throw new BadRequestException('Unsupported file format. Please upload CSV or Excel file');
      }

      if (!records || records.length === 0) {
        throw new BadRequestException('File is empty or contains no valid data');
      }

      const accountId = req.user?.account_id;
      if (!accountId) {
        throw new BadRequestException('User not authenticated');
      }

      const student = await this.prisma.student.findUnique({
        where: { account_id: accountId },
        select: { student_id: true, student_code: true },
      });

      if (!student) {
        throw new BadRequestException('Student not found for current account');
      }

      const normalizedRecords = records.map((r: any) => ({
        ...r,
        student_code: student.student_code,
      }));

      const uploadDto: UploadTranscriptDto = { records: normalizedRecords };
      return this.transcriptUploadService.uploadTranscript(uploadDto);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      // Handle parsing errors
      const errorMessage = error.message || 'Failed to parse file';
      throw new BadRequestException(
        `File parsing failed: ${errorMessage}. Please check your file format and try again.`
      );
    }
  }

  /**
   * GET /student/transcript/:studentId
   * Lấy transcript của student
   */
  @Get(':studentId')
  async getStudentTranscript(
    @Param('studentId', ParseIntPipe) studentId: number,
  ): Promise<StudentTranscriptResponse> {
    return this.transcriptUploadService.getStudentTranscript(studentId);
  }

  /**
   * DELETE /student/transcript/:studentId
   * Xóa tất cả transcript records của student
   */
  @Delete(':studentId')
  async deleteStudentTranscript(
    @Param('studentId', ParseIntPipe) studentId: number,
  ): Promise<{ message: string }> {
    await this.transcriptUploadService.deleteStudentTranscript(studentId);
    return { message: 'Transcript deleted successfully' };
  }

  /**
   * GET /student/transcript/:studentId/predictions
   * Lấy predictions của student
   */
  @Get(':studentId/predictions')
  async getPredictions(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Query('course_id') courseId?: string,
    @Query('model_type') modelType?: string,
  ): Promise<PredictionsResponse> {
    const predictions = await this.predictionService.getPredictions(
      studentId,
      courseId ? parseInt(courseId) : undefined,
      modelType,
    );

    return {
      success: true,
      data: {
        predictions,
        total: predictions.length,
      },
    };
  }

  /**
   * GET /student/transcript/:idOrAccountId/gpa
   * Tính và lấy GPA hiện tại của student
   * Hỗ trợ cả student_id và account_id - JOIN trực tiếp qua Account
   */
  @Get(':idOrAccountId/gpa')
  async getStudentGPA(@Param('idOrAccountId', ParseIntPipe) idOrAccountId: number) {
    this.logger.log(`[GPA Endpoint] Received ID: ${idOrAccountId}`);
    
    // JOIN trực tiếp: Account -> Student
    // Thử tìm theo account_id trước (vì frontend thường gửi account_id)
    let student = await this.prisma.student.findUnique({
      where: { account_id: idOrAccountId },
      select: { 
        student_id: true, 
        major: true, 
        account_id: true,
        student_code: true,
        cohort_year: true,
      },
    });

    // Nếu không tìm thấy, thử tìm theo student_id
    if (!student) {
      this.logger.log(`[GPA Endpoint] Not found by account_id, trying student_id...`);
      student = await this.prisma.student.findUnique({
        where: { student_id: idOrAccountId },
        select: { 
          student_id: true, 
          major: true, 
          account_id: true,
          student_code: true,
          cohort_year: true,
        },
      });
    }

    if (!student) {
      this.logger.error(`[GPA Endpoint] Student not found for ID: ${idOrAccountId}`);
      return {
        success: false,
        message: `Student not found for ID: ${idOrAccountId}`,
      };
    }

    this.logger.log(`[GPA Endpoint] Found student: student_id=${student.student_id}, account_id=${student.account_id}, code=${student.student_code}`);
    
    // Tính GPA chỉ với các môn có điểm (converted_numeric_score NOT NULL)
    const gpaData = await this.gpaCalculatorService.calculateCurrentGPA(student.student_id);

    return {
      success: true,
      data: {
        ...gpaData,
        major: student.major,
        student_code: student.student_code,
        cohort_year: student.cohort_year,
      },
    };
  }

  /**
   * GET /student/transcript/:idOrAccountId/gpa-projected
   * Tính và lấy PROJECTED GPA (bao gồm cả môn planned với predictions)
   * Dùng cho AcademicPlanningDashboard để hiển thị GPA dự đoán
   * Hỗ trợ cả student_id và account_id
   */
  @Get(':idOrAccountId/gpa-projected')
  async getStudentProjectedGPA(@Param('idOrAccountId', ParseIntPipe) idOrAccountId: number) {
    this.logger.log(`[Projected GPA Endpoint] Received ID: ${idOrAccountId}`);
    
    // JOIN trực tiếp: Account -> Student
    let student = await this.prisma.student.findUnique({
      where: { account_id: idOrAccountId },
      select: { 
        student_id: true, 
        major: true, 
        account_id: true,
        student_code: true,
        cohort_year: true,
      },
    });

    // Nếu không tìm thấy, thử tìm theo student_id
    if (!student) {
      this.logger.log(`[Projected GPA Endpoint] Not found by account_id, trying student_id...`);
      student = await this.prisma.student.findUnique({
        where: { student_id: idOrAccountId },
        select: { 
          student_id: true, 
          major: true, 
          account_id: true,
          student_code: true,
          cohort_year: true,
        },
      });
    }

    if (!student) {
      this.logger.error(`[Projected GPA Endpoint] Student not found for ID: ${idOrAccountId}`);
      return {
        success: false,
        message: `Student not found for ID: ${idOrAccountId}`,
      };
    }

    this.logger.log(`[Projected GPA Endpoint] Found student: student_id=${student.student_id}`);
    
    // Tính PROJECTED GPA (completed + planned courses)
    const projectedGpaData = await this.gpaCalculatorService.calculateProjectedGPA(student.student_id);

    return {
      success: true,
      data: {
        ...projectedGpaData,
        major: student.major,
        student_code: student.student_code,
        cohort_year: student.cohort_year,
      },
    };
  }

  /**
   * GET /student/transcript/:studentId/gpa/breakdown
   * Lấy GPA breakdown theo từng học kỳ
   */
  @Get(':studentId/gpa/breakdown')
  async getGPABreakdown(@Param('studentId', ParseIntPipe) studentId: number) {
    const breakdown = await this.gpaCalculatorService.getGPABreakdownBySemester(studentId);

    return {
      success: true,
      data: {
        breakdown,
        total_semesters: breakdown.length,
      },
    };
  }

  /**
   * GET /student/transcript/:studentId/semester/:termId/gpa
   * Tính GPA cho một học kỳ cụ thể
   */
  @Get(':studentId/semester/:termId/gpa')
  async getSemesterGPA(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Param('termId', ParseIntPipe) termId: number,
  ) {
    const gpa = await this.gpaCalculatorService.calculateSemesterGPA(studentId, termId);

    return {
      success: true,
      data: {
        student_id: studentId,
        term_id: termId,
        gpa,
      },
    };
  }

  /**
   * GET /student/transcript/:idOrAccountId/predicted-gpa
   * Tính GPA DỰ ĐOÁN cho sinh viên
   * Bao gồm: điểm thật (completed) + điểm dự đoán (planned từ PredictionResult)
   * 
   * @param idOrAccountId - student_id hoặc account_id
   * @returns Predicted GPA calculation result
   */
  @Get(':idOrAccountId/predicted-gpa')
  async getPredictedGPA(@Param('idOrAccountId', ParseIntPipe) idOrAccountId: number) {
    this.logger.log(`Getting PREDICTED GPA for ID: ${idOrAccountId}`);

    // Ưu tiên tìm theo account_id trước (thường dùng hơn)
    let student = await this.prisma.student.findUnique({
      where: { account_id: idOrAccountId },
      select: { 
        student_id: true, 
        student_code: true,
        cohort_year: true,
        major: true,
      },
    });

    // Nếu không tìm thấy theo account_id, thử theo student_id
    if (!student) {
      this.logger.log(`Not found by account_id, trying student_id: ${idOrAccountId}`);
      student = await this.prisma.student.findUnique({
        where: { student_id: idOrAccountId },
        select: { 
          student_id: true, 
          student_code: true,
          cohort_year: true,
          major: true,
        },
      });
    }

    if (!student) {
      throw new BadRequestException(
        `Student not found with ID or account_id: ${idOrAccountId}`
      );
    }

    this.logger.log(`Found student: ${student.student_code} (ID: ${student.student_id})`);

    // Tính GPA dự đoán
    const predictedGpaData = await this.gpaCalculatorService.calculatePredictedGPA(
      student.student_id
    );

    return {
      success: true,
      data: {
        student_id: student.student_id,
        student_code: student.student_code,
        cohort_year: student.cohort_year,
        major: student.major,
        ...predictedGpaData,
      },
    };
  }

  /**
   * GET /student/transcript/:idOrAccountId/physical-education-gpa
   * Tính điểm trung bình 3 môn Giáo dục thể chất (DEM)
   * Hỗ trợ cả student_id và account_id
   */
  @Get(':idOrAccountId/physical-education-gpa')
  async getPhysicalEducationGPA(@Param('idOrAccountId', ParseIntPipe) idOrAccountId: number) {
    this.logger.log(`Getting Physical Education GPA for ID: ${idOrAccountId}`);

    // Ưu tiên tìm theo account_id trước
    let student = await this.prisma.student.findUnique({
      where: { account_id: idOrAccountId },
      select: { 
        student_id: true, 
        student_code: true,
        cohort_year: true,
        major: true,
      },
    });

    // Nếu không tìm thấy theo account_id, thử theo student_id
    if (!student) {
      this.logger.log(`Not found by account_id, trying student_id: ${idOrAccountId}`);
      student = await this.prisma.student.findUnique({
        where: { student_id: idOrAccountId },
        select: { 
          student_id: true, 
          student_code: true,
          cohort_year: true,
          major: true,
        },
      });
    }

    if (!student) {
      throw new BadRequestException(
        `Student not found with ID or account_id: ${idOrAccountId}`
      );
    }

    this.logger.log(`Found student: ${student.student_code} (ID: ${student.student_id})`);

    // Tính điểm DEM
    const demGpaData = await this.gpaCalculatorService.calculatePhysicalEducationGPA(
      student.student_id
    );

    return {
      success: true,
      data: {
        student_id: student.student_id,
        student_code: student.student_code,
        cohort_year: student.cohort_year,
        major: student.major,
        ...demGpaData,
      },
    };
  }

  /**
   * GET /student/transcript/:idOrAccountId/survey-factors
   * Lấy survey factors của student (từ bảng StudentSurveyFactors)
   * Hỗ trợ cả student_id và account_id
   */
  @Get(':idOrAccountId/survey-factors')
  async getStudentSurveyFactors(@Param('idOrAccountId', ParseIntPipe) idOrAccountId: number) {
    this.logger.log(`[Survey Factors Endpoint] Received ID: ${idOrAccountId}`);
    
    // JOIN trực tiếp: Account -> Student
    let student = await this.prisma.student.findUnique({
      where: { account_id: idOrAccountId },
      select: { student_id: true },
    });

    if (!student) {
      student = await this.prisma.student.findUnique({
        where: { student_id: idOrAccountId },
        select: { student_id: true },
      });
    }

    if (!student) {
      this.logger.error(`[Survey Factors Endpoint] Student not found for ID: ${idOrAccountId}`);
      return {
        success: false,
        message: `Student not found for ID: ${idOrAccountId}`,
        data: null,
      };
    }

    // Lấy survey factors
    const surveyFactors = await this.prisma.studentSurveyFactors.findUnique({
      where: { student_id: student.student_id },
      select: {
        factor_id: true,
        student_id: true,
        study_time_hours: true,
        work_time_hours: true,
        financial_support_score: true,
        mental_health_score: true,
        updated_at: true,
      },
    });

    if (!surveyFactors) {
      this.logger.log(`[Survey Factors Endpoint] No survey data found for student ${student.student_id}`);
      return {
        success: true,
        message: 'No survey data found. Please complete the survey.',
        data: null,
      };
    }

    this.logger.log(`[Survey Factors Endpoint] Survey factors found for student ${student.student_id}`);
    return {
      success: true,
      data: surveyFactors,
    };
  }

  /**
   * Parse CSV file
   */
  private parseCSV(buffer: Buffer): any[] {
    // Remove BOM if present and normalize content
    let content = buffer.toString('utf-8');
    
    // Remove UTF-8 BOM
    if (content.charCodeAt(0) === 0xFEFF) {
      content = content.slice(1);
    }
    
    // Remove any leading/trailing whitespace
    content = content.trim();

    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true,        // Allow quotes to appear in unquoted fields
      relax_column_count: true,  // Allow inconsistent column count
      bom: true,                 // Handle BOM
    });

    return records.map((record: any) => ({
      student_code: String(record.student_code || record.student_id), // Support both column names
      year: parseInt(record.year) || new Date().getFullYear(),
      semester_number: this.parseSemesterNumber(record.semester_number),
      course_code: record.course_code,
      course_name: record.course_name,
      study_format: record.study_format || 'offline',
      credits_unit: parseInt(record.credits_unit) || 0,
      raw_score: record.raw_score ? parseFloat(record.raw_score) : undefined,
      converted_score: record.converted_score ? String(record.converted_score).substring(0, 5) : undefined, // Limit to 5 chars
      converted_numeric_score: record.converted_numeric_score 
        ? parseFloat(record.converted_numeric_score) 
        : undefined,
    }));
  }

  /**
   * Parse Excel file
   */
  private parseExcel(buffer: Buffer): any[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    return data.map((record: any) => ({
      student_code: String(record.student_code || record.student_id), // Support both column names
      year: parseInt(record.year) || new Date().getFullYear(),
      semester_number: this.parseSemesterNumber(record.semester_number),
      course_code: String(record.course_code),
      course_name: String(record.course_name),
      study_format: record.study_format || 'offline',
      credits_unit: parseInt(record.credits_unit) || 0,
      raw_score: record.raw_score ? parseFloat(record.raw_score) : undefined,
      converted_score: record.converted_score ? String(record.converted_score).substring(0, 5) : undefined, // Limit to 5 chars
      converted_numeric_score: record.converted_numeric_score 
        ? parseFloat(record.converted_numeric_score) 
        : undefined,
    }));
  }

  /**
   * Parse semester number from string or number
   * Converts "Hè" to 3, or parses numeric values
   */
  private parseSemesterNumber(value: any): number {
    if (!value) return 1; // Default to semester 1
    
    // Convert to string and normalize
    const strValue = String(value).trim().toLowerCase();
    
    // Check for "Hè" (summer) - case insensitive
    if (strValue === 'hè' || strValue === 'he' || strValue === 'summer') {
      return 3;
    }
    
    // Try to parse as number
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 3) {
      return numValue;
    }
    
    // Default to semester 1 if invalid
    return 1;
  }

  /**
   * GET /student/transcript/:idOrAccountId/semester-plan
   * Lấy Recommended Semester Plan cho sinh viên
   * Bao gồm: môn học dự đoán, thông tin học kỳ, thời gian học tập, tổng tín chỉ
   * 
   * @param idOrAccountId - student_id hoặc account_id
   * @returns Semester plan với danh sách môn học được nhóm theo học kỳ
   */
  @Get(':idOrAccountId/semester-plan')
  async getSemesterPlan(@Param('idOrAccountId', ParseIntPipe) idOrAccountId: number) {
    this.logger.log(`Getting semester plan for ID: ${idOrAccountId}`);

    // Ưu tiên tìm theo account_id trước
    let student = await this.prisma.student.findUnique({
      where: { account_id: idOrAccountId },
      select: { 
        student_id: true, 
        student_code: true,
      },
    });

    // Nếu không tìm thấy theo account_id, thử theo student_id
    if (!student) {
      this.logger.log(`Not found by account_id, trying student_id: ${idOrAccountId}`);
      student = await this.prisma.student.findUnique({
        where: { student_id: idOrAccountId },
        select: { 
          student_id: true, 
          student_code: true,
        },
      });
    }

    if (!student) {
      throw new BadRequestException(
        `Student not found with ID or account_id: ${idOrAccountId}`
      );
    }

    this.logger.log(`Found student: ${student.student_code} (ID: ${student.student_id})`);

    // Lấy semester plan đã được group theo học kỳ
    const semesterPlan = await this.semesterPlanningService.getSemesterPlanGrouped(
      student.student_id
    );

    return {
      success: true,
      data: semesterPlan,
    };
  }

  /**
   * GET /student/transcript/:idOrAccountId/semester-plan/raw
   * Lấy raw semester plan (không group theo học kỳ)
   * 
   * @param idOrAccountId - student_id hoặc account_id
   * @returns Raw semester plan với danh sách tất cả môn học dự đoán
   */
  @Get(':idOrAccountId/semester-plan/raw')
  async getSemesterPlanRaw(@Param('idOrAccountId', ParseIntPipe) idOrAccountId: number) {
    this.logger.log(`Getting raw semester plan for ID: ${idOrAccountId}`);

    // Ưu tiên tìm theo account_id trước
    let student = await this.prisma.student.findUnique({
      where: { account_id: idOrAccountId },
      select: { 
        student_id: true, 
        student_code: true,
      },
    });

    // Nếu không tìm thấy theo account_id, thử theo student_id
    if (!student) {
      student = await this.prisma.student.findUnique({
        where: { student_id: idOrAccountId },
        select: { 
          student_id: true, 
          student_code: true,
        },
      });
    }

    if (!student) {
      throw new BadRequestException(
        `Student not found with ID or account_id: ${idOrAccountId}`
      );
    }

    // Lấy semester plan raw (không group)
    const semesterPlan = await this.semesterPlanningService.getRecommendedSemesterPlan(
      student.student_id
    );

    return {
      success: true,
      data: semesterPlan,
    };
  }
}
