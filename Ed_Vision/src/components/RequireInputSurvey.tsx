import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useInputSurveyCheck } from '@/hooks/useInputSurveyCheck';

interface Props {
  children: React.ReactNode;
}

/**
 * Wrapper component để đảm bảo student đã hoàn thành survey input
 * Nếu chưa hoàn thành → redirect về /student/survey
 * Chỉ áp dụng cho role student
 */
export default function RequireInputSurvey({ children }: Props) {
  const location = useLocation();
  
  // Lấy thông tin user từ localStorage
  const getUserRole = (): string => {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return '';
      const user = JSON.parse(raw);
      return (user?.roleRel?.code || user?.role || '').toString().toLowerCase();
    } catch {
      return '';
    }
  };

  const role = getUserRole();
  const isStudent = role === 'student' || role === 'student_role';
  
  // Chỉ check nếu là student và không phải đang ở trang survey
  const isSurveyPage = location.pathname.startsWith('/student/survey');
  const shouldCheck = isStudent && !isSurveyPage;

  const { isLoading, hasCompletedInputSurvey } = useInputSurveyCheck(shouldCheck);

  // DEBUG
  console.log('[RequireInputSurvey]', {
    path: location.pathname,
    isStudent,
    isSurveyPage,
    shouldCheck,
    isLoading,
    hasCompletedInputSurvey,
  });

  // Nếu không phải student hoặc đang ở trang survey → render children
  if (!isStudent || isSurveyPage) {
    return <>{children}</>;
  }

  // Đang loading → show loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang kiểm tra thông tin...</p>
        </div>
      </div>
    );
  }

  // Chưa hoàn thành survey input → redirect
  if (!hasCompletedInputSurvey) {
    return <Navigate to="/student/survey" state={{ from: location, mandatory: true }} replace />;
  }

  // Đã hoàn thành → render children
  return <>{children}</>;
}
