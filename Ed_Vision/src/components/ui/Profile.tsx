// This file has been deprecated. The profile UI has been moved into module-specific
// pages: `src/modules/student/StudentProfile.tsx` and `src/modules/teacher/TeacherProfile.tsx`.
// If you still import this file, update imports to the module pages. To avoid accidental
// usage this file throws at runtime.

export default function DeprecatedProfile(): never {
  throw new Error(
    'Deprecated: use /student/profile or /teacher/profile pages (StudentProfile/TeacherProfile).'
  );
}
