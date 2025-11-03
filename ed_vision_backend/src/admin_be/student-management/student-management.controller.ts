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

@Controller('admin/students')
export class StudentManagementController {
  constructor(
    private readonly studentManagementService: StudentManagementService,
  ) {}

  @Get()
  async findAll(
    @Query() filterDto: StudentFilterDto,
  ): Promise<StudentListResponse> {
    return this.studentManagementService.findAll(filterDto);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<StudentResponse> {
    return this.studentManagementService.findOne(id);
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
}
