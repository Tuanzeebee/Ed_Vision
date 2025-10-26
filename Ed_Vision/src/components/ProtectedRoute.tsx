import React from 'react'
import { Navigate } from 'react-router-dom'

type Props = {
  children: React.ReactNode
  allowedRoles?: string[]
  // optional permission key to check against the logged-in user's permissions map
  permission?: string
}

export default function ProtectedRoute({ children, allowedRoles = ['admin'], permission }: Props) {
  try {
    const raw = localStorage.getItem('user')
    if (!raw) return <Navigate to="/auth/login" replace />
    const user = JSON.parse(raw)
    const code = (user?.roleRel?.code || user?.role || '').toString().toLowerCase()
    const allowed = allowedRoles.map((r) => r.toLowerCase())

    // If a permission key is provided, prefer permission-based check (role overrides still allowed)
    if (permission) {
      const perms = user?.permissions || {}
      if (perms && typeof perms === 'object' && perms[permission]) {
        return <>{children}</>
      }
    }

    if (allowed.includes(code)) return <>{children}</>

    // not allowed — redirect to a sensible home for the logged-in role (better UX than always sending to student landing)
    const roleRedirectMap: Record<string, string> = {
      student: '/student/landing',
      teacher: '/teacher/dashboard',
      parent: '/parent/dashboard',
      admin: '/admin/dashboard'
    }

    const redirectTo = roleRedirectMap[code] || '/auth/login'
    return <Navigate to={redirectTo} replace />
  } catch (e) {
    return <Navigate to="/auth/login" replace />
  }
}
