import { useState, useEffect, useCallback } from 'react';
import surveyService from '@/services/api/surveyService';

interface SurveyCheckResult {
  isLoading: boolean;
  hasCompletedInputSurvey: boolean;
  pendingInputSurveyId: number | null;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook để kiểm tra student đã hoàn thành survey input (khảo sát đầu vào) chưa
 * Chỉ áp dụng cho role student
 */
export function useInputSurveyCheck(enabled: boolean = true): SurveyCheckResult {
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedInputSurvey, setHasCompletedInputSurvey] = useState(false);
  const [pendingInputSurveyId, setPendingInputSurveyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Đọc cache NGAY LẬP TỨC mỗi lần render (không async)
  // Điều này đảm bảo giá trị mới nhất từ localStorage được sử dụng
  const getCachedValue = useCallback((): { hasCompleted: boolean | null; pendingId: number | null } => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        const user = JSON.parse(raw);
        if (typeof user.hasCompletedInputSurvey === 'boolean') {
          return {
            hasCompleted: user.hasCompletedInputSurvey,
            pendingId: user.pendingInputSurveyId ?? null,
          };
        }
      }
    } catch (e) {
      // ignore
    }
    return { hasCompleted: null, pendingId: null };
  }, []);

  // Sync state với cache mỗi lần render
  const cached = getCachedValue();
  const effectiveHasCompleted = cached.hasCompleted !== null ? cached.hasCompleted : hasCompletedInputSurvey;

  const checkSurveyStatus = useCallback(async () => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }
    
    // Nếu đã có cache, sử dụng nó và không gọi API
    const cachedNow = getCachedValue();
    if (cachedNow.hasCompleted !== null) {
      setHasCompletedInputSurvey(cachedNow.hasCompleted);
      setPendingInputSurveyId(cachedNow.pendingId);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const status = await surveyService.checkSurveyStatus();

      setHasCompletedInputSurvey(status.hasCompletedInputSurvey);
      setPendingInputSurveyId(status.pendingInputSurvey?.surveyId ?? null);

      // Cache into localStorage.user for fast subsequent checks
      try {
        const raw = localStorage.getItem('user');
        if (raw) {
          const user = JSON.parse(raw);
          user.hasCompletedInputSurvey = !!status.hasCompletedInputSurvey;
          user.pendingInputSurveyId = status.pendingInputSurvey?.surveyId ?? null;
          localStorage.setItem('user', JSON.stringify(user));
        }
      } catch (e) {
        // ignore cache write failures
      }
    } catch (err: any) {
      console.error('Failed to check survey status:', err);
      // Nếu 401 thì có thể chưa đăng nhập - không coi là lỗi
      if (err?.response?.status === 401) {
        setHasCompletedInputSurvey(true); // Cho qua, sẽ bị redirect bởi auth
      } else {
        setError(err?.message || 'Không thể kiểm tra trạng thái khảo sát');
        // Default: cho phép truy cập nếu API lỗi
        setHasCompletedInputSurvey(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, [enabled, getCachedValue]);

  useEffect(() => {
    checkSurveyStatus();
  }, [checkSurveyStatus]);

  return {
    isLoading: cached.hasCompleted !== null ? false : isLoading, // Nếu có cache thì không loading
    hasCompletedInputSurvey: effectiveHasCompleted,
    pendingInputSurveyId: cached.pendingId ?? pendingInputSurveyId,
    error,
    refetch: checkSurveyStatus,
  };
}

/**
 * Kiểm tra nhanh survey status (không dùng hook)
 * Dùng cho login flow
 */
export async function checkInputSurveyCompleted(): Promise<{
  completed: boolean;
  pendingSurveyId: number | null;
}> {
  try {
    const status = await surveyService.checkSurveyStatus();
    return {
      completed: status.hasCompletedInputSurvey,
      pendingSurveyId: status.pendingInputSurvey?.surveyId ?? null,
    };
  } catch (err: any) {
    console.error('Failed to check survey status:', err);
    // Nếu lỗi, cho phép truy cập (graceful degradation)
    return {
      completed: true,
      pendingSurveyId: null,
    };
  }
}
