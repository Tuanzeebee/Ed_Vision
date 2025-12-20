import {
  Controller,
  Get,
  Post,
  Param,
  Req,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ClassManagementService } from './class-management.service';
import { UploadClassDto } from './dto/upload-class.dto';

@Controller('teacher/class-management')
export class ClassManagementController {
  constructor(
    private readonly classManagementService: ClassManagementService,
  ) {}

  /**
   * GET /teacher/class-management/classes
   * Lấy danh sách các lớp mà giảng viên phụ trách
   */
  @Get('classes')
  async getInstructorClasses(@Req() req: any) {
    const instructorId = req.user?.instructorId || 1;
    return this.classManagementService.getInstructorClasses(instructorId);
  }

  /**
   * GET /teacher/class-management/statistics
   * Lấy thống kê tổng quan
   */
  @Get('statistics')
  async getStatistics(@Req() req: any) {
    const instructorId = req.user?.instructorId || 1;
    return this.classManagementService.getStatistics(instructorId);
  }

  /**
   * GET /teacher/class-management/programs
   * Lấy danh sách chương trình đào tạo
   */
  @Get('programs')
  async getPrograms() {
    return this.classManagementService.getPrograms();
  }

  /**
   * GET /teacher/class-management/classes/:classCode/students
   * Lấy danh sách sinh viên trong lớp
   */
  @Get('classes/:classCode/students')
  async getStudentsByClass(@Param('classCode') classCode: string) {
    return this.classManagementService.getStudentsByClass(classCode);
  }

  /**
   * POST /teacher/class-management/upload-class
   * Upload danh sách lớp từ file Excel/CSV
   */
  @Post('upload-class')
  @UseInterceptors(FileInterceptor('file'))
  async uploadClassList(
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: UploadClassDto,
  ) {
    try {
      const instructorId = req.user?.instructorId || 1;

      if (!file) {
        throw new BadRequestException('No file uploaded');
      }

      console.log('Upload request:', {
        instructorId,
        class_code: uploadDto.class_code,
        filename: file.originalname,
        size: file.size,
      });

      const result = await this.classManagementService.uploadClassList(
        instructorId,
        file,
        uploadDto.class_code,
      );

      console.log('Upload result:', result);
      return result;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }
}
