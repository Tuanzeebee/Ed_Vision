import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IeltsStorageService } from './storage.service';
import { IrtRefinementService } from './irt-refinement.service';
import { bootstrapIrt, type QuestionType } from '../utils/irt-bootstrap.util';
import { parseReadingContent } from '../parsers/ielts-reading.parser';
import { parseListeningContent } from '../parsers/ielts-listening.parser';
import { parseWritingContent } from '../parsers/ielts-writing.parser';
import { parseSpeakingContent } from '../parsers/ielts-speaking.parser';
import { extractTextFromDocx } from '../parsers/ielts-docx.parser';
import { SkillType } from '../dto/upload-skill.dto';

export type UploadMeta =
  | { skill: SkillType.READING; targetBand?: number; isPlacement?: boolean; testId?: string }
  | { skill: SkillType.LISTENING; targetBand?: number; isPlacement?: boolean; testId?: string; audioUrl: string }
  | { skill: SkillType.WRITING; targetBand?: number; isPlacement?: boolean }
  | { skill: SkillType.SPEAKING; targetBand?: number; isPlacement?: boolean };

@Injectable()
export class QuestionUploadService {
  private readonly logger = new Logger(QuestionUploadService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: IeltsStorageService,
    private readonly irtRefinement: IrtRefinementService,
  ) {}

  async processUpload(
    file: Express.Multer.File,
    meta: UploadMeta,
  ): Promise<{ created: number; skill: string }> {
    // 1. Extract raw text from DOCX
    const rawText = await extractTextFromDocx(file.buffer);

    // 2. Store file permanently
    const filePath = await this.storage.saveQuestionFile(file, meta.skill);

    // 3. Route to skill processor
    switch (meta.skill) {
      case SkillType.READING:
        return this.processReading(rawText, meta, filePath);
      case SkillType.LISTENING:
        return this.processListening(rawText, meta, filePath);
      case SkillType.WRITING:
        return this.processWriting(rawText, meta, filePath);
      case SkillType.SPEAKING:
        return this.processSpeaking(rawText, meta, filePath);
      default:
        throw new BadRequestException('Unsupported skill');
    }
  }

  // ── Reading ────────────────────────────────────────────────────────────────

  private async processReading(
    rawText: string,
    meta: { targetBand?: number; isPlacement?: boolean; testId?: string },
    _filePath: string,
  ): Promise<{ created: number; skill: string }> {
    const { passages } = parseReadingContent(rawText);
    const band = meta.targetBand ?? 6.5;
    let createdCount = 0;

    for (const passage of passages) {
      const passageRecord = await this.prisma.ieltsPassage.create({
        data: {
          title: passage.title,
          content: passage.body,
          skill: 'reading',
          band_min: Math.max(4, band - 1),
          band_max: Math.min(9, band + 1),
          status: 'approved', // Auto-approve
        },
      });

      for (const q of passage.questions) {
        const irt = await this.resolveIrt(
          q.questionText,
          q.questionType as QuestionType,
          passage.body,
          band,
          q.options,
          q.answerKey,
        );

        await this.prisma.ieltsQuestion.create({
          data: {
            passage_id: passageRecord.id,
            skill: 'reading',
            questionText: q.questionText,
            questionType: q.questionType,
            options: q.options ?? [],
            correctAnswer: q.answerKey ?? '',
            bandMin: Math.max(4, band - 1),
            bandMax: Math.min(9, band + 1),
            isPlacement: meta.isPlacement ?? false,
            irtA: irt.irt_a,
            irtB: irt.irt_b,
            irtC: irt.irt_c,
            status: 'approved',
            contextType: 'passage',
          },
        });
        createdCount++;
      }
    }
    return { created: createdCount, skill: 'reading' };
  }

  // ── Listening ──────────────────────────────────────────────────────────────

  private async processListening(
    rawText: string,
    meta: { targetBand?: number; isPlacement?: boolean; testId?: string; audioUrl?: string },
    _filePath: string,
  ): Promise<{ created: number; skill: string }> {
    const { sections } = parseListeningContent(rawText);
    const band = meta.targetBand ?? 6.0;
    let createdCount = 0;

    for (const section of sections) {
      const passageRecord = await this.prisma.ieltsPassage.create({
        data: {
          title: `Listening Section ${section.sectionNumber}`,
          content: section.context,
          skill: 'listening',
          section_number: section.sectionNumber,
          audio_url: meta.audioUrl ?? null,
          band_min: Math.max(4, band - 1),
          band_max: Math.min(9, band + 1),
          status: 'approved',
        },
      });

      for (const q of section.questions) {
        const irt = await this.resolveIrt(
          q.questionText,
          q.questionType as QuestionType,
          section.context,
          band,
          q.options,
          q.answerKey,
        );

        await this.prisma.ieltsQuestion.create({
          data: {
            passage_id: passageRecord.id,
            skill: 'listening',
            questionText: q.questionText,
            questionType: q.questionType,
            options: q.options ?? [],
            correctAnswer: q.answerKey ?? '',
            bandMin: Math.max(4, band - 1),
            bandMax: Math.min(9, band + 1),
            isPlacement: meta.isPlacement ?? false,
            irtA: irt.irt_a,
            irtB: irt.irt_b,
            irtC: irt.irt_c,
            status: 'approved',
            contextType: 'audio',
          },
        });
        createdCount++;
      }
    }
    return { created: createdCount, skill: 'listening' };
  }

  // ── Writing ────────────────────────────────────────────────────────────────

  private async processWriting(
    rawText: string,
    meta: { targetBand?: number; isPlacement?: boolean },
    _filePath: string,
  ): Promise<{ created: number; skill: string }> {
    const { tasks } = parseWritingContent(rawText);
    const band = meta.targetBand ?? 6.5;
    let createdCount = 0;

    for (const task of tasks) {
      let passageId: string | null = null;
      if (task.chartDescription) {
        const passage = await this.prisma.ieltsPassage.create({
          data: {
            skill: 'writing',
            title: `Writing ${task.taskType.toUpperCase()} Context`,
            content: task.chartDescription,
            band_min: Math.max(4, band - 1),
            band_max: Math.min(9, band + 1),
            status: 'approved',
          },
        });
        passageId = passage.id;
      }

      const irt = await this.resolveIrt(
        task.questionText,
        task.taskType as QuestionType,
        task.chartDescription,
        band,
      );

      await this.prisma.ieltsQuestion.create({
        data: {
          passage_id: passageId,
          skill: 'writing',
          questionText: task.questionText,
          questionType: task.taskType,
          correctAnswer: '',
          bandMin: Math.max(4, band - 1),
          bandMax: Math.min(9, band + 1),
          isPlacement: meta.isPlacement ?? false,
          irtA: irt.irt_a,
          irtB: irt.irt_b,
          irtC: irt.irt_c,
          status: 'approved',
          contextType: task.chartDescription ? 'passage' : 'standalone',
        },
      });
      createdCount++;
    }
    return { created: createdCount, skill: 'writing' };
  }

  // ── Speaking ───────────────────────────────────────────────────────────────

  private async processSpeaking(
    rawText: string,
    meta: { targetBand?: number; isPlacement?: boolean },
    _filePath: string,
  ): Promise<{ created: number; skill: string }> {
    const { questions, part2Cue, part2Topic } = parseSpeakingContent(rawText);
    const band = meta.targetBand ?? 6.0;
    let createdCount = 0;

    let part2PassageId: string | null = null;
    if (part2Cue) {
      const passage = await this.prisma.ieltsPassage.create({
        data: {
          skill: 'speaking',
          title: `Speaking Part 2: ${part2Topic ?? 'Cue Card'}`,
          content: part2Cue,
          band_min: Math.max(4, band - 1),
          band_max: Math.min(9, band + 1),
          status: 'approved',
        },
      });
      part2PassageId = passage.id;
    }

    for (const q of questions) {
      const irt = await this.resolveIrt(
        q.questionText,
        q.questionType as QuestionType,
        q.questionType === 'part2' ? part2Cue : undefined,
        band,
      );

      await this.prisma.ieltsQuestion.create({
        data: {
          passage_id: q.questionType === 'part2' ? part2PassageId : null,
          skill: 'speaking',
          questionText: q.questionText,
          questionType: q.questionType,
          correctAnswer: '',
          bandMin: Math.max(4, band - 1),
          bandMax: Math.min(9, band + 1),
          isPlacement: meta.isPlacement ?? false,
          irtA: irt.irt_a,
          irtB: irt.irt_b,
          irtC: irt.irt_c,
          status: 'approved',
          contextType: q.questionType === 'part2' ? 'passage' : 'standalone',
          topicTags: q.topic ? [q.topic] : [],
        },
      });
      createdCount++;
    }
    return { created: createdCount, skill: 'speaking' };
  }

  // ── IRT resolution ────────────────────────────────────────────────────────

  private async resolveIrt(
    questionText: string,
    questionType: QuestionType,
    passageContext?: string,
    targetBand?: number,
    options?: string[],
    answerKey?: string,
  ) {
    const band = targetBand ?? 6.5;
    const base = bootstrapIrt(band, questionType);

    const refined = await this.irtRefinement.refineIrtB({
      questionText,
      questionType,
      passageContext,
      targetBand: band,
      options,
      answerKey,
    });

    this.logger.debug(
      `IRT [${questionType}] heuristic_b=${base.irt_b} → refined_b=${refined.irt_b} (${refined.confidence})`,
    );

    return {
      irt_a: base.irt_a,
      irt_b: refined.irt_b,
      irt_c: base.irt_c,
    };
  }
}
