import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class VocabService {
  private readonly logger = new Logger(VocabService.name);
  private readonly GROQ_API_URL =
    'https://api.groq.com/openai/v1/chat/completions';
  private readonly GROQ_MODEL = 'llama-3.1-8b-instant';
  private readonly reviewedWordIds = new Set<number>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private isBlank(value: string | null | undefined): boolean {
    return !value || value.trim().length === 0;
  }

  private exampleIncludesWord(example: string, word: string): boolean {
    const trimmedWord = word.trim();
    if (!trimmedWord) return false;
    const escaped = trimmedWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`(^|[^A-Za-z])${escaped}([^A-Za-z]|$)`, 'i');
    return pattern.test(example);
  }

  private getMeaningReviewKey(wordId: number): string {
    return `vocab:meaning_reviewed:v2:${wordId}`;
  }

  private async hasMeaningReview(wordId: number): Promise<boolean> {
    if (this.reviewedWordIds.has(wordId)) return true;

    const cached = await this.redis.getJson<{ reviewedAt?: string }>(
      this.getMeaningReviewKey(wordId),
    );
    if (cached) {
      this.reviewedWordIds.add(wordId);
      return true;
    }
    return false;
  }

  private async markMeaningReviewed(wordId: number) {
    this.reviewedWordIds.add(wordId);
    await this.redis.setJson(this.getMeaningReviewKey(wordId), {
      reviewedAt: new Date().toISOString(),
    });
  }

  private async fillExamplesForWord(
    word: {
      id: number;
      word: string;
      topic_id: number;
      definitions: Array<{
        id: number;
        pos: string;
        meaning: string;
        example_en: string | null;
        example_vi: string | null;
      }>;
    },
    reviewMeaning: boolean,
  ) {
    const needsExamples = word.definitions.some(
      (d) => this.isBlank(d.example_en) || this.isBlank(d.example_vi),
    );
    if (!needsExamples && !reviewMeaning) return;

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return;

    const prompt = reviewMeaning
      ? `You are a TOEIC/IELTS vocabulary assistant. For the word "${word.word}", review each definition. If the POS or meaning is wrong, OCR-noisy, or too literal, correct it to a professional TOEIC/IELTS-appropriate meaning. If it is already correct, keep it unchanged. If the word itself is misspelled, correct it. Then create one natural TOEIC/IELTS-style English example sentence and a Vietnamese translation for each definition.

Return ONLY valid JSON (no markdown, no explanation):
{
  "word": "<corrected word, or original if already correct>",
  "definitions": [
    {
      "pos": "<POS>",
      "meaning": "<Vietnamese meaning>",
      "example_en": "<English example sentence>",
      "example_vi": "<Vietnamese translation>"
    }
  ]
}

Definitions:
${word.definitions
  .map(
    (d, i) =>
      `${i + 1}. (${d.pos}) ${d.meaning}`,
  )
  .join('\n')}`
      : `You are a TOEIC vocabulary assistant. For the word "${word.word}", do NOT change the word, POS, or meaning. Only create one natural English example sentence and a Vietnamese translation for each definition.

Return ONLY valid JSON (no markdown, no explanation):
{
  "word": "${word.word}",
  "definitions": [
    {
      "pos": "<POS>",
      "meaning": "<Vietnamese meaning>",
      "example_en": "<English example sentence>",
      "example_vi": "<Vietnamese translation>"
    }
  ]
}

Definitions:
${word.definitions
  .map(
    (d, i) =>
      `${i + 1}. (${d.pos}) ${d.meaning}`,
  )
  .join('\n')}`;

    try {
      const res = await fetch(this.GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.GROQ_MODEL,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
          response_format: { type: 'json_object' },
        }),
      });

      if (!res.ok) {
        throw new Error(`Groq API Error: ${res.statusText}`);
      }

      const data = (await res.json()) as any;
      const rawContent = data.choices?.[0]?.message?.content;
      if (!rawContent) return;

      const parsed = JSON.parse(rawContent) as {
        word?: string;
        definitions?: Array<{
          pos?: string;
          meaning?: string;
          example_en?: string;
          example_vi?: string;
        }>;
      };

      const definitions = Array.isArray(parsed.definitions)
        ? parsed.definitions
        : [];

      const nextWordRaw = (parsed.word ?? '').trim();
      const nextWord = nextWordRaw.toLowerCase();

      let wordChanged = false;
      const wordUpdateData: { word?: string } = {};

      if (reviewMeaning && nextWord && nextWord !== word.word.toLowerCase()) {
        const existing = await this.prisma.vocabWord.findFirst({
          where: {
            topic_id: word.topic_id,
            word: { equals: nextWord, mode: 'insensitive' },
          },
          select: { id: true },
        });

        if (!existing || existing.id === word.id) {
          wordUpdateData.word = nextWord;
          wordChanged = true;
        }
      }

      if (reviewMeaning && Object.keys(wordUpdateData).length > 0) {
        await this.prisma.vocabWord.update({
          where: { id: word.id },
          data: wordUpdateData,
        });
        if (wordUpdateData.word) word.word = wordUpdateData.word;
      }

      let canMarkReviewed = definitions.length === word.definitions.length;

      for (let i = 0; i < word.definitions.length; i += 1) {
        const def = word.definitions[i];
        const next = definitions[i];
        if (!next) continue;

        const nextPos = (next.pos ?? '').trim();
        const nextMeaning = (next.meaning ?? '').trim();

        const nextExampleEn = next.example_en ?? '';
        const nextExampleVi = next.example_vi ?? '';
        const exampleMatches = this.isBlank(nextExampleEn)
          ? true
          : this.exampleIncludesWord(nextExampleEn, word.word);
        if (!exampleMatches) {
          canMarkReviewed = false;
        }

        const updateData: {
          pos?: string;
          meaning?: string;
          example_en?: string;
          example_vi?: string;
        } = {};

        let meaningChanged = false;
        let posChanged = false;
        if (reviewMeaning && !this.isBlank(nextPos) && nextPos !== def.pos) {
          updateData.pos = nextPos;
          posChanged = true;
        }
        if (
          reviewMeaning &&
          !this.isBlank(nextMeaning) &&
          nextMeaning !== def.meaning
        ) {
          updateData.meaning = nextMeaning;
          meaningChanged = true;
        }
        const shouldRefreshExamples =
          reviewMeaning && (meaningChanged || posChanged || wordChanged);
        if (
          (this.isBlank(def.example_en) || shouldRefreshExamples) &&
          !this.isBlank(nextExampleEn) &&
          exampleMatches
        ) {
          updateData.example_en = nextExampleEn;
        }
        if (
          (this.isBlank(def.example_vi) || shouldRefreshExamples) &&
          !this.isBlank(nextExampleVi) &&
          exampleMatches
        ) {
          updateData.example_vi = nextExampleVi;
        }

        if (Object.keys(updateData).length === 0) continue;

        await this.prisma.vocabDefinition.update({
          where: { id: def.id },
          data: updateData,
        });

        if (updateData.pos) def.pos = updateData.pos;
        if (updateData.meaning) def.meaning = updateData.meaning;
        if (updateData.example_en) def.example_en = updateData.example_en;
        if (updateData.example_vi) def.example_vi = updateData.example_vi;
      }

      if (reviewMeaning && canMarkReviewed) {
        await this.markMeaningReviewed(word.id);
      }
    } catch (error) {
      this.logger.warn(
        `Failed to generate examples for word "${word.word}": ${String(error)}`,
      );
    }
  }

  private async fillExamplesForWords(words: Array<{
    id: number;
    word: string;
    topic_id: number;
    definitions: Array<{
      id: number;
      pos: string;
      meaning: string;
      example_en: string | null;
      example_vi: string | null;
    }>;
  }>) {
    const candidates: Array<{ word: (typeof words)[number]; review: boolean }> = [];

    for (const w of words) {
      const needsExamples = w.definitions.some(
        (d) => this.isBlank(d.example_en) || this.isBlank(d.example_vi),
      );
      const wasReviewed = await this.hasMeaningReview(w.id);
      const review = !wasReviewed;

      if (needsExamples || review) {
        candidates.push({ word: w, review });
      }
    }

    for (const { word, review } of candidates.slice(0, 5)) {
      await this.fillExamplesForWord(word, review);
    }
  }

  // ── Lấy danh sách chủ đề + tiến độ user ─────────────────────────────────
  async getTopics(enrollmentId: number, certType = 'toeic') {
    const wordFilter = {
      OR: [
        { source: { not: 'user_highlight' } },
        { source: null },
        { progress: { some: { enrollment_id: enrollmentId } } },
      ],
    };

    const topics = await this.prisma.vocabTopic.findMany({
      where: { is_active: true, cert_type: certType },
      orderBy: { sort_order: 'asc' },
      include: {
        words: {
          where: wordFilter,
          select: { id: true },
        },
      },
    });

    // Lấy tiến độ của user cho tất cả topics
    const progressRows = await this.prisma.userVocabProgress.findMany({
      where: {
        enrollment_id: enrollmentId,
        is_known: true,
        word: {
          topic: { cert_type: certType },
        },
      },
      select: { word_id: true, word: { select: { topic_id: true } } },
    });

    const knownByTopic = new Map<number, number>();
    for (const row of progressRows) {
      const tid = row.word.topic_id;
      knownByTopic.set(tid, (knownByTopic.get(tid) ?? 0) + 1);
    }

    return topics.map((t) => {
      const total = t.words.length;
      const known = knownByTopic.get(t.id) ?? 0;
      return {
        id: t.id,
        slug: t.slug,
        titleVI: t.title_vi,
        titleEN: t.title_en,
        emoji: t.emoji,
        certType: t.cert_type,
        wordCount: total,
        knownCount: known,
        progress: total > 0 ? Math.round((known / total) * 100) : 0,
      };
    });
  }

  // ── Lấy danh sách từ trong chủ đề (paginated + kèm tiến độ user) ─────────
  async getWordsByTopic(
    enrollmentId: number,
    topicId: number,
    page = 1,
    limit = 10,
  ) {
    const topic = await this.prisma.vocabTopic.findUnique({
      where: { id: topicId },
    });
    if (!topic) throw new NotFoundException('Không tìm thấy chủ đề từ vựng.');

    const wordFilter = {
      topic_id: topicId,
      OR: [
        { source: { not: 'user_highlight' } },
        { source: null },
        { progress: { some: { enrollment_id: enrollmentId } } },
      ],
    };

    const skip = (page - 1) * limit;
    const [total, words] = await Promise.all([
      this.prisma.vocabWord.count({ where: wordFilter }),
      this.prisma.vocabWord.findMany({
        where: wordFilter,
        skip,
        take: limit,
        orderBy: [{ freq: 'desc' }, { word: 'asc' }],
        include: {
          definitions: { orderBy: { sort_order: 'asc' } },
        },
      }),
    ]);

    await this.fillExamplesForWords(words);

    // Lấy progress của enrollment này cho các từ trên trang
    const wordIds = words.map((w) => w.id);
    const progressRows = await this.prisma.userVocabProgress.findMany({
      where: { enrollment_id: enrollmentId, word_id: { in: wordIds } },
      select: { word_id: true, is_known: true, correct_streak: true },
    });
    const progressMap = new Map(progressRows.map((r) => [r.word_id, r]));

    const data = words.map((w) => {
      const prog = progressMap.get(w.id);
      return {
        id: w.id,
        word: w.word,
        audioUrl: w.audio_url,
        isKnown: prog?.is_known ?? false,
        correctStreak: prog?.correct_streak ?? 0,
        definitions: w.definitions.map((d) => ({
          id: d.id,
          pos: d.pos,
          meaning: d.meaning,
          exampleEn: d.example_en,
          exampleVi: d.example_vi,
        })),
      };
    });

    return {
      topic: {
        id: topic.id,
        titleVI: topic.title_vi,
        titleEN: topic.title_en,
        emoji: topic.emoji,
      },
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ── Toggle đã thuộc / chưa thuộc ─────────────────────────────────────────
  async toggleKnown(enrollmentId: number, wordId: number, isKnown: boolean) {
    const word = await this.prisma.vocabWord.findUnique({
      where: { id: wordId },
    });
    if (!word) throw new NotFoundException('Không tìm thấy từ vựng.');

    const updated = await this.prisma.userVocabProgress.upsert({
      where: {
        enrollment_id_word_id: { enrollment_id: enrollmentId, word_id: wordId },
      },
      create: {
        enrollment_id: enrollmentId,
        word_id: wordId,
        is_known: isKnown,
        reviewed_at: isKnown ? new Date() : null,
      },
      update: {
        is_known: isKnown,
        reviewed_at: isKnown ? new Date() : undefined,
      },
    });
    return { wordId, isKnown: updated.is_known };
  }

  // ── Lấy danh sách từ đã thuộc (dùng cho bộ test) ─────────────────────────
  async getKnownWords(enrollmentId: number, topicId?: number) {
    const rows = await this.prisma.userVocabProgress.findMany({
      where: {
        enrollment_id: enrollmentId,
        is_known: true,
        ...(topicId ? { word: { topic_id: topicId } } : {}),
      },
      include: {
        word: {
          include: { definitions: { orderBy: { sort_order: 'asc' } } },
        },
      },
      orderBy: { correct_streak: 'asc' }, // ưu tiên từ ít đúng hơn
    });

    await this.fillExamplesForWords(rows.map((r) => r.word));

    return rows.map((r) => ({
      id: r.word.id,
      word: r.word.word,
      correctStreak: r.correct_streak,
      totalAttempts: r.total_attempts,
      totalCorrect: r.total_correct,
      definitions: r.word.definitions.map((d) => ({
        pos: d.pos,
        meaning: d.meaning,
        exampleEn: d.example_en,
        exampleVi: d.example_vi,
      })),
    }));
  }

  // ── Thống kê tổng hợp vocab của enrollment ────────────────────────────────
  async getVocabStats(enrollmentId: number, certType = 'toeic') {
    const wordFilter = {
      topic: { cert_type: certType },
      OR: [
        { source: { not: 'user_highlight' } },
        { source: null },
        { progress: { some: { enrollment_id: enrollmentId } } },
      ],
    };

    const [totalWords, knownWords, topics] = await Promise.all([
      this.prisma.vocabWord.count({ where: wordFilter }),
      this.prisma.userVocabProgress.count({
        where: {
          enrollment_id: enrollmentId,
          is_known: true,
          word: { topic: { cert_type: certType } },
        },
      }),
      this.prisma.vocabTopic.count({
        where: { is_active: true, cert_type: certType },
      }),
    ]);

    return { totalWords, knownWords, topics };
  }
}
