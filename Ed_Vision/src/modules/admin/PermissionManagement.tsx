import { Card, CardContent } from "@/components/ui/card";
import AdminLayout from "../../components/ui/admin/AdminLayout";
import PermissionHeader, { type FilterState } from "../../components/ui/admin/PermissionHeader";
import { useState, useEffect } from "react";
import LoadingSpinner from "../../components/ui/admin/LoadingSpinner";
import { apiFetch } from '@/services/api/fetch';

export default function PermissionManagement() {
  const [selectedUser, setSelectedUser] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    accountTypeFilter: 'Tất cả',
    schoolFilter: 'Tất cả',
    majorFilter: 'Tất cả',
    statusFilter: 'Tất cả',
    permissionDisplayFilter: 'Tất cả'
  });

  // Loading effect when filters change
  useEffect(() => {
    setIsLoading(true);
    const loadTimeout = setTimeout(() => {
      console.log('Filter applied:', { filters, selectedUser });
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(loadTimeout);
  }, [filters, selectedUser]);

  // State cho data từ DB
  const [users, setUsers] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);

  // Load users từ DB
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await apiFetch('/admin/users');
        if (response?.users) {
          setUsers(response.users.map((user: any) => ({
            id: user.id,
            name: user.name || user.full_name,
            email: user.email,
            avatar: user.avatar || "/src/assets/admin/user1.jpg",
            role: user.role_name || user.role || "🎓 Sinh viên",
            code: user.code || user.student_id || user.teacher_id || `U${user.id}`,
            status: user.permission_override ? "Override" : "Kế thừa", 
            statusColor: user.permission_override ? "orange" : "blue"
          })));
        }
      } catch (error) {
        console.error('Error loading users:', error);
        // Fallback to mock data if API fails
        setUsers([
          {
            id: 0,
            name: "Nguyễn Văn An",
            email: "nguyenvanan@dtu.edu.vn", 
            avatar: "/src/assets/admin/user1.jpg",
            role: "🎓 Sinh viên CNTT",
            code: "SV001",
            status: "Override",
            statusColor: "orange"
          },
          {
            id: 1,
            name: "Trần Thị Bình",
            email: "tranthibinh@dtu.edu.vn",
            avatar: "/src/assets/admin/user2.jpg", 
            role: "👨‍🏫 Giảng viên CNTT",
            code: "GV002",
            status: "Kế thừa",
            statusColor: "blue"
          },
          {
            id: 2,
            name: "Lê Minh Cường",
            email: "leminhcuong@dtu.edu.vn",
            avatar: "/src/assets/admin/user3.jpg",
            role: "👔 Lãnh đạo CNTT",
            code: "LD003", 
            status: "Kế thừa",
            statusColor: "blue"
          },
          {
            id: 3,
            name: "Phạm Thị Dung",
            email: "phamthidung@gmail.com",
            avatar: "/src/assets/admin/user4.jpg",
            role: "👨‍👩‍👧‍👦 Phụ huynh",
            code: "PH004",
            status: "Override", 
            statusColor: "orange"
          },
          {
            id: 4,
            name: "Hoàng Văn Em",
            email: "hoangvanem@dtu.edu.vn",
            avatar: "/src/assets/admin/user5.jpg",
            role: "🎓 Sinh viên Kinh tế",
            code: "SV005",
            status: "Kế thừa",
            statusColor: "blue"
          }
        ]);
      }
    };
    
    loadUsers();
  }, []);

  // Load permissions cho user được chọn từ DB
  useEffect(() => {
    const loadUserPermissions = async () => {
      if (users.length > 0 && selectedUser !== null) {
        try {
          const response = await apiFetch(`/admin/user-permissions/${users[selectedUser].id}`);
          if (response?.permissions) {
            setPermissions(response.permissions.map((perm: any) => ({
              name: perm.name || perm.permission_name,
              description: perm.description || "Quyền hệ thống",
              granted: perm.granted || perm.has_permission || false,
              type: perm.type || (perm.is_override ? "Override" : "Kế thừa"),
              typeColor: perm.is_override ? "orange" : "blue"
            })));
          }
        } catch (error) {
          console.error('Error loading user permissions:', error);
          // Fallback to mock permissions
          setPermissions([
            {
              name: "Xem Dashboard",
              description: "Truy cập trang chủ và thống kê cơ bản",
              granted: true,
              type: "Kế thừa",
              typeColor: "blue"
            },
            {
              name: "Xem môn học & điểm",
              description: "Xem danh sách môn học và kết quả học tập", 
              granted: true,
              type: "Kế thừa",
              typeColor: "blue"
            },
            {
              name: "Xem thông báo",
              description: "Nhận và đọc thông báo từ hệ thống",
              granted: true,
              type: "Override",
              typeColor: "orange"
            },
            {
              name: "Xem kết quả AI cá nhân",
              description: "Truy cập dự đoán và phân tích AI cá nhân",
              granted: true,
              type: "Override", 
              typeColor: "orange"
            },
            {
              name: "Chỉnh sửa thông tin cá nhân",
              description: "Cập nhật thông tin cá nhân và liên hệ",
              granted: false,
              type: "Chưa cấp",
              typeColor: "gray"
            },
            {
              name: "Đăng ký môn học", 
              description: "Đăng ký và hủy đăng ký môn học",
              granted: true,
              type: "Override",
              typeColor: "orange"
            }
          ]);
        }
      }
    };
    
    loadUserPermissions();
  }, [users, selectedUser]);

  const getStatusBadgeClasses = (color: string) => {
    switch (color) {
      case 'orange':
        return 'px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full font-medium';
      case 'blue':
        return 'px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium';
      case 'gray':
        return 'px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium';
      default:
        return 'px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium';
    }
  };

  const getPermissionBgClasses = (granted: boolean, type: string) => {
    if (!granted) return 'bg-gray-50 border-gray-200';
    if (type === 'Override') return 'bg-orange-50 border-orange-200';
    return 'bg-blue-50 border-blue-200';
  };

  const getRoleBadgeClasses = (role: string) => {
    if (role.includes('Sinh viên')) return 'px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full';
    if (role.includes('Giảng viên')) return 'px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full';
    if (role.includes('Lãnh đạo')) return 'px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full';
    if (role.includes('Phụ huynh')) return 'px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full';
    return 'px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full';
  };

  const grantedCount = permissions.filter(p => p.granted).length;
  const totalCount = permissions.length;
  const overrideCount = permissions.filter(p => p.granted && p.type === 'Override').length;
  const inheritedCount = permissions.filter(p => p.granted && p.type === 'Kế thừa').length;

  return (
    <AdminLayout>
      <div className="p-6 bg-gray-50 overflow-y-auto">
        <PermissionHeader 
          activeTab="account" 
          filters={filters}
          onFiltersChange={setFilters}
          showFilters={true}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* User List */}
          <Card>
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Danh sách tài khoản</h3>
              <p className="text-sm text-gray-600 mt-1">Chọn tài khoản để xem chi tiết phân quyền</p>
            </div>
            <div className="max-h-80 overflow-y-auto relative" style={{ minHeight: isLoading ? '200px' : 'auto' }}>
              {isLoading && (
                <LoadingSpinner 
                  text="Đang tải danh sách tài khoản..." 
                  size="md" 
                  position="center" 
                />
              )}
              {!isLoading && users.map((user) => (
                <div
                  key={user.id}
                  onClick={() => setSelectedUser(user.id)}
                  className={`p-4 border-b border-gray-200 cursor-pointer transition-colors ${
                    selectedUser === user.id 
                      ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {user.name.split(' ').map((n: string) => n[0]).join('')}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-800">{user.name}</h4>
                        <span className={getStatusBadgeClasses(user.statusColor)}>
                          {user.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={getRoleBadgeClasses(user.role)}>{user.role}</span>
                        <span className="text-xs text-gray-500">{user.code}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Permission Details */}
          <Card>
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Chi tiết phân quyền</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {users[selectedUser]?.name || ''} - {users[selectedUser]?.role?.replace(/[^\w\s]/gi, '') || ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-blue-600">{grantedCount}/{totalCount} quyền được cấp</p>
                  <p className="text-xs text-gray-500">{overrideCount} Override, {inheritedCount} Kế thừa</p>
                </div>
              </div>
            </div>
            
            <div className="p-4">
              <div className="space-y-3">
                {permissions.map((permission, index) => (
                  <div 
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg border ${getPermissionBgClasses(permission.granted, permission.type)}`}
                  >
                    <div className="flex items-center space-x-3">
                      <input 
                        type="checkbox" 
                        checked={permission.granted}
                        className={`w-4 h-4 border-gray-300 rounded focus:ring-2 ${
                          permission.type === 'Override' 
                            ? 'text-orange-600 focus:ring-orange-500' 
                            : permission.granted 
                              ? 'text-blue-600 focus:ring-blue-500'
                              : 'text-gray-400 focus:ring-gray-500'
                        }`}
                        onChange={() => {}}
                      />
                      <div>
                        <p className={`font-medium ${permission.granted ? 'text-gray-800' : 'text-gray-500'}`}>
                          {permission.name}
                        </p>
                        <p className={`text-sm ${permission.granted ? 'text-gray-600' : 'text-gray-400'}`}>
                          {permission.description}
                        </p>
                      </div>
                    </div>
                    <span className={getStatusBadgeClasses(permission.typeColor)}>
                      {permission.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Permission Summary */}
        <Card className="mt-4">
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Quyền hiệu lực (tóm tắt)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-green-600 text-2xl">✅</span>
                </div>
                <p className="text-2xl font-bold text-green-600">{grantedCount}</p>
                <p className="text-sm text-gray-600">Quyền được cấp</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-orange-600 text-2xl">✏️</span>
                </div>
                <p className="text-2xl font-bold text-orange-600">{overrideCount}</p>
                <p className="text-sm text-gray-600">Quyền Override</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-blue-600 text-2xl">🔗</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">{inheritedCount}</p>
                <p className="text-sm text-gray-600">Quyền kế thừa</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-gray-600 text-2xl">⚠️</span>
                </div>
                <p className="text-2xl font-bold text-gray-600">0</p>
                <p className="text-sm text-gray-600">Xung đột</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}