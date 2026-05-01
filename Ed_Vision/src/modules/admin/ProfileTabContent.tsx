import { useState, useEffect } from 'react';
import StudentDetail from './StudentDetail';
import TeacherDetailProfile from './TeacherDetailProfile';
import LoadingSpinner from '@/components/ui/admin/LoadingSpinner';
import type { AccountData } from '@/services/api/accountService';

export interface ProfileTabContentProps {
  account: AccountData;
  role: string;
}

export default function ProfileTabContent({ account, role }: ProfileTabContentProps) {
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [resolvedStudentId, setResolvedStudentId] = useState<number | null>(null);
  const [resolvedInstructorId, setResolvedInstructorId] = useState<number | null>(null);

  const handleRetry = () => {
    setIsRetrying(true);
    setError(null);
    // Reset retry state after a short delay
    setTimeout(() => setIsRetrying(false), 500);
  };

  // Resolve studentId from accountId if needed
  useEffect(() => {
    const resolveIds = async () => {
      // If we already have the IDs from account data, use them
      if (account.student?.studentId) {
        setResolvedStudentId(account.student.studentId);
        return;
      }
      if (account.instructor?.instructorId) {
        setResolvedInstructorId(account.instructor.instructorId);
        return;
      }

      // Otherwise, for now, use accountId as fallback
      // TODO: Backend should return studentId/instructorId in account response
      if (role === 'student' || role === 'Sinh viên') {
        setResolvedStudentId(account.accountId);
        setError('Backend chưa trả về studentId. Vui lòng liên hệ backend team để thêm studentId vào response của /admin/accounts/:id');
      } else if (role === 'teacher' || role === 'Giảng viên') {
        setResolvedInstructorId(account.accountId);
        setError('Backend chưa trả về instructorId. Vui lòng liên hệ backend team để thêm instructorId vào response của /admin/accounts/:id');
      }
    };

    resolveIds();
  }, [account, role]);

  // Handle error state
  if (error && !isRetrying) {
    return (
      <div 
        className="flex flex-col items-center justify-center py-12"
        role="alert"
        aria-live="polite"
      >
        <i className="fas fa-exclamation-triangle text-yellow-500 text-5xl mb-4"></i>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Vấn đề Backend</h3>
        <p className="text-gray-600 mb-4 text-center max-w-md">{error}</p>
        
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 max-w-2xl">
          <div className="flex">
            <div className="flex-shrink-0">
              <i className="fas fa-code text-yellow-400 text-xl"></i>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">Hướng dẫn cho Backend Team:</h4>
              <div className="text-sm text-yellow-700 space-y-2">
                <p>API endpoint <code className="bg-yellow-100 px-1 rounded">/admin/accounts/:id</code> cần trả về:</p>
                <pre className="bg-yellow-100 p-2 rounded text-xs overflow-x-auto">
{`{
  "accountId": 65,
  "student": {
    "studentId": 123,  // ← Cần thêm field này
    "studentCode": "...",
    ...
  },
  "instructor": {
    "instructorId": 456,  // ← Cần thêm field này
    "employeeCode": "...",
    ...
  }
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>
        
        <button 
          onClick={handleRetry}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <i className="fas fa-redo mr-2"></i>
          Thử lại
        </button>
      </div>
    );
  }

  // Handle loading state during retry
  if (isRetrying) {
    return <LoadingSpinner text="Đang tải lại hồ sơ..." size="lg" />;
  }

  // Render StudentDetail for student role
  if (role === 'student' || role === 'Sinh viên') {
    if (!resolvedStudentId) {
      return <LoadingSpinner text="Đang xác định student ID..." size="lg" />;
    }
    
    return (
      <div 
        role="tabpanel"
        id="profile-panel"
        aria-labelledby="profile-tab"
      >
        <StudentDetail studentId={resolvedStudentId.toString()} />
      </div>
    );
  }

  // Render TeacherDetailProfile for teacher role
  if (role === 'teacher' || role === 'Giảng viên') {
    if (!resolvedInstructorId) {
      return <LoadingSpinner text="Đang xác định instructor ID..." size="lg" />;
    }
    
    return (
      <div 
        role="tabpanel"
        id="profile-panel"
        aria-labelledby="profile-tab"
      >
        <TeacherDetailProfile teacherId={resolvedInstructorId.toString()} />
      </div>
    );
  }

  // Render informational message for unsupported roles
  return (
    <div 
      className="flex flex-col items-center justify-center py-12"
      role="tabpanel"
      id="profile-panel"
      aria-labelledby="profile-tab"
    >
      <div className="text-center max-w-md">
        <i className="fas fa-info-circle text-gray-400 text-5xl mb-4"></i>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Hồ sơ không khả dụng
        </h3>
        <p className="text-gray-600">
          Hồ sơ chi tiết chỉ khả dụng cho tài khoản Sinh viên và Giảng viên
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Vai trò hiện tại: <span className="font-medium">{role}</span>
        </p>
      </div>
    </div>
  );
}
