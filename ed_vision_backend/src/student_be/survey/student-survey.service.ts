import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GeminiService } from '../../common/services/gemini.service';
import {
  SubmitSurveyDto,
  SurveyListItemDto,
  SurveyDetailDto,
  SurveyQuestionDto,
  SurveyStatusDto,
} from './dto/survey.dto';

@Injectable()
export class StudentSurveyService {
  private readonly logger = new Logger(StudentSurveyService.name);

  constructor(
    private prisma: PrismaService,
    private geminiService: GeminiService,
  ) {}

  /**
   * Map question_type từ DB sang frontend type
   */
  private mapQuestionType(dbType: string): string {
    const typeMap: Record<string, string> = {
      'scale': 'likert',
      'yes_no': 'yes-no',
      'multiple_choice': 'multiple-choice',
      'free_text': 'free-text',
      'rating': 'slider',
    };
    return typeMap[dbType] || dbType;
  }

  /**
   * Tính thời gian ước tính dựa trên số câu hỏi
   */
  private calculateEstimatedTime(questionCount: number): string {
    const minutesPerQuestion = 0.75; // Trung bình 45 giây/câu
    const totalMinutes = Math.ceil(questionCount * minutesPerQuestion);
    
    if (totalMinutes <= 5) return '3-5 phút';
    if (totalMinutes <= 10) return '5-10 phút';
    if (totalMinutes <= 15) return '10-15 phút';
    return `${totalMinutes - 5}-${totalMinutes} phút`;
  }

  /**
   * Kiểm tra trạng thái khảo sát của student
   * - Nếu chưa làm input survey -> phải hiển thị
   * - Nếu có periodic survey đang active -> hiển thị
   */
  async checkSurveyStatus(accountId: number): Promise<SurveyStatusDto> {
    // Lấy tất cả input surveys đang active
    const inputSurveys = await this.prisma.survey.findMany({
      where: {
        type: 'input',
        is_active: true,
        target_role: 'student',
      },
      include: {
        surveyQuestions: true,
      },
    });

    // Kiểm tra xem user đã hoàn thành TẤT CẢ input survey chưa
    // Nếu không có input survey nào trong DB → coi như đã hoàn thành
    let pendingInputSurvey: SurveyListItemDto | undefined;

    for (const survey of inputSurveys) {
      const response = await this.prisma.surveyResponse.findFirst({
        where: {
          survey_id: survey.survey_id,
          account_id: accountId,
        },
      });

      if (!response) {
        // Có input survey chưa làm
        pendingInputSurvey = {
          surveyId: survey.survey_id,
          title: survey.title,
          description: survey.description || undefined,
          type: 'input',
          totalQuestions: survey.surveyQuestions.length,
          estimatedTime: this.calculateEstimatedTime(survey.surveyQuestions.length),
          startDate: survey.start_date || undefined,
          endDate: survey.end_date || undefined,
          isCompleted: false,
        };
        break; // Chỉ cần 1 input survey pending
      }
    }

    // hasCompletedInputSurvey = true nếu không có pending input survey
    const hasCompletedInputSurvey = !pendingInputSurvey;

    // Lấy periodic surveys đang active và chưa làm
    const now = new Date();
    const periodicSurveys = await this.prisma.survey.findMany({
      where: {
        type: 'periodic',
        is_active: true,
        target_role: 'student',
        OR: [
          { start_date: null },
          { start_date: { lte: now } },
        ],
        AND: [
          {
            OR: [
              { end_date: null },
              { end_date: { gte: now } },
            ],
          },
        ],
      },
      include: {
        surveyQuestions: true,
      },
    });

    const pendingPeriodicSurveys: SurveyListItemDto[] = [];

    for (const survey of periodicSurveys) {
      const response = await this.prisma.surveyResponse.findFirst({
        where: {
          survey_id: survey.survey_id,
          account_id: accountId,
        },
      });

      if (!response) {
        pendingPeriodicSurveys.push({
          surveyId: survey.survey_id,
          title: survey.title,
          description: survey.description || undefined,
          type: 'periodic',
          totalQuestions: survey.surveyQuestions.length,
          estimatedTime: this.calculateEstimatedTime(survey.surveyQuestions.length),
          startDate: survey.start_date || undefined,
          endDate: survey.end_date || undefined,
          isCompleted: false,
        });
      }
    }

    return {
      hasCompletedInputSurvey,
      pendingInputSurvey,
      pendingPeriodicSurveys,
    };
  }

  /**
   * Lấy chi tiết survey với tất cả questions
   */
  async getSurveyDetail(surveyId: number, accountId: number): Promise<SurveyDetailDto> {
    const survey = await this.prisma.survey.findUnique({
      where: { survey_id: surveyId },
      include: {
        surveyQuestions: {
          orderBy: { order_index: 'asc' },
          include: {
            question: {
              include: {
                surveyOptions: {
                  orderBy: { option_value: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    if (!survey) {
      throw new NotFoundException(`Survey với ID ${surveyId} không tồn tại`);
    }

    if (!survey.is_active) {
      throw new ForbiddenException('Survey này đã bị vô hiệu hóa');
    }

    // Check if user already completed this survey
    const existingResponse = await this.prisma.surveyResponse.findFirst({
      where: {
        survey_id: surveyId,
        account_id: accountId,
      },
    });

    if (existingResponse) {
      throw new ForbiddenException('Bạn đã hoàn thành khảo sát này rồi');
    }

    // Map questions
    const questions: SurveyQuestionDto[] = survey.surveyQuestions.map((link) => {
      const q = link.question;
      return {
        questionId: q.question_id,
        questionText: q.question_text,
        questionType: this.mapQuestionType(q.question_type || 'multiple_choice'),
        category: q.category || undefined,
        isRequired: q.question_type !== 'free_text', // free_text không bắt buộc
        minValue: q.min_value ?? undefined,
        maxValue: q.max_value ?? undefined,
        options: q.surveyOptions.map((opt) => ({
          optionId: opt.option_id,
          text: opt.option_text || '',
          value: opt.option_value || 0,
        })),
      };
    });

    return {
      surveyId: survey.survey_id,
      title: survey.title,
      description: survey.description || undefined,
      type: survey.type || 'input',
      totalQuestions: questions.length,
      estimatedTime: this.calculateEstimatedTime(questions.length),
      questions,
    };
  }

  /**
   * Submit survey response
   * Chỉ ghi nhận khi hoàn thành TẤT CẢ câu hỏi bắt buộc
   */
  async submitSurvey(accountId: number, submitDto: SubmitSurveyDto): Promise<{ success: boolean; message: string }> {
    const { surveyId, answers } = submitDto;

    // Lấy thông tin student
    const student = await this.prisma.student.findUnique({
      where: { account_id: accountId },
    });

    if (!student) {
      throw new ForbiddenException('Tài khoản không phải là sinh viên');
    }

    // Lấy survey và questions
    const survey = await this.prisma.survey.findUnique({
      where: { survey_id: surveyId },
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
      },
    });

    if (!survey) {
      throw new NotFoundException(`Survey với ID ${surveyId} không tồn tại`);
    }

    if (!survey.is_active) {
      throw new ForbiddenException('Survey này đã bị vô hiệu hóa');
    }

    // Check if already completed
    const existingResponse = await this.prisma.surveyResponse.findFirst({
      where: {
        survey_id: surveyId,
        account_id: accountId,
      },
    });

    if (existingResponse) {
      throw new ForbiddenException('Bạn đã hoàn thành khảo sát này rồi');
    }

    // Validate: phải trả lời tất cả câu hỏi (bao gồm cả free_text)
    const requiredQuestionIds = survey.surveyQuestions
      .map((link) => link.question.question_id);

    // Use Set for answered IDs to handle multiple entries per question (multiple-choice)
    const answeredQuestionIdsSet = new Set<number>();
    answers.forEach((a) => {
      // Consider answered if optionId is defined (including 0) OR freeText is non-empty
      if (a.optionId !== undefined && a.optionId !== null) {
        answeredQuestionIdsSet.add(a.questionId);
      } else if (a.freeText && a.freeText.trim() !== '') {
        answeredQuestionIdsSet.add(a.questionId);
      }
    });

    const missingRequired = requiredQuestionIds.filter(
      (qId) => !answeredQuestionIdsSet.has(qId)
    );

    if (missingRequired.length > 0) {
      this.logger.warn(`Missing required questions: ${missingRequired}`);
      throw new BadRequestException(
        `Bạn cần trả lời tất cả ${requiredQuestionIds.length} câu hỏi bắt buộc. Còn thiếu ${missingRequired.length} câu.`
      );
    }

    // Create survey response và answers trong transaction
    await this.prisma.$transaction(async (tx) => {
      // Create response
      const response = await tx.surveyResponse.create({
        data: {
          survey_id: surveyId,
          account_id: accountId,
          submitted_at: new Date(),
        },
      });

      // Create answers - only save valid option_id (positive integer), otherwise null
      const answerData = answers.map((answer) => {
        const optId = answer.optionId;
        const validOptionId = (typeof optId === 'number' && optId > 0 && Number.isFinite(optId)) ? optId : null;
        return {
          response_id: response.response_id,
          question_id: answer.questionId,
          option_id: validOptionId,
          free_text: answer.freeText || null,
        };
      });

      await tx.surveyAnswer.createMany({
        data: answerData,
      });
    });

    // --- Process Factors & AI Analysis ---
    try {
      let workTimeHours: number | null = null;
      let studyTimeHours: number | null = null;
      const qaList: string[] = [];

      for (const ans of answers) {
        const link = survey.surveyQuestions.find(sq => sq.question.question_id === ans.questionId);
        if (!link) continue;

        const q = link.question;
        const code = q.code;

        // Determine answer value/text
        let answerVal: number | null = null;
        let answerText = '';

        if (ans.optionId !== undefined && ans.optionId !== null) {
          const opt = q.surveyOptions.find(o => o.option_id === ans.optionId);
          if (opt) {
            answerVal = opt.option_value ?? null;
            answerText = opt.option_text ?? '';
          }
        } else {
          answerText = ans.freeText ?? '';
          // Try to parse number if needed
          const parsed = parseFloat(answerText);
          if (!isNaN(parsed)) {
            answerVal = parsed;
          }
        }

        // Case A: work / study
        if (code === 'work') {
          workTimeHours = answerVal;
        } else if (code === 'study') {
          studyTimeHours = answerVal;
        } else {
          // Case B: For AI
          // Only include if there is meaningful text
          if (answerText.trim()) {
            qaList.push(`Question: ${q.question_text}\nAnswer: ${answerText}`);
          }
        }
      }

      // Call Gemini if there are questions to analyze
      let financialScore = 0;
      let mentalScore = 0;

      if (qaList.length > 0) {
        const aiResult = await this.geminiService.analyzeSurvey(qaList.join('\n\n'));
        financialScore = aiResult.financial_support_score;
        mentalScore = aiResult.mental_health_score;
      }

      // Save to StudentSurveyFactors
      await this.prisma.studentSurveyFactors.upsert({
        where: { student_id: student.student_id },
        update: {
          work_time_hours: workTimeHours,
          study_time_hours: studyTimeHours,
          financial_support_score: financialScore,
          mental_health_score: mentalScore,
        },
        create: {
          student_id: student.student_id,
          work_time_hours: workTimeHours,
          study_time_hours: studyTimeHours,
          financial_support_score: financialScore,
          mental_health_score: mentalScore,
        },
      });

      this.logger.log(`Updated survey factors for student ${student.student_id}`);

    } catch (error) {
      this.logger.error(`Error processing survey factors for student ${student.student_id}`, error);
      // We do NOT throw here, so the user still gets a success response for the survey submission
    }

    return {
      success: true,
      message: 'Cảm ơn bạn đã hoàn thành khảo sát!',
    };
  }

  /**
   * Lấy danh sách tất cả surveys cho student
   */
  async getAllSurveys(accountId: number): Promise<SurveyListItemDto[]> {
    const now = new Date();

    const surveys = await this.prisma.survey.findMany({
      where: {
        is_active: true,
        target_role: 'student',
        OR: [
          { start_date: null },
          { start_date: { lte: now } },
        ],
      },
      include: {
        surveyQuestions: true,
        surveyResponses: {
          where: {
            account_id: accountId,
          },
        },
      },
      orderBy: [
        { type: 'asc' }, // input trước
        { created_at: 'desc' },
      ],
    });

    return surveys.map((survey) => {
      const isCompleted = survey.surveyResponses.length > 0;
      const completedAt = isCompleted ? survey.surveyResponses[0].submitted_at : undefined;

      return {
        surveyId: survey.survey_id,
        title: survey.title,
        description: survey.description || undefined,
        type: survey.type || 'input',
        totalQuestions: survey.surveyQuestions.length,
        estimatedTime: this.calculateEstimatedTime(survey.surveyQuestions.length),
        startDate: survey.start_date || undefined,
        endDate: survey.end_date || undefined,
        isCompleted,
        completedAt,
      };
    });
  }

  /**
   * Lấy history các khảo sát đã làm
   */
  async getSurveyHistory(accountId: number): Promise<SurveyListItemDto[]> {
    const responses = await this.prisma.surveyResponse.findMany({
      where: {
        account_id: accountId,
      },
      include: {
        survey: {
          include: {
            surveyQuestions: true,
          },
        },
      },
      orderBy: {
        submitted_at: 'desc',
      },
    });

    return responses
      .filter((r) => r.survey) // Lọc những survey còn tồn tại
      .map((response) => ({
        surveyId: response.survey!.survey_id,
        title: response.survey!.title,
        description: response.survey!.description || undefined,
        type: response.survey!.type || 'input',
        totalQuestions: response.survey!.surveyQuestions.length,
        estimatedTime: this.calculateEstimatedTime(response.survey!.surveyQuestions.length),
        startDate: response.survey!.start_date || undefined,
        endDate: response.survey!.end_date || undefined,
        isCompleted: true,
        completedAt: response.submitted_at,
      }));
  }
}
