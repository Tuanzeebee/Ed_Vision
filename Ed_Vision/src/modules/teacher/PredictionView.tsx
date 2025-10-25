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
    TrendingUp,
    TrendingDown,
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
    currentGrade: number
    predictedGrade: number
    riskLevel: 'low' | 'medium' | 'high'
    confidence: number
    factors: string[]
}

export default function PredictionView() {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
    const [isUploading, setIsUploading] = useState(false)
    const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null)
    const [dragActive, setDragActive] = useState(false)

    // Sample prediction data
    const samplePredictions: PredictionResult[] = [
        {
            studentId: "SV001",
            studentName: "Nguyễn Văn An",
            currentGrade: 7.5,
            predictedGrade: 8.2,
            riskLevel: 'low',
            confidence: 85,
            factors: ["Điểm tăng đều", "Tham gia tích cực", "Bài tập đầy đủ"]
        },
        {
            studentId: "SV002",
            studentName: "Trần Thị Bình",
            currentGrade: 5.2,
            predictedGrade: 4.8,
            riskLevel: 'high',
            confidence: 78,
            factors: ["Điểm giảm dần", "Vắng mặt nhiều", "Nộp bài muộn"]
        },
        {
            studentId: "SV003",
            studentName: "Lê Văn Cường",
            currentGrade: 6.8,
            predictedGrade: 7.1,
            riskLevel: 'medium',
            confidence: 72,
            factors: ["Điểm không ổn định", "Cần cải thiện", "Tiềm năng tốt"]
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

    const getRiskLevelColor = (level: 'low' | 'medium' | 'high') => {
        switch (level) {
            case 'low':
                return 'text-green-600 bg-green-50 border-green-200'
            case 'medium':
                return 'text-yellow-600 bg-yellow-50 border-yellow-200'
            case 'high':
                return 'text-red-600 bg-red-50 border-red-200'
            default:
                return 'text-gray-600 bg-gray-50 border-gray-200'
        }
    }

    const getRiskLevelText = (level: 'low' | 'medium' | 'high') => {
        switch (level) {
            case 'low':
                return 'Rủi ro thấp'
            case 'medium':
                return 'Rủi ro trung bình'
            case 'high':
                return 'Rủi ro cao'
            default:
                return 'Không xác định'
        }
    }

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
                                                    <th className="text-left py-3 px-4 font-medium text-gray-900">Sinh viên</th>
                                                    <th className="text-center py-3 px-4 font-medium text-gray-900">Điểm hiện tại</th>
                                                    <th className="text-center py-3 px-4 font-medium text-gray-900">Dự đoán</th>
                                                    <th className="text-center py-3 px-4 font-medium text-gray-900">Xu hướng</th>
                                                    <th className="text-center py-3 px-4 font-medium text-gray-900">Mức rủi ro</th>
                                                    <th className="text-center py-3 px-4 font-medium text-gray-900">Độ tin cậy</th>
                                                    <th className="text-left py-3 px-4 font-medium text-gray-900">Yếu tố chính</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {selectedFile.predictions.map((prediction, index) => (
                                                    <tr key={index} className="hover:bg-gray-50">
                                                        <td className="py-3 px-4">
                                                            <div>
                                                                <p className="font-medium text-gray-900">{prediction.studentName}</p>
                                                                <p className="text-sm text-gray-500">{prediction.studentId}</p>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4 text-center">
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                {prediction.currentGrade.toFixed(1)}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4 text-center">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${prediction.predictedGrade >= 8 ? 'bg-green-100 text-green-800' :
                                                                    prediction.predictedGrade >= 6.5 ? 'bg-yellow-100 text-yellow-800' :
                                                                        'bg-red-100 text-red-800'
                                                                }`}>
                                                                {prediction.predictedGrade.toFixed(1)}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4 text-center">
                                                            {prediction.predictedGrade > prediction.currentGrade ? (
                                                                <TrendingUp className="w-5 h-5 text-green-600 mx-auto" />
                                                            ) : (
                                                                <TrendingDown className="w-5 h-5 text-red-600 mx-auto" />
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-4 text-center">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRiskLevelColor(prediction.riskLevel)}`}>
                                                                {getRiskLevelText(prediction.riskLevel)}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4 text-center">
                                                            <div className="flex items-center justify-center space-x-2">
                                                                <div className="w-12 bg-gray-200 rounded-full h-2">
                                                                    <div
                                                                        className="bg-blue-600 h-2 rounded-full"
                                                                        style={{ width: `${prediction.confidence}%` }}
                                                                    ></div>
                                                                </div>
                                                                <span className="text-xs text-gray-600">{prediction.confidence}%</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <div className="space-y-1">
                                                                {prediction.factors.slice(0, 2).map((factor, idx) => (
                                                                    <span key={idx} className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded mr-1">
                                                                        {factor}
                                                                    </span>
                                                                ))}
                                                                {prediction.factors.length > 2 && (
                                                                    <span className="text-xs text-gray-500">+{prediction.factors.length - 2} khác</span>
                                                                )}
                                                            </div>
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
                                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
                                    <BarChart3 className="w-4 h-4" />
                                    <span>Xem biểu đồ</span>
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
        </TeacherLayout>
    )
}