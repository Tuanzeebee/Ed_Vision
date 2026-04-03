import { ChevronLeft, ChevronRight, X } from 'lucide-react'

type Props = {
  open: boolean
  step: number
  isSaving?: boolean
  onPrevious: () => void
  onNext: () => void
  onClose: () => void
}

const STEPS = [
  {
    title: 'Chào mừng bạn đến TOEIC L&R',
    body: 'Lộ trình này tập trung vào 2 kỹ năng Listening và Reading, không học dàn trải các kỹ năng khác.',
    highlights: [
      'Bước 1: xem điểm hiện tại và mốc mục tiêu trong thanh Milestone.',
      'Bước 2: chọn nền tảng nếu bạn mất gốc hoặc bỏ qua để vào bài luyện ngay.',
      'Bước 3: bắt đầu từ Listening Sprint hoặc Reading Sprint theo mốc được mở.',
    ],
  },
  {
    title: 'Cách tăng điểm nhanh hơn',
    body: 'Bạn có thể theo dõi tiến độ rất trực quan và điểm sẽ tự cộng sau mỗi câu trả lời trong bài luyện thật.',
    highlights: [
      'Rê chuột vào cột mốc hiện tại để xem gợi ý học phù hợp nhất lúc này.',
      'Mỗi câu Listening/Reading đúng sẽ cộng trực tiếp vào tiến độ Milestone.',
      'Khi hoàn tất popup này, hệ thống sẽ ghi nhận bạn đã vào tính năng và không hiện lại nữa.',
    ],
  },
]

export default function ToeicFirstGuidePopup({
  open,
  step,
  isSaving = false,
  onPrevious,
  onNext,
  onClose,
}: Props) {
  if (!open) return null

  const safeStep = Math.max(0, Math.min(STEPS.length - 1, step))
  const isLastStep = safeStep === STEPS.length - 1

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 p-3 sm:p-5">
      <div className="relative w-full max-w-5xl overflow-hidden rounded-2xl border border-cyan-100 bg-white shadow-2xl">
        <div
          className="flex w-[200%] transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${safeStep * 50}%)` }}
        >
          {STEPS.map((item, idx) => (
            <div key={idx} className="w-1/2 shrink-0 p-5 sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-600">
                Hướng dẫn {idx + 1}/{STEPS.length}
              </p>
              <h3 className="mt-2 text-xl font-black text-slate-700 sm:text-3xl">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">{item.body}</p>

              <ul className="mt-4 space-y-2">
                {item.highlights.map((point) => (
                  <li key={point} className="flex items-start gap-2 text-sm text-slate-700 sm:text-[15px]">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-cyan-500" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-4 py-3 sm:px-6">
          <div>
            {safeStep > 0 ? (
              <button
                onClick={onPrevious}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
            ) : (
              <span className="text-xs text-slate-400">Bước đầu tiên</span>
            )}
          </div>

          <div>
            {isLastStep ? (
              <button
                onClick={onClose}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:from-cyan-700 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <X className="h-4 w-4" /> {isSaving ? 'Đang lưu...' : 'Đóng hướng dẫn'}
              </button>
            ) : (
              <button
                onClick={onNext}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
