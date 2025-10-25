import { useState, useEffect } from "react"
import { NavLink, useLocation } from "react-router-dom"
import { adminMenu } from "../../../lib/adminMenuConfig"
import { getIconComponent } from "../../../lib/adminIcons"
import type { MenuItemConfig, IconKey } from "../../../lib/adminMenuConfig"

const ChevronIcon = ({ isOpen }: { isOpen: boolean }) => (
  <i className={`fas ${isOpen ? 'fa-chevron-up' : 'fa-chevron-down'} text-xs transition-transform duration-200`}></i>
)

// Parent item component (có children)
function ParentItem({ item }: { item: MenuItemConfig }) {
  const location = useLocation()
  // Kiểm tra có child nào active không bằng cách so sánh pathname
  // Thêm logic đặc biệt cho phân quyền và question management
  const hasActiveChild = (item.children ?? []).some(child => {
    if (!child.to) return false
    
    // Xử lý đặc biệt cho phân quyền - coi cả /admin/permissions và /admin/role-permissions là active
    if (child.to === '/admin/permissions') {
      return location.pathname === '/admin/permissions' || location.pathname === '/admin/role-permissions'
    }
    
    // Xử lý đặc biệt cho account management - coi cả /admin/users, /admin/account-management và /admin/accounts/add là active
    if (child.to === '/admin/users') {
      return location.pathname === '/admin/users' || 
             location.pathname === '/admin/account-management' || 
             location.pathname === '/admin/accounts' ||
             location.pathname === '/admin/accounts/add'
    }
    
    // Xử lý đặc biệt cho khảo sát - coi cả /admin/classes, /admin/questions và /admin/add-question là active
    if (child.to === '/admin/classes') {
      return location.pathname === '/admin/classes' || 
             location.pathname === '/admin/questions' || 
             location.pathname === '/admin/add-question' ||
             location.pathname === '/admin/questions/add'
    }
    
    return location.pathname.startsWith(child.to)
  })
  
  const [open, setOpen] = useState(hasActiveChild)
  const isOpen = open

  // Cập nhật state khi hasActiveChild thay đổi (khi navigate)
  useEffect(() => {
    setOpen(hasActiveChild)
  }, [hasActiveChild])
  
  const IconComponent = getIconComponent(item.iconKey as IconKey)

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors cursor-pointer ${
          hasActiveChild ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
        }`}
      >
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <IconComponent isActive={hasActiveChild} />
          <span className="truncate">{item.label}</span>
        </div>
        <ChevronIcon isOpen={isOpen} />
      </button>

      {isOpen && item.children && (
        <div className="mt-1 ml-4">
          {item.children.map((child) => (
            <LeafItem key={child.to} item={child} />
          ))}
        </div>
      )}
    </div>
  )
}

// Leaf item component (không có children)
function LeafItem({ item }: { item: MenuItemConfig }) {
  const IconComponent = getIconComponent(item.iconKey as IconKey)
  const location = useLocation()

  if (!item.to) return null

  // Xử lý đặc biệt cho phân quyền và question management - coi các route liên quan là active
  const isActive = (() => {
    if (item.to === '/admin/permissions') {
      return location.pathname === '/admin/permissions' || location.pathname === '/admin/role-permissions'
    }
    if (item.to === '/admin/users') {
      return location.pathname === '/admin/users' || 
             location.pathname === '/admin/account-management' || 
             location.pathname === '/admin/accounts' ||
             location.pathname === '/admin/accounts/add'
    }
    if (item.to === '/admin/classes') {
      return location.pathname === '/admin/classes' || 
             location.pathname === '/admin/questions' || 
             location.pathname === '/admin/add-question' ||
             location.pathname === '/admin/questions/add'
    }
    return location.pathname === item.to || (item.to !== "/admin/overview" && location.pathname.startsWith(item.to))
  })()

  return (
    <div className="mb-1">
      <NavLink
        to={item.to}
        className={`w-full flex items-center px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors ${
          isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
        }`}
        end={item.to === "/admin/overview"} // chỉ Trang chủ cần exact match
      >
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <IconComponent isActive={isActive} />
          <span className="truncate">{item.label}</span>
        </div>
      </NavLink>
    </div>
  )
}

export default function AdminSidebar() {
  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col min-h-full">
      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-1">
          {adminMenu.map((item) =>
            item.children ? (
              <ParentItem key={item.label} item={item} />
            ) : (
              <LeafItem key={item.to ?? item.label} item={item} />
            )
          )}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 flex-shrink-0">
        <div className="text-xs text-gray-500 text-center">
          Version 1.0.0
        </div>
      </div>
    </div>
  )
}