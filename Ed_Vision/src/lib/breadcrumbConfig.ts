// Breadcrumb configuration mapping routes to labels and parent routes
export const breadcrumbConfig: Record<string, {
  label: string;
  icon?: string;
  parent?: string;
}> = {
  '/admin/dashboard': {
    label: 'Trang chủ',
    icon: 'fas fa-home text-blue-600'
  },
  '/admin/overview': {
    label: 'Trang chủ', 
    icon: 'fas fa-home text-blue-600'
  },
  '/admin/teachers': {
    label: 'Quản lý Giảng viên/Cố Vấn',
    parent: '/admin/dashboard'
  },
  '/admin/students': {
    label: 'Quản lý Sinh viên',
    parent: '/admin/dashboard'
  },
  '/admin/classes': {
    label: 'Quản lý Khảo sát',
    parent: '/admin/dashboard'
  },
  '/admin/questions': {
    label: 'Quản lý Câu hỏi Khảo sát',
    parent: '/admin/dashboard'
  },
  '/admin/questions/add': {
    label: 'Thêm câu hỏi',
    parent: '/admin/questions'
  },
  // Teacher detail pages
  '/admin/teachers/:teacherId': {
    label: 'Thông tin cá nhân',
    parent: '/admin/teachers'
  },
  '/admin/teachers/:teacherId/subjects': {
    label: 'Môn học giảng dạy',
    parent: '/admin/teachers'
  },
  '/admin/teachers/:teacherId/ratings': {
    label: 'Đánh giá giảng dạy',
    parent: '/admin/teachers'
  },
  '/admin/teachers/:teacherId/performance': {
    label: 'Hiệu suất giảng viên',
    parent: '/admin/teachers'
  },
  '/admin/teachers/:teacherId/schedule': {
    label: 'Lịch tư vấn',
    parent: '/admin/teachers'
  },
  '/admin/teachers/:teacherId/support-history': {
    label: 'Lịch sử hỗ trợ',
    parent: '/admin/teachers'
  },
  // Student pages
  '/admin/students/list': {
    label: 'Danh sách sinh viên',
    parent: '/admin/students'
  },
  '/admin/students/:studentId': {
    label: 'Chi tiết sinh viên',
    parent: '/admin/students/list'
  },
  // Account management
  '/admin/users': {
    label: 'Quản lý Tài khoản & Vai trò',
    parent: '/admin/dashboard'
  },
  '/admin/accounts': {
    label: 'Quản lý Tài khoản & Vai trò',
    parent: '/admin/dashboard'
  },
  '/admin/account-management': {
    label: 'Quản lý Tài khoản & Vai trò',
    parent: '/admin/dashboard'
  },
  '/admin/accounts/add': {
    label: 'Thêm mới tài khoản',
    parent: '/admin/users'
  },
  '/admin/accounts/:id': {
    label: 'Chi tiết tài khoản',
    parent: '/admin/accounts'
  },
  // Reports and analytics
  '/admin/reports/learning': {
    label: 'Thống kê Tổng quát',
    parent: '/admin/dashboard'
  },
  '/admin/analytics/performance': {
    label: 'Báo cáo Lãnh đạo',
    parent: '/admin/dashboard'
  },
  '/admin/leadership-reports': {
    label: 'Báo cáo Lãnh đạo',
    parent: '/admin/dashboard'
  },
  '/admin/ai-insights': {
    label: 'Kết quả Học máy',
    parent: '/admin/dashboard'
  },
  '/admin/permissions': {
    label: 'Phân quyền',
    parent: '/admin/dashboard'
  },
  '/admin/notifications': {
    label: 'Quản lý Thông báo & Phản hồi',
    parent: '/admin/dashboard'
  },
  '/admin/content-approval': {
    label: 'Phê duyệt Nội dung',
    parent: '/admin/dashboard'
  },
  '/admin/role-permissions': {
    label: 'Phân quyền',
    parent: '/admin/dashboard'
  }
};

// Function to match dynamic routes (with :id parameters)
export function matchRoute(currentPath: string, configPath: string): boolean {
  const currentSegments = currentPath.split('/');
  const configSegments = configPath.split('/');
  
  if (currentSegments.length !== configSegments.length) {
    return false;
  }
  
  return configSegments.every((segment, index) => {
    return segment.startsWith(':') || segment === currentSegments[index];
  });
}

// Function to get breadcrumb configuration for current path
export function getBreadcrumbConfig(pathname: string) {
  // First try exact match
  if (breadcrumbConfig[pathname]) {
    return { path: pathname, config: breadcrumbConfig[pathname] };
  }
  
  // Then try dynamic route matching
  for (const [configPath, config] of Object.entries(breadcrumbConfig)) {
    if (matchRoute(pathname, configPath)) {
      return { path: configPath, config };
    }
  }
  
  return null;
}