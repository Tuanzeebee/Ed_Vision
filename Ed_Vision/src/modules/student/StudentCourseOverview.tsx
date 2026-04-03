import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/student/Student_card"
import { BackButton } from "@/components/ui/student/Student_BackButton"
import Footer from "../../components/layout/Footer"
import Header from "../../components/layout/Header"
type Props = {
  // Optional props for customization
  courseName?: string
  courseCode?: string
}

interface ModuleData {
  id: string
  title: string
  duration: string
  topics: string[]
}

const modules: ModuleData[] = [
  {
    id: 'module1',
    title: 'Fundamentals of DBMS',
    duration: '18 giờ học',
    topics: [
      'Introduction to Database Systems',
      'Data Definition Language (DDL)', 
      'Data Manipulation Language (DML)',
      'Advanced Queries and Optimization',
      'Triggers and Stored Procedures']
  },
  {
    id: 'module2',
    title: 'Data Storage and Big Data Analytics',
    duration: '4 giờ học',
    topics: [
      'Data Warehousing Concepts',
      'Big Data Technologies',
      'Analytics and Business Intelligence']
  },
  {
    id: 'module3',
    title: 'Database Administration & Transaction Management', 
    duration: '11 giờ học',
    topics: [
      'Database Administration Fundamentals',
      'Transaction Processing',
      'Concurrency Control',
      'Recovery and Backup Strategies']
  },
  {
    id: 'module4',
    title: 'Database Security & Advanced Data Management',
    duration: '12 giờ học', 
    topics: [
      'Database Security Principles',
      'Access Control and Authentication',
      'Data Privacy and Compliance',
      'Advanced Data Management Techniques']
  }
]

const gradingBreakdown = [
  { name: 'Quiz', percentage: '15%'},
  { name: 'Homework', percentage: '10%'},
  { name: 'Midterm Exam', percentage: '20%'},
  { name: 'Individual Project', percentage: '15%'},
  { name: 'Final Exam', percentage: '40%', highlight: true }
]

export default function StudentCourseOverview({ 
  courseName = "CMU-IS 401 SAIS",
  courseCode = "Information System Applications"}: Props) {
  const navigate = useNavigate()
  const [openModules, setOpenModules] = useState<Set<string>>(new Set())

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const toggleModule = (moduleId: string) => {
    const newOpenModules = new Set(openModules)
    if (newOpenModules.has(moduleId)) {
      newOpenModules.delete(moduleId)
    } else {
      newOpenModules.add(moduleId)
    }
    setOpenModules(newOpenModules)
  }

  return (
    <div className="bg-gray-50 min-h-screen w-full">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="w-full px-8 py-8">
        <div className="mb-6">
          <BackButton 
            label="Quay lại kế hoạch học tập"variant="outline"onBack={() =>navigate('/student/academic-planning')} 
            className="hover:border-purple-200 hover:text-purple-700"/>
        </div>

        {/* Course Overview Card */}
        <Card className="rounded-2xl shadow-lg p-6 md:p-8 mb-8">
          <CardContent className="p-0">
            {/* Course Title Section */}
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                {courseName}
              </h1>
              <p className="text-xl text-gray-600">
                {courseCode}
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Course Info */}
              <div className="space-y-6">
                <div className="flex items-center justify-center lg:justify-start">
                  <span className="inline-block bg-red-100 text-red-800 px-4 py-2 rounded-full text-sm font-semibold">3 tín chỉ
                  </span>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center text-gray-600">
                    <svg className="w-5 h-5 mr-3 text-purple-500"fill="none"stroke="currentColor"viewBox="0 0 24 24">
                      <path strokeLinecap="round"strokeLinejoin="round"strokeWidth="2"d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span className="font-medium">Tổng thời lượng:</span>
                    <span className="ml-2 font-semibold text-purple-500">51h</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <svg className="w-5 h-5 mr-3 text-purple-500"fill="none"stroke="currentColor"viewBox="0 0 24 24">
                      <path strokeLinecap="round"strokeLinejoin="round"strokeWidth="2"d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                    </svg>
                    <span className="font-medium">Môn tiên quyết:</span>
                    <a href="#"className="ml-2 text-purple-500 hover:underline font-semibold cursor-pointer">IS 301 – Database</a>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <svg className="w-5 h-5 mr-3 text-purple-500"fill="none"stroke="currentColor"viewBox="0 0 24 24">
                      <path strokeLinecap="round"strokeLinejoin="round"strokeWidth="2"d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path>
                    </svg>
                    <span className="font-medium">Ngôn ngữ:</span>
                    <span className="ml-2">Tiếng Anh</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <svg className="w-5 h-5 mr-3 text-purple-500"fill="none"stroke="currentColor"viewBox="0 0 24 24">
                      <path strokeLinecap="round"strokeLinejoin="round"strokeWidth="2"d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                    <span className="font-medium">Độ khó:</span>
                    <span className="ml-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">Trung bình</span>
                  </div>
                </div>
              </div>
              
              {/* Right Column - Grading Breakdown */}
              <div className="">
                <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 h-full">
                  <h3 className="font-semibold text-gray-900 mb-6 text-center text-lg">Cơ cấu phân bố điểm</h3>
                  <div className="space-y-3">
                    {gradingBreakdown.map((item, index) =>(
                      <div 
                        key={index}
                        className={`flex justify-between items-center py-3 px-4 bg-white rounded-lg shadow-sm ${
                          item.highlight ? 'border-2 border-purple-500': ''}`}
                      >
                        <span className="text-gray-700 font-medium">{item.name}</span>
                        <span className="font-bold text-purple-500 text-lg">{item.percentage}</span>
                      </div>))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Course Description */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-gray-700 leading-relaxed text-lg">Khóa học này cung cấp kiến thức toàn diện về các ứng dụng hệ thống thông tin trong môi trường doanh nghiệp hiện đại. Sinh viên sẽ học cách thiết kế, phát triển và triển khai các giải pháp công nghệ thông tin để giải quyết các vấn đề kinh doanh thực tế. Khóa học kết hợp lý thuyết và thực hành, giúp sinh viên phát triển kỹ năng phân tích, thiết kế hệ thống và quản lý dự án CNTT.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Curriculum Accordion */}
        <Card className="rounded-2xl shadow-lg p-6 md:p-8 mb-8">
          <CardHeader className="p-0 pb-6">
            <CardTitle className="text-2xl font-bold text-gray-900">Chương trình khóa học theo DTU
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-4">
              {modules.map((module) => {
                const isOpen = openModules.has(module.id)
                return (
                  <div key={module.id} className="border border-gray-200 rounded-xl overflow-hidden">
                    <button 
                      className="w-full px-6 py-4 text-left bg-gray-50 hover:bg-gray-100 transition-colors flex justify-between items-center cursor-pointer"onClick={() =>toggleModule(module.id)}
                    >
                      <div>
                        <h3 className="font-semibold text-gray-900">{module.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{module.duration}</p>
                      </div>
                      <svg 
                        className={`w-5 h-5 text-gray-500 transform transition-transform ${isOpen ? 'rotate-180': ''}`} 
                        fill="none"stroke="currentColor"viewBox="0 0 24 24">
                        <path strokeLinecap="round"strokeLinejoin="round"strokeWidth="2"d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </button>
                    {isOpen && (
                      <div className="px-6 py-4 bg-white border-t border-gray-200">
                        <ul className="space-y-2 text-gray-700">
                          {module.topics.map((topic, index) =>(
                            <li key={index} className="flex items-center">
                              <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                              {topic}
                            </li>))}
                        </ul>
                      </div>)}
                  </div>)
              })}
            </div>
          </CardContent>
        </Card>

        {/* Personalized Learning Path */}
        <Card className="bg-gradient-to-br from-purple-500/10 to-blue-100 rounded-2xl shadow-lg p-6 md:p-8">
          <CardHeader className="p-0 pb-6">
            <CardTitle className="text-2xl font-bold text-gray-900">Học tập theo lộ trình cá nhân hóa
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Progress Section */}
              <div className="lg:col-span-2">
                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Tiến độ học tập</span>
                    <span className="text-sm font-bold text-purple-500">33% Complete</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full"style={{width: '33%'}}></div>
                  </div>
                </div>
                
                {/* Assessment Box */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-3">Đánh giá năng lực</h3>
                  <p className="text-gray-700 mb-4 italic">"Bạn đã có nền tảng khá tốt với môn database ở học kì trước. Dựa trên kết quả phân tích, chúng tôi khuyến nghị bạn tập trung vào các module nâng cao để tối ưu hóa thời gian học."</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-500">5h</div>
                      <div className="text-sm text-gray-600">Thời gian/tuần</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-500">6</div>
                      <div className="text-sm text-gray-600">Tuần còn lại</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-500">45h</div>
                      <div className="text-sm text-gray-600">Tổng yêu cầu</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Prediction Score */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl p-6 shadow-sm h-full flex flex-col justify-center items-center text-center">
                  <h3 className="font-semibold text-gray-900 mb-4">Điểm dự đoán</h3>
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mb-4">
                      <span className="text-3xl font-bold text-white">7.8</span>
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white"fill="currentColor"viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                      </svg>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-6">Dựa trên phân tích AI và lịch sử học tập</p>
                  
                  <button 
                    onClick={() =>navigate('/student/course-detail')}
                    className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 transform hover:scale-105 cursor-pointer">Bắt đầu học
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      
      {/* Footer */}
      <Footer />
    </div>)
}