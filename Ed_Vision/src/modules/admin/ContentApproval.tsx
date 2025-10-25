import { Card, CardContent } from "@/components/ui/card";
import AdminLayout from "../../components/ui/admin/AdminLayout";
import LoadingSpinner from "../../components/ui/admin/LoadingSpinner";
import { useState, useMemo, useCallback, memo, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type TooltipItem,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// ✅ Chart tách riêng, chỉ render 1 lần (trừ khi bạn đổi props)
const ApprovalChart = memo(function ApprovalChart() {
  const data = useMemo(() => ({
    labels: ['15/07','16/07','17/07','18/07','19/07','20/07','21/07'],
    datasets: [
      { label: 'Đã phê duyệt', data: [12,15,18,14,16,20,12], backgroundColor: '#10b981', borderColor: '#059669', borderWidth: 1 },
      { label: 'Đã từ chối',   data: [2,3,1,4,2,1,3],       backgroundColor: '#ef4444', borderColor: '#dc2626', borderWidth: 1 },
      { label: 'Đang chờ',     data: [5,8,6,7,9,4,8],       backgroundColor: '#f59e0b', borderColor: '#d97706', borderWidth: 1 },
    ]
  }), []); // ⬅️ không phụ thuộc state filter

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 0 },       // ⬅️ tắt animation hoàn toàn
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { usePointStyle: true, padding: 20, font: { size: 12, weight: 500 as const } }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleColor: '#fff', bodyColor: '#fff',
        borderColor: '#e5e7eb', borderWidth: 1, cornerRadius: 8, displayColors: true,
        callbacks: {
          label: (ctx: TooltipItem<'bar'>) =>
            `${ctx.dataset.label || ''}: ${ctx.parsed.y} nội dung`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.1)', drawBorder: false },
        ticks: { font: { size: 12 }, color: '#6b7280', callback: (v: unknown) => `${v} nội dung` },
        title: { display: true, text: 'Số lượng nội dung', font: { size: 14, weight: 600 as const }, color: '#374151' }
      },
      x: {
        grid: { color: 'rgba(0,0,0,0.1)', drawBorder: false },
        ticks: { font: { size: 12 }, color: '#6b7280' },
        title: { display: true, text: 'Ngày', font: { size: 14, weight: 600 as const }, color: '#374151' }
      }
    },
    interaction: { intersect: false, mode: 'index' as const }
  }), []); // ⬅️ giữ ổn định

  return <Bar data={data} options={options} />;
});

export default function ContentApproval() {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'history'>('pending');
  
  // Filter states
  const [contentTypeFilter, setContentTypeFilter] = useState('Tất cả loại');
  const [departmentFilter, setDepartmentFilter] = useState('Tất cả khoa');
  const [priorityFilter, setPriorityFilter] = useState('Tất cả độ ưu tiên');
  const [authorFilter, setAuthorFilter] = useState('Tất cả tác giả');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const contentData = useMemo(() => [
    {
      id: 1,
      title: "Đề cương ôn tập Toán cao cấp",
      description: "Chương 1-5, Giải tích và Đại số",
      type: "Tài liệu học tập",
      typeColor: "blue",
      icon: "📄",
      author: "Nguyễn Văn A",
      avatar: "/src/assets/admin/user1.jpg",
      department: "Toán học",
      createdDate: "21/07/2024",
      waitingTime: "2 giờ",
      waitingColor: "red",
      priority: "Cao",
      priorityColor: "red"
    },
    {
      id: 2,
      title: "Bài giảng Lập trình hướng đối tượng",
      description: "Chương 3: Kế thừa và Đa hình",
      type: "Bài giảng",
      typeColor: "green",
      icon: "📊",
      author: "Trần Thị B",
      avatar: "/src/assets/admin/user2.jpg",
      department: "CNTT",
      createdDate: "20/07/2024",
      waitingTime: "1 ngày",
      waitingColor: "yellow",
      priority: "Trung bình",
      priorityColor: "yellow"
    },
    {
      id: 3,
      title: "Đề thi Kinh tế vi mô",
      description: "Kỳ thi cuối kỳ - Học kỳ 1",
      type: "Đề thi",
      typeColor: "purple",
      icon: "📝",
      author: "Lê Văn C",
      avatar: "/src/assets/admin/user3.jpg",
      department: "Kinh tế",
      createdDate: "19/07/2024",
      waitingTime: "2 ngày",
      waitingColor: "orange",
      priority: "Cao",
      priorityColor: "red"
    },
    {
      id: 4,
      title: "Bài tập Cơ sở dữ liệu",
      description: "Thiết kế ERD và SQL queries",
      type: "Bài tập",
      typeColor: "orange",
      icon: "📋",
      author: "Phạm Thị D",
      avatar: "/src/assets/admin/user4.jpg",
      department: "CNTT",
      createdDate: "18/07/2024",
      waitingTime: "3 ngày",
      waitingColor: "red",
      priority: "Thấp",
      priorityColor: "gray"
    },
    {
      id: 5,
      title: "Video bài giảng Tiếng Anh chuyên ngành",
      description: "Unit 5: Business Communication",
      type: "Video bài giảng",
      typeColor: "red",
      icon: "🎥",
      author: "Hoàng Văn E",
      avatar: "/src/assets/admin/user5.jpg",
      department: "Ngoại ngữ",
      createdDate: "17/07/2024",
      waitingTime: "4 ngày",
      waitingColor: "red",
      priority: "Trung bình",
      priorityColor: "yellow"
    }
  ], []);

  // Memoized handlers for better performance
  const handleContentTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setContentTypeFilter(e.target.value);
  }, []);
  
  const handleAuthorChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setAuthorFilter(e.target.value);
  }, []);
  
  const handleDepartmentChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setDepartmentFilter(e.target.value);
  }, []);
  
  const handlePriorityChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setPriorityFilter(e.target.value);
  }, []);
  
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);
  
  const handleReset = useCallback(() => {
    setContentTypeFilter('Tất cả loại');
    setAuthorFilter('Tất cả tác giả');
    setDepartmentFilter('Tất cả khoa');
    setPriorityFilter('Tất cả độ ưu tiên');
    setSearchTerm('');
  }, []);
  
  // Filter logic with loading state
  const [filteredContent, setFilteredContent] = useState(contentData);
  
  useEffect(() => {
    setIsLoading(true);
    
    const filterTimeout = setTimeout(() => {
      const filtered = contentData.filter(content => {
        const matchesSearch = searchTerm === '' || 
          content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          content.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          content.author.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesType = contentTypeFilter === 'Tất cả loại' || content.type === contentTypeFilter;
        const matchesDepartment = departmentFilter === 'Tất cả khoa' || content.department === departmentFilter;
        const matchesPriority = priorityFilter === 'Tất cả độ ưu tiên' || content.priority === priorityFilter;
        const matchesAuthor = authorFilter === 'Tất cả tác giả' || content.author === authorFilter;
        
        return matchesSearch && matchesType && matchesDepartment && matchesPriority && matchesAuthor;
      });
      
      setFilteredContent(filtered);
      setIsLoading(false);
    }, 500); // 500ms delay để thấy rõ loading effect
    
    return () => clearTimeout(filterTimeout);
  }, [contentTypeFilter, departmentFilter, priorityFilter, authorFilter, searchTerm, contentData]);

  const getTabClasses = (tab: string) => {
    const isActive = activeTab === tab;
    let colorClass = 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300';
    
    if (isActive) {
      switch (tab) {
        case 'pending':
          colorClass = 'border-yellow-500 text-yellow-600';
          break;
        case 'approved':
          colorClass = 'border-green-500 text-green-600';
          break;
        case 'rejected':
          colorClass = 'border-red-500 text-red-600';
          break;
        case 'history':
          colorClass = 'border-blue-500 text-blue-600';
          break;
      }
    }
    
    return `border-b-2 py-2 px-1 text-sm font-medium flex items-center ${colorClass}`;
  };

  const getBadgeClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium';
      case 'green':
        return 'px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium';
      case 'purple':
        return 'px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium';
      case 'orange':
        return 'px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full font-medium';
      case 'red':
        return 'px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium';
      case 'yellow':
        return 'px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium';
      case 'gray':
        return 'px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full font-medium';
      default:
        return 'px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full font-medium';
    }
  };

  const handleApprove = (id: number) => {
    if (confirm('Bạn có chắc chắn muốn phê duyệt nội dung này?')) {
      console.log('Approved content', id);
    }
  };

  const handleReject = (id: number) => {
    if (confirm('Bạn có chắc chắn muốn từ chối nội dung này?')) {
      console.log('Rejected content', id);
    }
  };

  const handleViewDetails = (id: number) => {
    console.log('View content details', id);
  };

  return (
    <AdminLayout>
      <div className="p-6 bg-gray-50 overflow-y-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Phê duyệt Nội dung</h1>
          <p className="text-gray-600">Quản lý và phê duyệt nội dung học tập do giảng viên gửi lên</p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button 
                onClick={() => setActiveTab('pending')}
                className={getTabClasses('pending')}
              >
                🕐 Chờ phê duyệt
                <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">24</span>
              </button>
              <button 
                onClick={() => setActiveTab('approved')}
                className={getTabClasses('approved')}
              >
                ✅ Đã phê duyệt
                <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">156</span>
              </button>
              <button 
                onClick={() => setActiveTab('rejected')}
                className={getTabClasses('rejected')}
              >
                ❌ Đã từ chối
                <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">32</span>
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={getTabClasses('history')}
              >
                📜 Lịch sử phê duyệt
              </button>
            </nav>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Pending Approval */}
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-yellow-700">Chờ phê duyệt</p>
                  <p className="text-2xl font-bold text-yellow-900 mt-1">24</p>
                  <div className="flex items-center mt-1">
                    <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
                      ⚠️ Cần xử lý
                    </span>
                  </div>
                </div>
                <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white text-lg">🕐</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Approved */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-green-700">Đã phê duyệt</p>
                  <p className="text-2xl font-bold text-green-900 mt-1">156</p>
                  <div className="flex items-center mt-1">
                    <span className="text-green-600 text-xs font-medium">
                      ↗️ +12 hôm nay
                    </span>
                  </div>
                </div>
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white text-lg">✅</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rejected */}
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-red-700">Đã từ chối</p>
                  <p className="text-2xl font-bold text-red-900 mt-1">32</p>
                  <div className="flex items-center mt-1">
                    <span className="text-red-600 text-xs font-medium">
                      ↗️ +3 hôm nay
                    </span>
                  </div>
                </div>
                <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white text-lg">❌</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trend Chart */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Xu hướng phê duyệt (7 ngày gần nhất)</h3>
            <div className="h-80 w-full">
              <ApprovalChart /> {/* ⬅️ thay Bar data={chartData} options={chartOptions} */}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <h3 className="text-base font-semibold text-gray-800 mb-3">Bộ lọc nội dung</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Loại nội dung</label>
                <select 
                  value={contentTypeFilter}
                  onChange={handleContentTypeChange}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-800 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option>Tất cả loại</option>
                  <option>Tài liệu học tập</option>
                  <option>Bài giảng</option>
                  <option>Đề thi</option>
                  <option>Bài tập</option>
                  <option>Video bài giảng</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Người tạo</label>
                <select 
                  value={authorFilter}
                  onChange={handleAuthorChange}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-800 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option>Tất cả tác giả</option>
                  <option>Nguyễn Văn A</option>
                  <option>Trần Thị B</option>
                  <option>Lê Văn C</option>
                  <option>Phạm Thị D</option>
                  <option>Hoàng Văn E</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Khoa/Bộ môn</label>
                <select 
                  value={departmentFilter}
                  onChange={handleDepartmentChange}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-800 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option>Tất cả khoa</option>
                  <option>CNTT</option>
                  <option>Toán học</option>
                  <option>Kinh tế</option>
                  <option>Ngoại ngữ</option>
                  <option>Y Dược</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Độ ưu tiên</label>
                <select 
                  value={priorityFilter}
                  onChange={handlePriorityChange}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-800 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option>Tất cả độ ưu tiên</option>
                  <option>Cao</option>
                  <option>Trung bình</option>
                  <option>Thấp</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tìm kiếm</label>
                <input 
                  type="text" 
                  placeholder="Từ khóa..." 
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-gray-800 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-end">
                <button 
                  onClick={handleReset}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-2 py-1.5 rounded-md font-medium transition-colors cursor-pointer text-xs whitespace-nowrap"
                >
                  🔄 Đặt lại
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content List */}
        <Card>
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Danh sách nội dung cần phê duyệt</h3>
            <p className="text-sm text-gray-600 mt-1">
              {filteredContent.length} nội dung đang chờ xử lý
            </p>
          </div>
          
          <div className="overflow-x-auto relative" style={{ minHeight: isLoading ? '200px' : 'auto' }}>
            {/* Loading overlay for table */}
            {isLoading && (
              <LoadingSpinner 
                text="Đang tải dữ liệu..." 
                size="md" 
                position="top" 
              />
            )}
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nội dung</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tác giả</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khoa</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chờ</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ưu tiên</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {!isLoading && filteredContent.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-8 text-center">
                      <div className="text-gray-500">
                        <span className="text-2xl mb-2 block">🔍</span>
                        <p className="text-sm">Không tìm thấy nội dung phù hợp với bộ lọc</p>
                      </div>
                    </td>
                  </tr>
                ) : !isLoading ? (
                  filteredContent.map((content) => (
                  <tr key={content.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="mr-2 text-base">{content.icon}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-gray-900 truncate">{content.title}</p>
                          <p className="text-xs text-gray-500 truncate">{content.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={getBadgeClasses(content.typeColor)}>{content.type}</span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center mr-1">
                          <span className="text-xs font-medium text-gray-600">
                            {content.author.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <span className="text-xs text-gray-900">{content.author}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-900 whitespace-nowrap">{content.department}</td>
                    <td className="px-3 py-2 text-xs text-gray-900 whitespace-nowrap">{content.createdDate}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={getBadgeClasses(content.waitingColor)}>{content.waitingTime}</span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={getBadgeClasses(content.priorityColor)}>{content.priority}</span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center space-x-0.5">
                        <button 
                          onClick={() => handleApprove(content.id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-1.5 py-0.5 rounded text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
                        >
                          ✓
                        </button>
                        <button 
                          onClick={() => handleReject(content.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-1.5 py-0.5 rounded text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
                        >
                          ✗
                        </button>
                        <button 
                          onClick={() => handleViewDetails(content.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-1.5 py-0.5 rounded text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
                        >
                          👁️
                        </button>
                      </div>
                    </td>
                  </tr>
                  ))
                ) : null}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-white px-6 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <p className="text-sm text-gray-700">
                  Hiển thị <span className="font-medium">1</span> đến <span className="font-medium">5</span> trong tổng số <span className="font-medium">24</span> kết quả
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer">
                  Trước
                </button>
                <button className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 border border-blue-600 rounded-md cursor-pointer">
                  1
                </button>
                <button className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer">
                  2
                </button>
                <button className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer">
                  3
                </button>
                <button className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer">
                  Sau
                </button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}