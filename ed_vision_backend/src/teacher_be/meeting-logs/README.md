# Meeting Logs API

API này được tạo để hỗ trợ chức năng Nhật ký cố vấn học tập, họp lớp cho giảng viên.

## Endpoints

### 1. Lấy thông tin Instructor

**GET** `/teacher/meeting-logs/instructor/:accountId`

Lấy thông tin chi tiết của giảng viên dựa trên `account_id`.

**Response:**
```json
{
  "instructor_id": 1,
  "account_id": 10,
  "employee_code": "GV001",
  "full_name": "TS. Nguyễn Văn A",
  "academic_title": "Tiến sĩ",
  "position": "Giảng viên chính",
  "department": {
    "id": 1,
    "name": "Công nghệ thông tin",
    "code": "CNTT"
  },
  "email": "nguyenvana@duytan.edu.vn"
}
```

### 2. Lấy danh sách sinh viên theo Slot ID

**GET** `/teacher/meeting-logs/slot/:slotId/students`

Lấy danh sách sinh viên đã đặt lịch cho một slot cụ thể.

**Response:**
```json
{
  "slot_id": 123,
  "date": "2025-11-25",
  "day_of_week": 1,
  "start_time": "09:00",
  "end_time": "10:00",
  "period_label": "Tiết 1-2",
  "meeting_location": "Phòng A101",
  "meeting_link": "https://meet.google.com/xxx",
  "meeting_type": "offline",
  "students": [
    {
      "id": 1,
      "student_code": "SV001",
      "name": "Nguyễn Văn B",
      "class_name": "K28 CMU TPM 1",
      "email": "sv001@duytan.edu.vn",
      "appointment_id": 456,
      "meeting_purpose": "Tư vấn học tập",
      "status": "confirmed",
      "meeting_type": "offline"
    }
  ],
  "total_students": 1,
  "capacity": 10
}
```

### 3. Lấy danh sách sinh viên theo thời gian cụ thể

**GET** `/teacher/meeting-logs/time-slot`

Lấy danh sách sinh viên đã đặt lịch dựa trên instructor, ngày và giờ cụ thể.

**Query Parameters:**
- `instructorId` (number, required): ID của giảng viên
- `date` (string, required): Ngày theo format YYYY-MM-DD (ví dụ: 2025-11-25)
- `startTime` (string, required): Giờ bắt đầu theo format HH:mm (ví dụ: 09:00)
- `endTime` (string, required): Giờ kết thúc theo format HH:mm (ví dụ: 10:00)

**Example Request:**
```
GET /teacher/meeting-logs/time-slot?instructorId=1&date=2025-11-25&startTime=09:00&endTime=10:00
```

**Response:**
```json
{
  "slot_id": 123,
  "date": "2025-11-25",
  "day_of_week": 1,
  "start_time": "09:00",
  "end_time": "10:00",
  "period_label": "Tiết 1-2",
  "meeting_location": "Phòng A101",
  "meeting_link": "",
  "meeting_type": "offline",
  "students": [
    {
      "id": 1,
      "student_code": "SV001",
      "name": "Nguyễn Văn B",
      "class_name": "K28 CMU TPM 1",
      "email": "sv001@duytan.edu.vn",
      "appointment_id": 456,
      "meeting_purpose": "Tư vấn học tập",
      "status": "confirmed",
      "meeting_type": "offline"
    }
  ],
  "total_students": 1,
  "capacity": 10
}
```

**Note:** Nếu không tìm thấy slot, API sẽ trả về danh sách sinh viên rỗng thay vì throw error:
```json
{
  "slot_id": null,
  "date": "2025-11-25",
  "day_of_week": 1,
  "start_time": "09:00",
  "end_time": "10:00",
  "period_label": "",
  "meeting_location": "",
  "meeting_link": "",
  "meeting_type": "offline",
  "students": [],
  "total_students": 0,
  "capacity": 0
}
```

### 4. Lưu nhật ký cuộc họp

**POST** `/teacher/meeting-logs`

Lưu nội dung nhật ký cố vấn học tập/họp lớp.

**Request Body:**
```json
{
  "instructor_id": 1,
  "slot_id": 123,
  "date": "2025-11-25",
  "start_time": "09:00",
  "end_time": "10:00",
  "content": "<html>Nội dung nhật ký ở dạng HTML...</html>",
  "student_ids": [1, 2, 3],
  "location": "Phòng A101"
}
```

**Response:**
```json
{
  "id": 1,
  "instructor_id": 1,
  "slot_id": 123,
  "date": "2025-11-25",
  "start_time": "09:00",
  "end_time": "10:00",
  "content": "<html>Nội dung nhật ký...</html>",
  "student_ids": [1, 2, 3],
  "location": "Phòng A101",
  "created_at": "2025-11-25T10:00:00.000Z",
  "updated_at": "2025-11-25T10:00:00.000Z"
}
```

**Note:** Endpoint này hiện tại trả về mock data. Để lưu thực sự vào database, bạn cần:
1. Tạo bảng `MeetingLog` trong `schema.prisma`
2. Chạy migration
3. Implement logic lưu trong service

### 5. Lấy danh sách nhật ký của giảng viên

**GET** `/teacher/meeting-logs/instructor/:instructorId/logs`

Lấy danh sách các nhật ký đã tạo của một giảng viên.

**Query Parameters:**
- `startDate` (string, optional): Ngày bắt đầu lọc (YYYY-MM-DD)
- `endDate` (string, optional): Ngày kết thúc lọc (YYYY-MM-DD)

**Example Request:**
```
GET /teacher/meeting-logs/instructor/1/logs?startDate=2025-11-01&endDate=2025-11-30
```

**Response:**
```json
[
  {
    "id": 1,
    "instructor_id": 1,
    "slot_id": 123,
    "date": "2025-11-25",
    "start_time": "09:00",
    "end_time": "10:00",
    "content": "<html>Nội dung nhật ký...</html>",
    "student_ids": [1, 2, 3],
    "location": "Phòng A101",
    "created_at": "2025-11-25T10:00:00.000Z",
    "updated_at": "2025-11-25T10:00:00.000Z"
  }
]
```

## Cách tích hợp vào Frontend

Trong component `WordEditorModal.tsx`, bạn có thể sử dụng như sau:

```typescript
import { useEffect, useState } from 'react'

// 1. Lấy thông tin instructor khi component mount
useEffect(() => {
  const fetchInstructorInfo = async () => {
    const accountId = // lấy từ auth context hoặc user state
    const response = await fetch(`/api/teacher/meeting-logs/instructor/${accountId}`)
    const data = await response.json()
    setInstructorInfo(data)
  }
  
  fetchInstructorInfo()
}, [])

// 2. Lấy danh sách sinh viên khi chọn time slot
const handleTimeSlotSelect = async (date, startTime, endTime) => {
  const instructorId = instructorInfo.instructor_id
  const response = await fetch(
    `/api/teacher/meeting-logs/time-slot?` +
    `instructorId=${instructorId}&date=${date}&startTime=${startTime}&endTime=${endTime}`
  )
  const data = await response.json()
  setSelectedStudents(data.students)
}

// 3. Lưu nhật ký
const saveDocument = async () => {
  const content = editorRef.current?.innerHTML
  const response = await fetch('/api/teacher/meeting-logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instructor_id: instructorInfo.instructor_id,
      date: date,
      start_time: timeSlot.startTime,
      end_time: timeSlot.endTime,
      content: content,
      student_ids: selectedStudents.map(s => s.id),
      location: 'Địa điểm từ form'
    })
  })
  const result = await response.json()
  alert('Đã lưu thành công!')
}
```

## TODO - Các tính năng cần bổ sung

1. **Tạo bảng MeetingLog trong database:**
   - Thêm model vào `schema.prisma`
   - Chạy migration
   - Implement CRUD operations

2. **Export PDF:**
   - Sử dụng thư viện như `puppeteer` hoặc `pdfkit`
   - Tạo endpoint `/teacher/meeting-logs/:id/export-pdf`

3. **Authentication & Authorization:**
   - Thêm guards để kiểm tra role
   - Đảm bảo giảng viên chỉ xem được nhật ký của mình

4. **Email notification:**
   - Gửi email thông báo cho sinh viên sau khi tạo nhật ký
   - Tích hợp với email service

## Schema Prisma đề xuất (nếu cần lưu vào DB)

```prisma
model MeetingLog {
  log_id        Int      @id @default(autoincrement())
  instructor_id Int
  slot_id       Int?
  date          DateTime @db.Date
  start_time    String   @db.VarChar(10)
  end_time      String   @db.VarChar(10)
  content       String   // HTML content
  location      String?
  student_ids   Int[]    // Array of student IDs
  created_at    DateTime @default(now()) @db.Timestamptz(6)
  updated_at    DateTime @updatedAt @db.Timestamptz(6)
  
  instructor    Instructor @relation(fields: [instructor_id], references: [instructor_id], onDelete: Cascade)
  slot          InstructorWeeklySlot? @relation(fields: [slot_id], references: [slot_id])
  
  @@map("MeetingLog")
}
```
