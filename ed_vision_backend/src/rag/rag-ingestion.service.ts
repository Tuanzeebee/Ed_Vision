import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
// pdf-parse@1.x is a CommonJS module with `export =` — use require() for CJS compat in NestJS
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse') as (
  buf: Buffer,
  opts?: { max?: number },
) => Promise<{ text: string; numpages: number }>;
import * as mammoth from 'mammoth';
import { parse as csvParse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import * as fs from 'fs';

export interface ExtractedDocument {
  text: string;
  pageCount?: number;
}

export interface TextChunk {
  content: string;
  chunkIndex: number;
  tokenCount: number;
  pageNumber?: number;
  section?: string;
}

const CHUNK_SIZE = 512; // target tokens per chunk (~400 words)
const CHUNK_OVERLAP = 100; // overlap tokens between chunks (20%)
const CHARS_PER_TOKEN = 4; // approximate chars per token

@Injectable()
export class RagIngestionService {
  private readonly logger = new Logger(RagIngestionService.name);

  // ── Mã hóa / Giải mã nội dung chunk (AES-256-GCM) ──────────────────────────
  //
  // Cấu hình: thêm vào .env
  //   RAG_CONTENT_KEY=<chuỗi bất kỳ tối thiểu 32 ký tự>
  //
  // Nếu không có key → không mã hóa (backward compatible).
  // Format lưu trong DB: "<iv_b64>:<authTag_b64>:<cipher_b64>"
  // ─────────────────────────────────────────────────────────────────────

  private static getEncKey(): Buffer | null {
    const raw = process.env.RAG_CONTENT_KEY ?? '';
    if (raw.length < 32) return null;
    return Buffer.from(raw.slice(0, 32), 'utf-8');
  }

  static encryptContent(text: string): string {
    const key = RagIngestionService.getEncKey();
    if (!key) return text; // không có key → giữ nguyên
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([
      cipher.update(text, 'utf-8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    return [
      iv.toString('base64'),
      authTag.toString('base64'),
      encrypted.toString('base64'),
    ].join(':');
  }

  static decryptContent(stored: string): string {
    const key = RagIngestionService.getEncKey();
    // Nếu không có key hoặc không đúng format mã hóa → trả nguyên
    if (!key || !stored.includes(':')) return stored;
    const parts = stored.split(':');
    if (parts.length !== 3) return stored;
    try {
      const iv = Buffer.from(parts[0], 'base64');
      const authTag = Buffer.from(parts[1], 'base64');
      const encrypted = Buffer.from(parts[2], 'base64');
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(authTag);
      return Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]).toString('utf-8');
    } catch {
      return stored; // giải mã thất bại → trả nguyên (phòng trường hợp key đổi)
    }
  }

  /**
   * Xóa null bytes (0x00) và control chars không hợp lệ khiến PostgreSQL báo:
   * "ERROR: invalid byte sequence for encoding UTF8: 0x00" (code 22021).
   * Giữ lại: tab (9), LF (10), CR (13) và mọi ký tự in được (≥ 32, trừ DEL 127 và U+FFFD).
   * Dùng charCode filter thay vì regex để tránh ESLint no-control-regex.
   */
  private sanitizeText(text: string): string {
    const out: string[] = [];
    for (let i = 0; i < text.length; i++) {
      const c = text.charCodeAt(i);
      if (
        c === 9 ||
        c === 10 ||
        c === 13 ||
        (c >= 32 && c !== 127 && c !== 0xfffd)
      ) {
        out.push(text[i]);
      }
    }
    return out.join('').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  }

  // ── Text Extraction ──────────────────────────────────────────────────────

  async extractText(
    filePath: string,
    mimeType: string,
  ): Promise<ExtractedDocument> {
    const ext = filePath.split('.').pop()?.toLowerCase() ?? '';

    if (ext === 'pdf' || mimeType === 'application/pdf') {
      return this.extractPdf(filePath);
    }
    if (
      ext === 'docx' ||
      mimeType ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      return this.extractDocx(filePath);
    }
    if (ext === 'xlsx' || ext === 'xls' || mimeType.includes('spreadsheet')) {
      return this.extractExcel(filePath);
    }
    if (ext === 'csv' || mimeType === 'text/csv') {
      return this.extractCsv(filePath);
    }
    if (ext === 'txt' || mimeType === 'text/plain') {
      return this.extractTxt(filePath);
    }

    throw new Error(`Unsupported file type: .${ext} (${mimeType})`);
  }

  private async extractPdf(filePath: string): Promise<ExtractedDocument> {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return {
      text: this.sanitizeText(data.text),
      pageCount: data.numpages,
    };
  }

  private async extractDocx(filePath: string): Promise<ExtractedDocument> {
    const result = await mammoth.extractRawText({ path: filePath });
    return { text: this.sanitizeText(result.value) };
  }

  private async extractExcel(filePath: string): Promise<ExtractedDocument> {
    const workbook = XLSX.readFile(filePath);
    const texts: string[] = [];
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(sheet);
      texts.push(`=== Sheet: ${sheetName} ===\n${csv}`);
    }
    return { text: this.sanitizeText(texts.join('\n\n')) };
  }

  private extractCsv(filePath: string): ExtractedDocument {
    const content = fs.readFileSync(filePath, 'utf-8');
    const records = csvParse(content, {
      columns: true,
      skip_empty_lines: true,
    });
    const text = (records as Record<string, string>[])
      .map((row) =>
        Object.entries(row)
          .map(([k, v]) => `${k}: ${v}`)
          .join(' | '),
      )
      .join('\n');
    return { text: this.sanitizeText(text) };
  }

  private extractTxt(filePath: string): ExtractedDocument {
    const text = fs.readFileSync(filePath, 'utf-8');
    return { text: this.sanitizeText(text) };
  }

  // ── Text Chunking ──────────────────────────────────────────────────────

  /**
   * Chunk theo đoạn văn (paragraph-based):
   *   1. Tách văn bản thành các đoạn bằng \n\n
   *   2. Ghép các đoạn ngắn kề nhau cho đến khi gần MAX_CHARS
   *   3. Nếu một đoạn quá dài, cắt bằng sentence boundary
   *
   * Ưu điểm: giữ nguyên công thức/bảng trong cùng một đoạn, không bị cắt giữa chừng.
   */
  chunkText(text: string): TextChunk[] {
    const normalized = text
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (!normalized) return [];

    const MAX_CHARS = CHUNK_SIZE * CHARS_PER_TOKEN; // 2048 chars / chunk
    const MIN_CHARS = Math.floor(MAX_CHARS * 0.15); // 300 chars — đoạn ngắn quá thì ghép
    const OVERLAP_CHARS = CHUNK_OVERLAP * CHARS_PER_TOKEN; // 400 chars overlap

    // Bước 1: tách thành đoạn theo \n\n
    const paragraphs = normalized
      .split('\n\n')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    // Bước 2: ghép đoạn ngắn, cắt đoạn dài
    const rawChunks: string[] = [];
    let buffer = '';

    for (const para of paragraphs) {
      if (para.length > MAX_CHARS) {
        // Đoạn quá dài — flush buffer trước
        if (buffer.trim().length > MIN_CHARS) {
          rawChunks.push(buffer.trim());
          buffer = '';
        }
        // Cắt đoạn dài theo sentence boundary
        let pos = 0;
        while (pos < para.length) {
          let endPos = Math.min(pos + MAX_CHARS, para.length);
          if (endPos < para.length) {
            const window = para.slice(Math.max(pos, endPos - 200), endPos);
            const dot = Math.max(
              window.lastIndexOf('. '),
              window.lastIndexOf('.\n'),
              window.lastIndexOf('? '),
              window.lastIndexOf('! '),
            );
            if (dot !== -1) endPos = Math.max(pos, endPos - 200) + dot + 2;
          }
          const slice = para.slice(pos, endPos).trim();
          if (slice.length > 50) rawChunks.push(slice);
          pos = Math.max(pos + 1, endPos);
        }
      } else if (buffer.length + para.length + 2 <= MAX_CHARS) {
        // Ghép đoạn vào buffer
        buffer = buffer ? buffer + '\n\n' + para : para;
      } else {
        // Buffer đầy — flush và bắt đầu buffer mới
        if (buffer.trim().length > MIN_CHARS) rawChunks.push(buffer.trim());
        buffer = para;
      }
    }
    if (buffer.trim().length > MIN_CHARS) rawChunks.push(buffer.trim());

    // Bước 3: thêm overlap — mỗi chunk thêm phần đuôi của chunk trước
    const chunks: TextChunk[] = [];
    for (let i = 0; i < rawChunks.length; i++) {
      let content = rawChunks[i];

      // Prefix: lấy phần đuôi của chunk trước làm context
      if (i > 0) {
        const prev = rawChunks[i - 1];
        const overlap = prev.slice(-OVERLAP_CHARS).trim();
        if (overlap && !content.startsWith(overlap.slice(0, 30))) {
          content = overlap + '\n\n' + content;
        }
      }

      if (content.trim().length > 50) {
        chunks.push({
          content: content.trim(),
          chunkIndex: i,
          tokenCount: Math.ceil(content.length / CHARS_PER_TOKEN),
        });
      }
    }

    this.logger.debug(
      `Chunked text (paragraph-based): ${normalized.length} chars, ${paragraphs.length} paragraphs → ${chunks.length} chunks`,
    );
    return chunks;
  }

  // ── AI Category Detection ────────────────────────────────────────────────

  /**
   * Dùng Gemini để tự động phân loại nội dung tài liệu.
   * Returns: category string (e.g. "Ngữ pháp", "Từ vựng", "Chiến thuật làm bài")
   */
  async detectCategory(sampleText: string, certType: string): Promise<string> {
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const apiKey =
        process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
      if (!apiKey) return 'Tài liệu chung';

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const prompt = [
        `Phân loại đoạn tài liệu học ${certType.toUpperCase()} này vào đúng 1 trong các danh mục:`,
        `Ngữ pháp | Từ vựng | Phát âm | Kỹ năng Nghe | Kỹ năng Đọc | Kỹ năng Viết | Kỹ năng Nói | Chiến thuật làm bài | Đề thi mẫu | Kiến thức chung`,
        `Chỉ trả về TÊN DANH MỤC, không giải thích.`,
        `Đoạn văn:\n${sampleText.slice(0, 500)}`,
      ].join('\n');

      const result = await model.generateContent(prompt);
      const category = result.response.text().trim().split('\n')[0].trim();
      return category.length > 0 && category.length < 100
        ? category
        : 'Tài liệu chung';
    } catch {
      return 'Tài liệu chung';
    }
  }
}
