import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import BookAppointmentStepWrapper from "@/modules/parent/BookAppointmentStepWrapper";
import AllAppointments from "@/modules/parent/Parent_View_All_Appointments";
import StudentDetails from "@/modules/parent/Parent_StudentDetails";
import AccountManagement from "./modules/admin/AccountManagement";
import AddAccount from "./modules/admin/AddAccount";
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
import StudentLogin from "@/modules/student/StudentLogin";
import StudentOTPVerification from "@/modules/student/StudentOTPVerification";
import StudentRegister from "@/modules/student/StudentRegister";
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
import TeacherChat from "./modules/teacher/TeacherChat";
import ParentDashboardNew from "./modules/parent/ParentDashboardNew";
import ChatWithTeachers from "./modules/parent/ChatWithTeachers";
import LiveLearning from "./modules/student/LiveLearning";
import VideoRoom from "./modules/student/VideoRoom";
import StudyRooms from "./modules/student/StudyRooms";
import MeetingDetailDemo from "@/modules/teacher/MeetingDetailDemo"
import ProtectedRoute from '@/components/ProtectedRoute'

function App() {
  return (
    <Router>
      <Routes>
        {/* Default route redirect to student landing */}
        <Route path="/" element={<Navigate to="/student/landing" replace />} />

        {/* Student routes */}
        <Route path="/student/landing" element={<GradeForecastLanding />} />
  <Route path="/student/login" element={<StudentLogin />} />
  <Route path="/student/register" element={<StudentRegister />} />
  <Route path="/student/otp-verification" element={<StudentOTPVerification />} />

  {/* Auth routes (used by updated components) */}
  <Route path="/auth/login" element={<AuthStudentLogin />} />
  <Route path="/auth/register" element={<AuthStudentRegister />} />
  <Route path="/auth/otp-verification" element={<AuthStudentOTPVerification />} />
        <Route path="/student/course-overview" element={<StudentCourseOverview />} />
        <Route path="/student/upload-transcript" element={<UploadTranscript />} />
        <Route path="/student/instructions" element={<InstructionsPage />} />
        <Route path="/student/adjust-parameters" element={<AdjustParameters />} />
        <Route path="/student/academic-planning" element={<AcademicPlanningDashboard />} />
        <Route path="/student/course-detail" element={<CourseDetailView />} />
        <Route path="/student/financial-survey/step/1" element={<FinancialSurveyStep1 />} />
        <Route path="/student/course-overview" element={<StudentCourseOverview />} />
        <Route path="/student/choose-mascot" element={<ChooseMascot />} />
        <Route path="/student/learning-adventure" element={<LearningAdventure />} />
        <Route path="/student/live-learning" element={<LiveLearning />} />
        <Route path="/student/study-rooms" element={<StudyRooms />} />
        <Route path="/student/video-room" element={<VideoRoom roomData={{
          id: 'demo',
          title: 'Demo Room',
          subtitle: 'Live Session · Demo',
          description: 'Interactive learning session',
          students: '12 participants'
        }} />} />

        {/* Route cho parent */}
        <Route path="/parent/book-appointment/step/:stepNumber" element={<BookAppointmentStepWrapper />} />
        <Route path="/parent/dashboard" element={<ParentDashboardNew />} />
        <Route path="/parent/book-appointment" element={<Navigate to="/parent/book-appointment/step/1" replace />} />
        <Route path="/parent/appointments" element={<AllAppointments />} />
        <Route path="/parent/student-details" element={<StudentDetails />} />
        <Route path="/parent/chat" element={<ChatWithTeachers />} />
  {/* Admin routes - Dashboard (protected) */}
  <Route path="/admin/dashboard" element={<ProtectedRoute permission="admin_overview"><AdminOverviewDashboard /></ProtectedRoute>} />
  <Route path="/admin/overview" element={<ProtectedRoute permission="admin_overview"><AdminOverviewDashboard /></ProtectedRoute>} />

  {/* Admin routes - Management (protected) */}
  <Route path="/admin/users" element={<ProtectedRoute><AccountManagement /></ProtectedRoute>} />
  <Route path="/admin/account-management" element={<ProtectedRoute><AccountManagement /></ProtectedRoute>} />
  <Route path="/admin/accounts/add" element={<ProtectedRoute><AddAccount /></ProtectedRoute>} />
  <Route path="/admin/students" element={<ProtectedRoute><StudentManagementDashboard /></ProtectedRoute>} />
  <Route path="/admin/student-management" element={<ProtectedRoute><StudentManagementDashboard /></ProtectedRoute>} />
  <Route path="/admin/students/list" element={<ProtectedRoute><StudentList /></ProtectedRoute>} />
  <Route path="/admin/students/:studentId" element={<ProtectedRoute><StudentDetail /></ProtectedRoute>} />
  <Route path="/admin/teachers" element={<ProtectedRoute><TeacherManagementDashboard /></ProtectedRoute>} />
  <Route path="/admin/teachers/:teacherId" element={<ProtectedRoute><TeacherDetailProfile /></ProtectedRoute>} />
  <Route path="/admin/teachers/:teacherId/subjects" element={<ProtectedRoute><TeacherSubjects /></ProtectedRoute>} />
  <Route path="/admin/teachers/:teacherId/ratings" element={<ProtectedRoute><TeacherRatings /></ProtectedRoute>} />
  <Route path="/admin/teachers/:teacherId/performance" element={<ProtectedRoute><TeacherPerformance /></ProtectedRoute>} />
  <Route path="/admin/teachers/:teacherId/schedule" element={<ProtectedRoute><TeacherSchedule /></ProtectedRoute>} />
  <Route path="/admin/teachers/:teacherId/support-history" element={<ProtectedRoute><TeacherSupportHistory /></ProtectedRoute>} />
  <Route path="/admin/classes" element={<ProtectedRoute><QuestionManagement /></ProtectedRoute>} />
  <Route path="/admin/questions" element={<ProtectedRoute><QuestionManagement /></ProtectedRoute>} />
  <Route path="/admin/questions/add" element={<ProtectedRoute><AddQuestion /></ProtectedRoute>} />

  {/* Admin routes - Reports & Analytics (protected) */}
  <Route path="/admin/reports/learning" element={<ProtectedRoute><GeneralStatistics /></ProtectedRoute>} />
  <Route path="/admin/analytics/performance" element={<ProtectedRoute><LeadershipReports /></ProtectedRoute>} />
  <Route path="/admin/leadership-reports" element={<ProtectedRoute><LeadershipReports /></ProtectedRoute>} />
  <Route path="/admin/ai-insights" element={<ProtectedRoute><AIPredictionResults /></ProtectedRoute>} />

  {/* Admin routes - System Management (protected) */}
  <Route path="/admin/notifications" element={<ProtectedRoute><NotificationManagement /></ProtectedRoute>} />
  <Route path="/admin/content-approval" element={<ProtectedRoute><ContentApproval /></ProtectedRoute>} />
  <Route path="/admin/permissions" element={<ProtectedRoute><PermissionManagement /></ProtectedRoute>} />
  <Route path="/admin/role-permissions" element={<ProtectedRoute><RolePermissionManagement /></ProtectedRoute>} />

        {/* Teacher routes */}
        <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
        <Route path="/teacher/teacher_dashboard" element={<TeacherDashboard />} />
        <Route path="/teacher/class-management" element={<ClassManagement />} />
        <Route path="/teacher/grade-management" element={<GradeManagement />} />
        <Route path="/teacher/prediction-view" element={<PredictionView />} />
        <Route path="/teacher/progress-tracking" element={<ProgressTracking />} />
        <Route path="/teacher/reports-alerts" element={<TeacherReport />} />
        <Route path="/teacher/messages" element={<MessagesNotifications />} />
        <Route path="/teacher/chat" element={<TeacherChat />} />
        <Route path="/teacher/appointments" element={<TeacherAppointmentDashboard />} />
        <Route path="/teacher/requests" element={<TeacherAppointmentDashboard />} />
        <Route path="/teacher/confirmed" element={<TeacherAppointmentDashboard />} />
        <Route path="/teacher/settings" element={<TeacherDashboard />} />
        <Route path="/teacher/meeting-detail-demo" element={<MeetingDetailDemo />} />
      </Routes>
    </Router>
  );
}

export default App;
