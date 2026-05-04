import { useState, useRef, useEffect } from 'react'
import { buildAssetUrl } from '@/services/api/config'

interface Props {
  audioUrl: string       // "/audio/passages/xxx.mp3"
  onFinished: () => void // callback khi nghe xong → hiện MCQ
}

export function ListeningPlayer({ audioUrl, onFinished }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'playing' | 'done'>('idle')
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = '' // kill hoàn toàn, không phát tiếp
        audioRef.current = null
      }
    }
  }, [audioUrl]) // chạy lại mỗi khi đổi câu mới

  const handlePlay = () => {
    if (status !== 'idle') return
    setStatus('loading')

  const resolvedUrl = buildAssetUrl(audioUrl)
  const audio = new Audio(resolvedUrl)
    audioRef.current = audio

    audio.oncanplaythrough = () => {
      setStatus('playing')
      audio.play()
    }

    audio.onended = () => {
      setStatus('done')
      onFinished()
    }

    audio.onerror = () => {
      setStatus('idle')
      console.error('Audio load failed', { audioUrl, resolvedUrl })
    }
  }

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = '' // ← thêm dòng này
      audioRef.current = null
    }
    setStatus('done')
    onFinished()
  }

  return (
    <div className="text-center my-6 p-6 border-2 border-dashed border-indigo-200 rounded-xl bg-indigo-50/30">
      {status === 'idle' && (
        <button
          onClick={handlePlay}
          className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-lg shadow-indigo-200 transition-all active:scale-95 text-lg font-semibold flex items-center gap-2 mx-auto"
        >
          <span>▶️</span> Nghe đoạn audio
        </button>
      )}

      {status === 'loading' && (
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">⏳ Đang tải audio...</p>
        </div>
      )}

      {status === 'playing' && (
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-1 items-end h-8">
            {[4, 8, 6, 10, 5, 9, 4, 7].map((h, i) => (
              <div
                key={i}
                className="w-1.5 bg-indigo-500 rounded-full animate-pulse"
                style={{ height: `${h * 4}px`, animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
          <p className="text-indigo-600 font-bold">🔊 Đang phát audio...</p>
          <button
            onClick={handleStop}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold text-sm transition-all active:scale-95 flex items-center gap-2 shadow-md"
          >
            <span>⏹</span> Dừng & Trả lời ngay
          </button>
          <p className="text-xs text-slate-400">Hoặc nghe hết để tự động hiện câu hỏi</p>
        </div>
      )}

      {status === 'done' && (
        <p className="text-emerald-600 font-bold flex items-center gap-2 justify-center">
          <span className="text-xl">✅</span> Đã nghe xong — hãy chọn đáp án bên dưới
        </p>
      )}
    </div>
  )
}
