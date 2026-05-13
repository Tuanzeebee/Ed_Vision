// Admin menu configuration
export interface MenuItemConfig {
  label: string;
  to?: string;
  iconKey: string;
  children?: MenuItemConfig[];
}

export const adminMenu: MenuItemConfig[] = [
  {
    label: "Trang chủ",
    to: "/admin/dashboard",
    iconKey: "home"
  },
  {
    label: "Quản lý",
    iconKey: "cog",
    children: [
      { label: "Tài khoản & Vai trò", to: "/admin/users", iconKey: "users" },
      { label: "Quản lý Khảo sát", to: "/admin/classes", iconKey: "poll" },
    ]
  },
  {
    label: "Sinh viên",
    iconKey: "studentMenu",
    children: [
      { label: "Danh sách Sinh viên", to: "/admin/students", iconKey: "student" },
    ]
  },
  {
    label: "Dữ liệu & Báo cáo",
    iconKey: "chart",
    children: [
      { label: "Thống kê Tổng quát", to: "/admin/reports/learning", iconKey: "bar" },
      { label: "Dashboard Chứng chỉ", to: "/admin/dashboard/certificate", iconKey: "certificate" },
      { label: "Hành vi Sử dụng", to: "/admin/dashboard/usage-behavior", iconKey: "activity" },
      { label: "Hiệu quả Chương trình", to: "/admin/program-effectiveness", iconKey: "award" },
    ]
  },
  {
    label: "Quản lý Hệ thống",
    iconKey: "server",
    children: [
      { label: "Quản lý Thông báo", to: "/admin/notifications", iconKey: "bell" },
      { label: "Phân quyền", to: "/admin/permissions", iconKey: "shield" },
    ]
  }
];

export type IconKey = "home" | "cog" | "users" | "student" | "teacher" | "poll" | "chart" | "bar" | "server" | "bell" | "shield" | "certificate" | "activity" | "studentMenu" | "award";