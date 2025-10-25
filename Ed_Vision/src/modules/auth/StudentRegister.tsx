import { Card, CardContent } from "@/components/ui/student/Student_card"
import { Button } from "@/components/ui/student/Student_button"
import { Input } from "@/components/ui/student/Input"
import { BackButton } from "@/components/ui/student/Student_BackButton"
import { useNavigate } from "react-router-dom"

type Props = {
  onGoogleRegister?: () => void
  onEmailRegister?: (email: string, password: string, confirmPassword: string) => void
}

export default function StudentRegister({ 
  // onGoogleRegister, // Unused for now 
  onEmailRegister
}: Props) {
  const navigate = useNavigate()

  const handleBack = () => {
    navigate("/student/landing")
  }

  const handleLogin = () => {
    navigate("/auth/login")
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string
    
    // Validate password confirmation
    if (password !== confirmPassword) {
      alert('Passwords do not match')
      return
    }
    
    // Client-side: allow only DTU email domain
    const domain = '@dtu.edu.vn'
    if (!email?.toLowerCase()?.endsWith(domain)) {
      alert(`Registration only allowed with ${domain} email`)
      return
    }

    // Call backend register endpoint
    const payload = { email, password, confirmPassword }
    fetch('http://localhost:3000/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.message || 'Registration failed')
        }
        return res.json()
      })
      .then(() => {
        // success -> navigate to OTP page and pass email
        navigate('/auth/otp-verification', { state: { email } })
      })
      .catch((err) => {
        console.error('Register error', err)
        alert(err.message || 'Registration error')
      })
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

                {/* Confirm Password Input */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <Input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    required
                    placeholder="Confirm your password"
                    className="text-sm text-gray-900 placeholder-gray-400"
                  />
                </div>

                {/* Register Button */}
                <Button
                  type="submit"
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
    </div>
  )
}