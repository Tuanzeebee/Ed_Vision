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
      return await this.gradingService.gradeSpeakingHighFidelity({
        transcript,
        itemPrompt: question,
        part,
        targetBand,
      });
    } catch (err) {
      throw new BadRequestException('Grading failed: ' + (err as Error).message);
    }
  }
}
