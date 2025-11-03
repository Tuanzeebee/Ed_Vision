import AdminLayout from "@/components/ui/admin/AdminLayout";
import LoadingSpinner from "@/components/ui/admin/LoadingSpinner";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Simple Card components
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
    {children}
  </div>
);

const CardContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={className}>
    {children}
  </div>
);

// Dữ liệu mẫu cho giảng viên
const teachersData = [
  {
    id: "GV001",
    name: "TS. Tô Minh Vương",
    email: "vuong.to@dtu.edu.vn",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
    position: "Tiến sĩ",
    status: "Đang hoạt động",
    statusColor: "green",
    quality: "Tốt",
    qualityStars: 5,
    students: 12
  },
  {
    id: "GV002",
    name: "ThS. Nguyễn Thị Lan",
    email: "lan.nguyen@dtu.edu.vn",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face",
    position: "Thạc sĩ",
    status: "Nghỉ phép",
    statusColor: "yellow",
    quality: "Khá",
    qualityStars: 4,
    students: 8
  },
  {
    id: "GV003",
    name: "PGS. Trần Văn Nam",
    email: "nam.tran@dtu.edu.vn",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
    position: "Thỉnh giảng",
    status: "Không hoạt động",
    statusColor: "red",
    quality: "Trung bình",
    qualityStars: 3,
    students: 5
  },
  {
    id: "GV004",
    name: "TS. Lê Thị Hoa",
    email: "hoa.le@dtu.edu.vn",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face",
    position: "Trợ giảng",
    status: "Đang hoạt động",
    statusColor: "green",
    quality: "Tệ",
    qualityStars: 2,
    students: 3
  },
  {
    id: "GV005",
    name: "ThS. Phạm Minh Tuấn",
    email: "tuan.pham@dtu.edu.vn",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face",
    position: "Thạc sĩ",
    status: "Đang hoạt động",
    statusColor: "green",
    quality: "Khá",
    qualityStars: 4,
    students: 15
  }
];

export default function TeacherManagementDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [positionFilter, setPositionFilter] = useState("Tất cả chức vụ");
  const [statusFilter, setStatusFilter] = useState("Tất cả trạng thái");
  const [qualityFilter, setQualityFilter] = useState("Tất cả chất lượng");
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [teachersPerPage] = useState(10);
  const navigate = useNavigate();

  // Handle navigation to teacher detail
  const handleViewTeacher = (teacherId: string) => {
    navigate(`/admin/teachers/${teacherId}`);
  };

  const getPositionBadgeColor = (position: string) => {
    switch (position) {
      case "Tiến sĩ": return "bg-purple-100 text-purple-800";
      case "Thạc sĩ": return "bg-blue-100 text-blue-800";
      case "Thỉnh giảng": return "bg-gray-100 text-gray-800";
      case "Trợ giảng": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusBadgeColor = (statusColor: string) => {
    switch (statusColor) {
      case "green": return "bg-green-100 text-green-800";
      case "yellow": return "bg-yellow-100 text-yellow-800";
      case "red": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case "Tốt": return "text-green-600";
      case "Khá": return "text-blue-600";
      case "Trung bình": return "text-yellow-600";
      case "Tệ": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  const renderStars = (count: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <i 
        key={i} 
        className={`${i < count ? 'fas' : 'far'} fa-star text-yellow-400`}
      />
    ));
  };

  // Filter logic with loading state
  const [filteredTeachers, setFilteredTeachers] = useState(teachersData);
  
  useEffect(() => {
    setIsLoading(true);
    
    const filterTimeout = setTimeout(() => {
      const filtered = teachersData.filter(teacher => {
        const matchesSearch = searchTerm === '' || 
          teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          teacher.id.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesPosition = positionFilter === 'Tất cả chức vụ' || teacher.position === positionFilter;
        const matchesStatus = statusFilter === 'Tất cả trạng thái' || teacher.status === statusFilter;
        const matchesQuality = qualityFilter === 'Tất cả chất lượng' || teacher.quality === qualityFilter.split(' (')[0];
        
        return matchesSearch && matchesPosition && matchesStatus && matchesQuality;
      });
      
      setFilteredTeachers(filtered);
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(filterTimeout);
  }, [searchTerm, positionFilter, statusFilter, qualityFilter]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, positionFilter, statusFilter, qualityFilter]);

  // Pagination calculations
  const indexOfLastTeacher = currentPage * teachersPerPage;
  const indexOfFirstTeacher = indexOfLastTeacher - teachersPerPage;
  const currentTeachers = filteredTeachers.slice(indexOfFirstTeacher, indexOfLastTeacher);
  const totalPages = Math.ceil(filteredTeachers.length / teachersPerPage);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý Giảng viên</h1>
          <p className="text-gray-600">Quản lý thông tin và theo dõi chất lượng giảng dạy của giảng viên</p>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Online Teachers */}
          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800 mb-2">Giảng viên đang trực tuyến</p>
                  <p className="text-4xl font-bold text-green-700 mb-1">75</p>
                  <p className="text-xs text-green-600">trên tổng 1,083</p>
                </div>
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <i className="fas fa-user-check text-green-600 text-2xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Teachers Need Support */}
          <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-orange-800 mb-2">Giảng viên cần hỗ trợ</p>
                  <p className="text-4xl font-bold text-orange-700 mb-1">12</p>
                  <p className="text-xs text-red-600 flex items-center">
                    <i className="fas fa-arrow-up text-xs mr-1"></i>
                    +3 giảng viên so với tháng trước
                  </p>
                </div>
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <i className="fas fa-exclamation-triangle text-orange-600 text-2xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Toolbar */}
        <Card className="p-6">
          <CardContent>
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-3 flex-1">
                {/* Search */}
                <div className="relative flex-1 max-w-xs">
                  <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                  <input 
                    type="text" 
                    placeholder="Nhập tên giảng viên..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                  />
                </div>
                
                {/* Filters */}
                <div className="flex flex-wrap gap-2">
                  <select 
                    value={positionFilter}
                    onChange={(e) => setPositionFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 cursor-pointer"
                  >
                    <option>Tất cả chức vụ</option>
                    <option>Tiến sĩ</option>
                    <option>Thạc sĩ</option>
                    <option>Thỉnh giảng</option>
                    <option>Trợ giảng</option>
                  </select>
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 cursor-pointer"
                  >
                    <option>Tất cả trạng thái</option>
                    <option>Đang hoạt động</option>
                    <option>Nghỉ phép</option>
                    <option>Không hoạt động</option>
                  </select>
                  <select 
                    value={qualityFilter}
                    onChange={(e) => setQualityFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 cursor-pointer"
                  >
                    <option>Tất cả chất lượng</option>
                    <option>Tốt (5⭐)</option>
                    <option>Khá (4⭐)</option>
                    <option>Trung bình (3⭐)</option>
                    <option>Tệ (2⭐)</option>
                  </select>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setSearchTerm("");
                    setPositionFilter("Tất cả chức vụ");
                    setStatusFilter("Tất cả trạng thái");
                    setQualityFilter("Tất cả chất lượng");
                  }}
                  className="px-4 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-xs font-medium cursor-pointer"
                >
                  <i className="fas fa-undo mr-2"></i>
                  Reset bộ lọc
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Teachers Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto relative" style={{ minHeight: isLoading ? '200px' : 'auto' }}>
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
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Họ tên & Email</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chức vụ</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chất lượng</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sinh viên đang cố vấn</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {!isLoading && filteredTeachers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center">
                      <div className="text-gray-500">
                        <span className="text-2xl mb-2 block">🔍</span>
                        <p className="text-sm">Không tìm thấy giảng viên phù hợp với bộ lọc</p>
                      </div>
                    </td>
                  </tr>
                ) : !isLoading ? (
                  currentTeachers.map((teacher, index) => (
                    <tr 
                      key={index} 
                      className="hover:bg-gray-50"
                    >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{teacher.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img src={teacher.avatar} alt={teacher.name} className="w-10 h-10 rounded-full mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{teacher.name}</div>
                          <div className="text-sm text-gray-500">{teacher.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPositionBadgeColor(teacher.position)}`}>
                        {teacher.position}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(teacher.statusColor)}`}>
                        <span className={`w-2 h-2 ${teacher.statusColor === 'green' ? 'bg-green-400' : teacher.statusColor === 'yellow' ? 'bg-yellow-400' : 'bg-red-400'} rounded-full mr-1`}></span>
                        {teacher.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex">
                          {renderStars(teacher.qualityStars)}
                        </div>
                        <span className={`ml-2 text-sm font-medium ${getQualityColor(teacher.quality)}`}>
                          {teacher.quality}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{teacher.students} sinh viên</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button 
                        onClick={() => handleViewTeacher(teacher.id)}
                        title="Xem chi tiết"
                        className="p-1.5 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                      >
                        <span className="text-blue-600 hover:text-blue-900 text-lg">👁️</span>
                      </button>
                    </td>
                  </tr>
                  ))
                ) : null}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-white px-6 py-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-center justify-between">
              <div className="text-sm text-gray-700 mb-4 sm:mb-0">
                Hiển thị <span className="font-medium">{indexOfFirstTeacher + 1}</span> đến <span className="font-medium">{Math.min(indexOfLastTeacher, filteredTeachers.length)}</span> trong tổng số <span className="font-medium">{filteredTeachers.length}</span> kết quả
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1.5 text-xs font-medium bg-white border border-gray-300 rounded-lg ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50 cursor-pointer'}`}
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
                
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer ${
                        currentPage === pageNum
                          ? 'text-white bg-blue-600 border border-blue-600'
                          : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <span className="px-2 text-gray-500">...</span>
                    <button 
                      onClick={() => setCurrentPage(totalPages)}
                      className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
                
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1.5 text-xs font-medium bg-white border border-gray-300 rounded-lg ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50 cursor-pointer'}`}
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}