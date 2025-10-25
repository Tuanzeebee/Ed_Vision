import { Card, CardContent } from "@/components/ui/student/Student_card"
import { Button } from "@/components/ui/student/Student_button"
import { Input } from "@/components/ui/student/Input"
import { BackButton } from "@/components/ui/student/Student_BackButton"
import { useNavigate } from "react-router-dom"
import { useState } from "react"

type Props = {
  onGoogleLogin?: () => void
  onEmailLogin?: (email: string, password: string) => void
}

export default function StudentLogin({ 
  onGoogleLogin, 
  onEmailLogin
}: Props) {
  const navigate = useNavigate()

  const handleBack = () => {
    navigate("/student/landing")
  }

  const handleRegister = () => {
    navigate("/auth/register")
  }

  const handleResetPassword = () => {
    // Navigate to reset password page (to be created later)
    console.log("Navigate to reset password")
  }
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
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
      const res = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        // Prefer server message, fallback to status text
        const msg = (data && (data.message || data.error || data?.data?.message)) || res.statusText || 'Login failed'
        setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
        return
      }

      // Some backends wrap payload in { success, data: { ... } }
      const payload = data?.data || data

      // Expect token in `accessToken` or `token` or `access_token`
      const token = payload?.accessToken || payload?.token || payload?.access_token
      const account = payload?.account || payload?.user
      if (token) {
        localStorage.setItem('token', token)
        if (account) {
          try {
            localStorage.setItem('user', JSON.stringify(account))
          } catch (_) {}
        }

        // Determine role and redirect accordingly
        const roleCode = account?.roleRel?.code || account?.role || account?.role_code || account?.roleCode || ''
        // Normalize to lowercase for comparison
        const role = (typeof roleCode === 'string') ? roleCode.toLowerCase() : ''

        if (role === 'student' || role === 'student_role' || role === '') {
          navigate('/student/landing')
        } else if (role === 'teacher') {
          navigate('/teacher/dashboard')
        } else if (role === 'admin' || role === 'administrator') {
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
      setError(err?.message || 'Unable to contact server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="w-full py-3 px-4 md:px-6">
        <BackButton onBack={handleBack} />
      </header>

      {/* Main Content */}
      <main className="flex items-center justify-center px-4 py-4">
        <div className="w-full max-w-sm">
          {/* Login Card */}
          <Card className="bg-white rounded-xl shadow-md">
            <CardContent className="p-6">
              {/* Logo/Brand */}
              <div className="text-center mb-6">
                <h1 className="text-xl font-bold text-gray-900 tracking-wide mb-1">SCORE PREDICT</h1>
                <h2 className="text-lg font-semibold text-gray-800 mb-1">Login</h2>
                <p className="text-gray-600 text-sm">Welcome back! Let's get you back to website</p>
              </div>

              {/* Google Login Button */}
              <Button
                variant="outline"
                onClick={onGoogleLogin}
                className="w-full flex items-center justify-center px-3 py-2.5 mb-4 hover:bg-gray-50"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-gray-700 font-medium text-sm">Continue with Google</span>
              </Button>

              {/* Divider */}
              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-white text-gray-500">Or sign in with email</span>
                </div>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Input */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    required
                    placeholder="Enter your email"
                    className="text-sm text-gray-900 placeholder-gray-400"
                  />
                </div>

                {/* Password Input */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <Input
                    type="password"
                    id="password"
                    name="password"
                    required
                    placeholder="Enter your password"
                    className="text-sm text-gray-900 placeholder-gray-400"
                  />
                </div>

                {/* Login Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className={"w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold py-2.5 px-4 rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all transform hover:scale-[1.02] shadow-md text-sm " + (loading ? 'opacity-60 cursor-not-allowed' : '')}
                >
                  {loading ? 'Signing in...' : 'Login'}
                </Button>
                {error ? (
                  <p className="text-sm text-red-600 mt-2" role="alert">{error}</p>
                ) : null}
              </form>

              {/* Footer Links */}
              <div className="mt-4 text-center space-y-1">
                <p className="text-xs text-gray-600">
                  Don't have an account?{' '}
                  <button 
                    onClick={handleRegister}
                    className="text-purple-600 hover:text-purple-700 font-medium cursor-pointer"
                  >
                    Register
                  </button>
                </p>
                <p className="text-xs text-gray-600">
                  Forgot your password?{' '}
                  <button 
                    onClick={handleResetPassword}
                    className="text-purple-600 hover:text-purple-700 font-medium cursor-pointer"
                  >
                    Reset password
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}