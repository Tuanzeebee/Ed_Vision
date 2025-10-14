import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/teacher/teacher_card"
import { Button } from "@/components/ui/teacher/teacher_button"
import { Input } from "@/components/ui/teacher/teacher_input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/teacher/teacher_table"
import { Badge } from "@/components/ui/teacher/teacher_badge"
import TeacherLayout from "./components/TeacherLayout"
import { Calendar, Clock, CheckCircle, X } from "lucide-react"

export default function TeacherAppointmentDashboard() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddingSlot, setIsAddingSlot] = useState(false)

  const appointmentData = [
    {
      id: 1,
      studentName: "Nguyễn Văn An",
      class: "Lớp 10A",
      date: "2024-01-20",
      time: "14:00",
      duration: 30,
      subject: "Toán",
      status: "Đã xác nhận",
      type: "Tư vấn học tập"
    }
  ]

  const filteredAppointments = appointmentData.filter(appointment =>
    appointment.studentName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddTimeSlot = () => {
    setIsAddingSlot(true)
    setTimeout(() => {
      setIsAddingSlot(false)
    }, 1500)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Đã xác nhận":
        return <Badge className="bg-green-100 text-green-800">Đã xác nhận</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  return (
    <TeacherLayout currentPage="appointments">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý lịch hẹn</h1>
            <p className="text-gray-600">Quản lý và theo dõi các cuộc hẹn với học sinh</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleAddTimeSlot}
              disabled={isAddingSlot}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Calendar className="w-4 h-4 mr-2" />
              {isAddingSlot ? "Đang thêm..." : "Thêm khung giờ"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tổng lịch hẹn</p>
                  <p className="text-2xl font-bold text-gray-900">24</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Đã xác nhận</p>
                  <p className="text-2xl font-bold text-gray-900">18</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Chờ xác nhận</p>
                  <p className="text-2xl font-bold text-gray-900">6</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <X className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Đã hủy</p>
                  <p className="text-2xl font-bold text-gray-900">2</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Danh sách lịch hẹn</CardTitle>
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
                  <TableHead>Ngày</TableHead>
                  <TableHead>Giờ</TableHead>
                  <TableHead>Thời lượng</TableHead>
                  <TableHead>Môn học</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAppointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell className="font-medium">{appointment.studentName}</TableCell>
                    <TableCell>{appointment.class}</TableCell>
                    <TableCell>{appointment.date}</TableCell>
                    <TableCell>{appointment.time}</TableCell>
                    <TableCell>{appointment.duration} phút</TableCell>
                    <TableCell>{appointment.subject}</TableCell>
                    <TableCell>{appointment.type}</TableCell>
                    <TableCell>
                      {getStatusBadge(appointment.status)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredAppointments.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">Không tìm thấy lịch hẹn nào</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TeacherLayout>
  )
}
