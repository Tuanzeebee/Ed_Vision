export interface TokenData {
  token: string
  createdAt: number // timestamp when token was created
  lastActivity: number // timestamp of last user activity
}

export class TokenManager {
  private static readonly TOKEN_KEY = 'auth_token_data'
  private static readonly SESSION_TOKEN_KEY = 'session_auth_token_data' // For session storage
  private static readonly TAB_CLOSE_TIMEOUT_MINUTES = 5 // 5 phút sau khi đóng tab thì hết hạn
  // Removed MAX_SESSION_HOURS - no more hard time limit

  /**
   * Lưu token - không có idle timeout, chỉ hết hạn khi đóng tab
   */
  static setToken(token: string): void {
    const now = Date.now()

    const tokenData: TokenData = {
      token,
      createdAt: now,
      lastActivity: now
    }

    // Lưu trong localStorage để persist qua tabs
    localStorage.setItem(this.TOKEN_KEY, JSON.stringify(tokenData))
    // Lưu trong sessionStorage để track tab session
    sessionStorage.setItem(this.SESSION_TOKEN_KEY, JSON.stringify({ tabOpened: now }))
    
    // Backward compatibility - keep the old token key for components that still use it
    localStorage.setItem('token', token)
  }

  /**
   * Lấy token - chỉ kiểm tra hard limit, không có idle timeout
   */
  static getToken(): string | null {
    const tokenDataStr = localStorage.getItem(this.TOKEN_KEY)
    if (!tokenDataStr) {
      // Fallback to old token system
      return localStorage.getItem('token')
    }

    try {
      const tokenData: TokenData = JSON.parse(tokenDataStr)

      // Check if tab was closed for more than 5 minutes
      if (this.isTokenExpiredFromTabClose()) {
        this.clearToken()
        return null
      }

      // Token is valid - no time limits, only tab close check
      return tokenData.token
    } catch (error) {
      console.error('Error parsing token data:', error)
      this.clearToken()
      return null
    }
  }

  /**
   * Check if token expired due to tab being closed for too long
   */
  private static isTokenExpiredFromTabClose(): boolean {
    const sessionDataStr = sessionStorage.getItem(this.SESSION_TOKEN_KEY)
    if (!sessionDataStr) {
      // No session data means tab was potentially closed and reopened
      // Check if localStorage token exists and when it was last updated
      const tokenDataStr = localStorage.getItem(this.TOKEN_KEY)
      if (!tokenDataStr) return true

      try {
        const tokenData: TokenData = JSON.parse(tokenDataStr)
        const now = Date.now()
        const timeSinceLastActivity = now - tokenData.lastActivity
        
        // If more than 5 minutes since last activity and no session data, consider expired
        return timeSinceLastActivity > (this.TAB_CLOSE_TIMEOUT_MINUTES * 60 * 1000)
      } catch (error) {
        return true
      }
    }
    return false
  }

  /**
   * Check if token can be extended (only check tab close, no time limits)
   */
  private static canExtendToken(): boolean {
    const tokenDataStr = localStorage.getItem(this.TOKEN_KEY)
    if (!tokenDataStr) return false

    try {
      // Check if tab was closed for too long
      if (this.isTokenExpiredFromTabClose()) {
        return false
      }

      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Cập nhật thời gian hoạt động - không còn idle timeout
   */
  static updateActivity(): void {
    // First check if we can extend the token
    if (!this.canExtendToken()) {
      console.log('Token cannot be extended - either expired or at session limit')
      return
    }

    const tokenDataStr = localStorage.getItem(this.TOKEN_KEY)
    if (!tokenDataStr) return

    try {
      const tokenData: TokenData = JSON.parse(tokenDataStr)
      const now = Date.now()

      // Update last activity only - no more expiry extension
      tokenData.lastActivity = now

      localStorage.setItem(this.TOKEN_KEY, JSON.stringify(tokenData))
      
      // Update session storage to indicate tab is still active
      sessionStorage.setItem(this.SESSION_TOKEN_KEY, JSON.stringify({ tabOpened: now }))
      
      // No need to dispatch token-extended event since there's no idle timeout
    } catch (error) {
      console.error('Error updating activity:', error)
    }
  }

  /**
   * Kiểm tra xem token có hết hạn không - chỉ check tab close
   */
  static isTokenExpired(): boolean {
    const tokenDataStr = localStorage.getItem(this.TOKEN_KEY)
    if (!tokenDataStr) {
      // Check old token system - assume not expired if exists
      return !localStorage.getItem('token')
    }

    try {
      // Check if tab was closed for too long
      return this.isTokenExpiredFromTabClose()
    } catch (error) {
      return true
    }
  }



  /**
   * Xóa token
   */
  static clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY)
    localStorage.removeItem('token') // Remove old token too
    localStorage.removeItem('user') // Remove user data
    localStorage.removeItem('rolePermissions') // Remove permission cache
    
    // Clear any other auth-related data
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.startsWith('auth_') || key.startsWith('user_') || key.startsWith('permission_'))) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key))
  }

  /**
   * Lấy thời gian còn lại của token - không có time limit nên trả về giá trị lớn hoặc 0 nếu expired
   */
  static getTimeRemaining(): number {
    const tokenDataStr = localStorage.getItem(this.TOKEN_KEY)
    if (!tokenDataStr) {
      return 0
    }

    try {
      // Check if tab was closed for too long
      if (this.isTokenExpiredFromTabClose()) {
        return 0
      }

      // Since there's no time limits, return a large number to indicate "no expiry"
      // This prevents SessionTimeoutWarning from showing unless tab was closed
      return 999 // High number to indicate no immediate expiry
    } catch (error) {
      return 0
    }
  }

  /**
   * Manually extend token - since there's no idle timeout, this just updates activity
   */
  static extendToken(): boolean {
    // First check if we can extend the token
    if (!this.canExtendToken()) {
      console.log('Token cannot be extended manually - either expired or at session limit')
      return false
    }

    const tokenDataStr = localStorage.getItem(this.TOKEN_KEY)
    if (!tokenDataStr) {
      return false
    }

    try {
      const tokenData: TokenData = JSON.parse(tokenDataStr)
      const now = Date.now()

      // Update activity timestamp
      tokenData.lastActivity = now

      localStorage.setItem(this.TOKEN_KEY, JSON.stringify(tokenData))
      
      // Update session storage to indicate tab is still active
      sessionStorage.setItem(this.SESSION_TOKEN_KEY, JSON.stringify({ tabOpened: now }))
      
      // No need to dispatch token-extended event since there's no idle timeout to extend
      return true
    } catch (error) {
      return false
    }
  }
}