import { useState, useRef } from "react";
import AdminLayout from "@/components/ui/admin/AdminLayout";
import { Card, CardContent } from "../../components/ui/card";
import TeacherProfileHeader from "@/components/ui/admin/TeacherProfileHeader";
import TeacherTabNavigation from "@/components/ui/admin/TeacherTabNavigation";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

type SupportRequest = {
  id: string;
  requestCode: string;
  type: 'student-contact' | 'technical' | 'academic' | 'other';
  title: string;
  description: string;
  createdDate: string;
  priority: 'high' | 'medium' | 'low';
  assignee: string;
  status: 'completed' | 'processing' | 'pending';
  completedDate?: string;
};

type SupportFilter = {
  status: string;
  requestType: string;
  priority: string;
  dateRange: string;
  keyword: string;
};

const TeacherSupportHistory = () => {
  console.log('TeacherSupportHistory component rendered');
  const chartRef = useRef<ChartJS<'bar'> | null>(null);

  const [filters, setFilters] = useState<SupportFilter>({
    status: 'all',
    requestType: 'all',
    priority: 'all',
    dateRange: 'all',
    keyword: ''
  });

  // Mock data
  const supportRequests: SupportRequest[] = [
    {
      id: "1",
      requestCode: "REQ-001",
      type: "student-contact",
      title: "Học sinh không thể truy cập bài tập",
      description: "Học sinh Nguyễn Văn A báo cáo không thể mở bài tập chương 3",
      createdDate: "2024-01-15",
      priority: "high",
      assignee: "Admin System",
      status: "completed",
      completedDate: "2024-01-16"
    },
    {
      id: "2",
      requestCode: "REQ-002", 
      type: "technical",
      title: "Lỗi tải video bài giảng",
      description: "Video bài giảng chương 5 không thể phát được",
      createdDate: "2024-01-14",
      priority: "medium",
      assignee: "Technical Team",
      status: "processing"
    },
    {
      id: "3",
      requestCode: "REQ-003",
      type: "academic",
      title: "Yêu cầu điều chỉnh điểm số",
      description: "Cần điều chỉnh điểm kiểm tra cho học sinh Trần Thị B",
      createdDate: "2024-01-13",
      priority: "low",
      assignee: "Academic Team",
      status: "pending"
    }
  ];

  const handleFilterChange = (filterKey: keyof SupportFilter, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
  };

  // Chart data for status distribution
  const statusChartData = {
    labels: ['Đã xử lý', 'Đang xử lý', 'Chờ xử lý'],
    datasets: [
      {
        data: [12, 8, 5],
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
        borderWidth: 0
      }
    ]
  };

  // Chart data for monthly requests
  const monthlyChartData = {
    labels: ['Tháng 10', 'Tháng 11', 'Tháng 12', 'Tháng 1'],
    datasets: [
      {
        label: 'Số yêu cầu hỗ trợ',
        data: [15, 20, 18, 25],
        backgroundColor: '#3b82f6',
        borderColor: '#2563eb',
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    }
  };

  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12
          }
        }
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      'completed': 'bg-green-100 text-green-800',
      'processing': 'bg-yellow-100 text-yellow-800', 
      'pending': 'bg-red-100 text-red-800'
    };
    const labels = {
      'completed': 'Đã xử lý',
      'processing': 'Đang xử lý',
      'pending': 'Chờ xử lý'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status as keyof typeof badges]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const badges = {
      'high': 'bg-red-100 text-red-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'low': 'bg-green-100 text-green-800'
    };
    const labels = {
      'high': 'Cao',
      'medium': 'Trung bình', 
      'low': 'Thấp'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[priority as keyof typeof badges]}`}>
        {labels[priority as keyof typeof labels]}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const badges = {
      'student-contact': 'bg-blue-100 text-blue-800',
      'technical': 'bg-purple-100 text-purple-800',
      'academic': 'bg-indigo-100 text-indigo-800',
      'other': 'bg-gray-100 text-gray-800'
    };
    const labels = {
      'student-contact': 'Liên hệ học sinh',
      'technical': 'Kỹ thuật',
      'academic': 'Học thuật',
      'other': 'Khác'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[type as keyof typeof badges]}`}>
        {labels[type as keyof typeof labels]}
      </span>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <TeacherProfileHeader />
        <TeacherTabNavigation activeTab="Lịch sử hỗ trợ" />
        
        {/* Filter Section */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-4 items-center">
                <div>
                  <select 
                    className="border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs text-gray-700 cursor-pointer"
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <option value="all" className="text-gray-600">Tất cả trạng thái</option>
                    <option value="completed" className="text-gray-600">Đã xử lý</option>
                    <option value="processing" className="text-gray-600">Đang xử lý</option>
                    <option value="pending" className="text-gray-600">Chờ xử lý</option>
                  </select>
                </div>
                
                <div>
                  <select 
                    className="border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs text-gray-700 cursor-pointer"
                    value={filters.requestType}
                    onChange={(e) => handleFilterChange('requestType', e.target.value)}
                  >
                    <option value="all" className="text-gray-600">Tất cả loại yêu cầu</option>
                    <option value="student-contact" className="text-gray-600">Liên hệ học sinh</option>
                    <option value="technical" className="text-gray-600">Kỹ thuật</option>
                    <option value="academic" className="text-gray-600">Học thuật</option>
                    <option value="other" className="text-gray-600">Khác</option>
                  </select>
                </div>
                
                <div>
                  <select 
                    className="border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs text-gray-700 cursor-pointer"
                    value={filters.priority}
                    onChange={(e) => handleFilterChange('priority', e.target.value)}
                  >
                    <option value="all" className="text-gray-600">Tất cả mức độ ưu tiên</option>
                    <option value="high" className="text-gray-600">Cao</option>
                    <option value="medium" className="text-gray-600">Trung bình</option>
                    <option value="low" className="text-gray-600">Thấp</option>
                  </select>
                </div>
                
                <div>
                  <select 
                    className="border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs text-gray-700 cursor-pointer"
                    value={filters.dateRange}
                    onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                  >
                    <option value="all" className="text-gray-600">Tất cả thời gian</option>
                    <option value="today" className="text-gray-600">Hôm nay</option>
                    <option value="week" className="text-gray-600">Tuần này</option>
                    <option value="month" className="text-gray-600">Tháng này</option>
                    <option value="quarter" className="text-gray-600">Quý này</option>
                  </select>
                </div>
                
                <div className="flex-1 min-w-[200px]">
                  <input 
                    type="text" 
                    placeholder="Tìm kiếm theo từ khóa..." 
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs text-gray-700"
                    value={filters.keyword}
                    onChange={(e) => handleFilterChange('keyword', e.target.value)}
                  />
                </div>
              </div>
              
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center whitespace-nowrap cursor-pointer">
                <i className="fas fa-plus mr-2"></i>
                Tạo yêu cầu hỗ trợ mới
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6 bg-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-800">Tổng yêu cầu</p>
                  <p className="text-2xl font-bold text-blue-900">25</p>
                </div>
                <div className="h-12 w-12 bg-blue-200 rounded-lg flex items-center justify-center">
                  <i className="fas fa-headset text-blue-600 text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 bg-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-800">Đã xử lý</p>
                  <p className="text-2xl font-bold text-green-900">12</p>
                </div>
                <div className="h-12 w-12 bg-green-200 rounded-lg flex items-center justify-center">
                  <i className="fas fa-check-circle text-green-600 text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 bg-yellow-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-800">Đang xử lý</p>
                  <p className="text-2xl font-bold text-yellow-900">8</p>
                </div>
                <div className="h-12 w-12 bg-yellow-200 rounded-lg flex items-center justify-center">
                  <i className="fas fa-clock text-yellow-600 text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 bg-red-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-800">Chờ xử lý</p>
                  <p className="text-2xl font-bold text-red-900">5</p>
                </div>
                <div className="h-12 w-12 bg-red-200 rounded-lg flex items-center justify-center">
                  <i className="fas fa-exclamation-triangle text-red-600 text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Phân bố theo trạng thái</h3>
              <div className="h-48 w-full">
                <Doughnut data={statusChartData} options={doughnutChartOptions} />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Xu hướng theo tháng</h3>
              <div className="h-64">
                <Bar ref={chartRef} data={monthlyChartData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Support Requests Table */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Danh sách yêu cầu hỗ trợ</h3>
              <div className="text-sm text-gray-600">
                Hiển thị {supportRequests.length} trên tổng số 25 yêu cầu
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Mã yêu cầu</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Loại</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Tiêu đề</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Ngày tạo</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Mức độ ưu tiên</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Người xử lý</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Trạng thái</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {supportRequests.map((request) => (
                    <tr key={request.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900 font-medium">{request.requestCode}</td>
                      <td className="py-3 px-4 text-sm">{getTypeBadge(request.type)}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">{request.title}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{request.createdDate}</td>
                      <td className="py-3 px-4 text-sm">{getPriorityBadge(request.priority)}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{request.assignee}</td>
                      <td className="py-3 px-4 text-sm">{getStatusBadge(request.status)}</td>
                      <td className="py-3 px-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-800 text-xs cursor-pointer">
                            <i className="fas fa-eye mr-1"></i>
                            Xem
                          </button>
                          <button className="text-green-600 hover:text-green-800 text-xs cursor-pointer">
                            <i className="fas fa-edit mr-1"></i>
                            Sửa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                Hiển thị 1-3 trên 25 kết quả
              </div>
              <div className="flex items-center space-x-2">
                <button className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50 cursor-pointer">
                  Trước
                </button>
                <button className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm cursor-pointer">
                  1
                </button>
                <button className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50 cursor-pointer">
                  2
                </button>
                <button className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50 cursor-pointer">
                  3
                </button>
                <button className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50 cursor-pointer">
                  Sau
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default TeacherSupportHistory;