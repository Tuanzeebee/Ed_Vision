// src/common/gemini/ielts-grading-prompts.ts
// ── Phiên bản nâng cấp: prompt chi tiết hơn, ép AI giải thích sâu hơn ──────

export interface SpeakingGradingInput {
  transcript: string;
  itemPrompt: string;
  targetBand: number;
  partType?: 'part1' | 'part2' | 'part3';
  part?: number;
  lessonLevel?: string;
}

export interface HighFidelitySpeakingGradingInput extends SpeakingGradingInput {
  part: number;
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
    linkingWordsUsed: string[];
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

export function computeIeltsBand(score: number): number {
  return Math.min(9, Math.max(0, Math.round(score * 2) / 2));
}

export function computeIeltsBandFromCriteria(criteria: Array<{ score: number }>): number {
  if (!criteria.length) return 0;
  const avg = criteria.reduce((s, c) => s + c.score, 0) / criteria.length;
  return computeIeltsBand(avg);
}

// ─────────────────────────────────────────────────────────────────────────────
// SPEAKING — Standard
// ─────────────────────────────────────────────────────────────────────────────

export function buildSpeakingGradingPrompt(input: SpeakingGradingInput): string {
  const { transcript, itemPrompt, targetBand, partType = 'part1', lessonLevel } = input;
  const truncated = transcript.length > 3000 ? transcript.slice(0, 3000) + '…[truncated]' : transcript;
  const wordCount = truncated.trim().split(/\s+/).length;

  return `You are a senior IELTS Speaking examiner with 15+ years of experience. Grade this response with MAXIMUM STRICTNESS and DETAIL according to official IELTS band descriptors.

## Context
- Part: ${partType.toUpperCase()}
- Target band: ${targetBand}
- Word count: ~${wordCount} words
${lessonLevel ? `- Lesson level: ${lessonLevel}` : ''}

## Question
${itemPrompt}

## Transcript
${truncated}

## CRITICAL GRADING RULES
1. Do NOT inflate scores. A band 5 response must NOT be scored 6.
2. Each criterion feedback MUST contain:
   - At least 2 specific examples QUOTED directly from the transcript
   - Explanation of WHY each example raises or lowers the score
   - Specific comparison to what a band ${Math.min(9, targetBand + 1)} response would look like
3. If transcript is under 30 words or incoherent: all scores must be ≤ 4.0
4. Pronunciation score: infer from vocabulary complexity, sentence structure, and coherence patterns visible in text.

## Band Descriptor Reference
- FC 4-5: Some fluency but frequent repetition/hesitation, limited coherence
- FC 6-7: Able to talk at length, some hesitation, mostly coherent
- FC 8-9: Speaks fluently with only rare hesitation, fully coherent
- LR 4-5: Limited vocabulary, errors in word choice, basic expressions only
- LR 6-7: Flexible use of vocabulary, some inaccuracies, attempts paraphrase
- LR 8-9: Wide range of vocabulary, precise collocations, idiomatic language
- GRA 4-5: Limited structures, frequent errors, complex attempts fail
- GRA 6-7: Mix of simple and complex structures, some errors
- GRA 8-9: Wide range of structures, almost no errors
- PRO 4-5: Often hard to understand, L1 accent strongly intrudes
- PRO 6-7: Generally clear, some mispronunciations, listener attention sometimes needed
- PRO 8-9: Easy to understand, good intonation, minor non-impeding errors

## Output: ONLY valid JSON, no markdown, no extra text
{
  "skill": "speaking",
  "bandScore": <overall band 0-9 step 0.5>,
  "criteria": [
    {
      "name": "Fluency and Coherence",
      "score": <0-9 step 0.5>,
      "feedback": "<MINIMUM 4 sentences: (1) overall assessment, (2) quote specific fluent/coherent moment, (3) quote specific weak moment, (4) what to do to reach band ${Math.min(9, targetBand + 1)}>"
    },
    {
      "name": "Lexical Resource",
      "score": <0-9 step 0.5>,
      "feedback": "<MINIMUM 4 sentences: (1) vocab range assessment, (2) quote a good word/phrase used, (3) quote a weak/wrong word and suggest upgrade, (4) specific vocab improvement tip>"
    },
    {
      "name": "Grammatical Range and Accuracy",
      "score": <0-9 step 0.5>,
      "feedback": "<MINIMUM 4 sentences: (1) grammar range assessment, (2) quote a correct complex structure if any, (3) quote a grammar error and explain the rule, (4) specific grammar improvement>"
    },
    {
      "name": "Pronunciation",
      "score": <0-9 step 0.5>,
      "feedback": "<MINIMUM 3 sentences: (1) overall pronunciation assessment based on text patterns, (2) list 3 specific words to practice with IPA e.g. 'environment /ɪnˈvaɪrənmənt/', (3) intonation/stress tip>"
    }
  ],
  "overallFeedback": "<4-5 sentences: overall performance, key strength with quote, key weakness with quote, most critical improvement, realistic band expectation>",
  "strengths": [
    "<strength 1: specific with quote from transcript>",
    "<strength 2: specific with quote>",
    "<strength 3: specific>"
  ],
  "weaknesses": [
    "<weakness 1: specific with quote and explanation>",
    "<weakness 2: specific with quote>",
    "<weakness 3: specific>"
  ],
  "suggestions": [
    "<actionable tip 1: very specific, e.g. 'Replace basic verb X with Y/Z/W to boost LR'>",
    "<actionable tip 2: grammar structure to practice with example>",
    "<actionable tip 3: fluency technique e.g. discourse markers to add>",
    "<actionable tip 4: pronunciation focus>"
  ],
  "estimatedCefrLevel": "<A1|A2|B1|B2|C1|C2>",
  "confidence": "<low|medium|high>"
}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// SPEAKING — High Fidelity (used by IeltsSpeakingPage)
// ─────────────────────────────────────────────────────────────────────────────

export function buildHighFidelitySpeakingGradingPrompt(input: HighFidelitySpeakingGradingInput): string {
  const { transcript, itemPrompt, targetBand, part, lessonLevel } = input;
  const wordCount = transcript.trim().split(/\s+/).length;
  const nextBand = Math.min(9, targetBand + 0.5);

  return `You are a senior IELTS Speaking examiner with 15+ years of experience. You MUST provide EXHAUSTIVE, DETAILED analysis.

LANGUAGE RULES — STRICT:
- feedback, labels, tips, summaries, strengths, improvements → VIETNAMESE only
- "modelAnswer" field → ENGLISH ONLY. This is an English speaking model answer. Do NOT write Vietnamese here under any circumstances.
- "keyVocabulary[].word" → English word only
- "keyVocabulary[].definition" → Vietnamese translation
- "keyVocabulary[].example" → ENGLISH sentence only (Band 7+ English, no Vietnamese)
- "pronunciationNotes[].word" → English word
- "pronunciationNotes[].ipa" → IPA notation
- "pronunciationNotes[].tip" → Vietnamese advice

## Task
- Part: ${part}
- Target band: ${targetBand} → Next milestone: ${nextBand}
- Word count: ~${wordCount} words
${lessonLevel ? `- Lesson level: ${lessonLevel}` : ''}

## Question
${itemPrompt}

## Transcript
${transcript}

## MANDATORY GRADING REQUIREMENTS
1. NEVER give empty or generic feedback like "Cần cải thiện". Always explain WHY with a specific quote.
2. Each criterion MUST include at least 3 quoted examples from the transcript.
3. Scores must be HONEST and STRICT — do not inflate to make learner feel good.
4. keyPhrases: extract REAL phrases from transcript, not invented ones.
5. modelAnswer: write a genuine Band 8.5+ answer (150-200 words for Part 1, 250+ for Part 2).
6. pronunciationNotes: pick the 5 most common mispronounced words for Vietnamese learners present in the transcript.
7. keyVocabulary: pick 6 most useful words from the question/transcript context.

## IELTS Band Descriptors Applied
FC: fluency, hesitation frequency, coherence, discourse markers, topic relevance
LR: vocabulary range, collocations, paraphrase ability, idiomatic language
GRA: structure variety, complex sentences, error frequency, tense accuracy
PRO: intelligibility, stress patterns, intonation, segmental accuracy

## Output: ONLY valid JSON, no markdown
{
  "overallBand": <0-9 step 0.5>,
  "transcript": ${JSON.stringify(transcript)},
  "question": ${JSON.stringify(itemPrompt)},
  "part": ${part},

  "criteria": {
    "fluencyCoherence": {
      "name": "Fluency and Coherence",
      "band": <0-9 step 0.5>,
      "feedback": "<5+ sentences in Vietnamese: tổng quan → trích dẫn điểm mạnh → trích dẫn điểm yếu → giải thích tại sao → cần làm gì để lên band ${nextBand}>",
      "strengths": [
        "<strength 1 in Vietnamese with direct quote from transcript>",
        "<strength 2 in Vietnamese with direct quote>"
      ],
      "improvements": [
        "<improvement 1 in Vietnamese: quote lỗi + giải thích tại sao sai + cách sửa cụ thể>",
        "<improvement 2 in Vietnamese: quote lỗi + cách sửa>",
        "<improvement 3 in Vietnamese>"
      ],
      "keyPhrases": ["<discourse marker used or missing>", "<cohesive device>", "<linking phrase>"]
    },

    "lexicalResource": {
      "name": "Lexical Resource",
      "band": <0-9 step 0.5>,
      "feedback": "<5+ sentences in Vietnamese: đánh giá vốn từ → từ dùng tốt → từ dùng sai/yếu → collocations → tip nâng band>",
      "strengths": [
        "<strength with quote>",
        "<strength with quote>"
      ],
      "improvements": [
        "<quote từ yếu + gợi ý từ thay thế học thuật hơn>",
        "<lỗi collocation cụ thể + cách sửa>",
        "<paraphrase suggestion>"
      ],
      "keyPhrases": [
        "<good vocab word used>",
        "<suggested upgrade: basic_word → academic_alternative>",
        "<useful collocation for this topic>"
      ]
    },

    "grammaticalRange": {
      "name": "Grammatical Range and Accuracy",
      "band": <0-9 step 0.5>,
      "feedback": "<5+ sentences in Vietnamese: đánh giá độ đa dạng cấu trúc → trích lỗi 1 + giải thích rule → trích lỗi 2 → cấu trúc phức hợp đã/chưa dùng → cần luyện gì>",
      "strengths": [
        "<correct complex structure used, quoted>",
        "<correct tense usage, quoted>"
      ],
      "improvements": [
        "<quote lỗi ngữ pháp 1 + rule giải thích + bản sửa>",
        "<quote lỗi ngữ pháp 2 + rule + bản sửa>",
        "<cấu trúc nên thêm vào bài: relative clause/conditional/passive...>"
      ]
    },

    "pronunciation": {
      "name": "Pronunciation",
      "band": <0-9 step 0.5>,
      "feedback": "<4+ sentences in Vietnamese: đánh giá tổng thể → vấn đề phát âm thường gặp với người Việt → intonation → stress → lời khuyên cụ thể>",
      "strengths": [
        "<aspect of pronunciation likely good based on text>",
        "<positive observation>"
      ],
      "improvements": [
        "<âm cụ thể người Việt hay sai + ví dụ>",
        "<word stress issue + example>",
        "<intonation tip for questions/statements>"
      ]
    }
  },

  "generalFeedback": "<6-8 sentences in Vietnamese: tóm tắt toàn bộ bài → điểm mạnh nhất với quote → điểm yếu nghiêm trọng nhất với quote → so sánh với band ${nextBand} → lộ trình cải thiện cụ thể 2-3 tuần>",

  "modelAnswer": "<WRITE IN ENGLISH ONLY — NO VIETNAMESE. This is a spoken English model answer at Band 8.5+. Use advanced vocabulary, discourse markers, complex grammar. Part 1: 120-150 words. Part 2: 220-250 words. Part 3: 150-200 words. Start directly with the answer, e.g. 'Absolutely, I do like my hometown...' — do not include any Vietnamese text here>",

  "keyVocabulary": [
    { "word": "<ENGLISH word — must be useful for IELTS Speaking>", "definition": "<nghĩa tiếng Việt>", "example": "<ENGLISH example sentence at Band 7+ level — no Vietnamese>" },
    { "word": "<ENGLISH word>", "definition": "<nghĩa tiếng Việt>", "example": "<ENGLISH sentence>" },
    { "word": "<ENGLISH word>", "definition": "<nghĩa tiếng Việt>", "example": "<ENGLISH sentence>" },
    { "word": "<ENGLISH word>", "definition": "<nghĩa tiếng Việt>", "example": "<ENGLISH sentence>" },
    { "word": "<ENGLISH word>", "definition": "<nghĩa tiếng Việt>", "example": "<ENGLISH sentence>" },
    { "word": "<ENGLISH word>", "definition": "<nghĩa tiếng Việt>", "example": "<ENGLISH sentence>" }
  ],

  "pronunciationNotes": [
    { "word": "<word from transcript>", "ipa": "/<IPA>/", "tip": "<hướng dẫn phát âm cho người Việt>" },
    { "word": "<word>", "ipa": "/<IPA>/", "tip": "<tip>" },
    { "word": "<word>", "ipa": "/<IPA>/", "tip": "<tip>" },
    { "word": "<word>", "ipa": "/<IPA>/", "tip": "<tip>" },
    { "word": "<word>", "ipa": "/<IPA>/", "tip": "<tip>" }
  ]
}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// WRITING
// ─────────────────────────────────────────────────────────────────────────────

export function buildWritingGradingPrompt(input: WritingGradingInput): string {
  const { essay, taskPrompt, taskType, targetBand, wordCount, lessonLevel } = input;
  const truncated = essay.length > 4500 ? essay.slice(0, 4500) + '…' : essay;
  const firstCriterion = taskType === 'task1' ? 'Task Achievement' : 'Task Response';
  const nextBand = Math.min(9, targetBand + 0.5);

  return `You are a strict IELTS Writing examiner with 15+ years of experience. Provide EXHAUSTIVE analysis.

LANGUAGE RULE: ALL feedback, summaries, tips, labels in VIETNAMESE. Only exact quotes from the essay or English vocabulary examples in English.

## Task Info
- Type: ${taskType === 'task1' ? 'Task 1 (Academic)' : 'Task 2 (Essay)'}
- Target band: ${targetBand} → Next milestone: ${nextBand}
- Word count: ${wordCount}
${lessonLevel ? `- Level: ${lessonLevel}` : ''}

## Prompt
${taskPrompt}

## Essay
${truncated}

## MANDATORY REQUIREMENTS — VIOLATIONS WILL BE REJECTED
1. sentenceFeedback: MINIMUM 8 sentences from the essay. Each must have a specific quote + detailed explanation.
2. grammarAnalysis.commonErrors: MINIMUM 4 real errors found in this essay with exact quotes.
3. lexicalAnalysis.suggestedUpgrades: MINIMUM 6 specific word upgrades from words actually in the essay.
4. coherenceAnalysis.linkingWordsUsed: list ALL linking words actually found in the essay.
5. ALL tips/summaries must be essay-specific, not generic. Quote the essay.
6. Do NOT write "Cần cải thiện" without explaining HOW and WHY with a specific example.
7. correctedExamples: MINIMUM 5 real sentences from the essay with full corrections.
8. Scores must reflect real band descriptors — band 6 essay must NOT be scored 7+.

## Band Score Guidelines
- Task Response/Achievement 4-5: addresses topic but underdeveloped, some irrelevance
- Task Response/Achievement 6-7: addresses all parts, position clear, some development needed
- Task Response/Achievement 8-9: fully addresses, well-developed, precise position
- CC 4-5: some organization, limited cohesion, paragraphing faulty
- CC 6-7: organized, varied linking, some errors in cohesion
- CC 8-9: seamlessly organized, wide range of cohesive devices, perfect paragraphing
- LR 4-5: limited vocabulary, repetition, errors in word choice
- LR 6-7: adequate range, some errors, attempts paraphrase
- LR 8-9: wide range, precise collocations, rare errors
- GRA 4-5: limited structures, frequent errors
- GRA 6-7: mix of simple/complex, some errors
- GRA 8-9: wide range, flexible, rare errors

## Output: ONLY valid JSON, no markdown
{
  "skill": "writing",
  "taskType": "${taskType}",
  "bandScore": <0-9 step 0.5>,
  "estimatedCefrLevel": "<A1|A2|B1|B2|C1|C2>",
  "confidence": "<low|medium|high>",

  "overallFeedback": "<6-8 sentences in Vietnamese: tổng quan bài viết → điểm mạnh nhất với quote → điểm yếu nghiêm trọng nhất với quote → so sánh với band ${nextBand} → 2-3 hành động cụ thể nhất cần làm ngay>",

  "criteria": [
    {
      "name": "${firstCriterion}",
      "score": <0-9 step 0.5>,
      "feedback": "<5+ sentences in Vietnamese: (1) mức độ đáp ứng yêu cầu đề bài, (2) quote câu trả lời đúng trọng tâm, (3) quote phần thiếu/lạc đề, (4) so sánh với band ${nextBand}, (5) cách cải thiện cụ thể>"
    },
    {
      "name": "Coherence and Cohesion",
      "score": <0-9 step 0.5>,
      "feedback": "<5+ sentences in Vietnamese: (1) cấu trúc đoạn văn, (2) quote câu liên kết tốt, (3) quote chỗ liên kết kém/thiếu, (4) đánh giá paragraph flow, (5) cải thiện cụ thể>"
    },
    {
      "name": "Lexical Resource",
      "score": <0-9 step 0.5>,
      "feedback": "<5+ sentences in Vietnamese: (1) đánh giá vốn từ tổng quan, (2) quote từ/cụm dùng tốt, (3) quote 2-3 từ yếu với từ thay thế, (4) lỗi collocation nếu có, (5) tip tăng LR>"
    },
    {
      "name": "Grammatical Range and Accuracy",
      "score": <0-9 step 0.5>,
      "feedback": "<5+ sentences in Vietnamese: (1) tổng quan độ đa dạng, (2) quote cấu trúc phức tốt nếu có, (3) quote lỗi 1 + giải thích rule, (4) quote lỗi 2 + rule, (5) cấu trúc nên thêm vào>"
    }
  ],

  "sentenceFeedback": [
    {
      "original": "<exact sentence from essay — MUST exist in essay>",
      "issues": ["<issue type: grammar|word_choice|clarity|coherence|task_response>"],
      "suggestion": "<fully rewritten sentence — must be noticeably better>",
      "explanation": "<3-4 sentences in Vietnamese: tại sao câu gốc có vấn đề, rule ngữ pháp/từ vựng nào bị vi phạm, tại sao bản sửa tốt hơn>",
      "severity": "<minor|major>",
      "criterionTag": "<lexical|grammar|task|coherence>"
    }
  ],

  "taskAnalysis": {
    "responseLevel": "<Không đáp ứng|Đáp ứng một phần|Đáp ứng đầy đủ|Đáp ứng xuất sắc>",
    "responseLabel": "<LABEL NGẮN IN HOA>",
    "responseSummary": "<4-5 sentences in Vietnamese: bài có trả lời đúng trọng tâm không, quote câu topic sentence, điểm thiếu cụ thể, so sánh với yêu cầu đề bài>",
    "responseTips": [
      "<tip 1: rất cụ thể, ví dụ 'Thêm luận điểm về X vì đề bài hỏi cả hai mặt Y và Z'>",
      "<tip 2: cụ thể>",
      "<tip 3: cụ thể>"
    ],
    "ideaDevelopmentLevel": "<Thiếu ý|Sơ sài|Phát triển tốt|Phát triển xuất sắc>",
    "ideaDevelopmentLabel": "<LABEL NGẮN IN HOA>",
    "ideaDevelopmentSummary": "<4-5 sentences: đánh giá độ sâu của lập luận, quote câu ví dụ tốt nhất, quote phần lập luận yếu nhất, so sánh với band ${nextBand}>",
    "ideaDevelopmentTips": [
      "<tip cụ thể về cách develop idea: ví dụ 'Sau câu X, thêm số liệu hoặc ví dụ cụ thể như...'>",
      "<tip 2>",
      "<tip 3>"
    ]
  },

  "grammarAnalysis": {
    "diversityLevel": "<Hạn chế|Trung bình|Đa dạng|Rất đa dạng và chính xác>",
    "diversityLabel": "<LABEL NGẮN IN HOA>",
    "diversitySummary": "<4-5 sentences: loại cấu trúc đã dùng (simple/compound/complex), quote câu phức tốt nhất nếu có, cấu trúc thiếu, so sánh band ${nextBand}>",
    "diversityTips": [
      "<ví dụ: 'Thêm mệnh đề quan hệ: thay vì viết X, viết Y với relative clause'>",
      "<ví dụ: 'Dùng passive voice trong context Z'>",
      "<ví dụ: 'Thêm conditional sentence loại 2 để đưa ra giả thuyết'>"
    ],
    "accuracyLevel": "<Nhiều lỗi hệ thống|Lỗi đáng kể|Ít lỗi|Không có lỗi hệ thống>",
    "accuracyLabel": "<LABEL NGẮN IN HOA>",
    "accuracySummary": "<4-5 sentences: tần suất lỗi, loại lỗi phổ biến nhất, ảnh hưởng đến độ hiểu, quote 2 lỗi>",
    "accuracyTips": [
      "<tip cụ thể: 'Lỗi subject-verb agreement: quote + rule + cách nhớ'>",
      "<tip cụ thể: 'Lỗi tense: quote + giải thích + bản sửa'>"
    ],
    "commonErrors": [
      {
        "pattern": "<tên lỗi: ví dụ Subject-Verb Agreement>",
        "example": "<exact quote from essay>",
        "fix": "<corrected version>",
        "rule": "<giải thích rule trong 2 câu tiếng Việt>"
      },
      {
        "pattern": "<tên lỗi>",
        "example": "<exact quote>",
        "fix": "<correction>",
        "rule": "<rule>"
      },
      {
        "pattern": "<tên lỗi>",
        "example": "<exact quote>",
        "fix": "<correction>",
        "rule": "<rule>"
      },
      {
        "pattern": "<tên lỗi>",
        "example": "<exact quote>",
        "fix": "<correction>",
        "rule": "<rule>"
      }
    ]
  },

  "coherenceAnalysis": {
    "flowLevel": "<Khó theo dõi|Có gián đoạn|Tương đối mạch lạc|Rất mạch lạc|Hoàn toàn mạch lạc>",
    "flowLabel": "<LABEL NGẮN IN HOA>",
    "flowSummary": "<4-5 sentences: đánh giá luồng lập luận từ đầu đến cuối, quote chỗ chuyển ý tốt, quote chỗ đứt đoạn, đề xuất cải thiện>",
    "flowTips": [
      "<tip cụ thể: 'Giữa đoạn 2 và 3, thêm câu chuyển tiếp như...'>",
      "<tip 2>",
      "<tip 3>"
    ],
    "paragraphLevel": "<Không rõ ràng|Cần cải thiện|Chia đoạn hiệu quả|Xuất sắc>",
    "paragraphLabel": "<LABEL>",
    "paragraphSummary": "<3-4 sentences: cấu trúc intro/body/conclusion, topic sentence có rõ không, quote>",
    "paragraphTips": ["<tip 1>", "<tip 2>"],
    "referencingLevel": "<Không sử dụng|Hạn chế|Sử dụng thành thạo|Hoàn hảo>",
    "referencingLabel": "<LABEL>",
    "referencingSummary": "<3-4 sentences về pronouns, substitution, referencing chains>",
    "referencingTips": ["<tip cụ thể>", "<tip 2>"],
    "linkingWordsUsed": ["<ALL linking words actually found in essay>"],
    "missingLinks": [
      "<suggested: 'furthermore' để nối ý X với Y>",
      "<suggested: 'in contrast' để đối lập với...>",
      "<suggested: 'as a result' để kết quả của...>"
    ]
  },

  "lexicalAnalysis": {
    "diversityLevel": "<Rất hạn chế|Hạn chế|Trung bình|Phong phú|Xuất sắc>",
    "diversityLabel": "<LABEL NGẮN IN HOA>",
    "diversitySummary": "<4-5 sentences: đánh giá vốn từ, từ học thuật đã dùng, quote từ tốt nhất, quote từ yếu nhất, so sánh band ${nextBand}>",
    "diversityTips": [
      "<tip: 'Từ X xuất hiện N lần — thay bằng Y/Z/W để tăng điểm LR'>",
      "<tip 2>",
      "<tip 3>"
    ],
    "overusedWords": ["<word repeated 3+ times>", "<another overused word>"],
    "suggestedUpgrades": [
      { "original": "<basic word from essay>", "upgrade": "<academic/precise alternative>", "example": "<example sentence using upgrade>" },
      { "original": "<word>", "upgrade": "<upgrade>", "example": "<example>" },
      { "original": "<word>", "upgrade": "<upgrade>", "example": "<example>" },
      { "original": "<word>", "upgrade": "<upgrade>", "example": "<example>" },
      { "original": "<word>", "upgrade": "<upgrade>", "example": "<example>" },
      { "original": "<word>", "upgrade": "<upgrade>", "example": "<example>" }
    ]
  },

  "strengths": [
    "<strength 1: very specific, quote from essay, explain why it's good>",
    "<strength 2: specific with quote>",
    "<strength 3: specific>"
  ],
  "weaknesses": [
    "<weakness 1: specific quote + explain impact on band score>",
    "<weakness 2: specific quote + impact>",
    "<weakness 3: specific>"
  ],
  "suggestions": [
    "<tip 1: rất cụ thể với ví dụ thực tế>",
    "<tip 2>",
    "<tip 3>",
    "<tip 4>"
  ],
  "correctedExamples": [
    { "original": "<exact sentence from essay>", "suggestion": "<improved version>", "explanation": "<2-3 sentences Vietnamese: what changed and why>" },
    { "original": "<exact sentence>", "suggestion": "<improved>", "explanation": "<explanation>" },
    { "original": "<exact sentence>", "suggestion": "<improved>", "explanation": "<explanation>" },
    { "original": "<exact sentence>", "suggestion": "<improved>", "explanation": "<explanation>" },
    { "original": "<exact sentence>", "suggestion": "<improved>", "explanation": "<explanation>" }
  ]
}`;
}