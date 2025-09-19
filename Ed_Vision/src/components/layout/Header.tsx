import { STUDENT_ASSETS } from "@/assets/student"
import { Button } from "../ui/button"

type Props = {
  className?: string
  showNavigation?: boolean
}

export default function Header({ className = "", showNavigation = true }: Props) {
  // Temporary hardcoded values; replace with real data as needed
  const studentName = "Student Name";
  const studentRole = "Student Role";

  return (
    <header className={`bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50 ${className}`}>
      <div className="w-full pl-6 pr-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo - sát bên trái với margin 24px */}
          <div className="flex items-center">
            <img src="/src/assets/shared/logo_predica.jpg" alt="Predica Logo" className="h-15 w-auto object-contain"/>
          </div>

          {/* Navigation - ở giữa */}
          {showNavigation && (
            <nav className="hidden md:flex items-center space-x-8">
              <div className="relative group">
                <button className="flex items-center space-x-1 text-gray-700 hover:text-purple-500 transition-colors">
                  <span>Our Features</span>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="py-2">
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Accurate Predictions</a>
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Performance Analytics</a>
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Study Optimization</a>
                  </div>
                </div>
              </div>
            </nav>
          )}

          {/* User Profile */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors">
              <img src={STUDENT_ASSETS.defaultAvatar}
                alt="User Avatar"
                className="w-12 h-12 rounded-full object-cover border-2 border-purple-500" />
              <div className="hidden sm:block">
                <p className="text-lg font-semibold text-gray-900">{studentName}</p>
                <p className="text-sm text-gray-500">{studentRole}</p>
              </div>
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}