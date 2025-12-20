import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { DevAuthGuard } from '../../common/guards/dev-auth.guard';
import { StudentSurveyService } from './student-survey.service';
import {
  SubmitSurveyDto,
  SurveyListItemDto,
  SurveyDetailDto,
  SurveyStatusDto,
} from './dto/survey.dto';

@Controller('student/survey')
@UseGuards(DevAuthGuard)
export class StudentSurveyController {
  constructor(private readonly surveyService: StudentSurveyService) {}

  /**
   * Kiểm tra trạng thái khảo sát của student
   * Trả về input survey cần làm (nếu có) và danh sách periodic surveys
   *
   * GET /student/survey/status
   */
  @Get('status')
  async checkSurveyStatus(@Request() req): Promise<SurveyStatusDto> {
    const accountId = req.user.account_id;
    return this.surveyService.checkSurveyStatus(accountId);
  }

  /**
   * Lấy danh sách tất cả surveys cho student
   *
   * GET /student/survey/list
   */
  @Get('list')
  async getAllSurveys(@Request() req): Promise<SurveyListItemDto[]> {
    const accountId = req.user.account_id;
    return this.surveyService.getAllSurveys(accountId);
  }

  /**
   * Lấy lịch sử khảo sát đã làm
   *
   * GET /student/survey/history
   */
  @Get('history')
  async getSurveyHistory(@Request() req): Promise<SurveyListItemDto[]> {
    const accountId = req.user.account_id;
    return this.surveyService.getSurveyHistory(accountId);
  }

  /**
   * Lấy chi tiết một survey với tất cả questions
   *
   * GET /student/survey/:id
   */
  @Get(':id')
  async getSurveyDetail(
    @Param('id', ParseIntPipe) surveyId: number,
    @Request() req,
  ): Promise<SurveyDetailDto> {
    const accountId = req.user.account_id;
    return this.surveyService.getSurveyDetail(surveyId, accountId);
  }

  /**
   * Submit survey response
   * Chỉ ghi nhận khi hoàn thành TẤT CẢ câu hỏi bắt buộc
   *
   * POST /student/survey/submit
   */
  @Post('submit')
  @HttpCode(HttpStatus.OK)
  async submitSurvey(
    @Body() submitDto: SubmitSurveyDto,
    @Request() req,
  ): Promise<{ success: boolean; message: string }> {
    const accountId = req.user.account_id;
    return this.surveyService.submitSurvey(accountId, submitDto);
  }
}
