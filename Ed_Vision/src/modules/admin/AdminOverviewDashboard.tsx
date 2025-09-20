import { useState } from "react"
import AdminLayout from "../../components/ui/admin/AdminLayout"
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

// Đăng ký các components của Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

// Simple Card components since shadcn/ui might not be available
const SimpleCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
    {children}
  </div>
);

// Icon components using Font Awesome classes (you can replace with react-icons)
const UserGraduateIcon = () => <i className="fas fa-user-graduate text-gray-400"></i>
const ChalkboardTeacherIcon = () => <i className="fas fa-chalkboard-teacher text-gray-400"></i>
const ChartLineIcon = () => <i className="fas fa-chart-line text-gray-400"></i>
const DownloadIcon = () => <i className="fas fa-download"></i>
const FilterIcon = () => <i className="fas fa-filter"></i>
const ArrowUpIcon = () => <i className="fas fa-arrow-up"></i>
const ArrowDownIcon = () => <i className="fas fa-arrow-down"></i>
const ExclamationTriangleIcon = () => <i className="fas fa-exclamation-triangle"></i>

export default function AdminOverviewDashboard() {
  const [selectedSemester, setSelectedSemester] = useState("Kỳ 1 2024-2025");
  const [selectedSchool, setSelectedSchool] = useState("Tất cả");
  const [selectedMajor, setSelectedMajor] = useState("Tất cả");
  const [selectedSubject, setSelectedSubject] = useState("Tất cả");
  const [selectedYear, setSelectedYear] = useState("2024-2025");
  const [subjectCode, setSubjectCode] = useState("");

  // Dữ liệu mẫu cho biểu đồ thời gian truy cập
  const accessTimeData = {
    labels: ['Sáng', 'Chiều', 'Tối'],
    datasets: [
      {
        data: [28, 40, 32],
        backgroundColor: [
          '#FCD34D', // Yellow-400
          '#3B82F6', // Blue-500
          '#8B5CF6', // Purple-500
        ],
        borderWidth: 0,
        hoverBackgroundColor: [
          '#F59E0B', // Yellow-500
          '#2563EB', // Blue-600
          '#7C3AED', // Purple-600
        ],
      },
    ],
  };

  // Dữ liệu mẫu cho biểu đồ GPA
  const gpaData = {
    labels: ['Xuất sắc/Giỏi', 'Khá/Tốt', 'Trung bình/Yếu'],
    datasets: [
      {
        data: [85, 10, 5],
        backgroundColor: [
          '#10B981', // Green-500
          '#F59E0B', // Yellow-500
          '#EF4444', // Red-500
        ],
        borderWidth: 0,
        hoverBackgroundColor: [
          '#059669', // Green-600
          '#D97706', // Yellow-600
          '#DC2626', // Red-600
        ],
      },
    ],
  };

  // Dữ liệu mẫu cho biểu đồ phân phối điểm số
  const scoreDistributionData = {
    labels: ['0-10', '11-20', '21-30', '31-40', '41-50', '51-60', '61-70', '71-80', '81-90', '91-100'],
    datasets: [
      {
        label: 'Số lượng sinh viên',
        data: [5, 12, 25, 45, 78, 156, 234, 345, 289, 167],
        backgroundColor: '#3B82F6',
        hoverBackgroundColor: '#2563EB',
        borderRadius: 4,
      },
    ],
  };

  // Cấu hình cho biểu đồ doughnut
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Ẩn legend mặc định vì chúng ta có custom legend
      },
      tooltip: {
        callbacks: {
          label: function(context: {label: string, parsed: number}) {
            return context.label + ': ' + context.parsed + '%';
          }
        }
      }
    },
    cutout: '60%',
  };

  // Cấu hình cho biểu đồ bar
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: {parsed: {y: number}}) {
            return 'Số lượng: ' + context.parsed.y + ' sinh viên';
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 50,
        },
        grid: {
          color: '#F3F4F6',
        }
      },
      x: {
        grid: {
          display: false,
        }
      }
    },
  };

  return (
    <AdminLayout activePage="dashboard">
      {/* Dashboard Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">PREDICA</h1>
            <p className="text-gray-600">Tổng quan hệ thống quản lý học tập và hiệu suất sinh viên</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 mt-4 lg:mt-0">
            <select 
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="px-2 py-1.5 border border-gray-300 rounded-md bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
            >
              <option>Kỳ 1 2024-2025</option>
              <option>Kỳ 2 2023-2024</option>
              <option>Kỳ hè 2024</option>
            </select>
            <button className="px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium text-xs">
              <DownloadIcon />
              <span className="ml-1">Xuất báo cáo</span>
            </button>
          </div>
        </div>
      </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <SimpleCard className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-blue-700 mb-1">Tổng số Sinh viên</p>
                  <p className="text-2xl font-bold text-blue-900">12,847</p>
                  <p className="text-xs text-green-600 font-medium mt-1">
                    <ArrowUpIcon />
                    <span className="ml-1">+12% so với tháng trước</span>
                  </p>
                </div>
                <div className="w-10 h-10 bg-blue-200 rounded-lg flex items-center justify-center">
                  <UserGraduateIcon />
                </div>
              </div>
            </SimpleCard>

            <SimpleCard className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-green-700 mb-1">Số lượng Giảng viên</p>
                  <p className="text-2xl font-bold text-green-900">342</p>
                  <p className="text-xs text-green-600 font-medium mt-1">
                    <ArrowUpIcon />
                    <span className="ml-1">+5% so với tháng trước</span>
                  </p>
                </div>
                <div className="w-10 h-10 bg-green-200 rounded-lg flex items-center justify-center">
                  <ChalkboardTeacherIcon />
                </div>
              </div>
            </SimpleCard>

            <SimpleCard className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-red-700 mb-1">Sinh viên có nguy cơ</p>
                  <p className="text-2xl font-bold text-red-900">15</p>
                  <p className="text-xs text-green-600 font-medium mt-1">
                    <ArrowDownIcon />
                    <span className="ml-1">-3% so với tuần trước</span>
                  </p>
                </div>
                <div className="w-10 h-10 bg-red-200 rounded-lg flex items-center justify-center">
                  <ExclamationTriangleIcon />
                </div>
              </div>
            </SimpleCard>

            <SimpleCard className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-purple-700 mb-1">Hiệu suất Trung bình</p>
                  <p className="text-2xl font-bold text-purple-900">87.3%</p>
                  <p className="text-xs text-green-600 font-medium mt-1">
                    <ArrowUpIcon />
                    <span className="ml-1">+2.1% so với tháng trước</span>
                  </p>
                </div>
                <div className="w-10 h-10 bg-purple-200 rounded-lg flex items-center justify-center">
                  <ChartLineIcon />
                </div>
              </div>
            </SimpleCard>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Access Time Statistics */}
            <SimpleCard className="p-4">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Thống kê thời gian truy cập</h3>
              <div className="h-56 relative">
                <Doughnut data={accessTimeData} options={doughnutOptions} />
              </div>
              <div className="flex justify-center space-x-6 mt-4 text-sm">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-400 rounded-full mr-2"></div>
                  <span className="font-medium text-gray-700">Sáng (28%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
                  <span className="font-medium text-gray-700">Chiều (40%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-purple-500 rounded-full mr-2"></div>
                  <span className="font-medium text-gray-700">Tối (32%)</span>
                </div>
              </div>
            </SimpleCard>

            {/* GPA Distribution */}
            <SimpleCard className="p-4">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Thống kê phân trăm GPA</h3>
              <div className="h-56 relative">
                <Doughnut data={gpaData} options={doughnutOptions} />
              </div>
              <div className="flex justify-center space-x-6 mt-4 text-sm">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                  <span className="font-medium text-gray-700">Xuất sắc/Giỏi (85%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full mr-2"></div>
                  <span className="font-medium text-gray-700">Khá/Tốt (10%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
                  <span className="font-medium text-gray-700">Trung bình/Yếu (5%)</span>
                </div>
              </div>
            </SimpleCard>
          </div>

          {/* Outstanding Students */}
          <SimpleCard className="p-4 mb-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Danh sách Sinh viên tiêu biểu</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <i className="fas fa-star text-yellow-500"></i>
                  <span className="text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full">#1</span>
                </div>
                <h4 className="text-sm font-semibold text-gray-900 mb-1">Nguyễn Đình Tuấn</h4>
                <p className="text-xl font-bold text-yellow-600">GPA 3.95</p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <i className="fas fa-star text-yellow-500"></i>
                  <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded-full">#2</span>
                </div>
                <h4 className="text-sm font-semibold text-gray-900 mb-1">Hồ Trọng Vỹ</h4>
                <p className="text-xl font-bold text-blue-600">GPA 3.92</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <i className="fas fa-star text-yellow-500"></i>
                  <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">#3</span>
                </div>
                <h4 className="text-sm font-semibold text-gray-900 mb-1">Võ Hoàng Mai Khanh</h4>
                <p className="text-xl font-bold text-green-600">GPA 3.89</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <i className="fas fa-star text-yellow-500"></i>
                  <span className="text-xs font-medium text-purple-700 bg-purple-100 px-2 py-1 rounded-full">#4</span>
                </div>
                <h4 className="text-sm font-semibold text-gray-900 mb-1">Võ Văn Phương</h4>
                <p className="text-xl font-bold text-purple-600">GPA 3.87</p>
              </div>
            </div>
          </SimpleCard>

          {/* Score Distribution Chart */}
          <SimpleCard className="p-4">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Biểu đồ phân phối điểm số</h3>
            
            {/* Filters */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Trường</label>
                <select 
                  value={selectedSchool}
                  onChange={(e) => setSelectedSchool(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
                >
                  <option>Tất cả</option>
                  <option>CNTT</option>
                  <option>Kinh tế</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Chuyên ngành</label>
                <select 
                  value={selectedMajor}
                  onChange={(e) => setSelectedMajor(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
                >
                  <option>Tất cả</option>
                  <option>Khoa học máy tính</option>
                  <option>Hệ thống thông tin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Môn học</label>
                <select 
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
                >
                  <option>Tất cả</option>
                  <option>Toán cao cấp</option>
                  <option>Lập trình</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Năm học</label>
                <select 
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
                >
                  <option>2024-2025</option>
                  <option>2023-2024</option>
                  <option>2022-2023</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Mã số môn học</label>
                <input 
                  type="text" 
                  placeholder="Nhập mã môn" 
                  value={subjectCode}
                  onChange={(e) => setSubjectCode(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md bg-white text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
                />
              </div>
              <div className="flex items-end">
                <button className="w-full px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium text-xs">
                  <FilterIcon />
                  <span className="ml-1">Áp dụng Bộ lọc</span>
                </button>
              </div>
            </div>

            {/* Score Distribution Chart - Chart.js Bar Chart */}
            <div className="h-64 relative">
              <Bar data={scoreDistributionData} options={barOptions} />
            </div>
          </SimpleCard>
    </AdminLayout>
  )
}