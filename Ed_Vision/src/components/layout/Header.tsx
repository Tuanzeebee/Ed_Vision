import { STUDENT_ASSETS } from "@/assets/student"
import { Button } from "../ui/student/Student_button"
import { useNavigate, useLocation, Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import LanguageSwitcher from "../LanguageSwitcher"
import { useEffect, useRef, useState } from 'react'
import { buildUrl } from '@/services/api/config'
import { useAuth } from '@/hooks/useAuth'
import NotificationDropdown from './NotificationDropdown'

type Props = {
  className?: string
  showNavigation?: boolean
  isLandingPage?: boolean
  isAdminMode?: boolean
  isTeacherMode?: boolean
  isParentMode?: boolean
  onLogin?: () => void
  onRegister?: () => void
}

export default function Header({
  className = "",
  showNavigation = true,
  isLandingPage = false,
  isAdminMode = false,
  isTeacherMode = false,
  isParentMode = false,
  onLogin,
  onRegister
}: Props) {
  const { t } = useTranslation(['common'])
  const navigate = useNavigate()
  const location = useLocation()

  // Use auth hook for authentication state
  const { isAuthenticated, user, getDashboardPath, logout, getUserRole } = useAuth()
  
  // Get user role for conditional navigation
  const userRole = getUserRole()?.toLowerCase()

  // Local UI state for the profile menu and avatar
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  // Initialize avatar and name from user object immediately (no flash)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => {
    if (!isAuthenticated) return null
    return user?.avatarUrl || user?.avatar_url || user?.avatar || null
  })

  const [displayName, setDisplayName] = useState<string | null>(() => {
    if (!isAuthenticated) return null
    return user?.fullName || user?.full_name || user?.name || null
  })

  // Fetch avatar and profile name from profile API
  useEffect(() => {
    const fetchProfile = async (forceRefetch = false) => {
      if (!isAuthenticated) {
        setAvatarUrl(null)
        setDisplayName(null)
        return
      }

      // Check if user object already has full data (skip if force refetch)
      const existingAvatar = user?.avatarUrl || user?.avatar_url || user?.avatar
      const existingName = user?.fullName || user?.full_name || user?.name

      if (!forceRefetch && existingAvatar && existingName) {
        setAvatarUrl(existingAvatar)
        setDisplayName(existingName)
        return
      }

      // Fetch from profile API
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(buildUrl('/profile/me'), {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })

        if (response.ok) {
          const profileData = await response.json()
          const avatar = profileData?.profile?.avatarUrl || profileData?.avatarUrl || null
          const fullName = profileData?.profile?.fullName || profileData?.profile?.full_name || profileData?.fullName || null

          if (avatar) {
            setAvatarUrl(avatar)
          }

          if (fullName) {
            setDisplayName(fullName)
          }

          // Update user object in localStorage
          const userStr = localStorage.getItem('user')
          if (userStr) {
            try {
              const userObj = JSON.parse(userStr)
              if (avatar) {
                userObj.avatarUrl = avatar
                userObj.avatar = avatar
              }
              if (fullName) {
                userObj.fullName = fullName
                userObj.full_name = fullName
                userObj.name = fullName
              }
              localStorage.setItem('user', JSON.stringify(userObj))
            } catch (e) {
              console.error('Failed to update user data in localStorage', e)
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch profile data:', error)
      }
    }

    fetchProfile()

    // Listen for avatar-updated event from profile pages
    const handleAvatarUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<{ url: string }>
      if (customEvent.detail?.url) {
        setAvatarUrl(customEvent.detail.url)
      } else {
        // Refetch profile if no URL provided
        fetchProfile(true)
      }
    }

    window.addEventListener('avatar-updated', handleAvatarUpdated)
    return () => {
      window.removeEventListener('avatar-updated', handleAvatarUpdated)
    }
  }, [isAuthenticated, user?.avatarUrl, user?.avatar_url, user?.avatar, user?.fullName, user?.full_name, user?.name])

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

  // Get user display info - prioritize fullName from state or user object, fallback to email
  const studentName = displayName || user?.fullName || user?.full_name || user?.name || user?.email || (isAdminMode ? "Admin User" : isTeacherMode ? "Teacher" : "Guest")
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
        navigate('/admin/dashboard')
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
          </div>          {/* Navigation - chỉ hiển thị cho sinh viên, parent và trang chủ khi chưa login */}
          {showNavigation && (isLandingPage || (!isAuthenticated) || (isAuthenticated && (userRole === 'student' || userRole === 'parent'))) && !isAdminMode && !isTeacherMode && (
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
              {/* Student Navigation */}
              {userRole === 'student' && (
                <>
              {/* Learn Dropdown */}
              <div className="relative group">
                <button className="flex items-center gap-1 px-4 py-2.5 rounded-lg text-base font-medium transition-all text-slate-600 hover:text-purple-600 hover:bg-slate-50">
                  {t('common:header.navigation.learn')}
                  <svg className="w-4 h-4 transition-transform duration-200 group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute top-full left-0 w-64 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="p-2 space-y-1">
                    <a href="/student/course-overview" className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="mt-1 p-1.5 rounded-md bg-blue-50 text-blue-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{t('common:header.menu.learn.courseOverview.title')}</div>
                        <div className="text-xs text-slate-500">{t('common:header.menu.learn.courseOverview.description')}</div>
                      </div>
                    </a>
                    <a href="/student/upload-transcript" className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="mt-1 p-1.5 rounded-md bg-purple-50 text-purple-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{t('common:header.menu.learn.uploadTranscript.title')}</div>
                        <div className="text-xs text-slate-500">{t('common:header.menu.learn.uploadTranscript.description')}</div>
                      </div>
                    </a>
                    <a href="/student/course-detail" className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="mt-1 p-1.5 rounded-md bg-indigo-50 text-indigo-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{t('common:header.menu.learn.courseDetail.title')}</div>
                        <div className="text-xs text-slate-500">{t('common:header.menu.learn.courseDetail.description')}</div>
                      </div>
                    </a>
                    <a href="/student/learning-space" className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="mt-1 p-1.5 rounded-md bg-indigo-50 text-indigo-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{t('common:header.menu.learn.learningSpace.title')}</div>
                        <div className="text-xs text-slate-500">{t('common:header.menu.learn.learningSpace.description')}</div>
                      </div>
                    </a>
                    <a href="/student/certificate-review" className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors border-t border-slate-50 mt-1 pt-2">
                      <div className="mt-1 p-1.5 rounded-md bg-amber-50 text-amber-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                          {t('common:header.menu.learn.certificateReview.title')}
                          <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">Mới</span>
                        </div>
                        <div className="text-xs text-slate-500">{t('common:header.menu.learn.certificateReview.description')}</div>
                      </div>
                    </a>
                  </div>
                </div>
              </div>

              {/* Predict Dropdown */}
              <div className="relative group">
                <button className="flex items-center gap-1 px-4 py-2.5 rounded-lg text-base font-medium transition-all text-slate-600 hover:text-purple-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 hover:border hover:border-purple-100">
                  <svg className="w-4 h-4 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                  {t('common:header.navigation.predict')}
                  <svg className="w-4 h-4 transition-transform duration-200 group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute top-full left-0 w-72 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="p-2 space-y-1">
                    <a href="/student/grade-forecast" className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-purple-50 to-white hover:from-purple-100 transition-colors border border-purple-100/50">
                      <div className="mt-1 p-1.5 rounded-md bg-purple-600 text-white shadow-sm">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-purple-600">{t('common:header.menu.predict.gradeForecast.title')}</div>
                        <div className="text-xs text-slate-500">{t('common:header.menu.predict.gradeForecast.description')}</div>
                      </div>
                    </a>
                    <a href="/student/prediction-history" className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="mt-1 p-1.5 rounded-md bg-slate-100 text-slate-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{t('common:header.menu.predict.predictionHistory.title')}</div>
                        <div className="text-xs text-slate-500">{t('common:header.menu.predict.predictionHistory.description')}</div>
                      </div>
                    </a>
                  </div>
                </div>
              </div>

              {/* Plan Dropdown */}
              <div className="relative group">
                <button className="flex items-center gap-1 px-4 py-2.5 rounded-lg text-base font-medium transition-all text-slate-600 hover:text-purple-600 hover:bg-slate-50">
                  {t('common:header.navigation.plan')}
                  <svg className="w-4 h-4 transition-transform duration-200 group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute top-full left-0 w-64 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="p-2 space-y-1">
                    <a href="/student/academic-planning" className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="mt-1 p-1.5 rounded-md bg-green-50 text-green-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{t('common:header.menu.plan.academicPlanning.title')}</div>
                        <div className="text-xs text-slate-500">{t('common:header.menu.plan.academicPlanning.description')}</div>
                      </div>
                    </a>
                    <a href="/student/adjust-parameters" className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="mt-1 p-1.5 rounded-md bg-orange-50 text-orange-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{t('common:header.menu.plan.adjustParameters.title')}</div>
                        <div className="text-xs text-slate-500">{t('common:header.menu.plan.adjustParameters.description')}</div>
                      </div>
                    </a>
                  </div>
                </div>
              </div>

              {/* Communicate Dropdown */}
              <div className="relative group">
                <button className="flex items-center gap-1 px-4 py-2.5 rounded-lg text-base font-medium transition-all text-slate-600 hover:text-purple-600 hover:bg-slate-50">
                  {t('common:header.navigation.communicate')}
                  <svg className="w-4 h-4 transition-transform duration-200 group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute top-full right-0 w-64 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="p-2 space-y-1">
                    <a href="/student/chat-student" className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="mt-1 p-1.5 rounded-md bg-blue-50 text-blue-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{t('common:header.menu.communicate.chatWithTeachers.title')}</div>
                        <div className="text-xs text-slate-500">{t('common:header.menu.communicate.chatWithTeachers.description')}</div>
                      </div>
                    </a>
                    <a href="/student/chat-student" className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="mt-1 p-1.5 rounded-md bg-pink-50 text-pink-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{t('common:header.menu.communicate.messages.title')}</div>
                        <div className="text-xs text-slate-500">{t('common:header.menu.communicate.messages.description')}</div>
                      </div>
                    </a>
                    <a href="/appointments" className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="mt-1 p-1.5 rounded-md bg-indigo-50 text-indigo-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{t('common:header.menu.communicate.appointments.title')}</div>
                        <div className="text-xs text-slate-500">{t('common:header.menu.communicate.appointments.description')}</div>
                      </div>
                    </a>
                  </div>
                </div>
              </div>

              {/* Survey Dropdown */}
              <div className="relative group">
                <button className="flex items-center gap-1 px-4 py-2.5 rounded-lg text-base font-medium transition-all text-slate-600 hover:text-purple-600 hover:bg-slate-50">
                  <svg className="w-4 h-4 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                  {t('common:header.navigation.survey')}
                  <svg className="w-4 h-4 transition-transform duration-200 group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute top-full right-0 w-64 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="p-2 space-y-1">
                    <a href="/student/survey" className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="mt-1 p-1.5 rounded-md bg-emerald-50 text-emerald-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{t('common:header.menu.survey.takeSurvey.title')}</div>
                        <div className="text-xs text-slate-500">{t('common:header.menu.survey.takeSurvey.description')}</div>
                      </div>
                    </a>
                    <a href="/student/survey-history" className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="mt-1 p-1.5 rounded-md bg-amber-50 text-amber-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{t('common:header.menu.survey.surveyHistory.title')}</div>
                        <div className="text-xs text-slate-500">{t('common:header.menu.survey.surveyHistory.description')}</div>
                      </div>
                    </a>
                  </div>
                </div>
              </div>
              </>
              )}

              {/* Parent Navigation */}
              {userRole === 'parent' && (
                <>
                  {/* Dashboard Link */}
                  <Link 
                    to="/parent/dashboard" 
                    className={`px-4 py-2.5 rounded-lg text-base font-medium transition-all ${
                      location.pathname === '/parent/dashboard'
                        ? 'bg-purple-100 text-purple-700 font-semibold'
                        : 'text-slate-600 hover:text-purple-600 hover:bg-slate-50'
                    }`}
                  >
                    {t('common:header.navigation.dashboard') || 'Dashboard'}
                  </Link>

                  {/* Book Appointment Link */}
                  <Link 
                    to="/appointments" 
                    className={`px-4 py-2.5 rounded-lg text-base font-medium transition-all ${
                      location.pathname === '/appointments'
                        ? 'bg-purple-100 text-purple-700 font-semibold'
                        : 'text-slate-600 hover:text-purple-600 hover:bg-slate-50'
                    }`}
                  >
                    {t('common:header.navigation.bookAppointment') || 'Book Appointment'}
                  </Link>

                  {/* Student Details Link */}
                  <Link 
                    to="/parent/student-details" 
                    className={`px-4 py-2.5 rounded-lg text-base font-medium transition-all ${
                      location.pathname === '/parent/student-details'
                        ? 'bg-purple-100 text-purple-700 font-semibold'
                        : 'text-slate-600 hover:text-purple-600 hover:bg-slate-50'
                    }`}
                  >
                    {t('common:header.navigation.studentDetails') || 'Student Details'}
                  </Link>

                  {/* Chat Link */}
                  <Link 
                    to="/parent/chat" 
                    className={`px-4 py-2.5 rounded-lg text-base font-medium transition-all ${
                      location.pathname === '/parent/chat'
                        ? 'bg-purple-100 text-purple-700 font-semibold'
                        : 'text-slate-600 hover:text-purple-600 hover:bg-slate-50'
                    }`}
                  >
                    {t('common:header.navigation.chat') || 'Chat'}
                  </Link>
                </>
              )}
            </nav>
          )}

          {/* User Profile or Auth Buttons */}
          <div className="flex items-center space-x-4">
            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Notification Dropdown - For All Authenticated Users */}
            {isAuthenticated && (
              <NotificationDropdown
                isAdminMode={isAdminMode}
                isTeacherMode={isTeacherMode}
                isParentMode={isParentMode}
              />
            )}

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
                  className="flex items-center space-x-3 bg-white hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-200 cursor-pointer"
                  aria-expanded={menuOpen}
                >
                  <img
                    src={avatarUrl || user?.avatarUrl || user?.avatar_url || user?.avatar || STUDENT_ASSETS.defaultAvatar}
                    alt="User Avatar"
                    className="w-10 h-10 rounded-full object-cover border-2 border-purple-500"
                    onError={(e) => {
                      // Fallback to default avatar if image fails to load
                      const target = e.target as HTMLImageElement
                      target.src = STUDENT_ASSETS.defaultAvatar
                    }}
                  />
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
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                      <p className="text-sm font-bold text-slate-800">{studentName}</p>
                      <p className="text-xs text-slate-500">{studentRole}</p>
                    </div>
                    <div className="p-1">
                      {/* View Profile - Only for student and teacher, not admin */}
                      {!isAdminMode && (
                        <button
                          onClick={() => {
                            setMenuOpen(false)
                            if (isTeacherMode) {
                              navigate('/teacher/profile')
                            } else {
                              navigate('/profile')
                            }
                          }}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg w-full"
                        >
                          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          View Profile
                        </button>
                      )}

                      {/* Settings */}
                      <button
                        onClick={() => {
                          setMenuOpen(false)
                          if (isTeacherMode) {
                            navigate('/teacher/settings')
                          } else if (isAdminMode) {
                            navigate('/admin/settings')
                          } else {
                            navigate('/settings')
                          }
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
                            logout()
                          }
                        }}
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
            )}
          </div>
        </div>
      </div>
    </header>
  )
}