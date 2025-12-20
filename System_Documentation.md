# EdVision - Hệ Thống Quản Lý Giáo Dục với AI Dự Đoán Hiệu Suất Học Sinh

## 📋 Tổng Quan Hệ Thống

**EdVision** là một nền tảng quản lý giáo dục thông minh sử dụng trí tuệ nhân tạo (AI) và giải thích AI (XAI) để dự đoán hiệu suất học tập của sinh viên và cung cấp những hiểu biết có thể hành động cho các nhà giáo dục. Hệ thống giúp giáo viên xác định sớm những sinh viên có nguy cơ và triển khai các chiến lược can thiệp được cá nhân hóa.

### ✨ Tính Năng Chính

- 🤖 **Dự Đoán Bằng AI**: Dự báo điểm số sử dụng Gradient Boosting với độ chính xác 85%+
- 📊 **Giải Thích AI (SHAP)**: Những hiểu biết minh bạch về các yếu tố dự đoán
- 👥 **Hệ Thống Đa Vai Trò**: Các cổng riêng biệt cho Giáo Viên, Sinh Viên, Phụ Huynh và Quản Trị Viên
- 📈 **Phân Tích Thời Gian Thực**: Bảng điều khiển tương tác với xu hướng hiệu suất
- 🔔 **Thông Báo Thông Minh**: Cảnh báo tự động cho sinh viên có nguy cơ
- 📱 **Thiết Kế Responsive**: Hoạt động liền mạch trên máy tính để bàn, máy tính bảng và thiết bị di động
- 🌐 **Hỗ Trợ Đa Ngôn Ngữ**: Địa phương hóa tiếng Việt và tiếng Anh
- 🔒 **Xác Thực Bảo Mật**: Xác thực JWT với kiểm soát truy cập dựa trên vai trò

### 🎓 Các Trường Hợp Sử Dung

- **Đối với Giáo Viên**: Tải lên điểm số, chạy dự đoán, xem giải thích SHAP, quản lý lớp học
- **Đối với Sinh Viên**: Xem điểm số, theo dõi tiến độ, nhận đề xuất được cá nhân hóa
- **Đối với Phụ Huynh**: Giám sát hiệu suất của con, nhận thông báo, giao tiếp với giáo viên
- **Đối với Quản Trị Viên**: Phân tích hệ thống, quản lý người dùng, tạo báo cáo

---

## 🏗️ Kiến Trúc Hệ Thống

```
EdVision/
├── Ed_Vision/              # Frontend (React + TypeScript + Vite)
├── ed_vision_backend/      # Backend API (NestJS + PostgreSQL + MongoDB)
└── ml_service/             # Dịch Vụ ML (FastAPI + Python + SHAP)
```

### Công Nghệ Sử Dụng

#### Frontend
- **Framework**: React 18.3.1 với TypeScript
- **Công Cụ Xây Dựng**: Vite 5.4.10
- **Styling**: TailwindCSS 3.4.15
- **Quản Lý Trạng Thái**: React Context + Custom Hooks
- **Biểu Đồ**: Recharts 2.13.3
- **Định Tuyến**: React Router DOM 6.28.0
- **Đa Ngôn Ngữ**: i18next 23.16.8

#### Backend
- **Framework**: NestJS 10.0
- **Cơ Sở Dữ Liệu**: PostgreSQL (chính) + MongoDB (dự đoán)
- **ORM**: Prisma 6.1.0
- **Xác Thực**: JWT + Passport
- **Tài Liệu API**: Swagger/OpenAPI

#### Dịch Vụ ML
- **Framework**: FastAPI
- **Thư Viện ML**: Scikit-learn (Gradient Boosting)
- **XAI**: SHAP (SHapley Additive exPlanations)
- **Xử Lý Dữ Liệu**: Pandas, NumPy
- **Artifact Mô Hình**: Joblib

---

## 📅 Chức Năng Đặt Lịch Cố Vấn (Booking System)

### Tổng Quan

Hệ thống đặt lịch cố vấn cho phép sinh viên và phụ huynh đặt lịch gặp giáo viên cố vấn để thảo luận về học tập, tiến độ và các vấn đề liên quan. Hệ thống hỗ trợ cả cuộc họp trực tuyến và trực tiếp.

### Các Thành Phần Chính

#### 1. **Instructor Availability (Khả Dụng của Giáo Viên)**
- Giáo viên có thể thiết lập lịch khả dụng hàng tuần
- Hỗ trợ nhiều loại cuộc họp: online, offline, both
- Quản lý slot thời gian với capacity giới hạn

#### 2. **Appointment Booking (Đặt Lịch Hẹn)**
- Sinh viên có thể đặt trực tiếp (tự động xác nhận)
- Phụ huynh có thể đặt cho con (cần giáo viên chấp nhận)
- Hỗ trợ hủy và đặt lại lịch hẹn

#### 3. **Meeting Management (Quản Lý Cuộc Họp)**
- Theo dõi trạng thái cuộc hẹn: pending, confirmed, rejected, canceled
- Ghi nhận điểm danh và kết quả tham gia
- Tích hợp thông báo nhắc nhở

### Luồng Quy Trình Đặt Lịch

#### Đối với Sinh Viên:
1. Xem lịch khả dụng của giáo viên cố vấn
2. Chọn slot thời gian phù hợp
3. Điền thông tin mục đích gặp
4. Đặt lịch → Tự động xác nhận (status: confirmed)
5. Nhận thông báo xác nhận

#### Đối với Phụ Huynh:
1. Xem lịch khả dụng của giáo viên cố vấn của con
2. Chọn slot và thông tin liên hệ
3. Đặt lịch → Chờ giáo viên chấp nhận (status: pending)
4. Giáo viên chấp nhận → status: confirmed
5. Nhận thông báo và link meeting (nếu online)

#### Đối với Giáo Viên:
1. Thiết lập lịch khả dụng hàng tuần
2. Xem các yêu cầu đặt lịch
3. Chấp nhận/từ chối yêu cầu
4. Quản lý cuộc hẹn đã xác nhận
5. Ghi nhận điểm danh sau cuộc họp

---

## 👥 Chi Tiết Các Module

### 1. **Module Giáo Viên (Teacher/Instructor)**

#### Chức Năng Chính:
- **Quản Lý Lịch Khả Dụng**: Thiết lập slot cố vấn hàng tuần
- **Xử Lý Yêu Cầu Đặt Lịch**: Xem, chấp nhận, từ chối yêu cầu từ sinh viên/phụ huynh
- **Quản Lý Cuộc Họp**: Theo dõi trạng thái, ghi nhận điểm danh
- **Xem Hồ Sơ Sinh Viên**: Thông tin học tập, dự đoán hiệu suất
- **Gửi Thông Báo**: Cảnh báo cho sinh viên có nguy cơ

#### API Endpoints Chính:
```
GET    /instructor-availability/:instructorId          # Xem lịch khả dụng
POST   /instructor-availability/:instructorId/dates     # Thêm ngày khả dụng
POST   /instructor-availability/:instructorId/dates/:date/slots  # Thêm slot
GET    /booking/instructor/requests                     # Xem yêu cầu đặt lịch
PUT    /booking/:id/accept                              # Chấp nhận yêu cầu
PUT    /booking/:id/reject                              # Từ chối yêu cầu
```

#### Quy Trình Sử Dụng:
1. Giáo viên đăng nhập vào hệ thống
2. Thiết lập lịch cố vấn hàng tuần qua giao diện quản lý availability
3. Xem danh sách yêu cầu đặt lịch từ sinh viên/phụ huynh
4. Đối với yêu cầu từ phụ huynh: xem thông tin và quyết định chấp nhận/từ chối
5. Sau khi chấp nhận, hệ thống gửi thông báo cho booker
6. Tham gia cuộc họp theo lịch đã định
7. Ghi nhận kết quả sau cuộc họp

### 2. **Module Sinh Viên (Student)**

#### Chức Năng Chính:
- **Đặt Lịch Cố Vấn**: Đặt trực tiếp với giáo viên cố vấn
- **Xem Điểm Số**: Theo dõi kết quả học tập
- **Nhận Dự Đoán**: Xem dự báo hiệu suất tương lai
- **Nhận Thông Báo**: Cảnh báo về tiến độ học tập

#### API Endpoints Chính:
```
POST   /booking                                        # Đặt lịch hẹn
GET    /booking                                         # Xem lịch hẹn của mình
DELETE /booking/:id                                     # Hủy lịch hẹn
GET    /profile/student                                 # Xem thông tin cá nhân
```

#### Quy Trình Sử Dụng:
1. Sinh viên đăng nhập vào hệ thống
2. Xem lịch khả dụng của giáo viên cố vấn
3. Chọn slot phù hợp và điền mục đích gặp
4. Đặt lịch → Tự động xác nhận
5. Nhận thông báo xác nhận với thông tin cuộc họp
6. Tham gia cuộc họp đúng giờ
7. Xem kết quả và nhận đề xuất từ giáo viên

### 3. **Module Phụ Huynh (Parent)**

#### Chức Năng Chính:
- **Đặt Lịch Cho Con**: Đặt lịch cố vấn cho các con đã liên kết
- **Giám Sát Tiến Độ**: Xem điểm số và dự đoán của con
- **Nhận Thông Báo**: Cập nhật về hiệu suất học tập
- **Liên Hệ Giáo Viên**: Thông qua hệ thống đặt lịch

#### API Endpoints Chính:
```
POST   /booking                                        # Đặt lịch cho con
GET    /booking                                         # Xem lịch hẹn đã đặt
GET    /booking/me/parent/students                      # Xem danh sách con
DELETE /booking/:id                                     # Hủy lịch hẹn
```

#### Quy Trình Sử Dụng:
1. Phụ huynh đăng nhập và liên kết với tài khoản con
2. Xem lịch khả dụng của giáo viên cố vấn của con
3. Chọn slot và điền thông tin liên hệ
4. Đặt lịch → Chờ giáo viên chấp nhận
5. Nhận thông báo khi giáo viên chấp nhận/từ chối
6. Tham gia cuộc họp (nếu được mời) hoặc theo dõi kết quả

### 4. **Module Quản Trị Viên (Admin)**

#### Chức Năng Chính:
- **Quản Lý Người Dùng**: Tạo, chỉnh sửa tài khoản user
- **Quản Lý Quyền**: Phân quyền cho các vai trò
- **Giám Sát Hệ Thống**: Xem thống kê sử dụng
- **Quản Lý Thông Báo**: Tạo thông báo broadcast
- **Xuất Báo Cáo**: Thống kê về booking, hiệu suất

#### API Endpoints Chính:
```
GET    /admin/users                                      # Quản lý người dùng
POST   /admin/notifications                              # Tạo thông báo
GET    /admin/statistics                                 # Thống kê hệ thống
PUT    /booking/:id/status                               # Cập nhật trạng thái booking
```

#### Quy Trình Sử Dụng:
1. Admin đăng nhập với quyền cao nhất
2. Giám sát hoạt động booking trên toàn hệ thống
3. Quản lý tài khoản user và phân quyền
4. Tạo thông báo quan trọng cho toàn bộ hệ thống
5. Xuất báo cáo về tần suất booking, tỷ lệ chấp nhận, etc.

---

## 🗄️ Cấu Trúc Cơ Sở Dữ Liệu (Database Schema)

### Các Bảng Chính Liên Quan Đến Booking:

#### `InstructorAvailabilityWeek`
- `week_id`: ID tuần khả dụng
- `instructor_id`: ID giáo viên
- `week_start_date`: Ngày bắt đầu tuần

#### `InstructorAvailabilityDate`
- `date_id`: ID ngày
- `week_id`: Liên kết với tuần
- `specific_date`: Ngày cụ thể
- `is_available`: Có khả dụng hay không

#### `InstructorDailySlot`
- `slot_id`: ID slot thời gian
- `date_id`: Liên kết với ngày
- `start_time_local`: Giờ bắt đầu
- `end_time_local`: Giờ kết thúc
- `capacity`: Sức chứa (số booking tối đa)
- `is_open`: Có mở cho booking
- `meeting_type`: Loại cuộc họp (online/offline/both)
- `meeting_link`: Link meeting (cho online)
- `meeting_location`: Địa điểm (cho offline)

#### `Appointment`
- `appointment_id`: ID cuộc hẹn
- `slot_id`: Slot được book
- `booker_account_id`: ID tài khoản người đặt
- `booker_role`: Vai trò người đặt (student/parent)
- `student_id`: ID sinh viên (đối tượng được cố vấn)
- `instructor_id`: ID giáo viên
- `meeting_purpose`: Mục đích gặp
- `status`: Trạng thái (pending/confirmed/rejected/canceled)
- `meeting_type`: Loại cuộc họp
- `created_at`, `updated_at`: Timestamp

#### `AppointmentContact`
- `appointment_id`: Liên kết với appointment
- `contact_name`: Tên người liên hệ
- `contact_phone`: Số điện thoại
- `contact_email`: Email
- `relationship_to_student`: Quan hệ với sinh viên

---

## 🔗 API Endpoints Chi Tiết

### Booking Controller (`/booking`)

#### Tạo Appointment
```
POST /booking
Body: {
  "slotId": number,
  "studentId": number (cho parent),
  "meetingPurpose": string,
  "meetingType": "online" | "offline" | "both",
  "contactName": string (cho parent),
  "contactPhone": string,
  "contactEmail": string,
  "relationshipToStudent": string
}
```

#### Xem Appointments
```
GET /booking
Response: Danh sách appointments của account hiện tại
```

#### Hủy Appointment
```
DELETE /booking/:id?reason=string
```

#### Xem Yêu Cầu (Instructor)
```
GET /booking/instructor/requests?status=pending,confirmed&bookerRole=parent
```

#### Chấp Nhận Appointment
```
PUT /booking/:id/accept
Body: {
  "meetingLink": string (optional),
  "meetingLocation": string (optional)
}
```

#### Từ Chối Appointment
```
PUT /booking/:id/reject
Body: {
  "reason": string
}
```

### Instructor Availability Controller (`/instructor-availability`)

#### Xem Availability
```
GET /instructor-availability/:instructorId
```

#### Thêm Ngày Khả Dụng
```
POST /instructor-availability/:instructorId/dates
Body: {
  "dates": ["2024-01-15", "2024-01-16"],
  "isAvailable": true
}
```

#### Thêm Slot
```
POST /instructor-availability/:instructorId/dates/:date/slots
Body: [{
  "startTime": "09:00",
  "endTime": "10:00",
  "capacity": 5,
  "meetingType": "online",
  "meetingLink": "meet.google.com/abc"
}]
```

---

## 🔄 Workflow Hoạt Động

### 1. Thiết Lập Availability (Giáo Viên)
```
Giáo Viên → Chọn Tuần → Thêm Ngày → Tạo Slot → Publish
```

### 2. Đặt Lịch (Sinh Viên/Phụ Huynh)
```
Người Dùng → Xem Availability → Chọn Slot → Điền Info → Đặt Lịch → Nhận Xác Nhận
```

### 3. Xử Lý Yêu Cầu (Giáo Viên)
```
Xem Yêu Cầu → Đánh Giá → Chấp Nhận/Từ Chối → Thông Báo → Tham Gia Cuộc Họp
```

### 4. Theo Dõi & Báo Cáo (Admin)
```
Xem Thống Kê → Xuất Báo Cáo → Quản Lý Hệ Thống → Gửi Thông Báo
```

---

## 🔔 Hệ Thống Thông Báo

### Các Loại Thông Báo:
- **Appointment Created**: Khi có lịch hẹn mới
- **Appointment Accepted**: Khi giáo viên chấp nhận
- **Appointment Rejected**: Khi giáo viên từ chối
- **Appointment Reminder**: Nhắc nhở trước cuộc họp
- **At-Risk Student Alert**: Cảnh báo sinh viên có nguy cơ

### Kênh Gửi:
- **In-App**: Thông báo trong ứng dụng
- **Email**: Gửi qua email
- **SMS**: (Tương lai)

---

## 2. Chương Đồ Án: Xác Thực Buổi Cố Vấn Offline & Chống Gian Lận

### 2.1. Bài Toán Đặt Ra

Trong môi trường đại học, các buổi cố vấn học tập trực tiếp (offline) không có bằng chứng số tự động như họp trực tuyến. Điều này tạo ra nguy cơ gian lận khi giảng viên và sinh viên có thể xác nhận buổi cố vấn mà không thực sự diễn ra, ảnh hưởng trực tiếp đến tính chính xác của KPI và chất lượng đào tạo.

Hệ thống Ed_Vision cần một cơ chế xác thực:

- Khả thi trong môi trường BYOD (Bring Your Own Device)
- Không phụ thuộc phần cứng đặc thù
- Tôn trọng quyền riêng tư
- Hạn chế gian lận ở quy mô lớn

### 2.2. Nguyên Tắc Thiết Kế

Thay vì cố gắng xác minh tuyệt đối sự hiện diện vật lý (vốn bất khả thi về mặt kỹ thuật), hệ thống được thiết kế theo các nguyên tắc:

- Xác thực đa lớp linh hoạt (Flexible Multi-layer Verification)
- Đánh giá dựa trên độ tin cậy (Trust Scoring) thay vì Pass/Fail cứng
- Gian lận có thể xảy ra đơn lẻ nhưng không thể mở rộng quy mô

### 2.3. Các Lớp Xác Thực

#### 2.3.1. Dynamic QR Code (Bắt buộc - 40 điểm Trust)

Giảng viên khởi tạo buổi cố vấn, hệ thống sinh mã QR động thay đổi mỗi **3 giây**. QR chứa:
- Session token (unique per session)
- Timestamp với expiration (**15 giây**)
- HMAC signature để chống giả mạo
- One-time use flag

**Chống Fake:**
- QR chỉ valid trong 15 giây kể từ khi sinh
- Mỗi QR chỉ dùng được 1 lần
- Signature HMAC với server secret
- Rate limiting: max 3 scans/phút per device

→ Mục tiêu: Chống chụp màn hình, share QR và replay attacks. 3 giây đủ nhanh để ngăn chặn việc capture và forward, nhưng không quá ngắn gây khó khăn scan.

#### 2.3.2. Device Binding (Bắt buộc - 30 điểm Trust)

Mỗi tài khoản sinh viên được gắn với device fingerprint chi tiết:
- User Agent + Screen Resolution + Timezone
- Canvas Fingerprinting (anti-bot)
- WebGL Fingerprinting
- Hardware concurrency + Device memory

**Chống Fake:**
- Thay đổi device yêu cầu xác thực 2FA (OTP + email)
- Detect VM/Emulator qua hardware checks
- Monitor device changes qua audit logs
- Max 1 tài khoản per device fingerprint

→ Mục tiêu: Ngăn một device điểm danh cho nhiều tài khoản.

#### 2.3.3. Network Context (Bắt buộc - 20 điểm Trust)

Hệ thống kiểm tra đa lớp network context:
- **IP Whitelist**: Dải IP public của trường (configurable)
- **WiFi SSID Detection**: Scan và verify campus WiFi networks
- **Network Latency**: Measure ping đến campus gateway
- **DNS Resolution**: Verify internal DNS servers

**Chống Fake:**
- IP spoofing khó qua VPN (nhưng có thể detect VPN patterns)
- WiFi SSID không thể fake từ xa
- Latency checks: campus WiFi < 10ms, off-campus > 50ms
- Certificate pinning cho internal services

→ Mục tiêu: Tăng độ tin cậy khi sinh viên ở trong khuôn viên.

#### 2.3.4. GPS Geofencing (Tùy chọn - 10 điểm Trust)

GPS chỉ dùng để xác nhận trong khuôn viên trường với anti-spoofing measures:
- **Multi-reading validation**: 3 readings trong 10 giây
- **Accuracy filtering**: Chỉ accept < 50m accuracy
- **Speed validation**: Detect impossible movement (> 50km/h)
- **Boundary checks**: Strict campus polygon (không chỉ radius)
- **Altitude validation**: Campus elevation range

**Chống Fake:**
- **Sensor Fusion**: Kết hợp GPS + WiFi + IP
- **Time-based validation**: Compare với session start time
- **Pattern detection**: Flag suspicious coordinate patterns
- **Fallback mode**: Nếu GPS bị spoof, trust score giảm về 0 cho GPS

→ Mục tiêu: Ngăn xác nhận từ nhà riêng, nhưng không phải lớp chính.

#### 2.3.5. Behavioral Biometrics (Bonus - 5 điểm Trust)

Phân tích hành vi người dùng để detect anomalies:
- **Typing patterns**: Keystroke dynamics khi nhập
- **Touch gestures**: Mobile touch patterns
- **Session duration**: Thời gian scan QR (quá nhanh = suspicious)
- **App usage patterns**: Detect automation scripts

**Chống Fake:**
- Detect bot/script qua timing analysis
- Behavioral fingerprinting
- Continuous monitoring trong session

---

### 2.4. Trust Scoring Algorithm

```typescript
function calculateTrustScore(factors: VerificationFactors): number {
  let score = 0;
  
  // Dynamic QR (40 points)
  if (factors.qrValid && factors.qrFresh && factors.qrNotReused) {
    score += 40;
  } else if (factors.qrValid) {
    score += 20; // Partial credit for valid but stale QR
  }
  
  // Device Binding (30 points)
  if (factors.deviceMatch && !factors.deviceChangedRecently) {
    score += 30;
  } else if (factors.deviceMatch) {
    score += 15; // Reduced for recently changed device
  }
  
  // Network Context (20 points)
  if (factors.campusIP && factors.campusWiFi) {
    score += 20;
  } else if (factors.campusIP || factors.campusWiFi) {
    score += 10;
  }
  
  // GPS Geofencing (10 points - optional)
  if (factors.gpsValid && factors.gpsAccurate && !factors.gpsSpoofDetected) {
    score += 10;
  }
  
  // Behavioral (5 points - bonus)
  if (factors.behaviorNormal) {
    score += 5;
  }
  
  // Anti-fraud penalties
  if (factors.multipleFailedAttempts) score -= 20;
  if (factors.suspiciousTiming) score -= 15;
  if (factors.vpnDetected) score -= 10;
  
  return Math.max(0, Math.min(100, score));
}
```

**Trust Levels:**
- **90-100**: High Trust (Auto-approve)
- **70-89**: Medium Trust (Require instructor review)
- **50-69**: Low Trust (Flag for manual verification)
- **0-49**: Suspicious (Reject + Alert)

---

### 2.5. Anti-Fraud Measures

#### Rate Limiting & Abuse Detection:
- Max 3 attendance attempts per hour per student
- Max 10 QR scans per minute per IP
- Detect brute force qua failed attempt patterns
- Auto-ban suspicious IPs/devices

#### Audit Trail & Monitoring:
- Log tất cả verification attempts
- Real-time anomaly detection
- Instructor alerts cho suspicious patterns
- Monthly fraud reports cho admin

#### Privacy Protection:
- GPS data chỉ lưu trong session (không persistent)
- Device fingerprints hashed và salted
- Network data anonymized
- User có quyền opt-out GPS (nhưng trust score giảm)

---

```
┌────────────────────────┐
│ Instructor │
│ (Web / Mobile App) │
└───────────┬────────────┘
            │ Start Session
            ▼
┌────────────────────────┐
│ Ed_Vision Backend │
│ (NestJS API Gateway) │
│ │
│ - Create Session │
│ - Generate Dynamic QR │◄─────────────┐
│ - Sign Token (HMAC) │ │ QR Refresh (5s)
│ - Init Trust Engine │ │
└───────────┬────────────┘ │
            │ │
            ▼ │
┌────────────────────────┐ │
│ Student Device │◄─────────────┘
│ (Mobile / Browser) │ Scan QR
│ │
│ - Auth (JWT) │
│ - Device Fingerprint │
│ - Network Context │
│ - Optional GPS │
│ - Behavioral Data │
└───────────┬────────────┘
            │ Attendance Request
            ▼
┌────────────────────────┐
│ Verification Engine │
│ │
│ + Dynamic QR Valid │ 
│ + Device Match │ 
│ + Network Context │ 
│ + GPS Validation │ 
│ + Behavioral Check │
│ + Anti-Fraud Rules │
│ │
│ → Trust Score (0–100) │
│ → Risk Assessment │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│ Attendance Result │
│ - High/Med/Low Trust │
│ - Auto/Manual Review │
│ - Audit Log Entry │
│ - KPI Impact │
└────────────────────────┘
```

---

## 🔒 Bảo Mật & Phân Quyền

### Vai Trò Người Dùng:
- **Student**: Đọc/ghi booking của mình, xem profile
- **Parent**: Đọc/ghi booking cho con, xem profile con
- **Instructor**: Quản lý availability, xử lý booking, xem student data
- **Admin**: Toàn quyền quản lý hệ thống

### Xác Thực:
- JWT Token-based authentication
- Role-based access control (RBAC)
- API Guards cho từng endpoint

---

## 📊 Thống Kê & Báo Cáo

### Chỉ Số Theo Dõi:
- **Tỷ Lệ Booking**: Số lượng booking theo thời gian
- **Tỷ Lệ Chấp Nhận**: Phụ huynh được chấp nhận / tổng yêu cầu
- **Tỷ Lệ Tham Gia**: Số cuộc họp có điểm danh
- **Phản Hồi Giáo Viên**: Thời gian phản hồi yêu cầu
- **Sử Dụng Hệ Thống**: Số lượng user active

### Báo Cáo Xuất:
- Báo cáo hàng tuần/tháng về hoạt động booking
- Thống kê hiệu suất giáo viên cố vấn
- Báo cáo sử dụng hệ thống

---

*Tài liệu này được tạo tự động dựa trên phân tích mã nguồn hệ thống EdVision. Cập nhật lần cuối: December 19, 2025*</content>
<parameter name="filePath">c:\Users\cntt2\Ed_Vision\System_Documentation.md