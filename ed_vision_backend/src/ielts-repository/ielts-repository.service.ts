import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { extractTextFromDocx } from './parsers/ielts-docx.parser';
import { extractTextFromPdf } from './parsers/ielts-pdf.parser';
import { parseReadingContent } from './parsers/ielts-reading.parser';
import { parseListeningContent } from './parsers/ielts-listening.parser';
import { parseWritingContent } from './parsers/ielts-writing.parser';
import { parseSpeakingContent } from './parsers/ielts-speaking.parser';
import {
  UploadReadingDto,
  UploadListeningDto,
  UploadWritingDto,
  UploadSpeakingDto,
  UploadAnswerKeyDto,
} from './dto/upload-skill.dto';
import { bootstrapIrt, type QuestionType } from './utils/irt-bootstrap.util';
import { IrtRefinementService } from './services/irt-refinement.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class IeltsRepositoryService {
  private readonly logger = new Logger(IeltsRepositoryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly irtRefinementService: IrtRefinementService,
  ) {}

  // ── File helpers ────────────────────────────────────────────────────────────

  private async extractText(file: Express.Multer.File): Promise<string> {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.docx') return extractTextFromDocx(file.buffer);
    if (ext === '.pdf') return extractTextFromPdf(file.buffer);
    throw new BadRequestException(`Unsupported file type: ${ext}. Use .docx or .pdf`);
  }

  private saveFilePermanently(file: Express.Multer.File, skill: string): string {
    const uploadDir = path.join(process.cwd(), 'uploads', 'ielts', skill);
    fs.mkdirSync(uploadDir, { recursive: true });
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filename = `${timestamp}_${safeName}`;
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, file.buffer);
    this.logger.log(`Saved file: ${filePath}`);
    return `/uploads/ielts/${skill}/${filename}`;
  }

  // ── READING ─────────────────────────────────────────────────────────────────

  async importReading(file: Express.Multer.File, dto: UploadReadingDto) {
    const rawText = await this.extractText(file);
    this.saveFilePermanently(file, 'reading');

    const parsed = parseReadingContent(rawText);
    const band = dto.targetBand ?? 6.0;
    const bandMin = Math.max(4, band - 1);
    const bandMax = Math.min(9, band + 1);

    const results: { passageId: string; questionCount: number }[] = [];

    for (const p of parsed.passages) {
      // Create passage
      const passage = await this.prisma.ieltsPassage.create({
        data: {
          skill: 'reading',
          title: p.title,
          content: p.body,
          band_min: bandMin,
          band_max: bandMax,
          topic_tags: [],
          status: 'draft',
        },
      });

      // Create questions
      for (const q of p.questions) {
        const bootstrap = bootstrapIrt(band, q.questionType as QuestionType);
        
        // AI Refinement
        const refined = await this.irtRefinementService.refineIrtB({
          questionText: q.questionText,
          questionType: q.questionType,
          passageContext: p.body,
          options: q.options,
          answerKey: q.answerKey,
          targetBand: band,
        });

        await this.prisma.ieltsQuestion.create({
          data: {
            skill: 'reading',
            questionType: q.questionType,
            questionText: q.questionText,
            options: q.options || [],
            correctAnswer: q.answerKey ?? '',
            bandMin: bandMin,
            bandMax: bandMax,
            isPlacement: dto.isPlacement ?? false,
            passage_id: passage.id,
            status: 'draft',
            irtA: bootstrap.irt_a,
            irtB: refined.irt_b,
            irtC: bootstrap.irt_c,
          },
        });
      }

      results.push({ passageId: passage.id, questionCount: p.questions.length });
    }

    this.logger.log(`Reading import: ${results.length} passages, ${results.reduce((s, r) => s + r.questionCount, 0)} questions`);
    return {
      success: true,
      testId: dto.testId,
      passages: results,
      answerKeyFound: Object.keys(parsed.rawAnswerKey).length,
    };
  }

  // ── LISTENING ───────────────────────────────────────────────────────────────

  async importListening(file: Express.Multer.File, dto: UploadListeningDto) {
    const rawText = await this.extractText(file);
    this.saveFilePermanently(file, 'listening');

    const parsed = parseListeningContent(rawText);
    const band = dto.targetBand ?? 6.0;
    const bandMin = Math.max(4, band - 1);
    const bandMax = Math.min(9, band + 1);

    const results: { passageId: string; sectionNumber: number; questionCount: number }[] = [];

    for (const sec of parsed.sections) {
      const passageRecord = await this.prisma.ieltsPassage.create({
        data: {
          title: `Listening Section ${sec.sectionNumber}`,
          content: sec.context,
          skill: 'listening',
          section_number: sec.sectionNumber,
          audio_url: dto.audioUrl ?? null,
          band_min: bandMin,
          band_max: bandMax,
          status: 'approved',
        },
      });

      for (const q of sec.questions) {
        const bootstrap = bootstrapIrt(band, q.questionType as QuestionType);

        // AI Refinement
        const refined = await this.irtRefinementService.refineIrtB({
          questionText: q.questionText,
          questionType: q.questionType,
          passageContext: sec.context,
          options: q.options,
          answerKey: q.answerKey,
          targetBand: band,
        });

        await this.prisma.ieltsQuestion.create({
          data: {
            skill: 'listening',
            questionType: q.questionType,
            questionText: q.questionText,
            options: q.options ? q.options : undefined,
            correctAnswer: q.answerKey ?? '',
            bandMin: bandMin,
            bandMax: bandMax,
            isPlacement: dto.isPlacement ?? false,
            passage_id: passageRecord.id,
            status: 'draft',
            irtA: bootstrap.irt_a,
            irtB: refined.irt_b,
            irtC: bootstrap.irt_c,
          },
        });
      }

      results.push({ passageId: passageRecord.id, sectionNumber: sec.sectionNumber, questionCount: sec.questions.length });
    }

    this.logger.log(`Listening import: ${results.length} sections`);
    return { success: true, testId: dto.testId, sections: results, answerKeyFound: Object.keys(parsed.rawAnswerKey).length };
  }

  // ── WRITING ─────────────────────────────────────────────────────────────────

  async importWriting(file: Express.Multer.File, dto: UploadWritingDto) {
    const rawText = await this.extractText(file);
    this.saveFilePermanently(file, 'writing');

    const parsed = parseWritingContent(rawText);
    const band = dto.targetBand ?? 6.5;
    const bandMin = Math.max(4, band - 1);
    const bandMax = Math.min(9, band + 1);

    const results: { questionId: string; taskType: string }[] = [];

    for (const task of parsed.tasks) {
      // Store chart description as passage (context), prompt as question
      let passageId: string | undefined;
      if (task.chartDescription) {
        const passage = await this.prisma.ieltsPassage.create({
          data: {
            skill: 'writing',
            title: `Writing ${task.taskType.toUpperCase()} Context`,
            content: task.chartDescription,
            band_min: bandMin,
            band_max: bandMax,
            topic_tags: [],
            status: 'draft',
          },
        });
        passageId = passage.id;
      }

      const bootstrap = bootstrapIrt(band, task.taskType as QuestionType);

      // AI Refinement
      const refined = await this.irtRefinementService.refineIrtB({
        questionText: task.questionText,
        questionType: task.taskType,
        passageContext: task.chartDescription,
        targetBand: band,
      });

      const question = await this.prisma.ieltsQuestion.create({
        data: {
          skill: 'writing',
          questionType: task.taskType,
          questionText: task.questionText,
          correctAnswer: '', // Writing has no fixed answer
          bandMin: bandMin,
          bandMax: bandMax,
          isPlacement: dto.isPlacement ?? false,
          passage_id: passageId ?? null,
          status: 'draft',
          irtA: bootstrap.irt_a,
          irtB: refined.irt_b,
          irtC: bootstrap.irt_c,
        },
      });

      results.push({ questionId: question.id, taskType: task.taskType });
    }

    this.logger.log(`Writing import: ${results.length} tasks`);
    return { success: true, tasks: results };
  }

  // ── SPEAKING ────────────────────────────────────────────────────────────────

  async importSpeaking(file: Express.Multer.File, dto: UploadSpeakingDto) {
    const rawText = await this.extractText(file);
    this.saveFilePermanently(file, 'speaking');

    const parsed = parseSpeakingContent(rawText);
    const band = dto.targetBand ?? 6.0;
    const bandMin = Math.max(4, band - 1);
    const bandMax = Math.min(9, band + 1);

    const results: { questionId: string; questionType: string }[] = [];

    // Part 2 cue card → passage (context)
    let part2PassageId: string | undefined;
    if (parsed.part2Cue) {
      const passage = await this.prisma.ieltsPassage.create({
        data: {
          skill: 'speaking',
          title: `Speaking Part 2: ${parsed.part2Topic ?? 'Cue Card'}`,
          content: parsed.part2Cue,
          band_min: bandMin,
          band_max: bandMax,
          topic_tags: parsed.part2Topic ? [parsed.part2Topic] : [],
          status: 'draft',
        },
      });
      part2PassageId = passage.id;
    }

    for (const q of parsed.questions) {
      const bootstrap = bootstrapIrt(band, q.questionType as QuestionType);

      // AI Refinement
      const refined = await this.irtRefinementService.refineIrtB({
        questionText: q.questionText,
        questionType: q.questionType,
        passageContext: q.questionType === 'part2' ? parsed.part2Cue : undefined,
        targetBand: band,
      });

      const question = await this.prisma.ieltsQuestion.create({
        data: {
          skill: 'speaking',
          questionType: q.questionType,
          questionText: q.questionText,
          correctAnswer: '', // Speaking has no fixed answer
          bandMin: bandMin,
          bandMax: bandMax,
          isPlacement: dto.isPlacement ?? false,
          passage_id: q.questionType === 'part2' ? part2PassageId : null,
          status: 'draft',
          irtA: bootstrap.irt_a,
          irtB: refined.irt_b,
          irtC: bootstrap.irt_c,
          topicTags: q.topic ? [q.topic] : [],
        },
      });

      results.push({ questionId: question.id, questionType: q.questionType });
    }

    this.logger.log(`Speaking import: ${results.length} questions`);
    return { success: true, questions: results, part2Topic: parsed.part2Topic };
  }

  // ── ANSWER KEY ──────────────────────────────────────────────────────────────

  async importAnswerKey(file: Express.Multer.File, dto: UploadAnswerKeyDto) {
    const rawText = await this.extractText(file);
    this.saveFilePermanently(file, 'answer-keys');

    // Parse answer key lines: "1-A 2-TRUE 3-C ..."
    const answerMap: Record<number, string> = {};
    const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      const tokens = line.replace(/ANSWER\s+KEY\s*:?/i, '').trim().split(/\s+/);
      for (const token of tokens) {
        const m = token.match(/^(\d+)[-.](.+)$/);
        if (m) answerMap[parseInt(m[1])] = m[2].toUpperCase();
      }
    }

    if (Object.keys(answerMap).length === 0) {
      throw new BadRequestException('No valid answer key entries found in file');
    }

    // Cross-check: find questions with matching testId metadata and update correctAnswer
    // For now, update all draft questions for this skill that don't have answers yet
    let updatedCount = 0;
    const questions = await this.prisma.ieltsQuestion.findMany({
      where: { skill: dto.skill, status: 'draft', correctAnswer: '' },
      orderBy: { createdAt: 'desc' },
    });

    // Match by question order (questionNumber corresponds to creation order)
    for (const q of questions) {
      // Try to find the answer by position
      const qNumMatch = q.questionText.match(/^(\d+)/);
      const qNum = qNumMatch ? parseInt(qNumMatch[1]) : null;
      if (qNum && answerMap[qNum]) {
        await this.prisma.ieltsQuestion.update({
          where: { id: q.id },
          data: { correctAnswer: answerMap[qNum] },
        });
        updatedCount++;
      }
    }

    this.logger.log(`Answer key import: ${updatedCount} questions updated for ${dto.skill}`);
    return {
      success: true,
      testId: dto.testId,
      totalKeysFound: Object.keys(answerMap).length,
      questionsUpdated: updatedCount,
    };
  }
}
