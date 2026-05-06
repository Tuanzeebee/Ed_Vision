// ── TOEIC Practice Score Calculation (Per-Part Cap / Anti-Spam) ──────────
// File: toeicPracticeScore.ts
//
// ★ NGUYÊN TẮC CHỐNG SPAM ★
// Mỗi part có "trần đóng góp điểm" (cap) cố định theo tỷ trọng số câu hỏi.
//   cap = (part.questions / tổng câu toàn bài) × RANGE
// Spam luyện lại 1 part → chỉ lấy MAX score → không bao giờ vượt cap.
// Muốn tăng tổng điểm → BẮT BUỘC luyện nhiều part khác nhau.

// ========================
// 1. TYPES
// ========================

/** Cấu hình 1 part trong 1 kỹ năng */
export interface PartConfig {
  key: string;        // ID duy nhất, VD: "part1", "part5"
  label: string;      // Tên hiển thị
  questions: number;  // Số câu hỏi
}

/** Cấu hình 1 kỹ năng (skill) */
export interface SkillConfig {
  key: string;          // VD: "listening", "reading"
  label: string;        // VD: "Listening", "Reading"
  parts: PartConfig[];  // Danh sách các part — THÊM/BỚT TẠI ĐÂY
}

/** Cấu hình scoring — tất cả tham số điều chỉnh được */
export interface ScoringConfig {
  skills: SkillConfig[];
  curveExponent: number;       // Hệ số curve smoothing (mặc định 0.85)
  balanceThreshold: number;    // Ngưỡng accuracy MỖI skill để bonus (mặc định 0.85)
  balanceBonus: number;        // Điểm bonus đồng đều (mặc định 20)
  capReachedRatio: number;     // Tỉ lệ đạt trần để coi là "maxed out" (mặc định 0.95)
}

/** Input cho hàm tính điểm — PER-PART, không phải per-skill */
export interface ToeicScoreInput {
  /**
   * Số câu đúng TỐT NHẤT (best) của TỪNG PART.
   * Key = part.key, Value = số câu đúng (đã lấy max qua các lần chơi).
   * VD: { part1: 5, part2: 8, part5: 9, part7: 7 }
   */
  bestCorrectByPart: Record<string, number>;
  minScore: number;   // Cận dưới dải điểm (VD: 300)
  maxScore: number;   // Cận trên dải điểm (VD: 500), gap = 200
}

/** Chi tiết kết quả 1 part */
export interface PartScoreDetail {
  partKey: string;      // VD: "part1"
  skillKey: string;     // VD: "listening"
  label: string;        // VD: "Part 1 – Photographs"
  questions: number;    // Tổng câu hỏi của part
  bestCorrect: number;  // Số câu đúng tốt nhất
  accuracy: number;     // bestCorrect / questions (0–1)
  cap: number;          // Trần điểm tối đa part này đóng góp
  earned: number;       // Điểm thực tế đóng góp (≤ cap)
  capReached: boolean;  // Đã đạt ≥ capReachedRatio × cap chưa
}

/** Chi tiết kết quả gộp 1 kỹ năng */
export interface SkillScoreDetail {
  key: string;
  label: string;
  totalQuestions: number;
  totalCorrect: number;
  accuracy: number;       // tổng correct / tổng questions (0–1)
  totalCap: number;       // Tổng trần điểm skill này
  totalEarned: number;    // Tổng điểm earned skill này
  parts: PartScoreDetail[];
}

/** Output trả về sau khi tính điểm */
export interface ToeicScoreResult {
  skills: SkillScoreDetail[];
  partDetails: PartScoreDetail[];   // Flat list tất cả parts (tiện cho UI)
  totalCap: number;                 // = RANGE (tổng trần = maxScore - minScore)
  totalEarned: number;              // Tổng earned trước bonus
  finalScore: number;               // Điểm cuối cùng (đã clamp)
  bonusApplied: boolean;
}

// ========================
// 2. CẤU HÌNH MẶC ĐỊNH
// ========================
// ★ Muốn thêm part? Push thêm object vào mảng `parts`.
// ★ Muốn thêm skill mới (VD: Speaking)? Thêm 1 object SkillConfig.
// → Trần (cap) từng part tự tính lại — KHÔNG cần sửa logic.

export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  skills: [
    {
      key: "listening",
      label: "Listening",
      parts: [
        { key: "part1", label: "Part 1 – Photographs",       questions: 6  },
        { key: "part2", label: "Part 2 – Question-Response",  questions: 10 },
        { key: "part3", label: "Part 3 – Conversations",      questions: 10 },
        { key: "part4", label: "Part 4 – Short Talks",        questions: 10 },
        // ★ Thêm part mới tại đây
      ],
    },
    {
      key: "reading",
      label: "Reading",
      parts: [
        { key: "part5", label: "Part 5 – Incomplete Sentences",    questions: 10 },
        { key: "part6", label: "Part 6 – Text Completion",         questions: 10 },
        { key: "part7", label: "Part 7 – Reading Comprehension",   questions: 10 },
        // ★ Thêm part mới tại đây
      ],
    },
  ],
  curveExponent: 0.85,
  balanceThreshold: 0.85,
  balanceBonus: 20,
  capReachedRatio: 0.95,     // ≥ 95% cap → coi là maxed out
};

// ========================
// 3. HELPERS
// ========================

/** Tính tổng câu hỏi của 1 skill */
export function getTotalQuestions(skill: SkillConfig): number {
  return skill.parts.reduce((sum, p) => sum + p.questions, 0);
}

/** Tổng câu hỏi toàn bài (tất cả skill) */
export function getAllTotalQuestions(
  config: ScoringConfig = DEFAULT_SCORING_CONFIG,
): number {
  return config.skills.reduce((sum, s) => sum + getTotalQuestions(s), 0);
}

/**
 * Tính trần điểm (cap) của 1 part.
 * cap = (part.questions / tổng câu toàn bài) × range
 */
export function getPartCap(
  part: PartConfig,
  range: number,
  totalAllQuestions: number,
): number {
  if (totalAllQuestions === 0) return 0;
  return (part.questions / totalAllQuestions) * range;
}

// ========================
// 4. HÀM TÍNH ĐIỂM CHÍNH
// ========================

/**
 * Tính điểm TOEIC ôn luyện — PER-PART CAP, chống spam.
 *
 * Bước 1: Tính tổng câu toàn bài → trần (cap) từng part theo tỷ trọng
 * Bước 2: Với mỗi part → accuracy = bestCorrect / questions
 * Bước 3: Curve smoothing → earned = accuracy^curve × cap (≤ cap)
 * Bước 4: Tổng tất cả earned + minScore → rawScore
 * Bước 5: Bonus nếu TẤT CẢ skill accuracy ≥ balanceThreshold
 * Bước 6: Clamp trong [minScore, maxScore]
 *
 * ★ Spam 1 part → earned max = cap của part đó → KHÔNG THỂ leo hết dải
 *
 * @param input  - { bestCorrectByPart, minScore, maxScore }
 * @param config - (tuỳ chọn) ghi đè DEFAULT_SCORING_CONFIG
 */
export function calculateToeicPracticeScore(
  input: ToeicScoreInput,
  config: ScoringConfig = DEFAULT_SCORING_CONFIG,
): ToeicScoreResult {
  const { bestCorrectByPart, minScore, maxScore } = input;
  const { skills, curveExponent, balanceThreshold, balanceBonus, capReachedRatio } = config;

  const range = maxScore - minScore; // thường = 200
  const totalAllQuestions = getAllTotalQuestions(config);

  // ── Bước 1–3: Tính từng part ──
  const allPartDetails: PartScoreDetail[] = [];
  const skillDetails: SkillScoreDetail[] = skills.map((skill) => {
    const partResults: PartScoreDetail[] = skill.parts.map((part) => {
      // Trần điểm part này
      const cap = getPartCap(part, range, totalAllQuestions);

      // Số câu đúng tốt nhất (đã lấy max bên ngoài)
      const bestCorrect = Math.min(
        Math.max(bestCorrectByPart[part.key] ?? 0, 0),
        part.questions,
      );
      const accuracy = part.questions > 0 ? bestCorrect / part.questions : 0;

      // Curve smoothing → earned, không thể vượt cap
      const earned = Math.min(cap, Math.pow(accuracy, curveExponent) * cap);

      const capReached = cap > 0 && earned >= capReachedRatio * cap;

      return {
        partKey: part.key,
        skillKey: skill.key,
        label: part.label,
        questions: part.questions,
        bestCorrect,
        accuracy: parseFloat(accuracy.toFixed(4)),
        cap: parseFloat(cap.toFixed(2)),
        earned: parseFloat(earned.toFixed(2)),
        capReached,
      };
    });

    allPartDetails.push(...partResults);

    // Gộp skill-level
    const totalQuestions = skill.parts.reduce((s, p) => s + p.questions, 0);
    const totalCorrect = partResults.reduce((s, p) => s + p.bestCorrect, 0);
    const totalCap = partResults.reduce((s, p) => s + p.cap, 0);
    const totalEarned = partResults.reduce((s, p) => s + p.earned, 0);

    return {
      key: skill.key,
      label: skill.label,
      totalQuestions,
      totalCorrect,
      accuracy: parseFloat(
        (totalQuestions > 0 ? totalCorrect / totalQuestions : 0).toFixed(4),
      ),
      totalCap: parseFloat(totalCap.toFixed(2)),
      totalEarned: parseFloat(totalEarned.toFixed(2)),
      parts: partResults,
    };
  });

  // ── Bước 4: Tổng điểm = minScore + Σ(earned) ──
  const totalEarned = allPartDetails.reduce((s, p) => s + p.earned, 0);
  let rawScore = minScore + totalEarned;

  // ── Bước 5: Bonus nếu TẤT CẢ skill accuracy ≥ ngưỡng ──
  const bonusApplied =
    skillDetails.length > 0 &&
    skillDetails.every((s) => s.accuracy >= balanceThreshold);
  if (bonusApplied) {
    rawScore += balanceBonus;
  }

  // ── Bước 6: Clamp trong [minScore, maxScore] ──
  const finalScore = Math.round(
    Math.min(maxScore, Math.max(minScore, rawScore)),
  );

  return {
    skills: skillDetails,
    partDetails: allPartDetails,
    totalCap: parseFloat(range.toFixed(2)),
    totalEarned: parseFloat(totalEarned.toFixed(2)),
    finalScore,
    bonusApplied,
  };
}
