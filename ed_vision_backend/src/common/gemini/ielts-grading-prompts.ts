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

  const truncated =
    essay.length > 4000 ? essay.slice(0, 4000) + '…[truncated]' : essay;

  const task1Criteria = `
1. **Task Achievement (TA)**: Does the response fulfil the task requirements? (Task 1: describe/summarise the visual data accurately)
2. **Coherence and Cohesion (CC)**: Organisation, paragraphing, cohesive devices
3. **Lexical Resource (LR)**: Vocabulary range, accuracy, collocations
4. **Grammatical Range and Accuracy (GRA)**: Grammar structures, complexity, error frequency`;

  const task2Criteria = `
1. **Task Response (TR)**: Does the response address all parts of the task with fully-developed ideas?
2. **Coherence and Cohesion (CC)**: Organisation, paragraphing, cohesive devices
3. **Lexical Resource (LR)**: Vocabulary range, accuracy, collocations
4. **Grammatical Range and Accuracy (GRA)**: Grammar structures, complexity, error frequency`;

  const criteria = taskType === 'task1' ? task1Criteria : task2Criteria;
  const firstCriterionName = taskType === 'task1' ? 'Task Achievement' : 'Task Response';

  return `You are an expert IELTS examiner. Grade the following IELTS Writing ${taskType === 'task1' ? 'Task 1' : 'Task 2'} response strictly according to official IELTS band descriptors.

## Task Information
- Writing task: ${taskType === 'task1' ? 'Task 1 (Academic)' : 'Task 2 (Essay)'}
- Target band: ${targetBand}
- Word count: ${wordCount}${lessonLevel ? `\n- Lesson level: ${lessonLevel}` : ''}

## Writing Prompt
${taskPrompt}

## Student Essay
${truncated}

## Grading Instructions
Evaluate the response on the four official IELTS Writing criteria:
${criteria}

Score each criterion from 0 to 9 in 0.5 steps. Be strict but fair.

Note: Task 2 has minimum 250 words; Task 1 has minimum 150 words. Penalise significantly if under-length.

## Required JSON Output (ONLY output valid JSON, no markdown, no extra text)
{
  "skill": "writing",
  "taskType": "${taskType}",
  "bandScore": <overall band 0-9 in 0.5 steps>,
  "criteria": [
    { "name": "${firstCriterionName}", "score": <0-9>, "feedback": "<1-2 sentences>" },
    { "name": "Coherence and Cohesion", "score": <0-9>, "feedback": "<1-2 sentences>" },
    { "name": "Lexical Resource", "score": <0-9>, "feedback": "<1-2 sentences>" },
    { "name": "Grammatical Range and Accuracy", "score": <0-9>, "feedback": "<1-2 sentences>" }
  ],
  "overallFeedback": "<2-3 sentences summarising performance>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>"],
  "suggestions": ["<actionable tip 1>", "<actionable tip 2>", "<actionable tip 3>"],
  "correctedExamples": [
    { "original": "<sentence from essay with error>", "suggestion": "<corrected version>", "explanation": "<brief grammar/lexical note>" }
  ],
  "estimatedCefrLevel": "<A1|A2|B1|B2|C1|C2>",
  "confidence": "<low|medium|high>"
}`;
}
