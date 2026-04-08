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
import { SurveyManagementService } from './survey-management.service';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { UpdateSurveyDto } from './dto/update-survey.dto';
import { SurveyFilterDto } from './dto/survey-filter.dto';
import { SurveyResponse } from './models/survey-response.type';
import { SurveyListResponse } from './models/survey-list.type';

@Controller('admin/surveys')
export class SurveyManagementController {
  constructor(
    private readonly surveyManagementService: SurveyManagementService,
  ) {}

  @Get()
  async findAll(
    @Query() filterDto: SurveyFilterDto,
  ): Promise<SurveyListResponse> {
    return this.surveyManagementService.findAll(filterDto);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SurveyResponse> {
    return this.surveyManagementService.findOne(id);
  }

  @Post()
  async create(
    @Body() createSurveyDto: CreateSurveyDto,
  ): Promise<SurveyResponse> {
    return this.surveyManagementService.create(createSurveyDto);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSurveyDto: UpdateSurveyDto,
  ): Promise<SurveyResponse> {
    return this.surveyManagementService.update(id, updateSurveyDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.surveyManagementService.remove(id);
  }
}
