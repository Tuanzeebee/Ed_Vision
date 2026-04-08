import { useState, useCallback, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { getEnrollment } from '@/services/api/certificateService'
import type { EnrollmentResponse } from '@/services/api/certificateService'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import {
  ChevronLeft,
  BarChart2,
  FileCheck,
  ChevronRight,
  Star,
  MessageCircle,
  PlayCircle,
  Library,
  Clock,
  Monitor,
  Trophy,
  CheckCircle2,
  Zap,
  Flame,
  Calendar,
  Target,
  ArrowRightCircle,
  Mic2,
  Headphones,
  BookOpen,
  Sparkles,
} from 'lucide-react'
import {
  CERTIFICATES,
  getSkills,
  getRoadmap,
  getPracticeTests,
  getMosTasksBycert,
  getRadarData,
  getBandOption,
  BandSelector,
  RoadmapView,
  PracticeTestList,
  SkillRadar,
  SkillTopicCard,
  MosTaskPanel,
} from './certificateData'
import type { CertId, EnglishSkill, CertBand } from './certificateData'
import MosWordSimulator from './MosWordSimulator'
import type { TaskResult } from './MosWordSimulator'
/* IELTS onboarding/calibration removed — rely on enrollment target_band or UI selection */

const mapCalibrationBandToCertBand = (targetBand?: string | null): CertBand | null => {
  if (!targetBand) return null
  const numericBand = parseFloat(targetBand)
  if (Number.isNaN(numericBand)) return null
  if (numericBand >= 7.5) return '7.5+'
  if (numericBand >= 7.0) return '7.0'
  if (numericBand >= 6.5) return '6.5'
  if (numericBand >= 6.0) return '6.0'
  if (numericBand >= 5.0) return '5.0'
  return '4.0'
}

// Community discussions per cert type
const DISCUSSIONS: Record<string, { q: string; replies: number; time: string }[]> = {
  ielts: [
    { q: 'Tips viết intro Task 2 như thế nào?', replies: 12, time: '2 giờ trước' },
    { q: 'Phân biệt False và Not Given?', replies: 8, time: '5 giờ trước' },
    { q: 'Cách học từ vựng IELTS hiệu quả?', replies: 20, time: '1 ngày trước' },
  ],
  toeic: [
    { q: 'Chiến lược làm Part 2 nhanh?', replies: 9, time: '3 giờ trước' },
    { q: 'Cách tăng điểm Reading TOEIC?', replies: 14, time: '6 giờ trước' },
    { q: 'Business vocabulary quan trọng nhất?', replies: 17, time: '2 ngày trước' },
  ],
  'mos-word': [
    { q: 'Mail Merge có cần Excel không?', replies: 5, time: '4 giờ trước' },
    { q: 'Cách tạo Table of Contents tự động?', replies: 11, time: '1 ngày trước' },
    { q: 'Track Changes dùng khi nào?', replies: 7, time: '3 ngày trước' },
  ],
  'mos-excel': [
    { q: 'VLOOKUP vs INDEX MATCH cái nào tốt hơn?', replies: 23, time: '1 giờ trước' },
    { q: 'Cách làm Pivot Table từ nhiều sheet?', replies: 15, time: '8 giờ trước' },
    { q: 'Conditional Formatting nâng cao?', replies: 10, time: '2 ngày trước' },
  ],
  'mos-powerpoint': [
    { q: 'Animation có bị trừ điểm không?', replies: 6, time: '5 giờ trước' },
    { q: 'Cách chèn video vào slide đúng cách?', replies: 8, time: '1 ngày trước' },
    { q: 'SmartArt nào hay được hỏi trong thi?', replies: 12, time: '4 ngày trước' },
  ],
}

export default function CertificateDetail() {
  const { certId } = useParams<{ certId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const currentAccountIdValue = user?.account_id ?? user?.id ?? user?.accountId ?? null
  const normalizedAccountId = currentAccountIdValue != null ? String(currentAccountIdValue) : null

  const cert = CERTIFICATES.find((c) => c.id === (certId as CertId)) ?? CERTIFICATES[0]
  const isEnglish = cert.type === 'english'
  const isIelts = cert.id === 'ielts'

  const practiceTests = getPracticeTests(cert.id)
  const mosTasks = getMosTasksBycert(cert.id)
  const radarData = getRadarData(cert.id)
  const discussions = DISCUSSIONS[cert.id] ?? []

  const [activeSkill, setActiveSkill] = useState<EnglishSkill>('grammar')
  const [selectedBand, setSelectedBand] = useState<CertBand | null>(null)

  // ── Dữ liệu enrollment thật từ API ──────────────────────────────────────────
  const [enrollment, setEnrollment] = useState<EnrollmentResponse | null>(null)
  useEffect(() => {
    getEnrollment(cert.id).then(setEnrollment).catch(() => {})
  }, [cert.id])

  // onboarding removed: no localStorage calibration to load

  // For IELTS, prefer enrollment.target_band if present, otherwise use UI selection
  const derivedIeltsBand = useMemo(() => {
    if (!isIelts) return null
    return mapCalibrationBandToCertBand(enrollment?.target_band ?? null)
  }, [isIelts, enrollment?.target_band])

  const effectiveSelectedBand = isIelts ? derivedIeltsBand : selectedBand

  const handleSelectBand = useCallback((band: CertBand) => {
    setSelectedBand(band)
  }, [])

  // "Đổi mục tiêu" — reset về BandSelector, không lưu gì
  const handleChangeBand = useCallback(() => {
    // Reset selection — onboarding removed so simply reset
    setSelectedBand(null)
  }, [])


  // ── MOS Word Simulator ────────────────────────────────────────────────
  const [showSimulator, setShowSimulator] = useState(false)
  const handleSimulatorComplete = useCallback((_result: TaskResult) => {
    // có thể lưu kết quả vào API sau
  }, [])

  // Tiến độ và trạng thái thật — ưu tiên dữ liệu API
  const realProgress = enrollment
    ? Math.round((enrollment.completed_topics.length / enrollment.total_topics) * 100)
    : cert.progress
  const realStatus: typeof cert.status = enrollment?.status === 'active'
    ? 'active'
    : enrollment ? 'in-progress' : cert.status

  // ── Derived data (depends on selectedBand + completed_topics thật) ──────────────
  const skills = getSkills(cert.id, effectiveSelectedBand ?? undefined).map((section) => ({
    ...section,
    topics: section.topics.map((t) => ({
      ...t,
      done: t.topicKey
        ? (enrollment?.completed_topics ?? []).includes(t.topicKey)
        : t.done,
    })),
  }))
  const radarLabels = skills.map((s) => s.label)
  const roadmapSteps = getRoadmap(cert.id, effectiveSelectedBand ?? undefined)
  const activeSkillData = skills.find((s) => s.id === activeSkill)

  const buildLessonUrl = useCallback((topicKey: string, mode?: string) => {
    const params: string[] = []
  if (effectiveSelectedBand) params.push(`band=${effectiveSelectedBand}`)
    if (mode) params.push(`mode=${mode}`)
    const query = params.length ? `?${params.join('&')}` : ''
    return `/student/certificate-review/${cert.id}/lesson/${topicKey}${query}`
  }, [cert.id, effectiveSelectedBand])

  const navigateToTopic = useCallback((topicKey?: string, mode?: string) => {
    if (!topicKey) return
    navigate(buildLessonUrl(topicKey, mode))
  }, [buildLessonUrl, navigate])

  const nextTopic = useMemo(() => {
    for (const section of skills) {
      const pending = section.topics.find((t) => t.topicKey && !t.done)
      if (pending) return pending
    }
    for (const section of skills) {
      const fallback = section.topics.find((t) => t.topicKey)
      if (fallback) return fallback
    }
    return null
  }, [skills])

  const handleStartPlan = useCallback(() => {
    navigateToTopic(nextTopic?.topicKey)
  }, [navigateToTopic, nextTopic])

  const listeningTopicKey = useMemo(() => (
    skills.find((section) => section.id === 'listening')?.topics.find((t) => t.topicKey)?.topicKey
  ), [skills])

  const speakingTopicKey = useMemo(() => (
    skills.find((section) => section.id === 'speaking')?.topics.find((t) => t.topicKey)?.topicKey
  ), [skills])

  const writingTopicKey = useMemo(() => (
    skills.find((section) => section.id === 'writing')?.topics.find((t) => t.topicKey)?.topicKey
  ), [skills])

  const highlightTopics = (activeSkillData?.topics ?? []).slice(0, 3)
  const practiceRecommendations = practiceTests.slice(0, 2)
  const streakDays = Math.min(21, Math.max(1, Math.round(realProgress / 5) || 1))

  // Compute strongest / weakest from radar data
  const maxVal = radarData.length > 0 ? Math.max(...radarData) : 0
  const minVal = radarData.length > 0 ? Math.min(...radarData) : 0
  const strongest = skills[radarData.indexOf(maxVal)]?.label ?? 'Đọc'
  const weakest = skills[radarData.indexOf(minVal)]?.label ?? 'Viết'

  const bandOption = effectiveSelectedBand ? getBandOption(cert.id, effectiveSelectedBand) : undefined

  const goalBandFallback = useMemo(() => {
    if (bandOption?.label) {
      const match = bandOption.label.match(/(\d+(?:\.\d+)?)/)
      return match ? match[1] : null
    }
    return null
  }, [bandOption])

  const goalBandDisplay = enrollment?.target_band ?? goalBandFallback ?? '--'
  const currentBandDisplay = '0.0'
  const goalBandNumber = Number(goalBandDisplay) || 0
  const currentBandNumber = Number(currentBandDisplay) || 0
  const goalProgressPercent = goalBandNumber > 0 ? Math.min(100, Math.round((currentBandNumber / goalBandNumber) * 100)) : 0
  const examDateStr = null
  const dDayValue = useMemo(() => {
    if (!examDateStr) return null
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const examDate = new Date(examDateStr)
    examDate.setHours(0, 0, 0, 0)
    return Math.max(0, Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
  }, [examDateStr])
  const examDateLabel = examDateStr
    ? new Date(examDateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : null

  void user

  const shouldShowBandSelector = !effectiveSelectedBand && !isIelts

  // ── Show band selector when no band chosen (non-IELTS) ───────────
  if (shouldShowBandSelector) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header />
        <main className="flex-1">
          <BandSelector
            cert={cert}
            onSelect={handleSelectBand}
            onBack={() => navigate('/student/certificate-review')}
          />
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ── Breadcrumb / Back ── */}
        <nav className="flex items-center gap-2 text-sm text-slate-500">
          <button
            onClick={() => navigate('/student/certificate-review')}
            className="flex items-center gap-1 font-medium hover:text-purple-600 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" /> Ôn Luyện Chứng Chỉ
          </button>
          <span className="text-slate-300">/</span>
          <span className="font-semibold text-slate-700">{cert.label}</span>
        </nav>

        {/* ── Cert Hero ── */}
        {isIelts ? (
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1b1230] via-[#281d52] to-[#472669] p-8 text-white">
            <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(circle at top right, rgba(255,255,255,0.35), transparent 50%)' }} />
            <div className="relative z-10 flex flex-col lg:flex-row items-start gap-8">
              <div className="flex-1">
                <p className="text-xs uppercase tracking-[0.4em] text-white/60">IELTS HOME</p>
                <h1 className="mt-3 text-3xl sm:text-4xl font-black leading-tight">Chinh phục Band {goalBandDisplay !== '--' ? goalBandDisplay : 'mục tiêu'} với lộ trình cá nhân hoá.</h1>
                <p className="mt-3 text-white/80 text-sm sm:text-base">
                  {examDateLabel
                    ? `Bạn còn ${dDayValue ?? 0} ngày trước kỳ thi ngày ${examDateLabel}. Hôm nay hãy khóa thêm 1 kỹ năng nhé!`
                    : 'Đặt ngày thi để hệ thống tạo kế hoạch đếm ngược chi tiết cho bạn.'}
                </p>
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[{ label: 'Goal Band', value: goalBandDisplay, icon: <Target className="w-4 h-4" /> }, { label: 'Current Band', value: currentBandDisplay, icon: <BarChart2 className="w-4 h-4" /> }, { label: 'D-Day', value: examDateLabel ? `${dDayValue ?? 0} ngày` : 'Chưa đặt', icon: <Calendar className="w-4 h-4" /> }].map((item) => (
                    <div key={item.label} className="bg-white/10 border border-white/10 rounded-2xl px-4 py-3 backdrop-blur">
                      <div className="flex items-center gap-2 text-white/70 text-xs font-semibold uppercase tracking-wide">
                        {item.icon}
                        {item.label}
                      </div>
                      <p className="text-2xl font-bold mt-1">{item.value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={handleStartPlan}
                    disabled={!nextTopic?.topicKey}
                    className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold transition-colors cursor-pointer ${nextTopic?.topicKey ? 'bg-white text-[#1b1230] hover:bg-white/90' : 'bg-white/30 text-white/60 cursor-not-allowed'}`}
                  >
                    <ArrowRightCircle className="w-4 h-4" /> Tiếp tục lộ trình
                  </button>
                  <button
                    onClick={() => navigate('/student/certificate-review')}
                    className="px-4 py-3 rounded-2xl border border-white/20 text-sm font-semibold text-white/80 hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    Cập nhật mục tiêu
                  </button>
                </div>
              </div>
              <div className="w-full lg:w-80 bg-white/10 border border-white/15 rounded-3xl p-5 backdrop-blur">
                <p className="text-sm font-semibold text-white/80 flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4" /> Gợi ý luyện tập hôm nay
                </p>
                <div className="space-y-3">
                  {highlightTopics.map((topic, index) => (
                    <div
                      key={`${topic.title}-${index}`}
                      className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10"
                    >
                      <span className="w-8 h-8 rounded-2xl bg-white/10 flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{topic.title}</p>
                        <p className="text-xs text-white/70">{topic.desc}</p>
                      </div>
                    </div>
                  ))}
                  {highlightTopics.length === 0 && (
                    <p className="text-sm text-white/70">Hãy chọn một kỹ năng để xem gợi ý cụ thể.</p>
                  )}
                </div>
                <button
                  onClick={handleStartPlan}
                  disabled={!nextTopic?.topicKey}
                  className={`mt-4 w-full text-sm font-semibold flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border border-white/30 transition-colors cursor-pointer ${nextTopic?.topicKey ? 'hover:bg-white/10 text-white' : 'text-white/50 cursor-not-allowed'}`}
                >
                  Bắt đầu ngay
                </button>
              </div>
            </div>
          </section>
        ) : (
          <section className={`bg-gradient-to-r ${cert.bgFrom} ${cert.bgTo} rounded-2xl p-6 text-white`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                  <span className="text-2xl font-black">{cert.icon}</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{cert.label}</h1>
                  <p className="text-white/70 text-sm mt-0.5">{cert.sublabel}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="bg-white/20 px-2.5 py-1 rounded-lg text-sm font-bold">
                      Tiến độ: {realProgress}%
                    </span>
                    {(realStatus === 'active' || realStatus === 'in-progress') && (
                      <span className="bg-white/20 px-2.5 py-1 rounded-lg text-sm">Đang học</span>
                    )}
                    {goalBandDisplay && goalBandDisplay !== '--' && (
                      <span className="bg-white/25 px-2.5 py-1 rounded-lg text-sm font-semibold flex items-center gap-1">
                        🎯 Goal Band {goalBandDisplay}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {/* Progress bar */}
                <div className="hidden sm:block min-w-[140px]">
                  <div className="w-full bg-white/20 rounded-full h-2 mb-1.5">
                    <div
                      className="bg-white rounded-full h-2 transition-all"
                      style={{ width: `${realProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-white/60 text-right">{realProgress}% hoàn thành</p>
                </div>
                <button
                  onClick={handleChangeBand}
                  className="text-xs text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  Đổi mục tiêu
                </button>
              </div>
            </div>
          </section>
        )}

        {isIelts && (
          <>
            <section className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col sm:flex-row items-center gap-6">
                <div className="relative w-40 h-40 shrink-0">
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `conic-gradient(#6366f1 ${goalProgressPercent}%, #e2e8f0 ${goalProgressPercent}% 100%)`,
                    }}
                  />
                  <div className="absolute inset-4 bg-white rounded-full border border-indigo-50 flex flex-col items-center justify-center gap-1">
                    <span className="text-xs text-slate-400">Current Band</span>
                    <span className="text-4xl font-black text-indigo-600">{currentBandDisplay}</span>
                    <span className="text-xs text-slate-400">{goalProgressPercent}% Goal</span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm uppercase tracking-wide text-slate-400 mb-1">Goal Band</p>
                  <p className="text-4xl font-bold text-slate-800">{goalBandDisplay}</p>
                  <p className="mt-3 text-slate-500 text-sm flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
                    Tiến độ {goalProgressPercent}% – tiếp tục nhé!
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 rounded-3xl p-5 border border-blue-100 flex flex-col justify-between">
                <div>
                  <p className="text-sm text-blue-500 font-semibold">Goal Band</p>
                  <p className="text-4xl font-black text-blue-700">{goalBandDisplay}</p>
                  <p className="text-sm text-blue-500 mt-2">Đặt mục tiêu rõ ràng giúp bạn tăng tốc từng ngày.</p>
                </div>
                <div className="mt-4 flex items-center gap-3 text-sm text-slate-500">
                  <span className="text-2xl">🦉</span>
                  <p>Nói lớn lên nhé! Mỗi lần luyện là một bước gần hơn.</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-rose-50 to-orange-50 rounded-3xl p-5 border border-rose-100 flex flex-col justify-between">
                <div>
                  <p className="text-sm text-rose-500 font-semibold">D-Day</p>
                  <p className="text-4xl font-black text-rose-600">{dDayValue ?? '—'}</p>
                  <p className="text-sm text-rose-500 mt-2">
                    {examDateLabel ? `Còn ${dDayValue ?? 0} ngày tới ${examDateLabel}` : 'Chưa đặt ngày thi'}
                  </p>
                </div>
                <div className="mt-4 text-xs text-rose-400">
                  Duy trì luyện tập ít nhất 60 phút/ngày để đạt mục tiêu nhé!
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 flex flex-col justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500 flex items-center gap-2"><Flame className="w-4 h-4 text-amber-500" /> Chuỗi ngày luyện tập</p>
                  <p className="text-4xl font-black text-slate-800 mt-2">{streakDays} ngày</p>
                  <p className="text-xs text-slate-400">Giữ streak để được mở khóa đề thi nâng cao.</p>
                </div>
                <div className="mt-4">
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                    <span className="flex-1 h-1 rounded-full bg-slate-100 overflow-hidden">
                      <span
                        className="block h-full bg-gradient-to-r from-amber-400 to-orange-500"
                        style={{ width: `${Math.min(100, (streakDays / 14) * 100)}%` }}
                      />
                    </span>
                    <span>14d</span>
                  </div>
                  <p className="text-xs text-amber-600 font-semibold">Còn {Math.max(0, 14 - streakDays)} ngày để đạt streak vàng!</p>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
              <div className="xl:col-span-2">
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-7 w-1 rounded-full bg-gradient-to-b from-indigo-400 to-pink-400" />
                  <h2 className="text-xl font-bold text-slate-800">IELTS Focus Lab</h2>
                </div>
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="flex overflow-x-auto border-b border-slate-100">
                    {skills.map((skill) => (
                      <button
                        key={skill.id}
                        onClick={() => setActiveSkill(skill.id)}
                        className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors shrink-0 border-b-2 cursor-pointer ${
                          activeSkill === skill.id
                            ? 'border-purple-500 text-purple-700 bg-purple-50'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className={activeSkill === skill.id ? skill.color : 'text-slate-400'}>
                          {skill.icon}
                        </span>
                        {skill.label}
                      </button>
                    ))}
                  </div>
                  {activeSkillData && (
                    <div className="p-6">
                      <div className="flex items-start gap-3 mb-5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeSkillData.bg}`}>
                          <span className={activeSkillData.color}>{activeSkillData.icon}</span>
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800">{activeSkillData.label}</h3>
                          <p className="text-sm text-slate-400">
                            {activeSkillData.topics.filter((t) => t.done).length}/{activeSkillData.topics.length} chủ đề đã hoàn thành
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {activeSkillData.topics.map((topic, i) => (
                          <div
                            key={i}
                            onClick={() => topic.topicKey && navigate(buildLessonUrl(topic.topicKey))}
                            className={`flex items-start gap-2.5 p-3.5 rounded-xl border transition-all cursor-pointer hover:shadow-sm group ${
                              topic.done
                                ? 'bg-emerald-50 border-emerald-100 hover:border-emerald-300'
                                : 'bg-white border-slate-100 hover:border-purple-200 hover:bg-purple-50/30'
                            }`}
                          >
                            <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${topic.done ? 'bg-emerald-500' : 'bg-slate-100'}`}>
                              {topic.done ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                              ) : (
                                <span className="text-xs font-bold text-slate-400">{i + 1}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={`text-sm font-semibold ${topic.done ? 'text-emerald-700' : 'text-slate-700'}`}>
                                {topic.title}
                              </div>
                              <div className="text-xs text-slate-400 mt-0.5">{topic.desc}</div>
                              {topic.topicKey && (
                                <div className="mt-1.5 text-xs text-purple-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                  <span>Xem bài học chi tiết</span>
                                  <ChevronRight className="w-3 h-3" />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 p-4 rounded-xl bg-purple-50/60">
                        <div className="text-sm font-bold text-purple-600 mb-2 flex items-center gap-1.5">
                          <Zap className="w-4 h-4" /> Mẹo học tập
                        </div>
                        <ul className="space-y-1.5">
                          {activeSkillData.tips.map((tip, i) => (
                            <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                              <span className="mt-0.5 text-slate-400">•</span> {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="mt-4 flex gap-2.5">
                        <button
                          onClick={() => {
                            const firstTopic = activeSkillData?.topics.find((t) => t.topicKey && !t.done) ?? activeSkillData?.topics.find((t) => t.topicKey)
                            if (firstTopic?.topicKey) navigate(buildLessonUrl(firstTopic.topicKey))
                          }}
                          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-medium rounded-xl hover:from-purple-600 hover:to-blue-600 transition-colors cursor-pointer"
                        >
                          <PlayCircle className="w-4 h-4" /> Bắt đầu học
                        </button>
                        <button
                          onClick={() => {
                            const firstTopic = activeSkillData?.topics.find((t) => t.topicKey)
                            if (firstTopic?.topicKey) navigate(buildLessonUrl(firstTopic.topicKey, 'flashcard'))
                          }}
                          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <Library className="w-4 h-4" /> Flashcard
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Headphones className="w-4 h-4 text-purple-500" /> Lối tắt luyện tập
                  </h3>
                  <div className="space-y-3">
                    {[
                      { icon: <Headphones className="w-5 h-5 text-blue-500" />, title: 'Listening Lab 25’', desc: 'Chọn Section 3-4 theo band hiện tại.', topicKey: listeningTopicKey },
                      { icon: <Mic2 className="w-5 h-5 text-rose-500" />, title: 'Speaking Coach', desc: 'Ghi âm câu trả lời Part 2 & Part 3.', topicKey: speakingTopicKey, mode: 'flashcard' },
                      { icon: <BookOpen className="w-5 h-5 text-amber-500" />, title: 'Writing Clinic', desc: 'Ôn cấu trúc Task 2 + checklist 4 tiêu chí.', topicKey: writingTopicKey },
                    ].map((action) => (
                      <button
                        key={action.title}
                        onClick={() => navigateToTopic(action.topicKey, action.mode)}
                        className={`w-full text-left flex items-start gap-3 p-3 rounded-2xl border transition ${action.topicKey ? 'hover:border-purple-200 hover:bg-purple-50/40 cursor-pointer' : 'opacity-60 cursor-not-allowed bg-slate-50 border-slate-100'}`}
                      >
                        <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center">
                          {action.icon}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-800">{action.title}</p>
                          <p className="text-xs text-slate-500">{action.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-5 text-white">
                  <p className="text-sm font-semibold text-white/80">Weekly Pulse</p>
                  <h3 className="text-2xl font-bold mt-1">{realProgress}% tiến độ</h3>
                  <p className="text-sm text-white/70">
                    Hoàn thành ít nhất 3 đề trong tuần để mở khóa đề Speaking nâng cao.
                  </p>
                  <div className="mt-4 space-y-3">
                    {practiceRecommendations.map((test) => (
                      <div key={test.title} className="bg-white/10 rounded-2xl px-3 py-2 text-sm flex items-center gap-2">
                        <span className="text-white">{test.icon}</span>
                        <div>
                          <p className="font-semibold text-white">{test.title}</p>
                          <p className="text-xs text-white/70">{test.meta}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                <h3 className="font-bold text-slate-800 mb-5 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-purple-500" /> Lộ trình học
                </h3>
                <RoadmapView steps={roadmapSteps} />
              </div>
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-purple-500" /> Kho đề thi thử
                  </h3>
                  <button className="text-sm text-purple-600 font-medium hover:underline flex items-center gap-1 cursor-pointer">
                    Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <PracticeTestList tests={practiceTests} />
              </div>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {radarData.length > 0 && (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Star className="w-4 h-4 text-purple-500" /> Phân tích kỹ năng
                  </h3>
                  <div className="h-56 relative">
                    <SkillRadar data={radarData} labels={radarLabels} />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="p-2.5 bg-slate-50 rounded-xl text-center">
                      <p className="text-xs text-slate-400">Mạnh nhất</p>
                      <p className="font-bold text-emerald-600 text-sm">{strongest}</p>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl text-center">
                      <p className="text-xs text-slate-400">Yếu nhất</p>
                      <p className="font-bold text-orange-500 text-sm">{weakest}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-purple-500" /> Thảo luận gần đây
                </h3>
                <div className="space-y-3">
                  {discussions.map((item, i) => (
                    <div key={i} className="pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                      <p className="text-sm font-medium text-slate-700 hover:text-purple-600 cursor-pointer">
                        {item.q}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" /> {item.replies}
                        </span>
                        <span>• {item.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-4 text-sm text-purple-600 font-medium hover:bg-purple-50 py-2 rounded-xl transition-colors cursor-pointer">
                  Xem cộng đồng
                </button>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-5">
                <div className="h-7 w-1 rounded-full bg-gradient-to-b from-purple-400 to-blue-400" />
                <h2 className="text-xl font-bold text-slate-800">Tổng quan tất cả kỹ năng</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {skills.map((skill) => (
                  <SkillTopicCard key={skill.id} section={skill} />
                ))}
              </div>
            </section>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            ENGLISH CERTS (IELTS / TOEIC)
        ══════════════════════════════════════════════════════════════════════ */}
  {isEnglish && !isIelts && (
          <>
            {/* ── Learning Hub: Skill Tabs ── */}
            <section>
              <div className="flex items-center gap-3 mb-5">
                <div
                  className={`h-7 w-1 rounded-full bg-gradient-to-b ${cert.bgFrom} ${cert.bgTo}`}
                />
                <h2 className="text-xl font-bold text-slate-800">
                  {cert.label} – Trung tâm Học tập
                </h2>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Tabs */}
                <div className="flex overflow-x-auto border-b border-slate-100">
                  {skills.map((skill) => (
                    <button
                      key={skill.id}
                      onClick={() => setActiveSkill(skill.id)}
                      className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors shrink-0 border-b-2 cursor-pointer ${
                        activeSkill === skill.id
                          ? 'border-purple-500 text-purple-700 bg-purple-50'
                          : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span
                        className={
                          activeSkill === skill.id ? skill.color : 'text-slate-400'
                        }
                      >
                        {skill.icon}
                      </span>
                      {skill.label}
                    </button>
                  ))}
                </div>

                {/* Active skill content */}
                {activeSkillData && (
                  <div className="p-6">
                    <div className="flex items-start gap-3 mb-5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeSkillData.bg}`}
                      >
                        <span className={activeSkillData.color}>{activeSkillData.icon}</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800">{activeSkillData.label}</h3>
                        <p className="text-sm text-slate-400">
                          {activeSkillData.topics.filter((t) => t.done).length}/
                          {activeSkillData.topics.length} chủ đề đã hoàn thành
                        </p>
                      </div>
                    </div>

                    {/* Topic grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activeSkillData.topics.map((topic, i) => (
                        <div
                          key={i}
                          onClick={() => topic.topicKey && navigate(`/student/certificate-review/${cert.id}/lesson/${topic.topicKey}${effectiveSelectedBand ? `?band=${effectiveSelectedBand}` : ''}`)}
                          className={`flex items-start gap-2.5 p-3.5 rounded-xl border transition-all cursor-pointer hover:shadow-sm group ${
                            topic.done
                              ? 'bg-emerald-50 border-emerald-100 hover:border-emerald-300'
                              : 'bg-white border-slate-100 hover:border-purple-200 hover:bg-purple-50/30'
                          }`}
                        >
                          <div
                            className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                              topic.done ? 'bg-emerald-500' : 'bg-slate-100'
                            }`}
                          >
                            {topic.done ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                            ) : (
                              <span className="text-xs font-bold text-slate-400">{i + 1}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div
                              className={`text-sm font-semibold ${
                                topic.done ? 'text-emerald-700' : 'text-slate-700'
                              }`}
                            >
                              {topic.title}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">{topic.desc}</div>
                            {topic.topicKey && (
                              <div className="mt-1.5 text-xs text-purple-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                <span>Xem bài học chi tiết</span>
                                <ChevronRight className="w-3 h-3" />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Tips */}
                    <div className={`mt-4 p-4 rounded-xl ${activeSkillData.bg}`}>
                      <div
                        className={`text-sm font-bold ${activeSkillData.color} mb-2 flex items-center gap-1.5`}
                      >
                        <Zap className="w-4 h-4" /> Mẹo học tập
                      </div>
                      <ul className="space-y-1.5">
                        {activeSkillData.tips.map((tip, i) => (
                          <li
                            key={i}
                            className="text-sm text-slate-600 flex items-start gap-2"
                          >
                            <span className="mt-0.5 text-slate-400">•</span> {tip}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex gap-2.5">
                      <button
                        onClick={() => {
                          const firstTopic = activeSkillData?.topics.find(t => t.topicKey && !t.done) ?? activeSkillData?.topics.find(t => t.topicKey)
                          if (firstTopic?.topicKey) navigate(`/student/certificate-review/${cert.id}/lesson/${firstTopic.topicKey}${effectiveSelectedBand ? `?band=${effectiveSelectedBand}` : ''}`)
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-medium rounded-xl hover:from-purple-600 hover:to-blue-600 transition-colors cursor-pointer"
                      >
                        <PlayCircle className="w-4 h-4" /> Bắt đầu học
                      </button>
                      <button
                        onClick={() => {
                          const firstTopic = activeSkillData?.topics.find(t => t.topicKey)
                          if (firstTopic?.topicKey) navigate(`/student/certificate-review/${cert.id}/lesson/${firstTopic.topicKey}${effectiveSelectedBand ? `?band=${effectiveSelectedBand}&mode=flashcard` : '?mode=flashcard'}`)
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <Library className="w-4 h-4" /> Flashcard
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* ── Roadmap + Practice Tests + Radar + Community ── */}
            <section>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2/3 */}
                <div className="lg:col-span-2 space-y-5">
                  {/* Roadmap */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <h3 className="font-bold text-slate-800 mb-5 flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-purple-500" /> Lộ trình học
                    </h3>
                    <RoadmapView steps={roadmapSteps} />
                  </div>

                  {/* Practice Tests */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-purple-500" /> Kho đề thi thử
                      </h3>
                      <button className="text-sm text-purple-600 font-medium hover:underline flex items-center gap-1 cursor-pointer">
                        Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <PracticeTestList tests={practiceTests} />
                  </div>
                </div>

                {/* Right 1/3 */}
                <div className="space-y-5">
                  {/* Radar */}
                  {radarData.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Star className="w-4 h-4 text-purple-500" /> Phân tích kỹ năng
                      </h3>
                      <div className="h-56 relative">
                        <SkillRadar data={radarData} labels={radarLabels} />
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <div className="p-2.5 bg-slate-50 rounded-xl text-center">
                          <p className="text-xs text-slate-400">Mạnh nhất</p>
                          <p className="font-bold text-emerald-600 text-sm">{strongest}</p>
                        </div>
                        <div className="p-2.5 bg-slate-50 rounded-xl text-center">
                          <p className="text-xs text-slate-400">Yếu nhất</p>
                          <p className="font-bold text-orange-500 text-sm">{weakest}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Community Discussions */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-purple-500" /> Thảo luận gần đây
                    </h3>
                    <div className="space-y-3">
                      {discussions.map((item, i) => (
                        <div
                          key={i}
                          className="pb-3 border-b border-slate-50 last:border-0 last:pb-0"
                        >
                          <p className="text-sm font-medium text-slate-700 hover:text-purple-600 cursor-pointer">
                            {item.q}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <MessageCircle className="w-3 h-3" /> {item.replies}
                            </span>
                            <span>• {item.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button className="w-full mt-4 text-sm text-purple-600 font-medium hover:bg-purple-50 py-2 rounded-xl transition-colors cursor-pointer">
                      Xem cộng đồng
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* ── All Skills Overview ── */}
            <section>
              <div className="flex items-center gap-3 mb-5">
                <div className="h-7 w-1 rounded-full bg-gradient-to-b from-purple-400 to-blue-400" />
                <h2 className="text-xl font-bold text-slate-800">Tổng quan tất cả kỹ năng</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {skills.map((skill) => (
                  <SkillTopicCard key={skill.id} section={skill} />
                ))}
              </div>
            </section>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            MOS CERTS
        ══════════════════════════════════════════════════════════════════════ */}
        {!isEnglish && (
          <>
            {/* ── MOS Simulator / Task Panel ── */}
            {showSimulator ? (
              <section className="-mx-4 sm:-mx-6 lg:-mx-8">
                <div style={{ height: 'calc(100vh - 140px)' }}>
                  <MosWordSimulator
                    onComplete={handleSimulatorComplete}
                    onBack={() => setShowSimulator(false)}
                  />
                </div>
              </section>
            ) : (
            <section>
              <div className="flex items-center gap-3 mb-5">
                <div
                  className={`h-7 w-1 rounded-full bg-gradient-to-b ${cert.bgFrom} ${cert.bgTo}`}
                />
                <h2 className="text-xl font-bold text-slate-800">
                  {cert.label} – Luyện tập theo Task
                </h2>
              </div>

              {/* Progress banner + Launch button */}
              <div className={`bg-gradient-to-r ${cert.bgFrom} ${cert.bgTo} rounded-2xl p-5 text-white mb-5`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-lg font-bold mb-1">Mô phỏng Word trực tiếp trên web</p>
                    <p className="text-sm text-white/80">
                      Luyện tập các task MOS Word ngay trên trình duyệt. Hệ thống tự động chấm điểm theo tiêu chuẩn thi MOS.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="bg-white/20 text-xs px-2.5 py-1 rounded-full">✅ {mosTasks.length} tasks thực hành</span>
                      <span className="bg-white/20 text-xs px-2.5 py-1 rounded-full">✅ Tự động chấm điểm</span>
                      <span className="bg-white/20 text-xs px-2.5 py-1 rounded-full">✅ Lý thuyết + Thực hành</span>
                      <span className="bg-white/20 text-xs px-2.5 py-1 rounded-full">✅ Không cần cài Office</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-2xl font-bold">
                      {mosTasks.filter((t) => t.done).length}/{mosTasks.length}
                    </p>
                    <p className="text-xs text-white/70">task hoàn thành</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex-1 bg-white/20 rounded-full h-2">
                    <div
                      className="bg-white rounded-full h-2 transition-all"
                      style={{
                        width: `${
                          mosTasks.length > 0
                            ? (mosTasks.filter((t) => t.done).length / mosTasks.length) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  {cert.id === 'mos-word' && (
                    <button
                      onClick={() => setShowSimulator(true)}
                      className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-white text-[#2b579a] text-sm font-bold rounded-xl hover:bg-white/90 transition-colors cursor-pointer shadow-sm"
                    >
                      <Monitor className="w-4 h-4" /> Mở Word Simulator
                    </button>
                  )}
                </div>
              </div>

              {/* Roadmap */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-5">
                <h3 className="font-bold text-slate-800 mb-5 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-purple-500" /> Lộ trình học
                </h3>
                <RoadmapView steps={roadmapSteps} />
              </div>

              {/* MosTaskPanel chỉ dùng cho Excel/PowerPoint; mos-word dùng MosWordSimulator */}
              {cert.id !== 'mos-word' && (
                <MosTaskPanel tasks={mosTasks} certId={cert.id} />
              )}
            </section>
            )}

            {/* ── MOS Info Cards ── */}
            <section>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    icon: <Clock className="w-5 h-5 text-blue-600" />,
                    title: 'Thời gian thi',
                    body: '50 phút cho toàn bộ project. Quản lý thời gian cho từng task.',
                    accent: 'bg-blue-50',
                  },
                  {
                    icon: <Monitor className="w-5 h-5 text-purple-600" />,
                    title: 'Môi trường thi',
                    body: 'Thi trực tiếp trên máy tính với Office thực. Không dùng Internet.',
                    accent: 'bg-purple-50',
                  },
                  {
                    icon: <Trophy className="w-5 h-5 text-amber-600" />,
                    title: 'Tiêu chí đạt',
                    body: 'Đạt 700/1000 điểm. Mỗi task có trọng số điểm khác nhau.',
                    accent: 'bg-amber-50',
                  },
                ].map((info, i) => (
                  <div key={i} className={`${info.accent} rounded-2xl p-5 border border-white`}>
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        {info.icon}
                      </div>
                      <h4 className="font-bold text-slate-700 text-sm">{info.title}</h4>
                    </div>
                    <p className="text-xs text-slate-500">{info.body}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Community Discussions (MOS) ── */}
            <section>
              <div className="flex items-center gap-3 mb-5">
                <div
                  className={`h-7 w-1 rounded-full bg-gradient-to-b ${cert.bgFrom} ${cert.bgTo}`}
                />
                <h2 className="text-xl font-bold text-slate-800">Thảo luận cộng đồng</h2>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="space-y-3">
                  {discussions.map((item, i) => (
                    <div
                      key={i}
                      className="pb-3 border-b border-slate-50 last:border-0 last:pb-0"
                    >
                      <p className="text-sm font-medium text-slate-700 hover:text-purple-600 cursor-pointer">
                        {item.q}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" /> {item.replies}
                        </span>
                        <span>• {item.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-4 text-sm text-purple-600 font-medium hover:bg-purple-50 py-2 rounded-xl transition-colors cursor-pointer">
                  Xem cộng đồng
                </button>
              </div>
            </section>
          </>
        )}

      </main>

      <Footer />
    </div>
  )
}
