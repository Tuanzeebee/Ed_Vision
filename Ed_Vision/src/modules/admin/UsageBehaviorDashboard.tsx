import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import AdminLayout from '@/components/ui/admin/AdminLayout'
import LoadingSpinner from '@/components/ui/admin/LoadingSpinner'
import dashboardStatsService, {
  type UsageBehaviorResponse,
  type UsageBehaviorTimeRange,
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
import { Bar, Pie } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
)

const Card = ({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) => (
  <div
    className={`bg-white border border-gray-200 rounded-xl shadow-sm ${className}`}
  >
    {children}
  </div>
)

const Icon = ({ name, className = '' }: { name: string; className?: string }) => (
  <i className={`fas ${name} ${className}`}></i>
)

const TIME_RANGE_OPTIONS: Array<{ value: UsageBehaviorTimeRange; label: string }> = [
  { value: '7d', label: '7 ngày qua' },
  { value: '30d', label: '30 ngày qua' },
  { value: '90d', label: '90 ngày qua' },
]

/**
 * Intensity (0..4) → Tailwind background class. Mirrors the gradient legend
 * shown in the UI: blue-50 (ít) → blue-600 (nhiều).
 */
const INTENSITY_CLASS: Record<number, string> = {
  0: 'bg-blue-50',
  1: 'bg-blue-100',
  2: 'bg-blue-200',
  3: 'bg-blue-400',
  4: 'bg-blue-600',
}

const FEATURE_STYLE: Record<
  string,
  { icon: string; iconBg: string; iconColor: string; barColor: string }
> = {
  test: {
    icon: 'fa-file-alt',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    barColor: 'bg-blue-600',
  },
  video: {
    icon: 'fa-play-circle',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    barColor: 'bg-green-500',
  },
  exercise: {
    icon: 'fa-book-open',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    barColor: 'bg-purple-500',
  },
  certificate: {
    icon: 'fa-award',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    barColor: 'bg-orange-500',
  },
}

const FALLBACK_FEATURE_STYLE = FEATURE_STYLE.test

export default function UsageBehaviorDashboard() {
  const { t } = useTranslation(['admin', 'common'])
  const { showToast } = useToast()
  const [timeRange, setTimeRange] = useState<UsageBehaviorTimeRange>('7d')
  const [data, setData] = useState<UsageBehaviorResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await dashboardStatsService.getUsageBehavior({ timeRange })
      setData(result)
    } catch (err) {
      console.error('Failed to load usage behavior dashboard', err)
      setError('Không thể tải dữ liệu hành vi sử dụng. Vui lòng thử lại.')
      showToast('Không thể tải dữ liệu hành vi sử dụng', 'error')
    } finally {
      setLoading(false)
    }
  }, [timeRange, showToast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const durationChartData = useMemo(() => {
    const labels = data?.duration.labels ?? ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
    const values = data?.duration.values ?? [0, 0, 0, 0, 0, 0, 0]
    return {
      labels,
      datasets: [
        {
          label: 'Phút',
          data: values,
          backgroundColor: '#2563eb',
          borderRadius: 6,
        },
      ],
    }
  }, [data])

  const durationChartOptions = useMemo(
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

  // Device Chart data (Pie chart) - using mock data for now
  const deviceChartData = useMemo(
    () => ({
      labels: ['Web Desktop', 'Mobile App', 'Tablet'],
      datasets: [
        {
          data: [55, 35, 10],
          backgroundColor: ['#2563eb', '#10b981', '#f59e0b'],
          borderWidth: 0,
          hoverOffset: 4,
        },
      ],
    }),
    [],
  )

  const deviceChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right' as const,
          labels: {
            boxWidth: 12,
            padding: 10,
            font: { size: 11 },
          },
        },
      },
    }),
    [],
  )

  const heatmap = data?.heatmap
  const featureItems = data?.featureUsage.items ?? []

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Page Title */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-gray-900">
            Hành vi sử dụng & Khung giờ cao điểm
          </h1>
          <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-md border border-gray-200">
            <Icon name="fa-calendar" className="text-gray-500 text-sm" />
            <select
              className="bg-transparent text-sm font-medium text-gray-700 focus:outline-none"
              value={timeRange}
              onChange={(e) =>
                setTimeRange(e.target.value as UsageBehaviorTimeRange)
              }
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
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            {/* Heatmap */}
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
                <h4 className="font-bold text-gray-900">
                  Mật độ truy cập theo giờ &amp; ngày
                </h4>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>Ít</span>
                  <div className="flex gap-1">
                    <div className="w-3 h-3 bg-blue-50 rounded-sm"></div>
                    <div className="w-3 h-3 bg-blue-200 rounded-sm"></div>
                    <div className="w-3 h-3 bg-blue-400 rounded-sm"></div>
                    <div className="w-3 h-3 bg-blue-600 rounded-sm"></div>
                  </div>
                  <span>Nhiều</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <div className="min-w-[600px] grid grid-cols-8 gap-2">
                  <div className="h-6"></div>
                  {(heatmap?.days ?? ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']).map((day) => (
                    <div
                      key={day}
                      className="text-center text-[10px] text-gray-500 font-medium uppercase"
                    >
                      {day}
                    </div>
                  ))}
                  {(heatmap?.hours ?? []).map((hour, rowIndex) => (
                    <HeatmapRow
                      key={`row-${hour}-${rowIndex}`}
                      hour={hour}
                      cells={heatmap?.intensity?.[rowIndex] ?? []}
                      counts={heatmap?.matrix?.[rowIndex] ?? []}
                    />
                  ))}
                </div>
              </div>
            </Card>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Duration Chart */}
              <Card className="p-6">
                <h4 className="font-bold text-gray-900 mb-6">
                  Thời lượng học trung bình / phiên (phút)
                </h4>
                <div className="h-64">
                  <Bar data={durationChartData} options={durationChartOptions} />
                </div>
              </Card>

              {/* Device Chart */}
              <Card className="p-6">
                <h4 className="font-bold text-gray-900 mb-6">Thiết bị sử dụng</h4>
                <div className="h-64">
                  <Pie data={deviceChartData} options={deviceChartOptions} />
                </div>
              </Card>
            </div>

            {/* Feature Usage */}
            <Card className="p-6">
              <h4 className="font-bold text-gray-900 mb-6">
                Chức năng được sử dụng nhiều nhất
              </h4>
              {featureItems.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Chưa có dữ liệu hoạt động trong khoảng thời gian này.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {featureItems.map((feature) => {
                    const style = FEATURE_STYLE[feature.id] ?? FALLBACK_FEATURE_STYLE
                    return (
                      <div
                        key={feature.id}
                        className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex flex-col items-center text-center"
                      >
                        <div
                          className={`w-10 h-10 ${style.iconBg} rounded-full flex items-center justify-center mb-3`}
                        >
                          <Icon
                            name={style.icon}
                            className={`${style.iconColor} text-xl`}
                          />
                        </div>
                        <span className="text-sm font-bold text-gray-700">
                          {feature.name}
                        </span>
                        <span className="text-2xl font-bold text-gray-900 mt-1">
                          {feature.percent}%
                        </span>
                        <span className="text-xs text-gray-500 mt-1">
                          {feature.count.toLocaleString('vi-VN')} lượt
                        </span>
                        <div className="w-full bg-gray-200 h-1.5 rounded-full mt-3">
                          <div
                            className={`${style.barColor} h-full rounded-full`}
                            style={{ width: `${feature.percent}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  )
}

function HeatmapRow({
  hour,
  cells,
  counts,
}: {
  hour: string
  cells: number[]
  counts: number[]
}) {
  const normalized =
    cells.length === 7 ? cells : Array.from({ length: 7 }, (_, i) => cells[i] ?? 0)

  return (
    <>
      <div className="text-[10px] text-gray-500 flex items-center">{hour}</div>
      {normalized.map((intensity, colIndex) => {
        const bgClass = INTENSITY_CLASS[intensity] ?? INTENSITY_CLASS[0]
        const count = counts[colIndex] ?? 0
        return (
          <div
            key={`cell-${hour}-${colIndex}`}
            className={`h-6 ${bgClass} rounded-sm`}
            title={`${count.toLocaleString('vi-VN')} lượt`}
          ></div>
        )
      })}
    </>
  )
}
