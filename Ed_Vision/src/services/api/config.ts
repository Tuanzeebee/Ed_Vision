const getBrowserOrigin = (): string => {
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin
  }

  return 'http://localhost:3000'
}

const isAbsoluteUrl = (value: string): boolean => /^https?:\/\//i.test(value)
const isWebSocketUrl = (value: string): boolean => /^wss?:\/\//i.test(value)

const normalizeBaseUrl = (value?: string, fallback?: string): string => {
  const raw = (value ?? fallback ?? '').trim()

  if (!raw) {
    return getBrowserOrigin()
  }

  if (isAbsoluteUrl(raw)) {
    return raw.replace(/\/$/, '')
  }

  if (raw.startsWith('/')) {
    return `${getBrowserOrigin()}${raw}`.replace(/\/$/, '')
  }

  return `${getBrowserOrigin()}/${raw.replace(/^\//, '')}`.replace(/\/$/, '')
}

const normalizeLiveKitUrl = (value?: string): string => {
  const raw = (value ?? '').trim()
  if (!raw) {
    return 'ws://localhost:7880'
  }

  if (isWebSocketUrl(raw)) {
    return raw.replace(/\/$/, '')
  }

  if (isAbsoluteUrl(raw)) {
    const parsed = new URL(raw)
    parsed.protocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:'
    return parsed.toString().replace(/\/$/, '')
  }

  return raw
}

export const API_BASE_URL = normalizeBaseUrl(
  import.meta.env?.VITE_API_BASE_URL as string | undefined,
)

export const SOCKET_BASE_URL = normalizeBaseUrl(
  import.meta.env?.VITE_SOCKET_BASE_URL as string | undefined,
  API_BASE_URL,
)

export const ASSET_BASE_URL = normalizeBaseUrl(
  import.meta.env?.VITE_UPLOADS_BASE_URL as string | undefined,
  API_BASE_URL,
)

export const LIVEKIT_URL = normalizeLiveKitUrl(
  import.meta.env?.VITE_LIVEKIT_URL as string | undefined,
)

/**
 * buildUrl helper for frontend API calls.
 * Supports both absolute env values and same-origin deployments behind a reverse proxy.
 */
export function buildUrl(
  path = '',
  params?: Record<string, string | number | boolean>,
): string {
  const trimmedPath = path ? path.replace(/^\//, '') : ''
  const url = trimmedPath
    ? new URL(trimmedPath, `${API_BASE_URL}/`)
    : new URL(API_BASE_URL)

  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.append(k, String(v))
    })
  }

  return url.toString()
}

export function buildSocketUrl(namespace = ''): string {
  const trimmedNamespace = namespace.replace(/^\/+/, '')
  if (!trimmedNamespace) {
    return SOCKET_BASE_URL
  }

  return new URL(trimmedNamespace, `${SOCKET_BASE_URL}/`).toString()
}

export function buildAssetUrl(path = ''): string {
  if (!path) return ''
  if (isAbsoluteUrl(path)) return path

  return new URL(path.replace(/^\/+/, ''), `${ASSET_BASE_URL}/`).toString()
}

export default buildUrl
