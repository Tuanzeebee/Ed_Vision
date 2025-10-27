import { useState, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/teacher/teacher_card"
import { Button } from "@/components/ui/teacher/teacher_button"
import TeacherLayout from "./components/TeacherLayout"
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js'
import { Line, Doughnut } from 'react-chartjs-2'

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
)

interface Student {
    id: string
    name: string
    class: string
    department: string  // Khoa
    course: string      // Khóa
    gpa: number         // GPA (thay vì score)
    progress: number
    absences: number
    riskLevel: 'Nguy cơ cao' | 'Nguy cơ trung bình' | 'Cần theo dõi'
    // Thêm dữ liệu dự báo điểm
    processGrade?: number    // Điểm quá trình (0-10)
    midtermGrade?: number    // Điểm giữa kỳ (0-10)
    subject?: string         // Môn học đang theo dõi
}

// Hàm tính điểm tối thiểu cần đạt ở kỳ thi cuối
function calculateMinFinalGrade(
    processGrade: number,
    midtermGrade: number,
    targetGrade: number = 5.0,
    processWeight: number = 0.4,
    midtermWeight: number = 0.2,
    finalWeight: number = 0.4
): number {
    const currentScore = processGrade * processWeight + midtermGrade * midtermWeight
    const minFinal = (targetGrade - currentScore) / finalWeight
    return Math.max(0, Math.min(10, minFinal))
}

// Hàm xác định mức độ rủi ro dựa trên điểm tối thiểu cần đạt
function getPredictedRiskLevel(minFinalGrade: number): string {
    if (minFinalGrade > 8.5) return "🔴 Rất cao - Gần như chắc chắn rớt"
    if (minFinalGrade > 7.0) return "🟠 Cao - Rất khó qua môn"
    if (minFinalGrade > 5.0) return "🟡 Trung bình - Cần cố gắng"
    if (minFinalGrade > 3.0) return "🟢 Thấp - Có thể qua môn"
    return "✅ An toàn - Dễ dàng qua môn"
}

export default function TeacherReport() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [selectedRiskLevel, setSelectedRiskLevel] = useState("all")
    const [selectedClass, setSelectedClass] = useState("all")
    const [selectedDepartment, setSelectedDepartment] = useState("all")
    const [selectedCourse, setSelectedCourse] = useState("all")
    const [selectedYear, setSelectedYear] = useState("2024-2025")
    const [selectedSemester, setSelectedSemester] = useState("1")
    const [showAllModal, setShowAllModal] = useState(false)
    const [selectedRiskGroup, setSelectedRiskGroup] = useState<'Nguy cơ cao' | 'Nguy cơ trung bình' | 'Cần theo dõi' | null>(null)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

    // Xử lý query parameters từ URL
    useEffect(() => {
        const filterParam = searchParams.get('filter')
        if (filterParam === 'high-risk') {
            setSelectedRiskLevel('Nguy cơ cao')
        }
    }, [searchParams])

    // Dữ liệu sinh viên mẫu - 30 sinh viên At-Risk (GPA < 2.5)
    const studentData: Student[] = [
        // Nguy cơ cao - 12 sinh viên (GPA < 1.5 - CẦN CAN THIỆP KHẨN CẤP)
        { id: "SV001234", name: "Nguyễn Thị Mai", class: "CNTT01", department: "Công nghệ thông tin", course: "K18", gpa: 1.2, progress: 25, absences: 18, riskLevel: "Nguy cơ cao", processGrade: 4.5, midtermGrade: 3.0, subject: "Lập trình Web" },
        { id: "SV001237", name: "Phạm Minh Tuấn", class: "CNTT03", department: "Công nghệ thông tin", course: "K18", gpa: 0.95, progress: 28, absences: 16, riskLevel: "Nguy cơ cao", processGrade: 3.8, midtermGrade: 2.5, subject: "Cấu trúc dữ liệu" },
        { id: "SV001238", name: "Hoàng Văn Long", class: "CNTT02", department: "Công nghệ thông tin", course: "K19", gpa: 1.38, progress: 30, absences: 15, riskLevel: "Nguy cơ cao", processGrade: 5.0, midtermGrade: 3.5, subject: "Cơ sở dữ liệu" },
        { id: "SV001241", name: "Nguyễn Văn Bình", class: "CNTT02", department: "Công nghệ thông tin", course: "K19", gpa: 1.45, progress: 32, absences: 14, riskLevel: "Nguy cơ cao", processGrade: 4.2, midtermGrade: 3.8, subject: "Lập trình Web" },
        { id: "SV001244", name: "Phạm Thị Em", class: "CNTT02", department: "Công nghệ thông tin", course: "K19", gpa: 1.15, progress: 30, absences: 17, riskLevel: "Nguy cơ cao", processGrade: 3.5, midtermGrade: 2.8, subject: "Mạng máy tính" },
        { id: "SV001246", name: "Lê Văn Tùng", class: "KTPM01", department: "Kỹ thuật phần mềm", course: "K18", gpa: 1.32, progress: 33, absences: 13, riskLevel: "Nguy cơ cao", processGrade: 4.8, midtermGrade: 4.0, subject: "Kỹ thuật phần mềm" },
        { id: "SV001247", name: "Nguyễn Thị Hương", class: "KTPM02", department: "Kỹ thuật phần mềm", course: "K19", gpa: 1.08, progress: 29, absences: 16, riskLevel: "Nguy cơ cao", processGrade: 3.2, midtermGrade: 2.2, subject: "Phân tích thiết kế" },
        { id: "SV001248", name: "Trần Văn Đức", class: "KHMT01", department: "Khoa học máy tính", course: "K18", gpa: 1.42, progress: 35, absences: 12, riskLevel: "Nguy cơ cao", processGrade: 5.2, midtermGrade: 4.2, subject: "Trí tuệ nhân tạo" },
        { id: "SV001249", name: "Lê Thị Lan", class: "KHMT02", department: "Khoa học máy tính", course: "K19", gpa: 0.88, progress: 27, absences: 19, riskLevel: "Nguy cơ cao", processGrade: 3.0, midtermGrade: 2.0, subject: "Học máy" },
        { id: "SV001250", name: "Phạm Văn Hải", class: "CNTT01", department: "Công nghệ thông tin", course: "K18", gpa: 1.28, progress: 36, absences: 11, riskLevel: "Nguy cơ cao", processGrade: 4.6, midtermGrade: 3.6, subject: "Hệ điều hành" },
        { id: "SV001251", name: "Hoàng Thị Nga", class: "KTPM01", department: "Kỹ thuật phần mềm", course: "K18", gpa: 0.92, progress: 26, absences: 20, riskLevel: "Nguy cơ cao", processGrade: 3.4, midtermGrade: 2.4, subject: "Kiểm thử phần mềm" },
        { id: "SV001252", name: "Đặng Văn Quân", class: "KHMT01", department: "Khoa học máy tính", course: "K18", gpa: 1.48, progress: 37, absences: 10, riskLevel: "Nguy cơ cao", processGrade: 5.5, midtermGrade: 4.5, subject: "Thị giác máy tính" },

        // Nguy cơ trung bình - 11 sinh viên (GPA 1.5 - 2.0)
        { id: "SV001235", name: "Trần Văn Hùng", class: "CNTT02", department: "Công nghệ thông tin", course: "K19", gpa: 1.82, progress: 48, absences: 8, riskLevel: "Nguy cơ trung bình", processGrade: 6.0, midtermGrade: 5.0, subject: "Lập trình Web" },
        { id: "SV001239", name: "Vũ Thị Lan", class: "CNTT01", department: "Công nghệ thông tin", course: "K18", gpa: 1.65, progress: 45, absences: 9, riskLevel: "Nguy cơ trung bình", processGrade: 5.5, midtermGrade: 4.5, subject: "Cơ sở dữ liệu" },
        { id: "SV001242", name: "Trần Thị Cúc", class: "CNTT01", department: "Công nghệ thông tin", course: "K18", gpa: 1.95, progress: 52, absences: 7, riskLevel: "Nguy cơ trung bình", processGrade: 6.5, midtermGrade: 5.5, subject: "Mạng máy tính" },
        { id: "SV001245", name: "Hoàng Văn Phúc", class: "CNTT01", department: "Công nghệ thông tin", course: "K18", gpa: 1.73, progress: 50, absences: 8, riskLevel: "Nguy cơ trung bình", processGrade: 5.8, midtermGrade: 4.8, subject: "Lập trình Web" },
        { id: "SV001253", name: "Nguyễn Văn Kiên", class: "KTPM02", department: "Kỹ thuật phần mềm", course: "K19", gpa: 1.88, progress: 51, absences: 7, riskLevel: "Nguy cơ trung bình", processGrade: 6.2, midtermGrade: 5.2, subject: "Kỹ thuật phần mềm" },
        { id: "SV001254", name: "Lê Thị Tâm", class: "KHMT02", department: "Khoa học máy tính", course: "K19", gpa: 1.58, progress: 47, absences: 9, riskLevel: "Nguy cơ trung bình", processGrade: 5.6, midtermGrade: 4.6, subject: "Trí tuệ nhân tạo" },
        { id: "SV001255", name: "Phạm Văn Thắng", class: "CNTT03", department: "Công nghệ thông tin", course: "K18", gpa: 1.92, progress: 53, absences: 6, riskLevel: "Nguy cơ trung bình", processGrade: 6.4, midtermGrade: 5.4, subject: "Hệ điều hành" },
        { id: "SV001256", name: "Trần Thị Hồng", class: "KTPM01", department: "Kỹ thuật phần mềm", course: "K18", gpa: 1.98, progress: 55, absences: 5, riskLevel: "Nguy cơ trung bình", processGrade: 6.6, midtermGrade: 5.6, subject: "Kiểm thử phần mềm" },
        { id: "SV001257", name: "Nguyễn Văn Tài", class: "KHMT01", department: "Khoa học máy tính", course: "K18", gpa: 1.78, progress: 54, absences: 6, riskLevel: "Nguy cơ trung bình", processGrade: 5.9, midtermGrade: 4.9, subject: "Học máy" },
        { id: "SV001258", name: "Lê Văn Hoàng", class: "CNTT02", department: "Công nghệ thông tin", course: "K19", gpa: 1.85, progress: 56, absences: 5, riskLevel: "Nguy cơ trung bình", processGrade: 6.1, midtermGrade: 5.1, subject: "Cấu trúc dữ liệu" },
        { id: "SV001259", name: "Phạm Thị Linh", class: "KTPM02", department: "Kỹ thuật phần mềm", course: "K19", gpa: 1.52, progress: 46, absences: 10, riskLevel: "Nguy cơ trung bình", processGrade: 5.4, midtermGrade: 4.4, subject: "Phân tích thiết kế" },

        // Cần theo dõi - 7 sinh viên (GPA 2.0 - 2.5)
        { id: "SV001236", name: "Lê Thị Hoa", class: "CNTT01", department: "Công nghệ thông tin", course: "K18", gpa: 2.22, progress: 68, absences: 4, riskLevel: "Cần theo dõi", processGrade: 7.0, midtermGrade: 6.0, subject: "Lập trình Web" },
        { id: "SV001240", name: "Đỗ Văn Nam", class: "CNTT03", department: "Công nghệ thông tin", course: "K18", gpa: 2.45, progress: 72, absences: 3, riskLevel: "Cần theo dõi", processGrade: 7.5, midtermGrade: 6.5, subject: "Cơ sở dữ liệu" },
        { id: "SV001243", name: "Lê Văn Đức", class: "CNTT03", department: "Công nghệ thông tin", course: "K18", gpa: 2.08, progress: 65, absences: 5, riskLevel: "Cần theo dõi", processGrade: 6.8, midtermGrade: 5.8, subject: "Mạng máy tính" },
        { id: "SV001260", name: "Hoàng Văn Minh", class: "KHMT02", department: "Khoa học máy tính", course: "K19", gpa: 2.35, progress: 70, absences: 4, riskLevel: "Cần theo dõi", processGrade: 7.2, midtermGrade: 6.2, subject: "Trí tuệ nhân tạo" },
        { id: "SV001261", name: "Nguyễn Thị Thu", class: "KTPM01", department: "Kỹ thuật phần mềm", course: "K18", gpa: 2.42, progress: 71, absences: 3, riskLevel: "Cần theo dõi", processGrade: 7.4, midtermGrade: 6.4, subject: "Kỹ thuật phần mềm" },
        { id: "SV001262", name: "Trần Văn Sơn", class: "CNTT02", department: "Công nghệ thông tin", course: "K19", gpa: 2.15, progress: 67, absences: 5, riskLevel: "Cần theo dõi", processGrade: 6.9, midtermGrade: 5.9, subject: "Hệ điều hành" },
        { id: "SV001263", name: "Lê Thị Mai Anh", class: "KHMT01", department: "Khoa học máy tính", course: "K18", gpa: 2.48, progress: 73, absences: 2, riskLevel: "Cần theo dõi", processGrade: 7.6, midtermGrade: 6.6, subject: "Học máy" },
    ]

    // Thống kê
    const totalAtRisk = studentData.length
    const highRisk = studentData.filter(s => s.riskLevel === "Nguy cơ cao").length
    const mediumRisk = studentData.filter(s => s.riskLevel === "Nguy cơ trung bình").length
    const lowRisk = studentData.filter(s => s.riskLevel === "Cần theo dõi").length

    // Nhóm sinh viên theo mức độ rủi ro (có áp dụng filter)
    // Filter students based on selected filters
    const filteredStudents = studentData.filter(student => {
        const classMatch = selectedClass === "all" || student.class === selectedClass
        const departmentMatch = selectedDepartment === "all" || student.department === selectedDepartment
        const courseMatch = selectedCourse === "all" || student.course === selectedCourse
        return classMatch && departmentMatch && courseMatch
    })

    const highRiskStudents = filteredStudents
        .filter(s => s.riskLevel === "Nguy cơ cao")
        .sort((a, b) => a.gpa - b.gpa)

    const mediumRiskStudents = filteredStudents
        .filter(s => s.riskLevel === "Nguy cơ trung bình")
        .sort((a, b) => a.gpa - b.gpa)

    const monitorStudents = filteredStudents
        .filter(s => s.riskLevel === "Cần theo dõi")
        .sort((a, b) => a.gpa - b.gpa)
    // Trend Chart Data
    const trendChartData = {
        labels: ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4', 'Tuần 5', 'Tuần 6', 'Tuần 7', 'Tuần 8'],
        datasets: [
            {
                label: 'Nguy cơ cao',
                data: [12, 15, 18, 16, 20, 18, 17, 18],
                borderColor: 'rgb(220, 38, 38)',
                backgroundColor: 'rgba(220, 38, 38, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            },
            {
                label: 'Nguy cơ trung bình',
                data: [18, 20, 22, 19, 23, 21, 20, 21],
                borderColor: 'rgb(245, 158, 11)',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            },
            {
                label: 'Cần theo dõi',
                data: [6, 8, 7, 9, 8, 7, 8, 8],
                borderColor: 'rgb(251, 191, 36)',
                backgroundColor: 'rgba(251, 191, 36, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }
        ]
    }

    const trendChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const
            }
        },
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }

    // Distribution Chart Data
    const distributionChartData = {
        labels: ['CNTT01', 'CNTT02', 'CNTT03', 'CNTT04', 'CNTT05'],
        datasets: [{
            data: [15, 12, 8, 7, 5],
            backgroundColor: [
                'rgb(220, 38, 38)',
                'rgb(245, 158, 11)',
                'rgb(251, 191, 36)',
                'rgb(156, 163, 175)',
                'rgb(209, 213, 219)'
            ],
            borderWidth: 2,
            borderColor: '#fff'
        }]
    }

    const distributionChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right' as const
            }
        }
    }

    const getRiskBadgeColor = (riskLevel: string) => {
        switch (riskLevel) {
            case 'Nguy cơ cao':
                return 'bg-red-100 text-red-800 border-red-200'
            case 'Nguy cơ trung bình':
                return 'bg-orange-100 text-orange-800 border-orange-200'
            case 'Cần theo dõi':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200'
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    const getRiskIcon = (riskLevel: string) => {
        switch (riskLevel) {
            case 'Nguy cơ cao':
                return 'fa-exclamation-triangle'
            case 'Nguy cơ trung bình':
                return 'fa-exclamation-circle'
            case 'Cần theo dõi':
                return 'fa-eye'
            default:
                return 'fa-info-circle'
        }
    }

    const getScoreColor = (gpa: number) => {
        if (gpa >= 2.0) return 'text-blue-600'      // Cần theo dõi (2.0 - 2.5)
        if (gpa >= 1.5) return 'text-orange-600'    // Nguy cơ trung bình (1.5 - 2.0)
        return 'text-red-700'                        // Nguy cơ cao (< 1.5)
    }

    const handleExportPDF = () => {
        alert('Xuất báo cáo PDF')
        // TODO: Implement PDF export
    }

    const handleExportExcel = () => {
        alert('Xuất báo cáo Excel')
        // TODO: Implement Excel export
    }

    const openViewAllModal = (riskLevel: 'Nguy cơ cao' | 'Nguy cơ trung bình' | 'Cần theo dõi') => {
        setSelectedRiskGroup(riskLevel)
        setShowAllModal(true)
    }

    const closeViewAllModal = () => {
        setShowAllModal(false)
        setSelectedRiskGroup(null)
    }

    const getModalStudents = () => {
        if (!selectedRiskGroup) return []
        return studentData.filter(s => s.riskLevel === selectedRiskGroup).sort((a, b) => a.gpa - b.gpa)
    }

    const openStudentDetail = (student: Student) => {
        setSelectedStudent(student)
        setShowDetailModal(true)
    }

    const closeStudentDetail = () => {
        setShowDetailModal(false)
        setSelectedStudent(null)
    }

    // Component hiển thị card sinh viên
    const StudentCard = ({ student }: { student: Student }) => (
        <div className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                        <i className="fas fa-user text-gray-600"></i>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-900">{student.name}</h4>
                        <p className="text-xs text-gray-500">{student.id}</p>
                        <p className="text-xs text-gray-500">{student.department} • {student.course} • {student.class}</p>
                    </div>
                </div>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRiskBadgeColor(student.riskLevel)}`}>
                    <i className={`fas ${getRiskIcon(student.riskLevel)} mr-1`}></i>
                    {student.riskLevel}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="text-center p-2 bg-gray-50 rounded">
                    <p className="text-xs text-gray-500">GPA</p>
                    <p className={`text-lg font-bold ${getScoreColor(student.gpa)}`}>{student.gpa.toFixed(2)}</p>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                    <p className="text-xs text-gray-500">Vắng</p>
                    <p className={`text-lg font-bold ${student.absences > 10 ? 'text-red-600' : student.absences > 5 ? 'text-orange-600' : 'text-yellow-600'}`}>{student.absences} buổi</p>
                </div>
            </div>

            {/* Dự báo rủi ro rớt môn */}
            {student.processGrade !== undefined && student.midtermGrade !== undefined && (
                <div className="mb-3 p-2 bg-purple-50 border border-purple-200 rounded">
                    <p className="text-xs text-purple-700 font-medium mb-1">
                        📊 {student.subject}
                    </p>
                    {(() => {
                        const minToPass = calculateMinFinalGrade(student.processGrade!, student.midtermGrade!, 5.0)
                        const riskColor =
                            minToPass > 8.0 ? 'text-red-600' :
                                minToPass > 6.0 ? 'text-orange-600' :
                                    minToPass > 4.0 ? 'text-yellow-600' :
                                        'text-green-600'
                        return (
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-600">Cần thi tối thiểu:</span>
                                <span className={`text-sm font-bold ${riskColor}`}>
                                    {minToPass > 10 ? '> 10 ❌' : `${minToPass.toFixed(1)} điểm`}
                                </span>
                            </div>
                        )
                    })()}
                </div>
            )}

            <div className="flex items-center space-x-2">
                <Button
                    size="sm"
                    onClick={() => openStudentDetail(student)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs"
                >
                    <i className="fas fa-eye mr-1"></i>
                    Chi tiết
                </Button>
                <Button
                    size="sm"
                    onClick={() => navigate(`/teacher/messages?studentId=${student.id}`)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs"
                >
                    <i className="fas fa-comment mr-1"></i>
                    Liên hệ
                </Button>
                <Button
                    size="sm"
                    onClick={() => navigate(`/teacher/appointments?action=book&studentId=${student.id}`)}
                    className="bg-orange-600 hover:bg-orange-700 text-white text-xs px-2"
                    title="Đặt lịch can thiệp"
                >
                    <i className="fas fa-calendar-plus"></i>
                </Button>
            </div>
        </div>
    )

    return (
        <TeacherLayout currentPage="reports-alerts">
            {/* Page Header */}
            <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-6 rounded-xl shadow-lg mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-3xl font-bold mb-2">Báo cáo & Cảnh báo</h2>
                        <p className="text-red-100">Theo dõi và quản lý sinh viên có nguy cơ học tập</p>
                    </div>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-4 sm:mt-0">
                        <Button
                            onClick={handleExportPDF}
                            className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 flex items-center justify-center border border-white/30"
                        >
                            <i className="fas fa-file-export mr-2"></i>
                            Xuất báo cáo PDF
                        </Button>
                        <Button
                            onClick={handleExportExcel}
                            className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 flex items-center justify-center border border-white/30"
                        >
                            <i className="fas fa-file-excel mr-2"></i>
                            Xuất Excel
                        </Button>
                    </div>
                </div>
            </div>

            {/* Bộ lọc */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-800">Bộ lọc báo cáo</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Năm học</label>
                            <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                            >
                                <option value="2024-2025">2024-2025</option>
                                <option value="2023-2024">2023-2024</option>
                                <option value="2022-2023">2022-2023</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Học kỳ</label>
                            <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={selectedSemester}
                                onChange={(e) => setSelectedSemester(e.target.value)}
                            >
                                <option value="1">Kỳ 1</option>
                                <option value="2">Kỳ 2</option>
                                <option value="3">Kỳ hè</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Khoa</label>
                            <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={selectedDepartment}
                                onChange={(e) => setSelectedDepartment(e.target.value)}
                            >
                                <option value="all">Tất cả khoa</option>
                                <option value="Công nghệ thông tin">Công nghệ thông tin</option>
                                <option value="Kỹ thuật phần mềm">Kỹ thuật phần mềm</option>
                                <option value="Khoa học máy tính">Khoa học máy tính</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Khóa</label>
                            <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={selectedCourse}
                                onChange={(e) => setSelectedCourse(e.target.value)}
                            >
                                <option value="all">Tất cả khóa</option>
                                <option value="K18">K18</option>
                                <option value="K19">K19</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Lớp</label>
                            <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                            >
                                <option value="all">Tất cả lớp</option>
                                <option value="CNTT01">CNTT01</option>
                                <option value="CNTT02">CNTT02</option>
                                <option value="CNTT03">CNTT03</option>
                                <option value="KTPM01">KTPM01</option>
                                <option value="KTPM02">KTPM02</option>
                                <option value="KHMT01">KHMT01</option>
                                <option value="KHMT02">KHMT02</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Mức độ cảnh báo</label>
                            <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={selectedRiskLevel}
                                onChange={(e) => setSelectedRiskLevel(e.target.value)}
                            >
                                <option value="all">Tất cả</option>
                                <option value="Nguy cơ cao">Nguy cơ cao</option>
                                <option value="Nguy cơ trung bình">Nguy cơ trung bình</option>
                                <option value="Cần theo dõi">Cần theo dõi</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Thống kê tổng quan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6 mb-6">
                <Card className="bg-white border border-gray-200">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Tổng sinh viên At-Risk</p>
                                <p className="text-3xl font-bold text-red-600">{totalAtRisk}</p>
                            </div>
                            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                <i className="fas fa-exclamation-triangle text-red-600 text-xl"></i>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm">
                            <span className="text-red-600 font-medium">+8</span>
                            <span className="text-gray-500 ml-2">so với tuần trước</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border border-gray-200">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Nguy cơ cao</p>
                                <p className="text-3xl font-bold text-red-700">{highRisk}</p>
                            </div>
                            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                <i className="fas fa-times-circle text-red-700 text-xl"></i>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm">
                            <span className="text-red-600 font-medium">{((highRisk / totalAtRisk) * 100).toFixed(1)}%</span>
                            <span className="text-gray-500 ml-2">của tổng At-Risk</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border border-gray-200">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Nguy cơ trung bình</p>
                                <p className="text-3xl font-bold text-orange-600">{mediumRisk}</p>
                            </div>
                            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                <i className="fas fa-exclamation-circle text-orange-600 text-xl"></i>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm">
                            <span className="text-orange-600 font-medium">{((mediumRisk / totalAtRisk) * 100).toFixed(1)}%</span>
                            <span className="text-gray-500 ml-2">của tổng At-Risk</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border border-gray-200">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Cần theo dõi</p>
                                <p className="text-3xl font-bold text-yellow-600">{lowRisk}</p>
                            </div>
                            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <i className="fas fa-eye text-yellow-600 text-xl"></i>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm">
                            <span className="text-yellow-600 font-medium">{((lowRisk / totalAtRisk) * 100).toFixed(1)}%</span>
                            <span className="text-gray-500 ml-2">của tổng At-Risk</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Card mới: Dự báo rủi ro rớt môn */}
                <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-purple-700">Rủi ro rớt môn</p>
                                <p className="text-3xl font-bold text-purple-600">
                                    {filteredStudents.filter(s => {
                                        if (s.processGrade === undefined || s.midtermGrade === undefined) return false
                                        const minToPass = calculateMinFinalGrade(s.processGrade, s.midtermGrade, 5.0)
                                        return minToPass > 7.0 // Rất khó qua môn
                                    }).length}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-purple-200 rounded-lg flex items-center justify-center">
                                <i className="fas fa-chart-line text-purple-700 text-xl"></i>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm">
                            <span className="text-purple-600 font-medium">Cần thi &gt; 7.0</span>
                            <span className="text-purple-500 ml-2">để qua môn</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Biểu đồ xu hướng */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Xu hướng At-Risk theo thời gian */}
                <Card>
                    <CardHeader className="border-b border-gray-200">
                        <CardTitle className="text-lg font-semibold text-gray-800">Xu hướng sinh viên At-Risk</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">Theo dõi số lượng sinh viên At-Risk qua các tuần</p>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="h-64 w-full">
                            <Line data={trendChartData} options={trendChartOptions} />
                        </div>
                    </CardContent>
                </Card>

                {/* Phân bố theo lớp */}
                <Card>
                    <CardHeader className="border-b border-gray-200">
                        <CardTitle className="text-lg font-semibold text-gray-800">Phân bố At-Risk theo lớp</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">Tỷ lệ sinh viên At-Risk trong từng lớp</p>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="h-64 w-full">
                            <Doughnut data={distributionChartData} options={distributionChartOptions} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Danh sách sinh viên At-Risk theo nhóm */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Danh sách sinh viên theo mức độ rủi ro</h3>
                        <p className="text-sm text-gray-600 mt-1">Nhấp vào "Xem tất cả" để xem toàn bộ danh sách từng nhóm</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Card: Nguy cơ cao */}
                    <Card className="border-2 border-red-200 bg-red-50">
                        <CardHeader className="bg-gradient-to-r from-red-100 to-red-50 border-b-2 border-red-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                                        <i className="fas fa-exclamation-triangle text-white text-lg"></i>
                                    </div>
                                    <div>
                                        <CardTitle className="text-red-900 font-bold">Nguy cơ cao</CardTitle>
                                        <p className="text-sm text-red-700 mt-0.5">Cần can thiệp ngay</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-bold text-red-700">{highRiskStudents.length}</div>
                                    <div className="text-xs text-red-600">sinh viên</div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4">
                            <div className="space-y-3">
                                {highRiskStudents.slice(0, 3).map((student) => (
                                    <StudentCard key={student.id} student={student} />
                                ))}
                                {highRiskStudents.length === 0 && (
                                    <div className="text-center py-8">
                                        <i className="fas fa-check-circle text-green-500 text-3xl mb-2"></i>
                                        <p className="text-sm text-gray-600">Không có sinh viên</p>
                                    </div>
                                )}
                            </div>
                            {highRiskStudents.length > 3 && (
                                <Button
                                    onClick={() => openViewAllModal('Nguy cơ cao')}
                                    className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white"
                                >
                                    <i className="fas fa-list mr-2"></i>
                                    Xem tất cả {highRiskStudents.length} sinh viên
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    {/* Card: Nguy cơ trung bình - CAM NHẠT */}
                    <Card className="border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-amber-50 shadow-lg hover:shadow-xl transition-shadow">
                        <CardHeader className="bg-gradient-to-r from-orange-100 via-amber-50 to-orange-50 border-b-2 border-orange-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center shadow-md">
                                        <i className="fas fa-exclamation-circle text-white text-lg"></i>
                                    </div>
                                    <div>
                                        <CardTitle className="text-orange-900 font-bold text-lg">Nguy cơ trung bình</CardTitle>
                                        <p className="text-sm text-orange-700 mt-0.5">GPA 1.5-2.0 • Cần hỗ trợ kịp thời</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-bold text-orange-700">{mediumRiskStudents.length}</div>
                                    <div className="text-xs text-orange-600 font-medium">sinh viên</div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4">
                            <div className="space-y-3">
                                {mediumRiskStudents.slice(0, 3).map((student) => (
                                    <StudentCard key={student.id} student={student} />
                                ))}
                                {mediumRiskStudents.length === 0 && (
                                    <div className="text-center py-8">
                                        <i className="fas fa-check-circle text-green-500 text-3xl mb-2"></i>
                                        <p className="text-sm text-gray-600">Không có sinh viên</p>
                                    </div>
                                )}
                            </div>
                            {mediumRiskStudents.length > 3 && (
                                <Button
                                    onClick={() => openViewAllModal('Nguy cơ trung bình')}
                                    className="w-full mt-4 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-md"
                                >
                                    <i className="fas fa-list mr-2"></i>
                                    Xem tất cả {mediumRiskStudents.length} sinh viên
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    {/* Card: Cần theo dõi - XANH MÁT */}
                    <Card className="border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-lg hover:shadow-xl transition-shadow">
                        <CardHeader className="bg-gradient-to-r from-blue-100 via-cyan-50 to-blue-50 border-b-2 border-blue-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center shadow-md">
                                        <i className="fas fa-eye text-white text-lg"></i>
                                    </div>
                                    <div>
                                        <CardTitle className="text-blue-900 font-bold text-lg">Cần theo dõi</CardTitle>
                                        <p className="text-sm text-blue-700 mt-0.5">GPA 2.0-2.5 • Giám sát thường xuyên</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-bold text-blue-700">{monitorStudents.length}</div>
                                    <div className="text-xs text-blue-600 font-medium">sinh viên</div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4">
                            <div className="space-y-3">
                                {monitorStudents.slice(0, 3).map((student) => (
                                    <StudentCard key={student.id} student={student} />
                                ))}
                                {monitorStudents.length === 0 && (
                                    <div className="text-center py-8">
                                        <i className="fas fa-check-circle text-green-500 text-3xl mb-2"></i>
                                        <p className="text-sm text-gray-600">Không có sinh viên</p>
                                    </div>
                                )}
                            </div>
                            {monitorStudents.length > 3 && (
                                <Button
                                    onClick={() => openViewAllModal('Cần theo dõi')}
                                    className="w-full mt-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-md"
                                >
                                    <i className="fas fa-list mr-2"></i>
                                    Xem tất cả {monitorStudents.length} sinh viên
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Modal xem tất cả sinh viên */}
            {showAllModal && selectedRiskGroup && (
                <div className="fixed inset-0 backdrop-blur-sm bg-white/30 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
                        <div className={`p-6 border-b ${selectedRiskGroup === 'Nguy cơ cao' ? 'bg-red-50 border-red-200' :
                            selectedRiskGroup === 'Nguy cơ trung bình' ? 'bg-orange-50 border-orange-200' :
                                'bg-yellow-50 border-yellow-200'
                            }`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${selectedRiskGroup === 'Nguy cơ cao' ? 'bg-red-600' :
                                        selectedRiskGroup === 'Nguy cơ trung bình' ? 'bg-orange-600' :
                                            'bg-yellow-600'
                                        }`}>
                                        <i className={`fas ${getRiskIcon(selectedRiskGroup)} text-white text-xl`}></i>
                                    </div>
                                    <div>
                                        <h3 className={`text-2xl font-bold ${selectedRiskGroup === 'Nguy cơ cao' ? 'text-red-900' :
                                            selectedRiskGroup === 'Nguy cơ trung bình' ? 'text-orange-900' :
                                                'text-yellow-900'
                                            }`}>
                                            {selectedRiskGroup}
                                        </h3>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Tổng số: {getModalStudents().length} sinh viên
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={closeViewAllModal}
                                    className="text-gray-500 hover:text-gray-700 text-2xl"
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {getModalStudents().map((student) => (
                                    <StudentCard key={student.id} student={student} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal chi tiết sinh viên */}
            {showDetailModal && selectedStudent && (
                <div className="fixed inset-0 backdrop-blur-sm bg-white/30 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                        <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-blue-100">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                                        <i className="fas fa-user text-white text-2xl"></i>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-800">{selectedStudent.name}</h3>
                                        <p className="text-sm text-gray-600 mt-1">Mã SV: {selectedStudent.id}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={closeStudentDetail}
                                    className="text-gray-500 hover:text-gray-700 text-2xl"
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                            {/* Thông tin cơ bản */}
                            <div className="mb-6">
                                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                    <i className="fas fa-info-circle text-blue-600 mr-2"></i>
                                    Thông tin cơ bản
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-xs text-gray-500 mb-1">Khoa</p>
                                        <p className="font-semibold text-gray-800">{selectedStudent.department}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-xs text-gray-500 mb-1">Khóa</p>
                                        <p className="font-semibold text-gray-800">{selectedStudent.course}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-xs text-gray-500 mb-1">Lớp</p>
                                        <p className="font-semibold text-gray-800">{selectedStudent.class}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-xs text-gray-500 mb-1">Mức độ rủi ro</p>
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRiskBadgeColor(selectedStudent.riskLevel)}`}>
                                            <i className={`fas ${getRiskIcon(selectedStudent.riskLevel)} mr-1`}></i>
                                            {selectedStudent.riskLevel}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Thông tin học tập */}
                            <div className="mb-6">
                                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                    <i className="fas fa-graduation-cap text-green-600 mr-2"></i>
                                    Thông tin học tập
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border-2 border-blue-200">
                                        <p className="text-sm text-blue-700 mb-2 font-medium">GPA</p>
                                        <p className={`text-4xl font-bold ${getScoreColor(selectedStudent.gpa)}`}>
                                            {selectedStudent.gpa.toFixed(2)}
                                        </p>
                                        <p className="text-xs text-blue-600 mt-1">Thang điểm 4.0</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-lg border-2 border-red-200">
                                        <p className="text-sm text-red-700 mb-2 font-medium">Số buổi vắng</p>
                                        <p className={`text-4xl font-bold ${selectedStudent.absences > 10 ? 'text-red-600' : selectedStudent.absences > 5 ? 'text-orange-600' : 'text-yellow-600'}`}>
                                            {selectedStudent.absences}
                                        </p>
                                        <p className="text-xs text-red-600 mt-1">Buổi học</p>
                                    </div>
                                </div>
                            </div>

                            {/* Dự báo điểm - CHỈ HIỂN THỊ NẾU CÓ DỮ LIỆU */}
                            {selectedStudent.processGrade !== undefined && selectedStudent.midtermGrade !== undefined && (
                                <div className="mb-6">
                                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                        <i className="fas fa-chart-line text-purple-600 mr-2"></i>
                                        Dự báo kết quả - {selectedStudent.subject}
                                    </h4>

                                    {/* Điểm hiện tại */}
                                    <div className="grid grid-cols-3 gap-4 mb-4">
                                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                            <p className="text-xs text-blue-700 mb-1">Điểm QT (40%)</p>
                                            <p className="text-2xl font-bold text-blue-600">{selectedStudent.processGrade.toFixed(1)}</p>
                                        </div>
                                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                            <p className="text-xs text-green-700 mb-1">Điểm GK (20%)</p>
                                            <p className="text-2xl font-bold text-green-600">{selectedStudent.midtermGrade.toFixed(1)}</p>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-300">
                                            <p className="text-xs text-gray-600 mb-1">Điểm CK (40%)</p>
                                            <p className="text-2xl font-bold text-gray-400">?</p>
                                        </div>
                                    </div>

                                    {/* Bảng dự báo */}
                                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-lg border-2 border-purple-200">
                                        <p className="text-sm font-semibold text-purple-800 mb-3">📊 Điểm tối thiểu cần đạt ở kỳ thi cuối:</p>
                                        <div className="space-y-2">
                                            {(() => {
                                                const minToPass = calculateMinFinalGrade(selectedStudent.processGrade!, selectedStudent.midtermGrade!, 5.0)
                                                const minForGood = calculateMinFinalGrade(selectedStudent.processGrade!, selectedStudent.midtermGrade!, 7.0)
                                                const minForExcellent = calculateMinFinalGrade(selectedStudent.processGrade!, selectedStudent.midtermGrade!, 8.5)

                                                return (
                                                    <>
                                                        <div className="flex justify-between items-center bg-white p-3 rounded shadow-sm">
                                                            <span className="text-sm">🎯 Để <strong>ĐẠT</strong> (≥5.0):</span>
                                                            <span className={`font-bold text-lg ${minToPass > 8.0 ? 'text-red-600' : minToPass > 6.0 ? 'text-orange-600' : 'text-green-600'}`}>
                                                                {minToPass.toFixed(2)}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center bg-white p-3 rounded shadow-sm">
                                                            <span className="text-sm">🌟 Để <strong>ĐẠT KHÁ</strong> (≥7.0):</span>
                                                            <span className={`font-bold text-lg ${minForGood > 10 ? 'text-red-600' : minForGood > 8.5 ? 'text-orange-600' : 'text-blue-600'}`}>
                                                                {minForGood > 10 ? '> 10 (Không thể)' : minForGood.toFixed(2)}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center bg-white p-3 rounded shadow-sm">
                                                            <span className="text-sm">🏆 Để <strong>ĐẠT GIỎI</strong> (≥8.5):</span>
                                                            <span className={`font-bold text-lg ${minForExcellent > 10 ? 'text-red-600' : 'text-purple-600'}`}>
                                                                {minForExcellent > 10 ? '> 10 (Không thể)' : minForExcellent.toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </>
                                                )
                                            })()}
                                        </div>

                                        {/* Cảnh báo rủi ro */}
                                        {(() => {
                                            const minToPass = calculateMinFinalGrade(selectedStudent.processGrade!, selectedStudent.midtermGrade!, 5.0)
                                            const riskLevel = getPredictedRiskLevel(minToPass)
                                            const riskColor =
                                                minToPass > 8.5 ? 'bg-red-100 border-red-300 text-red-800' :
                                                    minToPass > 7.0 ? 'bg-orange-100 border-orange-300 text-orange-800' :
                                                        minToPass > 5.0 ? 'bg-yellow-100 border-yellow-300 text-yellow-800' :
                                                            minToPass > 3.0 ? 'bg-blue-100 border-blue-300 text-blue-800' :
                                                                'bg-green-100 border-green-300 text-green-800'

                                            return (
                                                <div className={`mt-4 p-3 rounded border-2 ${riskColor}`}>
                                                    <p className="text-sm font-semibold">⚠️ Đánh giá rủi ro: {riskLevel}</p>
                                                    {minToPass > 8.0 && (
                                                        <p className="text-xs mt-1">Khuyến nghị: Cần can thiệp khẩn cấp! Liên hệ ngay với sinh viên và phụ huynh.</p>
                                                    )}
                                                    {minToPass > 6.0 && minToPass <= 8.0 && (
                                                        <p className="text-xs mt-1">Khuyến nghị: Cần tư vấn và hỗ trợ học tập tích cực.</p>
                                                    )}
                                                    {minToPass > 3.0 && minToPass <= 6.0 && (
                                                        <p className="text-xs mt-1">Khuyến nghị: Động viên và theo dõi tiến độ học tập.</p>
                                                    )}
                                                </div>
                                            )
                                        })()}
                                    </div>
                                </div>
                            )}

                            {/* Hành động */}
                            <div>
                                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                    <i className="fas fa-tasks text-orange-600 mr-2"></i>
                                    Hành động
                                </h4>
                                <div className="flex gap-3">
                                    <Button
                                        onClick={() => {
                                            closeStudentDetail()
                                            navigate(`/teacher/messages?studentId=${selectedStudent.id}`)
                                        }}
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                    >
                                        <i className="fas fa-comment mr-2"></i>
                                        Nhắn tin
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            closeStudentDetail()
                                            navigate(`/teacher/appointments?action=book&studentId=${selectedStudent.id}`)
                                        }}
                                        className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                                    >
                                        <i className="fas fa-calendar-plus mr-2"></i>
                                        Đặt lịch tư vấn
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </TeacherLayout>
    )
}
