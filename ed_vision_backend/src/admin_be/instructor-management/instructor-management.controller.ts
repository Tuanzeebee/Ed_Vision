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

  @Get('stats/online')
  async getOnlineStats(): Promise<InstructorOnlineStats> {
    return this.instructorManagementService.getOnlineStats();
  }

  @Get()
  async findAll(
    @Query() filterDto: InstructorFilterDto,
  ): Promise<InstructorListResponse> {
    return this.instructorManagementService.findAll(filterDto);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<InstructorResponse> {
    return this.instructorManagementService.findOne(id);
  }

  @Post()
  async create(
    @Body() createInstructorDto: CreateInstructorDto,
  ): Promise<InstructorResponse> {
    return this.instructorManagementService.create(createInstructorDto);
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
