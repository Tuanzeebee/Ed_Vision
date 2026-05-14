import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  DefaultValuePipe,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DevAuthGuard } from '../common/guards/dev-auth.guard';
import { RagService } from './rag.service';
import {
  IsString,
  IsOptional,
  IsIn,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { memoryStorage } from 'multer';

// DTOs
class TestQueryDto {
  @IsString()
  question: string;

  @IsOptional()
  @IsIn(['toeic', 'ielts', 'general'])
  cert_type?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  top_k?: number;
}

@Controller('admin/rag')
@UseGuards(DevAuthGuard)
export class RagController {
  constructor(private readonly ragService: RagService) {}

  // ── GET /admin/rag/stats ─────────────────────────────────────────────────
  @Get('stats')
  getStats() {
    return this.ragService.getStats();
  }

  // ── GET /admin/rag/documents ─────────────────────────────────────────────
  @Get('documents')
  listDocuments(
    @Query('cert_type') certType?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.ragService.listDocuments(certType, page, limit);
  }

  // ── POST /admin/rag/documents ────────────────────────────────────────────
  @Post('documents')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 20 * 1024 * 1024 }, // 20MB per file
    }),
  )
  uploadDocument(
    @Request() req: { user: { account_id: number } },
    @UploadedFile() file: Express.Multer.File,
    @Body('cert_type') certType = 'general',
    @Body('language') language = 'en',
  ) {
    if (!file) {
      return { error: 'Không tìm thấy file upload.' };
    }
    return this.ragService.uploadDocument(
      req.user.account_id,
      file,
      certType,
      language,
    );
  }

  // ── GET /admin/rag/documents/:id/chunks ──────────────────────────────────
  @Get('documents/:id/chunks')
  getDocumentChunks(
    @Param('id', ParseIntPipe) id: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.ragService.getDocumentChunks(id, page, limit);
  }

  // ── DELETE /admin/rag/documents/:id ──────────────────────────────────────
  @Delete('documents/:id')
  @HttpCode(HttpStatus.OK)
  async deleteDocument(@Param('id', ParseIntPipe) id: number) {
    await this.ragService.deleteDocument(id);
    return { success: true, message: 'Đã xóa tài liệu.' };
  }

  // ── POST /admin/rag/documents/:id/reprocess ──────────────────────────────
  @Post('documents/:id/reprocess')
  @HttpCode(HttpStatus.OK)
  async reprocessDocument(@Param('id', ParseIntPipe) id: number) {
    await this.ragService.reprocessDocument(id);
    return { success: true, message: 'Đang xử lý lại tài liệu.' };
  }

  // ── POST /admin/rag/test-query ───────────────────────────────────────────
  @Post('test-query')
  @HttpCode(HttpStatus.OK)
  testQuery(@Body() dto: TestQueryDto) {
    return this.ragService.testQuery(
      dto.question,
      dto.cert_type,
      dto.top_k ?? 5,
    );
  }
}
