import React from 'react'
import { Navigate } from 'react-router-dom'
import { loadRolePermissions } from '@/lib/rolePermissionStore'

type Props = {
  permission: string
  children: React.ReactElement
}

export default function ProtectedRoute({ permission, children }: Props) {
  try {
    const raw = localStorage.getItem('user')
    if (!raw) return <Navigate to="/student/landing" replace />
    const user = JSON.parse(raw)
    const role = user?.role || user?.role?.toLowerCase?.() || ''
    const perms = loadRolePermissions()
    const rolePerms = perms[role] || {}
    if (rolePerms[permission]) return children

    // If admin hasn't set any explicit permissions yet, fall back to simple role-based defaults
    if (!Object.keys(rolePerms).length) {
      if (permission.startsWith('admin_') && (role === 'admin' || role === 'leader')) return children
      if (permission.startsWith('teacher_') && role === 'teacher') return children
      if (permission.startsWith('student_') && role === 'student') return children
    }

    return <Navigate to="/student/landing" replace />
  } catch (e) {
    return <Navigate to="/student/landing" replace />
  }
}
