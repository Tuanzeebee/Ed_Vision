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
      // Check if there's a linkCode in the URL params or navigation state (parent registration flow)
      const searchParams = new URLSearchParams(location.search)
      const hasLinkCodeInUrl = searchParams.has('linkCode')
      const hasLinkCodeInState = (location.state as any)?.linkCode
      const hasLinkCode = hasLinkCodeInUrl || hasLinkCodeInState
      
      // Allow access to register/otp pages if linkCode is present (parent registration)
      if (hasLinkCode && (location.pathname === '/auth/register' || location.pathname === '/auth/otp-verification')) {
        console.log('LinkCode detected in parent registration flow, allowing access')
        return
      }

      const authPages = ['/auth/login', '/auth/register', '/auth/otp-verification', '/student/login', '/student/register', '/student/otp-verification']
      if (authPages.includes(location.pathname)) {
        const dashboardPath = getDashboardPath()
        console.log('User already authenticated, redirecting to:', dashboardPath)
        navigate(dashboardPath, { replace: true })
      }
    }
  }, [isAuthenticated, isLoading, location.pathname, location.search, location.state, getDashboardPath])

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