import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/teacher/teacher_card"
import { Badge } from "@/components/ui/teacher/teacher_badge"
import { Button } from "@/components/ui/teacher/teacher_button"
import TeacherLayout from "./components/TeacherLayout"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

// Asset imports
import imgStudent from "@/assets/teacher/Avatar_Student1.png"
import imgStudent1 from "@/assets/teacher/Avatar_Student2.png"
import imgStudent2 from "@/assets/teacher/Avatar_Student3.png"

export default function TeacherDashboard() {
    const navigate = useNavigate()

    // State for filters and chart view
    const [selectedFaculty, setSelectedFaculty] = useState("all")
    const [selectedCourse, setSelectedCourse] = useState("all")
    const [selectedYear, setSelectedYear] = useState("2024-2025")
    const [selectedSemester, setSelectedSemester] = useState("hk1")
    const [chartView, setChartView] = useState("weekly")

    // Render different chart based on view type
    const renderChart = () => {
        switch (chartView) {
            case "weekly":
                return (
                    <div className="h-full">
                        {/* Line Chart - Weekly Progress */}
                        <div className="flex items-end justify-around h-full pb-8">
                            {[65, 72, 68, 75, 78, 82, 85, 83, 88, 90, 87, 92].map((height, idx) => (
                                <div key={idx} className="flex flex-col items-center flex-1">
                                    <div className="relative w-full px-1">
                                        <div
                                            className="bg-gradient-to-t from-blue-500 to-blue-300 rounded-t hover:from-blue-600 hover:to-blue-400 transition-all cursor-pointer"
                                            style={{ height: `${height * 2.5}px` }}
                                        >
                                            <span className="text-xs font-bold text-white absolute -top-5 left-1/2 transform -translate-x-1/2">{height}%</span>
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-500 mt-2">T{idx + 1}</span>
                                </div>
                            ))}
                        </div>
                        <p className="text-center text-xs text-gray-500 mt-2">Tuần học</p>
                    </div>
                )

            case "major":
                return (
                    <div className="h-full flex items-center">
                        {/* Horizontal Bar Chart - Compare Majors */}
                        <div className="w-full space-y-3 px-4">
                            {[
                                { name: "Công nghệ phần mềm", score: 7.8, color: "bg-blue-500", students: 65 },
                                { name: "Khoa học máy tính", score: 7.5, color: "bg-green-500", students: 58 },
                                { name: "Hệ thống thông tin", score: 7.2, color: "bg-purple-500", students: 52 },
                                { name: "Mạng & Truyền thông", score: 6.9, color: "bg-orange-500", students: 48 },
                                { name: "Kỹ thuật máy tính", score: 7.1, color: "bg-indigo-500", students: 45 }
                            ].map((major, idx) => (
                                <div key={idx} className="flex items-center space-x-3">
                                    <span className="text-xs font-medium text-gray-700 w-40 text-right">{major.name}</span>
                                    <div className="flex-1 bg-gray-200 rounded-full h-8 relative">
                                        <div
                                            className={`${major.color} h-8 rounded-full flex items-center justify-between px-3 transition-all hover:opacity-90`}
                                            style={{ width: `${(major.score / 10) * 100}%` }}
                                        >
                                            <span className="text-xs font-bold text-white">{major.score}</span>
                                            <span className="text-xs text-white">{major.students} SV</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )

            case "course":
                return (
                    <div className="h-full flex flex-col">
                        {/* Legend moved to top */}
                        <div className="flex items-center justify-center space-x-6 mb-4 text-xs">
                            <div className="flex items-center space-x-1">
                                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                                <span className="text-gray-600">Điểm TB</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <div className="w-3 h-3 bg-red-500 rounded"></div>
                                <span className="text-gray-600">% Cảnh báo</span>
                            </div>
                        </div>
                        {/* Grouped Bar Chart - Compare Courses */}
                        <div className="flex-1 flex items-end justify-around pb-4">
                            {[
                                { name: "K28", score: 7.8, atrisk: 8, color: "bg-blue-500" },
                                { name: "K29", score: 7.5, atrisk: 10, color: "bg-green-500" },
                                { name: "K30", score: 7.2, atrisk: 12, color: "bg-purple-500" },
                                { name: "K31", score: 6.9, atrisk: 15, color: "bg-orange-500" }
                            ].map((course, idx) => (
                                <div key={idx} className="flex flex-col items-center space-y-2">
                                    <div className="flex space-x-2 items-end h-48">
                                        <div className="flex flex-col items-center">
                                            <span className="text-xs font-bold text-gray-700 mb-1">{course.score}</span>
                                            <div
                                                className={`${course.color} w-14 rounded-t hover:opacity-80 transition-all cursor-pointer`}
                                                style={{ height: `${course.score * 20}px` }}
                                            ></div>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <span className="text-xs font-bold text-red-600 mb-1">{course.atrisk}%</span>
                                            <div
                                                className="bg-red-500 w-14 rounded-t hover:opacity-80 transition-all cursor-pointer"
                                                style={{ height: `${course.atrisk * 10}px` }}
                                            ></div>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-gray-700">{course.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )

            case "atrisk":
                return (
                    <div className="h-full flex items-center justify-center">
                        {/* Donut Chart - At-Risk Distribution */}
                        <div className="relative">
                            <svg width="280" height="280" viewBox="0 0 280 280">
                                <circle cx="140" cy="140" r="100" fill="none" stroke="#fee2e2" strokeWidth="40" />
                                <circle
                                    cx="140" cy="140" r="100" fill="none"
                                    stroke="#ef4444" strokeWidth="40"
                                    strokeDasharray="188 440"
                                    transform="rotate(-90 140 140)"
                                />
                                <circle
                                    cx="140" cy="140" r="100" fill="none"
                                    stroke="#f97316" strokeWidth="40"
                                    strokeDasharray="125 440"
                                    strokeDashoffset="-188"
                                    transform="rotate(-90 140 140)"
                                />
                                <circle
                                    cx="140" cy="140" r="100" fill="none"
                                    stroke="#22c55e" strokeWidth="40"
                                    strokeDasharray="127 440"
                                    strokeDashoffset="-313"
                                    transform="rotate(-90 140 140)"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <p className="text-3xl font-bold text-gray-900">248</p>
                                <p className="text-xs text-gray-500">Tổng SV</p>
                            </div>
                        </div>
                        <div className="ml-8 space-y-3">
                            <div className="flex items-center space-x-3">
                                <div className="w-4 h-4 bg-red-500 rounded"></div>
                                <span className="text-sm text-gray-700">Nguy cơ cao:</span>
                                <span className="text-sm font-bold text-red-600">30 SV (12%)</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                                <span className="text-sm text-gray-700">Cần theo dõi:</span>
                                <span className="text-sm font-bold text-orange-600">50 SV (20%)</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="w-4 h-4 bg-green-500 rounded"></div>
                                <span className="text-sm text-gray-700">Bình thường:</span>
                                <span className="text-sm font-bold text-green-600">168 SV (68%)</span>
                            </div>
                        </div>
                    </div>
                )

            case "debt":
                return (
                    <div className="h-full flex flex-col">
                        {/* Legend at top */}
                        <div className="flex items-center justify-center space-x-3 mb-4 text-xs">
                            <div className="flex items-center space-x-1">
                                <div className="w-3 h-3 bg-red-500 rounded"></div>
                                <span className="text-gray-600">Nợ ≥3 môn</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <div className="w-3 h-3 bg-orange-500 rounded"></div>
                                <span className="text-gray-600">Nợ 2 môn</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                                <span className="text-gray-600">Nợ 1 môn</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <div className="w-3 h-3 bg-green-500 rounded"></div>
                                <span className="text-gray-600">Không nợ</span>
                            </div>
                        </div>
                        {/* Stacked Bar Chart */}
                        <div className="flex-1 flex items-end justify-around pb-4 px-4">
                            {[
                                { name: "CNPM", total: 65, debt1: 8, debt2: 5, debt3: 2 },
                                { name: "KHMT", total: 58, debt1: 10, debt2: 6, debt3: 3 },
                                { name: "HTTT", total: 52, debt1: 12, debt2: 8, debt3: 5 },
                                { name: "MMT", total: 48, debt1: 15, debt2: 10, debt3: 6 },
                                { name: "KTMT", total: 45, debt1: 11, debt2: 7, debt3: 4 }
                            ].map((major, idx) => (
                                <div key={idx} className="flex flex-col items-center space-y-2">
                                    <div className="flex flex-col items-center w-16 h-52">
                                        <div className="w-full flex flex-col-reverse">
                                            <div
                                                className="bg-green-500 w-full hover:opacity-80 transition-all cursor-pointer"
                                                style={{ height: `${((major.total - major.debt1 - major.debt2 - major.debt3) / major.total) * 200}px` }}
                                            ></div>
                                            <div
                                                className="bg-yellow-500 w-full hover:opacity-80 transition-all cursor-pointer"
                                                style={{ height: `${(major.debt1 / major.total) * 200}px` }}
                                            ></div>
                                            <div
                                                className="bg-orange-500 w-full hover:opacity-80 transition-all cursor-pointer"
                                                style={{ height: `${(major.debt2 / major.total) * 200}px` }}
                                            ></div>
                                            <div
                                                className="bg-red-500 w-full rounded-t hover:opacity-80 transition-all cursor-pointer"
                                                style={{ height: `${(major.debt3 / major.total) * 200}px` }}
                                            ></div>
                                        </div>
                                        <span className="text-xs font-bold text-red-600 mt-1">
                                            {Math.round((major.debt1 + major.debt2 + major.debt3) / major.total * 100)}%
                                        </span>
                                    </div>
                                    <span className="text-xs font-medium text-gray-700">{major.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )

            case "attendance":
                return (
                    <div className="h-full flex flex-col">
                        {/* Attendance Rate Chart */}
                        <div className="flex-1 flex items-center justify-center">
                            <div className="w-full space-y-4 px-6">
                                {[
                                    { range: "95-100%", count: 85, percentage: 34, color: "bg-green-500" },
                                    { range: "85-94%", count: 72, percentage: 29, color: "bg-blue-500" },
                                    { range: "75-84%", count: 54, percentage: 22, color: "bg-yellow-500" },
                                    { range: "65-74%", count: 25, percentage: 10, color: "bg-orange-500" },
                                    { range: "<65%", count: 12, percentage: 5, color: "bg-red-500" }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-center space-x-3">
                                        <span className="text-xs font-medium text-gray-700 w-20 text-right">{item.range}</span>
                                        <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
                                            <div
                                                className={`${item.color} h-6 rounded-full flex items-center justify-between px-3 transition-all hover:opacity-90 cursor-pointer`}
                                                style={{ width: `${item.percentage}%` }}
                                            >
                                                <span className="text-xs font-bold text-white">{item.count} SV</span>
                                                <span className="text-xs text-white">{item.percentage}%</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <p className="text-center text-xs text-gray-500 mt-2">Tỷ lệ tham dự lớp</p>
                    </div>
                )

            case "performance":
                return (
                    <div className="h-full flex flex-col">
                        {/* Multi-line Performance Trend */}
                        <div className="flex items-center justify-center space-x-4 mb-3 text-xs">
                            <div className="flex items-center space-x-1">
                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                <span className="text-gray-600">Điểm TB</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span className="text-gray-600">Tham dự</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                <span className="text-gray-600">Cảnh báo</span>
                            </div>
                        </div>
                        <div className="flex-1 relative">
                            {/* Y-axis labels */}
                            <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs text-gray-500 pr-2">
                                <span>100%</span>
                                <span>75%</span>
                                <span>50%</span>
                                <span>25%</span>
                                <span>0%</span>
                            </div>
                            {/* Chart area */}
                            <div className="ml-8 h-full flex items-end justify-around pb-6">
                                {[
                                    { month: "T9", score: 65, attend: 85, risk: 18 },
                                    { month: "T10", score: 70, attend: 88, risk: 15 },
                                    { month: "T11", score: 72, attend: 87, risk: 14 },
                                    { month: "T12", score: 75, attend: 90, risk: 12 },
                                    { month: "T1", score: 78, attend: 92, risk: 10 }
                                ].map((data, idx) => (
                                    <div key={idx} className="flex flex-col items-center flex-1 relative group">
                                        {/* Blue line (score) */}
                                        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                                            <div
                                                className="w-2 h-2 bg-blue-500 rounded-full border-2 border-white shadow"
                                                style={{ marginBottom: `${data.score * 2.2}px` }}
                                            ></div>
                                        </div>
                                        {/* Green line (attendance) */}
                                        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                                            <div
                                                className="w-2 h-2 bg-green-500 rounded-full border-2 border-white shadow"
                                                style={{ marginBottom: `${data.attend * 2.2}px` }}
                                            ></div>
                                        </div>
                                        {/* Red line (at-risk, inverted) */}
                                        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                                            <div
                                                className="w-2 h-2 bg-red-500 rounded-full border-2 border-white shadow"
                                                style={{ marginBottom: `${(100 - data.risk) * 2.2}px` }}
                                            ></div>
                                        </div>
                                        {/* Tooltip on hover */}
                                        <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                            Điểm: {data.score}% | Tham dự: {data.attend}% | CB: {data.risk}%
                                        </div>
                                        <span className="text-xs text-gray-600 mt-2">{data.month}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <p className="text-center text-xs text-gray-500">Xu hướng 5 tháng gần nhất</p>
                    </div>
                )

            default:
                return null
        }
    }

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
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <p className="text-sm text-gray-600 mb-3">Phân bố điểm sinh viên</p>

                                {/* Distribution with mini progress bars */}
                                <div className="space-y-2 mb-3">
                                    <div>
                                        <div className="flex items-baseline justify-between mb-1">
                                            <span className="text-xs text-red-700">Thấp (&lt;5)</span>
                                            <span className="text-xl font-bold text-red-600">50 <span className="text-xs font-medium">20%</span></span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                                            <div className="bg-red-500 h-1.5 rounded-full" style={{ width: '20%' }}></div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-baseline justify-between mb-1">
                                            <span className="text-xs text-yellow-700">Trung bình (5-7.9)</span>
                                            <span className="text-xl font-bold text-yellow-700">74 <span className="text-xs font-medium">30%</span></span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                                            <div className="bg-yellow-500 h-1.5 rounded-full" style={{ width: '30%' }}></div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-baseline justify-between mb-1">
                                            <span className="text-xs text-green-700">Cao (≥8)</span>
                                            <span className="text-xl font-bold text-green-600">124 <span className="text-xs font-medium">50%</span></span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                                            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '50%' }}></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Key stats inline */}
                                <div className="text-xs text-gray-600 pt-2 border-t">
                                    <span>Min: <span className="font-bold text-gray-900">3.2</span></span>
                                    <span className="mx-2">•</span>
                                    <span>Trung vị: <span className="font-bold text-blue-600">7.5</span></span>
                                    <span className="mx-2">•</span>
                                    <span>Giữa: <span className="font-bold text-gray-900">6.6</span></span>
                                </div>
                            </div>
                            <div className="bg-purple-100 p-3 rounded-lg ml-3">
                                <i className="fas fa-chart-bar w-6 h-6 text-purple-600"></i>
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
                        <div className="flex flex-col space-y-3">
                            <div className="flex items-center justify-between">
                                <CardTitle>Tiến độ học tập & Phân tích</CardTitle>
                                <Badge className="text-xs bg-blue-100 text-blue-800">248 sinh viên</Badge>
                            </div>

                            {/* Multi-level Filters */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                <select
                                    className="bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    value={selectedFaculty}
                                    onChange={(e) => setSelectedFaculty(e.target.value)}
                                >
                                    <option value="all">Tất cả khoa</option>
                                    <option value="cnpm">Khoa Công nghệ phần mềm</option>
                                    <option value="khmt">Khoa Khoa học máy tính</option>
                                    <option value="httt">Khoa Hệ thống thông tin</option>
                                    <option value="mmt">Khoa Mạng máy tính & Truyền thông</option>
                                    <option value="ktmt">Khoa Kỹ thuật máy tính</option>
                                </select>

                                <select
                                    className="bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    value={selectedCourse}
                                    onChange={(e) => setSelectedCourse(e.target.value)}
                                >
                                    <option value="all">Tất cả khóa</option>
                                    <option value="k28">Khóa 28</option>
                                    <option value="k29">Khóa 29</option>
                                    <option value="k30">Khóa 30</option>
                                    <option value="k31">Khóa 31</option>
                                </select>

                                <select
                                    className="bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                >
                                    <option value="2024-2025">Năm học 2024-2025</option>
                                    <option value="2023-2024">Năm học 2023-2024</option>
                                    <option value="2022-2023">Năm học 2022-2023</option>
                                    <option value="2021-2022">Năm học 2021-2022</option>
                                </select>

                                <select
                                    className="bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    value={selectedSemester}
                                    onChange={(e) => setSelectedSemester(e.target.value)}
                                >
                                    <option value="hk1">Học kỳ 1</option>
                                    <option value="hk2">Học kỳ 2</option>
                                    <option value="hk3">Học kỳ hè</option>
                                    <option value="all">Cả năm học</option>
                                </select>
                            </div>

                            {/* View Type Selector */}
                            <div className="flex items-center space-x-2 pt-2 border-t">
                                <span className="text-xs text-gray-600 font-medium">Loại biểu đồ:</span>
                                <select
                                    className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-medium"
                                    value={chartView}
                                    onChange={(e) => setChartView(e.target.value)}
                                >
                                    <option value="weekly">📈 Tiến độ theo tuần</option>
                                    <option value="major">📊 So sánh theo ngành</option>
                                    <option value="course">🎓 So sánh theo khóa</option>
                                    <option value="atrisk">⚠️ Phân bố cảnh báo</option>
                                    <option value="debt">📉 Tỷ lệ nợ môn</option>
                                </select>

                                <Button
                                    className="ml-auto text-xs px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700"
                                    onClick={() => {
                                        setSelectedFaculty("all")
                                        setSelectedCourse("all")
                                        setSelectedYear("2024-2025")
                                        setSelectedSemester("hk1")
                                        setChartView("weekly")
                                    }}
                                >
                                    <i className="fas fa-redo text-xs mr-1"></i>
                                    Reset
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Chart Container - Dynamic based on view */}
                        <div className="h-80 w-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 relative">
                            {renderChart()}
                        </div>

                        {/* Quick Stats Summary */}
                        <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t">
                        </div>
                    </CardContent>
                </Card>

                {/* At-Risk Students */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col space-y-2">
                            <div className="flex items-center justify-between">
                                <CardTitle>Sinh viên cần chú ý</CardTitle>
                                <Badge className="text-xs bg-red-100 text-red-800">30 sinh viên</Badge>
                            </div>
                            {/* Quick filters */}
                            <div className="flex items-center space-x-2">
                                <select className="bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs flex-1">
                                    <option value="all">Tất cả</option>
                                    <option value="high">🔴 Nguy cơ cao</option>
                                    <option value="medium">🟠 Cần theo dõi</option>
                                </select>
                                <select className="bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs flex-1">
                                    <option value="score">Sắp xếp: Điểm</option>
                                    <option value="absence">Vắng nhiều</option>
                                    <option value="debt">Nợ môn</option>
                                </select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer">
                            <div className="flex items-center space-x-3">
                                <img src={imgStudent} alt="Student" className="w-10 h-10 rounded-full flex-shrink-0 border-2 border-red-300" />
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <p className="font-medium text-gray-900">Nguyễn Thị B</p>
                                        <Badge className="text-xs bg-red-600 text-white">Nguy cơ cao</Badge>
                                    </div>
                                    <p className="text-sm text-gray-600">SV001234 - CNTT01</p>
                                    <div className="flex items-center space-x-3 mt-1">
                                        <span className="text-xs text-red-600">📊 Điểm: 4.2</span>
                                        <span className="text-xs text-red-600">❌ Vắng: 8/12</span>
                                        <span className="text-xs text-red-600">📚 Nợ: 2 môn</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer">
                            <div className="flex items-center space-x-3">
                                <img src={imgStudent} alt="Student" className="w-10 h-10 rounded-full flex-shrink-0 border-2 border-orange-300" />
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <p className="font-medium text-gray-900">Trần Văn C</p>
                                        <Badge className="text-xs bg-orange-500 text-white">Cần Theo dõi</Badge>
                                    </div>
                                    <p className="text-sm text-gray-600">SV001235 - CNTT02</p>
                                    <div className="flex items-center space-x-3 mt-1">
                                        <span className="text-xs text-orange-600">📊 Điểm: 5.1</span>
                                        <span className="text-xs text-orange-600">⏰ Chậm tiến độ</span>
                                        <span className="text-xs text-orange-600">📚 Nợ: 1 môn</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer">
                            <div className="flex items-center space-x-3">
                                <img src={imgStudent1} alt="Student" className="w-10 h-10 rounded-full flex-shrink-0 border-2 border-red-300" />
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <p className="font-medium text-gray-900">Lê Thị D</p>
                                        <Badge className="text-xs bg-red-600 text-white">Nguy cơ cao</Badge>
                                    </div>
                                    <p className="text-sm text-gray-600">SV001236 - CNTT01</p>
                                    <div className="flex items-center space-x-3 mt-1">
                                        <span className="text-xs text-red-600">📊 Điểm: 3.8</span>
                                        <span className="text-xs text-red-600">❌ Vắng: 12/12</span>
                                        <span className="text-xs text-red-600">📚 Nợ: 3 môn</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer">
                            <div className="flex items-center space-x-3">
                                <img src={imgStudent2} alt="Student" className="w-10 h-10 rounded-full flex-shrink-0 border-2 border-orange-300" />
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <p className="font-medium text-gray-900">Phạm Văn E</p>
                                        <Badge className="text-xs bg-orange-500 text-white">Cần Theo dõi</Badge>
                                    </div>
                                    <p className="text-sm text-gray-600">SV001237 - CNTT03</p>
                                    <div className="flex items-center space-x-3 mt-1">
                                        <span className="text-xs text-orange-600">📊 Điểm: 5.5</span>
                                        <span className="text-xs text-orange-600">📝 Thiếu BT</span>
                                        <span className="text-xs text-orange-600">❌ Vắng: 5/12</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Button
                            className="w-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center space-x-2"
                            onClick={() => navigate('/teacher/reports-alerts?filter=high-risk')}
                        >
                            <span>Xem tất cả sinh viên At-Risk</span>
                            <i className="fas fa-arrow-right text-sm"></i>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Class Management Table */}
        </TeacherLayout>
    )
}
