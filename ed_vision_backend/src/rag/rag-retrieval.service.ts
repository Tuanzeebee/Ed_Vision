import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RagEmbeddingService } from './rag-embedding.service';
import { RagIngestionService } from './rag-ingestion.service';

export interface RetrievedChunk {
  content: string;
  score: number;
  documentTitle: string;
  category: string | null;
  certType: string;
  chunkIndex: number;
  pageNumber?: number | null;
}

export interface RagQueryResult {
  chunks: RetrievedChunk[];
  contextText: string; // pre-formatted for LLM prompt
  sourceCitations: string[]; // human-readable source list
}

const DEFAULT_TOP_K = 5;
const MIN_SIMILARITY_THRESHOLD = 0.3; // cosine similarity threshold

@Injectable()
export class RagRetrievalService {
  private readonly logger = new Logger(RagRetrievalService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingService: RagEmbeddingService,
  ) {}

  /**
   * Truy vấn Knowledge Base bằng câu hỏi tự nhiên.
   * Returns top-K chunks có độ tương đồng cao nhất.
   */
  async query(
    question: string,
    options: {
      certType?: string; // "toeic" | "ielts" | "general" | undefined (all)
      topK?: number;
      minScore?: number;
    } = {},
  ): Promise<RagQueryResult> {
    const {
      certType,
      topK = DEFAULT_TOP_K,
      minScore = MIN_SIMILARITY_THRESHOLD,
    } = options;

    // 1. Embed câu hỏi
    const queryEmbedding = await this.embeddingService.embedText(question);
    const vectorStr = `[${queryEmbedding.join(',')}]`;

    // 2. Native pgvector cosine similarity query — uses HNSW index
    //    1 - cosine_distance = cosine_similarity
    const certFilter = certType
      ? `AND d.cert_type = '${certType.replace(/'/g, "''")}'`
      : '';

    type RawChunkRow = {
      content: string;
      score: number;
      title: string;
      category: string | null;
      cert_type: string;
      chunk_index: number;
      page_number: number | null;
    };

    const rows = await this.prisma.$queryRawUnsafe<RawChunkRow[]>(
      `SELECT
         c.content,
         (1 - (c.embedding <=> $1::vector))::float8 AS score,
         d.title,
         d.category,
         d.cert_type,
         c.chunk_index,
         c.page_number
       FROM "RagChunk" c
       JOIN "RagDocument" d ON d.id = c.document_id
       WHERE d.status = 'ready'
         AND d.deleted_at IS NULL
         AND c.embedding IS NOT NULL
         ${certFilter}
       ORDER BY c.embedding <=> $1::vector
       LIMIT $2`,
      vectorStr,
      topK * 3, // lấy nhiều hơn rồi filter theo minScore
    );

    if (rows.length === 0) {
      return { chunks: [], contextText: '', sourceCitations: [] };
    }

    // 3. Filter theo minScore và slice topK
    const scored: RetrievedChunk[] = rows
      .filter((r) => Number(r.score) >= minScore)
      .slice(0, topK)
      .map((r) => ({
        content: RagIngestionService.decryptContent(r.content),
        score: Number(r.score),
        documentTitle: r.title,
        category: r.category,
        certType: r.cert_type,
        chunkIndex: r.chunk_index,
        pageNumber: r.page_number,
      }));

    if (scored.length === 0) {
      return { chunks: [], contextText: '', sourceCitations: [] };
    }

    // 4. Build formatted context for LLM
    const contextText = scored
      .map((c, i) => {
        const src = c.pageNumber
          ? `${c.documentTitle}, tr.${c.pageNumber}`
          : c.documentTitle;
        return `[Nguồn ${i + 1}: ${src}]\n${c.content}`;
      })
      .join('\n\n---\n\n');

    const sourceCitations = [
      ...new Set(
        scored.map((c) =>
          c.pageNumber
            ? `📄 ${c.documentTitle} (tr.${c.pageNumber})`
            : `📄 ${c.documentTitle}`,
        ),
      ),
    ];

    this.logger.debug(
      `RAG query (pgvector): "${question.slice(0, 50)}..." → ${scored.length} chunks (top score: ${scored[0]?.score.toFixed(3)})`,
    );

    return { chunks: scored, contextText, sourceCitations };
  }

  /**
   * Xây dựng RAG-augmented system prompt để inject vào LLM.
   * Trả về null nếu không tìm thấy context liên quan.
   */
  async buildRagContext(
    question: string,
    certType?: string,
  ): Promise<{ contextBlock: string; citations: string[] } | null> {
    const result = await this.query(question, { certType, topK: 4 });

    if (result.chunks.length === 0) {
      return null;
    }

    const contextBlock = [
      '=== Tài liệu tham khảo từ Knowledge Base ===',
      result.contextText,
      '=== Hết phần tài liệu tham khảo ===',
    ].join('\n');

    return { contextBlock, citations: result.sourceCitations };
  }
}
