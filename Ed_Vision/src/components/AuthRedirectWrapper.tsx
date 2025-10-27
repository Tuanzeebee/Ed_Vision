import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

/**
 * Wrapper component that automatically redirects authenticated users
 * to their appropriate dashboard. Use this for auth pages and landing pages.
 */
export default function AuthRedirectWrapper({ children }: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, getDashboardPath, isLoading } = useAuth()

  useEffect(() => {
    // Wait for auth check to complete
    if (isLoading) return

    // Only redirect if user is authenticated and on auth pages
    if (isAuthenticated) {
      const authPages = ['/auth/login', '/auth/register', '/auth/otp-verification', '/student/login', '/student/register', '/student/otp-verification']
      if (authPages.includes(location.pathname)) {
        const dashboardPath = getDashboardPath()
        console.log('User already authenticated, redirecting to:', dashboardPath)
        navigate(dashboardPath, { replace: true })
      }
    }
  }, [isAuthenticated, isLoading, location.pathname, navigate, getDashboardPath])

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Đang kiểm tra đăng nhập...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}