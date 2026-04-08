import AdminLayout from "@/components/ui/admin/AdminLayout";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { studentService, type StudentOnlineStats } from "@/services/api/studentService";
import dashboardStatsService, { type LearningDashboardSummaryResponse } from "@/services/api/dashboardStatsService";
import { useToast } from "@/lib/useToast";
import { io, Socket } from "socket.io-client";
import { buildSocketUrl } from "@/services/api/config";
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
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [onlineStats, setOnlineStats] = useState<StudentOnlineStats>({
    onlineCount: 0,
    totalCount: 0
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [learningStats, setLearningStats] = useState<LearningDashboardSummaryResponse | null>(null);
  const [isLoadingLearning, setIsLoadingLearning] = useState(true);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [topStudentsAll, setTopStudentsAll] = useState<any[]>([]);

  // Tự động lấy năm học và học kỳ hiện tại
  const getCurrentAcademicYear = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11
    if (currentMonth >= 7) { // từ tháng 8 trở đi
      return `${currentYear}-${currentYear + 1}`;
    } else {
      return `${currentYear - 1}-${currentYear}`;
    }
  };

  const getCurrentSemester = () => {
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-11
    // Kỳ 1: tháng 8-12, Kỳ 2: tháng 1-5, Kỳ hè: tháng 6-7
    if (currentMonth >= 7 && currentMonth <= 11) return "Kỳ 1";
    if (currentMonth >= 0 && currentMonth <= 4) return "Kỳ 2";
    return "Kỳ hè";
  };

  // Fetch online stats on mount and refresh every 30 seconds
  useEffect(() => {
    let socket: Socket | null = null;

    const initializeSocket = async () => {
      try {
        // Initial fetch via REST API
        const stats = await studentService.getOnlineStats();
        setOnlineStats(stats);
        setIsLoadingStats(false);

        // Setup WebSocket connection for real-time updates
        socket = io(buildSocketUrl('/student-stats'), {
          transports: ['websocket', 'polling'],
        });

        socket.on('connect', () => {
          console.log('WebSocket connected for student stats');
        });

        socket.on('studentOnlineStatsUpdated', (stats: StudentOnlineStats) => {
          console.log('Received real-time student stats update:', stats);
          setOnlineStats(stats);
        });

        socket.on('disconnect', () => {
          console.log('WebSocket disconnected for student stats');
        });

        socket.on('connect_error', (error) => {
          console.error('WebSocket connection error:', error);
        });
      } catch (error) {
        console.error('Failed to fetch initial online stats:', error);
        showToast('Không thể tải thống kê sinh viên trực tuyến', 'error');
        setIsLoadingStats(false);
      }
    };

    initializeSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [showToast]);

  // Fetch learning stats (sinh viên theo trường, At-Risk, Top students)
  useEffect(() => {
    const fetchLearningStats = async () => {
      setIsLoadingLearning(true);
      try {
        // Lấy tổng số sinh viên TOÀN HỆ THỐNG (không filter)
        const overviewStats = await dashboardStatsService.getDashboardStats({
          timeFilter: 'tất-cả',
        });
        setTotalStudents(overviewStats.current.students);

        // Lấy TOP 10 SINH VIÊN GPA CAO NHẤT TOÀN HỆ THỐNG (không filter trường/kỳ)
        const topStudentsResponse = await dashboardStatsService.getTopStudents({
          // Không truyền filter gì để lấy toàn bộ
        });
        setTopStudentsAll(topStudentsResponse.students || []);

        // Lấy dữ liệu học tập theo kỳ hiện tại (cho At-Risk)
        const params = {
          semester: getCurrentSemester(),
          academicYear: getCurrentAcademicYear(),
        };
        const stats = await dashboardStatsService.getLearningDashboardSummary(params);
        setLearningStats(stats);
      } catch (error) {
        console.error('Failed to fetch learning stats:', error);
        showToast('Không thể tải thống kê học tập', 'error');
      } finally {
        setIsLoadingLearning(false);
      }
    };
    fetchLearningStats();
  }, [showToast]);

  // Danh sách top 10 sinh viên GPA cao nhất toàn hệ thống
  const topStudents = useMemo(() => {
    return topStudentsAll.slice(0, 10); // Top 10
  }, [topStudentsAll]);

  const handleViewStudentList = () => {
    navigate('/admin/students/list');
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Page Title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý Sinh viên</h1>
            <p className="text-gray-600">Theo dõi và quản lý thông tin sinh viên trong hệ thống</p>
          </div>
          <button 
            onClick={handleViewStudentList}
            className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs cursor-pointer"
          >
            <i className="fas fa-list mr-2"></i>
            Xem danh sách sinh viên
          </button>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Tổng số sinh viên */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 mb-1">Tổng số sinh viên</p>
                  {isLoadingLearning ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <>
                      <p className="text-3xl font-bold text-blue-600">
                        {totalStudents?.toLocaleString() ?? 0}
                      </p>
                      <p className="text-sm text-blue-600 mt-1">sinh viên trong hệ thống</p>
                    </>
                  )}
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-user-graduate text-blue-600 text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sinh viên đang trực tuyến */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 mb-1">Đang trực tuyến</p>
                  {isLoadingStats ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                    </div>
                  ) : (
                    <>
                      <p className="text-3xl font-bold text-green-600">{onlineStats.onlineCount}</p>
                      <p className="text-sm text-green-600 mt-1">
                        {onlineStats.totalCount > 0 
                          ? `${((onlineStats.onlineCount / onlineStats.totalCount) * 100).toFixed(1)}% đang hoạt động`
                          : 'chưa có dữ liệu'}
                      </p>
                    </>
                  )}
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-circle text-green-600 text-xl animate-pulse"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sinh viên At-Risk */}
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700 mb-1">Sinh viên At-Risk</p>
                  {isLoadingLearning ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
                    </div>
                  ) : (
                    <>
                      <p className="text-3xl font-bold text-red-600">
                        {learningStats?.current?.atRisk ?? 0}
                      </p>
                      <p className="text-sm text-red-600 mt-1">GPA &lt; 2.0</p>
                    </>
                  )}
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-exclamation-triangle text-red-600 text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sinh viên cần hỗ trợ */}
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700 mb-1">Cần hỗ trợ</p>
                  {isLoadingLearning ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
                    </div>
                  ) : (
                    <>
                      <p className="text-3xl font-bold text-orange-600">
                        {(learningStats?.current?.warning ?? 0) + (learningStats?.current?.atRisk ?? 0)}
                      </p>
                      <p className="text-sm text-orange-600 mt-1">GPA &lt; 2.5</p>
                    </>
                  )}
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-hands-helping text-orange-600 text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section: Rankings and News */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Top Performing Students */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Bảng xếp hạng Top 10 sinh viên GPA cao nhất
                <span className="text-sm font-normal text-gray-600 ml-2">(Toàn hệ thống)</span>
              </h3>
              {isLoadingLearning ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : topStudents.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <i className="fas fa-inbox text-4xl mb-2"></i>
                  <p>Chưa có dữ liệu xếp hạng</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topStudents.map((student, index) => {
                    // Top 3 có màu đặc biệt
                    const bgColors = [
                      'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300',
                      'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300',
                      'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-300',
                      'bg-white border-gray-200',
                      'bg-white border-gray-200',
                      'bg-white border-gray-200',
                      'bg-white border-gray-200',
                      'bg-white border-gray-200',
                      'bg-white border-gray-200',
                      'bg-white border-gray-200',
                    ];
                    const badgeColors = [
                      'bg-gradient-to-br from-yellow-400 to-yellow-600',
                      'bg-gradient-to-br from-gray-300 to-gray-500',
                      'bg-gradient-to-br from-orange-400 to-orange-600',
                      'bg-blue-500',
                      'bg-blue-500',
                      'bg-blue-500',
                      'bg-blue-500',
                      'bg-blue-500',
                      'bg-blue-500',
                      'bg-blue-500',
                    ];
                    
                    return (
                      <div key={student.id} className={`flex items-center space-x-3 p-3 rounded-lg border ${bgColors[index]} transition-all hover:shadow-md`}>
                        <div className={`w-10 h-10 ${badgeColors[index]} rounded-full flex items-center justify-center text-white font-bold shadow-lg`}>
                          {index + 1}
                        </div>
                        <img 
                          src="/src/assets/parent/avatarJohnSmith.png" 
                          alt="Avatar" 
                          className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" 
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{student.name}</p>
                          <p className="text-sm text-gray-600">{student.school}</p>
                          <p className="text-xs text-gray-500">{student.major} - {student.class}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600 text-lg">{student.gpa.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">GPA</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
