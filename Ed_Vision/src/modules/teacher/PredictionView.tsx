import { useState, useRef } from "react"
import { Card, CardContent } from "@/components/ui/teacher/teacher_card"
import TeacherLayout from "./components/TeacherLayout"
import {
    Upload,
    FileText,
    Download,
    Brain,
    CheckCircle,
    AlertCircle,
    Users,
    Target,
    Sparkles,
    FileSpreadsheet,
    Eye,
    RefreshCw,
    BarChart3,
    Activity
} from "lucide-react"

interface UploadedFile {
    name: string
    size: number
    uploadDate: Date
    status: 'processing' | 'completed' | 'error'
    predictions?: PredictionResult[]
}

interface PredictionResult {
    studentId: string
    studentName: string
    currentGPA: number
    predictedGPA: number
    attendanceRate: number
    spiritualSupport: 'low' | 'medium' | 'high'
    materialSupport: 'low' | 'medium' | 'high'
    riskLevel: 'low' | 'medium' | 'high'
    confidence: number
    factors: string[]
    trendData?: number[] // For line chart
}

export default function PredictionView() {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
    const [isUploading, setIsUploading] = useState(false)
    const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null)
    const [dragActive, setDragActive] = useState(false)
    const [showChartModal, setShowChartModal] = useState(false)
    const [selectedStudentChart, setSelectedStudentChart] = useState<PredictionResult | null>(null)

    // Sample prediction data với cấu trúc mới
    const samplePredictions: PredictionResult[] = [
        {
            studentId: "CMU2024001",
            studentName: "Nguyễn Văn An",
            currentGPA: 3.2,
            predictedGPA: 3.5,
            attendanceRate: 85,
            spiritualSupport: 'high',
            materialSupport: 'medium',
            riskLevel: 'low',
            confidence: 85,
            factors: ["GPA tăng đều", "Tham gia tích cực", "Bài tập đầy đủ"],
            trendData: [2.8, 3.0, 3.1, 3.2, 3.3, 3.5]
        },
        {
            studentId: "CMU2024002",
            studentName: "Trần Thị Bình",
            currentGPA: 2.1,
            predictedGPA: 1.9,
            attendanceRate: 62,
            spiritualSupport: 'low',
            materialSupport: 'low',
            riskLevel: 'high',
            confidence: 78,
            factors: ["GPA giảm dần", "Vắng mặt nhiều", "Nộp bài muộn"],
            trendData: [2.5, 2.3, 2.2, 2.1, 2.0, 1.9]
        },
        {
            studentId: "CMU2024003",
            studentName: "Lê Văn Cường",
            currentGPA: 2.7,
            predictedGPA: 2.9,
            attendanceRate: 78,
            spiritualSupport: 'medium',
            materialSupport: 'high',
            riskLevel: 'medium',
            confidence: 72,
            factors: ["GPA không ổn định", "Cần cải thiện", "Tiềm năng tốt"],
            trendData: [2.6, 2.8, 2.5, 2.7, 2.8, 2.9]
        },
        {
            studentId: "CMU2024004",
            studentName: "Phạm Thị Dung",
            currentGPA: 3.8,
            predictedGPA: 3.9,
            attendanceRate: 96,
            spiritualSupport: 'high',
            materialSupport: 'high',
            riskLevel: 'low',
            confidence: 92,
            factors: ["Học tập xuất sắc", "Điểm danh đều đặn", "Tích cực tham gia"],
            trendData: [3.6, 3.7, 3.8, 3.8, 3.9, 3.9]
        },
        {
            studentId: "CMU2024005",
            studentName: "Hoàng Minh Tuấn",
            currentGPA: 2.4,
            predictedGPA: 2.6,
            attendanceRate: 71,
            spiritualSupport: 'medium',
            materialSupport: 'medium',
            riskLevel: 'medium',
            confidence: 68,
            factors: ["Tiến bộ từ từ", "Cần động viên", "Khả năng cải thiện"],
            trendData: [2.2, 2.3, 2.4, 2.4, 2.5, 2.6]
        }
    ]

    const handleFileSelect = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files
        if (files && files.length > 0) {
            handleFileUpload(files[0])
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setDragActive(false)

        const files = e.dataTransfer.files
        if (files && files.length > 0) {
            handleFileUpload(files[0])
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setDragActive(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setDragActive(false)
    }

    const handleFileUpload = async (file: File) => {
        if (!file.name.match(/\.(xlsx|xls|csv)$/)) {
            alert("Vui lòng chọn file Excel (.xlsx, .xls) hoặc CSV (.csv)")
            return
        }

        setIsUploading(true)

        const newFile: UploadedFile = {
            name: file.name,
            size: file.size,
            uploadDate: new Date(),
            status: 'processing'
        }

        setUploadedFiles(prev => [newFile, ...prev])

        // Simulate processing time
        setTimeout(() => {
            const updatedFile: UploadedFile = {
                ...newFile,
                status: 'completed',
                predictions: samplePredictions
            }

            setUploadedFiles(prev =>
                prev.map(f => f.name === newFile.name ? updatedFile : f)
            )
            setSelectedFile(updatedFile)
            setIsUploading(false)
        }, 3000)
    }

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const getSupportLevelColor = (level: 'low' | 'medium' | 'high') => {
        switch (level) {
            case 'low':
                return 'text-red-600 bg-red-50 border-red-200'
            case 'medium':
                return 'text-yellow-600 bg-yellow-50 border-yellow-200'
            case 'high':
                return 'text-green-600 bg-green-50 border-green-200'
            default:
                return 'text-gray-600 bg-gray-50 border-gray-200'
        }
    }

    const getSupportLevelText = (level: 'low' | 'medium' | 'high') => {
        switch (level) {
            case 'low':
                return 'Thấp'
            case 'medium':
                return 'Trung bình'
            case 'high':
                return 'Cao'
            default:
                return 'Không xác định'
        }
    }

    const getSupportLevelIcon = (level: 'low' | 'medium' | 'high') => {
        switch (level) {
            case 'low':
                return '🔴'
            case 'medium':
                return '🟡'
            case 'high':
                return '🟢'
            default:
                return '⚪'
        }
    }

    // Unused functions - có thể sử dụng sau
    // const getRiskLevelColor = (level: 'low' | 'medium' | 'high') => {
    //     switch (level) {
    //         case 'low':
    //             return 'text-green-600 bg-green-50 border-green-200'
    //         case 'medium':
    //             return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    //         case 'high':
    //             return 'text-red-600 bg-red-50 border-red-200'
    //         default:
    //             return 'text-gray-600 bg-gray-50 border-gray-200'
    //     }
    // }

    // const getRiskLevelText = (level: 'low' | 'medium' | 'high') => {
    //     switch (level) {
    //         case 'low':
    //             return 'Rủi ro thấp'
    //         case 'medium':
    //             return 'Rủi ro trung bình'
    //         case 'high':
    //             return 'Rủi ro cao'
    //         default:
    //             return 'Không xác định'
    //     }
    // }

    return (
        <TeacherLayout currentPage="prediction-view">
            {/* Hidden File Input */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx,.xls,.csv"
                className="hidden"
            />

            {/* Page Header */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center space-x-2">
                    <Brain className="w-6 h-6 text-purple-600" />
                    <span>Xem Dự Đoán Kết Quả Học Tập</span>
                </h2>
                <p className="text-gray-600">Upload bảng điểm để nhận dự đoán kết quả học tập của sinh viên dựa trên AI</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Upload Section */}
                <div className="lg:col-span-1">
                    <Card className="h-fit">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                                <Upload className="w-5 h-5 text-blue-600" />
                                <span>Upload Bảng Điểm</span>
                            </h3>
                        </div>
                        <CardContent className="space-y-4">
                            {/* Drop Zone */}
                            <div
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                className={`border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer hover:border-blue-400 hover:bg-blue-50 ${dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
                                    }`}
                                onClick={handleFileSelect}
                            >
                                <div className="space-y-4">
                                    <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                                        <FileSpreadsheet className="w-8 h-8 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-gray-600">
                                            {dragActive ? 'Thả file vào đây' : 'Kéo thả file hoặc nhấn để chọn'}
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Hỗ trợ: .xlsx, .xls, .csv (tối đa 10MB)
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Upload Status */}
                            {isUploading && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-center space-x-3">
                                        <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                                        <div>
                                            <p className="text-blue-800 font-medium">Đang xử lý...</p>
                                            <p className="text-blue-600 text-sm">AI đang phân tích dữ liệu</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Download Template */}
                            <div className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <FileText className="w-5 h-5 text-gray-600" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">Mẫu bảng điểm</p>
                                            <p className="text-xs text-gray-500">Template chuẩn</p>
                                        </div>
                                    </div>
                                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                        <Download className="w-4 h-4 inline mr-1" />
                                        Tải về
                                    </button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Upload History */}
                    <Card className="mt-6">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                                <Activity className="w-5 h-5 text-gray-600" />
                                <span>Lịch Sử Upload</span>
                            </h3>
                        </div>
                        <CardContent>
                            <div className="space-y-3 max-h-60 overflow-y-auto">
                                {uploadedFiles.length === 0 ? (
                                    <p className="text-gray-500 text-sm text-center py-4">
                                        Chưa có file nào được upload
                                    </p>
                                ) : (
                                    uploadedFiles.map((file, index) => (
                                        <div
                                            key={index}
                                            className={`border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${selectedFile?.name === file.name ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                                                }`}
                                            onClick={() => file.status === 'completed' && setSelectedFile(file)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    {file.status === 'processing' && (
                                                        <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                                                    )}
                                                    {file.status === 'completed' && (
                                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                                    )}
                                                    {file.status === 'error' && (
                                                        <AlertCircle className="w-4 h-4 text-red-600" />
                                                    )}
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900 truncate max-w-32">
                                                            {file.name}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {formatFileSize(file.size)} • {file.uploadDate.toLocaleDateString('vi-VN')}
                                                        </p>
                                                    </div>
                                                </div>
                                                {file.status === 'completed' && (
                                                    <Eye className="w-4 h-4 text-gray-400" />
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Results Section */}
                <div className="lg:col-span-2">
                    {selectedFile && selectedFile.predictions ? (
                        <div className="space-y-6">
                            {/* Summary Statistics */}
                            <div className="grid grid-cols-3 gap-4">
                                <Card>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-gray-600">Tổng sinh viên</p>
                                                <p className="text-2xl font-bold text-gray-900">
                                                    {selectedFile.predictions.length}
                                                </p>
                                            </div>
                                            <Users className="w-8 h-8 text-blue-600" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-gray-600">Rủi ro cao</p>
                                                <p className="text-2xl font-bold text-red-600">
                                                    {selectedFile.predictions.filter(p => p.riskLevel === 'high').length}
                                                </p>
                                            </div>
                                            <AlertCircle className="w-8 h-8 text-red-600" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-gray-600">Độ tin cậy TB</p>
                                                <p className="text-2xl font-bold text-green-600">
                                                    {Math.round(
                                                        selectedFile.predictions.reduce((acc, p) => acc + p.confidence, 0) /
                                                        selectedFile.predictions.length
                                                    )}%
                                                </p>
                                            </div>
                                            <Target className="w-8 h-8 text-green-600" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Prediction Results */}
                            <Card>
                                <div className="p-6 border-b border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                                        <Sparkles className="w-5 h-5 text-purple-600" />
                                        <span>Kết Quả Dự Đoán Chi Tiết</span>
                                    </h3>
                                </div>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-gray-200">
                                                    <th className="text-center py-3 px-4 font-medium text-gray-900 w-16">STT</th>
                                                    <th className="text-left py-3 px-4 font-medium text-gray-900">Họ và tên sinh viên</th>
                                                    <th className="text-center py-3 px-4 font-medium text-gray-900">Mã sinh viên</th>
                                                    <th className="text-center py-3 px-4 font-medium text-gray-900">GPA dự đoán</th>
                                                    <th className="text-center py-3 px-4 font-medium text-gray-900">Tỉ lệ điểm danh</th>
                                                    <th className="text-center py-3 px-4 font-medium text-gray-900">Ủng hộ tinh thần</th>
                                                    <th className="text-center py-3 px-4 font-medium text-gray-900">Ủng hộ vật chất</th>
                                                    <th className="text-center py-3 px-4 font-medium text-gray-900">Biểu đồ</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {selectedFile.predictions.map((prediction, index) => (
                                                    <tr key={index} className="hover:bg-gray-50">
                                                        {/* STT */}
                                                        <td className="py-3 px-4 text-center text-sm font-medium text-gray-600">
                                                            {index + 1}
                                                        </td>

                                                        {/* Họ và tên sinh viên */}
                                                        <td className="py-3 px-4">
                                                            <div>
                                                                <p className="font-medium text-gray-900">{prediction.studentName}</p>
                                                                <p className="text-sm text-gray-500">Độ tin cậy: {prediction.confidence}%</p>
                                                            </div>
                                                        </td>

                                                        {/* Mã sinh viên */}
                                                        <td className="py-3 px-4 text-center">
                                                            <span className="font-mono text-sm font-medium text-blue-600">
                                                                {prediction.studentId}
                                                            </span>
                                                        </td>

                                                        {/* GPA dự đoán */}
                                                        <td className="py-3 px-4 text-center">
                                                            <div className="flex flex-col items-center space-y-1">
                                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${prediction.predictedGPA >= 3.0 ? 'bg-green-100 text-green-800' : prediction.predictedGPA >= 2.5 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                                                    {prediction.predictedGPA.toFixed(2)}
                                                                </span>
                                                                <span className="text-xs text-gray-500">
                                                                    Hiện tại: {prediction.currentGPA.toFixed(2)}
                                                                </span>
                                                            </div>
                                                        </td>

                                                        {/* Tỉ lệ điểm danh */}
                                                        <td className="py-3 px-4 text-center">
                                                            <div className="flex flex-col items-center space-y-1">
                                                                <span className={`font-semibold text-lg ${prediction.attendanceRate >= 90 ? 'text-green-600' : prediction.attendanceRate >= 75 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                                    {prediction.attendanceRate}%
                                                                </span>
                                                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                                                    <div
                                                                        className={`h-2 rounded-full ${prediction.attendanceRate >= 90 ? 'bg-green-500' : prediction.attendanceRate >= 75 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                                        style={{ width: `${prediction.attendanceRate}%` }}
                                                                    ></div>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Ủng hộ tinh thần */}
                                                        <td className="py-3 px-4 text-center">
                                                            <div className="flex flex-col items-center space-y-1">
                                                                <span className="text-lg">{getSupportLevelIcon(prediction.spiritualSupport)}</span>
                                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getSupportLevelColor(prediction.spiritualSupport)}`}>
                                                                    {getSupportLevelText(prediction.spiritualSupport)}
                                                                </span>
                                                            </div>
                                                        </td>

                                                        {/* Ủng hộ vật chất */}
                                                        <td className="py-3 px-4 text-center">
                                                            <div className="flex flex-col items-center space-y-1">
                                                                <span className="text-lg">{getSupportLevelIcon(prediction.materialSupport)}</span>
                                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getSupportLevelColor(prediction.materialSupport)}`}>
                                                                    {getSupportLevelText(prediction.materialSupport)}
                                                                </span>
                                                            </div>
                                                        </td>

                                                        {/* Biểu đồ */}
                                                        <td className="py-3 px-4 text-center">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedStudentChart(prediction)
                                                                    setShowChartModal(true)
                                                                }}
                                                                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg flex items-center space-x-1 mx-auto transition-colors"
                                                            >
                                                                <BarChart3 className="w-4 h-4" />
                                                                <span className="text-xs">Xem</span>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Action Buttons */}
                            <div className="flex justify-end space-x-3">
                                <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
                                    <Download className="w-4 h-4" />
                                    <span>Xuất báo cáo</span>
                                </button>

                            </div>
                        </div>
                    ) : (
                        <Card className="h-96">
                            <CardContent className="h-full flex items-center justify-center">
                                <div className="text-center space-y-4">
                                    <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                                        <Brain className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có dữ liệu dự đoán</h3>
                                        <p className="text-gray-500">
                                            Upload bảng điểm để xem kết quả dự đoán từ AI
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Chart Modal */}
            {showChartModal && selectedStudentChart && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                                <BarChart3 className="w-6 h-6 mr-2 text-blue-600" />
                                Biểu đồ tiến độ - {selectedStudentChart.studentName}
                            </h3>
                            <button
                                onClick={() => setShowChartModal(false)}
                                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                            >
                                ×
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Student Info */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-600">Mã sinh viên:</span>
                                        <p className="font-mono font-medium text-blue-600">{selectedStudentChart.studentId}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">GPA hiện tại:</span>
                                        <p className="font-bold text-lg">{selectedStudentChart.currentGPA.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">GPA dự đoán:</span>
                                        <p className="font-bold text-lg text-green-600">{selectedStudentChart.predictedGPA.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Độ tin cậy:</span>
                                        <p className="font-bold text-lg text-blue-600">{selectedStudentChart.confidence}%</p>
                                    </div>
                                </div>
                            </div>

                            {/* Line Chart */}
                            <div className="bg-white border border-gray-200 rounded-lg p-6">
                                <h4 className="text-lg font-semibold text-gray-900 mb-4">Xu hướng GPA theo thời gian</h4>
                                <div className="relative">
                                    {/* Chart Container */}
                                    <div className="h-64 flex items-end space-x-3 border-b border-l border-gray-300 pl-4 pb-4">
                                        {selectedStudentChart.trendData?.map((gpa, index) => (
                                            <div key={index} className="flex-1 flex flex-col items-center space-y-2">
                                                {/* Bar */}
                                                <div
                                                    className={`w-full rounded-t transition-all duration-500 ${gpa >= 3.0 ? 'bg-green-500' : gpa >= 2.5 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                    style={{
                                                        height: `${(gpa / 4.0) * 200}px`,
                                                        minHeight: '20px'
                                                    }}
                                                ></div>
                                                {/* Value */}
                                                <span className="text-xs font-medium text-gray-700">{gpa.toFixed(1)}</span>
                                                {/* Time Label */}
                                                <span className="text-xs text-gray-500">Tháng {index + 1}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Y-axis labels */}
                                    <div className="absolute left-0 top-0 h-64 flex flex-col justify-between text-xs text-gray-500 pr-2">
                                        <span>4.0</span>
                                        <span>3.0</span>
                                        <span>2.0</span>
                                        <span>1.0</span>
                                        <span>0.0</span>
                                    </div>
                                </div>

                                {/* Chart Legend */}
                                <div className="flex justify-center space-x-6 mt-4 text-sm">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-4 h-4 bg-green-500 rounded"></div>
                                        <span>Giỏi (≥3.0)</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                                        <span>Khá (2.5-3.0)</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-4 h-4 bg-red-500 rounded"></div>
                                        <span>Yếu (&lt;2.5)</span>
                                    </div>
                                </div>
                            </div>

                            {/* Support Analysis */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <h5 className="font-semibold text-blue-900 mb-3">📚 Ủng hộ tinh thần</h5>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-blue-700">Mức độ:</span>
                                            <span className={`px-2 py-1 rounded text-sm font-medium ${getSupportLevelColor(selectedStudentChart.spiritualSupport)}`}>
                                                {getSupportLevelText(selectedStudentChart.spiritualSupport)}
                                            </span>
                                        </div>
                                        <div className="text-sm text-blue-600">
                                            {selectedStudentChart.spiritualSupport === 'high' && 'Sinh viên có động lực học tập cao, tích cực tham gia hoạt động'}
                                            {selectedStudentChart.spiritualSupport === 'medium' && 'Sinh viên cần được động viên thêm, quan tâm nhiều hơn'}
                                            {selectedStudentChart.spiritualSupport === 'low' && 'Sinh viên cần can thiệp tâm lý, tư vấn học tập'}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-green-50 p-4 rounded-lg">
                                    <h5 className="font-semibold text-green-900 mb-3">💰 Ủng hộ vật chất</h5>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-green-700">Mức độ:</span>
                                            <span className={`px-2 py-1 rounded text-sm font-medium ${getSupportLevelColor(selectedStudentChart.materialSupport)}`}>
                                                {getSupportLevelText(selectedStudentChart.materialSupport)}
                                            </span>
                                        </div>
                                        <div className="text-sm text-green-600">
                                            {selectedStudentChart.materialSupport === 'high' && 'Điều kiện kinh tế ổn định, đầy đủ tài liệu học tập'}
                                            {selectedStudentChart.materialSupport === 'medium' && 'Điều kiện trung bình, cần hỗ trợ một phần tài liệu'}
                                            {selectedStudentChart.materialSupport === 'low' && 'Cần hỗ trợ học bổng, tài liệu học tập'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Recommendations */}
                            <div className="bg-yellow-50 p-4 rounded-lg">
                                <h5 className="font-semibold text-yellow-900 mb-3">💡 Khuyến nghị</h5>
                                <div className="space-y-2">
                                    {selectedStudentChart.factors.map((factor, index) => (
                                        <div key={index} className="flex items-start space-x-2">
                                            <span className="text-yellow-600 mt-1">•</span>
                                            <span className="text-yellow-800 text-sm">{factor}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                            <button
                                onClick={() => setShowChartModal(false)}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
                            >
                                Đóng
                            </button>
                            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
                                <Download className="w-4 h-4" />
                                <span>Xuất báo cáo</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </TeacherLayout>
    )
}