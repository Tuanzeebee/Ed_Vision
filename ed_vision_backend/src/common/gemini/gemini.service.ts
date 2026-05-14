import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface GeminiGenerateOptions {
  temperature?: number;
  maxOutputTokens?: number;
  timeoutMs?: number;
}

const DEFAULT_TEMPERATURE = 0.1;
const DEFAULT_MAX_TOKENS = 2048;
const DEFAULT_TIMEOUT_MS = 60_000;

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private client: GoogleGenerativeAI | null = null;

  private getClient(): GoogleGenerativeAI {
    if (!this.client) {
      const apiKey =
        process.env.GEMINI_API_KEY ?? 'AIzaSyBJKJ0EFrKxPN6_CS0oWmCMRE2EIt9BAAg';
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY environment variable is not set');
      }
      this.client = new GoogleGenerativeAI(apiKey);
    }
    return this.client;
  }

  private resolveModel(): string {
    return 'gemini-3-flash-preview';
  }

  async generate(
    prompt: string,
    options: GeminiGenerateOptions = {},
  ): Promise<string> {
    const {
      temperature = DEFAULT_TEMPERATURE,
      maxOutputTokens = DEFAULT_MAX_TOKENS,
      timeoutMs = DEFAULT_TIMEOUT_MS,
    } = options;

    const model = this.getClient().getGenerativeModel({
      model: this.resolveModel(),
      generationConfig: {
        temperature,
        maxOutputTokens,
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () =>
          reject(new Error(`Gemini request timed out after ${timeoutMs}ms`)),
        timeoutMs,
      ),
    );

    const generatePromise = model.generateContent(prompt);

    const result = await Promise.race([generatePromise, timeoutPromise]);
    const response = result.response;
    return response.text();
  }

  async generateJson<T>(
    prompt: string,
    options: GeminiGenerateOptions = {},
  ): Promise<T> {
    const raw = await this.generate(prompt, options);

    // Strip markdown code fences (```json ... ```)
    const stripped = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim();

    // Extract JSON object via regex in case of any surrounding text
    const match = stripped.match(/\{[\s\S]*\}/);
    if (!match) {
      this.logger.warn('Could not extract JSON from Gemini response');
      throw new Error('Gemini response did not contain valid JSON');
    }

    return JSON.parse(match[0]) as T;
  }

  async transcribeAudio(
    audioBuffer: Buffer,
    mimeType: string,
    timeoutMs = 30_000,
  ): Promise<string> {
    const model = this.getClient().getGenerativeModel({
      model: 'gemini-2.0-flash',
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Gemini STT timed out after ${timeoutMs}ms`)),
        timeoutMs,
      ),
    );

    const generatePromise = model.generateContent([
      {
        inlineData: {
          data: audioBuffer.toString('base64'),
          mimeType,
        },
      },
      {
        text: 'Transcribe exactly what is spoken in this audio. Return only the transcript text, nothing else.',
      },
    ]);

    const result = await Promise.race([generatePromise, timeoutPromise]);
    return result.response.text().trim();
  }

  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.generate('Say "ok" in one word.', {
        maxOutputTokens: 16,
        timeoutMs: 10_000,
      });
      return typeof result === 'string' && result.length > 0;
    } catch (err) {
      this.logger.warn(`Gemini health check failed: ${(err as Error).message}`);
      return false;
    }
  }
}
