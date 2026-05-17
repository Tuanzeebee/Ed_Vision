import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { GroqWhisperService } from '../common/groq/groq-whisper.service';
import { IeltsAiGradingService } from './services/ielts-ai-grading.service';
import { DevAuthGuard } from '../common/guards/dev-auth.guard';

@UseGuards(DevAuthGuard)
@Controller('ielts/speaking')
export class IeltsSpeakingController {
  private readonly logger = new Logger(IeltsSpeakingController.name);

  constructor(
    private readonly groqWhisperService: GroqWhisperService,
    private readonly gradingService: IeltsAiGradingService,
  ) {}

  @Post('transcribe')
  @UseInterceptors(FileInterceptor('audio'))
  async transcribe(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Audio file is required');
    }

    this.logger.debug(`[Transcribe] Received file: ${file.originalname}, size: ${file.size}, mime: ${file.mimetype}`);

    try {
      const transcript = await this.groqWhisperService.transcribe(
        file.buffer,
        file.mimetype || 'audio/webm',
      );
      return { transcript };
    } catch (err) {
      throw new BadRequestException('Transcription failed: ' + (err as Error).message);
    }
  }

  @Post('grade')
  async grade(
    @Body() body: { transcript: string; question: string; part: number; targetBand?: number },
  ) {
    const { transcript, question, part, targetBand = 6.5 } = body;

    if (!transcript?.trim()) {
      throw new BadRequestException('Transcript is required');
    }

    try {
      const result = await this.gradingService.gradeSpeakingHighFidelity({
        transcript,
        itemPrompt: question,
        part,
        targetBand,
      });

      // ✅ GUARD: tự tính lại overallBand từ 4 criteria — không tin AI
      const c = result.criteria;
      if (c) {
        const bands = [
          c.fluencyCoherence?.band ?? 0,
          c.lexicalResource?.band ?? 0,
          c.grammaticalRange?.band ?? 0,
          c.pronunciation?.band ?? 0,
        ];
        const avg = bands.reduce((a, b) => a + b, 0) / bands.length;
        const computedBand = Math.round(avg * 2) / 2;

        // Nếu transcript quá ngắn: cap tất cả về ≤ 4.0
        const wc = transcript.trim().split(/\s+/).filter(Boolean).length;
        if (wc < 20) {
          result.overallBand = Math.min(computedBand, 4.0);
          // Cap từng criterion cũng
          for (const key of ['fluencyCoherence', 'lexicalResource', 'grammaticalRange', 'pronunciation']) {
            if (c[key]) c[key].band = Math.min(c[key].band, 4.0);
          }
        } else {
          result.overallBand = computedBand;
        }
      }

      return result;
    } catch (err) {
      throw new BadRequestException('Grading failed: ' + (err as Error).message);
    }
  }
}
