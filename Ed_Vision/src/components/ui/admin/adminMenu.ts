// Admin menu configuration - single source of truth
export interface MenuItemData {
  label: string;
  to?: string;
  iconKey: string;
  children?: MenuItemData[];
}

export const adminMenu: MenuItemData[] = [
  { 
    label: "Trang chủ", 
    to: "/admin/dashboard", 
    iconKey: "home"},
  {
    label: "Quản lý", 
    iconKey: "cog", 
    children: [
      { label: "Tài khoản & Vai trò", to: "/admin/users", iconKey: "users"},
      { label: "Quản lý Sinh viên", to: "/admin/students", iconKey: "student"},
      { label: "Quản lý Giảng viên/Cố Vấn", to: "/admin/teachers", iconKey: "teacher"},
      { label: "Quản lý Khảo sát", to: "/admin/classes", iconKey: "poll"},
    ]
  },
  {
    label: "Dữ liệu & Báo cáo", 
    iconKey: "chart", 
    children: [
      { label: "Thống kê Tổng quát", to: "/admin/reports/learning", iconKey: "bar"},
      { label: "Báo cáo Lãnh đạo", to: "/admin/analytics/performance", iconKey: "line"},
      { label: "Kết quả Học máy", to: "/admin/ai-insights", iconKey: "robot"},
    ]
  },
  {
    label: "Quản lý Hệ thống", 
    iconKey: "server", 
    children: [
      { label: "Quản lý Thông báo", to: "/admin/notifications", iconKey: "bell"},
      { label: "Phê duyệt Nội dung", to: "/admin/content-approval", iconKey: "check"},
      { label: "Phân quyền", to: "/admin/permissions", iconKey: "shield"},
    ]
  }
];