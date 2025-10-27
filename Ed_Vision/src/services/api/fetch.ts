import { buildUrl } from './config'
import { TokenManager } from '@/lib/tokenManager'

export async function apiFetch(path: string, opts: RequestInit = {}) {
  // Use TokenManager to get token and update activity
  const token = TokenManager.getToken()
  const headers: Record<string, string> = { ...(opts.headers as Record<string, string> || {}) }
  if (!headers['Content-Type']) headers['Content-Type'] = 'application/json'
  if (token) headers['Authorization'] = `Bearer ${token}`

  try {
    const res = await fetch(buildUrl(path), { ...opts, headers })
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      const msg = body?.message || res.statusText
      const e: any = new Error(msg || 'Yêu cầu thất bại')
      e.status = res.status
      e.body = body
      throw e
    }
    return res.json().catch(() => null)
  } catch (error: any) {
    // Handle network errors and translate common browser messages
    if (error.message === 'Failed to fetch') {
      const e: any = new Error('Không thể kết nối đến máy chủ')
      e.status = 0
      e.originalError = error
      throw e
    }
    if (error.message.includes('NetworkError') || error.message.includes('network')) {
      const e: any = new Error('Lỗi mạng, vui lòng kiểm tra kết nối internet')
      e.status = 0
      e.originalError = error
      throw e
    }
    // Re-throw other errors as-is
    throw error
  }
}
