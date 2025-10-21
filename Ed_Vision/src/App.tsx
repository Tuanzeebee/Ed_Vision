import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import BookAppointmentStepWrapper from "@/modules/parent/BookAppointmentStepWrapper";
import AllAppointments from "@/modules/parent/Parent_View_All_Appointments";
import StudentDetails from "@/modules/parent/Parent_StudentDetails";
import AccountManagement from "./modules/admin/AccountManagement";
import StudentManagementDashboard from "./modules/admin/StudentManagementDashboard";
import AdminOverviewDashboard from "./modules/admin/AdminOverviewDashboard";
import StudentDetail from "./modules/admin/StudentDetail";
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
        {/* Admin routes - Dashboard */}
        <Route path="/admin/dashboard" element={<AdminOverviewDashboard />} />
        <Route path="/admin/overview" element={<AdminOverviewDashboard />} />

        {/* Admin routes - Management */}
        <Route path="/admin/users" element={<AccountManagement />} />
        <Route path="/admin/account-management" element={<AccountManagement />} />
        <Route path="/admin/students" element={<StudentManagementDashboard />} />
        <Route path="/admin/student-management" element={<StudentManagementDashboard />} />
        <Route path="/admin/students/:studentId" element={<StudentDetail />} />
        <Route path="/admin/teachers" element={<TeacherManagementDashboard />} />
        <Route path="/admin/teachers/:teacherId" element={<TeacherDetailProfile />} />
        <Route path="/admin/teachers/:teacherId/subjects" element={<TeacherSubjects />} />
        <Route path="/admin/teachers/:teacherId/ratings" element={<TeacherRatings />} />
        <Route path="/admin/teachers/:teacherId/performance" element={<TeacherPerformance />} />
        <Route path="/admin/teachers/:teacherId/schedule" element={<TeacherSchedule />} />
        <Route path="/admin/teachers/:teacherId/support-history" element={<TeacherSupportHistory />} />
        <Route path="/admin/classes" element={<QuestionManagement />} />
        <Route path="/admin/questions" element={<QuestionManagement />} />
        <Route path="/admin/questions/add" element={<AddQuestion />} />

        {/* Admin routes - Reports & Analytics */}
        <Route path="/admin/reports/learning" element={<GeneralStatistics />} />
        <Route path="/admin/analytics/performance" element={<LeadershipReports />} />
        <Route path="/admin/leadership-reports" element={<LeadershipReports />} />
        <Route path="/admin/ai-insights" element={<AIPredictionResults />} />

        {/* Admin routes - System Management */}
        <Route path="/admin/notifications" element={<NotificationManagement />} />
        <Route path="/admin/content-approval" element={<ContentApproval />} />
        <Route path="/admin/permissions" element={<PermissionManagement />} />
        <Route path="/admin/role-permissions" element={<RolePermissionManagement />} />

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
