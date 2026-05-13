import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
import type { Request as ExpressRequest } from 'express';
import { DevAuthGuard } from '../../common/guards/dev-auth.guard';
import { IeltsImportService } from './ielts-import.service';
import {
  IeltsOcrImportDto,
  IeltsOcrImportResponseDto,
  IeltsAnswerKeyImportDto,
  IeltsAnswerKeyImportResponseDto,
  IeltsListeningAudioUploadDto,
  IeltsListeningAudioUploadResponseDto,
  IeltsRepositoryListItemDto,
  IeltsRepositoryDeleteResponseDto,
  IeltsPracticeImportDto,
  IeltsPracticeImportResponseDto,
} from './dto/ielts-import.dto';

type AuthenticatedRequest = ExpressRequest & {
  user?: { account_id?: number };
};

// ─── Multer storage helpers ───────────────────────────────────────────────────

const ieltsUploadStorage = diskStorage({
  destination: (_req, _file, cb) => {
    const dest = './uploads/IELTS/staging';
    if (!existsSync(dest)) mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${extname(file.originalname)}`);
  },
});

const ieltsAudioStorage = diskStorage({
  destination: (_req, _file, cb) => {
    const dest = './uploads/IELTS/audio-staging';
    if (!existsSync(dest)) mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${extname(file.originalname)}`);
  },
});

// ─── Controller ───────────────────────────────────────────────────────────────

@Controller('teacher/ielts-repository')
@UseGuards(DevAuthGuard)
export class IeltsRepositoryController {
  constructor(private readonly service: IeltsImportService) {}

  // ─────────────────────────────────────────────────────────────────────────
  // GET /teacher/ielts-repository/list
  // List all IELTS repositories, optionally filtered by skill_area.
  // ─────────────────────────────────────────────────────────────────────────
  @Get('list')
  async listRepositories(
    @Query('skill_area') skillArea?: string,
  ): Promise<IeltsRepositoryListItemDto[]> {
    return this.service.listRepositories(skillArea);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // POST /teacher/ielts-repository/import-ocr
  // Upload a PDF (or .txt) and parse IELTS questions via OCR.
  //
  // Form fields (multipart/form-data):
  //   file              — the PDF / TXT file
  //   repository_slug   — unique identifier for this exam set
  //   repository_title  — human-readable title
  //   skill_area        — "listening" | "reading"  (default: inferred from filename)
  //   replace_existing  — "true" | "false"  (default: "true")
  //   band_range        — optional, e.g. "5.0-6.5"
  //   exam_year         — optional, e.g. "2024-C1"
  // ─────────────────────────────────────────────────────────────────────────
  @Post('import-ocr')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: ieltsUploadStorage,
      limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
      fileFilter: (_req, file, cb) => {
        const allowed = ['.pdf', '.txt', '.xlsx', '.xls', '.docx', '.png', '.jpg', '.jpeg'];
        if (allowed.includes(extname(file.originalname).toLowerCase())) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Chỉ hỗ trợ định dạng: PDF, TXT, DOCX, XLSX, XLS, Ảnh (PNG/JPG).',
            ),
            false,
          );
        }
      },
    }),
  )
  async importFromOcr(
    @Req() req: AuthenticatedRequest,
    @Body() dto: IeltsOcrImportDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<IeltsOcrImportResponseDto> {
    if (!file) {
      throw new BadRequestException('Vui lòng đính kèm file PDF/TXT.');
    }
    const accountId = req.user?.account_id ?? 0;
    return this.service.importFromOcrFile(accountId, dto, file);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // POST /teacher/ielts-repository/import-answer-key
  // Upload a plain-text answer key and apply it to an existing repository.
  //
  // Expected file format (one answer per line):
  //   1. B
  //   2. A
  //   3. TRUE
  //   4. NOT GIVEN
  // ─────────────────────────────────────────────────────────────────────────
  @Post('import-answer-key')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: ieltsUploadStorage,
      limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
      fileFilter: (_req, file, cb) => {
        const allowed = ['.pdf', '.txt', '.csv', '.docx', '.png', '.jpg', '.jpeg'];
        if (allowed.includes(extname(file.originalname).toLowerCase())) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'File đáp án hỗ trợ: PDF, TXT, CSV, DOCX, Ảnh (PNG/JPG).',
            ),
            false,
          );
        }
      },
    }),
  )
  async importAnswerKey(
    @Body() dto: IeltsAnswerKeyImportDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<IeltsAnswerKeyImportResponseDto> {
    if (!file) {
      throw new BadRequestException('Vui lòng đính kèm file đáp án.');
    }
    return this.service.importAnswerKey(dto, file);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // POST /teacher/ielts-repository/import-practice
  // Import practice questions (Reading/Listening/Speaking/Writing).
  // ─────────────────────────────────────────────────────────────────────────
  @Post('import-practice')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: ieltsUploadStorage,
      limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
      fileFilter: (_req, file, cb) => {
        const allowed = ['.pdf', '.txt', '.xlsx', '.xls', '.docx', '.png', '.jpg', '.jpeg'];
        if (allowed.includes(extname(file.originalname).toLowerCase())) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Hỗ trợ định dạng: PDF, TXT, DOCX, XLSX, XLS, Ảnh (PNG/JPG).',
            ),
            false,
          );
        }
      },
    }),
  )
  async importPractice(
    @Req() req: AuthenticatedRequest,
    @Body() dto: IeltsPracticeImportDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<IeltsPracticeImportResponseDto> {
    if (!file) {
      throw new BadRequestException('Vui lòng đính kèm file.');
    }
    const accountId = req.user?.account_id ?? 0;
    return this.service.importPractice(accountId, dto, file);
  }


  // ─────────────────────────────────────────────────────────────────────────
  // POST /teacher/ielts-repository/upload-audio
  // Upload a Listening audio track and map it to repository items.
  //
  // Form fields:
  //   file             — MP3 / WAV / M4A file
  //   repository_slug  — target repository
  //   section          — 1 | 2 | 3 | 4  (default: inferred from filename)
  //   track_number     — 1-based track index within the section (default: 1)
  // ─────────────────────────────────────────────────────────────────────────
  @Post('upload-audio')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: ieltsAudioStorage,
      limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB
      fileFilter: (_req, file, cb) => {
        const allowed = ['.mp3', '.wav', '.m4a', '.ogg', '.aac', '.flac'];
        if (allowed.includes(extname(file.originalname).toLowerCase())) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Chỉ hỗ trợ file âm thanh: MP3, WAV, M4A, OGG, AAC, FLAC.',
            ),
            false,
          );
        }
      },
    }),
  )
  async uploadListeningAudio(
    @Body() dto: IeltsListeningAudioUploadDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<IeltsListeningAudioUploadResponseDto> {
    if (!file) {
      throw new BadRequestException('Vui lòng đính kèm file audio.');
    }
    return this.service.uploadListeningAudio(dto, file);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PATCH /teacher/ielts-repository/:slug/publish
  // Toggle is_published flag.
  // Body: { publish: true | false }
  // ─────────────────────────────────────────────────────────────────────────
  @Patch(':slug/publish')
  async togglePublish(
    @Param('slug') slug: string,
    @Body('publish') publish: boolean,
  ): Promise<{ slug: string; is_published: boolean }> {
    if (typeof publish !== 'boolean') {
      throw new BadRequestException(
        'Trường "publish" phải là boolean (true/false).',
      );
    }
    return this.service.publishRepository(slug, publish);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DELETE /teacher/ielts-repository/:slug
  // Delete a repository and all its items / options.
  // ─────────────────────────────────────────────────────────────────────────
  @Delete(':slug')
  async deleteRepository(
    @Param('slug') slug: string,
  ): Promise<IeltsRepositoryDeleteResponseDto> {
    return this.service.deleteRepository(slug);
  }
}
