import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/teacher/teacher_card"
import { Badge } from "@/components/ui/teacher/teacher_badge"
import { Button } from "@/components/ui/teacher/teacher_button"
import TeacherLayout from "./components/TeacherLayout"
import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import teacherDashboardService, { 
    type TeacherDashboardResponse,
    type TeacherDashboardFilterDto 
} from "@/services/teacher/api/dashboardService"
import toast, { Toaster } from 'react-hot-toast'
import { RefreshCw } from "lucide-react"

// Asset imports
import imgStudent from "@/assets/teacher/Avatar_Student1.png"
import imgStudent1 from "@/assets/teacher/Avatar_Student2.png"
import imgStudent2 from "@/assets/teacher/Avatar_Student3.png"

export default function TeacherDashboard() {
    const navigate = useNavigate()
    const { t } = useTranslation('teacher')

    // State for filters and chart view
    const [selectedFaculty, setSelectedFaculty] = useState("all")
    const [selectedIntake, setSelectedIntake] = useState("all")
    const [selectedCourse, setSelectedCourse] = useState("all")
    const [selectedSemester, setSelectedSemester] = useState(1)
    const [selectedYear, setSelectedYear] = useState("2024-2025")
    const [chartView, setChartView] = useState("weekly")

    // Dashboard data state - separate KPI and Chart data
    const [kpiData, setKpiData] = useState<TeacherDashboardResponse | null>(null)
    const [chartData, setChartData] = useState<TeacherDashboardResponse | null>(null)
    const [loadingKPI, setLoadingKPI] = useState(false)
    const [loadingChart, setLoadingChart] = useState(false)
    const [loadingFilters, setLoadingFilters] = useState(false)
    const [filterOptions, setFilterOptions] = useState<any>({
        faculties: [],
        courses: [],
        academicYears: [],
        semesters: [],
        classes: [],
    })

    // Computed filtered options for cascading
    const filteredIntakes = React.useMemo(() => {
        if (selectedFaculty === 'all') return []
        // Filter intakes based on selected faculty
        const facultyClasses = filterOptions.classes?.filter((cls: any) => 
            cls.school === selectedFaculty
        ) || []
        const intakes = Array.from(new Set(
            facultyClasses.map((c: any) => {
                if (!c.cohortYear) return null
                const graduationYear = c.cohortYear + 6
                return `K${graduationYear.toString().slice(-2)}`
            }).filter(Boolean)
        )).sort() as string[]
        return intakes
    }, [selectedFaculty, filterOptions.classes])

    const filteredClasses = React.useMemo(() => {
        if (selectedFaculty === 'all' || selectedIntake === 'all') return []
        // Filter classes based on selected faculty and intake
        return (filterOptions.classes?.filter((cls: any) => {
            const facultyMatch = cls.school === selectedFaculty
            if (!facultyMatch) return false
            
            // Check intake match
            if (cls.cohortYear) {
                const graduationYear = cls.cohortYear + 6
                const intake = `K${graduationYear.toString().slice(-2)}`
                return intake === selectedIntake
            }
            return false
        }) || []) as any[]
    }, [selectedFaculty, selectedIntake, filterOptions.classes])

    // Fetch filter options and KPI data on mount
    useEffect(() => {
        fetchFilterOptions()
        fetchKPIData() // KPI cards without filters
    }, [])

    // Reset intake when faculty changes
    useEffect(() => {
        if (selectedFaculty === 'all') {
            setSelectedIntake('all')
            setSelectedCourse('all')
        }
    }, [selectedFaculty])

    // Reset class when intake changes
    useEffect(() => {
        if (selectedIntake === 'all') {
            setSelectedCourse('all')
        }
    }, [selectedIntake])

    // Fetch chart data when filters change
    useEffect(() => {
        if (filterOptions.academicYears.length > 0) {
            fetchChartData()
        }
    }, [selectedYear, selectedSemester, selectedFaculty, selectedIntake, selectedCourse])

    const fetchFilterOptions = async () => {
        try {
            setLoadingFilters(true)
            const options = await teacherDashboardService.getFilterOptions()
            setFilterOptions(options)
            // Set default values
            if (options.academicYears.length > 0) {
                setSelectedYear(options.academicYears[0])
            }
            if (options.semesters.length > 0) {
                setSelectedSemester(options.semesters[0])
            }
            // Set default to 'all' for faculty (now has "Tất cả các trường")
            if (options.faculties.length > 0) {
                setSelectedFaculty("all")
            }
            // Set default intake to 'all'
            if (options.courses.length > 0) {
                setSelectedIntake("all")
            }
        } catch (err) {
            toast.error(t('dashboard.errorLoadingFilters'))
        } finally {
            setLoadingFilters(false)
        }
    }

    // Fetch KPI data WITHOUT filters (always show all students)
    const fetchKPIData = async () => {
        try {
            setLoadingKPI(true)
            const data = await teacherDashboardService.getDashboardStats({}) // No filters
            setKpiData(data)
        } catch (err: any) {
            toast.error(t('dashboard.errorLoadingKPIData'))
        } finally {
            setLoadingKPI(false)
        }
    }

    // Fetch chart data WITH filters
    const fetchChartData = async () => {
        try {
            setLoadingChart(true)
            
            // Build filter: if intake is selected, pass it as 'course'
            // If class is selected (not 'all'), it takes priority
            let courseFilter = undefined;
            if (selectedCourse !== 'all') {
                courseFilter = selectedCourse; // Specific class code
            } else if (selectedIntake !== 'all') {
                courseFilter = selectedIntake; // Intake (K28, K29, etc.)
            }
            
            const filters: TeacherDashboardFilterDto = {
                academicYear: selectedYear !== 'all' ? selectedYear : undefined,
                semester: selectedSemester,
                faculty: selectedFaculty !== 'all' ? selectedFaculty : undefined,
                course: courseFilter,
            }
            
            const data = await teacherDashboardService.getDashboardStats(filters)
            setChartData(data)
        } catch (err: any) {
            toast.error(t('dashboard.errorLoadingData'))
        } finally {
            setLoadingChart(false)
        }
    }

    const handleRefresh = async () => {
        await fetchKPIData()
        await fetchChartData()
        toast.success(t('dashboard.refreshSuccess'))
    }

    // KPI stats (no filters)
    const kpiStats = kpiData?.stats || {
        totalStudents: 0,
        totalClasses: 0,
        atRiskPercentage: 0,
        atRiskCount: 0,
        gradeDistribution: { low: 0, medium: 0, high: 0 },
        averageGPA: 0,
        medianGPA: 0,
        minGPA: 0,
    }

    // Chart stats (with filters)
    const chartStats = chartData?.stats || kpiStats
    const atRiskStudents = chartData?.atRiskStudents || []

    // Render different chart based on view type
    const renderChart = () => {
        // Get current date for date range calculation
        const getCurrentDateRange = () => {
            const now = new Date();
            if (chartView === 'weekly') {
                const startOfWeek = new Date(now);
                startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
                return `${startOfWeek.getDate()}/${startOfWeek.getMonth() + 1} - ${endOfWeek.getDate()}/${endOfWeek.getMonth() + 1}`;
            } else if (chartView === 'monthly') {
                return `Tháng ${now.getMonth() + 1}/${now.getFullYear()}`;
            } else {
                return `Năm ${now.getFullYear()}`;
            }
        };

        // Get chart label based on view type
        const getChartLabel = () => {
            const dateRange = getCurrentDateRange();
            switch (chartView) {
                case "weekly": return `${t('dashboard.week')} (${dateRange})`;
                case "monthly": return `${t('dashboard.month')} (${dateRange})`;
                case "yearly": return `${t('dashboard.year')} (${dateRange})`;
                default: return t('dashboard.week');
            }
        };

        // Get data points and x-axis labels based on view type
        const getChartData = () => {
            switch (chartView) {
                case "weekly":
                    return {
                        data: [65, 72, 68, 75, 78, 82, 85],
                        labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
                    };
                case "monthly":
                    return {
                        data: [68, 82, 75, 88],
                        labels: ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4']
                    };
                case "yearly":
                    return {
                        data: [70, 78, 73, 85, 80, 88, 75, 90, 82, 87, 79, 91],
                        labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12']
                    };
                default:
                    return {
                        data: [65, 72, 68, 75, 78, 82, 85],
                        labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
                    };
            }
        };

        const chartData = getChartData();

        switch (chartView) {
            case "weekly":
                return (
                    <div className="h-full flex flex-col">
                        {/* Y-axis label */}
                        <div className="text-xs text-gray-500 mb-2 px-6">
                            <span className="font-medium">% học tập trong hệ thống</span>
                            <span className="text-gray-400 ml-2">(Hoạt động học tập: làm quiz, bài tập, tham gia khóa học)</span>
                        </div>

                        {/* Line Chart - Progress Over Time */}
                        <div className="flex-1 relative px-6 py-4">
                            {/* Grid lines */}
                            <div className="absolute inset-0 flex flex-col justify-between px-6 py-4">
                                {[100, 75, 50, 25, 0].map((val, idx) => (
                                    <div key={idx} className="flex items-center border-b border-gray-200">
                                        <span className="text-xs text-gray-400 w-8 -ml-8">{val}%</span>
                                    </div>
                                ))}
                            </div>

                            {/* Line and dots */}
                            <svg className="w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="none">
                                {/* Line path */}
                                <polyline
                                    fill="none"
                                    stroke="#3b82f6"
                                    strokeWidth="3"
                                    points={chartData.data.map((val, idx) => {
                                        const x = (idx / (chartData.data.length - 1)) * 600;
                                        const y = 200 - (val * 2);
                                        return `${x},${y}`;
                                    }).join(' ')}
                                />
                                
                                {/* Gradient fill */}
                                <defs>
                                    <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
                                    </linearGradient>
                                </defs>
                                <polygon
                                    fill="url(#gradient)"
                                    points={`0,200 ${chartData.data.map((val, idx) => {
                                        const x = (idx / (chartData.data.length - 1)) * 600;
                                        const y = 200 - (val * 2);
                                        return `${x},${y}`;
                                    }).join(' ')} 600,200`}
                                />
                            </svg>

                            {/* Data point markers with hover info */}
                            <div className="absolute inset-0 flex items-end justify-around px-6 pb-4">
                                {chartData.data.map((val, idx) => (
                                    <div key={idx} className="relative group" style={{ bottom: `${val * 2}px` }}>
                                        <div className="w-3 h-3 bg-blue-600 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-150 transition-transform"></div>
                                        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                            {val}%
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* X-axis labels */}
                        <div className="flex justify-around px-6 pb-1">
                            {chartData.labels.map((label, idx) => (
                                <span key={idx} className="text-xs text-gray-500">
                                    {label}
                                </span>
                            ))}
                        </div>
                        
                        <p className="text-center text-xs text-gray-500 mt-0.5 font-medium">{getChartLabel()}</p>
                    </div>
                )

            case "monthly":
            case "yearly":
                return (
                    <div className="h-full flex flex-col">
                        {/* Y-axis label */}
                        <div className="text-xs text-gray-500 mb-2 px-6">
                            <span className="font-medium">% học tập trong hệ thống</span>
                            <span className="text-gray-400 ml-2">(Hoạt động học tập: làm quiz, bài tập, tham gia khóa học)</span>
                        </div>

                        {/* Column Chart - Progress Over Time */}
                        <div className="flex-1 relative px-6 py-4">
                            {/* Grid lines */}
                            <div className="absolute inset-0 flex flex-col justify-between px-6 py-4">
                                {[100, 75, 50, 25, 0].map((val, idx) => (
                                    <div key={idx} className="flex items-center border-b border-gray-200">
                                        <span className="text-xs text-gray-400 w-8 -ml-8">{val}%</span>
                                    </div>
                                ))}
                            </div>

                            {/* Column bars */}
                            <div className="absolute inset-0 flex items-end justify-around px-6 py-4 gap-2">
                                {chartData.data.map((val, idx) => (
                                    <div key={idx} className="relative group flex-1 flex flex-col justify-end" style={{ height: '100%' }}>
                                        <div 
                                            className="bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all duration-300 hover:from-blue-700 hover:to-blue-500 cursor-pointer"
                                            style={{ height: `${val}%` }}
                                        >
                                            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                                {val}%
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* X-axis labels */}
                        <div className="flex justify-around px-6 pb-1">
                            {chartData.labels.map((label, idx) => (
                                <span key={idx} className="text-xs text-gray-500">
                                    {label}
                                </span>
                            ))}
                        </div>
                        
                        <p className="text-center text-xs text-gray-500 mt-0.5 font-medium">{getChartLabel()}</p>
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
                                <span className="text-gray-600">{t('dashboard.averageScore')}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <div className="w-3 h-3 bg-red-500 rounded"></div>
                                <span className="text-gray-600">{t('dashboard.warningPercent')}</span>
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
                        <p className="text-center text-xs text-gray-500 mt-2">{t('dashboard.attendanceRate')}</p>
                    </div>
                )

            case "performance":
                return (
                    <div className="h-full flex flex-col">
                        {/* Multi-line Performance Trend */}
                        <div className="flex items-center justify-center space-x-4 mb-3 text-xs">
                            <div className="flex items-center space-x-1">
                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                <span className="text-gray-600">{t('dashboard.avgScore')}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span className="text-gray-600">{t('dashboard.attendanceLabel')}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                <span className="text-gray-600">{t('dashboard.warning')}</span>
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
                        <p className="text-center text-xs text-gray-500">{t('dashboard.trend5Months')}</p>
                    </div>
                )

            default:
                return null
        }
    }

    return (
        <TeacherLayout currentPage="dashboard">
            <Toaster position="top-right" />
            
            {/* Page Header */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6 rounded-xl shadow-lg mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold mb-2">{t('dashboard.title')}</h2>
                        <p className="text-blue-100">{t('dashboard.subtitle')}</p>
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={loadingKPI || loadingChart}
                        className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all border border-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Refresh dashboard"
                    >
                        <RefreshCw className={`w-5 h-5 ${(loadingKPI || loadingChart) ? 'animate-spin' : ''}`} />
                        <span>{t('dashboard.refresh')}</span>
                    </button>
                </div>
            </div>

            {/* Stats Cards - Top 3 KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-blue-700 mb-1">{t('dashboard.totalStudents')}</p>
                                {loadingKPI ? (
                                    <div className="h-9 w-20 bg-blue-200 animate-pulse rounded"></div>
                                ) : (
                                    <>
                                        <p className="text-3xl font-bold text-blue-600">{kpiStats.totalStudents}</p>
                                        <p className="text-sm text-blue-600 mt-1">{t('dashboard.studyingStatus')}</p>
                                    </>
                                )}
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <i className="fas fa-user-graduate text-blue-600 text-xl"></i>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-green-700 mb-1">{t('dashboard.totalClasses')}</p>
                                {loadingKPI ? (
                                    <div className="h-9 w-20 bg-green-200 animate-pulse rounded"></div>
                                ) : (
                                    <>
                                        <p className="text-3xl font-bold text-green-600">{kpiStats.totalClasses}</p>
                                        <p className="text-sm text-green-600 mt-1">{t('dashboard.activeStatus')}</p>
                                    </>
                                )}
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <i className="fas fa-book-open text-green-600 text-xl"></i>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-red-700 mb-1">{t('dashboard.atRiskPercentage')}</p>
                                {loadingKPI ? (
                                    <div className="h-9 w-20 bg-red-200 animate-pulse rounded"></div>
                                ) : (
                                    <>
                                        <p className="text-3xl font-bold text-red-600">{kpiStats.atRiskCount}</p>
                                        <p className="text-sm text-red-600 mt-1">{t('dashboard.students')}</p>
                                    </>
                                )}
                            </div>
                            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                <i className="fas fa-exclamation-triangle text-red-600 text-xl"></i>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* GPA Distribution Section */}
            <Card className="mb-6">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.gradeDistribution')}</h3>
                            <p className="text-sm text-gray-500">{t('dashboard.gradeDistributionDesc')}</p>
                        </div>
                    </div>

                    {loadingKPI ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="h-24 bg-gray-200 animate-pulse rounded-lg"></div>
                            <div className="h-24 bg-gray-200 animate-pulse rounded-lg"></div>
                            <div className="h-24 bg-gray-200 animate-pulse rounded-lg"></div>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                                {/* Low GPA */}
                                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                            <span className="text-sm font-medium text-red-700">{t('dashboard.lowGPA')}</span>
                                        </div>
                                        <div className="text-2xl font-bold text-red-600">
                                            {kpiStats.gradeDistribution.low}
                                        </div>
                                    </div>
                                    <div className="w-full bg-red-200 rounded-full h-2.5 mb-2">
                                        <div 
                                            className="bg-red-500 h-2.5 rounded-full transition-all duration-500" 
                                            style={{ width: `${kpiStats.totalStudents > 0 ? (kpiStats.gradeDistribution.low / kpiStats.totalStudents) * 100 : 0}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-sm text-red-600 font-medium">
                                        {kpiStats.totalStudents > 0 ? ((kpiStats.gradeDistribution.low / kpiStats.totalStudents) * 100).toFixed(1) : 0}%
                                    </p>
                                </div>

                                {/* Medium GPA */}
                                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                            <span className="text-sm font-medium text-yellow-700">{t('dashboard.mediumGPA')}</span>
                                        </div>
                                        <div className="text-2xl font-bold text-yellow-700">
                                            {kpiStats.gradeDistribution.medium}
                                        </div>
                                    </div>
                                    <div className="w-full bg-yellow-200 rounded-full h-2.5 mb-2">
                                        <div 
                                            className="bg-yellow-500 h-2.5 rounded-full transition-all duration-500" 
                                            style={{ width: `${kpiStats.totalStudents > 0 ? (kpiStats.gradeDistribution.medium / kpiStats.totalStudents) * 100 : 0}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-sm text-yellow-700 font-medium">
                                        {kpiStats.totalStudents > 0 ? ((kpiStats.gradeDistribution.medium / kpiStats.totalStudents) * 100).toFixed(1) : 0}%
                                    </p>
                                </div>

                                {/* High GPA */}
                                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                            <span className="text-sm font-medium text-green-700">{t('dashboard.highGPA')}</span>
                                        </div>
                                        <div className="text-2xl font-bold text-green-600">
                                            {kpiStats.gradeDistribution.high}
                                        </div>
                                    </div>
                                    <div className="w-full bg-green-200 rounded-full h-2.5 mb-2">
                                        <div 
                                            className="bg-green-500 h-2.5 rounded-full transition-all duration-500" 
                                            style={{ width: `${kpiStats.totalStudents > 0 ? (kpiStats.gradeDistribution.high / kpiStats.totalStudents) * 100 : 0}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-sm text-green-600 font-medium">
                                        {kpiStats.totalStudents > 0 ? ((kpiStats.gradeDistribution.high / kpiStats.totalStudents) * 100).toFixed(1) : 0}%
                                    </p>
                                </div>
                            </div>

                            {/* Summary Stats */}
                            <div className="flex items-center justify-center space-x-8 text-sm pt-4 border-t border-gray-200">
                                <div className="text-center">
                                    <p className="text-gray-500 mb-1">{t('dashboard.lowestGPA')}</p>
                                    <p className="text-xl font-bold text-gray-900">{kpiStats.minGPA.toFixed(2)}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-gray-500 mb-1">{t('dashboard.averageGPA')}</p>
                                    <p className="text-xl font-bold text-blue-600">{kpiStats.averageGPA.toFixed(2)}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-gray-500 mb-1">{t('dashboard.highestGPA')}</p>
                                    <p className="text-xl font-bold text-gray-900">{(kpiStats as any).maxGPA?.toFixed(2) || kpiStats.averageGPA.toFixed(2)}</p>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Chart and At-Risk Students */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Progress Chart */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <div className="flex flex-col space-y-3">
                            <div className="flex items-center justify-between">
                                <CardTitle>{t('dashboard.progressTitle')}</CardTitle>
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{chartStats.totalStudents} {t('dashboard.students')}</span>
                            </div>

                            {/* Multi-level Filters - Reordered: School > Intake > Class > Semester > Year + Reset */}
                            <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                                {/* School Filter */}
                                <select
                                    className="bg-gray-100 border border-gray-300 rounded-lg px-3 py-1.5 text-xs cursor-pointer"
                                    value={selectedFaculty}
                                    onChange={(e) => setSelectedFaculty(e.target.value)}
                                    disabled={loadingFilters}
                                >
                                    <option value="all">{t('dashboard.allSchools')}</option>
                                    {filterOptions.faculties.filter((f: string) => f !== 'Tất cả').map((faculty: string, idx: number) => (
                                        <option key={idx} value={faculty}>{faculty}</option>
                                    ))}
                                </select>

                                {/* Intake/Cohort Filter */}
                                <select
                                    className="bg-gray-100 border border-gray-300 rounded-lg px-3 py-1.5 text-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    value={selectedIntake}
                                    onChange={(e) => setSelectedIntake(e.target.value)}
                                    disabled={loadingFilters || selectedFaculty === 'all'}
                                >
                                    <option value="all">{t('dashboard.allIntakes')}</option>
                                    {filteredIntakes.map((course: string, idx: number) => (
                                        <option key={idx} value={course}>{course}</option>
                                    ))}
                                </select>

                                {/* Class Filter */}
                                <select
                                    className="bg-gray-100 border border-gray-300 rounded-lg px-3 py-1.5 text-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    value={selectedCourse}
                                    onChange={(e) => setSelectedCourse(e.target.value)}
                                    disabled={loadingFilters || selectedFaculty === 'all' || selectedIntake === 'all'}
                                >
                                    <option value="all">{t('dashboard.allCourses')}</option>
                                    {filteredClasses.map((cls: any, idx: number) => (
                                        <option key={idx} value={cls.code}>{cls.code} - {cls.program}</option>
                                    ))}
                                </select>

                                {/* Semester Filter */}
                                <select
                                    className="bg-gray-100 border border-gray-300 rounded-lg px-3 py-1.5 text-xs cursor-pointer"
                                    value={selectedSemester}
                                    onChange={(e) => setSelectedSemester(Number(e.target.value))}
                                    disabled={loadingFilters}
                                >
                                    {filterOptions.semesters.map((semester: number) => (
                                        <option key={semester} value={semester}>
                                            {semester === 1 ? t('dashboard.semester1') : t('dashboard.semester2')}
                                        </option>
                                    ))}
                                </select>

                                {/* Year Filter */}
                                <select
                                    className="bg-gray-100 border border-gray-300 rounded-lg px-3 py-1.5 text-xs cursor-pointer"
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                    disabled={loadingFilters}
                                >
                                    {filterOptions.academicYears.map((year: string) => (
                                        <option key={year} value={year}>
                                            {year}
                                        </option>
                                    ))}
                                </select>

                                {/* Reset Button */}
                                <button
                                    onClick={() => {
                                        setSelectedFaculty("all")
                                        setSelectedIntake("all")
                                        setSelectedCourse("all")
                                        setSelectedSemester(filterOptions.semesters[0] || 1)
                                        setSelectedYear(filterOptions.academicYears[0] || "2024-2025")
                                    }}
                                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 border border-gray-300 rounded-lg px-1.5 py-1.5 text-xs font-medium transition-colors w-20 cursor-pointer"
                                >
                                    🔄 {t('dashboard.reset')}
                                </button>
                            </div>

                            {/* View Type Selector */}
                            <div className="flex items-center space-x-2 pt-2">
                                <span className="text-xs text-gray-600 font-medium">{t('dashboard.chartType')}</span>
                                <select
                                    className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-medium cursor-pointer"
                                    value={chartView}
                                    onChange={(e) => setChartView(e.target.value)}
                                >
                                    <option value="weekly">📈 {t('dashboard.weekly')}</option>
                                    <option value="monthly">📉 {t('dashboard.monthly')}</option>
                                    <option value="yearly">📊 {t('dashboard.yearly')}</option>
                                </select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Chart Container - Dynamic based on view */}
                        <div className="h-80 w-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 relative">
                            {renderChart()}
                        </div>

                        {/* Quick Stats Summary */}
                        <div className="grid grid-cols-4 gap-3 mt-4 pt-4">
                        </div>
                    </CardContent>
                </Card>

                {/* At-Risk Students */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>{t('dashboard.studentConcern')}</CardTitle>
                            <Badge className="text-xs bg-red-100 text-red-800">{chartStats.atRiskCount} {t('dashboard.students')}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {loadingChart ? (
                            <div className="space-y-3">
                                <div className="h-20 bg-gray-200 animate-pulse rounded-lg"></div>
                                <div className="h-20 bg-gray-200 animate-pulse rounded-lg"></div>
                                <div className="h-20 bg-gray-200 animate-pulse rounded-lg"></div>
                                <div className="h-20 bg-gray-200 animate-pulse rounded-lg"></div>
                            </div>
                        ) : atRiskStudents && atRiskStudents.length > 0 ? (
                            <>
                                {atRiskStudents.slice(0, 4).map((student, idx) => {
                                    // New logic: GPA >= 2.0 = yellow (Theo dõi), GPA < 2.0 = red (Cần theo dõi)
                                    const isHighRisk = student.gpa < 2.0;
                                    const colors = isHighRisk 
                                        ? { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-600', text: 'text-red-600' }
                                        : { bg: 'bg-yellow-50', border: 'border-yellow-200', badge: 'bg-yellow-500', text: 'text-yellow-600' };
                                    const label = isHighRisk ? t('dashboard.needMonitoring') : t('dashboard.monitoring');
                                    
                                    return (
                                        <div key={idx} className={`${colors.bg} border ${colors.border} rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer`}>
                                            <div className="flex items-center space-x-3">
                                                <img 
                                                    src={student.avatar || imgStudent} 
                                                    alt={student.name} 
                                                    className={`w-10 h-10 rounded-full flex-shrink-0 border-2 ${colors.border}`} 
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <p className="font-medium text-gray-900">{student.name}</p>
                                                        <Badge className={`text-xs ${colors.badge} text-white`}>
                                                            {label}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-gray-600">{student.studentCode} - {student.class}</p>
                                                    <div className="flex items-center space-x-3 mt-1">
                                                        <span className={`text-xs ${colors.text}`}>📊 GPA: {student.gpa.toFixed(2)}</span>
                                                        <span className={`text-xs ${colors.text}`}>❌ {t('dashboard.absent')}: {student.absences}/12</span>
                                                        <span className={`text-xs ${colors.text}`}>📚 {t('dashboard.debt')}: {student.debtCourses} {t('dashboard.courses')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                
                                <Button
                                    className="w-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center space-x-2"
                                    onClick={() => navigate('/teacher/reports-alerts?filter=high-risk')}
                                >
                                    <span>{t('dashboard.viewAllAtRisk')}</span>
                                    <i className="fas fa-arrow-right text-sm"></i>
                                </Button>
                            </>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <i className="fas fa-check-circle text-4xl text-green-500 mb-2"></i>
                                <p className="text-sm">{t('dashboard.noStudentConcern')}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Class Management Table */}
        </TeacherLayout>
    )
}
