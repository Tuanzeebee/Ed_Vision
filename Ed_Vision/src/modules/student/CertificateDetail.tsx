import { useState, useCallback, useEffect } from 'react'
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

  const cert = CERTIFICATES.find((c) => c.id === (certId as CertId)) ?? CERTIFICATES[0]
  const isEnglish = cert.type === 'english'

  const practiceTests = getPracticeTests(cert.id)
  const mosTasks = getMosTasksBycert(cert.id)
  const radarData = getRadarData(cert.id)
  const discussions = DISCUSSIONS[cert.id] ?? []

  const [activeSkill, setActiveSkill] = useState<EnglishSkill>('grammar')

  // ── Dữ liệu enrollment thật từ API ──────────────────────────────────────────
  const [enrollment, setEnrollment] = useState<EnrollmentResponse | null>(null)
  useEffect(() => {
    getEnrollment(cert.id).then(setEnrollment).catch(() => {})
  }, [cert.id])

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

  // ── Band selection — local preview mode (no DB persistence) ─────────────────
  const [selectedBand, setSelectedBand] = useState<CertBand | null>(null)

  const handleSelectBand = useCallback((band: CertBand) => {
    setSelectedBand(band)
  }, [])

  // "Đổi mục tiêu" — reset về BandSelector, không lưu gì
  const handleChangeBand = useCallback(() => {
    setSelectedBand(null)
  }, [])

  // ── Derived data (depends on selectedBand + completed_topics thật) ──────────────
  const skills = getSkills(cert.id, selectedBand ?? undefined).map((section) => ({
    ...section,
    topics: section.topics.map((t) => ({
      ...t,
      done: t.topicKey
        ? (enrollment?.completed_topics ?? []).includes(t.topicKey)
        : t.done,
    })),
  }))
  const radarLabels = skills.map((s) => s.label)
  const roadmapSteps = getRoadmap(cert.id, selectedBand ?? undefined)
  const activeSkillData = skills.find((s) => s.id === activeSkill)

  // Compute strongest / weakest from radar data
  const maxVal = radarData.length > 0 ? Math.max(...radarData) : 0
  const minVal = radarData.length > 0 ? Math.min(...radarData) : 0
  const strongest = skills[radarData.indexOf(maxVal)]?.label ?? 'Đọc'
  const weakest = skills[radarData.indexOf(minVal)]?.label ?? 'Viết'

  const bandOption = selectedBand ? getBandOption(cert.id, selectedBand) : undefined

  void user

  // ── Show band selector when no band chosen ────────────────────────────────
  if (!selectedBand) {
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
                  {bandOption && (
                    <span className="bg-white/25 px-2.5 py-1 rounded-lg text-sm font-semibold flex items-center gap-1">
                      🎯 {bandOption.label}
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

        {/* ══════════════════════════════════════════════════════════════════════
            ENGLISH CERTS (IELTS / TOEIC)
        ══════════════════════════════════════════════════════════════════════ */}
        {isEnglish && (
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
                          onClick={() => topic.topicKey && navigate(`/student/certificate-review/${cert.id}/lesson/${topic.topicKey}${selectedBand ? `?band=${selectedBand}` : ''}`)}
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
                          if (firstTopic?.topicKey) navigate(`/student/certificate-review/${cert.id}/lesson/${firstTopic.topicKey}${selectedBand ? `?band=${selectedBand}` : ''}`)
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-medium rounded-xl hover:from-purple-600 hover:to-blue-600 transition-colors cursor-pointer"
                      >
                        <PlayCircle className="w-4 h-4" /> Bắt đầu học
                      </button>
                      <button
                        onClick={() => {
                          const firstTopic = activeSkillData?.topics.find(t => t.topicKey)
                          if (firstTopic?.topicKey) navigate(`/student/certificate-review/${cert.id}/lesson/${firstTopic.topicKey}${selectedBand ? `?band=${selectedBand}&mode=flashcard` : '?mode=flashcard'}`)
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
