import { useMemo, useState } from 'react'
import { Gauge, Target, Sparkles, ChevronRight, CheckCircle2, BarChart3, PenSquare } from 'lucide-react'
import type { ToeicBand } from './toeicIntake'
import {
  createToeicMilestoneState,
  estimateToeicScore,
  mapToeicScoreToBand,
  saveToeicIntakeProfile,
} from './toeicIntake'

type PlacementChoice = {
  label: string
  points: number
}

type PlacementQuestion = {
  id: string
  section: 'listening' | 'reading'
  prompt: string
  choices: PlacementChoice[]
}

type Stage = 'entry' | 'self-reported' | 'placement' | 'result'

type Props = {
  onConfirmBand: (band: ToeicBand) => void
}

type IntakeResult = {
  mode: 'estimated' | 'self-reported'
  current: number
  target: number | null
  estimatedListening: number | null
  estimatedReading: number | null
  band: ToeicBand
}

const QUESTIONS: PlacementQuestion[] = [
  {
    id: 'l1',
    section: 'listening',
    prompt: 'Nghe hội thoại công việc tốc độ tự nhiên, bạn thường hiểu được bao nhiêu?',
    choices: [
      { label: 'Chỉ bắt được từ rời rạc', points: 1 },
      { label: 'Nắm ý chính nhưng thiếu chi tiết', points: 2 },
      { label: 'Nắm khá tốt cả ý chính và chi tiết', points: 3 },
      { label: 'Hiểu gần như đầy đủ', points: 4 },
    ],
  },
  {
    id: 'l2',
    section: 'listening',
    prompt: 'Part 2 (Question-Response), tỉ lệ đúng của bạn thường là?',
    choices: [
      { label: 'Dưới 40%', points: 1 },
      { label: 'Khoảng 40-60%', points: 2 },
      { label: 'Khoảng 60-80%', points: 3 },
      { label: 'Trên 80%', points: 4 },
    ],
  },
  {
    id: 'l3',
    section: 'listening',
    prompt: 'Khi nghe Part 3-4 dài, bạn có thể theo dõi mạch nội dung?',
    choices: [
      { label: 'Rất khó theo kịp', points: 1 },
      { label: 'Theo kịp được khoảng một nửa', points: 2 },
      { label: 'Theo kịp phần lớn nội dung', points: 3 },
      { label: 'Theo kịp ổn định', points: 4 },
    ],
  },
  {
    id: 'r1',
    section: 'reading',
    prompt: 'Part 5-6 (ngữ pháp, từ vựng), độ tự tin của bạn?',
    choices: [
      { label: 'Thường đoán nhiều', points: 1 },
      { label: 'Làm được dạng cơ bản', points: 2 },
      { label: 'Làm tốt đa số câu', points: 3 },
      { label: 'Làm tốt và nhanh', points: 4 },
    ],
  },
  {
    id: 'r2',
    section: 'reading',
    prompt: 'Part 7 (single/multiple passage), tốc độ đọc của bạn?',
    choices: [
      { label: 'Thường không kịp giờ', points: 1 },
      { label: 'Kịp khoảng 70-80%', points: 2 },
      { label: 'Thường kịp và còn soát lại', points: 3 },
      { label: 'Kịp tốt, xử lý nhanh câu suy luận', points: 4 },
    ],
  },
  {
    id: 'r3',
    section: 'reading',
    prompt: 'Khi gặp từ mới trong bài đọc, bạn xử lý như thế nào?',
    choices: [
      { label: 'Dễ mất mạch bài', points: 1 },
      { label: 'Đoán được một phần theo ngữ cảnh', points: 2 },
      { label: 'Đoán nghĩa khá tốt', points: 3 },
      { label: 'Đoán và xác nhận rất nhanh', points: 4 },
    ],
  },
]

function roadmapHintText(current: number, target: number | null): string {
  if (!target || target <= current) {
    return 'Hệ thống ưu tiên xây nền theo điểm hiện tại và tự mở các cột mốc tăng tốc phù hợp.'
  }

  const delta = target - current
  if (delta >= 250) {
    return 'Khoảng tăng mục tiêu khá lớn. Nên đi theo lộ trình từng chặng để tránh quá tải.'
  }

  if (delta >= 120) {
    return 'Mục tiêu tăng điểm ở mức vừa. Kế hoạch sẽ tập trung cả kỹ thuật làm bài và độ chính xác.'
  }

  return 'Mục tiêu tăng điểm ngắn hạn. Kế hoạch tập trung tối ưu điểm yếu để bứt nhanh.'
}

export default function ToeicIntakePanel({ onConfirmBand }: Props) {
  const [stage, setStage] = useState<Stage>('entry')
  const [currentScore, setCurrentScore] = useState<string>('')
  const [targetScore, setTargetScore] = useState<string>('')
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [result, setResult] = useState<IntakeResult | null>(null)

  const placementDone = Object.keys(answers).length === QUESTIONS.length

  const placementSummary = useMemo(() => {
    const listeningRaw = QUESTIONS.filter((q) => q.section === 'listening').reduce(
      (sum, q) => sum + (answers[q.id] ?? 0),
      0
    )
    const readingRaw = QUESTIONS.filter((q) => q.section === 'reading').reduce(
      (sum, q) => sum + (answers[q.id] ?? 0),
      0
    )

    const listeningMax = QUESTIONS.filter((q) => q.section === 'listening').length * 4
    const readingMax = QUESTIONS.filter((q) => q.section === 'reading').length * 4

    const estimatedListening = Math.min(495, Math.round(120 + (listeningRaw / listeningMax) * 375))
    const estimatedReading = Math.min(495, Math.round(120 + (readingRaw / readingMax) * 375))
    const estimatedTotal = Math.min(990, estimatedListening + estimatedReading)

    return {
      estimatedListening,
      estimatedReading,
      estimatedTotal,
      recommendedBand: mapToeicScoreToBand(estimatedTotal),
    }
  }, [answers])

  const selfFlow = useMemo(() => {
    const current = Number(currentScore)
    const target = targetScore.trim() ? Number(targetScore) : null

    const validCurrent = Number.isFinite(current) && current >= 10 && current <= 990
    const validTarget =
      target === null || (Number.isFinite(target) && target >= 10 && target <= 990 && target >= current)

    if (!validCurrent || !validTarget) {
      return { valid: false as const }
    }

    const recommendedBand = mapToeicScoreToBand(current)
    return {
      valid: true as const,
      current,
      target,
      recommendedBand,
    }
  }, [currentScore, targetScore])

  const submitPlacement = () => {
    if (!placementDone) return

    const nextResult: IntakeResult = {
      mode: 'estimated',
      current: placementSummary.estimatedTotal,
      target: null,
      estimatedListening: placementSummary.estimatedListening,
      estimatedReading: placementSummary.estimatedReading,
      band: placementSummary.recommendedBand,
    }

    saveToeicIntakeProfile({
      mode: 'estimated',
      recommendedBand: nextResult.band,
      currentScore: nextResult.current,
      targetScore: null,
      estimatedListening: nextResult.estimatedListening,
      estimatedReading: nextResult.estimatedReading,
      milestoneState: createToeicMilestoneState(nextResult.current, nextResult.target),
      updatedAt: new Date().toISOString(),
    })

    setResult(nextResult)
    setStage('result')
  }

  const submitSelfReported = () => {
    if (!selfFlow.valid) return

    const nextResult: IntakeResult = {
      mode: 'self-reported',
      current: selfFlow.current,
      target: selfFlow.target,
      estimatedListening: null,
      estimatedReading: null,
      band: selfFlow.recommendedBand,
    }

    saveToeicIntakeProfile({
      mode: 'self-reported',
      recommendedBand: nextResult.band,
      currentScore: nextResult.current,
      targetScore: nextResult.target,
      estimatedListening: null,
      estimatedReading: null,
      milestoneState: createToeicMilestoneState(nextResult.current, nextResult.target),
      updatedAt: new Date().toISOString(),
    })

    setResult(nextResult)
    setStage('result')
  }

  const renderEntry = () => (
    <div className="relative overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-xl">
      <div className="absolute -left-20 -top-20 h-56 w-56 rounded-full bg-cyan-200/50 blur-3xl" />
      <div className="absolute -right-20 -bottom-24 h-72 w-72 rounded-full bg-indigo-200/45 blur-3xl" />
      <div className="relative p-7 sm:p-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
          <Sparkles className="h-3.5 w-3.5" /> Cá nhân hoá lộ trình TOEIC
        </div>
        <h3 className="mt-4 text-2xl font-black tracking-tight text-slate-800 sm:text-3xl">
          Bắt đầu thông minh, học theo đúng cột mốc ngay từ đầu
        </h3>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
          Chọn cách xác định điểm xuất phát. Hệ thống sẽ tự tạo lộ trình TOEIC theo điểm hiện tại và mục tiêu của bạn.
        </p>

        <div className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-2">
          <button
            onClick={() => setStage('placement')}
            className="group rounded-2xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-sky-50 p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="mb-3 flex items-center gap-2 text-cyan-700">
              <Gauge className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Chưa có điểm TOEIC</span>
            </div>
            <p className="text-lg font-bold text-slate-800">Làm Placement Test mini</p>
            <p className="mt-1 text-sm text-slate-600">Khoảng 3-5 phút để ước lượng điểm hiện tại.</p>
            <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-cyan-700">
              Bắt đầu test <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </div>
          </button>

          <button
            onClick={() => setStage('self-reported')}
            className="group rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50 p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="mb-3 flex items-center gap-2 text-indigo-700">
              <Target className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Đã có điểm TOEIC</span>
            </div>
            <p className="text-lg font-bold text-slate-800">Nhập điểm hiện tại và mục tiêu</p>
            <p className="mt-1 text-sm text-slate-600">Tạo kế hoạch ôn luyện theo cột mốc tăng điểm.</p>
            <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-indigo-700">
              Nhập điểm ngay <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </div>
          </button>
        </div>
      </div>
    </div>
  )

  const renderSelfReported = () => (
    <div className="rounded-3xl border border-indigo-100 bg-white p-7 shadow-xl sm:p-9">
      <div className="mb-6 flex items-center gap-2 text-indigo-700">
        <PenSquare className="h-5 w-5" />
        <h3 className="text-xl font-black text-slate-800">Thiết lập mục tiêu TOEIC</h3>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-slate-700">Điểm hiện tại</span>
          <input
            type="number"
            min={10}
            max={990}
            value={currentScore}
            onChange={(e) => setCurrentScore(e.target.value)}
            placeholder="Ví dụ: 450"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-slate-700">Điểm mục tiêu (tuỳ chọn)</span>
          <input
            type="number"
            min={10}
            max={990}
            value={targetScore}
            onChange={(e) => setTargetScore(e.target.value)}
            placeholder="Ví dụ: 650"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </label>
      </div>

      {!selfFlow.valid && (
        <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          Điểm phải trong khoảng 10-990, và điểm mục tiêu cần lớn hơn hoặc bằng điểm hiện tại.
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          onClick={() => setStage('entry')}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          Quay lại
        </button>
        <button
          onClick={submitSelfReported}
          disabled={!selfFlow.valid}
          className="rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 px-5 py-2.5 text-sm font-bold text-white transition hover:from-indigo-700 hover:to-sky-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Tạo kế hoạch học
        </button>
      </div>
    </div>
  )

  const renderPlacement = () => (
    <div className="rounded-3xl border border-cyan-100 bg-white p-7 shadow-xl sm:p-9">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-cyan-700">
          <BarChart3 className="h-5 w-5" />
          <h3 className="text-xl font-black text-slate-800">Placement Test TOEIC mini</h3>
        </div>
        <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
          {Object.keys(answers).length}/{QUESTIONS.length} câu
        </span>
      </div>

      <div className="space-y-4">
        {QUESTIONS.map((q, idx) => (
          <div key={q.id} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <p className="text-sm font-semibold text-slate-700">
              Câu {idx + 1}. {q.prompt}
            </p>
            <div className="mt-3 grid gap-2">
              {q.choices.map((choice, choiceIdx) => {
                const active = answers[q.id] === choice.points
                return (
                  <button
                    key={choiceIdx}
                    onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: choice.points }))}
                    className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                      active
                        ? 'border-cyan-400 bg-cyan-50 text-cyan-800'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-cyan-200'
                    }`}
                  >
                    {choice.label}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          onClick={() => setStage('entry')}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          Quay lại
        </button>
        <button
          onClick={submitPlacement}
          disabled={!placementDone}
          className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:from-cyan-700 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Xem kết quả test
        </button>
      </div>
    </div>
  )

  const renderResult = () => {
    const safeResult: IntakeResult =
      result ?? {
        mode: 'estimated',
        current: estimateToeicScore(0, 1),
        target: null,
        estimatedListening: null,
        estimatedReading: null,
        band: '350-495',
      }

    const current = safeResult.current
    const target = safeResult.target

    return (
      <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-white p-7 shadow-xl sm:p-9">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-200/45 blur-3xl" />
        <div className="relative">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <h3 className="text-center text-2xl font-black text-slate-800">Kết quả đánh giá TOEIC</h3>
          <p className="mt-1 text-center text-sm text-slate-500">Lộ trình cá nhân hóa đã sẵn sàng theo điểm hiện tại và mục tiêu của bạn.</p>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Điểm hiện tại</p>
              <p className="mt-2 text-3xl font-black text-slate-800">{current}</p>
              <p className="text-xs text-slate-500">/ 990</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mục tiêu</p>
              <p className="mt-2 text-3xl font-black text-slate-800">{target ?? '--'}</p>
              <p className="text-xs text-slate-500">{target ? '/ 990' : 'Chưa đặt'}</p>
            </div>
          </div>

          {safeResult.mode === 'estimated' && safeResult.estimatedListening !== null && safeResult.estimatedReading !== null && (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-slate-700">
                Listening ước lượng: <span className="font-bold text-sky-700">{safeResult.estimatedListening}</span>/495
              </div>
              <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-slate-700">
                Reading ước lượng: <span className="font-bold text-indigo-700">{safeResult.estimatedReading}</span>/495
              </div>
            </div>
          )}

          <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            {roadmapHintText(current, target)}
          </p>

          <div className="mt-4 rounded-xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-cyan-800">
            Mỗi phiên 10 câu sẽ được cộng điểm cột mốc theo công thức: đúng 1 câu = +2.5 điểm TOEIC.
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setStage('entry')}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Đánh giá lại
            </button>
            <button
              onClick={() => onConfirmBand(safeResult.band)}
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-2.5 text-sm font-bold text-white transition hover:from-emerald-600 hover:to-cyan-600"
            >
              Vào lộ trình TOEIC cá nhân
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (stage === 'entry') return renderEntry()
  if (stage === 'self-reported') return renderSelfReported()
  if (stage === 'placement') return renderPlacement()
  return renderResult()
}
