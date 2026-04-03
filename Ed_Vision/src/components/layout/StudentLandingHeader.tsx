import { Button } from "../../components/ui/student/Student_button"
import { Link } from "react-router-dom"
type Props = {
  className?: string
  showNavigation?: boolean
}

export default function StudentLandingHeader({ className = "", showNavigation = true }: Props) {
  return (
    <header className={`bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50 ${className}`}>
      <div className="w-full pl-6 pr-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo - sát bên trái với margin 24px */}
          <div className="flex items-center">
            <img src="/src/assets/shared/logo_predica.jpg"alt="Predica Logo"className="h-15 w-auto object-contain"/>
          </div>

          {/* Navigation - ở giữa */}
          {showNavigation && (
            <nav className="hidden md:flex items-center space-x-8">
              <div className="relative group">
                <button className="flex items-center space-x-1 text-gray-700 hover:text-purple-500 transition-colors">
                  <span>Our Features</span>
                  <svg className="w-4 h-4"fill="currentColor"viewBox="0 0 20 20">
                    <path fillRule="evenodd"d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"clipRule="evenodd"/>
                  </svg>
                </button>
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="py-2">
                    <a href="#"className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Accurate Predictions</a>
                    <a href="#"className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Performance Analytics</a>
                    <a href="#"className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Study Optimization</a>
                  </div>
                </div>
              </div>
            </nav>)}

          {/* Login and Register Buttons */}
          <div className="flex items-center space-x-4">
            <Link to="/student/login">
              <Button 
                variant="ghost"className="text-gray-700 hover:text-purple-500 hover:bg-purple-50 px-4 py-2">Login
              </Button>
            </Link>
            <Link to="/student/register">
              <Button 
                className="bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 px-6 py-2">Register
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>)
}