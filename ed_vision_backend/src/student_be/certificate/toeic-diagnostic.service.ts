import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { IsObject, IsArray, IsNumber } from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';
import { encryptString, tryDecryptString } from '../../common/crypto.util';

export class GenerateDiagnosticDto {
  target_score!: number;
}

export class SubmitDiagnosticDto {
  @IsObject()
  answers!: Record<string, string>; // questionId -> optionKey

  @IsArray()
  @IsNumber({}, { each: true })
  question_ids!: number[];
}

@Injectable()
export class ToeicDiagnosticService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Phân bổ số câu hỏi Listening/Reading dựa trên Target Score
   */
  private getQuestionDistribution(targetScore: number): { l: number; r: number } {
    if (targetScore <= 100) return { l: 8, r: 7 };
    if (targetScore <= 200) return { l: 11, r: 9 };
    if (targetScore <= 300) return { l: 13, r: 12 };
    if (targetScore <= 400) return { l: 16, r: 14 };
    return { l: 21, r: 19 }; // 500+
  }

  /**
   * Trộn mảng ngẫu nhiên
   */
  private shuffle<T>(arr: T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  async generateDiagnosticTest(targetScore: number) {
    if (targetScore < 0 || targetScore > 990) {
      throw new BadRequestException('Target score không hợp lệ.');
    }

    const dist = this.getQuestionDistribution(targetScore);
    
    // Tìm các câu hỏi thỏa mãn mốc điểm.
    // Vì Diagnostic test được chấm score_band (vd: 0-150, 150-300, 300-450, 450-500)
    // Ta lấy các câu nằm trong khoảng bao gồm targetScore.
    
    const listeningQuestions = await this.prisma.diagnosticRepositoryItem.findMany({
      where: {
        skill_area: 'listening',
        score_band_min: { lte: targetScore },
        score_band_max: { gte: targetScore },
      },
      include: {
        options: { orderBy: { sort_order: 'asc' } },
      },
    });

    const readingQuestions = await this.prisma.diagnosticRepositoryItem.findMany({
      where: {
        skill_area: 'reading',
        score_band_min: { lte: targetScore },
        score_band_max: { gte: targetScore },
      },
      include: {
        options: { orderBy: { sort_order: 'asc' } },
      },
    });

    let selectedListening = this.shuffle(listeningQuestions).slice(0, dist.l);
    let selectedReading = this.shuffle(readingQuestions).slice(0, dist.r);

    // Fallback nếu kho không đủ câu trong đúng band điểm đó (lấy thêm câu ở band khác)
    if (selectedListening.length < dist.l) {
      const fallbackListening = await this.prisma.diagnosticRepositoryItem.findMany({
        where: { skill_area: 'listening' },
        include: { options: { orderBy: { sort_order: 'asc' } } },
      });
      const additional = this.shuffle(fallbackListening.filter(q => !selectedListening.find(s => s.id === q.id))).slice(0, dist.l - selectedListening.length);
      selectedListening = [...selectedListening, ...additional];
    }

    if (selectedReading.length < dist.r) {
      const fallbackReading = await this.prisma.diagnosticRepositoryItem.findMany({
        where: { skill_area: 'reading' },
        include: { options: { orderBy: { sort_order: 'asc' } } },
      });
      const additional = this.shuffle(fallbackReading.filter(q => !selectedReading.find(s => s.id === q.id))).slice(0, dist.r - selectedReading.length);
      selectedReading = [...selectedReading, ...additional];
    }

    if (selectedListening.length < dist.l || selectedReading.length < dist.r) {
      throw new BadRequestException(`Hệ thống chưa đủ dữ liệu khảo sát cho mốc điểm này. Yêu cầu ít nhất ${dist.l} câu Listening và ${dist.r} câu Reading, nhưng hiện tại chỉ có ${selectedListening.length} câu Listening và ${selectedReading.length} câu Reading.`);
    }

    const combined = [...selectedListening, ...selectedReading]
      .sort((a, b) => {
        // Sort by part number first, then by item_order within each part
        const partA = a.part ?? 99;
        const partB = b.part ?? 99;
        if (partA !== partB) return partA - partB;
        return (a.item_order ?? 0) - (b.item_order ?? 0);
      });

    // For Part 3/4, each group of 3 questions shares 1 audio file.
    // Audio is only stored on the first question of each group.
    // Propagate audio/image from group leader to the other 2 questions.
    for (let i = 0; i < combined.length; i++) {
      const q = combined[i];
      if ((q.part === 3 || q.part === 4) && !q.media_audio_url) {
        // Look backwards for the nearest question in the same part that has audio
        for (let j = i - 1; j >= 0; j--) {
          const prev = combined[j];
          if (prev.part !== q.part) break;
          if (prev.media_audio_url) {
            q.media_audio_url = prev.media_audio_url;
            // Also propagate image if this question doesn't have one
            if (!q.media_image_url && prev.media_image_url) {
              q.media_image_url = prev.media_image_url;
            }
            break;
          }
        }
      }
    }

    return combined.map(q => ({
      id: q.id,
      item_order: q.item_order,
      part: q.part,
      skill_area: q.skill_area,
      stem: q.stem, 
      reading_passage: q.reading_passage,
      media_audio_url: q.media_audio_url,
      media_image_url: q.media_image_url,
      options: q.options.map(o => ({
        id: o.id,
        option_key: o.option_key,
        option_text: o.option_text,
      })),
    }));
  }

  async submitDiagnosticTest(dto: SubmitDiagnosticDto) {
    const questions = await this.prisma.diagnosticRepositoryItem.findMany({
      where: { id: { in: dto.question_ids } },
      include: { options: true },
    });

    let correctCount = 0;
    const totalQuestions = dto.question_ids.length;

    for (const q of questions) {
      const correctOption = q.options.find(o => o.is_correct);
      const chosenKey = dto.answers[String(q.id)];
      if (chosenKey && correctOption && chosenKey.toUpperCase() === correctOption.option_key.toUpperCase()) {
        correctCount++;
      }
    }

    // Chấm điểm cơ bản: (Số câu đúng / Tổng câu) * 500 (Giới hạn tối đa 500 điểm)
    // Thuật toán có thể phức tạp hơn nhưng tạm thời map tỷ lệ:
    const percentage = correctCount / (totalQuestions || 1);
    const estimatedScore = Math.round(percentage * 500 / 5) * 5; // Làm tròn bội số 5

    return {
      correct_count: correctCount,
      total_questions: totalQuestions,
      estimated_score: Math.min(estimatedScore, 500),
    };
  }
}
