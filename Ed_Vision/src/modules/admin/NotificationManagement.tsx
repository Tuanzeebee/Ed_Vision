import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import AdminLayout from "@/components/ui/admin/AdminLayout";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function NotificationManagement() {
  const [newNotification, setNewNotification] = useState({
    title: '',
    content: '',
    priority: 'Trung bình',
    displayTime: '',
    target: 'Tất cả',
    files: null as FileList | null
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('Tất cả mức độ');
  const [targetFilter, setTargetFilter] = useState('Tất cả đối tượng');

  // Chart data
  const chartData = {
    labels: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'],
    datasets: [
      {
        label: 'Thông báo đã gửi',
        data: [12, 8, 15, 10, 18, 6, 9],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
        borderRadius: 4
      },
      {
        label: 'Thông báo đã đọc',
        data: [9, 6, 11, 8, 14, 4, 7],
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
        borderRadius: 4
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  // Sample notification data
  const notifications = [
    {
      id: 1,
      title: 'Thông báo về lịch thi cuối kỳ',
      description: 'Cập nhật lịch thi học kỳ I năm học 2024-2025',
      target: 'Sinh viên',
      priority: 'Cao',
      sentDate: '15/12/2024',
      readCount: 156,
      totalCount: 200,
      readRate: 78
    },
    {
      id: 2,
      title: 'Cập nhật quy định mới về học phí',
      description: 'Thông báo về việc điều chỉnh học phí năm học 2024-2025',
      target: 'Tất cả',
      priority: 'Trung bình',
      sentDate: '14/12/2024',
      readCount: 149,
      totalCount: 200,
      readRate: 74
    },
    {
      id: 3,
      title: 'Hội thảo khoa học quốc tế',
      description: 'Mời tham dự hội thảo khoa học quốc tế về AI trong giáo dục',
      target: 'Giảng viên',
      priority: 'Thấp',
      sentDate: '13/12/2024',
      readCount: 45,
      totalCount: 60,
      readRate: 75
    }
  ];

  const getPriorityBadgeClasses = (priority: string) => {
    switch (priority) {
      case 'Cao':
        return 'px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium';
      case 'Trung bình':
        return 'px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium';
      case 'Thấp':
        return 'px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full font-medium';
      default:
        return 'px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full font-medium';
    }
  };

  const getTargetBadgeClasses = (target: string) => {
    switch (target) {
      case 'Sinh viên':
        return 'px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium';
      case 'Giảng viên':
        return 'px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium';
      case 'Tất cả':
        return 'px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full font-medium';
      default:
        return 'px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full font-medium';
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewNotification(prev => ({
      ...prev,
      files: event.target.files
    }));
  };

  const handleSendNotification = () => {
    if (window.confirm('Bạn có chắc chắn muốn gửi thông báo này?')) {
      console.log('Sending notification:', newNotification);
      alert('Thông báo đã được gửi thành công!');
      // Reset form
      setNewNotification({
        title: '',
        content: '',
        priority: 'Trung bình',
        displayTime: '',
        target: 'Tất cả',
        files: null
      });
    }
  };

  const handleSaveDraft = () => {
    console.log('Saving draft:', newNotification);
    alert('Thông báo đã được lưu vào nháp!');
  };

  const handleView = (id: number) => {
    console.log('View notification:', id);
  };

  const handleEdit = (id: number) => {
    console.log('Edit notification:', id);
  };

  const handleDelete = (id: number) => {
    console.log('Delete notification:', id);
  };

  return (
    <AdminLayout>
      <div className="p-6 bg-gray-50 min-h-screen">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý Thông báo & Phản hồi</h1>
          <p className="text-gray-600">Tạo, gửi và theo dõi thông báo đến người dùng trong hệ thống</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            📥 Xuất báo cáo
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            ➕ Tạo thông báo mới
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 cursor-pointer hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Tổng số thông báo</p>
                <p className="text-3xl font-bold text-blue-900">245</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white text-xl">🔔</span>
              </div>
            </div>
          </CardContent>
        </Card>        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 cursor-pointer hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Đã đọc</p>
                <p className="text-3xl font-bold text-green-900">180</p>
                <p className="text-sm text-green-700 font-medium">75%</p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white text-xl">✅</span>
              </div>
            </div>
          </CardContent>
        </Card>        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 cursor-pointer hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Chưa đọc</p>
                <p className="text-3xl font-bold text-red-900">65</p>
                <p className="text-sm text-red-700 font-medium">27%</p>
              </div>
              <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white text-xl">❗</span>
              </div>
            </div>
          </CardContent>
        </Card>          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Thông báo hôm nay</p>
                  <p className="text-3xl font-bold text-blue-600">12</p>
                  <p className="text-sm text-blue-600 font-medium">+3 so với hôm qua</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-xl">📅</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart Section */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Thông báo trong 7 ngày gần nhất</h3>
            <div className="h-80 w-full">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Create New Notification Section */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Tạo thông báo mới</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tiêu đề thông báo</label>
                  <input 
                    type="text" 
                    placeholder="Nhập tiêu đề thông báo..." 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={newNotification.title}
                    onChange={(e) => setNewNotification(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung thông báo</label>
                  <textarea 
                    rows={4} 
                    placeholder="Nhập nội dung thông báo..." 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={newNotification.content}
                    onChange={(e) => setNewNotification(prev => ({ ...prev, content: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mức độ ưu tiên</label>
                  <select 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={newNotification.priority}
                    onChange={(e) => setNewNotification(prev => ({ ...prev, priority: e.target.value }))}
                  >
                    <option>Cao</option>
                    <option>Trung bình</option>
                    <option>Thấp</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Thời gian hiển thị</label>
                  <input 
                    type="datetime-local" 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={newNotification.displayTime}
                    onChange={(e) => setNewNotification(prev => ({ ...prev, displayTime: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Đối tượng nhận</label>
                  <select 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={newNotification.target}
                    onChange={(e) => setNewNotification(prev => ({ ...prev, target: e.target.value }))}
                  >
                    <option>Tất cả</option>
                    <option>Sinh viên</option>
                    <option>Giảng viên</option>
                    <option>Lãnh đạo</option>
                    <option>Phụ huynh</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">File đính kèm</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors cursor-pointer">
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <span className="text-gray-400 text-2xl mb-2 block">☁️</span>
                      <p className="text-sm text-gray-600">Kéo thả file hoặc <span className="text-blue-600 font-medium">chọn file</span></p>
                      <p className="text-xs text-gray-500 mt-1">Hỗ trợ: PDF, DOC, DOCX, JPG, PNG (tối đa 10MB)</p>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
              <button 
                onClick={handleSaveDraft}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                💾 Lưu nháp
              </button>
              <button 
                onClick={handleSendNotification}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                📧 Gửi thông báo
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Notification List */}
        <Card>
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Danh sách thông báo đã gửi</h3>
              <div className="flex items-center space-x-3">
                {/* Search Input with Icon */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-400 text-sm">🔍</span>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Tìm kiếm theo tiêu đề, nội dung..." 
                    className="border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                {/* Target Filter */}
                <select 
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={targetFilter}
                  onChange={(e) => setTargetFilter(e.target.value)}
                >
                  <option>Tất cả đối tượng</option>
                  <option>Sinh viên</option>
                  <option>Giảng viên</option>
                  <option>Lãnh đạo</option>
                  <option>Phụ huynh</option>
                </select>
                
                {/* Priority Filter */}
                <select 
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <option>Tất cả mức độ</option>
                  <option>Cao</option>
                  <option>Trung bình</option>
                  <option>Thấp</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tiêu đề thông báo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đối tượng nhận</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mức độ ưu tiên</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày gửi</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tỉ lệ đọc</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <tr key={notification.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-blue-500 mr-3">🔔</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{notification.title}</div>
                          <div className="text-sm text-gray-500">{notification.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getTargetBadgeClasses(notification.target)}>{notification.target}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getPriorityBadgeClasses(notification.priority)}>{notification.priority}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{notification.sentDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">{notification.readCount}/{notification.totalCount}</div>
                        <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${notification.readRate}%` }}
                          />
                        </div>
                        <span className="ml-2 text-sm text-green-600 font-medium">{notification.readRate}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleView(notification.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          👁️
                        </button>
                        <button 
                          onClick={() => handleEdit(notification.id)}
                          className="text-yellow-600 hover:text-yellow-900"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => handleDelete(notification.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Hiển thị <span className="font-medium">1</span> đến <span className="font-medium">3</span> trong tổng số <span className="font-medium">245</span> thông báo
              </div>
              <div className="flex items-center space-x-2">
                <button className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors font-medium">Trước</button>
                <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm cursor-pointer font-medium">1</button>
                <button className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors font-medium">2</button>
                <button className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors font-medium">3</button>
                <button className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors font-medium">4</button>
                <button className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors font-medium">5</button>
                <span className="px-2 text-sm text-gray-500 font-medium">...</span>
                <button className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors font-medium">25</button>
                <button className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors font-medium">Sau</button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}