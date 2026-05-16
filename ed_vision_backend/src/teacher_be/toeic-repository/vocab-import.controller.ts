import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { DevAuthGuard } from '../../common/guards/dev-auth.guard';
import { VocabImportService } from './vocab-import.service';
import {
  CreateTopicDto,
  ConfirmImportDto,
} from '../../student_be/vocab/dto/vocab.dto';

const vocabUploadStorage = diskStorage({
  destination: (req, file, cb) => {
    const dest = './uploads/vocab-import';
    if (!existsSync(dest)) mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${extname(file.originalname)}`);
  },
});

const ALLOWED_EXTS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.bmp',
  '.pdf',
  '.txt',
  '.csv',
  '.xlsx',
  '.json',
  '.md',
];

@Controller('teacher/vocab')
@UseGuards(DevAuthGuard)
export class VocabImportController {
  constructor(private readonly importService: VocabImportService) {}

  // ────────────────────────────────────────────────────────────────────────────
  // GET /teacher/vocab/topics?cert_type=toeic
  // Danh sách chủ đề + số từ (teacher dashboard)
  // ────────────────────────────────────────────────────────────────────────────
  @Get('topics')
  async listTopics(@Query('cert_type') certType = 'toeic') {
    return this.importService.listTopics(certType);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // POST /teacher/vocab/topics
  // Tạo / cập nhật chủ đề
  // ────────────────────────────────────────────────────────────────────────────
  @Post('topics')
  async upsertTopic(@Body() dto: CreateTopicDto) {
    return this.importService.upsertTopic(dto);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // POST /teacher/vocab/import/preview
  // Upload file → OCR/parse → AI classify → trả về preview (CHƯA lưu DB)
  // ────────────────────────────────────────────────────────────────────────────
  @Post('import/preview')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: vocabUploadStorage,
      limits: { fileSize: 25 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        if (ALLOWED_EXTS.includes(ext)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              `Định dạng không hỗ trợ. Chấp nhận: ${ALLOWED_EXTS.join(', ')}`,
            ) as any,
            false,
          );
        }
      },
    }),
  )
  async previewImport(
    @UploadedFile() file: Express.Multer.File,
    @Body('topic_id') topicId?: string,
    @Body('cert_type') certType?: string,
  ) {
    if (!file) throw new BadRequestException('Vui lòng chọn file để upload.');
    return this.importService.parseAndPreview(file, {
      topic_id: topicId ? Number(topicId) : undefined,
      cert_type: certType ?? 'toeic',
    });
  }

  // ────────────────────────────────────────────────────────────────────────────
  // POST /teacher/vocab/import/confirm
  // Giảng viên xem preview, chỉnh sửa rồi xác nhận → lưu vào DB
  // ────────────────────────────────────────────────────────────────────────────
  @Post('import/confirm')
  async confirmImport(@Body() dto: ConfirmImportDto) {
    if (!dto.words || dto.words.length === 0) {
      throw new BadRequestException('Không có từ vựng nào để lưu.');
    }
    return this.importService.confirmImport(dto);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // DELETE /teacher/vocab/words/:wordId
  // Xóa một từ vựng
  // ────────────────────────────────────────────────────────────────────────────
  @Delete('words/:wordId')
  async deleteWord(@Param('wordId', ParseIntPipe) wordId: number) {
    return this.importService.deleteWord(wordId);
  }
}
