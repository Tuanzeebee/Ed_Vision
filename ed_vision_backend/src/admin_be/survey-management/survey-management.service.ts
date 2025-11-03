import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { UpdateSurveyDto } from './dto/update-survey.dto';
import { SurveyFilterDto } from './dto/survey-filter.dto';
import { SurveyResponse } from './models/survey-response.type';
import { SurveyListResponse } from './models/survey-list.type';

@Injectable()
export class SurveyManagementService {
  constructor(private prisma: PrismaService) {}

  async findAll(filterDto: SurveyFilterDto): Promise<SurveyListResponse> {
    const { search, isActive, page = 1, limit = 10 } = filterDto;

    const where: {
      OR?: Array<{
        question_text?: { contains: string; mode: 'insensitive' };
        category?: { contains: string; mode: 'insensitive' };
      }>;
      is_active?: boolean;
    } = {};

    if (search) {
      where.OR = [
        { question_text: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.is_active = isActive;
    }

    const total = await this.prisma.surveyQuestion.count({ where });

    const surveys = await this.prisma.surveyQuestion.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { question_id: 'desc' },
    });

    const data: SurveyResponse[] = surveys.map((survey) => ({
      surveyId: survey.question_id,
      title: survey.question_text,
      description: survey.category || undefined,
      startDate: new Date().toISOString(), // Placeholder
      endDate: new Date().toISOString(), // Placeholder
      isActive: survey.is_active,
      createdAt: new Date().toISOString(), // Placeholder
      responseCount: 0, // Placeholder - would need to count surveyAnswers separately
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: number): Promise<SurveyResponse> {
    const survey = await this.prisma.surveyQuestion.findUnique({
      where: { question_id: id },
    });

    if (!survey) {
      throw new NotFoundException(`Survey with ID ${id} not found`);
    }

    return {
      surveyId: survey.question_id,
      title: survey.question_text,
      description: survey.category || undefined,
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      isActive: survey.is_active,
      createdAt: new Date().toISOString(),
      responseCount: 0, // Placeholder
    };
  }

  async create(createSurveyDto: CreateSurveyDto): Promise<SurveyResponse> {
    const survey = await this.prisma.surveyQuestion.create({
      data: {
        question_text: createSurveyDto.title,
        category: createSurveyDto.description,
        question_type: 'text',
        is_active: createSurveyDto.isActive ?? true,
      },
    });

    return this.findOne(survey.question_id);
  }

  async update(
    id: number,
    updateSurveyDto: UpdateSurveyDto,
  ): Promise<SurveyResponse> {
    const survey = await this.prisma.surveyQuestion.findUnique({
      where: { question_id: id },
    });

    if (!survey) {
      throw new NotFoundException(`Survey with ID ${id} not found`);
    }

    await this.prisma.surveyQuestion.update({
      where: { question_id: id },
      data: {
        question_text: updateSurveyDto.title,
        category: updateSurveyDto.description,
        is_active: updateSurveyDto.isActive,
      },
    });

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const survey = await this.prisma.surveyQuestion.findUnique({
      where: { question_id: id },
    });

    if (!survey) {
      throw new NotFoundException(`Survey with ID ${id} not found`);
    }

    await this.prisma.surveyQuestion.delete({
      where: { question_id: id },
    });
  }
}
