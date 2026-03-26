import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QuestionFilterDto } from './dto/question-filter.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import {
  QuestionResponse,
  QuestionListResponse,
} from './models/question-response.type';

@Injectable()
export class QuestionManagementService {
  constructor(private prisma: PrismaService) {}

  async findAll(filterDto: QuestionFilterDto): Promise<QuestionListResponse> {
    const { search, category, type, page = 1, limit = 10 } = filterDto;

    const where: {
      AND?: Array<any>;
    } = {};

    const conditions: Array<any> = [];

    // Search filter
    if (search) {
      conditions.push({
        OR: [
          { question_text: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    // Category filter
    if (category && category !== 'all') {
      conditions.push({ category });
    }

    // Type filter
    if (type && type !== 'all') {
      conditions.push({ question_type: type });
    }

    if (conditions.length > 0) {
      where.AND = conditions;
    }

    const total = await this.prisma.surveyQuestion.count({ where });

    const questions = await this.prisma.surveyQuestion.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { question_id: 'desc' },
      include: {
        surveyOptions: true,
      },
    });

    const data: QuestionResponse[] = questions.map((question) => {
      let optionsCount: number | string;

      if (question.question_type === 'text') {
        optionsCount = 'Tự do';
      } else if (question.question_type === 'scale') {
        optionsCount = `${question.max_value || 5} điểm`;
      } else {
        optionsCount = question.surveyOptions.length;
      }

      return {
        questionId: question.question_id,
        questionCode:
          question.code || `Q${String(question.question_id).padStart(3, '0')}`,
        content: question.question_text,
        category: question.category || 'general',
        type: question.question_type || 'text',
        optionsCount,
        createdDate: new Date().toISOString().split('T')[0],
        isActive: question.is_active,
      };
    });

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

  async findOne(id: number): Promise<QuestionResponse> {
    const question = await this.prisma.surveyQuestion.findUnique({
      where: { question_id: id },
      include: {
        surveyOptions: true,
      },
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }

    let optionsCount: number | string;

    if (question.question_type === 'text') {
      optionsCount = 'Tự do';
    } else if (question.question_type === 'scale') {
      optionsCount = `${question.max_value || 5} điểm`;
    } else {
      optionsCount = question.surveyOptions.length;
    }

    return {
      questionId: question.question_id,
      questionCode:
        question.code || `Q${String(question.question_id).padStart(3, '0')}`,
      content: question.question_text,
      category: question.category || 'general',
      type: question.question_type || 'text',
      optionsCount,
      createdDate: new Date().toISOString().split('T')[0],
      isActive: question.is_active,
    };
  }

  async create(createDto: CreateQuestionDto): Promise<QuestionResponse> {
    const { options, ...questionData } = createDto;

    const question = await this.prisma.surveyQuestion.create({
      data: {
        ...questionData,
        surveyOptions: options
          ? {
              create: options,
            }
          : undefined,
      },
      include: {
        surveyOptions: true,
      },
    });

    return this.findOne(question.question_id);
  }

  async update(
    id: number,
    updateDto: UpdateQuestionDto,
  ): Promise<QuestionResponse> {
    const question = await this.prisma.surveyQuestion.findUnique({
      where: { question_id: id },
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }

    const { options, ...questionData } = updateDto as any;

    // Update question and options
    if (options) {
      // Delete old options and create new ones
      await this.prisma.surveyOption.deleteMany({
        where: { question_id: id },
      });

      await this.prisma.surveyQuestion.update({
        where: { question_id: id },
        data: {
          ...questionData,
          surveyOptions: {
            create: options,
          },
        },
      });
    } else {
      await this.prisma.surveyQuestion.update({
        where: { question_id: id },
        data: questionData,
      });
    }

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const question = await this.prisma.surveyQuestion.findUnique({
      where: { question_id: id },
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }

    // Delete related options first
    await this.prisma.surveyOption.deleteMany({
      where: { question_id: id },
    });

    await this.prisma.surveyQuestion.delete({
      where: { question_id: id },
    });
  }

  async deleteMany(ids: number[]): Promise<{ deletedCount: number }> {
    const result = await this.prisma.surveyQuestion.deleteMany({
      where: {
        question_id: {
          in: ids,
        },
      },
    });

    return { deletedCount: result.count };
  }
}
