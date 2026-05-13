import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import AdminLayout from '@/components/ui/admin/AdminLayout'
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

// Register Chart.js components
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
  Filler
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

// Icon wrapper using Font Awesome to match project style
const Icon = ({ name, className = '' }: { name: string; className?: string }) => (
  <i className={`fas ${name} ${className}`}></i>
)

export default function OverviewDashBoardCertificate() {
  const { t } = useTranslation(['admin', 'common'])

  // KPI data
  const kpiData = [
    {
      title: 'Tổng sinh viên',
      value: '12,480',
      change: '+12%',
      trend: 'up',
      icon: 'fa-users',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Đang hoạt động',
      value: '3,240',
      change: '+5.2%',
      trend: 'up',
      icon: 'fa-bolt',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      title: 'Tỷ lệ quay lại',
      value: '78.4%',
      change: '-1.2%',
      trend: 'down',
      icon: 'fa-sync-alt',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
    {
      title: 'Tỷ lệ hoàn thành',
      value: '89.1%',
      change: '+3.8%',
      trend: 'up',
      icon: 'fa-check-circle',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
    },
  ]

  // Traffic Chart data (Line chart)
  const trafficChartData = useMemo(
    () => ({
      labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
      datasets: [
        {
          label: 'Lượt truy cập',
          data: [4200, 5800, 4900, 7200, 6100, 8400, 7900],
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
    }),
    []
  )

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
    []
  )

  // Distribution Chart data (Doughnut chart)
  const distributionChartData = useMemo(
    () => ({
      labels: ['IELTS', 'TOEIC', 'Giao tiếp', 'Khác'],
      datasets: [
        {
          data: [45, 30, 15, 10],
          backgroundColor: ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6'],
          borderWidth: 0,
          hoverOffset: 4,
        },
      ],
    }),
    []
  )

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
    []
  )

  // Retention Chart data (Bar chart - Stacked)
  const retentionChartData = useMemo(
    () => ({
      labels: ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'],
      datasets: [
        {
          label: 'Mới',
          data: [450, 520, 480, 610],
          backgroundColor: '#2563eb',
          borderRadius: 4,
        },
        {
          label: 'Quay lại',
          data: [1200, 1350, 1420, 1580],
          backgroundColor: '#94a3b8',
          borderRadius: 4,
        },
      ],
    }),
    []
  )

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
    []
  )

  // Recent activities data
  const recentActivities = [
    {
      id: 1,
      text: '150 SV mới đăng ký IELTS',
      time: '2 giờ trước',
      color: 'bg-blue-500',
    },
    {
      id: 2,
      text: '85% hoàn thành Module 4 TOEIC',
      time: '5 giờ trước',
      color: 'bg-green-500',
    },
    {
      id: 3,
      text: 'Cảnh báo: 12 SV vắng mặt 7 ngày',
      time: '1 ngày trước',
      color: 'bg-orange-500',
    },
  ]

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Page Title */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Executive Overview</h1>
          <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-md border border-gray-200">
            <Icon name="fa-calendar" className="text-gray-500 text-sm" />
            <span className="text-sm font-medium text-gray-700">Tháng này</span>
            <Icon name="fa-chevron-down" className="text-xs text-gray-500" />
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpiData.map((kpi, index) => (
            <Card key={index} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2 ${kpi.iconBg} rounded-lg`}>
                  <Icon name={kpi.icon} className={`${kpi.iconColor} text-xl`} />
                </div>
                <span
                  className={`text-xs font-bold px-2 py-1 rounded ${
                    kpi.trend === 'up'
                      ? 'text-green-600 bg-green-50'
                      : 'text-red-600 bg-red-50'
                  }`}
                >
                  {kpi.change}
                </span>
              </div>
              <p className="text-sm text-gray-500 font-medium">{kpi.title}</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</h3>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Traffic Chart */}
          <Card className="lg:col-span-2 p-6">
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-bold text-gray-900">Lượt truy cập theo thời gian</h4>
              <select className="text-xs bg-gray-100 border-none rounded p-1 text-gray-700">
                <option>7 ngày qua</option>
                <option>30 ngày qua</option>
              </select>
            </div>
            <div className="h-64">
              <Line data={trafficChartData} options={trafficChartOptions} />
            </div>
          </Card>

          {/* Distribution Chart */}
          <Card className="p-6">
            <h4 className="font-bold text-gray-900 mb-6">Phân bổ theo chứng chỉ</h4>
            <div className="h-64">
              <Doughnut data={distributionChartData} options={distributionChartOptions} />
            </div>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Retention Chart */}
          <Card className="p-6">
            <h4 className="font-bold text-gray-900 mb-6">Sinh viên mới vs Quay lại</h4>
            <div className="h-64">
              <Bar data={retentionChartData} options={retentionChartOptions} />
            </div>
          </Card>

          {/* Recent Activities */}
          <Card className="p-6">
            <h4 className="font-bold text-gray-900 mb-6">Hoạt động gần đây</h4>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${activity.color}`}></div>
                    <span className="text-sm font-medium text-gray-700">{activity.text}</span>
                  </div>
                  <span className="text-xs text-gray-500">{activity.time}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
