import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { DevAuthGuard } from '../../common/guards/dev-auth.guard';
import { ExamViewerService } from './exam-viewer.service';
import * as bcrypt from 'bcrypt';

@Controller('teacher/exam-viewer')
@UseGuards(DevAuthGuard)
export class ExamViewerController {
  constructor(private readonly examViewerService: ExamViewerService) {}

  /**
   * Verify password before allowing access to exam content
   */
  @Post('verify-password')
  async verifyPassword(@Body() body: { password: string }) {
    const { password } = body;
    
    // Use environment variable or hardcoded secure password
    const EXAM_VIEWER_PASSWORD = process.env.EXAM_VIEWER_PASSWORD || 'EdVision2024!Secure';
    
    const isValid = await bcrypt.compare(password, await bcrypt.hash(EXAM_VIEWER_PASSWORD, 10));
    
    if (!isValid && password !== EXAM_VIEWER_PASSWORD) {
      throw new HttpException('Mật khẩu không chính xác', HttpStatus.UNAUTHORIZED);
    }
    
    return { 
      success: true, 
      message: 'Xác thực thành công',
      token: Buffer.from(`${Date.now()}`).toString('base64') // Simple token for session
    };
  }

  /**
   * Get list of all exam repositories (TOEIC Mock Tests)
   */
  @Get('toeic/repositories')
  async getToeicRepositories(
    @Query('skill_area') skillArea?: string,
  ) {
    return this.examViewerService.getToeicRepositories(skillArea);
  }

  /**
   * Get detailed questions from a TOEIC repository
   */
  @Get('toeic/repository-detail')
  async getToeicRepositoryDetail(
    @Query('slug') slug: string,
  ) {
    if (!slug) {
      throw new HttpException('Repository slug is required', HttpStatus.BAD_REQUEST);
    }
    return this.examViewerService.getToeicRepositoryDetail(slug);
  }

  /**
   * Get list of all TOEIC practice sets
   */
  @Get('toeic/practice-sets')
  async getToeicPracticeSets() {
    return this.examViewerService.getToeicPracticeSets();
  }

  /**
   * Get detailed questions from a TOEIC practice set
   */
  @Get('toeic/practice-detail')
  async getToeicPracticeDetail(
    @Query('practice_set_id') practiceSetId: string,
  ) {
    if (!practiceSetId) {
      throw new HttpException('Practice set ID is required', HttpStatus.BAD_REQUEST);
    }
    return this.examViewerService.getToeicPracticeDetail(practiceSetId);
  }

  /**
   * Get list of all TOEIC diagnostic tests
   */
  @Get('toeic/diagnostic-tests')
  async getToeicDiagnosticTests() {
    return this.examViewerService.getToeicDiagnosticTests();
  }

  /**
   * Get detailed questions from a TOEIC diagnostic test
   */
  @Get('toeic/diagnostic-detail')
  async getToeicDiagnosticDetail(
    @Query('slug') slug: string,
  ) {
    if (!slug) {
      throw new HttpException('Diagnostic slug is required', HttpStatus.BAD_REQUEST);
    }
    return this.examViewerService.getToeicDiagnosticDetail(slug);
  }

  /**
   * Get list of all IELTS repositories
   */
  @Get('ielts/repositories')
  async getIeltsRepositories(
    @Query('skill_area') skillArea?: string,
  ) {
    return this.examViewerService.getIeltsRepositories(skillArea);
  }

  /**
   * Get detailed questions from an IELTS repository
   */
  @Get('ielts/repository-detail')
  async getIeltsRepositoryDetail(
    @Query('slug') slug: string,
  ) {
    if (!slug) {
      throw new HttpException('Repository slug is required', HttpStatus.BAD_REQUEST);
    }
    return this.examViewerService.getIeltsRepositoryDetail(slug);
  }

  /**
   * Get list of all IELTS diagnostic tests
   */
  @Get('ielts/diagnostic-tests')
  async getIeltsDiagnosticTests() {
    return this.examViewerService.getIeltsDiagnosticTests();
  }

  /**
   * Get detailed questions from an IELTS diagnostic test
   */
  @Get('ielts/diagnostic-detail')
  async getIeltsDiagnosticDetail(
    @Query('slug') slug: string,
  ) {
    if (!slug) {
      throw new HttpException('Diagnostic slug is required', HttpStatus.BAD_REQUEST);
    }
    return this.examViewerService.getIeltsDiagnosticDetail(slug);
  }

  /**
   * Get list of all IELTS practice sets
   */
  @Get('ielts/practice-sets')
  async getIeltsPracticeSets() {
    return this.examViewerService.getIeltsPracticeSets();
  }

  /**
   * Get detailed questions from an IELTS practice set
   */
  @Get('ielts/practice-detail')
  async getIeltsPracticeDetail(
    @Query('practice_set_id') practiceSetId: string,
  ) {
    if (!practiceSetId) {
      throw new HttpException('Practice set ID is required', HttpStatus.BAD_REQUEST);
    }
    return this.examViewerService.getIeltsPracticeDetail(practiceSetId);
  }
}
