import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly apiKey = process.env.GEMINI_API_KEY;
  private readonly apiUrl =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

  async analyzeSurvey(
    questionsAndAnswers: string,
  ): Promise<{ financial_support_score: number; mental_health_score: number }> {
    if (!this.apiKey) {
      this.logger.warn('GEMINI_API_KEY not set, returning default scores');
      return { financial_support_score: 0, mental_health_score: 0 };
    }

    const prompt = `
You are an analysis system.

Input:
- Survey questions and student answers (options or free text).
${questionsAndAnswers}

Task:
Analyze the provided survey questions and answers, then generate exactly two integer values:

1. financial_support_score
2. mental_health_score

Rules:
- Each score must be an integer between 0 and 3.
- 0 = very low / negative
- 3 = very high / positive
- Do not return any explanation or text.
- Output format must be JSON only.

Output example:
{
  "financial_support_score": 2,
  "mental_health_score": 1
}
`;

    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        const response = await axios.post(
          `${this.apiUrl}?key=${this.apiKey}`,
          {
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              responseMimeType: 'application/json',
            },
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          },
        );

        const result = response.data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!result) {
          throw new Error('Empty response from Gemini');
        }

        // Clean markdown code blocks if present
        const cleanedResult = result
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim();

        const parsed = JSON.parse(cleanedResult);

        // Validate output
        const financial = Math.min(
          Math.max(Math.round(Number(parsed.financial_support_score) || 0), 0),
          3,
        );
        const mental = Math.min(
          Math.max(Math.round(Number(parsed.mental_health_score) || 0), 0),
          3,
        );

        return {
          financial_support_score: financial,
          mental_health_score: mental,
        };
      } catch (error) {
        attempt++;
        const status = error.response?.status;

        if (status === 429 && attempt < maxRetries) {
          const delay = 2000 * Math.pow(2, attempt - 1); // 2s, 4s, 8s
          this.logger.warn(
            `Gemini API 429 Too Many Requests. Retrying attempt ${attempt}/${maxRetries} after ${delay}ms...`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        this.logger.error(
          'Error calling Gemini API',
          error.response?.data || error.message,
        );
        // Fallback to default values in case of error
        return { financial_support_score: 0, mental_health_score: 0 };
      }
    }

    return { financial_support_score: 0, mental_health_score: 0 };
  }
}
