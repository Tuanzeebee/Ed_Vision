/**
 * Utility functions to map between route paths and permission keys
 * Routes use kebab-case (/student/course-overview)
 * Permission keys use snake_case (student_course_overview)
 */

export function routeToPermissionKey(routePath: string): string {
  // Remove leading slash and replace remaining slashes and dashes with underscores
  return routePath
    .replace(/^\//, '') // Remove leading slash
    .replace(/\//g, '_') // Replace slashes with underscores
    .replace(/-/g, '_'); // Replace dashes with underscores
}

export function permissionKeyToRoute(permissionKey: string): string {
  // Split by underscore, join first two parts with slash, rest with dashes
  const parts = permissionKey.split('_');
  if (parts.length < 2) return `/${permissionKey}`;
  
  const prefix = parts[0]; // e.g., 'student', 'teacher', 'admin'
  const suffix = parts.slice(1).join('-'); // e.g., 'course-overview', 'class-management'
  
  return `/${prefix}/${suffix}`;
}

/**
 * Check if a user has permission for a specific route
 * @param userPermissions - Object with permission keys as keys and boolean values
 * @param routePath - Route path like '/student/course-overview'
 * @returns boolean
 */
export function hasRoutePermission(
  userPermissions: Record<string, boolean>,
  routePath: string
): boolean {
  const permissionKey = routeToPermissionKey(routePath);
  return !!userPermissions[permissionKey];
}

/**
 * Get all routes that a user has permission for
 * @param userPermissions - Object with permission keys as keys and boolean values
 * @returns Array of route paths
 */
export function getUserAllowedRoutes(
  userPermissions: Record<string, boolean>
): string[] {
  return Object.entries(userPermissions)
    .filter(([_, hasPermission]) => hasPermission)
    .map(([permissionKey, _]) => permissionKeyToRoute(permissionKey));
}

/**
 * Route to permission mapping for special cases
 */
export const ROUTE_PERMISSION_OVERRIDES: Record<string, string> = {
  '/admin/role-permissions': 'admin_role_permissions',
  '/admin/users': 'admin_users',
  '/admin/reports': 'admin_reports',
  '/admin/overview': 'admin_overview',
  '/teacher/reports-alerts': 'teacher_reports_alerts',
  '/student/course-overview': 'student_course_overview',
  '/student/upload-transcript': 'student_upload_transcript',
  '/student/adjust-parameters': 'student_adjust_parameters',
  '/student/academic-planning': 'student_academic_planning',
  '/student/course-detail': 'student_course_detail',
  '/teacher/class-management': 'teacher_class_management',
  '/teacher/grade-management': 'teacher_grade_management',
  '/teacher/prediction-view': 'teacher_prediction_view',
  '/teacher/progress-tracking': 'teacher_progress_tracking',
  '/parent/book-appointment': 'parent_book_appointment'
};

/**
 * Get permission key for a route, checking overrides first
 */
export function getPermissionKeyForRoute(routePath: string): string {
  // Check overrides first
  if (ROUTE_PERMISSION_OVERRIDES[routePath]) {
    return ROUTE_PERMISSION_OVERRIDES[routePath];
  }
  
  // Fall back to automatic conversion
  return routeToPermissionKey(routePath);
}