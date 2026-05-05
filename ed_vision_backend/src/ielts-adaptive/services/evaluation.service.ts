import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// ─── Default error tags seeded once ───────────────────────────────────────────
const DEFAULT_ERROR_TAGS = [
  // Reading
  {
    name: 'Đọc hiểu ý chính',
    skill: 'reading',
    severity: 2,
    improvement_suggestion:
      'Luyện kỹ năng skimming & scanning để nắm ý chính nhanh hơn.',
    explanation: 'Học sinh thường bỏ sót ý chính do đọc quá chi tiết.',
    recommended_action: 'Luyện 5 bài main-idea mỗi ngày.',
  },
  {
    name: 'Điền vào chỗ trống (Reading)',
    skill: 'reading',
    severity: 3,
    improvement_suggestion:
      'Chú ý danh từ / động từ xung quanh chỗ trống để đoán từ phù hợp.',
    explanation: 'Dễ nhầm từ đồng nghĩa không phù hợp ngữ pháp.',
    recommended_action: 'Ôn collocations & cụm từ cố định.',
  },
  {
    name: 'Hiểu chi tiết cụ thể',
    skill: 'reading',
    severity: 2,
    improvement_suggestion:
      'Gạch chân keyword khi đọc câu hỏi trước, rồi tìm trong bài.',
    explanation: 'Câu trả lời thường paraphrase từ bài đọc.',
    recommended_action: 'Luyện True/False/Not Given 10 câu/ngày.',
  },
  {
    name: 'Từ vựng học thuật',
    skill: 'reading',
    severity: 3,
    improvement_suggestion:
      'Học từ theo chủ đề học thuật (Academic Word List).',
    explanation: 'Thiếu vốn từ học thuật khiến khó hiểu bài.',
    recommended_action: 'Học AWL 10 từ/ngày.',
  },
  // Listening
  {
    name: 'Nghe điền thông tin',
    skill: 'listening',
    severity: 3,
    improvement_suggestion: 'Đọc câu hỏi trước khi nghe để biết cần điền gì.',
    explanation: 'Thông tin xuất hiện theo thứ tự câu hỏi trong bài nghe.',
    recommended_action: 'Luyện form/table completion mỗi ngày.',
  },
  {
    name: 'Nghe nhiều người nói',
    skill: 'listening',
    severity: 4,
    improvement_suggestion: 'Tập phân biệt giọng nói các nhân vật khác nhau.',
    explanation: 'Các cuộc hội thoại nhiều người dễ gây nhầm lẫn thông tin.',
    recommended_action: 'Nghe Section 3 & 4 mỗi ngày.',
  },
  {
    name: 'Phát âm & giọng địa phương',
    skill: 'listening',
    severity: 3,
    improvement_suggestion: 'Nghe đa dạng giọng: Anh, Úc, Mỹ.',
    explanation: 'Học sinh quen một giọng, lạ giọng dễ bỏ sót.',
    recommended_action: 'Dùng TED Talks hoặc BBC để luyện đa giọng.',
  },
  // Grammar
  {
    name: 'Sai thì động từ',
    skill: 'grammar',
    severity: 4,
    improvement_suggestion: 'Ôn 12 thì tiếng Anh và dấu hiệu nhận biết.',
    explanation: 'Nhầm lẫn giữa thì hiện tại hoàn thành và quá khứ đơn.',
    recommended_action: 'Làm 20 bài tập thì động từ mỗi ngày.',
  },
  {
    name: 'Câu điều kiện',
    skill: 'grammar',
    severity: 3,
    improvement_suggestion: 'Học cấu trúc câu điều kiện loại 1, 2, 3 và mixed.',
    explanation: 'Dễ nhầm lẫn giữa các loại câu điều kiện.',
    recommended_action: 'Luyện 10 bài conditional sentences.',
  },
  {
    name: 'Mạo từ (a/an/the)',
    skill: 'grammar',
    severity: 2,
    improvement_suggestion:
      'Nắm quy tắc dùng mạo từ: lần đầu đề cập vs. đã biết.',
    explanation: 'Dùng sai mạo từ là lỗi phổ biến của người học tiếng Việt.',
    recommended_action: 'Học 5 quy tắc mạo từ cơ bản.',
  },
  {
    name: 'Câu bị động',
    skill: 'grammar',
    severity: 3,
    improvement_suggestion: 'Nhớ cấu trúc: be + V3 và khi nào dùng.',
    explanation: 'Bị động thường xuất hiện nhiều trong văn bản học thuật.',
    recommended_action: 'Luyện chuyển đổi câu chủ động sang bị động.',
  },
  // Vocabulary
  {
    name: 'Từ đồng nghĩa / cùng chủ đề',
    skill: 'vocabulary',
    severity: 2,
    improvement_suggestion: 'Học từ theo nhóm nghĩa thay vì học đơn lẻ.',
    explanation: 'IELTS thường dùng paraphrase với từ đồng nghĩa.',
    recommended_action: 'Học 10 cặp từ đồng nghĩa học thuật mỗi ngày.',
  },
  {
    name: 'Phrasal verbs & idioms',
    skill: 'vocabulary',
    severity: 3,
    improvement_suggestion: 'Học phrasal verbs theo ngữ cảnh, không học thuộc.',
    explanation: 'Không thể dịch từng từ để hiểu nghĩa.',
    recommended_action: 'Học 5 phrasal verbs/ngày qua ví dụ thực tế.',
  },
  // Writing
  {
    name: 'Liên kết câu & đoạn văn',
    skill: 'writing',
    severity: 4,
    improvement_suggestion:
      'Dùng discourse markers: However, Furthermore, In contrast...',
    explanation: 'Thiếu cohesion làm bài viết rời rạc.',
    recommended_action: 'Luyện viết 1 đoạn 5 câu có đủ liên kết.',
  },
  {
    name: 'Lỗi chính tả & ngữ pháp viết',
    skill: 'writing',
    severity: 3,
    improvement_suggestion: 'Dành 5 phút cuối kiểm tra lại bài viết.',
    explanation: 'Lỗi cơ bản ảnh hưởng đến điểm Grammatical Range.',
    recommended_action: 'Luyện proofreading mỗi bài viết.',
  },
  // Speaking
  {
    name: 'Trả lời ngắn, thiếu phát triển',
    skill: 'speaking',
    severity: 4,
    improvement_suggestion:
      'Dùng kỹ thuật PEEL: Point – Explain – Example – Link.',
    explanation: 'Câu trả lời ngắn sẽ bị trừ điểm Fluency.',
    recommended_action: 'Luyện nói 2 phút về chủ đề bất kỳ mỗi ngày.',
  },
  {
    name: 'Phát âm không rõ ràng',
    skill: 'speaking',
    severity: 3,
    improvement_suggestion: 'Chú ý trọng âm từ và nối âm.',
    explanation: 'Phát âm ảnh hưởng trực tiếp đến điểm Pronunciation.',
    recommended_action: 'Luyện với ứng dụng phát âm hoặc shadowing.',
  },
];

@Injectable()
export class EvaluationService {
  private readonly logger = new Logger(EvaluationService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Seed default error tags if table is empty ─────────────────────────────
  /**
   * Đảm bảo bảng IeltsErrorTag đã có dữ liệu mặc định.
   *
   * Luồng:
   *   1. Đếm số bản ghi trong bảng IeltsErrorTag.
   *   2. Nếu đã có dữ liệu (count > 0) → bỏ qua, không seed lại.
   *   3. Nếu bảng rỗng → chèn 17 tag mặc định có sẵn trên đầu file.
   *      Tags bào gồm các kỹ năng: reading, listening, grammar, vocabulary, writing, speaking.
   * Hàm này thường được gọi trong OnModuleInit hoặc bootstrapApplication.
   */
  async ensureDefaultErrorTagsSeeded(): Promise<void> {
    const count = await this.prisma.ieltsErrorTag.count();
    if (count > 0) return;

    await this.prisma.ieltsErrorTag.createMany({ data: DEFAULT_ERROR_TAGS });
    this.logger.log(
      `Seeded ${DEFAULT_ERROR_TAGS.length} default IeltsErrorTags`,
    );
  }

  // ─── Map skill_area to weak-point candidates ───────────────────────────────
  /**
   * Cập nhật (hoặc tạo mới) bản ghi điểm yếu của học sinh dựa trên danh sách kỹ năng sai.
   *
   * Luồng:
   *   1. Đếm số lần xuất hiện của từng kỹ năng trong wrongSkills.
   *      Ví dụ: ['grammar', 'reading', 'grammar'] → { grammar: 2, reading: 1 }
   *   2. Với mỗi kỹ năng, tìm error tag có severity cao nhất (tags nặng nhất ưu tiên).
   *   3. Upsert IeltsWeakPoint:
   *      - Nếu chưa có: tạo mới với occurrences = count.
   *      - Nếu đã có: tăng occurrences += count, reset is_active = true, xóa resolved_at.
   *
   * @param enrollmentId  ID đăng ký khóa học IELTS của học sinh
   * @param wrongSkills   Mảng kỹ năng sai (có thể trùng lặp)
   */
  async updateWeakPoints(
    enrollmentId: number,
    wrongSkills: string[], // e.g. ['grammar', 'reading', 'grammar']
  ): Promise<void> {
    if (!wrongSkills.length) return;

    // Count occurrences per skill
    const skillCounts: Record<string, number> = {};
    for (const s of wrongSkills) {
      skillCounts[s] = (skillCounts[s] || 0) + 1;
    }

    // For each skill with errors, pick the most-severity tag for that skill
    for (const [skill, count] of Object.entries(skillCounts)) {
      const tag = await this.prisma.ieltsErrorTag.findFirst({
        where: { skill },
        orderBy: { severity: 'desc' },
      });
      if (!tag) continue;

      await this.prisma.ieltsWeakPoint.upsert({
        where: {
          enrollment_id_error_tag_id: {
            enrollment_id: enrollmentId,
            error_tag_id: tag.id,
          },
        },
        create: {
          enrollment_id: enrollmentId,
          error_tag_id: tag.id,
          occurrences: count,
        },
        update: {
          occurrences: { increment: count },
          last_seen_at: new Date(),
          is_active: true,
          resolved_at: null,
        },
      });
    }
  }

  // ─── Generate top-N recommendations from weak points ──────────────────────
  /**
   * Tạo mới danh sách gợi ý học tập (recommendations) dựa trên điểm yếu hiện tại.
   *
   * Luồng:
   *   1. Vô hiệu hóa (is_active = false) tất cả recommendations cũ đang active.
   *   2. Lấy top 5 weak points đang active, sắp xếp theo occurrences giảm dần.
   *   3. Với mỗi weak point → tạo 1 bản ghi IeltsRecommendation loại 'REMEDIAL_PRACTICE'.
   *      - priority = 5, 4, 3, 2, 1 (weak point xếp thứ 1 có priority cao nhất).
   *      - title = "Luyện tập: <tên tag>"
   *      - reason = gợi ý cải thiện từ error tag (hoặc fallback default)
   *
   * @param enrollmentId  ID đăng ký khóa học
   */
  async generateRecommendations(enrollmentId: number): Promise<void> {
    // Deactivate old recommendations
    await this.prisma.ieltsRecommendation.updateMany({
      where: { enrollment_id: enrollmentId, is_active: true },
      data: { is_active: false },
    });

    // Get top 5 active weak points sorted by occurrences
    const weakPoints = await this.prisma.ieltsWeakPoint.findMany({
      where: { enrollment_id: enrollmentId, is_active: true },
      include: { error_tag: true },
      orderBy: [{ occurrences: 'desc' }, { last_seen_at: 'desc' }],
      take: 5,
    });

    if (!weakPoints.length) return;

    const recs = weakPoints.map((wp, idx) => ({
      enrollment_id: enrollmentId,
      type: 'REMEDIAL_PRACTICE',
      title: `Luyện tập: ${wp.error_tag.name}`,
      reason:
        wp.error_tag.improvement_suggestion ||
        `Bạn đã mắc lỗi này ${wp.occurrences} lần.`,
      skill: wp.error_tag.skill,
      error_tag_id: wp.error_tag.id,
      priority: Math.max(1, 5 - idx),
      is_active: true,
    }));

    await this.prisma.ieltsRecommendation.createMany({ data: recs });
  }

  // ─── Get learning analysis for a student ──────────────────────────────────
  /**
   * Lấy báo cáo phân tích học tập toàn diện của học sinh.
   *
   * Luồng:
   *   1. Truy vấn song song (Promise.all) 3 nguồn dữ liệu:
   *      a) ieltsSkillProgress: tiến độ từng kỹ năng (reading/listening/grammar/...)
   *      b) ieltsWeakPoint (active): top 10 điểm yếu, bao gồm error tag
   *      c) ieltsRecommendation (active): top 5 gợi ý ưu tiên nhất
   *   2. Tính overall_band = trung bình cộng current_band của tất cả kỹ năng.
   *   3. Format và trả về object có cấu trúc chuẩn cho client.
   *
   * @param enrollmentId  ID đăng ký khóa học
   * @returns             Đối tượng phân tích gồm overall_band, skill_progress, weak_points, recommendations
   */
  async getLearningAnalysis(enrollmentId: number) {
    const [skillProgress, weakPoints, recommendations] = await Promise.all([
      this.prisma.ieltsSkillProgress.findMany({
        where: { enrollment_id: enrollmentId },
        orderBy: { last_practiced_at: 'desc' },
      }),
      this.prisma.ieltsWeakPoint.findMany({
        where: { enrollment_id: enrollmentId, is_active: true },
        include: { error_tag: true },
        orderBy: { occurrences: 'desc' },
        take: 10,
      }),
      this.prisma.ieltsRecommendation.findMany({
        where: { enrollment_id: enrollmentId, is_active: true },
        include: { error_tag: true },
        orderBy: { priority: 'desc' },
        take: 5,
      }),
    ]);

    const overallBand = skillProgress.length
      ? skillProgress.reduce((sum, s) => sum + s.current_band, 0) /
        skillProgress.length
      : null;

    return {
      overall_band: overallBand ? Number(overallBand.toFixed(1)) : null,
      skill_progress: skillProgress.map((s) => ({
        skill: s.skill_area,
        band: Number(s.current_band.toFixed(1)),
        accuracy: Number(s.accuracy_rate.toFixed(1)),
        lessons_completed: s.lessons_completed,
        total_practice: s.total_practice,
        last_practiced_at: s.last_practiced_at,
      })),
      weak_points: weakPoints.map((wp) => ({
        id: wp.id,
        skill: wp.error_tag.skill,
        name: wp.error_tag.name,
        severity: wp.error_tag.severity,
        occurrences: wp.occurrences,
        last_seen_at: wp.last_seen_at,
        improvement_suggestion: wp.error_tag.improvement_suggestion,
        recommended_action: wp.error_tag.recommended_action,
      })),
      recommendations: recommendations.map((r) => ({
        id: r.id,
        type: r.type,
        title: r.title,
        reason: r.reason,
        skill: r.skill,
        priority: r.priority,
        lesson_id: r.lesson_id,
      })),
    };
  }
}
