import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import AdminLayout from '@/components/ui/admin/AdminLayout'
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

// Icon wrapper using Font Awesome
const Icon = ({ name, className = '' }: { name: string; className?: string }) => (
  <i className={`fas ${name} ${className}`}></i>
)

// Heatmap data
const heatmapData = [
  { hour: '08:00', values: ['bg-blue-200', 'bg-blue-400', 'bg-blue-200', 'bg-blue-400', 'bg-blue-200', 'bg-blue-100', 'bg-blue-50'] },
  { hour: '14:00', values: ['bg-blue-400', 'bg-blue-600', 'bg-blue-400', 'bg-blue-600', 'bg-blue-400', 'bg-blue-200', 'bg-blue-100'] },
  { hour: '20:00', values: ['bg-blue-600', 'bg-blue-600', 'bg-blue-600', 'bg-blue-600', 'bg-blue-600', 'bg-blue-400', 'bg-blue-400'] },
]

const weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

// Feature usage data
const featureUsageData = [
  {
    id: 1,
    name: 'Làm bài Test',
    percent: 42,
    icon: 'fa-file-alt',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    barColor: 'bg-blue-600',
  },
  {
    id: 2,
    name: 'Xem Video',
    percent: 28,
    icon: 'fa-play-circle',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    barColor: 'bg-green-500',
  },
  {
    id: 3,
    name: 'Làm bài tập',
    percent: 18,
    icon: 'fa-book-open',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    barColor: 'bg-purple-500',
  },
  {
    id: 4,
    name: 'Xem chứng chỉ',
    percent: 12,
    icon: 'fa-award',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    barColor: 'bg-orange-500',
  },
]

export default function UsageBehaviorDashboard() {
  const { t } = useTranslation(['admin', 'common'])

  // Duration Chart data (Bar chart)
  const durationChartData = useMemo(
    () => ({
      labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
      datasets: [
        {
          label: 'Phút',
          data: [45, 52, 48, 65, 58, 82, 75],
          backgroundColor: '#2563eb',
          borderRadius: 6,
        },
      ],
    }),
    []
  )

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
    []
  )

  // Device Chart data (Pie chart)
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
    []
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
    []
  )

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Page Title */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Hành vi sử dụng & Khung giờ cao điểm</h1>
          <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-md border border-gray-200">
            <Icon name="fa-calendar" className="text-gray-500 text-sm" />
            <span className="text-sm font-medium text-gray-700">7 ngày qua</span>
            <Icon name="fa-chevron-down" className="text-xs text-gray-500" />
          </div>
        </div>

        {/* Heatmap */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-bold text-gray-900">Mật độ truy cập theo giờ & ngày</h4>
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
              {/* Empty cell for corner */}
              <div className="h-6"></div>
              {/* Weekday headers */}
              {weekDays.map((day) => (
                <div key={day} className="text-center text-[10px] text-gray-500 font-medium uppercase">
                  {day}
                </div>
              ))}
              {/* Heatmap rows */}
              {heatmapData.map((row, rowIndex) => (
                <>
                  <div key={`label-${rowIndex}`} className="text-[10px] text-gray-500 flex items-center">
                    {row.hour}
                  </div>
                  {row.values.map((bgClass, colIndex) => (
                    <div key={`cell-${rowIndex}-${colIndex}`} className={`h-6 ${bgClass} rounded-sm`}></div>
                  ))}
                </>
              ))}
            </div>
          </div>
        </Card>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Duration Chart */}
          <Card className="p-6">
            <h4 className="font-bold text-gray-900 mb-6">Thời lượng học trung bình / phiên (phút)</h4>
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
          <h4 className="font-bold text-gray-900 mb-6">Chức năng được sử dụng nhiều nhất</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {featureUsageData.map((feature) => (
              <div
                key={feature.id}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex flex-col items-center text-center"
              >
                <div className={`w-10 h-10 ${feature.iconBg} rounded-full flex items-center justify-center mb-3`}>
                  <Icon name={feature.icon} className={`${feature.iconColor} text-xl`} />
                </div>
                <span className="text-sm font-bold text-gray-700">{feature.name}</span>
                <span className="text-2xl font-bold text-gray-900 mt-1">{feature.percent}%</span>
                <div className="w-full bg-gray-200 h-1.5 rounded-full mt-3">
                  <div className={`${feature.barColor} h-full rounded-full`} style={{ width: `${feature.percent}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
