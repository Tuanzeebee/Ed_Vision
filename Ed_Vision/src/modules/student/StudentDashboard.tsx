import Header from "../../components/layout/Header"
import Footer from "../../components/layout/Footer"
import { Card, CardContent } from "../../components/ui/student/Student_card"

type Props = {
  // Add props if needed
}

export default function StudentDashboard({}: Props) {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Sử dụng Header component được tái sử dụng */}
      <Header showNavigation={false} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
          <p className="text-gray-600 mt-2">Theo dõi tiến độ học tập và dự đoán điểm số của bạn</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2">Grade Predictions</h3>
              <p className="text-gray-600">Xem dự đoán điểm số chi tiết</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2">Performance Analytics</h3>
              <p className="text-gray-600">Phân tích hiệu suất học tập</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2">Study Plans</h3>
              <p className="text-gray-600">Lên kế hoạch học tập tối ưu</p>
            </CardContent>
          </Card>
        </div>
      </main>
      
      {/* Sử dụng Footer component được tái sử dụng */}
      <Footer />
    </div>
  )
}