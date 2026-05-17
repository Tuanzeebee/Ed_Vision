/**
 * SpeakingPractice.tsx
 *
 * Speaking practice component using MediaRecorder (same API as Zalo/Messenger)
 * + backend Whisper transcription — works with any laptop built-in mic,
 * completely offline (no Google cloud needed).
 *
 * Audio pipeline:
 *   getUserMedia → MediaRecorder (webm/opus) → AudioContext.decodeAudioData
 *   → OfflineAudioContext resample to 16 kHz mono → Float32Array
 *   → POST /api/stt → { text } → score with Levenshtein
 */

import React, { useState, useRef, useCallback, useEffect } from 'react'
import {
  Mic, MicOff, RotateCcw, ChevronRight, Volume2,
  CheckCircle2, XCircle, AlertCircle, Info, Loader2,
} from 'lucide-react'
import {
  SPEAKING_PACKS,
  scoreSimilarity,
  findMissingWords,
  getWordAccuracy,
} from './certificateSpeakingData'
import type { SpeakingExercise } from './certificateSpeakingData'
import {
  chatIeltsGroqTutor,
  type IeltsChatMessage,
} from "@/services/api/certificateService";

// ─── Score helpers ─────────────────────────────────────────────────────────────

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-400'
  if (score >= 60) return 'text-amber-400'
  return 'text-red-400'
}

function getScoreBg(score: number): string {
  if (score >= 80) return 'bg-green-500'
  if (score >= 60) return 'bg-amber-500'
  return 'bg-red-500'
}

function getScoreLabel(score: number): string {
  if (score >= 90) return 'Xuất sắc! '
  if (score >= 80) return 'Tốt lắm! '
  if (score >= 60) return 'Khá ổn – cố thêm một chút! '
  if (score >= 40) return 'Cần luyện thêm '
  return 'Thử lại nhé '
}

// ─── Browser TTS (model answer playback) ──────────────────────────────────────

function speakText(text: string) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utt = new SpeechSynthesisUtterance(text)
  utt.lang = 'en-US'
  utt.rate = 0.85
  window.speechSynthesis.speak(utt)
}

// ─── Audio: MediaRecorder capture + Web Audio resample ────────────────────────
// Note: chunks are stored in chunksRef (component scope) so they survive
// across startRecording / stopRecording calls.

/**
 * Convert any audio Blob to raw Float32 PCM at 16 kHz mono.
 * Uses the Web Audio API — no ffmpeg, no external libs.
 * Returns an ArrayBuffer ready to POST to the backend.
 */
async function convertToPCM16k(audioBlob: Blob): Promise<ArrayBuffer> {
  const arrayBuffer = await audioBlob.arrayBuffer()

  // Decode compressed audio (webm/opus) to raw PCM
  const audioCtx = new AudioContext()
  let audioBuffer: AudioBuffer
  try {
    audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
  } finally {
    void audioCtx.close()
  }

  // Resample to 16 kHz mono via OfflineAudioContext
  const targetRate = 16000
  const numFrames = Math.ceil(audioBuffer.duration * targetRate)

  const offlineCtx = new OfflineAudioContext(1, numFrames, targetRate)
  const source = offlineCtx.createBufferSource()
  source.buffer = audioBuffer
  source.connect(offlineCtx.destination)
  source.start(0)

  const rendered = await offlineCtx.startRendering()
  // Get mono Float32 channel data at 16 kHz
  return rendered.getChannelData(0).buffer
}

/** POST Float32 PCM to /api/stt and return the transcription. */
async function callSttApi(pcmBuffer: ArrayBuffer): Promise<string> {
  const formData = new FormData()
  formData.append('audio', new Blob([pcmBuffer], { type: 'application/octet-stream' }), 'audio.f32')

  const res = await fetch('/api/stt', {
    method: 'POST',
    body: formData,
    signal: AbortSignal.timeout(120_000), // model may download on first run
  })

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText)
    throw new Error(msg)
  }

  const data = await res.json() as { text: string }
  return data.text ?? ''
}

// ─── Sub-component: word-level highlight ─────────────────────────────────────

const WordHighlight: React.FC<{ expected: string; spoken: string }> = ({ expected, spoken }) => {
  const words = getWordAccuracy(expected, spoken)
  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {words.map((w, i) => (
        <span key={i} className={`px-1.5 py-0.5 rounded text-sm font-medium ${
          w.ok
            ? 'bg-green-900/60 text-green-300 border border-green-700'
            : 'bg-red-900/60 text-red-300 border border-red-700'
        }`}>
          {w.ok ? '' : ''} {w.word}
        </span>
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

type RecordState = 'idle' | 'recording' | 'processing' | 'result'

interface Props { topicKey: string }

const SpeakingPractice: React.FC<Props> = ({ topicKey }) => {
  const pack = SPEAKING_PACKS[topicKey]

  const [exerciseIndex, setExerciseIndex]   = useState(0)
  const [recordState, setRecordState]       = useState<RecordState>('idle')
  const [spokenText, setSpokenText]         = useState('')
  const [score, setScore]                   = useState(0)
  const [error, setError]                   = useState<string | null>(null)
  const [completedCount, setCompletedCount] = useState(0)

  // --- AI Chat State ---
  const [chatHistory, setChatHistory] = useState<IeltsChatMessage[]>([]);
  const [chatMessage, setChatMessage] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isChatExpanded, setIsChatExpanded] = useState(false);

  const streamRef    = useRef<MediaStream | null>(null)
  const recorderRef  = useRef<MediaRecorder | null>(null)
  const chunksRef    = useRef<BlobPart[]>([])
  const mimeTypeRef  = useRef<string>('audio/webm')

  const exercise: SpeakingExercise | undefined = pack?.exercises[exerciseIndex]

  // Stop stream on unmount / topic change
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
      window.speechSynthesis?.cancel()
    }
  }, [])

  useEffect(() => {
    setExerciseIndex(0)
    resetState()
  }, [topicKey])

  // Reset chat when exercise changes
  useEffect(() => {
    setChatHistory([]);
    setChatMessage("");
    setIsChatExpanded(false);
  }, [exerciseIndex, topicKey]);

  const sendChatMessage = async (overrideMsg?: string) => {
    const msgToSend = overrideMsg || chatMessage;
    if (!msgToSend.trim() || isChatLoading) return;

    const userMsg: IeltsChatMessage = { role: "user", content: msgToSend.trim() };
    if (!overrideMsg) setChatMessage("");
    setChatHistory(prev => [...prev, userMsg]);
    setIsChatLoading(true);
    setIsChatExpanded(true);

    try {
      const res = await chatIeltsGroqTutor({
        skill: "speaking",
        context_text: `Topic: ${pack?.title}\nQuestion: ${exercise?.question || exercise?.target}\nUser spoke: ${spokenText || 'N/A'}`,
        user_message: msgToSend.trim(),
        chat_history: chatHistory,
      });

      setChatHistory(prev => [...prev, { role: "assistant", content: res.answer }]);
    } catch (err) {
      console.error("Chat error:", err);
      setChatHistory(prev => [...prev, { role: "assistant", content: "Lỗi AI. Thử lại sau nhé!" }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleQuickAction = (p: string) => sendChatMessage(p);
  const toggleChat = () => setIsChatExpanded(!isChatExpanded);

  const resetState = () => {
    recorderRef.current?.stop()
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    recorderRef.current = null
    chunksRef.current = []
    setRecordState('idle')
    setSpokenText('')
    setScore(0)
    setError(null)
  }

  const targetText = exercise?.type === 'qa' && exercise.modelAnswer
    ? exercise.modelAnswer
    : (exercise?.target ?? '')

  // ── START recording ──────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    setError(null)
    chunksRef.current = []   // clear previous chunks
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : ''

      const mr = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream)

      mimeTypeRef.current = mr.mimeType || 'audio/webm'
      recorderRef.current = mr

      // Collect ALL chunks into the ref — survives stopRecording's scope
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.start(100)
      setRecordState('recording')
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError('Vui lòng cấp quyền microphone trong trình duyệt.')
      } else {
        setError('Không thể truy cập microphone. Hãy kiểm tra cài đặt.')
      }
    }
  }, [])

  // ── STOP recording → transcribe ──────────────────────────────────────────
  const stopRecording = useCallback(async () => {
    const mr = recorderRef.current
    if (!mr) return

    setRecordState('processing')
    setError(null)

    // Wait for the recorder to finish flushing — the final ondataavailable
    // fires before onstop, so chunksRef contains ALL recorded data
    const blob = await new Promise<Blob>((resolve) => {
      mr.onstop = () => {
        resolve(new Blob(chunksRef.current, { type: mimeTypeRef.current }))
      }
      mr.stop()
    })

    // Stop mic stream
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null

    try {
      // Convert to 16 kHz float32 PCM
      const pcm = await convertToPCM16k(blob)
      // Send to Whisper backend
      const text = await callSttApi(pcm)

      if (!text) {
        setSpokenText('')
        setScore(0)
        setError('Không nhận diện được giọng nói. Hãy nói to và rõ hơn.')
        setRecordState('result')
        return
      }

      const s = scoreSimilarity(targetText, text)
      setSpokenText(text)
      setScore(s)
      setCompletedCount(c => c + 1)
      setRecordState('result')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('openai-whisper')) {
        setError(' Cài đặt Whisper: pip install openai-whisper  (chỉ cần 1 lần)')
      } else if (msg.includes('python not found')) {
        setError(' Python chưa được cài đặt hoặc không có trong PATH.')
      } else {
        setError(`Lỗi nhận dạng: ${msg}`)
      }
      setRecordState('result')
    }
  }, [targetText])

  const handleNext = () => {
    if (!pack) return
    const nextIdx = (exerciseIndex + 1) % pack.exercises.length
    setExerciseIndex(nextIdx)
    resetState()
  }

  const jumpTo = (i: number) => {
    setExerciseIndex(i)
    resetState()
  }

  if (!pack || !exercise) {
    return (
      <div className="flex items-center justify-center h-48 text-zinc-400 text-sm">
        Không tìm thấy bài luyện speaking cho chủ đề này.
      </div>
    )
  }

  const missing = recordState === 'result' ? findMissingWords(targetText, spokenText) : []

  return (
    <div className="space-y-4 max-w-2xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">{pack.title}</h2>
          <p className="text-xs text-zinc-400 mt-0.5">{pack.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">{exerciseIndex + 1} / {pack.exercises.length}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full border ${
            exercise.difficulty === 'easy'
              ? 'text-green-400 border-green-700 bg-green-900/30'
              : exercise.difficulty === 'medium'
              ? 'text-amber-400 border-amber-700 bg-amber-900/30'
              : 'text-red-400 border-red-700 bg-red-900/30'
          }`}>
            {exercise.difficulty === 'easy' ? 'Dễ' : exercise.difficulty === 'medium' ? 'Vừa' : 'Khó'}
          </span>
        </div>
      </div>

      {/* ── Exercise card ── */}
      <div className="bg-zinc-800 rounded-xl border border-zinc-700 p-5 space-y-4">
        {/* Type badge */}
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          exercise.type === 'word'
            ? 'bg-blue-900/50 text-blue-300 border border-blue-700'
            : exercise.type === 'sentence'
            ? 'bg-purple-900/50 text-purple-300 border border-purple-700'
            : 'bg-teal-900/50 text-teal-300 border border-teal-700'
        }`}>
          {exercise.type === 'word' ? ' Từ đơn' : exercise.type === 'sentence' ? ' Câu' : ' Hỏi – Đáp'}
        </span>

        {/* Q&A question */}
        {exercise.type === 'qa' && exercise.question && (
          <div className="bg-teal-900/20 border border-teal-800 rounded-lg p-3">
            <p className="text-xs text-teal-400 font-medium mb-1"> Câu hỏi</p>
            <p className="text-white text-sm leading-relaxed">{exercise.question}</p>
          </div>
        )}

        {/* Target text */}
        {exercise.type !== 'qa' && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-400 uppercase tracking-wide font-medium">
                {exercise.type === 'word' ? 'Từ cần phát âm' : 'Câu cần đọc'}
              </p>
              <button
                onClick={() => speakText(exercise.target)}
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                <Volume2 className="w-3.5 h-3.5" /> Nghe mẫu
              </button>
            </div>
            <div className="bg-zinc-900 border border-zinc-600 rounded-lg p-4">
              <p className="text-white text-lg font-semibold leading-relaxed">{exercise.target}</p>
              {exercise.translation && (
                <p className="text-zinc-400 text-sm mt-1">🇻🇳 {exercise.translation}</p>
              )}
            </div>
          </div>
        )}

        {exercise.type === 'qa' && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-400 uppercase tracking-wide font-medium">Câu trả lời mẫu</p>
            <button
              onClick={() => exercise.modelAnswer && speakText(exercise.modelAnswer)}
              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              <Volume2 className="w-3.5 h-3.5" /> Nghe mẫu
            </button>
          </div>
        )}

        {/* IPA / stress hints */}
        {(exercise.ipa || exercise.stressHint || exercise.syllables) && (
          <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-3 space-y-1.5">
            {exercise.ipa && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-blue-400 font-medium">IPA:</span>
                <span className="text-blue-200 font-mono text-sm">{exercise.ipa}</span>
              </div>
            )}
            {exercise.stressHint && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-blue-400 font-medium">Trọng âm:</span>
                <span className="text-blue-200 text-sm">{exercise.stressHint}</span>
              </div>
            )}
            {exercise.syllables && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-blue-400 font-medium">Âm tiết:</span>
                {exercise.syllables.map((s, i) => (
                  <span key={i} className="bg-blue-800/40 text-blue-200 text-xs px-1.5 py-0.5 rounded font-mono">{s}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sound tip */}
        {exercise.soundTip && (
          <div className="flex items-start gap-2 text-sm text-zinc-300 bg-zinc-900/50 rounded-lg p-3 border border-zinc-700">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>{exercise.soundTip}</span>
          </div>
        )}
      </div>

      {/* ── Recording / Processing / Result ── */}
      {recordState === 'idle' && (
        <div className="text-center space-y-3">
          <button
            onClick={() => void startRecording()}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold px-8 py-3 rounded-full transition-all shadow-lg shadow-blue-900/40"
          >
            <Mic className="w-5 h-5" />
            Bắt đầu nói
          </button>
          <p className="text-zinc-500 text-xs">Hoạt động với mọi loại mic – không cần mic ngoài</p>
        </div>
      )}

      {recordState === 'recording' && (
        <div className="bg-zinc-800 border border-red-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="relative">
              <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse" />
              <div className="absolute inset-0 w-4 h-4 rounded-full bg-red-500 animate-ping opacity-40" />
            </div>
            <span className="text-red-400 text-sm font-medium animate-pulse">Đang ghi âm...</span>
          </div>
          <p className="text-zinc-400 text-xs text-center">
             Hãy nói to và rõ. Nhấn Dừng khi xong.
          </p>
          <div className="flex justify-center">
            <button
              onClick={() => void stopRecording()}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-semibold px-8 py-3 rounded-full transition-all"
            >
              <MicOff className="w-5 h-5" />
              Dừng
            </button>
          </div>
        </div>
      )}

      {recordState === 'processing' && (
        <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-8 flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
          <div className="text-center">
            <p className="text-white font-medium">Đang nhận dạng giọng nói...</p>
            <p className="text-zinc-400 text-xs mt-1">Lần đầu chạy có thể mất 1-2 phút để tải mô hình (~75 MB)</p>
          </div>
        </div>
      )}

      {recordState === 'result' && (
        <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-5 space-y-4">

          {/* Score ring */}
          {!error || spokenText ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-xs uppercase tracking-wide font-medium mb-1">Điểm phát âm</p>
                  <div className="flex items-end gap-2">
                    <span className={`text-4xl font-bold ${getScoreColor(score)}`}>{score}</span>
                    <span className="text-zinc-500 text-lg mb-0.5">/ 100</span>
                  </div>
                  <p className={`text-sm font-medium mt-1 ${getScoreColor(score)}`}>{getScoreLabel(score)}</p>
                </div>
                <div className="relative w-20 h-20">
                  <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#3f3f46" strokeWidth="3" />
                    <circle
                      cx="18" cy="18" r="15.9" fill="none"
                      stroke={score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444'}
                      strokeWidth="3" strokeDasharray={`${score} 100`} strokeLinecap="round"
                    />
                  </svg>
                  <span className={`absolute inset-0 flex items-center justify-center text-lg font-bold ${getScoreColor(score)}`}>
                    {score}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-zinc-700 rounded-full h-2">
                <div className={`h-2 rounded-full transition-all duration-700 ${getScoreBg(score)}`} style={{ width: `${score}%` }} />
              </div>
            </>
          ) : null}

          {/* Spoken text */}
          {spokenText && (
            <div className="space-y-1">
              <p className="text-xs text-zinc-400 uppercase tracking-wide font-medium">Bạn đã nói</p>
              <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3">
                <p className="text-white text-sm leading-relaxed">{spokenText}</p>
              </div>
            </div>
          )}

          {/* Word breakdown */}
          {spokenText && exercise.type !== 'qa' && (
            <div className="space-y-1">
              <p className="text-xs text-zinc-400 uppercase tracking-wide font-medium">Từng từ</p>
              <WordHighlight expected={targetText} spoken={spokenText} />
            </div>
          )}

          {/* Missing words */}
          {missing.length > 0 && (
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-red-400">
                <XCircle className="w-4 h-4" />
                <span className="text-xs font-medium">Từ bị thiếu</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {missing.map((w, i) => (
                  <span key={i} className="bg-red-900/40 text-red-300 text-xs px-2 py-0.5 rounded border border-red-700 font-mono">{w}</span>
                ))}
              </div>
            </div>
          )}

          {/* Model answer for QA */}
          {exercise.type === 'qa' && (
            <div className="bg-green-900/20 border border-green-800 rounded-lg p-3 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-green-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-xs font-medium">Câu trả lời mẫu</span>
                </div>
                <button onClick={() => speakText(exercise.target)} className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1">
                  <Volume2 className="w-3 h-3" /> Nghe
                </button>
              </div>
              <p className="text-green-200 text-sm leading-relaxed">{exercise.target}</p>
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-2 bg-red-900/20 border border-red-800 rounded-lg p-3 text-red-300 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="whitespace-pre-wrap">{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button onClick={resetState} className="flex-1 flex items-center justify-center gap-2 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
              <RotateCcw className="w-4 h-4" /> Thử lại
            </button>
            <button onClick={handleNext} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
              Câu tiếp <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Error for idle state (mic permission) */}
      {error && recordState === 'idle' && (
        <div className="flex items-start gap-2 bg-red-900/20 border border-red-800 rounded-lg p-3 text-red-300 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Exercise dots */}
      <div className="flex flex-wrap gap-2 pt-1">
        {pack.exercises.map((_, i) => (
          <button
            key={i}
            onClick={() => jumpTo(i)}
            className={`w-7 h-7 rounded-full text-xs font-medium border transition-all ${
              i === exerciseIndex
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {completedCount > 0 && (
        <p className="text-xs text-zinc-500 text-center">
           Đã hoàn thành <span className="text-green-400 font-medium">{completedCount}</span> lần thực hành trong phiên này
        </p>
      )}
    </div>
  )
}

export default SpeakingPractice
