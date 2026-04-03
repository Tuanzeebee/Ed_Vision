export interface TokenData {
  token: string
  createdAt: number // timestamp when token was created
  lastTabCloseTime: number // timestamp when all tabs were closed (from localStorage)
}

export class TokenManager {
  private static readonly TOKEN_KEY = 'auth_token_data'
private static readonly SESSION_TOKEN_KEY = 'session_tab_active'
// For session storage - exists only when tab is open
  private static readonly TAB_CLOSE_TIMEOUT_MINUTES = 5 // 5 phút sau khi đóng tất cả tab thì hết hạn
  // Removed MAX_SESSION_HOURS - no more hard time limit

  /**
   * Lưu token - không có idle timeout, chỉ hết hạn khi đóng tất cả tab >5 phút
   */
  static setToken(token: string): void {
    const now = Date.now()

    const tokenData: TokenData = {
      token,
      createdAt: now,
      lastTabCloseTime: 0 // 0 means tabs are currently open
    }

    // Lưu trong localStorage để persist qua tabs
    localStorage.setItem(this.TOKEN_KEY, JSON.stringify(tokenData))
    // Lưu trong sessionStorage để đánh dấu tab đang mở (sẽ tự động mất khi đóng tab)
    sessionStorage.setItem(this.SESSION_TOKEN_KEY, 'active')
    
    // Backward compatibility - keep the old token key for components that still use it
    localStorage.setItem('token', token)
    
    // Setup beforeunload listener to update lastTabCloseTime when all tabs close
    this.setupTabCloseListener()
  }

  /**
   * Lấy token - chỉ kiểm tra nếu tất cả tab đã đóng >5 phút
   */
  static getToken(): string | null {
    const tokenDataStr = localStorage.getItem(this.TOKEN_KEY)
    if (!tokenDataStr) {
      // Fallback to old token system
      return localStorage.getItem('token')
    }

    try {
      const tokenData: TokenData = JSON.parse(tokenDataStr)

      // Kiểm tra xem có tab nào đang mở không
      const hasActiveTab = this.hasActiveTab()
      
      if (hasActiveTab) {
        // Có tab đang mở ->token hợp lệ, reset lastTabCloseTime về 0
        if (tokenData.lastTabCloseTime !== 0) {
          tokenData.lastTabCloseTime = 0
          localStorage.setItem(this.TOKEN_KEY, JSON.stringify(tokenData))
        }
        return tokenData.token
      }
      
      // Không có tab nào mở ->kiểm tra xem đã đóng quá 5 phút chưa
      if (this.isTokenExpiredFromTabClose()) {
        this.clearToken()
        return null
      }

      // Tab đóng nhưng chưa quá 5 phút ->vẫn hợp lệ
      return tokenData.token
    } catch (error) {
      console.error('Error parsing token data:', error)
      this.clearToken()
      return null
    }
  }

  /**
   * Kiểm tra xem có tab nào đang active không
   * Check cả sessionStorage của tab hiện tại và heartbeat từ các tab khác
   */
  private static hasActiveTab(): boolean {
    // Nếu tab hiện tại đang active
    if (sessionStorage.getItem(this.SESSION_TOKEN_KEY) === 'active') {
      return true
    }
    
    // Kiểm tra heartbeat từ các tab khác
    const HEARTBEAT_KEY = 'auth_tab_heartbeat'
const lastHeartbeat = localStorage.getItem(HEARTBEAT_KEY)
    if (!lastHeartbeat) {
      return false
    }
    
    try {
      const timestamp = parseInt(lastHeartbeat, 10)
      const now = Date.now()
      // Nếu heartbeat mới hơn 5 giây ->có tab khác đang active
      return (now - timestamp) < 5000
    } catch (error) {
      return false
    }
  }

  private static listenerSetup = false
  private static heartbeatInterval: NodeJS.Timeout | null = null

  /**
   * Setup listener để track khi tab đóng - chỉ setup một lần
   */
  private static setupTabCloseListener(): void {
    if (this.listenerSetup) return
    this.listenerSetup = true
    
    // Mark this tab as active
    sessionStorage.setItem(this.SESSION_TOKEN_KEY, 'active')
    
    // Tạo một "heartbeat"trong localStorage để các tab khác biết còn tab nào đang mở
    // Mỗi 2 giây, tab sẽ update timestamp trong localStorage
    const HEARTBEAT_KEY = 'auth_tab_heartbeat'
const updateHeartbeat = () => {
      if (sessionStorage.getItem(this.SESSION_TOKEN_KEY) === 'active') {
        localStorage.setItem(HEARTBEAT_KEY, Date.now().toString())
      }
    }
    
    // Update heartbeat ngay lập tức
    updateHeartbeat()
    
    // Set interval để update heartbeat mỗi 2 giây
    this.heartbeatInterval = setInterval(updateHeartbeat, 2000)
    
    // Khi tab đóng, clear interval và update lastTabCloseTime
    window.addEventListener('beforeunload', () => {
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval)
      }
      
      // Remove heartbeat của tab này
      sessionStorage.removeItem(this.SESSION_TOKEN_KEY)
      
      // Đợi một chút để xem có tab nào khác còn active không
      // Nếu không có tab nào update heartbeat trong 3 giây ->tất cả tab đã đóng
      const tokenDataStr = localStorage.getItem(this.TOKEN_KEY)
      if (tokenDataStr) {
        try {
          const tokenData: TokenData = JSON.parse(tokenDataStr)
          tokenData.lastTabCloseTime = Date.now()
          localStorage.setItem(this.TOKEN_KEY, JSON.stringify(tokenData))
        } catch (error) {
          console.error('Error updating lastTabCloseTime:', error)
        }
      }
    })
    
    // Listen to storage events để detect khi có tab khác update heartbeat
    window.addEventListener('storage', (e) => {
      if (e.key === HEARTBEAT_KEY && e.newValue) {
        // Có tab khác còn active ->reset lastTabCloseTime
        const tokenDataStr = localStorage.getItem(this.TOKEN_KEY)
        if (tokenDataStr) {
          try {
            const tokenData: TokenData = JSON.parse(tokenDataStr)
            if (tokenData.lastTabCloseTime !== 0) {
              tokenData.lastTabCloseTime = 0
              localStorage.setItem(this.TOKEN_KEY, JSON.stringify(tokenData))
            }
          } catch (error) {
            console.error('Error resetting lastTabCloseTime:', error)
          }
        }
      }
    })
  }

  /**
   * Check if token expired due to all tabs being closed for too long
   */
  private static isTokenExpiredFromTabClose(): boolean {
    const tokenDataStr = localStorage.getItem(this.TOKEN_KEY)
    if (!tokenDataStr) {
      return true
    }

    try {
      const tokenData: TokenData = JSON.parse(tokenDataStr)
      
      // Nếu lastTabCloseTime = 0 nghĩa là có tab đang mở ->không expired
      if (tokenData.lastTabCloseTime === 0) {
        return false
      }
      
      const now = Date.now()
      const timeSinceAllTabsClosed = now - tokenData.lastTabCloseTime
      
      // Kiểm tra xem đã đóng tất cả tab quá 5 phút chưa
      return timeSinceAllTabsClosed >(this.TAB_CLOSE_TIMEOUT_MINUTES * 60 * 1000)
    } catch (error) {
      console.error('Error checking token expiry:', error)
      return true
    }
  }

  /**
   * Đánh dấu tab đang active - gọi khi mở tab hoặc user có hoạt động
   * Không cần thiết phải gọi thường xuyên vì chỉ cần đảm bảo sessionStorage còn
   */
  static updateActivity(): void {
    // Setup listener nếu chưa setup
    this.setupTabCloseListener()
    
    // Đảm bảo sessionStorage đánh dấu tab đang active
    sessionStorage.setItem(this.SESSION_TOKEN_KEY, 'active')
    
    // Reset lastTabCloseTime về 0 vì tab đang mở
    const tokenDataStr = localStorage.getItem(this.TOKEN_KEY)
    if (tokenDataStr) {
      try {
        const tokenData: TokenData = JSON.parse(tokenDataStr)
        if (tokenData.lastTabCloseTime !== 0) {
          tokenData.lastTabCloseTime = 0
          localStorage.setItem(this.TOKEN_KEY, JSON.stringify(tokenData))
        }
      } catch (error) {
        console.error('Error resetting lastTabCloseTime:', error)
      }
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
    keysToRemove.forEach(key =>localStorage.removeItem(key))
  }

  /**
   * Lấy thời gian còn lại của token
   * - Nếu có tab đang mở: trả về số lớn (không hết hạn)
   * - Nếu tất cả tab đóng: trả về số phút còn lại trước khi hết hạn
   */
  static getTimeRemaining(): number {
    const tokenDataStr = localStorage.getItem(this.TOKEN_KEY)
    if (!tokenDataStr) {
      return 0
    }

    try {
      // Nếu có tab đang mở ->không bao giờ hết hạn
      if (this.hasActiveTab()) {
        return 999 // Số lớn để báo hiệu không có thời gian hết hạn
      }
      
      // Nếu không có tab nào mở, tính thời gian còn lại
      const tokenData: TokenData = JSON.parse(tokenDataStr)
      
      if (tokenData.lastTabCloseTime === 0) {
        // Chưa từng đóng tab ->không hết hạn
        return 999
      }
      
      const now = Date.now()
      const timeSinceClose = now - tokenData.lastTabCloseTime
      const timeoutMs = this.TAB_CLOSE_TIMEOUT_MINUTES * 60 * 1000
      const remainingMs = timeoutMs - timeSinceClose
      
      if (remainingMs <= 0) {
        return 0 // Đã hết hạn
      }
      
      // Trả về số phút còn lại
      return Math.ceil(remainingMs / (60 * 1000))
    } catch (error) {
      return 0
    }
  }

  /**
   * Extend token - đơn giản là đánh dấu tab đang active
   */
  static extendToken(): boolean {
    this.updateActivity()
    return true
  }
}