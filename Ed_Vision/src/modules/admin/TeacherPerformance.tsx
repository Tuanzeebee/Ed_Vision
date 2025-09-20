import { useRef } from "react";
import AdminLayout from "@/components/ui/admin/AdminLayout";
import { Card, CardContent } from "../../components/ui/card";
import TeacherProfileHeader from "@/components/ui/admin/TeacherProfileHeader";
import TeacherTabNavigation from "@/components/ui/admin/TeacherTabNavigation";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Radar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

type SubjectPerformance = {
  id: string;
  code: string;
  name: string;
  classes: number;
  students: number;
  passRate: number;
  averageScore: number;
  engagement: number;
  studentRating: number;
  trend: number;
  trendDirection: 'up' | 'down';
};

type KPI = {
  value: number;
  unit: string;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
};

type Recommendation = {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
};

export default function TeacherPerformance() {
  const chartRef = useRef<ChartJS<'line'> | null>(null);

  // Mock data for KPIs
  const kpis: KPI[] = [
    {
      value: 8.7,
      unit: "/10",
      label: "Điểm hiệu suất trung bình",
      icon: "fas fa-chart-line",
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      value: 3,
      unit: "/45",
      label: "Xếp hạng trong khoa",
      icon: "fas fa-trophy",
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      value: 0.3,
      unit: "",
      label: "Xu hướng hiệu suất",
      icon: "fas fa-trending-up",
      color: "text-emerald-600",
      bgColor: "bg-emerald-100"
    }
  ];

  // Mock data for subject performance
  const subjectPerformance: SubjectPerformance[] = [
    {
      id: "1",
      code: "IT101",
      name: "Lập trình Java",
      classes: 3,
      students: 120,
      passRate: 85.5,
      averageScore: 7.8,
      engagement: 92,
      studentRating: 4.25,
      trend: 2.1,
      trendDirection: 'up'
    },
    {
      id: "2",
      code: "IT102",
      name: "Cơ sở dữ liệu",
      classes: 2,
      students: 80,
      passRate: 78.2,
      averageScore: 7.2,
      engagement: 88,
      studentRating: 4.05,
      trend: -1.2,
      trendDirection: 'down'
    },
    {
      id: "3",
      code: "IT103",
      name: "Mạng máy tính",
      classes: 2,
      students: 75,
      passRate: 91.3,
      averageScore: 8.1,
      engagement: 96,
      studentRating: 4.55,
      trend: 3.8,
      trendDirection: 'up'
    }
  ];

  // Mock data for recommendations
  const recommendations: Recommendation[] = [
    {
      id: "1",
      title: "Tăng cường hoạt động nhóm",
      description: "Tạo thêm các hoạt động thảo luận nhóm để tăng tương tác giữa sinh viên và cải thiện hiệu quả học tập.",
      icon: "fas fa-users",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200"
    },
    {
      id: "2",
      title: "Điều chỉnh cấu trúc bài kiểm tra",
      description: "Cân bằng tỷ lệ giữa lý thuyết và thực hành trong các bài kiểm tra để đánh giá toàn diện năng lực sinh viên.",
      icon: "fas fa-clipboard-check",
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200"
    },
    {
      id: "3",
      title: "Tài liệu học trực tuyến",
      description: "Bổ sung thêm video bài giảng và tài liệu tương tác để hỗ trợ sinh viên học tập hiệu quả hơn.",
      icon: "fas fa-play-circle",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200"
    }
  ];

  // Radar chart data
  const radarData = {
    labels: ['Kỹ năng giảng dạy', 'Mức độ tham gia', 'Chuyên môn', 'Trung lập học', 'Kết quả sinh viên'],
    datasets: [
      {
        label: 'Hiệu suất hiện tại',
        data: [8.5, 9.2, 8.8, 8.1, 8.7],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderWidth: 3,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6
      }
    ]
  };

  // Line chart data for prediction vs actual
  const lineData = {
    labels: ['HK1 2022', 'HK2 2022', 'HK1 2023', 'HK2 2023', 'HK1 2024'],
    datasets: [
      {
        label: 'Dự đoán',
        data: [8.2, 8.3, 8.4, 8.5, 8.6],
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 3,
        pointRadius: 6,
        pointHoverRadius: 8,
        tension: 0.4,
        borderDash: [5, 5]
      },
      {
        label: 'Thực tế',
        data: [8.1, 8.4, 8.3, 8.6, 8.7],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 3,
        pointRadius: 6,
        pointHoverRadius: 8,
        tension: 0.4
      }
    ]
  };

  // Trend chart data
  const trendData = {
    labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
    datasets: [
      {
        label: 'Điểm trung bình',
        data: [7.8, 7.9, 8.0, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.7],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.4,
        yAxisID: 'y'
      },
      {
        label: 'Tỷ lệ đạt (%)',
        data: [82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 91],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.4,
        yAxisID: 'y1'
      }
    ]
  };

  // Chart options
  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            size: 12,
            weight: 500 as const
          }
        }
      }
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 10,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        angleLines: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        pointLabels: {
          font: {
            size: 11
          },
          color: '#374151'
        },
        ticks: {
          font: {
            size: 10
          },
          color: '#6b7280',
          stepSize: 2
        }
      }
    }
  };

  const lineOptions = {
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
            weight: 500 as const
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
        cornerRadius: 8
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        min: 7.5,
        max: 9.5,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false
        },
        ticks: {
          font: {
            size: 12
          },
          color: '#6b7280'
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
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const
    }
  };

  const trendOptions = {
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
            weight: 500 as const
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
        cornerRadius: 8
      }
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        min: 7,
        max: 10,
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
          text: 'Điểm trung bình',
          color: '#3b82f6',
          font: {
            size: 12,
            weight: 600 as const
          }
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        min: 75,
        max: 100,
        grid: {
          drawOnChartArea: false
        },
        ticks: {
          font: {
            size: 12
          },
          color: '#6b7280'
        },
        title: {
          display: true,
          text: 'Tỷ lệ đạt (%)',
          color: '#10b981',
          font: {
            size: 12,
            weight: 600 as const
          }
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
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <i 
        key={index}
        className={`${index < Math.floor(rating) ? 'fas fa-star' : 'far fa-star'} text-yellow-400 text-xs`}
      />
    ));
  };

  const getPassRateColor = (rate: number) => {
    if (rate >= 85) return 'bg-green-100 text-green-800';
    if (rate >= 75) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Teacher Profile Header */}
        <TeacherProfileHeader />

        {/* Tab Navigation */}
        <TeacherTabNavigation activeTab="Hiệu suất giảng viên" />

        {/* KPI Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {kpis.map((kpi, index) => (
            <div
              key={index}
              style={{
                backgroundColor: index === 0 ? '#dbeafe' : index === 1 ? '#dcfce7' : '#f3e8ff',
                borderColor: index === 0 ? '#93c5fd' : index === 1 ? '#86efac' : '#c4b5fd',
                borderWidth: '1px',
                borderStyle: 'solid'
              }}
              className="rounded-lg p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">{kpi.label}</p>
                  <div className="flex items-center">
                    <p className={`text-3xl font-bold ${kpi.color}`}>
                      {index === 2 && kpi.value > 0 ? '+' : ''}{kpi.value}
                      <span className="text-lg text-gray-600">{kpi.unit}</span>
                    </p>
                    {index === 2 && (
                      <span className="ml-2 flex items-center">
                        <i className="fas fa-arrow-up text-emerald-600 text-lg"></i>
                        <span className="text-emerald-600 text-sm ml-1">↑</span>
                      </span>
                    )}
                  </div>
                  {index === 2 && (
                    <p className="text-xs text-gray-600">so với kỳ trước</p>
                  )}
                </div>
                <div className={`w-12 h-12 ${kpi.bgColor} rounded-lg flex items-center justify-center`}>
                  <i className={`${kpi.icon} ${kpi.color} text-xl`}></i>
                  {/* Fallback text for debugging */}
                  {index === 0 && <span className="text-blue-600 text-xs">📊</span>}
                  {index === 1 && <span className="text-green-600 text-xs">🏆</span>}
                  {index === 2 && <span className="text-purple-600 text-xs">📈</span>}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Radar Chart */}
          <Card className="p-6">
            <CardContent>
              <h3 className="text-xl font-bold text-gray-800 mb-6">Hiệu suất theo tiêu chí</h3>
              <div className="h-80 w-full">
                <Radar data={radarData} options={radarOptions} />
              </div>
            </CardContent>
          </Card>

          {/* Line Chart */}
          <Card className="p-6">
            <CardContent>
              <h3 className="text-xl font-bold text-gray-800 mb-6">Dự đoán vs Thực tế</h3>
              <div className="h-80 w-full">
                <Line data={lineData} options={lineOptions} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance by Subject Table */}
        <Card className="p-6">
          <CardContent>
            <h3 className="text-xl font-bold text-gray-800 mb-6">Phân tích hiệu suất theo môn học</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">Mã môn - Tên môn</th>
                    <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">Số lớp - Tổng SV</th>
                    <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">Tỷ lệ đạt (%)</th>
                    <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">Điểm TB</th>
                    <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">Mức độ tham gia</th>
                    <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">Đánh giá SV</th>
                    <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">Xu hướng (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {subjectPerformance.map((subject) => (
                    <tr key={subject.id} className="hover:bg-gray-50">
                      <td className="border border-gray-200 px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-800">{subject.code}</p>
                          <p className="text-sm text-gray-600">{subject.name}</p>
                        </div>
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-center">
                        <div>
                          <p className="font-medium text-gray-800">{subject.classes} lớp</p>
                          <p className="text-sm text-gray-600">{subject.students} SV</p>
                        </div>
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${getPassRateColor(subject.passRate)}`}>
                          {subject.passRate}%
                        </span>
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {subject.averageScore}
                        </span>
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800">
                          {subject.engagement}%
                        </span>
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-center">
                        <div className="flex items-center justify-center">
                          <div className="flex text-yellow-400 mr-1">
                            {renderStars(subject.studentRating)}
                          </div>
                          <span className="text-sm font-medium">{subject.studentRating}</span>
                        </div>
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${
                          subject.trendDirection === 'up' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          <i className={`fas fa-arrow-${subject.trendDirection} mr-1`}></i>
                          {subject.trendDirection === 'up' ? '+' : ''}{subject.trend}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Trend Chart */}
        <Card className="p-6">
          <CardContent>
            <h3 className="text-xl font-bold text-gray-800 mb-6">Biểu đồ xu hướng hiệu suất</h3>
            <div className="h-96 w-full mb-6">
              <Line ref={chartRef} data={trendData} options={trendOptions} />
            </div>
            
            {/* Trend Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-6 border-t border-gray-200">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Điểm trung bình</p>
                <p className="text-lg font-bold text-green-600">+0.3 điểm</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Tỷ lệ SV đạt chuẩn</p>
                <p className="text-lg font-bold text-green-600">+2.5%</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Mức độ tham gia</p>
                <p className="text-lg font-bold text-green-600">+3%</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Đánh giá SV</p>
                <p className="text-lg font-bold text-green-600">4.0 → 4.2</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="p-6">
          <CardContent>
            <h3 className="text-xl font-bold text-gray-800 mb-6">Đề xuất cải thiện</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recommendations.map((rec) => (
                <div key={rec.id} className={`${rec.bgColor} rounded-lg p-6 border ${rec.borderColor}`}>
                  <div className="flex items-center mb-4">
                    <div className={`w-12 h-12 ${rec.bgColor} rounded-lg flex items-center justify-center mr-4 border ${rec.borderColor}`}>
                      <i className={`${rec.icon} ${rec.color} text-xl`}></i>
                      {/* Fallback emojis */}
                      {rec.id === "1" && <span className="text-blue-600">👥</span>}
                      {rec.id === "2" && <span className="text-green-600">📋</span>}
                      {rec.id === "3" && <span className="text-purple-600">▶️</span>}
                    </div>
                    <h4 className={`text-lg font-semibold ${rec.color.replace('text-', 'text-').replace('-600', '-800')}`}>
                      {rec.title}
                    </h4>
                  </div>
                  <p className={`${rec.color.replace('text-', 'text-').replace('-600', '-700')} mb-4`}>
                    {rec.description}
                  </p>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer border-2 border-blue-600">
                    📋 Xem chi tiết
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}