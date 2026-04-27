import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import { TrendingUp, Flame, Award, Lock, Diamond, Trophy } from 'lucide-react'
import { CERTIFICATES, StatCard, CertCard } from './certificateData'
import type { CertId, Certificate } from './certificateData'
import { getAllEnrollments } from '@/services/api/certificateService'
import type { EnrollmentResponse } from '@/services/api/certificateService'

const BACKGROUND_VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_083109_283f3553-e28f-428b-a723-d639c617eb2b.mp4'

export default function CertificateReview() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const frameRef = useRef<number | null>(null)
  const replayTimeoutRef = useRef<number | null>(null)
  const initializedRef = useRef(false)

  // ── Load dữ liệu enrollment thật từ API ──────────────────────────────────────────
  const [enrollments, setEnrollments] = useState<EnrollmentResponse[]>([])
  useEffect(() => {
    getAllEnrollments().then(setEnrollments).catch(() => {})
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const fadeWindow = 0.5

    const stopFrame = () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
    }

    const tick = () => {
      const duration = video.duration
      const currentTime = video.currentTime

      if (Number.isFinite(duration) && duration > 0) {
        let opacity = 1

        if (currentTime < fadeWindow) {
          opacity = currentTime / fadeWindow
        } else if (duration - currentTime < fadeWindow) {
          opacity = (duration - currentTime) / fadeWindow
        }

        video.style.opacity = String(Math.max(0, Math.min(1, opacity)))
      }

      frameRef.current = requestAnimationFrame(tick)
    }

    const startFrame = () => {
      stopFrame()
      frameRef.current = requestAnimationFrame(tick)
    }

    const playVideo = () => {
      void video
        .play()
        .then(() => {
          startFrame()
        })
        .catch(() => {})
    }

    const handleCanPlay = () => {
      if (initializedRef.current) return
      initializedRef.current = true
      video.style.opacity = '0'
      playVideo()
    }

    const handleEnded = () => {
      stopFrame()
      video.style.opacity = '0'

      if (replayTimeoutRef.current !== null) {
        window.clearTimeout(replayTimeoutRef.current)
      }

      replayTimeoutRef.current = window.setTimeout(() => {
        video.currentTime = 0
        playVideo()
      }, 100)
    }

    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('ended', handleEnded)

    if (video.readyState >= 2) {
      handleCanPlay()
    }

    return () => {
      stopFrame()

      if (replayTimeoutRef.current !== null) {
        window.clearTimeout(replayTimeoutRef.current)
      }

      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('ended', handleEnded)
      video.pause()
    }
  }, [])

  // ── Gắn progress/status thật vào từng chứng chỉ ──────────────────────────────────
  const certsWithProgress: Certificate[] = CERTIFICATES.map((c) => {
    const active = enrollments.find((e) => e.cert_type === c.id && e.status === 'active')
    const latest = active ?? enrollments.find((e) => e.cert_type === c.id)
    if (!latest) return c
    const progress = Math.round((latest.completed_topics.length / latest.total_topics) * 100)
    const status: Certificate['status'] = latest.status === 'active' ? 'active' : 'in-progress'
    return { ...c, progress, status }
  })

  // ── Tổng hợp thống kê từ dữ liệu thật ────────────────────────────────────────
  const startedCerts = certsWithProgress.filter((c) => c.progress > 0)
  const completedCerts = certsWithProgress.filter((c) => c.progress >= 100)
  const avgProgress =
    startedCerts.length > 0
      ? Math.round(startedCerts.reduce((sum, c) => sum + c.progress, 0) / startedCerts.length)
      : 0
  const completionRate =
    certsWithProgress.length > 0
      ? Math.round((completedCerts.length / certsWithProgress.length) * 100)
      : 0

  // Chưa có API cho streak — giữ tạm thời
  const streak = 5

  const displayName = user?.fullName || user?.full_name || user?.name || 'Sinh viên'
  const handleCertClick = (id: CertId) => {
    navigate(`/student/certificate-review/${id}`)
  }

  return (
    <div className="relative min-h-screen bg-slate-50 flex flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <video
          ref={videoRef}
          src={BACKGROUND_VIDEO_URL}
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 h-full w-full object-cover opacity-0"
          style={{
            filter: 'blur(0.8px) saturate(1.55) contrast(1.1) brightness(1)',
            transform: 'scale(1.04)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50/56 via-white/24 to-slate-50/60" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_22%,rgba(56,189,248,0.3),transparent_42%),radial-gradient(circle_at_84%_76%,rgba(251,191,36,0.24),transparent_48%),radial-gradient(circle_at_52%_14%,rgba(59,130,246,0.18),transparent_42%)]" />
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
                  Xin chào, 
                  <span className="font-semibold text-purple-600">{displayName}</span>! Hãy tiếp tục
                  lộ trình ôn luyện của bạn.
                </p>
              </div>
              <div className="flex items-center gap-1.5 bg-orange-50 text-orange-700 px-3 py-1.5 rounded-full border border-orange-100">
                <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                <span className="text-sm font-bold">{streak} ngày streak</span>
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
                value="1,250 điểm"
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
                      { cert: 'IELTS', rank: 16, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', icon: '🏅' },
                      { cert: 'TOEIC', rank: 1, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', icon: '🥇' },
                      { cert: 'MOS Excel', rank: 8, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100', icon: '🏅' },
                      { cert: 'HSK 2', rank: 3, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', icon: '🥉' },
                    ].map((r) => (
                      <span
                        key={`${setIdx}-${r.cert}`}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${r.bg} ${r.border} ${r.color}`}
                      >
                        <Trophy className="w-3.5 h-3.5 shrink-0" />
                        Xếp hạng {r.cert}: <strong className="font-bold">#{r.rank}</strong>
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
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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
