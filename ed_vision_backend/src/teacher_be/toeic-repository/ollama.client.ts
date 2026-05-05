// ─── OllamaClient ─────────────────────────────────────────────────────────────
// Gọi Qwen3 local qua Ollama API để clean/extract từ vựng từ OCR text.
// Không cần internet, không bị rate limit, hoàn toàn miễn phí.
// Ollama API: http://localhost:11434/api/generate

import axios from 'axios';
import { ExtractedWord, normPos } from './regex-extractor';

export interface OllamaConfig {
  baseUrl: string;   // default: http://localhost:11434
  model: string;     // default: qwen3
  timeoutMs: number; // default: 60000
}

// ─── Prompt tối ưu cho Qwen3 — chỉ clean text, không cần JSON ────────────
// Model 3B khó generate JSON dài → chỉ cần clean OCR errors, regex sẽ parse
const CLEAN_PROMPT = (ocrText: string) =>
  `Fix OCR errors in this TOEIC vocabulary list. Keep the format exactly:
"Number. Word (pos) : Vietnamese meaning"

Fix common OCR errors:
- "v," → "v."
- "n," → "n."
- ";" → ":"
- Remove garbage characters
- Keep Vietnamese meanings unchanged

Return ONLY the cleaned text, no explanation.

OCR TEXT:
${ocrText.slice(0, 4000)}`;

export class OllamaClient {
  constructor(private readonly config: OllamaConfig) {}

  /**
  * Gửi OCR text đến Qwen3 local để clean (fix OCR errors).
   * Trả về cleaned text, không phải JSON — regex sẽ parse sau.
   */
  async cleanText(text: string): Promise<string> {
    const prompt = CLEAN_PROMPT(text);
    const t0 = Date.now();

    try {
      const response = await axios.post(
        `${this.config.baseUrl}/api/generate`,
        {
          model: this.config.model,
          prompt,
          stream: false,
          options: {
            temperature: 0,
            num_predict: 4096,  // allow longer output for cleaned text
            top_p: 1,
          },
        },
        { timeout: this.config.timeoutMs },
      );

      const cleaned: string = response.data?.response ?? '';
      return cleaned;
    } catch (e: any) {
      console.error('[OllamaClient] Ollama request failed:', e?.message);
      throw e;
    }
  }

  /**
   * Sửa lỗi chính tả tiếng Việt trong trường meaning sau khi đã extract bằng Regex.
   * Rất hữu ích cho OCR ảnh (vd: "tai sản" -> "tài sản", "trợ li" -> "trợ lí").
   */
  async fixSpelling(words: ExtractedWord[]): Promise<ExtractedWord[]> {
    if (!words.length) return words;

    // Thay vì gửi JSON mảng dài gây timeout, ta gửi chuỗi ghép các nghĩa cách nhau bằng dấu |
    // Tiết kiệm token, sinh text nhanh hơn rất nhiều so với sinh JSON object.
    const originalMeanings = words.map((w) => w.meaning.trim());
    const joinedMeanings = originalMeanings.join(' | ');

    const prompt = `Fix Vietnamese spelling errors caused by OCR in the text below.
Common OCR errors: "tai sản"->"tài sản", "su"->"sự", "tìn! trạng"->"tình trạng", "bồ dụng"->"bổ dụng", "trợ li"->"trợ lí", "kĩ năng." -> "kĩ năng".
Remove weird symbols like '!' or 'Š' or '?' inside Vietnamese words.
DO NOT translate. DO NOT change the structure.
Return exactly the same number of items separated by ' | '. Do not add explanations.

INPUT:
${joinedMeanings}`;

    const t0 = Date.now();
    try {
      const response = await axios.post(
        `${this.config.baseUrl}/api/generate`,
        {
          model: this.config.model,
          prompt,
          stream: false,
          options: {
            temperature: 0,
            num_predict: 2000,
            top_p: 1,
          },
        },
        { timeout: this.config.timeoutMs }, // 60s
      );

      const raw: string = response.data?.response ?? '';
      
      const cleaned = raw.replace(/```[a-z]*\n?/gi, '').replace(/```\n?/g, '').trim();
      const fixedMeanings = cleaned.split('|').map(s => s.trim());

      // Kiểm tra xem số lượng phần tử trả về có khớp không
      if (fixedMeanings.length === words.length) {
        return words.map((w, i) => ({
          ...w,
          meaning: fixedMeanings[i].length > 1 ? fixedMeanings[i] : w.meaning,
        }));
      } else {
        console.warn(`[OllamaClient] Spell check mismatch: sent ${words.length}, got ${fixedMeanings.length}. Returning original.`);
        return words;
      }
    } catch (e: any) {
      console.warn('[OllamaClient] Spell check request failed, returning original words:', e?.message);
      return words;
    }
  }

  /**
   * Kiểm tra Ollama có đang chạy không.
   * Trả về true nếu server phản hồi, false nếu không.
   */
  async isAvailable(): Promise<boolean> {
    try {
      await axios.get(`${this.config.baseUrl}/api/tags`, { timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }
}
