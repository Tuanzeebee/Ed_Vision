import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { GradeStructureService } from '../services/grade-structure.service';
import { CreateGradeStructureDto } from '../dto/create-grade-structure.dto';
import { UpdateGradeStructureDto } from '../dto/update-grade-structure.dto';
import { DevAuthGuard } from '../../../common/guards/dev-auth.guard';

@Controller('teacher/grade-structure')
@UseGuards(DevAuthGuard)
export class GradeStructureController {
  constructor(private readonly gradeStructureService: GradeStructureService) {}

  /**
   * POST /teacher/grade-structure
   * Tạo mới cấu trúc bảng điểm
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createGradeStructureDto: CreateGradeStructureDto) {
    const result = await this.gradeStructureService.create(createGradeStructureDto);
    return {
      success: true,
      message: 'Tạo cấu trúc bảng điểm thành công!',
      data: result,
    };
  }

  /**
   * GET /teacher/grade-structure
   * Lấy danh sách cấu trúc bảng điểm (có filter)
   */
  @Get()
  async findAll(
    @Query('academicYear') academicYear?: string,
    @Query('semester') semester?: string,
    @Query('courseCode') courseCode?: string,
    @Query('teacherId') teacherId?: string,
    @Query('isActive') isActive?: string,
  ) {
    const filters: any = {};

    if (academicYear) filters.academicYear = academicYear;
    if (semester) filters.semester = parseInt(semester);
    if (courseCode) filters.courseCode = courseCode;
    if (teacherId) filters.teacherId = teacherId;
    if (isActive !== undefined) filters.isActive = isActive === 'true';

    const result = await this.gradeStructureService.findAll(filters);
    return {
      success: true,
      data: result,
    };
  }

  /**
   * GET /teacher/grade-structure/by-course
   * Lấy cấu trúc bảng điểm theo môn học
   */
  @Get('by-course')
  async findByCourse(
    @Query('academicYear') academicYear: string,
    @Query('semester') semester: string,
    @Query('courseCode') courseCode: string,
  ) {
    const result = await this.gradeStructureService.findByCourse(
      academicYear,
      parseInt(semester),
      courseCode,
    );

    if (!result) {
      return {
        success: false,
        message: 'Không tìm thấy cấu trúc bảng điểm cho môn học này',
        data: null,
      };
    }

    return {
      success: true,
      data: result,
    };
  }

  /**
   * GET /teacher/grade-structure/used-keys
   * Lấy danh sách các key đã được sử dụng
   */
  @Get('used-keys')
  async getUsedKeys(
    @Query('academicYear') academicYear: string,
    @Query('semester') semester: string,
    @Query('courseCode') courseCode: string,
  ) {
    const keys = await this.gradeStructureService.getUsedColumnKeys(
      academicYear,
      parseInt(semester),
      courseCode,
    );

    return {
      success: true,
      data: keys,
    };
  }

  /**
   * GET /teacher/grade-structure/:id
   * Lấy một cấu trúc bảng điểm theo ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.gradeStructureService.findOne(id);
    return {
      success: true,
      data: result,
    };
  }

  /**
   * PATCH /teacher/grade-structure/:id
   * Cập nhật cấu trúc bảng điểm
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateGradeStructureDto: UpdateGradeStructureDto,
  ) {
    const result = await this.gradeStructureService.update(
      id,
      updateGradeStructureDto,
    );
    return {
      success: true,
      message: 'Cập nhật cấu trúc bảng điểm thành công!',
      data: result,
    };
  }

  /**
   * DELETE /teacher/grade-structure/:id
   * Xóa (soft delete) cấu trúc bảng điểm
   */
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.gradeStructureService.remove(id);
    return {
      success: true,
      message: 'Đã xóa cấu trúc bảng điểm',
      data: result,
    };
  }

  /**
   * DELETE /teacher/grade-structure/:id/permanent
   * Xóa vĩnh viễn cấu trúc bảng điểm
   */
  @Delete(':id/permanent')
  async hardDelete(@Param('id') id: string) {
    await this.gradeStructureService.hardDelete(id);
    return {
      success: true,
      message: 'Đã xóa vĩnh viễn cấu trúc bảng điểm',
    };
  }

  /**
   * GET /teacher/grade-structure/courses/available
   * Lấy danh sách courses đã có grade structure (có weights)
   * Dùng để populate combobox khi upload prediction
   */
  @Get('courses/available')
  async getAvailableCourses() {
    const courses = await this.gradeStructureService.getAvailableCourses();
    return {
      success: true,
      data: courses,
    };
  }
}
