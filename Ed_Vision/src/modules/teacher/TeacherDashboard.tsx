import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/teacher/teacher_card"
import { Badge } from "@/components/ui/teacher/teacher_badge"
import { Button } from "@/components/ui/teacher/teacher_button"
import TeacherLayout from "./components/TeacherLayout"

// Asset imports
import imgChart from "@/assets/teacher/Chart_Teacher_Dashboard.png"
import imgStudent from "@/assets/teacher/Avatar_Student1.png"
import imgStudent1 from "@/assets/teacher/Avatar_Student2.png"
import imgStudent2 from "@/assets/teacher/Avatar_Student3.png"

export default function TeacherDashboard() {
    return (
        <TeacherLayout currentPage="dashboard">
            {/* Page Header */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Tổng quan Dashboard</h2>
                <p className="text-gray-600">Theo dõi tình hình học tập và quản lý sinh viên</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Tổng số sinh viên</p>
                                <p className="text-3xl font-bold text-gray-900">248</p>
                                <p className="text-sm text-green-600 mt-2">+12 từ kỳ trước</p>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-lg">
                                <i className="fas fa-users w-6 h-6 text-blue-600"></i>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Số lớp đang dạy</p>
                                <p className="text-3xl font-bold text-gray-900">8</p>
                                <p className="text-sm text-blue-600 mt-2">3 lớp mới</p>
                            </div>
                            <div className="bg-green-100 p-3 rounded-lg">
                                <i className="fas fa-book-open w-6 h-6 text-green-600"></i>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">% sinh viên At-Risk</p>
                                <p className="text-3xl font-bold text-red-600">12%</p>
                                <p className="text-sm text-red-600 mt-2">30 sinh viên</p>
                            </div>
                            <div className="bg-red-100 p-3 rounded-lg">
                                <i className="fas fa-exclamation-triangle w-6 h-6 text-red-600"></i>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Trung bình điểm lớp</p>
                                <p className="text-3xl font-bold text-gray-900">7.8</p>
                                <p className="text-sm text-green-600 mt-2">+0.3 từ kỳ trước</p>
                            </div>
                            <div className="bg-yellow-100 p-3 rounded-lg">
                                <i className="fas fa-chart-line w-6 h-6 text-yellow-600"></i>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Chart and At-Risk Students */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Progress Chart */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Tiến độ học tập theo tuần</CardTitle>
                            <div className="flex space-x-2">
                                <select className="bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-sm">
                                    <option>Năm học 2023-2024</option>
                                </select>
                                <select className="bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-sm">
                                    <option>Học kỳ 1</option>
                                </select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-80 w-full">
                            <img src={imgChart} alt="Progress Chart" className="w-full h-full object-cover rounded-lg" />
                        </div>
                    </CardContent>
                </Card>

                {/* At-Risk Students */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Sinh viên cần chú ý</CardTitle>
                            <Badge className="text-xs bg-red-100 text-red-800">30 sinh viên</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <div className="flex items-center space-x-3">
                                <img src={imgStudent} alt="Student" className="w-10 h-10 rounded-full flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">Nguyễn Thị B</p>
                                    <p className="text-sm text-gray-600">SV001234 - Lớp CNTT01</p>
                                    <p className="text-xs text-red-600">Điểm TB: 4.2 - Vắng 8 buổi</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                            <div className="flex items-center space-x-3">
                                <img src={imgStudent} alt="Student" className="w-10 h-10 rounded-full flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">Trần Văn C</p>
                                    <p className="text-sm text-gray-600">SV001235 - Lớp CNTT02</p>
                                    <p className="text-xs text-orange-600">Điểm TB: 5.1 - Chậm tiến độ</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <div className="flex items-center space-x-3">
                                <img src={imgStudent1} alt="Student" className="w-10 h-10 rounded-full flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">Lê Thị D</p>
                                    <p className="text-sm text-gray-600">SV001236 - Lớp CNTT01</p>
                                    <p className="text-xs text-red-600">Điểm TB: 3.8 - Vắng 12 buổi</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                            <div className="flex items-center space-x-3">
                                <img src={imgStudent2} alt="Student" className="w-10 h-10 rounded-full flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">Phạm Văn E</p>
                                    <p className="text-sm text-gray-600">SV001237 - Lớp CNTT03</p>
                                    <p className="text-xs text-orange-600">Điểm TB: 5.5 - Thiếu bài tập</p>
                                </div>
                            </div>
                        </div>

                        <Button className="w-full bg-red-600 hover:bg-red-700">
                            Xem tất cả sinh viên At-Risk
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Class Management Table */}
        </TeacherLayout>
    )
}