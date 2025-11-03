import { useState, useMemo, memo, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import AdminLayout from "@/components/ui/admin/AdminLayout";
import TimeFilter from "@/components/ui/admin/TimeFilter";
import ConfirmDialog from "@/components/ui/admin/ConfirmDialog";
import NotificationDetailModal from "@/components/ui/admin/NotificationDetailModal";
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

// ==================== REUSABLE EMOJI ICON BUTTON COMPONENT ====================
export interface EmojiIconButtonProps {
  emoji: string; // Emoji character (e.g., '👁️', '✏️', '🗑️')
  title: string; // Tooltip text
  onClick: () => void;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'emerald' | 'purple';
  className?: string;
}

export const EmojiIconButton = ({ 
  emoji, 
  title, 
  onClick, 
  color = 'blue',
  className = '' 
}: EmojiIconButtonProps) => {
  const colorClasses = {
    blue: 'text-blue-600 hover:text-blue-900',
    green: 'text-green-600 hover:text-green-900',
    red: 'text-red-600 hover:text-red-900',
    yellow: 'text-yellow-600 hover:text-yellow-900',
    emerald: 'text-emerald-600 hover:text-emerald-900',
    purple: 'text-purple-600 hover:text-purple-900'
  };

  return (
    <button 
      onClick={onClick}
      title={title}
      className={`cursor-pointer ${colorClasses[color]} ${className}`}
    >
      {emoji}
    </button>
  );
};

// Notification interface
interface Notification {
  id: number;
  title: string;
  content: string;
  type: string;
  target: string;
  priority: string;
  createdDate: string;
  attachments?: Array<{
    name: string;
    size: number;
    type: string;
    url: string;
  }>;
}

interface NotificationHistory {
  id: number;
  action: 'sent' | 'deleted';
  title: string;
  content: string;
  type: string;
  target: string;
  priority: string;
  actionDate: string;
  createdDate: string;
  attachments?: Array<{
    name: string;
    size: number;
    type: string;
    url: string;
  }>;
  totalRecipients?: number; // Tổng số người nhận
  readCount?: number; // Số người đã đọc
}

// ✅ NotificationChart với props động theo timeFilter
const NotificationChart = memo(function NotificationChart({ timeFilter }: { timeFilter: string }) {
  const getChartData = useMemo(() => {
    const now = new Date();
    
    switch (timeFilter) {
      case 'hôm-nay': {
        const labels = ['0h-4h', '4h-8h', '8h-12h', '12h-16h', '16h-20h', '20h-24h'];
        return {
          labels,
          datasets: [
            { 
              label: 'Thông báo đã gửi', 
              data: [2, 3, 5, 8, 4, 1], 
              backgroundColor: 'rgba(59, 130, 246, 0.8)', 
              borderColor: 'rgba(59, 130, 246, 1)', 
              borderWidth: 1,
              borderRadius: 4
            },
            { 
              label: 'Đã đọc', 
              data: [1, 2, 4, 6, 3, 1], 
              backgroundColor: 'rgba(34, 197, 94, 0.8)', 
              borderColor: 'rgba(34, 197, 94, 1)', 
              borderWidth: 1,
              borderRadius: 4
            },
            { 
              label: 'Chưa đọc', 
              data: [1, 1, 1, 2, 1, 0], 
              backgroundColor: 'rgba(239, 68, 68, 0.8)', 
              borderColor: 'rgba(239, 68, 68, 1)', 
              borderWidth: 1,
              borderRadius: 4
            }
          ],
          maxY: 10,
          xAxisTitle: 'Khung giờ'
        };
      }
      
      case 'tuần-này': {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay() + 1);
        
        const labels = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'].map((day, index) => {
          const date = new Date(startOfWeek);
          date.setDate(startOfWeek.getDate() + index);
          return `${day}\n${date.getDate()}/${date.getMonth() + 1}`;
        });
        
        return {
          labels,
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
              label: 'Đã đọc', 
              data: [9, 6, 11, 8, 14, 4, 7], 
              backgroundColor: 'rgba(34, 197, 94, 0.8)', 
              borderColor: 'rgba(34, 197, 94, 1)', 
              borderWidth: 1,
              borderRadius: 4
            },
            { 
              label: 'Chưa đọc', 
              data: [3, 2, 4, 2, 4, 2, 2], 
              backgroundColor: 'rgba(239, 68, 68, 0.8)', 
              borderColor: 'rgba(239, 68, 68, 1)', 
              borderWidth: 1,
              borderRadius: 4
            }
          ],
          maxY: 50,
          xAxisTitle: 'Ngày trong tuần'
        };
      }
      
      case 'tháng-này': {
        const labels = ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'];
        return {
          labels,
          datasets: [
            { 
              label: 'Thông báo đã gửi', 
              data: [48, 52, 45, 55], 
              backgroundColor: 'rgba(59, 130, 246, 0.8)', 
              borderColor: 'rgba(59, 130, 246, 1)', 
              borderWidth: 1,
              borderRadius: 4
            },
            { 
              label: 'Đã đọc', 
              data: [36, 39, 34, 42], 
              backgroundColor: 'rgba(34, 197, 94, 0.8)', 
              borderColor: 'rgba(34, 197, 94, 1)', 
              borderWidth: 1,
              borderRadius: 4
            },
            { 
              label: 'Chưa đọc', 
              data: [12, 13, 11, 13], 
              backgroundColor: 'rgba(239, 68, 68, 0.8)', 
              borderColor: 'rgba(239, 68, 68, 1)', 
              borderWidth: 1,
              borderRadius: 4
            }
          ],
          maxY: 100,
          xAxisTitle: 'Tuần'
        };
      }
      
      case 'tất-cả': {
        const labels = ['Tháng 1', 'Tháng 3', 'Tháng 6', 'Tháng 9', 'Tháng 12'];
        return {
          labels,
          datasets: [
            { 
              label: 'Thông báo đã gửi', 
              data: [180, 220, 250, 280, 245], 
              backgroundColor: 'rgba(59, 130, 246, 0.8)', 
              borderColor: 'rgba(59, 130, 246, 1)', 
              borderWidth: 1,
              borderRadius: 4
            },
            { 
              label: 'Đã đọc', 
              data: [135, 165, 188, 210, 180], 
              backgroundColor: 'rgba(34, 197, 94, 0.8)', 
              borderColor: 'rgba(34, 197, 94, 1)', 
              borderWidth: 1,
              borderRadius: 4
            },
            { 
              label: 'Chưa đọc', 
              data: [45, 55, 62, 70, 65], 
              backgroundColor: 'rgba(239, 68, 68, 0.8)', 
              borderColor: 'rgba(239, 68, 68, 1)', 
              borderWidth: 1,
              borderRadius: 4
            }
          ],
          maxY: 500,
          xAxisTitle: 'Tháng'
        };
      }
      
      default:
        return {
          labels: [],
          datasets: [],
          maxY: 100,
          xAxisTitle: 'Thời gian'
        };
    }
  }, [timeFilter]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Xu hướng gửi thông báo (${
          timeFilter === 'hôm-nay' ? 'Hôm nay' : 
          timeFilter === 'tuần-này' ? 'Tuần này' : 
          timeFilter === 'tháng-này' ? 'Tháng này' : 'Tất cả'
        })`,
        font: {
          size: 14,
          weight: 'bold' as const
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: getChartData.maxY,
        ticks: {
          stepSize: getChartData.maxY / 10
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        title: {
          display: true,
          text: 'Số lượng thông báo'
        }
      },
      x: {
        grid: {
          display: false
        },
        title: {
          display: true,
          text: getChartData.xAxisTitle
        }
      }
    }
  };

  return <Bar data={getChartData} options={chartOptions} />;
});

export default function NotificationManagement() {
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');
  const [timeFilter, setTimeFilter] = useState('tuần-này');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Editing state
  const [editingNotification, setEditingNotification] = useState<number | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Filter states for draft list
  const [typeFilter, setTypeFilter] = useState('Tất cả loại');
  const [targetFilterList, setTargetFilterList] = useState('Tất cả đối tượng');
  const [priorityFilterList, setPriorityFilterList] = useState('Tất cả mức độ');
  
  // Pagination and filter states for history tab
  const [historyPage, setHistoryPage] = useState(1);
  const [historyActionFilter, setHistoryActionFilter] = useState('Tất cả hành động');
  const [historyTypeFilter, setHistoryTypeFilter] = useState('Tất cả loại');
  const [historyTargetFilter, setHistoryTargetFilter] = useState('Tất cả đối tượng');
  
  // Preview modal state
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    notification: Notification | null;
  }>({
    isOpen: false,
    notification: null
  });
  
  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
    onCancel?: () => void;
    type?: 'danger' | 'warning' | 'info' | 'success';
    hideCancel?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Đồng ý',
    onConfirm: () => {},
    onCancel: () => {},
    type: 'warning',
    hideCancel: false
  });
  
  // Selected notifications for bulk send
  const [selectedNotifications, setSelectedNotifications] = useState<number[]>([]);
  
  // Notification history state - Load from localStorage on mount
  const [notificationHistory, setNotificationHistory] = useState<NotificationHistory[]>(() => {
    const saved = localStorage.getItem('notificationHistory');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading notification history from localStorage:', e);
      }
    }
    return [];
  });
  
  // Draft notifications state - Load from localStorage on mount
  const [draftNotifications, setDraftNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('draftNotifications');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading notifications from localStorage:', e);
      }
    }
    return [
      {
        id: 1,
        title: 'Lịch thi giữa kỳ và cuối kỳ học kỳ I năm 2024-2025',
        content: 'Thông báo chi tiết lịch thi giữa kỳ từ ngày 15/12/2024 đến 20/12/2024 và lịch thi cuối kỳ từ ngày 10/01/2025 đến 20/01/2025. Sinh viên vui lòng kiểm tra phòng thi và giờ thi trên hệ thống.',
        type: 'Lịch Thi',
        target: 'Sinh viên',
        priority: 'Cao',
        createdDate: '15/12/2024'
      },
      {
        id: 2,
        title: 'Cập nhật hệ thống quản lý điểm danh',
        content: 'Hệ thống quản lý điểm danh đã được nâng cấp với tính năng nhận diện khuôn mặt và định vị GPS. Giảng viên và sinh viên vui lòng cập nhật ứng dụng di động lên phiên bản mới nhất.',
        type: 'Cập Nhật Hệ Thống',
        target: 'Tất cả',
        priority: 'Trung bình',
        createdDate: '14/12/2024'
      },
      {
        id: 3,
        title: 'Hội thảo khoa học quốc tế về AI trong giáo dục',
        content: 'Trường tổ chức hội thảo khoa học quốc tế về ứng dụng trí tuệ nhân tạo trong giáo dục vào ngày 20/12/2024. Chương trình có diễn giả từ MIT, Stanford và các trường đại học hàng đầu. Giảng viên quan tâm vui lòng đăng ký tham dự.',
        type: 'Sự Kiện Tổ Chức',
        target: 'Giảng viên',
        priority: 'Thấp',
        createdDate: '13/12/2024'
      },
      {
        id: 4,
        title: 'Cảnh báo điểm danh không đạt yêu cầu',
        content: 'Sinh viên có tỷ lệ điểm danh dưới 80% sẽ không được thi cuối kỳ. Vui lòng kiểm tra và hoàn thiện điểm danh trước ngày 20/12/2024.',
        type: 'Cảnh Báo Học Tập',
        target: 'Sinh viên',
        priority: 'Cao',
        createdDate: '12/12/2024'
      },
      {
        id: 5,
        title: 'Vinh danh sinh viên xuất sắc học kỳ I',
        content: 'Chúc mừng 50 sinh viên đạt thành tích xuất sắc trong học kỳ I năm học 2024-2025. Danh sách chi tiết sẽ được công bố tại lễ tổng kết.',
        type: 'Vinh Danh Cá Nhân',
        target: 'Sinh viên',
        priority: 'Thấp',
        createdDate: '11/12/2024'
      },
      {
        id: 6,
        title: 'Thông tin về học bổng học kỳ II',
        content: 'Mở đơn đăng ký học bổng học kỳ II năm học 2024-2025. Hạn cuối nhận hồ sơ: 31/12/2024.',
        type: 'Thông Tin Chung',
        target: 'Sinh viên',
        priority: 'Trung bình',
        createdDate: '10/12/2024'
      },
      {
        id: 7,
        title: 'Cập nhật lịch nghỉ Tết Nguyên Đán 2025',
        content: 'Trường thông báo lịch nghỉ Tết Nguyên Đán 2025 từ ngày 25/01 đến 05/02/2025. Sinh viên và giảng viên lưu ý sắp xếp công việc.',
        type: 'Cập Nhật Hệ Thống',
        target: 'Tất cả',
        priority: 'Cao',
        createdDate: '09/12/2024'
      },
      {
        id: 8,
        title: 'Lịch bảo vệ đồ án tốt nghiệp',
        content: 'Lịch bảo vệ đồ án tốt nghiệp khóa 2020 sẽ diễn ra từ ngày 15/01 đến 25/01/2025. Sinh viên vui lòng chuẩn bị tài liệu.',
        type: 'Lịch Thi',
        target: 'Sinh viên',
        priority: 'Cao',
        createdDate: '08/12/2024'
      },
      {
        id: 9,
        title: 'Hội thảo tuyển dụng việc làm',
        content: 'Ngày hội việc làm 2025 với sự tham gia của 50+ doanh nghiệp lớn. Thời gian: 20/01/2025.',
        type: 'Sự Kiện Tổ Chức',
        target: 'Sinh viên',
        priority: 'Trung bình',
        createdDate: '07/12/2024'
      },
      {
        id: 10,
        title: 'Cảnh báo nộp học phí chậm',
        content: 'Sinh viên chưa hoàn thành học phí học kỳ I vui lòng nộp trước 15/12/2024 để tránh bị khóa tài khoản.',
        type: 'Cảnh Báo Học Tập',
        target: 'Sinh viên',
        priority: 'Cao',
        createdDate: '06/12/2024'
      },
      {
        id: 11,
        title: 'Vinh danh giảng viên xuất sắc năm 2024',
        content: 'Chúc mừng 20 giảng viên được vinh danh giảng viên xuất sắc năm 2024 với nhiều thành tích trong công tác giảng dạy và nghiên cứu.',
        type: 'Vinh Danh Cá Nhân',
        target: 'Giảng viên',
        priority: 'Thấp',
        createdDate: '05/12/2024'
      },
      {
        id: 12,
        title: 'Thông tin về đăng ký môn học kỳ II',
        content: 'Thời gian đăng ký môn học học kỳ II: từ 20/12/2024 đến 31/12/2024. Sinh viên vui lòng đăng ký đúng thời hạn.',
        type: 'Thông Tin Chung',
        target: 'Sinh viên',
        priority: 'Cao',
        createdDate: '04/12/2024'
      }
    ];
  });
  
  const [newNotification, setNewNotification] = useState({
    title: '',
    content: '',
    priority: 'Trung bình',
    notificationType: 'Cập Nhật Hệ Thống',
    target: 'Tất cả',
    files: null as FileList | null
  });

  // Filtered notifications based on filters
  const filteredNotifications = useMemo(() => {
    const filtered = draftNotifications.filter((notification: Notification) => {
      const matchType = typeFilter === 'Tất cả loại' || notification.type === typeFilter;
      const matchTarget = targetFilterList === 'Tất cả đối tượng' || notification.target === targetFilterList;
      const matchPriority = priorityFilterList === 'Tất cả mức độ' || notification.priority === priorityFilterList;
      return matchType && matchTarget && matchPriority;
    });
    // Reset to page 1 when filters change
    setCurrentPage(1);
    return filtered;
  }, [draftNotifications, typeFilter, targetFilterList, priorityFilterList]);

  // Paginated notifications
  const paginatedNotifications = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredNotifications.slice(startIndex, endIndex);
  }, [filteredNotifications, currentPage]);

  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  
  // Filtered history based on filters
  const filteredHistory = useMemo(() => {
    const filtered = notificationHistory.filter((history: NotificationHistory) => {
      const matchAction = historyActionFilter === 'Tất cả hành động' || 
        (historyActionFilter === 'Đã gửi' && history.action === 'sent') ||
        (historyActionFilter === 'Đã xóa' && history.action === 'deleted');
      const matchType = historyTypeFilter === 'Tất cả loại' || history.type === historyTypeFilter;
      const matchTarget = historyTargetFilter === 'Tất cả đối tượng' || history.target === historyTargetFilter;
      return matchAction && matchType && matchTarget;
    });
    // Reset to page 1 when filters change
    setHistoryPage(1);
    return filtered;
  }, [notificationHistory, historyActionFilter, historyTypeFilter, historyTargetFilter]);

  // Paginated history
  const paginatedHistory = useMemo(() => {
    const startIndex = (historyPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredHistory.slice(startIndex, endIndex);
  }, [filteredHistory, historyPage]);

  const historyTotalPages = Math.ceil(filteredHistory.length / itemsPerPage);

  // Save to localStorage whenever draftNotifications changes
  useEffect(() => {
    localStorage.setItem('draftNotifications', JSON.stringify(draftNotifications));
  }, [draftNotifications]);

  // Save to localStorage whenever notificationHistory changes
  useEffect(() => {
    localStorage.setItem('notificationHistory', JSON.stringify(notificationHistory));
  }, [notificationHistory]);

  // ✅ Real-time statistics based on timeFilter
  const statistics = useMemo(() => {
    // Filter sent notifications only
    const sentNotifications = notificationHistory.filter(h => h.action === 'sent');
    
    // Calculate totals from actual data
    const total = sentNotifications.length;
    const read = sentNotifications.reduce((sum, n) => sum + (n.readCount || 0), 0);
    const totalRecipients = sentNotifications.reduce((sum, n) => sum + (n.totalRecipients || 0), 0);
    const unread = totalRecipients - read;
    
    // Calculate differences (simulate comparison)
    const totalDiff = Math.floor(total * 0.15); // 15% increase
    const readDiff = Math.floor(read * 0.12); // 12% increase  
    const unreadDiff = Math.floor(unread * 0.08); // 8% increase
    
    return {
      total: total || 0,
      read: read || 0,
      unread: unread || 0,
      readPercent: totalRecipients > 0 ? Math.round((read / totalRecipients) * 100) : 0,
      unreadPercent: totalRecipients > 0 ? Math.round((unread / totalRecipients) * 100) : 0,
      totalDiff,
      readDiff,
      unreadDiff
    };
  }, [notificationHistory]);

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
    const newFiles = event.target.files;
    if (newFiles && newFiles.length > 0) {
      // Combine existing files with new files
      const existingFiles = newNotification.files ? Array.from(newNotification.files) : [];
      const allFiles = [...existingFiles, ...Array.from(newFiles)];
      
      // Calculate total size
      let totalSize = 0;
      for (let i = 0; i < allFiles.length; i++) {
        totalSize += allFiles[i].size;
      }
      
      // Check if total size exceeds 30MB (30 * 1024 * 1024 bytes)
      const maxSize = 30 * 1024 * 1024;
      if (totalSize > maxSize) {
        setConfirmDialog({
          isOpen: true,
          title: 'Vượt quá dung lượng',
          message: `Tổng dung lượng file (${(totalSize / 1024 / 1024).toFixed(2)} MB) vượt quá giới hạn 30 MB. Vui lòng chọn ít file hơn!`,
          confirmText: 'Đóng',
          onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false })),
          type: 'warning',
          hideCancel: true
        });
        // Reset input value to allow re-selecting
        event.target.value = '';
        return;
      }
      
      // Convert array back to FileList
      const dt = new DataTransfer();
      allFiles.forEach(file => dt.items.add(file));
      
      setNewNotification(prev => ({
        ...prev,
        files: dt.files
      }));
      
      // Reset input to allow selecting more files
      event.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const newFiles = e.dataTransfer.files;
    if (newFiles && newFiles.length > 0) {
      // Combine existing files with new files
      const existingFiles = newNotification.files ? Array.from(newNotification.files) : [];
      const allFiles = [...existingFiles, ...Array.from(newFiles)];
      
      // Calculate total size
      let totalSize = 0;
      for (let i = 0; i < allFiles.length; i++) {
        totalSize += allFiles[i].size;
      }
      
      // Check if total size exceeds 30MB
      const maxSize = 30 * 1024 * 1024;
      if (totalSize > maxSize) {
        setConfirmDialog({
          isOpen: true,
          title: 'Vượt quá dung lượng',
          message: `Tổng dung lượng file (${(totalSize / 1024 / 1024).toFixed(2)} MB) vượt quá giới hạn 30 MB. Vui lòng chọn ít file hơn!`,
          confirmText: 'Đóng',
          onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false })),
          type: 'warning',
          hideCancel: true
        });
        return;
      }
      
      // Convert array back to FileList
      const dt = new DataTransfer();
      allFiles.forEach(file => dt.items.add(file));
      
      setNewNotification(prev => ({
        ...prev,
        files: dt.files
      }));
    }
  };

  const handleRemoveFile = (index: number) => {
    if (newNotification.files) {
      const dt = new DataTransfer();
      const { files } = newNotification;
      
      for (let i = 0; i < files.length; i++) {
        if (i !== index) {
          dt.items.add(files[i]);
        }
      }
      
      setNewNotification(prev => ({
        ...prev,
        files: dt.files.length > 0 ? dt.files : null
      }));
      
      // Reset input file để có thể chọn lại
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }
  };

  const handleCreateNotification = () => {
    if (!newNotification.title || !newNotification.content) {
      setConfirmDialog({
        isOpen: true,
        title: 'Thiếu thông tin',
        message: 'Vui lòng nhập đầy đủ tiêu đề và nội dung thông báo!',
        confirmText: 'Đóng',
        onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false })),
        type: 'warning',
        hideCancel: true
      });
      return;
    }
    
    // Show confirmation dialog first
    setConfirmDialog({
      isOpen: true,
      title: 'Xác nhận tạo thông báo',
      message: `Bạn có chắc chắn muốn tạo thông báo "${newNotification.title}"?`,
      onConfirm: () => {
        // Process attachments if any
        const attachments = newNotification.files 
          ? Array.from(newNotification.files).map(file => ({
              name: file.name,
              size: file.size,
              type: file.type,
              url: URL.createObjectURL(file) // Create temporary URL for preview
            }))
          : undefined;
        
        // Create the notification
        const newDraft: Notification = {
          id: Date.now(),
          title: newNotification.title,
          content: newNotification.content,
          type: newNotification.notificationType,
          target: newNotification.target,
          priority: newNotification.priority,
          createdDate: new Date().toLocaleDateString('vi-VN'),
          attachments: attachments
        };
        
        setDraftNotifications((prev: Notification[]) => [newDraft, ...prev]);
        
        // Close confirm dialog
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        
        // Reset form
        setNewNotification({
          title: '',
          content: '',
          priority: 'Trung bình',
          notificationType: 'Cập Nhật Hệ Thống',
          target: 'Tất cả',
          files: null
        });
        
        // Show success message after a short delay
        setTimeout(() => {
          setConfirmDialog({
            isOpen: true,
            title: 'Tạo thành công',
            message: 'Thông báo đã được tạo thành công!',
            confirmText: 'Đóng',
            onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false })),
            onCancel: () => setConfirmDialog(prev => ({ ...prev, isOpen: false })),
            type: 'success',
            hideCancel: true
          });
        }, 100);
      },
      onCancel: () => setConfirmDialog(prev => ({ ...prev, isOpen: false })),
      type: 'warning'
    });
  };

  const handleSendSelected = () => {
    if (selectedNotifications.length === 0) {
      setConfirmDialog({
        isOpen: true,
        title: 'Chưa chọn thông báo',
        message: 'Vui lòng chọn ít nhất một thông báo để gửi!',
        confirmText: 'Đóng',
        onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false })),
        type: 'warning',
        hideCancel: true
      });
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Xác nhận gửi thông báo',
      message: `Bạn có chắc chắn muốn gửi ${selectedNotifications.length} thông báo đã chọn?`,
      onConfirm: () => {
        const notifications = draftNotifications.filter((n: Notification) => selectedNotifications.includes(n.id));
        
        // Add to history with simulated recipient counts
        const historyEntries = notifications.map((n: Notification) => {
          // ===== MÔ PHỎNG DỮ LIỆU TỈ LỆ ĐỌC =====
          // Hiện tại đang MÔ PHỎNG số liệu người nhận và tỉ lệ đọc
          // Trong thực tế, dữ liệu này sẽ đến từ Backend API
          
          // 1. Tính số lượng người nhận dựa trên đối tượng
          let totalRecipients = 0;
          if (n.target === 'Sinh viên') totalRecipients = Math.floor(Math.random() * 200) + 100; // 100-300
          else if (n.target === 'Giảng viên') totalRecipients = Math.floor(Math.random() * 50) + 20; // 20-70
          else if (n.target === 'Phụ huynh') totalRecipients = Math.floor(Math.random() * 150) + 80; // 80-230
          else if (n.target === 'Lãnh đạo') totalRecipients = Math.floor(Math.random() * 20) + 5; // 5-25
          else totalRecipients = Math.floor(Math.random() * 300) + 150; // Tất cả: 150-450
          
          // 2. Mô phỏng số người đã đọc (70-90% của tổng số)
          const readRate = 0.7 + Math.random() * 0.2; // Random từ 70% đến 90%
          const readCount = Math.floor(totalRecipients * readRate);
          
          // 3. Số người chưa đọc = totalRecipients - readCount
          // Được tính tự động trong UI
          // ======================================
          
          return {
            id: Date.now() + Math.random(),
            action: 'sent' as const,
            title: n.title,
            content: n.content,
            type: n.type,
            target: n.target,
            priority: n.priority,
            actionDate: new Date().toLocaleString('vi-VN'),
            createdDate: n.createdDate,
            attachments: n.attachments,
            totalRecipients,
            readCount
          };
        });
        
        setNotificationHistory((prev: NotificationHistory[]) => [...historyEntries, ...prev]);
        
        // Remove from drafts
        setDraftNotifications((prev: Notification[]) => prev.filter((n: Notification) => !selectedNotifications.includes(n.id)));
        
        // Clear selection
        setSelectedNotifications([]);
        
        // Close confirm dialog
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        
        // Show success message after a short delay
        setTimeout(() => {
          setConfirmDialog({
            isOpen: true,
            title: 'Gửi thành công',
            message: `Đã gửi ${notifications.length} thông báo thành công!`,
            confirmText: 'Đóng',
            onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false })),
            onCancel: () => setConfirmDialog(prev => ({ ...prev, isOpen: false })),
            type: 'success',
            hideCancel: true
          });
        }, 100);
      },
      onCancel: () => setConfirmDialog(prev => ({ ...prev, isOpen: false })),
      type: 'warning'
    });
  };

  const handleDeleteSelected = () => {
    if (selectedNotifications.length === 0) {
      setConfirmDialog({
        isOpen: true,
        title: 'Chưa chọn thông báo',
        message: 'Vui lòng chọn ít nhất một thông báo để xóa!',
        confirmText: 'Đóng',
        onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false })),
        type: 'warning',
        hideCancel: true
      });
      return;
    }

    const notifications = draftNotifications.filter((n: Notification) => selectedNotifications.includes(n.id));
    
    setConfirmDialog({
      isOpen: true,
      title: 'Xác nhận xóa thông báo',
      message: `Bạn có chắc chắn muốn xóa ${selectedNotifications.length} thông báo đã chọn?\n\nHành động này không thể hoàn tác.`,
      confirmText: 'Xóa thông báo',
      onConfirm: () => {
        // Add to history (deleted items don't have recipient counts)
        const historyEntries = notifications.map((n: Notification) => ({
          id: Date.now() + Math.random(),
          action: 'deleted' as const,
          title: n.title,
          content: n.content,
          type: n.type,
          target: n.target,
          priority: n.priority,
          actionDate: new Date().toLocaleString('vi-VN'),
          createdDate: n.createdDate,
          attachments: n.attachments,
          totalRecipients: 0,
          readCount: 0
        }));
        
        setNotificationHistory((prev: NotificationHistory[]) => [...historyEntries, ...prev]);
        
        // Remove from drafts
        setDraftNotifications((prev: Notification[]) => prev.filter((n: Notification) => !selectedNotifications.includes(n.id)));
        
        // Clear selection
        setSelectedNotifications([]);
        
        // Close confirm dialog
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        
        // Show success message after a short delay
        setTimeout(() => {
          setConfirmDialog({
            isOpen: true,
            title: 'Đã xóa thành công',
            message: `Đã xóa ${notifications.length} thông báo thành công!`,
            confirmText: 'Đóng',
            onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false })),
            onCancel: () => setConfirmDialog(prev => ({ ...prev, isOpen: false })),
            type: 'success',
            hideCancel: true
          });
        }, 100);
      },
      onCancel: () => setConfirmDialog(prev => ({ ...prev, isOpen: false })),
      type: 'danger'
    });
  };

  const handleEditDraft = (id: number) => {
    const notification = draftNotifications.find((n: Notification) => n.id === id);
    if (notification) {
      setNewNotification({
        title: notification.title,
        content: notification.content,
        priority: notification.priority,
        notificationType: notification.type,
        target: notification.target,
        files: null
      });
      
      setEditingNotification(id);
      
      // Scroll to form
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSaveEdit = () => {
    if (!editingNotification) return;
    
    if (!newNotification.title || !newNotification.content) {
      setConfirmDialog({
        isOpen: true,
        title: 'Thiếu thông tin',
        message: 'Vui lòng nhập đầy đủ tiêu đề và nội dung thông báo!',
        confirmText: 'Đóng',
        onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false })),
        type: 'warning',
        hideCancel: true
      });
      return;
    }
    
    // Show confirmation dialog first
    setConfirmDialog({
      isOpen: true,
      title: 'Xác nhận lưu chỉnh sửa',
      message: `Bạn có chắc chắn muốn lưu các thay đổi cho thông báo "${newNotification.title}"?`,
      onConfirm: () => {
        // Process attachments if any
        const attachments = newNotification.files 
          ? Array.from(newNotification.files).map(file => ({
              name: file.name,
              size: file.size,
              type: file.type,
              url: URL.createObjectURL(file)
            }))
          : undefined;
        
        // Save the changes
        setDraftNotifications((prev: Notification[]) => prev.map((n: Notification) =>
          n.id === editingNotification
            ? {
                ...n,
                title: newNotification.title,
                content: newNotification.content,
                type: newNotification.notificationType,
                target: newNotification.target,
                priority: newNotification.priority,
                attachments: attachments
              }
            : n
        ));
        
        // Close confirm dialog
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        
        // Reset form and editing state
        setNewNotification({
          title: '',
          content: '',
          priority: 'Trung bình',
          notificationType: 'Cập Nhật Hệ Thống',
          target: 'Tất cả',
          files: null
        });
        setEditingNotification(null);
        
        // Show success message after a short delay
        setTimeout(() => {
          setConfirmDialog({
            isOpen: true,
            title: 'Lưu thành công',
            message: 'Đã lưu chỉnh sửa thông báo thành công!',
            confirmText: 'Đóng',
            onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false })),
            onCancel: () => setConfirmDialog(prev => ({ ...prev, isOpen: false })),
            type: 'success',
            hideCancel: true
          });
        }, 100);
      },
      onCancel: () => setConfirmDialog(prev => ({ ...prev, isOpen: false })),
      type: 'warning'
    });
  };

  const handleCancelEdit = () => {
    setNewNotification({
      title: '',
      content: '',
      priority: 'Trung bình',
      notificationType: 'Cập Nhật Hệ Thống',
      target: 'Tất cả',
      files: null
    });
    setEditingNotification(null);
  };

  const handleDeleteDraft = (id: number) => {
    const notification = draftNotifications.find((n: Notification) => n.id === id);
    if (!notification) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Xác nhận xóa',
      message: `Bạn có chắc chắn muốn xóa thông báo "${notification.title}"?`,
      onConfirm: () => {
        // Add to history (deleted draft has no recipients)
        setNotificationHistory((prev: NotificationHistory[]) => [{
          id: Date.now(),
          action: 'deleted',
          title: notification.title,
          content: notification.content,
          type: notification.type,
          target: notification.target,
          priority: notification.priority,
          actionDate: new Date().toLocaleString('vi-VN'),
          createdDate: notification.createdDate,
          attachments: notification.attachments,
          totalRecipients: 0,
          readCount: 0
        }, ...prev]);
        
        // Remove from drafts
        setDraftNotifications((prev: Notification[]) => prev.filter((n: Notification) => n.id !== id));
        
        // Remove from selection if selected
        setSelectedNotifications(prev => prev.filter(nId => nId !== id));
        
        // Close the confirm dialog first
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        
        // Then show success message after a short delay
        setTimeout(() => {
          setConfirmDialog({
            isOpen: true,
            title: 'Đã xóa thành công',
            message: 'Thông báo đã được xóa khỏi hệ thống!',
            confirmText: 'Đóng',
            onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false })),
            onCancel: () => setConfirmDialog(prev => ({ ...prev, isOpen: false })),
            type: 'success',
            hideCancel: true
          });
        }, 100);
      },
      onCancel: () => setConfirmDialog(prev => ({ ...prev, isOpen: false })),
      type: 'danger'
    });
  };

  const handlePreviewDraft = (id: number) => {
    const notification = draftNotifications.find((n: Notification) => n.id === id);
    if (notification) {
      setPreviewModal({
        isOpen: true,
        notification: notification
      });
    }
  };

  const handlePreviewHistory = (id: number) => {
    const history = notificationHistory.find((h: NotificationHistory) => h.id === id);
    if (history) {
      // Convert history to notification format for modal
      const notificationForModal: Notification = {
        id: history.id,
        title: history.title,
        content: history.content,
        type: history.type,
        target: history.target,
        priority: history.priority,
        createdDate: history.createdDate,
        attachments: history.attachments
      };
      setPreviewModal({
        isOpen: true,
        notification: notificationForModal
      });
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 bg-gray-50 overflow-y-auto">
        {/* Page Header with Time Filter */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Quản lý Thông báo</h1>
            <TimeFilter 
              value={timeFilter} 
              onChange={setTimeFilter}
              selectedYear={selectedYear}
              onYearChange={setSelectedYear}
            />
          </div>
          <p className="text-gray-600">Tạo và quản lý thông báo gửi đến sinh viên và giảng viên</p>
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
                <span>Lịch sử thông báo</span>
                {notificationHistory.length > 0 && (
                  <span className="ml-2 bg-blue-100 text-blue-600 py-0.5 px-2 rounded-full text-xs font-medium">
                    {notificationHistory.length}
                  </span>
                )}
              </button>
            </nav>
          </div>
        </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 cursor-pointer hover:shadow-lg transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Tổng số thông báo</p>
                <p className="text-3xl font-bold text-blue-900">{statistics.total}</p>
                <p className={`text-sm font-medium flex items-center mt-1 ${statistics.totalDiff >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
                  {statistics.totalDiff >= 0 ? '↗' : '↘'} {statistics.totalDiff >= 0 ? '+' : ''}{statistics.totalDiff} so với {timeFilter === 'hôm-nay' ? 'hôm qua' : timeFilter === 'tuần-này' ? 'tuần trước' : timeFilter === 'tháng-này' ? 'tháng trước' : 'năm trước'}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white text-xl">🔔</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 cursor-pointer hover:shadow-lg transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Đã đọc</p>
                <p className="text-3xl font-bold text-green-900">{statistics.read}</p>
                <p className={`text-sm font-medium flex items-center mt-1 ${statistics.readDiff >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                  {statistics.readDiff >= 0 ? '↗' : '↘'} {statistics.readDiff >= 0 ? '+' : ''}{statistics.readDiff} so với {timeFilter === 'hôm-nay' ? 'hôm qua' : timeFilter === 'tuần-này' ? 'tuần trước' : timeFilter === 'tháng-này' ? 'tháng trước' : 'năm trước'}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white text-xl">✓</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 cursor-pointer hover:shadow-lg transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Chưa đọc</p>
                <p className="text-3xl font-bold text-red-900">{statistics.unread}</p>
                <p className={`text-sm font-medium flex items-center mt-1 ${statistics.unreadDiff >= 0 ? 'text-red-700' : 'text-green-600'}`}>
                  {statistics.unreadDiff >= 0 ? '↗' : '↘'} {statistics.unreadDiff >= 0 ? '+' : ''}{statistics.unreadDiff} so với {timeFilter === 'hôm-nay' ? 'hôm qua' : timeFilter === 'tuần-này' ? 'tuần trước' : timeFilter === 'tháng-này' ? 'tháng trước' : 'năm trước'}
                </p>
              </div>
              <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white text-xl">✕</span>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>

        {/* Chart Section */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="h-80 w-full">
              <NotificationChart timeFilter={timeFilter} />
            </div>
          </CardContent>
        </Card>

        {/* Create New Notification Section */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {editingNotification ? 'Chỉnh sửa thông báo' : 'Tạo thông báo mới'}
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" key={editingNotification || 'new-form'}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tiêu đề thông báo</label>
                  <input 
                    type="text" 
                    placeholder="Nhập tiêu đề thông báo..." 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-800 placeholder:text-gray-400"
                    value={newNotification.title}
                    onChange={(e) => setNewNotification(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung thông báo</label>
                  <textarea 
                    rows={4} 
                    placeholder="Nhập nội dung thông báo..." 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-800 placeholder:text-gray-400"
                    value={newNotification.content}
                    onChange={(e) => setNewNotification(prev => ({ ...prev, content: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mức độ ưu tiên</label>
                  <select 
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Loại thông báo</label>
                  <select 
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
                    value={newNotification.notificationType}
                    onChange={(e) => setNewNotification(prev => ({ ...prev, notificationType: e.target.value }))}
                  >
                    <option>Cập Nhật Hệ Thống</option>
                    <option>Cảnh Báo Học Tập</option>
                    <option>Sự Kiện Tổ Chức</option>
                    <option>Vinh Danh Cá Nhân</option>
                    <option>Lịch Thi</option>
                    <option>Thông Tin Chung</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Đối tượng nhận</label>
                  <select 
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
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
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors cursor-pointer"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
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
                      <p className="text-xs text-gray-500 mt-1">Hỗ trợ: PDF, DOC, DOCX, JPG, PNG (tối đa 30MB)</p>
                    </label>
                  </div>
                  
                  {/* Display selected files */}
                  {newNotification.files && newNotification.files.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-gray-700">Đã chọn {newNotification.files.length} file</p>
                        <p className="text-xs text-gray-600">
                          Tổng: {(Array.from(newNotification.files).reduce((sum, file) => sum + file.size, 0) / 1024 / 1024).toFixed(2)} MB / 30 MB
                        </p>
                      </div>
                      {Array.from(newNotification.files).map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <span className="text-blue-600">📎</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-800 truncate">{file.name}</p>
                              <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(index)}
                            className="ml-2 text-red-500 hover:text-red-700 text-sm font-medium transition-colors cursor-pointer"
                            title="Xóa file"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
              {editingNotification ? (
                <>
                  <button 
                    onClick={handleCancelEdit}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-1.5 rounded-lg font-medium text-xs transition-colors cursor-pointer"
                  >
                    ✕ Hủy
                  </button>
                  <button 
                    onClick={handleSaveEdit}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-1.5 rounded-lg font-medium text-xs transition-colors cursor-pointer"
                  >
                    💾 Lưu chỉnh sửa
                  </button>
                </>
              ) : (
                <button 
                  onClick={handleCreateNotification}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-1.5 rounded-lg font-medium text-xs transition-colors cursor-pointer"
                >
                  ➕ Tạo thông báo
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Draft Notifications List */}
        <Card>
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Danh sách thông báo</h3>
              <div className="flex items-center space-x-3">
                {/* Filters */}
                <select 
                  className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option>Tất cả loại</option>
                  <option>Cập Nhật Hệ Thống</option>
                  <option>Cảnh Báo Học Tập</option>
                  <option>Sự Kiện Tổ Chức</option>
                  <option>Vinh Danh Cá Nhân</option>
                  <option>Lịch Thi</option>
                  <option>Thông Tin Chung</option>
                </select>
                
                <select 
                  className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                  value={targetFilterList}
                  onChange={(e) => setTargetFilterList(e.target.value)}
                >
                  <option>Tất cả đối tượng</option>
                  <option>Tất cả</option>
                  <option>Sinh viên</option>
                  <option>Giảng viên</option>
                  <option>Lãnh đạo</option>
                  <option>Phụ huynh</option>
                </select>
                
                <select 
                  className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                  value={priorityFilterList}
                  onChange={(e) => setPriorityFilterList(e.target.value)}
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
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    <input
                      type="checkbox"
                      checked={paginatedNotifications.length > 0 && selectedNotifications.length === filteredNotifications.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedNotifications(filteredNotifications.map((n: Notification) => n.id));
                        } else {
                          setSelectedNotifications([]);
                        }
                      }}
                      className="w-4 h-4 rounded border-2 border-gray-400 bg-white checked:bg-blue-600 checked:border-blue-600 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tiêu đề thông báo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại thông báo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đối tượng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mức độ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedNotifications.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <span className="text-4xl mb-2">📝</span>
                        <p className="text-sm">Chưa có thông báo nào phù hợp với bộ lọc</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedNotifications.map((notification: Notification) => (
                    <tr key={notification.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedNotifications.includes(notification.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedNotifications(prev => [...prev, notification.id]);
                            } else {
                              setSelectedNotifications(prev => prev.filter(id => id !== notification.id));
                            }
                          }}
                          className="w-4 h-4 rounded border-2 border-gray-400 bg-white checked:bg-blue-600 checked:border-blue-600 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span className="text-blue-500 mr-3">🔔</span>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{notification.title}</div>
                            <div className="text-sm text-gray-500 line-clamp-1">{notification.content}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">{notification.type}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getTargetBadgeClasses(notification.target)}>{notification.target}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getPriorityBadgeClasses(notification.priority)}>{notification.priority}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{notification.createdDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <EmojiIconButton
                            emoji="👁️"
                            title="Xem trước"
                            onClick={() => handlePreviewDraft(notification.id)}
                            color="blue"
                          />
                          <EmojiIconButton
                            emoji="✏️"
                            title="Chỉnh sửa"
                            onClick={() => handleEditDraft(notification.id)}
                            color="yellow"
                          />
                          <EmojiIconButton
                            emoji="🗑️"
                            title="Xóa"
                            onClick={() => handleDeleteDraft(notification.id)}
                            color="red"
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination and Send Button Section */}
          <div className="p-6 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-700">
              {totalPages > 1 ? (
                <span>
                  Hiển thị <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> đến{' '}
                  <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredNotifications.length)}</span> trong tổng số{' '}
                  <span className="font-medium">{filteredNotifications.length}</span> thông báo
                </span>
              ) : (
                <span>
                  Tổng số: <span className="font-medium">{filteredNotifications.length}</span> thông báo
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              {/* Delete selected button */}
              {selectedNotifications.length > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  className="bg-red-600 text-white px-4 py-1.5 text-xs rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
                >
                  <i className="fas fa-trash"></i>
                  Xóa đã chọn ({selectedNotifications.length})
                </button>
              )}
              
              {/* Send Button */}
              <button 
                onClick={handleSendSelected}
                disabled={selectedNotifications.length === 0}
                className={`px-4 py-1.5 rounded-lg font-medium text-xs transition-colors ${
                  selectedNotifications.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                }`}
              >
                📧 Gửi thông báo ({selectedNotifications.length})
              </button>
              
              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  {/* Previous button */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-800 hover:bg-gray-50 border border-gray-300'
                    }`}
                  >
                    <i className="fas fa-chevron-left mr-1"></i>
                    Trước
                  </button>
                  
                  {/* Page numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                      // Show first page, last page, current page, and pages around current
                      const showPage = 
                        page === 1 || 
                        page === totalPages || 
                        (page >= currentPage - 1 && page <= currentPage + 1);
                      
                      // Show ellipsis
                      const showEllipsisBefore = page === currentPage - 2 && currentPage > 3;
                      const showEllipsisAfter = page === currentPage + 2 && currentPage < totalPages - 2;
                      
                      if (showEllipsisBefore || showEllipsisAfter) {
                        return (
                          <span key={page} className="px-2 text-gray-500">
                            ...
                          </span>
                        );
                      }
                      
                      if (!showPage) return null;
                      
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-800 hover:bg-gray-50 border border-gray-300'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Next button */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-800 hover:bg-gray-50 border border-gray-300'
                    }`}
                  >
                    Sau
                    <i className="fas fa-chevron-right ml-1"></i>
                  </button>
                </div>
              )}
            </div>
          </div>
        </Card>

        </>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <>
          {/* Filters */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <h3 className="text-base font-semibold text-gray-800 mb-3">Bộ lọc lịch sử</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Hành động</label>
                  <select 
                    value={historyActionFilter}
                    onChange={(e) => setHistoryActionFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-800 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option>Tất cả hành động</option>
                    <option>Đã gửi</option>
                    <option>Đã xóa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Loại thông báo</label>
                  <select 
                    value={historyTypeFilter}
                    onChange={(e) => setHistoryTypeFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-800 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option>Tất cả loại</option>
                    <option>Lịch Thi</option>
                    <option>Cập Nhật Hệ Thống</option>
                    <option>Sự Kiện Tổ Chức</option>
                    <option>Cảnh Báo Học Tập</option>
                    <option>Vinh Danh Cá Nhân</option>
                    <option>Thông Tin Chung</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Đối tượng</label>
                  <select 
                    value={historyTargetFilter}
                    onChange={(e) => setHistoryTargetFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-800 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option>Tất cả</option>
                    <option>Sinh viên</option>
                    <option>Giảng viên</option>
                    <option>Phụ huynh</option>
                    <option>Lãnh đạo</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* History Table */}
        <Card>
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Lịch sử thông báo</h3>
          </div>
          
          {filteredHistory.length === 0 ? (
            <div className="p-12 text-center">
              <div className="flex flex-col items-center justify-center text-gray-400">
                <span className="text-6xl mb-4">📜</span>
                <p className="text-lg font-medium">Không tìm thấy lịch sử phù hợp</p>
                <p className="text-sm mt-2">Thử điều chỉnh bộ lọc để xem kết quả khác</p>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tiêu đề</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại thông báo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đối tượng</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tỉ lệ đọc</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedHistory.map((history) => {
                      const readPercentage = history.totalRecipients && history.totalRecipients > 0
                        ? Math.round((history.readCount! / history.totalRecipients) * 100)
                        : 0;
                      
                      return (
                      <tr key={history.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{history.actionDate}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {history.action === 'sent' ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                              ✓ Đã gửi
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">
                              ✕ Đã xóa
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{history.title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">{history.type}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={getTargetBadgeClasses(history.target)}>{history.target}</span>
                        </td>
                        <td className="px-6 py-4">
                          {history.action === 'sent' && history.totalRecipients && history.totalRecipients > 0 ? (
                            <div className="flex items-center gap-2 min-w-[150px]">
                              {/* Thanh loading với 2 màu nối tiếp nhau - giảm kích thước */}
                              <div className="flex-1 bg-gray-200 rounded-full h-2.5 overflow-visible flex relative">
                                {/* Phần đã đọc (màu xanh lá) */}
                                {readPercentage > 0 && (
                                  <div 
                                    className="bg-green-500 hover:bg-green-600 transition-all duration-200 relative h-full group"
                                    style={{ width: `${readPercentage}%` }}
                                  >
                                    {/* Tooltip - chỉ hiện khi hover vào phần màu xanh */}
                                    <div className="absolute hidden group-hover:block bg-white border-2 border-green-500 text-gray-800 text-xs rounded py-1.5 px-2.5 -top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap z-50 shadow-xl font-medium pointer-events-none">
                                      ✓ Đã đọc: {history.readCount} người
                                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-0.5">
                                        <div className="border-[5px] border-transparent border-t-green-500"></div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Phần chưa đọc (màu vàng) */}
                                {readPercentage < 100 && (
                                  <div 
                                    className="bg-yellow-400 hover:bg-yellow-500 transition-all duration-200 relative h-full group"
                                    style={{ width: `${100 - readPercentage}%` }}
                                  >
                                    {/* Tooltip - chỉ hiện khi hover vào phần màu vàng */}
                                    <div className="absolute hidden group-hover:block bg-white border-2 border-yellow-500 text-gray-800 text-xs rounded py-1.5 px-2.5 -top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap z-50 shadow-xl font-medium pointer-events-none">
                                      ⏱ Chưa đọc: {history.totalRecipients! - history.readCount!} người
                                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-0.5">
                                        <div className="border-[5px] border-transparent border-t-yellow-500"></div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              {/* Phần trăm */}
                              <span className="text-xs font-semibold text-gray-700 min-w-[38px] text-right">
                                {readPercentage}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button 
                            onClick={() => handlePreviewHistory(history.id)}
                            className="text-blue-600 hover:text-blue-900 text-xs font-medium cursor-pointer transition-colors"
                            title="Xem chi tiết"
                          >
                            👁️ Xem chi tiết
                          </button>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="bg-white px-6 py-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <p className="text-sm text-gray-700">
                      Hiển thị <span className="font-medium">{((historyPage - 1) * itemsPerPage) + 1}</span> đến <span className="font-medium">{Math.min(historyPage * itemsPerPage, filteredHistory.length)}</span> trong tổng số <span className="font-medium">{filteredHistory.length}</span> kết quả
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setHistoryPage(prev => Math.max(prev - 1, 1))}
                      disabled={historyPage === 1}
                      className="px-3 py-1 text-sm text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Trước
                    </button>
                    
                    {/* Page numbers with ellipsis */}
                    {[...Array(historyTotalPages)].map((_, index) => {
                      const pageNum = index + 1;
                      // Show first page, last page, current page, and pages around current
                      if (
                        pageNum === 1 ||
                        pageNum === historyTotalPages ||
                        (pageNum >= historyPage - 1 && pageNum <= historyPage + 1)
                      ) {
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setHistoryPage(pageNum)}
                            className={`px-3 py-1 text-sm border rounded-md ${
                              historyPage === pageNum
                                ? 'bg-blue-500 text-white border-blue-500'
                                : 'text-gray-800 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      } else if (
                        pageNum === historyPage - 2 ||
                        pageNum === historyPage + 2
                      ) {
                        return <span key={pageNum} className="px-2 text-gray-500">...</span>;
                      }
                      return null;
                    })}
                    
                    <button
                      onClick={() => setHistoryPage(prev => Math.min(prev + 1, historyTotalPages))}
                      disabled={historyPage === historyTotalPages}
                      className="px-3 py-1 text-sm text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sau
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </Card>
        </>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        onConfirm={confirmDialog.onConfirm}
        onCancel={confirmDialog.onCancel || (() => setConfirmDialog(prev => ({ ...prev, isOpen: false })))}
        type={confirmDialog.type}
        hideCancel={confirmDialog.hideCancel}
      />

      {/* Notification Detail Modal */}
      <NotificationDetailModal
        isOpen={previewModal.isOpen}
        notification={previewModal.notification}
        onClose={() => setPreviewModal({ isOpen: false, notification: null })}
      />
      </div>
    </AdminLayout>
  );
}