import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { hasRoutePermission } from '@/lib/permissionMapper'

type Props = {
  children: React.ReactNode
  allowedRoles?: string[]
  // optional permission key to check against the logged-in user's permissions map
  permission?: string
}

export default function ProtectedRoute({ children, allowedRoles = ['admin'], permission }: Props) {
  const location = useLocation()
  
  try {
    const raw = localStorage.getItem('user')
    if (!raw) return <Navigate to="/auth/login" replace />
    const user = JSON.parse(raw)
    const code = (user?.roleRel?.code || user?.role || '').toString().toLowerCase()
    const allowed = allowedRoles.map((r) => r.toLowerCase())

    // Step 1: Check specific permission if provided
    if (permission) {
      const perms = user?.permissions || {}
      if (perms && typeof perms === 'object' && perms[permission]) {
        return <>{children}</>
      }
    }

    // Step 2: Auto-detect permission from current route
    const currentPath = location.pathname
    const perms = user?.permissions || {}
    if (perms && typeof perms === 'object' && hasRoutePermission(perms, currentPath)) {
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
    
    if (hasRoleAccess && (!perms || Object.keys(perms).length === 0)) {
      console.warn(`⚠️ Fallback: Using role-based access for ${code} on ${currentPath}. Permission system may not be loaded.`)
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