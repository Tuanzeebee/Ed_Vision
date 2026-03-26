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
import { QuestionManagementService } from './question-management.service';
import { QuestionFilterDto } from './dto/question-filter.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import {
  QuestionResponse,
  QuestionListResponse,
} from './models/question-response.type';

@Controller('admin/questions')
export class QuestionManagementController {
  constructor(
    private readonly questionManagementService: QuestionManagementService,
  ) {}

  @Get()
  async findAll(
    @Query() filterDto: QuestionFilterDto,
  ): Promise<QuestionListResponse> {
    return this.questionManagementService.findAll(filterDto);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<QuestionResponse> {
    return this.questionManagementService.findOne(id);
  }

  @Post()
  async create(
    @Body() createDto: CreateQuestionDto,
  ): Promise<QuestionResponse> {
    return this.questionManagementService.create(createDto);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateQuestionDto,
  ): Promise<QuestionResponse> {
    return this.questionManagementService.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.questionManagementService.remove(id);
  }

  @Delete('bulk')
  async deleteMany(
    @Body('ids') ids: number[],
  ): Promise<{ deletedCount: number }> {
    return this.questionManagementService.deleteMany(ids);
  }
}
