import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";

export interface FilterState {
  searchTerm: string;
  accountTypeFilter: string;
  schoolFilter: string;
  majorFilter: string;
  statusFilter: string;
  permissionDisplayFilter: string;
}

interface PermissionHeaderProps {
  activeTab: 'account' | 'role';
  onUndo?: () => void;
  onExportConfig?: () => void;
  onSaveChanges?: () => void;
  // Filter props
  filters?: FilterState;
  onFiltersChange?: (filters: FilterState) => void;
  showFilters?: boolean;
}

export default function PermissionHeader({ 
  activeTab, 
  onUndo, 
  onExportConfig, 
  onSaveChanges,
  filters,
  onFiltersChange,
  showFilters = true
}: PermissionHeaderProps) {
  const navigate = useNavigate();

  const handleUndo = () => {
    if (onUndo) {
      onUndo();
    } else {
      // Default undo logic if not provided
      console.log('Hoàn tác thay đổi');
    }
  };

  const handleExportConfig = () => {
    if (onExportConfig) {
      onExportConfig();
    } else {
      // Default export logic if not provided
      console.log('Xuất cấu hình');
    }
  };

  const handleSaveChanges = () => {
    if (onSaveChanges) {
      onSaveChanges();
    } else {
      // Default save logic if not provided
      console.log('Lưu thay đổi');
    }
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    if (onFiltersChange && filters) {
      onFiltersChange({
        ...filters,
        [key]: value
      });
    }
  };

  const handleResetFilters = () => {
    if (onFiltersChange) {
      onFiltersChange({
        searchTerm: '',
        accountTypeFilter: 'Tất cả',
        schoolFilter: 'Tất cả',
        majorFilter: 'Tất cả',
        statusFilter: 'Tất cả',
        permissionDisplayFilter: 'Tất cả'
      });
    }
  };

  return (
    <>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Phân quyền</h1>
          <p className="text-gray-600">Quản lý quyền hạn theo vai trò và tài khoản cá nhân</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleUndo}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center cursor-pointer text-sm"
          >
            <span className="mr-1">🔄</span>
            Hoàn tác
          </button>
          <button 
            onClick={handleExportConfig}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center cursor-pointer text-sm"
          >
            <span className="mr-1">📥</span>
            Xuất cấu hình
          </button>
          <button 
            onClick={handleSaveChanges}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center cursor-pointer text-sm"
          >
            <span className="mr-1">💾</span>
            Lưu thay đổi
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button 
              onClick={() => navigate('/admin/permissions')}
              className={`border-b-2 py-2 px-1 text-sm font-medium transition-colors ${
                activeTab === 'account' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              👤 Theo tài khoản
            </button>
            <button 
              onClick={() => navigate('/admin/role-permissions')}
              className={`border-b-2 py-2 px-1 text-sm font-medium transition-colors ${
                activeTab === 'role' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              👥 Theo vai trò
            </button>
          </nav>
        </div>
      </div>

      {/* Shared Filters */}
      {showFilters && filters && onFiltersChange && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Bộ lọc tài khoản</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tìm kiếm</label>
                <input 
                  type="text" 
                  placeholder={activeTab === 'account' ? "Tên tài khoản hoặc Email..." : "Tên vai trò hoặc mô tả..."} 
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={filters.searchTerm}
                  onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {activeTab === 'account' ? 'Loại tài khoản' : 'Loại vai trò'}
                </label>
                <select 
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs text-gray-800 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={filters.accountTypeFilter}
                  onChange={(e) => handleFilterChange('accountTypeFilter', e.target.value)}
                >
                  <option>Tất cả</option>
                  <option>Sinh viên</option>
                  <option>Giảng viên</option>
                  <option>Lãnh đạo</option>
                  <option>Phụ huynh</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Trường</label>
                <select 
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs text-gray-800 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={filters.schoolFilter}
                  onChange={(e) => handleFilterChange('schoolFilter', e.target.value)}
                >
                  <option>Tất cả</option>
                  <option>CNTT</option>
                  <option>Kinh tế</option>
                  <option>Ngoại ngữ</option>
                  <option>Y Dược</option>
                  <option>Kỹ thuật</option>
                  <option>Luật</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Chuyên ngành</label>
                <select 
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs text-gray-800 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={filters.majorFilter}
                  onChange={(e) => handleFilterChange('majorFilter', e.target.value)}
                >
                  <option>Tất cả</option>
                  <option>Khoa học máy tính</option>
                  <option>Hệ thống thông tin</option>
                  <option>Mạng máy tính</option>
                  <option>Công nghệ phần mềm</option>
                  <option>An toàn thông tin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Trạng thái</label>
                <select 
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs text-gray-800 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={filters.statusFilter}
                  onChange={(e) => handleFilterChange('statusFilter', e.target.value)}
                >
                  <option>Tất cả</option>
                  <option>Hoạt động</option>
                  <option>Vắng mặt</option>
                  <option>Đã khóa</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Hiển thị quyền</label>
                <select 
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs text-gray-800 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={filters.permissionDisplayFilter}
                  onChange={(e) => handleFilterChange('permissionDisplayFilter', e.target.value)}
                >
                  <option>Tất cả</option>
                  <option>Được cấp</option>
                  <option>Override riêng</option>
                  <option>Kế thừa từ vai trò</option>
                  <option>Bị từ chối</option>
                  <option>Quyền nhạy cảm</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Thao tác</label>
                <button 
                  onClick={handleResetFilters}
                  className="w-full px-2 py-1.5 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors font-medium text-xs"
                >
                  <i className="fas fa-undo mr-1"></i>
                  Reset
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}