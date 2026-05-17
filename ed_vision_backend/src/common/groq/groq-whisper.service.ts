import { Injectable, Logger } from '@nestjs/common';
import FormData from 'form-data';
import fetch from 'node-fetch';

@Injectable()
export class GroqWhisperService {
  private readonly logger = new Logger(GroqWhisperService.name);
  private readonly apiKey: string;
  private readonly apiUrl = 'https://api.groq.com/openai/v1/audio/transcriptions';

  constructor() {
    this.apiKey = process.env.GROQ_API_KEY ?? '';
    if (!this.apiKey) {
      this.logger.warn('GROQ_API_KEY is not set — Whisper transcription will fail');
    }
  }

  /**
   * Transcribe audio buffer using Groq Whisper large-v3
   * @param audioBuffer  Raw audio bytes
   * @param mimeType     e.g. 'audio/webm', 'audio/mp4', 'audio/ogg'
   * @param timeoutMs    Default 30s
   */
  async transcribe(
    audioBuffer: Buffer,
    mimeType: string,
    timeoutMs = 30_000,
  ): Promise<string> {
    // Map mimeType → file extension (Groq requires a filename with correct ext)
    const ext = this.mimeToExt(mimeType);
    const filename = `recording.${ext}`;

    const form = new FormData();
    form.append('file', audioBuffer, {
      filename,
      contentType: mimeType,
      knownLength: audioBuffer.length,
    });
    form.append('model', 'whisper-large-v3');
    form.append('language', 'en');
    form.append('response_format', 'json');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          ...form.getHeaders(),
        },
        body: form,
        signal: controller.signal as any,
      });

      if (!res.ok) {
        const errText = await res.text();
        this.logger.error(`Groq Whisper error ${res.status}: ${errText}`);
        throw new Error(`Groq Whisper API error ${res.status}: ${errText}`);
      }

      const data = (await res.json()) as { text: string };
      return (data.text ?? '').trim();
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error(`Groq Whisper timed out after ${timeoutMs}ms`);
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  private mimeToExt(mimeType: string): string {
    if (mimeType.includes('mp4') || mimeType.includes('m4a')) return 'm4a';
    if (mimeType.includes('ogg')) return 'ogg';
    if (mimeType.includes('mpeg') || mimeType.includes('mp3')) return 'mp3';
    if (mimeType.includes('wav')) return 'wav';
    return 'webm'; // default
  }
}
