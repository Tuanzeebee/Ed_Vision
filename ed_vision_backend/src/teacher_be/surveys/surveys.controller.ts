import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    Req,
} from '@nestjs/common';
import { SurveysService } from './surveys.service';
import {
    CreateSurveyDto,
    UpdateSurveyDto,
    SurveyFilterDto,
    SendReminderDto,
} from './dto/survey.dto';

@Controller('teacher/surveys')
export class SurveysController {
    constructor(private readonly surveysService: SurveysService) { }

    /**
     * GET /teacher/surveys/dashboard
     * Lấy survey dashboard
     */
    @Get('dashboard')
    async getSurveyDashboard(@Req() req: any) {
        const instructorId = req.user?.instructorId || 1;
        return this.surveysService.getSurveyDashboard(instructorId);
    }

    /**
     * GET /teacher/surveys
     * Lấy danh sách surveys
     */
    @Get()
    async getSurveys(@Req() req: any, @Query() filterDto: SurveyFilterDto) {
        const instructorId = req.user?.instructorId || 1;
        return this.surveysService.getSurveys(instructorId, filterDto);
    }

    /**
     * GET /teacher/surveys/:id
     * Lấy chi tiết survey
     */
    @Get(':id')
    async getSurveyDetail(@Req() req: any, @Param('id') id: string) {
        const instructorId = req.user?.instructorId || 1;
        return this.surveysService.getSurveyDetail(instructorId, id);
    }

    /**
     * POST /teacher/surveys
     * Tạo survey mới
     */
    @Post()
    async createSurvey(@Req() req: any, @Body() dto: CreateSurveyDto) {
        const instructorId = req.user?.instructorId || 1;
        return this.surveysService.createSurvey(instructorId, dto);
    }

    /**
     * PUT /teacher/surveys/:id
     * Cập nhật survey
     */
    @Put(':id')
    async updateSurvey(
        @Req() req: any,
        @Param('id') id: string,
        @Body() dto: UpdateSurveyDto,
    ) {
        const instructorId = req.user?.instructorId || 1;
        return this.surveysService.updateSurvey(instructorId, id, dto);
    }

    /**
     * DELETE /teacher/surveys/:id
     * Xóa survey
     */
    @Delete(':id')
    async deleteSurvey(@Req() req: any, @Param('id') id: string) {
        const instructorId = req.user?.instructorId || 1;
        return this.surveysService.deleteSurvey(instructorId, id);
    }

    /**
     * POST /teacher/surveys/bulk-delete
     * Xóa nhiều surveys
     */
    @Post('bulk-delete')
    async bulkDeleteSurveys(
        @Req() req: any,
        @Body() body: { surveyIds: string[] },
    ) {
        const instructorId = req.user?.instructorId || 1;
        const results = await Promise.allSettled(
            body.surveyIds.map((id) =>
                this.surveysService.deleteSurvey(instructorId, id),
            ),
        );

        const deleted = results.filter((r) => r.status === 'fulfilled').length;
        const failed = results.filter((r) => r.status === 'rejected').length;

        return {
            success: true,
            deleted,
            failed,
            total: body.surveyIds.length,
        };
    }

    /**
     * GET /teacher/surveys/:id/analytics
     * Lấy analytics của survey
     */
    @Get(':id/analytics')
    async getSurveyAnalytics(@Req() req: any, @Param('id') id: string) {
        const instructorId = req.user?.instructorId || 1;
        return this.surveysService.getSurveyAnalytics(instructorId, id);
    }

    /**
     * POST /teacher/surveys/send-reminder
     * Gửi nhắc nhở làm khảo sát
     */
    @Post('send-reminder')
    async sendReminder(@Req() req: any, @Body() dto: SendReminderDto) {
        const instructorId = req.user?.instructorId || 1;
        return this.surveysService.sendReminder(instructorId, dto);
    }

    /**
     * GET /teacher/surveys/:id/export
     * Export survey responses
     */
    @Get(':id/export')
    async exportSurveyResponses(@Req() req: any, @Param('id') id: string) {
        const instructorId = req.user?.instructorId || 1;
        return this.surveysService.exportSurveyResponses(instructorId, id);
    }

    /**
     * GET /teacher/surveys/questions/available
     * Lấy danh sách câu hỏi có sẵn
     */
    @Get('questions/available')
    async getAvailableQuestions(@Query('category') category?: string) {
        return this.surveysService.getAvailableQuestions(category);
    }

    /**
     * POST /teacher/surveys/from-questions
     * Tạo survey từ questions có sẵn
     */
    @Post('from-questions')
    async createSurveyFromQuestions(
        @Req() req: any,
        @Body()
        dto: {
            title: string;
            description?: string;
            questionIds: number[];
            startDate: string;
            endDate: string;
            targetClasses?: string[];
        },
    ) {
        const instructorId = req.user?.instructorId || 1;
        return this.surveysService.createSurveyFromExistingQuestions(instructorId, dto);
    }

    /**
     * POST /teacher/surveys/:id/questions/:questionId
     * Thêm câu hỏi vào survey
     */
    @Post(':id/questions/:questionId')
    async addQuestionToSurvey(
        @Req() req: any,
        @Param('id') surveyId: string,
        @Param('questionId') questionId: string,
    ) {
        const instructorId = req.user?.instructorId || 1;
        return this.surveysService.addQuestionToSurvey(
            instructorId,
            surveyId,
            parseInt(questionId),
        );
    }

    /**
     * DELETE /teacher/surveys/:id/questions/:questionId
     * Xóa câu hỏi khỏi survey
     */
    @Delete(':id/questions/:questionId')
    async removeQuestionFromSurvey(
        @Req() req: any,
        @Param('id') surveyId: string,
        @Param('questionId') questionId: string,
    ) {
        const instructorId = req.user?.instructorId || 1;
        return this.surveysService.removeQuestionFromSurvey(
            instructorId,
            surveyId,
            parseInt(questionId),
        );
    }

    /**
     * PUT /teacher/surveys/:id/questions/reorder
     * Sắp xếp lại thứ tự câu hỏi
     */
    @Put(':id/questions/reorder')
    async reorderQuestions(
        @Req() req: any,
        @Param('id') surveyId: string,
        @Body() body: { questionOrder: { questionId: number; order: number }[] },
    ) {
        const instructorId = req.user?.instructorId || 1;
        return this.surveysService.reorderQuestions(
            instructorId,
            surveyId,
            body.questionOrder,
        );
    }
}