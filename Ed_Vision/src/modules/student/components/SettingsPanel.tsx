import { useState, useEffect, useRef } from 'react';
import { useDraggable } from '../hooks/useDraggable';
import { useResizable } from '../hooks/useResizable';
import { buildUrl } from '@/services/api/config';
import { TokenManager } from '@/lib/tokenManager';
import ImageCropModal from './ImageCropModal';

type ProfileData = {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  dateOfBirthRaw: string; // For date input (YYYY-MM-DD format)
  gender: string;
  nationality: string;
  address: string;
  avatarUrl: string;
  studentCode: string;
  major: string;
  className: string;
};

type Props = {
  visible: boolean;
  onClose: () =>void;
  initialX?: number;
  initialY?: number;
  initialWidth?: number;
  initialHeight?: number;
};

export default function SettingsPanel({
  visible,
  onClose,
  initialX = (window.innerWidth - 700) / 2,
  initialY = (window.innerHeight - 600 - 80) / 2,
  initialWidth = 700,
  initialHeight = 600,
}: Props) {
  const { position, handleMouseDown } = useDraggable(initialX, initialY);
  const { size, handleMouseDown: handleResize } = useResizable(initialWidth, initialHeight, 500, 400);
  
  const [activeTab, setActiveTab] = useState<'profile'| 'general'| 'appearance'| 'notifications'| 'privacy'>('profile');
  const [language, setLanguage] = useState('vi');
  const [autoSave, setAutoSave] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [pomodoroNotif, setPomodoroNotif] = useState(true);
  const [showTimer, setShowTimer] = useState(true);
  
  // Profile state
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<ProfileData>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Avatar crop state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load profile data when panel opens
  useEffect(() => {
    if (visible && !profileData) {
      loadProfile();
    }
  }, [visible]);

  const loadProfile = async () => {
    try {
      setProfileLoading(true);
      const token = TokenManager.getToken();
      if (!token) return;

      const res = await fetch(buildUrl('/profile/student'), {
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) return;

      const data = await res.json();
      const profile = data?.profile || {};
      
      // Get raw date for input field
      const rawDate = profile.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '';
      
      setProfileData({
        fullName: profile.fullName || '',
        email: profile.email || '',
        phone: profile.phoneNumber || '',
        dateOfBirth: profile.dateOfBirth ? formatDate(profile.dateOfBirth) : '',
        dateOfBirthRaw: rawDate,
        gender: profile.gender || '',
        nationality: profile.nationality || '',
        address: profile.address || '',
        avatarUrl: getFullAvatarUrl(profile.avatarUrl),
        studentCode: data?.studentCode || '',
        major: data?.major || '',
        className: data?.className || '',
      });
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  // Start editing profile
  const startEditing = () => {
    if (profileData) {
      setEditForm({
        fullName: profileData.fullName,
        phone: profileData.phone,
        dateOfBirthRaw: profileData.dateOfBirthRaw,
        gender: profileData.gender,
        nationality: profileData.nationality,
        address: profileData.address,
      });
      setIsEditing(true);
      setSaveError(null);
      setSaveSuccess(false);
    }
  };

  // Cancel editing
  const cancelEditing = () => {
    setIsEditing(false);
    setEditForm({});
    setSaveError(null);
  };

  // Save profile changes
  const saveProfile = async () => {
    try {
      setSaving(true);
      setSaveError(null);
      
      const token = TokenManager.getToken();
      if (!token) {
        throw new Error('Vui lòng đăng nhập lại');
      }

      const payload = {
        full_name: editForm.fullName,
        phone_number: editForm.phone || null,
        date_of_birth: editForm.dateOfBirthRaw || null,
        gender: editForm.gender || null,
        nationality: editForm.nationality || null,
        address: editForm.address || null,
      };

      const res = await fetch(buildUrl('/profile/me'), {
        method: 'PUT',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Cập nhật thất bại');
      }

      // Reload profile data
      await loadProfile();
      setIsEditing(false);
      setSaveSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() =>setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Save profile error:', err);
      setSaveError(err?.message || 'Có lỗi xảy ra khi lưu');
    } finally {
      setSaving(false);
    }
  };

  // Handle avatar file selection
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setSaveError('Vui lòng chọn file hình ảnh');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size >5 * 1024 * 1024) {
      setSaveError('Kích thước file không được vượt quá 5MB');
      return;
    }

    // Create object URL for preview
    const imageUrl = URL.createObjectURL(file);
    setSelectedImage(imageUrl);
    setCropModalOpen(true);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle cropped image upload
  const handleCropComplete = async (croppedBlob: Blob) => {
    try {
      setCropModalOpen(false);
      setUploadingAvatar(true);
      setSaveError(null);

      const token = TokenManager.getToken();
      if (!token) {
        throw new Error('Vui lòng đăng nhập lại');
      }

      // Create FormData with cropped image
      const formData = new FormData();
      formData.append('file', croppedBlob, 'avatar.jpg');

      // Upload avatar
      const uploadRes = await fetch(buildUrl('/profile/upload-avatar'), {
        method: 'POST',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error('Upload ảnh thất bại');
      }

      const { url } = await uploadRes.json();

      // Update profile with new avatar URL
      const updateRes = await fetch(buildUrl('/profile/me'), {
        method: 'PUT',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          avatar_url: url,
        }),
      });

      if (!updateRes.ok) {
        throw new Error('Cập nhật avatar thất bại');
      }

      // Update localStorage user object
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          userObj.avatarUrl = url;
          userObj.avatar = url;
          userObj.avatar_url = url;
          localStorage.setItem('user', JSON.stringify(userObj));
        } catch (e) {
          console.error('Failed to update localStorage user', e);
        }
      }

      // Dispatch event to notify other components (Header, etc.)
      window.dispatchEvent(new CustomEvent('avatar-updated', { detail: { url } }));

      // Reload profile
      await loadProfile();
      setSaveSuccess(true);
      setTimeout(() =>setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Avatar upload error:', err);
      setSaveError(err?.message || 'Có lỗi xảy ra khi upload ảnh');
    } finally {
      setUploadingAvatar(false);
      // Clean up object URL
      if (selectedImage) {
        URL.revokeObjectURL(selectedImage);
        setSelectedImage('');
      }
    }
  };

  // Close crop modal
  const handleCropCancel = () => {
    setCropModalOpen(false);
    if (selectedImage) {
      URL.revokeObjectURL(selectedImage);
      setSelectedImage('');
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return '';
    }
  };

  const getFullAvatarUrl = (url: string | null | undefined): string => {
    if (!url) return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `http://localhost:3000${url}`;
  };

  if (!visible) return null;

  const tabs = [
    { id: 'profile', icon: 'fa-user', label: 'Profile'},
    { id: 'general', icon: 'fa-sliders-h', label: 'General'},
    { id: 'appearance', icon: 'fa-palette', label: 'Appearance'},
    { id: 'notifications', icon: 'fa-bell', label: 'Notifications'},
    { id: 'privacy', icon: 'fa-shield-alt', label: 'Privacy'},
  ];

  return (
    <div
      className="fixed z-10"style={{ left: `${position.x}px`, top: `${position.y}px`, width: `${size.width}px`, height: `${size.height}px` }}
    >
      <div className="backdrop-blur-[20px] bg-white/10 border border-white/20 rounded-3xl shadow-2xl h-full flex flex-col relative">
        {/* Header */}
        <div
          className="flex-shrink-0 h-10 cursor-move rounded-t-3xl flex items-center justify-between px-6"onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-3">
            <i className="fas fa-cog text-white/80 text-lg"></i>
            <h2 className="text-xl font-semibold text-white">Settings</h2>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-48 bg-black/20 border-r border-white/10 p-4 space-y-2">
            {tabs.map((tab) =>(
              <button
                key={tab.id}
                onClick={() =>setActiveTab(tab.id as typeof activeTab)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition ${
                  activeTab === tab.id
                    ? 'bg-white/20 text-white': 'text-white/60 hover:bg-white/10 hover:text-white'}`}
              >
                <i className={`fas ${tab.icon}`}></i>
                <span className="text-sm font-medium">{tab.label}</span>
              </button>))}
          </div>

          {/* Settings Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {activeTab === 'profile'&& (
              <>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white text-lg font-semibold">Profile</h3>
                    {profileData && !isEditing && (
                      <button
                        onClick={startEditing}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition flex items-center gap-2">
                        <i className="fas fa-pencil-alt text-xs"></i>Chỉnh sửa
                      </button>)}
                  </div>
                  
                  {/* Success Message */}
                  {saveSuccess && (
                    <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-xl flex items-center gap-2 text-green-400">
                      <i className="fas fa-check-circle"></i>
                      <span className="text-sm">Đã lưu thay đổi thành công!</span>
                    </div>)}

                  {/* Error Message */}
                  {saveError && (
                    <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-400">
                      <i className="fas fa-exclamation-circle"></i>
                      <span className="text-sm">{saveError}</span>
                    </div>)}
                  
                  {profileLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <i className="fas fa-spinner fa-spin text-white/60 text-2xl"></i>
                    </div>) : profileData ? (
                    <div className="space-y-6">
                      {/* Hidden file input */}
                      <input
                        ref={fileInputRef}
                        type="file"accept="image/*"onChange={handleAvatarSelect}
                        className="hidden"/>

                      {/* Avatar & Basic Info */}
                      <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                        <div className="relative group">
                          <img
                            src={profileData.avatarUrl}
                            alt="Avatar"className="w-20 h-20 rounded-full object-cover border-2 border-white/20 transition group-hover:border-pink-500/50"/>
                          {/* Avatar overlay button */}
                          <button
                            onClick={() =>fileInputRef.current?.click()}
                            disabled={uploadingAvatar}
                            className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer disabled:cursor-wait">
                            {uploadingAvatar ? (
                              <i className="fas fa-spinner fa-spin text-white"></i>) : (
                              <i className="fas fa-camera text-white"></i>)}
                          </button>
                          {/* Edit badge */}
                          <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-pink-500 rounded-full flex items-center justify-center border-2 border-gray-900 shadow-lg">
                            <i className="fas fa-pencil-alt text-white text-xs"></i>
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="text-white font-semibold text-lg">{profileData.fullName || 'Chưa cập nhật'}</div>
                          <div className="text-white/60 text-sm">{profileData.studentCode}</div>
                          <div className="text-white/50 text-xs mt-1">{profileData.major} • {profileData.className}</div>
                          <button
                            onClick={() =>fileInputRef.current?.click()}
                            disabled={uploadingAvatar}
                            className="mt-2 text-xs text-pink-400 hover:text-pink-300 transition flex items-center gap-1 disabled:opacity-50">
                            <i className="fas fa-camera"></i>
                            {uploadingAvatar ? 'Đang tải...': 'Đổi ảnh đại diện'}
                          </button>
                        </div>
                      </div>

                      {/* Edit Mode */}
                      {isEditing ? (
                        <div className="space-y-4">
                          <div className="text-white/70 text-xs font-medium uppercase tracking-wider">Chỉnh sửa thông tin</div>
                          
                          {/* Full Name */}
                          <div>
                            <label className="text-white/60 text-xs mb-1.5 block">Họ và tên <span className="text-pink-400">*</span></label>
                            <input
                              type="text"value={editForm.fullName || ''}
                              onChange={(e) =>setEditForm({ ...editForm, fullName: e.target.value })}
                              className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50"placeholder="Nhập họ và tên"/>
                          </div>

                          {/* Phone */}
                          <div>
                            <label className="text-white/60 text-xs mb-1.5 block">Số điện thoại</label>
                            <input
                              type="tel"value={editForm.phone || ''}
                              onChange={(e) =>setEditForm({ ...editForm, phone: e.target.value })}
                              className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50"placeholder="Nhập số điện thoại"/>
                          </div>

                          {/* Date of Birth & Gender */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-white/60 text-xs mb-1.5 block">Ngày sinh</label>
                              <input
                                type="date"value={editForm.dateOfBirthRaw || ''}
                                onChange={(e) =>setEditForm({ ...editForm, dateOfBirthRaw: e.target.value })}
                                className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50"style={{ colorScheme: 'dark'}}
                              />
                            </div>
                            <div>
                              <label className="text-white/60 text-xs mb-1.5 block">Giới tính</label>
                              <select
                                value={editForm.gender || ''}
                                onChange={(e) =>setEditForm({ ...editForm, gender: e.target.value })}
                                className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50">
                                <option value=""className="bg-gray-800">-- Chọn --</option>
                                <option value="Nam"className="bg-gray-800">Nam</option>
                                <option value="Nữ"className="bg-gray-800">Nữ</option>
                                <option value="Khác"className="bg-gray-800">Khác</option>
                              </select>
                            </div>
                          </div>

                          {/* Nationality */}
                          <div>
                            <label className="text-white/60 text-xs mb-1.5 block">Quốc tịch</label>
                            <input
                              type="text"value={editForm.nationality || ''}
                              onChange={(e) =>setEditForm({ ...editForm, nationality: e.target.value })}
                              className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50"placeholder="Nhập quốc tịch"/>
                          </div>

                          {/* Address */}
                          <div>
                            <label className="text-white/60 text-xs mb-1.5 block">Địa chỉ</label>
                            <textarea
                              rows={2}
                              value={editForm.address || ''}
                              onChange={(e) =>setEditForm({ ...editForm, address: e.target.value })}
                              className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 resize-none"placeholder="Nhập địa chỉ"/>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-3 pt-2">
                            <button
                              onClick={cancelEditing}
                              disabled={saving}
                              className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition disabled:opacity-50">Hủy
                            </button>
                            <button
                              onClick={saveProfile}
                              disabled={saving || !editForm.fullName}
                              className="flex-1 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-medium rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2">
                              {saving ? (
                                <>
                                  <i className="fas fa-spinner fa-spin"></i>Đang lưu...
                                </>) : (
                                <>
                                  <i className="fas fa-save"></i>Lưu thay đổi
                                </>)}
                            </button>
                          </div>
                        </div>) : (
                        <>
                          {/* View Mode - Personal Information */}
                          <div className="space-y-3">
                            <div className="text-white/70 text-xs font-medium uppercase tracking-wider">Thông tin cá nhân</div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div className="p-3 bg-white/5 rounded-xl">
                                <div className="text-white/50 text-xs mb-1">Họ và tên</div>
                                <div className="text-white text-sm">{profileData.fullName || '—'}</div>
                              </div>
                              <div className="p-3 bg-white/5 rounded-xl">
                                <div className="text-white/50 text-xs mb-1">Ngày sinh</div>
                                <div className="text-white text-sm">{profileData.dateOfBirth || '—'}</div>
                              </div>
                              <div className="p-3 bg-white/5 rounded-xl">
                                <div className="text-white/50 text-xs mb-1">Giới tính</div>
                                <div className="text-white text-sm">{profileData.gender || '—'}</div>
                              </div>
                              <div className="p-3 bg-white/5 rounded-xl">
                                <div className="text-white/50 text-xs mb-1">Quốc tịch</div>
                                <div className="text-white text-sm">{profileData.nationality || '—'}</div>
                              </div>
                            </div>
                          </div>

                          {/* View Mode - Contact Information */}
                          <div className="space-y-3">
                            <div className="text-white/70 text-xs font-medium uppercase tracking-wider">Thông tin liên hệ</div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                                <i className="fas fa-envelope text-white/40 w-5"></i>
                                <div>
                                  <div className="text-white/50 text-xs">Email</div>
                                  <div className="text-white text-sm">{profileData.email || '—'}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                                <i className="fas fa-phone text-white/40 w-5"></i>
                                <div>
                                  <div className="text-white/50 text-xs">Số điện thoại</div>
                                  <div className="text-white text-sm">{profileData.phone || '—'}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                                <i className="fas fa-map-marker-alt text-white/40 w-5"></i>
                                <div>
                                  <div className="text-white/50 text-xs">Địa chỉ</div>
                                  <div className="text-white text-sm">{profileData.address || '—'}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </>)}
                    </div>) : (
                    <div className="text-center py-12 text-white/50">
                      <i className="fas fa-user-slash text-4xl mb-3"></i>
                      <p>Không thể tải thông tin profile</p>
                      <button
                        onClick={loadProfile}
                        className="mt-3 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition">Thử lại
                      </button>
                    </div>)}
                </div>
              </>)}

            {activeTab === 'general'&& (
              <>
                <div>
                  <h3 className="text-white text-lg font-semibold mb-4">General Settings</h3>
                  
                  {/* Language Selection */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-white/70 text-sm font-medium mb-2 block">Language</label>
                      <select
                        value={language}
                        onChange={(e) =>setLanguage(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-white/30">
                        <option value="vi"className="bg-gray-800">Tiếng Việt</option>
                        <option value="en"className="bg-gray-800">English</option>
                        <option value="ja"className="bg-gray-800">日本語</option>
                        <option value="ko"className="bg-gray-800">한국어</option>
                      </select>
                    </div>

                    {/* Auto Save */}
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition">
                      <div className="flex items-center gap-3">
                        <i className="fas fa-save text-white/60"></i>
                        <div>
                          <div className="text-white font-medium text-sm">Auto Save</div>
                          <div className="text-white/50 text-xs">Automatically save your progress</div>
                        </div>
                      </div>
                      <button
                        onClick={() =>setAutoSave(!autoSave)}
                        className={`relative w-12 h-6 rounded-full transition ${
                          autoSave ? 'bg-pink-500': 'bg-white/20'}`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            autoSave ? 'translate-x-7': 'translate-x-1'}`}
                        />
                      </button>
                    </div>

                    {/* Sound Effects */}
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition">
                      <div className="flex items-center gap-3">
                        <i className="fas fa-volume-up text-white/60"></i>
                        <div>
                          <div className="text-white font-medium text-sm">Sound Effects</div>
                          <div className="text-white/50 text-xs">Play sounds for interactions</div>
                        </div>
                      </div>
                      <button
                        onClick={() =>setSoundEffects(!soundEffects)}
                        className={`relative w-12 h-6 rounded-full transition ${
                          soundEffects ? 'bg-pink-500': 'bg-white/20'}`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            soundEffects ? 'translate-x-7': 'translate-x-1'}`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </>)}

            {activeTab === 'appearance'&& (
              <>
                <div>
                  <h3 className="text-white text-lg font-semibold mb-4">Appearance</h3>
                  
                  <div className="space-y-4">
                    {/* Dark Mode */}
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition">
                      <div className="flex items-center gap-3">
                        <i className="fas fa-moon text-white/60"></i>
                        <div>
                          <div className="text-white font-medium text-sm">Dark Mode</div>
                          <div className="text-white/50 text-xs">Use dark theme</div>
                        </div>
                      </div>
                      <button
                        onClick={() =>setDarkMode(!darkMode)}
                        className={`relative w-12 h-6 rounded-full transition ${
                          darkMode ? 'bg-pink-500': 'bg-white/20'}`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            darkMode ? 'translate-x-7': 'translate-x-1'}`}
                        />
                      </button>
                    </div>

                    {/* Show Timer */}
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition">
                      <div className="flex items-center gap-3">
                        <i className="fas fa-clock text-white/60"></i>
                        <div>
                          <div className="text-white font-medium text-sm">Show Clock</div>
                          <div className="text-white/50 text-xs">Display clock on screen</div>
                        </div>
                      </div>
                      <button
                        onClick={() =>setShowTimer(!showTimer)}
                        className={`relative w-12 h-6 rounded-full transition ${
                          showTimer ? 'bg-pink-500': 'bg-white/20'}`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            showTimer ? 'translate-x-7': 'translate-x-1'}`}
                        />
                      </button>
                    </div>

                    {/* Theme Presets */}
                    <div>
                      <label className="text-white/70 text-sm font-medium mb-3 block">Theme Presets</label>
                      <div className="grid grid-cols-2 gap-3">
                        {['Minimal', 'Cozy', 'Focus', 'Nature'].map((preset) =>(
                          <button
                            key={preset}
                            className="p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 hover:border-white/30 transition">
                            <div className="text-white text-sm font-medium">{preset}</div>
                          </button>))}
                      </div>
                    </div>
                  </div>
                </div>
              </>)}

            {activeTab === 'notifications'&& (
              <>
                <div>
                  <h3 className="text-white text-lg font-semibold mb-4">Notifications</h3>
                  
                  <div className="space-y-4">
                    {/* Enable Notifications */}
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition">
                      <div className="flex items-center gap-3">
                        <i className="fas fa-bell text-white/60"></i>
                        <div>
                          <div className="text-white font-medium text-sm">Enable Notifications</div>
                          <div className="text-white/50 text-xs">Receive app notifications</div>
                        </div>
                      </div>
                      <button
                        onClick={() =>setNotifications(!notifications)}
                        className={`relative w-12 h-6 rounded-full transition ${
                          notifications ? 'bg-pink-500': 'bg-white/20'}`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            notifications ? 'translate-x-7': 'translate-x-1'}`}
                        />
                      </button>
                    </div>

                    {/* Pomodoro Notifications */}
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition">
                      <div className="flex items-center gap-3">
                        <i className="fas fa-stopwatch text-white/60"></i>
                        <div>
                          <div className="text-white font-medium text-sm">Pomodoro Alerts</div>
                          <div className="text-white/50 text-xs">Get notified when timer ends</div>
                        </div>
                      </div>
                      <button
                        onClick={() =>setPomodoroNotif(!pomodoroNotif)}
                        className={`relative w-12 h-6 rounded-full transition ${
                          pomodoroNotif ? 'bg-pink-500': 'bg-white/20'}`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            pomodoroNotif ? 'translate-x-7': 'translate-x-1'}`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </>)}

            {activeTab === 'privacy'&& (
              <>
                <div>
                  <h3 className="text-white text-lg font-semibold mb-4">Privacy & Security</h3>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                      <div className="flex items-center gap-3 mb-3">
                        <i className="fas fa-database text-white/60"></i>
                        <div className="text-white font-medium text-sm">Data Storage</div>
                      </div>
                      <p className="text-white/50 text-xs mb-3">Your data is stored locally on your device for privacy and offline access.
                      </p>
                      <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-lg transition">Clear All Data
                      </button>
                    </div>

                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                      <div className="flex items-center gap-3 mb-3">
                        <i className="fas fa-download text-white/60"></i>
                        <div className="text-white font-medium text-sm">Export Data</div>
                      </div>
                      <p className="text-white/50 text-xs mb-3">Download your journal entries and study logs.
                      </p>
                      <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-lg transition">Export as JSON
                      </button>
                    </div>
                  </div>
                </div>
              </>)}

            {/* Save Button */}
            <div className="pt-4 border-t border-white/10">
              <button
                onClick={onClose}
                className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold rounded-lg transition">
                <i className="fas fa-check mr-2"></i>Save Changes
              </button>
            </div>
          </div>
        </div>

        {/* Resize Handle */}
        <div
          className="absolute w-3 h-3 bg-white/30 border-2 border-white/60 rounded-full cursor-nwse-resize bottom-[-6px] right-[-6px] z-10 hover:bg-white/50"onMouseDown={handleResize}
        />
      </div>

      {/* Image Crop Modal */}
      <ImageCropModal
        isOpen={cropModalOpen}
        imageSrc={selectedImage}
        onClose={handleCropCancel}
        onCropComplete={handleCropComplete}
      />
    </div>);
}
