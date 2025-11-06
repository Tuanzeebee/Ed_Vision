import { useLocation } from 'react-router-dom'
import { hasRoutePermission, getPermissionKeyForRoute } from '@/lib/permissionMapper'

/**
 * Hook to check user permissions for routes and specific permission keys
 */
export function usePermissions() {
  const location = useLocation()

  // Get user data from localStorage
  const getUserData = () => {
    try {
      const raw = localStorage.getItem('user')
      if (!raw) return null
      return JSON.parse(raw)
    } catch (e) {
      return null
    }
  }

  const getUserPermissions = (): Record<string, boolean> => {
    const user = getUserData()
    return user?.permissions || {}
  }

  const getUserRole = (): string => {
    const user = getUserData()
    return (user?.roleRel?.code || user?.role || '').toString().toLowerCase()
  }

  // Check if user has permission for current route
  const hasCurrentRoutePermission = (): boolean => {
    const perms = getUserPermissions()
    return hasRoutePermission(perms, location.pathname)
  }

  // Check if user has permission for a specific route
  const hasPermissionForRoute = (routePath: string): boolean => {
    const perms = getUserPermissions()
    return hasRoutePermission(perms, routePath)
  }

  // Check if user has a specific permission key
  const hasPermission = (permissionKey: string): boolean => {
    const perms = getUserPermissions()
    return !!perms[permissionKey]
  }

  // Check if user has any of the provided roles
  const hasRole = (roles: string | string[]): boolean => {
    const userRole = getUserRole()
    if (Array.isArray(roles)) {
      return roles.map(r => r.toLowerCase()).includes(userRole)
    }
    return roles.toLowerCase() === userRole
  }

  // Get permission key for current route
  const getCurrentRoutePermissionKey = (): string => {
    return getPermissionKeyForRoute(location.pathname)
  }

  return {
    // Permission checking
    hasCurrentRoutePermission,
    hasPermissionForRoute,
    hasPermission,
    hasRole,
    
    // User data
    getUserData,
    getUserPermissions,
    getUserRole,
    getCurrentRoutePermissionKey,
    
    // Current location
    currentPath: location.pathname
  }
}

/**
 * Hook specifically for checking if user can access admin features
 */
export function useAdminPermissions() {
  const permissions = usePermissions()

  const canManageUsers = () => permissions.hasPermission('admin_users')
  const canManageRoles = () => permissions.hasPermission('admin_role_permissions')
  const canViewReports = () => permissions.hasPermission('admin_reports')
  const canManageContent = () => permissions.hasPermission('admin_content_approval')
  const canViewOverview = () => permissions.hasPermission('admin_overview')
  
  const isAdmin = () => permissions.hasRole('admin')

  return {
    ...permissions,
    canManageUsers,
    canManageRoles,
    canViewReports,
    canManageContent,
    canViewOverview,
    isAdmin
  }
}

/**
 * Hook specifically for checking teacher permissions
 */
export function useTeacherPermissions() {
  const permissions = usePermissions()

  const canManageClasses = () => permissions.hasPermission('teacher_class_management')
  const canManageGrades = () => permissions.hasPermission('teacher_grade_management')
  const canViewPredictions = () => permissions.hasPermission('teacher_prediction_view')
  const canTrackProgress = () => permissions.hasPermission('teacher_progress_tracking')
  const canAccessReports = () => permissions.hasPermission('teacher_reports_alerts')
  
  const isTeacher = () => permissions.hasRole('teacher')

  return {
    ...permissions,
    canManageClasses,
    canManageGrades,
    canViewPredictions,
    canTrackProgress,
    canAccessReports,
    isTeacher
  }
}

/**
 * Hook specifically for checking student permissions
 */
export function useStudentPermissions() {
  const permissions = usePermissions()

  const canViewCourseOverview = () => permissions.hasPermission('student_course_overview')
  const canUploadTranscript = () => permissions.hasPermission('student_upload_transcript')
  const canAdjustParameters = () => permissions.hasPermission('student_adjust_parameters')
  const canAccessAcademicPlanning = () => permissions.hasPermission('student_academic_planning')
  
  const isStudent = () => permissions.hasRole('student')

  return {
    ...permissions,
    canViewCourseOverview,
    canUploadTranscript,
    canAdjustParameters,
    canAccessAcademicPlanning,
    isStudent
  }
}