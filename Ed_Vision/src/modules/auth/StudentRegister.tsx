import { Card, CardContent } from "@/components/ui/student/Student_card"
import { Button } from "@/components/ui/student/Student_button"
import { Input } from "@/components/ui/student/Input"
import { BackButton } from "@/components/ui/student/Student_BackButton"
import { ToastContainer } from "@/components/ui/Toast"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { buildUrl } from '@/services/api/config'
import { useToast } from '@/lib/useToast'

type Props = {
  onGoogleRegister?: () => void
  onEmailRegister?: (email: string, password: string, confirmPassword: string) => void
}

export default function StudentRegister({ 
  // onGoogleRegister, // Unused for now 
  onEmailRegister
}: Props) {
  const navigate = useNavigate()
  // keep the prop referenced to avoid unused variable lint
  void onEmailRegister
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { toasts, error: showError, success: showSuccess, hideToast } = useToast()

  const handleBack = () => {
    navigate("/student/landing")
  }

  const handleLogin = () => {
    navigate("/auth/login")
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.debug('StudentRegister.handleSubmit - called')
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string
    
    // Validate password confirmation
    if (password !== confirmPassword) {
      showError('Mật khẩu xác nhận không khớp')
      return
    }
    
    // Client-side: allow only DTU email domain
    const domain = '@dtu.edu.vn'
    if (!email?.toLowerCase()?.endsWith(domain)) {
      showError(`Chỉ cho phép đăng ký với email ${domain}`)
      return
    }

    // Call backend register endpoint
    const payload = { email, password, confirmPassword }
    console.debug('StudentRegister - calling backend', buildUrl('/auth/register'))
    fetch(buildUrl('/auth/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.message || 'Đăng ký thất bại')
        }
        return res.json()
      })
      .then(() => {
        // success -> navigate to OTP page and pass email
        showSuccess('Đăng ký thành công! Kiểm tra email để xác thực.', 2000)
        setTimeout(() => {
          navigate('/auth/otp-verification', { state: { email } })
        }, 1500)
      })
      .catch((err) => {
        console.error('Register error', err)
        const cleanMessage = (err.message || 'Lỗi đăng ký').replace(/^["'\[\]]+|["'\[\]]+$/g, '').trim()
        showError(cleanMessage)
      })
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
          {/* Register Card */}
          <Card className="bg-white rounded-xl shadow-md">
            <CardContent className="p-6">
              {/* Logo/Brand */}
              <div className="text-center mb-6">
                <h1 className="text-xl font-bold text-gray-900 tracking-wide mb-1">SCORE PREDICT</h1>
                <h2 className="text-lg font-semibold text-gray-800 mb-1">Register</h2>
                <p className="text-gray-600 text-sm">Create your account to start predicting your grades</p>
              </div>


             

              {/* Register Form */}
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
                    placeholder="Enter your DTU email"
                    className="text-sm text-gray-900 placeholder-gray-400 bg-white focus:bg-white"
                  />
                </div>

                {/* Password Input */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      required
                      placeholder="Enter your password"
                      className="text-sm text-gray-900 placeholder-gray-400 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.5 8.5m1.378 1.378l.308-.622M12.121 14.12l.308-.622m-3.242-3.242a3 3 0 011.414-1.414M16.5 16.5L12 12" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Input */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      required
                      placeholder="Confirm your password"
                      className="text-sm text-gray-900 placeholder-gray-400 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.5 8.5m1.378 1.378l.308-.622M12.121 14.12l.308-.622m-3.242-3.242a3 3 0 011.414-1.414M16.5 16.5L12 12" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Register Button */}
                <Button
                  type="submit"
                  data-debug="student-register-submit"
                  onClick={() => console.debug('StudentRegister.button - clicked')}
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold py-2.5 px-4 rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all transform hover:scale-[1.02] shadow-md text-sm"
                >
                  Register
                </Button>
              </form>

              {/* Footer Links */}
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-600">
                  Already have an account?{' '}
                  <button 
                    onClick={handleLogin}
                    className="text-purple-600 hover:text-purple-700 font-medium cursor-pointer"
                  >
                    Login
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={hideToast} />
    </div>
  )
}