import { apiFetch } from '@/services/api/fetch'

/**
 * Service để load và sync permissions từ server
 */
export class PermissionService {
  /**
   * Load permissions cho user hiện tại từ server
   */
  static async loadUserPermissions(): Promise<Record<string, boolean>> {
    try {
      const user = PermissionService.getCurrentUser()
      if (!user || !user.role) {
        console.warn('No user or role found')
        return {}
      }

      const roleCode = user.role

      // First check if user already has permissions from login
      if (user.permissions && Object.keys(user.permissions).length > 0) {
        return user.permissions
      }

      // For admin/leader, load from server
      if (roleCode === 'admin' || roleCode === 'leader') {
        const response = await apiFetch(`/admin/role-permissions/${roleCode}`)
        
        if (response && response.success) {
          return response.data || {}
        }
      }

      // For other roles (student, teacher, parent), try to load from server
      // If the endpoint is not accessible, fall back to defaults
      try {
        const response = await apiFetch(`/admin/role-permissions/${roleCode}`)
        if (response && response.success) {
          return response.data || {}
        }
      } catch (error) {
        console.warn(`Could not load permissions from server for role ${roleCode}, using defaults`)
      }

      // For other roles, return default permissions
      const defaultPermissions: Record<string, string[]> = {
        'student': [
          'student_dashboard',
          'student_profile',
          'student_learning',
          'student_appointments',
          'appointments',
          'student_survey',
          'student_course_overview',
          'student_upload_transcript',
          'student_adjust_parameters',
          'student_academic_planning',
          'student_course_detail',
          'student_financial_survey',
          'student_choose_mascot',
          'student_learning_adventure',
          'student_chat_student'
        ],
        'teacher': [
          'teacher_dashboard',
          'teacher_profile',
          'teacher_schedule',
          'teacher_appointments',
          'teacher_students',
          'teacher_survey'
        ],
        'parent': [
          'parent_dashboard',
          'parent_profile',
          'parent_children',
          'parent_appointments',
          'appointments',
          'parent_book_appointment',
          'booking_scheduler'
        ]
      }

      const rolePermissions = defaultPermissions[roleCode] || []
      const permissions: Record<string, boolean> = {}
      rolePermissions.forEach(perm => {
        permissions[perm] = true
      })

      return permissions
      
      return {}
    } catch (error) {
      console.error('Failed to load user permissions:', error)
      return {}
    }
  }

  /**
   * Sync permissions với localStorage
   */
  static async syncPermissions(): Promise<void> {
    try {
      const permissions = await PermissionService.loadUserPermissions()
      const user = PermissionService.getCurrentUser()
      
      if (user) {
        // Update user object with new permissions
        const updatedUser = {
          ...user,
          permissions
        }
        
        // Save back to localStorage
        localStorage.setItem('user', JSON.stringify(updatedUser))
        
        // Dispatch event to notify components
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('permissions:updated', { detail: permissions }))
        }
      }
    } catch (error) {
      console.error('Failed to sync permissions:', error)
    }
  }

  /**
   * Get current user from localStorage
   */
  static getCurrentUser(): any {
    try {
      const raw = localStorage.getItem('user')
      if (!raw) return null
      return JSON.parse(raw)
    } catch (error) {
      console.error('Failed to get current user:', error)
      return null
    }
  }

  /**
   * Check if user has a specific permission
   */
  static hasPermission(permissionKey: string): boolean {
    const user = PermissionService.getCurrentUser()
    const permissions = user?.permissions || {}
    return !!permissions[permissionKey]
  }

  /**
   * Get all user permissions
   */
  static getUserPermissions(): Record<string, boolean> {
    const user = PermissionService.getCurrentUser()
    return user?.permissions || {}
  }

  /**
   * Force refresh permissions from server
   */
  static async refreshPermissions(): Promise<void> {
    console.log('Refreshing permissions from server...')
    await PermissionService.syncPermissions()
    
    // Trigger a page reload to ensure all components get new permissions
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }
}

/**
 * Auto-sync permissions on app initialization
 */
export function initializePermissions() {
  // Only run in browser
  if (typeof window === 'undefined') return

  // Check if user is logged in
  const user = PermissionService.getCurrentUser()
  if (!user) return

  // Check if permissions are missing or outdated
  if (!user.permissions || Object.keys(user.permissions).length === 0) {
    console.log('User permissions missing, syncing from server...')
    PermissionService.syncPermissions()
  }

  // Set up periodic sync every 5 minutes
  setInterval(() => {
    PermissionService.syncPermissions()
  }, 5 * 60 * 1000) // 5 minutes
}