import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { Suspense, useEffect } from "react";
import { initializePermissions } from "@/services/permissionService";
import BookAppointmentStepWrapper from "@/modules/parent/BookAppointmentStepWrapper";
import AllAppointments from "@/modules/booking/AllAppointments";
import StudentDetails from "./modules/parent/Parent_StudentDetails";
import AccountManagement from "./modules/admin/AccountManagement";
import AddAccount from "./modules/admin/AddAccount";
import AccountDetailPage from "./modules/admin/AccountDetailPage";
import AdminOverviewDashboard from "./modules/admin/AdminOverviewDashboard";
import TeacherSubjects from "./modules/admin/TeacherSubjects";
import TeacherRatings from "./modules/admin/TeacherRatings";
import TeacherPerformance from "./modules/admin/TeacherPerformance";
import TeacherSchedule from "./modules/admin/TeacherSchedule";
import TeacherSupportHistory from "./modules/admin/TeacherSupportHistory";
import QuestionManagement from "./modules/admin/QuestionManagement";
import AddQuestion from "./modules/admin/AddQuestion";
import GeneralStatistics from "./modules/admin/GeneralStatistics";
import PermissionManagement from "./modules/admin/PermissionManagement";
import RolePermissionManagement from "./modules/admin/RolePermissionManagement";
import NotificationManagement from "./modules/admin/NotificationManagement";
import NotificationPage from "./pages/NotificationPage";

import GradeForecastLanding from "@/modules/student/GradeForecastLanding";
import StudentLandingV2 from "@/modules/student/landingPage/src/App";
import StudentCourseOverview from "@/modules/student/StudentCourseOverview";

// New auth components (some components navigate to /auth/* so provide routes)
import AuthStudentLogin from "@/modules/auth/StudentLogin";
import AuthStudentRegister from "@/modules/auth/StudentRegister";
import AuthStudentOTPVerification from "@/modules/auth/StudentOTPVerification";
import AuthForgotPassword from "@/modules/auth/ForgotPassword";
import AuthResetPassword from "@/modules/auth/ResetPassword";
import TeacherDashboard from "@/modules/teacher/TeacherDashboard";
import ClassManagement from "@/modules/teacher/ClassManagement";
import GradeManagement from "@/modules/teacher/GradeManagement";
import PredictionViewV2 from "@/modules/teacher/pages/PredictionViewV2";
import TeacherReport from "@/modules/teacher/TeacherReport";
import UploadTranscript from "./modules/student/UploadTranscript";
import AdjustParameters from "./modules/student/AdjustParameters";
import InstructionsPage from "./modules/student/InstructionsPage";
import AcademicPlanningDashboard from "./modules/student/AcademicPlanningDashboard";
import CourseDetailView from "./modules/student/CourseDetailView";
import FinancialSurveyStep1 from "./modules/student/FinancialSurveyStep1";
import ChooseMascot from "./modules/student/ChooseMascot";
import LearningAdventure from "./modules/student/LearningAdventure";
import TeacherAppointmentDashboard from "@/modules/teacher/TeacherAppointmentDashboard";
import ChatWithTeachers from "./modules/parent/ChatWithTeachers";
import ProtectedRoute from "@/components/ProtectedRoute";
import RequireInputSurvey from "@/components/RequireInputSurvey";
import ParentDashboard from "./modules/parent/ParentDashboard";
import { StudentSurveyManagement } from "./modules/teacher";
import AuthRedirectWrapper from "@/components/AuthRedirectWrapper";
import ChatStudent from "./modules/student/ChatStudent";
import BookingScheduler from "./modules/booking/BookingScheduler";
import LearningSpace from "./modules/student/LearningSpace";
import StudentProfilePage from "./modules/profile/StudentProfilePage";
import ParentProfilePage from "./modules/profile/ParentProfilePage";
import ProfileRedirect from "./modules/profile/ProfileRedirect";
import "./modules/student/styles/learningSpace.css";
import MeetingDetailView from "./modules/teacher/MeetingDetailView";
import CalendarOverview from "./modules/teacher/CalendarOverview";
import ToeicRepositoryImport from "./modules/teacher/ToeicRepositoryImport";
import ToeicPracticeQuestionImport from "./modules/teacher/ToeicPracticeQuestionImport";
import ExamPracticeImport from "./modules/teacher/ExamPracticeImport";
import StudentSurvey from "./modules/survey/StudentSurvey";
import SettingGradeTable from "./modules/teacher/SettingGradeTable";
import CertificateReview from "./modules/student/CertificateReview";
import CertificateDetail from "./modules/student/CertificateDetail";
import ToeicLearningMapPage from "./modules/student/ToeicLearningMapPage";
import ToeicNodePracticePage from "./modules/student/ToeicNodePracticePage";
import ToeicFoundationStudyPage from "./modules/student/ToeicFoundationStudyPage";
import ToeicExamSimulationPage from "./modules/student/ToeicExamSimulationPage";
import ToeicFullLeaderboardPage from "./modules/student/ToeicFullLeaderboardPage";

function App() {
  // Initialize permissions on app startup
  useEffect(() => {
    initializePermissions();

    // Sync permissions when user logs in
    const handleAuthLogin = () => {
      initializePermissions();
    };

    window.addEventListener("auth:login", handleAuthLogin);

    return () => {
      window.removeEventListener("auth:login", handleAuthLogin);
    };
  }, []);

  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <Router>
        {/* Session timeout warning removed - feature deleted */}
        <Routes>
          {/* Default route redirect to student landing */}
          <Route path="/" element={<AuthRedirectWrapper><Navigate to="/student/landing" replace /></AuthRedirectWrapper>} />

          {/* Student routes */}
          <Route path="/student/landing" element={<StudentLandingV2 />} />
          <Route path="/student/landing-v2" element={<StudentLandingV2 />} />


          {/* Auth routes (used by updated components) */}
          <Route path="/auth/login" element={<AuthRedirectWrapper><AuthStudentLogin /></AuthRedirectWrapper>} />
          <Route path="/auth/register" element={<AuthRedirectWrapper><AuthStudentRegister /></AuthRedirectWrapper>} />

          <Route path="/auth/otp-verification" element={<AuthRedirectWrapper><AuthStudentOTPVerification /></AuthRedirectWrapper>} />
          <Route path="/auth/forgot-password" element={<AuthRedirectWrapper><AuthForgotPassword /></AuthRedirectWrapper>} />
          <Route path="/auth/reset-password" element={<AuthRedirectWrapper><AuthResetPassword /></AuthRedirectWrapper>} />
          <Route path="/student" element={<RequireInputSurvey><Outlet /></RequireInputSurvey>}>
            <Route path="course-overview" element={<ProtectedRoute permission="student_course_overview"><StudentCourseOverview /></ProtectedRoute>} />
            <Route path="upload-transcript" element={<ProtectedRoute permission="student_upload_transcript"><UploadTranscript /></ProtectedRoute>} />
            <Route path="instructions" element={<ProtectedRoute permission="student_course_overview"><InstructionsPage /></ProtectedRoute>} />
            <Route path="adjust-parameters" element={<ProtectedRoute permission="student_adjust_parameters"><AdjustParameters /></ProtectedRoute>} />
            <Route path="academic-planning" element={<ProtectedRoute permission="student_academic_planning"><AcademicPlanningDashboard /></ProtectedRoute>} />
            <Route path="course-detail" element={<ProtectedRoute permission="student_course_detail"><CourseDetailView /></ProtectedRoute>} />
            <Route path="financial-survey/step/1" element={<ProtectedRoute permission="student_financial_survey"><FinancialSurveyStep1 /></ProtectedRoute>} />
            <Route path="choose-mascot" element={<ProtectedRoute permission="student_choose_mascot"><ChooseMascot /></ProtectedRoute>} />
            <Route path="learning-adventure" element={<ProtectedRoute permission="student_learning_adventure"><LearningAdventure /></ProtectedRoute>} />
            <Route path="chat-student" element={<ProtectedRoute permission="student_chat_student"><ChatStudent /></ProtectedRoute>} />
            <Route path="learning-space" element={<ProtectedRoute permission="student_learning_space"><LearningSpace /></ProtectedRoute>} />
            <Route path="student-notifications" element={<ProtectedRoute permission="student_notification"><NotificationPage userRole="student" /></ProtectedRoute>} />
            <Route path="profile" element={<ProtectedRoute permission="student_profile"><StudentProfilePage /></ProtectedRoute>} />
            <Route path="survey" element={<ProtectedRoute permission="student_survey"><StudentSurvey /></ProtectedRoute>} />
            <Route path="leaderboard" element={<ProtectedRoute permission="student_course_overview"><ToeicFullLeaderboardPage /></ProtectedRoute>} />
            <Route path="certificate-review" element={<ProtectedRoute permission="student_course_overview"><CertificateReview /></ProtectedRoute>} />
            <Route path="certificate-review/:certId" element={<ProtectedRoute permission="student_course_overview"><CertificateDetail /></ProtectedRoute>} />
            <Route path="certificate-review/toeic/skill/:skillId" element={<ProtectedRoute permission="student_course_overview"><ToeicLearningMapPage /></ProtectedRoute>} />
            <Route path="certificate-review/toeic/skill/:skillId/node/:nodeIndex/practice" element={<ProtectedRoute permission="student_course_overview"><ToeicNodePracticePage /></ProtectedRoute>} />
            <Route path="certificate-review/toeic/foundation/:tab" element={<ProtectedRoute permission="student_course_overview"><ToeicFoundationStudyPage /></ProtectedRoute>} />
            <Route path="certificate-review/toeic/exam/:examType" element={<ProtectedRoute permission="student_course_overview"><ToeicExamSimulationPage /></ProtectedRoute>} />
          </Route>

          {/* Route cho parent */}
          <Route path="/parent/dashboard" element={<ProtectedRoute permission="parent_dashboard"><ParentDashboard /></ProtectedRoute>} />
          <Route path="/parent/book-appointment/step/:stepNumber" element={<ProtectedRoute permission="parent_book_appointment"><BookAppointmentStepWrapper /></ProtectedRoute>} />
          <Route path="/parent/book-appointment" element={<ProtectedRoute permission="parent_book_appointment"><Navigate to="/parent/book-appointment/step/1" replace /></ProtectedRoute>} />
          <Route path="/appointments" element={<ProtectedRoute permission="appointments"><AllAppointments /></ProtectedRoute>} />
          <Route path="/parent/student-details" element={<ProtectedRoute permission="parent_student_details"><StudentDetails /></ProtectedRoute>} />
          <Route path="/parent/chat" element={<ProtectedRoute permission="parent_chat"><ChatWithTeachers /></ProtectedRoute>} />
          <Route path="/parent/notifications" element={<ProtectedRoute permission="parent_dashboard"><NotificationPage userRole="parent" /></ProtectedRoute>} />

          {/* Student notifications - Đường dẫn dạng /student/notifications */}
          <Route path="/student/notifications" element={<ProtectedRoute permission="student_notification"><NotificationPage userRole="student" /></ProtectedRoute>} />

          {/* Admin routes - Dashboard (protected by permission) */}
          <Route path="/admin/dashboard" element={<ProtectedRoute permission="admin_overview"><AdminOverviewDashboard /></ProtectedRoute>} />
          <Route path="/admin/overview" element={<ProtectedRoute permission="admin_overview"><AdminOverviewDashboard /></ProtectedRoute>} />

          {/* Admin routes - Management (protected by permission) */}
          <Route path="/admin/users" element={<ProtectedRoute permission="admin_users"><AccountManagement /></ProtectedRoute>} />
          <Route path="/admin/account-management" element={<ProtectedRoute permission="admin_users"><AccountManagement /></ProtectedRoute>} />
          <Route path="/admin/accounts" element={<ProtectedRoute permission="admin_users"><AccountManagement /></ProtectedRoute>} />
          <Route path="/admin/accounts/add" element={<ProtectedRoute permission="admin_users"><AddAccount /></ProtectedRoute>} />
          <Route path="/admin/accounts/:id" element={<ProtectedRoute permission="admin_users"><AccountDetailPage /></ProtectedRoute>} />
          {/* Teacher sub-routes - needed for TeacherDetailProfile internal navigation */}
          <Route path="/admin/teachers/:teacherId/subjects" element={<ProtectedRoute permission="admin_users"><TeacherSubjects /></ProtectedRoute>} />
          <Route path="/admin/teachers/:teacherId/ratings" element={<ProtectedRoute permission="admin_users"><TeacherRatings /></ProtectedRoute>} />
          <Route path="/admin/teachers/:teacherId/performance" element={<ProtectedRoute permission="admin_users"><TeacherPerformance /></ProtectedRoute>} />
          <Route path="/admin/teachers/:teacherId/schedule" element={<ProtectedRoute permission="admin_users"><TeacherSchedule /></ProtectedRoute>} />
          <Route path="/admin/teachers/:teacherId/support-history" element={<ProtectedRoute permission="admin_users"><TeacherSupportHistory /></ProtectedRoute>} />
          <Route path="/admin/classes" element={<ProtectedRoute permission="admin_classes"><QuestionManagement /></ProtectedRoute>} />
          <Route path="/admin/questions" element={<ProtectedRoute permission="admin_questions"><QuestionManagement /></ProtectedRoute>} />
          <Route path="/admin/questions/add" element={<ProtectedRoute permission="admin_questions_add"><AddQuestion /></ProtectedRoute>} />

          {/* Admin routes - Reports & Analytics (protected by permission) */}
          <Route path="/admin/reports/learning" element={<ProtectedRoute permission="admin_reports"><GeneralStatistics /></ProtectedRoute>} />

          {/* Admin routes - System Management (protected by permission) */}
          <Route path="/admin/notifications" element={<ProtectedRoute permission="admin_notifications"><NotificationManagement /></ProtectedRoute>} />
          <Route path="/admin/my-notifications" element={<ProtectedRoute permission="admin_dashboard"><NotificationPage userRole="admin" /></ProtectedRoute>} />
          <Route path="/admin/permissions" element={<ProtectedRoute permission="admin_permissions"><PermissionManagement /></ProtectedRoute>} />
          <Route path="/admin/role-permissions" element={<ProtectedRoute permission="admin_role_permissions"><RolePermissionManagement /></ProtectedRoute>} />

          {/* Teacher routes */}
          <Route path="/teacher/dashboard" element={<ProtectedRoute permission="teacher_dashboard"><TeacherDashboard /></ProtectedRoute>} />
          <Route path="/teacher/teacher_dashboard" element={<ProtectedRoute permission="teacher_dashboard"><TeacherDashboard /></ProtectedRoute>} />
          <Route path="/teacher/class-management" element={<ProtectedRoute permission="teacher_class_management"><ClassManagement /></ProtectedRoute>} />
          <Route path="/teacher/grade-management" element={<ProtectedRoute permission="teacher_grade_management"><GradeManagement /></ProtectedRoute>} />
          <Route path="/teacher/setting-grade-table" element={<ProtectedRoute permission="teacher_grade_setting"><SettingGradeTable /></ProtectedRoute>} />
          <Route path="/teacher/prediction-view" element={<ProtectedRoute permission="teacher_prediction_view"><PredictionViewV2 /></ProtectedRoute>} />
          <Route path="/teacher/reports-alerts" element={<ProtectedRoute permission="teacher_reports_alerts"><TeacherReport /></ProtectedRoute>} />
          <Route path="/teacher/appointments" element={<ProtectedRoute permission="teacher_appointments"><TeacherAppointmentDashboard /></ProtectedRoute>} />
          <Route path="/teacher/schedule" element={<ProtectedRoute permission="teacher_appointments"><TeacherAppointmentDashboard /></ProtectedRoute>} />
          <Route path="/teacher/confirmed" element={<ProtectedRoute permission="teacher_appointments"><Navigate to="/teacher/appointments" replace /></ProtectedRoute>} />
          <Route path="/teacher/meeting-detail" element={<ProtectedRoute permission="teacher_meeting_demo"><MeetingDetailView /></ProtectedRoute>} />
          <Route path="/teacher/survey-management" element={<ProtectedRoute permission="teacher_dashboard"><StudentSurveyManagement /></ProtectedRoute>} />
          <Route path="/teacher/calendar-overview" element={<ProtectedRoute permission="teacher_appointments"><CalendarOverview /></ProtectedRoute>} />
          <Route path="/teacher/notifications" element={<ProtectedRoute permission="teacher_notification"><NotificationPage userRole="teacher" /></ProtectedRoute>} />
          <Route path="/teacher/toeic-repository-import" element={<ProtectedRoute permission="teacher_dashboard"><ToeicRepositoryImport /></ProtectedRoute>} />
          <Route path="/teacher/toeic-practice-import" element={<ProtectedRoute permission="teacher_dashboard"><ToeicPracticeQuestionImport /></ProtectedRoute>} />
          <Route path="/teacher/exam-practice-import" element={<ProtectedRoute permission="teacher_dashboard"><ExamPracticeImport /></ProtectedRoute>} />

          {/* Booking Scheduler Route */}
          <Route path="/booking/scheduler" element={<ProtectedRoute permission="booking_scheduler"><BookingScheduler /></ProtectedRoute>} />

          {/* Profile Routes */}
          <Route path="/profile" element={<ProfileRedirect />} />
          <Route path="/student/profile" element={<ProtectedRoute permission="student_profile"><RequireInputSurvey><StudentProfilePage /></RequireInputSurvey></ProtectedRoute>} />
          <Route path="/parent/profile" element={<ProtectedRoute permission="parent_profile"><ParentProfilePage /></ProtectedRoute>} />

          {/* Global fallback */}
          <Route path="*" element={<Navigate to="/student/landing" replace />} />

        </Routes>
      </Router>
    </Suspense>
  );
}

export default App;
