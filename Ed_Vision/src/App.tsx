import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, useEffect } from "react";
import { initializePermissions } from "@/services/permissionService";
import BookAppointmentStepWrapper from "@/modules/parent/BookAppointmentStepWrapper";
import AllAppointments from "@/modules/parent/Parent_View_All_Appointments";
import StudentDetails from "./modules/parent/Parent_StudentDetails";
import AccountManagement from "./modules/admin/AccountManagement";
import AddAccount from "./modules/admin/AddAccount";
import AccountDetailPage from "./modules/admin/AccountDetailPage";
import StudentManagementDashboard from "./modules/admin/StudentManagementDashboard";
import AdminOverviewDashboard from "./modules/admin/AdminOverviewDashboard";
import StudentDetail from "./modules/admin/StudentDetail";
import StudentList from "./modules/admin/StudentList";
import TeacherManagementDashboard from "./modules/admin/TeacherManagementDashboard";
import TeacherDetailProfile from "./modules/admin/TeacherDetailProfile";
import TeacherSubjects from "./modules/admin/TeacherSubjects";
import TeacherRatings from "./modules/admin/TeacherRatings";
import TeacherPerformance from "./modules/admin/TeacherPerformance";
import TeacherSchedule from "./modules/admin/TeacherSchedule";
import TeacherSupportHistory from "./modules/admin/TeacherSupportHistory";
import QuestionManagement from "./modules/admin/QuestionManagement";
import AddQuestion from "./modules/admin/AddQuestion";
import GeneralStatistics from "./modules/admin/GeneralStatistics";
import LeadershipReports from "./modules/admin/LeadershipReports";
import AIPredictionResults from "./modules/admin/AIPredictionResults";
import PermissionManagement from "./modules/admin/PermissionManagement";
import RolePermissionManagement from "./modules/admin/RolePermissionManagement";
import ContentApproval from "./modules/admin/ContentApproval";
import NotificationManagement from "./modules/admin/NotificationManagement";

import GradeForecastLanding from "@/modules/student/GradeForecastLanding";
import StudentCourseOverview from "@/modules/student/StudentCourseOverview";

// New auth components (some components navigate to /auth/* so provide routes)
import AuthStudentLogin from "@/modules/auth/StudentLogin";
import AuthStudentRegister from "@/modules/auth/StudentRegister";
import AuthStudentOTPVerification from "@/modules/auth/StudentOTPVerification";
import TeacherDashboard from "@/modules/teacher/TeacherDashboard";
import ClassManagement from "@/modules/teacher/ClassManagement";
import GradeManagement from "@/modules/teacher/GradeManagement";
import PredictionView from "@/modules/teacher/PredictionView";
import ProgressTracking from "@/modules/teacher/ProgressTracking";
import TeacherReport from "@/modules/teacher/TeacherReport";
import UploadTranscript from "./modules/student/UploadTranscript";
import AdjustParameters from "./modules/student/AdjustParameters";
import InstructionsPage from "./modules/student/InstructionsPage";
import AcademicPlanningDashboard from "./modules/student/AcademicPlanningDashboard";
import CourseDetailView from "./modules/student/CourseDetailView";
import FinancialSurveyStep1 from "./modules/student/FinancialSurveyStep1";
import ChooseMascot from "./modules/student/ChooseMascot";
import LearningAdventure from "./modules/student/LearningAdventure";
import TeacherAppointmentDashboard from "./modules/teacher/TeacherAppointmentDashboard";
import MessagesNotifications from "./modules/teacher/MessagesNotifications";
import ChatWithTeachers from "./modules/parent/ChatWithTeachers";
import MeetingDetailDemo from "@/modules/teacher/MeetingDetailDemo"
import ProtectedRoute from '@/components/ProtectedRoute'
import ParentDashboard from "./modules/parent/ParentDashboardNew";
import { StudentSurveyManagement } from "./modules/teacher";
import AuthRedirectWrapper from '@/components/AuthRedirectWrapper'
import ChatStudent from "./modules/student/ChatStudent";
import BookingScheduler from "./modules/booking/BookingScheduler";
import LearningSpace from "./modules/student/LearningSpace";
import "./modules/student/styles/learningSpace.css";

function App() {
        // Initialize permissions on app startup
        useEffect(() => {
                initializePermissions()
        }, [])

        return (
                <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                        <Router>
                                {/* Session timeout warning removed - feature deleted */}
                                <Routes>
                                        {/* Default route redirect to student landing */}
                                        <Route path="/" element={<AuthRedirectWrapper><Navigate to="/student/landing" replace /></AuthRedirectWrapper>} />

                                        {/* Student routes */}
                                        <Route path="/student/landing" element={<GradeForecastLanding />} />


                                        {/* Auth routes (used by updated components) */}
                                        <Route path="/auth/login" element={<AuthRedirectWrapper><AuthStudentLogin /></AuthRedirectWrapper>} />
                                        <Route path="/auth/register" element={<AuthRedirectWrapper><AuthStudentRegister /></AuthRedirectWrapper>} />
                                        <Route path="/auth/otp-verification" element={<AuthRedirectWrapper><AuthStudentOTPVerification /></AuthRedirectWrapper>} />
                                        <Route path="/student/course-overview" element={<ProtectedRoute permission="student_course_overview"><StudentCourseOverview /></ProtectedRoute>} />
                                        <Route path="/student/upload-transcript" element={<ProtectedRoute permission="student_upload_transcript"><UploadTranscript /></ProtectedRoute>} />
                                        <Route path="/student/instructions" element={<ProtectedRoute permission="student_course_overview"><InstructionsPage /></ProtectedRoute>} />
                                        <Route path="/student/adjust-parameters" element={<ProtectedRoute permission="student_adjust_parameters"><AdjustParameters /></ProtectedRoute>} />
                                        <Route path="/student/academic-planning" element={<ProtectedRoute permission="student_academic_planning"><AcademicPlanningDashboard /></ProtectedRoute>} />
                                        <Route path="/student/course-detail" element={<ProtectedRoute permission="student_course_detail"><CourseDetailView /></ProtectedRoute>} />
                                        <Route path="/student/financial-survey/step/1" element={<ProtectedRoute permission="student_financial_survey"><FinancialSurveyStep1 /></ProtectedRoute>} />
                                        <Route path="/student/choose-mascot" element={<ProtectedRoute permission="student_choose_mascot"><ChooseMascot /></ProtectedRoute>} />
                                        <Route path="/student/learning-adventure" element={<ProtectedRoute permission="student_learning_adventure"><LearningAdventure /></ProtectedRoute>} />
                                        <Route path="/student/chat-student" element={<ProtectedRoute permission="student_chat_student"><ChatStudent /></ProtectedRoute>} />
                                        <Route path="/student/learning-space" element={<ProtectedRoute permission="student_learning_space"><LearningSpace /></ProtectedRoute>} />

                                        {/* Route cho parent */}
                                        <Route path="/parent/dashboard" element={<ProtectedRoute permission="parent_dashboard"><ParentDashboard /></ProtectedRoute>} />
                                        <Route path="/parent/book-appointment/step/:stepNumber" element={<ProtectedRoute permission="parent_book_appointment"><BookAppointmentStepWrapper /></ProtectedRoute>} />
                                        <Route path="/parent/book-appointment" element={<ProtectedRoute permission="parent_book_appointment"><Navigate to="/parent/book-appointment/step/1" replace /></ProtectedRoute>} />
                                        <Route path="/parent/appointments" element={<ProtectedRoute permission="parent_appointments"><AllAppointments /></ProtectedRoute>} />
                                        <Route path="/parent/student-details" element={<ProtectedRoute permission="parent_student_details"><StudentDetails /></ProtectedRoute>} />
                                        <Route path="/parent/chat" element={<ProtectedRoute permission="parent_chat"><ChatWithTeachers /></ProtectedRoute>} />
                                        {/* Admin routes - Dashboard (protected by permission) */}
                                        <Route path="/admin/dashboard" element={<ProtectedRoute permission="admin_overview"><AdminOverviewDashboard /></ProtectedRoute>} />
                                        <Route path="/admin/overview" element={<ProtectedRoute permission="admin_overview"><AdminOverviewDashboard /></ProtectedRoute>} />

                                        {/* Admin routes - Management (protected by permission) */}
                                        <Route path="/admin/users" element={<ProtectedRoute permission="admin_users"><AccountManagement /></ProtectedRoute>} />
                                        <Route path="/admin/account-management" element={<ProtectedRoute permission="admin_users"><AccountManagement /></ProtectedRoute>} />
                                        <Route path="/admin/accounts" element={<ProtectedRoute permission="admin_users"><AccountManagement /></ProtectedRoute>} />
                                        <Route path="/admin/accounts/add" element={<ProtectedRoute permission="admin_users"><AddAccount /></ProtectedRoute>} />
                                        <Route path="/admin/accounts/:id" element={<ProtectedRoute permission="admin_users"><AccountDetailPage /></ProtectedRoute>} />
                                        <Route path="/admin/students" element={<ProtectedRoute permission="admin_students"><StudentManagementDashboard /></ProtectedRoute>} />
                                        <Route path="/admin/student-management" element={<ProtectedRoute permission="admin_students"><StudentManagementDashboard /></ProtectedRoute>} />
                                        <Route path="/admin/students/list" element={<ProtectedRoute permission="admin_students"><StudentList /></ProtectedRoute>} />
                                        <Route path="/admin/students/:studentId" element={<ProtectedRoute permission="admin_student_detail"><StudentDetail /></ProtectedRoute>} />
                                        <Route path="/admin/teachers" element={<ProtectedRoute permission="admin_teachers"><TeacherManagementDashboard /></ProtectedRoute>} />
                                        <Route path="/admin/teachers/:teacherId" element={<ProtectedRoute permission="admin_teacher_detail"><TeacherDetailProfile /></ProtectedRoute>} />
                                        <Route path="/admin/teachers/:teacherId/subjects" element={<ProtectedRoute permission="admin_teacher_subjects"><TeacherSubjects /></ProtectedRoute>} />
                                        <Route path="/admin/teachers/:teacherId/ratings" element={<ProtectedRoute permission="admin_teacher_ratings"><TeacherRatings /></ProtectedRoute>} />
                                        <Route path="/admin/teachers/:teacherId/performance" element={<ProtectedRoute permission="admin_teacher_performance"><TeacherPerformance /></ProtectedRoute>} />
                                        <Route path="/admin/teachers/:teacherId/schedule" element={<ProtectedRoute permission="admin_teacher_schedule"><TeacherSchedule /></ProtectedRoute>} />
                                        <Route path="/admin/teachers/:teacherId/support-history" element={<ProtectedRoute permission="admin_teacher_support_history"><TeacherSupportHistory /></ProtectedRoute>} />
                                        <Route path="/admin/classes" element={<ProtectedRoute permission="admin_classes"><QuestionManagement /></ProtectedRoute>} />
                                        <Route path="/admin/questions" element={<ProtectedRoute permission="admin_questions"><QuestionManagement /></ProtectedRoute>} />
                                        <Route path="/admin/questions/add" element={<ProtectedRoute permission="admin_questions_add"><AddQuestion /></ProtectedRoute>} />

                                        {/* Admin routes - Reports & Analytics (protected by permission) */}
                                        <Route path="/admin/reports/learning" element={<ProtectedRoute permission="admin_reports"><GeneralStatistics /></ProtectedRoute>} />
                                        <Route path="/admin/analytics/performance" element={<ProtectedRoute permission="admin_reports"><LeadershipReports /></ProtectedRoute>} />
                                        <Route path="/admin/leadership-reports" element={<ProtectedRoute permission="admin_reports"><LeadershipReports /></ProtectedRoute>} />
                                        <Route path="/admin/ai-insights" element={<ProtectedRoute permission="admin_ai_insights"><AIPredictionResults /></ProtectedRoute>} />

                                        {/* Admin routes - System Management (protected by permission) */}
                                        <Route path="/admin/notifications" element={<ProtectedRoute permission="admin_notifications"><NotificationManagement /></ProtectedRoute>} />
                                        <Route path="/admin/content-approval" element={<ProtectedRoute permission="admin_content_approval"><ContentApproval /></ProtectedRoute>} />
                                        <Route path="/admin/permissions" element={<ProtectedRoute permission="admin_permissions"><PermissionManagement /></ProtectedRoute>} />
                                        <Route path="/admin/role-permissions" element={<ProtectedRoute permission="admin_role_permissions"><RolePermissionManagement /></ProtectedRoute>} />

                                        {/* Teacher routes */}
                                        <Route path="/teacher/dashboard" element={<ProtectedRoute permission="teacher_dashboard"><TeacherDashboard /></ProtectedRoute>} />
                                        <Route path="/teacher/teacher_dashboard" element={<ProtectedRoute permission="teacher_dashboard"><TeacherDashboard /></ProtectedRoute>} />
                                        <Route path="/teacher/class-management" element={<ProtectedRoute permission="teacher_class_management"><ClassManagement /></ProtectedRoute>} />
                                        <Route path="/teacher/grade-management" element={<ProtectedRoute permission="teacher_grade_management"><GradeManagement /></ProtectedRoute>} />
                                        <Route path="/teacher/prediction-view" element={<ProtectedRoute permission="teacher_prediction_view"><PredictionView /></ProtectedRoute>} />
                                        <Route path="/teacher/progress-tracking" element={<ProtectedRoute permission="teacher_progress_tracking"><ProgressTracking /></ProtectedRoute>} />
                                        <Route path="/teacher/reports-alerts" element={<ProtectedRoute permission="teacher_reports_alerts"><TeacherReport /></ProtectedRoute>} />
                                        <Route path="/teacher/messages" element={<ProtectedRoute permission="teacher_messages"><MessagesNotifications /></ProtectedRoute>} />
                                        <Route path="/teacher/appointments" element={<ProtectedRoute permission="teacher_appointments"><TeacherAppointmentDashboard /></ProtectedRoute>} />
                                        <Route path="/teacher/requests" element={<ProtectedRoute permission="teacher_appointments"><TeacherAppointmentDashboard /></ProtectedRoute>} />
                                        <Route path="/teacher/confirmed" element={<ProtectedRoute permission="teacher_appointments"><TeacherAppointmentDashboard /></ProtectedRoute>} />
                                        <Route path="/teacher/settings" element={<ProtectedRoute permission="teacher_settings"><TeacherDashboard /></ProtectedRoute>} />
                                        <Route path="/teacher/meeting-detail-demo" element={<ProtectedRoute permission="teacher_meeting_demo"><MeetingDetailDemo /></ProtectedRoute>} />
                                        <Route path="/teacher/survey-management" element={<ProtectedRoute permission="teacher_dashboard"><StudentSurveyManagement /></ProtectedRoute>} />
                                        {/* legacy teacher/profile route removed; use /profile centralized entry */}
                                        
                                        {/* Booking Scheduler Route */}
                                        <Route path="/booking/scheduler" element={<ProtectedRoute permission="booking_scheduler"><BookingScheduler /></ProtectedRoute>} />
                                </Routes>
                        </Router>
                </Suspense>
        );
}

export default App;
