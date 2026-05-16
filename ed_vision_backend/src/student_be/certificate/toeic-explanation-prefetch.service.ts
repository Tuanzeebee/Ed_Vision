import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CertificateEnrollmentService } from './certificate-enrollment.service';

/**
 * ToeicExplanationPrefetchService
 *
 * Chạy ngầm ngay sau khi server khởi động.
 * Tự động duyệt toàn bộ câu hỏi TOEIC đã publish và gọi Ollama để
 * sinh giải thích sẵn vào file-cache — giúp response gần như tức thì
 * khi user thực sự yêu cầu giải thích.
 *
 * Cơ chế:
 *  - Chờ PREFETCH_DELAY_MS (mặc định 15 giây) sau bootstrap để server
 *    sẵn sàng hoàn toàn trước khi bắt đầu gọi Ollama.
 *  - Chỉ prefetch repository TOEIC và chạy theo batch nhỏ để tránh
 *    tranh tài nguyên với request thật của người dùng.
 *  - Câu hỏi đã có cache sẽ bị bỏ qua ngay lập tức (0ms overhead).
 *  - Mọi lỗi prefetch đều được log ở level WARN, không làm server crash.
 */
@Injectable()
export class ToeicExplanationPrefetchService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ToeicExplanationPrefetchService.name);

  /** Thời gian chờ sau bootstrap trước khi bắt đầu prefetch (ms) */
  private readonly PREFETCH_DELAY_MS = 15_000;

  /** Khoảng nghỉ giữa mỗi lần gọi Ollama để không bão hoà model (ms) */
  private readonly INTER_BATCH_DELAY_MS = 500;

  /** Số item chạy song song trong một batch prefetch */
  private readonly PREFETCH_BATCH_SIZE = 2;

  /** Giới hạn item mỗi vòng prefetch để tránh chiếm model quá lâu */
  private readonly MAX_ITEMS_PER_RUN = Number(
    process.env.TOEIC_PREFETCH_MAX_ITEMS ?? 0,
  );

  /** Số lần retry khi Ollama trả lỗi tạm thời */
  private readonly MAX_RETRY = 2;

  /** Chu kỳ chờ trước khi kiểm tra lại Ollama health (ms) */
  private readonly OLLAMA_HEALTH_RETRY_MS = 15_000;

  /** Số lần thử lại health-check Ollama sau bootstrap */
  private readonly OLLAMA_HEALTH_MAX_RETRY = 40;

  constructor(
    private readonly prisma: PrismaService,
    private readonly certificateService: CertificateEnrollmentService,
  ) {}

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  onApplicationBootstrap(): void {
    // Chạy hoàn toàn bất đồng bộ — không block bootstrap
    this.runPrefetch().catch((err: unknown) => {
      this.logger.error(
        'Prefetch toàn cục thất bại không mong đợi.',
        err instanceof Error ? err.stack : String(err),
      );
    });
  }

  // ─── Core prefetch logic ──────────────────────────────────────────────────

  private async runPrefetch(): Promise<void> {
    this.logger.log(
      'Prefetch bị vô hiệu hóa vì đề thi không cần giải thích nữa.',
    );
    return;
  }

  // ─── Prefetch 1 item với retry ────────────────────────────────────────────

  private async prefetchWithRetry(
    item: {
      id: number;
      updated_at: Date;
      stem: string;
      reading_passage: string | null;
      explanation: string | null;
      options: Array<{
        option_key: string;
        option_text: string;
        is_correct: boolean;
      }>;
    },
    slug: string,
  ): Promise<'cached' | 'generated' | 'failed'> {
    for (let attempt = 1; attempt <= this.MAX_RETRY; attempt++) {
      try {
        // prefetchItemExplanation trả về void, không throw nếu đã có cache
        const before = Date.now();
        await this.certificateService.prefetchItemExplanation(item, slug);
        const elapsed = Date.now() - before;

        // Nếu xong rất nhanh (<50ms) → có thể đã hit cache
        if (elapsed < 50) {
          return 'cached';
        }
        return 'generated';
      } catch (err: unknown) {
        const isLastAttempt = attempt === this.MAX_RETRY;
        if (isLastAttempt) {
          this.logger.warn(
            `Prefetch thất bại item #${item.id} (${slug}) sau ${this.MAX_RETRY} lần thử: ` +
              (err instanceof Error ? err.message : String(err)),
          );
          return 'failed';
        }
        // Chờ trước khi retry
        await this.sleep(2_000 * attempt);
      }
    }
    return 'failed';
  }

  // ─── Health check Ollama ──────────────────────────────────────────────────

  private async checkOllamaHealth(): Promise<boolean> {
    try {
      const baseUrl =
        process.env.OLLAMA_BASE_URL?.trim() ||
        'http://127.0.0.1:11434/api/generate';

      // Gọi đến root của Ollama server (bỏ /api/generate)
      const ollamaRoot = baseUrl.replace(/\/api\/generate\/?$/, '');
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5_000);

      const res = await fetch(ollamaRoot, {
        method: 'GET',
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));

      return res.ok || res.status < 500;
    } catch {
      return false;
    }
  }

  // ─── Utility ──────────────────────────────────────────────────────────────

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
