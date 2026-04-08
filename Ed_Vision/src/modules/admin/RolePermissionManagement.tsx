import { useState, useEffect } from 'react';
import { apiFetch } from '@/services/api/fetch'
import { Card, CardContent } from "@/components/ui/card";
import AdminLayout from "@/components/ui/admin/AdminLayout";
import PermissionHeader, { type FilterState } from "@/components/ui/admin/PermissionHeader";
import LoadingSpinner from "@/components/ui/admin/LoadingSpinner";
import { useToast } from "@/lib/useToast";
import { ToastContainer } from '@/components/ui/Toast';

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

type PermissionState = Record<string, boolean>;

export default function RolePermissionManagement() {
  const [selectedRole, setSelectedRole] = useState('admin');
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    accountTypeFilter: 'Tất cả',
    schoolFilter: 'Tất cả', 
    majorFilter: 'Tất cả',
    statusFilter: 'Tất cả',
    permissionDisplayFilter: 'Tất cả'
  });
  
  // State cho data từ DB
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([]);
  const [permissions, setPermissions] = useState<PermissionState>({});
  const [savedPermissions, setSavedPermissions] = useState<PermissionState | null>(null);



  // Loading effect when filters change
  useEffect(() => {
    setIsLoading(true);
    const loadTimeout = setTimeout(() => {
      console.log('Filter applied:', { filters, selectedRole });
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(loadTimeout);
  }, [filters, selectedRole]);

  // Load roles từ DB
  useEffect(() => {
    const loadRoles = async () => {
      try {
        const response = await apiFetch('/admin/roles');
        
        if (response?.roles || Array.isArray(response)) {
          const rolesData = response.roles || response;
          
          const mappedRoles = rolesData.map((role: any) => ({
            id: role.id || role.name?.toLowerCase() || 'unknown',
            name: role.name || role.role_name || 'Unknown Role',
            icon: getIconForRole(role.name),
            permissions: role.permission_count || 0,
            accounts: role.account_count || 0,
            isActive: role.is_active !== false
          }));
          
          setRoles(mappedRoles);
          // Auto select first role
          if (mappedRoles.length > 0) {
            setSelectedRole(mappedRoles[0].id);
          }
          showToast(`Đã tải ${mappedRoles.length} vai trò từ cơ sở dữ liệu`, 'success');
        } else {
          // Fallback data
          setRoles([
            { id: 'student', name: 'Sinh viên', icon: 'fas fa-user-graduate', permissions: 12, accounts: 1245, isActive: true },
            { id: 'teacher', name: 'Giảng viên', icon: 'fas fa-chalkboard-teacher', permissions: 25, accounts: 89, isActive: true },
            { id: 'leader', name: 'Lãnh đạo', icon: 'fas fa-user-tie', permissions: 45, accounts: 15, isActive: true },
            { id: 'parent', name: 'Phụ huynh', icon: 'fas fa-users', permissions: 8, accounts: 567, isActive: true }
          ]);
        }
      } catch (error) {
        console.error('Error loading roles:', error);
        showToast('Không thể tải danh sách vai trò từ server. Sử dụng dữ liệu mẫu.', 'warning');
        // Fallback data
        setRoles([
          { id: 'student', name: 'Sinh viên', icon: 'fas fa-user-graduate', permissions: 12, accounts: 1245, isActive: true },
          { id: 'teacher', name: 'Giảng viên', icon: 'fas fa-chalkboard-teacher', permissions: 25, accounts: 89, isActive: true },
          { id: 'leader', name: 'Lãnh đạo', icon: 'fas fa-user-tie', permissions: 45, accounts: 15, isActive: true },
          { id: 'parent', name: 'Phụ huynh', icon: 'fas fa-users', permissions: 8, accounts: 567, isActive: true }
        ]);
      }
    };
    
    loadRoles();
  }, []);

  const { toasts, showToast, hideToast } = useToast();

  // Load permissions từ DB
  useEffect(() => {
    const loadPermissions = async () => {
      console.log('🔄 Loading permissions from DB...');
      try {
        const response = await apiFetch('/admin/permissions');
        console.log('📥 Permissions API Response:', response);
        
        if (response?.success && response?.data) {
          const permissionsData = response.data;
          console.log('✅ Permissions data found:', permissionsData);
          const grouped = groupPermissionsByModule(permissionsData);
          console.log('📊 Grouped permissions:', grouped);
          setPermissionGroups(grouped);
        } else {
          console.log('⚠️ No permissions in response');
        }
      } catch (error) {
        console.error('❌ Error loading permissions:', error);
        showToast('Không thể tải danh sách quyền từ server. Sử dụng dữ liệu mẫu.', 'warning');
        // Fallback data
        setPermissionGroups([
          {
            id: 'dashboard',
            name: 'Tổng quan',
            icon: 'fas fa-tachometer-alt',
            color: 'blue',
            permissions: [
              { id: 'dashboard_view', name: 'Xem trang chính', granted: false },
              { id: 'dashboard_stats', name: 'Xem thống kê', granted: false },
              { id: 'dashboard_export', name: 'Xuất báo cáo', granted: false, sensitive: true }
            ]
          },
          {
            id: 'student',
            name: 'Quản lý Sinh viên', 
            icon: 'fas fa-user-graduate',
            color: 'green',
            permissions: [
              { id: 'student_view', name: 'Xem danh sách sinh viên', granted: false },
              { id: 'student_create', name: 'Tạo tài khoản sinh viên', granted: false, sensitive: true },
              { id: 'student_edit', name: 'Chỉnh sửa thông tin', granted: false },
              { id: 'student_delete', name: 'Xóa tài khoản', granted: false, sensitive: true }
            ]
          },
          {
            id: 'teacher', 
            name: 'Quản lý Giảng viên',
            icon: 'fas fa-chalkboard-teacher',
            color: 'purple',
            permissions: [
              { id: 'teacher_view', name: 'Xem danh sách giảng viên', granted: false },
              { id: 'teacher_create', name: 'Tạo tài khoản giảng viên', granted: false, sensitive: true },
              { id: 'teacher_edit', name: 'Chỉnh sửa thông tin', granted: false },
              { id: 'teacher_schedule', name: 'Quản lý lịch dạy', granted: false }
            ]
          }
        ]);
      }
    };
    
    loadPermissions();
  }, []);

  // Load role permissions từ DB
  useEffect(() => {
    const loadRolePermissions = async () => {
      if (selectedRole && permissionGroups.length > 0) {
        console.log(`🔄 Loading permissions for role: ${selectedRole}`);
        try {
          const response = await apiFetch(`/admin/role-permissions/${selectedRole}`);
          console.log('📥 Role permissions API Response:', response);
          
          if (response?.success && response?.data) {
            const permissionsData = response.data;
            console.log('✅ Role permissions data:', permissionsData);
            
            const rolePermissions: PermissionState = {};
            
            // permissionsData is a Record<string, boolean> from backend
            Object.entries(permissionsData).forEach(([key, enabled]) => {
              rolePermissions[key] = !!enabled;
            });
            
            console.log('🎯 Mapped role permissions:', rolePermissions);
            setPermissions(rolePermissions);
            setSavedPermissions(rolePermissions);
            
            // Update permission groups
            setPermissionGroups(prevGroups =>
              prevGroups.map(group => ({
                ...group,
                permissions: group.permissions.map(perm => ({
                  ...perm,
                  granted: rolePermissions[perm.id] || false
                }))
              }))
            );
          }
        } catch (error) {
          console.error('❌ Error loading role permissions:', error);
          showToast(`Không thể tải quyền cho vai trò "${selectedRole}"`, 'error');
        }
      }
    };
    
    loadRolePermissions();
  }, [selectedRole, permissionGroups.length > 0]);

  const getIconForRole = (roleName: string) => {
    if (!roleName) return 'fas fa-user';
    const name = roleName.toLowerCase();
    if (name.includes('sinh viên') || name.includes('student')) return 'fas fa-user-graduate';
    if (name.includes('giảng viên') || name.includes('teacher')) return 'fas fa-chalkboard-teacher';
    if (name.includes('lãnh đạo') || name.includes('leader')) return 'fas fa-user-tie';
    if (name.includes('phụ huynh') || name.includes('parent')) return 'fas fa-users';
    return 'fas fa-user';
  };

  const groupPermissionsByModule = (permissions: any[]): PermissionGroup[] => {
    const groups: { [key: string]: any } = {};
    
    permissions.forEach((permission: any) => {
      const key = permission.permission_key || permission.key || permission.name;
      const name = permission.name || permission.display_name || key;
      const module = permission.module || key.split('_')[0] || 'other';
      
      if (!groups[module]) {
        groups[module] = {
          id: module,
          name: getModuleDisplayName(module),
          icon: getModuleIcon(module), 
          color: 'blue',
          permissions: []
        };
      }
      
      groups[module].permissions.push({
        id: key,
        name: name,
        granted: false,
        sensitive: permission.sensitive || false
      });
    });
    
    return Object.values(groups);
  };

  const getModuleDisplayName = (module: string): string => {
    const names: { [key: string]: string } = {
      'dashboard': 'Tổng quan',
      'student': 'Quản lý Sinh viên',
      'teacher': 'Quản lý Giảng viên', 
      'parent': 'Quản lý Phụ huynh',
      'admin': 'Quản trị hệ thống'
    };
    return names[module] || module.charAt(0).toUpperCase() + module.slice(1);
  };

  const getModuleIcon = (module: string): string => {
    const icons: { [key: string]: string } = {
      'dashboard': 'fas fa-tachometer-alt',
      'student': 'fas fa-user-graduate',
      'teacher': 'fas fa-chalkboard-teacher',
      'parent': 'fas fa-users',
      'admin': 'fas fa-cogs'
    };
    return icons[module] || 'fas fa-cube';
  };

  const handlePermissionToggle = (permissionId: string) => {
    setPermissions(prev => ({
      ...prev,
      [permissionId]: !prev[permissionId]
    }));
    
    // Update permission groups
    setPermissionGroups(prevGroups =>
      prevGroups.map(group => ({
        ...group,
        permissions: group.permissions.map(perm =>
          perm.id === permissionId 
            ? { ...perm, granted: !perm.granted }
            : perm
        )
      }))
    );
  };

  const handleSaveChanges = async () => {
    if (!selectedRole) return;
    
    console.log('💾 Saving permissions for role:', selectedRole);
    console.log('📦 Permissions to save:', permissions);
    
    try {
      const response = await apiFetch(`/admin/role-permissions/${selectedRole}`, {
        method: 'PUT',
        body: JSON.stringify({
          permissions: permissions // Send as Record<string, boolean>
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      console.log('📥 Save response:', response);

      if (response?.success) {
        setSavedPermissions({ ...permissions });
        showToast('Đã lưu thay đổi thành công!', 'success');
      } else {
        throw new Error(response?.message || 'Save failed');
      }
    } catch (error) {
      console.error('❌ Error saving permissions:', error);
      showToast('Có lỗi xảy ra khi lưu. Vui lòng thử lại.', 'error');
    }
  };

  const handleUndo = () => {
    if (window.confirm('Bạn có chắc chắn muốn hoàn tác các thay đổi?')) {
      const restorePermissions = savedPermissions || {};
      setPermissions({ ...restorePermissions });
      
      setPermissionGroups(prevGroups =>
        prevGroups.map(group => ({
          ...group,
          permissions: group.permissions.map(perm => ({
            ...perm,
            granted: restorePermissions[perm.id] || false
          }))
        }))
      );
      
      showToast('Đã hoàn tác các thay đổi', 'success');
    }
  };

  const getTotalStats = () => {
    let granted = 0;
    let sensitive = 0;
    let accounts = 0;
    
    permissionGroups.forEach(group => {
      group.permissions.forEach(permission => {
        if (permission.granted) granted++;
        if (permission.sensitive) sensitive++;
      });
    });
    
    const role = roles.find(r => r.id === selectedRole);
    if (role) accounts = role.accounts;
    
    return { granted, sensitive, accounts, conflicts: 0 };
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
      (filters.statusFilter === 'Tạm khóa' && !role.isActive);
    
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const stats = getTotalStats();

  return (
    <AdminLayout>
      <div className="p-6 bg-gray-50 min-h-screen">
        <PermissionHeader 
          activeTab="role" 
          onUndo={handleUndo}
          onExportConfig={() => showToast('Tính năng xuất cấu hình đang được phát triển', 'warning')}
          onSaveChanges={handleSaveChanges}
          filters={filters}
          onFiltersChange={setFilters}
          showFilters={true}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Role List */}
          <div className="lg:col-span-2">
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
                {!isLoading && filteredRoles.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-4">🤔</div>
                    <p className="text-lg font-medium mb-2">Không tìm thấy vai trò nào</p>
                    <div className="text-sm space-y-1">
                      <p>• Tổng số roles: {roles.length}</p>
                      <p>• Filtered roles: {filteredRoles.length}</p>
                      <p>• Search term: "{filters.searchTerm}"</p>
                      <p>• Account type: {filters.accountTypeFilter}</p>
                      <p>• Status: {filters.statusFilter}</p>
                    </div>
                  </div>
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
          <div className="lg:col-span-3">
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
                    <div key={group.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                      {/* Group Header */}
                      <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-5 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-gray-900 flex items-center">
                            <span className="mr-3 text-xl">
                              {group.icon === 'fas fa-tachometer-alt' ? '📊' :
                               group.icon === 'fas fa-user-graduate' ? '🎓' : 
                               group.name.includes('admin') ? '⚙️' :
                               group.name.includes('teacher') ? '👨‍🏫' :
                               group.name.includes('student') ? '🎓' :
                               group.name.includes('parent') ? '👪' : '📊'}
                            </span>
                            {group.name}
                          </h4>
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all duration-300 ${
                                    groupStats.granted === groupStats.total ? 'bg-emerald-500' :
                                    groupStats.granted > 0 ? 'bg-blue-500' : 'bg-gray-300'
                                  }`}
                                  style={{ width: `${(groupStats.granted / groupStats.total) * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-gray-600">
                                {Math.round((groupStats.granted / groupStats.total) * 100)}%
                              </span>
                            </div>
                            
                            <div className={`px-3 py-1 rounded-lg text-xs font-medium ${
                              groupStats.granted === groupStats.total 
                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                : groupStats.granted > 0
                                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                : 'bg-gray-100 text-gray-600 border border-gray-200'
                            }`}>
                              {groupStats.granted === groupStats.total 
                                ? 'Hoàn thành' 
                                : groupStats.granted > 0 
                                ? 'Một phần' 
                                : 'Chưa cấp'}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Permissions List */}
                      <div className="divide-y divide-gray-100">
                        {group.permissions.map((permission) => (
                          <div
                            key={permission.id}
                            className="flex items-center justify-between py-4 px-5 hover:bg-gray-50 transition-colors duration-150 cursor-pointer group"
                            onClick={() => handlePermissionToggle(permission.id)}
                          >
                            {/* Permission Info */}
                            <div className="flex items-center space-x-3 flex-1">
                              <div className={`w-2 h-2 rounded-full transition-colors ${
                                permission.granted ? 'bg-emerald-500' : 'bg-gray-300'
                              }`}></div>
                              
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className={`font-medium transition-colors ${
                                    permission.granted ? 'text-gray-900' : 'text-gray-500'
                                  }`}>
                                    {permission.name}
                                  </span>
                                  {permission.sensitive && (
                                    <span className="text-xs text-orange-600 font-medium bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                                      nhạy cảm
                                    </span>
                                  )}
                                </div>
                                {permission.sensitive && (
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    Quyền này có thể ảnh hưởng đến bảo mật hệ thống
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            {/* Modern Toggle Switch */}
                            <div className="flex items-center space-x-3">
                              <span className={`text-sm font-medium transition-colors ${
                                permission.granted ? 'text-emerald-600' : 'text-gray-400'
                              }`}>
                                {permission.granted ? 'Có quyền' : 'Chưa cấp'}
                              </span>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handlePermissionToggle(permission.id)
                                }}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                                  permission.granted 
                                    ? 'bg-emerald-500 shadow-emerald-200' 
                                    : 'bg-gray-200 hover:bg-gray-300'
                                }`}
                                type="button"
                                role="switch"
                                aria-checked={permission.granted}
                              >
                                <span className="sr-only">Toggle {permission.name}</span>
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out ${
                                    permission.granted ? 'translate-x-6' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            </div>
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
                  <li>Ưu tiên cao hơn quyền kế thừa</li>
                  <li>Chỉ áp dụng cho 1 tài khoản duy nhất</li>
                  <li>Quản lý tại tab "Theo tài khoản"</li>
                </ul>
              </div>
            </div>
            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
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
                <p className="text-sm text-gray-600">Tài khoản được áp dụng</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.granted}</p>
                <p className="text-sm text-gray-600">Quyền được cấp</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{stats.sensitive}</p>
                <p className="text-sm text-gray-600">Quyền nhạy cảm</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-600">{stats.conflicts}</p>
                <p className="text-sm text-gray-600">Xung đột</p>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Toasts (global for this page) */}
        <ToastContainer toasts={toasts} onClose={hideToast} />
      </div>
    </AdminLayout>
  );
}