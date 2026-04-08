import { Card, CardContent } from "@/components/ui/card";
import AdminLayout from "../../components/ui/admin/AdminLayout";
import { useState } from "react";
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
import { Line, Bar } from 'react-chartjs-2';

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

export default function AIPredictionResults() {
  // State for filters
  const [scopeFilter, setScopeFilter] = useState('Toàn trường');
  const [timeFilter, setTimeFilter] = useState('Học kỳ hiện tại (2024-1)');
  
  // Chart data configurations
  const comparisonData = {
    labels: ['CNTT', 'Kinh tế', 'Ngoại ngữ', 'Xây dựng', 'Y Dược', 'Khác'],
    datasets: [
      {
        label: 'Điểm dự đoán',
        data: [7.8, 7.5, 7.9, 7.3, 8.1, 7.2],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1
      },
      {
        label: 'Điểm thực tế',
        data: [7.6, 7.7, 7.8, 7.4, 8.0, 7.3],
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1
      }
    ]
  };

  const factorData = {
    labels: ['Điểm quá trình', 'Điểm danh', 'Thái độ học tập', 'Tham gia ngoại khóa', 'Nộp bài tập', 'Điểm giữa kỳ'],
    datasets: [{
      label: 'Mức độ ảnh hưởng',
      data: [0.9, 0.8, 0.7, 0.6, 0.8, 0.9],
      backgroundColor: [
        'rgba(239, 68, 68, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(234, 179, 8, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(147, 51, 234, 0.8)'
      ],
      borderWidth: 1
    }]
  };

  const trendData = {
    labels: ['2019-1', '2019-2', '2020-1', '2020-2', '2021-1', '2021-2', '2022-1', '2022-2', '2023-1', '2023-2'],
    datasets: [
      {
        label: 'Độ chính xác thực tế',
        data: [85, 87, 88, 89, 90, 91, 91.5, 92, 92.2, 92.5],
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        tension: 0.4,
        fill: true
      },
      {
        label: 'Mục tiêu đặt ra',
        data: [85, 86, 87, 88, 89, 90, 91, 92, 93, 94],
        borderColor: 'rgba(239, 68, 68, 1)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 3,
        borderDash: [5, 5],
        tension: 0.4,
        fill: false
      }
    ]
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
        beginAtZero: false,
        min: 6,
        max: 9
      }
    }
  };

  const factorOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        max: 1
      }
    }
  };

  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        min: 80,
        max: 100
      }
    }
  };

  // Heatmap data theo ảnh
  const factors = ['Điểm quá trình', 'Điểm danh', 'Thái độ học tập', 'Ngoại khóa', 'Nộp bài tập', 'Điểm giữa kỳ'];
  const departments = ['CNTT', 'KT', 'NN', 'XD', 'YD', 'Khác'];
  
  const heatmapMatrix = [
    [0.9, 0.8, 0.9, 0.7, 0.9, 0.7], // Điểm quá trình
    [0.7, 0.6, 0.7, 0.8, 0.7, 0.6], // Điểm danh
    [0.8, 0.9, 0.8, 0.7, 0.8, 0.7], // Thái độ học tập
    [0.5, 0.4, 0.6, 0.3, 0.4, 0.3], // Ngoại khóa
    [0.9, 0.7, 0.8, 0.8, 0.7, 0.7], // Nộp bài tập
    [1.0, 0.9, 1.0, 0.9, 1.0, 0.9]  // Điểm giữa kỳ
  ];
  
  const getHeatmapColor = (value: number) => {
    if (value >= 0.8) return 'bg-red-500';
    if (value >= 0.6) return 'bg-orange-400';
    if (value >= 0.4) return 'bg-yellow-400';
    if (value >= 0.2) return 'bg-green-400';
    return 'bg-green-300';
  };

  return (
    <AdminLayout>
      <div className="p-6 bg-gray-50 overflow-y-auto">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center mb-4">
                <span className="text-blue-600 text-2xl mr-3">🤖</span>
                <h1 className="text-3xl font-bold text-gray-900">Kết quả Dự đoán AI</h1>
              </div>
              <p className="text-gray-600">Kết quả dự đoán từ AI - Phân tích và đánh giá hiệu suất mô hình học máy</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg font-medium text-xs transition-colors flex items-center cursor-pointer">
                ➕ Tạo dự đoán mới
              </button>
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg font-medium text-xs transition-colors flex items-center cursor-pointer">
                ⬇️ Xuất báo cáo
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">Phạm vi</label>
                <select 
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs text-gray-800 bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  value={scopeFilter}
                  onChange={(e) => setScopeFilter(e.target.value)}
                >
                  <option>Toàn trường</option>
                  <option>Khoa CNTT</option>
                  <option>Khoa Kinh tế</option>
                  <option>Khoa Ngoại ngữ</option>
                  <option>Khoa Xây dựng</option>
                  <option>Khoa Y Dược</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">Thời gian</label>
                <select 
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs text-gray-800 bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                >
                  <option>Học kỳ hiện tại (2024-1)</option>
                  <option>Học kỳ 2023-2</option>
                  <option>Học kỳ 2023-1</option>
                  <option>Học kỳ 2022-2</option>
                </select>
              </div>
            </div>
            
            {/* Current Filter Display */}
            <div className="mt-4 flex items-center gap-2 text-sm">
              <span className="text-gray-600">Đang hiển thị:</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                {scopeFilter} - {timeFilter}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Độ chính xác dự đoán</p>
                  <p className="text-3xl font-bold text-blue-900">92.5%</p>
                  <p className="text-sm text-green-600 flex items-center mt-1">
                    ↗ +1.5% so với kỳ trước
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white text-2xl">🎯</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Điểm trung bình dự đoán</p>
                  <p className="text-3xl font-bold text-green-900">7.6/10</p>
                  <p className="text-sm text-green-600 flex items-center mt-1">
                    ↗ +0.2 điểm
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white text-2xl">📈</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Tỷ lệ SV đạt dự đoán</p>
                  <p className="text-3xl font-bold text-purple-900">83%</p>
                  <p className="text-sm text-green-600 flex items-center mt-1">
                    ↗ +3% so với kỳ trước
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white text-2xl">✅</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700">Tỷ lệ SV cần hỗ trợ</p>
                  <p className="text-3xl font-bold text-red-900">12%</p>
                  <p className="text-sm text-red-600 flex items-center mt-1">
                    ↗ +2% so với kỳ trước
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white text-2xl">⚠️</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comparison Chart */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">So sánh kết quả dự đoán và thực tế</h3>
            <div className="h-96 w-full mb-6">
              <Bar data={comparisonData} options={chartOptions} />
            </div>
            
            {/* Detailed Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">Khoa/Ngành</th>
                    <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">Điểm TB Dự đoán</th>
                    <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">Điểm Thực tế</th>
                    <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">Chênh lệch</th>
                    <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">Tỷ lệ đạt dự đoán</th>
                    <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">Tỷ lệ đạt thực tế</th>
                    <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">% Thay đổi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-3 font-medium text-gray-800">CNTT</td>
                    <td className="border border-gray-200 px-4 py-3 text-center">7.8</td>
                    <td className="border border-gray-200 px-4 py-3 text-center">7.6</td>
                    <td className="border border-gray-200 px-4 py-3 text-center text-red-600">-0.2</td>
                    <td className="border border-gray-200 px-4 py-3 text-center">85%</td>
                    <td className="border border-gray-200 px-4 py-3 text-center">82%</td>
                    <td className="border border-gray-200 px-4 py-3 text-center text-red-600">-3%</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-3 font-medium text-gray-800">Kinh tế</td>
                    <td className="border border-gray-200 px-4 py-3 text-center">7.5</td>
                    <td className="border border-gray-200 px-4 py-3 text-center">7.7</td>
                    <td className="border border-gray-200 px-4 py-3 text-center text-green-600">+0.2</td>
                    <td className="border border-gray-200 px-4 py-3 text-center">80%</td>
                    <td className="border border-gray-200 px-4 py-3 text-center">84%</td>
                    <td className="border border-gray-200 px-4 py-3 text-center text-green-600">+4%</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-3 font-medium text-gray-800">Ngoại ngữ</td>
                    <td className="border border-gray-200 px-4 py-3 text-center">7.9</td>
                    <td className="border border-gray-200 px-4 py-3 text-center">7.8</td>
                    <td className="border border-gray-200 px-4 py-3 text-center text-red-600">-0.1</td>
                    <td className="border border-gray-200 px-4 py-3 text-center">88%</td>
                    <td className="border border-gray-200 px-4 py-3 text-center">86%</td>
                    <td className="border border-gray-200 px-4 py-3 text-center text-red-600">-2%</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-3 font-medium text-gray-800">Xây dựng</td>
                    <td className="border border-gray-200 px-4 py-3 text-center">7.3</td>
                    <td className="border border-gray-200 px-4 py-3 text-center">7.4</td>
                    <td className="border border-gray-200 px-4 py-3 text-center text-green-600">+0.1</td>
                    <td className="border border-gray-200 px-4 py-3 text-center">78%</td>
                    <td className="border border-gray-200 px-4 py-3 text-center">80%</td>
                    <td className="border border-gray-200 px-4 py-3 text-center text-green-600">+2%</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-3 font-medium text-gray-800">Y Dược</td>
                    <td className="border border-gray-200 px-4 py-3 text-center">8.1</td>
                    <td className="border border-gray-200 px-4 py-3 text-center">8.0</td>
                    <td className="border border-gray-200 px-4 py-3 text-center text-red-600">-0.1</td>
                    <td className="border border-gray-200 px-4 py-3 text-center">90%</td>
                    <td className="border border-gray-200 px-4 py-3 text-center">89%</td>
                    <td className="border border-gray-200 px-4 py-3 text-center text-red-600">-1%</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-3 font-medium text-gray-800">Khác</td>
                    <td className="border border-gray-200 px-4 py-3 text-center">7.2</td>
                    <td className="border border-gray-200 px-4 py-3 text-center">7.3</td>
                    <td className="border border-gray-200 px-4 py-3 text-center text-green-600">+0.1</td>
                    <td className="border border-gray-200 px-4 py-3 text-center">75%</td>
                    <td className="border border-gray-200 px-4 py-3 text-center">77%</td>
                    <td className="border border-gray-200 px-4 py-3 text-center text-green-600">+2%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Results Table */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Kết quả dự đoán chi tiết</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">Mã SV</th>
                    <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">Tên</th>
                    <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">Lớp</th>
                    <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">Môn học</th>
                    <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">Điểm dự đoán</th>
                    <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">Điểm thực tế</th>
                    <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">Chênh lệch</th>
                    <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">Xác suất đạt</th>
                    <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">Mức độ rủi ro</th>
                    <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-3 font-medium text-gray-800">28211102954</td>
                    <td className="border border-gray-200 px-4 py-3">Nguyễn Văn An</td>
                    <td className="border border-gray-200 px-4 py-3 text-center">CNTT-K28</td>
                    <td className="border border-gray-200 px-4 py-3 text-center">Cơ sở dữ liệu</td>
                    <td className="border border-gray-200 px-4 py-3 text-center">7.5</td>
                    <td className="border border-gray-200 px-4 py-3 text-center">7.2</td>
                    <td className="border border-gray-200 px-4 py-3 text-center text-red-600">-0.3</td>
                    <td className="border border-gray-200 px-4 py-3 text-center">85%</td>
                    <td className="border border-gray-200 px-4 py-3 text-center">
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">Trung bình</span>
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-center">
                      <div className="flex gap-2 justify-center">
                        <button className="text-blue-600 hover:text-blue-800 cursor-pointer">👁</button>
                        <button className="text-green-600 hover:text-green-800 cursor-pointer">📋</button>
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-3 font-medium text-gray-800">28211102955</td>
                    <td className="border border-gray-200 px-4 py-3">Trần Thị Bình</td>
                    <td className="border border-gray-200 px-4 py-3 text-center">CNTT-K28</td>
                    <td className="border border-gray-200 px-4 py-3 text-center">Lập trình web</td>
                    <td className="border border-gray-200 px-4 py-3 text-center">8.2</td>
                    <td className="border border-gray-200 px-4 py-3 text-center">8.5</td>
                    <td className="border border-gray-200 px-4 py-3 text-center text-green-600">+0.3</td>
                    <td className="border border-gray-200 px-4 py-3 text-center">92%</td>
                    <td className="border border-gray-200 px-4 py-3 text-center">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">Thấp</span>
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-center">
                      <div className="flex gap-2 justify-center">
                        <button className="text-blue-600 hover:text-blue-800 cursor-pointer">👁</button>
                        <button className="text-green-600 hover:text-green-800 cursor-pointer">📋</button>
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-3 font-medium text-gray-800">28211102956</td>
                    <td className="border border-gray-200 px-4 py-3">Lê Văn Cường</td>
                    <td className="border border-gray-200 px-4 py-3 text-center">CNTT-K28</td>
                    <td className="border border-gray-200 px-4 py-3 text-center">Toán rời rạc</td>
                    <td className="border border-gray-200 px-4 py-3 text-center">6.8</td>
                    <td className="border border-gray-200 px-4 py-3 text-center">6.2</td>
                    <td className="border border-gray-200 px-4 py-3 text-center text-red-600">-0.6</td>
                    <td className="border border-gray-200 px-4 py-3 text-center">68%</td>
                    <td className="border border-gray-200 px-4 py-3 text-center">
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">Cao</span>
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-center">
                      <div className="flex gap-2 justify-center">
                        <button className="text-blue-600 hover:text-blue-800 cursor-pointer">👁</button>
                        <button className="text-green-600 hover:text-green-800 cursor-pointer">📋</button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Factor Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Bar Chart */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Phân tích yếu tố ảnh hưởng</h3>
              <div className="h-80 w-full">
                <Bar data={factorData} options={factorOptions} />
              </div>
            </CardContent>
          </Card>

          {/* Heatmap 6x6 */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Heatmap mức độ ảnh hưởng</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="text-left p-2 text-sm font-semibold text-gray-700">Yếu tố</th>
                      {departments.map((dept, index) => (
                        <th key={index} className="text-center p-2 text-sm font-semibold text-gray-700">{dept}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {factors.map((factor, factorIndex) => (
                      <tr key={factorIndex}>
                        <td className="text-left p-2 text-sm font-medium text-gray-800">{factor}</td>
                        {heatmapMatrix[factorIndex].map((value, deptIndex) => (
                          <td key={deptIndex} className="p-1">
                            <div className={`${getHeatmapColor(value)} text-center p-2 rounded text-white font-bold text-sm`}>
                              {value.toFixed(1)}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-gray-600">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-300 rounded"></div>
                    <span>Thấp</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-yellow-400 rounded"></div>
                    <span>Trung bình</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span>Cao</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trend Analysis */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Phân tích xu hướng dự đoán</h3>
            <div className="h-96 w-full">
              <Line data={trendData} options={trendOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Action Recommendations */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Đề xuất hành động</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-l-4 border-red-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-800">Tăng cường hỗ trợ SV có nguy cơ cao</h4>
                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">Ưu tiên cao</span>
                </div>
                <p className="text-gray-600 mb-4">Xác định và hỗ trợ các sinh viên có nguy cơ học tập thấp thông qua các chương trình tư vấn và hỗ trợ học tập.</p>
                <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg font-medium text-xs transition-colors cursor-pointer">
                  Thực hiện ngay
                </button>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-yellow-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-800">Điều chỉnh phương pháp giảng dạy môn Cơ sở dữ liệu</h4>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">Ưu tiên trung bình</span>
                </div>
                <p className="text-gray-600 mb-4">Cải thiện phương pháp giảng dạy và đánh giá để nâng cao hiệu quả học tập của sinh viên.</p>
                <button className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-1.5 rounded-lg font-medium text-xs transition-colors cursor-pointer">
                  Lên kế hoạch
                </button>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-green-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-800">Tổ chức thêm buổi ôn tập trước kỳ thi</h4>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">Ưu tiên thấp</span>
                </div>
                <p className="text-gray-600 mb-4">Tăng cường các buổi ôn tập và hỗ trợ sinh viên chuẩn bị tốt hơn cho các kỳ thi quan trọng.</p>
                <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg font-medium text-xs transition-colors cursor-pointer">
                  Xem xét sau
                </button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Model Details */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Chi tiết mô hình dự đoán</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-gray-600">Tên mô hình</p>
                <p className="text-lg font-bold text-blue-600">GradientBoost-EDU v3.2</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-gray-600">Phiên bản</p>
                <p className="text-lg font-bold text-green-600">3.2.5</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-sm font-medium text-gray-600">Ngày cập nhật</p>
                <p className="text-lg font-bold text-purple-600">15/08/2023</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-sm font-medium text-gray-600">F1-score</p>
                <p className="text-lg font-bold text-orange-600">93.6%</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Hiệu suất mô hình</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Độ chính xác:</span>
                    <span className="font-semibold text-blue-600">92.5%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Độ nhạy:</span>
                    <span className="font-semibold text-green-600">94.2%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Độ đặc hiệu:</span>
                    <span className="font-semibold text-purple-600">90.8%</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Confusion Matrix</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-green-100 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">True Positive</p>
                    <p className="text-2xl font-bold text-green-600">1250</p>
                  </div>
                  <div className="text-center p-3 bg-red-100 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">False Positive</p>
                    <p className="text-2xl font-bold text-red-600">75</p>
                  </div>
                  <div className="text-center p-3 bg-orange-100 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">False Negative</p>
                    <p className="text-2xl font-bold text-orange-600">85</p>
                  </div>
                  <div className="text-center p-3 bg-blue-100 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">True Negative</p>
                    <p className="text-2xl font-bold text-blue-600">950</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}