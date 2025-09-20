import AdminLayout from "@/components/ui/admin/AdminLayout";
import StudentList from "./StudentList";
import { useState, useEffect } from "react";
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
  <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
    {children}
  </div>
);

const CardContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={className}>
    {children}
  </div>
);

export default function StudentManagementDashboard() {
  const [showStudentList, setShowStudentList] = useState(false);
  const navigate = useNavigate();

  // Reset về dashboard chỉ khi navigate từ breadcrumb
  useEffect(() => {
    // Listen for popstate events (back/forward browser buttons) 
    const handlePopState = () => {
      // Chỉ reset khi user dùng back button hoặc navigate từ bên ngoài
      if (window.location.pathname === '/admin/students') {
        setShowStudentList(false);
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Handle navigation để reset state khi navigate từ breadcrumb hoặc sidebar
  const handleNavigation = (href: string) => {
    if (href === '/admin/students') {
      // Reset về dashboard view
      setShowStudentList(false);
    } else if (href === '/admin/students/list') {
      // Navigate tới StudentList view
      setShowStudentList(true);
    } else {
      // Với các navigation khác, reset về dashboard trước khi navigate
      setShowStudentList(false);
      navigate(href);
    }
  };

  // Nếu đang hiển thị danh sách sinh viên, render StudentList component
  if (showStudentList) {
    return <StudentList onNavigate={handleNavigation} />;
  }

  // Dữ liệu mẫu cho biểu đồ sinh viên theo khoa
  const facultyData = {
    labels: ['CNTT', 'Công Nghệ', 'Y-Dược', 'Kinh tế', 'Ngoại ngữ', 'Luật', 'Kỹ thuật'],
    datasets: [
      {
        label: 'Số lượng sinh viên',
        data: [3245, 2876, 2654, 2398, 1876, 1654, 1543],
        backgroundColor: '#3B82F6',
        borderColor: '#1D4ED8',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  // Dữ liệu mẫu cho biểu đồ sinh viên At-Risk
  const atRiskData = {
    labels: ['CNTT', 'Công Nghệ', 'Y-Dược', 'Kinh tế', 'Ngoại ngữ', 'Luật', 'Kỹ thuật'],
    datasets: [
      {
        label: 'Tỉ lệ At-Risk (%)',
        data: [12.5, 15.2, 8.7, 18.3, 14.6, 16.8, 13.9],
        backgroundColor: '#F59E0B',
        borderColor: '#D97706',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          font: { size: 12 },
          color: '#6b7280'
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: { size: 12 },
          color: '#6b7280'
        }
      }
    }
  };

  const handleViewStudentList = () => {
    setShowStudentList(true);
  };

  return (
    <AdminLayout 
      activePage="/admin/students"
      onNavigate={handleNavigation}
    >
      <div className="space-y-8">
        {/* Page Title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý Sinh viên</h1>
            <p className="text-gray-600">Theo dõi và quản lý thông tin sinh viên trong hệ thống</p>
          </div>
          <button 
            onClick={handleViewStudentList}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm cursor-pointer"
          >
            <i className="fas fa-list mr-2"></i>
            Xem danh sách sinh viên
          </button>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 mb-1">Sinh viên đang trực tuyến</p>
                  <p className="text-3xl font-bold text-green-600">47</p>
                  <p className="text-sm text-green-600 mt-1">trên tổng 18,247</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-users text-green-600 text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700 mb-1">Sinh viên bị cảnh báo</p>
                  <p className="text-3xl font-bold text-orange-600">81</p>
                  <p className="text-sm text-orange-600 font-medium mt-1">
                    <i className="fas fa-arrow-up mr-1"></i>
                    +68% so với tháng trước
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-exclamation-triangle text-orange-600 text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 mb-1">Sinh viên cần hỗ trợ</p>
                  <p className="text-3xl font-bold text-blue-600">36</p>
                  <p className="text-sm text-green-600 font-medium mt-1">
                    <i className="fas fa-arrow-down mr-1"></i>
                    -12% so với tháng trước
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-hands-helping text-blue-600 text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Số lượng sinh viên theo từng khoa</h3>
              <div className="h-80">
                <Bar data={facultyData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tỉ lệ sinh viên At-Risk (%)</h3>
              <div className="h-80">
                <Bar data={atRiskData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section: Rankings and News */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Top Performing Students */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Bảng xếp hạng sinh viên hàng đầu</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-sm">1</div>
                  <img src="/src/assets/parent/avatarJohnSmith.png" alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Nguyễn Văn An</p>
                    <p className="text-sm text-gray-600">CNTT - K19</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">9.8</p>
                    <p className="text-xs text-gray-500">GPA</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold text-sm">2</div>
                  <img src="/src/assets/parent/avatarJohnSmith.png" alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Trần Thị Bình</p>
                    <p className="text-sm text-gray-600">Y-Dược - K18</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">9.7</p>
                    <p className="text-xs text-gray-500">GPA</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">3</div>
                  <img src="/src/assets/parent/avatarJohnSmith.png" alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Lê Văn Cường</p>
                    <p className="text-sm text-gray-600">Kinh tế - K19</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">9.6</p>
                    <p className="text-xs text-gray-500">GPA</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-white font-bold text-sm">4</div>
                  <img src="/src/assets/parent/avatarJohnSmith.png" alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Phạm Thị Diệu</p>
                    <p className="text-sm text-gray-600">Ngoại ngữ - K18</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">9.5</p>
                    <p className="text-xs text-gray-500">GPA</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-white font-bold text-sm">5</div>
                  <img src="/src/assets/parent/avatarJohnSmith.png" alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Hoàng Văn Em</p>
                    <p className="text-sm text-gray-600">Luật - K19</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">9.4</p>
                    <p className="text-xs text-gray-500">GPA</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Latest News */}
          <Card className="xl:col-span-2">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Tin tức & Thông báo mới nhất</h3>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium cursor-pointer">
                  Xem tất cả
                </button>
              </div>
              <div className="space-y-6">
                <div className="flex space-x-4 pb-4 border-b border-gray-200">
                  <img src="/src/assets/admin/5d6fda70fe61b938e47091015a6e5f70016b6c75.png" alt="News" className="w-16 h-16 rounded-lg object-cover" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">Thông báo về lịch thi cuối kỳ Học kỳ 1 năm 2024-2025</h4>
                    <p className="text-sm text-gray-600 mb-2">Phòng Đào tạo thông báo lịch thi cuối kỳ cho các khoa, sinh viên chuẩn bị...</p>
                    <div className="flex items-center text-xs text-gray-500">
                      <i className="fas fa-calendar mr-1"></i>
                      <span>15/12/2024</span>
                      <span className="mx-2">•</span>
                      <i className="fas fa-user mr-1"></i>
                      <span>Phòng Đào tạo</span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4 pb-4 border-b border-gray-200">
                  <img src="/src/assets/admin/673988bc9b570897adeb6b724f12bd47aacf1332.png" alt="News" className="w-16 h-16 rounded-lg object-cover" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">Chương trình học bổng xuất sắc dành cho sinh viên</h4>
                    <p className="text-sm text-gray-600 mb-2">Trường mở chương trình học bổng khuyến khích học tập cho sinh viên có thành tích...</p>
                    <div className="flex items-center text-xs text-gray-500">
                      <i className="fas fa-calendar mr-1"></i>
                      <span>12/12/2024</span>
                      <span className="mx-2">•</span>
                      <i className="fas fa-user mr-1"></i>
                      <span>Phòng CTSV</span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4 pb-4 border-b border-gray-200">
                  <img src="/src/assets/admin/673a21b0bcb1737814e7851c1ffb97ccd465924a.png" alt="News" className="w-16 h-16 rounded-lg object-cover" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">Hội thảo "Xu hướng Công nghệ 2025"</h4>
                    <p className="text-sm text-gray-600 mb-2">Khoa CNTT tổ chức hội thảo chuyên đề về các xu hướng công nghệ mới...</p>
                    <div className="flex items-center text-xs text-gray-500">
                      <i className="fas fa-calendar mr-1"></i>
                      <span>10/12/2024</span>
                      <span className="mx-2">•</span>
                      <i className="fas fa-user mr-1"></i>
                      <span>Khoa CNTT</span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <img src="/src/assets/admin/c47870bf01f989650eaadfebe75f1949340dd812.png" alt="News" className="w-16 h-16 rounded-lg object-cover" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">Khai mạc Ngày hội Việc làm 2024</h4>
                    <p className="text-sm text-gray-600 mb-2">Sự kiện kết nối sinh viên với các doanh nghiệp hàng đầu trong khu vực...</p>
                    <div className="flex items-center text-xs text-gray-500">
                      <i className="fas fa-calendar mr-1"></i>
                      <span>08/12/2024</span>
                      <span className="mx-2">•</span>
                      <i className="fas fa-user mr-1"></i>
                      <span>Phòng CTSV</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}