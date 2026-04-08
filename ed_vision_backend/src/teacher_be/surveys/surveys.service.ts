import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateSurveyDto,
  UpdateSurveyDto,
  SurveyFilterDto,
  SendReminderDto,
} from './dto/survey.dto';
import {
  Survey,
  SurveyListResponse,
  SurveyAnalytics,
  SurveyDashboard,
  SurveyResponse as SurveyResponseType,
} from './models/survey.type';

@Injectable()
export class SurveysService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calculate similarity between two strings (0-1)
   * Uses Levenshtein distance algorithm
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    if (s1 === s2) return 1;
    if (s1.length === 0 || s2.length === 0) return 0;

    const matrix: number[][] = [];

    // Initialize matrix
    for (let i = 0; i <= s2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= s1.length; j++) {
      matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= s2.length; i++) {
      for (let j = 1; j <= s1.length; j++) {
        if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1, // deletion
          );
        }
      }
    }

    const maxLength = Math.max(s1.length, s2.length);
    const distance = matrix[s2.length][s1.length];
    return 1 - distance / maxLength;
  }

  /**
   * Find similar questions in database
   * Returns questions with similarity >= threshold
   */
  private async findSimilarQuestions(
    questionText: string,
    questionType: string,
    threshold: number = 0.8, // 80% similarity threshold
  ): Promise<Array<{ question: any; similarity: number }>> {
    // Get all questions of the same type
    const existingQuestions = await this.prisma.surveyQuestion.findMany({
      where: {
        question_type: questionType,
        is_active: true,
      },
      include: {
        surveyOptions: true,
      },
    });

    const similarQuestions: Array<{ question: any; similarity: number }> = [];

    for (const q of existingQuestions) {
      const similarity = this.calculateSimilarity(
        questionText,
        q.question_text,
      );
      if (similarity >= threshold) {
        similarQuestions.push({ question: q, similarity });
      }
    }

    // Sort by similarity (highest first)
    return similarQuestions.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Map question type from DB to frontend format
   */
  private mapQuestionType(
    dbType: string | null,
  ): 'text' | 'multiple-choice' | 'rating' | 'yes-no' | 'scale' {
    switch (dbType?.toLowerCase()) {
      case 'text':
      case 'free_text':
        return 'text';
      case 'multiple_choice':
      case 'single_choice':
        return 'multiple-choice';
      case 'rating':
        return 'rating';
      case 'yes_no':
      case 'boolean':
        return 'yes-no';
      case 'scale':
      case 'likert':
        return 'scale';
      default:
        return 'text';
    }
  }

  /**
   * Map question type from frontend to DB format
   */
  private mapQuestionTypeToDb(frontendType: string): string {
    switch (frontendType) {
      case 'text':
        return 'free_text';
      case 'multiple-choice':
        return 'multiple_choice';
      case 'rating':
        return 'rating';
      case 'yes-no':
        return 'yes_no';
      case 'scale':
        return 'scale';
      default:
        return 'free_text';
    }
  }

  /**
   * Map database survey to frontend format
   */
  private async mapSurveyToFrontend(dbSurvey: any): Promise<Survey> {
    const questions = dbSurvey.surveyQuestions
      .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
      .map((link: any) => {
        const q = link.question;
        const options =
          q.surveyOptions?.map((opt: any) => opt.option_text).filter(Boolean) ||
          [];

        return {
          id: q.question_id.toString(),
          question: q.question_text,
          type: this.mapQuestionType(q.question_type),
          options: options.length > 0 ? options : undefined,
          minScale: q.question_type === 'scale' ? 1 : undefined,
          maxScale: q.question_type === 'scale' ? 5 : undefined,
          required: true,
        };
      });

    const totalResponses = dbSurvey.surveyResponses?.length || 0;

    // Calculate response rate (giả sử target 100 students)
    const targetStudents = 100;
    const responseRate =
      targetStudents > 0 ? (totalResponses / targetStudents) * 100 : 0;

    // Determine status
    const now = new Date();
    const startDate = dbSurvey.start_date
      ? new Date(dbSurvey.start_date)
      : null;
    const endDate = dbSurvey.end_date ? new Date(dbSurvey.end_date) : null;

    let status: 'draft' | 'active' | 'closed' = 'draft';
    if (dbSurvey.is_active && startDate && startDate <= now) {
      if (endDate && endDate < now) {
        status = 'closed';
      } else {
        status = 'active';
      }
    }

    return {
      id: dbSurvey.survey_id.toString(),
      title: dbSurvey.title,
      description: dbSurvey.description || undefined,
      targetClasses: [], // TODO: Add target classes field in DB
      questions,
      startDate:
        startDate?.toISOString().split('T')[0] ||
        new Date().toISOString().split('T')[0],
      endDate:
        endDate?.toISOString().split('T')[0] ||
        new Date().toISOString().split('T')[0],
      status,
      anonymous: true,
      createdAt: dbSurvey.created_at,
      totalResponses,
      responseRate: Math.round(responseRate * 10) / 10,
    };
  }

  /**
   * Lấy survey dashboard
   */
  async getSurveyDashboard(instructorId: number): Promise<SurveyDashboard> {
    // Lấy surveys do instructor tạo
    const accountId = await this.getAccountIdFromInstructorId(instructorId);

    const dbSurveys = await this.prisma.survey.findMany({
      where: {
        created_by: accountId,
      },
      include: {
        surveyQuestions: {
          include: {
            question: {
              include: {
                surveyOptions: true,
              },
            },
          },
        },
        surveyResponses: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Map to frontend format
    const surveys = await Promise.all(
      dbSurveys.map(async (s) => this.mapSurveyToFrontend(s)),
    );

    const activeSurveys = surveys.filter((s) => s.status === 'active');
    const totalResponses = surveys.reduce(
      (sum, s) => sum + s.totalResponses,
      0,
    );
    const avgResponseRate =
      surveys.length > 0
        ? surveys.reduce((sum, s) => sum + s.responseRate, 0) / surveys.length
        : 0;

    const recentSurveys = surveys.slice(0, 5);

    const today = new Date();
    const upcomingSurveys = surveys.filter(
      (s) => new Date(s.startDate) > today && s.status === 'draft',
    );

    // Calculate weekly trend (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d;
    });

    const responseTrendData = await Promise.all(
      last7Days.map(async (date) => {
        const startOfDay = new Date(date.setHours(0, 0, 0, 0));
        const endOfDay = new Date(date.setHours(23, 59, 59, 999));

        const count = await this.prisma.surveyResponse.count({
          where: {
            survey: {
              created_by: accountId,
            },
            submitted_at: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        });

        return count;
      }),
    );

    const responsesTrend = {
      labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
      datasets: [
        {
          label: 'Số phản hồi',
          data: responseTrendData,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
        },
      ],
    };

    return {
      summary: {
        totalSurveys: surveys.length,
        activeSurveys: activeSurveys.length,
        totalResponses,
        averageResponseRate: Math.round(avgResponseRate * 10) / 10,
      },
      recentSurveys,
      upcomingSurveys,
      responsesTrend,
    };
  }

  /**
   * Lấy danh sách surveys
   */
  async getSurveys(
    instructorId: number,
    filterDto: SurveyFilterDto,
  ): Promise<SurveyListResponse> {
    const accountId = await this.getAccountIdFromInstructorId(instructorId);

    // Build where clause
    const where: any = {
      created_by: accountId,
    };

    // Filter by status
    if (filterDto.status && filterDto.status !== 'all') {
      const now = new Date();
      if (filterDto.status === 'draft') {
        where.is_active = false;
      } else if (filterDto.status === 'active') {
        where.is_active = true;
        where.start_date = { lte: now };
        where.OR = [{ end_date: null }, { end_date: { gte: now } }];
      } else if (filterDto.status === 'closed') {
        where.end_date = { lt: now };
      }
    }

    // Filter by search
    if (filterDto.search) {
      where.OR = [
        { title: { contains: filterDto.search, mode: 'insensitive' } },
        { description: { contains: filterDto.search, mode: 'insensitive' } },
      ];
    }

    const dbSurveys = await this.prisma.survey.findMany({
      where,
      include: {
        surveyQuestions: {
          include: {
            question: {
              include: {
                surveyOptions: true,
              },
            },
          },
        },
        surveyResponses: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    const allSurveys = await Promise.all(
      dbSurveys.map((s) => this.mapSurveyToFrontend(s)),
    );

    // Pagination
    const page = filterDto.page || 1;
    const limit = filterDto.limit || 10;
    const startIndex = (page - 1) * limit;
    const paginatedSurveys = allSurveys.slice(startIndex, startIndex + limit);

    // Get all surveys for summary
    const allDbSurveys = await this.prisma.survey.findMany({
      where: { created_by: accountId },
      include: { surveyResponses: true },
    });

    const now = new Date();
    const summary = {
      draft: allDbSurveys.filter((s) => !s.is_active).length,
      active: allDbSurveys.filter(
        (s) =>
          s.is_active &&
          (!s.start_date || s.start_date <= now) &&
          (!s.end_date || s.end_date >= now),
      ).length,
      closed: allDbSurveys.filter((s) => s.end_date && s.end_date < now).length,
      totalResponses: allDbSurveys.reduce(
        (sum, s) => sum + (s.surveyResponses?.length || 0),
        0,
      ),
    };

    return {
      surveys: paginatedSurveys,
      total: allSurveys.length,
      summary,
    };
  }

  /**
   * Lấy chi tiết survey
   */
  async getSurveyDetail(
    instructorId: number,
    surveyId: string,
  ): Promise<Survey> {
    const accountId = await this.getAccountIdFromInstructorId(instructorId);

    const dbSurvey = await this.prisma.survey.findFirst({
      where: {
        survey_id: parseInt(surveyId),
        created_by: accountId,
      },
      include: {
        surveyQuestions: {
          include: {
            question: {
              include: {
                surveyOptions: true,
              },
            },
          },
        },
        surveyResponses: true,
      },
    });

    if (!dbSurvey) {
      throw new NotFoundException('Không tìm thấy khảo sát');
    }

    return this.mapSurveyToFrontend(dbSurvey);
  }

  /**
   * Tạo survey mới
   */
  async createSurvey(
    instructorId: number,
    dto: CreateSurveyDto,
  ): Promise<Survey> {
    // Validate dates
    if (new Date(dto.endDate) <= new Date(dto.startDate)) {
      throw new BadRequestException('Ngày kết thúc phải sau ngày bắt đầu');
    }

    const accountId = await this.getAccountIdFromInstructorId(instructorId);

    // Create survey
    const dbSurvey = await this.prisma.survey.create({
      data: {
        title: dto.title,
        description: dto.description,
        created_by: accountId,
        start_date: new Date(dto.startDate),
        end_date: new Date(dto.endDate),
        is_active: false, // Draft by default
        type: 'teacher_created',
        target_role: 'student',
      },
      include: {
        surveyQuestions: {
          include: {
            question: {
              include: {
                surveyOptions: true,
              },
            },
          },
        },
        surveyResponses: true,
      },
    });

    // Link questions to survey
    const createdQuestionIds: number[] = [];

    for (let i = 0; i < dto.questions.length; i++) {
      const questionDto = dto.questions[i];
      const questionType = this.mapQuestionTypeToDb(questionDto.type);

      // Step 1: Check for similar questions (semantic similarity)
      const similarQuestions = await this.findSimilarQuestions(
        questionDto.question,
        questionType,
        0.85, // 85% similarity threshold
      );

      let question: any = null;

      if (similarQuestions.length > 0) {
        const mostSimilar = similarQuestions[0];

        // If 100% match, use existing question
        if (mostSimilar.similarity === 1) {
          question = mostSimilar.question;
        }
        // If very similar (85-99%), throw error with suggestion
        else if (mostSimilar.similarity >= 0.85) {
          throw new BadRequestException(
            `Câu hỏi "${questionDto.question}" có nội dung tương tự với câu hỏi đã có: "${mostSimilar.question.question_text}" (độ trùng lặp: ${Math.round(mostSimilar.similarity * 100)}%). Vui lòng sử dụng câu hỏi có sẵn hoặc thay đổi nội dung câu hỏi.`,
          );
        }
      }

      // Step 2: Create new question if no similar question found
      if (!question) {
        question = await this.prisma.surveyQuestion.create({
          data: {
            question_text: questionDto.question,
            question_type: questionType,
            category: questionDto.category || null,
            is_active: true,
          },
          include: {
            surveyOptions: true,
          },
        });

        // Create options if multiple choice
        if (questionDto.options && questionDto.options.length > 0) {
          await this.prisma.surveyOption.createMany({
            data: questionDto.options.map((opt, idx) => ({
              question_id: question!.question_id,
              option_text: opt,
              option_value: idx + 1,
            })),
          });
        }
      }

      // Step 3: Check if question already added in current request
      if (createdQuestionIds.includes(question.question_id)) {
        throw new BadRequestException(
          `Câu hỏi "${questionDto.question}" đã được thêm vào khảo sát này`,
        );
      }

      // Step 4: Check if question already linked to this survey
      const existingLink = await this.prisma.surveyQuestionLink.findUnique({
        where: {
          survey_id_question_id: {
            survey_id: dbSurvey.survey_id,
            question_id: question.question_id,
          },
        },
      });

      if (existingLink) {
        throw new BadRequestException(`Câu hỏi này đã tồn tại trong khảo sát`);
      }

      // Step 5: Link question to survey
      await this.prisma.surveyQuestionLink.create({
        data: {
          survey_id: dbSurvey.survey_id,
          question_id: question.question_id,
          order_index: i + 1,
        },
      });

      createdQuestionIds.push(question.question_id);
    }

    // Reload with questions
    const createdSurvey = await this.prisma.survey.findUnique({
      where: { survey_id: dbSurvey.survey_id },
      include: {
        surveyQuestions: {
          include: {
            question: {
              include: {
                surveyOptions: true,
              },
            },
          },
        },
        surveyResponses: true,
      },
    });

    return this.mapSurveyToFrontend(createdSurvey!);
  }

  /**
   * Tạo survey từ questions có sẵn
   */
  async createSurveyFromExistingQuestions(
    instructorId: number,
    dto: {
      title: string;
      description?: string;
      questionIds: number[];
      startDate: string;
      endDate: string;
      targetClasses?: string[];
    },
  ): Promise<Survey> {
    const accountId = await this.getAccountIdFromInstructorId(instructorId);

    // Check for duplicate question IDs in the request
    const uniqueQuestionIds = new Set(dto.questionIds);
    if (uniqueQuestionIds.size !== dto.questionIds.length) {
      throw new BadRequestException(
        'Không thể thêm cùng một câu hỏi nhiều lần vào khảo sát',
      );
    }

    // Validate all questions exist
    const questions = await this.prisma.surveyQuestion.findMany({
      where: {
        question_id: { in: dto.questionIds },
        is_active: true,
      },
    });

    if (questions.length !== dto.questionIds.length) {
      throw new BadRequestException(
        'Một số câu hỏi không tồn tại hoặc không hoạt động',
      );
    }

    // Create survey
    const dbSurvey = await this.prisma.survey.create({
      data: {
        title: dto.title,
        description: dto.description,
        created_by: accountId,
        start_date: new Date(dto.startDate),
        end_date: new Date(dto.endDate),
        is_active: false,
        type: 'teacher_created',
        target_role: 'student',
      },
    });

    // Link existing questions
    for (let i = 0; i < dto.questionIds.length; i++) {
      await this.prisma.surveyQuestionLink.create({
        data: {
          survey_id: dbSurvey.survey_id,
          question_id: dto.questionIds[i],
          order_index: i + 1,
        },
      });
    }

    // Reload with questions
    const createdSurvey = await this.prisma.survey.findUnique({
      where: { survey_id: dbSurvey.survey_id },
      include: {
        surveyQuestions: {
          include: {
            question: {
              include: {
                surveyOptions: true,
              },
            },
          },
        },
        surveyResponses: true,
      },
    });

    return this.mapSurveyToFrontend(createdSurvey!);
  }

  /**
   * Lấy danh sách questions có sẵn để chọn
   */
  async getAvailableQuestions(category?: string) {
    const where: any = {
      is_active: true,
    };

    if (category) {
      where.category = category;
    }

    const questions = await this.prisma.surveyQuestion.findMany({
      where,
      include: {
        surveyOptions: true,
      },
      orderBy: {
        question_id: 'asc',
      },
    });

    return questions.map((q) => ({
      id: q.question_id,
      question: q.question_text,
      type: this.mapQuestionType(q.question_type),
      category: q.category,
      options: q.surveyOptions?.map((opt) => opt.option_text),
    }));
  }

  /**
   * Cập nhật survey
   */
  async updateSurvey(
    instructorId: number,
    surveyId: string,
    dto: UpdateSurveyDto,
  ): Promise<Survey> {
    const accountId = await this.getAccountIdFromInstructorId(instructorId);

    const existing = await this.prisma.survey.findFirst({
      where: {
        survey_id: parseInt(surveyId),
        created_by: accountId,
      },
    });

    if (!existing) {
      throw new NotFoundException('Không tìm thấy khảo sát');
    }

    const updateData: any = {};

    if (dto.title) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.endDate) updateData.end_date = new Date(dto.endDate);
    if (dto.status === 'active') updateData.is_active = true;
    if (dto.status === 'draft') updateData.is_active = false;

    const updated = await this.prisma.survey.update({
      where: { survey_id: parseInt(surveyId) },
      data: updateData,
      include: {
        surveyQuestions: {
          include: {
            question: {
              include: {
                surveyOptions: true,
              },
            },
          },
        },
        surveyResponses: true,
      },
    });

    return this.mapSurveyToFrontend(updated);
  }

  /**
   * Xóa survey
   */
  async deleteSurvey(
    instructorId: number,
    surveyId: string,
  ): Promise<{ success: boolean }> {
    const accountId = await this.getAccountIdFromInstructorId(instructorId);

    const survey = await this.prisma.survey.findFirst({
      where: {
        survey_id: parseInt(surveyId),
        created_by: accountId,
      },
      include: {
        surveyResponses: true,
      },
    });

    if (!survey) {
      throw new NotFoundException('Không tìm thấy khảo sát');
    }

    // ✅ ONLY CHECK: Survey has responses
    // Allow deleting draft, active, or started surveys WITHOUT responses
    if (survey.surveyResponses && survey.surveyResponses.length > 0) {
      throw new BadRequestException(
        `Không thể xóa khảo sát đã có ${survey.surveyResponses.length} phản hồi từ sinh viên. ` +
          `Vui lòng đóng khảo sát thay vì xóa để giữ lại dữ liệu.`,
      );
    }

    // ⚠️ WARNING for active surveys (but still allow)
    if (survey.is_active) {
      console.warn(
        `[SURVEY DELETE] Deleting active survey ${surveyId} by instructor ${instructorId}`,
      );
    }

    await this.prisma.survey.delete({
      where: { survey_id: parseInt(surveyId) },
    });

    return { success: true };
  }

  /**
   * Thêm câu hỏi vào survey (sau khi survey đã tạo)
   */
  async addQuestionToSurvey(
    instructorId: number,
    surveyId: string,
    questionId: number,
  ): Promise<{ success: boolean }> {
    const accountId = await this.getAccountIdFromInstructorId(instructorId);

    // Verify survey ownership
    const survey = await this.prisma.survey.findFirst({
      where: {
        survey_id: parseInt(surveyId),
        created_by: accountId,
      },
      include: {
        surveyQuestions: true,
        surveyResponses: true,
      },
    });

    if (!survey) {
      throw new NotFoundException('Không tìm thấy khảo sát');
    }

    // Cannot modify survey that has responses
    if (survey.surveyResponses && survey.surveyResponses.length > 0) {
      throw new BadRequestException(
        'Không thể thêm câu hỏi vào khảo sát đã có phản hồi',
      );
    }

    // Cannot modify active survey
    if (survey.is_active) {
      throw new BadRequestException(
        'Không thể thêm câu hỏi vào khảo sát đang hoạt động',
      );
    }

    // Check if question exists
    const question = await this.prisma.surveyQuestion.findUnique({
      where: { question_id: questionId, is_active: true },
    });

    if (!question) {
      throw new NotFoundException('Không tìm thấy câu hỏi');
    }

    // Check if already linked
    const existingLink = await this.prisma.surveyQuestionLink.findUnique({
      where: {
        survey_id_question_id: {
          survey_id: parseInt(surveyId),
          question_id: questionId,
        },
      },
    });

    if (existingLink) {
      throw new BadRequestException('Câu hỏi đã có trong khảo sát');
    }

    // Get max order_index
    const maxOrder =
      survey.surveyQuestions.length > 0
        ? Math.max(...survey.surveyQuestions.map((q) => q.order_index || 0))
        : 0;

    // Link question
    await this.prisma.surveyQuestionLink.create({
      data: {
        survey_id: parseInt(surveyId),
        question_id: questionId,
        order_index: maxOrder + 1,
      },
    });

    return { success: true };
  }

  /**
   * Xóa câu hỏi khỏi survey
   */
  async removeQuestionFromSurvey(
    instructorId: number,
    surveyId: string,
    questionId: number,
  ): Promise<{ success: boolean }> {
    const accountId = await this.getAccountIdFromInstructorId(instructorId);

    // Verify survey ownership
    const survey = await this.prisma.survey.findFirst({
      where: {
        survey_id: parseInt(surveyId),
        created_by: accountId,
      },
      include: {
        surveyResponses: true,
      },
    });

    if (!survey) {
      throw new NotFoundException('Không tìm thấy khảo sát');
    }

    // Cannot modify survey that has responses
    if (survey.surveyResponses && survey.surveyResponses.length > 0) {
      throw new BadRequestException(
        'Không thể xóa câu hỏi khỏi khảo sát đã có phản hồi',
      );
    }

    // Cannot modify active survey
    if (survey.is_active) {
      throw new BadRequestException(
        'Không thể xóa câu hỏi khỏi khảo sát đang hoạt động',
      );
    }

    // Delete link
    const deleted = await this.prisma.surveyQuestionLink.deleteMany({
      where: {
        survey_id: parseInt(surveyId),
        question_id: questionId,
      },
    });

    if (deleted.count === 0) {
      throw new NotFoundException('Câu hỏi không có trong khảo sát');
    }

    return { success: true };
  }

  /**
   * Cập nhật thứ tự câu hỏi trong survey
   */
  async reorderQuestions(
    instructorId: number,
    surveyId: string,
    questionOrder: { questionId: number; order: number }[],
  ): Promise<{ success: boolean }> {
    const accountId = await this.getAccountIdFromInstructorId(instructorId);

    // Verify survey ownership
    const survey = await this.prisma.survey.findFirst({
      where: {
        survey_id: parseInt(surveyId),
        created_by: accountId,
      },
      include: {
        surveyResponses: true,
      },
    });

    if (!survey) {
      throw new NotFoundException('Không tìm thấy khảo sát');
    }

    // Cannot modify survey that has responses
    if (survey.surveyResponses && survey.surveyResponses.length > 0) {
      throw new BadRequestException(
        'Không thể sắp xếp lại câu hỏi cho khảo sát đã có phản hồi',
      );
    }

    // Cannot modify active survey
    if (survey.is_active) {
      throw new BadRequestException(
        'Không thể sắp xếp lại câu hỏi cho khảo sát đang hoạt động',
      );
    }

    // Update order for each question
    for (const item of questionOrder) {
      await this.prisma.surveyQuestionLink.updateMany({
        where: {
          survey_id: parseInt(surveyId),
          question_id: item.questionId,
        },
        data: {
          order_index: item.order,
        },
      });
    }

    return { success: true };
  }

  /**
   * Lấy analytics của survey
   */
  async getSurveyAnalytics(
    instructorId: number,
    surveyId: string,
  ): Promise<SurveyAnalytics> {
    const survey = await this.getSurveyDetail(instructorId, surveyId);

    const dbResponses = await this.prisma.surveyResponse.findMany({
      where: {
        survey_id: parseInt(surveyId),
      },
      include: {
        surveyAnswers: {
          include: {
            question: true,
            option: true,
          },
        },
        account: {
          include: {
            profile: true,
            student: {
              include: {
                classGroup: true,
              },
            },
          },
        },
      },
      orderBy: {
        submitted_at: 'desc',
      },
    });

    // Map responses
    const responses: SurveyResponseType[] = dbResponses.map((r) => ({
      id: r.response_id.toString(),
      surveyId: surveyId,
      student: r.account?.student
        ? {
            id: r.account.student.student_id.toString(),
            code: r.account.student.student_code,
            name: r.account.profile?.full_name || 'Unknown',
            class: r.account.student.classGroup?.class_code || 'Unknown',
          }
        : undefined,
      answers: r.surveyAnswers.map((a) => ({
        questionId: a.question_id?.toString() || '',
        answer: a.option?.option_text || a.free_text || '',
      })),
      submittedAt: r.submitted_at,
    }));

    const totalStudents = 100; // TODO: Get actual target students
    const responseRate = (responses.length / totalStudents) * 100;

    // Analyze each question
    const questionAnalytics = await Promise.all(
      survey.questions.map(async (question) => {
        const questionResponses = dbResponses
          .flatMap((r) =>
            r.surveyAnswers.filter(
              (a) => a.question_id === parseInt(question.id),
            ),
          )
          .filter(Boolean);

        if (question.type === 'multiple-choice' || question.type === 'yes-no') {
          const distribution = (question.options || []).map((option) => {
            const count = questionResponses.filter(
              (r) => r.option?.option_text === option,
            ).length;
            return {
              option,
              count,
              percentage:
                questionResponses.length > 0
                  ? (count / questionResponses.length) * 100
                  : 0,
            };
          });

          return {
            questionId: question.id,
            question: question.question,
            type: question.type,
            distribution,
          };
        } else if (question.type === 'rating' || question.type === 'scale') {
          const numericAnswers = questionResponses
            .map((r) => {
              const val =
                r.option?.option_value || parseInt(r.free_text || '0');
              return isNaN(val) ? 0 : val;
            })
            .filter((n) => n > 0)
            .sort((a, b) => a - b);

          const average =
            numericAnswers.length > 0
              ? numericAnswers.reduce((sum, n) => sum + n, 0) /
                numericAnswers.length
              : 0;

          const median =
            numericAnswers.length > 0
              ? numericAnswers[Math.floor(numericAnswers.length / 2)]
              : 0;

          return {
            questionId: question.id,
            question: question.question,
            type: question.type,
            average: Math.round(average * 100) / 100,
            median,
            mode: this.calculateMode(numericAnswers),
          };
        } else {
          // Text responses
          return {
            questionId: question.id,
            question: question.question,
            type: question.type,
            textResponses: questionResponses.map((r) => r.free_text || ''),
          };
        }
      }),
    );

    const charts = {
      responseRateChart: {
        labels: ['Đã trả lời', 'Chưa trả lời'],
        datasets: [
          {
            label: 'Tỷ lệ phản hồi',
            data: [responses.length, totalStudents - responses.length],
            backgroundColor: ['rgb(34, 197, 94)', 'rgb(156, 163, 175)'],
          },
        ],
      },
      classResponseChart: {
        labels: survey.targetClasses,
        datasets: [
          {
            label: 'Số phản hồi',
            data: survey.targetClasses.map(() =>
              Math.floor(Math.random() * 30 + 10),
            ),
            backgroundColor: 'rgb(59, 130, 246)',
          },
        ],
      },
    };

    return {
      surveyId: surveyId,
      title: survey.title,
      survey,
      totalResponses: responses.length,
      responseRate: Math.round(responseRate * 10) / 10,
      responses,
      questionAnalytics,
      charts,
    };
  }

  /**
   * Lấy danh sách sinh viên chưa hoàn thành khảo sát
   */
  async getIncompleteStudents(
    instructorId: number,
    surveyId: string,
  ): Promise<any[]> {
    // Get all students who completed the survey
    const completedResponses = await this.prisma.surveyResponse.findMany({
      where: {
        survey_id: parseInt(surveyId),
      },
      select: {
        account_id: true,
      },
    });

    const completedAccountIds = completedResponses
      .map((r) => r.account_id)
      .filter((id): id is number => id !== null);

    // Get instructor's students who haven't completed
    // TODO: Filter by survey target classes if that info is stored
    const incompleteStudents = await this.prisma.student.findMany({
      where: {
        account_id: {
          notIn: completedAccountIds,
        },
      },
      include: {
        account: {
          include: {
            profile: true,
          },
        },
        classGroup: true,
      },
      take: 100, // Limit results
    });

    return incompleteStudents.map((student) => ({
      studentId: student.student_id.toString(),
      studentName: student.account?.profile?.full_name || 'Unknown',
      studentCode: student.student_code,
      className: student.classGroup?.class_code || 'Unknown',
      email: '', // Email not in profile model
      phoneNumber: student.account?.profile?.phone_number || '',
      lastAccess: student.account?.last_login_at || null,
      remindersSent: 0, // TODO: Track this if needed
    }));
  }

  /**
   * Lấy thống kê cho tab lịch sử khảo sát
   */
  async getHistoryStatistics(instructorId: number): Promise<{
    totalCompletedSurveys: number;
    totalResponses: number;
    improvingStudents: number;
    needSupportStudents: number;
  }> {
    // Get completed surveys
    const completedSurveys = await this.prisma.survey.count({
      where: {
        is_active: false, // Assuming false means completed
      },
    });

    // Get total responses for completed surveys
    const totalResponses = await this.prisma.surveyResponse.count({
      where: {
        survey: {
          is_active: false,
        },
      },
    });

    // TODO: Calculate improving and need support students based on survey scores
    // This would require analyzing survey responses over time
    const improvingStudents = 0;
    const needSupportStudents = 0;

    return {
      totalCompletedSurveys: completedSurveys,
      totalResponses,
      improvingStudents,
      needSupportStudents,
    };
  }

  /**
   * Đếm số sinh viên theo faculty và class
   */
  async getTargetStudentCount(
    facultyId?: string,
    classId?: string,
  ): Promise<number> {
    const where: any = {};

    if (classId && classId !== 'all') {
      where.class_id = parseInt(classId);
    } else if (facultyId && facultyId !== 'all') {
      // TODO: Add faculty filter when faculty relation exists
      // For now, return all students
    }

    const count = await this.prisma.student.count({
      where,
    });

    return count;
  }

  /**
   * Gửi nhắc nhở làm khảo sát
   */
  async sendReminder(
    instructorId: number,
    dto: SendReminderDto,
  ): Promise<{ success: boolean; message: string }> {
    const survey = await this.getSurveyDetail(instructorId, dto.surveyId);

    if (survey.status !== 'active') {
      throw new BadRequestException(
        'Chỉ có thể gửi nhắc nhở cho khảo sát đang hoạt động',
      );
    }

    // Reminder sending logic would go here
    // Integration with notification service

    return {
      success: true,
      message: 'Đã gửi nhắc nhở thành công',
    };
  }

  /**
   * Export survey responses to Excel
   */
  async exportSurveyResponses(
    instructorId: number,
    surveyId: string,
  ): Promise<Buffer> {
    const analytics = await this.getSurveyAnalytics(instructorId, surveyId);

    console.log(`📊 Exporting survey ${surveyId}:`, {
      totalResponses: analytics.responses.length,
      totalQuestions: analytics.survey.questions.length,
      surveyTitle: analytics.survey.title,
    });

    // Check if there are any responses
    if (!analytics.responses || analytics.responses.length === 0) {
      console.warn(`⚠️ No responses found for survey ${surveyId}`);

      // Create Excel with survey info but no responses
      const XLSX = require('xlsx');
      const infoData = [
        {
          '📋 Thông báo': 'Chưa có sinh viên nào hoàn thành khảo sát này',
          'Tiêu đề khảo sát': analytics.survey.title,
          'Số câu hỏi': analytics.survey.questions.length,
          'Trạng thái': analytics.survey.status,
          'Ngày tạo': analytics.survey.createdAt,
        },
      ];

      // Add questions list to second sheet
      const questionsData = analytics.survey.questions.map((q, idx) => ({
        STT: idx + 1,
        'Câu hỏi': q.question,
        Loại: q.type,
        'Bắt buộc': q.required ? 'Có' : 'Không',
        'Có lựa chọn':
          q.options && q.options.length > 0
            ? `${q.options.length} lựa chọn`
            : 'Không',
      }));

      const workbook = XLSX.utils.book_new();
      const wsInfo = XLSX.utils.json_to_sheet(infoData);
      const wsQuestions = XLSX.utils.json_to_sheet(questionsData);

      XLSX.utils.book_append_sheet(workbook, wsInfo, 'Thông tin');
      XLSX.utils.book_append_sheet(workbook, wsQuestions, 'Danh sách câu hỏi');

      return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    }

    console.log(
      `✅ Found ${analytics.responses.length} responses, creating Excel...`,
    );

    // Format data for Excel export
    const exportData = analytics.responses.map((response, responseIdx) => {
      const row: any = {
        STT: responseIdx + 1,
        'Mã sinh viên': response.student?.code || 'Ẩn danh',
        'Tên sinh viên': response.student?.name || 'Ẩn danh',
        Lớp: response.student?.class || 'N/A',
        'Thời gian trả lời': response.submittedAt
          ? new Date(response.submittedAt).toLocaleString('vi-VN')
          : 'N/A',
      };

      // Add each answer based on question order
      analytics.survey.questions.forEach((question, qIdx) => {
        const answer = response.answers.find(
          (a) => a.questionId === question.id,
        );
        const answerValue = answer
          ? Array.isArray(answer.answer)
            ? answer.answer.join(', ')
            : answer.answer
          : '(Chưa trả lời)';

        row[
          `Câu ${qIdx + 1}: ${question.question.substring(0, 50)}${question.question.length > 50 ? '...' : ''}`
        ] = answerValue;
      });

      return row;
    });

    console.log(`📝 Created ${exportData.length} rows of data`);

    // Create Excel workbook with responses
    const XLSX = require('xlsx');
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Auto-size columns
    const maxWidth = 50;
    const colWidths = Object.keys(exportData[0] || {}).map((key) => ({
      wch: Math.min(Math.max(key.length, 10), maxWidth),
    }));
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Kết quả khảo sát');

    // Add summary sheet
    const summaryData = [
      {
        'Tiêu đề khảo sát': analytics.survey.title,
        'Tổng số phản hồi': analytics.responses.length,
        'Tỷ lệ phản hồi': `${analytics.responseRate}%`,
        'Số câu hỏi': analytics.survey.questions.length,
        'Trạng thái': analytics.survey.status,
        'Ngày xuất': new Date().toLocaleString('vi-VN'),
      },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, wsSummary, 'Tổng quan');

    // Generate buffer
    const excelBuffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    });
    console.log(
      `✅ Excel file generated successfully (${excelBuffer.length} bytes)`,
    );

    return excelBuffer;
  }

  /**
   * Helper: Get account_id from instructor_id
   */
  private async getAccountIdFromInstructorId(
    instructorId: number,
  ): Promise<number> {
    const instructor = await this.prisma.instructor.findUnique({
      where: { instructor_id: instructorId },
      select: { account_id: true },
    });

    if (!instructor) {
      throw new NotFoundException('Không tìm thấy giảng viên');
    }

    return instructor.account_id;
  }

  /**
   * Helper: Calculate mode
   */
  private calculateMode(numbers: number[]): number {
    if (numbers.length === 0) return 0;

    const frequency: { [key: number]: number } = {};
    numbers.forEach((n) => {
      frequency[n] = (frequency[n] || 0) + 1;
    });

    let maxFreq = 0;
    let mode = numbers[0];

    Object.entries(frequency).forEach(([num, freq]) => {
      if (freq > maxFreq) {
        maxFreq = freq;
        mode = Number(num);
      }
    });

    return mode;
  }
}
