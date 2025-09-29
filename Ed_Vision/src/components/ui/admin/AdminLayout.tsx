import AdminSidebar from "./AdminSidebar";
import AutoBreadcrumb from "./AutoBreadcrumb";

// Icon components using Font Awesome classes
const BellIcon = () => <i className="fas fa-bell text-gray-400"></i>
const ChevronDownIcon = () => <i className="fas fa-chevron-down text-xs"></i>

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ 
  children
}: AdminLayoutProps) {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header - Full width */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 flex-shrink-0">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <img src="/src/assets/shared/logo_predica.jpg" alt="Predica Logo" className="h-13 w-auto object-contain"/>
          </div>

          {/* User info và notifications */}
          <div className="flex items-center space-x-4">
            {/* Notification */}
            <div className="relative">
              <BellIcon />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
            </div>
            
            {/* User Info */}
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-800">Admin</p>
                <p className="text-xs text-gray-500">Người dùng Quản trị</p>
              </div>
              <img 
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face" 
                alt="Admin" 
                className="w-8 h-8 rounded-full border-2 border-gray-200"
              />
              <ChevronDownIcon />
            </div>
          </div>
        </div>
      </div>

      {/* Content Area with Sidebar and Main */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <div className="flex-shrink-0">
          <AdminSidebar />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Auto Breadcrumb */}
          <AutoBreadcrumb />

          {/* Main Content */}
          <div className="flex-1 p-6 bg-gray-50 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}