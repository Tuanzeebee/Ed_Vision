import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { readFileSync } from 'fs';
import { extname } from 'path';

// ─────────────────────────────────────────────────────────────────────────────
// OpenRouter Vision Service
// ─────────────────────────────────────────────────────────────────────────────
// Calls OpenRouter API with a vision-capable model (Gemma 4 27B / Gemma 3 27B)
// to analyze TOEIC Listening images and map them to question numbers.
//
// Required env var: OPENROUTER_API_KEY
// Optional env var: OPENROUTER_MODEL (default: google/gemma-3-27b-it)
// ─────────────────────────────────────────────────────────────────────────────

export interface ImageQuestionMapping {
  image_filename: string;
  question_numbers: number[];
  confidence: number;
  description: string;
}

export interface ImageMappingResult {
  mappings: ImageQuestionMapping[];
  model_used: string;
  error?: string;
}

export interface ImageAssetForMapping {
  filename: string;
  abs_path: string;
  url_path: string;
  page: number;
  width: number;
  height: number;
  size_bytes: number;
  estimated_part: number | null;
}

export interface QuestionContext {
  question_number: number;
  part: number;
  stem: string;
  transcript_hint?: string;
}

@Injectable()
export class OpenRouterService {
  private readonly logger = new Logger(OpenRouterService.name);
  private readonly apiKey = process.env.OPENROUTER_API_KEY;
  private readonly model =
    process.env.OPENROUTER_MODEL_NAME || process.env.OPENROUTER_MODEL || 'google/gemma-3-27b-it';
  private readonly apiUrl =
    'https://openrouter.ai/api/v1/chat/completions';

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  /**
   * Map Part 3/4 images to TOEIC question numbers using vision LLM.
   *
   * Strategy:
   *   1. For each image, encode it as base64.
   *   2. Send the image + question list + transcript hints to the LLM.
   *   3. LLM returns which question_numbers this image belongs to.
   *
   * Part 3: each conversation has 3 questions (e.g., Q32-34, Q35-37, …)
   * Part 4: each talk has 3 questions (e.g., Q71-73, Q74-76, …)
   * Images in Part 3/4 are typically:
   *   - Tables, schedules, maps, charts, coupons, forms
   *   - Each image relates to ONE conversation/talk group (3 questions)
   */
  async mapImagesToQuestions(
    images: ImageAssetForMapping[],
    questions: QuestionContext[],
  ): Promise<ImageMappingResult> {
    if (!this.apiKey) {
      this.logger.warn('OPENROUTER_API_KEY not set — skipping image mapping.');
      return { mappings: [], model_used: 'none', error: 'API key not configured' };
    }

    if (images.length === 0) {
      return { mappings: [], model_used: this.model };
    }

    // Build question context for the prompt
    const part34Questions = questions.filter(q => q.part === 3 || q.part === 4);
    if (part34Questions.length === 0) {
      return { mappings: [], model_used: this.model };
    }

    // Group questions by talk (every 3 consecutive questions)
    const talkGroups: Array<{ start: number; end: number; part: number; hints: string[] }> = [];
    for (const q of part34Questions) {
      const lastGroup = talkGroups[talkGroups.length - 1];
      if (lastGroup && lastGroup.part === q.part && q.question_number === lastGroup.end + 1 && (q.question_number - lastGroup.start) < 3) {
        lastGroup.end = q.question_number;
        if (q.transcript_hint) lastGroup.hints.push(q.transcript_hint);
      } else {
        talkGroups.push({
          start: q.question_number,
          end: q.question_number,
          part: q.part,
          hints: q.transcript_hint ? [q.transcript_hint] : [],
        });
      }
    }

    const talkGroupsSummary = talkGroups
      .map(g => `Q${g.start}-${g.end} (Part ${g.part})${g.hints.length > 0 ? ': ' + g.hints.join(' ').slice(0, 100) : ''}`)
      .join('\n');

    const allMappings: ImageQuestionMapping[] = [];

    // Process images one at a time to stay within token limits
    for (const image of images) {
      try {
        const mapping = await this.mapSingleImage(image, talkGroupsSummary, talkGroups);
        if (mapping) {
          allMappings.push(mapping);
        }
      } catch (err) {
        this.logger.warn(
          `Failed to map image ${image.filename}: ${String(err)}`,
        );
      }
    }

    return { mappings: allMappings, model_used: this.model };
  }

  private async mapSingleImage(
    image: ImageAssetForMapping,
    talkGroupsSummary: string,
    talkGroups: Array<{ start: number; end: number; part: number; hints: string[] }>,
  ): Promise<ImageQuestionMapping | null> {
    const base64 = this.imageToBase64(image.abs_path);
    if (!base64) return null;

    const ext = extname(image.filename).toLowerCase().replace('.', '');
    const mimeType = ext === 'webp' ? 'image/webp'
      : ext === 'png' ? 'image/png'
      : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
      : 'image/webp';

    const prompt = `You are analyzing a TOEIC Listening test image. This image was extracted from a PDF containing a TOEIC Listening test (Part 3 and Part 4).

In TOEIC Listening Part 3 (Conversations) and Part 4 (Talks), some question groups have an associated graphic (table, chart, map, schedule, coupon, form, etc.) that test-takers must look at while listening.

Each question group has exactly 3 consecutive questions. Here are all the question groups:

${talkGroupsSummary}

Look at this image carefully. Determine which question group (3 consecutive questions) this image belongs to.

Consider:
- The content/topic of the image (e.g., a schedule matches a conversation about scheduling)
- The page number where this image was found (page ${image.page})
- Images typically appear near their associated questions in the PDF

Respond with ONLY a JSON object in this exact format:
{
  "question_start": <first question number of the group>,
  "question_end": <last question number of the group>,
  "confidence": <0.0 to 1.0>,
  "description": "<brief description of what the image shows>"
}

If you cannot determine which group this image belongs to, respond with:
{ "question_start": 0, "question_end": 0, "confidence": 0, "description": "unrecognized" }`;

    const maxRetries = 2;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        const response = await axios.post(
          this.apiUrl,
          {
            model: this.model,
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'image_url',
                    image_url: { url: `data:${mimeType};base64,${base64}` },
                  },
                  { type: 'text', text: prompt },
                ],
              },
            ],
            temperature: 0.1,
            max_tokens: 200,
          },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://ed-vision.app',
              'X-Title': 'Ed Vision TOEIC Import',
            },
            timeout: 30_000,
          },
        );

        const content = response.data?.choices?.[0]?.message?.content ?? '';
        const cleaned = content
          .replace(/```json\s*/gi, '')
          .replace(/```\s*/g, '')
          .trim();

        const parsed = JSON.parse(cleaned);
        const qStart = Number(parsed.question_start) || 0;
        const qEnd = Number(parsed.question_end) || 0;
        const confidence = Math.min(1, Math.max(0, Number(parsed.confidence) || 0));
        const description = String(parsed.description || '');

        if (qStart === 0 || qEnd === 0 || confidence < 0.3) {
          this.logger.debug(
            `Image ${image.filename}: LLM returned low confidence (${confidence}) or no match.`,
          );
          return null;
        }

        // Validate that the question range matches a known talk group
        const matchedGroup = talkGroups.find(
          g => g.start === qStart || (qStart >= g.start && qStart <= g.end),
        );

        const questionNumbers: number[] = [];
        if (matchedGroup) {
          for (let q = matchedGroup.start; q <= matchedGroup.end; q++) {
            questionNumbers.push(q);
          }
        } else {
          // Use the LLM's range directly
          for (let q = qStart; q <= qEnd && q <= qStart + 2; q++) {
            questionNumbers.push(q);
          }
        }

        this.logger.log(
          `Image ${image.filename} → Q${questionNumbers.join(',')} (confidence=${confidence}) — ${description}`,
        );

        return {
          image_filename: image.filename,
          question_numbers: questionNumbers,
          confidence,
          description,
        };
      } catch (error: any) {
        attempt++;
        const status = error.response?.status;

        if (status === 429 && attempt < maxRetries) {
          const delay = 3000 * attempt;
          this.logger.warn(
            `OpenRouter 429 rate limit. Retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`,
          );
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        this.logger.error(
          `OpenRouter API error for ${image.filename}:`,
          error.response?.data || error.message,
        );
        return null;
      }
    }

    return null;
  }

  private imageToBase64(absPath: string): string | null {
    try {
      const buffer = readFileSync(absPath);
      return buffer.toString('base64');
    } catch (err) {
      this.logger.warn(`Cannot read image file: ${absPath} — ${String(err)}`);
      return null;
    }
  }
}
