import { Injectable, Logger } from '@nestjs/common';
import * as http from 'http';

// ── Ollama local embedding (nomic-embed-text) ─────────────────────────────────
// Hoàn toàn local, không cần API key, không rate limit.
// nomic-embed-text: 768 dims, ~274MB, chạy trên CPU bình thường.
// Pull: ollama pull nomic-embed-text
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'localhost';
const OLLAMA_PORT = parseInt(process.env.OLLAMA_PORT || '11434', 10);
const EMBEDDING_MODEL = process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text';
const EMBEDDING_DIMENSIONS = 768;
const BATCH_SIZE = 8; // Nhỏ để mỗi batch xong trong 30s dù CPU bận (ví dụ khi qwen3 đang chạy)

@Injectable()
export class RagEmbeddingService {
  private readonly logger = new Logger(RagEmbeddingService.name);

  // ── Internal: gọi Ollama /api/embed ─────────────────────────────────────────
  private ollamaEmbed(inputs: string[]): Promise<number[][]> {
    return new Promise((resolve, reject) => {
      const body = Buffer.from(
        JSON.stringify({ model: EMBEDDING_MODEL, input: inputs }),
        'utf-8',
      );
      const req = http.request(
        {
          hostname: OLLAMA_HOST,
          port: OLLAMA_PORT,
          path: '/api/embed',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': body.length,
          },
        },
        (res) => {
          let raw = '';
          res.on('data', (chunk: Buffer) => (raw += chunk.toString()));
          res.on('end', () => {
            try {
              const json = JSON.parse(raw) as {
                embeddings?: number[][];
                error?: string;
              };
              if (json.error) {
                reject(new Error(`Ollama error: ${json.error}`));
              } else if (!json.embeddings || json.embeddings.length === 0) {
                reject(new Error('Ollama returned empty embeddings'));
              } else {
                resolve(json.embeddings);
              }
            } catch (e) {
              reject(
                new Error(
                  `Failed to parse Ollama response: ${raw.slice(0, 200)}`,
                ),
              );
            }
          });
        },
      );
      req.on('error', (e: Error) =>
        reject(new Error(`Ollama request failed: ${e.message}`)),
      );
      req.setTimeout(120_000, () => {
        req.destroy();
        reject(
          new Error(
            `Ollama embed timeout (120s) — is Ollama running at ${OLLAMA_HOST}:${OLLAMA_PORT}?`,
          ),
        );
      });
      req.write(body);
      req.end();
    });
  }

  // ── Public: embed một text đơn ───────────────────────────────────────────────
  async embedText(text: string): Promise<number[]> {
    try {
      const results = await this.ollamaEmbed([text.slice(0, 8192)]);
      return results[0];
    } catch (error) {
      this.logger.error(`embedText failed: ${(error as Error).message}`);
      return new Array(EMBEDDING_DIMENSIONS).fill(0);
    }
  }

  // ── Public: embed batch nhiều texts ─────────────────────────────────────────
  async embedBatch(texts: string[]): Promise<number[][]> {
    const results: number[][] = [];
    const totalBatches = Math.ceil(texts.length / BATCH_SIZE);

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const batch = texts.slice(i, i + BATCH_SIZE).map((t) => t.slice(0, 8192));

      try {
        const embeddings = await this.ollamaEmbed(batch);
        results.push(...embeddings);
        this.logger.debug(
          `embedBatch [${batchNum}/${totalBatches}]: ${batch.length} chunks → OK`,
        );
      } catch (error) {
        this.logger.error(
          `embedBatch [${batchNum}/${totalBatches}] failed: ${(error as Error).message} — using zero vectors`,
        );
        for (let j = 0; j < batch.length; j++) {
          results.push(new Array(EMBEDDING_DIMENSIONS).fill(0));
        }
      }
    }

    this.logger.log(
      `embedBatch complete: ${texts.length} texts → ${results.length} embeddings (${totalBatches} batches)`,
    );
    return results;
  }

  // ── Cosine similarity (dùng cho fallback nếu cần) ───────────────────────────
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    let dot = 0,
      normA = 0,
      normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
  }
}
