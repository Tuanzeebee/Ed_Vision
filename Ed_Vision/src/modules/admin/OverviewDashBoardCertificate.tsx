import { useCallback, useEffect, useMemo, useState } from 'react'
import AdminLayout from '@/components/ui/admin/AdminLayout'
import LoadingSpinner from '@/components/ui/admin/LoadingSpinner'
import dashboardStatsService, {
  type CertificateOverviewResponse,
  type CertificateOverviewTimeRange,
} from '@/services/api/dashboardStatsService'
import { useToast } from '@/lib/useToast'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line, Doughnut, Bar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
)

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

const Icon = ({ name, className = '' }: { name: string; className?: string }) => (
  <i className={`fas ${name} ${className}`}></i>
)

const TIME_RANGE_OPTIONS: Array<{
  value: CertificateOverviewTimeRange
  label: string
}> = [
  { value: 'this-month', label: 'Tháng này' },
  { value: 'last-month', label: 'Tháng trước' },
  { value: 'this-quarter', label: 'Quý này' },
  { value: 'this-year', label: 'Năm nay' },
]

const DISTRIBUTION_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6']

const KPI_STYLES = [
  { icon: 'fa-users', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
  { icon: 'fa-bolt', iconBg: 'bg-green-100', iconColor: 'text-green-600' },
  { icon: 'fa-sync-alt', iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
  {
    icon: 'fa-check-circle',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
  },
] as const

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '0'
  return new Intl.NumberFormat('vi-VN').format(Math.round(value))
}

function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return '0%'
  const rounded = Math.round(value * 10) / 10
  return `${rounded.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%`
}

function formatChange(change: number, trend: 'up' | 'down' | 'stable'): string {
  if (trend === 'stable' || change === 0) return '0%'
  const sign = trend === 'up' ? '+' : ''
  return `${sign}${change}%`
}

export default function OverviewDashBoardCertificate() {
  const { showToast } = useToast()
  const [timeRange, setTimeRange] =
    useState<CertificateOverviewTimeRange>('this-month')
  const [data, setData] = useState<CertificateOverviewResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await dashboardStatsService.getCertificateOverview({
        timeRange,
      })
      setData(result)
    } catch (err) {
      console.error('Failed to load certificate overview', err)
      setError('Không thể tải dữ liệu tổng quan chứng chỉ. Vui lòng thử lại.')
      showToast('Không thể tải dữ liệu tổng quan chứng chỉ', 'error')
    } finally {
      setLoading(false)
    }
  }, [timeRange, showToast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const kpiCards = useMemo(() => {
    const kpis = data?.kpis
    return [
      {
        title: 'Tổng sinh viên',
        value: formatNumber(kpis?.totalStudents.value ?? 0),
        change: formatChange(
          kpis?.totalStudents.change ?? 0,
          kpis?.totalStudents.trend ?? 'stable',
        ),
        trend: kpis?.totalStudents.trend ?? 'stable',
        ...KPI_STYLES[0],
      },
      {
        title: 'Đang hoạt động',
        value: formatNumber(kpis?.activeStudents.value ?? 0),
        change: formatChange(
          kpis?.activeStudents.change ?? 0,
          kpis?.activeStudents.trend ?? 'stable',
        ),
        trend: kpis?.activeStudents.trend ?? 'stable',
        ...KPI_STYLES[1],
      },
      {
        title: 'Tỷ lệ quay lại',
        value: formatPercent(kpis?.returnRate.value ?? 0),
        change: formatChange(
          kpis?.returnRate.change ?? 0,
          kpis?.returnRate.trend ?? 'stable',
        ),
        trend: kpis?.returnRate.trend ?? 'stable',
        ...KPI_STYLES[2],
      },
      {
        title: 'Tỷ lệ hoàn thành',
        value: formatPercent(kpis?.completionRate.value ?? 0),
        change: formatChange(
          kpis?.completionRate.change ?? 0,
          kpis?.completionRate.trend ?? 'stable',
        ),
        trend: kpis?.completionRate.trend ?? 'stable',
        ...KPI_STYLES[3],
      },
    ]
  }, [data])

  const trafficChartData = useMemo(() => {
    const labels = data?.traffic.labels ?? ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
    const values = data?.traffic.values ?? [0, 0, 0, 0, 0, 0, 0]
    return {
      labels,
      datasets: [
        {
          label: 'Lượt truy cập',
          data: values,
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#2563eb',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
        },
      ],
    }
  }, [data])

  const trafficChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { borderDash: [2, 2], color: '#e2e8f0' },
          ticks: { color: '#64748b' },
        },
        x: {
          grid: { display: false },
          ticks: { color: '#64748b' },
        },
      },
    }),
    [],
  )

  const distributionChartData = useMemo(() => {
    const labels = data?.distribution.labels ?? [
      'IELTS',
      'TOEIC',
      'Giao tiếp',
      'Khác',
    ]
    const values = data?.distribution.values ?? [0, 0, 0, 0]
    return {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: labels.map(
            (_, idx) => DISTRIBUTION_COLORS[idx % DISTRIBUTION_COLORS.length],
          ),
          borderWidth: 0,
          hoverOffset: 4,
        },
      ],
    }
  }, [data])

  const distributionChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: {
        legend: {
          position: 'bottom' as const,
          labels: {
            boxWidth: 12,
            usePointStyle: true,
            padding: 10,
            font: { size: 11 },
          },
        },
      },
    }),
    [],
  )

  const retentionChartData = useMemo(() => {
    const labels = data?.retention.labels ?? [
      'Tuần 1',
      'Tuần 2',
      'Tuần 3',
      'Tuần 4',
    ]
    const newStudents = data?.retention.newStudents ?? [0, 0, 0, 0]
    const returningStudents = data?.retention.returningStudents ?? [0, 0, 0, 0]
    return {
      labels,
      datasets: [
        {
          label: 'Mới',
          data: newStudents,
          backgroundColor: '#2563eb',
          borderRadius: 4,
        },
        {
          label: 'Quay lại',
          data: returningStudents,
          backgroundColor: '#94a3b8',
          borderRadius: 4,
        },
      ],
    }
  }, [data])

  const retentionChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom' as const,
          labels: { boxWidth: 12, padding: 10, font: { size: 11 } },
        },
      },
      scales: {
        y: {
          stacked: true,
          grid: { borderDash: [2, 2], color: '#e2e8f0' },
          ticks: { color: '#64748b' },
        },
        x: {
          stacked: true,
          grid: { display: false },
          ticks: { color: '#64748b' },
        },
      },
    }),
    [],
  )

  const recentActivities = data?.recentActivities ?? []

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Page Title */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Executive Overview</h1>
          <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-md border border-gray-200">
            <Icon name="fa-calendar" className="text-gray-500 text-sm" />
            <select
              className="bg-transparent text-sm font-medium text-gray-700 focus:outline-none"
              value={timeRange}
              onChange={(event) =>
                setTimeRange(event.target.value as CertificateOverviewTimeRange)
              }
              disabled={loading}
            >
              {TIME_RANGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
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
            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {kpiCards.map((kpi, index) => (
                <Card key={index} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-2 ${kpi.iconBg} rounded-lg`}>
                      <Icon
                        name={kpi.icon}
                        className={`${kpi.iconColor} text-xl`}
                      />
                    </div>
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded ${
                        kpi.trend === 'up'
                          ? 'text-green-600 bg-green-50'
                          : kpi.trend === 'down'
                            ? 'text-red-600 bg-red-50'
                            : 'text-gray-600 bg-gray-50'
                      }`}
                    >
                      {kpi.change}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 font-medium">{kpi.title}</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1">
                    {kpi.value}
                  </h3>
                </Card>
              ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Traffic Chart */}
              <Card className="lg:col-span-2 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="font-bold text-gray-900">
                    Lượt truy cập theo thời gian
                  </h4>
                </div>
                <div className="h-64">
                  <Line data={trafficChartData} options={trafficChartOptions} />
                </div>
              </Card>

              {/* Distribution Chart */}
              <Card className="p-6">
                <h4 className="font-bold text-gray-900 mb-6">
                  Phân bổ theo chứng chỉ
                </h4>
                <div className="h-64">
                  <Doughnut
                    data={distributionChartData}
                    options={distributionChartOptions}
                  />
                </div>
              </Card>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Retention Chart */}
              <Card className="p-6">
                <h4 className="font-bold text-gray-900 mb-6">
                  Sinh viên mới vs Quay lại
                </h4>
                <div className="h-64">
                  <Bar data={retentionChartData} options={retentionChartOptions} />
                </div>
              </Card>

              {/* Recent Activities */}
              <Card className="p-6">
                <h4 className="font-bold text-gray-900 mb-6">Hoạt động gần đây</h4>
                {recentActivities.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    Chưa có hoạt động nào trong khoảng thời gian này.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {recentActivities.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-2 h-2 rounded-full ${activity.color}`}
                          ></div>
                          <span className="text-sm font-medium text-gray-700">
                            {activity.text}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {activity.time}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
