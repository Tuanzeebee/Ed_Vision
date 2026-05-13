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

// Module impact data
const moduleImpactData = [
  {
    id: 1,
    name: 'Module 2: Ngữ pháp ứng dụng',
    description: 'Cải thiện trung bình +0.8 band',
    icon: 'fa-chart-line',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    badge: 'Top 1',
    badgeColor: 'text-green-600',
  },
  {
    id: 2,
    name: 'Module 3: Luyện đề Mock Test',
    description: 'Cải thiện trung bình +0.5 band',
    icon: 'fa-chart-line',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    badge: 'Top 2',
    badgeColor: 'text-blue-600',
  },
  {
    id: 3,
    name: 'Module 4: Writing Workshop',
    description: 'Tỷ lệ bỏ dở cao nhất (15%)',
    icon: 'fa-exclamation-triangle',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    badge: 'Cần tối ưu',
    badgeColor: 'text-orange-600',
  },
]

// Group effectiveness data
const groupEffectivenessData = [
  {
    id: 1,
    group: 'Năm 3 - Khoa CNTT',
    count: 450,
    improvement: '+1.2 band',
    successRate: '85%',
    rating: 'Rất tốt',
    ratingColor: 'text-green-600',
  },
  {
    id: 2,
    group: 'Năm 2 - Khoa Kinh tế',
    count: 320,
    improvement: '+0.8 band',
    successRate: '78%',
    rating: 'Tốt',
    ratingColor: 'text-blue-600',
  },
  {
    id: 3,
    group: 'Năm 4 - Khoa Ngôn ngữ',
    count: 180,
    improvement: '+1.5 band',
    successRate: '92%',
    rating: 'Xuất sắc',
    ratingColor: 'text-green-600',
  },
]

export default function ProgramEffectivenessDashboard() {
  const { t } = useTranslation(['admin', 'common'])

  // Effectiveness Comparison Chart data (Bar chart)
  const effectivenessChartData = useMemo(
    () => ({
      labels: ['Listening', 'Reading', 'Writing', 'Speaking'],
      datasets: [
        {
          label: 'Đầu vào',
          data: [4.5, 5.0, 4.0, 4.5],
          backgroundColor: 'rgba(37, 99, 235, 0.4)',
          borderRadius: 4,
        },
        {
          label: 'Cuối khóa',
          data: [6.5, 7.0, 6.0, 6.5],
          backgroundColor: '#2563eb',
          borderRadius: 4,
        },
      ],
    }),
    []
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
          max: 9,
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

  // Achievement Doughnut Chart data
  const achievementChartData = useMemo(
    () => ({
      datasets: [
        {
          data: [82, 18],
          backgroundColor: ['#2563eb', '#f1f5f9'],
          borderWidth: 0,
          cutout: '80%',
        },
      ],
    }),
    []
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
    []
  )

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Hiệu quả chương trình học</h1>
            <p className="text-sm text-gray-500 mt-1">Đánh giá hiệu quả đào tạo và tiến bộ sinh viên</p>
          </div>
          <button className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            <Icon name="fa-download" className="text-gray-500" />
            Export Report
          </button>
        </div>

        {/* Score Comparison Chart */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-bold text-gray-900">So sánh Điểm Đầu vào vs Điểm Cuối khóa</h4>
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
            <Bar data={effectivenessChartData} options={effectivenessChartOptions} />
          </div>
        </Card>

        {/* Charts & Module Impact Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Standards Achievement */}
          <Card className="p-6">
            <h4 className="font-bold text-gray-900 mb-6">% Sinh viên đạt chuẩn đầu ra</h4>
            <div className="flex items-center justify-center p-4">
              <div className="relative w-44 h-44">
                <Doughnut data={achievementChartData} options={achievementChartOptions} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-gray-900">82%</span>
                  <span className="text-xs text-gray-500 uppercase font-semibold mt-1">Thành công</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="p-4 bg-gray-50 rounded-lg text-center border border-gray-100">
                <p className="text-xs text-gray-500 mb-1">IELTS 6.5+</p>
                <p className="text-xl font-bold text-gray-900">75%</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg text-center border border-gray-100">
                <p className="text-xs text-gray-500 mb-1">TOEIC 750+</p>
                <p className="text-xl font-bold text-gray-900">88%</p>
              </div>
            </div>
          </Card>

          {/* Module Impact */}
          <Card className="p-6">
            <h4 className="font-bold text-gray-900 mb-6">Mức độ cải thiện theo Module</h4>
            <div className="space-y-4">
              {moduleImpactData.map((module) => (
                <div key={module.id} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className={`w-12 h-12 ${module.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <Icon name={module.icon} className={`${module.iconColor} text-xl`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{module.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{module.description}</p>
                  </div>
                  <span className={`text-xs font-bold ${module.badgeColor} whitespace-nowrap`}>
                    {module.badge}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Group Effectiveness Table */}
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h4 className="font-bold text-gray-900">Hiệu quả theo nhóm sinh viên</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Nhóm (Năm học/Khoa)</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-center">Số lượng SV</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-center">Cải thiện TB</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-center">% Đạt chuẩn</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-center">Đánh giá</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {groupEffectivenessData.map((group) => (
                  <tr key={group.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{group.group}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 text-center">{group.count}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 text-center font-medium">{group.improvement}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-gray-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-600 h-full rounded-full"
                            style={{ width: group.successRate }}
                          ></div>
                        </div>
                        <span className="font-medium">{group.successRate}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-sm font-bold ${group.ratingColor}`}>{group.rating}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
