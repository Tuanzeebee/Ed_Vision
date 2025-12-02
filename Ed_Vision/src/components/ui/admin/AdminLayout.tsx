import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from 'react-i18next'
import { buildUrl } from '@/services/api/config'
import AdminSidebar from './AdminSidebar'
import AutoBreadcrumb from './AutoBreadcrumb'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { STUDENT_ASSETS } from '@/assets/student'

function BellIcon() {
  return (
    <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  )
}

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { t } = useTranslation(['common'])
  const navigate = useNavigate()

  // --- State giống Header.tsx: user + dropdown ---
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [user, setUser] = useState<any>(() => {
    try {
      const raw = localStorage.getItem('user')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  // Close dropdown khi click ngoài / nhấn Esc
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('click', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('click', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  // Đồng bộ khi login/logout từ nơi khác
  useEffect(() => {
    function onLogin(e: Event) {
      try {
        const detail = (e as any).detail
        if (detail) setUser(detail)
        else {
          const raw = localStorage.getItem('user')
          setUser(raw ? JSON.parse(raw) : null)
        }
      } catch {
        setUser(null)
      }
    }
    function onLogout() {
      setUser(null)
    }
    function onStorage(e: StorageEvent) {
      if (e.key === 'user' || e.key === 'token') {
        try { setUser(e.newValue ? JSON.parse(e.newValue) : null) } catch { setUser(null) }
      }
    }
    window.addEventListener('auth:login', onLogin as EventListener)
    window.addEventListener('auth:logout', onLogout)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('auth:login', onLogin as EventListener)
      window.removeEventListener('auth:logout', onLogout)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  // prefer any avatar from the user; fall back to the shared STUDENT_ASSETS default (remote URL)
  const avatar = user?.avatar || STUDENT_ASSETS.defaultAvatar
  const displayName = user?.fullName || user?.name || user?.email || 'Admin'
  const roleCode = (user?.roleRel?.code || user?.role || '').toString().toLowerCase()
  const roleLabel = roleCode ? roleCode : t('common:header.user.administrator')

  const handleLogoClick = () => navigate('/admin/dashboard')

  const { logout } = useAuth()

  const handleLogout = async () => {
    setMenuOpen(false)
    try {
      const email = user?.email
      if (email) {
        await fetch(buildUrl('/auth/logout'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        })
      }
    } catch (e) {
      console.error('Logout notify failed', e)
    } finally {
      // Delegate to centralized logout which performs full cleanup and redirect
      try {
        logout()
      } catch (e) {
        // Fallback: clear and redirect to student landing
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('rolePermissions')
        window.location.href = '/student/landing'
      }
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* HEADER: phong cách giống Header.tsx nhưng cho Admin, KHÔNG có nav menu */}
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="w-full px-6">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div
              className="flex items-center cursor-pointer"
              onClick={handleLogoClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleLogoClick() }}
            >

              {
                <img src="/src/assets/shared/logo_predica.jpg" alt="Predica Logo" className="h-13 w-auto object-contain" />
              }
            </div>

            {/* Right: LanguageSwitcher + Chuông + Avatar + Dropdown (chỉ có Logout) */}
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />

              <div className="relative">
                <button aria-label="Notifications" className="p-2 rounded-lg hover:bg-gray-100">
                  <BellIcon />
                </button>
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
              </div>

              {/* Avatar + tên + vai trò + caret giống style cũ */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(s => !s)}
                  className="flex items-center space-x-3 bg-white hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-200"
                  aria-expanded={menuOpen}
                >
                  <img src={avatar}
                    alt={displayName}
                    className="w-10 h-10 rounded-full object-cover border-2 border-purple-500" />
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-semibold text-gray-900">{displayName}</p>
                    <p className="text-xs text-gray-500">{roleLabel}</p>
                  </div>
                  <svg
                    className={`w-4 h-4 text-gray-400 transform transition-transform ${menuOpen ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>

                {/* Dropdown: Settings + Logout với giao diện mới */}
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                      <p className="text-sm font-bold text-slate-800">{displayName}</p>
                      <p className="text-xs text-slate-500">{roleLabel}</p>
                    </div>
                    <div className="p-1">
                      {/* Settings */}
                      <button
                        onClick={() => {
                          setMenuOpen(false)
                          navigate('/admin/settings')
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg w-full"
                      >
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Settings
                      </button>
                      
                      <div className="h-px bg-slate-100 my-1"></div>
                      
                      {/* Logout */}
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg w-full"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* BODY: Sidebar + Main */}
      <div className="flex flex-1 min-h-0">
        <div className="flex-shrink-0">
          <AdminSidebar />
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <AutoBreadcrumb />
          <div className="flex-1 p-6 bg-gray-50 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
