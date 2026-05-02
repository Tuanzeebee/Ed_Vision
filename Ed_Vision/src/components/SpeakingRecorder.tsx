import { useState, useRef, useEffect } from 'react'

const BACKEND_URL = 'http://localhost:3000'
const MAX_SECONDS = 60

interface SpeakingResult {
  band:         number
  feedback:     string
  transcript:   string
  nextQuestion: any
}

interface Props {
  sessionId:      string
  questionId:     string
  speakingPrompt: string
  onResult:       (result: SpeakingResult) => void
}

export function SpeakingRecorder({
  sessionId,
  questionId,
  speakingPrompt,
  onResult,
}: Props) {
  const [status, setStatus]       = useState<'idle' | 'recording' | 'submitting' | 'done'>('idle')
  const statusRef = useRef<'idle' | 'recording' | 'submitting' | 'done'>('idle')
  const [secondsLeft, setSeconds] = useState(MAX_SECONDS)
  const [error, setError]         = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef        = useRef<Blob[]>([])
  const timerRef         = useRef<number | null>(null)
  const startTimeRef     = useRef<number>(0)

  // Sửa setStatus để sync cả ref
  const updateStatus = (s: 'idle' | 'recording' | 'submitting' | 'done') => {
    statusRef.current = s
    setStatus(s)
  }

  const startRecording = async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.start(100)
      startTimeRef.current = Date.now()
      updateStatus('recording')
      setSeconds(MAX_SECONDS)

      timerRef.current = window.setInterval(() => {
        setSeconds(prev => {
          if (prev <= 1) {
            stopAndSubmit()
            return 0
          }
          return prev - 1
        })
      }, 1000)

    } catch (err) {
      setError('Không thể truy cập microphone. Hãy cho phép quyền microphone.')
    }
  }

  const stopAndSubmit = async () => {
    if (statusRef.current !== 'recording') return
    if (timerRef.current) clearInterval(timerRef.current)

    const recorder = mediaRecorderRef.current
    if (!recorder) return

    recorder.onstop = async () => {
      const blob      = new Blob(chunksRef.current, { type: 'audio/webm' })
      const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000)

      recorder.stream.getTracks().forEach(t => t.stop())

      updateStatus('submitting')

      try {
        const formData = new FormData()
        formData.append('audio',          blob, 'speaking.webm')
        formData.append('sessionId',      sessionId)
        formData.append('questionId',     questionId)
        formData.append('speakingPrompt', speakingPrompt)
        formData.append('timeTakenSec',   String(timeTaken))

        const res  = await fetch(`${BACKEND_URL}/placement/speaking-submit`, {
          method: 'POST',
          body:   formData,
        })
        const data = await res.json()

        updateStatus('done')
        onResult({
          band:         data.speakingResult.band,
          feedback:     data.speakingResult.feedback,
          transcript:   data.speakingResult.transcript,
          nextQuestion: data.nextQuestion,
        })
      } catch (err) {
        setError('Lỗi khi nộp bài. Vui lòng thử lại.')
        updateStatus('idle')
      }
    }

    recorder.stop()
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
        mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop())
      }
    }
  }, [])

  return (
    <div className="flex flex-col items-center p-8 bg-slate-50 rounded-2xl border-2 border-slate-100 shadow-sm transition-all">
      <h3 className="text-lg font-bold text-slate-800 mb-2">Speaking Assessment</h3>
      <p className="text-slate-600 text-center mb-8 max-w-lg italic">
        "{speakingPrompt}"
      </p>

      {error && (
        <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-lg border border-red-100 text-sm flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      {status === 'idle' && (
        <button
          onClick={startRecording}
          className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-200 transition-all active:scale-90 group relative"
        >
          <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-20 group-hover:hidden"></div>
          <span className="text-2xl">🎤</span>
        </button>
      )}

      {status === 'recording' && (
        <div className="flex flex-col items-center">
          <div className="relative mb-6">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64" cy="64" r="58"
                stroke="currentColor" strokeWidth="8"
                fill="transparent"
                className="text-slate-200"
              />
              <circle
                cx="64" cy="64" r="58"
                stroke="currentColor" strokeWidth="8"
                fill="transparent"
                strokeDasharray={364.4}
                strokeDashoffset={364.4 * (1 - secondsLeft / MAX_SECONDS)}
                className="text-red-500 transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-black text-slate-800">{secondsLeft}s</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mb-6">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-red-500 font-bold tracking-widest uppercase text-xs">Recording</span>
          </div>

          <button
            onClick={stopAndSubmit}
            className="px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-full font-medium transition-all flex items-center gap-2"
          >
            <div className="w-3 h-3 bg-white rounded-sm"></div> Dừng và Nộp
          </button>
        </div>
      )}

      {status === 'submitting' && (
        <div className="flex flex-col items-center py-4">
          <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p className="text-indigo-600 font-bold animate-pulse">AI is scoring your speech...</p>
          <p className="text-slate-400 text-sm mt-1">Generating band and feedback</p>
        </div>
      )}

      {status === 'done' && (
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mb-4">
            ✓
          </div>
          <p className="text-emerald-600 font-black text-xl">Submission Successful!</p>
        </div>
      )}
    </div>
  )
}
