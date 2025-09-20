import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import BookAppointmentStepWrapper from "@/modules/parent/BookAppointmentStepWrapper";
import ParentDashboard from "@/modules/parent/ParentDashboard";
import AllAppointments from "@/modules/parent/Parent_View_All_Appointments";
import StudentDetails from "@/modules/parent/Parent_StudentDetails";
import GradeForecastLanding from "@/modules/student/GradeForecastLanding";
import StudentCourseOverview from "@/modules/student/StudentCourseOverview";
import StudentLogin from "@/modules/student/StudentLogin";
import StudentOTPVerification from "@/modules/student/StudentOTPVerification";
import StudentRegister from "@/modules/student/StudentRegister";
import TeacherDashboard from "@/modules/teacher/TeacherDashboard";
import ClassManagement from "@/modules/teacher/ClassManagement";
import GradeManagement from "@/modules/teacher/GradeManagement";
import ProgressTracking from "@/modules/teacher/ProgressTracking";
import TeacherReport from "@/modules/teacher/TeacherReport";
import UploadTranscript from "./modules/student/UploadTranscript";
import AdjustParameters from "./modules/student/AdjustParameters";
import InstructionsPage from "./modules/student/InstructionsPage";
import AcademicPlanningDashboard from "./modules/student/AcademicPlanningDashboard";
import CourseDetailView from "./modules/student/CourseDetailView";
import FinancialSurveyStep1 from "./modules/student/FinancialSurveyStep1";
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
        {/* add new router */}
        {/* Redirect từ /book-appointment đến step 1 */}
        <Route    
          path="/parent/book-appointment"
          element={<Navigate to="/parent/book-appointment/step/1" replace />}
        />

        {/* Route cho các step cụ thể với URL parameter */}
        <Route
          path="/parent/book-appointment/step/:stepNumber"
          element={<BookAppointmentStepWrapper />}
        />

        {/* Route cho dashboard */}
        <Route path="/parent/dashboard" element={<ParentDashboard />} />

        {/* Route cho all appointments */}
        <Route path="/parent/appointments" element={<AllAppointments />} />

        {/* Route cho student details */}
        <Route path="/parent/student-details" element={<StudentDetails />} />

        {/* Teacher routes */}
        <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
        <Route path="/teacher/teacher_dashboard" element={<TeacherDashboard />} />
        <Route path="/teacher/class-management" element={<ClassManagement />} />
        <Route path="/teacher/grade-management" element={<GradeManagement />} />
        <Route path="/teacher/progress-tracking" element={<ProgressTracking />} />
        <Route path="/teacher/reports-alerts" element={<TeacherReport />} />

      </Routes>
    </Router>
  );
}

export default App
