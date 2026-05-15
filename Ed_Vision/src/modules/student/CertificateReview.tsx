import { useState, useEffect, useRef , useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import { TrendingUp, Flame, Award, Lock, Diamond, Trophy, FileCheck, MessageSquare, BarChart, Zap } from 'lucide-react'
import { CERTIFICATES, StatCard, CertCard } from './certificateData'
import type { CertId, Certificate } from './certificateData'
import { getAllEnrollments, getToeicReservePoints } from '@/services/api/certificateService'
import type { EnrollmentResponse, ToeicReservePointsResponse } from '@/services/api/certificateService'
import { studyRoomService } from '@/services/student/studyRoomService'
import { getPersonalStats } from '@/services/api/leaderboardService'

export default function CertificateReview() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const IELTS_SURVEY_KEY = 'ieltsSurveyCompleted'

  // ── Load dữ liệu enrollment thật từ API ──────────────────────────────────────────
  const [enrollments, setEnrollments] = useState<EnrollmentResponse[]>([])
  const [toeicReserve, setToeicReserve] = useState<ToeicReservePointsResponse | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [streak, setStreak] = useState(0)
  const [totalExp, setTotalExp] = useState(0)
  useEffect(() => {
    Promise.all([
      getAllEnrollments(),
      getToeicReservePoints().catch(() => null),
      studyRoomService.getMyStudyStats().catch(() => null),
      getPersonalStats().catch(() => null),
    ]).then(([enrollData, reserveData, statsData, personalStats]) => {
      setEnrollments(enrollData)
      setToeicReserve(reserveData)
      if (statsData) {
        setStreak(statsData.streak.current ?? 0)
      }
      if (personalStats) {
        setTotalExp(personalStats.totals.totalExp ?? 0)
      }
      setIsLoaded(true)
    }).catch(() => {
      setIsLoaded(true)
    })
  }, [])



  // ── Gắn progress/status thật vào từng chứng chỉ ──────────────────────────────────
  const certsWithProgress: Certificate[] = CERTIFICATES.map((c) => {
    const active = enrollments.find((e) => e.cert_type === c.id && e.status === 'active')
    const latest = active ?? enrollments.find((e) => e.cert_type === c.id)
    if (!latest) return c

    // Tính tiến độ:
    // - TOEIC: dùng điểm gốc / điểm mục tiêu (clamp 0..100)
    // - Còn lại: progress_percent từ API hoặc completed_topics / total_topics
    let progress = 0
    if (c.id === 'toeic') {
      const baseScore = latest.current_score ?? null
      const targetScore = latest.target_score ?? null
      if (baseScore && targetScore && targetScore > 0) {
        progress = Math.max(
          0,
          Math.min(100, Math.round((Number(baseScore) / Number(targetScore)) * 100)),
        )
      } else if (latest.progress_percent != null) {
        progress = Math.max(0, Math.min(100, Math.round(Number(latest.progress_percent))))
      }
    } else if (latest.progress_percent != null) {
      progress = Math.max(0, Math.min(100, Math.round(Number(latest.progress_percent))))
    } else if (latest.total_topics > 0) {
      progress = Math.round((latest.completed_topics.length / latest.total_topics) * 100)
    }

    const status: Certificate['status'] = latest.status === 'active' ? 'active' : 'in-progress'
    // "Đang học" chỉ hiện khi đã làm khảo sát và có điểm gốc (current_score)
    const hasBaseScore = !!(latest.current_score && latest.current_score > 0)
    return { ...c, progress, status, hasBaseScore }
  })

  // ── Tổng hợp thống kê từ dữ liệu thật ────────────────────────────────────────
  const startedCerts = certsWithProgress.filter((c) => {
    if (c.progress > 0) return true
    // Nếu enrollment đã ở trạng thái in_progress (backend ghi nhận có hoạt động)
    const enroll = enrollments.find((e) => e.cert_type === c.id)
    return enroll?.learning_status === 'in_progress'
  })
  const completedCerts = certsWithProgress.filter((c) => c.progress >= 100)
  const avgProgress =
    startedCerts.length > 0
      ? Math.round(startedCerts.reduce((sum, c) => sum + c.progress, 0) / startedCerts.length)
      : 0
  const completionRate =
    certsWithProgress.length > 0
      ? Math.round((completedCerts.length / certsWithProgress.length) * 100)
      : 0

  const displayName = user?.fullName || user?.full_name || user?.name || 'Sinh viên'

  const hasCompletedIeltsSurvey = useMemo(() => {
    if (!isLoaded) return true; // Wait for load to avoid accidental triggers

    const enrollment = enrollments.find((e) => e.cert_type === 'ielts')

    // Nếu backend đã lưu target_score thì chắc chắn đã hoàn thành setup
    if (enrollment && enrollment.target_score) return true;

    // Nếu chưa có enrollment hoặc chưa có target_score (chưa hoàn thành bước chọn mục tiêu), 
    // bắt buộc người dùng phải làm bài test (hoặc chọn mục tiêu lại). 
    // Xóa bộ nhớ đệm cục bộ để tránh bị vướng state cũ dẫn đến skip test.
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(IELTS_SURVEY_KEY);
      window.localStorage.removeItem('ieltsGoalBand');
      window.localStorage.removeItem('ieltsCurrentBand');
      window.localStorage.removeItem('ieltsExamDate');
    }
    return false;
  }, [enrollments, isLoaded])

  const handleCertClick = (id: CertId) => {
    if (!isLoaded) return;
    if (id === 'ielts' && !hasCompletedIeltsSurvey) {
      navigate('/student/ielts-assessment?next=/student/certificate-review/ielts')
      return
    }
    navigate(`/student/certificate-review/${id}`)
  }

  return (
    <div className="relative min-h-screen bg-slate-50 flex flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-slate-50/80" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_22%,rgba(56,189,248,0.05),transparent_42%),radial-gradient(circle_at_84%_76%,rgba(59,130,246,0.05),transparent_48%)]" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <Header />

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
          {/* ── Welcome & Aggregate KPI ── */}
          <section>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl"></span>
                  <h1 className="text-2xl font-bold text-slate-800">Ôn Luyện Chứng Chỉ</h1>
                </div>
                <p className="text-slate-500">
                  Xin chào,{" "}
                  <span className="font-semibold text-slate-700">{displayName}</span>! Hãy tiếp tục
                  lộ trình ôn luyện của bạn.
                </p>
              </div>
            </div>

            {/* 3 KPI cards — dynamic, reflect all certs being studied */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
                label="Tiến độ tổng thể"
                value={startedCerts.length > 0 ? `${avgProgress}%` : '0%'}
                sub={`${startedCerts.length} chứng chỉ đang học · ${completedCerts.length} đã hoàn thành`}
                accent="bg-emerald-50"
                cardClassName="bg-emerald-50/90 border-emerald-100"
              />
              <StatCard
                icon={<Flame className="w-5 h-5 text-orange-500" />}
                label="Chuỗi ngày học"
                value={`${streak} ngày`}
                sub="Hãy học ít nhất 15 phút mỗi ngày!"
                accent="bg-amber-100"
                cardClassName="bg-amber-50/90 border-amber-100"
              />
              <StatCard
                icon={<Diamond className="w-5 h-5 text-cyan-500 fill-cyan-400" />}
                label="Tổng điểm tích lũy"
                value={totalExp > 0 ? `${totalExp.toFixed(1)} điểm` : '0 điểm'}
                sub="Tích lũy từ tất cả chứng chỉ đang học"
                accent="bg-indigo-100"
                cardClassName="bg-indigo-50/90 border-indigo-100"
              />
            </div>

            {/* ── Ranking Marquee Ticker ── */}
            <div className="mt-3 overflow-hidden rounded-xl bg-white/70 backdrop-blur border border-slate-100 py-2">
              <style>{`
                @keyframes ticker-scroll {
                  0% { transform: translateX(0); }
                  100% { transform: translateX(-50%); }
                }
              `}</style>
              <div
                className="flex whitespace-nowrap"
                style={{ animation: 'ticker-scroll 20s linear infinite', width: 'max-content' }}
              >
                {[...Array(2)].map((_, setIdx) => (
                  <div key={setIdx} className="flex items-center gap-6 px-3">
                    {[
                      { cert: 'IELTS', rank: 16, icon: '🏅' },
                      { cert: 'TOEIC', rank: 1, icon: '🥇' },
                    ].map((r) => (
                      <span
                        key={`${setIdx}-${r.cert}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold bg-slate-50 border-slate-200 text-slate-600"
                      >
                        <Trophy className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        Xếp hạng {r.cert}: <strong className="font-bold text-slate-700">#{r.rank}</strong>
                      </span>
                    ))}
                    <span className="text-slate-300 text-xs">✦</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Certificate Selection ── */}
          <section>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-600" />Chọn Chứng chỉ
              </h2>
              <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                {startedCerts.length}/{CERTIFICATES.length} đã bắt đầu
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-3xl mx-auto">
              {certsWithProgress.map((c) => (
                <CertCard key={c.id} cert={c} selected={false} onClick={() => handleCertClick(c.id)} />
              ))}
            </div>
          </section>

          {/* ── Achievements & Badges ── */}
          <section>
            <div className="flex items-center gap-3 mb-5">
              <div className="h-7 w-1 rounded-full bg-gradient-to-b from-amber-400 to-orange-400" />
              <h2 className="text-xl font-bold text-slate-800">Thành tích & Huy hiệu</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: '', name: 'Streak 5 ngày', desc: 'Học 5 ngày liên tiếp', earned: true },
                { icon: '', name: 'Grammar Master', desc: 'Hoàn thành tất cả bài ngữ pháp', earned: true },
                { icon: '', name: 'Test Taker', desc: 'Làm 5 bài thi thử', earned: false },
                { icon: '', name: 'Top Scorer', desc: 'Đạt điểm cao nhất tuần', earned: false },
              ].map((badge, i) => (
                <div
                  key={i}
                  className={`bg-white rounded-2xl border p-4 text-center transition-all ${
                    badge.earned
                      ? 'border-amber-100 shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-0.5'
                      : 'border-slate-100 opacity-50 grayscale'
                  }`}
                >
                  <div className={`text-3xl mb-2 ${!badge.earned ? 'blur-sm' : ''}`}>{badge.icon}</div>
                  <div className="font-bold text-slate-700 text-sm">{badge.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{badge.desc}</div>
                  {badge.earned ? (
                    <div className="mt-2 text-xs font-bold text-amber-600 bg-amber-50 rounded-full px-2 py-0.5">Đã đạt</div>
                  ) : (
                    <div className="mt-2 text-xs text-slate-400 flex items-center justify-center gap-1">
                      <Lock className="w-3 h-3" />Chưa mở
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </div>
  )
}
