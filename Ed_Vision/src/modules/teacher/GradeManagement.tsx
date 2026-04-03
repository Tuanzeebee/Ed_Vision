import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/teacher/teacher_badge"
import TeacherLayout from "./components/TeacherLayout"
import predictionService from "@/services/predictionService"
import {
    Download,
    Upload,
    FileText,
    X,
    Check,
    Loader2,
    RefreshCcw,
    ChevronDown,
    ChevronUp
} from "lucide-react"

// Types
interface GradeColumn {
    id: string
    name: string
    maxScore: number
    weight: number
}

interface Student {
    id: string
    studentId: string
    name: string
    full_name?: string // Họ tên từ Profile (chỉ có khi has_survey_data = true)
    grades: { [key: string]: number }
    // MongoDB data fields
    has_survey_data?: boolean
    weekly_study_hours_by_course?: number | null
    part_time_hours_by_course?: number | null
    financial_support_by_course?: number | null
    emotional_support_by_course?: number | null
    final_pred?: number | null
    confidence?: 'high' | 'medium' | 'low' | null
}

interface GradeStructureColumn {
    name: string
    key: string
    maxScore: number
    weight: number
}

interface PassThresholdData {
    currentScore: number
    finalWeightNeeded: number
    finalScoreNeeded: number
    isPassing: boolean
    canPass: boolean
}

export default function GradeManagement() {
    const { t } = useTranslation('teacher')
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [selectedDepartment, setSelectedDepartment] = useState("")
    const [selectedCourse, setSelectedCourse] = useState("")
    const [selectedSubject, setSelectedSubject] = useState("")
    const [selectedClass, setSelectedClass] = useState("")

    // Grade table states
    const [gradeColumns, setGradeColumns] = useState<GradeColumn[]>([])
    const [students, setStudents] = useState<Student[]>([])
    const [classListLoaded, setClassListLoaded] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)

    // MongoDB data states
    const [uploadHistory, setUploadHistory] = useState<any[]>([])
    const [selectedUploadId, setSelectedUploadId] = useState<string>('')
    const [loadingData, setLoadingData] = useState(false)
    const [mongoDataLoaded, setMongoDataLoaded] = useState(false)
    
    // Hierarchical selection states
    const [selectedCourseCode, setSelectedCourseCode] = useState<string>('')
    const [selectedClassCode, setSelectedClassCode] = useState<string>('')

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1)
    const [studentsPerPage] = useState(10)

    // Modal states
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
    const [passThresholdData, setPassThresholdData] = useState<PassThresholdData | null>(null)
    const [gradeStructureColumns, setGradeStructureColumns] = useState<GradeStructureColumn[]>([])
    const [showGradeStructure, setShowGradeStructure] = useState(false)

    // Pass threshold data for all students
    const [allPassThresholdData, setAllPassThresholdData] = useState<Map<string, PassThresholdData>>(new Map())

    // Notification state
    const [notification, setNotification] = useState<{
        type: 'success' | 'error' | 'info'
        message: string
        show: boolean
    }>({
        type: 'info',
        message: '',
        show: false
    })

    // Load upload history on mount
    useEffect(() => {
        loadUploadHistory()
    }, [])

    // Load upload history from MongoDB
    const loadUploadHistory = useCallback(async () => {
        try {
            const response = await predictionService.getUploadList()
            if (response.success && response.data) {
                console.log('Upload history loaded:', response.data) // Debug log
                setUploadHistory(response.data)
            }
        } catch (error) {
            console.error('Failed to load upload history:', error)
        }
    }, [])

    // Load students from MongoDB by upload_id
    const loadStudentsFromMongo = useCallback(async (uploadId: string) => {
        setLoadingData(true)
        setCurrentPage(1) // Reset to first page when loading new data
        try {
            const response = await predictionService.getStudentsByUploadId(uploadId)
            
            if (response.success && response.data) {
                // Map MongoDB data to Student interface asynchronously
                const mappedStudents: Student[] = await Promise.all(
                    response.data.students.map(async (student: any, index: number) => ({
                        id: student.student_id || `student-${index}`,
                        studentId: student.student_id,
                        name: student.student_name || `Sinh viên ${index + 1}`,
                        full_name: student.full_name, // Họ tên từ Profile
                        grades: student.grades || {},
                        has_survey_data: student.has_survey_data,
                        weekly_study_hours_by_course: student.weekly_study_hours_by_course,
                        part_time_hours_by_course: student.part_time_hours_by_course,
                        financial_support_by_course: student.financial_support_by_course,
                        emotional_support_by_course: student.emotional_support_by_course,
                        final_pred: student.final_pred,
                        confidence: student.confidence
                    }))
                )

                setStudents(mappedStudents)
                setSelectedUploadId(uploadId)
                setMongoDataLoaded(true)
                setClassListLoaded(true)
                
                // Auto-detect grade columns from first student
                if (mappedStudents.length > 0) {
                    const firstStudent = mappedStudents[0]
                    const detectedColumns = Object.keys(firstStudent.grades).map((key) => ({
                        id: key,
                        name: key.charAt(0).toUpperCase() + key.slice(1),
                        maxScore: 10,
                        weight: 100 / Object.keys(firstStudent.grades).length
                    }))
                    setGradeColumns(detectedColumns)
                }

                // Fetch pass threshold data for all students
                try {
                    const thresholdResponse = await predictionService.getPassThreshold(uploadId)
                    if (thresholdResponse.success && thresholdResponse.data) {
                        const thresholdMap = new Map<string, PassThresholdData>()
                        thresholdResponse.data.students.forEach((studentData: any) => {
                            thresholdMap.set(studentData.student_id, {
                                currentScore: studentData.currentScore,
                                finalWeightNeeded: studentData.finalWeightNeeded,
                                finalScoreNeeded: studentData.finalScoreNeeded,
                                isPassing: studentData.isPassing,
                                canPass: studentData.canPass
                            })
                        })
                        setAllPassThresholdData(thresholdMap)
                        
                        // Set grade structure columns
                        if (thresholdResponse.data.gradeStructure?.columns) {
                            setGradeStructureColumns(thresholdResponse.data.gradeStructure.columns)
                        }
                    }
                } catch (error) {
                    console.error('Failed to load pass threshold data:', error)
                }

                showNotification('success', t('gradeManagement.studentsLoaded', { count: mappedStudents.length }))
            }
        } catch (error: any) {
            showNotification('error', t('gradeManagement.cannotLoadData'))
        } finally {
            setLoadingData(false)
        }
    }, [])

    // Group uploads by course_code
    const groupedByCourse = useMemo(() => {
        const grouped: Record<string, any[]> = {}
        uploadHistory.forEach(upload => {
            const courseCode = upload.course_code
            if (!grouped[courseCode]) {
                grouped[courseCode] = []
            }
            grouped[courseCode].push(upload)
        })
        return grouped
    }, [uploadHistory])

    // Get unique semesters and academic years from upload history
    const availableSemesters = useMemo(() => {
        const semesters = new Set<string>()
        uploadHistory.forEach(upload => {
            if (upload.semester) {
                semesters.add(upload.semester)
            }
        })
        return Array.from(semesters).sort()
    }, [uploadHistory])

    const availableAcademicYears = useMemo(() => {
        const years = new Set<string>()
        uploadHistory.forEach(upload => {
            if (upload.academic_year) {
                years.add(upload.academic_year)
            }
        })
        return Array.from(years).sort().reverse() // Newest first
    }, [uploadHistory])

    // Filtered uploads based on semester and academic year
    const filteredUploadHistory = useMemo(() => {
        let filtered = uploadHistory

        // Filter by semester
        if (selectedCourse) {
            filtered = filtered.filter(upload => upload.semester === selectedCourse)
        }

        // Filter by academic year
        if (selectedSubject) {
            filtered = filtered.filter(upload => upload.academic_year === selectedSubject)
        }

        return filtered
    }, [uploadHistory, selectedCourse, selectedSubject])

    // Group filtered uploads by course_code
    const filteredGroupedByCourse = useMemo(() => {
        const grouped: Record<string, any[]> = {}
        filteredUploadHistory.forEach(upload => {
            const courseCode = upload.course_code
            if (!grouped[courseCode]) {
                grouped[courseCode] = []
            }
            grouped[courseCode].push(upload)
        })
        return grouped
    }, [filteredUploadHistory])

    // Get class codes for selected course (from filtered data)
    const classCodesForSelectedCourse = useMemo(() => {
        if (!selectedCourseCode) return []
        return filteredGroupedByCourse[selectedCourseCode] || []
    }, [selectedCourseCode, filteredGroupedByCourse])

    // Handle course selection
    const handleSelectCourse = useCallback((courseCode: string) => {
        if (selectedCourseCode === courseCode) {
            // Toggle off if clicking the same course
            setSelectedCourseCode('')
            setSelectedClassCode('')
            setSelectedUploadId('')
            setStudents([])
            setMongoDataLoaded(false)
        } else {
            setSelectedCourseCode(courseCode)
            setSelectedClassCode('')
            setSelectedUploadId('')
            setStudents([])
            setMongoDataLoaded(false)
        }
    }, [selectedCourseCode])

    // Handle class selection
    const handleSelectClass = useCallback((upload: any) => {
        setSelectedClassCode(upload.class_code)
        loadStudentsFromMongo(upload._id)
    }, [loadStudentsFromMongo])

    // Pagination calculations with useMemo
    const { currentStudents, totalPages, indexOfFirstStudent, indexOfLastStudent } = useMemo(() => {
        const indexOfLast = currentPage * studentsPerPage
        const indexOfFirst = indexOfLast - studentsPerPage
        const current = students.slice(indexOfFirst, indexOfLast)
        const total = Math.ceil(students.length / studentsPerPage)
        
        return {
            currentStudents: current,
            totalPages: total,
            indexOfFirstStudent: indexOfFirst,
            indexOfLastStudent: indexOfLast
        }
    }, [students, currentPage, studentsPerPage])

    const handlePageChange = useCallback((pageNumber: number) => {
        setCurrentPage(pageNumber)
    }, [])

    // Get prediction category
    const getPredictionCategory = (prediction: number | null | undefined) => {
        if (prediction === null || prediction === undefined) return null
        if (prediction >= 5.0) return 'pass'
        if (prediction >= 4.0) return 'warning'
        return 'fail'
    }

    // Get category badge
    const getCategoryBadge = (category: string | null) => {
        if (!category) return null
        
        switch(category) {
            case 'pass':
                return (
                    <Badge className="bg-green-100 text-green-800 border border-green-300 text-xs px-2 py-1 whitespace-nowrap inline-flex items-center justify-center">
                         Pass
                    </Badge>
                )
            case 'warning':
                return (
                    <Badge className="bg-amber-100 text-amber-800 border border-amber-300 text-xs px-2 py-1 whitespace-nowrap inline-flex items-center justify-center">
                         Warning
                    </Badge>
                )
            case 'fail':
                return (
                    <Badge className="bg-red-100 text-red-800 border border-red-300 text-xs px-2 py-1 whitespace-nowrap inline-flex items-center justify-center">
                         Fail
                    </Badge>
                )
            default:
                return null
        }
    }

    // Handle student detail click
    const handleStudentClick = async (student: Student) => {
        setSelectedStudent(student)
        setShowDetailModal(true)
        
        // Fetch pass threshold data
        if (selectedUploadId) {
            try {
                const response = await predictionService.getPassThreshold(selectedUploadId)
                if (response.success && response.data) {
                    // Find threshold data for this student
                    const studentThreshold = response.data.students.find(
                        (s: any) => s.student_id === student.studentId
                    )
                    
                    if (studentThreshold) {
                        setPassThresholdData(studentThreshold)
                    }
                    
                    // Set grade structure
                    if (response.data.gradeStructure?.columns) {
                        setGradeStructureColumns(response.data.gradeStructure.columns)
                    }
                }
            } catch (error) {
                console.error('Failed to load pass threshold:', error)
            }
        }
    }

    // Close modal
    const handleCloseModal = () => {
        setShowDetailModal(false)
        setSelectedStudent(null)
        setPassThresholdData(null)
        setGradeStructureColumns([])
        setShowGradeStructure(false)
    }

    // Utility functions
    const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
        setNotification({ type, message, show: true })
        setTimeout(() => {
            setNotification(prev => ({ ...prev, show: false }))
        }, 3000)
    }

    const generateSampleStudents = () => {
        const sampleStudents: Student[] = [
            { id: '1', studentId: '2024001', name: 'Nguyễn Văn An', grades: {} },
            { id: '2', studentId: '2024002', name: 'Trần Thị Bình', grades: {} },
            { id: '3', studentId: '2024003', name: 'Lê Văn Cường', grades: {} },
            { id: '4', studentId: '2024004', name: 'Phạm Thị Dung', grades: {} },
            { id: '5', studentId: '2024005', name: 'Hoàng Văn Em', grades: {} },
            { id: '6', studentId: '2024006', name: 'Vũ Thị Giang', grades: {} },
            { id: '7', studentId: '2024007', name: 'Đặng Văn Hải', grades: {} },
            { id: '8', studentId: '2024008', name: 'Bùi Thị Linh', grades: {} },
            { id: '9', studentId: '2024009', name: 'Trương Văn Minh', grades: {} },
            { id: '10', studentId: '2024010', name: 'Phan Thị Nga', grades: {} }
        ]
        setStudents(sampleStudents)
    }

    const handleLoadClassList = () => {
        if (!selectedClass) {
            showNotification('error', 'Vui lòng chọn lớp học trước!')
            return
        }

        setClassListLoaded(true)
        generateSampleStudents()
        showNotification('success', `Đã tải danh sách lớp ${selectedClass} thành công!`)
    }

    const handleSelectExcel = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            setSelectedFile(file)
            showNotification('success', `Đã chọn file: ${file.name}`)
        }
    }

    const handleUploadGrades = () => {
        if (!selectedFile) {
            showNotification('error', 'Vui lòng chọn file Excel trước!')
            return
        }

        if (!classListLoaded) {
            showNotification('error', 'Vui lòng tải danh sách lớp trước!')
            return
        }

        // Simulate upload process
        showNotification('info', 'Đang upload điểm...')
        setTimeout(() => {
            showNotification('success', 'Upload điểm thành công!')
        }, 2000)
    }

    const handleExportExcel = () => {
        if (gradeColumns.length === 0) {
            showNotification('error', 'Chưa có cấu trúc bảng điểm để xuất!')
            return
        }

        // Generate CSV content
        const headers = ['STT', 'Mã SV', 'Họ và tên', ...gradeColumns.map(col => col.name), 'Tổng điểm']
        const csvContent = [
            headers.join(','),
            ...students.map((student, index) => [
                index + 1,
                student.studentId,
                student.name,
                ...gradeColumns.map(col => student.grades[col.id] || ''),
                ''
            ].join(','))
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `BangDiem_${selectedClass || 'Template'}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        showNotification('success', 'Xuất file Excel thành công!')
    }

    const handleDownloadTemplate = () => {
        const templateHeaders = ['STT', 'Mã SV', 'Họ và tên', 'Điểm 1', 'Điểm 2', 'Điểm 3']
        const templateData = [
            templateHeaders.join(','),
            '1,SV001,Nguyễn Văn A,8.5,9.0,7.5',
            '2,SV002,Trần Thị B,7.0,8.5,8.0',
            '3,SV003,Lê Văn C,9.0,8.0,9.5'
        ].join('\n')

        const blob = new Blob([templateData], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', 'Template_BangDiem.csv')
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        showNotification('success', 'Tải template thành công!')
    }

    return (
        <>
            <TeacherLayout currentPage="grade-management">
            {/* Hidden File Input */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx,.xls,.csv"
                className="hidden"
            />

            {/* Notification Toast */}
            {notification.show && (
                <div className={`fixed top-24 right-6 z-50 px-6 py-3 rounded-lg shadow-lg transition-all duration-300 ${notification.type === 'success' ? 'bg-green-500 text-white' :
                    notification.type === 'error' ? 'bg-red-500 text-white' :
                        'bg-blue-500 text-white'
                    }`}>
                    <div className="flex items-center space-x-2">
                        {notification.type === 'success' && <Check className="w-5 h-5" />}
                        {notification.type === 'error' && <X className="w-5 h-5" />}
                        <span>{notification.message}</span>
                    </div>
                </div>
            )}

            {/* Page Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-xl shadow-lg mb-6">
                <h2 className="text-3xl font-bold mb-2">{t('gradeManagement.title')}</h2>
                <p className="text-indigo-100">{t('gradeManagement.subtitle')}</p>
            </div>

            {/* Filter Section - Prediction Data */}
            <Card className="mb-6 border border-gray-100 rounded-xl">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900">{t('gradeManagement.filterTitle')}</h3>
                        <button
                            onClick={() => {
                                setSelectedCourseCode('')
                                setSelectedClassCode('')
                                setSelectedCourse('')
                                setSelectedSubject('')
                                setSelectedUploadId('')
                                setStudents([])
                                setMongoDataLoaded(false)
                                showNotification('info', t('gradeManagement.clearFilterNotification'))
                            }}
                            className="flex items-center space-x-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
                        >
                            <X className="w-4 h-4" />
                            <span>{t('gradeManagement.clearFilter')}</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm text-gray-700 font-medium">{t('gradeManagement.subjectLabel')}</label>
                            <select
                                value={selectedCourseCode}
                                onChange={(e) => {
                                    setSelectedCourseCode(e.target.value)
                                    setSelectedClassCode('')
                                    setSelectedUploadId('')
                                    setStudents([])
                                    setMongoDataLoaded(false)
                                }}
                                className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">{t('gradeManagement.allSubjects')}</option>
                                {Object.keys(filteredGroupedByCourse).map((courseCode) => {
                                    const courseUploads = filteredGroupedByCourse[courseCode]
                                    const totalClasses = courseUploads.length
                                    return (
                                        <option key={courseCode} value={courseCode}>
                                            {courseCode} ({totalClasses} {t('gradeManagement.classesLabel')})
                                        </option>
                                    )
                                })}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-gray-700 font-medium">{t('gradeManagement.classCodeLabel')}</label>
                            <select
                                value={selectedClassCode}
                                onChange={(e) => {
                                    const classCode = e.target.value
                                    setSelectedClassCode(classCode)
                                    if (classCode) {
                                        const upload = classCodesForSelectedCourse.find(u => u.class_code === classCode)
                                        if (upload) {
                                            loadStudentsFromMongo(upload._id)
                                        }
                                    } else {
                                        setSelectedUploadId('')
                                        setStudents([])
                                        setMongoDataLoaded(false)
                                    }
                                }}
                                disabled={!selectedCourseCode}
                                className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <option value="">{t('gradeManagement.selectClassCode')}</option>
                                {classCodesForSelectedCourse.map((upload: any) => (
                                    <option key={upload._id} value={upload.class_code}>
                                        {upload.class_code} ({upload.total_students} {t('gradeManagement.studentShortLabel')})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-gray-700 font-medium">{t('gradeManagement.semesterLabel')}</label>
                            <select
                                value={selectedCourse}
                                onChange={(e) => setSelectedCourse(e.target.value)}
                                className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">{t('gradeManagement.allSemesters')}</option>
                                {availableSemesters.map((sem) => (
                                    <option key={sem} value={sem}>
                                        {t('gradeManagement.semesterFormat', { number: sem })}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-gray-700 font-medium">{t('gradeManagement.academicYearLabel')}</label>
                            <select
                                value={selectedSubject}
                                onChange={(e) => setSelectedSubject(e.target.value)}
                                className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">{t('gradeManagement.allAcademicYears')}</option>
                                {availableAcademicYears.map((year) => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Data Section from Prediction History */}
            <Card className="mb-6 border border-gray-100 rounded-xl">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">{t('gradeManagement.historyTitle')}</h3>
                            <p className="text-sm text-gray-600">{t('gradeManagement.historySubtitle')}</p>
                        </div>
                        <button
                            onClick={loadUploadHistory}
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                            <RefreshCcw className="w-4 h-4" />
                            <span>{t('gradeManagement.refresh')}</span>
                        </button>
                    </div>

                    {/* Hierarchical Course and Class Selection */}
                    {uploadHistory.length > 0 && (
                        <div className="space-y-4 mb-6">
                            {/* Step 1: Course Selection */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                                    {t('gradeManagement.step1Title')}
                                    {(selectedCourse || selectedSubject) && (
                                        <span className="ml-2 text-xs text-blue-600">
                                            {t('gradeManagement.filteringBy', { 
                                                filters: `${selectedSubject || ''}${selectedSubject && selectedCourse ? ' - ' : ''}${selectedCourse ? t('gradeManagement.semesterFormat', { number: selectedCourse }) : ''}`
                                            })}
                                        </span>
                                    )}
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {Object.keys(filteredGroupedByCourse).map((courseCode) => {
                                        const courseUploads = filteredGroupedByCourse[courseCode]
                                        const totalStudents = courseUploads.reduce((sum, u) => sum + (u.total_students || 0), 0)
                                        const totalClasses = courseUploads.length
                                        
                                        return (
                                            <div
                                                key={courseCode}
                                                onClick={() => handleSelectCourse(courseCode)}
                                                className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                                                    selectedCourseCode === courseCode
                                                        ? 'border-blue-500 bg-blue-50 shadow-md'
                                                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between mb-1">
                                                    <div className="flex-1">
                                                        <h5 className="font-bold text-base text-gray-900">{courseCode}</h5>
                                                        <p className="text-xs text-gray-500 mt-0.5">
                                                            {totalClasses} {t('gradeManagement.classesLabel')} • {totalStudents} {t('gradeManagement.studentShortLabel')}
                                                        </p>
                                                    </div>
                                                    {selectedCourseCode === courseCode && (
                                                        <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between text-sm mt-2">
                                                    <Badge className="bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5">
                                                        {t('gradeManagement.subjectBadge')}
                                                    </Badge>
                                                    {courseUploads.some(u => u.students_with_prediction > 0) && (
                                                        <Badge className="bg-green-100 text-green-800 text-xs px-2 py-0.5">
                                                            {t('gradeManagement.hasPredictionBadge')}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* No results message */}
                            {Object.keys(filteredGroupedByCourse).length === 0 && (
                                <div className="text-center py-8 px-4 bg-amber-50 border border-amber-200 rounded-lg">
                                    <p className="text-amber-800 font-medium mb-2">{t('gradeManagement.noDataFound')}</p>
                                    <p className="text-sm text-amber-600">
                                        {t('gradeManagement.noDataSuggestion')}
                                    </p>
                                </div>
                            )}

                            {/* Step 2: Class Selection */}
                            {selectedCourseCode && classCodesForSelectedCourse.length > 0 && (
                                <div className="mt-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-3">
                                        {t('gradeManagement.step2Title', { courseCode: selectedCourseCode })}
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                                        {classCodesForSelectedCourse.map((upload: any) => (
                                            <div
                                                key={upload._id}
                                                onClick={() => handleSelectClass(upload)}
                                                className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                                                    selectedUploadId === upload._id
                                                        ? 'border-green-500 bg-green-50 shadow-md'
                                                        : 'border-gray-300 hover:border-green-400 hover:bg-white bg-white'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between mb-1">
                                                    <div className="flex-1 min-w-0">
                                                        <h5 className="font-bold text-lg text-gray-900 truncate">
                                                            {upload.class_code || 'N/A'}
                                                        </h5>
                                                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                                                            {new Date(upload.upload_date).toLocaleDateString('vi-VN', {
                                                                month: 'short',
                                                                day: 'numeric'
                                                            })}
                                                        </p>
                                                    </div>
                                                    {selectedUploadId === upload._id && (
                                                        <Check className="w-4 h-4 text-green-600 flex-shrink-0 ml-1" />
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between text-xs mt-2">
                                                    <span className="text-gray-600 font-medium">
                                                        {upload.total_students} SV
                                                    </span>
                                                    {upload.students_with_prediction > 0 && (
                                                        <Badge className="bg-green-100 text-green-800 text-xs px-1.5 py-0.5">
                                                            
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {loadingData && (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
                            <span className="text-gray-600">Đang tải dữ liệu...</span>
                        </div>
                    )}

                    {/* Student List - Predicted Class Data */}
                    {mongoDataLoaded && students.length > 0 && (
                        <div className="mt-6">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-md font-bold text-gray-900">
                                    Danh sách sinh viên ({students.length})
                                </h4>
                                <div className="flex items-center space-x-3">
                                    <Badge className="bg-blue-100 text-blue-800">
                                        Lớp học đã dự đoán
                                    </Badge>
                                    <span className="text-sm text-gray-600">
                                        Trang {currentPage} / {totalPages}
                                    </span>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-semibold text-gray-700">STT</th>
                                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Mã SV</th>
                                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Họ tên</th>
                                            {gradeColumns.map(col => (
                                                <th key={col.id} className="px-4 py-3 text-left font-semibold text-gray-700">
                                                    {col.name}
                                                </th>
                                            ))}
                                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Trạng thái Behavior</th>
                                            {students.some(s => s.final_pred !== null) && (
                                                <>
                                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Dự đoán</th>
                                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Điểm cần qua</th>
                                                </>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {currentStudents.map((student, index) => {
                                            const category = getPredictionCategory(student.final_pred)
                                            const hasPrediction = student.final_pred !== null && student.final_pred !== undefined
                                            const thresholdData = allPassThresholdData.get(student.studentId)
                                            
                                            return (
                                                <tr 
                                                    key={student.id} 
                                                    onClick={() => hasPrediction && handleStudentClick(student)}
                                                    className={`hover:bg-gray-50 ${hasPrediction ? 'cursor-pointer' : ''}`}
                                                >
                                                    <td className="px-4 py-3 text-gray-700">{indexOfFirstStudent + index + 1}</td>
                                                    <td className="px-4 py-3 font-medium text-gray-900">{student.studentId}</td>
                                                    <td className="px-4 py-3 text-gray-700">
                                                        {student.has_survey_data && student.full_name ? student.full_name : student.name}
                                                    </td>
                                                    {gradeColumns.map(col => (
                                                        <td key={col.id} className="px-4 py-3 text-gray-700">
                                                            {student.grades[col.id] || '-'}
                                                        </td>
                                                    ))}
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center justify-center">
                                                            <Badge className={`text-xs px-2 py-1 whitespace-nowrap inline-flex items-center justify-center ${
                                                                student.has_survey_data
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : 'bg-amber-100 text-amber-800'
                                                            }`}>
                                                                {student.has_survey_data
                                                                    ? 'Đã khảo sát' 
                                                                    : 'Chưa khảo sát'}
                                                            </Badge>
                                                        </div>
                                                    </td>
                                                    {students.some(s => s.final_pred !== null) && (
                                                        <>
                                                            <td className="px-4 py-3">
                                                                {hasPrediction ? (
                                                                    <div className="flex items-center justify-center">
                                                                        {getCategoryBadge(category)}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-gray-400">-</span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                {thresholdData ? (
                                                                    <div className="flex items-center justify-center min-w-[80px]">
                                                                        {thresholdData.isPassing ? (
                                                                            <Badge className="bg-green-100 text-green-800 text-xs px-2 py-1 whitespace-nowrap inline-flex items-center justify-center">
                                                                                 Đã đạt
                                                                            </Badge>
                                                                        ) : thresholdData.canPass ? (
                                                                            <div className="flex flex-col items-center">
                                                                                <span className={`text-sm font-bold whitespace-nowrap ${
                                                                                    thresholdData.finalScoreNeeded > 7.0 
                                                                                        ? 'text-red-600' 
                                                                                        : 'text-amber-600'
                                                                                }`}>
                                                                                    {thresholdData.finalScoreNeeded.toFixed(2)}
                                                                                </span>
                                                                                <span className="text-xs text-gray-500 whitespace-nowrap">
                                                                                    điểm
                                                                                </span>
                                                                            </div>
                                                                        ) : (
                                                                            <Badge className="bg-red-100 text-red-800 text-xs px-2 py-1 whitespace-nowrap inline-flex items-center justify-center">
                                                                                 Không thể
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-gray-400">-</span>
                                                                )}
                                                            </td>
                                                        </>
                                                    )}
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                                    <div className="text-sm text-gray-600">
                                        Hiển thị {indexOfFirstStudent + 1} - {Math.min(indexOfLastStudent, students.length)} trong tổng số {students.length} sinh viên
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className={`px-3 py-1 rounded-lg border transition-colors ${
                                                currentPage === 1
                                                    ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                                                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                            }`}
                                        >
                                            Trước
                                        </button>
                                        
                                        <div className="flex items-center space-x-1">
                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => {
                                                // Show first page, last page, current page, and pages around current
                                                if (
                                                    pageNum === 1 ||
                                                    pageNum === totalPages ||
                                                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                                ) {
                                                    return (
                                                        <button
                                                            key={pageNum}
                                                            onClick={() => handlePageChange(pageNum)}
                                                            className={`px-3 py-1 rounded-lg transition-colors ${
                                                                currentPage === pageNum
                                                                    ? 'bg-blue-600 text-white'
                                                                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                                                            }`}
                                                        >
                                                            {pageNum}
                                                        </button>
                                                    )
                                                } else if (
                                                    pageNum === currentPage - 2 ||
                                                    pageNum === currentPage + 2
                                                ) {
                                                    return <span key={pageNum} className="px-2 text-gray-400">...</span>
                                                }
                                                return null
                                            })}
                                        </div>

                                        <button
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className={`px-3 py-1 rounded-lg border transition-colors ${
                                                currentPage === totalPages
                                                    ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                                                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                            }`}
                                        >
                                            Sau
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Grade Structure Design */}
        </TeacherLayout>

        {/* Student Detail Panel - Outside Layout */}
        {showDetailModal && selectedStudent && (
            <div className="fixed top-0 right-0 h-screen w-full max-w-md z-[9999] shadow-2xl animate-slideInRight">
                <div className="bg-white h-full overflow-y-auto border-l-4 border-indigo-600">
                        {/* Panel Header - Compact */}
                        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 z-10">
                            <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-bold mb-0.5 truncate">
                                        {selectedStudent.has_survey_data && selectedStudent.full_name ? selectedStudent.full_name : selectedStudent.name}
                                    </h3>
                                    <p className="text-xs text-indigo-100">Mã SV: {selectedStudent.studentId}</p>
                                </div>
                                <button
                                    onClick={handleCloseModal}
                                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors ml-2 flex-shrink-0"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Panel Content - Compact */}
                        <div className="p-3 space-y-3">
                            {/* Prediction Category - Compact */}
                            <div className="bg-gray-50 rounded-lg p-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-gray-700">Kết quả dự đoán:</span>
                                    {getCategoryBadge(getPredictionCategory(selectedStudent.final_pred))}
                                </div>
                            </div>

                            {/* Survey Status - Compact */}
                            <div className="bg-gray-50 rounded-lg p-3">
                                <h4 className="text-xs font-semibold text-gray-700 mb-2">Khảo sát hành vi</h4>
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-600">Trạng thái:</span>
                                        <Badge className={
                                            selectedStudent.has_survey_data
                                                ? 'bg-green-100 text-green-800 text-xs px-2 py-0.5'
                                                : 'bg-amber-100 text-amber-800 text-xs px-2 py-0.5'
                                        }>
                                            {selectedStudent.has_survey_data
                                                ? ' Đã khảo sát' 
                                                : ' Chưa'}
                                        </Badge>
                                    </div>
                                    {selectedStudent.has_survey_data && selectedStudent.weekly_study_hours_by_course !== null && (
                                        <>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-gray-500">Giờ học/tuần:</span>
                                                <span className="font-medium text-gray-700">
                                                    {selectedStudent.weekly_study_hours_by_course}h
                                                </span>
                                            </div>
                                            {selectedStudent.part_time_hours_by_course !== null && (
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-gray-500">Làm thêm/tuần:</span>
                                                    <span className="font-medium text-gray-700">
                                                        {selectedStudent.part_time_hours_by_course}h
                                                    </span>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Pass Threshold Analysis - Compact */}
                            {passThresholdData && (
                                <div className={`rounded-lg p-3 border-2 ${
                                    passThresholdData.isPassing
                                        ? 'bg-green-50 border-green-300'
                                        : passThresholdData.canPass
                                        ? 'bg-amber-50 border-amber-300'
                                        : 'bg-red-50 border-red-300'
                                }`}>
                                    <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
                                         Phân tích qua môn
                                    </h4>

                                    {/* Current Score and Final Needed - Compact */}
                                    <div className="grid grid-cols-2 gap-2 mb-2">
                                        <div className="bg-white rounded p-2 border border-gray-200">
                                            <p className="text-[10px] text-gray-500 mb-0.5">Điểm hiện tại</p>
                                            <p className="text-lg font-bold text-blue-600">
                                                {passThresholdData.currentScore.toFixed(2)}
                                            </p>
                                            <p className="text-[10px] text-gray-500">
                                                {(100 - passThresholdData.finalWeightNeeded).toFixed(0)}%
                                            </p>
                                        </div>
                                        <div className="bg-white rounded p-2 border border-gray-200">
                                            <p className="text-[10px] text-gray-500 mb-0.5">Cần đạt (Final)</p>
                                            <p className={`text-lg font-bold ${
                                                passThresholdData.isPassing
                                                    ? 'text-green-600'
                                                    : passThresholdData.canPass
                                                    ? 'text-amber-600'
                                                    : 'text-red-600'
                                            }`}>
                                                {passThresholdData.isPassing 
                                                    ? 'Đạt' 
                                                    : passThresholdData.canPass
                                                    ? passThresholdData.finalScoreNeeded.toFixed(2)
                                                    : 'X'}
                                            </p>
                                            <p className="text-[10px] text-gray-500">
                                                {passThresholdData.finalWeightNeeded.toFixed(0)}%
                                            </p>
                                        </div>
                                    </div>

                                    {/* Status Message - Compact */}
                                    <div className="bg-white rounded p-2 border border-gray-200">
                                        {passThresholdData.isPassing ? (
                                            <div className="flex items-start space-x-1.5">
                                                <span className="text-sm"></span>
                                                <div className="flex-1">
                                                    <p className="text-xs font-semibold text-green-700">
                                                        Đã đạt điểm qua môn
                                                    </p>
                                                    <p className="text-[10px] text-gray-600 mt-0.5">
                                                        Điểm hiện tại ≥ 5.0
                                                    </p>
                                                </div>
                                            </div>
                                        ) : passThresholdData.canPass ? (
                                            <div className="flex items-start space-x-1.5">
                                                <span className="text-sm"></span>
                                                <div className="flex-1">
                                                    <p className="text-xs font-semibold text-amber-700">
                                                        Cần {passThresholdData.finalScoreNeeded.toFixed(2)} điểm thi cuối
                                                    </p>
                                                    <p className="text-[10px] text-gray-600 mt-0.5">
                                                        Để đạt ≥ 5.0 tổng kết (trọng số {passThresholdData.finalWeightNeeded.toFixed(0)}%)
                                                    </p>
                                                    {passThresholdData.finalScoreNeeded > 7.0 && (
                                                        <p className="text-[10px] text-amber-700 font-medium mt-1">
                                                             Yêu cầu cao ({'>'} 7.0)
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-start space-x-1.5">
                                                <span className="text-sm"></span>
                                                <div className="flex-1">
                                                    <p className="text-xs font-semibold text-red-700">
                                                        Không thể qua môn
                                                    </p>
                                                    <p className="text-[10px] text-gray-600 mt-0.5">
                                                        Cần học lại môn này
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Grade Structure Detail - Compact */}
                                    {gradeStructureColumns.length > 0 && (
                                        <div className="mt-2">
                                            <button
                                                onClick={() => setShowGradeStructure(!showGradeStructure)}
                                                className="flex items-center justify-between w-full text-left text-xs font-semibold text-gray-700 hover:text-gray-900 transition-colors"
                                            >
                                                <span>Cấu trúc điểm</span>
                                                {showGradeStructure ? (
                                                    <ChevronUp className="w-3 h-3" />
                                                ) : (
                                                    <ChevronDown className="w-3 h-3" />
                                                )}
                                            </button>
                                            
                                            {showGradeStructure && (
                                                <div className="mt-2 bg-white rounded border border-gray-200 overflow-hidden">
                                                    <table className="w-full text-[10px]">
                                                        <thead className="bg-gray-50">
                                                            <tr>
                                                                <th className="px-2 py-1 text-left font-semibold text-gray-700">Cột</th>
                                                                <th className="px-2 py-1 text-center font-semibold text-gray-700">%</th>
                                                                <th className="px-2 py-1 text-center font-semibold text-gray-700">Max</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-200">
                                                            {gradeStructureColumns.map((col, index) => (
                                                                <tr key={index} className="hover:bg-gray-50">
                                                                    <td className="px-2 py-1 text-gray-700">{col.name}</td>
                                                                    <td className="px-2 py-1 text-center">
                                                                        <Badge className="bg-indigo-100 text-indigo-800 text-[10px] px-1.5 py-0.5">
                                                                            {col.weight}%
                                                                        </Badge>
                                                                    </td>
                                                                    <td className="px-2 py-1 text-center text-gray-700">
                                                                        {col.maxScore}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Student Grades - Compact */}
                            <div className="bg-gray-50 rounded-lg p-3">
                                <h4 className="text-xs font-semibold text-gray-700 mb-2">Điểm chi tiết</h4>
                                <div className="space-y-1">
                                    {gradeColumns.map(col => (
                                        <div key={col.id} className="flex items-center justify-between text-xs">
                                            <span className="text-gray-600">{col.name}:</span>
                                            <span className="font-medium text-gray-900">
                                                {selectedStudent.grades[col.id] || '-'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Panel Footer - Compact */}
                        <div className="sticky bottom-0 bg-gray-50 px-3 py-2 border-t border-gray-200 z-10">
                            <button
                                onClick={handleCloseModal}
                                className="w-full px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium text-sm"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}