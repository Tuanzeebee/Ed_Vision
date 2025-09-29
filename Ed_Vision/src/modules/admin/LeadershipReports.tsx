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

export default function LeadershipReports() {
  // Chart data configurations
  const trendData = {
    labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
    datasets: [
      {
        label: 'Số lượng dự đoán',
        data: [120, 135, 148, 162, 175, 188, 195, 210, 225, 240, 255, 270],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        yAxisID: 'y'
      },
      {
        label: 'Tỷ lệ chính xác (%)',
        data: [65, 68, 70, 73, 75, 78, 80, 82, 85, 87, 89, 91],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        borderDash: [5, 5],
        yAxisID: 'y1'
      }
    ]
  };

  const facultyData = {
    labels: ['CNTT', 'Kinh tế', 'Ngoại ngữ', 'Y-Dược', 'Kỹ thuật'],
    datasets: [{
      data: [35, 25, 20, 12, 8],
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

  const dataDistributionData = {
    labels: ['Điểm số', 'Hoạt động học tập', 'Thông tin sinh viên', 'Khảo sát đánh giá', 'Báo cáo hệ thống'],
    datasets: [{
      label: 'Số lượng bản ghi (nghìn)',
      data: [450, 320, 280, 150, 180],
      backgroundColor: [
        '#3b82f6',
        '#10b981',
        '#f59e0b',
        '#8b5cf6',
        '#ef4444'
      ],
      borderRadius: 6
    }]
  };



  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Số lượng dự đoán'
        },
        min: 100,
        max: 300
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Tỷ lệ chính xác (%)'
        },
        grid: {
          drawOnChartArea: false
        },
        min: 60,
        max: 95
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: { top: 0, right: 0, bottom: 0, left: 0 }
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { padding: 10 }
      }
    }
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Số lượng (nghìn bản ghi)'
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
            <h1 className="text-3xl font-bold text-gray-900">Báo cáo Lãnh đạo</h1>
          </div>
          <p className="text-gray-600">Hiển thị báo cáo dữ liệu, hiệu suất và phân tích nâng cao</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Data */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Tổng số dữ liệu</p>
                  <p className="text-3xl font-bold text-blue-900 mt-2">1,254,897</p>
                  <div className="flex items-center mt-2">
                    <span className="text-green-500 text-sm mr-1">↗</span>
                    <span className="text-green-600 text-sm font-medium">+12.5%</span>
                    <span className="text-blue-600 text-sm ml-1">so với kỳ trước</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white text-2xl">💾</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reports Created */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Báo cáo đã tạo</p>
                  <p className="text-3xl font-bold text-green-900 mt-2">487</p>
                  <div className="flex items-center mt-2">
                    <span className="text-green-500 text-sm mr-1">↗</span>
                    <span className="text-green-600 text-sm font-medium">+8.3%</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white text-2xl">📄</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prediction Accuracy */}
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Tỷ lệ dự đoán chính xác</p>
                  <p className="text-3xl font-bold text-purple-900 mt-2">92.7%</p>
                  <div className="flex items-center mt-2">
                    <span className="text-green-500 text-sm mr-1">↗</span>
                    <span className="text-green-600 text-sm font-medium">+2.1%</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white text-2xl">🎯</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Response Time */}
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700">Thời gian phản hồi TB</p>
                  <p className="text-3xl font-bold text-orange-900 mt-2">1.8s</p>
                  <div className="flex items-center mt-2">
                    <span className="text-orange-500 text-sm mr-1">↗</span>
                    <span className="text-orange-600 text-sm font-medium">+0.3s</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white text-2xl">⏰</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Create New Report Section */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Tạo báo cáo mới</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Loại báo cáo</label>
                <select className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs text-gray-800 focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                  <option>Báo cáo điểm số</option>
                  <option>Báo cáo hiệu suất</option>
                  <option>Báo cáo dự đoán</option>
                  <option>Báo cáo tổng hợp</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Phạm vi dữ liệu</label>
                <select className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs text-gray-800 focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                  <option>Toàn trường</option>
                  <option>Theo khoa</option>
                  <option>Theo lớp</option>
                  <option>Theo môn học</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Khoảng thời gian</label>
                <select className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs text-gray-800 focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                  <option>Học kỳ hiện tại</option>
                  <option>Năm học hiện tại</option>
                  <option>6 tháng gần đây</option>
                  <option>Tùy chỉnh</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Bộ lọc bổ sung</label>
                <input 
                  type="text" 
                  placeholder="Nhập từ khóa lọc..." 
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs text-gray-800 placeholder-gray-500 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Định dạng xuất</label>
                <select className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs text-gray-800 focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                  <option>PDF</option>
                  <option>Excel</option>
                  <option>Word</option>
                  <option>Thuyết trình</option>
                </select>
              </div>
              <div className="flex items-end space-x-2">
                <button className="bg-gray-200 text-gray-700 px-2 py-1 text-xs rounded-md hover:bg-gray-300 transition-colors cursor-pointer">
                  💾 Lưu cấu hình
                </button>
                <button className="bg-blue-600 text-white px-2 py-1 text-xs rounded-md hover:bg-blue-700 transition-colors cursor-pointer">
                  ➕ Tạo báo cáo
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports List */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Danh sách báo cáo đã tạo</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên báo cáo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người tạo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phạm vi</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Báo cáo điểm cuối kỳ HK1-2024</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Điểm số</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Admin</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">15/12/2024</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Toàn trường</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✅ Hoàn thành
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900 cursor-pointer" title="Xem">
                          <i className="fas fa-eye"></i>
                        </button>
                        <button className="text-green-600 hover:text-green-900 cursor-pointer" title="Tải xuống">
                          <i className="fas fa-download"></i>
                        </button>
                        <button className="text-red-600 hover:text-red-900 cursor-pointer" title="Xóa">
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Phân tích hiệu suất giảng viên</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Hiệu suất</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Admin</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">14/12/2024</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Khoa CNTT</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        ⏱️ Đang xử lý
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900 cursor-pointer" title="Xem">
                          <i className="fas fa-eye"></i>
                        </button>
                        <button className="text-orange-600 hover:text-orange-900 cursor-pointer" title="Tạm dừng">
                          <i className="fas fa-pause"></i>
                        </button>
                        <button className="text-red-600 hover:text-red-900 cursor-pointer" title="Xóa">
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Dự đoán kết quả học tập</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Dự đoán</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Admin</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">13/12/2024</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Lớp 12A</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        ❌ Thất bại
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900 cursor-pointer" title="Xem">
                          <i className="fas fa-eye"></i>
                        </button>
                        <button className="text-green-600 hover:text-green-900 cursor-pointer" title="Thử lại">
                          <i className="fas fa-redo"></i>
                        </button>
                        <button className="text-red-600 hover:text-red-900 cursor-pointer" title="Xóa">
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Trend Chart */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Xu hướng dữ liệu theo thời gian</h3>
              <div className="h-80 w-full">
                <Line data={trendData} options={trendOptions} />
              </div>
            </CardContent>
          </Card>

          {/* Faculty Distribution Chart */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Phân bố theo khoa</h3>
              <div className="h-64 w-full mt-2">
                <Doughnut data={facultyData} options={doughnutOptions} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Distribution Chart */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Phân bố dữ liệu theo loại</h3>
            <div className="h-80 w-full">
              <Bar data={dataDistributionData} options={barOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Prediction Accuracy */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-green-800">Độ chính xác dự đoán</h3>
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center shadow-md">
                  <span className="text-white">📈</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-700 mb-2">+5.2%</p>
                <p className="text-sm text-green-600">so với tháng trước</p>
              </div>
            </CardContent>
          </Card>

          {/* System Usage */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-blue-800">Mức độ sử dụng hệ thống</h3>
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center shadow-md">
                  <span className="text-white">👥</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-700 mb-2">+12.8%</p>
                <p className="text-sm text-blue-600">tăng trưởng</p>
              </div>
            </CardContent>
          </Card>

          {/* Top Factors */}
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-purple-800">Yếu tố ảnh hưởng Top 3</h3>
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center shadow-md">
                  <span className="text-white">⭐</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-purple-700">Chuyên cần</span>
                  <span className="text-sm font-semibold text-purple-900">85%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-purple-700">Bài tập</span>
                  <span className="text-sm font-semibold text-purple-900">72%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-purple-700">Thi giữa kỳ</span>
                  <span className="text-sm font-semibold text-purple-900">68%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recommended Reports */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Báo cáo được đề xuất</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 cursor-pointer">
                <div className="text-center">
                  <div className="text-3xl mb-3">📊</div>
                  <h3 className="font-semibold mb-2">Dự đoán điểm cuối kỳ</h3>
                  <p className="text-sm opacity-90 mb-4">Phân tích và dự đoán kết quả học tập</p>
                  <button className="bg-white text-blue-600 px-4 py-1.5 text-xs rounded-md transition-colors cursor-pointer font-semibold hover:bg-gray-100">
                    ⚡ Tạo nhanh
                  </button>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105 cursor-pointer">
                <div className="text-center">
                  <div className="text-3xl mb-3">👨‍🏫</div>
                  <h3 className="font-semibold mb-2">Phân tích hiệu suất giảng viên</h3>
                  <p className="text-sm opacity-90 mb-4">Đánh giá chất lượng giảng dạy</p>
                  <button className="bg-white text-green-600 px-4 py-1.5 text-xs rounded-md transition-colors cursor-pointer font-semibold hover:bg-gray-100">
                    ⚡ Tạo nhanh
                  </button>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 cursor-pointer">
                <div className="text-center">
                  <div className="text-3xl mb-3">⚖️</div>
                  <h3 className="font-semibold mb-2">So sánh kết quả học tập</h3>
                  <p className="text-sm opacity-90 mb-4">Phân tích xu hướng và so sánh</p>
                  <button className="bg-white text-purple-600 px-4 py-1.5 text-xs rounded-md transition-colors cursor-pointer font-semibold hover:bg-gray-100">
                    ⚡ Tạo nhanh
                  </button>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 transform hover:scale-105 cursor-pointer">
                <div className="text-center">
                  <div className="text-3xl mb-3">⚠️</div>
                  <h3 className="font-semibold mb-2">Cảnh báo học vụ</h3>
                  <p className="text-sm opacity-90 mb-4">Phát hiện rủi ro và cảnh báo sớm</p>
                  <button className="bg-white text-orange-600 px-4 py-1.5 text-xs rounded-md transition-colors cursor-pointer font-semibold hover:bg-gray-100">
                    ⚡ Tạo nhanh
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}