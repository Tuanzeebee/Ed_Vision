import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/teacher/teacher_card"
import { Badge } from "@/components/ui/teacher/teacher_badge"
import TeacherLayout from "./components/TeacherLayout"
import {
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    Users,
    Target,
    Clock,
    CheckCircle,
    Calendar,
    BarChart3,
    Activity,
    MessageSquare,
    Send,
    X
} from "lucide-react"
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
)

// Dữ liệu lớp học
const classesData = [
    { id: 'IT2021A', name: 'IT2021A', totalStudents: 35, department: 'Công nghệ thông tin', semester: 'HK1 2024-2025' },
    { id: 'IT2021B', name: 'IT2021B', totalStudents: 32, department: 'Công nghệ thông tin', semester: 'HK1 2024-2025' },
    { id: 'IT2020A', name: 'IT2020A', totalStudents: 30, department: 'Công nghệ thông tin', semester: 'HK1 2024-2025' },
    { id: 'IT2020B', name: 'IT2020B', totalStudents: 28, department: 'Công nghệ thông tin', semester: 'HK1 2024-2025' },
    { id: 'IT2019A', name: 'IT2019A', totalStudents: 33, department: 'Công nghệ thông tin', semester: 'HK1 2024-2025' },
    { id: 'IT2019B', name: 'IT2019B', totalStudents: 31, department: 'Công nghệ thông tin', semester: 'HK1 2024-2025' },
    { id: 'DT2021A', name: 'DT2021A', totalStudents: 29, department: 'Điện tử viễn thông', semester: 'HK1 2024-2025' },
    { id: 'DT2021B', name: 'DT2021B', totalStudents: 27, department: 'Điện tử viễn thông', semester: 'HK1 2024-2025' },
]

// Timeline milestones với dữ liệu tổng hợp
const timelineMilestones = [
    {
        id: 1,
        title: "Đầu học kỳ I",
        date: "01/09/2024",
        status: "completed",
        description: "Khảo sát ban đầu và thiết lập baseline",
        overview: {
            totalStudents: 245,
            avgGPA: 2.65,
            medianGPA: 2.7,
            avgAttendance: 78.5,
            assignmentCompletion: 72.3,
            onTrack: 180,
            atRisk: 45,
            improvement: 0,
            teachingEffectiveness: 7.2
        },
        classMetrics: [
            { classId: 'IT2021A', gpa: 2.8, median: 2.8, attendance: 82, assignmentRate: 75, onTrack: 25, atRisk: 7, trend: 'stable', topStudents: ['SV010', 'SV011', 'SV012'] },
            { classId: 'IT2021B', gpa: 2.6, median: 2.6, attendance: 78, assignmentRate: 70, onTrack: 20, atRisk: 9, trend: 'stable', topStudents: ['SV020', 'SV021', 'SV022'] },
            { classId: 'IT2020A', gpa: 2.7, median: 2.7, attendance: 80, assignmentRate: 73, onTrack: 22, atRisk: 6, trend: 'stable', topStudents: ['SV030', 'SV031', 'SV032'] },
            { classId: 'IT2020B', gpa: 2.5, median: 2.5, attendance: 76, assignmentRate: 68, onTrack: 18, atRisk: 8, trend: 'stable', topStudents: ['SV040', 'SV041', 'SV042'] },
            { classId: 'IT2019A', gpa: 2.9, median: 2.9, attendance: 85, assignmentRate: 80, onTrack: 28, atRisk: 3, trend: 'stable', topStudents: ['SV050', 'SV051', 'SV052'] },
            { classId: 'IT2019B', gpa: 2.6, median: 2.6, attendance: 79, assignmentRate: 71, onTrack: 21, atRisk: 7, trend: 'stable', topStudents: ['SV060', 'SV061', 'SV062'] },
            { classId: 'DT2021A', gpa: 2.4, median: 2.5, attendance: 75, assignmentRate: 67, onTrack: 19, atRisk: 8, trend: 'stable', topStudents: ['SV070', 'SV071', 'SV072'] },
            { classId: 'DT2021B', gpa: 2.3, median: 2.4, attendance: 72, assignmentRate: 65, onTrack: 17, atRisk: 9, trend: 'stable', topStudents: ['SV080', 'SV081', 'SV082'] },
        ],
        atRiskStudents: [
            { id: 'SV001', name: 'Nguyễn Văn An', class: 'IT2021A', gpa: 1.5, attendance: 65, issues: ['Attendance', 'Assignment'] },
            { id: 'SV002', name: 'Trần Thị Bình', class: 'IT2021B', gpa: 1.8, attendance: 70, issues: ['GPA'] },
            { id: 'SV003', name: 'Lê Văn Cường', class: 'IT2020A', gpa: 1.6, attendance: 60, issues: ['Attendance', 'GPA'] },
            { id: 'SV004', name: 'Phạm Thị Dung', class: 'DT2021A', gpa: 1.7, attendance: 68, issues: ['Assignment'] },
            { id: 'SV005', name: 'Hoàng Văn Em', class: 'DT2021B', gpa: 1.4, attendance: 55, issues: ['Attendance', 'GPA', 'Assignment'] },
        ]
    },
    {
        id: 2,
        title: "Giữa kỳ I",
        date: "15/10/2024",
        status: "in-progress",
        description: "Đánh giá giữa kỳ và điều chỉnh",
        overview: {
            totalStudents: 245,
            avgGPA: 2.82,
            medianGPA: 2.85,
            avgAttendance: 82.7,
            assignmentCompletion: 78.5,
            onTrack: 195,
            atRisk: 35,
            improvement: 6.4,
            teachingEffectiveness: 7.8
        },
        classMetrics: [
            { classId: 'IT2021A', gpa: 3.0, median: 3.0, attendance: 87, assignmentRate: 82, onTrack: 28, atRisk: 5, trend: 'up', topStudents: ['SV010', 'SV011', 'SV012'] },
            { classId: 'IT2021B', gpa: 2.8, median: 2.8, attendance: 83, assignmentRate: 77, onTrack: 23, atRisk: 7, trend: 'up', topStudents: ['SV020', 'SV021', 'SV022'] },
            { classId: 'IT2020A', gpa: 2.9, median: 2.9, attendance: 85, assignmentRate: 80, onTrack: 25, atRisk: 4, trend: 'up', topStudents: ['SV030', 'SV031', 'SV032'] },
            { classId: 'IT2020B', gpa: 2.7, median: 2.7, attendance: 81, assignmentRate: 75, onTrack: 21, atRisk: 6, trend: 'up', topStudents: ['SV040', 'SV041', 'SV042'] },
            { classId: 'IT2019A', gpa: 3.1, median: 3.1, attendance: 90, assignmentRate: 88, onTrack: 30, atRisk: 2, trend: 'up', topStudents: ['SV050', 'SV051', 'SV052'] },
            { classId: 'IT2019B', gpa: 2.8, median: 2.8, attendance: 84, assignmentRate: 78, onTrack: 24, atRisk: 5, trend: 'up', topStudents: ['SV060', 'SV061', 'SV062'] },
            { classId: 'DT2021A', gpa: 2.6, median: 2.7, attendance: 80, assignmentRate: 74, onTrack: 22, atRisk: 6, trend: 'up', topStudents: ['SV070', 'SV071', 'SV072'] },
            { classId: 'DT2021B', gpa: 2.5, median: 2.6, attendance: 77, assignmentRate: 72, onTrack: 20, atRisk: 7, trend: 'up', topStudents: ['SV080', 'SV081', 'SV082'] },
        ],
        atRiskStudents: [
            { id: 'SV002', name: 'Trần Thị Bình', class: 'IT2021B', gpa: 2.0, attendance: 75, issues: ['GPA'] },
            { id: 'SV003', name: 'Lê Văn Cường', class: 'IT2020A', gpa: 1.9, attendance: 72, issues: ['GPA'] },
            { id: 'SV005', name: 'Hoàng Văn Em', class: 'DT2021B', gpa: 1.7, attendance: 65, issues: ['Attendance', 'GPA'] },
        ]
    },
    {
        id: 3,
        title: "Cuối kỳ I",
        date: "15/01/2025",
        status: "upcoming",
        description: "Đánh giá tổng kết học kỳ I",
        overview: {
            totalStudents: 245,
            avgGPA: 2.95,
            medianGPA: 3.0,
            avgAttendance: 86.2,
            assignmentCompletion: 84.7,
            onTrack: 210,
            atRisk: 25,
            improvement: 11.3,
            teachingEffectiveness: 8.5
        },
        classMetrics: [
            { classId: 'IT2021A', gpa: 3.2, median: 3.2, attendance: 90, assignmentRate: 88, onTrack: 30, atRisk: 3, trend: 'up', topStudents: ['SV010', 'SV011', 'SV012'] },
            { classId: 'IT2021B', gpa: 3.0, median: 3.0, attendance: 87, assignmentRate: 84, onTrack: 26, atRisk: 5, trend: 'up', topStudents: ['SV020', 'SV021', 'SV022'] },
            { classId: 'IT2020A', gpa: 3.1, median: 3.1, attendance: 89, assignmentRate: 86, onTrack: 27, atRisk: 2, trend: 'up', topStudents: ['SV030', 'SV031', 'SV032'] },
            { classId: 'IT2020B', gpa: 2.9, median: 2.9, attendance: 85, assignmentRate: 82, onTrack: 24, atRisk: 4, trend: 'up', topStudents: ['SV040', 'SV041', 'SV042'] },
            { classId: 'IT2019A', gpa: 3.3, median: 3.3, attendance: 93, assignmentRate: 92, onTrack: 32, atRisk: 1, trend: 'up', topStudents: ['SV050', 'SV051', 'SV052'] },
            { classId: 'IT2019B', gpa: 3.0, median: 3.0, attendance: 88, assignmentRate: 85, onTrack: 27, atRisk: 3, trend: 'up', topStudents: ['SV060', 'SV061', 'SV062'] },
            { classId: 'DT2021A', gpa: 2.8, median: 2.9, attendance: 84, assignmentRate: 81, onTrack: 25, atRisk: 4, trend: 'up', topStudents: ['SV070', 'SV071', 'SV072'] },
            { classId: 'DT2021B', gpa: 2.7, median: 2.8, attendance: 81, assignmentRate: 78, onTrack: 23, atRisk: 5, trend: 'up', topStudents: ['SV080', 'SV081', 'SV082'] },
        ],
        atRiskStudents: []
    },
    {
        id: 4,
        title: "Đầu kỳ II",
        date: "10/02/2025",
        status: "upcoming",
        description: "Bắt đầu học kỳ II",
        overview: {
            totalStudents: 245,
            avgGPA: 0,
            medianGPA: 0,
            avgAttendance: 0,
            assignmentCompletion: 0,
            onTrack: 0,
            atRisk: 0,
            improvement: 0,
            teachingEffectiveness: 0
        },
        classMetrics: [],
        atRiskStudents: []
    }
]

// Previous semester data for comparison
const previousSemesterData = {
    avgGPA: 2.75,
    medianGPA: 2.8,
    avgAttendance: 80.5,
    assignmentCompletion: 75.8,
    onTrack: 185,
    atRisk: 40,
    teachingEffectiveness: 7.5
}

// (Removed top performers dataset — not used anymore)

export default function ProgressTracking() {
    const [selectedMilestone, setSelectedMilestone] = useState<number | null>(null)
    const [activeTab, setActiveTab] = useState<'overview' | 'comparison' | 'atrisk'>('overview')
    const [selectedClass, setSelectedClass] = useState<string | null>(null)
    const [showClassDetail, setShowClassDetail] = useState(false)
    const [selectedStudent, setSelectedStudent] = useState<any>(null)
    const [showStudentDetail, setShowStudentDetail] = useState(false)
    const [quickMessage, setQuickMessage] = useState('')
    const [appointmentDate, setAppointmentDate] = useState('')
    const [appointmentTime, setAppointmentTime] = useState('')

    // Chart data for GPA trend
    const trendChartData = {
        labels: timelineMilestones.slice(0, 3).map(m => m.title),
        datasets: [{
            label: 'GPA Trung bình',
            data: timelineMilestones.slice(0, 3).map(m => m.overview.avgGPA),
            borderColor: 'rgb(99, 102, 241)',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            fill: true,
            tension: 0.4,
            yAxisID: 'y'
        }, {
            label: 'GPA Trung vị',
            data: timelineMilestones.slice(0, 3).map(m => m.overview.medianGPA),
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            fill: true,
            tension: 0.4,
            yAxisID: 'y'
        }]
    }

    // Chart data for Attendance & Assignment trends
    const attendanceAssignmentChartData = {
        labels: timelineMilestones.slice(0, 3).map(m => m.title),
        datasets: [{
            label: 'Điểm danh (%)',
            data: timelineMilestones.slice(0, 3).map(m => m.overview.avgAttendance),
            borderColor: 'rgb(251, 146, 60)',
            backgroundColor: 'rgba(251, 146, 60, 0.1)',
            fill: true,
            tension: 0.4
        }]
    }

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' as const },
            title: { display: false }
        },
        scales: {
            y: { beginAtZero: true, max: 4 }
        }
    }

    const percentageChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' as const },
            title: { display: false }
        },
        scales: {
            y: { beginAtZero: true, max: 100 }
        }
    }

    // Get current milestone data
    const currentMilestone = selectedMilestone
        ? timelineMilestones.find(m => m.id === selectedMilestone)
        : timelineMilestones.find(m => m.status === 'in-progress') || timelineMilestones[0]

    // Class comparison chart data
    const classComparisonData = currentMilestone ? {
        labels: currentMilestone.classMetrics.map(cm => {
            const cls = classesData.find(c => c.id === cm.classId)
            return cls?.name || cm.classId
        }),
        datasets: [{
            label: 'GPA Trung vị',
            data: currentMilestone.classMetrics.map(cm => cm.median),
            backgroundColor: 'rgba(99, 102, 241, 0.8)',
        }, {
            label: 'Điểm danh (%)',
            data: currentMilestone.classMetrics.map(cm => cm.attendance),
            backgroundColor: 'rgba(251, 146, 60, 0.8)',
        }]
    } : null

    return (
        <TeacherLayout currentPage="progress-tracking">
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-xl shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-bold mb-2">Theo Dõi Tiến Độ Học Tập</h2>
                            <p className="text-purple-100">Phân tích chi tiết tiến độ học tập qua các mốc thời gian</p>
                        </div>
                    </div>
                </div>

                {/* KPI Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-blue-600 mb-1">Tổng sinh viên</p>
                                    <p className="text-3xl font-bold text-blue-900">
                                        {currentMilestone?.overview.totalStudents || 0}
                                    </p>
                                </div>
                                <Users className="w-12 h-12 text-blue-500 opacity-20" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-green-600 mb-1">GPA Trung vị</p>
                                    <p className="text-3xl font-bold text-green-900">
                                        {currentMilestone?.overview.medianGPA.toFixed(2) || '0.00'}
                                    </p>
                                    <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                                        {currentMilestone && currentMilestone.overview.medianGPA > previousSemesterData.medianGPA ? (
                                            <>
                                                <TrendingUp className="w-3 h-3" />
                                                +{((currentMilestone.overview.medianGPA - previousSemesterData.medianGPA) / previousSemesterData.medianGPA * 100).toFixed(1)}% vs kỳ trước
                                            </>
                                        ) : currentMilestone && currentMilestone.overview.medianGPA < previousSemesterData.medianGPA ? (
                                            <>
                                                <TrendingDown className="w-3 h-3" />
                                                {((currentMilestone.overview.medianGPA - previousSemesterData.medianGPA) / previousSemesterData.medianGPA * 100).toFixed(1)}% vs kỳ trước
                                            </>
                                        ) : null}
                                    </p>
                                </div>
                                <Target className="w-12 h-12 text-green-500 opacity-20" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-orange-600 mb-1">Điểm danh TB</p>
                                    <p className="text-3xl font-bold text-orange-900">
                                        {currentMilestone?.overview.avgAttendance.toFixed(1) || '0.0'}%
                                    </p>
                                    <p className="text-xs text-orange-600 flex items-center gap-1 mt-1">
                                        {currentMilestone && currentMilestone.overview.avgAttendance > previousSemesterData.avgAttendance ? (
                                            <>
                                                <TrendingUp className="w-3 h-3" />
                                                +{(currentMilestone.overview.avgAttendance - previousSemesterData.avgAttendance).toFixed(1)}% vs kỳ trước
                                            </>
                                        ) : currentMilestone && currentMilestone.overview.avgAttendance < previousSemesterData.avgAttendance ? (
                                            <>
                                                <TrendingDown className="w-3 h-3" />
                                                {(currentMilestone.overview.avgAttendance - previousSemesterData.avgAttendance).toFixed(1)}% vs kỳ trước
                                            </>
                                        ) : null}
                                    </p>
                                </div>
                                <Clock className="w-12 h-12 text-orange-500 opacity-20" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-red-600 mb-1">Nguy cơ</p>
                                    <p className="text-3xl font-bold text-red-900">
                                        {currentMilestone?.overview.atRisk || 0}
                                    </p>
                                    <p className="text-xs text-red-600">
                                        {((currentMilestone?.overview.atRisk || 0) / (currentMilestone?.overview.totalStudents || 1) * 100).toFixed(1)}%
                                    </p>
                                </div>
                                <AlertTriangle className="w-12 h-12 text-red-500 opacity-20" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Horizontal Timeline */}
                <Card>
                    <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-gray-100">
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-indigo-600" />
                            Timeline Học Kỳ
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="relative">
                            {/* Timeline line */}
                            <div className="absolute top-8 left-0 right-0 h-1 bg-gradient-to-r from-purple-200 via-indigo-200 to-gray-200"></div>

                            {/* Timeline items */}
                            <div className="relative flex justify-between">
                                {timelineMilestones.map((milestone) => (
                                    <div
                                        key={milestone.id}
                                        onClick={() => setSelectedMilestone(milestone.id)}
                                        className="flex flex-col items-center cursor-pointer group"
                                        style={{ width: `${100 / timelineMilestones.length}%` }}
                                    >
                                        {/* Circle */}
                                        <div className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all transform group-hover:scale-110 ${milestone.status === 'completed'
                                            ? 'bg-gradient-to-br from-green-400 to-green-600'
                                            : milestone.status === 'in-progress'
                                                ? 'bg-gradient-to-br from-blue-400 to-blue-600 ring-4 ring-blue-200 animate-pulse'
                                                : 'bg-gradient-to-br from-gray-300 to-gray-400'
                                            } ${selectedMilestone === milestone.id ? 'ring-4 ring-purple-400' : ''}`}>
                                            {milestone.status === 'completed' ? (
                                                <CheckCircle className="w-8 h-8 text-white" />
                                            ) : milestone.status === 'in-progress' ? (
                                                <Target className="w-8 h-8 text-white" />
                                            ) : (
                                                <Clock className="w-8 h-8 text-white" />
                                            )}
                                        </div>

                                        {/* Label */}
                                        <div className="mt-4 text-center">
                                            <p className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                                {milestone.title}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">{milestone.date}</p>
                                            <Badge className={`mt-2 ${milestone.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                milestone.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                {milestone.status === 'completed' ? 'Hoàn thành' :
                                                    milestone.status === 'in-progress' ? 'Đang diễn ra' : 'Sắp tới'}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabs for different views */}
                {currentMilestone && currentMilestone.status !== 'upcoming' && (
                    <Card>
                        <CardHeader className="border-b">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setActiveTab('overview')}
                                    className={`px-6 py-2 rounded-lg font-semibold transition-all ${activeTab === 'overview'
                                        ? 'bg-indigo-600 text-white shadow-lg'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    Tổng quan
                                </button>
                                <button
                                    onClick={() => setActiveTab('comparison')}
                                    className={`px-6 py-2 rounded-lg font-semibold transition-all ${activeTab === 'comparison'
                                        ? 'bg-indigo-600 text-white shadow-lg'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    So sánh lớp
                                </button>
                                <button
                                    onClick={() => setActiveTab('atrisk')}
                                    className={`px-6 py-2 rounded-lg font-semibold transition-all ${activeTab === 'atrisk'
                                        ? 'bg-indigo-600 text-white shadow-lg'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    Sinh viên nguy cơ ({currentMilestone.atRiskStudents.length})
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            {/* Overview Tab */}
                            {activeTab === 'overview' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                                                Xu hướng GPA qua các mốc
                                            </h3>
                                            <div style={{ height: '300px' }}>
                                                <Line data={trendChartData} options={chartOptions} />
                                            </div>
                                        </div>

                                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                <Activity className="w-5 h-5 text-orange-600" />
                                                Xu hướng Điểm danh & Bài tập
                                            </h3>
                                            <div style={{ height: '300px' }}>
                                                <Line data={attendanceAssignmentChartData} options={percentageChartOptions} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-6">
                                        <Card className="border-2 border-indigo-100">
                                            <CardContent className="p-6">
                                                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                    <Calendar className="w-5 h-5 text-indigo-600" />
                                                    Chi tiết: {currentMilestone.title}
                                                </h4>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                                                        <span className="text-gray-700">GPA Trung bình:</span>
                                                        <span className="font-bold text-blue-600">{currentMilestone.overview.avgGPA.toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                                                        <span className="text-gray-700">GPA Trung vị:</span>
                                                        <span className="font-bold text-green-600">{currentMilestone.overview.medianGPA.toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                                                        <span className="text-gray-700">Điểm danh TB:</span>
                                                        <span className="font-bold text-orange-600">{currentMilestone.overview.avgAttendance.toFixed(1)}%</span>
                                                    </div>
                                                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                                                        <span className="text-gray-700">Tỷ lệ đúng tiến độ:</span>
                                                        <span className="font-bold text-purple-600">
                                                            {((currentMilestone.overview.onTrack / currentMilestone.overview.totalStudents) * 100).toFixed(1)}%
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                                                        <span className="text-gray-700">Tỷ lệ nguy cơ:</span>
                                                        <span className="font-bold text-red-600">
                                                            {((currentMilestone.overview.atRisk / currentMilestone.overview.totalStudents) * 100).toFixed(1)}%
                                                        </span>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card className="border-2 border-purple-100">
                                            <CardContent className="p-6">
                                                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                    <TrendingUp className="w-5 h-5 text-purple-600" />
                                                    So sánh với kỳ trước
                                                </h4>
                                                <div className="space-y-3">
                                                    <div className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-sm text-gray-700">GPA Trung vị</span>
                                                            <span className={`text-sm font-bold ${currentMilestone.overview.medianGPA > previousSemesterData.medianGPA ? 'text-green-600' : 'text-red-600'}`}>
                                                                {currentMilestone.overview.medianGPA > previousSemesterData.medianGPA ? '↑' : '↓'}
                                                                {Math.abs((currentMilestone.overview.medianGPA - previousSemesterData.medianGPA) / previousSemesterData.medianGPA * 100).toFixed(1)}%
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between text-xs">
                                                            <span className="text-gray-500">Kỳ trước: {previousSemesterData.medianGPA.toFixed(2)}</span>
                                                            <span className="text-gray-900 font-semibold">Hiện tại: {currentMilestone.overview.medianGPA.toFixed(2)}</span>
                                                        </div>
                                                    </div>

                                                    <div className="p-3 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-sm text-gray-700">Điểm danh</span>
                                                            <span className={`text-sm font-bold ${currentMilestone.overview.avgAttendance > previousSemesterData.avgAttendance ? 'text-green-600' : 'text-red-600'}`}>
                                                                {currentMilestone.overview.avgAttendance > previousSemesterData.avgAttendance ? '↑' : '↓'}
                                                                {Math.abs(currentMilestone.overview.avgAttendance - previousSemesterData.avgAttendance).toFixed(1)}%
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between text-xs">
                                                            <span className="text-gray-500">Kỳ trước: {previousSemesterData.avgAttendance.toFixed(1)}%</span>
                                                            <span className="text-gray-900 font-semibold">Hiện tại: {currentMilestone.overview.avgAttendance.toFixed(1)}%</span>
                                                        </div>
                                                    </div>

                                                    <div className="p-3 bg-gradient-to-r from-red-50 to-red-100 rounded-lg">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-sm text-gray-700">SV Nguy cơ</span>
                                                            <span className={`text-sm font-bold ${currentMilestone.overview.atRisk < previousSemesterData.atRisk ? 'text-green-600' : 'text-red-600'}`}>
                                                                {currentMilestone.overview.atRisk < previousSemesterData.atRisk ? '↓' : '↑'}
                                                                {Math.abs(currentMilestone.overview.atRisk - previousSemesterData.atRisk)}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between text-xs">
                                                            <span className="text-gray-500">Kỳ trước: {previousSemesterData.atRisk}</span>
                                                            <span className="text-gray-900 font-semibold">Hiện tại: {currentMilestone.overview.atRisk}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card className="border-2 border-emerald-100">
                                            <CardContent className="p-6">
                                                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                    <Activity className="w-5 h-5 text-emerald-600" />
                                                    Tiến độ qua các mốc
                                                </h4>
                                                <div className="space-y-3">
                                                    {timelineMilestones.filter(m => m.status !== 'upcoming').map((milestone, index) => {
                                                        const previousMilestone = index > 0 ? timelineMilestones[index - 1] : null
                                                        const gpaChange = previousMilestone
                                                            ? milestone.overview.medianGPA - previousMilestone.overview.medianGPA
                                                            : 0
                                                        const attendanceChange = previousMilestone
                                                            ? milestone.overview.avgAttendance - previousMilestone.overview.avgAttendance
                                                            : 0
                                                        const atRiskChange = previousMilestone
                                                            ? previousMilestone.overview.atRisk - milestone.overview.atRisk
                                                            : 0

                                                        return (
                                                            <div
                                                                key={milestone.id}
                                                                className={`p-4 rounded-lg border-2 transition-all ${milestone.status === 'in-progress'
                                                                    ? 'border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md'
                                                                    : 'border-gray-200 bg-gray-50'
                                                                    }`}
                                                            >
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <span className="font-bold text-gray-900">{milestone.title}</span>
                                                                    <span className="text-xs text-gray-500">{milestone.date}</span>
                                                                </div>
                                                                <div className="grid grid-cols-3 gap-2">
                                                                    <div className="text-center p-2 bg-white rounded">
                                                                        <p className="text-xs text-gray-600 mb-1">GPA</p>
                                                                        <div className="flex items-center justify-center gap-1">
                                                                            <span className="text-sm font-bold text-blue-600">
                                                                                {milestone.overview.medianGPA.toFixed(2)}
                                                                            </span>
                                                                            {gpaChange !== 0 && (
                                                                                <span className={`text-xs ${gpaChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                                    {gpaChange > 0 ? '↑' : '↓'}{Math.abs(gpaChange).toFixed(2)}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-center p-2 bg-white rounded">
                                                                        <p className="text-xs text-gray-600 mb-1">Điểm danh</p>
                                                                        <div className="flex items-center justify-center gap-1">
                                                                            <span className="text-sm font-bold text-orange-600">
                                                                                {milestone.overview.avgAttendance.toFixed(1)}%
                                                                            </span>
                                                                            {attendanceChange !== 0 && (
                                                                                <span className={`text-xs ${attendanceChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                                    {attendanceChange > 0 ? '↑' : '↓'}{Math.abs(attendanceChange).toFixed(1)}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-center p-2 bg-white rounded">
                                                                        <p className="text-xs text-gray-600 mb-1">Nguy cơ</p>
                                                                        <div className="flex items-center justify-center gap-1">
                                                                            <span className="text-sm font-bold text-red-600">
                                                                                {milestone.overview.atRisk}
                                                                            </span>
                                                                            {atRiskChange !== 0 && (
                                                                                <span className={`text-xs ${atRiskChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                                    {atRiskChange > 0 ? '↓' : '↑'}{Math.abs(atRiskChange)}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                            )}

                            {/* Comparison Tab */}
                            {activeTab === 'comparison' && classComparisonData && (
                                <div className="space-y-6">
                                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <BarChart3 className="w-5 h-5 text-indigo-600" />
                                            So sánh các lớp - {currentMilestone.title}
                                        </h3>
                                        <div style={{ height: '400px' }}>
                                            <Bar data={classComparisonData} options={percentageChartOptions} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                            <Users className="w-5 h-5 text-indigo-600" />
                                            Chi tiết từng lớp (Click để xem top performers & at-risk)
                                        </h3>
                                        {currentMilestone.classMetrics.map((cm) => {
                                            const cls = classesData.find(c => c.id === cm.classId)
                                            return (
                                                <Card
                                                    key={cm.classId}
                                                    className="border-l-4 border-l-indigo-500 hover:shadow-xl transition-all cursor-pointer"
                                                    onClick={() => {
                                                        setSelectedClass(cm.classId)
                                                        setShowClassDetail(true)
                                                    }}
                                                >
                                                    <CardContent className="p-5">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div>
                                                                <h4 className="text-xl font-bold text-gray-900">{cls?.name}</h4>
                                                                <p className="text-sm text-gray-500">{cls?.department} - {cls?.totalStudents} sinh viên</p>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {cm.trend === 'up' && (
                                                                    <div className="flex items-center gap-1 bg-green-100 px-3 py-1 rounded-full">
                                                                        <TrendingUp className="w-5 h-5 text-green-600" />
                                                                        <span className="text-sm font-semibold text-green-700">Tiến bộ</span>
                                                                    </div>
                                                                )}
                                                                {cm.trend === 'down' && (
                                                                    <div className="flex items-center gap-1 bg-red-100 px-3 py-1 rounded-full">
                                                                        <TrendingDown className="w-5 h-5 text-red-600" />
                                                                        <span className="text-sm font-semibold text-red-700">Tụt hậu</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-5 gap-4">
                                                            <div className="bg-blue-50 rounded-lg p-4 text-center">
                                                                <p className="text-xs text-gray-600 mb-1">GPA</p>
                                                                <p className="text-2xl font-bold text-blue-600">{cm.gpa.toFixed(2)}</p>
                                                            </div>
                                                            <div className="bg-green-50 rounded-lg p-4 text-center">
                                                                <p className="text-xs text-gray-600 mb-1">Trung vị</p>
                                                                <p className="text-2xl font-bold text-green-600">{cm.median.toFixed(2)}</p>
                                                            </div>
                                                            <div className="bg-orange-50 rounded-lg p-4 text-center">
                                                                <p className="text-xs text-gray-600 mb-1">Điểm danh</p>
                                                                <p className="text-2xl font-bold text-orange-600">{cm.attendance}%</p>
                                                            </div>
                                                            <div className="bg-teal-50 rounded-lg p-4 text-center">
                                                                <p className="text-xs text-gray-600 mb-1">Hoàn thành BT</p>
                                                                <p className="text-2xl font-bold text-teal-600">{cm.assignmentRate}%</p>
                                                            </div>
                                                            <div className="bg-red-50 rounded-lg p-4 text-center">
                                                                <p className="text-xs text-gray-600 mb-1">Nguy cơ</p>
                                                                <p className="text-2xl font-bold text-red-600">{cm.atRisk}/{cls?.totalStudents}</p>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* At-Risk Students Tab */}
                            {activeTab === 'atrisk' && (
                                <div className="space-y-4">
                                    {currentMilestone.atRiskStudents.length === 0 ? (
                                        <div className="text-center py-12">
                                            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                            <h3 className="text-xl font-bold text-gray-900 mb-2">Xuất sắc!</h3>
                                            <p className="text-gray-600">Không có sinh viên nào ở mức nguy cơ tại mốc này.</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                                                <div className="flex items-center gap-3">
                                                    <AlertTriangle className="w-6 h-6 text-red-600" />
                                                    <div>
                                                        <h3 className="font-bold text-red-900">
                                                            Có {currentMilestone.atRiskStudents.length} sinh viên cần can thiệp
                                                        </h3>
                                                        <p className="text-sm text-red-700">
                                                            Danh sách sinh viên có nguy cơ không hoàn thành chương trình
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4">
                                                {currentMilestone.atRiskStudents.map((student) => (
                                                    <Card
                                                        key={student.id}
                                                        className="border-l-4 border-l-red-500 hover:shadow-lg transition-shadow cursor-pointer"
                                                        onClick={() => {
                                                            setSelectedStudent(student)
                                                            setShowStudentDetail(true)
                                                        }}
                                                    >
                                                        <CardContent className="p-5">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-4 flex-1">
                                                                    <div className="w-14 h-14 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                                                                        {student.name.charAt(0)}
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <h4 className="text-lg font-bold text-gray-900">{student.name}</h4>
                                                                        <p className="text-sm text-gray-500">{student.id} - Lớp {student.class}</p>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-6">
                                                                    <div className="text-center">
                                                                        <p className="text-xs text-gray-500 mb-1">GPA</p>
                                                                        <p className={`text-2xl font-bold ${student.gpa < 1.5 ? 'text-red-600' :
                                                                            student.gpa < 2.0 ? 'text-orange-600' :
                                                                                'text-yellow-600'
                                                                            }`}>{student.gpa.toFixed(2)}</p>
                                                                    </div>

                                                                    <div className="text-center">
                                                                        <p className="text-xs text-gray-500 mb-1">Điểm danh</p>
                                                                        <p className={`text-2xl font-bold ${student.attendance < 60 ? 'text-red-600' :
                                                                            student.attendance < 75 ? 'text-orange-600' :
                                                                                'text-yellow-600'
                                                                            }`}>{student.attendance}%</p>
                                                                    </div>

                                                                    <div className="min-w-[200px]">
                                                                        <p className="text-xs text-gray-500 mb-2">Vấn đề</p>
                                                                        <div className="flex flex-wrap gap-1">
                                                                            {student.issues.map((issue) => (
                                                                                <Badge key={issue} className="bg-red-100 text-red-700 text-xs">
                                                                                    {issue}
                                                                                </Badge>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Class Detail Modal */}
                {showClassDetail && selectedClass && currentMilestone && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl flex items-center justify-between z-10">
                                <div>
                                    <h2 className="text-2xl font-bold mb-1">
                                        Chi tiết lớp: {classesData.find(c => c.id === selectedClass)?.name}
                                    </h2>
                                    <p className="text-indigo-100">
                                        {currentMilestone.title} - {classesData.find(c => c.id === selectedClass)?.totalStudents} sinh viên
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowClassDetail(false)}
                                    className="text-white hover:bg-white hover:text-indigo-600 rounded-full p-2 transition-all"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Class Overview Metrics */}
                                {(() => {
                                    const classMetric = currentMilestone.classMetrics.find(cm => cm.classId === selectedClass)
                                    if (!classMetric) return null

                                    return (
                                        <>
                                            <div className="grid grid-cols-4 gap-4">
                                                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                                                    <CardContent className="p-4 text-center">
                                                        <p className="text-sm text-blue-600 mb-1">GPA Trung vị</p>
                                                        <p className="text-3xl font-bold text-blue-900">{classMetric.median.toFixed(2)}</p>
                                                    </CardContent>
                                                </Card>
                                                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                                                    <CardContent className="p-4 text-center">
                                                        <p className="text-sm text-orange-600 mb-1">Điểm danh TB</p>
                                                        <p className="text-3xl font-bold text-orange-900">{classMetric.attendance}%</p>
                                                    </CardContent>
                                                </Card>
                                                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                                                    <CardContent className="p-4 text-center">
                                                        <p className="text-sm text-green-600 mb-1">Đúng tiến độ</p>
                                                        <p className="text-3xl font-bold text-green-900">{classMetric.onTrack}</p>
                                                    </CardContent>
                                                </Card>
                                                <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                                                    <CardContent className="p-4 text-center">
                                                        <p className="text-sm text-red-600 mb-1">Nguy cơ</p>
                                                        <p className="text-3xl font-bold text-red-900">{classMetric.atRisk}</p>
                                                    </CardContent>
                                                </Card>
                                            </div>

                                            {/* At-Risk Students and Progress */}
                                            <div className="space-y-6">
                                                <div>
                                                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                        <Activity className="w-6 h-6 text-indigo-500" />
                                                        Tiến độ lớp học qua các mốc
                                                    </h3>
                                                    <div className="grid grid-cols-1 gap-3">
                                                        {timelineMilestones
                                                            .filter(m => m.status !== 'upcoming' && m.classMetrics.some(cm => cm.classId === selectedClass))
                                                            .map((milestone) => {
                                                                const classData = milestone.classMetrics.find(cm => cm.classId === selectedClass)
                                                                if (!classData) return null

                                                                return (
                                                                    <Card key={milestone.id} className="border-l-4 border-l-indigo-400">
                                                                        <CardContent className="p-4">
                                                                            <div className="flex items-center justify-between mb-3">
                                                                                <div>
                                                                                    <h4 className="font-bold text-gray-900">{milestone.title}</h4>
                                                                                    <p className="text-xs text-gray-500">{milestone.date}</p>
                                                                                </div>
                                                                                {classData.trend === 'up' && (
                                                                                    <Badge className="bg-green-100 text-green-700">
                                                                                        <TrendingUp className="w-3 h-3 mr-1" />
                                                                                        Tiến bộ
                                                                                    </Badge>
                                                                                )}
                                                                                {classData.trend === 'down' && (
                                                                                    <Badge className="bg-red-100 text-red-700">
                                                                                        <TrendingDown className="w-3 h-3 mr-1" />
                                                                                        Tụt hậu
                                                                                    </Badge>
                                                                                )}
                                                                            </div>
                                                                            <div className="grid grid-cols-5 gap-2">
                                                                                <div className="bg-blue-50 rounded p-2 text-center">
                                                                                    <p className="text-xs text-gray-600">GPA</p>
                                                                                    <p className="text-lg font-bold text-blue-600">{classData.median.toFixed(2)}</p>
                                                                                </div>
                                                                                <div className="bg-orange-50 rounded p-2 text-center">
                                                                                    <p className="text-xs text-gray-600">Điểm danh</p>
                                                                                    <p className="text-lg font-bold text-orange-600">{classData.attendance}%</p>
                                                                                </div>
                                                                                <div className="bg-teal-50 rounded p-2 text-center">
                                                                                    <p className="text-xs text-gray-600">Hoàn thành</p>
                                                                                    <p className="text-lg font-bold text-teal-600">{classData.assignmentRate}%</p>
                                                                                </div>
                                                                                <div className="bg-green-50 rounded p-2 text-center">
                                                                                    <p className="text-xs text-gray-600">On-track</p>
                                                                                    <p className="text-lg font-bold text-green-600">{classData.onTrack}</p>
                                                                                </div>
                                                                                <div className="bg-red-50 rounded p-2 text-center">
                                                                                    <p className="text-xs text-gray-600">At-risk</p>
                                                                                    <p className="text-lg font-bold text-red-600">{classData.atRisk}</p>
                                                                                </div>
                                                                            </div>
                                                                        </CardContent>
                                                                    </Card>
                                                                )
                                                            })}
                                                    </div>
                                                </div>

                                                <div>
                                                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                        <AlertTriangle className="w-6 h-6 text-red-500" />
                                                        Sinh viên cần can thiệp ({classMetric.atRisk})
                                                    </h3>
                                                    <div className="space-y-3">
                                                        {classMetric.atRisk > 0 ? (
                                                            currentMilestone.atRiskStudents
                                                                .filter(s => s.class === selectedClass)
                                                                .map((student) => (
                                                                    <Card
                                                                        key={student.id}
                                                                        className="border-l-4 border-l-red-500 hover:shadow-lg transition-all cursor-pointer"
                                                                        onClick={() => {
                                                                            setSelectedStudent(student)
                                                                            setShowStudentDetail(true)
                                                                            setShowClassDetail(false)
                                                                        }}
                                                                    >
                                                                        <CardContent className="p-4">
                                                                            <div className="flex items-center gap-4">
                                                                                <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                                                                    {student.name.charAt(0)}
                                                                                </div>
                                                                                <div className="flex-1">
                                                                                    <h4 className="font-bold text-gray-900">{student.name}</h4>
                                                                                    <p className="text-sm text-gray-500">{student.id}</p>
                                                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                                                        {student.issues.map((issue) => (
                                                                                            <Badge key={issue} className="bg-red-100 text-red-700 text-xs">
                                                                                                {issue}
                                                                                            </Badge>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                                <div className="grid grid-cols-2 gap-2 text-center">
                                                                                    <div className="bg-red-50 rounded-lg p-2">
                                                                                        <p className="text-xs text-gray-600">GPA</p>
                                                                                        <p className="text-lg font-bold text-red-600">{student.gpa.toFixed(2)}</p>
                                                                                    </div>
                                                                                    <div className="bg-orange-50 rounded-lg p-2">
                                                                                        <p className="text-xs text-gray-600">Điểm danh</p>
                                                                                        <p className="text-lg font-bold text-orange-600">{student.attendance}%</p>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </CardContent>
                                                                    </Card>
                                                                ))
                                                        ) : (
                                                            <div className="text-center py-8">
                                                                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
                                                                <p className="text-gray-600">Không có sinh viên nào ở mức nguy cơ</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )
                                })()}
                            </div>
                        </div>
                    </div>
                )}

                {/* Student Detail Modal */}
                {showStudentDetail && selectedStudent && (
                    <div className="fixed inset-0 backdrop-blur-sm bg-white/30 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-t-2xl flex items-center justify-between z-10">
                                <div>
                                    <h2 className="text-2xl font-bold">Chi tiết sinh viên</h2>
                                    <p className="text-indigo-100">{selectedStudent.name} • {selectedStudent.id} • Lớp {selectedStudent.class}</p>
                                </div>
                                <button onClick={() => setShowStudentDetail(false)} className="p-2 rounded-full hover:bg-white hover:text-indigo-600 text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Alert Banner - More Prominent */}
                                <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 p-5 rounded-xl">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="w-8 h-8 text-red-600 flex-shrink-0 mt-1" />
                                        <div className="flex-1">
                                            <h4 className="font-bold text-red-900 text-lg mb-3">⚠️ Cảnh báo nguy cơ học vụ</h4>
                                            <div className="space-y-2">
                                                {selectedStudent.gpa < 1.5 && (
                                                    <div className="flex items-center gap-2 bg-red-100 p-3 rounded-lg">
                                                        <span className="text-2xl">🔴</span>
                                                        <div>
                                                            <p className="font-semibold text-red-900">GPA rất thấp: {selectedStudent.gpa.toFixed(2)}</p>
                                                            <p className="text-sm text-red-700">Khả năng rớt môn cao, cần can thiệp ngay</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {selectedStudent.gpa >= 1.5 && selectedStudent.gpa < 2.0 && (
                                                    <div className="flex items-center gap-2 bg-orange-100 p-3 rounded-lg">
                                                        <span className="text-2xl">🟠</span>
                                                        <div>
                                                            <p className="font-semibold text-orange-900">GPA thấp: {selectedStudent.gpa.toFixed(2)}</p>
                                                            <p className="text-sm text-orange-700">Cần theo dõi và hỗ trợ thêm</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {selectedStudent.attendance < 60 && (
                                                    <div className="flex items-center gap-2 bg-red-100 p-3 rounded-lg">
                                                        <span className="text-2xl">🔴</span>
                                                        <div>
                                                            <p className="font-semibold text-red-900">Điểm danh rất thấp: {selectedStudent.attendance}%</p>
                                                            <p className="text-sm text-red-700">Nguy cơ bỏ học, cần liên hệ ngay</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {selectedStudent.attendance >= 60 && selectedStudent.attendance < 75 && (
                                                    <div className="flex items-center gap-2 bg-orange-100 p-3 rounded-lg">
                                                        <span className="text-2xl">🟠</span>
                                                        <div>
                                                            <p className="font-semibold text-orange-900">Điểm danh thấp: {selectedStudent.attendance}%</p>
                                                            <p className="text-sm text-orange-700">Cần nhắc nhở về tần suất đi học</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {selectedStudent.issues.includes('Assignment') && (
                                                    <div className="flex items-center gap-2 bg-yellow-100 p-3 rounded-lg">
                                                        <span className="text-2xl">🟡</span>
                                                        <div>
                                                            <p className="font-semibold text-yellow-900">Bài tập chưa hoàn thành</p>
                                                            <p className="text-sm text-yellow-700">Nhiều bài tập chưa nộp hoặc nộp trễ</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Student Info */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="col-span-1 flex items-center gap-4">
                                        <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                                            {selectedStudent.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">{selectedStudent.name}</h3>
                                            <p className="text-sm text-gray-500">Mã: {selectedStudent.id}</p>
                                            <p className="text-sm text-gray-500">Lớp: {selectedStudent.class}</p>
                                        </div>
                                    </div>

                                    <div className="col-span-2 grid grid-cols-3 gap-3">
                                        <div className="bg-red-50 rounded p-3 text-center">
                                            <p className="text-xs text-gray-600">GPA</p>
                                            <p className={`text-2xl font-bold ${selectedStudent.gpa < 1.5 ? 'text-red-600' : selectedStudent.gpa < 2.0 ? 'text-orange-600' : 'text-yellow-600'}`}>{selectedStudent.gpa.toFixed(2)}</p>
                                        </div>
                                        <div className="bg-orange-50 rounded p-3 text-center">
                                            <p className="text-xs text-gray-600">Điểm danh</p>
                                            <p className={`text-2xl font-bold ${selectedStudent.attendance < 60 ? 'text-red-600' : selectedStudent.attendance < 75 ? 'text-orange-600' : 'text-yellow-600'}`}>{selectedStudent.attendance}%</p>
                                        </div>
                                        <div className="bg-gray-50 rounded p-3 text-center">
                                            <p className="text-xs text-gray-600">Vấn đề</p>
                                            <div className="flex flex-wrap justify-center gap-2 mt-1">
                                                {selectedStudent.issues.map((issue: any) => (
                                                    <Badge key={issue} className="bg-red-100 text-red-700 text-xs">{issue}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Message Templates and Custom Message */}
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                            <MessageSquare className="w-5 h-5 text-indigo-600" />
                                            Tin nhắn mẫu - Click để chọn
                                        </h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button onClick={() => setQuickMessage('Em chào thầy! Em xin hẹn thầy gặp để trao đổi về kết quả học tập. Em cảm ơn thầy ạ!')} className="text-left p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors">
                                                <p className="text-sm font-medium text-blue-900">📅 Hẹn gặp trao đổi</p>
                                                <p className="text-xs text-blue-700 mt-1">Mời sinh viên đến gặp để thảo luận kết quả học tập</p>
                                            </button>
                                            <button onClick={() => setQuickMessage('Em ơi, thầy thấy em vắng nhiều buổi học gần đây. Em có vấn đề gì không? Hãy liên hệ với thầy nhé!')} className="text-left p-3 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg transition-colors">
                                                <p className="text-sm font-medium text-orange-900">⚠️ Nhắc nhở điểm danh</p>
                                                <p className="text-xs text-orange-700 mt-1">Nhắc nhở về tình trạng vắng học nhiều</p>
                                            </button>
                                            <button onClick={() => setQuickMessage('Em chào thầy! Thầy nhận thấy em chưa nộp một số bài tập. Em cần hỗ trợ gì không? Hãy liên hệ thầy để được giúp đỡ nhé!')} className="text-left p-3 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 rounded-lg transition-colors">
                                                <p className="text-sm font-medium text-yellow-900">📝 Nhắc nộp bài tập</p>
                                                <p className="text-xs text-yellow-700 mt-1">Nhắc nhở về bài tập chưa hoàn thành</p>
                                            </button>
                                            <button onClick={() => setQuickMessage('Em chào thầy! Thầy thấy em đang gặp khó khăn trong học tập. Thầy sẵn sàng hỗ trợ em, hãy đến gặp thầy nhé!')} className="text-left p-3 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors">
                                                <p className="text-sm font-medium text-red-900">🆘 Cần hỗ trợ khẩn</p>
                                                <p className="text-xs text-red-700 mt-1">Đề nghị gặp mặt để hỗ trợ học tập</p>
                                            </button>
                                            <button onClick={() => setQuickMessage('Em chào thầy! Thầy muốn động viên em tiếp tục cố gắng. Nếu cần giúp đỡ gì, em hãy liên hệ với thầy nhé!')} className="text-left p-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors">
                                                <p className="text-sm font-medium text-green-900">💪 Động viên khuyến khích</p>
                                                <p className="text-xs text-green-700 mt-1">Gửi lời động viên và hỗ trợ tinh thần</p>
                                            </button>
                                            <button onClick={() => setQuickMessage('Em chào thầy! Phụ huynh của em cần liên hệ với thầy để trao đổi về tình hình học tập. Cảm ơn em!')} className="text-left p-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors">
                                                <p className="text-sm font-medium text-purple-900">👨‍👩‍👦 Liên hệ phụ huynh</p>
                                                <p className="text-xs text-purple-700 mt-1">Yêu cầu phụ huynh liên hệ</p>
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-2">Tin nhắn tùy chỉnh</h4>
                                        <textarea value={quickMessage} onChange={(e) => setQuickMessage(e.target.value)} placeholder="Nhập tin nhắn hoặc chọn tin nhắn mẫu ở trên..." className="w-full border border-gray-300 rounded-lg p-3 h-32 focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                                        <div className="flex items-center gap-3 mt-3">
                                            <button onClick={() => { console.log('Gửi tin nhắn tới', selectedStudent.id, quickMessage); setQuickMessage(''); }} className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors">
                                                <Send className="w-5 h-5" /> Gửi tin nhắn
                                            </button>
                                            <button onClick={() => setQuickMessage('')} className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">
                                                Xóa
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Appointment Section */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                        <Calendar className="w-5 h-5 text-green-600" />
                                        Đặt lịch hẹn gặp
                                    </h4>
                                    <div className="flex gap-3">
                                        <input type="date" value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)} className="border border-gray-300 rounded-lg p-2 flex-1 focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                                        <input type="time" value={appointmentTime} onChange={(e) => setAppointmentTime(e.target.value)} className="border border-gray-300 rounded-lg p-2 flex-1 focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                                        <button onClick={() => { console.log('Đặt lịch', selectedStudent.id, appointmentDate, appointmentTime); setAppointmentDate(''); setAppointmentTime(''); }} className="inline-flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors whitespace-nowrap">
                                            <Calendar className="w-5 h-5" /> Đặt lịch
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </TeacherLayout>
    )
}
