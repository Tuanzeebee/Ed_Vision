export interface TokenData {
  token: string
  expiresAt: number // timestamp when token expires due to inactivity
  lastActivity: number // timestamp of last user activity
}

export class TokenManager {
  private static readonly TOKEN_KEY = 'auth_token_data'
  private static readonly IDLE_TIMEOUT_MINUTES = 30 // 30 phút không hoạt động thì hết hạn
  private static readonly MAX_SESSION_HOURS = 24 // Tối đa 24 giờ (hard limit)

  /**
   * Lưu token với sliding expiry
   */
  static setToken(token: string): void {
    const now = Date.now()
    const expiresAt = now + (this.IDLE_TIMEOUT_MINUTES * 60 * 1000) // 30 phút từ bây giờ

    const tokenData: TokenData = {
      token,
      expiresAt,
      lastActivity: now
    }

    localStorage.setItem(this.TOKEN_KEY, JSON.stringify(tokenData))
    // Backward compatibility - keep the old token key for components that still use it
    localStorage.setItem('token', token)
  }

  /**
   * Lấy token nếu còn hạn và cập nhật activity
   */
  static getToken(): string | null {
    const tokenDataStr = localStorage.getItem(this.TOKEN_KEY)
    if (!tokenDataStr) {
      // Fallback to old token system
      return localStorage.getItem('token')
    }

    try {
      const tokenData: TokenData = JSON.parse(tokenDataStr)
      const now = Date.now()

      // Check if token is expired due to inactivity
      if (now >= tokenData.expiresAt) {
        this.clearToken()
        return null
      }

      // Check if session exceeded maximum duration (hard limit)
      const sessionDuration = now - tokenData.lastActivity
      const maxSessionMs = this.MAX_SESSION_HOURS * 60 * 60 * 1000
      if (sessionDuration > maxSessionMs) {
        this.clearToken()
        return null
      }

      // Token is valid - update activity and extend expiry
      this.updateActivity()

      return tokenData.token
    } catch (error) {
      console.error('Error parsing token data:', error)
      this.clearToken()
      return null
    }
  }

  /**
   * Cập nhật thời gian hoạt động và gia hạn token
   */
  static updateActivity(): void {
    const tokenDataStr = localStorage.getItem(this.TOKEN_KEY)
    if (!tokenDataStr) return

    try {
      const tokenData: TokenData = JSON.parse(tokenDataStr)
      const now = Date.now()

      // Update last activity and extend expiry
      tokenData.lastActivity = now
      tokenData.expiresAt = now + (this.IDLE_TIMEOUT_MINUTES * 60 * 1000)

      localStorage.setItem(this.TOKEN_KEY, JSON.stringify(tokenData))
    } catch (error) {
      console.error('Error updating activity:', error)
    }
  }

  /**
   * Kiểm tra xem token có hết hạn không
   */
  static isTokenExpired(): boolean {
    const tokenDataStr = localStorage.getItem(this.TOKEN_KEY)
    if (!tokenDataStr) {
      // Check old token system - assume not expired if exists
      return !localStorage.getItem('token')
    }

    try {
      const tokenData: TokenData = JSON.parse(tokenDataStr)
      const now = Date.now()
      return now >= tokenData.expiresAt
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
  }

  /**
   * Lấy thời gian còn lại của token (in minutes)
   */
  static getTimeRemaining(): number {
    const tokenDataStr = localStorage.getItem(this.TOKEN_KEY)
    if (!tokenDataStr) {
      return 0
    }

    try {
      const tokenData: TokenData = JSON.parse(tokenDataStr)
      const now = Date.now()
      const remaining = tokenData.expiresAt - now
      return Math.max(0, Math.floor(remaining / (60 * 1000))) // convert to minutes
    } catch (error) {
      return 0
    }
  }

  /**
   * Manually extend token (reset idle timer)
   */
  static extendToken(): boolean {
    const tokenDataStr = localStorage.getItem(this.TOKEN_KEY)
    if (!tokenDataStr) {
      return false
    }

    try {
      const tokenData: TokenData = JSON.parse(tokenDataStr)
      const now = Date.now()

      // Reset idle timer
      tokenData.lastActivity = now
      tokenData.expiresAt = now + (this.IDLE_TIMEOUT_MINUTES * 60 * 1000)

      localStorage.setItem(this.TOKEN_KEY, JSON.stringify(tokenData))
      return true
    } catch (error) {
      return false
    }
  }
}