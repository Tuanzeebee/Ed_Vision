import { useState, useEffect } from "react";
import { studentService, type StudentData } from "@/services/api/studentService";
import { useToast } from "@/lib/useToast";
import LoadingSpinner from "@/components/ui/admin/LoadingSpinner";
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

// Dữ liệu lịch sử học tập theo năm và kỳ
const studyHistoryData: {
  [year: string]: {
    [semester: string]: Array<{
      subject: string;
      attendance: number | null;
      regular: number | null;
      midterm: number | null;
      individualAssignment: number | null;
      groupAssignment: number | null;
      quiz1: number | null;
      quiz2: number | null;
      final: number | null;
      weights: {
        attendance: number;
        regular: number;
        midterm: number;
        individualAssignment: number;
        groupAssignment: number;
        quiz1: number;
        quiz2: number;
        final: number;
      };
    }>;
  };
} = {
  "2024-2025": {
    "Kỳ 1": [
      {
        subject: "Toán cao cấp",
        attendance: 9.0,
        regular: 8.5,
        midterm: 8.0,
    individualAssignment: 8.8,
    groupAssignment: null, // Không có điểm này
    quiz1: 7.8,
    quiz2: null, // Không có điểm này
    final: 8.5,
    weights: {
      attendance: 10,
      regular: 10,
      midterm: 15,
      individualAssignment: 10,
      groupAssignment: 0,
      quiz1: 5,
      quiz2: 0,
      final: 50
    }
  },
  {
    subject: "Lý đại cương",
    attendance: 9.5,
    regular: 9.0,
    midterm: 8.5,
    individualAssignment: null, // Không có điểm này
    groupAssignment: 9.2,
    quiz1: 8.2,
    quiz2: 8.5,
    final: 9.0,
    weights: {
      attendance: 10,
      regular: 10,
      midterm: 15,
      individualAssignment: 0,
      groupAssignment: 10,
      quiz1: 5,
      quiz2: 5,
      final: 45
    }
  },
  {
    subject: "Lập trình cơ sở",
    attendance: 8.0,
    regular: 7.5,
    midterm: 7.0,
    individualAssignment: 7.8,
    groupAssignment: 7.5,
    quiz1: 6.9,
    quiz2: 7.2,
    final: 7.5,
    weights: {
      attendance: 10,
      regular: 10,
      midterm: 15,
      individualAssignment: 5,
      groupAssignment: 5,
      quiz1: 5,
      quiz2: 5,
      final: 45
    }
  },
  {
    subject: "Chủ nghĩa xã hội khoa học",
    attendance: 8.5,
    regular: 8.0,
    midterm: 7.8,
    individualAssignment: null,
    groupAssignment: null,
    quiz1: 7.5,
    quiz2: null,
    final: 8.0,
    weights: {
      attendance: 10,
      regular: 15,
      midterm: 20,
      individualAssignment: 0,
      groupAssignment: 0,
      quiz1: 5,
      quiz2: 0,
      final: 50
    }
  },
  {
    subject: "Tin học ứng dụng",
    attendance: 9.8,
    regular: 9.2,
    midterm: 9.0,
    individualAssignment: 9.5,
    groupAssignment: null,
    quiz1: 8.5,
    quiz2: 9.0,
    final: 9.2,
    weights: {
      attendance: 10,
      regular: 10,
      midterm: 15,
      individualAssignment: 10,
      groupAssignment: 0,
      quiz1: 5,
      quiz2: 5,
      final: 45
    }
  },
  {
    subject: "CDIO",
    attendance: 9.0,
    regular: 8.8,
    midterm: 8.5,
    individualAssignment: 8.5,
    groupAssignment: 9.0,
    quiz1: 8.0,
    quiz2: null,
    final: 8.8,
    weights: {
      attendance: 10,
      regular: 10,
      midterm: 15,
      individualAssignment: 5,
      groupAssignment: 5,
      quiz1: 5,
      quiz2: 0,
      final: 50
    }
  }
],
    "Kỳ 2": [
      {
        subject: "Cấu trúc dữ liệu",
        attendance: 8.5,
        regular: 8.8,
        midterm: 8.2,
        individualAssignment: 9.0,
        groupAssignment: null,
        quiz1: 8.0,
        quiz2: 8.5,
        final: 8.7,
        weights: {
          attendance: 10,
          regular: 10,
          midterm: 15,
          individualAssignment: 10,
          groupAssignment: 0,
          quiz1: 5,
          quiz2: 5,
          final: 45
        }
      },
      {
        subject: "Cơ sở dữ liệu",
        attendance: 9.0,
        regular: 8.5,
        midterm: 8.8,
        individualAssignment: null,
        groupAssignment: 8.9,
        quiz1: 8.2,
        quiz2: null,
        final: 9.0,
        weights: {
          attendance: 10,
          regular: 10,
          midterm: 15,
          individualAssignment: 0,
          groupAssignment: 10,
          quiz1: 5,
          quiz2: 0,
          final: 50
        }
      },
      {
        subject: "Mạng máy tính",
        attendance: 8.8,
        regular: 8.0,
        midterm: 7.8,
        individualAssignment: 8.5,
        groupAssignment: 8.2,
        quiz1: 7.5,
        quiz2: 8.0,
        final: 8.3,
        weights: {
          attendance: 10,
          regular: 10,
          midterm: 15,
          individualAssignment: 5,
          groupAssignment: 5,
          quiz1: 5,
          quiz2: 5,
          final: 45
        }
      },
      {
        subject: "Tiếng Anh chuyên ngành",
        attendance: 9.5,
        regular: 9.0,
        midterm: 8.8,
        individualAssignment: null,
        groupAssignment: null,
        quiz1: 8.5,
        quiz2: 9.0,
        final: 9.2,
        weights: {
          attendance: 10,
          regular: 15,
          midterm: 20,
          individualAssignment: 0,
          groupAssignment: 0,
          quiz1: 5,
          quiz2: 5,
          final: 45
        }
      }
    ],
    "Kỳ hè": [
      {
        subject: "Phát triển ứng dụng Web",
        attendance: 9.2,
        regular: 9.0,
        midterm: 8.5,
        individualAssignment: 9.5,
        groupAssignment: 9.3,
        quiz1: 8.8,
        quiz2: null,
        final: 9.0,
        weights: {
          attendance: 10,
          regular: 10,
          midterm: 15,
          individualAssignment: 5,
          groupAssignment: 5,
          quiz1: 5,
          quiz2: 0,
          final: 50
        }
      },
      {
        subject: "Phân tích thiết kế hệ thống",
        attendance: 8.7,
        regular: 8.5,
        midterm: 8.0,
        individualAssignment: null,
        groupAssignment: 8.8,
        quiz1: 8.2,
        quiz2: 8.5,
        final: 8.6,
        weights: {
          attendance: 10,
          regular: 10,
          midterm: 15,
          individualAssignment: 0,
          groupAssignment: 10,
          quiz1: 5,
          quiz2: 5,
          final: 45
        }
      }
    ]
  },
  "2023-2024": {
    "Kỳ 1": [
      {
        subject: "Nhập môn lập trình",
        attendance: 7.5,
        regular: 7.8,
        midterm: 7.2,
        individualAssignment: 8.0,
        groupAssignment: null,
        quiz1: 7.0,
        quiz2: null,
        final: 7.5,
        weights: {
          attendance: 10,
          regular: 10,
          midterm: 15,
          individualAssignment: 10,
          groupAssignment: 0,
          quiz1: 5,
          quiz2: 0,
          final: 50
        }
      },
      {
        subject: "Giải tích 1",
        attendance: 8.0,
        regular: 7.5,
        midterm: 7.8,
        individualAssignment: null,
        groupAssignment: null,
        quiz1: 7.2,
        quiz2: 7.5,
        final: 7.8,
        weights: {
          attendance: 10,
          regular: 15,
          midterm: 20,
          individualAssignment: 0,
          groupAssignment: 0,
          quiz1: 5,
          quiz2: 5,
          final: 45
        }
      },
      {
        subject: "Vật lý đại cương",
        attendance: 7.8,
        regular: 8.2,
        midterm: 7.5,
        individualAssignment: 8.0,
        groupAssignment: null,
        quiz1: 7.8,
        quiz2: null,
        final: 8.0,
        weights: {
          attendance: 10,
          regular: 10,
          midterm: 15,
          individualAssignment: 10,
          groupAssignment: 0,
          quiz1: 5,
          quiz2: 0,
          final: 50
        }
      }
    ],
    "Kỳ 2": [
      {
        subject: "Lập trình hướng đối tượng",
        attendance: 8.2,
        regular: 8.5,
        midterm: 8.0,
        individualAssignment: 8.8,
        groupAssignment: 8.5,
        quiz1: 8.0,
        quiz2: 8.3,
        final: 8.5,
        weights: {
          attendance: 10,
          regular: 10,
          midterm: 15,
          individualAssignment: 5,
          groupAssignment: 5,
          quiz1: 5,
          quiz2: 5,
          final: 45
        }
      },
      {
        subject: "Giải tích 2",
        attendance: 7.5,
        regular: 7.8,
        midterm: 7.2,
        individualAssignment: null,
        groupAssignment: null,
        quiz1: 7.5,
        quiz2: null,
        final: 7.8,
        weights: {
          attendance: 10,
          regular: 15,
          midterm: 20,
          individualAssignment: 0,
          groupAssignment: 0,
          quiz1: 5,
          quiz2: 0,
          final: 50
        }
      }
    ],
    "Kỳ hè": [
      {
        subject: "Thực tập doanh nghiệp",
        attendance: 9.0,
        regular: 8.8,
        midterm: null,
        individualAssignment: null,
        groupAssignment: 9.2,
        quiz1: null,
        quiz2: null,
        final: 9.0,
        weights: {
          attendance: 20,
          regular: 20,
          midterm: 0,
          individualAssignment: 0,
          groupAssignment: 20,
          quiz1: 0,
          quiz2: 0,
          final: 40
        }
      }
    ]
  }
};

export interface StudentDetailProps {
  studentId: string;
}

export default function StudentDetail({ studentId }: StudentDetailProps) {
  const [selectedYear, setSelectedYear] = useState("2024-2025");
  const [selectedSemester, setSelectedSemester] = useState("Kỳ 1");
  const { showToast } = useToast();
  
  const [student, setStudent] = useState<StudentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get study history based on selected year and semester
  const studyHistory = studyHistoryData[selectedYear]?.[selectedSemester] || [];

  // Fetch student data from backend
  useEffect(() => {
    const fetchStudentData = async () => {
      if (!studentId) return;
      
      try {
        setIsLoading(true);
        const data = await studentService.getStudentById(parseInt(studentId));
        setStudent(data);
      } catch (error) {
        showToast('Không thể tải thông tin sinh viên', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentData();
  }, [studentId, showToast]);

  const getScoreColor = (score: number | null) => {
    if (score === null) return "bg-gray-100 text-gray-500";
    if (score >= 8.5) return "bg-green-100 text-green-800";
    if (score >= 7.0) return "bg-blue-100 text-blue-800";
    return "bg-yellow-100 text-yellow-800";
  };

  // Calculate total score based on weights
  const calculateTotal = (record: typeof studyHistory[0]) => {
    let total = 0;
    const { weights } = record;
    
    if (record.attendance !== null) total += record.attendance * (weights.attendance / 100);
    if (record.regular !== null) total += record.regular * (weights.regular / 100);
    if (record.midterm !== null) total += record.midterm * (weights.midterm / 100);
    if (record.individualAssignment !== null) total += record.individualAssignment * (weights.individualAssignment / 100);
    if (record.groupAssignment !== null) total += record.groupAssignment * (weights.groupAssignment / 100);
    if (record.quiz1 !== null) total += record.quiz1 * (weights.quiz1 / 100);
    if (record.quiz2 !== null) total += record.quiz2 * (weights.quiz2 / 100);
    if (record.final !== null) total += record.final * (weights.final / 100);
    
    return Math.round(total * 10) / 10; // Round to 1 decimal place
  };

  // Get status based on total score
  const getStatus = (total: number) => {
    if (total >= 9.5) return { text: "Xuất sắc", color: "green" };
    if (total >= 8.5) return { text: "Giỏi", color: "green" };
    if (total >= 7.0) return { text: "Khá", color: "blue" };
    if (total >= 5.5) return { text: "Trung bình", color: "yellow" };
    return { text: "Kém", color: "red" };
  };

  const getStatusColor = (statusColor: string) => {
    switch (statusColor) {
      case "green": return "bg-green-100 text-green-800";
      case "blue": return "bg-blue-100 text-blue-800";
      case "yellow": return "bg-yellow-100 text-yellow-800";
      case "orange": return "bg-orange-100 text-orange-800";
      case "red": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (statusColor: string) => {
    switch (statusColor) {
      case "green": return "fas fa-check-circle";
      case "blue": return "fas fa-check-circle";
      case "yellow": return "fas fa-exclamation-circle";
      case "orange": return "fas fa-exclamation-triangle";
      case "red": return "fas fa-times-circle";
      default: return "fas fa-circle";
    }
  };

  // Format date helper
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  // Format gender helper
  const formatGender = (gender?: string) => {
    if (!gender) return 'N/A';
    return gender === 'male' ? 'Nam' : gender === 'female' ? 'Nữ' : 'Khác';
  };

  // Convert cohort year to K format (e.g., 2022 -> K28, 2023 -> K29)
  const getCohortLabel = (cohortYear?: number): string => {
    if (!cohortYear) return 'N/A';
    const kNumber = cohortYear - 2000 + 6; // 2022 -> 28, 2023 -> 29, etc.
    return `K${kNumber}`;
  };

  // Get cohort from student code (first 2 digits)
  const getCohortFromCode = (studentCode: string): string => {
    if (!studentCode || studentCode.length < 2) return 'N/A';
    const kNumber = studentCode.substring(0, 2);
    return `K${kNumber}`;
  };

  if (isLoading) {
    return <LoadingSpinner text="Đang tải thông tin sinh viên..." size="lg" />;
  }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <i className="fas fa-exclamation-triangle text-yellow-500 text-5xl mb-4"></i>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Không thể tải thông tin sinh viên</h3>
        <p className="text-gray-600 mb-4">
          {studentId ? `Không tìm thấy sinh viên với ID: ${studentId}` : 'ID sinh viên không hợp lệ'}
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md">
          <p className="text-sm text-blue-800">
            <strong>Lưu ý:</strong> Backend cần trả về <code className="bg-blue-100 px-1 rounded">studentId</code> trong response của <code className="bg-blue-100 px-1 rounded">/admin/accounts/:id</code>
          </p>
        </div>
      </div>
    );
  }

  // Generate chart data based on selected semester's subjects
  const generateProgressData = () => {
    const colors = [
      { border: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
      { border: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
      { border: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
      { border: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
      { border: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
      { border: '#06b6d4', bg: 'rgba(6, 182, 212, 0.1)' }
    ];

    const datasets = studyHistory.map((record, index) => {
      const total = calculateTotal(record);
      const baseScore = total - 1;
      const variation = 0.3;
      
      // Generate realistic progress data (trending upward to final score)
      const progressData = Array.from({ length: 8 }, (_, week) => {
        const progress = week / 7; // 0 to 1
        const score = baseScore + (total - baseScore) * progress;
        const randomVariation = (Math.random() - 0.5) * variation;
        return Math.round((score + randomVariation) * 10) / 10;
      });
      
      // Ensure last week matches final total
      progressData[7] = total;

      return {
        label: record.subject,
        data: progressData,
        borderColor: colors[index % colors.length].border,
        backgroundColor: colors[index % colors.length].bg,
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.4
      };
    });

    return {
      labels: ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4', 'Tuần 5', 'Tuần 6', 'Tuần 7', 'Tuần 8'],
      datasets
    };
  };

  const progressData = generateProgressData();

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
          label: function(tooltipItem: { dataset: { label?: string }, parsed: { y: number | null } }) {
            const label = tooltipItem.dataset.label || '';
            return label + ': ' + (tooltipItem.parsed.y ?? 0) + ' điểm';
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
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Chi tiết sinh viên</h1>
          <p className="text-base text-gray-600">Chi tiết thông tin sinh viên và tiến độ học tập</p>
        </div>
      </div>

        {/* Student Personal Information */}
        <Card className="bg-white border border-gray-200 shadow-md">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Student Avatar */}
              <div className="flex-shrink-0 relative">
                <div className="relative">
                  <img 
                    src={student.profile?.avatarUrl || "/src/assets/admin/avatarJohnSmithDetail.png"} 
                    alt={student.profile?.fullName || 'Student'}
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
                      <label className="block text-sm font-medium text-gray-600">Tên sinh viên</label>
                    </div>
                    <p className="text-sm font-semibold text-gray-800">{student.profile?.fullName || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center gap-2 mb-1">
                      <i className="fas fa-barcode text-gray-500 text-sm"></i>
                      <label className="block text-sm font-medium text-gray-600">Mã sinh viên</label>
                    </div>
                    <p className="text-sm font-semibold text-gray-800">{student.studentCode}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center gap-2 mb-1">
                      <i className="fas fa-users text-gray-500 text-sm"></i>
                      <label className="block text-sm font-medium text-gray-600">Khóa</label>
                    </div>
                    <p className="text-sm font-semibold text-gray-800">
                      {student.cohortYear 
                        ? getCohortLabel(student.cohortYear)
                        : getCohortFromCode(student.studentCode)
                      }
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center gap-2 mb-1">
                      <i className="fas fa-venus-mars text-gray-500 text-sm"></i>
                      <label className="block text-sm font-medium text-gray-600">Giới tính</label>
                    </div>
                    <p className="text-sm text-gray-800">{formatGender(student.profile?.gender)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center gap-2 mb-1">
                      <i className="fas fa-birthday-cake text-gray-500 text-sm"></i>
                      <label className="block text-sm font-medium text-gray-600">Ngày sinh</label>
                    </div>
                    <p className="text-sm text-gray-800">{formatDate(student.profile?.dateOfBirth)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center gap-2 mb-1">
                      <i className="fas fa-envelope text-gray-500 text-sm"></i>
                      <label className="block text-sm font-medium text-gray-600">Email</label>
                    </div>
                    <p className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer">{student.email}</p>
                  </div>
                </div>
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

            {/* Alert Status - TODO: Implement when backend provides academic status */}
            {/* <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-3 mb-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center mr-3">
                  <i className="fas fa-exclamation-triangle text-white text-sm"></i>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-yellow-800">
                    Cảnh báo: At-Risk
                  </h4>
                  <p className="text-sm text-yellow-700">Tiến độ thấp trong kỳ học hè</p>
                </div>
              </div>
            </div> */}

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
            
            <div className="rounded-lg border border-gray-200 overflow-x-auto">
              <table className="w-full border-collapse bg-white min-w-[1200px]">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border-0 px-3 py-3 text-left font-bold text-gray-700 text-xs whitespace-nowrap sticky left-0 bg-gray-50 z-10">
                      <div className="flex items-center gap-2">
                        <i className="fas fa-book text-gray-500"></i>
                        Môn học
                      </div>
                    </th>
                    <th className="border-0 px-3 py-3 text-center font-bold text-gray-700 text-xs whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <i className="fas fa-user-check text-gray-500"></i>
                        Chuyên cần
                      </div>
                    </th>
                    <th className="border-0 px-3 py-3 text-center font-bold text-gray-700 text-xs whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <i className="fas fa-clipboard-list text-gray-500"></i>
                        Thường kỳ
                      </div>
                    </th>
                    <th className="border-0 px-3 py-3 text-center font-bold text-gray-700 text-xs whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <i className="fas fa-file-alt text-gray-500"></i>
                        Giữa kỳ
                      </div>
                    </th>
                    <th className="border-0 px-3 py-3 text-center font-bold text-gray-700 text-xs whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <i className="fas fa-user-edit text-gray-500"></i>
                        BT Cá nhân
                      </div>
                    </th>
                    <th className="border-0 px-3 py-3 text-center font-bold text-gray-700 text-xs whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <i className="fas fa-users text-gray-500"></i>
                        BT Nhóm
                      </div>
                    </th>
                    <th className="border-0 px-3 py-3 text-center font-bold text-gray-700 text-xs whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <i className="fas fa-question-circle text-gray-500"></i>
                        Quiz 1
                      </div>
                    </th>
                    <th className="border-0 px-3 py-3 text-center font-bold text-gray-700 text-xs whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <i className="fas fa-question-circle text-gray-500"></i>
                        Quiz 2
                      </div>
                    </th>
                    <th className="border-0 px-3 py-3 text-center font-bold text-gray-700 text-xs whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <i className="fas fa-file-signature text-gray-500"></i>
                        Cuối kỳ
                      </div>
                    </th>
                    <th className="border-0 px-3 py-3 text-center font-bold text-gray-700 text-xs whitespace-nowrap bg-blue-50">
                      <div className="flex items-center justify-center gap-1">
                        <i className="fas fa-calculator text-blue-600"></i>
                        <span className="text-blue-700">Tổng</span>
                      </div>
                    </th>
                    <th className="border-0 px-3 py-3 text-center font-bold text-gray-700 text-xs whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <i className="fas fa-chart-line text-gray-500"></i>
                        Trạng thái
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {studyHistory.map((record, index) => {
                    const total = calculateTotal(record);
                    const status = getStatus(total);
                    
                    return (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="border-0 px-3 py-3 font-semibold text-gray-800 text-xs border-b border-gray-100 sticky left-0 bg-white whitespace-nowrap">
                          {record.subject}
                        </td>
                        <td className="border-0 px-3 py-3 text-center border-b border-gray-100">
                          <span className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-bold min-w-[32px] ${getScoreColor(record.attendance)}`}>
                            {record.attendance !== null ? record.attendance : '−'}
                          </span>
                        </td>
                        <td className="border-0 px-3 py-3 text-center border-b border-gray-100">
                          <span className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-bold min-w-[32px] ${getScoreColor(record.regular)}`}>
                            {record.regular !== null ? record.regular : '−'}
                          </span>
                        </td>
                        <td className="border-0 px-3 py-3 text-center border-b border-gray-100">
                          <span className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-bold min-w-[32px] ${getScoreColor(record.midterm)}`}>
                            {record.midterm !== null ? record.midterm : '−'}
                          </span>
                        </td>
                        <td className="border-0 px-3 py-3 text-center border-b border-gray-100">
                          <span className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-bold min-w-[32px] ${getScoreColor(record.individualAssignment)}`}>
                            {record.individualAssignment !== null ? record.individualAssignment : '−'}
                          </span>
                        </td>
                        <td className="border-0 px-3 py-3 text-center border-b border-gray-100">
                          <span className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-bold min-w-[32px] ${getScoreColor(record.groupAssignment)}`}>
                            {record.groupAssignment !== null ? record.groupAssignment : '−'}
                          </span>
                        </td>
                        <td className="border-0 px-3 py-3 text-center border-b border-gray-100">
                          <span className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-bold min-w-[32px] ${getScoreColor(record.quiz1)}`}>
                            {record.quiz1 !== null ? record.quiz1 : '−'}
                          </span>
                        </td>
                        <td className="border-0 px-3 py-3 text-center border-b border-gray-100">
                          <span className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-bold min-w-[32px] ${getScoreColor(record.quiz2)}`}>
                            {record.quiz2 !== null ? record.quiz2 : '−'}
                          </span>
                        </td>
                        <td className="border-0 px-3 py-3 text-center border-b border-gray-100">
                          <span className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-bold min-w-[32px] ${getScoreColor(record.final)}`}>
                            {record.final !== null ? record.final : '−'}
                          </span>
                        </td>
                        <td className="border-0 px-3 py-3 text-center border-b border-gray-100 bg-blue-50">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${getScoreColor(total)}`}>
                            {total}
                          </span>
                        </td>
                        <td className="border-0 px-3 py-3 text-center border-b border-gray-100">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(status.color)}`}>
                            <i className={`${getStatusIcon(status.color)} mr-1`}></i>
                            {status.text}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
  );
}