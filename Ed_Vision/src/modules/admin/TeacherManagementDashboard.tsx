import AdminLayout from "@/components/ui/admin/AdminLayout";
import LoadingSpinner from "@/components/ui/admin/LoadingSpinner";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import instructorService, { type InstructorOnlineStats, type Instructor } from "@/services/api/instructorService";
import { useToast } from "@/lib/useToast";
import { io, Socket } from "socket.io-client";

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

export default function TeacherManagementDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("Tất cả vai trò");
  const [statusFilter, setStatusFilter] = useState("Tất cả trạng thái");
  const [qualityFilter, setQualityFilter] = useState("Tất cả chất lượng");
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [teachersPerPage] = useState(10);
  const navigate = useNavigate();
  const { showToast } = useToast();

  // State for instructors from API
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [totalInstructors, setTotalInstructors] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Online stats state
  const [onlineStats, setOnlineStats] = useState<InstructorOnlineStats>({
    onlineCount: 0,
    totalCount: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Calculate quality based on advising class count
  const getQualityRating = (advisingClassCount: number = 0) => {
    if (advisingClassCount === 0) return { stars: 3, label: "Trung bình", color: "text-yellow-600" };
    if (advisingClassCount === 1) return { stars: 4, label: "Khá", color: "text-blue-600" };
    if (advisingClassCount >= 2) return { stars: 5, label: "Tốt", color: "text-green-600" };
    return { stars: 3, label: "Trung bình", color: "text-yellow-600" };
  };

  // Fetch online stats with WebSocket for real-time updates
  useEffect(() => {
    let socket: Socket | null = null;

    const initializeSocket = async () => {
      try {
        setIsLoadingStats(true);

        // Initial fetch
        const stats = await instructorService.getOnlineStats();
        setOnlineStats(stats);
        setIsLoadingStats(false);

        // Connect to WebSocket for real-time updates
        socket = io('http://localhost:3000/instructor-stats', {
          transports: ['websocket', 'polling'],
        });

        socket.on('connect', () => {
          console.log('WebSocket connected for instructor stats');
        });

        socket.on('instructorOnlineStatsUpdated', (stats: InstructorOnlineStats) => {
          console.log('Received real-time instructor stats update:', stats);
          setOnlineStats(stats);
        });

        socket.on('disconnect', () => {
          console.log('WebSocket disconnected');
        });

        socket.on('connect_error', (error) => {
          console.error('WebSocket connection error:', error);
        });
      } catch (error) {
        console.error('Failed to fetch online stats:', error);
        showToast('Không thể tải thống kê giảng viên trực tuyến', 'error');
        setIsLoadingStats(false);
      }
    };

    initializeSocket();

    return () => {
      if (socket) {
        console.log('Cleaning up WebSocket connection');
        socket.disconnect();
      }
    };
  }, [showToast]);

  // Fetch instructors from API
  useEffect(() => {
    const fetchInstructors = async () => {
      try {
        setIsLoading(true);

        // Map filter values to API parameters
        const statusMap: { [key: string]: string } = {
          "Đang hoạt động": "active",
          "Không hoạt động": "inactive",
          "Nghỉ phép": "on_leave"
        };

        const params = {
          search: searchTerm || undefined,
          status: statusFilter !== "Tất cả trạng thái" ? statusMap[statusFilter] : undefined,
          page: currentPage,
          limit: 100, // Get all to filter by role on client side
        };

        const response = await instructorService.getInstructors(params);

        // Filter by role on client side
        let filteredData = response.data;
        if (roleFilter === "Giảng viên") {
          filteredData = response.data.filter(instructor => (instructor.advisingClassCount || 0) === 0);
        } else if (roleFilter === "Cố vấn") {
          filteredData = response.data.filter(instructor => (instructor.advisingClassCount || 0) > 0);
        }

        // Filter by quality on client side
        if (qualityFilter !== "Tất cả chất lượng") {
          filteredData = filteredData.filter(instructor => {
            const quality = getQualityRating(instructor.advisingClassCount || 0);
            return quality.label === qualityFilter.split(' (')[0];
          });
        }

        // Apply pagination on filtered data
        const startIndex = (currentPage - 1) * teachersPerPage;
        const endIndex = startIndex + teachersPerPage;
        const paginatedData = filteredData.slice(startIndex, endIndex);

        setInstructors(paginatedData);
        setTotalInstructors(filteredData.length);
        setTotalPages(Math.ceil(filteredData.length / teachersPerPage));
      } catch (error) {
        console.error('Failed to fetch instructors:', error);
        showToast('Không thể tải danh sách giảng viên', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInstructors();
  }, [searchTerm, roleFilter, statusFilter, qualityFilter, currentPage, teachersPerPage, showToast]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter, qualityFilter]);

  // Handle navigation to teacher detail
  const handleViewTeacher = (teacherId: number) => {
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

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "on_leave": return "bg-yellow-100 text-yellow-800";
      case "inactive": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active": return "Đang hoạt động";
      case "on_leave": return "Nghỉ phép";
      case "inactive": return "Không hoạt động";
      default: return status;
    }
  };

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-400";
      case "on_leave": return "bg-yellow-400";
      case "inactive": return "bg-red-400";
      default: return "bg-gray-400";
    }
  };

  const renderStars = (count: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <i
        key={i}
        className={`${i < count ? 'fas' : 'far'} fa-star text-yellow-400 text-xs`}
      />
    ));
  };

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
                  {isLoadingStats ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-700"></div>
                      <span className="text-sm text-green-600">Đang tải...</span>
                    </div>
                  ) : (
                    <>
                      <p className="text-4xl font-bold text-green-700 mb-1">{onlineStats.onlineCount}</p>
                      <p className="text-xs text-green-600">trên tổng {onlineStats.totalCount.toLocaleString()}</p>
                    </>
                  )}
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
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 cursor-pointer"
                  >
                    <option>Tất cả vai trò</option>
                    <option>Giảng viên</option>
                    <option>Cố vấn</option>
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
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setRoleFilter("Tất cả vai trò");
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
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã GV</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Họ tên & Email</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chức vụ</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chất lượng</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cố vấn</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {!isLoading && instructors.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center">
                      <div className="text-gray-500">
                        <span className="text-2xl mb-2 block">🔍</span>
                        <p className="text-sm">Không tìm thấy giảng viên phù hợp với bộ lọc</p>
                      </div>
                    </td>
                  </tr>
                ) : !isLoading ? (
                  instructors.map((instructor) => (
                    <tr
                      key={instructor.instructorId}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{instructor.employeeCode}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img
                            src={instructor.profile?.avatarUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"}
                            alt={instructor.profile?.fullName || 'Avatar'}
                            className="w-10 h-10 rounded-full mr-3"
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{instructor.profile?.fullName || 'N/A'}</div>
                            <div className="text-sm text-gray-500">{instructor.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPositionBadgeColor(instructor.position || '')}`}>
                          {instructor.position || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(instructor.status)}`}>
                          <span className={`w-2 h-2 ${getStatusDotColor(instructor.status)} rounded-full mr-1`}></span>
                          {getStatusLabel(instructor.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          const quality = getQualityRating(instructor.advisingClassCount || 0);
                          return (
                            <div className="flex items-center">
                              <div className="flex space-x-0.5">
                                {renderStars(quality.stars)}
                              </div>
                              <span className={`ml-2 text-xs font-medium ${quality.color}`}>
                                {quality.label}
                              </span>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {instructor.advisingClassCount ? `${instructor.advisingClassCount} lớp` : '0 lớp'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleViewTeacher(instructor.instructorId)}
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
                Hiển thị <span className="font-medium">{(currentPage - 1) * teachersPerPage + 1}</span> đến <span className="font-medium">{Math.min(currentPage * teachersPerPage, totalInstructors)}</span> trong tổng số <span className="font-medium">{totalInstructors}</span> kết quả
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
                {totalPages > 0 && Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer ${currentPage === pageNum
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
                  disabled={currentPage === totalPages || totalPages === 0}
                  className={`px-3 py-1.5 text-xs font-medium bg-white border border-gray-300 rounded-lg ${currentPage === totalPages || totalPages === 0 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50 cursor-pointer'}`}
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