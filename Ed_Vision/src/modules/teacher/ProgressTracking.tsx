import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/teacher/teacher_card"
import { Badge } from "@/components/ui/teacher/teacher_badge"
import TeacherLayout from "./components/TeacherLayout"
import { useFilterOptions } from "@/hooks/useFilterOptions"
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
    Mail,
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown
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
import { Line } from 'react-chartjs-2'

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

// Timeline milestones với dữ liệu tổng hợp
const timelineMilestones = [
    {
        id: 1,
        title: "Học kỳ 1",
        date: "Tháng 9 - Tháng 12/2024",
        status: "completed",
        description: "Học kỳ 1 năm học 2024-2025",
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
        title: "Học kỳ 2",
        date: "Tháng 1 - Tháng 5/2025",
        status: "in-progress",
        description: "Học kỳ 2 năm học 2024-2025",
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
        title: "Học kỳ Hè",
        date: "Tháng 6 - Tháng 8/2025",
        status: "upcoming",
        description: "Học kỳ Hè năm 2025",
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
        title: "Học kỳ 1 (2025-2026)",
        date: "Tháng 9 - Tháng 12/2025",
        status: "upcoming",
        description: "Học kỳ 1 năm học 2025-2026",
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

// Dữ liệu lớp học
const classesData = [
    { id: 'IT2021A', name: 'IT2021A', totalStudents: 40, department: 'Công nghệ thông tin' },
    { id: 'IT2021B', name: 'IT2021B', totalStudents: 38, department: 'Công nghệ thông tin' },
    { id: 'IT2020A', name: 'IT2020A', totalStudents: 35, department: 'Công nghệ thông tin' },
    { id: 'IT2020B', name: 'IT2020B', totalStudents: 32, department: 'Công nghệ thông tin' },
]

// Mock data sinh viên cho heatmap (40 sinh viên mỗi lớp)
const studentNames = [
    'Nguyễn Hoàng Anh', 'Trần Minh Tuấn', 'Lê Thị Hương', 'Phạm Đức Mạnh', 'Hoàng Thu Trang',
    'Võ Văn Hùng', 'Đặng Thị Lan', 'Bùi Quốc Khánh', 'Dương Thị Mai', 'Lý Thanh Tùng',
    'Ngô Thị Hoa', 'Đỗ Minh Hiếu', 'Trịnh Thị Phương', 'Phan Văn Nam', 'Vũ Thị Ngọc',
    'Tạ Minh Quang', 'Mai Thị Linh', 'Cao Văn Đạt', 'Lưu Thị Hà', 'Đinh Văn Toàn',
    'Nguyễn Thị Kim', 'Trần Văn Long', 'Lê Minh Châu', 'Phạm Thị Dung', 'Hoàng Văn Khánh',
    'Võ Thị Tuyết', 'Đặng Minh Trí', 'Bùi Thị Hằng', 'Dương Văn Thắng', 'Lý Thị Oanh',
    'Ngô Văn Hải', 'Đỗ Thị Bích', 'Trịnh Văn Sơn', 'Phan Thị Yến', 'Vũ Minh Đức',
    'Tạ Thị Nhung', 'Mai Văn Thành', 'Cao Thị Loan', 'Lưu Văn Tân', 'Đinh Thị Xuân',
]

const generateStudentsForClass = (classId: string, _milestone: number) => {
    const students = []
    const totalStudents = classesData.find(c => c.id === classId)?.totalStudents || 40
    
    for (let i = 1; i <= totalStudents; i++) {
        const studentId = `${classId}_${String(i).padStart(3, '0')}`
        const studentName = studentNames[i - 1] || `Sinh viên ${i}`
        
        // Random data với phân bố realistic
        const rand = Math.random()
        let gpa, attendance, status
        
        if (rand < 0.4) { // 40% tốt
            gpa = 2.5 + Math.random() * 1.5
            attendance = 80 + Math.random() * 20
            status = 'good'
        } else if (rand < 0.65) { // 25% cần theo dõi
            gpa = 2.0 + Math.random() * 0.5
            attendance = 70 + Math.random() * 10
            status = 'needs-attention'
        } else if (rand < 0.85) { // 20% nguy cơ trung bình
            gpa = 1.5 + Math.random() * 0.5
            attendance = 60 + Math.random() * 10
            status = 'medium-risk'
        } else { // 15% nguy cơ cao
            gpa = 0.8 + Math.random() * 0.7
            attendance = 40 + Math.random() * 20
            status = 'high-risk'
        }
        
        students.push({
            id: studentId,
            name: studentName,
            gpa: parseFloat(gpa.toFixed(2)),
            attendance: parseFloat(attendance.toFixed(1)),
            status,
            email: `${studentName.toLowerCase().replace(/\s+/g, '.')}@university.edu.vn`,
            phone: `090${String(i).padStart(7, '0')}`
        })
    }
    
    return students
}

export default function ProgressTracking() {
    const { filterOptions, loading: loadingFilters } = useFilterOptions()
    const [selectedMilestone, setSelectedMilestone] = useState<number | null>(null)
    const [selectedClass, setSelectedClass] = useState<string | null>(null)
    const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set())
    
    // Search, Filter, Sort, Pagination states
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [sortBy, setSortBy] = useState<'name' | 'gpa' | 'attendance'>('name')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
    const [currentPage, setCurrentPage] = useState(1)
    const studentsPerPage = 10

    const toggleStudentExpand = (studentId: string) => {
        const newExpanded = new Set(expandedStudents)
        if (newExpanded.has(studentId)) {
            newExpanded.delete(studentId)
        } else {
            newExpanded.add(studentId)
        }
        setExpandedStudents(newExpanded)
    }

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

                {/* View Selection - Nút Tổng quan + Dropdown chọn lớp */}
                {selectedMilestone && (
                    <Card>
                        <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
                            <CardTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-purple-600" />
                                Chọn chế độ xem
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                                {/* Nút Tổng quan */}
                                <button
                                    onClick={() => {
                                        setSelectedClass(null)
                                        setExpandedStudents(new Set())
                                    }}
                                    className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
                                        !selectedClass
                                            ? 'bg-indigo-600 text-white shadow-lg scale-105'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    📊 Tổng quan
                                </button>

                                <div className="text-gray-400 text-lg">hoặc</div>

                                {/* Dropdown chọn lớp */}
                                <select
                                    value={selectedClass || ''}
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            setSelectedClass(e.target.value)
                                            setExpandedStudents(new Set())
                                        }
                                    }}
                                    className="flex-1 px-4 py-3 rounded-lg border-2 border-purple-200 bg-white text-gray-900 font-semibold shadow-sm hover:border-purple-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all cursor-pointer"
                                    disabled={loadingFilters}
                                >
                                    <option value="">-- Chọn lớp để xem chi tiết --</option>
                                    {filterOptions.classes.map((className) => (
                                        <option key={className} value={className}>
                                            📚 {className}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Tổng quan - Chỉ hiển thị khi CHƯA chọn class */}
                {currentMilestone && currentMilestone.status !== 'upcoming' && !selectedClass && (
                    <Card>
                        <CardContent className="p-6">
                            {/* Overview Tab */}
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
                        </CardContent>
                    </Card>
                )}

                {/* LEVEL 2 & 3: Class Detail với Expandable List View */}
                {selectedMilestone && selectedClass && (() => {
                    const milestone = timelineMilestones.find(m => m.id === selectedMilestone)
                    const classMetric = milestone?.classMetrics.find(cm => cm.classId === selectedClass)
                    const classInfo = classesData.find(c => c.id === selectedClass)
                    
                    if (!classMetric || !milestone) return null

                    // Lấy dữ liệu của các mốc trước để so sánh trend
                    const previousMilestones = timelineMilestones
                        .filter(m => m.id < selectedMilestone)
                        .map(m => ({
                            title: m.title,
                            metric: m.classMetrics.find(cm => cm.classId === selectedClass)
                        }))

                    const students = generateStudentsForClass(selectedClass, selectedMilestone)

                    return (
                        <Card className="border-2 border-purple-200">
                            <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-2xl mb-1">
                                            📊 {classInfo?.name} - {milestone.title}
                                        </CardTitle>
                                        <p className="text-purple-100">
                                            {classInfo?.department} • {classInfo?.totalStudents} sinh viên
                                        </p>
                                    </div>
                                    {classMetric.trend === 'up' && (
                                        <Badge className="bg-green-500 text-white text-lg px-4 py-2">
                                            <TrendingUp className="w-5 h-5 mr-1" />
                                            Tiến bộ
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                {/* LEVEL 2: 4 chỉ số quan trọng */}
                                <div className="grid grid-cols-4 gap-4">
                                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
                                        <CardContent className="p-6 text-center">
                                            <Target className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                                            <p className="text-sm font-medium text-blue-600 mb-1">GPA Trung vị</p>
                                            <p className="text-4xl font-bold text-blue-900 mb-1">
                                                {classMetric.median.toFixed(2)}
                                            </p>
                                            <Badge className={`${
                                                classMetric.median >= 3.0 ? 'bg-green-500' :
                                                classMetric.median >= 2.5 ? 'bg-blue-500' :
                                                'bg-orange-500'
                                            } text-white`}>
                                                {classMetric.median >= 3.0 ? 'Tốt' :
                                                 classMetric.median >= 2.5 ? 'Khá' : 'Trung bình'}
                                            </Badge>
                                        </CardContent>
                                    </Card>

                                    <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200">
                                        <CardContent className="p-6 text-center">
                                            <Clock className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                                            <p className="text-sm font-medium text-orange-600 mb-1">Điểm danh</p>
                                            <p className="text-4xl font-bold text-orange-900 mb-1">
                                                {classMetric.attendance}%
                                            </p>
                                            <Badge className={`${
                                                classMetric.attendance >= 90 ? 'bg-green-500' :
                                                classMetric.attendance >= 80 ? 'bg-orange-500' :
                                                'bg-red-500'
                                            } text-white`}>
                                                {classMetric.attendance >= 90 ? 'Cao' :
                                                 classMetric.attendance >= 80 ? 'Tốt' : 'Cần cải thiện'}
                                            </Badge>
                                        </CardContent>
                                    </Card>

                                    <Card className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
                                        <CardContent className="p-6 text-center">
                                            <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                                            <p className="text-sm font-medium text-green-600 mb-1">Sinh viên tốt</p>
                                            <p className="text-4xl font-bold text-green-900 mb-1">
                                                {classMetric.onTrack}
                                            </p>
                                            <Badge className="bg-green-500 text-white">
                                                {((classMetric.onTrack / (classInfo?.totalStudents || 1)) * 100).toFixed(0)}%
                                            </Badge>
                                        </CardContent>
                                    </Card>

                                    <Card className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200">
                                        <CardContent className="p-6 text-center">
                                            <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                                            <p className="text-sm font-medium text-red-600 mb-1">Sinh viên nguy cơ</p>
                                            <p className="text-4xl font-bold text-red-900 mb-1">
                                                {classMetric.atRisk}
                                            </p>
                                            <Badge className="bg-red-500 text-white">
                                                {((classMetric.atRisk / (classInfo?.totalStudents || 1)) * 100).toFixed(0)}%
                                            </Badge>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Trend Comparison */}
                                {previousMilestones.length > 0 && (
                                    <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200">
                                        <CardContent className="p-6">
                                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                <Activity className="w-5 h-5 text-indigo-600" />
                                                Xu hướng qua các mốc
                                            </h3>
                                            <div className="grid grid-cols-2 gap-6">
                                                {/* GPA Trend */}
                                                <div className="bg-white rounded-lg p-4">
                                                    <p className="text-sm font-semibold text-gray-700 mb-3">📈 GPA qua các mốc:</p>
                                                    <div className="space-y-2">
                                                        {previousMilestones.map((pm, idx) => pm.metric && (
                                                            <div key={idx} className="flex items-center justify-between text-sm">
                                                                <span className="text-gray-600">{pm.title}:</span>
                                                                <span className="font-bold text-gray-900">{pm.metric.median.toFixed(2)}</span>
                                                            </div>
                                                        ))}
                                                        <div className="flex items-center justify-between text-sm border-t-2 border-indigo-200 pt-2">
                                                            <span className="text-indigo-600 font-semibold">{milestone.title}:</span>
                                                            <span className="font-bold text-indigo-900 text-lg">{classMetric.median.toFixed(2)}</span>
                                                        </div>
                                                        {previousMilestones.length > 0 && previousMilestones[previousMilestones.length - 1].metric && (
                                                            <div className="flex items-center justify-center gap-2 mt-2">
                                                                {classMetric.median > previousMilestones[previousMilestones.length - 1].metric!.median ? (
                                                                    <>
                                                                        <TrendingUp className="w-5 h-5 text-green-600" />
                                                                        <span className="text-green-600 font-semibold">
                                                                            +{(classMetric.median - previousMilestones[previousMilestones.length - 1].metric!.median).toFixed(2)} (Tiến bộ)
                                                                        </span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <TrendingDown className="w-5 h-5 text-red-600" />
                                                                        <span className="text-red-600 font-semibold">
                                                                            {(classMetric.median - previousMilestones[previousMilestones.length - 1].metric!.median).toFixed(2)} (Tụt hậu)
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Attendance Trend */}
                                                <div className="bg-white rounded-lg p-4">
                                                    <p className="text-sm font-semibold text-gray-700 mb-3">📊 Điểm danh qua các mốc:</p>
                                                    <div className="space-y-2">
                                                        {previousMilestones.map((pm, idx) => pm.metric && (
                                                            <div key={idx} className="flex items-center justify-between text-sm">
                                                                <span className="text-gray-600">{pm.title}:</span>
                                                                <span className="font-bold text-gray-900">{pm.metric.attendance}%</span>
                                                            </div>
                                                        ))}
                                                        <div className="flex items-center justify-between text-sm border-t-2 border-orange-200 pt-2">
                                                            <span className="text-orange-600 font-semibold">{milestone.title}:</span>
                                                            <span className="font-bold text-orange-900 text-lg">{classMetric.attendance}%</span>
                                                        </div>
                                                        {previousMilestones.length > 0 && previousMilestones[previousMilestones.length - 1].metric && (
                                                            <div className="flex items-center justify-center gap-2 mt-2">
                                                                {classMetric.attendance > previousMilestones[previousMilestones.length - 1].metric!.attendance ? (
                                                                    <>
                                                                        <TrendingUp className="w-5 h-5 text-green-600" />
                                                                        <span className="text-green-600 font-semibold">
                                                                            +{(classMetric.attendance - previousMilestones[previousMilestones.length - 1].metric!.attendance).toFixed(1)}% (Cải thiện)
                                                                        </span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <TrendingDown className="w-5 h-5 text-red-600" />
                                                                        <span className="text-red-600 font-semibold">
                                                                            {(classMetric.attendance - previousMilestones[previousMilestones.length - 1].metric!.attendance).toFixed(1)}% (Giảm)
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* LEVEL 3: Expandable List View with Search, Filter, Sort, Pagination */}
                                <Card className="border-2 border-purple-300">
                                    <CardHeader className="bg-gradient-to-r from-purple-100 to-indigo-100 border-b-2 border-purple-200">
                                        <CardTitle className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Users className="w-5 h-5 text-purple-600" />
                                                Danh sách sinh viên
                                            </div>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        {(() => {
                                            // Filter students by search query
                                            let filteredStudents = students.filter(student => {
                                                const matchesSearch = searchQuery === '' || 
                                                    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                    student.id.toLowerCase().includes(searchQuery.toLowerCase())
                                                
                                                const matchesStatus = statusFilter === 'all' || student.status === statusFilter
                                                
                                                return matchesSearch && matchesStatus
                                            })

                                            // Sort students
                                            filteredStudents = [...filteredStudents].sort((a, b) => {
                                                let compareValue = 0
                                                if (sortBy === 'name') {
                                                    compareValue = a.name.localeCompare(b.name)
                                                } else if (sortBy === 'gpa') {
                                                    compareValue = a.gpa - b.gpa
                                                } else if (sortBy === 'attendance') {
                                                    compareValue = a.attendance - b.attendance
                                                }
                                                return sortOrder === 'asc' ? compareValue : -compareValue
                                            })

                                            // Pagination
                                            const totalPages = Math.ceil(filteredStudents.length / studentsPerPage)
                                            const startIndex = (currentPage - 1) * studentsPerPage
                                            const endIndex = startIndex + studentsPerPage
                                            const paginatedStudents = filteredStudents.slice(startIndex, endIndex)

                                            // Status counts
                                            const statusCounts = {
                                                all: students.length,
                                                good: students.filter(s => s.status === 'good').length,
                                                'needs-attention': students.filter(s => s.status === 'needs-attention').length,
                                                'medium-risk': students.filter(s => s.status === 'medium-risk').length,
                                                'high-risk': students.filter(s => s.status === 'high-risk').length,
                                            }

                                            return (
                                                <>
                                                    {/* Search, Filter, Sort Controls */}
                                                    <div className="p-4 bg-gray-50 border-b space-y-3">
                                                        {/* Search Bar */}
                                                        <div className="relative">
                                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                            <input
                                                                type="text"
                                                                placeholder="Tìm kiếm theo tên hoặc MSSV..."
                                                                value={searchQuery}
                                                                onChange={(e) => {
                                                                    setSearchQuery(e.target.value)
                                                                    setCurrentPage(1) // Reset to first page
                                                                }}
                                                                className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                                                            />
                                                        </div>

                                                        {/* Filter and Sort Controls */}
                                                        <div className="flex items-center gap-3 flex-wrap">
                                                            {/* Status Filter */}
                                                            <div className="flex items-center gap-2">
                                                                <Filter className="w-4 h-4 text-gray-600" />
                                                                <span className="text-sm font-medium text-gray-700">Lọc:</span>
                                                                <div className="flex gap-1">
                                                                    {[
                                                                        { value: 'all', label: 'Tất cả', color: 'bg-gray-500' },
                                                                        { value: 'good', label: 'Tốt', color: 'bg-blue-500' },
                                                                        { value: 'needs-attention', label: 'Cần theo dõi', color: 'bg-yellow-500' },
                                                                        { value: 'medium-risk', label: 'Nguy cơ TB', color: 'bg-orange-500' },
                                                                        { value: 'high-risk', label: 'Nguy cơ cao', color: 'bg-red-500' },
                                                                    ].map((filter) => (
                                                                        <button
                                                                            key={filter.value}
                                                                            onClick={() => {
                                                                                setStatusFilter(filter.value)
                                                                                setCurrentPage(1)
                                                                            }}
                                                                            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                                                                                statusFilter === filter.value
                                                                                    ? `${filter.color} text-white shadow-md`
                                                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                                            }`}
                                                                        >
                                                                            {filter.label} ({statusCounts[filter.value as keyof typeof statusCounts]})
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            {/* Sort Controls */}
                                                            <div className="flex items-center gap-2 ml-auto">
                                                                <ArrowUpDown className="w-4 h-4 text-gray-600" />
                                                                <span className="text-sm font-medium text-gray-700">Sắp xếp:</span>
                                                                <select
                                                                    value={sortBy}
                                                                    onChange={(e) => setSortBy(e.target.value as 'name' | 'gpa' | 'attendance')}
                                                                    className="px-3 py-1 border-2 border-gray-300 rounded-lg text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                                                                >
                                                                    <option value="name">Tên</option>
                                                                    <option value="gpa">GPA</option>
                                                                    <option value="attendance">Điểm danh</option>
                                                                </select>
                                                                <button
                                                                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                                                    className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition-all"
                                                                >
                                                                    {sortOrder === 'asc' ? '↑ Tăng' : '↓ Giảm'}
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Results Info */}
                                                        <div className="text-sm text-gray-600">
                                                            Hiển thị <span className="font-semibold">{startIndex + 1}-{Math.min(endIndex, filteredStudents.length)}</span> trong <span className="font-semibold">{filteredStudents.length}</span> sinh viên
                                                            {searchQuery && ` (tìm kiếm: "${searchQuery}")`}
                                                        </div>
                                                    </div>

                                                    {/* Student List */}
                                                    <div className="divide-y divide-gray-200">
                                                        {paginatedStudents.length > 0 ? (
                                                            paginatedStudents.map((student) => {
                                                                const isExpanded = expandedStudents.has(student.id)
                                                                const statusConfig = {
                                                                    good: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', icon: '✅', label: 'Tốt' },
                                                                    'needs-attention': { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700', icon: '👀', label: 'Cần theo dõi' },
                                                                    'medium-risk': { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700', icon: '⚠️', label: 'Nguy cơ TB' },
                                                                    'high-risk': { bg: 'bg-red-50 border-red-200', text: 'text-red-700', icon: '🚨', label: 'Nguy cơ cao' }
                                                                }
                                                                const config = statusConfig[student.status as keyof typeof statusConfig]
                                                                
                                                                return (
                                                    <div key={student.id} className={`transition-all ${isExpanded ? config.bg : 'hover:bg-gray-50'}`}>
                                                        {/* Row Header - Always Visible */}
                                                        <button
                                                            onClick={() => toggleStudentExpand(student.id)}
                                                            className="w-full p-4 flex items-center justify-between text-left"
                                                        >
                                                            <div className="flex items-center gap-4 flex-1">
                                                                <div className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                                                                    ▶
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="font-bold text-gray-900">{student.name}</span>
                                                                        <span className="text-sm text-gray-500">({student.id})</span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-6">
                                                                    <div className="text-center">
                                                                        <p className="text-xs text-gray-500">GPA</p>
                                                                        <p className={`text-lg font-bold ${config.text}`}>
                                                                            {student.gpa.toFixed(2)}
                                                                        </p>
                                                                    </div>
                                                                    <div className="text-center">
                                                                        <p className="text-xs text-gray-500">Att</p>
                                                                        <p className={`text-lg font-bold ${config.text}`}>
                                                                            {student.attendance.toFixed(0)}%
                                                                        </p>
                                                                    </div>
                                                                    <div className="min-w-[120px]">
                                                                        <Badge className={`${
                                                                            student.status === 'good' ? 'bg-blue-500' :
                                                                            student.status === 'needs-attention' ? 'bg-yellow-500' :
                                                                            student.status === 'medium-risk' ? 'bg-orange-500' :
                                                                            'bg-red-500'
                                                                        } text-white`}>
                                                                            {config.icon} {config.label}
                                                                        </Badge>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </button>

                                                        {/* Expanded Content */}
                                                        {isExpanded && (
                                                            <div className={`px-16 pb-6 border-t ${config.bg}`}>
                                                                <div className="pt-4 space-y-4">
                                                                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                                                        📊 Chi tiết:
                                                                    </h4>
                                                                    
                                                                    {/* Details */}
                                                                    <div className="bg-white rounded-lg p-4 space-y-3">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-gray-700">• GPA qua các môn:</span>
                                                                            <span className="text-gray-900 font-medium">
                                                                                Toán {(student.gpa - 0.2).toFixed(1)} | 
                                                                                Lý {(student.gpa + 0.3).toFixed(1)} | 
                                                                                Hóa {(student.gpa - 0.1).toFixed(1)}
                                                                            </span>
                                                                        </div>
                                                                        
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-gray-700">• Điểm danh:</span>
                                                                            <span className="text-gray-900 font-medium">
                                                                                {Math.floor(student.attendance * 20 / 100)}/20 buổi ({student.attendance.toFixed(0)}%)
                                                                                {student.attendance < 80 && <span className="text-orange-600 ml-2">- Vắng {20 - Math.floor(student.attendance * 20 / 100)} buổi gần đây</span>}
                                                                            </span>
                                                                        </div>

                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-gray-700">• Bài tập:</span>
                                                                            <span className="text-gray-900 font-medium">
                                                                                {Math.floor((student.gpa / 4) * 20)}/20 bài ({((student.gpa / 4) * 100).toFixed(0)}%)
                                                                                {student.gpa < 2.5 && <span className="text-orange-600 ml-2">- Thiếu {20 - Math.floor((student.gpa / 4) * 20)} bài tuần này</span>}
                                                                            </span>
                                                                        </div>

                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-gray-700">• Xu hướng:</span>
                                                                            <span className={`font-medium flex items-center gap-1 ${
                                                                                student.gpa >= 3.0 ? 'text-green-600' :
                                                                                student.gpa >= 2.5 ? 'text-blue-600' :
                                                                                'text-red-600'
                                                                            }`}>
                                                                                {student.gpa >= 3.0 ? (
                                                                                    <>
                                                                                        <TrendingUp className="w-4 h-4" />
                                                                                        Tiến bộ đều đặn
                                                                                    </>
                                                                                ) : student.gpa >= 2.5 ? (
                                                                                    <>
                                                                                        <Activity className="w-4 h-4" />
                                                                                        Ổn định
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        <TrendingDown className="w-4 h-4" />
                                                                                        Suy giảm so với tháng trước
                                                                                    </>
                                                                                )}
                                                                            </span>
                                                                        </div>

                                                                        {/* Recommendation for at-risk students */}
                                                                        {(student.status === 'needs-attention' || student.status === 'medium-risk' || student.status === 'high-risk') && (
                                                                            <div className={`mt-3 p-3 rounded-lg ${
                                                                                student.status === 'high-risk' ? 'bg-red-100 border-2 border-red-300' : 
                                                                                student.status === 'medium-risk' ? 'bg-orange-100 border-2 border-orange-300' : 
                                                                                'bg-yellow-100 border-2 border-yellow-300'
                                                                            }`}>
                                                                                <p className={`text-sm font-semibold ${
                                                                                    student.status === 'high-risk' ? 'text-red-900' : 
                                                                                    student.status === 'medium-risk' ? 'text-orange-900' : 
                                                                                    'text-yellow-900'
                                                                                }`}>
                                                                                    {student.status === 'high-risk' ? '🚨 Khuyến nghị: Cần gặp gỡ và hỗ trợ KHẨN CẤP - Nguy cơ rất cao' : 
                                                                                     student.status === 'medium-risk' ? '⚠️ Khuyến nghị: Cần gặp gỡ và lập kế hoạch hỗ trợ - Nguy cơ trung bình' : 
                                                                                     '👀 Khuyến nghị: Theo dõi sát hơn, khuyến khích và động viên'}
                                                                                </p>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Action Buttons */}
                                                                    <div className="flex gap-3 pt-2">
                                                                        <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
                                                                            <Mail className="w-4 h-4" />
                                                                            Gửi tin nhắn
                                                                        </button>
                                                                        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
                                                                            <Calendar className="w-4 h-4" />
                                                                            Hẹn gặp
                                                                        </button>
                                                                        <button className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
                                                                            <Activity className="w-4 h-4" />
                                                                            Xem hồ sơ
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })
                                        ) : (
                                            <div className="p-12 text-center">
                                                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                                <p className="text-gray-500 text-lg">Không tìm thấy sinh viên nào</p>
                                                <p className="text-gray-400 text-sm mt-2">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                                            </div>
                                        )}
                                                    </div>

                                                    {/* Pagination */}
                                                    {totalPages > 1 && (
                                                        <div className="p-4 bg-gray-50 border-t flex items-center justify-between">
                                                            <div className="text-sm text-gray-600">
                                                                Trang <span className="font-semibold">{currentPage}</span> / <span className="font-semibold">{totalPages}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                                                    disabled={currentPage === 1}
                                                                    className="px-3 py-2 rounded-lg font-medium transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed bg-white border-2 border-gray-300 hover:bg-gray-100 disabled:hover:bg-white"
                                                                >
                                                                    <ChevronLeft className="w-4 h-4" />
                                                                    Trước
                                                                </button>
                                                                
                                                                {/* Page numbers */}
                                                                <div className="flex gap-1">
                                                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                                        let pageNum
                                                                        if (totalPages <= 5) {
                                                                            pageNum = i + 1
                                                                        } else if (currentPage <= 3) {
                                                                            pageNum = i + 1
                                                                        } else if (currentPage >= totalPages - 2) {
                                                                            pageNum = totalPages - 4 + i
                                                                        } else {
                                                                            pageNum = currentPage - 2 + i
                                                                        }
                                                                        return (
                                                                            <button
                                                                                key={pageNum}
                                                                                onClick={() => setCurrentPage(pageNum)}
                                                                                className={`w-10 h-10 rounded-lg font-medium transition-all ${
                                                                                    currentPage === pageNum
                                                                                        ? 'bg-purple-600 text-white shadow-md'
                                                                                        : 'bg-white border-2 border-gray-300 hover:bg-gray-100'
                                                                                }`}
                                                                            >
                                                                                {pageNum}
                                                                            </button>
                                                                        )
                                                                    })}
                                                                </div>

                                                                <button
                                                                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                                                    disabled={currentPage === totalPages}
                                                                    className="px-3 py-2 rounded-lg font-medium transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed bg-white border-2 border-gray-300 hover:bg-gray-100 disabled:hover:bg-white"
                                                                >
                                                                    Sau
                                                                    <ChevronRight className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            )
                                        })()}
                                    </CardContent>
                                </Card>
                            </CardContent>
                        </Card>
                    )
                })()}
            </div>
        </TeacherLayout>
    )
}
 