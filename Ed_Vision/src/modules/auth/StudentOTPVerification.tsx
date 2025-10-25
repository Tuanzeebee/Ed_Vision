import { Card, CardContent } from "../../components/ui/student/Student_card"
import { Button } from "../../components/ui/student/Student_button"
import { useNavigate, useLocation } from "react-router-dom"
import { useState, useRef, useEffect } from "react"

type Props = {
  onVerifyOTP?: (otp: string) => void
  onResendCode?: () => void
}

export default function StudentOTPVerification({ 
  onVerifyOTP,
  onResendCode 
}: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  const email = location.state?.email || "example@dtu.edu.vn"
  const [otp, setOtp] = useState(["", "", "", ""])
  const [countdown, setCountdown] = useState(60)
  const [isResendDisabled, setIsResendDisabled] = useState(true)
  const inputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)]

  // Auto-focus first input on mount
  useEffect(() => {
    if (inputRefs[0].current) {
      inputRefs[0].current.focus()
    }
  }, [])

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else {
      setIsResendDisabled(false)
    }
  }, [countdown])

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const otpCode = otp.join('')
    if (otpCode.length === 4) {
      // If parent did not provide handler, call backend verify endpoint
      if (onVerifyOTP) {
        onVerifyOTP(otpCode)
        navigate('/student/course-overview')
        return
      }

      fetch('http://localhost:3000/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otpCode }),
      })
        .then(async (res) => {
          if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            throw new Error(err.message || 'OTP verification failed')
          }
          return res.json()
        })
        .then(() => {
          // Show a confirmation and return user to landing so they can login
          alert('Registration successful. Please log in to continue.')
          navigate('/student/landing')
        })
        .catch((err) => {
          console.error('OTP verify error', err)
          alert(err.message || 'Verification failed')
        })
    }
  }

  const handleResend = () => {
    if (!isResendDisabled) {
      setCountdown(60)
      setIsResendDisabled(true)
      if (onResendCode) {
        onResendCode()
        return
      }

      fetch('http://localhost:3000/auth/otp/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
        .then(async (res) => {
          if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            throw new Error(err.message || 'Resend failed')
          }
          return res.json()
        })
        .then(() => {
          alert('Verification code resent')
        })
        .catch((err) => {
          console.error('Resend error', err)
          alert(err.message || 'Resend failed')
        })
    }
  }

  const handleLoginClick = () => {
    navigate("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Main Card */}
        <Card className="bg-white rounded-xl shadow-lg">
          <CardContent className="p-6 sm:p-7">
            {/* Logo/Brand */}
            <div className="text-center mb-6">
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                SCORE PREDICT
              </h1>
            </div>

            {/* Title */}
            <div className="text-center mb-5">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">
                Create Your Account
              </h2>
            </div>

            {/* Instruction Text */}
            <div className="text-center mb-6">
              <p className="text-gray-600 text-sm leading-relaxed">
                We have sent the confirmation code to email:{' '}
                <span className="font-semibold text-gray-800">{email}</span>
                <br />
                Please check your email and enter the 4-digit OTP code.
              </p>
            </div>

            {/* OTP Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* OTP Input */}
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                  Enter your code
                </label>
                <div className="flex justify-center space-x-2 sm:space-x-3">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={inputRefs[index]}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleInputChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-10 h-10 sm:w-12 sm:h-12 text-center text-lg font-bold text-gray-900 placeholder-gray-400 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none transition-all duration-200"
                    />
                  ))}
                </div>
              </div>

              {/* Resend Section */}
              <div className="text-center">
                {isResendDisabled ? (
                  <>
                    <p className="text-xs text-gray-600 mb-2">
                      Code not received, resend in{' '}
                      <span className="font-semibold text-gray-800">{countdown}s</span>
                    </p>
                    <button type="button" className="text-xs text-gray-400 cursor-not-allowed" disabled>
                      Resend
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-gray-600 mb-2">Didn't receive the code?</p>
                    <button
                      type="button"
                      onClick={handleResend}
                      className="text-xs text-purple-600 hover:text-purple-700 cursor-pointer transition-colors duration-200"
                    >
                      Resend Code
                    </button>
                  </>
                )}
              </div>

              {/* Continue Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-2.5 px-5 rounded-lg hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02]"
              >
                Continue
              </Button>
            </form>

            {/* Login Link */}
            <div className="text-center mt-5">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={handleLoginClick}
                  className="font-semibold text-purple-600 hover:text-purple-700 transition-colors duration-200"
                >
                  Log in
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}