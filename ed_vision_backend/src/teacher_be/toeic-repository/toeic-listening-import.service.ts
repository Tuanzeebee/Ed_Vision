import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { extname, join, resolve } from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { PrismaService } from '../../prisma/prisma.service';
import { CertificateEnrollmentService } from '../../student_be/certificate/certificate-enrollment.service';
import {
  ToeicListeningImportDto,
  ToeicListeningImportResponseDto,
  ToeicListeningImageAssetDto,
  ToeicListeningAudioUploadDto,
  ToeicListeningAudioUploadResponseDto,
  ToeicAudioChunkRequestDto,
  ToeicAudioChunkResponseDto,
  ToeicAudioChunkDto,
  ToeicRepositoryListItemDto,
  ToeicRepositoryDeleteResponseDto,
} from '../../student_be/certificate/dto/certificate.dto';

const execFileAsync = promisify(execFile);

/** Minimum pixel size to keep extracted images (skip decorative lines/icons) */
const IMG_MIN_WIDTH = 80;
const IMG_MIN_HEIGHT = 80;

/**
 * Decode a filename that multer may have received as Latin-1 instead of UTF-8.
 * Falls back to the original string if the conversion produces invalid results.
 */
function decodeFilename(raw: string): string {
  try {
    const decoded = Buffer.from(raw, 'latin1').toString('utf8');
    // A heuristic: if the decoded string still has valid UTF-8 characters,
    // use it; otherwise keep the original.
    return decoded.length > 0 ? decoded : raw;
  } catch {
    return raw;
  }
}

/**
 * Build the uploads-relative directory path for a TOEIC Listening repository.
 *
 * Structure:
 *   uploads/
 *     TOEIC/
 *       toeic-listening/
 *         {slug}/
 *           images/
 *           audio/
 *       toeic-reading/
 *     IELTS/
 *     MOS/
 */
function listeningImagesRelDir(slug: string): string {
  return join('TOEIC', 'toeic-listening-exam', slug, 'images');
}

function listeningAudioRelDir(slug: string): string {
  return join('TOEIC', 'toeic-listening-exam', slug, 'audio');
}

function absoluteUploadsDir(...parts: string[]): string {
  return resolve(join(process.cwd(), 'uploads', ...parts));
}

@Injectable()
export class ToeicListeningImportService {
  private readonly logger = new Logger(ToeicListeningImportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly certService: CertificateEnrollmentService,
  ) {}

  // ──────────────────────────────────────────────────────────────────────────
  // PUBLIC: importToeicListeningFromPdfFile
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Upload a TOEIC Listening PDF:
   *  1. Reuse the battle-tested OCR parser from CertificateEnrollmentService
   *     (same parser that works for Reading — pass skill_area: 'listening').
   *  2. Extract images from the PDF via Python (Parts 1-4 only).
   *  3. Assign extracted image URLs to Part 1 repository items.
   *  4. Return a combined result.
   */
  async importToeicListeningFromPdfFile(
    accountId: number,
    dto: ToeicListeningImportDto,
    file: Express.Multer.File,
  ): Promise<ToeicListeningImportResponseDto> {
    // ── Fix Vietnamese (and other non-ASCII) filename encoding ────────────────
    const safeFilename = decodeFilename(
      file.originalname || file.filename || '',
    );

    // ── Step 1: Reuse the existing, working OCR import pipeline ──────────────
    // CertificateEnrollmentService.importToeicExamFromOcrFile already:
    //   • extracts raw text from PDF
    //   • runs parseToeicQuestionsFromOcrText (filters by skill_area → Parts 1-4)
    //   • creates the repository + repository items + options in the DB
    let ocrResult: Awaited<
      ReturnType<CertificateEnrollmentService['importToeicExamFromOcrFile']>
    >;
    try {
      ocrResult = await this.certService.importToeicExamFromOcrFile(
        accountId,
        {
          repository_slug: dto.repository_slug,
          repository_title: dto.repository_title,
          repository_description: dto.repository_description,
          skill_area: 'listening',
          replace_existing: dto.replace_existing,
          milestone_score: dto.milestone_score,
          unlock_score: dto.unlock_score,
          allow_empty_parsing: true,
        } as any,
        file,
      );
    } catch (err: unknown) {
      const msg =
        (err as any)?.response?.data?.message ??
        (err as any)?.message ??
        String(err);
      throw new BadRequestException(
        `Lỗi khi phân tích file PDF: ${Array.isArray(msg) ? msg.join(' ') : msg}`,
      );
    }

    const { repository_id, slug } = ocrResult;

    // ── Step 2: Extract images from PDF (Python script, stop at Part 4) ──────
    let imageAssets: ToeicListeningImageAssetDto[] = [];
    let imageExtractError: string | undefined;

    if (extname(file.originalname || file.path).toLowerCase() === '.pdf') {
      try {
        imageAssets = await this.extractImagesFromPdf(file.path, slug);
      } catch (err) {
        imageExtractError = String(err);
        this.logger.warn(
          `Image extraction skipped for slug "${slug}": ${imageExtractError}`,
        );
      }
    }

    // ── Step 3: Create placeholder items for Part 1 & 2 (audio-only parts) ──
    // Part 1 (questions 1-6):  only photos are in the PDF — no question text.
    // Part 2 (questions 7-31): "Mark your answer on your answer sheet." — no
    //   printed question text.  Both parts require audio to answer.
    // We insert placeholder DB rows so the student sees the correct exam
    // structure even before audio is uploaded.

    const existingItems = await this.prisma.learningRepositoryItem.findMany({
      where: { repository_id },
      select: { id: true, metadata: true },
    });

    const existingQNums = new Set<number>(
      existingItems
        .map(
          (i) =>
            (i.metadata as Record<string, unknown> | null)?.question_number,
        )
        .filter((n): n is number => typeof n === 'number'),
    );

    // Part 1: 6 photo-description questions, 4 options (A-D)
    // Part 2: 25 question-response questions, 3 options (A-C)
    const PLACEHOLDER_RANGES = [
      {
        part: 1,
        start: 1,
        end: 6,
        optionKeys: ['A', 'B', 'C', 'D'] as const,
        estimatedSeconds: 20,
      },
      {
        part: 2,
        start: 7,
        end: 31,
        optionKeys: ['A', 'B', 'C'] as const,
        estimatedSeconds: 12,
      },
      {
        part: 3,
        start: 32,
        end: 70,
        optionKeys: ['A', 'B', 'C', 'D'] as const,
        estimatedSeconds: 12,
      },
      {
        part: 4,
        start: 71,
        end: 100,
        optionKeys: ['A', 'B', 'C', 'D'] as const,
        estimatedSeconds: 12,
      },
    ] as const;

    let placeholderCount = 0;
    const newPart1ItemIds: number[] = [];

    for (const range of PLACEHOLDER_RANGES) {
      for (let qNum = range.start; qNum <= range.end; qNum++) {
        if (existingQNums.has(qNum)) continue; // already imported via OCR

        const stemText =
          range.part === 1
            ? `[Part 1 - Câu ${qNum}: Nhìn vào hình ảnh và chọn mô tả đúng nhất]`
            : range.part === 2
              ? `[Part 2 - Câu ${qNum}: Nghe câu hỏi và chọn đáp án phù hợp nhất]`
              : range.part === 3
                ? `[Part 3 - Câu ${qNum}: Nghe đoạn hội thoại và chọn đáp án đúng]`
                : `[Part 4 - Câu ${qNum}: Nghe bài nói ngắn và chọn đáp án đúng]`;

        const created = await this.prisma.learningRepositoryItem.create({
          data: {
            repository_id,
            // Temporary order; will be fixed by reorder step below
            item_order: 9000 + qNum,
            item_type: 'multiple_choice',
            stem: stemText,
            reading_passage: null,
            explanation: null,
            score_weight: 1,
            estimated_seconds: range.estimatedSeconds,
            media_image_url: null,
            metadata: {
              source: 'listening_placeholder',
              source_file: safeFilename,
              part: range.part,
              question_number: qNum,
            } as any,
          },
          select: { id: true },
        });

        await this.prisma.learningRepositoryOption.createMany({
          data: range.optionKeys.map((key, idx) => ({
            item_id: created.id,
            option_key: key,
            option_text: `(${key})`,
            is_correct: false,
            sort_order: idx,
          })),
        });

        if (range.part === 1) newPart1ItemIds.push(created.id);
        placeholderCount++;
      }
    }

    if (placeholderCount > 0) {
      this.logger.log(
        `Created ${placeholderCount} placeholder item(s) for Part 1/2 in slug "${slug}".`,
      );
    }

    // ── Step 4: Assign image URLs to Part 1 items (existing + new placeholders) ──
    if (imageAssets.length > 0) {
      // Refresh the item list so newly created placeholders are included
      const allItems = await this.prisma.learningRepositoryItem.findMany({
        where: { repository_id },
        select: { id: true, metadata: true },
      });

      const part1Items = allItems
        .filter((item) => {
          const meta = item.metadata as Record<string, unknown> | null;
          return meta?.part === 1;
        })
        .sort((a, b) => {
          const aMeta = a.metadata as Record<string, unknown> | null;
          const bMeta = b.metadata as Record<string, unknown> | null;
          return (
            ((aMeta?.question_number as number) ?? 0) -
            ((bMeta?.question_number as number) ?? 0)
          );
        });

      // Lọc ra các ảnh phù hợp nhất cho Part 1 bằng Heuristic:
      // Ảnh Part 1 là ảnh chụp (photographs) nên dung lượng (size_bytes) thường lớn nhất.
      // Các logo/watermark thường có dung lượng nhỏ hơn nhiều (dưới 10KB).
      const bestImages = [...imageAssets]
        .filter(img => (img.size_bytes || 0) > 10000) // Lọc bỏ logo < 10KB
        .sort((a, b) => (b.size_bytes || 0) - (a.size_bytes || 0))
        .slice(0, part1Items.length)
        .sort((a, b) => {
          if (a.page !== b.page) return (a.page || 0) - (b.page || 0);
          return (a.filename || '').localeCompare(b.filename || '');
        });

      const imageUpdates = part1Items
        .map((item, idx) => {
          const img = bestImages[idx];
          if (!img) return null;
          const imageUrl = `/uploads/${(img.url || '').replace(/\\/g, '/')}`;
          return this.prisma.learningRepositoryItem.update({
            where: { id: item.id },
            data: { media_image_url: imageUrl },
          });
        })
        .filter((p): p is NonNullable<typeof p> => p !== null);

      if (imageUpdates.length > 0) {
        await Promise.all(imageUpdates);
        this.logger.log(
          `Assigned ${imageUpdates.length} image(s) to Part 1 items for slug "${slug}".`,
        );
      }
    }

    // ── Step 5: Reorder all items by question_number ──────────────────────────
    await this.reorderItemsByQuestionNumber(repository_id);

    return {
      repository_id,
      slug,
      skill_area: 'listening',
      imported_count: ocrResult.imported_count + placeholderCount,
      skipped_count: ocrResult.skipped_count,
      total_detected: ocrResult.total_detected + placeholderCount,
      source_filename: safeFilename,
      image_assets: imageAssets,
      image_extract_error: imageExtractError,
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PUBLIC: uploadListeningAudio
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Upload an audio file and map it to the correct repository items by
   * part number + track number.
   *
   * Mapping rules (TOEIC standard):
   *   Part 1 → 1 photo per track  (tracks 1-6)
   *   Part 2 → 1 question per track (tracks 7-31)
   *   Part 3 → 3 questions per track (tracks 1-13 relative to Part 3 start)
   *   Part 4 → 3 questions per track (tracks 1-10 relative to Part 4 start)
   *
   * Saved to: uploads/TOEIC/toeic-listening/{slug}/audio/{slug}_part{N}_{NNN}.ext
   */
  // ──────────────────────────────────────────────────────────────────────────
  // PUBLIC: listRepositories
  // ──────────────────────────────────────────────────────────────────────────

  async listRepositories(
    skillArea?: string,
  ): Promise<ToeicRepositoryListItemDto[]> {
    const where: any = { cert_type: 'toeic' };
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

  // ──────────────────────────────────────────────────────────────────────────
  // PUBLIC: deleteRepository
  // ──────────────────────────────────────────────────────────────────────────

  async deleteRepository(
    slug: string,
  ): Promise<ToeicRepositoryDeleteResponseDto> {
    const repo = await this.prisma.learningRepository.findFirst({
      where: { slug },
      select: { id: true },
    });

    if (!repo) {
      throw new BadRequestException(`Không tìm thấy repository: ${slug}`);
    }

    // Count items before deletion
    const itemCount = await this.prisma.learningRepositoryItem.count({
      where: { repository_id: repo.id },
    });

    // Delete options → items → repository (cascade may handle this, but be explicit)
    await this.prisma.learningRepositoryOption.deleteMany({
      where: { item: { repository_id: repo.id } },
    });
    await this.prisma.learningRepositoryItem.deleteMany({
      where: { repository_id: repo.id },
    });
    await this.prisma.learningRepository.delete({
      where: { id: repo.id },
    });

    return { slug, deleted: true, items_deleted: itemCount };
  }



  // ──────────────────────────────────────────────────────────────────────────
  // PRIVATE helpers
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Reorder all items in a repository by their `metadata.question_number`.
   * Items without a question_number are placed at the end, preserving their
   * relative order.  Also updates `total_items` on the repository.
   */
  private async reorderItemsByQuestionNumber(
    repositoryId: number,
  ): Promise<void> {
    const items = await this.prisma.learningRepositoryItem.findMany({
      where: { repository_id: repositoryId },
      select: { id: true, metadata: true },
    });

    const sorted = [...items].sort((a, b) => {
      const aQ =
        ((a.metadata as Record<string, unknown> | null)?.question_number as
          | number
          | undefined) ?? 9999;
      const bQ =
        ((b.metadata as Record<string, unknown> | null)?.question_number as
          | number
          | undefined) ?? 9999;
      return aQ - bQ;
    });

    // Use a Prisma interactive transaction so all updates run sequentially
    // inside a single DB transaction — no concurrent writes, no unique
    // constraint conflicts on (repository_id, item_order).
    //
    // Step A: push every item to a very high temporary order that is
    //         guaranteed not to collide with any current or final order.
    // Step B: set the real sequential order (1 … N) now that no row
    //         holds any of those target values any more.
    await this.prisma.$transaction(async (tx) => {
      // Step A – temp orders (item.id offset guarantees uniqueness)
      for (const item of sorted) {
        await tx.learningRepositoryItem.update({
          where: { id: item.id },
          data: { item_order: item.id + 2_000_000 },
        });
      }

      // Step B – final sequential orders
      for (let i = 0; i < sorted.length; i++) {
        await tx.learningRepositoryItem.update({
          where: { id: sorted[i].id },
          data: { item_order: i + 1 },
        });
      }
    });

    await this.prisma.learningRepository.update({
      where: { id: repositoryId },
      data: {
        total_items: sorted.length,
        estimated_minutes: Math.ceil(sorted.length * 0.45),
      },
    });
  }

  private inferPartFromFilename(filename: string): number {
    const match = filename.match(/part[_-]?(\d)/i);
    return match ? parseInt(match[1], 10) : 1;
  }

  /**
   * Call the Python pdf_image_extractor.py script.
   * Images are saved to uploads/TOEIC/toeic-listening/{slug}/images/
   * The script is told to stop after Part 4 so it never touches
   * Speaking / Writing / Reading sections.
   */
  private async extractImagesFromPdf(
    pdfPath: string,
    slug: string,
  ): Promise<ToeicListeningImageAssetDto[]> {
    const imagesRelDir = listeningImagesRelDir(slug);
    const outputDir = absoluteUploadsDir(...imagesRelDir.split(/[\\/]/));
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    const pythonExe = process.platform === 'win32' ? 'python' : 'python3';
    const scriptPath = resolve(
      join(process.cwd(), '..', 'ml_service', 'pdf_image_extractor.py'),
    );

    if (!existsSync(scriptPath)) {
      throw new Error(
        `Python extractor script not found at: ${scriptPath}. ` +
          `Make sure ml_service/pdf_image_extractor.py exists and pymupdf is installed.`,
      );
    }

    let stdout = '';
    try {
      const result = await execFileAsync(
        pythonExe,
        [
          scriptPath,
          pdfPath,
          outputDir,
          slug,
          '--min-width',
          String(IMG_MIN_WIDTH),
          '--min-height',
          String(IMG_MIN_HEIGHT),
          '--skill-area',
          'listening',
        ],
        { timeout: 120_000 },
      );
      stdout = result.stdout;
    } catch (err: any) {
      const stderr = String(err?.stderr ?? '').trim();
      const msg = String(err?.message ?? err).trim();
      throw new Error(
        `PDF image extraction process failed. ` +
          `Ensure Python and pymupdf/Pillow are installed.\n${stderr || msg}`,
      );
    }

    let parsed: any;
    try {
      parsed = JSON.parse(stdout.trim());
    } catch {
      throw new Error(
        `Extractor returned non-JSON output: ${stdout.substring(0, 300)}`,
      );
    }

    if (parsed.status === 'error') {
      throw new Error(parsed.message ?? 'Unknown extractor error');
    }

    // Map Python output to DTO — override url_path to use canonical structure
    return (parsed.images ?? []).map(
      (img: any): ToeicListeningImageAssetDto => {
        // Ensure the url_path uses forward slashes and our canonical structure
        const canonicalUrl = `TOEIC/toeic-listening-exam/${slug}/images/${img.filename}`;
        return {
          filename: img.filename,
          url: canonicalUrl,
          page: img.page,
          part_hint: img.part_hint,
          width: img.width,
          height: img.height,
          size_bytes: img.size_bytes,
        };
      },
    );
  }



  // ──────────────────────────────────────────────────────────────────────────
  // PUBLIC: chunkListeningAudio
  // ──────────────────────────────────────────────────────────────────────────

  async chunkListeningAudio(
    accountId: number,
    dto: ToeicAudioChunkRequestDto,
    file: Express.Multer.File,
  ): Promise<ToeicAudioChunkResponseDto> {
    void accountId;

    const slug = dto.repository_slug.trim();
    const repository = await this.prisma.learningRepository.findFirst({
      where: { slug },
      select: { id: true, slug: true },
    });
    if (!repository) {
      throw new BadRequestException(`Không tìm thấy repository: ${slug}`);
    }

    // Save uploaded file to staging area
    const audioAbsDir = absoluteUploadsDir(
      'TOEIC',
      'toeic-listening-exam',
      slug,
      'audio',
    );
    if (!existsSync(audioAbsDir)) mkdirSync(audioAbsDir, { recursive: true });

    const outputDir = audioAbsDir; // chunks will be saved alongside

    const pythonExe = process.platform === 'win32' ? 'python' : 'python3';
    const scriptPath = resolve(
      join(process.cwd(), '..', 'ml_service', 'audio_chunker.py'),
    );

    if (!existsSync(scriptPath)) {
      throw new BadRequestException(
        'audio_chunker.py not found in ml_service/',
      );
    }

    const args = [
      scriptPath,
      file.path,
      outputDir,
      slug,
      '--method',
      dto.method ?? 'both',
      '--skill-area',
      'listening-exam',
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

    const chunks: ToeicAudioChunkDto[] = (parsed.chunks ?? []).map(
      (c: any) => ({
        filename: c.filename,
        url: `/uploads/${c.url_path}`,
        part: c.part,
        question_number: c.question_number,
        type: c.type,
        duration_seconds: c.duration_seconds,
        transcript_hint: c.transcript_hint,
      }),
    );

    // Auto-map if requested
    let autoMappedCount = 0;
    if (dto.auto_map !== false && chunks.length > 0) {
      const items = await this.prisma.learningRepositoryItem.findMany({
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
        await this.prisma.learningRepositoryItem.update({
          where: { id: itemId },
          data: { media_audio_url: chunk.url },
        });
        autoMappedCount++;
      }
    }

    return {
      repository_id: repository.id,
      slug: repository.slug,
      method_used: parsed.method_used ?? 'unknown',
      total_chunks: chunks.length,
      chunks,
      auto_mapped_count: autoMappedCount,
    };
  }
}
