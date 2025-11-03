# Admin Backend Modules - Structure Overview

## Complete Module List (10 modules)

### ✅ Full Implementation (4 modules)
These modules include: dto/, models/, service, controller, module, index.ts

1. **account-management** - Quản lý tài khoản
2. **student-management** - Quản lý sinh viên
3. **instructor-management** - Quản lý giảng viên
4. **survey-management** - Quản lý câu hỏi khảo sát (SurveyQuestion)

### 📦 Structure Only (6 modules)
These modules include: dto/, models/ only (service/controller will be implemented later)

5. **statistics-overview** - Thống kê tổng quát
   - DTOs: `StatisticsFilterDto`
   - Models: `StatisticsResponse`, `UserGrowthData`, `DepartmentStatistics`, `StatisticsOverview`

6. **leadership-reports** - Báo cáo lãnh đạo
   - DTOs: `ReportFilterDto`, `GenerateReportDto`
   - Models: `ReportResponse`, `ReportListResponse`, `AcademicReportData`, `AttendanceReportData`

7. **ml-results** - Kết quả học máy
   - DTOs: `MLResultFilterDto`, `CreateMLPredictionDto`
   - Models: `MLResultResponse`, `MLResultListResponse`, `StudentPerformancePrediction`, `DropoutPrediction`

8. **notification-management** - Quản lý thông báo
   - DTOs: `CreateNotificationDto`, `UpdateNotificationDto`, `NotificationFilterDto`
   - Models: `NotificationResponse`, `NotificationListResponse`, `NotificationStats`, `UserNotification`

9. **content-approval** - Phê duyệt nội dung
   - DTOs: `SubmitForApprovalDto`, `ReviewContentDto`, `ContentApprovalFilterDto`
   - Models: `ContentApprovalResponse`, `ContentApprovalListResponse`, `ApprovalStats`, `ContentHistory`

10. **role-permissions** - Phân quyền
    - DTOs: `CreateRoleDto`, `UpdateRoleDto`, `AssignPermissionsDto`, `CreatePermissionDto`, `RoleFilterDto`
    - Models: `RoleResponse`, `RoleListResponse`, `PermissionResponse`, `RoleWithPermissions`, `PermissionsByResource`

## Folder Structure

```
src/admin_be/
├── account-management/          ✅ FULL
│   ├── dto/
│   ├── models/
│   ├── account-management.service.ts
│   ├── account-management.controller.ts
│   ├── account-management.module.ts
│   └── index.ts
├── student-management/          ✅ FULL
├── instructor-management/       ✅ FULL
├── survey-management/           ✅ FULL
├── statistics-overview/         📦 STRUCTURE ONLY
│   ├── dto/
│   │   └── statistics-filter.dto.ts
│   └── models/
│       └── statistics-response.type.ts
├── leadership-reports/          📦 STRUCTURE ONLY
│   ├── dto/
│   │   └── report-filter.dto.ts
│   └── models/
│       └── report-response.type.ts
├── ml-results/                  📦 STRUCTURE ONLY
│   ├── dto/
│   │   └── ml-result-filter.dto.ts
│   └── models/
│       └── ml-result-response.type.ts
├── notification-management/     📦 STRUCTURE ONLY
│   ├── dto/
│   │   └── notification.dto.ts
│   └── models/
│       └── notification-response.type.ts
├── content-approval/            📦 STRUCTURE ONLY
│   ├── dto/
│   │   └── content-approval.dto.ts
│   └── models/
│       └── content-approval-response.type.ts
└── role-permissions/            📦 STRUCTURE ONLY
    ├── dto/
    │   └── role-permission.dto.ts
    └── models/
        └── role-permission-response.type.ts
```

## Next Steps for Structure-Only Modules

When ready to implement, each module needs:

1. **Service** (`<module-name>.service.ts`)
   - CRUD operations
   - Business logic
   - Prisma database queries

2. **Controller** (`<module-name>.controller.ts`)
   - REST endpoints
   - Route handlers
   - DTOs validation

3. **Module** (`<module-name>.module.ts`)
   - NestJS module definition
   - Import PrismaModule
   - Export service

4. **Index** (`index.ts`)
   - Export all DTOs, Models, Service, Controller, Module

## Notes

- All files formatted with Prettier (LF line endings)
- DTOs use class-validator decorators
- Models use TypeScript interfaces
- Following NestJS best practices
- Ready for database schema integration
