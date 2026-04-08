import { Card, CardContent } from "@/components/ui/card";
import AdminLayout from "../../components/ui/admin/AdminLayout";
import LoadingSpinner from "../../components/ui/admin/LoadingSpinner";
import ConfirmDialog from "../../components/ui/admin/ConfirmDialog";
import ContentDetailModal from "../../components/ui/admin/ContentDetailModal";
import TimeFilter from "../../components/ui/admin/TimeFilter";
import { 
  majorsBySchool, 
  classesBySchoolAndMajor
} from '@/lib/leadershipReportsConstants';
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

// ✅ Chart với props động theo timeFilter
const ApprovalChart = memo(function ApprovalChart({ timeFilter }: { timeFilter: string }) {
  // Generate chart data based on timeFilter
  const getChartData = useMemo(() => {
    const now = new Date();
    
    switch (timeFilter) {
      case 'hôm-nay': {
        // 0h - 24h (chia theo 4 tiếng một)
        const labels = ['0h-4h', '4h-8h', '8h-12h', '12h-16h', '16h-20h', '20h-24h'];
        return {
          labels,
          datasets: [
            { 
              label: 'Đã phê duyệt', 
              data: [3, 5, 8, 12, 6, 2], 
              backgroundColor: '#10b981', 
              borderColor: '#059669', 
              borderWidth: 1 
            },
            { 
              label: 'Đã từ chối', 
              data: [1, 0, 2, 1, 1, 0], 
              backgroundColor: '#ef4444', 
              borderColor: '#dc2626', 
              borderWidth: 1 
            },
            { 
              label: 'Đang chờ', 
              data: [2, 3, 5, 4, 3, 1], 
              backgroundColor: '#f59e0b', 
              borderColor: '#d97706', 
              borderWidth: 1 
            },
          ],
          maxY: 100
        };
      }
      
      case 'tuần-này': {
        // Thứ 2 - Chủ nhật với ngày
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Thứ 2
        
        const labels = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'].map((day, index) => {
          const date = new Date(startOfWeek);
          date.setDate(startOfWeek.getDate() + index);
          return `${day}\n${date.getDate()}/${date.getMonth() + 1}`;
        });
        
        return {
          labels,
          datasets: [
            { 
              label: 'Đã phê duyệt', 
              data: [45, 52, 48, 55, 60, 38, 25], 
              backgroundColor: '#10b981', 
              borderColor: '#059669', 
              borderWidth: 1 
            },
            { 
              label: 'Đã từ chối', 
              data: [8, 6, 10, 7, 5, 9, 4], 
              backgroundColor: '#ef4444', 
              borderColor: '#dc2626', 
              borderWidth: 1 
            },
            { 
              label: 'Đang chờ', 
              data: [15, 18, 20, 16, 22, 12, 8], 
              backgroundColor: '#f59e0b', 
              borderColor: '#d97706', 
              borderWidth: 1 
            },
          ],
          maxY: 500
        };
      }
      
      case 'tháng-này': {
        // Tuần 1 - Tuần 4
        const labels = ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'];
        return {
          labels,
          datasets: [
            { 
              label: 'Đã phê duyệt', 
              data: [280, 320, 295, 350], 
              backgroundColor: '#10b981', 
              borderColor: '#059669', 
              borderWidth: 1 
            },
            { 
              label: 'Đã từ chối', 
              data: [35, 42, 38, 45], 
              backgroundColor: '#ef4444', 
              borderColor: '#dc2626', 
              borderWidth: 1 
            },
            { 
              label: 'Đang chờ', 
              data: [85, 95, 78, 90], 
              backgroundColor: '#f59e0b', 
              borderColor: '#d97706', 
              borderWidth: 1 
            },
          ],
          maxY: 1000
        };
      }
      
      case 'tất-cả': {
        // Tháng 1, 3, 6, 9, 12
        const labels = ['Tháng 1', 'Tháng 3', 'Tháng 6', 'Tháng 9', 'Tháng 12'];
        return {
          labels,
          datasets: [
            { 
              label: 'Đã phê duyệt', 
              data: [1200, 1450, 1680, 1520, 1890], 
              backgroundColor: '#10b981', 
              borderColor: '#059669', 
              borderWidth: 1 
            },
            { 
              label: 'Đã từ chối', 
              data: [180, 220, 195, 210, 245], 
              backgroundColor: '#ef4444', 
              borderColor: '#dc2626', 
              borderWidth: 1 
            },
            { 
              label: 'Đang chờ', 
              data: [340, 380, 420, 395, 450], 
              backgroundColor: '#f59e0b', 
              borderColor: '#d97706', 
              borderWidth: 1 
            },
          ],
          maxY: 10000
        };
      }
      
      default:
        return {
          labels: ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'],
          datasets: [
            { label: 'Đã phê duyệt', data: [280, 320, 295, 350], backgroundColor: '#10b981', borderColor: '#059669', borderWidth: 1 },
            { label: 'Đã từ chối', data: [35, 42, 38, 45], backgroundColor: '#ef4444', borderColor: '#dc2626', borderWidth: 1 },
            { label: 'Đang chờ', data: [85, 95, 78, 90], backgroundColor: '#f59e0b', borderColor: '#d97706', borderWidth: 1 },
          ],
          maxY: 1000
        };
    }
  }, [timeFilter]);

  const data = useMemo(() => ({
    labels: getChartData.labels,
    datasets: getChartData.datasets
  }), [getChartData]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 },
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
        max: getChartData.maxY,
        grid: { color: 'rgba(0,0,0,0.1)', drawBorder: false },
        ticks: { 
          font: { size: 12 }, 
          color: '#6b7280',
          stepSize: getChartData.maxY / 10,
          callback: (v: unknown) => `${v}`
        },
        title: { display: true, text: 'Số lượng nội dung', font: { size: 14, weight: 600 as const }, color: '#374151' }
      },
      x: {
        grid: { color: 'rgba(0,0,0,0.1)', drawBorder: false },
        ticks: { font: { size: 11 }, color: '#6b7280' },
        title: { 
          display: true, 
          text: timeFilter === 'hôm-nay' ? 'Khung giờ' : timeFilter === 'tuần-này' ? 'Ngày trong tuần' : timeFilter === 'tháng-này' ? 'Tuần' : 'Tháng', 
          font: { size: 14, weight: 600 as const }, 
          color: '#374151' 
        }
      }
    },
    interaction: { intersect: false, mode: 'index' as const }
  }), [getChartData, timeFilter]);

  return <Bar data={data} options={options} />;
});

export default function ContentApproval() {
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');
  
  // Time filter state
  const [timeFilter, setTimeFilter] = useState('tháng-này');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Filter states
  const [contentTypeFilter, setContentTypeFilter] = useState('Tất cả loại');
  const [priorityFilter, setPriorityFilter] = useState('Tất cả độ ưu tiên');
  const [schoolFilter, setSchoolFilter] = useState('Tất cả trường');
  const [majorFilter, setMajorFilter] = useState('Tất cả khoa');  // Đổi từ "ngành" thành "khoa"
  const [classFilter, setClassFilter] = useState('Tất cả lớp');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Get available majors (now called "khoa") based on selected school
  const availableMajors = useMemo(() => {
    if (schoolFilter === 'Tất cả trường') return [];
    return majorsBySchool[schoolFilter] || [];
  }, [schoolFilter]);
  
  // Get available classes based on selected school and major (khoa)
  const availableClasses = useMemo(() => {
    if (schoolFilter === 'Tất cả trường') return [];
    if (majorFilter === 'Tất cả khoa') {
      const schoolClasses = classesBySchoolAndMajor[schoolFilter] || {};
      return Object.values(schoolClasses).flat();
    }
    return classesBySchoolAndMajor[schoolFilter]?.[majorFilter] || [];
  }, [schoolFilter, majorFilter]);
  
  // Reset major (khoa) and class when school changes
  useEffect(() => {
    setMajorFilter('Tất cả khoa');
    setClassFilter('Tất cả lớp');
  }, [schoolFilter]);

  // History state - lưu lịch sử phê duyệt/từ chối
  const [approvalHistory, setApprovalHistory] = useState<Array<{
    id: number;
    action: 'approved' | 'rejected';
    contentTitle: string;
    contentType: string;
    author: string;
    actionBy: string;
    actionDate: string;
    reason?: string;
  }>>([]);

  // Confirm dialog states
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'approve' | 'reject' | null;
    contentId: number | null;
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: null,
    contentId: null,
    title: '',
    message: ''
  });

  // Detail modal states
  const [detailModal, setDetailModal] = useState<{
    isOpen: boolean;
    content: typeof contentData[0] | null;
  }>({
    isOpen: false,
    content: null
  });

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
      department: "Khoa học Máy tính",
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
      department: "Công nghệ Phần mềm",
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
      department: "Kinh tế Quốc tế",
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
      department: "An toàn Thông tin",
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
      department: "Tiếng Anh Thương mại",
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
  
  const handlePriorityChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setPriorityFilter(e.target.value);
  }, []);
  
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);
  
  const handleReset = useCallback(() => {
    setContentTypeFilter('Tất cả loại');
    setSchoolFilter('Tất cả trường');
    setMajorFilter('Tất cả khoa');
    setClassFilter('Tất cả lớp');
    setPriorityFilter('Tất cả độ ưu tiên');
    setSearchTerm('');
  }, []);
  
  // Calculate real-time statistics based on timeFilter
  const statistics = useMemo(() => {
    // TODO: In real app, filter by actual dates based on timeFilter
    // For now, we'll simulate different counts based on timeFilter
    const multipliers: { [key: string]: number } = {
      'hôm-nay': 0.1,
      'tuần-này': 0.4,
      'tháng-này': 1.0,
      'tất-cả': 2.5
    };
    
    const multiplier = multipliers[timeFilter] || 1.0;
    
    // Calculate from contentData (simulate pending/approved/rejected)
    const totalContent = contentData.length;
    const pending = Math.round(totalContent * 0.4 * multiplier); // 40% pending
    const approved = Math.round(totalContent * 0.35 * multiplier); // 35% approved
    const rejected = Math.round(totalContent * 0.05 * multiplier); // 5% rejected
    
    // Calculate absolute differences (not percentages)
    // Simulate comparison with previous period
    const differences: { [key: string]: { pending: number; approved: number; rejected: number } } = {
      'hôm-nay': { pending: 2, approved: 5, rejected: -1 },      // so với hôm qua
      'tuần-này': { pending: 8, approved: 12, rejected: -2 },    // so với tuần trước
      'tháng-này': { pending: 15, approved: 24, rejected: -5 },  // so với tháng trước
      'tất-cả': { pending: 45, approved: 80, rejected: -12 }     // so với toàn bộ lịch sử trước
    };
    
    const diff = differences[timeFilter] || differences['tháng-này'];
    
    return {
      pending,
      approved,
      rejected,
      total: pending + approved + rejected,
      diff
    };
  }, [contentData, timeFilter]);
  
  // Get time period label for display
  const getTimePeriodLabel = () => {
    const labels: { [key: string]: string } = {
      'hôm-nay': 'so với hôm qua',
      'tuần-này': 'so với tuần trước',
      'tháng-này': 'so với tháng trước',
      'tất-cả': 'so với trước đó'
    };
    return labels[timeFilter] || 'so với tháng trước';
  };
  
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
        const matchesMajor = majorFilter === 'Tất cả khoa' || content.department === majorFilter;
        const matchesPriority = priorityFilter === 'Tất cả độ ưu tiên' || content.priority === priorityFilter;
        // TODO: Add actual school/class matching when data structure supports it
        
        return matchesSearch && matchesType && matchesMajor && matchesPriority;
      });
      
      setFilteredContent(filtered);
      setIsLoading(false);
    }, 500); // 500ms delay để thấy rõ loading effect
    
    return () => clearTimeout(filterTimeout);
  }, [contentTypeFilter, majorFilter, priorityFilter, schoolFilter, classFilter, searchTerm, contentData]);

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
    const content = contentData.find(c => c.id === id);
    setConfirmDialog({
      isOpen: true,
      type: 'approve',
      contentId: id,
      title: 'Xác nhận phê duyệt',
      message: `Bạn có chắc chắn muốn phê duyệt nội dung "${content?.title}"?`
    });
  };

  const handleReject = (id: number) => {
    const content = contentData.find(c => c.id === id);
    setConfirmDialog({
      isOpen: true,
      type: 'reject',
      contentId: id,
      title: 'Xác nhận từ chối',
      message: `Bạn có chắc chắn muốn từ chối nội dung "${content?.title}"? Hành động này không thể hoàn tác.`
    });
  };

  const handleViewDetails = (id: number) => {
    const content = contentData.find(c => c.id === id);
    if (content) {
      setDetailModal({
        isOpen: true,
        content: content
      });
    }
  };

  const handleConfirmAction = () => {
    const content = contentData.find(c => c.id === confirmDialog.contentId);
    
    if (confirmDialog.type === 'approve') {
      console.log('Approved content', confirmDialog.contentId);
      // TODO: Call API to approve content
      
      // Lưu vào lịch sử
      if (content) {
        const newHistoryItem = {
          id: Date.now(), // Sử dụng timestamp làm ID duy nhất
          action: 'approved' as const,
          contentTitle: content.title,
          contentType: content.type,
          author: content.author,
          actionBy: 'Admin User', // TODO: Lấy từ user context
          actionDate: new Date().toLocaleString('vi-VN'),
          reason: undefined
        };
        setApprovalHistory(prev => [newHistoryItem, ...prev]);
      }
    } else if (confirmDialog.type === 'reject') {
      console.log('Rejected content', confirmDialog.contentId);
      // TODO: Call API to reject content
      
      // Lưu vào lịch sử
      if (content) {
        const newHistoryItem = {
          id: Date.now(),
          action: 'rejected' as const,
          contentTitle: content.title,
          contentType: content.type,
          author: content.author,
          actionBy: 'Admin User', // TODO: Lấy từ user context
          actionDate: new Date().toLocaleString('vi-VN'),
          reason: 'Không đáp ứng yêu cầu' // TODO: Có thể thêm form nhập lý do
        };
        setApprovalHistory(prev => [newHistoryItem, ...prev]);
      }
    }
    
    setConfirmDialog({
      isOpen: false,
      type: null,
      contentId: null,
      title: '',
      message: ''
    });
  };

  const handleCancelAction = () => {
    setConfirmDialog({
      isOpen: false,
      type: null,
      contentId: null,
      title: '',
      message: ''
    });
  };

  const handleCloseDetail = () => {
    setDetailModal({
      isOpen: false,
      content: null
    });
  };

  return (
    <AdminLayout>
      <div className="p-6 bg-gray-50 overflow-y-auto">
        {/* Page Header with Time Filter */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Phê duyệt Nội dung</h1>
            <TimeFilter 
              viewMode={timeFilter as 'day' | 'month' | 'year' | 'all'}
              selectedDate={new Date(selectedYear, 0, 1)}
              onViewModeChange={(mode) => setTimeFilter(mode)}
              onDateChange={(date) => setSelectedYear(date.getFullYear())}
            />
          </div>
          <p className="text-gray-600">Quản lý và phê duyệt nội dung học tập do giảng viên gửi lên</p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <span className="text-lg">📊</span>
                <span>Tổng quan</span>
              </button>
              
              <button
                onClick={() => setActiveTab('history')}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === 'history'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <span className="text-lg">📜</span>
                <span>Lịch sử phê duyệt</span>
                {approvalHistory.length > 0 && (
                  <span className="ml-2 bg-blue-100 text-blue-600 py-0.5 px-2 rounded-full text-xs font-medium">
                    {approvalHistory.length}
                  </span>
                )}
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content - Tổng quan */}
        {activeTab === 'overview' && (
          <>
            {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Pending Approval */}
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-yellow-700 mb-1">Chờ phê duyệt</p>
                  <p className="text-2xl font-bold text-yellow-900">{statistics.pending}</p>
                  <div className="flex items-center mt-1">
                    <span className={`text-xs font-medium ${statistics.diff.pending >= 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      {statistics.diff.pending >= 0 ? '↗' : '↓'} {statistics.diff.pending >= 0 ? `+${statistics.diff.pending}` : statistics.diff.pending} {getTimePeriodLabel()}
                    </span>
                  </div>
                </div>
                <div className="w-10 h-10 bg-yellow-200 rounded-lg flex items-center justify-center">
                  <span className="text-yellow-700 text-xl">🕐</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Approved */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-green-700 mb-1">Đã phê duyệt</p>
                  <p className="text-2xl font-bold text-green-900">{statistics.approved}</p>
                  <div className="flex items-center mt-1">
                    <span className={`text-xs font-medium ${statistics.diff.approved >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {statistics.diff.approved >= 0 ? '↗' : '↘'} {statistics.diff.approved >= 0 ? `+${statistics.diff.approved}` : statistics.diff.approved} {getTimePeriodLabel()}
                    </span>
                  </div>
                </div>
                <div className="w-10 h-10 bg-green-200 rounded-lg flex items-center justify-center">
                  <span className="text-green-700 text-xl">✅</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rejected */}
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-red-700 mb-1">Đã từ chối</p>
                  <p className="text-2xl font-bold text-red-900">{statistics.rejected}</p>
                  <div className="flex items-center mt-1">
                    <span className={`text-xs font-medium ${statistics.diff.rejected >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {statistics.diff.rejected >= 0 ? '↗' : '↓'} {statistics.diff.rejected >= 0 ? `+${statistics.diff.rejected}` : statistics.diff.rejected} {getTimePeriodLabel()}
                    </span>
                  </div>
                </div>
                <div className="w-10 h-10 bg-red-200 rounded-lg flex items-center justify-center">
                  <span className="text-red-700 text-xl">❌</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trend Chart */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Xu hướng phê duyệt ({timeFilter === 'hôm-nay' ? 'hôm nay' : timeFilter === 'tuần-này' ? 'tuần này' : timeFilter === 'tháng-này' ? 'tháng này' : 'cả năm'})
            </h3>
            <div className="h-80 w-full">
              <ApprovalChart timeFilter={timeFilter} />
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
                <label className="block text-xs font-medium text-gray-700 mb-1">Trường</label>
                <select 
                  value={schoolFilter}
                  onChange={(e) => setSchoolFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-800 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option>Tất cả trường</option>
                  <option>Trường Khoa học máy tính</option>
                  <option>Trường Công nghệ</option>
                  <option>Trường Kinh tế và Kinh doanh</option>
                  <option>Trường Ngôn ngữ và Xã hội nhân văn</option>
                  <option>Trường Du lịch</option>
                  <option>Trường Y-Dược</option>
                  <option>Trường Đào tạo quốc tế</option>
                  <option>Viện Quản lý Nam Khuê</option>
                  <option>Viện Việt-Nhật</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Khoa</label>
                <select 
                  value={majorFilter}
                  onChange={(e) => setMajorFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-800 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={schoolFilter === 'Tất cả trường'}
                >
                  <option>Tất cả khoa</option>
                  {availableMajors.map((major) => (
                    <option key={major} value={major}>
                      {major}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Lớp</label>
                <select 
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-800 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={schoolFilter === 'Tất cả trường'}
                >
                  <option>Tất cả lớp</option>
                  {availableClasses.map((classCode) => (
                    <option key={classCode} value={classCode}>
                      {classCode}
                    </option>
                  ))}
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
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => handleApprove(content.id)}
                          className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded shadow-sm hover:shadow transition-all duration-150 cursor-pointer"
                          title="Phê duyệt"
                        >
                          ✓
                        </button>
                        <button 
                          onClick={() => handleReject(content.id)}
                          className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded shadow-sm hover:shadow transition-all duration-150 cursor-pointer"
                          title="Từ chối"
                        >
                          ✕
                        </button>
                        <button 
                          onClick={() => handleViewDetails(content.id)}
                          className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded shadow-sm hover:shadow transition-all duration-150 cursor-pointer"
                          title="Xem chi tiết"
                        >
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
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
          </>
        )}

        {/* Tab Content - Lịch sử phê duyệt */}
        {activeTab === 'history' && (
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Lịch sử phê duyệt</h3>
                <span className="text-sm text-gray-500">
                  Tổng số: {approvalHistory.length} hành động
                </span>
              </div>

              {approvalHistory.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-5xl">📜</span>
                  <p className="mt-4 text-gray-500">Chưa có lịch sử phê duyệt nào</p>
                  <p className="text-sm text-gray-400 mt-2">Các hành động phê duyệt/từ chối sẽ được lưu lại ở đây</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Thời gian
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Hành động
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tiêu đề nội dung
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Loại
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tác giả
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Người thực hiện
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ghi chú
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {approvalHistory.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.actionDate}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              item.action === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {item.action === 'approved' ? '✓ Phê duyệt' : '✕ Từ chối'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {item.contentTitle}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.contentType}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.author}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.actionBy}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.reason || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.type === 'approve' ? 'Phê duyệt' : 'Từ chối'}
        cancelText="Hủy bỏ"
        type={confirmDialog.type === 'approve' ? 'info' : 'danger'}
        confirmButtonClass={
          confirmDialog.type === 'approve' 
            ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
            : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
        }
        onConfirm={handleConfirmAction}
        onCancel={handleCancelAction}
      />

      {/* Detail Modal */}
      <ContentDetailModal
        isOpen={detailModal.isOpen}
        content={detailModal.content}
        onClose={handleCloseDetail}
      />
    </AdminLayout>
  );
}