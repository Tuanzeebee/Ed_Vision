import {
  Controller,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { IeltsRepositoryService } from './ielts-repository.service';
import { QuestionUploadService } from './services/question-upload.service';
import { IrtRecalibrationService } from './services/irt-recalibration.service';
import {
  UploadReadingDto,
  UploadListeningDto,
  UploadWritingDto,
  UploadSpeakingDto,
  UploadAnswerKeyDto,
} from './dto/upload-skill.dto';

const multerOptions = {
  storage: memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (_req: any, file: any, cb: any) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only .pdf and .docx files are allowed'), false);
  },
};

@Controller('ielts-repository')
export class IeltsRepositoryController {
  constructor(
    private readonly repositoryService: IeltsRepositoryService,
    private readonly uploadService: QuestionUploadService,
    private readonly recalibrationService: IrtRecalibrationService,
  ) {}

  @Post('import/reading')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async importReading(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadReadingDto,
  ) {
    return this.uploadService.processUpload(file, dto);
  }

  @Post('import/listening')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async importListening(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadListeningDto,
  ) {
    return this.uploadService.processUpload(file, dto);
  }

  @Post('import/writing')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async importWriting(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadWritingDto,
  ) {
    return this.uploadService.processUpload(file, dto);
  }

  @Post('import/speaking')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async importSpeaking(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadSpeakingDto,
  ) {
    return this.uploadService.processUpload(file, dto);
  }

  @Post('import/answer-key')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async importAnswerKey(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadAnswerKeyDto,
  ) {
    return this.repositoryService.importAnswerKey(file, dto);
  }

  @Post('recalibrate')
  async recalibrate(@Query('minResponses') minResponses?: number) {
    return this.recalibrationService.recalibrateAll(minResponses ? Number(minResponses) : 50);
  }
}
