import { buildUrl } from './config'

export async function apiFetch(path: string, opts: RequestInit = {}) {
  const token = localStorage.getItem('token')
  const headers: Record<string, string> = { ...(opts.headers as Record<string, string> || {}) }
  if (!headers['Content-Type']) headers['Content-Type'] = 'application/json'
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(buildUrl(path), { ...opts, headers })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    const msg = body?.message || res.statusText
    const e: any = new Error(msg || 'Request failed')
    e.status = res.status
    e.body = body
    throw e
  }
  return res.json().catch(() => null)
}
