import { Card, CardContent } from "@/components/ui/student/Student_card"
import { Button } from "@/components/ui/student/Student_button"
import { Input } from "@/components/ui/student/Input"
import { BackButton } from "@/components/ui/student/Student_BackButton"
import { ToastContainer } from "@/components/ui/Toast"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { buildUrl } from '@/services/api/config'
import { useToast } from '@/lib/useToast'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const { toasts, error: showError, success: showSuccess, hideToast } = useToast()

  const handleBack = () => {
    navigate("/auth/login")
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const email = (formData.get('email') as string) || ''

    try {
      setLoading(true)
      const res = await fetch(buildUrl('/auth/forgot-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        const msg = (data && (data.message || data.error)) || res.statusText || 'Gửi mã xác thực thất bại'
        const rawMessage = typeof msg === 'string' ? msg : JSON.stringify(msg)
        const errorMessage = cleanErrorMessage(rawMessage)
        showError(errorMessage)
        return
      }

      // Show success message and navigate to reset password page
      showSuccess('Mã xác thực đã được gửi đến email của bạn!', 2000)
      setTimeout(() => {
        navigate('/auth/reset-password', { state: { email } })
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
          {/* Forgot Password Card */}
          <Card className="bg-white rounded-xl shadow-md">
            <CardContent className="p-6">
              {/* Logo/Brand */}
              <div className="text-center mb-6">
                <h1 className="text-xl font-bold text-gray-900 tracking-wide mb-1">SCORE PREDICT</h1>
                <h2 className="text-lg font-semibold text-gray-800 mb-1">Forgot Password</h2>
                <p className="text-gray-600 text-sm">Enter your email to receive a verification code</p>
              </div>

              {/* Info Message */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800">
                  <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Chúng tôi sẽ gửi mã xác thực 4 chữ số đến email của bạn
                </p>
              </div>

              {/* Forgot Password Form */}
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
                    className="text-sm text-gray-900 placeholder-gray-400 bg-white focus:bg-white"
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className={"w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold py-2.5 px-4 rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all transform hover:scale-[1.02] shadow-md text-sm " + (loading ? 'opacity-60 cursor-not-allowed' : '')}
                >
                  {loading ? 'Sending...' : 'Send Verification Code'}
                </Button>
              </form>

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
