import React, { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { hasRoutePermission } from '@/lib/permissionMapper'
import { PermissionService } from '@/services/permissionService'

type Props = {
  children: React.ReactNode
  allowedRoles?: string[]
  // optional permission key to check against the logged-in user's permissions map
  permission?: string
}

export default function ProtectedRoute({ children, allowedRoles = ['admin'], permission }: Props) {
  const location = useLocation()
  const [permissions, setPermissions] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const user = PermissionService.getCurrentUser()
        if (user && (!user.permissions || Object.keys(user.permissions).length === 0)) {
          await PermissionService.syncPermissions()
          const updatedUser = PermissionService.getCurrentUser()
          setPermissions(updatedUser?.permissions || {})
        } else {
          setPermissions(user?.permissions || {})
        }
      } catch (error) {
        console.error('Failed to load permissions:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPermissions()

    // Listen for permission updates
    const handlePermissionsUpdate = (event: CustomEvent) => {
      setPermissions(event.detail)
    }

    window.addEventListener('permissions:updated', handlePermissionsUpdate as EventListener)

    return () => {
      window.removeEventListener('permissions:updated', handlePermissionsUpdate as EventListener)
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }
  
  try {
    const raw = localStorage.getItem('user')
    if (!raw) return <Navigate to="/auth/login" replace />
    const user = JSON.parse(raw)
    const code = (user?.roleRel?.code || user?.role || '').toString().toLowerCase()
    const allowed = allowedRoles.map((r) => r.toLowerCase())

    // Step 1: Check specific permission if provided
    if (permission) {
      if (permissions && typeof permissions === 'object' && permissions[permission]) {
        return <>{children}</>
      } else {
        // Don't redirect immediately, let the fallback role check handle it
        // return <Navigate to="/auth/login" replace />
      }
    }

    // Step 2: Auto-detect permission from current route
    const currentPath = location.pathname
    if (permissions && typeof permissions === 'object' && hasRoutePermission(permissions, currentPath)) {
      return <>{children}</>
    }

    // Step 3: Fall back to role-based check
    if (allowed.includes(code)) return <>{children}</>

    // Step 4: Fallback for default role permissions (if permission system fails)
    // This provides backward compatibility
    const roleDefaultAccess = {
      'admin': ['/admin/'],
      'teacher': ['/teacher/'],
      'student': ['/student/'],
      'parent': ['/parent/'],
      'leader': ['/admin/']
    }
    
    const allowedPaths = roleDefaultAccess[code as keyof typeof roleDefaultAccess] || []
    const hasRoleAccess = allowedPaths.some(path => currentPath.startsWith(path))
    
    if (hasRoleAccess) {
      return <>{children}</>
    }

    // not allowed — redirect to a sensible home for the logged-in role (better UX than always sending to student landing)
    const roleRedirectMap: Record<string, string> = {
      student: '/student/landing',
      teacher: '/teacher/dashboard',
      parent: '/parent/dashboard',
      admin: '/admin/dashboard',
      leader: '/admin/dashboard'
    }

    const redirectTo = roleRedirectMap[code] || '/auth/login'
    return <Navigate to={redirectTo} replace />
  } catch (e) {
    return <Navigate to="/auth/login" replace />
  }
}