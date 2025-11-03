# Account Management Integration - Frontend & Backend

## ✅ Đã hoàn thành

### 1. Backend API (NestJS)
**Location:** `ed_vision_backend/src/admin_be/account-management/`

**Endpoints:**
- `GET /admin/accounts` - Lấy danh sách tài khoản (có filter, pagination)
- `GET /admin/accounts/:id` - Lấy chi tiết tài khoản
- `POST /admin/accounts` - Tạo tài khoản mới
- `PATCH /admin/accounts/:id` - Cập nhật tài khoản
- `DELETE /admin/accounts/:id` - Xóa tài khoản

**Query Parameters (GET /admin/accounts):**
- `search` - Tìm kiếm theo tên, email
- `role` - Lọc theo vai trò (admin, teacher, student, parent, leader)
- `status` - Lọc theo trạng thái (active, inactive, blocked)
- `school` - Lọc theo trường/khoa
- `page` - Trang hiện tại (mặc định: 1)
- `limit` - Số lượng/trang (mặc định: 10)

**Response Format:**
```typescript
{
  data: AccountData[],
  meta: {
    total: number,
    page: number,
    limit: number,
    totalPages: number,
    hasNextPage: boolean,
    hasPreviousPage: boolean
  }
}
```

**AccountData Structure:**
```typescript
{
  accountId: number,
  email: string,
  status: string,
  createdAt: string,
  lastLoginAt?: string,
  role?: {
    id: number,
    code: string,
    name: string
  },
  profile?: {
    fullName: string,
    dateOfBirth?: string,
    gender?: string,
    address?: string,
    avatarUrl?: string,
    nationality?: string
  },
  student?: {
    studentCode: string,
    major?: string,
    cohortYear?: number,
    classId?: number
  },
  instructor?: {
    employeeCode: string,
    academicTitle?: string,
    position?: string,
    departmentId?: number,
    departmentName?: string
  },
  parent?: {
    parentId: number,
    phoneNumber: string,
    relationshipType?: string
  }
}
```

### 2. Frontend Service Layer
**Location:** `Ed_Vision/src/services/api/`

**Files created:**
- `apiClient.ts` - Axios instance với interceptors (auth token, error handling)
- `accountService.ts` - Service methods cho Account Management

**AccountService Methods:**
- `getAccounts(filters)` - Lấy danh sách với filter
- `getAccountById(id)` - Lấy chi tiết
- `createAccount(data)` - Tạo mới
- `updateAccount(id, data)` - Cập nhật
- `deleteAccount(id)` - Xóa
- `lockAccount(id)` - Khóa tài khoản (status = blocked)
- `unlockAccount(id)` - Mở khóa (status = active)

**Auto features:**
- Authorization header tự động (Bearer token)
- Error handling (401 redirect to login)
- TypeScript types đầy đủ

### 3. Frontend UI Component
**Location:** `Ed_Vision/src/modules/admin/AccountManagement.tsx`

**Changes:**
- ❌ Removed hardcoded data (8 dummy users)
- ✅ Integrated with API service
- ✅ Real-time filtering với debounce
- ✅ Server-side pagination
- ✅ Lock/Unlock account functionality
- ✅ Toast notifications for actions
- ✅ Error handling & loading states
- ✅ Navigate to view/edit pages

**Features:**
- Search by name, email, code
- Filter by role, status, school
- Pagination (10 items/page)
- Lock/Unlock accounts
- View & Edit navigation
- Loading spinner
- Empty state message

### 4. Configuration
**CORS:** Already configured in `main.ts`
```typescript
app.enableCors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
});
```

**Environment Variables:** `.env`
```
VITE_API_URL=http://localhost:3000
```

## 🚀 Cách sử dụng

### Start Backend:
```bash
cd ed_vision_backend
npm run start:dev
# Backend runs on http://localhost:3000
```

### Start Frontend:
```bash
cd Ed_Vision
npm run dev
# Frontend runs on http://localhost:5173
```

### Test API:
```bash
# Get accounts
curl http://localhost:3000/admin/accounts?page=1&limit=10

# Get with filters
curl http://localhost:3000/admin/accounts?role=student&status=active&search=nguyen
```

## 📝 Notes

### Data Mapping:
- `student.studentCode` → Mã số sinh viên
- `instructor.employeeCode` → Mã số giảng viên
- `accountId` → Mã tài khoản (nếu không có student/instructor code)
- `instructor.departmentName` → Trường/Khoa
- `student.major` → Chuyên ngành (hiển thị thay school)
- `role.name` → Tên vai trò (Quản trị viên, Giảng viên, etc.)

### Status Values:
- `active` → "Hoạt động" (green badge)
- `inactive` → "Vắng mặt" (yellow badge)
- `blocked` → "Đã khóa" (red badge)

### Role Codes:
- `admin` → Quản trị viên (red badge, bold)
- `leader` → Lãnh đạo (red badge, bold)
- `teacher` → Giảng viên (green badge)
- `student` → Sinh viên (orange badge)
- `parent` → Phụ huynh (pink badge)

## ⚠️ TODO (Optional)

1. **Authentication Guard** - Enable guards in controller:
   ```typescript
   @UseGuards(JwtAuthGuard, RolesGuard)
   @Roles('admin', 'leader')
   ```

2. **Add school filter to backend** - Currently school filter is frontend-only, backend needs to map to departments/programs

3. **Create pages:**
   - `/admin/accounts/add` - Thêm tài khoản mới
   - `/admin/accounts/:id` - Xem chi tiết
   - `/admin/accounts/edit/:id` - Chỉnh sửa

4. **Confirmation dialogs** - Add confirmation before lock/unlock

5. **Better error messages** - Display specific API errors to user

## ✅ Testing Checklist

- [ ] Backend API returns data
- [ ] Frontend loads data from API
- [ ] Search filtering works
- [ ] Role filtering works
- [ ] Status filtering works
- [ ] Pagination works
- [ ] Lock account works
- [ ] Unlock account works
- [ ] Toast notifications show
- [ ] Loading spinner shows
- [ ] Empty state shows when no results
- [ ] Navigate to add page works
- [ ] Navigate to view page works
- [ ] Navigate to edit page works
