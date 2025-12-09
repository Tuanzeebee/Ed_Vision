import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  UseGuards,
  Request,
  InternalServerErrorException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PredictionService } from './prediction.service';
import { UploadGradesDto } from './dto/upload-grades.dto';
import { UpdateBehaviorDto, BulkUpdateBehaviorDto } from './dto/update-behavior.dto';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { DevAuthGuard } from '../../common/guards/dev-auth.guard';
import { MLPredictionService } from './ml-prediction.service';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('api/teacher/prediction')
@UseGuards(DevAuthGuard)
export class PredictionController {
  constructor(
    private readonly predictionService: PredictionService,
    private readonly mlPredictionService: MLPredictionService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Upload file điểm
   * POST /api/teacher/prediction/upload
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadGrades(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: UploadGradesDto,
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Get account_id from JWT token (req.user is populated by auth middleware)
    const accountId = req.user?.account_id || req.user?.sub;
    
    if (!accountId) {
      throw new BadRequestException('User not authenticated');
    }

    return await this.predictionService.uploadGrades(file, uploadDto, accountId);
  }

  /**
   * Get uploaded grades by upload_id
   * GET /api/teacher/prediction/upload/:uploadId
   */
  @Get('upload/:uploadId')
  async getUploadedGrades(
    @Param('uploadId') uploadId: string,
    @Query('teacher_id') teacherId?: string,
  ) {
    return await this.predictionService.getUploadedGrades(uploadId, teacherId);
  }

  /**
   * Get all uploads for a teacher
   * GET /api/teacher/prediction/uploads
   */
  @Get('uploads')
  async getTeacherUploads(
    @Request() req: any,
    @Query('course_code') courseCode?: string,
  ) {
    // Get account_id from JWT
    const accountId = req.user?.account_id || req.user?.sub;
    if (!accountId) {
      throw new BadRequestException('User not authenticated');
    }

    // Get instructor_id from Instructor table
    const instructor = await this.prisma.instructor.findUnique({
      where: { account_id: accountId },
      select: { instructor_id: true },
    });

    if (!instructor) {
      throw new BadRequestException('Instructor not found for this account');
    }

    // Use instructor_id as teacher_id for MongoDB queries
    return await this.predictionService.getTeacherUploads(instructor.instructor_id.toString(), courseCode);
  }

  /**
   * Get available academic years and semesters from GradeStructure
   * GET /api/teacher/prediction/academic-terms?courseCode=IT001
   */
  @Get('academic-terms')
  async getAvailableAcademicTerms(@Query('courseCode') courseCode?: string) {
    return await this.predictionService.getAvailableAcademicTerms(courseCode);
  }

  /**
   * Update behavior data for a single student
   * PUT /api/teacher/prediction/behavior/student
   */
  @Put('behavior/student')
  async updateStudentBehavior(@Body() updateDto: UpdateBehaviorDto) {
    return await this.predictionService.updateStudentBehavior(updateDto);
  }

  /**
   * Bulk update behavior data for all students
   * PUT /api/teacher/prediction/behavior/bulk
   */
  @Put('behavior/bulk')
  async bulkUpdateBehavior(@Body() bulkUpdateDto: BulkUpdateBehaviorDto) {
    return await this.predictionService.bulkUpdateBehavior(bulkUpdateDto);
  }

  /**
   * Send survey notification to students
   * POST /api/teacher/prediction/survey-notification/:uploadId
   */
  @Post('survey-notification/:uploadId')
  async sendSurveyNotification(@Param('uploadId') uploadId: string) {
    return await this.predictionService.sendSurveyNotification(uploadId);
  }

  /**
   * Delete an upload
   * DELETE /api/teacher/prediction/upload/:uploadId
   */
  @Delete('upload/:uploadId')
  async deleteUpload(
    @Param('uploadId') uploadId: string,
    @Query('teacher_id') teacherId?: string,
  ) {
    return await this.predictionService.deleteUpload(uploadId, teacherId);
  }

  /**
   * Run ML prediction for an upload
   * POST /api/teacher/prediction/run/:uploadId
   */
  @Post('run/:uploadId')
  async runPrediction(@Param('uploadId') uploadId: string) {
    try {
      // 1. Lấy dữ liệu từ MongoDB
      const gradeData = await this.predictionService.getStudentsByUploadId(uploadId);
      
      if (!gradeData || !gradeData.students || gradeData.students.length === 0) {
        throw new BadRequestException('No student data found for this upload');
      }

      const courseCode = gradeData.course_code;
      
      // 2. Chuẩn bị data cho Python API
      const studentsForML = gradeData.students.map((student: any, index: number) => {
        const row: any = {
          student_id: student.student_id,
          course_code: courseCode,
          no: index + 1,
          ...student.grades, // attend, quiz, midterm, homework, etc.
        };

        // Thêm behavior features nếu có
        if (student.weekly_study_hours_by_course !== null && student.weekly_study_hours_by_course !== undefined) {
          row.weekly_study_hours_by_course = student.weekly_study_hours_by_course;
        }
        if (student.part_time_hours_by_course !== null && student.part_time_hours_by_course !== undefined) {
          row.part_time_hours_by_course = student.part_time_hours_by_course;
        }
        if (student.financial_support_by_course !== null && student.financial_support_by_course !== undefined) {
          row.financial_support_by_course = student.financial_support_by_course;
        }
        if (student.emotional_support_by_course !== null && student.emotional_support_by_course !== undefined) {
          row.emotional_support_by_course = student.emotional_support_by_course;
        }

        return row;
      });

      // 3. Gọi Python API để dự đoán
      const predictionResult = await this.mlPredictionService.predictScores(
        courseCode,
        studentsForML,
      );

      // 4. Cập nhật prediction vào MongoDB
      const updatePromises = predictionResult.predictions.map((pred) => {
        return this.predictionService.updateStudentPrediction(
          uploadId,
          pred.student_id,
          pred.final_pred,
          pred.confidence_level as 'high' | 'medium' | 'low',
        );
      });

      await Promise.all(updatePromises);

      // 5. Lấy lại dữ liệu đã cập nhật
      const updatedData = await this.predictionService.getStudentsByUploadId(uploadId);

      return {
        success: true,
        message: 'Predictions completed successfully',
        data: updatedData,
        ml_info: {
          total_students: predictionResult.n,
          model_used: 'GradientBoostingRegressor with fallback',
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to run prediction: ${error.message}`,
      );
    }
  }

  /**
   * Get SHAP explanation for students
   * POST /api/teacher/prediction/explain/:uploadId
   */
  @Post('explain/:uploadId')
  async explainPredictions(
    @Param('uploadId') uploadId: string,
    @Body('top_k') topK?: number,
  ) {
    try {
      // 1. Lấy dữ liệu từ MongoDB
      const gradeData = await this.predictionService.getStudentsByUploadId(uploadId);
      
      if (!gradeData || !gradeData.students || gradeData.students.length === 0) {
        throw new BadRequestException('No student data found for this upload');
      }

      const courseCode = gradeData.course_code;
      
      // 2. Chuẩn bị data cho Python API
      const studentsForML = gradeData.students.map((student: any, index: number) => {
        const row: any = {
          student_id: student.student_id,
          course_code: courseCode,
          no: index + 1,
          ...student.grades,
        };

        // Behavior features
        if (student.weekly_study_hours_by_course !== null) {
          row.weekly_study_hours_by_course = student.weekly_study_hours_by_course;
        }
        if (student.part_time_hours_by_course !== null) {
          row.part_time_hours_by_course = student.part_time_hours_by_course;
        }
        if (student.financial_support_by_course !== null) {
          row.financial_support_by_course = student.financial_support_by_course;
        }
        if (student.emotional_support_by_course !== null) {
          row.emotional_support_by_course = student.emotional_support_by_course;
        }

        return row;
      });

      // 3. Gọi Python API để lấy SHAP explanation
      const explanationResult = await this.mlPredictionService.explainPredictions(
        courseCode,
        studentsForML,
        topK || 8,
      );

      return {
        success: true,
        message: 'SHAP explanations retrieved successfully',
        data: explanationResult,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to get explanations: ${error.message}`,
      );
    }
  }

  /**
   * Lấy grade structure và tính điểm cần thiết để pass
   * GET /api/teacher/prediction/:uploadId/pass-threshold
   */
  @Get(':uploadId/pass-threshold')
  async getPassThreshold(@Param('uploadId') uploadId: string) {
    try {
      const result = await this.predictionService.calculatePassThreshold(uploadId);
      return {
        success: true,
        message: 'Pass threshold calculated successfully',
        data: result,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to calculate pass threshold: ${error.message}`,
      );
    }
  }
}
