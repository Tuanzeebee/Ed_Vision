import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/teacher/teacher_card"
import { Button } from "@/components/ui/teacher/teacher_button"
import { Badge } from "@/components/ui/teacher/teacher_badge"
import {
    Calendar,
    AlertTriangle,
    CheckCircle,
    BarChart3,
    Target,
    Trophy,
    BookOpen,
    GraduationCap,
    Activity,
    ArrowUp,
    ArrowDown
} from "lucide-react"
import TeacherLayout from "./components/TeacherLayout"

type Props = {}

export default function ProgressTracking({ }: Props) {
    const [selectedTimeRange, setSelectedTimeRange] = useState("HK 2025")

    // Dữ liệu thống kê tổng quan
    const overviewStats = [
        {
            title: "Tỉ lệ Tỉ thần học tập",
            value: "74.2%",
            change: "+7.3% so với tháng trước",
            trend: "up",
            icon: <GraduationCap className="w-5 h-5" />,
            color: "bg-blue-100 text-blue-600"
        },
        {
            title: "Lớp cao điểm số",
            value: "3",
            subtitle: "Cảnh cáo do điểm số thấp",
            trend: "warning",
            icon: <AlertTriangle className="w-5 h-5" />,
            color: "bg-orange-100 text-orange-600"
        },
        {
            title: "Khoanh vào giải thưởng",
            value: "giải Ky",
            subtitle: "Cần quan tâm",
            trend: "neutral",
            icon: <Trophy className="w-5 h-5" />,
            color: "bg-purple-100 text-purple-600"
        },
        {
            title: "Tỉ lệ hoàn tất ty",
            value: "78%",
            subtitle: "cải thiện",
            trend: "up",
            icon: <CheckCircle className="w-5 h-5" />,
            color: "bg-green-100 text-green-600"
        }
    ]

    // Dữ liệu biểu đồ xu hướng
    const chartData = [
        { month: "Th 1", value: 65 },
        { month: "Th 2", value: 68 },
        { month: "Th 3", value: 72 },
        { month: "Th 4", value: 70 },
        { month: "Th 5", value: 75 },
        { month: "Th 6", value: 78 },
        { month: "Th 7", value: 80 },
        { month: "Th 8", value: 82 }
    ]

    // Dữ liệu so sánh lớp
    const classComparison = [
        { id: "IT2024A", name: "IT2024A", progress: 85, trend: "up", color: "bg-green-500" },
        { id: "QTK2023A", name: "QTK2023A", progress: 83, trend: "up", color: "bg-blue-500" },
        { id: "NN2022A", name: "NN2022A", progress: 71, trend: "down", color: "bg-orange-500" },
        { id: "KT2022A", name: "KT2022A", progress: 48, trend: "down", color: "bg-red-500" }
    ]

    // Dữ liệu mốc quan trọng
    const milestones = [
        {
            title: "Bài kiểm tra giữa kỳ",
            date: "Ngày 15 - Tháng 10",
            status: "upcoming",
            icon: <BookOpen className="w-4 h-4" />
        },
        {
            title: "Nộp đồ án cuối học kỳ",
            date: "Ngày 30 - Tháng 10",
            status: "upcoming",
            icon: <Target className="w-4 h-4" />
        },
        {
            title: "Thi cuối kỳ",
            date: "Ngày 15 - Tháng 12",
            status: "pending",
            icon: <GraduationCap className="w-4 h-4" />
        }
    ]

    // Dữ liệu cảnh báo
    const alerts = [
        {
            id: "K140222A",
            title: "K140222A",
            description: "Tiến độ sinh viên trong lớp giảm",
            type: "warning",
            priority: "high"
        },
        {
            id: "IT2024B",
            title: "IT2024B",
            description: "Nguy hiểm sinh viên vắng mặt",
            type: "danger",
            priority: "high"
        },
        {
            id: "QN2024B",
            title: "QN2024B",
            description: "Tiến độ chậm hơn dự tính 31%",
            type: "warning",
            priority: "medium"
        }
    ]

    return (
        <TeacherLayout currentPage="progress-tracking">
            <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Theo dõi Tiến độ Học tập</h1>
                        <p className="text-gray-600">Dashboard theo dõi và đánh giá tiến độ học tập của học sinh</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Tuần này
                        </Button>
                        <Button
                            variant="outline"
                            className="flex items-center gap-2"
                            onClick={() => setSelectedTimeRange(selectedTimeRange === "HK 2025" ? "HK 2024" : "HK 2025")}
                        >
                            <BarChart3 className="w-4 h-4" />
                            {selectedTimeRange}
                        </Button>
                        <Button className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            Cập nhật
                        </Button>
                    </div>
                </div>

                {/* Overview Stats */}
                <div className="grid grid-cols-4 gap-6">
                    {overviewStats.map((stat, index) => (
                        <Card key={index} className="bg-white shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`p-2 rounded-lg ${stat.color}`}>
                                        {stat.icon}
                                    </div>
                                    {stat.trend === "up" && <ArrowUp className="w-4 h-4 text-green-500" />}
                                    {stat.trend === "down" && <ArrowDown className="w-4 h-4 text-red-500" />}
                                    {stat.trend === "warning" && <AlertTriangle className="w-4 h-4 text-orange-500" />}
                                </div>
                                <h3 className="text-sm font-medium text-gray-600 mb-1">{stat.title}</h3>
                                <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
                                {stat.change && (
                                    <p className="text-sm text-green-600">{stat.change}</p>
                                )}
                                {stat.subtitle && (
                                    <p className="text-sm text-gray-500">{stat.subtitle}</p>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid grid-cols-3 gap-6">
                    {/* Xu hướng Tiến độ Theo Thời gian */}
                    <Card className="col-span-2 bg-white shadow-sm">
                        <CardHeader className="pb-4">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg font-semibold">Xu hướng Tiến độ Theo Thời gian</CardTitle>
                                <div className="flex gap-2">
                                    <Badge variant="outline" className="text-blue-600 border-blue-200">Tất cả: 53-H</Badge>
                                    <Badge variant="outline" className="text-purple-600 border-purple-200">Phụ huynh</Badge>
                                    <Badge variant="outline" className="text-orange-600 border-orange-200">Hỗ trợ</Badge>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="relative h-64">
                                {/* Biểu đồ đường xu hướng */}
                                <svg width="100%" height="100%" viewBox="0 0 600 200" className="overflow-visible">
                                    {/* Grid lines */}
                                    {[20, 40, 60, 80, 100, 120, 140, 160, 180].map((y) => (
                                        <line
                                            key={y}
                                            x1="0"
                                            y1={y}
                                            x2="600"
                                            y2={y}
                                            stroke="#f1f5f9"
                                            strokeWidth="1"
                                        />
                                    ))}

                                    {/* Trend line */}
                                    <polyline
                                        fill="none"
                                        stroke="#3b82f6"
                                        strokeWidth="3"
                                        points={chartData.map((point, index) =>
                                            `${(index * 80) + 40},${180 - (point.value * 1.8)}`
                                        ).join(' ')}
                                    />

                                    {/* Data points */}
                                    {chartData.map((point, index) => (
                                        <circle
                                            key={index}
                                            cx={(index * 80) + 40}
                                            cy={180 - (point.value * 1.8)}
                                            r="4"
                                            fill="#3b82f6"
                                        />
                                    ))}
                                </svg>

                                {/* X-axis labels */}
                                <div className="flex justify-between mt-2 px-8">
                                    {chartData.map((point, index) => (
                                        <span key={index} className="text-xs text-gray-500">{point.month}</span>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Mốc Quan trọng */}
                    <Card className="bg-white shadow-sm">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <Target className="w-5 h-5" />
                                Mốc Quan trọng
                            </CardTitle>
                            <Button variant="ghost" size="sm" className="text-blue-600 p-0 h-auto">
                                Xem chi tiết
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {milestones.map((milestone, index) => (
                                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                                    <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                                        {milestone.icon}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900 text-sm">{milestone.title}</p>
                                        <p className="text-xs text-gray-500">{milestone.date}</p>
                                    </div>
                                    <Badge
                                        variant={milestone.status === "upcoming" ? "default" : "secondary"}
                                        className="text-xs"
                                    >
                                        {milestone.status === "upcoming" ? "Sắp tới" : "Chờ"}
                                    </Badge>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    {/* So sánh Tiến độ Lớp */}
                    <Card className="bg-white shadow-sm">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg font-semibold">So sánh Tiến độ Lớp</CardTitle>
                            <Button variant="ghost" size="sm" className="text-blue-600 p-0 h-auto">
                                Xem chi tiết
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {classComparison.map((classItem) => (
                                <div key={classItem.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${classItem.color}`}></div>
                                        <span className="font-medium text-gray-900">{classItem.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-gray-900">{classItem.progress}%</span>
                                        {classItem.trend === "up" ? (
                                            <ArrowUp className="w-4 h-4 text-green-500" />
                                        ) : (
                                            <ArrowDown className="w-4 h-4 text-red-500" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Cảnh báo Tiến độ */}
                    <Card className="bg-white shadow-sm">
                        <CardHeader className="pb-4">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-red-500" />
                                    Cảnh báo Tiến độ
                                </CardTitle>
                                <Button variant="ghost" size="sm" className="text-red-600 p-0 h-auto">
                                    Chi tiết tất cả
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {alerts.map((alert) => (
                                <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg border border-red-100 bg-red-50">
                                    <div className="p-1 rounded-full bg-red-100">
                                        <AlertTriangle className="w-4 h-4 text-red-600" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-semibold text-red-900 text-sm">{alert.title}</span>
                                            <Badge
                                                variant={alert.type === "danger" ? "destructive" : "secondary"}
                                                className="text-xs"
                                            >
                                                {alert.priority === "high" ? "Quan trọng" : "Trung bình"}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-red-700">{alert.description}</p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </TeacherLayout>
    )
}
