# Teacher Backend API Documentation

## Cấu trúc Module Teacher Backend

```
src/teacher_be/
├── dashboard/                    # Module Dashboard - Tổng quan
│   ├── dto/
│   │   └── dashboard-filter.dto.ts
│   ├── models/
│   │   └── dashboard-stats.type.ts
│   ├── dashboard.controller.ts
│   ├── dashboard.service.ts
│   ├── dashboard.module.ts
│   └── index.ts
│
├── class-management/            # Module Quản lý lớp
│   ├── dto/
│   │   ├── student-filter.dto.ts
│   │   └── send-message.dto.ts
│   ├── models/
│   │   └── class-detail.type.ts
│   ├── class-management.controller.ts
│   ├── class-management.service.ts
│   ├── class-management.module.ts
│   └── index.ts
│
├── grade-management/            # Module Quản lý điểm
│   ├── dto/
│   │   ├── create-grade-structure.dto.ts
│   │   └── prediction-input.dto.ts
│   ├── models/
│   │   └── grade.type.ts
│   ├── grade-management.controller.ts   [TODO]
│   ├── grade-management.service.ts      [TODO]
│   ├── grade-management.module.ts       [TODO]
│   └── index.ts                         [TODO]
│
├── progress-tracking/           # Module Theo dõi tiến độ [TODO]
├── reports/                     # Module Báo cáo [TODO]
└── messages/                    # Module Tin nhắn [TODO]
```

## API Endpoints

### 1. Dashboard Module

#### GET /teacher/dashboard/stats
Lấy thống kê tổng quan cho dashboard giảng viên

**Query Parameters:**
- `faculty` (optional): Khoa
- `course` (optional): Khóa học (K28, K29, etc.)
- `academicYear` (optional): Năm học (2024-2025)
- `semester` (optional): Học kỳ (1, 2, 3)

**Response:**
```typescript
{
  stats: {
    totalStudents: number;
    totalClasses: number;
    atRiskPercentage: number;
    atRiskCount: number;
    gradeDistribution: {
      low: number;      // < 5.0
      medium: number;   // 5.0 - 7.9
      high: number;     // >= 8.0
    };
    averageGPA: number;
    medianGPA: number;
    minGPA: number;
  };
  atRiskStudents: Array<{
    studentId: string;
    studentCode: string;
    name: string;
    class: string;
    avatar?: string;
    gpa: number;
    absences: number;
    debtCourses: number;
    riskLevel: 'high' | 'medium' | 'low';
  }>;
  weeklyProgressChart: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      borderColor?: string;
      backgroundColor?: string;
    }>;
  };
  majorComparisonChart: { /* Similar structure */ };
}
```

### 2. Class Management Module

#### GET /teacher/classes
Lấy danh sách các lớp mà giảng viên phụ trách

**Response:**
```typescript
Array<{
  classId: number;
  className: string;
  major: string;
  students: number;
  teacher: string;
  atRisk: number;
  status: string;
  year: string;
}>
```

#### GET /teacher/classes/:classId
Lấy chi tiết sinh viên trong một lớp

**Path Parameters:**
- `classId`: ID của lớp

**Query Parameters:**
- `search` (optional): Tìm theo tên hoặc mã SV
- `riskLevel` (optional): Filter theo mức độ rủi ro (None | Monitor | Medium | High)

**Response:**
```typescript
{
  classInfo: {
    classId: number;
    className: string;
    major: string;
    students: number;
    teacher: string;
    atRisk: number;
    status: string;
    year: string;
  };
  students: Array<{
    id: string;
    studentCode: string;
    name: string;
    email: string;
    avatar?: string;
    gpa: number;
    predictedGpa: number;
    attendance: number;
    riskLevel: 'None' | 'Monitor' | 'Medium' | 'High';
    status: string;
  }>;
  summary: {
    total: number;
    noRisk: number;
    highRisk: number;
    excellent: number; // GPA >= 3.2
  };
}
```

#### POST /teacher/classes/send-message
Gửi tin nhắn nhanh tới sinh viên

**Body:**
```typescript
{
  studentId: string;
  message: string;
}
```

**Response:**
```typescript
{
  success: boolean;
}
```

### 3. Grade Management Module [IN PROGRESS]

#### POST /teacher/grades/structure
Tạo cấu trúc bảng điểm mới

**Body:**
```typescript
{
  classId: string;
  subjectCode: string;
  subjectName: string;
  columns: Array<{
    name: string;
    maxScore: number;   // 1-100
    weight: number;     // % 0-100
  }>;
}
```

#### POST /teacher/grades/upload
Upload điểm từ Excel file

#### POST /teacher/grades/predict
Dự đoán điểm dựa trên các yếu tố support

**Body:**
```typescript
{
  workTime: number;         // 0-60 giờ/tuần
  mentalSupport: number;    // 1-10
  financialSupport: number; // 1-10
}
```

**Response:**
```typescript
{
  predictions: Array<{
    studentId: string;
    studentCode: string;
    name: string;
    currentAverage: number;
    predictedGrade: number;
    riskLevel: 'low' | 'medium' | 'high';
    recommendation: string;
  }>;
  summary: {
    lowRisk: number;
    mediumRisk: number;
    highRisk: number;
  };
}
```

## TODO: Các module còn lại

### 4. Progress Tracking Module
- GET /teacher/progress/timeline
- GET /teacher/progress/milestones
- GET /teacher/progress/class-metrics

### 5. Reports Module
- GET /teacher/reports/at-risk
- GET /teacher/reports/performance
- GET /teacher/reports/export (PDF/Excel)

### 6. Messages Module
- GET /teacher/messages
- POST /teacher/messages/send
- GET /teacher/messages/templates

## Ghi chú kỹ thuật

### Authentication
- Tất cả endpoints cần authentication (TODO: Implement JWT guard)
- InstructorId được lấy từ token hoặc request user

### Database Schema
- Sử dụng Prisma ORM
- Tables chính: Student, ClassGroup, AdviserAssignment, StudentCourseRecord
- Xem schema.prisma để biết chi tiết

### Risk Level Calculation
```
GPA >= 2.68: None
GPA 2.4 - 2.68: Monitor
GPA 2.0 - 2.4: Medium
GPA < 2.0: High
```

### GPA Calculation
- Chỉ tính các môn đã hoàn thành (status = 'completed')
- Sử dụng converted_numeric_score
- Tính trung bình cộng đơn giản

## Next Steps
1. Hoàn thành Grade Management Service
2. Implement Progress Tracking Module
3. Implement Reports Module
4. Add Authentication Guards
5. Add Input Validation
6. Add Unit Tests
7. Add API Documentation (Swagger)
