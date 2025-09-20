import AdminLayout from "@/components/ui/admin/AdminLayout";
import TeacherProfileHeader, { type TeacherData } from "@/components/ui/admin/TeacherProfileHeader";
import TeacherTabNavigation from "@/components/ui/admin/TeacherTabNavigation";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Subject data
const subjectData = [
  {
    code: "CS501",
    name: "Nhập môn lập trình",
    semester: "HK 1",
    year: "2024-2025",
    classes: 3,
    students: 120,
    average: 7.8,
    color: "bg-blue-500"
  },
  {
    code: "CS502", 
    name: "Cấu trúc dữ liệu",
    semester: "HK 1",
    year: "2024-2025",
    classes: 2,
    students: 85,
    average: 8.2,
    color: "bg-green-500"
  },
  {
    code: "CS503",
    name: "Trí tuệ nhân tạo", 
    semester: "HK 1",
    year: "2024-2025",
    classes: 2,
    students: 75,
    average: 8.5,
    color: "bg-emerald-500"
  },
  {
    code: "CS504",
    name: "Phát triển ứng dụng web",
    semester: "HK 1", 
    year: "2024-2025",
    classes: 3,
    students: 95,
    average: 7.9,
    color: "bg-yellow-500"
  },
  {
    code: "CS505",
    name: "Học máy",
    semester: "HK 1",
    year: "2024-2025", 
    classes: 1,
    students: 45,
    average: 8.7,
    color: "bg-purple-500"
  }
];

export default function TeacherSubjects() {
  const { teacherId } = useParams();
  const [activeTab, setActiveTab] = useState("Môn học giảng dạy");
  const [selectedYear, setSelectedYear] = useState("2024-2025");
  const [selectedSemester, setSelectedSemester] = useState("Học kỳ 1");

  // Log current active tab for debugging
  console.log("Current active tab:", activeTab);
  console.log("Teacher ID:", teacherId);

  const handleTeacherDataChange = (data: TeacherData) => {
    console.log("Teacher data updated:", data);
  };

  const handleTabChange = (tabLabel: string) => {
    setActiveTab(tabLabel);
  };

  // Chart data
  const chartData = {
    labels: subjectData.map(subject => subject.name),
    datasets: [
      {
        label: "Điểm trung bình",
        data: subjectData.map(subject => subject.average),
        backgroundColor: [
          "#3b82f6",
          "#10b981", 
          "#06b6d4",
          "#f59e0b",
          "#8b5cf6"
        ],
        borderColor: [
          "#2563eb",
          "#059669",
          "#0891b2", 
          "#d97706",
          "#7c3aed"
        ],
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "#fff",
        bodyColor: "#fff", 
        borderColor: "#e5e7eb",
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function (context: { parsed: { y: number } }) {
            return "Điểm TB: " + context.parsed.y + "/10";
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 10,
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
          drawBorder: false,
        },
        ticks: {
          font: {
            size: 12,
          },
          color: "#6b7280",
          callback: function (value: string | number) {
            return value + " điểm";
          },
        },
        title: {
          display: true,
          text: "Điểm trung bình",
          font: {
            size: 14,
            weight: "600",
          },
          color: "#374151",
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 12,
          },
          color: "#6b7280",
          maxRotation: 45,
          minRotation: 0,
        },
        title: {
          display: true,
          text: "Môn học",
          font: {
            size: 14,
            weight: "600",
          },
          color: "#374151",
        },
      },
    },
    elements: {
      bar: {
        borderWidth: 2,
      },
    },
  };

  const getProgressWidth = (average: number) => {
    return `${(average / 10) * 100}%`;
  };

  return (
    <AdminLayout
      activePage="/admin/teachers"
    >
      <div className="space-y-6">
        {/* Teacher Profile Header */}
        <TeacherProfileHeader 
          onTeacherDataChange={handleTeacherDataChange}
        />

        {/* Navigation Tabs */}
        <TeacherTabNavigation 
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Năm học</label>
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 text-sm cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="2024-2025">2024-2025</option>
                <option value="2023-2024">2023-2024</option>
                <option value="2022-2023">2022-2023</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Kỳ học</label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 text-sm cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Học kỳ 1">Học kỳ 1</option>
                <option value="Học kỳ 2">Học kỳ 2</option>
                <option value="Kỳ hè">Kỳ hè</option>
              </select>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Biểu đồ so sánh điểm trung bình môn học</h3>
          <div className="h-96 w-full">
            <Bar data={chartData} options={chartOptions as Parameters<typeof Bar>[0]['options']} />
          </div>
        </div>

        {/* Subject Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Danh sách môn học giảng dạy</h3>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">
                    Mã môn học
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">
                    Tên môn học
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">
                    Học kỳ
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">
                    Năm học
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">
                    Số lớp
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">
                    Tổng số SV
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">
                    Điểm TB
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {subjectData.map((subject, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-3 font-medium text-gray-800">
                      {subject.code}
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-gray-800">
                      {subject.name}
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-center text-gray-600">
                      {subject.semester}
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-center text-gray-600">
                      {subject.year}
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-center text-gray-600">
                      {subject.classes}
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-center text-gray-600">
                      {subject.students}
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-center">
                      <div className="flex items-center justify-center">
                        <div className="w-16 h-2 bg-gray-200 rounded-full mr-2">
                          <div 
                            className={`h-2 rounded-full ${subject.color}`}
                            style={{ width: getProgressWidth(subject.average) }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-700">{subject.average}</span>
                      </div>
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-center">
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors cursor-pointer">
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}