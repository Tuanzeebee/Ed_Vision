/**
 * buildUrl helper for frontend API calls
 * Reads VITE_API_BASE_URL from import.meta.env (Vite)
 */
export function buildUrl(path = '', params?: Record<string, string | number | boolean>): string {
  const base = (import.meta.env && (import.meta.env.VITE_API_BASE_URL as string)) || 'http://localhost:3000'
const trimmedBase = base.replace(/\/$/, '')
  const trimmedPath = path ? path.replace(/^\//, '') : ''
const url = new URL(trimmedPath ? `${trimmedBase}/${trimmedPath}` : trimmedBase)
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.append(k, String(v))
    })
  }
  return url.toString()
}

export default buildUrl
