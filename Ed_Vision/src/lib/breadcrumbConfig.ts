// Breadcrumb configuration mapping routes to translation keys and parent routes
export const breadcrumbConfig: Record<string, {
  labelKey: string; // Translation key instead of hardcoded label
  icon?: string;
  parent?: string;
}> = {
  '/admin/dashboard': {
    labelKey: 'admin:breadcrumb.home',
    icon: 'fas fa-home text-blue-600'
  },
  '/admin/overview': {
    labelKey: 'admin:breadcrumb.home',
    icon: 'fas fa-home text-blue-600'
  },
  '/admin/teachers': {
    labelKey: 'admin:breadcrumb.teachers',
    parent: '/admin/dashboard'
  },
  '/admin/students': {
    labelKey: 'admin:breadcrumb.students',
    parent: '/admin/dashboard'
  },
  '/admin/classes': {
    labelKey: 'admin:breadcrumb.surveys',
    parent: '/admin/dashboard'
  },
  '/admin/questions': {
    labelKey: 'admin:breadcrumb.questions',
    parent: '/admin/dashboard'
  },
  '/admin/questions/add': {
    labelKey: 'admin:breadcrumb.addQuestion',
    parent: '/admin/questions'
  },
  // Teacher detail pages
  '/admin/teachers/:teacherId': {
    labelKey: 'admin:breadcrumb.personalInfo',
    parent: '/admin/teachers'
  },
  '/admin/teachers/:teacherId/subjects': {
    labelKey: 'admin:breadcrumb.subjects',
    parent: '/admin/teachers'
  },
  '/admin/teachers/:teacherId/ratings': {
    labelKey: 'admin:breadcrumb.ratings',
    parent: '/admin/teachers'
  },
  '/admin/teachers/:teacherId/performance': {
    labelKey: 'admin:breadcrumb.performance',
    parent: '/admin/teachers'
  },
  '/admin/teachers/:teacherId/schedule': {
    labelKey: 'admin:breadcrumb.schedule',
    parent: '/admin/teachers'
  },
  '/admin/teachers/:teacherId/support-history': {
    labelKey: 'admin:breadcrumb.supportHistory',
    parent: '/admin/teachers'
  },
  // Student pages
  '/admin/students/list': {
    labelKey: 'admin:breadcrumb.studentList',
    parent: '/admin/students'
  },
  '/admin/students/:studentId': {
    labelKey: 'admin:breadcrumb.studentDetail',
    parent: '/admin/students/list'
  },
  // Account management
  '/admin/users': {
    labelKey: 'admin:breadcrumb.accountsRoles',
    parent: '/admin/dashboard'
  },
  '/admin/accounts': {
    labelKey: 'admin:breadcrumb.accountsRoles',
    parent: '/admin/dashboard'
  },
  '/admin/account-management': {
    labelKey: 'admin:breadcrumb.accountsRoles',
    parent: '/admin/dashboard'
  },
  '/admin/accounts/add': {
    labelKey: 'admin:breadcrumb.addAccount',
    parent: '/admin/users'
  },
  '/admin/accounts/:id': {
    labelKey: 'admin:breadcrumb.accountDetail',
    parent: '/admin/accounts'
  },
  // Reports and analytics
  '/admin/reports/learning': {
    labelKey: 'admin:breadcrumb.generalStats',
    parent: '/admin/dashboard'
  },
  '/admin/permissions': {
    labelKey: 'admin:breadcrumb.permissions',
    parent: '/admin/dashboard'
  },
  '/admin/notifications': {
    labelKey: 'admin:breadcrumb.notifications',
    parent: '/admin/dashboard'
  },
  '/admin/role-permissions': {
    labelKey: 'admin:breadcrumb.permissions',
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