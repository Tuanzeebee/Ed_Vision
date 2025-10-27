import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()
  
  // Track user activity to extend token
  useActivityTracker(authState.isAuthenticated)

  // Check authentication status
  const checkAuth = useCallback(() => {
    const token = TokenManager.getToken()
    const isExpired = TokenManager.isTokenExpired()
    
    if (!token || isExpired) {
      // Token expired or doesn't exist
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
    TokenManager.clearToken()
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
    
    // Navigate to login
    navigate('/auth/login')
  }, [navigate])

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