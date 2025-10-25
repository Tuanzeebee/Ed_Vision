import AdminLayout from "@/components/ui/admin/AdminLayout";
import { useState } from "react";
import { useParams } from "react-router-dom";
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
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    currentAddress: { ...studentData.currentAddress },
    emergencyContact: { ...studentData.emergencyContact }
  });
  const { studentId } = useParams<{ studentId: string }>();

  // In a real app, you would fetch student data based on studentId
  // For now, we'll use the sample data
  console.log('Student ID from URL:', studentId);

  const handleEdit = () => {
    setIsEditing(true);
    // Auto scroll đến phần địa chỉ hiện thời sau một chút delay
    setTimeout(() => {
      const addressSection = document.getElementById('current-address-section');
      if (addressSection) {
        addressSection.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center'
        });
        
        // Thêm hiệu ứng highlight tạm thời
        addressSection.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.3)';
        setTimeout(() => {
          addressSection.style.boxShadow = '';
        }, 2000);
      }
    }, 300);
  };

  const handleConfirm = () => {
    // Hiển thị popup xác nhận
    const isConfirmed = window.confirm(
      'Bạn có chắc chắn muốn lưu các thay đổi không?\n\n' +
      'Các thông tin sẽ được cập nhật:\n' +
      '• Địa chỉ hiện thời\n' +
      '• Người liên hệ khẩn cấp'
    );
    
    if (isConfirmed) {
      // Cập nhật dữ liệu (trong thực tế sẽ gọi API)
      console.log('Cập nhật dữ liệu:', editData);
      setIsEditing(false);
      
      // Hiển thị thông báo thành công
      alert('✓ Cập nhật thông tin thành công!');
    }
  };

  const handleCancel = () => {
    // Reset dữ liệu về trạng thái ban đầu
    setEditData({
      currentAddress: { ...studentData.currentAddress },
      emergencyContact: { ...studentData.emergencyContact }
    });
    setIsEditing(false);
  };

  const handleInputChange = (section: 'currentAddress' | 'emergencyContact', field: string, value: string) => {
    setEditData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
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
    <AdminLayout>
      <div className="space-y-4">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Chi tiết sinh viên</h1>
            <p className="text-base text-gray-600">Chi tiết thông tin sinh viên và tiến độ học tập</p>
          </div>
          {!isEditing ? (
            <button 
              onClick={handleEdit}
              className="group bg-white border-2 border-orange-500 text-orange-500 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-orange-500 hover:text-white transform hover:scale-105 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                  <i className="fas fa-edit text-xs"></i>
                </div>
                <span>Cập nhật</span>
              </div>
            </button>
          ) : (
            <div className="flex gap-2">
              <button 
                onClick={handleConfirm}
                className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-600 transition-colors font-semibold cursor-pointer"
              >
                <i className="fas fa-check mr-2"></i>
                Xác nhận
              </button>
              <button 
                onClick={handleCancel}
                className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600 transition-colors font-semibold cursor-pointer"
              >
                <i className="fas fa-times mr-2"></i>
                Hủy bỏ
              </button>
            </div>
          )}
        </div>

        {/* Student Personal Information */}
        <Card className="bg-white border border-gray-200 shadow-md">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Student Avatar */}
              <div className="flex-shrink-0 relative">
                <div className="relative">
                  <img 
                    src={studentData.avatar} 
                    alt={studentData.name}
                    className="w-24 h-24 rounded-xl border-4 border-white shadow-lg object-cover transform hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.src = "/src/assets/parent/avatarJohnSmith.png";
                    }}
                  />
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                    <i className="fas fa-check text-white text-xs"></i>
                  </div>
                </div>
              </div>
              
              {/* Student Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <i className="fas fa-user text-white text-sm"></i>
                  </div>
                  <h2 className="text-lg font-bold text-gray-800">Thông tin cá nhân</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center gap-2 mb-1">
                      <i className="fas fa-id-badge text-gray-500 text-sm"></i>
                      <label className="block text-sm font-medium text-gray-600">Tên người dùng</label>
                    </div>
                    <p className="text-sm font-semibold text-gray-800">{studentData.name}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center gap-2 mb-1">
                      <i className="fas fa-barcode text-gray-500 text-sm"></i>
                      <label className="block text-sm font-medium text-gray-600">Mã sinh viên</label>
                    </div>
                    <p className="text-sm font-semibold text-gray-800">{studentData.studentCode}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center gap-2 mb-1">
                      <i className="fas fa-venus-mars text-gray-500 text-sm"></i>
                      <label className="block text-sm font-medium text-gray-600">Giới tính</label>
                    </div>
                    <p className="text-sm text-gray-800">{studentData.gender}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center gap-2 mb-1">
                      <i className="fas fa-birthday-cake text-gray-500 text-sm"></i>
                      <label className="block text-sm font-medium text-gray-600">Ngày sinh</label>
                    </div>
                    <p className="text-sm text-gray-800">{studentData.dateOfBirth}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center gap-2 mb-1">
                      <i className="fas fa-id-card text-gray-500 text-sm"></i>
                      <label className="block text-sm font-medium text-gray-600">CCCD</label>
                    </div>
                    <p className="text-sm text-gray-800">{studentData.cccd}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center gap-2 mb-1">
                      <i className="fas fa-envelope text-gray-500 text-sm"></i>
                      <label className="block text-sm font-medium text-gray-600">Email (DTU)</label>
                    </div>
                    <p className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer">{studentData.email}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Address */}
        <div id="current-address-section" className="transition-all duration-500">
          <Card className="bg-white border border-gray-200 shadow-md">
            <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <i className="fas fa-map-marker-alt text-white text-sm"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-800">Địa chỉ hiện thời</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <i className="fas fa-road text-gray-500 text-sm"></i>
                  <label className="block text-sm font-medium text-gray-600">Địa chỉ/Thôn</label>
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.currentAddress.street}
                    onChange={(e) => handleInputChange('currentAddress', 'street', e.target.value)}
                    className="w-full text-sm text-gray-800 bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
                  />
                ) : (
                  <p className="text-sm text-gray-800">{studentData.currentAddress.street}</p>
                )}
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <i className="fas fa-building text-gray-500 text-sm"></i>
                  <label className="block text-sm font-medium text-gray-600">Phường/Xã</label>
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.currentAddress.ward}
                    onChange={(e) => handleInputChange('currentAddress', 'ward', e.target.value)}
                    className="w-full text-sm text-gray-800 bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
                  />
                ) : (
                  <p className="text-sm text-gray-800">{studentData.currentAddress.ward}</p>
                )}
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <i className="fas fa-city text-gray-500 text-sm"></i>
                  <label className="block text-sm font-medium text-gray-600">Quận/Huyện</label>
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.currentAddress.district}
                    onChange={(e) => handleInputChange('currentAddress', 'district', e.target.value)}
                    className="w-full text-sm text-gray-800 bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
                  />
                ) : (
                  <p className="text-sm text-gray-800">{studentData.currentAddress.district}</p>
                )}
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <i className="fas fa-map text-gray-500 text-sm"></i>
                  <label className="block text-sm font-medium text-gray-600">Tỉnh/Thành phố</label>
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.currentAddress.city}
                    onChange={(e) => handleInputChange('currentAddress', 'city', e.target.value)}
                    className="w-full text-sm text-gray-800 bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
                  />
                ) : (
                  <p className="text-sm text-gray-800">{studentData.currentAddress.city}</p>
                )}
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <i className="fas fa-globe text-gray-500 text-sm"></i>
                  <label className="block text-sm font-medium text-gray-600">Quốc gia</label>
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.currentAddress.country}
                    onChange={(e) => handleInputChange('currentAddress', 'country', e.target.value)}
                    className="w-full text-sm text-gray-800 bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
                  />
                ) : (
                  <p className="text-sm text-gray-800">{studentData.currentAddress.country}</p>
                )}
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <i className="fas fa-phone text-gray-500 text-sm"></i>
                  <label className="block text-sm font-medium text-gray-600">Điện thoại</label>
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.currentAddress.phone}
                    onChange={(e) => handleInputChange('currentAddress', 'phone', e.target.value)}
                    className="w-full text-sm text-gray-800 bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
                  />
                ) : (
                  <p className="text-sm text-gray-800 hover:text-blue-600 cursor-pointer">{studentData.currentAddress.phone}</p>
                )}
              </div>
              <div className="md:col-span-2 lg:col-span-1 bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <i className="fas fa-envelope-open text-gray-500 text-sm"></i>
                  <label className="block text-sm font-medium text-gray-600">Email khác</label>
                </div>
                {isEditing ? (
                  <input
                    type="email"
                    value={editData.currentAddress.alternativeEmail}
                    onChange={(e) => handleInputChange('currentAddress', 'alternativeEmail', e.target.value)}
                    className="w-full text-sm text-gray-800 bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
                  />
                ) : (
                  <p className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer">{studentData.currentAddress.alternativeEmail}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        </div>

        {/* Emergency Contact */}
        <Card className="bg-white shadow-md border-l-4 border-red-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                <i className="fas fa-exclamation-triangle text-white text-sm"></i>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  Người Liên hệ Khẩn cấp
                </h3>
                <p className="text-sm text-gray-600">Thông tin liên hệ khi cần thiết</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <i className="fas fa-user-tie text-gray-500 text-sm"></i>
                  <label className="block text-sm font-medium text-gray-600">Tên</label>
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.emergencyContact.name}
                    onChange={(e) => handleInputChange('emergencyContact', 'name', e.target.value)}
                    className="w-full text-sm text-gray-800 bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
                  />
                ) : (
                  <p className="text-sm font-bold text-gray-800">{studentData.emergencyContact.name}</p>
                )}
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <i className="fas fa-heart text-gray-500 text-sm"></i>
                  <label className="block text-sm font-medium text-gray-600">Quan hệ</label>
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.emergencyContact.relationship}
                    onChange={(e) => handleInputChange('emergencyContact', 'relationship', e.target.value)}
                    className="w-full text-sm text-gray-800 bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
                  />
                ) : (
                  <p className="text-sm text-gray-800">{studentData.emergencyContact.relationship}</p>
                )}
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <i className="fas fa-phone-alt text-gray-500 text-sm"></i>
                  <label className="block text-sm font-medium text-gray-600">Số điện thoại</label>
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.emergencyContact.phone}
                    onChange={(e) => handleInputChange('emergencyContact', 'phone', e.target.value)}
                    className="w-full text-sm text-gray-800 bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
                  />
                ) : (
                  <p className="text-sm text-gray-800 hover:text-red-600 cursor-pointer">{studentData.emergencyContact.phone}</p>
                )}
              </div>
              <div className="md:col-span-2 bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <i className="fas fa-map-marker-alt text-gray-500 text-sm"></i>
                  <label className="block text-sm font-medium text-gray-600">Địa chỉ</label>
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.emergencyContact.address}
                    onChange={(e) => handleInputChange('emergencyContact', 'address', e.target.value)}
                    className="w-full text-sm text-gray-800 bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
                  />
                ) : (
                  <p className="text-sm text-gray-800">{studentData.emergencyContact.address}</p>
                )}
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <i className="fas fa-envelope text-gray-500 text-sm"></i>
                  <label className="block text-sm font-medium text-gray-600">Email</label>
                </div>
                {isEditing ? (
                  <input
                    type="email"
                    value={editData.emergencyContact.email}
                    onChange={(e) => handleInputChange('emergencyContact', 'email', e.target.value)}
                    className="w-full text-sm text-gray-800 bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
                  />
                ) : (
                  <p className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer">{studentData.emergencyContact.email}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Study Section */}
        <Card className="bg-white border border-gray-200 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <i className="fas fa-graduation-cap text-white text-sm"></i>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Học tập</h3>
                <p className="text-sm text-gray-600">Theo dõi tiến độ và thành tích học tập</p>
              </div>
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
                  <i className="fas fa-calendar-alt text-gray-500"></i>
                  Năm học
                </label>
                <select 
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="border border-gray-300 bg-white rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-500 text-gray-700 cursor-pointer text-sm transition-all"
                >
                  <option>2024-2025</option>
                  <option>2023-2024</option>
                  <option>2022-2023</option>
                </select>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
                  <i className="fas fa-clock text-gray-500"></i>
                  Kỳ học
                </label>
                <select 
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="border border-gray-300 bg-white rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-500 text-gray-700 cursor-pointer text-sm transition-all"
                >
                  <option>Kỳ 1</option>
                  <option>Kỳ 2</option>
                  <option>Kỳ hè</option>
                </select>
              </div>
            </div>

            {/* Alert Status */}
            <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-3 mb-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center mr-3">
                  <i className="fas fa-exclamation-triangle text-white text-sm"></i>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-yellow-800">
                    Cảnh báo: {studentData.academicStatus.status}
                  </h4>
                  <p className="text-sm text-yellow-700">{studentData.academicStatus.description}</p>
                </div>
              </div>
            </div>

            {/* Progress Chart */}
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
                  <i className="fas fa-chart-line text-white text-xs"></i>
                </div>
                <h4 className="text-base font-bold text-gray-800">Tiến độ học tập</h4>
              </div>
              <div className="h-64 w-full bg-gray-50 p-3 rounded-lg border border-gray-200">
                <Line data={progressData} options={chartOptions} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Study History */}
        <Card className="bg-white border border-gray-200 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <i className="fas fa-history text-white text-sm"></i>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Lịch sử học tập</h3>
                <p className="text-sm text-gray-600">Chi tiết điểm số và thành tích từng môn học</p>
              </div>
            </div>
            
            <div className="rounded-lg border border-gray-200">
              <table className="w-full border-collapse bg-white">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border-0 px-4 py-3 text-left font-bold text-gray-700 text-sm">
                      <div className="flex items-center gap-2">
                        <i className="fas fa-book text-gray-500"></i>
                        Môn học
                      </div>
                    </th>
                    <th className="border-0 px-4 py-3 text-center font-bold text-gray-700 text-sm">
                      <div className="flex items-center justify-center gap-2">
                        <i className="fas fa-pencil-alt text-gray-500"></i>
                        Điểm BT
                      </div>
                    </th>
                    <th className="border-0 px-4 py-3 text-center font-bold text-gray-700 text-sm">
                      <div className="flex items-center justify-center gap-2">
                        <i className="fas fa-question-circle text-gray-500"></i>
                        Điểm Quiz
                      </div>
                    </th>
                    <th className="border-0 px-4 py-3 text-center font-bold text-gray-700 text-sm">
                      <div className="flex items-center justify-center gap-2">
                        <i className="fas fa-chart-line text-gray-500"></i>
                        Trạng thái
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {studyHistory.map((record, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="border-0 px-4 py-3 font-semibold text-gray-800 text-sm border-b border-gray-100">{record.subject}</td>
                      <td className="border-0 px-4 py-3 text-center border-b border-gray-100">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${getScoreColor(record.assignmentScore)}`}>
                          {record.assignmentScore}
                        </span>
                      </td>
                      <td className="border-0 px-4 py-3 text-center border-b border-gray-100">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${getScoreColor(record.quizScore)}`}>
                          {record.quizScore}
                        </span>
                      </td>
                      <td className="border-0 px-4 py-3 text-center border-b border-gray-100">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(record.statusColor)}`}>
                          <i className={`${getStatusIcon(record.statusColor)} mr-1`}></i>
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


      </div>
    </AdminLayout>
  );
}