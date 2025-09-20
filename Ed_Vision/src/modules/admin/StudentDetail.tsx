import AdminLayout from "@/components/ui/admin/AdminLayout";
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Đăng ký các components của Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Simple Card components          <CardContent className="p-4">
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
    {children}
  </div>
);

const CardContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={className}>
    {children}
  </div>
);

// Dữ liệu mẫu cho sinh viên
const studentData = {
  id: 1,
  name: "Tô Minh Vương",
  studentCode: "28211102954",
  gender: "Nam",
  dateOfBirth: "01/01/2005",
  cccd: "01348872347",
  email: "abc@dtu.edu.vn",
  avatar: "/src/assets/admin/avatarJohnSmithDetail.png",
  currentAddress: {
    street: "123 Đường Lê Lợi",
    ward: "Phường Hải Châu I",
    district: "Quận Hải Châu",
    city: "Đà Nẵng",
    country: "Việt Nam",
    phone: "0905123456",
    alternativeEmail: "vuong.personal@gmail.com"
  },
  emergencyContact: {
    name: "Tô Văn Minh",
    relationship: "Cha",
    phone: "0912345678",
    address: "456 Đường Nguyễn Văn Linh, Phường Thạc Gián, Quận Thanh Khê, Đà Nẵng",
    email: "minh.to@email.com"
  },
  academicStatus: {
    status: "At-Risk",
    description: "Tiến độ thấp trong kỳ học hè",
    statusColor: "yellow"
  }
};

// Dữ liệu lịch sử học tập
const studyHistory = [
  {
    subject: "Toán cao cấp",
    assignmentScore: 8.5,
    quizScore: 7.8,
    status: "Đạt",
    statusColor: "green"
  },
  {
    subject: "Lý đại cương",
    assignmentScore: 9.0,
    quizScore: 8.2,
    status: "Đạt",
    statusColor: "green"
  },
  {
    subject: "Lập trình cơ sở",
    assignmentScore: 7.5,
    quizScore: 6.9,
    status: "Cần cải thiện",
    statusColor: "yellow"
  },
  {
    subject: "Chủ nghĩa xã hội khoa học",
    assignmentScore: 8.0,
    quizScore: 7.5,
    status: "Đạt",
    statusColor: "green"
  },
  {
    subject: "Tin học ứng dụng",
    assignmentScore: 9.2,
    quizScore: 8.5,
    status: "Xuất sắc",
    statusColor: "green"
  },
  {
    subject: "CDIO",
    assignmentScore: 8.8,
    quizScore: 8.0,
    status: "Đạt",
    statusColor: "green"
  }
];

export default function StudentDetail() {
  const [selectedYear, setSelectedYear] = useState("2024-2025");
  const [selectedSemester, setSelectedSemester] = useState("Kỳ 1");
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();

  // In a real app, you would fetch student data based on studentId
  // For now, we'll use the sample data
  console.log('Student ID from URL:', studentId);

  // Handle breadcrumb navigation to StudentList
  const handleBreadcrumbNavigation = (href: string) => {
    if (href === '/admin/students/list') {
      // Navigate specifically to StudentList
      navigate('/admin/students/list');
    } else {
      // For all other breadcrumb navigation, use React Router
      navigate(href);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8.5) return "bg-green-100 text-green-800";
    if (score >= 7.0) return "bg-blue-100 text-blue-800";
    return "bg-yellow-100 text-yellow-800";
  };

  const getStatusColor = (statusColor: string) => {
    switch (statusColor) {
      case "green": return "bg-green-100 text-green-800";
      case "yellow": return "bg-yellow-100 text-yellow-800";
      case "red": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (statusColor: string) => {
    switch (statusColor) {
      case "green": return "fas fa-check-circle";
      case "yellow": return "fas fa-exclamation-triangle";
      case "red": return "fas fa-times-circle";
      default: return "fas fa-circle";
    }
  };

  // Dữ liệu cho biểu đồ tiến độ
  const progressData = {
    labels: ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4', 'Tuần 5', 'Tuần 6', 'Tuần 7', 'Tuần 8'],
    datasets: [
      {
        label: 'Toán cao cấp',
        data: [7.5, 7.8, 8.0, 8.2, 8.5, 8.3, 8.6, 8.5],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.4
      },
      {
        label: 'Lý đại cương',
        data: [8.0, 8.2, 8.5, 8.7, 9.0, 8.8, 9.1, 9.0],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.4
      },
      {
        label: 'Lập trình cơ sở',
        data: [6.5, 6.8, 7.0, 7.2, 7.5, 7.3, 7.6, 7.5],
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.4
      },
      {
        label: 'CDIO',
        data: [8.2, 8.4, 8.6, 8.5, 8.8, 8.7, 8.9, 8.8],
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.4
      },
      {
        label: 'Chủ nghĩa xã hội khoa học',
        data: [7.8, 7.9, 8.1, 8.0, 8.0, 7.9, 8.2, 8.0],
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.4
      },
      {
        label: 'Tin học ứng dụng',
        data: [8.8, 9.0, 9.1, 9.3, 9.2, 9.4, 9.3, 9.2],
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.4
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: 500
          }
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(tooltipItem: { dataset: { label?: string }, parsed: { y: number } }) {
            const label = tooltipItem.dataset.label || '';
            return label + ': ' + tooltipItem.parsed.y + ' điểm';
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        min: 6,
        max: 10,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false
        },
        ticks: {
          font: {
            size: 12
          },
          color: '#6b7280',
          callback: function(value: string | number) {
            return value + ' điểm';
          }
        },
        title: {
          display: true,
          text: 'Điểm số',
          font: {
            size: 14,
            weight: 600
          },
          color: '#374151'
        }
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false
        },
        ticks: {
          font: {
            size: 12
          },
          color: '#6b7280'
        },
        title: {
          display: true,
          text: 'Thời gian',
          font: {
            size: 14,
            weight: 600
          },
          color: '#374151'
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const
    },
    elements: {
      point: {
        hoverBackgroundColor: '#fff',
        hoverBorderWidth: 3
      }
    }
  };

  return (
    <AdminLayout 
      activePage="/admin/students"
      onNavigate={handleBreadcrumbNavigation}
    >
      <div className="space-y-4">
        {/* Page Header */}
        <div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Chi tiết sinh viên</h1>
          <p className="text-base text-gray-600">Chi tiết thông tin sinh viên và tiến độ học tập</p>
        </div>

        {/* Student Personal Information */}
        <Card className="p-4">
          <CardContent>
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Student Avatar */}
              <div className="flex-shrink-0">
                <img 
                  src={studentData.avatar} 
                  alt={studentData.name}
                  className="w-20 h-20 rounded-lg border-2 border-gray-200 object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/src/assets/parent/avatarJohnSmith.png";
                  }}
                />
              </div>
              
              {/* Student Info */}
              <div className="flex-1">
                <h2 className="text-base font-bold text-gray-800 mb-2">Thông tin cá nhân</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Tên người dùng</label>
                    <p className="text-base font-semibold text-gray-800">{studentData.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Mã sinh viên</label>
                    <p className="text-base font-semibold text-gray-800">{studentData.studentCode}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Giới tính</label>
                    <p className="text-base text-gray-800">{studentData.gender}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Ngày sinh</label>
                    <p className="text-base text-gray-800">{studentData.dateOfBirth}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">CCCD</label>
                    <p className="text-base text-gray-800">{studentData.cccd}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Email (DTU)</label>
                    <p className="text-base text-blue-600">{studentData.email}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Address */}
        <Card className="p-4">
          <CardContent>
            <h3 className="text-sm font-bold text-gray-800 mb-2">Địa chỉ hiện thời</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Địa chỉ/Thôn</label>
                <p className="text-gray-800">{studentData.currentAddress.street}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Phường/Xã</label>
                <p className="text-gray-800">{studentData.currentAddress.ward}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Quận/Huyện</label>
                <p className="text-gray-800">{studentData.currentAddress.district}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Tỉnh/Thành phố</label>
                <p className="text-gray-800">{studentData.currentAddress.city}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Quốc gia</label>
                <p className="text-gray-800">{studentData.currentAddress.country}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Điện thoại</label>
                <p className="text-gray-800">{studentData.currentAddress.phone}</p>
              </div>
              <div className="md:col-span-2 lg:col-span-1">
                <label className="block text-sm font-medium text-gray-600 mb-1">Email khác</label>
                <p className="text-blue-600">{studentData.currentAddress.alternativeEmail}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card className="p-4">
          <CardContent>
            <h3 className="text-sm font-bold text-red-600 mb-2 flex items-center">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              Người Liên hệ Khẩn cấp
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Tên</label>
                <p className="text-gray-800 font-medium">{studentData.emergencyContact.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Quan hệ</label>
                <p className="text-gray-800">{studentData.emergencyContact.relationship}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Số điện thoại</label>
                <p className="text-gray-800">{studentData.emergencyContact.phone}</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-1">Địa chỉ</label>
                <p className="text-gray-800">{studentData.emergencyContact.address}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                <p className="text-blue-600">{studentData.emergencyContact.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Study Section */}
        <Card className="p-3">
          <CardContent>
            <h3 className="text-sm font-bold text-gray-800 mb-2">Học tập</h3>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Năm học</label>
                <select 
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 cursor-pointer"
                >
                  <option>2024-2025</option>
                  <option>2023-2024</option>
                  <option>2022-2023</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Kỳ học</label>
                <select 
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 cursor-pointer"
                >
                  <option>Kỳ 1</option>
                  <option>Kỳ 2</option>
                  <option>Kỳ hè</option>
                </select>
              </div>
            </div>

            {/* Alert Status */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-2 mb-3">
              <div className="flex items-center">
                <i className="fas fa-exclamation-triangle text-yellow-600 mr-2 text-sm"></i>
                <div>
                  <h4 className="text-sm font-semibold text-yellow-800">
                    Cảnh báo: {studentData.academicStatus.status}
                  </h4>
                  <p className="text-xs text-yellow-700">{studentData.academicStatus.description}</p>
                </div>
              </div>
            </div>

            {/* Progress Chart */}
            <div className="mb-3">
              <h4 className="text-xs font-semibold text-gray-800 mb-2">Tiến độ học tập</h4>
              <div className="h-80 w-full bg-white p-2 rounded-lg border border-gray-200">
                <Line data={progressData} options={chartOptions} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Study History */}
        <Card className="overflow-hidden">
          <CardContent className="p-2">
            <h3 className="text-sm font-bold text-gray-800 mb-2">Lịch sử học tập</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-2 py-1 text-left font-semibold text-gray-700 text-xs">Môn học</th>
                    <th className="border border-gray-200 px-2 py-1 text-center font-semibold text-gray-700 text-xs">Điểm BT</th>
                    <th className="border border-gray-200 px-2 py-1 text-center font-semibold text-gray-700 text-xs">Điểm Quiz</th>
                    <th className="border border-gray-200 px-2 py-1 text-center font-semibold text-gray-700 text-xs">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {studyHistory.map((record, index) => (
                    <tr key={index} className="hover:bg-gray-50 cursor-pointer">
                      <td className="border border-gray-200 px-2 py-1 font-medium text-gray-800 text-xs">{record.subject}</td>
                      <td className="border border-gray-200 px-2 py-1 text-center">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getScoreColor(record.assignmentScore)}`}>
                          {record.assignmentScore}
                        </span>
                      </td>
                      <td className="border border-gray-200 px-2 py-1 text-center">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getScoreColor(record.quizScore)}`}>
                          {record.quizScore}
                        </span>
                      </td>
                      <td className="border border-gray-200 px-2 py-1 text-center">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.statusColor)}`}>
                          <i className={`${getStatusIcon(record.statusColor)} mr-1 text-xs`}></i>
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Update Button */}
        <div className="text-center">
          <button className="bg-white border-2 border-orange-500 text-orange-500 hover:bg-orange-50 px-3 py-1.5 rounded-lg font-medium transition-colors text-xs cursor-pointer">
            <i className="fas fa-edit mr-1"></i>
            CẬP NHẬT
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}