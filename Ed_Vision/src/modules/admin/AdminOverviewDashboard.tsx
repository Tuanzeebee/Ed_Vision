import { useState, useEffect, useMemo } from "react"
import AdminLayout from "../../components/ui/admin/AdminLayout"
import LoadingSpinner from "../../components/ui/admin/LoadingSpinner"
import CourseYearSelector from "../../lib/courseYearSelector"
import { 
  majorsBySchool, 
  classesBySchoolAndMajor
} from "../../lib/leadershipReportsConstants"
import { 
  getScopeStats, 
  getScoreDistributionBySchool, 
  getTopStudentsBySchool 
} from "../../lib/reportUtils"
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

// Đăng ký các components của Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

// Simple Card components since shadcn/ui might not be available
const SimpleCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
    {children}
  </div>
);

// Icon components using Font Awesome classes (you can replace with react-icons)
const UserGraduateIcon = () => <i className="fas fa-user-graduate text-gray-400"></i>
const ChalkboardTeacherIcon = () => <i className="fas fa-chalkboard-teacher text-gray-400"></i>
const ChartLineIcon = () => <i className="fas fa-chart-line text-gray-400"></i>
const ArrowUpIcon = () => <i className="fas fa-arrow-up"></i>
const ArrowDownIcon = () => <i className="fas fa-arrow-down"></i>
const ExclamationTriangleIcon = () => <i className="fas fa-exclamation-triangle"></i>

interface FilteredData {
  students: number;
  teachers: number;
  atRisk: number;
  performance: number;
}

export default function AdminOverviewDashboard() {
  // Main filter states
  const [selectedSchool, setSelectedSchool] = useState("Tất cả các trường");
  const [courseYear, setCourseYear] = useState("Tất cả khóa");
  const [selectedMajor, setSelectedMajor] = useState("Tất cả");
  const [selectedClass, setSelectedClass] = useState("Tất cả");
  const [selectedSemester, setSelectedSemester] = useState("Kỳ 1");
  const [selectedYear, setSelectedYear] = useState("2024-2025");
  
  const [isLoading, setIsLoading] = useState(false);
  const [filteredData, setFilteredData] = useState<FilteredData | null>(null);
  
  // Get available majors based on selected school
  const availableMajors = useMemo(() => {
    if (selectedSchool === "Tất cả các trường") {
      return [];
    }
    return majorsBySchool[selectedSchool] || [];
  }, [selectedSchool]);
  
  // Get available classes based on selected school and major
  const availableClasses = useMemo(() => {
    if (selectedSchool === "Tất cả các trường") {
      return [];
    }
    if (selectedMajor === "Tất cả") {
      // If "All majors" selected, show all classes from all majors in the school
      const schoolClasses = classesBySchoolAndMajor[selectedSchool] || {};
      return Object.values(schoolClasses).flat();
    }
    return classesBySchoolAndMajor[selectedSchool]?.[selectedMajor] || [];
  }, [selectedSchool, selectedMajor]);
  
  // Reset filters when school changes
  useEffect(() => {
    setCourseYear("Tất cả khóa");
    setSelectedMajor("Tất cả");
    setSelectedClass("Tất cả");
  }, [selectedSchool]);

  // Filter logic with loading state - Apply ALL filters with REALISTIC variation
  useEffect(() => {
    setIsLoading(true);
    
    const filterTimeout = setTimeout(() => {
      // Get base stats from selected school
      const baseStats = getScopeStats(selectedSchool);
      
      // Apply progressive filtering based on all selected filters
      let filteredStudents = baseStats.students;
      let filteredTeachers = baseStats.teachers;
      let filteredPerformance = baseStats.activeRate;
      
      // Filter by course year (khóa) - with realistic variation
      if (courseYear !== "Tất cả khóa") {
        // Not exactly 25%, but realistic variation between 20-30%
        // Older cohorts (K28) usually have slightly more students due to retention
        const courseYears = ["K28", "K29", "K30", "K31"];
        const selectedIndex = courseYears.indexOf(courseYear);
        
        if (selectedIndex !== -1) {
          // K28: 28%, K29: 26%, K30: 24%, K31: 22% (realistic distribution)
          const coursePercentages = [0.28, 0.26, 0.24, 0.22];
          const percentage = coursePercentages[selectedIndex];
          filteredStudents = Math.floor(filteredStudents * percentage);
          filteredTeachers = Math.floor(filteredTeachers * percentage);
        } else {
          // Fallback to ~25% with small variation
          const percentage = 0.23 + Math.random() * 0.04; // 23-27%
          filteredStudents = Math.floor(filteredStudents * percentage);
          filteredTeachers = Math.floor(filteredTeachers * percentage);
        }
      }
      
      // Filter by major (ngành) - some majors are more popular than others
      if (selectedMajor !== "Tất cả") {
        const majorCount = availableMajors.length || 1;
        
        // Popular majors (SE, AI) get more students, others less
        const popularMajors = ["Công nghệ Phần mềm", "Trí tuệ Nhân tạo", "Khoa học Dữ liệu"];
        const isPopular = popularMajors.some(major => selectedMajor.includes(major));
        
        if (isPopular) {
          // Popular majors get 15-20% more than average
          const multiplier = 1.15 + Math.random() * 0.05;
          filteredStudents = Math.floor((filteredStudents / majorCount) * multiplier);
          filteredTeachers = Math.floor((filteredTeachers / majorCount) * multiplier);
        } else {
          // Other majors get 85-95% of average
          const multiplier = 0.85 + Math.random() * 0.10;
          filteredStudents = Math.floor((filteredStudents / majorCount) * multiplier);
          filteredTeachers = Math.floor((filteredTeachers / majorCount) * multiplier);
        }
      }
      
      // Filter by class (lớp) - each class varies 30-45 students
      if (selectedClass !== "Tất cả") {
        filteredStudents = Math.floor(Math.random() * 16 + 30); // 30-45 students
        filteredTeachers = Math.floor(Math.random() * 3 + 8); // 8-10 teachers
      }
      
      // Filter by semester (kỳ) - affects performance
      if (selectedSemester === "Kỳ Hè") {
        filteredPerformance *= 0.93 + Math.random() * 0.04; // 93-97% (summer drop)
      } else if (selectedSemester === "Kỳ 2") {
        filteredPerformance *= 0.97 + Math.random() * 0.02; // 97-99% (slight drop)
      }
      
      // Filter by year (năm học) - recent years have better performance
      const yearDiff = 2025 - parseInt(selectedYear.split('-')[0]);
      const yearPenalty = Math.min(0.1, yearDiff * 0.02); // Max 10% penalty
      filteredPerformance *= Math.max(0.9, 1 - yearPenalty);
      
      console.log('Filtering data with REALISTIC variation:', {
        selectedSchool,
        courseYear,
        selectedMajor,
        selectedClass,
        selectedSemester,
        selectedYear,
        result: {
          students: filteredStudents,
          teachers: filteredTeachers,
          performance: filteredPerformance.toFixed(1)
        }
      });
      
      setFilteredData({
        students: filteredStudents,
        teachers: filteredTeachers,
        atRisk: Math.floor(filteredStudents * (0.012 + Math.random() * 0.006)), // 1.2-1.8% at risk
        performance: parseFloat(filteredPerformance.toFixed(1))
      });
      
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(filterTimeout);
  }, [selectedSchool, courseYear, selectedMajor, selectedClass, selectedSemester, selectedYear, availableMajors.length]);

  // Dữ liệu mẫu cho biểu đồ thời gian truy cập - with realistic variation based on filters
  const accessTimeData = useMemo(() => {
    // Base distribution varies by semester and time
    let morningPct = 28;
    let afternoonPct = 40;
    let eveningPct = 32;
    
    // Kỳ Hè: More afternoon/evening study
    if (selectedSemester === "Kỳ Hè") {
      morningPct = 22;
      afternoonPct = 38;
      eveningPct = 40;
    }
    
    // Specific classes have different patterns
    if (selectedClass !== "Tất cả") {
      // Add small realistic variation for specific classes
      const variation = Math.random() * 6 - 3; // -3 to +3
      morningPct += variation;
      afternoonPct -= variation / 2;
      eveningPct -= variation / 2;
    }
    
    return {
      labels: ['Sáng', 'Chiều', 'Tối'],
      datasets: [
        {
          data: [
            Math.round(morningPct),
            Math.round(afternoonPct),
            Math.round(eveningPct)
          ],
          backgroundColor: [
            '#FCD34D', // Yellow-400
            '#3B82F6', // Blue-500
            '#8B5CF6', // Purple-500
          ],
          borderWidth: 0,
          hoverBackgroundColor: [
            '#F59E0B', // Yellow-500
            '#2563EB', // Blue-600
            '#7C3AED', // Purple-600
          ],
        },
      ],
    };
  }, [selectedSemester, selectedClass]);

  // Dữ liệu mẫu cho biểu đồ GPA - with realistic variation
  const gpaData = useMemo(() => {
    // Base distribution
    let excellentPct = 85;
    let goodPct = 10;
    let averagePct = 5;
    
    // Older years had different distribution
    const selectedYearNum = parseInt(selectedYear.split('-')[0]);
    const yearDiff = 2025 - selectedYearNum;
    
    if (yearDiff > 0) {
      // Older years had slightly worse performance
      excellentPct -= yearDiff * 2; // -2% per year
      goodPct += yearDiff * 1;
      averagePct += yearDiff * 1;
    }
    
    // Kỳ Hè performance is slightly lower
    if (selectedSemester === "Kỳ Hè") {
      excellentPct -= 5;
      goodPct += 3;
      averagePct += 2;
    }
    
    // Add small random variation for realism
    const variation = Math.random() * 4 - 2; // -2 to +2
    excellentPct += variation;
    goodPct -= variation / 2;
    averagePct -= variation / 2;
    
    return {
      labels: ['Xuất sắc/Giỏi', 'Khá/Tốt', 'Trung bình/Yếu'],
      datasets: [
        {
          data: [
            Math.round(excellentPct),
            Math.round(goodPct),
            Math.round(averagePct)
          ],
          backgroundColor: [
            '#10B981', // Green-500
            '#F59E0B', // Yellow-500
            '#EF4444', // Red-500
          ],
          borderWidth: 0,
          hoverBackgroundColor: [
            '#059669', // Green-600
            '#D97706', // Yellow-600
            '#DC2626', // Red-600
          ],
        },
      ],
    };
  }, [selectedYear, selectedSemester]);

  // Dữ liệu mẫu cho biểu đồ phân phối điểm số (0-10 scale, real-time based on ALL filters)
  const scoreDistributionData = useMemo(() => {
    // Only show distribution when filters are not too specific
    // If a specific class is selected, show simple message instead
    if (selectedClass !== "Tất cả") {
      // For specific class, show simplified distribution
      const distributionData = getScoreDistributionBySchool(selectedSchool);
      const labels = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
      
      return {
        labels,
        datasets: distributionData.map((school) => ({
          label: `${school.schoolName} - ${selectedClass}`,
          // Scale down data for specific class (30-40 students) with realistic variation
          data: school.scores.map(score => {
            const baseAmount = Math.floor(score * 0.03); // ~3% of school data
            const variation = Math.floor(baseAmount * (Math.random() * 0.3 - 0.15));
            return Math.max(0, baseAmount + variation);
          }),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
          borderRadius: 4,
        }))
      };
    }
    
    const distributionData = getScoreDistributionBySchool(selectedSchool);
    const labels = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
    
    // Generate colors for each school - All distinct colors
    const colors = [
      'rgba(59, 130, 246, 0.8)',   // Blue - Trường KHMT
      'rgba(245, 158, 11, 0.8)',   // Orange - Trường Công nghệ
      'rgba(139, 92, 246, 0.8)',   // Purple - Trường Kinh tế
      'rgba(20, 184, 166, 0.8)',   // Teal - Trường Ngôn ngữ
      'rgba(251, 191, 36, 0.8)',   // Yellow - Trường Du lịch
      'rgba(34, 197, 94, 0.8)',    // Emerald Green - Trường Y-Dược
      'rgba(239, 68, 68, 0.8)',    // Red - Trường Đào tạo QT
      'rgba(168, 85, 247, 0.8)',   // Violet - Viện Nam Khuê
      'rgba(236, 72, 153, 0.8)'    // Pink - Viện Việt-Nhật
    ];
    
    return {
      labels,
      datasets: distributionData.map((school, index) => {
        let data = school.scores;
        
        // Apply filters to scale data with REALISTIC variation (not equal distribution)
        if (courseYear !== "Tất cả khóa") {
          // Instead of dividing by 4 equally, create realistic distribution
          data = data.map(score => {
            // Each course year gets ~20-30% (variation) instead of exactly 25%
            const percentage = 0.20 + Math.random() * 0.10; // 20% to 30%
            return Math.floor(score * percentage);
          });
        }
        
        if (selectedMajor !== "Tất cả") {
          // Instead of equal division, some majors are more popular
          const majorCount = availableMajors.length || 1;
          data = data.map(score => {
            // Create realistic distribution: some majors have more students
            const baseDivision = score / majorCount;
            const variation = baseDivision * (Math.random() * 0.4 - 0.2); // -20% to +20%
            return Math.max(0, Math.floor(baseDivision + variation));
          });
        }
        
        return {
          label: school.schoolName,
          data: data,
          backgroundColor: colors[index % colors.length],
          borderColor: colors[index % colors.length].replace('0.8', '1'),
          borderWidth: 1,
          borderRadius: 4,
        };
      })
    };
  }, [selectedSchool, courseYear, selectedMajor, selectedClass, availableMajors.length]);

  // Cấu hình cho biểu đồ doughnut
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Ẩn legend mặc định vì chúng ta có custom legend
      },
      tooltip: {
        callbacks: {
          label: function(context: {label: string, parsed: number}) {
            return context.label + ': ' + context.parsed + '%';
          }
        }
      }
    },
    cutout: '60%',
  };

  // Cấu hình cho biểu đồ bar với trục Y động
  const barOptions = useMemo(() => {
    // Tính giá trị cao nhất trong dataset để điều chỉnh trục Y
    let maxValue = 0;
    scoreDistributionData.datasets.forEach(dataset => {
      const datasetMax = Math.max(...dataset.data);
      if (datasetMax > maxValue) {
        maxValue = datasetMax;
      }
    });
    
    // Thêm 10% buffer và làm tròn lên để trục Y đẹp hơn
    const suggestedMax = Math.ceil(maxValue * 1.1);
    
    // Tính stepSize động dựa trên giá trị max
    let stepSize = 50;
    if (suggestedMax > 1000) {
      stepSize = 200;
    } else if (suggestedMax > 500) {
      stepSize = 100;
    } else if (suggestedMax > 200) {
      stepSize = 50;
    } else if (suggestedMax > 100) {
      stepSize = 25;
    } else {
      stepSize = 10;
    }
    
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: selectedSchool === "Tất cả các trường",
          position: 'top' as const,
          labels: {
            boxWidth: 12,
            padding: 10,
            font: {
              size: 11
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context: {dataset: {label?: string}, parsed: {y: number | null}}) {
              let label = context.dataset.label || 'Số lượng';
              if (label) {
                label += ': ';
              }
              label += (context.parsed.y ?? 0) + ' sinh viên';
              return label;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          suggestedMax: suggestedMax, // Tự động điều chỉnh theo data
          ticks: {
            stepSize: stepSize, // Bước nhảy động
          },
          grid: {
            color: '#F3F4F6',
          },
          title: {
            display: true,
            text: 'Số lượng sinh viên',
            font: {
              size: 12,
              weight: 'bold' as const
            }
          }
        },
        x: {
          grid: {
            display: false,
          },
          title: {
            display: true,
            text: 'Điểm số (0-10)',
            font: {
              size: 12,
              weight: 'bold' as const
            }
          }
        }
      },
    };
  }, [scoreDistributionData, selectedSchool]);

  return (
    <AdminLayout>
      {/* Dashboard Header */}
      <div className="mb-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">PREDICA</h1>
          <p className="text-gray-600">Tổng quan hệ thống quản lý học tập và hiệu suất sinh viên</p>
        </div>
        
        {/* Main Filter Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
            {/* Trường */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Trường</label>
              <select 
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-md bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
              >
                <option>Tất cả các trường</option>
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
            
            {/* Khóa */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Khóa</label>
              <CourseYearSelector
                value={courseYear}
                onChange={setCourseYear}
              />
            </div>
            
            {/* Ngành */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Ngành</label>
              <select 
                value={selectedMajor}
                onChange={(e) => setSelectedMajor(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-md bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
              >
                <option>Tất cả</option>
                {availableMajors.map((majorName) => (
                  <option key={majorName} value={majorName}>
                    {majorName}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Lớp */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Lớp</label>
              <select 
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-md bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
              >
                <option>Tất cả</option>
                {availableClasses.map((classCode) => (
                  <option key={classCode} value={classCode}>
                    {classCode}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Kỳ */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Kỳ</label>
              <select 
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-md bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
              >
                <option>Kỳ 1</option>
                <option>Kỳ 2</option>
                <option>Kỳ Hè</option>
              </select>
            </div>
            
            {/* Năm học */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Năm học</label>
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-md bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
              >
                <option>2024-2025</option>
                <option>2023-2024</option>
                <option>2022-2023</option>
                <option>2021-2022</option>
                <option>2020-2021</option>
              </select>
            </div>
            
            {/* Reset Button */}
            <div className="flex items-end">
              <button 
                onClick={() => {
                  setSelectedSchool("Tất cả các trường");
                  setCourseYear("Tất cả khóa");
                  setSelectedMajor("Tất cả");
                  setSelectedClass("Tất cả");
                  setSelectedSemester("Kỳ 1");
                  setSelectedYear("2024-2025");
                }}
                className="w-full px-3 py-1.5 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors font-medium text-xs"
              >
                <i className="fas fa-undo mr-1"></i>
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 relative" style={{ minHeight: isLoading ? '120px' : 'auto' }}>
            {isLoading && (
              <LoadingSpinner 
                text="Đang tải dữ liệu..." 
                size="md" 
                position="center" 
              />
            )}
            {!isLoading && (
              <>
                <SimpleCard className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-blue-700 mb-1">Tổng số Sinh viên</p>
                      <p className="text-2xl font-bold text-blue-900">{filteredData?.students?.toLocaleString() || '12,847'}</p>
                      <p className="text-xs text-green-600 font-medium mt-1">
                        <ArrowUpIcon />
                        <span className="ml-1">+1,542 sinh viên so với tháng trước</span>
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-blue-200 rounded-lg flex items-center justify-center">
                      <UserGraduateIcon />
                    </div>
                  </div>
                </SimpleCard>

                <SimpleCard className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-green-700 mb-1">Số lượng Giảng viên</p>
                      <p className="text-2xl font-bold text-green-900">{filteredData?.teachers || '342'}</p>
                      <p className="text-xs text-green-600 font-medium mt-1">
                        <ArrowUpIcon />
                        <span className="ml-1">+17 giảng viên so với tháng trước</span>
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-green-200 rounded-lg flex items-center justify-center">
                      <ChalkboardTeacherIcon />
                    </div>
                  </div>
                </SimpleCard>

                <SimpleCard className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-red-700 mb-1">Sinh viên có nguy cơ</p>
                      <p className="text-2xl font-bold text-red-900">{filteredData?.atRisk || '15'}</p>
                      <p className="text-xs text-green-600 font-medium mt-1">
                        <ArrowDownIcon />
                        <span className="ml-1">-5 sinh viên so với tuần trước</span>
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-red-200 rounded-lg flex items-center justify-center">
                      <ExclamationTriangleIcon />
                    </div>
                  </div>
                </SimpleCard>

                <SimpleCard className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-purple-700 mb-1">Hiệu suất Trung bình</p>
                      <p className="text-2xl font-bold text-purple-900">{filteredData?.performance || '87.3'}%</p>
                      <p className="text-xs text-green-600 font-medium mt-1">
                        <ArrowUpIcon />
                        <span className="ml-1">+2.1% so với tháng trước</span>
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-purple-200 rounded-lg flex items-center justify-center">
                      <ChartLineIcon />
                    </div>
                  </div>
                </SimpleCard>
              </>
            )}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Access Time Statistics */}
            <SimpleCard className="p-4">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Thống kê thời gian truy cập</h3>
              <div className="h-48 w-full relative" style={{ minHeight: isLoading ? '200px' : 'auto' }}>
                {isLoading ? (
                  <LoadingSpinner 
                    text="Đang tải biểu đồ..." 
                    size="md" 
                    position="center" 
                  />
                ) : (
                  <Doughnut data={accessTimeData} options={doughnutOptions} />
                )}
              </div>
              <div className="flex justify-center space-x-6 mt-4 text-sm">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-400 rounded-full mr-2"></div>
                  <span className="font-medium text-gray-700">Sáng ({accessTimeData.datasets[0].data[0]}%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
                  <span className="font-medium text-gray-700">Chiều ({accessTimeData.datasets[0].data[1]}%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-purple-500 rounded-full mr-2"></div>
                  <span className="font-medium text-gray-700">Tối ({accessTimeData.datasets[0].data[2]}%)</span>
                </div>
              </div>
            </SimpleCard>

            {/* GPA Distribution */}
            <SimpleCard className="p-4">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Thống kê phân trăm GPA</h3>
              <div className="h-48 w-full relative" style={{ minHeight: isLoading ? '200px' : 'auto' }}>
                {isLoading ? (
                  <LoadingSpinner 
                    text="Đang tải biểu đồ..." 
                    size="md" 
                    position="center" 
                  />
                ) : (
                  <Doughnut data={gpaData} options={doughnutOptions} />
                )}
              </div>
              <div className="flex justify-center space-x-6 mt-4 text-sm">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                  <span className="font-medium text-gray-700">Xuất sắc/Giỏi ({gpaData.datasets[0].data[0]}%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full mr-2"></div>
                  <span className="font-medium text-gray-700">Khá/Tốt ({gpaData.datasets[0].data[1]}%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
                  <span className="font-medium text-gray-700">Trung bình/Yếu ({gpaData.datasets[0].data[2]}%)</span>
                </div>
              </div>
            </SimpleCard>
          </div>

          {/* Outstanding Students */}
          <SimpleCard className="p-4 mb-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              Danh sách Sinh viên tiêu biểu
              <span className="text-sm font-normal text-gray-600 ml-2">
                {selectedSchool === "Tất cả các trường" 
                  ? "(Top 10 toàn trường)" 
                  : selectedClass !== "Tất cả"
                  ? `(Top 5 - ${selectedClass})`
                  : selectedMajor !== "Tất cả"
                  ? `(Top 5 - ${selectedMajor})`
                  : courseYear !== "Tất cả khóa"
                  ? `(Top 5 - ${courseYear})`
                  : `(Top 5 - ${selectedSchool})`}
              </span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {useMemo(() => {
                const limit = selectedSchool === "Tất cả các trường" ? 10 : 5;
                const topStudents = getTopStudentsBySchool(selectedSchool, limit);
                
                // Filter students based on selected filters
                let filteredStudents = topStudents;
                
                if (selectedMajor !== "Tất cả") {
                  filteredStudents = filteredStudents.filter(s => s.major.includes(selectedMajor.split(' ')[0]));
                }
                
                if (selectedClass !== "Tất cả") {
                  filteredStudents = filteredStudents.filter(s => s.class === selectedClass);
                }
                
                // If no students match filters, show top students anyway
                if (filteredStudents.length === 0) {
                  filteredStudents = topStudents;
                }
                
                return filteredStudents.slice(0, 4); // Display first 4 students
              }, [selectedSchool, selectedMajor, selectedClass]).map((student, idx) => {
                const gradientColors = [
                  'from-yellow-50 to-orange-50 border-yellow-200',
                  'from-blue-50 to-indigo-50 border-blue-200',
                  'from-green-50 to-emerald-50 border-green-200',
                  'from-purple-50 to-violet-50 border-purple-200'
                ];
                const textColors = [
                  'text-yellow-700 bg-yellow-100',
                  'text-blue-700 bg-blue-100',
                  'text-green-700 bg-green-100',
                  'text-purple-700 bg-purple-100'
                ];
                const gpaColors = [
                  'text-yellow-600',
                  'text-blue-600',
                  'text-green-600',
                  'text-purple-600'
                ];
                
                return (
                  <div key={student.id} className={`bg-gradient-to-br ${gradientColors[idx]} border rounded-lg p-3`}>
                    <div className="flex items-center justify-between mb-2">
                      <i className="fas fa-star text-yellow-500"></i>
                      <span className={`text-xs font-medium ${textColors[idx]} px-2 py-1 rounded-full`}>
                        #{student.rank}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-1 truncate" title={student.name}>
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
                    <p className={`text-xl font-bold ${gpaColors[idx]}`}>GPA {student.gpa.toFixed(2)}</p>
                  </div>
                );
              })}
            </div>
          </SimpleCard>

          {/* Score Distribution Chart */}
          <SimpleCard className="p-4">
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              Biểu đồ phân phối điểm số (0-10)
              <span className="text-sm font-normal text-gray-600 ml-2">
                {selectedSchool === "Tất cả các trường" 
                  ? "(So sánh 9 trường)" 
                  : selectedClass !== "Tất cả"
                  ? `(${selectedClass})`
                  : selectedMajor !== "Tất cả"
                  ? `(${selectedMajor})`
                  : courseYear !== "Tất cả khóa"
                  ? `(${courseYear})`
                  : `(${selectedSchool})`}
              </span>
            </h3>

            {/* Score Distribution Chart - Chart.js Bar Chart */}
            <div className="h-64 relative" style={{ minHeight: isLoading ? '200px' : 'auto' }}>
              {isLoading ? (
                <LoadingSpinner 
                  text="Đang tải biểu đồ phân phối..." 
                  size="md" 
                  position="center" 
                />
              ) : (
                <Bar data={scoreDistributionData} options={barOptions} />
              )}
            </div>
          </SimpleCard>
    </AdminLayout>
  )
}