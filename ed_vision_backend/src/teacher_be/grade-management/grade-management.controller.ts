import { Controller, Get, Post, Body, Query, Param, Req } from '@nestjs/common';
import { GradeManagementService } from './grade-management.service';
import { CreateGradeStructureDto } from './dto/create-grade-structure.dto';
import { PredictionInputDto } from './dto/prediction-input.dto';
import {
  GradeStructureResponse,
  PredictionResponse,
} from './models/grade.type';

@Controller('teacher/grades')
export class GradeManagementController {
  constructor(
    private readonly gradeManagementService: GradeManagementService,
  ) {}

  /**
   * POST /teacher/grades/structure
   * Tạo cấu trúc bảng điểm mới
   */
  @Post('structure')
  async createGradeStructure(
    @Body() createGradeStructureDto: CreateGradeStructureDto,
  ): Promise<GradeStructureResponse> {
    return this.gradeManagementService.createGradeStructure(
      createGradeStructureDto,
    );
  }

  /**
   * GET /teacher/grades/structure
   * Lấy cấu trúc bảng điểm
   */
  @Get('structure')
  async getGradeStructure(
    @Query('classId') classId: string,
    @Query('subjectCode') subjectCode: string,
  ): Promise<GradeStructureResponse> {
    return this.gradeManagementService.getGradeStructure(classId, subjectCode);
  }

  /**
   * POST /teacher/grades/predict
   * Dự đoán điểm dựa trên các yếu tố support
   */
  @Post('predict')
  async predictGrades(
    @Query('classId') classId: string,
    @Body() predictionInputDto: PredictionInputDto,
  ): Promise<PredictionResponse> {
    return this.gradeManagementService.predictGrades(
      classId,
      predictionInputDto,
    );
  }

  /**
   * GET /teacher/grades/export-template
   * Export template Excel cho việc nhập điểm
   */
  @Get('export-template')
  async exportTemplate(@Query('classId') classId: string): Promise<any> {
    return this.gradeManagementService.exportTemplate(classId);
  }

  /**
   * POST /teacher/grades/update
   * Cập nhật điểm cho sinh viên
   */
  @Post('update')
  async updateStudentGrades(
    @Body()
    body: {
      structureId: string;
      studentId: string;
      grades: Record<string, number>;
    },
  ): Promise<{ success: boolean; totalScore: number }> {
    return this.gradeManagementService.updateStudentGrades(
      body.structureId,
      body.studentId,
      body.grades,
    );
  }
}
