import { Card, CardContent } from "../../components/ui/student/Student_card"
import { Button } from "../../components/ui/student/Student_button"
import Footer from "../../components/layout/Footer"
import Header from "../../components/layout/Header"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/hooks/useAuth"
import { useEffect } from "react"

type Props = {
  // Add props if needed
}

export default function GradeForecastLanding({}: Props) {
  const { t } = useTranslation(['common'])
  const navigate = useNavigate()
  const { isAuthenticated, getDashboardPath } = useAuth()
  
  // Auto-redirect authenticated users to their dashboard
  useEffect(() => {
    if (isAuthenticated) {
      const dashboardPath = getDashboardPath()
      navigate(dashboardPath, { replace: true })
    }
  }, [isAuthenticated, getDashboardPath, navigate])

  const handleLogin = () => {
    navigate("/auth/login")
  }

  const handleRegister = () => {
    navigate("/auth/register")
  }

  const handleStartPredicting = () => {
    navigate("/auth/login")
  }

  return (
    <div className="bg-white text-gray-900 font-sans">
      {/* Header */}
      <Header 
        isLandingPage={true}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 py-8 md:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-4">
                <span className="bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">AI-Powered</span><br/>
                Grade Forecasting
              </h1>
              <p className="text-base md:text-lg text-gray-600 mb-6 max-w-2xl">
                Dự đoán điểm số chính xác, phân tích hiệu suất học tập và tối ưu hóa chiến lược học tập với công nghệ AI tiên tiến.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Button 
                  onClick={handleStartPredicting}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-6 rounded-xl text-base font-semibold hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
                >
                  {t('student:landing.startPredicting')}
                </Button>
                <Button 
                  variant="outline" 
                  className="border-2 border-gray-300 text-gray-700 px-6 py-6 rounded-xl text-base font-semibold hover:border-purple-500 hover:text-purple-500 transition-all duration-200"
                >
                  {t('student:landing.watchDemo')}
                </Button>
              </div>
            </div>
            <div className="relative">
              <Card className="bg-white rounded-2xl shadow-2xl p-6 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <CardContent className="p-0">
                  <img 
                    src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop&crop=center" 
                    alt="Students learning" 
                    className="w-full h-64 object-cover rounded-xl mb-4"
                  />
                  <div className="flex items-center justify-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Tính năng nổi bật</h2>
            <p className="text-base text-gray-600 max-w-2xl mx-auto">Khám phá những công cụ mạnh mẽ giúp bạn dự đoán và cải thiện kết quả học tập</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <Card className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Accurate Predictions</h3>
                <p className="text-gray-600 text-sm">Dự đoán điểm số chính xác với độ tin cậy cao dựa trên thuật toán AI tiên tiến và dữ liệu học tập cá nhân.</p>
              </CardContent>
            </Card>
            
            {/* Feature 2 */}
            <Card className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-2xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Performance Analytics</h3>
                <p className="text-gray-600 text-sm">Phân tích chi tiết hiệu suất học tập qua biểu đồ trực quan, giúp bạn hiểu rõ điểm mạnh và điểm cần cải thiện.</p>
              </CardContent>
            </Card>
            
            {/* Feature 3 */}
            <Card className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Study Optimization</h3>
                <p className="text-gray-600 text-sm">Nhận gợi ý tối ưu hóa việc học tập được cá nhân hóa để đạt được mục tiêu điểm số mong muốn một cách hiệu quả.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 md:py-16 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Cách thức hoạt động</h2>
            <p className="text-base text-gray-600 max-w-2xl mx-auto">Chỉ với 4 bước đơn giản, bạn có thể bắt đầu dự đoán và cải thiện kết quả học tập</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="text-center">
              <div className="relative mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-bold text-white">1</span>
                </div>
                <div className="w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 1a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
                  </svg>
                </div>
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">Input Your Data</h3>
              <p className="text-gray-600 text-sm">Nhập điểm số hiện tại và thói quen học tập của bạn</p>
            </div>
            
            {/* Step 2 */}
            <div className="text-center">
              <div className="relative mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-bold text-white">2</span>
                </div>
                <div className="w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd"/>
                  </svg>
                </div>
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">AI Analysis</h3>
              <p className="text-gray-600 text-sm">AI phân tích mẫu hành vi học tập và xu hướng điểm số</p>
            </div>
            
            {/* Step 3 */}
            <div className="text-center">
              <div className="relative mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-bold text-white">3</span>
                </div>
                <div className="w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                </div>
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">Get Predictions</h3>
              <p className="text-gray-600 text-sm">Nhận dự đoán điểm số chi tiết và độ tin cậy cao</p>
            </div>
            
            {/* Step 4 */}
            <div className="text-center">
              <div className="relative mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-bold text-white">4</span>
                </div>
                <div className="w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                </div>
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">Optimize Performance</h3>
              <p className="text-gray-600 text-sm">Cải thiện chiến lược học tập dựa trên gợi ý AI</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">What Students Say</h2>
            <p className="text-base text-gray-600 max-w-2xl mx-auto">Hàng nghìn sinh viên đã tin tưởng và đạt được kết quả tuyệt vời</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Testimonial 1 */}
            <Card className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <CardContent className="p-0">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                    AN
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">Nguyễn Minh An</h4>
                    <p className="text-xs text-gray-600">Sinh viên Công nghệ thông tin</p>
                  </div>
                </div>
                <div className="flex mb-3">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  ))}
                </div>
                <p className="text-gray-600 italic text-sm">"GradeForecast đã giúp tôi cải thiện điểm số từ 6.5 lên 8.2 chỉ trong một học kỳ. Các dự đoán rất chính xác và gợi ý học tập cực kỳ hữu ích!"</p>
              </CardContent>
            </Card>
            
            {/* Testimonial 2 */}
            <Card className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <CardContent className="p-0">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                    LH
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">Trần Linh Hương</h4>
                    <p className="text-xs text-gray-600">Sinh viên Kinh tế</p>
                  </div>
                </div>
                <div className="flex mb-3">
                  {[...Array(4)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  ))}
                  <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                </div>
                <p className="text-gray-600 italic text-sm">"Công cụ phân tích hiệu suất rất chi tiết. Tôi có thể thấy rõ những môn nào cần tập trung hơn và lập kế hoạch học tập hiệu quả."</p>
              </CardContent>
            </Card>
            
            {/* Testimonial 3 */}
            <Card className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <CardContent className="p-0">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                    DK
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">Lê Đức Khang</h4>
                    <p className="text-xs text-gray-600">Sinh viên Y khoa</p>
                  </div>
                </div>
                <div className="flex mb-3">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  ))}
                </div>
                <p className="text-gray-600 italic text-sm">"Với áp lực học tập cao ở ngành Y, GradeForecast giúp tôi quản lý thời gian và tối ưu hóa việc học một cách khoa học và hiệu quả."</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}