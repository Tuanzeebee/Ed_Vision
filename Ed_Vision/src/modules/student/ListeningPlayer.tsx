import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  CheckCircle2,
  XCircle,
  Lightbulb,
  ChevronRight,
  Headphones,
  MessageSquareText,
  Shuffle,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import {
  buildAudioScript,
  buildAnnotatedScript,
  LISTENING_PACKS_BY_KEY,
} from './certificateListeningData'
import type { DialoguePack } from './certificateListeningData'

// ─── TTS engine ───────────────────────────────────────────────────────────────
// Tries backend Edge TTS → falls back to Web Speech API

async function tryEdgeTts(text: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/tts?text=${encodeURIComponent(text)}`, {
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const blob = await res.blob()
    return URL.createObjectURL(blob)
  } catch {
    return null
  }
}

function speakWithWebSpeech(
  text: string,
  onStart: () => void,
  onEnd: () => void,
  onError: () => void
): SpeechSynthesisUtterance {
  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = 'en-US'
  utter.rate = 0.92
  utter.pitch = 1.0

  // Prefer a natural en-US voice if available
  const voices = window.speechSynthesis.getVoices()
  const preferred = voices.find(
    (v) => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha'))
  )
  if (preferred) utter.voice = preferred

  utter.onstart = onStart
  utter.onend = onEnd
  utter.onerror = onError
  window.speechSynthesis.speak(utter)
  return utter
}

// ─── Difficulty badge ─────────────────────────────────────────────────────────
function DifficultyBadge({ level }: { level: 'easy' | 'medium' | 'hard' }) {
  const map = {
    easy:   { label: 'Dễ',    cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    medium: { label: 'Trung bình', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
    hard:   { label: 'Khó',   cls: 'bg-red-100 text-red-700 border-red-200' },
  }
  const { label, cls } = map[level]
  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full border ${cls}`}>
      {label}
    </span>
  )
}

// ─── Audio Player UI ──────────────────────────────────────────────────────────

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function AudioPlayer({
  onPlay,
  onStop,
  isPlaying,
  isLoading,
  hasError,
  playCount,
  currentTime,
  duration,
  volume,
  isEdgeAudio,
  onSeek,
  onVolumeChange,
}: {
  onPlay: () => void
  onStop: () => void
  isPlaying: boolean
  isLoading: boolean
  hasError: boolean
  playCount: number
  currentTime: number
  duration: number
  volume: number
  isEdgeAudio: boolean
  onSeek: (t: number) => void
  onVolumeChange: (v: number) => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-6 gap-4">
      {/* Pulsing ring */}
      <div className="relative">
        {isPlaying && (
          <span className="absolute inset-0 rounded-full bg-purple-300 animate-ping opacity-60" />
        )}
        <button
          onClick={isPlaying ? onStop : onPlay}
          disabled={isLoading}
          className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all cursor-pointer ${
            isLoading
              ? 'bg-slate-100 cursor-wait'
              : isPlaying
              ? 'bg-gradient-to-br from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600'
              : 'bg-gradient-to-br from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600'
          }`}
        >
          {isLoading ? (
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-8 h-8 text-white" />
          ) : (
            <Play className="w-8 h-8 text-white ml-1" />
          )}
        </button>
      </div>

      {/* Status text */}
      <div className="text-center">
        <p className={`text-sm font-medium ${
          isLoading ? 'text-slate-400' : isPlaying ? 'text-purple-600' : 'text-slate-500'
        }`}>
          {isLoading
            ? 'Đang tải audio...'
            : isPlaying
            ? ' Đang phát...'
            : playCount > 0
            ? ` Phát lại (đã nghe ${playCount} lần)`
            : ' Nhấn để nghe'}
        </p>
        {hasError && (
          <p className="text-xs text-amber-600 mt-1 flex items-center justify-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            Dùng giọng đọc dự phòng (Web Speech)
          </p>
        )}
      </div>

      {/* ── Seek bar (Edge TTS only) ──────────────────────────── */}
      {isEdgeAudio && duration > 0 && (
        <div className="w-full px-4 space-y-3">
          {/* Progress / seek */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 tabular-nums w-8 shrink-0 text-right">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration}
              step={0.5}
              value={currentTime}
              onChange={e => onSeek(parseFloat(e.target.value))}
              className="flex-1 h-1.5 accent-purple-400 cursor-pointer rounded-full"
            />
            <span className="text-xs text-slate-400 tabular-nums w-8 shrink-0">
              {formatTime(duration)}
            </span>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-2 justify-center">
            <VolumeX className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={e => onVolumeChange(parseFloat(e.target.value))}
              className="w-28 h-1.5 accent-purple-400 cursor-pointer rounded-full"
            />
            <Volume2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="text-xs text-slate-400 w-9">{Math.round(volume * 100)}%</span>
          </div>
        </div>
      )}

      {/* Tip */}
      <p className="text-xs text-slate-400 text-center max-w-xs px-4">
         Tua lại để nghe rõ hơn. Bạn có thể phát lại nhiều lần.
      </p>
    </div>
  )
}

// ─── Answer Section ───────────────────────────────────────────────────────────
function AnswerSection({
  pack,
  onNext,
  onAnswered,
}: {
  pack: DialoguePack
  onNext: () => void
  onAnswered?: (isCorrect: boolean, questionId: string) => void
}) {
  const [selected, setSelected] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [showScript, setShowScript] = useState(false)

  const answered = submitted && selected !== null
  const isCorrect = answered && selected === pack.question.answer

  const handleSubmit = () => {
    if (selected !== null) {
      onAnswered?.(selected === pack.question.answer, `${pack.theme}-${pack.question.question}`)
      setSubmitted(true)
    }
  }

  return (
    <div className="space-y-5">
      {/* Question */}
      <div className="bg-slate-50 rounded-xl px-5 py-4 border border-slate-100">
        <p className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">Câu hỏi</p>
        <p className="text-base font-semibold text-slate-800 leading-relaxed">
          {pack.question.question}
        </p>
      </div>

      {/* Options */}
      <div className="space-y-2.5">
        {pack.question.options.map((opt, i) => {
          let cls =
            'w-full text-left flex items-start gap-3 px-4 py-3.5 rounded-xl border text-sm transition-all cursor-pointer '
          if (!submitted) {
            cls +=
              selected === i
                ? 'border-purple-400 bg-purple-50 text-purple-800'
                : 'border-slate-200 bg-white hover:border-purple-200 hover:bg-purple-50/40 text-slate-700'
          } else if (i === pack.question.answer) {
            cls += 'border-emerald-400 bg-emerald-50 text-emerald-800'
          } else if (i === selected && i !== pack.question.answer) {
            cls += 'border-red-300 bg-red-50 text-red-700'
          } else {
            cls += 'border-slate-100 bg-slate-50 text-slate-400'
          }

          return (
            <button
              key={i}
              className={cls}
              onClick={() => !submitted && setSelected(i)}
              disabled={submitted}
            >
              <span
                className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 text-xs font-black transition-colors ${
                  !submitted
                    ? selected === i
                      ? 'border-purple-400 bg-purple-400 text-white'
                      : 'border-slate-300 text-slate-400'
                    : i === pack.question.answer
                    ? 'border-emerald-400 bg-emerald-400 text-white'
                    : i === selected
                    ? 'border-red-300 bg-red-300 text-white'
                    : 'border-slate-200 text-slate-300'
                }`}
              >
                {String.fromCharCode(65 + i)}
              </span>
              <span className="flex-1 leading-relaxed">{opt}</span>
              {submitted && i === pack.question.answer && (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
              )}
              {submitted && i === selected && i !== pack.question.answer && (
                <XCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              )}
            </button>
          )
        })}
      </div>

      {/* Submit button (before answer) */}
      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={selected === null}
          className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer text-sm"
        >
          Nộp đáp án
        </button>
      )}

      {/* Result + explanation (after answer) */}
      {answered && (
        <div className="space-y-3">
          {/* Result banner */}
          <div
            className={`flex items-center gap-3 px-5 py-4 rounded-xl border ${
              isCorrect
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            {isCorrect ? (
              <>
                <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                <div>
                  <p className="font-bold text-emerald-700">Chính xác! </p>
                  <p className="text-sm text-emerald-600 mt-0.5">
                    {pack.question.explanation}
                  </p>
                </div>
              </>
            ) : (
              <>
                <XCircle className="w-6 h-6 text-red-400 shrink-0" />
                <div>
                  <p className="font-bold text-red-600">
                    Chưa đúng — Đáp án: {String.fromCharCode(65 + pack.question.answer)}
                  </p>
                  <p className="text-sm text-red-500 mt-0.5">
                    {pack.question.explanation}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Tip */}
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3.5">
            <Lightbulb className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700 leading-relaxed">
              <span className="font-bold">Mẹo: </span>
              {pack.question.tip}
            </p>
          </div>

          {/* Show transcript */}
          <button
            onClick={() => setShowScript(!showScript)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2 font-medium">
              <MessageSquareText className="w-4 h-4 text-slate-400" />
              {showScript ? 'Ẩn transcript' : 'Xem transcript (đoạn hội thoại)'}
            </span>
            <ChevronRight
              className={`w-4 h-4 text-slate-400 transition-transform ${showScript ? 'rotate-90' : ''}`}
            />
          </button>

          {showScript && (
            <div className="bg-slate-900 rounded-xl p-5 text-sm font-mono leading-8 whitespace-pre-line text-slate-200">
              {buildAnnotatedScript(pack.dialogue)}
            </div>
          )}

          {/* Next question */}
          <button
            onClick={onNext}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-blue-600 transition-colors cursor-pointer text-sm flex items-center justify-center gap-2"
          >
            Câu tiếp theo <Shuffle className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main Listening Player ────────────────────────────────────────────────────

interface ListeningPlayerProps {
  topicKey: string
  accentColor?: string
  accentBg?: string
  onQuestionAnswered?: (isCorrect: boolean, questionId: string) => void
}

export function ListeningPlayer({ topicKey, onQuestionAnswered }: ListeningPlayerProps) {
  const packs = LISTENING_PACKS_BY_KEY[topicKey] ?? []
  const [packIndex, setPackIndex] = useState(() => Math.floor(Math.random() * Math.max(packs.length, 1)))
  const [sessionKey, setSessionKey] = useState(0) // remount AnswerSection on new pack

  const pack = packs[packIndex] ?? null

  // Audio state
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [playCount, setPlayCount] = useState(0)
  const [edgeUrl, setEdgeUrl] = useState<string | null | 'failed'>('failed') // null = not tried yet; 'failed' = use fallback
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isEdgeAudio, setIsEdgeAudio] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Pre-fetch Edge TTS when pack changes
  useEffect(() => {
    if (!pack) return
    setEdgeUrl(null) // reset: haven't tried yet
    setIsPlaying(false)
    setPlayCount(0)
    setCurrentTime(0)
    setDuration(0)
    setIsEdgeAudio(false)
    const script = buildAudioScript(pack.dialogue)
    tryEdgeTts(script).then((url) => {
      setEdgeUrl(url ?? 'failed')
    })
    return () => {
      // cleanup old audio
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      window.speechSynthesis?.cancel()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packIndex, topicKey])

  const stopAll = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    window.speechSynthesis?.cancel()
    setIsPlaying(false)
  }, [])

  const playAudio = useCallback(() => {
    if (!pack) return
    stopAll()

    const script = buildAudioScript(pack.dialogue)

    if (edgeUrl && edgeUrl !== 'failed') {
      // Use Edge TTS audio blob
      setIsLoading(false)
      const audio = new Audio(edgeUrl)
      audio.volume = volume
      audioRef.current = audio
      audio.onplay = () => { setIsPlaying(true); setPlayCount(c => c + 1) }
      audio.onended = () => setIsPlaying(false)
      audio.ontimeupdate = () => setCurrentTime(audio.currentTime)
      audio.onloadedmetadata = () => setDuration(audio.duration)
      setIsEdgeAudio(true)
      audio.onerror = () => {
        setIsPlaying(false)
        setHasError(true)
        // Fallback to Web Speech
        utterRef.current = speakWithWebSpeech(
          script,
          () => { setIsPlaying(true) },
          () => setIsPlaying(false),
          () => setIsPlaying(false)
        )
      }
      audio.play().catch(() => {
        setHasError(true)
        utterRef.current = speakWithWebSpeech(script, () => setIsPlaying(true), () => setIsPlaying(false), () => setIsPlaying(false))
      })
    } else if (edgeUrl === null) {
      // Still fetching — wait
      setIsLoading(true)
    } else {
      // Edge TTS failed — use Web Speech
      setHasError(true)
      utterRef.current = speakWithWebSpeech(
        script,
        () => { setIsPlaying(true); setPlayCount(c => c + 1) },
        () => setIsPlaying(false),
        () => setIsPlaying(false)
      )
    }
  }, [pack, edgeUrl, stopAll, volume])

  // Once edgeUrl resolves, if user was waiting (isLoading), auto-play
  useEffect(() => {
    if (isLoading && edgeUrl !== null) {
      setIsLoading(false)
      playAudio()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edgeUrl])

  const handleSeek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
    }
    setCurrentTime(time)
  }, [])

  const handleVolumeChange = useCallback((vol: number) => {
    if (audioRef.current) {
      audioRef.current.volume = vol
    }
    setVolume(vol)
  }, [])

  const loadNextPack = useCallback(() => {
    if (packs.length === 0) return
    setPackIndex((prev) => {
      let next = Math.floor(Math.random() * packs.length)
      if (packs.length > 1 && next === prev) next = (prev + 1) % packs.length
      return next
    })
    setSessionKey((k) => k + 1)
    setHasError(false)
    stopAll()
  }, [packs.length, stopAll])

  // No packs available
  if (packs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
        <Headphones className="w-10 h-10" />
        <p className="text-sm font-medium">Chưa có bài nghe cho chủ đề này.</p>
        <p className="text-xs">Nội dung đang được biên soạn.</p>
      </div>
    )
  }

  if (!pack) return null

  const totalPacks = packs.length

  return (
    <div className="space-y-6">
      {/* Pack header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-cyan-100 rounded-xl flex items-center justify-center">
            <Headphones className="w-4 h-4 text-cyan-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-700 text-sm">{pack.theme}</p>
            <p className="text-xs text-slate-400">Bài {packIndex + 1} / {totalPacks}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DifficultyBadge level={pack.difficulty} />
          <button
            onClick={loadNextPack}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer text-xs font-medium"
          >
            <Shuffle className="w-3.5 h-3.5" /> Đổi bài
          </button>
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5 flex-wrap">
        {packs.map((_, i) => (
          <button
            key={i}
            onClick={() => { setPackIndex(i); setSessionKey(k => k + 1); setHasError(false); stopAll() }}
            className={`h-1.5 rounded-full transition-all cursor-pointer ${
              i === packIndex ? 'w-5 bg-cyan-500' : 'w-1.5 bg-slate-200 hover:bg-cyan-200'
            }`}
          />
        ))}
      </div>

      {/* Audio Player */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl overflow-hidden">
        <div className="px-6 pt-5 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">Audio</span>
          </div>
          <div className="flex items-center gap-1.5">
            {isPlaying ? (
              <button
                onClick={stopAll}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs cursor-pointer transition-colors"
              >
                <VolumeX className="w-3.5 h-3.5" /> Dừng
              </button>
            ) : (
              <button
                onClick={playAudio}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs cursor-pointer transition-colors disabled:opacity-40"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Phát lại
              </button>
            )}
          </div>
        </div>

        <AudioPlayer
          onPlay={playAudio}
          onStop={stopAll}
          isPlaying={isPlaying}
          isLoading={isLoading}
          hasError={hasError}
          playCount={playCount}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          isEdgeAudio={isEdgeAudio}
          onSeek={handleSeek}
          onVolumeChange={handleVolumeChange}
        />

        {/* Soundwave bars decoration */}
        {isPlaying && (
          <div className="flex items-end justify-center gap-1 h-8 pb-4 px-6">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="w-1 rounded-full bg-purple-400 animate-pulse"
                style={{
                  height: `${Math.random() * 20 + 4}px`,
                  animationDelay: `${i * 0.05}s`,
                  animationDuration: `${0.4 + Math.random() * 0.4}s`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Q&A section */}
      <AnswerSection
        key={`${packIndex}-${sessionKey}`}
        pack={pack}
        onNext={loadNextPack}
        onAnswered={onQuestionAnswered}
      />
    </div>
  )
}
