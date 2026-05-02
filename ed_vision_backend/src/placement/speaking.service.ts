import { Injectable, Logger } from '@nestjs/common'
import { OpenRouter } from '@openrouter/sdk'
import * as fs from 'fs'

@Injectable()
export class SpeakingService {
  private readonly logger = new Logger(SpeakingService.name)
  private openrouter: OpenRouter

  constructor() {
    this.openrouter = new OpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY!,
    })
  }

  // STT: file audio path → transcript text
  async transcribe(audioPath: string): Promise<string> {
    try {
      const audioBuffer = await fs.promises.readFile(audioPath)
      const base64Audio = audioBuffer.toString('base64')
      const ext = audioPath.split('.').pop()?.toLowerCase() ?? 'm4a'
      const format = ext === 'm4a' ? 'mp4' : ext

      try {
        const result = await this.openrouter.stt.createTranscription({
          sttRequest: {
            model: 'openai/whisper-1',
            inputAudio: {
              data: base64Audio,
              format: format as any,
            },
          },
        })
        this.logger.log(`[Speaking] Whisper Transcript: ${result.text}`)
        return result.text ?? ''
      } catch (sttError: any) {
        this.logger.warn(`[Speaking] Whisper failed (${sttError.message}), falling back to Gemini...`)
        
        // Fallback to Gemini 1.5 Flash (often free/cheap) for multimodal transcription
        const response = await this.openrouter.chat.send({
          chatRequest: {
            model: 'google/gemini-flash-1.5-8b',
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: 'Please transcribe the following audio clip exactly as spoken. Return only the transcript.' },
                  {
                    type: 'image_url', // OpenRouter uses image_url for any data URI sometimes, but let's check
                    image_url: {
                      url: `data:audio/${format};base64,${base64Audio}`
                    }
                  } as any
                ]
              }
            ]
          }
        })
        
        const transcript = response.choices[0]?.message.content ?? ''
        this.logger.log(`[Speaking] Gemini Fallback Transcript: ${transcript}`)
        return transcript
      }
    } catch (error) {
      this.logger.error('[Speaking] All STT methods failed:', error)
      throw new Error('Không thể chuyển đổi audio thành text')
    }
  }

  // AI Scoring: transcript + prompt → band + feedback
  async scoreSpeaking(
    transcript: string,
    prompt: string,
    audioPath: string,
  ): Promise<{ band: number; feedback: string }> {
    try {
      const response = await this.openrouter.chat.send({
        chatRequest: {
          model: 'google/gemini-2.0-flash-exp:free',
          maxTokens: 500,
          messages: [
            {
              role: 'system',
              content: `You are an IELTS examiner. Score speaking responses strictly.
Return ONLY valid JSON, no markdown, no extra text outside JSON.`,
            },
            {
              role: 'user',
              content: `Speaking prompt: "${prompt}"

Candidate transcript:
"${transcript}"

Score based on IELTS band scale (3.0 to 9.0, steps of 0.5).
Criteria: Fluency & Coherence, Lexical Resource, Grammatical Range, Pronunciation.

Return JSON only:
{
  "band": 5.5,
  "feedback": "Nhận xét ngắn bằng tiếng Việt",
  "fluency": 5.5,
  "vocabulary": 6.0,
  "grammar": 5.0
}`,
            },
          ],
        },
      })

      const text = response.choices[0]?.message.content ?? ''
      const clean = text.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)

      return {
        band: Number(parsed.band) || 5.0,
        feedback: parsed.feedback || '',
      }
    } catch (error) {
      this.logger.error('[Speaking] AI scoring failed:', error)
      return { band: 5.0, feedback: 'Không thể chấm điểm tự động' }
    } finally {
      // Xóa file audio tạm sau khi xử lý xong
      fs.unlink(audioPath, () => { })
    }
  }
}
