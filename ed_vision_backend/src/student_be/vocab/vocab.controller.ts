import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { DevAuthGuard } from '../../common/guards/dev-auth.guard';
import { VocabService } from './vocab.service';
import { VocabTestService } from './vocab-test.service';
import { VocabLookupService } from './vocab-lookup.service';
import {
  ToggleKnownDto,
  StartTestSessionDto,
  SubmitAnswerDto,
  LookupWordDto,
  SaveFromReadingDto,
} from './dto/vocab.dto';

type AuthenticatedRequest = ExpressRequest & {
  user: { account_id: number };
};

@Controller('student/vocab')
@UseGuards(DevAuthGuard)
export class VocabController {
  constructor(
    private readonly vocabService: VocabService,
    private readonly testService: VocabTestService,
    private readonly lookupService: VocabLookupService,
  ) {}

  // ────────────────────────────────────────────────────────────────────────────
  // GET /student/vocab/topics?enrollment_id=&cert_type=toeic
  // Danh sách chủ đề + tiến độ học của user
  // ────────────────────────────────────────────────────────────────────────────
  @Get('topics')
  async getTopics(
    @Query('enrollment_id', ParseIntPipe) enrollmentId: number,
    @Query('cert_type') certType = 'toeic',
  ) {
    return this.vocabService.getTopics(enrollmentId, certType);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // GET /student/vocab/topics/:topicId/words?enrollment_id=&page=1&limit=10
  // Từ vựng trong chủ đề (paginated)
  // ────────────────────────────────────────────────────────────────────────────
  @Get('topics/:topicId/words')
  async getWordsByTopic(
    @Param('topicId', ParseIntPipe) topicId: number,
    @Query('enrollment_id', ParseIntPipe) enrollmentId: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.vocabService.getWordsByTopic(
      enrollmentId,
      topicId,
      page,
      limit,
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // POST /student/vocab/words/:wordId/toggle
  // Toggle đánh dấu đã thuộc / chưa thuộc
  // ────────────────────────────────────────────────────────────────────────────
  @Post('words/:wordId/toggle')
  @HttpCode(HttpStatus.OK)
  async toggleKnown(
    @Param('wordId', ParseIntPipe) wordId: number,
    @Query('enrollment_id', ParseIntPipe) enrollmentId: number,
    @Body() dto: ToggleKnownDto,
  ) {
    return this.vocabService.toggleKnown(enrollmentId, wordId, dto.is_known);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // GET /student/vocab/known-words?enrollment_id=&topic_id=
  // Tất cả từ đã thuộc (dùng để tạo bộ test)
  // ────────────────────────────────────────────────────────────────────────────
  @Get('known-words')
  async getKnownWords(
    @Query('enrollment_id', ParseIntPipe) enrollmentId: number,
    @Query('topic_id') topicId?: string,
  ) {
    return this.vocabService.getKnownWords(
      enrollmentId,
      topicId ? Number(topicId) : undefined,
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // GET /student/vocab/stats?enrollment_id=
  // Thống kê tổng hợp vocab
  // ────────────────────────────────────────────────────────────────────────────
  @Get('stats')
  async getStats(
    @Query('enrollment_id', ParseIntPipe) enrollmentId: number,
    @Query('cert_type') certType = 'toeic',
  ) {
    return this.vocabService.getVocabStats(enrollmentId, certType);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // POST /student/vocab/test-session/start
  // Khởi tạo phiên kiểm tra (flashcard | write)
  // ────────────────────────────────────────────────────────────────────────────
  @Post('test-session/start')
  async startTestSession(
    @Query('enrollment_id', ParseIntPipe) enrollmentId: number,
    @Body() dto: StartTestSessionDto,
  ) {
    return this.testService.startSession(enrollmentId, dto);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // POST /student/vocab/test-session/:sessionId/submit
  // Nộp đáp án 1 từ trong phiên test
  // ────────────────────────────────────────────────────────────────────────────
  @Post('test-session/:sessionId/submit')
  @HttpCode(HttpStatus.OK)
  async submitAnswer(
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Query('enrollment_id', ParseIntPipe) enrollmentId: number,
    @Body() dto: SubmitAnswerDto,
  ) {
    return this.testService.submitAnswer(enrollmentId, sessionId, dto);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // POST /student/vocab/test-session/:sessionId/finish
  // Kết thúc phiên, tính điểm tổng
  // ────────────────────────────────────────────────────────────────────────────
  @Post('test-session/:sessionId/finish')
  @HttpCode(HttpStatus.OK)
  async finishSession(
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Query('enrollment_id', ParseIntPipe) enrollmentId: number,
  ) {
    return this.testService.finishSession(enrollmentId, sessionId);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // GET /student/vocab/test-session/history?enrollment_id=
  // Lịch sử phiên kiểm tra
  // ────────────────────────────────────────────────────────────────────────────
  @Get('test-session/history')
  async getSessionHistory(
    @Query('enrollment_id', ParseIntPipe) enrollmentId: number,
  ) {
    return this.testService.getSessionHistory(enrollmentId);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // POST /student/vocab/lookup
  // Tra từ qua AI (hoặc từ database/cache)
  // ────────────────────────────────────────────────────────────────────────────
  @Post('lookup')
  @HttpCode(HttpStatus.OK)
  async lookupWord(
    @Body() dto: LookupWordDto,
    @Query('enrollment_id', ParseIntPipe) enrollmentId: number,
  ) {
    return this.lookupService.lookupWord(enrollmentId, dto);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // POST /student/vocab/save-from-reading
  // Lưu từ mới vào kho từ vựng cá nhân từ bài đọc
  // ────────────────────────────────────────────────────────────────────────────
  @Post('save-from-reading')
  @HttpCode(HttpStatus.OK)
  async saveFromReading(
    @Body() dto: SaveFromReadingDto,
    @Query('enrollment_id', ParseIntPipe) enrollmentId: number,
  ) {
    return this.lookupService.saveFromReading(enrollmentId, dto);
  }
}
