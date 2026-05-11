import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { buildUrl } from '@/services/api/config';
import { STUDENT_ASSETS } from '@/assets/student';
import { getAvatarUrl } from '@/lib/avatarUtils';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import NotificationDropdown from '@/components/layout/NotificationDropdown';

export default function Navbar() {
  const navigate = useNavigate();
  const { t } = useTranslation(['common', 'student']);
  const { isAuthenticated, user, logout, getUserRole } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState<'learn' | 'predict' | 'plan' | 'communicate' | 'survey' | null>(null);
  const navRef = useRef<HTMLDivElement | null>(null);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const userRole = getUserRole()?.toLowerCase();

  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => {
    if (!isAuthenticated) return null;
    return user?.avatarUrl || user?.avatar_url || user?.avatar || null;
  });

  const [displayName, setDisplayName] = useState<string | null>(() => {
    if (!isAuthenticated) return null;
    return user?.fullName || user?.full_name || user?.name || null;
  });

  const handleJoinNow = () => {
    navigate('/auth/login');
  };

  const handleProfileLogout = async () => {
    try {
      const email = user?.email;
      if (email) {
        await fetch(buildUrl('/auth/logout'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
      }
    } catch (error) {
      console.error('Logout notify failed', error);
    } finally {
      logout();
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (!navRef.current) return;
      if (!navRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };

    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  useEffect(() => {
    const fetchProfile = async (forceRefetch = false) => {
      if (!isAuthenticated) {
        setAvatarUrl(null);
        setDisplayName(null);
        return;
      }

      const existingAvatar = user?.avatarUrl || user?.avatar_url || user?.avatar;
      const existingName = user?.fullName || user?.full_name || user?.name;

      if (!forceRefetch && existingAvatar && existingName) {
        setAvatarUrl(existingAvatar);
        setDisplayName(existingName);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const response = await fetch(buildUrl('/profile/me'), {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (response.ok) {
          const profileData = await response.json();
          const avatar = profileData?.profile?.avatarUrl || profileData?.avatarUrl || null;
          const gender = profileData?.profile?.gender || null;
          const fullName = profileData?.profile?.fullName || profileData?.profile?.full_name || profileData?.fullName || null;

          const finalAvatar = getAvatarUrl(avatar, gender);
          setAvatarUrl(finalAvatar);

          if (fullName) {
            setDisplayName(fullName);
          }

          const userStr = localStorage.getItem('user');
          if (userStr) {
            try {
              const userObj = JSON.parse(userStr);
              userObj.avatarUrl = finalAvatar;
              userObj.avatar = finalAvatar;
              if (fullName) {
                userObj.fullName = fullName;
                userObj.full_name = fullName;
                userObj.name = fullName;
              }
              if (gender) {
                userObj.gender = gender;
              }
              localStorage.setItem('user', JSON.stringify(userObj));
            } catch (error) {
              console.error('Failed to update user data in localStorage', error);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch profile data:', error);
      }
    };

    fetchProfile();

    const handleAvatarUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{ url?: string; gender?: string; refetch?: boolean }>;

      if (customEvent.detail?.url) {
        setAvatarUrl(customEvent.detail.url);
      } else if (customEvent.detail?.refetch || customEvent.detail?.gender !== undefined) {
        fetchProfile(true);
      }
    };

    window.addEventListener('avatar-updated', handleAvatarUpdated);
    return () => {
      window.removeEventListener('avatar-updated', handleAvatarUpdated);
    };
  }, [isAuthenticated, user?.avatarUrl, user?.avatar_url, user?.avatar, user?.fullName, user?.full_name, user?.name]);

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!profileMenuRef.current) return;
      if (!profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setProfileMenuOpen(false);
    };

    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const navLinkClass = `text-sm font-medium transition-colors duration-300 ${
    isScrolled ? 'text-[#0D212C]/70 hover:text-[#0D212C]' : 'text-white/80 hover:text-white'
  }`;

  const navButtonClass = `flex items-center gap-1 ${navLinkClass}`;

  const dropdownVisibilityClass = (isOpen: boolean) => {
    if (isOpen) return 'opacity-100 visible';
    if (openMenu) return 'opacity-0 invisible';
    return 'opacity-0 invisible group-hover:opacity-100 group-hover:visible';
  };

  const caretClass = (isOpen: boolean) =>
    `w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : 'group-hover:rotate-180'}`;

  const toggleMenu = (menu: 'learn' | 'predict' | 'plan' | 'communicate' | 'survey') => {
    setOpenMenu((prev) => (prev === menu ? null : menu));
  };

  const studentName = displayName || user?.fullName || user?.full_name || user?.name || user?.email || 'Guest';
  const roleCode = (user?.roleRel?.code || user?.role || '') as string;
  const studentRole = roleCode || userRole || t('common:header.user.student');

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out ${
        isScrolled ? 'py-3' : 'py-6'
      }`}
    >
      <div 
        className={`max-w-5xl mx-auto px-6 transition-all duration-500 ease-in-out navbar-glass ${
          isScrolled 
            ? 'liquid-glass bg-white/60 backdrop-blur-xl py-2 rounded-full shadow-lg' 
            : 'bg-transparent py-3'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/src/assets/student/Logo_Predica.png"
              alt="Predica Logo"
              className="h-13 w-auto object-contain"
            />
            
            <div className="hidden md:flex gap-6 ml-8" ref={navRef}>
              {isAuthenticated ? (
                <>
                  <div className="relative group">
                    <button
                      type="button"
                      className={navButtonClass}
                      onClick={() => toggleMenu('learn')}
                      aria-expanded={openMenu === 'learn'}
                      aria-haspopup="true"
                    >
                      {t('common:header.navigation.learn')}
                      <svg className={caretClass(openMenu === 'learn')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <div
                      className={`absolute top-full left-0 w-64 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 transition-all duration-200 ${dropdownVisibilityClass(openMenu === 'learn')}`}
                    >
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
                              <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">
                                {t('common:header.menu.learn.certificateReview.badge', { defaultValue: 'New' })}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500">{t('common:header.menu.learn.certificateReview.description')}</div>
                          </div>
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="relative group">
                    <button
                      type="button"
                      className={navButtonClass}
                      onClick={() => toggleMenu('predict')}
                      aria-expanded={openMenu === 'predict'}
                      aria-haspopup="true"
                    >
                      {t('common:header.navigation.predict')}
                      <svg className={caretClass(openMenu === 'predict')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <div
                      className={`absolute top-full left-0 w-72 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 transition-all duration-200 ${dropdownVisibilityClass(openMenu === 'predict')}`}
                    >
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

                  <div className="relative group">
                    <button
                      type="button"
                      className={navButtonClass}
                      onClick={() => toggleMenu('plan')}
                      aria-expanded={openMenu === 'plan'}
                      aria-haspopup="true"
                    >
                      {t('common:header.navigation.plan')}
                      <svg className={caretClass(openMenu === 'plan')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <div
                      className={`absolute top-full left-0 w-64 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 transition-all duration-200 ${dropdownVisibilityClass(openMenu === 'plan')}`}
                    >
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

                  <div className="relative group">
                    <button
                      type="button"
                      className={navButtonClass}
                      onClick={() => toggleMenu('communicate')}
                      aria-expanded={openMenu === 'communicate'}
                      aria-haspopup="true"
                    >
                      {t('common:header.navigation.communicate')}
                      <svg className={caretClass(openMenu === 'communicate')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <div
                      className={`absolute top-full right-0 w-64 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 transition-all duration-200 ${dropdownVisibilityClass(openMenu === 'communicate')}`}
                    >
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

                  <div className="relative group">
                    <button
                      type="button"
                      className={navButtonClass}
                      onClick={() => toggleMenu('survey')}
                      aria-expanded={openMenu === 'survey'}
                      aria-haspopup="true"
                    >
                      {t('common:header.navigation.survey')}
                      <svg className={caretClass(openMenu === 'survey')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <div
                      className={`absolute top-full right-0 w-64 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 transition-all duration-200 ${dropdownVisibilityClass(openMenu === 'survey')}`}
                    >
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
              ) : (
                [
                  { name: t('student:landingV2.nav.forecast'), href: '#features' },
                  { name: t('student:landingV2.nav.certificates'), href: '#features' },
                  { name: t('student:landingV2.nav.planning'), href: '#about' },
                  { name: t('student:landingV2.nav.community'), href: '#about' }
                ].map((item) => (
                  <a key={item.name} href={item.href} className={navLinkClass}>
                    {item.name}
                  </a>
                ))
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <LanguageSwitcher
              variant="minimal"
              buttonClassName={navLinkClass}
            />
            {isAuthenticated && (
              <NotificationDropdown
                variant="minimal"
                buttonClassName={navLinkClass}
              />
            )}
            {!isAuthenticated ? (
              <button
                onClick={handleJoinNow}
                className={`rounded-full px-6 py-2 text-sm font-medium transition-all duration-300 ${
                isScrolled 
                  ? 'bg-[#0D212C] text-white hover:bg-[#0D212C]/90 shadow-md' 
                  : 'liquid-glass text-white hover:bg-white/10'
              }`}
              >
                {t('header.auth.login')}
              </button>
            ) : (
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setProfileMenuOpen((open) => !open)}
                  className={`group flex items-center gap-2 rounded-full px-2 py-1 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-200 ${
                    isScrolled ? 'text-[#0D212C]/70 hover:text-[#0D212C]' : 'text-white/80 hover:text-white'
                  }`}
                  aria-expanded={profileMenuOpen}
                  aria-haspopup="true"
                  aria-label={studentName}
                >
                  <img
                    src={avatarUrl || user?.avatarUrl || user?.avatar_url || user?.avatar || STUDENT_ASSETS.defaultAvatar}
                    alt="User Avatar"
                    className="w-10 h-10 rounded-full object-cover border-2 border-purple-500"
                    onError={(event) => {
                      const target = event.target as HTMLImageElement;
                      target.src = STUDENT_ASSETS.defaultAvatar;
                    }}
                  />
                  <div
                    className={`hidden sm:block text-left overflow-hidden whitespace-nowrap transition-all duration-200 ${
                      profileMenuOpen
                        ? 'max-w-[140px] opacity-100'
                        : 'max-w-0 opacity-0 group-hover:max-w-[140px] group-hover:opacity-100'
                    }`}
                  >
                    <p className={`text-sm font-semibold ${isScrolled ? 'text-[#0D212C]/70' : 'text-white/90'}`}>
                      {studentName}
                    </p>
                    <p className={`text-xs ${isScrolled ? 'text-[#0D212C]/50' : 'text-white/70'}`}>
                      {studentRole}
                    </p>
                  </div>
                  <svg className={`w-4 h-4 transform transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                      <p className="text-sm font-bold text-slate-800">{studentName}</p>
                      <p className="text-xs text-slate-500">{studentRole}</p>
                    </div>
                    <div className="p-1">
                      <button
                        onClick={() => {
                          setProfileMenuOpen(false);
                          if (userRole === 'teacher') {
                            navigate('/teacher/profile');
                          } else {
                            navigate('/profile');
                          }
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg w-full"
                      >
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {`${t('navigation.view')} ${t('navigation.profile')}`}
                      </button>

                      <button
                        onClick={() => {
                          setProfileMenuOpen(false);
                          if (userRole === 'teacher') {
                            navigate('/teacher/settings');
                          } else if (userRole === 'admin') {
                            navigate('/admin/settings');
                          } else {
                            navigate('/settings');
                          }
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg w-full"
                      >
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {t('navigation.settings')}
                      </button>

                      <div className="h-px bg-slate-100 my-1"></div>

                      <button
                        onClick={async () => {
                          setProfileMenuOpen(false);
                          await handleProfileLogout();
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg w-full"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        {t('navigation.logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
