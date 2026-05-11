/**
 * IRT Refinement Service
 * Calls Gemini API to produce accurate irt_b (difficulty) values
 * based on actual question content and passage context.
 */

import { Injectable, Logger } from '@nestjs/common';
import { OpenRouterService } from '../../common/services/openrouter.service';
import { clampIrtB } from '../utils/irt-bootstrap.util';

export interface IrtRefinementInput {
  questionText: string;
  questionType: string;
  passageContext?: string; // First 500 chars of passage/section
  options?: string[];
  answerKey?: string;
  targetBand?: number; // Provided hint (4–9)
}

export interface IrtRefinementOutput {
  irt_b: number;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
}

@Injectable()
export class IrtRefinementService {
  private readonly logger = new Logger(IrtRefinementService.name);

  constructor(private readonly openRouterService: OpenRouterService) {}

  async refineIrtB(input: IrtRefinementInput): Promise<IrtRefinementOutput> {
    const prompt = this.buildPrompt(input);

    try {
      const parsed = await this.openRouterService.generateJson<{
        irt_b: number;
        confidence: string;
        reasoning: string;
      }>(prompt, { temperature: 0.1 });

      return {
        irt_b: clampIrtB(parsed.irt_b ?? 0),
        confidence: (['high', 'medium', 'low'].includes(parsed.confidence)
          ? parsed.confidence
          : 'medium') as 'high' | 'medium' | 'low',
        reasoning: parsed.reasoning ?? '',
      };
    } catch (err) {
      this.logger.warn(`Gemini IRT refinement failed, using heuristic: ${err}`);
      // Graceful fallback: return heuristic estimate
      const fallbackB = input.targetBand
        ? ((input.targetBand - 4) / 5) * 4.5 - 2.0
        : 0.0;
      return {
        irt_b: clampIrtB(fallbackB),
        confidence: 'low',
        reasoning: 'Fallback — Gemini API unavailable or parse error',
      };
    }
  }

  private buildPrompt(input: IrtRefinementInput): string {
    const contextSnippet = input.passageContext
      ? `\nPASSAGE CONTEXT (first 500 chars):\n${input.passageContext.slice(0, 500)}`
      : '';

    const optionsText = input.options?.length
      ? `\nOPTIONS:\n${input.options.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join('\n')}`
      : '';

    const answerText = input.answerKey ? `\nCORRECT ANSWER: ${input.answerKey}` : '';

    const bandHint = input.targetBand ? `\nTARGET BAND HINT: ${input.targetBand}` : '';

    return `You are an expert IELTS psychometrician calibrating Item Response Theory (IRT) parameters.

Estimate the irt_b (difficulty) parameter for this IELTS ${input.questionType.toUpperCase()} question.
IRT b is on a theta scale: -3.0 (very easy, all students pass) to +3.0 (very hard, only top students pass).
Typical IELTS range: Band 4 ≈ -2.0, Band 6.5 ≈ 0.0, Band 9 ≈ +2.5.
${bandHint}
${contextSnippet}

QUESTION TYPE: ${input.questionType}
QUESTION: ${input.questionText}
${optionsText}
${answerText}

Consider:
- Vocabulary complexity and academic register
- Inferential reasoning required vs. literal comprehension
- Length and syntactic complexity
- How abstract or nuanced the correct answer is
- Whether the answer requires cross-referencing information

Respond ONLY in this exact JSON format:
{"irt_b": <number -3.0 to 3.0>, "confidence": "high|medium|low", "reasoning": "1 sentence"}`;
  }
}
