import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BandChange, Recommendation } from '../dto/ielts-adaptive.dto';

interface QuestionResult {
  questionId: string;
  isCorrect: boolean;
  timeTaken: number;
  expectedTime: number;
  errorSeverity?: number;
}

interface BandEstimationInput {
  roadmapId: number;
  currentBand: number;
  questionResults: QuestionResult[];
  skillBreakdown: Record<string, any>;
}

interface BandEstimationResult {
  estimatedBand: number;
  bandChange: BandChange;
  confidenceLevel: 'low' | 'medium' | 'high';
  recommendation: Recommendation;
  weakSkills: string[];
  metrics: {
    accuracy: number;
    responseTimeFactor: number;
    consistencyScore?: number;
    severeErrorCount: number;
    suspiciousFastAnswers: number;
    /** Danh sách cảnh báo hành vi bất thường (trả lời quá nhanh, v.v.) */
    warnings: string[];
  };
}

@Injectable()
export class BandEstimationService {
  private readonly logger = new Logger(BandEstimationService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Thuật toán chính ước tính band IELTS sau khi học sinh nộp bài Band Test.
   *
   * Luồng xử lý (9 bước):
   *   1. Tính accuracy = số câu đúng / tổng câu * 100.
   *   2. Tính responseTimeFactor = thời gian thực tế / thời gian kỳ vọng.
   *   3. Lấy consistencyScore từ 5 Band Test gần nhất (qua DB).
   *   4. Đếm số lỗi nghiêm trọng (errorSeverity >= 4).
   *   5. Phát hiện câu trả lời quá nhanh ngầm (< 30% thời gian cần).
   *   6. Xác định hướng thay đổi band: UP / DOWN / STABLE.
   *   7. Tính band mới (±0.1 hoặc giữ nguyên).
   *   8. Đánh giá độ tin cậy: low / medium / high.
   *   9. Tạo gợi ý học tập và danh sách kỹ năng yếu.
   */
  async estimateBand(
    input: BandEstimationInput,
  ): Promise<BandEstimationResult> {
    this.logger.log(
      `Estimating band for roadmap ${input.roadmapId}, current band: ${input.currentBand}`,
    );

    // Bước 1: Tính accuracy tổng quát
    const totalQuestions = input.questionResults.length;
    const correctAnswers = input.questionResults.filter((r) => r.isCorrect)
      .length;
    const accuracy = (correctAnswers / totalQuestions) * 100;

    // Bước 2: Tính tỷ lệ thời gian thực tế / kỳ vọng (càng gần 1.0 càng tốt)
    const responseTimeFactor = this.calculateResponseTimeFactor(
      input.questionResults,
    );

    // Bước 3: Độ ổn định (consistency) từ lịch sử 5 lần thi gần nhất
    const consistencyScore = await this.calculateConsistency(input.roadmapId);

    // Bước 4: Lỗi nghiêm trọng (severity >= 4) – ảnh hưởng mạnh đến việc tăng band
    const severeErrorCount = input.questionResults.filter(
      (r) => !r.isCorrect && (r.errorSeverity ?? 0) >= 4,
    ).length;

    // Bước 5: Câu trả lời quá nhanh bất thường (< 30% thời gian kỳ vọng)
    // Phân loại từng câu để tạo cảnh báo chi tiết
    const suspiciousFastList = input.questionResults.filter(
      (r) => r.timeTaken < r.expectedTime * 0.3,
    );
    const suspiciousFastAnswers = suspiciousFastList.length;

    // Tạo danh sách cảnh báo
    const warnings: string[] = [];
    if (suspiciousFastAnswers > 0) {
      const suspiciousCorrect = suspiciousFastList.filter((r) => r.isCorrect).length;
      const suspiciousWrong = suspiciousFastAnswers - suspiciousCorrect;
      warnings.push(
        `⚠️ ${suspiciousFastAnswers} câu trả lời quá nhanh (< 30% thời gian kỳ vọng): ` +
        `${suspiciousCorrect} đúng, ${suspiciousWrong} sai – có thể đoán mò.`,
      );
    }
    const suspiciousRatio = totalQuestions > 0 ? suspiciousFastAnswers / totalQuestions : 0;
    if (suspiciousRatio >= 0.2) {
      warnings.push(
        `🚨 Hơn ${Math.round(suspiciousRatio * 100)}% số câu làm quá nhanh – kết quả band không đáng tin cậy.`,
      );
    }

    // Bước 6: Quyết định hướng band thay đổi
    const bandChange = this.determineBandChange(
      accuracy,
      responseTimeFactor,
      consistencyScore,
      severeErrorCount,
      totalQuestions,
      input.roadmapId,
    );

    // Bước 7: Tính band mới (+0.1, -0.1 hoặc giữ nguyên)
    const estimatedBand = this.calculateNewBand(
      input.currentBand,
      bandChange,
      accuracy,
    );

    // Bước 8: Độ tin cậy của kết quả ước tính
    const confidenceLevel = this.determineConfidence(
      accuracy,
      responseTimeFactor,
      consistencyScore,
      suspiciousFastAnswers,
      totalQuestions,
    );

    // Bước 9: Gợi ý học tập và xác định kỹ năng cần cải thiện
    const { recommendation, weakSkills } = await this.generateRecommendation(
      bandChange,
      input.skillBreakdown,
      accuracy,
    );

    const result: BandEstimationResult = {
      estimatedBand,
      bandChange,
      confidenceLevel,
      recommendation,
      weakSkills,
      metrics: {
        accuracy,
        responseTimeFactor,
        consistencyScore,
        severeErrorCount,
        suspiciousFastAnswers,
        warnings,
      },
    };

    this.logger.log(
      `Band estimation complete: ${input.currentBand} -> ${estimatedBand} (${bandChange})`,
    );

    return result;
  }

  /**
   * Tính hệ số thời gian phản hồi (Response Time Factor) theo logic 5 tầng ratio.
   *
   * Với mỗi câu trả lời, tính ratio = timeTaken / expectedTime, rồi điều chỉnh factor:
   *
   *   ratio < 0.3  (quá nhanh bất thường)
   *     - đúng  → -0.02  (nghi ngờ đoán mò)
   *     - sai   → -0.12  (đoán mò và sai)
   *
   *   0.3 ≤ ratio < 0.6  (nhanh)
   *     - đúng  → +0.02  (nắm chắc kiến thức)
   *     - sai   → -0.06  (vội vàng)
   *
   *   0.6 ≤ ratio ≤ 1.2  (bình thường)
   *     - đúng  → +0.01
   *     - sai   → -0.02
   *
   *   1.2 < ratio ≤ 1.5  (hơi chậm)
   *     - đúng  → -0.01
   *     - sai   → -0.04
   *
   *   ratio > 1.5  (quá chậm)
   *     - đúng  → -0.03
   *     - sai   → -0.08
   *
   * Kết quả cuối cùng được giới hạn trong [0.5 ; 1.2].
   */
  private calculateResponseTimeFactor(
    results: QuestionResult[],
  ): number {
    if (!results.length) return 1.0;

    let factor = 1.0;

    for (const result of results) {
      const expected = result.expectedTime || 60;
      const ratio = result.timeTaken / expected;

      // 1) Quá nhanh bất thường: < 30% thời gian kỳ vọng
      if (ratio < 0.3) {
        factor += result.isCorrect ? -0.02 : -0.12;
        continue;
      }

      // 2) Nhanh: 30%–60%
      if (ratio < 0.6) {
        factor += result.isCorrect ? +0.02 : -0.06;
        continue;
      }

      // 3) Bình thường: 60%–120%
      if (ratio <= 1.2) {
        factor += result.isCorrect ? +0.01 : -0.02;
        continue;
      }

      // 4) Hơi chậm: 120%–150%
      if (ratio <= 1.5) {
        factor += result.isCorrect ? -0.01 : -0.04;
        continue;
      }

      // 5) Quá chậm: > 150%
      factor += result.isCorrect ? -0.03 : -0.08;
    }

    return Math.max(0.5, Math.min(1.2, factor));
  }

  /**
   * Tính điểm ổn định (Consistency Score) dựa trên 5 Band Test gần nhất.
   *
   * Thuật toán kết hợp 2 chiều:
   *   ① Độ ổn định accuracy: stdDev của accuracy_percent → map sang 0–100
   *      stdDev=0 → 100%, stdDev=20 → 50%, stdDev≥40 → 0%
   *
   *   ② Độ ổn định response time: stdDev của response_time_factor (thang 0.5–1.2)
   *      stdDev=0 → 100%, stdDev=0.2 → 50%, stdDev≥0.4 → 0%
   *      (RTF ổn định = hành vi làm bài nhất quán, không đoán mò thất thường)
   *
   *   Consistency cuối = trung bình có trọng số:
   *      70% × accuracy_consistency + 30% × rtf_consistency
   *
   * Nếu chưa có đủ 2 lần thi → trả về 50 (trung lập).
   */
  private async calculateConsistency(roadmapId: number): Promise<number> {
    const recentTests = await this.prisma.ieltsBandTest.findMany({
      where: {
        roadmap_id: roadmapId,
        status: 'completed',
      },
      orderBy: { completed_at: 'desc' },
      take: 5,
      select: {
        accuracy_percent: true,
        response_time_factor: true,
      },
    });

    if (recentTests.length < 2) {
      return 50; // Chưa đủ dữ liệu → trả về điểm trung lập
    }

    // ── ① Tính consistency từ accuracy ──
    const accuracies = recentTests.map((t) => Number(t.accuracy_percent));
    const accMean = accuracies.reduce((s, v) => s + v, 0) / accuracies.length;
    const accStdDev = Math.sqrt(
      accuracies.reduce((s, v) => s + Math.pow(v - accMean, 2), 0) / accuracies.length,
    );
    // stdDev 0 → 100%, stdDev 20 → 50%, stdDev 40+ → 0%
    const accConsistency = Math.max(0, Math.min(100, 100 - accStdDev * 2.5));

    // ── ② Tính consistency từ response_time_factor ──
    const rtfValues = recentTests
      .map((t) => Number(t.response_time_factor))
      .filter((v) => v > 0); // Bỏ qua session chưa có RTF (mặc định 0)

    let rtfConsistency = 50; // mặc định trung lập nếu thiếu dữ liệu
    if (rtfValues.length >= 2) {
      const rtfMean = rtfValues.reduce((s, v) => s + v, 0) / rtfValues.length;
      const rtfStdDev = Math.sqrt(
        rtfValues.reduce((s, v) => s + Math.pow(v - rtfMean, 2), 0) / rtfValues.length,
      );
      // stdDev 0 → 100%, stdDev 0.2 → 50%, stdDev 0.4+ → 0%
      rtfConsistency = Math.max(0, Math.min(100, 100 - rtfStdDev * 250));
    }

    // ── Kết hợp: 70% accuracy + 30% RTF ──
    const consistency = accConsistency * 0.7 + rtfConsistency * 0.3;

    this.logger.log(
      `Consistency: acc=${accConsistency.toFixed(1)}% rtf=${rtfConsistency.toFixed(1)}% → combined=${consistency.toFixed(1)}%`,
    );

    return Math.round(consistency * 10) / 10;
  }

  /**
   * Xác định hướng thay đổi band: UP / DOWN / STABLE.
   *
   * Logic theo thứ tự kiểm tra:
   *
   *   ① UP (hiệu suất cao):
   *     - accuracy >= 80% AND rtf >= 0.95 AND consistency >= 60% AND severeErrors <= 1
   *
   *   ② UP (xu hướng tốt liên tục – async check, chỉ log):
   *     - accuracy >= 70% AND consistency >= 50%
   *     - Và 3 lần thi gần nhất đều ≥ 70% (kiểm tra bất đồng bộ, không ảnh hưởng return)
   *
   *   ③ DOWN (hiệu suất kém):
   *     - accuracy < 50% và số câu sai ≥ 50% tổng số câu
   *     - Hoặc: severeErrors >= 3
   *
   *   ④ STABLE: mặc định nếu không thỏa điều kiện nào trên
   */
  private determineBandChange(
    accuracy: number,
    responseTimeFactor: number,
    consistencyScore: number,
    severeErrors: number,
    totalQuestions: number,
    roadmapId: number,
  ): BandChange {
    // Điều kiện UP chính: tất cả chỉ số vượt ngưỡng
    if (
      accuracy >= 80 &&
      responseTimeFactor >= 0.95 &&
      consistencyScore >= 60 &&
      severeErrors <= 1
    ) {
      this.logger.log(
        `UP: High performance (acc=${accuracy}%, rtf=${responseTimeFactor.toFixed(2)}, con=${consistencyScore.toFixed(1)}%)`,
      );
      return BandChange.UP;
    }

    // Điều kiện UP thay thế: kiểm tra xu hướng 3 lần gần nhất (async, chỉ log không return)
    if (accuracy >= 70 && consistencyScore >= 50) {
      // Kiểm tra bất đồng bộ: 3 lần gần nhất đều ≥ 70%
      this.prisma.ieltsBandTest
        .findMany({
          where: { roadmap_id: roadmapId, status: 'completed' },
          orderBy: { created_at: 'desc' },
          take: 3,
          select: { accuracy_percent: true },
        })
        .then((recent) => {
          if (
            recent.length === 3 &&
            recent.every((t) => Number(t.accuracy_percent) >= 70)
          ) {
            this.logger.log(
              `UP: Consistent improvement (3 sessions >= 70%, con=${consistencyScore.toFixed(1)}%)`,
            );
            return BandChange.UP;
          }
        });
    }

    // Điều kiện DOWN: kết quả quá thấp hoặc quá nhiều lỗi nghiêm trọng
    const errorCount = totalQuestions - totalQuestions * (accuracy / 100);
    if (
      (accuracy < 50 && errorCount >= totalQuestions * 0.5) ||
      severeErrors >= 3
    ) {
      this.logger.log(
        `DOWN: Poor performance (acc=${accuracy}%, severe=${severeErrors})`,
      );
      return BandChange.DOWN;
    }

    // Mặc định: giữ nguyên band
    this.logger.log(`STABLE: Maintaining current level (acc=${accuracy}%)`);
    return BandChange.STABLE;
  }

  /**
   * Tính band mới sau khi biết hướng thay đổi.
   *
   * Quy tắc:
   *   - UP   → +0.1 so với currentBand
   *   - DOWN → -0.1 so với currentBand
   *   - STABLE → giữ nguyên
   *   - Kết quả được giới hạn trong [1.0 ; 9.0]
   */
  private calculateNewBand(
    currentBand: number,
    bandChange: BandChange,
    accuracy: number,
  ): number {
    let newBand = currentBand;

    if (bandChange === BandChange.UP) {
      newBand = currentBand + 0.1;
    } else if (bandChange === BandChange.DOWN) {
      // Giảm 0.1 band
      newBand = currentBand - 0.1;
    }

    // Giới hạn band trong khoảng hợp lệ
    return Math.max(1.0, Math.min(9.0, newBand));
  }

  /**
   * Xác định độ tin cậy của kết quả ước tính band.
   *
   * Luật:
   *   - LOW: có ≥ 20% câu trả lời quá nhanh ngầm (< 30% expected time)
   *     → kết quả không đáng tin cậy, có thể học sinh bấm ngẫu.
   *   - HIGH: consistency >= 60% và rtf trong khoảng [0.8; 1.2] và ≥ 20 câu
   *     → đủ dữ liệu lịch sử, tốc độ ổn, số câu lớn.
   *   - MEDIUM: mặc định trong các trường hợp khác.
   */
  private determineConfidence(
    accuracy: number,
    responseTimeFactor: number,
    consistencyScore: number,
    suspiciousFastAnswers: number,
    totalQuestions: number,
  ): 'low' | 'medium' | 'high' {
    // Câu trả lời ngầm quá nhiều → kém tin cậy
    if (suspiciousFastAnswers >= totalQuestions * 0.2) {
      return 'low';
    }

    // Tất cả chỉ số tốt → độ tin cậy cao
    if (
      consistencyScore >= 60 &&
      Math.abs(responseTimeFactor - 1.0) < 0.2 &&
      totalQuestions >= 20
    ) {
      return 'high';
    }

    // Các trường hợp còn lại
    return 'medium';
  }

  /**
   * Tạo gợi ý học tập và xác định kỹ năng yếu dựa trên kết quả Band Test.
   *
   * Luồng:
   *   1. Duyệt skillBreakdown → kỹ năng nào accuracy < 60% → đưa vào weakSkills.
   *   2. Xác định recommendation:
   *      - bandChange = UP  → ADVANCE (chuyển lên bài khó hơn)
   *      - bandChange = DOWN → REMEDIAL (nhắc lại kiến thức cũ)
   *      - bandChange = STABLE + có kỹ năng yếu → MAINTAIN (củng cố kỹ năng yếu)
   *      - bandChange = STABLE + không có kỹ năng yếu → ADVANCE
   */
  private async generateRecommendation(
    bandChange: BandChange,
    skillBreakdown: Record<string, any>,
    overallAccuracy: number,
  ): Promise<{ recommendation: Recommendation; weakSkills: string[] }> {
    // Tìm kỹ năng có accuracy dưới 60%
    const weakSkills: string[] = [];
    for (const [skill, data] of Object.entries(skillBreakdown)) {
      if (data.accuracy < 60) {
        weakSkills.push(skill);
      }
    }

    // Map bandChange → recommendation
    let recommendation: Recommendation;

    if (bandChange === BandChange.UP) {
      recommendation = Recommendation.ADVANCE;  // Tiến lên band cao hơn
    } else if (bandChange === BandChange.DOWN) {
      recommendation = Recommendation.REMEDIAL; // Cần nhắc lại kiến thức
    } else {
      // STABLE: xem xét thêm kỹ năng yếu
      if (weakSkills.length > 0) {
        recommendation = Recommendation.MAINTAIN;  // Củng cố kỹ năng chưa vững
      } else {
        recommendation = Recommendation.ADVANCE;   // Ổn định, sẵn sàng vươn lên
      }
    }

    return { recommendation, weakSkills };
  }

  /**
   * Phân loại lỗi thành các danh mục để tạo báo cáo phân tích.
   *
   * Phân loại đơn giản theo 3 tiêu chí:
   *   - errorSeverity >= 4: lỗi càng sâu (comprehension) — nằm trong nhóm lỗi hiểu
   *   - timeTaken > 1.5x expected: quản lý thời gian kém (timeManagement)
   *   - các trường hợp khác: lỗi cẩu thả / không tập trung (careless)
   *
   * @param questionResults  Danh sách kết quả từng câu
   * @param skillBreakdown   Tổng hợp theo kỹ năng (chưa dùng trong logic hiện tại)
   * @returns                Map loại lỗi → số lượng
   */
  analyzeErrors(
    questionResults: QuestionResult[],
    skillBreakdown: Record<string, any>,
  ): Record<string, number> {
    const errorTypes: Record<string, number> = {
      grammar: 0,
      vocabulary: 0,
      comprehension: 0,
      timeManagement: 0,
      careless: 0,
    };

    for (const result of questionResults) {
      if (!result.isCorrect) {
        // Lỗi nghiêm trọng → vấn đề hiểu sâu
        if (result.errorSeverity && result.errorSeverity >= 4) {
          errorTypes.comprehension++;
        } else if (result.timeTaken > result.expectedTime * 1.5) {
          // Mất quá nhiều thời gian → có vấn đề tốc độ
          errorTypes.timeManagement++;
        } else {
          // Lỗi do chủ quan / không chú ý
          errorTypes.careless++;
        }
      }
    }

    return errorTypes;
  }
}
