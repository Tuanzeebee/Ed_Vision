import React, { useState, useMemo, useEffect, useCallback } from "react"
import { useNavigate, useLocation } from "react-router-dom"

// Icon components using Font Awesome classes  
const HomeIcon = ({ isActive = false }: { isActive?: boolean }) => <i className={`fas fa-home ${isActive ? 'text-blue-600' : 'text-blue-600'}`}></i>
const CogIcon = ({ isActive = false }: { isActive?: boolean }) => <i className={`fas fa-cogs ${isActive ? 'text-blue-600' : 'text-gray-400'}`}></i>
const UsersIcon = ({ isActive = false }: { isActive?: boolean }) => <i className={`fas fa-users-cog ${isActive ? 'text-blue-600' : 'text-gray-400'}`}></i>
const UserGraduateIcon = ({ isActive = false }: { isActive?: boolean }) => <i className={`fas fa-user-graduate ${isActive ? 'text-blue-600' : 'text-gray-400'}`}></i>
const ChalkboardTeacherIcon = ({ isActive = false }: { isActive?: boolean }) => <i className={`fas fa-chalkboard-teacher ${isActive ? 'text-blue-600' : 'text-gray-400'}`}></i>
const PollIcon = ({ isActive = false }: { isActive?: boolean }) => <i className={`fas fa-poll ${isActive ? 'text-blue-600' : 'text-gray-400'}`}></i>
const ChartLineIcon = ({ isActive = false }: { isActive?: boolean }) => <i className={`fas fa-chart-line ${isActive ? 'text-blue-600' : 'text-gray-400'}`}></i>
const ChartBarIcon = ({ isActive = false }: { isActive?: boolean }) => <i className={`fas fa-chart-bar ${isActive ? 'text-blue-600' : 'text-gray-400'}`}></i>
const RobotIcon = ({ isActive = false }: { isActive?: boolean }) => <i className={`fas fa-robot ${isActive ? 'text-blue-600' : 'text-gray-400'}`}></i>
const ServerIcon = ({ isActive = false }: { isActive?: boolean }) => <i className={`fas fa-server ${isActive ? 'text-blue-600' : 'text-gray-400'}`}></i>
const BellIcon = ({ isActive = false }: { isActive?: boolean }) => <i className={`fas fa-bell ${isActive ? 'text-blue-600' : 'text-gray-400'}`}></i>
const CheckCircleIcon = ({ isActive = false }: { isActive?: boolean }) => <i className={`fas fa-check-circle ${isActive ? 'text-blue-600' : 'text-gray-400'}`}></i>
const UserShieldIcon = ({ isActive = false }: { isActive?: boolean }) => <i className={`fas fa-user-shield ${isActive ? 'text-blue-600' : 'text-gray-400'}`}></i>
const ChevronDownIcon = () => <i className="fas fa-chevron-down text-xs"></i>
const GraduationCapIcon = () => <i className="fas fa-graduation-cap text-white text-lg"></i>

interface MenuItem {
  icon: React.ComponentType<{ isActive?: boolean }>;
  label: string;
  href?: string;
  children?: MenuItem[];
  onClick?: () => void;
}

interface AdminSidebarProps {
  activePage?: string;
  onNavigate?: (href: string) => void;
}

export default function AdminSidebar({ activePage, onNavigate }: AdminSidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({})

  // Sử dụng activePage từ props hoặc lấy từ current location
  const currentPage = activePage || location.pathname

  const handleNavigation = useCallback((path: string) => {
    if (onNavigate) {
      onNavigate(path)
    } else {
      // Fallback navigation nếu không có onNavigate
      navigate(path)
    }
  }, [navigate, onNavigate])

  const toggleDropdown = (dropdownKey: string) => {
    setOpenDropdowns(prev => {
      // Kiểm tra xem dropdown này có children active không
      const menuItem = menuItems.find(item => item.label === dropdownKey)
      const hasActiveChild = menuItem?.children?.some(child => 
        child.href && (
          currentPage === child.href || 
          currentPage.startsWith(child.href + '/')
        )
      )
      
      // Nếu có active child, luôn giữ mở
      if (hasActiveChild) {
        return {
          ...prev,
          [dropdownKey]: true
        }
      }
      
      // Nếu không có active child, toggle bình thường
      return {
        ...prev,
        [dropdownKey]: !prev[dropdownKey]
      }
    })
  }

  const menuItems: MenuItem[] = useMemo(() => [
    {
      icon: HomeIcon,
      label: "Trang chủ",
      href: "/admin/overview",
      onClick: () => handleNavigation("/admin/overview")
    },
    {
      icon: CogIcon,
      label: "Quản lý",
      children: [
        {
          icon: UsersIcon,
          label: "Tài khoản & Vai trò",
          href: "/admin/users",
          onClick: () => handleNavigation("/admin/users")
        },
        {
          icon: UserGraduateIcon,
          label: "Quản lý Sinh viên",
          href: "/admin/students",
          onClick: () => handleNavigation("/admin/students")
        },
        {
          icon: ChalkboardTeacherIcon,
          label: "Quản lý Giảng viên",
          href: "/admin/teachers",
          onClick: () => handleNavigation("/admin/teachers")
        },
        {
          icon: PollIcon,
          label: "Quản lý Khảo sát",
          href: "/admin/classes",
          onClick: () => handleNavigation("/admin/classes")
        }
      ]
    },
    {
      icon: ChartLineIcon,
      label: "Dữ liệu & Báo cáo",
      children: [
        {
          icon: ChartBarIcon,
          label: "Báo cáo Học tập",
          href: "/admin/reports/learning",
          onClick: () => handleNavigation("/admin/reports/learning")
        },
        {
          icon: ChartLineIcon,
          label: "Phân tích Hiệu suất",
          href: "/admin/analytics/performance",
          onClick: () => handleNavigation("/admin/analytics/performance")
        },
        {
          icon: RobotIcon,
          label: "AI Insights",
          href: "/admin/ai-insights",
          onClick: () => handleNavigation("/admin/ai-insights")
        }
      ]
    },
    {
      icon: ServerIcon,
      label: "Quản lý Hệ thống",
      children: [
        {
          icon: BellIcon,
          label: "Quản lý Thông báo",
          href: "/admin/notifications",
          onClick: () => handleNavigation("/admin/notifications")
        },
        {
          icon: CheckCircleIcon,
          label: "Phê duyệt Nội dung",
          href: "/admin/content-approval",
          onClick: () => handleNavigation("/admin/content-approval")
        },
        {
          icon: UserShieldIcon,
          label: "Phân quyền",
          href: "/admin/permissions",
          onClick: () => handleNavigation("/admin/permissions")
        }
      ]
    }
  ], [handleNavigation])

  // Tự động mở và giữ dropdown nếu có menu con active
  useEffect(() => {
    menuItems.forEach(item => {
      if (item.children) {
        const hasActiveChild = item.children.some(child => 
          child.href && (
            currentPage === child.href || 
            currentPage.startsWith(child.href + '/')
          )
        )
        if (hasActiveChild) {
          setOpenDropdowns(prev => ({
            ...prev,
            [item.label]: true
          }))
        }
      }
    })
  }, [currentPage, menuItems])

  const renderMenuItem = (item: MenuItem, index: number, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0
    
    // Logic active đơn giản: chỉ active menu item đúng nhất
    let isActive = false
    let hasActiveChild = false
    
    if (hasChildren) {
      // Với parent menu: kiểm tra xem có child nào active không
      hasActiveChild = item.children?.some(child => 
        child.href && (
          currentPage === child.href || 
          currentPage.startsWith(child.href + '/')
        )
      ) || false
      
      // Parent chỉ active khi có child active VÀ bản thân không phải là Trang chủ
      isActive = hasActiveChild && item.label !== "Trang chủ"
    } else {
      // Với leaf menu: exact match hoặc sub-path
      isActive = Boolean(item.href === currentPage || 
                (item.href && currentPage.startsWith(item.href + '/')))
    }
    
    // Special case: Trang chủ chỉ active khi exact match với /admin/overview
    if (item.label === "Trang chủ") {
      isActive = currentPage === "/admin/overview"
    }
    // Dropdown sẽ mở nếu được toggle hoặc có child active
    const isDropdownOpen = openDropdowns[item.label] || hasActiveChild

    if (hasChildren) {
      return (
        <div key={index} className="mb-1">
          <button
            onClick={() => toggleDropdown(item.label)}
            className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors cursor-pointer ${
              level > 0 ? 'ml-4' : ''
            } ${isActive || hasActiveChild ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
          >
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <item.icon isActive={isActive || hasActiveChild} />
              <span className="truncate">{item.label}</span>
            </div>
            <ChevronDownIcon />
          </button>
          {isDropdownOpen && item.children && (
            <div className="mt-1">
              {item.children.map((child, childIndex) => 
                renderMenuItem(child, childIndex, level + 1)
              )}
            </div>
          )}
        </div>
      )
    }

    return (
      <div key={index} className="mb-1">
        <button
          onClick={item.onClick}
          className={`w-full flex items-center px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors cursor-pointer ${
            level > 0 ? 'ml-4' : ''
          } ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
        >
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <item.icon isActive={!!isActive} />
            <span className="truncate">{item.label}</span>
          </div>
        </button>
      </div>
    )
  }

  return (
    <div className="w-64 bg-white h-full border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <GraduationCapIcon />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Predica</h1>
            <p className="text-xs text-gray-500">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {menuItems.map((item, index) => renderMenuItem(item, index))}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          Version 1.0.0
        </div>
      </div>
    </div>
  )
}