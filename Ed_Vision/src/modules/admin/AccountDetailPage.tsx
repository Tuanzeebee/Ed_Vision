import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import AdminLayout from "../../components/ui/admin/AdminLayout";
import LoadingSpinner from "../../components/ui/admin/LoadingSpinner";
import ConfirmDialog from "../../components/ui/admin/ConfirmDialog";
import TabNavigation, { type Tab } from "../../components/ui/admin/TabNavigation";
import ProfileTabContent from "./ProfileTabContent";
import { useConfirm } from "../../hooks/useConfirm";
import { useToast } from "../../lib/useToast";
import { accountService, type AccountData } from "../../services/api/accountService";

// Icons
const UserIcon = () => <i className="fas fa-user text-blue-500"></i>;
const EnvelopeIcon = () => <i className="fas fa-envelope text-gray-500"></i>;
const KeyIcon = () => <i className="fas fa-key text-gray-500"></i>;
const ShieldIcon = () => <i className="fas fa-shield-alt text-purple-500"></i>;
const CalendarIcon = () => <i className="fas fa-calendar text-gray-500"></i>;
const EditIcon = () => <i className="fas fa-edit"></i>;
const SaveIcon = () => <i className="fas fa-save"></i>;

// Role badge
const RoleBadge = ({ role }: { role: string }) => {
  const roleClasses: { [key: string]: string } = {
    'Lãnh đạo': 'bg-red-100 text-red-800',
    'Giảng viên': 'bg-green-100 text-green-800',
    'Sinh viên': 'bg-blue-100 text-blue-800',
    'Phụ huynh': 'bg-purple-100 text-purple-800',
    'Quản trị viên': 'bg-orange-100 text-orange-800'
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${roleClasses[role] || 'bg-gray-100 text-gray-800'}`}>
      {role}
    </span>);
};

// Status badge
const StatusBadge = ({ status }: { status: 'active' | 'inactive' | 'blocked' }) => {
  const statusConfig = {
    active: { color: 'bg-green-100 text-green-800', icon: 'fa-check-circle', text: 'Hoạt động' },
    inactive: { color: 'bg-yellow-100 text-yellow-800', icon: 'fa-pause-circle', text: 'Vắng mặt' },
    blocked: { color: 'bg-red-100 text-red-800', icon: 'fa-ban', text: 'Đã khóa' }
  };

  const config = statusConfig[status];

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
      <i className={`fas ${config.icon} mr-1.5`}></i>
      {config.text}
    </span>);
};

// Card component
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
    {children}
  </div>);

// Button component
const Button = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const baseClasses = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500",
    secondary: "bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 focus:ring-blue-500",
    danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500"
  };

  const sizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>);
};

// Utility functions
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

const formatDateWithTime = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function AccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { confirm, confirmState } = useConfirm();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab state management
  const [activeTab, setActiveTab] = useState<'account' | 'profile'>('account');

  const [isLoading, setIsLoading] = useState(true);
  const [account, setAccount] = useState<AccountData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Editable form data
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    dateOfBirth: '',
    address: '',
    // Instructor-specific fields
    employeeCode: '',
    academicTitle: '',
    position: '',
    departmentId: undefined as number | undefined
  });

  // Fetch account data
  useEffect(() => {
    const fetchAccountData = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        // Fetch real data from API
        const data = await accountService.getAccountById(parseInt(id));
        setAccount(data);

        // Initialize form data
        setFormData({
          fullName: data.profile?.fullName || '',
          phoneNumber: '',
          dateOfBirth: data.profile?.dateOfBirth?.split('T')[0] || '', // Convert ISO to YYYY-MM-DD
          address: data.profile?.address || '',
          // Instructor fields
          employeeCode: data.instructor?.employeeCode || '',
          academicTitle: data.instructor?.academicTitle || '',
          position: data.instructor?.position || '',
          departmentId: data.instructor?.departmentId
        });

        setIsLoading(false);
      } catch (error) {
        showToast('Không thể tải thông tin tài khoản', 'error');
        setIsLoading(false);
      }
    };

    fetchAccountData();
  }, [id, showToast]);

  // Sync tab with URL parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'profile') {
      setActiveTab('profile');
    } else {
      setActiveTab('account');
    }
  }, [searchParams]);

  // Handle tab change
  const handleTabChange = (tabKey: string) => {
    const newTab = tabKey as 'account' | 'profile';
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  // Define tabs
  const tabs: Tab[] = [
    { key: 'account', label: 'Tài Khoản', icon: 'fas fa-user' },
    { key: 'profile', label: 'Hồ Sơ', icon: 'fas fa-id-card' }
  ];

  // Handle edit mode
  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form data to original
    if (account) {
      setFormData({
        fullName: account.profile?.fullName || '',
        phoneNumber: (account.profile as any)?.phoneNumber || '',
        dateOfBirth: account.profile?.dateOfBirth || '',
        address: account.profile?.address || '',
        // Instructor fields
        employeeCode: account.instructor?.employeeCode || '',
        academicTitle: account.instructor?.academicTitle || '',
        position: account.instructor?.position || '',
        departmentId: account.instructor?.departmentId
      });
    }
  };

  const handleSaveEdit = async () => {
    const confirmed = await confirm({
      title: 'Xác nhận lưu chỉnh sửa',
      message: 'Bạn có chắc chắn muốn lưu các thay đổi này?',
      confirmText: 'Đồng ý',
      cancelText: 'Hủy bỏ',
      type: 'info'
    });

    if (confirmed) {
      try {
        // Prepare update data
        const updateData: any = {
          fullName: formData.fullName,
          dateOfBirth: formData.dateOfBirth,
          address: formData.address
        };

        // Add instructor fields if this is an instructor account
        if (account?.instructor) {
          updateData.employeeCode = formData.employeeCode;
          updateData.academicTitle = formData.academicTitle;
          // position is read-only, don't send it
          updateData.departmentId = formData.departmentId;
        }

        // Call API to update account
        await accountService.updateAccount(parseInt(id!), updateData);

        setIsEditing(false);
        setSuccessMessage('Cập nhật thông tin tài khoản thành công!');
        setShowSuccessModal(true);

        // Refresh account data
        const updatedData = await accountService.getAccountById(parseInt(id!));
        setAccount(updatedData);
      } catch (error) {
        showToast('Không thể cập nhật thông tin', 'error');
      }
    }
  };

  const handleResetPassword = () => {
    // TODO: Implement reset password API
    setShowResetPasswordModal(false);
    setSuccessMessage('Đặt lại mật khẩu thành công! Mật khẩu mới đã được gửi qua email.');
    setShowSuccessModal(true);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <LoadingSpinner text="Đang tải thông tin tài khoản..." size="lg" />
        </div>
      </AdminLayout>);
  }

  if (!account) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <i className="fas fa-exclamation-triangle text-yellow-500 text-5xl mb-4"></i>
            <p className="text-gray-600 text-lg">Không tìm thấy tài khoản</p>
            <Button variant="secondary" onClick={() => navigate('/admin/accounts')} className="mt-4">
              <i className="fas fa-arrow-left mr-2"></i>
              <span>Quay lại</span>
            </Button>
          </div>
        </div>
      </AdminLayout>);
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Chi tiết</h1>
          <div className="flex items-center space-x-3">
            {isEditing ? (
              <>
                <Button variant="secondary" onClick={handleCancelEdit} className="cursor-pointer">
                  <i className="fas fa-times mr-2"></i>Hủy bỏ
                </Button>
                <Button variant="primary" onClick={handleSaveEdit} className="cursor-pointer">
                  <SaveIcon />
                  <span className="ml-2">Lưu chỉnh sửa</span>
                </Button>
              </>) : (
              <>
                <Button variant="secondary" onClick={handleEditClick} className="cursor-pointer">
                  <EditIcon />
                  <span className="ml-2">Chỉnh sửa</span>
                </Button>
                <Button variant="danger" onClick={() => setShowResetPasswordModal(true)} className="cursor-pointer">
                  <KeyIcon />
                  <span className="ml-2">Đặt lại mật khẩu</span>
                </Button>
              </>)}
          </div>
        </div>

        {/* Tab Navigation */}
        <TabNavigation 
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />

        {/* Tab Content */}
        {activeTab === 'account' ? (
          <div 
            role="tabpanel"
            id="account-panel"
            aria-labelledby="account-tab"
          >
            {/* Account Information */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Basic Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <UserIcon />
                <span className="ml-2">Thông tin cơ bản</span>
              </h2>

              <div className="space-y-4">
                {/* Email DTU */}
                <div className="flex items-start">
                  <div className="w-32 text-sm font-medium text-gray-500 flex items-center pt-2">
                    <EnvelopeIcon />
                    <span className="ml-2">Email DTU</span>
                  </div>
                  <div className="flex-1">
                    <input
                      type="text" value={account.email}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed" />
                  </div>
                </div>

                {/* Password - Blocked */}
                <div className="flex items-start">
                  <div className="w-32 text-sm font-medium text-gray-500 flex items-center pt-2">
                    <KeyIcon />
                    <span className="ml-2">Mật khẩu</span>
                  </div>
                  <div className="flex-1">
                    <input
                      type="password" value="••••••••••••" disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed" />
                    <p className="text-xs text-gray-500 mt-1">
                      <i className="fas fa-lock mr-1"></i>Mật khẩu được mã hóa và không thể xem
                    </p>
                  </div>
                </div>

                {/* Full Name */}
                <div className="flex items-start">
                  <div className="w-32 text-sm font-medium text-gray-500 pt-2">Họ và tên
                  </div>
                  <div className="flex-1">
                    <input
                      type="text" value={isEditing ? formData.fullName : (account.profile?.fullName || 'N/A')}
                      disabled={!isEditing}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${isEditing ? 'bg-white text-gray-900' : 'bg-gray-50 text-gray-700 cursor-not-allowed'}`}
                    />
                  </div>
                </div>

                {/* Date of Birth - Show for all accounts except parent */}
                {!account.parent && (
                  <div className="flex items-start">
                    <div className="w-32 text-sm font-medium text-gray-500 pt-2">Ngày sinh
                    </div>
                    <div className="flex-1">
                      <input
                        type="date" value={isEditing ? formData.dateOfBirth : (account.profile?.dateOfBirth?.split('T')[0] || '')}
                        disabled={!isEditing}
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${isEditing ? 'bg-white text-gray-900' : 'bg-gray-50 text-gray-700 cursor-not-allowed'}`}
                      />
                    </div>
                  </div>)}

                {/* Address - Show for all accounts */}
                <div className="flex items-start">
                  <div className="w-32 text-sm font-medium text-gray-500 pt-2">Địa chỉ
                  </div>
                  <div className="flex-1">
                    <input
                      type="text" value={isEditing ? formData.address : (account.profile?.address || '')}
                      disabled={!isEditing}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${isEditing ? 'bg-white text-gray-900' : 'bg-gray-50 text-gray-700 cursor-not-allowed'}`}
                    />
                  </div>
                </div>

                {/* Student Code */}
                {account.student?.studentCode && (
                  <div className="flex items-start">
                    <div className="w-32 text-sm font-medium text-gray-500 pt-2">Mã sinh viên
                    </div>
                    <div className="flex-1">
                      <input
                        type="text" value={account.student.studentCode}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed" />
                    </div>
                  </div>)}

                {/* Instructor Employee Code */}
                {account.instructor && (
                  <div className="flex items-start">
                    <div className="w-32 text-sm font-medium text-gray-500 pt-2">Mã giảng viên
                    </div>
                    <div className="flex-1">
                      <input
                        type="text" value={isEditing ? formData.employeeCode : account.instructor.employeeCode}
                        onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                        disabled={!isEditing}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${isEditing ? 'bg-white text-gray-900' : 'bg-gray-50 text-gray-700 cursor-not-allowed'}`}
                      />
                    </div>
                  </div>)}

                {/* School/Department (Trường) for Student */}
                {account.student?.departmentName && (
                  <div className="flex items-start">
                    <div className="w-32 text-sm font-medium text-gray-500 pt-2">Trường
                    </div>
                    <div className="flex-1">
                      <input
                        type="text" value={account.student.departmentName}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed" />
                    </div>
                  </div>)}

                {/* School/Department (Trường) for Instructor */}
                {account.instructor?.departmentName && (
                  <div className="flex items-start">
                    <div className="w-32 text-sm font-medium text-gray-500 pt-2">Trường
                    </div>
                    <div className="flex-1">
                      <input
                        type="text" value={account.instructor.departmentName}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed" />
                    </div>
                  </div>)}

                {/* Major (Only for Student) */}
                {account.student?.programName && (
                  <div className="flex items-start">
                    <div className="w-32 text-sm font-medium text-gray-500 pt-2">Ngành
                    </div>
                    <div className="flex-1">
                      <input
                        type="text" value={account.student.programName}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed" />
                    </div>
                  </div>)}

                {/* Academic Title (Only for Instructor) */}
                {account.instructor && (
                  <div className="flex items-start">
                    <div className="w-32 text-sm font-medium text-gray-500 pt-2">Chức danh
                    </div>
                    <div className="flex-1">
                      <input
                        type="text" value={isEditing ? formData.academicTitle : (account.instructor.academicTitle || '')}
                        onChange={(e) => setFormData({ ...formData, academicTitle: e.target.value })}
                        disabled={!isEditing}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${isEditing ? 'bg-white text-gray-900' : 'bg-gray-50 text-gray-700 cursor-not-allowed'}`}
                      />
                    </div>
                  </div>)}

                {/* Position (Only for Instructor) - Read Only */}
                {account.instructor && (
                  <div className="flex items-start">
                    <div className="w-32 text-sm font-medium text-gray-500 pt-2">Chức vụ
                    </div>
                    <div className="flex-1">
                      <input
                        type="text" value={account.instructor.position || ''}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed" />
                    </div>
                  </div>)}
              </div>
            </Card>
          </div>

          {/* Right Column - Status & Dates */}
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ShieldIcon />
                <span className="ml-2">Trạng thái & Vai trò</span>
              </h2>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Trạng thái</p>
                  <StatusBadge status={account.status as 'active' | 'inactive' | 'blocked'} />
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Vai trò</p>
                  <RoleBadge role={getRoleDisplayName(account.role?.code, account.role?.name)} />
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <CalendarIcon />
                    <span className="ml-2 font-medium">Ngày tạo</span>
                  </div>
                  <p className="text-sm text-gray-900">{formatDateWithTime(account.createdAt)}</p>
                </div>

                <div>
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <CalendarIcon />
                    <span className="ml-2 font-medium">Cập nhật lần cuối</span>
                  </div>
                  <p className="text-sm text-gray-900">
                    {formatDateWithTime(account.updatedAt)}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
          </div>
        ) : (
          <ProfileTabContent 
            account={account}
            role={getRoleDisplayName(account.role?.code, account.role?.name)}
          />
        )}

        {/* Reset Password Modal */}
        {showResetPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-30">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Xác nhận đặt lại mật khẩu
                </h3>
                <p className="text-sm text-gray-600 mb-6">Bạn có chắc chắn muốn đặt lại mật khẩu cho tài khoản <strong>{account.email}</strong>?
                  Mật khẩu mới sẽ được gửi qua email.
                </p>
                <div className="flex justify-end space-x-3">
                  <Button variant="secondary" onClick={() => setShowResetPasswordModal(false)}>Hủy
                  </Button>
                  <Button variant="danger" onClick={handleResetPassword}>Đặt lại mật khẩu
                  </Button>
                </div>
              </div>
            </div>
          </div>)}

        {/* Confirm Dialog */}
        <ConfirmDialog
          isOpen={confirmState.isOpen}
          title={confirmState.title}
          message={confirmState.message}
          confirmText={confirmState.confirmText}
          cancelText={confirmState.cancelText}
          type={confirmState.type}
          onConfirm={confirmState.onConfirm}
          onCancel={confirmState.onCancel}
        />

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-30">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-green-100 rounded-full mb-4">
                  <i className="fas fa-check text-green-600 text-2xl"></i>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">Thành công!
                </h3>
                <p className="text-sm text-gray-600 mb-6 text-center">
                  {successMessage}
                </p>
                <div className="flex justify-center">
                  <Button variant="primary" onClick={() => setShowSuccessModal(false)}>Đóng
                  </Button>
                </div>
              </div>
            </div>
          </div>)}
      </div>
    </AdminLayout>);
}
