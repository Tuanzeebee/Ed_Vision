import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/teacher/teacher_card"
import { Button } from "@/components/ui/teacher/teacher_button"
import { Input } from "@/components/ui/teacher/teacher_input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/teacher/teacher_table"
import { Badge } from "@/components/ui/teacher/teacher_badge"
import TeacherLayout from "./components/TeacherLayout"
import imgChart from "@/assets/teacher/Report_Teacher.png"

export default function TeacherReport() {
    const [searchTerm, setSearchTerm] = useState("")
    const [isExportingPDF, setIsExportingPDF] = useState(false)
    const [isExportingExcel, setIsExportingExcel] = useState(false)

    const reportData = [
        {
            id: 1,
            studentName: "Nguyễn Văn An",
            class: "Lớp 10A",
            subject: "Toán",
            riskLevel: "Cao",
            lastUpdate: "2024-01-15",
            score: 65,
            attendance: 85
        }
    ]

    const filteredReports = reportData.filter(report =>
        report.studentName.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleExportPDF = () => {
        setIsExportingPDF(true)
        setTimeout(() => {
            setIsExportingPDF(false)
        }, 2000)
    }

    const handleExportExcel = () => {
        setIsExportingExcel(true)
        setTimeout(() => {
            setIsExportingExcel(false)
        }, 2000)
    }

    const getRiskBadge = (riskLevel: string) => {
        switch (riskLevel) {
            case "Cao":
                return <Badge className="bg-red-100 text-red-800">Cao</Badge>
            default:
                return <Badge className="bg-gray-100 text-gray-800">{riskLevel}</Badge>
        }
    }

    return (
        <TeacherLayout currentPage="reports-alerts">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Báo cáo & Cảnh báo</h1>
                        <p className="text-gray-600">Báo cáo chi tiết và cảnh báo rủi ro học tập</p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            onClick={handleExportPDF}
                            disabled={isExportingPDF}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isExportingPDF ? "Đang xuất..." : "Xuất PDF"}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleExportExcel}
                            disabled={isExportingExcel}
                        >
                            {isExportingExcel ? "Đang xuất..." : "Xuất Excel"}
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Biểu đồ phân tích rủi ro</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-center">
                            <img src={imgChart} alt="Report Chart" className="w-full max-w-2xl" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Danh sách báo cáo chi tiết</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-4 mb-6">
                            <Input
                                placeholder="Tìm kiếm học sinh..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Học sinh</TableHead>
                                    <TableHead>Lớp</TableHead>
                                    <TableHead>Môn học</TableHead>
                                    <TableHead>Điểm TB</TableHead>
                                    <TableHead>Điểm danh</TableHead>
                                    <TableHead>Mức độ rủi ro</TableHead>
                                    <TableHead>Cập nhật cuối</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredReports.map((report) => (
                                    <TableRow key={report.id}>
                                        <TableCell className="font-medium">{report.studentName}</TableCell>
                                        <TableCell>{report.class}</TableCell>
                                        <TableCell>{report.subject}</TableCell>
                                        <TableCell>{report.score}</TableCell>
                                        <TableCell>{report.attendance}%</TableCell>
                                        <TableCell>
                                            {getRiskBadge(report.riskLevel)}
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-500">
                                            {report.lastUpdate}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        {filteredReports.length === 0 && (
                            <div className="text-center py-8">
                                <p className="text-gray-500">Không tìm thấy báo cáo nào</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </TeacherLayout>
    )
}
