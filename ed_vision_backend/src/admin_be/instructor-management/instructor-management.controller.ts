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
import { InstructorManagementService } from './instructor-management.service';
import { CreateInstructorDto } from './dto/create-instructor.dto';
import { UpdateInstructorDto } from './dto/update-instructor.dto';
import { InstructorFilterDto } from './dto/instructor-filter.dto';
import { InstructorResponse } from './models/instructor-response.type';
import { InstructorListResponse } from './models/instructor-list.type';
import { InstructorOnlineStats } from './models/instructor-stats.type';

@Controller('admin/instructors')
export class InstructorManagementController {
  constructor(
    private readonly instructorManagementService: InstructorManagementService,
  ) {}

  // ===== STATIC ROUTES FIRST =====
  @Get('stats/online')
  async getOnlineStats(): Promise<InstructorOnlineStats> {
    return this.instructorManagementService.getOnlineStats();
  }

  // ===== DYNAMIC ROUTES AFTER =====
  @Get(':id/schedule/filter-options')
  async getScheduleFilterOptions(@Param('id', ParseIntPipe) id: number) {
    return this.instructorManagementService.getScheduleFilterOptions(id);
  }

  @Get(':id/appointments/upcoming')
  async getUpcomingAppointments(
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.instructorManagementService.getUpcomingAppointments(
      id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 5,
    );
  }

  @Get(':id/appointments/history')
  async getAppointmentHistory(
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.instructorManagementService.getAppointmentHistory(
      id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
  }

  @Get(':id/appointments/stats')
  async getAppointmentStats(@Param('id', ParseIntPipe) id: number) {
    return this.instructorManagementService.getAppointmentStats(id);
  }

  @Get(':id/schedule')
  async getInstructorSchedule(
    @Param('id', ParseIntPipe) id: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.instructorManagementService.getInstructorSchedule(
      id,
      startDate,
      endDate,
    );
  }

  // Root level routes
  @Get()
  async findAll(
    @Query() filterDto: InstructorFilterDto,
  ): Promise<InstructorListResponse> {
    return this.instructorManagementService.findAll(filterDto);
  }

  @Post()
  async create(
    @Body() createInstructorDto: CreateInstructorDto,
  ): Promise<InstructorResponse> {
    return this.instructorManagementService.create(createInstructorDto);
  }

  // IMPORTANT: @Get(':id') MUST be LAST among GET routes
  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<InstructorResponse> {
    return this.instructorManagementService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateInstructorDto: UpdateInstructorDto,
  ): Promise<InstructorResponse> {
    return this.instructorManagementService.update(id, updateInstructorDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.instructorManagementService.remove(id);
  }
}
