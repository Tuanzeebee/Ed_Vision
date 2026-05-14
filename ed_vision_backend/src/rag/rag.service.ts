import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RagEmbeddingService } from './rag-embedding.service';
import { RagIngestionService } from './rag-ingestion.service';
import { RagRetrievalService, RagQueryResult } from './rag-retrieval.service';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

const MAX_TOTAL_SIZE_BYTES = 500 * 1024 * 1024; // 500 MB

export interface UploadDocumentResult {
  documentId: number;
  title: string;
  status: string;
  message: string;
}

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingService: RagEmbeddingService,
    private readonly ingestionService: RagIngestionService,
    private readonly retrievalService: RagRetrievalService,
  ) {}

  // ── Admin: Upload & Ingest Document ─────────────────────────────────────

  async uploadDocument(
    accountId: number,
    file: Express.Multer.File,
    certType: string,
    language = 'en',
  ): Promise<UploadDocumentResult> {
    // Validate file type
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        `Loại file không được hỗ trợ: ${file.mimetype}. Chỉ chấp nhận PDF, DOCX, TXT, CSV, XLSX.`,
      );
    }

    // Validate cert_type
    const allowedCertTypes = ['toeic', 'ielts', 'general'];
    if (!allowedCertTypes.includes(certType.toLowerCase())) {
      throw new BadRequestException(`cert_type không hợp lệ: ${certType}`);
    }

    // Save file to disk
    const uploadDir = path.join(process.cwd(), 'uploads', 'rag');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const ext = path.extname(file.originalname);
    const safeName = crypto.randomBytes(16).toString('hex') + ext;
    const filePath = path.join(uploadDir, safeName);
    fs.writeFileSync(filePath, file.buffer);

    // Determine source type
    const sourceType = ext.replace('.', '').toLowerCase() || 'unknown';

    // Create document record with status "pending"
    const doc = await this.prisma.ragDocument.create({
      data: {
        title: file.originalname.replace(ext, ''),
        source_type: sourceType,
        cert_type: certType.toLowerCase(),
        language,
        file_url: filePath,
        file_size: file.size,
        status: 'processing',
        created_by: accountId,
      },
    });

    // Process asynchronously (non-blocking)
    void this.processDocument(doc.id, filePath, file.mimetype).catch((err) => {
      this.logger.error(
        `processDocument failed for doc ${doc.id}: ${err.message}`,
      );
    });

    return {
      documentId: doc.id,
      title: doc.title,
      status: 'processing',
      message:
        'Tài liệu đang được xử lý. Quay lại sau vài phút để xem kết quả.',
    };
  }

  /**
   * Pipeline xử lý tài liệu:
   *   Phase 1 (nhanh, ~15s): extract → chunk → save chunks (không embedding) → status=indexing
   *   Phase 2 (chậm, background): embed từng batch → update embedding → status=ready
   *
   * Chunks hiện trên KPI ngay sau Phase 1, user không cần chờ embed xong mới thấy.
   */
  private async processDocument(
    documentId: number,
    filePath: string,
    mimeType: string,
  ): Promise<void> {
    try {
      this.logger.log(`Processing RAG document ${documentId}...`);

      // ── PHASE 1: Extract + Chunk + Save (nhanh) ───────────────────────────────

      // 1. Extract text
      const extracted = await this.ingestionService.extractText(
        filePath,
        mimeType,
      );
      if (!extracted.text || extracted.text.trim().length < 50) {
        throw new Error(
          'Không thể trích xuất văn bản từ file. File có thể trống hoặc bị lỗi.',
        );
      }

      // 2. Get document info + set category
      const doc = await this.prisma.ragDocument.findUnique({
        where: { id: documentId },
      });
      if (!doc) throw new Error(`Document ${documentId} not found`);

      const categoryMap: Record<string, string> = {
        toeic: 'Tài liệu TOEIC',
        ielts: 'Tài liệu IELTS',
        general: 'Tài liệu chung',
      };
      const category = categoryMap[doc.cert_type] ?? 'Tài liệu chung';

      // 3. Chunk text
      const chunks = this.ingestionService.chunkText(extracted.text);
      if (chunks.length === 0) {
        throw new Error('Không tạo được chunk nào từ văn bản.');
      }

      // 4. Xóa chunks cũ + Insert chunks mới (không có embedding trước)
      await this.prisma.ragChunk.deleteMany({
        where: { document_id: documentId },
      });

      const INSERT_BATCH = 100;
      for (let i = 0; i < chunks.length; i += INSERT_BATCH) {
        const batch = chunks.slice(i, i + INSERT_BATCH);
        const values: unknown[] = [];
        const placeholders = batch.map((chunk, j) => {
          const base = j * 6;
          values.push(
            documentId,
            RagIngestionService.encryptContent(chunk.content),
            chunk.chunkIndex,
            chunk.tokenCount,
            chunk.pageNumber ?? null,
            chunk.section ?? null,
          );
          return `($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5},$${base + 6})`;
        });
        await this.prisma.$executeRawUnsafe(
          `INSERT INTO "RagChunk" (document_id, content, chunk_index, token_count, page_number, section)
           VALUES ${placeholders.join(',')}`,
          ...values,
        );
      }

      // 5. Cập nhật status → 'indexing': chunks đã có trên KPI, đang chờ embed
      await this.prisma.ragDocument.update({
        where: { id: documentId },
        data: { status: 'indexing', category, chunk_count: chunks.length },
      });
      this.logger.log(
        `📚 RAG document ${documentId}: ${chunks.length} chunks saved, starting embedding...`,
      );

      // ── PHASE 2: Embed trong background ───────────────────────────────────────
      void this.embedDocumentChunks(
        documentId,
        chunks.map((c) => c.content),
      );
    } catch (error) {
      const msg = (error as Error).message;
      this.logger.error(`❌ RAG document ${documentId} failed: ${msg}`);
      await this.prisma.ragDocument
        .update({
          where: { id: documentId },
          data: { status: 'error', error_msg: msg },
        })
        .catch(() => {});
    }
  }

  /**
   * Phase 2: embed từng batch và UPDATE trực tiếp vào từng chunk.
   * Chạy async sau khi chunks đã được lưu (status = 'indexing').
   */
  private async embedDocumentChunks(
    documentId: number,
    contents: string[],
  ): Promise<void> {
    const EMBED_BATCH = 8;
    const totalBatches = Math.ceil(contents.length / EMBED_BATCH);
    let successCount = 0;

    try {
      // Lấy id của từng chunk theo đúng thứ tự chunk_index
      const rows = await this.prisma.$queryRawUnsafe<{ id: number }[]>(
        `SELECT id FROM "RagChunk" WHERE document_id = $1 ORDER BY chunk_index ASC`,
        documentId,
      );
      const chunkIds = rows.map((r) => r.id);

      for (let i = 0; i < contents.length; i += EMBED_BATCH) {
        const batchNum = Math.floor(i / EMBED_BATCH) + 1;
        const batchContents = contents.slice(i, i + EMBED_BATCH);
        const batchIds = chunkIds.slice(i, i + EMBED_BATCH);

        try {
          const embeddings =
            await this.embeddingService.embedBatch(batchContents);

          for (let j = 0; j < batchIds.length; j++) {
            const vec = embeddings[j];
            if (!vec || vec.every((v) => v === 0)) continue; // bỏ zero vectors
            await this.prisma.$executeRawUnsafe(
              `UPDATE "RagChunk" SET embedding = $1::vector WHERE id = $2`,
              `[${vec.join(',')}]`,
              batchIds[j],
            );
          }
          successCount += batchIds.length;
          this.logger.debug(
            `Embed [${batchNum}/${totalBatches}]: ${batchIds.length} chunks ✓`,
          );
        } catch (err) {
          this.logger.warn(
            `Embed [${batchNum}/${totalBatches}] failed: ${(err as Error).message}`,
          );
        }
      }
    } catch (err) {
      this.logger.error(
        `embedDocumentChunks doc ${documentId}: ${(err as Error).message}`,
      );
    } finally {
      // Dù embed có lỗi hay không, đặt ready — chunks vẫn dùng được
      await this.prisma.ragDocument
        .update({ where: { id: documentId }, data: { status: 'ready' } })
        .catch(() => {});
      this.logger.log(
        `✅ RAG document ${documentId} ready — ${successCount}/${contents.length} embedded`,
      );
    }
  }

  // ── Admin: Manage Documents ──────────────────────────────────────────

  async listDocuments(certType?: string, page = 1, limit = 20) {
    const where = {
      deleted_at: null,
      ...(certType ? { cert_type: certType } : {}),
    };
    const [total, docs] = await Promise.all([
      this.prisma.ragDocument.count({ where }),
      this.prisma.ragDocument.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          source_type: true,
          cert_type: true,
          category: true,
          language: true,
          status: true,
          error_msg: true,
          chunk_count: true,
          file_size: true,
          created_at: true,
          createdBy: { select: { email: true } },
        },
      }),
    ]);
    return { total, page, limit, data: docs };
  }

  async getDocumentChunks(documentId: number, page = 1, limit = 20) {
    const doc = await this.prisma.ragDocument.findUnique({
      where: { id: documentId, deleted_at: null },
    });
    if (!doc) throw new NotFoundException('Không tìm thấy tài liệu');

    const [total, chunks] = await Promise.all([
      this.prisma.ragChunk.count({ where: { document_id: documentId } }),
      this.prisma.ragChunk.findMany({
        where: { document_id: documentId },
        orderBy: { chunk_index: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          chunk_index: true,
          content: true,
          token_count: true,
          page_number: true,
          // Exclude embedding from list view (large data)
        },
      }),
    ]);

    // Giải mã content trước khi trả về (nếu đang dùng mã hóa)
    const decryptedChunks = chunks.map((c) => ({
      ...c,
      content: RagIngestionService.decryptContent(c.content),
    }));
    return { document: doc, total, page, limit, chunks: decryptedChunks };
  }

  async deleteDocument(documentId: number): Promise<void> {
    const doc = await this.prisma.ragDocument.findUnique({
      where: { id: documentId, deleted_at: null },
    });
    if (!doc) throw new NotFoundException('Không tìm thấy tài liệu');

    // Soft delete + cascade chunks physically
    await this.prisma.ragChunk.deleteMany({
      where: { document_id: documentId },
    });
    await this.prisma.ragDocument.update({
      where: { id: documentId },
      data: { deleted_at: new Date(), status: 'deleted' },
    });

    // Clean up file
    if (doc.file_url && fs.existsSync(doc.file_url)) {
      fs.unlinkSync(doc.file_url);
    }
  }

  async reprocessDocument(documentId: number): Promise<void> {
    const doc = await this.prisma.ragDocument.findUnique({
      where: { id: documentId, deleted_at: null },
    });
    if (!doc || !doc.file_url) {
      throw new NotFoundException(
        'Không tìm thấy tài liệu hoặc file đã bị xóa.',
      );
    }

    await this.prisma.ragDocument.update({
      where: { id: documentId },
      data: { status: 'processing', error_msg: null },
    });

    void this.processDocument(
      documentId,
      doc.file_url,
      `application/${doc.source_type}`,
    );
  }

  // ── Admin: Test Query ────────────────────────────────────────────────────

  async testQuery(
    question: string,
    certType?: string,
    topK = 5,
  ): Promise<RagQueryResult & { totalDocuments: number }> {
    const totalDocuments = await this.prisma.ragDocument.count({
      where: { status: 'ready', deleted_at: null },
    });

    const result = await this.retrievalService.query(question, {
      certType,
      topK,
    });
    return { ...result, totalDocuments };
  }

  async getStats() {
    const [totalDocs, byCertType, byStatus, totalChunks] = await Promise.all([
      this.prisma.ragDocument.count({ where: { deleted_at: null } }),
      this.prisma.ragDocument.groupBy({
        by: ['cert_type'],
        _count: { id: true },
        where: { deleted_at: null, status: 'ready' },
      }),
      this.prisma.ragDocument.groupBy({
        by: ['status'],
        _count: { id: true },
        where: { deleted_at: null },
      }),
      this.prisma.ragChunk.count(),
    ]);

    return { totalDocs, totalChunks, byCertType, byStatus };
  }

  // ── Student/Internal: RAG-augmented context ──────────────────────────────

  async getRagContext(question: string, certType?: string) {
    return this.retrievalService.buildRagContext(question, certType);
  }
}
