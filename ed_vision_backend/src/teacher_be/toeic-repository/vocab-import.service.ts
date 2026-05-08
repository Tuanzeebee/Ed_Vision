import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { CreateTopicDto, ConfirmImportDto } from '../../student_be/vocab/dto/vocab.dto';
import { RegexExtractor } from './regex-extractor';
import { PreviewBuilder } from './preview-builder';
import { ColumnDetector } from './column-detector';
import { OllamaClient } from './ollama.client';
import { ExtractedWord } from './regex-extractor';

// ─── Slugify ──────────────────────────────────────────────────────────────────
function slugify(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-');
}

// ─── 10 TOEIC topics cố định ─────────────────────────────────────────────────
const TOEIC_TOPICS = [
  { slug: 'office-work', vi: 'Văn phòng & Công việc', en: 'Office & Work', emoji: '🏢' },
  { slug: 'finance-banking', vi: 'Tài chính & Ngân hàng', en: 'Finance & Banking', emoji: '💰' },
  { slug: 'human-resources', vi: 'Nhân sự', en: 'Human Resources', emoji: '👥' },
  { slug: 'marketing-sales', vi: 'Marketing & Bán hàng', en: 'Marketing & Sales', emoji: '📢' },
  { slug: 'travel-transport', vi: 'Du lịch & Giao thông', en: 'Travel & Transport', emoji: '✈️' },
  { slug: 'healthcare', vi: 'Y tế & Sức khỏe', en: 'Healthcare', emoji: '🏥' },
  { slug: 'technology', vi: 'Công nghệ', en: 'Technology', emoji: '💻' },
  { slug: 'legal-contracts', vi: 'Pháp lý & Hợp đồng', en: 'Legal & Contracts', emoji: '⚖️' },
  { slug: 'customer-service', vi: 'Dịch vụ khách hàng', en: 'Customer Service', emoji: '🤝' },
  { slug: 'general-business', vi: 'Kinh doanh chung', en: 'General Business', emoji: '📊' },
];
function getTopic(slug: string) { return TOEIC_TOPICS.find((t) => t.slug === slug) ?? TOEIC_TOPICS[9]; }

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ParsedVocabWord {
  word: string;
  topic_slug: string;
  topic_vi: string;
  topic_en: string;
  level: string;
  freq: number;
  definitions: { pos: string; meaning: string; example_en: string; example_vi: string }[];
}
export interface VocabImportPreviewDto { topic_id?: number; cert_type?: string; }

@Injectable()
export class VocabImportService {
  // ── Text model (qwen3): chỉ dùng cho PDF/TXT clean — KHÔNG dùng cho ảnh
  private ollama: OllamaClient | null = null;

  private readonly columnDetector: ColumnDetector;
  private readonly regexExtractor: RegexExtractor;
  private readonly previewBuilder: PreviewBuilder;

  constructor(private readonly prisma: PrismaService) {
    this.columnDetector = new ColumnDetector();
    this.regexExtractor = new RegexExtractor();
    this.previewBuilder = new PreviewBuilder();
    this.initOllama();
  }

  // ── initOllama: chỉ init text model cho PDF/TXT ─────────────────────────────
  private initOllama(): void {
    const baseUrl = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
    const textModel = process.env.OLLAMA_MODEL ?? 'qwen3';
    this.ollama = new OllamaClient({ baseUrl, model: textModel, timeoutMs: 60000 });
  }

  // ── CRUD topics ──────────────────────────────────────────────────────────
  async upsertTopic(dto: CreateTopicDto) {
    const slug = slugify(dto.title_vi);
    return this.prisma.vocabTopic.upsert({
      where: { slug },
      create: { slug, title_vi: dto.title_vi, title_en: dto.title_en, emoji: dto.emoji, cert_type: dto.cert_type ?? 'toeic', sort_order: dto.sort_order ?? 0 },
      update: { title_vi: dto.title_vi, title_en: dto.title_en, emoji: dto.emoji },
    });
  }

  async listTopics(certType = 'toeic') {
    const topics = await this.prisma.vocabTopic.findMany({
      where: { cert_type: certType }, orderBy: { sort_order: 'asc' },
      include: { _count: { select: { words: true } } },
    });
    return topics.map((t) => ({ id: t.id, slug: t.slug, titleVI: t.title_vi, titleEN: t.title_en, emoji: t.emoji, wordCount: t._count.words }));
  }

  async deleteWord(wordId: number) {
    await this.prisma.vocabWord.delete({ where: { id: wordId } });
    return { deleted: true, wordId };
  }

  // ── parseAndPreview ──────────────────────────────────────────────────────
  async parseAndPreview(file: Express.Multer.File, dto: VocabImportPreviewDto) {
    const ext = path.extname(file.originalname).toLowerCase();
    const isImage = ['.jpg', '.jpeg', '.png', '.webp', '.bmp'].includes(ext);

    let extracted: ExtractedWord[] = [];

    if (isImage) {
      // ── Ảnh: Tesseract OCR (column-aware) → Regex ─────────────────────
      // Không dùng AI model cho ảnh (quá chậm/không ổn định local)
      extracted = await this.processImage(file);
    } else if (ext === '.pdf') {
      // ── PDF: extract text → qwen3 clean → Regex ──────────────────
      const text = await this.extractPdf(file.path);
      extracted = await this.processText(text, 'PDF');
    } else {
      // ── Text-based (CSV, TXT, JSON) → Regex ───────────────────────────
      const rawText = fs.readFileSync(file.path, 'utf8');
      extracted = await this.processText(rawText, 'TXT');
    }

    try { fs.unlinkSync(file.path); } catch { /**/ }

    if (!extracted.length) {
      throw new BadRequestException('Không phân tích được từ vựng. Kiểm tra file rõ nét hoặc thử định dạng khác.');
    }

    // Auto-correct spelling errors in Vietnamese meanings if Qwen3 is available
    if (this.ollama) {
      extracted = await this.ollama.fixSpelling(extracted);
    }

    return { preview: this.previewBuilder.build(extracted, dto.topic_id), rawText: '' };
  }

  // ── confirmImport ────────────────────────────────────────────────────────
  async confirmImport(dto: ConfirmImportDto): Promise<{ imported: number }> {
    let imported = 0;
    for (const item of dto.words) {
      let topicDbId = item.topic_id;
      if (!topicDbId && item.topic_slug) {
        const meta = getTopic(item.topic_slug);
        const db = await this.prisma.vocabTopic.upsert({
          where: { slug: item.topic_slug },
          create: { slug: item.topic_slug, title_vi: meta.vi, title_en: meta.en, emoji: meta.emoji, cert_type: 'toeic', sort_order: TOEIC_TOPICS.findIndex((t) => t.slug === item.topic_slug) },
          update: {},
        });
        topicDbId = db.id;
      }
      if (!topicDbId) continue;

      const word = await this.prisma.vocabWord.upsert({
        where: { topic_id_word: { topic_id: topicDbId, word: item.word.toLowerCase() } },
        create: { topic_id: topicDbId, word: item.word.toLowerCase(), level: item.level, freq: item.freq, source: 'vocab-import' },
        update: { level: item.level, freq: item.freq },
      });
      await this.prisma.vocabDefinition.deleteMany({ where: { word_id: word.id } });
      if (item.definitions?.length) {
        await this.prisma.vocabDefinition.createMany({
          data: item.definitions.map((d, i) => ({ word_id: word.id, pos: d.pos, meaning: d.meaning, example_en: d.example_en ?? '', example_vi: d.example_vi ?? '', sort_order: i })),
        });
      }
      imported++;
    }
    return { imported };
  }

  // ── processImage: preprocess Sharp → Tesseract column-aware → (Ollama clean) → Regex
  // - Preprocess: grayscale + normalize + sharpen + upscale 2x → tăng accuracy Tesseract VI.
  // - Optional: nếu Ollama qwen3 chạy local, fix OCR noise (","→".", ";"→":") trước regex.
  // - Fallback: nếu Ollama không available hoặc timeout, regex trực tiếp trên OCR raw.
  private async processImage(file: Express.Multer.File): Promise<ExtractedWord[]> {
    let ocrText = '';
    try {
      ocrText = await this.ocrColumns(file.path);
    } catch (e: any) {
      console.warn('[VocabImport] OCR failed:', e?.message);
    }

    if (!ocrText.trim()) {
      throw new BadRequestException('Không đọc được ảnh. Kiểm tra file rõ nét và thử lại.');
    }

    // Thử Ollama clean trước — nếu có nhiều entry hơn, dùng bản clean.
    let bestResult = this.regexExtractor.extract(ocrText);
    if (this.ollama) {
      try {
        const available = await this.ollama.isAvailable();
        if (available) {
          const cleaned = await this.ollama.cleanText(ocrText);
          const cleanedResult = this.regexExtractor.extract(cleaned);
          if (cleanedResult.length > bestResult.length) {
            console.log(
              `[VocabImport] Ollama clean improved entries: ${bestResult.length} → ${cleanedResult.length}`,
            );
            bestResult = cleanedResult;
          }
        }
      } catch (e: any) {
        console.warn(`[VocabImport] Ollama cleanText failed (sử dụng OCR raw): ${e?.message}`);
      }
    }

    if (bestResult.length > 0) return bestResult;

    throw new BadRequestException('Không phân tích được từ vựng từ ảnh. Thử file PDF hoặc TXT để kết quả tốt hơn.');
  }

  // ── processText: qwen3 clean → Regex (cho PDF/TXT) ──────────────────
  private async processText(rawText: string, source: string): Promise<ExtractedWord[]> {
    if (this.ollama) {
      try {
        const cleaned = await this.ollama.cleanText(rawText);
        const result = this.regexExtractor.extract(cleaned);
        if (result.length > 0) {
          return result;
        }
      } catch (e: any) {
        console.warn(`[VocabImport] Qwen3 ${source} failed: ${e?.message} — trying raw`);
      }
    }
    // Fallback: regex trực tiếp trên raw text
    const result = this.regexExtractor.extract(rawText);
    return result;
  }

  // ── ocrColumns: crop từng cột → preprocess Sharp → Tesseract OCR song song ─────
  private async ocrColumns(imagePath: string): Promise<string> {
    const os = await import('os');
    const tmpDir = os.tmpdir();

    const detectionResult = await this.columnDetector.detectColumns(imagePath);
    const croppedPaths = await this.columnDetector.cropToColumns(imagePath, detectionResult.columns, tmpDir);

    // Preprocess từng cột (grayscale + normalize + sharpen + upscale) trước khi OCR.
    const preprocessedPaths = await Promise.all(
      croppedPaths.map((p) => this.preprocessForOcr(p)),
    );

    const columnResults = await Promise.all(
      preprocessedPaths.map(async (colPath, i) => {
        try {
          const text = await this.ocrImage(colPath);
          return text;
        } catch (e: any) {
          console.warn(`[VocabImport] OCR column ${i} failed:`, e?.message);
          return '';
        }
      }),
    );

    // Cleanup phải xóa cả cropped lẫn preprocessed.
    for (const p of [...croppedPaths, ...preprocessedPaths]) {
      if (!p) continue;
      try { fs.unlinkSync(p); } catch { /**/ }
    }

    return columnResults.filter(Boolean).join('\n\n');
  }

  // ── preprocessForOcr: tăng accuracy Tesseract VI bằng pipeline Sharp ──────────
  // grayscale → normalize (kéo giãn contrast) → sharpen → upscale 2x cho chữ nhỏ.
  // Kết quả lưu vào file PNG riu để OCR tiếng Việt đọc dấu tốt hơn.
  private async preprocessForOcr(inputPath: string): Promise<string> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const sharp = require('sharp') as any;
      const meta = await sharp(inputPath).metadata();
      const targetWidth = Math.min((meta.width ?? 1000) * 2, 4000);
      const outPath = inputPath.replace(/(\.[^.]+)?$/, '_pre.png');
      await sharp(inputPath)
        .resize({ width: targetWidth, withoutEnlargement: false })
        .grayscale()
        .normalize()
        .sharpen()
        .png({ compressionLevel: 0 })
        .toFile(outPath);
      return outPath;
    } catch (e: any) {
      console.warn('[VocabImport] preprocessForOcr failed, dùng ảnh gốc:', e?.message);
      return inputPath;
    }
  }

  // ── Tesseract OCR ──────────────────────────────────────────────
  // PSM 6 = assume single uniform block of text (hợp với từng cột đã crop).
  // preserve_interword_spaces=1 → giữ nguyên khoảng trắng giữa từ, giảm dani entry.
  private async ocrImage(filePath: string): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createWorker, PSM } = require('tesseract.js') as {
      createWorker: (
        l: string[],
        oem?: number,
        opts?: any,
      ) => Promise<{
        setParameters: (p: Record<string, string>) => Promise<void>;
        recognize: (p: string) => Promise<{ data: { text: string } }>;
        terminate: () => Promise<void>;
      }>;
      PSM?: { SINGLE_BLOCK: string };
    };
    const worker = await createWorker(['eng', 'vie']);
    try {
      await worker.setParameters({
        tessedit_pageseg_mode: (PSM && PSM.SINGLE_BLOCK) || '6',
        preserve_interword_spaces: '1',
      });
    } catch {
      // Older tesseract.js versions không hỗ trợ setParameters — bỏ qua, dùng default.
    }
    const { data: { text } } = await worker.recognize(filePath);
    await worker.terminate();
    return text;
  }

  // ── PDF extract ───────────────────────────────────────────────────────────
  private async extractPdf(filePath: string): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pdfParse = require('pdf-parse') as (b: Buffer) => Promise<{ text: string }>;
    return (await pdfParse(fs.readFileSync(filePath))).text;
  }

  // ── backward-compat ───────────────────────────────────────────────────────
  extractWithRegex(rawText: string): ExtractedWord[] {
    return this.regexExtractor.extract(rawText);
  }
}
