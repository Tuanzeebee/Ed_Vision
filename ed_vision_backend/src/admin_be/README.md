# Admin Backend Structure

## 📁 Current Structure

```
admin_be/
└── account-management/              ✅ DONE
    ├── dto/
    │   ├── create-account.dto.ts
    │   ├── update-account.dto.ts
    │   └── account-filter.dto.ts
    ├── models/
    │   ├── account-response.type.ts
    │   └── account-list.type.ts
    ├── account-management.controller.ts
    ├── account-management.service.ts
    ├── account-management.module.ts
    └── index.ts
```

## 📋 Planned Modules

### 1. Dropdown: Quản lý
- ✅ **account-management** - Quản lý tài khoản (DONE)
- ✅ **student-management** - Quản lý sinh viên (DONE)
- 🚧 **instructor-management** - Quản lý giảng viên (40% - DTO & Models done)
- ⏳ **survey-management** - Quản lý khảo sát

### 2. Dropdown: Dữ liệu & Báo cáo
- ⏳ **dashboard** - Trang chủ / Thống kê tổng quát
- ⏳ **leadership-reports** - Báo cáo lãnh đạo
- ⏳ **ml-results** - Kết quả học máy

### 3. Dropdown: Quản lý hệ thống
- ⏳ **notification-management** - Quản lý thông báo
- ⏳ **content-approval** - Phê duyệt nội dung
- ⏳ **permission-management** - Phân quyền

## 🎯 API Endpoints (account-management)

### Endpoints
- `GET /admin/accounts` - Lấy danh sách tài khoản (có filter, pagination)
- `GET /admin/accounts/:id` - Lấy chi tiết 1 tài khoản
- `POST /admin/accounts` - Tạo tài khoản mới
- `PATCH /admin/accounts/:id` - Cập nhật tài khoản
- `DELETE /admin/accounts/:id` - Xóa tài khoản
- `PATCH /admin/accounts/:id/lock` - Khóa tài khoản
- `PATCH /admin/accounts/:id/unlock` - Mở khóa tài khoản

### Features
- ✅ Prisma ORM integration
- ✅ Password hashing with bcrypt
- ✅ Validation with class-validator
- ✅ Pagination and filtering
- ✅ Relations (role, profile, student, instructor, parent)
- ⏳ JWT Authentication (commented out, will add later)
- ⏳ Role-based access control (commented out, will add later)

## 📝 Notes

### Database Relations
- Account → Role (roleRel)
- Account → Profile (1:1)
- Account → Student (1:1)
- Account → Instructor (1:1)
- Account → Parent (1:1)
- Student → ClassGroup → Program
- Instructor → Department

### Field Mappings
- `student.major` mapped from `student.major` or `student.classGroup.program.program_name`
- `instructor.departmentName` mapped from `instructor.department.name`
- Profile does NOT have `phone_number` field
- Role primary key is `id` (not `role_id`)

### TODO
1. Create guards (JwtAuthGuard, RolesGuard) and decorators (Roles)
2. Add error handling middleware
3. Add logging
4. Add API documentation (Swagger)
5. Add unit tests
6. Create remaining modules
