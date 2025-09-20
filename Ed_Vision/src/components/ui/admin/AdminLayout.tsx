import AdminSidebar from "./AdminSidebar";
import AutoBreadcrumb from "./AutoBreadcrumb";
import { useLocation } from "react-router-dom";

// Icon components using Font Awesome classes
const BellIcon = () => <i className="fas fa-bell text-gray-400"></i>
const ChevronDownIcon = () => <i className="fas fa-chevron-down text-xs"></i>

interface AdminLayoutProps {
  children: React.ReactNode;
  activePage?: string;
  onNavigate?: (href: string) => void;
}

export default function AdminLayout({ 
  children, 
  activePage, 
  onNavigate
}: AdminLayoutProps) {
  const location = useLocation()
  
  // Sử dụng activePage từ props hoặc lấy từ current location
  const currentActivePage = activePage || location.pathname
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar activePage={currentActivePage} onNavigate={onNavigate} />

      {/* Main Content Area */}
      <div className="flex-1">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-end">
            <div className="flex items-center space-x-4">
              {/* Notification */}
              <div className="relative">
                <BellIcon />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
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
                  className="w-10 h-10 rounded-full border-2 border-gray-200"
                />
                <ChevronDownIcon />
              </div>
            </div>
          </div>
        </div>

        {/* Auto Breadcrumb */}
        <AutoBreadcrumb />

        {/* Main Content */}
        <div className="p-6 bg-gray-50 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}