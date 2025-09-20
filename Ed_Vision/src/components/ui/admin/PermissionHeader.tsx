import { useNavigate } from "react-router-dom";

interface PermissionHeaderProps {
  activeTab: 'account' | 'role';
  onUndo?: () => void;
  onExportConfig?: () => void;
  onSaveChanges?: () => void;
}

export default function PermissionHeader({ 
  activeTab, 
  onUndo, 
  onExportConfig, 
  onSaveChanges 
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
    </>
  );
}