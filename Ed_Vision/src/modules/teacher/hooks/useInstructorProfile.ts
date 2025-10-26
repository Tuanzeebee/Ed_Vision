import { useState, useEffect } from 'react';
import { apiFetch } from '../../../services/api/fetch';

interface InstructorProfile {
  instructor_id: number;
  account_id: number;
  employee_code: string;
  academic_title?: string;
  position?: string;
  department_id?: number;
  status?: string;
}

/**
 * Hook to get instructor profile from the logged-in account
 * Returns instructor_id based on the account_id from localStorage
 */
export function useInstructorProfile() {
  const [instructorId, setInstructorId] = useState<number | null>(null);
  const [accountId, setAccountId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInstructorProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get user from localStorage
        const raw = localStorage.getItem('user');
        if (!raw) {
          throw new Error('Chưa đăng nhập. Vui lòng đăng nhập lại.');
        }

        const user = JSON.parse(raw);
        const userId = user?.account_id;
        if (!userId) {
          throw new Error('Không tìm thấy account_id trong thông tin user');
        }

        setAccountId(userId);

        // Fetch instructor profile from backend
        const data: InstructorProfile = await apiFetch(`/instructor-availability/profile/${userId}`);
        
        if (!data || !data.instructor_id) {
          throw new Error('Không tìm thấy instructor_id trong dữ liệu trả về');
        }

        setInstructorId(data.instructor_id);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Lỗi không xác định khi tải thông tin giảng viên';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchInstructorProfile();
  }, []);

  return {
    instructorId,
    accountId,
    loading,
    error,
  };
}
