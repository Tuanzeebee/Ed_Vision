import { useState, useRef, useEffect } from 'react'
import { buildUrl } from '@/services/api/config'

const MAX_SECONDS = 60

interface SpeakingResult {
  band: number | null;
  feedback: string;
  transcript: string;
  skipped: boolean;
  nextQuestion: any;
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
  const [secondsLeft, setSeconds] = useState(MAX_SECONDS);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isSkipped, setIsSkipped] = useState(false);
  const MAX_RETRIES = 1; // cho phép retry 1 lần

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
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);

      // ✅ Detect audio rỗng tại FE luôn — không cần gọi server
      if (blob.size < 5000) {
        recorder.stream.getTracks().forEach((t) => t.stop());

        if (retryCount < MAX_RETRIES) {
          // Lần 1: cho retry
          setRetryCount((prev) => prev + 1);
          setError('Không phát hiện giọng nói. Hãy thử lại và nói rõ hơn.');
          updateStatus('idle');
          return;
        } else {
          // Lần 2: bỏ qua câu
          setIsSkipped(true);
          updateStatus('done');
          onResult({
            band: null,
            feedback: '',
            transcript: '',
            skipped: true,
            nextQuestion: null, // FE tự fetch câu tiếp
          });
          return;
        }
      }

      recorder.stream.getTracks().forEach((t) => t.stop());

      updateStatus('submitting');

      try {
        const formData = new FormData();
        formData.append('audio', blob, 'speaking.webm');
        formData.append('sessionId', sessionId);
        formData.append('questionId', questionId);
        formData.append('speakingPrompt', speakingPrompt);
        formData.append('timeTakenSec', String(timeTaken));

        const res = await fetch(buildUrl('/placement/speaking-submit'), {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();

        if (data.speakingSkipped) {
          setIsSkipped(true);
          updateStatus('done');
          onResult({
            band: null,
            feedback: '',
            transcript: '',
            skipped: true,
            nextQuestion: null,
          });
          return;
        }

        updateStatus('done');
        onResult({
          band: data.speakingResult.band,
          feedback: data.speakingResult.feedback,
          transcript: data.speakingResult.transcript,
          skipped: false,
          nextQuestion: data.nextQuestion,
        });
      } catch (err) {
        setError('Lỗi khi nộp bài. Vui lòng thử lại.');
        updateStatus('idle');
      }
    };

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
        <div className="flex flex-col items-center">
          {retryCount > 0 && (
            <p className="text-amber-500 text-sm mb-4 font-medium">
              ⚠️ Lần thử {retryCount + 1}/2 — hãy nói rõ ràng hơn
            </p>
          )}
          <button
            onClick={startRecording}
            className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-200 transition-all active:scale-90 group relative"
          >
            <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-20 group-hover:hidden"></div>
            <span className="text-2xl">🎤</span>
          </button>
        </div>
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
          {isSkipped ? (
            <div className="text-center p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-4">
              <p className="text-slate-500 font-medium flex items-center justify-center gap-2">
                ⏭ Câu Speaking đã được bỏ qua
              </p>
              <p className="text-slate-400 text-xs mt-1">
                Kỹ năng Speaking sẽ hiển thị "Chưa đánh giá"
              </p>
              <button
                onClick={() =>
                  onResult({
                    band: null,
                    feedback: '',
                    transcript: '',
                    skipped: true,
                    nextQuestion: null,
                  })
                }
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all active:scale-95"
              >
                Tiếp tục →
              </button>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mb-4">
                ✓
              </div>
              <p className="text-emerald-600 font-black text-xl">
                Submission Successful!
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
