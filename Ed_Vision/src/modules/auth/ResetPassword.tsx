import { Card, CardContent } from "@/components/ui/student/Student_card"
import { Button } from "@/components/ui/student/Student_button"
import { Input } from "@/components/ui/student/Input"
import { BackButton } from "@/components/ui/student/Student_BackButton"
import { ToastContainer } from "@/components/ui/Toast"
import { useNavigate, useLocation } from "react-router-dom"
import { useState, useEffect, useRef } from "react"
import { buildUrl } from '@/services/api/config'
import { useToast } from '@/lib/useToast'

export default function ResetPassword() {
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(["", "", "", ""])
  const [countdown, setCountdown] = useState(0)
  const [canResend, setCanResend] = useState(true)
  const { toasts, error: showError, success: showSuccess, hideToast } = useToast()
  const inputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)]

  useEffect(() => {
    // Get email from navigation state
    const stateEmail = location.state?.email
    if (stateEmail) {
      setEmail(stateEmail)
    } else {
      // If no email, redirect to forgot password
      showError('Vui lòng nhập email trước')
      navigate('/auth/forgot-password')
    }
  }, [location, navigate, showError])

  // Auto-focus first OTP input on mount
  useEffect(() => {
    if (inputRefs[0].current) {
      inputRefs[0].current.focus()
    }
  }, [])

  useEffect(() => {
    // Countdown timer for resend
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [countdown])

  const handleBack = () => {
    navigate("/auth/forgot-password")
  }

  const handleLogin = () => {
    navigate("/auth/login")
  }

  // Helper function to clean error messages
  const cleanErrorMessage = (message: string): string => {
    return message
      .replace(/^["'\[\]]+|["'\[\]]+$/g, '') // Remove quotes and brackets from start/end
      .replace(/^Error:\s*/i, '') // Remove "Error:" prefix
      .replace(/^\w+Error:\s*/i, '') // Remove specific error type prefixes
      .trim()
  }

  const handleResendCode = async () => {
    if (!canResend || !email) return

    try {
      setCanResend(false)
      setCountdown(30) // 30 second cooldown

      const res = await fetch(buildUrl('/auth/forgot-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        const msg = (data && (data.message || data.error)) || res.statusText || 'Gửi lại mã thất bại'
        const rawMessage = typeof msg === 'string' ? msg : JSON.stringify(msg)
        const errorMessage = cleanErrorMessage(rawMessage)
        showError(errorMessage)
        return
      }

      showSuccess('Mã xác thực mới đã được gửi!')
    } catch (err: any) {
      const rawMessage = err?.message || 'Không thể kết nối đến máy chủ'
      const errorMessage = cleanErrorMessage(rawMessage)
      showError(errorMessage)
      setCanResend(true)
      setCountdown(0)
    }
  }

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) return // Only allow single digit
    
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-focus next input
    if (value.length === 1 && index < 3) {
      inputRefs[index + 1].current?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputRefs[index - 1].current?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text')
    
    // Check if pasted data is exactly 4 digits
    if (/^\d{4}$/.test(pastedData)) {
      const digits = pastedData.split('')
      setOtp(digits)
      
      // Focus the last input after pasting
      inputRefs[3].current?.focus()
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const code = otp.join('')
    const newPassword = (formData.get('newPassword') as string) || ''
    const confirmPassword = (formData.get('confirmPassword') as string) || ''

    // Validate OTP
    if (code.length !== 4) {
      showError('Vui lòng nhập đầy đủ mã OTP')
      return
    }

    // Validate password confirmation
    if (newPassword !== confirmPassword) {
      showError('Mật khẩu xác nhận không khớp')
      return
    }

    // Validate password length
    if (newPassword.length < 6) {
      showError('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }

    try {
      setLoading(true)
      const res = await fetch(buildUrl('/auth/reset-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          email, 
          code, 
          newPassword, 
          confirmPassword 
        })
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        const msg = (data && (data.message || data.error)) || res.statusText || 'Đặt lại mật khẩu thất bại'
        const rawMessage = typeof msg === 'string' ? msg : JSON.stringify(msg)
        const errorMessage = cleanErrorMessage(rawMessage)
        showError(errorMessage)
        return
      }

      // Show success message and navigate to login
      showSuccess('Đặt lại mật khẩu thành công!', 2000)
      setTimeout(() => {
        navigate('/auth/login')
      }, 1500)
    } catch (err: any) {
      const rawMessage = err?.message || 'Không thể kết nối đến máy chủ'
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
          {/* Reset Password Card */}
          <Card className="bg-white rounded-xl shadow-md">
            <CardContent className="p-6">
              {/* Logo/Brand */}
              <div className="text-center mb-6">
                <h1 className="text-xl font-bold text-gray-900 tracking-wide mb-1">SCORE PREDICT</h1>
                <h2 className="text-lg font-semibold text-gray-800 mb-1">Reset Password</h2>
                <p className="text-gray-600 text-sm">Enter the code sent to your email and your new password</p>
              </div>

              {/* Email Display */}
              {email && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Email:</span> {email}
                  </p>
                </div>
              )}

              {/* Reset Password Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Verification Code Input */}
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Code
                  </label>
                  <div className="flex justify-center space-x-2 sm:space-x-3 mb-2">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={inputRefs[index]}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleInputChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={handlePaste}
                        className="w-10 h-10 sm:w-12 sm:h-12 text-center text-lg font-bold text-gray-900 placeholder-gray-400 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none transition-all duration-200"
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 text-center">Enter the 4-digit code sent to your email</p>
                </div>

                {/* New Password Input */}
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      id="newPassword"
                      name="newPassword"
                      required
                      minLength={6}
                      placeholder="Enter your new password"
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

                {/* Confirm New Password Input */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      required
                      minLength={6}
                      placeholder="Confirm your new password"
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

                {/* Reset Password Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className={"w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold py-2.5 px-4 rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all transform hover:scale-[1.02] shadow-md text-sm " + (loading ? 'opacity-60 cursor-not-allowed' : '')}
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </Button>
              </form>

              {/* Resend Code */}
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-600">
                  Didn't receive the code?{' '}
                  <button 
                    onClick={handleResendCode}
                    disabled={!canResend}
                    className={`font-medium ${canResend ? 'text-purple-600 hover:text-purple-700 cursor-pointer' : 'text-gray-400 cursor-not-allowed'}`}
                  >
                    {canResend ? 'Resend' : `Resend (${countdown}s)`}
                  </button>
                </p>
              </div>

              {/* Footer Links */}
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-600">
                  Remember your password?{' '}
                  <button 
                    onClick={handleLogin}
                    className="text-purple-600 hover:text-purple-700 font-medium cursor-pointer"
                  >
                    Back to Login
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
