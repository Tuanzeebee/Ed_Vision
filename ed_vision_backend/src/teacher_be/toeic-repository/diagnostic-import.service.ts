import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { readFile } from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import { extname, join, resolve } from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { PrismaService } from '../../prisma/prisma.service';
import { tryEncryptString } from '../../common/crypto.util';

const execFileAsync = promisify(execFile);

function absoluteUploadsDir(...parts: string[]): string {
  return resolve(join(process.cwd(), 'uploads', ...parts));
}

const IMG_MIN_WIDTH = 80;
const IMG_MIN_HEIGHT = 80;

function surveyImagesRelDir(slug: string): string {
  return join('certificate', 'TOEIC', 'toeic-listening-survey', slug, 'images');
}

import { IsOptional, IsString } from 'class-validator';
import { CertificateEnrollmentService } from 'src/student_be/certificate/certificate-enrollment.service';

export interface ParsedOption {
  optionKey: string;
  optionText: string;
  isCorrect: boolean;
}

export interface ParsedDiagnosticQuestion {
  questionNumber: number | null;
  stem: string;
  options: ParsedOption[];
  detectedPart: number | null;
}

export class DiagnosticImportDto {
  // Empty DTO for now
}

export class DiagnosticImportResponseDto {
  diagnostic_set_id!: string;
  imported_count!: number;
}

@Injectable()
export class DiagnosticImportService {
  private readonly logger = new Logger(DiagnosticImportService.name);

  constructor(private readonly prisma: PrismaService) { }

  // ── Extract Text ─────────────────────────────────────────────────────────────

  private async extractText(file: Express.Multer.File): Promise<string> {
    const ext = extname(file.originalname || file.filename || '').toLowerCase();

    if (ext === '.pdf') {
      try {
        const pdfParseModule = await import('pdf-parse');
        const buf = await readFile(file.path);
        const parserCtor = (pdfParseModule as { PDFParse?: any }).PDFParse;

        if (typeof parserCtor === 'function') {
          const parser = new parserCtor({ data: buf });
          try {
            const parsed = await parser.getText();
            return String(parsed?.text ?? '');
          } finally {
            if (typeof parser.destroy === 'function') {
              await parser.destroy().catch(() => undefined);
            }
          }
        }

        const legacyDefault = (pdfParseModule as { default?: any }).default;
        if (typeof legacyDefault === 'function') {
          const parsed = await legacyDefault(buf);
          return String(parsed?.text ?? '');
        }
      } catch (err) {
        this.logger.warn(`Cannot parse PDF with pdf-parse: ${String(err)}`);
      }
    }

    // Fallback to text
    try {
      const buf = await readFile(file.path);
      return buf.toString('utf8');
    } catch {
      return '';
    }
  }

  // ── Parsers ──────────────────────────────────────────────────────────────────
  private normalizeOptionKey(raw: string): string | null {
    const normalized = String(raw).toUpperCase().trim();
    if (!normalized) return null;
    const match = normalized.match(/^[[(]?\s*([A-D])\s*[\]).:-]?$/) || normalized.match(/\b([A-D])\b/);
    return match ? match[1] : null;
  }

  private parseQuestionNumber(raw: string): number | null {
    const match = String(raw).match(/\d{1,3}/);
    if (!match?.[0]) return null;
    const parsed = Number(match[0]);
    return Number.isFinite(parsed) && parsed >= 1 && parsed <= 200 ? parsed : null;
  }

  private mapPartTokenToNumber(token: string): number | null {
    const normalized = String(token).toUpperCase().replace(/[^A-Z0-9]/g, '').trim();
    if (!normalized) return null;
    if (/^[1-7]$/.test(normalized)) return Number(normalized);
    const romanMap: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7 };
    return romanMap[normalized] ?? null;
  }

  private detectToeicPartFromText(line: string): number | null {
    const normalized = line.toLowerCase();
    const partMatch = normalized.match(/\bpart\s*([ivx]+|[1-7])\b/i);
    if (partMatch?.[1]) return this.mapPartTokenToNumber(partMatch[1]);
    const shortMatch = normalized.match(/\bp\s*([1-7])\b/i);
    if (shortMatch?.[1]) return Number(shortMatch[1]);
    return null;
  }

  private extractInlineOptionsFromLine(line: string): { stem: string; options: ParsedOption[] } {
    const markerRegex = /([A-D])[).:-]\s*/g;
    const markers = Array.from(line.matchAll(markerRegex)).filter((match) => {
      const idx = match.index ?? -1;
      return idx === 0 || /\s/.test(line[idx - 1] ?? '');
    });

    if (markers.length === 0) return { stem: line.trim(), options: [] };

    const stem = line.slice(0, markers[0].index ?? 0).trim();
    const options: ParsedOption[] = [];

    for (let i = 0; i < markers.length; i += 1) {
      const marker = markers[i];
      const nextMarker = markers[i + 1];
      const start = (marker.index ?? 0) + marker[0].length;
      const end = nextMarker?.index ?? line.length;
      const optionText = line.slice(start, end).replace(/\s+/g, ' ').trim();
      if (optionText) {
        options.push({ optionKey: marker[1].toUpperCase(), optionText, isCorrect: false });
      }
    }

    return { stem, options };
  }

  private extractAnswerKeyMap(rawText: string): Map<number, string> {
    const answerMap = new Map<number, string>();
    const lines = rawText.replace(/\r/g, '\n').split('\n').map(l => l.replace(/\s+/g, ' ').trim()).filter(l => l.length > 0);

    let inAnswerSection = false;
    for (const line of lines) {
      if (/\b(answer\s*key|đáp\s*án|dap\s*an)\b/i.test(line)) {
        inAnswerSection = true;
        continue;
      }
      const pairs = Array.from(line.matchAll(/\b(\d{1,3})\s*[).:-]?\s*([A-D])\b/gi));
      if (pairs.length === 0) continue;

      const residue = line.replace(/\b(\d{1,3})\s*[).:-]?\s*([A-D])\b/gi, ' ').replace(/[\s,.;:()\-_/]+/g, '').trim();
      if (inAnswerSection || pairs.length >= 3 || (pairs.length >= 2 && line.length <= 90) || (pairs.length === 1 && residue.length === 0)) {
        for (const pair of pairs) {
          const qNum = Number(pair[1]);
          const key = this.normalizeOptionKey(pair[2]);
          if (qNum >= 1 && key) answerMap.set(qNum, key);
        }
      }
    }
    return answerMap;
  }

  private parseQuestionsFromText(rawText: string): ParsedDiagnosticQuestion[] {
    const normalized = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\u00a0/g, ' ').replace(/[\t\f\v]+/g, ' ').trim();
    if (!normalized) return [];

    const lines = normalized.split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter((l) => l.length > 0);
    const answerKeyMap = this.extractAnswerKeyMap(normalized);
    const questions: ParsedDiagnosticQuestion[] = [];
    let currentPart: number | null = null;

    let wq: any = null;

    const flushQuestion = () => {
      if (!wq) return;
      const options: ParsedOption[] = ['A', 'B', 'C', 'D']
        .filter((k) => wq.optionsMap.has(k))
        .map((k) => ({ optionKey: k, optionText: wq.optionsMap.get(k)!.trim(), isCorrect: false }))
        .filter((o) => o.optionText.length > 0);

      if (options.length >= 2) {
        const correctKey = wq.inlineAnswer ?? (wq.questionNumber ? answerKeyMap.get(wq.questionNumber) : null);
        if (correctKey) {
          const found = options.find((o) => o.optionKey === correctKey);
          if (found) found.isCorrect = true;
        }

        const stem = wq.stemLines.join(' ').replace(/\s+/g, ' ').trim();
        if (stem) {
          questions.push({
            questionNumber: wq.questionNumber,
            stem,
            options,
            detectedPart: wq.detectedPart ?? currentPart,
          });
        }
      }
      wq = null;
    };

    for (const line of lines) {
      const detectedPart = this.detectToeicPartFromText(line);
      if (detectedPart) {
        flushQuestion();
        currentPart = detectedPart;
        continue;
      }

      const qStartMatch = line.match(/^(?:question\s*|c[aâ]u\s*)?(\d{1,3})\s*[).:\-]\s*(.+)$/i) ?? line.match(/^(\d{1,3})\s+(.+)$/);
      if (qStartMatch) {
        const rest = qStartMatch[2].trim();
        if (/^[ABCD]\s*\.?\s*$/.test(rest)) {
          flushQuestion();
          wq = null;
          continue;
        }

        const questionNumber = this.parseQuestionNumber(qStartMatch[1]);
        if (!questionNumber) continue;

        const inline = this.extractInlineOptionsFromLine(rest);
        flushQuestion();
        wq = {
          questionNumber,
          stemLines: inline.stem ? [inline.stem] : [],
          optionsMap: new Map(),
          inlineAnswer: null,
          detectedPart: currentPart,
          lastOptionKey: null,
        };
        for (const option of inline.options) {
          const key = this.normalizeOptionKey(option.optionKey);
          if (key) {
            wq.optionsMap.set(key, option.optionText.trim());
            wq.lastOptionKey = key;
          }
        }
        continue;
      }

      const inlineOptions = this.extractInlineOptionsFromLine(line);
      if (inlineOptions.options.length > 0 && wq) {
        if (inlineOptions.stem) wq.stemLines.push(inlineOptions.stem);
        for (const option of inlineOptions.options) {
          const key = this.normalizeOptionKey(option.optionKey);
          if (key) {
            wq.optionsMap.set(key, option.optionText.trim());
            wq.lastOptionKey = key;
          }
        }
        continue;
      }

      const optMatch = line.match(/^([A-D])\s*[).:-]\s*(.+)$/i);
      if (optMatch && wq) {
        const key = this.normalizeOptionKey(optMatch[1]);
        if (key) {
          wq.optionsMap.set(key, optMatch[2].trim());
          wq.lastOptionKey = key;
        }
        continue;
      }

      if (wq) {
        if (wq.lastOptionKey && wq.optionsMap.has(wq.lastOptionKey)) {
          wq.optionsMap.set(wq.lastOptionKey, wq.optionsMap.get(wq.lastOptionKey) + ' ' + line);
        } else {
          wq.stemLines.push(line);
        }
      }
    }
    flushQuestion();

    // Infer missing parts logically
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.detectedPart) {
        const num = q.questionNumber;
        if (num) {
          if (num <= 6) q.detectedPart = 1;
          else if (num <= 31) q.detectedPart = 2;
          else if (num <= 70) q.detectedPart = 3;
          else if (num <= 100) q.detectedPart = 4;
          else if (num <= 130) q.detectedPart = 5;
          else if (num <= 146) q.detectedPart = 6;
          else q.detectedPart = 7;
        } else {
          // Defaults for reading
          if (i < 30) q.detectedPart = 5;
          else if (i < 46) q.detectedPart = 6;
          else q.detectedPart = 7;
        }
      }
    }

    return questions;
  }

  // ── Heuristic Difficulty Calculator ───────────────────────────────────────────

  private calculateHeuristicDifficulty(question: ParsedDiagnosticQuestion): {
    score_band_min: number;
    score_band_max: number;
    difficulty_level: string;
  } | null {
    let score = 0; // 0 to 10

    // 1. Part factor (0-4 pts)
    const part = question.detectedPart || 5;
    if (part === 1 || part === 2) score += 1;
    else if (part === 5) score += 2;
    else if (part === 6 || part === 3 || part === 4) score += 3;
    else score += 4; // Part 7

    // 2. Stem length factor (0-3 pts)
    const wordCount = question.stem.split(/\s+/).length;
    if (wordCount > 30) score += 3;
    else if (wordCount > 15) score += 2;
    else if (wordCount > 5) score += 1;

    // 3. Option length factor (0-2 pts)
    const avgOptionLength = question.options.reduce((sum, opt) => sum + opt.optionText.length, 0) / (question.options.length || 1);
    if (avgOptionLength > 40) score += 2;
    else if (avgOptionLength > 15) score += 1;

    // 4. Vocabulary Rarity (Simulation - 0-1 pts)
    const advancedSuffixes = /([a-z]{3,}tion|[a-z]{3,}ment|[a-z]{3,}ity|[a-z]{3,}ness)\b/gi;
    const matches = question.stem.match(advancedSuffixes);
    if (matches && matches.length > 1) score += 1;

    // Đề khảo sát chỉ giới hạn max 500 điểm.
    // Nếu câu hỏi quá khó (score > 8), lược bỏ (return null) vì nó không phù hợp để khảo sát.
    if (score > 8) {
      return null;
    }

    // Phân bổ dải điểm khảo sát (0 - 500)
    if (score <= 3) {
      return { score_band_min: 0, score_band_max: 150, difficulty_level: 'easy' };
    } else if (score <= 5) {
      return { score_band_min: 150, score_band_max: 300, difficulty_level: 'medium' };
    } else if (score <= 7) {
      return { score_band_min: 300, score_band_max: 450, difficulty_level: 'hard' };
    } else {
      return { score_band_min: 450, score_band_max: 500, difficulty_level: 'expert' };
    }
  }

  // ── Import Main Flow ─────────────────────────────────────────────────────────

  async importDiagnosticTest(
    accountId: number,
    body: any,
    file: Express.Multer.File,
  ): Promise<DiagnosticImportResponseDto> {
    const rawText = await this.extractText(file);
    if (!rawText.trim()) {
      throw new BadRequestException('Không thể đọc nội dung file. File rỗng hoặc không đúng định dạng Text/PDF.');
    }

    let allParsedQuestions = this.parseQuestionsFromText(rawText);
    const certType = body.cert_type || 'toeic';
    const selectedSkillArea = body.skill_area || 'reading';
    const isPdf = extname(file.originalname || file.path).toLowerCase() === '.pdf';

    // Xử lý nạp đề Listening dạng ảnh (Image-based PDF)
    let imageAssets: any[] = [];
    if (selectedSkillArea === 'listening' && allParsedQuestions.length === 0 && isPdf) {
      // PDF không có text, tạo placeholder cho Part 1 & 2
      this.logger.log(`Tạo placeholder cho đề Listening (Image-based PDF)...`);
      for (let i = 1; i <= 100; i++) {
        const isPart1 = i <= 6;
        const isPart2 = i > 6 && i <= 31;
        const isPart3 = i > 31 && i <= 70;
        const isPart4 = i > 70;
        allParsedQuestions.push({
          questionNumber: i,
          detectedPart: isPart1 ? 1 : isPart2 ? 2 : isPart3 ? 3 : 4,
          stem: isPart1 ? `[Part 1 - Câu ${i}: Nhìn vào hình ảnh và chọn mô tả đúng nhất]` : isPart2 ? `[Part 2 - Câu ${i}: Nghe câu hỏi và chọn đáp án phù hợp nhất]` : isPart3 ? `[Part 3 - Câu ${i}: Nghe đoạn hội thoại và chọn đáp án đúng]` : `[Part 4 - Câu ${i}: Nghe bài nói ngắn và chọn đáp án đúng]`,
          options: isPart2
            ? ['A', 'B', 'C'].map(k => ({ optionKey: k, optionText: `(${k})`, isCorrect: false }))
            : ['A', 'B', 'C', 'D'].map(k => ({ optionKey: k, optionText: `(${k})`, isCorrect: false })),
        });
      }

      const repositorySlug = `diag-${Date.now()}-${randomUUID().slice(0, 8)}`;
      imageAssets = await this.extractImagesFromPdf(file.path, repositorySlug);

      // Override để gán slug ngay tại đây
      body._pregeneratedSlug = repositorySlug;
    }

    if (allParsedQuestions.length === 0) {
      throw new BadRequestException('Không nhận diện được câu hỏi nào từ file. Vui lòng kiểm tra lại cấu trúc.');
    }

    // Lọc lấy đúng các câu thuộc kỹ năng được chọn
    const parsedQuestions = allParsedQuestions.filter((q) => {
      const isListeningPart = q.detectedPart && q.detectedPart <= 4;
      const questionSkillArea = isListeningPart ? 'listening' : 'reading';
      return questionSkillArea === selectedSkillArea;
    });

    if (parsedQuestions.length === 0) {
      throw new BadRequestException(`Không tìm thấy câu hỏi nào thuộc kỹ năng ${selectedSkillArea} trong file này.`);
    }

    const repositorySlug = body._pregeneratedSlug || `diag-${Date.now()}-${randomUUID().slice(0, 8)}`;
    const repositoryTitle = `Khảo Sát Đầu Vào (${certType.toUpperCase()} - ${selectedSkillArea}) - ${new Date().toLocaleDateString()}`;

    const newRepo = await this.prisma.diagnosticRepository.create({
      data: {
        cert_type: certType,
        title: repositoryTitle,
        slug: repositorySlug,
        description: 'Đề khảo sát đầu vào tự động phân tách bằng AI Heuristic.',
        target_score_min: 0,
        target_score_max: 990,
        is_published: true,
        created_by: accountId,
        total_items: parsedQuestions.length,
      },
    });

    let insertedCount = 0;

    // Heuristic: Lọc ra các ảnh phù hợp nhất cho Part 1 (bỏ qua logo/watermark).
    // Ảnh Part 1 là ảnh chụp nên dung lượng lớn (> 10KB).
    const bestImages = [...imageAssets]
      .filter(img => (img.size_bytes || 0) > 10000)
      .sort((a, b) => (b.size_bytes || 0) - (a.size_bytes || 0))
      .slice(0, 6) // Part 1 luôn có tối đa 6 câu
      .sort((a, b) => {
        if (a.page !== b.page) return (a.page || 0) - (b.page || 0);
        return (a.filename || '').localeCompare(b.filename || '');
      });

    let part1ItemsSoFar = 0;

    for (let i = 0; i < parsedQuestions.length; i++) {
      const q = parsedQuestions[i];
      const difficulty = this.calculateHeuristicDifficulty(q);

      // Bỏ qua câu hỏi quá khó (difficulty = null)
      if (!difficulty) {
        continue;
      }

      const createdItem = await this.prisma.diagnosticRepositoryItem.create({
        data: {
          repository_id: newRepo.id,
          item_order: i + 1,
          item_type: 'single_choice',
          skill_area: selectedSkillArea,
          part: q.detectedPart,
          stem: tryEncryptString(q.stem) ?? q.stem,
          difficulty_level: difficulty.difficulty_level,
          score_band_min: difficulty.score_band_min,
          score_band_max: difficulty.score_band_max,
          metadata: { question_number: q.questionNumber },
          options: {
            create: q.options.map((opt, optIndex) => ({
              option_key: opt.optionKey,
              option_text: tryEncryptString(opt.optionText) ?? opt.optionText,
              is_correct: opt.isCorrect,
              sort_order: optIndex + 1,
            })),
          },
        },
      });

      // Gán ảnh cho Part 1 nếu có
      if (q.detectedPart === 1 && bestImages.length > 0) {
        const img = bestImages[part1ItemsSoFar];
        if (img) {
          await this.prisma.diagnosticRepositoryItem.update({
            where: { id: createdItem.id },
            data: { media_image_url: `/uploads/${(img.url_path || img.url || '').replace(/\\/g, '/')}` }
          });
        }
        part1ItemsSoFar++;
      }

      insertedCount++;
    }

    // Auto-sync any existing audio or images that might be in the folder
    await this.autoSyncMediaFromDisk(repositorySlug);

    return {
      diagnostic_set_id: newRepo.slug,
      imported_count: insertedCount,
    };
  }

  private async autoSyncMediaFromDisk(slug: string): Promise<void> {
    const repository = await this.prisma.diagnosticRepository.findUnique({
      where: { slug },
    });
    if (!repository) return;

    const items = await this.prisma.diagnosticRepositoryItem.findMany({
      where: { repository_id: repository.id },
    });

    const qNumToItemId = new Map<number, number>();
    for (const item of items) {
      const metadata = item.metadata as any;
      if (metadata && typeof metadata.question_number === 'number') {
        qNumToItemId.set(metadata.question_number, item.id);
      }
    }

    // Sync Audio
    const audioDir = absoluteUploadsDir('certificate', 'TOEIC', 'toeic-listening-survey', slug, 'audio');
    if (existsSync(audioDir)) {
      const { readdirSync } = require('fs');
      const audioFiles = readdirSync(audioDir);
      for (const file of audioFiles) {
        if (!file.endsWith('.mp3')) continue;
        const match = file.match(/_part\d+_[qt](\d+)\.mp3/);
        if (match) {
          const qNum = parseInt(match[1], 10);
          const itemId = qNumToItemId.get(qNum);
          if (itemId) {
            const url = `/uploads/certificate/TOEIC/toeic-listening-survey/${slug}/audio/${file}`;
            await this.prisma.diagnosticRepositoryItem.update({
              where: { id: itemId },
              data: { media_audio_url: url },
            });
          }
        }
      }
    }

    // Sync Images
    const imagesDir = absoluteUploadsDir('certificate', 'TOEIC', 'toeic-listening-survey', slug, 'images');
    if (existsSync(imagesDir)) {
      const { readdirSync } = require('fs');
      const imageFiles = readdirSync(imagesDir).filter((f: string) => f.endsWith('.webp') || f.endsWith('.png') || f.endsWith('.jpg')).sort();
      for (let i = 0; i < Math.min(imageFiles.length, 6); i++) {
        const qNum = i + 1;
        const itemId = qNumToItemId.get(qNum);
        if (itemId) {
          const url = `certificate/TOEIC/toeic-listening-survey/${slug}/images/${imageFiles[i]}`;
          await this.prisma.diagnosticRepositoryItem.update({
            where: { id: itemId },
            data: { media_image_url: `/uploads/${url}` },
          });
        }
      }
    }
  }

  // ── Extract Images (Python) ──────────────────────────────────────────────────
  private async extractImagesFromPdf(pdfPath: string, slug: string): Promise<any[]> {
    const imagesRelDir = surveyImagesRelDir(slug);
    const outputDir = absoluteUploadsDir(...imagesRelDir.split(/[\\/]/));
    if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

    const pythonExe = process.platform === 'win32' ? 'python' : 'python3';
    const scriptPath = resolve(join(process.cwd(), '..', 'ml_service', 'pdf_image_extractor.py'));

    if (!existsSync(scriptPath)) return [];

    let stdout = '';
    try {
      const result = await execFileAsync(pythonExe, [
        scriptPath, pdfPath, outputDir, slug, '--min-width', String(IMG_MIN_WIDTH),
        '--min-height', String(IMG_MIN_HEIGHT), '--skill-area', 'listening'
      ], { timeout: 120_000 });
      stdout = result.stdout;
    } catch { return []; }

    try {
      const parsed = JSON.parse(stdout.trim());
      return (parsed.images ?? []).map((img: any) => ({
        filename: img.filename,
        url: `TOEIC/toeic-listening-survey/${slug}/images/${img.filename}`,
        part_hint: img.part_hint,
      }));
    } catch { return []; }
  }

  // ── Chunk Diagnostic Audio ───────────────────────────────────────────────────

  async chunkDiagnosticAudio(
    accountId: number,
    dto: any,
    file: Express.Multer.File,
  ) {
    const slug = dto.repository_slug?.trim();
    if (!slug) {
      throw new BadRequestException('Thiếu repository_slug');
    }

    const repository = await this.prisma.diagnosticRepository.findUnique({
      where: { slug },
      select: { id: true, slug: true },
    });
    if (!repository) {
      throw new BadRequestException(`Không tìm thấy repository: ${slug}`);
    }

    const audioAbsDir = absoluteUploadsDir(
      'certificate',
      'TOEIC',
      'toeic-listening-survey',
      slug,
      'audio',
    );
    if (!existsSync(audioAbsDir)) mkdirSync(audioAbsDir, { recursive: true });

    const pythonExe = process.platform === 'win32' ? 'python' : 'python3';
    const scriptPath = resolve(
      join(process.cwd(), '..', 'ml_service', 'audio_chunker.py'),
    );

    if (!existsSync(scriptPath)) {
      throw new BadRequestException('audio_chunker.py not found in ml_service/');
    }

    const args = [
      scriptPath,
      file.path,
      audioAbsDir,
      slug,
      '--method',
      'both',
      '--skill-area',
      'listening-survey',
    ];

    let stdout = '';
    try {
      const result = await execFileAsync(pythonExe, args, { timeout: 900_000, maxBuffer: 50 * 1024 * 1024 });
      stdout = result.stdout;
    } catch (err: any) {
      throw new BadRequestException(
        `Audio chunking failed: ${err?.stderr ?? err?.message ?? String(err)}`,
      );
    }

    let parsed: any;
    try {
      parsed = JSON.parse(stdout.trim());
    } catch {
      throw new BadRequestException(
        `Chunker returned invalid JSON: ${stdout.substring(0, 200)}`,
      );
    }

    if (parsed.status === 'error') {
      throw new BadRequestException(parsed.message ?? 'Chunking error');
    }

    const chunks = (parsed.chunks ?? []).map((c: any) => ({
      filename: c.filename,
      url: `/uploads/${c.url_path}`,
      part: c.part,
      question_number: c.question_number,
    }));

    let autoMappedCount = 0;
    if (chunks.length > 0) {
      const items = await this.prisma.diagnosticRepositoryItem.findMany({
        where: { repository_id: repository.id },
        select: { id: true, metadata: true },
      });

      const qNumToItemId = new Map<number, number>();
      for (const item of items) {
        const qNum = (item.metadata as any)?.question_number;
        if (typeof qNum === 'number') qNumToItemId.set(qNum, item.id);
      }

      for (const chunk of chunks) {
        const itemId = qNumToItemId.get(chunk.question_number);
        if (!itemId) continue;
        await this.prisma.diagnosticRepositoryItem.update({
          where: { id: itemId },
          data: { media_audio_url: chunk.url },
        });
        autoMappedCount++;
      }
    }

    return {
      repository_id: repository.id,
      slug: repository.slug,
      total_chunks: chunks.length,
      auto_mapped_count: autoMappedCount,
    };
  }

  // ── Import Answer Key ────────────────────────────────────────────────────────
  async importDiagnosticAnswerKeyFromFile(
    accountId: number,
    dto: any,
    file: Express.Multer.File,
    certService: CertificateEnrollmentService,
  ): Promise<any> {
    if (!file) {
      throw new BadRequestException('Vui lòng gửi file answer key.');
    }

    const repositorySlug = dto.repository_slug?.trim();
    if (!repositorySlug) {
      throw new BadRequestException('repository_slug là bắt buộc.');
    }

    const repository = await this.prisma.diagnosticRepository.findUnique({
      where: { slug: repositorySlug },
      select: {
        id: true,
        slug: true,
        cert_type: true,
      },
    });

    if (!repository || repository.cert_type !== 'toeic') {
      throw new BadRequestException('Không tìm thấy repository khảo sát TOEIC cần cập nhật.');
    }

    // Call the public parse method from CertificateEnrollmentService
    const answerKeyMap = await certService.parseToeicAnswerKeyFromFile(
      file,
      null, // skillArea is not strictly needed for the parser, or pass 'listening'/'reading' if needed
    );

    if (answerKeyMap.size === 0) {
      throw new BadRequestException('Không tìm thấy cặp question_number + answer (A/B/C/D) hợp lệ trong file.');
    }

    const items = await this.prisma.diagnosticRepositoryItem.findMany({
      where: { repository_id: repository.id },
      select: {
        id: true,
        metadata: true,
      },
    });

    if (items.length === 0) {
      throw new BadRequestException('Repository hiện chưa có câu hỏi để gán đáp án.');
    }

    // Load options for all items
    const itemIds = items.map(i => i.id);
    const options = await this.prisma.diagnosticRepositoryOption.findMany({
      where: { item_id: { in: itemIds } },
    });

    // Group options by item_id
    const optionsByItemId = new Map<number, typeof options>();
    for (const opt of options) {
      if (!optionsByItemId.has(opt.item_id)) {
        optionsByItemId.set(opt.item_id, []);
      }
      optionsByItemId.get(opt.item_id)!.push(opt);
    }

    let updatedCount = 0;
    const optionUpdates: Promise<any>[] = [];

    for (const item of items) {
      const qNum = (item.metadata as any)?.question_number;
      if (typeof qNum !== 'number') continue;

      const correctAnsKey = answerKeyMap.get(qNum);
      if (!correctAnsKey) continue;

      const itemOptions = optionsByItemId.get(item.id) || [];
      const correctOpt = itemOptions.find(o => o.option_key.toUpperCase() === correctAnsKey.toUpperCase());

      if (correctOpt) {
        // Reset all options for this item to false, then set correct to true
        for (const opt of itemOptions) {
          if (opt.is_correct && opt.id !== correctOpt.id) {
            optionUpdates.push(
              this.prisma.diagnosticRepositoryOption.update({
                where: { id: opt.id },
                data: { is_correct: false },
              })
            );
          }
        }

        if (!correctOpt.is_correct) {
          optionUpdates.push(
            this.prisma.diagnosticRepositoryOption.update({
              where: { id: correctOpt.id },
              data: { is_correct: true },
            })
          );
        }
        updatedCount++;
      }
    }

    if (optionUpdates.length > 0) {
      // Execute updates in batches
      const batchSize = 50;
      for (let i = 0; i < optionUpdates.length; i += batchSize) {
        await Promise.all(optionUpdates.slice(i, i + batchSize));
      }
    }

    return {
      repository_id: repository.id,
      slug: repository.slug,
      updated_count: updatedCount,
    };
  }
}
