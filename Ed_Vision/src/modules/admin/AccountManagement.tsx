import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/ui/admin/AdminLayout";
import LoadingSpinner from "../../components/ui/admin/LoadingSpinner";
import { accountService, type AccountData, type FilterOptions } from "../../services/api/accountService";
import { useToast } from "../../lib/useToast";

// Icon components
const SearchIcon = () => <i className="fas fa-search text-gray-400"></i>;
const PlusIcon = () => <i className="fas fa-plus text-white"></i>;
const ChevronLeftIcon = () => <i className="fas fa-chevron-left text-gray-500"></i>;
const ChevronRightIcon = () => <i className="fas fa-chevron-right text-gray-400"></i>;

// Status badge component
const StatusBadge = ({ status, children }: { status: 'active' | 'inactive' | 'blocked'; children: React.ReactNode }) => {
  const baseClasses = "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap";
  const statusClasses = {
    active: "bg-green-100 text-green-800",
    inactive: "bg-yellow-100 text-yellow-800", 
    blocked: "bg-red-100 text-red-800"
  };
  
  return (
    <span className={`${baseClasses} ${statusClasses[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
        status === 'active' ? 'bg-green-500' : 
        status === 'inactive' ? 'bg-yellow-500' : 'bg-red-500'
      }`}></span>
      {children}
    </span>
  );
};

// Role badge component
const RoleBadge = ({ role }: { role: string }) => {
  const baseClasses = "inline-flex items-center px-2.5 py-1 rounded-full text-xs whitespace-nowrap";
  
  // Determine if role should be bold
  const isBold = role === 'Lãnh đạo';
  const fontWeight = isBold ? 'font-bold' : 'font-medium';
  
  // Color mapping for each role
  const roleClasses: { [key: string]: string } = {
    'Lãnh đạo': 'bg-red-100 text-red-800',
    'Giảng viên': 'bg-green-100 text-green-800',
    'Sinh viên': 'bg-orange-100 text-orange-800',
    'Phụ huynh': 'bg-pink-100 text-pink-800'
  };
  
  const colorClass = roleClasses[role] || 'bg-gray-100 text-gray-800';
  
  return (
    <span className={`${baseClasses} ${colorClass} ${fontWeight}`}>
      {role}
    </span>
  );
};

// Helper functions
const getRoleDisplayName = (roleCode?: string, roleName?: string): string => {
  if (roleName) return roleName;
  const roleMap: { [key: string]: string } = {
    'admin': 'Quản trị viên',
    'leader': 'Lãnh đạo',
    'teacher': 'Giảng viên',
    'student': 'Sinh viên',
    'parent': 'Phụ huynh'
  };
  return roleCode ? roleMap[roleCode] || roleCode : 'N/A';
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN');
};

const getDepartment = (account: AccountData): string => {
  if (account.instructor?.departmentName) {
    return account.instructor.departmentName;
  }
  if (account.student?.departmentName) {
    return account.student.departmentName;
  }
  return '--';
};

const getMajor = (account: AccountData): string => {
  if (account.student?.programName) {
    return account.student.programName;
  }
  return '--';
};

const getUserCode = (account: AccountData): string => {
  if (account.student?.studentCode) return account.student.studentCode;
  if (account.instructor?.employeeCode) return account.instructor.employeeCode;
  return account.accountId.toString();
};

// Simple Card components
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
    {children}
  </div>
);

const Button = ({ children, variant = "primary", size = "md", className = "", ...props }: { 
  children: React.ReactNode; 
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const baseClasses = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer";
  
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500",
    secondary: "bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 focus:ring-blue-500",
    ghost: "hover:bg-gray-100 text-gray-600"
  };
  
  const sizes = {
    sm: "px-3 py-2 text-xs",
    md: "px-4 py-1.5 text-xs", 
    lg: "px-6 py-3 text-base"
  };
  
  return (
    <button 
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default function AccountManagement() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  // State management for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedMajor, setSelectedMajor] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Filter options from database
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    schools: [],
    majors: [],
    roles: [],
    statuses: []
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  // API data state
  const [accountsData, setAccountsData] = useState<AccountData[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Fetch filter options on mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const options = await accountService.getFilterOptions();
        setFilterOptions(options);
      } catch (error) {
        console.error('Failed to fetch filter options:', error);
        showToast('Không thể tải danh sách bộ lọc', 'error');
      }
    };
    fetchFilterOptions();
  }, [showToast]);

  // Fetch data from API
  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const filters = {
        search: searchTerm || undefined,
        role: selectedRole || undefined,
        status: selectedStatus || undefined,
        school: selectedSchool || undefined,
        major: selectedMajor || undefined,
        page: currentPage,
        limit: usersPerPage,
      };
      
      // Debug log
      console.log('Frontend sending filters:', filters);
      
      const response = await accountService.getAccounts(filters);

      setAccountsData(response.data);
      setTotalRecords(response.meta.total);
      setTotalPages(response.meta.totalPages);
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
      showToast('Không thể tải danh sách tài khoản', 'error');
      setAccountsData([]);
      setTotalRecords(0);
      setTotalPages(0);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, selectedRole, selectedStatus, selectedSchool, selectedMajor, currentPage, showToast]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedRole, selectedStatus, selectedSchool, selectedMajor]);

  // Reset major when school changes
  useEffect(() => {
    setSelectedMajor('');
  }, [selectedSchool]);

  // Handle reset filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedSchool('');
    setSelectedMajor('');
    setSelectedRole('');
    setSelectedStatus('');
    setCurrentPage(1);
  };

  // Get available majors for selected school
  const availableMajors = selectedSchool 
    ? filterOptions.majors.filter(m => m.school === selectedSchool)
    : filterOptions.majors;

  // Handle lock/unlock account
  const handleLockAccount = async (accountId: number) => {
    try {
      await accountService.lockAccount(accountId);
      showToast('Đã khóa tài khoản thành công', 'success');
      // Refresh data
      fetchAccounts();
    } catch (error) {
      console.error('Failed to lock account:', error);
      showToast('Không thể khóa tài khoản', 'error');
    }
  };

  const handleUnlockAccount = async (accountId: number) => {
    try {
      await accountService.unlockAccount(accountId);
      showToast('Đã mở khóa tài khoản thành công', 'success');
      // Refresh data
      fetchAccounts();
    } catch (error) {
      console.error('Failed to unlock account:', error);
      showToast('Không thể mở khóa tài khoản', 'error');
    }
  };

  // Calculate display indices
  const indexOfFirstUser = (currentPage - 1) * usersPerPage + 1;
  const indexOfLastUser = Math.min(currentPage * usersPerPage, totalRecords);


  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Title */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý Tài khoản & Vai trò</h1>
          <p className="text-gray-600">Quản lý tài khoản người dùng trong hệ thống</p>
        </div>

        {/* Controls Section */}
        <Card className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Search and Add Button */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon />
                </div>
                <input 
                  type="text"
                  placeholder="Tìm kiếm tài khoản..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg w-64 text-xs text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <Button 
                className="cursor-pointer px-3 py-2"
                onClick={() => navigate('/admin/accounts/add')}
              >
                <PlusIcon />
                <span className="ml-2">Thêm mới</span>
              </Button>
            </div>
            
            {/* Filters */}
            <div className="flex items-center space-x-2">
              <select 
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(e.target.value)}
                className="px-2 py-1.5 border border-gray-300 rounded-lg bg-white text-gray-700 text-xs w-48 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 truncate"
              >
                <option value="">Tất cả các trường</option>
                {filterOptions.schools.map((school) => (
                  <option key={school} value={school}>{school}</option>
                ))}
              </select>
              <select 
                value={selectedMajor}
                onChange={(e) => setSelectedMajor(e.target.value)}
                disabled={!selectedSchool}
                className={`px-2 py-1.5 border border-gray-300 rounded-lg bg-white text-gray-700 text-xs w-40 focus:outline-none focus:ring-2 focus:ring-blue-500 truncate ${
                  !selectedSchool ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <option value="">Tất cả ngành</option>
                {availableMajors.map((major) => (
                  <option key={major.name} value={major.name}>{major.name}</option>
                ))}
              </select>
              <select 
                value={selectedRole}
                onChange={(e) => {
                  const newRole = e.target.value;
                  console.log('Role changed to:', newRole);
                  setSelectedRole(newRole);
                }}
                className="px-2 py-1.5 border border-gray-300 rounded-lg bg-white text-gray-700 text-xs w-32 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 truncate"
              >
                <option value="">Tất cả vai trò</option>
                {filterOptions.roles.map((role) => (
                  <option key={role.code} value={role.code}>{role.name}</option>
                ))}
              </select>
              <select 
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-2 py-1.5 border border-gray-300 rounded-lg bg-white text-gray-700 text-xs w-32 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 truncate"
              >
                <option value="">Tất cả trạng thái</option>
                {filterOptions.statuses.map((status) => (
                  <option key={status.code} value={status.code}>{status.name}</option>
                ))}
              </select>
              <button 
                onClick={handleResetFilters}
                className="px-4 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-xs font-medium cursor-pointer"
              >
                <i className="fas fa-undo mr-2"></i>
                Reset bộ lọc
              </button>
            </div>
          </div>
        </Card>

        {/* Users Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <div className="relative" style={{ minHeight: isLoading ? '200px' : 'auto', minWidth: '1200px' }}>
              {isLoading && (
                <LoadingSpinner 
                  text="Đang tải dữ liệu..." 
                  size="md" 
                  position="top" 
                />
              )}
              {/* Table Header */}
              <div className="bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-12 gap-3 px-6 py-3 text-sm font-semibold text-gray-700">
              <div className="col-span-1">Mã số</div>
              <div className="col-span-2">Họ và tên</div>
              <div className="col-span-1">Vai trò</div>
              <div className="col-span-2">Trường</div>
              <div className="col-span-2">Ngành</div>
              <div className="col-span-1 whitespace-nowrap">Ngày đăng ký</div>
              <div className="col-span-1 pl-4">Trạng thái</div>
              <div className="col-span-2 pl-20">Thao tác</div>
              </div>
            </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-100">
            {!isLoading && accountsData.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <div className="text-gray-500">
                  <span className="text-2xl mb-2 block">🔍</span>
                  <p className="text-sm">Không tìm thấy người dùng phù hợp với bộ lọc</p>
                </div>
              </div>
            ) : !isLoading ? (
              accountsData.map((account) => (
              <div key={account.accountId} className="grid grid-cols-12 gap-3 px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="col-span-1 flex items-center">
                  <span className="text-sm text-gray-800">{getUserCode(account)}</span>
                </div>
                
                <div className="col-span-2 flex items-center">
                  <div className="flex items-center">
                    {account.profile?.avatarUrl ? (
                      <img 
                        src={account.profile.avatarUrl} 
                        alt={account.profile.fullName}
                        className="w-10 h-10 rounded-full border border-gray-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 border border-gray-200 flex items-center justify-center">
                        <i className="fas fa-user text-gray-400"></i>
                      </div>
                    )}
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-800">{account.profile?.fullName || 'N/A'}</div>
                      <div className="text-xs text-gray-500">
                        {formatDate(account.profile?.dateOfBirth)} • {account.profile?.gender || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="col-span-1 flex items-center">
                  <RoleBadge role={getRoleDisplayName(account.role?.code, account.role?.name)} />
                </div>
                
                <div className="col-span-2 flex items-center">
                  <span className="text-sm text-gray-600 truncate">{getDepartment(account)}</span>
                </div>
                
                <div className="col-span-2 flex items-center">
                  <span className="text-sm text-gray-600 break-words leading-tight">{getMajor(account)}</span>
                </div>
                
                <div className="col-span-1 flex items-center">
                  <span className="text-sm text-gray-600">{formatDate(account.createdAt)}</span>
                </div>
                
                <div className="col-span-1 flex items-center pl-4">
                  <StatusBadge status={account.status as 'active' | 'inactive' | 'blocked'}>
                    {account.status === 'active' ? 'Hoạt động' : 
                     account.status === 'inactive' ? 'Vắng mặt' : 'Đã khóa'}
                  </StatusBadge>
                </div>
                
                <div className="col-span-2 flex items-center space-x-2 pl-20">
                  {/* View Account Button - Icon only with tooltip */}
                  <button 
                    onClick={() => navigate(`/admin/accounts/${account.accountId}`)}
                    title="Xem tài khoản"
                    className="p-1.5 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                  >
                    <i className="fas fa-eye text-blue-600"></i>
                  </button>

                  {/* Lock/Unlock Button */}
                  {account.status === 'blocked' ? (
                    <button 
                      onClick={() => handleUnlockAccount(account.accountId)}
                      title="Mở khóa"
                      className="p-1.5 hover:bg-green-50 rounded-md transition-colors cursor-pointer"
                    >
                      <span style={{ filter: 'sepia(1) hue-rotate(50deg) saturate(3) brightness(1.2)' }}>🔓</span>
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleLockAccount(account.accountId)}
                      title="Khóa tài khoản"
                      className="p-1.5 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                    >
                      <span style={{ filter: 'hue-rotate(-30deg) saturate(2) brightness(0.9)' }}>🔒</span>
                    </button>
                  )}
                </div>
              </div>
              ))
            ) : null}
          </div>
          </div>

          {/* Pagination */}
          <div className="bg-white border-t border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Hiển thị {indexOfFirstUser} đến {indexOfLastUser} của {totalRecords} kết quả
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  disabled={currentPage === 1}
                  className={currentPage === 1 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                >
                  <ChevronLeftIcon />
                  <span className="ml-1">Trước</span>
                </Button>
                
                {/* Page numbers */}
                <div className="flex items-center space-x-1">
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
                      <Button
                        key={pageNum}
                        size="sm"
                        variant={currentPage === pageNum ? "primary" : "secondary"}
                        className={currentPage === pageNum ? "bg-blue-600 text-white" : "cursor-pointer"}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <>
                      <span className="px-2 text-gray-500">...</span>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        className="cursor-pointer"
                        onClick={() => setCurrentPage(totalPages)}
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>
                
                <Button 
                  variant="secondary" 
                  size="sm"
                  disabled={currentPage === totalPages}
                  className={currentPage === totalPages ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                >
                  <span className="mr-1">Sau</span>
                  <ChevronRightIcon />
                </Button>
              </div>
            </div>
          </div>
          </div>
        </Card>
      </div>

    </AdminLayout>
  );
}