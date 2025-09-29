import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import AdminLayout from "@/components/ui/admin/AdminLayout";
import PermissionHeader, { type FilterState } from "@/components/ui/admin/PermissionHeader";
import LoadingSpinner from "@/components/ui/admin/LoadingSpinner";

interface Permission {
  id: string;
  name: string;
  granted: boolean;
  sensitive?: boolean;
}

interface PermissionGroup {
  id: string;
  name: string;
  icon: string;
  color: string;
  permissions: Permission[];
}

interface Role {
  id: string;
  name: string;
  icon: string;
  permissions: number;
  accounts: number;
  isActive: boolean;
}

type PermissionState = {
  overview: {
    dashboard: boolean;
    statistics: boolean;
  };
  student: {
    viewGrades: boolean;
    viewNotifications: boolean;
    viewAIResults: boolean;
    editProfile: boolean;
    registerCourses: boolean;
    contactAdvisor: boolean;
  };
  survey: {
    createSurvey: boolean;
  };
};

export default function RolePermissionManagement() {
  const [selectedRole, setSelectedRole] = useState('student');
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    accountTypeFilter: 'Tất cả',
    schoolFilter: 'Tất cả',
    majorFilter: 'Tất cả',
    statusFilter: 'Tất cả',
    permissionDisplayFilter: 'Tất cả'
  });
  const [isLoading, setIsLoading] = useState(false);
  
  // Loading effect when filters change
  useEffect(() => {
    setIsLoading(true);
    const loadTimeout = setTimeout(() => {
      console.log('Filter applied:', { filters, selectedRole });
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(loadTimeout);
  }, [filters, selectedRole]);

  // Permission state for each group
  const [permissions, setPermissions] = useState<PermissionState>({
    overview: {
      dashboard: true,
      statistics: false
    },
    student: {
      viewGrades: true,
      viewNotifications: true,
      viewAIResults: true,
      editProfile: false,
      registerCourses: true,
      contactAdvisor: false
    },
    survey: {
      createSurvey: false
    }
  });

  const roles: Role[] = [
    {
      id: 'student',
      name: 'Sinh viên',
      icon: 'fas fa-user-graduate',
      permissions: 6,
      accounts: 1245,
      isActive: true
    },
    {
      id: 'teacher',
      name: 'Giảng viên',
      icon: 'fas fa-chalkboard-teacher',
      permissions: 12,
      accounts: 89,
      isActive: false
    },
    {
      id: 'leader',
      name: 'Lãnh đạo',
      icon: 'fas fa-user-tie',
      permissions: 18,
      accounts: 15,
      isActive: false
    },
    {
      id: 'parent',
      name: 'Phụ huynh',
      icon: 'fas fa-users',
      permissions: 3,
      accounts: 567,
      isActive: false
    }
  ];

  const permissionGroups: PermissionGroup[] = [
    {
      id: 'overview',
      name: 'Nhóm Tổng quan',
      icon: 'fas fa-tachometer-alt',
      color: 'blue',
      permissions: [
        { id: 'dashboard', name: 'Xem Dashboard', granted: permissions.overview.dashboard },
        { id: 'statistics', name: 'Xem thống kê cơ bản', granted: permissions.overview.statistics }
      ]
    },
    {
      id: 'student',
      name: 'Nhóm Sinh viên',
      icon: 'fas fa-user-graduate',
      color: 'green',
      permissions: [
        { id: 'viewGrades', name: 'Xem môn học & điểm', granted: permissions.student.viewGrades },
        { id: 'viewNotifications', name: 'Xem thông báo', granted: permissions.student.viewNotifications },
        { id: 'viewAIResults', name: 'Xem kết quả AI cá nhân', granted: permissions.student.viewAIResults },
        { id: 'editProfile', name: 'Chỉnh sửa thông tin cá nhân', granted: permissions.student.editProfile },
        { id: 'registerCourses', name: 'Đăng ký môn học', granted: permissions.student.registerCourses },
        { id: 'contactAdvisor', name: 'Liên hệ cố vấn', granted: permissions.student.contactAdvisor }
      ]
    },
    {
      id: 'survey',
      name: 'Nhóm Khảo sát',
      icon: 'fas fa-poll',
      color: 'purple',
      permissions: [
        { id: 'createSurvey', name: 'Tạo khảo sát', granted: permissions.survey.createSurvey, sensitive: true }
      ]
    }
  ];

  const handlePermissionToggle = (groupId: string, permissionId: string) => {
    setPermissions(prev => {
      const newPermissions = { ...prev };
      
      if (groupId === 'overview' && permissionId in newPermissions.overview) {
        newPermissions.overview = {
          ...newPermissions.overview,
          [permissionId]: !newPermissions.overview[permissionId as keyof typeof newPermissions.overview]
        };
      } else if (groupId === 'student' && permissionId in newPermissions.student) {
        newPermissions.student = {
          ...newPermissions.student,
          [permissionId]: !newPermissions.student[permissionId as keyof typeof newPermissions.student]
        };
      } else if (groupId === 'survey' && permissionId in newPermissions.survey) {
        newPermissions.survey = {
          ...newPermissions.survey,
          [permissionId]: !newPermissions.survey[permissionId as keyof typeof newPermissions.survey]
        };
      }
      
      return newPermissions;
    });
  };

  const getGroupStats = (group: PermissionGroup) => {
    const granted = group.permissions.filter(p => p.granted).length;
    const total = group.permissions.length;
    return { granted, total };
  };

  // Filter logic for roles
  const filteredRoles = roles.filter(role => {
    const matchesSearch = filters.searchTerm === '' || 
      role.name.toLowerCase().includes(filters.searchTerm.toLowerCase());
    
    const matchesDepartment = filters.accountTypeFilter === 'Tất cả' || 
      (filters.accountTypeFilter === 'Sinh viên' && role.name === 'Sinh viên') ||
      (filters.accountTypeFilter === 'Giảng viên' && role.name === 'Giảng viên') ||
      (filters.accountTypeFilter === 'Lãnh đạo' && role.name === 'Lãnh đạo') ||
      (filters.accountTypeFilter === 'Phụ huynh' && role.name === 'Phụ huynh');
    
    const matchesStatus = filters.statusFilter === 'Tất cả' || 
      (filters.statusFilter === 'Hoạt động' && role.isActive) ||
      (filters.statusFilter === 'Tạm khóa' && !role.isActive) ||
      (filters.statusFilter === 'Đã khóa' && !role.isActive);
    
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const getTotalStats = () => {
    let totalGranted = 0;
    let sensitiveLose = 0;
    
    permissionGroups.forEach(group => {
      group.permissions.forEach(permission => {
        if (permission.granted) totalGranted++;
        if (permission.sensitive && !permission.granted) sensitiveLose++;
      });
    });
    
    return {
      accounts: roles.find(r => r.id === selectedRole)?.accounts || 0,
      granted: totalGranted,
      sensitive: sensitiveLose,
      conflicts: 0
    };
  };

  const handleSaveChanges = () => {
    if (window.confirm('Bạn có chắc chắn muốn lưu các thay đổi phân quyền?')) {
      console.log('Saving permission changes...');
      alert('Thay đổi phân quyền đã được lưu thành công!');
    }
  };

  const handleExportConfig = () => {
    console.log('Exporting configuration...');
    alert('Cấu hình đã được xuất thành công!');
  };

  const handleUndo = () => {
    if (window.confirm('Bạn có chắc chắn muốn hoàn tác các thay đổi?')) {
      console.log('Undoing changes...');
      // Reset to default state
      setPermissions({
        overview: { dashboard: true, statistics: false },
        student: {
          viewGrades: true,
          viewNotifications: true,
          viewAIResults: true,
          editProfile: false,
          registerCourses: true,
          contactAdvisor: false
        },
        survey: { createSurvey: false }
      });
    }
  };

  const stats = getTotalStats();

  return (
    <AdminLayout>
      <div className="p-6 bg-gray-50 min-h-screen">
        <PermissionHeader 
          activeTab="role" 
          onUndo={handleUndo}
          onExportConfig={handleExportConfig}
          onSaveChanges={handleSaveChanges}
          filters={filters}
          onFiltersChange={setFilters}
          showFilters={true}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Role List */}
          <div className="lg:col-span-3">
            <Card>
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">Danh sách vai trò</h3>
                <p className="text-sm text-gray-600 mt-1">Chọn vai trò để xem chi tiết quyền</p>
              </div>
              <div className="p-4 space-y-2 relative" style={{ minHeight: isLoading ? '200px' : 'auto' }}>
                {isLoading && (
                  <LoadingSpinner 
                    text="Đang tải danh sách vai trò..." 
                    size="md" 
                    position="center" 
                  />
                )}
                {!isLoading && filteredRoles.map((role) => (
                  <div
                    key={role.id}
                    onClick={() => setSelectedRole(role.id)}
                    className={`p-4 border-l-4 rounded-lg cursor-pointer transition-all ${
                      selectedRole === role.id
                        ? 'bg-blue-50 border-blue-500'
                        : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className={`text-lg mr-3 ${
                          selectedRole === role.id ? 'text-blue-600' : 'text-gray-600'
                        }`}>
                          {role.icon === 'fas fa-user-graduate' ? '🎓' : 
                           role.icon === 'fas fa-chalkboard-teacher' ? '👨‍🏫' :
                           role.icon === 'fas fa-user-tie' ? '👔' : '👪'}
                        </span>
                        <div>
                          <h4 className={`font-semibold ${
                            selectedRole === role.id ? 'text-blue-800' : 'text-gray-800'
                          }`}>
                            {role.name}
                          </h4>
                          <p className={`text-sm ${
                            selectedRole === role.id ? 'text-blue-600' : 'text-gray-600'
                          }`}>
                            {role.permissions} quyền • {role.accounts.toLocaleString()} tài khoản
                          </p>
                        </div>
                      </div>
                      {selectedRole === role.id && (
                        <span className="text-green-500 text-lg">✅</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Permission Details */}
          <div className="lg:col-span-2">
            <Card>
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                      <span className="text-blue-600 text-lg mr-3">
                        {selectedRole === 'student' ? '🎓' : 
                         selectedRole === 'teacher' ? '👨‍🏫' :
                         selectedRole === 'leader' ? '👔' : '👪'}
                      </span>
                      Vai trò: {roles.find(r => r.id === selectedRole)?.name}
                    </h3>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                      <span>Tổng số tài khoản áp dụng: <strong className="text-gray-800">{stats.accounts.toLocaleString()}</strong></span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full font-medium text-xs">
                        Quyền mặc định
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {permissionGroups.map((group) => {
                  const groupStats = getGroupStats(group);
                  return (
                    <div key={group.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-800 flex items-center">
                          <span className={`text-${group.color}-500 mr-2`}>
                            {group.icon === 'fas fa-tachometer-alt' ? '📊' :
                             group.icon === 'fas fa-user-graduate' ? '🎓' : '📊'}
                          </span>
                          {group.name}
                        </h4>
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          groupStats.granted === groupStats.total 
                            ? 'bg-green-100 text-green-800'
                            : groupStats.granted > 0
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {groupStats.granted}/{groupStats.total} quyền được cấp
                        </span>
                      </div>
                      <div className="space-y-3">
                        {group.permissions.map((permission) => (
                          <div
                            key={permission.id}
                            className={`flex items-center justify-between p-3 rounded-lg ${
                              permission.granted ? 'bg-green-50' : 'bg-red-50'
                            }`}
                          >
                            <div className="flex items-center">
                              <span className={`mr-3 ${
                                permission.granted ? 'text-green-500' : 'text-red-500'
                              }`}>
                                {permission.granted ? '✅' : '❌'}
                              </span>
                              <div className="flex items-center">
                                <span className="text-gray-800">{permission.name}</span>
                                {permission.sensitive && (
                                  <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">
                                    nhạy cảm
                                  </span>
                                )}
                              </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={permission.granted}
                                onChange={() => handlePermissionToggle(group.id, permission.id)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>

        {/* Permission Concepts Explanation */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">💡 Giải thích về Phân quyền</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                  <span className="mr-2">🏛️</span>
                  Quyền Kế thừa (Role-based)
                </h4>
                <p className="text-blue-700 text-sm mb-2">
                  Quyền mặc định được cấp cho TẤT CẢ tài khoản thuộc vai trò này.
                </p>
                <ul className="text-blue-600 text-xs list-disc list-inside space-y-1">
                  <li>Ví dụ: Tất cả Sinh viên đều có quyền "Xem điểm"</li>
                  <li>Áp dụng đồng loạt cho {stats.accounts.toLocaleString()} tài khoản</li>
                  <li>Thay đổi ở đây sẽ ảnh hưởng toàn bộ vai trò</li>
                </ul>
              </div>
              
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-semibold text-orange-800 mb-2 flex items-center">
                  <span className="mr-2">⚡</span>
                  Quyền Override (Cá nhân)
                </h4>
                <p className="text-orange-700 text-sm mb-2">
                  Quyền đặc biệt được cấp riêng cho từng tài khoản cụ thể.
                </p>
                <ul className="text-orange-600 text-xs list-disc list-inside space-y-1">
                  <li>Ví dụ: Sinh viên A được cấp thêm quyền "Tạo khảo sát"</li>
                  <li>Ưu tiên cao hơn quyền kế thừa</li>
                  <li>Không bị ảnh hưởng khi thay đổi quyền vai trò</li>
                </ul>
              </div>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                <span className="mr-2">📊</span>
                Thứ tự ưu tiên quyền
              </h4>
              <div className="flex items-center space-x-4 text-sm">
                <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full font-medium">1. Override Từ chối</span>
                <span className="text-gray-400">→</span>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">2. Override Cho phép</span>
                <span className="text-gray-400">→</span>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">3. Quyền Vai trò</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Impact Summary */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📈 Tác động thay đổi</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.accounts.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Tài khoản ảnh hưởng</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.granted}</p>
                <p className="text-sm text-gray-600">Quyền được cấp</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{stats.sensitive}</p>
                <p className="text-sm text-gray-600">Quyền nhạy cảm</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{stats.conflicts}</p>
                <p className="text-sm text-gray-600">Xung đột</p>
              </div>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <div className="flex items-start">
                <span className="text-blue-500 mr-3 mt-1">ℹ️</span>
                <div>
                  <h4 className="font-semibold text-blue-800">Ghi chú quan trọng</h4>
                  <p className="text-blue-700 mt-1">
                    Thay đổi quyền vai trò sẽ ảnh hưởng đến tất cả <strong>{stats.accounts.toLocaleString()} tài khoản {roles.find(r => r.id === selectedRole)?.name}</strong>. 
                    Các tài khoản có override riêng sẽ không bị ảnh hưởng.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}