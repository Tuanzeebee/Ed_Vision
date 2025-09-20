import AdminLayout from "@/components/ui/admin/AdminLayout";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

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

// Dữ liệu mẫu cho sinh viên
const studentsData = [
  {
    id: 1,
    name: "Nguyễn Văn An",
    email: "nguyenvanan@dtu.edu.vn",
    studentCode: "28211102954",
    faculty: "Khoa học Máy tính",
    gpa: 3.85,
    status: "Đang học",
    statusColor: "green",
    enrollDate: "15/09/2022",
    avatar: "/src/assets/admin/avatar1.png"
  },
  {
    id: 2,
    name: "Trần Thị Bình",
    email: "tranthibinh@dtu.edu.vn",
    studentCode: "28211102955",
    faculty: "Y - Dược",
    gpa: 3.92,
    status: "Đang học",
    statusColor: "green",
    enrollDate: "15/09/2022",
    avatar: "/src/assets/admin/avatar2.png"
  },
  {
    id: 3,
    name: "Lê Văn Cường",
    email: "levancuong@dtu.edu.vn",
    studentCode: "28211102956",
    faculty: "Công Nghệ",
    gpa: 2.45,
    status: "Cảnh báo",
    statusColor: "orange",
    enrollDate: "15/09/2022",
    avatar: "/src/assets/admin/avatar3.png"
  },
  {
    id: 4,
    name: "Phạm Thị Dung",
    email: "phamthidung@dtu.edu.vn",
    studentCode: "28211102957",
    faculty: "Kinh tế",
    gpa: 1.85,
    status: "At-Risk",
    statusColor: "red",
    enrollDate: "15/09/2022",
    avatar: "/src/assets/admin/avatar4.png"
  },
  {
    id: 5,
    name: "Hoàng Văn Em",
    email: "hoangvanem@dtu.edu.vn",
    studentCode: "28211102958",
    faculty: "Ngoại ngữ",
    gpa: 3.67,
    status: "Đang học",
    statusColor: "green",
    enrollDate: "15/09/2022",
    avatar: "/src/assets/admin/avatar5.png"
  },
  {
    id: 6,
    name: "Võ Thị Giang",
    email: "vothigiang@dtu.edu.vn",
    studentCode: "28211102959",
    faculty: "Luật",
    gpa: 3.45,
    status: "Đang học",
    statusColor: "green",
    enrollDate: "15/09/2022",
    avatar: "/src/assets/admin/avatar6.png"
  },
  {
    id: 7,
    name: "Đặng Văn Hải",
    email: "dangvanhai@dtu.edu.vn",
    studentCode: "28211102960",
    faculty: "Kỹ thuật",
    gpa: 2.15,
    status: "At-Risk",
    statusColor: "red",
    enrollDate: "15/09/2022",
    avatar: "/src/assets/admin/avatar7.png"
  },
  {
    id: 8,
    name: "Bùi Thị Ivy",
    email: "buithiivy@dtu.edu.vn",
    studentCode: "28211102961",
    faculty: "Khoa học Máy tính",
    gpa: 3.78,
    status: "Đang học",
    statusColor: "green",
    enrollDate: "15/09/2022",
    avatar: "/src/assets/admin/avatar8.png"
  },
  {
    id: 9,
    name: "Trịnh Văn Khoa",
    email: "trinhvankhoa@dtu.edu.vn",
    studentCode: "28211102962",
    faculty: "Công Nghệ",
    gpa: 2.78,
    status: "Cảnh báo",
    statusColor: "orange",
    enrollDate: "15/09/2022",
    avatar: "/src/assets/admin/avatar9.png"
  },
  {
    id: 10,
    name: "Lý Thị Lan",
    email: "lythilan@dtu.edu.vn",
    studentCode: "28211102963",
    faculty: "Y - Dược",
    gpa: 3.89,
    status: "Đang học",
    statusColor: "green",
    enrollDate: "15/09/2022",
    avatar: "/src/assets/admin/avatar10.png"
  }
];

export default function StudentList({ onNavigate }: { onNavigate?: (href: string) => void }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState("Tất cả khoa");
  const [selectedStatus, setSelectedStatus] = useState("Tất cả trạng thái");
  const [selectedYear, setSelectedYear] = useState("Năm học 2024-2025");
  const navigate = useNavigate();

  const handleStudentClick = (studentId: number) => {
    // Navigate to student detail page
    navigate(`/admin/students/${studentId}`);
  };

  const getGPAColor = (gpa: number) => {
    if (gpa >= 3.5) return "bg-green-100 text-green-800";
    if (gpa >= 2.5) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getStatusColor = (statusColor: string) => {
    switch (statusColor) {
      case "green": return "bg-green-100 text-green-800";
      case "orange": return "bg-orange-100 text-orange-800";
      case "red": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (statusColor: string) => {
    switch (statusColor) {
      case "green": return "text-green-400";
      case "orange": return "text-orange-400";
      case "red": return "text-red-400";
      default: return "text-gray-400";
    }
  };

  return (
    <AdminLayout 
      activePage="/admin/students"
      onNavigate={onNavigate}
    >
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Danh sách Sinh viên</h1>
          <p className="text-gray-600">Quản lý và theo dõi thông tin tất cả sinh viên trong hệ thống</p>
        </div>

        {/* Search and Filter Section */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              {/* Search Bar */}
              <div className="flex-1 max-w-sm">
                <div className="relative">
                  <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                  <input 
                    type="text" 
                    placeholder="Tìm kiếm theo tên, mã sinh viên..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm cursor-text"
                  />
                </div>
              </div>

              {/* Filter Dropdowns */}
              <div className="flex flex-wrap gap-3">
                <select 
                  value={selectedFaculty}
                  onChange={(e) => setSelectedFaculty(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700 text-sm cursor-pointer"
                >
                  <option>Tất cả khoa</option>
                  <option>Khoa học Máy tính</option>
                  <option>Công Nghệ</option>
                  <option>Y - Dược</option>
                  <option>Kinh tế</option>
                  <option>Ngoại ngữ</option>
                </select>
                <select 
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700 text-sm cursor-pointer"
                >
                  <option>Tất cả trạng thái</option>
                  <option>Đang học</option>
                  <option>Tạm nghỉ</option>
                  <option>Cảnh báo</option>
                  <option>At-Risk</option>
                </select>
                <select 
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700 text-sm cursor-pointer"
                >
                  <option>Năm học 2024-2025</option>
                  <option>Năm học 2023-2024</option>
                  <option>Năm học 2022-2023</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium cursor-pointer">
                  <i className="fas fa-plus mr-2"></i>
                  Thêm sinh viên
                </button>
                <button className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium cursor-pointer">
                  <i className="fas fa-download mr-2"></i>
                  Xuất Excel
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Students Table */}
        <Card className="overflow-hidden">
          {/* Table Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Danh sách Sinh viên</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Kết quả hiển thị: {studentsData.length}</span>
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sinh viên</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã SV</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khoa</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GPA</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày nhập học</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {studentsData.map((student, index) => (
                  <tr 
                    key={student.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleStudentClick(student.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img 
                          src={student.avatar} 
                          alt="Student" 
                          className="w-10 h-10 rounded-full mr-3 object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "/src/assets/parent/avatarJohnSmith.png";
                          }}
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                          <div className="text-sm text-gray-500">{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.studentCode}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.faculty}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGPAColor(student.gpa)}`}>
                        {student.gpa}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(student.statusColor)}`}>
                        <i className={`fas fa-circle ${getStatusIcon(student.statusColor)} mr-1 text-xs`}></i>
                        {student.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.enrollDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button className="px-3 py-1 bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 transition-colors text-xs font-medium cursor-pointer">
                          <i className="fas fa-exclamation-triangle mr-1"></i>
                          Gửi cảnh báo
                        </button>
                        <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-xs font-medium cursor-pointer">
                          <i className="fas fa-user-tie mr-1"></i>
                          Liên hệ cố vấn
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Hiển thị <span className="font-medium">1</span> đến <span className="font-medium">10</span> trong tổng số <span className="font-medium">10</span> kết quả
              </div>
              <div className="flex items-center space-x-2">
                <button className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 cursor-pointer" disabled>
                  <i className="fas fa-chevron-left mr-1"></i>
                  Trước
                </button>
                <button className="px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700 cursor-pointer">
                  1
                </button>
                <button className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer">
                  2
                </button>
                <button className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer">
                  3
                </button>
                <span className="px-3 py-2 text-sm font-medium text-gray-500">...</span>
                <button className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer">
                  1825
                </button>
                <button className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer">
                  Sau
                  <i className="fas fa-chevron-right ml-1"></i>
                </button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}