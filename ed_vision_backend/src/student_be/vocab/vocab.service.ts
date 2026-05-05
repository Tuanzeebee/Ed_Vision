import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class VocabService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Lấy danh sách chủ đề + tiến độ user ─────────────────────────────────
  async getTopics(enrollmentId: number, certType = 'toeic') {
    const topics = await this.prisma.vocabTopic.findMany({
      where: { is_active: true, cert_type: certType },
      orderBy: { sort_order: 'asc' },
      include: {
        words: {
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

    const skip = (page - 1) * limit;
    const [total, words] = await Promise.all([
      this.prisma.vocabWord.count({ where: { topic_id: topicId } }),
      this.prisma.vocabWord.findMany({
        where: { topic_id: topicId },
        skip,
        take: limit,
        orderBy: [{ freq: 'desc' }, { word: 'asc' }],
        include: {
          definitions: { orderBy: { sort_order: 'asc' } },
        },
      }),
    ]);

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
        level: w.level,
        freq: w.freq,
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
      where: { enrollment_id_word_id: { enrollment_id: enrollmentId, word_id: wordId } },
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

    return rows.map((r) => ({
      id: r.word.id,
      word: r.word.word,
      level: r.word.level,
      freq: r.word.freq,
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
  async getVocabStats(enrollmentId: number) {
    const [totalWords, knownWords, topics] = await Promise.all([
      this.prisma.vocabWord.count(),
      this.prisma.userVocabProgress.count({
        where: { enrollment_id: enrollmentId, is_known: true },
      }),
      this.prisma.vocabTopic.count({ where: { is_active: true } }),
    ]);

    // Từ "rất hay ra" (freq=3) chưa học
    const highFreqKnown = await this.prisma.userVocabProgress.count({
      where: {
        enrollment_id: enrollmentId,
        is_known: true,
        word: { freq: 3 },
      },
    });

    return { totalWords, knownWords, topics, highFreqKnown };
  }
}
