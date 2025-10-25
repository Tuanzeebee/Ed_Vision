import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/ui/admin/AdminLayout";

// Icon components
const UploadIcon = () => <i className="fas fa-upload text-gray-400"></i>;
const CameraIcon = () => <i className="fas fa-camera text-gray-400 text-xl"></i>;
const EyeIcon = () => <i className="fas fa-eye text-gray-400 hover:text-gray-600"></i>;
const EyeSlashIcon = () => <i className="fas fa-eye-slash text-gray-400 hover:text-gray-600"></i>;
const TimesIcon = () => <i className="fas fa-times text-gray-700"></i>;
const SaveIcon = () => <i className="fas fa-save text-gray-700"></i>;
const PlusIcon = () => <i className="fas fa-plus text-white"></i>;

// Simple Card component
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
    {children}
  </div>
);

// Form data type
type AccountFormData = {
  avatar: File | null;
  fullName: string;
  email: string;
  birthDate: string;
  gender: string;
  phone: string;
  address: string;
  role: string;
  school: string;
  password: string;
  confirmPassword: string;
  status: string;
  sendEmail: boolean;
  forcePasswordChange: boolean;
  twoFactor: boolean;
  notes: string;
};

export default function AddAccount() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState<AccountFormData>({
    avatar: null,
    fullName: '',
    email: '',
    birthDate: '',
    gender: '',
    phone: '',
    address: '',
    role: '',
    school: '',
    password: '',
    confirmPassword: '',
    status: 'active',
    sendEmail: true,
    forcePasswordChange: true,
    twoFactor: false,
    notes: ''
  });

  const handleInputChange = (field: keyof AccountFormData, value: string | boolean | File | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
  };

  const handleCancel = () => {
    navigate('/admin/users');
  };

  const handleSaveDraft = () => {
    console.log('Save draft:', formData);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Title */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Thêm Mới Tài Khoản</h1>
          <p className="text-gray-600">Tạo tài khoản mới cho người dùng trong hệ thống</p>
        </div>

        {/* Form Card */}
        <Card>
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Avatar Upload Section */}
              <div className="flex items-center space-x-6">
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 bg-gray-200 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-gray-50 transition-colors">
                    <CameraIcon />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">Ảnh đại diện</h3>
                  <p className="text-xs text-gray-500 mb-2">Tải lên ảnh đại diện cho tài khoản (tùy chọn)</p>
                  <button 
                    type="button" 
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <UploadIcon />
                    <span className="ml-2">Chọn ảnh</span>
                  </button>
                </div>
              </div>

              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin cá nhân</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      required 
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      placeholder="Nhập họ và tên"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="email" 
                      required 
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      placeholder="example@predica.edu.vn"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
                    <input 
                      type="date" 
                      value={formData.birthDate}
                      onChange={(e) => handleInputChange('birthDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
                    <select 
                      value={formData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer text-gray-700"
                    >
                      <option value="">Chọn giới tính</option>
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                    <input 
                      type="tel" 
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      placeholder="0123456789"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                    <input 
                      type="text" 
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      placeholder="Nhập địa chỉ"
                    />
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin tài khoản</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vai trò <span className="text-red-500">*</span>
                    </label>
                    <select 
                      required 
                      value={formData.role}
                      onChange={(e) => handleInputChange('role', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer text-gray-700"
                    >
                      <option value="">Chọn vai trò</option>
                      <option value="admin">Quản trị viên</option>
                      <option value="teacher">Giảng viên</option>
                      <option value="student">Sinh viên</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Trường/Khoa <span className="text-red-500">*</span>
                    </label>
                    <select 
                      required 
                      value={formData.school}
                      onChange={(e) => handleInputChange('school', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer text-gray-700"
                    >
                      <option value="">Chọn trường/khoa</option>
                      <option value="cs">Khoa học Máy tính</option>
                      <option value="medical">Y - Dược</option>
                      <option value="economics">Kinh Tế</option>
                      <option value="technology">Công Nghệ</option>
                      <option value="tourism">Du lịch</option>
                      <option value="international">Đào tạo quốc tế</option>
                      <option value="social">Xã hội</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mật khẩu <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        required 
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                        placeholder="Nhập mật khẩu"
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                      >
                        {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Mật khẩu phải có ít nhất 8 ký tự</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Xác nhận mật khẩu <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input 
                        type={showConfirmPassword ? "text" : "password"} 
                        required 
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                        placeholder="Nhập lại mật khẩu"
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeSlashIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái tài khoản</label>
                    <select 
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer text-gray-700"
                    >
                      <option value="active">Hoạt động</option>
                      <option value="inactive">Vắng mặt</option>
                      <option value="blocked">Đã khóa</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Additional Settings */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Cài đặt bổ sung</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="send-email" 
                      checked={formData.sendEmail}
                      onChange={(e) => handleInputChange('sendEmail', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                    />
                    <label htmlFor="send-email" className="ml-2 text-sm text-gray-700 cursor-pointer">
                      Gửi email thông báo tài khoản đến người dùng
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="force-password-change" 
                      checked={formData.forcePasswordChange}
                      onChange={(e) => handleInputChange('forcePasswordChange', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                    />
                    <label htmlFor="force-password-change" className="ml-2 text-sm text-gray-700 cursor-pointer">
                      Yêu cầu đổi mật khẩu khi đăng nhập lần đầu
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="two-factor" 
                      checked={formData.twoFactor}
                      onChange={(e) => handleInputChange('twoFactor', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                    />
                    <label htmlFor="two-factor" className="ml-2 text-sm text-gray-700 cursor-pointer">
                      Kích hoạt xác thực hai yếu tố (2FA)
                    </label>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                <textarea 
                  rows={3} 
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  placeholder="Thêm ghi chú về tài khoản này (tùy chọn)"
                />
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                <button 
                  type="button" 
                  onClick={handleCancel}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <TimesIcon />
                  <span className="ml-2">Hủy bỏ</span>
                </button>
                <button 
                  type="button" 
                  onClick={handleSaveDraft}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <SaveIcon />
                  <span className="ml-2">Lưu nháp</span>
                </button>
                <button 
                  type="submit" 
                  className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <PlusIcon />
                  <span className="ml-2">Tạo tài khoản</span>
                </button>
              </div>
            </form>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}