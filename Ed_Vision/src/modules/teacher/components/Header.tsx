import { Search, ChevronDown } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { buildUrl } from '@/services/api/config';
import { useNavigate } from 'react-router-dom';
import { getAvatarUrl } from '@/lib/avatarUtils';

// Asset imports - Update these paths to match your actual assets
import imgLogo from "@/assets/teacher/9ba9709b329a1fc3361b3b789060fd60189be79f.png"
import imgAvatar from "@/assets/teacher/1162b70d9bce3d9bc46857cc86bb8bdc5c5e3d08.png"
export default function Header() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [teacherName, setTeacherName] = useState<string>('Giảng viên')
  const [profileOpen, setProfileOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchProfile = async () => {
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
          const gender = profileData?.profile?.gender || null
          const fullName = profileData?.profile?.fullName || profileData?.profile?.full_name || profileData?.fullName || 'Giảng viên'
          const academicTitle = profileData?.profile?.academicTitle || profileData?.profile?.academic_title || profileData?.academicTitle || ''
          
          setAvatarUrl(getAvatarUrl(avatar, gender))
          
          if (fullName) {
            setTeacherName(academicTitle ? `${academicTitle} ${fullName}` : fullName)
          }
        }
      } catch (error) {
        console.error('Failed to fetch teacher profile:', error)
      }
    }

    fetchProfile()

    // Listen for avatar-updated event
    const handleAvatarUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<{ url?: string; gender?: string; refetch?: boolean }>
      
      if (customEvent.detail?.url) {
        setAvatarUrl(customEvent.detail.url)
      } else if (customEvent.detail?.refetch || customEvent.detail?.gender !== undefined) {
        fetchProfile()
      }
    }

    window.addEventListener('avatar-updated', handleAvatarUpdated)
    return () => {
      window.removeEventListener('avatar-updated', handleAvatarUpdated)
    }
  }, [])

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return
      if (!menuRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }

    document.addEventListener('click', onDocClick)
    return () => {
      document.removeEventListener('click', onDocClick)
    }
  }, [])

  const handleLogout = async () => {
    setProfileOpen(false)
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        await fetch(buildUrl('/auth/logout'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json'},
          body: JSON.stringify({ email: user.email }),
        })
      }
    } catch (e) {
      console.error('Logout notify failed', e)
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      navigate('/auth/login')
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          <img src={imgLogo} alt="Logo"className="w-10 h-10 rounded-lg"/>
          <h1 className="text-xl font-bold text-gray-800">Giảng viên Dashboard</h1>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"/>
            <input
              placeholder="Tìm kiếm sinh viên..."className="pl-10 pr-4 py-2 w-80 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"/>
          </div>

          <div className="relative"ref={menuRef}>
            <button 
              onClick={() =>setProfileOpen(!profileOpen)}
              className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors">
              <img 
                src={avatarUrl || imgAvatar} 
                alt="Avatar"className="w-8 h-8 rounded-full object-cover"onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = imgAvatar
                }}
              />
              <div className="flex flex-col">
                <span className="text-sm text-gray-700">{teacherName}</span>
                <span className="text-xs text-gray-500">Giảng viên</span>
              </div>
              <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${profileOpen ? 'rotate-180': ''}`} />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                  <p className="text-sm font-bold text-slate-800">{teacherName}</p>
                  <p className="text-xs text-slate-500">Giảng viên</p>
                </div>
                <div className="p-1">
                  <button
                    onClick={() => {
                      setProfileOpen(false)
                      navigate('/teacher/settings')
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg w-full">
                    <svg className="w-4 h-4 text-slate-400"fill="none"viewBox="0 0 24 24"stroke="currentColor">
                      <path strokeLinecap="round"strokeLinejoin="round"strokeWidth="2"d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                      <path strokeLinecap="round"strokeLinejoin="round"strokeWidth="2"d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>Settings
                  </button>
                  
                  <div className="h-px bg-slate-100 my-1"></div>
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg w-full">
                    <svg className="w-4 h-4"fill="none"viewBox="0 0 24 24"stroke="currentColor">
                      <path strokeLinecap="round"strokeLinejoin="round"strokeWidth="2"d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                    </svg>Logout
                  </button>
                </div>
              </div>)}
          </div>
        </div>
      </div>
    </header>);
}
