import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/ui/admin/AdminLayout";

// Icon components
const UploadIcon = () => <i className="fas fa-upload text-gray-400"></i>;
const CameraIcon = () => <i className="fas fa-camera text-gray-400 text-xl"></i>;
const EyeIcon = () => <i className="fas fa-eye text-gray-400 hover:text-gray-600"></i>;
const EyeSlashIcon = () => <i className="fas fa-eye-slash text-gray-400 hover:text-gray-600"></i>;
const TimesIcon = () => <i className="fas fa-times text-gray-700"></i>;
const PlusIcon = () => <i className="fas fa-plus text-white"></i>;
const FileIcon = () => <i className="fas fa-file-csv text-gray-400"></i>;
const DownloadIcon = () => <i className="fas fa-download text-gray-400"></i>;
const TrashIcon = () => <i className="fas fa-trash text-red-500"></i>;

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
  const [activeTab, setActiveTab] = useState<'manual' | 'auto'>('manual');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [autoAccountType, setAutoAccountType] = useState<'student' | 'teacher' | 'parent'>('student');
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  
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

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleInputChange('avatar', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarClick = () => {
    avatarInputRef.current?.click();
  };

  const handleRemoveAvatar = () => {
    handleInputChange('avatar', null);
    setAvatarPreview(null);
    if (avatarInputRef.current) {
      avatarInputRef.current.value = '';
    }
  };

  const handleCsvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.csv')) {
      setCsvFile(file);
    } else {
      alert('Vui lòng chọn file CSV');
    }
  };

  const handleCsvUploadClick = () => {
    csvInputRef.current?.click();
  };

  const handleRemoveCsv = () => {
    setCsvFile(null);
    if (csvInputRef.current) {
      csvInputRef.current.value = '';
    }
  };

  const handleDownloadTemplate = () => {
    // Create CSV template based on account type
    let headers: string[];
    let sampleData: string[];
    let filename: string;
    
    switch (autoAccountType) {
      case 'student':
        headers = ['mssv', 'ho_ten', 'ngay_sinh', 'gioi_tinh', 'email', 'dia_chi', 'so_dien_thoai', 'truong', 'nganh', 'lop', 'thong_tin_nguoi_than'];
        sampleData = ['20210001', 'Nguyễn Văn A', '01/01/2003', 'Nam', 'nguyenvana@dtu.edu.vn', 'Đà Nẵng', '0123456789', 'Trường Khoa học máy tính', 'Công nghệ thông tin', 'IT-K28', 'Nguyễn Văn B - 0987654321'];
        filename = 'mau_danh_sach_sinh_vien.csv';
        break;
      case 'teacher':
        headers = ['ma_gv', 'ho_ten', 'ngay_sinh', 'gioi_tinh', 'email', 'dia_chi', 'so_dien_thoai', 'truong', 'chuyen_mon', 'hoc_vi'];
        sampleData = ['GV001', 'Trần Thị B', '15/05/1985', 'Nữ', 'tranthib@dtu.edu.vn', 'Đà Nẵng', '0123456789', 'Trường Khoa học máy tính', 'Lập trình', 'Tiến sĩ'];
        filename = 'mau_danh_sach_giang_vien.csv';
        break;
      case 'parent':
        headers = ['ma_ph', 'ho_ten', 'ngay_sinh', 'gioi_tinh', 'email', 'dia_chi', 'so_dien_thoai', 'mssv_con', 'ho_ten_con', 'quan_he'];
        sampleData = ['PH001', 'Lê Văn C', '10/10/1975', 'Nam', 'levanc@gmail.com', 'Đà Nẵng', '0123456789', '20210001', 'Nguyễn Văn A', 'Cha'];
        filename = 'mau_danh_sach_phu_huynh.csv';
        break;
      default:
        return;
    }
    
    const csvContent = [headers.join(','), sampleData.join(',')].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAutoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) {
      alert('Vui lòng chọn file CSV');
      return;
    }
    
    // Process CSV file
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const rows = text.split('\n').slice(1); // Skip header
      
      console.log('Processing CSV with', rows.length, 'rows');
      // Here you would process each row and create accounts
      alert(`Sẽ tạo ${rows.length} tài khoản từ file CSV. Mật khẩu sẽ được tạo ngẫu nhiên và gửi về email.`);
    };
    reader.readAsText(csvFile);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Title */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Thêm Mới Tài Khoản</h1>
          <p className="text-gray-600">Tạo tài khoản mới cho người dùng trong hệ thống</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'manual'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Thủ công
          </button>
          <button
            onClick={() => setActiveTab('auto')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'auto'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Tự động (CSV)
          </button>
        </div>

        {/* Manual Tab */}
        {activeTab === 'manual' && (
        <Card>
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Avatar Upload Section */}
              <div className="flex items-center space-x-6">
                <div className="flex-shrink-0">
                  <div 
                    onClick={handleAvatarClick}
                    className="relative w-24 h-24 bg-gray-200 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-gray-50 transition-colors overflow-hidden"
                  >
                    {avatarPreview ? (
                      <>
                        <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveAvatar();
                          }}
                          className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          style={{ width: '24px', height: '24px' }}
                        >
                          <TimesIcon />
                        </button>
                      </>
                    ) : (
                      <CameraIcon />
                    )}
                  </div>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">Ảnh đại diện</h3>
                  <p className="text-xs text-gray-500 mb-2">Tải lên ảnh đại diện cho tài khoản (tùy chọn)</p>
                  <button 
                    type="button"
                    onClick={handleAvatarClick}
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
                      <option value="leader">Lãnh đạo</option>
                      <option value="teacher">Giảng viên</option>
                      <option value="student">Sinh viên</option>
                      <option value="parent">Phụ huynh</option>
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
        )}

        {/* Auto Tab */}
        {activeTab === 'auto' && (
        <Card>
          <div className="p-6">
            <form onSubmit={handleAutoSubmit} className="space-y-6">
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-2">📋 Hướng dẫn sử dụng</h3>
                <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                  <li>Chọn loại đối tượng cần tạo tài khoản</li>
                  <li>Tải xuống file mẫu CSV tương ứng</li>
                  <li>Điền thông tin vào file theo đúng định dạng</li>
                  <li>Upload file CSV đã hoàn thành</li>
                  <li>Hệ thống sẽ tự động tạo tài khoản với email @dtu.edu.vn</li>
                  <li>Mật khẩu ngẫu nhiên sẽ được tạo và gửi về email</li>
                </ul>
              </div>

              {/* Account Type Selection */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Chọn loại đối tượng</h3>
                <select 
                  value={autoAccountType}
                  onChange={(e) => {
                    setAutoAccountType(e.target.value as 'student' | 'teacher' | 'parent');
                    // Reset CSV file when changing type
                    setCsvFile(null);
                    if (csvInputRef.current) {
                      csvInputRef.current.value = '';
                    }
                  }}
                  className="w-48 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer text-gray-700"
                >
                  <option value="student">Sinh viên</option>
                  <option value="teacher">Giảng viên</option>
                  <option value="parent">Phụ huynh</option>
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  {autoAccountType === 'student' && 'Tạo tài khoản cho sinh viên với thông tin học tập'}
                  {autoAccountType === 'teacher' && 'Tạo tài khoản cho giảng viên với thông tin giảng dạy'}
                  {autoAccountType === 'parent' && 'Tạo tài khoản cho phụ huynh liên kết với sinh viên'}
                </p>
              </div>

              {/* Download Template */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Bước 1: Tải file mẫu</h3>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <DownloadIcon />
                  <span className="ml-2">
                    Tải xuống file mẫu {autoAccountType === 'student' ? 'Sinh viên' : autoAccountType === 'teacher' ? 'Giảng viên' : 'Phụ huynh'}
                  </span>
                </button>
                <div className="text-xs text-gray-500 mt-2">
                  <p className="font-medium mb-1">File mẫu chứa các cột:</p>
                  {autoAccountType === 'student' && (
                    <p>MSSV, Họ tên, Ngày sinh, Giới tính, Email, Địa chỉ, Số điện thoại, Trường, Ngành, Lớp, Thông tin người thân</p>
                  )}
                  {autoAccountType === 'teacher' && (
                    <p>Mã GV, Họ tên, Ngày sinh, Giới tính, Email, Địa chỉ, Số điện thoại, Trường, Chuyên môn, Học vị</p>
                  )}
                  {autoAccountType === 'parent' && (
                    <p>Mã PH, Họ tên, Ngày sinh, Giới tính, Email, Địa chỉ, Số điện thoại, MSSV con, Họ tên con, Quan hệ</p>
                  )}
                </div>
              </div>

              {/* CSV Upload */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Bước 2: Upload file CSV</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                  {csvFile ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center space-x-3">
                        <FileIcon />
                        <span className="text-sm font-medium text-gray-900">{csvFile.name}</span>
                        <button
                          type="button"
                          onClick={handleRemoveCsv}
                          className="text-red-500 hover:text-red-700 cursor-pointer"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500">
                        Kích thước: {(csvFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <FileIcon />
                      <div>
                        <button
                          type="button"
                          onClick={handleCsvUploadClick}
                          className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        >
                          <UploadIcon />
                          <span className="ml-2">Chọn file CSV</span>
                        </button>
                      </div>
                      <p className="text-xs text-gray-500">
                        Chỉ chấp nhận file .csv
                      </p>
                    </div>
                  )}
                  <input
                    ref={csvInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleCsvChange}
                    className="hidden"
                  />
                </div>
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
                  type="submit"
                  disabled={!csvFile}
                  className={`inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    csvFile 
                      ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer' 
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  <PlusIcon />
                  <span className="ml-2">Tạo tài khoản hàng loạt</span>
                </button>
              </div>
            </form>
          </div>
        </Card>
        )}
      </div>
    </AdminLayout>
  );
}