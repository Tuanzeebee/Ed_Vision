import { Card, CardContent } from "@/components/ui/card";
import AdminLayout from "../../components/ui/admin/AdminLayout";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
  Filler
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
  Filler
);

export default function GeneralStatistics() {
  // Chart data configurations
  const usersTimeData = {
    labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'],
    datasets: [
      {
        label: 'Sinh viên',
        data: [1650, 1720, 1780, 1820, 1840, 1850],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      },
      {
        label: 'Giảng viên',
        data: [280, 290, 305, 315, 318, 320],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4
      },
      {
        label: 'Phụ huynh',
        data: [180, 200, 220, 235, 240, 245],
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.4
      },
      {
        label: 'Quản trị viên',
        data: [20, 22, 23, 24, 25, 25],
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.4
      },
      {
        label: 'Ban lãnh đạo',
        data: [12, 14, 15, 15, 16, 16],
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4
      }
    ]
  };

  const usersDistributionData = {
    labels: ['Sinh viên', 'Giảng viên', 'Phụ huynh', 'Quản trị viên', 'Ban lãnh đạo'],
    datasets: [{
      data: [1850, 320, 245, 25, 16],
      backgroundColor: [
        '#3b82f6',
        '#10b981',
        '#f59e0b',
        '#8b5cf6',
        '#ef4444'
      ],
      borderWidth: 2,
      borderColor: '#ffffff'
    }]
  };

  const performanceData = {
    labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
    datasets: [
      {
        label: 'Thời gian phản hồi (ms)',
        data: [650, 580, 720, 850, 920, 780, 650],
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.3)',
        fill: true,
        yAxisID: 'y',
        tension: 0.4,
        borderWidth: 3
      },
      {
        label: 'CPU (%)',
        data: [45, 38, 52, 68, 75, 58, 45],
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.3)',
        fill: true,
        yAxisID: 'y1',
        tension: 0.4,
        borderWidth: 3
      },
      {
        label: 'Bộ nhớ (%)',
        data: [62, 58, 65, 72, 78, 68, 62],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.3)',
        fill: true,
        yAxisID: 'y1',
        tension: 0.4,
        borderWidth: 3
      }
    ]
  };

  const errorTypesData = {
    labels: ['Kết nối DB', 'Xác thực', 'Tải trang', 'API', 'Khác'],
    datasets: [{
      label: 'Số lỗi',
      data: [5, 4, 3, 2, 1],
      backgroundColor: [
        '#ef4444',
        '#f59e0b',
        '#eab308',
        '#84cc16',
        '#10b981'
      ],
      borderRadius: 6
    }]
  };

  const dataGrowthData = {
    labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'],
    datasets: [{
      label: 'Dung lượng dữ liệu (GB)',
      data: [65, 72, 78, 82, 85, 86.5],
      backgroundColor: '#3b82f6',
      borderColor: '#2563eb',
      borderWidth: 1,
      borderRadius: 6
    }]
  };

  const dataDistributionData = {
    labels: ['Dữ liệu học tập', 'Tài liệu', 'Hình ảnh', 'Video'],
    datasets: [{
      data: [45.2, 18.7, 12.8, 9.8],
      backgroundColor: [
        '#3b82f6',
        '#10b981',
        '#f59e0b',
        '#8b5cf6'
      ],
      borderWidth: 2,
      borderColor: '#ffffff'
    }]
  };

  const deviceData = {
    labels: ['Desktop', 'Mobile', 'Tablet'],
    datasets: [{
      data: [65, 28, 7],
      backgroundColor: [
        '#3b82f6',
        '#10b981',
        '#f59e0b'
      ],
      borderWidth: 2,
      borderColor: '#ffffff'
    }]
  };

  const browserData = {
    labels: ['Chrome', 'Safari', 'Edge', 'Firefox', 'Opera', 'Khác'],
    datasets: [{
      data: [45, 25, 15, 8, 4, 3],
      backgroundColor: [
        '#3b82f6',
        '#10b981',
        '#f59e0b',
        '#8b5cf6',
        '#ef4444',
        '#6b7280'
      ],
      borderWidth: 2,
      borderColor: '#ffffff'
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const
      }
    }
  };

  const performanceOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false
    },
    plugins: {
      legend: {
        position: 'top' as const
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Thời gian'
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Thời gian phản hồi (ms)'
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Tỷ lệ sử dụng (%)'
        },
        grid: {
          drawOnChartArea: false
        }
      }
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 bg-gray-50 overflow-y-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <span className="text-blue-600 text-2xl mr-3">📊</span>
            <h1 className="text-3xl font-bold text-gray-900">Thống kê Tổng quát</h1>
          </div>
          <p className="text-gray-600">Tổng quan về hoạt động và hiệu suất hệ thống quản lý giáo dục</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Active Users */}
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-100">Tổng số người dùng hoạt động</p>
                  <p className="text-3xl font-bold text-white mt-2">2,456</p>
                  <div className="flex items-center mt-2">
                    <i className="fas fa-arrow-up text-blue-200 text-sm mr-1"></i>
                    <span className="text-blue-200 text-sm font-medium">+5.2%</span>
                    <span className="text-blue-200 text-sm ml-1">so với kỳ trước</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <span className="text-white text-2xl">👥</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Rate */}
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-100">Tỷ lệ hoạt động trung bình</p>
                  <p className="text-3xl font-bold text-white mt-2">98.7%</p>
                  <div className="flex items-center mt-2">
                    <i className="fas fa-arrow-up text-green-200 text-sm mr-1"></i>
                    <span className="text-green-200 text-sm font-medium">+0.3%</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <span className="text-white text-2xl">📈</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Response Time */}
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-100">Thời gian phản hồi trung bình</p>
                  <p className="text-3xl font-bold text-white mt-2">0.8s</p>
                  <div className="flex items-center mt-2">
                    <i className="fas fa-arrow-up text-orange-200 text-sm mr-1"></i>
                    <span className="text-orange-200 text-sm font-medium">+0.5s</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <span className="text-white text-2xl">⏰</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Errors */}
          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-100">Số lỗi hệ thống</p>
                  <p className="text-3xl font-bold text-white mt-2">12</p>
                  <div className="flex items-center mt-2">
                    <i className="fas fa-arrow-down text-red-200 text-sm mr-1"></i>
                    <span className="text-red-200 text-sm font-medium">Giảm 25%</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <span className="text-white text-2xl">⚠️</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Người dùng</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Users Over Time Chart */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Số lượng người dùng theo thời gian</h3>
                <div className="h-80 w-full">
                  <Line data={usersTimeData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>

            {/* Users Distribution Chart */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Phân bố người dùng theo vai trò</h3>
                <div className="h-80 w-full">
                  <Doughnut data={usersDistributionData} options={doughnutOptions} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Users Detail Table */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Chi tiết người dùng theo vai trò</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vai trò</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số lượng</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tỉ lệ</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tỉ lệ hoạt động</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian sử dụng TB</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Sinh viên</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">1,850</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">75.3%</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">98.5%</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">4.2h</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Giảng viên</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">320</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">13.0%</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">99.2%</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">6.8h</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Phụ huynh</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">245</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">10.0%</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">85.3%</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">1.5h</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Quản trị viên</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">25</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">1.0%</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">100%</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">8.5h</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Ban lãnh đạo</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">16</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">0.7%</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">95.8%</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">3.2h</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Performance Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Hiệu suất hệ thống</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Performance Chart */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Hiệu suất theo thời gian</h3>
                <div className="h-80 w-full">
                  <Line data={performanceData} options={performanceOptions} />
                </div>
              </CardContent>
            </Card>

            {/* Error Types Chart */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Số lỗi theo loại</h3>
                <div className="h-80 w-full">
                  <Bar data={errorTypesData} options={{
                    ...chartOptions,
                    plugins: {
                      legend: {
                        display: false
                      }
                    }
                  }} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Errors Detail Table */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Chi tiết lỗi hệ thống</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại lỗi</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số lượng</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mức độ</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian gần nhất</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Kết nối cơ sở dữ liệu</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">5</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Cao</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">2 giờ trước</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Xác thực người dùng</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">4</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">Trung bình</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">5 giờ trước</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Tải trang chậm</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">3</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Thấp</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">1 ngày trước</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Statistics Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Thống kê dữ liệu</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Data Growth Chart */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Tăng trưởng dữ liệu theo thời gian (GB)</h3>
                <div className="h-80 w-full">
                  <Bar data={dataGrowthData} options={{
                    ...chartOptions,
                    plugins: {
                      legend: {
                        display: false
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'Dung lượng (GB)'
                        }
                      }
                    }
                  }} />
                </div>
              </CardContent>
            </Card>

            {/* Data Distribution Chart */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Phân bố dữ liệu theo loại</h3>
                <div className="h-80 w-full">
                  <Doughnut data={dataDistributionData} options={doughnutOptions} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Data Detail Table */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Chi tiết dữ liệu theo loại</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại dữ liệu</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dung lượng</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tỉ lệ</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tốc độ tăng trưởng</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cập nhật gần nhất</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Dữ liệu học tập</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">45.2 GB</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">52.3%</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">+12.5%</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">30 phút trước</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Tài liệu</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">18.7 GB</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">21.6%</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">+8.3%</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">2 giờ trước</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Hình ảnh</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">12.8 GB</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">14.8%</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">+5.1%</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">1 ngày trước</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Video</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">9.8 GB</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">11.3%</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">+15.2%</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">4 giờ trước</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Device & Browser Statistics Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Thống kê thiết bị & trình duyệt</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Device Distribution Chart */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Phân bố theo thiết bị</h3>
                <div className="h-80 w-full">
                  <Doughnut data={deviceData} options={doughnutOptions} />
                </div>
              </CardContent>
            </Card>

            {/* Browser Distribution Chart */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Phân bố theo trình duyệt</h3>
                <div className="h-80 w-full">
                  <Doughnut data={browserData} options={doughnutOptions} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}