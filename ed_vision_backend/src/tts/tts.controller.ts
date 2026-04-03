import {
  Controller,
  Get,
  Query,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { TtsService } from './tts.service';
import type { Response } from 'express';

@Controller('tts')
export class TtsController {
  constructor(private readonly ttsService: TtsService) {}

  /**
   * GET /api/tts?text=...&voice=en-US-JennyNeural
   * Returns audio/mpeg stream (Edge TTS).
   */
  @Get()
  async synthesize(
    @Query('text') text: string,
    @Query('voice') voice = 'en-US-JennyNeural',
    @Res() res: Response,
  ) {
    if (!text || text.trim().length === 0) {
      throw new BadRequestException('text query param is required');
    }

    // Sanitise text – keep only printable ASCII + basic punctuation
    const sanitised = text.replace(/[^\x20-\x7E\n]/g, ' ').slice(0, 2000);

    const audioBuffer = await this.ttsService.synthesize(sanitised, voice);

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length,
      'Cache-Control': 'public, max-age=86400', // cache 24 h in browser
    });
    res.end(audioBuffer);
  }
}
