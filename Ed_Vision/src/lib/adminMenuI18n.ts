/**
 * Helper to translate admin menu labels
 * Maps Vietnamese labels to i18n keys
 */

export const MENU_LABEL_KEYS: Record<string, string> = {
  // Main menu
  "Trang chủ": "admin:sidebar.home",
  "Quản lý": "admin:sidebar.management",
  "Dữ liệu & Báo cáo": "admin:sidebar.dataReports",
  "Quản lý Hệ thống": "admin:sidebar.systemManagement",
  
  // Quản lý submenu
  "Tài khoản & Vai trò": "admin:sidebar.accountsRoles",
  "Quản lý Sinh viên": "admin:sidebar.studentManagement",
  "Quản lý Giảng viên/Cố Vấn": "admin:sidebar.teacherManagement",
  "Quản lý Khảo sát": "admin:sidebar.surveyManagement",
  
  // Dữ liệu & Báo cáo submenu
  "Thống kê Tổng quát": "admin:sidebar.generalStats",
  "Báo cáo Lãnh đạo": "admin:sidebar.leadershipReports",
  "Kết quả Học máy": "admin:sidebar.mlResults",
  
  // Quản lý Hệ thống submenu
  "Quản lý Thông báo": "admin:sidebar.notificationManagement",
  "Phê duyệt Nội dung": "admin:sidebar.contentApproval",
  "Phân quyền": "admin:sidebar.permissions",
};

/**
 * Get translation key for a menu label
 * @param label - The Vietnamese label
 * @returns The i18n key or the original label if not found
 */
export function getMenuLabelKey(label: string): string {
  return MENU_LABEL_KEYS[label] || label;
}
