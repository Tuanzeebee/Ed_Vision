import {
  Controller,
  Post,
  Req,
  Res,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { SttService } from './stt.service';
import type { Response, Request } from 'express';

/**
 * POST /api/stt
 *
 * Accepts a multipart upload with field name "audio" containing
 * raw Float32 PCM binary data (16 kHz, mono) produced by the
 * browser's Web Audio API (OfflineAudioContext resampling).
 *
 * Returns:  { text: string }
 */
@Controller('stt')
export class SttController {
  constructor(private readonly sttService: SttService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('audio', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
    }),
  )
  async transcribe(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // Accept either a multipart file upload OR a raw binary body
    const buffer: Buffer | undefined = file?.buffer ?? (req.body as Buffer);

    if (!buffer || buffer.length === 0) {
      throw new BadRequestException('No audio data received');
    }

    const text = await this.sttService.transcribe(buffer);

    res.json({ text });
  }
}
