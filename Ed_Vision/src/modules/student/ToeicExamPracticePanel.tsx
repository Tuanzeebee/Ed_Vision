import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Clock3, Ear, FileText, Trophy, CheckCircle2 } from 'lucide-react'
import { explainToeicAnswer, type ToeicRepositoryDetailResponse } from '@/services/api/certificateService'

const LISTENING_FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1521791055366-0d553872125f?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=900&q=80',
]

function extractApiErrorMessage(error: unknown): string | null {
  const maybeError = error as {
    response?: {
      data?: {
        message?: string | string[]
      }
    }
  }
  const message = maybeError?.response?.data?.message
  if (Array.isArray(message) && message.length > 0) return String(message[0])
  if (typeof message === 'string' && message.trim().length > 0) return message
  return null
}

function isLikelyImageUrl(value: string | null | undefined): value is string {
  if (!value) return false
  return /\.(png|jpg|jpeg|webp|gif)$/i.test(value) || value.startsWith('http') || value.startsWith('/thumbs/')
}

type SubmitResult = {
  correctCount: number
  total: number
  gainedScore: number
  projectedScore: number
  isPassed: boolean
  passScore: number
}

type QuestionEvaluation = {
  selectedOptionId: number | null
  isCorrect: boolean
  analysisSummary: string
  detailFromDb: string[]
  awardedScore: number
}

function buildLocalExplanationDetail(
  currentItem: ToeicRepositoryDetailResponse['items'][number],
  selectedOptionId: number | null,
): {
  isCorrect: boolean
  analysisSummary: string
  detailFromDb: string[]
} {
  const correctOption = currentItem.options.find((option) => option.is_correct)
  const selectedOption = selectedOptionId
    ? currentItem.options.find((option) => option.id === selectedOptionId)
    : undefined

  const selectedText = selectedOption
    ? `${selectedOption.option_key}. ${selectedOption.option_text}`
    : 'Không chọn đáp án (hết thời gian).'
  const selectedRationale = selectedOption?.rationale?.trim()
  const correctText = correctOption
    ? `${correctOption.option_key}. ${correctOption.option_text}`
    : 'Không xác định được đáp án đúng.'
  const correctRationale = correctOption?.rationale?.trim()
  const generalExplanation = currentItem.explanation?.trim()

  const isCorrect = Boolean(selectedOption && selectedOption.is_correct)
  const analysisSummary = isCorrect
    ? `Bạn trả lời đúng. Lựa chọn của bạn: ${selectedText}. Đáp án đúng: ${correctText}.`
    : `Bạn trả lời sai. Lựa chọn của bạn: ${selectedText}. Đáp án đúng: ${correctText}.`

  const detailFromDb: string[] = []

  if (selectedOption && selectedOptionId !== null && !isCorrect) {
    detailFromDb.push(
      `Giải thích cho lựa chọn của bạn (${selectedOption.option_key}. ${selectedOption.option_text}): ${selectedRationale ?? 'Chưa có giải thích chi tiết trong dữ liệu.'}`,
    )
  }
  if (correctOption) {
    detailFromDb.push(
      `Vì sao đáp án đúng (${correctOption.option_key}. ${correctOption.option_text}): ${correctRationale ?? 'Chưa có giải thích chi tiết trong dữ liệu.'}`,
    )
  }
  if (generalExplanation) {
    detailFromDb.push(`Phân tích tổng quát: ${generalExplanation}`)
  }
  if (detailFromDb.length === 0) {
    detailFromDb.push('Hiện chưa có phần giải thích chi tiết cho câu này trong cơ sở dữ liệu.')
  }

  return {
    isCorrect,
    analysisSummary,
    detailFromDb,
  }
}

type ToeicPracticeDraft = {
  activeIndex: number
  answers: Record<number, number>
  evaluations: Record<number, QuestionEvaluation>
  totalElapsedSeconds: number
  liveScoreGain: number
}

type Props = {
  repository: ToeicRepositoryDetailResponse
  currentScore: number
  onLiveScoreChange?: (delta: number) => void
  onComplete: (payload: {
    answers: Array<{ itemId: number; optionId: number }>
    elapsedSeconds: number
    autoSubmitted: boolean
  }) => Promise<SubmitResult>
}

function formatSeconds(total: number): string {
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

function resolveQuestionSeconds(
  item: ToeicRepositoryDetailResponse['items'][number] | undefined,
  skillArea: string | null | undefined,
): number {
  if (!item) return 60
  const title = item.title?.toLowerCase() ?? ''
  if (skillArea === 'reading' && title.includes('part 5')) return 60

  const estimated = item.estimated_seconds
  if (typeof estimated === 'number' && Number.isFinite(estimated) && estimated > 0) {
    return Math.round(estimated)
  }

  return 60
}

export default function ToeicExamPracticePanel({ repository, currentScore, onLiveScoreChange, onComplete }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [evaluations, setEvaluations] = useState<Record<number, QuestionEvaluation>>({})
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [evaluatingItemId, setEvaluatingItemId] = useState<number | null>(null)
  const [questionTimeLeft, setQuestionTimeLeft] = useState(60)
  const [totalElapsedSeconds, setTotalElapsedSeconds] = useState(0)
  const [liveScoreGain, setLiveScoreGain] = useState(0)
  const autoSubmitTriggeredRef = useRef(false)
  const evaluatingItemsRef = useRef<Set<number>>(new Set())
  const draftStorageKey = useMemo(() => {
    const itemIds = repository.items.map((item) => item.id).join('-')
    return `toeic.practice.draft.${repository.slug}.${itemIds}`
  }, [repository.items, repository.slug])

  const currentItem = repository.items[activeIndex]
  const currentQuestionSeconds = useMemo(
    () => resolveQuestionSeconds(currentItem, repository.skill_area),
    [currentItem, repository.skill_area],
  )

  const removeDraft = useCallback(() => {
    try {
      window.localStorage.removeItem(draftStorageKey)
    } catch {
      // Ignore storage errors to avoid breaking exam flow.
    }
  }, [draftStorageKey])

  useEffect(() => {
    const defaultQuestionSeconds = resolveQuestionSeconds(repository.items[0], repository.skill_area)
    let restored = false

    try {
      const raw = window.localStorage.getItem(draftStorageKey)
      if (raw) {
        const parsed = JSON.parse(raw) as ToeicPracticeDraft
        const validIds = new Set(repository.items.map((item) => item.id))

        const restoredAnswers = Object.fromEntries(
          Object.entries(parsed.answers ?? {}).filter(([itemId]) => validIds.has(Number(itemId))),
        ) as Record<number, number>

        const restoredEvaluations = Object.fromEntries(
          Object.entries(parsed.evaluations ?? {}).filter(([itemId]) => validIds.has(Number(itemId))),
        ) as Record<number, QuestionEvaluation>

        const normalizedActiveIndex = Number.isInteger(parsed.activeIndex)
          ? Math.max(0, Math.min(repository.items.length - 1, parsed.activeIndex))
          : 0

        setActiveIndex(normalizedActiveIndex)
        setAnswers(restoredAnswers)
        setEvaluations(restoredEvaluations)
        setTotalElapsedSeconds(Math.max(0, Number(parsed.totalElapsedSeconds ?? 0)))
        setLiveScoreGain(Math.max(0, Number(parsed.liveScoreGain ?? 0)))

        const currentRestoredItem = repository.items[normalizedActiveIndex]
        const restoredSeconds = resolveQuestionSeconds(currentRestoredItem, repository.skill_area)
        setQuestionTimeLeft(restoredSeconds)
        restored = true
      }
    } catch {
      restored = false
    }

    if (!restored) {
      setActiveIndex(0)
      setAnswers({})
      setEvaluations({})
      setQuestionTimeLeft(defaultQuestionSeconds)
      setTotalElapsedSeconds(0)
      setLiveScoreGain(0)
    }

    setSubmitted(false)
    setSubmitting(false)
    setSubmitResult(null)
    setSubmitError(null)
    setEvaluatingItemId(null)
    evaluatingItemsRef.current.clear()
    autoSubmitTriggeredRef.current = false
  }, [draftStorageKey, repository.items, repository.skill_area, repository.slug])

  useEffect(() => {
    if (submitted) {
      removeDraft()
      return
    }

    const draft: ToeicPracticeDraft = {
      activeIndex,
      answers,
      evaluations,
      totalElapsedSeconds,
      liveScoreGain,
    }

    try {
      window.localStorage.setItem(draftStorageKey, JSON.stringify(draft))
    } catch {
      // Ignore storage quota errors.
    }
  }, [
    activeIndex,
    answers,
    draftStorageKey,
    evaluations,
    liveScoreGain,
    removeDraft,
    submitted,
    totalElapsedSeconds,
  ])

  useEffect(() => {
    if (submitted || !currentItem || evaluations[currentItem.id]) return
    const timer = window.setInterval(() => {
      setQuestionTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [currentItem, evaluations, submitted])

  useEffect(() => {
    setQuestionTimeLeft(currentQuestionSeconds)
  }, [activeIndex, currentQuestionSeconds])


  const currentPartLabel = useMemo(() => {
    const title = currentItem?.title?.toLowerCase() ?? ''
    if (title.includes('part 7')) return 'Part 7'
    if (title.includes('part 6')) return 'Part 6'
    if (title.includes('part 5')) return 'Part 5'
    return repository.skill_area === 'reading' ? 'Reading' : 'Listening'
  }, [currentItem?.title, repository.skill_area])
  const listeningImageUrl = useMemo(() => {
    if (repository.skill_area !== 'listening') return null
    const candidate = currentItem?.reading_passage
    if (isLikelyImageUrl(candidate)) return candidate
    return LISTENING_FALLBACK_IMAGES[activeIndex % LISTENING_FALLBACK_IMAGES.length]
  }, [activeIndex, currentItem?.reading_passage, repository.skill_area])

  const passage = useMemo(() => {
    if (repository.skill_area !== 'reading') return null
    return currentItem?.reading_passage ?? null
  }, [currentItem?.reading_passage, repository.skill_area])

  const answeredCount = Object.keys(evaluations).length
  const liveScore = submitResult ? submitResult.projectedScore : currentScore + liveScoreGain

  const evaluateCurrentAnswer = useCallback(async (selectedOptionId: number | null): Promise<void> => {
    if (!currentItem || submitted) return
    if (evaluations[currentItem.id]) return
    if (evaluatingItemsRef.current.has(currentItem.id)) return

    evaluatingItemsRef.current.add(currentItem.id)
    setEvaluatingItemId(currentItem.id)

    const localDetail = buildLocalExplanationDetail(currentItem, selectedOptionId)
    const correctOption = currentItem.options.find((option) => option.is_correct)
    const selectedOption = selectedOptionId
      ? currentItem.options.find((option) => option.id === selectedOptionId)
      : undefined

    const isCorrect = localDetail.isCorrect
    let analysisSummary = localDetail.analysisSummary
    let detailFromDb = localDetail.detailFromDb

    const awardedScore = isCorrect ? Math.max(1, currentItem.score_weight ?? 1) : 0
    const spentSeconds = Math.max(0, currentQuestionSeconds - questionTimeLeft)
    setTotalElapsedSeconds((prev) => prev + spentSeconds)

    try {
      if (selectedOptionId !== null) {
        try {
          const aiExplanation = await explainToeicAnswer(repository.slug, {
            item_id: currentItem.id,
            selected_option_id: selectedOptionId,
          })

          const selectedText = selectedOption
            ? `${selectedOption.option_key}. ${selectedOption.option_text}`
            : `ID ${aiExplanation.selected_option_id}`
          const correctText = correctOption
            ? `${correctOption.option_key}. ${correctOption.option_text}`
            : `ID ${aiExplanation.correct_option_id}`

          analysisSummary = aiExplanation.is_correct
            ? `Bạn trả lời đúng. Lựa chọn của bạn: ${selectedText}. Đáp án đúng: ${correctText}.`
            : `Bạn trả lời sai. Lựa chọn của bạn: ${selectedText}. Đáp án đúng: ${correctText}.`

          const sourceLabel =
            aiExplanation.source === 'cache'
              ? 'Bộ nhớ phân tích'
              : aiExplanation.source === 'ollama'
                ? 'Ollama'
                : 'Fallback'

          detailFromDb = [
            aiExplanation.explanation,
            `Nguồn phân tích: ${sourceLabel}${aiExplanation.model ? ` (${aiExplanation.model})` : ''}.`,
          ]
        } catch {
          // Keep local explanation when AI service is unavailable.
        }
      }

      setEvaluations((prev) => ({
        ...prev,
        [currentItem.id]: {
          selectedOptionId,
          isCorrect,
          analysisSummary,
          detailFromDb,
          awardedScore,
        },
      }))

      if (selectedOptionId !== null) {
        setAnswers((prev) => ({ ...prev, [currentItem.id]: selectedOptionId }))
      }

      if (awardedScore > 0) {
        setLiveScoreGain((prev) => prev + awardedScore)
        onLiveScoreChange?.(awardedScore)
      }
    } finally {
      evaluatingItemsRef.current.delete(currentItem.id)
      setEvaluatingItemId((prev) => (prev === currentItem.id ? null : prev))
    }
  }, [
    currentItem,
    currentQuestionSeconds,
    evaluations,
    repository.slug,
    onLiveScoreChange,
    questionTimeLeft,
    submitted,
  ])

  const handleSubmit = useCallback(async (autoSubmitted = false) => {
    if (submitted || submitting) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const answerPayload = Object.entries(answers).map(([itemId, optionId]) => ({
        itemId: Number(itemId),
        optionId,
      }))
      const elapsedSeconds = Math.max(0, totalElapsedSeconds)
      const result = await onComplete({
        answers: answerPayload,
        elapsedSeconds,
        autoSubmitted,
      })
      setSubmitResult(result)
      setSubmitted(true)
    } catch (error) {
      if (autoSubmitted) autoSubmitTriggeredRef.current = false
      setSubmitError(extractApiErrorMessage(error) ?? 'Không thể nộp bài lúc này. Vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }, [answers, onComplete, submitted, submitting, totalElapsedSeconds])

  useEffect(() => {
    if (!currentItem || submitted) return
    if (questionTimeLeft > 0) return
    if (evaluations[currentItem.id]) return

    void evaluateCurrentAnswer(null)
  }, [currentItem, evaluateCurrentAnswer, evaluations, questionTimeLeft, submitted])

  useEffect(() => {
    if (submitted || submitting || autoSubmitTriggeredRef.current) return
    if (repository.items.length === 0) return

    const hasAllEvaluated = repository.items.every((item) => Boolean(evaluations[item.id]))
    if (!hasAllEvaluated) return

    autoSubmitTriggeredRef.current = true
    void handleSubmit(true)
  }, [evaluations, handleSubmit, repository.items, submitted, submitting])

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-slate-900 p-4 text-white sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Toeic Exam Mode</p>
            <h2 className="text-lg font-bold sm:text-xl">{repository.title}</h2>
            <p className="text-xs text-slate-300">{repository.description}</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2">
            <Clock3 className="h-4 w-4 text-amber-300" />
            <span className="font-mono text-lg font-bold text-amber-200">{formatSeconds(questionTimeLeft)}</span>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          <div className="rounded-lg bg-white/10 px-3 py-2">Số câu: <span className="font-bold">{repository.items.length}</span></div>
          <div className="rounded-lg bg-white/10 px-3 py-2">Đã làm: <span className="font-bold">{answeredCount}</span></div>
          <div className="rounded-lg bg-white/10 px-3 py-2">Current score: <span className="font-bold">{liveScore}</span></div>
          <div className="rounded-lg bg-white/10 px-3 py-2">Pass: <span className="font-bold">{repository.pass_score}/{repository.total_items}</span></div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
            {repository.skill_area === 'reading' ? <FileText className="h-4 w-4 text-cyan-600" /> : <Ear className="h-4 w-4 text-cyan-600" />}
            {repository.skill_area === 'reading' ? `${currentPartLabel} · Câu hỏi` : 'Listening · Câu hỏi'}
          </div>
          {repository.skill_area === 'listening' && currentItem?.media_audio_url && (
            <audio className="mb-4 w-full" controls src={currentItem.media_audio_url} />
          )}
          {repository.skill_area === 'listening' && listeningImageUrl && (
            <img
              src={listeningImageUrl}
              alt="Listening context"
              className="mb-3 h-52 w-full rounded-xl border border-slate-200 object-cover"
            />
          )}
          {currentItem && (
            <div className="space-y-3">
              {repository.skill_area === 'reading' && passage && (
                <div className="max-h-[280px] overflow-y-auto rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
                  {passage}
                </div>
              )}
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-800">
                  {repository.skill_area === 'listening'
                    ? `Câu ${activeIndex + 1}: Chọn đáp án đúng theo nội dung audio.`
                    : `Câu ${activeIndex + 1}: ${currentItem.stem}`}
                </p>
              </div>
              {repository.skill_area === 'reading' && !passage && (
                <p className="text-xs text-slate-500">Câu này thuộc dạng điền từ ngữ cảnh (không có đoạn văn dài).</p>
              )}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">Answers</p>
            <p className="text-xs text-slate-500">{activeIndex + 1}/{repository.items.length}</p>
          </div>

          {currentItem && (
            <div className="space-y-3">
              {evaluations[currentItem.id] && (
                <div className={`rounded-xl border p-3 text-sm ${
                  evaluations[currentItem.id].isCorrect
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-rose-200 bg-rose-50 text-rose-800'
                }`}>
                  <p className="font-semibold leading-relaxed">{evaluations[currentItem.id].analysisSummary}</p>
                  <div className="mt-2 space-y-2">
                    {evaluations[currentItem.id].detailFromDb.map((line, idx) => (
                      <p key={`${currentItem.id}-analysis-${idx}`} className="leading-relaxed">{line}</p>
                    ))}
                  </div>
                </div>
              )}
              {currentItem.options.map((option) => {
                const chosen = evaluations[currentItem.id]
                  ? evaluations[currentItem.id].selectedOptionId === option.id
                  : answers[currentItem.id] === option.id
                const optionIsCorrect = option.is_correct
                const alreadyEvaluated = Boolean(evaluations[currentItem.id])
                const isEvaluatingCurrent = evaluatingItemId === currentItem.id
                return (
                  <button
                    key={option.id}
                    disabled={submitted || alreadyEvaluated || isEvaluatingCurrent}
                    onClick={() => {
                      if (submitted || alreadyEvaluated || isEvaluatingCurrent) return
                      void evaluateCurrentAnswer(option.id)
                    }}
                    className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
                      alreadyEvaluated
                        ? optionIsCorrect
                          ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
                          : chosen
                            ? 'border-rose-300 bg-rose-50 text-rose-700'
                            : 'border-slate-200 bg-slate-50 text-slate-500'
                        : chosen
                          ? 'border-cyan-500 bg-cyan-50 text-cyan-800'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                    } ${(submitted || alreadyEvaluated || isEvaluatingCurrent) ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
                  >
                    <span className="mr-2 font-bold">{option.option_key}.</span>
                    {option.option_text}
                  </button>
                )
              })}
              {evaluatingItemId === currentItem.id && (
                <p className="text-xs font-medium text-slate-500">Đang phân tích đáp án với AI...</p>
              )}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between gap-2">
            <button
              onClick={() => setActiveIndex((prev) => Math.max(0, prev - 1))}
              disabled={activeIndex === 0}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-40"
            >
              Câu trước
            </button>
            {!submitted ? (
              <button
                onClick={() => void handleSubmit(false)}
                disabled={submitting}
                className="rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? 'Submitting...' : 'Submit Test'}
              </button>
            ) : (
              <div className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" /> Completed
              </div>
            )}
            <button
              onClick={() => setActiveIndex((prev) => Math.min(repository.items.length - 1, prev + 1))}
              disabled={activeIndex >= repository.items.length - 1}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-40"
            >
              Câu tiếp theo
            </button>
          </div>
        </div>
      </div>

      {submitError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{submitError}</div>
      )}

      {submitted && submitResult && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <div className="mb-1 flex items-center gap-2 font-bold">
            <Trophy className="h-4 w-4" /> Session Result
          </div>
          Bạn trả lời đúng {submitResult.correctCount}/{submitResult.total} câu.
          {` `}
          +{submitResult.gainedScore} điểm, dự kiến hiện tại {submitResult.projectedScore}.
          {` `}
          {submitResult.isPassed
            ? `Đạt yêu cầu (${submitResult.passScore} câu trở lên).`
            : `Chưa đạt yêu cầu (${submitResult.passScore} câu trở lên).`}
        </div>
      )}
    </div>
  )
}
