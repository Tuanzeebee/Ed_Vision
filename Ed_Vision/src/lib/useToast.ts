import { useState, useCallback } from 'react'
export type ToastType = 'success'| 'error'| 'warning'| 'info'
export interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'success', duration = 3000) => {
    const id = Math.random().toString(36).substr(2, 9)
    const toast: Toast = { id, message, type, duration }

    setToasts(prev =>[...prev, toast])

    if (duration >0) {
      setTimeout(() => {
        setToasts(prev =>prev.filter(t =>t.id !== id))
      }, duration)
    }
  }, [])

  const hideToast = useCallback((id: string) => {
    setToasts(prev =>prev.filter(t =>t.id !== id))
  }, [])

  const success = useCallback((message: string, duration?: number) => {
    showToast(message, 'success', duration)
  }, [showToast])

  const error = useCallback((message: string, duration?: number) => {
    showToast(message, 'error', duration)
  }, [showToast])

  const warning = useCallback((message: string, duration?: number) => {
    showToast(message, 'warning', duration)
  }, [showToast])

  const info = useCallback((message: string, duration?: number) => {
    showToast(message, 'info', duration)
  }, [showToast])

  return {
    toasts,
    showToast,
    hideToast,
    success,
    error,
    warning,
    info
  }
}