import { Injectable, Logger } from '@nestjs/common';
import fetch from 'node-fetch';

export interface GroqGenerateOptions {
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

const DEFAULT_OPTIONS: Required<GroqGenerateOptions> = {
  temperature: 0.1,
  maxTokens: 8192,
  timeoutMs: 60_000,
};

@Injectable()
export class GroqGradingService {
  private readonly logger = new Logger(GroqGradingService.name);
  private readonly apiKey: string;
  private readonly apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
  // llama-3.3-70b-versatile: chất lượng cao, 14400 req/ngày free
  private readonly model = 'llama-3.3-70b-versatile';

  constructor() {
    this.apiKey = process.env.GROQ_API_KEY ?? '';
    if (!this.apiKey) {
      this.logger.warn('GROQ_API_KEY is not set');
    }
  }

  async generate(prompt: string, options: GroqGenerateOptions = {}): Promise<string> {
    const { temperature, maxTokens, timeoutMs } = { ...DEFAULT_OPTIONS, ...options };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert IELTS examiner. Always respond with valid JSON only, no markdown, no extra text.',
            },
            { role: 'user', content: prompt },
          ],
          temperature,
          max_tokens: maxTokens,
          response_format: { type: 'json_object' }, // force JSON mode
        }),
        signal: controller.signal as any,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Groq API error ${res.status}: ${errText}`);
      }

      const data = (await res.json()) as any;
      return data.choices?.[0]?.message?.content ?? '';
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error(`Groq request timed out after ${timeoutMs}ms`);
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  async generateJson<T>(prompt: string, options: GroqGenerateOptions = {}): Promise<T> {
    const raw = await this.generate(prompt, options);

    try {
      return JSON.parse(raw) as T;
    } catch {
      // Strip markdown fences nếu có
      const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
      if (match) {
        try { return JSON.parse(match[1].trim()) as T; } catch {}
      }

      // Extract first {...} block
      const objMatch = raw.match(/\{[\s\S]*\}/);
      if (objMatch) {
        const str = objMatch[0];
        try { return JSON.parse(str) as T; } catch {}
        try { return JSON.parse(str.replace(/[\n\r\t]+/g, ' ')) as T; } catch {}
      }

      this.logger.warn('Could not extract JSON from Groq response. Raw: ' + raw.slice(0, 200));
      throw new Error('Groq response did not contain valid JSON');
    }
  }
}
