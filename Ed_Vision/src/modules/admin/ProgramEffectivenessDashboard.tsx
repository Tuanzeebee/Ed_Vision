import { useCallback, useEffect, useMemo, useState } from 'react'
import AdminLayout from '@/components/ui/admin/AdminLayout'
import LoadingSpinner from '@/components/ui/admin/LoadingSpinner'
import dashboardStatsService, {
  type ProgramEffectivenessBadgeTone,
  type ProgramEffectivenessCertType,
  type ProgramEffectivenessIconKey,
  type ProgramEffectivenessRatingTone,
  type ProgramEffectivenessResponse,
} from '@/services/api/dashboardStatsService'
import { useToast } from '@/lib/useToast'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

// Icon wrapper using Font Awesome
const Icon = ({ name, className = '' }: { name: string; className?: string }) => (
  <i className={`fas ${name} ${className}`}></i>
)

// Simple Card component
const Card = ({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) => (
  <div className={`bg-white border border-gray-200 rounded-xl shadow-sm ${className}`}>
    {children}
  </div>
)

const CERT_TYPE_OPTIONS: Array<{
  value: ProgramEffectivenessCertType
  label: string
}> = [
  { value: 'all', label: 'Tất cả chứng chỉ' },
  { value: 'ielts', label: 'IELTS' },
  { value: 'toeic', label: 'TOEIC' },
]

const MODULE_ICON_STYLES: Record<
  ProgramEffectivenessIconKey,
  { icon: string; iconBg: string; iconColor: string }
> = {
  improvement: {
    icon: 'fa-chart-line',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
  },
  attention: {
    icon: 'fa-exclamation-triangle',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
  },
}

const BADGE_COLORS: Record<ProgramEffectivenessBadgeTone, string> = {
  success: 'text-green-600',
  info: 'text-blue-600',
  warning: 'text-orange-600',
}

const RATING_COLORS: Record<ProgramEffectivenessRatingTone, string> = {
  success: 'text-green-600',
  info: 'text-blue-600',
  warning: 'text-orange-600',
  danger: 'text-red-600',
}

function formatPercentInt(value: number): string {
  if (!Number.isFinite(value)) return '0%'
  return `${Math.round(value)}%`
}

function formatNumberVN(value: number): string {
  if (!Number.isFinite(value)) return '0'
  return new Intl.NumberFormat('vi-VN').format(Math.round(value))
}

function formatImprovementBand(value: number): string {
  if (!Number.isFinite(value) || value === 0) return '0 band'
  const sign = value > 0 ? '+' : ''
  const rounded = Math.round(value * 10) / 10
  return `${sign}${rounded.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} band`
}

export default function ProgramEffectivenessDashboard() {
  const { showToast } = useToast()
  const [certType, setCertType] = useState<ProgramEffectivenessCertType>('all')
  const [data, setData] = useState<ProgramEffectivenessResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await dashboardStatsService.getProgramEffectiveness({
        certType,
      })
      setData(result)
    } catch (err) {
      console.error('Failed to load program effectiveness dashboard', err)
      setError('Không thể tải dữ liệu hiệu quả chương trình. Vui lòng thử lại.')
      showToast('Không thể tải dữ liệu hiệu quả chương trình', 'error')
    } finally {
      setLoading(false)
    }
  }, [certType, showToast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const scoreComparison = data?.scoreComparison
  const achievement = data?.achievement
  const moduleImpact = data?.moduleImpact ?? []
  const groupEffectiveness = data?.groupEffectiveness ?? []

  const effectivenessChartData = useMemo(
    () => ({
      labels: scoreComparison?.labels ?? [
        'Listening',
        'Reading',
        'Writing',
        'Speaking',
      ],
      datasets: [
        {
          label: 'Đầu vào',
          data: scoreComparison?.entry ?? [0, 0, 0, 0],
          backgroundColor: 'rgba(37, 99, 235, 0.4)',
          borderRadius: 4,
        },
        {
          label: 'Cuối khóa',
          data: scoreComparison?.exit ?? [0, 0, 0, 0],
          backgroundColor: '#2563eb',
          borderRadius: 4,
        },
      ],
    }),
    [scoreComparison],
  )

  const effectivenessChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
          align: 'end' as const,
          labels: {
            boxWidth: 12,
            padding: 10,
            font: { size: 11 },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: scoreComparison?.scaleMax ?? 9,
          grid: { borderDash: [2, 2], color: '#e2e8f0' },
          ticks: { color: '#64748b' },
        },
        x: {
          grid: { display: false },
          ticks: { color: '#64748b' },
        },
      },
    }),
    [scoreComparison?.scaleMax],
  )

  const achievementSuccessRate = achievement?.successRate ?? 0
  const achievementChartData = useMemo(
    () => ({
      datasets: [
        {
          data: [
            Math.max(0, Math.min(100, achievementSuccessRate)),
            Math.max(0, 100 - Math.min(100, achievementSuccessRate)),
          ],
          backgroundColor: ['#2563eb', '#f1f5f9'],
          borderWidth: 0,
          cutout: '80%',
        },
      ],
    }),
    [achievementSuccessRate],
  )

  const achievementChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
      },
    }),
    [],
  )

  const ieltsAchievementLabel = achievement
    ? `${formatPercentInt(achievement.ieltsAchievementRate)}`
    : '0%'
  const toeicAchievementLabel = achievement
    ? `${formatPercentInt(achievement.toeicAchievementRate)}`
    : '0%'

  const isEmpty =
    !loading &&
    !error &&
    moduleImpact.length === 0 &&
    groupEffectiveness.length === 0 &&
    (achievement?.totalEvaluated ?? 0) === 0 &&
    (scoreComparison?.entrySampleSize ?? 0) === 0 &&
    (scoreComparison?.exitSampleSize ?? 0) === 0

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Hiệu quả chương trình học
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Đánh giá hiệu quả đào tạo và tiến bộ sinh viên
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-md border border-gray-200">
              <Icon name="fa-filter" className="text-gray-500 text-sm" />
              <select
                className="bg-transparent text-sm font-medium text-gray-700 focus:outline-none"
                value={certType}
                onChange={(event) =>
                  setCertType(
                    event.target.value as ProgramEffectivenessCertType,
                  )
                }
                disabled={loading}
              >
                {CERT_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <button className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              <Icon name="fa-download" className="text-gray-500" />
              Export Report
            </button>
          </div>
        </div>

        {error && (
          <Card className="p-4 border-red-200 bg-red-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon name="fa-exclamation-circle" className="text-red-500" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
              <button
                onClick={() => fetchData()}
                className="text-sm font-medium text-red-600 hover:text-red-800"
              >
                Thử lại
              </button>
            </div>
          </Card>
        )}

        {loading && !data ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            {isEmpty && (
              <Card className="p-6 border-amber-200 bg-amber-50">
                <div className="flex items-center gap-3">
                  <Icon
                    name="fa-info-circle"
                    className="text-amber-500 text-lg"
                  />
                  <span className="text-sm text-amber-800">
                    Chưa có dữ liệu hiệu quả chương trình cho bộ lọc đang chọn.
                  </span>
                </div>
              </Card>
            )}

            {/* Score Comparison Chart */}
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h4 className="font-bold text-gray-900">
                    So sánh Điểm Đầu vào vs Điểm Cuối khóa
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Mẫu: {formatNumberVN(scoreComparison?.entrySampleSize ?? 0)}{' '}
                    SV đầu vào /{' '}
                    {formatNumberVN(scoreComparison?.exitSampleSize ?? 0)} SV
                    cuối khóa
                  </p>
                </div>
                <div className="flex gap-4 text-xs font-medium">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-400/40 rounded-sm"></div>
                    <span className="text-gray-600">Đầu vào</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-600 rounded-sm"></div>
                    <span className="text-gray-600">Cuối khóa</span>
                  </div>
                </div>
              </div>
              <div className="h-80">
                <Bar
                  data={effectivenessChartData}
                  options={effectivenessChartOptions}
                />
              </div>
            </Card>

            {/* Charts & Module Impact Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Standards Achievement */}
              <Card className="p-6">
                <h4 className="font-bold text-gray-900 mb-6">
                  % Sinh viên đạt chuẩn đầu ra
                </h4>
                <div className="flex items-center justify-center p-4">
                  <div className="relative w-44 h-44">
                    <Doughnut
                      data={achievementChartData}
                      options={achievementChartOptions}
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-bold text-gray-900">
                        {formatPercentInt(achievementSuccessRate)}
                      </span>
                      <span className="text-xs text-gray-500 uppercase font-semibold mt-1">
                        Thành công
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Trên tổng{' '}
                  {formatNumberVN(achievement?.totalEvaluated ?? 0)} SV được
                  đánh giá
                </p>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="p-4 bg-gray-50 rounded-lg text-center border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">IELTS 6.5+</p>
                    <p className="text-xl font-bold text-gray-900">
                      {ieltsAchievementLabel}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      {formatNumberVN(achievement?.ieltsEvaluated ?? 0)} SV
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg text-center border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">TOEIC 750+</p>
                    <p className="text-xl font-bold text-gray-900">
                      {toeicAchievementLabel}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      {formatNumberVN(achievement?.toeicEvaluated ?? 0)} SV
                    </p>
                  </div>
                </div>
              </Card>

              {/* Module Impact */}
              <Card className="p-6">
                <h4 className="font-bold text-gray-900 mb-6">
                  Mức độ cải thiện theo Module
                </h4>
                <div className="space-y-4">
                  {moduleImpact.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-6">
                      Chưa có dữ liệu module trong giai đoạn này.
                    </p>
                  )}
                  {moduleImpact.map((module) => {
                    const iconStyle = MODULE_ICON_STYLES[module.iconKey]
                    const badgeColor = BADGE_COLORS[module.badgeTone]
                    return (
                      <div
                        key={module.id}
                        className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <div
                          className={`w-12 h-12 ${iconStyle.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}
                        >
                          <Icon
                            name={iconStyle.icon}
                            className={`${iconStyle.iconColor} text-xl`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {module.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {module.description}
                          </p>
                        </div>
                        <span
                          className={`text-xs font-bold ${badgeColor} whitespace-nowrap`}
                        >
                          {module.badge}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </Card>
            </div>

            {/* Group Effectiveness Table */}
            <Card className="overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h4 className="font-bold text-gray-900">
                  Hiệu quả theo nhóm sinh viên
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                        Nhóm (Năm học/Khoa)
                      </th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-center">
                        Số lượng SV
                      </th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-center">
                        Cải thiện TB
                      </th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-center">
                        % Đạt chuẩn
                      </th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-center">
                        Đánh giá
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {groupEffectiveness.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-8 text-center text-sm text-gray-500"
                        >
                          Chưa có dữ liệu nhóm sinh viên cho bộ lọc đang chọn.
                        </td>
                      </tr>
                    )}
                    {groupEffectiveness.map((group) => {
                      const ratingColor = RATING_COLORS[group.ratingTone]
                      const successWidth = `${Math.max(
                        0,
                        Math.min(100, group.successRate),
                      )}%`
                      return (
                        <tr
                          key={group.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {group.cohortName}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700 text-center">
                            {formatNumberVN(group.totalStudents)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700 text-center font-medium">
                            {formatImprovementBand(group.avgImprovement)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 bg-gray-200 h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-blue-600 h-full rounded-full"
                                  style={{ width: successWidth }}
                                ></div>
                              </div>
                              <span className="font-medium">
                                {formatPercentInt(group.successRate)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`text-sm font-bold ${ratingColor}`}
                            >
                              {group.rating}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
