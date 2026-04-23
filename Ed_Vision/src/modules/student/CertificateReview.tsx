import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import { TrendingUp, Flame, Target, Award, Lock } from 'lucide-react'
import { CERTIFICATES, StatCard, CertCard } from './certificateData'
import type { CertId, Certificate } from './certificateData'
import { getAllEnrollments } from '@/services/api/certificateService'
import type { EnrollmentResponse } from '@/services/api/certificateService'
export default function CertificateReview() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const IELTS_SURVEY_KEY = 'ieltsSurveyCompleted'

  // ── Load dữ liệu enrollment thật từ API ──────────────────────────────────────────
  const [enrollments, setEnrollments] = useState<EnrollmentResponse[]>([])
  useEffect(() => {
    getAllEnrollments().then(setEnrollments).catch(() => {})
  }, [])

  // ── Gắn progress/status thật vào từng chứng chỉ ──────────────────────────────────
  const certsWithProgress: Certificate[] = CERTIFICATES.map((c) => {
    const active = enrollments.find((e) =>e.cert_type === c.id && e.status === 'active')
    const latest = active ?? enrollments.find((e) =>e.cert_type === c.id)
    if (!latest) return c
    const progress = Math.round((latest.completed_topics.length / latest.total_topics) * 100)
    const status: Certificate['status'] = latest.status === 'active'? 'active': 'in-progress'
return { ...c, progress, status }
  })

  // ── Tổng hợp thống kê từ dữ liệu thật ────────────────────────────────────────
  const startedCerts = certsWithProgress.filter((c) =>c.progress >0)
  const completedCerts = certsWithProgress.filter((c) =>c.progress >= 100)
  const avgProgress =
    startedCerts.length >0
      ? Math.round(startedCerts.reduce((sum, c) =>sum + c.progress, 0) / startedCerts.length)
      : 0

  // Chưa có API cho streak và weekly goals — giữ tạm thời
  const streak = 5
  const weeklyDone = 3
  const weeklyTotal = 5

  const displayName = user?.fullName || user?.full_name || user?.name || 'Sinh viên'

  const hasCompletedIeltsSurvey = useMemo(() => {
    const enrollment = enrollments.find((e) => e.cert_type === 'ielts')
    const localFlag = typeof window !== 'undefined'
      ? window.localStorage.getItem(IELTS_SURVEY_KEY) === 'true'
      : false
    const ieltsGoalBand = typeof window !== 'undefined'
      ? window.localStorage.getItem('ieltsGoalBand')
      : null
    return Boolean(ieltsGoalBand) || localFlag
  }, [enrollments])

  const handleCertClick = (id: CertId) => {
    if (id === 'ielts' && !hasCompletedIeltsSurvey) {
      navigate('/student/ielts-assessment?next=/student/certificate-review/ielts')
      return
    }
    navigate(`/student/certificate-review/${id}`)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
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
              <p className="text-slate-500">Xin chào,{''}
                <span className="font-semibold text-purple-600">{displayName}</span>! Hãy tiếp tục
                lộ trình ôn luyện của bạn.
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-orange-50 text-orange-700 px-3 py-1.5 rounded-full border border-orange-100">
              <Flame className="w-4 h-4 text-orange-500 fill-orange-500"/>
              <span className="text-sm font-bold">{streak} ngày streak</span>
            </div>
          </div>

          {/* 3 KPI cards — dynamic, reflect all certs being studied */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              icon={<TrendingUp className="w-5 h-5 text-emerald-600"/>}
              label="Tiến độ tổng thể"value={startedCerts.length >0 ? `${avgProgress}%` : '0%'}
              sub={`${startedCerts.length} chứng chỉ đang học · ${completedCerts.length} đã hoàn thành`}
              accent="bg-emerald-50"/>
            <StatCard
              icon={<Flame className="w-5 h-5 text-orange-500"/>}
              label="Chuỗi ngày học"value={`${streak} ngày`}
              sub="Hãy học ít nhất 15 phút mỗi ngày!"accent="bg-orange-50"/>
            <StatCard
              icon={<Target className="w-5 h-5 text-purple-600"/>}
              label="Mục tiêu tuần"value={`${weeklyDone}/${weeklyTotal} module`}
              sub={`Còn ${weeklyTotal - weeklyDone} module nữa để nhận huy hiệu`}
              accent="bg-purple-50"/>
          </div>
        </section>

        {/* ── Certificate Selection ── */}
        <section>
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-600"/>Chọn Chứng chỉ
            </h2>
            <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
              {startedCerts.length}/{CERTIFICATES.length} đã bắt đầu
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {certsWithProgress.map((c) =>(
              <CertCard
                key={c.id}
                cert={c}
                selected={false}
                onClick={() =>handleCertClick(c.id)}
              />))}
          </div>
        </section>

        {/* ── Achievements & Badges ── */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="h-7 w-1 rounded-full bg-gradient-to-b from-amber-400 to-orange-400"/>
            <h2 className="text-xl font-bold text-slate-800">Thành tích & Huy hiệu</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: '', name: 'Streak 5 ngày', desc: 'Học 5 ngày liên tiếp', earned: true },
              { icon: '', name: 'Grammar Master', desc: 'Hoàn thành tất cả bài ngữ pháp', earned: true },
              { icon: '', name: 'Test Taker', desc: 'Làm 5 bài thi thử', earned: false },
              { icon: '', name: 'Top Scorer', desc: 'Đạt điểm cao nhất tuần', earned: false },
            ].map((badge, i) =>(
              <div
                key={i}
                className={`bg-white rounded-2xl border p-4 text-center transition-all ${
                  badge.earned
                    ? 'border-amber-100 shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-0.5': 'border-slate-100 opacity-50 grayscale'}`}
              >
                <div className={`text-3xl mb-2 ${!badge.earned ? 'blur-sm': ''}`}>
                  {badge.icon}
                </div>
                <div className="font-bold text-slate-700 text-sm">{badge.name}</div>
                <div className="text-xs text-slate-400 mt-0.5">{badge.desc}</div>
                {badge.earned ? (
                  <div className="mt-2 text-xs font-bold text-amber-600 bg-amber-50 rounded-full px-2 py-0.5">Đã đạt
                  </div>) : (
                  <div className="mt-2 text-xs text-slate-400 flex items-center justify-center gap-1">
                    <Lock className="w-3 h-3"/>Chưa mở
                  </div>)}
              </div>))}
          </div>
        </section>

      </main>

      <Footer />
    </div>)
}
