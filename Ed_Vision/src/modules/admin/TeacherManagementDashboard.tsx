import AdminLayout from "@/components/ui/admin/AdminLayout";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Đăng ký các components của Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Simple Card components
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
    {children}
  </div>
);

const CardContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={className}>
    {children}
  </div>
);

// Dữ liệu mẫu cho giảng viên
const teachersData = [
  {
    id: "GV001",
    name: "TS. Tô Minh Vương",
    email: "vuong.to@dtu.edu.vn",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
    position: "Tiến sĩ",
    status: "Đang hoạt động",
    statusColor: "green",
    quality: "Tốt",
    qualityStars: 5,
    students: 12
  },
  {
    id: "GV002",
    name: "ThS. Nguyễn Thị Lan",
    email: "lan.nguyen@dtu.edu.vn",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face",
    position: "Thạc sĩ",
    status: "Nghỉ phép",
    statusColor: "yellow",
    quality: "Khá",
    qualityStars: 4,
    students: 8
  },
  {
    id: "GV003",
    name: "PGS. Trần Văn Nam",
    email: "nam.tran@dtu.edu.vn",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
    position: "Thỉnh giảng",
    status: "Không hoạt động",
    statusColor: "red",
    quality: "Trung bình",
    qualityStars: 3,
    students: 5
  },
  {
    id: "GV004",
    name: "TS. Lê Thị Hoa",
    email: "hoa.le@dtu.edu.vn",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face",
    position: "Trợ giảng",
    status: "Đang hoạt động",
    statusColor: "green",
    quality: "Tệ",
    qualityStars: 2,
    students: 3
  },
  {
    id: "GV005",
    name: "ThS. Phạm Minh Tuấn",
    email: "tuan.pham@dtu.edu.vn",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face",
    position: "Thạc sĩ",
    status: "Đang hoạt động",
    statusColor: "green",
    quality: "Khá",
    qualityStars: 4,
    students: 15
  }
];

export default function TeacherManagementDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [positionFilter, setPositionFilter] = useState("Tất cả chức vụ");
  const [statusFilter, setStatusFilter] = useState("Tất cả trạng thái");
  const [qualityFilter, setQualityFilter] = useState("Tất cả chất lượng");
  const navigate = useNavigate();

  // Handle navigation to teacher detail
  const handleViewTeacher = (teacherId: string) => {
    navigate(`/admin/teachers/${teacherId}`);
  };

  // Chart data for quality distribution
  const qualityData = {
    labels: ['Tốt', 'Khá', 'TB', 'Tệ'],
    datasets: [{
      data: [450, 380, 200, 53],
      backgroundColor: [
        '#10b981',
        '#3b82f6', 
        '#f59e0b',
        '#ef4444'
      ],
      borderWidth: 0,
      borderRadius: 4
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context: { parsed: { y: number } }) {
            return context.parsed.y + ' giảng viên';
          }
        }
      }
    },
    scales: {
      y: {
        display: false,
        beginAtZero: true
      },
      x: {
        display: false
      }
    },
    elements: {
      bar: {
        borderSkipped: false
      }
    }
  };

  const getPositionBadgeColor = (position: string) => {
    switch (position) {
      case "Tiến sĩ": return "bg-purple-100 text-purple-800";
      case "Thạc sĩ": return "bg-blue-100 text-blue-800";
      case "Thỉnh giảng": return "bg-gray-100 text-gray-800";
      case "Trợ giảng": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusBadgeColor = (statusColor: string) => {
    switch (statusColor) {
      case "green": return "bg-green-100 text-green-800";
      case "yellow": return "bg-yellow-100 text-yellow-800";
      case "red": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case "Tốt": return "text-green-600";
      case "Khá": return "text-blue-600";
      case "Trung bình": return "text-yellow-600";
      case "Tệ": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  const renderStars = (count: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <i 
        key={i} 
        className={`${i < count ? 'fas' : 'far'} fa-star text-yellow-400`}
      />
    ));
  };

  return (
    <AdminLayout 
      activePage="/admin/teachers"
    >
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý Giảng viên</h1>
          <p className="text-gray-600">Quản lý thông tin và theo dõi chất lượng giảng dạy của giảng viên</p>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Online Teachers */}
          <Card className="p-6 bg-green-200">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Giảng viên trực tuyến</p>
                  <p className="text-2xl font-bold text-gray-900">75/1083</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-user-check text-green-600 text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Average Quality */}
          <Card className="p-6 bg-blue-200">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Chất lượng trung bình</p>
                  <p className="text-2xl font-bold text-gray-900">4.2/5.0</p>
                  <p className="text-sm text-green-600 font-medium">+0.3 điểm so với kỳ trước</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-star text-blue-600 text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quality Distribution */}
          <Card className="p-6">
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="w-full">
                  <p className="text-sm font-medium text-gray-600 mb-3">Phân bố chất lượng</p>
                  <div className="h-16 w-full">
                    <Bar data={qualityData} options={chartOptions} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Need Support */}
          <Card className="p-6 bg-orange-200">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Cần hỗ trợ</p>
                  <p className="text-2xl font-bold text-gray-900">1</p>
                  <p className="text-sm text-green-600 font-medium">-1% so với tháng trước</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-exclamation-triangle text-orange-600 text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Toolbar */}
        <Card className="p-6">
          <CardContent>
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-3 flex-1">
                {/* Search */}
                <div className="relative flex-1 max-w-xs">
                  <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                  <input 
                    type="text" 
                    placeholder="Nhập tên giảng viên..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                  />
                </div>
                
                {/* Filters */}
                <div className="flex flex-wrap gap-2">
                  <select 
                    value={positionFilter}
                    onChange={(e) => setPositionFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 cursor-pointer"
                  >
                    <option>Tất cả chức vụ</option>
                    <option>Tiến sĩ</option>
                    <option>Thạc sĩ</option>
                    <option>Thỉnh giảng</option>
                    <option>Trợ giảng</option>
                  </select>
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 cursor-pointer"
                  >
                    <option>Tất cả trạng thái</option>
                    <option>Đang hoạt động</option>
                    <option>Nghỉ phép</option>
                    <option>Không hoạt động</option>
                  </select>
                  <select 
                    value={qualityFilter}
                    onChange={(e) => setQualityFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 cursor-pointer"
                  >
                    <option>Tất cả chất lượng</option>
                    <option>Tốt (5⭐)</option>
                    <option>Khá (4⭐)</option>
                    <option>Trung bình (3⭐)</option>
                    <option>Tệ (2⭐)</option>
                  </select>
                </div>
              </div>
              
              {/* Add Button */}
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-sm rounded-lg font-medium transition-colors flex items-center cursor-pointer">
                <i className="fas fa-plus mr-1.5"></i>
                Thêm giảng viên
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Teachers Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Họ tên & Email</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chức vụ</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chất lượng</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SV hướng dẫn</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {teachersData.map((teacher, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{teacher.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img src={teacher.avatar} alt={teacher.name} className="w-10 h-10 rounded-full mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{teacher.name}</div>
                          <div className="text-sm text-gray-500">{teacher.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPositionBadgeColor(teacher.position)}`}>
                        {teacher.position}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(teacher.statusColor)}`}>
                        <span className={`w-2 h-2 ${teacher.statusColor === 'green' ? 'bg-green-400' : teacher.statusColor === 'yellow' ? 'bg-yellow-400' : 'bg-red-400'} rounded-full mr-1`}></span>
                        {teacher.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex">
                          {renderStars(teacher.qualityStars)}
                        </div>
                        <span className={`ml-2 text-sm font-medium ${getQualityColor(teacher.quality)}`}>
                          {teacher.quality}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{teacher.students} SV</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          className="text-blue-600 hover:text-blue-900 cursor-pointer" 
                          title="Xem"
                          onClick={() => handleViewTeacher(teacher.id)}
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        <button className="text-green-600 hover:text-green-900 cursor-pointer" title="Chỉnh sửa">
                          <i className="fas fa-edit"></i>
                        </button>
                        <button className="text-red-600 hover:text-red-900 cursor-pointer" title="Xóa">
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-white px-6 py-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-center justify-between">
              <div className="text-sm text-gray-700 mb-4 sm:mb-0">
                Hiển thị <span className="font-medium">1</span> đến <span className="font-medium">5</span> trong tổng số <span className="font-medium">1083</span> kết quả
              </div>
              <div className="flex items-center space-x-2">
                <button className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 cursor-not-allowed" disabled>
                  <i className="fas fa-chevron-left"></i>
                </button>
                <button className="px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-lg cursor-pointer">1</button>
                <button className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">2</button>
                <button className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">3</button>
                <span className="px-3 py-2 text-sm font-medium text-gray-700">...</span>
                <button className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">217</button>
                <button className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}