import { useState, useEffect, useCallback } from 'react'
import { TokenManager } from '@/lib/tokenManager'
import { useActivityTracker } from '@/hooks/useActivityTracker'

interface AuthState {
  isAuthenticated: boolean
  user: any
  isLoading: boolean
  timeRemaining: number // minutes
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
    timeRemaining: 0
  })
  // navigation handled via full page redirects on logout; keep router hook available if needed elsewhere
  
  // Track user activity to extend token - but stop tracking if token is expired
  useActivityTracker(authState.isAuthenticated, authState.timeRemaining)

  // Check authentication status
  const checkAuth = useCallback(() => {
    // First check if token is expired (e.g. tab closed > timeout)
    const isExpired = TokenManager.isTokenExpired()
    if (isExpired) {
      // Notify UI that session expired so components can show the modal
      try {
        window.dispatchEvent(new CustomEvent('auth:expired'))
      } catch (e) {
        try {
          window.dispatchEvent(new Event('auth:expired'))
        } catch (_) {
          // ignore
        }
      }

      // Clear token and mark unauthenticated
      TokenManager.clearToken()
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        timeRemaining: 0
      })
      return false
    }

    const token = TokenManager.getToken()
    if (!token) {
      // Token doesn't exist
      TokenManager.clearToken()
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        timeRemaining: 0
      })
      return false
    }

    // Token exists and valid
    const userDataStr = localStorage.getItem('user')
    let user = null
    try {
      user = userDataStr ? JSON.parse(userDataStr) : null
    } catch (error) {
      console.error('Error parsing user data:', error)
    }

    const timeRemaining = TokenManager.getTimeRemaining()
    
    setAuthState({
      isAuthenticated: true,
      user,
      isLoading: false,
      timeRemaining
    })
    
    return true
  }, [])

  // Logout function
  const logout = useCallback(() => {
    // Create a small overlay to hide UI changes during logout for a smoother transition
    try {
      if (typeof document !== 'undefined') {
        const existing = document.getElementById('app-logout-overlay')
        if (!existing) {
          const overlay = document.createElement('div')
          overlay.id = 'app-logout-overlay'
          overlay.style.position = 'fixed'
          overlay.style.inset = '0'
          overlay.style.background = 'rgba(0,0,0,0)'
          overlay.style.display = 'flex'
          overlay.style.alignItems = 'center'
          overlay.style.justifyContent = 'center'
          overlay.style.zIndex = '999999'
          overlay.style.transition = 'background 180ms ease'

          const box = document.createElement('div')
          box.style.padding = '18px 24px'
          box.style.borderRadius = '8px'
          box.style.background = 'rgba(255,255,255,0.95)'
          box.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'
          box.style.display = 'flex'
          box.style.alignItems = 'center'
          box.style.gap = '12px'

          const spinner = document.createElement('div')
          spinner.style.width = '28px'
          spinner.style.height = '28px'
          spinner.style.border = '3px solid #e5e7eb'
          spinner.style.borderTop = '3px solid #6366f1'
          spinner.style.borderRadius = '50%'
          spinner.style.animation = 'spin 1s linear infinite'

          const text = document.createElement('div')
          text.style.color = '#111827'
          text.style.fontSize = '14px'
          text.innerText = 'Đang đăng xuất...'

          box.appendChild(spinner)
          box.appendChild(text)
          overlay.appendChild(box)
          document.body.appendChild(overlay)

          // add spin keyframes if not present
          const styleId = 'app-logout-overlay-style'
          if (!document.getElementById(styleId)) {
            const style = document.createElement('style')
            style.id = styleId
            style.innerHTML = `@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`
            document.head.appendChild(style)
          }

          // trigger fade-in
          requestAnimationFrame(() => {
            overlay.style.background = 'rgba(0,0,0,0.45)'
          })
        }
      }
    } catch (e) {
      // ignore overlay errors
    }

    // perform cleanup then navigate — overlay hides the intermediate UI changes
    try {
      TokenManager.clearToken()
    } catch (_) {}

    setAuthState({
      isAuthenticated: false,
      user: null,
      isLoading: false,
      timeRemaining: 0
    })

    // Dispatch logout event
    try {
      window.dispatchEvent(new CustomEvent('auth:logout'))
    } catch (e) {
      try {
        window.dispatchEvent(new Event('auth:logout'))
      } catch (_) {}
    }

    // Navigate to landing after a tiny delay to let the overlay fade in
    setTimeout(() => {
      window.location.href = '/student/landing'
    }, 160)
  }, [])

  // Monitor token status but don't auto logout - let user decide
  useEffect(() => {
    let intervalId: NodeJS.Timeout

    const checkTokenStatus = () => {
      if (authState.isAuthenticated) {
        const timeRemaining = TokenManager.getTimeRemaining()
        
        if (timeRemaining <= 0) {
          // Token expired - but don't auto logout, just update state
          // The SessionTimeoutWarning component will handle the user interaction
          console.log('Token expired due to inactivity - showing warning')
          setAuthState(prev => ({ ...prev, timeRemaining: 0 }))
        } else {
          // Update time remaining in state
          setAuthState(prev => ({ ...prev, timeRemaining }))
        }
      }
    }

    if (authState.isAuthenticated) {
      // Check every 30 seconds
      intervalId = setInterval(checkTokenStatus, 30 * 1000)
      // Check immediately
      checkTokenStatus()
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [authState.isAuthenticated])

  // Check auth status on mount and when storage changes
  useEffect(() => {
    checkAuth()

    // Listen for storage changes (user logged in/out in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token_data' || e.key === 'token') {
        checkAuth()
      }
    }

    // Listen for auth events
    const handleAuthLogin = () => {
      checkAuth()
    }

    const handleAuthLogout = () => {
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        timeRemaining: 0
      })
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('auth:login', handleAuthLogin)
    window.addEventListener('auth:logout', handleAuthLogout)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('auth:login', handleAuthLogin)
      window.removeEventListener('auth:logout', handleAuthLogout)
    }
  }, [checkAuth])

  // Extend session (reset idle timer)
  const extendSession = useCallback(() => {
    const extended = TokenManager.extendToken()
    if (extended) {
      checkAuth() // Refresh state
    }
    return extended
  }, [checkAuth])

  // Get user role
  const getUserRole = useCallback(() => {
    if (!authState.user) return null
    return authState.user.roleRel?.code || authState.user.role || authState.user.role_code || authState.user.roleCode || 'student'
  }, [authState.user])

  // Get dashboard path for current user
  const getDashboardPath = useCallback(() => {
    const role = getUserRole()
    if (!role) return '/student/landing'

    const normalizedRole = role.toLowerCase()
    switch (normalizedRole) {
      case 'admin':
      case 'administrator':
        return '/admin/dashboard'
      case 'leader':
        return '/admin/dashboard'
      case 'teacher':
        return '/teacher/dashboard'
      case 'parent':
        return '/parent/dashboard'
      case 'student':
      default:
        return '/student/instructions'
    }
  }, [getUserRole])

  return {
    ...authState,
    logout,
    extendSession,
    getUserRole,
    getDashboardPath,
    checkAuth
  }
}