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
      `Bắt đầu chờ ${this.PREFETCH_DELAY_MS / 1000}s trước khi prefetch chứng chỉ explanations…`,
    );
    await this.sleep(this.PREFETCH_DELAY_MS);

    // ── Kiểm tra Ollama có phản hồi không trước khi bắt đầu ──────────────
    let ollamaAlive = await this.checkOllamaHealth();
    let retryCount = 0;
    while (!ollamaAlive && retryCount < this.OLLAMA_HEALTH_MAX_RETRY) {
      retryCount += 1;
      this.logger.warn(
        `Ollama chưa sẵn sàng (attempt ${retryCount}/${this.OLLAMA_HEALTH_MAX_RETRY}). ` +
          `Chờ ${this.OLLAMA_HEALTH_RETRY_MS / 1000}s để kiểm tra lại...`,
      );
      await this.sleep(this.OLLAMA_HEALTH_RETRY_MS);
      ollamaAlive = await this.checkOllamaHealth();
    }

    if (!ollamaAlive) {
      this.logger.warn(
        'Ollama không phản hồi — bỏ qua prefetch. ' +
          'Giải thích sẽ được sinh on-demand khi user yêu cầu.',
      );
      return;
    }

    // ── Lấy tất cả repo TOEIC đã publish ────────────────────────────────
    let repositories: Array<{
      id: number;
      slug: string;
      items: Array<{
        id: number;
        updated_at: Date;
        stem: string;
        reading_passage: string | null;
        explanation: string | null;
        ai_explanation: string | null;
        options: Array<{
          option_key: string;
          option_text: string;
          is_correct: boolean;
        }>;
      }>;
    }>;

    try {
      repositories = await this.prisma.learningRepository.findMany({
        where: { cert_type: 'toeic', is_published: true },
        orderBy: { id: 'asc' },
        include: {
          items: {
            orderBy: { item_order: 'asc' },
            select: {
              id: true,
              updated_at: true,
              stem: true,
              reading_passage: true,
              explanation: true,
              ai_explanation: true,
              options: {
                orderBy: { sort_order: 'asc' },
                select: {
                  option_key: true,
                  option_text: true,
                  is_correct: true,
                },
              },
            },
          },
        },
      });
    } catch (err: unknown) {
      this.logger.error(
        'Không thể truy vấn danh sách chứng chỉ repository để prefetch.',
        err instanceof Error ? err.stack : String(err),
      );
      return;
    }

    // ── Tổng hợp danh sách item cần prefetch ────────────────────────────
    const tasks: Array<{
      item: (typeof repositories)[number]['items'][number];
      slug: string;
      repoId: number;
    }> = repositories.flatMap((repo) =>
      repo.items.map((item) => ({
        item,
        slug: repo.slug,
        repoId: repo.id,
      })),
    );

    const filteredTasks = tasks.filter(({ item }) => {
      return !(item.ai_explanation && item.ai_explanation.trim().length > 20);
    });

    const limitedTasks =
      this.MAX_ITEMS_PER_RUN > 0
        ? filteredTasks.slice(0, this.MAX_ITEMS_PER_RUN)
        : filteredTasks;

    if (limitedTasks.length === 0) {
      this.logger.log('Không có câu hỏi chứng chỉ nào để prefetch.');
      return;
    }

    this.logger.log(
      `Bắt đầu prefetch ${limitedTasks.length}/${filteredTasks.length} câu hỏi TOEIC từ ${repositories.length} bộ đề…`,
    );

    let cached = 0;
    let generated = 0;
    let failed = 0;
    let skipped = 0; // câu hỏi không có đáp án đúng

    for (let i = 0; i < limitedTasks.length; i += this.PREFETCH_BATCH_SIZE) {
      const batch = limitedTasks.slice(i, i + this.PREFETCH_BATCH_SIZE);

      const results = await Promise.all(
        batch.map(async ({ item, slug }) => {
          // Câu hỏi không có đáp án đúng — bỏ qua
          if (!item.options.some((o) => o.is_correct)) {
            return 'skipped' as const;
          }
          return this.prefetchWithRetry(item, slug);
        }),
      );

      for (const result of results) {
        switch (result) {
          case 'cached':
            cached += 1;
            break;
          case 'generated':
            generated += 1;
            break;
          case 'failed':
            failed += 1;
            break;
          case 'skipped':
            skipped += 1;
            break;
        }
      }

      if (i + this.PREFETCH_BATCH_SIZE < limitedTasks.length) {
        await this.sleep(this.INTER_BATCH_DELAY_MS);
      }

      // Log tiến độ mỗi 10 item hoặc khi kết thúc
      const done = Math.min(i + this.PREFETCH_BATCH_SIZE, limitedTasks.length);
      if (done % 10 === 0 || done === limitedTasks.length) {
        this.logger.log(
          `Prefetch tiến độ: ${done}/${limitedTasks.length} — ` +
            `cache=${cached}, sinh mới=${generated}, lỗi=${failed}, bỏ qua=${skipped}`,
        );
      }
    }

    this.logger.log(
      `✅ Prefetch hoàn thành: ` +
        `${generated} giải thích mới, ${cached} từ cache, ` +
        `${failed} lỗi, ${skipped} không hợp lệ.`,
    );
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
