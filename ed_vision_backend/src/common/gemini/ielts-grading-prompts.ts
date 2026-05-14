// IELTS grading prompt builders for Gemini API

export interface SpeakingGradingInput {
  transcript: string;
  itemPrompt: string;
  targetBand: number;
  partType?: 'part1' | 'part2' | 'part3';
  lessonLevel?: string;
}

export interface WritingGradingInput {
  essay: string;
  taskPrompt: string;
  taskType: 'task1' | 'task2';
  targetBand: number;
  wordCount: number;
  lessonLevel?: string;
}

export interface IeltsCriterion {
  name: string;
  score: number;
  feedback: string;
}

export interface IeltsGradingResult {
  skill: 'speaking' | 'writing';
  bandScore: number;
  criteria: IeltsCriterion[];
  overallFeedback: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  correctedExamples?: Array<{
    original: string;
    suggestion: string;
    explanation: string;
  }>;
  estimatedCefrLevel: string;
  confidence: 'low' | 'medium' | 'high';

  // ── MỚI ──────────────────────────────────────────
  taskAnalysis?: {
    responseLevel: string;
    responseLabel: string;
    responseSummary: string;
    responseTips: string[];
    ideaDevelopmentLevel: string;
    ideaDevelopmentLabel: string;
    ideaDevelopmentSummary: string;
    ideaDevelopmentTips: string[];
  };
  sentenceFeedback?: Array<{
    original: string;
    issues: string[];
    suggestion: string;
    explanation: string;
    severity: 'minor' | 'major';
    criterionTag: 'lexical' | 'grammar' | 'task' | 'coherence';
  }>;
  grammarAnalysis?: {
    diversityLevel: string;
    diversityLabel: string;
    diversitySummary: string;
    diversityTips: string[];
    accuracyLevel: string;
    accuracyLabel: string;
    accuracySummary: string;
    accuracyTips: string[];
    commonErrors: Array<{
      pattern: string;
      example: string;
      fix: string;
      rule: string;
    }>;
  };
  coherenceAnalysis?: {
    flowLevel: string;
    flowLabel: string;
    flowSummary: string;
    flowTips: string[];
    paragraphLevel: string;
    paragraphLabel: string;
    paragraphSummary: string;
    paragraphTips: string[];
    referencingLevel: string;
    referencingLabel: string;
    referencingSummary: string;
    referencingTips: string[];
    missingLinks: string[];
  };
  lexicalAnalysis?: {
    diversityLevel: string;
    diversityLabel: string;
    diversitySummary: string;
    diversityTips: string[];
    overusedWords: string[];
    suggestedUpgrades: Array<{
      original: string;
      upgrade: string;
      example: string;
    }>;
  };
}

/**
 * Round a score to the nearest 0.5 IELTS band step, clamped 0–9.
 */
export function computeIeltsBand(score: number): number {
  return Math.min(9, Math.max(0, Math.round(score * 2) / 2));
}

/**
 * Compute overall band from a list of criterion scores (average, rounded).
 */
export function computeIeltsBandFromCriteria(
  criteria: Array<{ score: number }>,
): number {
  if (!criteria.length) return 0;
  const avg = criteria.reduce((s, c) => s + c.score, 0) / criteria.length;
  return computeIeltsBand(avg);
}

// ---------------------------------------------------------------------------

export function buildSpeakingGradingPrompt(input: SpeakingGradingInput): string {
  const { transcript, itemPrompt, targetBand, partType = 'part1', lessonLevel } = input;

  const truncated =
    transcript.length > 3000 ? transcript.slice(0, 3000) + '…[truncated]' : transcript;

  return `You are an expert IELTS examiner. Grade the following IELTS Speaking response strictly according to official IELTS band descriptors.

## Task Information
- Speaking part: ${partType.toUpperCase()}
- Target band: ${targetBand}${lessonLevel ? `\n- Lesson level: ${lessonLevel}` : ''}

## Speaking Prompt
${itemPrompt}

## Student Transcript
${truncated}

## Grading Instructions
Evaluate the response on the four official IELTS Speaking criteria:
1. **Fluency and Coherence (FC)**: Flow of speech, logical ordering, cohesive devices
2. **Lexical Resource (LR)**: Vocabulary range, accuracy, collocations
3. **Grammatical Range and Accuracy (GRA)**: Grammar structures, complexity, error frequency
4. **Pronunciation (PR)**: Intelligibility, stress, intonation (infer from transcript quality and word choices)

Score each criterion from 0 to 9 in 0.5 steps. Be strict but fair.

Note: If the transcript is very short (under 30 words), or is mostly silence/filler, assign low scores accordingly.

## Required JSON Output (ONLY output valid JSON, no markdown, no extra text)
{
  "skill": "speaking",
  "bandScore": <overall band 0-9 in 0.5 steps>,
  "criteria": [
    { "name": "Fluency and Coherence", "score": <0-9>, "feedback": "<1-2 sentences>" },
    { "name": "Lexical Resource", "score": <0-9>, "feedback": "<1-2 sentences>" },
    { "name": "Grammatical Range and Accuracy", "score": <0-9>, "feedback": "<1-2 sentences>" },
    { "name": "Pronunciation", "score": <0-9>, "feedback": "<1-2 sentences>" }
  ],
  "overallFeedback": "<2-3 sentences summarising performance>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>"],
  "suggestions": ["<actionable tip 1>", "<actionable tip 2>", "<actionable tip 3>"],
  "estimatedCefrLevel": "<A1|A2|B1|B2|C1|C2>",
  "confidence": "<low|medium|high>"
}`;
}

// ---------------------------------------------------------------------------

export function buildWritingGradingPrompt(input: WritingGradingInput): string {
  const { essay, taskPrompt, taskType, targetBand, wordCount, lessonLevel } = input;
  const truncated = essay.length > 4000 ? essay.slice(0, 4000) + '…' : essay;
  const firstCriterion = taskType === 'task1' ? 'Task Achievement' : 'Task Response';

  return `You are a strict IELTS examiner. Return ONLY valid JSON, no markdown.
IMPORTANT: You MUST write ALL feedback, explanations, summaries, tips, strengths, weaknesses, and labels in VIETNAMESE. Only exact quotes from the essay or specific English vocabulary should remain in English.

## Task Info
- Type: ${taskType === 'task1' ? 'Task 1 (Academic)' : 'Task 2 (Essay)'}
- Target band: ${targetBand}
- Word count: ${wordCount}${lessonLevel ? `\n- Level: ${lessonLevel}` : ''}

## Writing Prompt
${taskPrompt}

## Student Essay
${truncated}

{
  "skill": "writing",
  "taskType": "${taskType}",
  "bandScore": <0-9 step 0.5>,
  "estimatedCefrLevel": "<A1|A2|B1|B2|C1|C2>",
  "confidence": "<low|medium|high>",
  "overallFeedback": "<3-4 sentences specific to this essay>",

  "criteria": [
    { "name": "${firstCriterion}", "score": <0-9>, "feedback": "<2-3 sentences with examples from essay>" },
    { "name": "Coherence and Cohesion", "score": <0-9>, "feedback": "<2-3 sentences>" },
    { "name": "Lexical Resource", "score": <0-9>, "feedback": "<2-3 sentences>" },
    { "name": "Grammatical Range and Accuracy", "score": <0-9>, "feedback": "<2-3 sentences>" }
  ],

  "sentenceFeedback": [
    {
      "original": "<exact sentence from essay>",
      "issues": ["grammar"|"word_choice"|"paraphrase"|"clarity"|"coherence"],
      "suggestion": "<fully rewritten sentence>",
      "explanation": "<specific reason>",
      "severity": "minor"|"major",
      "criterionTag": "lexical"|"grammar"|"task"|"coherence"
    }
  ],

  "taskAnalysis": {
    "responseLevel": "<Không đáp ứng|Đáp ứng một phần|Đáp ứng đầy đủ|Đáp ứng xuất sắc>",
    "responseLabel": "<short uppercase label>",
    "responseSummary": "<2-3 sentences: does essay address all parts of the prompt?>",
    "responseTips": ["<tip 1>", "<tip 2>"],
    "ideaDevelopmentLevel": "<Thiếu ý|Sơ sài|Phát triển tốt|Phát triển xuất sắc>",
    "ideaDevelopmentLabel": "<short uppercase label>",
    "ideaDevelopmentSummary": "<2-3 sentences about depth of arguments, examples>",
    "ideaDevelopmentTips": ["<tip 1>", "<tip 2>"]
  },

  "grammarAnalysis": {
    "diversityLevel": "<Hạn chế|Trung bình|Đa dạng|Rất đa dạng và chính xác>",
    "diversityLabel": "<MỘT LOẠT CÁC CẤU TRÚC ĐƯỢC SỬ DỤNG LINH HOẠT VÀ CHÍNH XÁC>",
    "diversitySummary": "<2-3 sentences: which complex structures used — relative clauses, conditionals, passive, etc.>",
    "diversityTips": ["<tip 1>", "<tip 2>"],
    "accuracyLevel": "<Nhiều lỗi hệ thống|Lỗi đáng kể|Ít lỗi|Không có lỗi hệ thống>",
    "accuracyLabel": "<ÍT LỖI, LỖI KHÔNG HỆ THỐNG, KHÔNG CẢN TRỞ Ý NGHĨA>",
    "accuracySummary": "<2-3 sentences about error frequency and type>",
    "accuracyTips": ["<tip 1>", "<tip 2>"],
    "commonErrors": [
      { "pattern": "<error type>", "example": "<exact from essay>", "fix": "<corrected>", "rule": "<grammar rule>" }
    ]
  },

  "coherenceAnalysis": {
    "flowLevel": "<Confusing|Not logically connected|Considerable disruptions|Minor disruptions|Flawlessly connected>",
    "flowLabel": "<CÁC Ý TƯỞNG ĐƯỢC LIÊN KẾT MỘT CÁCH HOÀN HẢO>",
    "flowSummary": "<2-3 sentences about logical progression, argument structure>",
    "flowTips": ["<tip 1>", "<tip 2>", "<tip 3>"],
    "paragraphLevel": "<Không rõ ràng|Cần cải thiện|Chia đoạn hiệu quả|Xuất sắc>",
    "paragraphLabel": "<CHIA ĐOẠN HIỆU QUẢ>",
    "paragraphSummary": "<2-3 sentences: intro, body paras, conclusion structure>",
    "paragraphTips": ["<tip 1>", "<tip 2>"],
    "referencingLevel": "<Không sử dụng|Hạn chế|Sử dụng thành thạo|Sử dụng thành thạo, không có sai sót>",
    "referencingLabel": "<SỬ DỤNG THÀNH THẠO, KHÔNG CÓ SAI SÓT>",
    "referencingSummary": "<2-3 sentences about pronouns, substitution, referencing>",
    "referencingTips": ["<tip 1>"],
    "linkingWordsUsed": ["<word used in essay>"],
    "missingLinks": ["<suggested linking phrases>"]
  },

  "lexicalAnalysis": {
    "diversityLevel": "<Rất hạn chế|Hạn chế|Trung bình|Phong phú|Vốn từ phong phú, sử dụng linh hoạt và chính xác>",
    "diversityLabel": "<VỐN TỪ PHONG PHÚ, SỬ DỤNG LINH HOẠT VÀ CHÍNH XÁC>",
    "diversitySummary": "<2-3 sentences: academic words, collocations, topic-specific vocab used>",
    "diversityTips": ["<tip>"],
    "overusedWords": ["<word repeated too often>"],
    "suggestedUpgrades": [
      { "original": "<basic word/phrase from essay>", "upgrade": "<academic alternative>", "example": "<example sentence>" }
    ]
  },

  "strengths": ["<specific + quote from essay>", "<specific strength 2>"],
  "weaknesses": ["<specific + quote from essay>", "<specific weakness 2>"],
  "suggestions": ["<tip 1>", "<tip 2>", "<tip 3>"],
  "correctedExamples": [
    { "original": "<sentence>", "suggestion": "<corrected>", "explanation": "<note>" }
  ]
}`;
}
