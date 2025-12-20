import { useState, useEffect, useMemo } from "react"
import { useTranslation } from 'react-i18next'
import AdminLayout from "../../components/ui/admin/AdminLayout"
import LoadingSpinner from "../../components/ui/admin/LoadingSpinner"
import TimeFilter from "../../components/ui/admin/TimeFilter"
import dashboardStatsService, {
  type DashboardStatsResponse,
  type LearningDashboardSummaryResponse,
} from "@/services/api/dashboardStatsService"
import { useToast } from "@/lib/useToast"
import useWebSocketStats from "@/hooks/useWebSocketStats"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'

type TimeFilterValue = 'hôm-nay' | 'tuần-này' | 'tháng-này' | 'năm-này' | 'tất-cả';
type AdminViewMode = 'overview' | 'learning';

// Đăng ký các components của Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Simple Card components (nếu shadcn/ui không có sẵn)
const SimpleCard = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
    {children}
  </div>
);

// Icon components dùng Font Awesome (có thể thay bằng react-icons)
const UserGraduateIcon = () => <i className="fas fa-user-graduate text-gray-400"></i>;
const ChalkboardTeacherIcon = () => <i className="fas fa-chalkboard-teacher text-gray-400"></i>;
const ArrowUpIcon = () => <i className="fas fa-arrow-up"></i>;
const ArrowDownIcon = () => <i className="fas fa-arrow-down"></i>;

export default function AdminOverviewDashboard() {
  const { t } = useTranslation(['admin', 'common']);
  const { showToast } = useToast();

  // Quản lý chế độ xem của admin: overview hoặc learning
  const [adminViewMode, setAdminViewMode] = useState<AdminViewMode>('overview');

  // Hàm lấy năm học hiện tại (ví dụ: "2025-2026")
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

  // Tạo danh sách các năm học có thể chọn (hiện tại + 4 năm trước)
  const getAcademicYearOptions = () => {
    const current = getCurrentAcademicYear();
    const [startYear] = current.split('-').map(Number);
    const years = [];
    for (let i = 0; i < 5; i++) {
      const year = startYear - i;
      years.push(`${year}-${year + 1}`);
    }
    return years;
  };

  // Trạng thái filter thời gian
  const [viewMode, setViewMode] = useState<'day' | 'month' | 'year' | 'all'>('day');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Trạng thái lọc chính
  const [selectedSchool, setSelectedSchool] = useState("Tất cả các trường");
  const [courseYear, setCourseYear] = useState("Tất cả khóa");
  const [selectedMajor, setSelectedMajor] = useState("Tất cả");
  const [selectedClass, setSelectedClass] = useState("Tất cả");
  const [selectedSemester, setSelectedSemester] = useState("Kỳ 1");
  const [selectedYear, setSelectedYear] = useState<string>(getCurrentAcademicYear());

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingLearning, setIsLoadingLearning] = useState(false);
  const [overviewStats, setOverviewStats] = useState<DashboardStatsResponse | null>(null);
  const [learningStats, setLearningStats] = useState<LearningDashboardSummaryResponse | null>(null);

  // Thống kê thời gian truy cập
  const [accessTimeStats, setAccessTimeStats] = useState<{
    morning: number;
    afternoon: number;
    evening: number;
  } | null>(null);

  // Tùy chọn filter từ backend
  const [filterOptions, setFilterOptions] = useState<{
    schools: string[];
    courseYears: string[];
    majors: Array<{ name: string; school: string }>;
    classes: Array<{ code: string; cohortYear: number; program: string; school: string }>;
    academicYears?: string[];
    semesters?: string[];
  } | null>(null);

  // WebSocket real-time trigger (shared hook)
  const realTimeUpdateTrigger = useWebSocketStats();

  // Tải filter options khi component mount
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const options = await dashboardStatsService.getFilterOptions();
        setFilterOptions(options);
        
        // Set default năm học và học kỳ từ dữ liệu thực (nếu có)
        if (options.academicYears && options.academicYears.length > 0) {
          setSelectedYear(options.academicYears[0]); // Năm học mới nhất
        }
        if (options.semesters && options.semesters.length > 0) {
          setSelectedSemester(options.semesters[0]); // Học kỳ đầu tiên
        }
      } catch (error) {
        showToast('Không thể tải filter options', 'error');
      }
    };
    loadFilterOptions();
  }, [showToast]);

  // Hàm lấy text so sánh
  const getComparisonPeriodText = () => {
    const prevDate = new Date(selectedDate);
    prevDate.setDate(prevDate.getDate() - 1);
    return prevDate.toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  // Lấy danh sách majors dựa trên trường đã chọn
  const availableMajors = useMemo(() => {
    if (!filterOptions || selectedSchool === "Tất cả các trường") return [];
    return filterOptions.majors
      .filter((m) => m.school === selectedSchool)
      .map((m) => m.name);
  }, [filterOptions, selectedSchool]);

  // Lấy danh sách lớp dựa trên trường và ngành đã chọn
  const availableClasses = useMemo(() => {
    if (!filterOptions || selectedSchool === "Tất cả các trường") return [];
    let filtered = filterOptions.classes.filter((c) => c.school === selectedSchool);
    if (selectedMajor !== "Tất cả") {
      filtered = filtered.filter((c) => c.program === selectedMajor);
    }
    return filtered.map((c) => c.code);
  }, [filterOptions, selectedSchool, selectedMajor]);

  // Reset các filter khi trường thay đổi
  useEffect(() => {
    setCourseYear("Tất cả khóa");
    setSelectedMajor("Tất cả");
    setSelectedClass("Tất cả");
  }, [selectedSchool]);

  // Map viewMode sang backend timeFilter
  const mapViewModeToTimeFilter = (
    mode: 'day' | 'month' | 'year' | 'all'
  ): TimeFilterValue => {
    if (mode === 'day') return 'hôm-nay';
    if (mode === 'month') return 'tháng-này';
    if (mode === 'year') return 'năm-này';
    return 'tất-cả';
  };

  const computedTimeFilter = useMemo(
    () => mapViewModeToTimeFilter(viewMode),
    [viewMode]
  );

  const computedAnchorDate = useMemo(
    () => selectedDate.toISOString().split('T')[0],
    [selectedDate]
  );

  // Tính sinceYear cho mode 'all'
  const computedSinceYear = useMemo(() => {
    try {
      const academicOptions = getAcademicYearOptions();
      const last = academicOptions[academicOptions.length - 1];
      const earliestStart = last ? parseInt(last.split('-')[0], 10) : new Date().getFullYear();
      return Math.max(2022, earliestStart);
    } catch (e) {
      return 2022;
    }
  }, []);

  // Fetch dữ liệu thống kê tổng quan (time-based snapshot) - chỉ cho KPI cards và access time
  useEffect(() => {
    if (adminViewMode !== 'overview') return;
    const fetchOverview = async () => {
      setIsLoading(true);
      try {
        const selectedCalendarYear =
          viewMode === 'year' ? String(selectedDate.getFullYear()) : undefined;
        const queryParams: any = {
          timeFilter: computedTimeFilter,
          ...(viewMode !== 'all' && { anchorDate: computedAnchorDate }),
          ...(viewMode === 'year' && { selectedYear: selectedCalendarYear }),
          ...(viewMode === 'all' && { sinceYear: computedSinceYear }),
          school: selectedSchool !== 'Tất cả các trường' ? selectedSchool : undefined,
          courseYear: courseYear !== 'Tất cả khóa' ? courseYear : undefined,
          major: selectedMajor !== 'Tất cả' ? selectedMajor : undefined,
          class: selectedClass !== 'Tất cả' ? selectedClass : undefined,
        };
        const statsResponse: DashboardStatsResponse =
          await dashboardStatsService.getDashboardStats(queryParams);
        // Fetch access time với cùng filter thời gian
        const accessTimeResponse = await dashboardStatsService.getAccessTimeStats(queryParams);
        setOverviewStats(statsResponse);
        setAccessTimeStats(accessTimeResponse.percentages);
      } catch (error) {
        showToast('Không thể tải dữ liệu', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchOverview();
  }, [
    adminViewMode,
    viewMode,
    selectedDate,
    selectedSchool,
    courseYear,
    selectedMajor,
    selectedClass,
    showToast,
    realTimeUpdateTrigger,
  ]);

  // Fetch dữ liệu học tập (theo kỳ, năm học) - luôn fetch bất kể adminViewMode để hiển thị biểu đồ
  useEffect(() => {
    // Chờ filterOptions load xong để có đúng academicYear và semester từ dữ liệu thực
    if (!filterOptions) return;
    
    const fetchLearning = async () => {
      setIsLoadingLearning(true);
      // Khi ở mode learning, cũng set isLoading cho KPI cards
      if (adminViewMode === 'learning') {
        setIsLoading(true);
      }
      try {
        const params: any = {
          semester: selectedSemester,
          academicYear: selectedYear,
          school: selectedSchool !== 'Tất cả các trường' ? selectedSchool : undefined,
          courseYear: courseYear !== 'Tất cả khóa' ? courseYear : undefined,
          major: selectedMajor !== 'Tất cả' ? selectedMajor : undefined,
          class: selectedClass !== 'Tất cả' ? selectedClass : undefined,
        };
        const learningStatsResp = await dashboardStatsService.getLearningDashboardSummary(params);
        setLearningStats(learningStatsResp);
      } catch (error) {
        showToast('Không thể tải dữ liệu học tập', 'error');
      } finally {
        setIsLoadingLearning(false);
        if (adminViewMode === 'learning') {
          setIsLoading(false);
        }
      }
    };
    fetchLearning();
  }, [
    adminViewMode,
    filterOptions,
    selectedSchool,
    courseYear,
    selectedMajor,
    selectedClass,
    selectedSemester,
    selectedYear,
    showToast,
    realTimeUpdateTrigger,
  ]);

  // Dữ liệu biểu đồ truy cập thời gian
  const accessTimeData = useMemo(() => {
    if (!accessTimeStats) {
      return {
        labels: [t('admin:dashboard.morning'), t('admin:dashboard.afternoon'), t('admin:dashboard.evening')],
        datasets: [
          {
            data: [0, 0, 0],
            backgroundColor: [
              '#FCD34D', // Vàng sáng
              '#3B82F6', // Xanh chiều
              '#8B5CF6', // Tím tối
            ],
            hoverBackgroundColor: [
              '#FDE68A',
              '#60A5FA',
              '#A78BFA',
            ],
          },
        ],
      };
    }
    return {
      labels: [t('admin:dashboard.morning'), t('admin:dashboard.afternoon'), t('admin:dashboard.evening')],
      datasets: [
        {
          data: [
            accessTimeStats.morning,
            accessTimeStats.afternoon,
            accessTimeStats.evening,
          ],
          backgroundColor: [
            '#FCD34D',
            '#3B82F6',
            '#8B5CF6',
          ],
          borderWidth: 0,
          hoverBackgroundColor: [
            '#FDE68A',
            '#60A5FA',
            '#A78BFA',
          ],
        },
      ],
    };
  }, [accessTimeStats, t]);

  // Thống kê active tùy theo tab
  const activeStats = adminViewMode === 'overview' ? overviewStats : learningStats;
  const comparisonLabel = adminViewMode === 'overview' ? getComparisonPeriodText() : (learningStats?.learningContext?.previousLabel ?? '');

// Dữ liệu phân phối GPA
  const gpaData = useMemo(() => {
    if (!learningStats) {
      return {
        labels: ['Xuất sắc', 'Giỏi', 'Khá', 'Trung bình', 'Trung bình yếu', 'Kém'],
        datasets: [
          {
            data: [0, 0, 0, 0, 0, 0],
            backgroundColor: ['#10B981', '#06B6D4', '#F59E0B', '#F97316', '#EF4444', '#EF4444'],
            borderWidth: 0,
          },
        ],
      };
    }
    const g = learningStats.gpaDistribution || {
      excellent: 0,
      veryGood: 0,
      good: 0,
      average: 0,
      weak: 0,
    };
    return {
      labels: ['Xuất sắc', 'Giỏi', 'Khá', 'Trung bình', 'Trung bình yếu', 'Kém'],
      datasets: [
        {
          data: [
            g.excellent ?? 0,
            g.veryGood ?? 0,
            g.good ?? 0,
            g.average ?? 0,
            g.weak ?? 0,
          ],
          backgroundColor: ['#10B981', '#06B6D4', '#F59E0B', '#F97316', '#EF4444'],
          borderWidth: 0,
        },
      ],
    };
  }, [learningStats]);

  // Dữ liệu phân phối điểm theo trường - mỗi trường 1 cột tại vị trí GPA trung bình
  const scoreDistributionData = useMemo(() => {
    if (!learningStats || !learningStats.scoreDistribution) {
      return {
        labels: [],
        datasets: [{
          label: 'Số sinh viên',
          data: [],
          backgroundColor: [],
          borderColor: [],
          borderWidth: 2,
          borderRadius: 6,
        }],
      };
    }
    
    const colors = [
      'rgba(59, 130, 246, 0.8)',
      'rgba(245, 158, 11, 0.8)',
      'rgba(139, 92, 246, 0.8)',
      'rgba(20, 184, 166, 0.8)',
      'rgba(251, 191, 36, 0.8)',
      'rgba(34, 197, 94, 0.8)',
      'rgba(239, 68, 68, 0.8)',
      'rgba(168, 85, 247, 0.8)',
      'rgba(236, 72, 153, 0.8)',
    ];
    
    // Tạo data points: mỗi trường = 1 điểm với x=GPA trung bình, y=tổng số sinh viên
    const dataPoints = learningStats.scoreDistribution.schools.map((school, idx) => {
      const totalStudents = school.scores.reduce((sum, count) => sum + count, 0);
      return {
        x: school.averageGpa ?? 0, // Vị trí trên trục X
        y: totalStudents, // Chiều cao cột
        label: school.schoolName,
        backgroundColor: colors[idx % colors.length],
        borderColor: colors[idx % colors.length].replace('0.8', '1'),
      };
    });
    
    return {
      labels: dataPoints.map(d => d.label),
      datasets: [{
        label: 'Số sinh viên',
        data: dataPoints.map(d => ({ x: d.x, y: d.y })),
        backgroundColor: dataPoints.map(d => d.backgroundColor),
        borderColor: dataPoints.map(d => d.borderColor),
        borderWidth: 2,
        borderRadius: 6,
        barThickness: 40, // Độ rộng cột cố định
      }],
    };
  }, [learningStats]);

  // Cấu hình biểu đồ bar
  const barOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false, // Ẩn legend vì mỗi trường có màu riêng
        },
        tooltip: {
          callbacks: {
            title: function (context: any) {
              // Lấy tên trường từ labels
              const index = context[0].dataIndex;
              return scoreDistributionData.labels[index];
            },
            label: function (context: any) {
              const gpa = context.parsed.x.toFixed(2);
              const students = Math.round(context.parsed.y);
              return [
                `GPA trung bình: ${gpa}`,
                `Tổng sinh viên: ${students.toLocaleString()}`
              ];
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            callback: function(value: any) {
              return Math.round(value); // Chỉ hiển thị số nguyên
            }
          },
          grid: { color: '#F3F4F6' },
          title: {
            display: true,
            text: 'Số lượng sinh viên',
            font: { size: 12, weight: 'bold' as const },
          },
        },
        x: {
          type: 'linear' as const,
          min: 0,
          max: 4,
          ticks: {
            stepSize: 0.5,
            callback: function(value: any) {
              return value.toFixed(1);
            }
          },
          grid: { display: true, color: '#F3F4F6' },
          title: {
            display: true,
            text: 'Thang điểm GPA (0-4)',
            font: { size: 12, weight: 'bold' as const },
          },
        },
      },
    };
  }, [scoreDistributionData]);

  // Cấu hình biểu đồ doughnut
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { boxWidth: 12, font: { size: 11 }, padding: 10 },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const label = context.label || '';
            const value = context.parsed ?? 0;
            return `${label}: ${value}%`;
          },
        },
      },
    },
    cutout: '60%',
  };

  // Danh sách sinh viên tiêu biểu - tính lọc và giữ nguyên danh sách đầy đủ từ backend
  const topList = learningStats?.topStudents ?? [];
  const filteredTopStudents = useMemo(() => {
    let list = topList.slice();
    if (selectedMajor !== "Tất cả") {
      list = list.filter((s: any) => String(s.major ?? '').includes(selectedMajor.split(' ')[0]));
    }
    if (selectedClass !== "Tất cả") {
      list = list.filter((s: any) => s.class === selectedClass);
    }
    if (list.length === 0) return topList;
    return list;
  }, [topList, selectedMajor, selectedClass]);

  const totalTopCount = topList.length;

  return (
    <AdminLayout>
      {/* Tiêu đề và nút chuyển đổi chế độ */}
      <div className="mb-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">PREDICA</h1>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAdminViewMode('overview')}
                  className={`px-3 py-1 text-xs rounded-md border ${
                    adminViewMode === 'overview'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300'
                  }`}
                >
                  {t('admin:dashboard.systemStats')}
                </button>
                <button
                  onClick={() => setAdminViewMode('learning')}
                  className={`px-3 py-1 text-xs rounded-md border ${
                    adminViewMode === 'learning'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300'
                  }`}
                >
                  {t('admin:dashboard.learningData')}
                </button>
              </div>
            </div>
            <p className="text-gray-600">{t('admin:dashboard.description')}</p>
          </div>
          <div>
            {adminViewMode === 'overview' && (
              <TimeFilter
                viewMode={viewMode}
                selectedDate={selectedDate}
                onViewModeChange={setViewMode}
                onDateChange={setSelectedDate}
              />
            )}
          </div>
        </div>
      </div>

      {/* Bộ lọc chính */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
          {/* Trường */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{t('admin:filters.school')}</label>
            <select
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-md bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
            >
              {filterOptions?.schools.map((school) => (
                <option key={school} value={school}>{school}</option>
              ))}
            </select>
          </div>
          {/* Khóa */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{t('admin:filters.course')}</label>
            <select
              value={courseYear}
              onChange={(e) => setCourseYear(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-md bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
            >
              {filterOptions?.courseYears.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          {/* Ngành */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{t('admin:filters.major')}</label>
            <select
              value={selectedMajor}
              onChange={(e) => setSelectedMajor(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-md bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
            >
              <option>{t('admin:filters.allMajors')}</option>
              {availableMajors.map((majorName) => (
                <option key={majorName} value={majorName}>{majorName}</option>
              ))}
            </select>
          </div>
          {/* Lớp */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{t('admin:filters.class')}</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-md bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
            >
              <option>{t('admin:filters.allClasses')}</option>
              {availableClasses.map((classCode) => (
                <option key={classCode} value={classCode}>{classCode}</option>
              ))}
            </select>
          </div>
          {/* Kỳ */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{t('admin:filters.semester')}</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              disabled={adminViewMode === 'overview'}
              className={`w-full px-2 py-1.5 border border-gray-300 rounded-md bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs ${
                adminViewMode === 'overview' ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {filterOptions?.semesters && filterOptions.semesters.length > 0 ? (
                filterOptions.semesters.map((sem) => (
                  <option key={sem} value={sem}>{sem}</option>
                ))
              ) : (
                <>
                  <option>{t('admin:filters.semester1')}</option>
                  <option>{t('admin:filters.semester2')}</option>
                  <option>{t('admin:filters.semester3')}</option>
                </>
              )}
            </select>
          </div>
          {/* Năm học */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{t('admin:filters.academicYear')}</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              disabled={adminViewMode === 'overview'}
              className={`w-full px-2 py-1.5 border border-gray-300 rounded-md bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs ${
                adminViewMode === 'overview' ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {filterOptions?.academicYears && filterOptions.academicYears.length > 0 ? (
                filterOptions.academicYears.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))
              ) : (
                getAcademicYearOptions().map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))
              )}
            </select>
          </div>
          {/* Nút reset */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setSelectedSchool(t('admin:filters.allSchools'));
                setCourseYear(t('admin:filters.allCourses'));
                setSelectedMajor(t('admin:filters.allMajors'));
                setSelectedClass(t('admin:filters.allClasses'));
                // Reset về giá trị từ API nếu có, nếu không thì dùng default
                setSelectedSemester(filterOptions?.semesters?.[0] ?? t('admin:filters.semester1'));
                setSelectedYear(filterOptions?.academicYears?.[0] ?? getCurrentAcademicYear());
              }}
              className="w-full px-3 py-1.5 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors font-medium text-xs"
            >
              <i className="fas fa-undo mr-1"></i> {t('admin:dashboard.reset')}
            </button>
          </div>
        </div>
      </div>

      {/* Các Card KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 relative" style={{ minHeight: isLoading ? '120px' : 'auto' }}>
        {isLoading && (
          <LoadingSpinner text={t('admin:dashboard.loadingStats')} size="md" position="center" />
        )}
        {!isLoading && (
          <>
            {/* Thống kê số sinh viên */}
            <SimpleCard className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-blue-700 mb-1">{t('admin:dashboard.totalStudents')}</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {activeStats?.current?.students ? activeStats.current.students.toLocaleString() : '0'}
                  </p>
                  {activeStats?.comparison?.students && (
                    <p
                      className={`text-xs font-medium mt-1 flex items-center ${
                        activeStats?.comparison?.students?.trend === 'up'
                          ? 'text-green-600'
                          : activeStats?.comparison?.students?.trend === 'down'
                          ? 'text-red-600'
                          : 'text-gray-600'
                      }`}
                    >
                      {activeStats?.comparison?.students?.trend === 'up' && <ArrowUpIcon />}
                      {activeStats?.comparison?.students?.trend === 'down' && <ArrowDownIcon />}
                      <span className="ml-1">
                        {activeStats?.comparison?.students?.trend === 'up' ? '+' : activeStats?.comparison?.students?.trend === 'down' ? '' : ''}
                        {activeStats?.comparison?.students?.value} ({activeStats?.comparison?.students?.percentage}%) {t('admin:dashboard.comparedTo')} {comparisonLabel}
                      </span>
                    </p>
                  )}
                </div>
                <div className="w-10 h-10 bg-blue-200 rounded-lg flex items-center justify-center">
                  <UserGraduateIcon />
                </div>
              </div>
            </SimpleCard>

            {/* Thống kê số giảng viên */}
            <SimpleCard className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-green-700 mb-1">{t('admin:dashboard.totalTeachers')}</p>
                  <p className="text-2xl font-bold text-green-900">{activeStats?.current?.instructors ?? '0'}</p>
                  {((activeStats?.comparison as any)?.instructors) && (
                    <p
                      className={`text-xs font-medium mt-1 flex items-center ${
                        ((activeStats?.comparison as any)?.instructors)?.trend === 'up'
                          ? 'text-green-600'
                          : ((activeStats?.comparison as any)?.instructors)?.trend === 'down'
                          ? 'text-red-600'
                          : 'text-gray-600'
                      }`}
                    >
                      {((activeStats?.comparison as any)?.instructors)?.trend === 'up' && <ArrowUpIcon />}
                      {((activeStats?.comparison as any)?.instructors)?.trend === 'down' && <ArrowDownIcon />}
                      <span className="ml-1">
                        {((activeStats?.comparison as any)?.instructors)?.trend === 'up' ? '+' : ((activeStats?.comparison as any)?.instructors)?.trend === 'down' ? '' : ''}
                        {((activeStats?.comparison as any)?.instructors)?.value} ({((activeStats?.comparison as any)?.instructors)?.percentage}%) {t('admin:dashboard.comparedTo')} {comparisonLabel}
                      </span>
                    </p>
                  )}
                </div>
                <div className="w-10 h-10 bg-green-200 rounded-lg flex items-center justify-center">
                  <ChalkboardTeacherIcon />
                </div>
              </div>
            </SimpleCard>

            {/* Cảnh báo Sinh viên - 2 phần: Nguy cơ (2.0-2.5) và Buộc thôi học (<2.0) */}
            <SimpleCard className="bg-gradient-to-br from-red-50 to-orange-100 border-red-200 p-4">
              <div className="mb-2">
                <p className="text-xs font-medium text-red-700 mb-1">{t('admin:dashboard.studentWarnings')}</p>
              </div>
              {/* Hai cột: Nguy cơ bên trái, Buộc thôi học bên phải */}
              <div className="grid grid-cols-2 gap-3">
                {/* Nguy cơ: GPA 2.0 - 2.5 */}
                <div className="bg-white/50 rounded-lg p-2">
                  <div className="flex items-center mb-1">
                    <i className="fas fa-exclamation-circle text-orange-600 text-xs mr-1"></i>
                    <span className="text-[10px] font-medium text-gray-600">{t('admin:dashboard.warning')}</span>
                  </div>
                  <p className="text-xl font-bold text-orange-900">
                    {(activeStats as any)?.current?.warning ?? 0}
                  </p>
                  <p className="text-[9px] text-gray-500">GPA 2.0 - 2.49</p>
                </div>
                {/* Buộc thôi học: GPA < 2.0 */}
                <div className="bg-white/50 rounded-lg p-2">
                  <div className="flex items-center mb-1">
                    <i className="fas fa-exclamation-triangle text-red-600 text-xs mr-1"></i>
                    <span className="text-[10px] font-medium text-gray-600">{t('admin:dashboard.atRisk')}</span>
                  </div>
                  <p className="text-xl font-bold text-red-900">
                    {activeStats?.current?.atRisk ?? 0}
                  </p>
                  <p className="text-[9px] text-gray-500">GPA &lt; 2.0</p>
                </div>
              </div>
              {/* Tổng cảnh báo */}
              <div className="mt-2 pt-2 border-t border-red-200">
                <p className="text-xs text-red-700 font-medium text-center">
                  {t('admin:dashboard.totalWarnings')}: {' '}
                  <span className="text-sm font-bold text-red-900">
                    {((activeStats as any)?.current?.warning ?? 0) + (activeStats?.current?.atRisk ?? 0)}
                  </span>
                </p>
              </div>
            </SimpleCard>

            {/* Hiệu suất trung bình */}
            <SimpleCard className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 p-4">
              <div className="mb-2">
                <p className="text-xs font-medium text-purple-700 mb-1">{t('admin:dashboard.averagePerformance')}</p>
              </div>
              {/* Hai cột: Sinh viên bên trái, Giảng viên bên phải */}
              <div className="grid grid-cols-2 gap-3">
                {/* Hiệu suất sinh viên */}
                <div className="bg-white/50 rounded-lg p-2">
                  <div className="flex items-center mb-1">
                    <i className="fas fa-user-graduate text-purple-600 text-xs mr-1"></i>
                    <span className="text-[10px] font-medium text-gray-600">{t('admin:dashboard.students')}</span>
                  </div>
                  <p className="text-xl font-bold text-purple-900">
                    {activeStats?.current?.performance?.student
                      ? activeStats.current.performance.student.toFixed(1)
                      : '0.0'}
                    %
                  </p>
                </div>
                {/* Hiệu suất giảng viên */}
                <div className="bg-white/50 rounded-lg p-2">
                  <div className="flex items-center mb-1">
                    <i className="fas fa-chalkboard-teacher text-purple-600 text-xs mr-1"></i>
                    <span className="text-[10px] font-medium text-gray-600">{t('admin:dashboard.teachers')}</span>
                  </div>
                  <p className="text-xl font-bold text-purple-900">
                    {activeStats?.current?.performance?.instructor
                      ? activeStats.current.performance.instructor.toFixed(1)
                      : '0.0'}
                    %
                  </p>
                </div>
              </div>
              {/* Trung bình chung */}
              <div className="mt-2 pt-2 border-t border-purple-200">
                <p className="text-xs text-purple-700 font-medium text-center">
                  {t('admin:dashboard.averageOverall')}: {' '}
                  <span className="text-sm font-bold">
                    {activeStats?.current?.performance
                      ? (
                          (activeStats.current.performance.student +
                            activeStats.current.performance.instructor) /
                          2
                        ).toFixed(1)
                      : '0.0'}
                    %
                  </span>
                </p>
              </div>
            </SimpleCard>
          </>
        )}
      </div>

      {/* Các biểu đồ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Thống kê thời gian truy cập - chỉ chịu ảnh hưởng bởi TimeFilter */}
        <SimpleCard className="p-4">
          <h3 className="text-base font-semibold text-gray-900 mb-3">{t('admin:dashboard.accessTimeStats')}</h3>
          <div
            className="h-48 w-full relative"
            style={{ minHeight: isLoading && adminViewMode === 'overview' ? '200px' : 'auto' }}
          >
            {isLoading && adminViewMode === 'overview' ? (
              <LoadingSpinner text={t('admin:dashboard.loadingChart')} size="md" position="center" />
            ) : (
              <Doughnut data={accessTimeData} options={doughnutOptions} />
            )}
          </div>
        </SimpleCard>

        {/* Thống kê phân trăm GPA - chịu ảnh hưởng bởi filter học tập */}
        <SimpleCard className="p-4">
          <h3 className="text-base font-semibold text-gray-900 mb-3">{t('admin:dashboard.gpaDistribution')}</h3>
          <div
            className="h-48 w-full relative"
            style={{ minHeight: isLoadingLearning ? '200px' : 'auto' }}
          >
            {isLoadingLearning ? (
              <LoadingSpinner text={t('admin:dashboard.loadingChart')} size="md" position="center" />
            ) : (
              <Doughnut data={gpaData} options={doughnutOptions} />
            )}
          </div>
        </SimpleCard>
      </div>

      {/* Danh sách sinh viên tiêu biểu - chịu ảnh hưởng bởi filter học tập */}
      <SimpleCard className="p-4 mb-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">
          {t('admin:dashboard.topStudents')}{' '}
          <span className="text-sm font-normal text-gray-600 ml-2">
            {totalTopCount > 0 ? (
              selectedSchool === t('admin:filters.allSchools')
                ? `(${t('admin:dashboard.topAll')} ${totalTopCount} ${t('admin:dashboard.allSchools')})`
                : selectedClass !== t('admin:filters.allClasses')
                ? `(${t('admin:dashboard.topAll')} ${totalTopCount} - ${selectedClass})`
                : selectedMajor !== t('admin:filters.allMajors')
                ? `(${t('admin:dashboard.topAll')} ${totalTopCount} - ${selectedMajor})`
                : courseYear !== t('admin:filters.allCourses')
                ? `(${t('admin:dashboard.topAll')} ${totalTopCount} - ${courseYear})`
                : `(${t('admin:dashboard.topAll')} ${totalTopCount} - ${selectedSchool})`
            ) : ''}
          </span>
        </h3>
        {isLoadingLearning ? (
          <div className="h-32 relative">
            <LoadingSpinner text={t('admin:dashboard.loadingList')} size="md" position="center" />
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {filteredTopStudents.map((student: any, idx: number) => {
            const gradientColors = [
              'from-yellow-50 to-orange-50 border-yellow-200',
              'from-blue-50 to-indigo-50 border-blue-200',
              'from-green-50 to-emerald-50 border-green-200',
              'from-purple-50 to-violet-50 border-purple-200',
            ];
            const textColors = [
              'text-yellow-700 bg-yellow-100',
              'text-blue-700 bg-blue-100',
              'text-green-700 bg-green-100',
              'text-purple-700 bg-purple-100',
            ];
            const gpaColors = [
              'text-yellow-600',
              'text-blue-600',
              'text-green-600',
              'text-purple-600',
            ];
            const i = idx % gradientColors.length;
            return (
              <div
                key={student.id}
                className={`bg-gradient-to-br ${gradientColors[i]} border rounded-lg p-3`}
              >
                <div className="flex items-center justify-between mb-2">
                  <i className="fas fa-star text-yellow-500"></i>
                  <span
                    className={`text-xs font-medium ${textColors[i]} px-2 py-1 rounded-full`}
                  >
                    #{student.rank}
                  </span>
                </div>
                <h4
                  className="text-sm font-semibold text-gray-900 mb-1 truncate"
                  title={student.name}
                >
                  {student.name}
                </h4>
                {selectedSchool === "Tất cả các trường" && (
                  <p className="text-xs text-gray-600 mb-1 truncate" title={student.school}>
                    {student.school}
                  </p>
                )}
                {selectedMajor === "Tất cả" && selectedClass === "Tất cả" && (
                  <p className="text-xs text-gray-600 mb-1 truncate" title={student.major}>
                    {student.major}
                  </p>
                )}
                <p className={`text-xl font-bold ${gpaColors[i]}`}>GPA {student.gpa.toFixed(2)}</p>
              </div>
            );
          })}
        </div>
        )}
      </SimpleCard>

      {/* Biểu đồ phân phối điểm các trường - chịu ảnh hưởng bởi filter học tập */}
      <SimpleCard className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t('admin:dashboard.scoreDistribution')}
          <span className="text-sm font-normal text-gray-600 ml-2">
            {selectedSchool === t('admin:filters.allSchools')
              ? `(${t('admin:dashboard.comparing')} ${scoreDistributionData.datasets.length} ${t('admin:dashboard.schools')})`
              : selectedClass !== t('admin:filters.allClasses')
              ? `(${selectedClass})`
              : selectedMajor !== t('admin:filters.allMajors')
              ? `(${selectedMajor})`
              : courseYear !== t('admin:filters.allCourses')
              ? `(${courseYear})`
              : `(${selectedSchool})`}
          </span>
        </h3>
        {/* Biểu đồ phân phối điểm (Chart.js Bar) */}
        <div className="h-64 relative" style={{ minHeight: isLoadingLearning ? '200px' : 'auto' }}>
          {isLoadingLearning ? (
            <LoadingSpinner text={t('admin:dashboard.loadingGPA')} size="md" position="center" />
          ) : (
            <Bar data={scoreDistributionData} options={barOptions} />
          )}
        </div>
      </SimpleCard>
    </AdminLayout>
  );
}