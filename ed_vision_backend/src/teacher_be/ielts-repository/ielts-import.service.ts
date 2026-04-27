import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { basename, extname, join, resolve } from 'path';
import { PrismaService } from '../../prisma/prisma.service';
import {
  IeltsOcrImportDto,
  IeltsOcrImportResponseDto,
  IeltsAnswerKeyImportDto,
  IeltsAnswerKeyImportResponseDto,
  IeltsListeningAudioUploadDto,
  IeltsListeningAudioUploadResponseDto,
  IeltsRepositoryListItemDto,
  IeltsRepositoryDeleteResponseDto,
} from './dto/ielts-import.dto';

// ─── Internal types ───────────────────────────────────────────────────────────

interface ParsedIeltsOption {
  optionKey: string;
  optionText: string;
  isCorrect: boolean;
  rationale: string | null;
}

interface ParsedIeltsQuestion {
  questionNumber: number | null;
  section: number | null;
  stem: string;
  context: string | null;
  questionType: string; // mcq | fill-blank | true-false | matching | short-answer
  options: ParsedIeltsOption[];
  explanation: string | null;
}

// ─── OCR text extraction (reused from Node child-process) ────────────────────

async function extractTextViaPython(filePath: string): Promise<string> {
  const { execFile } = await import('child_process');
  const { promisify } = await import('util');
  const execFileAsync = promisify(execFile);

  const script = resolve(join(process.cwd(), 'python', 'extract_text.py'));
  if (!existsSync(script)) {
    // Fallback: try pdf-parse if available
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const pdfParse = require('pdf-parse') as (
        buf: Buffer,
      ) => Promise<{ text: string }>;
      const buf = await readFile(filePath);
      const result = await pdfParse(buf);
      return result.text ?? '';
    } catch {
      throw new Error(
        'Không tìm thấy python/extract_text.py và pdf-parse không khả dụng.',
      );
    }
  }

  const { stdout } = await execFileAsync('python', [script, filePath], {
    timeout: 60_000,
    maxBuffer: 10 * 1024 * 1024,
  });
  return stdout ?? '';
}

// ─── Directory helpers ────────────────────────────────────────────────────────

function ieltsListeningAudioRelDir(slug: string): string {
  return join('IELTS', 'ielts-listening', slug, 'audio');
}

function absoluteUploadsDir(...parts: string[]): string {
  return resolve(join(process.cwd(), 'uploads', ...parts));
}

// ─── Answer-key line patterns ─────────────────────────────────────────────────

/** Matches lines like:  1. B  /  1) C  /  Q1: A  /  1 - D  */
const ANSWER_KEY_LINE_RE =
  /^\s*(?:Q\.?|Question\s*)?(\d{1,3})\s*[.):\-–]\s*([A-D]|TRUE|FALSE|NOT\s*GIVEN|NG|T|F)\s*$/i;

function extractAnswerKeyMap(text: string): Map<number, string> {
  const map = new Map<number, string>();
  for (const line of text.split('\n')) {
    const m = ANSWER_KEY_LINE_RE.exec(line.trim());
    if (!m) continue;
    const num = parseInt(m[1], 10);
    let ans = m[2].toUpperCase().trim();
    if (ans === 'T') ans = 'TRUE';
    if (ans === 'F') ans = 'FALSE';
    if (ans === 'NG') ans = 'NOT GIVEN';
    if (num >= 1 && num <= 200) map.set(num, ans);
  }
  return map;
}

// ─── IELTS question parser ────────────────────────────────────────────────────

/**
 * Parse raw OCR text into a list of IELTS questions.
 *
 * Handles:
 *  - Multiple-choice (A/B/C/D)
 *  - True / False / Not Given
 *  - Fill-in-the-blank  (Questions XX–YY)
 *  - Short answer
 *
 * The parser is intentionally lenient — real IELTS PDFs have many formats.
 */
function parseIeltsQuestionsFromOcrText(
  rawText: string,
  skillArea: 'listening' | 'reading',
): ParsedIeltsQuestion[] {
  const normalized = rawText
    .replace(/\r/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/[\t\f\v]+/g, ' ')
    .trim();

  if (!normalized) return [];

  const lines = normalized
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter((l) => l.length > 0);

  const answerKeyMap = extractAnswerKeyMap(normalized);

  // ── Section detection ─────────────────────────────────────────────────────

  const SECTION_RE = /^(?:SECTION|Section)\s*([1-4])/i;
  const PASSAGE_RE = /^(?:READING\s*PASSAGE|PASSAGE)\s*([1-3])/i;

  // ── Question number detection ─────────────────────────────────────────────

  const Q_NUMBER_RE =
    /^(?:Q\.?\s*|Question\s*)?(\d{1,3})\s*[.)]\s+(.+)/i;

  // ── Option detection ──────────────────────────────────────────────────────

  const OPTION_RE = /^\s*([A-D])[.)]\s+(.+)/;

  // ── True/False/Not Given detection ───────────────────────────────────────

  const TF_RE = /^(TRUE|FALSE|NOT\s*GIVEN)\b/i;

  // ── Fill-blank / short-answer range detection ─────────────────────────────
  // e.g. "Questions 1–3  Complete the notes below"

  const RANGE_RE =
    /^Questions?\s+(\d{1,3})\s*[-–]\s*(\d{1,3})/i;

  const questions: ParsedIeltsQuestion[] = [];

  let currentSection = skillArea === 'listening' ? 1 : 1;
  let contextBuffer: string[] = [];

  type Working = {
    questionNumber: number | null;
    section: number | null;
    stem: string;
    contextLines: string[];
    options: ParsedIeltsOption[];
    questionType: string;
    explanation: string | null;
    lastOptKey: string | null;
    inExplanation: boolean;
  };

  let working: Working | null = null;

  const flush = () => {
    if (!working) return;
    const w = working;

    let stem = w.stem.trim();
    const context = w.contextLines.join('\n').trim();

    if (!stem && context) {
      stem = context;
    }
    if (!stem) {
      working = null;
      return;
    }

    // Resolve answer from key map
    const qNum = w.questionNumber;
    const mappedAns = typeof qNum === 'number' ? answerKeyMap.get(qNum) : null;

    // For MCQ, mark correct option
    if (w.options.length >= 2 && mappedAns) {
      for (const opt of w.options) {
        opt.isCorrect = opt.optionKey === mappedAns;
      }
    }

    // For T/F/NG, synthesise options if needed
    if (
      w.questionType === 'true-false' &&
      w.options.length === 0
    ) {
      const tfKeys = ['TRUE', 'FALSE', 'NOT GIVEN'];
      for (const key of tfKeys) {
        w.options.push({
          optionKey: key,
          optionText: key,
          isCorrect: key === mappedAns,
          rationale: null,
        });
      }
    }

    // For fill-blank / short-answer, create a placeholder option if answer known
    if (
      (w.questionType === 'fill-blank' || w.questionType === 'short-answer') &&
      w.options.length === 0 &&
      mappedAns
    ) {
      w.options.push({
        optionKey: 'A',
        optionText: mappedAns,
        isCorrect: true,
        rationale: null,
      });
    }

    if (w.options.length === 0 && !mappedAns) {
      working = null;
      return;
    }

    questions.push({
      questionNumber: w.questionNumber,
      section: w.section,
      stem,
      context: context || null,
      questionType: w.questionType,
      options: w.options,
      explanation: w.explanation,
    });

    working = null;
  };

  for (const line of lines) {
    // ── Section / passage headers ─────────────────────────────────────────
    const sectionMatch = SECTION_RE.exec(line);
    if (sectionMatch) {
      flush();
      currentSection = parseInt(sectionMatch[1], 10);
      contextBuffer = [];
      continue;
    }
    const passageMatch = PASSAGE_RE.exec(line);
    if (passageMatch) {
      flush();
      currentSection = parseInt(passageMatch[1], 10);
      contextBuffer = [];
      continue;
    }

    // ── Question-range hint (fill-blank, matching, etc.) ─────────────────
    if (RANGE_RE.test(line)) {
      // Treat the line after as context header — just add to contextBuffer
      contextBuffer.push(line);
      continue;
    }

    // ── New question number ───────────────────────────────────────────────
    const qMatch = Q_NUMBER_RE.exec(line);
    if (qMatch) {
      flush();
      const num = parseInt(qMatch[1], 10);
      const stemRaw = qMatch[2].trim();

      // Determine question type from stem heuristics
      let qType = 'mcq';
      if (/TRUE|FALSE|NOT\s*GIVEN/i.test(stemRaw)) {
        qType = 'true-false';
      } else if (/complete|fill in|write|NO MORE THAN/i.test(stemRaw)) {
        qType = 'fill-blank';
      }

      working = {
        questionNumber: num,
        section: currentSection,
        stem: stemRaw,
        contextLines: contextBuffer.slice(-10), // last 10 context lines
        options: [],
        questionType: qType,
        explanation: null,
        lastOptKey: null,
        inExplanation: false,
      };
      contextBuffer = [];
      continue;
    }

    if (!working) {
      // Accumulate as context for the next question
      if (
        line.length > 10 &&
        !/^(directions?|instructions?|note:|example)/i.test(line)
      ) {
        contextBuffer.push(line);
        if (contextBuffer.length > 20) contextBuffer.shift();
      }
      continue;
    }

    // ── Option line ───────────────────────────────────────────────────────
    const optMatch = OPTION_RE.exec(line);
    if (optMatch) {
      const key = optMatch[1].toUpperCase();
      const text = optMatch[2].trim();
      working.options.push({
        optionKey: key,
        optionText: text,
        isCorrect: false,
        rationale: null,
      });
      working.lastOptKey = key;
      continue;
    }

    // ── T/F/NG shorthand on its own line ─────────────────────────────────
    const tfMatch = TF_RE.exec(line);
    if (tfMatch && working.questionType === 'true-false') {
      // These are the answer choices for T/F/NG questions — handled at flush
      continue;
    }

    // ── Continuation of stem or last option ──────────────────────────────
    if (working.lastOptKey && working.options.length > 0) {
      const last = working.options[working.options.length - 1];
      last.optionText = `${last.optionText} ${line}`;
    } else {
      working.stem = `${working.stem} ${line}`;
    }
  }

  flush();

  return questions;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class IeltsImportService {
  private readonly logger = new Logger(IeltsImportService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── OCR import ──────────────────────────────────────────────────────────

  async importFromOcrFile(
    accountId: number,
    dto: IeltsOcrImportDto,
    file: Express.Multer.File,
  ): Promise<IeltsOcrImportResponseDto> {
    if (!file) throw new BadRequestException('File PDF là bắt buộc.');

    const skillArea = this.resolveSkillArea(dto.skill_area, file.originalname);
    const rawText = await this.extractText(file);

    if (!rawText || rawText.length < 40) {
      throw new BadRequestException(
        'Không trích xuất được đủ văn bản từ file. Vui lòng kiểm tra file PDF.',
      );
    }

    const parsedQuestions = parseIeltsQuestionsFromOcrText(rawText, skillArea);

    if (parsedQuestions.length === 0) {
      throw new BadRequestException(
        'Không phân tích được câu hỏi hợp lệ từ nội dung OCR. ' +
          'Hãy đảm bảo PDF có câu hỏi đánh số (1. / 1) / Q1.).',
      );
    }

    // ── Get or create repository ──────────────────────────────────────────
    const repository = await this.prisma.learningRepository.upsert({
      where: { slug: dto.repository_slug.trim() },
      create: {
        cert_type: 'ielts',
        title: dto.repository_title?.trim() || dto.repository_slug.trim(),
        slug: dto.repository_slug.trim(),
        description: dto.repository_description ?? null,
        content_type: 'exam_simulation',
        skill_area: skillArea,
        is_published: false,
        total_items: 0,
        metadata: {
          source: 'ocr_import',
          source_file: basename(file.originalname || file.path),
          created_by: accountId,
          band_range: dto.band_range ?? null,
          exam_year: dto.exam_year ?? null,
        },
      },
      update: {
        title: dto.repository_title?.trim() || dto.repository_slug.trim(),
        description: dto.repository_description ?? null,
        skill_area: skillArea,
        metadata: {
          source: 'ocr_import',
          source_file: basename(file.originalname || file.path),
          created_by: accountId,
          band_range: dto.band_range ?? null,
          exam_year: dto.exam_year ?? null,
        },
      },
      select: { id: true, slug: true },
    });

    // ── Optionally wipe existing items ────────────────────────────────────
    if (dto.replace_existing !== false) {
      await this.prisma.learningRepositoryItem.deleteMany({
        where: { repository_id: repository.id },
      });
    }

    const lastItem = await this.prisma.learningRepositoryItem.findFirst({
      where: { repository_id: repository.id },
      orderBy: { item_order: 'desc' },
      select: { item_order: true },
    });

    let nextOrder = Number(lastItem?.item_order ?? 0) + 1;
    let importedCount = 0;
    let skippedCount = 0;

    for (const parsed of parsedQuestions) {
      if (!parsed.stem || parsed.options.length === 0) {
        skippedCount++;
        continue;
      }

      // Estimated seconds per question type
      const estimatedSeconds =
        skillArea === 'listening'
          ? 30
          : parsed.questionType === 'true-false'
            ? 60
            : 90;

      const created = await this.prisma.learningRepositoryItem.create({
        data: {
          repository_id: repository.id,
          item_order: nextOrder,
          item_type: this.mapItemType(parsed.questionType),
          stem: parsed.stem,
          reading_passage: parsed.context ?? null,
          explanation: parsed.explanation ?? null,
          score_weight: 1,
          estimated_seconds: estimatedSeconds,
          metadata: {
            source: 'ocr_import',
            source_file: basename(file.originalname || file.path),
            section: parsed.section,
            question_number: parsed.questionNumber ?? null,
            question_type: parsed.questionType,
          },
        },
        select: { id: true },
      });

      await this.prisma.learningRepositoryOption.createMany({
        data: parsed.options.map((opt, idx) => ({
          item_id: created.id,
          option_key: opt.optionKey,
          option_text: opt.optionText,
          is_correct: opt.isCorrect,
          rationale: opt.rationale ?? null,
          sort_order: idx + 1,
        })),
      });

      importedCount++;
      nextOrder++;
    }

    // ── Update total_items ────────────────────────────────────────────────
    const totalItems = await this.prisma.learningRepositoryItem.count({
      where: { repository_id: repository.id },
    });

    await this.prisma.learningRepository.update({
      where: { id: repository.id },
      data: {
        total_items: totalItems,
        estimated_minutes: Math.max(1, Math.ceil(totalItems * 1.5)),
        pass_score: Math.max(1, Math.ceil(totalItems * 0.65)),
      },
    });

    this.logger.log(
      `IELTS OCR import: slug="${repository.slug}" ` +
        `imported=${importedCount} skipped=${skippedCount}`,
    );

    return {
      repository_id: repository.id,
      slug: repository.slug,
      skill_area: skillArea,
      imported_count: importedCount,
      skipped_count: skippedCount,
      total_detected: parsedQuestions.length,
      source_filename: basename(file.originalname || file.path),
    };
  }

  // ─── Answer-key import ────────────────────────────────────────────────────

  async importAnswerKey(
    dto: IeltsAnswerKeyImportDto,
    file: Express.Multer.File,
  ): Promise<IeltsAnswerKeyImportResponseDto> {
    if (!file) throw new BadRequestException('File đáp án là bắt buộc.');

    const repository = await this.prisma.learningRepository.findUnique({
      where: { slug: dto.repository_slug.trim() },
      select: { id: true, slug: true },
    });

    if (!repository) {
      throw new BadRequestException(
        `Không tìm thấy repository: ${dto.repository_slug}`,
      );
    }

    const raw = await readFile(file.path, 'utf8').catch(() => '');
    const answerKeyMap = extractAnswerKeyMap(raw);

    if (answerKeyMap.size === 0) {
      throw new BadRequestException(
        'Không tìm thấy đáp án hợp lệ trong file. ' +
          'Định dạng: "1. B" hoặc "1) A" mỗi dòng.',
      );
    }

    const items = await this.prisma.learningRepositoryItem.findMany({
      where: { repository_id: repository.id },
      select: {
        id: true,
        metadata: true,
        options: { select: { id: true, option_key: true } },
      },
    });

    let updatedCount = 0;
    let skippedCount = 0;

    for (const item of items) {
      const meta = item.metadata as Record<string, unknown> | null;
      const qNum =
        typeof meta?.question_number === 'number'
          ? (meta.question_number as number)
          : null;

      if (qNum === null) {
        skippedCount++;
        continue;
      }

      const correctKey = answerKeyMap.get(qNum);
      if (!correctKey) {
        skippedCount++;
        continue;
      }

      // Reset all options for this item
      await this.prisma.learningRepositoryOption.updateMany({
        where: { item_id: item.id },
        data: { is_correct: false },
      });

      // Mark the correct option
      const matchingOpt = item.options.find(
        (o) => o.option_key.toUpperCase() === correctKey.toUpperCase(),
      );

      if (matchingOpt) {
        await this.prisma.learningRepositoryOption.update({
          where: { id: matchingOpt.id },
          data: { is_correct: true },
        });
        updatedCount++;
      } else {
        skippedCount++;
      }
    }

    const totalConfigured = await this.prisma.learningRepositoryOption.count({
      where: {
        item: { repository_id: repository.id },
        is_correct: true,
      },
    });

    const answerKeyComplete = totalConfigured >= items.length && items.length > 0;

    return {
      repository_id: repository.id,
      slug: repository.slug,
      updated_count: updatedCount,
      skipped_count: skippedCount,
      answer_key_complete: answerKeyComplete,
    };
  }

  // ─── Listening audio upload ───────────────────────────────────────────────

  async uploadListeningAudio(
    dto: IeltsListeningAudioUploadDto,
    file: Express.Multer.File,
  ): Promise<IeltsListeningAudioUploadResponseDto> {
    const slug = dto.repository_slug.trim();

    const repository = await this.prisma.learningRepository.findFirst({
      where: { slug, cert_type: 'ielts' },
      select: { id: true, slug: true },
    });

    if (!repository) {
      throw new BadRequestException(
        `Không tìm thấy IELTS repository: ${slug}`,
      );
    }

    const section = dto.section ?? this.inferSectionFromFilename(file.originalname);
    const trackNumber = dto.track_number ?? 1;

    // ── Save file ─────────────────────────────────────────────────────────
    const audioRelDir = ieltsListeningAudioRelDir(slug);
    const audioAbsDir = absoluteUploadsDir(...audioRelDir.split(/[\\/]/));
    if (!existsSync(audioAbsDir)) mkdirSync(audioAbsDir, { recursive: true });

    const ext = extname(file.originalname).toLowerCase() || '.mp3';
    const filename = `${slug}_sec${section}_${String(trackNumber).padStart(3, '0')}${ext}`;
    const destPath = join(audioAbsDir, filename);

    const srcBuffer = await readFile(file.path);
    await writeFile(destPath, srcBuffer);

    const audioUrl = `/uploads/IELTS/ielts-listening/${slug}/audio/${filename}`;

    // ── Map audio to repository items by section + track ──────────────────
    const mappedItemIds = await this.mapAudioToItems(
      repository.id,
      section,
      trackNumber,
      audioUrl,
    );

    return {
      repository_id: repository.id,
      slug: repository.slug,
      audio_url: audioUrl,
      filename,
      section,
      track_number: trackNumber,
      mapped_item_ids: mappedItemIds,
    };
  }

  // ─── List repositories ────────────────────────────────────────────────────

  async listRepositories(
    skillArea?: string,
  ): Promise<IeltsRepositoryListItemDto[]> {
    const where: Record<string, unknown> = { cert_type: 'ielts' };
    if (skillArea) where.skill_area = skillArea;

    const repos = await this.prisma.learningRepository.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: 50,
      select: {
        id: true,
        slug: true,
        title: true,
        skill_area: true,
        total_items: true,
        is_published: true,
        created_at: true,
      },
    });

    return repos.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title ?? r.slug,
      skill_area: r.skill_area ?? 'unknown',
      total_items: r.total_items ?? 0,
      is_published: r.is_published ?? false,
      created_at: r.created_at,
    }));
  }

  // ─── Publish / unpublish ──────────────────────────────────────────────────

  async publishRepository(
    slug: string,
    publish: boolean,
  ): Promise<{ slug: string; is_published: boolean }> {
    const repo = await this.prisma.learningRepository.findFirst({
      where: { slug, cert_type: 'ielts' },
      select: { id: true },
    });

    if (!repo) {
      throw new BadRequestException(`Không tìm thấy IELTS repository: ${slug}`);
    }

    await this.prisma.learningRepository.update({
      where: { id: repo.id },
      data: { is_published: publish },
    });

    return { slug, is_published: publish };
  }

  // ─── Delete repository ────────────────────────────────────────────────────

  async deleteRepository(slug: string): Promise<IeltsRepositoryDeleteResponseDto> {
    const repo = await this.prisma.learningRepository.findFirst({
      where: { slug, cert_type: 'ielts' },
      select: { id: true },
    });

    if (!repo) {
      throw new BadRequestException(`Không tìm thấy IELTS repository: ${slug}`);
    }

    const itemCount = await this.prisma.learningRepositoryItem.count({
      where: { repository_id: repo.id },
    });

    await this.prisma.learningRepositoryOption.deleteMany({
      where: { item: { repository_id: repo.id } },
    });
    await this.prisma.learningRepositoryItem.deleteMany({
      where: { repository_id: repo.id },
    });
    await this.prisma.learningRepository.delete({ where: { id: repo.id } });

    return { slug, deleted: true, items_deleted: itemCount };
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private resolveSkillArea(
    dtoSkill: string | undefined,
    filename: string,
  ): 'listening' | 'reading' {
    const s = (dtoSkill ?? '').toLowerCase();
    if (s === 'listening') return 'listening';
    if (s === 'reading') return 'reading';
    const fn = filename.toLowerCase();
    if (fn.includes('listen')) return 'listening';
    if (fn.includes('read')) return 'reading';
    return 'reading'; // default
  }

  private mapItemType(questionType: string): string {
    switch (questionType) {
      case 'fill-blank':
        return 'fill_blank';
      case 'short-answer':
        return 'short_answer';
      case 'true-false':
        return 'single_choice';
      case 'matching':
        return 'single_choice';
      default:
        return 'single_choice'; // mcq
    }
  }

  private inferSectionFromFilename(filename: string): number {
    const m = /sec(?:tion)?[-_\s]*([1-4])/i.exec(filename);
    if (m) return parseInt(m[1], 10);
    return 1;
  }

  private async extractText(file: Express.Multer.File): Promise<string> {
    const ext = extname(file.originalname || file.path).toLowerCase();

    if (ext === '.txt') {
      return readFile(file.path, 'utf8');
    }

    if (ext === '.xlsx' || ext === '.xls') {
      // Best-effort: read first sheet as text
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const XLSX = require('xlsx');
        const wb = XLSX.readFile(file.path);
        const ws = wb.Sheets[wb.SheetNames[0]];
        return XLSX.utils.sheet_to_txt(ws) ?? '';
      } catch {
        return '';
      }
    }

    // PDF or unknown → try Python extractor
    return extractTextViaPython(file.path);
  }

  /**
   * Map an uploaded audio file to repository items by section + track number.
   *
   * IELTS Listening mapping:
   *   Section 1 → first block of questions in the repository for section 1
   *   Section 2 → second block, etc.
   *   Within a section, one audio track covers all questions unless track_number
   *   is specified as > 1 (in which case we try to slice).
   *
   * Returns IDs of all items that got the audio URL assigned.
   */
  private async mapAudioToItems(
    repositoryId: number,
    section: number,
    _trackNumber: number,
    audioUrl: string,
  ): Promise<number[]> {
    const items = await this.prisma.learningRepositoryItem.findMany({
      where: { repository_id: repositoryId },
      orderBy: { item_order: 'asc' },
      select: { id: true, metadata: true },
    });

    const sectionItems = items.filter((item) => {
      const meta = item.metadata as Record<string, unknown> | null;
      return meta?.section === section;
    });

    if (sectionItems.length === 0) return [];

    const ids = sectionItems.map((i) => i.id);

    await this.prisma.learningRepositoryItem.updateMany({
      where: { id: { in: ids } },
      data: { media_audio_url: audioUrl },
    });

    this.logger.log(
      `Mapped audio "${audioUrl}" → ${ids.length} items in section ${section}`,
    );

    return ids;
  }
}
