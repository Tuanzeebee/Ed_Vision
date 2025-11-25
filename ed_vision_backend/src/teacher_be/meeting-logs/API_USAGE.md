# Meeting Logs API - Usage Guide

## 📚 Overview
API endpoints để quản lý nhật ký cuộc họp giữa giảng viên và sinh viên, tự động lấy `account_id` và `student_id` từ database.

---

## 🔗 API Endpoints

### 1. Lấy thông tin giảng viên
**GET** `/teacher/meeting-logs/instructor/:accountId`

Tự động lấy thông tin giảng viên từ database dựa trên `account_id`.

**Request:**
```bash
GET /teacher/meeting-logs/instructor/2
```

**Response:**
```json
{
  "instructor_id": 1,
  "account_id": 2,
  "employee_code": "GV001",
  "full_name": "Nguyễn Văn Giáo Viên",
  "academic_title": "Thạc sĩ",
  "position": "Giảng viên",
  "department": {
    "id": 1,
    "name": "Khoa Công nghệ thông tin",
    "code": "IT"
  },
  "email": "teacher@dtu.edu.vn"
}
```

**Bảng database sử dụng:**
- ✅ `Account` → `account_id`, `email`
- ✅ `Profile` → `full_name` (qua Account relation)
- ✅ `Instructor` → `instructor_id`, `employee_code`, `position`, `academic_title`
- ✅ `Department` → `department_id`, `name`, `code`

---

### 2. Lấy danh sách sinh viên theo slot
**GET** `/teacher/meeting-logs/slot/:slotId/students`

Lấy danh sách sinh viên đã đặt lịch cho một slot cụ thể, **tự động trả về `student_id` và `account_id`**.

**Request:**
```bash
GET /teacher/meeting-logs/slot/123/students
```

**Response:**
```json
{
  "slot_id": 123,
  "date": "2024-11-26",
  "day_of_week": 2,
  "start_time": "08:00",
  "end_time": "09:00",
  "period_label": "Tiết 1-2",
  "meeting_location": "Phòng A101",
  "meeting_link": "https://meet.google.com/abc-defg-hij",
  "meeting_type": "offline",
  "students": [
    {
      "id": 1,
      "student_id": 1,           // ✅ Tự động lấy từ Student table
      "account_id": 3,           // ✅ Tự động lấy từ Student.account_id
      "student_code": "SV001",
      "name": "Nguyễn Văn An",
      "class_name": "K28 CMU TPM 1",
      "email": "student1@dtu.edu.vn",
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

**Bảng database sử dụng:**
- ✅ `InstructorWeeklySlot` → `slot_id`, `start_time`, `end_time`, `meeting_location`
- ✅ `Appointment` → `appointment_id`, `status`, `meeting_purpose`
- ✅ `Student` → `student_id`, `account_id`, `student_code`
- ✅ `Account` → `email`
- ✅ `Profile` → `full_name`
- ✅ `ClassGroup` → `class_code`

---

### 3. Lấy danh sách sinh viên theo thời gian
**GET** `/teacher/meeting-logs/time-slot`

Lấy danh sách sinh viên theo instructor, ngày, và khung giờ cụ thể. **Tự động tìm slot và trả về `student_id`, `account_id`**.

**Query Parameters:**
- `instructorId` (number, required): ID của giảng viên
- `date` (string, required): Ngày (format: YYYY-MM-DD)
- `startTime` (string, required): Giờ bắt đầu (format: HH:mm)
- `endTime` (string, required): Giờ kết thúc (format: HH:mm)

**Request:**
```bash
GET /teacher/meeting-logs/time-slot?instructorId=1&date=2024-11-26&startTime=08:00&endTime=09:00
```

**Response:** (Giống endpoint #2)

**Logic tự động:**
1. Tính ngày đầu tuần từ `date` parameter
2. Tìm `InstructorAvailabilityWeek` theo `instructor_id` và `week_start_date`
3. Tìm `InstructorWeeklySlot` theo `day_of_week`, `start_time`, `end_time`
4. Lấy tất cả `Appointment` với status `confirmed` hoặc `pending`
5. Join với `Student`, `Account`, `Profile`, `ClassGroup`
6. Trả về danh sách sinh viên với **đầy đủ `student_id` và `account_id`**

---

### 4. Tạo nhật ký cuộc họp
**POST** `/teacher/meeting-logs`

Lưu nhật ký cuộc họp với danh sách `student_ids` (sử dụng ID đã lấy từ API trên).

**Request Body:**
```json
{
  "instructor_id": 1,
  "slot_id": 123,
  "date": "2024-11-26",
  "start_time": "08:00",
  "end_time": "09:00",
  "content": "Nội dung nhật ký cuộc họp...",
  "student_ids": [1, 2, 3],    // ✅ Dùng student_id từ API #2 hoặc #3
  "location": "Phòng A101"
}
```

**Response:**
```json
{
  "id": 1,
  "instructor_id": 1,
  "slot_id": 123,
  "date": "2024-11-26",
  "start_time": "08:00",
  "end_time": "09:00",
  "content": "Nội dung nhật ký...",
  "student_ids": [1, 2, 3],
  "location": "Phòng A101",
  "created_at": "2024-11-26T08:00:00Z",
  "updated_at": "2024-11-26T08:00:00Z"
}
```

---

### 5. Lấy danh sách nhật ký của giảng viên
**GET** `/teacher/meeting-logs/instructor/:instructorId/logs`

**Query Parameters (optional):**
- `startDate` (string): Ngày bắt đầu (YYYY-MM-DD)
- `endDate` (string): Ngày kết thúc (YYYY-MM-DD)

**Request:**
```bash
GET /teacher/meeting-logs/instructor/1/logs?startDate=2024-11-01&endDate=2024-11-30
```

**Response:** Array of MeetingLog objects

---

## 🎯 Frontend Integration

### Example: StudentSelectionModal

```typescript
import { getStudentsByTimeSlot, StudentInSlot } from '@/services/teacher/api/meetingLogs'

// Lấy danh sách sinh viên
const response = await getStudentsByTimeSlot(
  instructorId,
  '2024-11-26',
  '08:00',
  '09:00'
)

// Sử dụng students với đầy đủ student_id và account_id
response.students.forEach(student => {
  console.log('Student ID:', student.student_id)      // ✅ Tự động từ DB
  console.log('Account ID:', student.account_id)      // ✅ Tự động từ DB
  console.log('Student Code:', student.student_code)
  console.log('Name:', student.name)
  console.log('Class:', student.class_name)
})

// Convert sang format của StudentSelectionModal nếu cần
const modalStudents = response.students.map(s => ({
  id: s.student_code,           // Hoặc dùng s.student_id.toString()
  name: s.name,
  studentCode: s.student_code,
  className: s.class_name
}))
```

---

## 🔐 Authentication Flow

1. User login → localStorage lưu object `user` với `account_id`
2. Frontend đọc `account_id` từ localStorage
3. Gọi API #1 để lấy `instructor_id`
4. Dùng `instructor_id` để gọi API #3 lấy danh sách sinh viên
5. Mỗi student trong response có sẵn `student_id` và `account_id`

**Không cần hardcode bất kỳ ID nào!** ✅

---

## 📊 Database Schema Relations

```
Account (account_id, email)
  ↓ 1:1
Profile (full_name)
  
Account (account_id)
  ↓ 1:1
Instructor (instructor_id, employee_code, account_id, department_id)
  ↓ N:1
Department (department_id, name, code)

Account (account_id)
  ↓ 1:1
Student (student_id, account_id, student_code, class_id)
  ↓ N:1
ClassGroup (class_id, class_code)

Student
  ↓ 1:N
Appointment (appointment_id, student_id, slot_id, status)
  ↓ N:1
InstructorWeeklySlot (slot_id, start_time, end_time)
```

---

## ✅ Features

- ✅ Tự động lấy `account_id` từ localStorage (user đã login)
- ✅ Tự động lấy `instructor_id` từ `account_id`
- ✅ Tự động lấy `student_id` và `account_id` cho mỗi sinh viên
- ✅ Không hardcode bất kỳ ID nào
- ✅ Query database với nested relations (Account → Profile → Instructor → Department)
- ✅ Query appointments với nested Student relations
- ✅ Error handling với NotFoundException và BadRequestException
- ✅ TypeScript types đầy đủ cho type safety

---

## 🚀 Testing

Test API với curl:

```bash
# Test instructor info
curl http://localhost:3000/teacher/meeting-logs/instructor/2

# Test students by slot
curl http://localhost:3000/teacher/meeting-logs/slot/123/students

# Test students by time slot
curl "http://localhost:3000/teacher/meeting-logs/time-slot?instructorId=1&date=2024-11-26&startTime=08:00&endTime=09:00"

# Test create meeting log
curl -X POST http://localhost:3000/teacher/meeting-logs \
  -H "Content-Type: application/json" \
  -d '{
    "instructor_id": 1,
    "date": "2024-11-26",
    "start_time": "08:00",
    "end_time": "09:00",
    "content": "Test content",
    "student_ids": [1, 2, 3]
  }'
```

---

## 📝 Notes

- Endpoint #4 (POST) hiện đang trả về mock data. Cần tạo bảng `MeetingLog` trong schema.prisma để lưu thực sự.
- Endpoint #5 (GET logs) hiện đang trả về empty array. Implement sau khi có bảng MeetingLog.
- Tất cả API đều sử dụng Prisma ORM với proper relations và type safety.
- Backend tự động convert time zones và calculate dates correctly.

