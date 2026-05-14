import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StartTestSessionDto, SubmitAnswerDto } from './dto/vocab.dto';

// Qwen3 endpoint — reuse existing pattern from certificate-prompts
const QWEN_URL = process.env.QWEN_BASE_URL ?? 'http://localhost:11434';
const QWEN_MODEL = process.env.QWEN_MODEL ?? 'qwen3';

async function callQwen(prompt: string): Promise<string> {
  try {
    const res = await fetch(`${QWEN_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: QWEN_MODEL, prompt, stream: false }),
    });
    const json = (await res.json()) as { response?: string };
    return (json.response ?? '').trim();
  } catch {
    return '';
  }
}

@Injectable()
export class VocabTestService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Bắt đầu phiên kiểm tra ────────────────────────────────────────────────
  async startSession(enrollmentId: number, dto: StartTestSessionDto) {
    const limit = dto.limit ?? 20;

    // Lấy từ đã thuộc, ưu tiên correct_streak thấp nhất
    const progressRows = await this.prisma.userVocabProgress.findMany({
      where: {
        enrollment_id: enrollmentId,
        is_known: true,
        ...(dto.topic_id ? { word: { topic_id: dto.topic_id } } : {}),
      },
      orderBy: { correct_streak: 'asc' },
      take: limit,
      include: {
        word: {
          include: { definitions: { orderBy: { sort_order: 'asc' } } },
        },
      },
    });

    if (progressRows.length === 0) {
      return {
        session_id: null,
        message:
          'Chưa có từ vựng nào được đánh dấu đã thuộc. Hãy học và đánh dấu trước!',
        words: [],
      };
    }

    const wordIds = progressRows.map((r) => r.word_id);

    // Tạo session record
    const session = await this.prisma.vocabTestSession.create({
      data: {
        enrollment_id: enrollmentId,
        mode: dto.mode,
        word_ids: wordIds,
      },
    });

    const words = progressRows.map((r) => ({
      id: r.word.id,
      word: r.word.word,
      level: r.word.level,
      freq: r.word.freq,
      correctStreak: r.correct_streak,
      definitions: r.word.definitions.map((d) => ({
        pos: d.pos,
        meaning: d.meaning,
        exampleEn: d.example_en,
        exampleVi: d.example_vi,
      })),
    }));

    return { session_id: session.id, mode: dto.mode, words };
  }

  // ── Nộp đáp án một từ ─────────────────────────────────────────────────────
  async submitAnswer(
    enrollmentId: number,
    sessionId: number,
    dto: SubmitAnswerDto,
  ) {
    const session = await this.prisma.vocabTestSession.findUnique({
      where: { id: sessionId },
    });
    if (!session || session.enrollment_id !== enrollmentId) {
      throw new NotFoundException('Không tìm thấy phiên kiểm tra.');
    }

    let isCorrect = dto.is_correct ?? false;
    let aiScore: number | null = null;
    let aiFeedback: string | null = null;

    // Chỉ chấm AI với mode=write
    if (session.mode === 'write' && dto.user_input) {
      const word = await this.prisma.vocabWord.findUnique({
        where: { id: dto.word_id },
        include: { definitions: { orderBy: { sort_order: 'asc' }, take: 1 } },
      });

      if (word && word.definitions.length > 0) {
        const correctMeaning = word.definitions
          .map((d) => d.meaning)
          .join(', ');
        const prompt = `Bạn là giáo viên TOEIC. Từ tiếng Anh "${word.word}" có nghĩa là "${correctMeaning}". Học sinh trả lời: "${dto.user_input}". Hãy chấm điểm từ 0.0 đến 1.0 (1.0 = hoàn toàn đúng, 0.7+ = chấp nhận được, <0.7 = cần học lại) và đưa ra nhận xét ngắn bằng tiếng Việt (tối đa 1 câu). Trả lời theo định dạng JSON: {"score": 0.85, "feedback": "Nhận xét ngắn"}`;

        const raw = await callQwen(prompt);
        try {
          // Extract JSON from response
          const match = raw.match(/\{[\s\S]*\}/);
          if (match) {
            const parsed = JSON.parse(match[0]) as {
              score?: number;
              feedback?: string;
            };
            aiScore = parsed.score ?? null;
            aiFeedback = parsed.feedback ?? null;
            isCorrect = (aiScore ?? 0) >= 0.7;
          }
        } catch {
          // Fallback: simple substring match
          const userLower = dto.user_input.toLowerCase().trim();
          const correctLower = correctMeaning.toLowerCase();
          isCorrect =
            correctLower.includes(userLower) ||
            userLower.includes(correctLower.split(',')[0].trim());
          aiScore = isCorrect ? 0.8 : 0.3;
          aiFeedback = isCorrect
            ? 'Đúng rồi!'
            : `Đáp án đúng là: ${correctMeaning}`;
        }
      }
    }

    // Lưu đáp án
    await this.prisma.vocabTestAnswer.create({
      data: {
        session_id: sessionId,
        word_id: dto.word_id,
        user_input: dto.user_input ?? null,
        is_correct: isCorrect,
        ai_score: aiScore,
        ai_feedback: aiFeedback,
      },
    });

    // Cập nhật UserVocabProgress
    const progress = await this.prisma.userVocabProgress.findUnique({
      where: {
        enrollment_id_word_id: {
          enrollment_id: enrollmentId,
          word_id: dto.word_id,
        },
      },
    });

    if (progress) {
      await this.prisma.userVocabProgress.update({
        where: { id: progress.id },
        data: {
          total_attempts: { increment: 1 },
          total_correct: isCorrect ? { increment: 1 } : undefined,
          correct_streak: isCorrect ? { increment: 1 } : 0,
          reviewed_at: new Date(),
        },
      });
    }

    return { wordId: dto.word_id, isCorrect, aiScore, aiFeedback };
  }

  // ── Kết thúc phiên, tính điểm tổng ───────────────────────────────────────
  async finishSession(enrollmentId: number, sessionId: number) {
    const session = await this.prisma.vocabTestSession.findUnique({
      where: { id: sessionId },
      include: { answers: true },
    });
    if (!session || session.enrollment_id !== enrollmentId) {
      throw new NotFoundException('Không tìm thấy phiên kiểm tra.');
    }

    const total = session.answers.length;
    const correct = session.answers.filter((a) => a.is_correct).length;
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;

    await this.prisma.vocabTestSession.update({
      where: { id: sessionId },
      data: { score, ended_at: new Date() },
    });

    return {
      sessionId,
      mode: session.mode,
      total,
      correct,
      score,
      answers: session.answers.map((a) => ({
        wordId: a.word_id,
        isCorrect: a.is_correct,
        aiScore: a.ai_score,
        aiFeedback: a.ai_feedback,
        userInput: a.user_input,
      })),
    };
  }

  // ── Lịch sử phiên test ────────────────────────────────────────────────────
  async getSessionHistory(enrollmentId: number) {
    const sessions = await this.prisma.vocabTestSession.findMany({
      where: { enrollment_id: enrollmentId, ended_at: { not: null } },
      orderBy: { started_at: 'desc' },
      take: 20,
      select: {
        id: true,
        mode: true,
        score: true,
        started_at: true,
        ended_at: true,
        word_ids: true,
      },
    });

    return sessions.map((s) => ({
      id: s.id,
      mode: s.mode,
      score: s.score,
      wordCount: Array.isArray(s.word_ids)
        ? (s.word_ids as number[]).length
        : 0,
      startedAt: s.started_at,
      endedAt: s.ended_at,
    }));
  }
}
