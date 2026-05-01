import { Injectable, Logger } from '@nestjs/common';
import { ChatOllama } from '@langchain/ollama';
import { PromptTemplate } from '@langchain/core/prompts';
import { DiagnosticAnalyzeRequestDto, RecommendPlanRequestDto, DiagnosticAnswerDto } from './dto/learning-path.dto';

export interface SkillMastery {
  skill: string;
  subSkill: string;
  masteryScore: number; // 0 to 100
  confidence: number; // 0 to 1
  weakness: number; // 100 - masteryScore
}

@Injectable()
export class LearningPathService {
  private readonly logger = new Logger(LearningPathService.name);

  // Analyze diagnostic test results
  async analyzeDiagnostic(dto: DiagnosticAnalyzeRequestDto) {
    const { answers, targetScore, currentScore, selectedBand } = dto;

    // PASS 1: Global Baseline Profiling
    // Determine overall capability on easy/medium questions to inform confidence on hard questions
    let easyTotal = 0;
    let easyCorrect = 0;
    for (const ans of answers) {
      if (ans.difficulty <= 3) {
        easyTotal++;
        if (ans.isCorrect) easyCorrect++;
      }
    }
    const easyAccuracy = easyTotal > 0 ? easyCorrect / easyTotal : 0;
    const isGlobalHighPerformer = easyAccuracy >= 0.7; // Very capable baseline
    const isGlobalStruggling = easyAccuracy < 0.4; // Weak baseline

    const skillAnalysis = new Map<string, SkillMastery>();
    const subSkillStats = new Map<string, { total: number; correct: number; totalDifficulty: number; totalConfidence: number; skill: string; weightedScore: number }>();

    let totalWeightedScore = 0;
    let maxTotalWeightedScore = 0;

    // PASS 2: Item-Level Evaluation using Global Profiling
    for (const ans of answers) {
      const key = `${ans.skill}:${ans.subSkill}`;
      if (!subSkillStats.has(key)) {
        subSkillStats.set(key, { total: 0, correct: 0, totalDifficulty: 0, totalConfidence: 0, skill: ans.skill, weightedScore: 0 });
      }
      
      const stats = subSkillStats.get(key)!;
      stats.total += 1;
      stats.totalDifficulty += ans.difficulty;

      // Calculate confidence based on behavior
      const timeRatio = ans.timeSpentSeconds / Math.max(1, ans.expectedTimeSeconds);
      let itemConfidence = 1.0;
      let scoreContribution = 0;

      if (ans.isCorrect) {
        if (timeRatio < 0.3) {
          if (ans.difficulty > 3 && isGlobalHighPerformer) {
            // Scenario: Fast and correct on HARD question, but overall they are very good.
            // Result: Genuine high capability. Do not penalize.
            itemConfidence = 0.95;
            scoreContribution = 1.0 * ans.difficulty;
          } else {
            // Scenario: Guessed right (too fast) without strong baseline, or just fast on easy.
            itemConfidence = 0.4;
            scoreContribution = 0.5 * ans.difficulty; // penalize score
          }
        } else if (timeRatio > 2.0) {
          // Took too long but got it right
          itemConfidence = 0.8;
          scoreContribution = 0.8 * ans.difficulty;
        } else {
          // Normal correct
          itemConfidence = 0.95;
          scoreContribution = 1.0 * ans.difficulty;
        }
        stats.correct += 1;
      } else {
        if (ans.difficulty <= 2) {
          // Scenario: Missed an easy question - high confidence of lacking foundation
          itemConfidence = 0.9;
        } else if (timeRatio < 0.3) {
          // Scenario: Guessed wrong on hard question quickly
          itemConfidence = 0.6;
        } else {
          // Scenario: Genuine mistake on hard question after taking time
          itemConfidence = 0.85;
        }
        scoreContribution = 0;
      }

      // Penalty for changing answers multiple times (indecisiveness)
      if (ans.answerChanges && ans.answerChanges > 2) {
        itemConfidence *= 0.8;
      }

      stats.totalConfidence += itemConfidence;
      stats.weightedScore += scoreContribution;
      
      totalWeightedScore += scoreContribution;
      maxTotalWeightedScore += ans.difficulty;
    }

    // PASS 3: Calculate mastery per sub-skill
    for (const [key, stats] of subSkillStats.entries()) {
      const [, subSkill] = key.split(':');
      const avgConfidence = stats.totalConfidence / stats.total;
      
      // Max possible weighted score is if all were correct with 1.0 multiplier
      const maxPossibleScore = stats.totalDifficulty; 
      let masteryPercent = maxPossibleScore > 0 ? (stats.weightedScore / maxPossibleScore) * 100 : 0;
      
      // Clamp between 0 and 100
      masteryPercent = Math.max(0, Math.min(100, masteryPercent));

      skillAnalysis.set(key, {
        skill: stats.skill,
        subSkill,
        masteryScore: masteryPercent,
        confidence: avgConfidence,
        weakness: 100 - masteryPercent,
      });
    }

    // Step 4: Baseline calculation and Band placement
    // Thích ứng theo mốc điểm khảo sát học viên đã chọn (selectedBand), mặc định max là 500
    const targetBand = selectedBand || 500;
    const MIN_DIAGNOSTIC_SCORE = 10;
    
    let overallPercent = maxTotalWeightedScore > 0 ? totalWeightedScore / maxTotalWeightedScore : 0;
    // Map 0-100% accuracy (weighted) to targetBand scale (e.g., 10 to 200, or 10 to 500)
    let estimatedScore = Math.round(MIN_DIAGNOSTIC_SCORE + overallPercent * (targetBand - MIN_DIAGNOSTIC_SCORE));
    
    // Ensure it doesn't exceed the selectedBand
    estimatedScore = Math.min(targetBand, Math.max(MIN_DIAGNOSTIC_SCORE, estimatedScore));

    // Override with currentScore if provided manually, but typically diagnostic defines it.
    if (currentScore) {
       estimatedScore = currentScore;
    }

    const gap = targetScore - estimatedScore;

    return {
      estimatedScore, // Band hiện tại (max 500)
      targetScore, // Nếu target > 500 -> gap lớn -> lộ trình focus để leo rank
      gap,
      globalProfile: {
        easyAccuracy: Math.round(easyAccuracy * 100) + '%',
        isHighPerformer: isGlobalHighPerformer
      },
      skills: Array.from(skillAnalysis.values()),
    };
  }

  // Plan recommendation engine
  async recommendPlan(dto: RecommendPlanRequestDto, diagnosticResults: any) {
    const { targetScore, hoursPerWeek, weeksUntilExam } = dto;
    const { gap, skills } = diagnosticResults;

    // Weight of skills in TOEIC (simplified)
    const examWeight: Record<string, number> = {
      'Listening': 0.5,
      'Reading': 0.5,
      'Grammar': 0.2,
      'Vocabulary': 0.3,
    };

    // Improvability factor (some skills are faster to improve than others)
    const improvability: Record<string, number> = {
      'Grammar': 1.2, // Grammar rules can be learned quickly
      'Vocabulary': 0.9, // Takes time
      'Reading': 1.0,
      'Listening': 1.1,
    };

    const targetGapFactor = Math.min(2.0, 1.0 + (gap / 400)); // Cap at 2.0

    // Priority calculation
    const prioritizedSkills = skills.map((s: SkillMastery) => {
      const w = examWeight[s.skill] || 0.5;
      const imp = improvability[s.subSkill] || 1.0;
      const confPenalty = s.confidence; // Lower confidence reduces priority slightly, or we could force review if confidence is low. 
      // Actually, if confidence is low, we might want to prioritize it to re-assess, but let's stick to the formula:
      // weakness * weight * improvability * gapFactor * confidence
      
      const priority = s.weakness * w * imp * targetGapFactor * confPenalty;
      
      return {
        ...s,
        priority,
      };
    }).sort((a, b) => b.priority - a.priority);

    // Call LLM / Qwen3 to generate the readable plan
    const llmPlan = await this.generateLlmPlan(prioritizedSkills, dto);

    return {
      prioritizedSkills,
      plan: llmPlan,
      totalHours: hoursPerWeek * weeksUntilExam,
    };
  }

  private async generateLlmPlan(prioritizedSkills: any[], dto: RecommendPlanRequestDto) {
    const baseUrl = process.env.OLLAMA_BASE_URL?.trim() || 'http://127.0.0.1:11434';
    const model = process.env.OLLAMA_CHAT_MODEL?.trim() || 'qwen3';

    const llm = new ChatOllama({
      baseUrl,
      model,
      temperature: 0.2,
    });

    const promptTemplate = PromptTemplate.fromTemplate(`
Bạn là một chuyên gia thiết kế lộ trình học TOEIC tự động.
Dưới đây là dữ liệu phân tích năng lực của một học viên:
Mục tiêu: {targetScore}
Thời gian học: {hoursPerWeek} giờ/tuần, trong {weeksUntilExam} tuần.

Các kỹ năng ưu tiên cần học (đã được thuật toán đánh giá mức độ yếu, trọng số điểm, và khả năng cải thiện, sắp xếp từ ưu tiên cao xuống thấp):
{skillsJson}

Yêu cầu:
Dựa vào dữ liệu định lượng cứng ở trên, hãy tạo một bản tóm tắt lộ trình học tập bằng tiếng Việt thật chuyên nghiệp, giải thích vì sao chọn các kỹ năng ưu tiên đó và chia phân bổ thời gian (%).
KHÔNG TỰ Ý ĐÁNH GIÁ NĂNG LỰC, chỉ dựa vào dữ liệu được cung cấp.
Trả về dữ liệu dưới định dạng JSON với cấu trúc:
{{
  "summary": "Tóm tắt lộ trình và chiến lược...",
  "weeklyPlan": [
    {{
      "focus": "Tên kỹ năng",
      "percentage": 40,
      "reason": "Lý do ưu tiên..."
    }}
  ]
}}
Lưu ý: Chỉ trả về JSON hợp lệ, không có markdown.
    `);

    const prompt = await promptTemplate.format({
      targetScore: dto.targetScore,
      hoursPerWeek: dto.hoursPerWeek,
      weeksUntilExam: dto.weeksUntilExam,
      skillsJson: JSON.stringify(prioritizedSkills.slice(0, 5), null, 2),
    });

    try {
      const response = await llm.invoke(prompt);
      let content = response.content as string;
      // Extract JSON if wrapped in markdown
      if (content.includes('```json')) {
        content = content.split('```json')[1].split('```')[0].trim();
      } else if (content.includes('```')) {
        content = content.split('```')[1].split('```')[0].trim();
      }

      return JSON.parse(content);
    } catch (e) {
      this.logger.error('Failed to generate LLM plan', e);
      // Fallback deterministic plan
      return {
        summary: "Lộ trình học được tạo tự động dựa trên mức độ ưu tiên của kỹ năng.",
        weeklyPlan: prioritizedSkills.slice(0, 3).map(s => ({
          focus: s.subSkill,
          percentage: 33,
          reason: `Kỹ năng ${s.subSkill} đang yếu (${Math.round(s.weakness)}% weakness) và có độ ưu tiên cao.`
        }))
      };
    }
  }
}
