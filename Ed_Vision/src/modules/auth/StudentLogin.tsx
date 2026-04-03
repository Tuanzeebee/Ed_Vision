import { Card, CardContent } from "@/components/ui/student/Student_card"
import { Button } from "@/components/ui/student/Student_button"
import { Input } from "@/components/ui/student/Input"
import { BackButton } from "@/components/ui/student/Student_BackButton"
import { ToastContainer } from "@/components/ui/Toast"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { buildUrl } from '@/services/api/config'
import { useToast } from '@/lib/useToast'
import { TokenManager } from '@/lib/tokenManager'
import { checkInputSurveyCompleted } from '@/hooks/useInputSurveyCheck'
type Props = {
  onGoogleLogin?: () =>void
  onEmailLogin?: (email: string, password: string) =>void
}

export default function StudentLogin({ 
  onGoogleLogin, 
  onEmailLogin
}: Props) {
  const navigate = useNavigate()
  const { t } = useTranslation('auth')

  const handleBack = () => {
    navigate("/student/landing")
  }

  const handleRegister = () => {
    navigate("/auth/register")
  }

  const handleResetPassword = () => {
    navigate("/auth/forgot-password")
  }
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { toasts, error: showError, hideToast } = useToast()

  // Helper function to clean error messages
  const cleanErrorMessage = (message: string): string => {
    return message
      .replace(/^["'\[\]]+|["'\[\]]+$/g, '') // Remove quotes and brackets from start/end
      .replace(/^Error:\s*/i, '') // Remove "Error:"prefix
      .replace(/^\w+Error:\s*/i, '') // Remove specific error type prefixes
      .trim()
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.debug('StudentLogin.handleSubmit - called')
    const formData = new FormData(e.currentTarget)
    const email = (formData.get('email') as string) || ''
const password = (formData.get('password') as string) || ''
// If a parent provided a handler, delegate to it.
    if (onEmailLogin) {
      onEmailLogin(email, password)
      return
    }

    // Default behaviour: call backend /auth/login
    try {
      setLoading(true)
      console.debug('StudentLogin - calling backend', buildUrl('/auth/login'))
      const res = await fetch(buildUrl('/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'},
        body: JSON.stringify({ email, password })
      })

      const data = await res.json().catch(() =>({}))

      if (!res.ok) {
        // Prefer server message, fallback to status text
        const msg = (data && (data.message || data.error || data?.data?.message)) || res.statusText || t('login.loginFailed')
        const rawMessage = typeof msg === 'string'? msg : JSON.stringify(msg)
        const errorMessage = cleanErrorMessage(rawMessage)
        showError(errorMessage)
        return
      }

      // Some backends wrap payload in { success, data: { ... } }
      const payload = data?.data || data

      // Expect token in `accessToken` or `token` or `access_token`
      const token = payload?.accessToken || payload?.token || payload?.access_token
      const account = payload?.account || payload?.user
      if (token) {
        // Use TokenManager to set token with sliding expiry
        TokenManager.setToken(token)
        if (account) {
          try {
            localStorage.setItem('user', JSON.stringify(account))
            // notify other components (Header) that login occurred
            try {
              window.dispatchEvent(new CustomEvent('auth:login', { detail: account }))
            } catch (e) {
              // older browsers may not support CustomEvent constructor
              try { window.dispatchEvent(new Event('auth:login')) } catch (_) {}
            }
          } catch (_) {}
        }

        // Determine role and redirect accordingly
        const roleCode = account?.roleRel?.code || account?.role || account?.role_code || account?.roleCode || ''
// Normalize to lowercase for comparison
        const role = (typeof roleCode === 'string') ? roleCode.toLowerCase() : ''
// Navigate based on role
        if (role === 'student'|| role === 'student_role'|| role === '') {
          // Check if student has completed input survey
          try {
            const surveyStatus = await checkInputSurveyCompleted();
            if (!surveyStatus.completed) {
              // Chưa làm survey input → bắt buộc làm survey trước
              navigate('/student/survey', { state: { mandatory: true } });
              return;
            }
          } catch (err) {
            console.warn('Could not check survey status, proceeding to instructions');
          }
          navigate('/student/instructions')
        } else if (role === 'teacher') {
          navigate('/teacher/dashboard')
        } else if (role === 'admin'|| role === 'administrator') {
          navigate('/admin/dashboard')
        } else if (role === 'parent') {
          navigate('/parent/dashboard')
        } else {
          // Fallback for any other roles
          navigate('/student/landing')
        }

        return
      }

      // If no token returned, but response ok, navigate to landing
      navigate('/student/landing')
    } catch (err: any) {
      const rawMessage = err?.message || t('login.connectionError')
      const errorMessage = cleanErrorMessage(rawMessage)
      showError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      {/* Header */}
      <header className="w-full py-3 px-4 md:px-6">
        <BackButton onBack={handleBack} />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-4">
        <div className="w-full max-w-sm">
          {/* Login Card */}
          <Card className="bg-white rounded-xl shadow-md">
            <CardContent className="p-6">
              {/* Logo/Brand */}
              <div className="text-center mb-6">
                <h1 className="text-xl font-bold text-gray-900 tracking-wide mb-1">{t('login.brandName')}</h1>
                <h2 className="text-lg font-semibold text-gray-800 mb-1">{t('login.title')}</h2>
                <p className="text-gray-600 text-sm">{t('login.subtitle')}</p>
              </div>

              {/* Google Login Button */}
              <Button
                variant="outline"onClick={onGoogleLogin}
                className="w-full flex items-center justify-center px-3 py-2.5 mb-4 hover:bg-gray-50">
                <svg className="w-4 h-4 mr-2"viewBox="0 0 24 24">
                  <path fill="#4285F4"d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853"d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05"d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335"d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-gray-700 font-medium text-sm">{t('login.continueWithGoogle')}</span>
              </Button>

              {/* Divider */}
              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-white text-gray-500">{t('login.orSignInWith')}</span>
                </div>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Input */}
                <div>
                  <label htmlFor="email"className="block text-sm font-medium text-gray-700 mb-1">
                    {t('login.emailLabel')}
                  </label>
                  <Input
                    type="email"id="email"name="email"required
                    placeholder={t('login.emailPlaceholder')}
                    className="text-sm text-gray-900 placeholder-gray-400 bg-white focus:bg-white"/>
                </div>

                {/* Password Input */}
                <div>
                  <label htmlFor="password"className="block text-sm font-medium text-gray-700 mb-1">
                    {t('login.passwordLabel')}
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text": "password"}
                      id="password"name="password"required
                      placeholder={t('login.passwordPlaceholder')}
                      className="text-sm text-gray-900 placeholder-gray-400 pr-10"/>
                    <button
                      type="button"onClick={() =>setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                      {showPassword ? (
                        <svg className="h-5 w-5"fill="none"viewBox="0 0 24 24"stroke="currentColor">
                          <path strokeLinecap="round"strokeLinejoin="round"strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.5 8.5m1.378 1.378l.308-.622M12.121 14.12l.308-.622m-3.242-3.242a3 3 0 011.414-1.414M16.5 16.5L12 12"/>
                        </svg>) : (
                        <svg className="h-5 w-5"fill="none"viewBox="0 0 24 24"stroke="currentColor">
                          <path strokeLinecap="round"strokeLinejoin="round"strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                          <path strokeLinecap="round"strokeLinejoin="round"strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                        </svg>)}
                    </button>
                  </div>
                </div>

                {/* Login Button */}
                <Button
                  type="submit"data-debug="student-login-submit"onClick={() =>console.debug('StudentLogin.button - clicked')}
                  disabled={loading}
                  className={"w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold py-2.5 px-4 rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all transform hover:scale-[1.02] shadow-md text-sm "+ (loading ? 'opacity-60 cursor-not-allowed': '')}
                >
                  {loading ? t('login.loginButtonLoading') : t('login.loginButton')}
                </Button>
              </form>

              {/* Footer Links */}
              <div className="mt-4 text-center space-y-1">
                <p className="text-xs text-gray-600">
                  {t('login.noAccount')}{''}
                  <button 
                    onClick={handleRegister}
                    className="text-purple-600 hover:text-purple-700 font-medium cursor-pointer">
                    {t('login.register')}
                  </button>
                </p>
                <p className="text-xs text-gray-600">
                  {t('login.forgotPassword')}{''}
                  <button 
                    onClick={handleResetPassword}
                    className="text-purple-600 hover:text-purple-700 font-medium cursor-pointer">
                    {t('login.resetPassword')}
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={hideToast} />
    </div>)
}