import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { tmpdir } from 'os';
import type { Request as ExpressRequest } from 'express';
import { DevAuthGuard } from '../../common/guards/dev-auth.guard';
import { CertificateEnrollmentService } from '../../student_be/certificate/certificate-enrollment.service';
import {
  ResetPracticeProgressResponseDto,
  ToeicPracticeSessionService,
} from '../../student_be/certificate/toeic-practice-session.service';
import {
  ToeicOcrImportDto,
  ToeicOcrImportResponseDto,
  ToeicAnswerKeyImportDto,
  ToeicAnswerKeyImportResponseDto,
  ToeicListeningImportDto,
  ToeicListeningImportResponseDto,
  ToeicListeningAudioUploadDto,
  ToeicListeningAudioUploadResponseDto,
  ToeicAudioChunkRequestDto,
  ToeicAudioChunkResponseDto,
  ToeicRepositoryListItemDto,
  ToeicRepositoryDeleteResponseDto,
} from '../../student_be/certificate/dto/certificate.dto';
import { ToeicListeningImportService } from './toeic-listening-import.service';
import {
  ToeicPracticeImportService,
  ToeicPracticeImportDto,
  ToeicPracticeImportResponseDto,
  ToeicPracticeListResponseDto,
  ToeicPracticeDeleteResponseDto,
  ToeicPracticeAnswerKeyImportDto,
  ToeicPracticeAnswerKeyImportResponseDto,
  ToeicPracticeManualSupplementDto,
  ToeicPracticeManualSupplementResponseDto,
} from './toeic-practice-import.service';
import {
  DiagnosticImportService,
  DiagnosticImportDto,
  DiagnosticImportResponseDto,
} from './diagnostic-import.service';

type AuthenticatedRequest = ExpressRequest & {
  user?: {
    account_id?: number;
  };
};

const teacherToeicStorage = diskStorage({
  destination: (req, file, cb) => {
    cb(null, tmpdir());
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const teacherListeningAudioStorage = diskStorage({
  destination: (req, file, cb) => {
    cb(null, tmpdir());
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const teacherAudioChunkStorage = diskStorage({
  destination: (req, file, cb) => {
    cb(null, tmpdir());
  },
  filename: (req, file, cb) => {
    cb(null, `chunk-src-${Date.now()}${extname(file.originalname)}`);
  },
});

@Controller('teacher/toeic-repository')
@UseGuards(DevAuthGuard)
export class TeacherToeicRepositoryController {
  constructor(
    private readonly service: CertificateEnrollmentService,
    private readonly listeningService: ToeicListeningImportService,
    private readonly practiceImportService: ToeicPracticeImportService,
    private readonly practiceSessionService: ToeicPracticeSessionService,
    private readonly diagnosticImportService: DiagnosticImportService,
  ) {}

  /**
   * GET /teacher/toeic-repository/list
   * List all TOEIC repositories, optionally filtered by skill_area.
   */
  @Get('list')
  async listRepositories(
    @Query('skill_area') skillArea?: string,
  ): Promise<ToeicRepositoryListItemDto[]> {
    return this.listeningService.listRepositories(skillArea);
  }

  /**
   * DELETE /teacher/toeic-repository/:slug
   * Delete a repository and all its items/options.
   */
  @Delete(':slug')
  async deleteRepository(
    @Req() req: AuthenticatedRequest,
    @Param('slug') slug: string,
  ): Promise<ToeicRepositoryDeleteResponseDto> {
    const accountId = Number(req.user?.account_id ?? 0);
    if (!accountId) throw new BadRequestException('Không tìm thấy account_id.');
    return this.listeningService.deleteRepository(slug);
  }

  /**
   * POST /teacher/toeic-repository/import-ocr-file
   * Upload đề TOEIC (PDF/image/text), OCR + parse + insert DB để học viên làm bài.
   */
  @Post('import-ocr-file')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: teacherToeicStorage,
      limits: { fileSize: 25 * 1024 * 1024 },
    }),
  )
  async importToeicExamFromOcrFile(
    @Req() req: AuthenticatedRequest,
    @Body() dto: ToeicOcrImportDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ToeicOcrImportResponseDto> {
    const accountId = Number(req.user?.account_id ?? 0);
    if (!accountId) {
      throw new BadRequestException('Không tìm thấy account_id trong token.');
    }
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file để upload.');
    }

    // For reading skill area, use the practice import parser (same logic as Diagnostic)
    const skillArea = dto.skill_area || 'reading';
    if (skillArea === 'reading') {
      const practiceParsed =
        await this.practiceImportService.extractAndParseFromFile(file);
      if (practiceParsed.length > 0) {
        const externalParsed = practiceParsed.map((q) => ({
          questionNumber: q.questionNumber,
          part: q.detectedPart,
          stem: q.stem,
          context: q.readingPassage ?? null,
          options: q.options.map((opt) => ({
            optionKey: opt.optionKey,
            optionText: opt.optionText,
            isCorrect: opt.isCorrect,
            rationale: null as string | null,
          })),
        }));
        return this.service.importToeicExamFromOcrFile(
          accountId,
          dto,
          file,
          externalParsed,
        );
      }
    }

    return this.service.importToeicExamFromOcrFile(accountId, dto, file);
  }

  /**
   * POST /teacher/toeic-repository/import-diagnostic
   * Upload đề Khảo sát đầu vào, tự động phân tách độ khó bằng Heuristic Algorithm.
   */
  @Post('import-diagnostic')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: teacherToeicStorage,
      limits: { fileSize: 25 * 1024 * 1024 },
    }),
  )
  async importDiagnosticTest(
    @Req() req: AuthenticatedRequest,
    @Body() body: any,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<DiagnosticImportResponseDto> {
    const accountId = Number(req.user?.account_id ?? 0);
    if (!accountId) {
      throw new BadRequestException('Không tìm thấy account_id trong token.');
    }
    if (!file) {
      throw new BadRequestException(
        'Vui lòng chọn file đề khảo sát để upload.',
      );
    }

    return this.diagnosticImportService.importDiagnosticTest(
      accountId,
      body,
      file,
    );
  }

  /**
   * POST /teacher/toeic-repository/import-diagnostic-audio
   * Upload ZIP file chứa Audio cho Khảo Sát đầu vào, chia nhỏ và map vào DB.
   */
  @Post('import-diagnostic-audio')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: teacherToeicStorage,
      limits: { fileSize: 500 * 1024 * 1024 }, // 500MB cho ZIP
    }),
  )
  async importDiagnosticAudio(
    @Req() req: AuthenticatedRequest,
    @Body() dto: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const accountId = Number(req.user?.account_id ?? 0);
    if (!accountId) {
      throw new BadRequestException('Không tìm thấy account_id trong token.');
    }
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file ZIP Audio để upload.');
    }

    return this.diagnosticImportService.chunkDiagnosticAudio(
      accountId,
      dto,
      file,
    );
  }

  /**
   * POST /teacher/toeic-repository/import-diagnostic-answer-key
   * Upload file đáp án cho đề Khảo sát đầu vào.
   */
  @Post('import-diagnostic-answer-key')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: teacherToeicStorage,
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async importDiagnosticAnswerKey(
    @Req() req: AuthenticatedRequest,
    @Body() dto: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const accountId = Number(req.user?.account_id ?? 0);
    if (!accountId) {
      throw new BadRequestException('Không tìm thấy account_id trong token.');
    }
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file đáp án để upload.');
    }

    return this.diagnosticImportService.importDiagnosticAnswerKeyFromFile(
      accountId,
      dto,
      file,
      this.service,
    );
  }

  /**
   * POST /teacher/toeic-repository/import-answer-key-file
   * Upload file đáp án để map đúng option is_correct theo question number.
   */
  @Post('import-answer-key-file')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: teacherToeicStorage,
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async importToeicAnswerKeyFromFile(
    @Req() req: AuthenticatedRequest,
    @Body() dto: ToeicAnswerKeyImportDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ToeicAnswerKeyImportResponseDto> {
    const accountId = Number(req.user?.account_id ?? 0);
    if (!accountId) {
      throw new BadRequestException('Không tìm thấy account_id trong token.');
    }
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file đáp án để upload.');
    }

    return this.service.importToeicAnswerKeyFromFile(accountId, dto, file);
  }

  /**
   * POST /teacher/toeic-repository/import-listening-file
   * Upload TOEIC Listening PDF: extract text + images, parse questions, store in DB.
   */
  @Post('import-listening-file')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: teacherToeicStorage,
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  async importToeicListeningFromPdfFile(
    @Req() req: AuthenticatedRequest,
    @Body() dto: ToeicListeningImportDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ToeicListeningImportResponseDto> {
    const accountId = Number(req.user?.account_id ?? 0);
    if (!accountId) {
      throw new BadRequestException('Không tìm thấy account_id trong token.');
    }
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file PDF để upload.');
    }
    return this.listeningService.importToeicListeningFromPdfFile(
      accountId,
      dto,
      file,
    );
  }

  /**
   * POST /teacher/toeic-repository/chunk-listening-audio
   * Upload a full TOEIC Listening audio file. The Python ml_service splits it
   * into per-question chunks and optionally maps them to repository items.
   */
  @Post('chunk-listening-audio')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: teacherAudioChunkStorage,
      limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB for full listening test
    }),
  )
  async chunkListeningAudio(
    @Req() req: AuthenticatedRequest,
    @Body() dto: ToeicAudioChunkRequestDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ToeicAudioChunkResponseDto> {
    const accountId = Number(req.user?.account_id ?? 0);
    if (!accountId) throw new BadRequestException('Không tìm thấy account_id.');
    if (!file) throw new BadRequestException('Vui lòng chọn file audio.');
    return this.listeningService.chunkListeningAudio(accountId, dto, file);
  }

  /**
   * POST /teacher/toeic-repository/upload-full-audio
   * Upload full TOEIC Listening audio (no chunking). The file is saved as-is
   * and the URL is stored in repository metadata for continuous exam playback.
   */
  @Post('upload-full-audio')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: teacherAudioChunkStorage,
      limits: { fileSize: 200 * 1024 * 1024 },
    }),
  )
  async uploadFullAudio(
    @Req() req: AuthenticatedRequest,
    @Body() body: { repository_slug: string },
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ slug: string; full_audio_url: string }> {
    const accountId = Number(req.user?.account_id ?? 0);
    if (!accountId) throw new BadRequestException('Không tìm thấy account_id.');
    if (!file) throw new BadRequestException('Vui lòng chọn file audio.');
    if (!body.repository_slug?.trim())
      throw new BadRequestException('repository_slug là bắt buộc.');
    return this.listeningService.uploadFullAudio(body.repository_slug, file);
  }

  /**
   * POST /teacher/toeic-repository/import-practice-questions
   * Upload a .txt or .pdf file of TOEIC practice MCQ questions and import them
   * into the ToeicPracticeQuestion bank.
   */
  @Post('import-practice-questions')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: teacherToeicStorage,
      limits: { fileSize: 25 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        const allowed = ['.txt', '.pdf', '.doc', '.docx'];
        if (allowed.includes(ext)) {
          cb(null, true);
          return;
        }
        cb(
          new BadRequestException(
            'Định dạng không hỗ trợ. Vui lòng dùng TXT, PDF, DOC hoặc DOCX.',
          ) as any,
          false,
        );
      },
    }),
  )
  async importPracticeQuestions(
    @Req() req: AuthenticatedRequest,
    @Body() dto: ToeicPracticeImportDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ToeicPracticeImportResponseDto> {
    const accountId = Number(req.user?.account_id ?? 0);
    if (!accountId) {
      throw new BadRequestException('Không tìm thấy account_id.');
    }
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file để upload.');
    }
    return this.practiceImportService.importPracticeQuestionsFromFile(
      accountId,
      dto,
      file,
    );
  }

  /**
   * POST /teacher/toeic-repository/import-practice-answer-key
   * Upload answer key for a previously imported practice question set.
   * Mapping strategy: practice_set_id + question_number.
   */
  @Post('import-practice-answer-key')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: teacherToeicStorage,
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        const allowed = [
          '.txt',
          '.pdf',
          '.doc',
          '.docx',
          '.png',
          '.jpg',
          '.jpeg',
          '.webp',
          '.bmp',
          '.tif',
          '.tiff',
        ];
        if (allowed.includes(ext)) {
          cb(null, true);
          return;
        }
        cb(
          new BadRequestException(
            'File đáp án chỉ hỗ trợ TXT, PDF, DOC/DOCX hoặc ảnh (PNG/JPG/WEBP/BMP/TIF).',
          ) as any,
          false,
        );
      },
    }),
  )
  async importPracticeAnswerKey(
    @Req() req: AuthenticatedRequest,
    @Body() dto: ToeicPracticeAnswerKeyImportDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ToeicPracticeAnswerKeyImportResponseDto> {
    const accountId = Number(req.user?.account_id ?? 0);
    if (!accountId) {
      throw new BadRequestException('Không tìm thấy account_id.');
    }
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file đáp án để upload.');
    }

    return this.practiceImportService.importPracticeAnswerKey(
      accountId,
      dto,
      file,
      this.service,
    );
  }

  /**
   * POST /teacher/toeic-repository/import-practice-manual
   * Insert manual supplemental practice questions (multiple rows) with
   * duplicate protection by part + stem + options.
   */
  @Post('import-practice-manual')
  async importPracticeManualSupplement(
    @Req() req: AuthenticatedRequest,
    @Body() dto: ToeicPracticeManualSupplementDto,
  ): Promise<ToeicPracticeManualSupplementResponseDto> {
    const accountId = Number(req.user?.account_id ?? 0);
    if (!accountId) {
      throw new BadRequestException('Không tìm thấy account_id.');
    }

    return this.practiceImportService.importPracticeManualSupplement(
      accountId,
      dto,
    );
  }

  /**
   * POST /teacher/toeic-repository/import-practice-audio
   * Upload a full TOEIC Listening audio file for a practice question set.
   * The Python ml_service splits it into per-question chunks using the same
   * precision chunking algorithm as the exam & survey flows, then maps
   * audio URLs to matching ToeicPracticeQuestion rows.
   *
   * Output path: uploads/TOEIC/toeic-listening-practice/{practice_set_id}/audio/
   */
  @Post('import-practice-audio')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: teacherAudioChunkStorage,
      limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB
    }),
  )
  async importPracticeAudio(
    @Req() req: AuthenticatedRequest,
    @Body() dto: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const accountId = Number(req.user?.account_id ?? 0);
    if (!accountId) throw new BadRequestException('Không tìm thấy account_id.');
    if (!file) throw new BadRequestException('Vui lòng chọn file audio.');
    return this.practiceImportService.chunkPracticeAudio(accountId, dto, file);
  }

  /**
   * POST /teacher/toeic-repository/reset-practice-progress
   * Reset TOEIC practice progress for all users.
   */
  @Post('reset-practice-progress')
  async resetPracticeProgress(
    @Body() body?: { reset_reserve_points?: boolean },
  ): Promise<ResetPracticeProgressResponseDto> {
    const shouldResetReservePoints = body?.reset_reserve_points !== false;
    return this.practiceSessionService.resetPracticeProgressForAllUsers(
      shouldResetReservePoints,
    );
  }

  /**
   * GET /teacher/toeic-repository/practice-questions
   * List practice questions with optional filters: part, score_band_min,
   * score_band_max, skill_area. Returns up to 50 items + total count.
   */
  @Get('practice-questions')
  async listPracticeQuestions(
    @Query('part') part?: string,
    @Query('score_band_min') scoreBandMin?: string,
    @Query('score_band_max') scoreBandMax?: string,
    @Query('skill_area') skillArea?: string,
    @Query('practice_set_id') practiceSetId?: string,
  ): Promise<ToeicPracticeListResponseDto> {
    return this.practiceImportService.listPracticeQuestions({
      part: part !== undefined ? Number(part) : undefined,
      score_band_min:
        scoreBandMin !== undefined ? Number(scoreBandMin) : undefined,
      score_band_max:
        scoreBandMax !== undefined ? Number(scoreBandMax) : undefined,
      skill_area: skillArea,
      practice_set_id: practiceSetId,
    });
  }

  /**
   * POST /teacher/toeic-repository/import-practice-images
   * Upload a PDF containing listening images (Part 1 photos, Part 3/4 charts)
   * for an existing practice question set. Images will be extracted and mapped.
   */
  @Post('import-practice-images')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: teacherToeicStorage,
      limits: { fileSize: 50 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        if (ext === '.pdf') {
          cb(null, true);
          return;
        }
        cb(
          new BadRequestException(
            'Chỉ hỗ trợ file PDF cho trích xuất hình ảnh.',
          ) as any,
          false,
        );
      },
    }),
  )
  async importPracticeImages(
    @Req() req: AuthenticatedRequest,
    @Body() dto: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const accountId = Number(req.user?.account_id ?? 0);
    if (!accountId) throw new BadRequestException('Không tìm thấy account_id.');
    if (!file)
      throw new BadRequestException('Vui lòng chọn file PDF chứa hình ảnh.');
    const practiceSetId = dto?.practice_set_id?.trim?.() ?? '';
    if (!practiceSetId)
      throw new BadRequestException('Vui lòng cung cấp practice_set_id.');
    return this.practiceImportService.importPracticeImagesFromPdf(
      practiceSetId,
      file,
    );
  }

  /**
   * DELETE /teacher/toeic-repository/practice-questions
   * Delete specific practice questions by id array.
   * Body: { ids: number[] }
   */
  @Delete('practice-questions')
  async deletePracticeQuestions(
    @Body() body: { ids: number[] },
  ): Promise<ToeicPracticeDeleteResponseDto> {
    if (!body?.ids || body.ids.length === 0) {
      throw new BadRequestException('Vui lòng cung cấp danh sách id cần xóa.');
    }
    return this.practiceImportService.deletePracticeQuestions(body.ids);
  }
}
