import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { StudentManagementService } from './student-management.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { StudentFilterDto } from './dto/student-filter.dto';
import { StudentResponse } from './models/student-response.type';
import { StudentListResponse } from './models/student-list.type';
import { StudentOnlineStats } from './models/student-stats.type';
import { StudentDirectoryFilterDto } from './dto/student-directory-filter.dto';
import {
  StudentDirectoryResponse,
  StudentDirectoryStats,
  StudentDetailResponse,
} from './models/student-directory.types';

@Controller('admin/students')
export class StudentManagementController {
  constructor(
    private readonly studentManagementService: StudentManagementService,
  ) {}

  @Get('stats/online')
  async getOnlineStats(): Promise<StudentOnlineStats> {
    return this.studentManagementService.getOnlineStats();
  }

  @Get('filters/options')
  async getFilterOptions() {
    return this.studentManagementService.getFilterOptions();
  }

  @Get()
  async findAll(
    @Query() filterDto: StudentFilterDto,
  ): Promise<StudentListResponse> {
    return this.studentManagementService.findAll(filterDto);
  }

  @Post()
  async create(
    @Body() createStudentDto: CreateStudentDto,
  ): Promise<StudentResponse> {
    return this.studentManagementService.create(createStudentDto);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStudentDto: UpdateStudentDto,
  ): Promise<StudentResponse> {
    return this.studentManagementService.update(id, updateStudentDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.studentManagementService.remove(id);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STUDENT DIRECTORY DASHBOARD ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get statistics for Student Directory Dashboard
   * Returns: total students, IELTS/TOEIC counts, active students, at-risk count
   */
  @Get('directory/stats')
  async getDirectoryStats(): Promise<StudentDirectoryStats> {
    return this.studentManagementService.getDirectoryStats();
  }

  /**
   * Get students list for Directory Dashboard with filters
   * Supports: search, certType, learningStatus, riskLevel, department, cohortYear
   */
  @Get('directory')
  async findAllForDirectory(
    @Query() query: any,
  ): Promise<StudentDirectoryResponse> {
    // Handle conversion manually to bypass validation
    const pageParsed = query.page ? parseInt(query.page, 10) : NaN;
    const limitParsed = query.limit ? parseInt(query.limit, 10) : NaN;
    const cohortYearParsed = query.cohortYear ? parseInt(query.cohortYear, 10) : NaN;

    const page = isNaN(pageParsed) || pageParsed < 1 ? 1 : pageParsed;
    const limit = isNaN(limitParsed) || limitParsed < 1 ? 10 : limitParsed;
    const cohortYear = isNaN(cohortYearParsed) ? undefined : cohortYearParsed;

    console.log('Query params:', query);
    console.log('Parsed params:', { page, limit, cohortYear, sortBy: query.sortBy, sortOrder: query.sortOrder });

    return this.studentManagementService.findAllForDirectory({
      search: query.search || undefined,
      certType: query.certType || undefined,
      learningStatus: query.learningStatus || undefined,
      riskLevel: query.riskLevel || undefined,
      department: query.department || undefined,
      cohortYear,
      page,
      limit,
      sortBy: query.sortBy || 'student_id',
      sortOrder: query.sortOrder || 'desc',
    });
  }

  /**
   * Get detailed student info for Directory Dashboard
   * Includes: profile, test results, skill progress, recent activities
   */
  @Get('directory/:id')
  async findOneForDirectory(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<StudentDetailResponse> {
    return this.studentManagementService.findOneForDirectory(id);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<StudentResponse> {
    return this.studentManagementService.findOne(id);
  }
}
