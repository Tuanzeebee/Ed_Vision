import AdminLayout from "@/components/ui/admin/AdminLayout";
import LoadingSpinner from "@/components/ui/admin/LoadingSpinner";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { studentService, type StudentData, type FilterOptions } from "@/services/api/studentService";
import { useToast } from "@/lib/useToast";

// CSS để ẩn scrollbar
const hideScrollbarStyle = `
  .hide-scrollbar {
    -ms-overflow-style: none;  /* Internet Explorer 10+ */
    scrollbar-width: none;  /* Firefox */
  }
  .hide-scrollbar::-webkit-scrollbar {
    display: none;  /* Safari and Chrome */
  }
`;

// Simple Card components
const Card = ({ children, className = ""}: { children: React.ReactNode; className?: string }) =>(
  <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
    {children}
  </div>);

const CardContent = ({ children, className = ""}: { children: React.ReactNode; className?: string }) =>(
  <div className={className}>
    {children}
  </div>);

export default function StudentList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedCohort, setSelectedCohort] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    departments: [],
    programs: [],
    statuses: []
  });
  const navigate = useNavigate();
  const { showToast } = useToast();
  const limit = 10;

  // Fetch filter options on mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const options = await studentService.getFilterOptions();
        setFilterOptions(options);
      } catch (error) {
        console.error('Failed to fetch filter options:', error);
        showToast('Không thể tải bộ lọc', 'error');
      }
    };
    
    fetchFilterOptions();
  }, [showToast]);

  // Fetch students with filters
  useEffect(() => {
    const fetchStudents = async () => {
      setIsLoading(true);
      try {
        const response = await studentService.getStudents({
          search: searchTerm || undefined,
          department: selectedDepartment || undefined,
          program: selectedProgram || undefined,
          cohortYear: selectedCohort ? parseInt(selectedCohort) : undefined,
          status: selectedStatus || undefined,
          page: currentPage,
          limit
        });
        
        setStudents(response.data);
        setTotalStudents(response.meta.total);
        setTotalPages(response.meta.totalPages);
      } catch (error) {
        console.error('Failed to fetch students:', error);
        showToast('Không thể tải danh sách sinh viên', 'error');
        setStudents([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(() => {
      fetchStudents();
    }, 300);

    return () =>clearTimeout(timeoutId);
  }, [searchTerm, selectedDepartment, selectedProgram, selectedCohort, selectedStatus, currentPage, limit, showToast]);

  const handleViewStudent = (e: React.MouseEvent, studentId: number) => {
    e.stopPropagation();
    navigate(`/admin/students/${studentId}`);
  };

  const handleWarningClick = (e: React.MouseEvent, studentId: number) => {
    e.stopPropagation();
    // TODO: Implement warning functionality
    console.log('Warning student:', studentId);
    showToast('Chức năng cảnh báo đang được phát triển', 'info');
  };

  const handleAdvisorClick = (e: React.MouseEvent, studentId: number) => {
    e.stopPropagation();
    // TODO: Implement advisor assignment functionality
    console.log('Assign advisor for student:', studentId);
    showToast('Chức năng liên hệ cố vấn đang được phát triển', 'info');
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedDepartment("");
    setSelectedProgram("");
    setSelectedCohort("");
    setSelectedStatus("");
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth'});
  };

  // Convert cohort year to K format (e.g., 2022 ->K28, 2023 ->K29)
  const getCohortLabel = (cohortYear: number | undefined): string => {
    if (!cohortYear) return 'N/A';
    const kNumber = cohortYear - 2000 + 6; // 2022 ->28, 2023 ->29, etc.
    return `K${kNumber}`;
  };

  // Get cohort from student code (first 2 digits)
  const getCohortFromCode = (studentCode: string): string => {
    if (!studentCode || studentCode.length < 2) return 'N/A';
    const kNumber = studentCode.substring(0, 2);
    return `K${kNumber}`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active": 
      case "đang học":
        return "bg-green-100 text-green-800";
      case "inactive":
      case "tạm nghỉ":
        return "bg-yellow-100 text-yellow-800";
      case "at-risk":
      case "cảnh báo":
        return "bg-orange-100 text-orange-800";
      case "blocked":
      case "đã khóa":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
      case "đang học":
        return "text-green-400";
      case "inactive":
      case "tạm nghỉ":
        return "text-yellow-400";
      case "at-risk":
      case "cảnh báo":
        return "text-orange-400";
      case "blocked":
      case "đã khóa":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case "active": return "Đang học";
      case "inactive": return "Tạm nghỉ";
      case "at-risk": return "Cảnh báo";
      case "blocked": return "Đã khóa";
      default: return status;
    }
  };

  // Get available programs based on selected department
  const availablePrograms = selectedDepartment
    ? filterOptions.programs.filter(p =>p.department === selectedDepartment)
    : filterOptions.programs;

  // Generate cohort options based on current date
  // K28 (2022), K29 (2023), K30 (2024), K31 (2025)
  // New cohort starts in August each year
  const generateCohortOptions = () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // 1-12
    
    // If we're past August, include current year, otherwise stop at previous year
    const latestYear = currentMonth >= 8 ? currentYear : currentYear - 1;
    
    // Start from 2022 (K28) to latest year
    const cohorts = [];
    for (let year = 2022; year <= latestYear; year++) {
      const kNumber = year - 2000 + 6;
      cohorts.push({ year, label: `K${kNumber}` });
    }
    
    return cohorts;
  };

  const cohortOptions = generateCohortOptions();

  // Pagination helpers
  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    
    return pages;
  };

  return (
    <AdminLayout>
      <style dangerouslySetInnerHTML={{ __html: hideScrollbarStyle }} />
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
              <div className="relative">
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <input 
                  type="text"placeholder="Tìm kiếm theo tên, mã sinh viên..."value={searchTerm}
                  onChange={(e) =>setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg w-64 text-xs text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"autoComplete="off"/>
              </div>

              {/* Filter Dropdowns */}
              <div className="flex flex-wrap gap-3">
                {/* Department Filter */}
                <select 
                  value={selectedDepartment}
                  onChange={(e) => {
                    setSelectedDepartment(e.target.value);
                    setSelectedProgram(""); // Reset program when department changes
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700 text-xs cursor-pointer w-48 truncate">
                  <option value="">Tất cả trường</option>
                  {filterOptions.departments.map((dept) =>(
                    <option key={dept} value={dept}>{dept}</option>))}
                </select>

                {/* Program Filter */}
                <select 
                  value={selectedProgram}
                  onChange={(e) => {
                    setSelectedProgram(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700 text-xs cursor-pointer w-48 truncate"disabled={!selectedDepartment && filterOptions.programs.length >20}
                >
                  <option value="">Tất cả ngành</option>
                  {availablePrograms.map((prog) =>(
                    <option key={prog.name} value={prog.name}>{prog.name}</option>))}
                </select>

                {/* Cohort Year Filter */}
                <select 
                  value={selectedCohort}
                  onChange={(e) => {
                    setSelectedCohort(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700 text-xs cursor-pointer w-32 truncate">
                  <option value="">Tất cả khóa</option>
                  {cohortOptions.map((cohort) =>(
                    <option key={cohort.year} value={cohort.year}>{cohort.label}</option>))}
                </select>

                {/* Status Filter */}
                <select 
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700 text-xs cursor-pointer w-36 truncate">
                  <option value="">Tất cả trạng thái</option>
                  {filterOptions.statuses.map((status) =>(
                    <option key={status.code} value={status.code}>{status.name}</option>))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button 
                  onClick={handleResetFilters}
                  className="px-4 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-xs font-medium cursor-pointer">
                  <i className="fas fa-undo mr-2"></i>Reset bộ lọc
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
                <span>Kết quả hiển thị: {students.length} / {totalStudents}</span>
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className="max-w-full hide-scrollbar">
            <div className="overflow-y-auto hide-scrollbar relative"style={{maxHeight: `${Math.min(students.length, 10) * 80 + 60}px`, minHeight: isLoading ? '200px': 'auto'}}>
              {isLoading && (
                <LoadingSpinner 
                  text="Đang tải dữ liệu..."size="md"position="top"/>)}
              <table className="w-full min-w-[1200px] table-fixed">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"style={{width: '60px'}}>STT</th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"style={{width: '280px'}}>Sinh viên</th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"style={{width: '120px'}}>Mã SV</th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"style={{width: '150px'}}>Trường</th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"style={{width: '150px'}}>Ngành</th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"style={{width: '80px'}}>Khóa</th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"style={{width: '100px'}}>Trạng thái</th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"style={{width: '200px'}}>Hành động</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                {!isLoading && students.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <i className="fas fa-search text-gray-400 text-4xl mb-4"></i>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy sinh viên</h3>
                        <p className="text-gray-500">Thử thay đổi tiêu chí tìm kiếm hoặc bộ lọc</p>
                      </div>
                    </td>
                  </tr>) : !isLoading ? (
                  students.map((student, index) =>(
                    <tr 
                      key={student.studentId} 
                      className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium"style={{width: '60px'}}>
                      {(currentPage - 1) * limit + index + 1}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap"style={{width: '280px'}}>
                      <div className="flex items-center">
                        <img 
                          src={student.profile?.avatarUrl || "/src/assets/parent/avatarJohnSmith.png"} 
                          alt="Student"className="w-10 h-10 rounded-full mr-3 object-cover flex-shrink-0"onError={(e) => {
                            e.currentTarget.src = "/src/assets/parent/avatarJohnSmith.png";
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 truncate">{student.profile?.fullName || 'N/A'}</div>
                          <div className="text-sm text-gray-500 truncate">{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900"style={{width: '120px'}}>{student.studentCode}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 truncate"style={{width: '150px'}}>{student.department?.name || 'N/A'}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 truncate"style={{width: '150px'}}>{student.program?.programName || 'N/A'}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900"style={{width: '80px'}}>
                      {student.cohortYear 
                        ? getCohortLabel(student.cohortYear)
                        : getCohortFromCode(student.studentCode)
                      }
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap"style={{width: '100px'}}>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(student.status)}`}>
                        <i className={`fas fa-circle ${getStatusIcon(student.status)} mr-1 text-xs`}></i>
                        {getStatusLabel(student.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium"style={{width: '200px'}}>
                      <div className="flex space-x-2">
                        <button 
                          onClick={(e) =>handleViewStudent(e, student.studentId)}
                          className="p-1.5 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"title="Xem chi tiết">
                          <i className="fas fa-eye text-blue-600"></i>
                        </button>
                        <button 
                          onClick={(e) =>handleWarningClick(e, student.studentId)}
                          className="p-1.5 hover:bg-orange-50 rounded-md transition-colors cursor-pointer"title="Cảnh báo">
                          <i className="fas fa-exclamation-triangle text-orange-600"></i>
                        </button>
                        <button 
                          onClick={(e) =>handleAdvisorClick(e, student.studentId)}
                          className="p-1.5 hover:bg-green-50 rounded-md transition-colors cursor-pointer"title="Liên hệ cố vấn">
                          <i className="fas fa-user-tie text-green-600"></i>
                        </button>
                      </div>
                    </td>
                    </tr>))
                ) : null}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">Hiển thị <span className="font-medium">{(currentPage - 1) * limit + 1}</span>đến <span className="font-medium">{Math.min(currentPage * limit, totalStudents)}</span>trong tổng số <span className="font-medium">{totalStudents}</span>kết quả
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() =>handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                  <i className="fas fa-chevron-left mr-1"></i>Trước
                </button>
                
                {renderPageNumbers().map((page, idx) =>(
                  page === '...'? (
                    <span key={`ellipsis-${idx}`} className="px-3 py-1.5 text-xs font-medium text-gray-500">...</span>) : (
                    <button
                      key={page}
                      onClick={() =>handlePageChange(page as number)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer ${
                        currentPage === page
                          ? 'text-white bg-blue-600 border border-blue-600 hover:bg-blue-700': 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'}`}
                    >
                      {page}
                    </button>)
                ))}
                
                <button 
                  onClick={() =>handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">Sau
                  <i className="fas fa-chevron-right ml-1"></i>
                </button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>);
}