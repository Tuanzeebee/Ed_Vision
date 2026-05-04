// src/placement/speaking.service.ts
// STT: Gemini 2.0 Flash multimodal (audio → text) — miễn phí
// Scoring: OpenRouter Gemini Flash — miễn phí

import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import fetch from 'node-fetch';

@Injectable()
export class SpeakingService {
  private readonly logger = new Logger(SpeakingService.name);

  // ── STT: Gemini multimodal audio → transcript ───────────
  async transcribe(audioPath: string): Promise<string> {
    try {
      const audioBuffer = fs.readFileSync(audioPath);
      const base64Audio = audioBuffer.toString('base64');

      // Xác định mimeType từ đuôi file
      const ext = audioPath.split('.').pop()?.toLowerCase() ?? 'webm';
      const mimeType =
        ext === 'webm'
          ? 'audio/webm'
          : ext === 'mp4' || ext === 'm4a'
            ? 'audio/mp4'
            : ext === 'wav'
              ? 'audio/wav'
              : 'audio/webm';

      this.logger.log(
        `[Speaking] Audio size: ${audioBuffer.length} bytes, mime: ${mimeType}`,
      );
      this.logger.log(`[Speaking] Base64 length: ${base64Audio.length}`);

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY_SPEAKING}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    inline_data: {
                      mime_type: mimeType,
                      data: base64Audio,
                    },
                  },
                  {
                    text: 'Transcribe this audio recording exactly as spoken. Return only the transcript text, nothing else.',
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0,
              maxOutputTokens: 1000,
            },
          }),
        },
      );

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Gemini STT error: ${err}`);
      }

      const data = await res.json();
      const transcript = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      this.logger.log(`[Speaking] Transcript: ${transcript}`);
      return transcript.trim();
    } catch (error: any) {
      this.logger.error('[Speaking] Gemini STT failed:', error.message);
      throw new Error('Không thể chuyển đổi audio thành text');
    }
  }

  // ── AI Scoring: OpenRouter Gemini → IELTS band ──────────
  async scoreSpeaking(
    transcript: string,
    prompt: string,
    audioPath: string, // Added audioPath to delete the file
  ): Promise<{ band: number; feedback: string }> {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.0-flash-exp:free',
          max_tokens: 300,
          messages: [
            {
              role: 'system',
              content:
                'You are an IELTS examiner. Return ONLY valid JSON, no markdown, no explanation.',
            },
            {
              role: 'user',
              content: `Speaking prompt: "${prompt}"\n\nCandidate transcript: "${transcript}"\n\nScore on IELTS band (3.0-9.0, steps of 0.5).\nReturn JSON only:\n{"band": 5.5, "feedback": "Nhận xét ngắn bằng tiếng Việt"}`,
            },
          ],
        }),
      });

      const rawText = await res.text();
      this.logger.log(
        `[Speaking] Scoring raw response: ${rawText.slice(0, 500)}`,
      );

      let data: any;
      try {
        data = JSON.parse(rawText);
      } catch {
        this.logger.error('[Speaking] Response is not JSON:', rawText);
        return { band: 5.0, feedback: 'Không thể chấm điểm' };
      }

      const text = data?.choices?.[0]?.message?.content ?? '';
      if (!text) {
        this.logger.error(
          '[Speaking] Empty content from OpenRouter, full response:',
          JSON.stringify(data),
        );
        return { band: 5.0, feedback: 'Không thể chấm điểm' };
      }

      const clean = text.replace(/```json|```/g, '').trim();
      let parsed: any;
      try {
        parsed = JSON.parse(clean);
      } catch {
        this.logger.error('[Speaking] Cannot parse JSON from:', clean);
        return { band: 5.0, feedback: 'Không thể chấm điểm' };
      }

      return {
        band: Number(parsed.band) || 5.0,
        feedback: parsed.feedback || '',
      };
    } catch (error: any) {
      this.logger.error('[Speaking] Scoring failed:', error.message);
      return { band: 5.0, feedback: 'Không thể chấm điểm tự động' };
    } finally {
      // Xóa file audio tạm
      fs.unlink(audioPath, () => {});
    }
  }
}
