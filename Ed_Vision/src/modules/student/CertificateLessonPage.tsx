import { useState, useMemo, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Layers,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lightbulb,
  Target,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  Menu,
  X,
  Headphones,
  Eye,
  Brain,
  BookMarked,
} from 'lucide-react'
import { getSkills, getBandOption, CERTIFICATES } from './certificateData'
import type { CertId, CertBand, SkillSection } from './certificateData'
import { TOPIC_LESSONS } from './certificateLessons'
import type { TenseEntry, LessonRule, QuizQuestion } from './certificateLessons'
import { ListeningPlayer } from './ListeningPlayer'
import { LISTENING_PACKS_BY_KEY } from './certificateListeningData'
import SpeakingPractice from './SpeakingPractice'
import { SPEAKING_PACKS } from './certificateSpeakingData'
import { appendToeicPracticeResult, getToeicIntakeProfile, saveToeicIntakeProfile } from './toeicIntake'
import {
  getToeicRepositoryDetail,
  getToeicRepositoryOverview,
  submitToeicRepositoryAnswers,
  type ToeicRepositoryDetailResponse,
  type ToeicRepositoryOverviewItem,
} from '@/services/api/certificateService'
import ToeicExamPracticePanel from './ToeicExamPracticePanel'

function getApiMessage(error: unknown): string | null {
  const maybe = error as { response?: { data?: { message?: string | string[] } } }
  const message = maybe?.response?.data?.message
  if (Array.isArray(message) && message.length > 0) return String(message[0])
  if (typeof message === 'string' && message.trim().length > 0) return message
  return null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface FlatTopic {
  topicKey: string
  title: string
  desc: string
  done: boolean
  skillLabel: string
  skillColor: string
  skillBg: string
  skillIcon: React.ReactNode
}

function buildFlatTopics(skills: SkillSection[]): FlatTopic[] {
  const flat: FlatTopic[] = []
  for (const skill of skills) {
    for (const topic of skill.topics) {
      if (topic.topicKey) {
        flat.push({
          topicKey: topic.topicKey,
          title: topic.title,
          desc: topic.desc,
          done: topic.done,
          skillLabel: skill.label,
          skillColor: skill.color,
          skillBg: skill.bg,
          skillIcon: skill.icon,
        })
      }
    }
  }
  return flat
}

function mapToeicOverviewToSkills(items: ToeicRepositoryOverviewItem[]): SkillSection[] {
  const skillMeta: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    listening: {
      label: 'Listening',
      color: 'text-cyan-600',
      bg: 'bg-cyan-50',
      icon: <Headphones className="w-4 h-4" />,
    },
    reading: {
      label: 'Reading',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      icon: <Eye className="w-4 h-4" />,
    },
    grammar: {
      label: 'Grammar',
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      icon: <Brain className="w-4 h-4" />,
    },
    vocabulary: {
      label: 'Vocabulary',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      icon: <BookMarked className="w-4 h-4" />,
    },
  }

  const bySkill = new Map<string, ToeicRepositoryOverviewItem[]>()
  for (const item of items) {
    const key = item.skill_area || 'reading'
    const existing = bySkill.get(key) ?? []
    existing.push(item)
    bySkill.set(key, existing)
  }

  const orderedSkills = ['listening', 'reading', 'grammar', 'vocabulary']
  const sections: SkillSection[] = []

  for (const skillId of orderedSkills) {
    const skillItems = bySkill.get(skillId)
    if (!skillItems || skillItems.length === 0) continue
    const meta = skillMeta[skillId]
    sections.push({
      id: skillId as SkillSection['id'],
      label: meta.label,
      icon: meta.icon,
      color: meta.color,
      bg: meta.bg,
      topics: skillItems
        .sort((a, b) => a.milestone_score - b.milestone_score)
        .flatMap((item) => {
          if (skillId === 'reading') {
            return [
              {
                title: `Part 5 - ${item.title}`,
                desc: `Mốc ${item.milestone_score} · Part 5 · Điền từ ngữ cảnh`,
                done: false,
                topicKey: `${item.topic_key}.part5`,
              },
              {
                title: `Part 7 - ${item.title}`,
                desc: `Mốc ${item.milestone_score} · Part 7 · Đọc hiểu đoạn văn`,
                done: false,
                topicKey: `${item.topic_key}.part7`,
              },
            ]
          }

          return [{
            title: item.title,
            desc: `Moc ${item.milestone_score} · ${item.question_count} cau · ${item.estimated_minutes} phut`,
            done: false,
            topicKey: item.topic_key,
          }]
        }),
      tips: [],
    })
  }

  return sections
}

function mapToeicScoreToBand(score: number): CertBand {
  if (score >= 800) return '800+'
  if (score >= 700) return '700-799'
  if (score >= 600) return '600-699'
  if (score >= 500) return '500-599'
  return '350-495'
}

function normalizeToeicSkillAlias(skillPrefix: string): string {
  if (skillPrefix === 'vocab') return 'vocabulary'
  return skillPrefix
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TenseCard({ tense, defaultOpen }: { tense: TenseEntry; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen)
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left cursor-pointer"
      >
        <span className="font-semibold text-slate-700">{tense.name}</span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
      </button>
      {open && (
        <div className="p-5 space-y-4">
          {/* Usage */}
          <div className="text-sm text-slate-600 bg-blue-50 rounded-lg px-4 py-2.5 border border-blue-100">
            <span className="font-semibold text-blue-700"> Dùng khi: </span>{tense.usage}
          </div>
          {/* Signal Words */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Dấu hiệu nhận biết</p>
            <div className="flex flex-wrap gap-2">
              {tense.signals.map((s, i) => (
                <span key={i} className="bg-amber-50 text-amber-700 border border-amber-200 text-sm px-3 py-1 rounded-full font-medium">
                  {s}
                </span>
              ))}
            </div>
          </div>
          {/* Formula */}
          <div className="bg-violet-50 rounded-xl p-4 border border-violet-100 space-y-2">
            <p className="text-xs font-bold text-violet-600 uppercase tracking-wider mb-2">Công thức</p>
            <p className="font-mono text-violet-800 text-sm"> {tense.formula}</p>
            {tense.negative && <p className="font-mono text-red-700 text-sm"> {tense.negative}</p>}
            {tense.question && <p className="font-mono text-blue-700 text-sm"> {tense.question}</p>}
          </div>
          {/* Examples */}
          <div className="space-y-2.5">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ví dụ</p>
            {tense.examples.map((ex, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 px-4 py-3">
                <p className="font-semibold text-slate-800">{ex.en}</p>
                <p className="text-slate-500 mt-1">→ {ex.vi}</p>
                {ex.note && <p className="text-indigo-500 text-sm mt-1 italic">({ex.note})</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function RuleBlock({ rule }: { rule: LessonRule }) {
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
        <p className="font-semibold text-slate-700">{rule.title}</p>
      </div>
      <div className="p-5 space-y-3">
        {rule.examples.map((ex, j) => (
          <div key={j} className="bg-white rounded-xl border border-slate-100 px-4 py-3">
            <p className="font-semibold text-slate-800">{ex.en}</p>
            {ex.vi !== ex.en && <p className="text-slate-500 mt-1">→ {ex.vi}</p>}
            {ex.note && <p className="text-indigo-500 text-sm mt-1 italic"> {ex.note}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

function QuizCard({
  question,
  index,
  onAnswered,
  questionId,
}: {
  question: QuizQuestion
  index: number
  onAnswered?: (isCorrect: boolean, questionId: string) => void
  questionId: string
}) {
  const [selected, setSelected] = useState<number | null>(null)
  const answered = selected !== null
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
      <p className="font-semibold text-slate-800">
        <span className="text-purple-500 mr-2">#{index + 1}</span>{question.question}
      </p>
      <div className="space-y-2">
        {question.options.map((opt, i) => {
          let cls = 'w-full text-left px-4 py-3 rounded-xl border text-sm transition-all cursor-pointer '
          if (!answered) cls += 'border-slate-200 bg-slate-50 hover:border-purple-300 hover:bg-purple-50 text-slate-700'
          else if (i === question.answer) cls += 'border-emerald-400 bg-emerald-50 text-emerald-800 font-semibold'
          else if (i === selected) cls += 'border-red-300 bg-red-50 text-red-700 line-through'
          else cls += 'border-slate-100 bg-slate-50 text-slate-400'
          return (
            <button
              key={i}
              className={cls}
              onClick={() => {
                if (answered) return
                onAnswered?.(i === question.answer, questionId)
                setSelected(i)
              }}
              disabled={answered}
            >
              <span className="font-bold mr-2 text-slate-400">{String.fromCharCode(65 + i)}.</span>
              {opt}
              {answered && i === question.answer && <CheckCircle2 className="inline w-4 h-4 ml-2 text-emerald-500" />}
              {answered && i === selected && i !== question.answer && <XCircle className="inline w-4 h-4 ml-2 text-red-400" />}
            </button>
          )
        })}
      </div>
      {answered && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800">
          <span className="font-bold"> Giải thích: </span>{question.explanation}
        </div>
      )}
    </div>
  )
}

// ─── Flashcard Component ──────────────────────────────────────────────────────

interface Flashcard {
  front: string
  back: string
  hint?: string
}

function buildFlashcards(topicKey: string): Flashcard[] {
  const lesson = TOPIC_LESSONS[topicKey]
  if (!lesson) return []
  const cards: Flashcard[] = []

  // From tenses: signal words → tense name + formula
  if (lesson.tenses) {
    for (const t of lesson.tenses) {
      cards.push({
        front: `Dấu hiệu nhận biết:\n${t.signals.slice(0, 5).join(' · ')}`,
        back: `${t.name}\n\nCông thức: ${t.formula}`,
        hint: 'Nhận diện thì động từ',
      })
      if (t.examples[0]) {
        cards.push({
          front: t.examples[0].en,
          back: `${t.examples[0].vi}${t.examples[0].note ? '\n(' + t.examples[0].note + ')' : ''}`,
          hint: t.name,
        })
      }
    }
  }

  // From rules: title → first example
  if (lesson.rules) {
    for (const r of lesson.rules) {
      if (r.examples[0]) {
        cards.push({
          front: r.title,
          back: `${r.examples[0].en}\n→ ${r.examples[0].vi}`,
          hint: 'Quy tắc',
        })
      }
    }
  }

  // From common mistakes: wrong → correct + explanation
  if (lesson.commonMistakes) {
    for (const m of lesson.commonMistakes) {
      cards.push({
        front: ` ${m.wrong}`,
        back: ` ${m.correct}\n\n${m.explanation}`,
        hint: 'Lỗi thường gặp',
      })
    }
  }

  return cards
}

function FlashcardView({ topicKey }: { topicKey: string }) {
  const cards = useMemo(() => buildFlashcards(topicKey), [topicKey])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown] = useState<Set<number>>(new Set())

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Layers className="w-10 h-10 mb-3" />
        <p className="text-sm">Chưa có flashcard cho chủ đề này.</p>
      </div>
    )
  }

  const current = cards[index]
  const progress = Math.round((known.size / cards.length) * 100)

  const handleNext = () => {
    setFlipped(false)
    setTimeout(() => setIndex((i) => Math.min(i + 1, cards.length - 1)), 120)
  }
  const handlePrev = () => {
    setFlipped(false)
    setTimeout(() => setIndex((i) => Math.max(i - 1, 0)), 120)
  }
  const handleKnow = () => {
    setKnown((prev) => new Set([...prev, index]))
    handleNext()
  }
  const handleReset = () => {
    setKnown(new Set())
    setIndex(0)
    setFlipped(false)
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm text-slate-500 mb-1">
        <span>{index + 1} / {cards.length} thẻ</span>
        <span className="text-emerald-600 font-semibold">{known.size} đã nhớ ({progress}%)</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2 mb-4">
        <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
      </div>

      {/* Card */}
      <div
        onClick={() => setFlipped(!flipped)}
        className={`relative w-full min-h-52 rounded-2xl border-2 cursor-pointer select-none transition-all duration-300 flex flex-col items-center justify-center p-8 text-center shadow-md hover:shadow-lg ${
          flipped
            ? 'bg-violet-50 border-violet-200'
            : known.has(index)
            ? 'bg-emerald-50 border-emerald-200'
            : 'bg-white border-slate-200'
        }`}
      >
        {current.hint && (
          <span className={`absolute top-3 left-4 text-xs font-semibold px-2.5 py-1 rounded-full ${flipped ? 'bg-violet-100 text-violet-600' : 'bg-slate-100 text-slate-500'}`}>
            {flipped ? ' Đáp án' : current.hint}
          </span>
        )}
        {known.has(index) && !flipped && (
          <span className="absolute top-3 right-4 text-xs font-semibold text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Đã nhớ
          </span>
        )}
        <p className={`text-base font-semibold leading-relaxed whitespace-pre-line ${flipped ? 'text-violet-800' : 'text-slate-800'}`}>
          {flipped ? current.back : current.front}
        </p>
        <p className="text-xs text-slate-400 mt-4 absolute bottom-4">
          {flipped ? 'Click để lật lại' : 'Click để xem đáp án'}
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={handlePrev}
          disabled={index === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Trước
        </button>
        <div className="flex gap-2">
          {flipped && (
            <button
              onClick={handleKnow}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors cursor-pointer text-sm font-semibold"
            >
              <CheckCircle2 className="w-4 h-4" /> Đã nhớ
            </button>
          )}
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-3 py-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer text-sm"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={handleNext}
          disabled={index === cards.length - 1}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer text-sm font-medium"
        >
          Tiếp <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Dot nav */}
      <div className="flex justify-center gap-1.5 flex-wrap pt-2">
        {cards.map((_, i) => (
          <button
            key={i}
            onClick={() => { setFlipped(false); setIndex(i) }}
            className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
              i === index ? 'w-4 bg-purple-500' : known.has(i) ? 'bg-emerald-400' : 'bg-slate-200'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({
  skills,
  currentKey,
  onSelect,
  availableRepoTopicKeys = new Set<string>(),
  unlockedRepoTopicKeys = new Set<string>(),
}: {
  skills: SkillSection[]
  currentKey: string
  onSelect: (key: string) => void
  availableRepoTopicKeys?: Set<string>
  unlockedRepoTopicKeys?: Set<string>
}) {
  const [expandedSkills, setExpandedSkills] = useState<Set<string>>(
    () => new Set(skills.filter(s => s.topics.some(t => t.topicKey === currentKey)).map(s => s.id))
  )

  const toggleSkill = (id: string) => {
    setExpandedSkills(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const totalTopics = skills.reduce((sum, s) => sum + s.topics.filter(t => t.topicKey).length, 0)
  const doneTopics = skills.reduce((sum, s) => sum + s.topics.filter(t => t.topicKey && t.done).length, 0)

  return (
    <div className="flex flex-col h-full">
      {/* Progress summary */}
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
          <span>Tiến độ</span>
          <span className="font-bold text-slate-700">{doneTopics}/{totalTopics} chủ đề</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-1.5">
          <div
            className="bg-purple-500 h-1.5 rounded-full transition-all"
            style={{ width: totalTopics > 0 ? `${(doneTopics / totalTopics) * 100}%` : '0%' }}
          />
        </div>
      </div>

      {/* Skill groups */}
      <div className="overflow-y-auto flex-1">
        {skills.map((skill) => {
          const visibleTopics = skill.topics.filter(t => t.topicKey)
          if (visibleTopics.length === 0) return null
          const isExpanded = expandedSkills.has(skill.id)
          const isActive = visibleTopics.some(t => t.topicKey === currentKey)

          return (
            <div key={skill.id} className="border-b border-slate-100 last:border-0">
              <button
                onClick={() => toggleSkill(skill.id)}
                className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors cursor-pointer ${isActive ? 'bg-purple-50' : ''}`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${skill.bg}`}>
                    <span className={skill.color}>{skill.icon}</span>
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${isActive ? 'text-purple-700' : 'text-slate-700'}`}>
                      {skill.label}
                    </p>
                    <p className="text-xs text-slate-400">
                      {visibleTopics.filter(t => t.done).length}/{visibleTopics.length}
                    </p>
                  </div>
                </div>
                {isExpanded
                  ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                  : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
              </button>

              {isExpanded && (
                <div className="pb-1">
                  {visibleTopics.map((topic) => (
                    (() => {
                      const isRepoTopic = Boolean(topic.topicKey) && availableRepoTopicKeys.has(topic.topicKey!)
                      const isLockedRepoTopic = isRepoTopic && !unlockedRepoTopicKeys.has(topic.topicKey!)
                      return (
                    <button
                      key={topic.topicKey}
                      onClick={() => {
                        if (isLockedRepoTopic) return
                        onSelect(topic.topicKey!)
                      }}
                      disabled={isLockedRepoTopic}
                      className={`w-full text-left flex items-start gap-2.5 px-5 py-2.5 hover:bg-slate-50 transition-colors cursor-pointer ${
                        topic.topicKey === currentKey
                          ? 'bg-purple-50 border-r-2 border-purple-500'
                          : ''
                      } ${isLockedRepoTopic ? 'opacity-55 cursor-not-allowed hover:bg-transparent' : ''}`}
                    >
                      <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                        topic.done ? 'bg-emerald-500' : topic.topicKey === currentKey ? 'bg-purple-400' : 'bg-slate-200'
                      }`}>
                        {topic.done
                          ? <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                          : <span className="w-1.5 h-1.5 rounded-full bg-white block" />
                        }
                      </div>
                      <div>
                        <p className={`text-sm leading-snug ${
                          topic.topicKey === currentKey
                            ? 'font-semibold text-purple-700'
                            : topic.done
                            ? 'text-slate-400 line-through'
                            : 'text-slate-600'
                        }`}>
                          {topic.title}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">{topic.desc}</p>
                        {!TOPIC_LESSONS[topic.topicKey!]
                          && !LISTENING_PACKS_BY_KEY[topic.topicKey!]
                          && !SPEAKING_PACKS[topic.topicKey!]
                          && !availableRepoTopicKeys.has(topic.topicKey!) && (
                          <span className="text-xs text-amber-500">Sắp có</span>
                        )}
                        {isLockedRepoTopic && (
                          <span className="text-xs text-slate-400">Chưa mở khóa</span>
                        )}
                      </div>
                    </button>
                      )
                    })()
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CertificateLessonPage() {
  const { certId, topicKey } = useParams<{ certId: string; topicKey: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const rawBand = (searchParams.get('band') ?? undefined) as CertBand | undefined
  const band = certId === 'toeic' ? undefined : rawBand
  const viewMode = (searchParams.get('mode') ?? 'lesson') as 'lesson' | 'flashcard'
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [toeicOverviewItems, setToeicOverviewItems] = useState<ToeicRepositoryOverviewItem[]>([])
  const [toeicOverviewLoading, setToeicOverviewLoading] = useState(false)
  const [toeicOverviewError, setToeicOverviewError] = useState<string | null>(null)
  const [toeicRepoByTopicKey, setToeicRepoByTopicKey] = useState<Record<string, string>>({})
  const [toeicUnlockedTopicKeys, setToeicUnlockedTopicKeys] = useState<Set<string>>(new Set())
  const [toeicRepository, setToeicRepository] = useState<ToeicRepositoryDetailResponse | null>(null)
  const [toeicRepositoryError, setToeicRepositoryError] = useState<string | null>(null)
  const [toeicCurrentScore, setToeicCurrentScore] = useState<number>(300)
  const requestedTopicKey = topicKey ?? ''

  const cert = CERTIFICATES.find(c => c.id === (certId as CertId)) ?? CERTIFICATES[0]
  const isToeic = cert.id === 'toeic'
  const toeicBandByScore = useMemo<CertBand>(() => mapToeicScoreToBand(toeicCurrentScore), [toeicCurrentScore])
  const localToeicSkills = useMemo(() => {
    return getSkills('toeic', toeicBandByScore).filter((section) => {
      return section.id === 'listening' || section.id === 'reading' || section.id === 'grammar' || section.id === 'vocabulary'
    })
  }, [toeicBandByScore])
  const skills = useMemo(() => {
    if (isToeic) {
      if (toeicOverviewLoading && toeicOverviewItems.length === 0) {
        return [] as SkillSection[]
      }

      if (toeicOverviewItems.length === 0) {
        return localToeicSkills
      }

      return mapToeicOverviewToSkills(toeicOverviewItems)
    }

    return getSkills(cert.id, band).filter((section) => {
      if (!isToeic) return true
      return section.id === 'listening' || section.id === 'reading'
    })
  }, [band, cert.id, isToeic, localToeicSkills, toeicOverviewItems, toeicOverviewLoading])
  const bandOption = band ? getBandOption(cert.id, band) : undefined
  const flatTopics = useMemo(() => buildFlatTopics(skills), [skills])

  const currentKey = requestedTopicKey || flatTopics[0]?.topicKey || ''
  const currentSkillId = useMemo(
    () => skills.find((section) => section.topics.some((topic) => topic.topicKey === currentKey))?.id,
    [currentKey, skills],
  )
  const inferredSkillId = useMemo(() => {
    const prefix = normalizeToeicSkillAlias(currentKey.split('.')[0])
    return skills.find((section) => section.id === prefix)?.id
  }, [currentKey, skills])
  const activeSidebarSkillId = currentSkillId ?? inferredSkillId ?? skills[0]?.id
  const sidebarSkills = useMemo(
    () => (isToeic && activeSidebarSkillId ? skills.filter((section) => section.id === activeSidebarSkillId) : skills),
    [activeSidebarSkillId, isToeic, skills],
  )
  const currentSkillTopics = useMemo(() => {
    if (!activeSidebarSkillId) return flatTopics
    const filtered = flatTopics.filter(
      (topic) => normalizeToeicSkillAlias(topic.topicKey.split('.')[0]) === activeSidebarSkillId,
    )
    return filtered.length > 0 ? filtered : flatTopics
  }, [activeSidebarSkillId, flatTopics])

  const currentIndex = flatTopics.findIndex(t => t.topicKey === currentKey)
  const currentSkillIndex = currentSkillTopics.findIndex((topic) => topic.topicKey === currentKey)
  const currentTopic = flatTopics[currentIndex]
  const lesson = TOPIC_LESSONS[currentKey]
  const currentToeicSlug = toeicRepoByTopicKey[currentKey]
  const currentToeicPart = useMemo<'part5' | 'part7' | null>(() => {
    if (currentKey.endsWith('.part5')) return 'part5'
    if (currentKey.endsWith('.part7')) return 'part7'
    return null
  }, [currentKey])
  const displayedToeicRepository = useMemo<ToeicRepositoryDetailResponse | null>(() => {
    if (!toeicRepository) return null
    if (toeicRepository.skill_area !== 'reading') return toeicRepository
    if (!currentToeicPart) return toeicRepository

    const items = toeicRepository.items.filter((item) => {
      const title = item.title?.toLowerCase() ?? ''
      if (currentToeicPart === 'part5') return title.includes('part 5')
      return title.includes('part 7')
    })

    if (items.length === 0) return toeicRepository

    return {
      ...toeicRepository,
      title: `${toeicRepository.title} - ${currentToeicPart === 'part5' ? 'Part 5' : 'Part 7'}`,
      total_items: items.length,
      pass_score: Math.max(1, Math.ceil(items.length * 0.7)),
      estimated_minutes: items.length,
      items,
    }
  }, [currentToeicPart, toeicRepository])

  const prevTopic = currentSkillIndex > 0 ? currentSkillTopics[currentSkillIndex - 1] : null
  const nextTopic =
    currentSkillIndex >= 0 && currentSkillIndex < currentSkillTopics.length - 1
      ? currentSkillTopics[currentSkillIndex + 1]
      : null

  const buildLessonPath = useCallback((key: string): string => {
    const params = new URLSearchParams(searchParams)
    if (isToeic) {
      params.delete('band')
    }
    const query = params.toString()
    const basePath = `/student/certificate-review/${cert.id}/lesson/${key}`
    return query ? `${basePath}?${query}` : basePath
  }, [cert.id, isToeic, searchParams])

  useEffect(() => {
    if (!isToeic) return
    if (!searchParams.has('band')) return

    const params = new URLSearchParams(searchParams)
    params.delete('band')
    setSearchParams(params, { replace: true })
  }, [isToeic, searchParams, setSearchParams])

  useEffect(() => {
    if (!isToeic) return
    if (viewMode === 'lesson') return

    const params = new URLSearchParams(searchParams)
    params.set('mode', 'lesson')
    setSearchParams(params, { replace: true })
  }, [isToeic, searchParams, setSearchParams, viewMode])

  useEffect(() => {
    if (!isToeic) return
    let cancelled = false

    const loadOverview = async () => {
      setToeicOverviewLoading(true)
      setToeicOverviewError(null)
      try {
        const data = await getToeicRepositoryOverview()
        if (cancelled) return
        setToeicOverviewItems(Array.isArray(data.items) ? data.items : [])
        setToeicCurrentScore(data.projected_score ?? data.current_score ?? 300)

        const mapping: Record<string, string> = {}
        const unlocked = new Set<string>()
        for (const item of data.items ?? []) {
          if (item.topic_key && item.slug) {
            mapping[item.topic_key] = item.slug
            if (item.skill_area === 'reading') {
              mapping[`${item.topic_key}.part5`] = item.slug
              mapping[`${item.topic_key}.part7`] = item.slug
            }
          }
          if (item.topic_key) {
            if (item.is_unlocked) {
              unlocked.add(item.topic_key)
            }
            if (item.skill_area === 'reading') {
              unlocked.add(`${item.topic_key}.part5`)
              unlocked.add(`${item.topic_key}.part7`)
            }
          }
        }
        setToeicRepoByTopicKey(mapping)
        setToeicUnlockedTopicKeys(unlocked)
      } catch {
        if (cancelled) return
        setToeicOverviewItems([])
        setToeicRepoByTopicKey({})
        setToeicUnlockedTopicKeys(new Set())
        setToeicOverviewError('Không thể tải danh sách chủ đề TOEIC lúc này.')
      } finally {
        if (!cancelled) {
          setToeicOverviewLoading(false)
        }
      }
    }

    loadOverview()
    return () => {
      cancelled = true
    }
  }, [isToeic])

  useEffect(() => {
    if (!isToeic || !currentToeicSlug) {
      setToeicRepository(null)
      setToeicRepositoryError(null)
      return
    }

    let cancelled = false
    const loadDetail = async () => {
      try {
        const data = await getToeicRepositoryDetail(currentToeicSlug)
        if (!cancelled) {
          setToeicRepository(data)
          setToeicRepositoryError(null)
        }
      } catch (error) {
        if (!cancelled) {
          setToeicRepository(null)
          setToeicRepositoryError(getApiMessage(error) ?? 'Không thể tải nội dung bài luyện này.')
        }
      }
    }

    loadDetail()
    return () => {
      cancelled = true
    }
  }, [currentToeicSlug, isToeic])

  useEffect(() => {
    if (!isToeic) return
    if (!currentKey) return
    if (toeicOverviewItems.length === 0) return

    const pickClosestTopicKey = (items: ToeicRepositoryOverviewItem[]): string | undefined => {
      return [...items]
        .sort((a, b) => Math.abs(a.milestone_score - toeicCurrentScore) - Math.abs(b.milestone_score - toeicCurrentScore))[0]
        ?.topic_key
    }

    const hasLocalLesson = Boolean(
      TOPIC_LESSONS[currentKey]
      || LISTENING_PACKS_BY_KEY[currentKey]
      || SPEAKING_PACKS[currentKey],
    )
    if (hasLocalLesson) return

    const isKnownTopic = Boolean(toeicRepoByTopicKey[currentKey])
    const isUnlockedTopic = toeicUnlockedTopicKeys.has(currentKey)
    if (isKnownTopic && isUnlockedTopic) return

    const requestedSkill = normalizeToeicSkillAlias(currentKey.split('.')[0])
    const isKnownToeicSkill =
      requestedSkill === 'listening'
      || requestedSkill === 'reading'
      || requestedSkill === 'grammar'
      || requestedSkill === 'vocabulary'

    const localFallbackInRequestedSkill = flatTopics.find((topic) => {
      const topicSkill = normalizeToeicSkillAlias(topic.topicKey.split('.')[0])
      if (topicSkill !== requestedSkill) return false
      return Boolean(
        TOPIC_LESSONS[topic.topicKey]
        || LISTENING_PACKS_BY_KEY[topic.topicKey]
        || SPEAKING_PACKS[topic.topicKey],
      )
    })?.topicKey

    const unlockedItems = toeicOverviewItems.filter(
      (item) => item.is_unlocked && Boolean(item.topic_key) && Boolean(item.slug),
    )
    const unlockedBySkill = unlockedItems.filter((item) => item.skill_area === requestedSkill)
    const knownBySkill = toeicOverviewItems.filter(
      (item) => item.skill_area === requestedSkill && Boolean(item.topic_key),
    )

    // Keep the learner in the requested TOEIC skill when possible.
    const fallbackInRequestedSkill =
      localFallbackInRequestedSkill
      ?? pickClosestTopicKey(unlockedBySkill)
      ?? [...knownBySkill].sort((a, b) => a.milestone_score - b.milestone_score)[0]?.topic_key

    const fallbackCrossSkill =
      !isKnownToeicSkill
        ? pickClosestTopicKey(unlockedItems)
          ?? toeicOverviewItems.find((item) => Boolean(item.topic_key))?.topic_key
        : undefined

    const fallbackKey = fallbackInRequestedSkill ?? fallbackCrossSkill

    if (!fallbackKey || fallbackKey === currentKey) return

    navigate(buildLessonPath(fallbackKey), { replace: true })
  }, [
    buildLessonPath,
    cert.id,
    currentKey,
    isToeic,
    navigate,
    toeicCurrentScore,
    toeicOverviewItems,
    toeicRepoByTopicKey,
    toeicUnlockedTopicKeys,
    flatTopics,
  ])

  const goToTopic = (key: string) => {
    if (isToeic && toeicRepoByTopicKey[key] && !toeicUnlockedTopicKeys.has(key)) {
      return
    }
    navigate(buildLessonPath(key))
    setMobileSidebarOpen(false)
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    if (document.documentElement) document.documentElement.scrollTop = 0
    if (document.body) document.body.scrollTop = 0
  }

  useEffect(() => {
    const reset = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      if (document.documentElement) document.documentElement.scrollTop = 0
      if (document.body) document.body.scrollTop = 0
    }

    reset()
    const raf = window.requestAnimationFrame(reset)
    const timeout = window.setTimeout(reset, 0)
    return () => {
      window.cancelAnimationFrame(raf)
      window.clearTimeout(timeout)
    }
  }, [currentKey, viewMode])

  const setMode = (mode: 'lesson' | 'flashcard') => {
    const params = new URLSearchParams(searchParams)
    params.set('mode', mode)
    setSearchParams(params)
  }

  const trackToeicAnswer = (mode: 'listening' | 'reading', isCorrect: boolean, questionId: string) => {
    if (!isToeic) return
    const profile = getToeicIntakeProfile()
    if (!profile) return

    const next = appendToeicPracticeResult(profile, mode, isCorrect ? 1 : 0, [questionId])
    saveToeicIntakeProfile(next)
    setToeicCurrentScore(Math.round(next.milestoneState.currentScore + next.milestoneState.totalBoost))
  }

  const trackToeicSession = (mode: 'listening' | 'reading', correctCount: number, questionIds: string[]) => {
    if (!isToeic) return
    const profile = getToeicIntakeProfile()
    if (!profile) return

    const next = appendToeicPracticeResult(profile, mode, correctCount, questionIds)
    saveToeicIntakeProfile(next)
    setToeicCurrentScore(Math.round(next.milestoneState.currentScore + next.milestoneState.totalBoost))
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 [&_button]:cursor-pointer [&_button:disabled]:cursor-not-allowed">
        {/* ── Breadcrumb ── */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-5 flex-wrap">
          <button
            onClick={() => navigate('/student/certificate-review')}
            className="hover:text-purple-600 transition-colors cursor-pointer font-medium"
          >
            Ôn Luyện Chứng Chỉ
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <button
            onClick={() => navigate(`/student/certificate-review/${cert.id}${band ? `?band=${band}` : ''}`)}
            className="hover:text-purple-600 transition-colors cursor-pointer font-medium"
          >
            {cert.label} {cert.id !== 'toeic' && bandOption ? `– ${bandOption.label}` : ''}
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          {currentTopic && (
            <span className="text-slate-700 font-semibold">{currentTopic.skillLabel}</span>
          )}
          {currentTopic && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              <span className="text-purple-700 font-semibold">{currentTopic.title}</span>
            </>
          )}
        </nav>

        <div className="flex gap-6 relative">
          {/* ══ SIDEBAR (desktop) ══════════════════════════════════════════ */}
          <aside className="hidden lg:flex flex-col w-72 shrink-0">
            <div className="sticky top-6 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden max-h-[calc(100vh-120px)]">
              {/* Sidebar header */}
              <div className={`bg-gradient-to-r ${cert.bgFrom} ${cert.bgTo} px-4 py-3.5 flex items-center gap-3`}>
                <div
                  className={`bg-white/20 rounded-xl flex items-center justify-center shrink-0 ${
                    isToeic ? 'h-9 px-3 min-w-[78px]' : 'w-9 h-9'
                  }`}
                >
                  <span className={`font-black text-white ${isToeic ? 'text-lg leading-none tracking-wide' : 'text-sm'}`}>{cert.icon}</span>
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{cert.label}</p>
                  {bandOption && cert.id !== 'toeic' && (
                    <p className="text-white/70 text-xs">{bandOption.label} · {bandOption.tagline}</p>
                  )}
                </div>
              </div>

              {isToeic && toeicOverviewLoading && sidebarSkills.length === 0 ? (
                <div className="p-4 text-sm text-slate-500">Đang tải chủ đề TOEIC...</div>
              ) : (
                <Sidebar
                  skills={sidebarSkills}
                  currentKey={currentKey}
                  onSelect={goToTopic}
                  availableRepoTopicKeys={new Set(Object.keys(toeicRepoByTopicKey))}
                  unlockedRepoTopicKeys={toeicUnlockedTopicKeys}
                />
              )}
            </div>
          </aside>

          {/* ══ CONTENT ════════════════════════════════════════════════════ */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* Mobile: topic selector bar */}
            <div className="lg:hidden">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="w-full flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm cursor-pointer"
              >
                <div className="flex items-center gap-2 text-sm">
                  <Menu className="w-4 h-4 text-slate-400" />
                  <span className="font-medium text-slate-700">
                    {currentTopic ? currentTopic.title : 'Chọn chủ đề'}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* ── Lesson header card ── */}
            <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden`}>
              <div className={`bg-gradient-to-r ${cert.bgFrom} ${cert.bgTo} px-6 py-5`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    {currentTopic && (
                      <div className={`inline-flex items-center gap-1.5 ${currentTopic.skillBg} bg-white/30 rounded-full px-3 py-1 mb-2`}>
                        <span className="text-white/90 w-3.5 h-3.5">{currentTopic.skillIcon}</span>
                        <span className="text-white/90 text-xs font-semibold">{currentTopic.skillLabel}</span>
                      </div>
                    )}
                    <h1 className="text-xl sm:text-2xl font-bold text-white">
                      {lesson?.title ?? currentTopic?.title ?? 'Bài học'}
                    </h1>
                    {lesson?.subtitle && (
                      <p className="text-white/70 text-sm mt-1">{lesson.subtitle}</p>
                    )}
                  </div>
                  {/* Prev / Next buttons */}
                  <div className="hidden sm:flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => prevTopic && goToTopic(prevTopic.topicKey)}
                      disabled={!prevTopic}
                      className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-5 h-5 text-white" />
                    </button>
                    <button
                      onClick={() => nextTopic && goToTopic(nextTopic.topicKey)}
                      disabled={!nextTopic}
                      className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>

                {/* View mode toggle */}
                <div className="flex items-center gap-2 mt-4">
                  <button
                    onClick={() => setMode('lesson')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                      viewMode === 'lesson'
                        ? 'bg-white text-purple-700 shadow-sm'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" /> Bài học
                  </button>
                  {!isToeic && (
                    <button
                      onClick={() => setMode('flashcard')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                        viewMode === 'flashcard'
                          ? 'bg-white text-purple-700 shadow-sm'
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      <Layers className="w-4 h-4" /> Flashcard
                    </button>
                  )}
                  <span className="ml-auto text-white/60 text-xs">
                    {Math.max(1, currentSkillIndex + 1)} / {Math.max(1, currentSkillTopics.length)}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Listening Practice (for listening.* topics) ── */}
            {!isToeic && currentKey.startsWith('listening.') && viewMode === 'lesson' && LISTENING_PACKS_BY_KEY[currentKey] && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <ListeningPlayer
                  topicKey={currentKey}
                  accentColor={currentTopic?.skillColor}
                  accentBg={currentTopic?.skillBg}
                  onQuestionAnswered={(isCorrect, questionId) => trackToeicAnswer('listening', isCorrect, questionId)}
                />
              </div>
            )}

            {/* ── Speaking Practice (for speaking.* topics) ── */}
            {!isToeic && currentKey.startsWith('speaking.') && viewMode === 'lesson' && SPEAKING_PACKS[currentKey] && (
              <div className="bg-zinc-900 rounded-2xl border border-zinc-700 shadow-sm p-6">
                <SpeakingPractice topicKey={currentKey} />
              </div>
            )}

            {isToeic && toeicOverviewError && !toeicRepository && (
              <div className="bg-amber-50 rounded-2xl border border-amber-200 shadow-sm p-4 text-sm text-amber-800">
                {toeicOverviewError}
              </div>
            )}

            {/* ── TOEIC Exam Practice (repository-driven) ── */}
            {isToeic && viewMode === 'lesson' && displayedToeicRepository && currentToeicSlug && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6">
                <ToeicExamPracticePanel
                  repository={displayedToeicRepository}
                  currentScore={toeicCurrentScore}
                  onLiveScoreChange={(delta) => {
                    if (!Number.isFinite(delta) || delta <= 0) return
                    setToeicCurrentScore((prev) => prev + Math.round(delta))
                  }}
                  onComplete={async ({ answers, elapsedSeconds }) => {
                    const response = await submitToeicRepositoryAnswers(currentToeicSlug, {
                      answers: answers.map((ans) => ({ item_id: ans.itemId, option_id: ans.optionId })),
                      elapsed_seconds: elapsedSeconds,
                    })

                    if (displayedToeicRepository.skill_area === 'listening' || displayedToeicRepository.skill_area === 'reading') {
                      const questionIds = answers.map((ans) => `${displayedToeicRepository.slug}-${ans.itemId}`)
                      trackToeicSession(displayedToeicRepository.skill_area, response.correct_count, questionIds)
                    }

                    setToeicCurrentScore(response.projected_score)
                    return {
                      correctCount: response.correct_count,
                      total: response.total_count,
                      gainedScore: response.gained_score,
                      projectedScore: response.projected_score,
                      isPassed: response.is_passed,
                      passScore: response.pass_score,
                    }
                  }}
                />
              </div>
            )}

            {isToeic && viewMode === 'lesson' && currentToeicSlug && !toeicRepository && toeicRepositoryError && (
              <div className="bg-amber-50 rounded-2xl border border-amber-200 shadow-sm p-6 text-amber-800">
                <p className="font-semibold">{toeicRepositoryError}</p>
                <p className="text-sm mt-1">Hãy chọn một chủ đề đã mở khóa trong sidebar để tiếp tục luyện tập.</p>
              </div>
            )}

            {/* ── No lesson content placeholder ── */}
            {!isToeic && !lesson && viewMode === 'lesson'
              && !(currentKey.startsWith('listening.') && LISTENING_PACKS_BY_KEY[currentKey])
              && !(currentKey.startsWith('speaking.') && SPEAKING_PACKS[currentKey])
              && !(isToeic && Boolean(currentToeicSlug) && Boolean(displayedToeicRepository))
              && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
                <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-amber-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-700 mb-2">Bài học đang được biên soạn</h3>
                <p className="text-slate-500 text-sm max-w-md mx-auto">
                  Nội dung chi tiết cho chủ đề <span className="font-semibold text-slate-700">"{currentTopic?.title}"</span> đang được chuẩn bị.
                  Hãy thử <button onClick={() => setMode('flashcard')} className="text-purple-600 font-semibold hover:underline cursor-pointer">chế độ Flashcard</button> trong khi chờ!
                </p>
                {nextTopic && (
                  <button
                    onClick={() => goToTopic(nextTopic.topicKey)}
                    className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors cursor-pointer text-sm font-semibold"
                  >
                    Chủ đề tiếp theo <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* ── Flashcard mode ── */}
            {!isToeic && viewMode === 'flashcard' && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
                <FlashcardView topicKey={currentKey} />
              </div>
            )}

            {/* ── Lesson content ── */}
            {!isToeic && lesson && viewMode === 'lesson' && (
              <div className="space-y-5">

                {/* Introduction */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="w-4 h-4 text-slate-400" />
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Giới thiệu</h2>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{lesson.intro}</p>
                </div>

                {/* 12 Tenses */}
                {lesson.tenses && lesson.tenses.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    <h2 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
                      <span className="w-7 h-7 bg-violet-100 rounded-lg flex items-center justify-center text-violet-700 text-xs font-black">
                        {lesson.tenses.length}
                      </span>
                      Thì động từ
                    </h2>
                    <div className="space-y-3">
                      {lesson.tenses.map((tense, i) => (
                        <TenseCard key={i} tense={tense} defaultOpen={i === 0} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Rules */}
                {lesson.rules && lesson.rules.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    <h2 className="font-bold text-slate-800 text-lg mb-4">Quy tắc & Ví dụ</h2>
                    <div className="space-y-4">
                      {lesson.rules.map((rule, i) => (
                        <RuleBlock key={i} rule={rule} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Common Mistakes */}
                {lesson.commonMistakes && lesson.commonMistakes.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                      <h2 className="font-bold text-slate-800 text-lg">Lỗi thường gặp</h2>
                    </div>
                    <div className="space-y-3">
                      {lesson.commonMistakes.map((m, i) => (
                        <div key={i} className="rounded-xl border border-amber-100 bg-amber-50/60 p-4 space-y-2">
                          <div className="flex items-start gap-2.5">
                            <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                            <p className="text-red-600 line-through text-sm leading-relaxed">{m.wrong}</p>
                          </div>
                          <div className="flex items-start gap-2.5">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                            <p className="font-semibold text-emerald-700 text-sm leading-relaxed">{m.correct}</p>
                          </div>
                          <p className="text-sm text-slate-600 ml-8 leading-relaxed">{m.explanation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Study Tips */}
                {lesson.studyTips && lesson.studyTips.length > 0 && (
                  <div className="bg-blue-50 rounded-2xl border border-blue-100 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Lightbulb className="w-5 h-5 text-blue-500" />
                      <h2 className="font-bold text-blue-700 text-lg">Mẹo học hiệu quả</h2>
                    </div>
                    <ul className="space-y-3">
                      {lesson.studyTips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-3 text-slate-700">
                          <span className="text-blue-400 font-bold text-lg shrink-0 leading-none mt-0.5"></span>
                          <span className="leading-relaxed">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Quiz */}
                {lesson.quiz && lesson.quiz.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-5">
                      <Target className="w-5 h-5 text-purple-500" />
                      <h2 className="font-bold text-slate-800 text-lg">Luyện tập nhanh</h2>
                      <span className="text-sm text-slate-400 ml-1">· {lesson.quiz.length} câu hỏi</span>
                    </div>
                    <div className="space-y-4">
                      {lesson.quiz.map((q, i) => (
                        <QuizCard
                          key={i}
                          question={q}
                          index={i}
                          questionId={`${currentKey}-quiz-${i}`}
                          onAnswered={(isCorrect, questionId) => {
                            if (currentKey.startsWith('reading.')) {
                              trackToeicAnswer('reading', isCorrect, questionId)
                            }
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Bottom navigation ── */}
            <div className="flex items-center justify-between pt-4 pb-8 gap-4">
              <button
                onClick={() => prevTopic && goToTopic(prevTopic.topicKey)}
                disabled={!prevTopic}
                className="flex items-center gap-2.5 px-5 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer text-sm font-semibold shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <div className="hidden sm:block text-left">
                  <p className="text-xs text-slate-400">Trước</p>
                  <p className="text-sm text-slate-700 font-semibold">{prevTopic?.title ?? ''}</p>
                </div>
                {!prevTopic && <span>Chủ đề trước</span>}
              </button>

              <button
                onClick={() => nextTopic && goToTopic(nextTopic.topicKey)}
                disabled={!nextTopic}
                className="flex items-center gap-2.5 px-5 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer text-sm font-semibold shadow-sm"
              >
                <div className="hidden sm:block text-right">
                  <p className="text-xs text-white/70">Tiếp theo</p>
                  <p className="text-sm font-semibold">{nextTopic?.title ?? ''}</p>
                </div>
                {!nextTopic && <span>Chủ đề tiếp theo</span>}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* ── Mobile Sidebar Drawer ── */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative w-80 max-w-[85vw] bg-white h-full flex flex-col shadow-2xl">
            {/* Drawer header */}
            <div className={`bg-gradient-to-r ${cert.bgFrom} ${cert.bgTo} px-4 py-4 flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="font-black text-white text-sm">{cert.icon}</span>
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{cert.label}</p>
                  {bandOption && <p className="text-white/70 text-xs">{bandOption.label}</p>}
                </div>
              </div>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Sidebar
                skills={sidebarSkills}
                currentKey={currentKey}
                onSelect={goToTopic}
                availableRepoTopicKeys={new Set(Object.keys(toeicRepoByTopicKey))}
                unlockedRepoTopicKeys={toeicUnlockedTopicKeys}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
