import { STUDENT_ASSETS } from "@/assets/student"
import { Button } from "../ui/student/Student_button"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import LanguageSwitcher from "../LanguageSwitcher"
import { useEffect, useRef, useState } from 'react'
import { buildUrl } from '@/services/api/config'
import { useAuth } from '@/hooks/useAuth'

type Props = {
  className?: string
  showNavigation?: boolean
  isLandingPage?: boolean
  isAdminMode?: boolean
  isTeacherMode?: boolean
  onLogin?: () => void
  onRegister?: () => void
}

export default function Header({
  className = "",
  showNavigation = true,
  isLandingPage = false,
  isAdminMode = false,
  isTeacherMode = false,
  onLogin,
  onRegister
}: Props) {
  const { t } = useTranslation(['common'])
  const navigate = useNavigate()

  // Use auth hook for authentication state
  const { isAuthenticated, user, getDashboardPath, logout } = useAuth()

  // Local UI state for the profile menu 
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return
      if (!menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
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

  // Auth state is managed by useAuth hook - no need for manual event listeners

  // Get user display info
  const studentName = user?.fullName || user?.name || user?.email || (isAdminMode ? "Admin User" : isTeacherMode ? "Teacher" : "Guest")
  const roleCode = (user?.roleRel?.code || user?.role || '') as string
  const studentRole = roleCode ? roleCode : (isAdminMode ? t('common:header.user.administrator') : isTeacherMode ? "Giảng viên" : t('common:header.user.student'))

  const handleLogoClick = () => {
    // Navigate according to the logged-in user's role when available
    if (isAuthenticated) {
      const dashboardPath = getDashboardPath()
      navigate(dashboardPath)
    } else {
      // Fallback when not authenticated
      if (isAdminMode) {
        navigate('/admin/overview')
      } else if (isTeacherMode) {
        navigate('/teacher/dashboard')
      } else {
        navigate('/student/landing')
      }
    }
  }

  // mark unused prop as referenced to satisfy strict linting
  void isLandingPage

  return (
    <header className={`bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50 ${className}`}>
      <div className="w-full pl-6 pr-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo - sát bên trái với margin 24px */}
          <div
            className="flex items-center cursor-pointer"
            onClick={handleLogoClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleLogoClick()
              }
            }}
          >
            {isAdminMode ? (
              <h1 className="text-2xl font-bold text-gray-900">PREDICA</h1>
            ) : isTeacherMode ? (
              <img src="/src/assets/shared/logo_predica.jpg" alt="Predica Logo" className="h-13 w-auto object-contain" />
            ) : (
              <img src="/src/assets/shared/logo_predica.jpg" alt="Predica Logo" className="h-13 w-auto object-contain" />
            )}
          </div>          {/* Navigation - chỉ hiển thị khi không phải admin mode và teacher mode */}
          {showNavigation && !isAdminMode && !isTeacherMode && (
            <nav className="hidden md:flex items-center space-x-8">
              {/* Our Features Dropdown */}
              <div className="relative group">
                <button className="flex items-center space-x-1 text-gray-700 hover:text-purple-500 transition-colors font-medium cursor-pointer">
                  <span>{t('common:header.navigation.ourFeatures')}</span>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="py-3">
                    <a href="#" className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium">{t('common:header.features.gradeForecasting.title')}</div>
                        <div className="text-xs text-gray-500">{t('common:header.features.gradeForecasting.description')}</div>
                      </div>
                    </a>
                    <a href="#" className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium">{t('common:header.features.performanceAnalytics.title')}</div>
                        <div className="text-xs text-gray-500">{t('common:header.features.performanceAnalytics.description')}</div>
                      </div>
                    </a>
                    <a href="#" className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium">{t('common:header.features.studyOptimization.title')}</div>
                        <div className="text-xs text-gray-500">{t('common:header.features.studyOptimization.description')}</div>
                      </div>
                    </a>
                  </div>
                </div>
              </div>

              {/* Research */}
              <a href="#" className="text-gray-700 hover:text-purple-500 transition-colors font-medium cursor-pointer">
                {t('common:header.navigation.research')}
              </a>

              {/* For Educators Dropdown */}
              <div className="relative group">
                <button className="flex items-center space-x-1 text-gray-700 hover:text-purple-500 transition-colors font-medium cursor-pointer">
                  <span>{t('common:header.navigation.forEducators')}</span>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="py-2">
                    <a href="/booking/scheduler" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">{t('common:header.educators.bookingScheduler')}</a>
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">{t('common:header.educators.classManagement')}</a>
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">{t('common:header.educators.studentProgressTracking')}</a>
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">{t('common:header.educators.parentCommunication')}</a>
                  </div>
                </div>
              </div>

              {/* For Enterprise */}
              <a href="#" className="text-gray-700 hover:text-purple-500 transition-colors font-medium cursor-pointer">
                {t('common:header.navigation.forEnterprise')}
              </a>
            </nav>
          )}

          {/* User Profile or Auth Buttons */}
          <div className="flex items-center space-x-4">
            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* If not authenticated show login/register buttons, otherwise show profile dropdown */}
            {!isAuthenticated ? (
              // Auth buttons for landing / unauthenticated pages
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (onLogin) return onLogin()
                    navigate('/auth/login')
                  }}
                  className="border-2 border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:border-purple-500 hover:text-purple-500 transition-all duration-200"
                >
                  {t('common:header.auth.login')}
                </Button>
                <Button
                  onClick={() => {
                    if (onRegister) return onRegister()
                    navigate('/auth/register')
                  }}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  {t('common:header.auth.register')}
                </Button>
              </div>
            ) : (
              // User profile dropdown for authenticated pages
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((s) => !s)}
                  className="flex items-center space-x-3 bg-white hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-200"
                  aria-expanded={menuOpen}
                >
                  <img src={user?.avatar || STUDENT_ASSETS.defaultAvatar}
                    alt="User Avatar"
                    className="w-10 h-10 rounded-full object-cover border-2 border-purple-500" />
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-semibold text-gray-900">{studentName}</p>
                    <p className="text-xs text-gray-500">{studentRole}</p>
                  </div>
                  <svg className={`w-4 h-4 text-gray-400 transform transition-transform ${menuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>

                {/* Dropdown menu */}
                {menuOpen && (
                  <div className="absolute right-0 mt-2 min-w-max bg-white rounded-lg shadow-lg border border-gray-100 z-50 overflow-hidden">
                    <div className="flex flex-col py-1 px-2">
                      {/* Profile button */}
                      <button
                        onClick={() => {
                          setMenuOpen(false)
                          if (isTeacherMode) {
                            navigate('/teacher/profile')
                          } else {
                            navigate('/student/profile')
                          }
                        }}
                        className="px-2 py-1 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-2 rounded-md"
                      >
                        <svg
                          className="w-4 h-4 text-purple-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5.121 17.804A13.937 13.937 0 0112 15c2.761 0 5.286.7 7.379 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        Profile
                      </button>

                      {/* Divider */}
                      <div className="my-1 border-t border-gray-100"></div>

                      {/* Logout button */}
                      <button
                        onClick={async () => {
                          setMenuOpen(false)
                          try {
                            const email = user?.email
                            if (email) {
                              await fetch(buildUrl('/auth/logout'), {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ email }),
                              })
                            }
                          } catch (e) {
                            console.error('Logout notify failed', e)
                          } finally {
                            // Use the logout function from useAuth hook
                            logout()
                          }
                        }}
                        className="px-2 py-1 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 flex items-center gap-2 rounded-md"
                      >
                        <svg
                          className="w-4 h-4 text-red-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M17 16l4-4m0 0l-4-4m4 4H7"
                          />
                        </svg>
                        Logout
                      </button>
                    </div>
                  </div>

                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}