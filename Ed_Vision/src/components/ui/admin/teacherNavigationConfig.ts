// Navigation tabs configuration for teacher pages
export const teacherNavigationTabs = [
  { 
    label: "Thông tin cá nhân", 
    path: "", // Base teacher detail path
    active: false 
  },
  { 
    label: "Môn học giảng dạy", 
    path: "/subjects",
    active: false 
  },
  { 
    label: "Đánh giá giảng dạy", 
    path: "/ratings",
    active: false 
  },
  { 
    label: "Hiệu suất giảng viên", 
    path: "/performance",
    active: false 
  },
  { 
    label: "Lịch sử hỗ trợ", 
    path: "/support-history",
    active: false 
  },
  { 
    label: "Lịch tư vấn", 
    path: "/schedule",
    active: false 
  }
];

export type TeacherNavigationTab = typeof teacherNavigationTabs[0];