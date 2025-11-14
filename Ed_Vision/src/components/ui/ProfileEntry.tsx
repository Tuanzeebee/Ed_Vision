import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import StudentProfile from '@/modules/student/StudentProfile'
import TeacherProfile from '@/modules/teacher/TeacherProfile'

function InlineSpinner({ text = 'Loading...', size = 'md' }: { text?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses: Record<string,string> = { sm: 'w-6 h-6', md: 'w-10 h-10', lg: 'w-14 h-14' }
  return (
    <div className="flex flex-col items-center justify-center">
      <div className={`${sizeClasses[size]} border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mb-3`}></div>
      <div className="text-sm text-gray-600">{text}</div>
    </div>
  )
}

/**
 * ProfileEntry acts as a bridge/dispatcher: it waits for auth readiness,
 * determines the account role from the session, and then renders the
 * corresponding module-specific profile component.
 */
export default function ProfileEntry() {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const userType = useMemo(() => {
    if (!isAuthenticated) return null
    const roleCode = (user?.roleRel?.code || user?.role || '').toString().toLowerCase()
    if (roleCode.includes('teacher') || roleCode.includes('instructor')) return 'instructor'
    if (roleCode.includes('admin')) return 'admin'
    return 'student'
  }, [user, isAuthenticated])

  // If not authenticated, redirect to login. If admin, redirect to admin dashboard.
  useEffect(() => {
    if (isAuthenticated === false) {
      navigate('/auth/login')
      return
    }

    if (userType === 'admin') {
      navigate('/admin/dashboard')
    }
  }, [isAuthenticated, userType, navigate])

  // While auth state is initializing, show a spinner.
  if (isAuthenticated === undefined || userType === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-full max-w-xl p-6">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <InlineSpinner text={"Đang tải thông tin tài khoản..."} size="md" />
          </div>
        </div>
      </div>
    )
  }

  // Render the module-specific profile component. Keep previous wrapper
  // behavior: student view used Header/Footer, instructor did not.
  if (userType === 'instructor') {
    return <TeacherProfile />
  }

  // default -> student
  return <StudentProfile />
}
