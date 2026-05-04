// src/placement/speaking.service.ts

import { Injectable, Logger } from '@nestjs/common'
import * as fs from 'fs'
import fetch from 'node-fetch'

@Injectable()
export class SpeakingService {
  private readonly logger = new Logger(SpeakingService.name)

  // ── STT: Gemini multimodal ───────────────────────────────
  async transcribe(audioPath: string): Promise<string> {
    try {
      const audioBuffer = fs.readFileSync(audioPath)
      this.logger.log(`[Speaking] Audio size: ${audioBuffer.length} bytes`)

      // ✅ Detect audio rỗng ngay — không gọi API
      // CHÚ Ý: Chỉ check ở đây để tránh gọi API tốn phí
      // Nhưng nếu audio > 5000 bytes thì PHẢI gọi API và trả về transcript
      if (audioBuffer.length < 5000) {
        this.logger.warn(`[Speaking] Audio quá nhỏ (${audioBuffer.length} bytes) → coi như im lặng`)
        return ''
      }

      const base64Audio = audioBuffer.toString('base64')
      const ext      = audioPath.split('.').pop()?.toLowerCase() ?? 'webm'
      const mimeType = ext === 'webm' ? 'audio/webm'
        : ext === 'mp4' || ext === 'm4a' ? 'audio/mp4'
        : ext === 'wav' ? 'audio/wav'
        : 'audio/webm'

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY_SPEAKING}`,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { inline_data: { mime_type: mimeType, data: base64Audio } },
                { text: 'Transcribe this audio recording exactly as spoken. Return only the spoken words, nothing else. If there is no speech or only silence, return exactly: [SILENCE]' },
              ],
            }],
            generationConfig: { temperature: 0, maxOutputTokens: 500 },
          }),
        },
      )

      if (!res.ok) {
        const err = await res.text()
        this.logger.error(`[Speaking] Gemini STT error: ${err}`)
        // ⚠️ Nếu API lỗi nhưng có audio → trả về placeholder để vẫn chấm điểm
        return '[TRANSCRIPTION_FAILED]'
      }

      const data       = await res.json() as any
      const transcript = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? ''

      // Detect refusal/silence responses
      const silencePatterns = ['[SILENCE]', 'no speech', 'cannot transcribe', 'inaudible', 'no audio']
      const isSilence = silencePatterns.some(p => transcript.toLowerCase().includes(p.toLowerCase()))

      if (isSilence) {
        this.logger.warn(`[Speaking] Detected silence pattern in transcript`)
        // ⚠️ Trả về empty string → backend sẽ chấm band 3.0
        return ''
      }

      // ✅ Nếu transcript quá ngắn (<3 chars) nhưng có audio
      // → có thể là tiếng ồn hoặc nói không rõ → trả về placeholder
      if (transcript.length < 3) {
        this.logger.warn(`[Speaking] Very short transcript (${transcript.length} chars)`)
        return '[UNCLEAR_SPEECH]'
      }

      this.logger.log(`[Speaking] Transcript (${transcript.length} chars): ${transcript.slice(0, 100)}`)
      return transcript

    } catch (error: any) {
      this.logger.error('[Speaking] STT failed:', error.message)
      // ⚠️ Lỗi exception → trả về placeholder để vẫn chấm điểm
      return '[TRANSCRIPTION_ERROR]'
    }
  }

  // ── AI Scoring ───────────────────────────────────────────
  async scoreSpeaking(
    transcript: string,
    prompt: string,
    audioPath: string,
  ): Promise<{ band: number | null; feedback: string; skipped: boolean }> {
    // ✅ QUAN TRỌNG: Nếu có audio gửi lên (đã qua check blob.size ở FE)
    // thì PHẢI chấm điểm, dù transcript rỗng hay ngắn
    // → KHÔNG BAO GIỜ trả về skipped: true ở đây
    
    const wordCount = transcript.trim().split(/\s+/).filter(w => w.length > 0).length;

    // Transcript rỗng hoặc quá ngắn → chấm band thấp, KHÔNG skip
    if (!transcript || transcript.trim().length === 0 || wordCount === 0) {
      this.logger.warn('[Speaking] Empty transcript → band 3.0 (no speech detected)');
      try {
        return {
          band: 3.0,
          feedback: 'Không phát hiện giọng nói rõ ràng. Hãy nói to và rõ hơn.',
          skipped: false,
        };
      } finally {
        fs.unlink(audioPath, () => {});
      }
    }

    // Transcript quá ngắn (1-4 từ) → band 3.5
    if (wordCount < 5) {
      this.logger.warn(
        `[Speaking] Very short transcript (${wordCount} words) → band 3.5`,
      );
      try {
        return {
          band: 3.5,
          feedback: 'Câu trả lời quá ngắn. Hãy phát triển ý tưởng đầy đủ hơn.',
          skipped: false,
        };
      } finally {
        fs.unlink(audioPath, () => {});
      }
    }

    // ── Extract keywords từ prompt ───────────────────────
    const keywords = this.extractKeywords(prompt)

    try {
      // Thử lần lượt các model free
      const models = [
        'mistralai/mistral-7b-instruct:free',
        'qwen/qwen-2-7b-instruct:free',
        'microsoft/phi-3-mini-128k-instruct:free',
      ]

      for (const model of models) {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method:  'POST',
          headers: {
            Authorization:  `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            max_tokens: 150,
            messages: [
              {
                role:    'system',
                content: 'You are an IELTS examiner. Return ONLY valid JSON, no markdown, no explanation outside JSON.',
              },
              {
                role:    'user',
                content: `IELTS Speaking Question: "${prompt}"

Expected vocabulary for this topic: ${keywords.join(', ')}

Candidate transcript (${wordCount} words):
"${transcript}"

Scoring criteria:
- Band 3.0-3.5: Very short, heavily mispronounced, barely relevant
- Band 4.0-4.5: Simple sentences, limited vocabulary, some errors
- Band 5.0-5.5: Can communicate ideas, some complex sentences, noticeable errors
- Band 6.0-6.5: Mostly fluent, good vocabulary range, minor errors
- Band 7.0-7.5: Fluent, wide vocabulary, flexible grammar
- Band 8.0+: Near-native fluency, sophisticated vocabulary

Score STRICTLY. Return JSON only:
{"band": 5.5, "feedback": "Nhận xét ngắn bằng tiếng Việt tối đa 25 từ"}`,
              },
            ],
          }),
        })

        const rawText = await res.text()
        this.logger.log(`[Speaking] ${model} response: ${rawText.slice(0, 200)}`)

        if (!res.ok) {
          this.logger.warn(`[Speaking] ${model} HTTP ${res.status} — trying next model`)
          continue
        }

        let data: any
        try { data = JSON.parse(rawText) } catch { continue }

        const content = data?.choices?.[0]?.message?.content ?? ''
        if (!content) continue

        const clean = content.replace(/```json|```/g, '').trim()
        try {
          const parsed = JSON.parse(clean)
          const band   = Math.min(Math.max(Number(parsed.band) || 4.0, 3.0), 9.0)
          this.logger.log(`[Speaking] Final band: ${band} via ${model}`);
          return { band, feedback: parsed.feedback || '', skipped: false };
        } catch {
          this.logger.warn(`[Speaking] Cannot parse JSON from ${model}: ${clean}`);
          continue;
        }
      }

      // Tất cả model fail → rule-based fallback
      this.logger.warn('[Speaking] All models failed → rule-based scoring');
      return { ...this.ruleBasedScore(transcript, keywords), skipped: false };
    } catch (error: any) {
      this.logger.error('[Speaking] Scoring error:', error.message);
      return { ...this.ruleBasedScore(transcript, keywords), skipped: false };
    } finally {
      fs.unlink(audioPath, () => {});
    }
  }

  // ── Rule-based fallback scoring ──────────────────────────
  private ruleBasedScore(
    transcript: string,
    keywords: string[],
  ): { band: number; feedback: string } {
    // Xử lý các trường hợp đặc biệt từ transcription
    if (transcript === '[TRANSCRIPTION_FAILED]' || transcript === '[TRANSCRIPTION_ERROR]') {
      return { 
        band: 3.5, 
        feedback: 'Không thể phân tích âm thanh rõ ràng. Có thể do chất lượng mic hoặc tiếng ồn.' 
      }
    }

    if (transcript === '[UNCLEAR_SPEECH]') {
      return { 
        band: 3.5, 
        feedback: 'Phát hiện âm thanh nhưng không rõ ràng. Hãy nói to và rõ hơn.' 
      }
    }

    const words    = transcript.trim().split(/\s+/).filter(w => w.length > 0)
    const wordCount = words.length

    if (wordCount === 0)  return { band: 3.0, feedback: 'Không phát hiện giọng nói rõ ràng.' }
    if (wordCount < 5)    return { band: 3.5, feedback: 'Câu trả lời quá ngắn. Hãy phát triển ý tưởng đầy đủ hơn.' }

    let band = 4.0

    // +0.5 per 10 words (max +1.5)
    band += Math.min(Math.floor(wordCount / 10) * 0.5, 1.5)

    // Keyword matching (+0.5 per keyword found, max +1.5)
    const transcriptLower = transcript.toLowerCase()
    const keywordsFound   = keywords.filter(k => transcriptLower.includes(k.toLowerCase()))
    band += Math.min(keywordsFound.length * 0.5, 1.5)

    // Advanced vocab check
    const advancedWords = ['furthermore', 'however', 'therefore', 'consequently', 'particularly',
      'significant', 'perspective', 'opportunity', 'challenge', 'advantage']
    const advancedFound = advancedWords.filter(w => transcriptLower.includes(w))
    band += Math.min(advancedFound.length * 0.5, 1.0)

    // Filler penalty
    const fillers       = ['um', 'uh', 'like', 'you know', 'sort of', 'kind of']
    const fillerCount   = fillers.filter(f => transcriptLower.includes(f)).length
    const realWordRatio = (wordCount - fillerCount * 2) / wordCount
    if (realWordRatio < 0.5) band -= 1.0

    band = Math.round(Math.min(Math.max(band, 3.0), 7.0) * 2) / 2
    return {
      band,
      feedback: `Nhận diện ${wordCount} từ. Dùng ${keywordsFound.length} từ phù hợp chủ đề.`,
    }
  }

  // ── Extract keywords từ prompt ───────────────────────────
  private extractKeywords(prompt: string): string[] {
    const promptLower = prompt.toLowerCase()

    const topicMap: Record<string, string[]> = {
      routine:     ['morning', 'wake', 'breakfast', 'commute', 'evening', 'schedule', 'habit'],
      work:        ['job', 'office', 'colleague', 'career', 'workplace', 'profession', 'salary'],
      study:       ['university', 'subject', 'exam', 'teacher', 'learn', 'course', 'degree'],
      travel:      ['destination', 'trip', 'culture', 'transport', 'experience', 'journey', 'abroad'],
      technology:  ['device', 'internet', 'app', 'digital', 'social media', 'smartphone', 'online'],
      environment: ['pollution', 'climate', 'recycle', 'sustainable', 'energy', 'carbon', 'green'],
      food:        ['meal', 'restaurant', 'cuisine', 'healthy', 'cook', 'ingredient', 'diet'],
      family:      ['parents', 'sibling', 'relationship', 'home', 'childhood', 'relative', 'upbringing'],
      problem:     ['challenge', 'solution', 'resolve', 'overcome', 'difficult', 'approach', 'strategy'],
      government:  ['policy', 'law', 'freedom', 'society', 'rights', 'regulation', 'intervention'],
      hometown:    ['city', 'town', 'local', 'community', 'live', 'neighbourhood', 'grow up'],
    }

    for (const [topic, words] of Object.entries(topicMap)) {
      if (promptLower.includes(topic) || words.some(w => promptLower.includes(w))) {
        return words
      }
    }

    return ['describe', 'explain', 'think', 'feel', 'believe', 'important', 'experience']
  }
}
